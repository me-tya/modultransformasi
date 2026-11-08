/* Project Selection — Bank Program dan Workspace Program, terhubung ke alur Project Selection native. */
(function(){
'use strict';
const A=window.MT_PROJECT_SELECTION,F=window.MT_PS_WORKFLOW,I=A?.internals,Docs=window.MT_PS_DOC,Scope=window.MT_PS_SCOPE;
if(!A||!F||!I||!Docs||!Scope)return;
const oldPage=A.page,oldMount=A.mount;
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const year=()=>+S.ui.tahun||2026;
const can=p=>!!ME&&['SA','PMOK','PMOU'].includes(ME.role)&&(!p||ME.role!=='PMOU'||!p.uic||p.uic===ME.unit)&&(!p||p.psStatus!=='Ditetapkan');
const saveUI=()=>{save();render()};
const state=()=>I.state();
const all=()=>S.programs||[];
const get=id=>all().find(p=>String(p.id)===String(id));
const active=()=>I.programs();
const store=()=>{S.ui.psBank=S.ui.psBank||{};const b=S.ui.psBank;b.tab=b.tab||'bank';b.names=b.names||{};b.check=b.check||[];b.filterYear=b.filterYear||'all';b.search=b.search||'';b.wtab=b.wtab||'identity';return b;};
const current=()=>get(store().workspace)||I.pickedProgram()||active()[0]||null;
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
function labelStatus(p){
 return p.arsip||p.status==='Arsip'||p.psStatus==='Arsip'?'Arsip':p.psDraft&&(!p.psCarry||p.psYear>2026)?'Baru':'Legacy';
}
function bank(){
 const b=store(),q=String(b.search||'').toLowerCase(),rows=records().filter(x=>(b.filterYear==='all'||+b.filterYear===x.year)&&[x.p.nama,x.p.kode,x.p.uic,x.p.akr].join(' ').toLowerCase().includes(q)),to=year();
 const years=[...new Set(records().map(x=>x.year))].sort((a,b)=>b-a);
 return '<div class="psbank-card"><div class="psbank-sectionhead"><div><h3>Daftar Program</h3><p>Bank seluruh program yang pernah ada. Klik baris untuk melihat dokumen 7 tab, atau tambahkan ke tahun tujuan.</p></div><span class="psbank-count">'+rows.length+' entri</span></div>'+
 '<div class="psbank-toolbar"><label>Tahun <select data-bank-year><option value="all">Semua tahun</option>'+years.map(y=>'<option value="'+y+'" '+(String(b.filterYear)===String(y)?'selected':'')+'>'+y+'</option>').join('')+'</select></label>'+
 '<label class="psbank-grow">Cari Program <input type="search" data-bank-search value="'+E(b.search)+'" placeholder="Nama, kode, UIC"></label><span class="psbank-sp"></span>'+
 '<button class="btn pri" data-bank-bulk '+(!b.check.length?'disabled':'')+'>+ Tambah '+b.check.length+' Terpilih ke '+to+'</button></div>'+
 '<div class="psbank-tablewrap"><table class="psbank-table"><thead><tr><th>Tahun</th><th>Nama Program</th><th>Nama Program Baru</th><th>Kode Program</th><th>Status</th><th>Jumlah Proyek (Modul)</th><th>Aksi</th></tr></thead><tbody>'+
 (rows.length?rows.map(({p,year:y,key})=>{
  const num=Scope.modules(p,y).length,already=active().some(x=>x.psCarry?.sourceId===p.id&&+x.psCarry.sourceYear===y);
  return '<tr tabindex="0" class="psbank-clickrow" data-bank-row="'+E(key)+'"><td><b>'+y+'</b></td><td><b>'+E(p.nama)+'</b><small>'+E(p.uic||'—')+'</small></td>'+
  '<td><input type="text" data-bank-name="'+E(key)+'" value="'+E(b.names[key]??p.nama)+'" '+(y>=to?'disabled':'')+' aria-label="Nama program baru '+E(p.nama)+'"></td>'+
  '<td>'+E(p.kode||p.akr||'—')+'</td><td><span class="psbank-tag psbank-'+labelStatus(p).toLowerCase()+'">'+labelStatus(p)+'</span></td><td>'+num+' modul</td>'+
  '<td class="psbank-rowactions"><button class="btn btn-outline btn-sm" data-bank-preview="'+E(key)+'">Lihat</button>'+
  (y<to?'<button class="btn pri btn-sm" data-bank-add="'+E(key)+'" '+(already?'disabled title="Sudah disalin ke tahun '+to+'"':'')+'>+ Tambah Program</button><label class="psbank-rowcheck" title="Pilih untuk menambahkan beberapa program"><input type="checkbox" data-bank-check="'+E(key)+'" '+(b.check.includes(key)?'checked':'')+' '+(already?'disabled':'')+'></label>':
  +p.psYear===to?'<button class="btn btn-outline btn-sm" data-bank-work="'+E(p.id)+'">Workspace</button>':'<span class="psbank-muted">—</span>')+'</td></tr>';
 }).join(''):'<tr><td colspan="7" class="psbank-empty">Tidak ada program sesuai filter.</td></tr>')+'</tbody></table></div>'+
 '<div class="psbank-note">Program sumber dan realisasi lama tetap utuh. Perubahan nama atau pemetaan hanya berlaku pada salinan tahun tujuan.</div></div>';
}
function detail(){
 const b=store(),rows=active();
 return '<div class="psbank-card"><div class="psbank-sectionhead"><div><h3>Detail Program · '+year()+'</h3><p>Program yang dipilih untuk tahun anggaran ini. Buka Workspace untuk mengisi detail dan menyiapkan dokumen.</p></div><span class="psbank-count">'+rows.length+' program</span></div>'+
 '<div class="psbank-tablewrap"><table class="psbank-table"><thead><tr><th>Tahun</th><th>Nama Program</th><th>Kode</th><th>Sumber</th><th>Status</th><th>Proyek / Modul</th><th>Aksi</th></tr></thead><tbody>'+
 (rows.length?rows.map(p=>'<tr class="'+(b.workspace===p.id?'psbank-selected':'')+'"><td>'+year()+'</td><td><b>'+E(p.nama)+'</b><small>'+E(p.uic||'—')+'</small></td><td>'+E(p.kode||p.akr)+'</td><td>'+E(p.psCarry?'Legacy '+p.psCarry.sourceYear:'Program Baru / Existing')+'</td><td><span class="psbank-tag">'+E(p.psStatus||labelStatus(p))+'</span></td><td>'+(p.psProjects?.length||0)+'</td>'+
 '<td class="psbank-rowactions"><button class="btn pri btn-sm" data-bank-work="'+E(p.id)+'">Workspace</button><button class="btn btn-outline btn-sm" data-bank-map="'+E(p.id)+'">Pemetaan ›</button></td></tr>').join(''):'<tr><td colspan="7" class="psbank-empty">Belum ada program yang dipilih untuk '+year()+'. Tambahkan dari Daftar Program atau buat program baru.</td></tr>')+
 '</tbody></table></div></div>'+(b.workspace?workspace(current()):'');
}
const STEPS=[['identity','Identitas'],['case','Business Case'],['benefits','Manfaat'],['stakeholders','Stakeholder'],['risks','Risiko'],['governance','Tata Kelola'],['review','Reviu'],['docs','Buat Dokumen']];
function workspace(p){
 if(!p)return '';
 const b=store(),tab=b.wtab;
 let html='<div class="psbank-card psbank-workspace" id="psbank-workspace"><div class="psbank-sectionhead"><div><h3>Workspace Program · '+E(p.nama)+'</h3><p>'+E(p.kode||p.akr)+' · '+year()+' · '+E(p.psStatus||'Draft')+'</p></div><button class="btn" data-bank-closework>✕ Tutup</button></div>'+
 '<nav class="psbank-steptabs" role="tablist" aria-label="Workspace program">'+STEPS.map((x,i)=>'<button role="tab" aria-selected="'+(tab===x[0])+'" class="'+(tab===x[0]?'on':'')+'" data-bank-wtab="'+x[0]+'"><em>'+(i+1)+'</em> '+x[1]+'</button>').join('')+'</nav>';
 if(tab==='docs')html+=Docs.builder(p);
 else {
  S.ui.psGov=S.ui.psGov||{};S.ui.psGov.step=tab;
  let content=window.MT_PS_GOV?.programPage(p)||'<div class="psbank-empty">Data profil belum tersedia.</div>';
  content=content.replace(/<nav class="psgov-steps"[\s\S]*?<\/nav>/,'');
  html+='<div class="psbank-native">'+content+'</div>';
 }
 return html+'</div>';
}
function usulan(){
 const b=store(),tab=b.tab;
 return '<div class="psbank-subhead"><nav class="psbank-subtabs" role="tablist" aria-label="Usulan Program"><button class="'+(tab==='bank'?'on':'')+'" data-bank-tab="bank">Daftar Program</button><button class="'+(tab==='detail'?'on':'')+'" data-bank-tab="detail">Detail Program <b>'+active().length+'</b></button></nav>'+
 '<button class="btn pri" data-bank-new>+ Tambah Program Baru</button></div>'+
 (tab==='bank'?bank():detail());
}
function showPreview(key){
 const rec=records().find(x=>x.key===key);if(!rec)return;
 const d=document.createElement('div');d.className='psbank-overlay';const b=store();b.preview={key,tab:'identity',edit:false};
 const isTarget=rec.year===year()&&!!rec.p.psDraft&&can(rec.p);
 const view=()=>{const st=b.preview?.tab||'identity';let body=Docs.paper(rec.p,st,rec.year);
  if(isTarget&&b.preview.edit&&['identity','case','governance'].includes(st)){
   const map={identity:[['nama','Nama Program'],['kode','Kode Program'],['jenis','Jenis'],['uic','UIC'],['pend','UIC Pendukung'],['sponsor','Sponsor'],['psObjective','Tujuan Strategis'],['psBackground','Latar Belakang'],['psOutcome','Outcome']],
    case:[['psAlignment','Keselarasan Strategis'],['psBusinessCase','Business Case'],['psAlternatives','Alternatif'],['psFinancialEstimate','Estimasi Biaya'],['psSuccessCriteria','Kriteria Keberhasilan']],
    governance:[['psManager','Manajer Program'],['psDecisionAuthority','Otoritas Keputusan'],['psGovernanceCadence','Mekanisme Reviu'],['psRoadmap','Roadmap'],['psResourcePlan','Sumber Daya'],['psDependencies','Dependensi'],['psAssumptions','Asumsi'],['psConstraints','Batasan']]};
   body='<div class="psbank-editform"><h3>Ubah '+E(st)+'</h3>'+map[st].map(x=>'<label>'+E(x[1])+'<textarea rows="3" data-bank-editfield="'+x[0]+'">'+E(rec.p[x[0]]||'')+'</textarea></label>').join('')+'</div>';
  }else if(isTarget&&b.preview.edit)body='<div class="psbank-editform"><p>Untuk mengubah register manfaat, stakeholder, risiko, atau reviu, gunakan Workspace Program agar seluruh validasi dan historinya tetap konsisten.</p><button class="btn pri" data-bank-preview-work="'+E(rec.p.id)+'">Buka Workspace</button></div>';
  return body;
 };
 const redraw=()=>{d.querySelectorAll('[data-bank-pstep]').forEach(x=>x.classList.toggle('on',x.dataset.bankPstep===b.preview.tab));d.querySelector('.psbank-dialogbody').innerHTML=view()};
 d.innerHTML='<section class="psbank-dialog" role="dialog" aria-modal="true" aria-label="Pratinjau Program"><header><div><b>Pratinjau Dokumen Program</b><small>'+E(rec.p.nama)+' · '+rec.year+' · '+E(rec.p.kode||rec.p.akr)+'</small></div><button data-bank-dismiss>✕</button></header>'+
 '<nav class="psbank-dialogtabs" role="tablist">'+STEPS.slice(0,7).map(x=>'<button class="'+(x[0]==='identity'?'on':'')+'" data-bank-pstep="'+x[0]+'">'+x[1]+'</button>').join('')+'</nav>'+
 '<main class="psbank-dialogbody">'+view()+'</main><footer><span>7 substansi • sumber '+rec.year+'</span><div>'+
 (isTarget?'<button class="btn" data-bank-preview-edit>✎ Ubah / Pratinjau</button>':'')+
 '<button class="btn" data-bank-dismiss>Tutup</button>'+
 (rec.year<year()?'<button class="btn pri" data-bank-preview-add="'+E(key)+'">+ Tambah Program</button>':'')+'</div></footer></section>';
 document.body.appendChild(d);
 d.addEventListener('click',ev=>{
  if(ev.target===d||ev.target.closest('[data-bank-dismiss]')){d.remove();return}
  const st=ev.target.closest('[data-bank-pstep]');if(st){b.preview.tab=st.dataset.bankPstep;b.preview.edit=false;redraw();return}
  if(ev.target.closest('[data-bank-preview-edit]')){
   if(b.preview.edit){d.querySelectorAll('[data-bank-editfield]').forEach(x=>rec.p[x.dataset.bankEditfield]=x.value);rec.p.psUpdatedAt=new Date().toISOString();save();b.preview.edit=false;}
   else b.preview.edit=true;redraw();return;
  }
  const go=ev.target.closest('[data-bank-preview-work]');if(go){d.remove();openWorkspace(go.dataset.bankPreviewWork);return}
  const add=ev.target.closest('[data-bank-preview-add]');if(add){d.remove();addOne(add.dataset.bankPreviewAdd);return}
 });
 d.addEventListener('keydown',ev=>{if(ev.key==='Escape')d.remove()});
}
function addOne(key,renderNow=true){
 const rec=records().find(x=>x.key===key);if(!rec||!can())return null;
 const from=rec.year,to=year();if(from>=to){toast('Tahun tujuan harus setelah tahun sumber.');return null}
 const duplicate=active().find(p=>p.psCarry?.sourceId===rec.p.id&&+p.psCarry?.sourceYear===from);
 if(duplicate){store().workspace=duplicate.id;store().tab='detail';state().prog=duplicate.id;saveUI();toast('Program ini sudah pernah ditambahkan ke tahun '+to+'.');return null}
 const p=F.cloneProgram(rec.p,from,to),newName=String(store().names[key]??rec.p.nama).trim();
 if(newName)p.nama=newName;
 p.psCarry.sourceYear=from;p.psSourceYear=from;all().push(p);
 state().prog=p.id;Scope.bank().target=p.id;store().workspace=p.id;store().check=store().check.filter(x=>x!==key);
 state().tab='mapping';
 if(renderNow){saveUI();toast('Program '+p.nama+' berhasil dibawa ke '+to+'. Selanjutnya petakan proyek/modul.')}
 return p;
}
function bulk(){
 const ids=store().check.slice();let n=0,last=null;
 ids.forEach(key=>{const rec=records().find(x=>x.key===key);if(rec&&rec.year<year()&&!active().some(p=>p.psCarry?.sourceId===rec.p.id&&+p.psCarry.sourceYear===rec.year)){last=addOne(key,false);if(last)n++}});
 store().check=[];if(!n){toast('Tidak ada program baru yang dapat ditambahkan.');return}
 state().tab='mapping';saveUI();toast(n+' program berhasil ditambahkan. Lanjutkan Pemetaan Proyek.');
}
function openWorkspace(id){const b=store();b.tab='detail';b.workspace=id;b.wtab='identity';state().prog=id;saveUI()}
function page(){
 const base=oldPage(),i=base.indexOf('<div class="ps27-actionbar">');
 if(i<0)return base;
 const end=base.indexOf('</div>',i)+6,left=base.slice(0,i),right=base.slice(end);
 if(state().tab==='usulan')return left+usulan()+'</section>';
 if(state().tab==='mapping')return left+Scope.render()+'</section>';
 return left+right;
}
function onClick(ev){
 if(Scope.click(ev))return;
 if(Docs.click(ev,current()))return;
 const b=store(),btn=ev.target.closest('[data-bank-tab],[data-bank-preview],[data-bank-add],[data-bank-work],[data-bank-map],[data-bank-wtab],[data-bank-row],[data-bank-new],[data-bank-bulk],[data-bank-closework]');
 if(!btn)return;
 if(btn.dataset.bankTab){b.tab=btn.dataset.bankTab;b.workspace='';saveUI();return}
 if(btn.dataset.bankWtab){b.wtab=btn.dataset.bankWtab;S.ui.psGov=S.ui.psGov||{};S.ui.psGov.step=b.wtab;saveUI();return}
 if(btn.dataset.bankPreview){showPreview(btn.dataset.bankPreview);return}
 if(btn.dataset.bankAdd){addOne(btn.dataset.bankAdd);return}
 if(btn.dataset.bankWork){openWorkspace(btn.dataset.bankWork);return}
 if(btn.dataset.bankMap){state().prog=btn.dataset.bankMap;Scope.bank().target=btn.dataset.bankMap;state().tab='mapping';saveUI();return}
 if(btn.dataset.bankRow){if(!ev.target.closest('input,button,select,textarea,label'))showPreview(btn.dataset.bankRow);return}
 if(btn.hasAttribute('data-bank-new')){I.programModal(null);return}
 if(btn.hasAttribute('data-bank-bulk')){bulk();return}
 if(btn.hasAttribute('data-bank-closework')){b.workspace='';saveUI();return}
}
function onChange(ev){
 if(Scope.change(ev)||Docs.change(ev))return;
 const q=ev.target,b=store();
 if(q.dataset.bankYear!==undefined){b.filterYear=q.value;saveUI();return}
 if(q.dataset.bankName!==undefined){b.names[q.dataset.bankName]=q.value;save();return}
 if(q.dataset.bankCheck!==undefined){
  const id=q.dataset.bankCheck;b.check=q.checked?[...new Set([...b.check,id])]:b.check.filter(x=>x!==id);saveUI();return;
 }
}
function mount(){
 oldMount();
 const root=document.querySelector('#view .pswf');if(!root)return;
 root.addEventListener('click',onClick);
 root.addEventListener('change',onChange);
 root.querySelector('[data-bank-search]')?.addEventListener('input',e=>{
  const b=store(),v=e.target.value,pos=e.target.selectionStart;b.search=v;saveUI();
  const r=document.querySelector('[data-bank-search]');if(r){r.focus();r.setSelectionRange(pos,pos)}
 });
 root.querySelector('[data-scope-search]')?.addEventListener('input',e=>{
  Scope.bank().map.q=e.target.value;const at=e.target.selectionStart;saveUI();
  const n=document.querySelector('[data-scope-search]');if(n){n.focus();n.setSelectionRange(at,at)}
 });
}
A.page=page;A.mount=mount;A.version='20261108-program-bank-workspace-v4';
window.MT_PS_BANK_CORE={records,bank,detail,usulan,addOne,bulk,showPreview,current,openWorkspace,version:A.version};
if(typeof VIEW!=='undefined'&&VIEW==='project-selection'&&ME)render();
})();