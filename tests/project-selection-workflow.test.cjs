'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {readFileSync}=require('node:fs');
const flow=readFileSync('project-selection-flow.js','utf8');
const governance=readFileSync('project-selection-governance.js','utf8');
const workflow=readFileSync('project-selection-workflow-2027.js','utf8');
const html=readFileSync('index.html','utf8');
const css=readFileSync('project-selection-workflow-2027.css','utf8');
function boot(year=2027){
 const p={id:'src-2026',akr:'OA',kode:'B25-OA',nama:'Office Automation',uic:'BaTii',jenis:'Berkelanjutan',
  mulai:2025,periode:'2025–2026',sponsor:'Kepala BaTii',psObjective:'Sasaran Digitalisasi',psBackground:'Proses manual',
  psBusinessCase:'Integrasi layanan',psBenefits:[{name:'Efisiensi',indicator:'Durasi',baseline:'3',target:'1',owner:'BaTii'}],
  psStakeholders:[{name:'DJPb',role:'Pengguna',strategy:'Bimtek'}],
  psRiskRegister:[{title:'Keterlambatan',response:'Mitigasi',owner:'BaTii'}],psProjects:[]};
 const sourceWbs=[
  {id:'OA-11',k:'OA-11',prog:'OA',p:['OA','Transformasi','e-Perjadin','Implementasi'],s:'2026-01-10',f:'2026-11-15',u:'BaTii',v:1,rm:4095,w:3,tm:11,arsip:false},
  {id:'OA-12',k:'OA-12',prog:'OA',p:['OA','Transformasi','e-Perjadin','Pelatihan'],s:'2026-03-01',f:'2026-08-09',u:'DJPb',v:1,rm:4095,w:2,tm:8,arsip:false}
 ];
 const S={ui:{tahun:year},programs:[p],wbs:sourceWbs,bukti:{'OA-11':{link:'bukti'}} ,charters:[{id:'ch-2026',prog:'OA',ver:1,st:'Disahkan',p1:2026,p2:2026,kpY:2026,judul:'Charter OA',tujuan:'Perbaikan layanan',lb:['Mahal'],out:['Otomasi'],oc:['Efisien'],ms:[{y:2026,t:'Pelatihan'}],rk:[{y:2026,t:'Go live'}],log:[{st:'Disahkan'}]}]};
 const noop=()=>{};
 const doc={head:{appendChild:noop},body:{appendChild:noop},querySelector:()=>null,createElement:()=>({remove:noop,click:noop})};
 const context={S,ME:{role:'SA',unit:'BaTii',email:'test@kemenkeu.go.id'},VIEW:'beranda',document:doc,window:{confirm:()=>true},location:{hash:''},save:noop,render:noop,toast:noop,
  esc:x=>String(x??''),vh:(_i,_k,name)=>'<h1>'+name+'</h1>',UNITS:['BaTii','DJPb'],progProjects:()=>[],pCharter:()=>'<div class="chbc">Editor native</div>'};
 const ctx=vm.createContext(context);
 vm.runInContext(flow,ctx,{filename:'project-selection-flow.js'});
 vm.runInContext(governance,ctx,{filename:'project-selection-governance.js'});
 vm.runInContext(workflow,ctx,{filename:'project-selection-workflow-2027.js'});
 return {S,ctx,api:ctx.window.MT_PS_WORKFLOW,app:ctx.window.MT_PROJECT_SELECTION,p};
}
test('Production includes workflow assets, six tabs and no visual journey strip',()=>{
 assert.match(html,/project-selection-workflow-2027\.js/);
 assert.match(html,/project-selection-workflow-2027\.css/);
 assert.doesNotThrow(()=>new vm.Script(workflow));
 assert.match(css,/ps27-filter-title/);
 const m=boot();
 const page=m.app.page();
 ['Usulan Program','Pemetaan Proyek','Prioritasi','Charter Program','Penetapan','Draft RKMK'].forEach(x=>assert.match(page,new RegExp(x)));
 assert.doesNotMatch(page,/pswf-journey/);
});
test('Carry-over clones program and charter but leaves prior-year WBS for fresh planning',()=>{
 const m=boot();
 const copy=m.api.cloneProgram(m.p,2026,2027);
 assert.equal(copy.psYear,2027);
 assert.equal(copy.psStatus,'Draft');
 assert.equal(copy.psDraft,true);
 assert.notEqual(copy.id,m.p.id);
 assert.notEqual(copy.akr,m.p.akr);
 assert.equal(copy.psBusinessCase,m.p.psBusinessCase);
 assert.equal(copy.psBenefits[0].target,m.p.psBenefits[0].target);
 assert.equal(copy.psProjects.length,1);
 assert.equal(copy.psProjects[0].name,'e-Perjadin');
 assert.equal(copy.psWbsDraft.length,0,'WBS should be planned anew for the destination year');
 assert.ok(m.S.charters.some(c=>c.prog===copy.akr&&c.st==='Draft'&&c.kpY===2027));
 assert.equal(m.S.wbs.length,2,'WBS must not enter PM until finalization');
 assert.equal(m.S.bukti['OA-11'].link,'bukti','Source evidence must be preserved only on source');
 assert.equal(m.S.wbs[0].v,1,'Source actuals must remain unchanged');
});
test('Penetapan does not sync a historical WBS without a newly planned WBS',()=>{
 const m=boot(),copy=m.api.cloneProgram(m.p,2026,2027);m.S.programs.push(copy);
 copy.psStatus='Ditetapkan';copy.psDraft=false;
 copy.psSelectedProjectIds=copy.psProjects.map(x=>x.id);
 assert.equal(m.api.syncWbs(copy),0);
 assert.equal(m.api.syncWbs(copy),0);
 assert.equal(m.S.wbs.length,2);
 assert.equal(m.S.wbs.filter(w=>w.prog===copy.akr).length,0);
 assert.equal(m.S.wbs.filter(w=>w.prog==='OA').length,2);
});
test('RKMK source is truthfully attributed when 2025 charter does not exist',()=>{
 const m=boot(),copy=m.api.cloneProgram(m.p,2026,2027);
 assert.match(copy.psRkmkSource,/Charter 2026/);
 assert.equal(copy.psRkmkReviewed.latar,undefined);
 assert.match(m.app.page(),/Usulan Program/);
 const p=m.api.cloneProgram(m.p,2026,2027);
 assert.equal(p.psCarry.sourceYear,2026);
});
test('Navigation and help focus on workflow; prioritization formula lives in cheatsheet',()=>{
 const m=boot();
 m.api.navigate('rkmk');
 assert.equal(m.S.ui.psFlow.tab,'rkmk');
 assert.match(m.app.page(),/Pilih program untuk menyusun Draft RKMK/);
});

test('Historical carried WBS remains review-only even if present in older stored programs',()=>{
 const m=boot(),copy=m.api.cloneProgram(m.p,2026,2027);
 m.S.programs.push(copy);copy.psStatus='Ditetapkan';copy.psDraft=false;
 copy.psSelectedProjectIds=copy.psProjects.map(x=>x.id);
 copy.psWbsDraft=[{k:'OLD-COPY-1',id:'OLD-COPY-1',prog:copy.akr,p:[copy.akr,'Legacy','e-Perjadin'],psCarryDraft:true,psSourceWbs:'OA-11',s:'2027-01-01',f:'2027-10-31',rm:0,v:0}];
 assert.equal(m.api.syncWbs(copy),0,'Old-year WBS must never be automatically activated');
 assert.equal(m.S.wbs.length,2);
 assert.ok(copy.psWbsDraft.length===1,'Keep legacy draft for explicit review rather than deleting it');
});
