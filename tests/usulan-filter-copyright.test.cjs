const test=require('node:test');
const assert=require('node:assert/strict');
const{readFileSync}=require('node:fs');
const{join}=require('node:path');
const read=name=>readFileSync(join(__dirname,'..',name),'utf8');
test('Copyright permanen pada sidebar shell',()=>{
 const html=read('index.html');
 assert.match(html, /<span class="mt-copyright">© 2026 Atitya Pritasari/);
 assert.match(html, /Pusat Manajemen Transformasi dan Perubahan<br>Kementerian Keuangan/);
});
test('Filter Usulan Program satu baris dengan pencarian inline dan filter Asal',()=>{
 const js=read('project-selection-workflow-2027.js');
 const css=read('project-selection-workflow-2027.css');
 const bank=read('project-selection-program-bank.js');
 assert.match(js,/stage==='usulan'\)fields\+=unitField\+originField\+statusField\+'<label class="ps27-filter-search">Cari/);
 assert.match(js,/searchAlreadyInBody\|\|stage==='usulan'/);
 assert.match(js,/data-ps27-origin/);
 assert.match(css,/ps27-filter-contextual\.ps27-filter-usulan \.ps27-filter-fields/);
 assert.match(bank,/matchesOrigin\(p,b\.filterOrigin\)/);
});
