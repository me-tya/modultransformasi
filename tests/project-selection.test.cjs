'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const html=readFileSync('index.html','utf8');
const source=readFileSync('project-selection-flow.js','utf8');
const css=readFileSync('project-selection-flow.css','utf8');
const dashboard=readFileSync('dashboard-cm-shared.html','utf8');
function boot(y=2027,programs=[],exposeWord=false){
 const S={ui:{tahun:y},programs,wbs:[]},messages=[];
 const noop=()=>{};
 const document={head:{appendChild:noop},body:{appendChild:noop},querySelector:()=>null,createElement:()=>({remove:noop,click:noop})};
 const context={S,ME:{role:'SA',unit:'BaTii',email:'test@kemenkeu.go.id'},VIEW:'beranda',
  document,window:{},location:{hash:''},UNITS:['BaTii','Setjen','DJA'],save:noop,render:noop,
  progProjects:()=>[],toast:m=>messages.push(m),
  esc:v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  vh:(_icon,_type,title)=>'<div class="vh"><h1>'+title+'</h1></div>'};
 vm.runInNewContext(exposeWord?source.replace(/\n\}\)\(\);\s*$/, '\nwindow.__testWord=word;window.__testCalc=calc;window.__testFinalize=finalize;window.__testChosen=chosen;\n})();'):source,context,{filename:'project-selection-flow.js'});
 return {S,context,messages,app:context.window.MT_PROJECT_SELECTION};
}
const program=()=>({id:'program-2027',akr:'PS2027-DOA',kode:'B27-DOA',nama:'Digitalisasi Office Automation',psYear:2027,psDraft:true,psStatus:'Draft',
 jenis:'Berkelanjutan',uic:'BaTii',psProjects:[],psThreshold:80,psWeights:{},psPrioritize:false});
const project=(name='Modul Kinerja')=>({id:'p1',name,uic:'Setjen',status:'Usulan',included:true,
 scores:{},poster:{},risks:{},indicators:[],benefits:[]});
