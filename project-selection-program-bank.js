/* Project Selection — Bank Program dan Workspace Program, terhubung ke alur Project Selection native. */
(function(){
'use strict';
const A=window.MT_PROJECT_SELECTION,F=window.MT_PS_WORKFLOW,I=A?.internals,Docs=window.MT_PS_DOC,Scope=window.MT_PS_SCOPE;
if(!A||!F||!I||!Docs||!Scope)return;
const oldPage=A.page,oldMount=A.mount;
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const year=()=>+S.ui.psSelectedYear||+S.ui.tahun||2026;
const can=p=>!!ME&&['SA','PMOK','PMOU'].includes(ME.role)&&(!p||ME.role!=='PMOU'||!p.uic||p.uic===ME.unit)&&(!p||p.psStatus!=='Ditetapkan'&&!p.arsip&&p.psListStatus!=='Arsip');
const saveUI=()=>{save();render()};
const state=()=>I.state();
const all=()=>S.programs||[];
const get=id=>all().find(p=>String(p.id)===String(id));
const active=()=>I.programs();
const store=()=>{S.ui.psBank=S.ui.psBank||{};const b=S.ui.psBank;b.tab=b.tab||'bank';b.names=b.names||{};b.check=b.check||[];b.filterYear=b.filterYear||'all';b.search=b.search||'';b.wtab=b.wtab||'identity';b.bankPage=Math.max(1,+b.bankPage||1);b.bankPageSize=[10,20,50,100].includes(+b.bankPageSize)?+b.bankPageSize:10;
 b.detailPage=Math.max(1,+b.detailPage||1);
 b.detailPageSize=[10,20,50,100].includes(+b.detailPageSize)?+b.detailPageSize:10;
 return b;};
const current=()=>{const p=get(store().workspace);return p&&+p.psYear===year()?p:I.pickedProgram()||active()[0]||null};
function historyYears(p){
 if(p.psYear)return [+p.psYear];
 const start=+p.mulai||+(String(p.periode||'').match(/20\d{2}/)||[])[0]||2026;
 const years=new Set([start]);
 if(start<=2026){
  const xs=String(p.periode||'').match(/20\d{2}/g)||[],end=+xs[xs.length-1]||start;
  if(end>=2026)years.add(2026);
  (S.wbs||[]).filter(w=>w.prog===p.akr&&!w.arsip).forEach(w=>{const y=+(String(w.f||w.s||'').slice(0,4));if(y>=2024&&y<=2026)years.add(y)});
  (S.charters||[]).filter(c=>c.prog===p.akr).forEach(c=>{if(+c.p1>=2024&&+c.p1<=2026)years.add(+c.p1)});
 }
 return [...years].filter(y=>y>=2024).sort((a,b)=>b-a);
}
function records(){
 return all().flatMap(p=>historyYears(p).map(y=>({p,year:y,key:String(p.id)+':'+y}))).sort((a,b)=>b.year-a.year||String(a.p.nama||'').localeCompare(String(b.p.nama||''),'id'));
}
function isHistoricTkd2026(p){
 const code=String(p.kode||'').toUpperCase(),title=String(p.nama||'').toLowerCase();
 const years=String(p.periode||'').match(/20\d{2}/g)||[];
 return p.akr==='TKD'&&/^[BT]\d{2}-TKD$/.test(code)&&title.includes('pemotongan pajak di muka atas tkd')&&
  (+p.psYear===2026||(!p.psYear&&+p.mulai<=2026&&(+years[years.length-1]||2026)>=2026));
}
function approvedClosure(p){
 const result=archiveReadiness(p);
 return result.hasClosure&&!result.blocked;
}
function labelStatus(p,y=year()){
 const closed=!!(p.arsip||p.psListStatus==='Arsip'||p.psStatus==='Arsip'||p.status==='Arsip'||approvedClosure(p)||isHistoricTkd2026(p));
 const since=+(p.psArchiveYear||p.psHistoricalClosedYear||p.psYear||(String(p.periode||'').match(/20\d{2}/g)||[]).at(-1)||year());
 if(closed&&+y>=since)return 'Arsip';
 return p.psCarry||p.psSourceYear||!p.psYear?'Legacy':'Baru';
}
function syncProgramStatuses(){
 let changed=false;
 (S.programs||[]).forEach(p=>{
  const historic=isHistoricTkd2026(p),approved=approvedClosure(p);
  if(historic&&!p.psHistoricalTkdBackfill){
   p.psHistoricalTkdBackfill='TKD-TW1-2026';p.psHistoricalClosedYear=2026;p.psArchivePeriod='TW I 2026';
   p.psArchiveReason='Penutupan TKD TW I 2026 (penyesuaian histori berdasarkan konfirmasi pengguna).';
   p.psArchiveSource='Penyesuaian data awal—dokumen persetujuan tidak tersedia dalam prototipe';changed=true;
  }
  if((historic||approved)&&!(p.arsip&&p.psListStatus==='Arsip')){
   p.arsip=true;p.psListStatus='Arsip';p.psArchiveYear=historic?2026:(+p.psYear||year());
   if(approved&&!historic)p.psArchiveSource='Penutupan proyek disetujui PMO (status Ditutup)';
   changed=true;
  }
  if(!historic&&!approved&&!p.arsip){
   const origin=p.psCarry||p.psSourceYear||!p.psYear?'Legacy':'Baru';
   if(p.psListStatus!==origin){p.psListStatus=origin;changed=true}
  }
 });
 if(changed)save();return changed;
}
const canManage=p=>!!ME&&['SA','PMOK','PMOU'].includes(ME.role)&&(!p||ME.role!=='PMOU'||!p.uic||p.uic===ME.unit);
const isConcept=p=>!!p&&p.psStatus!=='Ditetapkan'&&!p.psFinalizedAt&&(p.psDraft===true||['Konsep','Draft',''].includes(String(p.psStatus||'')));
const canDelete=p=>canManage(p)&&+p.psYear===year()&&year()>=2027&&isConcept(p)&&!p.psKwideRecordedAt&&!p.arsip&&p.psListStatus!=='Arsip'&&
 !(S.wbs||[]).some(w=>w.prog===p.akr&&!w.arsip)&&
 !(S.programs||[]).some(x=>x!==p&&x.psCarry?.sourceId===p.id)&&
 !(S.psWideTargets?.[year()]?.contract?.status==='Ditetapkan'&&S.psWideTargets[year()].contract.programIds?.includes(String(p.id)));
const helpInfo={
 bank:'Riwayat Program merupakan arsip referensi lintas tahun. Pilih program untuk disalin menjadi usulan pada tahun aktif. Data historis tidak diedit di sini.',
 detail:'Daftar Program memuat calon program transformasi. Lengkapi substansi dan proyek pendukung, kemudian ajukan penetapan melalui kontrak kinerja K-Wide. Pengubahan dilakukan pada daftar ini.',
 portfolio:'Gabungkan substansi usulan program tahun aktif menjadi dokumen portofolio. Dokumen ini tidak menggantikan penetapan melalui kontrak kinerja K-Wide.'
};
const infoIcon=(key)=>'<span class="psbank-helpicon" tabindex="0" role="img" aria-label="'+E(helpInfo[key])+'" title="'+E(helpInfo[key])+'">ⓘ</span>';
function deleteConcept(p){
 if(!canDelete(p)){toast('Hanya program berstatus Konsep/Draft tahun 2027 ke atas yang belum ditetapkan, belum memiliki WBS aktif, dan tidak menjadi sumber salinan yang dapat dihapus.');return}
 const perform=()=>{
  if(!canDelete(p))return;
  S.programs=S.programs.filter(x=>x!==p);
  if(Array.isArray(S.charters))S.charters=S.charters.filter(c=>c.prog!==p.akr||c.st==='Disahkan');
  if(S.psWideTargets?.[year()]?.rows)S.psWideTargets[year()].rows=S.psWideTargets[year()].rows.filter(x=>String(x.programId)!==String(p.id));
  if(state().prog===p.id)state().prog='';
  if(store().workspace===p.id)store().workspace='';
  if(S.ui.psBank?.target===p.id)S.ui.psBank.target='';
  save();render();toast('Konsep program dihapus dari Daftar Program '+year()+'.');
 };
 if(typeof window.MT_PS_CONFIRM==='function')window.MT_PS_CONFIRM('Hapus Konsep Program?', 'Hapus "'+p.nama+'"? Seluruh isian usulan tahun ini akan dihapus. Program yang sudah ditetapkan tidak dapat dihapus.',perform,'danger');
 else if(window.confirm('Hapus konsep program "'+p.nama+'"?'))perform();
}
/* Project Management closure records are stored at p.closing[projectKey] with st='Ditutup'.
   WBS history can remain non-archived AFTER a valid project closing decision. */
function archiveReadiness(p){
 const recs=Object.entries(p.closing||{}).filter(([key])=>{
  try{return decodeURIComponent(String(key).split('|')[0]||'')===String(p.akr)}catch(_){return false}
 });
 const matchProject=x=>{
  if(x.psClosure?.approved===true||x.psClosureStatus==='Ditutup')return true; // Timestamp alone is not approval.
  const name=String(x.name||x.n||'').trim().toLowerCase();if(!name)return false;
  const matched=recs.filter(([key])=>{
   try{return decodeURIComponent(String(key).split('|')[1]||'').trim().toLowerCase()===name}catch(_){return false}
  });
  return matched.length>0&&matched.every(([,c])=>c?.st==='Ditutup');
 };
 const projects=p.psProjects||[],unclosed=projects.filter(x=>!matchProject(x));
 const wbsPresent=(S.wbs||[]).some(w=>w.prog===p.akr&&!w.arsip);
 let units=[];try{if(typeof tpUnits==='function')units=tpUnits(p)||[]}catch(_){}
 const allPmClosed=units.length?units.every(x=>{
  const key=typeof projectKey==='function'?projectKey(p.akr,x.n,x.sub||''):[p.akr,x.n,x.sub||''].map(encodeURIComponent).join('|');
  return p.closing?.[key]?.st==='Ditutup';
 }):recs.length>0&&recs.every(([,c])=>c?.st==='Ditutup');
 const projectAllClosed=projects.length>0&&!unclosed.length;
 return {unclosed,wbsPresent,hasClosure:allPmClosed||projectAllClosed,
  blocked:unclosed.length>0||(wbsPresent&&!allPmClosed&&!projectAllClosed)};
}
function archiveProgram(p){
 if(!canManage(p)||labelStatus(p)==='Arsip'){toast('Program tidak dapat diarsipkan.');return}
 const readiness=archiveReadiness(p);
 if(readiness.blocked){toast('Proses penutupan proyek belum selesai: '+readiness.unclosed.length+' proyek belum ditutup atau dokumen penutupan PMO belum disetujui.');return}
 const d=document.createElement('div');d.className='psbank-overlay psbank-archive-overlay';
 d.innerHTML='<section class="psbank-dialog psbank-archive-dialog" role="dialog" aria-modal="true" aria-label="Arsipkan Program">'+
  '<header><div><b>Arsipkan Program</b><small>'+E(p.kode||p.akr)+' · '+E(p.nama)+'</small></div><button type="button" data-archive-close aria-label="Tutup">✕</button></header>'+
  '<main class="psbank-dialogbody"><p class="psbank-archive-note">Status Arsip hanya dapat diberikan setelah proses penutupan proyek/program selesai. Program tetap tercatat dalam riwayat dan tidak akan dihapus.</p>'+
  '<div class="psbank-archive-form"><label>Alasan Penutupan <span aria-hidden="true">*</span><textarea rows="3" data-archive-reason placeholder="Jelaskan alasan program ditutup, dihentikan, atau diganti" required></textarea></label>'+
  '<label>Nomor / Tautan Dokumen Penutupan <span aria-hidden="true">*</span><input type="text" data-archive-evidence placeholder="Nomor dokumen, referensi keputusan, atau tautan bukti" required></label>'+
  '<small>Pastikan penutupan seluruh proyek disetujui melalui Project Management → Penutupan. Data WBS historis tetap dipertahankan.</small><p class="psbank-archive-error" role="alert" hidden></p></div></main>'+
  '<footer><span>Histori program dan output K-Wide terdahulu tetap tersimpan.</span><div><button type="button" class="btn" data-archive-close>Batal</button><button type="button" class="btn pri" data-archive-confirm>Arsipkan Program</button></div></footer></section>';
 (document.querySelector('#app')||document.body).appendChild(d);
 const close=()=>d.remove();
 d.addEventListener('click',ev=>{
  if(ev.target===d||ev.target.closest('[data-archive-close]')){close();return}
  if(!ev.target.closest('[data-archive-confirm]'))return;
  const reason=d.querySelector('[data-archive-reason]').value.trim();
  const evidence=d.querySelector('[data-archive-evidence]').value.trim();
  const err=d.querySelector('.psbank-archive-error');
  if(!reason||!evidence){err.textContent='Alasan dan referensi dokumen penutupan wajib diisi.';err.hidden=false;return}
  if(archiveReadiness(p).blocked){
   err.textContent='Penutupan proyek belum selesai atau belum mendapat status Ditutup pada menu Project Management → Penutupan.';err.hidden=false;return;
  }
  p.psListStatus='Arsip';p.psArchivedAt=new Date().toISOString();p.psArchivedBy=ME?.email||'';
  p.psArchiveReason=reason;p.psArchiveEvidence=evidence;p.psArchivedFromStatus=p.psStatus;
  p.arsip=true;p.psUpdatedAt=p.psArchivedAt;save();close();render();toast('Program diarsipkan dengan referensi penutupan. Histori tetap tersimpan.');
 });
 d.addEventListener('keydown',ev=>{if(ev.key==='Escape')close()});
 d.querySelector('[data-archive-reason]')?.focus();
}
function programAction(kind,id,title){
 const icons={
  document:'<path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm7 0v6h5"/><path d="M9 13h7M9 16h7"/>',
  edit:'<path d="M12 20h9M16.8 3.8a2.2 2.2 0 0 1 3.1 3.1L9 17.8l-4.5 1 1-4.5z"/>',
  upload:'<path d="M12 16V4m0 0-4 4m4-4 4 4"/><path d="M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/><path d="M7 17h10"/>',
  add:'<path d="M12 5v14M5 12h14"/>',
  map:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="7" r="2"/><circle cx="8" cy="19" r="2"/><path d="M7 6.5l10 0M5.5 7v10M10 18l8-9"/>',
  delete:'<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7m4-7v7"/>'
 };
 const attr=kind==='add'?'data-bank-add':kind==='document'?'data-bank-doc':kind==='edit'?'data-bank-edit-doc':kind==='upload'?'data-bank-upload':kind==='delete'?'data-bank-delete':'data-bank-map';
 return '<button type="button" class="psbank-action-icon psbank-program-action '+kind+'" '+attr+'="'+E(id)+'" title="'+E(title)+'" aria-label="'+E(title)+'">'+
 '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[kind]+'</svg></button>';
}
function matchesUnit(p,unit='all',role='all'){
 if(!unit||unit==='all')return true;
 const needle=String(unit).toLowerCase(),main=String(p.uic||'').toLowerCase().includes(needle),support=String(p.pend||p.psSupportingUic||'').toLowerCase().includes(needle);
 return role==='utama'?main:role==='pendukung'?support:main||support;
}
function matchesPeriod(p,period='all',from='',to=''){
 if(!period||period==='all')return true;
 const quarter=/^TW\s*(\d)$/i.exec(period);
 const dates=(p.psProjects||[]).map(x=>String(x.goLive||x.start||'')).filter(x=>/^\d{4}-\d{2}-\d{2}/.test(x));
 if(!dates.length)return true; // proposals without planned dates remain visible
 if(quarter)return dates.some(x=>Math.ceil(Number(x.slice(5,7))/3)===Number(quarter[1]));
 if(period==='range')return (!from&&!to)||dates.some(x=>(!from||x>=from)&&(!to||x<=to));
 return true;
}
function bank(){
 const b=store(),q=String(b.search||'').toLowerCase(),list=records();
 const rows=list.filter(x=>(b.filterYear==='all'||+b.filterYear===x.year)&&(!b.filterProgram||x.p.id===b.filterProgram)&&(b.filterStatus==='all'||!b.filterStatus||labelStatus(x.p,x.year)===b.filterStatus)&&matchesUnit(x.p,b.filterUnit,b.filterRole)&&matchesPeriod(x.p,b.filterPeriod,b.filterRangeFrom,b.filterRangeTo)&&[x.p.nama,x.p.kode,x.p.uic,x.p.akr].join(' ').toLowerCase().includes(q));
 const pageSize=b.bankPageSize,pages=Math.max(1,Math.ceil(rows.length/pageSize));
 b.bankPage=Math.min(Math.max(1,+b.bankPage||1),pages);
 const from=(b.bankPage-1)*pageSize,pageRows=rows.slice(from,from+pageSize);
 const checked=pageRows.length>0&&pageRows.every(x=>b.check.includes(x.key));
 return '<div class="psbank-card"><div class="psbank-sectionhead"><div><h3>Riwayat Program</h3><p>Referensi histori program lintas tahun. Program dapat disalin ke tahun aktif; untuk memperbarui isian, buka Daftar Program.</p></div><div class="psbank-headright"><span class="psbank-count">'+rows.length+' entri</span>'+infoIcon('bank')+'</div></div>'+
 '<div class="psbank-tablewrap"><table class="psbank-table psbank-history-table"><colgroup><col><col><col><col><col><col><col><col></colgroup><thead><tr>'+
 '<th class="psbank-checkcol"><input type="checkbox" data-bank-checkall '+(checked?'checked':'')+' aria-label="Pilih semua program pada halaman ini" title="Pilih semua program pada halaman ini"></th>'+
 '<th>Tahun</th><th>Kode Program</th><th>Nama Program</th><th>UIC</th><th>Status</th><th>Jumlah Modul</th><th>Aksi</th></tr></thead><tbody>'+
 (pageRows.length?pageRows.map(({p,year:y,key})=>{
  const num=Scope.modules(p,y).length;
  return '<tr tabindex="0" class="psbank-clickrow" data-bank-row="'+E(key)+'" title="Lihat dokumen program"><td class="psbank-checkcol"><input type="checkbox" data-bank-check="'+E(key)+'" '+(b.check.includes(key)?'checked':'')+' aria-label="Pilih '+E(p.nama)+' tahun '+y+'"></td>'+
  '<td><b>'+y+'</b></td><td><b>'+E(p.kode||p.akr||'—')+'</b></td><td><b>'+E(p.nama)+'</b></td><td>'+E(p.uic||'—')+'</td>'+
  '<td><span class="psbank-tag psbank-'+labelStatus(p,y).toLowerCase()+'">'+labelStatus(p,y)+'</span></td><td>'+num+' modul</td>'+
  '<td class="psbank-rowactions">'+programAction('add',key,'Tambahkan Program ke Tahun')+'</td></tr>';
 }).join(''):'<tr><td colspan="8" class="psbank-empty">Tidak ada program sesuai filter.</td></tr>')+'</tbody></table></div>'+
 '<div class="psbank-pagination" aria-label="Navigasi halaman Riwayat Program">'+
 '<label>Baris per halaman <select data-bank-page-size aria-label="Jumlah baris per halaman">'+[10,20,50,100].map(n=>'<option value="'+n+'" '+(pageSize===n?'selected':'')+'>'+n+'</option>').join('')+'</select></label>'+
 '<span>'+(!rows.length?'0':from+1)+'–'+Math.min(from+pageSize,rows.length)+' dari '+rows.length+' program</span>'+
 '<div class="psbank-pagination-steps"><button type="button" data-bank-page-step="-1" title="Halaman sebelumnya" aria-label="Halaman sebelumnya" '+(b.bankPage<=1?'disabled':'')+'>‹</button>'+
 '<strong>Halaman '+b.bankPage+' / '+pages+'</strong>'+
 '<button type="button" data-bank-page-step="1" title="Halaman berikutnya" aria-label="Halaman berikutnya" '+(b.bankPage>=pages?'disabled':'')+'>›</button></div></div>'+ 
 (b.check.length?'<div class="psbank-bulkfoot"><span><b>'+b.check.length+'</b> program dipilih</span><button type="button" class="btn pri" data-bank-bulk>+ Tambahkan Program</button></div>':'')+
 '<div class="psbank-note">Semua program dapat dipilih sebagai sumber, termasuk dari tahun yang sama; kode salinan akan dibuat unik. Data historis tetap utuh; nama, kode, dan dokumen salinannya dapat disesuaikan pada tahun tujuan.</div></div>';
}
function detail(){
 const b=store(),q=String(b.search||'').toLowerCase(),status=b.filterStatus||'all';
 const rows=active().filter(p=>(!b.detailProgram||p.id===b.detailProgram)&&[p.nama,p.kode,p.uic,p.akr].join(' ').toLowerCase().includes(q)&&(status==='all'||labelStatus(p)===status)&&matchesUnit(p,b.filterUnit,b.filterRole)&&matchesPeriod(p,b.filterPeriod,b.filterRangeFrom,b.filterRangeTo));
 const size=b.detailPageSize,pages=Math.max(1,Math.ceil(rows.length/size));
 b.detailPage=Math.min(Math.max(1,+b.detailPage||1),pages);
 const from=(b.detailPage-1)*size,visibleRows=rows.slice(from,from+size);
 const allRows=active(),complete=p=>window.MT_PS_GOV?.readiness(p)||{done:0,total:7};
 return '<div class="psbank-card"><div class="psbank-sectionhead"><div><h3>Daftar Program · '+year()+'</h3><p>Kumpulan usulan program transformasi yang perlu dilengkapi substansi dan proyeknya sebelum ditetapkan melalui kontrak kinerja K-Wide. Klik program untuk mengedit.</p></div><div class="psbank-headright"><span class="psbank-count">'+rows.length+' program</span>'+infoIcon('detail')+'</div></div>'+
 '<div class="psbank-tablewrap"><table class="psbank-table psbank-detail-table"><colgroup><col><col><col><col><col><col><col><col><col></colgroup><thead><tr><th>Tahun</th><th>Kode Program</th><th>Nama Program</th><th>UIC</th><th>Asal</th><th>Status</th><th>Kelengkapan</th><th>Modul</th><th>Aksi</th></tr></thead><tbody>'+
 (visibleRows.length?visibleRows.map(p=>{const readiness=complete(p);return '<tr tabindex="0" data-bank-detailrow="'+E(p.id)+'" class="psbank-clickrow" title="Klik baris untuk melihat Dokumen Program"><td>'+year()+'</td><td><b>'+E(p.kode||p.akr)+'</b></td><td><b>'+E(p.nama)+'</b></td><td>'+E(p.uic||'—')+'</td><td>'+E(p.psCarry?'Dari '+p.psCarry.sourceYear:'Program baru')+'</td><td><span class="psbank-tag psbank-'+labelStatus(p).toLowerCase()+'" title="Status otomatis berdasarkan asal program dan persetujuan penutupan proyek">'+labelStatus(p)+'</span></td><td><b>'+readiness.done+'/'+readiness.total+'</b><small>'+E(readiness.ok?'Siap direviu':'Perlu dilengkapi')+'</small></td><td>'+Scope.modules(p,year()).length+'</td>'+
 '<td class="psbank-rowactions psbank-program-actions">'+programAction('map',p.id,'Pemetaan Proyek')+programAction('edit',p.id,'Edit Dokumen Program')+programAction('upload',p.id,'Unggah Dokumen Program')+(canDelete(p)?programAction('delete',p.id,'Hapus konsep program yang belum ditetapkan'):'')+'</td></tr>'}).join(''):'<tr><td colspan="9" class="psbank-empty">Belum ada program sesuai filter. Tambahkan program dari Riwayat Program.</td></tr>')+'</tbody></table></div>'+
 '<div class="psbank-pagination" aria-label="Navigasi halaman Daftar Program">'+
 '<label>Baris per halaman <select data-bank-detail-page-size aria-label="Jumlah baris Daftar Program per halaman">'+[10,20,50,100].map(n=>'<option value="'+n+'" '+(size===n?'selected':'')+'>'+n+'</option>').join('')+'</select></label>'+
 '<span>'+(!rows.length?'0':from+1)+'–'+Math.min(from+size,rows.length)+' dari '+rows.length+' program</span>'+
 '<div class="psbank-pagination-steps">'+
 '<button type="button" data-bank-detail-page-step="-1" title="Halaman sebelumnya" aria-label="Halaman sebelumnya" '+(b.detailPage<=1?'disabled':'')+'>‹</button>'+
 '<strong>Halaman '+b.detailPage+' / '+pages+'</strong>'+
 '<button type="button" data-bank-detail-page-step="1" title="Halaman berikutnya" aria-label="Halaman berikutnya" '+(b.detailPage>=pages?'disabled':'')+'>›</button>'+
 '</div></div></div>'+
 '<div class="psbank-summary"><span><b>'+allRows.length+'</b> Program</span><span><b>'+allRows.reduce((n,p)=>n+Scope.modules(p,year()).length,0)+'</b> Modul</span><span><b>'+allRows.filter(p=>complete(p).ok).length+'</b> Siap Direviu</span><span><b>'+allRows.filter(p=>!complete(p).ok).length+'</b> Perlu Dilengkapi</span></div>'+ 
 '<details class="psbank-inputsummary"><summary>Ringkasan Isian Program ('+rows.length+')</summary><div class="psbank-inputsummary-list">'+rows.map(p=>'<article><b>'+E(p.nama)+'</b><small>'+E(p.kode||p.akr)+' · Diperbarui '+E((p.psUpdatedAt||p.psCarry?.createdAt||'Belum ada tanggal').slice(0,10))+'</small><p><strong>Tujuan:</strong> '+E(p.psObjective||'Belum diisi')+'</p><p><strong>Business Case:</strong> '+E(p.psBusinessCase||'Belum diisi')+'</p><p><strong>Outcome:</strong> '+E(p.psOutcome||'Belum diisi')+'</p></article>').join('')+'</div></details>';
}
const STEPS=[['identity','Identitas'],['case','Business Case'],['benefits','Manfaat'],['stakeholders','Stakeholder'],['risks','Risiko'],['governance','Tata Kelola'],['review','Reviu'],['docs','Buat Dokumen Program']];
function workspace(p){return '';}
function usulan(){
 syncProgramStatuses();
 const b=store(),tab=b.tab;
 return '<div class="psbank-subhead"><nav class="psbank-subtabs" role="tablist" aria-label="Usulan Program">'+
 [['bank','Riwayat Program'],['detail','Daftar Program'],['portfolio','Buat Dokumen Portofolio']].map(t=>'<button type="button" class="'+(tab===t[0]?'on':'')+'" data-bank-tab="'+t[0]+'" title="'+E(helpInfo[t[0]])+'">'+t[1]+(t[0]==='detail'?' <b>'+active().length+'</b>':'')+'</button>').join('')+
 '</nav>'+(tab==='detail'?'<button class="btn pri" data-bank-new>+ Tambah Program Baru</button>':'')+'</div>'+
 (tab==='bank'?bank():tab==='portfolio'?(Docs.portfolioBuilder?.(active())||'<div class="psbank-card">Fitur dokumen portofolio belum tersedia.</div>'):detail());
}
const EDIT_FIELDS={
 identity:[['nama','Nama Program'],['kode','Kode Program'],['jenis','Jenis Program'],['uic','UIC Utama'],['pend','UIC Pendukung'],['sponsor','Sponsor'],['psObjective','Tujuan Strategis'],['psBackground','Latar Belakang'],['psOutcome','Outcome'],['psStrategy','Strategi']],
 case:[['psAlignment','Keselarasan Strategis'],['psBusinessCase','Business Case'],['psAlternatives','Alternatif Solusi'],['psFinancialEstimate','Estimasi Biaya'],['psSuccessCriteria','Kriteria Keberhasilan']],
 governance:[['psManager','Manajer Program'],['psDecisionAuthority','Otoritas Keputusan'],['psGovernanceCadence','Mekanisme Reviu'],['psRoadmap','Roadmap'],['psResourcePlan','Sumber Daya'],['psDependencies','Dependensi'],['psAssumptions','Asumsi'],['psConstraints','Batasan']]
};
const REG_FIELDS={
 benefits:{key:'psBenefits',fields:[['name','Nama Manfaat'],['indicator','Indikator'],['baseline','Baseline'],['target','Target'],['unit','Satuan'],['owner','Benefit Owner'],['due','Target Realisasi']]},
 stakeholders:{key:'psStakeholders',fields:[['name','Stakeholder'],['unit','Unit/Institusi'],['role','Peran'],['power','Pengaruh'],['interest','Kepentingan'],['strategy','Strategi Pelibatan'],['owner','PIC']]},
 risks:{key:'psRiskRegister',fields:[['title','Risiko'],['probability','Probabilitas'],['impact','Dampak'],['response','Respons Risiko'],['owner','Risk Owner']]}
};
function editForm(p,tab,y=year()){
 const title=STEPS.find(x=>x[0]===tab)?.[1]||tab;
 const fallback={};
 (Docs.fields(p,tab,y)||[]).forEach(([label,value])=>fallback[label]=String(value??''));
 const mapLabel={psObjective:'Tujuan Strategis',psBackground:'Latar Belakang',psOutcome:'Outcome',
  psStrategy:'Strategi',psAlignment:'Keselarasan Strategis',psBusinessCase:'Business Case',
  psAlternatives:'Alternatif Solusi',psFinancialEstimate:'Estimasi Biaya',psSuccessCriteria:'Kriteria Keberhasilan',
  psManager:'Manajer Program',psDecisionAuthority:'Forum/Otoritas Keputusan',psGovernanceCadence:'Mekanisme Reviu',
  psRoadmap:'Roadmap',psResourcePlan:'Kebutuhan Sumber Daya',psDependencies:'Dependensi',
  psAssumptions:'Asumsi',psConstraints:'Batasan'};
 const value=(key,label)=>{
  const raw=p[key];if(raw!==undefined&&raw!==null&&String(raw).trim()!=='')return String(raw);
  const fb=fallback[mapLabel[key]||label];return fb&&!/^belum diisi$/i.test(fb)?fb:'';
 };
 const head='<div class="psbank-paper-head"><small>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</small><h3>'+E(title)+'</h3>'+
  '<span>'+E(p.nama)+' · '+y+' · '+E(p.kode||p.akr)+'</span></div>';
 const form=EDIT_FIELDS[tab];
 if(form){
  return '<article class="psbank-paper psbank-paper-edit" data-bank-inline-edit="true">'+head+
   '<div class="psbank-paper-body">'+form.map(([key,label])=>
   '<div class="psbank-paper-row psbank-paper-editrow"><b>'+E(label)+'</b>'+
   (key==='jenis'?'<select data-bank-editfield="jenis" aria-label="'+E(label)+'"><option '+(value(key,label)==='Berkelanjutan'?'selected':'')+'>Berkelanjutan</option><option '+(value(key,label)==='Tematik'?'selected':'')+'>Tematik</option></select>':
   '<textarea rows="'+(['nama','kode','uic','sponsor','psFinancialEstimate'].includes(key)?1:3)+'" data-bank-editfield="'+key+'" aria-label="'+E(label)+'">'+E(value(key,label))+'</textarea>')+
   '</div>').join('')+'</div><div class="psbank-paper-foot"><span>Mode Ubah · seluruh teks lama dipertahankan</span><span>Tahun '+y+'</span></div></article>';
 }
 const spec=REG_FIELDS[tab];
 if(!spec)return Docs.paper(p,tab,y);
 const raw=Array.isArray(p[spec.key])?p[spec.key]:[];
 const list=raw.map(x=>typeof x==='string'?{[tab==='risks'?'title':'name']:x}:x&&typeof x==='object'?x:{});
 if(!list.length){
  const row=(Docs.fields(p,tab,y)||[])[0]||[],orig=String(row[1]||'');
  if(orig&&orig!=='Belum diisi'){
   list.push({[tab==='risks'?'title':'name']:orig,psFromCharter:true});
  }
 }
 const row=(entry,i)=>'<section class="psbank-register-card" data-bank-edit-entry><div class="psbank-register-head"><b>Entri '+(i+1)+'</b>'+
  '<button type="button" class="psbank-action-icon delete" data-bank-entry-remove title="Hapus entri" aria-label="Hapus entri">'+
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button></div>'+
  '<div class="psbank-register-grid">'+spec.fields.map(([key,label])=>
  '<label><span>'+E(label)+'</span><textarea rows="2" data-bank-regfield="'+key+'">'+E(entry?.[key]??'')+'</textarea></label>').join('')+'</div></section>';
 return '<article class="psbank-paper psbank-paper-edit" data-bank-inline-edit="true">'+head+
  '<div class="psbank-paper-body"><div class="psbank-register-toolbar"><div><b>Daftar '+E(title)+'</b><small>Ubah langsung pada entri yang sudah ada. Tambah atau hapus sesuai kebutuhan.</small></div>'+
  '<button type="button" class="psbank-action-icon add" data-bank-entry-add title="Tambah entri" aria-label="Tambah entri"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button></div>'+
  '<div data-bank-entry-list>'+list.map(row).join('')+'</div>'+
  '<template data-bank-entry-template>'+row({},list.length)+'</template></div>'+
  '<div class="psbank-paper-foot"><span>Mode Ubah · konten lama tetap tersedia</span><span>Tahun '+y+'</span></div></article>';
}
function showPreview(key,initialTab='identity',startEdit=false){
 const rec=records().find(x=>x.key===key);if(!rec)return;
 const p=rec.p,d=document.createElement('div');d.className='psbank-overlay';
 const b=store();b.doc=b.doc||{};b.doc.format='word';b.doc.slide=0;
 const isTarget=rec.year===year()&&active().some(x=>x.id===p.id);
 const editable=isTarget&&can(p);
 b.preview={key,tab:initialTab,edit:!!startEdit&&editable,dirty:false};
 const tabs=isTarget?STEPS.filter(x=>x[0]!=='review'):STEPS.filter(x=>x[0]!=='docs');
 if(!tabs.some(x=>x[0]===initialTab))b.preview.tab='identity';
 const v=()=>b.preview;
 const view=()=>v().tab==='docs'?Docs.builder(p):editable&&v().edit?editForm(p,v().tab,rec.year):Docs.paper(p,v().tab,rec.year);
 const foot=()=>{
  const x=d.querySelector('.psbank-dialog>footer>div');if(!x)return;
  if(v().tab==='docs'&&isTarget){x.innerHTML='<button type="button" class="btn pri" data-doc-export>↓ Unduh</button><button type="button" class="btn" data-bank-dismiss>Tutup</button>';return}
  if(isTarget){x.innerHTML=(editable?'<button type="button" class="btn" data-bank-preview-edit>✎ Ubah</button><button type="button" class="btn" data-bank-preview-save '+(!v().edit?'disabled':'')+'>Simpan</button><button type="button" class="btn pri" data-bank-preview-saveclose>Simpan & Tutup</button>':'<button type="button" class="btn" data-bank-dismiss>Tutup</button>');return}
  x.innerHTML='<button type="button" class="btn pri" data-bank-preview-add="'+E(key)+'">+ Tambahkan ke Tahun</button><button type="button" class="btn" data-bank-dismiss>Tutup</button>';
 };
 const redraw=(body=true)=>{
  d.querySelectorAll('[data-bank-pstep]').forEach(x=>{const on=x.dataset.bankPstep===v().tab;x.classList.toggle('on',on);x.setAttribute('aria-selected',String(on))});
  if(body){const area=d.querySelector('.psbank-dialogbody'),top=area?.scrollTop||0;if(area){area.innerHTML=view();area.scrollTop=top;if(v().tab==='docs')Docs.hydrateProgram?.(area,p)}}
  foot();
 };
 const autoSaveAnd=next=>{if(v().edit&&v().dirty&&!saveForm(true))return;next()};
 const saveForm=(keepEditing=false)=>{
  if(!v().edit)return true;
  const tab=v().tab,body=d.querySelector('.psbank-dialogbody');
  if(EDIT_FIELDS[tab]){
   const obj={};body.querySelectorAll('[data-bank-editfield]').forEach(x=>obj[x.dataset.bankEditfield]=x.value.trim());
   if(tab==='identity'){
    if(!obj.nama||!obj.kode){toast('Nama dan kode program wajib diisi.');return false}
    const raw=String(obj.kode||'').toUpperCase(),suffix=(raw.match(/^[BT]\d{2}-([A-Z0-9-]+)$/)||[])[1]||raw.replace(/[^A-Z0-9-]/g,'');
    obj.kode=(obj.jenis==='Tematik'?'T':'B')+String(year()).slice(-2)+'-'+(suffix||'PROG');
    if(all().some(x=>x.id!==p.id&&+x.psYear===year()&&String(x.kode).toUpperCase()===obj.kode)){toast('Kode program '+obj.kode+' sudah dipakai.');return false}
   }
   Object.assign(p,obj);
  }else if(REG_FIELDS[tab]){
   const x=REG_FIELDS[tab];p[x.key]=[...body.querySelectorAll('[data-bank-edit-entry]')].map(div=>{const o={};div.querySelectorAll('[data-bank-regfield]').forEach(input=>o[input.dataset.bankRegfield]=input.value.trim());return o}).filter(o=>Object.values(o).some(Boolean));
  }
  p.psUpdatedAt=new Date().toISOString();p.psUpdatedBy=ME?.email||'';v().edit=!!keepEditing;v().dirty=false;save();return true;
 };
 d.innerHTML='<section class="psbank-dialog" role="dialog" aria-modal="true" aria-label="Detail Program"><header><div><b>Detail Program</b><small>'+E(p.nama)+' · '+rec.year+' · '+E(p.kode||p.akr)+'</small></div><button type="button" data-bank-dismiss aria-label="Tutup">✕</button></header>'+
 '<nav class="psbank-dialogtabs" role="tablist">'+tabs.map(x=>'<button role="tab" aria-selected="'+(x[0]===v().tab)+'" class="'+(x[0]===v().tab?'on':'')+'" data-bank-pstep="'+x[0]+'">'+x[1]+'</button>').join('')+'</nav>'+
 '<main class="psbank-dialogbody">'+view()+'</main><footer><span>'+(isTarget?'Dokumen program tahun '+year():'Histori program '+rec.year)+'</span><div></div></footer></section>';
 (document.querySelector('#app')||document.body).appendChild(d);foot();
 if(v().tab==='docs')Docs.hydrateProgram?.(d.querySelector('.psbank-dialogbody'),p);
 d.addEventListener('click',ev=>{
  if(ev.target===d||ev.target.closest('[data-bank-dismiss]')){autoSaveAnd(()=>d.remove());return}
  const step=ev.target.closest('[data-bank-pstep]');
  if(step){autoSaveAnd(()=>{v().tab=step.dataset.bankPstep;v().dirty=false;redraw()});return}
  if(v().tab==='docs'&&Docs.click(ev,p,true)){if(!ev.target.closest('[data-doc-export],[data-doc-signed-kind]'))redraw();return}
  if(ev.target.closest('[data-bank-preview-edit]')){if(!editable)return;v().edit=true;v().dirty=false;redraw();return}
  if(ev.target.closest('[data-bank-preview-save]')){if(saveForm(true)){redraw();toast('Detail Program tersimpan. Mode edit tetap aktif.')}return}
  if(ev.target.closest('[data-bank-preview-saveclose]')){if(saveForm()){d.remove();render();}return}
  if(ev.target.closest('[data-bank-entry-add]')){const list=d.querySelector('[data-bank-entry-list]'),template=d.querySelector('template[data-bank-entry-template]');list.insertAdjacentHTML('beforeend',template.innerHTML);v().dirty=true;return}
  if(ev.target.closest('[data-bank-entry-remove]')){ev.target.closest('[data-bank-edit-entry]')?.remove();v().dirty=true;return}
  if(ev.target.closest('[data-bank-preview-add]')){d.remove();openCarry([key]);return}
 });
 d.addEventListener('input',ev=>{if(v().edit&&ev.target.matches('input,textarea,select'))v().dirty=true});
 d.addEventListener('change',ev=>{if(v().tab==='docs'&&isTarget){if(Docs.change(ev,true))redraw()}else if(v().edit)v().dirty=true});
 d.addEventListener('keydown',ev=>{if(ev.key==='Escape')autoSaveAnd(()=>d.remove())});
}
function codeFor(p,to,custom){
 const type=/^tematik$/i.test(String(p.jenis||''))?'T':'B';
 const code=String(p.kode||'').toUpperCase();
 const old=code.match(/^[BT]\d{2}-([A-Z0-9-]+)$/);
 const suffix=String(custom||'').trim()?String(custom).toUpperCase().replace(/[^A-Z0-9-]/g,''):(old?old[1]:String(p.akr||p.nama||'PROG').toUpperCase().replace(/[^A-Z0-9-]/g,'').replace(/^(PS\d{4}-|C[A-Z]{5}$)/,''));
 return type+String(to).slice(-2)+'-'+(suffix||'PROG');
}
function addOne(key,renderNow=true,to=year(),newName=null,newAkronim=null){
 const rec=records().find(x=>x.key===key);if(!rec||!can())return null;
 to=+to;if(to<2025||to>2029){toast('Pilih tahun tujuan 2025–2029.');return null}
 const duplicate=all().find(p=>+p.psYear===to&&p.psCarry?.sourceId===rec.p.id&&+p.psCarry?.sourceYear===rec.year);
 if(duplicate){toast('Program '+rec.p.nama+' dari '+rec.year+' sudah ditambahkan ke '+to+'.');return null}
 const p=F.cloneProgram(rec.p,rec.year,to);
 p.nama=String(newName??store().names[key]??rec.p.nama).trim()||rec.p.nama;
 const baseCode=codeFor(rec.p,to,newAkronim);let candidate=baseCode,seq=2;
 while(all().some(x=>+x.psYear===to&&String(x.kode||'').toUpperCase()===candidate.toUpperCase()))candidate=baseCode+'-'+seq++;
 p.kode=candidate;
 Scope.normalizeProjectCodes?.(p);
 p.psCarry.sourceYear=rec.year;p.psSourceYear=rec.year;p.psListStatus='Legacy';p.arsip=false;
 delete p.psHistoricalTkdBackfill;delete p.psHistoricalClosedYear;delete p.psArchivePeriod;delete p.psArchiveSource;delete p.psArchiveYear;
 all().push(p);
 const b=store();state().prog=p.id;Scope.bank().target=p.id;b.workspace='';b.tab='detail';b.check=b.check.filter(x=>x!==key);state().tab='usulan';
 if(renderNow){saveUI();toast('Program '+p.nama+' berhasil ditambahkan ke Daftar Program tahun '+to+'.')}
 return p;
}
function openCarry(keys){
 if(!can())return;
 const rows=[...new Set(keys)].map(key=>records().find(x=>x.key===key)).filter(Boolean);
 if(!rows.length){toast('Pilih program dahulu.');return}
 const d=document.createElement('div');d.className='psbank-overlay psbank-carry-overlay';
 const b=store();const target=year();
 d.innerHTML='<section class="psbank-dialog psbank-carry-dialog" role="dialog" aria-modal="true" aria-label="Tambahkan Program ke Tahun"><header><div><b>Tambahkan Program ke Tahun</b><small>'+rows.length+' program terpilih dari Bank Program</small></div><button type="button" data-carry-close>✕</button></header>'+
 '<main class="psbank-dialogbody"><div class="psbank-carry-year"><label>Tahun Tujuan <select data-carry-year>'+[2025,2026,2027,2028,2029].map(y=>'<option value="'+y+'" '+(target===y?'selected':'')+'>'+y+'</option>').join('')+'</select></label><p>Isi nama baru bila berubah. Identitas, business case, manfaat, stakeholder, risiko, tata kelola, serta draft proyek disalin; sumber tidak ditimpa.</p></div>'+
 '<div class="psbank-carry-list">'+rows.map(({p,year:y,key})=>'<div class="psbank-carry-item"><div><b>'+E(p.nama)+'</b><small>Asal '+y+' · '+E(p.kode||p.akr)+' · '+labelStatus(p)+'</small></div><label>Nama Program Baru<input type="text" data-carry-name="'+E(key)+'" value="'+E(p.nama)+'" maxlength="180"></label><label>Akronim Baru<input type="text" data-carry-akronim="'+E(key)+'" value="'+E((codeFor(p,target).split(/^[BT]\d{2}-/)[1]||p.akr))+'" maxlength="24"></label><div class="psbank-carry-code" data-carry-code="'+E(key)+'">'+E(codeFor(p,target))+'</div></div>').join('')+'</div></main>'+
 '<footer><span>Periksa nama dan tahun tujuan sebelum menyimpan.</span><div><button type="button" class="btn" data-carry-close>Batal</button><button type="button" class="btn pri" data-carry-save>Tambahkan '+rows.length+' Program</button></div></footer></section>';
 (document.querySelector('#app')||document.body).appendChild(d);
 const refreshCodes=()=>rows.forEach(({p,key})=>{
 const node=[...d.querySelectorAll('[data-carry-code]')].find(x=>x.dataset.carryCode===key);
 const acr=[...d.querySelectorAll('[data-carry-akronim]')].find(x=>x.dataset.carryAkronim===key);
 if(node)node.textContent=codeFor(p,+d.querySelector('[data-carry-year]').value,acr?.value);
 });
 d.addEventListener('change',refreshCodes);
 d.addEventListener('input',ev=>{if(ev.target.matches('[data-carry-akronim]'))refreshCodes()});
 d.addEventListener('click',ev=>{
  if(ev.target===d||ev.target.closest('[data-carry-close]')){d.remove();return}
  if(!ev.target.closest('[data-carry-save]'))return;
  const to=+d.querySelector('[data-carry-year]').value;
  const names=new Map([...d.querySelectorAll('[data-carry-name]')].map(x=>[x.dataset.carryName,x.value.trim()]));
   const akronims=new Map([...d.querySelectorAll('[data-carry-akronim]')].map(x=>[x.dataset.carryAkronim,x.value.trim()]));
  if([...names.values()].some(x=>!x)){toast('Nama program tujuan tidak boleh kosong.');return}
  let n=0;for(const row of rows){const added=addOne(row.key,false,to,names.get(row.key),akronims.get(row.key));if(added)n++}
  if(!n){toast('Tidak ada program baru yang ditambahkan.');return}
  S.ui.psSelectedYear=to;state().tab='usulan';store().tab='detail';store().workspace='';store().check=[];save();d.remove();render();
  toast(n+' program masuk ke Daftar Program '+to+'. Klik baris untuk mengedit atau lanjutkan Pemetaan Proyek.');
 });
 d.addEventListener('keydown',ev=>{if(ev.key==='Escape')d.remove()});
 d.querySelector('[data-carry-year]')?.focus();
}

/* Upload Dokumen Program: independent from document generation; attachments do not
   increment the official version. Signed PDF uses the established TTE workflow. */
function showUploadProgram(id){
 const p=get(id);if(!p||!active().some(x=>String(x.id)===String(p.id))){toast('Program tujuan tidak ditemukan untuk tahun terpilih.');return}
 const d=document.createElement('div');d.className='psbank-upload-backdrop';
 const history=()=>Docs.history('program',p.id,year()).filter(x=>['uploaded','signed'].includes(x.status)).slice().reverse();
 const fileHistory=()=>{
  const items=history();
  return items.length?items.map(x=>'<article class="psbank-upload-record"><span class="psbank-upload-recordicon">'+(x.status==='signed'?'✓':'▤')+'</span>'+
   '<div><b>'+E(x.fileName||'Dokumen Program')+'</b><small>'+E(x.status==='signed'?'Bukti TTE v'+x.version+' · belum diverifikasi':'Dokumen Program · v'+x.version+' (tidak menetapkan versi)')+
   ' · '+E((x.createdAt||'').slice(0,16).replace('T',' '))+(x.description?' · '+E(x.description):'')+'</small></div>'+
   '<button type="button" class="psbank-upload-download" data-doc-proof-preview="'+E(x.id)+'" data-doc-proof-name="'+E(x.fileName)+'" title="Pratinjau dokumen unggahan" aria-label="Pratinjau '+E(x.fileName)+'"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button>'+
   '<button type="button" class="psbank-upload-download" data-doc-proof-open="'+E(x.id)+'" data-doc-proof-name="'+E(x.fileName)+'" title="Unduh berkas" aria-label="Unduh '+E(x.fileName)+'">↓</button></article>').join(''):
   '<div class="psbank-upload-empty">Belum ada dokumen yang diunggah untuk program ini.</div>';
 };
 d.innerHTML='<section class="psbank-upload-dialog" role="dialog" aria-modal="true" aria-label="Unggah Dokumen Program">'+
 '<header><div><b>Unggah Dokumen Program</b><small>'+E(p.nama)+' · '+year()+' · '+E(p.kode||p.akr)+'</small></div>'+
 '<button type="button" data-bank-upload-close title="Tutup" aria-label="Tutup">✕</button></header>'+
 '<main class="psbank-upload-content"><div class="psbank-upload-form">'+
 '<label>Jenis Unggahan<select data-bank-upload-type><option value="attachment">Dokumen Program / Lampiran</option><option value="signed">PDF hasil TTE (pengesahan versi)</option></select></label>'+
 '<label>Unggah Berkas <small>PDF, DOCX, PPTX · Maksimum 25 MB</small><input data-bank-upload-file type="file" accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"></label>'+
 '<label>Catatan Dokumen (opsional)<input type="text" maxlength="250" data-bank-upload-note placeholder="Contoh: Dokumen Program hasil reviu"></label>'+
 '<label class="psbank-upload-attest" data-bank-upload-attest-wrap hidden><input type="checkbox" data-bank-upload-attest> Saya menyatakan PDF ini sudah ditandatangani secara elektronik.</label>'+
 '<p class="psbank-upload-help" data-bank-upload-hint>Unggahan biasa masuk riwayat program dan tidak mengubah nomor versi dokumen.</p>'+
 '<div class="psbank-upload-error" data-bank-upload-error aria-live="polite" hidden></div></div>'+
 '<section class="psbank-upload-history"><div class="psbank-upload-hist-head"><b>Riwayat Unggahan</b><span>'+history().length+' berkas</span></div>'+
 '<div data-bank-upload-history>'+fileHistory()+'</div></section></main>'+
 '<footer><small>Prototipe: berkas tersimpan di browser ini. Belum tersedia sinkronisasi lintas perangkat atau validasi TTE kriptografis.</small>'+
 '<div><button type="button" class="btn" data-bank-upload-close>Batal / Tutup</button><button type="button" class="btn pri" data-bank-upload-save>Simpan Dokumen</button></div></footer></section>';
 (document.querySelector('#app')||document.body).appendChild(d);
 const close=()=>d.remove();
 const mode=d.querySelector('[data-bank-upload-type]');
 const syncMode=()=>{
  const signed=mode.value==='signed';
  d.querySelector('[data-bank-upload-attest-wrap]').hidden=!signed;
  const input=d.querySelector('[data-bank-upload-file]');
  input.accept=signed?'.pdf,application/pdf':'.pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation';
  d.querySelector('[data-bank-upload-hint]').textContent=signed?
   'Bukti TTE wajib PDF untuk versi '+Docs.nextVersion('program',p.id,year())+'. Dokumen versi ini harus digenerasikan terlebih dahulu. Keaslian tanda tangan belum diverifikasi secara kriptografis.':
   'Unggahan biasa disimpan sebagai arsip program, tanpa menaikkan versi dokumen.';
  input.value='';
 };
 mode.addEventListener('change',syncMode);
 d.addEventListener('click',async ev=>{
  if(ev.target===d||ev.target.closest('[data-bank-upload-close]')){close();return}
  if(ev.target.closest('[data-doc-proof-open]')){await Docs.openSignedProof(ev);return}
  const submit=ev.target.closest('[data-bank-upload-save]');if(!submit)return;
  const file=d.querySelector('[data-bank-upload-file]')?.files?.[0],note=d.querySelector('[data-bank-upload-note]').value,
   err=d.querySelector('[data-bank-upload-error]');
  err.hidden=true;err.textContent='';submit.disabled=true;submit.textContent='Menyimpan…';
  try{
   if(mode.value==='signed'){
    const version=await Docs.confirmSigned('program',p.id,year(),file,!!d.querySelector('[data-bank-upload-attest]').checked);
    toast('Bukti TTE v'+version+' telah dicatat. Draft berikutnya v'+(version+1)+'.');
   }else{
    await Docs.uploadProgramAttachment(p,year(),file,note);
    toast('Dokumen Program berhasil diunggah ke riwayat.');
   }
   d.querySelector('[data-bank-upload-file]').value='';d.querySelector('[data-bank-upload-note]').value='';
   d.querySelector('[data-bank-upload-attest]').checked=false;
   d.querySelector('[data-bank-upload-history]').innerHTML=fileHistory();
   d.querySelector('.psbank-upload-hist-head span').textContent=history().length+' berkas';
   syncMode();
  }catch(error){err.textContent=error.message||String(error);err.hidden=false}
  finally{submit.disabled=false;submit.textContent='Simpan Dokumen'}
 });
 d.addEventListener('keydown',ev=>{if(ev.key==='Escape')close()});
 d.querySelector('[data-bank-upload-file]')?.focus();
}

function bulk(){openCarry(store().check)}

function openWorkspace(id){const p=get(id);if(p)showPreview(String(p.id)+':'+year())}
function page(){
 const base=oldPage(),i=base.indexOf('<div class="ps27-actionbar"');
 if(i<0)return base;
 const end=base.indexOf('</div>',i)+6,left=base.slice(0,i),right=base.slice(end);
 if(state().tab==='usulan')return left+usulan()+'</section>';
 if(state().tab==='mapping')return left+Scope.render()+'</section>';
 return left+right;
}
function onClick(ev){
 if(Scope.click(ev))return;
 if(Docs.portfolioClick?.(ev))return;
 if(Docs.click(ev,current()))return;
 const b=store(),btn=ev.target.closest('[data-bank-delete],[data-bank-tab],[data-bank-preview],[data-bank-add],[data-bank-work],[data-bank-map],[data-bank-doc],[data-bank-edit-doc],[data-bank-upload],[data-bank-wtab],[data-bank-row],[data-bank-detailrow],[data-bank-new],[data-bank-bulk],[data-bank-closework],[data-bank-page-step],[data-bank-detail-page-step]');
 if(!btn)return;
 if(btn.dataset.bankDelete){const p=get(btn.dataset.bankDelete);if(p)deleteConcept(p);return}
 if(btn.dataset.bankPageStep){b.bankPage=Math.max(1,(+b.bankPage||1)+Number(btn.dataset.bankPageStep));saveUI();return}
 if(btn.dataset.bankDetailPageStep){b.detailPage=Math.max(1,(+b.detailPage||1)+Number(btn.dataset.bankDetailPageStep));saveUI();return}
 if(btn.dataset.bankTab){b.tab=btn.dataset.bankTab;b.workspace='';saveUI();return}
 if(btn.dataset.bankWtab){b.wtab=btn.dataset.bankWtab;S.ui.psGov=S.ui.psGov||{};S.ui.psGov.step=b.wtab;saveUI();return}
 if(btn.dataset.bankDoc){showPreview(String(btn.dataset.bankDoc)+':'+year(),'identity',false);return}
 if(btn.dataset.bankEditDoc){showPreview(String(btn.dataset.bankEditDoc)+':'+year(),'identity',true);return}
 if(btn.dataset.bankUpload){showUploadProgram(btn.dataset.bankUpload);return}
 if(btn.dataset.bankPreview){showPreview(btn.dataset.bankPreview);return}
 if(btn.dataset.bankAdd){openCarry([btn.dataset.bankAdd]);return}
 if(btn.dataset.bankWork){openWorkspace(btn.dataset.bankWork);return}
 if(btn.dataset.bankMap){state().prog=btn.dataset.bankMap;Scope.bank().target=btn.dataset.bankMap;state().tab='mapping';saveUI();return}
 if(btn.dataset.bankRow){if(!ev.target.closest('input,button,select,textarea,label'))showPreview(btn.dataset.bankRow);return}
 if(btn.dataset.bankDetailrow){if(!ev.target.closest('input,button,select,textarea,label')){const p=get(btn.dataset.bankDetailrow);if(p)showPreview(String(p.id)+':'+year())}return}
 if(btn.hasAttribute('data-bank-new')){I.programModal(null);return}
 if(btn.hasAttribute('data-bank-bulk')){bulk();return}
 if(btn.hasAttribute('data-bank-closework')){b.workspace='';saveUI();return}
}

function onChange(ev){
 if(Scope.change(ev)||Docs.portfolioChange?.(ev)||Docs.change(ev))return;
 const q=ev.target,b=store();
 if(q.dataset.bankPageSize!==undefined){b.bankPageSize=Number(q.value);b.bankPage=1;saveUI();return}
 if(q.dataset.bankDetailPageSize!==undefined){b.detailPageSize=Number(q.value);b.detailPage=1;saveUI();return}
 if(q.dataset.bankYear!==undefined){b.filterYear=q.value;b.bankPage=1;saveUI();return}
 if(q.dataset.bankCheckall!==undefined){
  const filtered=records().filter(x=>(b.filterYear==='all'||+b.filterYear===x.year)&&(!b.filterProgram||x.p.id===b.filterProgram)&&(b.filterStatus==='all'||!b.filterStatus||labelStatus(x.p,x.year)===b.filterStatus)&&matchesUnit(x.p,b.filterUnit,b.filterRole)&&matchesPeriod(x.p,b.filterPeriod,b.filterRangeFrom,b.filterRangeTo)&&[x.p.nama,x.p.kode,x.p.uic,x.p.akr].join(' ').toLowerCase().includes(String(b.search||'').toLowerCase()));
  const visible=filtered.slice((b.bankPage-1)*b.bankPageSize,b.bankPage*b.bankPageSize).map(x=>x.key);
  b.check=q.checked?[...new Set([...b.check,...visible])]:b.check.filter(x=>!visible.includes(x));
  saveUI();return;
 }
 if(q.dataset.bankCheck!==undefined){const id=q.dataset.bankCheck;b.check=q.checked?[...new Set([...b.check,id])]:b.check.filter(x=>x!==id);saveUI();return}
}

function mount(){
 oldMount();
 const root=document.querySelector('#view .pswf');if(!root)return;
 Docs.hydratePortfolio?.(root);
 root.addEventListener('click',onClick);
 root.addEventListener('change',onChange);
 // Search fields share a delayed refresh so rerendering never steals focus mid-word.
 const liveSearch=(selector,update)=>{
  const field=root.querySelector(selector);if(!field)return;
  field.addEventListener('input',ev=>{
   const input=ev.currentTarget,value=input.value,pos=input.selectionStart;
   update(value);save();
   clearTimeout(window.__mtPsBankSearchTimer);
   window.__mtPsBankSearchTimer=setTimeout(()=>{
    render();
    const replacement=document.querySelector('#view .pswf '+selector);
    if(replacement){replacement.focus({preventScroll:true});try{replacement.setSelectionRange(pos,pos)}catch(_){}}
   },260);
  });
 };
 liveSearch('[data-bank-search]',v=>{store().search=v;store().bankPage=1;});
 liveSearch('[data-scope-search]',v=>{Scope.bank().map.q=v;});
 liveSearch('[data-scope-history-search]',v=>{Scope.bank().historySearch=v;});
}

/* Reusable column sorting for all regular data tables in Modul Transformasi.
   Presentation-only; it does not reorder WBS hierarchy or persist table rows. */
(function installUniversalSort(){
 if(window.MT_TABLE_SORT_INSTALLED||typeof document.addEventListener!=='function')return;window.MT_TABLE_SORT_INSTALLED=true;
 const ignore='[data-nosort],.psbank-docpaper,.psbank-paper,.psbank-docpreview,.psbank-docsection,.psbank-editform,.rpt,.wbs-tree,.wbs-hierarchy,.tree-table';
 const sortable=th=>{
  const table=th?.closest('table');
  return table&&!table.closest(ignore)&&table.tHead&&table.tBodies.length===1&&!table.querySelector('[rowspan]')&&
   table.tBodies[0].rows.length>1&&!th.querySelector('button,input,select')&&th.colSpan<=1;
 };
 function apply(th){
  if(!sortable(th))return;
  const table=th.closest('table'),heads=[...th.parentElement.children],col=heads.indexOf(th),tbody=table.tBodies[0];
  if(col<0)return;
  const direction=table.dataset.sortCol===String(col)&&table.dataset.sortDir==='asc'?'desc':'asc';
  const rows=[...tbody.rows].map((tr,i)=>({tr,i,text:tr.cells[col]?.textContent?.trim()||''}));
  const numeric=t=>{const s=String(t).trim().replace(/\s/g,'').replace(/^(Rp|IDR)/i,'').replace(/%$/,'');if(!/^[-+]?\d[\d.,]*$/.test(s))return null;
    const decimal=s.includes(',')&&(!s.includes('.')||s.lastIndexOf(',')>s.lastIndexOf('.'));
    return Number(s.replace(decimal?/\./g:/,/g,'').replace(decimal?',':'.','.'));
  };
  rows.sort((a,b)=>{
   const na=numeric(a.text),nb=numeric(b.text);let c;
   if(na!=null&&nb!=null)c=na-nb;
   else {const da=Date.parse(a.text),db=Date.parse(b.text);
    c=Number.isFinite(da)&&Number.isFinite(db)?da-db:a.text.localeCompare(b.text,'id',{numeric:true,sensitivity:'base'});}
   return (direction==='asc'?c:-c)||(a.i-b.i);
  });
  rows.forEach(o=>tbody.appendChild(o.tr));
  heads.forEach(x=>{x.removeAttribute('data-sort-active');x.removeAttribute('aria-sort')});
  th.dataset.sortActive=direction;th.setAttribute('aria-sort',direction==='asc'?'ascending':'descending');
  table.dataset.sortCol=String(col);table.dataset.sortDir=direction;
 }
 document.addEventListener('click',ev=>{const th=ev.target.closest('th');if(th)apply(th)});
 document.addEventListener('keydown',ev=>{if((ev.key==='Enter'||ev.key===' ')&&ev.target.matches('th')){ev.preventDefault();apply(ev.target)}});
})();


/* Menu-local filter policy: no cross-menu capture, application or state propagation.
   Header Tahun Anggaran is an application context, not a reusable filter selection. */
(function initLocalFilterOnly(){
 if(S.ui?.mtSharedFilter)S.ui.mtSharedFilter.enabled=false;
 window.MT_SHARED_FILTER_READY=false;
 window.MT_FILTER_LOCAL_ONLY=true;
})();


/* Read-only activity log across Transformasi sections.
   Local prototype audit only; NOT a server-immutable or certified audit trail. */
(function initTransformationAudit(){
 if(window.MT_AUDIT?.ready||typeof S==='undefined'||typeof save!=='function')return;
 const esc=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 const domainKeys=()=>Object.keys(S).filter(k=>k!=='ui'&&!/^mtAudit|^audit|^_/.test(k)&&
  (Array.isArray(S[k])||S[k]&&typeof S[k]==='object')&&
  !/^(prefs|settings|cache|session|appConfig|navigation|auth|userState)$/i.test(k));
 function snapshot(){
  const o={};for(const k of domainKeys()){
   try{o[k]=JSON.parse(JSON.stringify(S[k]))}catch(_){}
  }return o;
 }
 const equal=(a,b)=>{if(a===b)return true;try{return JSON.stringify(a)===JSON.stringify(b)}catch(_){return false}};
 const short=v=>{
  if(v===undefined)return '—';if(v===null)return '(kosong)';
  const text=typeof v==='string'?v:JSON.stringify(v);
  return text.length>230?text.slice(0,227)+'…':text;
 };
 function diff(oldVal,newVal,path,changes,depth=0){
  if(equal(oldVal,newVal)||changes.length>=36)return;
  if(oldVal===undefined||newVal===undefined||oldVal===null||newVal===null||
     typeof oldVal!=='object'||typeof newVal!=='object'||depth>5){
   changes.push({path,kind:oldVal===undefined?'Ditambahkan':newVal===undefined?'Dihapus':'Diubah',before:short(oldVal),after:short(newVal)});return;
  }
  const arrayA=Array.isArray(oldVal),arrayB=Array.isArray(newVal);
  if(arrayA&&arrayB){
   const id=x=>x&&typeof x==='object'?(x.id??x.k??x.key??null):null;
   if([...oldVal,...newVal].every(x=>x&&id(x)!==null)){
    const prev=new Map(oldVal.map(x=>[String(id(x)),x])),next=new Map(newVal.map(x=>[String(id(x)),x]));
    for(const key of new Set([...prev.keys(),...next.keys()])){
     diff(prev.get(key),next.get(key),path+' / '+key,changes,depth+1);
     if(changes.length>=36)return;
    }
   }else{
    const max=Math.min(Math.max(oldVal.length,newVal.length),60);
    for(let i=0;i<max;i++){diff(oldVal[i],newVal[i],path+' / #'+(i+1),changes,depth+1);if(changes.length>=36)return}
    if(Math.max(oldVal.length,newVal.length)>max)changes.push({path,kind:'Diubah',before:oldVal.length+' entri',after:newVal.length+' entri'});
   }
  }else if(!arrayA&&!arrayB){
   for(const k of new Set([...Object.keys(oldVal),...Object.keys(newVal)])){
    if(/^psSourceProjectSnapshot$|^psCarryBackup$|^fileBlob$/.test(k))continue;
    diff(oldVal[k],newVal[k],path+' / '+k,changes,depth+1);
    if(changes.length>=36)return;
   }
  }else changes.push({path,kind:'Diubah',before:short(oldVal),after:short(newVal)});
 }
 const history=()=>{S.mtAuditTrail=Array.isArray(S.mtAuditTrail)?S.mtAuditTrail:[];return S.mtAuditTrail};
 let baseline=snapshot(),recording=false;
 const originalSave=save;
 const auditedSave=function(...args){
  if(recording)return originalSave.apply(this,args);
  recording=true;
  try{
   const now=snapshot(),changes=[];
   for(const k of new Set([...Object.keys(baseline),...Object.keys(now)])){
    diff(baseline[k],now[k],k,changes);
    if(changes.length>=36)break;
   }
   if(changes.length){
    const event={id:'audit-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),
     at:new Date().toISOString(),by:ME?.name||ME?.nama||ME?.namaLengkap||ME?.email||'Pengguna aktif',
     unit:ME?.unit||'',role:ME?.role||'',menu:String(location?.hash||'Transformasi'),
     subMenu:S.ui?.psFlow?.tab||S.ui?.pmTab||S.ui?.cmTab||'',
     kind:changes.some(x=>x.kind==='Dihapus')?'Dihapus':changes.some(x=>x.kind==='Ditambahkan')?'Ditambahkan':'Diubah',
     changes};
    const arr=history();arr.push(event);if(arr.length>2000)arr.splice(0,arr.length-2000);
   }
   baseline=now;
   return originalSave.apply(this,args);
  }finally{recording=false}
 };
 try{save=auditedSave;if(typeof window.save==='function')window.save=auditedSave}catch(_){}
 window.MT_AUDIT={ready:true,history,open:openLog,refreshBaseline:()=>{baseline=snapshot()}};
 function fmt(iso){try{return new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'}).format(new Date(iso))}catch(_){return iso}}
 function openLog(){
  if(document.querySelector('.mt-audit-overlay'))return;
  const d=document.createElement('div');d.className='mt-audit-overlay';
  d.innerHTML='<section class="mt-audit-dialog" role="dialog" aria-modal="true" aria-label="Activity Log Transformasi">'+
   '<header><div class="mt-audit-title"><span class="mt-audit-symbol">↶</span><div><h3>Activity Log</h3><small>Riwayat perubahan data Modul Transformasi</small></div></div><button type="button" data-mt-audit-close aria-label="Tutup">×</button></header>'+
   '<div class="mt-audit-controls"><input type="search" data-mt-audit-search placeholder="Cari menu, pengguna, kolom, atau perubahan...">'+
   '<select data-mt-audit-kind><option value="">Semua Jenis Aksi</option><option>Ditambahkan</option><option>Diubah</option><option>Dihapus</option></select>'+
   '<select data-mt-audit-time><option value="all">Semua Waktu</option><option value="7">7 Hari Terakhir</option><option value="30">30 Hari Terakhir</option></select></div>'+
   '<div class="mt-audit-scroll"><table><thead><tr><th>No</th><th>Waktu</th><th>Jenis Aksi</th><th>Keterangan Perubahan</th><th>Oleh</th></tr></thead><tbody data-mt-audit-rows></tbody></table></div>'+
   '<div class="mt-audit-disclaimer">ⓘ Riwayat ini bersumber dari data yang tersimpan pada prototipe. Untuk audit trail resmi yang tidak dapat diubah, diperlukan backend terpusat, kontrol akses, dan pencatatan append-only pada server.</div>'+
   '<footer><span data-mt-audit-count></span><button type="button" data-mt-audit-close>Tutup</button></footer></section>';
  (document.querySelector('#app')||document.body).appendChild(d);
  const rows=d.querySelector('[data-mt-audit-rows]');
  const draw=()=>{
   const q=String(d.querySelector('[data-mt-audit-search]').value||'').toLowerCase(),
    action=d.querySelector('[data-mt-audit-kind]').value,
    days=d.querySelector('[data-mt-audit-time]').value;
   const items=history().slice().reverse().filter(x=>(!action||x.kind===action)&&
    (days==='all'||Date.now()-new Date(x.at).getTime()<=Number(days)*86400000)&&
    (!q||[x.menu,x.subMenu,x.by,x.kind,...x.changes.map(z=>[z.path,z.before,z.after].join(' '))].join(' ').toLowerCase().includes(q)));
   rows.innerHTML=items.length?items.map((item,i)=>'<tr><td>'+(i+1)+'</td><td class="mt-audit-date">'+esc(fmt(item.at))+'</td>'+
    '<td><span class="mt-audit-chip '+esc(item.kind.toLowerCase())+'">'+esc(item.kind)+'</span></td>'+
    '<td><b>'+esc(item.menu.replace('#',''))+'</b><small>'+item.changes.length+' rincian diperbarui</small>'+
    '<details><summary>Lihat perubahan</summary><div class="mt-audit-changes">'+item.changes.map(c=>'<div><b>'+esc(c.path)+'</b><p><span>'+esc(c.before)+'</span><strong>→</strong><span>'+esc(c.after)+'</span></p></div>').join('')+'</div></details></td>'+
    '<td>'+esc(item.by)+'<small>'+esc(item.unit)+'</small></td></tr>').join(''):
    '<tr><td colspan="5" class="mt-audit-empty">Belum ada perubahan data sesuai filter. Perubahan yang terjadi sebelum pencatatan ini diaktifkan tidak bisa direkonstruksi otomatis.</td></tr>';
   d.querySelector('[data-mt-audit-count]').textContent=items.length+' aktivitas tercatat';
  };
  d.addEventListener('input',ev=>{if(ev.target.matches('[data-mt-audit-search]'))draw()});
  d.addEventListener('change',ev=>{if(ev.target.matches('[data-mt-audit-kind],[data-mt-audit-time]'))draw()});
  d.addEventListener('click',ev=>{if(ev.target===d||ev.target.closest('[data-mt-audit-close]'))d.remove()});
  d.addEventListener('keydown',ev=>{if(ev.key==='Escape')d.remove()});
  draw();
 }
 // The title action is placed at a fixed corner; no header reflow when switching menus.
 const inject=()=>{
  const root=document.querySelector('#view');if(!root||root.querySelector('.mt-audit-trigger'))return;
  const head=root.querySelector('.vh')||root.querySelector('.pswf')?.parentElement||root;
  if(!head)return;
  if(!head.style.position)head.style.position='relative';
  const button=document.createElement('button');button.type='button';button.className='mt-audit-trigger';
  button.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v6h6"/><path d="M4 9a8.5 8.5 0 1 1-1 5"/><path d="M12 7v5l3 2"/></svg><span>Activity Log</span>';
  button.title='Lihat riwayat perubahan data';button.setAttribute('aria-label','Buka Activity Log');
  button.addEventListener('click',openLog);
  head.appendChild(button);
 };
 if(typeof MutationObserver!=='undefined'){
  const boot=()=>{const root=document.querySelector('#view');if(!root)return;const observer=new MutationObserver(inject);observer.observe(root,{childList:true,subtree:true});inject()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 }
})();

A.page=page;A.mount=mount;A.version='20261109-project-selection-ui-v7';
window.MT_PS_BANK_CORE={records,bank,detail,usulan,addOne,bulk,openCarry,codeFor,programStatus:labelStatus,syncProgramStatuses,showPreview,editablePaper:editForm,openDetailTab:tab=>{const p=current();if(p)showPreview(String(p.id)+':'+year(),tab)},current,openWorkspace,version:A.version};
if(typeof VIEW!=='undefined'&&VIEW==='project-selection'&&ME)render();
})();

/* Global navigation help is loaded from this shared, app-wide bundle.
 * Project Selection scripts are present on all Modul Transformasi routes. */
(function(){
 'use strict';
 if(typeof window==='undefined'||typeof document==='undefined'||window.MT_MENU_TOOLTIP_LOADER)return;
 if(!document.createElement||!document.head||typeof document.head.appendChild!=='function')return;
 window.MT_MENU_TOOLTIP_LOADER=true;
 var script=document.createElement('script');
 script.src='ui-menu-tooltips.js?v=20261109-guide-off-silent-v2';
 script.async=true;
 document.head.appendChild(script);
})();
