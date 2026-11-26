/* Standar Filter & Cari — Modul Transformasi.
 * Aturan (berlaku untuk semua area; Project Selection menjadi acuan pertama):
 * 1. Panel Filter hanya memuat kolom KATEGORI yang tampil di tabel/tampilan aktif
 *    (Tahun, Program, UIC, Status, Kategori, Asal, Kelengkapan, Tahapan, PIC, dst.).
 *    Pilihan diambil dari data yang ada, bukan daftar tetap. Kolom teks bebas (nama,
 *    deskripsi, narasi, catatan) dan kolom hampir-unik (kode, nomor dokumen) tidak masuk filter.
 * 2. Tata letak: grid 4 kolom sama lebar (.mt-fgrid); Program memakai 2 kolom (.ps27-f-wide);
 *    tablet 2 kolom, ponsel 1 kolom. Label di atas, tinggi kontrol seragam.
 * 3. Kolom Cari tidak berada di panel Filter: diletakkan di kanan baris tab tampilan
 *    (MT_TABSEARCH), kecuali WBS dan Change Request yang menempatkan Cari di toolbar daftar tabel, dan hanya mencari teks pada tabel tab tersebut. Tab tanpa tabel
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
/* Placeholder tak terlihat selebar kolom Cari: dipakai pada subtab tanpa pencarian agar posisi & lebar tab tetap statis. */
window.MT_TABSEARCH_PH=function(){return '<label class="mt-tabsearch mt-tabsearch-ph" aria-hidden="true" style="visibility:hidden;pointer-events:none"><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24"></svg><input type="search" tabindex="-1" disabled aria-hidden="true"></label>';};
if(typeof document==='undefined'||typeof document.addEventListener!=='function')return;
/* Tabel bersama (tbl() di index.html): bila satu baris subtab (.subt) hanya membawahi SATU tabel,
   kolom Cari tabel itu dipindah ke kanan baris subtab. Handler input tetap memakai [data-q]. */