const maxScores=()=>Object.fromEntries(Array.from({length:12},(_,i)=>{
 const code='C'+(i+1);return [code,code==='C7'||code==='C12'?1:5];
}));
test('Loads native program-first flow; Dashboard CM auth/iframe is NOT imported',()=>{
 assert.match(html,/project-selection-flow\.js\?v=/);
 assert.match(html,/project-selection-flow\.css\?v=/);
 assert.doesNotMatch(html,/<script src="project-selection-ui\.js/);
 assert.doesNotMatch(html,/<script src="project-selection-native\.js/);
 assert.doesNotMatch(source,/cmGoogleSignIn|cmLoginGate|dashboard-cm-shared\.html|<iframe/);
 assert.doesNotThrow(()=>new vm.Script(source));
});
test('2027 starts empty, not inherited from OA 2025-2028; manually created program shows',()=>{
 const legacy={id:'old',akr:'OA',kode:'B25-OA',nama:'Digitalisasi Office Automation lama',mulai:2025,periode:'2025-2028',uic:'BaTii'};
 const m=boot(2027,[legacy]);
 assert.match(m.app.page(),/Belum ada Program Transformasi untuk Tahun 2027/);
 assert.match(m.app.page(),/Tambah Program Transformasi 2027/);
 m.S.programs.push(program());
 const page=m.app.page();
 assert.match(page,/Digitalisasi Office Automation/);
 assert.match(page,/Belum ada proyek sesuai filter/);
});
test('Four Priority tabs render the right content, with PMO visual tab selection',()=>{
 const p=program();p.psProjects=[project()];
 const m=boot(2027,[p]);
 for(const [tab,pattern] of [['projects',/Peringkat prioritas/],['criteria',/Komposisi bobot/],['monev',/Monev Indikator & Manfaat|Indikator Keberhasilan CM/],['reference',/Tabel 1 · Kriteria dan Bobot/]]){
  m.S.ui.psFlow={tab,prog:p.id,q:'',filter:'all',sort:'score',view:'list'};
  assert.match(m.app.page(),pattern,'Failed tab '+tab);
 }
 assert.match(css,/\.pswf-tabs>button/);
 assert.match(css,/font-size:13px!important/);
 assert.match(css,/min-height:40px!important/);
 assert.match(css,/button\.on:after/);
 assert.match(css,/background:#FDB913/);
});
test('Manual selection without SMART; SMART selection requires complete score >80',()=>{
 const p=program(),x=project();p.psProjects=[x];const m=boot(2027,[p]);
 assert.match(m.app.page(),/1 dari 1 calon proyek dipilih secara manual/);
 p.psPrioritize=true;
 assert.match(m.app.page(),/0 dari 1 calon proyek memenuhi ambang/);
 x.scores=maxScores();
 assert.match(m.app.page(),/>100\.0<\/b>/);
 assert.match(m.app.page(),/1 dari 1 calon proyek memenuhi ambang/);
 p.psThreshold=99;
 assert.match(m.app.page(),/1 dari 1 calon proyek memenuhi ambang/);
 x.scores.C1=1;
 assert.match(m.app.page(),/0 dari 1 calon proyek memenuhi ambang/);
});
test('Original SMART 12 criteria, weights sum 55 and full reference rubrics',()=>{
 const names=[...source.matchAll(/code:'C(\d+)'[\s\S]*?w:(\d+)/g)];
 assert.equal(names.length,12);
 assert.deepEqual(names.map(m=>+m[1]),Array.from({length:12},(_,i)=>i+1));
 assert.equal(names.reduce((n,m)=>n+(+m[2]),0),55);
 assert.match(source,/Keselarasan Strategis/);
 assert.match(source,/Tingkat Perubahan \(POSTER\)/);
 assert.match(source,/Skala Dampak \(Jumlah Pengguna\)/);
 assert.match(dashboard,/function renderPriority\(\)/);
});
test('Finalization handoff shows only selected IDs before WBS and preserves WBS existing',()=>{
 assert.match(html,/p\.psStatus==='Ditetapkan'/);
 assert.match(html,/new Set\(p\.psSelectedProjectIds\|\|\[\]\)/);
 assert.match(html,/psPendingWbs:true/);
 assert.match(html,/p\.psDraft/);
 const p=program(),x=project();p.psProjects=[x];p.psStatus='Ditetapkan';p.psDraft=false;p.psSelectedProjectIds=[x.id];
 const m=boot(2027,[p]);
 assert.match(m.app.page(),/Generate RKMK Word/);
 assert.match(m.app.page(),/Lanjut ke WBS/);
});
test('RKMK generates genuine OOXML DOCX with KMK 132 charter, acceptance and plan',async()=>{
 const p=program(),x=project();x.scores=maxScores();x.accepted='BA penerimaan disetujui';
 p.psProjects=[x];p.psStatus='Ditetapkan';p.psDraft=false;p.psSelectedProjectIds=[x.id];
 const m=boot(2027,[p],true);let z;
 class FakeZip{constructor(){z=this;this.files={}}file(k,v){this.files[k]=v}async generateAsync(){return {file:'blob'}}}
 m.context.window.JSZip=FakeZip;m.context.JSZip=FakeZip;
 m.context.URL={createObjectURL:()=> 'blob:doc',revokeObjectURL:()=>{}};
 m.context.setTimeout=()=>{};
 m.context.document.createElement=()=>({click(){},remove(){},set href(v){},set download(v){}});
 m.context.document.body.appendChild=()=>{};
 await m.context.window.__testWord(p,false);
 assert.ok(z.files['[Content_Types].xml']);
 assert.ok(z.files['_rels/.rels']);
 const doc=z.files['word/document.xml'];
 assert.match(doc,/RANCANGAN RKMK PROGRAM/);
 assert.match(doc,/CHARTER INISIATIF/);
 assert.match(doc,/KRITERIA PENYELESAIAN/);
 assert.match(doc,/RENCANA KERJA/);
 assert.match(doc,/Modul Kinerja/);
 assert.match(doc,/BA penerimaan disetujui/);
});

test('Ten DOA project modules: three above 80 pass, only those are finalized pre-WBS',()=>{
 const p=program();p.psPrioritize=true;p.psThreshold=80;
 p.psProjects=Array.from({length:10},(_,i)=>({...project(['Modul Kinerja','Modul Kompetensi','Modul Kesehatan','Modul Pelayanan','Modul Rekrutmen','Modul Pendidikan','Modul Keuangan','Modul Umum','Modul Arsip','Modul Pelaporan'][i]),id:'p'+i,scores:i<3?maxScores():{C1:3}}));
 const m=boot(2027,[p],true);m.context.window.confirm=()=>true;
 assert.equal(m.context.window.__testChosen(p).length,3);
 m.context.window.__testFinalize(p);
 assert.equal(p.psStatus,'Ditetapkan');
 assert.equal(p.psDraft,false);
 assert.deepEqual(Array.from(p.psSelectedProjectIds),['p0','p1','p2']);
 assert.equal(p.psProjects.length,10,'The seven non-selected candidates must be preserved for audit/revision');
 assert.match(m.app.page(),/3 dari 10 calon proyek memenuhi ambang/);
});
test('Thematic C8 calculates staff reduction when valid input is available',()=>{
 const p=program();p.jenis='Tematik';
 const x=project();x.scores=maxScores();delete x.scores.C8;x.sdmAwal='100';x.sdmTarget='40';
 const m=boot(2027,[p],true);
 const r=m.context.window.__testCalc(x,p);
 assert.equal(r.done,12);
 assert.equal(r.details.find(d=>d.c.code==='C8').v,5);
});
test('WBS project-list handoff has prefill and native PMO access checks',()=>{
 assert.match(html,/function psWbsSelectionPanel\(p\)/);
 assert.match(html,/ACT\.psWbsStart=el=>/);
 assert.match(html,/formModal\('wbs',null\)/);
 assert.match(html,/p\.psSelectedProjectIds/);
 assert.match(html,/canW\('wbs','C',x\.uic\|\|p\.uic\)/);
});
