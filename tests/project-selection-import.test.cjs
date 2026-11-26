'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const src=readFileSync('project-selection-program-import.js','utf8');
const aoa=JSON.parse(readFileSync('tests/fixtures-import-charter-is.json','utf8'));
function boot(role='SA',unit='BaTii',programs=[]){
 const S={ui:{psSelectedYear:2027},programs};
 const noop=()=>{};
 const ctx=vm.createContext({S,TextEncoder,fsClean:x=>x,stab:x=>JSON.stringify(x,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((o,p)=>(o[p]=v[p],o),{}):v),ME:{role,unit,email:'t@kemenkeu.go.id'},save:noop,render:noop,toast:noop,
  document:{addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[]},window:{}});
 ctx.window.MT_PS_SCOPE={normalizeProjectCodes:p=>p.psProjects.forEach((x,i)=>{x.psCode='X-'+(i+1)})};
 vm.runInContext(src,ctx);return {S,I:ctx.window.MT_PS_IMPORT};
}
test('Konversi Tabulasi Charter IS terbaca: 9 program, 20 proyek, tanpa galat',()=>{
 const {I}=boot(),pl=I.plan(aoa);
 assert.equal(pl.errors.length,0);assert.equal(pl.warn.length,0);
 assert.equal(pl.items.length,9);
 assert.ok(pl.items.every(x=>x.action==='Baru'));
 assert.equal(pl.items.reduce((n,x)=>n+x.projects.length,0),20);
});
test('Terapkan: program Draft + charter + proyek terbentuk',()=>{
 const {S,I}=boot(),pl=I.plan(aoa),r=I.apply(pl,{file:'x.xlsx'});
 assert.equal(r.created,9);assert.equal(r.projects,20);
 const p=S.programs.find(p=>p.nama==='Rebranding Kemenkeu Terpercaya');
 assert.equal(p.psYear,2027);assert.equal(p.psStatus,'Draft');assert.equal(p.uic,'Setjen');
 assert.equal(p.psProjects.length,6);assert.equal(p.sponsor,'Menteri Keuangan');
 const c=p.psProgramCharter;
 assert.equal(c.st,'Draft');assert.equal(c.p1,2027);assert.equal(c.p2,2029);
 assert.ok(c.ms.length>=10&&c.ms.every(m=>m.y&&m.t));
 assert.ok(c.kp.length>=6&&c.kp.every(k=>k.m&&Array.isArray(k.k)));
 assert.ok(c.lb.length&&!c.lb[0].startsWith('•'));
 assert.equal(p.psImport.sourceIS,'2.1, 2.2, 2.3, 2.4, 2.5, 2.6');
});
test('Impor ulang memperbarui, tidak menggandakan; charter disahkan tidak ditimpa',()=>{
 const {S,I}=boot();I.apply(I.plan(aoa));
 const p=S.programs[0];p.psProgramCharter.st='Disahkan';p.psProgramCharter.tujuan='TETAP';
 const pl=I.plan(aoa);assert.ok(pl.items.every(x=>x.action==='Perbarui'));
 I.apply(pl);assert.equal(S.programs.length,9);
 assert.equal(p.psProgramCharter.tujuan,'TETAP');
 assert.equal(S.programs.reduce((n,x)=>n+x.psProjects.length,0),20);
});
test('Program ditetapkan dilewati; PMO Unit dibatasi unitnya',()=>{
 let m=boot('SA','BaTii',[{id:'a',nama:'HRIS Terintegrasi Hire-to-Retire',psYear:2027,psStatus:'Ditetapkan',psProjects:[]}]);
 assert.equal(m.I.plan(aoa).items.find(x=>x.src.nama.startsWith('HRIS')).action,'Dilewati');
 m=boot('PMOU','BaTii');const pl=m.I.plan(aoa);
 assert.equal(pl.items.filter(x=>x.action==='Baru').length,4);
 assert.ok(pl.items.filter(x=>x.action==='Galat').every(x=>x.src.uic!=='BaTii'));
});
test('Sheet Program hilang / kolom wajib hilang memberi galat',()=>{
 const {I}=boot();
 assert.ok(I.plan({Lain:[['a']]}).errors.length);
 assert.ok(I.plan({Program:[['Nama Program','Tahun'],['x','2027']]}).errors[0].includes('uic'));
});
test('Proyek terpetakan lengkap ke form Pemetaan Proyek',()=>{
 const {S,I}=boot();I.apply(I.plan(aoa));
 const p=S.programs.find(p=>p.nama==='Human Capital Development');
 const x=p.psProjects.find(z=>z.psSourceIS==='2.9');
 assert.equal(x.psAcronym,'PKPYK');assert.equal(x.uic,'Setjen');assert.equal(x.status,'Usulan');
 assert.ok(x.urgency.length>20&&x.features.startsWith('•')&&x.strategyAlignment.includes('2b. SDM'));
 assert.ok(x.description&&x.outputs&&x.accepted);
});
test('Sheet Proyek saja menambah proyek ke program yang sudah ada',()=>{
 const prog={id:'x',akr:'ICS',kode:'B27-ICS',nama:'Integrated Core System APBN',psYear:2027,psStatus:'Draft',uic:'BaTii',psProjects:[{id:'o',name:'Modul Lama',uic:'BaTii'}]};
 const {S,I}=boot('SA','BaTii',[prog]);
 const H=['Tahun','Nama Program','Nama Proyek','Akronim','Kategori','UIC Utama','Rencana Mulai','Target Go-Live','Status Usulan'];
 const pl=I.plan({Proyek:[H,['2027','Integrated Core System APBN','Modul Baru','MBARU','Core APBN','BaTii','2027-02-01','15/11/2027','Usulan'],
  ['2027','Integrated Core System APBN','Modul Lama','','Kategori Aneh','BaTii','','',''],
  ['2027','Program Tak Ada','Z','','','BaTii','','','']]});
 assert.equal(pl.errors.length,0);
 const it=pl.items[0];assert.equal(it.action,'Proyek');
 assert.equal(it.projects[0].action,'Baru');assert.equal(it.projects[0].goLive,'2027-11-15');
 assert.equal(it.projects[1].action,'Galat');assert.equal(pl.warn.length,1);
 I.apply(pl);assert.equal(prog.psProjects.length,2);
 const z=prog.psProjects.find(z=>z.name==='Modul Baru');
 assert.equal(z.psAcronym,'MBARU');assert.equal(z.category,'Core APBN');assert.equal(z.start,'2027-02-01');
});
test('Parser tanggal',()=>{
 const {I}=boot();
 assert.equal(I.dateOf('2027-3-1'),'2027-03-01');assert.equal(I.dateOf('Mar 2027'),'2027-03-01');
 assert.equal(I.dateOf('46752'),'2027-12-31');assert.equal(I.dateOf('abc'),null);assert.equal(I.dateOf(''),'');
});
test('Jenis Program tidak baku tidak menggagalkan impor',()=>{
 const {S,I}=boot();const A=JSON.parse(JSON.stringify(aoa));const h=A.Program[0].indexOf('Jenis Program');
 A.Program[1][h]='Program Tematik';A.Program[2][h]='Inisiatif Strategis';A.Program[3][h]='Kode Resmi ISTK';
 const pl=I.plan(A);assert.ok(pl.items.every(x=>x.action==='Baru'));I.apply(pl);
 assert.equal(S.programs[0].jenis,'Tematik');assert.equal(S.programs[1].jenis,'Lainnya');assert.equal(S.programs[1].psJenisSumber,'Inisiatif Strategis');
});