var ICON='<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
/* 261125-MT-08 — Capaian TW: presentation only; calculations and exports stay native. */
var mtTwQueries={};
function mtCapaianTwLayout(view){
 if(!view||!view.querySelector('#lap-tprog')||!view.querySelector('#lap-ue'))return;
 if(view.querySelector('.mt-tw-report-tools'))return;
 var prog=view.querySelector('#lap-tprog'),ue=view.querySelector('#lap-ue'),kw=view.querySelector('#tw-kw');
 var band=view.querySelector('.mt-pmo-subtab-band');
 if(band){
  var promoted=band.querySelector('.mt-tabsearch input[data-q="kw"]');
  if(promoted&&kw){var orig=kw.querySelector('.tsearch');if(orig){orig.appendChild(promoted);orig.classList.remove('mt-moved')}}
  band.querySelectorAll('.mt-tabsearch-tbl').forEach(function(x){if(!x.querySelector('input'))x.remove()});
  band.classList.remove('mt-subt-row');band.classList.add('mt-subt-full');
 }
 var tools=document.createElement('div');tools.className='mt-tw-report-tools';
 var ctx=document.createElement('div');ctx.className='mt-tw-context';
 var yr=typeof S!=='undefined'?S.ui.tahun:'';
 var selected=typeof S!=='undefined'?Math.max(1,Math.min(4,+S.ui.ltw||3)):3;
 ctx.innerHTML='<span class="mt-tw-year">Tahun '+String(+yr||'—')+'</span><label>Posisi laporan <select aria-label="Posisi laporan tahunan" data-on="ltw">'+[1,2,3,4].map(function(q){return '<option value="'+q+'"'+(q===selected?' selected':'')+'>TW '+q+'</option>'}).join('')+'</select></label>';
 tools.appendChild(ctx);
 var a=document.createElement('div');a.className='mt-tw-actions';
 var headerActs=view.querySelector('.vh .acts');
 if(headerActs){while(headerActs.firstChild)a.appendChild(headerActs.firstChild);headerActs.remove()}
 var chips=document.createElement('div');chips.className='mt-tw-chips';chips.setAttribute('role','tablist');chips.setAttribute('aria-label','Jenis capaian TW');
 tools.prepend(chips);
 var sharedSearch=document.createElement('label');sharedSearch.className='mt-tabsearch mt-tw-shared-search';sharedSearch.innerHTML=ICON;
 // Keep search in the same subtab slot as the other Pemantauan pages.
 if(band){band.classList.remove('mt-subt-full');band.classList.add('mt-subt-row');band.appendChild(sharedSearch)}
 else tools.appendChild(sharedSearch);
 // Reuse the original export button and links: no changes to the reporting engine.
 var exportBtn=a.querySelector('[data-act="lapexp"]');
 if(exportBtn){
  exportBtn.className='btn mt-tw-export-icon';exportBtn.title='Ekspor laporan TW ke Excel';exportBtn.setAttribute('aria-label',exportBtn.title);
  exportBtn.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h8l5 5v13H6zM14 3v5h5M9 12h7M9 16h7M12 12v7"/></svg>';
 }
 var links=Array.from(a.querySelectorAll('a'));
 if(links.length){
  var more=document.createElement('details');more.className='wbs-more mt-tw-more';
  more.innerHTML='<summary class="btn wbs-kebab" title="Aksi laporan lainnya" aria-label="Aksi laporan lainnya"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg></summary><div class="wbs-more-pop"></div>';
  links.forEach(function(link){link.className='wbs-more-item';more.querySelector('.wbs-more-pop').appendChild(link);link.addEventListener('click',function(){more.open=false})});
  a.appendChild(more);
 }
 tools.appendChild(a);prog.before(tools);
 var panels=[{key:'program',name:'T-Program',card:prog},{key:'unit',name:'Per UE I',card:ue},{key:'kwide',name:'IKU K-Wide',card:kw}].filter(function(p){return !!p.card});
 var activeKey=(typeof S!=='undefined'&&S.ui.mtTwPanel)||'program';
 if(!panels.some(function(p){return p.key===activeKey}))activeKey='program';
 var searchInputs={};
 function fmtNumber(txt){
  var v=String(txt||'').trim();if(!v.includes('%'))return null;
  var n=Number(v.replace(/\s/g,'').replace('%','').replace(/\./g,'').replace(',','.'));
  return Number.isFinite(n)?n:null;
 }
 function section(card,id){
  var table=card.querySelector('table.lap'),head=card.querySelector('.ch');if(!table||!head)return;
  card.classList.add('mt-tw-table-card');
  table.classList.add('mt-tw-table');
  var headers=table.querySelectorAll('thead th');
  for(var i=1;i<=4;i++){if(!headers[i])continue;headers[i].innerHTML='TW '+i+'<small>Kumulatif</small>';if(i===selected)headers[i].classList.add('mt-tw-selected')}
  if(headers[5])headers[5].innerHTML='Target<small>Tahunan</small>';
  if(headers[6])headers[6].innerHTML='Capaian tahunan<small>s.d. TW '+selected+'</small>';
  if(headers[6])headers[6].classList.add('mt-tw-annual');
  var rows=Array.from(table.querySelectorAll('tbody tr'));
  var total=rows.find(function(r){return r.cells[0]?.textContent.trim()==='Total'});
  if(total){total.classList.add('mt-tw-total');total.parentNode.prepend(total)}
  rows.forEach(function(r){
   for(var j=1;j<=4;j++){
    var cell=r.cells[j];if(!cell)continue;
    var b=cell.querySelector('b'),v=fmtNumber(b?.textContent);
    if(b){b.classList.add('mt-tw-value');b.dataset.tone=v===null?'na':v>=100?'met':'below'}
    if(j===selected)cell.classList.add('mt-tw-selected');
   }
   var ac=r.cells[6];if(ac){
    ac.classList.add('mt-tw-annual');var v=fmtNumber(ac.querySelector('b')?.textContent);
    if(v!==null){
     var track=document.createElement('span');track.className='mt-tw-progress';track.setAttribute('aria-hidden','true');
     var fill=document.createElement('i');fill.style.width=Math.max(0,Math.min(100,v))+'%';fill.className=v>=100?'met':'';
     track.appendChild(fill);ac.appendChild(track);
    }
   }
  });
  var search=document.createElement('label');search.className='mt-tabsearch mt-tw-search';search.innerHTML=ICON;
  var input=document.createElement('input');input.type='search';input.placeholder=id==='program'?'Cari T-Program…':'Cari UE I…';input.setAttribute('aria-label',input.placeholder);input.value=mtTwQueries[id]||'';search.appendChild(input);
  var count=document.createElement('span');count.className='mt-tw-count';count.setAttribute('aria-live','polite');
  var right=document.createElement('div');right.className='mt-tw-section-tools';right.append(count);head.appendChild(right);searchInputs[id]=input;
  function filter(){var q=input.value.trim().toLocaleLowerCase('id'),n=0,all=0;mtTwQueries[id]=input.value;rows.forEach(function(r){if(r===total)return;all++;var match=String(r.cells[0]?.textContent||'').toLocaleLowerCase('id').includes(q);r.hidden=!match;if(match)n++});count.textContent=n+' / '+all}
  input.addEventListener('input',filter);filter();
  var note=card.querySelector(':scope > p.s');if(note){note.classList.add('mt-tw-note');note.hidden=false}
 }
 section(prog,'program');section(ue,'unit');
 if(kw){
  kw.classList.add('mt-tw-table-card','mt-tw-kwide');
  var t=kw.querySelector('.tbar'),orig=kw.querySelector('.tsearch');
  if(t&&orig){var inp=orig.querySelector('input[data-q]');if(inp){searchInputs.kwide=inp;inp.placeholder='Cari IKU K-Wide…';inp.setAttribute('aria-label',inp.placeholder);orig.classList.add('mt-moved')}}
 }
 function activate(key,focus){
  if(!panels.some(function(p){return p.key===key}))return;
  activeKey=key;
  if(typeof S!=='undefined')S.ui.mtTwPanel=key;
  // Move the original input into one stable search slot; preserve each panel's own query and handlers.
  var previous=sharedSearch.querySelector('input');
  if(previous)previous.remove();
  var input=searchInputs[key];
  if(input)sharedSearch.appendChild(input);
  sharedSearch.hidden=!input;
  panels.forEach(function(p){
   var on=p.key===key;p.card.hidden=!on;
   p.button.classList.toggle('on',on);p.button.setAttribute('aria-selected',String(on));p.button.tabIndex=on?0:-1;
  });
  if(focus){var p=panels.find(function(p){return p.key===key});p.button.focus({preventScroll:true})}
 }
 panels.forEach(function(p,i){
  var b=document.createElement('button');b.type='button';b.className='mt-tw-chip';b.textContent=p.name;
  b.id='mt-tw-chip-'+p.key;b.setAttribute('role','tab');b.setAttribute('aria-controls',p.card.id);
  p.card.setAttribute('role','tabpanel');p.card.setAttribute('aria-labelledby',b.id);p.card.classList.add('mt-tw-panel');
  p.button=b;chips.appendChild(b);
  b.addEventListener('click',function(){activate(p.key,false)});
  b.addEventListener('keydown',function(e){
   var idx=e.key==='ArrowRight'?(i+1)%panels.length:e.key==='ArrowLeft'?(i+panels.length-1)%panels.length:e.key==='Home'?0:e.key==='End'?panels.length-1:-1;
   if(idx>=0){e.preventDefault();activate(panels[idx].key,true)}
  });
 });
 activate(activeKey,false);

}
/* 261125-MT-11 — Risk/issue monitoring workspace. No automatic residual assumptions. */
function mtRiskLevel(k,d){return Number.isInteger(+k)&&+k>=1&&+k<=5&&Number.isInteger(+d)&&+d>=1&&+d<=5?+k*+d:null}
function mtRiskHistory(r){var a=r.jenis==='Isu'?r.mtIssueReviews:r.mtRiskReviews;return Array.isArray(a)?a:[]}
function mtRiskLast(r){var a=mtRiskHistory(r);return a.length?a[a.length-1]:null}
function mtRiskInitial(r){var b=r.mtRiskInitial;return b&&mtRiskLevel(b.k,b.d)!==null?b:{k:r.kem,d:r.dmp}}
function mtRiskResidual(r){var x=mtRiskLast(r);return x&&mtRiskLevel(x.k,x.d)!==null?x:null}
function mtRiskStage(r,today){
 var x=mtRiskLast(r),st=x&&x.status;
 if(r.st==='Ditutup')return 'closed';
 if(r.st==='Menjadi isu')return 'converted';
 if(st==='Terkendali')return 'controlled';
 if(r.tenggat&&r.tenggat<today)return 'late';
 if(st==='Belum dimulai')return 'notstarted';
 if(st==='Dalam proses')return 'progress';
 return 'unknown';
}
function mtRiskReview(r,readOnly){
 var issue=r.jenis==='Isu',last=mtRiskLast(r)||{},base=mtRiskInitial(r),history=mtRiskHistory(r);
 var can=!readOnly&&canW('risk','U',r.pemilik);
 var options=function(val,arr){return arr.map(function(v){return '<option value="'+esc(v)+'"'+(String(v)===String(val)?' selected':'')+'>'+esc(v||'— Pilih —')+'</option>'}).join('')};
 var hist=history.slice().reverse().map(function(x){return '<tr><td>'+esc(String(x.at||'').slice(0,10))+'<small>'+esc(x.by||'')+'</small></td><td>'+esc(x.status||'—')+'</td><td>'+esc(x.progress==null?'—':x.progress+'%')+'</td>'+(!issue?'<td>'+esc(mtRiskLevel(x.k,x.d)??'—')+'</td>':'')+'<td>'+esc(x.note||'—')+'</td></tr>'}).join('');
 var body='<p class="s"><b>'+esc(r.rid||'')+' · '+esc(r.uraian||'')+'</b></p>'+
 (!issue?'<p class="s">Acuan sebelum mitigasi: '+esc(base.k||'—')+' × '+esc(base.d||'—')+' = '+esc(mtRiskLevel(base.k,base.d)??'—')+'. Nilai ini memakai skor register sebagai acuan sampai tersedia histori.</p>':'')+
 (can?'<div class="fgrid"><label class="fld">Status penanganan<select id="mt-rv-status" class="sel">'+options(last.status||'',['','Belum dimulai','Dalam proses','Terkendali'])+'</select></label><label class="fld">Progres (%)<input id="mt-rv-progress" class="inp" type="number" min="0" max="100" step="1" value="'+esc(last.progress??'')+'" placeholder="0–100"></label>'+
 (!issue?'<label class="fld">Kemungkinan residual<select id="mt-rv-k" class="sel">'+options('',['',1,2,3,4,5])+'</select></label><label class="fld">Dampak residual<select id="mt-rv-d" class="sel">'+options('',['',1,2,3,4,5])+'</select></label>':'')+
 '<label class="fld wide">Realisasi mitigasi / penanganan dan tindak lanjut<textarea id="mt-rv-note" class="inp" rows="3" placeholder="Catat tindakan, hasil evaluasi dan tindak lanjut"></textarea></label></div>':'')+
 '<h4 style="margin:10px 0 6px">Riwayat pemantauan</h4><div class="tscroll" style="max-height:35vh"><table class="lap"><thead><tr><th>Tanggal / pencatat</th><th>Status</th><th>Progres</th>'+(!issue?'<th>Residual</th>':'')+'<th>Catatan</th></tr></thead><tbody>'+(hist||'<tr><td colspan="'+(issue?4:5)+'">Belum ada pemantauan yang tercatat.</td></tr>')+'</tbody></table></div>';
 modal('Pemantauan '+(issue?'Isu':'Risiko'),body,can?'Simpan pemantauan':'',can?function(ov){
  var live=(S.risks||[]).find(function(x){return x.id===r.id});
  if(!live||live.jenis!==r.jenis||!canW('risk','U',live.pemilik)){toast('Data atau hak akses berubah.');return false}
  var status=ov.querySelector('#mt-rv-status').value,pr=ov.querySelector('#mt-rv-progress').value,note=ov.querySelector('#mt-rv-note').value.trim();
  var k=issue?'':ov.querySelector('#mt-rv-k').value,d=issue?'':ov.querySelector('#mt-rv-d').value;
  if(!status||!note){toast('Isi status dan catatan pemantauan.');return false}
  if(pr!==''&&(!Number.isFinite(+pr)||+pr<0||+pr>100)){toast('Progres harus 0–100%.');return false}
  if(!issue&&((!!k)!=(!!d)||k&&mtRiskLevel(k,d)===null)){toast('Isi kedua nilai residual atau kosongkan keduanya.');return false}
  if(!issue&&!live.mtRiskInitial&&mtRiskLevel(live.kem,live.dmp)!==null)live.mtRiskInitial={k:+live.kem,d:+live.dmp};
  var key=issue?'mtIssueReviews':'mtRiskReviews';
  var entry={at:new Date().toISOString(),by:ME?.nama||ME?.email||'',status:status,progress:pr===''?null:+pr,note:note,k:k?+k:null,d:d?+d:null};
  live[key]=mtRiskHistory(live).concat([entry]);
  log('Pemantauan '+(issue?'isu':'risiko'),live.rid+' · '+status);save();render();toast('Pemantauan tersimpan.');
 }:null,{size:'wide'});
}
function mtRiskWorkspace(view){
 var table=view.querySelector('#tw-risk'),o=typeof T!=='undefined'?T.risk:null;
 if(!table||!o||view.querySelector('.mt-risk-toolbar'))return;
 var stk=table.closest('.stk'),oldMap=stk&&Array.from(stk.querySelectorAll('.card')).find(function(x){return x!==table&&x.querySelector('.rm')});
 if(!stk||!oldMap)return;
 var ui=S.ui,issue=ui.mtRiskKind==='issue',compare=ui.mtRiskMode==='compare',expanded=ui.mtRiskShow!==false,score=ui.mtRiskScore===true;
 var filter=ui.mtRiskFilter||'';
 if(ui.rf){if(!filter)filter='initial:'+ui.rf;ui.rf='';ui.mtRiskFilter=filter}
 var base=pmoRiskList().filter(function(r){return (!ui.rstatus||r.st===ui.rstatus)&&(!ui.rrisk||skL(skor(r))===ui.rrisk)});
 var visible=base.filter(function(r){return issue?r.jenis==='Isu':r.jenis!=='Isu'});
 var active=visible.filter(function(r){return r.st!=='Ditutup'&&r.st!=='Menjadi isu'});
 var valid=active.filter(function(r){var b=mtRiskInitial(r);return mtRiskLevel(b.k,b.d)!==null});
 var paired=valid.filter(function(r){return !!mtRiskResidual(r)});
 var now=typeof TODAY!=='undefined'?TODAY:new Date().toISOString().slice(0,10);
 var byLevel=function(r,l){var b=mtRiskInitial(r),v=mtRiskLevel(b.k,b.d);return v!==null&&skL(v)===l};
 var stage=function(r){return mtRiskStage(r,now)};
 var movement=function(r){var x=mtRiskResidual(r),b=mtRiskInitial(r),v=mtRiskLevel(b.k,b.d);if(!x||v===null)return 'unrated';var d=mtRiskLevel(x.k,x.d)-v;return d<0?'down':d>0?'up':'same'};
 function match(r){
  if(!filter)return true;var parts=filter.split(':'),k=parts[0],v=parts[1],b=mtRiskInitial(r),x=mtRiskResidual(r);
  if(k==='initial'||k==='before'||k==='after'){
   if(!active.includes(r))return false;
   if(k!=='initial'&&!paired.includes(r))return false;
   var p=k==='after'?x:b;return !!p&&String(p.k)+'-'+String(p.d)===v;
  }
  if(k==='level')return active.includes(r)&&byLevel(r,v);
  if(k==='stage')return v==='active'?active.includes(r):visible.includes(r)&&stage(r)===v;
  if(k==='movement')return active.includes(r)&&movement(r)===v;
  return true;
 }
 function setFilter(v){ui.mtRiskFilter=filter===v?'':v;PG.risk=0;save();render()}
 function pref(key,value){ui[key]=value;save();render()}
 // Keep native table / import / export / access checks. Only the view and row metadata change.
 o.rows=function(){return riskGroups(visible.filter(match))};
 o.title=issue?'Register Isu':'Register Risiko';o.addLabel=issue?'Isu':'Risiko';o.addTitle='Tambah '+(issue?'Isu':'Risiko');
 var kindCol=o.cols.find(function(c){return c.k==='jenis'});if(kindCol){kindCol.def=issue?'Isu':'Risiko';kindCol.tbl=false}
 // Compact register: preserve full raw fields for edits, search, filters and Excel.
 var programCol=o.cols.find(function(c){return c.k==='prog'}),sourceCol=o.cols.find(function(c){return c.k==='sumber'}),descCol=o.cols.find(function(c){return c.k==='uraian'});
 if(programCol&&sourceCol){
  programCol.tbl=false;
  sourceCol.x=function(r){return r.sumber||''};
  // Keep the original export heading/field independent of the compact on-screen column.
  sourceCol.l='Sumber';
  sourceCol.r=function(r){
   var m=r.item&&modOf(r.item),p=(S.programs||[]).find(function(x){return x.kode===r.prog||x.akr===r.prog||m&&x.akr===m.prog});
   var label=p?.akr||r.prog||'';
   return '<div class="mt-risk-origin">'+(label?'<span class="mt-risk-origin-program" title="'+esc(p?.nama||label)+'">'+esc(label)+'</span>':'')+'<span class="chip '+(r.sumber==='ADP'?'c-gold':'c-gray')+'">'+esc(r.sumber||'—')+'</span></div>';
  };
 }
 if(descCol){descCol.r=function(r){
  var full=String(r.uraian||''),display=full;
  // Remove only duplicate category prefixes in the visual description, never from stored data.
  var m=full.match(/^([^–—]+?)\s+[–—]\s+(.+)$/s);
  if(m){var prefix=m[1].trim().toLowerCase(),cat=String(r.kat||'').trim().toLowerCase();
   if(prefix===cat||prefix==='resistensi'&&cat==='resistensi perubahan')display=m[2];
  }
  return '<span class="mt-risk-description" title="'+esc(full)+'">'+esc(display)+'</span>'+(r.keCmo?'<span class="sm"><span class="chip c-teal" title="Tampil di CMO › ADP › Register Risiko">→ CMO · '+esc(RISK.find(function(x){return x[0]===r.jcm})?.[1]||'Lainnya')+'</span></span>':'');
 }}
 var oldRowAct=o.rowAct;
 o.rowAct=function(r){return '<button type="button" data-mt-risk-review="'+esc(r.id)+'" title="Riwayat dan pemantauan '+(issue?'isu':'risiko')+'" aria-label="Riwayat dan pemantauan"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5m4-1v5l3 2"/></svg></button>'+(oldRowAct?oldRowAct(r).replace('data-act="toisu"','class="mt-risk-convert mt-action-icon" data-mt-tone="teal" data-act="toisu"').replace('>↑</button>',' aria-label="Naikkan menjadi isu"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19L19 5M9 5h10v10"/></svg></button>'):'')};
 var sc=o.cols.find(function(c){return c.k==='_s'});
 if(sc){sc.l=issue?'Skor register':'Skor awal/acuan';if(!issue){sc.r=function(r){var b=mtRiskInitial(r),v=mtRiskLevel(b.k,b.d);return v===null?'—':'<span class="chip '+(v>=15?'c-bad':v>=8?'c-warn':'c-ok')+'">'+v+' · '+skL(v)+'</span>'};sc.x=function(r){var b=mtRiskInitial(r);return mtRiskLevel(b.k,b.d)}}}
 var extra=[{k:'mtReviewProgress',l:'Progres',frm:false,num:1,r:function(r){var x=mtRiskLast(r);return x&&x.progress!=null?esc(x.progress)+'%':'—'},x:function(r){return mtRiskLast(r)?.progress??''}},{k:'mtReviewStatus',l:'Pemantauan',frm:false,r:function(r){var x=mtRiskLast(r);return x?esc(x.status)+'<span class="sm">'+esc(String(x.at||'').slice(0,10))+'</span>':'<span class="s">Belum dicatat</span>'},x:function(r){return mtRiskLast(r)?.status||''}}];
 if(!issue)extra.unshift({k:'mtResidual',l:'Residual',frm:false,r:function(r){var x=mtRiskResidual(r);if(!x)return '<span class="s">Belum dinilai</span>';var v=mtRiskLevel(x.k,x.d);return '<span class="chip '+(v>=15?'c-bad':v>=8?'c-warn':'c-ok')+'">'+v+' · '+skL(v)+'</span>'},x:function(r){var x=mtRiskResidual(r);return x?mtRiskLevel(x.k,x.d):''}});
 // Present progress alongside the latest review, but retain its own export column.
 var progressCol=extra.find(function(c){return c.k==='mtReviewProgress'}),reviewCol=extra.find(function(c){return c.k==='mtReviewStatus'});
 if(progressCol&&reviewCol){
  progressCol.tbl=false;
  reviewCol.r=function(r){var x=mtRiskLast(r);return x?'<span class="mt-risk-review-status">'+esc(x.status||'—')+'</span><span class="sm">'+(x.progress!=null?esc(x.progress)+'% · ':'')+esc(String(x.at||'').slice(0,10))+'</span>':'<span class="s">Belum dicatat</span>'};
 }
 o.cols.push.apply(o.cols,extra);
 table.classList.toggle('mt-risk-issue-table',issue);
 var head=table.querySelector('.tbar'),title=head&&head.querySelector('h3'),add=head&&head.querySelector('[data-act="add"][data-t="risk"]'),excel=head&&head.querySelector('[data-act="tdata"]');
 if(title)title.textContent=o.title;if(add)add.textContent='+ '+o.addLabel;
 var toolbar=document.createElement('div');toolbar.className='mt-risk-toolbar';
 toolbar.innerHTML='<div class="mt-risk-chips" role="group" aria-label="Jenis register"><button type="button" data-mtr-kind="risk" aria-pressed="'+!issue+'">Register Risiko</button><button type="button" data-mtr-kind="issue" aria-pressed="'+issue+'">Register Isu</button></div><span class="mt-risk-spacer"></span><button type="button" class="btn mt-risk-toggle" data-mtr-toggle aria-expanded="'+expanded+'">'+(expanded?'Sembunyikan':'Tampilkan')+' ringkasan</button>';
 var actions=document.createElement('div');actions.className='mt-risk-actions';
 if(add)actions.appendChild(add);
 if(excel){excel.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 3h8l5 5v13H6zM14 3v5h5M9 12h7M9 16h7M12 12v7"/></svg>';excel.setAttribute('aria-label','Template, impor dan ekspor Excel');excel.classList.add('mt-risk-excel');actions.appendChild(excel)}
 toolbar.appendChild(actions);
 var band=view.querySelector('.mt-pmo-subtab-band');
 var search=table.querySelector('.tsearch input[data-q="risk"]');
 if(search&&band){var lab=document.createElement('label');lab.className='mt-tabsearch mt-tabsearch-tbl';lab.innerHTML=ICON;lab.appendChild(search);table.querySelector('.tsearch').classList.add('mt-moved');band.classList.remove('mt-subt-full');band.classList.add('mt-subt-row');band.appendChild(lab)}
 var summary=document.createElement('section');summary.className='card mt-risk-summary';summary.hidden=!expanded;
 function metric(label,value,tone,key,sub){return '<button type="button" class="mt-risk-metric '+tone+(filter===key?' on':'')+'" data-mtr-filter="'+esc(key)+'" aria-pressed="'+(filter===key)+'"><span>'+esc(label)+'</span><b>'+esc(value)+'</b>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</button>'}
 function matrix(label,records,kind){
  var html='<section class="mt-risk-matrix"><div class="mt-risk-matrix-title"><b>'+label+'</b><small>'+records.length+' risiko terpetakan</small></div><div class="mt-risk-map"><span class="mt-risk-axis-y">Kemungkinan</span><div class="mt-risk-grid">';
  for(var k=5;k>=1;k--){html+='<span class="mt-risk-axis">'+k+'</span>';for(var d=1;d<=5;d++){
   var n=records.filter(function(r){var p=kind==='after'?mtRiskResidual(r):mtRiskInitial(r);return p&&+p.k===k&&+p.d===d}).length;
   var key=kind+':'+k+'-'+d,level=k*d>=15?'high':k*d>=8?'med':'low',unknown=(kind==='after'||kind==='before')&&!records.length;
   html+='<button type="button" class="mt-risk-cell '+level+(n?'':' zero')+(filter===key?' on':'')+'" data-mtr-filter="'+key+'" aria-pressed="'+(filter===key)+'" title="Kemungkinan '+k+' × dampak '+d+' = '+k*d+'; '+(unknown?'belum ada pasangan penilaian':n+' risiko')+'"><b>'+(unknown?'—':n)+'</b><small'+(score?'':' hidden')+'>Skor '+k*d+'</small></button>';
  }}
  html+='<span></span>'+[1,2,3,4,5].map(function(d){return '<span class="mt-risk-axis">'+d+'</span>'}).join('')+'</div></div><div class="mt-risk-axis-x">Dampak</div></section>';return html;
 }
 var stageLabels=[['Belum dimulai','notstarted','neutral'],['Dalam mitigasi','progress','blue'],['Lewat tenggat','late','high'],['Terkendali','controlled','low'],['Belum tercatat','unknown','neutral']];
 if(issue){
  summary.innerHTML='<div class="mt-risk-summary-head"><b>Ringkasan Isu</b><small>'+visible.length+' isu dalam cakupan filter</small></div><div class="mt-risk-metrics mt-risk-issue-metrics">'+metric('Isu aktif',active.length,'blue','stage:active',null)+metric('Ditutup',visible.filter(function(r){return stage(r)==='closed'}).length,'low','stage:closed')+metric('Lewat tenggat',active.filter(function(r){return stage(r)==='late'}).length,'high','stage:late')+metric('Dalam penanganan',active.filter(function(r){return stage(r)==='progress'}).length,'blue','stage:progress')+metric('Belum tercatat',active.filter(function(r){return stage(r)==='unknown'}).length,'neutral','stage:unknown')+'</div>';
 }else{
  var high=valid.filter(function(r){return byLevel(r,'Tinggi')}).length,med=valid.filter(function(r){return byLevel(r,'Sedang')}).length,low=valid.filter(function(r){return byLevel(r,'Rendah')}).length;
  var pctH=valid.length?(high/valid.length*100).toLocaleString('id-ID',{maximumFractionDigits:1}):'0';
  var h='<div class="mt-risk-summary-head"><div class="mt-risk-mode" role="group" aria-label="Mode matriks"><button type="button" data-mtr-mode="summary" aria-pressed="'+!compare+'">Ringkasan</button><button type="button" data-mtr-mode="compare" aria-pressed="'+compare+'">Perbandingan Mitigasi</button></div><label class="mt-risk-score"><input type="checkbox" data-mtr-score '+(score?'checked':'')+'> Tampilkan skor</label></div>';
  if(compare){
   h+='<div class="mt-risk-compare">'+matrix('Sebelum mitigasi · acuan',paired,'before')+matrix('Setelah mitigasi · residual',paired,'after')+'<div class="mt-risk-comparison-stats"><b>Efektivitas mitigasi</b><small>'+paired.length+' dari '+active.length+' risiko aktif memiliki pasangan penilaian.</small><div class="mt-risk-metrics">'+metric('Skor menurun',paired.filter(function(r){return movement(r)==='down'}).length,'low','movement:down')+metric('Skor tetap',paired.filter(function(r){return movement(r)==='same'}).length,'neutral','movement:same')+metric('Skor meningkat',paired.filter(function(r){return movement(r)==='up'}).length,'high','movement:up')+metric('Belum dinilai / belum lengkap',active.length-paired.length,'neutral','movement:unrated')+'</div><small>Kedua matriks memakai kelompok risiko yang sama. Risiko yang belum lengkap tidak dihitung sebagai nol.</small></div></div>';
  }else{
   h+='<div class="mt-risk-split">'+matrix('Peta Risiko · skor awal/acuan',valid,'initial')+'<div class="mt-risk-profile"><div class="mt-risk-profile-title"><b>Profil Risiko</b><small>'+active.length+' aktif · '+(active.length-valid.length)+' belum lengkap</small></div><div class="mt-risk-metrics mt-risk-profile-metrics">'+metric('Tinggi',high,'high','level:Tinggi',valid.length?(high/valid.length*100).toFixed(1).replace('.',',')+'%':'—')+metric('Sedang',med,'med','level:Sedang',valid.length?(med/valid.length*100).toFixed(1).replace('.',',')+'%':'—')+metric('Rendah',low,'low','level:Rendah',valid.length?(low/valid.length*100).toFixed(1).replace('.',',')+'%':'—')+'</div><div class="mt-risk-distribution" aria-label="Distribusi level risiko">'+[['high',high],['med',med],['low',low]].map(function(x){return '<i class="'+x[0]+'" style="width:'+(valid.length?x[1]/valid.length*100:0)+'%"></i>'}).join('')+'</div><b class="mt-risk-subtitle">Status mitigasi</b><div class="mt-risk-metrics mt-risk-stage-metrics">'+stageLabels.map(function(x){return metric(x[0],active.filter(function(r){return stage(r)===x[1]}).length,x[2],'stage:'+x[1])}).join('')+'</div><p class="mt-risk-insight">'+(valid.length?'<b>'+pctH+'% ('+high+'/'+valid.length+')</b> risiko terpetakan berkategori tinggi. '+(high?'Prioritaskan evaluasi mitigasinya.':'Pantau risiko secara berkala.'):'Belum ada skor risiko yang lengkap.')+' '+(active.length-paired.length)+' risiko aktif belum memiliki penilaian residual yang dapat dibandingkan.</p></div></div>';
  }
  summary.innerHTML=h+'<div class="mt-risk-legend"><span><i class="low"></i> Rendah 1–7</span><span><i class="med"></i> Sedang 8–14</span><span><i class="high"></i> Tinggi 15–25</span><small>Angka besar = jumlah risiko · klik kotak atau kartu untuk memfilter.</small></div>';
 }
 // Use a compact single-column stack; keep the original table node and its data-imp input.
 oldMap.remove();stk.classList.add('mt-risk-workspace');
 // Unwrap the legacy half-width grid: register must span the same full width as the matrix.
 var registerWrap=table.parentElement;
 if(registerWrap!==stk&&registerWrap.parentElement===stk&&registerWrap.children.length===1){
  stk.insertBefore(table,registerWrap);registerWrap.remove();
 }else if(registerWrap!==stk){registerWrap.classList.add('mt-risk-register-wrap')}
 stk.prepend(toolbar,summary);
 var reset=document.createElement('button');reset.type='button';reset.className='btn sm mt-risk-reset';reset.textContent='Hapus filter ringkasan';reset.hidden=!filter;reset.addEventListener('click',function(){setFilter(filter)});
 if(head){head.querySelectorAll('[data-act="rfil"]').forEach(function(x){x.remove()});head.appendChild(reset)}
 redrawT('risk');
 // Normalize the actual DOM order too, so keyboard focus follows the visible actions.
 function compactRiskTable(){
  table.querySelectorAll('.ract').forEach(function(group){var convert=group.querySelector('[data-act="toisu"]');if(convert&&group.lastElementChild!==convert)group.appendChild(convert)});
  var h=table.querySelector('.tcard thead th:nth-child(3)');
  if(h&&h.textContent.trim()==='Sumber')h.textContent='Program / Sumber';
 }
 compactRiskTable();
 var riskBody=table.querySelector('#tb-risk');
 if(riskBody){var riskTableObserver=new MutationObserver(compactRiskTable);riskTableObserver.observe(riskBody,{childList:true,subtree:true})}
 toolbar.addEventListener('click',function(e){var b=e.target.closest('[data-mtr-kind],[data-mtr-toggle]');if(!b)return;e.preventDefault();e.stopPropagation();if(b.hasAttribute('data-mtr-kind')){ui.mtRiskKind=b.dataset.mtrKind;ui.mtRiskFilter='';PG.risk=0;save();render()}else pref('mtRiskShow',!expanded)});
 summary.addEventListener('click',function(e){var b=e.target.closest('[data-mtr-mode],[data-mtr-filter]');if(!b)return;e.preventDefault();e.stopPropagation();if(b.hasAttribute('data-mtr-mode')){ui.mtRiskFilter='';PG.risk=0;pref('mtRiskMode',b.dataset.mtrMode)}else setFilter(b.dataset.mtrFilter)});
 summary.addEventListener('change',function(e){if(e.target.matches('[data-mtr-score]'))pref('mtRiskScore',e.target.checked)});
 table.addEventListener('click',function(e){var b=e.target.closest('[data-mt-risk-review]');if(!b)return;e.preventDefault();e.stopPropagation();var r=visible.find(function(x){return x.id===b.dataset.mtRiskReview});if(r)mtRiskReview(r,!canW('risk','U',r.pemilik))});
}
/* 261125-MT-15 — Pascaproyek: closure queue and isolated example. */
var mtPPDemo=true;
var mtPPStage='';
function mtPPDate(v){return /^\d{4}-\d{2}-\d{2}$/.test(String(v||''))&&Number.isFinite(Date.parse(v))?v:''}
function mtPPThreeMonths(v){
 if(!mtPPDate(v))return '';
 var a=v.split('-').map(Number),y=a[0]+Math.floor((a[1]+2)/12),m=(a[1]+2)%12+1,d=Math.min(a[2],new Date(Date.UTC(y,m,0)).getUTCDate());
 return String(y).padStart(4,'0')+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
}
function mtPPData(){
 var pv=progVis().filter(function(p){return !S.ui.prog||p.akr===S.ui.prog}),keys=new Set(pv.map(function(p){return p.akr})),yr=+S.ui.tahun;
 var allEvals=(S.projectDecisions||[]).filter(function(r){return r.jenisCatatan==='EVAL-PASCAPROYEK'&&keys.has(r.program)});
 var evals=allEvals.filter(function(r){return !r.tglEval||+String(r.tglEval).slice(0,4)===yr});
 var queue=[];
 pv.forEach(function(p){Object.entries(p.closing||{}).forEach(function(z){
  var c=z[1];if(!c||c.st!=='Ditutup')return;
  var labels=projectLabels(z[0]),name=labels[2]||labels[1];if(!name)return;
  var h=(Array.isArray(c.hist)?c.hist:[]).filter(function(x){return x.st==='Ditutup'}).slice(-1)[0];
  var closed=mtPPDate(String(h?.at||'').slice(0,10)),due=mtPPThreeMonths(closed);
  var linked=allEvals.find(function(r){return r.program===p.akr&&(r.mtPPClosingKey===z[0]||String(r.proyek||'').trim().toLowerCase()===String(name).trim().toLowerCase())});
  if(due&&+due.slice(0,4)>yr&&!linked&&closed&&+closed.slice(0,4)>yr)return;
  var st=linked?(linked.st||'Direncanakan'):!due?'Tanggal belum tercatat':due>TODAY?'Masa observasi':'Siap dievaluasi';
  queue.push({p:p,key:z[0],name:name,parent:labels[2]?labels[1]:'',closed:closed,due:due,st:st,linked:linked});
 })});
 queue.sort(function(a,b){return (a.due||'9999').localeCompare(b.due||'9999')});
 return {evals:evals,queue:queue};
}
function mtPPWorkspace(view){
 if(!view||view.querySelector('.mt-pp-workspace')||!window.MTMF)return;
 var tab=MTMF.view(),nav=view.querySelector('.mf-nav')||view.querySelector('.mt-pmo-subtab-band');
 var anchor=tab==='eval'?view.querySelector('#tw-projectEval'):tab==='manfaat'?view.querySelector('#tw-ppManfaat'):view.querySelector('.g21');
 if(!anchor)return;
 var model=mtPPData(),evals=model.evals,queue=model.queue,o=tab==='eval'?T.projectEval:null;
 if(o){
  o.rows=function(){return evals.filter(function(r){return !mtPPStage||r.st===mtPPStage})};
  o.empty='Belum ada hasil evaluasi resmi sesuai filter. Gunakan antrean proyek atau + Hasil Evaluasi untuk memulai.';
  // Retain native actions and all form fields; show longer text on demand, with full text preserved.
  o.cols.forEach(function(c){if(['biaya','proses','layanan','hasil','rtl'].includes(c.k)){c.r=function(r){var v=String(r[c.k]||'');return v?'<span title="'+esc(v)+'">'+esc(v.length>75?v.slice(0,72)+'…':v)+'</span>':'—'}}});
  var oldValid=o.validate;
  o.validate=function(d,r){
   if(oldValid&&oldValid(d,r)===false)return false;
   var due=mtPPThreeMonths(d.tglTutup);
   if(due&&d.tglEval&&d.tglEval<due){toast('Tanggal evaluasi paling cepat '+fmtD(due)+' (3 bulan setelah penutupan).');return false}
   if(d.st==='Selesai'&&(!d.tglTutup||!d.tglEval)){toast('Lengkapi tanggal penutupan dan evaluasi sebelum menyatakan selesai.');return false}
  };
  var head=anchor.querySelector('.tbar');if(head){
   var acts=Array.from(head.querySelectorAll('button[data-act="add"],button[data-act="tdata"]'));
   var right=document.createElement('div');right.className='mt-pp-actions';acts.forEach(function(b){right.appendChild(b)});head.appendChild(right);
  }
  redrawT('projectEval');
 }
 if(tab==='manfaat'&&T.ppManfaat){
  var bo=T.ppManfaat,baseCol=bo.cols.find(function(c){return c.k==='base'}),targetCol=bo.cols.find(function(c){return c.k==='target'}),realCol=bo.cols.find(function(c){return c.k==='real'});
  if(baseCol){baseCol.tbl=true;baseCol.r=function(r){return r.base!==''&&r.base!=null?esc(r.base)+(r.unit?' '+esc(r.unit):''):'—'}}
  if(targetCol)targetCol.r=function(r){return r.target!==''&&r.target!=null?esc(r.target)+(r.unit?' '+esc(r.unit):''):'—'};
  if(realCol)realCol.r=function(r){if(r.real===''||r.real==null)return '—';var value='<b>'+esc(r.real)+(r.unit?' '+esc(r.unit):'')+'</b>';if(r.pct!=null){var v=Math.max(0,Math.min(100,r.pct));value+='<span class="sm">'+esc(r.pct)+'% dari target</span><span class="mt-pp-meter"><i style="width:'+v+'%;background:'+(r.pct>=100?'#087f72':r.pct>=80?'#527bb2':'#c28a37')+'"></i></span>'}return value};
  redrawT('ppManfaat');
 }
 var workspace=document.createElement('section');workspace.className='mt-pp-workspace';
 var metric=function(label,value,sub,tone,key){return '<button type="button" class="mt-pp-kpi '+tone+(key&&mtPPStage===key?' on':'')+'"'+(key?' data-pp-stage="'+esc(key)+'"':' disabled')+'><span>'+esc(label)+'</span><b>'+esc(value)+'</b><small>'+esc(sub)+'</small></button>'};
 var head='<div class="mt-pp-top"><div><b>'+(tab==='eval'?'Pemantauan evaluasi pascaproyek':tab==='manfaat'?'Realisasi manfaat proyek':'Hubungan adopsi dan manfaat')+'</b><small>'+(tab==='eval'?'Evaluasi paling cepat 3 bulan setelah penutupan proyek.':tab==='manfaat'?'Bandingkan baseline, target dan realisasi yang didukung bukti.':'Indeks adopsi CM dan manfaat adalah dua ukuran yang berbeda.')+'</small></div><label class="mt-pp-demo-toggle"><input type="checkbox" data-pp-demo '+(mtPPDemo?'checked':'')+'> Tampilkan contoh e-Perjadin</label></div>';
 if(tab==='eval'){
  var plan=evals.filter(function(r){return r.st==='Direncanakan'}).length,doing=evals.filter(function(r){return r.st==='Berjalan'}).length,done=evals.filter(function(r){return r.st==='Selesai'}).length;
  head+='<div class="mt-pp-kpis">'+metric('Proyek ditutup',queue.length,'Dalam cakupan program','navy')+metric('Siap dievaluasi',queue.filter(function(x){return x.st==='Siap dievaluasi'}).length,'Sudah melewati 3 bulan','teal')+metric('Direncanakan',plan,'Evaluasi terdaftar','neutral','Direncanakan')+metric('Berjalan',doing,'Evaluasi dalam proses','amber','Berjalan')+metric('Selesai',done,'Hasil evaluasi resmi','teal','Selesai')+'</div>';
  head+='<div class="mt-pp-card"><div class="mt-pp-cardhead"><b>Antrean evaluasi dari Penutupan Proyek</b><small>'+queue.length+' proyek · hanya status Ditutup</small></div><div class="tscroll"><table class="lap mt-pp-queue"><thead><tr><th>Program / Proyek</th><th>Tanggal ditutup</th><th>Evaluasi paling awal</th><th>Status</th><th>Aksi</th></tr></thead><tbody>'+
  (queue.length?queue.map(function(x,i){return '<tr><td><span class="code">'+esc(x.p.akr)+'</span> <b>'+esc(x.name)+'</b>'+(x.parent?'<small>'+esc(x.parent)+'</small>':'')+'</td><td>'+fmtD(x.closed)+'</td><td>'+fmtD(x.due)+'</td><td>'+chipSt(x.st)+'</td><td>'+(!x.linked&&o&&o.canAdd()&&tpCanEdit(x.p)?'<button type="button" class="btn sm" data-pp-prepare="'+i+'">Siapkan evaluasi</button>':x.linked?'<span class="s">Sudah terdaftar</span>':'—')+'</td></tr>'}).join(''):'<tr><td colspan="5" class="mt-pp-empty">Belum ada proyek berstatus Ditutup yang terbaca pada cakupan ini. Catat penutupan resmi terlebih dahulu agar antrean muncul otomatis.</td></tr>')+'</tbody></table></div></div>';
 }
 var demo='<div class="mt-pp-demo mt-pp-card" '+(mtPPDemo?'':'hidden')+'><div class="mt-pp-cardhead"><div><span class="mt-pp-badge">SIMULASI · BUKAN DATA RESMI</span><b>e-Perjadin · Digitalisasi Office Automation</b></div><button type="button" class="btn sm" data-pp-detail>Lihat contoh evaluasi</button></div>';
 if(tab==='eval')demo+='<div class="mt-pp-demo-grid"><div><small>Penutupan (asumsi)</small><b>31/08/2026</b></div><div><small>Evaluasi paling awal</small><b>30/11/2026</b></div><div><small>Status contoh</small><b>Persiapan evaluasi</b></div><div><small>Fokus</small><b>Efisiensi proses · Layanan · Keberlanjutan</b></div></div><p>Contoh agenda: sepakati indikator, kumpulkan data operasional dan survei pengguna, verifikasi realisasi manfaat, lalu susun rekomendasi. Tanggal aktual penutupan harus mengikuti dokumen resmi.</p>';
 if(tab==='manfaat')demo+='<div class="tscroll"><table class="lap mt-pp-benefit"><thead><tr><th>Indikator contoh</th><th>Baseline</th><th>Target</th><th>Realisasi simulasi</th><th>Capaian contoh</th></tr></thead><tbody><tr><td>Waktu proses pengajuan perjalanan dinas</td><td>3 hari</td><td>1 hari</td><td>1,2 hari</td><td>83,3%</td></tr><tr><td>Pengajuan selesai sesuai SLA</td><td>70%</td><td>90%</td><td>92%</td><td>102,2%</td></tr></tbody></table></div><p>Rumus contoh mengikuti register: target ÷ realisasi untuk indikator turun; realisasi ÷ target untuk indikator naik. Angka simulasi tidak masuk indeks resmi.</p>';
 if(tab==='porto')demo+='<div class="mt-pp-demo-grid"><div><small>Indeks adopsi (contoh)</small><b>85%</b></div><div><small>Indeks manfaat (contoh)</small><b>93%</b></div><div><small>Kuadran contoh</small><b>Adopsi tinggi · Manfaat tinggi</b></div><div><small>Rekomendasi</small><b>Pertahankan dan monitor</b></div></div><p>Contoh interpretasi berdasarkan ambang 80% di matriks aplikasi. Indeks manfaat contoh merupakan rata-rata dua indikator simulasi proses dan layanan, dibulatkan. Indeks adopsi harus bersumber dari Monev CM; indeks manfaat dari realisasi terverifikasi.</p>';
 demo+='</div>';
 workspace.innerHTML=head+demo;anchor.before(workspace);
 workspace.addEventListener('change',function(e){if(e.target.matches('[data-pp-demo]')){mtPPDemo=e.target.checked;workspace.querySelector('.mt-pp-demo').hidden=!mtPPDemo}});
 workspace.addEventListener('click',function(e){var b=e.target.closest('[data-pp-stage],[data-pp-prepare],[data-pp-detail]');if(!b)return;e.preventDefault();e.stopPropagation();
  if(b.hasAttribute('data-pp-stage')){mtPPStage=mtPPStage===b.dataset.ppStage?'':b.dataset.ppStage;PG.projectEval=0;render();return}
  if(b.hasAttribute('data-pp-prepare')){
   var x=queue[+b.dataset.ppPrepare];if(!x||!o||!o.canAdd()||!tpCanEdit(x.p))return;
   formModal('projectEval',null);
   var fields={program:x.p.akr,proyek:x.name,tglTutup:x.closed,tglEval:x.due,st:'Direncanakan'};
   Object.entries(fields).forEach(function(z){var el=document.getElementById('f_'+z[0]);if(el)el.value=z[1]||''});
   return;
  }
  modal('Contoh evaluasi pascaproyek · e-Perjadin','<p><b>SIMULASI — tidak disimpan sebagai hasil evaluasi resmi.</b></p><p>Asumsi penutupan 31 Agustus 2026. Evaluasi paling cepat 30 November 2026. Status: persiapan.</p><div class="tscroll"><table class="lap"><thead><tr><th>Aspek</th><th>Contoh isian</th><th>Bukti yang diperlukan</th></tr></thead><tbody><tr><td>Proses bisnis</td><td>Waktu pengajuan 3 hari → 1,2 hari (simulasi).</td><td>Log transaksi dan sampling waktu layanan.</td></tr><tr><td>Pemenuhan layanan</td><td>92% pengajuan selesai sesuai SLA (simulasi).</td><td>Dashboard SLA dan hasil survei pengguna.</td></tr><tr><td>Hasil / manfaat</td><td>Proses lebih ringkas dan waktu layanan lebih singkat (simulasi).</td><td>Validasi pemilik proses bisnis.</td></tr><tr><td>Tindak lanjut</td><td>Pantau complaint handling, integrasi dan keberlanjutan pemanfaatan.</td><td>PIC, tenggat, dan bukti tindak lanjut.</td></tr></tbody></table></div>','',null,{size:'wide',cancel:'Tutup'});
 });
 // Align action labels and compact table presentation without altering data.
 anchor.classList.add('mt-pp-native');
 if(tab==='porto'&&nav){
  var band=nav.querySelector('.subt')?nav:nav.parentElement;
  if(band&&!band.querySelector('.mt-tabsearch')){
   var lab=document.createElement('label');lab.className='mt-tabsearch mt-pp-porto-search';lab.innerHTML=ICON;
   var inp=document.createElement('input');inp.type='search';inp.placeholder='Cari program…';inp.setAttribute('aria-label','Cari program');lab.appendChild(inp);band.appendChild(lab);band.classList.add('mt-subt-row');
   inp.addEventListener('input',function(){var q=inp.value.trim().toLowerCase();anchor.querySelectorAll('tbody tr').forEach(function(r){r.hidden=!r.textContent.toLowerCase().includes(q)})});
  }
 }
}
/* 261125-MT-17 — compact CM communication planning table; keep form and export schema intact. */
function mtCompactCommunication(view){
 var table=view.querySelector('#tw-kom'),o=typeof T!=='undefined'?T.kom:null;
 if(!table||!o||table.classList.contains('mt-kom-compact'))return;
 var code=o.cols.find(function(c){return c.k==='_cc'}),wbs=o.cols.find(function(c){return c.k==='_wbs'}),module=o.cols.find(function(c){return c.k==='modul'}),mon=o.cols.find(function(c){return c.k==='_mon'});
 if(module)module.tbl=false;if(mon)mon.tbl=false;
 if(code&&wbs){var original=code.r;wbs.tbl=false;code.r=function(r){
  var item=window.MTCC&&MTCC.wbsFor(r.modul,'K');
  return original(r)+(item?'<span class="mt-kom-wbs" title="'+esc(MTCC.wbsText(r.modul,'K'))+'">WBS: '+esc(item.k)+'</span>':'<span class="mt-kom-wbs">WBS: —</span>');
 }}
 table.classList.add('mt-kom-compact');
 function columns(){
  var tbl=table.querySelector('table.tcard');if(!tbl||tbl.querySelector('colgroup.mt-kom-cols'))return;
  var weights={_cc:11,rin:14,k_info:17,k_kanal:12,k_keg:21,k_waktu:12,k_pic:7};
  var cols=o.cols.filter(function(c){return c.t!=='sec'&&c.tbl!==false&&(!c.show||c.show())});
  var cg=document.createElement('colgroup');cg.className='mt-kom-cols';
  var values=cols.map(function(c){return weights[c.k]||8});if(o.rowAct||o.edit||o.del)values.push(6);
  var total=values.reduce(function(a,b){return a+b},0);
  values.forEach(function(v){var col=document.createElement('col');col.style.width=(v/total*100)+'%';cg.appendChild(col)});
  tbl.prepend(cg);
  var last=tbl.querySelector('thead tr th:last-child');if(last&&!last.textContent.trim())last.textContent='Aksi';
 }
 redrawT('kom');columns();
 var body=table.querySelector('#tb-kom');if(body)new MutationObserver(columns).observe(body,{childList:true,subtree:true});
}
function placeTblSearch(){
 var view=document.getElementById('view');if(!view)return;
 if(view.querySelector('#tw-kom'))mtCompactCommunication(view);
 if(typeof VIEW!=='undefined'&&VIEW==='pmo-risiko'){mtRiskWorkspace(view);return;}
 if(typeof VIEW!=='undefined'&&VIEW==='pmo-laporan'){mtCapaianTwLayout(view);return;}
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
  /* WBS Perencanaan/Pelaksanaan dan Change Request: pencarian tetap pada toolbar daftar, bukan baris tab.
     Pindahkan node input asli agar state, keyboard shortcut dan handler data-q tetap sama. */
  if(['tw-wbs','tw-cr'].includes(g.tables[0].id)&&band.classList.contains('mt-pmo-subtab-band')&&tb){
   var wbsTools=document.createElement('div');wbsTools.className='tb-tools mt-wbs-list-tools mt-pmo-list-search-tools';
   wbsTools.appendChild(lab);if(bar0)wbsTools.appendChild(bar0);
   // WBS: move Excel actions into the existing ellipsis menu, retaining access and export behavior.
   if(g.tables[0].id==='tw-wbs'&&bar0){
    var excelButton=tb.querySelector('button[data-act="tdata"][data-t="wbs"]');
    var more=bar0.querySelector('.wbs-more-pop'),o=typeof T!=='undefined'?T.wbs:null;
    if(excelButton&&more&&o){
     var items=document.createDocumentFragment();
     function excelItem(label,title,enabled,action){
      var b=document.createElement('button');b.type='button';b.className='wbs-more-item';b.textContent=label;b.title=title;b.disabled=!enabled;
      b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(b.disabled)return;var d=more.closest('details');if(d)d.open=false;action()});
      items.appendChild(b);
     }
     var ct=hasTplT('wbs'),ci=canImpT('wbs');
     if(!o.noexp)excelItem('Ekspor data ke Excel','Unduh data sesuai filter dan pencarian saat ini',true,function(){exportT('wbs')});
     if(ct)excelItem('Unduh template Excel','Format kolom dan data WBS',true,function(){if(o.tpl)o.tpl();else tplT('wbs')});
     if(ct||o.imp2)excelItem('Impor dari Excel',ci?'Tambah/perbarui data dari template':'Akun Anda hanya dapat melihat data ini',ci,function(){if(canImpT('wbs')){var inp=tb.querySelector('input[data-imp="wbs"]');if(inp)inp.click()}});
     var sep=document.createElement('div');sep.className='mt-wbs-excel-divider';sep.setAttribute('role','separator');items.appendChild(sep);
     more.prepend(items);excelButton.remove();
    }
   }
   if(g.tables[0].id==='tw-cr'){var seg=tb.querySelector('.seg');if(seg)wbsTools.appendChild(seg);var excel=tb.querySelector('button[data-act="tdata"]');if(excel)wbsTools.appendChild(excel)}
   tb.appendChild(wbsTools);tb.classList.add('tb-has-tools');
   band.classList.remove('mt-subt-row');band.classList.add('mt-subt-full');return;
  }
  if(!pc&&bar0&&tb){var t2=document.createElement('div');t2.className='pc-tools tb-tools';t2.appendChild(bar0);tb.appendChild(t2);tb.classList.add('tb-has-tools')}
  if(pc){var tools=document.createElement('div');tools.className='pc-tools';tools.appendChild(lab);var bar=g.nav.parentNode.querySelector('.wbs-actionbar');if(bar)tools.appendChild(bar);pc.appendChild(tools);pc.classList.add('pc-has-tools');g.nav.parentNode.classList.add('mt-subt-full');return}
  if(g.nav.nextSibling)g.nav.parentNode.insertBefore(lab,g.nav.nextSibling);else g.nav.parentNode.appendChild(lab);
  g.nav.parentNode.classList.add('mt-subt-row');
 });
 if(typeof VIEW!=='undefined'&&VIEW==='pmo-pascaproyek')mtPPWorkspace(view);
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
 /* WBS dan Change Request menggunakan satu ukuran pencarian; nav tetap penuh. */
 '#app :is(#tw-wbs,#tw-cr) .tbar .mt-pmo-list-search-tools{flex:1 1 auto;min-width:0;display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-left:auto}'+
 '#app :is(#tw-wbs,#tw-cr) .tbar .mt-pmo-list-search-tools>.mt-tabsearch{box-sizing:border-box;flex:0 1 320px!important;width:320px!important;min-width:260px!important;max-width:320px!important;height:36px!important;margin:0!important;order:0!important}'+
 '#app :is(#tw-wbs,#tw-cr) .tbar .mt-pmo-list-search-tools>.mt-tabsearch input{height:36px!important;min-height:36px!important;max-height:36px!important}'+
 '#app #tw-cr .mt-pmo-list-search-tools>.seg,#app #tw-cr .mt-pmo-list-search-tools>.btn{flex:0 0 auto}'+
 '@media(max-width:650px){#app :is(#tw-wbs,#tw-cr) .tbar .mt-pmo-list-search-tools{flex:1 1 100%;width:100%}#app :is(#tw-wbs,#tw-cr) .tbar .mt-pmo-list-search-tools>.mt-tabsearch{flex:1 1 100%!important;width:100%!important;min-width:0!important;max-width:100%!important}}'+
 /* Excel action grouping in WBS ellipsis. */
 '#app #tw-wbs .mt-wbs-excel-divider{height:1px;background:#e0e6ef;margin:4px 5px}'+
 '#app #tw-wbs .wbs-more-item:disabled{opacity:.45;cursor:not-allowed;background:transparent!important}'+
 '#app #tw-wbs .tbar .mt-pmo-list-search-tools{flex:1 1 350px;min-width:0}'+
 '#app #tw-wbs .tbar .mt-pmo-list-search-tools>.mt-tabsearch{flex:1 1 180px!important;width:auto!important;min-width:180px!important;max-width:320px!important}'+
 '@media(min-width:1001px){#app #tw-wbs .tbar .mt-pmo-list-search-tools{flex-wrap:nowrap}#app #tw-wbs .tbar .mt-pmo-list-search-tools>.wbs-actionbar{flex-wrap:nowrap}}'+
 '@media(max-width:650px){#app #tw-wbs .tbar .mt-pmo-list-search-tools>.mt-tabsearch{flex:1 1 100%!important;max-width:100%!important;min-width:0!important}}'+
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
  // Distinguish the three project actions by their actual function, not their generic title.
  if(el.matches('.pm-ws-icon[data-act="pgRep"]'))return 'amber';
  if(el.matches('.pm-ws-icon[data-act="prjOpen"]'))return 'teal';
  if(el.matches('.pm-ws-icon.doc'))return 'indigo';
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
  if(el.closest('.kkb-step,.esth-wrap,.top,.t-dh2,.pm-stage-shell,.ptabs,.subt,[role="tablist"],.flt,.fbar,.tfoot,.t-pager,.t-mnav,.t-dnav')||el.matches('[role="tab"],[data-pg],[data-tpg],.t-acc,.search-clear-btn,.fx,.ui-info-control,.ui-help-aligned,.hq,.hlp,.ui-note-link,[role="switch"],[aria-haspopup="dialog"].ui-info-control'))return;
  const label=(el.getAttribute('aria-label')||el.getAttribute('title')||'').trim(),txt=plain(el),kind=glyphMap.get(txt);
  const svg=!!el.querySelector('svg');
  if(!kind&&txt)return; // never resize text-bearing buttons or count chips
  if(!svg&&!kind&&!el.matches(known))return;
  if(!label&&!el.matches(known))return;
  if(!svg&&!kind)return; // avoid guessing how a CSS-only icon is rendered
  if(el.matches('a')&&!label&&!el.matches(known))return;
  if(el.getAttribute('aria-expanded')!==null&&!el.matches('.wbs-kebab,.icon-btn,.psbank-action-icon'))return;
  const k=tone(el,label,kind);
  // Recognizable line icons, with the same stroke and optical size.
  const projectSymbol=el.matches('.pm-ws-icon[data-act="pgRep"]')?'<path d="M4 19h16M7 15V9m5 6V5m5 10v-4"/>':el.matches('.pm-ws-icon[data-act="prjOpen"]')?'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M10 9v11m3-7h5m-5 3h5"/>':el.matches('.pm-ws-icon.doc')?'<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6"/>':'';
  if(projectSymbol)el.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+projectSymbol+'</svg>';
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

