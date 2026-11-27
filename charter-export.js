/* Ekspor Charter Program — PDF · Word · JPG · PPTX, mode Berwarna / Monokrom.
   - Berwarna = desain 3 slide resmi (chDeck3: Charter, Kriteria Penyelesaian, Rencana Kerja) persis seperti PPTX charter.
     Bila ada isian yang diringkas desain slide ("…"), isian lengkapnya ditambahkan sebagai halaman Lampiran (16:9)
     agar tidak ada informasi yang hilang. Word berwarna memakai tabel Word berwarna (dapat diedit).
   - Monokrom = format "Charter Plain RKMK" (A4 lanskap): (1) Charter Program, (2) Kriteria Penyelesaian, (3) Rencana Kerja.
   Aturan:
   - Font isi 9 pt (judul bagian 11 pt). Tidak ada pemotongan teks/"…": isian yang panjang dilanjutkan ke halaman berikut
     (baris dipecah per butir, kepala tabel diulang).
   - Pratinjau, PDF, JPG, dan PPTX memakai halaman hasil paginasi yang sama (A4 lanskap). Word memakai tabel Word asli
     dengan isi dan urutan yang sama; pemenggalan halaman diatur Word.
   - Mode tersimpan di S.ui.chxMode ('color' | 'mono') dan berlaku untuk semua tempat ekspor charter. */
(function(){
'use strict';
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const T=v=>String(v==null?'':v).replace(/\r/g,'').trim();
const strip=s=>T(s).replace(/^\s*(?:[•▪●◦▸\-–]|\d+[.)])\s*/,'').trim();
const list=v=>(Array.isArray(v)?v:T(v).split('\n')).flatMap(x=>Array.isArray(x)?x:String(x==null?'':x).split('\n')).map(strip).filter(Boolean);
const PX=96,PW=1123,PH=794,MG=38; // A4 lanskap @96dpi; margin ±10 mm
const QN=['TWI','TWII','TWIII','TWIV'];

/* ---------- MODEL ---------- */
function yearsOf(c){const a=+c.p1||+c.tahun||new Date().getFullYear(),b=Math.max(a,+c.p2||a);const y=[];for(let i=a;i<=b&&y.length<10;i++)y.push(i);return y}
function pjText(u,pd){return [u?'Utama: '+u:'',pd?'Pendukung: '+pd:''].filter(Boolean).join('\n')}
/* ---------- RINGKASAN (tampilan export) ----------
   Isian asli charter tidak diubah (dipakai RKMK). Mode "Ringkas" memakai p.psCharterSum bila sudah disunting,
   selain itu ringkasan otomatis berbasis aturan (tanpa AI; data tidak keluar aplikasi). */
const SUMF=[['tujuan','Tujuan Program'],['lb','Latar Belakang'],['tb','Terobosan'],['out','Output'],['oc','Outcome'],['ris','Risiko'],['pk','Pendukung Kesuksesan'],['ms','Key Milestones']];
const CHARTER_AI_URL='https://mt-assistant.ristya-onlineshop.workers.dev/summarize';
let charterAiBusy=false;
async function requestCharterAI(fields,max,title){
 const auth=typeof firebase!=='undefined'&&firebase.auth?firebase.auth():null;
 const u=auth&&auth.currentUser;
 if(!u||u.isAnonymous||typeof u.getIdToken!=='function')throw Error('Login Firebase terlebih dahulu menggunakan akun Kemenkeu.');
 const token=await u.getIdToken();
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
 try{
  let res;
  try{res=await fetch(CHARTER_AI_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({fields,max,title}),signal:controller.signal})}
  catch(e){throw Error(e.name==='AbortError'?'Permintaan AI melebihi batas waktu.':'Worker AI tidak terhubung. Periksa internet atau gunakan ringkasan otomatis.')}
  let data;try{data=await res.json()}catch(_){throw Error('Respons Worker belum sesuai. Hubungi superadmin (HTTP '+res.status+').')}
  if(!res.ok||data.status!=='success')throw Error((data.error||'Layanan AI belum siap (HTTP '+res.status+').')+(data.code?' ['+data.code+']':''));
  const out=data.summary;
  if(!out||SUMF.some(([k])=>!Array.isArray(out[k])||out[k].some(v=>typeof v!=='string'||!v.trim()||/[\r\n]/.test(v))||(!fields[k].length&&out[k].length)||(fields[k].length&&!out[k].length)||(k!=='ms'&&out[k].length>max)))throw Error('Format ringkasan AI tidak sesuai. Draf tidak diubah.');
  return out;
 }finally{clearTimeout(timer)}
}
const SUM_MAX_WORDS=14,CUT=/\s(?:melalui|dengan|sehingga|agar|guna|termasuk|yang mencakup|antara lain|serta)\s/i,TAILW=/\s(?:dan|atau|serta|yang|di|ke|dari|untuk|dengan|pada|dalam|oleh|melalui|agar|serta|para)$/i;
function sumItem(t,max){max=max||SUM_MAX_WORDS;let x=strip(t).replace(/\s+/g,' ').trim();if(!x)return '';
 const lab=x.match(/^([^:]{6,80}):\s+(.+)$/);if(lab){const ws=lab[1].split(' ').filter(w=>!/^(dan|atau|di|ke|dari|untuk|serta|yang|&)$/i.test(w)),cap=ws.filter(w=>/^[A-Z0-9]/.test(w)).length;
  /* "Judul Bertitel: uraian" → pakai judulnya; "frasa biasa: uraian" → pakai uraian setelah titik dua. */
  x=ws.length>=2&&cap/ws.length>=.6?lab[1]:(lab[1].split(' ').length<=4?lab[1]+' '+lab[2]:x)}
 x=x.replace(/\s*\([^)]*\)/g,'').replace(/\s*\[[^\]]*\]/g,'').trim();
 x=x.split(/(?<=[.!?])\s+(?=[A-Z])/)[0];
 const semi=x.split(/;\s*/);if(semi[0].split(' ').length>=4)x=semi[0];
 const m=x.match(CUT);if(m&&x.slice(0,m.index).split(' ').length>=4)x=x.slice(0,m.index);
 let w=x.split(' ');if(w.length>max){w=w.slice(0,max);x=w.join(' ')}
 while(TAILW.test(x))x=x.replace(TAILW,'');
 return x.replace(/[,;:–\-\s]+$/,'').replace(/\.$/,'').trim();
}
function sumList(L,maxItems){const seen=new Set(),out=[];list(L).forEach(t=>{const v=sumItem(t);const k=v.toLowerCase();if(v&&!seen.has(k)){seen.add(k);out.push(v)}});return out.slice(0,Math.max(1,+maxItems||6))}
/* Milestone ditulis "tahun | teks" per baris; ringkas = teks dipendekkan, maks. ½ batas butir per tahun. */
const msLines=c=>(c.ms||[]).filter(m=>T(m.t)).slice().sort((a,b)=>+a.y-+b.y).map(m=>(+m.y||'')+' | '+T(m.t));
const msParse=L=>[].concat(L||[]).map(x=>{const m=String(x).match(/^\s*(\d{4})\s*[|:–-]\s*(.+)$/);return m?{y:+m[1],t:m[2].trim()}:null}).filter(Boolean);
function msSum(c,maxItems){const per=Math.max(1,Math.ceil((+maxItems||6)/2)),by={};(c.ms||[]).filter(m=>T(m.t)).forEach(m=>{(by[+m.y]=by[+m.y]||[]).push(m.t)});
 return Object.keys(by).sort().flatMap(y=>sumList(by[y],per).map(t=>y+' | '+t))}
/* Butir bernomor «1. teks» (nomor dibuang saat disimpan); Tujuan versi lama «A; B» dipecah per butir. */
const numL=L=>L.map((t,i)=>(i+1)+'. '+t).join('\n');
const tujL=v=>{const x=T(Array.isArray(v)?v.join('\n'):v);return (/\n/.test(x)?x.split('\n'):x.split(/;\s+/)).map(strip).filter(Boolean)};
function autoSum(c,maxItems){const o={};SUMF.forEach(([k])=>{if(k==='ms'){o.ms=msSum(c,maxItems);return}if(k==='tujuan'){const L=list(c.tujuan);o.tujuan=L.length>1?sumList(L,maxItems).join('\n'):sumItem(c.tujuan,28)}else o[k]=sumList(k==='tb'?String(c.tb||'').split('\n'):c[k],maxItems)});return o}
let FORCE_BRIEF=false;
const brief=()=>{if(FORCE_BRIEF)return true;try{return S.ui.chxBrief==='brief'}catch(_){return false}};
function sumOf(c,p){const sv=(p&&p.psCharterSum)||{},a=autoSum(c||{},sv.max||6),o={};SUMF.forEach(([k])=>{const v=sv[k];o[k]=(Array.isArray(v)?v.filter(Boolean).length:String(v||'').trim())?v:a[k]});o.max=sv.max||6;return o}
function briefC(c,p){if(!brief()||!c)return c;const o=sumOf(c,p),x=Object.assign({},c);SUMF.forEach(([k])=>{x[k]=k==='tb'?[].concat(o.tb).join('\n'):k==='tujuan'?tujL(o.tujuan).join('\n'):k==='ms'?msParse(o.ms):[].concat(o[k])});
 /* Rencana kerja & kriteria: teks dipendekkan (baris tetap utuh). */
 x.rk=(c.rk||[]).map(r=>Object.assign({},r,{t:sumItem(r.t,12)||r.t}));x.kp=(c.kp||[]).map(k=>Object.assign({},k,{k:list(k.k).map(t=>sumItem(t,22)||t)}));return x}
