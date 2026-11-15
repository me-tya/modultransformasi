/* Modul Transformasi ⇄ Dashboard CM — sinkron dua arah data Aktivitas.
   - MT menjadi jembatan: membaca/menulis koleksi cmActivities (1 dokumen per aktivitas, {v:JSON,updatedAt,updatedBy})
     di project Firebase Dashboard CM memakai app Firebase kedua ('dcm') dan login Google akun Dashboard CM.
   - Setiap aktivitas MT menyimpan cmSync={d,m}: sidik data bersama terakhir yang sudah sama di DCM (d) dan MT (m).
     Hanya DCM berubah → terapkan ke MT; hanya MT berubah → kirim ke DCM; dua-duanya → yang lebih baru menang (seri: DCM).
   - Lampiran: berkas DCM (dashboardImages) ditarik ke penyimpanan MT; berkas MT ≤ 600 KB dikirim ke DCM.
   - Pengaman: putaran yang akan menghapus > 5 aktivitas di salah satu sisi dihentikan dan meminta konfirmasi.
   Fungsi murni diekspor di window.MTDCM untuk pengujian. */
(function(){
'use strict';
const DCM_CFG={apiKey:"AIzaSyDG0oZs4P17Roubm135icbP4hZrWGxESbY",authDomain:"dashboard-cm-bb716.firebaseapp.com",projectId:"dashboard-cm-bb716",storageBucket:"dashboard-cm-bb716.firebasestorage.app",messagingSenderId:"676995574090",appId:"1:676995574090:web:9b3b0ac7f2631610d879b3"};
const COLL='cmActivities',MIG_DOC='cm_activities_migration_v1',LS_ON='mt_dcm_sync_on',PUSH_MAX=600000,DEL_GUARD=5,NEW_GUARD=20;
const FIELDS=[['und','undanganFiles'],['st','suratTugasFiles'],['materi','materiFiles'],['dok','dokumentasi'],['notula','notula']];

/* ---------- utilitas murni ---------- */
const arr=v=>{if(Array.isArray(v))return v;if(typeof v==='string'){try{const a=JSON.parse(v);return Array.isArray(a)?a:[]}catch(e){return []}}return []};
const str=v=>v==null?'':String(v);
const tidy=v=>str(v).replace(/\r\n/g,'\n').trim();
const picList=v=>(Array.isArray(v)?v:str(v).split(/[,;\n]+/)).map(p=>str(p).trim()).filter(Boolean);
const isUrl=v=>/^https?:\/\//i.test(str(v).trim());
const TOMB='cfg-dcm-tomb';
const tombDoc=()=>{const L=S.oneonone||(S.oneonone=[]);let t=L.find(x=>x.id===TOMB);if(!t){t={id:TOMB,kind:'cfg',ids:[]};L.push(t)}return t};
const docId=id=>str(id).replace(/\//g,'_').slice(0,700);
function hash(o){const s=JSON.stringify(o);let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(36)+':'+s.length}
function dcmStatus(raw){const s=str(raw).toLowerCase();
 if(/not\s*attended|tidak\s*dihadiri/.test(s))return 'Tidak Dihadiri';if(/batal|cancel/.test(s))return 'Dibatalkan';
 if(/complete|done|selesai/.test(s))return 'Selesai';if(/tunda|postpone/.test(s))return 'Ditunda';if(/menunggu|pending/.test(s))return 'Menunggu Konfirmasi';return ''}
const MT2DCM_ST={'Selesai':'Completed','Dibatalkan':'Cancelled','Ditunda':'Postponed','Menunggu Konfirmasi':'Pending','Tidak Dihadiri':'Not Attended'};
function modeOf(v,lok,link){const t=str(v).trim().toLowerCase();
 if(/^(offline|luring|tatap muka|onsite)$/.test(t))return 'offline';if(/^(online|daring|virtual)$/.test(t))return 'online';if(/^(hybrid|hibrid|campuran|blended)$/.test(t))return 'hybrid';
 const fisik=str(lok).trim()&&!isUrl(lok),dar=str(link).trim()||isUrl(lok);return fisik&&dar?'hybrid':dar?'online':fisik?'offline':''}
function jamOf(a){const s=str(a.jamMulai).slice(0,5),e=str(a.jamSelesai).slice(0,5);return s&&e?s+' - '+e:tidy(a.waktu)}
const normJam=v=>tidy(v).replace(/\s*[-–—]\s*/g,' - ').replace(/\./g,':');
/* kunci berkas: DCM refId|url; MT sourceRefId|externalRefId|link. Berkas MT yang belum terkirim/terlalu besar tidak ikut sidik. */
function dcmFileKeys(a,field,urlField){const k=arr(a[field]).map(m=>typeof m==='string'?(isUrl(m)?m:''):str(m&&(m.refId||m.url||m.link))).filter(Boolean);if(urlField&&isUrl(a[urlField]))k.push(str(a[urlField]).trim());return [...new Set(k)].sort()}
function mtFileKeys(att){const k=(att&&Array.isArray(att.items)?att.items:[]).map(m=>m.t==='l'?str(m.link).trim():str(m.sourceRefId||m.externalRefId)).filter(Boolean);return [...new Set(k)].sort()}
const URLF={und:'undanganUrl',st:'suratTugasUrl',materi:'materi'};
/* Bentuk bersama (kanonik) — harus identik untuk DCM & MT bila datanya sama. */
function canonD(a){const lok=a.meetingLocation||a.lokasiChannel||'',link=a.meetingLink||(isUrl(lok)?lok:'');
 const o={nama:tidy(a.namaKegiatan),tgl:str(a.tglMulai).slice(0,10),tglS:str(a.tglSelesai).slice(0,10)||str(a.tglMulai).slice(0,10),jam:normJam(jamOf(a)),kat:tidy(a.kategori),
  lay:/^(ya|yes|y|true|1)$/i.test(str(a.layanan).trim())?'Ya':'Tidak',unit:tidy(a.unitPemohon).replace(/^-$/,''),prog:tidy(a.programTerkait),tujuan:tidy(a.tujuanOutput),catatan:tidy(a.catatan),
  peserta:tidy(a.pesertaTarget),narsum:tidy(a.unitAsalNarsum),pic:picList(a.picTimCM).join(', '),lokasi:tidy(lok),link:tidy(link),mode:modeOf(a.meetingMode,lok,link),
  st:dcmStatus(a.status),undNo:tidy(a.undangan),stNo:tidy(a.suratTugas),notulaTeks:tidy(a.notulaTeks),ringkas:tidy(a.ringkasanHasil),tl:tidy(a.tindakLanjut),f:{}};
 FIELDS.forEach(([k,f])=>o.f[k]=dcmFileKeys(a,f,URLF[k]));return o}
function canonM(x){const und=x.und||{},st=x.st||{};
 const o={nama:tidy(x.nama),tgl:str(x.tgl).slice(0,10),tglS:str(x.tglSelesai).slice(0,10)||str(x.tgl).slice(0,10),jam:normJam(x.jam),kat:tidy(x.kat),
  lay:x.layanan==='Ya'?'Ya':'Tidak',unit:tidy(x.unitP),prog:tidy(x.program),tujuan:tidy(x.tujuan),catatan:tidy(x.catatan),
  peserta:tidy(x.peserta),narsum:tidy(x.narsum),pic:picList(x.pic).join(', '),lokasi:tidy(x.lokasi),link:tidy(x.link),mode:modeOf(x.mode,x.lokasi,x.link),
  st:MT2DCM_ST[x.stat]?x.stat:'',undNo:tidy(und.no),stNo:tidy(st.no),notulaTeks:tidy(x.notulaTeks),ringkas:tidy(x.ringkas),tl:tidy(x.tl),f:{}};
 FIELDS.forEach(([k])=>o.f[k]=mtFileKeys(x[k]));return o}
const MODE_MT={offline:'Offline',online:'Online',hybrid:'Hybrid'};
/* DCM → MT: tulis field bersama ke aktivitas MT x (dibuat bila baru). Berkas MT yang sudah ditarik dipertahankan. */
function applyToMt(x,a){const c=canonD(a);
 x.cmDashboardId=a.id;x.keAkt=true;x.nama=c.nama;x.tgl=c.tgl;x.tglSelesai=c.tglS;x.jam=c.jam;x.kat=c.kat||'Rapat Koordinasi';x.layanan=c.lay;
 x.tahun=+c.tgl.slice(0,4)||x.tahun;x.tw=c.tgl?Math.ceil((+c.tgl.slice(5,7)||1)/3):(x.tw||1);x.no=Number(a.no)||x.no||0;
 x.unitP=c.unit;x.program=c.prog;x.tujuan=c.tujuan;x.catatan=c.catatan;x.peserta=c.peserta;x.narsum=c.narsum;x.pic=picList(a.picTimCM);
 x.lokasi=c.lokasi;x.link=c.link;x.mode=MODE_MT[c.mode]||x.mode||'';x.stat=c.st;x.notulaTeks=str(a.notulaTeks);x.ringkas=c.ringkas;x.tl=c.tl;
 FIELDS.forEach(([k,f])=>{const old=x[k]&&Array.isArray(x[k].items)?x[k].items:[];const byKey=new Map();old.forEach(m=>{const key=m.t==='l'?str(m.link).trim():str(m.sourceRefId||m.externalRefId);if(key)byKey.set(key,m)});
  const items=[];const seen=new Set();
  const push=(key,mk)=>{if(!key||seen.has(key))return;seen.add(key);items.push(byKey.get(key)||mk())};
  arr(a[f]).forEach(m=>{if(typeof m==='string'){if(isUrl(m))push(m.trim(),()=>({t:'l',link:m.trim(),nama:''}));return}
   const url=str(m&&(m.url||m.link)).trim(),ref=str(m&&m.refId),name=str(m&&(m.name||m.fileName||m.nama));
   if(ref)push(ref,()=>({t:'n',nama:name||'Berkas dari Dashboard CM',externalRefId:ref,unresolved:true}));else if(isUrl(url))push(url,()=>({t:'l',link:url,nama:name}))});
  if(URLF[k]&&isUrl(a[URLF[k]]))push(str(a[URLF[k]]).trim(),()=>({t:'l',link:str(a[URLF[k]]).trim(),nama:k==='und'?'Surat undangan':k==='st'?'Surat tugas':'Materi kegiatan'}));
  /* berkas MT yang belum pernah terkirim ke DCM tetap dipertahankan */
  old.forEach(m=>{if((m.t==='f'||m.t==='d')&&!m.sourceRefId&&!m.externalRefId)items.push(m)});
  x[k]={no:k==='und'?c.undNo:k==='st'?c.stNo:str(x[k]&&x[k].no),items}});
 x.dashboardSource=Object.assign({},x.dashboardSource||{},{id:a.id,updatedAt:a.updatedAt||'',kategori:a.kategori||'',sourceFile:'DashboardCM',eoChecklist:a.eoChecklist||'[]'});
 return x}
/* MT → DCM: agenda baru = agenda DCM lama + field bersama dari MT. Field DCM yang tidak dikenal MT dipertahankan. */
function applyToDcm(a0,x,meta){const a=Object.assign({},a0||{});const c=canonM(x);
 a.id=str(a.id||x.cmDashboardId||('MT-'+x.id));a.namaKegiatan=c.nama;a.tglMulai=c.tgl;a.tglSelesai=c.tglS;
 const m=c.jam.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);a.jamMulai=m?m[1].padStart(5,'0'):'';a.jamSelesai=m?m[2].padStart(5,'0'):'';a.waktu=c.jam;
 a.kategori=c.kat;a.layanan=c.lay==='Ya'?'Yes':'No';a.unitPemohon=c.unit;a.programTerkait=c.prog;a.tujuanOutput=c.tujuan;a.catatan=c.catatan;
 a.pesertaTarget=c.peserta;a.unitAsalNarsum=c.narsum;a.picTimCM=c.pic;a.meetingLocation=isUrl(c.lokasi)?'':c.lokasi;a.lokasiChannel=a0&&a0.lokasiChannel===c.lokasi?a0.lokasiChannel:c.lokasi;
 a.meetingLink=c.link;a.meetingMode=c.mode||str(a.meetingMode);
 const keep=dcmStatus(a0&&a0.status);a.status=c.st?MT2DCM_ST[c.st]:(keep?'':str(a0&&a0.status));
 a.undangan=c.undNo;a.suratTugas=c.stNo;a.notulaTeks=str(x.notulaTeks);a.ringkasanHasil=c.ringkas;a.tindakLanjut=c.tl;
 FIELDS.forEach(([k,f])=>{const oldList=arr(a0&&a0[f]);const byKey=new Map();oldList.forEach(o=>{const key=typeof o==='string'?o.trim():str(o&&(o.refId||o.url||o.link));if(key)byKey.set(key,o)});
  const urlF=URLF[k],urlV=urlF&&a0&&isUrl(a0[urlF])?str(a0[urlF]).trim():'';const list=[];let urlKept=false;
  (x[k]&&Array.isArray(x[k].items)?x[k].items:[]).forEach(it=>{
   if(it.t==='l'){const u=str(it.link).trim();if(!u)return;if(u===urlV){urlKept=true;return}list.push(byKey.get(u)||{url:u,name:str(it.nama)||'Tautan'});return}
   const ref=str(it.sourceRefId||it.externalRefId);if(!ref)return;list.push(byKey.get(ref)||{refId:ref,name:str(it.nama)||'Berkas',mime:str(it.type)||'application/octet-stream'})});
  a[f]=k==='notula'?JSON.stringify(list):JSON.stringify(list);if(urlF&&urlV&&!urlKept)a[urlF]=''});
 a.yearMonth=c.tgl.slice(0,7);a.updatedAt=(meta&&meta.at)||new Date().toISOString();a.updatedBy=(meta&&meta.by)||a.updatedBy||null;delete a._search;
 if(!a0){a.no=(meta&&meta.no)||0;a.eoEnabled=false;a.eoChecklist='[]';a.estimasiBiaya=0;a.createdBy=(meta&&meta.by)||null;a.createdAt=a.updatedAt;a.sourceApp='Modul Transformasi'}
 return a}
const mtTime=x=>{const h=(x.hist||[]).map(e=>str(e.t||e.at)).filter(Boolean).sort();return h.length?h[h.length-1]:str(x.cmSync&&x.cmSync.at)};
/* Keputusan per aktivitas. s={d,m} sidik terakhir. */
function decide(a,x,s){const hD=hash(canonD(a)),hM=hash(canonM(x));
 if(hD===hM)return {act:'same',hD,hM};
 if(!s||!s.d)return {act:'toMt',hD,hM,why:'first'};
 const dCh=hD!==s.d,mCh=hM!==s.m;
 if(dCh&&!mCh)return {act:'toMt',hD,hM};if(mCh&&!dCh)return {act:'toDcm',hD,hM};if(!dCh&&!mCh)return {act:'same',hD,hM};
 const tD=str(a.updatedAt),tM=mtTime(x);return {act:tM&&tD&&tM>tD?'toDcm':'toMt',hD,hM,why:'conflict'}}
const pushable=x=>x&&x.kind!=='cfg'&&x.id!=='pub-tim'&&(x.keAkt||(x.kat&&x.kat!=='1-on-1 T-Program'));

/* ---------- runtime ---------- */
const st={app:null,auth:null,db:null,user:null,unsub:null,dcm:new Map(),loaded:false,mig:null,busy:false,dirty:false,timer:null,err:'',last:'',pulling:false,pullFail:new Set(),skipBig:0,stats:{toMt:0,toDcm:0,newMt:0,newDcm:0,del:0}};
const env=()=>typeof window!=='undefined'&&window.firebase&&typeof FB!=='undefined';
function canRun(){try{return env()&&FB.on&&FB.ready&&ME&&['SA','PMOK','CMOK'].includes(ME.role)&&typeof actCanEdit==='function'&&actCanEdit()}catch(e){return false}}
const isOn=()=>{try{return localStorage.getItem(LS_ON)==='1'}catch(e){return false}};
function setOn(v){try{v?localStorage.setItem(LS_ON,'1'):localStorage.removeItem(LS_ON)}catch(e){}}
function status(){if(!isOn())return {k:'off',t:'Belum terhubung'};if(st.err)return {k:'err',t:st.err};if(!st.user)return {k:'wait',t:'Menunggu login akun Dashboard CM'};if(!st.loaded)return {k:'wait',t:'Memuat data Dashboard CM…'};return {k:'ok',t:'Aktif'+(st.last?' · sinkron terakhir '+st.last:'')}}
function badge(){const b=document.querySelector('.act-dbk');if(b){const s=status();b.dataset.sync=s.k;b.title='Sinkron Dashboard CM: '+s.t}}
function ensureApp(){if(st.app)return;st.app=firebase.apps.find(a=>a.name==='dcm')||firebase.initializeApp(DCM_CFG,'dcm');st.auth=st.app.auth();st.db=st.app.firestore();
 st.auth.onAuthStateChanged(u=>{st.user=u&&!u.isAnonymous?u:null;if(st.user&&isOn())listen();else detach();badge()})}
async function connect(){if(!canRun())throw new Error('Sinkron hanya dapat dijalankan Superadmin/PMO/CMO Kemenkeu yang terhubung ke Firestore Modul Transformasi.');
 ensureApp();setOn(true);st.err='';if(!st.user){const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});await st.auth.signInWithPopup(p)}else listen();badge()}
