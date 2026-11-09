'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {Script}=require('node:vm');
const root=p=>readFileSync(join(__dirname,'..',p),'utf8');
const db=root('dashboard-executive-v2.js');
const css=root('dashboard-executive-v2.css');
const scope=root('project-selection-scope-map.js');
const bankCss=root('project-selection-program-bank.css');
const charter=root('charter-planning-report.js');
const index=root('index.html');

function chartWith(mode,count=20){
 const pos=db.indexOf('function dbChart(rows,groups){'),end=db.indexOf('function dbOverview(rows,groups,n){',pos);
 assert.ok(pos>=0&&end>pos);
 const state={ui:{dbChart:mode,pr:'all'}};
 const fn=new Function('S','dbSummary','dbPct','dbN','dbEsc','dxAt',db.slice(pos,end)+';return dbChart;')(
  state,()=>({Tercapai:10,Berjalan:5,Terlambat:3,Terjadwal:2}),
  (n,d)=>d?Math.round(n/d*1000)/10:0,n=>String(n),x=>String(x),()=>({st:'Tercapai'})
 );
 return fn(Array.from({length:count},()=>({m:{}})),[]);
}

test('new chart model option renders side-by-side vertical bars without losing other options',()=>{
 assert.doesNotThrow(()=>new Script(db));
 const html=chartWith('vertical');
 assert.match(html,/value="vertical" selected>Bar Vertikal/);
 assert.match(html,/db-barplot-grouped/);
 assert.match(html,/db-group-bar db-series-target/);
 assert.match(html,/db-group-bar db-series-actual/);
 assert.match(html,/db-group-bar db-series-delay/);
 assert.doesNotMatch(html,/db-group-bar db-sw-wait/);
 assert.match(html,/Target: 18 modul \(90% dari 20 modul\)/);
 assert.match(html,/Realisasi: 10 modul \(50% dari 20 modul\)/);
 assert.match(html,/Terlambat: 3 modul \(15% dari 20 modul\)/);
 assert.match(html,/value="bar"/);
 assert.match(html,/value="heat"/);
 assert.match(html,/value="donut"/);
 assert.match(css,/\.db-group-bars\{[^}]*height:132px/);
});

