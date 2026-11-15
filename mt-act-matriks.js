/* ===== Aktivitas › Matriks (Kategori × Unit Pengusul / Program Terkait) =====
   Tab sendiri di menu Aktivitas (setara Matriks di Dashboard CM), dengan:
   - pilihan sumbu (Unit Pengusul / Program Terkait), tukar sumbu, urutan kolom (terbanyak / A–Z),
   - cakupan Tahun & Triwulan, Cari aktivitas sumber,
   - ringkasan insight (kombinasi, kolom, kategori teratas),
   - heatmap 5 tingkat + legenda, total baris/kolom, header & kolom pertama lengket,
   - sorot baris+kolom saat kursor di sel, klik sel/total → daftar aktivitas sumber (klik → detail),
   - unduh Excel matriks.
   Data: actRows() (aktivitas yang boleh dilihat pengguna). State: S.ui.amx = {dim,tr,sort,y,tw,q}. */
(function(){
'use strict';
if(window.pAktMatriksV2)return;
const LV=[[1,2,'#EAF1FB','#123A6B'],[3,5,'#CFE0F5','#123A6B'],[6,10,'#9DBCE6','#0B2447'],[11,20,'#4C7BC0','#fff'],[21,1e9,'#13336B','#fff']];
const lvOf=v=>v?LV.find(l=>v>=l[0]&&v<=l[1]):null;
const NONE={unit:'(tanpa unit)',prog:'(tanpa program)'};
const DIML={unit:'Unit Pengusul',prog:'Program Terkait'};
function st(){S.ui.amx=Object.assign({dim:'unit',tr:0,sort:'tot',y:String((typeof TODAY==='string'?TODAY:new Date().toISOString()).slice(0,4)),tw:0,q:''},S.ui.amx||{});return S.ui.amx}
const kat=x=>{try{return actKatOf(x)}catch(e){return x.kat||'Lainnya'}};
const nm=x=>{try{return actName(x)}catch(e){return x.nama||'(tanpa judul)'}};
const colKey=(x,d)=>String(d==='unit'?(x.unitP||''):(x.program||'')).trim()||NONE[d];
const twOf=s=>{const m=+String(s||'').slice(5,7);return m?Math.ceil(m/3):0};
function base(){const o=st();let R=[];try{R=actRows()}catch(e){}
 return R.filter(x=>(o.y==='all'||String(x.tgl||'').slice(0,4)===o.y)&&(!+o.tw||twOf(x.tgl)===+o.tw));}
function data(){const o=st(),q=String(o.q||'').trim().toLowerCase();
 const rows=base().filter(x=>!q||[nm(x),x.unitP,x.program,x.lokasi,kat(x),[].concat(x.pic||[]).join(' ')].join(' ').toLowerCase().includes(q));
 const rk=x=>o.tr?colKey(x,o.dim):kat(x),ck=x=>o.tr?kat(x):colKey(x,o.dim);
 const g={},rt={},ct={};rows.forEach(x=>{const r=rk(x),c=ck(x);g[r]=g[r]||{};g[r][c]=(g[r][c]||[]).concat(x);rt[r]=(rt[r]||0)+1;ct[c]=(ct[c]||0)+1});
 const by=T=>(a,b)=>o.sort==='az'?a.localeCompare(b,'id'):(T[b]-T[a])||a.localeCompare(b,'id');
 const R=Object.keys(rt).sort(o.tr?by(rt):(a,b)=>a.localeCompare(b,'id')),C=Object.keys(ct).sort(by(ct));
 return {o,rows,g,rt,ct,R,C,rk,ck}}
function insight(d){if(!d.rows.length)return '';let top=null;d.R.forEach(r=>d.C.forEach(c=>{const n=(d.g[r][c]||[]).length;if(n&&(!top||n>top.n))top={r,c,n}}));
 const N=d.rows.length,cT=d.C[0],rT=Object.keys(d.rt).sort((a,b)=>d.rt[b]-d.rt[a])[0],pc=v=>Math.round(v/N*100)+'%';
 const L1=d.o.tr?DIML[d.o.dim]:'Kategori',L2=d.o.tr?'Kategori':DIML[d.o.dim];
 const card=(ic,lab,val,sub,attr)=>'<button type="button" class="amx-in" '+attr+'><span class="amx-in-i" aria-hidden="true">'+ic+'</span><span><small>'+lab+'</small><b>'+esc(val)+'</b><em>'+sub+'</em></span></button>';
 return '<div class="amx-ins">'+
  card('◎','Kombinasi terbanyak',top.r+' × '+top.c,top.n+' aktivitas',`data-amx-cell="${esc(top.r)}" data-amx-col="${esc(top.c)}"`)+
  card('▥',L2+' teraktif',cT,d.ct[cT]+' aktivitas · '+pc(d.ct[cT]),`data-amx-col="${esc(cT)}"`)+
  card('▤',L1+' terbanyak',rT,d.rt[rT]+' aktivitas · '+pc(d.rt[rT]),`data-amx-cell="${esc(rT)}"`)+
  '<div class="amx-in amx-in-n"><span class="amx-in-i" aria-hidden="true">Σ</span><span><small>Aktivitas dalam matriks</small><b>'+N+'</b><em>'+d.R.length+' '+L1.toLowerCase()+' · '+d.C.length+' '+L2.toLowerCase()+'</em></span></div></div>'}
function table(d){const o=d.o,L1=o.tr?DIML[o.dim]:'Kategori',L2=o.tr?'Kategori':DIML[o.dim],N=d.rows.length;
 const cell=(r,c,i,j)=>{const L=(d.g[r]||{})[c]||[],v=L.length,l=lvOf(v);return '<td class="amx-v'+(v?'':' amx-0')+'" data-i="'+i+'" data-j="'+j+'"'+(l?' style="--bg:'+l[2]+';--fg:'+l[3]+'"':'')+'>'+(v?'<button type="button" data-amx-cell="'+esc(r)+'" data-amx-col="'+esc(c)+'" title="'+esc(r+' × '+c+': '+v+' aktivitas — klik untuk melihat')+'">'+v+'</button>':'')+'</td>'};
 const mx=Math.max(1,...d.R.map(r=>d.rt[r]));
 return '<div class="amx-wrap" tabindex="0" aria-label="Matriks '+esc(L1)+' terhadap '+esc(L2)+'"><table class="amx"><thead><tr><th class="amx-corner" scope="col"><span>'+esc(L1)+'</span><i>'+esc(L2)+' →</i></th>'+
  d.C.map((c,j)=>'<th scope="col" data-j="'+j+'" title="'+esc(c)+'"><button type="button" data-amx-col="'+esc(c)+'">'+esc(c)+'</button></th>').join('')+'<th class="amx-tc" scope="col">Total</th></tr></thead><tbody>'+
  d.R.map((r,i)=>'<tr><th scope="row" class="amx-rh" data-i="'+i+'"><button type="button" data-amx-cell="'+esc(r)+'">'+esc(r)+'</button></th>'+d.C.map((c,j)=>cell(r,c,i,j)).join('')+
   '<td class="amx-tc"><button type="button" data-amx-cell="'+esc(r)+'" title="Semua aktivitas '+esc(r)+'"><span class="amx-bar"><i style="width:'+(d.rt[r]/mx*100).toFixed(1)+'%"></i></span><b>'+d.rt[r]+'</b></button></td></tr>').join('')+
  '</tbody><tfoot><tr><th scope="row" class="amx-rh">Total</th>'+d.C.map((c,j)=>'<td class="amx-tc" data-j="'+j+'"><button type="button" data-amx-col="'+esc(c)+'">'+d.ct[c]+'</button></td>').join('')+'<td class="amx-tc amx-gt"><b>'+N+'</b></td></tr></tfoot></table></div>'}
window.pAktMatriksV2=function(){const d=data(),o=d.o;let years=[];try{years=[...new Set(actRows().map(x=>String(x.tgl||'').slice(0,4)).filter(y=>/^\d{4}$/.test(y)))].sort().reverse()}catch(e){}
 if(o.y!=='all'&&years.length&&!years.includes(o.y))years.unshift(o.y);
 const seg=(k,v,l)=>'<button type="button" data-amx-set="'+k+'" data-v="'+v+'" class="'+(String(o[k])===String(v)?'on':'')+'" aria-pressed="'+(String(o[k])===String(v))+'">'+l+'</button>';
 const bar='<div class="amx-bar1"><div class="amx-grp"><span class="amx-lab">Matriks</span><div class="amx-seg" role="group">'+seg('dim','unit','Unit Pengusul')+seg('dim','prog','Program Terkait')+'</div></div>'+
  '<div class="amx-grp"><span class="amx-lab">Periode</span><select class="amx-sel" data-amx-sel="y" aria-label="Tahun"><option value="all"'+(o.y==='all'?' selected':'')+'>Semua tahun</option>'+years.map(y=>'<option'+(o.y===y?' selected':'')+'>'+y+'</option>').join('')+'</select><div class="amx-seg amx-seg-s" role="group" aria-label="Triwulan">'+seg('tw',0,'Setahun')+[1,2,3,4].map(t=>seg('tw',t,'TW '+t)).join('')+'</div></div>'+
  '<div class="amx-grp amx-grp-r"><label class="amx-q"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" data-amx-q value="'+esc(o.q||'')+'" placeholder="Cari aktivitas sumber…" aria-label="Cari aktivitas sumber matriks"></label></div></div>'+
  '<div class="amx-bar2"><div class="amx-grp"><span class="amx-lab">Urutkan kolom</span><div class="amx-seg amx-seg-s" role="group">'+seg('sort','tot','Terbanyak')+seg('sort','az','A–Z')+'</div><button type="button" class="amx-btn" data-amx-swap title="Tukar baris dan kolom">⇄ Tukar sumbu</button></div>'+
  '<div class="amx-leg" aria-label="Legenda jumlah aktivitas"><span>Jumlah aktivitas</span>'+LV.map(l=>'<i style="background:'+l[2]+'"></i><em>'+(l[1]>1e8?'>'+(l[0]-1):l[0]===l[1]?l[0]:l[0]+'–'+l[1])+'</em>').join('')+'</div>'+
  '<button type="button" class="amx-btn" data-amx-xls'+(d.rows.length?'':' disabled')+'>⇩ Excel</button></div>';
 const body=d.rows.length?insight(d)+table(d)+'<p class="amx-foot">Klik angka untuk melihat daftar aktivitasnya · klik judul baris/kolom untuk semua aktivitas di baris/kolom itu.</p>':
  '<div class="amx-empty"><b>Tidak ada aktivitas</b><span>'+(o.q?'Tidak ada yang cocok dengan “'+esc(o.q)+'”.':'Belum ada aktivitas pada periode ini.')+'</span>'+(o.q||+o.tw||o.y!=='all'?'<button type="button" class="amx-btn" data-amx-reset>Atur ulang cakupan</button>':'')+'</div>';
 return AKT_HDR()+'<section class="card amx-card">'+bar+body+'</section>'};
function drill(r,c){const d=data(),o=d.o;const L=d.rows.filter(x=>(r==null||d.rk(x)===r)&&(c==null||d.ck(x)===c)).sort((a,b)=>String(b.tgl||'').localeCompare(String(a.tgl||'')));
 const t=[r,c].filter(v=>v!=null).join(' × ');
 const fd=s=>{try{return fmtD(s)}catch(e){return s||'—'}};
 const li=L.map(x=>{let s=['','c-gray'];try{s=actSt(x)}catch(e){}return '<button type="button" class="amx-li" data-amx-open="'+esc(x.id)+'"><span class="amx-li-d">'+fd(x.tgl)+'</span><span class="amx-li-b"><b>'+esc(nm(x))+'</b><small>'+esc([kat(x),x.unitP,x.program].filter(Boolean).join(' · '))+'</small></span><span class="chip '+(s[1]||'c-gray')+'">'+esc(String(s[0]||'').replace(/ ·.*/,''))+'</span></button>'}).join('');
 modal(esc(t)+' <span class="amx-mc">'+L.length+' aktivitas</span>','<div class="amx-list">'+(li||'<p class="s">Tidak ada aktivitas.</p>')+'</div>','',null,{cancel:'Tutup',size:'wide'})}
function xls(){const d=data(),o=d.o,L1=o.tr?DIML[o.dim]:'Kategori',L2=o.tr?'Kategori':DIML[o.dim];
 const A=[[L1+' \\ '+L2,...d.C,'Total']].concat(d.R.map(r=>[r,...d.C.map(c=>((d.g[r]||{})[c]||[]).length||''),d.rt[r]]),[['Total',...d.C.map(c=>d.ct[c]),d.rows.length]]);
 try{xlsxSave(A,'Matriks_Aktivitas_'+(o.y==='all'?'semua':o.y)+(+o.tw?'_TW'+o.tw:'')+'.xlsx','Matriks')}catch(e){toast('Gagal mengunduh: '+e.message)}}
const upd=fn=>{fn(st());save();render()};
document.addEventListener('click',e=>{const t=e.target;if(!t.closest)return;
 let b=t.closest('[data-amx-open]');if(b){document.querySelectorAll('.ov').forEach(o=>o.remove());try{ACT.calOpen({dataset:{id:b.dataset.amxOpen}})}catch(err){}return}
 if(!t.closest('.amx-card'))return;
 if((b=t.closest('[data-amx-set]'))){const k=b.dataset.amxSet,v=b.dataset.v;upd(o=>{o[k]=k==='tw'?+v:v});return}
 if(t.closest('[data-amx-swap]')){upd(o=>{o.tr=o.tr?0:1});return}
 if(t.closest('[data-amx-reset]')){upd(o=>{o.q='';o.tw=0;o.y='all'});return}
 if(t.closest('[data-amx-xls]')){xls();return}
 if((b=t.closest('[data-amx-cell],[data-amx-col]'))){drill(b.hasAttribute('data-amx-cell')?b.dataset.amxCell:null,b.hasAttribute('data-amx-col')?b.dataset.amxCol:null)}
},true);
document.addEventListener('change',e=>{const s=e.target.closest&&e.target.closest('[data-amx-sel]');if(s)upd(o=>{o[s.dataset.amxSel]=s.value})});
let tm=0;document.addEventListener('input',e=>{const q=e.target.closest&&e.target.closest('[data-amx-q]');if(!q)return;e.stopPropagation();const v=q.value,pos=q.selectionStart;st().q=v;clearTimeout(tm);
 tm=setTimeout(()=>{save();render();const n=document.querySelector('[data-amx-q]');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(_){}}},220)},true);
/* sorot baris + kolom */
document.addEventListener('mouseover',e=>{const c=e.target.closest&&e.target.closest('.amx [data-i],.amx [data-j]');const tb=e.target.closest&&e.target.closest('.amx');if(!tb)return;
 const i=c&&c.dataset.i,j=c&&c.dataset.j;if(tb.dataset.hi===i&&tb.dataset.hj===j)return;tb.dataset.hi=i||'';tb.dataset.hj=j||'';
 tb.querySelectorAll('.amx-hl').forEach(x=>x.classList.remove('amx-hl'));
 if(i)tb.querySelectorAll('[data-i="'+i+'"]').forEach(x=>x.classList.add('amx-hl'));if(j)tb.querySelectorAll('[data-j="'+j+'"]').forEach(x=>x.classList.add('amx-hl'))});
document.addEventListener('mouseout',e=>{const tb=e.target.closest&&e.target.closest('.amx');if(!tb||(e.relatedTarget&&tb.contains(e.relatedTarget)))return;tb.dataset.hi='';tb.dataset.hj='';tb.querySelectorAll('.amx-hl').forEach(x=>x.classList.remove('amx-hl'))});
})();