function disconnect(){setOn(false);detach();st.err='';try{st.auth&&st.auth.signOut()}catch(e){}badge()}
function detach(){if(st.unsub){st.unsub();st.unsub=null}st.loaded=false;st.dcm.clear()}
async function listen(){if(st.unsub||!st.user)return;st.err='';
 try{const m=await st.db.collection('dashboard').doc(MIG_DOC).get();let mig=null;try{mig=m.exists?JSON.parse(m.data().value||'null'):null}catch(e){}
  if(!mig||!mig.done){st.err='Dashboard CM belum memakai penyimpanan per aktivitas (cmActivities). Buka Dashboard CM dengan akun Tim CM sekali agar migrasi otomatis berjalan.';badge();return}st.mig=mig}
 catch(e){st.err=/permission/i.test(e.code||e.message||'')?'Akun Google ini tidak punya akses ke data Dashboard CM.':'Gagal membaca Dashboard CM: '+(e.message||e);badge();return}
 st.unsub=st.db.collection(COLL).onSnapshot(snap=>{snap.docChanges().forEach(ch=>{if(ch.type==='removed'){st.dcm.delete(ch.doc.id);return}const d=ch.doc.data();if(!d||!d.v)return;try{const a=JSON.parse(d.v);if(a&&a.id)st.dcm.set(ch.doc.id,a)}catch(e){}});
  st.loaded=true;st.err='';kick()},err=>{st.err=/permission/i.test(err.code||err.message||'')?'Akun Google ini tidak punya akses ke koleksi aktivitas Dashboard CM.':'Sinkron terputus: '+(err.message||err);detach();badge()})}
