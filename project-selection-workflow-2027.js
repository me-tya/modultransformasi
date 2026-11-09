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
const state=()=>{const u=I.state();const map={portfolio:'usulan',program:'usulan',projects:'mapping',criteria:'prioritasi',monev:'prioritasi',reference:'prioritasi'};if(map[u.tab])u.tab=map[u.tab];if(u.tab==='penetapan')u.tab='penetapan-program';if(!['usulan','mapping','prioritasi','charter','penetapan-program','rkmk'].includes(u.tab))u.tab='usulan';return u};
const list=()=>I.programs();
const current=()=>I.pickedProgram();
const ws=()=>{S.ui.ps27=S.ui.ps27||{sourceYear:2026,selected:[],search:'',sub:'identity',filterOpen:false};return S.ui.ps27};
const TABS=[['usulan','Usulan Program'],['mapping','Pemetaan Proyek'],['prioritasi','Prioritasi'],['charter','Charter Program'],['penetapan-program','Penetapan Program'],['rkmk','Draft RKMK']];
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
 const p=clone(src);p.id=uid('program');p.akr=nextAkr();const m=String(src.kode||'').toUpperCase().match(/^[BT]\d{2}-([A-Z0-9-]+)$/);const akronim=m?m[1]:String(src.akr||src.nama||'PROG').toUpperCase().replace(/[^A-Z0-9-]/g,'')||'PROG';p.kode=(/^tematik$/i.test(String(src.jenis||''))?'T':'B')+String(to).slice(-2)+'-'+akronim;p.nama=src.nama;p.psYear=to;p.mulai=to;p.periode=to+'–'+to;p.psStatus='Draft';p.psDraft=true;p.status='Perencanaan';p.psListStatus='Legacy';p.arsip=false;delete p.psArchivedAt;delete p.psArchivedBy;delete p.psArchiveReason;delete p.psArchiveEvidence;delete p.psArchiveYear;delete p.psArchivePeriod;delete p.psArchiveSource;delete p.psHistoricalTkdBackfill;delete p.psHistoricalClosedYear;delete p.closing;p.psGovernanceV=1;
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
 usulan:'Susun usulan program: Riwayat Program hanya referensi untuk menyalin data, sedangkan penambahan dan penyuntingan substansi dilakukan di Daftar Program.',
 mapping:'Gunakan Riwayat Proyek untuk mengambil referensi proyek lintas tahun ke program tujuan tanpa mengubah WBS atau realisasi historis. Lengkapi usulan di tab berikutnya.',
 prioritisasi:'Prioritaskan dan nilai proyek dengan kriteria yang tersedia. Hasilnya menjadi masukan pemilihan proyek untuk program.',
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
 const statusOf=x=>window.MT_PS_BANK_CORE?.programStatus?.(x,yr())||(x.arsip?'Arsip':x.psCarry||!x.psYear?'Legacy':'Baru');
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
   filterIcon='<span class="ps27-filter-ic" aria-hidden="true">'+
   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg></span>';
 return '<div class="ps27-filter ps27-filter-panel'+(w.filterOpen?' is-open':'')+'" aria-label="Filter Project Selection" role="search">'+
 '<div class="ps27-filter-header" data-ps27="filter" role="button" tabindex="0" aria-expanded="'+!!w.filterOpen+'" aria-label="'+(w.filterOpen?'Sembunyikan':'Tampilkan')+' filter Project Selection" title="Klik area filter untuk '+(w.filterOpen?'menyembunyikan':'menampilkan')+' pilihan filter"><div class="ps27-filter-titlebar">'+filterIcon+
 '<button type="button" class="ps27-filter-label" data-ps27="filter" aria-expanded="'+!!w.filterOpen+'">Filter</button></div>'+
 '<div class="ps27-filter-active"><b>FILTER AKTIF</b><span>'+(active.length?active.map(t=>'<em>'+E(t)+'</em>').join(''):'Belum ada — semua data')+'</span>'+
 '<span class="ps27-filter-spacer"></span><small>'+listOptions.length+' dari '+opts.length+' program</small>'+
 '<button type="button" class="ps27-filter-reset" data-ps27-reset title="Atur ulang filter di menu ini">↺ Atur ulang</button>'+
 '<button type="button" class="ps27-filter-expand" data-ps27="filter" title="'+(w.filterOpen?'Tutup filter':'Buka filter')+'" aria-label="'+(w.filterOpen?'Tutup filter':'Buka filter')+'">'+(w.filterOpen?'▴':'▾')+'</button></div></div>'+
 (w.filterOpen?'<div class="ps27-filter-body" id="ps27-filter-options"><div class="ps27-filter-fields">'+
 '<label>Tahun <select data-ps27-year><option value="all" '+(yFilter==='all'?'selected':'')+'>Semua tahun</option>'+years.map(y=>'<option value="'+y+'" '+(String(yFilter)===String(y)?'selected':'')+'>'+y+'</option>').join('')+'</select></label>'+
 '<div class="ps27-filter-period"><b>Periode</b><div class="ps27-filter-periodset">'+[['all','Setahun'],['TW 1','TW 1'],['TW 2','TW 2'],['TW 3','TW 3'],['TW 4','TW 4'],['range','Rentang']].map(x=>
 '<button type="button" data-ps27-period="'+x[0]+'" class="'+(period===x[0]?'on':'')+'" aria-pressed="'+(period===x[0])+'">'+x[1]+'</button>').join('')+'</div></div>'+
 '<label>Program <select data-ps27-prog><option value="">Semua Program</option>'+listOptions.map(x=>'<option value="'+E(x.id)+'" '+((onBank?String(b.filterProgram)===String(x.id):u.tab==='usulan'&&tab==='detail'?String(b.detailProgram)===String(x.id):!f.allProgramsSelected&&p&&x.id===p.id)?'selected':'')+'>'+E(x.nama)+'</option>').join('')+'</select></label>'+
 '<label>Unit <select data-ps27-unit><option value="all">Semua UE I</option>'+units.map(x=>'<option value="'+E(x)+'" '+(unit===x?'selected':'')+'>'+E(x)+'</option>').join('')+'</select></label>'+
 '<label>Peran Unit <select data-ps27-role>'+[['all','Utama/Pendukung'],['utama','UIC Utama'],['pendukung','UIC Pendukung']].map(x=>'<option value="'+x[0]+'" '+(role===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+'</select></label>'+
 '<label>Status <select data-ps27-status>'+[['all','Semua Status'],['Baru','Baru'],['Legacy','Legacy'],['Arsip','Arsip']].map(x=>'<option value="'+x[0]+'" '+(st===x[0]?'selected':'')+'>'+x[1]+'</option>').join('')+'</select></label>'+
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
 [['ranking','Penilaian & Peringkat','Menilai dan mengurutkan proyek; skor adalah bahan pertimbangan, bukan penetapan.'],['criteria','Kriteria & Bobot','Atur kriteria dan bobot prioritas; perubahan bobot memengaruhi hasil penilaian.'],['monev','Monev & Manfaat','Pantau indikator dan manfaat yang tercatat, bukan realisasi WBS.'],['reference','Referensi & Formula','Pelajari referensi, perhitungan, dan batas penggunaan skor.']].map(x=>
 '<button role="tab" type="button" data-ps27-sub="'+x[0]+'" title="'+E(x[2])+'" aria-label="'+E(x[1]+'. '+x[2])+'" aria-selected="'+(sub===x[0])+'" class="'+(sub===x[0]?'on':'')+'">'+x[1]+'</button>').join('')+'</nav>'+
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
 const all=[...active,...historical],visible=all.filter(p=>active.includes(p)||d.rows.some(x=>String(x.programId)===String(p.id)&&+x.quarter===q));
 const sum=wideSummary(d,all),status=d.contract.status||'Konsep',fixed=status==='Ditetapkan';
 const filled=active.filter(p=>[1,2,3,4].some(qq=>{const r=wideRow(d,p,qq);return String(r.targets||'').trim()&&Number(r.targetCount)>0}));
 return '<section class="ps27-card ps27-kwide" aria-label="Penetapan Program melalui Kontrak Kinerja K-Wide">'+
  '<div class="ps27-cardtop"><div><h3>Penetapan Program · Kontrak Kinerja K-Wide '+y+'</h3><p>Rancang target output dan tanggal cut-off per triwulan. Jumlah target/realisasi dan capaian dihitung untuk seluruh program aktif, mengikuti sheet Capaian K-Wide.</p></div><span class="ps27-status">'+E(status)+'</span></div>'+
  '<div class="ps27-wide-summary">'+sum.map(x=>'<div><b>TW '+x.q+'</b><strong>'+x.actual+' / '+x.target+'</strong><small>Capaian '+(x.pct==null?'—':x.pct.toLocaleString('id-ID')+'%')+'</small></div>').join('')+'</div>'+
  '<div class="ps27-kwide-contract">'+
  [['number','Nomor Kontrak Kinerja K-Wide','text'],['date','Tanggal Penetapan','date'],['link','Tautan / Referensi Dokumen Kontrak','url'],['signer','Pejabat Penetap','text']].map(([k,label,type])=>
   '<label>'+label+'<input type="'+type+'" data-ps27-wide-contract="'+k+'" value="'+E(d.contract[k]||'')+'" '+(fixed?'readonly':'')+' placeholder="'+E(label)+'"></label>').join('')+'</div>'+
  '<div class="ps27-kwide-tabs" role="tablist" aria-label="Target output per triwulan">'+[1,2,3,4].map(n=>'<button type="button" role="tab" aria-selected="'+(q===n)+'" class="'+(q===n?'on':'')+'" data-ps27="wide-quarter" data-wide-quarter="'+n+'">TW '+n+'</button>').join('')+'</div>'+
  '<div class="ps27-tablewrap ps27-kwide-tablewrap"><table class="ps27-table ps27-kwide-table"><colgroup><col style="width:4%"><col style="width:20%"><col style="width:34%"><col style="width:13%"><col style="width:9%"><col style="width:10%"><col style="width:10%"></colgroup>'+
  '<thead><tr><th>No</th><th>Program Transformasi</th><th>Target Output TW '+q+'</th><th>Tanggal Cut-off</th><th>Jumlah Target Output</th><th>Jumlah Realisasi Output</th><th>Bukti Dukung</th></tr></thead><tbody>'+
  (visible.length?visible.map((p,i)=>{const row=wideRow(d,p,q),archived=!active.includes(p);return '<tr data-wide-row="'+E(p.id)+'"><td>'+(i+1)+'</td><td><b>'+E(p.nama)+'</b><small>'+E(p.kode||p.akr||'')+(archived?' · Arsip (histori)':'')+'</small></td>'+
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
 return '<div class="ps27-card ps27-approval-panel" id="ps27-project-approval"><div class="ps27-cardtop"><div><h3>Cakupan Proyek dalam Penetapan Program</h3><p>Kontrak K-Wide menjadi prasyarat. Program ditetapkan beserta proyek terpilih; daftar final menjadi acuan Project Management → Perencanaan → WBS. Prioritisasi SMART bersifat opsional.</p></div><span class="ps27-status">'+E(p.psStatus||'Draft')+'</span></div>'+
 '<div class="ps27-approval-select"><label>Program yang ditetapkan <select data-ps27-approval-program aria-label="Pilih program untuk menetapkan beserta proyeknya">'+list().filter(x=>!x.arsip&&x.psListStatus!=='Arsip').map(x=>'<option value="'+E(x.id)+'" '+(String(p.id)===String(x.id)?'selected':'')+'>'+E(x.nama)+'</option>').join('')+'</select></label></div>'+ 
 '<div class="ps27-minimetrics"><span><b>'+a.length+'</b> proyek dipilih</span><span><b>'+rows.length+'</b> WBS draft</span><span><b>'+(r?r.done+'/7':'—')+'</b> kesiapan dokumen</span></div>'+
 (r&&r.applies&&!r.ok?'<div class="ps27-warning">Kelengkapan program belum memenuhi persyaratan: '+E(r.missing.join(', '))+'. <button class="btn btn-outline btn-sm" data-ps27-tab="usulan">Lengkapi Usulan</button></div>':'')+
 '<div class="ps27-tablewrap"><table class="ps27-table"><thead><tr><th>Proyek / Modul</th><th>UIC</th><th>Target</th><th>Skor</th><th>Status</th></tr></thead><tbody>'+
 (a.length?a.map(x=>'<tr><td><b>'+E(x.name)+'</b></td><td>'+E(x.uic||p.uic||'—')+'</td><td>'+E(x.goLive||'—')+'</td><td>'+(p.psPrioritize?(I.calc(x,p).score??'Belum lengkap'):'Manual')+'</td><td>'+E(already?'Ditetapkan':'Siap ditetapkan')+'</td></tr>').join(''):'<tr><td colspan="5" class="ps27-center">Belum ada proyek dipilih. Lengkapi di Pemetaan Proyek atau Prioritasi.</td></tr>')+
 '</tbody></table></div><div class="ps27-footer">'+(already?'<span>Program beserta '+a.length+' proyek telah ditetapkan. Susun WBS baru melalui Project Management.</span><button class="btn" data-pswf="reopen">Buka Revisi</button><button class="btn pri" data-ps27="go-wbs">Buka WBS ›</button>':
 '<span>Program dan proyek ditetapkan bersama setelah kontrak K-Wide tercatat dan dokumen lengkap. WBS disusun setelahnya.</span><button class="btn pri" data-pswf="finalize" '+(!can(p)||!a.length||(r?.applies&&!r?.ok)||((+p.psYear||yr())>=2027&&(wideState().contract.status!=='Ditetapkan'||!wideState().contract.programIds?.includes(String(p.id))))?'disabled':'')+' title="Tetapkan program berikut seluruh proyek yang dipilih setelah persyaratan K-Wide dan kesiapan terpenuhi">Tetapkan Program beserta '+a.length+' Proyek</button>')+'</div></div>';
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
 const actual=stage==='penetapan'?'penetapan-program':TABS.some(t=>t[0]===stage)?stage:'usulan';
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
  window.MT_PS_SCOPE.bank().mappingTab=['proposal','usulan-proyek'].includes(sub)?'proposal':['results','hasil'].includes(sub)?'results':['docs','dokumen'].includes(sub)?'docs':'history';
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
 // The selected year's data, filter label and list heading must resolve from one value
 // before generating this view; otherwise the filter can say 2027 while the table says 2026.
 const f=localFilter(),selected=String(f.year||'');
 if(/^20\d{2}$/.test(selected)&&+S.ui.psSelectedYear!==+selected)S.ui.psSelectedYear=+selected;
 const p=current(),u=state(),T=list(),countAll=T.reduce((n,x)=>n+count(x),0);
 let h=vh('PS','pmo','Project Selection','Usulkan program, petakan proyek, prioritaskan, susun charter dan tetapkan dasar WBS.');
 h+='<section class="pswf ps27" aria-label="Project Selection">';
 h+='<div class="pm-stage-shell ps27-stage"><nav class="ptabs pmo-journey ps27-tabs" role="tablist" aria-label="Submenu Project Selection">'+
 TABS.map((t,i)=>'<button type="button" role="tab" title="'+E(TOP_HELP[t[0]]||'')+'" aria-selected="'+(u.tab===t[0])+'" class="'+(u.tab===t[0]?'on':'')+'" data-ps27-tab="'+t[0]+'"><span><em>'+(''+(i+1))+'</em> '+t[1]+'</span>'+(t[0]==='usulan'&&T.length?'<b>'+T.length+'</b>':t[0]==='mapping'&&countAll?'<b>'+countAll+'</b>':'')+'</button>').join('')+
 '</nav><span class="ps27-contextinfo" tabindex="0" role="img" aria-label="Informasi submenu '+E(TABS.find(x=>x[0]===u.tab)?.[1]||'Project Selection')+': '+E(TOP_HELP[u.tab]||'')+'" title="'+E(TOP_HELP[u.tab]||'')+'">ⓘ</span></div>';
 h+=filter(p)+actionBar(p);
 if(u.tab==='usulan')h+=usulan(p);
 else if(u.tab==='mapping')h+=mapping(p);
 else if(u.tab==='prioritasi')h+=prioritasi(p);
 else if(u.tab==='charter')h+=charter(p);
 else if(u.tab==='penetapan-program')h+=widePanel()+penetapan(p);
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
   else if(window.confirm('Buat revisi kontrak K-Wide?'))revise();
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
   else if(window.confirm('Catat kontrak K-Wide '+contract.number+'?'))finish();
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
function helpPage(tab){
 const items=[
  ['usulan','Usulan Program','Cari riwayat, buat dan lengkapi usulan, business case, manfaat, stakeholder, risiko, tata kelola, serta dokumen portofolio.'],
  ['mapping','Pemetaan Proyek','Pilih proyek lintas tahun dari riwayat, kelola identitas usulan, hasil pemetaan, dan dokumen usulan proyek tanpa menyalin WBS historis.'],
  ['prioritasi','Prioritasi','Beri penilaian dan urutkan calon proyek. SMART dan ambang bersifat opsional; skor hanya membantu pengambilan keputusan.'],
  ['charter','Charter Program','Lengkapi tujuh bagian dokumen: As-is, To-be, Perbandingan, Charter, Kriteria, Manfaat, dan Linimasa.'],
  ['penetapan-program','Penetapan Program','Catat kontrak K-Wide, target TW I–IV, dan tetapkan program beserta proyek terpilih dalam satu proses.'],
  ['rkmk','Draft RKMK','Tinjau narasi, cek konsistensi tahun tujuan, lengkapi catatan reviu, dan ekspor rancangan Word.']
 ];
 if(tab==='map'){
  const deep=[
   [['Riwayat Program','usulan:bank'],['Daftar Program · Kelola & Unggah / Unduh','usulan:detail'],['Dokumen Portofolio','usulan:portfolio'],['Identitas','usulan:detail:identity'],['Business Case','usulan:detail:case'],['Manfaat','usulan:detail:benefits'],['Stakeholder','usulan:detail:stakeholders'],['Risiko','usulan:detail:risks'],['Tata Kelola','usulan:detail:governance'],['Buat Dokumen Program','usulan:detail:docs']],
   [['Riwayat Proyek','mapping:history'],['Usulan Proyek','mapping:proposal'],['Hasil Pemetaan','mapping:results'],['Buat Dokumen Usulan Proyek','mapping:docs']],
   [['Penilaian & Peringkat','prioritasi:ranking'],['Kriteria & Bobot','prioritasi:criteria'],['Monev & Manfaat','prioritasi:monev'],['Referensi & Formula','prioritasi:reference']],
   [['As-is','charter:asis'],['To-be','charter:tobe'],['Perbandingan','charter:cs'],['Charter','charter:ch'],['Kriteria','charter:kp'],['Manfaat','charter:mf'],['Linimasa','charter:rk']],
   [['Kontrak K-Wide dan Cakupan Proyek','penetapan-program']],
   [['Narasi & Reviu','rkmk']]
  ];

  return '<div class="ps27-sheet">'+ps27SheetHead('NAVIGASI · PROJECT SELECTION','Peta Menu sampai Level Tab','Enam tahapan utama dan tautan langsung menuju subtab. Gunakan kolom pencarian untuk menemukan menu atau fungsi tertentu.')+
   '<input class="sk-search" type="search" data-ps27-help-search placeholder="Cari menu, tab, fungsi atau istilah seperti manfaat, kontrak, WBS..." aria-label="Cari menu Project Selection">'+
   '<div class="ps27-helpmap">'+items.map((x,i)=>'<section data-ps27-menuitem="'+E((x[1]+' '+x[2]+' '+deep[i].map(z=>z[0]).join(' ')).toLowerCase())+'"><button class="ps27-helpmap-head" data-ps27-jump="'+x[0]+'"><b>'+(i+1)+' · '+x[1]+'</b><span>Buka submenu ↗</span></button><p>'+x[2]+'</p><div class="ps27-helpmap-links">'+deep[i].map(z=>'<button type="button" data-ps27-jump="'+z[1]+'">'+z[0]+'</button>').join('')+'</div></section>').join('')+'</div>'+
   ps27SheetNote('Panduan dan referensi dipisahkan','Bantuan menjelaskan langkah penggunaan aplikasi. Definisi, metodologi SMART, istilah, tata kelola, dan dasar pemikiran ada di Cheatsheet.','gold')+
  '</div>';
 }
 if(tab==='flow'){
  return '<div class="ps27-sheet">'+ps27SheetHead('ALUR KERJA · 6 TAHAP','Tahapan dari Usulan hingga Penetapan','Pilih tahap untuk masuk langsung ke submenu yang sesuai. Hanya proyek yang ditetapkan menjadi acuan penyusunan WBS baru pada Project Management.')+
  '<div class="ps27-helpflow">'+items.map((x,i)=>'<div><span class="ps27-sheet-number">0'+(i+1)+'</span><h4 style="margin:10px 0 6px;color:#123c68">'+x[1]+'</h4><p>'+x[2]+'</p>'+ps27SheetJump('Buka '+x[1],x[0])+'</div>').join('')+'</div>'+
  '<div class="ps27-sheet-subhead"><h4>Alur keputusan dan keluaran</h4></div><div class="ps27-sheet-tablewrap"><table class="ps27-sheet-table"><thead><tr><th>Tahap</th><th>Keluaran yang diperiksa</th><th>Berikutnya</th></tr></thead><tbody>'+
  '<tr><td>Usulan</td><td>Tujuan, business case, manfaat, stakeholder, risiko dan dokumen program</td><td>Pemetaan proyek</td></tr>'+
  '<tr><td>Pemetaan</td><td>Proyek relevan dan pemilik pekerjaan teridentifikasi</td><td>Prioritasi</td></tr>'+
  '<tr><td>Prioritasi</td><td>Peringkat/pertimbangan pemilihan; snapshot bila diperlukan</td><td>Charter</td></tr>'+
  '<tr><td>Charter</td><td>Rencana awal, milestone, manfaat, kriteria penyelesaian, unit pengelola</td><td>Penetapan</td></tr>'+
  '<tr><td>Penetapan</td><td>Kontrak K-Wide, target triwulan dan cakupan proyek terpilih</td><td>Draft RKMK / WBS</td></tr>'+
  '<tr><td>RKMK</td><td>Narasi rancangan direviu dan disiapkan untuk proses formal</td><td>Project Management setelah penetapan</td></tr>'+
  '</tbody></table></div>'+ps27SheetNote('Batasan proses','Pencatatan dalam aplikasi harus sesuai dokumen keputusan dan peran yang berwenang. Penetapan proyek tidak otomatis mengaktifkan WBS historis.','gold')+'</div>';
 }
 if(tab==='fill'){
  const tasks=[
   ['01','Riwayat & usulan','Pilih tahun aktif. Dari Riwayat Program, salin bila perlu. Pada Daftar Program, klik baris untuk membuka detail dan lengkapi data.','usulan:detail'],
   ['02','Business Case','Isi mandat, kebutuhan, tujuan, opsi dan argumentasi nilai tambah program; pastikan konsisten dengan data program.','usulan:detail:case'],
   ['03','Manfaat & indikator','Tetapkan outcome yang terukur, baseline, target, benefit owner, kelompok penerima dan waktu ukur.','usulan:detail:benefits'],
   ['04','Stakeholder & risiko','Petakan pemangku kepentingan, ketergantungan lintas unit, risiko dan rencana mitigasi.','usulan:detail:stakeholders'],
   ['05','Pemetaan proyek','Ambil referensi Riwayat Proyek atau buat usulan baru. Periksa nama, ruang lingkup, UIC, tahun, status dan kode.','mapping:proposal'],
   ['06','Prioritasi proyek','Pilih manual atau SMART. Jika SMART aktif, isi kriteria dan bobot secara lengkap; gunakan snapshot untuk pembandingan.','prioritasi:ranking'],
   ['07','Charter & dokumen','Isi As-is, To-be, Perbandingan, Charter, Kriteria, Manfaat dan Linimasa. Gunakan pratinjau sebelum ekspor.','charter'],
   ['08','Kontrak dan penetapan','Periksa target K-Wide TW I–IV, nomor/tanggal/pejabat, dokumen kontrak dan proyek terpilih sebelum penetapan.','penetapan-program'],
   ['09','Reviu RKMK','Periksa substansi tahun tujuan, penanggung jawab dan keluaran sebelum mengunduh rancangan Word.','rkmk']
  ];
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
   ['01','Usulan Program','Tetapkan alasan, sasaran, sponsor, indikator manfaat, pemilik proses bisnis dan unit pengelola.','usulan:detail'],
   ['02','Pemetaan Proyek','Gunakan Riwayat Proyek sebagai referensi; pilih proyek yang relevan untuk program tahun tujuan.','mapping:history'],
   ['03','Prioritasi','Bandingkan calon proyek. SMART bersifat opsional; nilai/skor membantu pemilihan, bukan keputusan otomatis.','prioritasi:ranking'],
   ['04','Charter Program','Lengkapi tujuan, kondisi As-is/To-be, kriteria penyelesaian, manfaat dan linimasa.','charter'],
   ['05','Penetapan Program','Catat kontrak K-Wide dan tetapkan program beserta proyek terpilih pada satu tahapan.','penetapan-program'],
   ['06','Draft RKMK','Konsolidasikan narasi untuk tahun tujuan, reviu perubahan, lalu unduh rancangan dokumen.','rkmk']
  ];
  return '<div class="ps27-sheet">'+
   ps27SheetHead('KERANGKA KERJA · WHY → WHAT → HOW','Framework Program dan Proyek','Membaca keterkaitan seleksi program, penetapan proyek, pelaksanaan WBS, dan evaluasi manfaat tanpa mencampur kewenangan antarproses.')+
   '<div class="ps27-sheet-band"><div><span>WHY</span><b>Alasan perubahan</b><p>Mandat, urgensi, strategic fit, business case dan outcome.</p></div><div><span>WHAT</span><b>Program & proyek dipilih</b><p>Ruang lingkup, target output, manfaat, charter dan keputusan penetapan.</p></div><div><span>HOW</span><b>Project Management</b><p>WBS baru, pelaksanaan, pengendalian, bukti dukung, penutupan dan evaluasi.</p></div></div>'+
   '<div class="ps27-sheet-subhead"><h4>Enam tahap Project Selection</h4><span>Menu yang dapat dibuka langsung</span></div>'+
   '<div class="ps27-sheet-grid ps27-sheet-grid3">'+steps.map(x=>ps27SheetCard(x[0],x[1],x[2],ps27SheetJump('Buka '+x[1],x[3]))).join('')+'</div>'+
   '<div class="ps27-sheet-subhead"><h4>Hubungan antarlevel</h4></div>'+
   '<div class="ps27-sheet-grid ps27-sheet-grid3">'+
    ps27SheetCard('P','Program','Sekumpulan proyek terkait yang dikelola bersama untuk mencapai manfaat yang tidak optimal jika dikelola sendiri-sendiri.','Berisi tujuan, outcome, benefit owner, tata kelola dan target program.')+
    ps27SheetCard('PR','Proyek','Hasil/layanan yang diusulkan dan dipilih untuk mendukung target program.','Menjadi cakupan keputusan penetapan dan acuan dokumen proyek.')+
    ps27SheetCard('W','WBS','Pemecahan pekerjaan ke deliverable, paket kerja, PIC, jadwal, bobot dan bukti pelaksanaan.','Disusun pada Project Management setelah penetapan; bukan salinan WBS historis.')+
   '</div>'+
   ps27SheetNote('Batasan utama','Project Selection memilih dan menetapkan program beserta proyeknya. Project Management mengelola baseline WBS, progres, change request, penutupan, dan evaluasi pascaproyek. Evaluasi adopsi pengguna tetap berada di Change Management.','gold')+
   '</div>';
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
    ps27SheetCard('03','Reviu & tetapkan','Periksa narasi, output, tanggal, benefit owner, sponsor, UIC dan kontrak yang relevan.',ps27SheetJump('Daftar Program','usulan:detail'))+
   '</div>'+
   '<div class="ps27-sheet-subhead"><h4>Kontrol kualitas data sebelum penetapan</h4></div>'+
   '<div class="ps27-sheet-checks"><span>□ Tahun tujuan & jadwal relevan</span><span>□ Output TW I–IV diperiksa</span><span>□ Sponsor dan UIC benar</span><span>□ Risiko dan stakeholder terkini</span><span>□ Manfaat & KPI masih tepat</span><span>□ Dokumen sumber dapat ditelusuri</span></div>'+
   ps27SheetNote('Catatan penting','Status salinan tetap draf dan perlu diputuskan kembali untuk tahun tujuan. Perubahan pada data tujuan tidak mengubah data sumber, sedangkan WBS baru disusun setelah penetapan.','gold')+
   '</div>';
 }
 if(tab==='formula'){
  const weighted=criteria.map(k=>({code:k.code,name:k.name,w:Math.max(0,Number(p?.psWeights?.[k.code]??k.w??1)||0)}));
  const total=weighted.reduce((n,k)=>n+k.w,0);
  const fmt=n=>Number(n||0).toFixed(2);
  return '<div class="ps27-sheet">'+
   ps27SheetHead('SMART · PRIORITISASI OPSIONAL','Formula, Kriteria, Bobot dan Ambang','SMART membantu membandingkan calon proyek secara transparan. Aktifkan pada menu Prioritasi bila memang diperlukan; hasilnya tetap menjadi bahan keputusan, bukan keputusan otomatis.')+
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
   ps27SheetNote('Batasan penggunaan','SMART merupakan alat bantu seleksi, bukan persetujuan otomatis. Rekomendasi prioritas tetap perlu mempertimbangkan mandat, risiko, kesiapan, dependensi, serta kapasitas.','gold')+
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
 return '<div class="ps27-sheet">'+ps27SheetHead('REFERENSI','Cheatsheet Project Selection','Pilih salah satu tab untuk membaca kerangka kerja, tata kelola, carry over, formula prioritas, atau rancangan RKMK.')+'</div>';
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