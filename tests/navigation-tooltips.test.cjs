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

test('Bantuan OFF mutes all native navigation titles and ON restores them',()=>{
 const stored={mt_menu_help_enabled_v1:'off'},writes=[];
 const title={value:'Membaca informasi fungsi dan batasan menu.'};
 const nav={
  isConnected:true,
  hasAttribute:k=>k==='title'&&title.value!==null,
  getAttribute:k=>k==='title'?title.value:null,
  setAttribute:(k,v)=>{if(k==='title')title.value=v},
  removeAttribute:k=>{if(k==='title')title.value=null}
 };
 const events={};
 const document={
  addEventListener:(name,cb)=>{events[name]=cb},
  querySelector:()=>null,
  querySelectorAll:()=>[nav],
  readyState:'loading'
 };
 const window={
  addEventListener:()=>{},
  localStorage:{
   getItem:k=>stored[k]??null,
   setItem:(k,v)=>{stored[k]=v;writes.push([k,v])}
  }
 };
 runInNewContext(source,{document,window,setTimeout,clearTimeout});
 const api=window.MT_MENU_TOOLTIP;
 assert.equal(api.enabled(),false);
 assert.equal(api.setEnabled(false),false);
 assert.equal(title.value,null,'Native title must be suppressed in OFF mode');
 assert.equal(api.setEnabled(true),true);
 assert.equal(title.value,'Membaca informasi fungsi dan batasan menu.','Original title must be restored without loss');
 assert.deepEqual(writes.map(x=>x[1]),['off','on']);
 assert.equal(stored.mt_menu_help_enabled_v1,'on');
});
test('compact Sync keeps real Firestore saving and error statuses accessible',()=>{
 assert.match(source,/data-mt-sync="pending"/);
 assert.match(source,/data-mt-sync="error"/);
 assert.match(source,/function compactSync\(node\)/);
 assert.match(source,/Status sinkronisasi Firestore:/);
 assert.match(source,/node\.setAttribute\('aria-label',text\)/);
 assert.match(source,/node\.setAttribute\('title',text\)/);
 assert.match(source,/header\.insertBefore\(control,avatar\)/);
 assert.match(source,/control\.setAttribute\('role','switch'\)/);
});

test('help/Cheatsheet icon-only and observer avoid expensive deep DOM scanning',()=>{
 assert.match(source,/headerObserver\.observe\(root,\{childList:true\}\)/);
 assert.doesNotMatch(source,/headerObserver\.observe\(root,\{childList:true,subtree:true\}\)/);
 assert.match(source,/sk-hdrActions \.sk-hdrHelp span,#app \.top \.sk-hdrActions \.sk-hdrSheet span\{display:none!important\}/);
 assert.match(source,/Pusat Bantuan: panduan penggunaan aplikasi, alur menu/);
 assert.match(source,/Cheatsheet: referensi ringkas tata kelola/);
 assert.match(source,/function muteNativeTitle\(node\)/);
 assert.match(source,/if\(!enabled\)\{muteNativeTitle\(el\);return\}/);
 assert.match(source,/header\.querySelector\('\.sk-hdrActions \.sk-hdrHelp'\)/);
 assert.match(source,/header\.querySelector\('\.sk-hdrActions \.sk-hdrSheet'\)/);
});
