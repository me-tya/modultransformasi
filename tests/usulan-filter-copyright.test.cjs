const test=require('node:test');
const assert=require('node:assert/strict');
const{readFileSync}=require('node:fs');
const{join}=require('node:path');
const read=name=>readFileSync(join(__dirname,'..',name),'utf8');
test('Copyright permanen di footer konten shell',()=>{
 const html=read('index.html');
 assert.match(html, /<footer class="mt-content-copyright">© 2026 Atitya Pritasari · Pusat Manajemen Transformasi dan Perubahan · Kementerian Keuangan<\/footer>/);
});
test('Filter Usulan Program: kolom kategori di panel, kolom Cari di samping tab (standar mt-filter-kit)',()=>{
 const js=read('project-selection-workflow-2027.js');
 const kit=read('mt-filter-kit.js');
 const bank=read('project-selection-program-bank.js');
 assert.match(js,/field\('Asal',mk\('data-ps27-origin'/);
 assert.match(js,/field\('Kelengkapan',mk\('data-ps27-ready'/);
 assert.doesNotMatch(js,/ps27-filter-search/);
 assert.match(bank,/MT_TABSEARCH:\(\)=>''\)\('ps-usulan'/);
 assert.match(kit,/repeat\(var\(--mt-fcols,4\),minmax\(0,1fr\)\)/);
 assert.match(bank,/matchesOrigin\(p,b\.filterOrigin\)/);
});
