/* Standar Filter & Cari — Modul Transformasi.
 * Aturan (berlaku untuk semua area; Project Selection menjadi acuan pertama):
 * 1. Panel Filter hanya memuat kolom KATEGORI yang tampil di tabel/tampilan aktif
 *    (Tahun, Program, UIC, Status, Kategori, Asal, Kelengkapan, Tahapan, PIC, dst.).
 *    Pilihan diambil dari data yang ada, bukan daftar tetap. Kolom teks bebas (nama,
 *    deskripsi, narasi, catatan) dan kolom hampir-unik (kode, nomor dokumen) tidak masuk filter.
 * 2. Tata letak: grid 4 kolom sama lebar (.mt-fgrid); Program memakai 2 kolom (.ps27-f-wide);
 *    tablet 2 kolom, ponsel 1 kolom. Label di atas, tinggi kontrol seragam.
 * 3. Kolom Cari tidak berada di panel Filter: diletakkan di kanan baris tab tampilan
 *    (MT_TABSEARCH), kecuali WBS yang menempatkan Cari di toolbar daftar tabel, dan hanya mencari teks pada tabel tab tersebut. Tab tanpa tabel
 *    (pembuat dokumen, formulir) tidak diberi kolom Cari.
 *
 * Pemakaian: '<nav ...tab...>'+MT_TABSEARCH('scope-unik',nilai,'Cari ...')
 *            window.MT_TABSEARCH_SET['scope-unik']=function(v){ ...simpan state... };
 */
