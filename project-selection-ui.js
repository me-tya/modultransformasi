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

 style.textContent += `
 /* Project Selection is a native page within the existing module shell, not a second dashboard. */
 body:has(#view .ps-page){overflow:hidden!important}
 #app:has(.ps-page){height:100dvh;min-height:0!important;overflow:hidden}
 #app:has(.ps-page) .main{height:100dvh;min-height:0;overflow:hidden}
 #app:has(.ps-page) .view{flex:1;min-height:0;overflow:hidden;padding-block:10px 8px!important;gap:0!important}
 #app .ps-page{flex:1;min-height:0;height:100%;gap:10px;overflow:hidden}
 #app .ps-page>.vh{flex:none;min-height:64px}
 #app .ps-frame-wrap{flex:1;min-height:0;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:hidden!important}
 #app .ps-frame-wrap:before{display:none!important}
 #app .ps-frame{height:100%!important;min-height:0!important;width:100%;background:transparent!important}
 #app .ps-status{border:1px solid #e7c46d;border-radius:8px;color:#815a0c;background:#fff8e6;padding:8px 11px;font-size:11.5px}
 #app .ps-status:empty{display:none}
 .ps-account-pop{position:fixed;z-index:100200;right:22px;top:105px;width:min(340px,calc(100vw - 24px));background:#fff;border-radius:15px;border:1px solid #cad9eb;box-shadow:0 20px 54px rgba(6,32,64,.24);overflow:hidden;font-family:'Nunito Sans','Segoe UI',sans-serif}
 .ps-account-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;color:#fff;background:linear-gradient(115deg,#0c294b,#1a578b);border-bottom:3px solid #fdb913}
 .ps-account-head b{font-size:13px;font-weight:900}
 .ps-account-head button{border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.13);color:#fff;border-radius:7px;width:28px;height:28px;font-size:20px;cursor:pointer}
 .ps-account-body{padding:15px}
 .ps-account-body strong{color:#12385e;font-size:13px;overflow-wrap:anywhere}
 .ps-account-body p{color:#59718a;font-size:11.5px;line-height:1.6;margin:6px 0 13px}
 .ps-account-actions{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px}
 .ps-account-actions button{border:1px solid #bcd0e7;border-radius:8px;background:#eaf3fd;color:#124a7a;padding:8px 11px;font-weight:800;font-size:11.5px;cursor:pointer}
 .ps-account-actions button:first-child{background:#fdb913;color:#0b294b;border-color:#e2ac21}
 .ps-account-body a{font-size:11px;color:#185a98}
 @media(max-width:680px){#app .ps-page>.vh{align-items:flex-start;flex-wrap:wrap}#app .ps-page>.vh .acts{margin-left:auto}#app .ps-page>.vh h1{font-size:19px!important}.ps-account-pop{right:12px;top:110px}}
 `;
 if(!document.getElementById(style.id))document.head.appendChild(style);

 function page(){
  // The native module header is the only permanent header on this page.
  const actions='<button class="btn" type="button" data-ps-account aria-haspopup="dialog" aria-expanded="false" title="Login, logout, dan status akses Dashboard CM">♙ <span>Akun CM</span></button>';
  const desc='Pemeringkatan proyek dengan 12 kriteria SMART, prioritas P1–P3, kapasitas CM, dan monitoring manfaat.';
  const header=typeof vh==='function'
   ?vh('PS','dash','Project Selection',desc,actions)
   :'<div class="vh"><div class="pic dash">PS</div><div style="min-width:0"><h1>Project Selection</h1><p>'+desc+'</p></div><div class="acts">'+actions+'</div></div>';
  return '<section class="ps-page" aria-label="Project Selection – Prioritas Proyek">'+header+
    '<div id="ps-live-status" class="ps-status" role="status" aria-live="polite"></div>'+
    '<div class="ps-frame-wrap mt-cm-frame-wrap"><iframe class="ps-frame mt-cm-frame" src="dashboard-cm-shared.html?mt_module=priority" title="Seleksi dan prioritas proyek (fitur Priority Dashboard CM)" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allow="clipboard-read; clipboard-write"></iframe></div>'+
    '</section>';
 }
 function iframe(){return document.querySelector('#view .ps-frame')}
 function doc(){try{var f=iframe();return f&&f.contentDocument||null}catch(_){return null}}
 function status(msg){var e=document.getElementById('ps-live-status');if(e)e.textContent=msg?' '+msg:''}
 function navigate(tab){
  var d=doc(),f=iframe();if(!d||!d.querySelector('#tab-priority')){status('Fitur Priority belum dapat diakses. Periksa login Akun CM.');return false}
  var btn=d.querySelector('[data-prio-tab="'+tab+'"]');
  if(!btn){status('Tab belum siap. Silakan muat ulang melalui menu Akun CM.');return false}
  btn.click();
  try{f.contentWindow.scrollTo({top:0,behavior:'smooth'})}catch(_){}
  status('');
  return true;
 }
 function frameStyle(){
  return `
  /* Same token family as Modul Transformasi; no nested product shell. */
  html.mt-embedded{--navy-900:#0b2447;--navy-800:#0d355e;--navy-700:#185a97;--gold-500:#fdb913;--gold-400:#f6c34c;--gold-100:#fff5db;--bg:#f2f4f8}
  html.mt-embedded body{background:#f2f4f8!important;font-family:'Nunito Sans','Segoe UI',system-ui,sans-serif!important}
  html.mt-embedded #appHeader,html.mt-embedded .tabs-row,html.mt-embedded .app-footer{display:none!important}
  html.mt-embedded #appMain{max-width:none!important;margin:0!important;padding:4px 6px 18px!important}
  html.mt-embedded #tab-priority{padding:0!important;border:0!important;box-shadow:none!important;background:transparent!important}
  html.mt-embedded .prio-page{font-family:'Nunito Sans','Segoe UI',sans-serif!important;gap:10px!important}
  /* Priority's title is intentionally moved to the parent module's standard vh header.
     Keep the native Add Project/Excel/Report actions, without the duplicate hero. */
  html.mt-embedded .prio-hero{background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;color:#15304d!important;padding:1px 0 2px!important;min-height:32px!important;justify-content:flex-end!important}
  html.mt-embedded .prio-hero>div:first-child:not(.prio-hero-actions){display:none!important}
  html.mt-embedded .prio-hero-actions{margin-left:auto!important;justify-content:flex-end!important}
  html.mt-embedded .prio-btn-light{color:#173b62!important;background:#fff!important;border-color:#cedbec!important}
  html.mt-embedded .prio-btn-light:hover{background:#eef5ff!important}
  html.mt-embedded .btn.btn-gold{background:#fdb913!important;color:#102d4d!important;border-color:#e1a713!important}
  /* One tab navigation, aligned with the module's underlined tabs. */
  html.mt-embedded .prio-subtabs{display:flex!important;gap:7px!important;overflow-x:auto!important;flex-wrap:nowrap!important;margin:0 0 2px!important;background:transparent!important;border:0!important;border-bottom:1px solid #d7e0ec!important;border-radius:0!important;padding:1px 0 0!important;box-shadow:none!important}
  html.mt-embedded .prio-subtabs .cm-survey-subtab{position:relative!important;display:inline-flex!important;align-items:center!important;border:0!important;border-radius:8px 8px 0 0!important;padding:10px 13px 11px!important;background:transparent!important;box-shadow:none!important;color:#556783!important;font-family:'Nunito Sans','Segoe UI',sans-serif!important;font-size:12px!important;font-weight:800!important;white-space:nowrap!important;min-height:40px!important}
  html.mt-embedded .prio-subtabs .cm-survey-subtab:hover{background:#eaf1fb!important;color:#154778!important}
  html.mt-embedded .prio-subtabs .cm-survey-subtab.active{background:#fff!important;color:#123b6a!important;box-shadow:inset 0 -4px 0 #fdb913!important}
  html.mt-embedded .prio-tab-n{background:#e5ecf5!important;color:#294970!important;border-radius:99px!important}
  html.mt-embedded .prio-kpi{background:linear-gradient(150deg,#fff,#f5f8fc)!important;border-color:#dce4ef!important;box-shadow:0 3px 9px rgba(15,39,76,.04)!important}
  html.mt-embedded .prio-card,html.mt-embedded .prio-list{background:#fff!important;border-color:#dce4ef!important;box-shadow:0 3px 12px rgba(15,41,79,.045)!important}
  html.mt-embedded .prio-formula{background:linear-gradient(142deg,#0b294b,#153b69)!important;border:1px solid #28618f!important;box-shadow:0 7px 22px rgba(8,34,75,.12)!important}
  html.mt-embedded .prio-cr.open{background:linear-gradient(136deg,#edf5ff,#fff)!important;border-color:#a7c4e3!important}
  /* Priority modals remain the same functional forms, now themed like the module. */
  html.mt-embedded #prioModal{backdrop-filter:blur(5px)}
  html.mt-embedded #prioModal .modal-box{border-radius:16px!important;border:1px solid #bcd1e9!important;background:#f7faff!important;box-shadow:0 26px 60px rgba(4,29,59,.32)!important;overflow:auto}
  html.mt-embedded #prioModal .modal-head{background:linear-gradient(110deg,#0d2847,#15558a)!important;color:#fff!important;border-bottom:3px solid #fdb913!important;padding:15px 19px!important}
  html.mt-embedded #prioModal .modal-head h2{font-family:'Nunito Sans',sans-serif!important;font-weight:900!important;color:#fff!important}
  html.mt-embedded #prioModal .modal-close{color:#fff!important}
  html.mt-embedded #prioModal .modal-body{background:linear-gradient(155deg,#f7faff,#edf3fa)!important}
  html.mt-embedded #prioModal .prio-crit{background:linear-gradient(143deg,#fff,#f0f6ff)!important;border-color:#d5e2f1!important;border-radius:11px!important}
  html.mt-embedded #prioModal .prio-form-sec{background:linear-gradient(105deg,#e1eeff,#f6faff)!important;border-left:4px solid #fdb913!important;border-radius:8px!important;color:#0c3f70!important}
  html.mt-embedded #prioModal input:focus,html.mt-embedded #prioModal select:focus,html.mt-embedded #prioModal textarea:focus{outline:2px solid #e8b339!important;outline-offset:1px!important;border-color:#2472ab!important}
  @media(max-width:680px){html.mt-embedded #appMain{padding:2px 4px 18px!important}html.mt-embedded .prio-hero-actions{justify-content:flex-start!important;width:100%!important}html.mt-embedded .prio-subtabs .cm-survey-subtab{padding:10px 9px!important;font-size:11px!important}}
  `;
 }
 function decorate(){
  var d=doc(),f=iframe();if(!d||!f)return;
  try{
   if(!d.getElementById('mtProjectSelectionTheme')){var st=d.createElement('style');st.id='mtProjectSelectionTheme';st.textContent=frameStyle();d.head.appendChild(st)}
   d.documentElement.setAttribute('data-mt-selection','1');
   // Keep the Indonesian language of the parent application.
   if(d.documentElement.dataset.psLangApplied!=='1'){
    d.documentElement.dataset.psLangApplied='1';
    if(f.contentWindow&&typeof f.contentWindow.setLanguage==='function')f.contentWindow.setLanguage('id');
   }
   status('');
  }catch(e){status('Tampilan Priority menggunakan gaya dasar Dashboard CM.')}
 }
 function mount(){
  var f=iframe();if(!f)return;
  f.addEventListener('load',decorate);
  if(f.contentDocument&&f.contentDocument.readyState==='complete')decorate();
 }
 function account(){
  var existing=document.getElementById('ps-account-pop');
  if(existing){closeAccount();return}
  var d=doc(),cw=iframe()&&iframe().contentWindow;
  var user=cw&&cw.fbAuth&&cw.fbAuth.currentUser;
  var role='';
  try{if(cw&&typeof cw.cmGetAccessRole==='function')role=String(cw.cmGetAccessRole()||'')}catch(e){}
  var pop=document.createElement('aside');pop.className='ps-account-pop';pop.id='ps-account-pop';
  pop.setAttribute('role','dialog');pop.setAttribute('aria-label','Kelola akses Dashboard CM');
  var es=x=>String(x||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  pop.innerHTML='<div class="ps-account-head"><b>🔒 Akses Dashboard CM</b><button type="button" data-ps-acclose aria-label="Tutup akses CM">×</button></div>'+
    '<div class="ps-account-body"><strong>'+(user?es(user.email||'Akun Google tersambung'):'Belum masuk Dashboard CM')+'</strong>'+
    '<p>'+(user?'Hak akses: '+es(role||'mengikuti konfigurasi Dashboard CM')+'. Data Priority tetap menggunakan sumber Firestore yang sama.':'Masuk untuk mengakses atau memperbarui data Priority sesuai izin akun CM.')+'</p>'+
    '<div class="ps-account-actions">'+
    (user?'<button type="button" data-ps-aclogout>Keluar dari CM</button>':'<button type="button" data-ps-aclogin>Masuk dengan Google</button>')+
    '<button type="button" data-ps-acreload>Muat ulang Priority</button></div>'+
    '<a target="_blank" rel="noopener" href="dashboard-cm-shared.html?mt_module=priority">Buka workspace CM di tab terpisah</a></div>';
  document.body.appendChild(pop);
  var b=document.querySelector('#view [data-ps-account]');if(b)b.setAttribute('aria-expanded','true');
  pop.querySelector('[data-ps-acclose]').focus();
 }
 function closeAccount(){
  var el=document.getElementById('ps-account-pop');if(el)el.remove();
  var b=document.querySelector('#view [data-ps-account]');if(b)b.setAttribute('aria-expanded','false');
 }
 function accountAction(mode){
  var d=doc(),f=iframe();
  if(!d||!f){status('Panel Dashboard CM belum siap.');closeAccount();return}
  var selector=mode==='login'?'#btnGoogleLogin, #btnCmAdminLogin':mode==='logout'?'#btnLogout':'';
  if(mode==='reload'){f.contentWindow.location.reload();closeAccount();return}
  var btn=selector&&d.querySelector(selector);
  if(btn){closeAccount();btn.click();}
  else{status('Kontrol akun belum tersedia. Buka workspace CM di tab terpisah.');closeAccount();}
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
  if(e.key==='Escape'&&document.getElementById('ps-account-pop')){e.preventDefault();closeAccount();return}
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
  var ab=e.target.closest('[data-ps-account]');if(ab){e.preventDefault();account();return}
  var ac=e.target.closest('[data-ps-aclogin],[data-ps-aclogout],[data-ps-acreload],[data-ps-acclose]');
  if(ac){e.preventDefault();if(ac.hasAttribute('data-ps-acclose'))closeAccount();else accountAction(ac.hasAttribute('data-ps-aclogin')?'login':ac.hasAttribute('data-ps-aclogout')?'logout':'reload');return}
  if(document.getElementById('ps-account-pop')&&!e.target.closest('#ps-account-pop'))closeAccount();
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
 window.MT_PROJECT_SELECTION={page:page,mount:mount,open:open,navigate:navigate,criteria:criteria.map(function(c){return {code:c[0],weight:c[2],type:c[3]}}),version:'20261107-priority-unified-v2'};
})();