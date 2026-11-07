'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const src=fs.readFileSync(path.join(root,'cheatsheet-referensi.js'),'utf8');
const snapshot=fs.readFileSync(path.join(root,'wbs-cap-2026-reference.js'),'utf8');

function material(){
 const window={};
 const document={
  readyState:'loading',
  addEventListener(){},
  getElementById(){return null},
  createElement(){return {}},
  head:{appendChild(){}}
 };
 vm.runInNewContext(snapshot,{window});
 vm.runInNewContext(src,{window,document});
 return {window,html:window.txFormulaReferenceHtml()};
}

test('Tab Referensi tersedia di Cheatsheet PMO dan CMO pada aplikasi utama',()=>{
 assert.match(index,/src="cheatsheet-referensi\.js/);
 assert.match(index,/pmo:\[\['pmbok','Framework PMBOK',pmFramework\],\['ref','Referensi',pmReference\]/);
 assert.match(index,/cmo:\[\['framework','Framework',cmFramework\],\['ref','Referensi',pmReference\]/);
});

test('Referensi memuat glosarium pengertian, tujuan, cara kerja dan contoh rumus Excel',()=>{
 const {html}=material();
 for(const keyword of ['Pengertian','Tujuan','Cara kerja','Kompilasi','SUMIFS','Status Validasi','K-Wide','Capaian per UE I']){
  assert.ok(html.includes(keyword),keyword);
 }
 assert.equal((html.match(/<tr class="sk-filtered"/g)||[]).length,14);
 assert.equal((html.match(/<details class="tr-ref-fm sk-filtered"/g)||[]).length,8);
});

test('Pembedaan ringkasan per TW dengan rincian program jelas dan tidak dihitung terpisah',()=>{
 const {html}=material();
 assert.ok(html.includes('Ringkasan per Triwulan'));
 assert.ok(html.includes('Rincian per T-Program'));
 assert.ok(html.includes('Formula sama'));
 assert.ok(html.includes('total Kemenkeu')||html.includes('Total Kemenkeu'));
});

test('Contoh TW II memakai snapshot rekap terbaru tanpa mengubah angka operasional',()=>{
 const {html,window}=material();
 const tw=window.WBS_CAP_REFERENSI_2026['2026-2'];
 assert.equal(tw.tot[0],33664);
 assert.equal(tw.tot[1],34589);
 assert.equal(tw.tot[2],95885);
 for(const v of ['33.664','34.589','95.885','102,75','100% pelaporan'])assert.ok(html.includes(v),v);
});

test('K-Wide menggunakan output bukan bobot WBS, cap hanya TW WBS',()=>{
 const {html}=material();
 assert.ok(html.includes('Jumlah Target'));
 assert.ok(html.includes('Jumlah Realisasi'));
 assert.ok(html.includes('jangan gunakan bobot hari WBS')||html.includes('Jangan membaginya dengan bobot WBS'));
 assert.ok(html.includes('tidak diterapkan otomatis'));
});