function kick(){st.dirty=true;clearTimeout(st.timer);st.timer=setTimeout(run,1200)}
const me=()=>(st.user&&st.user.email)||(ME&&ME.email)||'';
async function writeDcm(a){await st.db.collection(COLL).doc(docId(a.id)).set({v:JSON.stringify(a),updatedAt:a.updatedAt,updatedBy:me()});st.dcm.set(docId(a.id),a)}
async function delDcm(id){await st.db.collection(COLL).doc(docId(id)).delete();st.dcm.delete(docId(id))}
/* kirim berkas MT yang belum ada di DCM (≤600 KB) sebelum agenda dikirim */
async function pushFiles(x,dcmId){let n=0;for(const [k] of FIELDS){const att=x[k];if(!att||!Array.isArray(att.items))continue;
 for(const it of att.items){if(it.sourceRefId||it.externalRefId||it.dcmSkip)continue;
  try{let blob=null;if(it.t==='f')blob=await fileLoad(it);else if(it.t==='d'&&it.data){const r=await fetch(it.data);blob=await r.blob()}else continue;
   if(!blob||blob.size>PUSH_MAX){it.dcmSkip='size';st.skipBig++;continue}
   const dataUrl=await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>rej(fr.error);fr.readAsDataURL(blob)});
   const ref='MTF-'+(it.id||Math.random().toString(36).slice(2,10));
   await st.db.collection('dashboardImages').doc(ref).set({dataUrl,name:it.nama||'Berkas',mime:it.type||blob.type||'application/octet-stream',activityId:dcmId,createdAt:new Date().toISOString(),sourceApp:'Modul Transformasi'});
   it.sourceRefId=ref;n++}catch(e){console.warn('[Sinkron DCM] berkas MT gagal dikirim',it.nama,e)}}}return n}
