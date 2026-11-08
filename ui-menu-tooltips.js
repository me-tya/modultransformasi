/* Tooltip navigasi lintas Modul Transformasi.
 * Satu elemen overlay untuk sidebar, submenu, tab dan subtab dinamis.
 * Tidak mengubah ukuran header, letak tab, navigasi, hak akses, atau data.
 */
(function(){
'use strict';
if(window.MT_MENU_TOOLTIP_READY)return;
window.MT_MENU_TOOLTIP_READY=true;
var COMMON='Akses, penyuntingan, dan keputusan tetap mengikuti kewenangan pengguna serta tahap proses. Membuka tab bukan persetujuan atau penetapan.';
var ROUTES={
 'beranda':['Menampilkan tugas, agenda, dan pemberitahuan yang relevan dengan pengguna.','Ringkasan bukan pengganti pemutakhiran data pada modul sumber.'],
 'dashboard':['Mengonsolidasikan perkembangan portofolio transformasi, capaian, dan area yang membutuhkan perhatian.','Ringkasan mengikuti data yang telah dilaporkan/tersimpan; tidak menetapkan proyek maupun memperbaiki sumber data.'],
 'project-selection':['Menyiapkan usulan program, proyek, prioritas, charter, dan penetapan program beserta proyeknya.','Belum menjadi WBS aktif sampai proses penetapan dan perencanaan Project Management dilakukan.'],
 'pmo-siklus':['Menampilkan gambaran status, pekerjaan, dan capaian transformasi lintas program.','Data berasal dari modul pelaksanaan; bukan tempat menetapkan perubahan baseline.'],
 'pmo-program':['Melihat program dan proyek beserta status, cakupan, dan akses ke workspace.','Proyek yang belum ditetapkan tidak otomatis menjadi pekerjaan WBS aktif.'],
 'pmo-perencanaan':['Mengelola tujuh bagian Dokumen Proyek: As-is, To-be, Perbandingan, Charter, Kriteria, Manfaat, dan Linimasa.','Dokumen yang disusun masih memerlukan proses reviu/penetapan sesuai kewenangan.'],
 'pmo-wbsplan':['Menguraikan WBS, penanggung jawab, jadwal, bobot, dan paket pekerjaan.','Perubahan terhadap baseline yang telah disahkan harus melalui pengendalian perubahan.'],
 'pmo-wbs':['Memutakhirkan pelaksanaan WBS dan memantau progres terhadap rencana.','Progres tidak boleh menggantikan validasi bukti atau persetujuan perubahan baseline.'],
 'pmo-bukti':['Mengunggah dan memvalidasi bukti penyelesaian pekerjaan/proyek.','Bukti belum tervalidasi tidak otomatis dihitung sebagai realisasi yang sah.'],
 'pmo-cr':['Mengusulkan, menelaah, dan mencatat persetujuan Change Request.','Perubahan jadwal, biaya, atau lingkup tidak berlaku sebagai baseline baru sebelum disetujui.'],
 'pmo-milestone':['Memantau tonggak utama dan ketepatan jadwal proyek.','Milestone bukan pengganti rincian WBS dan bukti dukung pelaksanaan.'],
 'pmo-risiko':['Mencatat risiko, isu, mitigasi, pemilik risiko, dan tindak lanjut.','Risiko potensial berbeda dari isu yang telah terjadi; bukan proses persetujuan perubahan.'],
 'pmo-laporan':['Meninjau rekap capaian triwulanan dan penyimpangan pelaksanaan.','Capaian mengikuti data WBS dan validasi sumber, bukan angka yang ditetapkan terpisah.'],
 'pmo-narasi':['Menyusun narasi perkembangan program untuk pelaporan pelaksanaan.','Narasi tidak mengubah capaian WBS ataupun keputusan penetapan.'],
 'pmo-oneonone':['Mengelola jadwal dan tindak lanjut koordinasi PMO dengan unit.','Pertemuan bukan pengganti telaah, validasi, atau persetujuan formal.'],
 'pmo-penutupan':['Menelaah dan memproses penutupan proyek sesuai kriteria penyelesaian.','Penutupan memerlukan keputusan/analisis PMO; tidak otomatis menutup change management.'],
 'pmo-pascaproyek':['Mengevaluasi manfaat pascaproyek, termasuk efisiensi biaya, proses bisnis, dan layanan.','Evaluasi dilakukan setelah penutupan sesuai ketentuan; berbeda dari monitoring progres WBS.'],
 'pmo-referensi':['Mengakses standar kode, tahapan, dan referensi untuk konsistensi data proyek.','Referensi bukan modul pemutakhiran progres atau persetujuan proyek.'],
 'cmo-adp':['Menganalisis perubahan As-is/To-be, dampak POSTeR, risiko, dan indikator keberhasilan.','Hasil analisis menjadi dasar rencana perubahan, bukan otomatis persetujuan implementasi.'],
 'cmo-rencana':['Menyusun peta stakeholder, strategi komunikasi, dan strategi pelatihan.','Strategi belum membuktikan kegiatan terlaksana atau tingkat adopsi tercapai.'],
 'cmo-jaringan':['Mengelola sponsor, Change Champion, T-Agent, penugasan, dan aktivasi jaringan.','Penetapan penugasan mengikuti otoritas; jaringan bukan pengganti pemilik proses bisnis.'],
 'cmo-cra':['Mengukur kesiapan pengguna dan menyusun intervensi tindak lanjut.','Hasil asesmen adalah masukan kesiapan, bukan jaminan adopsi maupun keputusan go-live.'],
 'cmo-pelaksanaan':['Mencatat realisasi komunikasi, pelatihan, aktivasi, dan bukti intervensi.','Kegiatan terlaksana tidak otomatis berarti pengguna telah mengadopsi perubahan.'],
 'cmo-monev':['Memantau efektivitas intervensi, adopsi, indikator, dan tindak lanjut perubahan.','Monev CMO bukan pelaporan progres WBS atau pengendalian baseline proyek.'],
 'cmo-pasca':['Mengevaluasi keberlanjutan adopsi dan masalah pascaimplementasi.','Dilaksanakan sesuai jadwal evaluasi; berbeda dari evaluasi manfaat pascaproyek PMO.'],
 'cmo-closing':['Menilai kesiapan penutupan pendampingan dan alih tanggung jawab operasional.','Penutupan perubahan tidak sama dengan penutupan proyek; dukungan layanan harus siap.'],
 'aktivitas':['Mengelola agenda kegiatan PMO/CMO, ringkasan, matriks, serta susunan tim.','Kehadiran atau penjadwalan tidak otomatis membuktikan hasil intervensi maupun capaian proyek.'],
 'pengelola':['Melihat dan mengelola tim, penugasan, serta peran pengelolaan transformasi.','Penugasan dan kewenangan mengikuti aturan organisasi; tidak menetapkan proyek.'],
 'set-pengguna':['Mengelola akun dan data pengguna yang diberi akses.','Hak perubahan bergantung peran administrator.'],
 'set-akses':['Mengelola hak akses berdasarkan peran pengguna.','Perubahan akses tidak mengubah keputusan penetapan atau data historis.'],
 'set-sinkron':['Mengelola aturan sinkronisasi antardata CM.','Sinkronisasi bukan pengesahan isi atau mutu data.'],
 'set-log':['Meninjau jejak aktivitas dan perubahan data.','Log audit adalah referensi penelusuran, bukan tempat mengubah riwayat.'],
 'set-db':['Mengelola konfigurasi dan status penyimpanan data.','Pengaturan database khusus pengelola berwenang, bukan menu operasional pengguna.']
};
var PRIMARY={
 'usulan':['Membuat dan melengkapi usulan program serta dokumen pendukung.','Usulan masih konsep sampai melalui proses penetapan program.'],
 'mapping':['Mengambil riwayat proyek dan mengelola proyek yang diusulkan pada program tujuan.','Salinan tidak membawa WBS atau realisasi historis menjadi aktif.'],
 'prioritasi':['Menilai, membandingkan, dan memeringkat calon proyek secara manual atau SMART.','Skor adalah dasar pertimbangan; tidak secara otomatis menetapkan proyek.'],
 'charter':['Menyusun charter dan dokumen perencanaan program/proyek.','Dokumen rancangan belum menjadi baseline tanpa persetujuan.'],
 'penetapan-program':['Mencatat kontrak kinerja K-Wide dan menetapkan program beserta proyek terpilih.','Penetapan memerlukan kelengkapan dan kewenangan; WBS baru disusun sesudahnya.'],
 'rkmk':['Menyusun, memeriksa, dan menyimpan rancangan narasi RKMK.','Narasi awal perlu direviu; bukan dokumen yang otomatis disahkan.']
};
var BANK={
 'bank':['Menampilkan riwayat program dan menyalinnya menjadi usulan tahun aktif.','Data sumber historis tidak dapat diedit dan tidak boleh tertimpa.'],
 'detail':['Menyusun, mengubah, dan melengkapi daftar usulan program.','Tidak otomatis menetapkan kontrak K-Wide maupun proyek.'],
 'portfolio':['Menyusun dokumen portofolio dari data program yang tersedia.','Dokumen bukan pengganti penetapan kontrak atau keputusan proyek.']
};
var SCOPE={
 'history':['Menemukan proyek lintas tahun dan mengambil salinan ke program tujuan.','WBS dan realisasi sumber tetap utuh; salinan adalah usulan baru.'],
 'proposal':['Melengkapi identitas dan karakteristik proyek yang diusulkan.','WBS pelaksanaan dikelola setelah penetapan pada Project Management.'],
 'results':['Meninjau hasil pemetaan dan status keanggotaan proyek pada program.','Perubahan program tujuan tidak memindahkan bukti atau WBS historis.'],
 'docs':['Membuat dokumen usulan proyek berdasarkan rincian terpilih.','Dokumen usulan tidak otomatis berarti proyek telah ditetapkan.']
};
var PRIORITY={
 'ranking':['Menilai calon proyek, membandingkan skor, serta melihat urutan prioritas.','Skor/kuadran hanya masukan keputusan; bukan persetujuan proyek.'],
 'criteria':['Meninjau dan menyesuaikan kriteria serta bobot SMART.','Mengubah bobot dapat mengubah pemeringkatan; tidak mengubah WBS.'],
 'monev':['Melihat indikator dan manfaat yang direncanakan dalam konteks seleksi.','Pemantauan realisasi WBS dan evaluasi manfaat pascaimplementasi dikelola di Project Management.'],
 'reference':['Memahami metode penilaian, bobot, ambang, dan formula.','Rujukan perhitungan tidak menggantikan kebijakan persetujuan program.']
};
var CHARTER={
 'asis':['Mendokumentasikan kondisi proses bisnis, sistem, dan teknologi saat ini.','Deskripsi awal perlu konfirmasi pemilik proses bisnis.'],
 'tobe':['Menjabarkan kondisi proses bisnis dan layanan yang dituju.','Rancangan target tidak otomatis menjadi keputusan implementasi.'],
 'cs':['Membandingkan kondisi As-is dan To-be serta kesenjangan.','Analisis kesenjangan belum merupakan persetujuan solusi.'],
 'ch':['Menetapkan isi rancangan charter: tujuan, ruang lingkup, sponsor, dan tata kelola.','Rancangan charter memerlukan reviu dan pengesahan.'],
 'kp':['Mendefinisikan kriteria penyelesaian yang dapat diverifikasi.','Pemenuhan kriteria dibuktikan pada tahap pelaksanaan/penutupan.'],
 'mf':['Menetapkan manfaat, indikator, baseline, dan target yang diharapkan.','Target manfaat bukan realisasi manfaat.'],
 'rk':['Menyusun linimasa, milestone, dan penanggung jawab.','Perubahan baseline setelah ditetapkan mengikuti Change Request.'],
 'rv':['Memeriksa kelengkapan seluruh bagian sebelum pengajuan.','Reviu internal tidak otomatis berarti dokumen sudah disahkan.'],
 'id':['Mengisi identitas program/proyek dan unit pengelola.','Identitas harus konsisten dengan register resmi.'],
 'isi':['Mengisi isi charter dan keluaran yang direncanakan.','Belum menggantikan keputusan pengesahan.'],
 'ms':['Mengisi milestone, risiko, dan dependensi awal.','Bukan pencatatan realisasi WBS.']
};
var CRA={
 'create':['Menyusun konfigurasi, bank pertanyaan, dan rancangan survei kesiapan.','Survei yang masih konsep tidak mengumpulkan respons sampai diaktifkan.'],
 'active':['Melihat survei aktif dan memantau respons.','Persentase respons tidak otomatis menunjukkan kesiapan memadai.'],
 'analytics':['Menganalisis skor, dimensi kesiapan, dan kesenjangan.','Hasil survei merupakan masukan intervensi, bukan keputusan go-live.'],
 'actions':['Menyusun rencana aksi dari kesenjangan kesiapan.','Rencana aksi belum berarti tindak lanjut telah dilaksanakan.'],
 'compare':['Membandingkan hasil survei kesiapan antarperiode.','Perbandingan memerlukan cakupan responden dan instrumen yang sebanding.'],
 'history':['Melihat survei yang telah ditutup beserta hasil terdahulu.','Riwayat adalah arsip; bukan tempat mengubah respons lampau.']
};
var ACTIVITY={
 'daftar':['Menampilkan dan mengelola daftar kegiatan transformasi.','Status kegiatan bukan otomatis realisasi output proyek.'],
 'overview':['Melihat rekap agregat dan tren aktivitas.','Angka mengikuti daftar kegiatan yang tercatat.'],
 'matriks':['Menganalisis sebaran kegiatan berdasarkan dimensi matriks.','Analisis bukan penetapan tugas atau bukti realisasi.'],
 'timk':['Melihat tim PMO/CMO Kementerian Keuangan.','Kewenangan mengikuti penugasan yang berlaku.'],
 'timu':['Melihat tim PMO/CMO pada unit kerja.','Daftar tidak menggantikan dokumen penugasan resmi.']
};
var PLAIN={
 'riwayat program':BANK.bank,
 'daftar program':BANK.detail,
 'buat dokumen portofolio':BANK.portfolio,
 'riwayat proyek':SCOPE.history,
 'usulan proyek':SCOPE.proposal,
 'hasil pemetaan':SCOPE.results,
 'buat dokumen usulan proyek':SCOPE.docs,
 'penilaian & peringkat':PRIORITY.ranking,
 'kriteria & bobot':PRIORITY.criteria,
 'monev & manfaat':PRIORITY.monev,
 'referensi & formula':PRIORITY.reference,
 'identitas':CHARTER.id,
 'as-is':CHARTER.asis,
 'to-be':CHARTER.tobe,
 'perbandingan':CHARTER.cs,
 'charter':CHARTER.ch,
 'kriteria':CHARTER.kp,
 'manfaat':CHARTER.mf,
 'linimasa':CHARTER.rk,
 'tinjau & ajukan':CHARTER.rv,
 'business case':['Menyusun alasan, alternatif, biaya, dan manfaat usulan program.','Analisis belum merupakan persetujuan anggaran atau proyek.'],
 'stakeholder':['Mengidentifikasi pihak terdampak dan peran dalam program.','Pemetaan belum menggantikan persetujuan pihak terkait.'],
 'risiko':['Mendata risiko dan penanganannya.','Belum menggantikan register risiko pelaksanaan.'],
 'tata kelola':['Menjelaskan pengelola, pembagian peran, dan mekanisme keputusan.','Kewenangan formal tetap mengikuti penugasan/aturan yang berlaku.'],
 'reviu':['Memeriksa data dan dokumen sebelum diajukan.','Hasil reviu bukan pengesahan otomatis.'],
 'dokumen':['Menyusun atau melihat dokumen yang berkaitan dengan tahap aktif.','Status dokumen mengikuti proses persetujuan masing-masing.'],
 'monev':['Meninjau indikator dan tindak lanjut sesuai modul aktif.','Tidak otomatis menggantikan pencatatan pada modul sumber.'],
 'ringkasan':['Menampilkan informasi kunci untuk bagian yang dipilih.','Ringkasan bukan pengganti rincian dokumen atau data sumber.'],
 'daftar':['Menampilkan data pada modul aktif.','Perubahan mengikuti hak akses dan ketentuan proses.'],
 'overview':['Menampilkan rekap dan indikator utama modul.','Rekap tidak menggantikan rincian sumber.'],
 'perencanaan':['Menyusun rencana sesuai tahapan modul aktif.','Rencana belum menjadi bukti bahwa pekerjaan telah dilaksanakan.'],
 'pelaksanaan':['Meninjau dan mencatat kegiatan yang telah dilaksanakan.','Realisasi memerlukan bukti dan validasi sesuai proses.'],
 'penutupan':['Meninjau persyaratan dan mengusulkan penutupan proses.','Penutupan bukan otomatis setelah target progres tercapai.'],
 'pascaproyek':ROUTES['pmo-pascaproyek'],
 'referensi':['Membaca standar dan acuan proses.','Referensi tidak mengubah data operasional.'],
 'panduan':['Mempelajari alur dan petunjuk penggunaan aplikasi.','Panduan bukan otorisasi untuk melakukan tindakan.']
};
function norm(v){return String(v||'').replace(/[\u00a0\u200b]/g,' ').replace(/^\s*\d+\s*/, '').replace(/\s+\d+\s*$/, '').replace(/\s+/g,' ').trim().toLowerCase();}
function labelOf(el){
 var copy=el.cloneNode(true);
 var numbers=copy.querySelectorAll('em,.sb,.cm-step-number,.new,.badge,.psbank-count,.psbank-subtabs b,.ps27-tabs b');
 for(var i=0;i<numbers.length;i++)numbers[i].remove();
 return String(copy.textContent||el.getAttribute('aria-label')||'').replace(/^\s*[\d❶❷❸❹❺❻❼]\s*/, '').replace(/\s+/g,' ').trim();
}
function lookup(el,label){
 var data=el.dataset||{},key,n=norm(label);
 if(data.ext!==undefined)return ['Membuka menu Satu Kemenkeu di luar modul Transformasi.','Fitur ini berada di luar cakupan prototipe dan mungkin belum dapat digunakan.'];
 if(data.nav!==undefined)return ['Membuka atau menutup kelompok navigasi '+label+'.','Hanya mengubah tampilan menu, bukan data maupun penetapan transformasi.'];
 if(data.ps27Tab!==undefined)return PRIMARY[data.ps27Tab]||null;
 if(data.bankTab!==undefined)return BANK[data.bankTab]||null;
 if(data.scopeTab!==undefined)return SCOPE[data.scopeTab]||null;
 if(data.ps27Sub!==undefined)return PRIORITY[data.ps27Sub]||null;
 if(data.ps27Usul!==undefined)return ({daftar:BANK.detail,ambil:BANK.bank,detail:BANK.detail})[data.ps27Usul]||null;
 if(data.pswfTab!==undefined)return ({projects:PRIORITY.ranking,criteria:PRIORITY.criteria,monev:PRIORITY.monev,reference:PRIORITY.reference})[data.pswfTab]||PLAIN[n]||null;
 if(data.bankWtab!==undefined)return ({identity:CHARTER.id,case:PLAIN['business case'],benefits:CHARTER.mf,stakeholders:PLAIN.stakeholder,risks:PLAIN.risiko,governance:PLAIN['tata kelola'],docs:PLAIN.dokumen})[data.bankWtab]||null;
 if(data.ps27==='wide-quarter')return ['Menampilkan dan mengedit target serta realisasi '+label+' pada kontrak K-Wide.','Perpindahan triwulan bukan penetapan; konsep perlu disimpan dan kontrak dicatat.'];
 if(data.act==='actTab')return ACTIVITY[data.v]||null;
 if(data.act==='dxTab')return ({peta:['Melihat sebaran modul dan capaian per triwulan.','Capaian bersumber dari data WBS yang tercatat.'],perhatian:['Menemukan proyek yang perlu perhatian atau terlambat.','Indikator bukan keputusan penutupan atau perubahan baseline.'],ringkas:ROUTES.dashboard})[data.v]||null;
 if(data.act==='chtab'||data.act==='chws')return CHARTER[data.v]||null;
 if(data.cra2==='tab')return CRA[data.v]||null;
 if(data.pg==='tab')return data.val==='program'
  ?['Melihat pengelola dan penanggung jawab program transformasi.','Kewenangan program tetap mengikuti penugasan resmi dan hak akses.']
  :['Melihat daftar personel dan ketersediaan tim pengelola.','Data personel bukan persetujuan penugasan atau perubahan struktur organisasi.'];
 if(data.ps27Htab!==undefined||data.sktab!==undefined)return PLAIN[n]||['Membuka bagian '+label+' pada panduan/cheatsheet.','Informasi merupakan referensi penggunaan dan tidak mengubah data.'];
 if(el.closest('.pmo-journey')){
  var groups={'overview':ROUTES['pmo-siklus'],'workspace proyek':ROUTES['pmo-program'],'perencanaan':['Membuka dokumen dan penyusunan WBS tahap perencanaan proyek.','Dokumen masih memerlukan pengesahan; WBS pelaksanaan tidak berubah otomatis.'],'pelaksanaan':['Memantau WBS, bukti, narasi, dan Change Request selama pelaksanaan.','Perubahan baseline harus melalui proses persetujuan.'],'pemantauan':['Memantau milestone, risiko, capaian, serta koordinasi pelaporan.','Pemantauan tidak mengganti validasi WBS atau bukti.'],'penutupan':ROUTES['pmo-penutupan'],'pascaproyek':ROUTES['pmo-pascaproyek'],'referensi':ROUTES['pmo-referensi']};
  if(groups[n])return groups[n];
 }
 var href=el.getAttribute('href')||'';
 if(href.charAt(0)==='#'){
  var route=href.slice(1),m=route.match(/^modul-.+-t-(adp|rencana|jaringan|cra|pelaksanaan|monev|pasca|closing)$/);
  if(m)route='cmo-'+m[1];
  if(ROUTES[route])return ROUTES[route];
 }
 if(el.closest('.nav')&&n==='beranda')return ROUTES.beranda;
 if(el.closest('.nav')&&n==='pengaturan')return ['Mengakses pengaturan akun, peran, sinkronisasi, dan database.','Tindakan terbatas pada pengguna dengan izin yang sesuai.'];
 if(el.closest('.nav')&&n==='transformasi')return ['Membuka kelompok menu transformasi: dashboard, seleksi, proyek, perubahan, aktivitas, dan pengelola.','Hanya navigasi; bukan proses pengajuan/penetapan.'];
 if(el.closest('.nav'))return ['Membuka '+label+' pada navigasi Satu Kemenkeu.','Fitur mengikuti hak akses dan cakupan prototipe; tidak otomatis memengaruhi data transformasi.'];
 if(el.closest('.cm-journey'))return ROUTES['cmo-'+(href.split('-t-').pop()||'')]||PLAIN[n]||null;
 if(el.closest('.chtabs,.chebar'))return CHARTER[data.v]||PLAIN[n]||null;
 if(el.closest('.act-tabs'))return ACTIVITY[data.v]||PLAIN[n]||null;
 if(el.closest('[role="tablist"]')||el.getAttribute('role')==='tab')return PLAIN[n]||null;
 return null;
}
var selector=['#app .nav .nv','#app .ps27-tabs button','#app .psbank-subtabs button','#app .psbank-mapping-tabs button','#app .ps27-minitabs button','#app .ps27-kwide-tabs button','#app .pswf-tabs button','#app .ptabs a','#app .subt a','#app .subt button','#app .cm-step','#app .chtabs button','#app .chebar [role="tab"]','#app .act-tabs a','#app .cra-tabs button','#app .cra2-tabs button','#app .pg-tabs button','#app [role="tab"]','[role="tab"]','nav[role="tablist"] button','nav[role="tablist"] a','nav[class*="tabs"] button','nav[class*="tabs"] a','[data-sktab]','[data-ps27-htab]','.sk-tab'].join(',');
var tooltip=null,active=null,showTimer=0,previousTitle=null,previousDesc=null;
function targetFor(node){return node&&node.closest?node.closest(selector):null;}
function hide(){
 clearTimeout(showTimer);showTimer=0;
 if(active){
  if(previousTitle!==null&&active.isConnected)active.setAttribute('title',previousTitle);
  if(previousDesc!==null&&active.isConnected)active.setAttribute('aria-describedby',previousDesc);
  else if(active.isConnected)active.removeAttribute('aria-describedby');
 }
 active=null;previousTitle=null;previousDesc=null;
 if(tooltip)tooltip.hidden=true;
}
function ensure(){
 if(tooltip)return tooltip;
 var style=document.createElement('style');style.id='mt-navigation-tooltips-css';
 style.textContent='#mt-navigation-tooltip{position:fixed;z-index:290000;box-sizing:border-box;width:max-content;max-width:min(340px,calc(100vw - 20px));padding:10px 12px;color:#e9f3ff;background:#102c4e;border:1px solid #476783;border-top:3px solid #fdb913;border-radius:10px;box-shadow:0 8px 24px rgba(4,16,36,.24);pointer-events:none;font:500 12px/1.5 Inter,"Nunito Sans",Arial,sans-serif;white-space:normal}#mt-navigation-tooltip[hidden]{display:none!important}#mt-navigation-tooltip .mt-tip-label{font-size:12.5px;font-weight:800;color:#fff;margin:0 0 6px}#mt-navigation-tooltip .mt-tip-heading{display:block;font-size:10px;letter-spacing:.03em;text-transform:uppercase;font-weight:800;color:#ffd373;margin-top:6px}#mt-navigation-tooltip .mt-tip-body{font-size:11.5px;color:#e8f0fa}';
 document.head.appendChild(style);
 tooltip=document.createElement('div');tooltip.id='mt-navigation-tooltip';tooltip.setAttribute('role','tooltip');tooltip.hidden=true;
 tooltip.innerHTML='<div class="mt-tip-label"></div><span class="mt-tip-heading">Fungsi</span><div class="mt-tip-body" data-mt-tip-function></div><span class="mt-tip-heading">Batasan</span><div class="mt-tip-body" data-mt-tip-bound></div>';
 document.body.appendChild(tooltip);return tooltip;
}
function position(el){
 if(!tooltip||tooltip.hidden||!el.isConnected){hide();return}
 var r=el.getBoundingClientRect(),w=tooltip.offsetWidth,h=tooltip.offsetHeight;
 var left=Math.round(r.left+r.width/2-w/2),top=Math.round(r.bottom+8);
 if(el.closest('aside.side')){left=Math.round(r.right+9);top=Math.round(r.top)}
 if(left+w>window.innerWidth-8)left=window.innerWidth-w-8;
 if(left<8)left=8;
 if(top+h>window.innerHeight-8)top=Math.round(r.top-h-8);
 if(top<8)top=8;
 tooltip.style.left=left+'px';tooltip.style.top=top+'px';
}
function show(el){
 if(!el||!el.isConnected)return;
 var label=labelOf(el),spec=lookup(el,label),title=el.getAttribute('title'),aria=el.getAttribute('aria-label');
 if(!spec){
  var useful=title&&norm(title)!==norm(label)?title:aria&&norm(aria)!==norm(label)?aria:'';
  spec=[useful||'Menampilkan bagian '+label+' pada modul aktif.',COMMON];
 }
 var t=ensure();
 if(!active||active!==el)hide();
 active=el;
 previousTitle=el.hasAttribute('title')?el.getAttribute('title'):null;
 previousDesc=el.getAttribute('aria-describedby');
 if(previousTitle!==null)el.removeAttribute('title');
 el.setAttribute('aria-describedby',(previousDesc?previousDesc+' ':'')+t.id);
 t.querySelector('.mt-tip-label').textContent=label;
 t.querySelector('[data-mt-tip-function]').textContent=spec[0];
 t.querySelector('[data-mt-tip-bound]').textContent=spec[1];
 t.hidden=false;position(el);
}
function arm(el,delay){
 if(!el||el===active)return;
 hide();
 showTimer=setTimeout(function(){showTimer=0;show(el);},delay);
}
document.addEventListener('pointerover',function(ev){
 if(ev.pointerType==='touch')return;
 var el=targetFor(ev.target);
 if(el&&el!==active)arm(el,260);
});
document.addEventListener('pointerout',function(ev){
 var el=targetFor(ev.target);
 if(!el)return;
 if(ev.relatedTarget&&el.contains(ev.relatedTarget))return;
 if(el===active||showTimer)hide();
});
document.addEventListener('focusin',function(ev){
 var el=targetFor(ev.target);
 if(el)arm(el,70);
});
document.addEventListener('focusout',function(ev){
 if(active&&ev.target===active)hide();
});
document.addEventListener('keydown',function(ev){if(ev.key==='Escape')hide();});
document.addEventListener('scroll',hide,true);
window.addEventListener('resize',hide);
document.addEventListener('pointerdown',hide,true);
window.MT_MENU_TOOLTIP={hide:hide,resolve:lookup,version:'20261109-function-boundaries-v1'};
})();