(function(){var st=document.createElement('style');st.id='mt-capaian-tw-style';st.textContent="\n/* Capaian TW: compact reporting workspace, scoped to the three report cards. */\n#app .mt-tw-report-tools{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin:0 0 9px;padding:7px 10px;border:1px solid #dce5ef;border-radius:10px;background:#fff}\n#app .mt-tw-context,#app .mt-tw-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;min-width:0}\n#app .mt-tw-context label{display:flex;align-items:center;gap:6px;font-size:12px;color:#536781;white-space:nowrap}\n#app .mt-tw-year{font-size:12px;font-weight:800;color:#173a66;border-right:1px solid #dce5ef;padding-right:9px}\n#app .mt-tw-context select{height:34px;min-width:86px;padding:0 8px;border:1px solid #d4dfec;border-radius:8px;background:#fff;color:#173a66;font:inherit;font-weight:700}\n#app .mt-tw-actions .btn{height:34px!important;min-height:34px!important;padding:0 10px!important;white-space:nowrap;font-size:12px!important}\n#app .mt-tw-table-card{margin-bottom:10px!important}\n#app .mt-tw-table-card>.ch,#app .mt-tw-table-card>.tbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:7px 11px!important;min-height:45px;box-sizing:border-box}\n#app .mt-tw-table-card>.ch>h3,#app .mt-tw-table-card>.tbar>h3{font-size:14px!important;margin:0!important;white-space:nowrap}\n#app .mt-tw-section-tools{display:flex;align-items:center;gap:8px;margin-left:auto;min-width:0}\n#app .mt-tw-count{font-size:11px;color:#66788f;white-space:nowrap;font-variant-numeric:tabular-nums}\n#app .mt-tw-table-card .mt-tw-search{flex:0 1 260px!important;width:260px!important;min-width:155px!important;max-width:100%!important;margin:0!important}\n#app .mt-tw-kwide .mt-tw-search{margin-left:auto!important}\n#app .mt-tw-table-card .mt-tw-search input{height:34px!important;font-size:12px!important}\n#app .mt-tw-table-card>.tscroll{overflow-x:auto}\n#app .mt-tw-table{width:100%;table-layout:fixed;min-width:850px;font-variant-numeric:tabular-nums}\n#app .mt-tw-table thead th{background:#eef3f9!important;color:#536781!important;vertical-align:middle!important;padding:7px 9px!important;line-height:1.2;font-size:11.5px!important;white-space:normal}\n#app .mt-tw-table thead th:first-child{width:29%;text-align:left}\n#app .mt-tw-table thead th:nth-child(n+2):nth-child(-n+5){width:12%;text-align:right}\n#app .mt-tw-table thead th:nth-child(6){width:10%;text-align:right}\n#app .mt-tw-table thead th:nth-child(7){width:13%;text-align:right}\n#app .mt-tw-table thead th small{display:block;font-size:10px;font-weight:600;text-transform:none;margin-top:2px;letter-spacing:0}\n#app .mt-tw-table tbody td{padding:7px 9px!important;vertical-align:middle!important;border-bottom:1px solid #e9eef5;line-height:1.2;font-size:12px}\n#app .mt-tw-table tbody td:first-child{color:#16365b;overflow-wrap:anywhere}\n#app .mt-tw-table tbody td .sm{display:block;margin-top:3px;font-size:10.5px;color:#62748b;white-space:nowrap}\n#app .mt-tw-table tbody tr:nth-child(even){background:#fafbfd}\n#app .mt-tw-table tbody tr:hover{background:#f3f7fc}\n#app .mt-tw-table tbody tr[hidden]{display:none!important}\n#app .mt-tw-table .mt-tw-selected{background:#fff9eb!important}\n#app .mt-tw-table thead .mt-tw-selected{box-shadow:inset 0 -3px #fdb913;color:#173a66!important}\n#app .mt-tw-table .mt-tw-value{display:inline-block;min-width:52px;text-align:right;font-size:13px;font-weight:800;line-height:1.25}\n#app .mt-tw-table .mt-tw-value[data-tone=\"met\"]{color:#087f72}\n#app .mt-tw-table .mt-tw-value[data-tone=\"below\"]{color:#315e91}\n#app .mt-tw-table .mt-tw-value[data-tone=\"na\"]{color:#8391a4}\n#app .mt-tw-table .mt-tw-annual{background:#f0f5fb!important;border-left:1px solid #dce5ef}\n#app .mt-tw-table td.mt-tw-annual>b{font-size:14px;color:#173a66}\n#app .mt-tw-progress{display:block;height:4px;width:100%;max-width:100px;margin:5px 0 0 auto;background:#dce5ef;border-radius:5px;overflow:hidden}\n#app .mt-tw-progress>i{display:block;height:100%;background:#527bb2;border-radius:5px}\n#app .mt-tw-progress>i.met{background:#138477}\n#app .mt-tw-table .mt-tw-total>td{background:#e8eff8!important;color:#15385f;border-bottom:2px solid #cddbec;font-weight:800}\n#app .mt-tw-table .mt-tw-total>td.mt-tw-selected{background:#fff0c9!important}\n#app .mt-tw-table-card .mt-tw-note{padding:6px 11px!important;font-size:11px!important;line-height:1.4}\n#app .mt-tw-table-card .mt-tw-note[hidden]{display:none!important}\n#app .mt-tw-kwide table td{padding-top:7px!important;padding-bottom:7px!important;vertical-align:middle}\n@media(max-width:760px){#app .mt-tw-actions{width:100%}#app .mt-tw-section-tools{flex:1 1 100%;justify-content:flex-end}#app .mt-tw-table-card .mt-tw-search{flex:1 1 200px!important;width:auto!important}#app .mt-tw-table{min-width:790px}}\n";document.head.appendChild(st)})();