/* tarik berkas DCM yang belum tersimpan di MT */
async function pullFiles(){if(st.pulling)return;st.pulling=true;let n=0;
 try{for(const x of (S.oneonone||[])){if(!x.cmDashboardId)continue;for(const [k] of FIELDS){const att=x[k];if(!att||!Array.isArray(att.items))continue;
   for(let i=0;i<att.items.length;i++){const it=att.items[i];if(it.t!=='n'||!it.externalRefId||st.pullFail.has(it.externalRefId))continue;
    try{const d=await st.db.collection('dashboardImages').doc(it.externalRefId).get();if(!d.exists)throw new Error('tidak ada');const v=d.data()||{};const r=await fetch(String(v.dataUrl||''));const blob=await r.blob();
     const name=String(v.name||it.nama||'Lampiran').replace(/[\\/\x00-\x1f]/g,'_').slice(0,180);const saved=await fileStore(new File([blob],name,{type:v.mime||blob.type||'application/octet-stream'}));
     saved.sourceRefId=it.externalRefId;att.items[i]=Object.assign(saved,{nama:it.nama&&it.nama!=='Berkas dari Dashboard CM'?it.nama:name});n++;if(n%5===0)save()}
    catch(e){st.pullFail.add(it.externalRefId)}}}}}
 finally{st.pulling=false;if(n){save();if(typeof render==='function')render()}}}
