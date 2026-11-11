/* Inline Document Builder & preview; Word/PDF/PPTX native export. */
(function(){
'use strict';
const B=window.MT_PROJECT_SELECTION,I=B?.internals;if(!B||!I)return;
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const X=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
// Hanya kode yang diisi/ditetapkan yang dinyatakan sebagai kode resmi dalam dokumen.
const officialCode=p=>String(p?.kodeResmi||'').trim()||'Belum ditetapkan';
const PPTX_STYLE=Object.freeze({navy:'102F56',mid:'1F4F81',gold:'F9B919',white:'FFFFFF',pale:'F0F5FA',text:'254568',muted:'657E98',font:'Aptos'});
const STEPS=[['identity','Identitas'],['case','Business Case'],['benefits','Manfaat'],['stakeholders','Stakeholder'],['risks','Risiko'],['governance','Tata Kelola'],['charter','Charter Program']];
const year=()=>+S.ui.psSelectedYear||+S.ui.tahun||2026;
const cfg=()=>{S.ui.psBank=S.ui.psBank||{};const b=S.ui.psBank;b.doc=b.doc||{format:'word',sections:STEPS.map(x=>x[0]),cover:true,toc:true,sign:true,annex:true,slide:0};b.doc.sections=[...new Set((Array.isArray(b.doc.sections)?b.doc.sections:STEPS.map(x=>x[0])).filter(k=>STEPS.some(s=>s[0]===k)))];return b.doc};
const title=k=>STEPS.find(s=>s[0]===k)?.[1]||(k==='review'?'Reviu':k);

/* Versi resmi terkunci hanya sesudah PDF hasil TTE diunggah sebagai bukti.
   Metadata disimpan melalui save(); berkas asli hanya tersimpan secara lokal di IndexedDB
   sampai tersedia backend lampiran privat. Tidak mengklaim verifikasi kriptografis TTE. */
const reg=()=>{S.psVersionLedger=S.psVersionLedger||{};return S.psVersionLedger};
const docKey=(kind,id,y)=>[kind,String(id),String(y)].join(':');
const programKey=p=>docKey('program',p.id||p.akr,year());
function history(kind,id,y){return reg()[docKey(kind,id,y)]||[]}
function nextVersion(kind,id,y){
 const issued=history(kind,id,y).filter(x=>x.status==='signed').reduce((n,x)=>Math.max(n,+x.version||0),0);
 return issued+1;
}
function registerExport(kind,id,y,format,fileName,options={}){
 const key=docKey(kind,id,y),rows=reg()[key]||(reg()[key]=[]);
 const version=nextVersion(kind,id,y);
 rows.push({id:'exp-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),kind,version,format,fileName,
  status:'generated',createdAt:new Date().toISOString(),by:ME?.email||'',sections:options.sections||[]});
 save();return version;
}
function localProof(id,file){
 return new Promise((resolve,reject)=>{
  if(!window.indexedDB)return reject(new Error('Penyimpanan bukti lokal tidak tersedia di browser ini.'));
  const req=window.indexedDB.open('mt-signed-documents',1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('proofs'))req.result.createObjectStore('proofs')};
  req.onerror=()=>reject(new Error('Tidak dapat membuka penyimpanan bukti lokal.'));
  req.onsuccess=()=>{
   const db=req.result,tx=db.transaction('proofs','readwrite');
   tx.objectStore('proofs').put(file,id);
   tx.oncomplete=()=>{db.close();resolve()};
   tx.onerror=()=>{db.close();reject(new Error('Gagal menyimpan bukti lokal.'))};
  };
 });
}

function readLocalProof(id){
 return new Promise((resolve,reject)=>{
  if(!window.indexedDB)return reject(new Error('Penyimpanan lokal tidak tersedia.'));
  const req=window.indexedDB.open('mt-signed-documents',1);
  req.onerror=()=>reject(new Error('Gagal membuka arsip bukti pada perangkat ini.'));
  req.onsuccess=()=>{
   const db=req.result;if(!db.objectStoreNames.contains('proofs')){db.close();reject(new Error('Arsip lokal belum tersedia.'));return}
   const transaction=db.transaction('proofs','readonly'),get=transaction.objectStore('proofs').get(id);
   get.onsuccess=()=>{const file=get.result;db.close();file?resolve(file):reject(new Error('Berkas tidak ditemukan di browser ini.'))};
   get.onerror=()=>{db.close();reject(new Error('Gagal membaca berkas.'))};
  };
 });
}
async function openSignedProof(ev){
 const button=ev.target.closest('[data-doc-proof-open]');if(!button)return false;
 try{const blob=await readLocalProof(button.dataset.docProofOpen),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=String(button.dataset.docProofName||'Bukti_TTE.pdf');document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),6000)}
 catch(error){toast(error.message||String(error))}
 return true;
}
async function confirmSigned(kind,id,y,file,attested){
 if(!file||!/\.pdf$/i.test(file.name)||file.type&&!/pdf/i.test(file.type))throw new Error('Unggah bukti hasil TTE dalam format PDF.');
 if(!attested)throw new Error('Konfirmasi bahwa dokumen telah ditandatangani secara elektronik.');
 if(file.size>25*1024*1024)throw new Error('Berkas terlalu besar (maksimum 25 MB).');
 const version=nextVersion(kind,id,y),list=history(kind,id,y);
 if(!list.some(x=>x.version===version&&x.status==='generated'))throw new Error('Unduh dokumen versi '+version+' terlebih dahulu, lalu unggah bukti TTE.');
 if(!window.crypto?.subtle)throw new Error('Browser memerlukan konteks HTTPS untuk menghitung fingerprint berkas.');
 const hash=Array.from(new Uint8Array(await window.crypto.subtle.digest('SHA-256',await file.arrayBuffer()))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const proof='proof-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
 await localProof(proof,file);
 const key=docKey(kind,id,y);
 reg()[key].push({id:proof,kind,version,status:'signed',fileName:file.name,fileSize:file.size,hash,
  createdAt:new Date().toISOString(),by:ME?.email||'',signatureVerification:'belum diverifikasi secara kriptografis',
  fileStorage:'IndexedDB lokal perangkat ini'});
 save();return version;
}

/* External program documents (DOCX/PDF/PPTX) are attachments in the same
   version ledger; unlike an electronically signed PDF they never advance vN. */
async function uploadProgramAttachment(p,y,file,description=''){
 if(!p||!p.id)throw new Error('Program tujuan tidak ditemukan.');
 if(!file)throw new Error('Pilih dokumen yang akan diunggah.');
 const ext=(String(file.name||'').match(/\.([^.]+)$/)||[])[1]?.toLowerCase()||'';
 if(!['pdf','docx','pptx'].includes(ext))throw new Error('Format dokumen hanya PDF, DOCX, atau PPTX.');
 if(file.size>25*1024*1024)throw new Error('Maksimum ukuran dokumen 25 MB.');
 const version=nextVersion('program',p.id,y);
 const fileId='attachment-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
 await localProof(fileId,file);
 const key=docKey('program',p.id,y);
 reg()[key]=reg()[key]||[];
 reg()[key].push({id:fileId,kind:'program',version,status:'uploaded',format:ext,
  fileName:file.name,fileSize:file.size,description:String(description||'').trim(),
  createdAt:new Date().toISOString(),by:ME?.email||'',
  fileStorage:'IndexedDB lokal perangkat ini'});
 save();return {id:fileId,version};
}

function versionPanel(kind,id,y){
 const rows=history(kind,id,y).slice().reverse(),ver=nextVersion(kind,id,y);
 return '<details class="psbank-version-panel"><summary>Riwayat Dokumen & Versi <b>Draft v'+ver+'</b></summary>'+
 '<p>Nomor versi baru hanya diterbitkan setelah PDF bertanda tangan elektronik diunggah sebagai bukti dukung. Pengunduhan ulang tidak menaikkan nomor versi.</p>'+
 '<div class="psbank-version-upload"><label>Unggah PDF hasil TTE<input type="file" accept="application/pdf,.pdf" data-doc-signed-file></label>'+
 '<label class="psbank-version-attest"><input type="checkbox" data-doc-signed-attest> Saya menyatakan PDF sudah ditandatangani secara elektronik.</label>'+
 '<button class="btn pri" type="button" data-doc-signed-kind="'+E(kind)+'" data-doc-signed-id="'+E(id)+'" data-doc-signed-year="'+y+'">Simpan Bukti & Tetapkan v'+ver+'</button></div>'+
 '<p class="psbank-version-disclaimer">Prototype: berkas bukti disimpan di browser/perangkat ini; metadata versinya tercatat oleh aplikasi. Validasi TTE BSrE dan penyimpanan aman lintas pengguna memerlukan integrasi backend.</p>'+
 '<div class="psbank-version-rows">'+(rows.length?rows.map(x=>'<div><b>v'+x.version+' · '+E(x.status==='signed'?'Bukti TTE diunggah (belum diverifikasi)':x.status==='uploaded'?'Dokumen Program diunggah':'Dokumen digenerasi')+'</b><span>'+E(x.format||'PDF')+' · '+E(x.fileName||'')+' · '+E(x.createdAt?.slice(0,16).replace('T',' ')||'')+'</span>'+(['signed','uploaded'].includes(x.status)?'<button class="btn" type="button" data-doc-proof-open="'+E(x.id)+'" data-doc-proof-name="'+E(x.fileName)+'">↓ '+(x.status==='signed'?'Bukti TTE':'Dokumen')+'</button>':'')+'</div>').join(''):'<small>Belum ada riwayat unduhan.</small>')+'</div></details>';
}

const join=x=>Array.isArray(x)?x.map(a=>typeof a==='string'?a:(a.t||a.m||a.nama||'')).filter(Boolean).join(' • '):String(x||'');
const charter=(p,y)=>{const arr=(S.charters||[]).filter(c=>c.prog===p.akr&&c.st!=='Arsip');return arr.find(c=>+c.p1<=y&&+c.p2>=y)||arr.find(c=>+c.p1===y)||arr[0]||null};
function fields(p,key,y){
 const c=charter(p,y),pc=p.psProgramCharter||c,empty='Belum diisi';
 if(key==='charter')return [['Judul Charter',pc?.judul||p.nama],['Tujuan Program',pc?.tujuan||p.psObjective||empty],['Latar Belakang',join(pc?.lb)||p.psBackground||empty],['Kondisi yang Diharapkan',join(pc?.tb)||empty],['Outcome',join(pc?.oc)||p.psOutcome||empty],['Keluaran',join(pc?.out)||empty],['Milestone',join(pc?.ms)||empty],['Manfaat',join(pc?.mf)||empty],['Risiko Utama',join(pc?.ris)||empty],['Faktor Keberhasilan',join(pc?.pk)||empty],['Penanggung Jawab',join(pc?.ow)||empty]];
 if(key==='identity')return [['Nama Program',p.nama],['Kode Program',officialCode(p)],['Tahun',y],['Jenis Program',p.jenis],['UIC Utama',p.uic],['UIC Pendukung',p.pend],['Sponsor',p.sponsor],['Tujuan Strategis',p.psObjective||c?.tujuan],['Latar Belakang',p.psBackground||join(c?.lb)],['Outcome',p.psOutcome||join(c?.oc)]];
 if(key==='case')return [['Keselarasan Strategis',p.psAlignment],['Business Case',p.psBusinessCase||join(c?.lb)],['Alternatif Solusi',p.psAlternatives],['Estimasi Biaya',p.psFinancialEstimate],['Kriteria Keberhasilan',p.psSuccessCriteria],['Strategi',p.psStrategy||c?.tb]];
 if(key==='governance')return [['Manajer Program',p.psManager],['Forum/Otoritas Keputusan',p.psDecisionAuthority],['Mekanisme Reviu',p.psGovernanceCadence],['Roadmap',p.psRoadmap||join(c?.ms)],['Kebutuhan Sumber Daya',p.psResourcePlan],['Dependensi',p.psDependencies],['Asumsi',p.psAssumptions],['Batasan',p.psConstraints]];
 if(key==='benefits'){
  const arr=p.psBenefits||[];return arr.length?arr.map((a,i)=>['Manfaat '+(i+1)+' · '+(a.name||''),[a.indicator,a.baseline?'Baseline '+a.baseline:'',a.target?'Target '+a.target:'',a.owner?'Benefit Owner '+a.owner:''].filter(Boolean).join(' | ')]):[['Manfaat Charter',join(c?.mf)||join(c?.oc)||empty]];
 }
 if(key==='stakeholders'){
  const arr=p.psStakeholders||[];return arr.length?arr.map((a,i)=>['Stakeholder '+(i+1)+' · '+(a.name||''),[a.role,a.strategy,a.owner?'PIC '+a.owner:''].filter(Boolean).join(' | ')]):[['Stakeholder Charter',join(c?.ow)||empty]];
 }
 if(key==='risks'){
  const arr=p.psRiskRegister||[];return arr.length?arr.map((a,i)=>['Risiko '+(i+1)+' · '+(a.title||''),[a.response,a.owner?'Risk Owner '+a.owner:'',a.probability?'P '+a.probability:'',a.impact?'I '+a.impact:''].filter(Boolean).join(' | ')]):[['Risiko Charter',join(c?.ris)||p.psRisks||empty]];
 }
 const ready=window.MT_PS_GOV?.readiness(p);return ready?.items?.map(a=>[a[1],a[2]?'Lengkap':'Belum lengkap'])||[['Kesiapan',empty]];
}
const sections=p=>STEPS.filter(s=>cfg().sections.includes(s[0])).map(s=>({key:s[0],title:s[1],rows:fields(p,s[0],year())}));
/* Tahapan panjang otomatis dipecah menjadi slide lanjutan tanpa kehilangan data. */
function splitSlideValue(value){
 let rest=String(value==null||value===''?'Belum diisi':value),out=[];
 while(rest.length>155){
  let k=rest.lastIndexOf(' ',155);
  if(k<70)k=155;
  out.push(rest.slice(0,k).trim());rest=rest.slice(k).trimStart();
 }
 out.push(rest);return out;
}
/* One Charter Program = the exact three-slide deck used by the Charter Program tab.
   Do not flatten Charter fields into generic report cards. */
function programCharterSource(p){
 const stored=p.psProgramCharter;
 const legacy=charter(p,year());
 const y0=+(p.mulai||p.psYear||year())||year();
 const years=String(p.periode||'').match(/20\d{2}/g)||[];
 const y1=Math.max(y0,+(years[years.length-1]||y0));
 const fallback={prog:p.akr,judul:p.nama||'',tahun:year(),ver:1,st:'Draft',
  p1:y0,p2:y1,tujuan:p.psObjective||'',lb:[p.psBackground||''].filter(Boolean),
  tb:p.psStrategy||'',out:[],oc:[p.psOutcome||''].filter(Boolean),ms:[],ris:[],
  pk:[],ch:p.sponsor||'',ow:[p.uic||''].filter(Boolean),kp:[],rk:[]};
 const fromLegacy=legacy&&!stored?Object.assign({},legacy,{
  tahun:+p.psYear||year(),st:'Draft',
  tujuan:p.psObjective||legacy.tujuan,
  lb:p.psBackground?[p.psBackground]:legacy.lb,
  tb:p.psStrategy||legacy.tb,
  oc:p.psOutcome?[p.psOutcome]:legacy.oc
 }):null;
 const source=Object.assign({},fallback,fromLegacy||{},stored||{});
 source.prog=p.akr;
 source.p1=+source.p1||y0;source.p2=Math.max(source.p1,+source.p2||y1);
 return source;
}
function charterPptSlides(p){
 if(typeof chDeck3!=='function')throw new Error('Template Charter Program resmi tidak tersedia.');
 const deck=chDeck3(programCharterSource(p));
 if(!deck?.slides||deck.slides.length!==3)throw new Error('Template Charter Program harus berisi tiga slide.');
 return deck.slides.map((native,i)=>({
  title:native.n||['Charter Program','Kriteria Penyelesaian','Rencana Kerja'][i],
  key:'charter',kind:'native-charter',native
 }));
}
function slidePages(p){
 const out=[];
 sections(p).forEach(section=>{
  if(section.key==='charter'){
   out.push(...charterPptSlides(p));
   return;
  }
  const all=section.rows.flatMap(r=>splitSlideValue(r[1]).map((v,i)=>[String(r[0])+(i?' (lanjutan '+(i+1)+')':''),v]));
  for(let j=0;j<all.length;j+=4)out.push({title:section.title+(j?' (lanjutan)':''),key:section.key,rows:all.slice(j,j+4)});
 });
 if(cfg().sign){const t=tteState(cfg());out.push({title:'Penandatanganan Elektronik (Rancangan)',key:'tte',rows:[
 ['Nama Pejabat',t.name||'Belum ditetapkan'],['Jabatan',t.title||'Belum ditetapkan'],
 ['Keterangan',t.label],['Tempat dan Tanggal',t.city+', '+t.date],['Nomor Dokumen',t.number||'Belum ditetapkan']
 ]})}
 return out;
}
function paper(p,key,y){
 return '<article class="psbank-paper"><div class="psbank-paper-head"><small>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</small><h3>'+E(title(key))+'</h3><span>'+E(p.nama)+' · '+y+' · '+E(officialCode(p))+'</span></div>'+
 '<div class="psbank-paper-body">'+fields(p,key,y).map(([a,b])=>'<div class="psbank-paper-row"><b>'+E(a)+'</b><p>'+E(b||'Belum diisi').replace(/\n/g,'<span class="psbank-line"></span>')+'</p></div>').join('')+'</div>'+
 '<div class="psbank-paper-foot"><span>Pratinjau dokumen program</span><span>Tahun '+y+'</span></div></article>';
}
function annex(p){const c=p.psProgramCharter||charter(p,year());if(!c)return[];return [['Analisis As-is',join(c.asis?.pb)||join(c.lb)],['Analisis To-be',join(c.tobe?.pb)||join(c.tb)],['Perbandingan',join(c.cs)],['Charter Program',c.tujuan],['Kriteria Penyelesaian',join(c.kp)],['Manfaat',join(c.mf)||join(c.oc)],['Linimasa',join(c.rk)||join(c.ms)]]}

/* The same formal report engine as Project Management's Final Report drives
   program DOCX and print previews. A single TTE form is reused in every builder. */
function tteState(d){
 if(!d.tte||typeof d.tte!=='object')d.tte={};
 const defaults={city:'',date:'',label:'',title:'',name:'',number:''};
 for(const [key,val] of Object.entries(defaults))if(d.tte[key]===undefined)d.tte[key]=val;
 return d.tte;
}
function tteControls(d,where){
 const t=tteState(d),att=where==='port'?'data-port-tte':'data-doc-tte',en=where==='port'?'data-port-include-tte':'data-doc-tte-enabled';
 const checked=where==='port'?!!d.sign:!!d.sign;
 return '<details class="psbank-tte-settings" '+(d.tteOpen?'open':'')+'><summary>✎ Atur TTE <small>Penandatangan & identitas dokumen</small></summary>'+
  '<div class="psbank-tte-fields"><label class="psbank-tte-check"><input type="checkbox" '+en+' '+(checked?'checked':'')+'> Sertakan halaman penandatanganan</label>'+
  [['number','Nomor Dokumen'],['name','Nama Pejabat'],['title','Jabatan'],['label','Keterangan'],['city','Kota'],['date','Tanggal']].map(x=>
   '<label>'+x[1]+'<input type="text" '+att+'="'+x[0]+'" value="'+E(t[x[0]])+'" placeholder="'+E(x[1])+'"></label>').join('')+
  '<small>Identitas untuk layout TTE; belum merupakan TTE yang tervalidasi. Unggah PDF hasil TTE di Riwayat Dokumen & Versi untuk menetapkan nomor versi.</small></div></details>';
}
function programReportModel(p){
 const d=cfg(),t=tteState(d),parts=sections(p),v=nextVersion('program',p.id||p.akr,year()),blocks=[];
 const name=String(p.nama||'Program Transformasi'),code=String(officialCode(p));
 blocks.push({t:'h1',text:'Ringkasan Eksekutif'});
 blocks.push({t:'p',text:'Dokumen Perencanaan Program '+name+' ('+code+') Tahun Anggaran '+year()+
  ' merangkum identitas, landasan pelaksanaan, manfaat, pemangku kepentingan, risiko, dan tata kelola program sesuai substansi yang dipilih. Dokumen merupakan rancangan sampai disahkan.'});
 blocks.push({t:'kv',rows:[['Nama Program',name],['Kode Program',code],['Tahun Anggaran',String(year())],['UIC Utama',p.uic||'—'],['Tahap',p.psStatus==='Ditetapkan'?'Ditetapkan':'Usulan / Draf'],['Versi','v'+v]]});
 parts.forEach((part,i)=>{
  blocks.push({t:'h1',text:part.title});
  const rows=part.rows.map(r=>[String(r[0]),String(r[1]??'Belum diisi')]);
  blocks.push({t:'table',caption:'Substansi '+part.title,head:['Komponen','Uraian'],widths:[32,68],rows:rows.length?rows:[['Substansi','Belum diisi']]});
 });
 if(d.annex&&annex(p).length){
  blocks.push({t:'h1',text:'Lampiran Charter',nonum:true});
  blocks.push({t:'table',caption:'Rangkuman Charter',head:['Komponen','Uraian'],widths:[32,68],rows:annex(p)});
 }
 if(d.sign)blocks.push({t:'tte'});
 return {lang:'id',formal:true,template:d.template||'activity',toc:!!d.toc,header:'Dokumen Perencanaan Program · '+name,
  fileName:'Perencanaan_Program_'+year()+'_'+code.replace(/[^A-Za-z0-9_-]/g,'_')+'_v'+v,
  cover:{kicker:'DOKUMEN PROGRAM',title:name,
   subject:'Tahun Anggaran '+year(),
   chips:[code,'Tahun '+year(),'Versi v'+v],
   scope:[],meta:[['Kode Program',code],['UIC Utama',String(p.uic||'—')],
     ['Tahun Anggaran',String(year())],['Versi','v'+v],['Nomor Dokumen',t.number||'Belum ditetapkan']],
   noTte:!d.sign,tte:{name:t.name,title:t.title,label:t.label,date:t.date,city:t.city}},
  blocks};
}


/**
 * Prevent a regression to the unformatted Word layout.
 * Official template uses A4 (11906 x 16838 twips), compact 14 mm margins (794 twips)
 * and a body area of 10318 twips—the same geometry as Final Project Report.
 */
async function assertOfficialWordTemplate(blob){
 const zip=await window.JSZip.loadAsync(blob),xml=await zip.file('word/document.xml')?.async('string');
 if(!xml)throw new Error('Dokumen Word tidak mempunyai konten.');
 const dom=new DOMParser().parseFromString(xml,'application/xml');
 if(dom.querySelector('parsererror'))throw new Error('Struktur Word tidak valid.');
 const page=dom.getElementsByTagNameNS('*','pgSz')[0],margin=dom.getElementsByTagNameNS('*','pgMar')[0];
 const attr=(e,k)=>e?.getAttribute('w:'+k)||e?.getAttribute(k);
 const right=Number(attr(margin,'right')),left=Number(attr(margin,'left'));
 if(Number(attr(page,'w'))!==11906||Number(attr(page,'h'))!==16838||left!==794||right!==794||
    !zip.file('word/styles.xml'))
  throw new Error('Template Word tidak sesuai format laporan resmi A4; unduhan dibatalkan untuk mencegah layout rusak.');
 return blob;
}

/* Resolve page references from the actual paginated DOCX preview.
   The downloaded DOCX contains native TOC fields and Word refreshes them on open.
   The browser preview needs to fill the cached page-number display separately. */
function annotateDocxTocPages(target,model){
 if(!model?.formal||model.toc===false)return;
 const pages=[...target.querySelectorAll('section.docx,.docx-wrapper > .docx')];
 if(!pages.length)return;
 const entries=(model.blocks||[]).filter(b=>b.t==='h1'||b.t==='h2');
 const normalize=s=>String(s||'').replace(/\\s+/g,' ').trim().toLowerCase();
 const all=pages.flatMap((page,index)=>[...page.querySelectorAll('p')].map(p=>({p,page:index+1,text:normalize(p.textContent)})));
 const used=new Set();
 entries.forEach(b=>{
  const label=normalize(b.text);
  if(!label)return;
  // Pick the final matching paragraph: earlier matches are TOC field cache.
  const heading=[...all].reverse().find(x=>x.text.includes(label)&&x.text.length<label.length+22&&!used.has(x.p));
  if(!heading)return;
  used.add(heading.p);
  const toc=all.find(x=>x.page<heading.page&&x.text.includes(label)&&x.text.length<label.length+22);
  if(!toc||toc.p.querySelector('[data-toc-page]'))return;
  const number=document.createElement('span');
  number.dataset.tocPage='true';
  number.textContent=String(heading.page);
  number.style.cssText='float:right;font-weight:600;color:#172e52;background:#fff;padding-left:8px;margin-left:10px';
  toc.p.appendChild(number);
 });
}

/* Faithful preview: render the actual DOCX package/PDF blob generated by the
   exact same export functions. HTML preview is retained as a fallback only. */
const ACTUAL_DOCX_URL='https://cdn.jsdelivr.net/npm/docx-preview@0.4.1/dist/docx-preview.min.js';
async function showActualDocumentPreview(root,model,format){
 const node=root?.querySelector?.('[data-doc-actual]');
 if(!node||!node.isConnected||format==='pptx')return false;
 const tick=(node.__previewTick||0)+1;node.__previewTick=tick;
 const alive=()=>node.isConnected&&node.__previewTick===tick;
 const indicator=node.querySelector('[data-actual-progress]');
 if(indicator)indicator.textContent='Memuat tampilan dari file '+(format==='word'?'DOCX':'PDF')+'…';
 try{
  if(format==='word'){
   await load('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!window.JSZip);
   await load(ACTUAL_DOCX_URL,()=>!!window.docx?.renderAsync);
   if(typeof mtRptDocx!=='function')throw new Error('Pembuat laporan DOCX belum tersedia.');
   const blob=await assertOfficialWordTemplate(await mtRptDocx(model));if(!alive())return false;
   const target=document.createElement('div');target.className='psbank-actual-docx';
   await window.docx.renderAsync(blob,target,null,{
    breakPages:true,ignoreWidth:false,ignoreHeight:false,
    useBase64URL:true,renderHeaders:true,renderFooters:true
   });if(!alive())return false;
   node.replaceChildren(target);
   annotateDocxTocPages(target,model);
   // Fit every Word page into the preview pane without changing the actual A4
   // geometry; the same blob is downloaded and rendered by docx-preview.
   const fitPage=()=>{
    if(!node.isConnected)return;
    target.style.zoom='1';
    const page=target.querySelector('.docx');
    const width=page?.offsetWidth||794,room=Math.max(320,node.clientWidth-28);
    const scale=Math.min(1,room/width);
    target.style.zoom=scale.toFixed(3);
    target.dataset.previewScale=String(Math.round(scale*100));
   };
   requestAnimationFrame(fitPage);
   return true;
  }
  if(format==='pdf'){
   const blob=await exportFormalPdf(model,'', {preview:true});
   if(!alive())return false;
   const url=URL.createObjectURL(blob);
   const frame=document.createElement('iframe');
   frame.className='psbank-actual-pdf';frame.title='Pratinjau PDF dari file hasil ekspor';
   frame.src=url;frame.addEventListener('load',()=>{setTimeout(()=>URL.revokeObjectURL(url),15000)},{once:true});
   node.replaceChildren(frame);return true;
  }
 }catch(e){
  if(alive()&&indicator)indicator.textContent='Tampilan alternatif — gagal membuka file asli: '+String(e.message||e);
 }
 return false;
}

/* Final Project Management report: keep HTML iframe as printable PDF source,
   render the exact generated DOCX beside it for the Word preview. */
function installFinalReportPreview(){
 if(typeof mtRptHtml!=='function'||window.MT_FINAL_REPORT_PREVIEW_SYNC)return;
 const original=mtRptHtml;
 const wrapped=function(model){
  const html=original.apply(this,arguments);
  const frame=document.querySelector?.('#rpt-if');
  if(!frame?.isConnected)return html;
  const parent=frame.parentElement;
  let view=parent?.querySelector('[data-doc-actual="final"]');
  if(!view&&parent){
   view=document.createElement('div');view.className='psbank-actual-view';
   view.dataset.docActual='final';
   view.innerHTML='<small data-actual-progress>Menyiapkan pratinjau dari file Word yang akan diunduh…</small>';
   parent.appendChild(view);
  }
  if(!view)return html;
  frame.style.position='';frame.style.left='';frame.style.height='';frame.style.width='';
  frame.hidden=false;view.hidden=true;
  // Defer until the report's HTML iframe has been given its srcdoc.
  Promise.resolve().then(()=>showActualDocumentPreview(parent,model,'word')).then(ok=>{
   if(!view.isConnected||!frame.isConnected)return;
   view.hidden=!ok;
   if(ok){frame.style.position='absolute';frame.style.left='-10000px';frame.style.width='1px';frame.style.height='1px'}
  }).catch(()=>{if(view?.isConnected)view.hidden=true});
  return html;
 };
 // A global function declaration in index.html remains backed by the window binding.
 window.mtRptHtml=wrapped;
 window.MT_FINAL_REPORT_PREVIEW_SYNC=true;
}

function actualPreviewShell(mode,format,markup){
 return '<div class="psbank-actual-view" data-doc-actual="'+mode+'" data-doc-format="'+format+'">'+
 '<small class="psbank-actual-progress" data-actual-progress>Menyiapkan pratinjau file '+(format==='word'?'DOCX':'PDF')+'…</small>'+
 markup+'</div>';
}
function fitNativeCharterPreview(root){
 const box=root?.querySelector?.('[data-doc-charter-canvas]');
 if(!box)return false;
 const el=box.querySelector('.dk-scale');
 if(!el)return false;
 const fit=()=>{if(!box.isConnected)return;const w=box.clientWidth;if(w)el.style.transform='scale('+(w/1280)+')'};
 fit();requestAnimationFrame(fit);
 if(typeof ResizeObserver==='function'){
  const observer=new ResizeObserver(()=>{if(!box.isConnected){observer.disconnect();return}fit()});
  observer.observe(box);
 }
 return true;
}
function hydrateProgram(root,p){
 const d=cfg();
 if(d.format==='pptx'){fitNativeCharterPreview(root);return Promise.resolve(true)}
 const node=root?.querySelector?.('[data-doc-actual="program"]');
 if(!node||!p)return Promise.resolve(false);
 return showActualDocumentPreview(root,programReportModel(p),d.format);
}
function hydratePortfolio(root){
 const d=portCfg(),node=root?.querySelector?.('[data-doc-actual="portfolio"]');
 if(d.format==='pptx'){fitNativeCharterPreview(root);return Promise.resolve(true)}
 if(!node)return Promise.resolve(false);
 return showActualDocumentPreview(root,portfolioModel(),d.format);
}


function programDeck(p){
 const d=cfg();
 return (d.cover?[{kind:'cover',title:'DOKUMEN PERENCANAAN PROGRAM',rows:[]}]:[])
  .concat(slidePages(p).map(x=>({...x,kind:x.kind||'section'})));
}
function programSlideHtml(p,slide,idx,count,version){
 if(slide.kind==='native-charter'){
  return '<div class="psbank-native-charter-slide" data-doc-charter-canvas style="position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:#fff;border:1px solid #dbe4ef;border-radius:3px">'+
    '<div class="dk-scale" style="position:absolute;left:0;top:0;width:1280px;height:720px;transform-origin:0 0">'+dkHtml(slide.native)+'</div></div>';
 }
 if(mtExec(cfg())){const a=mtExecPreview(slide,{name:p.nama,year:year()});if(a!==null)return '<div class="psbank-slidepreview">'+a+'</div>'}
 if(slide.kind==='cover')return '<div class="psbank-slidepreview psbank-export-cover">'+
  '<div class="psbank-slide-export-kicker">KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</div>'+
  '<h2>DOKUMEN PERENCANAAN PROGRAM</h2><h3>'+E(p.nama)+'</h3>'+
  '<small>Tahun '+year()+' · '+E(officialCode(p))+' · Versi '+version+'</small>'+
  '<footer>PROGRAM TRANSFORMASI KEMENTERIAN KEUANGAN <span>'+(idx+1)+' / '+count+'</span></footer></div>';
 return '<div class="psbank-slidepreview psbank-export-section">'+
  '<div class="psbank-slide-export-kicker">KEMENTERIAN KEUANGAN · '+E(officialCode(p))+' · '+year()+'</div>'+
  '<h3>'+E(slide.title)+'</h3><small>'+E(p.nama)+' · Versi '+version+'</small>'+
  '<div class="psbank-slidebody" style="display:block">'+mtPptRowsHtml(slide.rows,slide.title)+'</div><footer>PROGRAM TRANSFORMASI KEMENTERIAN KEUANGAN <span>'+(idx+1)+' / '+count+'</span></footer></div>';
}

function documentPreview(p){
 const d=cfg(),list=sections(p),version=nextVersion('program',p.id||p.akr,year());
 if(d.format!=='pptx'&&typeof mtRptHtml==='function')return actualPreviewShell('program',d.format,'<iframe class="psbank-program-report-frame" title="Pratinjau awal dokumen perencanaan program" srcdoc="'+E(mtRptHtml(programReportModel(p)))+'"></iframe>');
 if(d.format==='pptx'){
  const slides=programDeck(p),n=Math.max(0,Math.min(+d.slide||0,slides.length-1)),slide=slides[n]||{kind:'section',title:'Belum ada substansi',rows:[]};
  return programSlideHtml(p,slide,n,slides.length||1,version)+
   '<div class="psbank-slidecontrols"><button class="btn" data-doc-slide="-1" '+(n===0?'disabled':'')+'>‹ Sebelumnya</button>'+
   '<span>Slide '+(n+1)+' / '+slides.length+' · '+E(slide.title)+'</span>'+
   '<button class="btn" data-doc-slide="1" '+(n>=slides.length-1?'disabled':'')+'>Berikutnya ›</button></div>';

 }
 return '<article class="psbank-docpaper">'+(d.cover?'<header class="psbank-doccover"><small>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</small><h2>DOKUMEN PERENCANAAN PROGRAM</h2><h3>'+E(p.nama)+'</h3><p>'+E(officialCode(p))+' · Tahun '+year()+'</p><span>Rancangan untuk reviu — belum disahkan</span></header>':'')+
 (d.toc?'<section class="psbank-doctoc"><b>DAFTAR ISI</b>'+list.map((x,i)=>'<div>'+(i+1)+'. '+E(x.title)+'</div>').join('')+'</section>':'')+
 list.map((x,i)=>'<section class="psbank-docsection"><h4>'+(i+1)+'. '+E(x.title)+'</h4><table>'+x.rows.map(r=>'<tr><th>'+E(r[0])+'</th><td>'+E(r[1]||'Belum diisi')+'</td></tr>').join('')+'</table></section>').join('')+
 (d.annex&&annex(p).length?'<section class="psbank-docsection"><h4>LAMPIRAN CHARTER</h4><table>'+annex(p).map(r=>'<tr><th>'+E(r[0])+'</th><td>'+E(r[1]||'Belum diisi')+'</td></tr>').join('')+'</table></section>':'')+
 (d.sign?'<section class="psbank-docsignature">Mengetahui / menyetujui<br><br><br>Pejabat Berwenang</section>':'')+
 '<footer class="psbank-docfoot">Versi '+version+' · Pratinjau '+(d.format==='pdf'?'PDF':'Word')+' · '+list.length+' substansi · '+year()+'</footer></article>';
}
function builder(p){
 const d=cfg(),list=STEPS,fmt=d.format||'word',ver=nextVersion('program',p.id||p.akr,year());
 return '<div class="psbank-docbuilder"><div class="psbank-docsettings"><div class="psbank-docsetting-head"><h3>Dokumen Perencanaan Program · Pratinjau & Ekspor</h3><p>Substansi dokumen dan riwayat pengesahan versi '+ver+'.</p></div>'+
 '<div class="psbank-doccheckhead"><b>Substansi dokumen</b><span>'+STEPS.filter(x=>d.sections.includes(x[0])).length+' / '+STEPS.length+' dipilih</span></div>'+
 '<div class="psbank-docchecks">'+list.map((x,i)=>'<label><input type="checkbox" data-doc-section="'+x[0]+'" '+(d.sections.includes(x[0])?'checked':'')+'> '+(i+1)+'. '+E(x[1])+'</label>').join('')+'</div>'+
 '<div class="psbank-docextras"><label><input type="checkbox" data-doc-extra="cover" '+(d.cover?'checked':'')+'> Sampul & identitas</label>'+
 '<label><input type="checkbox" data-doc-extra="toc" '+(d.toc?'checked':'')+'> Daftar isi</label>'+
 '<label><input type="checkbox" data-doc-extra="annex" '+(d.annex?'checked':'')+'> Lampiran charter</label>'+
 '<label><input type="checkbox" data-doc-extra="sign" '+(d.sign?'checked':'')+'> Halaman penandatanganan</label></div>'+
 tteControls(d,'doc')+
 '<div class="psbank-template-picker"><label><b>Template dokumen Word/PDF</b><select data-doc-template aria-label="Pilih template dokumen">'+[['activity','Warna · Laporan Kegiatan'],['classic','Formal · Navy-Emas']].map(([k,v])=>'<option value="'+k+'" '+((d.template||'activity')===k?'selected':'')+'>'+v+'</option>').join('')+'</select></label><small>Pratinjau dan unduhan memakai template yang sama.</small></div>'+
 (fmt==='pptx'?'<div class="psbank-template-picker"><label><b>Template PPTX</b><select data-doc-ppt-template aria-label="Pilihan template PowerPoint">'+[['standard','Standar (lama)'],['navy-gold-executive','Navy–Gold Executive (alternatif)']].map(([k,v])=>'<option value="'+k+'" '+((d.pptTemplate||'standard')===k?'selected':'')+'>'+v+'</option>').join('')+'</select></label><small>Charter tetap menggunakan desain aslinya.</small></div>':'')+
 '<div class="psbank-docformat"><strong>Format Ekspor</strong><div class="psbank-formatbuttons" role="group" aria-label="Format Ekspor">'+
 [['pdf','PDF'],['word','DOCX'],['pptx','PPTX']].map(x=>'<button type="button" class="btn '+(fmt===x[0]?'on':'')+'" data-doc-format-btn="'+x[0]+'" aria-pressed="'+(fmt===x[0])+'">'+x[1]+'</button>').join('')+'</div></div>'+
 versionPanel('program',p.id||p.akr,year())+
 '</div><div class="psbank-docpreview"><div class="psbank-docpreview-head"><div><b>Pratinjau '+(fmt==='word'?'Word':fmt==='pdf'?'PDF':'PowerPoint')+'</b><small>'+E(p.nama)+'</small></div><span>v'+ver+' · '+sections(p).length+' substansi</span></div>'+
 '<div class="psbank-docscroll">'+documentPreview(p)+'</div></div></div>';
}
const basename=p=>('Perencanaan_Program_'+year()+'_'+String(p.kodeResmi||p.id||p.akr||'program')).replace(/[^a-zA-Z0-9_-]/g,'_');
async function load(src,check){
 if(check())return;
 if(typeof chLib==='function'){await chLib(src,check);return}
 await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Gagal memuat pustaka ekspor.'));document.head.appendChild(s)});
}
const para=(text,bold=false)=>'<w:p><w:pPr><w:spacing w:after="110"/></w:pPr><w:r><w:rPr>'+(bold?'<w:b/>':'')+'<w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="'+(bold?25:20)+'"/></w:rPr><w:t xml:space="preserve">'+X(text)+'</w:t></w:r></w:p>';
function table(rows){return '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="DDE7F0"/><w:bottom w:val="single" w:sz="4" w:color="DDE7F0"/><w:insideH w:val="single" w:sz="4" w:color="E0E7F1"/></w:tblBorders></w:tblPr>'+rows.map(r=>'<w:tr>'+r.map((v,i)=>'<w:tc><w:tcPr><w:tcW w:w="'+(i===0?'2700':'6100')+'" w:type="dxa"/>'+(i===0?'<w:shd w:fill="EFF4FA"/>':'')+'</w:tcPr><w:p><w:r><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="19"/></w:rPr><w:t xml:space="preserve">'+X(v||'Belum diisi')+'</w:t></w:r></w:p></w:tc>').join('')+'</w:tr>').join('')+'</w:tbl>';}

/* Shared PDF layout for all document builders: formal report cover, contents,
   structured chapters, readable tables, and optional TTE. */
async function exportFormalPdf(model,file,{preview=false}={}){
 await load('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',()=>!!window.jspdf?.jsPDF);
 const pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4'});
 const ink=[21,45,78],navy=[14,41,81],pale=[237,244,251],gold=[250,181,36],gray=[93,110,137],W=210,left=19,right=191,bw=172;
 const headingPages=[];
 let y=25;
 const setColor=a=>pdf.setTextColor(...a),line=(v,size=10,bold=false,space=4)=>{
  const lines=pdf.splitTextToSize(String(v??'—'),bw);
  pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);setColor(ink);
  for(const txt of lines){if(y>274){pdf.addPage();y=25}pdf.text(txt,left,y);y+=Math.max(4.6,size*.48+1)}
  y+=space;
 };
 const title=(v)=>{
  if(y>240){pdf.addPage();y=26}
  pdf.setFillColor(...gold);pdf.rect(left,y-6,3,8,'F');pdf.setFont('helvetica','bold');pdf.setFontSize(15);setColor(navy);
  const lines=pdf.splitTextToSize(String(v),160);
  for(const t of lines){if(y>269){pdf.addPage();y=26}pdf.text(t,left+8,y);y+=7.4}
  y+=6;
 };
 const drawTable=(head,rows,widths)=>{
  const sum=(widths||[]).reduce((a,b)=>a+b,0),w=(widths?.length===head.length)?widths.map(x=>bw*x/sum):Array(head.length).fill(bw/head.length);
  const cellRow=(values,isHead=false)=>{
   const parts=values.map((v,i)=>{
    pdf.setFont('helvetica',isHead?'bold':'normal');pdf.setFontSize(isHead?9.2:9.2);
    return pdf.splitTextToSize(String(v??'—'),Math.max(9,w[i]-5));
   });
   const max=Math.max(1,...parts.map(x=>x.length));
   for(let start=0;start<max;start+=30){
    const rows=parts.map(x=>x.slice(start,start+30)),h=Math.max(9.8,...rows.map(x=>x.length*4.5+4.2));
    if(y+h>272){pdf.addPage();y=25}
    let x=left;
    values.forEach((_,i)=>{
     const fill=isHead?navy:(i===0&&start===0?pale:[255,255,255]);
     pdf.setFillColor(...fill);pdf.rect(x,y,w[i],h,'F');
     pdf.setDrawColor(218,228,240);pdf.rect(x,y,w[i],h);
     pdf.setFont('helvetica',isHead?'bold':'normal');pdf.setFontSize(9.2);
     setColor(isHead?[255,255,255]:ink);pdf.text(rows[i]||[],x+2.5,y+4.5);x+=w[i];
    });y+=h;
   }
  };
  if(head.length)cellRow(head,true);
  for(const row of rows)cellRow(row);
  y+=7;
 };
 /* Shared activity-report cover: same gradient and rainbow band as Word/HTML. */
 if(model.template==='classic'){
  pdf.setFillColor(...navy);pdf.rect(0,0,W,110,'F');pdf.setFillColor(...gold);pdf.rect(left,27,32,2,'F');
  pdf.setFont('helvetica','bold');pdf.setFontSize(10);pdf.setTextColor(245,191,64);
  pdf.text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',left,20);
  pdf.setTextColor(255,255,255);pdf.setFontSize(24);
  const heading=pdf.splitTextToSize(String(model.cover?.title||'DOKUMEN PROGRAM'),170);
  pdf.text(heading,left,43);pdf.setFontSize(12);pdf.text(pdf.splitTextToSize(String(model.cover?.subject||''),170),left,68);
  y=129;line((model.cover?.chips||[]).join('   |   '),10,true,8);
  if(model.cover?.meta?.length)drawTable(['IDENTITAS DOKUMEN','KETERANGAN'],typeof mtRptOrderedMeta==='function'?mtRptOrderedMeta(model.cover.meta):model.cover.meta,[35,65]);
 }else{
  const banner=typeof mtRptCoverBanner==='function'?mtRptCoverBanner():null;
  if(banner)pdf.addImage(banner.src,'PNG',left,17,bw,bw*212/1400);
  else {
   pdf.setFillColor(18,39,90);pdf.rect(left,17,bw,26,'F');
   const stripe=[[242,169,59],[226,85,99],[124,92,224],[27,167,201],[22,163,127]];
   stripe.forEach((c,i)=>{pdf.setFillColor(...c);pdf.rect(left+bw*i/5,43,bw/5,1.5,'F')});
  }
  y=59;pdf.setFont('helvetica','bold');pdf.setFontSize(10);pdf.setTextColor(47,91,211);
  pdf.text(String(model.cover?.kicker||'LAPORAN').toUpperCase().slice(0,84),left,y);
  y+=6;
  pdf.setFont('helvetica','bold');pdf.setFontSize(22);pdf.setTextColor(18,39,90);
  const headings=pdf.splitTextToSize(String(model.cover?.title||'DOKUMEN PROGRAM'),bw);
  headings.forEach(t=>{pdf.text(t,left,y);y+=9});
  pdf.setFont('helvetica','normal');pdf.setFontSize(12);pdf.setTextColor(52,64,84);
  pdf.splitTextToSize(String(model.cover?.subject||''),bw).forEach(t=>{pdf.text(t,left,y);y+=6});
  const chips=(model.cover?.chips||[]).filter(v=>String(v||'').trim()).slice(0,4);
  let cx=left;y+=7;
  chips.forEach(chip=>{
   const value=String(chip),cw=Math.min(59,Math.max(19,value.length*1.35+7));
   if(cx+cw>right){cx=left;y+=8}
   pdf.setFillColor(238,243,255);pdf.roundedRect(cx,y-5.5,cw,7,3,3,'F');
   pdf.setFontSize(8.4);pdf.setFont('helvetica','bold');pdf.setTextColor(31,63,134);
   pdf.text(value.slice(0,39),cx+3,y-1);
   cx+=cw+3;
  });
  y+=14;
  for(const pair of model.cover?.meta||[]){
   const key=String(pair[0]||''),val=String(pair[1]||'');
   pdf.setFont('helvetica','normal');pdf.setFontSize(9.1);pdf.setTextColor(93,110,137);
   const vals=pdf.splitTextToSize(val,bw*.62);
   const h=Math.max(7,vals.length*4.3+2);
   pdf.text(key,left,y);
   pdf.setFont('helvetica','bold');pdf.setTextColor(21,45,78);
   vals.forEach((text,j)=>pdf.text(text,left+bw*.34,y+j*4.3));
   pdf.setDrawColor(224,233,244);pdf.line(left,y+h-2,right,y+h-2);
   y+=h;
  }
 }
 // Placeholder QR untuk sertifikasi TTE pada cover; tidak membentuk QR atau sertifikat palsu.
 if(!model.cover?.noTte){
  const bx=143,by=217,sz=25;
  pdf.setDrawColor(144,161,185);pdf.setLineWidth(.35);
  if(typeof pdf.setLineDashPattern==='function')pdf.setLineDashPattern([1.8,1.2],0);
  pdf.rect(bx,by,sz,sz);
  if(typeof pdf.setLineDashPattern==='function')pdf.setLineDashPattern([],0);
  pdf.setFont('helvetica','bold');pdf.setFontSize(7.5);pdf.setTextColor(126,143,162);
  pdf.text('QR TTE',bx+sz/2,by+sz/2,{align:'center'});
  pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.setTextColor(93,110,137);
  pdf.text('Ditandatangani secara elektronik',bx+sz/2,by+sz+5,{align:'center'});
 }
 const contents=(model.blocks||[]).filter(b=>b.t==='h1'||b.t==='h2').map(b=>({text:b.text,level:b.t==='h1'?1:2}));
 if(model.formal&&contents.length){pdf.addPage();y=27;title('DAFTAR ISI');contents.forEach((b,i)=>line((b.level===2?'   ':'')+(i+1)+'. '+b.text,10,b.level===1,2));}
 pdf.addPage();y=29;
 for(const b of model.blocks||[]){
  if(b.t==='h1'){headingPages.push({text:b.text,page:pdf.getNumberOfPages(),level:1});title(b.text);headingPages[headingPages.length-1].page=pdf.getNumberOfPages();}
  else if(b.t==='h2'){if(y>251){pdf.addPage();y=26}headingPages.push({text:b.text,page:pdf.getNumberOfPages(),level:2});line(b.text,12,true,5)}
  else if(b.t==='p')line(b.text,10,false,7);
  else if(b.t==='kv')drawTable(['Komponen','Informasi'],b.rows||[],[34,66]);
  else if(b.t==='table'){if(b.caption)line('Tabel: '+b.caption,9,true,3);drawTable(b.head||[],b.rows||[],b.widths)}
  else if(b.t==='bullets')for(const x of b.items||[])line('• '+x,10,false,3);
  else if(b.t==='tte'&&!model.cover?.noTte){
   pdf.addPage();y=34;title('INFORMASI PENANDATANGANAN ELEKTRONIK');
   const t=model.cover?.tte||{};line((t.city||'')+(t.date?', '+t.date:''),10,false,12);
   line(t.label||'Mengetahui,',10,false,16);line(t.title||'[Jabatan Pejabat]',11,true,24);
   line('Ditandatangani secara elektronik',9,false,8);line(t.name||'[Nama Pejabat]',11,true,5);
  }
 }
 // Page references are resolved only after all sections have been laid out.
 // These are actual PDF page positions, never estimated or hard-coded values.
 if(model.formal&&contents.length){
  pdf.setPage(2);pdf.setFillColor(255,255,255);pdf.rect(left,34,bw,242,'F');
  let ty=42;
  headingPages.forEach((item,i)=>{
   if(ty>267)return;
   const name=(i+1)+'. '+String(item.text||'');
   const maxWidth=bw-25-(item.level===2?6:0);
   pdf.setFont('helvetica',item.level===1?'bold':'normal');pdf.setFontSize(item.level===1?10:9);
   pdf.setTextColor(...ink);
   const items=pdf.splitTextToSize(name,maxWidth);
   const x=left+(item.level===2?6:0);
   items.forEach((part,j)=>{
    if(ty>267)return;
    pdf.text(part,x,ty);
    if(j===items.length-1){
     const textWidth=pdf.getTextWidth(part),end=right-17;
     pdf.setDrawColor(181,195,210);pdf.setLineDashPattern?.([.5,1.5],0);
     if(x+textWidth+3<end)pdf.line(x+textWidth+3,ty-.6,end,ty-.6);
     pdf.setLineDashPattern?.([],0);
     pdf.text(String(item.page),right,ty,{align:'right'});
    }
    ty+=5.9;
   });
   ty+=item.level===1?2:0;
  });
 }
 const pages=pdf.getNumberOfPages();
 for(let i=1;i<=pages;i++){pdf.setPage(i);pdf.setDrawColor(210,222,234);pdf.line(left,283,right,283);
  pdf.setFontSize(8);pdf.setFont('helvetica','normal');setColor(gray);
  pdf.text(String(model.header||'Modul Transformasi Kementerian Keuangan').slice(0,100),left,289);
  pdf.text(i+' / '+pages,right,289,{align:'right'});
 }
 if(preview)return pdf.output('blob');
 pdf.save(file);
 return null;
}

async function exportFile(p){
 if(!p||!cfg().sections.length){toast('Pilih minimal satu substansi.');return}
 const d=cfg(),list=sections(p),version=nextVersion('program',p.id||p.akr,year()),file=basename(p)+'_v'+version;
 try{
  if(d.format==='word'){
   // All exports use the one formal renderer also used by Laporan Akhir Proyek.
   // Do not fall back to the deprecated plain XML document template.
   if(typeof mtRptDocx!=='function'||typeof mtRptDownloadBlob!=='function'){
    throw new Error('Template Word resmi belum tersedia. Muat ulang aplikasi sebelum mengunduh.');
   }
   await load('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!window.JSZip);
   const model=programReportModel(p);
   const blob=await assertOfficialWordTemplate(await mtRptDocx(model));
   mtRptDownloadBlob(blob,file+'.docx');
  }else if(d.format==='pdf'){
   await exportFormalPdf(programReportModel(p),file+'.pdf');
  }else{
   await load('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js',()=>!!window.PptxGenJS);
   const ppt=new window.PptxGenJS();ppt.layout='LAYOUT_WIDE';ppt.author='PMO Kementerian Keuangan';
   const deck=programDeck(p),count=deck.length;
   deck.forEach((page,i)=>{
    const sl=ppt.addSlide();
    if(page.kind==='native-charter'){
     const native=page.native;sl.background={color:native.bg||'FFFFFF'};
     // Mirror dkPptx(): shapes, typography, dimensions, bullets and editable text.
     (native.E||[]).forEach(e=>{
      if(e.t==='r'||e.t==='e'){
       sl.addShape(e.t==='e'?ppt.ShapeType.ellipse:(e.rad?ppt.ShapeType.roundRect:ppt.ShapeType.rect),{
        x:e.x,y:e.y,w:e.w,h:e.h,
        fill:{color:e.fill,transparency:e.tr||0},
        line:e.line?{color:e.line,width:e.lw||.75}:{type:'none'},
        rectRadius:e.rad?Math.min(e.w,e.h)*e.rad:undefined
       });
       return;
      }
      const options={x:e.x,y:e.y,w:e.w,h:e.h,fontFace:'Calibri',fontSize:e.s,
       color:e.c||'12275A',bold:!!e.b,italic:!!e.i,align:e.a||'left',
       valign:e.v||'top',margin:2,charSpacing:e.sp||0,paraSpaceAfter:e.bul?3:0};
      if(Array.isArray(e.txt))sl.addText(e.txt.map((t,j)=>({text:t,options:{
       bullet:e.bul?{indent:12}:false,breakLine:j<e.txt.length-1}})),options);
      else sl.addText(String(e.txt||''),options);
     });
     return;
    }
    if(mtExec(d)&&mtExecSlide(ppt,sl,page,{index:i,count,year:year(),version,name:p.nama,label:'DOKUMEN PERENCANAAN PROGRAM'}))return;
    if(page.kind==='cover'){
     sl.background={color:PPTX_STYLE.navy};
     sl.addShape(ppt.ShapeType.rect,{x:.61,y:.57,w:.14,h:5.4,line:{color:PPTX_STYLE.gold,transparency:100},fill:{color:PPTX_STYLE.gold}});
     sl.addText('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',{x:1,y:.68,w:11.7,h:.42,fontFace:PPTX_STYLE.font,fontSize:15,color:PPTX_STYLE.gold,bold:true,margin:0});
     sl.addText('DOKUMEN PERENCANAAN PROGRAM',{x:1,y:1.88,w:11.7,h:.8,fontFace:PPTX_STYLE.font,fontSize:32,color:'FFFFFF',bold:true,margin:0,fit:'shrink'});
     sl.addText(String(p.nama||''),{x:1,y:2.94,w:11.6,h:1.3,fontFace:PPTX_STYLE.font,fontSize:26,color:'FFFFFF',bold:true,margin:0,fit:'shrink'});
     sl.addText('Tahun '+year()+' · '+(officialCode(p))+' · Versi '+version,{x:1,y:5.42,w:11.4,h:.4,fontFace:PPTX_STYLE.font,fontSize:16,color:PPTX_STYLE.gold,margin:0});
    }else{
     sl.background={color:'FFFFFF'};
     sl.addShape(ppt.ShapeType.rect,{x:0,y:0,w:13.333,h:.14,line:{color:PPTX_STYLE.gold,transparency:100},fill:{color:PPTX_STYLE.gold}});
     sl.addText('KEMENTERIAN KEUANGAN · '+(officialCode(p))+' · '+year(),{x:.6,y:.46,w:12,h:.3,fontFace:PPTX_STYLE.font,fontSize:12,bold:true,color:PPTX_STYLE.mid,margin:0});
     sl.addText(String(page.title||''),{x:.6,y:.92,w:12.1,h:.62,fontFace:PPTX_STYLE.font,fontSize:25,bold:true,color:PPTX_STYLE.navy,margin:0,fit:'shrink'});
     sl.addText(p.nama+' · Versi '+version,{x:.6,y:1.59,w:12,h:.29,fontFace:PPTX_STYLE.font,fontSize:12,color:'627892',margin:0});
     const cards=page.rows||[],layout=mtPptLayout(page.title),n=cards.length;
     const t=(value,x,y,w,h,size=12,color='254568',bold=false)=>sl.addText(String(value||'Belum diisi'),{x,y,w,h,fontFace:PPTX_STYLE.font,fontSize:size,color,bold,margin:0,fit:'shrink',valign:'top'});
     const r=(x,y,w,h,color)=>sl.addShape(ppt.ShapeType.rect,{x,y,w,h,line:{color,transparency:100},fill:{color}});
     if(layout==='timeline'){
      const w=(12.05-(Math.max(n-1,0)*.16))/Math.max(n,1);
      r(.6,3.06,12,.06,'BACBE0');
      cards.forEach((a,j)=>{const x=.6+j*(w+.16);r(x,2.32,w,.13,j%2?'1F4F81':'F9B919');r(x,2.58,w,3.53,'F0F5FA');
       t(String(j+1).padStart(2,'0'),x+.16,2.79,w-.32,.44,24,'1F4F81',true);
       t(a[0],x+.16,3.45,w-.32,.57,14,'102F56',true);t(a[1],x+.16,4.15,w-.32,1.65,12);
      });
     }else if(layout==='risks'||layout==='stakeholders'){
      const h=Math.min(.98,3.9/Math.max(n,1));
      cards.forEach((a,j)=>{const y=2.18+j*(h+.15),left=layout==='risks'?.76:3.7;
       r(.6,y,12.05,h,'F0F5FA');r(.6,y,left,h,layout==='risks'?'F9B919':'1F4F81');
       if(layout==='risks')t(String(j+1),.82,y+.16,.39,.4,20,'102F56',true);
       t(a[0],layout==='risks'?1.56:.84,y+.13,layout==='risks'?2.75:3.1,h-.22,12,layout==='risks'?'102F56':'FFFFFF',true);
       t(a[1],4.55,y+.12,7.72,h-.22,12);
      });
     }else if(layout==='benefits'||layout==='comparison'){
      const cols=n===1?1:2,w=cols===1?12.05:5.94,h=n<=2?3.65:2.0;
      cards.forEach((a,j)=>{const x=.6+(j%cols)*6.14,y=2.18+Math.floor(j/cols)*(h+.17);
       r(x,y,w,h,j%2?'E7EFF8':'F0F5FA');r(x,y,w,.12,j%2?'1F4F81':'F9B919');
       t(a[0],x+.2,y+.25,w-.4,.47,14,'102F56',true);t(a[1],x+.2,y+.94,w-.4,h-1.12,13);
      });
     }else{
      const cols=n===1?1:2,nRows=Math.ceil(n/cols),gapX=.22,gapY=.16,w=cols===1?12.05:5.95,h=Math.min(3.72,(4.25-(nRows-1)*gapY)/Math.max(1,nRows));
      cards.forEach((a,j)=>{const x=.6+(j%cols)*(w+gapX),y=2.18+Math.floor(j/cols)*(h+gapY);
       r(x,y,w,h,'F0F5FA');r(x,y,.07,h,'F9B919');
       t(a[0],x+.2,y+.15,w-.42,.35,12,'1F4F81',true);
       t(a[1],x+.2,y+.6,w-.42,h-.75,12);
      });
     }
    }
    sl.addShape(ppt.ShapeType.rect,{x:0,y:7.22,w:13.333,h:.28,line:{color:page.kind==='cover'?PPTX_STYLE.navy:'EAF1F8',transparency:100},fill:{color:page.kind==='cover'?PPTX_STYLE.navy:'EAF1F8'}});
    sl.addText('PROGRAM TRANSFORMASI KEMENTERIAN KEUANGAN',{x:.6,y:7.26,w:9.8,h:.15,fontFace:PPTX_STYLE.font,fontSize:8,color:page.kind==='cover'?'C9D9EB':'66809D',margin:0});
    sl.addText((i+1)+' / '+count,{x:11.85,y:7.26,w:.85,h:.15,fontFace:PPTX_STYLE.font,fontSize:8,color:page.kind==='cover'?PPTX_STYLE.gold:'66809D',align:'right',margin:0});
   });
   await ppt.writeFile({fileName:file+'.pptx'});
  }
  registerExport('program',p.id||p.akr,year(),d.format,file+'.'+(d.format==='word'?'docx':d.format),{sections:d.sections.slice()});
  toast('Dokumen v'+version+' berhasil diunduh. Nomor versi belum berubah sampai bukti TTE dicatat.');
 }catch(err){toast('Ekspor gagal: '+(err.message||err))}
}

/* Portofolio: kompilasi per program dengan konfigurasi dan nomor versi tersendiri. */
const PROJECT_SECTIONS=[
 ['identity','Identitas Aplikasi'],
 ['validation','Identifikasi & Validasi'],
 ['strategic','Regulasi & Strategi'],
 ['business','Proses Bisnis'],
 ['development','Rencana Pengembangan']
];
function projectMode(){return S.ui?.psFlow?.tab==='mapping'&&window.MT_PS_SCOPE?.bank?.()?.mappingTab==='docs'}
function projectTarget(){return window.MT_PS_SCOPE?.target?.()||null}
function docSections(){return projectMode()?PROJECT_SECTIONS:STEPS}
function docKind(){return projectMode()?'proposals':'portfolio'}
function docId(){return projectMode()?String(projectTarget()?.id||'unselected'):'all'}
function projectFields(x,section){
 const get=k=>window.MT_PS_SCOPE?.projectValue?.(x,k)||x[k]||'Belum diisi';
 const sets={
 identity:[['Nama Aplikasi',get('applicationName')],['Nama Proyek / Modul',get('name')],['Fungsi Utama / Modul',get('mainFunction')],['Sub Modul',get('subModule')],['URL Aplikasi',get('url')],['Kategori',get('category')],['UIC Utama',get('uic')],['Status Usulan',get('status')],['Program Tujuan',projectTarget()?.nama||'—'],['Asal Program',x.psOriginProgram||'Usulan baru'],['Tahun Sumber',x.psOriginYear||'—']],
 validation:[['Identifikasi Tim BaTii',get('batiiIdentification')],['Konfirmasi Pemilik Proses Bisnis',get('probisConfirmation')],['Deskripsi Aplikasi / Modul',get('description')],['Urgensi',get('urgency')]],
 strategic:[['Landasan Hukum / Regulasi',get('legalBasis')],['Strategi Organisasi yang Didukung (Renstra Kementerian / UE I)',get('strategyAlignment')]],
 business:[['Proses Bisnis Terkait (Level 3, 4, atau 5)',get('businessProcess')],['Penjelasan / Narasi Proses Bisnis Aplikasi',get('businessNarrative')]],
 development:[['Fitur Utama yang Akan Dikembangkan',get('features')],['Rencana Mulai',get('start')],['Target Go-Live',get('goLive')]]
 };
 return sets[section]||[];
}
function portCfg(){
 S.ui.psBank=S.ui.psBank||{};
 const mode=projectMode(),key=mode?'proposalDocument':'portfolioDoc';
 const d=S.ui.psBank[key]||(S.ui.psBank[key]={format:'word',selected:[],sections:(mode?PROJECT_SECTIONS:STEPS).map(x=>x[0]),toc:true,sign:true,slide:0,initialized:false});
 if(!d.initialized){d.selected=portPrograms().map(p=>String(p.id));d.initialized=true}
 return d;
}
function portPrograms(){
 if(projectMode())return (projectTarget()?.psProjects||[]).map((x,i)=>({ ...x,nama:x.applicationName||x.name,kode:(projectTarget()?.kode||'')+' / '+(i+1),akr:'U-'+(i+1),jenis:x.category||'—',psProjects:[],psStatus:x.status||'Usulan',psOriginProgram:x.psOriginProgram||(x.psOriginYear?'Sumber historis':'Usulan baru'),psOriginYear:x.psOriginYear,uic:x.uic||projectTarget()?.uic }));
 return (S.programs||[]).filter(p=>+p.psYear===year()||(!p.psYear&&+p.mulai<=year()&&+(String(p.periode||'').match(/20\d{2}/g)||[]).slice(-1)[0]>=year()));
}
function portSelected(){const d=portCfg();return portPrograms().filter(p=>d.selected.includes(String(p.id)))}
function portData(){
 const d=portCfg();
 const steps=docSections(),mode=projectMode();
 return portSelected().map(p=>({p,blocks:steps.filter(x=>d.sections.includes(x[0])).map(x=>({title:x[1],rows:mode?projectFields(p,x[0]):fields(p,x[0],year())}))}));
}
function portfolioModel(){
 const d=portCfg(),data=portData(),mode=projectMode(),version=nextVersion(docKind(),docId(),year()),B=[],signer=tteState(d);
 const h1=x=>B.push({t:'h1',text:x}),h2=x=>B.push({t:'h2',text:x});
 const meaningful=rows=>rows.filter(x=>String(x[1]??'').trim()&&!/^belum diisi$/i.test(String(x[1]).trim()));
 h1('Ringkasan Eksekutif');
 B.push({t:'p',text:'Dokumen ini menghimpun informasi '+data.length+(mode?' usulan proyek pada program '+(projectTarget()?.nama||''):' program transformasi Kementerian Keuangan')+' tahun '+year()+'. Seluruh informasi bersumber dari isian program yang dipilih pada Modul Transformasi. Dokumen ini merupakan rancangan dan belum disahkan.'});
 B.push({t:'kv',rows:[['Tahun anggaran',String(year())],[mode?'Jumlah usulan proyek':'Jumlah program',String(data.length)],['Jumlah proyek terpetakan',String(mode?data.length:data.reduce((n,o)=>n+(o.p.psProjects||[]).length,0))],['Versi dokumen','v'+version],['Status','Rancangan (belum TTE)']]});
 h1(mode?'Ikhtisar Usulan Proyek':'Ikhtisar Portofolio Program');
 B.push({t:'table',caption:'Daftar program terpilih',head:mode?['No.','Kode','Nama Aplikasi / Proyek','UIC Utama','Status']:['No.','Kode Program','Program Transformasi','UIC Utama','Status'],widths:[7,17,40,20,16],
  rows:data.length?data.map((o,i)=>[String(i+1),officialCode(o.p),o.p.nama,o.p.uic||'—',o.p.psStatus||'Draft']):[['—','—','Belum ada program dipilih','—','—']]});
 data.forEach((o,i)=>{
  h1((mode?'Usulan Proyek ':'Program ')+String(i+1).padStart(2,'0')+' — '+o.p.nama);
  B.push({t:'kv',rows:[[mode?'Kode Usulan':'Kode Program',officialCode(o.p)],['UIC Utama',o.p.uic||'—'],['Jenis',o.p.jenis||'Berkelanjutan'],['Tahun',String(year())],['Status',o.p.psStatus||'Draft'],['Jumlah Proyek',String((o.p.psProjects||[]).length)],['Asal Program',o.p.psOriginProgram||(o.p.psCarry?.sourceYear?'Carry-over '+o.p.psCarry.sourceYear:'Program baru')]]});
  o.blocks.forEach(block=>{
   h2(block.title);
   const rows=meaningful(block.rows);
   if(rows.length){
    B.push({t:'table',caption:'Substansi '+block.title+' — '+o.p.nama,head:['Komponen','Uraian'],widths:[31,69],
     rows:rows.map(r=>[String(r[0]),String(r[1]??'—')])});
   }else B.push({t:'p',text:'Bagian '+block.title.toLowerCase()+' belum memiliki data yang diisi.'});
  });
 });
 h1('Catatan Penggunaan dan Pembaruan Dokumen');
 B.push({t:'bullets',items:['Dokumen memuat data program yang dipilih pada saat ekspor; perubahan isian setelah ekspor tidak otomatis mengubah berkas yang telah diunduh.','Nomor versi dokumen baru diterbitkan setelah PDF hasil TTE diunggah kembali sebagai bukti dukung.','Status dan bukti tanda tangan elektronik memerlukan verifikasi melalui layanan resmi sebelum dianggap sah.']});
 if(d.sign)B.push({t:'tte'});
 return {lang:'id',formal:true,template:d.template||'activity',toc:true,fileName:(mode?'Dokumen_Usulan_Proyek_':'Dokumen_Portofolio_Transformasi_')+year()+'_v'+version,
  header:(mode?'Dokumen Usulan Proyek · ':'Dokumen Portofolio Program Transformasi · ')+year(),
  cover:{kicker:mode?'DOKUMEN USULAN PROYEK':'DOKUMEN PORTOFOLIO',title:mode?String(projectTarget()?.nama||'Usulan Proyek'):'Portofolio Program Transformasi',subject:'Tahun Anggaran '+year(),
   chips:['Tahun '+year(),data.length+(mode?' usulan proyek':' program'),'Versi v'+version],scope:[],
   meta:[['Tahun Anggaran',String(year())],['Versi','v'+version],[mode?'Jumlah Usulan Proyek':'Jumlah Program',String(data.length)],['Unit Pengelola',String(ME?.unit||'—')],['Nomor Dokumen',signer.number||'Belum ditetapkan']],noTte:!d.sign,tte:{name:signer.name,title:signer.title,label:signer.label,city:signer.city,date:signer.date}},blocks:B};
}
function splitPortText(text,limit=155){
 const value=String(text||'Belum diisi').trim().replace(/\s+/g,' '),words=value.split(' '),out=[];let line='';
 words.forEach(word=>{
  if(word.length>limit){if(line){out.push(line);line=''}for(let i=0;i<word.length;i+=limit)out.push(word.slice(i,i+limit));return}
  if((line+' '+word).trim().length>limit){if(line)out.push(line);line=word}
  else line=(line+' '+word).trim();
 });
 if(line)out.push(line);return out.length?out:['Belum diisi'];
}
/* Content-specific PPTX layouts: native Charter remains untouched. */

/* Optional Navy-Gold Executive renderer: Charter original is always preserved. */
const mtExec=d=>d?.pptTemplate==='navy-gold-executive';
function mtExecSlide(ppt,sl,page,meta){
 if(page.kind==='native-charter')return false;
 const color={navy:'102F56',gold:'F9B919',mid:'1F4F81',pale:'E8EFF7',white:'FFFFFF',ink:'294765',gray:'6D8298'};
 const shape=ppt.ShapeType;
 const rect=(x,y,w,h,fill)=>sl.addShape(shape.rect,{x,y,w,h,line:{color:fill,transparency:100},fill:{color:fill}});
 const text=(v,x,y,w,h,size=14,c=color.ink,b=false,extra={})=>sl.addText(String(v??'—'),{x,y,w,h,fontFace:'Aptos',fontSize:size,color:c,bold:b,margin:0,fit:'shrink',valign:'mid',...extra});
 const footer=()=>{rect(0,7.14,13.333,.36,color.navy);text('MODUL TRANSFORMASI · KEMENTERIAN KEUANGAN',.55,7.21,9,.16,8,color.white);text((meta.index+1)+' / '+meta.count,11.6,7.21,1.1,.16,9,color.gold,false,{align:'right'})};
 if(page.kind==='cover'||page.kind==='divider'){
  sl.background={color:color.navy};rect(0,0,.2,7.12,color.gold);rect(11.2,0,2.13,7.1,color.mid);
  text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',.72,.61,10,.37,14,color.gold,true);
  text(page.kind==='divider'?'PROGRAM / PROYEK '+String(page.programIndex||1).padStart(2,'0'):meta.label,.73,1.54,9.5,.5,17,'DAE6F3',true);
  text(page.kind==='divider'?page.program?.nama:meta.name,.73,2.21,10.1,2.14,32,color.white,true,{valign:'mid'});
  rect(.73,5.15,2.4,.09,color.gold);text('TAHUN '+meta.year+'   |   VERSI '+meta.version,.73,5.47,8,.37,15,'E4EDF5');footer();return true;
 }
 sl.background={color:color.white};rect(0,0,13.333,.13,color.gold);
 text('KEMENTERIAN KEUANGAN  /  '+meta.year,.6,.39,10,.26,11,color.mid,true);
 text(page.title||'Ringkasan',.6,.88,12,.62,27,color.navy,true);
 text(page.program?.nama||meta.name||'',.6,1.54,12,.3,11,color.gray);
 const rows=page.rows||[];
 if(page.kind==='overview'){
  rect(.6,2.05,12.08,.62,color.navy);text('PETA PROGRAM / PROYEK',.86,2.2,11.4,.3,17,color.white,true);
  (page.programs||[]).forEach((p,j)=>{let x=.6+j%2*6.15,y=2.88+Math.floor(j/2)*.58;rect(x,y,5.9,.48,j%2?color.pale:'F3F7FB');text(String((page.programOffset||0)+j+1).padStart(2,'0'),x+.13,y+.1,.36,.23,10,color.mid,true);text(p.nama||p.name,x+.6,y+.08,5.08,.3,12,color.navy,true)});
 }else if(page.kind==='tte'){
  rows.forEach((r,j)=>{let x=.6+(j%2)*6.12,y=2.14+Math.floor(j/2)*1.05;rect(x,y,5.96,.9,color.pale);text(r[0],x+.17,y+.1,5.6,.25,11,color.mid,true);text(r[1],x+.17,y+.43,5.6,.30,15,color.navy)});
 }else{
  const kind=mtPptLayout(page.title),n=rows.length,cols=kind==='stakeholders'||kind==='risks'?1:kind==='timeline'?Math.max(n,1):n===1?1:2;
  if(kind==='timeline')rect(.7,3.30,11.84,.07,color.gold);
  rows.forEach((r,j)=>{
   if(kind==='risks'||kind==='stakeholders'){
    const ht=Math.min(.91,4.2/Math.max(n,1)),y=2.10+j*(ht+.13);
    rect(.6,y,12.08,ht,j%2?color.pale:'F3F7FB');rect(.6,y,kind==='risks'?.11:3.45,ht,kind==='risks'?color.gold:color.navy);
    text(r[0],kind==='risks'?.89:.82,y+.11,kind==='risks'?3.0:3.06,ht-.18,13,kind==='risks'?color.navy:color.white,true);
    text(r[1],4.48,y+.11,7.8,ht-.18,12,color.ink,false,{valign:'mid'});return;
   }
   if(kind==='timeline'){
    const w=(12.08-(n-1)*.14)/Math.max(n,1),x=.6+j*(w+.14);
    rect(x,2.22,w,.52,j%2?color.mid:color.navy);text(String(j+1).padStart(2,'0'),x+.14,2.30,w-.28,.3,18,color.white,true);
    rect(x,2.90,w,3.0,color.pale);text(r[0],x+.17,3.13,w-.34,.69,15,color.navy,true,{valign:'top'});text(r[1],x+.17,4.03,w-.34,1.65,12,color.ink,false,{valign:'top'});return;
   }
   const w=cols===1?12.08:5.96,x=.6+j%cols*6.12,y=2.10+Math.floor(j/cols)*2.13,ht=1.95;
   rect(x,y,w,ht,j%2?color.pale:'F3F7FB');rect(x,y,kind==='benefits'?w:.09,kind==='benefits'?.10:ht,j%2?color.mid:color.gold);
   text(r[0],x+.20,y+.21,w-.42,.49,16,color.navy,true);
   text(r[1],x+.20,y+.83,w-.42,.89,12,color.ink,false,{valign:'top'});
  });
 }
 footer();return true;
}
function mtExecPreview(page,meta){
 if(page.kind==='native-charter')return null;
 if(page.kind==='cover'||page.kind==='divider')return '<div style="background:#102F56;border-left:9px solid #F9B919;padding:28px;min-height:260px;color:#fff"><small style="color:#F9B919">KEMENTERIAN KEUANGAN</small><h2 style="font-size:28px;color:#fff;margin:55px 0 18px">'+E(page.kind==='divider'?page.program?.nama:meta.name)+'</h2><p>'+meta.year+' · Navy–Gold Executive</p></div>';
 const head='<div style="background:#102F56;color:#fff;border-top:5px solid #F9B919;padding:12px 16px"><small style="color:#F9B919">KEMENTERIAN KEUANGAN / '+meta.year+'</small><h2 style="color:#fff;margin:8px 0">'+E(page.title||'Ringkasan')+'</h2></div>';
 if(page.kind==='overview')return head+'<div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px">'+(page.programs||[]).map((p,i)=>'<div style="padding:12px;background:#E8EFF7;color:#102F56"><b>'+String(i+1).padStart(2,'0')+'</b> '+E(p.nama||p.name)+'</div>').join('')+'</div>';
 return head+'<div style="padding:14px 2px">'+mtPptRowsHtml(page.rows||[],page.title)+'</div>';
}
function mtPptLayout(title){
 const t=String(title||'').toLowerCase();
 if(/manfaat|benefit/.test(t))return 'benefits';
 if(/risiko|risk/.test(t))return 'risks';
 if(/linimasa|rencana pengembangan|tata kelola|governance/.test(t))return 'timeline';
 if(/perbandingan|proses bisnis|business case|identifikasi & validasi/.test(t))return 'comparison';
 if(/stakeholder|pemangku kepentingan/.test(t))return 'stakeholders';
 return 'editorial';
}
function mtPptRowsHtml(rows,title){
 const kind=mtPptLayout(title),data=rows||[],esc=E;
 const card=r=>'<div style="padding:12px 14px;background:#f1f5fa;border-left:4px solid #f9b919;min-width:0"><b style="display:block;color:#1f4f81;font-size:12px">'+esc(r[0])+'</b><p style="margin:5px 0 0;color:#254568;font-size:13px;overflow-wrap:anywhere">'+esc(r[1])+'</p></div>';
 if(kind==='timeline')return '<div style="display:grid;grid-template-columns:repeat('+Math.min(4,Math.max(1,data.length))+',1fr);gap:9px;align-items:stretch">'+data.map((r,i)=>'<div style="border-top:5px solid #1f4f81;padding:12px;background:#f1f5fa;min-width:0"><strong style="color:#d19b00;font-size:18px">'+String(i+1).padStart(2,'0')+'</strong><b style="display:block;color:#102f56;font-size:12px;margin:5px 0">'+esc(r[0])+'</b><p style="font-size:12px;margin:0;overflow-wrap:anywhere">'+esc(r[1])+'</p></div>').join('')+'</div>';
 if(kind==='risks')return '<div style="display:flex;flex-direction:column;gap:9px">'+data.map((r,i)=>'<div style="display:grid;grid-template-columns:34px 1fr 2fr;gap:12px;align-items:center;padding:10px;background:#f1f5fa;border-left:4px solid #d59b23"><b style="color:#1f4f81">'+(i+1)+'</b><b style="font-size:12px;color:#102f56">'+esc(r[0])+'</b><span style="font-size:12px">'+esc(r[1])+'</span></div>').join('')+'</div>';
 if(kind==='benefits')return '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">'+data.map((r,i)=>'<div style="padding:15px;background:'+(i%2?'#e6eef7':'#f1f5fa')+';border-bottom:4px solid '+(i%2?'#1f4f81':'#f9b919')+'"><b style="font-size:13px;color:#102f56">'+esc(r[0])+'</b><p style="font-size:13px;color:#254568;overflow-wrap:anywhere">'+esc(r[1])+'</p></div>').join('')+'</div>';
 if(kind==='comparison')return '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">'+data.map((r,i)=>'<div style="padding:14px;background:'+(i%2?'#e7f0f8':'#f1f5fa')+';border-top:5px solid '+(i%2?'#1f4f81':'#f9b919')+'"><b style="font-size:12px;color:#102f56">'+esc(r[0])+'</b><p style="font-size:13px;overflow-wrap:anywhere">'+esc(r[1])+'</p></div>').join('')+'</div>';
 if(kind==='stakeholders')return '<div style="display:flex;flex-direction:column;gap:9px">'+data.map((r,i)=>'<div style="display:grid;grid-template-columns:40% 60%;background:#f1f5fa;min-width:0"><b style="padding:12px;background:#173e69;color:#fff;font-size:12px">'+esc(r[0])+'</b><span style="padding:12px;font-size:12px;overflow-wrap:anywhere">'+esc(r[1])+'</span></div>').join('')+'</div>';
 return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+data.map(card).join('')+'</div>';
}
function portSlides(){
 const data=portData(),mode=projectMode(),slides=[{kind:'cover',title:mode?'DOKUMEN USULAN PROYEK':'PORTOFOLIO PROGRAM TRANSFORMASI',programs:data.map(x=>x.p)}];
 for(let o=0;o<Math.max(1,data.length);o+=12)slides.push({kind:'overview',title:(mode?'Ikhtisar Usulan Proyek':'Peta Portofolio Transformasi')+(o?' (lanjutan)':''),programs:data.slice(o,o+12).map(x=>x.p),programOffset:o});
 data.forEach((o,i)=>{
  slides.push({kind:'divider',program:o.p,programIndex:i+1,totalPrograms:data.length});
  o.blocks.forEach(block=>{
   // Charter resmi selalu menggunakan tiga slide asli dari tab Charter Program.
   if(!mode&&block.title==='Charter Program'){
    slides.push(...charterPptSlides(o.p).map(page=>({...page,program:o.p,programIndex:i+1})));
    return;
   }
   const cards=[];
   (block.rows.length?block.rows:[['Substansi','Belum diisi']]).forEach(row=>{
    const parts=splitPortText(row[1]);parts.forEach((part,j)=>cards.push([String(row[0])+(j?' · lanjutan '+(j+1):''),part]));
   });
   for(let j=0;j<cards.length;j+=4)slides.push({kind:'section',program:o.p,programIndex:i+1,title:block.title+(j?' (lanjutan)':''),rows:cards.slice(j,j+4)});
  });
 });
 if(portCfg().sign){const t=tteState(portCfg());slides.push({kind:'tte',title:'Penandatanganan Elektronik (Rancangan)',rows:[
 ['Nama Pejabat',t.name||'Belum ditetapkan'],['Jabatan',t.title||'Belum ditetapkan'],
 ['Keterangan',t.label],['Tempat dan Tanggal',t.city+', '+t.date],['Nomor Dokumen',t.number||'Belum ditetapkan']
 ]})}
 return slides;
}
function portfolioPreview(){
 const d=portCfg(),data=portData(),mode=projectMode(),v=nextVersion(docKind(),docId(),year());
 if(d.format==='pptx'){
  const deck=portSlides(),i=Math.max(0,Math.min(+d.slide||0,Math.max(0,deck.length-1))),x=deck[i]||{},fmt=E;
  let body='';
  if(mtExec(d)){const a=mtExecPreview(x,{name:mode?'Usulan Proyek':'Portofolio Transformasi',year:year()});if(a!==null)body=a;}
  if(x.kind==='native-charter')body=programSlideHtml(x.program,x,i,deck.length,v);
  else if(body){/* alternative preview already generated */}
  else if(x.kind==='cover')body='<div class="psbank-port-slide-cover"><small>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</small><div class="port-gold-rule"></div><h2>'+(mode?'DOKUMEN<br>USULAN PROYEK':'PORTOFOLIO<br>PROGRAM TRANSFORMASI')+'</h2><p>Tahun '+year()+' · Versi '+v+'</p><strong>'+data.length+(mode?' PROYEK TERPILIH':' PROGRAM TERPILIH')+'</strong></div>';
  else if(x.kind==='overview')body='<div class="psbank-port-slide-overview"><small>RINGKASAN EKSEKUTIF · '+year()+'</small><h2>'+fmt(x.title)+'</h2><div class="port-preview-metrics"><span><b>'+data.length+'</b> '+(mode?'Usulan Proyek':'Program')+'</span><span><b>'+data.reduce((n,o)=>n+(o.p.psProjects||[]).length,0)+'</b> Usulan Proyek</span></div><div class="port-preview-list">'+(x.programs||[]).map((p,j)=>'<p><b>'+String((x.programOffset||0)+j+1).padStart(2,'0')+'</b> '+fmt(p.nama)+' <small>'+fmt(officialCode(p))+'</small></p>').join('')+'</div></div>';
  else if(x.kind==='divider')body='<div class="psbank-port-slide-cover"><small>'+(mode?'PROYEK ':'PROGRAM ')+String(x.programIndex).padStart(2,'0')+' / '+x.totalPrograms+'</small><div class="port-gold-rule"></div><h2>'+fmt(x.program?.nama||'')+'</h2><p>'+fmt(x.program?.kode||x.program?.akr)+' · '+year()+'</p><strong>'+(mode?'SUBSTANSI PROYEK':'SUBSTANSI PROGRAM')+'</strong></div>';
  else if(x.kind==='tte')body='<div class="psbank-port-slide-section"><small>RANCANGAN · BUKAN TTE YANG TELAH DIVERIFIKASI</small><h2>'+fmt(x.title)+'</h2><p>Identitas penandatangan</p><div class="port-card-grid count-4">'+x.rows.map(row=>'<article><b>'+fmt(row[0])+'</b><p>'+fmt(row[1])+'</p></article>').join('')+'</div></div>';
  else body='<div class="psbank-port-slide-section"><small>'+(mode?'PROYEK ':'PROGRAM ')+String(x.programIndex).padStart(2,'0')+' · '+fmt(x.program?.kode||x.program?.akr)+'</small><h2>'+fmt(x.title)+'</h2><p>'+fmt(x.program?.nama)+'</p>'+mtPptRowsHtml(x.rows,x.title)+'</div>';
  return '<div class="psbank-port-slide">'+body+'<footer>MODUL TRANSFORMASI KEMENTERIAN KEUANGAN <span>v'+v+' · '+(i+1)+' / '+deck.length+'</span></footer></div>'+
   '<div class="psbank-slidecontrols"><button class="btn" data-port-slide="-1" '+(!i?'disabled':'')+'>‹ Sebelumnya</button><span>Slide '+(i+1)+' / '+deck.length+'</span><button class="btn" data-port-slide="1" '+(i>=deck.length-1?'disabled':'')+'>Berikutnya ›</button></div>';
 }
 const model=portfolioModel();
 if(typeof mtRptHtml==='function'){
  const html=mtRptHtml(model);
  return actualPreviewShell('portfolio',d.format,'<iframe class="psbank-port-report-frame" title="Pratinjau awal dokumen portofolio '+(d.format==='pdf'?'PDF':'Word')+'" srcdoc="'+E(html)+'"></iframe>');
 }
 return '<article class="psbank-docpaper"><header class="psbank-doccover"><small>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</small><h2>'+E(model.cover.title)+'</h2><h3>'+year()+' · Versi '+v+'</h3></header>'+
  model.blocks.map(b=>b.t==='h1'?'<section class="psbank-docsection"><h3>'+E(b.text)+'</h3></section>':b.t==='h2'?'<h4>'+E(b.text)+'</h4>':b.t==='p'?'<p>'+E(b.text)+'</p>':b.t==='table'?'<section class="psbank-docsection"><table><thead><tr>'+b.head.map(x=>'<th>'+E(x)+'</th>').join('')+'</tr></thead><tbody>'+b.rows.map(row=>'<tr>'+row.map(v=>'<td>'+E(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></section>':'').join('')+'</article>';
}
function portfolioBuilder(){
 const d=portCfg(),all=portPrograms(),chosen=portSelected(),mode=projectMode(),steps=docSections(),ver=nextVersion(docKind(),docId(),year());
 return '<div class="psbank-card psbank-portfolio-doc"><div class="psbank-sectionhead"><div><h3>'+(mode?'Buat Dokumen Proyek':'Buat Dokumen Portofolio')+' · '+year()+'</h3><p>'+(mode?'Pilih proyek dalam program induk, tentukan substansi, kemudian pratinjau dan unduh dokumen proyek.':'Kompilasi substansi beberapa program, dikelompokkan menurut program sumbernya.')+'</p></div><span class="psbank-count">'+chosen.length+' dari '+all.length+(mode?' usulan proyek':' program')+'</span></div>'+
 '<div class="psbank-docbuilder"><div class="psbank-docsettings"><div class="psbank-doccheckhead"><b>'+(mode?'Pilih Proyek':'Pilih Program')+'</b><button class="btn" type="button" data-port-all>'+(chosen.length===all.length?'Kosongkan':'Pilih Semua')+'</button></div>'+
 '<div class="psbank-portfolio-checks">'+(all.length?all.map(p=>'<label><input type="checkbox" data-port-program="'+E(p.id)+'" '+(d.selected.includes(String(p.id))?'checked':'')+'><span><b>'+E(p.nama)+'</b><small>'+E(officialCode(p))+'</small></span></label>').join('') :'<p>Belum ada '+(mode?'usulan proyek':'program')+' pada tahun ini.</p>')+'</div>'+
 '<div class="psbank-doccheckhead"><b>Substansi</b><span>'+d.sections.length+'/'+steps.length+' dipilih</span></div><div class="psbank-docchecks">'+steps.map((x,i)=>'<label><input type="checkbox" data-port-section="'+x[0]+'" '+(d.sections.includes(x[0])?'checked':'')+'>'+(i+1)+'. '+x[1]+'</label>').join('')+'</div>'+
 tteControls(d,'port')+
 '<div class="psbank-template-picker"><label><b>Template dokumen Word/PDF</b><select data-port-template aria-label="Pilih template dokumen">'+[['activity','Warna · Laporan Kegiatan'],['classic','Formal · Navy-Emas']].map(([k,v])=>'<option value="'+k+'" '+((d.template||'activity')===k?'selected':'')+'>'+v+'</option>').join('')+'</select></label><small>Pratinjau dan unduhan memakai template yang sama.</small></div>'+
 (d.format==='pptx'?'<div class="psbank-template-picker"><label><b>Template PPTX</b><select data-port-ppt-template aria-label="Pilihan template PowerPoint">'+[['standard','Standar (lama)'],['navy-gold-executive','Navy–Gold Executive (alternatif)']].map(([k,v])=>'<option value="'+k+'" '+((d.pptTemplate||'standard')===k?'selected':'')+'>'+v+'</option>').join('')+'</select></label><small>Charter tetap menggunakan desain aslinya.</small></div>':'')+
 '<div class="psbank-docformat"><strong>Format Ekspor</strong><div class="psbank-formatbuttons">'+[['pdf','PDF'],['word','DOCX'],['pptx','PPTX']].map(x=>'<button type="button" class="btn '+(d.format===x[0]?'on':'')+'" data-port-format="'+x[0]+'" aria-pressed="'+(d.format===x[0])+'">'+x[1]+'</button>').join('')+'</div></div>'+
 versionPanel(docKind(),docId(),year())+'</div>'+
 '<div class="psbank-docpreview"><div class="psbank-docpreview-head"><div><b>Pratinjau '+(d.format==='pptx'?'PowerPoint':d.format==='pdf'?'PDF':'Word')+'</b><small>'+(mode?'Dokumen Proyek':'Portofolio Transformasi')+' '+year()+'</small></div><span>v'+ver+' · '+chosen.length+(mode?' proyek':' program')+'</span></div>'+
 '<div class="psbank-docscroll">'+portfolioPreview()+'</div><div class="psbank-portfolio-download"><button type="button" class="btn pri" data-port-export '+(!chosen.length||!d.sections.length?'disabled':'')+'>↓ Unduh</button></div></div></div></div>';
}
async function portfolioExport(){
 const d=portCfg(),data=portData(),mode=projectMode();
 if(!data.length||!d.sections.length){toast('Pilih program dan substansi terlebih dahulu.');return}
 const model=portfolioModel(),version=nextVersion(docKind(),docId(),year()),file=model.fileName;
 try{
  if(d.format==='word'){
   if(typeof mtRptDocx!=='function'||typeof mtRptDownloadBlob!=='function')throw new Error('Mesin laporan Word Project Management belum tersedia.');
   if(typeof window.JSZip==='undefined')await load('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!window.JSZip);
   const blob=await assertOfficialWordTemplate(await mtRptDocx(model));
   mtRptDownloadBlob(blob,file+'.docx');
  }else if(d.format==='pdf'){
   await exportFormalPdf(portfolioModel(),file+'.pdf');
  }else{
   await load('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js',()=>!!window.PptxGenJS);
   const ppt=new window.PptxGenJS();ppt.layout='LAYOUT_WIDE';ppt.author='PMO Kementerian Keuangan';
   ppt.subject='Dokumen Portofolio Program Transformasi '+year();ppt.title=(mode?'Dokumen Usulan Proyek ':'Portofolio Transformasi ')+year();
   const {navy:N,mid:MID,gold:G,white:W,pale:PALE,text:TEXT,muted:MUTED,font:FONT}=PPTX_STYLE,Shape=ppt.ShapeType;
   const slides=portSlides(),count=slides.length;
   const tx=(sl,t,x,y,w,h,size=14,color=TEXT,bold=false,other={})=>sl.addText(String(t||'—'),{x,y,w,h,fontFace:FONT,fontSize:size,bold,color,margin:0,breakLine:false,fit:'shrink',valign:'mid',...other});
   const rect=(sl,x,y,w,h,fill,line=fill,radius=0)=>sl.addShape(radius?Shape.roundRect:Shape.rect,{x,y,w,h,rectRadius:radius,rect:{radius},line:{color:line,transparency:line===fill?100:0},fill:{color:fill},radius});
   const footer=(sl,i,dark=false)=>{
    rect(sl,0,7.22,13.333,.28,dark?N:'E9F0F7');
    tx(sl,'KEMENTERIAN KEUANGAN · PORTOFOLIO TRANSFORMASI '+year(),.5,7.25,10,.16,8.5,dark?'C2D3E8':MUTED);
    tx(sl,'v'+version+'   '+i+' / '+count,11.5,7.25,1.35,.16,8.5,dark?'FCD67A':MID,false,{align:'right'});
   };
   slides.forEach((page,i)=>{
    const sl=ppt.addSlide(),num=i+1;sl.background={color:page.kind==='cover'||page.kind==='divider'?N:W};
    if(page.kind==='native-charter'){
     const native=page.native;
     sl.background={color:native.bg||'FFFFFF'};
     (native.E||[]).forEach(e=>{
      if(e.t==='r'||e.t==='e'){
       sl.addShape(e.t==='e'?ppt.ShapeType.ellipse:(e.rad?ppt.ShapeType.roundRect:ppt.ShapeType.rect),{
        x:e.x,y:e.y,w:e.w,h:e.h,
        fill:{color:e.fill,transparency:e.tr||0},
        line:e.line?{color:e.line,width:e.lw||.75}:{type:'none'},
        rectRadius:e.rad?Math.min(e.w,e.h)*e.rad:undefined
       });
       return;
      }
      const options={x:e.x,y:e.y,w:e.w,h:e.h,fontFace:'Calibri',fontSize:e.s,
       color:e.c||'12275A',bold:!!e.b,italic:!!e.i,align:e.a||'left',
       valign:e.v||'top',margin:2,charSpacing:e.sp||0,paraSpaceAfter:e.bul?3:0};
      if(Array.isArray(e.txt))sl.addText(e.txt.map((t,j)=>({text:t,options:{
       bullet:e.bul?{indent:12}:false,breakLine:j<e.txt.length-1}})),options);
      else sl.addText(String(e.txt||''),options);
     });
     return;
    }
    if(mtExec(d)&&mtExecSlide(ppt,sl,page,{index:i,count,year:year(),version,name:mode?'USULAN PROYEK':'PORTOFOLIO PROGRAM',label:mode?'DOKUMEN USULAN PROYEK':'PORTOFOLIO TRANSFORMASI'}))return;
    if(page.kind==='cover'){
     rect(sl,.65,1.0,.13,4.9,G);
     tx(sl,'KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',1.04,.74,11,.35,15,G,true);
     tx(sl,mode?'DOKUMEN USULAN':'PORTOFOLIO',1.03,2.05,11,.82,44,W,true);
     tx(sl,mode?'PROYEK':'PROGRAM TRANSFORMASI',1.03,2.96,11,.75,36,W,true);
     tx(sl,'Tahun Anggaran '+year()+' · Versi '+version,1.05,4.35,10,.4,18,'CBDCF0');
     rect(sl,1.03,5.35,4.8,.52,MID);tx(sl,data.length+(mode?' USULAN PROYEK':' PROGRAM TERPILIH'),1.25,5.43,4.3,.35,16,W,true);
     footer(sl,num,true);return;
    }
    if(page.kind==='tte'){
     rect(sl,0,0,13.333,.16,G);
     tx(sl,'RANCANGAN PENANDATANGANAN ELEKTRONIK',.65,.52,12,.3,12,MID,true);
     tx(sl,'Halaman TTE',.65,1.08,11,.75,31,N,true);
     (page.rows||[]).forEach((row,i)=>{const xx=.66+(i%2)*6.22,yy=2.15+Math.floor(i/2)*1.15;
      rect(sl,xx,yy,5.92,1.02,PALE);rect(sl,xx,yy,.07,1.02,G);
      tx(sl,row[0],xx+.16,yy+.12,5.54,.26,11,MID,true);
      tx(sl,row[1],xx+.16,yy+.45,5.54,.4,15,TEXT);
     });footer(sl,num);return;
    }
    if(page.kind==='divider'){
     tx(sl,(mode?'PROYEK ':'PROGRAM ')+String(page.programIndex).padStart(2,'0')+' / '+page.totalPrograms,.87,1.0,10,.5,17,G,true);
     rect(sl,.88,1.8,.17,3.2,G);
     tx(sl,page.program?.nama,1.34,2.05,10.7,2.1,35,W,true,{valign:'mid'});
     tx(sl,page.program?.kode||page.program?.akr,1.38,4.65,9,.5,18,'D4E2F2');
     footer(sl,num,true);return;
    }
    rect(sl,0,0,13.333,.16,G);
    tx(sl,'PORTOFOLIO TRANSFORMASI / '+year(),.59,.42,11,.27,11,MID,true);
    if(page.kind==='overview'){
     tx(sl,mode?'Ikhtisar Usulan Proyek':'Peta Portofolio Program',.57,.92,11.8,.65,27,N,true);
     const totalProjects=data.reduce((n,o)=>n+(o.p.psProjects||[]).length,0);
     rect(sl,.6,1.86,5.86,1.06,PALE);rect(sl,6.85,1.86,5.87,1.06,PALE);
     tx(sl,String(data.length),.88,2.02,.85,.62,29,N,true);
     tx(sl,mode?'PROYEK TERPILIH':'PROGRAM TERPILIH',1.88,2.1,4,.37,12,MID,true);
     tx(sl,String(totalProjects),7.14,2.02,1.1,.62,29,N,true);
     tx(sl,'USULAN PROYEK',8.46,2.1,3.7,.37,12,MID,true);
     (page.programs||[]).forEach((program,j)=>{
      const col=j%2,row=Math.floor(j/2),xx=.6+col*6.25,yy=3.23+row*.55;
      rect(sl,xx,yy,5.85,.48,row%2?'F6F9FD':PALE);
      tx(sl,String((page.programOffset||0)+j+1).padStart(2,'0'),xx+.12,yy+.09,.36,.24,10,MID,true);
      tx(sl,program.nama,xx+.6,yy+.05,4.5,.37,11.5,N,true);
      tx(sl,officialCode(program),xx+5.05,yy+.13,.66,.23,8.5,MUTED,false,{align:'right'});
     });
     footer(sl,num);return;
    }
    tx(sl,(mode?'USULAN PROYEK ':'PROGRAM ')+String(page.programIndex).padStart(2,'0')+'  ·  '+(page.program?.kode||page.program?.akr),.59,.80,11,.32,11,MID,true);
    tx(sl,page.title,.59,1.2,11.9,.55,26,N,true);
    tx(sl,page.program?.nama,.6,1.78,11.6,.38,12,MUTED);
    const cards=page.rows||[],n=cards.length,layout=mtPptLayout(page.title);
    if(layout==='timeline'){
     const w=(12.05-(Math.max(n-1,0)*.15))/Math.max(n,1);
     rect(sl,.62,3.15,12,.055,'B8CBE0');
     cards.forEach((card,j)=>{const xx=.62+j*(w+.15);
      rect(sl,xx,2.55,w,.10,j%2?MID:G);rect(sl,xx,2.73,w,3.15,PALE);
      tx(sl,String(j+1).padStart(2,'0'),xx+.18,2.98,w-.36,.44,25,MID,true);
      tx(sl,card[0],xx+.18,3.53,w-.36,.65,14,N,true,{valign:'top'});
      tx(sl,card[1],xx+.18,4.28,w-.36,1.36,12,TEXT,false,{valign:'top'});
     });
    }else if(layout==='risks'||layout==='stakeholders'){
     const h=Math.min(.98,4.0/Math.max(n,1));
     cards.forEach((card,j)=>{const yy=2.43+j*(h+.14);
      rect(sl,.62,yy,12.05,h,PALE);
      rect(sl,.62,yy,layout==='risks'?.76:3.7,h,layout==='risks'?G:MID);
      if(layout==='risks')tx(sl,String(j+1).padStart(2,'0'),.77,yy+.12,.45,h-.2,20,N,true);
      tx(sl,card[0],layout==='risks'?1.58: .83,yy+.10,layout==='risks'?3.5:3.15,h-.18,layout==='risks'?13:12,layout==='risks'?N:W,true);
      tx(sl,card[1],4.55,yy+.10,7.83,h-.17,12,TEXT,false,{valign:'mid'});
     });
    }else if(layout==='benefits'){
     const cols=n===1?1:2,w=cols===1?12.05:5.95,h=n<=2?3.65:2.03;
     cards.forEach((card,j)=>{const xx=.62+(j%cols)*6.13,yy=2.43+Math.floor(j/cols)*(h+.16);
      rect(sl,xx,yy,w,h,j%2?'E6EEF7':PALE);
      rect(sl,xx,yy,w,.11,j%2?MID:G);
      tx(sl,card[0],xx+.23,yy+.28,w-.46,.52,16,N,true);
      tx(sl,card[1],xx+.23,yy+.97,w-.46,h-1.15,n<=2?16:12.5,TEXT,false,{valign:'top'});
     });
    }else if(layout==='comparison'){
     const cols=n===1?1:2,w=cols===1?12.05:5.95,h=n<=2?3.7:2.04;
     cards.forEach((card,j)=>{const xx=.62+(j%cols)*6.13,yy=2.43+Math.floor(j/cols)*(h+.15);
      rect(sl,xx,yy,w,h,j%2?'E8F0F8':PALE);rect(sl,xx,yy,w,.11,j%2?MID:G);
      tx(sl,card[0],xx+.2,yy+.27,w-.4,.48,14,N,true);
      tx(sl,card[1],xx+.2,yy+.91,w-.4,h-1.08,13,TEXT,false,{valign:'top'});
     });
    }else{
     const oneCol=n===1,cols=oneCol?1:2,rows=Math.ceil(n/cols),gapX=.22,gapY=.17;
     const w=oneCol?12.05:5.95,h=Math.min(4.25,(4.3-(rows-1)*gapY)/Math.max(1,rows));
     cards.forEach((card,j)=>{const col=j%cols,row=Math.floor(j/cols),xx=.62+col*(w+gapX),yy=2.45+row*(h+gapY);
      rect(sl,xx,yy,w,h,PALE);rect(sl,xx,yy,.07,h,G);
      tx(sl,card[0],xx+.2,yy+.17,w-.44,.36,12,MID,true);
      tx(sl,card[1],xx+.2,yy+.64,w-.44,h-.82,oneCol?17:12.5,TEXT,false,{valign:'top'});
     });
    }
    footer(sl,num);
   });
   await ppt.writeFile({fileName:file+'.pptx'});
  }
  registerExport(docKind(),docId(),year(),d.format,file+'.'+(d.format==='word'?'docx':d.format),{sections:d.sections.slice(),projects:data.map(o=>o.p.id)});
  toast((mode?'Dokumen Proyek':'Dokumen Portofolio')+' v'+version+' berhasil diunduh. Versi bertambah setelah unggah bukti TTE.');
 }catch(e){toast('Ekspor '+(mode?'dokumen proyek':'portofolio')+' gagal: '+(e.message||e))}
}

function portfolioClick(ev){
 const d=portCfg();
 const fmt=ev.target.closest('[data-port-format]');
 if(fmt){d.format=fmt.dataset.portFormat;d.slide=0;save();render();return true}
 const slide=ev.target.closest('[data-port-slide]');
 if(slide){d.slide=Math.max(0,Math.min(portSlides().length-1,(+d.slide||0)+ +slide.dataset.portSlide));save();render();return true}
 if(ev.target.closest('[data-port-all]')){d.selected=d.selected.length===portPrograms().length?[]:portPrograms().map(p=>String(p.id));save();render();return true}
 if(ev.target.closest('[data-port-export]')){portfolioExport();return true}
 return false;
}
function portfolioChange(ev){
 const q=ev.target,d=portCfg();
 if(q.dataset.portPptTemplate!==undefined){d.pptTemplate=q.value==='navy-gold-executive'?'navy-gold-executive':'standard';d.slide=0;save();render();return true}
 if(q.dataset.portTemplate!==undefined){d.template=q.value==='classic'?'classic':'activity';save();render();return true}
 if(q.dataset.portTte!==undefined){tteState(d)[q.dataset.portTte]=q.value;d.tteOpen=true;save();render();return true}
 if(q.hasAttribute('data-port-include-tte')){d.sign=q.checked;d.tteOpen=true;save();render();return true}
 if(q.dataset.portProgram!==undefined){const id=q.dataset.portProgram;d.selected=q.checked?[...new Set([...d.selected,id])]:d.selected.filter(x=>x!==id);d.slide=0;save();render();return true}
 if(q.dataset.portSection!==undefined){const k=q.dataset.portSection;d.sections=q.checked?[...new Set([...d.sections,k])]:d.sections.filter(x=>x!==k);d.slide=0;save();render();return true}
 return false;
}

async function processSigned(ev){
 const btn=ev.target.closest('[data-doc-signed-kind]');if(!btn)return false;
 const wrap=btn.closest('.psbank-version-panel'),file=wrap?.querySelector('[data-doc-signed-file]')?.files?.[0],
  attested=wrap?.querySelector('[data-doc-signed-attest]')?.checked;
 try{
  const v=await confirmSigned(btn.dataset.docSignedKind,btn.dataset.docSignedId,+btn.dataset.docSignedYear,file,attested);
  toast('Bukti TTE versi '+v+' tercatat. Draft selanjutnya adalah versi '+(v+1)+'.');
  const overlay=btn.closest('.psbank-overlay'),p=(S.programs||[]).find(x=>String(x.id||x.akr)===btn.dataset.docSignedId);
  if(overlay&&p){const body=overlay.querySelector('.psbank-dialogbody');if(body)body.innerHTML=builder(p)}
  else render();
 }catch(e){toast(e.message||String(e))}
 return true;
}
function click(ev,p,inline=false){
 const format=ev.target.closest('[data-doc-format-btn]');
 if(format){const d=cfg();d.format=format.dataset.docFormatBtn;d.slide=0;save();if(!inline)render();return true}
 const slide=ev.target.closest('[data-doc-slide]');
 if(slide){const d=cfg();d.slide=Math.max(0,Math.min(programDeck(p).length-1,(+d.slide||0)+ +slide.dataset.docSlide));save();if(!inline)render();return true}
 if(ev.target.closest('[data-doc-export]')){exportFile(p);return true}
 if(ev.target.closest('[data-doc-signed-kind]')){processSigned(ev);return true}
 if(ev.target.closest('[data-doc-proof-open]')){openSignedProof(ev);return true}
 return false;
}
function change(ev,inline=false){
 const q=ev.target,d=cfg();
 if(q.dataset.docPptTemplate!==undefined){d.pptTemplate=q.value==='navy-gold-executive'?'navy-gold-executive':'standard';d.slide=0;save();if(!inline)render();return true}
 if(q.dataset.docTemplate!==undefined){d.template=q.value==='classic'?'classic':'activity';save();if(!inline)render();return true}
 if(q.dataset.docTte!==undefined){tteState(d)[q.dataset.docTte]=q.value;d.tteOpen=true;save();if(!inline)render();return true}
 if(q.hasAttribute('data-doc-tte-enabled')){d.sign=q.checked;d.tteOpen=true;save();if(!inline)render();return true}
 if(q.dataset.docSection!==undefined){const k=q.dataset.docSection;d.sections=q.checked?[...new Set([...d.sections,k])]:d.sections.filter(x=>x!==k);d.slide=0;save();if(!inline)render();return true}
 if(q.dataset.docExtra!==undefined){d[q.dataset.docExtra]=q.checked;save();if(!inline)render();return true}
 if(q.dataset.docFormat!==undefined){d.format=q.value;d.slide=0;save();if(!inline)render();return true}
 return false;
}
// Laporan Akhir Proyek: pertahankan iframe HTML asli agar scroll per halaman bekerja.
// installFinalReportPreview();
window.MT_PS_DOC={exportFormalPdf,readLocalProof,fields,sections,slidePages,programDeck,programSlideHtml,paper,builder,exportFile,click,change,documentPreview,programReportModel,tteControls,hydrateProgram,hydratePortfolio,showActualDocumentPreview,versionPanel,nextVersion,registerExport,confirmSigned,uploadProgramAttachment,history,processSigned,openSignedProof,portfolioModel,portSlides,splitPortText,portfolioBuilder,portfolioClick,portfolioChange,portfolioExport,version:'20261109-program-document-builder-v5-native-charter'};
})();