(function(){var st=document.createElement('style');st.id='mt-capaian-tw-chips-style';st.textContent="\n/* 261125-MT-09: shared segmented controls and stable reporting toolbar. */\n#app .mt-tw-report-tools{display:flex;align-items:center;justify-content:flex-start;gap:8px;flex-wrap:wrap;padding:7px 10px;min-height:50px;box-sizing:border-box}\n#app .mt-tw-chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));flex:0 0 306px;max-width:100%;height:36px;box-sizing:border-box;background:#eef2f7;border:1px solid #d9e2ee;border-radius:9px;gap:3px;padding:3px}\n#app .mt-tw-chips .mt-tw-chip{min-width:0;padding:0 6px;border:1px solid transparent;border-radius:6px;background:transparent;color:#526781;font:700 12px Inter,\"Nunito Sans\",Arial,sans-serif;white-space:nowrap;cursor:pointer;transition:background-color .14s,color .14s,border-color .14s}\n#app .mt-tw-chips .mt-tw-chip:hover:not(.on){background:#e1e9f3;color:#173a66}\n#app .mt-tw-chips .mt-tw-chip.on{background:#14355d;border-color:#14355d;color:#fff}\n#app .mt-tw-chips .mt-tw-chip:focus-visible{outline:2px solid #fdb913;outline-offset:1px}\n#app .mt-tw-context{flex:0 0 auto}\n#app .mt-tw-context select{height:36px}\n#app .mt-tw-report-tools>.mt-tw-shared-search{flex:1 1 200px!important;width:auto!important;min-width:160px!important;max-width:320px!important;margin:0 0 0 auto!important;order:0!important}\n#app .mt-tw-report-tools>.mt-tw-shared-search[hidden]{display:none!important}\n#app .mt-tw-actions{flex:0 0 auto;gap:5px;margin-left:0}\n#app .mt-tw-actions .mt-tw-export-icon{display:inline-flex;align-items:center;justify-content:center;min-width:32px;width:32px;height:32px!important;padding:0!important;background:#eff9f6;color:#087f72;border:1px solid #b2dfd3;border-radius:9px}\n#app .mt-tw-actions .mt-tw-export-icon:hover{background:#e0f3ed;border-color:#80c7b6}\n#app .mt-tw-more{position:relative}\n#app .mt-tw-more .wbs-more-pop{min-width:210px;z-index:130}\n#app .mt-tw-more .wbs-kebab{width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;padding:0!important}\n#app .mt-tw-panel[hidden]{display:none!important}\n#app .mt-tw-panel>.ch,#app .mt-tw-panel>.tbar{min-height:45px!important}\n#app .mt-tw-panel .mt-tw-section-tools{flex:0 0 auto!important;margin-left:auto}\n@media(min-width:1100px){#app .mt-tw-report-tools{flex-wrap:nowrap}}\n@media(max-width:760px){#app .mt-tw-chips{flex:1 1 100%;width:100%}#app .mt-tw-actions{width:auto}#app .mt-tw-report-tools>.mt-tw-shared-search{flex:1 1 160px!important}}\n@media(prefers-reduced-motion:reduce){#app .mt-tw-chip{transition:none}}\n";document.head.appendChild(st)})();