async function run(){if(st.busy){st.dirty=true;return}if(!st.loaded||!canRun()||!isOn())return;st.busy=true;st.dirty=false;
 const s0={toMt:0,toDcm:0,newMt:0,newDcm:0,del:0};let changed=false;
 try{const mt=S.oneonone||(S.oneonone=[]);const byD=new Map();mt.forEach(x=>{if(x.cmDashboardId)byD.set(str(x.cmDashboardId),x)});
  const tomb=new Set((((S.oneonone||[]).find(x=>x.id===TOMB)||{}).ids)||[]);const at=new Date().toISOString(),by=me();
  /* 1) rencanakan */
  const plan=[];
  st.dcm.forEach(a=>{const x=byD.get(str(a.id))||mt.find(z=>z.id==='cm-import-'+str(a.id).replace(/[^a-zA-Z0-9_-]/g,''));
   if(!x){plan.push(tomb.has(str(a.id))?{k:'delDcm',a}:{k:'newMt',a});return}
   if(!x.cmDashboardId)x.cmDashboardId=a.id;const d=decide(a,x,x.cmSync);plan.push(Object.assign({k:d.act,a,x},d))});
  const dIds=new Set([...st.dcm.values()].map(a=>str(a.id)));
  mt.forEach(x=>{if(!pushable(x))return;if(!x.cmDashboardId){plan.push({k:'newDcm',x});return}
   if(dIds.has(str(x.cmDashboardId)))return;const s=x.cmSync;if(!s||!s.d)return;
   plan.push(hash(canonM(x))===s.m?{k:'delMt',x}:{k:'newDcm',x})});
  const nDelMt=plan.filter(p=>p.k==='delMt').length,nDelDcm=plan.filter(p=>p.k==='delDcm').length,nNewDcm=plan.filter(p=>p.k==='newDcm').length;
  if((nDelMt>DEL_GUARD||nDelDcm>DEL_GUARD||nNewDcm>NEW_GUARD)&&!st.okDel){st.err='Sinkron dijeda untuk ditinjau: '+[nDelMt>DEL_GUARD?nDelMt+' aktivitas akan dihapus dari Modul Transformasi':'',nDelDcm>DEL_GUARD?nDelDcm+' aktivitas akan dihapus dari Dashboard CM':'',nNewDcm>NEW_GUARD?nNewDcm+' aktivitas MT akan dibuat di Dashboard CM':''].filter(Boolean).join(', ')+'. Buka Data & Backup › Sinkron Dashboard CM.';st.pendingDel={nDelMt,nDelDcm,nNewDcm};badge();return}
  st.okDel=false;st.pendingDel=null;
  /* 2) jalankan */
  let no=Math.max(0,...[...st.dcm.values()].map(a=>+a.no||0));
  for(const p of plan){
   if(p.k==='same'){const s=p.x.cmSync||{};if(s.d!==p.hD||s.m!==p.hM){p.x.cmSync={d:p.hD,m:p.hM,at};changed=true}continue}
   if(p.k==='toMt'||p.k==='newMt'){const x=p.x||{id:'cm-import-'+str(p.a.id).replace(/[^a-zA-Z0-9_-]/g,''),keAkt:true};applyToMt(x,p.a);if(!p.x)mt.push(x);
    x.cmSync={d:hash(canonD(p.a)),m:hash(canonM(x)),at};changed=true;p.k==='newMt'?s0.newMt++:s0.toMt++;continue}
   if(p.k==='toDcm'||p.k==='newDcm'){const x=p.x,isNew=p.k==='newDcm';const id=str(x.cmDashboardId||('MT-'+x.id));x.cmDashboardId=id;
    if(await pushFiles(x,id))changed=true;const a0=isNew?null:p.a;const a=applyToDcm(a0,x,{at,by,no:isNew?++no:undefined});await writeDcm(a);
    x.cmSync={d:hash(canonD(a)),m:hash(canonM(x)),at};changed=true;isNew?s0.newDcm++:s0.toDcm++;continue}
   if(p.k==='delMt'){const i=mt.indexOf(p.x);if(i>-1){mt.splice(i,1);changed=true;s0.del++}continue}
   if(p.k==='delDcm'){await delDcm(p.a.id);s0.del++}}
  if(tomb.size){const t=tombDoc();t.ids=[...tomb].filter(id=>dIds.has(id)&&!plan.some(p=>p.k==='delDcm'&&str(p.a.id)===id));changed=true}
  Object.keys(s0).forEach(k=>st.stats[k]+=s0[k]);st.last=new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});st.err='';
  const moved=s0.toMt+s0.toDcm+s0.newMt+s0.newDcm+s0.del;if(moved)console.info('[Sinkron DCM]',s0);
 }catch(e){st.err='Sinkron gagal: '+(e&&e.message||e);console.warn('[Sinkron DCM]',e)}
 finally{st.busy=false;if(changed){save();if(typeof render==='function')render()}badge();if(st.dirty)kick();else pullFiles()}}

