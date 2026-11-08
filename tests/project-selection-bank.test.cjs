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
 assert.match(html,/data-bank-checkall/);
  assert.match(html,/data-bank-check=/);
  assert.match(html,/data-bank-add=/);
 assert.match(html,/Kode Program/);
 assert.match(html,/Jumlah Modul/);
 assert.match(html,/Tahun/);
 assert.match(html,/Legacy/);
 assert.doesNotMatch(html,/Program yang dikerjakan/);
 assert.ok(m.bank.records().some(x=>x.year===2026&&x.p.akr==='CORE'));
 assert.ok(m.bank.records().some(x=>x.year===2027&&x.p.akr==='NON'));
});
test('Detail Program removes duplicate workspace and exposes inline versioned document builder',()=>{
 const m=boot();m.S.ui.psBank={tab:'detail',wtab:'docs'};
 const html=m.app.page();
 assert.match(html,/Detail Program/);
 assert.match(html,/data-bank-detailrow/);
 assert.match(html,/Buat Dokumen Portofolio/);
 assert.doesNotMatch(html,/Workspace Program/);
 assert.doesNotMatch(html,/data-bank-new.*Daftar Program/);
 const p=m.docs.builder(m.target);
 assert.match(p,/Pratinjau Word/);
 assert.match(p,/Substansi dokumen/);
 assert.match(p,/data-doc-format-btn="word"/);
 assert.match(p,/data-doc-format-btn="pdf"/);
 assert.match(p,/data-doc-format-btn="pptx"/);
 assert.match(p,/Riwayat Dokumen/);
 assert.match(m.docs.paper(m.core,'identity',2026),/Integrasi APBN/);
});
test('Carry-over copies registers and charter but requires fresh WBS',()=>{
 const m=boot();
 m.S.ui.psBank={tab:'bank',names:{'src-core:2026':'Digitalisasi Core APBN Baru'},check:[],wtab:'identity'};
 const added=m.bank.addOne('src-core:2026',false);
 assert.ok(added);
 assert.equal(added.nama,'Digitalisasi Core APBN Baru');
 assert.equal(added.psYear,2027);
 assert.equal(added.psStatus,'Draft');
 assert.equal(added.psProjects.length,2);
 assert.equal(added.psWbsDraft.length,0,'No historical WBS copied');
 assert.ok(m.S.charters.some(c=>c.prog===added.akr&&c.st==='Draft'));
 assert.equal(m.S.ui.psFlow.tab,'usulan');
  assert.equal(m.S.ui.psBank.tab,'detail');
  assert.equal(added.kode,'B27-CORE');
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
 assert.equal(m.target.psWbsDraft.length,0,'Pemetaan only copies project identity, not old WBS');
 assert.equal(m.scope.bank().mappingTab,'proposal','After transfer, show Usulan Proyek');
 assert.equal(m.S.wbs.length,2,'must not copy WBS as active before Penetapan');
 assert.equal(m.S.wbs[0].v,1,'must not mutate actual source progress');
 assert.equal(m.S.bukti['CORE-11'].link,'BA sumber');
});
test('Pemetaan does not carry WBS into PM, source untouched',()=>{
 const m=boot();m.scope.bank().target=m.target.id;
 m.scope.bank().map={year:2026,program:m.core.id,q:'',selected:[m.core.id+'::FRSW']};m.scope.transfer();
 m.target.psStatus='Ditetapkan';m.target.psDraft=false;m.target.psSelectedProjectIds=m.target.psProjects.map(x=>x.id);
 const n=m.ctx.window.MT_PS_WORKFLOW.syncWbs(m.target);
 assert.equal(n,0);assert.equal(m.ctx.window.MT_PS_WORKFLOW.syncWbs(m.target),0);
 assert.equal(m.S.wbs.length,2);
 assert.equal(m.S.wbs.filter(w=>w.prog==='CORE').length,2);
 assert.equal(m.S.wbs.filter(w=>w.prog==='NON').length,0);
});
test('Bank includes archived and current-year programs without status limitation',()=>{
 const m=boot();
 m.S.programs.push({id:'archive-2025',akr:'OLD',kode:'T25-OLD',nama:'Program Arsip Tematik',psYear:2025,psStatus:'Arsip',jenis:'Tematik',psProjects:[]});
 const all=m.bank.records();
 assert.ok(all.some(x=>x.p.psStatus==='Arsip'));
 assert.ok(all.some(x=>x.year===2027));
 assert.match(m.app.page(),/Program Arsip Tematik/);
 assert.match(m.app.page(),/Tambahkan Program ke tahun/);
 assert.equal(m.bank.codeFor({kode:'T25-OLD',jenis:'Tematik',akr:'OLD'},2027),'T27-OLD');
});
test('Program detail uses clickable rows and seven tabs with Buat Dokumen instead of Reviu',()=>{
 const m=boot();
 m.S.ui.psBank={tab:'detail',wtab:'identity'};
 const html=m.app.page();
 assert.match(html,/data-bank-detailrow/);
 const sourceText=source['project-selection-program-bank.js'];
 assert.match(sourceText,/aria-label="Detail Program"/);
 assert.match(sourceText,/STEPS.filter\(x=>x\[0\]!=='review'\)/);
 assert.match(sourceText,/Docs.builder\(p\)/);
 assert.match(sourceText,/openCarry\(\[btn.dataset.bankAdd\]\)/);
});
test('PPTX and PDF have differentiated previews, while section selector controls document content',()=>{
 const m=boot(),d=m.docs;
 m.S.ui.psBank={doc:{format:'pptx',sections:['identity','case'],cover:true,toc:true,annex:false,sign:false,slide:1}};
 assert.match(d.builder(m.target),/Pratinjau PowerPoint/);
 assert.match(d.builder(m.target),/Slide 2 \/ \d+/);
 assert.equal(d.sections(m.target).length,2);
 m.S.ui.psBank.doc.format='pdf';
 assert.match(d.builder(m.target),/Pratinjau PDF/);
 assert.match(source['project-selection-documents.js'],/JSZip/);
 assert.match(source['project-selection-documents.js'],/PptxGenJS/);
 assert.match(source['project-selection-documents.js'],/jspdf/);
});

