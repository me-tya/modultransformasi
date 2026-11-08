/* Pemetaan proyek lintas-program dan lintas-tahun. Tahun sumber tidak dimutasi. */
(function(){
'use strict';
const B=window.MT_PROJECT_SELECTION,I=B?.internals;if(!B||!I)return;
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const C=x=>JSON.parse(JSON.stringify(x)),year=()=>+S.ui.tahun||2026;
const uid=t=>(t||'proj')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const can=p=>!!ME&&['SA','PMOK','PMOU'].includes(ME.role)&&(!p||ME.role!=='PMOU'||!p.uic||p.uic===ME.unit)&&(!p||p.psStatus!=='Ditetapkan');
const bank=()=>{S.ui.psBank=S.ui.psBank||{};const b=S.ui.psBank;b.map=b.map||{year:2026,program:'',q:'',selected:[]};return b};
const get=id=>(S.programs||[]).find(p=>String(p.id)===String(id));
const sourceWbs=(p,y)=>(S.wbs||[]).filter(w=>w.prog===p.akr&&!w.arsip&&+(String(w.f||w.s||'').slice(0,4))===+y);
function modules(p,y){
 if(!p)return[];
 const dict=new Map();
 (p.psProjects||[]).forEach(x=>{const name=String(x.name||'').trim();if(name)dict.set(name.toLowerCase(),{name,uic:x.uic||p.uic,original:x,rows:[]})});
 sourceWbs(p,y).forEach(w=>{
  const path=w.p||[],core=p.akr==='CORE'||/core system apbn/i.test(p.nama||'');
  let name=core&&/pengembangan integrated core system/i.test(path[2]||'')?(path[3]||path[4]):(path[2]||path[1]||path[3]);
  const all=path.join(' / '),special=all.match(/\b(FRSW|SIPK)\b/i);
  if(special&&!new RegExp('\\b'+special[1]+'\\b','i').test(String(name||'')))name=special[1].toUpperCase();
  name=String(name||'(tanpa nama modul)').trim();const key=name.toLowerCase();
  const x=dict.get(key)||{name,uic:String(w.u||p.uic||'').split(/[,(]/)[0].trim(),original:null,rows:[]};
  x.rows.push(w);dict.set(key,x);
 });
 return [...dict.values()].sort((a,b)=>a.name.localeCompare(b.name,'id'));
}
function eligible(p,y){if(p.psYear)return +p.psYear===+y;const match=String(p.periode||'').match(/20\d{2}/g)||[];const from=+p.mulai||+(match[0]||0),to=+(match[match.length-1]||from);return from&&from<=y&&to>=y}
function sourceList(y,target){return (S.programs||[]).filter(p=>p.id!==target.id&&eligible(p,y))}
function shift(v,from,to){return typeof v==='string'&&new RegExp('^'+from+'-\\d{2}-\\d{2}').test(v)?String(to)+v.slice(4):v}
function target(){
 const id=bank().target;const p=get(id);
 return p&&+p.psYear===year()?p:I.pickedProgram();
}
function mapState(){
 const b=bank();b.mappingTab=b.mappingTab||'mapping';b.targetSelected=b.targetSelected||[];return b;
}
function proposalRows(p){return p?.psProjects||[]}

const PROJECT_FIELDS=[
 ['name','Nama Aplikasi / Proyek','text','Identitas Aplikasi'],
 ['applicationName','Nama Aplikasi','text','Identitas Aplikasi'],
 ['mainFunction','Fungsi Utama / Modul','text','Identitas Aplikasi'],
 ['subModule','Sub Modul','text','Identitas Aplikasi'],
 ['url','URL Aplikasi','url','Identitas Aplikasi'],
 ['category','Kategori','select','Identitas Aplikasi'],
 ['uic','UIC Utama','text','Identitas Aplikasi'],
 ['status','Status Usulan','status','Identitas Aplikasi'],
 ['batiiIdentification','Identifikasi Tim BaTii','textarea','Telaah & Validasi'],
 ['probisConfirmation','Konfirmasi Pemilik Proses Bisnis','textarea','Telaah & Validasi'],
 ['description','Deskripsi Aplikasi / Modul','textarea','Telaah & Validasi'],
 ['urgency','Urgensi','textarea','Telaah & Validasi'],
 ['legalBasis','Landasan Hukum / Regulasi','textarea','Keselarasan & Proses Bisnis'],
 ['strategyAlignment','Strategi Organisasi yang Didukung (Renstra Kementerian / UE I)','textarea','Keselarasan & Proses Bisnis'],
 ['businessProcess','Proses Bisnis Terkait (Level 3, 4, atau 5)','textarea','Keselarasan & Proses Bisnis'],
 ['businessNarrative','Penjelasan / Narasi Proses Bisnis Aplikasi','textarea','Keselarasan & Proses Bisnis'],
 ['features','Fitur Utama yang Akan Dikembangkan','textarea','Keselarasan & Proses Bisnis'],
 ['start','Rencana Mulai','date','Pelaksanaan Awal'],
 ['goLive','Target Go-Live','date','Pelaksanaan Awal']
];
const CAT=['APBN','Non APBN','Manajemen Birokrasi'];
function projectValue(x,key){
 if(key==='applicationName')return x.applicationName||x.name||'';
 if(key==='mainFunction')return x.mainFunction||x.outputs||'';
 if(key==='businessNarrative')return x.businessNarrative||x.outcome||'';
 if(key==='category')return x.category||'';
 return x[key]??'';
}
function iconButton(kind,action,id='',title=''){
 const paths={
  add:'<path d="M12 5v14M5 12h14"/>',
  view:'<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/>',
  edit:'<path d="M12 20h9"/><path d="M16.8 3.8a2.2 2.2 0 0 1 3.1 3.1L9 17.8l-4.5 1 1-4.5z"/>',
  delete:'<path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'
 };
 return '<button type="button" class="psbank-action-icon '+kind+'" data-scope-project-'+action+'="'+E(id)+'" title="'+E(title)+'" aria-label="'+E(title)+'"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[kind]||paths.view)+'</svg></button>';
}
function confirmDialog(title,description,onConfirm,mode='warning'){
 const d=document.createElement('div');d.className='psbank-confirm-backdrop';
 d.innerHTML='<section class="psbank-confirm-card" role="alertdialog" aria-modal="true" aria-label="'+E(title)+'" aria-describedby="psbank-confirm-desc">'+
 '<div class="psbank-confirm-symbol '+E(mode)+'"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01"/><path d="M10.3 3.4 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.4a2 2 0 0 0-3.4 0z"/></svg></div>'+
 '<h3>'+E(title)+'</h3><p id="psbank-confirm-desc">'+E(description)+'</p>'+
 '<footer><button type="button" class="psbank-confirm-cancel" data-confirm-cancel>Batal</button><button type="button" class="psbank-confirm-accept '+(mode==='danger'?'danger':'')+'" data-confirm-accept>'+ (mode==='danger'?'Ya, Hapus':'Ya, Lanjutkan')+'</button></footer></section>';
 document.body.appendChild(d);
 const prior=document.activeElement;d.querySelector('[data-confirm-cancel]').focus();
 const close=()=>{d.remove();prior?.focus?.()};
 d.addEventListener('click',ev=>{
  if(ev.target===d||ev.target.closest('[data-confirm-cancel]')){close();return}
  if(ev.target.closest('[data-confirm-accept]')){close();onConfirm()}
 });
 d.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();close()}});
 return d;
}
window.MT_PS_CONFIRM=window.MT_PS_CONFIRM||confirmDialog;

