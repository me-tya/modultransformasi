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
 const rows=list.filter(x=>(b.filterYear==='all'||+b.filterYear===x.year)&&(!b.filterProgram||x.p.id===b.filterProgram)&&(b.filterStatus==='all'||!b.filterStatus||labelStatus(x.p)===b.filterStatus)&&[x.p.nama,x.p.kode,x.p.uic,x.p.akr].join(' ').toLowerCase().includes(q));
 const years=[...new Set(list.map(x=>x.year))].sort((a,c)=>c-a);
 const checked=rows.length>0&&rows.every(x=>b.check.includes(x.key));
 return '<div class="psbank-card"><div class="psbank-sectionhead"><div><h3>Daftar Program</h3><p>Bank histori seluruh program lintas tahun. Klik baris untuk melihat dokumen lama; gunakan + atau centang beberapa program untuk disalin ke tahun pilihan.</p></div><span class="psbank-count">'+rows.length+' entri</span></div>'+
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
 const b=store(),q=String(b.search||'').toLowerCase(),status=b.filterStatus||'all';
 const rows=active().filter(p=>(!b.detailProgram||p.id===b.detailProgram)&&[p.nama,p.kode,p.uic,p.akr].join(' ').toLowerCase().includes(q)&&(status==='all'||labelStatus(p)===status));
 const allRows=active(),complete=p=>window.MT_PS_GOV?.readiness(p)||{done:0,total:7};
 return '<div class="psbank-card"><div class="psbank-sectionhead"><div><h3>Detail Program · '+year()+'</h3><p>Klik program untuk melihat atau mengubah dokumen. Tidak ada Workspace terpisah.</p></div><span class="psbank-count">'+rows.length+' program</span></div>'+
 '<div class="psbank-tablewrap"><table class="psbank-table psbank-detail-table"><thead><tr><th>Tahun</th><th>Nama Program</th><th>Kode Program</th><th>Asal</th><th>Status</th><th>Kelengkapan</th><th>Modul</th><th>Aksi</th></tr></thead><tbody>'+
 (rows.length?rows.map(p=>{const readiness=complete(p);return '<tr tabindex="0" data-bank-detailrow="'+E(p.id)+'" class="psbank-clickrow" title="Buka Detail Program"><td>'+year()+'</td><td><b>'+E(p.nama)+'</b><small>'+E(p.uic||'—')+'</small></td><td>'+E(p.kode||p.akr)+'</td><td>'+E(p.psCarry?'Dari '+p.psCarry.sourceYear:'Program baru')+'</td><td><span class="psbank-tag psbank-'+labelStatus(p).toLowerCase()+'">'+labelStatus(p)+'</span></td><td><b>'+readiness.done+'/'+readiness.total+'</b><small>'+E(readiness.ok?'Siap direviu':'Perlu dilengkapi')+'</small></td><td>'+Scope.modules(p,year()).length+'</td>'+
 '<td class="psbank-rowactions"><button type="button" class="btn btn-outline btn-sm" data-bank-map="'+E(p.id)+'">Pemetaan</button></td></tr>'}).join(''):'<tr><td colspan="8" class="psbank-empty">Belum ada program sesuai filter. Tambahkan program dari Daftar Program.</td></tr>')+'</tbody></table></div></div>'+
 '<div class="psbank-summary"><span><b>'+allRows.length+'</b> Program</span><span><b>'+allRows.reduce((n,p)=>n+Scope.modules(p,year()).length,0)+'</b> Modul</span><span><b>'+allRows.filter(p=>complete(p).ok).length+'</b> Siap Direviu</span><span><b>'+allRows.filter(p=>!complete(p).ok).length+'</b> Perlu Dilengkapi</span></div>'+ 
 '<details class="psbank-inputsummary"><summary>Ringkasan Isian Detail Program ('+rows.length+')</summary><div class="psbank-inputsummary-list">'+rows.map(p=>'<article><b>'+E(p.nama)+'</b><small>'+E(p.kode||p.akr)+' · Diperbarui '+E((p.psUpdatedAt||p.psCarry?.createdAt||'Belum ada tanggal').slice(0,10))+'</small><p><strong>Tujuan:</strong> '+E(p.psObjective||'Belum diisi')+'</p><p><strong>Business Case:</strong> '+E(p.psBusinessCase||'Belum diisi')+'</p><p><strong>Outcome:</strong> '+E(p.psOutcome||'Belum diisi')+'</p></article>').join('')+'</div></details>';
}
const STEPS=[['identity','Identitas'],['case','Business Case'],['benefits','Manfaat'],['stakeholders','Stakeholder'],['risks','Risiko'],['governance','Tata Kelola'],['review','Reviu'],['docs','Buat Dokumen Program']];
function workspace(p){return '';}
function usulan(){
 const b=store(),tab=b.tab;
 return '<div class="psbank-subhead"><nav class="psbank-subtabs" role="tablist" aria-label="Usulan Program">'+
 [['bank','Daftar Program'],['detail','Detail Program'],['portfolio','Buat Dokumen Portofolio']].map(t=>'<button class="'+(tab===t[0]?'on':'')+'" data-bank-tab="'+t[0]+'">'+t[1]+(t[0]==='detail'?' <b>'+active().length+'</b>':'')+'</button>').join('')+
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
function editForm(p,tab){
 const f=EDIT_FIELDS[tab];
 if(f)return '<div class="psbank-editform"><h3>Ubah '+E(STEPS.find(x=>x[0]===tab)?.[1]||tab)+'</h3><div class="psbank-editgrid">'+f.map(x=>'<label>'+E(x[1])+(x[0]==='nama'||x[0]==='kode'?' *':'')+(x[0]==='jenis'?'<select data-bank-editfield="jenis"><option '+(p.jenis==='Berkelanjutan'?'selected':'')+'>Berkelanjutan</option><option '+(p.jenis==='Tematik'?'selected':'')+'>Tematik</option></select>':'<textarea rows="'+(['nama','kode','uic','sponsor','psFinancialEstimate'].includes(x[0])?'1':'3')+'" data-bank-editfield="'+x[0]+'">'+E(p[x[0]]||'')+'</textarea>')+'</label>').join('')+'</div></div>';
 const spec=REG_FIELDS[tab];if(!spec)return '';
 const arr=p[spec.key]||[];
 const row=(x,i)=>'<div class="psbank-edit-entry" data-bank-edit-entry><div class="psbank-entryhead"><b>Entri '+(i+1)+'</b><button type="button" class="btn" data-bank-entry-remove>Hapus</button></div><div class="psbank-editgrid">'+spec.fields.map(field=>'<label>'+E(field[1])+'<textarea rows="2" data-bank-regfield="'+field[0]+'">'+E(x?.[field[0]]||'')+'</textarea></label>').join('')+'</div></div>';
 return '<div class="psbank-editform"><div class="psbank-sectionhead"><h3>Ubah '+E(STEPS.find(x=>x[0]===tab)?.[1]||tab)+'</h3><button type="button" class="btn" data-bank-entry-add>+ Tambah Entri</button></div><div data-bank-entry-list>'+arr.map(row).join('')+'</div><template data-bank-entry-template>'+row({},arr.length)+'</template></div>';
}
function showPreview(key){
 const rec=records().find(x=>x.key===key);if(!rec)return;
 const p=rec.p,d=document.createElement('div');d.className='psbank-overlay';
 const b=store();b.preview={key,tab:'identity',edit:false,dirty:false};
 const isTarget=rec.year===year()&&active().some(x=>x.id===p.id);
 const editable=isTarget&&can(p);
 const tabs=isTarget?STEPS.filter(x=>x[0]!=='review'):STEPS.filter(x=>x[0]!=='docs');
 const v=()=>b.preview;
 const view=()=>v().tab==='docs'?Docs.builder(p):editable&&v().edit?editForm(p,v().tab):Docs.paper(p,v().tab,rec.year);
 const foot=()=>{
  const x=d.querySelector('.psbank-dialog>footer>div');if(!x)return;
  if(v().tab==='docs'&&isTarget){x.innerHTML='<button type="button" class="btn pri" data-doc-export>↓ Unduh</button><button type="button" class="btn" data-bank-dismiss>Tutup</button>';return}
  if(isTarget){x.innerHTML=(editable?'<button type="button" class="btn" data-bank-preview-edit>✎ Ubah</button><button type="button" class="btn" data-bank-preview-save '+(!v().edit?'disabled':'')+'>Simpan</button><button type="button" class="btn pri" data-bank-preview-saveclose>Simpan & Tutup</button>':'<button type="button" class="btn" data-bank-dismiss>Tutup</button>');return}
  x.innerHTML='<button type="button" class="btn pri" data-bank-preview-add="'+E(key)+'">+ Tambahkan ke Tahun</button><button type="button" class="btn" data-bank-dismiss>Tutup</button>';
 };
 const redraw=(body=true)=>{
  d.querySelectorAll('[data-bank-pstep]').forEach(x=>{const on=x.dataset.bankPstep===v().tab;x.classList.toggle('on',on);x.setAttribute('aria-selected',String(on))});
  if(body)d.querySelector('.psbank-dialogbody').innerHTML=view();
  foot();
 };
 const discard=()=>!v().dirty||window.confirm('Perubahan pada formulir belum disimpan. Abaikan perubahan?');
 const saveForm=()=>{
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
  p.psUpdatedAt=new Date().toISOString();p.psUpdatedBy=ME?.email||'';v().edit=false;v().dirty=false;save();return true;
 };
 d.innerHTML='<section class="psbank-dialog" role="dialog" aria-modal="true" aria-label="Detail Program"><header><div><b>Detail Program</b><small>'+E(p.nama)+' · '+rec.year+' · '+E(p.kode||p.akr)+'</small></div><button type="button" data-bank-dismiss aria-label="Tutup">✕</button></header>'+
 '<nav class="psbank-dialogtabs" role="tablist">'+tabs.map(x=>'<button role="tab" aria-selected="'+(x[0]==='identity')+'" class="'+(x[0]==='identity'?'on':'')+'" data-bank-pstep="'+x[0]+'">'+x[1]+'</button>').join('')+'</nav>'+
 '<main class="psbank-dialogbody">'+view()+'</main><footer><span>'+(isTarget?'Dokumen program tahun '+year():'Histori program '+rec.year)+'</span><div></div></footer></section>';
 (document.querySelector('#app')||document.body).appendChild(d);foot();
 d.addEventListener('click',ev=>{
  if(ev.target===d||ev.target.closest('[data-bank-dismiss]')){if(discard())d.remove();return}
  const step=ev.target.closest('[data-bank-pstep]');
  if(step){if(!discard())return;v().tab=step.dataset.bankPstep;v().edit=false;v().dirty=false;redraw();return}
  if(v().tab==='docs'&&Docs.click(ev,p,true)){if(!ev.target.closest('[data-doc-export],[data-doc-signed-kind]'))redraw();return}
  if(ev.target.closest('[data-bank-preview-edit]')){if(!editable)return;v().edit=true;v().dirty=false;redraw();return}
  if(ev.target.closest('[data-bank-preview-save]')){if(saveForm()){redraw();toast('Detail Program tersimpan.')}return}
  if(ev.target.closest('[data-bank-preview-saveclose]')){if(saveForm()){d.remove();render();}return}
  if(ev.target.closest('[data-bank-entry-add]')){const list=d.querySelector('[data-bank-entry-list]'),template=d.querySelector('template[data-bank-entry-template]');list.insertAdjacentHTML('beforeend',template.innerHTML);v().dirty=true;return}
  if(ev.target.closest('[data-bank-entry-remove]')){ev.target.closest('[data-bank-edit-entry]')?.remove();v().dirty=true;return}
  if(ev.target.closest('[data-bank-preview-add]')){d.remove();openCarry([key]);return}
 });
 d.addEventListener('input',ev=>{if(v().edit&&ev.target.matches('input,textarea,select'))v().dirty=true});
 d.addEventListener('change',ev=>{if(v().tab==='docs'&&isTarget){if(Docs.change(ev,true))redraw()}else if(v().edit)v().dirty=true});
 d.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&discard())d.remove()});
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
  S.ui.tahun=to;state().tab='usulan';store().tab='detail';store().workspace='';store().check=[];save();d.remove();render();
  toast(n+' program masuk ke Detail Program '+to+'. Klik baris untuk mengedit atau lanjutkan Pemetaan Proyek.');
 });
 d.addEventListener('keydown',ev=>{if(ev.key==='Escape')d.remove()});
 d.querySelector('[data-carry-year]')?.focus();
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
 if(Scope.change(ev)||Docs.portfolioChange?.(ev)||Docs.change(ev))return;
 const q=ev.target,b=store();
 if(q.dataset.bankYear!==undefined){b.filterYear=q.value;saveUI();return}
 if(q.dataset.bankCheckall!==undefined){
  const visible=records().filter(x=>(b.filterYear==='all'||+b.filterYear===x.year)&&(!b.filterProgram||x.p.id===b.filterProgram)&&(b.filterStatus==='all'||!b.filterStatus||labelStatus(x.p)===b.filterStatus)&&[x.p.nama,x.p.kode,x.p.uic,x.p.akr].join(' ').toLowerCase().includes(String(b.search||'').toLowerCase())).map(x=>x.key);
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


/* Shared filter is opt-in; otherwise every menu/tab keeps its own local filter.
   Apply only compatible year/program/status/search fields; do not overwrite
   source-project selectors or arbitrary form fields. */
(function initSharedFilters(){
 if(typeof MutationObserver==='undefined'||typeof document.querySelectorAll!=='function'||window.MT_SHARED_FILTER_READY)return;
 window.MT_SHARED_FILTER_READY=true;
 const saved=()=>{S.ui=S.ui||{};return S.ui.mtSharedFilter||(S.ui.mtSharedFilter={enabled:false,year:'',programName:'',status:'',search:''})};
 const compact=x=>String(x||'').toLowerCase().replace(/\s+/g,' ').trim();
 const labelFor=(node)=>{
  if(!node)return '';
  const label=node.closest('label');return compact(label?.textContent?.replace(node.textContent||'','')||node.getAttribute('aria-label')||'');
 };
 const chooseSelect=(root,key)=>{
  if(key==='year')return root.querySelector('[data-ps27-year]')||[...root.querySelectorAll('select')].find(x=>/\btahun\b/.test(labelFor(x)))||null;
  if(key==='program')return root.querySelector('[data-ps27-prog]')||[...root.querySelectorAll('select')].find(x=>/\bprogram\b/.test(labelFor(x))&&!/sumber|tujuan/.test(labelFor(x)))||null;
  if(key==='status')return root.querySelector('[data-ps27-status]')||[...root.querySelectorAll('select')].find(x=>/\bstatus\b/.test(labelFor(x)))||null;
  return null;
 };
 const searchInput=root=>root.querySelector('[data-ps27-query]')||[...root.querySelectorAll('input[type="search"]')].find(x=>!/modul sumber|proyek sumber/i.test(x.placeholder||''))||null;
 function panels(){
  const root=document.querySelector('#view')||document.querySelector('#app')||document.body;
  if(!root)return[];
  const x=new Set([...root.querySelectorAll('.ps27-filter')]);
  [...root.querySelectorAll('button,[role="button"]')].forEach(btn=>{
   const word=compact(btn.textContent).replace(/[▽▼⌄⌃]/g,'');
   if(!/\bfilter\b/.test(word)||word.length>35)return;
   let panel=btn.parentElement,walk=0;
   while(panel&&walk<4&&!/(filter|flt|fbar)/i.test(panel.className||'')){panel=panel.parentElement;walk++}
   if(panel&&panel!==root)x.add(panel);
  });
  [...root.querySelectorAll('[class*="filter"],[class*="Filter"],[class*="flt"],[class*="Flt"]')].forEach(el=>{
   if(!el.parentElement||el.closest('.psbank-overlay')||el.matches('.mt-shared-filter'))return;
   const text=compact(el.textContent);
   if(!text.includes('filter aktif')&&!/^filter\b/.test(text))return;
   const rect=el.getBoundingClientRect?.();
   if(rect&&rect.width>300&&rect.height>=32&&rect.height<=125)x.add(el);
  });
  const candidates=[...x].filter(el=>!el.closest('.psbank-overlay')&&!el.matches('.mt-shared-filter'));
  return candidates.filter(el=>!candidates.some(parent=>parent!==el&&parent.contains(el)));

 }
 function capture(){
  const f=saved(),root=document.querySelector('#view');if(!root)return;
  const yearEl=chooseSelect(root,'year'),prog=chooseSelect(root,'program'),stat=chooseSelect(root,'status'),search=searchInput(root);
  if(yearEl)f.year=yearEl.value&&yearEl.value!=='all'?yearEl.value:String(S.ui.tahun||'');
  else if(!f.year)f.year=String(S.ui.tahun||'');
  if(prog)f.programName=prog.selectedOptions?.[0]&&prog.value?String(prog.selectedOptions[0].textContent||'').trim():'';
  if(stat)f.status=stat.value&&stat.value!=='all'?stat.value:'';
  if(search)f.search=search.value||'';
 }
 let applying=false;
 function apply(){
  const f=saved(),root=document.querySelector('#view');if(!f.enabled||!root||applying)return;
  const targets=[['year',f.year],['program',f.programName],['status',f.status]];
  for(const [kind,desired] of targets){
   if(!desired&&kind==='year')continue;
   const select=chooseSelect(root,kind);if(!select)continue;
   const option=[...select.options].find(o=>!desired?(!o.value||/semua/i.test(o.textContent)):kind==='program'?
    compact(o.textContent)===compact(desired)||compact(o.textContent).includes(compact(desired))||compact(desired).includes(compact(o.textContent))&&o.value:
    String(o.value)===String(desired)||compact(o.textContent)===compact(desired));
   if(!option||select.value===option.value)continue;
   applying=true;select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));applying=false;return;
  }
  const inp=searchInput(root);
  if(inp&&f.search!=null&&inp.value!==f.search){
   applying=true;inp.value=f.search;inp.dispatchEvent(new Event('input',{bubbles:true}));applying=false;
  }
 }
 function inject(){
  const f=saved();
  panels().forEach(panel=>{
   if(panel.querySelector('.mt-shared-filter'))return;
   const label=document.createElement('label');label.className='mt-shared-filter';
   const input=document.createElement('input');input.type='checkbox';input.className='mt-shared-filter-check';input.checked=!!f.enabled;
   input.setAttribute('aria-label','Terapkan filter di semua menu');
   const span=document.createElement('span');span.textContent='Terapkan di semua menu';
   label.appendChild(input);label.appendChild(span);panel.appendChild(label);
  });
  document.querySelectorAll('.mt-shared-filter-check').forEach(x=>{x.checked=!!f.enabled});
 }
 document.addEventListener('change',event=>{
  const box=event.target.closest?.('.mt-shared-filter-check');
  if(box){const f=saved();f.enabled=box.checked;if(f.enabled)capture();save();inject();return}
  if(applying)return;
  if(saved().enabled&&event.target.closest?.('#view')&&event.target.matches?.('select,input[type="search"]')){capture();save()}
 },true);
 document.addEventListener('input',event=>{
  if(applying||!saved().enabled)return;
  if(event.target.closest?.('#view')&&event.target.matches?.('input[type="search"]')){capture()}
 },true);
 let running=false;
 function update(){if(running)return;running=true;try{inject();apply()}finally{running=false}}
 const begin=()=>{const root=document.querySelector('#view')||document.body;if(!root)return;
  const observer=new MutationObserver(()=>update());observer.observe(root,{childList:true,subtree:true});update();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',begin,{once:true});else begin();
})();

A.page=page;A.mount=mount;A.version='20261108-project-selection-ui-v6';
window.MT_PS_BANK_CORE={records,bank,detail,usulan,addOne,bulk,openCarry,codeFor,showPreview,current,openWorkspace,version:A.version};
if(typeof VIEW!=='undefined'&&VIEW==='project-selection'&&ME)render();
})();