(function(){var st=document.createElement('style');st.id='mt-capaian-tw-search-align';st.textContent="/* 261125-MT-10: align Capaian TW search with other monitoring subtabs. */\n#app .mt-tw-report-tools>.mt-tw-actions{margin-left:auto}\n#app .mt-pmo-subtab-band.mt-subt-row>.mt-tw-shared-search{align-self:center}\n#app .mt-pmo-subtab-band.mt-subt-row>.mt-tw-shared-search[hidden]{display:none!important}\n";document.head.appendChild(st)})();

(function(){var st=document.createElement('style');st.id='mt-risk-monitoring-style';st.textContent="\n/* 261125-MT-11 — compact risk monitoring. */\n#app .mt-risk-workspace{display:flex!important;flex-direction:column!important;gap:9px!important;align-items:stretch!important;min-width:0}\n#app .mt-risk-workspace>*{width:100%;min-width:0;box-sizing:border-box;order:initial!important}\n#app .mt-risk-workspace .mt-risk-summary[hidden],#app .mt-risk-workspace [hidden]{display:none!important}\n#app .mt-risk-toolbar{display:flex;align-items:center;gap:7px;padding:6px 9px;min-height:48px;border:1px solid #dce5ef;border-radius:10px;background:#fff;flex-wrap:wrap}\n#app .mt-risk-chips,#app .mt-risk-mode{display:inline-grid;grid-template-columns:repeat(2,minmax(0,1fr));height:36px;border:1px solid #dce5ef;border-radius:9px;padding:3px;gap:3px;background:#eef2f7;box-sizing:border-box}\n#app .mt-risk-chips{width:254px;max-width:100%}\n#app .mt-risk-mode{width:290px;max-width:100%;height:33px}\n#app :is(.mt-risk-chips,.mt-risk-mode)>button{background:transparent;border:1px solid transparent;border-radius:6px;color:#526781;font:700 12px Inter,\"Nunito Sans\",Arial,sans-serif;padding:0 7px;white-space:nowrap;cursor:pointer}\n#app :is(.mt-risk-chips,.mt-risk-mode)>button[aria-pressed=\"true\"]{background:#14355d;color:#fff}\n#app :is(.mt-risk-chips,.mt-risk-mode)>button:hover:not([aria-pressed=\"true\"]){background:#dfe8f3}\n#app .mt-risk-spacer{flex:1}\n#app .mt-risk-actions{display:flex;gap:5px;align-items:center}\n#app .mt-risk-toolbar .btn{height:36px;min-height:36px;font-size:12px}\n#app .mt-risk-toolbar .mt-risk-excel{display:inline-flex;align-items:center;justify-content:center;width:36px;padding:0;background:#eff9f6;color:#087f72;border-color:#b2dfd3}\n#app .mt-risk-summary{padding:9px 12px!important;margin:0!important;overflow:visible}\n#app .mt-risk-summary-head{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px}\n#app .mt-risk-score{display:flex;align-items:center;gap:6px;font-size:12px;color:#526781}\n#app .mt-risk-split{display:grid;grid-template-columns:minmax(260px,34%) minmax(0,1fr);gap:15px;align-items:start}\n#app .mt-risk-compare{display:grid;grid-template-columns:minmax(240px,1fr) minmax(240px,1fr) minmax(220px,.9fr);gap:14px;align-items:start}\n#app .mt-risk-matrix{min-width:0;max-width:100%}\n#app .mt-risk-matrix-title,#app .mt-risk-profile-title{display:flex;align-items:center;justify-content:space-between;gap:5px;flex-wrap:wrap;margin-bottom:6px;color:#173a66;font-size:12px}\n#app .mt-risk-summary small{font-size:10.5px;color:#62748b}\n#app .mt-risk-map{display:flex;gap:4px;align-items:stretch}\n#app .mt-risk-axis-y{writing-mode:vertical-rl;transform:rotate(180deg);text-align:center;font-size:10px;color:#526781;font-weight:700;width:14px;flex:none}\n#app .mt-risk-grid{display:grid;grid-template-columns:18px repeat(5,minmax(0,1fr));gap:3px;flex:1;min-width:0}\n#app .mt-risk-axis{display:grid;place-items:center;font-size:11px;color:#526781;font-weight:700}\n#app .mt-risk-axis-x{text-align:center;margin-left:28px;font-size:10px;color:#526781;font-weight:700}\n#app .mt-risk-cell{height:32px;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;border:1px solid transparent;border-radius:5px;padding:0;color:#173a66;font:inherit;cursor:pointer;transition:filter .14s,border-color .14s}\n#app .mt-risk-cell b{font-size:13px;line-height:1.1}\n#app .mt-risk-cell small{font-size:9px;line-height:1}\n#app .mt-risk-cell.zero b{color:#7b8b8d;font-weight:500}\n#app .mt-risk-cell:hover{filter:brightness(.96);border-color:#647d9e}\n#app .mt-risk-cell.on{outline:2px solid #173a66;outline-offset:-2px}\n#app .mt-risk-cell.high,#app .mt-risk-legend i.high{background:#f5ccce}\n#app .mt-risk-cell.med,#app .mt-risk-legend i.med{background:#fae7be}\n#app .mt-risk-cell.low,#app .mt-risk-legend i.low{background:#ddede4}\n#app .mt-risk-profile,#app .mt-risk-comparison-stats{display:flex;flex-direction:column;gap:6px;min-width:0}\n#app .mt-risk-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}\n#app .mt-risk-profile-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}\n#app .mt-risk-stage-metrics,#app .mt-risk-issue-metrics{grid-template-columns:repeat(5,minmax(0,1fr))}\n#app .mt-risk-metric{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:3px;min-width:0;min-height:49px;padding:6px 8px;border:1px solid #dce5ef;border-radius:8px;background:#f8fafc;color:#173a66;text-align:left;font:inherit;cursor:pointer}\n#app .mt-risk-metric span{font-size:11px;font-weight:650;line-height:1.15;overflow-wrap:anywhere}\n#app .mt-risk-metric b{font-size:19px;line-height:1;font-variant-numeric:tabular-nums}\n#app .mt-risk-metric small{font-size:10px}\n#app .mt-risk-metric.high{background:#fff1f1;border-color:#efc7c9;color:#b73540}\n#app .mt-risk-metric.med{background:#fff8e9;border-color:#eed7a5;color:#a66b0a}\n#app .mt-risk-metric.low{background:#eff8f3;border-color:#c2e1d2;color:#087f72}\n#app .mt-risk-metric.blue{background:#f0f5fb;border-color:#cbdcef;color:#315e91}\n#app .mt-risk-metric:hover{filter:brightness(.98)}\n#app .mt-risk-metric.on{outline:2px solid currentColor;outline-offset:-2px}\n#app .mt-risk-distribution{display:flex;height:6px;background:#e7edf5;border-radius:4px;overflow:hidden}\n#app .mt-risk-distribution i.high{background:#d9777d}#app .mt-risk-distribution i.med{background:#e5bb65}#app .mt-risk-distribution i.low{background:#6eac97}\n#app .mt-risk-subtitle{font-size:12px;color:#173a66}\n#app .mt-risk-insight{margin:0;padding:7px 9px;background:#f3f6fa;border-radius:7px;font-size:11.5px;line-height:1.4;color:#536781}\n#app .mt-risk-legend{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px;padding-top:6px;border-top:1px solid #edf1f6;font-size:10.5px;color:#536781}\n#app .mt-risk-legend span{display:flex;align-items:center;gap:4px}#app .mt-risk-legend i{display:inline-block;width:10px;height:10px;border-radius:3px}\n#app .mt-risk-legend small{margin-left:auto}\n#app .mt-risk-workspace #tw-risk .tbar{min-height:43px;padding:6px 10px}\n#app .mt-risk-workspace #tw-risk td{vertical-align:middle;padding-top:7px;padding-bottom:7px}\n#app .mt-risk-workspace #tw-risk .tcard{min-width:980px}\n#app .mt-risk-workspace #tw-risk .ract{flex-wrap:nowrap}\n@media(max-width:1000px){#app .mt-risk-compare{grid-template-columns:repeat(2,minmax(0,1fr))}#app .mt-risk-comparison-stats{grid-column:1/-1}#app .mt-risk-stage-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}\n@media(max-width:680px){#app .mt-risk-split,#app .mt-risk-compare{grid-template-columns:1fr}#app .mt-risk-issue-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}#app .mt-risk-legend small{margin-left:0}}\n@media(prefers-reduced-motion:reduce){#app .mt-risk-cell{transition:none}}\n";document.head.appendChild(st)})();