/* ---------- integrasi MT ---------- */
function hook(){
 if(typeof window.save==='function'&&!window.save.__dcm){const orig=window.save;const w=function(){const r=orig.apply(this,arguments);if(st.loaded&&!st.busy)kick();return r};w.__dcm=1;window.save=w;try{save=w}catch(e){}}
 if(typeof window.remoteRender==='function'&&!window.remoteRender.__dcm){const o=window.remoteRender;const w=function(){if(st.loaded&&!st.busy)kick();return o.apply(this,arguments)};w.__dcm=1;window.remoteRender=w;try{remoteRender=w}catch(e){}}
 if(typeof window.render==='function'&&!window.render.__dcm){const o=window.render;const w=function(){const r=o.apply(this,arguments);try{badge()}catch(e){}return r};w.__dcm=1;window.render=w;try{render=w}catch(e){}}
 if(typeof ACT!=='undefined'&&ACT.oneDel&&!ACT.oneDel.__dcm){const o=ACT.oneDel;ACT.oneDel=function(el){const x=(S.oneonone||[]).find(v=>v.id===el.dataset.id);const dId=x&&x.cmDashboardId;const r=o.apply(this,arguments);
   if(dId){const t=setInterval(()=>{if(!(S.oneonone||[]).some(v=>v.cmDashboardId===dId)){clearInterval(t);const t=tombDoc();t.ids=[...new Set([...(t.ids||[]),str(dId)])];save()}},400);setTimeout(()=>clearInterval(t),60000)}return r};ACT.oneDel.__dcm=1}}
