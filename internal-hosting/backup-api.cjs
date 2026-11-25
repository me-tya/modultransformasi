'use strict';
// Database-neutral, server-side backup endpoint. No Firebase dependency.
// Mount GET /api/v1/backup using the internal application's verified session.
function createBackupHandler({authenticate,readSnapshot,logger=console}){
 if(typeof authenticate!=='function'||typeof readSnapshot!=='function')throw new TypeError('Verified auth and database adapter required');
 return async function backup(req,res){
  const headers={'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Pragma':'no-cache'};
  const send=(status,body,extra={})=>{res.writeHead(status,{...headers,...extra});res.end(JSON.stringify(body))};
  try{
   if(req.method!=='GET')return send(405,{error:'Method not allowed'},{Allow:'GET'});
   const user=await authenticate(req);
   if(!user)return send(401,{error:'Authentication required'});
   if(user.role!=='SA'||user.aktif!==true)return send(403,{error:'Active superadmin required'});
   const url=new URL(req.url,'http://internal.invalid');
   const raw=url.searchParams.get('attachments');
   if(raw!==null&&raw!=='0'&&raw!=='1')return send(400,{error:'Invalid attachments option'});
   const includeAttachments=raw!=='0';
   // Provider MUST use the authoritative database, consistent snapshot, and complete scope.
   const snapshot=await readSnapshot({includeAttachments,user});
   if(!snapshot||snapshot.complete!==true||typeof snapshot.sourceId!=='string'||!snapshot.sourceId||!snapshot.collections||Array.isArray(snapshot.collections))throw Error('Incomplete authoritative snapshot');
   const collections=Object.create(null),counts=Object.create(null);
   const secret=/^(pw|password|passwordhash|password_hash|accesstoken|access_token|refreshtoken|refresh_token|secret|sessiontoken|session_token)$/i;
   const redact=(v)=>Array.isArray(v)?v.map(redact):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!secret.test(k)).map(([k,x])=>[k,redact(x)])):v;
   for(const [name,docs] of Object.entries(snapshot.collections)){
    if(!Array.isArray(docs))throw Error('Invalid collection');
    if(!includeAttachments&&name==='files')continue;
    const ids=new Set();
    collections[name]=docs.map(d=>{
     if(!d||typeof d.id!=='string'||!d.id||ids.has(d.id)||!d.data||typeof d.data!=='object'||Array.isArray(d.data))throw Error('Invalid or duplicate record');
     ids.add(d.id);return {id:d.id,data:redact(d.data)};
    });
    counts[name]=docs.length;
   }
   if(!Object.keys(collections).length)throw Error('Empty collection manifest');
   if(includeAttachments&&(!Object.hasOwn(collections,'files')||snapshot.attachmentsComplete!==true))throw Error('Attachment export is incomplete');
   const exportedAt=new Date().toISOString();
   const payload={kind:'mt-full-backup',version:1,exportedAt,source:{mode:'internal-api',databaseId:snapshot.sourceId},includesAttachments:includeAttachments,counts,collections};
   // Serialize before sending; never intentionally return a partial successful backup.
   const body=JSON.stringify(payload);
   const file='MT_Backup_All_'+exportedAt.replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')+'.json';
   res.writeHead(200,{...headers,'Content-Disposition':'attachment; filename="'+file+'"'});
   res.end(body);
  }catch(e){logger.error('MT backup failed',e?.name||'Error');if(!res.headersSent)send(503,{error:'Authoritative backup unavailable; no partial file returned'});else res.destroy();}
 };
}
module.exports={createBackupHandler};