(function(){var st=document.createElement('style');st.id='mt-risk-fullwidth-style';st.textContent="/* 261125-MT-12 — full-width risk and issue register; override legacy .stk two-column rule. */\n#app .mt-risk-workspace>div:last-child:not(.card),\n#app .mt-risk-workspace>.mt-risk-register-wrap{display:block!important;grid-template-columns:minmax(0,1fr)!important;width:100%!important;max-width:none!important;min-width:0!important}\n#app .mt-risk-workspace #tw-risk{width:100%!important;max-width:none!important;min-width:0!important;box-sizing:border-box;grid-column:1/-1}\n#app .mt-risk-workspace #tb-risk{width:100%;min-width:0}\n#app .mt-risk-workspace #tw-risk .tscroll{width:100%;max-width:100%;overflow-x:auto}\n#app .mt-risk-workspace #tw-risk .tcard{width:100%;min-width:980px}\n";document.head.appendChild(st)})();

(function(){var st=document.createElement('style');st.id='mt-risk-register-compact';st.textContent="\n/* 261125-MT-13: proportional register columns and stable icon order. */\n#app .mt-risk-workspace #tw-risk .mt-risk-origin{display:flex;flex-direction:column;align-items:flex-start;gap:3px}\n#app .mt-risk-workspace #tw-risk .mt-risk-origin-program{font-size:11px;font-weight:700;color:#315e91;overflow-wrap:anywhere}\n#app .mt-risk-workspace #tw-risk .mt-risk-description{font-weight:600;line-height:1.38;overflow-wrap:anywhere;white-space:normal}\n#app .mt-risk-workspace #tw-risk .mt-risk-review-status{font-weight:650}\n#app .mt-risk-workspace #tw-risk .ract{justify-content:flex-start;gap:4px}\n#app .mt-risk-workspace #tw-risk .ract>[data-act=\"toisu\"]{order:10}\n@media(min-width:761px){\n #app .mt-risk-workspace #tw-risk .tcard{table-layout:fixed;width:100%;min-width:1080px}\n #app .mt-risk-workspace #tw-risk .tcard th,#app .mt-risk-workspace #tw-risk .tcard td{box-sizing:border-box;padding:7px 6px!important;white-space:normal;min-width:0;max-width:none;overflow-wrap:anywhere;vertical-align:middle;line-height:1.3}\n #app .mt-risk-workspace #tw-risk .tcard th{font-size:11px;letter-spacing:0}\n #app .mt-risk-workspace #tw-risk .tcard td{font-size:12px}\n #app .mt-risk-workspace #tw-risk .tcard thead th:nth-child(1){width:52px}\n #app .mt-risk-workspace #tw-risk .tcard thead th:nth-child(2){width:auto}\n #app .mt-risk-workspace #tw-risk .tcard thead th:nth-child(3){width:76px}\n #app .mt-risk-workspace #tw-risk .tcard thead th:nth-child(4){width:90px}\n #app .mt-risk-workspace #tw-risk .tcard thead th:nth-child(5){width:95px}\n #app .mt-risk-workspace #tw-risk .tcard thead th:nth-child(6){width:82px}\n #app .mt-risk-workspace #tw-risk .tcard thead th:nth-child(7){width:83px}\n #app .mt-risk-workspace #tw-risk .tcard thead th:nth-child(8){width:95px}\n #app .mt-risk-workspace #tw-risk:not(.mt-risk-issue-table) .tcard thead th:nth-child(9){width:95px}\n #app .mt-risk-workspace #tw-risk:not(.mt-risk-issue-table) .tcard thead th:nth-child(10),\n #app .mt-risk-workspace #tw-risk.mt-risk-issue-table .tcard thead th:nth-child(9){width:105px}\n #app .mt-risk-workspace #tw-risk .tcard thead th:last-child{width:152px}\n #app .mt-risk-workspace #tw-risk.mt-risk-issue-table .tcard thead th:last-child{width:116px}\n #app .mt-risk-workspace #tw-risk .tcard td.tact{padding:5px 6px!important}\n #app .mt-risk-workspace #tw-risk .tcard td .chip{font-size:11px;white-space:normal;max-width:100%;line-height:1.2}\n #app .mt-risk-workspace #tw-risk .tcard td .sm{font-size:11px;line-height:1.3}\n}\n@media(max-width:760px){#app .mt-risk-workspace #tw-risk .tcard{min-width:0!important}}\n";document.head.appendChild(st)})();

