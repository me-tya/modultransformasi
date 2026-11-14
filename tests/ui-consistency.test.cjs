'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const html=readFileSync('index.html','utf8');
const css=readFileSync('ui-tabs-unified.css','utf8');
const bridge=readFileSync('cheatsheet-referensi.js','utf8');

test('Semua skrip inline index dapat diparsing',()=>{
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
   .map(m=>m[1]).filter(s=>s.trim()&&!s.includes('"S":[],"W":[],"K":[]'));
 assert.ok(scripts.length>=3);
 scripts.forEach((s,i)=>assert.doesNotThrow(()=>new vm.Script(s,{filename:'index-inline-'+i+'.js'})));
});
test('Stylesheet tab dimuat sebelum render dan versi cache seragam',()=>{
 assert.match(html,/id="mt-unified-tabs-styles" rel="stylesheet" href="ui-tabs-unified\.css\?v=20261114-nav1"/);
 assert.match(html,/cheatsheet-referensi\.js\?v=20261114-nav1/);
 assert.equal((bridge.match(/ui-tabs-unified\.css\?v=20261114-nav1/g)||[]).length,2);
});
test('Tab PMO selalu dibungkus dengan baris stabil terlepas dari tab aktif',()=>{
 assert.match(html,/function wbsActionSubline\(cur,\s*sub\)/);
 assert.match(html,/return '<div class="mt-pmo-subtab-band">'\s*\+\s*sub\s*\+\s*bar/);
 assert.match(css,/#app \.mt-pmo-subtab-band\s*\{/);
 assert.match(css,/#app \.mt-pmo-subtab-band > \.subt\.ctabs\s*\{/);
});
test('Info berada di toolbar tabel bukan baris kosong',()=>{
 assert.match(html,/card\.querySelector\(':scope > \.tbar,:scope > \.ch'\)/);
 assert.match(html,/target\.classList\.contains\('tbar'\)/);
 assert.match(html,/mtCompactWorkbars\(v\)/);
 assert.match(html,/function mtCompactWorkbars\(view\)/);
 assert.match(html,/host\.appendChild\(tools\)/);
});
test('Pencarian yang dinaikkan tetap memakai data-q dan pencarian delegasi',()=>{
 assert.match(html,/data-q="\\?\$\{id\}"/);
 assert.match(html,/tools\.appendChild\(search\)/);
 assert.match(html,/Q\[q\.dataset\.q\]=q\.value/);
});
test('Garis tab seragam 4px dan tetap di dalam komponen',()=>{
 assert.match(css,/#app \.subt\.ctabs > a\.on::after/);
 assert.match(css,/bottom:0!important;height:4px!important/);
 assert.match(css,/#app \.mt-pmo-subtab-band > \.subt\.ctabs > a\.on::after/);
 assert.match(css,/#app \.mt-subtab-host > \.subt > a\.on::after/);
});
test('Tab tingkat kedua untuk Dashboard/CM/CRA dan panel terkait tetap tercakup',()=>{
 for(const name of ['.subt','.ov-tabs','.porto-view-tabs','.ws-tabs','.hp-tabs','.chtabs','.cra-tabs','.wz-sub','.sk-tabbar','.cm-survey-subtabs','.cm-ap-tabs','.cra2-tabs','.pg-tabs','.eo-ws-nav']){
   assert.ok(css.includes(name),name+' belum tercakup');
 }
 assert.match(bridge,/iframe\.mt-cm-frame/);
 assert.match(bridge,/mt-ui-embedded/);
});
test('Jumlah kurung CSS seimbang',()=>{
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