test('PPTX continuation slides retain all content instead of truncating fields',()=>{
 const m=boot(),d=m.docs,full='X'.repeat(1200);m.target.psBusinessCase=full;
 m.S.ui.psBank={doc:{format:'pptx',sections:['case'],cover:true,toc:false,annex:false,sign:false,slide:0}};
 const parts=d.slidePages(m.target).flatMap(x=>x.rows).filter(x=>String(x[0]).startsWith('Business Case')).map(x=>x[1]);
 assert.equal(parts.join(''),full);
 assert.ok(d.slidePages(m.target).length>1);
 assert.match(d.builder(m.target),/Pratinjau PowerPoint/);
});

test('Buat Dokumen Perencanaan Proyek uses inline settings and live format preview, not an extra modal',()=>{
 const report=readFileSync('charter-planning-report.js','utf8');
 const planning=readFileSync('planning-tabs-v2.js','utf8');
 assert.match(report,/window\.cpInitInline/);
 assert.match(report,/data-cp-output/);
 assert.match(report,/cp-inline-slidecontrols/);
 assert.match(planning,/id="cp-doc-inline"/);
 assert.doesNotMatch(planning,/Pratinjau & Pilih Isi/);
 const m=boot();
 assert.equal(m.bank.codeFor({jenis:'Berkelanjutan',kode:'B25-CORE',akr:'CORE'},2027),'B27-CORE');
});


