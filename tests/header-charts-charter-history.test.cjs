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
 assert.match(html,/db-group-bar db-sw-ok/);
 assert.match(html,/value="bar"/);
 assert.match(html,/value="heat"/);
 assert.match(html,/value="donut"/);
 assert.match(css,/\.db-group-bars\{height:118px/);
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
 assert.match(charter,/c\.st==='Draft'&&chCan\('U',chProg\(c\)\)/);
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
  'dashboard-executive-v2.js?v=20261109-chart-v3',
  'dashboard-executive-v2.css?v=20261109-chart-v3',
  'charter-planning-report.js?v=20261109-charter-import-v2',
  'project-selection-scope-map.js?v=20261109-history-click-v6',
  'project-selection-program-bank.css?v=20261109-history-click-v6'
 ])assert.ok(index.includes(str),str);
 assert.match(index,/#app header\.top #bell\{[^\n]*width:36px!important/);
 assert.match(index,/#app header\.top \.sk-hdrActions \.sk-hdrHelp\{background:#1178E8!important/);
});
