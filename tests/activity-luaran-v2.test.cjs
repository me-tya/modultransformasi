'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const html=readFileSync(join(__dirname,'..','index.html'),'utf8');

test('Notula memakai lima level: 1., a., 1), a), i. pada Word dan pratinjau',()=>{
  assert.match(html,/lv===1\?actAbc\(i\)\+'\.'\:lv===2\?i\+'\)'\:lv===3\?actAbc\(i\)\+'\)'\:actRom\(i\)\+'\.'/);
  assert.match(html,/Math\.min\(lv\+1,4\)/);
  assert.match(html,/Math\.min\(lv,4\)/);
  for(const style of ['counter(list-item,lower-alpha) \". \"','counter(list-item,decimal) \") \"','counter(list-item,lower-alpha) \") \"','counter(list-item,lower-roman) \". \"'])assert.ok(html.includes(style),style);
});
test('Hasil & Luaran memisahkan dokumentasi, hadir, notula TTE dan hasil',()=>{
  assert.match(html,/sec\(1,'Dokumentasi'/);
  assert.match(html,/sec\(2,'Daftar Hadir'/);
  assert.match(html,/sec\(3,'Notula TTE'/);
  assert.match(html,/sec\(4,'Hasil & tindak lanjut'/);
  for(const key of ["'hadir','one-hadir'","'notulaTte','one-tte'","at('hadir')","at('notulaTte')","filled('hadir')","filled('notulaTte')"])assert.ok(html.includes(key),key);
  assert.match(html,/if\(k==='notulaTte'\)opt\.accept='\.pdf'/);
});
test('Lampiran baru bisa pratinjau dan unduh; dokumentasi menjadi thumbnail',()=>{
  assert.match(html,/function actPhotoTiles\(/);
  assert.match(html,/function actHydrateThumbs\(/);
  assert.match(html,/data-actthumb=/);
  assert.match(html,/function actAttachmentPreview\(/);
  assert.match(html,/if\(key==='one-hadir'\|\|key==='one-tte'\)/);
  assert.match(html,/data-atpv=/);
  assert.match(html,/data-atdl=/);
});
test('Menu wizard padat dan field hasil serta tindak lanjut memanfaatkan ruang',()=>{
  // Sidebar tetap mempertahankan deskripsi; badge diposisikan di kolom ketiga, bukan di bawah.
  assert.match(html,/grid-template-columns:38px minmax\(0,1fr\) max-content/);
  assert.match(html,/\.sw \.sw-nav button span small\{/);
  assert.match(html,/display:block;[\s\S]*?text-overflow:ellipsis;/);
  assert.match(html,/\.sw \.sw-nav button em\{[\s\S]*?grid-column:3;[\s\S]*?grid-row:1;/);
  assert.match(html,/\.sw \.sw-nav button\.on\{[\s\S]*?background:#FFFFFF/);
  assert.match(html,/b\.dataset\.complete=tot&&dn===tot\?'done':dn\?'partial':'empty'/);
  assert.match(html,/\.sw \.act-outcome-section \.act-result-grid textarea\{flex:1/);
});