test('stacked bars display percentage labels for readable segments and tooltip for every status',()=>{
 const html=chartWith('bar');
 assert.match(html,/db-part-pct">50%/);
 assert.match(html,/db-part-pct">25%/);
 assert.match(html,/db-part-pct">15%/);
 assert.match(html,/db-part-pct">10%/);
 assert.match(html,/title="Tercapai: 10 modul \(50%\)"/);
 assert.match(html,/style="height:50%"/);
 const empty=chartWith('bar',0);
 assert.doesNotMatch(empty,/NaN|Infinity/);
});

test('Charter tab offers PPTX import and uses existing draft/wizard import with review',()=>{
 assert.doesNotThrow(()=>new Script(charter));
 assert.match(charter,/data-act="cpImportPptx"/);
 assert.match(charter,/editableDraft=c\.st==='Draft'&&chCan\('U',chProg\(c\)\)/);
 assert.match(charter,/ACT\.ched\(\{dataset:/);
 assert.match(charter,/ACT\.chimpdoc\(\{dataset:\{pptx:'1'\}\}\)/);
 assert.match(charter,/ACT\.cpNewImportPptx/);
 assert.match(index,/data-act="cpNewImportPptx"/);
 assert.match(index,/function docPick\(cb,accept=DOC_ACCEPT\)/);
 assert.match(index,/el\?\.dataset\?\.pptx\?'\.pptx':DOC_ACCEPT/);
 assert.match(index,/docPreview\(file,F,found,sel=>/);
});

test('project history has compact year and proportional columns plus matching add icon and row detail',()=>{
 assert.doesNotThrow(()=>new Script(scope));
 assert.match(scope,/pshist-year/);
 assert.match(scope,/pshist-clickrow/);
 assert.match(scope,/data-scope-history-detail/);
 assert.match(scope,/class="psbank-action-icon psbank-program-action add"/);
 assert.match(scope,/function historyDetail\(key\)/);
 assert.match(scope,/role="dialog" aria-modal="true" aria-label="Detail Proyek Historis"/);
 assert.match(scope,/WBS Historis/);
 assert.match(scope,/data-scope-history-add/);
 assert.match(bankCss,/\.psbank-project-history-table col\.pshist-year\{width:61px\}/);
 assert.match(bankCss,/\.psbank-project-history-table col\.pshist-name\{width:24%\}/);
 assert.match(bankCss,/\.psbank-project-history-table col\.pshist-program\{width:27%\}/);
});

test('new assets are cache-busted for Pages without disturbing top header sizing',()=>{
 for(const str of [
  'dashboard-executive-v2.js?v=20261109-mt04-chart',
  'dashboard-executive-v2.css?v=20261109-mt04-chart',
  'charter-planning-report.js?v=20261109-charter-import-v3',
  'project-selection-scope-map.js?v=20261109-mt04-recap',
  'project-selection-program-bank.css?v=20261109-mt04-recap'
 ])assert.ok(index.includes(str),str);
 assert.match(index,/#app header\.top #bell\{[^\n]*width:36px!important/);
 assert.match(index,/#app header\.top \.sk-hdrActions \.sk-hdrHelp\{background:#1178E8!important/);
});

test('project categorization defaults align ICS and OA, and Core Non APBN can be selected',()=>{
 const a=scope.indexOf('function defaultProjectCategory(p){');
 const b=scope.indexOf('function projectValue(x,key){',a);
 assert.ok(a>0&&b>a);
 const f=new Function(scope.slice(a,b)+';return {defaultProjectCategory,projectCategory} ')();
 assert.equal(f.defaultProjectCategory({akr:'CORE',kode:'B27-CORE'}),'Core APBN');
 assert.equal(f.defaultProjectCategory({akr:'DOA',kode:'B27-DOA'}),'Office Automation');
 assert.equal(f.defaultProjectCategory({akr:'NON',kode:'B27-NON',nama:'Digitalisasi Core Non APBN'}),'Core Non APBN');
 assert.equal(f.projectCategory({akr:'CORE'},{category:''}),'Core APBN');
 assert.equal(f.projectCategory({akr:'DOA'},{category:''}),'Office Automation');
 assert.equal(f.projectCategory({akr:'CORE'},{category:'Core Non APBN'}),'Core Non APBN');
 assert.match(scope,/const CAT=\['Core APBN','Core Non APBN','Office Automation'/);
});

test('Usulan Proyek contains editing and recap contains hierarchy of program and projects',()=>{
 assert.match(scope,/Substansi & Usulan Proyek/);
 assert.match(scope,/Lihat Substansi Proyek/);
 assert.match(scope,/Ubah Substansi Proyek/);
 assert.match(scope,/Rekap Pemetaan/);
 assert.match(scope,/function programAccordion\(programs,on\)/);
 assert.match(scope,/psbank-recap-projectrow/);
 assert.match(scope,/data-scope-aggregate-view/);
 assert.match(scope,/x\.goLive\|\|'—'/);
 assert.match(scope,/\['results','Rekap Program & Proyek'/);
 assert.match(scope,/b\.mappingTab\|\|'results'/);
 assert.match(bankCss,/\.psbank-recap-table th:nth-child\(2\)\{width:27%\}/);
});

test('preview uses left pane height and Daftar Program renamed Usulan Program',()=>{
 const js=root('project-selection-program-bank.js');
 assert.match(js,/\['detail','Usulan Program'\]/);
 assert.match(js,/Usulan Program ·/);
 assert.match(bankCss,/\.psbank-portfolio-doc \.psbank-docscroll\{flex:1 1 0;height:0!important/);
 assert.match(bankCss,/\.psbank-portfolio-doc \.psbank-docpreview\{display:flex;flex-direction:column/);
 assert.ok(index.includes('project-selection-program-bank.js?v=20261109-mt04-usulan'));
});
