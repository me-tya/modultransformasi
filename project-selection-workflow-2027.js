/* Project Selection 2027-2029 — alur end-to-end, reuse dokumen dan draft WBS.
   Modul ini memakai data & fungsi native PM, bukan database terpisah. */
(function(){
'use strict';
if(!window.MT_PROJECT_SELECTION)return;
const B=window.MT_PROJECT_SELECTION,I=B.internals||{};
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const clone=x=>JSON.parse(JSON.stringify(x));
const uid=k=>(k||'ps')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const can=p=>!!ME&&['SA','PMOK','PMOU'].includes(ME.role)&&(!p||ME.role!=='PMOU'||!p.uic||p.uic===ME.unit);
const yr=()=>+S.ui.psSelectedYear||+S.ui.tahun||2026;
const state=()=>{const u=I.state();const map={portfolio:'usulan',program:'usulan',projects:'mapping',criteria:'prioritasi',reference:'prioritasi'};if(map[u.tab])u.tab=map[u.tab];if(u.tab==='penetapan')u.tab='penetapan-program';if(!['usulan','mapping','prioritasi','charter','penetapan-program','rkmk','peta'].includes(u.tab))u.tab='usulan';return u};
const list=()=>I.programs();
const current=()=>I.pickedProgram();
const ws=()=>{S.ui.ps27=S.ui.ps27||{sourceYear:2026,selected:[],search:'',sub:'identity',filterOpen:false};return S.ui.ps27};
const TABS=[['usulan','Usulan Program'],['mapping','Pemetaan Proyek'],['prioritasi','Prioritasi'],['charter','Charter Program'],['penetapan-program','Penetapan Program'],['rkmk','Draft RKMK']];
const ISTK_TABS=TABS.filter(t=>t[0]!=='prioritasi').map(t=>t[0]==='rkmk'?['rkmk','Draft RKMK ISTK']:t);
function laneNav(active){
 const choices=[['istk','ISTK','Program & Proyek ISTK'],['non','Non-ISTK','Clearance Proyek Non ISTK']];
 return '<div class="ps27-header-lane"><span class="ps27-lane-label">Jalur</span><div class="ps27-lane-seg" role="group" aria-label="Jalur Project Selection">'+choices.map(([k,label,tip])=>'<button type="button" class="'+(active===k?'on':'')+'" aria-pressed="'+(active===k)+'" data-ps27-lane="'+k+'" title="'+E(tip)+'" aria-label="'+E(tip)+'">'+E(label)+'</button>').join('')+'</div><div class="ps27-lane-seg" role="group" aria-label="Peta Rencana bersama"><button type="button" class="'+(active==='peta'?'on':'')+'" aria-pressed="'+(active==='peta')+'" data-ps27-lane="peta" title="Konsolidasi ISTK dan Non-ISTK">Peta Rencana</button></div></div>';
}
function switchLane(lane){
 if(yr()<2027||!['istk','non','peta'].includes(lane))return;
 const u=state(),w=ws();
 if(lane==='peta'){if(u.tab!=='peta')navigate('peta');return;}
 if(lane==='non'){if(u.tab==='prioritasi')return;if(ISTK_TABS.some(x=>x[0]===u.tab))w.istkLastTab=u.tab;navigate('prioritasi');}
 else {if(ISTK_TABS.some(x=>x[0]===u.tab))return;const t=ISTK_TABS.some(x=>x[0]===w.istkLastTab)?w.istkLastTab:'usulan';u.tab=t;save();render();}
}
function sourcePrograms(){const y=+ws().sourceYear;return (S.programs||[]).filter(p=>{if(p.psYear)return +p.psYear===y;const yrs=String(p.periode||'').match(/20\d{2}/g)||[];const start=+p.mulai||+(yrs[0]||0),end=+(yrs[yrs.length-1]||start);return start&&start<=y&&end>=y});}
function sourceWbs(p,y){return (S.wbs||[]).filter(w=>w.prog===p.akr&&!w.arsip&&+(String(w.f||w.s||'').slice(0,4))===+y);}
function shiftDate(v,from,to){return typeof v==='string'&&new RegExp('^'+from+'-\\d{2}-\\d{2}').test(v)?String(to)+v.slice(4):v;}
function alpha(num){let r='';do{r=String.fromCharCode(65+num%26)+r;num=Math.floor(num/26)-1}while(num>=0);return r;}
function nextAkr(){let i=0,k;do{k='C'+alpha(Date.now()%456976+i++);}while(S.programs.some(p=>p.akr===k)||(S.wbs||[]).some(w=>w.prog===k));return k;}
function foundCharter(p,y){const arr=(S.charters||[]).filter(c=>c.prog===p.akr&&c.st!=='Arsip');return arr.find(c=>+c.p1<=y&&+c.p2>=y)||arr.find(c=>+c.p1===y)||arr[0]||null;}
function sourceProjects(src,y){
 const a=Array.isArray(src.psProjects)?clone(src.psProjects):[];
 if(a.length)return a;
 const rows=(()=>{const g={};sourceWbs(src,y).forEach(w=>{const core=src.akr==='CORE'&&/pengembangan integrated core system apbn kemenkeu/i.test((w.p||[])[2]||'')&&(w.p||[])[3];const n=core?w.p[3]:((w.p||[])[2]||(w.p||[])[1]||'(tanpa kelompok)');if(!g[n])g[n]={n,uic:String(w.u||src.uic||'').split(/[,(]/)[0].trim(),s:w.s||'',f:w.f||''};});return Object.values(g)})();
 return rows.map(x=>({id:uid('proj'),name:x.n||x.name,uic:x.uic||src.uic,pic:'',users:'',goLive:x.f||'',start:x.s||'',outputs:'',status:'Usulan',included:true,scores:{},poster:{},risks:{},indicators:[],benefits:[]}));
}
function newRkmk(p,source){
 const old=p.psRkmk?clone(p.psRkmk):null;if(old&&Object.keys(old).length)return old;
 const ref=source||foundCharter(p,2025)||foundCharter(p,2026);
 const txt=v=>Array.isArray(v)?v.map(x=>typeof x==='string'?x:(x.t||x.m||x.nama||'')).filter(Boolean).join('\n'):String(v||'');
 return {
  latar:txt(ref&&ref.lb)||p.psBackground||'',
  tujuan:txt(ref&&ref.tujuan)||p.psObjective||'',
  kondisi:txt(ref&&ref.asis&&ref.asis.pb)||'',
  target:txt(ref&&ref.tobe&&ref.tobe.pb)||p.psOutcome||'',
  strategi:txt(ref&&ref.tb)||p.psStrategy||'',
  output:txt(ref&&ref.out)||'',
  manfaat:txt(ref&&ref.oc)||p.psBenefits?.map(x=>x.name).join('\n')||'',
  milestone:txt(ref&&ref.ms)||p.psRoadmap||'',
  risiko:txt(ref&&ref.ris)||p.psRisks||''
 };
}
function cloneProgram(src,from,to){
 const p=clone(src);p.id=uid('program');p.akr=nextAkr();
 // Identitas teknis tetap di p.id/p.akr. Kode resmi wajib diisi, tidak ditebak dari jenis/tahun.
 p.kode='';p.kodeResmi='';p.nama=src.nama;p.psYear=to;p.mulai=to;p.periode=to+'–'+to;p.psStatus='Draft';p.psDraft=true;p.status='Perencanaan';p.psListStatus='Legacy';p.arsip=false;delete p.psArchivedAt;delete p.psArchivedBy;delete p.psArchiveReason;delete p.psArchiveEvidence;delete p.psArchiveYear;delete p.psArchivePeriod;delete p.psArchiveSource;delete p.psHistoricalTkdBackfill;delete p.psHistoricalClosedYear;delete p.closing;p.psGovernanceV=1;
 p.psCarry={sourceId:src.id,sourceAkr:src.akr,sourceYear:from,createdAt:new Date().toISOString(),reviewed:false};
 p.psSnapshots=[];p.psSelectedProjectIds=[];delete p.psFinalizedAt;delete p.psFinalizedBy;delete p.psWbsSynced;
 p.psProjects=sourceProjects(src,from).map(x=>{x.sourceProjectId=x.id;x.id=uid('proj');x.included=x.included!==false;x.status='Usulan';if(x.start)x.start=shiftDate(x.start,from,to);if(x.goLive)x.goLive=shiftDate(x.goLive,from,to);return x});
 window.MT_PS_SCOPE?.normalizeProjectCodes?.(p);
 /* Carry-over copies the project directory, not historical WBS. Plan new WBS in Project Management. */
 p.psWbsDraft=[];p.psCarry.wbsNotCarried=true;
 const ch=foundCharter(src,from);
 if(ch){
  const c=clone(ch);c.id=uid('charter');c.prog=p.akr;c.ver=1;c.st='Draft';c.p1=to;c.p2=to;c.kpY=to;c.log=[];delete c.disahkanAt;delete c.disahkanBy;
  ['ms','rk'].forEach(k=>{if(Array.isArray(c[k]))c[k].forEach(row=>{if(+row.y===+from)row.y=to;if(row.s)row.s=shiftDate(row.s,from,to);if(row.f)row.f=shiftDate(row.f,from,to)})});
  S.charters=S.charters||[];S.charters.push(c);
  p.psCarry.charterSourceYear=from;
 }
 const c25=(S.charters||[]).find(c=>c.prog===src.akr&&c.st!=='Arsip'&&+c.p1<=2025&&+c.p2>=2025)||null;
 p.psRkmk=newRkmk(p,c25||ch);
 p.psRkmkSource=c25?'Charter 2025':ch?'Charter '+from:'Data program '+from+' (narasi 2025 tidak tersedia)';
 p.psRkmkReviewed={};
 return p;
}
function carrySelected(){
 if(!can()){toast('Akses tambah program tidak tersedia.');return}
 const from=+ws().sourceYear,to=yr(),ids=new Set(ws().selected||[]);
 if(from===to){toast('Tahun sumber dan tahun tujuan harus berbeda. Pilih tahun tujuan pada header aplikasi.');return}
 if(from>to){toast('Tahun sumber tidak boleh lebih baru daripada tahun tujuan.');return}
 const arr=sourcePrograms().filter(p=>ids.has(String(p.id)));if(!arr.length){toast('Pilih minimal satu program sumber.');return}
 let n=0,docs=0;arr.forEach(src=>{
  if((S.programs||[]).some(p=>+p.psYear===to&&p.psCarry?.sourceId===src.id)){return}
  const p=cloneProgram(src,from,to);S.programs.push(p);n++;docs+=(S.charters||[]).some(c=>c.prog===p.akr)?1:0;state().prog=p.id;
 });
 if(!n){toast('Program terpilih sudah pernah dibawa ke tahun '+to+'.');return}
 ws().selected=[];ws().usulanSub='daftar';state().tab='usulan';save();render();
 toast(n+' program disalin sebagai Draft '+to+' beserta '+docs+' charter. WBS baru disusun di Project Management.');
}
function count(p){return p?(p.psProjects||[]).length:0;}
const TOP_HELP={
 usulan:'Susun usulan program: Riwayat Program hanya referensi untuk menyalin data, sedangkan penambahan dan penyuntingan substansi dilakukan di Usulan Program.',
 mapping:'Gunakan Riwayat Proyek untuk mengambil referensi proyek lintas tahun ke program tujuan tanpa mengubah WBS atau realisasi historis. Lengkapi usulan di tab berikutnya.',
 prioritasi:'Untuk 2027 ke atas, gate dan penilaian hanya berlaku bagi Non-ISTK. Hasil clearance final menjadi masukan Peta Rencana bersama.',
 charter:'Susun Charter Program dan rencana kerja sebagai dasar usulan program lintas unit.',
 'penetapan-program':'Kelola target output program TW I–IV dan kontrak kinerja K-Wide, lalu tetapkan program beserta seluruh proyek terpilih dalam satu submenu. WBS disusun setelah penetapan.',
 rkmk:'Susun dan reviu narasi Draft RKMK berdasarkan sumber program untuk tahun aktif.'
};
function navItem(tab,label,num){const on=state().tab===tab;return '<button type="button" role="tab" aria-selected="'+on+'" class="'+(on?'on':'')+'" data-ps27-tab="'+tab+'"><span>'+label+'</span>'+(num?'<b>'+num+'</b>':'')+'</button>';}
function localFilter(){
 const b=S.ui.psBank||(S.ui.psBank={}),u=state(),key=u.tab==='usulan'?'usulan:'+(b.tab||'bank'):u.tab;
 b.filterScopes=b.filterScopes||{};
 const f=b.filterScopes[key]||(b.filterScopes[key]={search:'',status:'all',program:'',year:u.tab==='usulan'&&(b.tab||'bank')==='bank'?'all':String(yr())});
 if(key!=='usulan:bank' && String(f.year)!==String(yr()) && /^20\d{2}$/.test(String(yr())))f.year=String(yr());
 return f;
}
function setFilterField(key,val){
 const b=S.ui.psBank||(S.ui.psBank={}),f=localFilter();
 f[key]=val; // Never alter filter state in another menu or in the application header.
 if(key==='search')b.search=val;
 if(key==='status')b.filterStatus=val;
 if(key==='year'){
  b.filterYear=val;
  b.bankPage=1;
  if(/^20\d{2}$/.test(String(val))){
   S.ui.psSelectedYear=Number(val);
   // All year-specific steps refer to the same active year; history retains "all".
   Object.entries(b.filterScopes||{}).forEach(([scope,entry])=>{
    if(scope!=='usulan:bank'&&entry&&entry!==f&&/^20\d{2}$/.test(String(entry.year||'')))entry.year=String(val);
   });
   const u=state();
   const active=(S.programs||[]).filter(p=>+p.psYear===Number(val));
   if(u.prog&&!active.some(p=>String(p.id)===String(u.prog)))u.prog='';
   if(b.target&&!active.some(p=>String(p.id)===String(b.target)))b.target='';
  }
 }
}
// Kolom Cari di samping tab (mt-filter-kit.js) — state tetap di lingkup filter tab aktif.
if(typeof window!=='undefined'){
 window.MT_TABSEARCH_SET=window.MT_TABSEARCH_SET||{};
 const pageReset=()=>{const b=S.ui.psBank||(S.ui.psBank={});b.bankPage=1;b.detailPage=1;};
 window.MT_TABSEARCH_SET['ps-usulan']=v=>{setFilterField('search',v);pageReset();};
 window.MT_TABSEARCH_SET['ps-proposal']=v=>{setFilterField('search',v);};
 window.MT_TABSEARCH_SET['ps-prioritasi']=v=>{setFilterField('search',v);};
 window.MT_TABSEARCH_SET['ps-history']=v=>{const m=window.MT_PS_SCOPE?.bank?.();if(m){m.historySearch=v;m.historySelected=[]}};
}
function filter(p){
 const b=S.ui.psBank||(S.ui.psBank={}),u=state(),f=localFilter(),w=ws(),stage=u.tab,sub=stage==='usulan'?(b.tab||'bank'):stage==='mapping'?(window.MT_PS_SCOPE?.bank?.()?.mappingTab||'history'):'';
 const years=[2025,2026,2027,2028,2029],isProgramHistory=stage==='usulan'&&sub==='bank';
 const y=String(f.year||yr()),unit=String(f.unit||'all'),status=String(f.status||'all');
 // Program Bank still uses these fields, but Project Selection no longer uses TW-based filtering.
 if(stage==='usulan'){
  b.search=f.search||'';b.filterYear=y;b.filterStatus=status;
  b.filterUnit=unit;b.filterRole=f.unitRole||'all';b.filterPeriod='all';b.filterRangeFrom='';b.filterRangeTo='';
  b.filterOrigin=f.origin||'all';
  b.filterReady=f.ready||'all';
  // Usulan memakai Asal, bukan dropdown Program; cegah filter tersisa yang tersembunyi.
  f.program='';b.filterProgram='';b.detailProgram='';
 }
 const allPrograms=stage==='usulan'&&sub==='bank'?(S.programs||[]):list();
 const unitValues=[...new Set(allPrograms.flatMap(p=>[p.uic,p.pend||p.psSupportingUic].flatMap(v=>String(v||'').split(/[,;]/).map(x=>x.trim()))).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
 const projectRows=list().flatMap(p=>(p.psProjects||[]).map(x=>({p,x})));
 const projectUnits=[...new Set(projectRows.map(o=>o.x.uic||o.p.uic).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
 const projectCategories=[...new Set(projectRows.map(o=>window.MT_PS_SCOPE?.projectCategory?.(o.p,o.x)||o.x.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
 const projectStatuses=[...new Set(projectRows.map(o=>o.x.status||'Usulan'))].sort((a,b)=>a.localeCompare(b,'id'));
 const programOptions=list().filter(x=>!x.arsip&&x.psListStatus!=='Arsip');
 const options=stage==='usulan'&&sub==='bank'?(S.programs||[]):programOptions;
 const displayStatus=stage==='mapping'&&sub==='proposal'?['all',...projectStatuses]:
  stage==='usulan'?['all','Baru','Legacy','Arsip']:
  stage==='prioritasi'?['all','Sudah Dinilai','Belum Dinilai']:
  stage==='charter'?['all','Draft','Disahkan']:
  stage==='penetapan-program'?['all','Belum Ditetapkan','Ditetapkan']:
  stage==='rkmk'?['all','Perlu Reviu','Sudah Direviu']:['all'];
 const statusLabel=stage==='prioritasi'?'Status Penilaian':stage==='charter'?'Status Charter':stage==='penetapan-program'?'Status Penetapan':stage==='rkmk'?'Status Reviu':'Status';
 const title={
  'usulan':'Usulan Program',
  'mapping':'Pemetaan Proyek',
  'prioritasi':yr()>=2027?'Clearance Proyek Non ISTK':'Prioritasi',
  'charter':'Charter Program',
  'penetapan-program':'Penetapan Program',
  'rkmk':'Draft RKMK'
 }[stage]||'Project Selection';
 const mkSel=(attr,values,selected,defaultLabel)=>'<select '+attr+'><option value="all">'+E(defaultLabel)+'</option>'+values.filter(x=>x!=='all').map(x=>'<option value="'+E(x)+'" '+(selected===x?'selected':'')+'>'+E(x)+'</option>').join('')+'</select>';
 const yearField='<label>Tahun Anggaran <select data-ps27-year>'+
  (isProgramHistory?'<option value="all" '+(y==='all'?'selected':'')+'>Semua Tahun</option>':'')+
  years.map(n=>'<option value="'+n+'" '+(y===String(n)?'selected':'')+'>'+n+'</option>').join('')+'</select></label>';
 const statusField='<label>'+statusLabel+mkSel('data-ps27-status',displayStatus,status,'Semua Status')+'</label>';
 const unitField=stage==='mapping'?'<label>UIC Proyek'+mkSel('data-ps27-unit',projectUnits,unit,'Semua Unit')+'</label>':
  '<label>UIC Utama / Pendukung'+mkSel('data-ps27-unit',unitValues,unit,'Semua Unit')+'</label>';
 const categoryField='<label>Kategori Proyek'+mkSel('data-ps27-category',projectCategories,String(f.category||'all'),'Semua Kategori')+'</label>';
 const originOptions=[['all','Semua Asal'],['baru','Program Baru'],['lanjutan','Dari Tahun Sebelumnya']];
 const originField='<label>Asal <select data-ps27-origin>'+originOptions.map(([v,l])=>'<option value="'+v+'"'+((f.origin||'all')===v?' selected':'')+'>'+l+'</option>').join('')+'</select></label>';
 const programField='<label>Program <select data-ps27-prog><option value="">Semua Program</option>'+options.map(x=>
  '<option value="'+E(x.id)+'" '+(String(f.program||'')===String(x.id)?'selected':'')+'>'+E(x.nama)+'</option>').join('')+'</select></label>';
 const curP=current();
 const singleProgField='<label>Program <select data-ps27-prog>'+(options.length?options.map(x=>'<option value="'+E(x.id)+'" '+(curP&&String(curP.id)===String(x.id)?'selected':'')+'>'+E(x.nama)+'</option>').join(''):'<option value="">Belum ada program</option>')+'</select></label>';
 // ===== Standar filter Modul Transformasi (lihat README › Standar Filter) =====
 // Isi filter = kolom kategori yang benar-benar tampil di tabel/tampilan aktif; teks bebas
 // (nama, deskripsi, narasi) dicari lewat kolom Cari di samping tab, bukan di panel ini.
 const mk=(attr,values,selected,defaultLabel,labelOf)=>'<select '+attr+'><option value="all">'+E(defaultLabel)+'</option>'+values.filter(x=>x!=='all'&&x!=null&&x!=='').map(x=>{const v=Array.isArray(x)?x[0]:x,l=Array.isArray(x)?x[1]:(labelOf?labelOf(x):x);return '<option value="'+E(v)+'" '+(String(selected)===String(v)?'selected':'')+'>'+E(l)+'</option>'}).join('')+'</select>';
 const uniq=a=>[...new Set(a.map(v=>String(v||'').trim()).filter(Boolean))].sort((x,z)=>x.localeCompare(z,'id',{numeric:true}));
 const field=(label,select,chip,wide)=>({html:'<label'+(wide?' class="ps27-f-wide"':'')+'>'+E(label)+select+'</label>',chip});
 const pick=(v,arr)=>{const hit=arr.find(x=>String(Array.isArray(x)?x[0]:x)===String(v));return hit==null?String(v):String(Array.isArray(hit)?hit[1]:hit)};
 const on=v=>v!=null&&v!==''&&v!=='all';
 const F=[];
 // Tahun Anggaran selalu ada; Riwayat Program boleh "Semua Tahun".
 F.push({html:yearField,chip:null});
 const mapB=window.MT_PS_SCOPE?.bank?.()||{};
 if(stage==='usulan'&&sub==='bank'){
  F.push(field('UIC',mk('data-ps27-unit',unitValues,unit,'Semua Unit'),on(unit)?'UIC: '+unit:null));
  F.push(field('Status',mk('data-ps27-status',['Baru','Legacy','Arsip'],status,'Semua Status'),on(status)?'Status: '+status:null));
 }else if(stage==='usulan'&&sub==='detail'){
  const origins=[['baru','Program Baru'],['lanjutan','Dari Tahun Sebelumnya']],ready=[['ok','Siap direviu'],['todo','Perlu dilengkapi']];
  F.push(field('UIC',mk('data-ps27-unit',unitValues,unit,'Semua Unit'),on(unit)?'UIC: '+unit:null));
  F.push(field('Asal',mk('data-ps27-origin',origins,f.origin||'all','Semua Asal'),on(f.origin)?'Asal: '+pick(f.origin,origins):null));
  F.push(field('Status',mk('data-ps27-status',['Baru','Legacy','Arsip'],status,'Semua Status'),on(status)?'Status: '+status:null));
  F.push(field('Kelengkapan',mk('data-ps27-ready',ready,f.ready||'all','Semua Kelengkapan'),on(f.ready)?pick(f.ready,ready):null));
 }else if(stage==='mapping'&&sub==='history'){
  const recs=window.MT_PS_SCOPE?.historyRecords?.()||[];
  const hy=String(mapB.historyYear||'all'),hp=String(mapB.historyProgram||'all'),hu=String(mapB.historyUnit||'all');
  const progs=uniq(recs.map(r=>r.p.nama)),units=uniq(recs.map(r=>r.x.uic||r.p.uic)),yrs=uniq(recs.map(r=>r.y)).reverse();
  F.push(field('Tahun Sumber',mk('data-ps27-hyear',yrs,hy,'Semua Tahun'),on(hy)?'Tahun sumber: '+hy:null));
  F.push(field('Program Sumber',mk('data-ps27-hprog',progs,hp,'Semua Program'),on(hp)?'Program sumber: '+hp:null));
  F.push(field('UIC',mk('data-ps27-hunit',units,hu,'Semua Unit'),on(hu)?'UIC: '+hu:null));
 }else if(stage==='mapping'&&sub==='proposal'){
  const mp=String(f.program||'all');
  F.push(field('Program',mk('data-ps27-mprog',programOptions.map(x=>[String(x.id),x.nama]),mp,'Semua Program'),on(mp)?'Program: '+(programOptions.find(x=>String(x.id)===mp)?.nama||'dipilih'):null,true));
  F.push(field('UIC Proyek',mk('data-ps27-unit',projectUnits,unit,'Semua Unit'),on(unit)?'UIC: '+unit:null));
  F.push(field('Status',mk('data-ps27-status',projectStatuses,status,'Semua Status'),on(status)?'Status: '+status:null));
  F.push(field('Kategori Proyek',mk('data-ps27-category',projectCategories,String(f.category||'all'),'Semua Kategori'),on(f.category)?'Kategori: '+f.category:null));
 }else if(stage==='prioritasi'){
  const nonY=yr()>=2027&&window.MT_PS_KKA,cp=nonY?null:curP,rows=nonY?window.MT_PS_KKA.nonProjects():(cp?.psProjects||[]);
  /* MCDA: "Semua Program" = lingkup Portofolio (sinkron dengan tombol Portofolio di Penilaian & Peringkat). SMART tetap per program karena bobot & ambang melekat pada program. */
  const kAll=cp?.psMethod==='kka'&&(S.ui.psKka||{}).scope==='all';
  const sAll=!!ws().prioAll&&cp?.psMethod!=='kka',anyAll=kAll||sAll;
  if(!nonY)F.push({html:'<label>Program <select data-ps27-prog><option value="__all"'+(anyAll?' selected':'')+'>'+(cp?.psMethod==='kka'?'Semua Program · Portofolio MCDA':'Semua Program')+'</option>'+options.map(x=>'<option value="'+E(x.id)+'" '+(!anyAll&&cp&&String(cp.id)===String(x.id)?'selected':'')+'>'+E(x.nama)+'</option>').join('')+'</select></label>',chip:anyAll?'Program: Semua':null,wide:true});
  F.push(field('UIC Proyek',mk('data-ps27-unit',uniq(rows.map(x=>x.uic||cp?.uic)),unit,'Semua Unit'),on(unit)?'UIC: '+unit:null));
  F.push(field('Status Penilaian',mk('data-ps27-status',['Sudah Dinilai','Belum Dinilai'],status,'Semua Status'),on(status)?status:null));
 }else if(stage==='rkmk'){
  /* Draft RKMK: program dipilih di panel kerangka; filter cukup Tahun. */
 }else if(stage==='mapping'&&sub==='docs'){
  F.push({html:programField,chip:null,wide:true});
 }else if(stage==='penetapan-program'){
  /* Tabel K-Wide memuat semua program: filter Program menyaring baris tabel (bukan memilih satu program). */
  const wp=String(S.ui.ps27WideProg||'all'),wopts=list().map(x=>[String(x.id),x.nama]);
  F.push(field('Program',mk('data-ps27-wprog',wopts,wp,'Semua Program'),on(wp)&&wopts.some(o=>o[0]===wp)?'Program: '+pick(wp,wopts):null,true));
 }else if(stage==='charter'){
  /* Charter Program: pilihan "Semua Program" menampilkan charter seluruh program tahun aktif. */
  const allOn=!!S.ui.ps27ChAll,cp=curP;
  F.push({html:'<label>Program <select data-ps27-prog><option value="__all"'+(allOn?' selected':'')+'>Semua Program</option>'+options.map(x=>'<option value="'+E(x.id)+'" '+(!allOn&&cp&&String(cp.id)===String(x.id)?'selected':'')+'>'+E(x.nama)+'</option>').join('')+'</select></label>',chip:allOn?null:null,wide:true});
 }
 const searchVal=stage==='mapping'&&sub==='history'?mapB.historySearch:f.search;
 const active=F.map(x=>x.chip).filter(Boolean);
 if(searchVal)active.push('Cari: '+searchVal);
 /* Template filter = Project Management (.flt.fx2.pmo-unified): bar krem, label Filter navy, chip aktif, toggle emas. */
 const ico='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>';
 const toFg=x=>{if(/data-ps27-year/.test(x.html))x={...x,year:1};const m=String(x.html).match(/^<label([^>]*)>([\s\S]*?)(<select[\s\S]*<\/select>)<\/label>$/);if(!m)return x.html;
  const wide=x.wide||/ps27-f-wide/.test(m[1]),sel=m[3],val=(sel.match(/<option value="([^"]*)"[^>]*selected/)||[])[1],isAct=x.chip!=null&&val!=null&&val!==''&&val!=='all';
  return '<span class="fg'+(x.year?' ps27-fyear':'')+(wide?' w2 pm-program':'')+'"><label>'+(x.year?'Tahun':m[2])+'</label>'+sel.replace(/^<select /,'<select class="sel'+(isAct?' act':'')+'" ')+'</span>'};
 const chipOf=x=>{if(!x.chip)return '';const a=(String(x.html).match(/<select[^>]*?(data-ps27-[a-z-]+)/)||[])[1];return '<span class="c1">'+E(x.chip)+(a?'<button type="button" class="fx" data-ps27-clear="'+a+'" aria-label="Hapus filter '+E(x.chip)+'" title="Hapus filter ini">×</button>':'')+'</span>'};
 const chips=F.map(chipOf).filter(Boolean).concat(searchVal?['<span class="c1">Cari: '+E(searchVal)+'</span>']:[]);
 const open=!!w.filterOpen,tri='<span class="fcar" aria-hidden="true"><svg class="fcar-tri" viewBox="0 0 12 12" width="12" height="12"><path d="M2.2 3.8h7.6L6 8.6z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/></svg></span>';
 return '<section class="flt fx2 pmo-unified ps27-flt'+(open?' open':'')+'" aria-label="Filter '+E(title)+'" role="search">'+
  '<div class="lp" data-ps27="filter" title="Klik untuk '+(open?'menyembunyikan':'menampilkan')+' filter"><span class="gi">'+ico+'</span><div class="lt"><span><b>Filter</b></span></div></div>'+
  '<div class="rp"><div class="ftop" data-ps27="filter" role="button" tabindex="0" aria-expanded="'+open+'" title="Klik untuk '+(open?'menyembunyikan':'menampilkan')+' filter">'+
  (active.length?'<span class="tl">'+active.length+' filter aktif</span><span class="flist">'+chips.join('')+'</span>':'')+
  '<span class="ps27-fsp" style="flex:1 1 auto"></span><span class="rs2" data-ps27-count hidden></span>'+
  (active.length?'<button type="button" class="freset rsm" data-ps27-reset>↺ Atur ulang</button>':'')+tri+'</div>'+
  '<div class="fbar"'+(open?'':' hidden')+'>'+F.map(toFg).join('')+'</div></div></section>';
}
function actionBar(){return '<div class="ps27-actionbar" hidden></div>';}
function sourcePicker(){
 const w=ws(),arr=sourcePrograms().filter(p=>(p.nama+' '+(p.kodeResmi||'')+' '+(p.kode||'')+' '+p.uic).toLowerCase().includes(String(w.search||'').toLowerCase())),to=yr(),allSel=arr.length&&arr.every(p=>(w.selected||[]).includes(String(p.id)));
 return '<div class="ps27-card"><div class="ps27-cardtop"><div><h3>Ambil Program Tahun Sebelumnya'+(typeof MT_INFO_ICON==='function'?MT_INFO_ICON:()=>'')('Salin seluruh detail, charter dan dokumen, daftar proyek, serta draft WBS. Data sumber tetap utuh dan capaian tidak disalin.')+'</h3></div><span class="ps27-info">Multi-select</span></div>'+
 '<div class="ps27-controls"><label>Tahun Sumber <select data-ps27-source>'+[2025,2026,2027,2028].filter(y=>y<=to).map(y=>'<option '+(y===+w.sourceYear?'selected':'')+'>'+y+'</option>').join('')+'</select></label>'+
 '<label class="ps27-grow">Cari program <input type="search" data-ps27-search value="'+E(w.search||'')+'" placeholder="Nama, kode atau UIC"></label>'+
 '<button class="btn pri" data-ps27="carry" '+(!w.selected.length||to<=+w.sourceYear?'disabled':'')+'>+ Tambah '+w.selected.length+' Program ke '+to+'</button></div>'+
 (to===+w.sourceYear?'<div class="ps27-warning">Tahun tujuan sama dengan sumber. Ubah Tahun Anggaran di header menjadi 2027/2028/2029 untuk membawa program 2026.</div>':'')+
 '<div class="ps27-tablewrap"><table class="ps27-table"><thead><tr><th class="ps27-checkcol"><input type="checkbox" data-ps27-checkall '+(allSel?'checked':'')+' aria-label="Pilih semua program"></th><th>Program sumber</th><th>UIC</th><th>Charter</th><th>Proyek</th><th>WBS '+E(w.sourceYear)+'</th></tr></thead><tbody>'+
 (arr.length?arr.map(p=>'<tr><td><input type="checkbox" data-ps27-select="'+E(p.id)+'" '+((w.selected||[]).includes(String(p.id))?'checked':'')+' aria-label="Pilih program '+E(p.nama)+'"></td><td><b>'+E(p.nama)+'</b><small>'+E(p.kodeResmi||'Kode resmi belum ditetapkan')+'</small></td><td>'+E(p.uic||'—')+'</td><td>'+(foundCharter(p,+w.sourceYear)?'Ada':'Belum ada')+'</td><td>'+sourceProjects(p,+w.sourceYear).length+'</td><td>'+sourceWbs(p,+w.sourceYear).length+'</td></tr>').join(''):'<tr><td colspan="6" class="ps27-center">Tidak ada program sesuai filter.</td></tr>')+
 '</tbody></table></div></div>';
}
function portfolio(){
 const arr=list();return '<div class="ps27-card"><div class="ps27-cardtop"><div><h3>Daftar Usulan Program · '+yr()+''+(typeof MT_INFO_ICON==='function'?MT_INFO_ICON:()=>'')('Pilih program untuk melengkapi profil dan register, atau ambil program yang sudah berjalan dari tahun sebelumnya.')+'</h3></div><strong>'+arr.length+' program</strong></div>'+
 '<div class="ps27-tablewrap"><table class="ps27-table"><thead><tr><th>Program</th><th>UIC</th><th>Asal</th><th>Status</th><th>Proyek</th><th>WBS draft</th><th>Aksi</th></tr></thead><tbody>'+
 (arr.length?arr.map(p=>'<tr><td><b>'+E(p.nama)+'</b><small>'+E(p.kodeResmi||'Kode resmi belum ditetapkan')+'</small></td><td>'+E(p.uic||'—')+'</td><td>'+E(p.psCarry?'Carry over '+p.psCarry.sourceYear:'Baru / existing')+'</td><td><span class="ps27-status">'+E(p.psStatus||'Berjalan')+'</span></td><td>'+(p.psProjects?.length||0)+'</td><td>'+(p.psWbsDraft?.length||0)+'</td><td><button class="btn btn-outline btn-sm" data-ps27-pick="'+E(p.id)+'">Buka</button></td></tr>').join(''):'<tr><td colspan="7" class="ps27-center">Belum ada program pada tahun ini.</td></tr>')+
 '</tbody></table></div></div>';
}
function formProgram(p){
 if(!p)return '<div class="ps27-card"><div class="ps27-empty">Pilih program di daftar untuk membuka detail usulan.</div></div>';
 return '<div class="ps27-card ps27-governance">'+
 '<div class="ps27-cardtop"><div><h3>Profil dan Kelengkapan Program'+(typeof MT_INFO_ICON==='function'?MT_INFO_ICON:()=>'')('Identitas → Business Case → Manfaat → Stakeholder → Risiko → Tata Kelola → Reviu.')+'</h3></div>'+
 (can(p)&&p.psStatus!=='Ditetapkan'?'<button class="btn" data-pswf="edit-program">Ubah Identitas</button>':'')+'</div>'+
 (window.MT_PS_GOV?window.MT_PS_GOV.programPage(p):'')+'</div>';
}
function usulan(p){const u=ws(),tab=u.usulanSub||'daftar';const nav='<div class="ps27-minitabs" role="tablist" aria-label="Tahapan usulan program">'+[['daftar','Usulan Program'],['ambil','Ambil Program Tahun Sebelumnya'],['detail','Detail Program & Register']].map(x=>'<button type="button" role="tab" aria-selected="'+(tab===x[0])+'" class="'+(tab===x[0]?'on':'')+'" data-ps27-usul="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';return nav+(tab==='ambil'?sourcePicker():tab==='detail'?formProgram(p):portfolio());}
function mapping(p){
 if(!p)return '<div class="ps27-card"><div class="ps27-empty">Pilih program untuk memetakan proyek/modul.</div></div>';
 const a=p.psProjects||[],rows=p.psWbsDraft||[];
 return '<div class="ps27-card"><div class="ps27-cardtop"><div><h3>Pemetaan Proyek / Modul'+(typeof MT_INFO_ICON==='function'?MT_INFO_ICON:()=>'')(''+E(p.nama)+' · Cocokkan daftar proyek dengan draft WBS dari tahun sumber sebelum prioritisasi.')+'</h3></div>'+
 (can(p)&&p.psStatus!=='Ditetapkan'?'<button class="btn pri" data-pswf="add-project">+ Tambah Proyek</button>':'')+'</div>'+
 '<div class="ps27-minimetrics"><span><b>'+a.length+'</b> proyek/modul</span><span><b>'+rows.length+'</b> item WBS draft</span><span><b>'+a.filter(x=>x.included!==false).length+'</b> diusulkan</span></div>'+
 '<div class="ps27-tablewrap"><table class="ps27-table"><thead><tr><th>Proyek / Modul</th><th>UIC / PIC</th><th>Target</th><th>Item WBS terkait</th><th>Aksi</th></tr></thead><tbody>'+
 (a.length?a.map(x=>{const w=rows.filter(z=>(z.p||[]).some(s=>String(s).toLowerCase()===String(x.name).toLowerCase()));return '<tr><td><b>'+E(x.name)+'</b><small>'+E(x.outputs||x.description||'')+'</small></td><td>'+E(x.uic||p.uic||'—')+'<small>'+E(x.pic||'PIC belum ditetapkan')+'</small></td><td>'+E(x.goLive||'—')+'</td><td>'+w.length+(rows.length&&!w.length?' · cek pemetaan':'')+'</td><td><button class="btn btn-outline btn-sm" data-pswf-project="'+E(x.id)+'">Ubah</button>'+(can(p)&&p.psStatus!=='Ditetapkan'?'<button class="btn btn-ghost btn-sm" data-ps27-remove="'+E(x.id)+'">Hapus</button>':'')+'</td></tr>';}).join(''):'<tr><td colspan="5" class="ps27-center">Belum ada proyek. Gunakan Tambah Proyek atau ambil program tahun sebelumnya.</td></tr>')+'</tbody></table></div>'+
 (rows.length?'<div class="ps27-footnote">Draft WBS sudah disalin lengkap. Setelah Penetapan, item WBS yang relevan akan tersedia di Project Management → Perencanaan → WBS untuk penyesuaian detail dan baseline.</div>':'<div class="ps27-footnote">Belum ada draft WBS. Setelah Penetapan, buat WBS baru dari daftar proyek yang ditetapkan.</div>')+'</div>';
}
/* Prioritasi › Semua Program (SMART/manual): ringkasan portofolio seluruh program tahun aktif. Skor tiap proyek memakai bobot & ambang programnya sendiri. */
function prioritasiAll(){
 const progs=list(),y=I.year?I.year():'',fk=['method','score','ok'].includes(ws().prioAllKpi)?ws().prioAllKpi:'';
 const meth=p=>p.psMethod==='kka'?'MCDA':p.psPrioritize?'SMART':'';
 const rows=progs.map(p=>{const a=p.psProjects||[],m=meth(p),pick=I.chosen(p).length,todo=m==='SMART'?a.filter(x=>I.calc(x,p).score==null).length:0;
  const st=!m?'method':todo?'score':'ok';return {p,m,n:a.length,pick,todo,st}});
 const nNo=rows.filter(r=>r.st==='method').length,nTodo=rows.filter(r=>r.st==='score').length,nOk=rows.filter(r=>r.st==='ok').length;
 const nCal=rows.reduce((t,r)=>t+r.n,0),nPick=rows.reduce((t,r)=>t+r.pick,0);
 const kp=(key,l,v,sub,cls)=>'<button type="button" class="ps27-pkpi'+(cls?' '+cls:'')+(fk===key?' is-active':'')+'" data-ps27-pkpi="'+key+'" aria-pressed="'+(fk===key)+'" title="'+(fk===key?'Klik lagi untuk melepas filter':'Klik untuk lihat programnya')+'"><span>'+E(l)+'</span><b>'+v+'</b><small>'+E(sub)+'</small></button>';
 let h='<div class="ps27-pall-head"><h3>Prioritasi · Semua Program '+E(y)+'</h3></div>';
 h+='<ol class="ps27-steps3"><li><b>1</b><div><strong>Pilih metode</strong><span>SMART atau MCDA, sekali per program</span></div></li><li><b>2</b><div><strong>Nilai proyeknya</strong><span>Lengkapi skor sampai tidak ada yang tertinggal</span></div></li><li><b>3</b><div><strong>Lanjut ke Charter</strong><span>Proyek terpilih otomatis ikut</span></div></li></ol>';
 h+='<div class="ps27-pkpis k4">'+kp('all','Program',progs.length,'Tahun '+y,'navy')+kp('method','Perlu pilih metode',nNo,nNo?'Langkah 1 belum':'Semua sudah','pk-gold')+kp('score','Perlu dinilai',nTodo,nTodo?'Langkah 2 belum':'Tidak ada','pk-red')+kp('ok','Siap lanjut',nOk,nPick+' dari '+nCal+' proyek terpilih','pk-green')+'</div>';
 const vis=rows.filter(r=>!fk||r.st===fk);
 const stTxt=r=>r.st==='method'?'<span class="ps27-stt w">Belum pilih metode</span><small>Sementara semua proyek dianggap terpilih</small>':r.st==='score'?'<span class="ps27-stt r">'+r.todo+' proyek belum dinilai</span><small>Proyek baru terpilih setelah dinilai</small>':'<span class="ps27-stt g">Siap lanjut</span><small>'+(r.m==='MCDA'?'Proyek ISTK otomatis diprioritaskan':'Semua proyek sudah dinilai')+'</small>';
 const act=r=>'<button type="button" class="btn '+(r.st==='ok'?'btn-outline':'pri')+' btn-sm" data-ps27-openprog="'+E(r.p.id)+'">'+(r.st==='method'?'Pilih metode':r.st==='score'?'Nilai proyek':'Lihat')+' →</button>';
 h+='<div class="ps27-card" id="ps27-pall-prog"><div class="ps27-cardtop"><div><h3>Daftar program'+(fk?' · '+({method:'perlu pilih metode',score:'perlu dinilai',ok:'siap lanjut'})[fk]:'')+'</h3></div>'+(fk?'<button type="button" class="btn btn-outline btn-sm" data-ps27-pkpi="'+fk+'">✕ Tampilkan semua</button>':'')+'</div><div class="ps27-tablewrap"><table class="ps27-table ps27-pall-t"><thead><tr><th>Program</th><th>Metode</th><th>Status</th><th>Proyek terpilih</th><th></th></tr></thead><tbody>'+
 (vis.length?vis.map(r=>'<tr><td><b>'+E(r.p.nama)+'</b><small>'+E(r.p.uic||'')+'</small></td><td>'+(r.m?'<span class="ps27-mchip m-'+r.m.toLowerCase()+'">'+r.m+'</span>':'<span class="ps27-mchip">—</span>')+'</td><td>'+stTxt(r)+'</td><td><b>'+r.pick+'</b> dari '+r.n+'</td><td style="text-align:right">'+act(r)+'</td></tr>').join(''):'<tr><td colspan="5">Tidak ada program pada kelompok ini.</td></tr>')+'</tbody></table></div></div>';
 return h;
}
/* Program lama tanpa metode: kartu pilihan metode yang sederhana. */
function methodChooser(p,ro){
 return '<div class="ps27-mchoose"><div class="ps27-mchoose-h"><b>Program ini belum memilih metode prioritisasi</b><span>Sementara ini semua proyeknya dianggap terpilih. Pilih salah satu:</span></div><div class="ps27-mchoose-g">'+
 '<button type="button" class="ps27-mcard" data-ps27-setmethod="smart"'+(ro?' disabled':'')+'><i>SMART</i><b>Nilai proyek di program ini</b><span>Isi 12 kriteria per proyek. Proyek dengan skor di atas ambang otomatis terpilih.</span><em>Cocok bila perlu memilih sebagian proyek</em></button>'+
 '<button type="button" class="ps27-mcard" data-ps27-setmethod="kka"'+(ro?' disabled':'')+'><i>MCDA</i><b>Proyek ISTK langsung diprioritaskan</b><span>Tidak perlu menilai proyek ISTK. Yang dinilai hanya usulan di luar ISTK terhadap pagu & SDM.</span><em>Cocok bila semua proyek program sudah pasti (ISTK)</em></button></div></div>';
}
/* 2027+: proyek ISTK otomatis terpilih (tidak diprioritaskan). Prioritasi = clearance usulan Non-ISTK yang masuk ke Pusakti; default MCDA, SMART sebagai pembanding. */
if(typeof window!=='undefined')window.MT_PS_PICK_OVERRIDE=()=>{try{return state().tab==='prioritasi'&&yr()>=2027&&window.MT_PS_KKA&&window.MT_PS_KKA.nonMethod()==='smart'?window.MT_PS_KKA.nonSmartP():null}catch(_){return null}};
function nonIstkPrio(stageHtml=null){
 const K=window.MT_PS_KKA;if(!K)return (stageHtml||'')+'<div class="ps27-card ps27-empty">Memuat…</div>';
 const m=K.nonMethod();
 const seg='<div class="kka-method" role="radiogroup" aria-label="Metode penilaian usulan Non-ISTK"><span>Metode</span><div class="kka-mseg">'+[['kka','MCDA','Metode utama (Kertas Kerja A Pusakti): gate G1–G4, K1–K7, peringkat, pagu & SDM.'],['smart','SMART','Pembanding: 12 kriteria SMART dengan ambang skor.']].map(o=>'<label title="'+E(o[2])+'" class="'+(m===o[0]?'on':'')+'"><input type="radio" data-ps27-nmethod="'+o[0]+'" name="ps27-nmethod" value="'+o[0]+'"'+(m===o[0]?' checked':'')+'>'+o[1]+(o[0]==='kka'?' <small>utama</small>':' <small>pembanding</small>')+'</label>').join('')+'</div></div>';
 const intro='<div class="ps27-clear"><b>Clearance usulan Non-ISTK</b><span>Yang dinilai di sini hanya usulan proyek di luar ISTK yang diajukan ke Pusakti, untuk menentukan mana yang <b>boleh lanjut</b> dan mana yang <b>di-drop</b>. Proyek ISTK otomatis terpilih dan tidak perlu dinilai.</span></div>';
 const p=m==='smart'?current():(current()||{id:'',psProjects:[]}),ro=m==='smart'?I.readonly(p):false;
 const threshold=m==='smart'?'<label class="ps27-smart-threshold">Ambang skor &gt; <input type="number" id="pswf-threshold" min="0" max="99" value="'+E(p.psThreshold??80)+'" '+(ro?'disabled':'')+' aria-label="Ambang skor SMART"> %</label>':'';
 const search=m==='smart'?(typeof MT_TABSEARCH==='function'?MT_TABSEARCH:()=>'')('ps-prioritasi',localFilter().search,'Cari usulan, UIC…'):'';
 return (stageHtml==null?intro:'')+K.page(p,{nonOnly:true,stageHtml,readOnly:ro,methodHtml:seg,smart:m==='smart',smartBody:sub=>sub==='criteria'?I.criteriaPage(p):sub==='ref'||sub==='literature'?I.referencePage(p):'<div class="ps27-smart-tools">'+search+threshold+'</div>'+I.projectsPage(p)});

}
function prioritasi(p){
 if(yr()>=2027)return nonIstkPrio();
 if(ws().prioAll&&!(p&&p.psMethod==='kka'))return prioritasiAll();
 if(!p)return '<div class="ps27-card ps27-empty">Pilih program untuk mengurutkan prioritas proyeknya.</div>';
 const sub=(ws().prioritySub==='monev'?'ranking':ws().prioritySub)||'ranking',readOnly=I.readonly(p);
 const meth=p.psMethod||(p.psPrioritize?'smart':'manual');
 if(meth==='kka'&&window.MT_PS_KKA)return window.MT_PS_KKA.page(p,{readOnly});
 const mode=window.MT_PS_KKA?window.MT_PS_KKA.methodSelect(p,readOnly):'';
 const threshold=p.psPrioritize?'<label class="ps27-smart-threshold">Ambang skor &gt; <input type="number" id="pswf-threshold" min="0" max="99" value="'+E(p.psThreshold??80)+'" '+(readOnly?'disabled':'')+' aria-label="Ambang skor SMART"> %</label>':'';
 const tip='<button class="ps27-smart-info" type="button" data-pswf="smart-info" title="Aturan pemilihan: 12 kriteria lengkap dan skor absolut lebih besar dari ambang" aria-label="Informasi aturan seleksi otomatis SMART">i</button>';
 return '<div class="ps27-priority-head"><nav class="ps27-minitabs" role="tablist" aria-label="Tab Prioritasi">'+
 [['ranking','Penilaian & Peringkat','Menilai dan mengurutkan proyek; skor adalah bahan pertimbangan, bukan penetapan.'],['criteria','Kriteria & Bobot','Atur kriteria dan bobot prioritas; perubahan bobot memengaruhi hasil penilaian.'],['reference','Referensi & Formula','Pelajari referensi, perhitungan, dan batas penggunaan skor.']].map(x=>
 '<button role="tab" type="button" data-ps27-sub="'+x[0]+'" title="'+E(x[2])+'" aria-label="'+E(x[1]+'. '+x[2])+'" aria-selected="'+(sub===x[0])+'" class="'+(sub===x[0]?'on':'')+'">'+x[1]+'</button>').join('')+'</nav>'+(sub==='ranking'?(typeof MT_TABSEARCH==='function'?MT_TABSEARCH:()=>'')('ps-prioritasi',localFilter().search,'Cari proyek, UIC atau kategori...'):(typeof MT_TABSEARCH_PH==='function'?MT_TABSEARCH_PH():''))+
 '<div class="ps27-smart-actions">'+mode+threshold+tip+'</div></div>'+
 (sub==='reference'?I.referencePage(p):sub==='criteria'?I.criteriaPage(p):I.projectsPage(p));
}
/* Charter Program › Semua Program: accordion per program dengan checkbox pilihan ekspor (default semua).
   Pilihan disimpan di S.ui.ps27ChSel[tahun] (null = semua). Klik checkbox tidak membuka/menutup accordion. */
function chSel(ids){S.ui.ps27ChSel=S.ui.ps27ChSel||{};const v=S.ui.ps27ChSel[yr()];return Array.isArray(v)?ids.filter(id=>v.includes(id)):ids.slice()}
function chOpen(){const o=S.ui.ps27ChOpen;return Array.isArray(o)?o:[]}
function charterAll(){
 const X=window.MT_CHX;if(!X)return '<div class="ps27-card ps27-empty">Modul ekspor charter belum termuat.</div>';
 const progs=list().filter(p=>!p.arsip&&p.psListStatus!=='Arsip'),withC=progs.filter(p=>X.fromProgram(p)),ic=typeof MT_INFO_ICON==='function'?MT_INFO_ICON:()=>'';
 const ids=withC.map(p=>String(p.id)),sel=chSel(ids),n=sel.length;
 const head='<div class="ps27-cardtop ps27-chtop"><h3>Charter Program · Semua Program'+ic('Seluruh Charter Program tahun '+yr()+'. Centang program yang ingin diekspor, lalu Export to untuk mengunduhnya dalam satu berkas. Pilih satu program di Filter untuk mengubah charter.')+'</h3><span class="ps27-chcount">'+withC.length+(withC.length<progs.length?' dari '+progs.length:'')+' program · '+yr()+'</span></div>';
 /* Opsi B: satu bilah aksi — Pilih semua (kiri) + pengaturan & Export (kanan). */
 const selRow=withC.length?'<div class="ps27-chbar'+(n?'':' none')+'"><label class="ps27-chpick"><input type="checkbox" class="ps27-chcb" id="ps27-chall" data-ps27-chall '+(n===ids.length?'checked':'')+' aria-label="Pilih semua program"><b>Pilih semua</b><small>'+n+' dari '+ids.length+' dipilih</small></label><span class="ps27-chbar-sp"></span>'+X.barAllYear(yr(),n).replace('>Export to <span','>Export '+n+' program <span')+'</div>':'';
 const body=withC.length?withC.map((p,i)=>{const on=sel.includes(String(p.id));return '<details class="ps27-chall-item'+(on?'':' off')+'" data-ps27-chopen="'+E(p.id)+'"'+(chOpen().includes(String(p.id))?' open':'')+'><summary><input type="checkbox" class="ps27-chcb" data-ps27-chsel="'+E(p.id)+'" '+(on?'checked':'')+' aria-label="Pilih '+E(p.nama)+' untuk diekspor"><b>'+E(p.nama)+'</b><small>'+E(p.kodeResmi||'Kode resmi belum ditetapkan')+' · '+E((p.psProgramCharter&&p.psProgramCharter.st)||'Draft')+'</small>'+(X.sumBtn?X.sumBtn(p.id):'')+(X.fsCtl?X.fsCtl(p.id,X.fsOf(p)):'')+'<button type="button" class="btn btn-sm" data-act="psProgCh" data-id="'+E(p.id)+'">✎ Ubah</button></summary>'+X.preview('data-chx-pid="'+E(p.id)+'"')+'</details>'}).join(''):
  '<div class="ps27-empty" style="padding:28px;text-align:center"><b>Belum ada Charter Program tahun '+yr()+'.</b></div>';
 const missing=progs.filter(p=>!withC.includes(p));
 setTimeout(()=>{X.mountAll&&X.mountAll();const a=document.getElementById('ps27-chall');if(a)a.indeterminate=n>0&&n<ids.length},0);
 return '<div class="ps27-card ps27-charter">'+head+selRow+body+(missing.length?'<p class="s" style="margin:10px 2px 0">Belum punya charter: '+missing.map(p=>E(p.nama)).join(', ')+'.</p>':'')+'</div>';
}
/* Checkbox di <summary>: cegah buka/tutup accordion, ubah pilihan secara manual. */
if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('click',ev=>{
 const cb=ev.target.closest&&ev.target.closest('[data-ps27-chsel]');if(!cb)return;
 ev.preventDefault();ev.stopPropagation();
 const X=window.MT_CHX,ids=list().filter(p=>!p.arsip&&p.psListStatus!=='Arsip'&&X&&X.fromProgram(p)).map(p=>String(p.id));
 const cur=new Set(chSel(ids)),id=String(cb.dataset.ps27Chsel);cur.has(id)?cur.delete(id):cur.add(id);
 S.ui.ps27ChSel=S.ui.ps27ChSel||{};S.ui.ps27ChSel[yr()]=cur.size===ids.length?null:[...cur];save();render();
},true);
if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('change',ev=>{
 if(!ev.target.matches||!ev.target.matches('[data-ps27-chall]'))return;
 S.ui.ps27ChSel=S.ui.ps27ChSel||{};S.ui.ps27ChSel[yr()]=ev.target.checked?null:[];save();render();
});
function charter(p){
 if(!p)return '<div class="ps27-card ps27-empty">Pilih program untuk menampilkan Charter Program.</div>';
 const pc=p.psProgramCharter&&typeof p.psProgramCharter==='object'&&Object.keys(p.psProgramCharter).length?p.psProgramCharter:null;
 const st=pc?(pc.st||'Draft'):((S.charters||[]).some(c=>c.prog===p.akr&&!c.dk&&c.st!=='Arsip')?'Draft (dari charter sebelumnya)':'Belum dibuat');
 const ic=typeof MT_INFO_ICON==='function'?MT_INFO_ICON:()=>'';
 let deck=null,err='';try{deck=typeof dkHtml==='function'?window.MT_PM_PROGRAM_DOCS?.buildDeck(p):null}catch(e){err=e.message||String(e)}
 const btn=(k,m,l,cls)=>'<button type="button" class="btn'+(cls?' '+cls:'')+'" data-act="pmProgramDoc" data-kind="'+k+'" data-mode="'+m+'" data-p="'+E(p.akr)+'" data-program-id="'+E(p.id||'')+'">'+l+'</button>';
 const head='<div class="ps27-cardtop"><div><h3>Charter Program'+ic('Charter tingkat program: tujuan, latar belakang, terobosan, output, outcome, key milestones, risiko, dan pengelola. Disusun sebelum penetapan program dan menjadi dasar Draft RKMK. Di Project Management charter ini hanya dilihat/diunduh. Tujuh bagian dokumen proyek (As-is s.d. Evaluasi Manfaat) disusun per proyek di Project Management › Perencanaan.')+'</h3></div>'+
  '<div class="ps27-chact"><span class="ps27-status">'+E(st)+'</span>'+((pc||deck)&&window.MT_CHX?MT_CHX.barFor(p,{year:yr(),n:MT_CHX.listAll(yr()).length}):'')+'<button type="button" class="btn pri" data-act="psProgCh" data-id="'+E(p.id)+'">'+(pc||deck?'✎ Ubah':'+ Buat Charter Program')+'</button></div></div>';
 const body=(pc||deck)&&window.MT_CHX?MT_CHX.preview('data-chx-pid="'+E(p.id)+'"'):deck?'<div class="dk-wrap ps27-chdeck" data-ps-chdeck>'+deck.slides.map((sl,i)=>'<figure class="dk-f" role="button" tabindex="0" title="Klik untuk pratinjau besar" data-act="pmProgramDoc" data-kind="charter" data-mode="preview" data-p="'+E(p.akr)+'" data-program-id="'+E(p.id||'')+'" style="cursor:zoom-in"><div class="dk-box"><div class="dk-scale">'+dkHtml(sl)+'</div></div><figcaption>'+(i+1)+'. '+E(sl.n||'')+'</figcaption></figure>').join('')+'</div>':
  '<div class="ps27-empty" style="padding:28px;text-align:center"><b>Charter Program belum dibuat.</b><p class="s">'+E(err&&!/belum dibuat/i.test(err)?err:'Klik + Buat Charter Program. Isinya tujuan, latar belakang, terobosan, output, outcome, milestone, dan risiko program.')+'</p></div>';
 setTimeout(fitDeck,0);setTimeout(()=>window.MT_CHX?.mountAll?.(),0);
 return '<div class="ps27-card ps27-charter">'+head+body+'</div>';
}
function fitDeck(){if(typeof document==='undefined'||!document.querySelectorAll)return;document.querySelectorAll('[data-ps-chdeck] .dk-scale').forEach(b=>{const w=b.parentElement.clientWidth;if(!w)return;b.style.transform='scale('+(w/1280)+')';b.parentElement.style.height=(720*w/1280)+'px'})}
if(typeof window.addEventListener==='function')window.addEventListener('resize',()=>fitDeck());
if(typeof ACT!=='undefined')ACT.psProgCh=el=>{const p=(S.programs||[]).find(x=>String(x.id)===String(el.dataset.id));if(!p)return;const X=window.MT_DOC_EXPERIENCE;if(!X||!X.openProgram)return toast('Editor charter belum termuat, muat ulang halaman.');X.openProgram(p,true)};
/* K-Wide output trajectory: same columns and quarterly grouping as workbook
   WBS Transformation Program 2026 — Capaian K-Wide (A4:F56).
   This is a new-year form; historic 2026 realization is NEVER copied into 2027. */
const quarterEnd=(y,q)=>[y+'-03-31',y+'-06-30',y+'-09-30',y+'-12-31'][q-1];
function wideState(){
 S.psWideTargets=S.psWideTargets||{};
 const y=yr(),d=S.psWideTargets[y]||(S.psWideTargets[y]={rows:[],contract:{number:'',date:'',link:'',signer:'',status:'Konsep'}});
 d.contract=d.contract||{number:'',date:'',link:'',signer:'',status:'Konsep'};
 d.rows=Array.isArray(d.rows)?d.rows:[];
 d.quarter=Math.max(1,Math.min(4,+(S.ui.ps27WideQuarter||1)));
 return d;
}
function wideRow(d,p,q){
 const row=d.rows.find(x=>String(x.programId)===String(p.id)&&+x.quarter===q);
 return row||{programId:String(p.id),quarter:q,targets:'',cutoff:quarterEnd(yr(),q),targetCount:'',actualCount:'',evidence:''};
}
function wideSummary(d,rows){
 return [1,2,3,4].map(q=>{
  const data=rows.map(p=>wideRow(d,p,q));
  const target=data.reduce((sum,x)=>sum+(Number(x.targetCount)||0),0),
   actual=data.reduce((sum,x)=>sum+(Number(x.actualCount)||0),0);
  return {q,target,actual,pct:target?Math.round(actual/target*10000)/100:null};
 });
}
function widePanel(){
 const d=wideState(),y=yr(),q=d.quarter;
 const active=list().filter(p=>p.psListStatus!=='Arsip'&&!p.arsip&&p.psStatus!=='Arsip');
 // Archived programs remain in past quarters if they already had a K-Wide output row.
 // Newer quarters do not add them back automatically.
 const historical=list().filter(p=>!active.includes(p)&&d.rows.some(x=>String(x.programId)===String(p.id)));
 const wp=String(S.ui.ps27WideProg||'all'),all=[...active,...historical],visible=all.filter(p=>(active.includes(p)||d.rows.some(x=>String(x.programId)===String(p.id)&&+x.quarter===q))&&(wp==='all'||!all.some(z=>String(z.id)===wp)||String(p.id)===wp));
 const sum=wideSummary(d,all),status=d.contract.status||'Konsep',fixed=status==='Ditetapkan';
 const filled=active.filter(p=>[1,2,3,4].some(qq=>{const r=wideRow(d,p,qq);return String(r.targets||'').trim()&&Number(r.targetCount)>0}));
 return '<section class="ps27-card ps27-kwide" aria-label="Penetapan Program melalui Kontrak Kinerja K-Wide">'+
  '<div class="ps27-cardtop"><div><h3>Penetapan Program · Kontrak Kinerja K-Wide '+y+''+(typeof MT_INFO_ICON==='function'?MT_INFO_ICON:()=>'')('Rancang target output dan tanggal cut-off per triwulan. Jumlah target/realisasi dan capaian dihitung untuk seluruh program aktif, mengikuti sheet Capaian K-Wide.')+'</h3></div><span class="ps27-status">'+E(status)+'</span></div>'+
  '<div class="ps27-wide-summary">'+sum.map(x=>'<div><b>TW '+x.q+'</b><strong>'+x.actual+' / '+x.target+'</strong><small>Capaian '+(x.pct==null?'—':x.pct.toLocaleString('id-ID')+'%')+'</small></div>').join('')+'</div>'+
  '<div class="ps27-kwide-contract">'+
  [['number','Nomor Kontrak Kinerja K-Wide','text'],['date','Tanggal Penetapan','date'],['link','Tautan / Referensi Dokumen Kontrak','url'],['signer','Pejabat Penetap','text']].map(([k,label,type])=>
   '<label>'+label+'<input type="'+type+'" data-ps27-wide-contract="'+k+'" value="'+E(d.contract[k]||'')+'" '+(fixed?'readonly':'')+' placeholder="'+E(label)+'"></label>').join('')+'</div>'+
  '<div class="ps27-kwide-tabs" role="tablist" aria-label="Target output per triwulan">'+[1,2,3,4].map(n=>'<button type="button" role="tab" aria-selected="'+(q===n)+'" class="'+(q===n?'on':'')+'" data-ps27="wide-quarter" data-wide-quarter="'+n+'">TW '+n+'</button>').join('')+'</div>'+
  '<div class="ps27-tablewrap ps27-kwide-tablewrap"><table class="ps27-table ps27-kwide-table"><colgroup><col style="width:4%"><col style="width:20%"><col style="width:34%"><col style="width:13%"><col style="width:9%"><col style="width:10%"><col style="width:10%"></colgroup>'+
  '<thead><tr><th>No</th><th>Program Transformasi</th><th>Target Output TW '+q+'</th><th>Tanggal Cut-off</th><th>Jumlah Target Output</th><th>Jumlah Realisasi Output</th><th>Bukti Dukung</th></tr></thead><tbody>'+
  (visible.length?visible.map((p,i)=>{const row=wideRow(d,p,q),archived=!active.includes(p);return '<tr data-wide-row="'+E(p.id)+'"><td>'+(i+1)+'</td><td><b>'+E(p.nama)+'</b><small>'+E(p.kodeResmi||'Kode resmi belum ditetapkan')+(archived?' · Arsip (histori)':'')+'</small></td>'+
   '<td><textarea rows="3" data-wide-field="targets" '+(fixed||archived?'readonly':'')+' aria-label="Target output '+E(p.nama)+'">'+E(row.targets||'')+'</textarea></td>'+
   '<td><input type="date" data-wide-field="cutoff" value="'+E(row.cutoff||quarterEnd(y,q))+'" '+(fixed||archived?'readonly':'')+'></td>'+
   '<td><input type="number" min="0" step="1" data-wide-field="targetCount" value="'+E(row.targetCount??'')+'" '+(fixed||archived?'readonly':'')+'></td>'+
   '<td><input type="number" min="0" step="1" data-wide-field="actualCount" value="'+E(row.actualCount??'')+'" '+(archived?'readonly':'')+' aria-label="Jumlah realisasi '+E(p.nama)+'"></td>'+
   '<td><input type="url" data-wide-field="evidence" value="'+E(row.evidence||'')+'" '+(archived?'readonly':'')+' placeholder="Tautan bukti"></td></tr>'}).join(''):'<tr><td colspan="7">Belum ada usulan program aktif.</td></tr>')+
  '</tbody><tfoot><tr><th colspan="4">TOTAL TW '+q+'</th><th>'+sum[q-1].target+'</th><th>'+sum[q-1].actual+'</th><th>'+(sum[q-1].pct===null?'—':sum[q-1].pct+'%')+'</th></tr></tfoot></table></div>'+
  '<div class="ps27-kwide-foot"><div><strong>'+filled.length+' / '+active.length+' program aktif mempunyai target output.</strong><small>Program berstatus Arsip tidak dimasukkan. Data tahun sebelumnya tetap tersimpan.</small></div>'+
  '<div><button type="button" class="btn" data-ps27="wide-save">Simpan '+(fixed?'Realisasi':'Konsep')+'</button>'+
   (!fixed?'<button type="button" class="btn pri" data-ps27="wide-finalize" '+(!can()?'disabled':'')+'>Catat Penetapan K-Wide</button>':
   '<button type="button" class="btn" data-ps27="wide-revise" '+(!can()?'disabled':'')+'>Revisi Kontrak K-Wide</button><span class="ps27-status">Kontrak telah dicatat</span>')+
  '</div></div></section>';
}
function collectWide(root){
 const d=wideState(),q=d.quarter;
 root.querySelectorAll('[data-ps27-wide-contract]').forEach(el=>{if(d.contract.status!=='Ditetapkan')d.contract[el.dataset.ps27WideContract]=el.value.trim()});
 for(const row of root.querySelectorAll('[data-wide-row]')){
  const id=row.dataset.wideRow;
  const source=list().find(p=>String(p.id)===id);
  if(source&&(source.arsip||source.psListStatus==='Arsip'))continue;let entry=d.rows.find(x=>String(x.programId)===id&&+x.quarter===q);
  if(!entry){entry={programId:id,quarter:q};d.rows.push(entry)}
  row.querySelectorAll('[data-wide-field]').forEach(input=>{
   if(d.contract.status==='Ditetapkan'&&!['actualCount','evidence'].includes(input.dataset.wideField))return;
   entry[input.dataset.wideField]=input.value.trim();
  });
  if(!entry.cutoff)entry.cutoff=quarterEnd(yr(),q);
  for(const k of ['targetCount','actualCount']){
   if(entry[k]!==''&&(!Number.isInteger(+entry[k])||+entry[k]<0))throw new Error('Jumlah target dan realisasi harus berupa bilangan bulat tidak negatif.');
  }
 }
 d.updatedAt=new Date().toISOString();d.updatedBy=ME?.email||'';
 return d;
}
function penetapan(p){
 if(!p)return '<div class="ps27-card ps27-empty">Pilih program untuk menetapkan daftar proyek setelah kontrak K-Wide dicatat.</div>';
 const a=I.chosen(p)||[],r=window.MT_PS_GOV?.readiness(p),rows=p.psWbsDraft||[],already=p.psStatus==='Ditetapkan';
 return '<div class="ps27-card ps27-approval-panel" id="ps27-project-approval"><div class="ps27-cardtop"><div><h3>Cakupan Proyek dalam Penetapan Program'+(typeof MT_INFO_ICON==='function'?MT_INFO_ICON:()=>'')('Kontrak K-Wide menjadi prasyarat. Program ditetapkan beserta proyek terpilih; daftar final menjadi acuan Project Management → Perencanaan → WBS. Prioritisasi SMART bersifat opsional.')+'</h3></div><span class="ps27-status">'+E(p.psStatus||'Draft')+'</span></div>'+
 '<div class="ps27-approval-select"><label>Program yang ditetapkan <select data-ps27-approval-program aria-label="Pilih program untuk menetapkan beserta proyeknya">'+list().filter(x=>!x.arsip&&x.psListStatus!=='Arsip').map(x=>'<option value="'+E(x.id)+'" '+(String(p.id)===String(x.id)?'selected':'')+'>'+E(x.nama)+'</option>').join('')+'</select></label></div>'+ 
 '<div class="ps27-minimetrics"><span><b>'+a.length+'</b> proyek dipilih</span><span><b>'+rows.length+'</b> WBS draft</span><span><b>'+(r?r.done+'/7':'—')+'</b> kesiapan dokumen</span></div>'+
 (r&&r.applies&&!r.ok?'<div class="ps27-warning">Kelengkapan program belum memenuhi persyaratan: '+E(r.missing.join(', '))+'. <button class="btn btn-outline btn-sm" data-ps27-tab="usulan">Lengkapi Usulan</button></div>':'')+
 '<div class="ps27-tablewrap"><table class="ps27-table"><thead><tr><th>Proyek / Modul</th><th>UIC</th><th>Target</th><th>Skor</th><th>Status</th></tr></thead><tbody>'+
 (a.length?a.map(x=>'<tr><td><b>'+E(x.name)+'</b></td><td>'+E(x.uic||p.uic||'—')+'</td><td>'+E(x.goLive||'—')+'</td><td>'+(p.psMethod==='kka'&&window.MT_PS_KKA?((MT_PS_KKA.compute().rows.find(r=>String(r.id)===String(x.id))||{}).score??'Belum lengkap'):p.psPrioritize?(I.calc(x,p).score??'Belum lengkap'):'Manual (lama)')+'</td><td>'+E(already?'Ditetapkan':'Siap ditetapkan')+'</td></tr>').join(''):'<tr><td colspan="5" class="ps27-center">Belum ada proyek dipilih. Lengkapi di Pemetaan Proyek atau Prioritasi.</td></tr>')+
 '</tbody></table></div><div class="ps27-footer">'+(already?'<span>Program beserta '+a.length+' proyek telah ditetapkan. Susun WBS baru melalui Project Management.</span><button class="btn" data-pswf="reopen">Buka Revisi</button><button class="btn pri" data-ps27="go-wbs">Buka WBS ›</button>':
 '<span>Program dan proyek ditetapkan bersama setelah kontrak K-Wide tercatat dan dokumen lengkap. WBS disusun setelahnya.</span><button class="btn pri" data-pswf="finalize" '+(!can(p)||!a.length||(r?.applies&&!r?.ok)||((+p.psYear||yr())>=2027&&(wideState().contract.status!=='Ditetapkan'||!wideState().contract.programIds?.includes(String(p.id))))?'disabled':'')+' title="Tetapkan program berikut seluruh proyek yang dipilih setelah persyaratan K-Wide dan kesiapan terpenuhi">Tetapkan Program beserta '+a.length+' Proyek</button>')+'</div></div>';
}
const RKMK_FIELDS=[['latar','Latar Belakang'],['tujuan','Tujuan / Sasaran'],['kondisi','Kondisi As-is'],['target','Kondisi To-be / Target'],['strategi','Strategi / Terobosan'],['output','Output / Deliverable'],['manfaat','Manfaat / Outcome'],['milestone','Milestone & Jadwal'],['risiko','Risiko & Mitigasi']];
function rkmk(p){
 if(window.MT_RKMK)return window.MT_RKMK.view(); // kerangka KMK + RKMK ditetapkan (rkmk-draft.js)
 if(!p)return '<div class="ps27-card ps27-empty">Pilih program untuk menyusun Draft RKMK.</div>';
 if(!p.psRkmk)p.psRkmk=newRkmk(p);
 if(!p.psRkmkReviewed)p.psRkmkReviewed={};
 const s=p.psRkmk,rev=p.psRkmkReviewed,remain=RKMK_FIELDS.filter(x=>!rev[x[0]]).length,edit=can(p)&&p.psStatus!=='Ditetapkan';
 return '<div class="ps27-card"><div class="ps27-cardtop"><div><h3>Draft Narasi RKMK · '+yr()+''+(typeof MT_INFO_ICON==='function'?MT_INFO_ICON:()=>'')('Sumber awal: <b>'+E(p.psRkmkSource||'Data usulan program')+'</b>. Prioritaskan narasi 2025 jika tersedia; bagian kuning perlu direviu untuk tahun tujuan.')+'</h3></div><span class="ps27-reviewcount">'+remain+' perlu reviu</span></div>'+
 '<div class="ps27-rkmkgrid">'+RKMK_FIELDS.filter(f=>{const st=localFilter().status;return st==='Perlu Reviu'?!rev[f[0]]:st==='Sudah Direviu'?!!rev[f[0]]:true}).map(f=>'<label class="ps27-rkmkfield '+(rev[f[0]]?'reviewed':'needs-review')+'"><span><b>'+E(f[1])+'</b><em>'+(rev[f[0]]?'Sudah direviu':'Perlu penyesuaian')+'</em></span><textarea data-ps27-rkmk="'+f[0]+'" rows="4" '+(edit?'':'disabled')+' placeholder="Lengkapi narasi '+E(f[1])+' untuk tahun '+yr()+'">'+E(s[f[0]]||'')+'</textarea><span class="ps27-reviewline"><input type="checkbox" data-ps27-reviewed="'+f[0]+'" '+(rev[f[0]]?'checked':'')+' '+(edit?'':'disabled')+'> Sudah direviu untuk tahun '+yr()+'</span></label>').join('')+'</div>'+
 '<div class="ps27-footer"><span>Highlight kuning menandai area yang memerlukan konfirmasi; bukan otomatis dinyatakan valid.</span>'+(edit?'<button class="btn pri" data-ps27="save-rkmk">Simpan Narasi</button>':'')+'<button class="btn" data-pswf="generate-word">Unduh Draft Word</button></div></div>';
}
function syncWbs(p){
 if(!p||p.psStatus!=='Ditetapkan'||!Array.isArray(p.psWbsDraft))return 0;
 const ids=new Set(p.psSelectedProjectIds||[]),all=p.psProjects||[],removed=all.filter(x=>!ids.has(x.id)),rows=p.psWbsDraft,existing=new Set((S.wbs||[]).map(w=>w.k)),transfer=[];
 rows.forEach(w=>{
  if(w.psCarryDraft||w.psSourceWbs)return; // prior-year WBS must not become active automatically
  if(removed.some(x=>(w.p||[]).some(t=>String(t).toLowerCase()===String(x.name).toLowerCase())))return;
  if(existing.has(w.k))return;
  const z=clone(w);z.psCarryDraft=false;z.psNeedsReview=true;z.rm=0;z.v=0;z.arsip=false;existing.add(z.k);transfer.push(z);
 });
 S.wbs=S.wbs||[];S.wbs.push(...transfer);p.psWbsSynced=transfer.map(x=>x.k);return transfer.length;
}
function navigate(target){
 const a=String(target||'usulan').split(':'),stage=a[0],sub=a[1],item=a[2];
 const split=yr()>=2027,nonShortcut=split&&stage==='mapping'&&sub==='nonistk';
 const actual=split&&stage==='peta'?'peta':nonShortcut||stage==='clearance'?'prioritasi':stage==='penetapan'?'penetapan-program':TABS.some(t=>t[0]===stage)?stage:'usulan';
 const u=state();if(split&&['prioritasi','peta'].includes(actual)&&ISTK_TABS.some(t=>t[0]===u.tab))ws().istkLastTab=u.tab;
 u.tab=actual;
 if(nonShortcut){S.ui.psKka=S.ui.psKka||{};S.ui.psKka.sub='usulan';if(window.MT_PS_SCOPE)window.MT_PS_SCOPE.bank().mappingTab='proposal'}
 if(split&&ISTK_TABS.some(t=>t[0]===actual))ws().istkLastTab=actual;
 if(actual==='usulan'){
  S.ui.psBank=S.ui.psBank||{};
  const tab=['bank','daftar','ambil'].includes(sub)?'bank':sub==='portfolio'?'portfolio':'detail';
  S.ui.psBank.tab=tab;
  S.ui.psBank.workspace='';
  ws().usulanSub=tab==='bank'?'daftar':'detail';
  if(item&&['identity','case','benefits','stakeholders','risks','governance','docs'].includes(item))S.ui.psBank.wtab=item;
 }
 if(actual==='mapping'&&window.MT_PS_SCOPE){
  window.MT_PS_SCOPE.bank().mappingTab=sub==='nonistk'?'nonistk':['proposal','usulan-proyek','results','hasil'].includes(sub)?'proposal':['docs','dokumen'].includes(sub)?'docs':'history';
 }
 if(actual==='prioritasi'&&sub==='monev'){location.hash='#pmo-pascaproyek';return}
 if(actual==='prioritasi'&&/^mcda-/.test(sub||'')){S.ui.psKka=S.ui.psKka||{};const k=sub.slice(5);S.ui.psKka.sub=k==='non'?(split?'usulan':'rank'):k;if(k==='non')S.ui.psKka.scope='non';else if(k==='rank'&&S.ui.psKka.scope==='non')S.ui.psKka.scope='program'}
 if(actual==='prioritasi'&&['ranking','criteria','reference'].includes(sub)){
  ws().prioritySub=sub;
  if(split){S.ui.psKka=S.ui.psKka||{};S.ui.psKka.sub=({ranking:'rank',criteria:'criteria',reference:'ref'})[sub]}
  if(sub==='reference'&&!ws().referenceVisited){I.state().formula=true;I.state().params=true;ws().referenceVisited=true}
 }
 if(actual==='charter'&&sub){
  const p=current(),c=p?foundCharter(p,yr()):null;
  if(p&&c){S.ui.chp=p.akr;S.ui.chv=c.id;S.ui.ched=c.id;
   const keys={asis:0,tobe:1,cs:2,ch:3,kp:6,mf:7,rk:8};S.ui.chws=keys[sub]??3}
 }
 save();render();
 if(actual==='usulan'&&S.ui.psBank.tab==='detail'&&item&&['identity','case','benefits','stakeholders','risks','governance','docs'].includes(item)){
  window.MT_PS_BANK_CORE?.openDetailTab(item);
 }
}

/* Shared Peta Rencana: read-only projection, not a new master or approval workflow.
   Keep the ISTK RKMK legal document separate. Non-ISTK uses the existing final MCDA snapshot;
   its allocation recommendation is not represented as a signed legal decision. */
function planModel(programs,store,year,choose){
 const active=(programs||[]).filter(p=>!p.arsip&&p.psListStatus!=='Arsip'&&p.psStatus!=='Arsip');
 const fixed=active.filter(p=>p.psStatus==='Ditetapkan');
 const istk=fixed.flatMap(p=>{
  const ids=Array.isArray(p.psSelectedProjectIds)?new Set(p.psSelectedProjectIds.map(String)):null;
  const selected=ids?(p.psProjects||[]).filter(x=>ids.has(String(x.id))):choose(p);
  return selected.map(x=>({kind:'ISTK',id:String(p.id)+':'+String(x.id),code:x.psCode||'',name:x.name||'',program:p.nama||'',uic:x.uic||p.uic||'',status:'Program ditetapkan',source:'Penetapan ISTK'}));
 });
 const snaps=Object.entries(store||{}).filter(([k,v])=>k.startsWith('snap-'+year+'-')&&v&&v.status==='Final').map(([,v])=>v).sort((a,b)=>(+b.version||0)-(+a.version||0));
 const final=snaps[0]||null,seen=new Set();
 const non=(final?.rows||[]).filter(r=>!r.istk&&r.rec==='Didanai '+year).filter(r=>{const k=String(r.pid||r.code||r.name);if(seen.has(k))return false;seen.add(k);return true;}).map(r=>({kind:'Non-ISTK',id:String(r.pid||r.code||r.name),code:r.code||'',name:r.name||'',program:'—',uic:r.uic||'',status:'Direkomendasikan didanai',source:'Clearance final v'+(final.version||'—')}));
 return {istk,non,final,draft:active.length-fixed.length};
}
function petaRencana(){
 const y=yr(),m=planModel(list(),S.psKka,y,p=>I.chosen(p)||[]);
 const kind=['all','ISTK','Non-ISTK'].includes(ws().planKind)?ws().planKind:'all';
 const rows=m.istk.concat(m.non).filter(r=>kind==='all'||r.kind===kind);
 const tabs=[['all','Semua',m.istk.length+m.non.length],['ISTK','ISTK',m.istk.length],['Non-ISTK','Non-ISTK',m.non.length]];
 return '<section class="ps27-card"><div class="ps27-cardtop"><div><h3>Peta Rencana '+E(y)+'</h3><small>Konsolidasi hasil penetapan ISTK dan hasil clearance Non-ISTK. Data ditarik dari sumber masing-masing, tanpa input ulang.</small></div><span class="ps27-status">Hanya baca</span></div>'+
 '<div class="ps27-filter" style="margin:0 0 6px"><label>Tahun Anggaran <select data-ps27-year aria-label="Tahun Peta Rencana">'+[...new Set([2027,2028,2029,y])].sort((a,b)=>a-b).map(n=>'<option value="'+n+'" '+(n===y?'selected':'')+'>'+n+'</option>').join('')+'</select></label></div>'+
 '<div class="ps27-minitabs" role="tablist" aria-label="Filter klasifikasi Peta Rencana">'+tabs.map(([k,l,n])=>'<button type="button" role="tab" class="'+(kind===k?'on':'')+'" aria-selected="'+(kind===k)+'" data-ps27-plan-kind="'+E(k)+'">'+E(l)+' · '+n+'</button>').join('')+'</div>'+
 '<div class="ps27-tablewrap"><table class="ps27-table"><colgroup><col style="width:5%"><col style="width:13%"><col style="width:34%"><col style="width:19%"><col style="width:12%"><col style="width:17%"></colgroup><thead><tr><th>No</th><th>Klasifikasi</th><th>Proyek</th><th>Program ISTK</th><th>UIC</th><th>Status / sumber</th></tr></thead><tbody>'+
 (rows.length?rows.map((r,i)=>'<tr><td>'+(i+1)+'</td><td><b>'+E(r.kind)+'</b></td><td><b>'+E(r.name)+'</b><small>'+E(r.code)+'</small></td><td>'+E(r.program)+'</td><td>'+E(r.uic)+'</td><td>'+E(r.status)+'<small>'+E(r.source)+'</small></td></tr>').join(''):'<tr><td colspan="6">Belum ada proyek dari hasil penetapan atau clearance final pada filter ini.</td></tr>')+
 '</tbody></table></div><div class="ps27-clear"><b>Dasar konsolidasi</b><span>ISTK: '+m.draft+' program belum ditetapkan dan tidak masuk daftar. Non-ISTK: '+(m.final?'menggunakan hasil MCDA final v'+E(m.final.version||'—')+'; hanya rekomendasi didanai yang ditampilkan.':'belum ada hasil MCDA final. Finalisasi hasil di jalur Non-ISTK.')+' Rekomendasi pendanaan bukan pengesahan Peta Rencana secara hukum. Draft RKMK ISTK tetap tersedia di jalur ISTK.</span></div></section>';
}
function page(){
 // The selected year's data, filter label and list heading must resolve from one value
 // before generating this view; otherwise the filter can say 2027 while the table says 2026.
 const f=localFilter(),selected=String(f.year||'');
 if(/^20\d{2}$/.test(selected)&&+S.ui.psSelectedYear!==+selected)S.ui.psSelectedYear=+selected;
 const u=state(),split=yr()>=2027;
 if(!split&&u.tab==='peta')u.tab='usulan';
 if(split&&u.tab==='mapping'&&window.MT_PS_SCOPE?.bank()?.mappingTab==='nonistk'){
  window.MT_PS_SCOPE.bank().mappingTab='proposal';u.tab='prioritasi';S.ui.psKka=S.ui.psKka||{};S.ui.psKka.sub='usulan';ws().istkLastTab='mapping';
 }
 const p=current(),T=list(),countAll=T.reduce((n,x)=>n+count(x),0),clearance=split&&u.tab==='prioritasi',tabs=split?ISTK_TABS:TABS;
 let h=vh('PS','pmo','Project Selection',split?'Pengelolaan usulan program dan seleksi proyek.':'Usulkan program, petakan proyek, prioritaskan, susun charter dan tetapkan dasar WBS.',split?laneNav(u.tab==='peta'?'peta':clearance?'non':'istk'):'');
 h+='<section class="pswf ps27'+(split?' ps27-split':'')+(clearance?' ps27-clearance':'')+'" aria-label="Project Selection">';
 if(clearance)return h+nonIstkPrio(filter(p)+actionBar(p))+'</section>';
 if(split&&u.tab==='peta')return h+petaRencana()+'</section>';
 h+='<div class="pm-stage-shell ps27-stage"><nav class="ptabs pmo-journey ps27-tabs" role="tablist" aria-label="Submenu Project Selection">'+
 tabs.map((t,i)=>'<button type="button" role="tab" title="'+E(TOP_HELP[t[0]]||'')+'" aria-selected="'+(u.tab===t[0])+'" class="'+(u.tab===t[0]?'on':'')+'" data-ps27-tab="'+t[0]+'"><span><em>'+(''+(i+1))+'</em> '+t[1]+'</span>'+(t[0]==='usulan'&&T.length?'<b>'+T.length+'</b>':t[0]==='mapping'&&countAll?'<b>'+countAll+'</b>':'')+'</button>').join('')+
 '</nav><span class="ps27-contextinfo" tabindex="0" role="img" aria-label="Informasi submenu '+E(TABS.find(x=>x[0]===u.tab)?.[1]||'Project Selection')+': '+E(TOP_HELP[u.tab]||'')+'" title="'+E(TOP_HELP[u.tab]||'')+'">ⓘ</span></div>';
 h+=filter(p)+actionBar(p);
 if(u.tab==='usulan')h+=usulan(p);
 else if(u.tab==='mapping')h+=mapping(p);
 else if(u.tab==='prioritasi')h+=prioritasi(p);
 else if(u.tab==='charter')h+=S.ui.ps27ChAll?charterAll():charter(p);
 else if(u.tab==='penetapan-program')h+=widePanel()+penetapan(p);
 else h+=rkmk(p);
 h+='</section>';return h;
}
/* Ringkasan hasil di bar filter (seperti PM): ambil jumlah dari lencana tabel pada tab aktif. */
function fillCount(root){const box=root.querySelector('[data-ps27-count]'),badge=root.querySelector('.psbank-count, .ps27-count');if(!box||!badge)return;
 const m=String(badge.textContent||'').trim().match(/^(\d+)\s*(.*)$/);if(!m)return;box.innerHTML='<b>'+m[1]+'</b> '+E(m[2]||'data');box.hidden=false}
function mount(){
 const root=document.querySelector('#view .pswf');if(!root)return;
 const lane=root.parentElement?.querySelector('.vh .ps27-header-lane');
 if(lane&&!lane.dataset.ps27Bound){lane.dataset.ps27Bound='1';lane.addEventListener('click',ev=>{const b=ev.target.closest('[data-ps27-lane]');if(!b)return;ev.preventDefault();const selected=b.dataset.ps27Lane;switchLane(selected);document.querySelector('#view .ps27-header-lane [data-ps27-lane="'+selected+'"]')?.focus({preventScroll:true})})}
 setTimeout(()=>fillCount(root),0);
 root.addEventListener('click',function(ev){
  const plan=ev.target.closest('[data-ps27-plan-kind]');if(plan){ev.stopImmediatePropagation();ws().planKind=plan.dataset.ps27PlanKind;render();return;}
  const b=ev.target.closest('[data-ps27-lane],[data-ps27-nmethod],[data-ps27-setmethod],[data-ps27-pkpi],[data-ps27-openprog],[data-ps27-clear],[data-ps27],[data-ps27-tab],[data-ps27-pick],[data-ps27-remove],[data-ps27-sub],[data-ps27-usul],[data-ps27-reset],[data-ps27-period],[data-mt-filter-icon]');
  if(!b)return;
  ev.stopImmediatePropagation();
  if(b.hasAttribute('data-mt-filter-icon')){ws().filterOpen=!ws().filterOpen;save();render();return}
  if(b.dataset.ps27Lane){switchLane(b.dataset.ps27Lane);return}
  if(b.dataset.ps27Nmethod){const K=window.MT_PS_KKA;if(K&&K.nonMethod()!==b.dataset.ps27Nmethod){K.setNonMethod(b.dataset.ps27Nmethod);ws().prioritySub='ranking';render()}return}
  if(b.dataset.ps27Setmethod){const p=I.pickedProgram();if(!p||I.readonly(p))return;const v=b.dataset.ps27Setmethod;
   const go=()=>{p.psMethod=v;p.psPrioritize=v==='smart';ws().prioritySub='ranking';try{log('Pilih metode prioritisasi',p.nama+' → '+(v==='kka'?'MCDA':'SMART'))}catch(_){}save();render();toast('Metode '+(v==='kka'?'MCDA':'SMART')+' dipilih untuk program ini.')};
   const n=(p.psProjects||[]).length;
   if(v==='smart'&&n&&typeof window.MT_PS_CONFIRM==='function')window.MT_PS_CONFIRM('Pakai SMART?','Setelah memilih SMART, '+n+' proyek di program ini baru terpilih kembali setelah dinilai dan skornya di atas ambang.',go);else go();return}
  if(b.dataset.ps27Pkpi){const k=b.dataset.ps27Pkpi,w=ws();w.prioAllKpi=(w.prioAllKpi===k||k==='all')?'':k;save();render();
   const tgt='ps27-pall-prog';setTimeout(()=>{const el=document.getElementById(tgt);if(el){el.scrollIntoView({behavior:'smooth',block:'start'})}},60);return}
  if(b.dataset.ps27Openprog){ws().prioAll=false;I.state().prog=b.dataset.ps27Openprog;setFilterField('program',b.dataset.ps27Openprog);save();render();return}
  if(b.dataset.ps27Tab){navigate(b.dataset.ps27Tab);return}
  if(b.dataset.ps27Pick){state().prog=b.dataset.ps27Pick;ws().usulanSub='detail';save();render();return}
  if(b.dataset.ps27Sub){ws().prioritySub=b.dataset.ps27Sub;if(ws().prioritySub==='reference'&&!ws().referenceVisited){I.state().formula=true;I.state().params=true;ws().referenceVisited=true}save();render();return}
  if(b.dataset.ps27Usul){ws().usulanSub=b.dataset.ps27Usul;save();render();return}
  if(b.dataset.ps27Remove){toast('Hapus proyek hanya tersedia di Pemetaan Proyek → Usulan Proyek.');return}
  if(b.dataset.ps27Clear){const sel=root.querySelector('select['+b.dataset.ps27Clear+']');if(sel){sel.value=(sel.options[0]?.value==='__all'&&sel.options[1])?sel.options[1].value:(sel.options[0]?.value??'all');sel.dispatchEvent(new Event('change',{bubbles:true}))}return}
  if(b.hasAttribute('data-ps27-reset')){
   S.ui.ps27WideProg='all';const f=localFilter();Object.assign(f,{search:'',status:'all',program:'',category:'all',origin:'all',contractStatus:'all',programName:'',unit:'all',unitRole:'all',period:'all',rangeFrom:'',rangeTo:'',year:state().tab==='usulan'&&(S.ui.psBank?.tab||'bank')==='bank'?'all':String(yr())});
   const st=S.ui.psBank||(S.ui.psBank={});st.filterProgram='';st.detailProgram='';f.allProgramsSelected=false;st.search='';st.filterStatus='all';st.filterOrigin='all';st.filterYear=f.year;f.ready='all';st.filterReady='all';st.filterUnit='all';if(state().tab==='mapping'){const m=window.MT_PS_SCOPE?.bank?.();if(m){m.historyYear='all';m.historyProgram='all';m.historyUnit='all';m.historySearch='';m.historySelected=[]}}
   save();render();return;
  }
  if(b.hasAttribute('data-ps27-period')){setFilterField('period',b.dataset.ps27Period);save();render();return}
  const a=b.dataset.ps27;
  if(a==='wide-quarter'){
   try{collectWide(root);save()}catch(e){toast(e.message||String(e));return}
   S.ui.ps27WideQuarter=+b.dataset.wideQuarter||1;render();return;
  }
  if(a==='wide-save'){try{collectWide(root);save();render();toast('Target output K-Wide TW '+wideState().quarter+' tersimpan.')}catch(e){toast(e.message||String(e))}return}
  if(a==='wide-revise'){
   const d=wideState();if(d.contract.status!=='Ditetapkan'||!can()){toast('Revisi kontrak tidak tersedia.');return}
   const revise=()=>{
    d.history=d.history||[];
    d.history.push({revision:+d.contract.revision||1,contract:clone(d.contract),rows:clone(d.rows),archivedAt:new Date().toISOString()});
    const prev=d.contract;
    d.contract={number:'',date:'',link:'',signer:prev.signer||'',status:'Konsep',revision:(+prev.revision||1)+1,previousNumber:prev.number||''};
    S.ui.ps27WideQuarter=2;save();render();
    toast('Revisi K-Wide dibuat. Kontrak sebelumnya tersimpan dalam riwayat; lengkapi target dan nomor kontrak revisi.');
   };
   if(typeof window.MT_PS_CONFIRM==='function')window.MT_PS_CONFIRM('Buat Revisi Kontrak K-Wide?', 'Kontrak yang telah dicatat akan disimpan sebagai histori, sementara target output tahun berjalan dapat diperbarui melalui revisi.',revise);
   else toast('Dialog konfirmasi belum termuat. Muat ulang halaman lalu coba lagi.');
   return;
  }
  if(a==='wide-finalize'){
   let d;try{d=collectWide(root)}catch(e){toast(e.message||String(e));return}
   const contract=d.contract,active=list().filter(x=>x.psListStatus!=='Arsip'&&!x.arsip);
   if(!can()){toast('Tidak memiliki akses pencatatan kontrak.');return}
   if(!contract.number||!contract.date||!contract.link||!contract.signer){toast('Lengkapi nomor, tanggal, referensi dokumen, dan pejabat penetap kontrak K-Wide.');return}
   const missing=active.filter(x=>![1,2,3,4].some(q=>{const row=wideRow(d,x,q);return String(row.targets||'').trim()&&Number(row.targetCount)>0}));
   if(missing.length){toast('Target output belum dilengkapi untuk '+missing.length+' program.');return}
   const finish=()=>{
    contract.status='Ditetapkan';contract.finalizedAt=new Date().toISOString();contract.finalizedBy=ME?.email||'';
    contract.programIds=active.map(x=>String(x.id));contract.snapshot=d.rows.map(x=>Object.assign({},x));
    active.forEach(x=>{x.psKwideContractNumber=contract.number;x.psKwideRecordedAt=contract.finalizedAt});
    save();render();toast('Kontrak K-Wide tercatat. Tetapkan program beserta proyek yang dipilih melalui panel di bawah.');
   };
   if(typeof window.MT_PS_CONFIRM==='function')window.MT_PS_CONFIRM('Catat Penetapan K-Wide?', 'Nomor '+contract.number+' · '+contract.date+'. Pencatatan ini menjadi prasyarat penetapan program dan proyek.',finish);
   else toast('Dialog konfirmasi belum termuat. Muat ulang halaman lalu coba lagi.');
   return;
  }
  if(a==='filter'){ws().filterOpen=!ws().filterOpen;save();render();return}
  if(a==='carry'){carrySelected();return}
  if(a==='save-rkmk'){const p=current();if(!p||!can(p))return;
   root.querySelectorAll('[data-ps27-rkmk]').forEach(q=>p.psRkmk[q.dataset.ps27Rkmk]=q.value);
   root.querySelectorAll('[data-ps27-reviewed]').forEach(q=>p.psRkmkReviewed[q.dataset.ps27Reviewed]=q.checked);
   save();render();toast('Draft RKMK dan status reviu berhasil disimpan.');return}
  if(a==='go-wbs'){const p=current();if(!p)return;S.ui.prog=p.akr;S.ui.planYear='year';save();location.hash='#pmo-wbsplan';return}
  if(a==='help'){open('help');return}
 });
 root.addEventListener('keydown',function(ev){
  if((ev.key==='Enter'||ev.key===' ')&&ev.target.classList?.contains('ps27-filter-header')){
   ev.preventDefault();ev.stopImmediatePropagation();
   ws().filterOpen=!ws().filterOpen;save();render();
  }
 });
 root.addEventListener('change',function(ev){
  const el=ev.target;
  if(el.dataset.ps27ApprovalProgram!==undefined){
   try{collectWide(root)}catch(e){toast(e.message||String(e));return}
   const chosen=list().find(p=>String(p.id)===String(el.value)&&!p.arsip&&p.psListStatus!=='Arsip');
   if(chosen){state().prog=chosen.id;setFilterField('program',chosen.id);setFilterField('allProgramsSelected',false);save();render()}return;
  }
  if(el.dataset.ps27Prog!==undefined&&state().tab==='prioritasi'){const k=S.ui.psKka=S.ui.psKka||{sub:'usulan',scope:'non',mode:'all',ue:[],q:''};
   const cp0=I.pickedProgram();
   if(el.value==='__all'){if(cp0&&cp0.psMethod==='kka'){k.scope='all';k.kpi='';if(k.sub==='usulan'||!k.sub)k.sub='rank'}else ws().prioAll=true;save();render();return}
   ws().prioAll=false;if(k.scope==='all'){k.scope='program';k.kpi=''}}
  if(el.dataset.ps27Prog!==undefined&&state().tab==='charter'){S.ui.ps27ChAll=el.value==='__all';if(el.value==='__all'){save();render();return}}
  if(el.dataset.ps27Prog!==undefined){
    S.ui.psBank=S.ui.psBank||{};
    if(state().tab==='usulan'&&S.ui.psBank.tab==='bank'){S.ui.psBank.filterProgram=el.value;setFilterField('program',el.value)}
    else if(state().tab==='usulan'&&S.ui.psBank.tab==='detail'){S.ui.psBank.detailProgram=el.value;setFilterField('program',el.value)}
    else{const b=S.ui.psBank;setFilterField('program',el.value);setFilterField('allProgramsSelected',!el.value);if(el.value){state().prog=el.value;S.ui.psGov={step:'identity'};if(window.MT_PS_SCOPE)window.MT_PS_SCOPE.bank().target=el.value}}
    save();render();return
   }
   if(el.dataset.ps27Status!==undefined){S.ui.psBank=S.ui.psBank||{};setFilterField('status',el.value);save();render();return}
   if(el.dataset.ps27Unit!==undefined){setFilterField('unit',el.value);save();render();return}
   if(el.dataset.ps27Origin!==undefined){setFilterField('origin',el.value);save();render();return}
   if(el.dataset.ps27Category!==undefined){setFilterField('category',el.value);save();render();return}
   if(el.dataset.ps27Ready!==undefined){setFilterField('ready',el.value);save();render();return}
   // Pemetaan › Usulan Proyek: Program hanya menyaring accordion, bukan mengganti mode tampilan.
   if(el.dataset.ps27Wprog!==undefined){S.ui.ps27WideProg=el.value||'all';save();render();return}
   if(el.dataset.ps27Mprog!==undefined){setFilterField('program',el.value==='all'?'':el.value);save();render();return}
   if(el.dataset.ps27Hyear!==undefined||el.dataset.ps27Hprog!==undefined||el.dataset.ps27Hunit!==undefined){
    const m=window.MT_PS_SCOPE?.bank?.();if(m){const k=el.dataset.ps27Hyear!==undefined?'historyYear':el.dataset.ps27Hprog!==undefined?'historyProgram':'historyUnit';m[k]=el.value;m.historySelected=[]}
    save();render();return}
   if(el.dataset.ps27ContractStatus!==undefined){setFilterField('contractStatus',el.value);save();render();return}
   if(el.dataset.ps27Role!==undefined){setFilterField('unitRole',el.value);save();render();return}
   if(el.dataset.ps27RangeFrom!==undefined){setFilterField('rangeFrom',el.value);save();render();return}
   if(el.dataset.ps27RangeTo!==undefined){setFilterField('rangeTo',el.value);save();render();return}
  if(el.dataset.ps27Year!==undefined){setFilterField('year',el.value);save();render();return}
  if(el.dataset.ps27Source!==undefined){ws().sourceYear=+el.value;ws().selected=[];save();render();return}
  if(el.dataset.ps27Select!==undefined){const a=new Set(ws().selected||[]);if(el.checked)a.add(String(el.dataset.ps27Select));else a.delete(String(el.dataset.ps27Select));ws().selected=[...a];save();render();return}
  if(el.dataset.ps27Checkall!==undefined){ws().selected=el.checked?sourcePrograms().filter(p=>(p.nama+' '+(p.kodeResmi||'')+' '+(p.kode||'')+' '+p.uic).toLowerCase().includes(String(ws().search||'').toLowerCase())).map(p=>String(p.id)):[];save();render();return}
  if(el.dataset.ps27Reviewed!==undefined){const p=current();if(!p||!can(p))return;
   root.querySelectorAll('[data-ps27-rkmk]').forEach(q=>p.psRkmk[q.dataset.ps27Rkmk]=q.value);
   root.querySelectorAll('[data-ps27-reviewed]').forEach(q=>p.psRkmkReviewed[q.dataset.ps27Reviewed]=q.checked);
   save();render();return}
 });
 const searchChange=(selector,update)=>{
  const field=root.querySelector(selector);if(!field)return;
  field.addEventListener('input',ev=>{
   const v=ev.currentTarget.value,cursor=ev.currentTarget.selectionStart;
   update(v);save();
   clearTimeout(window.__mtPs27SearchTimer);
   window.__mtPs27SearchTimer=setTimeout(()=>{
    render();const next=document.querySelector('#view .pswf '+selector);
    if(next){next.focus({preventScroll:true});try{next.setSelectionRange(cursor,cursor)}catch(_){}}
   },260);
  });
 };
 searchChange('[data-ps27-query]',v=>setFilterField('search',v));
 searchChange('[data-ps27-search]',v=>{ws().search=v;});
 I.mount();
}
/* Cheatsheet › SMART & MCDA: perbandingan metode dan rincian MCDA (sumber aturan: project-selection-kka.js). */
/* Cheatsheet › Telaah SI & Proses Bisnis EA: alur penyusunan Peta Rencana Pengembangan SI, metodologi telaah, dan taksonomi
   Proses Bisnis EA Level 0–2 (window.MT_EA). Sumber: paparan 24 Nov 2026; slide bertanda Confidential (ISTK) tidak dimuat. */
function eaSheet(){
 const EA=window.MT_EA,steps=[['Unit Eselon I','Menyampaikan usulan pengembangan SI beserta kajian kebutuhan (pengembangan oleh BaTii) atau kajian kebutuhan/peta rencana/cetak biru (pengembangan oleh unit).'],['Pusakti','Menelaah kajian kebutuhan: gateway G1–G4, lalu penilaian kriteria K1–K7 → usulan prioritas pengembangan.'],['Pusakti & Puspensi','Menyepakati timeline pengembangan untuk usulan yang dikembangkan BaTii.'],['Tim Kebijakan Pusakti & Setban','Legal drafting Peta Rencana Pengembangan SI.'],['Pengembangan','Dilaksanakan oleh BaTii atau oleh UE I sesuai hasil penetapan.']];
 const tax=EA?EA.tree.map(d=>'<details class="ps27-ea-dom" data-ps27-menuitem="'+E((d[0]+' '+d[1]+' '+d[2].map(a=>a[0]+' '+a[1]+' '+a[2].map(b=>b[0]+' '+b[1]).join(' ')).join(' ')).toLowerCase())+'"'+(d[0]==='3'?' open':'')+'><summary><span class="ps27-sheet-chip">'+E(d[0])+'</span><b>'+E(d[1])+'</b><small>'+d[2].length+' Level 1 · '+d[2].reduce((n,a)=>n+a[2].length,0)+' Level 2</small></summary><div class="ps27-ea-grid">'+d[2].map(a=>'<div class="ps27-ea-l1"><b><code>'+E(a[0])+'</code>'+E(a[1])+'</b><ul>'+a[2].map(b=>'<li><code>'+E(b[0])+'</code>'+E(b[1])+'</li>').join('')+'</ul></div>').join('')+'</div></details>').join(''):ps27SheetNote('Taksonomi belum termuat','Muat ulang halaman.');
 return '<div class="ps27-sheet">'+ps27SheetHead('REFERENSI · TELAAH SI','Telaah Rencana Pengembangan SI & Proses Bisnis EA','Alur penyusunan Peta Rencana Pengembangan Sistem Informasi, metodologi telaah usulan, dan taksonomi Proses Bisnis Enterprise Architecture (Level 0–2) untuk memetakan usulan.')+
  '<div class="ps27-sheet-subhead"><h4>A. Alur penyusunan Peta Rencana Pengembangan SI</h4></div>'+
  '<div class="ps27-ea-flow">'+steps.map((x,i)=>'<div><span class="ps27-sheet-number">0'+(i+1)+'</span><b>'+E(x[0])+'</b><p>'+E(x[1])+'</p></div>').join('<i aria-hidden="true">›</i>')+'</div>'+
  '<div class="ps27-sheet-subhead"><h4>B. Metodologi telaah usulan pengembangan SI</h4></div>'+
  '<div class="ps27-sheet-grid ps27-sheet-grid3">'+ps27SheetCard('1','Gateway G1–G4','G1 Selaras (Renstra/EA/Arsitektur SPBE) · G2 Tidak duplikatif · G3 Sponsor & pemilik jelas · G4 Menyampaikan kajian kebutuhan. Semua terpenuhi → lanjut dinilai.')+
   ps27SheetCard('2','Penilaian kriteria K1–K7','K1 Strategis, K2 Nilai Bisnis, K3 Regulasi, K4 Urgensi, K5 Reuse & Integrasi, K6 Kesiapan, K7 Risiko → usulan prioritas pengembangan (P1–P4, simulasi Anggaran & SDM).',ps27SheetJump('Prioritasi MCDA','prioritasi:mcda-rank'))+
   ps27SheetCard('REF','Referensi kriteria','COBIT 2019, TOGAF 10, Perpres 132/2022 (Arsitektur SPBE), UU 27/2022 (PDP), PP 71/2019 (PSE), Perpres 47/2023 (Strategi Keamanan Siber Nasional).')+'</div>'+
  '<div class="ps27-sheet-subhead"><h4>C. Taksonomi Proses Bisnis EA · Level 0–2</h4><span>'+(EA?EA.tree.reduce((n,d)=>n+1+d[2].length+d[2].reduce((m,a)=>m+a[2].length,0),0)+' proses':'')+'</span></div>'+
  '<input class="sk-search" type="search" data-ps27-help-search placeholder="Cari kode atau nama proses, mis. 3.7.2 atau sistem informasi…" aria-label="Cari proses bisnis EA">'+
  '<div class="ps27-ea-tax">'+tax+'</div>'+
  ps27SheetNote('Pemakaian dalam aplikasi','Usulan Non-ISTK wajib dipetakan ke satu proses Level 2 utama (Level 1 dan Level 0 mengikuti) dan boleh memiliki proses pendukung. Isian ada di form Usulan Non-ISTK; peta tampil di Detail Usulan › Peta Proses Bisnis EA.','gold')+
  ps27SheetNote('Sumber','Paparan "Proses Bisnis Non APBN dan Mekanisme Telaah Rencana Pengembangan Sistem Informasi", 24 November 2026. Materi bertanda Confidential tidak dimuat di aplikasi.')+'</div>';
}
function mcdaCompare(){
 const rows=[['Nama lengkap','Simple Multi-Attribute Rating Technique','Multi-Criteria Decision Analysis — mudahnya: <b>“skor tertimbang + gate”</b>'],
  ['Cocok untuk','Memilih sub-proyek/modul di dalam satu program ISTK','Menilai usulan pengembangan SI <b>di luar ISTK</b>. Proyek ISTK diprioritaskan otomatis (tidak dinilai) dan mengambil pagu & SDM lebih dulu; sisa pagu & SDM diisi usulan non-ISTK sesuai peringkat'],
  ['Penyaring awal','—','Gate G1–G4: Lolos / Tinjau Ulang / Lengkapi'],
  ['Kriteria','12 kriteria (C1–C12), skala 1–5','7 kriteria (K1–K7), skala 1–5 dengan rubrik'],
  ['Bobot','Bobot per kriteria pada program','3 profil bobot: Seimbang, Prioritas Kepatuhan, Prioritas Efisiensi'],
  ['Hasil','Skor 0–100, terpilih bila skor > ambang','Skor 0–100, kategori P1–P4, peringkat, alokasi direkomendasikan / cadangan'],
  ['Analisis tambahan','Kuadran & snapshot','Uji sensitivitas bobot, kuadran Nilai–Kemudahan, pembanding WSJF'],
  ['Penyimpanan hasil','Snapshot per program','Repositori hasil per tahun (versi Draft / Final)']];
 return '<div class="ps27-sheet-tablewrap"><table class="ps27-sheet-table"><thead><tr><th>Aspek</th><th>SMART</th><th>MCDA</th></tr></thead><tbody>'+rows.map(r=>'<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+'</td></tr>').join('')+'</tbody></table></div>';
}
function mcdaSection(){
 const K=window.MT_PS_KKA,c=K?K.cfg():null,KR=K?K.KR:[],G=K?K.GATES:[],w=c?c.weights[c.profile]:[];
 const f=(n,t,b,sm)=>'<article><span>'+n+' · '+t+'</span><strong>'+b+'</strong><small>'+sm+'</small></article>';
 return '<div class="ps27-sheet-subhead" style="margin-top:22px"><h4>B. MCDA · Multi-Criteria Decision Analysis (skor tertimbang + gate)</h4><span>diadaptasi dari Kertas Kerja A Prioritas SI</span></div>'+
  '<div class="ps27-sheet-formulas">'+
   f('01','GATE','G1–G4 semua Ya → Lolos','Ada Tidak → Tinjau Ulang · ada yang belum dijawab → Lengkapi. Hanya yang Lolos diranking (dapat diubah di pengaturan).')+
   f('02','SKOR TERTIMBANG','Σ(skor K × bobot) ÷ 5 × 100','Skor 1–5 per kriteria; bobot dari profil aktif (total 100%). K7 terbalik: 5 = risiko terendah.')+
   f('03','KATEGORI','P1 ≥ '+(c?c.p1:75)+' · P2 ≥ '+(c?c.p2:65)+' · P3 ≥ '+(c?c.p3:50)+' · P4','P1 Utama, P2 Tinggi, P3 Menengah, P4 Rendah/Tunda.')+
   f('04','ALOKASI','ISTK dulu, lalu non-ISTK urut peringkat selama muat pagu DAN SDM → Didanai','Bila melampaui → Cadangan / Tunda; usulan berikutnya yang masih muat tetap didanai. Biaya bukan kriteria skor.')+
  '</div>'+
  '<div class="ps27-sheet-subhead"><h4>Kriteria & bobot aktif'+(c?' · profil '+E(c.profile)+' · '+c.year:'')+'</h4><span>'+KR.length+' kriteria</span></div>'+
  (KR.length?'<div class="ps27-sheet-tablewrap"><table class="ps27-sheet-table"><thead><tr><th>Kode</th><th>Kriteria</th><th>Pertanyaan penilaian</th><th>Bobot</th></tr></thead><tbody>'+
   KR.map((k,i)=>'<tr><td><span class="ps27-sheet-chip">'+E(k.c)+'</span></td><td>'+E(k.n)+'</td><td>'+E(k.q)+'</td><td>'+(w[i]??'—')+'%</td></tr>').join('')+'</tbody></table></div>':'')+
  (G.length?'<div class="ps27-sheet-subhead"><h4>Gate penyaringan</h4></div><div class="ps27-sheet-checks">'+G.map(g=>'<span><b>'+E(g[1])+'</b> '+E(g[3])+'</span>').join('')+'</div>':'')+
  '<div class="ps27-sheet-grid ps27-sheet-grid3">'+
   ps27SheetCard('SENS','Uji sensitivitas','Skor dihitung ulang dengan ketiga profil bobot. <b>Stabil</b> bila rentang peringkat ≤ toleransi ('+(c?c.tol:3)+'); selain itu <b>Sensitif bobot</b> — perlu dibahas forum.')+
   ps27SheetCard('KUAD','Kuadran Nilai–Kemudahan','Nilai Manfaat = K1–K5, Kemudahan = K6–K7 (diboboti, 0–100). ≥ '+(c?c.quadThr:60)+' dianggap tinggi: Quick Win, Proyek Strategis, Pelengkap, Tunda / Kaji Ulang — dipakai untuk saran pendekatan.')+
   ps27SheetCard('WSJF','Pembanding WSJF','(K2 + K4 + K5) ÷ (6 − K7). <b>Konsisten</b> bila selisih peringkat WSJF vs skor tertimbang ≤ toleransi; bila tidak, tandai untuk ditinjau.')+
   ps27SheetCard('ISTK','ISTK vs non-ISTK','Proyek ISTK: prioritas otomatis, tidak dinilai. Usulan di luar ISTK: dinilai MCDA, berbagi sisa pagu/SDM, tidak masuk Penetapan, Charter, RKMK, WBS dan tidak dipantau PMO Kemenkeu.',ps27SheetJump('Di luar ISTK','prioritasi:mcda-non'))+
   ps27SheetCard('REPO','Repositori hasil','Simpan hasil sebagai versi (Draft/Final) beserta bobot, skor dan hasil alokasi saat itu; versi Final tidak dapat dihapus.',ps27SheetJump('Repositori','prioritasi:mcda-repo'))+
   ps27SheetCard('REF','Dasar praktik','Struktur kriteria dari COBIT 2019 & TOGAF 10; portofolio terhadap pagu & kapasitas dari PMI Portfolio Management; tata kelola ISO/IEC 38500; mandat regulasi SPBE, PDP, keamanan siber.',ps27SheetJump('Referensi & Rubrik','prioritasi:mcda-ref'))+
  '</div>'+
  ps27SheetNote('Catatan metodologi','Bobot awal dan ambang P1–P3 adalah asumsi penyusun kertas kerja, bukan hasil perbandingan berpasangan (AHP); sepakati melalui forum. Alokasi memakai aturan urut-peringkat (greedy), bukan optimasi kombinasi.');
}
function helpPage(tab){
 const items=[
  ['usulan','Usulan Program','Cari riwayat, buat dan lengkapi usulan, business case, manfaat, stakeholder, risiko, tata kelola, serta dokumen portofolio.'],
  ['mapping','Pemetaan Proyek','Pilih proyek lintas tahun dari riwayat, kelola identitas usulan, hasil pemetaan, dan dokumen usulan proyek tanpa menyalin WBS historis.'],
  ['prioritasi',yr()>=2027?'Clearance Proyek Non ISTK':'Prioritasi','Mulai 2027: proyek ISTK otomatis terpilih. Prioritasi hanya untuk clearance usulan Non-ISTK yang diajukan ke Pusakti (lanjut atau drop) — metode utama MCDA (gate G1–G4, K1–K7, pagu & SDM), SMART sebagai pembanding. Tahun 2026 ke bawah tetap per program.'],
  ['charter','Charter Program','Susun charter tingkat program (tujuan, latar belakang, terobosan, output, outcome, milestone, risiko) sebagai dasar penetapan program dan Draft RKMK. Tujuh bagian dokumen proyek disusun per proyek di Project Management › Perencanaan.'],
  ['penetapan-program','Penetapan Program','Catat kontrak K-Wide, target TW I–IV, dan tetapkan program beserta proyek terpilih dalam satu proses.'],
  ['rkmk','Draft RKMK','Tinjau narasi, cek konsistensi tahun tujuan, lengkapi catatan reviu, dan ekspor rancangan Word.']
 ];
 if(tab==='map'){
  const deep=[
   [['Riwayat Program','usulan:bank'],['Usulan Program · Kelola & Unggah / Unduh','usulan:detail'],['Dokumen Portofolio','usulan:portfolio'],['Identitas','usulan:detail:identity'],['Business Case','usulan:detail:case'],['Manfaat','usulan:detail:benefits'],['Stakeholder','usulan:detail:stakeholders'],['Risiko','usulan:detail:risks'],['Tata Kelola','usulan:detail:governance'],['Buat Dokumen Program','usulan:detail:docs']],
   [['Riwayat Proyek','mapping:history'],['Usulan Proyek ISTK (accordion per program)','mapping:proposal'],['Usulan Non-ISTK','mapping:nonistk'],['Gate Penyaringan (form Usulan Proyek)','mapping:proposal'],['Buat Dokumen Proyek','mapping:docs']],
   [['SMART · Penilaian & Peringkat','prioritasi:ranking'],['SMART · Kriteria & Bobot','prioritasi:criteria'],['SMART · Referensi & Formula','prioritasi:reference'],['MCDA · Penilaian & Peringkat','prioritasi:mcda-rank'],['MCDA · Usulan di luar ISTK','prioritasi:mcda-non'],['MCDA · Kriteria & Bobot','prioritasi:mcda-criteria'],['Anggaran & SDM','prioritasi:mcda-roadmap'],['Analisis','prioritasi:mcda-analysis'],['Riwayat Hasil','prioritasi:mcda-repo'],['Metodologi & Rubrik','prioritasi:mcda-ref'],['Referensi','prioritasi:mcda-literature']],
   [['Charter Program','charter']],
   [['Kontrak K-Wide dan Cakupan Proyek','penetapan-program']],
   [['Narasi & Reviu','rkmk']]
  ];

  const split=yr()>=2027,order=split?[0,1,3,4,5,2,6]:[0,1,2,3,4,5];
  if(split){items.push(['peta','Peta Rencana','Konsolidasi penetapan ISTK dan rekomendasi hasil clearance final Non-ISTK, tanpa input ulang.']);deep.push([['Peta Rencana bersama','peta']]);}
  if(split){deep[1]=deep[1].filter(z=>z[1]!=='mapping:nonistk');deep[2]=[['Usulan Non-ISTK','prioritasi:mcda-non'],['Penilaian & Peringkat (MCDA / SMART)','prioritasi:mcda-rank'],['Anggaran & SDM','prioritasi:mcda-roadmap'],['Analisis','prioritasi:mcda-analysis'],['Riwayat Hasil','prioritasi:mcda-repo'],['Kriteria & Bobot','prioritasi:mcda-criteria'],['Metodologi & Rubrik','prioritasi:mcda-ref'],['Referensi','prioritasi:mcda-literature']]}
  return '<div class="ps27-sheet">'+ps27SheetHead('NAVIGASI · PROJECT SELECTION','Peta Menu sampai Level Tab',split?'Lima tahap Program & Proyek ISTK, jalur terpisah Clearance Proyek Non-ISTK, serta Peta Rencana bersama. Gunakan pencarian atau shortcut menu.':'Enam tahapan utama dan tautan langsung menuju subtab.')+
   '<input class="sk-search" type="search" data-ps27-help-search placeholder="Cari menu, tab, fungsi atau istilah seperti manfaat, kontrak, WBS..." aria-label="Cari menu Project Selection">'+
   '<div class="ps27-helpmap">'+order.map((i,n)=>{const x=items[i];return '<section data-ps27-menuitem="'+E((x[1]+' '+x[2]+' '+deep[i].map(z=>z[0]).join(' ')).toLowerCase())+'"><button class="ps27-helpmap-head" data-ps27-jump="'+x[0]+'"><b>'+(split&&i===2?'NON ISTK':n+1)+' · '+x[1]+'</b><span>Buka submenu ↗</span></button><p>'+x[2]+'</p><div class="ps27-helpmap-links">'+deep[i].map(z=>'<button type="button" data-ps27-jump="'+z[1]+'">'+z[0]+'</button>').join('')+'</div></section>'}).join('')+'</div>'+
   ps27SheetNote('Panduan dan referensi dipisahkan','Bantuan menjelaskan langkah penggunaan aplikasi. Definisi, metodologi SMART, istilah, tata kelola, dan dasar pemikiran ada di Cheatsheet.','gold')+
  '</div>';
 }
 if(tab==='flow'){
  if(yr()>=2027)return sheetPage('framework');
  return '<div class="ps27-sheet">'+ps27SheetHead('ALUR KERJA · 6 TAHAP','Tahapan dari Usulan hingga Penetapan','Pilih tahap untuk masuk langsung ke submenu yang sesuai. Hanya proyek yang ditetapkan menjadi acuan penyusunan WBS baru pada Project Management.')+
  '<div class="ps27-helpflow">'+items.map((x,i)=>'<div><span class="ps27-sheet-number">0'+(i+1)+'</span><h4 style="margin:10px 0 6px;color:#123c68">'+x[1]+'</h4><p>'+x[2]+'</p>'+ps27SheetJump('Buka '+x[1],x[0])+'</div>').join('')+'</div>'+
  '<div class="ps27-sheet-subhead"><h4>Alur keputusan dan keluaran</h4></div><div class="ps27-sheet-tablewrap"><table class="ps27-sheet-table"><thead><tr><th>Tahap</th><th>Keluaran yang diperiksa</th><th>Berikutnya</th></tr></thead><tbody>'+
  '<tr><td>Usulan</td><td>Tujuan, business case, manfaat, stakeholder, risiko dan dokumen program</td><td>Pemetaan proyek</td></tr>'+
  '<tr><td>Pemetaan</td><td>Proyek relevan dan pemilik pekerjaan teridentifikasi</td><td>Prioritasi</td></tr>'+
  '<tr><td>Prioritasi</td><td>SMART: peringkat & snapshot. MCDA: hasil gate, peringkat P1–P4, alokasi direkomendasikan/cadangan, versi hasil di Repositori (Draft/Final). Proyek di luar ISTK berhenti di sini (tidak ke Penetapan/WBS)</td><td>Charter</td></tr>'+
  '<tr><td>Charter</td><td>Rencana awal, milestone, manfaat, kriteria penyelesaian, unit pengelola</td><td>Penetapan</td></tr>'+
  '<tr><td>Penetapan</td><td>Kontrak K-Wide, target triwulan dan cakupan proyek terpilih</td><td>Draft RKMK / WBS</td></tr>'+
  '<tr><td>RKMK</td><td>Narasi rancangan direviu dan disiapkan untuk proses formal</td><td>Project Management setelah penetapan</td></tr>'+
  '</tbody></table></div>'+ps27SheetNote('Batasan proses','Pencatatan dalam aplikasi harus sesuai dokumen keputusan dan peran yang berwenang. Penetapan proyek tidak otomatis mengaktifkan WBS historis.','gold')+'</div>';
 }
 if(tab==='fill'){
  const tasks=[
   ['01','Riwayat & usulan','Pilih tahun aktif. Dari Riwayat Program, salin bila perlu. Pada Usulan Program, klik baris untuk membuka detail dan lengkapi data.','usulan:detail'],
   ['02','Business Case','Isi mandat, kebutuhan, tujuan, opsi dan argumentasi nilai tambah program; pastikan konsisten dengan data program.','usulan:detail:case'],
   ['03','Manfaat & indikator','Tetapkan outcome yang terukur, baseline, target, benefit owner, kelompok penerima dan waktu ukur.','usulan:detail:benefits'],
   ['04','Stakeholder & risiko','Petakan pemangku kepentingan, ketergantungan lintas unit, risiko dan rencana mitigasi.','usulan:detail:stakeholders'],
   ['05','Pemetaan proyek','Ambil referensi Riwayat Proyek atau buat usulan baru. Periksa nama, ruang lingkup, UIC, tahun, status dan kode.','mapping:proposal'],
   ['06','Prioritasi proyek','Pilih metode SMART atau MCDA sesuai program dan tahun.','prioritasi:ranking'],
   ['07','Charter Program','Susun charter tingkat program dan periksa pratinjau 3 slide sebelum penetapan. Dokumen proyek disusun per proyek di Project Management.','charter'],
   ['08','Kontrak dan penetapan','Periksa target K-Wide TW I–IV, nomor/tanggal/pejabat, dokumen kontrak dan proyek terpilih sebelum penetapan.','penetapan-program'],
   ['09','Reviu RKMK','Periksa substansi tahun tujuan, penanggung jawab dan keluaran sebelum mengunduh rancangan Word.','rkmk']
  ];
  if(yr()>=2027){tasks.splice(5,1);tasks.forEach((x,i)=>x[0]=String(i+1).padStart(2,'0'));tasks.push(['N','Clearance Proyek Non ISTK','Buka jalur clearance tersendiri: lengkapi Usulan Non-ISTK dan gate G1–G4, nilai K1–K7, cek Anggaran & SDM, analisis bila diperlukan, lalu simpan Riwayat Hasil. ISTK tidak dinilai.','prioritasi:mcda-non'])}
  return '<div class="ps27-sheet">'+ps27SheetHead('CARA PENGISIAN · PRAKTIS','Langkah Pengisian dari Hulu ke Hilir','Panduan pengisian mengikuti form dan tab yang benar-benar tersedia pada Project Selection.')+
   '<div class="ps27-sheet-grid ps27-sheet-grid3">'+tasks.map(x=>ps27SheetCard(x[0],x[1],x[2],ps27SheetJump('Buka form',x[3]))).join('')+'</div>'+
   ps27SheetNote('Kapan pekerjaan dianggap selesai?','Setiap tahap perlu diperiksa sesuai kelengkapan, otoritas dan dokumen pendukung. Mengisi form, menekan Simpan atau mendapatkan skor SMART bukan otomatis penetapan.','gold')+'</div>';
 }
 if(tab==='roles'){
  return '<div class="ps27-sheet">'+ps27SheetHead('PERAN & AKSES','Siapa Mengisi, Mereviu, dan Menetapkan?','Kewenangan aplikasi mengikuti hak akses dan penugasan organisasi. Reviu dan pencatatan kontrak tidak sama dengan keputusan pejabat yang berwenang.')+
  '<div class="ps27-sheet-tablewrap"><table class="ps27-sheet-table"><thead><tr><th>Peran</th><th>Dalam Project Selection</th><th>Batasan</th></tr></thead><tbody>'+
   '<tr><td><b>PMO Kementerian</b></td><td>Menyiapkan standar, memeriksa usulan, mengonsolidasikan dan memfasilitasi proses penetapan.</td><td>Telaah PMO tidak menggantikan kewenangan persetujuan.</td></tr>'+
   '<tr><td><b>PMO Unit / UIC</b></td><td>Mengisi program dan proyek, melengkapi indikator, stakeholder, risiko, charter, jadwal dan bukti.</td><td>Hanya data serta aksi sesuai unit dan hak akses.</td></tr>'+
   '<tr><td><b>Pemilik Proses Bisnis</b></td><td>Memvalidasi kebutuhan layanan, manfaat, outcome dan kriteria keberhasilan.</td><td>Penanggung jawab substansi bukan otomatis pejabat penetap.</td></tr>'+
   '<tr><td><b>Sponsor / Pejabat Berwenang</b></td><td>Memberikan keputusan formal atas program/proyek dan kontrak kinerja sesuai ketentuan.</td><td>Pencatatan pada aplikasi harus mengikuti keputusan resmi.</td></tr>'+
   '</tbody></table></div>'+
  '<div class="ps27-sheet-grid ps27-sheet-grid2">'+
   ps27SheetCard('01','Permintaan revisi','Jika substansi belum sesuai, kembalikan kepada UIC/pemilik proses bisnis untuk melengkapi dokumen, tujuan dan cakupan proyek.')+
   ps27SheetCard('02','Persetujuan dan penetapan','Periksa kesesuaian keputusan formal, kesiapan kontrak K-Wide dan status proyek sebelum dinyatakan ditetapkan.')+
  '</div>'+ps27SheetNote('Kewenangan data','Fitur yang tampil, hak ubah, dan hak penetapan dipengaruhi peran pengguna. Tidak semua pengguna boleh menyetujui program dan proyek.','gold')+'</div>';
 }
 if(tab==='check'){
  return '<div class="ps27-sheet">'+ps27SheetHead('CHECKLIST · PRA-PENETAPAN','Pemeriksaan Sebelum Menetapkan','Gunakan checklist ini untuk memastikan rancangan program dan proyek siap diambil keputusan. Centang pada dokumen kerja resmi; checklist ini merupakan panduan, bukan formulir persetujuan.')+
  '<div class="ps27-sheet-checks"><span>□ Tahun dan program tujuan benar</span><span>□ Mandat, business case dan outcome jelas</span><span>□ Benefit owner dan indikator disepakati</span><span>□ UIC dan stakeholder dipetakan</span><span>□ Risiko dan dependensi diperiksa</span><span>□ Proyek terpilih dan ruang lingkup jelas</span><span>□ SMART dipakai secara konsisten jika aktif</span><span>□ Dokumen charter siap direviu</span><span>□ Output dan target TW I–IV sesuai</span><span>□ Kontrak K-Wide dan metadata lengkap</span><span>□ Pejabat/otoritas penetapan jelas</span><span>□ Draft RKMK konsisten tahun tujuan</span></div>'+
  '<div class="ps27-sheet-subhead"><h4>Setelah program ditetapkan</h4></div><div class="ps27-sheet-grid ps27-sheet-grid3">'+
   ps27SheetCard('PM','Project Management','Susun WBS baru dan kelola pelaksanaan, baseline, bukti, risiko, perubahan, dan penutupan.')+
   ps27SheetCard('CM','Change Management','Susun analisis dampak, kesiapan stakeholder, komunikasi, pelatihan dan ukuran adopsi sesuai kebutuhan perubahan.')+
   ps27SheetCard('EV','Evaluasi manfaat','Pantau capaian dan kebermanfaatan setelah pelaksanaan; bedakan kemajuan pekerjaan dari manfaat yang benar-benar terealisasi.')+
  '</div>'+ps27SheetNote('Catatan','Persetujuan/penetapan tetap mengikuti kewenangan dan mekanisme resmi. Checklist ini tidak otomatis menyimpan status atau mengubah data proyek.','gold')+'</div>';
 }
 return '<div class="ps27-sheet">'+ps27SheetHead('BANTUAN','Panduan Penggunaan Project Selection','Pilih Peta Menu, Tahapan, Cara Pengisian, Peran atau Checklist untuk memulai.')+'</div>';
}

function ps27SheetHead(kicker,title,desc){
 return '<div class="ps27-sheet-head"><span class="ps27-sheet-kicker">'+kicker+'</span><h3>'+title+'</h3><p>'+desc+'</p></div>';
}
function ps27SheetCard(no,title,body,footer){
 return '<article class="ps27-sheet-card"><div class="ps27-sheet-cardtop"><span class="ps27-sheet-number">'+no+'</span><h4>'+title+'</h4></div><p>'+body+'</p>'+(footer?'<div class="ps27-sheet-foot">'+footer+'</div>':'')+'</article>';
}
function ps27SheetJump(text,destination){
 return '<button type="button" class="ps27-sheet-link" data-ps27-jump="'+destination+'" aria-label="Buka '+text+'">'+text+' <span aria-hidden="true">↗</span></button>';
}
function ps27SheetNote(title,body,kind){
 return '<div class="ps27-sheet-note '+(kind||'')+'"><strong>'+title+'</strong><span>'+body+'</span></div>';
}
function sheetPage(tab){
 const p=current(),criteria=B.criteria||[];
 if(tab==='framework'){
  const steps=[
   ['01','Usulan Program','ISTK','Sasaran strategis, mandat/kebutuhan, riwayat program atau usulan baru.','Pilih tahun; salin riwayat bila perlu; lengkapi identitas, business case, manfaat (baseline, target, benefit owner), stakeholder, risiko, tata kelola dan reviu. Buat dokumen dari isian.','Usulan program tahun tujuan; Dokumen Program dan Dokumen Portofolio (jika digenerasi).','usulan:detail','Ke Pemetaan Proyek'],
   ['02','Pemetaan Proyek','ISTK','Usulan program, riwayat proyek atau usulan baru.','Petakan proyek ISTK ke program tujuan; lengkapi ruang lingkup, jenis inisiatif, UIC, pemilik probis, estimasi biaya, durasi dan SDM.','Daftar usulan proyek per program; Dokumen Usulan Proyek bila dibuat.','mapping:proposal','Ke Charter Program'],
   ['N','Clearance Proyek Non ISTK','JALUR TERPISAH · 2027+','Usulan pengembangan SI di luar ISTK, kajian kebutuhan, pemetaan EA, estimasi biaya/durasi/SDM, bobot, pagu dan kapasitas.','Usulan Non-ISTK: lengkapi data dan gate. Prioritasi & Hasil: nilai K1–K7 → peringkat → simulasi Anggaran & SDM (ISTK lebih dulu) → Analisis opsional → simpan Riwayat Hasil. Metode & Kriteria: MCDA utama, SMART pembanding.','Daftar usulan dan peringkat Non-ISTK; rekomendasi alokasi/cadangan; snapshot Draft/Final untuk forum clearance.','prioritasi:mcda-non','Ke forum telaah SI, bukan Charter ISTK'],
   ['03','Charter Program','ISTK','Dokumen Program, cakupan proyek ISTK dan target manfaat.','Susun charter tingkat program: latar belakang, tujuan, terobosan, output, outcome, key milestones, risiko dan pengelola. Periksa pratinjau; unduh charter.','Charter Program sebagai bahan penetapan dan sumber isi kerangka RKMK.','charter','Ke Penetapan Program'],
   ['04','Penetapan Program','ISTK','Charter, daftar proyek terpilih, kesiapan dokumen, target output TW I–IV dan kontrak K-Wide.','Lengkapi target; catat kontrak K-Wide yang ditetapkan beserta metadata/dokumen; pastikan program tercakup dan persyaratan terpenuhi. Tetapkan program beserta proyek melalui aksi berwenang.','Program dan cakupan proyek berstatus Ditetapkan; target K-Wide tercatat; acuan WBS baru.','penetapan-program','Ke Project Management dan Draft RKMK'],
   ['05','Draft RKMK','ISTK','Program tahun aktif yang dipilih, Charter Program, judul dan data kerangka naskah.','Kompilasi daftar program, uraian dan milestone dari charter; pratinjau dan unduh kerangka DOCX; lengkapi bagian umum di Word. Setelah keputusan resmi, unggah PDF TTE dan metadata KMK.','Kerangka RKMK (.docx); versi arsip RKMK Ditetapkan bila PDF TTE diunggah.','rkmk','Dokumen penetapan / arsip resmi']
  ];
  const blocks=[...steps.filter(x=>x[0]!=='N'),...steps.filter(x=>x[0]==='N')].map(x=>'<article class="ps27-ipo-row'+(x[0]==='N'?' ps27-ipo-row-non':'')+'"><div class="ps27-ipo-step"><span class="ps27-sheet-number">'+x[0]+'</span><div><h4>'+E(x[1])+'</h4><small>'+E(x[2])+'</small></div>'+ps27SheetJump('Buka',x[6])+'</div><div class="ps27-ipo-cell"><span class="ps27-ipo-label">INPUT</span><p>'+E(x[3])+'</p></div><div class="ps27-ipo-cell process"><span class="ps27-ipo-label">PROSES</span><p>'+E(x[4])+'</p></div><div class="ps27-ipo-cell output"><span class="ps27-ipo-label">OUTPUT</span><p>'+E(x[5])+'</p><small class="ps27-ipo-next">'+E(x[7])+'</small></div></article>').join('');
  return '<div class="ps27-sheet ps27-ipo">'+ps27SheetHead('PROJECT SELECTION · 2027+','Alur Project Selection: Input → Proses → Output','Lima tahap Program & Proyek ISTK dan satu jalur Clearance Proyek Non ISTK yang independen. Simulasi Anggaran & SDM menghubungkan keduanya tanpa mencampur proses penetapan.')+
   '<div class="ps27-ipo-map"><div class="ps27-ipo-lane"><b>ISTK</b><div>'+['Usulan Program','Pemetaan Proyek','Charter Program','Penetapan Program'].map(s=>'<span>'+E(s)+'</span>').join('<i>›</i>')+'<i>›</i><span class="ps27-ipo-end">WBS baru (PM)</span></div><small>Charter juga menjadi sumber Draft RKMK. Prioritasi tidak menilai proyek ISTK.</small></div><div class="ps27-ipo-lane non"><b>NON-ISTK</b><div>'+['Usulan SI','Gate G1–G4','Skor & Peringkat','Anggaran & SDM','Riwayat Hasil'].map(s=>'<span>'+E(s)+'</span>').join('<i>›</i>')+'<i>›</i><span class="ps27-ipo-end">Forum clearance</span></div><small>Analisis opsional sebelum simpan hasil; tidak otomatis masuk Charter, Penetapan Program, Draft RKMK atau WBS ISTK.</small></div></div>'+
   '<div class="ps27-sheet-subhead"><h4>Rincian input, proses dan output kedua jalur</h4><span>Klik Buka untuk menuju menu</span></div><div class="ps27-ipo-table"><div class="ps27-ipo-cols"><span>TAHAP</span><span>INPUT · bahan awal</span><span>PROSES · tindakan pengguna</span><span>OUTPUT · hasil</span></div>'+blocks+'</div>'+
   '<div class="ps27-sheet-subhead"><h4>Titik keputusan dan serah terima</h4></div><div class="ps27-sheet-grid ps27-sheet-grid3">'+
   ps27SheetCard('GATE','Non-ISTK belum memenuhi gate','Lengkapi jawaban atau tinjau ulang usulan. Pada pengaturan bawaan hanya usulan Lolos dengan tujuh skor lengkap yang diranking.',ps27SheetJump('Penilaian & Peringkat','prioritasi:mcda-rank'))+
   ps27SheetCard('SDM','Estimasi belum lengkap','Lengkapi biaya, durasi dan kebutuhan SDM di form sumber atau ikon edit pada Anggaran & SDM. Biaya/SDM ISTK kosong saat ini dihitung nol dalam simulasi, sehingga sisa kapasitas belum dapat dianggap final.',ps27SheetJump('Anggaran & SDM','prioritasi:mcda-roadmap'))+
   ps27SheetCard('PM','Program ditetapkan','Susun WBS baru di Project Management berdasarkan cakupan proyek yang ditetapkan. Kelola perubahan di Change Management sesuai kebutuhan; WBS dan realisasi historis tidak otomatis diaktifkan.')+
   '</div><div class="ps27-sheet-subhead"><h4>Hubungan antarlevel</h4></div><div class="ps27-sheet-grid ps27-sheet-grid3">'+
    ps27SheetCard('P','Program','Sekumpulan proyek terkait yang dikelola bersama untuk mencapai manfaat bersama.','Berisi tujuan, outcome, benefit owner, tata kelola dan target program.')+
    ps27SheetCard('PR','Proyek','Hasil/layanan yang diusulkan dan dipilih untuk mendukung target program.','Menjadi cakupan keputusan penetapan dan acuan dokumen proyek.')+
    ps27SheetCard('W','WBS','Pemecahan pekerjaan ke deliverable, paket kerja, PIC, jadwal, bobot dan bukti pelaksanaan.','Disusun pada Project Management setelah penetapan; bukan salinan WBS historis.')+
   '</div>'+ps27SheetNote('Batas kewenangan','Skor, rekomendasi alokasi, simpan snapshot, dan unduh kerangka bukan persetujuan formal. Penetapan dan clearance mengikuti keputusan pejabat/forum yang berwenang. Untuk tahun 2026 ke bawah, prioritisasi per program tetap mengikuti metode yang berlaku.','gold')+'</div>';
 }
 if(tab==='governance'){
  const governance=[
   ['01','Strategic Alignment','Tujuan program terhubung dengan mandat/kebijakan serta indikator outcome.'],
   ['02','Business Case','Urgensi, opsi solusi, nilai tambah, biaya/manfaat dan asumsi utama terdokumentasi.'],
   ['03','Benefits Management','Indikator, baseline, target, penerima manfaat dan benefit owner teridentifikasi.'],
   ['04','Stakeholder Engagement','Pemangku kepentingan, ekspektasi, pengaruh serta pendekatan pelibatannya dipetakan.'],
   ['05','Risk & Dependencies','Risiko lintas proyek, ketergantungan, mitigasi dan penanggung jawab dicatat.'],
   ['06','Governance & Roadmap','Sponsor, hak keputusan, penanggung jawab, milestone dan kapasitas tersedia.']
  ];
  return '<div class="ps27-sheet">'+
   ps27SheetHead('TATA KELOLA · PROGRAM LEVEL','Kerangka Tata Kelola dan Pengambilan Keputusan','Enam area kelengkapan yang membantu PMO melakukan reviu program secara konsisten. Ini adalah rancangan kriteria aplikasi yang selaras praktik PMI, bukan daftar kolom wajib yang diklaim berasal dari PMI.')+
   '<div class="ps27-sheet-grid ps27-sheet-grid3">'+governance.map(x=>ps27SheetCard(x[0],x[1],x[2])).join('')+'</div>'+
   '<div class="ps27-sheet-subhead"><h4>Pembagian peran kerja</h4><span>Pelaksana vs pengambil keputusan</span></div>'+
   '<div class="ps27-sheet-tablewrap"><table class="ps27-sheet-table"><thead><tr><th>Peran</th><th>Tanggung jawab utama</th><th>Batas kewenangan</th></tr></thead><tbody>'+
   '<tr><td><b>PMO Kementerian</b></td><td>Standar, konsolidasi, reviu lintas unit, fasilitasi keputusan dan pemantauan portofolio.</td><td>Telaah PMO bukan pengganti persetujuan pejabat penetap.</td></tr>'+
   '<tr><td><b>PMO Unit / UIC</b></td><td>Menyiapkan usulan, melengkapi dokumen, proyek, target, dan data yang menjadi tanggung jawabnya.</td><td>Tidak dapat mengesahkan di luar hak akses/penugasan.</td></tr>'+
   '<tr><td><b>Pemilik proses bisnis</b></td><td>Memastikan kebutuhan, outcome, indikator manfaat dan acceptance criteria relevan.</td><td>Pemilik probis bukan otomatis penetap kontrak kinerja.</td></tr>'+
   '<tr><td><b>Sponsor/pejabat berwenang</b></td><td>Memutuskan penetapan sesuai mekanisme dan kewenangan resmi.</td><td>Catatan aplikasi harus mencerminkan keputusan/dokumen resmi.</td></tr>'+
   '</tbody></table></div>'+
   '<div class="ps27-sheet-grid ps27-sheet-grid2">'+
    ps27SheetCard('PROG','Risiko dan manfaat program','Mencatat outcome, dependensi serta risiko lintas proyek dengan horizon manfaat bersama.',ps27SheetJump('Usulan Program','usulan:detail'))+
    ps27SheetCard('PRJ','Rincian pelaksanaan proyek','Memelihara risiko operasional, jadwal, target kerja, WBS, bukti dukung dan change request pada Project Management.',ps27SheetJump('Penetapan Program','penetapan-program'))+
   '</div>'+
   ps27SheetNote('Ketentuan penetapan','Kontrak K-Wide dan target output per triwulan menjadi dasar penetapan dalam alur aplikasi untuk tahun yang relevan. Data dan bukti kontrak tidak boleh disamakan dengan persetujuan otomatis.','gold')+
   '</div>';
 }
 if(tab==='carry'){
  return '<div class="ps27-sheet">'+
   ps27SheetHead('CARRY OVER · TAHUN SUMBER → TAHUN TUJUAN','Menggunakan Riwayat Tanpa Menggandakan Realisasi','Carry over membantu penyusunan rancangan tahun baru. Sumber historis tetap dapat ditelusuri dan tidak diubah oleh usulan yang baru.')+
   '<div class="ps27-sheet-grid ps27-sheet-grid2">'+
    '<section class="ps27-sheet-panel positive"><h4>✓ Informasi yang dapat menjadi referensi/salinan</h4><ul><li>Identitas, kode referensi, nama dan ringkasan program.</li><li>Business case, narasi, manfaat, stakeholder, risiko dan tata kelola sebagai draf.</li><li>Identitas proyek dan relasi ke program tujuan yang dipilih.</li><li>Referensi charter/dokumen yang tersedia untuk direviu kembali.</li></ul></section>'+
    '<section class="ps27-sheet-panel negative"><h4>✕ Informasi yang tidak otomatis diaktifkan</h4><ul><li>Realisasi WBS dan capaian pekerjaan tahun sumber.</li><li>Bukti dukung, validasi, serta riwayat persetujuan lama.</li><li>Status penetapan program dan proyek tahun sebelumnya.</li><li>Baseline WBS lama atau jadwal tanpa verifikasi untuk tahun baru.</li></ul></section>'+
   '</div>'+
   '<div class="ps27-sheet-subhead"><h4>Langkah aman carry over</h4></div>'+
   '<div class="ps27-sheet-grid ps27-sheet-grid3">'+
    ps27SheetCard('01','Pilih sumber','Cari program/proyek di riwayat dan pastikan tahun serta identitasnya benar.',ps27SheetJump('Riwayat Program','usulan:bank'))+
    ps27SheetCard('02','Salin sebagai draf','Buat usulan tahun tujuan dan periksa pemetaan proyek; jangan mengubah arsip sumber.',ps27SheetJump('Riwayat Proyek','mapping:history'))+
    ps27SheetCard('03','Reviu & tetapkan','Periksa narasi, output, tanggal, benefit owner, sponsor, UIC dan kontrak yang relevan.',ps27SheetJump('Usulan Program','usulan:detail'))+
   '</div>'+
   '<div class="ps27-sheet-subhead"><h4>Kontrol kualitas data sebelum penetapan</h4></div>'+
   '<div class="ps27-sheet-checks"><span>□ Tahun tujuan & jadwal relevan</span><span>□ Output TW I–IV diperiksa</span><span>□ Sponsor dan UIC benar</span><span>□ Risiko dan stakeholder terkini</span><span>□ Manfaat & KPI masih tepat</span><span>□ Dokumen sumber dapat ditelusuri</span></div>'+
   ps27SheetNote('Catatan penting','Status salinan tetap draf dan perlu diputuskan kembali untuk tahun tujuan. Perubahan pada data tujuan tidak mengubah data sumber, sedangkan WBS baru disusun setelah penetapan.','gold')+
   '</div>';
 }
 if(tab==='ea')return eaSheet();
 if(tab==='formula'){
  const weighted=criteria.map(k=>({code:k.code,name:k.name,w:Math.max(0,Number(p?.psWeights?.[k.code]??k.w??1)||0)}));
  const total=weighted.reduce((n,k)=>n+k.w,0);
  const fmt=n=>Number(n||0).toFixed(2);
  return '<div class="ps27-sheet">'+
   ps27SheetHead('METODE PRIORITISASI','SMART dan MCDA','Prioritasi memakai salah satu dari dua metode yang dipilih per program pada menu Prioritasi. Keduanya alat bantu yang transparan; hasilnya bahan keputusan forum, bukan penetapan otomatis.')+
   mcdaCompare()+
   '<div class="ps27-sheet-subhead"><h4>A. SMART · Simple Multi-Attribute Rating Technique</h4><span>12 kriteria · ambang skor</span></div>'+
   '<div class="ps27-sheet-formulas">'+
    '<article><span>01 · NORMALISASI</span><strong>Bobot kriteria ÷ Σ bobot</strong><small>Σ bobot aktif'+(total?' = '+fmt(total):' belum tersedia')+'</small></article>'+
    '<article><span>02 · UTILITY MANFAAT</span><strong>(Nilai − 1) ÷ 4</strong><small>Untuk kriteria manfaat pada skala 1–5.</small></article>'+
    '<article><span>03 · UTILITY BIAYA</span><strong>(5 − Nilai) ÷ 4</strong><small>Untuk kriteria yang memiliki orientasi biaya.</small></article>'+
    '<article><span>04 · SKOR AKHIR</span><strong>100 × Σ(bobot normalisasi × utility)</strong><small>Skor tidak lengkap jika masih ada penilaian yang belum diisi.</small></article>'+
   '</div>'+
   '<div class="ps27-sheet-subhead"><h4>Daftar kriteria & bobot program aktif</h4><span>'+weighted.length+' kriteria terdaftar</span></div>'+
   (weighted.length?'<div class="ps27-sheet-tablewrap"><table class="ps27-sheet-table"><thead><tr><th>Kode</th><th>Kriteria</th><th>Bobot</th><th>Normalisasi</th></tr></thead><tbody>'+
    weighted.map(x=>'<tr><td><span class="ps27-sheet-chip">'+E(x.code)+'</span></td><td>'+E(x.name)+'</td><td>'+fmt(x.w)+'</td><td>'+(total?fmt(100*x.w/total)+'%':'—')+'</td></tr>').join('')+
    '</tbody><tfoot><tr><th colspan="2">TOTAL</th><th>'+fmt(total)+'</th><th>'+(total?'100,00%':'—')+'</th></tr></tfoot></table></div>':
    ps27SheetNote('Belum ada referensi kriteria','Buka tab Kriteria & Bobot pada Prioritasi untuk melihat daftar kriteria yang berlaku pada program aktif.'))+
   '<div class="ps27-sheet-grid ps27-sheet-grid2">'+
    ps27SheetCard('AMB','Ambang kelulusan','Pada mode SMART, proyek yang memenuhi syarat nilai dan memiliki skor <b>lebih besar</b> dari ambang yang ditentukan dapat ditampilkan sebagai calon lolos.','Jangan menyamakan angka skor dengan keputusan penetapan.')+
    ps27SheetCard('SNAP','Snapshot Penilaian','Simpan rekaman skor dan pilihan proyek pada waktu tertentu agar hasil sebelum/sesudah perubahan dapat dibandingkan.',ps27SheetJump('Penilaian & Peringkat','prioritasi:ranking'))+
   '</div>'+
   mcdaSection()+
   ps27SheetNote('Batasan penggunaan','SMART dan MCDA merupakan alat bantu seleksi, bukan persetujuan otomatis. Rekomendasi prioritas tetap perlu mempertimbangkan mandat, risiko, kesiapan, dependensi, serta kapasitas; keputusan akhir pada forum tata kelola.','gold')+
   '</div>';
 }
 if(tab==='rkmk'){
  return '<div class="ps27-sheet">'+
   ps27SheetHead('RKMK · DOKUMEN RANCANGAN','Dari Data Seleksi ke Narasi Draft RKMK','Draft RKMK mengonsolidasikan usulan dan hasil seleksi menjadi bahan reviu. Isi yang berasal dari tahun sumber harus diperiksa ulang agar tidak keliru dianggap sebagai keputusan tahun tujuan.')+
   '<div class="ps27-sheet-grid ps27-sheet-grid3">'+
    ps27SheetCard('01','Sumber informasi','Profil program, business case, stakeholder, risiko, manfaat, charter dan pemetaan proyek yang tersedia.','Sumber narasi dicantumkan atau dapat ditelusuri.')+
    ps27SheetCard('02','Konsolidasi draf','Susun narasi sasaran, ruang lingkup, output, timeline, peran unit, serta hubungan program/proyek.','Bagian yang belum dikonfirmasi tetap ditandai sebagai draf.')+
    ps27SheetCard('03','Reviu & keluaran','Periksa konsistensi dengan usulan, dokumen penetapan, target tahunan dan kontrak relevan.',ps27SheetJump('Buka Draft RKMK','rkmk'))+
   '</div>'+
   '<div class="ps27-sheet-subhead"><h4>Checklist reviu substansi</h4></div>'+
   '<div class="ps27-sheet-checks"><span>□ Tujuan dan dasar program</span><span>□ Hasil pemetaan proyek</span><span>□ Output/outcome dan manfaat</span><span>□ Target tahun dan TW</span><span>□ Sponsor, pemilik probis, UIC</span><span>□ Milestone dan risiko</span><span>□ Kesesuaian dokumen sumber</span><span>□ Keputusan penetapan terkini</span></div>'+
   '<div class="ps27-sheet-grid ps27-sheet-grid2">'+
    '<section class="ps27-sheet-panel"><h4>Jika narasi sumber tersedia</h4><p>Gunakan narasi yang tersedia sebagai referensi awal, lalu periksa apakah kebijakan, target, UIC, dan jadwal masih sesuai tahun tujuan.</p></section>'+
    '<section class="ps27-sheet-panel"><h4>Jika narasi sumber belum tersedia</h4><p>Nyatakan kondisi sumber secara transparan. Rancangan dapat dibangun dari data program/charter yang tersedia, bukan diklaim sebagai salinan dokumen resmi.</p></section>'+
   '</div>'+
   ps27SheetNote('Status dokumen','Unduhan Word dari submenu Draft RKMK merupakan rancangan kerja, bukan RKMK definitif atau dokumen yang otomatis telah disahkan. Area yang memerlukan konfirmasi tidak boleh diabaikan.','gold')+
   '</div>';
 }

 if(tab==='kwide'){
  return '<div class="ps27-sheet">'+
   ps27SheetHead('PENETAPAN · K-WIDE','Kontrak Kinerja & Cakupan Proyek','Penetapan Program mencakup proyek yang terpilih. Kontrak K-Wide menjadi dasar pencatatan target output per triwulan dan keputusan tahun program yang relevan.')+
   '<div class="ps27-sheet-band"><div><span>01 · TARGET</span><b>Capaian K-Wide</b><p>Definisikan output TW I–IV dan tanggal cut-off sesuai kesepakatan.</p></div><div><span>02 · KONTRAK</span><b>Dokumen penetapan</b><p>Catat nomor, tanggal, pejabat penetap, cakupan dan berkas pendukung.</p></div><div><span>03 · CAKUPAN</span><b>Program + proyek</b><p>Periksa proyek pilihan sebelum melakukan penetapan bersama.</p></div></div>'+
   '<div class="ps27-sheet-subhead"><h4>Alur dan pembeda penetapan</h4></div>'+
   '<div class="ps27-sheet-grid ps27-sheet-grid3">'+
    ps27SheetCard('A','Persiapan target','PMO Unit/UIC menyiapkan keluaran, penanggung jawab dan usulan target; hasilnya direviu PMO Kementerian.')+
    ps27SheetCard('B','Pencatatan kontrak','Nomor kontrak, tanggal penetapan, pejabat dan dokumen menjadi metadata keputusan yang dapat ditelusuri.')+
    ps27SheetCard('C','Penetapan program & proyek','Setelah persyaratan dipenuhi, penetapan program menyertakan daftar proyek terpilih, bukan submenu Penetapan Proyek terpisah.',ps27SheetJump('Buka Penetapan Program','penetapan-program'))+
   '</div>'+
   '<div class="ps27-sheet-tablewrap"><table class="ps27-sheet-table"><thead><tr><th>Aspek</th><th>Ditetapkan pada Project Selection</th><th>Dilanjutkan pada Project Management</th></tr></thead><tbody>'+
   '<tr><td><b>Program</b></td><td>Tujuan, output dan kontrak K-Wide sesuai keputusan.</td><td>Koordinasi proyek, rencana pelaksanaan dan pelaporan.</td></tr>'+
   '<tr><td><b>Proyek</b></td><td>Cakupan proyek yang masuk program untuk tahun tujuan.</td><td>Dokumen proyek, WBS, baseline, bukti dan change request.</td></tr>'+
   '<tr><td><b>Manfaat</b></td><td>Indikator target dan benefit owner.</td><td>Monitoring pelaksanaan dan evaluasi manfaat setelah implementasi.</td></tr>'+
   '</tbody></table></div>'+
   ps27SheetNote('Batasan','Tersimpannya kontrak bukan bukti WBS sudah aktif. Cakupan proyek yang ditetapkan tidak memindahkan realisasi atau dokumen persetujuan tahun sebelumnya. Keputusan harus mengikuti kewenangan formal.','gold')+'</div>';
 }
 if(tab==='terms'){
  const dictionary=[
   ['Project Selection','Proses memilih program/proyek yang akan ditetapkan menjadi dasar rencana pelaksanaan.'],
   ['Program','Kelompok proyek yang dikoordinasikan untuk memperoleh manfaat bersama.'],
   ['Proyek','Upaya sementara untuk menghasilkan keluaran atau layanan yang spesifik.'],
   ['Portofolio','Kumpulan program/proyek yang dikelola untuk mendukung sasaran strategis; tidak harus saling terkait secara langsung.'],
   ['Business Case','Analisis dasar kebutuhan, alternatif, biaya, manfaat dan alasan usulan dipilih.'],
   ['SMART','Simple Multi-Attribute Rating Technique: 12 kriteria berbobot dengan ambang skor, untuk memilih proyek dalam satu program.'],
   ['MCDA','Multi-Criteria Decision Analysis — “skor tertimbang + gate”: gate G1–G4, skor 7 kriteria berbobot, kategori P1–P4, dan roadmap terhadap pagu & SDM.'],
   ['Gate (G1–G4)','Penyaring awal MCDA: selaras strategi/EA, tidak duplikatif, sponsor & pemilik jelas, kajian kebutuhan sudah dikirim. Hasil: Lolos, Tinjau Ulang, Lengkapi.'],
   ['Profil bobot','Set bobot K1–K7 pada MCDA: Seimbang, Prioritas Kepatuhan, atau Prioritas Efisiensi; profil aktif dipakai untuk skor.'],
   ['Roadmap Didanai / Cadangan','Hasil MCDA yang mengurutkan usulan berdasarkan peringkat sampai pagu anggaran dan kapasitas SDM (orang-bulan) habis.'],
   ['Kuadran Nilai–Kemudahan','Pemetaan usulan MCDA menjadi Quick Win, Proyek Strategis, Pelengkap, atau Tunda / Kaji Ulang.'],
   ['WSJF','Weighted Shortest Job First: Cost of Delay ÷ Job Size, dipakai sebagai pembanding peringkat MCDA.'],
   ['Repositori hasil','Arsip versi hasil prioritasi MCDA per tahun (Draft/Final) beserta bobot dan roadmap saat disimpan.'],
   ['Di luar ISTK (Non-ISTK)','Usulan proyek SI yang tidak termapping ke program/ISTK: ikut prioritasi MCDA, hasil clearance final menjadi masukan Peta Rencana; tidak masuk penetapan program ISTK dan tidak dipantau PMO Kemenkeu.'],
   ['Kriteria & Bobot','Aspek penilaian dan tingkat kepentingan relatif yang dipakai dalam skor prioritas.'],
   ['Utility','Transformasi nilai kriteria ke skala pembanding sebelum penggabungan berbobot.'],
   ['Ambang','Batas skor yang ditetapkan untuk penyaringan calon proyek pada mode SMART.'],
   ['Snapshot','Rekaman kondisi skor, bobot dan pilihan proyek pada waktu tertentu untuk dibandingkan.'],
   ['Carry Over','Penggunaan kembali identitas/referensi historis sebagai draf tahun tujuan, tanpa mengaktifkan realisasi lama.'],
   ['K-Wide','Kontrak kinerja tingkat kementerian yang dicatat sebagai acuan penetapan dan target keluaran.'],
   ['UIC','Unit in Charge: unit yang ditugaskan bertanggung jawab pada suatu usulan atau kegiatan.'],
   ['PMO','Project Management Office: fungsi koordinasi dan pengendalian pengelolaan proyek.'],
   ['CMO','Change Management Office: fungsi pengelolaan kesiapan, komunikasi, pelatihan, adopsi dan perubahan.'],
   ['Stakeholder','Pihak yang memengaruhi, terdampak, atau mempunyai kepentingan pada hasil program/proyek.'],
   ['Risk & Dependency','Potensi peristiwa penghambat dan ketergantungan kepada aktivitas/pihak lain.'],
   ['Benefit Owner','Pihak yang memiliki akuntabilitas pengukuran dan realisasi manfaat.'],
   ['Charter','Dokumen dasar yang memuat tujuan, ruang lingkup, tata kelola dan keluaran program/proyek.'],
   ['Acceptance Criteria','Kriteria terukur untuk menyatakan hasil atau deliverable telah memenuhi persyaratan.'],
   ['Baseline','Rencana lingkup/jadwal/biaya yang telah disetujui sebagai dasar pengendalian proyek.'],
   ['WBS','Work Breakdown Structure: uraian hasil dan paket kerja untuk pelaksanaan proyek.'],
   ['RKMK','Rencana Kerja Manajerial Kementerian Keuangan; dalam aplikasi ini ditampilkan rancangan untuk direviu.'],
   ['Output / Outcome','Output merupakan keluaran langsung; outcome merupakan dampak atau hasil yang ingin dicapai.'],
   ['Benefit Realization','Penilaian sejauh mana manfaat yang direncanakan telah benar-benar diwujudkan.']
  ];
  return '<div class="ps27-sheet">'+ps27SheetHead('GLOSARIUM · ISTILAH & BATASAN','Kamus Istilah Project Selection','Seluruh istilah dan penjelasan konsep disajikan di Cheatsheet, bukan di Bantuan operasional.')+
   '<input class="sk-search" type="search" data-ps27-help-search placeholder="Cari istilah, misalnya SMART, MCDA, gate, K-Wide, WBS..." aria-label="Cari istilah pada Cheatsheet">'+
   '<div class="ps27-sheet-gloss">'+dictionary.map(x=>'<article data-ps27-menuitem="'+E((x[0]+' '+x[1]).toLowerCase())+'"><h4>'+E(x[0])+'</h4><p>'+E(x[1])+'</p></article>').join('')+'</div>'+
   ps27SheetNote('Interpretasi istilah','Penggunaan konsep pada menu mengikuti proses yang diimplementasikan. Ketentuan persetujuan formal tetap ditetapkan oleh kebijakan dan keputusan yang berlaku.','gold')+'</div>';
 }
 if(tab==='reference'){
  return '<div class="ps27-sheet">'+ps27SheetHead('REFERENSI · BATASAN KERANGKA','Landasan Konseptual dan Sumber Data','Cheatsheet menjelaskan konsep dan aturan aplikasi yang bisa dipelajari pengguna. Jangan menyamakan referensi metodologi, keputusan desain, dan dasar penetapan formal.')+
  '<div class="ps27-sheet-grid ps27-sheet-grid3">'+
   ps27SheetCard('PMI','Praktik manajemen program/proyek','Area strategic alignment, benefits management, stakeholder, risk, governance, charter dan WBS dipakai sebagai inspirasi kerangka kerja.','Pemeriksaan kelengkapan dalam aplikasi adalah desain implementasi, bukan klaim daftar kolom wajib PMI.')+
   ps27SheetCard('APP','Aturan dan formula aplikasi','SMART (utility, normalisasi, ambang, snapshot), MCDA (gate, skor tertimbang, profil bobot, alokasi, riwayat hasil), status dan penguncian alur mengikuti logika yang diimplementasikan.',ps27SheetJump('Kriteria & Bobot','prioritasi:criteria'))+
   ps27SheetCard('DOC','Dokumen resmi dan penetapan','Target dan kontrak K-Wide serta keputusan program/proyek harus sesuai dokumen, kewenangan dan proses formal pada tahun tujuan.',ps27SheetJump('Penetapan Program','penetapan-program'))+
  '</div>'+
  '<div class="ps27-sheet-grid ps27-sheet-grid2">'+
   ps27SheetCard('RKMK','Rancangan dan reviu narasi','Draft RKMK merupakan keluaran kerja yang disusun dari data program/charter untuk dikonfirmasi, bukan dokumen yang otomatis definitif.',ps27SheetJump('Buka Draft RKMK','rkmk'))+
   ps27SheetCard('PM/CM','Pemisahan evaluasi dan monitoring','Project Selection hanya menetapkan target manfaat (Usulan › Manfaat). Realisasi manfaat dievaluasi di PM › Pascaproyek; indikator adopsi di CM › ADP › Indikator dan Monev.',ps27SheetJump('Buka Prioritasi','prioritasi'))+
  '</div>'+
  ps27SheetNote('Ketelitian sumber','Materi di halaman ini merangkum konsep dan perilaku aplikasi. Pengaturan yang memerlukan landasan hukum/keputusan resmi harus diperiksa pada dokumen sumber yang berlaku; Cheatsheet tidak menggantikannya.','gold')+'</div>';
 }

 return '<div class="ps27-sheet">'+ps27SheetHead('REFERENSI','Cheatsheet Project Selection','Pilih salah satu tab untuk membaca kerangka kerja, tata kelola, carry over, formula prioritas, atau rancangan RKMK.')+'</div>';
}

function open(mode){
 const isSheet=mode==='sheet';
 let tab=isSheet?'framework':'map';
 const tabs=isSheet?
  [['framework','Alur Project Selection'],['governance','Tata Kelola'],['carry','Carry Over'],['formula','SMART & MCDA'],['ea','Telaah SI & Proses Bisnis EA'],['kwide','Penetapan K-Wide'],['rkmk','RKMK'],['terms','Istilah'],['reference','Referensi']]:
  [['map','Peta Menu'],['flow','Tahapan'],['fill','Cara Pengisian'],['roles','Peran & Akses'],['check','Checklist']];
 const old=document.querySelector('.ps27-rich-overlay');if(old)old.remove();
 const previous=document.activeElement;
 const root=document.createElement('div');root.className='sk-overlay ps27-rich-overlay';root.setAttribute('data-ps27-rich','1');
 const label=isSheet?'Cheatsheet':'Bantuan';
 const subtitle=isSheet?'Alur input–proses–output, metodologi, tata kelola, dan referensi penetapan.':'Peta menu, tahapan, cara pengisian, peran dan checklist kerja.';
 root.innerHTML='<section class="sk-dialog ps27-rich-dialog" role="dialog" aria-modal="true" aria-label="'+label+' Project Selection">'+
 '<header class="sk-head"><div class="sk-hwrap"><div class="sk-hicon" aria-hidden="true">'+(isSheet?'▤':'?')+'</div><div class="sk-hwords"><div class="sk-overline">'+(isSheet?'REFERENSI TATA KELOLA & KONSEP':'PANDUAN PENGGUNA APLIKASI')+'</div><h2>'+label+' Project Selection</h2><p>'+subtitle+'</p></div><button class="sk-close" type="button" data-ps27-close aria-label="Tutup '+label+'">×</button></div></header>'+
 '<nav class="sk-tabbar" role="tablist" aria-label="Tab '+label+' Project Selection">'+tabs.map(x=>'<button type="button" role="tab" data-ps27-htab="'+x[0]+'" class="sk-tab" aria-selected="'+(tab===x[0]?'true':'false')+'">'+x[1]+'</button>').join('')+'</nav>'+
 '<main class="sk-content ps27-rich-content"><section class="sk-view ps27-rich-body" role="tabpanel">'+(isSheet?sheetPage(tab):helpPage(tab))+'</section></main>'+
 '<footer class="sk-footer"><span><b>'+(isSheet?'Cheatsheet = alur & referensi.':'Bantuan = cara menggunakan aplikasi.')+'</b> '+(isSheet?'Untuk petunjuk pengisian rinci buka Bantuan.':'Untuk teori, istilah dan formula buka Cheatsheet.')+'</span><span>Project Selection · 2027–2029</span></footer></section>';
 document.body.appendChild(root);
 function close(){root.remove();if(previous&&previous.isConnected&&previous.focus)previous.focus({preventScroll:true})}
 root.addEventListener('click',function(ev){
  if(ev.target===root||ev.target.closest('[data-ps27-close]')){close();return}
  const b=ev.target.closest('[data-ps27-htab],[data-ps27-jump]');if(!b)return;
  if(b.dataset.ps27Jump){const target=b.dataset.ps27Jump;close();navigate(target);return}
  tab=b.dataset.ps27Htab;
  root.querySelectorAll('[data-ps27-htab]').forEach(x=>x.setAttribute('aria-selected',String(x.dataset.ps27Htab===tab)));
  root.querySelector('.ps27-rich-body').innerHTML=isSheet?sheetPage(tab):helpPage(tab);
  root.querySelector('.sk-content').scrollTop=0;
 });
 root.addEventListener('input',function(ev){
  if(!ev.target.matches('[data-ps27-help-search]'))return;
  const search=ev.target.value.toLowerCase().trim();
  root.querySelectorAll('[data-ps27-menuitem]').forEach(item=>{item.hidden=!!search&&!String(item.dataset.ps27Menuitem||'').includes(search)});
  root.querySelectorAll('.ps27-ea-dom').forEach(d=>{if(search&&!d.hidden)d.open=true;d.querySelectorAll('.ps27-ea-l1').forEach(c=>{const hit=!search||c.textContent.toLowerCase().includes(search);c.hidden=!hit;c.querySelectorAll('li').forEach(li=>li.classList.toggle('hit',!!search&&li.textContent.toLowerCase().includes(search)))})});
 });
 root.addEventListener('keydown',function(ev){if(ev.key==='Escape'){ev.preventDefault();close()}});
}

B.page=page;B.mount=mount;B.open=open;B.version='20261109-help-cheatsheet-rich-v1';
window.MT_PS_WORKFLOW={carrySelected,cloneProgram,syncWbs,navigate,version:B.version};
if(typeof VIEW!=='undefined'&&VIEW==='project-selection'&&ME)render();
if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('toggle',ev=>{const d=ev.target;if(!d||!d.matches||!d.matches('details[data-ps27-chopen]'))return;const id=d.dataset.ps27Chopen,cur=new Set(chOpen());if(d.open)cur.add(id);else cur.delete(id);S.ui.ps27ChOpen=[...cur]},true);
})();
