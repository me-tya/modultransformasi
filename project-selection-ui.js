(function ProjectSelection(){
 'use strict';
 var criteria=[
  ['C1','Keselarasan Strategis',7,'Manfaat','Manual','Dukungan agenda transformasi, WBS, IKU, mandat Menteri'],
  ['C2','Skala Dampak (Jumlah Pengguna)',5,'Manfaat','Otomatis','Jumlah pengguna terdampak'],
  ['C3','Level Pengguna',5,'Manfaat','Manual','Cakupan internal, lintas K/L, atau nasional'],
  ['C4','Urgensi Waktu',6,'Manfaat','Otomatis','Jarak waktu menuju go-live'],
  ['C5','Gap Kesiapan Perubahan',5,'Manfaat','Otomatis','Hasil asesmen organisasi atau CRA'],
  ['C6','Tingkat Perubahan (POSTER)',3,'Manfaat','Otomatis','Proses, Organisasi, SDM, Teknologi, Regulasi'],
  ['C7','Kebutuhan Sumber Daya Tim CM',3,'Biaya','Manual','Orang-hari pendampingan per bulan'],
  ['C8','Nilai Manfaat (Efisiensi & Layanan)',6,'Manfaat','Bersyarat','Otomatis untuk tematik dari target SDM; selain itu penilaian manfaat'],
  ['C9','Keterukuran Manfaat',4,'Manfaat','Manual','Indikator, baseline, target, benefit owner'],
  ['C10','Kecepatan Realisasi Manfaat',4,'Manfaat','Manual','Waktu sejak go-live hingga manfaat terasa'],
  ['C11','Mitigasi Risiko & Kepatuhan',3,'Manfaat','Manual','Kontribusi pada risiko, audit, dan mandat regulasi'],
  ['C12','Tingkat Risiko Implementasi',4,'Biaya','Otomatis','Risiko resistensi, operasional, ketergantungan, lainnya']
 ];
 var lastFocus=null;
 var style=document.createElement('style');style.id='mt-project-selection-style';
 style.textContent=`
 #app .ps-page{display:flex;flex-direction:column;gap:12px;min-width:0;color:#102642;font-family:'Nunito Sans','Inter',system-ui,sans-serif}
 #app .ps-banner{position:relative;overflow:hidden;isolation:isolate;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;border:1px solid #235a8c;border-radius:18px;padding:20px 23px;background:linear-gradient(118deg,#0b2343 0%,#104c84 65%,#176ca1 100%);box-shadow:0 16px 28px rgba(13,50,90,.15);color:#fff}
 #app .ps-banner:before{content:'';position:absolute;z-index:-1;width:310px;height:310px;right:-60px;top:-135px;border-radius:50%;border:46px solid rgba(255,255,255,.045);box-shadow:0 0 0 60px rgba(255,255,255,.035)}
 #app .ps-banner:after{content:'';position:absolute;left:0;bottom:0;width:35%;height:4px;background:linear-gradient(90deg,#fdb913,#fbe6a4,transparent)}
 #app .ps-badge{display:inline-flex;align-items:center;gap:7px;padding:3px 9px;border-radius:20px;background:rgba(253,185,19,.15);color:#ffdc80;letter-spacing:.9px;font-size:10px;font-weight:900;text-transform:uppercase;border:1px solid rgba(255,218,115,.25)}
 #app .ps-banner h1{font-size:25px;line-height:1.2;color:#fff;margin:8px 0 4px;font-weight:900;letter-spacing:-.7px}
 #app .ps-banner p{max-width:720px;line-height:1.5;margin:0;color:#dce9fa;font-size:12.5px}
 #app .ps-actions{display:flex;gap:9px;flex-wrap:wrap;position:relative}
 #app .ps-btn{cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:10px;padding:10px 14px;font-weight:900;border:1px solid rgba(240,250,255,.3);background:rgba(255,255,255,.1);color:#fff;box-shadow:0 4px 12px rgba(4,24,44,.08);transition:.16s}
 #app .ps-btn:hover{background:rgba(255,255,255,.2);transform:translateY(-1px)}
 #app .ps-btn:focus-visible,.ps-overlay button:focus-visible{outline:3px solid #fdb913;outline-offset:3px}
 #app .ps-btn.gold{border-color:#fdb913;background:#fdb913;color:#0b2447}
 #app .ps-btn.gold:hover{background:#ffe09a}
 #app .ps-route{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
 #app .ps-stage{cursor:pointer;display:flex;align-items:center;gap:9px;border:1px solid #d5e2f2;background:linear-gradient(160deg,#fff,#f1f7ff);border-radius:12px;padding:10px 12px;text-align:left;color:#15385c;min-width:0;box-shadow:0 3px 9px rgba(21,63,110,.045);transition:.18s}
 #app .ps-stage:hover{border-color:#6b9ed3;background:#e8f3ff;transform:translateY(-1px)}
 #app .ps-stage .num{flex:none;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:#e3edfb;color:#164b83;font-weight:900;font-family:'JetBrains Mono',monospace}
 #app .ps-stage strong{font-size:12px;display:block;line-height:1.3;color:#123a66;font-weight:900}
 #app .ps-stage small{font-size:10.5px;display:block;color:#6b7f95;line-height:1.45}
 #app .ps-stage.is-active{background:linear-gradient(145deg,#ebf4ff,#fff);border-color:#1c65ab;box-shadow:inset 0 0 0 1px #1c65ab,0 4px 12px rgba(21,101,192,.09)}
 #app .ps-stage.is-active .num{background:#0d4074;color:#ffdb76}
 #app .ps-frame-wrap{background:#f7faff!important;border:1px solid #c9d9eb!important;border-radius:16px!important;box-shadow:0 12px 25px rgba(15,45,83,.075);overflow:hidden;position:relative}
 #app .ps-frame-wrap:before{content:'';display:block;height:4px;background:linear-gradient(90deg,#fdb913 0 24%,#125a9b 24% 78%,#33a4c4 78%)}
 #app .ps-frame{display:block;width:100%;border:0;height:calc(100vh - 240px);min-height:900px;background:#eef4fd}
 #app .ps-footnote{display:flex;gap:9px;align-items:flex-start;border:1px solid #cbdcf0;border-radius:10px;background:linear-gradient(100deg,#eef5ff,#f9fbff);color:#48627f;font-size:11.5px;padding:10px 12px}
 #app .ps-footnote b{color:#134778}
 .ps-overlay{position:fixed;z-index:200000;inset:0;background:rgba(5,20,40,.7);backdrop-filter:blur(5px);display:grid;place-items:center;padding:18px;font-family:'Nunito Sans','Inter',system-ui,sans-serif}
 .ps-dialog{display:flex;flex-direction:column;width:min(1020px,98vw);max-height:min(94vh,960px);overflow:hidden;border-radius:20px;background:linear-gradient(145deg,#eaf2ff,#f8fbff 38%,#fff);border:1px solid #b8cde7;box-shadow:0 30px 80px rgba(1,15,36,.4)}
 .ps-dialog-head{position:relative;overflow:hidden;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:22px 27px 20px;background:linear-gradient(116deg,#071f3d,#124b7e 65%,#176b9f);color:#fff;border-bottom:4px solid #fdb913}
 .ps-dialog-head:after{content:'';pointer-events:none;position:absolute;width:220px;height:220px;border-radius:50%;right:6%;top:-125px;border:35px solid rgba(255,255,255,.055)}
 .ps-dialog-head h2{margin:5px 0 3px;font-size:24px;line-height:1.2;font-weight:900;color:#fff}
 .ps-dialog-head p{margin:0;color:#d4e6f7;font-size:12px;line-height:1.45}
 .ps-eyebrow{font-size:10px;color:#ffdb7a;font-weight:900;letter-spacing:1.3px}
 .ps-close{flex:none;cursor:pointer;border-radius:11px;width:37px;height:37px;display:grid;place-items:center;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.35);color:white;font-size:24px}
 .ps-close:hover{background:rgba(255,255,255,.28)}
 .ps-tabbar{display:flex;gap:7px;flex-wrap:wrap;padding:12px 19px 0;border-bottom:1px solid #d2e0ef;background:linear-gradient(145deg,#eaf1fb,#f7faff)}
 .ps-tabbar button{cursor:pointer;border:1px solid transparent;border-radius:9px 9px 0 0;background:transparent;color:#476681;font-weight:800;padding:10px 13px;font-size:12px}
 .ps-tabbar button[aria-selected="true"]{color:#0d4275;background:#fff;border-color:#cfdeef;border-bottom-color:#fff;box-shadow:0 -2px 8px rgba(13,62,116,.04)}
 .ps-tabbar button:hover{color:#0d4d8b}
 .ps-dialog-body{overflow:auto;overscroll-behavior:contain;padding:20px 22px 26px;min-height:120px}
 .ps-panel[hidden]{display:none!important}
 .ps-intro{padding:16px 18px;background:linear-gradient(112deg,#e0edff,#f8fbff);border:1px solid #c0d6ef;border-left:5px solid #e6ac28;border-radius:13px;margin-bottom:14px}
 .ps-intro h3{margin:0 0 5px;color:#103e70;font-weight:900;font-size:17px}
 .ps-intro p{margin:0;color:#526980;font-size:12.5px;line-height:1.7}
 .ps-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
 .ps-card{position:relative;border:1px solid #d2e0f2;border-radius:13px;padding:15px 16px;background:linear-gradient(152deg,#fff,#f0f6ff);box-shadow:0 4px 12px rgba(18,61,105,.045)}
 .ps-card strong{display:block;color:#143e6b;font-size:13.5px;font-weight:900;margin-bottom:5px}
 .ps-card p{margin:0;color:#52677c;font-size:12px;line-height:1.65}
 .ps-kicker{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:9px;color:#fff;background:linear-gradient(145deg,#0d497f,#2473aa);font-weight:900;margin-right:7px}
 .ps-card .ps-action{margin-top:12px}
 .ps-action{display:inline-flex;align-items:center;gap:7px;border-radius:9px;padding:8px 11px;color:#0e4c84;background:#e4f0ff;border:1px solid #abc9eb;font-weight:900;cursor:pointer;font-size:11.5px}
 .ps-action:hover{background:#cfe5ff}
 .ps-steps{display:grid;gap:10px}
 .ps-steps article{display:flex;gap:12px;background:linear-gradient(120deg,#fff,#edf4ff);border:1px solid #d2e0f1;border-radius:12px;padding:12px 14px}
 .ps-steps article>span{width:30px;height:30px;flex:none;border-radius:10px;background:#134b80;color:#ffda7a;display:grid;place-items:center;font-weight:900}
 .ps-steps b{color:#133e67}
 .ps-steps p{margin:3px 0 0;color:#4b657e;font-size:12px;line-height:1.6}
 .ps-eq{display:block;padding:14px 15px;overflow-x:auto;white-space:nowrap;background:#0a294e;border:1px solid #274f7c;border-left:4px solid #fdb913;border-radius:11px;color:#fff;font-weight:800;font-family:'JetBrains Mono',Consolas,monospace;font-size:14px;margin:8px 0}
 .ps-eq small{font-family:'Nunito Sans',sans-serif;color:#c5d8ee;font-weight:500;font-size:10px}
 .ps-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
 .ps-tile{background:linear-gradient(135deg,#e8f3ff,#fff);border:1px solid #cbdcf2;border-radius:11px;padding:12px 14px}
 .ps-tile b{display:block;color:#103c69;font-size:15px}
 .ps-tile small{display:block;color:#58718a;line-height:1.45;margin-top:4px}
 .ps-table-wrap{max-width:100%;overflow:auto;border:1px solid #c8d9ef;border-radius:12px;background:white}
 .ps-table{width:100%;border-collapse:collapse;font-size:11.5px}
 .ps-table th{text-align:left;color:white;background:#154c7f;padding:10px 11px;white-space:nowrap}
 .ps-table td{padding:9px 11px;border-bottom:1px solid #e1eaf5;color:#314b65}
 .ps-table tr:nth-child(even){background:#f2f7ff}
 .ps-table tbody tr:last-child td{border-bottom:0}
 .ps-dialog-foot{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:12px 20px;background:#e7f0fb;border-top:1px solid #cfdeee;color:#51677e;font-size:11px}
 .ps-dialog-foot b{color:#154c7d}
 .ps-foot-right{font-weight:900;color:#806014}
 @media(max-width:1000px){#app .ps-banner{padding:16px 18px}#app .ps-route{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:680px){#app .ps-banner h1{font-size:21px}#app .ps-actions{width:100%}#app .ps-btn{flex:1}#app .ps-route{gap:7px}#app .ps-stage{padding:9px;gap:7px}#app .ps-stage .num{width:26px;height:26px;font-size:11px}#app .ps-stage strong{font-size:10.5px}#app .ps-stage small{font-size:9px}#app .ps-frame{min-height:850px;height:calc(100vh - 225px)}.ps-overlay{padding:8px}.ps-dialog{border-radius:15px;max-height:96vh}.ps-dialog-head{padding:18px}.ps-dialog-head h2{font-size:19px}.ps-dialog-body{padding:13px}.ps-cards,.ps-grid3{grid-template-columns:1fr}.ps-tabbar{padding:7px 9px 0;gap:2px}.ps-tabbar button{padding:8px;font-size:10.5px}.ps-dialog-foot{font-size:10px;padding:9px 12px}}
 `;
 if(!document.getElementById(style.id))document.head.appendChild(style);

 function page(){
  return '<section class="ps-page" aria-label="Project Selection – Prioritas Proyek">'+
   '<header class="ps-banner"><div><span class="ps-badge">◆ Transformasi · Seleksi Prioritas</span><h1>Project Selection</h1>'+
   '<p>Mesin pemeringkatan <b>Priority Dashboard CM</b> yang sama, dengan 12 kriteria SMART, ranking prioritas, dan penelusuran manfaat. Data dan hak akses tetap mengikuti Dashboard CM.</p></div>'+
   '<div class="ps-actions"><button type="button" class="ps-btn" data-ps-open="help">ⓘ Bantuan</button><button type="button" class="ps-btn gold" data-ps-open="sheet">▤ Cheatsheet SMART</button></div></header>'+
   '<nav class="ps-route" aria-label="Navigasi cepat tab Project Selection">'+
   [['projects','01','Daftar Proyek','Ranking & kuadran'],['criteria','02','Kriteria & Bobot','12 kriteria SMART'],['monev','03','Monev Manfaat','Indikator & benefit'],['reference','04','Referensi & Rumus','Cara hitung SMART']].map(function(x,i){return '<button type="button" class="ps-stage'+(i===0?' is-active':'')+'" data-ps-goto="'+x[0]+'"><span class="num">'+x[1]+'</span><span><strong>'+x[2]+'</strong><small>'+x[3]+'</small></span></button>';}).join('')+
   '</nav><div class="ps-frame-wrap mt-cm-frame-wrap"><iframe class="ps-frame mt-cm-frame" src="dashboard-cm-shared.html?mt_module=priority" title="Priority Dashboard CM — Project Selection (aplikasi dan data asli)" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allow="clipboard-read; clipboard-write"></iframe></div>'+
   '<div class="ps-footnote"><span aria-hidden="true">🔒</span><span><b>Satu sumber data.</b> Penambahan/edit proyek, skor SMART, bobot, referensi, snapshot, laporan, serta monev berlangsung langsung di Dashboard CM yang tertanam. Jika belum masuk, autentikasi melalui panel di atas. <span id="ps-live-status" role="status"></span></span></div></section>';
 }
 function iframe(){return document.querySelector('#view .ps-frame')}
 function doc(){try{var f=iframe();return f&&f.contentDocument||null}catch(_){return null}}
 function status(msg){var e=document.getElementById('ps-live-status');if(e)e.textContent=msg?' '+msg:''}
 function navigate(tab){
  var d=doc(),f=iframe();if(!d||!d.querySelector('#tab-priority')){status('Jika tampilan belum tersedia, masuk ke Dashboard CM atau muat ulang panel.');return false}
  var btn=d.querySelector('[data-prio-tab="'+tab+'"]');
  if(!btn){status('Tab belum tersedia; tunggu login Dashboard CM selesai.');return false}
  btn.click();
  document.querySelectorAll('#view .ps-stage').forEach(function(b){b.classList.toggle('is-active',b.dataset.psGoto===tab)});
  try{f.contentWindow.scrollTo({top:0,behavior:'smooth'})}catch(_){}
  status('');
  return true;
 }
 function frameStyle(){
  return `
  html.mt-embedded{--navy-900:#092746;--navy-800:#114477;--navy-700:#165d99;--gold-500:#fdb913;--gold-400:#ffd269;--gold-100:#fff2cc;--bg:#f0f5fc}
  html.mt-embedded body{background:#f0f5fc!important;font-family:'Nunito Sans','Inter',system-ui,sans-serif!important}
  html.mt-embedded #appHeader{background:linear-gradient(115deg,#0a2544,#124c7e)!important;min-height:0!important;padding:9px 14px!important}
  html.mt-embedded #appHeader .brand-text h1{font-family:'Nunito Sans',sans-serif;font-size:13px!important;font-weight:900!important;line-height:1.3!important}
  html.mt-embedded #appHeader .brand-text p{font-size:10px!important}
  html.mt-embedded #btnImport,html.mt-embedded #btnExport,html.mt-embedded #btnBackupAll,html.mt-embedded #btnRestoreAll,html.mt-embedded #btnReminderCenter{display:none!important}
  html.mt-embedded .tabs-row{display:none!important}
  html.mt-embedded #appMain{padding-top:12px!important}
  html.mt-embedded #tab-priority{border-radius:12px!important}
  html.mt-embedded .prio-page{font-family:'Nunito Sans','Inter',sans-serif!important}
  html.mt-embedded .prio-hero{background:linear-gradient(112deg,#0b2d50,#16578e 74%,#1c76a4)!important;border:1px solid #2d6797!important;border-bottom:3px solid #fdb913!important;box-shadow:0 11px 20px rgba(11,50,92,.12)!important}
  html.mt-embedded .prio-hero h2{font-family:'Nunito Sans',sans-serif!important;font-weight:900!important;letter-spacing:-.25px}
  html.mt-embedded .prio-kpi{background:linear-gradient(145deg,#fff,#f0f6ff)!important;border-color:#d3e2f2!important;box-shadow:0 4px 10px rgba(10,60,104,.06)!important}
  html.mt-embedded .prio-card,html.mt-embedded .prio-list{border-color:#d3e1f1!important;background:linear-gradient(148deg,#fff 0%,#f7faff 100%)!important;box-shadow:0 5px 16px rgba(7,49,92,.065)!important}
  html.mt-embedded .prio-grp,html.mt-embedded .prio-quad{border-color:#cddff1!important;box-shadow:0 4px 13px rgba(9,53,97,.05)!important}
  html.mt-embedded .prio-subtabs{background:linear-gradient(95deg,#eaf3ff,#f9fbff)!important;border:1px solid #d1dfee!important;border-radius:12px!important;padding:5px!important}
  html.mt-embedded .prio-subtabs .active{border-color:#d6e8fa!important;box-shadow:0 3px 8px rgba(20,87,145,.1)!important}
  html.mt-embedded .prio-formula{background:linear-gradient(155deg,#0a284b,#143e70)!important;border:1px solid #28658f!important;box-shadow:0 6px 18px rgba(8,45,83,.14)!important}
  html.mt-embedded .prio-cr.open{background:linear-gradient(140deg,#eaf3ff,#fff)!important;border-color:#80add6!important}
  html.mt-embedded #prioModal{backdrop-filter:blur(4px)}
  html.mt-embedded #prioModal .modal-box{border-radius:19px!important;border:1px solid #bad1eb!important;background:linear-gradient(145deg,#edf5ff,#fff 45%,#f4f8ff)!important;box-shadow:0 26px 60px rgba(4,29,59,.32)!important;overflow:hidden}
  html.mt-embedded #prioModal .modal-head{background:linear-gradient(112deg,#0b2b50,#1b5e96)!important;color:#fff!important;border-bottom:3px solid #fdb913!important;padding:15px 19px!important}
  html.mt-embedded #prioModal .modal-head h2{font-family:'Nunito Sans',sans-serif!important;font-weight:900!important;color:#fff!important}
  html.mt-embedded #prioModal .modal-close{color:white!important}
  html.mt-embedded #prioModal .modal-body{background:linear-gradient(145deg,#f6faff,#eaf3fd)!important}
  html.mt-embedded #prioModal .prio-crit{background:linear-gradient(140deg,#fff,#e9f2ff)!important;border-color:#cddff2!important;border-radius:12px!important;box-shadow:0 3px 9px rgba(9,53,97,.04)!important}
  html.mt-embedded #prioModal .prio-form-sec{background:linear-gradient(100deg,#dbeafa,#f3f8ff)!important;border-left:4px solid #f0b72c!important;border-radius:8px!important;color:#0e4578!important}
  html.mt-embedded #prioModal input:focus,html.mt-embedded #prioModal select:focus,html.mt-embedded #prioModal textarea:focus{outline:2px solid #e6b53b!important;outline-offset:1px!important;border-color:#2178b7!important}
  html.mt-embedded .btn.btn-gold{background:#fdb913!important;color:#122b4a!important;border-color:#e3aa16!important}
  @media(max-width:700px){html.mt-embedded #appHeader .brand-text p{display:none!important}html.mt-embedded #appHeader .brand-mark{display:none!important}html.mt-embedded #appMain{padding:8px!important}}
  `;
 }
 function decorate(){
  var d=doc();if(!d)return;try{
   if(!d.getElementById('mtProjectSelectionTheme')){var s=d.createElement('style');s.id='mtProjectSelectionTheme';s.textContent=frameStyle();d.head.appendChild(s)}
   d.documentElement.setAttribute('data-mt-selection','1');
   var a=d.querySelector('[data-prio-tab][aria-selected="true"]');
   if(a)document.querySelectorAll('#view .ps-stage').forEach(function(b){b.classList.toggle('is-active',b.dataset.psGoto===a.dataset.prioTab)});
   status('');
  }catch(e){status('Tampilan mengikuti tema Dashboard CM.')}
 }
 function mount(){
  var f=iframe();if(!f)return;
  f.addEventListener('load',decorate);
  if(f.contentDocument&&f.contentDocument.readyState==='complete')decorate();
 }
 function help(){
  var cards=[
   ['1','Pilih cakupan portofolio','Gunakan filter Semua / UE I / Program / Tematik / Kementerian. Ranking dihitung menurut pilihan cakupan.','projects'],
   ['2','Daftarkan atau ubah proyek','Klik + Tambah Proyek; isi nama, UIC, program, UE I, PIC, pengguna, jadwal, dan status. Hak edit mengikuti Dashboard CM.','projects'],
   ['3','Isi penilaian dengan bukti','Lengkapi 12 kriteria (Likert 1–5) berikut justifikasi. C2/C4/C5/C6/C12 dapat dihitung otomatis; C8 otomatis untuk tematik.','criteria'],
   ['4','Lihat prioritas & kapasitas','Baca skor 0–100, ranking P1/P2/P3, kuadran skor–beban, kapasitas Tim CM, serta indikator data belum lengkap.','projects'],
   ['5','Tetapkan parameter secara sadar','Kelola bobot skala 1–7, mode normalisasi, dan ambang nominasi Kementerian. Perubahan bobot memengaruhi hasil.','criteria'],
   ['6','Ukur manfaat & laporkan','Masukkan baseline, target, realisasi, indikator keberhasilan CM, dan benefit owner. Gunakan Monev, Excel, dan laporan.','monev']
  ];
  var html='<div class="ps-intro"><h3>Mulai dari proyek, bukan dari skor</h3><p>Project Selection menggunakan fitur <b>Priority</b> Dashboard CM yang sama. Panduan ini membantu mengenali alur tanpa mengganti perhitungan atau menggandakan data.</p></div>';
  html+='<div class="ps-cards">'+cards.map(function(x){return '<article class="ps-card"><strong><span class="ps-kicker">'+x[0]+'</span>'+x[1]+'</strong><p>'+x[2]+'</p><button type="button" class="ps-action" data-ps-goto="'+x[3]+'">Buka tab terkait ↗</button></article>'}).join('')+'</div>';
  return html;
 }
 function workflow(){
  return '<div class="ps-intro"><h3>Alur kerja end-to-end</h3><p>Gunakan urutan berikut agar penilaian mempunyai dasar bukti dan dapat ditindaklanjuti. Penetapan prioritas tidak sama dengan persetujuan proyek atau penugasan kapasitas secara otomatis.</p></div>'+
   '<div class="ps-steps">'+[
    ['Identifikasi','Catat usulan program/proyek dari UE I, penanggung jawab, jenis inisiatif, status dan tujuan strategis.'],
    ['Asesmen','Periksa jumlah pengguna, go-live, kesiapan organisasi/CRA, POSTER, dampak manfaat, serta risiko resistensi dan operasional.'],
    ['Skoring SMART','Lengkapi skor dan justifikasinya. Bobot dinormalisasi; utility benefit dan cost dihitung menurut mode normalisasi aktif.'],
    ['Pemeringkatan','Bandingkan P1/P2/P3, lihat kuadran dan kapasitas Tim CM, lalu cek kelengkapan dan alasan skor.'],
    ['Nominasi tingkat Kementerian','Bandingkan dengan ambang program/tematik yang disetujui; ajukan/tahan sesuai mekanisme pengelolaan dan bukti.'],
    ['Monitoring manfaat','Tetapkan indikator, baseline, target, realisasi, dan benefit owner; gunakan snapshot dan laporan untuk peninjauan periodik.']
   ].map(function(x,i){return '<article><span>'+(i+1)+'</span><div><b>'+x[0]+'</b><p>'+x[1]+'</p></div></article>'}).join('')+'</div>';
 }
 function interpret(){
  return '<div class="ps-intro"><h3>Bedakan skor prioritas dengan keputusan</h3><p>Skor SMART membantu pengambilan keputusan, bukan menggantikan mandat, ketersediaan SDM, regulasi, ataupun penetapan proyek oleh pejabat berwenang.</p></div>'+
   '<div class="ps-grid3"><div class="ps-tile"><b>P1 · Tinggi (≥70)</b><small>Prioritas pendampingan tertinggi menurut skor SMART.</small></div><div class="ps-tile"><b>P2 · Sedang (40–69,99)</b><small>Penjadwalan berdasarkan kebutuhan, readiness, dan kapasitas.</small></div><div class="ps-tile"><b>P3 · Rendah (&lt;40)</b><small>Dapat ditinjau ulang atau memperoleh dukungan yang lebih proporsional.</small></div></div>'+
   '<div class="ps-cards" style="margin-top:12px"><div class="ps-card"><strong>Ambang Kementerian ≠ P1</strong><p>Ambang nominasi ke level Kementerian memiliki pengaturan tersendiri (nilai awal 80 per kelompok program). P1 ≥70 tidak otomatis berarti memenuhi ambang tersebut.</p></div>'+
   '<div class="ps-card"><strong>Data belum lengkap</strong><p>Beberapa kriteria otomatis menggunakan nilai netral 3 jika data sumber belum tersedia. Periksa penanda kelengkapan, bukan hanya skor akhir, sebelum mengambil keputusan.</p></div>'+
   '<div class="ps-card"><strong>Mode normalisasi</strong><p><b>Min–maks antarproyek</b> bergantung pada himpunan proyek yang diranking. <b>Skala absolut 1–5</b> cocok untuk pembandingan lintas periode. Pastikan mode aktif saat membaca skor.</p></div>'+
   '<div class="ps-card"><strong>Peran & hak akses</strong><p>Tambahkan atau ubah data hanya bila diberikan izin pada Dashboard CM. Seluruh penyimpanan proyek dan bobot memakai sumber Firestore Dashboard CM, bukan basis data terpisah.</p></div></div>';
 }
 function formula(){
  return '<div class="ps-intro"><h3>SMART · Simple Multi-Attribute Rating Technique</h3><p>Referensi rumus ini konsisten dengan implementasi <b>Priority Dashboard CM</b>. Bobot 1–7 menunjukkan tingkat kepentingan; skor kriteria 1–5 dinormalisasi menjadi utility 0–1.</p></div>'+
   '<div class="ps-cards">'+
   '<div class="ps-card"><strong>1 · Normalisasi bobot</strong><div class="ps-eq">w′ⱼ = Wⱼ / Σ Wⱼ</div><p>Bobot setiap kriteria dibagi jumlah bobot seluruh kriteria. Default jumlah bobot: <b>55</b>.</p></div>'+
   '<div class="ps-card"><strong>2 · Kriteria manfaat (benefit)</strong><div class="ps-eq">uᵢⱼ = (xᵢⱼ − minⱼ) / (maxⱼ − minⱼ)</div><p>Nilai lebih besar berarti utility lebih tinggi.</p></div>'+
   '<div class="ps-card"><strong>3 · Kriteria biaya (cost)</strong><div class="ps-eq">uᵢⱼ = (maxⱼ − xᵢⱼ) / (maxⱼ − minⱼ)</div><p>Semakin rendah beban/risiko, semakin tinggi utility. Kriteria cost: C7 dan C12.</p></div>'+
   '<div class="ps-card"><strong>4 · Agregasi skor akhir</strong><div class="ps-eq">Sᵢ = 100 × Σ (w′ⱼ × uᵢⱼ)</div><p>Rentang hasil 0–100. Jika max = min, sistem menetapkan utility = 1. Min/max mengikuti mode aktif: antarproyek atau rentang tetap 1–5.</p></div></div>'+
   '<div class="ps-intro" style="margin-top:14px"><h3>Contoh sederhana · 3 kriteria</h3><p>Misalnya C1 berbobot 7 dan bernilai 5 (benefit), C7 berbobot 3 dan bernilai 2 (cost), C8 berbobot 6 dan bernilai 4 (benefit). Dengan normalisasi absolut 1–5: utility 1,00; 0,75; dan 0,75. <b>Skor contoh = 100 × [(7/16 × 1) + (3/16 × 0,75) + (6/16 × 0,75)] = 85,94.</b> Ini hanya ilustrasi 3 kriteria; sistem asli menghitung 12 kriteria.</p></div>'+
   '<button type="button" class="ps-action" data-ps-goto="reference">Buka Referensi & Rumus asli ↗</button>';
 }
 function criterionTable(){
  return '<div class="ps-intro"><h3>12 kriteria · bobot default</h3><p>Ringkasan bobot awal bersumber dari Priority Dashboard CM; apabila bobot telah disesuaikan melalui menu Kriteria & Bobot, ikuti bobot aktif pada sistem, bukan tabel default ini.</p></div>'+
   '<div class="ps-table-wrap"><table class="ps-table"><thead><tr><th>Kode</th><th>Kriteria</th><th>Bobot awal</th><th>Jenis</th><th>Sumber</th><th>Petunjuk</th></tr></thead><tbody>'+
   criteria.map(function(c){return '<tr><td><b>'+c[0]+'</b></td><td>'+c[1]+'</td><td><b>'+c[2]+'</b></td><td>'+c[3]+'</td><td>'+c[4]+'</td><td>'+c[5]+'</td></tr>'}).join('')+
   '</tbody><tfoot><tr><td colspan="2"><b>Jumlah bobot</b></td><td><b>55</b></td><td colspan="3">Normalisasi = bobot / 55 (untuk bobot default)</td></tr></tfoot></table></div><button type="button" class="ps-action" style="margin-top:12px" data-ps-goto="criteria">Buka Kriteria & Bobot asli ↗</button>';
 }
 function auto(){
  return '<div class="ps-intro"><h3>Asesmen yang perlu disiapkan</h3><p>Nilai otomatis baru bermakna jika data sumber dapat dipertanggungjawabkan. Isian otomatis tetap dapat dikendalikan sesuai opsi aplikasi, dengan justifikasi untuk penilaian manual.</p></div>'+
   '<div class="ps-cards">'+[
    ['C2 · Jumlah Pengguna','Jumlah pengguna terdampak diubah ke kategori Likert 1–5.'],
    ['C4 · Tenggat Go-live','≤30 hari mendapat skor urgensi 5; 31–90 hari 4; 91–180 hari 3; 181–365 hari 2; >365 hari 1.'],
    ['C5 · Gap Kesiapan','Readiness ≥80% mendapat skor 1; kesiapan <50% mendapat skor 5. Bisa dari CRA, asesmen organisasi, atau input manual.'],
    ['C6 · POSTER','Rata-rata Proses, Organisasi, SDM, Teknologi, Regulasi; dibulatkan. Jika salah satu dimensi 5, C6 minimal 3.'],
    ['C8 · Manfaat Tematik','Untuk proyek tematik, dihitung dari target efisiensi/pengurangan SDM; selain itu nilai manfaat dapat dinilai langsung.'],
    ['C12 · Risiko','Rata-rata risiko resistensi, operasional, ketergantungan, dan lainnya; menjadi kriteria cost pada SMART.']
   ].map(function(x){return '<div class="ps-card"><strong>'+x[0]+'</strong><p>'+x[1]+'</p></div>'}).join('')+'</div>';
 }
 function followup(){
  return '<div class="ps-intro"><h3>Output yang dapat digunakan pengambil keputusan</h3><p>Prioritas yang baik adalah prioritas yang bisa dijelaskan, diuji ulang, dan ditindaklanjuti melalui penugasan atau pengendalian portofolio.</p></div>'+
   '<div class="ps-steps">'+[
    ['Peringkat / kuadran','Mengidentifikasi kebutuhan pendampingan dan effort; buka tampilan Daftar atau Kuadran.'],
    ['Snapshot dan perbandingan','Membandingkan posisi ranking antarperiode serta mencermati pergeseran skor.'],
    ['Monev indikator & manfaat','Menghubungkan realisasi manfaat dengan indikator, baseline, target, dan pemilik manfaat.'],
    ['Ekspor Excel dan laporan','Menyediakan bahan rapat dan dokumentasi keputusan; gunakan tombol di dalam Priority Dashboard CM.']
   ].map(function(x,i){return '<article><span>'+(i+1)+'</span><div><b>'+x[0]+'</b><p>'+x[1]+'</p></div></article>'}).join('')+'</div>';
 }
 function open(mode){
  close();
  mode=mode==='sheet'?'sheet':'help';
  var data=mode==='help'?[['mulai','Panduan cepat',help],['alur','Alur kerja',workflow],['baca','Membaca hasil',interpret],['lanjut','Tindak lanjut',followup]]:[['rumus','Rumus SMART',formula],['kriteria','12 Kriteria',criterionTable],['otomatis','Skor Otomatis',auto],['hasil','Interpretasi',interpret]];
  lastFocus=document.activeElement;
  var overlay=document.createElement('div');overlay.className='ps-overlay';overlay.id='ps-help-overlay';
  overlay.innerHTML='<div class="ps-dialog" role="dialog" aria-modal="true" aria-labelledby="ps-dialog-title"><header class="ps-dialog-head"><div><span class="ps-eyebrow">PROJECT SELECTION · '+(mode==='help'?'PETUNJUK PENGGUNA':'REFERENSI PENILAIAN')+'</span><h2 id="ps-dialog-title">'+(mode==='help'?'Bantuan Project Selection':'Cheatsheet Metode SMART')+'</h2><p>'+(mode==='help'?'Langkah penggunaan fitur Priority yang sama dengan Dashboard CM.':'Rumus, kriteria, pembacaan skor, dan petunjuk pengisian.')+'</p></div><button type="button" class="ps-close" data-ps-close aria-label="Tutup">×</button></header>'+
   '<nav class="ps-tabbar" role="tablist" aria-label="Topik '+(mode==='help'?'Bantuan':'Cheatsheet')+'">'+data.map(function(t,i){return '<button type="button" role="tab" data-ps-panel-tab="'+t[0]+'" aria-selected="'+(i===0?'true':'false')+'">'+t[1]+'</button>'}).join('')+'</nav><main class="ps-dialog-body">'+data.map(function(t,i){return '<section class="ps-panel" data-ps-panel="'+t[0]+'" role="tabpanel"'+(i?' hidden':'')+'>'+t[2]()+'</section>'}).join('')+'</main>'+
   '<footer class="ps-dialog-foot"><span><b>'+(mode==='help'?'Bantuan':'Cheatsheet')+'</b> · menggunakan rumus dan parameter asli Priority Dashboard CM</span><span class="ps-foot-right">Modul Transformasi · 2026</span></footer></div>';
  document.body.appendChild(overlay);
  document.addEventListener('keydown',onKey);
  var b=overlay.querySelector('.ps-close');if(b)b.focus();
  return overlay;
 }
 function close(){
  var overlay=document.getElementById('ps-help-overlay');if(overlay)overlay.remove();
  document.removeEventListener('keydown',onKey);
  if(overlay&&lastFocus&&lastFocus.isConnected&&lastFocus.focus)lastFocus.focus();
 }
 function onKey(e){
  var o=document.getElementById('ps-help-overlay');if(!o)return;
  if(e.key==='Escape'){e.preventDefault();close();return}
  if(e.key==='Tab'){
   var items=Array.from(o.querySelectorAll('button:not([disabled])')).filter(function(b){return b.offsetParent!==null});
   if(!items.length)return;
   var first=items[0],last=items[items.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
 }
 document.addEventListener('click',function(e){
  var o=document.getElementById('ps-help-overlay');
  if(o&&e.target===o){close();return}
  var closer=e.target.closest('[data-ps-close]');if(closer){e.preventDefault();close();return}
  var tb=e.target.closest('[data-ps-panel-tab]');if(tb){
   var id=tb.dataset.psPanelTab,root=tb.closest('.ps-dialog');
   root.querySelectorAll('[data-ps-panel-tab]').forEach(function(b){b.setAttribute('aria-selected',String(b.dataset.psPanelTab===id))});
   root.querySelectorAll('[data-ps-panel]').forEach(function(p){p.hidden=p.dataset.psPanel!==id});
   root.querySelector('.ps-dialog-body').scrollTop=0;return;
  }
  var op=e.target.closest('[data-ps-open]');if(op){e.preventDefault();open(op.dataset.psOpen);return}
  var nav=e.target.closest('[data-ps-goto]');if(nav){
   e.preventDefault();var tab=nav.dataset.psGoto;if(o)close();
   navigate(tab);
  }
 });
 window.MT_PROJECT_SELECTION={page:page,mount:mount,open:open,navigate:navigate,criteria:criteria.map(function(c){return {code:c[0],weight:c[2],type:c[3]}}),version:'20261107-priority-native-v1'};
})();