function model(c,p){
 c=c||{};p=p||{};c=briefC(c,p);
 const judul=T(c.judul)||T(p.nama)||'—',yrs=yearsOf(c),num=L=>L.map((t,i)=>({n:i+1,txt:t}));
 const ms=[];yrs.forEach(y=>{const L=(c.ms||[]).filter(m=>+m.y===y&&T(m.t)).map(m=>T(m.t));if(L.length){ms.push({h:String(y)});L.forEach((t,i)=>ms.push({n:i+1,txt:t}))}});
 (c.ms||[]).filter(m=>T(m.t)&&!yrs.includes(+m.y)).forEach((m,i)=>{if(!i)ms.push({h:'Lainnya'});ms.push({n:i+1,txt:T(m.t)})});
 const owners=list(c.ow);
 const unit=[{kv:['Initiative Champion',T(c.ch)||'—']},{kv:['Initiative Owner','']}].concat(owners.length?owners.map(o=>({txt:o})):[{txt:'—'}]);
 const charter=[
  {t:'kv',label:'Tujuan Program',text:T(c.tujuan)||'—',num:brief()},
  {t:'head',cols:[['Latar Belakang',1],['Terobosan',1],['Output',1],['Outcome',1]]},
  {t:'row',cols:[[num(list(c.lb)),1],[num(list(c.tb)),1],[num(list(c.out)),1],[num(list(c.oc)),1]]},
  {t:'head',cols:[['Pendukung Kesuksesan',1],['Periode',1],['Risiko',2]]},
  {t:'row',cols:[[num(list(c.pk)),1],[[{txt:yrs[0]+(yrs.length>1?' s.d. '+yrs[yrs.length-1]:'')}],1],[num(list(c.ris)),2]]},
  {t:'head',cols:[['Key Milestones',2],['Unit Pengelola',2]]},
  {t:'row',cols:[[ms,2],[unit,2]]}
 ];
 const kpRows=(c.kp||[]).filter(k=>T(k.m)||list(k.k).length).map((k,i)=>{const K=list(k.k);return {t:'row',grid:'kp',cols:[[[{n:i+1,txt:T(k.m)||'—'}],1],[K.length>1?num(K):K.length?[{txt:K[0]}]:[{txt:'—'}],1]]}});
 const kriteria=[{t:'head',grid:'kp',cols:[['Milestones (Level 4)',1],['Kriteria Penyelesaian',1]]}].concat(kpRows.length?kpRows:[{t:'row',grid:'kp',cols:[[[{txt:'Belum diisi'}],1],[[{txt:'—'}],1]]}]);
 const a0=yrs[0]*12,qn=yrs.length*4;
 const qOf=ym=>{const m=String(ym||'').match(/^(\d{4})-(\d{2})/);return m?((+m[1])*12+(+m[2])-1-a0)/3|0:null};
 const pjDef=pjText(p.uic,p.pend);
 let rk=(c.rk||[]).filter(r=>T(r.t)).map(r=>{const s=qOf(r.s),e=qOf(r.e);return {txt:T(r.t),q:[s,e],pj:pjText(T(r.u),T(r.pd))||pjDef}});
 if(!rk.length)rk=(c.ms||[]).filter(m=>T(m.t)&&yrs.includes(+m.y)).sort((a,b)=>+a.y-+b.y).map(m=>{const i=yrs.indexOf(+m.y);return {txt:T(m.t),q:[i*4,i*4+3],pj:pjDef}});
 const rkRows=rk.map((r,i)=>{const on=[];for(let q=0;q<qn;q++)on.push(r.q[0]!=null&&r.q[1]!=null&&q>=Math.max(0,r.q[0])&&q<=Math.min(qn-1,r.q[1]));return {t:'rk',n:i+1,txt:r.txt,on,pj:r.pj}});
 const rencana=[{t:'rkhead',yrs}].concat(rkRows.length?rkRows:[{t:'rk',n:'',txt:'Rencana kerja belum diisi.',on:Array(qn).fill(false),pj:''}]);
 const code=T(p.kodeResmi)||T(p.kode)||'';
 const FSM=fsMap(p);
 return {src:{c,p},fs:1,judul,code,yrs,mode:'color',file:'Charter_Program_'+((code?code+'_':'')+judul).replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,80),
  sections:[{key:'charter',fs:FSM.charter,title:'Charter Program Transformasi:',blocks:charter},{key:'kp',fs:FSM.kp,title:'Kriteria Penyelesaian Program Transformasi:',blocks:kriteria},{key:'rk',fs:FSM.rk,title:'Rencana Kerja Program Transformasi:',blocks:rencana}]};
}

/* ---------- HTML BLOK ---------- */
const GRID={charter:[25,25,25,25],kp:[35,65]};
function cols(grid){return '<colgroup>'+GRID[grid].map(w=>'<col style="width:'+w+'%">').join('')+'</colgroup>'}
function items(L){
 return (L||[]).map(it=>{
  if(it.h)return '<div class="chx-it chx-h" data-chx-t>'+E(it.h)+'</div>';
  if(it.kv)return '<div class="chx-it" data-chx-t><b>'+E(it.kv[0])+':</b>'+(it.kv[1]?' '+E(it.kv[1]):'')+'</div>';
  return it.n!=null&&it.n!==''?'<div class="chx-it chx-n" data-chx-t data-n="'+E(it.n)+'"><span class="chx-no">'+E(it.n)+'.</span><span class="chx-tx">'+E(it.txt)+'</span></div>':'<div class="chx-it" data-chx-t>'+E(it.txt)+'</div>';
 }).join('');
}
/* Tujuan (mode Ringkas) berisi beberapa butir → daftar bernomor 1., 2., … */
function kvNum(b){if(!b.num)return null;const L=tujL(b.text);return L.length>1?L.map((t,i)=>({n:i+1,txt:t})):null}
function block(b){
 const g=b.grid||'charter';
 if(b.t==='kv')return '<table class="chx-tb chx-kv" data-chx-block><colgroup><col style="width:25%"><col style="width:75%"></colgroup><tr><th class="chx-lab" data-chx-r><div data-chx-t>'+E(b.label)+'</div></th><td data-chx-r>'+(kvNum(b)?items(kvNum(b)):String(b.text).split('\n').map(x=>x.trim()).filter(Boolean).map(x=>'<div class="chx-it" data-chx-t>'+E(x)+'</div>').join(''))+'</td></tr></table>';
 if(b.t==='head')return '<table class="chx-tb chx-head" data-chx-block>'+cols(g)+'<tr>'+b.cols.map(([t,s])=>'<th colspan="'+s+'" data-chx-r><div data-chx-t>'+E(t)+'</div></th>').join('')+'</tr></table>';
 if(b.t==='row')return '<table class="chx-tb chx-row" data-chx-block>'+cols(g)+'<tr>'+b.cols.map(([L,s])=>'<td colspan="'+s+'" data-chx-r data-chx-cell>'+items(L)+'</td>').join('')+'</tr></table>';
 if(b.t==='rkhead'){const qn=b.yrs.length*4,w=(56/qn).toFixed(3);
  return '<table class="chx-tb chx-head chx-rk" data-chx-block><colgroup><col style="width:24%">'+Array(qn).fill('<col style="width:'+w+'%">').join('')+'<col style="width:20%"></colgroup>'+
  '<tr><th rowspan="2" data-chx-r><div data-chx-t>Tindakan</div></th>'+b.yrs.map(y=>'<th colspan="4" data-chx-r><div data-chx-t>'+y+'</div></th>').join('')+'<th rowspan="2" data-chx-r><div data-chx-t>Penanggung Jawab</div></th></tr>'+
  '<tr>'+b.yrs.map(()=>QN.map(q=>'<th class="chx-q" data-chx-r><div data-chx-t>'+q+'</div></th>').join('')).join('')+'</tr></table>'}
 if(b.t==='rk'){const qn=b.on.length,w=(56/qn).toFixed(3);
  return '<table class="chx-tb chx-row chx-rk" data-chx-block><colgroup><col style="width:24%">'+Array(qn).fill('<col style="width:'+w+'%">').join('')+'<col style="width:20%"></colgroup><tr>'+
  '<td data-chx-r>'+(b.n!==''?'<div class="chx-it chx-n" data-chx-t><span class="chx-no">'+b.n+'.</span><span class="chx-tx">'+E(b.txt)+'</span></div>':'<div class="chx-it" data-chx-t>'+E(b.txt)+'</div>')+'</td>'+
  b.on.map(on=>'<td class="'+(on?'chx-on':'')+'" data-chx-r></td>').join('')+'<td data-chx-r>'+T(b.pj).split('\n').filter(Boolean).map(x=>'<div class="chx-it" data-chx-t>'+E(x)+'</div>').join('')+'</td></tr></table>'}
 return '';
}

