/* Referensi Cheatsheet Pengelolaan Transformasi: glosarium + padanan rumus Excel.
   Acuan struktur: sheet Kompilasi, Capaian T-Program, Capaian per UE1, Capaian K-Wide.
   Contoh rumus structured references ini bukan alamat sel literal dari workbook sumber.
   Nilai contoh diambil dari window.WBS_CAP_REFERENSI_2026; tidak menjadi sumber penghitungan aplikasi. */
(function(){
"use strict";
var st= [
'.tr-ref{font:inherit;color:#183454}.tr-ref *{box-sizing:border-box}',
'.tr-ref-hero{background:linear-gradient(112deg,#0e315b,#174777);border-radius:13px;color:#fff;padding:19px 21px;margin-bottom:14px}',
'.tr-ref-hero h3{font-size:19px;font-weight:850;margin:4px 0 6px;color:#fff}.tr-ref-hero p{font-size:12px;line-height:1.65;color:#e1edff;margin:0}',
'.tr-ref-kicker{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#f7c657;font-weight:900}',
'.tr-ref-alert{padding:11px 13px;background:#fff9eb;border:1px solid #ead7a9;border-left:4px solid #d3a237;border-radius:9px;font-size:11.8px;line-height:1.65;color:#5e512b;margin:13px 0}',
'.tr-ref h4{font-size:15px;font-weight:850;color:#153a69;margin:21px 0 9px}.tr-ref small{color:#5a6e87}',
'.tr-ref-tablewrap{overflow-x:auto;border:1px solid #dce5ef;border-radius:11px;margin:10px 0 12px}',
'.tr-ref-table{border-collapse:collapse;min-width:750px;width:100%;font-size:11.6px;line-height:1.5}',
'.tr-ref-table th{padding:10px 11px;text-align:left;background:#113b6a;color:#fff;font-weight:800;white-space:nowrap}',
'.tr-ref-table td{padding:10px 11px;border-top:1px solid #e6edf5;vertical-align:top;color:#243a51}.tr-ref-table tr:nth-child(even) td{background:#f6f9fd}.tr-ref-table strong{color:#113b6a}',
'.tr-ref-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:10px 0}',
'.tr-ref-summary>div{border:1px solid #dae5f0;background:#f8fbff;border-radius:11px;padding:13px}',
'.tr-ref-summary b{display:block;color:#153a69;font-size:13px;margin-bottom:5px}.tr-ref-summary p{font-size:11.6px;color:#4e6079;line-height:1.58;margin:0}',
'.tr-ref-fm{border:1px solid #dee7f0;border-radius:11px;background:white;margin:8px 0;overflow:hidden}',
'.tr-ref-fm summary{cursor:pointer;padding:13px 14px;display:flex;align-items:center;gap:10px;justify-content:space-between;list-style:none}',
'.tr-ref-fm summary::-webkit-details-marker{display:none}.tr-ref-fm summary b{font-size:12.5px;color:#103b6f}.tr-ref-fm summary span{font-size:10.5px;color:#667e99}',
'.tr-ref-fm[open] summary{background:#edf4fd;border-bottom:1px solid #e0e9f5}',
'.tr-ref-detail{padding:14px}.tr-ref-detail dl{display:grid;grid-template-columns:104px minmax(0,1fr);gap:8px 11px;margin:0 0 9px;font-size:11.6px;line-height:1.55}',
'.tr-ref-detail dt{font-weight:850;color:#244c78}.tr-ref-detail dd{margin:0;color:#374c62}',
'.tr-ref-formula{margin:9px 0 0;background:#0c2748;color:#def2ff;border:1px solid #0e3a6d;border-radius:8px;padding:12px;white-space:pre-wrap;overflow-wrap:anywhere;font:600 11.4px/1.65 ui-monospace,Consolas,monospace}',
'.tr-ref-formula::selection{background:#e7c059;color:#0b2649}',
'.tr-ref-example{margin-top:10px;background:#f2f8f5;border-left:3px solid #348463;padding:9px 11px;color:#1f5a42;font-size:11.5px;line-height:1.6;border-radius:4px}',
'.tr-ref-filter{margin:12px 0 15px!important}',
'.tr-ref-source{font-size:10.9px;line-height:1.65;color:#62768e;border-top:1px solid #dce5f0;padding-top:12px;margin-top:19px}',
'@media(max-width:760px){.tr-ref-summary{grid-template-columns:1fr}.tr-ref-detail dl{grid-template-columns:1fr;gap:4px}.tr-ref-table{min-width:690px}.tr-ref-hero{padding:15px}}'
].join("");
function addStyle(){if(document.getElementById('tr-ref-style'))return;var el=document.createElement('style');el.id='tr-ref-style';el.textContent=st;document.head.appendChild(el)}
function h(x){return String(x??'').replace(/[&<>"']/g,function(s){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]})}
function num(x){return Number(x).toLocaleString('id-ID',{maximumFractionDigits:2})}
function decimal(x){return Number(x).toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2})}
var terms=[
['T-Program','Program transformasi yang berisi beberapa proyek/kegiatan pada satu kelompok program.','Memantau pencapaian tiap program secara terpisah.','Filter WBS berdasarkan kode program (misalnya OA atau CORE); konsolidasikan target dan realisasi sampai akhir TW.'],
['WBS (Work Breakdown Structure)','Struktur pemecahan pekerjaan menjadi item/deliverable yang dapat dijadwalkan dan dibuktikan.','Menjadi dasar rencana kerja, pengendalian, dan pengukuran capaian.','Item berisi kode, tanggal Start–Finish, bobot durasi, unit terkait, realisasi, dan validasi bukti.'],
['Bobot item WBS','Jumlah hari kalender antara tanggal mulai dan selesai, termasuk kedua tanggalnya.','Membedakan kontribusi item yang berbeda durasi.','Bobot = Finish − Start + 1; bila baseline tanggal belum sah/ lengkap, bobot tidak dihitung.'],
['Target TW kumulatif','Akumulasi bobot item yang tenggat (Finish) sampai akhir TW yang diukur.','Menentukan pembanding capaian untuk periode yang sama.','TW II memasukkan target item jatuh tempo Januari–Juni; tidak memakai target akhir tahun sebagai pembagi capaian TW.'],
['Realisasi TW kumulatif','Bobot item yang sudah dicatat selesai sampai TW tersebut serta bukti dukungnya tervalidasi.','Mengukur bobot pekerjaan yang benar-benar diterima.','Dapat memasukkan item selesai lebih cepat dari jadwal; tidak boleh memasukkan validasi susulan setelah cut-off historis.'],
['Capaian TW (mentah)','Realisasi kumulatif TW dibagi target kumulatif TW.','Mengetahui pencapaian riil dibanding rencana sampai periode tertentu.','Persentase mentah dapat lebih dari 100% karena penyelesaian lebih awal.'],
['Capaian TW (pelaporan)','Capaian TW setelah penerapan batas maksimum untuk ditampilkan sebagai indikator resmi.','Menyeragamkan penilaian periode dan menghindari angka pelaporan di atas batas.','Batas aplikasi: TW I–II maksimum 100%; TW III–IV maksimum 120%. Target/realisasi asli tidak dipotong.'],
['Target tahunan & capaian tahunan','Target tahunan adalah bobot seluruh item satu tahun; capaian tahunan adalah realisasi TW dibagi target tahunan.','Melihat kemajuan terhadap sasaran akhir tahun.','Pembaginya target setahun, bukan target s.d. TW; nilainya berbeda dari capaian TW.'],
['Ringkasan per Triwulan','Konsolidasi seluruh program yang masuk lingkup pelaporan pada suatu TW.','Memberi gambaran kinerja total lintas program.','Jumlahkan target dan realisasi per program yang termasuk periode tersebut; baru hitung persen total.'],
['Rincian per T-Program','Penyajian ukuran WBS yang sama, dipisahkan menurut masing-masing T-Program.','Membandingkan program mana yang tertinggal atau melampaui rencana.','Formula sama dengan ringkasan TW, tetapi pengelompokannya berdasarkan kode program.'],
['Capaian per UE I','Capaian bobot WBS pada item yang mencakup satu unit Eselon I, sesuai kolom cakupan unit.','Memetakan kontribusi dan tanggung jawab lintas unit.','Satu item bisa tercakup di beberapa UE I; total lintas UE I tidak selalu sama dengan total Kemenkeu.'],
['K-Wide (IKU)','Capaian output IKU K-Wide, dinilai berdasarkan jumlah target dan realisasi output tiap program/TW.','Memantau komitmen output strategis yang terpisah dari metrik bobot WBS.','Jumlahkan kuantitas output pada rekap Capaian K-Wide; jangan gunakan bobot hari WBS sebagai denominator.'],
['Cut-off / snapshot TW','Arsip angka capaian yang dikunci pada batas pelaporan triwulan.','Menjaga laporan historis tidak berubah akibat validasi belakangan atau Change Request.','Ambil rekap historis TW yang bersangkutan; TW berjalan dihitung dari WBS, lalu disimpan sebagai snapshot saat cut-off.'],
['Status Validasi Bukti','Penanda diterima/tidaknya bukti dukung penyelesaian item WBS.','Menjamin realisasi yang dilaporkan telah diverifikasi.','Hanya item dengan status validasi "Sudah" yang menambah realisasi capaian WBS.']
];
var blocks=[
{title:'01 · Bobot dan kode program item WBS',src:'Kompilasi',goal:'Menentukan satuan bobot serta pengelompokan per program.',desc:'Gunakan tanggal Excel yang valid; kode program dapat diambil dari bagian awal Code sebelum tanda hubung.',formula:'=IF(OR([@Start]="";[@Finish]="");0;MAX(0;[@Finish]-[@Start]+1))\n=LEFT([@Code];FIND("-";[@Code])-1)',sample:'Jika Start 1 Januari dan Finish 31 Maret, bobot = 90 hari kalender.'},
{title:'02 · Target dan realisasi TW per T-Program',src:'Kompilasi → Capaian T-Program',goal:'Menjumlahkan bobot target dan realisasi tiap program pada TW tertentu.',desc:'Contoh TW II memakai kolom kumulatif Target Jun dan Real Jun; A2 berisi kode program (mis. OA). Realisasi wajib lolos validasi bukti.',formula:'Target TW II:\n=SUMIFS(tblWBS[Target Jun];tblWBS[Program];$A2)\n\nRealisasi TW II:\n=SUMIFS(tblWBS[Real Jun];tblWBS[Program];$A2;tblWBS[Status Validasi];"Sudah")',sample:'OA: target 6.942 dan realisasi 7.392. Capaian mentah = 106,48%; capaian pelaporan TW II = 100%.'},
{title:'03 · Capaian TW mentah dan batas pelaporan',src:'Capaian T-Program; aturan batas pelaporan aplikasi',goal:'Menghitung perbandingan yang benar dan memisahkan angka mentah dari capaian yang dibatasi.',desc:'Contoh: B2 = target TW, C2 = realisasi TW, D1 = nomor TW. Formatkan sel hasil sebagai Persentase. Batas tidak mengubah bobot realisasi/target.',formula:'Mentah:\n=IF(B2=0;"";C2/B2)\n\nPelaporan:\n=IF(B2=0;"";MIN(C2/B2;IF($D$1<=2;100%;120%)))',sample:'TW II total: 34.589 ÷ 33.664 = 102,75% mentah → 100% pelaporan. TW III dan IV dibatasi 120%.'},
{title:'04 · Ringkasan per TW: total lintas T-Program',src:'Capaian T-Program (baris Total)',goal:'Membentuk total Kemenkeu untuk setiap TW berdasarkan program yang masuk lingkup periode tersebut.',desc:'Jumlahkan bobot target dan realisasi program yang termasuk cakupan laporan. Jangan menjumlahkan atau merata-ratakan persentase antarprogram.',formula:'Target Total TW II:\n=SUM(B2:B6)\n\nRealisasi Total TW II:\n=SUM(C2:C6)\n\nCapaian Total TW II:\n=IF(SUM(B2:B6)=0;"";MIN(SUM(C2:C6)/SUM(B2:B6);100%))',sample:'Rekap TW II terbaru: target 33.664; realisasi 34.589; capaian mentah 102,75%, pelaporan 100%. Lima program pada rekap tersebut menjadi cakupan Total.'},
{title:'05 · Capaian tahunan dari realisasi TW',src:'Capaian T-Program; Capaian per UE1',goal:'Menunjukkan kemajuan terhadap keseluruhan target tahun berjalan.',desc:'Gunakan realisasi TW sebagai pembilang dan target tahunan sebagai pembagi, bukan target TW. Tidak memakai pembatasan capaian TW kecuali aturan IKU mengaturnya tersendiri.',formula:'Target tahunan per program:\n=SUMIFS(tblWBS[Target Dec];tblWBS[Program];$A2)\n\nCapaian tahunan:\n=IF(D2=0;"";C2/D2)',sample:'Total rekap TW II terbaru: 34.589 ÷ 95.885 = 36,07% capaian tahunan.'},
{title:'06 · Capaian per UE I (berdasarkan cakupan)',src:'Kompilasi → Capaian per UE1',goal:'Menghitung bobot target dan realisasi untuk masing-masing UE I.',desc:'Contoh DJPb, dengan kolom cakupan DJPb berisi "Ya". Ubah nama kolom unit untuk UE I lain. WBS lintas unit dapat dihitung pada lebih dari satu UE I.',formula:'Target DJPb TW II:\n=SUMIFS(tblWBS[Target Jun];tblWBS[DJPb];"Ya")\n\nRealisasi DJPb TW II:\n=SUMIFS(tblWBS[Real Jun];tblWBS[DJPb];"Ya";tblWBS[Status Validasi];"Sudah")\n\nCapaian TW II (pelaporan):\n=IF(B2=0;"";MIN(C2/B2;100%))',sample:'Per UE I memakai cakupan item WBS, bukan hanya UIC Utama. Total semua UE I dapat melampaui total Kemenkeu karena ada item lintas unit.'},
{title:'07 · Capaian K-Wide berbasis output IKU',src:'Capaian K-Wide (rekap manual IKU)',goal:'Menilai output terukur suatu T-Program pada TW tertentu, terpisah dari capaian WBS.',desc:'Contoh A2 = program dan B1 = nomor TW (2 untuk TW II). Kolom "Jumlah Target" dan "Jumlah Realisasi" berisi kuantitas output; status bukti WBS dapat diaudit sebagai informasi pendukung.',formula:'Target output per program/TW:\n=SUMIFS(tblKWide[Jumlah Target];tblKWide[Program];$A2;tblKWide[TW];$B$1)\n\nRealisasi output per program/TW:\n=SUMIFS(tblKWide[Jumlah Realisasi];tblKWide[Program];$A2;tblKWide[TW];$B$1)\n\nCapaian K-Wide:\n=IF(B2=0;"";C2/B2)',sample:'Jika target output = 5 dan realisasi output = 4, capaian K-Wide = 80%. Jangan membaginya dengan bobot WBS. Batas 100/120% WBS tidak diterapkan otomatis pada IKU K-Wide.'},
{title:'08 · Cut-off historis dan data TW berjalan',src:'Capaian T-Program; Capaian per UE1; snapshot aplikasi',goal:'Mencegah realisasi baru mengubah laporan historis.',desc:'Angka per TW yang sudah ditutup harus berasal dari rekap TW pada saat pelaporan, sedangkan TW berjalan dihitung dari WBS terkini. Formula SUMIFS di atas dipakai untuk menghitung periode sebelum snapshot, bukan merekonstruksi masa lalu menggunakan validasi hari ini.',formula:'Untuk TW yang ditutup:\n=Realisasi_Arsip_TW/Target_Arsip_TW\n\nUntuk TW berjalan:\n=SUMIFS(Real_Bulan_TW;...;"Sudah") /\n SUMIFS(Target_Bulan_TW;...)',sample:'TW II 2026 memakai rekap terbaru 33.664 / 34.589, bukan angka 33.907 / 41.897 dari workbook versi sebelumnya.'}
];
function render(){addStyle();
var q2=window.WBS_CAP_REFERENSI_2026&&window.WBS_CAP_REFERENSI_2026['2026-2'],x=q2&&q2.tot;
var sample=x?'<div class="tr-ref-example"><b>Rekap terkini TW II 2026:</b> '+num(x[1])+' realisasi ÷ '+num(x[0])+' target = '+decimal(x[1]/x[0]*100)+'% mentah → <b>100% pelaporan</b>; target tahunan '+num(x[2])+' (capaian tahunan '+decimal(x[1]/x[2]*100)+'%).</div>':'';
return '<div class="tr-ref">'+
 '<div class="tr-ref-hero"><div class="tr-ref-kicker">Cheatsheet · Referensi</div><h3>Istilah, tujuan, cara kerja & rumus capaian</h3><p>Referensi praktis untuk membaca WBS, T-Program, UE I, dan K-Wide. Penjelasan membedakan sumber data, satuan pengukuran, serta batas capaian pelaporan.</p></div>'+
 '<div class="tr-ref-alert"><b>Dasar rumus:</b> contoh rumus di bawah adalah <b>padanan formula Excel</b> menggunakan nama tabel <b>tblWBS</b> (sheet Kompilasi) dan <b>tblKWide</b> (sheet Capaian K-Wide). Bukan klaim alamat sel persis pada file sumber. Kolom <b>Program</b> adalah kolom bantu turunan kode WBS, dan pemisah argumen <b>;</b> mengikuti setelan Excel Indonesia. Ubah nama tabel/kolom sesuai workbook.</div>'+
 '<input class="sk-search tr-ref-filter" type="search" data-skfilter placeholder="Cari istilah, mis. K-Wide, UE I, target TW, SUMIFS..." aria-label="Cari referensi dan rumus">'+
 '<h4>Apa perbedaan empat tampilan capaian?</h4>'+
 '<div class="tr-ref-summary">'+
 '<div><b>Ringkasan per Triwulan</b><p>1 angka total tiap TW, hasil penggabungan program yang masuk cakupan pelaporan.</p></div>'+
 '<div><b>Rincian per T-Program</b><p>Angka per program untuk setiap TW. <b>Formula sama</b>, yang berbeda hanya pengelompokan.</p></div>'+
 '<div><b>Capaian per UE I</b><p>Hasil pengelompokan item WBS sesuai kolom cakupan unit; tidak selalu aditif antarunit.</p></div>'+
 '<div><b>Capaian K-Wide</b><p>Mengukur jumlah output IKU yang tercapai. Satuan berbeda dari bobot hari WBS.</p></div>'+
 '</div>'+sample+
 '<h4>Glosarium: pengertian, tujuan & cara kerja</h4>'+
 '<div class="tr-ref-tablewrap"><table class="tr-ref-table"><thead><tr><th>Istilah</th><th>Pengertian</th><th>Tujuan</th><th>Cara kerja</th></tr></thead><tbody>'+
 terms.map(function(t){return '<tr class="sk-filtered" data-skitem="'+h(t.join(' ').toLowerCase())+'"><td><strong>'+h(t[0])+'</strong></td><td>'+h(t[1])+'</td><td>'+h(t[2])+'</td><td>'+h(t[3])+'</td></tr>'}).join('')+
 '</tbody></table></div>'+
 '<h4>Rumus Excel dan contoh perhitungan</h4>'+
 '<p style="color:#566f87;font-size:11.6px;line-height:1.6;margin:0 0 10px">Buka masing-masing rumus untuk melihat asal sheet, tujuan, cara menghitung, dan contoh. Pada TW I gunakan <b>Target Mar / Real Mar</b>; TW II <b>Jun</b>; TW III <b>Sep</b>; TW IV <b>Dec</b>.</p>'+
 blocks.map(function(b,i){return '<details class="tr-ref-fm sk-filtered" data-skitem="'+h((b.title+' '+b.src+' '+b.goal+' '+b.desc+' '+b.formula).toLowerCase())+'"'+(i===2?' open':'')+'><summary><b>'+h(b.title)+'</b><span>'+h(b.src)+'</span></summary><div class="tr-ref-detail"><dl><dt>Sumber</dt><dd>'+h(b.src)+'</dd><dt>Tujuan</dt><dd>'+h(b.goal)+'</dd><dt>Cara kerja</dt><dd>'+h(b.desc)+'</dd><dt>Padanan Excel</dt><dd><pre class="tr-ref-formula">'+h(b.formula)+'</pre></dd></dl><div class="tr-ref-example"><b>Contoh:</b> '+h(b.sample)+'</div></div></details>'}).join('')+
 '<div class="tr-ref-source"><b>Catatan versi:</b> Referensi 2026 menggunakan workbook WBS Transformation Program 2026 (8)(1) untuk TW I dan III, serta rekap TW II terbaru yang diberikan pada 7 November 2026. Aturan pelaporan maksimum 100% (TW I–II) dan 120% (TW III–IV) merupakan batas tampilan aplikasi; pisahkan dari persentase mentah Excel. Hasil IKU K-Wide tidak otomatis mengikuti batas tersebut.</div>'+
 '</div>';
}
window.txFormulaReferenceHtml=render;
window.txFormulaReferenceVersion='2026-11-07-formula-glossary-1';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addStyle);else addStyle();
})();
/* UI global — tab sekunder seragam WBS & Progres, 2026-11-07 */
;(function(){
 function loadUnifiedTabs(){
  if(document.getElementById('mt-unified-tabs-styles'))return;
  var el=document.createElement('link');
  el.id='mt-unified-tabs-styles';el.rel='stylesheet';
  el.href='ui-tabs-unified.css?v=20261114-nav1';
  document.head.appendChild(el);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadUnifiedTabs,{once:true});
 else loadUnifiedTabs();
})();

