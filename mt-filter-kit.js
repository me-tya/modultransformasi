/* Standar Filter & Cari — Modul Transformasi.
 * Aturan (berlaku untuk semua area; Project Selection menjadi acuan pertama):
 * 1. Panel Filter hanya memuat kolom KATEGORI yang tampil di tabel/tampilan aktif
 *    (Tahun, Program, UIC, Status, Kategori, Asal, Kelengkapan, Tahapan, PIC, dst.).
 *    Pilihan diambil dari data yang ada, bukan daftar tetap. Kolom teks bebas (nama,
 *    deskripsi, narasi, catatan) dan kolom hampir-unik (kode, nomor dokumen) tidak masuk filter.
 * 2. Tata letak: grid 4 kolom sama lebar (.mt-fgrid); Program memakai 2 kolom (.ps27-f-wide);
 *    tablet 2 kolom, ponsel 1 kolom. Label di atas, tinggi kontrol seragam.
 * 3. Kolom Cari tidak berada di panel Filter: diletakkan di kanan baris tab tampilan
 *    (MT_TABSEARCH) dan hanya mencari teks pada tabel tab tersebut. Tab tanpa tabel
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
 '#app .flt .fbar.mt-g6>.fg{grid-column:span var(--sp,1)!important;width:auto!important;min-width:0!important;max-width:none!important;flex:none!important}'+
 '#app .flt .fbar.mt-g6>.fg .sel,#app .flt .fbar.mt-g6>.fg select,#app .flt .fbar.mt-g6>.fg input{width:100%!important;min-width:0!important;max-width:none!important}'+
 '#app .flt .fbar.mt-g6 .pseg{display:flex!important;width:100%!important}#app .flt .fbar.mt-g6 .pseg button{flex:1 1 0!important;min-width:0!important;padding-inline:4px!important}'+
 '#app .mt-subt-row{display:flex!important;flex-direction:row!important;align-items:center!important;flex-wrap:nowrap!important;gap:10px}#app .mt-subt-row>.subt{flex:0 1 auto;min-width:0}#app .mt-subt-row>.mt-tabsearch{flex:0 1 280px;min-width:170px}'+
 '@media(max-width:1000px){#app .mt-subt-row{flex-wrap:wrap!important}#app .mt-subt-row>.mt-tabsearch{flex:1 1 100%!important}}#app .tsearch.mt-moved{display:none!important}'+
 '@media(max-width:1000px){#app .flt .fbar.mt-g6{grid-template-columns:repeat(2,minmax(0,1fr))!important}#app .flt .fbar.mt-g6>.fg{grid-column:span 1!important}#app .flt .fbar.mt-g6>.fg.w2{grid-column:span 2!important}}'+
 '@media(max-width:600px){#app .flt .fbar.mt-g6 .pseg button{font-size:10.5px!important;padding-inline:2px!important}#app .flt .fbar.mt-g6{grid-template-columns:minmax(0,1fr)!important}#app .flt .fbar.mt-g6>.fg,#app .flt .fbar.mt-g6>.fg.w2{grid-column:span 1!important}}'+
 '@media(max-width:600px){#app .ps27 .mt-std-filter .ps27-filter-fields.mt-fgrid{grid-template-columns:minmax(0,1fr)!important}#app .ps27 .mt-std-filter .mt-fgrid>label.ps27-f-wide{grid-column:span 1!important}#app .mt-tabsearch{flex:1 1 100%;margin:6px 0}}';
 document.head.appendChild(s);
}
})();
