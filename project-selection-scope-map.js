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
function mappingView(p){
 const b=mapState(),m=b.map,years=[2025,2026,2027,2028,2029].filter(y=>y<=year());
 const sources=sourceList(+m.year,p);
 if(!sources.some(x=>String(x.id)===String(m.program)))m.program=sources[0]?.id||'';
 const s=get(m.program),q=String(m.q||'').toLowerCase(),catalog=modules(s,+m.year).filter(x=>[x.name,x.uic,...x.rows.flatMap(w=>w.p||[])].join(' ').toLowerCase().includes(q));
 const arr=proposalRows(p),selected=arr.filter(x=>b.targetSelected.includes(String(x.id)));
 return '<div class="psbank-mapping-summary"><span>Program Tujuan: <b>'+E(p.nama)+'</b> · '+E(p.kode||p.akr)+'</span><span><b>'+arr.length+'</b> proyek terpetakan</span></div>'+
 '<div class="psbank-mapcols"><section class="psbank-mapbox"><div class="psbank-maphead"><h4>Proyek dalam '+E(p.nama)+'</h4><span>'+selected.length+' dipilih</span></div><p>Centang proyek untuk mengelola keanggotaan program. Rencana WBS dibuat kemudian pada tahap perencanaan proyek.</p>'+
 '<div class="psbank-mapselectall"><label><input type="checkbox" data-scope-target-all '+(arr.length&&selected.length===arr.length?'checked':'')+'> Pilih semua</label>'+
 '<button type="button" class="btn" data-scope-remove-multiple '+(!selected.length||!can(p)?'disabled':'')+'>Keluarkan yang Dipilih</button></div>'+
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
 const rows=proposalRows(p),b=mapState();
 return '<div class="psbank-proposal-head"><div><h3>Usulan Proyek · '+E(p.nama)+'</h3><p>'+E(p.kode||p.akr)+' · Tahun '+year()+' · '+rows.length+' proyek dipilih dari Pemetaan</p></div>'+
 (can(p)?'<button class="btn pri" data-scope-project-new>+ Tambah Proyek</button>':'')+'</div>'+
 '<div class="psbank-tablewrap"><table class="psbank-table psbank-proposal-table"><thead><tr><th>No.</th><th>Nama Proyek / Modul</th><th>UIC Utama</th><th>PIC</th><th>Status</th><th>Sumber Proyek</th><th>Aksi</th></tr></thead><tbody>'+
 (rows.length?rows.map((x,i)=>'<tr><td>'+(i+1)+'</td><td><b>'+E(x.name)+'</b><small>'+E(x.description||'')+'</small></td><td>'+E(x.uic||p.uic||'—')+'</td><td>'+E(x.pic||'—')+'</td><td>'+E(x.status||'Usulan')+'</td><td>'+E(x.psOriginYear?x.psOriginProgram+' · '+x.psOriginYear:'Usulan baru')+'</td>'+
 '<td class="psbank-rowactions"><button class="btn btn-outline btn-sm" data-scope-project-view="'+E(x.id)+'">Lihat</button>'+(can(p)?'<button class="btn btn-outline btn-sm" data-scope-project-edit="'+E(x.id)+'">Ubah</button><button class="btn btn-ghost btn-sm" data-scope-remove="'+E(x.id)+'">Hapus</button>':'')+'</td></tr>').join(''):'<tr><td colspan="7" class="psbank-empty">Belum ada proyek. Buka tab Pemetaan untuk memilih modul dari program sebelumnya atau tambahkan proyek baru.</td></tr>')+'</tbody></table></div>'+
 '<div class="psbank-note">Tab ini hanya mengelola daftar dan identitas proyek (CRUD). Perencanaan WBS, target rinci, dan realisasi berada pada Project Management setelah penetapan.</div>';
}
function render(){
 const p=target();if(!p)return '<div class="psbank-card psbank-empty">Belum ada program tahun '+year()+'. Tambahkan dari Daftar Program terlebih dahulu.</div>';
 const b=mapState(),on=b.mappingTab;
 return '<div class="psbank-card"><div class="psbank-sectionhead"><div><h3>Pemetaan Proyek / Modul</h3><p>Tentukan ruang lingkup program, lalu kelola daftar proyek untuk tahun '+year()+'.</p></div></div>'+
 '<nav class="psbank-mapping-tabs" role="tablist" aria-label="Tahapan Pemetaan Proyek">'+
 '<button type="button" role="tab" data-scope-tab="mapping" aria-selected="'+(on==='mapping')+'" class="'+(on==='mapping'?'on':'')+'">1 · Pemetaan</button>'+
 '<button type="button" role="tab" data-scope-tab="proposal" aria-selected="'+(on==='proposal')+'" class="'+(on==='proposal'?'on':'')+'">2 · Usulan Proyek <b>'+proposalRows(p).length+'</b></button></nav>'+
 (on==='proposal'?proposalView(p):mappingView(p))+'</div>';
}
function projectEditor(id,readonly=false){
 const p=target();if(!p||!can(p)&&!readonly)return;
 const existing=(p.psProjects||[]).find(x=>String(x.id)===String(id));
 if(id&&!existing)return;
 const d=document.createElement('div');d.className='psbank-overlay psbank-project-editor';
 const rows=[['name','Nama Proyek / Modul'],['uic','UIC Utama'],['pic','PIC / Penanggung Jawab'],['description','Deskripsi / Ruang Lingkup Awal'],['start','Rencana Mulai'],['goLive','Target Go-Live']];
 const input=([key,label])=>'<label>'+label+(key==='name'?' *':'')+'<input '+((key==='start'||key==='goLive')?'type="date"':'type="text"')+' data-scope-field="'+key+'" value="'+E(existing?.[key]||'')+'" '+(readonly?'disabled':'')+'></label>';
 d.innerHTML='<section class="psbank-dialog psbank-project-dialog" role="dialog" aria-modal="true" aria-label="'+(readonly?'Detail':'Ubah')+' Usulan Proyek"><header><div><b>'+(readonly?'Detail':existing?'Ubah':'Tambah')+' Usulan Proyek</b><small>'+E(p.nama)+' · '+year()+'</small></div><button type="button" data-scope-editor-close>✕</button></header>'+
 '<main class="psbank-dialogbody"><div class="psbank-proj-editor-grid">'+rows.map(input).join('')+
 '<label>Status <select data-scope-field="status" '+(readonly?'disabled':'')+'>'+['Usulan','Berjalan','Ditunda','Selesai'].map(x=>'<option '+((existing?.status||'Usulan')===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>'+
 '<div class="psbank-proj-origin"><b>Asal Proyek</b><p>'+E(existing?.psOriginYear?existing.psOriginProgram+' · '+existing.psOriginYear:'Usulan baru')+'</p><small>Data proyek sumber tidak akan berubah ketika isian ini diperbarui.</small></div></div></main>'+
 '<footer><span>Data identitas proyek, bukan WBS.</span><div><button class="btn" data-scope-editor-close>Tutup</button>'+(!readonly?'<button class="btn pri" data-scope-editor-save>Simpan</button>':'')+'</div></footer></section>';
 (document.querySelector('#app')||document.body).appendChild(d);
 d.addEventListener('click',ev=>{
  if(ev.target===d||ev.target.closest('[data-scope-editor-close]')){d.remove();return}
  if(!ev.target.closest('[data-scope-editor-save]'))return;
  const fields={};d.querySelectorAll('[data-scope-field]').forEach(x=>fields[x.dataset.scopeField]=x.value.trim());
  if(!fields.name){toast('Nama proyek wajib diisi.');return}
  if((p.psProjects||[]).some(x=>x!==existing&&x.name?.toLowerCase()===fields.name.toLowerCase())){toast('Proyek dengan nama tersebut sudah ada.');return}
  if(existing)Object.assign(existing,fields);else {p.psProjects=p.psProjects||[];p.psProjects.push({id:uid('proj'),included:true,scores:{},psOriginYear:null,...fields})}
  p.psUpdatedAt=new Date().toISOString();save();d.remove();window.render();toast('Identitas proyek berhasil disimpan.');
 });
}

function remove(id,skipConfirm=false){
 const p=target(),x=p?.psProjects?.find(z=>String(z.id)===String(id));if(!p||!x||!can(p))return;
 if(!skipConfirm&&!window.confirm('Hapus usulan proyek '+x.name+' dari program ini? Data tahun sumber tetap utuh.'))return;
 p.psProjects=p.psProjects.filter(z=>z!==x);
 const b=mapState();b.targetSelected=b.targetSelected.filter(z=>z!==String(id));
 save();window.render();toast('Proyek dikeluarkan dari usulan program.');
}
function removeSelected(){
 const p=target(),b=mapState(),chosen=(p?.psProjects||[]).filter(x=>b.targetSelected.includes(String(x.id)));
 if(!chosen.length||!can(p))return;
 if(!window.confirm('Keluarkan '+chosen.length+' proyek terpilih dari program '+p.nama+'?'))return;
 p.psProjects=p.psProjects.filter(x=>!b.targetSelected.includes(String(x.id)));
 b.targetSelected=[];save();window.render();toast(chosen.length+' proyek berhasil dikeluarkan.');
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
 if(dupes.length&&!window.confirm('Sebagian modul sudah ada pada program tujuan lain tahun '+year()+'. Pindahkan dari usulan lama ke '+p.nama+'?'))return;
 let n=0;
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
 m.selected=[];bank().mappingTab='proposal';p.psUpdatedAt=new Date().toISOString();save();window.render();
 toast(n+' proyek berhasil dipetakan. Lengkapi identitas pada tab Usulan Proyek; WBS disusun kemudian.');
}
function click(ev){
 const tab=ev.target.closest('[data-scope-tab]');
 if(tab){mapState().mappingTab=tab.dataset.scopeTab;save();window.render();return true}
 if(ev.target.closest('[data-scope-remove-multiple]')){removeSelected();return true}
 const rm=ev.target.closest('[data-scope-remove]');if(rm){remove(rm.dataset.scopeRemove);return true}
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
window.MT_PS_SCOPE={modules,sourceWbs,render,transfer,click,change,bank,target,version:'20261108-scope-map-two-tab-v2'};
})();