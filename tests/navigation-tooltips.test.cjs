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


test('Guide OFF hides all menu/tab tooltips including native title; ON restores full help',()=>{
 const stored={mt_guide_tooltips_v1:'off'},handlers={};
 function makeTab(title){
  const attrs=new Map([['title',title]]);
  const tab={
   dataset:{ps27Tab:'prioritasi'},isConnected:true,parentElement:null,
   hasAttribute:k=>attrs.has(k),getAttribute:k=>attrs.get(k)||null,
   setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),
   closest:()=>tab
  };
  return {tab,attrs};
 }
 const first=makeTab('Penjelasan Prioritasi');
 const document={
  addEventListener:(name,fn)=>{handlers[name]=fn},
  querySelectorAll:()=>[first.tab],getElementById:()=>null
 };
 const window={addEventListener(){},localStorage:{getItem:k=>stored[k]??null,setItem:(k,v)=>{stored[k]=v}}};
 runInNewContext(source,{window,document,setTimeout,clearTimeout});
 const guide=window.MT_MENU_TOOLTIP;
 assert.equal(guide.enabled(),false);
 guide.setEnabled(false);
 assert.equal(first.attrs.has('title'),false,'Native tooltip must be removed in OFF mode');
 handlers.pointerover({target:first.tab,pointerType:'mouse'});
 handlers.focusin({target:first.tab});
 const dynamic=makeTab('New dynamic tab title');
 handlers.pointerover({target:dynamic.tab,pointerType:'mouse'});
 assert.equal(dynamic.attrs.has('title'),false,'Dynamic tab must not expose native title tooltip');
 assert.equal(guide.setEnabled(true),true);
 assert.equal(first.attrs.get('title'),'Penjelasan Prioritasi');
 assert.equal(dynamic.attrs.get('title'),'New dynamic tab title');
 assert.equal(stored.mt_guide_tooltips_v1,'on');
 assert.equal(guide.setEnabled(false),false);
 assert.equal(stored.mt_guide_tooltips_v1,'off');
 assert.match(source,/if\(!guideEnabled\|\|!el\|\|!el\.isConnected\)return/);
 assert.match(source,/if\(!guideEnabled\)\{mutePath\(ev\.target,el\);return\}/);
 assert.match(source,/function muteNativeMenuTitles\(\)/);
 assert.match(source,/function restoreNativeMenuTitles\(\)/);
 assert.doesNotMatch(source,/shortFunction\(spec\[0\]\)/);
 assert.match(source,/headerObserver\.observe\(parent,\{childList:true\}\)/);
 assert.doesNotMatch(source,/headerObserver\.observe\(parent,\{childList:true,subtree:true\}\)/);
});

test('Bantuan and book Cheatsheet are icon-only and keep original click actions',()=>{
 assert.match(source,/\.sk-hdrHelp>span,#app \.top \.sk-hdrActions \.sk-hdrSheet>span\{display:none!important\}/);
 assert.match(source,/mtBookIcon/);
 assert.match(source,/<svg width="19" height="19"/);
 assert.match(source,/\.sk-hdrHelp:hover,#app \.top \.sk-hdrActions \.sk-hdrSheet:hover/);
 assert.match(source,/header\.insertBefore\(guide,avatar\)/);
 assert.match(source,/role','switch'/);
 assert.match(source,/Cheatsheet: framework, teori, metode SMART/);
});

test('Project Selection help and cheatsheet match PM modal shell and substantive tabs',()=>{
 const wf=readFileSync(join(__dirname,'..','project-selection-workflow-2027.js'),'utf8');
 const css=readFileSync(join(__dirname,'..','project-selection-workflow-2027.css'),'utf8');
 assert.match(wf,/sk-overlay ps27-rich-overlay/);
 assert.match(wf,/sk-dialog ps27-rich-dialog/);
 assert.match(wf,/sk-tabbar/);
 assert.match(wf,/sk-footer/);
 assert.match(css,/ps27-sheet-band/);
 assert.match(css,/ps27-sheet-gloss/);
 const a=wf.indexOf('function helpPage(tab){'),b=wf.indexOf('function open(mode){',a);
 assert.ok(a>=0&&b>a);
 const fn=new Function('current','B','E',wf.slice(a,b)+';return {helpPage,sheetPage};');
 const esc=x=>String(x||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
 const {helpPage,sheetPage}=fn(()=>({psWeights:{}}),{criteria:[{code:'C01',name:'Strategic Alignment',w:4}]},esc);
 for(const tab of ['map','flow','fill','roles','check']){
  const h=helpPage(tab);
  assert.ok(h.length>900,'Bantuan tab '+tab+' should contain substantive guidance');
  assert.match(h,/ps27-sheet/);
 }
 for(const tab of ['framework','governance','carry','formula','kwide','rkmk','terms','reference']){
  const h=sheetPage(tab);
  assert.ok(h.length>1000,'Cheatsheet tab '+tab+' should contain substantive references');
  assert.match(h,/ps27-sheet/);
 }
 assert.match(sheetPage('terms'),/Benefit Owner/);
 assert.match(sheetPage('kwide'),/Kontrak Kinerja/);
 assert.match(helpPage('map'),/data-ps27-jump/);
 assert.match(helpPage('fill'),/data-ps27-jump/);
});


test('Firestore header dot is fixed size and reflects real sync, warning, error',()=>{
 assert.match(source,/#app header\.top #dbb\{[^']*width:20px!important/);
 assert.match(source,/#app header\.top #dbb::before\{[^']*width:11px;height:11px/);
 assert.match(source,/data-mt-sync-state="orange"/);
 assert.match(source,/data-mt-sync-state="red"/);
 assert.match(source,/function installSyncBadge\(header\)/);
 assert.match(source,/syncObserver\.observe\(badge,\{childList:true,subtree:true,characterData:true\}\)/);
 assert.match(source,/if\(s\.pending\)/);
 assert.match(source,/Date\.now\(\)-syncPendingAt>=2500/);
 const start=source.indexOf('function syncSnapshot(badge){');
 const end=source.indexOf('function installHeader(){',start);
 assert.ok(start>=0&&end>start);
 const FB={st:'Tersimpan',err:''},navigator={onLine:true};
 const body='var syncPendingAt=0,syncPendingTimer=null,syncDetails=null,observedSyncBadge=null,syncObserver=null;\n'+source.slice(start,end)+'\nreturn {syncSnapshot,syncColor};';
 const {syncSnapshot,syncColor}=new Function('FB','navigator','document','window',body)(
  FB,navigator,{},{}
 );
 const badge={textContent:'● Tersimpan'};
 assert.equal(syncColor(syncSnapshot(badge)),'green');
 FB.st='Tersimpan ke Firestore';assert.equal(syncColor(syncSnapshot(badge)),'green');
 FB.st='Menyimpan…';assert.equal(syncColor(syncSnapshot(badge)),'green','Brief writes must not cause orange flicker');
 navigator.onLine=false;assert.equal(syncColor(syncSnapshot(badge)),'orange');
 navigator.onLine=true;FB.st='Gagal menyimpan';assert.equal(syncColor(syncSnapshot(badge)),'red');
 FB.st='Tersimpan';FB.err='permission-denied';assert.equal(syncColor(syncSnapshot(badge)),'red','Listener errors must override green text');
 FB.err='';FB.st='Firestore';assert.equal(syncColor(syncSnapshot(badge)),'orange');
});