function mappingView(p){
 const b=mapState(),m=b.map,years=[2025,2026,2027,2028,2029].filter(y=>y<=year());
 const sources=sourceList(+m.year,p);
 if(!sources.some(x=>String(x.id)===String(m.program)))m.program=sources[0]?.id||'';
 const s=get(m.program),q=String(m.q||'').toLowerCase(),catalog=modules(s,+m.year).filter(x=>[x.name,x.uic,...x.rows.flatMap(w=>w.p||[])].join(' ').toLowerCase().includes(q));
 const arr=proposalRows(p),selected=arr.filter(x=>b.targetSelected.includes(String(x.id)));
 return '<div class="psbank-mapping-summary"><span>Program Tujuan: <b>'+E(p.nama)+'</b> · '+E(p.kode||p.akr)+'</span><span><b>'+arr.length+'</b> proyek terpetakan</span></div>'+
 '<div class="psbank-mapcols"><section class="psbank-mapbox"><div class="psbank-maphead"><h4>Proyek dalam '+E(p.nama)+'</h4><span>'+selected.length+' dipilih</span></div><p>Centang proyek untuk mengelola keanggotaan program. Rencana WBS dibuat kemudian pada tahap perencanaan proyek.</p>'+
 '<div class="psbank-mapselectall"><label><input type="checkbox" data-scope-target-all '+(arr.length&&selected.length===arr.length?'checked':'')+'> Pilih semua</label>'+
 '<span class="psbank-selected-hint">Pengelolaan proyek ada di tab Hasil Pemetaan</span></div>'+
 '<div class="psbank-mapitems">'+(arr.length?arr.map(x=>'<label class="psbank-catalogitem psbank-target-project"><input type="checkbox" data-scope-target-select="'+E(x.id)+'" '+(b.targetSelected.includes(String(x.id))?'checked':'')+'><span><b>'+E(x.name)+'</b><small>'+E(x.uic||p.uic||'—')+(x.psOriginYear?' · Sumber '+x.psOriginYear:' · Usulan baru')+'</small></span></label>').join(''):'<div class="psbank-empty">Belum ada proyek. Pilih dari program sumber di sebelah kanan.</div>')+'</div></section>'+
 '<section class="psbank-mapbox"><h4>Ambil Proyek dari Program Lain</h4><p>Pilih modul sumber dan salin identitas proyek ke program tujuan tanpa menyalin WBS maupun realisasi.</p>'+
 '<div class="psbank-mapcontrols"><label>Tahun Sumber <select data-scope-year>'+years.map(y=>'<option value="'+y+'" '+(y===+m.year?'selected':'')+'>'+y+'</option>').join('')+'</select></label>'+
 '<label>Program Sumber <select data-scope-program>'+sources.map(x=>'<option value="'+E(x.id)+'" '+(x.id===m.program?'selected':'')+'>'+E(x.nama)+'</option>').join('')+'</select></label></div>'+
 '<label class="psbank-searchlabel">Cari Modul <input type="search" data-scope-search value="'+E(m.q||'')+'" placeholder="FRSW, SIPK, nama proyek..."></label>'+
 '<div class="psbank-mapitems psbank-catalog">'+(catalog.length?catalog.map(x=>{const id=m.program+'::'+x.name;return '<label class="psbank-catalogitem"><input type="checkbox" data-scope-select="'+E(id)+'" '+(m.selected.includes(id)?'checked':'')+'><span><b>'+E(x.name)+'</b><small>'+E(x.uic||'—')+' · Program '+E(s?.nama||'—')+'</small></span></label>'}).join(''):'<div class="psbank-empty">Modul tidak ditemukan. Ubah tahun, program sumber, atau pencarian.</div>')+'</div>'+
 '<div class="psbank-mapfoot"><span>'+m.selected.length+' dipilih</span><button class="btn pri" data-scope-transfer '+(!can(p)||!m.selected.length?'disabled':'')+'>+ Masukkan ke Program Tujuan</button></div></section></div>'+
 '<div class="psbank-note">Proyek yang dipetakan akan tampil pada tab Usulan Proyek. Data sumber tetap utuh; WBS baru disusun pada proses perencanaan proyek.</div>';
}