/* ---------- PAGINASI ---------- */
function pageShell(m,sec,cont){
 const pg=document.createElement('div');pg.className='chx-page chx-'+m.mode+(m.lamp?' chx-lamp':'');
 if(m.pw){pg.style.width=m.pw+'px';pg.style.height=m.ph+'px'}
 pg.style.setProperty('--chxk',String(sec.fs||m.fs||1));pg.dataset.chxSec=sec.key||'';
 pg.innerHTML='<div class="chx-band" data-chx-r></div><div class="chx-kmk" data-chx-t>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</div>'+
  '<div class="chx-title" data-chx-t><b>'+E(sec.title)+'</b> '+E(m.judul)+(cont?' <i>(lanjutan)</i>':'')+'</div><div class="chx-body"></div>'+
  '<div class="chx-foot" data-chx-line><span data-chx-t>'+(m.code?E(m.code)+' · ':'')+E(m.judul)+'</span><span class="chx-pno" data-chx-t></span></div>';
 return pg;
}
function splitAt(el,b,room){
 /* jumlah butir per kolom yang muat dalam room px (diukur dari atas blok). */
 const top=el.getBoundingClientRect().top,cells=[...el.querySelectorAll('[data-chx-cell]')];
 return cells.map(td=>{const pad=parseFloat(getComputedStyle(td).paddingBottom)||0;let n=0;
  [...td.querySelectorAll(':scope>.chx-it')].forEach((it,i)=>{if(it.getBoundingClientRect().bottom-top+pad<=room&&n===i)n=i+1});
  /* judul tahun tidak boleh tertinggal sendirian di akhir halaman */
  const L=b.cols[cells.indexOf(td)][0];while(n>0&&n<L.length&&L[n-1]&&L[n-1].h)n--;return n});
}
function paginate(m,host,keep){
 if(!keep)host.innerHTML='';const pages=[];
 m.sections.forEach(sec=>{
  let pg,body,room,lastHead=null;
  const fresh=cont=>{pg=pageShell(m,sec,cont);host.appendChild(pg);pages.push(pg);body=pg.querySelector('.chx-body');room=body.clientHeight};
  const add=b=>{const w=document.createElement('div');w.innerHTML=block(b);const el=w.firstElementChild;body.appendChild(el);return el};
  const used=()=>{const r=body.getBoundingClientRect(),l=body.lastElementChild;return l?l.getBoundingClientRect().bottom-r.top:0};
  fresh(false);
  const queue=sec.blocks.slice();let guard=0;
  while(queue.length&&guard++<2000){
   const b=queue.shift();
   if(b.t==='head'||b.t==='rkhead')lastHead=b;
   const el=add(b);
   if(used()<=room+0.5)continue;
   const bodyTop=body.getBoundingClientRect().top,elTop=el.getBoundingClientRect().top-bodyTop,onlyHead=el.previousElementSibling&&el.previousElementSibling===body.firstElementChild&&(lastHead&&b!==lastHead);
   const isFresh=!el.previousElementSibling||onlyHead&&body.children.length<=2;
   if(b.t==='row'){
    const counts=splitAt(el,b,room-elTop),any=counts.some(n=>n>0),all=counts.every((n,i)=>n>=b.cols[i][0].length);
    if(any&&!all){
     el.remove();const A={...b,cols:b.cols.map(([L,s],i)=>[L.slice(0,counts[i]),s])},R={...b,cols:b.cols.map(([L,s],i)=>[L.slice(counts[i]),s])};
     add(A);fresh(true);if(lastHead&&b.t!=='kv')add(lastHead);queue.unshift(R);continue;
    }
    if(!any&&isFresh){ /* satu butir lebih tinggi dari halaman: tetap paksa 1 butir agar tidak macet */
     el.remove();const forced=b.cols.map(([L])=>Math.min(1,L.length));const A={...b,cols:b.cols.map(([L,s],i)=>[L.slice(0,forced[i]),s])},R={...b,cols:b.cols.map(([L,s],i)=>[L.slice(forced[i]),s])};
     add(A);if(R.cols.some(([L])=>L.length)){fresh(true);if(lastHead)add(lastHead);queue.unshift(R)}continue;
    }
   }
   if(isFresh)continue; // blok tak terpecah lebih tinggi dari halaman: biarkan
   el.remove();
   /* kepala tabel ikut pindah bila tertinggal sendirian di dasar halaman */
   const prev=body.lastElementChild;if(prev&&prev.classList.contains('chx-head')&&b.t!=='head'&&b.t!=='rkhead')prev.remove();
   fresh(true);
   if(lastHead&&b!==lastHead)add(lastHead);
   queue.unshift(b);
  }
 });
 pages.forEach((pg,i)=>{pg.querySelector('.chx-pno').textContent=(m.lamp?'Lampiran ':'Halaman ')+(i+1)+' / '+pages.length;pg.dataset.chxFile=m.file});
 return pages;
}

/* ---------- STATE & LIB ---------- */
const mode=()=>{try{return S.ui.chxMode==='mono'?'mono':'color'}catch(_){return 'color'}};
/* Ukuran font per program: skala 70–130% (100% = 9 pt monokrom; isi slide berwarna 12–15 pt). Disimpan di program.psCharterFs. */
const FS_MIN=.7,FS_MAX=1.3,FS_STEP=.05;
const SECS=['charter','kp','rk'],SEC_LBL={charter:'Charter',kp:'Kriteria Penyelesaian',rk:'Rencana Kerja'};
const clampFs=v=>{v=+v;return v>=FS_MIN-.001&&v<=FS_MAX+.001?Math.round(v*100)/100:1};
/* psCharterFs: angka (semua halaman) atau {charter,kp,rk} (per halaman/slide). */
const fsMap=p=>{const v=p&&p.psCharterFs,o={};SECS.forEach(k=>{o[k]=v&&typeof v==='object'?clampFs(v[k]==null?1:v[k]):clampFs(v==null?1:v)});return o};
const fsOf=(p,sec)=>{const o=fsMap(p);return sec?o[sec]:(SECS.every(k=>o[k]===o.charter)?o.charter:null)};
const fsLbl=k=>k==null?'Beragam':Math.round(k*100)+'%';
function fsCtl(pid,k,sec){const lo=k!=null&&k<=FS_MIN+.001,hi=k!=null&&k>=FS_MAX-.001;
 return '<span class="chx-fs" role="group" aria-label="Ukuran font '+(sec?'halaman '+SEC_LBL[sec]:'semua halaman')+'"'+(pid?' data-chx-fs-pid="'+E(pid)+'"':'')+(sec?' data-chx-fs-sec="'+sec+'"':'')+' title="'+(sec?'Ukuran font halaman '+SEC_LBL[sec]+' (termasuk halaman lanjutan & lampirannya)':'Ukuran font semua halaman charter program ini (100% = 9 pt monokrom). Atur per halaman lewat kontrol di pojok tiap halaman pratinjau.')+'">'+(sec?'<small>Font</small>':'')+'<button type="button" data-chx-fs="-1" aria-label="Perkecil font"'+(lo?' disabled':'')+'>A−</button><b data-chx-fs-v>'+fsLbl(k)+'</b><button type="button" data-chx-fs="1" aria-label="Perbesar font"'+(hi?' disabled':'')+'>A+</button></span>'}
function setFs(pid,dir,sec){const p=(S.programs||[]).find(x=>String(x.id)===String(pid));if(!p)return;
 const o=fsMap(p),st=v=>Math.min(FS_MAX,Math.max(FS_MIN,Math.round((v+dir*FS_STEP)*100)/100));
 if(sec)o[sec]=st(o[sec]);else{const v=st(o.charter);SECS.forEach(k=>o[k]=v)}
 const same=SECS.every(k=>o[k]===o.charter);if(same&&o.charter===1)delete p.psCharterFs;else p.psCharterFs=same?o.charter:o;
 try{if(typeof save==='function')save()}catch(_){}
 document.querySelectorAll('[data-chx-fs-pid]').forEach(g=>{if(String(g.dataset.chxFsPid)!==String(pid))return;const k=fsOf(p,g.dataset.chxFsSec||'');g.querySelector('[data-chx-fs-v]').textContent=fsLbl(k);g.querySelector('[data-chx-fs="-1"]').disabled=k!=null&&k<=FS_MIN+.001;g.querySelector('[data-chx-fs="1"]').disabled=k!=null&&k>=FS_MAX-.001});
 document.querySelectorAll('[data-chx-preview][data-chx-mounted]').forEach(x=>{try{const r=resolve(x);if(r&&r.p&&String(r.p.id)===String(pid)&&x.__chxRender){const y=window.scrollY;x.__chxRender();window.scrollTo(0,y)}}catch(_){}})}
