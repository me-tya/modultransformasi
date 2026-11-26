const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {webcrypto}=require('node:crypto');
const workerSource=readFileSync('cloudflare/mt-assistant.js','utf8');
const fields={tujuan:['Meningkatkan kepercayaan 10%'],lb:['Proses belum terintegrasi'],tb:['Integrasi kanal'],out:['Layanan terpadu'],oc:['5.000 pegawai'],ris:['Keterlambatan'],pk:['Dukungan pimpinan'],ms:['2028 | Integrasi layanan']};
const env={FIREBASE_PROJECT_ID:'demo-mt',GROQ_API_KEY:'fake-key',TEST_TOKEN:'fake-test'};
const origin='https://me-tya.github.io',url='https://mt-assistant.example/summarize';
const b64=x=>Buffer.from(x).toString('base64url');
test('Worker auth, data validation, Groq response and error paths',async()=>{
 const w=(await import('data:text/javascript;base64,'+Buffer.from(workerSource).toString('base64'))).default;
 const pair=await webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk=await webcrypto.subtle.exportKey('jwk',pair.publicKey);jwk.kid='test-key';
 const now=Math.floor(Date.now()/1000),header=b64(JSON.stringify({alg:'RS256',kid:jwk.kid})),payload=b64(JSON.stringify({aud:'demo-mt',iss:'https://securetoken.google.com/demo-mt',sub:'test-user',email:'test@kemenkeu.go.id',email_verified:true,iat:now,auth_time:now,exp:now+300}));
 const sig=await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,Buffer.from(header+'.'+payload));
 const token=header+'.'+payload+'.'+b64(sig);let calls=0,role='SA',output=fields,groqStatus=200;
 const old=global.fetch;
 global.fetch=async(u,init)=>{
  const s=String(u);
  if(s.includes('/jwk/'))return Response.json({keys:[jwk]});
  if(s.includes('firestore.googleapis.com')){assert.equal(init.headers.Authorization,'Bearer '+token);return Response.json({fields:{aktif:{booleanValue:true},role:{stringValue:role}}})}
  if(s.includes('api.groq.com')){calls++;assert.equal(init.headers.Authorization,'Bearer fake-key');const req=JSON.parse(init.body);assert.equal(req.model,'openai/gpt-oss-120b');if(groqStatus!==200)return Response.json({error:{code:'rate_limit'}},{status:groqStatus,headers:{'Retry-After':'30'}});return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(output)}}],usage:{total_tokens:100}})}
  throw Error('Unexpected fetch '+s);
 };
 try{
  const post=(t=token,o=origin,input={max:6,fields,title:'Dummy'})=>new Request(url,{method:'POST',headers:{Origin:o,Authorization:'Bearer '+t,'Content-Type':'application/json'},body:JSON.stringify(input)});
  let r=await w.fetch(new Request(url,{method:'OPTIONS',headers:{Origin:origin}}),env);assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);
  r=await w.fetch(post(token,'https://other.example'),env);assert.equal(r.status,403);
  r=await w.fetch(post('invalid'),env);assert.equal(r.status,401);
  r=await w.fetch(post(token),{...env,FIREBASE_PROJECT_ID:''});assert.equal(r.status,503);assert.equal(calls,0);
  role='TIM';r=await w.fetch(post(),env);assert.equal(r.status,403);assert.equal(calls,0);role='SA';
  r=await w.fetch(post(token,origin,{max:99,fields}),env);assert.equal(r.status,400);assert.equal(calls,0);
  r=await w.fetch(post(),env);assert.equal(r.status,200);assert.deepEqual((await r.json()).summary,fields);assert.equal(calls,1);
  output={...fields,tujuan:['Meningkatkan kepercayaan 25%']};r=await w.fetch(post(),env);assert.equal(r.status,502);assert.equal((await r.json()).code,'NEW_NUMERIC_VALUE');
  output={...fields,ms:['2029 | Integrasi layanan']};r=await w.fetch(post(),env);assert.equal(r.status,502);
  output=fields;groqStatus=429;r=await w.fetch(post(),env);assert.equal(r.status,429);assert.equal(r.headers.get('Retry-After'),'30');
  r=await w.fetch(new Request('https://mt-assistant.example/test',{method:'POST'}),env);assert.equal(r.status,401);
 }finally{global.fetch=old}
});
test('Existing dialog preserves explicit save and original source',()=>{
 const src=readFileSync('charter-export.js','utf8');
 assert.match(src,/data-sum-ai/);
 assert.match(src,/window\.confirm\('Isian asli Charter akan dikirim/);
 assert.match(src,/draft\[k\]\.join/);
 assert.match(src,/P\.psCharterSum=o/);
 assert.match(src,/if\(max\(\)!==cap/);
 assert.doesNotMatch(src,/GROQ_API_KEY|TEST_TOKEN/);
});
