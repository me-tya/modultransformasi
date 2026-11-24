'use strict';
/* 2026-11-24 — WBS multi-tahapan, Referensi IKU, Kendala & IKU pada sinkron DCM, Ekspor IPR. */
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const R=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const ctx={window:{}};vm.runInNewContext(R('activity-wbs.js'),ctx);const W=ctx.window.ActivityWBS;
const M=require('../mt-dcm-activity-sync.js');
test('WBS: komponen → tahapan, PM & CM paralel, data lama tetap terbaca',()=>{
 assert.deepEqual([...W.COMPONENTS],['Arsitektur Proses Bisnis','Pengembangan Sistem Informasi','Manajemen Perubahan']);
 assert.equal(W.LABELS['Manajemen Perubahan'],'Change Management');
 const f=W.flat([{wbsLevel4:'Manajemen Perubahan',wbsLevel5:'Analisis Dampak Perubahan'},{wbsLevel4:'Pengembangan Sistem Informasi',wbsLevel5:'Hosting'}]);
 assert.equal(f.wbsGroup,'CM');assert.equal(f.wbsItems.length,2);assert.equal(f.wbsItems[1].wbsGroup,'PM');
 assert.equal(W.items({wbsGroup:'CM',wbsLevel4:'Manajemen Perubahan',wbsLevel5:'Asesmen Kesiapan Perubahan'}).length,1,'field lama dibaca sebagai satu item');
 const r=Object.assign({tglMulai:'2026-08-05'},f);
 assert.ok(W.matches(r,{wbsLevel4:'Pengembangan Sistem Informasi'},'tglMulai'),'cocok bila salah satu item cocok');
 assert.ok(W.matches(r,{wbsGroup:'PM',wbsQuarter:'3'},'tglMulai'));
 assert.ok(!W.matches(r,{wbsLevel5:'Vulnerability Test'},'tglMulai'));
 assert.ok(W.matches({},{wbsLevel4:'ALL',wbsQuarter:'ALL'},'tglMulai'),'tanpa filter WBS aktivitas tanpa WBS tetap tampil');
 assert.match(W.formHTML({}),/data-wbs-on/);assert.doesNotMatch(W.formHTML({}),/type="radio"/);
});
test('Sinkron DCM: Kendala & IKU ikut, sidik aktivitas lama tidak berubah',()=>{
 const a={id:'A1',namaKegiatan:'Rapat',tglMulai:'2026-08-01',tglSelesai:'2026-08-01',jamMulai:'09:00',jamSelesai:'10:00',kategori:'FGD',layanan:'Yes',picTimCM:'',status:''};
 const h0=M.hash(M.canonD(a));assert.equal(M.hash(M.canonD(Object.assign({},a,{kendala:'',ikuRefs:[]}))),h0,'field kosong tidak mengubah sidik');
 const x=M.applyToMt({id:'x'},Object.assign({},a,{kendala:'Data belum lengkap',ikuRefs:['5a-N','4a-CP']}));
 assert.equal(x.kendala,'Data belum lengkap');assert.deepEqual(x.ikuRefs,['4a-CP','5a-N']);
 x.kendala='Revisi kendala';x.ikuRefs=['3a-CP'];const a2=M.applyToDcm(a,x,{});
 assert.equal(a2.kendala,'Revisi kendala');assert.deepEqual(a2.ikuRefs,['3a-CP']);assert.deepEqual(M.canonD(a2),M.canonM(x));
});
test('Form & menu: IKU di Klasifikasi, Kesimpulan Rapat, Generate Laporan di kiri Simpan, tab Referensi IKU, ekspor IPR',()=>{
 const html=R('index.html');
 assert.ok(html.indexOf("MTIKU.fieldHTML(item)")>html.indexOf("sec(2,'Klasifikasi'")&&html.indexOf("MTIKU.fieldHTML(item)")<html.indexOf("sec(3,'Tahapan WBS'"),'IKU terkait berada di bagian Klasifikasi');
 assert.match(html,/\['Kesimpulan Rapat','Dokumentasi, kesimpulan'\]/);
 assert.match(html,/data-swrep[^>]*>▤ Generate Laporan<\/button><button type="button" class="btn" data-swsv>Simpan/);
 assert.match(html,/\['ikuref','Referensi IKU'\]/);assert.match(html,/MTIKU\.page\(\)/);
 assert.doesNotMatch(html,/data-act="actWbsIku"/);assert.match(html,/<script src="mt-iku-ipr\.js/);
});
test('Referensi IKU: seed 2026, parser tempel tabel Kinerja Utama, data IPR per triwulan',()=>{
 const S={oneonone:[],ui:{}},acts=[
  {id:'1',nama:'T-Forum',tgl:'2026-02-10',tahun:2026,ikuRefs:['4a-CP'],kendala:'K1',unitP:'DJKN'},
  {id:'2',nama:'Batal',tgl:'2026-02-11',tahun:2026,ikuRefs:['4a-CP'],stat:'Dibatalkan'},
  {id:'3',nama:'T-Lab',tgl:'2026-08-05',tahun:2026,ikuRefs:['4a-CP','5a-N']}];
 const c={window:{},document:{addEventListener(){}},S,ME:{role:'CMOK'},ACT:{},
  actRows:()=>acts,actGrp:()=>'pusat',actStBase:x=>x.stat||'Selesai',actName:x=>x.nama,oneTwOf:x=>Math.ceil(+x.tgl.slice(5,7)/3),
  toast(){},save(){},render(){},log(){},actStamp(){},console};
 vm.runInNewContext(R('mt-iku-ipr.js'),c);const I=c.window.MTIKU;
 const r=I.ref('2026');assert.equal(r.length,13);assert.equal(r[0].kode,'1a-CP');assert.ok(r.every(x=>x.strategi&&x.ssNama));
 const p=I.parsePaste('Casc\tNomor IKI\tNama IKI Utama\n\t1a-CP\tTingkat Keberhasilan Transformasi Kemenkeu\n\t2a-CP\tPersentase Keberhasilan Perumusan Program\n');
 assert.deepEqual(JSON.parse(JSON.stringify(p.map(x=>[x.kode,x.ssNo]))),[['1a-CP','1'],['2a-CP','2']]);
 const D=I.iprData('2026');
 assert.match(D.tw[0]['4a-CP'].tindakan,/^1\. 10 Feb 2026 — T-Forum \(DJKN\)$/);assert.match(D.tw[0]['4a-CP'].kendala,/T-Forum: K1/);
 assert.equal(D.tw[0]['4a-CP'].n,1,'kegiatan dibatalkan tidak ikut');assert.equal(D.tw[2]['5a-N'].n,1);assert.equal(D.tw[1]['4a-CP'].n,0);
});
