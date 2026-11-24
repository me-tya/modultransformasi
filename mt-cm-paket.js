/* Paket validasi tahap CM → bukti otomatis item WBS (2026-11-25)
   Setiap paket diajukan sekali per modul; bila divalidasi CMO/PMO Kemenkeu di PMO › Bukti Dukung, item WBS terkait bernilai 100
   pada bulan PENGAJUAN (aktual = tanggal diajukan). Bukti = isian di aplikasi, tidak perlu unggah ulang.
   Paket 1 ADP memakai alur status ADP yang sudah ada (Draft → Final). */
(function(){
'use strict';
const E=v=>esc(v==null?'':v);
const ic=t=>(typeof IC==='function'?IC(t):'');
const P=()=>(S.pantau=S.pantau||[]);
const meta=mk=>(S.modMeta[mk]=S.modMeta[mk]||{});
const ambOf=mk=>{const v=+(meta(mk).ambImpl);return v>0&&v<=100?v:75};
const shOf=id=>S.sh.find(x=>x.id===id);
const rows=mk=>implRows(s=>s.modul===mk);
function chk(ok,t,v){return {ok:!!ok,t,v:v||''}}

const PK=[
 {id:'adp',n:1,l:'ADP',tab:'adp',kinds:['ADP'],ref:'Bab V a.3.a–b',cek(mk){const st=(S.modMeta[mk]||{}).adp||'Draft',n=S.sub.filter(s=>s.modul===mk).length;return [chk(n>0,'Ada sub modul ADP',n+' sub modul'),chk(st==='Final','ADP ditandai Final',st)]}},
 {id:'sh',n:2,l:'Stakeholder',tab:'rencana',kinds:['S'],ref:'Bab V a.3.c',cek(mk){const L=S.sh.filter(s=>s.modul===mk),b=L.filter(s=>!(s.ex&&s.su)).length;return [chk(L.length>0,'Ada stakeholder',L.length+' stakeholder'),chk(L.length&&!b,'Semua dinilai Experience–Support',b?b+' belum dinilai':'lengkap')]}},
 {id:'jj',n:3,l:'Jaringan',tab:'jaringan',kinds:['J'],ref:'Bab V a.3.d',cek(mk){const j=(S.jjMod||{})[mk]||{};return [chk(j.kepNo&&j.kepTgl,'SK Tim jaringan ditetapkan',j.kepNo?j.kepNo+' · '+fmtD(j.kepTgl):'nomor/tanggal KEP belum diisi')]}},
 {id:'cra',n:4,l:'Kesiapan',tab:'cra',kinds:['CRA'],ref:'Bab V a.3.e',cek(mk){let sv=[],rs=[];try{const v=(S.modMeta||{}).__CRA_NATIVE__||{};sv=(v.surveys||[]).filter(s=>s.module===mk&&s.status==='Ditutup');const ids=new Set(sv.map(s=>s.id));rs=(v.responses||[]).filter(r=>ids.has(r.surveyId))}catch(e){}
  return [chk(sv.length>0,'Survei CRA sudah ditutup',sv.length?sv.map(s=>s.round||'Baseline').join(', '):'belum ada survei ditutup'),chk(rs.length>0,'Ada respons survei',rs.length+' respons')]}},
 {id:'ren',n:5,l:'Perencanaan',tab:'rencana',kinds:['K','P'],ref:'Bab V a.3.f–g',cek(mk){const L=rows(mk),inc=L.filter(r=>{const s=shOf(r.sid)||{},pre=r.ccT==='P'?'p_':'k_';const keg=r.ccT==='P'?s.p_prog:s.k_keg,wkt=r.ccT==='P'?s.p_waktu:s.k_waktu;return !(keg&&wkt&&s[pre+'mfok']&&(s[pre+'mik']||(r.ccT==='P'&&s.p_ind))&&s[pre+'mtgt']!==undefined&&s[pre+'mtgt']!=='')});
  return [chk(L.length>0,'Ada rencana komunikasi/pelatihan',L.length+' rencana'),chk(L.length&&!inc.length,'Setiap rencana punya kegiatan, waktu, dan rancangan Monev',inc.length?inc.length+' belum lengkap: '+inc.slice(0,4).map(r=>r.cc||r.keg).join(', '):'lengkap')]}},
 {id:'imp',n:6,l:'Implementasi',tab:'pelaksanaan',kinds:['KI','PI'],ref:'ambang per modul',cek(mk){const x=implCalc(mk);
  return [chk(x.mh.ok,'Komunikasi Must Have 100% terlaksana',x.mh.n?x.mh.d+'/'+x.mh.n:'tidak ada Must Have'),chk(x.ok,'Rencana terlaksana dengan bukti ≥ ambang',x.done+'/'+x.n+' (perlu '+x.need+', ambang '+x.amb+'%)'),chk(x.batalOk,'Rencana batal/ditunda punya penjelasan RTL',x.noExp?x.noExp+' tanpa penjelasan':'lengkap')]}},
 {id:'mon',n:7,l:'Monev',tab:'monev',kinds:['M'],ref:'Bab V c',cek(mk){const L=rows(mk).filter(r=>r.status==='Terlaksana'),E2=P().filter(x=>x.jenisCatatan==='EVAL-KEG'&&x.modul===mk);const ev=L.filter(r=>E2.some(e=>e.ref===r.id&&e.st)).length;
  const noTl=E2.filter(e=>e.st&&e.st!=='On Track'&&!String(e.tl||'').trim()).length,tw=P().filter(x=>x.jenisCatatan==='REVIU-TW'&&x.modul===mk&&x.st==='Dikirim ke CMO Kemenkeu').length;
  return [chk(L.length&&ev===L.length,'Kegiatan terlaksana sudah dievaluasi',ev+'/'+L.length),chk(!noTl,'Status selain On Track punya tindak lanjut',noTl?noTl+' belum':'lengkap'),chk(tw>0,'Minimal satu Reviu TW dikirim ke CMO Kemenkeu',tw+' reviu')]}}];

function implCalc(mk){const amb=ambOf(mk),L=rows(mk);
 const batal=L.filter(r=>['Batal','Ditunda'].includes(r.status)),exp=r=>String(r.sebab||r.rtl||'').trim();
 const ex=L.filter(r=>r.status==='Batal'&&exp(r));const base=L.filter(r=>!ex.includes(r));
 const done=base.filter(r=>r.status==='Terlaksana'&&String(r.bukti||'').trim()).length,n=base.length;
 const need=n?(n<=4?Math.max(1,n-1):Math.ceil(amb/100*n)):1;
 const mhL=base.filter(r=>r.ccT==='K'&&(shOf(r.sid)||{}).k_katKom==='Must Have'),mhD=mhL.filter(r=>r.status==='Terlaksana').length;
 return {amb,n,done,need,ok:n>0&&done>=need,mh:{n:mhL.length,d:mhD,ok:mhD===mhL.length},noExp:batal.filter(r=>!exp(r)).length,batalOk:!batal.filter(r=>!exp(r)).length}}

function items(mk,p){const out=[];p.kinds.forEach(k=>{const w=MTCC.wbsFor(mk,k);if(w&&!out.includes(w))out.push(w)});return out}
function stOf(mk,p){const W=items(mk,p);if(!W.length)return {st:'Tidak ada item WBS',W};
 const B=W.map(w=>S.bukti[w.k]||{});
 if(W.every(w=>w.v))return {st:'Tervalidasi',W};
 if(B.some(b=>['Ditolak','Perlu perbaikan'].includes(b.st)))return {st:'Dikembalikan',W};
 if(B.some(b=>b.st==='Menunggu validasi'))return {st:'Menunggu validasi',W,tgl:(B.find(b=>b.aktual)||{}).aktual};
 const ok=p.cek(mk).every(c=>c.ok);return {st:ok?'Siap diajukan':'Belum lengkap',W}}
Object.assign(CHIP,{'Tervalidasi':'ok','Siap diajukan':'warn','Belum lengkap':'gray','Tidak ada item WBS':'gray'});

function ajukan(mk,p){const W=items(mk,p).filter(w=>!w.v);const tab=p.tab;
 W.forEach(w=>{w.v=0;w.rm=0;S.bukti[w.k]={st:'Menunggu validasi',auto:'cm-'+p.id,nama:'Isian '+p.l+' di aplikasi (paket '+p.n+')',link:'#modul-'+mk+'-t-'+tab,file:false,by:ME&&ME.nama,role:ME&&ME.role,tgl:TODAY,aktual:TODAY,note:'Bukti = isian kertas kerja CM di aplikasi (paket validasi '+p.n+' · '+p.l+').',cat:''}});
 log('Ajukan paket validasi CM',mk+' · paket '+p.n+' '+p.l+' → '+W.map(w=>w.k).join(', '))}
function tarik(mk,p){items(mk,p).forEach(w=>{const b=S.bukti[w.k];if(b&&b.auto==='cm-'+p.id&&b.st!=='Valid'&&!w.v){delete S.bukti[w.k];w.rm=0}});log('Tarik paket validasi CM',mk+' · paket '+p.n)}

/* Strip ringkas di ruang kerja modul */
const TABPK={adp:['adp'],rencana:['sh','ren'],jaringan:['jj'],cra:['cra'],pelaksanaan:['imp'],monev:['mon']};
function strip(mk,tab){if(!mk||!modOf(mk))return '';const all=PK.map(p=>({p,s:stOf(mk,p)})),val=all.filter(x=>x.s.st==='Tervalidasi').length;
 const here=(TABPK[tab]||[]).map(id=>all.find(x=>x.p.id===id));
 return '<div class="cmpk-strip"><b>Validasi tahap CM'+ic('Setiap tahap diajukan sebagai paket. Bila divalidasi CMO/PMO Kemenkeu, item WBS terkait bernilai 100 pada bulan paket diajukan. Bukti = isian di aplikasi.')+'</b>'+
 '<span class="cmpk-dots">'+all.map(x=>'<i class="'+(x.s.st==='Tervalidasi'?'ok':x.s.st==='Menunggu validasi'?'wt':x.s.st==='Dikembalikan'?'bd':'')+'" title="'+x.p.n+' · '+E(x.p.l)+': '+E(x.s.st)+'">'+x.p.n+'</i>').join('')+'</span><span class="cmpk-n">'+val+'/7 tervalidasi</span>'+
 here.map(x=>'<span class="cmpk-here">Paket '+x.p.n+' · '+E(x.p.l)+' '+chipSt(x.s.st)+'</span>').join('')+
 '<button type="button" class="btn sm" data-act="pkOpen" data-mk="'+E(mk)+'" data-f="'+E((TABPK[tab]||[])[0]||'')+'">Paket validasi ›</button></div>'}

ACT.pkOpen=el=>{const mk=el.dataset.mk,focus=el.dataset.f;const canU=can('rencana','U',mk)||can('monev','U',mk);const boss=ME&&['SA','CMOK','PMOK'].includes(ME.role);
 const card=p=>{const s=stOf(mk,p),C=p.cek(mk),ok=C.every(c=>c.ok);
  const act=p.id==='adp'?'<a class="btn sm" href="#modul-'+E(mk)+'-t-adp" data-x>Buka ADP ›</a>':
   s.st==='Siap diajukan'&&canU?'<button class="btn sm pri" data-pk="aju" data-id="'+p.id+'">Ajukan</button>':
   s.st==='Dikembalikan'&&canU&&ok?'<button class="btn sm pri" data-pk="aju" data-id="'+p.id+'">Ajukan ulang</button>':
   s.st==='Menunggu validasi'&&canU?'<button class="btn sm" data-pk="tarik" data-id="'+p.id+'">Tarik</button>':'';
  return '<div class="cmpk-card'+(focus===p.id?' on':'')+'"><div class="cmpk-h"><span class="cmpk-num">'+p.n+'</span><b>'+E(p.l)+'</b>'+chipSt(s.st)+(s.tgl?'<small>diajukan '+fmtD(s.tgl)+'</small>':'')+'<span style="flex:1"></span>'+act+'</div>'+
   '<div class="cmpk-w">'+(s.W.length?s.W.map(w=>'<span class="code">'+E(w.k)+'</span> '+E(short(deliv(w),46))+(w.v?' <span class="chip c-ok">100</span>':'')).join('<br>'):'<span class="sm">Item WBS tahap ini belum ada di WBS modul.</span>')+'</div>'+
   '<div class="cmpk-c">'+C.map(c=>'<div><span class="'+(c.ok?'y':'n')+'">'+(c.ok?'✓':'✗')+'</span>'+E(c.t)+' <small>'+E(c.v)+'</small></div>').join('')+'</div></div>'};
 const amb=ambOf(mk);
 const body='<div class="cmpk-intro">Paket yang divalidasi membuat item WBS bernilai <b>100</b> pada bulan <b>diajukan</b>. Validasi dilakukan CMO/PMO Kemenkeu di PMO › Bukti Dukung. Revisi rencana sesudah validasi tidak menurunkan nilai.</div>'+
  '<div class="cmpk-amb">Ambang Implementasi modul ini: <input type="number" id="pkAmb" min="1" max="100" value="'+amb+'"'+(boss||canU?'':' disabled')+'>% '+ic('Nilai bawaan 75%. Dapat disesuaikan per proyek dan tercatat di log (Bab V angka 5 huruf g: ambang tidak diberlakukan seragam). Rencana ≤ 4: boleh 1 tidak terlaksana. Komunikasi Must Have wajib 100%.')+(boss||canU?' <button class="btn sm" data-pk="amb">Simpan ambang</button>':'')+'</div>'+
  '<div class="cmpk-grid">'+PK.map(card).join('')+'</div>';
 const ov=modal('Paket validasi CM · '+esc(mk),body,null,null,{size:'wide',cancel:'Tutup'});
 ov.addEventListener('click',e=>{const b=e.target.closest('[data-pk]');if(!b)return;const p=PK.find(x=>x.id===b.dataset.id);
  if(b.dataset.pk==='amb'){const v=+ov.querySelector('#pkAmb').value;if(!(v>0&&v<=100)){toast('Ambang 1–100.');return}meta(mk).ambImpl=v;log('Ambang Implementasi CM',mk+' → '+v+'%');save();toast('Ambang disimpan.');ov.remove();render();ACT.pkOpen({dataset:{mk,f:focus}});return}
  if(b.dataset.pk==='aju'){if(!p.cek(mk).every(c=>c.ok)){toast('Syarat paket belum lengkap.');return}if(!items(mk,p).length){toast('Item WBS tahap ini belum ada.');return}ajukan(mk,p);save();toast('Paket '+p.n+' diajukan; menunggu validasi CMO/PMO Kemenkeu.')}
  if(b.dataset.pk==='tarik'){tarik(mk,p);save();toast('Pengajuan ditarik.')}
  ov.remove();render();ACT.pkOpen({dataset:{mk,f:focus}})})};

window.MTPK={PK,strip,stOf,implCalc,items,ajukan,tarik};
})();