(function(){var st=document.createElement('style');st.id='mt-risk-register-proportions';st.textContent="\n@media(min-width:761px){\n #app .mt-risk-workspace #tw-risk .tcard{min-width:1120px}\n #app .mt-risk-workspace #tw-risk .tcard thead th:nth-child(1){width:48px}\n #app .mt-risk-workspace #tw-risk .tcard thead th:nth-child(3){width:65px}\n #app .mt-risk-workspace #tw-risk .tcard thead th:nth-child(4){width:84px}\n #app .mt-risk-workspace #tw-risk .tcard thead th:nth-child(5){width:82px}\n #app .mt-risk-workspace #tw-risk .tcard thead th:nth-child(6){width:72px}\n #app .mt-risk-workspace #tw-risk .tcard thead th:nth-child(7){width:78px}\n #app .mt-risk-workspace #tw-risk .tcard thead th:nth-child(8){width:83px}\n #app .mt-risk-workspace #tw-risk:not(.mt-risk-issue-table) .tcard thead th:nth-child(9){width:82px}\n #app .mt-risk-workspace #tw-risk:not(.mt-risk-issue-table) .tcard thead th:nth-child(10),\n #app .mt-risk-workspace #tw-risk.mt-risk-issue-table .tcard thead th:nth-child(9){width:98px}\n}\n";document.head.appendChild(st)})();

