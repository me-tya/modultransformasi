/* Simulasi putaran sinkron dengan Firestore Dashboard CM tiruan (tanpa jaringan). */
const test=require('node:test');const assert=require('node:assert');const fs=require('fs');const vm=require('vm');
function setup(dcmRows,mtRows){
 const store=new Map(dcmRows.map(a=>[a.id,{v:JSON.stringify(a),updatedAt:a.updatedAt}]));const files=new Map();const writes=[];
 const coll=name=>({doc:id=>({set:async d=>{writes.push([name,id]);(name==='cmActivities'?store:files).set(id,d)},delete:async()=>{writes.push([name,id,'del']);store.delete(id)},get:async()=>({exists:files.has(id),data:()=>files.get(id)})})});
 const ctx={console,setTimeout:(f)=>0,clearTimeout(){},Map,Set,JSON,Math,Date,Promise,Object,Array,String,Number,
  localStorage:{getItem:k=>k==='mt_dcm_sync_on'?'1':null,setItem(){},removeItem(){}},document:{readyState:'complete',querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}},
  FB:{on:true,ready:true},ME:{role:'SA',email:'b@kemenkeu.go.id'},actCanEdit:()=>true,S:{oneonone:mtRows,cfg:{}},saved:0,toast(){},esc:s=>s,modal(){},fileLoad:async()=>null,fileStore:async()=>({}),fetch:async()=>({blob:async()=>null})};
 ctx.window=ctx;ctx.firebase={apps:[]};ctx.save=function(){ctx.saved++};ctx.render=function(){};vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(__dirname+'/../mt-dcm-activity-sync.js','utf8'),ctx);
 const M=ctx.MTDCM;M.st.user={email:'b@kemenkeu.go.id'};M.st.db={collection:coll};M.st.loaded=true;
 const load=()=>{M.st.dcm.clear();store.forEach((d,id)=>M.st.dcm.set(id,JSON.parse(d.v)))};load();
 return {ctx,M,store,writes,load,mt:()=>ctx.S.oneonone};
}
const ag=(id,o={})=>Object.assign({id,no:1,namaKegiatan:'Kegiatan '+id,tglMulai:'2026-11-17',tglSelesai:'2026-11-17',jamMulai:'09:00',jamSelesai:'10:00',kategori:'FGD',layanan:'Yes',unitPemohon:'DJP',picTimCM:'Bella',status:'',updatedAt:'2026-11-10T00:00:00Z'},o);

test('putaran pertama: aktivitas DCM masuk ke MT, aktivitas MT baru masuk ke DCM',async()=>{
 const T=setup([ag('A1'),ag('A2')],[{id:'m1',keAkt:true,kat:'FGD',nama:'Dibuat di MT',tgl:'2026-11-20',jam:'13:00 - 14:00',pic:['Bella'],layanan:'Ya'}]);
 await T.M.run();assert.strictEqual(T.M.st.err,'');
 assert.strictEqual(T.mt().filter(x=>x.cmDashboardId).length,3);assert.ok(T.store.has('MT-m1'));assert.strictEqual(JSON.parse(T.store.get('MT-m1').v).namaKegiatan,'Dibuat di MT');
 T.writes.length=0;T.load();await T.M.run();assert.strictEqual(T.writes.length,0,'putaran kedua tidak menulis apa-apa (tidak berulang)')});

test('ubah di DCM → MT ikut; ubah di MT → DCM ikut',async()=>{
 const T=setup([ag('A1')],[]);await T.M.run();
 T.store.set('A1',{v:JSON.stringify(ag('A1',{namaKegiatan:'Judul baru DCM',updatedAt:'2026-11-12T00:00:00Z'}))});T.load();await T.M.run();
 assert.strictEqual(T.mt()[0].nama,'Judul baru DCM');
 T.mt()[0].tl='Tindak lanjut dari MT';T.writes.length=0;await T.M.run();
 assert.strictEqual(JSON.parse(T.store.get('A1').v).tindakLanjut,'Tindak lanjut dari MT');assert.strictEqual(T.writes.length,1)});

test('hapus di DCM → terhapus di MT; hapus di MT → terhapus di DCM',async()=>{
 const T=setup([ag('A1'),ag('A2')],[]);await T.M.run();
 T.store.delete('A1');T.load();await T.M.run();assert.ok(!T.mt().some(x=>x.cmDashboardId==='A1'));
 T.ctx.S.oneonone=T.mt().filter(x=>x.cmDashboardId!=='A2');T.ctx.S.cfg.dcmTomb=['A2'];await T.M.run();
 assert.ok(!T.store.has('A2'));assert.ok(!T.ctx.S.cfg.dcmTomb,'tombstone dibersihkan')});

test('pengaman: penghapusan massal dijeda sampai dikonfirmasi',async()=>{
 const rows=Array.from({length:8},(_,i)=>ag('B'+i));const T=setup(rows,[]);await T.M.run();assert.strictEqual(T.mt().length,8);
 T.store.clear();T.load();await T.M.run();assert.strictEqual(T.mt().length,8,'tidak dihapus');assert.ok(/dijeda/.test(T.M.st.err));
 T.M.st.okDel=true;await T.M.run();assert.strictEqual(T.mt().length,0)});

test('aktivitas MT yang diedit sementara DCM menghapusnya dibuat ulang di DCM',async()=>{
 const T=setup([ag('A1')],[]);await T.M.run();T.mt()[0].catatan='Masih dipakai';T.store.delete('A1');T.load();await T.M.run();
 assert.ok(T.store.has('A1'))});