function proposalView(p){
 const rows=proposalRows(p);
 return '<div class="psbank-proposal-head"><div><h3>Usulan Proyek · '+E(p.nama)+'</h3><p>Klik baris untuk membuka Detail Usulan Proyek. Isian dapat diubah tanpa meninggalkan tabel.</p></div><span class="psbank-count">'+rows.length+' proyek</span></div>'+
 '<div class="psbank-tablewrap"><table class="psbank-table psbank-proposal-table"><thead><tr><th>No</th><th>Nama Aplikasi / Proyek</th><th>Fungsi Utama / Modul</th><th>UIC</th><th>Kategori</th><th>Status</th><th>Asal</th></tr></thead><tbody>'+
 (rows.length?rows.map((x,i)=>'<tr class="psbank-clickrow" data-scope-proposal-focus="'+E(x.id)+'" tabindex="0" role="button" aria-label="Lihat Detail Usulan Proyek '+E(x.name)+'" title="Buka Detail Usulan Proyek">'+
 '<td>'+(i+1)+'</td><td><b>'+E(x.applicationName||x.name)+'</b><small>'+E(x.name)+'</small></td><td>'+E(projectValue(x,'mainFunction')||'—')+'</td><td>'+E(x.uic||p.uic||'—')+'</td><td>'+E(x.category||'—')+'</td><td>'+E(x.status||'Usulan')+'</td><td>'+E(x.psOriginYear?x.psOriginProgram+' · '+x.psOriginYear:'Usulan baru')+'</td></tr>').join(''):
 '<tr><td colspan="7" class="psbank-empty">Belum ada usulan. Buka Pemetaan untuk memilih proyek atau tambahkan dari Hasil Pemetaan.</td></tr>')+'</tbody></table></div>';
}
function resultsView(p){
 const rows=proposalRows(p),projectCount=rows.length,eligible=can(p);
 return '<section class="psbank-workspace-program"><header class="psbank-workspace-banner"><div><small>PROGRAM · '+E(p.kode||p.akr)+' · '+year()+'</small><h3>'+E(p.nama)+'</h3><p>UIC Utama: '+E(p.uic||'BaTii')+'</p></div>'+
 '<div class="psbank-workspace-kpis"><span><b>'+projectCount+'</b> Proyek</span><span><b>'+rows.filter(x=>x.psOriginYear).length+'</b> Carry-over</span><span><b>'+rows.filter(x=>x.category).length+'</b> Berkategori</span></div></header>'+
 '<div class="psbank-workspace-subhead"><div><b>HASIL PEMETAAN · RINCIAN PROYEK / MODUL</b><small>Identitas, kategori, dan sumber proyek. Belum ada WBS tahun tujuan.</small></div>'+
 (eligible?iconButton('add','new','','Tambah Usulan Proyek'):'')+'</div>'+
 '<div class="psbank-tablewrap"><table class="psbank-table psbank-results-table"><thead><tr><th>Nama Aplikasi / Modul</th><th>UIC Utama</th><th>Kategori</th><th>Tahun & Program Sumber</th><th>Status</th><th>Aksi</th></tr></thead><tbody>'+
 (rows.length?rows.map(x=>'<tr><td><b>'+E(x.applicationName||x.name)+'</b><small>'+E(x.mainFunction||x.name)+'</small></td><td>'+E(x.uic||p.uic||'—')+'</td><td>'+E(x.category||'Belum dikategorikan')+'</td>'+
 '<td>'+E(x.psOriginYear?x.psOriginYear+' · '+x.psOriginProgram:'Usulan baru')+'</td><td><span class="psbank-tag">'+E(x.status||'Usulan')+'</span></td>'+
 '<td class="psbank-results-actions">'+iconButton('view','view',x.id,'Lihat Detail Proyek')+(eligible?iconButton('edit','edit',x.id,'Ubah Usulan Proyek')+iconButton('delete','remove',x.id,'Hapus Usulan Proyek'):'')+'</td></tr>').join(''):
 '<tr><td colspan="6" class="psbank-empty">Belum ada hasil pemetaan. Buka tab Pemetaan untuk mengambil proyek.</td></tr>')+
 '</tbody></table></div></section>';
}
function render(){
 const p=target();if(!p)return '<div class="psbank-card psbank-empty">Belum ada program tahun '+year()+'. Tambahkan dari Daftar Program terlebih dahulu.</div>';
 const b=mapState(),on=['mapping','proposal','results','docs'].includes(b.mappingTab)?b.mappingTab:'mapping';
 const tabs=[['mapping','Pemetaan'],['proposal','Usulan Proyek'],['results','Hasil Pemetaan'],['docs','Buat Dokumen Usulan Proyek']];
 return '<div class="psbank-card psbank-scope-stage"><div class="psbank-sectionhead"><div><h3>Pemetaan Proyek / Modul</h3><p>Tentukan ruang lingkup program, lengkapi detail usulan, tinjau hasil, lalu buat dokumen.</p></div></div>'+
 '<nav class="psbank-mapping-tabs" role="tablist" aria-label="Tahapan Pemetaan Proyek">'+tabs.map(x=>'<button type="button" role="tab" data-scope-tab="'+x[0]+'" aria-selected="'+(on===x[0])+'" class="'+(on===x[0]?'on':'')+'">'+x[1]+(x[0]==='results'?' <b>'+proposalRows(p).length+'</b>':'')+'</button>').join('')+'</nav>'+
 (on==='proposal'?proposalView(p):on==='results'?resultsView(p):on==='docs'?(window.MT_PS_DOC?.portfolioBuilder?.()||'<div class="psbank-empty">Generator dokumen belum tersedia.</div>'):mappingView(p))+'</div>';
}
function projectEditor(id,readonly=false){
 const p=target();if(!p||(!can(p)&&!readonly))return;
 const existing=(p.psProjects||[]).find(x=>String(x.id)===String(id));
 if(id&&!existing)return;
 const d=document.createElement('div');d.className='psbank-overlay psbank-project-editor';
 const groups=[...new Set(PROJECT_FIELDS.map(x=>x[3]))];
 const control=([key,label,type])=>type==='select'||type==='status'?
   '<label>'+E(label)+'<select data-scope-field="'+key+'" '+(readonly?'disabled':'')+'>'+((type==='status')?['Usulan','Berjalan','Ditunda','Selesai']:['',...CAT]).map(x=>'<option value="'+E(x)+'" '+(x===projectValue(existing||{},key)?'selected':'')+'>'+E(x||'Pilih kategori')+'</option>').join('')+'</select></label>':
   '<label class="'+(type==='textarea'?'psbank-editor-long':'')+'">'+E(label)+(key==='name'?' *':'')+
   (type==='textarea'?'<textarea rows="3" data-scope-field="'+key+'" '+(readonly?'disabled':'')+'>'+E(projectValue(existing||{},key))+'</textarea>':
    '<input type="'+type+'" data-scope-field="'+key+'" value="'+E(projectValue(existing||{},key))+'" '+(readonly?'disabled':'')+'>')+'</label>';
 d.innerHTML='<section class="psbank-dialog psbank-project-dialog" role="dialog" aria-modal="true" aria-label="Detail Usulan Proyek">'+
 '<header><div><b>'+(readonly?'Detail':existing?'Ubah':'Tambah')+' Usulan Proyek</b><small>'+E(p.nama)+' · '+year()+'</small></div><button type="button" data-scope-editor-close title="Tutup" aria-label="Tutup">✕</button></header>'+
 '<main class="psbank-dialogbody"><div class="psbank-form-provenance"><b>Sumber Usulan</b><span>'+E(existing?.psOriginYear?existing.psOriginProgram+' · '+existing.psOriginYear:'Usulan baru')+'</span><small>Perubahan isian tahun tujuan tidak mengubah informasi tahun sumber.</small></div>'+
 groups.map(g=>'<section class="psbank-form-section"><h3>'+E(g)+'</h3><div class="psbank-proj-editor-grid">'+PROJECT_FIELDS.filter(x=>x[3]===g).map(control).join('')+'</div></section>').join('')+
 '</main><footer><span>Form usulan aplikasi/modul · WBS disusun kemudian.</span><div><button type="button" class="btn" data-scope-editor-close>Tutup</button>'+
 (!readonly?'<button type="button" class="btn pri" data-scope-editor-save>Simpan</button>':can(p)?'<button type="button" class="btn pri" data-scope-editor-edit>✎ Ubah</button>':'')+'</div></footer></section>';
 (document.querySelector('#app')||document.body).appendChild(d);
 d.addEventListener('click',ev=>{
  if(ev.target===d||ev.target.closest('[data-scope-editor-close]')){d.remove();return}
  if(ev.target.closest('[data-scope-editor-edit]')){d.remove();projectEditor(id,false);return}
  if(!ev.target.closest('[data-scope-editor-save]'))return;
  const fields={};d.querySelectorAll('[data-scope-field]').forEach(x=>fields[x.dataset.scopeField]=x.value.trim());
  if(!fields.name){toast('Nama aplikasi/proyek wajib diisi.');return}
  if(fields.url&& !/^https?:\/\//i.test(fields.url)){toast('URL wajib dimulai https:// atau http://.');return}
  if((p.psProjects||[]).some(x=>x!==existing&&x.name?.toLowerCase()===fields.name.toLowerCase())){toast('Nama proyek sudah ada pada program tersebut.');return}
  if(existing)Object.assign(existing,fields);else {p.psProjects=p.psProjects||[];p.psProjects.push({id:uid('proj'),included:true,scores:{},poster:{},risks:{},psOriginYear:null,...fields})}
  mapState().proposalFocus=existing?.id||p.psProjects[p.psProjects.length-1].id;
  p.psUpdatedAt=new Date().toISOString();save();d.remove();window.render();toast('Detail usulan proyek berhasil disimpan.');
 });
}

function remove(id){
 const p=target(),x=p?.psProjects?.find(z=>String(z.id)===String(id));if(!p||!x||!can(p))return;
 confirmDialog('Hapus Usulan Proyek?','Proyek "'+x.name+'" akan dikeluarkan dari program '+p.nama+'. Dokumen tahun sumber tidak berubah.',()=>{
  p.psProjects=p.psProjects.filter(z=>z!==x);
  const b=mapState();b.targetSelected=b.targetSelected.filter(z=>z!==String(id));
  save();window.render();toast('Proyek telah dikeluarkan dari daftar usulan.');
 },'danger');
}
function transfer(){
 const p=target(),m=bank().map,s=get(m.program);if(!p||!s||!can(p))return;
 const selected=new Set(m.selected),items=modules(s,+m.year).filter(x=>selected.has(s.id+'::'+x.name));
 if(!items.length){toast('Pilih minimal satu modul pada program sumber.');return}
 const others=I.programs().filter(q=>q.id!==p.id),dupes=[];
 items.forEach(item=>others.forEach(other=>{
  const rows=(other.psProjects||[]).filter(x=>String(x.name||'').toLowerCase()===item.name.toLowerCase()&&(x.psOriginAkr===s.akr||x.psOriginAkr===s.psCarry?.sourceAkr||other.psCarry?.sourceAkr===s.akr));
  if(rows.length)dupes.push({other,rows});
 }));
 if(dupes.some(x=>x.other.psStatus==='Ditetapkan')){toast('Modul sudah berada pada program yang ditetapkan. Gunakan revisi/Change Request.');return}
 if(dupes.length){confirmDialog('Pindahkan Proyek ke Program Tujuan?','Sebagian proyek sudah berada di program lain pada tahun '+year()+'. Proyek akan dipindahkan ke '+p.nama+' tanpa mengubah sumber historis.',()=>completeTransfer());return;}
 completeTransfer();
 function completeTransfer(){let n=0;
 items.forEach(item=>{
  others.forEach(other=>{
   const rows=(other.psProjects||[]).filter(x=>String(x.name||'').toLowerCase()===item.name.toLowerCase()&&(x.psOriginAkr===s.akr||x.psOriginAkr===s.psCarry?.sourceAkr||other.psCarry?.sourceAkr===s.akr));
   if(!rows.length)return;
   other.psProjects=other.psProjects.filter(x=>!rows.includes(x));
   other.psNeedsWbsReview=true; // preserve pre-existing draft WBS for explicit PM review
  });
  if((p.psProjects||[]).some(x=>String(x.name).toLowerCase()===item.name.toLowerCase()))return;
  const orig=C(item.original||{});
  const z={...orig,psSourceProjectSnapshot:item.original?C(item.original):null,id:uid('proj'),name:item.name,uic:item.uic||s.uic||p.uic,status:'Usulan',included:true,scores:{},poster:{},risks:{},indicators:[],benefits:[],psOriginAkr:s.akr,psOriginProgram:s.nama,psOriginYear:m.year};
  z.start=shift(z.start,+m.year,year());z.goLive=shift(z.goLive,+m.year,year());
  p.psProjects=p.psProjects||[];p.psProjects.push(z);n++;
  /* Proposal only: do not copy historical WBS or actuals. WBS will be drafted afresh in PM. */
 });
 m.selected=[];bank().mappingTab='results';p.psUpdatedAt=new Date().toISOString();save();window.render();
 toast(n+' proyek berhasil dipetakan. Lengkapi usulan pada tab Usulan Proyek; WBS disusun kemudian.');
 }
}
function click(ev){
 const focus=ev.target.closest('[data-scope-proposal-focus]');if(focus){projectEditor(focus.dataset.scopeProposalFocus,true);return true}
 const tab=ev.target.closest('[data-scope-tab]');
 if(tab){mapState().mappingTab=tab.dataset.scopeTab;save();window.render();return true}
 const rm=ev.target.closest('[data-scope-project-remove],[data-scope-remove]');if(rm){remove(rm.dataset.scopeProjectRemove||rm.dataset.scopeRemove);return true}
 if(ev.target.closest('[data-scope-transfer]')){transfer();return true}
 const nw=ev.target.closest('[data-scope-project-new]');if(nw){projectEditor();return true}
 const view=ev.target.closest('[data-scope-project-view]');if(view){projectEditor(view.dataset.scopeProjectView,true);return true}
 const edit=ev.target.closest('[data-scope-project-edit]');if(edit){projectEditor(edit.dataset.scopeProjectEdit,false);return true}
 return false;
}
function change(ev){
 const el=ev.target,m=bank().map,b=mapState();
 if(el.dataset.scopeYear!==undefined){m.year=+el.value;m.program='';m.selected=[];save();window.render();return true}
 if(el.dataset.scopeProgram!==undefined){m.program=el.value;m.selected=[];save();window.render();return true}
 if(el.dataset.scopeSelect!==undefined){const id=el.dataset.scopeSelect;m.selected=el.checked?[...new Set([...m.selected,id])]:m.selected.filter(x=>x!==id);save();window.render();return true}
 if(el.dataset.scopeTargetSelect!==undefined){const id=el.dataset.scopeTargetSelect;b.targetSelected=el.checked?[...new Set([...b.targetSelected,id])]:b.targetSelected.filter(x=>x!==id);save();window.render();return true}
 if(el.dataset.scopeTargetAll!==undefined){b.targetSelected=el.checked?proposalRows(target()).map(x=>String(x.id)):[];save();window.render();return true}
 return false;
}
window.MT_PS_SCOPE={modules,sourceWbs,render,transfer,click,change,bank,target,projectFields:PROJECT_FIELDS,projectValue,version:'20261108-scope-map-four-tab-v3'};
})();