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
const state=()=>{const u=I.state();const map={portfolio:'usulan',program:'usulan',projects:'mapping',criteria:'prioritasi',monev:'prioritasi',reference:'prioritasi'};if(map[u.tab])u.tab=map[u.tab];if(!['usulan','mapping','prioritasi','charter','penetapan','rkmk'].includes(u.tab))u.tab='usulan';return u};
const list=()=>I.programs();
const current=()=>I.pickedProgram();
const ws=()=>{S.ui.ps27=S.ui.ps27||{sourceYear:2026,selected:[],search:'',sub:'identity',filterOpen:false};return S.ui.ps27};
const TABS=[['usulan','Usulan Program'],['mapping','Pemetaan Proyek'],['prioritasi','Prioritasi'],['charter','Charter Program'],['penetapan','Penetapan'],['rkmk','Draft RKMK']];
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
 const p=clone(src);p.id=uid('program');p.akr=nextAkr();const m=String(src.kode||'').toUpperCase().match(/^[BT]\d{2}-([A-Z0-9-]+)$/);const akronim=m?m[1]:String(src.akr||src.nama||'PROG').toUpperCase().replace(/[^A-Z0-9-]/g,'')||'PROG';p.kode=(/^tematik$/i.test(String(src.jenis||''))?'T':'B')+String(to).slice(-2)+'-'+akronim;p.nama=src.nama;p.psYear=to;p.mulai=to;p.periode=to+'–'+to;p.psStatus='Draft';p.psDraft=true;p.status='Perencanaan';p.psGovernanceV=1;
 p.psCarry={sourceId:src.id,sourceAkr:src.akr,sourceYear:from,createdAt:new Date().toISOString(),reviewed:false};
 p.psSnapshots=[];p.psSelectedProjectIds=[];delete p.psFinalizedAt;delete p.psFinalizedBy;delete p.psWbsSynced;
 p.psProjects=sourceProjects(src,from).map(x=>{x.sourceProjectId=x.id;x.id=uid('proj');x.included=x.included!==false;x.status='Usulan';if(x.start)x.start=shiftDate(x.start,from,to);if(x.goLive)x.goLive=shiftDate(x.goLive,from,to);return x});
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
function navItem(tab,label,num){const on=state().tab===tab;return '<button type="button" role="tab" aria-selected="'+on+'" class="'+(on?'on':'')+'" data-ps27-tab="'+tab+'"><span>'+label+'</span>'+(num?'<b>'+num+'</b>':'')+'</button>';}
function localFilter(){
 const b=S.ui.psBank||(S.ui.psBank={}),u=state(),key=u.tab==='usulan'?'usulan:'+(b.tab||'bank'):u.tab;
 b.filterScopes=b.filterScopes||{};
 const f=b.filterScopes[key]||(b.filterScopes[key]={search:'',status:'all',program:'',year:u.tab==='usulan'&&(b.tab||'bank')==='bank'?'all':String(yr())});
 return f;
}
function setFilterField(key,val){
 const b=S.ui.psBank||(S.ui.psBank={}),f=localFilter();
 f[key]=val; // Never alter filter state in another menu or in the application header.
 if(key==='search')b.search=val;
 if(key==='status')b.filterStatus=val;
 if(key==='year'){
  b.filterYear=val;
  if(/^20\d{2}$/.test(String(val))){
   S.ui.psSelectedYear=Number(val);
   const u=state();
   const active=(S.programs||[]).filter(p=>+p.psYear===Number(val));
   if(u.prog&&!active.some(p=>String(p.id)===String(u.prog)))u.prog='';
   if(b.target&&!active.some(p=>String(p.id)===String(b.target)))b.target='';
  }
 }
}
function filter(p){
 const b=S.ui.psBank||(S.ui.psBank={}),u=state(),arr=list(),tab=b.tab||'bank',w=ws(),
  f=localFilter(),
  q=String(f.search||'').toLowerCase(),st=f.status||'all';
 b.search=f.search||'';b.filterStatus=st;b.filterYear=f.year||'all';b.filterUnit=f.unit||'all';b.filterRole=f.unitRole||'all';b.filterPeriod=f.period||'all';b.filterRangeFrom=f.rangeFrom||'';b.filterRangeTo=f.rangeTo||'';
 if(u.tab==='usulan'&&tab==='bank')b.filterProgram=f.program||'';
 if(u.tab==='usulan'&&tab==='detail')b.detailProgram=f.program||'';
 const onBank=u.tab==='usulan'&&tab==='bank',opts=onBank?(S.programs||[]):arr,
  years=[2025,2026,2027,2028,2029],yFilter=f.year||String(yr()),
  period=f.period||'all',unit=f.unit||'all',role=f.unitRole||'all';
 const statusOf=x=>x.arsip||x.psStatus==='Arsip'?'Arsip':x.psStatus==='Ditetapkan'||x.psFinalizedAt?'Ditetapkan':x.psDraft||x.psStatus==='Draft'?'Usulan':'Legacy';
 const matchesUnit=x=>{if(!unit||unit==='all')return true;const a=String(x.uic||'').toLowerCase().includes(unit.toLowerCase()),b=String(x.pend||x.psSupportingUic||'').toLowerCase().includes(unit.toLowerCase());return role==='utama'?a:role==='pendukung'?b:a||b};
 const matchesQuarter=x=>{const m=/^TW\s*(\d)$/i.exec(period),ds=(x.psProjects||[]).map(z=>String(z.goLive||z.start||'')).filter(t=>/^\d{4}-\d\d-\d\d/.test(t));if(!ds.length)return true;if(m)return ds.some(t=>Math.ceil(+t.slice(5,7)/3)===+m[1]);if(period==='range'){const from=f.rangeFrom||'',to=f.rangeTo||'';return !from&&!to||ds.some(t=>(!from||t>=from)&&(!to||t<=to))}return true};
 const listOptions=opts.filter(x=>(!q||[x.nama,x.kode,x.akr,x.uic].join(' ').toLowerCase().includes(q))&&(st==='all'||statusOf(x)===st)&&matchesUnit(x)&&matchesQuarter(x));
 const units=[...new Set(opts.flatMap(x=>[x.uic,x.pend||x.psSupportingUic].flatMap(v=>String(v||'').split(/[,;]/).map(k=>k.trim()))).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
 const active=[];
 if(period!=='all')active.push(period==='range'?'Rentang periode':period);
 if(f.programName)active.push(f.programName);
 else if(f.program)active.push(opts.find(x=>x.id===f.program)?.nama||'Program');
 if(unit!=='all')active.push(unit);
 if(st!=='all')active.push(st);
 if(q)active.push('Cari: '+q);
 if(role!=='all')active.push(role==='utama'?'UIC Utama':'UIC Pendukung');
 const on=!!w.filterOpen,
   filterIcon='<span class="ps27-filter-ic" data-mt-filter-icon title="Buka atau tutup filter menu ini" role="button" tabindex="0" aria-label="Buka atau tutup filter menu ini" aria-pressed="'+!!w.filterOpen+'">'+
   '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16l-6.5 7.8v5.2L10.5 20v-7.2z"/></svg></span>';
 return '<div class="ps27-filter ps27-filter-panel'+(w.filterOpen?' is-open':'')+'" aria-label="Filter Project Selection" role="search">'+
 '<div class="ps27-filter-header"><div class="ps27-filter-titlebar">'+filterIcon+
 '<button type="button" class="ps27-filter-label" data-ps27="filter" aria-expanded="'+!!w.filterOpen+'">Filter</button></div>'+
 '<div class="ps27-filter-active"><b>FILTER AKTIF</b><span>'+(active.length?active.map(t=>'<em>'+E(t)+'</em>').join(''):'Belum ada — semua data')+'</span>'+
 '<span class="ps27-filter-spacer"></span><small>'+listOptions.length+' dari '+opts.length+' program</small>'+
 '<button type="button" class="ps27-filter-reset" data-ps27-reset title="Atur ulang filter di menu ini">↺ Atur ulang</button>'+
 '<button type="button" class="ps27-filter-expand" data-ps27="filter" title="'+(w.filterOpen?'Tutup filter':'Buka filter')+'" aria-label="'+(w.filterOpen?'Tutup filter':'Buka filter')+'">'+(w.filterOpen?'▴':'▾')+'</button></div></div>'+
 (w.filterOpen?'<div class="ps27-filter-body"><div class="ps27-filter-fields">'+
 '<label>Tahun <select data-ps27-year><option value="all" '+(yFilter==='all'?'selected':'')+'>Semua tahun</option>'+years.map(y=>'<option value="'+y+'" '+(String(yFilter)===String(y)?'selected':'')+'>'+y+'</option>').join('')+'</select></label>'+
 '<div class="ps27-filter-period"><b>Periode</b><div class="ps27-filter-periodset">'+[['all','Setahun'],['TW 1','TW 1'],['TW 2','TW 2'],['TW 3','TW 3'],['TW 4','TW 4'],['range','Rentang']].map(x=>
 '<button type="button" data-ps27-period="'+x[0]+'" class="'+(period===x[0]?'on':'')+'" aria-pressed="'+(period===x[0])+'">'+x[1]+'</button>').join('')+'</div></div>'+
 '<label>Program <select data-ps27-prog><option value="">Semua Program</option>'+listOptions.map(x=>'<option value="'+E(x.id)+'" '+((onBank?String(b.filterProgram)===String(x.id):u.tab==='usulan'&&tab==='detail'?String(b.detailProgram)===String(x.id):!f.allProgramsSelected&&p&&x.id===p.id)?'selected':'')+'>'+E(x.nama)+'</option>').join('')+'</select></label>'+
 '<label>Unit <select data-ps27-unit><option value="all">Semua UE I</option>'+units.map(x=>'<option value="'+E(x)+'" '+(unit===x?'selected':'')+'>'+E(x)+'</option>').join('')+'</select></label>'+
 '<label>Peran Unit <select data-ps27-role>'+[['all','Utama/Pendukung'],['utama','UIC Utama'],['pendukung','UIC Pendukung']].map(x=>'<option value="'+x[0]+'" '+(role===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+'</select></label>'+
 '<label>Status <select data-ps27-status>'+[['all','Semua Status'],['Usulan','Usulan / Draft'],['Ditetapkan','Ditetapkan'],['Legacy','Legacy'],['Arsip','Arsip']].map(x=>'<option value="'+x[0]+'" '+(st===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+'</select></label>'+
 '<label class="ps27-filter-search">Cari <input type="search" data-ps27-query value="'+E(f.search||'')+'" placeholder="Nama, kode, UIC..."></label>'+
 '</div>'+(period==='range'?'<div class="ps27-filter-range"><label>Dari <input type="date" data-ps27-range-from value="'+E(f.rangeFrom||'')+'"></label><label>Sampai <input type="date" data-ps27-range-to value="'+E(f.rangeTo||'')+'"></label><small>Menampilkan program dengan rencana proyek pada rentang terpilih; program tanpa jadwal tetap ditampilkan.</small></div>':'')+'</div>':'')+'</div>';
}
function actionBar(){return '<div class="ps27-actionbar" hidden></div>';}
function sourcePicker(){
 const w=ws(),arr=sourcePrograms().filter(p=>(p.nama+' '+p.kode+' '+p.uic).toLowerCase().includes(String(w.search||'').toLowerCase())),to=yr(),allSel=arr.length&&arr.every(p=>(w.selected||[]).includes(String(p.id)));
 return '<div class="ps27-card"><div class="ps27-cardtop"><div><h3>Ambil Program Tahun Sebelumnya</h3><p>Salin seluruh detail, charter dan dokumen, daftar proyek, serta draft WBS. Data sumber tetap utuh dan capaian tidak disalin.</p></div><span class="ps27-info">Multi-select</span></div>'+
 '<div class="ps27-controls"><label>Tahun Sumber <select data-ps27-source>'+[2025,2026,2027,2028].filter(y=>y<=to).map(y=>'<option '+(y===+w.sourceYear?'selected':'')+'>'+y+'</option>').join('')+'</select></label>'+
 '<label class="ps27-grow">Cari program <input type="search" data-ps27-search value="'+E(w.search||'')+'" placeholder="Nama, kode atau UIC"></label>'+
 '<button class="btn pri" data-ps27="carry" '+(!w.selected.length||to<=+w.sourceYear?'disabled':'')+'>+ Tambah '+w.selected.length+' Program ke '+to+'</button></div>'+
 (to===+w.sourceYear?'<div class="ps27-warning">Tahun tujuan sama dengan sumber. Ubah Tahun Anggaran di header menjadi 2027/2028/2029 untuk membawa program 2026.</div>':'')+
 '<div class="ps27-tablewrap"><table class="ps27-table"><thead><tr><th class="ps27-checkcol"><input type="checkbox" data-ps27-checkall '+(allSel?'checked':'')+' aria-label="Pilih semua program"></th><th>Program sumber</th><th>UIC</th><th>Charter</th><th>Proyek</th><th>WBS '+E(w.sourceYear)+'</th></tr></thead><tbody>'+
 (arr.length?arr.map(p=>'<tr><td><input type="checkbox" data-ps27-select="'+E(p.id)+'" '+((w.selected||[]).includes(String(p.id))?'checked':'')+' aria-label="Pilih program '+E(p.nama)+'"></td><td><b>'+E(p.nama)+'</b><small>'+E(p.kode||p.akr)+'</small></td><td>'+E(p.uic||'—')+'</td><td>'+(foundCharter(p,+w.sourceYear)?'Ada':'Belum ada')+'</td><td>'+sourceProjects(p,+w.sourceYear).length+'</td><td>'+sourceWbs(p,+w.sourceYear).length+'</td></tr>').join(''):'<tr><td colspan="6" class="ps27-center">Tidak ada program sesuai filter.</td></tr>')+
 '</tbody></table></div></div>';
}
function portfolio(){
 const arr=list();return '<div class="ps27-card"><div class="ps27-cardtop"><div><h3>Daftar Usulan Program · '+yr()+'</h3><p>Pilih program untuk melengkapi profil dan register, atau ambil program yang sudah berjalan dari tahun sebelumnya.</p></div><strong>'+arr.length+' program</strong></div>'+
 '<div class="ps27-tablewrap"><table class="ps27-table"><thead><tr><th>Program</th><th>UIC</th><th>Asal</th><th>Status</th><th>Proyek</th><th>WBS draft</th><th>Aksi</th></tr></thead><tbody>'+
 (arr.length?arr.map(p=>'<tr><td><b>'+E(p.nama)+'</b><small>'+E(p.kode||p.akr)+'</small></td><td>'+E(p.uic||'—')+'</td><td>'+E(p.psCarry?'Carry over '+p.psCarry.sourceYear:'Baru / existing')+'</td><td><span class="ps27-status">'+E(p.psStatus||'Berjalan')+'</span></td><td>'+(p.psProjects?.length||0)+'</td><td>'+(p.psWbsDraft?.length||0)+'</td><td><button class="btn btn-outline btn-sm" data-ps27-pick="'+E(p.id)+'">Buka</button></td></tr>').join(''):'<tr><td colspan="7" class="ps27-center">Belum ada program pada tahun ini.</td></tr>')+
 '</tbody></table></div></div>';
}
function formProgram(p){
 if(!p)return '<div class="ps27-card"><div class="ps27-empty">Pilih program di daftar untuk membuka detail usulan.</div></div>';
 return '<div class="ps27-card ps27-governance">'+
 '<div class="ps27-cardtop"><div><h3>Profil dan Kelengkapan Program</h3><p>Identitas → Business Case → Manfaat → Stakeholder → Risiko → Tata Kelola → Reviu.</p></div>'+
 (can(p)&&p.psStatus!=='Ditetapkan'?'<button class="btn" data-pswf="edit-program">Ubah Identitas</button>':'')+'</div>'+
 (window.MT_PS_GOV?window.MT_PS_GOV.programPage(p):'')+'</div>';
}
function usulan(p){const u=ws(),tab=u.usulanSub||'daftar';const nav='<div class="ps27-minitabs" role="tablist" aria-label="Tahapan usulan program">'+[['daftar','Daftar Program'],['ambil','Ambil Program Tahun Sebelumnya'],['detail','Detail Program & Register']].map(x=>'<button type="button" role="tab" aria-selected="'+(tab===x[0])+'" class="'+(tab===x[0]?'on':'')+'" data-ps27-usul="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';return nav+(tab==='ambil'?sourcePicker():tab==='detail'?formProgram(p):portfolio());}
function mapping(p){
 if(!p)return '<div class="ps27-card"><div class="ps27-empty">Pilih program untuk memetakan proyek/modul.</div></div>';
 const a=p.psProjects||[],rows=p.psWbsDraft||[];
 return '<div class="ps27-card"><div class="ps27-cardtop"><div><h3>Pemetaan Proyek / Modul</h3><p>'+E(p.nama)+' · Cocokkan daftar proyek dengan draft WBS dari tahun sumber sebelum prioritisasi.</p></div>'+
 (can(p)&&p.psStatus!=='Ditetapkan'?'<button class="btn pri" data-pswf="add-project">+ Tambah Proyek</button>':'')+'</div>'+
 '<div class="ps27-minimetrics"><span><b>'+a.length+'</b> proyek/modul</span><span><b>'+rows.length+'</b> item WBS draft</span><span><b>'+a.filter(x=>x.included!==false).length+'</b> diusulkan</span></div>'+
 '<div class="ps27-tablewrap"><table class="ps27-table"><thead><tr><th>Proyek / Modul</th><th>UIC / PIC</th><th>Target</th><th>Item WBS terkait</th><th>Aksi</th></tr></thead><tbody>'+
 (a.length?a.map(x=>{const w=rows.filter(z=>(z.p||[]).some(s=>String(s).toLowerCase()===String(x.name).toLowerCase()));return '<tr><td><b>'+E(x.name)+'</b><small>'+E(x.outputs||x.description||'')+'</small></td><td>'+E(x.uic||p.uic||'—')+'<small>'+E(x.pic||'PIC belum ditetapkan')+'</small></td><td>'+E(x.goLive||'—')+'</td><td>'+w.length+(rows.length&&!w.length?' · cek pemetaan':'')+'</td><td><button class="btn btn-outline btn-sm" data-pswf-project="'+E(x.id)+'">Ubah</button>'+(can(p)&&p.psStatus!=='Ditetapkan'?'<button class="btn btn-ghost btn-sm" data-ps27-remove="'+E(x.id)+'">Hapus</button>':'')+'</td></tr>';}).join(''):'<tr><td colspan="5" class="ps27-center">Belum ada proyek. Gunakan Tambah Proyek atau ambil program tahun sebelumnya.</td></tr>')+'</tbody></table></div>'+
 (rows.length?'<div class="ps27-footnote">Draft WBS sudah disalin lengkap. Setelah Penetapan, item WBS yang relevan akan tersedia di Project Management → Perencanaan → WBS untuk penyesuaian detail dan baseline.</div>':'<div class="ps27-footnote">Belum ada draft WBS. Setelah Penetapan, buat WBS baru dari daftar proyek yang ditetapkan.</div>')+'</div>';
}
function prioritasi(p){
 if(!p)return '<div class="ps27-card ps27-empty">Pilih program untuk mengurutkan prioritas proyeknya.</div>';
 const sub=ws().prioritySub||'ranking',readOnly=I.readonly(p);
 const mode='<label class="ps27-smart-toggle"><input type="checkbox" id="pswf-prioritize" '+(p.psPrioritize?'checked':'')+' '+(readOnly?'disabled':'')+'><span>Gunakan prioritisasi SMART</span></label>';
 const threshold=p.psPrioritize?'<label class="ps27-smart-threshold">Ambang skor &gt; <input type="number" id="pswf-threshold" min="0" max="99" value="'+E(p.psThreshold??80)+'" '+(readOnly?'disabled':'')+' aria-label="Ambang skor SMART"> %</label>':'';
 const tip='<button class="ps27-smart-info" type="button" data-pswf="smart-info" title="Aturan pemilihan: 12 kriteria lengkap dan skor absolut lebih besar dari ambang" aria-label="Informasi aturan seleksi otomatis SMART">i</button>';
 return '<div class="ps27-priority-head"><nav class="ps27-minitabs" role="tablist" aria-label="Tab Prioritasi">'+
 [['ranking','Penilaian & Peringkat'],['criteria','Kriteria & Bobot'],['monev','Monev & Manfaat'],['reference','Referensi & Formula']].map(x=>
 '<button role="tab" type="button" data-ps27-sub="'+x[0]+'" aria-selected="'+(sub===x[0])+'" class="'+(sub===x[0]?'on':'')+'">'+x[1]+'</button>').join('')+'</nav>'+
 '<div class="ps27-smart-actions">'+mode+threshold+tip+'</div></div>'+
 (sub==='reference'?I.referencePage(p):sub==='criteria'?I.criteriaPage(p):sub==='monev'?I.monevPage(p):I.projectsPage(p));
}
function charter(p){
 if(!p)return '<div class="ps27-card ps27-empty">Pilih program untuk menampilkan Charter Program.</div>';
 S.ui.chp=p.akr;
 const c=foundCharter(p,yr())||(S.charters||[]).find(x=>x.prog===p.akr);
 let body='<div class="ps27-cardtop"><div><h3>Charter Program · 7 Dokumen Perencanaan</h3><p>Editor menggunakan komponen charter native Project Management: As-is, To-be, Perbandingan, Charter, Kriteria, Manfaat dan Linimasa.</p></div><span class="ps27-status">'+E(c?c.st:'Belum dibuat')+'</span></div>';
 if(typeof pCharter==='function'){
  const h=pCharter(),at=h.indexOf('<div class="chbc">');if(at>=0){let content=h.slice(at).replace('href="#pmo-perencanaan"','href="#project-selection"');body+='<div class="ps27-charter-native">'+content+'</div>';}
  else body+='<div class="ps27-empty">Gunakan editor Charter lengkap.</div>';
 }else body+='<div class="ps27-empty">Editor Charter belum tersedia di lingkungan ini.</div>';
 return '<div class="ps27-card ps27-charter">'+body+'</div>';
}
function penetapan(p){
 if(!p)return '<div class="ps27-card ps27-empty">Pilih program untuk penetapan.</div>';
 const a=I.chosen(p)||[],r=window.MT_PS_GOV?.readiness(p),rows=p.psWbsDraft||[],already=p.psStatus==='Ditetapkan';
 return '<div class="ps27-card"><div class="ps27-cardtop"><div><h3>Penetapan Program dan Proyek</h3><p>Daftar final menjadi acuan Project Management → Perencanaan → WBS. Prioritisasi SMART bersifat opsional.</p></div><span class="ps27-status">'+E(p.psStatus||'Draft')+'</span></div>'+
 '<div class="ps27-minimetrics"><span><b>'+a.length+'</b> proyek dipilih</span><span><b>'+rows.length+'</b> WBS draft</span><span><b>'+(r?r.done+'/7':'—')+'</b> kesiapan dokumen</span></div>'+
 (r&&r.applies&&!r.ok?'<div class="ps27-warning">Kelengkapan program belum memenuhi persyaratan: '+E(r.missing.join(', '))+'. <button class="btn btn-outline btn-sm" data-ps27-tab="usulan">Lengkapi Usulan</button></div>':'')+
 '<div class="ps27-tablewrap"><table class="ps27-table"><thead><tr><th>Proyek / Modul</th><th>UIC</th><th>Target</th><th>Skor</th><th>Status</th></tr></thead><tbody>'+
 (a.length?a.map(x=>'<tr><td><b>'+E(x.name)+'</b></td><td>'+E(x.uic||p.uic||'—')+'</td><td>'+E(x.goLive||'—')+'</td><td>'+(p.psPrioritize?(I.calc(x,p).score??'Belum lengkap'):'Manual')+'</td><td>'+E(already?'Ditetapkan':'Siap ditetapkan')+'</td></tr>').join(''):'<tr><td colspan="5" class="ps27-center">Belum ada proyek dipilih. Kembali ke Pemetaan/Prioritasi.</td></tr>')+
 '</tbody></table></div><div class="ps27-footer">'+(already?'<span>Program ditetapkan. Susun WBS baru melalui Project Management.</span><button class="btn" data-pswf="reopen">Buka Revisi</button><button class="btn pri" data-ps27="go-wbs">Buka WBS ›</button>':
 '<span>Penetapan program dan proyek tidak membawa WBS historis. WBS baru disusun setelah penetapan.</span><button class="btn pri" data-pswf="finalize" '+(!can(p)||!a.length?'disabled':'')+'>Tetapkan Program & Proyek</button>')+'</div></div>';
}
const RKMK_FIELDS=[['latar','Latar Belakang'],['tujuan','Tujuan / Sasaran'],['kondisi','Kondisi As-is'],['target','Kondisi To-be / Target'],['strategi','Strategi / Terobosan'],['output','Output / Deliverable'],['manfaat','Manfaat / Outcome'],['milestone','Milestone & Jadwal'],['risiko','Risiko & Mitigasi']];
function rkmk(p){
 if(!p)return '<div class="ps27-card ps27-empty">Pilih program untuk menyusun Draft RKMK.</div>';
 if(!p.psRkmk)p.psRkmk=newRkmk(p);
 if(!p.psRkmkReviewed)p.psRkmkReviewed={};
 const s=p.psRkmk,rev=p.psRkmkReviewed,remain=RKMK_FIELDS.filter(x=>!rev[x[0]]).length,edit=can(p)&&p.psStatus!=='Ditetapkan';
 return '<div class="ps27-card"><div class="ps27-cardtop"><div><h3>Draft Narasi RKMK · '+yr()+'</h3><p>Sumber awal: <b>'+E(p.psRkmkSource||'Data usulan program')+'</b>. Prioritaskan narasi 2025 jika tersedia; bagian kuning perlu direviu untuk tahun tujuan.</p></div><span class="ps27-reviewcount">'+remain+' perlu reviu</span></div>'+
 '<div class="ps27-rkmkgrid">'+RKMK_FIELDS.map(f=>'<label class="ps27-rkmkfield '+(rev[f[0]]?'reviewed':'needs-review')+'"><span><b>'+E(f[1])+'</b><em>'+(rev[f[0]]?'Sudah direviu':'Perlu penyesuaian')+'</em></span><textarea data-ps27-rkmk="'+f[0]+'" rows="4" '+(edit?'':'disabled')+' placeholder="Lengkapi narasi '+E(f[1])+' untuk tahun '+yr()+'">'+E(s[f[0]]||'')+'</textarea><span class="ps27-reviewline"><input type="checkbox" data-ps27-reviewed="'+f[0]+'" '+(rev[f[0]]?'checked':'')+' '+(edit?'':'disabled')+'> Sudah direviu untuk tahun '+yr()+'</span></label>').join('')+'</div>'+
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
 const actual=TABS.some(t=>t[0]===stage)?stage:'usulan';
 state().tab=actual;
 if(actual==='usulan'){
  S.ui.psBank=S.ui.psBank||{};
  const tab=['bank','daftar','ambil'].includes(sub)?'bank':sub==='portfolio'?'portfolio':'detail';
  S.ui.psBank.tab=tab;
  S.ui.psBank.workspace='';
  ws().usulanSub=tab==='bank'?'daftar':'detail';
  if(item&&['identity','case','benefits','stakeholders','risks','governance','docs'].includes(item))S.ui.psBank.wtab=item;
 }
 if(actual==='mapping'&&window.MT_PS_SCOPE){
  window.MT_PS_SCOPE.bank().mappingTab=['proposal','usulan-proyek'].includes(sub)?'proposal':['results','hasil'].includes(sub)?'results':['docs','dokumen'].includes(sub)?'docs':'mapping';
 }
 if(actual==='prioritasi'&&['ranking','criteria','monev','reference'].includes(sub)){
  ws().prioritySub=sub;
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

function page(){
 const p=current(),u=state(),T=list(),countAll=T.reduce((n,x)=>n+count(x),0);
 let h=vh('PS','pmo','Project Selection','Usulkan program, petakan proyek, prioritaskan, susun charter dan tetapkan dasar WBS.');
 h+='<section class="pswf ps27" aria-label="Project Selection">';
 h+='<div class="pm-stage-shell ps27-stage"><nav class="ptabs pmo-journey ps27-tabs" role="tablist" aria-label="Submenu Project Selection">'+
 TABS.map((t,i)=>'<button type="button" role="tab" aria-selected="'+(u.tab===t[0])+'" class="'+(u.tab===t[0]?'on':'')+'" data-ps27-tab="'+t[0]+'"><span><em>'+(''+(i+1))+'</em> '+t[1]+'</span>'+(t[0]==='usulan'&&T.length?'<b>'+T.length+'</b>':t[0]==='mapping'&&countAll?'<b>'+countAll+'</b>':'')+'</button>').join('')+
 '</nav></div>';
 h+=filter(p)+actionBar(p);
 if(u.tab==='usulan')h+=usulan(p);
 else if(u.tab==='mapping')h+=mapping(p);
 else if(u.tab==='prioritasi')h+=prioritasi(p);
 else if(u.tab==='charter')h+=charter(p);
 else if(u.tab==='penetapan')h+=penetapan(p);
 else h+=rkmk(p);
 h+='</section>';return h;
}
function mount(){
 const root=document.querySelector('#view .pswf');if(!root)return;
 root.addEventListener('click',function(ev){
  const b=ev.target.closest('[data-ps27],[data-ps27-tab],[data-ps27-pick],[data-ps27-remove],[data-ps27-sub],[data-ps27-usul],[data-ps27-reset],[data-ps27-period],[data-mt-filter-icon]');
  if(!b)return;
  ev.stopImmediatePropagation();
  if(b.hasAttribute('data-mt-filter-icon')){ws().filterOpen=!ws().filterOpen;save();render();return}
  if(b.dataset.ps27Tab){navigate(b.dataset.ps27Tab);return}
  if(b.dataset.ps27Pick){state().prog=b.dataset.ps27Pick;ws().usulanSub='detail';save();render();return}
  if(b.dataset.ps27Sub){ws().prioritySub=b.dataset.ps27Sub;if(ws().prioritySub==='reference'&&!ws().referenceVisited){I.state().formula=true;I.state().params=true;ws().referenceVisited=true}save();render();return}
  if(b.dataset.ps27Usul){ws().usulanSub=b.dataset.ps27Usul;save();render();return}
  if(b.dataset.ps27Remove){toast('Hapus proyek hanya tersedia di Pemetaan Proyek → Usulan Proyek.');return}
  if(b.hasAttribute('data-ps27-reset')){
   const f=localFilter();Object.assign(f,{search:'',status:'all',program:'',programName:'',unit:'all',unitRole:'all',period:'all',rangeFrom:'',rangeTo:'',year:state().tab==='usulan'&&(S.ui.psBank?.tab||'bank')==='bank'?'all':String(yr())});
   const st=S.ui.psBank||(S.ui.psBank={});st.filterProgram='';st.detailProgram='';f.allProgramsSelected=false;st.search='';st.filterStatus='all';st.filterYear=f.year;
   save();render();return;
  }
  if(b.hasAttribute('data-ps27-period')){setFilterField('period',b.dataset.ps27Period);save();render();return}
  const a=b.dataset.ps27;
  if(a==='filter'){ws().filterOpen=!ws().filterOpen;save();render();return}
  if(a==='carry'){carrySelected();return}
  if(a==='save-rkmk'){const p=current();if(!p||!can(p))return;
   root.querySelectorAll('[data-ps27-rkmk]').forEach(q=>p.psRkmk[q.dataset.ps27Rkmk]=q.value);
   root.querySelectorAll('[data-ps27-reviewed]').forEach(q=>p.psRkmkReviewed[q.dataset.ps27Reviewed]=q.checked);
   save();render();toast('Draft RKMK dan status reviu berhasil disimpan.');return}
  if(a==='go-wbs'){const p=current();if(!p)return;S.ui.prog=p.akr;S.ui.planYear='year';save();location.hash='#pmo-wbsplan';return}
  if(a==='help'){open('help');return}
 });
 root.addEventListener('change',function(ev){
  const el=ev.target;
  if(el.dataset.ps27Prog!==undefined){
    S.ui.psBank=S.ui.psBank||{};
    if(state().tab==='usulan'&&S.ui.psBank.tab==='bank'){S.ui.psBank.filterProgram=el.value;setFilterField('program',el.value)}
    else if(state().tab==='usulan'&&S.ui.psBank.tab==='detail'){S.ui.psBank.detailProgram=el.value;setFilterField('program',el.value)}
    else{const b=S.ui.psBank;setFilterField('program',el.value);setFilterField('allProgramsSelected',!el.value);if(el.value){state().prog=el.value;S.ui.psGov={step:'identity'};if(window.MT_PS_SCOPE)window.MT_PS_SCOPE.bank().target=el.value}}
    save();render();return
   }
   if(el.dataset.ps27Status!==undefined){S.ui.psBank=S.ui.psBank||{};setFilterField('status',el.value);save();render();return}
   if(el.dataset.ps27Unit!==undefined){setFilterField('unit',el.value);save();render();return}
   if(el.dataset.ps27Role!==undefined){setFilterField('unitRole',el.value);save();render();return}
   if(el.dataset.ps27RangeFrom!==undefined){setFilterField('rangeFrom',el.value);save();render();return}
   if(el.dataset.ps27RangeTo!==undefined){setFilterField('rangeTo',el.value);save();render();return}
  if(el.dataset.ps27Year!==undefined){setFilterField('year',el.value);save();render();return}
  if(el.dataset.ps27Source!==undefined){ws().sourceYear=+el.value;ws().selected=[];save();render();return}
  if(el.dataset.ps27Select!==undefined){const a=new Set(ws().selected||[]);if(el.checked)a.add(String(el.dataset.ps27Select));else a.delete(String(el.dataset.ps27Select));ws().selected=[...a];save();render();return}
  if(el.dataset.ps27Checkall!==undefined){ws().selected=el.checked?sourcePrograms().filter(p=>(p.nama+' '+p.kode+' '+p.uic).toLowerCase().includes(String(ws().search||'').toLowerCase())).map(p=>String(p.id)):[];save();render();return}
  if(el.dataset.ps27Reviewed!==undefined){const p=current();if(!p||!can(p))return;
   root.querySelectorAll('[data-ps27-rkmk]').forEach(q=>p.psRkmk[q.dataset.ps27Rkmk]=q.value);
   root.querySelectorAll('[data-ps27-reviewed]').forEach(q=>p.psRkmkReviewed[q.dataset.ps27Reviewed]=q.checked);
   save();render();return}
 });
 root.querySelector('[data-ps27-query]')?.addEventListener('input',ev=>{
    S.ui.psBank=S.ui.psBank||{};const t=ev.target,v=t.value,pos=t.selectionStart;
    setFilterField('search',v);save();render();
    const q=document.querySelector('[data-ps27-query]');if(q){q.focus();q.setSelectionRange(pos,pos)}
   });
   root.querySelector('[data-ps27-search]')?.addEventListener('input',function(ev){ws().search=ev.target.value;const pos=ev.target.selectionStart;save();render();const t=document.querySelector('[data-ps27-search]');if(t){t.focus();t.setSelectionRange(pos,pos)}});
 I.mount();
}
function helpPage(tab){
 const items=[
  ['usulan','Usulan Program','Bank program lintas tahun, Detail Program yang dapat diedit, dan ekspor dokumen program maupun portofolio.'],
  ['mapping','Pemetaan Proyek','Tab Pemetaan memilih proyek sumber dan tujuan; tab Usulan Proyek mengelola identitas proyek (lihat, tambah, ubah, hapus). WBS baru dibuat di Project Management.'],
  ['prioritasi','Prioritasi','SMART opsional; 12 kriteria lengkap, bobot normalisasi, skor absolut, dan penetapan ambang. Snapshot menyimpan kondisi penilaian untuk pembandingan.'],
  ['charter','Charter Program','Perencanaan proyek menggunakan As-is, To-be, Perbandingan, Charter, Kriteria, Manfaat, dan Linimasa.'],
  ['penetapan','Penetapan','Memfinalkan program dan proyek terpilih tanpa otomatis mengaktifkan WBS tahun sebelumnya.'],
  ['rkmk','Draft RKMK','Mereviu narasi rancangan RKMK; isian sumber ditandai sampai dikonfirmasi untuk tahun tujuan.']
 ];
 if(tab==='map'){
  const deep=[
   [['Daftar Program','usulan:bank'],['Detail Program','usulan:detail'],['Dokumen Portofolio','usulan:portfolio'],['Identitas','usulan:detail:identity'],['Business Case','usulan:detail:case'],['Manfaat','usulan:detail:benefits'],['Stakeholder','usulan:detail:stakeholders'],['Risiko','usulan:detail:risks'],['Tata Kelola','usulan:detail:governance'],['Buat Dokumen Program','usulan:detail:docs']],
   [['Pemetaan','mapping:mapping'],['Usulan Proyek','mapping:proposal'],['Hasil Pemetaan','mapping:results'],['Buat Dokumen Usulan Proyek','mapping:docs']],
   [['Penilaian & Peringkat','prioritasi:ranking'],['Kriteria & Bobot','prioritasi:criteria'],['Monev & Manfaat','prioritasi:monev'],['Referensi & Formula','prioritasi:reference']],
   [['As-is','charter:asis'],['To-be','charter:tobe'],['Perbandingan','charter:cs'],['Charter','charter:ch'],['Kriteria','charter:kp'],['Manfaat','charter:mf'],['Linimasa','charter:rk']],
   [['Daftar Penetapan','penetapan']],
   [['Narasi & Reviu','rkmk']]
  ];
  return '<div class="ps27-helpmap">'+items.map((x,i)=>'<section><button class="ps27-helpmap-head" data-ps27-jump="'+x[0]+'"><b>'+(i+1)+' · '+x[1]+'</b><span>Buka submenu ↗</span></button><p>'+x[2]+'</p><div class="ps27-helpmap-links">'+deep[i].map(z=>'<button type="button" data-ps27-jump="'+z[1]+'">'+z[0]+'</button>').join('')+'</div></section>').join('')+'</div>';
 }
 if(tab==='flow')return '<div class="ps27-helpflow">'+items.map((x,i)=>'<div><b>'+(i+1)+' · '+x[1]+'</b><p>'+x[2]+'</p></div>').join('')+'</div>';
 if(tab==='roles')return '<div class="ps27-helpprose"><h3>Pembagian Peran</h3><p><b>PMO Kementerian:</b> standar, reviu, konsolidasi dan koordinasi penetapan. <b>PMO Unit/UIC:</b> usulan program dan proyek, pengkinian dokumen, serta perencanaan WBS sesuai kewenangan. <b>Pemilik proses bisnis:</b> outcome, target, dan kriteria penyelesaian. <b>Sponsor/pejabat berwenang:</b> keputusan penetapan.</p><p>Detail rencana dan WBS baru dikelola di Project Management setelah program ditetapkan.</p></div>';
 if(tab==='terms')return '<div class="ps27-helpprose"><h3>Istilah Utama</h3><p><b>Program:</b> sekumpulan proyek terkait yang dikelola bersama untuk manfaat yang tidak diperoleh bila terpisah. <b>Proyek/Modul:</b> komponen hasil/layanan. <b>WBS:</b> pemecahan pekerjaan menjadi deliverable dan paket kerja. <b>Carry-over:</b> menyalin identitas, referensi, serta proyek sebagai rancangan tahun tujuan; tidak memindahkan realisasi ataupun mengaktifkan WBS lama. <b>Snapshot:</b> rekaman skor dan pilihan proyek pada satu waktu untuk dibandingkan dengan hasil penilaian terbaru.</p></div>';
 return '<div class="ps27-helpprose"><h3>Checklist Pekerjaan</h3><p>Daftar Program → Detail Program → Pemetaan → Usulan Proyek → Prioritasi (SMART opsional) → Charter → Penetapan → Draft RKMK → Project Management (WBS baru).</p><p>Untuk membandingkan skor sebelum/sesudah perubahan gunakan <b>Prioritasi → Penilaian & Peringkat → Riwayat Snapshot</b>.</p></div>';
}

function sheetPage(tab){
 const p=current(),criteria=B.criteria||[];
 if(tab==='formula'){
  const w=criteria.reduce((n,c)=>n+(+(p?.psWeights?.[c.code])||c.w||1),0);
  return '<div class="ps27-helpprose"><h3>Formula Prioritasi SMART</h3><p><b>Bobot normalisasi</b> = bobot kriteria ÷ total bobot ('+w+').</p><p><b>Utility manfaat</b> = (nilai − 1) ÷ 4. <b>Utility biaya</b> = (5 − nilai) ÷ 4.</p><p><b>Skor total</b> = 100 × Σ(bobot normalisasi × utility). Skor tersedia setelah seluruh 12 kriteria terisi. Proyek lolos otomatis apabila skor <b>lebih besar</b> dari ambang yang ditetapkan ketika SMART aktif.</p><table class="ps27-table"><thead><tr><th>Kriteria</th><th>Bobot</th><th>Normalisasi</th></tr></thead><tbody>'+criteria.map(c=>{const x=+(p?.psWeights?.[c.code])||c.w||1;return '<tr><td>'+E(c.code)+' · '+E(c.name)+'</td><td>'+x+'</td><td>'+((100*x/w).toFixed(2))+'%</td></tr>'}).join('')+'</tbody></table></div>';
 }
 if(tab==='governance')return '<div class="ps27-helpprose"><h3>Kerangka PMI tingkat Program</h3><p>Elemen: strategic alignment & business case, manfaat terukur dan benefit owner, stakeholder engagement, risk & dependencies, governance/otoritas keputusan, roadmap, kapasitas dan sumber daya. Kelengkapan minimum merupakan keputusan desain aplikasi, bukan klaim kolom wajib PMI.</p><p><b>Level program</b> menyimpan risiko/manfaat lintas proyek; <b>level proyek</b> menyimpan risiko operasional dan WBS di Project Management.</p></div>';
 if(tab==='carry')return '<div class="ps27-helpprose"><h3>Carry Over dan Kontrol Data</h3><p>Identitas, narasi, business case, register, proyek, dan dokumen charter disalin sebagai rancangan yang dapat direviu. WBS tahun sumber tidak dijadikan WBS aktif tahun tujuan. Perubahan tahun tujuan tidak mengubah sumber. Tanggal rencana bergeser ke tahun tujuan, tetapi narasi dan target wajib direviu.</p><p>Status program dan charter menjadi Draft. Realisasi WBS, bukti dukung dan riwayat persetujuan tidak disalin. WBS baru disusun di Project Management setelah Penetapan. WBS salinan lama dari versi aplikasi terdahulu tidak diaktifkan otomatis.</p></div>';
 if(tab==='rkmk')return '<div class="ps27-helpprose"><h3>Reviu Draft RKMK</h3><p>Narasi 2025 digunakan jika ada di data charter sumber. Jika tidak tersedia, aplikasi menyatakan sumber aktualnya dan menampilkan draft berbasis charter/program yang ada. Semua area berwarna kuning wajib dikonfirmasi untuk tahun tujuan.</p><p>Unduh Draft Word dari submenu Draft RKMK; dokumen ini belum menjadi RKMK definitif.</p></div>';
 return '<div class="ps27-helpprose"><h3>Framework Program dan Proyek</h3><p>Project Selection berfokus pada <b>why & what</b>: mengusulkan, memetakan, memprioritaskan, merencanakan dan menetapkan. Project Management mengelola <b>how</b>: WBS, pelaksanaan, pengendalian, monitoring dan penutupan proyek.</p></div>';
}
function open(mode){
 let tab=mode==='sheet'?'framework':'map',root=document.createElement('div');root.className='ps27-help-overlay';
 const isSheet=mode==='sheet',tabs=isSheet?[['framework','Framework'],['governance','Tata Kelola'],['carry','Carry Over'],['formula','Formula Prioritasi'],['rkmk','RKMK']]:[['map','Peta Menu'],['flow','Alur Kerja'],['roles','Peran'],['terms','Istilah'],['check','Checklist']];
 const inner=()=>'<div class="ps27-helpbody">'+(isSheet?sheetPage(tab):helpPage(tab))+'</div>';
 root.innerHTML='<section class="ps27-helpmodal" role="dialog" aria-modal="true" aria-label="'+(isSheet?'Cheatsheet':'Bantuan')+' Project Selection"><header><div><b>'+(isSheet?'Cheatsheet':'Bantuan')+' · Project Selection</b><small>'+(isSheet?'Referensi tata kelola dan formula':'Peta menu, alur, dan shortcut langsung')+'</small></div><button type="button" data-ps27-close>✕</button></header><nav role="tablist">'+tabs.map(x=>'<button type="button" data-ps27-htab="'+x[0]+'" class="'+(tab===x[0]?'on':'')+'">'+x[1]+'</button>').join('')+'</nav>'+inner()+'</section>';
 document.body.appendChild(root);
 root.addEventListener('click',function(ev){
  if(ev.target===root||ev.target.closest('[data-ps27-close]')){root.remove();return}
  const b=ev.target.closest('[data-ps27-htab],[data-ps27-jump]');if(!b)return;
  if(b.dataset.ps27Jump){root.remove();navigate(b.dataset.ps27Jump);return}
  tab=b.dataset.ps27Htab;root.querySelectorAll('[data-ps27-htab]').forEach(x=>x.classList.toggle('on',x.dataset.ps27Htab===tab));root.querySelector('.ps27-helpbody').innerHTML=isSheet?sheetPage(tab):helpPage(tab);
 });
 root.addEventListener('keydown',function(ev){if(ev.key==='Escape')root.remove()});
}
B.page=page;B.mount=mount;B.open=open;B.version='20261108-help-shortcuts-smart-priority-v2';
window.MT_PS_WORKFLOW={carrySelected,cloneProgram,syncWbs,navigate,version:B.version};
if(typeof VIEW!=='undefined'&&VIEW==='project-selection'&&ME)render();
})();