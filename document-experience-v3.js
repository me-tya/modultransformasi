(function modulDocumentExperienceV3(){
'use strict';
const KEYS=[['asis','As-is'],['tobe','To-be'],['cs','Perbandingan'],['ch','Charter Proyek'],['kp','Kriteria'],['mf','Manfaat'],['rk','Linimasa']];
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const clone=x=>JSON.parse(JSON.stringify(x));
const empty=(p,kind)=>{
 const y=kind==='program'?(+p.psYear||+S.ui.psSelectedYear||2026):(+S.ui.tahun||2026);
 const y0=+(p.mulai||y)||y,ys=String(p.periode||'').match(/20\d{2}/g)||[];
 const y1=Math.max(y0,+(ys[ys.length-1]||y0));
 return {id:kind==='program'?'program-charter-'+p.id:'project-charter-'+p.akr+'-'+Date.now(),prog:p.akr,
  tahun:y,ver:1,st:'Draft',judul:p.nama||'',tujuan:kind==='program'?(p.psObjective||''):'',
  lb:kind==='program'?[p.psBackground||''].filter(Boolean):[],tb:kind==='program'?(p.psStrategy||''):'',
  out:[],oc:kind==='program'?[p.psOutcome||''].filter(Boolean):[],
  p1:y0,p2:y1,ms:[],ris:[],pk:[],ch:p.sponsor||'',ow:[p.uic||''].filter(Boolean),
  asis:{pb:'',masalah:'',kor:[],tek:'',link:''},tobe:{pb:[],pot:[],ar:'',link:'',arLink:''},
  cs:[],kp:[],mf:[],rk:[],doc:{link:''},log:[]};
};
const canEdit=(p,kind,c)=>{
 if(!ME||!p)return false;
 if(kind==='project')return !!(chCan('U',p)||(!c&&chCan('C',p)))&&(!c||c.st==='Draft');
 return ['SA','PMOK','PMOU'].includes(ME.role)&&(!p.psYear||+p.psYear===(+S.ui.psSelectedYear||+S.ui.tahun||2026))&&(!p.psStatus||p.psStatus!=='Ditetapkan')&&(ME.role!=='PMOU'||!p.uic||p.uic===ME.unit);
};
const currentProject=p=>(S.charters||[]).filter(c=>c.prog===p.akr&&c.st!=='Arsip').sort((a,b)=>(a.st==='Draft'?0:a.st==='Reviu'?1:2)-(b.st==='Draft'?0:b.st==='Reviu'?1:2)||(+b.ver||0)-(+a.ver||0))[0]||null;
// Program and project charters have independent storage. Legacy PMO charter data can
// initialize a program charter, but the new program document never overwrites it.
const getSource=(p,kind)=>{
 if(kind==='project')return currentProject(p);
 if(p.psProgramCharter)return p.psProgramCharter;
 const legacy=chCur(p.akr);
 if(!legacy)return null;
 const d=clone(legacy);d.id='program-charter-'+p.id;d.st='Draft';d.tahun=+p.psYear||+S.ui.psSelectedYear||2026;
 d.tujuan=p.psObjective||d.tujuan;d.lb=p.psBackground?[p.psBackground]:d.lb;
 d.tb=p.psStrategy||d.tb;d.oc=p.psOutcome?[p.psOutcome]:d.oc;
 d.sumberLegacy=legacy.id;return d;
};
let active=null,inline=null,lastProgramId='';
function field(label,key,val,rows=2){
 return '<label class="mt-doc-field"><span>'+E(label)+'</span><textarea rows="'+rows+'" data-mt-field="'+E(key)+'" '+(active&&!active.edit?'readonly':'')+'>'+E(val||'')+'</textarea></label>';
}
function listField(label,key,val){
 return field(label+' · satu butir per baris',key,(Array.isArray(val)?val:[]).join('\n'),3).replace('data-mt-field','data-mt-lines');
}
const RULES={
 kor:[['p','Proses Bisnis'],['s','Sistem Eksisting'],['o','Pemilik'],['dk','Dukungan'],['c','Celah']],
 pb:[['a','As-is'],['b','To-be'],['j','Jenis Perubahan']],
 cs:[['a','Keadaan Saat Ini'],['b','Keadaan Setelah Implementasi']],
 ms:[['y','Tahun'],['t','Milestone'],['g','Kelompok WBS']],
 kp:[['m','Milestone'],['k','Kriteria Penyelesaian (per baris)']],
 mf:[['m','Manfaat'],['asp','Aspek'],['pen','Penerima'],['ind','Indikator'],['mek','Pengukuran'],['base','Baseline'],['tgt','Target'],['wkt','Target Tercapai']],
 rk:[['t','Tindakan'],['s','Mulai (YYYY-MM)'],['e','Selesai (YYYY-MM)'],['u','UIC Utama'],['pd','UIC Pendukung']]
};
function rows(title,key,data,shape){
 const list=Array.isArray(data)?data:[],cols=RULES[shape||key]||[];
 return '<section class="mt-doc-rows" data-mt-listgroup="'+key+'"><div class="mt-doc-rowhead"><b>'+E(title)+'</b>'+
 (active&&active.edit?'<button type="button" data-mt-doc="add" data-mt-which="'+key+'">+ Tambah baris</button>':'')+'</div>'+
 (list.length?list:[{}]).map((o,i)=>'<div class="mt-doc-entry" data-mt-array-row>'+
 '<strong>'+String(i+1)+'</strong><div class="mt-doc-entrygrid">'+cols.map(([k,l])=>
 '<label><span>'+E(l)+'</span><textarea rows="2" data-mt-prop="'+k+'" '+(!active||!active.edit?'readonly':'')+'>'+
 E(Array.isArray(o?.[k])?o[k].join('\n'):o?.[k]||'')+'</textarea></label>').join('')+'</div>'+
 (active&&active.edit?'<button class="mt-doc-remove" type="button" data-mt-doc="remove" title="Hapus baris">×</button>':'')+'</div>').join('')+'</section>';
}
function form(){
 const c=active.draft,t=active.tab,project=active.kind==='project';
 if(t==='asis')return '<div class="mt-doc-grid">'+field('Uraian proses bisnis saat ini','asis.pb',c.asis?.pb,4)+field('Permasalahan utama','asis.masalah',c.asis?.masalah,4)+field('Teknologi yang digunakan','asis.tek',c.asis?.tek,3)+field('Tautan diagram','asis.link',c.asis?.link,2)+'</div>'+rows('Korelasi proses dengan sistem eksisting','asis.kor',c.asis?.kor,'kor');
 if(t==='tobe')return rows('Proses bisnis yang dimutakhirkan','tobe.pb',c.tobe?.pb,'pb')+'<div class="mt-doc-grid">'+listField('Potensi digitalisasi','tobe.pot',c.tobe?.pot)+field('Arsitektur aplikasi dan teknologi','tobe.ar',c.tobe?.ar,4)+field('Tautan diagram To-be','tobe.link',c.tobe?.link)+field('Tautan arsitektur','tobe.arLink',c.tobe?.arLink)+'</div>';
 if(t==='cs')return rows('Pasangan keadaan saat ini dan keadaan setelah implementasi','cs',c.cs,'cs');
 if(t==='ch'){
  const deck=makeDeck(c,active.kind);
  return (!active.edit?'<section class="mt-doc-slide-area"><div class="mt-doc-slide" data-mt-slide><div class="dk-scale">'+dkHtml(deck.slides[0])+'</div></div><p>Pratinjau menggunakan model slide yang sama persis dengan ekspor PPTX. Slide 2 Kriteria dan slide 3 Rencana Kerja turut diekspor.</p></section>':'')+
   '<div class="mt-doc-grid">'+field('Judul '+(project?'Proyek':'Program'),'judul',c.judul)+field('Tujuan '+(project?'Proyek':'Program'),'tujuan',c.tujuan,3)+field('Periode Mulai (tahun)','p1',c.p1,1)+field('Periode Selesai (tahun)','p2',c.p2,1)+listField('Latar Belakang','lb',c.lb)+field('Terobosan','tb',c.tb,3)+listField('Output','out',c.out)+listField('Outcome','oc',c.oc)+listField('Risiko','ris',c.ris)+listField('Pendukung Kesuksesan','pk',c.pk)+field('Initiative Champion','ch',c.ch)+listField('Initiative Owner','ow',c.ow)+'</div>'+rows('Key Milestones','ms',c.ms,'ms')+
   (project?'<section class="mt-doc-copy"><label>Salin Charter Program <select data-mt-copy-source><option value="">Pilih program sumber…</option>'+
    S.programs.filter(p=>p.psProgramCharter||chCur(p.akr)).map(p=>'<option value="'+E(p.id)+'">'+E(p.kode+' · '+p.nama)+'</option>').join('')+'</select></label><button type="button" data-mt-doc="copy">Salin ke Charter Proyek</button></section>':'');
 }
 if(t==='kp')return rows('Kriteria penyelesaian','kp',c.kp,'kp');
 if(t==='mf')return rows('Manfaat dan indikator','mf',c.mf,'mf');
 if(t==='rk')return rows('Linimasa dan UIC','rk',c.rk,'rk');
 return '';
}
function setDeep(obj,path,v){const keys=path.split('.');let t=obj;for(let i=0;i<keys.length-1;i++)t=t[keys[i]]||(t[keys[i]]={});t[keys[keys.length-1]]=v;}
function collect(){
 if(!active?.edit)return;
 const host=active.host?.querySelector('[data-mt-form]');if(!host)return;
 host.querySelectorAll('[data-mt-field]').forEach(x=>setDeep(active.draft,x.dataset.mtField,x.value));
 host.querySelectorAll('[data-mt-lines]').forEach(x=>setDeep(active.draft,x.dataset.mtLines,x.value.split(/\n/).map(x=>x.trim()).filter(Boolean)));
 host.querySelectorAll('[data-mt-listgroup]').forEach(group=>{
  const spec=RULES[group.dataset.mtListgroup.split('.').pop()]||[],arr=[];
  group.querySelectorAll('[data-mt-array-row]').forEach(row=>{
   const o={};row.querySelectorAll('[data-mt-prop]').forEach(input=>{
    const key=input.dataset.mtProp,val=input.value.trim();o[key]=key==='k'&&group.dataset.mtListgroup==='kp'?val.split(/\n/).map(x=>x.trim()).filter(Boolean):val;
   });
   if(Object.values(o).some(v=>Array.isArray(v)?v.length:!!v))arr.push(o);
  });
  setDeep(active.draft,group.dataset.mtListgroup,arr);
 });
 active.draft.p1=+active.draft.p1||active.draft.tahun;active.draft.p2=Math.max(+active.draft.p1,+active.draft.p2||active.draft.p1);
}
function makeDeck(d,kind){
 const D=chDeck3(d),p=S.programs.find(p=>p.akr===d.prog)||{};
 D.file='Charter_'+(kind==='program'?'Program_':'Proyek_')+
  String(p.kode||d.prog).replace(/[^A-Za-z0-9_-]+/g,'_')+'_'+(+d.tahun||'')+'_v'+(d.ver||1);
 D.title=(kind==='program'?'Charter Program':'Charter Proyek')+' — '+(d.judul||p.nama||d.prog);
 if(kind==='project')for(const sl of D.slides)for(const e of sl.E){
  if(typeof e.txt==='string'){
   if(e.txt==='Charter Program')e.txt='Charter Proyek';
   else if(e.txt==='TUJUAN PROGRAM')e.txt='TUJUAN PROYEK';
   else if(e.txt.startsWith('Charter Program Transformasi Kemenkeu'))e.txt=e.txt.replace('Charter Program','Charter Proyek');
   else if(e.txt.startsWith('Program Transformasi: '))e.txt=e.txt.replace('Program Transformasi: ','Proyek Transformasi: ');
  }
 }
 return D;
}
function fitSlide(root){
 (root||document).querySelectorAll('[data-mt-slide]').forEach(box=>{
  const w=box.clientWidth;const i=box.querySelector('.dk-scale');
  if(!w||!i)return;i.style.transform='scale('+(w/1280)+')';box.style.height=(w*720/1280)+'px';
 });
}
function controls(){
 const a=active,edit=canEdit(a.p,a.kind,a.source);
 return '<div class="mt-doc-actions">'+
 (a.kind==='project'?'<button data-mt-doc="import" type="button">↑ Import Charter PPTX</button>':'<button data-mt-doc="import" type="button">↑ Import PPTX</button>')+
 '<button data-mt-doc="preview" type="button">Pratinjau 3 Slide</button>'+
 '<button data-mt-doc="export" type="button">↓ Unduh PPTX</button>'+
 (a.kind==='project'&&a.source?.st==='Disahkan'&&chCan('U',a.p)?'<button data-mt-doc="revision" type="button">⧉ Buat Versi Revisi</button>':'')+
 (edit?(!a.edit?'<button data-mt-doc="edit" type="button">✎ Ubah</button>':
 '<button data-mt-doc="cancel-edit" type="button">Batal Ubah</button><button class="mt-doc-primary" data-mt-doc="save" type="button">Simpan</button>'):'<span class="mt-doc-locked">Baca saja · versi disahkan/izin terbatas</span>')+
 (a.native?'':'<button data-mt-doc="close" type="button">Tutup</button>')+
 '<input type="file" data-mt-import-file accept=".pptx" hidden></div>';
}
function aKindIsProgram(){return !!active&&active.native&&active.kind==='program'}
function paint(){
 if(!active||!active.host?.isConnected)return;
 const host=active.host,project=active.kind==='project';
 const nav=project?'<nav class="mt-doc-tabs" role="tablist">'+KEYS.map(([k,l],i)=>'<button type="button" role="tab" aria-selected="'+(k===active.tab)+'" class="'+(k===active.tab?'on':'')+'" data-mt-doc="tab" data-mt-tab="'+k+'"><i>'+(i+1)+'</i>'+l+'</button>').join('')+'</nav>':'';
 const doc='<div class="mt-doc-content"><div class="mt-doc-title"><div><small>DOKUMEN '+(project?(KEYS.findIndex(x=>x[0]===active.tab)+1)+' DARI 7':'CHARTER PROGRAM')+'</small><h3>'+(project?KEYS.find(x=>x[0]===active.tab)?.[1]:'Charter Program')+'</h3><p>'+E(active.p.kode+' · '+active.p.nama)+' · '+(active.source?.st||'Draft')+' · v'+(active.draft.ver||1)+'</p></div></div><div class="mt-doc-form" data-mt-form>'+form()+'</div></div>';
 if(active.native){
  const body=host.querySelector('.psbank-dialogbody');if(body)body.innerHTML=doc;
  const footer=host.querySelector('.psbank-dialog>footer>div');
  if(footer&&aKindIsProgram()){
   const editable=canEdit(active.p,active.kind,active.source);
   footer.innerHTML='<div class="mt-charter-tools">'+
    '<button type="button" class="btn" data-mt-doc="import">↑ Import PPTX</button>'+
    '<button type="button" class="btn" data-mt-doc="preview">Pratinjau 3 Slide</button>'+
    '<button type="button" class="btn pri" data-mt-doc="export">↓ Unduh PPTX</button>'+
    '<input type="file" data-mt-import-file accept=".pptx" hidden></div>'+
    '<div class="mt-charter-default-actions">'+
    '<button type="button" class="btn" data-bank-preview-edit '+(!editable?'disabled':'')+'>✎ Ubah</button>'+
    '<button type="button" class="btn" data-bank-preview-save '+(!editable||!active.edit?'disabled':'')+'>Simpan</button>'+
    '<button type="button" class="btn pri" data-bank-preview-saveclose> Simpan &amp; Tutup</button></div>';
  }else if(footer)footer.innerHTML=controls();
 }else{
  host.innerHTML='<section class="mt-doc-dialog" role="dialog" aria-modal="true" aria-label="Detail Dokumen Proyek"><header><div><b>Detail Dokumen Proyek</b><small>'+E(active.p.nama)+' · '+E(active.p.kode)+' · '+active.draft.tahun+'</small></div><button type="button" data-mt-doc="close" title="Tutup">×</button></header>'+nav+'<main class="mt-doc-scroll">'+doc+'</main><footer>'+controls()+'</footer></section>';
 }
 requestAnimationFrame(()=>fitSlide(host));
}
function start(p,kind,host,native=false){
 const source=getSource(p,kind),draft=clone(source||empty(p,kind));
 active={p,kind,host,native,source,draft,tab:'ch',edit:false,year:kind==='program'?(+p.psYear||+S.ui.psSelectedYear||2026):(+S.ui.tahun||2026)};
 if(kind==='project')active.tab='asis';
 paint();
}
function openProject(p,tab='asis',edit=false){
 if(document.querySelector('.mt-doc-overlay'))return;
 const ov=document.createElement('div');ov.className='mt-doc-overlay';
 (document.querySelector('#app')||document.body).appendChild(ov);start(p,'project',ov);if(KEYS.some(x=>x[0]===tab))active.tab=tab;if(edit&&canEdit(p,'project',active.source))active.edit=true;paint();
}
function persist(){
 if(!active||!canEdit(active.p,active.kind,active.source)){toast('Tidak memiliki hak mengubah dokumen ini.');return false}
 collect();
 const d=clone(active.draft);d.st=d.st||'Draft';
 if(active.kind==='project'){
  const idx=S.charters.findIndex(x=>x.id===d.id);
  if(idx>=0)S.charters[idx]=d;else S.charters.push(d);
 }else active.p.psProgramCharter=d;
 active.source=clone(d);active.edit=false;save();paint();toast('Dokumen tersimpan. Pratinjau dan ekspor memakai versi yang sama.');return true;
}
async function parseImportedCharters(file){
 let parsed=[],failure=null;
 try{parsed=await pptxcharters(file)}catch(e){failure=e}
 if(parsed.length)return parsed;
 // The legacy parser expects "Program Transformasi"; include newly generated
 // "Proyek Transformasi" decks from the same renderer as importable sources.
 if(!window.JSZip){
  await chLib('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!window.JSZip);
 }
 const zip=await JSZip.loadAsync(file),names=Object.keys(zip.files)
  .filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n))
  .sort((a,b)=>+(a.match(/slide(\d+)/)||[])[1]-+(b.match(/slide(\d+)/)||[])[1]);
 const entries=[];
 for(const name of names){
  const data=await zip.file(name).async('string');
  const doc=new DOMParser().parseFromString(data,'application/xml');
  if(doc.querySelector('parsererror'))continue;
  const texts=[...doc.getElementsByTagNameNS('*','sp')].map(shape=>
   [...shape.getElementsByTagNameNS('*','t')].filter(t=>t.namespaceURI?.includes('drawingml'))
    .map(t=>t.textContent||'').join('\n').trim()).filter(Boolean);
  const titleRaw=texts.find(t=>/^(?:Program|Proyek) Transformasi\s*:/i.test(t));
  if(!titleRaw)continue;
  const judul=titleRaw.replace(/^(?:Program|Proyek) Transformasi\s*:\s*/i,'').trim();
  const headings=['Latar Belakang','Terobosan','Output','Outcome','Key Milestones','Risiko','Pendukung Kesuksesan','UNIT PENGELOLA','Initiative Champion','Initiative Owner'];
  const start=t=>headings.findIndex(h=>h.toLowerCase()===String(t).toLowerCase());
  const between=h=>{
   const i=texts.findIndex(t=>t.trim().toLowerCase()===h.toLowerCase());
   if(i<0)return [];
   const out=[];
   for(let j=i+1;j<texts.length;j++){
    if(start(texts[j])>=0||/^\d{1,2}\s*\/\s*3$/.test(texts[j]))break;
    if(!/^\s*(?:—|-|belum diisi)\s*$/i.test(texts[j]))out.push(...texts[j].split(/\n/).map(v=>v.trim()).filter(Boolean));
   }
   return out;
  };
  const goalAt=texts.findIndex(t=>/^TUJUAN (PROGRAM|PROYEK)$/i.test(t));
  const tujuan=goalAt>=0?(texts[goalAt+1]||''):'';
  const rawPeriod=texts.find(t=>/^20\d{2}\s*[–-]\s*20\d{2}$/.test(t));
  const periods=rawPeriod?.match(/20\d{2}/g)||[];
  const y=+S.ui.psSelectedYear||+S.ui.tahun||2026;
  const d={judul,prog:'',tujuan,lb:between('Latar Belakang'),tb:between('Terobosan').join('\n'),
   out:between('Output'),oc:between('Outcome'),ris:between('Risiko'),
   pk:between('Pendukung Kesuksesan'),ms:[],ow:between('Initiative Owner'),
   champion:between('Initiative Champion')[0]||'',p1:+periods[0]||y,p2:+periods[1]||+periods[0]||y,
   kp:[],cs:[],rk:[],sourceSlide:+(name.match(/slide(\d+)/)||[])[1]};
  entries.push(d);
 }
 if(!entries.length)throw (failure||new Error('Teks Charter tidak dikenali. Gunakan PPTX berisi teks yang dapat diedit, bukan gambar slide.'));
 return entries;
}
async function importFile(file){
 if(!file||!/\.pptx$/i.test(file.name))return toast('Pilih file PPTX.');
 if(!canEdit(active.p,active.kind,active.source))return toast('Tidak memiliki akses untuk import.');
 if(active.edit)collect();
 try{
  const all=await parseImportedCharters(file);
  const x=all.find(z=>z.prog===active.p.akr)||all.find(z=>String(z.judul||'').toLowerCase()===String(active.p.nama).toLowerCase())||(all.length===1?all[0]:null);
  if(!x)return toast('Tidak ditemukan charter yang cocok. Gunakan PPTX template Charter dengan teks yang dapat diedit.');
  const d=active.draft;
  [['judul','judul'],['tujuan','tujuan'],['lb','lb'],['tb','tb'],['out','out'],['oc','oc'],['ms','ms'],['ris','ris'],['pk','pk'],['ow','ow'],['kp','kp'],['cs','cs']].forEach(([to,from])=>{
   if(x[from]!=null&&(Array.isArray(x[from])?x[from].length:String(x[from]).trim()))d[to]=clone(x[from]);
  });
  if(x.champion)d.ch=x.champion;
  if(x.p1)d.p1=+x.p1;if(x.p2)d.p2=+x.p2;
  d.sumberPptx=file.name;active.edit=true;paint();
  toast('Data PPTX dimuat ke draft. Periksa dan klik Simpan agar tersimpan pada program yang benar.');
 }catch(err){toast('Impor gagal: '+(err.message||err))}
}
function copyProgram(){
 const id=active.host.querySelector('[data-mt-copy-source]')?.value;
 const p=S.programs.find(x=>String(x.id)===String(id));
 const from=p&&getSource(p,'program');
 if(!from)return toast('Pilih Charter Program yang sudah terisi.');
 if(active.edit)collect();
 for(const k of ['tujuan','lb','tb','out','oc','ms','ris','pk','ch','ow']){
  active.draft[k]=clone(from[k]|| (['lb','out','oc','ms','ris','pk','ow'].includes(k)?[]:''));
 }
 active.edit=true;paint();toast('Substansi Charter Program disalin. Sesuaikan ruang lingkup proyek, lalu Simpan.');
}
async function onAction(btn){
 const a=btn.dataset.mtDoc;
 if(a==='close'){active?.host?.remove();active=null;return}
 if(!active)return;
 if(a==='tab'){if(active.edit)collect();active.tab=btn.dataset.mtTab;paint();return}
 if(a==='edit'){if(!canEdit(active.p,active.kind,active.source))return toast('Hak akses ubah tidak tersedia.');active.edit=true;paint();return}
 if(a==='cancel-edit'){active.draft=clone(active.source||empty(active.p,active.kind));active.edit=false;paint();return}
 if(a==='revision'){
  const prior=active.source;if(active.kind!=='project'||prior?.st!=='Disahkan'||!chCan('U',active.p))return;
  const versions=(S.charters||[]).filter(c=>c.prog===active.p.akr).map(c=>+c.ver||0);
  active.draft=clone(prior);active.draft.id=uid();active.draft.ver=Math.max(1,...versions)+1;
  active.draft.st='Draft';active.draft.log=(active.draft.log||[]).concat({st:'Draft',by:ME?.nama||ME?.email||'PMO',at:TODAY});
  active.source=null;active.edit=true;paint();
  toast('Draf revisi disiapkan, versi disahkan tetap terlindungi. Klik Simpan untuk menyimpan revisi.');return;
 }
 if(a==='save'){persist();return}
 if(a==='add'){
  collect();const k=btn.dataset.mtWhich;let obj={};
  for(const [prop] of RULES[k.split('.').pop()]||[])obj[prop]=prop==='k'?[]:'';
  const keys=k.split('.');let t=active.draft;for(let i=0;i<keys.length-1;i++)t=t[keys[i]]||(t[keys[i]]={});
  (t[keys[keys.length-1]]||(t[keys[keys.length-1]]=[])).push(obj);paint();return;
 }
 if(a==='remove'){collect();const grp=btn.closest('[data-mt-listgroup]'),k=grp.dataset.mtListgroup;
  const pos=[...grp.querySelectorAll('[data-mt-array-row]')].indexOf(btn.closest('[data-mt-array-row]'));
  const parts=k.split('.');let t=active.draft;for(const part of parts)t=t[part];if(Array.isArray(t))t.splice(pos,1);paint();return;
 }
 if(a==='copy'){copyProgram();return}
 if(a==='import'){active.host.querySelector('[data-mt-import-file]')?.click();return}
 if(a==='preview'||a==='export'){
  if(active.edit)collect();
  const D=makeDeck(active.draft,active.kind);
  if(a==='preview'){const h='<div class="dk-wrap">'+D.slides.map((sl,i)=>'<figure class="dk-f"><div class="dk-box"><div class="dk-scale">'+dkHtml(sl)+'</div></div><figcaption>'+E((i+1)+'. '+sl.n)+'</figcaption></figure>').join('')+'</div>';
   const ov=modal('Pratinjau · '+E(D.title),h,null,null,{size:'wide dk-md',cancel:'Tutup'});
   ov.style.zIndex='27000';
   const fit=()=>ov.querySelectorAll('.dk-scale').forEach(x=>{let w=x.parentElement.clientWidth;x.style.transform='scale('+(w/1280)+')';x.parentElement.style.height=(w*720/1280)+'px'});
   requestAnimationFrame(fit);setTimeout(fit,100);
  }else try{await dkPptx(D);toast('PPTX '+D.file+'.pptx berhasil dibuat.')}catch(err){toast('Ekspor gagal: '+(err.message||err))}
 }
}
document.addEventListener('click',ev=>{
 const row=ev.target.closest('[data-bank-detailrow],[data-bank-doc],[data-bank-edit-doc],[data-bank-upload]');
 if(row)lastProgramId=row.dataset.bankDetailrow||row.dataset.bankDoc||row.dataset.bankEditDoc||row.dataset.bankUpload||lastProgramId;
 const tb=ev.target.closest('table.pdocs tbody tr');
 if(tb&&VIEW==='pmo-perencanaan'&&lv('charter')!=='-'){
  const pId=tb.querySelector('[data-p]')?.dataset.p;
  const p=S.programs.find(x=>x.akr===pId);
  if(p){
   const selected=ev.target.closest('[data-s],[data-act="ched"],[data-act="chver"]');
   const requested=String(selected?.dataset.s||'');
   const stepMap={id:'ch',isi:'ch',ms:'ch',rv:'ch'};
   const tab=KEYS.some(x=>x[0]===requested)?requested:stepMap[requested]||'asis';
   const edit=!!ev.target.closest('[data-act="ched"],[data-act="chver"],[data-act="chnew"]');
   ev.preventDefault();ev.stopImmediatePropagation();openProject(p,tab,edit);
   if(ev.target.closest('[data-act="chver"]'))onAction({dataset:{mtDoc:'revision'}});
   return;
  }
 }
 const pro=ev.target.closest('[data-mt-program-charter]');
 if(pro){
  ev.preventDefault();ev.stopImmediatePropagation();
  const dialog=pro.closest('.psbank-dialog'),key=S.ui.psBank?.preview?.key||'',id=key.split(':')[0]||lastProgramId;
  const p=S.programs.find(x=>String(x.id)===String(id));
  if(!p)return toast('Data program tidak ditemukan.');
  if(S.ui.psBank?.preview?.dirty){toast('Simpan dahulu perubahan pada tab sebelumnya.');return}
  if(inline?.edit&&active===inline)collect();
  dialog.querySelectorAll('.psbank-dialogtabs button').forEach(x=>{x.classList.toggle('on',x===pro);x.setAttribute('aria-selected',String(x===pro))});
  start(p,'program',dialog,true);inline=active;return;
 }
 if(inline&&active===inline&&inline.native){
  const nativeAction=ev.target.closest('[data-bank-preview-edit],[data-bank-preview-save],[data-bank-preview-saveclose]');
  if(nativeAction&&inline.host?.contains(nativeAction)){
   ev.preventDefault();ev.stopImmediatePropagation();
   if(nativeAction.hasAttribute('data-bank-preview-edit')){
    if(canEdit(inline.p,inline.kind,inline.source)){inline.edit=true;paint()}
   }else if(nativeAction.hasAttribute('data-bank-preview-save')){
    if(inline.edit)persist();
   }else{
    if(inline.edit&&!persist())return;
    const host=inline.host;active=null;inline=null;host?.remove();
    render();
   }
   return;
  }
 }
 const b=ev.target.closest('[data-mt-doc]');
 if(b&&active?.host?.contains(b)){
  ev.preventDefault();ev.stopImmediatePropagation();onAction(b);return;
 }
 if(inline&&active===inline&&ev.target.closest('.psbank-dialogtabs [data-bank-pstep]')){
  if(inline.edit&&!persist()){ev.preventDefault();ev.stopImmediatePropagation();return}
  const nav=inline.host?.querySelector('.psbank-dialogtabs');
  nav?.querySelectorAll('[data-mt-program-charter]').forEach(x=>{x.classList.remove('on');x.setAttribute('aria-selected','false')});
  active=null;inline=null;
 }
},true);
document.addEventListener('change',ev=>{
 const file=ev.target.closest('[data-mt-import-file]');
 if(file&&active?.host?.contains(file)){ev.stopImmediatePropagation();const f=file.files?.[0];file.value='';if(f)importFile(f)}
},true);
document.addEventListener('keydown',ev=>{
 if(['Enter',' '].includes(ev.key)&&VIEW==='pmo-perencanaan'&&ev.target.matches('table.pdocs tbody tr')){
  const id=ev.target.querySelector('[data-p]')?.dataset.p,p=S.programs.find(x=>x.akr===id);
  if(p){ev.preventDefault();openProject(p);return}
 }
 if(ev.key==='Escape'&&active&&!active.native&&active.host?.isConnected){active.host.remove();active=null}
},true);
function decorate(){
 document.querySelectorAll('table.pdocs tbody tr').forEach(row=>{
  if(row.tabIndex!==0)row.tabIndex=0;
  row.setAttribute('role','button');
  row.setAttribute('aria-label','Buka detail dokumen proyek '+(row.querySelector('td b')?.textContent||''));
 });
 document.querySelectorAll('.psbank-detail-table tbody tr[data-bank-detailrow]').forEach(row=>{
  if(row.querySelector('[data-mt-download-list]'))return;
  const id=row.dataset.bankDetailrow,p=S.programs.find(x=>String(x.id)===String(id));
  if(!p)return;
  const y=+S.ui.psSelectedYear||+S.ui.tahun||2026;
  const items=(window.MT_PS_DOC?.history?.('program',p.id,y)||[]).filter(x=>x.status==='uploaded'||x.status==='signed');
  if(!items.length)return;
  const actions=row.querySelector('.psbank-program-actions');
  if(!actions)return;
  const b=document.createElement('button');b.type='button';b.dataset.bankUpload=p.id;
  b.dataset.mtDownloadList='1';b.className='psbank-action-icon psbank-program-action download';
  b.title='Unduh Dokumen Program ('+items.length+' berkas)';
  b.setAttribute('aria-label','Unduh Dokumen Program — '+items.length+' berkas unggahan');
  b.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 17v4h14v-4"/></svg>';
  actions.appendChild(b);
 });
 document.querySelectorAll('.psbank-dialogtabs').forEach(nav=>{
  if(nav.querySelector('[data-mt-program-charter]'))return;
  const b=document.createElement('button');b.type='button';b.dataset.mtProgramCharter='1';b.setAttribute('role','tab');
  b.setAttribute('aria-selected','false');b.textContent='Charter Program';nav.insertBefore(b,nav.querySelector('[data-bank-pstep="docs"]')||null);
 });
 const d=document.querySelector('.psbank-upload-dialog');
 if(d){
  const records=d.querySelectorAll('.psbank-upload-record');
  records.forEach(row=>{
   if(row.querySelector('[data-mt-file-check]'))return;
   const id=row.querySelector('[data-doc-proof-open]')?.dataset.docProofOpen;
   if(!id)return;
   const cb=document.createElement('label');cb.className='mt-file-select';
   cb.innerHTML='<input type="checkbox" data-mt-file-check="'+E(id)+'" aria-label="Pilih dokumen '+E(row.querySelector('b')?.textContent||'')+'">';
   row.prepend(cb);
  });
  const hist=d.querySelector('.psbank-upload-hist-head');
  if(hist&&!hist.querySelector('[data-mt-bulk-download]')&&records.length){
   const bulk=document.createElement('div');bulk.className='mt-bulk-tools';bulk.innerHTML='<label><input type="checkbox" data-mt-check-all> Semua</label><button type="button" data-mt-bulk-download>↓ Unduh Dipilih (ZIP)</button>';hist.appendChild(bulk);
  }
 }
}
let observed=false;
function boot(){
 if(observed)return;observed=true;
 const orig=window.MT_PROJECT_SELECTION?.page;
 if(orig){
  window.MT_PROJECT_SELECTION.page=function(){
   const b=S.ui.psBank||{},u=S.ui.psFlow||{},key=u.tab==='usulan'?'usulan:'+(b.tab||'bank'):u.tab;
   const f=b.filterScopes?.[key],y=f?.year;
   if(/^20\d{2}$/.test(String(y||''))&&+S.ui.psSelectedYear!==+y)S.ui.psSelectedYear=+y;
   return orig.apply(this,arguments);
  };
 }
 const ob=new MutationObserver(()=>decorate());ob.observe(document.body,{subtree:true,childList:true});decorate();
 addEventListener('resize',()=>{if(active?.host?.isConnected)fitSlide(active.host)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('click',async ev=>{
 const all=ev.target.closest('[data-mt-check-all]');if(all){const root=all.closest('.psbank-upload-dialog');root?.querySelectorAll('[data-mt-file-check]').forEach(c=>c.checked=all.checked);return}
 const btn=ev.target.closest('[data-mt-bulk-download]');if(!btn)return;
 ev.preventDefault();ev.stopImmediatePropagation();
 const root=btn.closest('.psbank-upload-dialog'),ids=[...root.querySelectorAll('[data-mt-file-check]:checked')].map(c=>c.dataset.mtFileCheck);
 if(!ids.length)return toast('Centang berkas yang ingin diunduh.');
 const Docs=window.MT_PS_DOC;
 if(typeof Docs?.readLocalProof!=='function')return toast('Pembaca arsip lokal belum tersedia.');
 try{
  if(!window.JSZip)await chLib('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!window.JSZip);
  const zip=new JSZip();
  for(let i=0;i<ids.length;i++){
   const button=root.querySelector('[data-doc-proof-open="'+CSS.escape(ids[i])+'"]'),name=button?.dataset.docProofName||'Lampiran_'+(i+1);
   zip.file(String(i+1).padStart(2,'0')+'_'+name,await Docs.readLocalProof(ids[i]));
  }
  const blob=await zip.generateAsync({type:'blob'});
  const pfx='Dokumen_Program_Dipilih_'+new Date().toISOString().slice(0,10)+'.zip';
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=pfx;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  toast(ids.length+' dokumen disiapkan dalam ZIP.');
 }catch(err){toast('Unduh ZIP gagal: '+(err.message||err))}
},true);
const css=document.createElement('style');css.textContent=`
 .psbank-dialog>footer>div:has(.mt-charter-tools){display:flex;align-items:center;gap:8px;min-width:0;flex:1;justify-content:flex-end}
 .mt-charter-tools,.mt-charter-default-actions{display:flex;align-items:center;gap:7px;flex:0 0 auto}
 .mt-charter-tools{margin-right:auto}
 .mt-charter-tools>.btn,.mt-charter-default-actions>.btn{height:38px;white-space:nowrap;font:750 12px 'Inter',sans-serif}
 .psbank-dialogtabs>[data-mt-program-charter]:not([aria-selected="true"]){background:transparent!important;border-color:transparent!important;border-bottom:3px solid transparent!important;box-shadow:none!important;color:#5d718b!important}
 .psbank-dialogtabs>[data-mt-program-charter][aria-selected="true"]{background:#fff!important;border-bottom:3px solid #ffb71b!important;color:#153c67!important}
 @media(max-width:1100px){.psbank-dialog>footer>div:has(.mt-charter-tools){flex-wrap:wrap}.mt-charter-tools{margin-right:0}}
 #toast{z-index:29000!important}\n.mt-doc-overlay{position:fixed;inset:0;background:#06162bd1;z-index:22000;display:grid;place-items:center;padding:16px;font-family:inherit}
.mt-doc-dialog{height:min(90vh,940px);width:min(1490px,96vw);background:#fff;border-radius:14px;display:flex;flex-direction:column;overflow:hidden;color:#102d50;box-shadow:0 22px 70px #03152a66}
.mt-doc-dialog>header{display:flex;align-items:center;justify-content:space-between;gap:16px;background:#0d2d52;color:#fff;padding:15px 21px;min-height:68px}
.mt-doc-dialog>header b{font-size:19px}.mt-doc-dialog>header small{display:block;font-size:12px;opacity:.8;margin-top:3px}
.mt-doc-dialog>header button{background:transparent;border:1px solid #a9bdd0;color:#fff;border-radius:8px;width:34px;height:34px;font-size:22px;cursor:pointer}
.mt-doc-tabs{background:#eaf1fa;padding:5px 10px;display:flex;gap:5px;flex:0 0 auto;overflow-x:auto}
.mt-doc-tabs button{border:1px solid transparent;background:transparent;flex:1 0 auto;padding:11px 10px;color:#526982;font-size:12px;font-weight:700;border-radius:8px;white-space:nowrap;cursor:pointer}
.mt-doc-tabs button.on{background:#fff;color:#153d6e;border-color:#cedbec;border-bottom:3px solid #ffbd18}
.mt-doc-tabs i{display:inline-grid;place-items:center;width:21px;height:21px;border-radius:50%;background:#dce6f3;margin-right:7px;font-style:normal}
.mt-doc-tabs button.on i{background:#ffbd18;color:#072e53}
.mt-doc-scroll{flex:1;overflow:auto;padding:14px 18px}
.mt-doc-content{min-width:0}.mt-doc-title{padding:11px 14px;background:#f1f5fa;border:1px solid #dfebf6;border-radius:10px;margin-bottom:12px}
.mt-doc-title small{font-size:10px;font-weight:800;letter-spacing:.07em;color:#42638a}.mt-doc-title h3{font-size:18px;margin:4px 0;color:#102d52}.mt-doc-title p{font-size:12px;margin:0;color:#536d87}
.mt-doc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.mt-doc-field,.mt-doc-entrygrid label{display:flex;flex-direction:column;gap:5px;min-width:0;font-size:11px;font-weight:800;color:#234e77}
.mt-doc-field textarea,.mt-doc-entrygrid textarea{width:100%;box-sizing:border-box;resize:vertical;border:1px solid #cbdbea;border-radius:8px;padding:9px 11px;min-height:39px;font:12px/1.5 inherit;color:#153250;background:#fff}
.mt-doc-field textarea[readonly],.mt-doc-entrygrid textarea[readonly]{background:#f8fafc;cursor:default}
.mt-doc-rows{border:1px solid #d4e0ed;border-radius:10px;padding:10px 12px;margin-top:10px;background:#f4f7fb}
.mt-doc-rowhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;color:#123c65;font-size:12px}
.mt-doc-rowhead button,.mt-doc-copy button{background:#fef6dd;color:#0a3963;border:1px solid #e9bf52;border-radius:7px;padding:7px 10px;cursor:pointer}
.mt-doc-entry{display:flex;align-items:flex-start;gap:9px;background:#fff;border:1px solid #d7e4f0;border-radius:9px;padding:9px;margin-bottom:8px}
.mt-doc-entry>strong{min-width:22px;text-align:center;background:#102e52;color:#fff;border-radius:6px;padding:5px;font-size:11px}
.mt-doc-entrygrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:8px;flex:1;min-width:0}
.mt-doc-remove{background:#fff;border:1px solid #f3c6c6;color:#b83232;font-size:18px;border-radius:7px;cursor:pointer}
.mt-doc-copy{display:flex;gap:8px;align-items:flex-end;margin-top:12px;flex-wrap:wrap}.mt-doc-copy label{font-size:12px;display:flex;flex-direction:column;gap:5px}
.mt-doc-copy select{padding:8px;border:1px solid #cbdbea;border-radius:8px;min-width:270px}
.mt-doc-dialog>footer{border-top:1px solid #dce7f0;background:#fff;padding:10px 15px}
.mt-doc-actions{display:flex;align-items:center;gap:8px;justify-content:flex-end;flex-wrap:wrap}
.mt-doc-actions>button{font:700 12px inherit;padding:9px 13px;background:#fff;color:#173b61;border:1px solid #d3dfec;border-radius:8px;cursor:pointer}
.mt-doc-actions .mt-doc-primary,.mt-doc-actions>button[data-mt-doc="export"]{background:#0c2f58;color:#fff;border-color:#0c2f58}
.mt-doc-locked{font-size:11px;color:#7a869a}
.mt-doc-slide-area{padding:10px;border:1px solid #d9e4ef;border-radius:9px;margin-bottom:12px}
.mt-doc-slide{position:relative;width:100%;min-height:160px;overflow:hidden;background:#fff}.mt-doc-slide .dk-scale{width:1280px;height:720px;position:absolute;inset:0;transform-origin:0 0}
.mt-doc-slide .dk-s,.ov .dk-s{font-family:Calibri,Arial,sans-serif!important}\n.mt-doc-slide-area p{font-size:11px;color:#687b90;margin:8px 0 0}
.psbank-dialogtabs [data-mt-program-charter]{white-space:nowrap}
.psbank-dialogbody .mt-doc-content{padding:12px 3px}
.psbank-dialog>footer .mt-doc-actions{justify-content:flex-end}
table.pdocs tbody tr{cursor:pointer}table.pdocs tbody tr:hover{background:#eef5ff}table.pdocs tbody tr:focus-visible{outline:2px solid #16538a;outline-offset:-2px}\n.mt-row-download{background:#eef5ff;color:#17436c;border:1px solid #cddff4;border-radius:7px;padding:6px 8px;font:700 11px inherit;white-space:nowrap;cursor:pointer}.mt-file-select{display:flex;align-items:center;flex:0 0 auto;padding:6px}.mt-bulk-tools{display:flex;gap:9px;align-items:center;flex-wrap:wrap;font-size:12px}
.mt-bulk-tools button{border:1px solid #c4d5e9;background:#f4f8ff;border-radius:7px;color:#113b65;font-weight:800;padding:7px;cursor:pointer}
@media(max-width:840px){.mt-doc-grid{grid-template-columns:minmax(0,1fr)}.mt-doc-dialog{width:100%;height:95vh}.mt-doc-actions{justify-content:center}.mt-doc-scroll{padding:10px}}
`;document.head.appendChild(css);
})();