(function(){
'use strict';
if(window.MT_TABSEARCH)return;
function attr(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
window.MT_TABSEARCH_SET=window.MT_TABSEARCH_SET||{};
window.MT_TABSEARCH=function(scope,value,placeholder){
 return '<label class="mt-tabsearch"><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'+
  '<input type="search" data-mt-tabsearch="'+attr(scope)+'" value="'+attr(value||'')+'" placeholder="'+attr(placeholder||'Cari...')+'" aria-label="'+attr(placeholder||'Cari')+'"></label>';
};
if(typeof document==='undefined'||typeof document.addEventListener!=='function')return;
/* Tabel bersama (tbl() di index.html): bila satu baris subtab (.subt) hanya membawahi SATU tabel,
   kolom Cari tabel itu dipindah ke kanan baris subtab. Handler input tetap memakai [data-q]. */
var ICON='<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
function placeTblSearch(){
 var view=document.getElementById('view');if(!view)return;
 var seq=view.querySelectorAll('.subt, [id^="tw-"]'),groups=[],cur=null;
 for(var i=0;i<seq.length;i++){var el=seq[i];
  if(el.classList.contains('subt')){if(el.closest('.ov,.modal'))continue;cur={nav:el,tables:[]};groups.push(cur)}
  else if(cur)cur.tables.push(el)}
 groups.forEach(function(g){
  if(g.tables.length!==1)return;
  var inp=g.tables[0].querySelector('.tsearch input[data-q]');if(!inp)return;
  var lab=document.createElement('label');lab.className='mt-tabsearch mt-tabsearch-tbl';lab.innerHTML=ICON;
  lab.appendChild(inp);g.tables[0].querySelector('.tsearch').classList.add('mt-moved');
  /* Bila di antara subtab dan tabel ada baris chip Program (.pchips, mis. WBS & progres), Cari dan tombol aksi
     (+ Item WBS, menu ⋮) ditaruh di kanan baris chip itu; baris subtab jadi penuh untuk tab saja. */
  var pc=null,n=g.nav.parentNode.nextElementSibling;for(var j=0;j<4&&n&&!pc;j++){if(n.classList&&n.classList.contains('pchips'))pc=n;else if(n.querySelector&&n.querySelector('.pchips')&&!n.contains(g.tables[0]))pc=n.querySelector('.pchips');n=n.nextElementSibling}
  /* Tanpa baris chip: tombol aksi (+ Item WBS, ⋮) masuk ke kepala tabel; Cari tetap di kanan baris subtab seperti tab lain. */
  var band=g.nav.parentNode,bar0=band.querySelector('.wbs-actionbar'),tb=g.tables[0].querySelector('.tbar');
  /* WBS Perencanaan/Pelaksanaan: pencarian tetap pada toolbar daftar, bukan baris tab.
     Pindahkan node input asli agar state, keyboard shortcut dan handler data-q tetap sama. */
  if(g.tables[0].id==='tw-wbs'&&band.classList.contains('mt-pmo-subtab-band')&&tb){
   var wbsTools=document.createElement('div');wbsTools.className='tb-tools mt-wbs-list-tools';
   wbsTools.appendChild(lab);if(bar0)wbsTools.appendChild(bar0);
   tb.appendChild(wbsTools);tb.classList.add('tb-has-tools');
   band.classList.remove('mt-subt-row');band.classList.add('mt-subt-full');return;
  }
  if(!pc&&bar0&&tb){var t2=document.createElement('div');t2.className='pc-tools tb-tools';t2.appendChild(bar0);tb.appendChild(t2);tb.classList.add('tb-has-tools')}
  if(pc){var tools=document.createElement('div');tools.className='pc-tools';tools.appendChild(lab);var bar=g.nav.parentNode.querySelector('.wbs-actionbar');if(bar)tools.appendChild(bar);pc.appendChild(tools);pc.classList.add('pc-has-tools');g.nav.parentNode.classList.add('mt-subt-full');return}
  if(g.nav.nextSibling)g.nav.parentNode.insertBefore(lab,g.nav.nextSibling);else g.nav.parentNode.appendChild(lab);
  g.nav.parentNode.classList.add('mt-subt-row');
 });
}
window.MT_PLACE_TBL_SEARCH=placeTblSearch;
if(typeof window.render==='function'&&!window.render.__mtWrapped){
 var orig=window.render;
 window.render=function(){window.TVIEW=[];var r=orig.apply(this,arguments);try{placeTblSearch()}catch(e){}return r};
 window.render.__mtWrapped=true;
}
var timer=0;
document.addEventListener('input',function(e){
 var el=e.target;if(!el||!el.matches||!el.matches('input[data-mt-tabsearch]'))return;
 var scope=el.getAttribute('data-mt-tabsearch'),fn=window.MT_TABSEARCH_SET[scope];if(!fn)return;
 var v=el.value,cursor=el.selectionStart;
 e.stopPropagation();
 fn(v);try{window.save&&window.save()}catch(_){}
 clearTimeout(timer);
 timer=setTimeout(function(){
  if(typeof window.render==='function')window.render();
  var next=document.querySelector('input[data-mt-tabsearch="'+scope.replace(/"/g,'')+'"]');
  if(next){next.focus({preventScroll:true});try{next.setSelectionRange(cursor,cursor)}catch(_){}}
 },260);
},true);
if(!document.getElementById('mt-filter-kit-css')&&document.head){
 var s=document.createElement('style');s.id='mt-filter-kit-css';
 s.textContent=
 /* Kolom Cari di samping tab */
 '#app .mt-tabsearch{position:relative;display:flex;align-items:center;flex:0 1 300px;min-width:180px;margin:0 0 0 auto;align-self:center}'+
 '#app .mt-tabsearch svg{position:absolute;left:11px;color:#6d84a0;pointer-events:none}'+
 '#app .mt-tabsearch input{box-sizing:border-box!important;width:100%!important;height:36px!important;margin:0!important;padding:6px 11px 6px 33px!important;border:1px solid #cddbea!important;border-radius:9px!important;background:#fff!important;color:#173a66;font:600 12px Inter,"Nunito Sans",Arial,sans-serif}'+
 '#app .mt-tabsearch input:focus{outline:2px solid #fdb913;outline-offset:1px;border-color:#fdb913}'+
 /* WBS: tab tetap simetris; pencarian mengisi ruang di toolbar tabel. */
 '#app .mt-pmo-subtab-band:not(:has(>.mt-tabsearch)):not(:has(>.wbs-actionbar))>.subt.ctabs>a{flex:1 1 0!important;justify-content:center!important}'+
 '#app #tw-wbs .tbar .mt-wbs-list-tools{flex:1 1 420px;justify-content:flex-end;flex-wrap:wrap;min-width:0}'+
 '#app #tw-wbs .tbar .mt-wbs-list-tools>.mt-tabsearch{flex:1 1 200px!important;width:auto!important;min-width:160px!important;max-width:none!important;margin:0!important;order:0!important}'+
 '#app #tw-wbs .tbar .mt-wbs-list-tools>.wbs-actionbar{flex:0 0 auto;max-width:100%;flex-wrap:wrap}'+
 '@media(max-width:650px){#app #tw-wbs .tbar .mt-wbs-list-tools{flex:1 1 100%;width:100%}#app #tw-wbs .tbar .mt-wbs-list-tools>.mt-tabsearch{flex:1 1 100%!important;min-width:0!important}#app #tw-wbs .tbar .mt-wbs-list-tools>.wbs-actionbar{justify-content:flex-end}}'+
 /* Grid filter standar: 4 kolom sama lebar */
 '#app .ps27 .mt-std-filter .ps27-filter-fields.mt-fgrid{display:grid!important;grid-template-columns:repeat(var(--mt-fcols,4),minmax(0,1fr))!important;gap:10px 14px!important;align-items:end!important}'+
 '#app .ps27 .mt-std-filter .mt-fgrid>label{grid-column:span 1!important;width:auto!important;min-width:0!important}'+
 '#app .ps27 .mt-std-filter .mt-fgrid>label.ps27-f-wide{grid-column:span 2!important}'+
 '#app .ps27 .mt-std-filter .mt-fgrid select,#app .ps27 .mt-std-filter .mt-fgrid input{width:100%!important;min-width:0!important;height:40px}'+
 '@media(max-width:1000px){#app .ps27 .mt-std-filter .ps27-filter-fields.mt-fgrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}'+
 /* Baris tab + Cari: di tablet/ponsel Cari turun ke baris sendiri agar tab tidak terpotong */
 '@media(max-width:1000px){#app .psbank-subhead,#app .psbank-scope-stage .psbank-scope-tabline,#app .ps27 .ps27-priority-head{flex-wrap:wrap!important}#app .mt-tabsearch{order:9;flex:1 1 100%!important;max-width:none;margin:6px 0!important}}'+
 /* Header filter di ponsel: judul satu baris, label filter aktif di bawahnya */
 '@media(max-width:720px){#app .ps27 .mt-std-filter .ps27-filter-header{height:auto!important;min-height:0!important;max-height:none!important;flex-wrap:wrap!important}#app .ps27 .mt-std-filter .ps27-filter-titlebar{flex:1 1 100%!important;max-width:none!important;min-height:44px}#app .ps27 .mt-std-filter .ps27-filter-active{flex:1 1 100%!important;flex-wrap:wrap}}'+
 /* Panel filter tabel bersama (PMO/CM): grid 6 kolom, lebar field via --sp */
 '#app .flt .fbar.mt-g6{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:10px 12px!important;align-items:end!important}'+
 '#app .flt .fbar[hidden],#app .flt .fbar.mt-g6[hidden],#app .ps27 .mt-std-filter .mt-fgrid[hidden],#app .ps27 .mt-std-filter .ps27-filter-fields[hidden],#app .mt-subt-row[hidden]{display:none!important}'+
 /* Bilah filter lebih tipis & tidak mendominasi: 34 px, label terang, tombol buka-tutup kecil */
 '#app #view .flt.pmo-unified{grid-template-columns:max-content minmax(0,1fr)!important;grid-template-rows:34px auto!important;background:#FFF9E9!important;border-color:#E7C97A!important}'+
 '#app #view .flt.pmo-unified>.lp{height:34px!important;min-height:34px!important;padding:0 10px!important;background:linear-gradient(135deg,#0B2447,#17457F)!important;color:#fff!important;border-right:0!important;border-radius:11px 0 0 11px!important;width:auto!important;min-width:0!important;padding:0 14px!important}'+
 '#app #view .flt.pmo-unified.open>.lp{border-radius:11px 0 0 0!important}'+
 '#app #view .flt.pmo-unified>.lp .gi{width:20px!important;height:20px!important;background:transparent!important;border:0!important;box-shadow:none!important;color:#FDB913!important}'+
 '#app #view .flt.pmo-unified>.lp .gi svg{width:15px!important;height:15px!important}'+
 '#app #view .flt.pmo-unified>.lp .lt{gap:6px!important}#app #view .flt.pmo-unified>.lp .lt b{font-size:12.5px!important;color:#fff!important}'+
 '#app #view .flt.pmo-unified .ftop{height:34px!important;min-height:34px!important;padding:0 8px 0 12px!important;background:transparent!important;background-image:none!important}'+
 '#app #view .flt.pmo-unified .ftop .k{font-size:10.5px!important}#app #view .flt.pmo-unified .ftop{font-size:12px!important}'+
 '#app #view .flt.pmo-unified .fcar{width:24px!important;height:24px!important;flex:0 0 24px!important;font-size:9px!important;box-shadow:none!important}'+
 '#app .flt .fbar.mt-g6>.fg{grid-column:span var(--sp,1)!important;width:auto!important;min-width:0!important;max-width:none!important;flex:none!important}'+
 '#app .flt .fbar.mt-g6>.fg .sel,#app .flt .fbar.mt-g6>.fg select,#app .flt .fbar.mt-g6>.fg input{width:100%!important;min-width:0!important;max-width:none!important}'+
 '#app .flt .fbar.mt-g6 .pseg{display:flex!important;width:100%!important}#app .flt .fbar.mt-g6 .pseg button{flex:1 1 0!important;min-width:0!important;padding-inline:6px!important;white-space:nowrap!important}'+
 '#app .mt-subt-row{display:flex!important;flex-direction:row!important;align-items:center!important;flex-wrap:nowrap!important;gap:10px}#app .mt-subt-row>.subt{flex:1 1 auto;min-width:0}#app .mt-subt-row>.mt-tabsearch{flex:0 0 clamp(260px,32%,420px)!important;width:clamp(260px,32%,420px)!important;min-width:0;max-width:none!important}'+
 '@media(max-width:1000px){#app .mt-subt-row{flex-wrap:wrap!important}#app .mt-subt-row>.mt-tabsearch{flex:1 1 100%!important}}#app .tsearch.mt-moved{display:none!important}'+
 '@media(max-width:1000px){#app .flt .fbar.mt-g6{grid-template-columns:repeat(2,minmax(0,1fr))!important}#app .flt .fbar.mt-g6>.fg{grid-column:span 1!important}#app .flt .fbar.mt-g6>.fg.w2{grid-column:span 2!important}}'+
 '@media(max-width:600px){#app .flt .fbar.mt-g6 .pseg button{font-size:10.5px!important;padding-inline:2px!important}#app .flt .fbar.mt-g6{grid-template-columns:minmax(0,1fr)!important}#app .flt .fbar.mt-g6>.fg,#app .flt .fbar.mt-g6>.fg.w2{grid-column:span 1!important}}'+
 '@media(max-width:600px){#app .ps27 .mt-std-filter .ps27-filter-fields.mt-fgrid{grid-template-columns:minmax(0,1fr)!important}#app .ps27 .mt-std-filter .mt-fgrid>label.ps27-f-wide{grid-column:span 1!important}#app .mt-tabsearch{flex:1 1 100%;margin:6px 0}}';
 document.head.appendChild(s);
}
})();


/* 261125-MT-02 — Shared icon-only action system.
 * Keeps existing action handlers, titles, SVG semantics and navigation dimensions.
 * Styles generated tables, cards, toolbars and dialogs, including subsequent renders.
 */
(function mtActionIconStandard(){
 'use strict';
 if(document.getElementById('mt-action-icon-standard-v1'))return;
 const css=document.createElement('style');
 css.id='mt-action-icon-standard-v1';
 css.textContent=`
html :is(#app,#root,body) .mt-action-icon.mt-action-icon[data-mt-tone]{
 --mt-ic-fg:#315e91;--mt-ic-bg:#f2f6fb;--mt-ic-border:#c8daed;--mt-ic-hover:#e5effa;--mt-ic-hover-border:#94b4d6;
 box-sizing:border-box!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;
 width:32px!important;min-width:32px!important;max-width:32px!important;height:32px!important;min-height:32px!important;max-height:32px!important;
 flex:0 0 32px!important;padding:0!important;border:1px solid var(--mt-ic-border)!important;border-radius:9px!important;
 background:var(--mt-ic-bg)!important;color:var(--mt-ic-fg)!important;line-height:1!important;font-size:15px!important;
 box-shadow:0 1px 2px rgba(16,45,83,.045)!important;transform:none!important;filter:none!important;
 transition:background-color .14s ease,border-color .14s ease,color .14s ease,box-shadow .14s ease!important;vertical-align:middle;
}
html :is(#app,#root,body) .mt-action-icon.mt-action-icon[data-mt-tone="teal"]{--mt-ic-fg:#087f72;--mt-ic-bg:#eff9f6;--mt-ic-border:#b2dfd3;--mt-ic-hover:#e0f3ed;--mt-ic-hover-border:#80c7b6}
html :is(#app,#root,body) .mt-action-icon.mt-action-icon[data-mt-tone="amber"]{--mt-ic-fg:#b87509;--mt-ic-bg:#fff9ed;--mt-ic-border:#f0d19a;--mt-ic-hover:#fff0d4;--mt-ic-hover-border:#e7b963}
html :is(#app,#root,body) .mt-action-icon.mt-action-icon[data-mt-tone="indigo"]{--mt-ic-fg:#565bc8;--mt-ic-bg:#f3f2ff;--mt-ic-border:#d2d0fc;--mt-ic-hover:#e8e6ff;--mt-ic-hover-border:#a9a5f1}
html :is(#app,#root,body) .mt-action-icon.mt-action-icon[data-mt-tone="red"]{--mt-ic-fg:#dc4148;--mt-ic-bg:#fff3f3;--mt-ic-border:#f4bfc2;--mt-ic-hover:#ffe5e6;--mt-ic-hover-border:#e99ca1}
html :is(#app,#root,body) .mt-action-icon.mt-action-icon[data-mt-tone="slate"]{--mt-ic-fg:#506784;--mt-ic-bg:#f2f5f9;--mt-ic-border:#d2dce8;--mt-ic-hover:#e5ecf5;--mt-ic-hover-border:#a8bdd5}
html :is(#app,#root,body) .mt-action-icon.mt-action-icon[data-mt-tone]:is(:hover,:focus-visible,[aria-pressed="true"]):not(:disabled):not([aria-disabled="true"]){
 background:var(--mt-ic-hover)!important;border-color:var(--mt-ic-hover-border)!important;color:var(--mt-ic-fg)!important;transform:none!important;filter:none!important;
}
html :is(#app,#root,body) .mt-action-icon.mt-action-icon[data-mt-tone]:focus-visible{outline:2px solid var(--mt-ic-fg)!important;outline-offset:2px}
html :is(#app,#root,body) .mt-action-icon.mt-action-icon[data-mt-tone]:is(:disabled,[aria-disabled="true"]){opacity:.42!important;cursor:not-allowed!important;box-shadow:none!important}
html :is(#app,#root,body) .mt-action-icon.mt-action-icon[data-mt-tone]>svg{width:16px!important;height:16px!important;min-width:16px!important;min-height:16px!important;flex:none!important;display:block;pointer-events:none}
html :is(#app,#root,body) .ract:has(>.mt-action-icon){gap:4px;flex-wrap:wrap;align-items:center}
@media(prefers-reduced-motion:reduce){html :is(#app,#root,body) .mt-action-icon[data-mt-tone]{transition:none!important}}
`;
 document.head.appendChild(css);
 const nodes='button,a[href],summary,[role="button"]';
 const known='.psbank-action-icon,.pdocs-action-icon,.icon-btn,.pm-ws-icon,.mt-edit-icon,.sl-icon,.sw-cp,.activity-link-copy,.inv-n,.wbs-kebab,.ract>button,.t-ibtn,.act-attachment-remove,.abdel,.od-x,.od-slot';
 const glyphs={
  edit:'<path d="M12 20h9M16.8 3.8a2.2 2.2 0 0 1 3.1 3.1L9 17.8l-4.5 1 1-4.5z"/>',
  delete:'<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
  upload:'<path d="M12 16V4m0 0-4 4m4-4 4 4M4 15v5h16v-5"/>',
  download:'<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
  view:'<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  link:'<path d="M10 13a4 4 0 0 0 6 .5l3-3a4 4 0 1 0-5.7-5.7l-1.5 1.5M14 11a4 4 0 0 0-6-.5l-3 3a4 4 0 1 0 5.7 5.7l1.5-1.5"/>',
  more:'<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
  add:'<path d="M12 5v14M5 12h14"/>'
 };
 const glyphMap=new Map([['✎','edit'],['✏','edit'],['✏️','edit'],['🗑','delete'],['🗑️','delete'],['⇪','upload'],['⇧','upload'],['⬆','upload'],['⬆️','upload'],['⇩','download'],['⬇','download'],['⬇️','download'],['↓','download'],['👁','view'],['👁️','view'],['⧉','copy'],['✕','close'],['×','close'],['🔗','link'],['⋮','more'],['+','add']]);
 const toneByKind={edit:'amber',delete:'red',upload:'indigo',download:'indigo',view:'blue',copy:'blue',close:'slate',link:'teal',more:'slate',add:'teal'};
 function plain(el){
  let out='';
  for(const n of el.childNodes){
   if(n.nodeType===3)out+=n.textContent;
   else if(n.nodeType===1&&!n.matches('svg,i[aria-hidden="true"],.sr-only,.visually-hidden,[hidden]')&&!n.querySelector('svg'))out+=n.textContent;
  }
  return out.trim();
 }
 function tone(el,label,kind){
  const c=el.classList;
  if(c.contains('delete')||c.contains('ib-del')||c.contains('one-del')||c.contains('d')||el.matches('[data-act="del"],[data-bank-delete],[data-atrm]'))return 'red';
  if(c.contains('edit')||c.contains('ib-edit')||c.contains('mt-edit-icon')||el.matches('[data-act="edit"],[data-bank-edit-doc]'))return 'amber';
  if(c.contains('upload')||c.contains('download')||el.matches('[data-bank-upload],[data-atdl]'))return 'indigo';
  if(c.contains('map')||c.contains('add')||c.contains('whatsapp-share')||el.matches('[data-bank-map],[data-bank-add]'))return 'teal';
  if(/^(hapus (?:filter|pencarian)|reset|tutup|batal|ciutkan|sembunyikan|sebelumnya|berikutnya|bulan sebelumnya|bulan berikutnya|minggu sebelumnya|minggu berikutnya|aksi lainnya|lainnya|pengaturan|aturan)/i.test(label))return 'slate';
  if(/^(hapus|delete|remove|arsipkan|buang)|hanya .*bisa dihapus/i.test(label))return 'red';
  if(/^(ubah|edit|revisi|sunting|koreksi|ganti)/i.test(label))return 'amber';
  if(/^(unggah|upload|unduh|download|impor|import|ekspor|export|cetak|print)/i.test(label))return 'indigo';
  if(/^(peta|mapping|petakan|hubung|tautkan|tambah|add|validasi|setujui|verifikasi|bagikan|share|kirim)/i.test(label))return 'teal';
  if(/^(lihat|buka|pratinjau|preview|detail|dokumen|salin|copy|duplikat|riwayat|laporan)/i.test(label))return 'blue';
  return toneByKind[kind]||'slate';
 }
 function styleOne(el){
  if(!el||!el.matches||!el.matches(nodes))return;
  // Tanya Bantuan is a floating help widget, not an action icon. Preserve its native appearance.
  if(el.closest('#skqa-fab,.skqa-fab,#skqa,.skqa,.skqa-ft')||[el.getAttribute('aria-label'),el.getAttribute('title')].some(v=>/^tanya bantuan$/i.test((v||'').trim()))){
   el.classList.remove('mt-action-icon');el.removeAttribute('data-mt-tone');return;
  }
  if(el.classList.contains('mt-action-icon'))return;
  if(el.closest('.top,.t-dh2,.pm-stage-shell,.ptabs,.subt,[role="tablist"],.flt,.fbar,.tfoot,.t-pager,.t-mnav,.t-dnav')||el.matches('[role="tab"],[data-pg],[data-tpg],.t-acc,.search-clear-btn,.fx,.ui-info-control,.ui-help-aligned,.hq,.hlp,.ui-note-link,[role="switch"],[aria-haspopup="dialog"].ui-info-control'))return;
  const label=(el.getAttribute('aria-label')||el.getAttribute('title')||'').trim(),txt=plain(el),kind=glyphMap.get(txt);
  const svg=!!el.querySelector('svg');
  if(!kind&&txt)return; // never resize text-bearing buttons or count chips
  if(!svg&&!kind&&!el.matches(known))return;
  if(!label&&!el.matches(known))return;
  if(!svg&&!kind)return; // avoid guessing how a CSS-only icon is rendered
  if(el.matches('a')&&!label&&!el.matches(known))return;
  if(el.getAttribute('aria-expanded')!==null&&!el.matches('.wbs-kebab,.icon-btn,.psbank-action-icon'))return;
  const k=tone(el,label,kind);
  if(kind&&!svg&&el.childElementCount===0){
   const icon=kind==='close'&&k==='red'?'delete':kind;
   if(glyphs[icon])el.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+glyphs[icon]+'</svg>';
  }
  if(!el.hasAttribute('aria-label')&&label)el.setAttribute('aria-label',label);
  el.setAttribute('data-mt-tone',k);el.classList.add('mt-action-icon');
 }
 function scan(root){
  if(!root||root.nodeType!==1)return;
  styleOne(root);
  root.querySelectorAll(nodes).forEach(styleOne);
 }
 function init(){
  scan(document.body);
  const observer=new MutationObserver(records=>{
   for(const r of records){for(const n of r.addedNodes){if(n.nodeType===1)scan(n)}if(r.target.nodeType===1&&r.target.matches(nodes))styleOne(r.target)}
  });
  observer.observe(document.body,{childList:true,subtree:true});
 }
 if(document.body)init();else document.addEventListener('DOMContentLoaded',init,{once:true});
})();