/* Tab seragam — bridge iframe Dashboard CM */
;(function(){
 function inject(frame){
  try{
   var d=frame.contentDocument;
   if(!d||!d.head||!d.documentElement)return;
   d.documentElement.classList.add('mt-ui-embedded');
   if(d.getElementById('mt-unified-tabs-styles'))return;
   var l=d.createElement('link');l.id='mt-unified-tabs-styles';l.rel='stylesheet';
   l.href='ui-tabs-unified.css?v=20261114-nav1';d.head.appendChild(l);
  }catch(e){/* iframe lintas origin: tidak diubah */ }
 }
 function bind(){
  document.querySelectorAll('iframe.mt-cm-frame').forEach(function(frame){
   if(frame.dataset.mtTabsBridge)return;
   frame.dataset.mtTabsBridge='1';
   frame.addEventListener('load',function(){inject(frame)});
   if(frame.contentDocument&&frame.contentDocument.readyState==='complete')inject(frame);
  });
 }
 function start(){
  bind();
  var obs=new MutationObserver(function(muts){
   if(muts.some(function(m){
    return Array.from(m.addedNodes||[]).some(function(n){
     return n.nodeType===1&&(n.matches&&n.matches('iframe.mt-cm-frame')||n.querySelector&&n.querySelector('iframe.mt-cm-frame'));
    });
   }))bind();
  });
  obs.observe(document.body,{childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
