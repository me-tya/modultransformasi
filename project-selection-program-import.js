/* Project Selection — Impor Usulan Program dari Excel (template "Impor Usulan Program").
   Sheet: Program (wajib), Proyek, Milestone, Kriteria. Kunci penghubung = Nama Program.
   Aturan bisnis:
   - Satu baris Program = satu Usulan Program (Draft) + Charter Program (p.psProgramCharter).
   - Program dengan nama + tahun sama diperbarui bila belum Ditetapkan/Arsip; selain itu dibuat baru.
   - Charter yang sudah tidak berstatus Draft (mis. Disahkan) tidak ditimpa.
   - Proyek dicocokkan per nama di dalam program; kode proyek dibentuk ulang oleh MT_PS_SCOPE.
   - Kode Program Resmi opsional; tidak boleh sama dengan program lain pada tahun yang sama.
   - PMO Unit hanya boleh mengimpor program dengan UIC Utama = unitnya. */
(function(){
'use strict';
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const uid=t=>(t||'id')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const year=()=>+S.ui.psSelectedYear||+S.ui.tahun||2026;
const T=v=>String(v==null?'':v).replace(/\r/g,'').trim();
const key=v=>T(v).toLowerCase().replace(/\s+/g,' ');
const lines=v=>T(v).split('\n').map(x=>x.replace(/^\s*(?:[•▪●◦\-–]|\d+[.)])\s*/,'').trim()).filter(Boolean);
const norm=h=>String(h||'').toLowerCase().replace(/\*/g,'').replace(/\s+/g,' ').trim();
const COLS={
 Program:{no:'no',tahun:'tahun',nama:'nama program',kodeResmi:'kode program resmi',jenis:'jenis program',uic:'uic utama',pend:'uic pendukung',
  champion:'initiative champion',owner:'initiative owner',p1:'periode mulai',p2:'periode selesai',tujuan:'tujuan program',lb:'latar belakang',tb:'terobosan',
  out:'output',oc:'outcome',ris:'risiko',pk:'pendukung kesuksesan',klaster:'klaster',sumber:'kode is sumber',catatan:'catatan impor'},
 Proyek:{no:'no',tahun:'tahun',prog:'nama program',kodeIS:'kode is',name:'nama proyek',psAcronym:'akronim',applicationName:'nama aplikasi',
  mainFunction:'fungsi utama / modul',subModule:'sub modul',url:'url aplikasi',category:'kategori',uic:'uic utama',pend:'uic pendukung',
  pic:'pic / initiative owner',status:'status usulan',tujuan:'tujuan proyek',lb:'latar belakang',urgency:'urgensi',legalBasis:'landasan hukum',
  strategyAlignment:'strategi organisasi yang didukung',businessProcess:'proses bisnis terkait',businessNarrative:'narasi proses bisnis',
  features:'fitur utama',out:'output',oc:'outcome',kp:'kriteria penyelesaian',batiiIdentification:'identifikasi tim batii',
  probisConfirmation:'konfirmasi pemilik proses bisnis',start:'rencana mulai',goLive:'target go-live',
  initiativeType:'jenis inisiatif',businessOwner:'unit pemilik proses bisnis',spbeDomain:'domain arsitektur spbe',estimatedCost:'estimasi biaya (rp)',durationMonths:'estimasi durasi (bulan)',estimatedStaff:'kebutuhan sdm (orang)',description:'deskripsi aplikasi / modul'},
 Milestone:{prog:'nama program',y:'tahun',t:'milestone',g:'kelompok wbs',kodeIS:'kode is'},
 Kriteria:{prog:'nama program',m:'milestone',k:'kriteria penyelesaian',kodeIS:'kode is'}
};
const REQUIRED={Program:['nama','tahun','uic'],Proyek:['prog','name','uic'],Milestone:['prog','y','t'],Kriteria:['prog','m']};
const JENIS=['Berkelanjutan','Tematik','Lainnya'],STATUS=['Usulan','Berjalan','Ditunda','Selesai'];
/* Jenis Program longgar: 'Program Tematik', 'berkelanjutan (OA)', dsb. dikenali; nilai lain → Lainnya (bukan galat). */
const jenisOf=v=>{const k=key(v);if(!k)return '';return JENIS.find(j=>key(j)===k)||JENIS.find(j=>k.includes(key(j)))||(/lanjut|sustain/.test(k)?'Berkelanjutan':/tema/.test(k)?'Tematik':'Lainnya')};
const CAT=['Core APBN','Core Non APBN','Office Automation','APBN','Non APBN','Manajemen Birokrasi'];
const TEXT_FIELDS=['applicationName','mainFunction','subModule','urgency','legalBasis','strategyAlignment','businessProcess','businessNarrative','batiiIdentification','probisConfirmation','initiativeType','businessOwner','spbeDomain'];
const ESTIMATE_FIELDS=['estimatedCost','durationMonths','estimatedStaff'];
function estimateOf(v,k){
 const t=T(v);if(!t)return '';
 if(!/^\d+(?:[.,]\d+)?$/.test(t))return null;
 if(k!=='durationMonths'&&!/^\d+$/.test(t))return null;
 const n=Number(t.replace(',','.'));return Number.isFinite(n)&&(k==='durationMonths'?n>0:Number.isSafeInteger(n)&&n>=0)?n:null;
}
const MON={jan:1,feb:2,mar:3,apr:4,mei:5,may:5,jun:6,jul:7,agu:8,aug:8,agt:8,sep:9,okt:10,oct:10,nov:11,des:12,dec:12};
/* Tanggal → YYYY-MM-DD. Menerima 2027-03-01, 01/03/2027 (hari/bulan/tahun), Mar 2027, 2027-03, serial Excel. '' bila kosong, null bila tak dikenali. */
function dateOf(v){
 v=T(v);if(!v)return '';let m;const pad=n=>String(n).padStart(2,'0'),ok=(y,mo,d)=>y>=2000&&y<=2100&&mo>=1&&mo<=12&&d>=1&&d<=31?y+'-'+pad(mo)+'-'+pad(d):null;
 if((m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)))return ok(+m[1],+m[2],+m[3]);
 if((m=v.match(/^(\d{4})[-\/.](\d{1,2})$/)))return ok(+m[1],+m[2],1);
 if((m=v.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/))){const y=+m[3]<100?2000+ +m[3]:+m[3];return ok(y,+m[2],+m[1])}
 if((m=v.match(/^(?:(\d{1,2})\s+)?([A-Za-z]{3})[a-z]*\.?\s+(\d{4})$/))&&MON[m[2].toLowerCase()])return ok(+m[3],MON[m[2].toLowerCase()],+(m[1]||1));
 if(/^\d{5}$/.test(v)){const d=new Date(Date.UTC(1899,11,30)+(+v)*864e5);return ok(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate())}
 return null;
}
const acr=v=>String(v||'').toUpperCase().normalize('NFKD').replace(/[^A-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,18);
const editableProgram=p=>!(p.psStatus==='Ditetapkan'||p.arsip||p.psListStatus==='Arsip');
/* Validasi + normalisasi satu baris proyek. */
function checkProject(x,p,y){
 const problems=[],notes=[];
 if(!x.name)problems.push('Nama Proyek kosong');
 if(!x.uic)problems.push('UIC kosong');
 const start=dateOf(x.start),goLive=dateOf(x.goLive);
 if(start===null)problems.push('Rencana Mulai tidak dikenali');
 if(goLive===null)problems.push('Target Go-Live tidak dikenali');
 if(start&&goLive&&goLive<start)problems.push('Go-Live sebelum Rencana Mulai');
 const category=x.category?CAT.find(c=>key(c)===key(x.category)):'';
 if(x.category&&!category)problems.push('Kategori tidak dikenal');
 if(x.status&&!STATUS.some(s=>key(s)===key(x.status)))notes.push('Status "'+x.status+'" diganti Usulan');
 if(x.url&&!/^https?:\/\//i.test(x.url))problems.push('URL harus diawali http(s)://');
 const estimates={};for(const k of ESTIMATE_FIELDS){const n=estimateOf(x[k],k);if(n===null)problems.push(COLS.Proyek[k]+' tidak valid');else if(n!=='')estimates[k]=n}
 const old=p?(p.psProjects||[]).find(z=>key(z.name)===key(x.name)||(x.kodeIS&&z.psSourceIS===x.kodeIS)):null;
 return {...x,...estimates,start:start||'',goLive:goLive||'',category:category||'',psAcronym:acr(x.psAcronym),problem:problems.join(', '),notes,old,
  action:problems.length?'Galat':old?'Perbarui':'Baru'};
}
const me=()=>{try{return typeof ME!=='undefined'?ME:null}catch(_){return null}};
const canRole=()=>!!me()&&['SA','PMOK','PMOU'].includes(me().role);

/* aoa: {Program:[[header...],[row...]], Proyek:[...], ...} → objek per sheet */
function tables(aoa){
 const out={},errors=[];
 Object.keys(COLS).forEach(name=>{
  const sheetKey=Object.keys(aoa||{}).find(k=>norm(k)===norm(name));
  const data=sheetKey?aoa[sheetKey]:null;
  if(!data||!data.length){out[name]=[];return}
  const head=(data[0]||[]).map(norm),map={};
  Object.entries(COLS[name]).forEach(([k,label])=>{const i=head.indexOf(label);if(i>=0)map[k]=i});
  const miss=REQUIRED[name].filter(k=>map[k]==null);
  if(miss.length){errors.push('Sheet "'+name+'" tidak memiliki kolom: '+miss.map(k=>COLS[name][k]).join(', ')+'.');out[name]=[];return}
  out[name]=data.slice(1).map((r,i)=>{const o={_row:i+2};Object.entries(map).forEach(([k,ix])=>o[k]=T(r[ix]));return o})
   .filter(o=>Object.keys(COLS[name]).some(k=>k!=='no'&&o[k]));
 });
 if(!(out.Program||[]).length&&!(out.Proyek||[]).length&&!errors.length)errors.push('Sheet "Program" atau "Proyek" tidak ditemukan/kosong. Gunakan template Impor Usulan Program.');
 return {out,errors};
}
function findProgram(name,y){
 return (S.programs||[]).find(p=>+p.psYear===+y&&key(p.nama)===key(name));
}
/* Menyusun rencana impor tanpa mengubah S. */
function plan(aoa){
 const {out,errors}=tables(aoa),items=[],warn=[],seen=new Set(),codes=new Map();
 const byProg=sheet=>{const m=new Map();(out[sheet]||[]).forEach(r=>{const k=key(r.prog);if(!m.has(k))m.set(k,[]);m.get(k).push(r)});return m};
 const PR=byProg('Proyek'),MS=byProg('Milestone'),KR=byProg('Kriteria');
 (out.Program||[]).forEach(r=>{
  const it={row:r._row,src:r,problems:[],notes:[]};items.push(it);
  const y=+r.tahun,k=key(r.nama);
  if(!r.nama)it.problems.push('Nama Program kosong');
  if(!(y>=2024&&y<=2099))it.problems.push('Tahun tidak valid');
  if(!r.uic)it.problems.push('UIC Utama kosong');
  if(seen.has(k+'|'+y))it.problems.push('Nama Program ganda dalam berkas');seen.add(k+'|'+y);
  const code=T(r.kodeResmi).toUpperCase();
  if(code){
   if(codes.has(y+'|'+code))it.problems.push('Kode Program Resmi ganda dalam berkas');codes.set(y+'|'+code,1);
  }
  if(r.jenis&&!JENIS.some(j=>key(j)===key(r.jenis)))it.notes.push('Jenis Program "'+r.jenis+'" dibaca sebagai '+jenisOf(r.jenis));
  if(me()&&me().role==='PMOU'&&me().unit&&r.uic&&r.uic!==me().unit)it.problems.push('PMO Unit hanya dapat mengimpor program dengan UIC '+me().unit);
  const existing=r.nama&&y?findProgram(r.nama,y):null;
  if(code&&(S.programs||[]).some(p=>p!==existing&&+p.psYear===y&&String(p.kodeResmi||'').trim().toUpperCase()===code))it.problems.push('Kode Program Resmi sudah dipakai program lain');
  it.existing=existing||null;
  it.action=it.problems.length?'Galat':!existing?'Baru':(existing.psStatus==='Ditetapkan'||existing.arsip||existing.psListStatus==='Arsip')?'Dilewati':'Perbarui';
  if(it.action==='Dilewati')it.notes.push('Program sudah ditetapkan/diarsipkan');
  if(y&&y!==year())it.notes.push('Tahun '+y+' berbeda dengan tahun aktif '+year());
  it.projects=(PR.get(k)||[]).map(x=>checkProject(x,existing,y));
  const dupA=new Map();it.projects.forEach(x=>{if(x.psAcronym){if(dupA.has(x.psAcronym)&&!x.problem)x.problem='Akronim ganda dalam program';dupA.set(x.psAcronym,1)}if(x.problem)x.action='Galat'});
  it.ms=(MS.get(k)||[]).filter(x=>x.t);
  it.kp=(KR.get(k)||[]).filter(x=>x.m);
  const pc=it.existing?.psProgramCharter;
  it.charterLocked=!!(pc&&pc.st&&pc.st!=='Draft');
  if(it.charterLocked)it.notes.push('Charter berstatus '+pc.st+' tidak ditimpa');
  if(it.projects.some(x=>x.problem))it.notes.push(it.projects.filter(x=>x.problem).length+' baris proyek tidak lengkap dilewati');
  if(r.catatan)it.notes.push(r.catatan);
 });
 const known=new Set((out.Program||[]).map(r=>key(r.nama)));
 /* Baris Proyek yang programnya tidak ada di sheet Program → ditambahkan ke program yang sudah ada di aplikasi. */
 const extra=new Map();
 (out.Proyek||[]).forEach(r=>{
  if(!r.prog||known.has(key(r.prog)))return;
  const y=+r.tahun||year(),g=key(r.prog)+'|'+y;
  if(!extra.has(g))extra.set(g,{y,name:r.prog,rows:[]});extra.get(g).rows.push(r);
 });
 extra.forEach(g=>{
  const p=findProgram(g.name,g.y);
  if(!p){g.rows.forEach(r=>warn.push('Sheet Proyek baris '+r._row+': program "'+r.prog+'" tahun '+g.y+' tidak ada di sheet Program maupun di aplikasi.'));return}
  const it={row:g.rows[0]._row,src:{nama:p.nama,tahun:g.y,uic:p.uic,kodeResmi:p.kodeResmi||''},problems:[],notes:['Hanya menambah/memperbarui proyek pada program yang sudah ada'],existing:p,projectsOnly:true,ms:[],kp:[],charterLocked:true};
  if(!editableProgram(p))it.problems.push('Program sudah ditetapkan/diarsipkan');
  if(me()&&me().role==='PMOU'&&me().unit&&p.uic&&p.uic!==me().unit)it.problems.push('PMO Unit hanya dapat mengubah program dengan UIC '+me().unit);
  it.projects=g.rows.map(x=>checkProject(x,p,g.y));
  if(it.projects.some(x=>x.problem))it.notes.push(it.projects.filter(x=>x.problem).length+' baris proyek tidak lengkap dilewati');
  it.action=it.problems.length?'Galat':'Proyek';
  items.push(it);
 });
 ['Milestone','Kriteria'].forEach(s=>(out[s]||[]).forEach(r=>{if(r.prog&&!known.has(key(r.prog)))warn.push('Sheet '+s+' baris '+r._row+': Nama Program "'+r.prog+'" tidak ada di sheet Program.')}));
 return {items,errors,warn};
}
function charterFrom(it,p){
 const r=it.src,y=+r.tahun,base=p.psProgramCharter||{};
 const p1=+r.p1||y,p2=Math.max(p1,+r.p2||p1);
 const kpMap=new Map();
 it.kp.forEach(x=>{const k=key(x.m);if(!kpMap.has(k))kpMap.set(k,{m:x.m,k:[]});kpMap.get(k).k.push(...lines(x.k))});
 return {
  id:base.id||'program-charter-'+p.id,prog:p.akr,tahun:y,ver:base.ver||1,st:'Draft',
  judul:r.nama,tujuan:lines(r.tujuan).length>1?lines(r.tujuan).join('\n'):T(r.tujuan),
  lb:lines(r.lb),tb:lines(r.tb).join('\n'),out:lines(r.out),oc:lines(r.oc),p1,p2,
  ms:it.ms.map(x=>({y:String(+x.y||x.y),t:x.t,g:x.g||''})),
  ris:lines(r.ris),pk:lines(r.pk),ch:T(r.champion),ow:lines(r.owner).length?lines(r.owner):[r.uic].filter(Boolean),
  asis:base.asis||{pb:'',masalah:'',kor:[],tek:'',link:''},tobe:base.tobe||{pb:[],pot:[],ar:'',link:'',arLink:''},
  cs:base.cs||[],kp:[...kpMap.values()],mf:base.mf||[],
  /* Rencana kerja: bila belum ada, satu tindakan per milestone sepanjang tahunnya (format Charter Plain RKMK). */
  rk:(base.rk&&base.rk.length)?base.rk:it.ms.filter(x=>+x.y).slice().sort((a,b)=>+a.y-+b.y).map(x=>({t:x.t,s:(+x.y)+'-01',e:(+x.y)+'-12',u:r.uic||'',pd:r.pend||''})),doc:base.doc||{link:''},
  log:[...(base.log||[]),{t:new Date().toISOString(),by:me()?.email||'',act:'Impor Excel'}]
 };
}
function projectFrom(x,p,old){
 const base=projectBase(x,p,old);
 TEXT_FIELDS.forEach(k=>{if(x[k])base[k]=k==='mainFunction'||k==='subModule'||k==='applicationName'?T(x[k]):lines(x[k]).length>1?lines(x[k]).map(v=>'• '+v).join('\n'):T(x[k])});
 for(const k of ESTIMATE_FIELDS)if(x[k]!=null&&x[k]!=='')base[k]=x[k];
 if(x.description)base.description=T(x.description);
 if(x.features)base.features=lines(x.features).map(v=>'• '+v).join('\n');
 if(x.url)base.url=x.url;if(x.category)base.category=x.category;
 if(x.start)base.start=x.start;if(x.goLive)base.goLive=x.goLive;
 if(x.psAcronym)base.psAcronym=x.psAcronym;
 return base;
}
function projectBase(x,p,old){
 const desc=[T(x.tujuan),lines(x.lb).length?'Latar belakang:\n'+lines(x.lb).map(v=>'• '+v).join('\n'):''].filter(Boolean).join('\n\n');
 const st=STATUS.find(s=>key(s)===key(x.status))||old?.status||'Usulan';
 return Object.assign(old||{id:uid('proj'),included:true,scores:{},poster:{},risks:{},indicators:[],benefits:[],psOriginYear:null},{
  name:x.name,uic:x.uic,pic:x.pic||old?.pic||'',status:st,description:desc||old?.description||'',
  outputs:lines(x.out).join('\n')||old?.outputs||'',outcome:lines(x.oc).join('\n')||old?.outcome||'',accepted:lines(x.kp).join('\n')||old?.accepted||'',
  psSupportUic:x.pend||old?.psSupportUic||'',psSourceIS:x.kodeIS||old?.psSourceIS||'',psImportedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),updatedBy:me()?.email||''});
}
/* Menerapkan rencana ke S.programs. Mengembalikan ringkasan. */
function apply(pl,meta,target){
 const done={created:0,updated:0,skipped:0,projects:0,ids:[]};
 const programs=target||(S.programs=S.programs||[]);
 pl.items.forEach(it=>{
  if(it.action==='Proyek'){
   const p=it.existing;p.psProjects=p.psProjects||[];
   it.projects.filter(x=>!x.problem).forEach(x=>{const old=p.psProjects.find(z=>z===x.old)||null;const z=projectFrom(x,p,old);if(!old)p.psProjects.push(z);done.projects++});
   try{window.MT_PS_SCOPE?.normalizeProjectCodes?.(p)}catch(_){}
   p.psUpdatedAt=new Date().toISOString();done.ids.push(p.id);done.touched=(done.touched||0)+1;return;
  }
  if(it.action!=='Baru'&&it.action!=='Perbarui'){done.skipped++;return}
  const r=it.src,y=+r.tahun,code=T(r.kodeResmi).toUpperCase();
  let p=it.existing;
  if(!p){
   p={id:uid('program'),akr:'PS'+y+'-'+uid('p'),psYear:y,psDraft:true,psStatus:'Draft',psListStatus:'Baru',psThreshold:80,psPrioritize:false,
    psProjects:[],psWeights:{},psGovernanceV:1,psBenefits:[],psStakeholders:[],psRiskRegister:[],status:'Perencanaan'};
   programs.push(p);done.created++;
  }else done.updated++;
  const jenis=jenisOf(r.jenis);if(r.jenis&&jenis!==r.jenis)p.psJenisSumber=r.jenis;
  const p1=+r.p1||y,p2=Math.max(p1,+r.p2||p1);
  Object.assign(p,{nama:r.nama,uic:r.uic,pend:r.pend||p.pend||'',sponsor:r.champion||p.sponsor||'',
   psObjective:T(r.tujuan)||p.psObjective||'',psBackground:lines(r.lb).map(v=>'• '+v).join('\n')||p.psBackground||'',
   psStrategy:lines(r.tb).map(v=>'• '+v).join('\n')||p.psStrategy||'',psOutcome:lines(r.oc).map(v=>'• '+v).join('\n')||p.psOutcome||'',
   psThemes:[r.klaster,r.sumber?'IS '+r.sumber:''].filter(Boolean).join(' · ')||p.psThemes||'',
   mulai:p1,periode:p1+'–'+p2,psYear:y,psUpdatedAt:new Date().toISOString(),psUpdatedBy:me()?.email||'',
   psImport:{source:meta?.file||'Excel',sheet:'Program',row:it.row,sourceIS:r.sumber||'',at:new Date().toISOString(),by:me()?.email||''}});
  if(jenis)p.jenis=jenis;else if(!p.jenis)p.jenis='';
  if(code){p.kodeResmi=code;if(!p.kode||it.action==='Baru')p.kode=code}
  else if(!p.kode)p.kode='';
  p.psProjects=p.psProjects||[];
  it.projects.filter(x=>!x.problem).forEach(x=>{
   const old=p.psProjects.find(z=>z===x.old)||p.psProjects.find(z=>key(z.name)===key(x.name));
   const z=projectFrom(x,p,old);if(!old)p.psProjects.push(z);done.projects++;
  });
  try{window.MT_PS_SCOPE?.normalizeProjectCodes?.(p)}catch(_){}
  if(!it.charterLocked)p.psProgramCharter=charterFrom(it,p);
  done.ids.push(p.id);
 });
 return done;
}
/* Stage on copies; never publish an unconfirmed import to the live app. */
function stageImport(pl,meta){
 const copies=new Map(),base=new Map();
 const copy=p=>{
  if(!p)return null;
  if(!copies.has(p.id)){
   copies.set(p.id,JSON.parse(JSON.stringify(p)));
   base.set(String(p.id),JSON.parse(JSON.stringify(p)));
  }
  return copies.get(p.id);
 };
 const items=pl.items.map(it=>{
  const existing=copy(it.existing);
  return {...it,existing,projects:it.projects.map(x=>({...x,old:x.old&&existing?(existing.psProjects||[]).find(z=>String(z.id)===String(x.old.id))||null:null}))};
 });
 const programs=Array.from(copies.values());
 const result=apply({...pl,items},meta,programs);
 let order=(S.programs||[]).reduce((m,p)=>Math.max(m,+p._o||0),0);
 const docs=Array.from(new Set(result.ids.map(String))).map(id=>{
  const p=programs.find(x=>String(x.id)===id);
  if(!p)throw Error('Program hasil impor tidak ditemukan.');
  if(p._o==null)p._o=++order;
  return {id,name:p.nama,before:base.get(id)||null,after:p};
 });
 return {result,docs};
}
const canonical=p=>p==null?null:stab(fsClean(p));
function validateStage(stage){
 if(!stage.docs.length)throw Error('Tidak ada program yang dapat disimpan.');
 if(stage.docs.length>100)throw Error('Maksimal 100 program per impor. Pecah berkas menjadi beberapa bagian.');
 let bytes=0;
 for(const d of stage.docs){
  if(!d.id||d.id.includes('/'))throw Error('ID program tidak valid: '+d.name);
  const size=new TextEncoder().encode(canonical(d.after)).length;
  if(size>950000)throw Error('Dokumen '+d.name+' terlalu besar untuk batas Firestore 1 MB. Kurangi isi atau pecah program.');
  bytes+=size;
 }
 if(bytes>8000000)throw Error('Ukuran seluruh impor terlalu besar. Pecah berkas menjadi beberapa bagian.');
}
async function commitStage(stage,db){
 validateStage(stage);
 const records=stage.docs.map(d=>({...d,ref:db.collection('programs').doc(d.id),expected:canonical(d.before),desired:canonical(d.after)}));
 await db.runTransaction(async tx=>{
  // All reads first, then writes. Keep retries idempotent and reject concurrent edits.
  const snaps=await Promise.all(records.map(d=>tx.get(d.ref)));
  records.forEach((d,i)=>{
   const remote=snaps[i].exists?canonical(snaps[i].data()):null;
   if(remote!==d.expected&&remote!==d.desired)
    throw Error('Konflik data server: '+d.name+'. Data server berbeda. Buka ulang impor setelah data terbaru dimuat.');
  });
  records.forEach((d,i)=>{
   const remote=snaps[i].exists?canonical(snaps[i].data()):null;
   if(remote!==d.desired)tx.set(d.ref,JSON.parse(d.desired));
  });
 });
 return records;
}
function publishConfirmed(records){
 S.programs=S.programs||[];
 FB.last.programs=FB.last.programs||{};
 for(const d of records){
  const i=S.programs.findIndex(x=>String(x.id)===d.id),old=i<0?null:S.programs[i];
  const local=canonical(old);
  // Real-time listener may already have delivered this or a newer version.
  if(local!==d.expected&&local!==d.desired)continue;
  if(local!==d.desired){
   const confirmed=JSON.parse(d.desired);
   if(old){Object.keys(old).forEach(k=>delete old[k]);Object.assign(old,confirmed)}
   else S.programs.push(confirmed);
  }
  const last=FB.last.programs[d.id];
  if(last==null||last===d.expected||last===d.desired)FB.last.programs[d.id]=d.desired;
 }
 if(typeof MODC!=='undefined')MODC=null;
 if(typeof WIDX!=='undefined')WIDX=null;
}
/* ---------- Unduh template ---------- */
function templateBook(){
 const X=window.XLSX,wb=X.utils.book_new();
 const FIX={Uic:'UIC',Pic:'PIC',Is:'IS',Wbs:'WBS',Url:'URL',Batii:'BaTii',Dan:'dan',Yang:'yang'};
 const head=s=>Object.values(COLS[s]).map(h=>h.replace(/\b\w/g,m=>m.toUpperCase()).replace(/\b[A-Z][a-z]+\b/g,w=>FIX[w]||w));
 const ex={
  Program:[[1,year(),'Contoh Program Transformasi','','Berkelanjutan','BaTii','DJPb, DJP','Menteri Keuangan','Kepala Badan Teknologi, Informasi, dan Intelijen Keuangan',year(),year()+2,'Tujuan program…','• Latar belakang 1\n• Latar belakang 2','• Terobosan 1','• Output 1','• Outcome 1','• Risiko 1','• Pendukung 1','','','']],
  Proyek:[[1,year(),'Contoh Program Transformasi','','Contoh Proyek','CONTOH','Nama aplikasi','Fungsi utama','','https://…','Non APBN','BaTii','DJPb','PIC proyek','Usulan','Tujuan proyek…','• Latar belakang','• Urgensi','Landasan hukum','Strategi yang didukung','Proses bisnis level 3/4/5','Narasi proses bisnis','• Fitur 1','• Output','• Outcome','Milestone — kriteria','','',year()+'-01-01',year()+'-12-31','Pengembangan','Unit pemilik probis','Aplikasi',150000000,12,5,'Deskripsi aplikasi/modul…']],
  Milestone:[['Contoh Program Transformasi',year(),'Milestone tahun pertama','','']],
  Kriteria:[['Contoh Program Transformasi','Milestone tahun pertama','Kriteria penyelesaian…','']]
 };
 Object.keys(COLS).forEach(s=>{const ws=X.utils.aoa_to_sheet([head(s),...ex[s]]);ws['!cols']=head(s).map(h=>({wch:Math.max(12,Math.min(44,h.length+8))}));X.utils.book_append_sheet(wb,ws,s)});
 const pet=X.utils.aoa_to_sheet([['PETUNJUK IMPOR USULAN PROGRAM'],['Satu baris sheet Program = satu Usulan Program + Charter Program. Nama Program menjadi kunci ke sheet Proyek, Milestone, dan Kriteria.'],
  ['Kolom wajib: Program (Tahun, Nama Program, UIC Utama); Proyek (Nama Program, Nama Proyek, UIC Utama); Milestone (Nama Program, Tahun, Milestone); Kriteria (Nama Program, Milestone).'],
  ['Sheet Proyek langsung masuk ke Pemetaan Proyek › Usulan Proyek. Baris Proyek yang Nama Programnya tidak ada di sheet Program ditambahkan ke program tahun tsb yang sudah ada di aplikasi (sheet Program boleh kosong). Akronim kosong = dibuat otomatis; Kode Proyek = kode program + akronim.'],
  ['Kategori: '+CAT.join(' / ')+'. Tanggal (Rencana Mulai, Target Go-Live) ditulis YYYY-MM-DD.'],
  ['Kolom baru bersifat opsional. Biaya dalam Rupiah dan SDM dalam orang: angka bulat tanpa pemisah ribuan. Durasi dalam bulan (>0; desimal diperbolehkan). Kosong berarti belum diestimasi; impor kosong tidak menghapus estimasi lama.'],
  ['Isian daftar ditulis satu butir per baris (Alt+Enter). Jenis Program: Berkelanjutan/Tematik/Lainnya. Status Usulan: Usulan/Berjalan/Ditunda/Selesai.'],
  ['Program dengan nama dan tahun sama diperbarui (selama belum Ditetapkan/Arsip). Charter yang sudah disahkan tidak ditimpa. Hapus baris contoh sebelum mengimpor.']]);
 pet['!cols']=[{wch:130}];X.utils.book_append_sheet(wb,pet,'Petunjuk');
 return wb;
}
function downloadTemplate(){
 if(!window.XLSX){toast('Pustaka Excel belum termuat. Periksa koneksi internet lalu muat ulang.');return}
 XLSX.writeFile(templateBook(),'Template_Impor_Usulan_Program_'+year()+'.xlsx');
}
function projectExportBook(entries){
 const X=window.XLSX,wb=X.utils.book_new();
 const header=Object.values(COLS.Proyek);
 const data=entries.map(({p,x},i)=>{
  const values={...x,no:i+1,tahun:p.psYear||year(),prog:p.nama,kodeIS:x.psSourceIS||'',pend:x.psSupportUic||'',uic:x.uic||p.uic||'',status:x.status||'Usulan',out:x.outputs||'',oc:x.outcome||'',kp:x.accepted||''};
  return Object.keys(COLS.Proyek).map(k=>values[k]??'');
 });
 const sheet=X.utils.aoa_to_sheet([header,...data]);sheet['!cols']=header.map(h=>({wch:Math.max(12,Math.min(44,h.length+8))}));
 X.utils.book_append_sheet(wb,sheet,'Proyek');return wb;
}
function exportProjects(entries){
 if(!window.XLSX){toast('Pustaka Excel belum termuat. Muat ulang aplikasi.');return}
 if(!entries.length){toast('Tidak ada usulan proyek untuk diekspor.');return}
 window.XLSX.writeFile(projectExportBook(entries),'Usulan_Proyek_'+year()+'.xlsx');
}
/* ---------- UI ---------- */
let current=null;
function readFile(file){
 return new Promise((res,rej)=>{
  if(!window.XLSX)return rej(new Error('Pustaka Excel belum termuat. Periksa koneksi internet lalu muat ulang.'));
  const fr=new FileReader();fr.onerror=()=>rej(new Error('Berkas tidak dapat dibaca.'));
  fr.onload=()=>{try{const wb=XLSX.read(new Uint8Array(fr.result),{type:'array',cellDates:true});const aoa={};
   wb.SheetNames.forEach(n=>aoa[n]=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:'',raw:false,dateNF:'yyyy-mm-dd',blankrows:false}));res(aoa)}catch(e){rej(new Error('Format berkas tidak dikenali.'))}};
  fr.readAsArrayBuffer(file);
 });
}
const tag=a=>'<span class="psimp-tag psimp-'+({Baru:'new',Perbarui:'upd',Proyek:'upd',Dilewati:'skip',Galat:'err'}[a]||'skip')+'">'+E(a==='Proyek'?'Tambah proyek':a)+'</span>';
function previewCode(it,x,i){
 const base=String(it.existing?.kode||it.src.kodeResmi||'').toUpperCase();
 let a=x.psAcronym||x.old?.psAcronym;try{a=a||window.MT_PS_SCOPE?.suggestedAcronym?.(x.name)}catch(_){}
 a=a||'(otomatis)';return base?base+'-'+a:a;
}
function projectTable(it){
 if(!it.projects.length)return '';
 return '<tr class="psimp-sub"><td></td><td colspan="8"><details><summary>'+it.projects.length+' proyek → Pemetaan Proyek › Usulan Proyek</summary><table class="psimp-ptable"><thead><tr><th title="Kode Proyek = kode program + akronim; dibentuk saat diterapkan">Kode / Akronim</th><th>Nama Proyek</th><th>Kategori</th><th>UIC</th><th>Mulai</th><th>Go-Live</th><th>Status</th><th>Aksi</th></tr></thead><tbody>'+
  it.projects.map((x,i)=>'<tr><td><b>'+E(previewCode(it,x,i))+'</b>'+(x.kodeIS?'<small>IS '+E(x.kodeIS)+'</small>':'')+'</td><td>'+E(x.applicationName||x.name||'—')+'</td><td>'+E(x.category||'—')+'</td><td>'+E(x.uic||'—')+'</td><td>'+E(x.start||'—')+'</td><td>'+E(x.goLive||'—')+'</td><td>'+E(STATUS.find(s=>key(s)===key(x.status))||'Usulan')+'</td><td>'+tag(x.action)+(x.problem?'<small class="psimp-perr">'+E(x.problem)+'</small>':'')+'</td></tr>').join('')+
  '</tbody></table></details></td></tr>';
}
function body(){
 const c=current;
 const pick='<div class="psimp-pick"><div><b>1. Siapkan berkas</b><span>Gunakan template Impor Usulan Program (sheet Program, Proyek, Milestone, Kriteria).</span></div><button type="button" class="btn" data-psimp="template">↓ Unduh Template</button>'+
  '<div><b>2. Pilih berkas Excel</b><span>'+(c?.file?E(c.file):'Belum ada berkas dipilih')+'</span></div><button type="button" class="btn pri" data-psimp="pick">Pilih Berkas…</button><input type="file" accept=".xlsx,.xls" data-psimp-file hidden></div>';
 if(!c?.plan)return pick+'<div class="psimp-empty">Pratinjau tampil setelah berkas dipilih. Data belum disimpan sebelum Anda menekan <b>Terapkan Impor</b>.</div>';
 const pl=c.plan,n=a=>pl.items.filter(x=>x.action===a).length,np=pl.items.filter(x=>['Baru','Perbarui','Proyek'].includes(x.action)).reduce((s,x)=>s+x.projects.filter(z=>!z.problem).length,0);
 let h=pick;
 if(pl.errors.length)h+='<div class="psimp-alert err">'+pl.errors.map(E).join('<br>')+'</div>';
 h+='<div class="psimp-stats"><div><b>'+pl.items.length+'</b><span>Baris program</span></div><div><b>'+n('Baru')+'</b><span>Program baru</span></div><div><b>'+n('Perbarui')+'</b><span>Diperbarui</span></div><div><b>'+np+'</b><span>Proyek dipetakan</span></div><div><b>'+(n('Galat')+n('Dilewati'))+'</b><span>Dilewati</span></div></div>';
 h+='<div class="psimp-tablewrap"><table class="psimp-table"><thead><tr><th>Baris</th><th>Program</th><th>Tahun</th><th>UIC</th><th>Proyek</th><th>Milestone</th><th>Kriteria</th><th>Aksi</th><th>Catatan</th></tr></thead><tbody>'+
  pl.items.map(it=>'<tr><td>'+it.row+'</td><td><b>'+E(it.src.nama||'—')+'</b>'+(it.src.kodeResmi?'<small>'+E(it.src.kodeResmi)+'</small>':'')+'</td><td>'+E(it.src.tahun)+'</td><td>'+E(it.src.uic||'—')+'</td><td>'+it.projects.filter(z=>!z.problem).length+'</td><td>'+it.ms.length+'</td><td>'+it.kp.length+'</td><td>'+tag(it.action)+'</td><td class="psimp-note">'+
   E([...it.problems,...it.notes].join(' · ')||'—')+'</td></tr>'+projectTable(it)).join('')+'</tbody></table></div>';
 if(pl.warn.length)h+='<details class="psimp-warn"><summary>'+pl.warn.length+' baris rujukan tidak cocok</summary><div>'+pl.warn.map(E).join('<br>')+'</div></details>';
 return h;
}
function paint(){
 const ov=document.querySelector('.psimp-overlay');if(!ov)return;
 ov.querySelector('main').innerHTML=body();
 const ok=current?.plan&&current.plan.items.some(x=>['Baru','Perbarui','Proyek'].includes(x.action));
 const b=ov.querySelector('[data-psimp="apply"]');if(b)b.disabled=!ok;
}
function open(preset){
 if(!canRole()){toast('Impor program hanya untuk Superadmin, PMO Kemenkeu, dan PMO Unit.');return}
 if(document.querySelector('.psimp-overlay[data-saving="1"]')){toast('Impor sedang disimpan ke Firebase.');return}
 document.querySelectorAll('.psimp-overlay').forEach(x=>x.remove());current=null;
 let pendingStage=null,saving=false;
 const ov=document.createElement('div');ov.className='pswf-overlay psimp-overlay';
 ov.innerHTML='<section class="pswf-modal psimp-modal" role="dialog" aria-modal="true" aria-label="Impor Usulan Program"><header><h2>Impor Usulan Program · '+year()+'</h2><button type="button" data-psimp="close" aria-label="Tutup">✕</button></header><main></main><footer><button class="btn" type="button" data-psimp="close">Batal</button><button class="btn pri" type="button" data-psimp="apply" disabled>Terapkan Impor</button></footer></section>';
 document.body.appendChild(ov);
 ov.addEventListener('click',async ev=>{
  const a=ev.target.closest('[data-psimp]')?.dataset.psimp;
  if(saving)return;
  if(ev.target===ov||a==='close'){ov.remove();return}
  if(a==='template')downloadTemplate();
  else if(a==='pick')ov.querySelector('[data-psimp-file]').click();
  else if(a==='apply'){
   if(!current?.plan)return;
   const b=ov.querySelector('[data-psimp="apply"]'),main=ov.querySelector('main');
   const status=main.querySelector('[data-psimp-status]')||document.createElement('div');
   if(!status.isConnected){status.dataset.psimpStatus='1';status.setAttribute('role','status');main.prepend(status)}
   const inform=(msg,bad)=>{status.className='psimp-alert'+(bad?' err':'');status.textContent=msg};
   const configured=typeof fbCfg==='function'&&!!fbCfg();
   const online=typeof FB!=='undefined'&&FB.on&&FB.ready&&FB.db&&FB.auth?.currentUser;
   if(configured&&!online){inform('Firebase belum tersambung. Impor belum diterapkan. Periksa status koneksi Database dan coba lagi.',true);return}
   saving=true;ov.dataset.saving='1';b.disabled=true;b.textContent='Menyimpan…';
   ov.querySelectorAll('[data-psimp="pick"],[data-psimp-file]').forEach(el=>el.disabled=true);
   try{
    let res;
    if(online){
     if(!pendingStage){
      const fresh=current.aoa?plan(current.aoa):current.plan;
      const fingerprint=pl=>JSON.stringify(pl.items.map(it=>[it.row,it.action,it.charterLocked,it.existing?.id,it.projects.map(x=>[x.action,x.problem,x.old?.id])]));
      if(fingerprint(fresh)!==fingerprint(current.plan))throw Error('Rencana impor berubah karena data diperbarui. Pilih kembali berkas untuk memeriksa pratinjau.');
      pendingStage=stageImport(fresh,{file:current.file});
     }
     inform('Menyimpan '+pendingStage.docs.length+' program ke Firebase. Jangan tutup halaman.',false);
     const records=await commitStage(pendingStage,FB.db);
     publishConfirmed(records);res=pendingStage.result;
    }else{
     res=apply(current.plan,{file:current.file});
     if(typeof save==='function')save();
    }
    S.ui.psSelectedYear=S.ui.psSelectedYear||year();S.ui.psBank=S.ui.psBank||{};S.ui.psBank.tab='detail';S.ui.psBank.detailPage=1;
    if(online){try{localStorage.setItem(KEY+'_ui',JSON.stringify(S.ui))}catch(_){}}
    ov.remove();if(typeof render==='function')render();
    toast(res.created+' program baru, '+res.updated+' diperbarui'+(res.touched?', '+res.touched+' program ditambah proyek':'')+', '+res.projects+' proyek masuk Pemetaan Proyek'+(res.skipped?'; '+res.skipped+' baris dilewati':'')+(online?'. Terkonfirmasi tersimpan ke Firestore.':'. Tersimpan lokal saja; tidak tersinkron ke Firebase.'));
   }catch(err){
    const msg=typeof fbErr==='function'?fbErr(err):err.message||String(err);
    inform('Impor belum terkonfirmasi tersimpan ke Firebase: '+msg+'. '+(pendingStage?'Gunakan Ulangi Sinkronisasi untuk mencoba lagi dengan ID program yang sama.':'Periksa koneksi dan coba lagi.'),true);
    b.textContent=pendingStage?'Ulangi Sinkronisasi':'Terapkan Impor';
   }finally{
    saving=false;delete ov.dataset.saving;b.disabled=false;
    ov.querySelectorAll('[data-psimp="pick"],[data-psimp-file]').forEach(el=>el.disabled=false);
   }
  }
 });
 ov.addEventListener('change',async ev=>{
  const f=ev.target.closest('[data-psimp-file]');if(saving||!f||!f.files[0])return;
  pendingStage=null;ov.querySelector('[data-psimp="apply"]').textContent='Terapkan Impor';
  const file=f.files[0];
  try{const aoa=await readFile(file);current={file:file.name,aoa,plan:plan(aoa)};paint()}
  catch(e){current={file:file.name,plan:null};paint();toast(e.message||'Berkas gagal dibaca.')}
 });
 ov.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!saving)ov.remove()});
 if(preset?.aoa)current={file:preset.file||'',aoa:preset.aoa,plan:plan(preset.aoa)};
 paint();
}
document.addEventListener('click',ev=>{if(ev.target.closest?.('[data-bank-import]')){ev.preventDefault();open()}});
window.MT_PS_IMPORT={plan,apply,stageImport,commitStage,tables,templateBook,projectExportBook,exportProjects,open,downloadTemplate,dateOf,version:'20261126-import-sync-v3'};
})();
