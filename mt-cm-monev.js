/* Monev, Evaluasi Pascaimplementasi & Penutupan CM (2026-11-25)
   Diselaraskan dengan Bab V KEP-43 (File Kolaborasi) angka 2 huruf c, d, e dan sheet KK CM "CM OA" kolom AK–AR & "Monev - New".
   Data disimpan pada koleksi yang sudah ada (pantau, tr, modMeta) dengan pembeda jenisCatatan, sehingga tidak perlu aturan Firestore baru:
   EVAL-KEG evaluasi kegiatan per kode · REVIU-TW reviu triwulan · MASA masa pendampingan · EVAL-CM evaluasi per titik (lama, diperluas)
   DAMPING log pendampingan · ISU-PASCA isu terbuka · DOK pemutakhiran dokumen · LL lesson learned · modMeta[modul].closing status penutupan.
   Eskalasi dilakukan di luar sistem; hasilnya cukup dicatat pada tindak lanjut. */
(function(){
'use strict';
const J=k=>x=>x&&x.jenisCatatan===k;
const P=()=>(S.pantau=S.pantau||[]);
const ic=t=>(typeof IC==='function'?IC(t):'');
const E=v=>esc(v==null?'':v);
const BULAN=['jan','feb','mar','apr','mei','jun','jul','agu','sep','okt','nov','des'];
const MRE=/\b(jan(?:uari)?|feb(?:ruari)?|mar(?:et)?|apr(?:il)?|mei|jun(?:i)?|jul(?:i)?|agu(?:stus)?|agt|sep(?:t|tember)?|okt(?:ober)?|nov(?:ember)?|des(?:ember)?)\b/;
const METODE=['Survei (T-Survey)','Evaluasi pelatihan (T-Quiz / pre-post test)','Data penggunaan sistem','Observasi','Wawancara','Umpan balik pengguna','Catatan kanal layanan'];
const ADKAR=['Awareness','Desire','Knowledge','Ability','Reinforcement'];
const STATUS=['On Track','Required Action','Off Track'];
const ST_TL=['Belum','Proses','Selesai'];
const TITIK=['Evaluasi 1','Evaluasi 2','Evaluasi 3','Evaluasi 4','Evaluasi 5','Evaluasi 6','Evaluasi akhir'];
const KES=['Lanjut sesuai masa','Perpanjang masa pendampingan','Siap pengalihan'];
Object.assign(CHIP,{'Sesuai':'ok','Lebih cepat':'ok','Belum jatuh tempo':'gray','Belum terlaksana':'bad','Dialihkan':'warn','Disepakati':'ok','Dikirim':'ok','Siap diajukan':'warn','Ditutup':'ok','Belum siap':'gray','Belum dievaluasi':'gray','Rutin':'gray','Siap pengalihan':'ok','Lanjut sesuai masa':'info','Perpanjang masa pendampingan':'warn','Dikirim ke CMO Kemenkeu':'ok','Lewat tenggat':'bad'});

/* ---------- bantuan kecil ---------- */
function howTo(key,steps){S.ui.howto=S.ui.howto||{};if(S.ui.howto[key])return '';
 return '<div class="mv-how"><b>Cara mengisi</b><ol>'+steps.map(s=>'<li>'+s+'</li>').join('')+'</ol><button type="button" class="mv-x" data-act="mvHow" data-k="'+E(key)+'" title="Sembunyikan">✕</button></div>'}
ACT.mvHow=el=>{S.ui.howto=S.ui.howto||{};S.ui.howto[el.dataset.k]=1;save();render()};
const kpi=(l,v,d,info,col)=>'<div class="kpi"><div class="l">'+l+(info?ic(info):'')+'</div><div class="v"'+(col?' style="color:'+col+'"':'')+'>'+v+'</div><div class="d">'+(d||'')+'</div></div>';
const kpis=a=>'<div class="kpis">'+a.join('')+'</div>';
const strip=(t,v,info,extra)=>'<div class="ph-strip"><b>'+t+'</b>'+(typeof phaseBtn==='function'?phaseBtn(v):'')+(extra||'')+'<button type="button" data-act="cheatsheet" data-kind="cmo" class="txcs-entry">Cheatsheet</button></div>';
const over=(d,st)=>d&&st!=='Selesai'&&d<TODAY;
const mk2=(mk,x)=>{if(mk)x.modul=mk};

/* ---------- Rencana vs Realisasi: deviasi otomatis ---------- */
function planYM(txt){const t=String(txt||'').toLowerCase();if(!t.trim())return null;if(/sepanjang|rutin|setiap|berkala|tahunan/.test(t)&&!/\d{4}-\d{2}/.test(t)&&!MRE.test(t))return {rutin:true};
 let m=t.match(/(\d{4})-(\d{2})/);if(m)return {y:+m[1],m:+m[2]};
 const mm=t.match(MRE);if(!mm)return null;const best=BULAN.indexOf(mm[1].slice(0,3)==='agt'?'agu':mm[1].slice(0,3));if(best<0)return null;
 const y=(t.match(/\b(20\d{2})\b/)||[])[1];return {y:y?+y:(+S.ui.tahun||+TODAY.slice(0,4)),m:best+1}}
function devOf(r){if(r.status==='Batal')return {d:'Batal'};if(r.status==='Ditunda')return {d:'Ditunda'};
 const p=planYM(r.tglBaru||r.rencana);if(p&&p.rutin)return {d:'Rutin'};
 if(!p)return {d:r.dev||'—',manual:true};
 const pv=p.y*12+p.m,now=+TODAY.slice(0,4)*12+ +TODAY.slice(5,7);
 if(r.status==='Terlaksana'){if(!r.tgl)return {d:'Sesuai',n:'tanggal realisasi belum diisi'};const rv=+r.tgl.slice(0,4)*12+ +r.tgl.slice(5,7);
  return rv===pv?{d:'Sesuai'}:rv<pv?{d:'Lebih cepat'}:{d:'Terlambat',n:(rv-pv)+' bln'}}
 return pv<now?{d:'Belum terlaksana',n:'lewat '+(now-pv)+' bln'}:{d:'Belum jatuh tempo'}}
const devChip=r=>{const v=devOf(r);return chipSt(v.d)+(v.n?'<span class="sm">'+E(v.n)+'</span>':'')};

/* ---------- Evaluasi kegiatan (AK–AR) ---------- */
function sugOf(r){const t=(String(r.cara||'')+' '+r.jenis).toLowerCase();
 if(r.jenis==='Pelatihan'||/t-course|pelatihan|tot|bimtek|simulasi/.test(t))return {fok:'Ability',met:METODE[1],sum:'Hasil pre/post test atau simulasi'};
 if(/t-forum|t-lab|t-bond|rapat|forum|audiensi/.test(t))return {fok:'Desire',met:METODE[0],sum:'Hasil T-Survey / notula'};
 return {fok:'Awareness',met:METODE[0],sum:'Hasil T-Survey pasca kegiatan'}}
function evRec(ref){return P().find(x=>x.jenisCatatan==='EVAL-KEG'&&x.ref===ref)}
function stAuto(e){const h=num(e.hasil),t=num(e.tgt);if(h==null||t==null)return e.stM||'';const ra=num(e.ambRA);const lo=ra==null?t-15:ra;return h>=t?'On Track':h>=lo?'Required Action':'Off Track'}
const RK=['fok','met','sum','ik','tgt','ambRA'],RF={fok:'mfok',met:'mmet',sum:'msum',ik:'mik',tgt:'mtgt',ambRA:'mamb'};
const shOf=id=>S.sh.find(x=>x.id===id);
function planR(r){const sh=shOf(r.sid)||{},pre=r.ccT==='P'?'p_':'k_',o={};RK.forEach(k=>{const v=sh[pre+RF[k]];if(v!==undefined&&v!=='')o[k]=v});if(!o.ik&&pre==='p_'&&sh.p_ind)o.ik=sh.p_ind;return o}
function evRows(mf){return implRows(mf).filter(r=>['Berjalan','Terlaksana'].includes(r.status)).map(r=>{const e=evRec(r.id)||{},s=sugOf(r),pl=planR(r);
 const o=Object.assign({},r,{fok:s.fok,met:s.met,sum:s.sum,jang:'',capai:r.hadir||'',ik:'',tgt:'',ambRA:'',hasil:'',stM:'',tem:'',sar:'',tl:'',pj:'',tenggat:'',stTl:'',tamb:false},e,pl,{id:r.id,modul:r.modul,_e:!!e.id,_pl:Object.keys(pl).length>=3});o.st=stAuto(o);return o})}
function evSave(row){let e=evRec(row.id);if(!e){e={id:uid(),jenisCatatan:'EVAL-KEG',ref:row.id,modul:row.modul};P().push(e)}
 /* Rancangan Monev disimpan pada rencana (Perencanaan) agar satu sumber; hasil evaluasi disimpan pada catatan evaluasi. */
 const sh=shOf(row.sid),pre=row.ccT==='P'?'p_':'k_';if(sh)RK.forEach(k=>{if(row[k]!==undefined&&String(row[k]??'')!==String(sh[pre+RF[k]]??'')){sh[pre+RF[k]]=row[k];sh.mRevDate=TODAY}});
 ['jang','capai','hasil','stM','tem','sar','tl','pj','tenggat','stTl','tamb'].forEach(k=>{if(row[k]!==undefined)e[k]=row[k]});RK.forEach(k=>{e[k]=row[k]});e.keg=row.keg;e.kode=row.kode;e.st=stAuto(e);e.upd=TODAY}
/* Kolom rancangan Monev untuk form Perencanaan (kolom AK–AN KK CM) */
function rancCols(K){const pre=K?'k_':'p_';return [{k:pre+'s_m',l:'Rancangan Monev',t:'sec'},
 {k:pre+'mfok',l:'Fokus Monev (ADKAR)',t:'sel',o:[''].concat(ADKAR),tbl:false,info:'Kolom AK. Kosong = saran otomatis sesuai kanal (T-Media → Awareness, T-Forum/T-Lab → Desire, T-Course/pelatihan → Ability).'},
 {k:pre+'mmet',l:'Metode Monev',t:'sel',o:[''].concat(METODE),tbl:false,info:'Kolom AM. Pilihan sesuai Bab V c.3.'},
 {k:pre+'msum',l:'Sumber data Monev',tbl:false,info:'Kolom AN, mis. hasil T-Survey, datalog adopsi sistem.'},
 {k:pre+'mik',l:'Indikator kinerja Monev',t:'ta',tbl:false,info:'Kolom AL. Terukur, mis. ≥80% peserta memahami tujuan perubahan.'+(K?'':' Kosong = memakai Indikator keberhasilan pelatihan.')},
 {k:pre+'mtgt',l:'Target (%)',t:'num',tbl:false,info:'Hasil ≥ target → On Track.'},
 {k:pre+'mamb',l:'Batas bawah Required Action (%)',t:'num',tbl:false,info:'Di bawah angka ini → Off Track. Kosong = target − 15 (Bab V c.4: ambang ditetapkan di kertas kerja).'},
 {k:'_mon',l:'Monev',frm:false,info:'Rancangan Monev lengkap bila fokus, indikator, dan target terisi. Rancangan dipakai otomatis di Monev › Evaluasi.',r:s=>{const ok=s[pre+'mfok']&&(s[pre+'mik']||(!K&&s.p_ind))&&s[pre+'mtgt']!==undefined&&s[pre+'mtgt']!=='';return ok?'<span class="chip c-ok">Lengkap</span>':'<span class="chip c-gray">Belum</span>'},x:s=>s[pre+'mfok']&&s[pre+'mtgt']?'Lengkap':'Belum'}]}
const cak=r=>{const a=num(r.capai),b=num(r.jang);return a!=null&&b?Math.round(a/b*100)+'%':''};

function monev(ms,mf,mk){
 let sub=S.ui.sub.monev||'rr';if(sub==='lak')sub='rr';if(sub==='pan')sub='ev';
 let out='<div class="card">'+subNav('monev',[['rr','Rencana vs Realisasi'],['ev','Evaluasi'],['ado','Adopsi'],['kcm','Keberhasilan CM'],['tw','Reviu TW']],'rr')+'</div>';
 S.ui.sub.monev=sub;
 if(sub==='rr'){const rows=implRows(mf),D=rows.map(devOf);
  const n=k=>D.filter(x=>x.d===k).length;
  out+=howTo('mv-rr',['Deviasi dihitung otomatis dari waktu rencana dan tanggal realisasi','Isi penyebab dan RTL hanya untuk baris yang menyimpang','Keputusan jadwal ulang/batal dibahas di Reviu TW'])+
  kpis([kpi('Sesuai / lebih cepat',n('Sesuai')+n('Lebih cepat'),'dari '+rows.length+' rencana','Dihitung otomatis: bulan realisasi dibanding bulan rencana. Masih di bulan yang sama = Sesuai.','var(--ok)'),
   kpi('Terlambat',n('Terlambat'),'terlaksana melewati bulan rencana','','var(--warn)'),kpi('Belum terlaksana',n('Belum terlaksana'),'bulan rencana sudah lewat','','var(--bad)'),kpi('Ditunda / batal',n('Ditunda')+n('Batal'),'perlu alasan di RTL')])+
  tbl('rr',{ent:'penyesuaian RTL',title:'Rencana vs Realisasi'+ic('Bab V c.2.a: kesesuaian realisasi strategi komunikasi, pelatihan, pelibatan, dan pendampingan dengan rencana. Deviasi tidak dipilih manual lagi, kecuali bila waktu rencana belum terbaca.'),edit:true,editTitle:'Penyebab & penyesuaian RTL',list:()=>[],rows:()=>implRows(mf),canEdit:r=>can('monev','U',r.modul),label:r=>r.keg,
   onSave:r=>{Object.assign(S.impl[r.id],{dev:r.dev,sebab:r.sebab,rtl:r.rtl,tglBaru:r.tglBaru,picRtl:r.picRtl})},
   cols:[{k:'kode',l:'Kode',frm:false,sk:r=>r.kode||'',r:r=>MTCC.chip(r.modul,r.cc,MTCC.started(r.status)?'-1':''),x:r=>r.kode},...(mk?[]:[{k:'modul',l:'Modul',frm:false,r:r=>'<span class="code">'+E(r.modul)+'</span>'}]),
    {k:'keg',l:'Kegiatan',ro:true,w:1,r:r=>'<b>'+E(r.keg)+'</b><span class="sm">'+(r.scc?MTCC.chip(r.modul,r.scc)+' ':'')+r.jenis+' · '+E(r.sh)+'</span>'},
    {k:'rencana',l:'Rencana',ro:true,r:r=>E(r.rencana||'—')+(r.tglBaru?'<span class="sm">jadwal baru: '+fmtD(r.tglBaru)+'</span>':'')},
    {k:'_real',l:'Realisasi',frm:false,r:r=>chipSt(r.status)+(r.tgl?'<span class="sm">'+fmtD(r.tgl)+'</span>':''),x:r=>r.status+(r.tgl?' '+r.tgl:'')},
    {k:'_dev',l:'Deviasi',frm:false,info:'Otomatis. Sesuai = realisasi di bulan rencana. Belum terlaksana = bulan rencana sudah lewat. Rutin = rencana sepanjang tahun.',r:devChip,x:r=>devOf(r).d},
    {k:'dev',l:'Deviasi (isi manual bila rencana belum bertanggal)',t:'sel',o:['','Sesuai','Terlambat','Ditunda','Batal','Lebih cepat'],tbl:false},
    {k:'sebab',l:'Penyebab',t:'ta',tbl:false},{k:'rtl',l:'Penyebab · RTL',t:'ta',w:1,r:r=>(r.sebab?'<b>'+E(short(r.sebab,60))+'</b>':'')+(r.rtl?'<span class="sm">RTL: '+E(short(r.rtl,80))+'</span>':(r.sebab?'':'—'))},
    {k:'tglBaru',l:'Jadwal baru',t:'date',tbl:false},{k:'picRtl',l:'PIC RTL',tbl:false}]});}
 else if(sub==='ev'){const rows=evRows(mf),doneN=implRows(mf).filter(r=>r.status==='Terlaksana').length,ev=rows.filter(r=>r.st);
  out+=howTo('mv-ev',['Klik ✎ pada kegiatan yang sudah terlaksana','Isi target, hasil ukur, dan cakupan → status terisi otomatis','Bila tidak On Track, isi tindak lanjut, PJ, dan tenggat'])+
  kpis([kpi('Sudah dievaluasi',ev.length+' / '+rows.length,doneN+' kegiatan terlaksana','Kegiatan berstatus Berjalan/Terlaksana yang sudah punya status efektivitas.'),
   kpi('On Track',ev.filter(r=>r.st==='On Track').length,'sesuai ambang','','var(--ok)'),
   kpi('Perlu tindakan',ev.filter(r=>r.st&&r.st!=='On Track').length,'Required Action · Off Track','Status selain On Track wajib punya tindak lanjut (Bab V c.4).','var(--warn)'),
   kpi('TL lewat tenggat',rows.filter(r=>over(r.tenggat,r.stTl)).length,'tindak lanjut belum selesai','','var(--bad)')])+
  tbl('ev',{ent:'evaluasi kegiatan',title:'Evaluasi kegiatan'+ic('Satu baris per rencana komunikasi/pelatihan yang sudah berjalan/terlaksana (kolom AK–AR Kertas Kerja CM). Fokus, metode, dan sumber data disarankan otomatis dari kanal.'),edit:true,wide:true,editTitle:'Evaluasi kegiatan',list:()=>[],rows:()=>evRows(mf),canEdit:r=>can('monev','U',r.modul),label:r=>r.keg,
   empty:'Belum ada kegiatan berstatus Berjalan/Terlaksana di Pelaksanaan.',
   validate:d=>{const st=stAuto(d);if(st&&st!=='On Track'&&!String(d.tl||'').trim()){toast('Status '+st+': isi tindak lanjut.');return false}},
   onSave:r=>evSave(r),
   cols:[{k:'kode',l:'Kode',frm:false,sk:r=>r.kode||'',r:r=>MTCC.chip(r.modul,r.cc,MTCC.started(r.status)?'-1':''),x:r=>r.kode},...(mk?[]:[{k:'modul',l:'Modul',frm:false,r:r=>'<span class="code">'+E(r.modul)+'</span>'}]),
    {k:'keg',l:'Kegiatan',ro:true,w:1,r:r=>'<b>'+E(r.keg)+'</b><span class="sm">'+E(r.fok)+' · '+E(String(r.met||'').replace(/ \(.*/,''))+(r._pl?'':' · <i>saran otomatis</i>')+'</span>'},
    {k:'s1',l:'Rancangan Monev (dari Perencanaan)',t:'sec'},
    {k:'fok',l:'Fokus Monev (ADKAR)',t:'sel',o:ADKAR,tbl:false,info:'Kolom AK. Aspek ADKAR utama yang dimonitor.'},
    {k:'met',l:'Metode Monev',t:'sel',o:METODE,tbl:false,info:'Kolom AM. Pilihan mengikuti Bab V c.3.'},
    {k:'sum',l:'Sumber data',tbl:false,info:'Kolom AN, mis. hasil T-Survey, datalog adopsi sistem.'},
    {k:'ik',l:'Indikator kinerja',t:'ta',tbl:false,info:'Kolom AL. Terukur, mis. ≥80% peserta memahami tujuan perubahan.'},
    {k:'tgt',l:'Target (%)',t:'num',tbl:false,info:'Hasil ≥ target → On Track.'},
    {k:'ambRA',l:'Batas bawah Required Action (%)',t:'num',tbl:false,info:'Hasil di antara batas ini dan target → Required Action; di bawahnya → Off Track. Kosong = target − 15.'},
    {k:'s2',l:'Hasil',t:'sec'},
    {k:'jang',l:'Sasaran / target peserta',t:'num',tbl:false,info:'Bab V c.2.c–d: jumlah sasaran komunikasi / target peserta pelatihan.'},
    {k:'capai',l:'Terjangkau / terlatih',t:'num',tbl:false,info:'Terisi dari jumlah hadir di Pelaksanaan bila ada.'},
    {k:'_cak',l:'Cakupan',frm:false,r:r=>cak(r)||'—',x:r=>cak(r)},
    {k:'hasil',l:'Hasil ukur (%)',t:'num',r:r=>r.hasil!==''&&r.hasil!=null?'<b>'+E(r.hasil)+'%</b>'+(r.tgt?'<span class="sm">target '+E(r.tgt)+'%</span>':''):'—'},
    {k:'stM',l:'Status (bila hasil bukan angka)',t:'sel',o:[''].concat(STATUS),tbl:false},
    {k:'_st',l:'Status',frm:false,info:'Otomatis dari hasil ukur dibanding target dan ambang (Bab V c.4).',r:r=>r.st?chipSt(r.st):chipSt('Belum dievaluasi'),x:r=>r.st||'Belum dievaluasi'},
    {k:'tem',l:'Temuan utama',t:'ta',tbl:false,info:'Kolom AP. 1–2 kalimat berbasis fakta.'},
    {k:'tamb',l:'Perlu pelatihan/pendampingan tambahan',t:'chk',tbl:false},
    {k:'s3',l:'Tindak lanjut',t:'sec'},
    {k:'sar',l:'Rekomendasi / saran perbaikan',t:'ta',tbl:false,info:'Kolom AQ.'},
    {k:'tl',l:'Tindak lanjut',t:'ta',w:1,info:'Kolom AR. Bila isu perlu dieskalasi, eskalasi dilakukan di luar aplikasi; tulis arahan yang diterima di sini.',r:r=>r.tl?E(short(r.tl,70))+'<span class="sm">'+chipSt(over(r.tenggat,r.stTl)?'Lewat tenggat':(r.stTl||'Belum'))+(r.pj?' · '+E(r.pj):'')+(r.tenggat?' · '+fmtD(r.tenggat):'')+'</span>':'—'},
    {k:'pj',l:'Penanggung jawab',tbl:false},{k:'tenggat',l:'Tenggat',t:'date',tbl:false},{k:'stTl',l:'Status tindak lanjut',t:'sel',o:ST_TL,tbl:false}]});
  const old=P().filter(p=>!p.jenisCatatan&&mf(p));
  out+='<details class="mv-old"'+(old.length?'':' hidden')+'><summary>Catatan monev lain ('+old.length+')'+ic('Catatan monev yang tidak terkait satu kode rencana, termasuk catatan yang dibuat sebelum pembaruan ini.')+'</summary>'+
  tbl('pan',{ent:'catatan monev',title:'Catatan monev lain',add:true,edit:true,del:true,addLabel:'Catatan',list:()=>P(),rows:()=>P().filter(p=>!p.jenisCatatan&&mf(p)),canAdd:()=>can('monev','C',mk),canEdit:p=>can('monev','U',p.modul),canDel:p=>can('monev','D',p.modul),label:p=>p.keg,onSave:p=>mk2(mk,p),wide:true,
   cols:[...(mk?[]:[modCol('monev')]),{k:'keg',l:'Kegiatan / program',req:true,w:1},{k:'fok',l:'Fokus (ADKAR)',t:'sel',o:ADKAR},{k:'ik',l:'Indikator kinerja',t:'ta',tbl:false},{k:'met',l:'Metode',t:'sel',o:METODE,tbl:false},{k:'sum',l:'Sumber data',tbl:false},{k:'st',l:'Status',t:'sel',o:STATUS,r:p=>chipSt(p.st)},{k:'tem',l:'Temuan',t:'ta',w:1},{k:'sar',l:'Saran',t:'ta',tbl:false},{k:'tl',l:'Tindak lanjut',t:'ta',tbl:false}]})+'</details>';}
 else if(sub==='tw'){out+=reviu(ms,mf,mk)}
 else out+=window.__mvLegacyMonev(ms,mf,mk,sub);
 return out}

/* ---------- Reviu TW ---------- */
function twNow(){const m=+TODAY.slice(5,7);return 'TW '+['I','II','III','IV'][Math.ceil(m/3)-1]+' '+TODAY.slice(0,4)}
function twOpts(){const y=+TODAY.slice(0,4),o=[];[y-1,y,y+1].forEach(t=>['I','II','III','IV'].forEach(q=>o.push('TW '+q+' '+t)));return o}
function cra(mk){try{const v=(S.modMeta||{}).__CRA_NATIVE__;if(!v)return null;const sv=(v.surveys||[]).filter(s=>!mk||s.module===mk);const ids=new Set(sv.map(s=>s.id));const ac=(v.actions||[]).filter(a=>ids.has(a.surveyId));
 const open=ac.filter(a=>!['Done','Selesai','Closed'].includes(a.status));return {n:sv.length,last:sv[sv.length-1],open:open.length,late:open.filter(a=>a.dueDate&&a.dueDate<TODAY).length}}catch(e){return null}}
function riskHigh(mf){let n=0;S.sub.filter(mf).forEach(s=>RISK.forEach(r=>{if((+s[r[0]]||0)>=3)n++}));return n}
function reviu(ms,mf,mk){const rows=implRows(mf),D=rows.map(devOf),ev=evRows(mf),c=cra(mk),tlOpen=ev.filter(r=>r.tl&&r.stTl!=='Selesai');
 return howTo('mv-tw',['Baca ringkasan otomatis triwulan ini','Tulis kesimpulan dan keputusan per rencana yang menyimpang (tetap, tambah sesi, jadwal ulang, batal)','Ubah status menjadi Dikirim ke CMO Kemenkeu'])+
 '<div class="card mv-sum"><div class="ch"><h3>Ringkasan otomatis'+ic('Bab V c.2: realisasi vs rencana, kesiapan (CRA), efektivitas kegiatan, risiko resistensi, dan tindak lanjut. Angka mengikuti filter modul yang aktif.')+'</h3></div><div class="mv-grid">'+
 '<div><small>Rencana vs realisasi</small><b>'+D.filter(x=>x.d==='Sesuai'||x.d==='Lebih cepat').length+' sesuai</b><span>'+D.filter(x=>x.d==='Terlambat').length+' terlambat · '+D.filter(x=>x.d==='Belum terlaksana').length+' belum terlaksana · '+D.filter(x=>x.d==='Ditunda'||x.d==='Batal').length+' ditunda/batal</span></div>'+
 '<div><small>Efektivitas kegiatan</small><b>'+ev.filter(r=>r.st==='On Track').length+' On Track</b><span>'+ev.filter(r=>r.st==='Required Action').length+' Required Action · '+ev.filter(r=>r.st==='Off Track').length+' Off Track · '+ev.filter(r=>!r.st).length+' belum dievaluasi</span></div>'+
 '<div><small>Kesiapan (CRA)</small><b>'+(c&&c.last?E(c.last.round||'Baseline')+' · '+E(c.last.status||''):'Belum ada survei')+'</b><span>'+(c?c.open+' rencana aksi terbuka'+(c.late?' · '+c.late+' lewat tenggat':''):'—')+'</span></div>'+
 '<div><small>Risiko &amp; tindak lanjut</small><b>'+riskHigh(mf)+' risiko CM tinggi</b><span>'+tlOpen.length+' tindak lanjut terbuka · '+tlOpen.filter(r=>over(r.tenggat,r.stTl)).length+' lewat tenggat</span></div>'+
 '</div></div>'+
 tbl('tw',{ent:'reviu triwulan',title:'Reviu TW'+ic('Titik keputusan berkala: rencana yang menyimpang diputuskan tetap, tambah sesi, dijadwal ulang, atau dibatalkan. Hasil dikirim ke CMO Kemenkeu untuk konsolidasi (Bab V c.6).'),add:true,edit:true,del:true,wide:true,addLabel:'Reviu TW',list:()=>P(),rows:()=>P().filter(x=>x.jenisCatatan==='REVIU-TW'&&mf(x)),canAdd:()=>can('monev','C',mk),canEdit:x=>can('monev','U',x.modul),canDel:x=>can('monev','D',x.modul),label:x=>x.per,
  onSave:(x,isNew)=>{x.jenisCatatan='REVIU-TW';mk2(mk,x);if(x.st==='Dikirim ke CMO Kemenkeu'&&!x.tglKirim)x.tglKirim=TODAY;if(x.ll&&!x.llDone){P().push({id:uid(),jenisCatatan:'LL',modul:x.modul,fase:'Pemantauan & evaluasi',perbaiki:x.ll,rekom:'',baik:'',akar:'',pic:'',tgl:TODAY,asal:x.per});x.llDone=true}},
  cols:[{k:'per',l:'Periode',t:'sel',o:twOpts,def:twNow,req:true},...(mk?[]:[modCol('monev')]),
   {k:'kes',l:'Kesimpulan',t:'ta',w:1,req:true,info:'Ringkas kondisi triwulan: apa yang berjalan, apa yang perlu perhatian.'},
   {k:'kep',l:'Keputusan per rencana',t:'ta',w:1,hint:'Satu baris per kode, mis. “K03 – jadwal ulang Des 2026”, “P01 – tambah sesi coaching”.',info:'Rencana yang terlambat, belum terlaksana, atau tidak efektif.'},
   {k:'cmo',l:'Masukan CMO Kemenkeu',t:'ta',tbl:false,info:'Diisi dari hasil reviu/konsolidasi CMO Kemenkeu.'},
   {k:'ll',l:'Jadikan lesson learned',t:'ta',tbl:false,info:'Bila diisi, otomatis tercatat di Evaluasi Pasca › Lesson Learned.'},
   {k:'st',l:'Status',t:'sel',o:['Draft','Dikirim ke CMO Kemenkeu'],r:x=>chipSt(x.st||'Draft')+(x.tglKirim?'<span class="sm">'+fmtD(x.tglKirim)+'</span>':'')}]})}

/* ---------- Evaluasi Pascaimplementasi ---------- */
const STEP={'Bulanan':1,'Dua bulanan':2,'Triwulanan':3};
function titikOf(m){const out=[];if(!m||!m.goLive)return out;const st=STEP[m.titik]||1,end=m.akhir||'';let d=new Date(m.goLive+'T00:00:00');for(let i=1;i<=12;i++){d=new Date(d.getFullYear(),d.getMonth()+st,d.getDate());const s=d.toISOString().slice(0,10);if(end&&s>end){if(!out.length||out[out.length-1]<end)out.push(end);break}out.push(s);if(!end&&i>=3)break}return out}
function tline(m){const ev=P().filter(x=>x.jenisCatatan==='EVAL-CM'&&x.modul===m.modul),T=titikOf(m);
 return '<div class="mv-tl"><span class="dn" title="Go-live '+fmtD(m.goLive)+'">●<small>Go-live '+fmtD(m.goLive).slice(0,5)+'</small></span>'+T.map((t,i)=>{const e=ev.find(x=>x.titik==='Evaluasi '+(i+1));const cls=e?(e.kirim?'dn':'cu'):(t<TODAY?'late':'');return '<span class="'+cls+'" title="Evaluasi '+(i+1)+' · '+fmtD(t)+'">●<small>E'+(i+1)+' '+fmtD(t).slice(0,5)+'</small></span>'}).join('')+'</div>'}
function pasca(ms,mf,mk){S.ui.sub.pasca=S.ui.sub.pasca||'ev';const sub=S.ui.sub.pasca;
 const masa=P().filter(x=>x.jenisCatatan==='MASA'&&mf(x)),isu=P().filter(x=>x.jenisCatatan==='ISU-PASCA'&&mf(x)),isuOpen=isu.filter(x=>!['Selesai','Dialihkan'].includes(x.st));
 const ad=S.adopsi.filter(mf).slice(-1)[0],ind=S.ind.filter(mf),indOk=ind.filter(i=>(capOf(i)||0)>=100).length;
 let out=strip('Evaluasi Pascaimplementasi','cmo-pasca','Bab V huruf d: berjalan bersamaan dengan pendampingan transisi setelah go-live; masa ditetapkan per proyek bersama pemilik proses bisnis; hasil dikirim ke CMO Kemenkeu dan tidak menunggu penutupan proyek.')+
 howTo('ps',['Tetapkan masa pendampingan & titik evaluasi per modul','Isi evaluasi di setiap titik (4 aspek) dan kirim ke CMO Kemenkeu','Lengkapi rencana pengalihan, isu terbuka, dokumen, dan lesson learned'])+
 tbl('pmasa',{ent:'masa pendampingan',title:'Masa pendampingan & evaluasi'+ic('Bab V d.1 dan d.4: masa ditetapkan berdasarkan karakteristik, kompleksitas, risiko perubahan, kesiapan pengguna, dan kesiapan dukungan operasional, disepakati dengan pemilik proses bisnis.'),add:true,edit:true,del:true,addLabel:'Masa pendampingan',list:()=>P(),rows:()=>masa,canAdd:()=>can('monev','C',mk),canEdit:x=>can('monev','U',x.modul),canDel:x=>can('monev','D',x.modul),label:x=>x.modul,
  validate:(d,row)=>{const m=mk||d.modul;if(P().some(x=>x!==row&&x.jenisCatatan==='MASA'&&x.modul===m)){toast('Modul ini sudah punya masa pendampingan; ubah baris yang ada.');return false}if(d.akhir&&d.goLive&&d.akhir<d.goLive){toast('Akhir masa harus setelah go-live.');return false}},
  onSave:x=>{x.jenisCatatan='MASA';mk2(mk,x)},
  cols:[...(mk?[]:[modCol('monev')]),{k:'goLive',l:'Go-live',t:'date',req:true,r:x=>fmtD(x.goLive)},{k:'akhir',l:'Akhir masa',t:'date',r:x=>fmtD(x.akhir)},{k:'titik',l:'Titik evaluasi',t:'sel',o:Object.keys(STEP)},
   {k:'_tl',l:'Linimasa',frm:false,w:1,r:x=>tline(x),x:x=>titikOf(x).join(', ')},
   {k:'dasar',l:'Dasar penetapan masa',t:'ta',tbl:false},{k:'sepakat',l:'Disepakati dengan pemilik proses bisnis',hint:'unit dan nomor ND/notula',tbl:false}]})+
 kpis([kpi('Pengguna aktif',ad&&ad.tu?pct(ad.au/ad.tu*100):'—',ad?E(ad.per):'isi di Monev › Adopsi','Dari Monev › Adopsi periode terakhir.'),
  kpi('Indikator keberhasilan',ind.length?indOk+' / '+ind.length:'—','tercapai','Realisasi indikator I dari ADP (Monev › Keberhasilan CM). Semua harus tercapai sebelum penutupan.'),
  kpi('Isu terbuka',isuOpen.length,'harus selesai/dialihkan sebelum penutupan','',isuOpen.length?'var(--warn)':''),
  kpi('Evaluasi dikirim',P().filter(x=>x.jenisCatatan==='EVAL-CM'&&x.kirim&&mf(x)).length,'ke CMO Kemenkeu')])+
 '<div class="card">'+subNav('pasca',[['ev','Evaluasi'],['pd','Pendampingan'],['pg','Rencana Pengalihan'],['is','Isu Terbuka'],['dk','Pemutakhiran Dokumen'],['ll','Lesson Learned']],'ev')+'</div>';
 const aspek=(k,l,inf)=>[{k:k,l:l,t:'ta',tbl:false,info:inf},{k:'st'+k,l:'Status · '+l,t:'sel',o:[''].concat(STATUS),tbl:false}];
 if(sub==='ev')out+=tbl('pasca',{ent:'evaluasi pascaimplementasi',title:'Evaluasi per titik'+ic('Bab V huruf d: evaluasi berjalan bersamaan dengan pendampingan transisi dan hasilnya dikirim ke CMO Kemenkeu tanpa menunggu penutupan proyek. Empat aspek Bab V d.2 a–d. Kesimpulan “Siap pengalihan” pada evaluasi yang sudah dikirim menjadi salah satu syarat penutupan.'),add:true,edit:true,del:true,wide:true,addLabel:'Evaluasi',list:()=>P(),rows:()=>P().filter(x=>x.jenisCatatan==='EVAL-CM'&&mf(x)),canAdd:()=>can('monev','C',mk),canEdit:x=>can('monev','U',x.modul),canDel:x=>can('monev','D',x.modul),label:x=>(x.titik||x.aspek||x.modul),
  onSave:x=>{x.jenisCatatan='EVAL-CM';mk2(mk,x);if(x.kirim&&!x.tglKirim)x.tglKirim=TODAY;if(!x.kirim)x.tglKirim='';x.st=x.kirim?'Selesai':(x.st==='Selesai'?'Berjalan':(x.st||'Berjalan'))},
  cols:[...(mk?[]:[modCol('monev')]),{k:'titik',l:'Titik',t:'sel',o:TITIK,r:x=>'<b>'+E(x.titik||'—')+'</b><span class="sm">'+fmtD(x.tgl)+'</span>'},{k:'tgl',l:'Tanggal evaluasi',t:'date',tbl:false},
   {k:'aspek',l:'Subjek / cakupan',hint:'opsional, mis. seluruh pengguna e-Perjadin',tbl:false},
   {k:'s1',l:'Empat aspek',t:'sec'},
   ...aspek('adopsi','Keberlanjutan adopsi','Bab V d.2.a: konsistensi penggunaan sistem/proses baru. Rujuk Monev › Adopsi.'),
   ...aspek('perilaku','Proses & perilaku kerja baru','Bab V d.2.b'),
   ...aspek('isu','Penanganan isu, resistensi, keluhan','Bab V d.2.c'),
   ...aspek('kanal','Kesiapan pengalihan pendampingan','Bab V d.2.d: kesiapan pemilik proses bisnis / pengelola operasional dan kanal layanan resmi.'),
   {k:'_as',l:'Status 4 aspek',frm:false,r:x=>['stadopsi','stperilaku','stisu','stkanal'].map(k=>x[k]?chipSt(x[k]):'<span class="chip c-gray">—</span>').join(' '),x:x=>['stadopsi','stperilaku','stisu','stkanal'].map(k=>x[k]||'-').join(' / ')},
   {k:'s2',l:'Tindak lanjut & kesimpulan',t:'sec'},
   {k:'rtl',l:'Tindak lanjut',t:'ta',w:1,info:'Bab V d.3: penguatan adopsi dan/atau pendampingan transisi.'},{k:'pj',l:'Penanggung jawab',tbl:false},{k:'tenggat',l:'Tenggat',t:'date',tbl:false},
   {k:'kes',l:'Kesimpulan',t:'sel',o:KES,r:x=>x.kes?chipSt(x.kes):'—'},
   {k:'kirim',l:'Kirim ke CMO Kemenkeu',t:'chk',cl:'Sudah dikirim',r:x=>x.kirim?chipSt('Dikirim')+'<span class="sm">'+fmtD(x.tglKirim)+'</span>':chipSt('Draft'),x:x=>x.kirim?'Dikirim '+(x.tglKirim||''):'Draft'}]});
 else if(sub==='pd')out+=tbl('pdamp',{ent:'kegiatan pendampingan',title:'Log pendampingan transisi'+ic('Bab V d.4: penyelesaian kendala adopsi, penguatan kemampuan, pemutakhiran panduan/materi, mekanisme umpan balik, dan pengawalan alih dukungan ke kanal layanan.'),add:true,edit:true,del:true,addLabel:'Kegiatan pendampingan',list:()=>P(),rows:()=>P().filter(x=>x.jenisCatatan==='DAMPING'&&mf(x)),canAdd:()=>can('monev','C',mk),canEdit:x=>can('monev','U',x.modul),canDel:x=>can('monev','D',x.modul),label:x=>x.keg,onSave:x=>{x.jenisCatatan='DAMPING';mk2(mk,x)},
  cols:[...(mk?[]:[modCol('monev')]),{k:'jenis',l:'Jenis',t:'sel',o:['Penyelesaian kendala adopsi','Penguatan kemampuan','Pemutakhiran panduan/materi','Mekanisme umpan balik','Alih dukungan ke kanal layanan'],req:true,r:x=>'<span class="chip c-info">'+E(x.jenis)+'</span>'},{k:'keg',l:'Kegiatan',req:true,w:1},{k:'per',l:'Periode'},{k:'hasil',l:'Hasil',t:'ta',w:1},{k:'bukti',l:'Bukti',hint:'tautan/nama berkas',r:x=>E(short(x.bukti,30))}]});
 else if(sub==='pg')out+=tbl('tr',{ent:'rencana pengalihan',title:'Rencana pengalihan pendampingan'+ic('Bab V d.5: objek & cakupan dukungan, penerima, dokumentasi, isu terbuka, mekanisme pengaduan & eskalasi, titik waktu. Menggabungkan Sustainment Plan dan Transfer Kepemilikan (KK CM “Monev - New”).'),add:true,edit:true,del:true,wide:true,addLabel:'Objek pengalihan',list:()=>S.tr,rows:()=>S.tr.filter(mf),canAdd:()=>can('closing','C',mk),canEdit:t=>can('closing','U',t.modul),canDel:t=>can('closing','D',t.modul),label:t=>t.area,onSave:t=>mk2(mk,t),
  cols:[...(mk?[]:[modCol('closing')]),{k:'area',l:'Objek',t:'sel',o:['Sistem / Aplikasi','Dukungan pengguna','Proses Bisnis Baru','Jaringan Perubahan','Kanal Layanan / Complaint Handling','Lainnya'],req:true,r:t=>'<b>'+E(t.area)+'</b>'+(t.cak?'<span class="sm">'+E(short(t.cak,60))+'</span>':'')},{k:'cak',l:'Cakupan dukungan',t:'ta',tbl:false},
   {k:'dari',l:'Dari',tbl:false},{k:'kpd',l:'Penerima',r:t=>E(t.dari||'—')+' → <b>'+E(t.kpd||'—')+'</b>'},{k:'krit',l:'Kriteria siap alih',t:'ta',tbl:false},{k:'dok',l:'Dokumentasi diserahkan',t:'ta',tbl:false},
   {k:'esk',l:'Mekanisme pengaduan & eskalasi',t:'ta',tbl:false},{k:'mek',l:'Mekanisme keberlanjutan',t:'ta',w:1,info:'Sustainment: risiko regresi, strategi pencegahan, reinforcement, frekuensi, indikator.'},
   {k:'tgl',l:'Titik waktu pengalihan',t:'date',r:t=>fmtD(t.tgl)},{k:'st',l:'Status',t:'sel',o:['Belum','Proses','Disepakati','Selesai'],r:t=>chipSt(t.st||'Belum')},{k:'ttd',l:'Penerima (TTD)',tbl:false}]});
 else if(sub==='is')out+=tbl('pisu',{ent:'isu terbuka',title:'Isu terbuka'+ic('Bab V e.2: sebelum penutupan, setiap isu diselesaikan atau dialihkan dengan status, target, dan mekanisme pemantauan.'),add:true,edit:true,del:true,addLabel:'Isu',list:()=>P(),rows:()=>P().filter(x=>x.jenisCatatan==='ISU-PASCA'&&mf(x)),canAdd:()=>can('monev','C',mk),canEdit:x=>can('monev','U',x.modul),canDel:x=>can('monev','D',x.modul),label:x=>x.isu,
  validate:d=>{if(d.st==='Dialihkan'&&(!d.kpd||!d.target||!d.pantau)){toast('Isu dialihkan: isi dialihkan ke, target, dan mekanisme pemantauan.');return false}},onSave:x=>{x.jenisCatatan='ISU-PASCA';mk2(mk,x)},
  cols:[...(mk?[]:[modCol('monev')]),{k:'isu',l:'Isu',req:true,w:1},{k:'asal',l:'Asal',t:'sel',o:['Kanal layanan','Evaluasi pascaimplementasi','Monev','Risiko CM','Lainnya']},{k:'kpd',l:'Dialihkan ke',info:'Pihak yang bertanggung jawab sesuai kewenangan.'},{k:'target',l:'Target',t:'date',r:x=>fmtD(x.target)},{k:'pantau',l:'Mekanisme pemantauan',tbl:false},{k:'st',l:'Status',t:'sel',o:['Terbuka','Proses','Selesai','Dialihkan'],r:x=>chipSt(x.st||'Terbuka')}]});
 else if(sub==='dk')out+=tbl('pdok',{ent:'dokumen terdampak',title:'Pemutakhiran dokumen terdampak'+ic('SOP, regulasi, panduan, atau materi yang perlu disesuaikan. Tombol “Saran dari ADP” menambah dokumen dari dampak berkode D dengan aspek Proses/Organisasi/Regulasi minimal Sedang.'),add:true,edit:true,del:true,addLabel:'Dokumen',list:()=>P(),rows:()=>P().filter(x=>x.jenisCatatan==='DOK'&&mf(x)),canAdd:()=>can('monev','C',mk),canEdit:x=>can('monev','U',x.modul),canDel:x=>can('monev','D',x.modul),label:x=>x.nama,onSave:x=>{x.jenisCatatan='DOK';mk2(mk,x)},
  tools:mk&&can('monev','C',mk)?'<button class="btn sm" data-act="mvDokSug" data-mk="'+E(mk)+'">Saran dari ADP</button>':'',
  cols:[...(mk?[]:[modCol('monev')]),{k:'asal',l:'Asal',r:x=>x.asal?MTCC.chip(x.modul,x.asal):'—',hint:'kode dampak, mis. D01'},{k:'nama',l:'Dokumen',req:true,w:1,r:x=>'<b>'+E(x.nama)+'</b><span class="sm">'+E(x.jenis||'')+'</span>'},{k:'jenis',l:'Jenis',t:'sel',o:['SOP','Regulasi','Panduan teknis','Materi','Lainnya'],tbl:false},{k:'pemilik',l:'Unit pemilik'},{k:'ubah',l:'Perubahan yang diperlukan',t:'ta',w:1},{k:'target',l:'Target',t:'date',tbl:false},{k:'pic',l:'PIC',tbl:false},{k:'st',l:'Status',t:'sel',o:['Belum','Proses','Selesai'],r:x=>chipSt(x.st||'Belum')}]});
 else out+=tbl('pll',{ent:'lesson learned',title:'Lesson learned'+ic('Bisa diisi kapan saja per fase; isian “Jadikan lesson learned” di Reviu TW otomatis masuk ke sini (Bab V angka 5 huruf b.6).'),add:true,edit:true,del:true,addLabel:'Lesson learned',list:()=>P(),rows:()=>P().filter(x=>x.jenisCatatan==='LL'&&mf(x)),canAdd:()=>can('monev','C',mk),canEdit:x=>can('monev','U',x.modul),canDel:x=>can('monev','D',x.modul),label:x=>x.perbaiki||x.baik,onSave:x=>{x.jenisCatatan='LL';mk2(mk,x);x.tgl=x.tgl||TODAY},
  cols:[...(mk?[]:[modCol('monev')]),{k:'fase',l:'Fase',t:'sel',o:['Perencanaan','Pelaksanaan','Pemantauan & evaluasi','Pascaimplementasi','Penutupan'],r:x=>'<span class="chip c-info">'+E(x.fase)+'</span>'+(x.asal?'<span class="sm">dari '+E(x.asal)+'</span>':'')},{k:'baik',l:'Berjalan baik',t:'ta',w:1},{k:'perbaiki',l:'Perlu diperbaiki',t:'ta',w:1},{k:'akar',l:'Akar masalah',t:'ta',tbl:false},{k:'rekom',l:'Rekomendasi ke depan',t:'ta',w:1},{k:'pic',l:'PIC',tbl:false},{k:'tgl',l:'Tanggal',t:'date',tbl:false}]});
 return out}
ACT.mvDokSug=el=>{const mk=el.dataset.mk;let n=0;S.sub.filter(s=>s.modul===mk).forEach(s=>{const hit=['P','O','R'].some(k=>(+s[k]||0)>=2);if(!hit||!s.cc)return;if(P().some(x=>x.jenisCatatan==='DOK'&&x.modul===mk&&x.asal===s.cc))return;
 P().push({id:uid(),jenisCatatan:'DOK',modul:mk,asal:s.cc,nama:'Dokumen terkait: '+(s.nama||s.cc),jenis:(+s.R||0)>=2?'Regulasi':'SOP',pemilik:'',ubah:String(s.tobe||'').slice(0,200),st:'Belum'});n++});
 save();render();toast(n?n+' dokumen disarankan dari ADP. Lengkapi nama dan pemiliknya.':'Tidak ada dampak Proses/Organisasi/Regulasi ≥ Sedang yang belum tercatat.')};

/* ---------- Penutupan CM ---------- */
function syarat(mk){const ind=S.ind.filter(i=>i.modul===mk),indOk=ind.filter(i=>(capOf(i)||0)>=100).length;
 const tr=S.tr.filter(t=>t.modul===mk),trOk=tr.filter(t=>['Disepakati','Selesai'].includes(t.st)).length;
 const isu=P().filter(x=>x.jenisCatatan==='ISU-PASCA'&&x.modul===mk&&!['Selesai','Dialihkan'].includes(x.st)).length;
 const tl=P().filter(x=>x.jenisCatatan==='EVAL-KEG'&&x.modul===mk&&String(x.tl||'').trim()&&x.stTl!=='Selesai').length;
 const ev=P().filter(x=>x.jenisCatatan==='EVAL-CM'&&x.modul===mk).sort((a,b)=>String(a.tgl||'').localeCompare(String(b.tgl||'')));const evK=ev.filter(x=>x.kirim),last=evK[evK.length-1];
 const dok=P().filter(x=>x.jenisCatatan==='DOK'&&x.modul===mk),dokOk=dok.filter(x=>x.st==='Selesai').length,ll=P().filter(x=>x.jenisCatatan==='LL'&&x.modul===mk).length;
 const L=[
  {ok:ind.length>0&&indOk===ind.length,t:'Indikator keberhasilan tercapai',v:ind.length?indOk+'/'+ind.length:'belum ada indikator',ref:'e.1'},
  {ok:tr.length>0&&trOk===tr.length,t:'Rencana pengalihan disepakati/selesai',v:tr.length?trOk+'/'+tr.length:'belum ada',ref:'d.5 · e.1'},
  {ok:isu+tl===0,t:'Isu & tindak lanjut selesai atau dialihkan',v:isu+tl?(isu+' isu · '+tl+' TL terbuka'):'tidak ada yang terbuka',ref:'e.2'},
  {ok:!!last&&last.kes==='Siap pengalihan',t:'Evaluasi terakhir dikirim dengan kesimpulan “Siap pengalihan”',v:last?(E(last.titik||'')+' · '+E(last.kes||'—')):'belum ada evaluasi dikirim',ref:'d.6'}];
 const rec={ok:(dok.length===0||dokOk===dok.length)&&ll>0,t:'Dokumen terdampak & lesson learned (disarankan)',v:(dok.length?dokOk+'/'+dok.length+' dokumen':'tanpa dokumen')+' · '+ll+' lesson learned'};
 return {L,rec,n:L.filter(x=>x.ok).length,ok:L.every(x=>x.ok),ind,tr,ev:last,isu,tl}}
function clsOf(mk){const c=((S.modMeta||{})[mk]||{}).closing||{};return c}
function clStatus(mk){const c=clsOf(mk),s=syarat(mk);return c.st==='Ditutup'?'Ditutup':c.st==='Diajukan'?'Diajukan':s.ok?'Siap diajukan':'Belum siap'}
function closing(ms,mf,mk){const list=ms.filter(m=>!mk||m.kode===mk);const rows=list.map(m=>({id:m.kode,modul:m.kode,nama:m.nama}));
 const cnt=k=>rows.filter(r=>clStatus(r.modul)===k).length;
 return strip('Penutupan Manajemen Perubahan','cmo-closing','Bab V huruf e: dilakukan bila evaluasi pascaimplementasi menunjukkan indikator tercapai dan pemilik proses bisnis/pengelola operasional siap mengambil alih; isu tersisa diselesaikan atau dialihkan.','<button type="button" class="btn sm pri" data-act="mtCmBa" data-mk="'+E(mk||'')+'">▤ Dokumen penutupan</button>')+
 howTo('cl',['Buka Rincian modul untuk melihat syarat yang belum terpenuhi','Lengkapi di Evaluasi Pasca (evaluasi, pengalihan, isu)','Ajukan penutupan; CMO Kemenkeu menetapkan Ditutup'])+
 kpis([kpi('Ditutup',cnt('Ditutup'),'modul','','var(--ok)'),kpi('Diajukan',cnt('Diajukan'),'menunggu CMO Kemenkeu'),kpi('Siap diajukan',cnt('Siap diajukan'),'4 syarat terpenuhi','','var(--warn)'),kpi('Belum siap',cnt('Belum siap'),'masih masa pendampingan / syarat kurang')])+
 tbl('clos',{ent:'penutupan CM',title:'Status penutupan per modul'+ic('Bab V huruf e: penutupan dilakukan bila evaluasi pascaimplementasi menunjukkan indikator tercapai dan pemilik proses bisnis/pengelola operasional siap mengambil alih. Empat syarat dicek otomatis; tombol Ajukan aktif bila semua terpenuhi.'),list:()=>[],rows:()=>rows,label:r=>r.modul,
  rowAct:r=>'<button title="Rincian" aria-label="Rincian penutupan" data-act="mvClose" data-mk="'+E(r.modul)+'">☰</button>',
  cols:[{k:'modul',l:'Modul',r:r=>'<span class="code">'+E(r.modul)+'</span> <b>'+E(short(r.nama,50))+'</b>'},
   {k:'_s',l:'Syarat',info:'Indikator tercapai · pengalihan disepakati · isu & TL selesai/dialihkan · evaluasi terakhir dikirim “Siap pengalihan”.',r:r=>{const s=syarat(r.modul);return '<b>'+s.n+' / 4</b><span class="sm">'+s.L.map(x=>x.ok?'✓':'✗').join(' ')+'</span>'},x:r=>syarat(r.modul).n+'/4'},
   {k:'_st',l:'Status',r:r=>{const c=clsOf(r.modul);return chipSt(clStatus(r.modul))+(c.tgl?'<span class="sm">'+fmtD(c.tglTutup||c.tgl)+'</span>':'')},x:r=>clStatus(r.modul)}]})+
 '<div class="note i" style="margin-top:10px"><span>Penutupan Manajemen Perubahan tidak meniadakan tanggung jawab pemilik proses bisnis dan pengelola operasional atas keberlanjutan penerapan (Bab V e.4).</span></div>'}
ACT.mvClose=el=>{const mk=el.dataset.mk,s=syarat(mk),c=clsOf(mk),st=clStatus(mk),boss=ME&&['SA','CMOK'].includes(ME.role),canU=can('closing','U',mk);
 const li=x=>'<div class="mv-chk"><span class="'+(x.ok?'y':'n')+'">'+(x.ok?'✓':'✗')+'</span><div><b>'+x.t+'</b>'+(x.ref?' <small class="mv-ref">'+x.ref+'</small>':'')+'<small>'+x.v+'</small></div></div>';
 const body='<div class="mv-chkw">'+s.L.map(li).join('')+'<div class="mv-chk rec"><span class="'+(s.rec.ok?'y':'w')+'">'+(s.rec.ok?'✓':'!')+'</span><div><b>'+s.rec.t+'</b><small>'+s.rec.v+'</small></div></div></div>'+
 '<div class="mv-st">Status: '+chipSt(st)+(c.by?' <small>oleh '+E(c.by)+' · '+fmtD(c.tgl)+'</small>':'')+'</div>'+
 (!s.ok&&st!=='Ditutup'?'<div class="note w"><span>Syarat belum lengkap. Lengkapi di Evaluasi Pasca atau perpanjang masa pendampingan.</span></div>':'');
 const ov=modal('Penutupan CM · '+esc(mk),body,null,null,{size:'wide',cancel:'Tutup',extra:
  '<button class="btn" data-mx="ba">▤ Dokumen penutupan</button>'+(canU&&st==='Siap diajukan'?'<button class="btn pri" data-mx="aju">Ajukan penutupan</button>':'')+(canU&&st==='Diajukan'?'<button class="btn" data-mx="tarik">Tarik pengajuan</button>':'')+(boss&&st==='Diajukan'?'<button class="btn pri" data-mx="tutup">Tetapkan ditutup</button>':'')+(boss&&st==='Ditutup'?'<button class="btn" data-mx="buka">Buka kembali</button>':''),
  onExtra:k=>{S.modMeta[mk]=S.modMeta[mk]||{};const m=S.modMeta[mk];
   if(k==='ba'){ACT.mtCmBa({dataset:{mk}});return}
   if(k==='aju'){if(!syarat(mk).ok){toast('Syarat belum lengkap.');return false}m.closing={st:'Diajukan',tgl:TODAY,by:ME&&ME.nama||''};log('Ajukan penutupan CM',mk)}
   if(k==='tarik'){m.closing={};log('Tarik pengajuan penutupan CM',mk)}
   if(k==='tutup'){m.closing=Object.assign({},m.closing,{st:'Ditutup',tglTutup:TODAY,oleh:ME&&ME.nama||''});log('Penutupan CM ditetapkan',mk)}
   if(k==='buka'){m.closing={};log('Penutupan CM dibuka kembali',mk)}
   save();render();toast('Tersimpan.')}});
 return ov};
/* Ringkasan untuk dokumen penutupan (Bab V e.3) */
window.MTMV_closingSummary=mk=>{if(!mk)return '';const s=syarat(mk);const isu=P().filter(x=>x.jenisCatatan==='ISU-PASCA'&&x.modul===mk&&x.st==='Dialihkan');const m=P().find(x=>x.jenisCatatan==='MASA'&&x.modul===mk);
 return ['1. Hasil evaluasi pascaimplementasi: '+(m?'masa '+fmtD(m.goLive)+'–'+fmtD(m.akhir)+'; ':'')+'indikator tercapai '+s.L[0].v+(s.ev?'; evaluasi terakhir '+(s.ev.titik||'')+' ('+(s.ev.kes||'')+')':''),
  '2. Kesiapan alih dukungan: '+(s.tr.map(t=>(t.area||'')+' → '+(t.kpd||'-')).join('; ')||'-'),
  '3. Isu tersisa: '+(isu.map(x=>x.isu+' → '+(x.kpd||'-')+' (target '+fmtD(x.target)+')').join('; ')||'tidak ada'),
  '4. Pihak penerima tanggung jawab: '+([...new Set(s.tr.map(t=>t.kpd).filter(Boolean))].join(', ')||'-'),
  '5. Tindak lanjut yang disepakati: '+(s.tr.map(t=>t.mek).filter(Boolean).join('; ')||'-')].join('\n')};

window.MTMV={monev,pasca,closing,devOf,planYM,stAuto,syarat,titikOf,rancCols};
/* ---------- Bantuan, Guide & contoh isian ---------- */
try{
 const ex=(t,tj,f)=>({title:t,tujuan:tj,f});
 Object.assign(FORMEX,{
  rr:ex('Rencana vs Realisasi','Deviasi dihitung otomatis; isi penyebab dan RTL untuk baris yang menyimpang.',[['sebab','Penyebab',0,'Mengapa terlambat/ditunda.','Menunggu penetapan PMK sehingga nota dinas belum bisa diterbitkan.'],['rtl','Penyesuaian RTL',0,'Rencana tindak lanjut.','Nota dinas diterbitkan setelah PMK ditetapkan, paling lambat 20 Okt.'],['tglBaru','Jadwal baru',0,'Tanggal baru bila dijadwal ulang.','2026-10-20'],['picRtl','PIC RTL',0,'Penanggung jawab.','Dit. Sistem Perbendaharaan']]),
  ev:ex('Evaluasi kegiatan','Menilai efektivitas kegiatan yang sudah terlaksana (kolom AK–AR Kertas Kerja CM).',[['fok','Fokus Monev (ADKAR)',0,'Aspek ADKAR utama.','Awareness'],['ik','Indikator kinerja',0,'Ukuran terukur.','≥80% peserta memahami tujuan perubahan'],['tgt','Target (%)',0,'Angka target indikator.','80'],['ambRA','Batas bawah Required Action',0,'Di bawah angka ini = Off Track.','65'],['jang','Sasaran / target peserta',0,'Jumlah sasaran.','250'],['capai','Terjangkau / terlatih',0,'Jumlah yang hadir/terlatih.','212'],['hasil','Hasil ukur (%)',0,'Nilai hasil pengukuran.','86'],['tem','Temuan utama',0,'1–2 kalimat berbasis fakta.','Pertanyaan dominan soal uang harian.'],['sar','Rekomendasi',0,'Saran perbaikan.','Susun FAQ uang harian.'],['tl','Tindak lanjut',0,'Aksi konkret.','Unggah FAQ ke portal e-Perjadin.'],['pj','Penanggung jawab',0,'Unit/PIC.','Dit. Sistem Perbendaharaan'],['tenggat','Tenggat',0,'Batas waktu.','2026-12-15']]),
  tw:ex('Reviu TW','Titik keputusan triwulan atas rencana yang menyimpang.',[['per','Periode',1,'Triwulan.','TW IV 2026'],['kes','Kesimpulan',1,'Kondisi triwulan.','Awareness pegawai baik (86%); kemampuan Agent belum memadai.'],['kep','Keputusan per rencana',0,'Satu baris per kode.','K03 – jadwal ulang Des 2026\nP01 – tambah sesi coaching'],['cmo','Masukan CMO Kemenkeu',0,'Masukan hasil reviu.','Pertimbangkan gabung K06 dengan coaching P01.'],['ll','Jadikan lesson learned',0,'Pembelajaran untuk dicatat.','ToT perlu simulasi lintas kanal.']]),
  pmasa:ex('Masa pendampingan & evaluasi','Menetapkan masa pendampingan transisi dan titik evaluasi.',[['goLive','Go-live',1,'Tanggal penerapan.','2027-01-05'],['akhir','Akhir masa',0,'Akhir masa pendampingan.','2027-04-05'],['titik','Titik evaluasi',0,'Frekuensi evaluasi.','Bulanan'],['dasar','Dasar penetapan',0,'Karakteristik, kompleksitas, risiko, kesiapan.','70 ribu pengguna; kanal aduan berpindah ke CRM; CRA Pre Go-Live Ability 2,9.'],['sepakat','Disepakati dengan',0,'Pemilik proses bisnis + ND.','Dit. Sistem Perbendaharaan · ND-123/PB/2026']]),
  pasca:ex('Evaluasi per titik','Menilai empat aspek Bab V d.2 pada setiap titik evaluasi.',[['titik','Titik',0,'Urutan titik.','Evaluasi 2'],['tgl','Tanggal evaluasi',0,'Tanggal.','2027-03-05'],['adopsi','Keberlanjutan adopsi',0,'Temuan aspek a.','78% pengguna aktif; 6 unit vertikal < 50%.'],['perilaku','Proses & perilaku kerja baru',0,'Temuan aspek b.','92% pengajuan melalui aplikasi.'],['isu','Penanganan isu & resistensi',0,'Temuan aspek c.','Risiko resistensi turun ke Rendah; 3 aduan terbuka.'],['kanal','Kesiapan pengalihan',0,'Temuan aspek d.','SOP penanganan aduan belum ditetapkan.'],['rtl','Tindak lanjut',0,'Penguatan adopsi/pendampingan.','Penguatan adopsi via T-Agent di 6 unit.'],['kes','Kesimpulan',0,'Lanjut / perpanjang / siap pengalihan.','Lanjut sesuai masa']]),
  pdamp:ex('Log pendampingan transisi','Mencatat kegiatan pendampingan setelah go-live.',[['jenis','Jenis',1,'Lima jenis Bab V d.4.','Penyelesaian kendala adopsi'],['keg','Kegiatan',1,'Nama kegiatan.','Klinik daring setiap Jumat'],['per','Periode',0,'Waktu.','Jan–Mar 2027'],['hasil','Hasil',0,'Capaian.','12 sesi, 340 pertanyaan terjawab'],['bukti','Bukti',0,'Tautan/berkas.','SharePoint/Klinik-Perjadin']]),
  tr:ex('Rencana pengalihan pendampingan','Menyerahkan dukungan dari tim perubahan ke pemilik proses bisnis/pengelola operasional (Bab V d.5).',[['area','Objek',1,'Yang dialihkan.','Dukungan pengguna'],['cak','Cakupan dukungan',0,'Lingkup.','Pertanyaan dan aduan penggunaan e-Perjadin'],['dari','Dari',0,'Tim penyerah.','Tim CM DJPb'],['kpd','Penerima',0,'Pemilik operasional.','Dit. SITP (HAI DJPb)'],['dok','Dokumentasi diserahkan',0,'Dokumen.','Panduan v2, FAQ, call tree'],['esk','Mekanisme pengaduan & eskalasi',0,'Jalur aduan.','CRM HAI DJPb → Puspensi (L2)'],['mek','Mekanisme keberlanjutan',0,'Sustainment.','Dashboard adopsi bulanan; refresher untuk pengguna baru'],['tgl','Titik waktu pengalihan',0,'Tanggal.','2027-04-05'],['st','Status',0,'Belum/Proses/Disepakati/Selesai.','Disepakati']]),
  pisu:ex('Isu terbuka','Isu yang harus selesai atau dialihkan sebelum penutupan (Bab V e.2).',[['isu','Isu',1,'Uraian.','3 aduan uang harian belum selesai'],['kpd','Dialihkan ke',0,'Pihak berwenang.','Dit. SITP'],['target','Target',0,'Tanggal.','2027-04-30'],['pantau','Mekanisme pemantauan',0,'Cara memantau.','Laporan CRM bulanan'],['st','Status',0,'Terbuka/Proses/Selesai/Dialihkan.','Dialihkan']]),
  pdok:ex('Pemutakhiran dokumen terdampak','SOP, regulasi, panduan, atau materi yang perlu disesuaikan.',[['nama','Dokumen',1,'Nama dokumen.','SOP Penanganan Aduan Perjalanan Dinas'],['pemilik','Unit pemilik',0,'Pemilik dokumen.','Dit. SITP'],['ubah','Perubahan yang diperlukan',0,'Penyesuaian.','Kanal aduan pindah ke CRM HAI DJPb'],['st','Status',0,'Belum/Proses/Selesai.','Proses']]),
  pll:ex('Lesson learned','Pembelajaran per fase.',[['fase','Fase',0,'Fase.','Pelaksanaan'],['baik','Berjalan baik',0,'Yang berhasil.','Sosialisasi hybrid menjangkau 230 peserta'],['perbaiki','Perlu diperbaiki',0,'Yang kurang.','ToT kurang praktik'],['akar','Akar masalah',0,'Penyebab.','Durasi 120 menit tidak cukup untuk simulasi'],['rekom','Rekomendasi',0,'Ke depan.','ToT minimal 2 sesi dengan simulasi lintas kanal']])});
 Object.assign(HELP,{
  'cmo-monev':{d:'Pemantauan dan evaluasi perubahan (Bab V huruf c): rencana vs realisasi, efektivitas kegiatan, adopsi, keberhasilan CM, dan Reviu TW.',c:['Rencana vs Realisasi: deviasi otomatis; isi penyebab dan RTL bila menyimpang.','Evaluasi: isi target, hasil ukur, dan cakupan; status On Track/Required Action/Off Track terisi otomatis.','Status selain On Track wajib punya tindak lanjut, PJ, dan tenggat.','Reviu TW: tulis kesimpulan dan keputusan per rencana, lalu kirim ke CMO Kemenkeu.','Eskalasi dilakukan di luar aplikasi; arahan yang diterima ditulis di tindak lanjut.'],e:[['Evaluasi','K01 Sosialisasi · target 80% · hasil 86% → On Track']]},
  'cmo-pasca':{d:'Evaluasi pascaimplementasi bersamaan dengan pendampingan transisi (Bab V huruf d).',c:['Tetapkan masa pendampingan dan titik evaluasi per modul.','Isi evaluasi empat aspek di setiap titik, pilih kesimpulan, lalu centang Kirim ke CMO Kemenkeu.','Lengkapi log pendampingan, rencana pengalihan, isu terbuka, pemutakhiran dokumen, dan lesson learned.'],e:[['Masa','Go-live 5 Jan 2027 · s.d. 5 Apr 2027 · bulanan']]},
  'cmo-closing':{d:'Penutupan CM per modul (Bab V huruf e) berdasarkan empat syarat yang dicek otomatis.',c:['Klik ☰ Rincian untuk melihat syarat yang belum terpenuhi.','Lengkapi di Evaluasi Pasca, lalu Ajukan penutupan.','CMO Kemenkeu menetapkan status Ditutup; unduh Dokumen penutupan sebagai BA.'],e:[]}});
 GUIDE['cmo-monev']={tujuan:'Memantau dan mengevaluasi perubahan secara berkala: apakah rencana terlaksana, apakah efektif, dan apa yang perlu disesuaikan.',
  alur:[['Rencana vs Realisasi','Lihat deviasi otomatis; isi penyebab dan RTL bila menyimpang.',null,null,'rr'],['Evaluasi','Isi hasil ukur kegiatan yang terlaksana; status keluar otomatis.',null,null,'ev'],['Adopsi & Keberhasilan CM','Isi data adopsi dan realisasi indikator.',null,null,'ado'],['Reviu TW','Putuskan penyesuaian dan kirim ke CMO Kemenkeu.',null,null,'tw']],
  tab:[['Rencana vs Realisasi','Deviasi otomatis + RTL.'],['Evaluasi','Efektivitas per kode (AK–AR).'],['Adopsi','Pengguna aktif & transaksi.'],['Keberhasilan CM','Realisasi indikator ADP.'],['Reviu TW','Keputusan triwulan.']],isi:['rr','ev','ado','kcm','tw']};
 GUIDE['cmo-pasca']={tujuan:'Menilai keberlanjutan adopsi selama masa pendampingan transisi dan menyiapkan pengalihan ke pemilik proses bisnis.',
  alur:[['Tetapkan masa','Isi go-live, akhir masa, titik evaluasi, dan kesepakatan.',null,null,'pmasa'],['Evaluasi per titik','Nilai 4 aspek, pilih kesimpulan, kirim ke CMO Kemenkeu.',null,null,'pasca'],['Siapkan pengalihan','Isi rencana pengalihan dan selesaikan/alihkan isu.',null,null,'tr'],['Lanjut ke Penutupan','Bila kesimpulan Siap pengalihan.','cmo-closing','Ke Penutupan']],isi:['pmasa','pasca','pdamp','tr','pisu','pdok','pll']};
 GUIDE['cmo-closing']={tujuan:'Menutup CM per modul setelah indikator tercapai dan pemilik siap mengambil alih.',
  alur:[['Periksa syarat','Klik ☰ Rincian pada modul.',null,null,'clos'],['Lengkapi','Syarat yang belum terpenuhi dilengkapi di Evaluasi Pasca.','cmo-pasca','Ke Evaluasi Pasca'],['Ajukan & tetapkan','Ajukan penutupan; CMO Kemenkeu menetapkan Ditutup.']],isi:['clos']};
 if(Array.isArray(window.PHASE4||null)){}
}catch(e){console.warn('MTMV bantuan',e)}
try{if(typeof PHASE4!=='undefined'){const a=PHASE4.find(x=>x[0]==='cmo-pasca'),b=PHASE4.find(x=>x[0]==='cmo-closing');if(a){a[3]='Bersamaan dengan pendampingan transisi setelah go-live; masa ditetapkan per proyek';a[4]='Keberlanjutan adopsi, perilaku kerja baru, isu & resistensi, kesiapan pengalihan pendampingan'}if(b){b[3]='Setelah evaluasi pascaimplementasi menunjukkan indikator tercapai';b[4]='Indikator tercapai, pengalihan disepakati, isu selesai/dialihkan'}}}catch(e){}
try{if(typeof render==='function'&&/cmo-(monev|pasca|closing)|-t-(monev|pasca|closing)/.test(String(VIEW||'')))render()}catch(e){}
})();
