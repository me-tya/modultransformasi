/* Pemetaan proyek lintas-program dan lintas-tahun. Tahun sumber tidak dimutasi. */
(function(){
'use strict';
const B=window.MT_PROJECT_SELECTION,I=B?.internals;if(!B||!I)return;
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const C=x=>JSON.parse(JSON.stringify(x)),year=()=>+S.ui.psSelectedYear||+S.ui.tahun||2026;
const uid=t=>(t||'proj')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const can=p=>!!ME&&['SA','PMOK','PMOU'].includes(ME.role)&&(!p||ME.role!=='PMOU'||!p.uic||p.uic===ME.unit)&&(!p||p.psStatus!=='Ditetapkan'&&!p.arsip&&p.psListStatus!=='Arsip');
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
 const b=bank();b.mappingTab=['results','mapping'].includes(b.mappingTab)?'proposal':(b.mappingTab||'history');b.targetSelected=b.targetSelected||[];b.historyYear=b.historyYear||'all';b.historySearch=b.historySearch||'';b.historySelected=b.historySelected||[];b.programOpen=b.programOpen||{};return b;
}
function proposalRows(p){return p?.psProjects||[]}
const acronym=v=>String(v||'').toUpperCase().normalize('NFKD').replace(/[^A-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,18);
function suggestedAcronym(name){
 const up=String(name||'').toUpperCase();
 const known=[['FRSW',/\bFRSW\b/],['MKER',/MEKANISME\s+KERJA/],['MKES',/MODUL\s+KESEHATAN/],['JFKN',/\bJFKN\b/]];
 const x=known.find(z=>z[1].test(up));if(x)return x[0];
 const words=up.replace(/[^A-Z0-9]+/g,' ').trim().split(/\s+/).filter(z=>z&&!['DAN','ATAU','UNTUK','PADA','DARI','DI','KE','SERTA','APLIKASI','MODUL','PROYEK','PENGEMBANGAN','SISTEM'].includes(z));
 return acronym(words.length===1?words[0].slice(0,7):words.slice(0,5).map(z=>z[0]).join(''))||'PROYEK';
}
function assignedAcronym(x){return acronym(x?.psAcronym||String(x?.psCode||'').split('-').slice(2).join('-')||suggestedAcronym(x?.name))}
function codeFor(p,x,suffix){return String(p.kode||p.akr||'PROGRAM').toUpperCase()+'-'+acronym(suffix||assignedAcronym(x))}
function uniqueCode(p,suffix,exclude){
 const used=new Set((p.psProjects||[]).filter(x=>x!==exclude).map(x=>codeFor(p,x)));
 const base=acronym(suffix)||'PROYEK';let out=base,i=2;
 while(used.has(codeFor(p,{psAcronym:out})))out=base+'-'+i++;
 return out;
}
function normalizeProjectCodes(p){
 if(!p)return;const seen=new Set();
 (p.psProjects||[]).forEach(x=>{
  const base=assignedAcronym(x)||'PROYEK';let suffix=base,i=2;
  while(seen.has(codeFor(p,x,suffix)))suffix=base+'-'+i++;
  x.psAcronym=suffix;x.psCode=codeFor(p,x,suffix);seen.add(x.psCode);
 });
}
const currentCode=(p,x)=>codeFor(p,x);


const PROJECT_FIELDS=[
 ['name','Nama Aplikasi / Proyek','text','Identitas Aplikasi'],
 ['psAcronym','Akronim Proyek (contoh FRSW, MKER, MKES, JFKN)','text','Identitas Aplikasi'],
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
const CAT=['Core APBN','Core Non APBN','Office Automation','APBN','Non APBN','Manajemen Birokrasi'];
function defaultProjectCategory(p){
 const tag=[p?.akr,p?.kode,p?.nama].join(' ').toUpperCase();
 if(/CORE\s+NON[-\s]?APBN|CORE NON APBN/.test(tag))return 'Core Non APBN';
 if(/\bICS\b|\bCORE\b|INTEGRATED CORE SYSTEM/.test(tag))return 'Core APBN';
 if(/\bDOA\b|\bOA\b|OFFICE AUTOMATION/.test(tag))return 'Office Automation';
 return '';
}
function projectCategory(p,x){
 const v=String(x?.category||'').trim(),def=defaultProjectCategory(p);
 if(!v)return def;
 if(def==='Core APBN'&&v==='APBN')return def;
 if(def==='Core Non APBN'&&v==='Non APBN')return def;
 if(def==='Office Automation'&&(v==='Manajemen Birokrasi'||v==='Non APBN'))return def;
 return v;
}
function projectValue(x,key){
 if(key==='psAcronym')return x.psAcronym||x.name&&assignedAcronym(x)||'';
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
function confirmDialog(title,description,onConfirm,mode='warning',details=[]){
 const d=document.createElement('div');d.className='psbank-confirm-backdrop';
 d.innerHTML='<section class="psbank-confirm-card" role="alertdialog" aria-modal="true" aria-label="'+E(title)+'" aria-describedby="psbank-confirm-desc">'+
 '<div class="psbank-confirm-symbol '+E(mode)+'"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01"/><path d="M10.3 3.4 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.4a2 2 0 0 0-3.4 0z"/></svg></div>'+
 '<h3>'+E(title)+'</h3><p id="psbank-confirm-desc">'+E(description)+'</p>'+
 (details.length?'<div class="psbank-confirm-transfer-list" aria-label="Daftar proyek yang akan dipindahkan"><div class="psbank-confirm-transfer-title">Proyek terdampak · '+details.length+' modul</div>'+details.map(x=>'<div class="psbank-confirm-transfer-row"><b>'+E(x.name)+'</b><span><strong>Dari</strong> '+E(x.from)+' <em>→</em> <strong>Ke</strong> '+E(x.to)+'</span></div>').join('')+'</div>':'')+
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
 '<span class="psbank-selected-hint">Substansi dan pengelolaan proyek ada di tab Usulan Proyek</span></div>'+
 '<div class="psbank-mapitems">'+(arr.length?arr.map(x=>'<label class="psbank-catalogitem psbank-target-project"><input type="checkbox" data-scope-target-select="'+E(x.id)+'" '+(b.targetSelected.includes(String(x.id))?'checked':'')+'><span><b>'+E(x.name)+'</b><small>'+E(x.uic||p.uic||'—')+(x.psOriginYear?' · Sumber '+x.psOriginYear:' · Usulan baru')+'</small></span></label>').join(''):'<div class="psbank-empty">Belum ada proyek. Pilih dari program sumber di sebelah kanan.</div>')+'</div></section>'+
 '<section class="psbank-mapbox"><h4>Ambil Proyek dari Program Lain</h4><p>Pilih modul sumber dan salin identitas proyek ke program tujuan tanpa menyalin WBS maupun realisasi.</p>'+
 '<div class="psbank-mapcontrols"><label>Tahun Sumber <select data-scope-year>'+years.map(y=>'<option value="'+y+'" '+(y===+m.year?'selected':'')+'>'+y+'</option>').join('')+'</select></label>'+
 '<label>Program Sumber <select data-scope-program>'+sources.map(x=>'<option value="'+E(x.id)+'" '+(x.id===m.program?'selected':'')+'>'+E(x.nama)+'</option>').join('')+'</select></label></div>'+
 '<label class="psbank-searchlabel">Cari Modul <input type="search" data-scope-search value="'+E(m.q||'')+'" placeholder="FRSW, SIPK, nama proyek..."></label>'+
 '<div class="psbank-mapitems psbank-catalog">'+(catalog.length?catalog.map(x=>{const id=m.program+'::'+x.name;return '<label class="psbank-catalogitem"><input type="checkbox" data-scope-select="'+E(id)+'" '+(m.selected.includes(id)?'checked':'')+'><span><b>'+E(x.name)+'</b><small>'+E(x.uic||'—')+' · Program '+E(s?.nama||'—')+'</small></span></label>'}).join(''):'<div class="psbank-empty">Modul tidak ditemukan. Ubah tahun, program sumber, atau pencarian.</div>')+'</div>'+
 '<div class="psbank-mapfoot"><span>'+m.selected.length+' dipilih</span><button class="btn pri" data-scope-transfer '+(!can(p)||!m.selected.length?'disabled':'')+'>+ Masukkan ke Program Tujuan</button></div></section></div>'+
 '<div class="psbank-note">Proyek yang dipetakan akan tampil pada tab Usulan Proyek. Data sumber tetap utuh; WBS baru disusun pada proses perencanaan proyek.</div>';
}

/* Usulan Proyek: satu tampilan lintas program, dengan accordion seperti Workspace Proyek.
   Riwayat Proyek tetap memakai historyView() lama, tanpa perubahan. */
function proposalView(){
 const filter=S.ui?.psBank?.filterScopes?.mapping||{},q=String(filter.search||'').toLowerCase();
 const programs=I.programs().filter(p=>{
  const content=[p.nama,p.kode,p.uic,p.akr,...proposalRows(p).map(x=>[x.name,x.applicationName,x.psCode,x.uic].join(' '))].join(' ').toLowerCase();
  return (!q||content.includes(q))&&
   (!filter.status||filter.status==='all'||(window.MT_PS_BANK_CORE?.programStatus?.(p,year())||(p.arsip?'Arsip':p.psCarry?'Legacy':'Baru'))===filter.status)&&
   (!filter.unit||filter.unit==='all'||[p.uic,p.pend].join(' ').toLowerCase().includes(String(filter.unit).toLowerCase()));
 });
 const total=programs.reduce((n,p)=>n+proposalRows(p).length,0),state=mapState();
 return '<section class="psbank-proposals-detail psbank-proposal-groups"><div class="psbank-proposal-head"><div><h3>Usulan Proyek · '+year()+'</h3><p>Proyek dikelompokkan menurut program induk. Buka atau tutup program untuk melihat daftar proyek, lalu gunakan ikon aksi untuk melihat dan melengkapi substansi.</p></div><div class="psbank-headright"><span class="psbank-count">'+programs.length+' program · '+total+' proyek</span></div></div>'+
 (programs.length?programs.map(p=>{
  const rows=proposalRows(p),expanded=state.programOpen[p.id]!==false,editable=can(p),code=p.kode||p.akr;
  const tr=rows.length?rows.map((x,i)=>'<tr tabindex="0" class="psbank-clickrow psbank-proposal-projectrow" data-scope-program-id="'+E(p.id)+'" data-scope-proposal-focus="'+E(x.id)+'" title="Buka detail proyek '+E(x.name)+'"><td><b>'+E(currentCode(p,x))+'</b></td><td><span class="psbank-tree-branch" aria-hidden="true">'+(i===rows.length-1?'└':'├')+'</span><b>'+E(x.applicationName||x.name)+'</b><small>'+E(projectValue(x,'mainFunction')||'—')+'</small></td><td>'+E(projectCategory(p,x)||'—')+'</td><td>'+E(x.uic||p.uic||'—')+'</td><td>'+E(x.goLive||'—')+'</td><td><span class="psbank-tag">'+E(x.status||'Usulan')+'</span></td><td class="psbank-results-actions">'+
   iconButton('view','view',x.id,'Lihat Substansi Proyek')+
   (editable?iconButton('edit','edit',x.id,'Ubah Substansi Proyek')+iconButton('delete','remove',x.id,'Hapus Usulan Proyek'):'')+
   '</td></tr>').join(''):'<tr><td colspan="7" class="psbank-empty">Belum ada usulan proyek pada program ini. Gunakan Tambah Usulan Proyek atau salin dari Riwayat Proyek.</td></tr>';
  return '<details class="psbank-accordion-program psbank-proposal-program" '+(expanded?'open':'')+'><summary data-scope-program-toggle="'+E(p.id)+'"><span class="psbank-chevron" aria-hidden="true">▸</span><span class="psbank-accordion-name"><b>'+E(p.nama)+'</b><small>'+E(code)+' · UIC Utama: '+E(p.uic||'—')+'</small></span><span class="psbank-accordion-count">'+rows.length+' proyek</span></summary>'+
   '<div class="psbank-accordion-body"><div class="psbank-proposal-programtools"><span>'+E(code)+' · '+rows.length+' proyek dalam program ini</span>'+(editable?'<button type="button" class="btn pri" data-scope-project-new data-scope-program-id="'+E(p.id)+'">+ Tambah Usulan Proyek</button>':'')+'</div>'+
   '<div class="psbank-tablewrap"><table class="psbank-table psbank-proposal-table"><thead><tr><th>Kode Proyek</th><th>Nama Proyek / Modul</th><th>Kategori</th><th>UIC Utama</th><th>Target Go-Live</th><th>Status</th><th>Aksi</th></tr></thead><tbody>'+tr+'</tbody></table></div></div></details>';
 }).join(''):'<div class="psbank-empty">Tidak ada program sesuai filter. Periksa tahun, status atau Unit Eselon I pada filter.</div>')+
 '</section>';
}
function resultsView(p){
 const f=S.ui?.psBank?.filterScopes?.mapping||{},query=String(f.search||'').toLowerCase();
 const programs=I.programs().filter(x=>(!query||[x.nama,x.kode,x.uic,x.akr,...proposalRows(x).map(z=>z.name)].join(' ').toLowerCase().includes(query))&&(!f.unit||f.unit==='all'||[x.uic,x.pend].join(' ').toLowerCase().includes(String(f.unit).toLowerCase())));
 const total=programs.reduce((n,x)=>n+proposalRows(x).length,0);
 return '<section class="psbank-results-open psbank-recap"><div class="psbank-all-intro"><b>Rekap Pemetaan · '+programs.length+' Program · '+total+' Proyek</b><p>Program sebagai induk; setiap proyek ditampilkan di bawahnya beserta kode, kategori, UIC, target go-live, dan status. Klik baris untuk detail; ubah substansi melalui tab Usulan Proyek.</p></div>'+programAccordion(programs,'results')+'</section>';
}
function historyRecords(){
 const y=year(),rows=[];
 (S.programs||[]).forEach(p=>{
  const years=p.psYear?[+p.psYear]:[...new Set([+p.mulai||2026,...(String(p.periode||'').match(/20\d{2}/g)||[]).map(Number),...(S.wbs||[]).filter(w=>w.prog===p.akr).map(w=>+(String(w.f||w.s||'').slice(0,4))||0)])];
  years.filter(n=>n>=2024&&n<=y).forEach(n=>modules(p,n).forEach(x=>{
   if(!x.name)return;
   rows.push({key:[p.id,n,encodeURIComponent(x.name)].join('::'),p,y:n,x});
  }));
 });
 return rows.sort((a,b)=>b.y-a.y||String(a.p.nama).localeCompare(String(b.p.nama),'id')||a.x.name.localeCompare(b.x.name,'id'));
}
function historyRows(p){
 const b=mapState(),q=String(b.historySearch||'').toLowerCase();
 return historyRecords().filter(r=>!(p&&r.p.id===p.id&&r.y===year())&&(b.historyYear==='all'||+b.historyYear===r.y)&&
  [r.x.name,r.p.nama,r.p.kode,r.x.uic,codeFor(r.p,r.x.original||{name:r.x.name})].join(' ').toLowerCase().includes(q));
}
function historyView(p){
 const b=mapState(),rows=historyRows(p),years=[...new Set(historyRecords().map(r=>r.y))],all=rows.length>0&&rows.every(r=>b.historySelected.includes(r.key));
 const plus='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
 return '<div class="psbank-history-projects"><div class="psbank-proposal-head"><div><h3>Riwayat Proyek</h3><p>Daftar referensi proyek lintas tahun. Klik baris untuk melihat detail; tombol + menyalin proyek ke usulan tahun tujuan tanpa mengubah WBS sumber.</p></div><div class="psbank-headright"><span class="psbank-count">'+rows.length+' proyek</span><span class="psbank-helpicon" tabindex="0" role="img" aria-label="Riwayat Proyek hanya referensi. Salin ke program tahun tujuan tanpa mengubah WBS dan realisasi historis." title="Riwayat Proyek hanya referensi. Salin ke program tahun tujuan tanpa mengubah WBS dan realisasi historis.">ⓘ</span></div></div>'+
 '<div class="psbank-history-project-controls"><label>Program Tujuan <select data-scope-history-target>'+I.programs().map(x=>'<option value="'+E(x.id)+'" '+(p?.id===x.id?'selected':'')+'>'+E(x.nama)+'</option>').join('')+'</select></label>'+
 '<label>Tahun Sumber <select data-scope-history-year><option value="all">Semua Tahun</option>'+years.sort((a,b)=>b-a).map(y=>'<option value="'+y+'" '+(String(b.historyYear)===String(y)?'selected':'')+'>'+y+'</option>').join('')+'</select></label>'+
 '<label>Cari <input type="search" data-scope-history-search value="'+E(b.historySearch||'')+'" placeholder="Nama, kode, akronim, UIC..."></label></div>'+
 '<div class="psbank-tablewrap psbank-project-history-wrap"><table class="psbank-table psbank-project-history-table"><colgroup><col class="pshist-check"><col class="pshist-year"><col class="pshist-code"><col class="pshist-name"><col class="pshist-program"><col class="pshist-uic"><col class="pshist-action"></colgroup><thead><tr><th><input type="checkbox" data-scope-history-all '+(all?'checked':'')+' aria-label="Pilih semua hasil filter"></th><th>Tahun</th><th>Kode Proyek</th><th>Nama Proyek / Modul</th><th>Program Sumber</th><th>UIC</th><th>Aksi</th></tr></thead><tbody>'+
 (rows.length?rows.map(r=>'<tr tabindex="0" class="psbank-clickrow pshist-clickrow" data-scope-history-detail="'+E(r.key)+'" title="Klik untuk melihat detail proyek '+E(r.x.name)+'" aria-label="Lihat detail proyek '+E(r.x.name)+'"><td class="psbank-checkcol"><input type="checkbox" data-scope-history-check="'+E(r.key)+'" '+(b.historySelected.includes(r.key)?'checked':'')+' aria-label="Pilih '+E(r.x.name)+'"></td><td class="pshist-year-cell">'+r.y+'</td><td><b>'+E(codeFor(r.p,r.x.original||{name:r.x.name}))+'</b></td><td class="pshist-name-cell"><b>'+E(r.x.name)+'</b></td><td>'+E(r.p.nama)+'</td><td>'+E(r.x.uic||r.p.uic||'—')+'</td><td class="psbank-rowactions"><button type="button" class="psbank-action-icon psbank-program-action add" data-scope-history-add="'+E(r.key)+'" title="Tambahkan Proyek ke Program Tujuan" aria-label="Tambahkan '+E(r.x.name)+' ke Program Tujuan" '+(!can(p)?'disabled':'')+'>'+plus+'</button></td></tr>').join(''):'<tr><td colspan="7" class="psbank-empty">Tidak ada proyek sesuai filter.</td></tr>')+'</tbody></table></div>'+
 '<div class="psbank-history-project-foot"><small>'+b.historySelected.length+' dipilih · kode proyek tujuan mengikuti program dan akronim yang dapat diedit.</small><button type="button" class="btn pri" data-scope-history-bulk '+(!can(p)||!b.historySelected.length?'disabled':'')+'>+ Tambahkan ke Program Tujuan</button></div></div>';
}
function historyDetail(key){
 const r=historyRecords().find(x=>x.key===key);if(!r)return;
 const x=r.x.original||{},wbs=r.x.rows||[],fullCode=codeFor(r.p,r.x.original||{name:r.x.name});
 const groups=[...new Set(PROJECT_FIELDS.map(f=>f[3]))];
 const val=(k)=>String(projectValue(x,k)??'').trim();
 const fieldRows=groups.map(g=>{
  const fields=PROJECT_FIELDS.filter(f=>f[3]===g&&val(f[0]));
  if(!fields.length)return '';
  return '<section class="psbank-form-section"><h3>'+E(g)+'</h3><div class="pshist-fields">'+fields.map(([k,label])=>'<div><small>'+E(label)+'</small><strong>'+E(val(k))+'</strong></div>').join('')+'</div></section>';
 }).join('');
 const viewWbs=wbs.slice(0,20).map((w,i)=>'<li><span>'+(i+1)+'.</span><b>'+E((Array.isArray(w.p)?w.p.filter(Boolean).slice(-2).join(' / '):'')||'Item WBS')+'</b><small>'+E(String(w.f||w.s||'').slice(0,10)||'—')+'</small></li>').join('');
 const d=document.createElement('div');d.className='psbank-overlay psbank-project-editor psbank-history-detail';
 d.innerHTML='<section class="psbank-dialog psbank-project-dialog" role="dialog" aria-modal="true" aria-label="Detail Proyek Historis">'+
 '<header><div><b>Detail Proyek · '+E(r.x.name)+'</b><small>'+E(r.p.nama)+' · Tahun '+r.y+'</small></div><button type="button" data-pshist-close title="Tutup" aria-label="Tutup">✕</button></header>'+
 '<main class="psbank-dialogbody"><div class="psbank-form-provenance"><b>Arsip sumber · hanya baca</b><span>Informasi berasal dari tahun '+r.y+'</span><small>Membuka detail tidak menyalin atau mengubah data proyek.</small></div>'+
 '<div class="pshist-summary"><div><small>Kode Proyek</small><strong>'+E(fullCode)+'</strong></div><div><small>UIC Utama</small><strong>'+E(r.x.uic||r.p.uic||'—')+'</strong></div><div><small>Status</small><strong>'+E(x.status||'Referensi historis')+'</strong></div><div><small>Item WBS Tahun '+r.y+'</small><strong>'+wbs.length+'</strong></div></div>'+
 (fieldRows||'<div class="psbank-form-section">Detail isian proyek belum tersedia; proyek tercatat dari struktur WBS.</div>')+
 '<section class="psbank-form-section"><h3>WBS Historis · '+r.y+'</h3>'+(wbs.length?'<ol class="pshist-wbs">'+viewWbs+'</ol>'+(wbs.length>20?'<small>Menampilkan 20 dari '+wbs.length+' item WBS.</small>':''):'<p class="pshist-none">Tidak ada item WBS yang tercatat pada tahun ini.</p>')+'</section></main>'+
 '<footer><span>Arsip sumber tidak dapat diubah dari Riwayat Proyek.</span><div><button type="button" class="btn" data-pshist-close>Tutup</button></div></footer></section>';
 (document.querySelector('#app')||document.body).appendChild(d);
 const close=()=>{d.remove();return true};d.querySelector('[data-pshist-close]')?.focus();
 d.addEventListener('click',ev=>{if(ev.target===d||ev.target.closest('[data-pshist-close]'))close()});
 d.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();close()}});
}
function addHistory(keys){
 const p=target();if(!can(p)||!p){toast('Pilih program tujuan yang dapat diubah.');return}
 const catalog=new Map(historyRecords().map(x=>[x.key,x]));
 let added=0,skipped=0;
 [...new Set(keys)].forEach(key=>{
  const r=catalog.get(key);if(!r||r.p.id===p.id&&r.y===year())return;
  if((p.psProjects||[]).some(x=>String(x.name||'').toLowerCase()===r.x.name.toLowerCase())){skipped++;return}
  const original=C(r.x.original||{}),z={...original,id:uid('proj'),name:r.x.name,uic:r.x.uic||r.p.uic||p.uic,
   psSourceProjectSnapshot:r.x.original?C(r.x.original):null,psOriginAkr:r.p.akr,psOriginProgram:r.p.nama,
   psOriginYear:r.y,psOriginCode:codeFor(r.p,r.x.original||{name:r.x.name}),
   status:'Usulan',included:true,scores:{},poster:{},risks:{},indicators:[],benefits:[]};
  z.category=projectCategory(p,z);
  z.psAcronym=uniqueCode(p,assignedAcronym(r.x.original||{name:r.x.name}));z.psCode=codeFor(p,z,z.psAcronym);
  z.start=shift(z.start,r.y,year());z.goLive=shift(z.goLive,r.y,year());
  p.psProjects=p.psProjects||[];p.psProjects.push(z);added++;
 });
 if(!added){toast('Tidak ada proyek baru yang ditambahkan. Periksa duplikasi nama.');return}
 normalizeProjectCodes(p);const b=mapState();b.historySelected=b.historySelected.filter(k=>!keys.includes(k));b.mappingTab='proposal';
 p.psUpdatedAt=new Date().toISOString();save();window.render();
 toast(added+' proyek ditambahkan'+(skipped?' ('+skipped+' duplikat dilewati)':'')+'. Kode telah mengikuti program tujuan.');
}
function tabsSummary(rows){
 return '<div class="psbank-tab-summary" aria-label="Ringkasan Rekap Program & Proyek"><span><b>'+rows.length+'</b> Proyek</span><span><b>'+rows.filter(x=>x.psOriginYear).length+'</b> Carry-over</span><span><b>'+rows.filter(x=>x.category).length+'</b> Berkategori</span></div>';
}
function programAccordion(programs,on){
 const state=mapState();
 return '<div class="psbank-all-programs psbank-program-accordion psbank-program-recap">'+programs.map(p=>{
  const rows=proposalRows(p),expanded=state.programOpen[p.id]!==false;
  const head='<summary data-scope-program-toggle="'+E(p.id)+'"><span class="psbank-chevron" aria-hidden="true">▸</span><span class="psbank-accordion-name"><b>'+E(p.nama)+'</b><small>'+E(p.kode||p.akr)+' · UIC: '+E(p.uic||'—')+'</small></span><span class="psbank-accordion-count">'+rows.length+' proyek</span></summary>';
  const treeBody='<div class="psbank-accordion-body psbank-recap-children"><div class="psbank-tablewrap"><table class="psbank-table psbank-recap-table"><thead><tr><th>Kode Proyek</th><th>Nama Proyek / Modul</th><th>Kategori</th><th>UIC</th><th>Target Go-Live</th><th>Status</th><th>Detail</th></tr></thead><tbody>'+
   (rows.length?rows.map((x,i)=>'<tr tabindex="0" class="psbank-clickrow psbank-recap-projectrow" data-scope-aggregate-view="'+E(p.id)+'::'+E(x.id)+'" title="Lihat detail '+E(x.name)+'"><td><b>'+E(currentCode(p,x))+'</b></td><td><span class="psbank-tree-branch" aria-hidden="true">'+(i===rows.length-1?'└':'├')+'</span><strong>'+E(x.applicationName||x.name)+'</strong><small>'+E(x.mainFunction||'')+'</small></td><td><span class="psbank-tag">'+E(projectCategory(p,x)||'—')+'</span></td><td>'+E(x.uic||p.uic||'—')+'</td><td>'+E(x.goLive||'—')+'</td><td>'+E(x.status||'Usulan')+'</td><td>'+iconButton('view','view',x.id,'Lihat Detail Proyek')+'</td></tr>').join(''):'<tr><td colspan="7" class="psbank-empty">Belum ada proyek dalam program ini.</td></tr>')+'</tbody></table></div></div>';
  const otherBody='<div class="psbank-accordion-body"><div class="psbank-accordion-projects">'+(rows.length?rows.map(x=>'<div><b>'+E(x.name)+'</b><small>'+E(currentCode(p,x))+' · '+E(x.uic||p.uic||'—')+'</small></div>').join(''):'<p>Belum ada proyek di program ini.</p>')+'</div><div class="psbank-accordion-actions"><button type="button" class="btn btn-outline" data-scope-choose="'+E(p.id)+'">Buka Program</button></div></div>';
  return '<details class="psbank-accordion-program" '+(expanded?'open':'')+'>'+head+(on==='results'?treeBody:otherBody)+'</details>';
 }).join('')+'</div>';
}
const MAPPING_TABS=[['history','Riwayat Proyek','Referensi proyek lintas tahun; salin ke program tujuan tanpa menyalin WBS atau realisasi historis.'],['proposal','Usulan Proyek','Seluruh usulan proyek disusun per program induk dalam accordion, dengan aksi lihat, ubah, tambah, dan hapus.'],['docs','Buat Dokumen Proyek','Pilih proyek dan substansi untuk menyusun dokumen proyek; dokumen bukan bukti penetapan.']];
function scopeTabs(on,rows){
 return '<div class="psbank-scope-tabline"><nav class="psbank-mapping-tabs" role="tablist" aria-label="Tahapan Pemetaan Proyek">'+
 MAPPING_TABS.map(x=>'<button type="button" role="tab" data-scope-tab="'+x[0]+'" title="'+E(x[2])+'" aria-label="'+E(x[1]+'. '+x[2])+'" aria-selected="'+(on===x[0])+'" class="'+(on===x[0]?'on':'')+'">'+x[1]+'</button>').join('')+
 '</nav></div>';
}
function aggregateView(){
 const b=mapState(),on=MAPPING_TABS.some(x=>x[0]===b.mappingTab)?b.mappingTab:'history',y=year();
 const f=S.ui?.psBank?.filterScopes?.mapping||{},query=String(f.search||'').toLowerCase();
 const programs=I.programs().filter(p=>(!query||[p.nama,p.kode,p.uic,p.akr].join(' ').toLowerCase().includes(query))&&
 (!f.status||f.status==='all'||(window.MT_PS_BANK_CORE?.programStatus?.(p,year())||(p.arsip?'Arsip':p.psCarry?'Legacy':'Baru'))===f.status)&&
 (!f.unit||f.unit==='all'||[p.uic,p.pend].join(' ').toLowerCase().includes(String(f.unit).toLowerCase())));
 const rows=programs.flatMap(p=>proposalRows(p));
 let content='';
 if(on==='history')content=historyView(target());
 else if(on==='docs')content=window.MT_PS_DOC?.portfolioBuilder?.()||'<div class="psbank-empty">Generator dokumen belum tersedia.</div>';
 else content=proposalView();
 return '<div class="psbank-card psbank-scope-stage"><div class="psbank-sectionhead"><div><h3>Pemetaan Proyek / Modul</h3><p>Ringkasan semua program tahun '+y+'. Buka accordion untuk melihat proyek atau membuka program.</p></div></div>'+
 scopeTabs(on,rows)+content+'</div>';
}
function ensureProjectCodes(){
 if(year()<2027)return;
 let changed=false;
 I.programs().forEach(p=>{
  const projects=p.psProjects||[];
  const before=projects.map(x=>[x.psAcronym,x.psCode,x.category].join('|')).join(';');
  normalizeProjectCodes(p);
  projects.forEach(x=>{const cat=projectCategory(p,x);if(cat&&cat!==x.category)x.category=cat;});
  const after=projects.map(x=>[x.psAcronym,x.psCode,x.category].join('|')).join(';');
  if(before!==after)changed=true;
 });
 if(changed)save();
}
function render(){
 ensureProjectCodes();
 if(!!S.ui?.psBank?.filterScopes?.mapping?.allProgramsSelected)return aggregateView();
 const p=target();
 if(!p)return '<div class="psbank-card psbank-empty">Belum ada program tahun '+year()+'. Tambahkan dari Riwayat Program atau Usulan Program terlebih dahulu.</div>';
 const b=mapState(),on=MAPPING_TABS.some(x=>x[0]===b.mappingTab)?b.mappingTab:'history';
 return '<div class="psbank-card psbank-scope-stage"><div class="psbank-sectionhead"><div><h3>Pemetaan Proyek / Modul</h3><p>Tentukan ruang lingkup program, lengkapi detail usulan, tinjau hasil, lalu buat dokumen.</p></div></div>'+
 scopeTabs(on,proposalRows(p))+
 (on==='history'?historyView(p):on==='proposal'?proposalView():on==='docs'?(window.MT_PS_DOC?.portfolioBuilder?.()||'<div class="psbank-empty">Generator dokumen belum tersedia.</div>'):mappingView(p))+'</div>';
}
function projectEditor(id,readonly=false){
 const p=target();if(!p||(!can(p)&&!readonly))return;
 const existing=(p.psProjects||[]).find(x=>String(x.id)===String(id));
 if(id&&!existing)return;
 const d=document.createElement('div');d.className='psbank-overlay psbank-project-editor';
 const groups=[...new Set(PROJECT_FIELDS.map(x=>x[3]))];
 const control=([key,label,type])=>type==='select'||type==='status'?
   '<label>'+E(label)+'<select data-scope-field="'+key+'" '+(readonly?'disabled':'')+'>'+((type==='status')?['Usulan','Berjalan','Ditunda','Selesai']:['',...CAT]).map(x=>'<option value="'+E(x)+'" '+(x===(key==='category'?projectCategory(p,existing):projectValue(existing||{},key))?'selected':'')+'>'+E(x||'Pilih kategori')+'</option>').join('')+'</select>'+(key==='category'?'<small class="psbank-category-hint">Kategori awal mengikuti program. Core Non APBN digunakan untuk sektor keuangan; kategori dapat diubah.</small>':'')+'</label>':
   '<label class="'+(type==='textarea'?'psbank-editor-long':'')+'">'+E(label)+(key==='name'?' *':'')+
   (type==='textarea'?'<textarea rows="3" data-scope-field="'+key+'" '+(readonly?'disabled':'')+'>'+E(projectValue(existing||{},key))+'</textarea>':
    '<input type="'+type+'" data-scope-field="'+key+'" value="'+E(projectValue(existing||{},key))+'" '+(readonly?'disabled':'')+'>')+'</label>';
 d.innerHTML='<section class="psbank-dialog psbank-project-dialog" role="dialog" aria-modal="true" aria-label="Detail Usulan Proyek">'+
 '<header><div><b>'+(readonly?'Detail':existing?'Ubah':'Tambah')+' Usulan Proyek</b><small>'+E(p.nama)+' · '+year()+'</small></div><button type="button" data-scope-editor-close title="Tutup" aria-label="Tutup">✕</button></header>'+
 '<main class="psbank-dialogbody"><div class="psbank-form-provenance"><b>Sumber Usulan</b><span>'+E(existing?.psOriginYear?existing.psOriginProgram+' · '+existing.psOriginYear:'Usulan baru')+'</span><small>Perubahan isian tahun tujuan tidak mengubah informasi tahun sumber.</small></div>'+
 '<div class="psbank-project-code-preview"><span>Kode Proyek</span><strong data-scope-code-preview>'+E(existing?currentCode(p,existing):String(p.kode||p.akr)+'-…')+'</strong><small>Awalan mengikuti kode program; akronim diisi pada bagian Identitas Aplikasi/Proyek.</small></div>'+
 groups.map(g=>'<section class="psbank-form-section"><h3>'+E(g)+'</h3><div class="psbank-proj-editor-grid">'+PROJECT_FIELDS.filter(x=>x[3]===g).map(control).join('')+'</div></section>').join('')+
 '</main><footer><span>Form usulan aplikasi/modul · WBS disusun kemudian.</span><div><button type="button" class="btn" data-scope-editor-close>Tutup</button>'+
 (!readonly?'<button type="button" class="btn pri" data-scope-editor-save>Simpan</button>':can(p)?'<button type="button" class="btn pri" data-scope-editor-edit>✎ Ubah</button>':'')+'</div></footer></section>';
 (document.querySelector('#app')||document.body).appendChild(d);
 const projectName=d.querySelector('[data-scope-field="name"]'),acrInput=d.querySelector('[data-scope-field="psAcronym"]'),codePreview=d.querySelector('[data-scope-code-preview]');
 let acrCustomized=!!existing?.psAcronym;
 d.addEventListener('input',ev=>{
  if(ev.target===acrInput)acrCustomized=true;
  if(ev.target===projectName&&!acrCustomized&&acrInput)acrInput.value=suggestedAcronym(projectName.value);
  if((ev.target===acrInput||ev.target===projectName)&&codePreview)
   codePreview.textContent=String(p.kode||p.akr)+'-'+(acronym(acrInput?.value)||suggestedAcronym(projectName?.value)||'…');
 });
 d.addEventListener('click',ev=>{
  if(ev.target===d||ev.target.closest('[data-scope-editor-close]')){d.remove();return}
  if(ev.target.closest('[data-scope-editor-edit]')){d.remove();projectEditor(id,false);return}
  if(!ev.target.closest('[data-scope-editor-save]'))return;
  const fields={};d.querySelectorAll('[data-scope-field]').forEach(x=>fields[x.dataset.scopeField]=x.value.trim());
  if(!fields.name){toast('Nama aplikasi/proyek wajib diisi.');return}
  if(fields.url&& !/^https?:\/\//i.test(fields.url)){toast('URL wajib dimulai https:// atau http://.');return}
  if((p.psProjects||[]).some(x=>x!==existing&&x.name?.toLowerCase()===fields.name.toLowerCase())){toast('Nama proyek sudah ada pada program tersebut.');return}
  fields.psAcronym=acronym(fields.psAcronym||suggestedAcronym(fields.name));
  if(!fields.psAcronym){toast('Akronim proyek wajib diisi.');return}
  if((p.psProjects||[]).some(x=>x!==existing&&assignedAcronym(x)===fields.psAcronym)){toast('Akronim '+fields.psAcronym+' sudah digunakan dalam program ini.');return}
  fields.psCode=codeFor(p,fields,fields.psAcronym);
  if(existing)Object.assign(existing,fields);else {p.psProjects=p.psProjects||[];p.psProjects.push({id:uid('proj'),included:true,scores:{},poster:{},risks:{},psOriginYear:null,...fields})}
  normalizeProjectCodes(p);
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
  if(rows.length)dupes.push({other,rows,itemName:item.name});
 }));
 if(dupes.some(x=>x.other.psStatus==='Ditetapkan')){toast('Modul sudah berada pada program yang ditetapkan. Gunakan revisi/Change Request.');return}
 if(dupes.length){
  const affected=dupes.map(x=>({
   name:x.itemName,
   from:x.other.nama+' ('+(x.other.kode||x.other.akr||'—')+' · '+year()+')',
   to:p.nama+' ('+(p.kode||p.akr||'—')+' · '+year()+')'
  }));
  confirmDialog('Pindahkan Proyek ke Program Tujuan?',
   'Proyek berikut sudah tercatat dalam program tujuan lain. Konfirmasi pemindahan akan mengubah penempatan proyek tahun '+year()+', tetapi data sumber historis tetap utuh.',
   ()=>completeTransfer(),'warning',affected);
  return;
 }
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
  z.category=projectCategory(p,z);
  z.psAcronym=uniqueCode(p,assignedAcronym(item.original||{})||suggestedAcronym(item.name));z.psCode=codeFor(p,z,z.psAcronym);
  z.start=shift(z.start,+m.year,year());z.goLive=shift(z.goLive,+m.year,year());
  p.psProjects=p.psProjects||[];p.psProjects.push(z);n++;
  /* Proposal only: do not copy historical WBS or actuals. WBS will be drafted afresh in PM. */
 });
 normalizeProjectCodes(p);m.selected=[];bank().mappingTab='proposal';p.psUpdatedAt=new Date().toISOString();save();window.render();
 toast(n+' proyek berhasil dipetakan. Lengkapi usulan pada tab Usulan Proyek; WBS disusun kemudian.');
 }
}
function click(ev){
 /* Resolve program first for every per-project action within an accordion. */
 const scoped=ev.target.closest('[data-scope-program-id]');
 if(scoped){const program=get(scoped.dataset.scopeProgramId);if(program){bank().target=program.id;I.state().prog=program.id}}
 const accordion=ev.target.closest('[data-scope-program-toggle]');
 if(accordion){const details=accordion.closest('details');mapState().programOpen[accordion.dataset.scopeProgramToggle]=!details?.open;save();return true}
 const detailRow=ev.target.closest('tr[data-scope-history-detail]');
 if(detailRow&&!ev.target.closest('button,input,select,textarea,a,label')){historyDetail(detailRow.dataset.scopeHistoryDetail);return true}
 const hist=ev.target.closest('[data-scope-history-add],[data-scope-history-bulk]');
 if(hist){addHistory(hist.dataset.scopeHistoryAdd?[hist.dataset.scopeHistoryAdd]:mapState().historySelected.slice());return true}
 const chosen=ev.target.closest('[data-scope-choose],[data-scope-aggregate-view]');
 if(chosen){
  const value=chosen.dataset.scopeChoose||chosen.dataset.scopeAggregateView?.split('::')[0],p=get(value);
  if(p){bank().target=p.id;I.state().prog=p.id;if(chosen.hasAttribute('data-scope-choose')){S.ui.psBank.filterScopes=S.ui.psBank.filterScopes||{};S.ui.psBank.filterScopes.mapping=S.ui.psBank.filterScopes.mapping||{};S.ui.psBank.filterScopes.mapping.allProgramsSelected=false;S.ui.psBank.filterScopes.mapping.program=p.id;save();window.render()}else projectEditor(chosen.dataset.scopeAggregateView.split('::')[1],true)}
  return true;
 }
 const focus=ev.target.closest('[data-scope-proposal-focus]');if(focus&&!ev.target.closest('button,input,select,textarea,a,label')){projectEditor(focus.dataset.scopeProposalFocus,true);return true}
 const tab=ev.target.closest('[data-scope-tab]');
 if(tab){mapState().mappingTab=tab.dataset.scopeTab;save();window.render();return true}
 const rm=ev.target.closest('[data-scope-project-remove],[data-scope-remove]');if(rm){remove(rm.dataset.scopeProjectRemove||rm.dataset.scopeRemove);return true}
 if(ev.target.closest('[data-scope-transfer]')){transfer();return true}
 const nw=ev.target.closest('[data-scope-project-new]');if(nw){projectEditor();return true}
 const view=ev.target.closest('[data-scope-project-view]');if(view){const row=view.closest('tr[data-scope-aggregate-view]');if(row){const p=get(row.dataset.scopeAggregateView.split('::')[0]);if(p){bank().target=p.id;I.state().prog=p.id}}projectEditor(view.dataset.scopeProjectView,true);return true}
 const edit=ev.target.closest('[data-scope-project-edit]');if(edit){projectEditor(edit.dataset.scopeProjectEdit,false);return true}
 return false;
}
function change(ev){
 const el=ev.target,m=bank().map,b=mapState();
 if(el.dataset.scopeHistoryTarget!==undefined){const p=get(el.value);if(p){bank().target=p.id;I.state().prog=p.id;b.historySelected=[];save();window.render()}return true}
 if(el.dataset.scopeHistoryYear!==undefined){b.historyYear=el.value;b.historySelected=[];save();window.render();return true}
 if(el.dataset.scopeHistorySearch!==undefined){b.historySearch=el.value;save();window.render();return true}
 if(el.dataset.scopeHistoryAll!==undefined){
  const rows=historyRows(target()),ids=new Set(rows.map(x=>x.key));
  b.historySelected=el.checked?[...new Set([...b.historySelected,...ids])]:b.historySelected.filter(x=>!ids.has(x));
  save();window.render();return true;
 }
 if(el.dataset.scopeHistoryCheck!==undefined){
  const id=el.dataset.scopeHistoryCheck;b.historySelected=el.checked?[...new Set([...b.historySelected,id])]:b.historySelected.filter(x=>x!==id);
  save();window.render();return true;
 }
 if(el.dataset.scopeYear!==undefined){m.year=+el.value;m.program='';m.selected=[];save();window.render();return true}
 if(el.dataset.scopeProgram!==undefined){m.program=el.value;m.selected=[];save();window.render();return true}
 if(el.dataset.scopeSelect!==undefined){const id=el.dataset.scopeSelect;m.selected=el.checked?[...new Set([...m.selected,id])]:m.selected.filter(x=>x!==id);save();window.render();return true}
 if(el.dataset.scopeTargetSelect!==undefined){const id=el.dataset.scopeTargetSelect;b.targetSelected=el.checked?[...new Set([...b.targetSelected,id])]:b.targetSelected.filter(x=>x!==id);save();window.render();return true}
 if(el.dataset.scopeTargetAll!==undefined){b.targetSelected=el.checked?proposalRows(target()).map(x=>String(x.id)):[];save();window.render();return true}
 return false;
}
if(typeof document!=='undefined'&&typeof document.addEventListener==='function')document.addEventListener('keydown',ev=>{if(ev.key!=='Enter'&&ev.key!==' ')return;const row=ev.target.closest?.('tr[data-scope-history-detail]');if(row&&ev.target===row){ev.preventDefault();historyDetail(row.dataset.scopeHistoryDetail);return}const rec=ev.target.closest?.('tr[data-scope-aggregate-view]');if(rec&&ev.target===rec){ev.preventDefault();click({target:rec})}});
window.MT_PS_SCOPE={modules,sourceWbs,render,transfer,click,change,bank,target,codeFor,currentCode,suggestedAcronym,normalizeProjectCodes,projectFields:PROJECT_FIELDS,projectValue,version:'20261109-project-recap-v6'};
})();