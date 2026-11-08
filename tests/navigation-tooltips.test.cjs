'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {runInNewContext,Script}=require('node:vm');
const source=readFileSync(join(__dirname,'..','ui-menu-tooltips.js'),'utf8');
const loader=readFileSync(join(__dirname,'..','project-selection-program-bank.js'),'utf8');

function boot(){
 const document={addEventListener(){}};
 const window={addEventListener(){}};
 runInNewContext(source,{document,window,setTimeout,clearTimeout});
 const element=(dataset={},href='')=>({dataset,getAttribute:name=>name==='href'?href:'',closest:()=>null});
 return {tool:window.MT_MENU_TOOLTIP,element};
}

test('tooltip script is valid and loaded by the app-wide program-bank bundle',()=>{
 assert.doesNotThrow(()=>new Script(source));
 assert.match(loader,/script\.src='ui-menu-tooltips\.js\?v=/);
 assert.match(source,/document\.addEventListener\('pointerover'/);
 assert.match(source,/document\.addEventListener\('focusin'/);
 assert.match(source,/position:fixed/);
 assert.match(source,/pointer-events:none/);
});

test('all navigation types have globally delegated hover coverage',()=>{
 for(const item of ['#app .nav .nv','#app .ps27-tabs button','#app .psbank-subtabs button',
  '#app .psbank-mapping-tabs button','#app .ps27-minitabs button',
  '#app .cm-step','#app .ptabs a','#app .cra2-tabs button',
  '#app .pg-tabs button','[role="tab"]','nav[role="tablist"] button'])
  assert.ok(source.includes(item),'Missing selector: '+item);
});

test('function and boundary are explicit for each important workflow',()=>{
 const {tool,element}=boot();
 const checks=[
  [element({ps27Tab:'penetapan-program'}),'Penetapan Program',/kontrak kinerja K-Wide/i,/WBS/i],
  [element({ps27Sub:'ranking'}),'Penilaian & Peringkat',/urutan prioritas/i,/keputusan/i],
  [element({ps27Sub:'monev'}),'Monev & Manfaat',/indikator dan manfaat/i,/Project Management/i],
  [element({scopeTab:'history'}),'Riwayat Proyek',/proyek lintas tahun/i,/WBS dan realisasi sumber/i],
  [element({bankTab:'bank'}),'Riwayat Program',/riwayat program/i,/historis/i],
  [element({cra2:'tab',v:'analytics'}),'Analisis CRA',/menganalisis skor/i,/go-live/i],
  [element({pg:'tab',val:'tim'}),'Tim',/personel/i,/penugasan/i],
  [element({},'#pmo-cr'),'Change Request',/Change Request/i,/baseline/i],
  [element({},'#cmo-closing'),'Penutupan CM',/penutupan/i,/proyek/i],
  [element({ext:'Nadine'}),'Nadine',/luar modul/i,/prototipe/i]
 ];
 for(const [el,label,fn,bound] of checks){
  const entry=tool.resolve(el,label);
  assert.ok(Array.isArray(entry),label);
  assert.match(entry[0],fn,label+' function');
  assert.match(entry[1],bound,label+' boundary');
 }
});