test('Staging leaves live programs unchanged; transaction is atomic and idempotent',async()=>{
 const {S,I}=boot();const stage=I.stageImport(I.plan(aoa),{file:'x.xlsx'});
 assert.equal(S.programs.length,0);assert.equal(stage.docs.length,9);
 const store=new Map(), writes=[];
 const db={collection:name=>{assert.equal(name,'programs');return {doc:id=>id}},runTransaction:async fn=>{
  const pending=[];await fn({get:async id=>({exists:store.has(id),data:()=>store.get(id)}),set:(id,data)=>pending.push([id,data])});
  for(const [id,data] of pending){store.set(id,data);writes.push(id)}
 }};
 await I.commitStage(stage,db);assert.equal(store.size,9);assert.equal(writes.length,9);
 await I.commitStage(stage,db);assert.equal(writes.length,9);assert.equal(S.programs.length,0);
 const old=stage.docs[0];store.set(old.id,{...store.get(old.id),nama:'perubahan bersamaan'});
 await assert.rejects(I.commitStage(stage,db),/Konflik data server/);assert.equal(writes.length,9);
});
test('Existing program import stages copies, retains unrelated programs and protects failed write',async()=>{
 const {S,I}=boot();I.apply(I.plan(aoa));S.programs.push({id:'unrelated',nama:'Program lain',psYear:2027});
 const before=JSON.stringify(S.programs);
 const stage=I.stageImport(I.plan(aoa),{file:'new.xlsx'});
 assert.equal(JSON.stringify(S.programs),before);assert.equal(stage.docs.length,9);
 assert.ok(stage.docs.every(d=>d.id!=='unrelated'&&d.before&&d.after.psImport.file===undefined));
 const db={collection:()=>({doc:id=>id}),runTransaction:async()=>{throw Error('permission-denied')}};
 await assert.rejects(I.commitStage(stage,db),/permission-denied/);
 assert.equal(JSON.stringify(S.programs),before);
});
test('Oversized staged document rejected before any Firestore operation',async()=>{
 const {I}=boot();const stage=I.stageImport(I.plan(aoa));
 stage.docs[0].after.psProgramCharter.tujuan='x'.repeat(960000);
 await assert.rejects(I.commitStage(stage,{collection:()=>{throw Error('must not reach db')}}),/terlalu besar/);
});