function setBrief(v){try{S.ui.chxBrief=v==='brief'?'brief':'full';if(typeof save==='function')save()}catch(_){}
 document.querySelectorAll('[data-chx-brief]').forEach(b=>{const on=b.dataset.chxBrief===(brief()?'brief':'full');b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
 document.querySelectorAll('[data-chx-preview]').forEach(x=>x.__chxRender&&x.__chxRender())}
function setMode(v){try{S.ui.chxMode=v==='mono'?'mono':'color';if(typeof save==='function')save()}catch(_){}
 document.querySelectorAll('[data-chx-mode]').forEach(b=>{const on=b.dataset.chxMode===mode();b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
 document.querySelectorAll('[data-chx-preview]').forEach(x=>x.__chxRender&&x.__chxRender());}
function lib(url,ok){return new Promise((res,rej)=>{if(ok())return res();const s=document.createElement('script');s.src=url;s.onload=()=>ok()?res():rej(Error('Pustaka gagal dimuat'));s.onerror=()=>rej(Error('Pustaka gagal dimuat. Periksa koneksi internet.'));document.head.appendChild(s)})}
const libs={
 h2c:()=>lib('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',()=>!!window.html2canvas),
 pdf:()=>lib('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',()=>!!window.jspdf),
 ppt:()=>lib('https://cdnjs.cloudflare.com/ajax/libs/pptxgenjs/3.12.0/pptxgen.bundle.js',()=>!!window.PptxGenJS).catch(()=>lib('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js',()=>!!window.PptxGenJS)),
 zip:()=>lib('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!window.JSZip)
};
function saveBlob(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),15000)}
const say=m=>{try{toast(m)}catch(_){}};

/* Halaman lepas-layar (skala 1:1) untuk ekspor. */
function offscreen(m){
 const host=document.createElement('div');host.className='chx-off';host.setAttribute('aria-hidden','true');
 document.body.appendChild(host);const pages=(m.all||[m]).flatMap(x=>{x.mode=m.mode;return pagesFor(x,host)});return {host,pages,done:()=>host.remove()};
}
/* Berwarna: 3 slide resmi (chDeck3) + Lampiran bila ada isian yang diringkas. */
/* Berwarna: 3 slide resmi (chDeck3). Isian yang tidak muat TIDAK diringkas ke Lampiran:
   dibuat slide lanjutan dengan kotak yang sama (seperti halaman lanjutan monokrom). */
const ELL=/…/;
const txtOf=e=>e&&e.t==='t'?(Array.isArray(e.txt)?e.txt.join(' '):String(e.txt)):'';
const BOX1=[['Latar Belakang','lb'],['Terobosan','tb'],['Output','out'],['Outcome','oc'],['Key Milestones','ms'],['Risiko','ris'],['Pendukung Kesuksesan','pk'],['UNIT PENGELOLA','']];
function clipped1(sl){const E=sl.E,idx=BOX1.map(([t])=>E.findIndex(e=>txtOf(e)===t)),out=new Set();
 BOX1.forEach(([t,f],i)=>{if(!f||idx[i]<0)return;const end=idx.slice(i+1).find(x=>x>idx[i])??E.length;for(let k=idx[i]+1;k<end;k++){if(ELL.test(txtOf(E[k]))){out.add(f);break}}});return out}
const clippedAny=sl=>{const i=sl.E.findIndex(e=>txtOf(e)==='MILESTONES (LEVEL 4)');return sl.E.slice(i<0?0:i).some(e=>ELL.test(txtOf(e)))};
function deckFor(src){
 if(!src||!src.c||typeof chDeck3!=='function'||typeof dkHtml!=='function')return null;
 const p=src.p||{},c=Object.assign({},briefC(src.c,src.p)),y=+c.tahun||+p.psYear||+(S.ui&&S.ui.psSelectedYear)||new Date().getFullYear();
 c.tahun=y;c.ver=c.ver||1;c.prog=c.prog||p.akr;c.p1=+c.p1||y;c.p2=Math.max(+c.p1,+c.p2||+c.p1);c.judul=c.judul||p.nama||'';
 ['lb','out','oc','ris','pk','ow'].forEach(k=>{if(!Array.isArray(c[k]))c[k]=list(c[k])});
 ['ms','kp','rk','cs','mf'].forEach(k=>{if(!Array.isArray(c[k]))c[k]=[]});
 if(typeof c.tb!=='string')c.tb=list(c.tb).join('\n');
 if(brief()){const L=tujL(c.tujuan);if(L.length>1)c.tujuan=L.map((t,i)=>(i+1)+'. '+t).join('; ')}
 /* Rencana kerja kosong → turunkan dari Key Milestones (satu tindakan per milestone, sepanjang tahunnya). */
 let rk=c.rk.filter(r=>T(r.t));
 if(!rk.length)rk=c.ms.filter(m=>T(m.t)&&+m.y).sort((a,b)=>+a.y-+b.y).map(m=>({t:T(m.t),s:(+m.y)+'-01',e:(+m.y)+'-12',u:p.uic||'',pd:p.pend||''}));
 rk=rk.slice().sort((a,b)=>String(a.s||'').localeCompare(String(b.s||'')));
 /* Kolom Penanggung Jawab di slide berukuran tetap: bila teks UIC panjang, tampilkan lebih sedikit baris per slide. */
 const pjLen=Math.max(0,...rk.map(r=>String(r.u||'').length+String(r.pd||'').length)),MAXRK=pjLen>70?5:pjLen>45?6:8;
 const K0=window.__dkFsK,FSM=fsMap(p),pp=Object.assign({},p,{kode:p.kodeResmi||p.kode});
 const build=(cx,k)=>{window.__dkFsK=k;return chDeck3(cx,pp)};
 try{
  const slides=[];
  /* 1. Charter: kurangi butir per kotak sampai tidak ada yang terpotong; sisanya ke slide lanjutan. */
  const L0={lb:c.lb.filter(Boolean),tb:String(c.tb||'').split('\n').filter(Boolean),out:c.out.filter(Boolean),oc:c.oc.filter(Boolean),ris:c.ris.filter(Boolean),pk:c.pk.filter(Boolean),
   ms:c.ms.filter(m=>T(m.t)).map((m,i)=>[m,i]).sort((a,b)=>(+a[0].y-+b[0].y)||(a[1]-b[1])).map(x=>x[0])};
  const F=Object.keys(L0);let rem=Object.assign({},L0),guard=0;
  const cx1=(tk,cont)=>Object.assign({},c,{lb:tk.lb,tb:tk.tb.join('\n'),out:tk.out,oc:tk.oc,ris:tk.ris,pk:tk.pk,ms:tk.ms,rk:[],kp:[]});
  do{const tk={};F.forEach(f=>tk[f]=rem[f].slice());const forced=new Set();let sl=build(cx1(tk),FSM.charter).slides[0],n=0;
   for(let cl=clipped1(sl);n<80;cl=clipped1(sl),n++){const todo=[...cl].filter(f=>!forced.has(f));if(!todo.length)break;
    todo.forEach(f=>{if(tk[f].length>1)tk[f].pop();else forced.add(f)});sl=build(cx1(tk),FSM.charter).slides[0]}
   sl.__sec='charter';sl.__cont=slides.length>0;slides.push(sl);
   F.forEach(f=>rem[f]=rem[f].slice(tk[f].length));
  }while(F.some(f=>rem[f].length)&&++guard<8);
  /* 2. Kriteria penyelesaian: baris sebanyak yang muat, sisanya ke slide lanjutan (nomor berlanjut). */
  const KP=c.kp.filter(k=>T(k.m));let off=0;guard=0;
  do{let k=Math.max(1,KP.length-off);let sl=build(Object.assign({},c,{kp:KP.slice(off,off+k),__kpOff:off,rk:[]}),FSM.kp).slides[1];
   while(k>1&&clippedAny(sl)){k--;sl=build(Object.assign({},c,{kp:KP.slice(off,off+k),__kpOff:off,rk:[]}),FSM.kp).slides[1]}
   sl.__sec='kp';sl.__cont=off>0;slides.push(sl);off+=Math.max(1,Math.min(k,KP.length-off));
  }while(off<KP.length&&++guard<12);
  /* 3. Rencana kerja: MAXRK tindakan per slide, sisanya ke slide lanjutan. */
  off=0;guard=0;
  do{const sl=build(Object.assign({},c,{rk:rk.slice(off,off+MAXRK),__rkOff:off}),FSM.rk).slides[2];sl.__sec='rk';sl.__cont=off>0;slides.push(sl);off+=MAXRK}while(off<rk.length&&++guard<12);
  /* Judul "(lanjutan)", isian kosong di slide lanjutan ditulis "—", dan nomor slide n / total. */
  const tot=slides.length;slides.forEach((sl,i)=>{sl.E.forEach(e=>{const t=txtOf(e);
    if(sl.__cont&&e.s===22&&/^(Charter Program|Kriteria Penyelesaian|Rencana Kerja)$/.test(t))e.txt=t+' (lanjutan)';
    else if(sl.__cont&&t==='Belum diisi')e.txt='—';
    else if(/^\d+ \/ 3$/.test(t))e.txt=(i+1)+' / '+tot});
   sl.n=(sl.n||'')+(sl.__cont?' (lanjutan)':'')});
  return {slides,title:'Charter Program — '+c.judul,file:'Charter_Program_'+String(p.kodeResmi||p.kode||c.prog||'').replace(/[^A-Za-z0-9_-]+/g,'_')+'_'+y+'_v'+c.ver};
 }catch(e){return null}finally{window.__dkFsK=K0}
}
function pagesFor(m,host){
 if(m.mode!=='color')return paginate(m,host,true);
 const D=deckFor(m.src);if(!D)return paginate(m,host,true);
 return D.slides.map(sl=>{const w=document.createElement('div');w.className='chx-slide';w.dataset.chxSec=sl.__sec||'';w.innerHTML=dkHtml(sl);w.__deck=sl;w.dataset.chxFile=m.file;host.appendChild(w);return w});
}
const dims=pg=>[pg.offsetWidth||PW,pg.offsetHeight||PH];
async function canvases(pages,scale){await libs.h2c();if(document.fonts?.ready)await document.fonts.ready;
 const out=[];for(const pg of pages){const [w,h]=dims(pg);out.push(await html2canvas(pg,{scale:scale||2,backgroundColor:'#ffffff',useCORS:true,logging:false,width:w,height:h,windowWidth:w}))}return out}

/* ---------- EKSPOR ---------- */
async function toPdf(m){const o=offscreen(m);try{const cs=await canvases(o.pages,m.all?1.6:2);await libs.pdf();
  const sz=o.pages.map(pg=>{const [w,h]=dims(pg);return [w*.75,h*.75]});
  const doc=new jspdf.jsPDF({orientation:'landscape',unit:'pt',format:sz[0],compress:true});
  cs.forEach((cv,i)=>{if(i)doc.addPage(sz[i],'landscape');doc.addImage(cv.toDataURL('image/jpeg',.93),'JPEG',0,0,sz[i][0],sz[i][1])});doc.setProperties({title:'Charter Program — '+m.judul});
  saveBlob(doc.output('blob'),fileOf(m)+'.pdf')}finally{o.done()}}
async function toJpg(m){const o=offscreen(m);try{const cs=await canvases(o.pages,2),base=fileOf(m);
  const blobs=await Promise.all(cs.map(cv=>new Promise(r=>cv.toBlob(r,'image/jpeg',.93))));
  if(blobs.length===1)return saveBlob(blobs[0],base+'.jpg');
  await libs.zip();const z=new JSZip();const cnt={};blobs.forEach((b,i)=>{const f=m.all?o.pages[i].dataset.chxFile:base;cnt[f]=(cnt[f]||0)+1;z.file((m.all?String(m.all.findIndex(x=>x.file===f)+1).padStart(2,'0')+'_'+f:f)+'_hal'+String(cnt[f]).padStart(2,'0')+'.jpg',b)});saveBlob(await z.generateAsync({type:'blob'}),base+'_JPG.zip')}finally{o.done()}}
const hex=c=>{const m=String(c||'').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);if(!m||m[4]==='0')return null;return [m[1],m[2],m[3]].map(x=>(+x).toString(16).padStart(2,'0')).join('').toUpperCase()};
/* Slide resmi → PPTX native (sama dengan dkPptx). */
function deckSlide(ppt,sl){const s=ppt.addSlide();s.background={color:sl.bg};const F='Calibri';const ink=(window.DK&&DK.ink)||'1E2B42';
 sl.E.forEach(e=>{
  if(e.t==='r'||e.t==='e'){s.addShape(e.t==='e'?ppt.ShapeType.ellipse:(e.rad?ppt.ShapeType.roundRect:ppt.ShapeType.rect),{x:e.x,y:e.y,w:e.w,h:e.h,fill:{color:e.fill,transparency:e.tr||0},line:e.line?{color:e.line,width:e.lw||.75}:{type:'none'},rectRadius:e.rad?Math.min(e.w,e.h)*e.rad:undefined});return}
  const base={x:e.x,y:e.y,w:e.w,h:e.h,fontFace:F,fontSize:e.s,color:e.c||ink,bold:!!e.b,italic:!!e.i,align:e.a||'left',valign:e.v||'top',margin:2,charSpacing:e.sp||0,paraSpaceAfter:e.bul?3:0};
  if(Array.isArray(e.txt))s.addText(e.txt.map((t,i)=>({text:t,options:{bullet:e.bul?{indent:12}:false,breakLine:i<e.txt.length-1}})),base);else s.addText(String(e.txt),base)})}
async function toPptx(m){const o=offscreen(m);try{await libs.ppt();const ppt=new PptxGenJS();
  if(m.mode==='color')ppt.layout='LAYOUT_WIDE';else{ppt.defineLayout({name:'A4L',width:PW/PX,height:PH/PX});ppt.layout='A4L'}
  ppt.title='Charter Program — '+m.judul;ppt.author='PMO Kementerian Keuangan';const face=m.mode==='color'?'Calibri':'Bookman Old Style',inch=v=>v/PX;
  o.pages.forEach(pg=>{if(pg.__deck){deckSlide(ppt,pg.__deck);return}const s=ppt.addSlide();s.background={color:'FFFFFF'};const R=pg.getBoundingClientRect();
   pg.querySelectorAll('[data-chx-r]').forEach(el=>{const r=el.getBoundingClientRect(),cs=getComputedStyle(el),fill=hex(cs.backgroundColor),bc=hex(cs.borderTopColor),bw=parseFloat(cs.borderTopWidth)||0;
    if(!fill&&!(bc&&bw))return;s.addShape(ppt.ShapeType.rect,{x:inch(r.left-R.left),y:inch(r.top-R.top),w:inch(r.width),h:inch(r.height),fill:fill?{color:fill}:{type:'none'},line:bc&&bw?{color:bc,width:Math.max(.5,bw*.75)}:{type:'none'}})});
   pg.querySelectorAll('[data-chx-line]').forEach(el=>{const r=el.getBoundingClientRect(),c=hex(getComputedStyle(el).borderTopColor)||'C9D1E0';s.addShape(ppt.ShapeType.rect,{x:inch(r.left-R.left),y:inch(r.top-R.top),w:inch(r.width),h:inch(1),fill:{color:c},line:{type:'none'}})});
   const boxes=[];pg.querySelectorAll('[data-chx-t]').forEach(el=>{if(el.classList.contains('chx-n'))boxes.push(el.querySelector('.chx-no'),el.querySelector('.chx-tx'));else boxes.push(el)});
   boxes.forEach(el=>{const txt=el.innerText.replace(/\s+\n/g,'\n').trim();if(!txt)return;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
    const runs=[];if(false){}
    else if(el.querySelector('b')&&el.tagName!=='TH'){const b=el.querySelector('b').innerText;runs.push({text:b,options:{bold:true}});runs.push({text:txt.slice(b.length),options:{}})}
    else runs.push({text:txt,options:{}});
    s.addText(runs,{x:inch(r.left-R.left),y:inch(r.top-R.top),w:inch(r.width+2),h:inch(r.height+2),margin:0,fontFace:face,fontSize:Math.round(parseFloat(cs.fontSize)*.75*2)/2,
     color:hex(cs.color)||'000000',bold:+cs.fontWeight>=600,italic:cs.fontStyle==='italic',align:cs.textAlign==='center'?'center':cs.textAlign==='right'?'right':'left',valign:'top',fit:'none',
     paraSpaceAfter:0,lineSpacingMultiple:1,indentLevel:0,bullet:false})})});
  await ppt.writeFile({fileName:fileOf(m,o)+'.pptx'})}finally{o.done()}}
/* Nama berkas: berwarna satu program = Charter_Program_<KODE>_<tahun>_v<n> (sama dengan PPTX charter). */
function fileOf(m,o){if(m.mode==='color'&&!m.all){const D=deckFor(m.src);if(D&&D.file)return D.file}return m.file+(m.mode==='mono'?'_Monokrom':'_Berwarna')}

/* Word (.docx) — tabel Word asli. */
const X=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function docxXml(m){
 const mono=m.mode==='mono',font='Bookman Old Style',NAVY='1F2A44',GOLD='F2B705',LINE=mono?'000000':'C9D1E0';
 let K=1;const rpr=(o={})=>'<w:rPr><w:rFonts w:ascii="'+font+'" w:hAnsi="'+font+'" w:cs="'+font+'"/>'+(o.b?'<w:b/>':'')+(o.i?'<w:i/>':'')+'<w:color w:val="'+(o.c||'000000')+'"/><w:sz w:val="'+(o.sz||Math.round(18*K))+'"/><w:szCs w:val="'+(o.sz||Math.round(18*K))+'"/></w:rPr>';
 const run=(t,o)=>'<w:r>'+rpr(o)+'<w:t xml:space="preserve">'+X(t)+'</w:t></w:r>';
 const para=(runs,o={})=>'<w:p><w:pPr><w:spacing w:before="0" w:after="'+(o.after||20)+'" w:line="240" w:lineRule="auto"/>'+(o.jc?'<w:jc w:val="'+o.jc+'"/>':'')+(o.hang?'<w:ind w:left="'+o.hang+'" w:hanging="'+o.hang+'"/>':'')+(o.keep?'<w:keepNext/>':'')+(o.pb?'<w:pageBreakBefore/>':'')+'</w:pPr>'+runs+'</w:p>';
 const headC=mono?{c:'000000',b:1}:{c:'FFFFFF',b:1},headFill=mono?null:NAVY;
 const cell=(w,ps,o={})=>'<w:tc><w:tcPr><w:tcW w:w="'+w+'" w:type="dxa"/>'+(o.span>1?'<w:gridSpan w:val="'+o.span+'"/>':'')+(o.vm?'<w:vMerge'+(o.vm==='r'?' w:val="restart"':'')+'/>':'')+(o.fill?'<w:shd w:val="clear" w:color="auto" w:fill="'+o.fill+'"/>':'')+(o.vc?'<w:vAlign w:val="center"/>':'')+'</w:tcPr>'+(ps||para(''))+'</w:tc>';
 const itemsP=L=>(L&&L.length?L:[{txt:'—'}]).map(it=>it.h?para(run(it.h,{b:1,c:mono?'000000':NAVY}),{keep:1}):it.kv?para(run(it.kv[0]+':',{b:1})+(it.kv[1]?run(' '+it.kv[1]):'')):it.n!=null&&it.n!==''?para(run(it.n+'.\t'+it.txt),{hang:284}):para(run(it.txt))).join('');
 const tbl=(grid,rows)=>'<w:tbl><w:tblPr><w:tblW w:w="'+grid.reduce((a,b)=>a+b,0)+'" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(k=>'<w:'+k+' w:val="single" w:sz="'+(mono?6:4)+'" w:color="'+LINE+'"/>').join('')+'</w:tblBorders><w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>'+grid.map(w=>'<w:gridCol w:w="'+w+'"/>').join('')+'</w:tblGrid>'+rows.join('')+'</w:tbl>';
 const tr=(cells,head)=>'<w:tr>'+(head?'<w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>':'')+cells+'</w:tr>';
 const W=15704,body=[];
 (m.all||[m]).forEach((mm,mi)=>{K=mm.fs||1;mm.sections.forEach((sec,si)=>{K=sec.fs||mm.fs||1;
  body.push(para(run('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',{sz:16,c:mono?'000000':'5B6B85'}),{jc:'center',pb:si>0||mi>0,after:60}));
  body.push(para(run(sec.title+' ',{b:1,sz:22,c:mono?'000000':NAVY})+run(mm.judul,{sz:22,c:mono?'000000':NAVY}),{after:100,keep:1}));
  if(sec.key==='rk'){
   const yrs=mm.yrs,qn=yrs.length*4,tw=Math.round(W*.24),pw=Math.round(W*.20),qw=Math.floor((W-tw-pw)/qn),grid=[tw].concat(Array(qn).fill(qw)).concat([W-tw-pw-qw*qn+pw]);
   const hp=t=>para(run(t,headC),{jc:'center',after:0}),hq=t=>para(run(t,Object.assign({},headC,{sz:12})),{jc:'center',after:0});
   const rows=[tr(cell(grid[0],hp('Tindakan'),{vm:'r',fill:headFill,vc:1})+yrs.map(y=>cell(qw*4,hp(String(y)),{span:4,fill:headFill})).join('')+cell(grid[grid.length-1],hp('Penanggung Jawab'),{vm:'r',fill:headFill,vc:1}),1),
    tr(cell(grid[0],para(''),{vm:'c',fill:headFill})+yrs.map(()=>QN.map(q=>cell(qw,hq(q),{fill:headFill})).join('')).join('')+cell(grid[grid.length-1],para(''),{vm:'c',fill:headFill}),1)];
   sec.blocks.filter(b=>b.t==='rk').forEach((b,i)=>rows.push(tr(cell(grid[0],b.n!==''?para(run(b.n+'.\t'+b.txt),{hang:284}):para(run(b.txt)))+b.on.map(on=>cell(qw,para(''),{fill:on?(mono?'404040':(i%2?GOLD:NAVY)):null})).join('')+cell(grid[grid.length-1],T(b.pj).split('\n').filter(Boolean).map(x=>para(run(x))).join('')||para('')))));
   body.push(tbl(grid,rows));return;
  }
  const g=GRID[sec.key==='kp'?'kp':'charter'].map(p=>Math.round(W*p/100)),rows=[];let kvW=[Math.round(W*.25),W-Math.round(W*.25)];
  const span=(i,s)=>g.slice(i,i+s).reduce((a,b)=>a+b,0);
  sec.blocks.forEach(b=>{
   if(b.t==='kv'){rows.push(tr(cell(kvW[0],para(run(b.label,mono?{b:1}:{b:1,c:NAVY})),{fill:mono?null:GOLD})+cell(kvW[1],(kvNum(b)?itemsP(kvNum(b)):String(b.text).split('\n').map(x=>x.trim()).filter(Boolean).map(x=>para(run(x))).join(''))||para(''),{span:g.length-1})));return}
   let i=0;
   if(b.t==='head'){rows.push(tr(b.cols.map(([t,s])=>{const c=cell(span(i,s),para(run(t,headC),{jc:'center',after:0}),{span:s,fill:headFill});i+=s;return c}).join(''),sec.key==='kp'));return}
   rows.push(tr(b.cols.map(([L,s])=>{const c=cell(span(i,s),itemsP(L),{span:s});i+=s;return c}).join('')));
  });
  body.push(tbl(g,rows));
 })});
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body.join('')+
  '<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="567" w:right="567" w:bottom="567" w:left="567" w:header="284" w:footer="284" w:gutter="0"/></w:sectPr></w:body></w:document>';
}
async function docxBlob(m){await libs.zip();const z=new JSZip();
 z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
 z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 z.file('word/_rels/document.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>');
 z.file('word/document.xml',docxXml(m));
 return z.generateAsync({type:'blob',compression:'DEFLATE',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})}
async function toDocx(m){saveBlob(await docxBlob(m),m.file+(m.mode==='mono'?'_Monokrom':'_Berwarna')+'.docx')}

/* ---------- SUMBER & UI ---------- */
const sources={};
function register(key,fn){sources[key]=fn}
function resolve(el){
 const bar=el.closest('[data-chx-bar],[data-chx-preview]');if(!bar)return null;
 const scopeAll=el.closest('[data-chx-scope="all"]')&&bar.dataset.chxAll;
 const k=bar.dataset.chxSrc;if(k&&sources[k]&&!scopeAll)return sources[k]();
 if(scopeAll){const y=+bar.dataset.chxAll,pick=bar.dataset.chxSel&&S.ui&&S.ui.ps27ChSel&&Array.isArray(S.ui.ps27ChSel[y])?S.ui.ps27ChSel[y]:null;const L=(S.programs||[]).filter(p=>+p.psYear===y&&!p.arsip&&p.psListStatus!=='Arsip'&&(!pick||pick.includes(String(p.id)))).sort((a,b)=>String(a.kodeResmi||a.kode||'~').localeCompare(String(b.kodeResmi||b.kode||'~'),'id',{numeric:true})||(S.programs.indexOf(a)-S.programs.indexOf(b))).map(fromProgram).filter(Boolean);return {list:L,picked:!!pick,name:'Charter_Program_'+(pick?'Terpilih_':'Semua_')+y}}
 const id=bar.dataset.chxPid;if(id)return fromProgram((S.programs||[]).find(p=>String(p.id)===String(id)));
 return null;
}
function fromProgram(p){
 if(!p)return null;let c=null;
 try{c=window.MT_PS_DOC?.programCharterSource?.(p,+p.psYear||undefined)}catch(_){}
 c=c||p.psProgramCharter;if(!c)return null;
 return {c,p:Object.assign({},p,{kode:p.kodeResmi||p.kode})};
}
const FMT=[['pdf','PDF'],['jpg','JPG'],['docx','Word (.docx)'],['pptx','PowerPoint (.pptx)']];
/* Satu baris: chip mode (Berwarna/Monokrom) + tombol "Export to ▾" berisi format; opsional grup "Semua program". */
function bar(attrs,all,fs){
 const grp=(lab,scope)=>'<div class="chx-mg"><small>'+lab+'</small>'+FMT.map(([k,l])=>'<button type="button" role="menuitem" class="chx-mi" data-chx-x="'+k+'"'+(scope?' data-chx-scope="all"':'')+'>'+l+'</button>').join('')+'</div>';
 return '<div class="chx-bar" data-chx-bar '+(attrs||'')+'>'+
  '<span class="chx-chips" role="group" aria-label="Mode warna">'+[['color','Berwarna'],['mono','Monokrom']].map(([k,l])=>'<button type="button" class="chx-chip'+(mode()===k?' on':'')+'" data-chx-mode="'+k+'" aria-pressed="'+(mode()===k)+'">'+l+'</button>').join('')+'</span>'+
  briefChips()+(fs?'<button type="button" class="chx-sumb" data-chx-sum="'+E(fs.pid)+'" title="Atur teks ringkas untuk tampilan export (isian asli tetap utuh)">✎ Ringkasan</button>'+fsCtl(fs.pid,fs.k):'')+'<div class="chx-dd"><button type="button" class="chx-ddb" data-chx-dd aria-haspopup="menu" aria-expanded="false">Export to <span aria-hidden="true">▾</span></button>'+
  '<div class="chx-menu" role="menu" hidden>'+grp(all?'Program ini':'Charter Program','')+(all?grp('Semua program ('+all.n+')','all'):'')+'</div></div></div>';
}
function briefChips(){const b=brief()?'brief':'full';return '<span class="chx-chips chx-brief" role="group" aria-label="Isi narasi" title="Lengkap = isian asli · Ringkas = versi ringkas untuk tampilan export">'+[['full','Lengkap'],['brief','Ringkas']].map(([k,l])=>'<button type="button" class="chx-chip'+(b===k?' on':'')+'" data-chx-brief="'+k+'" aria-pressed="'+(b===k)+'">'+l+'</button>').join('')+'</span>'}
/* Dialog Ringkasan: kiri isian asli (hanya baca), kanan teks ringkas (satu butir per baris) yang bisa disunting. */
function sumDialog(pid){const P=(S.programs||[]).find(x=>String(x.id)===String(pid));const src=P&&fromProgram(P);if(!src||!src.c){say('Charter Program belum tersedia.');return}
 const c=src.c,cur=sumOf(c,P),saved=P.psCharterSum||{};document.querySelectorAll('.chx-sumov').forEach(x=>x.remove());
 const orig=k=>k==='ms'?msLines(c):k==='tujuan'?list(c.tujuan):k==='tb'?String(c.tb||'').split('\n').map(strip).filter(Boolean):list(c[k]);
 const fmt=(k,v)=>k==='ms'?[].concat(v||[]).join('\n'):k==='tujuan'?(L=>L.length>1?numL(L):L.join(''))(tujL(v)):numL([].concat(v||[]).map(strip).filter(Boolean)),val=k=>fmt(k,cur[k]);
 const words=t=>String(t||'').split(/\s+/).filter(Boolean).length;
 const ov=document.createElement('div');ov.className='chx-ov chx-sumov';
 ov.innerHTML='<section class="chx-dlg chx-sumdlg" role="dialog" aria-modal="true" aria-label="Ringkasan Charter"><header><div><b>Ringkasan untuk Tampilan Export</b><small>'+E(P.nama)+' · isian asli charter tidak berubah (tetap dipakai untuk RKMK)</small></div><button type="button" data-chx-close aria-label="Tutup">×</button></header>'+
  '<main><div class="chx-sumtop"><label>Maks. butir per isian <select data-sum-max>'+[3,4,5,6,8,10].map(n=>'<option '+(n===(+cur.max||6)?'selected':'')+'>'+n+'</option>').join('')+'</select></label><button type="button" class="btn" data-sum-auto title="Ganti semua teks ringkas dengan hasil ringkas otomatis">↻ Ringkas otomatis semua</button><button type="button" class="btn" data-sum-ai title="Buat draf ringkasan dengan Groq AI; isian asli tidak diubah">✦ Ringkas dengan AI</button><span>Satu baris = satu butir (Key Milestones: «tahun | teks»). Kosongkan kolom untuk kembali ke ringkasan otomatis.</span><span data-sum-ai-status role="status" aria-live="polite" hidden></span></div>'+
  SUMF.map(([k,l])=>{const o=orig(k);return '<div class="chx-sumrow"><div class="chx-sumorig"><b>'+E(l)+' <em>asli · '+o.length+' butir · '+words(o.join(' '))+' kata</em></b><ul>'+o.map(t=>'<li>'+E(t)+'</li>').join('')+'</ul></div>'+
   '<div class="chx-sumedit"><b>Ringkas'+((Array.isArray(saved[k])?saved[k].length:String(saved[k]||'').trim())?' <em class="ed">disunting</em>':' <em>otomatis</em>')+'<button type="button" class="lnk" data-sum-one="'+k+'">↻ ringkas otomatis</button></b><textarea data-sum="'+k+'" rows="'+(k==='tujuan'?Math.min(6,Math.max(3,Math.ceil(val(k).length/90)+1)):Math.min(10,Math.max(2,(val(k).match(/\n/g)||[]).length+2)))+'">'+E(val(k))+'</textarea></div></div>'}).join('')+'</main>'+
  '<footer><button type="button" class="btn" data-sum-reset>Hapus suntingan</button><span style="flex:1"></span><button type="button" class="btn" data-chx-close>Batal</button><button type="button" class="btn" data-sum-prev title="Lihat hasil export dengan ringkasan ini sebelum disimpan">👁 Pratinjau</button><button type="button" class="btn mt-dlbtn" data-sum-save>Simpan ringkasan</button></footer></section>';
 document.body.appendChild(ov);
 const max=()=>+ov.querySelector('[data-sum-max]').value||6,fill=k=>{const a=autoSum(c,max());ov.querySelector('[data-sum="'+k+'"]').value=fmt(k,a[k])};
 /* Draf dari isi kolom (belum disimpan): nomor «1.» dibuang, satu baris = satu butir. */
 const draftSum=()=>{const o={max:max(),at:new Date().toISOString()};SUMF.forEach(([k])=>{const v=ov.querySelector('[data-sum="'+k+'"]').value;o[k]=k==='tujuan'?tujL(v).join('\n'):k==='ms'?v.split('\n').map(x=>x.trim()).filter(Boolean):v.split('\n').map(strip).filter(Boolean)});return o};
 const doSave=()=>{const o=draftSum();P.psCharterSum=o;try{save()}catch(_){}document.querySelectorAll('.chx-sumprevov').forEach(x=>x.remove());ov.remove();setBrief('brief');say('Ringkasan disimpan. Tampilan export memakai mode Ringkas.')};
 ov.addEventListener('click',async e=>{const t=e.target;if(t===ov||t.closest('[data-chx-close]')){ov.remove();return}
  const ai=t.closest('[data-sum-ai]');
  if(ai){
   const status=ov.querySelector('[data-sum-ai-status]');
   const inform=(msg,bad)=>{status.hidden=false;status.textContent=msg;status.style.color=bad?'#b91c1c':''};
   if(charterAiBusy){inform('Permintaan AI masih berjalan.',true);return}
   const fields=Object.fromEntries(SUMF.map(([k])=>[k,orig(k)]));
   const before=SUMF.map(([k])=>ov.querySelector('[data-sum="'+k+'"]').value);
   const cap=max();
   if(!window.confirm('Isian asli Charter akan dikirim ke layanan Groq di luar aplikasi untuk membuat draf. Lanjutkan hanya jika data diizinkan diproses oleh layanan eksternal. Draf yang ada dapat diganti; data asli tetap utuh. Lanjutkan?'))return;
   charterAiBusy=true;ai.disabled=true;ai.textContent='✦ Meringkas…';inform('AI sedang menyusun draf ringkasan.',false);
   try{
    const draft=await requestCharterAI(fields,cap,P.nama||c.judul||'');
    if(!ov.isConnected)return;
    if(max()!==cap||SUMF.some(([k],i)=>ov.querySelector('[data-sum="'+k+'"]').value!==before[i])){inform('Draf atau batas butir berubah saat AI bekerja. Hasil tidak diterapkan.',true);return}
    SUMF.forEach(([k])=>{ov.querySelector('[data-sum="'+k+'"]').value=fmt(k,k==='tujuan'?draft[k].join('\n'):draft[k])});
    inform('Draf AI siap. Periksa angka dan substansi, klik Pratinjau untuk melihat hasilnya, lalu Simpan ringkasan.',false);
   }catch(err){if(ov.isConnected)inform((err.message||'Ringkasan AI gagal.')+' Draf tidak diubah. Ringkas otomatis tetap tersedia.',true)}
   finally{charterAiBusy=false;if(ov.isConnected){ai.disabled=false;ai.textContent='✦ Ringkas dengan AI'}}
   return
  }
  const one=t.closest('[data-sum-one]');if(one){fill(one.dataset.sumOne);return}
  if(t.closest('[data-sum-auto]')){SUMF.forEach(([k])=>fill(k));return}
  if(t.closest('[data-sum-reset]')){delete P.psCharterSum;try{save()}catch(_){}ov.remove();say('Suntingan ringkasan dihapus; tampilan Ringkas memakai ringkasan otomatis.');setBrief(brief()?'brief':'full');return}
  if(t.closest('[data-sum-prev]')){sumPreview(P,c,draftSum(),doSave);return}
  if(t.closest('[data-sum-save]')){doSave()}});
 ov.querySelector('[data-sum-max]').addEventListener('change',()=>SUMF.forEach(([k])=>{if(!((Array.isArray(saved[k])?saved[k].length:String(saved[k]||'').trim())))fill(k)}));
}
/* Pratinjau ringkasan sebelum disimpan: halaman export (mode Ringkas) dari draf di jendela, tanpa menyimpan apa pun. */
function sumPreview(P,c,draft,onSave){document.querySelectorAll('.chx-sumprevov').forEach(x=>x.remove());
 const src={c,p:Object.assign({},P,{psCharterSum:draft})};let md=mode();
 const pv=document.createElement('div');pv.className='chx-ov chx-sumprevov';
 pv.innerHTML='<section class="chx-dlg" role="dialog" aria-modal="true" aria-label="Pratinjau Ringkasan"><header><div><b>Pratinjau Ringkasan</b><small>'+E(P.nama)+' · draf belum disimpan</small></div><button type="button" data-pv-back aria-label="Tutup">×</button></header>'+
  '<main><div class="chx-prev" data-pv-pages></div></main><footer><span class="chx-chips" role="group" aria-label="Tampilan">'+[['color','Berwarna'],['mono','Monokrom']].map(([k,l])=>'<button type="button" class="chx-chip'+(md===k?' on':'')+'" data-pv-mode="'+k+'" aria-pressed="'+(md===k)+'">'+l+'</button>').join('')+'</span><span style="flex:1"></span><button type="button" class="btn" data-pv-back>← Kembali menyunting</button><button type="button" class="btn mt-dlbtn" data-pv-save>Simpan ringkasan</button></footer></section>';
 document.body.appendChild(pv);const el=pv.querySelector('[data-pv-pages]');
 const render=()=>{let pages;FORCE_BRIEF=true;try{pages=pagesHtml(src,md)}finally{FORCE_BRIEF=false}
  el.classList.toggle('chx-prev-deck',md==='color');el.innerHTML=pages.map(p=>'<div class="chx-pbox" data-w="'+p.w+'" data-h="'+p.h+'"><div class="chx-pscale">'+p.html+'</div></div>').join('');el.__chxW=0;fit(el)};
 render();
 const close=()=>{pv.remove();document.removeEventListener('keydown',key,true)},key=e=>{if(e.key==='Escape'){e.stopPropagation();close()}};document.addEventListener('keydown',key,true);
 pv.addEventListener('click',e=>{const t=e.target;if(t===pv||t.closest('[data-pv-back]')){close();return}
  const m=t.closest('[data-pv-mode]');if(m){md=m.dataset.pvMode;pv.querySelectorAll('[data-pv-mode]').forEach(b=>{const on=b===m;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});render();return}
  if(t.closest('[data-pv-save]')){close();onSave()}});
}
/* Semua program tahun y saja (tanpa grup 'Program ini'). */
function barAllYear(y,n){return bar('data-chx-all="'+E(y)+'" data-chx-sel="1"',null).replace(/data-chx-x="(\w+)"/g,'data-chx-x="$1" data-chx-scope="all"').replace('<small>Charter Program</small>','<small>Program terpilih ('+n+')</small>')}
const barFor=(p,o)=>bar('data-chx-pid="'+E(p.id)+'"'+(o&&o.year?' data-chx-all="'+E(o.year)+'"':''),o&&o.n>1?{n:o.n}:null,{pid:p.id,k:fsOf(p,'')});
const barSrc=key=>{let f=null;try{const r=sources[key]&&sources[key]();const pid=r&&r.p&&r.p.id;const P=pid&&(S.programs||[]).find(x=>String(x.id)===String(pid));if(P)f={pid:P.id,k:fsOf(P,'')}}catch(_){}return bar('data-chx-src="'+E(key)+'"',null,f)};
/* Unduh semua Charter Program tahun y dalam satu berkas (JPG: satu ZIP). */
function barAll(y,n){return '<div class="chx-bar chx-all" data-chx-bar data-chx-all="'+E(y)+'"><span class="chx-lbl">Unduh semua ('+n+' program)</span>'+FMT.map(([k,l])=>'<button type="button" class="chx-x" data-chx-x="'+k+'" title="Gabungkan seluruh Charter Program '+E(y)+' ke satu berkas '+l+'">'+l+'</button>').join('')+'</div>'}
function bundle(list,name){const all=list.filter(x=>x&&x.c).map(x=>model(x.c,x.p));return {all,mode:mode(),file:name||'Charter_Program_Semua',judul:'Semua Program',sections:[]}}
async function exportAs(fmt,src){
 if(Array.isArray(src?.list)){if(!src.list.length){say(src.picked?'Centang minimal satu program dulu.':'Belum ada Charter Program pada tahun ini.');return}}
 else if(!src||!src.c){say('Charter Program belum tersedia.');return}
 const m=src.list?bundle(src.list,src.name):model(src.c,src.p);m.mode=mode();
 say('Menyiapkan '+({pdf:'PDF',docx:'Word',jpg:'JPG',pptx:'PowerPoint'}[fmt])+' · '+(m.mode==='mono'?'monokrom':'berwarna')+'…');
 try{if(fmt==='pdf')await toPdf(m);else if(fmt==='docx')await toDocx(m);else if(fmt==='jpg')await toJpg(m);else await toPptx(m);say('Charter Program berhasil diekspor.')}
 catch(e){say('Ekspor gagal: '+(e?.message||e))}
}
/* Pratinjau: halaman 1:1 diskalakan agar muat lebar wadah. */
/* Pratinjau: halaman 1:1 diskalakan agar muat lebar wadah.
   Kinerja: hasil paginasi di-cache per isi charter + mode (render ulang aplikasi tidak menyusun ulang halaman),
   pratinjau di dalam <details> tertutup baru disusun saat dibuka, dan penyesuaian skala hanya saat lebar berubah. */
const CACHE=new Map();
function cacheKey(src,md){try{return md+'|'+JSON.stringify([src.c,src.p&&[src.p.id,src.p.kode,src.p.kodeResmi,src.p.nama,src.p.uic,src.p.pend,src.p.psYear,fsMap(src.p),brief(),src.p.psCharterSum||null]])}catch(_){return ''}}
function pagesHtml(src,md){
 const k=cacheKey(src,md);if(k&&CACHE.has(k))return CACHE.get(k);
 const m=model(src.c,src.p);m.mode=md;const o=offscreen(m);
 const out=o.pages.map(pg=>{const [w,h]=dims(pg);return {w,h,sec:pg.dataset.chxSec||'',html:pg.outerHTML}});o.done();
 if(k){CACHE.set(k,out);if(CACHE.size>24)CACHE.delete(CACHE.keys().next().value)}
 return out;
}
function mountPreview(el,getSrc){
 el.__chxRender=()=>{const src=getSrc();if(!src||!src.c){el.innerHTML='<div class="chx-empty">Charter Program belum dibuat.</div>';return}
  const md=mode(),pages=pagesHtml(src,md);el.classList.toggle('chx-prev-deck',md==='color');
  const P=src.p&&src.p.id&&(S.programs||[]).find(x=>String(x.id)===String(src.p.id)),seen={};
  el.innerHTML=pages.map(p=>{const first=p.sec&&!seen[p.sec];if(p.sec)seen[p.sec]=1;return (P&&p.sec&&first?'<div class="chx-phd"><span>Halaman '+E(SEC_LBL[p.sec])+'</span>'+fsCtl(P.id,fsOf(P,p.sec),p.sec)+'</div>':'')+'<div class="chx-pbox" data-w="'+p.w+'" data-h="'+p.h+'"><div class="chx-pscale">'+p.html+'</div></div>'}).join('');
  el.__chxW=0;fit(el)};
 el.__chxRender();
 if(!el.__chxRO&&typeof ResizeObserver==='function'){let raf=0;el.__chxRO=new ResizeObserver(()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;fit(el)})});el.__chxRO.observe(el)}
}
function fit(el){const W=el.clientWidth;if(!W||Math.abs(W-(el.__chxW||0))<2&&el.__chxW)return;el.__chxW=W;
 el.querySelectorAll('.chx-pbox').forEach(b=>{const w=b.clientWidth;if(!w)return;const pw=+b.dataset.w||PW,ph=+b.dataset.h||PH,s=w/pw;const sc=b.firstElementChild;sc.style.width=pw+'px';sc.style.height=ph+'px';sc.style.transform='scale('+s+')';b.style.height=(ph*s)+'px'})}
