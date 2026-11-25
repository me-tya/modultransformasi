using System.Data;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var b=WebApplication.CreateBuilder(args);
var cs=b.Configuration.GetConnectionString("MT")??throw new Exception("Missing connection string");
var root=Path.GetFullPath(b.Configuration["StorageRoot"]??throw new Exception("Missing StorageRoot"));
var web=Path.GetFullPath(b.Environment.WebRootPath??Path.Combine(b.Environment.ContentRootPath,"wwwroot"));
if(root.StartsWith(web+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase)||root.Equals(web,StringComparison.OrdinalIgnoreCase))throw new Exception("Storage must be outside wwwroot");
var store=new Store(cs,root);
var hasher=new PasswordHasher<string>();
if(args.Length>0&&args[0]=="set-password"){
 if(args.Length!=2)throw new Exception("Usage: set-password email");
 var email=args[1].Trim().ToLowerInvariant();
 if(!Regex.IsMatch(email,@"^[^@\s]+@kemenkeu\.go\.id$"))throw new Exception("Invalid email");
 Console.Write("Password (min 12 characters; input hidden): ");
 var pw=new System.Text.StringBuilder();for(;;){var k=Console.ReadKey(true);if(k.Key==ConsoleKey.Enter)break;if(k.Key==ConsoleKey.Backspace){if(pw.Length>0)pw.Length--;}else if(!char.IsControl(k.KeyChar))pw.Append(k.KeyChar);}
 Console.WriteLine();if(pw.Length<12)throw new Exception("Password too short");
 await store.SetPassword(email,hasher.HashPassword(email,pw.ToString()));return;
}
b.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(o=>{
 o.Cookie.Name="MT.Session";o.Cookie.HttpOnly=true;o.Cookie.SameSite=SameSiteMode.Strict;o.Cookie.SecurePolicy=CookieSecurePolicy.Always;
 o.ExpireTimeSpan=TimeSpan.FromHours(8);o.SlidingExpiration=false;
 o.Events.OnRedirectToLogin=c=>{c.Response.StatusCode=401;return Task.CompletedTask;};
 o.Events.OnRedirectToAccessDenied=c=>{c.Response.StatusCode=403;return Task.CompletedTask;};
});
b.Services.AddAuthorization();
b.Services.AddRateLimiter(o=>{o.RejectionStatusCode=429;o.AddPolicy("login",ctx=>RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString()??"unknown",_=>new FixedWindowRateLimiterOptions{PermitLimit=10,Window=TimeSpan.FromMinutes(5),QueueLimit=0}));});
var app=b.Build();
app.Use(async(ctx,next)=>{
 ctx.Response.Headers["X-Content-Type-Options"]="nosniff";
 ctx.Response.Headers["Referrer-Policy"]="no-referrer";
 ctx.Response.Headers["Content-Security-Policy"]="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' data: blob:; worker-src 'self' blob:; frame-src 'self' blob: data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'";
 if(ctx.Request.Path.StartsWithSegments("/api")){
  ctx.Response.Headers.CacheControl="no-store";
  if(!HttpMethods.IsGet(ctx.Request.Method)&&ctx.Request.Headers["X-MT-Request"]!="1"){ctx.Response.StatusCode=403;return;}
 }
 await next();
});
app.UseDefaultFiles();app.UseStaticFiles();app.UseAuthentication();app.UseAuthorization();app.UseRateLimiter();
async Task<JsonObject?> Current(HttpContext c){
 var email=c.User.FindFirstValue(ClaimTypes.NameIdentifier);
 if(email==null)return null;
 var d=await store.Get("users",email);
 return d?.Body["aktif"]?.GetValue<bool>()==true?d.Body:null;
}
app.MapGet("/api/session",async(HttpContext c)=>{var u=await Current(c);return u==null?Results.Unauthorized():Results.Json(new{email=c.User.FindFirstValue(ClaimTypes.NameIdentifier)});});
app.MapPost("/api/login",async(HttpContext c,Login l)=>{
 var email=l.Email.Trim().ToLowerInvariant();var u=await store.Get("users",email);var hash=await store.Password(email);
 if(u?.Body["aktif"]?.GetValue<bool>()!=true||hash==null||hasher.VerifyHashedPassword(email,hash,l.Password)==PasswordVerificationResult.Failed)return Results.Unauthorized();
 await c.SignInAsync(new ClaimsPrincipal(new ClaimsIdentity(new[]{new Claim(ClaimTypes.NameIdentifier,email)},CookieAuthenticationDefaults.AuthenticationScheme)));
 return Results.Json(new{email});
}).RequireRateLimiting("login");
app.MapPost("/api/logout",async(HttpContext c)=>{await c.SignOutAsync();return Results.Ok();});
app.MapPost("/api/password",async(HttpContext c,PasswordChange p)=>{
 var u=await Current(c);if(u==null)return Results.Unauthorized();var email=c.User.FindFirstValue(ClaimTypes.NameIdentifier)!;
 if(p.Password.Length<12||p.Password.Length>256)return Results.BadRequest();
 var hash=await store.Password(email);if(hash==null||hasher.VerifyHashedPassword(email,hash,p.OldPassword)==PasswordVerificationResult.Failed)return Results.Unauthorized();
 await store.SetPassword(email,hasher.HashPassword(email,p.Password));await c.SignOutAsync();return Results.Ok();
});
app.MapGet("/api/docs/{col}",async(HttpContext c,string col)=>{
 var u=await Current(c);if(u==null)return Results.Unauthorized();if(!Rules.Collections.Contains(col))return Results.NotFound();
 var rows=await store.List(col);return Results.Json(rows.Where(x=>Rules.Read(u,col,x.Id,x.Body)));
});
app.MapPost("/api/batch",async(HttpContext c,Op[] ops)=>{
 var u=await Current(c);if(u==null)return Results.Unauthorized();if(ops.Length<1||ops.Length>400)return Results.BadRequest();
 try{await store.Batch(u,ops);return Results.Ok();}catch(UnauthorizedAccessException){return Results.StatusCode(403);}catch(DBConcurrencyException){return Results.Conflict(new{error="Data sudah berubah. Muat ulang sebelum menyimpan."});}catch(ArgumentException){return Results.BadRequest();}
});
app.MapGet("/api/files/{id}",async(HttpContext c,string id)=>{
 var u=await Current(c);if(u==null)return Results.Unauthorized();if(!Store.ValidFile(id))return Results.BadRequest();
 var f=await store.Get("files",id);if(f==null)return Results.NotFound();return Results.Json(f);
});
app.MapGet("/api/v1/backup",async(HttpContext c)=>{
 var u=await Current(c);if(u==null)return Results.Unauthorized();if(Rules.Role(u)!="SA")return Results.StatusCode(403);
 var attachments=c.Request.Query["attachments"]!="0";
 var data=await store.Snapshot(attachments);
 return Results.Json(new{kind="mt-full-backup",version=1,exportedAt=DateTimeOffset.UtcNow,source=new{mode="internal-api",databaseId="ModulTransformasi"},includesAttachments=attachments,counts=data.ToDictionary(k=>k.Key,v=>v.Value.Length),collections=data.ToDictionary(k=>k.Key,v=>v.Value.Select(x=>new{id=x.Id,data=x.Body}))});
});
app.Run();
record Login(string Email,string Password);
record PasswordChange(string OldPassword,string Password);
record Doc(string Id,JsonObject Body,string Version);
record Op(string Kind,string Col,string Id,JsonObject? Data,string? Version);
static class Rules{
 public static readonly HashSet<string> Collections=new("users programs charters tahap oneonone projectRisks projectStakeholders projectDecisions wbs kwide risks crs usul sub ind sh jj pantau adopsi tr reviu log bukti ms impl jjMod modMeta kwideLinks config files".Split(' '));
 static string S(JsonObject? d,string k)=>d?[k]?.ToString()??"";
 public static string Role(JsonObject d)=>S(d,"role");
 static bool In(string r,string roles)=>roles.Split(' ').Contains(r);
 static bool Modules(JsonObject u,JsonObject? d,string k)=>u["modules"] is JsonArray a&&d?[k] is JsonArray z&&a.Any(x=>z.Any(y=>x?.ToString()==y?.ToString()));
 static bool Own(JsonObject u,JsonObject? d)=>In(Role(u),"PMOU CMOU")&&S(d,"ownGrp")=="unit"&&S(u,"unit")==S(d,"ownUnit")||Role(u)=="TIM"&&S(d,"ownGrp")=="tim"&&Modules(u,d,"ownMods");
 public static bool Read(JsonObject u,string c,string id,JsonObject d)=>c!="oneonone"||In(Role(u),"SA PMOK CMOK KETUA KAPUS SEKPIM")||id=="pub-tim"||Own(u,d)||Role(u)=="TIM"&&Modules(u,d,"modKeys");
 public static bool Write(JsonObject u,string c,string id,JsonObject? old,JsonObject? next){
  var r=Role(u);if(r=="SA")return true;
  if(c=="users"||c=="config")return false;
  if(c=="oneonone")return In(r,"PMOK CMOK")||r=="SEKPIM"&&id=="cfg-agpim"&&next!=null||(old==null||Own(u,old))&&(next==null||Own(u,next));
  if(c=="log")return old==null&&next!=null;
  if(c=="files")return In(r,"PMOK CMOK PMOU CMOU TIM")&& (old==null||S(old,"by")==S(u,"email"))&&(next==null||S(next,"by")==S(u,"email"));
  if("programs charters tahap projectRisks projectStakeholders projectDecisions wbs bukti ms kwide kwideLinks risks crs".Split(' ').Contains(c))return In(r,"PMOK CMOK PMOU");
  if(c=="sh")return In(r,"PMOK CMOK PMOU CMOU TIM");if(c=="usul")return In(r,"PMOK CMOK PMOU CMOU");
  return "sub ind impl jj jjMod pantau adopsi tr reviu modMeta".Split(' ').Contains(c)&&In(r,"PMOK CMOK CMOU TIM");
 }
}
class Store(string cs,string root){
 static readonly SemaphoreSlim Gate=new(1,1);
 public static bool ValidFile(string id)=>Regex.IsMatch(id,@"^[a-zA-Z0-9_-]{1,160}$");
 static JsonObject Parse(string s)=>JsonNode.Parse(s)!.AsObject();
 static string Ver(byte[] b)=>Convert.ToBase64String(b);
 async Task<SqlConnection> Open(){var c=new SqlConnection(cs);await c.OpenAsync();return c;}
 static SqlCommand Cmd(SqlConnection c,SqlTransaction? t,string q,params(string,object)[] ps){var cmd=new SqlCommand(q,c,t);foreach(var (k,v) in ps)cmd.Parameters.AddWithValue(k,v);return cmd;}
 async Task<Doc?> Find(SqlConnection c,SqlTransaction? t,string col,string id){
  using var q=Cmd(c,t,"SELECT Body,Version FROM dbo.Documents WHERE Collection=@c AND Id=@i",("@c",col),("@i",id));
  using var r=await q.ExecuteReaderAsync();if(!await r.ReadAsync())return null;
  var body=Parse(r.GetString(0));var ver=Ver((byte[])r[1]);await r.CloseAsync();
  if(col=="files"){var name=body["_disk"]?.ToString()??throw new IOException("Missing file reference");if(!ValidFile(name))throw new IOException("Invalid storage reference");body.Remove("_disk");body["d"]=Convert.ToBase64String(await File.ReadAllBytesAsync(Path.Combine(root,name)));}
  return new(id,body,ver);
 }
 public async Task<Doc?> Get(string col,string id){using var c=await Open();return await Find(c,null,col,id);}
 async Task<Doc[]> Rows(SqlConnection c,SqlTransaction? t,string col){
  using var q=Cmd(c,t,"SELECT Id FROM dbo.Documents WHERE Collection=@c ORDER BY Id",("@c",col));using var r=await q.ExecuteReaderAsync();var ids=new List<string>();while(await r.ReadAsync())ids.Add(r.GetString(0));await r.CloseAsync();
  var list=new List<Doc>();foreach(var id in ids){var d=await Find(c,t,col,id);if(d!=null)list.Add(d);}return list.ToArray();
 }
 public async Task<Doc[]> List(string col){using var c=await Open();return await Rows(c,null,col);}
 public async Task<string?> Password(string email){using var c=await Open();using var q=Cmd(c,null,"SELECT PasswordHash FROM dbo.Credentials WHERE Email=@e",("@e",email));return (string?)await q.ExecuteScalarAsync();}
 public async Task SetPassword(string email,string hash){using var c=await Open();using var q=Cmd(c,null,"IF EXISTS(SELECT 1 FROM dbo.Documents WHERE Collection='users' AND Id=@e) BEGIN UPDATE dbo.Credentials SET PasswordHash=@h WHERE Email=@e; IF @@ROWCOUNT=0 INSERT dbo.Credentials(Email,PasswordHash) VALUES(@e,@h); END ELSE THROW 50001,'User not registered',1;",("@e",email),("@h",hash));await q.ExecuteNonQueryAsync();}
 public async Task Batch(JsonObject u,Op[] ops){
  await Gate.WaitAsync();try{using var c=await Open();using var t=c.BeginTransaction(IsolationLevel.Serializable);Directory.CreateDirectory(root);
   foreach(var o in ops){
    if(!Rules.Collections.Contains(o.Col)||o.Id.Length is <1 or >350||o.Kind!="set"&&o.Kind!="del"||o.Kind=="set"&&o.Data==null)throw new ArgumentException();
    var old=await Find(c,t,o.Col,o.Id);var next=o.Kind=="set"?o.Data:null;
    if(!Rules.Write(u,o.Col,o.Id,old?.Body,next))throw new UnauthorizedAccessException();
    if(old?.Version!=o.Version)throw new DBConcurrencyException();
    if(next==null){using var del=Cmd(c,t,"DELETE dbo.Documents WHERE Collection=@c AND Id=@i",("@c",o.Col),("@i",o.Id));await del.ExecuteNonQueryAsync();continue;}
    var d=next.DeepClone().AsObject();if(o.Col=="users"){d.Remove("pw");d.Remove("password");d.Remove("passwordHash");if(d["email"]?.ToString()?.ToLowerInvariant()!=o.Id)throw new ArgumentException();}
    if(o.Col=="files"){if(!ValidFile(o.Id)||d["d"]==null)throw new ArgumentException();var bytes=Convert.FromBase64String(d["d"]!.ToString());if(bytes.Length>2_000_000)throw new ArgumentException();var name=Guid.NewGuid().ToString("N");await File.WriteAllBytesAsync(Path.Combine(root,name),bytes);d.Remove("d");d["_disk"]=name;}
    using var q=Cmd(c,t,"UPDATE dbo.Documents SET Body=@b WHERE Collection=@c AND Id=@i; IF @@ROWCOUNT=0 INSERT dbo.Documents(Collection,Id,Body) VALUES(@c,@i,@b);",("@c",o.Col),("@i",o.Id),("@b",d.ToJsonString()));await q.ExecuteNonQueryAsync();
   }t.Commit();
  }finally{Gate.Release();}
 }
 public async Task<Dictionary<string,Doc[]>> Snapshot(bool files){
  await Gate.WaitAsync();try{using var c=await Open();using var t=c.BeginTransaction(IsolationLevel.Serializable);var result=new Dictionary<string,Doc[]>();foreach(var col in Rules.Collections){if(col=="files"&&!files)continue;result[col]=await Rows(c,t,col);}t.Commit();return result;}finally{Gate.Release();}
 }
}
