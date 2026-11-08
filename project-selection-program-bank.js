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
function labelStatus(p){
 return p.arsip||p.status==='Arsip'||p.psStatus==='Arsip'?'Arsip':p.psCarry?'Legacy':p.psDraft?'Baru':'Legacy';
}
function bank(){
 const b=store(),q=String(b.search||'').toLowerCase(),list=records();
 const rows=list.filter(x=>(b.filterYear==='all'||+b.filterYear===x.year)&&[x.p.nama,x.p.kode,x.p.uic,x.p.akr].join(' ').toLowerCase().includes(q));
 const years=[...new Set(list.map(x=>x.year))].sort((a,c)=>c-a);
 const checked=rows.length>0&&rows.every(x=>b.check.includes(x.key));
 return '<div class="psbank-card"><div class="psbank-sectionhead"><div><h3>Daftar Program</h3><p>Bank histori seluruh program lintas tahun. Klik baris untuk melihat dokumen lama; gunakan + atau centang beberapa program untuk disalin ke tahun pilihan.</p></div><span class="psbank-count">'+rows.length+' entri</span></div>'+
 '<div class="psbank-toolbar"><label>Tahun <select data-bank-year><option value="all">Semua tahun</option>'+years.map(y=>'<option value="'+y+'" '+(String(b.filterYear)===String(y)?'selected':'')+'>'+y+'</option>').join('')+'</select></label>'+
 '<label class="psbank-grow">Cari Program <input type="search" data-bank-search value="'+E(b.search)+'" placeholder="Nama, kode, UIC"></label><span class="psbank-sp"></span>'+
 '<span class="psbank-muted">Centang program untuk tambah massal</span></div>'+
 '<div class="psbank-tablewrap"><table class="psbank-table psbank-history-table"><thead><tr>'+
 '<th class="psbank-checkcol"><input type="checkbox" data-bank-checkall '+(checked?'checked':'')+' aria-label="Pilih semua program yang ditampilkan" title="Pilih semua program yang ditampilkan"></th>'+
 '<th>Tahun</th><th>Nama Program</th><th>Kode Program</th><th>Status</th><th>Jumlah Modul</th><th>Aksi</th></tr></thead><tbody>'+
 (rows.length?rows.map(({p,year:y,key})=>{
  const num=Scope.modules(p,y).length;
  return '<tr tabindex="0" class="psbank-clickrow" data-bank-row="'+E(key)+'" title="Lihat dokumen program"><td class="psbank-checkcol"><input type="checkbox" data-bank-check="'+E(key)+'" '+(b.check.includes(key)?'checked':'')+' aria-label="Pilih '+E(p.nama)+' tahun '+y+'"></td>'+
  '<td><b>'+y+'</b></td><td><b>'+E(p.nama)+'</b><small>'+E(p.uic||'—')+'</small></td>'+
  '<td>'+E(p.kode||p.akr||'—')+'</td><td><span class="psbank-tag psbank-'+labelStatus(p).toLowerCase()+'">'+labelStatus(p)+'</span></td><td>'+num+' modul</td>'+
  '<td class="psbank-rowactions"><button type="button" class="btn pri btn-sm psbank-icon-add" data-bank-add="'+E(key)+'" aria-label="Tambahkan Program ke tahun" title="Tambahkan Program ke tahun">+</button></td></tr>';
 }).join(''):'<tr><td colspan="7" class="psbank-empty">Tidak ada program sesuai filter.</td></tr>')+'</tbody></table></div>'+ 
 (b.check.length?'<div class="psbank-bulkfoot"><span><b>'+b.check.length+'</b> program dipilih</span><button type="button" class="btn pri" data-bank-bulk>+ Tambahkan Program</button></div>':'')+
 '<div class="psbank-note">Semua program dapat dipilih sebagai sumber, termasuk dari tahun yang sama; kode salinan akan dibuat unik. Data historis tetap utuh; nama, kode, dan dokumen salinannya dapat disesuaikan pada tahun tujuan.</div></div>';
}
function detail(){
 const b=store(),rows=active();
 return '<div class="psbank-card"><div class="psbank-sectionhead"><div><h3>Detail Program · '+year()+'</h3><p>Daftar program terpilih pada tahun '+year()+'. Klik baris untuk membuka Detail Program (pratinjau) atau gunakan Workspace untuk mengubah isian.</p></div><span class="psbank-count">'+rows.length+' program</span></div>'+
 '<div class="psbank-tablewrap"><table class="psbank-table psbank-detail-table"><thead><tr><th>Tahun</th><th>Nama Program</th><th>Kode Program</th><th>Sumber</th><th>Status</th><th>Jumlah Modul</th><th>Aksi</th></tr></thead><tbody>'+
 (rows.length?rows.map(p=>'<tr tabindex="0" data-bank-detailrow="'+E(p.id)+'" class="psbank-clickrow '+(b.workspace===p.id?'psbank-selected':'')+'" title="Buka Detail Program"><td>'+year()+'</td><td><b>'+E(p.nama)+'</b><small>'+E(p.uic||'—')+'</small></td><td>'+E(p.kode||p.akr)+'</td><td>'+E(p.psCarry?'Dari '+p.psCarry.sourceYear:'Program baru')+'</td><td><span class="psbank-tag psbank-'+labelStatus(p).toLowerCase()+'">'+labelStatus(p)+'</span></td><td>'+Scope.modules(p,year()).length+'</td>'+
 '<td class="psbank-rowactions"><button type="button" class="btn pri btn-sm" data-bank-work="'+E(p.id)+'">Workspace</button><button type="button" class="btn btn-outline btn-sm" data-bank-map="'+E(p.id)+'">Pemetaan</button></td></tr>').join(''):'<tr><td colspan="7" class="psbank-empty">Belum ada program untuk '+year()+'. Pilih dari Daftar Program, kemudian tambahkan ke tahun ini.</td></tr>')+
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
 const d=document.createElement('div');d.className='psbank-overlay';
 const b=store();b.preview={key,tab:'identity'};
 const isTarget=rec.year===year()&&active().some(p=>p.id===rec.p.id);
 const tabs=isTarget?STEPS.filter(x=>x[0]!=='review'):STEPS.filter(x=>x[0]!=='docs');
 const view=()=>b.preview.tab==='docs'?Docs.builder(rec.p):Docs.paper(rec.p,b.preview.tab,rec.year);
 const redraw=()=>{
  d.querySelectorAll('[data-bank-pstep]').forEach(x=>{const on=x.dataset.bankPstep===b.preview.tab;x.classList.toggle('on',on);x.setAttribute('aria-selected',String(on))});
  d.querySelector('.psbank-dialogbody').innerHTML=view();
 };
 d.innerHTML='<section class="psbank-dialog" role="dialog" aria-modal="true" aria-label="Detail Program"><header><div><b>Detail Program</b><small>'+E(rec.p.nama)+' · '+rec.year+' · '+E(rec.p.kode||rec.p.akr)+'</small></div><button type="button" data-bank-dismiss aria-label="Tutup">✕</button></header>'+
 '<nav class="psbank-dialogtabs" role="tablist">'+tabs.map(x=>'<button role="tab" aria-selected="'+(x[0]==='identity')+'" class="'+(x[0]==='identity'?'on':'')+'" data-bank-pstep="'+x[0]+'">'+x[1]+'</button>').join('')+'</nav>'+
 '<main class="psbank-dialogbody">'+view()+'</main><footer><span>'+ (isTarget?'Program tahun '+year()+' · 6 substansi + Buat Dokumen':'7 substansi historis · sumber '+rec.year) +'</span><div>'+
 (isTarget?'<button type="button" class="btn pri" data-bank-preview-work="'+E(rec.p.id)+'">✎ Buka Workspace</button>':'<button type="button" class="btn pri" data-bank-preview-add="'+E(key)+'">+ Tambahkan ke Tahun</button>')+
 '<button type="button" class="btn" data-bank-dismiss>Tutup</button></div></footer></section>';
 (document.querySelector('#app')||document.body).appendChild(d);
 d.addEventListener('click',ev=>{
  if(ev.target===d||ev.target.closest('[data-bank-dismiss]')){d.remove();return}
  const st=ev.target.closest('[data-bank-pstep]');
  if(st){b.preview.tab=st.dataset.bankPstep;redraw();return}
  if(isTarget&&b.preview.tab==='docs'&&Docs.click(ev,rec.p)){redraw();return}
  const go=ev.target.closest('[data-bank-preview-work]');if(go){d.remove();openWorkspace(go.dataset.bankPreviewWork);return}
  const add=ev.target.closest('[data-bank-preview-add]');if(add){d.remove();openCarry([add.dataset.bankPreviewAdd]);return}
 });
 d.addEventListener('change',ev=>{if(isTarget&&b.preview.tab==='docs'&&Docs.change(ev))redraw()});
 d.addEventListener('keydown',ev=>{if(ev.key==='Escape')d.remove()});
}
function codeFor(p,to){
 const type=/^tematik$/i.test(String(p.jenis||''))?'T':'B';
 const code=String(p.kode||'').toUpperCase();
 const old=code.match(/^[BT]\d{2}-([A-Z0-9-]+)$/);
 const suffix=old?old[1]:String(p.akr||p.nama||'PROG').toUpperCase().replace(/[^A-Z0-9-]/g,'').replace(/^(PS\d{4}-|C[A-Z]{5}$)/,'');
 return type+String(to).slice(-2)+'-'+(suffix||'PROG');
}
function addOne(key,renderNow=true,to=year(),newName=null){
 const rec=records().find(x=>x.key===key);if(!rec||!can())return null;
 to=+to;if(to<2025||to>2029){toast('Pilih tahun tujuan 2025–2029.');return null}
 const duplicate=all().find(p=>+p.psYear===to&&p.psCarry?.sourceId===rec.p.id&&+p.psCarry?.sourceYear===rec.year);
 if(duplicate){toast('Program '+rec.p.nama+' dari '+rec.year+' sudah ditambahkan ke '+to+'.');return null}
 const p=F.cloneProgram(rec.p,rec.year,to);
 p.nama=String(newName??store().names[key]??rec.p.nama).trim()||rec.p.nama;
 const baseCode=codeFor(rec.p,to);let candidate=baseCode,seq=2;
 while(all().some(x=>+x.psYear===to&&String(x.kode||'').toUpperCase()===candidate.toUpperCase()))candidate=baseCode+'-'+seq++;
 p.kode=candidate;
 p.psCarry.sourceYear=rec.year;p.psSourceYear=rec.year;all().push(p);
 const b=store();state().prog=p.id;Scope.bank().target=p.id;b.workspace='';b.tab='detail';b.check=b.check.filter(x=>x!==key);state().tab='usulan';
 if(renderNow){saveUI();toast('Program '+p.nama+' berhasil ditambahkan ke Detail Program tahun '+to+'.')}
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
 '<div class="psbank-carry-list">'+rows.map(({p,year:y,key})=>'<div class="psbank-carry-item"><div><b>'+E(p.nama)+'</b><small>Asal '+y+' · '+E(p.kode||p.akr)+' · '+labelStatus(p)+'</small></div><label>Nama program pada tahun tujuan<input type="text" data-carry-name="'+E(key)+'" value="'+E(p.nama)+'" maxlength="180"></label><div class="psbank-carry-code" data-carry-code="'+E(key)+'">'+E(codeFor(p,target))+'</div></div>').join('')+'</div></main>'+
 '<footer><span>Periksa nama dan tahun tujuan sebelum menyimpan.</span><div><button type="button" class="btn" data-carry-close>Batal</button><button type="button" class="btn pri" data-carry-save>Tambahkan '+rows.length+' Program</button></div></footer></section>';
 (document.querySelector('#app')||document.body).appendChild(d);
 d.addEventListener('change',ev=>{if(ev.target.matches('[data-carry-year]'))rows.forEach(({p,key})=>{const x=d.querySelector('[data-carry-code="'+CSS.escape(key)+'"]');if(x)x.textContent=codeFor(p,+ev.target.value)})});
 d.addEventListener('click',ev=>{
  if(ev.target===d||ev.target.closest('[data-carry-close]')){d.remove();return}
  if(!ev.target.closest('[data-carry-save]'))return;
  const to=+d.querySelector('[data-carry-year]').value;
  const names=new Map([...d.querySelectorAll('[data-carry-name]')].map(x=>[x.dataset.carryName,x.value.trim()]));
  if([...names.values()].some(x=>!x)){toast('Nama program tujuan tidak boleh kosong.');return}
  let n=0;for(const row of rows){const added=addOne(row.key,false,to,names.get(row.key));if(added)n++}
  if(!n){toast('Tidak ada program baru yang ditambahkan.');return}
  S.ui.tahun=to;state().tab='usulan';store().tab='detail';store().workspace='';store().check=[];save();d.remove();render();
  toast(n+' program masuk ke Detail Program '+to+'. Lengkapi Workspace atau lanjutkan ke Pemetaan Proyek.');
 });
 d.addEventListener('keydown',ev=>{if(ev.key==='Escape')d.remove()});
 d.querySelector('[data-carry-year]')?.focus();
}
function bulk(){openCarry(store().check)}

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
 const b=store(),btn=ev.target.closest('[data-bank-tab],[data-bank-preview],[data-bank-add],[data-bank-work],[data-bank-map],[data-bank-wtab],[data-bank-row],[data-bank-detailrow],[data-bank-new],[data-bank-bulk],[data-bank-closework]');
 if(!btn)return;
 if(btn.dataset.bankTab){b.tab=btn.dataset.bankTab;b.workspace='';saveUI();return}
 if(btn.dataset.bankWtab){b.wtab=btn.dataset.bankWtab;S.ui.psGov=S.ui.psGov||{};S.ui.psGov.step=b.wtab;saveUI();return}
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
 if(Scope.change(ev)||Docs.change(ev))return;
 const q=ev.target,b=store();
 if(q.dataset.bankYear!==undefined){b.filterYear=q.value;saveUI();return}
 if(q.dataset.bankCheckall!==undefined){
  const visible=records().filter(x=>(b.filterYear==='all'||+b.filterYear===x.year)&&[x.p.nama,x.p.kode,x.p.uic,x.p.akr].join(' ').toLowerCase().includes(String(b.search||'').toLowerCase())).map(x=>x.key);
  b.check=q.checked?[...new Set([...b.check,...visible])]:b.check.filter(x=>!visible.includes(x));
  saveUI();return;
 }
 if(q.dataset.bankCheck!==undefined){const id=q.dataset.bankCheck;b.check=q.checked?[...new Set([...b.check,id])]:b.check.filter(x=>x!==id);saveUI();return}
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
A.page=page;A.mount=mount;A.version='20261108-program-bank-carryover-v5';
window.MT_PS_BANK_CORE={records,bank,detail,usulan,addOne,bulk,openCarry,codeFor,showPreview,current,openWorkspace,version:A.version};
if(typeof VIEW!=='undefined'&&VIEW==='project-selection'&&ME)render();
})();