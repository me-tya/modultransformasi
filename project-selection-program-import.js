/* Project Selection — Impor Usulan Program dari Excel (template "Impor Usulan Program").
   Sheet: Program (wajib), Proyek, Milestone, Kriteria. Kunci penghubung = Nama Program.
   Aturan bisnis:
   - Satu baris Program = satu Usulan Program (Draft) + Charter Program (p.psProgramCharter).
   - Program dengan nama + tahun sama diperbarui bila belum Ditetapkan/Arsip; selain itu dibuat baru.
   - Charter yang sudah tidak berstatus Draft (mis. Disahkan) tidak ditimpa.
   - Proyek dicocokkan per nama di dalam program; kode proyek dibentuk ulang oleh MT_PS_SCOPE.
   - Kode Program Resmi opsional; tidak boleh sama dengan program lain pada tahun yang sama.
   - PMO Unit hanya boleh mengimpor program dengan UIC Utama = unitnya. */
(function(){
'use strict';
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const uid=t=>(t||'id')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const year=()=>+S.ui.psSelectedYear||+S.ui.tahun||2026;
const T=v=>String(v==null?'':v).replace(/\r/g,'').trim();
const key=v=>T(v).toLowerCase().replace(/\s+/g,' ');
const lines=v=>T(v).split('\n').map(x=>x.replace(/^\s*(?:[•▪●◦\-–]|\d+[.)])\s*/,'').trim()).filter(Boolean);
const norm=h=>String(h||'').toLowerCase().replace(/\*/g,'').replace(/\s+/g,' ').trim();
const COLS={
 Program:{no:'no',tahun:'tahun',nama:'nama program',kodeResmi:'kode program resmi',jenis:'jenis program',uic:'uic utama',pend:'uic pendukung',
  champion:'initiative champion',owner:'initiative owner',p1:'periode mulai',p2:'periode selesai',tujuan:'tujuan program',lb:'latar belakang',tb:'terobosan',
  out:'output',oc:'outcome',ris:'risiko',pk:'pendukung kesuksesan',klaster:'klaster',sumber:'kode is sumber',catatan:'catatan impor'},
 Proyek:{prog:'nama program',kodeIS:'kode is',name:'nama proyek',uic:'uic utama',pend:'uic pendukung',pic:'pic / initiative owner',tujuan:'tujuan proyek',
  lb:'latar belakang',out:'output',oc:'outcome',kp:'kriteria penyelesaian',status:'status usulan'},
 Milestone:{prog:'nama program',y:'tahun',t:'milestone',g:'kelompok wbs',kodeIS:'kode is'},
 Kriteria:{prog:'nama program',m:'milestone',k:'kriteria penyelesaian',kodeIS:'kode is'}
};
const REQUIRED={Program:['nama','tahun','uic'],Proyek:['prog','name','uic'],Milestone:['prog','y','t'],Kriteria:['prog','m']};
const JENIS=['Berkelanjutan','Tematik','Lainnya'],STATUS=['Usulan','Berjalan','Ditunda','Selesai'];
const me=()=>{try{return typeof ME!=='undefined'?ME:null}catch(_){return null}};
const canRole=()=>!!me()&&['SA','PMOK','PMOU'].includes(me().role);

/* aoa: {Program:[[header...],[row...]], Proyek:[...], ...} → objek per sheet */
function tables(aoa){
 const out={},errors=[];
 Object.keys(COLS).forEach(name=>{
  const sheetKey=Object.keys(aoa||{}).find(k=>norm(k)===norm(name));
  const data=sheetKey?aoa[sheetKey]:null;
  if(!data||!data.length){out[name]=[];if(name==='Program')errors.push('Sheet "Program" tidak ditemukan. Gunakan template Impor Usulan Program.');return}
  const head=(data[0]||[]).map(norm),map={};
  Object.entries(COLS[name]).forEach(([k,label])=>{const i=head.indexOf(label);if(i>=0)map[k]=i});
  const miss=REQUIRED[name].filter(k=>map[k]==null);
  if(miss.length){errors.push('Sheet "'+name+'" tidak memiliki kolom: '+miss.map(k=>COLS[name][k]).join(', ')+'.');out[name]=[];return}
  out[name]=data.slice(1).map((r,i)=>{const o={_row:i+2};Object.entries(map).forEach(([k,ix])=>o[k]=T(r[ix]));return o})
   .filter(o=>Object.keys(COLS[name]).some(k=>k!=='no'&&o[k]));
 });
 return {out,errors};
}
function findProgram(name,y){
 return (S.programs||[]).find(p=>+p.psYear===+y&&key(p.nama)===key(name));
}
/* Menyusun rencana impor tanpa mengubah S. */
function plan(aoa){
 const {out,errors}=tables(aoa),items=[],warn=[],seen=new Set(),codes=new Map();
 const byProg=sheet=>{const m=new Map();(out[sheet]||[]).forEach(r=>{const k=key(r.prog);if(!m.has(k))m.set(k,[]);m.get(k).push(r)});return m};
 const PR=byProg('Proyek'),MS=byProg('Milestone'),KR=byProg('Kriteria');
 (out.Program||[]).forEach(r=>{
  const it={row:r._row,src:r,problems:[],notes:[]};items.push(it);
  const y=+r.tahun,k=key(r.nama);
  if(!r.nama)it.problems.push('Nama Program kosong');
  if(!(y>=2024&&y<=2099))it.problems.push('Tahun tidak valid');
  if(!r.uic)it.problems.push('UIC Utama kosong');
  if(seen.has(k+'|'+y))it.problems.push('Nama Program ganda dalam berkas');seen.add(k+'|'+y);
  const code=T(r.kodeResmi).toUpperCase();
  if(code){
   if(codes.has(y+'|'+code))it.problems.push('Kode Program Resmi ganda dalam berkas');codes.set(y+'|'+code,1);
  }
  if(r.jenis&&!JENIS.some(j=>key(j)===key(r.jenis)))it.problems.push('Jenis Program harus Berkelanjutan/Tematik/Lainnya');
  if(me()&&me().role==='PMOU'&&me().unit&&r.uic&&r.uic!==me().unit)it.problems.push('PMO Unit hanya dapat mengimpor program dengan UIC '+me().unit);
  const existing=r.nama&&y?findProgram(r.nama,y):null;
  if(code&&(S.programs||[]).some(p=>p!==existing&&+p.psYear===y&&String(p.kodeResmi||'').trim().toUpperCase()===code))it.problems.push('Kode Program Resmi sudah dipakai program lain');
  it.existing=existing||null;
  it.action=it.problems.length?'Galat':!existing?'Baru':(existing.psStatus==='Ditetapkan'||existing.arsip||existing.psListStatus==='Arsip')?'Dilewati':'Perbarui';
  if(it.action==='Dilewati')it.notes.push('Program sudah ditetapkan/diarsipkan');
  if(y&&y!==year())it.notes.push('Tahun '+y+' berbeda dengan tahun aktif '+year());
  it.projects=(PR.get(k)||[]).map(x=>({...x,problem:!x.name?'Nama Proyek kosong':!x.uic?'UIC kosong':''}));
  it.ms=(MS.get(k)||[]).filter(x=>x.t);
  it.kp=(KR.get(k)||[]).filter(x=>x.m);
  const pc=it.existing?.psProgramCharter;
  it.charterLocked=!!(pc&&pc.st&&pc.st!=='Draft');
  if(it.charterLocked)it.notes.push('Charter berstatus '+pc.st+' tidak ditimpa');
  if(it.projects.some(x=>x.problem))it.notes.push(it.projects.filter(x=>x.problem).length+' baris proyek tidak lengkap dilewati');
  if(r.catatan)it.notes.push(r.catatan);
 });
 const known=new Set((out.Program||[]).map(r=>key(r.nama)));
 ['Proyek','Milestone','Kriteria'].forEach(s=>(out[s]||[]).forEach(r=>{if(r.prog&&!known.has(key(r.prog)))warn.push('Sheet '+s+' baris '+r._row+': Nama Program "'+r.prog+'" tidak ada di sheet Program.')}));
 return {items,errors,warn};
}
function charterFrom(it,p){
 const r=it.src,y=+r.tahun,base=p.psProgramCharter||{};
 const p1=+r.p1||y,p2=Math.max(p1,+r.p2||p1);
 const kpMap=new Map();
 it.kp.forEach(x=>{const k=key(x.m);if(!kpMap.has(k))kpMap.set(k,{m:x.m,k:[]});kpMap.get(k).k.push(...lines(x.k))});
 return {
  id:base.id||'program-charter-'+p.id,prog:p.akr,tahun:y,ver:base.ver||1,st:'Draft',
  judul:r.nama,tujuan:lines(r.tujuan).length>1?lines(r.tujuan).join('\n'):T(r.tujuan),
  lb:lines(r.lb),tb:lines(r.tb).join('\n'),out:lines(r.out),oc:lines(r.oc),p1,p2,
  ms:it.ms.map(x=>({y:String(+x.y||x.y),t:x.t,g:x.g||''})),
  ris:lines(r.ris),pk:lines(r.pk),ch:T(r.champion),ow:lines(r.owner).length?lines(r.owner):[r.uic].filter(Boolean),
  asis:base.asis||{pb:'',masalah:'',kor:[],tek:'',link:''},tobe:base.tobe||{pb:[],pot:[],ar:'',link:'',arLink:''},
  cs:base.cs||[],kp:[...kpMap.values()],mf:base.mf||[],rk:base.rk||[],doc:base.doc||{link:''},
  log:[...(base.log||[]),{t:new Date().toISOString(),by:me()?.email||'',act:'Impor Excel'}]
 };
}
function projectFrom(x,p,old){
 const desc=[T(x.tujuan),lines(x.lb).length?'Latar belakang:\n'+lines(x.lb).map(v=>'• '+v).join('\n'):''].filter(Boolean).join('\n\n');
 const st=STATUS.find(s=>key(s)===key(x.status))||old?.status||'Usulan';
 return Object.assign(old||{id:uid('proj'),included:true,scores:{},poster:{},risks:{},indicators:[],benefits:[],psOriginYear:null},{
  name:x.name,uic:x.uic,pic:x.pic||old?.pic||'',status:st,description:desc,
  outputs:lines(x.out).join('\n'),outcome:lines(x.oc).join('\n'),accepted:lines(x.kp).join('\n'),
  psSupportUic:x.pend||'',psSourceIS:x.kodeIS||'',updatedAt:new Date().toISOString(),updatedBy:me()?.email||''});
}
/* Menerapkan rencana ke S.programs. Mengembalikan ringkasan. */
function apply(pl,meta){
 const done={created:0,updated:0,skipped:0,projects:0,ids:[]};
 S.programs=S.programs||[];
 pl.items.forEach(it=>{
  if(it.action!=='Baru'&&it.action!=='Perbarui'){done.skipped++;return}
  const r=it.src,y=+r.tahun,code=T(r.kodeResmi).toUpperCase();
  let p=it.existing;
  if(!p){
   p={id:uid('program'),akr:'PS'+y+'-'+uid('p'),psYear:y,psDraft:true,psStatus:'Draft',psListStatus:'Baru',psThreshold:80,psPrioritize:false,
    psProjects:[],psWeights:{},psGovernanceV:1,psBenefits:[],psStakeholders:[],psRiskRegister:[],status:'Perencanaan'};
   S.programs.push(p);done.created++;
  }else done.updated++;
  const jenis=JENIS.find(j=>key(j)===key(r.jenis));
  const p1=+r.p1||y,p2=Math.max(p1,+r.p2||p1);
  Object.assign(p,{nama:r.nama,uic:r.uic,pend:r.pend||p.pend||'',sponsor:r.champion||p.sponsor||'',
   psObjective:T(r.tujuan)||p.psObjective||'',psBackground:lines(r.lb).map(v=>'• '+v).join('\n')||p.psBackground||'',
   psStrategy:lines(r.tb).map(v=>'• '+v).join('\n')||p.psStrategy||'',psOutcome:lines(r.oc).map(v=>'• '+v).join('\n')||p.psOutcome||'',
   psThemes:[r.klaster,r.sumber?'IS '+r.sumber:''].filter(Boolean).join(' · ')||p.psThemes||'',
   mulai:p1,periode:p1+'–'+p2,psYear:y,psUpdatedAt:new Date().toISOString(),psUpdatedBy:me()?.email||'',
   psImport:{source:meta?.file||'Excel',sheet:'Program',row:it.row,sourceIS:r.sumber||'',at:new Date().toISOString(),by:me()?.email||''}});
  if(jenis)p.jenis=jenis;else if(!p.jenis)p.jenis='';
  if(code){p.kodeResmi=code;if(!p.kode||it.action==='Baru')p.kode=code}
  else if(!p.kode)p.kode='';
  p.psProjects=p.psProjects||[];
  it.projects.filter(x=>!x.problem).forEach(x=>{
   const old=p.psProjects.find(z=>key(z.name)===key(x.name));
   const z=projectFrom(x,p,old);if(!old)p.psProjects.push(z);done.projects++;
  });
  try{window.MT_PS_SCOPE?.normalizeProjectCodes?.(p)}catch(_){}
  if(!it.charterLocked)p.psProgramCharter=charterFrom(it,p);
  done.ids.push(p.id);
 });
 return done;
}
/* ---------- Unduh template ---------- */
function templateBook(){
 const X=window.XLSX,wb=X.utils.book_new();
 const head=s=>Object.values(COLS[s]).map(h=>h.replace(/\b\w/g,m=>m.toUpperCase()).replace('Uic','UIC').replace('Pic','PIC').replace('Is','IS').replace('Wbs','WBS'));
 const ex={
  Program:[[1,year(),'Contoh Program Transformasi','','Berkelanjutan','BaTii','DJPb, DJP','Menteri Keuangan','Kepala Badan Teknologi, Informasi, dan Intelijen Keuangan',year(),year()+2,'Tujuan program…','• Latar belakang 1\n• Latar belakang 2','• Terobosan 1','• Output 1','• Outcome 1','• Risiko 1','• Pendukung 1','','','']],
  Proyek:[[1,'Contoh Program Transformasi','','Contoh Proyek','BaTii','DJPb','PIC proyek','Tujuan proyek…','• Latar belakang','• Output','• Outcome','Milestone — kriteria','Usulan']],
  Milestone:[['Contoh Program Transformasi',year(),'Milestone tahun pertama','','']],
  Kriteria:[['Contoh Program Transformasi','Milestone tahun pertama','Kriteria penyelesaian…','']]
 };
 Object.keys(COLS).forEach(s=>{const ws=X.utils.aoa_to_sheet([head(s),...ex[s]]);ws['!cols']=head(s).map(h=>({wch:Math.max(12,Math.min(44,h.length+8))}));X.utils.book_append_sheet(wb,ws,s)});
 const pet=X.utils.aoa_to_sheet([['PETUNJUK IMPOR USULAN PROGRAM'],['Satu baris sheet Program = satu Usulan Program + Charter Program. Nama Program menjadi kunci ke sheet Proyek, Milestone, dan Kriteria.'],
  ['Kolom wajib: Program (Tahun, Nama Program, UIC Utama); Proyek (Nama Program, Nama Proyek, UIC Utama); Milestone (Nama Program, Tahun, Milestone); Kriteria (Nama Program, Milestone).'],
  ['Isian daftar ditulis satu butir per baris (Alt+Enter). Jenis Program: Berkelanjutan/Tematik/Lainnya. Status Usulan: Usulan/Berjalan/Ditunda/Selesai.'],
  ['Program dengan nama dan tahun sama diperbarui (selama belum Ditetapkan/Arsip). Charter yang sudah disahkan tidak ditimpa. Hapus baris contoh sebelum mengimpor.']]);
 pet['!cols']=[{wch:130}];X.utils.book_append_sheet(wb,pet,'Petunjuk');
 return wb;
}
function downloadTemplate(){
 if(!window.XLSX){toast('Pustaka Excel belum termuat. Periksa koneksi internet lalu muat ulang.');return}
 XLSX.writeFile(templateBook(),'Template_Impor_Usulan_Program_'+year()+'.xlsx');
}
/* ---------- UI ---------- */
let current=null;
function readFile(file){
 return new Promise((res,rej)=>{
  if(!window.XLSX)return rej(new Error('Pustaka Excel belum termuat. Periksa koneksi internet lalu muat ulang.'));
  const fr=new FileReader();fr.onerror=()=>rej(new Error('Berkas tidak dapat dibaca.'));
  fr.onload=()=>{try{const wb=XLSX.read(new Uint8Array(fr.result),{type:'array'});const aoa={};
   wb.SheetNames.forEach(n=>aoa[n]=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:'',raw:false,blankrows:false}));res(aoa)}catch(e){rej(new Error('Format berkas tidak dikenali.'))}};
  fr.readAsArrayBuffer(file);
 });
}
const tag=a=>'<span class="psimp-tag psimp-'+({Baru:'new',Perbarui:'upd',Dilewati:'skip',Galat:'err'}[a]||'skip')+'">'+E(a)+'</span>';
function body(){
 const c=current;
 const pick='<div class="psimp-pick"><div><b>1. Siapkan berkas</b><span>Gunakan template Impor Usulan Program (sheet Program, Proyek, Milestone, Kriteria).</span></div><button type="button" class="btn" data-psimp="template">↓ Unduh Template</button>'+
  '<div><b>2. Pilih berkas Excel</b><span>'+(c?.file?E(c.file):'Belum ada berkas dipilih')+'</span></div><button type="button" class="btn pri" data-psimp="pick">Pilih Berkas…</button><input type="file" accept=".xlsx,.xls" data-psimp-file hidden></div>';
 if(!c?.plan)return pick+'<div class="psimp-empty">Pratinjau tampil setelah berkas dipilih. Data belum disimpan sebelum Anda menekan <b>Terapkan Impor</b>.</div>';
 const pl=c.plan,n=a=>pl.items.filter(x=>x.action===a).length,np=pl.items.reduce((s,x)=>s+x.projects.filter(z=>!z.problem).length,0);
 let h=pick;
 if(pl.errors.length)h+='<div class="psimp-alert err">'+pl.errors.map(E).join('<br>')+'</div>';
 h+='<div class="psimp-stats"><div><b>'+pl.items.length+'</b><span>Baris program</span></div><div><b>'+n('Baru')+'</b><span>Program baru</span></div><div><b>'+n('Perbarui')+'</b><span>Diperbarui</span></div><div><b>'+np+'</b><span>Proyek</span></div><div><b>'+(n('Galat')+n('Dilewati'))+'</b><span>Dilewati</span></div></div>';
 h+='<div class="psimp-tablewrap"><table class="psimp-table"><thead><tr><th>Baris</th><th>Program</th><th>Tahun</th><th>UIC</th><th>Proyek</th><th>Milestone</th><th>Kriteria</th><th>Aksi</th><th>Catatan</th></tr></thead><tbody>'+
  pl.items.map(it=>'<tr><td>'+it.row+'</td><td><b>'+E(it.src.nama||'—')+'</b>'+(it.src.kodeResmi?'<small>'+E(it.src.kodeResmi)+'</small>':'')+'</td><td>'+E(it.src.tahun)+'</td><td>'+E(it.src.uic||'—')+'</td><td>'+it.projects.filter(z=>!z.problem).length+'</td><td>'+it.ms.length+'</td><td>'+it.kp.length+'</td><td>'+tag(it.action)+'</td><td class="psimp-note">'+
   E([...it.problems,...it.notes].join(' · ')||'—')+'</td></tr>').join('')+'</tbody></table></div>';
 if(pl.warn.length)h+='<details class="psimp-warn"><summary>'+pl.warn.length+' baris rujukan tidak cocok</summary><div>'+pl.warn.map(E).join('<br>')+'</div></details>';
 return h;
}
function paint(){
 const ov=document.querySelector('.psimp-overlay');if(!ov)return;
 ov.querySelector('main').innerHTML=body();
 const ok=current?.plan&&current.plan.items.some(x=>x.action==='Baru'||x.action==='Perbarui');
 const b=ov.querySelector('[data-psimp="apply"]');if(b)b.disabled=!ok;
}
function open(preset){
 if(!canRole()){toast('Impor program hanya untuk Superadmin, PMO Kemenkeu, dan PMO Unit.');return}
 document.querySelectorAll('.psimp-overlay').forEach(x=>x.remove());current=null;
 const ov=document.createElement('div');ov.className='pswf-overlay psimp-overlay';
 ov.innerHTML='<section class="pswf-modal psimp-modal" role="dialog" aria-modal="true" aria-label="Impor Usulan Program"><header><h2>Impor Usulan Program · '+year()+'</h2><button type="button" data-psimp="close" aria-label="Tutup">✕</button></header><main></main><footer><button class="btn" type="button" data-psimp="close">Batal</button><button class="btn pri" type="button" data-psimp="apply" disabled>Terapkan Impor</button></footer></section>';
 document.body.appendChild(ov);
 ov.addEventListener('click',async ev=>{
  const a=ev.target.closest('[data-psimp]')?.dataset.psimp;
  if(ev.target===ov||a==='close'){ov.remove();return}
  if(a==='template')downloadTemplate();
  else if(a==='pick')ov.querySelector('[data-psimp-file]').click();
  else if(a==='apply'){
   if(!current?.plan)return;
   const res=apply(current.plan,{file:current.file});
   S.ui.psSelectedYear=S.ui.psSelectedYear||year();S.ui.psBank=S.ui.psBank||{};S.ui.psBank.tab='detail';S.ui.psBank.detailPage=1;
   if(typeof save==='function')save();ov.remove();if(typeof render==='function')render();
   toast(res.created+' program baru, '+res.updated+' diperbarui, '+res.projects+' proyek diimpor'+(res.skipped?'; '+res.skipped+' baris dilewati':'')+'.');
  }
 });
 ov.addEventListener('change',async ev=>{
  const f=ev.target.closest('[data-psimp-file]');if(!f||!f.files[0])return;
  const file=f.files[0];
  try{const aoa=await readFile(file);current={file:file.name,plan:plan(aoa)};paint()}
  catch(e){current={file:file.name,plan:null};paint();toast(e.message||'Berkas gagal dibaca.')}
 });
 ov.addEventListener('keydown',ev=>{if(ev.key==='Escape')ov.remove()});
 if(preset?.aoa)current={file:preset.file||'',plan:plan(preset.aoa)};
 paint();
}
document.addEventListener('click',ev=>{if(ev.target.closest?.('[data-bank-import]')){ev.preventDefault();open()}});
window.MT_PS_IMPORT={plan,apply,tables,templateBook,open,downloadTemplate,version:'20261125-import-v1'};
})();