test('Master proyek tahap 2: enam atribut baru, nol valid, kosong tidak menimpa, skor SMART tetap',()=>{
 const x={id:'p1',name:'Modul X',uic:'BaTii',scores:{C1:5},estimatedCost:900};
 const p={id:'pr1',nama:'Program X',psYear:2027,psStatus:'Draft',uic:'BaTii',psProjects:[x]};
 const {I}=boot('SA','BaTii',[p]);
 const h=['Tahun','Nama Program','Nama Proyek','UIC Utama','Jenis Inisiatif','Unit Pemilik Proses Bisnis','Domain Arsitektur SPBE','Estimasi Biaya (Rp)','Estimasi Durasi (bulan)','Kebutuhan SDM (orang)'];
 const make=(cost,dur,staff)=>({Proyek:[h,[2027,'Program X','Modul X','BaTii','Pengembangan','Unit A','Aplikasi',cost,dur,staff]]});
 let pl=I.plan(make(0,'2,5',4));assert.equal(pl.items[0].projects[0].problem,'');I.apply(pl);
 assert.equal(x.estimatedCost,0);assert.equal(x.durationMonths,2.5);assert.equal(x.estimatedStaff,4);assert.equal(x.businessOwner,'Unit A');assert.equal(x.spbeDomain,'Aplikasi');assert.equal(x.initiativeType,'Pengembangan');assert.equal(x.scores.C1,5);
 I.apply(I.plan(make('','','')));assert.equal(x.estimatedCost,0);assert.equal(x.estimatedStaff,4);
 pl=I.plan(make(-1,0,1.5));assert.equal(pl.items[0].projects[0].action,'Galat');I.apply(pl);assert.equal(x.estimatedStaff,4);assert.equal(p.psProjects.length,1);
});