function panel(){const s=status(),on=isOn();const t=st.stats;
 const body=`<div class="dcs"><p class="dcs-st ${s.k}"><b>Status:</b> ${esc(s.t)}</p>
  <p class="s" style="margin:0 0 10px">Aktivitas yang ditambah, diubah, atau dihapus di Dashboard CM otomatis masuk ke Modul Transformasi, dan sebaliknya. Bila diubah di kedua tempat bersamaan, perubahan terbaru yang dipakai (seri: Dashboard CM). Sinkron berjalan selama halaman Modul Transformasi ini terbuka.</p>
  ${st.user?`<p class="s" style="margin:0 0 6px">Akun Dashboard CM: <b>${esc(st.user.email||'')}</b></p>`:''}
  ${st.loaded?`<p class="s" style="margin:0 0 6px">${st.dcm.size} aktivitas di Dashboard CM · sesi ini: ${t.toMt+t.newMt} masuk ke MT, ${t.toDcm+t.newDcm} dikirim ke DCM, ${t.del} dihapus${st.skipBig?` · ${st.skipBig} berkas MT &gt; 600 KB tidak dikirim (batas Dashboard CM)`:''}.</p>`:''}
  ${st.pendingDel?`<div class="dcs-warn">Sinkron dijeda untuk ditinjau: <b>${st.pendingDel.nDelMt}</b> aktivitas akan dihapus dari Modul Transformasi, <b>${st.pendingDel.nDelDcm}</b> dari Dashboard CM (karena sudah dihapus di sisi lain), dan <b>${st.pendingDel.nNewDcm}</b> aktivitas MT akan dibuat di Dashboard CM. <button class="btn sm" data-dcs="okdel">Lanjutkan</button></div>`:''}
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">${on?`<button class="btn" data-dcs="now">Sinkronkan sekarang</button><button class="btn" data-dcs="off">Putuskan</button>`:`<button class="btn pri" data-dcs="on">Hubungkan akun Google Dashboard CM</button>`}</div></div>`;
 const ov=modal('Sinkron Aktivitas Dashboard CM',body,null,null,{size:'sm',cancel:'Tutup'});
 const host=(ov&&ov.querySelector)?ov:document;host.addEventListener('click',async e=>{const b=e.target.closest('[data-dcs]');if(!b)return;const k=b.dataset.dcs;
  try{if(k==='on'){b.disabled=true;await connect();toast('Terhubung ke Dashboard CM. Sinkron berjalan.')}else if(k==='off'){disconnect();toast('Sinkron Dashboard CM diputus.')}else if(k==='now'){kick()}else if(k==='okdel'){st.okDel=true;kick()}}
  catch(err){toast('Gagal menghubungkan: '+(err&&err.message||err));b.disabled=false}
  document.querySelectorAll('.ov').forEach(o=>{if(o.querySelector('.dcs'))o.remove()});setTimeout(panel,k==='now'||k==='okdel'?1800:300)})}
function boot(){hook();if(!isOn())return;const go=()=>{if(canRun()){ensureApp();if(st.user)listen()}else setTimeout(go,3000)};go()}
if(typeof window!=='undefined'){window.MTDCM={canonD,canonM,applyToMt,applyToDcm,decide,hash,dcmStatus,pushable,panel,status,run,st};
 if(typeof ACT!=='undefined')ACT.actDcmSync=()=>panel();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1500));else setTimeout(boot,1500)}
if(typeof module!=='undefined')module.exports={canonD,canonM,applyToMt,applyToDcm,decide,hash,dcmStatus,pushable};
})();
