'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const sources=['project-selection-flow.js','project-selection-governance.js','project-selection-workflow-2027.js','project-selection-scope-map.js','project-selection-documents.js','project-selection-program-bank.js'];
const source=Object.fromEntries(sources.map(x=>[x,readFileSync(x,'utf8')]));
const index=readFileSync('index.html','utf8');
function boot(){
 const core={id:'src-core',akr:'CORE',kode:'B25-CORE',nama:'Integrated Core System APBN',mulai:2025,periode:'2025–2029',uic:'BaTii',sponsor:'Kepala BaTii',status:'Berjalan'};
 const target={id:'tgt-non',akr:'NON',kode:'B27-NON',nama:'Digitalisasi Core Non APBN',psYear:2027,psDraft:true,psStatus:'Draft',uic:'BaTii',sponsor:'Kepala BaTii',psGovernanceV:1,psProjects:[],psWbsDraft:[],psBenefits:[],psStakeholders:[],psRiskRegister:[]};
 const rows=[
  {id:'CORE-11',k:'CORE-11',prog:'CORE',p:['CORE','Digitalisasi','Pengembangan Integrated Core System APBN Kemenkeu','FRSW','Implementasi'],s:'2026-01-01',f:'2026-10-30',u:'BaTii',w:3,v:1,rm:4095,arsip:false},
  {id:'CORE-12',k:'CORE-12',prog:'CORE',p:['CORE','Digitalisasi','Pengembangan Integrated Core System APBN Kemenkeu','SIPK','Pelatihan'],s:'2026-03-01',f:'2026-11-22',u:'BaTii',w:2,v:1,rm:4095,arsip:false}
 ];
 const S={ui:{tahun:2027},programs:[core,target],wbs:rows,bukti:{'CORE-11':{link:'BA sumber'}},charters:[{id:'ch-core',prog:'CORE',ver:1,st:'Disahkan',p1:2026,p2:2026,kpY:2026,judul:'Charter 2026',tujuan:'Integrasi APBN',lb:['Data terfragmentasi'],oc:['Terintegrasi'],log:[{st:'Disahkan'}]}]};
 const logs=[],noop=()=>{};
 const doc={head:{appendChild:noop},body:{appendChild:noop},querySelector:()=>null,createElement:()=>({click:noop,remove:noop})};
 const context={S,ME:{role:'SA',unit:'BaTii',email:'test@kemenkeu.go.id'},VIEW:'beranda',document:doc,location:{hash:''},UNITS:['BaTii','Setjen','DJA'],
  save:noop,render:noop,toast:x=>logs.push(x),progProjects:()=>[],vh:(_i,_k,name)=>'<h1>'+name+'</h1>',
  esc:x=>String(x??''),window:{confirm:()=>true,render:noop}};
 const ctx=vm.createContext(context);
 sources.forEach(path=>vm.runInContext(source[path],ctx,{filename:path}));
 return {S,logs,ctx,core,target,app:ctx.window.MT_PROJECT_SELECTION,scope:ctx.window.MT_PS_SCOPE,bank:ctx.window.MT_PS_BANK_CORE,docs:ctx.window.MT_PS_DOC};
}
test('Assets are loaded in correct order and compile as valid JavaScript',()=>{
 const order=sources.map(x=>index.indexOf('<script src="'+x));
 order.forEach(x=>assert.ok(x>0));
 assert.deepEqual(order,order.slice().sort((a,b)=>a-b));
 assert.match(index,/project-selection-program-bank\.css/);
 for(const x of sources)assert.doesNotThrow(()=>new vm.Script(source[x]),x);
});
test('Bank across all years shows requested columns and no Program yang dikerjakan selector',()=>{
 const m=boot(),html=m.app.page();
 assert.match(html,/Daftar Program/);
 assert.match(html,/Nama Program Baru/);
 assert.match(html,/Kode Program/);
 assert.match(html,/Jumlah Proyek \(Modul\)/);
 assert.match(html,/Tahun/);
 assert.match(html,/Legacy/);
 assert.doesNotMatch(html,/Program yang dikerjakan/);
 assert.ok(m.bank.records().some(x=>x.year===2026&&x.p.akr==='CORE'));
 assert.ok(m.bank.records().some(x=>x.year===2027&&x.p.akr==='NON'));
});
test('Detail Program workspace contains eight tabs including inline document builder',()=>{
 const m=boot();m.S.ui.psBank={tab:'detail',workspace:m.target.id,wtab:'docs'};
 const html=m.app.page();
 assert.match(html,/Detail Program/);
 assert.match(html,/Workspace Program/);
 assert.match(html,/Buat Dokumen/);
 assert.match(html,/Pratinjau Word/);
 assert.match(html,/Substansi dokumen/);
 assert.match(html,/Word \(\.docx\)/);
 assert.match(html,/PDF \(\.pdf\)/);
 assert.match(html,/PowerPoint \(\.pptx\)/);
 assert.match(m.docs.paper(m.core,'identity',2026),/Integrasi APBN/);
});
test('Adding program from 2026 copies charter and WBS plans, then navigates to Pemetaan Proyek',()=>{
 const m=boot();
 m.S.ui.psBank={tab:'bank',names:{'src-core:2026':'Digitalisasi Core APBN Baru'},check:[],wtab:'identity'};
 const added=m.bank.addOne('src-core:2026',false);
 assert.ok(added);
 assert.equal(added.nama,'Digitalisasi Core APBN Baru');
 assert.equal(added.psYear,2027);
 assert.equal(added.psStatus,'Draft');
 assert.equal(added.psProjects.length,2);
 assert.equal(added.psWbsDraft.length,2);
 assert.equal(added.psWbsDraft[0].rm,0);
 assert.equal(added.psWbsDraft[0].v,0);
 assert.ok(m.S.charters.some(c=>c.prog===added.akr&&c.st==='Draft'));
 assert.equal(m.S.ui.psFlow.tab,'mapping');
 assert.equal(m.S.wbs.length,2,'source WBS should remain the only active WBS before Penetapan');
});
test('Cross-program mapping allows FRSW and SIPK from Core APBN 2026 into Core Non APBN 2027',()=>{
 const m=boot();
 const found=m.scope.modules(m.core,2026).map(x=>x.name);
 assert.ok(found.includes('FRSW'));
 assert.ok(found.includes('SIPK'));
 m.scope.bank().target=m.target.id;
 m.scope.bank().map={year:2026,program:m.core.id,q:'',selected:[m.core.id+'::FRSW',m.core.id+'::SIPK']};
 assert.match(m.scope.render(),/FRSW/);
 assert.match(m.scope.render(),/SIPK/);
 m.scope.transfer();
 assert.deepEqual(m.target.psProjects.map(x=>x.name).sort(),['FRSW','SIPK']);
 assert.equal(m.target.psWbsDraft.length,2);
 assert.ok(m.target.psWbsDraft.every(w=>w.v===0&&w.rm===0&&w.prog===m.target.akr));
 assert.ok(m.target.psWbsDraft.every(w=>String(w.f).startsWith('2027-')));
 assert.equal(m.S.wbs.length,2,'must not copy WBS as active before Penetapan');
 assert.equal(m.S.wbs[0].v,1,'must not mutate actual source progress');
 assert.equal(m.S.bukti['CORE-11'].link,'BA sumber');
});
test('After Penetapan WBS draft syncs once, source untouched',()=>{
 const m=boot();m.scope.bank().target=m.target.id;
 m.scope.bank().map={year:2026,program:m.core.id,q:'',selected:[m.core.id+'::FRSW']};m.scope.transfer();
 m.target.psStatus='Ditetapkan';m.target.psDraft=false;m.target.psSelectedProjectIds=m.target.psProjects.map(x=>x.id);
 const n=m.ctx.window.MT_PS_WORKFLOW.syncWbs(m.target);
 assert.equal(n,1);assert.equal(m.ctx.window.MT_PS_WORKFLOW.syncWbs(m.target),0);
 assert.equal(m.S.wbs.length,3);
 assert.equal(m.S.wbs.filter(w=>w.prog==='CORE').length,2);
 assert.equal(m.S.wbs.find(w=>w.prog==='NON').rm,0);
});
test('PPTX and PDF have differentiated previews, while section selector controls document content',()=>{
 const m=boot(),d=m.docs;
 m.S.ui.psBank={doc:{format:'pptx',sections:['identity','case'],cover:true,toc:true,annex:false,sign:false,slide:1}};
 assert.match(d.builder(m.target),/Pratinjau PowerPoint/);
 assert.match(d.builder(m.target),/Slide 2 \/ 2/);
 assert.equal(d.sections(m.target).length,2);
 m.S.ui.psBank.doc.format='pdf';
 assert.match(d.builder(m.target),/Pratinjau PDF/);
 assert.match(source['project-selection-documents.js'],/JSZip/);
 assert.match(source['project-selection-documents.js'],/PptxGenJS/);
 assert.match(source['project-selection-documents.js'],/jspdf/);
});
