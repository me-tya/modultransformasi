/* Modul Transformasi — Cheatsheet Tata Kelola PMO & CMO
   Rujukan substansi: Draft KMK Peta Rencana Transformasi Digital (6), Lampiran J, halaman 45–52.
   Bagian studi kasus komunikasi, portal knowledge, dan alur aduan merupakan ilustrasi, bukan kewajiban normatif KMK. */
(function(){
'use strict';
var css=[
'.txcs-backdrop{position:fixed;inset:0;background:rgba(10,27,54,.70);backdrop-filter:blur(6px);z-index:120000;display:grid;place-items:center;padding:22px;animation:txcsFade .18s ease}',
'@keyframes txcsFade{from{opacity:0}to{opacity:1}}',
'.txcs-modal{width:min(1560px,97vw);height:min(910px,94vh);min-height:560px;display:flex;flex-direction:column;background:#f5f7fb;border-radius:21px;overflow:hidden;box-shadow:0 34px 110px rgba(5,18,40,.39);color:#16304e;font-family:inherit}',
'.txcs-head{background:linear-gradient(115deg,#0c2446,#123b68 65%,#164575);color:#fff;padding:21px 27px 19px;position:relative;overflow:hidden;flex:none}',
'.txcs-head:after{content:"";position:absolute;width:250px;height:250px;right:12%;top:-175px;border:44px solid rgba(255,255,255,.055);border-radius:50%;pointer-events:none}',
'.txcs-kicker{font-size:10.5px;color:#f5c45c;letter-spacing:.19em;font-weight:850;text-transform:uppercase;margin-bottom:7px}',
'.txcs-hline{display:flex;align-items:center;justify-content:space-between;gap:15px;position:relative;z-index:2}',
'.txcs-hline h2{font-size:25px;font-weight:850;letter-spacing:-.025em;line-height:1.15;margin:0 0 5px;color:#fff}',
'.txcs-hline p{font-size:12.3px;line-height:1.5;color:#cadaed;margin:0;max-width:900px}',
'.txcs-x{height:38px;width:38px;flex:none;border:1px solid rgba(255,255,255,.25);border-radius:11px;background:rgba(255,255,255,.12);color:#fff;font-weight:900;font-size:24px;cursor:pointer}',
'.txcs-x:hover{background:#fdb913;color:#0c2446;border-color:#fdb913}',
'.txcs-legend{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:13px}',
'.txcs-legend span{font-size:10px;font-weight:750;border:1px solid rgba(255,255,255,.21);padding:4px 9px;border-radius:100px;background:rgba(255,255,255,.08);color:#e8f1ff}',
'.txcs-legend .txcs-highlight{background:rgba(253,185,19,.17);color:#ffe19b;border-color:rgba(253,185,19,.45)}',
'.txcs-toolbar{background:#fff;padding:9px 20px 8px;border-bottom:1px solid #e1e7f0;flex:none;display:flex;gap:5px;overflow-x:auto;scrollbar-width:thin}',
'.txcs-tab{flex:1 0 auto;min-width:115px;white-space:nowrap;border:0;background:transparent;color:#58708e;cursor:pointer;border-radius:9px;padding:10px 13px;font:800 12px inherit;transition:.16s}',
'.txcs-tab:hover{background:#eff3fa;color:#143862}',
'.txcs-tab.on{color:#fff;background:#10345c;box-shadow:0 3px 10px rgba(6,32,65,.17)}',
'.txcs-ko{min-width:0}',
'.txcs-ko .ko-nav{display:flex;align-items:center;gap:7px;overflow-x:auto;padding:7px 0 11px;scrollbar-width:thin;flex-wrap:nowrap}',
'.txcs-ko .ko-nav .t{flex:none;font-size:11px;color:#667991;font-weight:850;text-transform:uppercase;letter-spacing:.08em}',
'.txcs-ko .ko-nav .pc{white-space:nowrap;flex:none;padding:8px 11px;border-radius:9px;border:1px solid #d9e3ef;background:#f4f7fb;color:#406080;font-size:11px;font-weight:780;cursor:pointer}',
'.txcs-ko .ko-nav .pc:hover{background:#eaf2fa}',
'.txcs-ko .ko-nav .pc.on{background:#12365f;color:#fff;border-color:#12365f;box-shadow:0 3px 8px rgba(12,43,79,.13)}',
'.txcs-ko .ko-nav .pc.on b{color:#fff}',
'.txcs-ko .ko-p{padding:6px 0}',
'.txcs-ko-over{display:grid;gap:12px}',
'.txcs-koHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;background:#fff;border:1px solid #e0e7f0;padding:17px 19px;border-radius:13px}',
'.txcs-koHead h4{margin:0 0 5px;font-size:17px;color:#163a5e;font-weight:850}',
'.txcs-koHead p{margin:0;font-size:12px;color:#64758a;line-height:1.6;max-width:790px}',
'.txcs-koStatus{font-size:10px;font-weight:850;color:#9a6a10;background:#fff3d6;border:1px solid #f2d796;border-radius:20px;padding:6px 10px;white-space:nowrap}',
'.txcs-koTrack{display:grid;grid-template-columns:165px minmax(0,1fr);overflow:hidden;border:1px solid #dfe7f1;border-radius:13px;background:#fff}',
'.txcs-koTrackTitle{display:flex;align-items:center;padding:13px 15px;background:#103760;color:white;font-size:12px;font-weight:850;line-height:1.5}',
'.txcs-koTrackTitle.cmo{background:#0f7a81}',
'.txcs-koTrackSteps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr))}',
'.txcs-koTrackStep{padding:13px 12px;border-left:1px solid #e6ebf1;min-width:0;display:flex;flex-direction:column;gap:4px}',
'.txcs-koTrackStep small{font-size:10px;font-weight:900;color:#b07a1e}',
'.txcs-koTrackStep b{font-size:11.5px;font-weight:820;color:#173859;line-height:1.35}',
'.txcs-koTrackStep span{font-size:10.8px;color:#61758c;line-height:1.4}',
'.txcs-ko-bridge{margin:0;padding:12px 14px;background:#eaf6f5;border:1px solid #cbe8e6;border-left:4px solid #0d7e85;border-radius:10px;font-size:11.5px;color:#285f62;line-height:1.6}',
'.txcs-koChoicesTitle{font-size:14px;font-weight:850;color:#1a3f64;margin:4px 0 -2px}',
'.txcs-koChoiceGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}',
'.txcs-koChoice{display:flex;flex-direction:column;align-items:flex-start;text-align:left;gap:5px;background:#fff;border:1px solid #dbe5ee;border-radius:12px;padding:14px;min-height:135px;cursor:pointer;transition:box-shadow .15s,transform .15s,border-color .15s}',
'.txcs-koChoice:hover,.txcs-koChoice:focus-visible{border-color:#b6a162;box-shadow:0 8px 18px rgba(15,46,79,.12);transform:translateY(-2px)}',
'.txcs-koChoice em{display:grid;place-items:center;width:26px;height:26px;border-radius:8px;background:#12385f;color:#ffcc49;font-size:11px;font-style:normal;font-weight:900}',
'.txcs-koChoice b{font-size:12px;color:#183e60;line-height:1.4;font-weight:850}',
'.txcs-koChoice span{font-size:10.5px;color:#75849a;line-height:1.4;flex:1}',
'.txcs-koChoice u{font-size:10px;font-weight:800;text-decoration:none;color:#0e7f87}',
'.txcs-ko .ko-ph-h h4{font-size:17px;color:#16395e}',
'.txcs-ko .ko-ph-h span{line-height:1.4}',
'.txcs-ko .ko-wrap{background:#fff;overflow:auto;border:1px solid #dbe5ee;border-radius:13px}',
'.txcs-ko .ko-svg{display:block;width:100%;min-width:1020px;height:auto}',
'.txcs-ko .ko-src{line-height:1.6}',
'.txcs-koHint{font-size:11px;color:#647c91;margin:3px 0 10px}',
'@media(max-width:1180px){.txcs-koChoiceGrid{grid-template-columns:repeat(3,minmax(0,1fr))}.txcs-koTrack{grid-template-columns:132px minmax(0,1fr)}.txcs-koTrackStep{padding:9px 8px}}',
'@media(max-width:800px){.txcs-koChoiceGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.txcs-koTrack{display:flex;flex-direction:column}.txcs-koTrackSteps{overflow-x:auto;min-width:0}.txcs-koTrackStep{min-width:150px}.txcs-koHead{flex-direction:column}}',
'.txcs-scroll{padding:22px 24px 30px;overflow:auto;flex:1;scrollbar-gutter:stable}',
'.txcs-pane[hidden]{display:none!important}',
'.txcs-secTitle{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:17px}',
'.txcs-secTitle h3{font-size:19px;line-height:1.2;font-weight:850;color:#132f52;letter-spacing:-.02em;margin:0 0 5px}',
'.txcs-secTitle p{font-size:12.5px;color:#657891;margin:0;line-height:1.6;max-width:890px}',
'.txcs-eyebrow{font-size:10.5px;font-weight:850;letter-spacing:.12em;color:#ad7522;text-transform:uppercase;margin-bottom:7px}',
'.txcs-steps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}',
'.txcs-step{border:1px solid #dce5f0;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 3px 13px rgba(10,40,70,.035);min-width:0;position:relative}',
'.txcs-step:not(:last-child):after{content:"";position:absolute;right:-9px;top:44px;border-top:7px solid transparent;border-bottom:7px solid transparent;border-left:8px solid #e1aa35;z-index:2}',
'.txcs-stepHead{background:#10345c;padding:12px 12px 11px;min-height:83px;color:#fff}',
'.txcs-stepHead .txcs-id{display:inline-flex;align-items:center;justify-content:center;background:#fdb913;border-radius:8px;color:#122e53;font-size:11px;font-weight:900;width:25px;height:25px;margin-bottom:8px}',
'.txcs-stepHead strong{display:block;font-size:12.5px;line-height:1.28;color:#fff}',
'.txcs-stepMeta{padding:10px 12px 7px;background:#eff5fa;color:#225375;font-size:10.5px;font-weight:850;border-bottom:1px solid #e4ebf2;min-height:39px}',
'.txcs-stepBody{padding:11px 12px 13px}',
'.txcs-stepBody ul{padding:0 0 0 14px;margin:0;display:grid;gap:8px;font-size:11.5px;line-height:1.5;color:#415571}',
'.txcs-step:last-child .txcs-stepHead{background:linear-gradient(125deg,#0b777b,#0e5868)}',
'.txcs-step:nth-last-child(2) .txcs-stepHead{background:linear-gradient(125deg,#1a527f,#284d79)}',
'.txcs-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 17px}',
'.txcs-metric{background:#fff;border:1px solid #e2e8f1;border-radius:12px;padding:15px 16px;border-left:4px solid #d89e28}',
'.txcs-metric small{font-size:10.5px;color:#748398;display:block;margin-bottom:4px;font-weight:750}',
'.txcs-metric b{font-size:15px;line-height:1.3;color:#15395c}',
'.txcs-note{background:#e7f5f5;border:1px solid #c9e7e8;border-left:4px solid #0c8387;border-radius:10px;padding:12px 15px;margin-top:16px;font-size:12px;line-height:1.65;color:#1e555d}',
'.txcs-note.gold{background:#fff8e8;border-color:#f4e1b9;border-left-color:#d69d1b;color:#6d4e16}',
'.txcs-note b{color:inherit}',
'.txcs-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}',
'.txcs-card{background:#fff;border:1px solid #dfe7f0;border-radius:13px;padding:17px 18px;box-shadow:0 3px 12px rgba(17,49,84,.03)}',
'.txcs-cardTop{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}',
'.txcs-cardTop b{font-size:14px;color:#123359;font-weight:850}',
'.txcs-chip{background:#e8f2f8;color:#0e5979;font-size:10px;font-weight:850;border-radius:30px;padding:5px 10px;white-space:nowrap}',
'.txcs-card p{font-size:12px;line-height:1.7;margin:0;color:#55667b}',
'.txcs-card ul{font-size:12px;line-height:1.7;margin:5px 0 0;padding-left:17px;color:#435775}',
'.txcs-panel{background:#fff;border:1px solid #e1e8f2;border-radius:14px;padding:18px 20px;margin:14px 0}',
'.txcs-panel h4{margin:0 0 12px;font-size:14px;color:#113459}',
'.txcs-route{display:flex;gap:9px;align-items:stretch}',
'.txcs-routeNode{background:#f7f9fc;border:1px solid #dce7f1;border-top:4px solid #0c7e85;border-radius:11px;padding:13px;flex:1 1 0;min-width:0}',
'.txcs-routeNode b{display:block;font-size:12px;color:#13385a;margin-bottom:6px}',
'.txcs-routeNode span{font-size:11px;color:#61738c;line-height:1.5;display:block}',
'.txcs-arrow{display:flex;align-items:center;color:#d49b22;font-size:23px;font-weight:900;flex:none}',
'.txcs-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px;background:#0d848b}',
'.txcs-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #e2eaf1;overflow:hidden;border-radius:11px;font-size:12px;background:#fff}',
'.txcs-table th{text-align:left;background:#10345c;color:#fff;font-size:11px;font-weight:850;padding:12px 14px}',
'.txcs-table td{border-bottom:1px solid #e7edf3;padding:12px 14px;line-height:1.6;color:#415977;vertical-align:top}',
'.txcs-table tr:last-child td{border-bottom:0}',
'.txcs-table td:first-child{font-weight:850;color:#193a60;width:22%}',
'.txcs-list{display:grid;gap:11px}',
'.txcs-numrow{display:flex;gap:12px;align-items:flex-start;padding:13px;border:1px solid #e0e8f1;border-radius:11px;background:#fff}',
'.txcs-numb{flex:none;width:32px;height:32px;display:grid;place-items:center;border-radius:50%;background:#0d7e85;color:#fff;font-weight:900;font-size:12px}',
'.txcs-numrow strong{font-size:12.5px;display:block;color:#16385a;margin-bottom:4px}',
'.txcs-numrow span{font-size:11.5px;color:#5a6b81;line-height:1.5;display:block}',
'.txcs-foot{background:#fff;border-top:1px solid #e0e8f0;padding:11px 24px;font-size:10.5px;color:#718095;display:flex;justify-content:space-between;align-items:center;gap:10px;flex:none}',
'.txcs-foot b{color:#194568}',
'.txcs-headTitle{display:flex;align-items:center;gap:9px}',
'.txcs-headTitle .txcs-spark{display:grid;place-items:center;width:35px;height:35px;border-radius:10px;color:#132f50;background:#fdb913;font-size:20px;flex:none}',
'.txcs-ctab{display:inline-flex;gap:5px;align-items:center}',
'.txcs-pill{border:1px solid #d7e1ee;background:#fff;border-radius:8px;padding:7px 10px;font-size:11px;color:#375878;font-weight:800}',
'@media(max-width:1100px){.txcs-steps{grid-template-columns:repeat(3,minmax(0,1fr))}.txcs-step:not(:last-child):after{display:none}.txcs-route{flex-wrap:wrap}.txcs-routeNode{flex-basis:40%}.txcs-arrow{display:none}}',
'@media(max-width:750px){.txcs-backdrop{padding:8px}.txcs-modal{width:100%;height:98vh;border-radius:13px}.txcs-head{padding:18px}.txcs-hline h2{font-size:20px}.txcs-scroll{padding:15px}.txcs-toolbar{padding:7px}.txcs-steps,.txcs-grid,.txcs-metrics{grid-template-columns:1fr}.txcs-route{display:grid;grid-template-columns:1fr}.txcs-routeNode{min-width:0}.txcs-foot{padding:10px 15px}.txcs-chip{white-space:normal}}',
'button.txcs-entry{display:inline-flex;align-items:center;gap:5px;border:1px solid #d8ab42;border-radius:9px;padding:5px 9px;font-size:11px;font-weight:850;white-space:nowrap;line-height:1.35;color:#15365a;background:#fff9e9;vertical-align:middle;cursor:pointer;margin-left:10px;box-shadow:0 2px 7px rgba(184,132,29,.09)}',
'button.txcs-entry:hover,button.txcs-entry:focus-visible{border-color:#e7aa23;background:#fdb913;box-shadow:0 2px 12px rgba(213,160,52,.27)}',
'button.txcs-entry::before{content:"▤";font-size:14px;color:#b9780d}'
].join('');
function addStyle(){if(document.getElementById('txcs-style'))return;var el=document.createElement('style');el.id='txcs-style';el.textContent=css;document.head.appendChild(el)}
function sec(title,subtitle){return '<div class="txcs-secTitle"><div><div class="txcs-eyebrow">Ringkasan eksekutif · referensi cepat</div><h3>'+title+'</h3><p>'+subtitle+'</p></div></div>'}
function note(s,gold){return '<div class="txcs-note'+(gold?' gold':'')+'">'+s+'</div>'}
function card(title,chip,body){return '<article class="txcs-card"><div class="txcs-cardTop"><b>'+title+'</b><span class="txcs-chip">'+chip+'</span></div><p>'+body+'</p></article>'}
function grid(cards){return '<div class="txcs-grid">'+cards.join('')+'</div>'}
function metrics(items){return '<div class="txcs-metrics">'+items.map(function(a){return '<div class="txcs-metric"><small>'+a[0]+'</small><b>'+a[1]+'</b></div>'}).join('')+'</div>'}
function flow(items){return '<div class="txcs-steps">'+items.map(function(x,i){return '<section class="txcs-step"><div class="txcs-stepHead"><span class="txcs-id">'+('0'+(i+1)).slice(-2)+'</span><strong>'+x[0]+'</strong></div><div class="txcs-stepMeta">'+x[1]+'</div><div class="txcs-stepBody"><ul>'+x[2].map(function(y){return '<li>'+y+'</li>'}).join('')+'</ul></div></section>'}).join('')+'</div>'}
function route(items){return '<div class="txcs-route">'+items.map(function(x,i){return (i?'<div class="txcs-arrow">→</div>':'')+'<div class="txcs-routeNode"><b>'+x[0]+'</b><span>'+x[1]+'</span></div>'}).join('')+'</div>'}
function table(rows){return '<table class="txcs-table"><thead><tr><th>Aspek</th><th>PMO · Manajemen Proyek</th><th>CMO · Manajemen Perubahan</th></tr></thead><tbody>'+rows.map(function(r){return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td></tr>'}).join('')+'</tbody></table>'}
function list(items){return '<div class="txcs-list">'+items.map(function(a,i){return '<div class="txcs-numrow"><div class="txcs-numb">'+(i+1)+'</div><div><strong>'+a[0]+'</strong><span>'+a[1]+'</span></div></div>'}).join('')+'</div>'}
var pmPhases=[
['Perencanaan Proyek','T−1; awal tahun anggaran',['Dokumen Proyek: As-Is, To-Be, perbandingan, Charter, kriteria penyelesaian, dan rencana kerja.','Penetapan melalui Nota Dinas bersama PMO Kemenkeu dan PMO Unit.','WBS disusun setelah Nota Dinas bersama ditetapkan.']],
['Pelaksanaan Proyek','Sesuai rencana kerja',['PMO Kemenkeu mengoordinasikan PMO Unit dan unit teknis.','Perubahan lingkup, jadwal, atau biaya melalui Change Request dan persetujuan Ketua Organisasi Pengelola Proyek dan Perubahan.']],
['Pemantauan & Pengendalian','Berkala',['PMO Unit melaporkan progres rinci terhadap WBS.','PMO Kemenkeu mengonsolidasikan capaian dan menyampaikan laporan kepada Ketua.']],
['Penutupan Proyek','Setelah syarat penutupan dipenuhi',['Acceptance criteria terpenuhi, proyek dikeluarkan dari program transformasi, atau menjadi proyek unit.','PMO Unit mengajukan penutupan; PMO Kemenkeu menelaah.','Penutupan proyek tidak otomatis menutup pendampingan CM.']],
['Evaluasi Pascaproyek','≥ 3 bulan setelah proyek ditutup',['Dikoordinasikan PMO Kemenkeu.','Evaluasi manfaat: efisiensi biaya, proses bisnis, dan pemenuhan layanan.']]
];
var cmPhases=[
['Perencanaan Perubahan','Selaras rencana proyek & WBS',['7 analisis: dampak, risiko, stakeholder, jaringan pengelola perubahan, kesiapan, komunikasi, pelatihan.','Rencana dan indikator didokumentasikan dalam kertas kerja Manajemen Perubahan.']],
['Pelaksanaan Perubahan','Mengikuti jadwal implementasi',['Aktivasi jaringan perubahan dan penguatan kesiapan.','Komunikasi, pelatihan, dan pendampingan sesuai pemangku kepentingan.']],
['Pemantauan & Evaluasi','Berkala',['Pantau strategi komunikasi dan pelatihan.','Tindak lanjuti temuan dan ukur indikator keberhasilan pemanfaatan sistem baru.']],
['Evaluasi Pascaimplementasi','≥ 1 bulan setelah implementasi',['Nilai keberlanjutan adopsi dan perilaku kerja baru.','Evaluasi efektivitas penanganan isu serta kesiapan beralih dari pendampingan transisi ke layanan reguler.','Dokumentasi CMO Unit → CMO Kemenkeu → koordinasi PMO Kemenkeu.']],
['Penutupan CM','Setelah masa transisi & evaluasi',['Pastikan isu diselesaikan atau dialihkan; kanal layanan resmi siap.','Alihkan tanggung jawab pendampingan ke pemilik proses bisnis dan/atau pengelola operasional.','Dokumentasikan dengan BAST atau dokumen sejenis.']]
];
function pageFramework(kind){var pm=kind==='pmo';return sec(pm?'Siklus Manajemen Proyek':'Siklus Manajemen Perubahan',pm?'Dari dokumen proyek hingga evaluasi manfaat setelah penutupan.':'Dari kesiapan pengguna hingga evaluasi adopsi dan serah terima pascamasa transisi.')+
 metrics(pm?[['Dokumen kunci','Dokumen Proyek + WBS'],['Tenggat penetapan','15 hari kerja setelah kontrak kinerja'],['Evaluasi manfaat','≥ 3 bulan setelah penutupan']]:[['Perencanaan','7 analisis utama'],['Evaluasi pascaimplementasi','Paling cepat 1 bulan'],['Closing CM','Sesudah evaluasi dan transisi']])+
 flow(pm?pmPhases:cmPhases)+note(pm?'<b>Penting:</b> Penutupan proyek merupakan keputusan pengelolaan proyek. Evaluasi manfaat tetap dapat berlangsung setelah proyek ditutup. Penutupan CM memiliki kriteria dan masa transisi sendiri.':'<b>Penting:</b> Implementasi/go-live bukan akhir CM. Masa transisi tetap dikawal, evaluasi pascaimplementasi dilakukan paling cepat satu bulan, dan closing CM baru setelah kesiapan operasional serta mekanisme layanan resmi terpenuhi.')}
function pageTenggat(){return sec('Milestone dan ketentuan waktu PMO','Tenggat mengikuti draft KMK, bukan tanggal ilustratif.')+
grid([
card('Penyusunan Dokumen Proyek','T−1','Dikoordinasikan oleh unit yang mengelola transformasi dan perubahan pada tahun sebelum pelaksanaan proyek.'),
card('Penetapan Dokumen Proyek','≤ 15 hari kerja','Nota Dinas bersama PMO Kemenkeu dan PMO Unit, paling lambat setelah kontrak kinerja Kemenkeu Wide ditetapkan.'),
card('Penyusunan WBS','≤ 15 hari kerja','PMO Kemenkeu bersama PMO Unit menurunkan rencana kerja menjadi WBS sejak Nota Dinas bersama ditetapkan.'),
card('Evaluasi Pascaproyek','≥ 3 bulan','Dilakukan setelah proyek ditutup; menilai manfaat dalam aspek biaya, proses bisnis, dan layanan.')
])+note('<b>Catatan draf:</b> bagian pelaksanaan proyek pada dokumen versi (6) masih muncul dalam dua butir yang substansinya beririsan. Dalam cheatsheet ini disajikan sebagai satu fase pelaksanaan agar mudah dipahami.',true)}
function pageGovernance(kind){return sec('Peran dan akuntabilitas','Pemisahan penanggung jawab penting agar adopsi perubahan tidak tercampur dengan penyelesaian teknis proyek.')+
grid([
card('PMO Kemenkeu','Pusmantap','Mengelola perencanaan, pelaksanaan, pemantauan, dan evaluasi proyek/program transformasi, termasuk pembinaan dan koordinasi PMO Unit.'),
card('PMO Unit','Dibentuk Pimpinan UE I / Non Eselon','Mengendalikan rencana dan target dalam WBS serta mengoordinasikan unit pemilik proses bisnis dan unit teknis dengan PMO Kemenkeu.'),
card('CMO Kemenkeu','Pusmantap','Mengoordinasikan, memfasilitasi, dan memantau manajemen perubahan lintas unit serta membina CMO Unit.'),
card('CMO Unit','Dibentuk Pimpinan UE I / Non Eselon','Menjalankan strategi komunikasi dan pelatihan sesuai kertas kerja CM, berkoordinasi dengan PMO Unit, pemilik proses bisnis, dan unit teknis.')
])+
'<div class="txcs-panel"><h4>Perbedaan titik penutupan</h4>'+table([
['Pemicu','Kriteria penyelesaian proyek / keputusan penutupan.','Kesiapan adopsi, kesiapan operasional, dan kanal aduan resmi.'],
['Pengalihan','Pengelolaan hasil proyek dapat menjadi proyek unit atau operasional.','Pendampingan transisi beralih ke pemilik proses bisnis / unit operasional.'],
['Evaluasi berikutnya','Evaluasi pascaproyek ≥ 3 bulan setelah penutupan.','Evaluasi pascaimplementasi ≥ 1 bulan; hasilnya menjadi dasar closing CM.']
])+'</div>'+
note('Kedua fungsi berada di <b>Pusmantap</b> pada tingkat Kementerian Keuangan, namun berbeda objek pengelolaannya: <b>PMO mengawal deliverable proyek; CMO mengawal kesiapan, penerimaan, dan adopsi perubahan.</b>')}
function pageSync(){return sec('Satu proyek, dua lintasan pengelolaan','Diagram ini memperlihatkan titik-titik koordinasi kerja, bukan menyamakan waktu penutupan PMO dan CMO.')+
'<div class="txcs-panel"><h4>Lintasan PMO</h4>'+route([['Perencanaan','Dokumen Proyek, ND, WBS'],['Pelaksanaan','Progres & change request'],['Pemantauan','Capaian WBS & bukti'],['Penutupan','Kriteria proyek terpenuhi'],['Evaluasi','Manfaat ≥ 3 bulan']])+'</div>'+
'<div class="txcs-panel"><h4>Lintasan CMO</h4>'+route([['Perencanaan','7 analisis & strategi'],['Pelaksanaan','Jaringan, komunikasi, pelatihan'],['Pemantauan','Adopsi & tindak lanjut'],['Evaluasi Pasca','≥ 1 bulan setelah implementasi'],['Closing CM','Operasional & kanal resmi']])+'</div>'+
grid([
card('Kapan terhubung?','Perencanaan','Rencana CM diselaraskan dengan jadwal proyek dan WBS; perubahan ruang lingkup atau jadwal perlu ditelaah dampaknya pada CM.'),
card('Bagaimana saat go-live?','Pelaksanaan','PMO dapat menutup proyek sesuai acceptance criteria. CMO tetap mengelola pendampingan, adopsi, dan alur dukungan selama transisi.')
])}
function pageComm(){return sec('Rekomendasi Komunikasi','Contoh desain pesan yang dapat diadaptasi untuk proyek, bukan ketentuan wajib seluruh proyek KMK.')+
grid([
card('01 · Satu narasi','Pesan tunggal','Sampaikan perubahan yang terjadi dan kewenangan yang tetap melekat pada pemilik proses bisnis. Contoh SIPN: memperkuat, bukan menggantikan kewenangan Pemda atas NJOP/BPHTB.'),
card('02 · Sponsor lebih dulu','Leadership first','Pesan dan komitmen pimpinan disampaikan sebelum tonggak penting seperti penandatanganan PKS, bukan hanya berbarengan dengan acara tersebut.'),
card('03 · Ikuti milestone','Berbasis jadwal','Kaitkan komunikasi pengguna dengan uji coba, implementasi, dan pendampingan; jangan menumpuk sosialisasi menjelang akhir periode.'),
card('04 · Segmentasi penerima','Tepat sasaran','Bedakan tujuan dan pesan bagi pimpinan, pengelola proses bisnis, pengguna, petugas layanan, dan unit teknis.')
])+
'<div class="txcs-panel"><h4>Lima pesan wajib terjawab dalam sosialisasi</h4>'+list([['Mengapa','Alasan perubahan dan urgensinya.'],['Yang berubah','Proses kerja, sistem, kewenangan, atau cara memperoleh layanan.'],['Yang tidak berubah','Kewenangan dan aturan yang tetap berlaku.'],['Manfaat langsung','Apa yang lebih cepat, mudah, andal, atau terintegrasi.'],['Bantuan tersedia','Portal pengetahuan, pelatihan, kanal resmi, dan mekanisme eskalasi.']])+'</div>'}
function pageKnowledge(){return sec('Portal Knowledge','Contoh struktur satu pintu panduan untuk mendukung komunikasi, pelatihan, swabantu, dan penanganan aduan.')+
'<div class="txcs-grid">'+[
['01 · Kebijakan','Peraturan, keputusan, dan pedoman proses bisnis.','Semua'],
['02 · Aktivasi akses','SSO, MFA, aktivasi akun pengguna eksternal.','Pengguna'],
['03 · Hak akses','Role matrix, kewenangan dan pembagian akses.','Semua'],
['04 · Proses & standar data','Mapping, tagging, konversi kode, standar kualitas data.','Probis'],
['05 · Panduan sistem','User manual per peran, tutorial video, sandbox.','Pengguna'],
['06 · Dukungan','FAQ per fitur, alur aduan, SLA, kontak helpdesk.','Semua'],
['07 · Rekaman & materi','Rekaman sosialisasi, ToT, forum, materi pelatihan.','Semua'],
['08 · Jadwal & progres','Roadmap implementasi, jadwal gelombang dan progres.','Semua']
].map(function(a){return card(a[0],a[2],a[1])}).join('')+'</div>'+
note('<b>Checklist kesiapan konten:</b> materi harus memiliki penanggung jawab, versi yang berlaku, sasaran pembaca, tingkat akses, tanggal pemutakhiran, dan tautan kanal bantuan. Contoh kategori diadaptasi dari bahan Sinergi BAS.')}
function pageTransisi(){return sec('Complaint Handling · Masa Transisi','Contoh alur pendampingan ketika go-live baru berlangsung; kanal sementara harus mempunyai batas waktu dan mekanisme eskalasi.')+
'<div class="txcs-panel"><h4>Swabantu → Koordinasi transisi → Penanganan → Eskalasi</h4>'+route([
['T0 · Swabantu','Portal knowledge, FAQ, tutorial; pengguna mencari jawaban terlebih dahulu.'],
['T1 · Kanal transisi','Grup koordinasi sementara (misalnya WAG) dan helpdesk untuk membantu triase.'],
['T2 · Penanganan','Isu diarahkan ke pemilik probis, tim aplikasi, akses, atau data sesuai kategorinya.'],
['T3 · Eskalasi','Isu lintas unit, kebijakan, atau belum selesai dibahas pada forum eskalasi.']
])+'</div>'+
grid([
card('Isu proses bisnis','Pemilik probis','Penafsiran aturan, mapping/tagging, pedoman dan perubahan tata kerja.'),
card('Isu aplikasi & akses','Unit teknis / Service Desk','Bug, integrasi API, akun, SSO, MFA, dan hak akses.'),
card('Isu data','Unit data & aplikasi','Kualitas, validasi, sinkronisasi, dan pertukaran data.'),
card('Isu lintas unit','Forum eskalasi','Mengawal isu yang memerlukan keputusan lintas kewenangan atau perubahan kebijakan.')
])+
note('<b>Contoh dari bahan Sinergi BAS:</b> kanal sementara dapat memakai WAG dan SLA internal yang disepakati. Angka SLA contoh pada materi sosialisasi <b>bukan</b> standar berlaku untuk seluruh program. Seluruh isu penting tetap perlu dicatat dan mempunyai pemilik tindak lanjut.',true)}
function pageResmi(){return sec('Complaint Handling · Mekanisme Resmi','Gambaran alur bertingkat dari kanal pengguna menuju penyelesaian tiket pada layanan operasional reguler.')+
'<div class="txcs-panel"><h4>Alur tiket formal</h4>'+route([
['Pengguna','Menyampaikan permintaan atau insiden melalui kanal tiket resmi.'],
['L1 · Kemenkeu Prime','Agen layanan Biro KLI menerima, mencatat, mengklasifikasi, dan menyelesaikan isu umum.'],
['L2 · Pemilik probis / Service Desk BaTii','Menangani pertanyaan proses bisnis atau dukungan teknis sesuai penugasan.'],
['L3 · Incident Management','Menangani insiden aplikasi, basis data, infrastruktur, atau layanan.'],
['L4 · Problem Management','Menganalisis akar masalah untuk isu berulang atau kompleks.']
])+'</div>'+
grid([
card('Kanal layanan','Resmi','Pengguna menerima nomor tiket, status proses, dan tindak lanjut yang dapat ditelusuri.'),
card('Pengelola & eskalasi','Kewenangan','Perbedaan kategori masalah menentukan rute penanganan; tidak semua tiket harus melewati seluruh layer.'),
card('Kesiapan sebelum closing CM','Wajib dipastikan','Rute tiket, SLA, knowledge base, PIC, mekanisme eskalasi, dan informasi kepada pengguna telah tersedia.'),
card('Penutupan tiket','Terukur','Penyelesaian dan konfirmasi kepada pengguna dilakukan oleh pihak berwenang sesuai prosedur layanan.')
])+
note('<b>Ilustrasi:</b> kategori L1–L4 disarikan dari contoh alur Sinergi BAS yang dibahas dalam bahan rapat. Struktur dan petugas aktual harus mengikuti tata kelola ITSM/layanan resmi untuk masing-masing aplikasi.')}
function pageClosing(){return sec('Evaluasi menuju Penutupan CM','Penutupan CM adalah akhir pendampingan transisi, bukan otomatis saat proyek selesai atau aplikasi di-hosting.')+
metrics([['Titik awal','Implementasi sistem baru'],['Evaluasi pascaimplementasi','Paling cepat 1 bulan'],['Bukti penutupan','BAST / dokumen sejenis']])+
'<div class="txcs-panel"><h4>Gerbang kesiapan penutupan</h4>'+list([
['Hasil evaluasi tersedia','Adopsi dan perilaku kerja baru sudah dinilai serta didokumentasikan oleh CMO Unit.'],
['Isu dan resistensi terkendali','Sisa masalah telah diselesaikan atau dialihkan dengan penanggung jawab dan tindak lanjut yang jelas.'],
['Kanal layanan resmi siap','Mekanisme tiket, klasifikasi aduan, SLA, eskalasi, dan knowledge base telah disepakati.'],
['Pengguna sudah diberi informasi','Peralihan dari kanal sementara menuju kanal resmi telah dikomunikasikan.'],
['Tanggung jawab dialihkan','Pemilik proses bisnis/unit operasional menerima pendampingan dan pengelolaan lanjutan melalui BAST atau dokumen sejenis.']
])+'</div>'+
note('<b>Urutan:</b> Go-live & masa transisi → Evaluasi Pascaimplementasi Perubahan → Penutupan Manajemen Perubahan. Evaluasi PMO atas manfaat proyek tetap berdiri sendiri setelah penutupan proyek.')}
function pageKoordinasi(){
 return sec('Alur Koordinasi PMO–CMO','Diagram swimlane per peran dan hubungan koordinasi sepanjang siklus proyek serta perubahan. Klik fase untuk melihat alur lengkap.')+
  (typeof koHtml==='function'?'<div class="txcs-ko">'+koHtml()+'</div>':note('Diagram koordinasi belum dapat dimuat. Muat ulang halaman untuk mengambil versi terbaru.'));
}
var tabs={
 pmo:[['framework','Framework',function(){return pageFramework('pmo')}],['koordinasi','Alur Koordinasi',pageKoordinasi],['tenggat','Tahapan & Tenggat',pageTenggat],['tata','Tata Kelola',function(){return pageGovernance('pmo')}],['sinergi','Sinergi PMO–CMO',pageSync]],
 cmo:[['framework','Framework',function(){return pageFramework('cmo')}],['koordinasi','Alur Koordinasi',pageKoordinasi],['tata','Tata Kelola',function(){return pageGovernance('cmo')}],['closing','Evaluasi & Closing',pageClosing],['kom','Rekomendasi Komunikasi',pageComm],['knowledge','Portal Knowledge',pageKnowledge],['transisi','Aduan Masa Transisi',pageTransisi],['resmi','Aduan Resmi',pageResmi]]
};
var current=null,prevFocus=null;
function closeCheatsheet(){if(!current)return;current.remove();current=null;document.removeEventListener('keydown',onKey);if(prevFocus&&prevFocus.focus)prevFocus.focus()}
function onKey(e){if(e.key==='Escape'){e.preventDefault();closeCheatsheet()}}
function openCheatsheet(mode){addStyle();closeCheatsheet();mode=mode==='pmo'?'pmo':'cmo';prevFocus=document.activeElement;var arr=tabs[mode],name=mode==='pmo'?'Project Management':'Change Management';var ov=document.createElement('div');ov.className='txcs-backdrop';ov.innerHTML='<section class="txcs-modal" role="dialog" aria-modal="true" aria-label="Cheatsheet '+name+'">'+
'<header class="txcs-head"><div class="txcs-kicker">Pusmantap · Program Transformasi 2025–2029</div><div class="txcs-hline"><div class="txcs-headTitle"><div class="txcs-spark">▤</div><div><h2>Cheatsheet '+name+'</h2><p>Framework, alur kerja, tata kelola, dan referensi praktis dalam satu tampilan.</p></div></div><button class="txcs-x" type="button" data-txclose aria-label="Tutup cheatsheet" title="Tutup">×</button></div>'+
'<div class="txcs-legend"><span class="txcs-highlight">Draft KMK Peta Rencana Transformasi Digital (6)</span><span>Manajemen Proyek & Perubahan</span><span>Referensi cepat</span></div></header>'+
'<nav class="txcs-toolbar" role="tablist" aria-label="Tab cheatsheet">'+arr.map(function(a,i){return '<button type="button" class="txcs-tab'+(i?'':' on')+'" role="tab" aria-selected="'+(!i)+'" data-tx-tab="'+a[0]+'">'+a[1]+'</button>'}).join('')+'</nav>'+
'<div class="txcs-scroll">'+arr.map(function(a,i){return '<section class="txcs-pane" role="tabpanel" data-tx-pane="'+a[0]+'"'+(i?' hidden':'')+'>'+a[2]()+'</section>'}).join('')+'</div>'+
'<footer class="txcs-foot"><span><b>Cheatsheet = referensi tata kelola.</b> Untuk cara mengisi aplikasi, gunakan ikon <b>?</b> Bantuan di masing-masing halaman.</span><span>Draft · November 2026</span></footer></section>';
document.body.appendChild(ov);current=ov;if(typeof koWire==='function')koWire(ov);document.addEventListener('keydown',onKey);ov.addEventListener('click',function(e){if(e.target===ov||e.target.closest('[data-txclose]')){closeCheatsheet();return}var btn=e.target.closest('[data-tx-tab]');if(!btn)return;var key=btn.getAttribute('data-tx-tab');ov.querySelectorAll('[data-tx-tab]').forEach(function(x){var yes=x.getAttribute('data-tx-tab')===key;x.classList.toggle('on',yes);x.setAttribute('aria-selected',String(yes))});ov.querySelectorAll('[data-tx-pane]').forEach(function(p){p.hidden=p.getAttribute('data-tx-pane')!==key});ov.querySelector('.txcs-scroll').scrollTop=0});ov.querySelector('.txcs-x').focus();return ov}
window.openTxCheatsheet=openCheatsheet;
window.txCheatsheetVersion='2026.11-KMK6-koordinasi-v3';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addStyle);else addStyle();
})();