function mountAll(root){(root||document).querySelectorAll('[data-chx-preview]:not([data-chx-mounted])').forEach(el=>{if(el.closest('details:not([open])'))return;el.setAttribute('data-chx-mounted','');mountPreview(el,()=>resolve(el))})}
document.addEventListener('toggle',ev=>{const d=ev.target;if(d&&d.tagName==='DETAILS'&&d.open&&d.querySelector('[data-chx-preview]:not([data-chx-mounted])'))mountAll(d)},true);
function preview(attrs){return '<div class="chx-prev" data-chx-preview '+(attrs||'')+'></div>'}
function open(src,title){
 if(!src||!src.c){say('Charter Program belum tersedia.');return}
 document.querySelectorAll('.chx-ov').forEach(x=>x.remove());
 const key='__open';register(key,()=>src);
 const ov=document.createElement('div');ov.className='chx-ov';
 ov.innerHTML='<section class="chx-dlg" role="dialog" aria-modal="true" aria-label="Charter Program"><header><div><b>Charter Program</b><small>'+E(title||[src.p?.kodeResmi||src.p?.kode,src.c.judul||src.p?.nama].filter(Boolean).join(' · '))+'</small></div><button type="button" data-chx-close aria-label="Tutup">×</button></header>'+
  '<main>'+preview('data-chx-src="'+key+'"')+'</main><footer>'+barSrc(key)+'<button type="button" class="btn" data-chx-close>Tutup</button></footer></section>';
 document.body.appendChild(ov);mountAll(ov);
 ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('[data-chx-close]'))ov.remove()});
 const k=e=>{if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',k)}};document.addEventListener('keydown',k);
}
const closeMenus=except=>document.querySelectorAll('.chx-menu:not([hidden])').forEach(x=>{if(x!==except){x.hidden=true;x.parentElement.querySelector('[data-chx-dd]')?.setAttribute('aria-expanded','false')}});
document.addEventListener('click',ev=>{
 const dd=ev.target.closest?.('[data-chx-dd]');
 if(dd){ev.preventDefault();ev.stopPropagation();const menu=dd.parentElement.querySelector('.chx-menu');closeMenus(menu);menu.hidden=!menu.hidden;dd.setAttribute('aria-expanded',String(!menu.hidden));
  if(!menu.hidden){menu.classList.remove('up');const r=menu.getBoundingClientRect();if(r.bottom>window.innerHeight-8)menu.classList.add('up')}return}
 if(!ev.target.closest?.('.chx-menu'))closeMenus();
 const f=ev.target.closest?.('[data-chx-fs]');if(f){ev.preventDefault();ev.stopPropagation();const g=f.closest('[data-chx-fs-pid]');if(g&&!f.disabled)setFs(g.dataset.chxFsPid,+f.dataset.chxFs,g.dataset.chxFsSec||'');return}
 const bb=ev.target.closest?.('[data-chx-brief]');if(bb){ev.preventDefault();ev.stopPropagation();setBrief(bb.dataset.chxBrief);return}
 const sb=ev.target.closest?.('[data-chx-sum]');if(sb){ev.preventDefault();ev.stopPropagation();sumDialog(sb.dataset.chxSum);return}
 const m=ev.target.closest?.('[data-chx-mode]');if(m){ev.preventDefault();ev.stopPropagation();setMode(m.dataset.chxMode);return}
 const x=ev.target.closest?.('[data-chx-x]');if(x){ev.preventDefault();ev.stopPropagation();if(x.disabled)return;const src=resolve(x);closeMenus();x.disabled=true;exportAs(x.dataset.chxX,src).finally(()=>{x.disabled=false})}
},true);
if(typeof MutationObserver==='function'&&document.body){let pend=0;new MutationObserver(()=>{if(pend)return;pend=requestAnimationFrame(()=>{pend=0;if(document.querySelector('[data-chx-preview]:not([data-chx-mounted])'))mountAll()})}).observe(document.body,{childList:true,subtree:true})}
function listAll(y){return (S.programs||[]).filter(p=>+p.psYear===+y&&!p.arsip&&p.psListStatus!=='Arsip').map(fromProgram).filter(Boolean)}
window.MT_CHX={barAllYear,deckFor,pagesFor,listAll,barAll,bundle,model,docxXml,docxBlob,paginate,bar,barFor,barSrc,preview,mountAll,open,register,fromProgram,exportAs,setMode,mode,fsCtl,fsOf,sumBtn:pid=>'<button type="button" class="chx-sumb" data-chx-sum="'+E(pid)+'" title="Atur teks ringkas untuk tampilan export">✎ Ringkasan</button>',setBrief,brief,briefChips,sumDialog,autoSum,sumItem,version:'20261125-chx5'};
})();
