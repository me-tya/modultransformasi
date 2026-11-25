'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createBackupHandler}=require('./backup-api.cjs');
function response(){return {headersSent:false,writeHead(status,headers){this.status=status;this.headers=headers;this.headersSent=true},end(body){this.body=JSON.parse(body)},destroy(){this.destroyed=true}}}
const user={role:'SA',aktif:true};
const snapshot={complete:true,sourceId:'test-db',attachmentsComplete:true,collections:{users:[{id:'1',data:{name:'Example',pw:'redacted',nested:{password:'redacted'}}}],files:[],wbs:[{id:'2',data:{name:'WBS'}}]}};
const run=async({who=user,source=snapshot,url='/api/v1/backup?attachments=1',method='GET',fail=false}={})=>{
 const res=response();let reads=0;const handler=createBackupHandler({authenticate:async()=>who,readSnapshot:async()=>{reads++;if(fail)throw Error('offline');return source},logger:{error(){}}});await handler({method,url},res);return {res,reads};
};
test('requires verified active superadmin before reading database',async()=>{for(const who of [null,{role:'PMOK',aktif:true},{role:'SA',aktif:false}]){const {res,reads}=await run({who});assert.ok([401,403].includes(res.status));assert.equal(reads,0)}});
test('authoritative snapshot, counts and secret redaction',async()=>{const {res}=await run();assert.equal(res.status,200);assert.equal(res.body.source.mode,'internal-api');assert.equal(res.body.counts.wbs,1);assert.deepEqual(res.body.collections.users[0].data,{name:'Example',nested:{}});assert.equal(res.headers['Cache-Control'],'no-store')});
test('omit files only by explicit request',async()=>{const {res}=await run({url:'/api/v1/backup?attachments=0'});assert.equal(res.status,200);assert.equal(res.body.includesAttachments,false);assert.equal(res.body.collections.files,undefined)});
test('reject incomplete, unavailable, or duplicate snapshots',async()=>{for(const source of [{...snapshot,complete:false},{...snapshot,attachmentsComplete:false},{...snapshot,collections:{wbs:[{id:'a',data:{}},{id:'a',data:{}}]}}]){const {res}=await run({source});assert.equal(res.status,503);assert.equal(res.body.collections,undefined)}assert.equal((await run({fail:true})).res.status,503)});
test('reject unsupported method and malformed options',async()=>{assert.equal((await run({method:'POST'})).res.status,405);assert.equal((await run({url:'/api/v1/backup?attachments=2'})).res.status,400)});
