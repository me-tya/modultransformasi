'use strict';
/* Regression tests against the ACTUAL accounting helpers embedded in index.html.
   Run with: node --test tests/wbs-capaian-formula.test.cjs */
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function section(start,end) {
 const a=html.indexOf(start);assert.ok(a>=0,'Missing source marker: '+start);
 const b=html.indexOf(end,a+start.length);assert.ok(b>a,'Missing end marker: '+end);
 return html.slice(a,b);
}
const F=vm.runInNewContext(section('const bit=','const yrOf=')+'\n({tgtAt,realV,realAt,doneAt})');
test('Realisasi kumulatif: selesai pada satu bulan tetap dihitung pada TW berikutnya',()=>{
 const w={w:90,tm:3,rm:1<<2,v:1}; // completed March
 assert.equal(F.tgtAt(w,3),90);
 assert.equal(F.realV(w,3),90);
 assert.equal(F.realV(w,6),90);
 assert.equal(F.realV(w,9),90);
 assert.equal(F.realV(w,12),90);
});
test('Realisasi lebih cepat dari jadwal boleh mendahului target kumulatif',()=>{
 const w={w:60,tm:12,rm:1<<4,v:1}; // target Dec, done May
 assert.equal(F.tgtAt(w,6),0);
 assert.equal(F.realV(w,6),60);
 assert.equal(F.tgtAt(w,12),60);
});
test('Bukti yang belum tervalidasi tidak menambah realisasi',()=>{
 const w={w:31,tm:3,rm:1<<0,v:0};
 assert.equal(F.realV(w,3),0);
 w.v=1;
 assert.equal(F.realV(w,3),31);
});
test('Target otomatis mengikuti bulan dan bobot baseline yang berubah',()=>{
 const w={w:90,tm:3,rm:0,v:0};
 assert.equal(F.tgtAt(w,3),90);
 w.w=181;w.tm=6;
 assert.equal(F.tgtAt(w,3),0);
 assert.equal(F.tgtAt(w,6),181);
});
test('Pengecualian historis 2026 tidak menular ke 2027–2029',()=>{
 const S={ui:{tahun:2026},cfg:{}};
 const scope=vm.runInNewContext(section('function capTotItems(items,tw)','function capLive(items,tw)')+'\ncapTotItems',{S});
 const items=[{prog:'CORE'},{prog:'TKD'},{prog:'SD'}];
 assert.equal(scope(items,1).map(w=>w.prog).join(','),'CORE,TKD,SD');
 assert.equal(scope(items,2).map(w=>w.prog).join(','),'CORE,SD');
 S.ui.tahun=2027;
 assert.equal(scope(items,2).map(w=>w.prog).join(','),'CORE,TKD,SD');
 assert.equal(scope(items,2,2026).map(w=>w.prog).join(','),'CORE,SD'); // snapshot historical 2026
 S.cfg.capReportingExclusions={'2027':{'2':['SD']}};
 assert.equal(scope(items,2).map(w=>w.prog).join(','),'CORE,TKD');
});
test('Parser menerima Excel date serial dari workbook berikutnya',()=>{
 const dates=vm.runInNewContext(section('const xd=','/* Rumus Kompilasi dihitung sistem:')+'\n({xd,isD})');
 assert.equal(dates.xd(46388),'2027-01-01');
 assert.equal(dates.xd('1/2/2027'),'2027-02-01');
 assert.equal(dates.isD('2027-02-01'),true);
});
test('Change Request tanggal akhir menghitung ulang durasi dan bulan target',()=>{
 const item={k:'CORE-1',prog:'CORE',s:'2026-01-01',f:'2026-03-31',tm:3,w:90,p:['Awal']};
 const dates=(s,f)=>Math.round((Date.parse(f+'T00:00:00Z')-Date.parse(s+'T00:00:00Z'))/86400000)+1;
 const crApply=vm.runInNewContext(section('function crApply(c){','/* --- Laporan TW --- */')+'\ncrApply',{
  wbsBy:()=>item,crCanAct:()=>true,crGet:(w,k)=>w[k],toast:()=>{},
  durW:dates,isD:s=>/^20\d\d-\d\d-\d\d$/.test(s),
  yrOf:w=>+(w.f||w.s||'').slice(0,4),S:{wbs:[item]}
 });
 const change={st:'Disetujui Ketua',keputusan:{by:'Ketua'},item:'CORE-1',
  jenis:'Ubah item',ch:{f:['2026-03-31','2026-06-30']}};
 assert.equal(crApply(change),true);
 assert.equal(item.w,181);
 assert.equal(item.tm,6);
});