(function(){var st=document.createElement('style');st.id='mt-project-risk-icons-compact';st.textContent="\n/* 261125-MT-14 — one compact icon size for project and risk register rows. */\nhtml #app :is(.pm-project-table .pm-act2,#tw-risk .ract) .mt-action-icon.mt-action-icon[data-mt-tone]{\n width:30px!important;min-width:30px!important;max-width:30px!important;\n height:30px!important;min-height:30px!important;max-height:30px!important;\n flex:0 0 30px!important;border-radius:8px!important;padding:0!important;\n}\nhtml #app :is(.pm-project-table .pm-act2,#tw-risk .ract) .mt-action-icon.mt-action-icon[data-mt-tone]>svg{\n width:15px!important;height:15px!important;min-width:15px!important;min-height:15px!important;\n}\nhtml #app .pm-project-table .pm-act2{gap:4px!important;align-items:center;white-space:nowrap}\nhtml #app .pm-project-table .pm-act2 .pm-ws-icon{opacity:1}\nhtml #app .pm-project-table .pm-act2 .pm-ws-icon:after{display:none!important}\nhtml #app .pm-project-table .pm-act2 .pm-ws-icon[disabled]{opacity:.42!important}\nhtml #app .pm-project-table.dpk :is(th,td).pm-ws-action{width:112px!important;min-width:112px!important;max-width:112px!important;padding-left:5px!important;padding-right:5px!important;box-sizing:border-box}\nhtml #app #tw-risk .ract{gap:4px!important;flex-wrap:nowrap;align-items:center}\n@media(min-width:761px){\n #app .mt-risk-workspace #tw-risk .tcard thead th:last-child{width:144px}\n #app .mt-risk-workspace #tw-risk.mt-risk-issue-table .tcard thead th:last-child{width:110px}\n}\n";document.head.appendChild(st)})();

(function(){var st=document.createElement('style');st.id='mt-pp-workspace-style';st.textContent="\n/* 261125-MT-15 — compact post-project evaluation workspace */\n#app .mt-pp-workspace{display:flex;flex-direction:column;gap:8px;margin:0 0 10px;min-width:0}\n#app .mt-pp-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:7px 10px;background:#fff;border:1px solid #dce5ef;border-radius:9px}\n#app .mt-pp-top b,#app .mt-pp-cardhead b{display:block;font-size:13px;color:#173a66}\n#app .mt-pp-top small,#app .mt-pp-cardhead small{display:block;font-size:11px;color:#62748b;margin-top:2px}\n#app .mt-pp-demo-toggle{font-size:12px;display:flex;align-items:center;gap:6px;color:#526781;white-space:nowrap}\n#app .mt-pp-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}\n#app .mt-pp-kpi{display:flex;flex-direction:column;gap:4px;text-align:left;padding:8px 11px;border:1px solid #dce5ef;background:#fff;border-radius:9px;min-width:0;color:#173a66;font:inherit}\n#app .mt-pp-kpi:disabled{opacity:1;cursor:default}#app .mt-pp-kpi:not(:disabled){cursor:pointer}#app .mt-pp-kpi:not(:disabled):hover{border-color:#91a7c1}\n#app .mt-pp-kpi.on{outline:2px solid #173a66;outline-offset:-2px}\n#app .mt-pp-kpi span{font-size:11.5px;font-weight:700}#app .mt-pp-kpi b{font-size:23px;line-height:1.1}#app .mt-pp-kpi small{font-size:10.5px;color:#62748b;line-height:1.2}\n#app .mt-pp-kpi.navy{background:#14355d;color:#fff;border-color:#14355d}#app .mt-pp-kpi.navy small{color:#c6d7ec}#app .mt-pp-kpi.teal b{color:#087f72}#app .mt-pp-kpi.amber b{color:#a66b0a}\n#app .mt-pp-card{border:1px solid #dce5ef;background:#fff;border-radius:9px;overflow:hidden}\n#app .mt-pp-cardhead{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:7px 10px;border-bottom:1px solid #e5ebf3}\n#app .mt-pp-cardhead .btn{font-size:11.5px;min-height:30px}\n#app .mt-pp-card .lap{width:100%;min-width:640px}#app .mt-pp-card .lap th{font-size:11px;background:#f1f5fa}#app .mt-pp-card .lap td,#app .mt-pp-card .lap th{padding:7px 10px;vertical-align:middle}#app .mt-pp-card .lap td{font-size:12px}#app .mt-pp-card .lap td small{display:block;color:#62748b;font-size:11px;margin-top:3px}\n#app .mt-pp-empty{color:#62748b;text-align:center}\n#app .mt-pp-demo{border-color:#ead7a6;background:#fffcf4}#app .mt-pp-demo[hidden]{display:none!important}\n#app .mt-pp-demo .mt-pp-cardhead{border-bottom-color:#efe4c6}\n#app .mt-pp-badge{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.2px;color:#946005;background:#fff0c7;padding:3px 6px;border-radius:4px;margin-bottom:3px}\n#app .mt-pp-demo-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:8px 10px}\n#app .mt-pp-demo-grid>div{padding-left:8px;border-left:2px solid #e4c77d;min-width:0}\n#app .mt-pp-demo-grid small{display:block;font-size:11px;color:#62748b;margin-bottom:3px}#app .mt-pp-demo-grid b{font-size:12px;color:#173a66}\n#app .mt-pp-demo p{margin:0;padding:6px 10px 8px;font-size:11.5px;line-height:1.4;color:#536781}\n#app .mt-pp-actions{display:flex;align-items:center;gap:6px;margin-left:auto}\n#app .mt-pp-native .tbar{min-height:44px;padding:6px 10px;gap:7px}#app .mt-pp-native .tbar .btn{min-height:34px}\n#app .mt-pp-native .tcard td,#app .mt-pp-native .tcard th{padding:7px 8px;vertical-align:middle}\n#app .mt-pp-native .empty{padding:18px 10px}\n#app .mt-pp-native tr[hidden]{display:none!important}\n@media(max-width:800px){#app .mt-pp-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}#app .mt-pp-demo-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}\n";document.head.appendChild(st)})();

(function(){var st=document.createElement('style');st.id='mt-pp-benefit-compact';st.textContent="#app .mt-pp-native .mt-pp-meter{display:block;width:100%;max-width:100px;height:4px;background:#e4ebf4;border-radius:4px;overflow:hidden;margin-top:4px}#app .mt-pp-native .mt-pp-meter i{display:block;height:100%;border-radius:4px}#app #tw-ppManfaat.mt-pp-native .tbar .btn[data-act=\"add\"]{margin-left:auto}#app #tw-ppManfaat.mt-pp-native .tcard td .sm{font-size:11px;line-height:1.3}";document.head.appendChild(st)})();

(function(){var st=document.createElement('style');st.id='mt-kom-compact-style';st.textContent="\n/* 261125-MT-17 — fit communication table across available desktop width. */\n#app #tw-kom.mt-kom-compact{width:100%!important;min-width:0!important;max-width:none!important}\n#app #tw-kom.mt-kom-compact .tscroll{max-width:100%;width:100%;overflow-x:auto}\n@media(min-width:900px){\n#app #tw-kom.mt-kom-compact table.tcard{table-layout:fixed!important;width:100%!important;min-width:0!important;max-width:none!important}\n#app #tw-kom.mt-kom-compact .tcard :is(th,td){box-sizing:border-box;width:auto!important;min-width:0!important;max-width:none!important;white-space:normal!important;overflow-wrap:anywhere;padding:7px 6px!important;vertical-align:middle;font-size:12px;line-height:1.35}\n#app #tw-kom.mt-kom-compact .tcard th{font-size:11px;letter-spacing:0}\n#app #tw-kom.mt-kom-compact .tcard td .tv{min-width:0!important;max-width:none!important;white-space:normal!important;overflow-wrap:anywhere}\n#app #tw-kom.mt-kom-compact .tcard .sm{font-size:11px;line-height:1.3;white-space:normal}\n#app #tw-kom.mt-kom-compact .tcard .chip{font-size:10.5px;white-space:normal;line-height:1.2;max-width:100%}\n#app #tw-kom.mt-kom-compact .tcard .code{font-size:10.5px;white-space:normal;overflow-wrap:anywhere}\n#app #tw-kom.mt-kom-compact .ract{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:3px!important}\nhtml #app #tw-kom.mt-kom-compact .ract .mt-action-icon.mt-action-icon[data-mt-tone]{width:28px!important;min-width:28px!important;max-width:28px!important;height:28px!important;min-height:28px!important;max-height:28px!important;flex:0 0 28px!important;border-radius:8px!important}\nhtml #app #tw-kom.mt-kom-compact .ract .mt-action-icon.mt-action-icon[data-mt-tone]>svg{width:15px!important;height:15px!important;min-width:15px!important;min-height:15px!important}\n}\n#app #tw-kom.mt-kom-compact .mt-kom-wbs{display:block;margin-top:3px;font-size:10.5px;color:#62748b;line-height:1.2}\n";document.head.appendChild(st)})();