test('Compact one-row global filter and single mapping destination source of truth',()=>{
 const workflow=source['project-selection-workflow-2027.js'];
 const scope=source['project-selection-scope-map.js'];
 assert.match(workflow,/ps27-filter-compact/);
 assert.match(workflow,/data-ps27-status/);
 assert.match(workflow,/data-ps27-query/);
 assert.match(workflow,/data-ps27-year/);
 assert.match(scope,/Program Tujuan:/);
 assert.doesNotMatch(scope,/data-scope-target=/,'Program Tujuan tidak memakai filter kedua');
});
test('Portfolio builder supports selection, format preview and real exports',()=>{
 const m=boot(),d=m.docs,html=d.portfolioBuilder();
 assert.match(html,/Buat Dokumen Portofolio/);
 assert.match(html,/data-port-program/);
 assert.match(html,/data-port-section/);
 assert.match(html,/data-port-format/);
 assert.match(html,/data-port-export/);
 assert.match(source['project-selection-documents.js'],/async function portfolioExport/);
 assert.match(source['project-selection-documents.js'],/registerExport\('portfolio'/);
});
test('Version counter does not advance after generation, advances only after uploaded signed proof',()=>{
 const m=boot(),d=m.docs;
 assert.equal(d.nextVersion('program',m.target.id,2027),1);
 d.registerExport('program',m.target.id,2027,'word','draft-v1.docx');
 d.registerExport('program',m.target.id,2027,'pdf','draft-v1.pdf');
 assert.equal(d.nextVersion('program',m.target.id,2027),1);
 assert.equal(d.history('program',m.target.id,2027).length,2);
 const code=source['project-selection-documents.js'];
 assert.match(code,/async function confirmSigned/);
 assert.match(code,/await localProof\(proof,file\)/);
 assert.match(code,/status:'signed'/);
});
test('Global table sorting is delegated without changing WBS model order',()=>{
 const code=source['project-selection-program-bank.js'];
 assert.match(code,/installUniversalSort/);
 assert.match(code,/tbody.appendChild/);
 assert.match(code,/table\.dataset\.sortDir/);
 assert.match(code,/wbs-hierarchy/);
});
test('Program Carry Over allows editing acronym and updates year code',()=>{
 const m=boot();
 assert.equal(m.bank.codeFor({kode:'B25-CORE',jenis:'Berkelanjutan',akr:'CORE'},2027,'NONAPBN'),'B27-NONAPBN');
 assert.match(source['project-selection-program-bank.js'],/data-carry-akronim/);
 assert.match(source['project-selection-program-bank.js'],/data-carry-code/);
});

test('TTE upload closes v1 and next document is v2, while plain downloads keep v1',async()=>{
 const m=boot(),d=m.docs,programId=m.target.id;
 d.registerExport('program',programId,2027,'pdf','Perencanaan_v1.pdf');
 const opened=[];
 m.ctx.window.crypto={subtle:{digest:async()=>new Uint8Array(32).fill(7).buffer}};
 m.ctx.window.indexedDB={open:()=>{
  const req={result:{objectStoreNames:{contains:()=>true},close:()=>{},transaction:()=>{
   const tx={objectStore:()=>({put:(file,id)=>opened.push({file,id})})};
   setImmediate(()=>tx.oncomplete());return tx;
  }}};
  setImmediate(()=>req.onsuccess());return req;
 }};
 const file={name:'Hasil_TTE_v1.pdf',type:'application/pdf',size:1500,arrayBuffer:async()=>new Uint8Array([1,2,3]).buffer};
 assert.equal(await d.confirmSigned('program',programId,2027,file,true),1);
 assert.equal(d.nextVersion('program',programId,2027),2);
 assert.equal(opened.length,1);
 assert.equal(d.history('program',programId,2027).find(x=>x.status==='signed').hash.length,64);
 d.registerExport('program',programId,2027,'word','Perencanaan_v2.docx');
 assert.equal(d.nextVersion('program',programId,2027),2);
});

test('Pemetaan has two tabs and both sides checkbox; Usulan Proyek has CRUD without WBS counts',()=>{
 const m=boot(),scopeText=source['project-selection-scope-map.js'];
 m.scope.bank().target=m.target.id;
 const mapping=m.scope.render();
 assert.match(mapping,/data-scope-tab="mapping"/);
 assert.match(mapping,/data-scope-tab="proposal"/);
 assert.match(mapping,/data-scope-target-select|data-scope-target-all/);
 assert.match(mapping,/data-scope-select/);
 assert.doesNotMatch(mapping,/item WBS|WBS draft/);
 m.scope.bank().mappingTab='proposal';
 const proposal=m.scope.render();
 assert.match(proposal,/Usulan Proyek/);
 assert.match(proposal,/data-scope-project-new/);
 assert.match(scopeText,/data-scope-project-view/);
 assert.match(scopeText,/data-scope-project-edit/);
 assert.match(scopeText,/data-scope-remove/);
 assert.match(scopeText,/function projectEditor/);
});
test('Portfolio now uses formal Project Management report model for Word and visual non-clipping PPTX',()=>{
 const docs=source['project-selection-documents.js'];
 const m=boot();
 const html=m.docs.portfolioBuilder();
 assert.match(html,/Buat Dokumen Portofolio/);
 assert.match(docs,/function portfolioModel/);
 assert.match(docs,/Ringkasan Eksekutif/);
 assert.match(docs,/Ikhtisar Portofolio Program/);
 assert.match(docs,/mtRptDocx\(model\)/);
 assert.match(docs,/mtRptHtml\(model\)/);
 assert.match(docs,/function splitPortText/);
 assert.match(docs,/PROGRAM TERPILIH/);
 assert.match(docs,/PORTOFOLIO/);
 assert.match(docs,/rect\(sl/);
 assert.match(docs,/fontFace:'Aptos'/);
});
test('Shared filter checkbox is opt-in and local tab filter states are scoped independently',()=>{
 const bank=source['project-selection-program-bank.js'];
 const workflow=source['project-selection-workflow-2027.js'];
 assert.match(bank,/mt-shared-filter-check/);
 assert.match(bank,/Terapkan di semua menu/);
 assert.match(bank,/MutationObserver/);
 assert.match(workflow,/function localFilter/);
 assert.match(workflow,/filterScopes/);
 assert.match(workflow,/S\.ui\.mtSharedFilter\?\.enabled/);
});

test('Portfolio report uses structured headings and tables, never flat unformatted text',()=>{
 const m=boot(),model=m.docs.portfolioModel();
 assert.equal(model.formal,true);
 assert.match(model.cover.title,/PORTOFOLIO/);
 assert.ok(model.blocks.some(b=>b.t==='h1'&&b.text==='Ringkasan Eksekutif'));
 assert.ok(model.blocks.some(b=>b.t==='table'&&b.head.includes('Kode Program')));
 assert.ok(model.blocks.some(b=>b.t==='h1'&&/Program 01/.test(b.text)));
});
test('Portfolio PowerPoint segments long values into readable cards within each slide',()=>{
 const m=boot();m.target.psBusinessCase='Latar belakang transformasi '.repeat(120);
 const slides=m.docs.portSlides(),sections=slides.filter(s=>s.kind==='section');
 assert.ok(slides[0].kind==='cover');
 assert.ok(slides.some(s=>s.kind==='overview'));
 assert.ok(slides.some(s=>s.kind==='divider'));
 assert.ok(sections.length>0);
 assert.ok(sections.every(s=>s.rows.length<=4));
 assert.ok(sections.every(s=>s.rows.every(row=>row[1].length<=176)));
});
test('Portfolio overview pagination fits at most twelve programs per slide',()=>{
 const m=boot();
 for(let i=0;i<17;i++)m.S.programs.push({id:'later-'+i,akr:'P'+i,kode:'T27-P'+i,nama:'Usulan '+i,psYear:2027,psProjects:[]});
 const deck=m.docs.portSlides();
 const overview=deck.filter(s=>s.kind==='overview');
 assert.ok(overview.length>=2);
 assert.ok(overview.every(s=>s.programs.length<=12));
});

test('Priority menu: aligned SMART controls, info icon, four tabs, no redundant Bantuan Alur',()=>{
 const workflow=source['project-selection-workflow-2027.js'];
 const m=boot();
 m.S.ui.psFlow={...(m.S.ui.psFlow||{}),tab:'prioritasi',psGovNavV:1};
 m.S.ui.ps27=m.S.ui.ps27||{};m.S.ui.ps27.prioritySub='ranking';
 const html=m.app.page();
 assert.match(html,/Penilaian & Peringkat/);
 assert.match(html,/Referensi & Formula/);
 assert.match(html,/ps27-smart-actions/);
 assert.match(html,/pswf-prioritize/);
 assert.match(html,/ps27-smart-info/);
 assert.doesNotMatch(html,/Bantuan Alur/);
 assert.match(workflow,/openDetailTab\(item\)/);
 assert.match(workflow,/mappingTab=\['proposal'/);
});
test('Priority KPI cards filter ranking without duplicate search/chip strip and cannot delete projects',()=>{
 const m=boot(),internals=m.ctx.window.MT_PROJECT_SELECTION.internals;
 const html=internals.projectsPage(internals.norm(m.target));
 assert.match(html,/data-pswf-kpi="all"/);
 assert.match(html,/data-pswf-kpi="high"/);
 assert.match(html,/data-pswf-kpi="mid"/);
 assert.match(html,/data-pswf-kpi="low"/);
 assert.match(html,/data-pswf-kpi="top"/);
 assert.doesNotMatch(html,/id="pswf-search"/);
 assert.doesNotMatch(html,/data-pswf-filter=/);
 assert.doesNotMatch(html,/data-pswf-remove=/);
 assert.doesNotMatch(html,/Hapus calon proyek/);
});
test('Reference & Formula reproduces Dashboard CM four-step SMART mathematics',()=>{
 const m=boot(),internals=m.ctx.window.MT_PROJECT_SELECTION.internals;
 internals.state().formula=true;internals.state().params=true;
 const html=internals.referencePage(m.target);
 assert.match(html,/Tabel 1 · Kriteria dan Bobot/);
 assert.match(html,/Cara skor SMART dihitung/);
 assert.match(html,/Normalisasi bobot/);
 assert.match(html,/Nilai kriteria/);
 assert.match(html,/Utility/);
 assert.match(html,/Skor akhir & kategori/);
 assert.match(html,/S<sub>i<\/sub>/);
 assert.equal((html.match(/class="prio-fstep"/g)||[]).length,4);
 assert.match(html,/Edwards, 1977/);
});
test('Snapshot history is visible and comparative, with named actions',()=>{
 const src=source['project-selection-flow.js'],m=boot(),internals=m.ctx.window.MT_PROJECT_SELECTION.internals;
 m.target.psSnapshots=[{id:'s1',at:'2026-10-01T11:05:00Z',by:'PMO',rows:[{id:'proj-1',score:67.5,selected:false}]}];
 const html=internals.projectsPage(internals.norm(m.target));
 assert.match(html,/Riwayat Snapshot/);
 assert.match(html,/Simpan Snapshot Penilaian/);
 assert.match(html,/Lihat Riwayat \(1\)/);
 assert.match(src,/function openSnapshots/);
 assert.match(src,/data-snapshot-compare/);
 assert.match(src,/Proyek hanya dapat dihapus dari Pemetaan Proyek/);
});
