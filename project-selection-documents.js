/* Inline Document Builder & preview; Word/PDF/PPTX native export. */
(function(){
'use strict';
const B=window.MT_PROJECT_SELECTION,I=B?.internals;if(!B||!I)return;
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const X=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const STEPS=[['identity','Identitas'],['case','Business Case'],['benefits','Manfaat'],['stakeholders','Stakeholder'],['risks','Risiko'],['governance','Tata Kelola']];
const year=()=>+S.ui.psSelectedYear||+S.ui.tahun||2026;
const cfg=()=>{S.ui.psBank=S.ui.psBank||{};const b=S.ui.psBank;b.doc=b.doc||{format:'word',sections:STEPS.map(x=>x[0]),cover:true,toc:true,sign:false,annex:true,slide:0};b.doc.sections=b.doc.sections||STEPS.map(x=>x[0]);return b.doc};
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
function versionPanel(kind,id,y){
 const rows=history(kind,id,y).slice().reverse(),ver=nextVersion(kind,id,y);
 return '<details class="psbank-version-panel"><summary>Riwayat Dokumen & Versi <b>Draft v'+ver+'</b></summary>'+
 '<p>Nomor versi baru hanya diterbitkan setelah PDF bertanda tangan elektronik diunggah sebagai bukti dukung. Pengunduhan ulang tidak menaikkan nomor versi.</p>'+
 '<div class="psbank-version-upload"><label>Unggah PDF hasil TTE<input type="file" accept="application/pdf,.pdf" data-doc-signed-file></label>'+
 '<label class="psbank-version-attest"><input type="checkbox" data-doc-signed-attest> Saya menyatakan PDF sudah ditandatangani secara elektronik.</label>'+
 '<button class="btn pri" type="button" data-doc-signed-kind="'+E(kind)+'" data-doc-signed-id="'+E(id)+'" data-doc-signed-year="'+y+'">Simpan Bukti & Tetapkan v'+ver+'</button></div>'+
 '<p class="psbank-version-disclaimer">Prototype: berkas bukti disimpan di browser/perangkat ini; metadata versinya tercatat oleh aplikasi. Validasi TTE BSrE dan penyimpanan aman lintas pengguna memerlukan integrasi backend.</p>'+
 '<div class="psbank-version-rows">'+(rows.length?rows.map(x=>'<div><b>v'+x.version+' · '+E(x.status==='signed'?'Bukti TTE diunggah (belum diverifikasi)':'Dokumen digenerasi')+'</b><span>'+E(x.format||'PDF')+' · '+E(x.fileName||'')+' · '+E(x.createdAt?.slice(0,16).replace('T',' ')||'')+'</span>'+(x.status==='signed'?'<button class="btn" type="button" data-doc-proof-open="'+E(x.id)+'" data-doc-proof-name="'+E(x.fileName)+'">↓ Bukti TTE</button>':'')+'</div>').join(''):'<small>Belum ada riwayat unduhan.</small>')+'</div></details>';
}

const join=x=>Array.isArray(x)?x.map(a=>typeof a==='string'?a:(a.t||a.m||a.nama||'')).filter(Boolean).join(' • '):String(x||'');
const charter=(p,y)=>{const arr=(S.charters||[]).filter(c=>c.prog===p.akr&&c.st!=='Arsip');return arr.find(c=>+c.p1<=y&&+c.p2>=y)||arr.find(c=>+c.p1===y)||arr[0]||null};
function fields(p,key,y){
 const c=charter(p,y),empty='Belum diisi';
 if(key==='identity')return [['Nama Program',p.nama],['Kode Program',p.kode||p.akr],['Tahun',y],['Jenis Program',p.jenis],['UIC Utama',p.uic],['UIC Pendukung',p.pend],['Sponsor',p.sponsor],['Tujuan Strategis',p.psObjective||c?.tujuan],['Latar Belakang',p.psBackground||join(c?.lb)],['Outcome',p.psOutcome||join(c?.oc)]];
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
 while(rest.length>190){
  let k=rest.lastIndexOf(' ',190);
  if(k<80)k=190;
  out.push(rest.slice(0,k).trim());rest=rest.slice(k).trimStart();
 }
 out.push(rest);return out;
}
function slidePages(p){
 const out=[];
 sections(p).forEach(section=>{
  const all=section.rows.flatMap(r=>splitSlideValue(r[1]).map((v,i)=>[String(r[0])+(i?' (lanjutan '+(i+1)+')':''),v]));
  for(let j=0;j<all.length;j+=5)out.push({title:section.title+(j?' (lanjutan)':''),key:section.key,rows:all.slice(j,j+5)});
 });
 return out;
}
function paper(p,key,y){
 return '<article class="psbank-paper"><div class="psbank-paper-head"><small>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</small><h3>'+E(title(key))+'</h3><span>'+E(p.nama)+' · '+y+' · '+E(p.kode||p.akr)+'</span></div>'+
 '<div class="psbank-paper-body">'+fields(p,key,y).map(([a,b])=>'<div class="psbank-paper-row"><b>'+E(a)+'</b><p>'+E(b||'Belum diisi').replace(/\n/g,'<span class="psbank-line"></span>')+'</p></div>').join('')+'</div>'+
 '<div class="psbank-paper-foot"><span>Pratinjau dokumen program</span><span>Tahun '+y+'</span></div></article>';
}
function annex(p){const c=charter(p,year());if(!c)return[];return [['Analisis As-is',join(c.asis?.pb)||join(c.lb)],['Analisis To-be',join(c.tobe?.pb)||join(c.tb)],['Perbandingan',join(c.cs)],['Charter Program',c.tujuan],['Kriteria Penyelesaian',join(c.kp)],['Manfaat',join(c.mf)||join(c.oc)],['Linimasa',join(c.rk)||join(c.ms)]]}

/* The same formal report engine as Project Management's Final Report drives
   program DOCX and print previews. A single TTE form is reused in every builder. */
function tteState(d){
 if(!d.tte||typeof d.tte!=='object')d.tte={};
 const defaults={city:'Jakarta',date:new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}),label:'Mengetahui,',title:'',name:'',number:''};
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
 const name=String(p.nama||'Program Transformasi'),code=String(p.kode||p.akr||'—');
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
 return {lang:'id',formal:!!d.toc,header:'Dokumen Perencanaan Program · '+name,
  fileName:'Perencanaan_Program_'+year()+'_'+code.replace(/[^A-Za-z0-9_-]/g,'_')+'_v'+v,
  cover:{kicker:'KEMENTERIAN KEUANGAN REPUBLIK INDONESIA · DRAFT',title:'DOKUMEN PERENCANAAN PROGRAM',
   subject:name+' · Tahun Anggaran '+year()+' · v'+v,
   chips:[code,'Tahun '+year(),p.psStatus==='Ditetapkan'?'Ditetapkan':'Usulan / Draf'],
   scope:parts.map(x=>x.title),meta:[['Kode Program',code],['Tahun Anggaran',String(year())],['Versi','v'+v],
     ['UIC Utama',String(p.uic||'—')],['Status','Draft, menunggu pengesahan'],['Nomor Dokumen',t.number||'Belum ditetapkan']],
   noTte:!d.sign,tte:{name:t.name,title:t.title,label:t.label,date:t.date,city:t.city}},
  blocks};
}

function documentPreview(p){
 const d=cfg(),list=sections(p),version=nextVersion('program',p.id||p.akr,year());
 if(d.format!=='pptx'&&typeof mtRptHtml==='function')return '<iframe class="psbank-program-report-frame" title="Pratinjau dokumen perencanaan program" srcdoc="'+E(mtRptHtml(programReportModel(p)))+'"></iframe>';
 if(d.format==='pptx'){
  const slides=slidePages(p),n=Math.max(0,Math.min(+d.slide||0,slides.length-1)),s=slides[n]||{title:'Pilih substansi dokumen',rows:[]};
  return '<div class="psbank-slidepreview"><div class="psbank-slidetop"><span>KEMENTERIAN KEUANGAN</span><strong>'+E(p.kode||p.akr)+'</strong></div><h3>'+E(s.title)+'</h3><small>'+E(p.nama)+' · '+year()+'</small>'+
  '<div class="psbank-slidebody">'+s.rows.map(r=>'<article><b>'+E(r[0])+'</b><p>'+E(String(r[1]||'Belum diisi'))+'</p></article>').join('')+'</div>'+
  '<div class="psbank-slidefoot"><span>Program Transformasi · '+year()+' · v'+version+'</span><span>Slide '+(n+1)+' / '+(slides.length||1)+'</span></div></div>'+
  '<div class="psbank-slidecontrols"><button class="btn" data-doc-slide="-1" '+(n===0?'disabled':'')+'>‹ Sebelumnya</button><span>'+E(s.title)+'</span><button class="btn" data-doc-slide="1" '+(n>=slides.length-1?'disabled':'')+'>Berikutnya ›</button></div>';
 }
 return '<article class="psbank-docpaper">'+(d.cover?'<header class="psbank-doccover"><small>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</small><h2>DOKUMEN PERENCANAAN PROGRAM</h2><h3>'+E(p.nama)+'</h3><p>'+E(p.kode||p.akr)+' · Tahun '+year()+'</p><span>Rancangan untuk reviu — belum disahkan</span></header>':'')+
 (d.toc?'<section class="psbank-doctoc"><b>DAFTAR ISI</b>'+list.map((x,i)=>'<div>'+(i+1)+'. '+E(x.title)+'</div>').join('')+'</section>':'')+
 list.map((x,i)=>'<section class="psbank-docsection"><h4>'+(i+1)+'. '+E(x.title)+'</h4><table>'+x.rows.map(r=>'<tr><th>'+E(r[0])+'</th><td>'+E(r[1]||'Belum diisi')+'</td></tr>').join('')+'</table></section>').join('')+
 (d.annex&&annex(p).length?'<section class="psbank-docsection"><h4>LAMPIRAN CHARTER</h4><table>'+annex(p).map(r=>'<tr><th>'+E(r[0])+'</th><td>'+E(r[1]||'Belum diisi')+'</td></tr>').join('')+'</table></section>':'')+
 (d.sign?'<section class="psbank-docsignature">Mengetahui / menyetujui<br><br><br>Pejabat Berwenang</section>':'')+
 '<footer class="psbank-docfoot">Versi '+version+' · Pratinjau '+(d.format==='pdf'?'PDF':'Word')+' · '+list.length+' substansi · '+year()+'</footer></article>';
}
function builder(p){
 const d=cfg(),list=STEPS,fmt=d.format||'word',ver=nextVersion('program',p.id||p.akr,year());
 return '<div class="psbank-docbuilder"><div class="psbank-docsettings"><div class="psbank-docsetting-head"><h3>Dokumen Perencanaan Program · Pratinjau & Ekspor</h3><p>Substansi dokumen dan riwayat pengesahan versi '+ver+'.</p></div>'+
 '<div class="psbank-doccheckhead"><b>Substansi dokumen</b><span>'+d.sections.length+' / '+STEPS.length+' dipilih</span></div>'+
 '<div class="psbank-docchecks">'+list.map((x,i)=>'<label><input type="checkbox" data-doc-section="'+x[0]+'" '+(d.sections.includes(x[0])?'checked':'')+'> '+(i+1)+'. '+E(x[1])+'</label>').join('')+'</div>'+
 '<div class="psbank-docextras"><label><input type="checkbox" data-doc-extra="cover" '+(d.cover?'checked':'')+'> Sampul & identitas</label>'+
 '<label><input type="checkbox" data-doc-extra="toc" '+(d.toc?'checked':'')+'> Daftar isi</label>'+
 '<label><input type="checkbox" data-doc-extra="annex" '+(d.annex?'checked':'')+'> Lampiran charter</label>'+
 '<label><input type="checkbox" data-doc-extra="sign" '+(d.sign?'checked':'')+'> Halaman penandatanganan</label></div>'+
 tteControls(d,'doc')+
 '<div class="psbank-docformat"><strong>Format Ekspor</strong><div class="psbank-formatbuttons" role="group" aria-label="Format Ekspor">'+
 [['pdf','PDF'],['word','DOCX'],['pptx','PPTX']].map(x=>'<button type="button" class="btn '+(fmt===x[0]?'on':'')+'" data-doc-format-btn="'+x[0]+'" aria-pressed="'+(fmt===x[0])+'">'+x[1]+'</button>').join('')+'</div></div>'+
 versionPanel('program',p.id||p.akr,year())+
 '</div><div class="psbank-docpreview"><div class="psbank-docpreview-head"><div><b>Pratinjau '+(fmt==='word'?'Word':fmt==='pdf'?'PDF':'PowerPoint')+'</b><small>'+E(p.nama)+'</small></div><span>v'+ver+' · '+d.sections.length+' substansi</span></div>'+
 '<div class="psbank-docscroll">'+documentPreview(p)+'</div></div></div>';
}
const basename=p=>('Perencanaan_Program_'+year()+'_'+String(p.kode||p.akr||'program')).replace(/[^a-zA-Z0-9_-]/g,'_');
async function load(src,check){
 if(check())return;
 if(typeof chLib==='function'){await chLib(src,check);return}
 await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Gagal memuat pustaka ekspor.'));document.head.appendChild(s)});
}
const para=(text,bold=false)=>'<w:p><w:pPr><w:spacing w:after="110"/></w:pPr><w:r><w:rPr>'+(bold?'<w:b/>':'')+'<w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="'+(bold?25:20)+'"/></w:rPr><w:t xml:space="preserve">'+X(text)+'</w:t></w:r></w:p>';
function table(rows){return '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="DDE7F0"/><w:bottom w:val="single" w:sz="4" w:color="DDE7F0"/><w:insideH w:val="single" w:sz="4" w:color="E0E7F1"/></w:tblBorders></w:tblPr>'+rows.map(r=>'<w:tr>'+r.map((v,i)=>'<w:tc><w:tcPr><w:tcW w:w="'+(i===0?'2700':'6100')+'" w:type="dxa"/>'+(i===0?'<w:shd w:fill="EFF4FA"/>':'')+'</w:tcPr><w:p><w:r><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="19"/></w:rPr><w:t xml:space="preserve">'+X(v||'Belum diisi')+'</w:t></w:r></w:p></w:tc>').join('')+'</w:tr>').join('')+'</w:tbl>';}
async function exportFile(p){
 if(!p||!cfg().sections.length){toast('Pilih minimal satu substansi.');return}
 const d=cfg(),list=sections(p),version=nextVersion('program',p.id||p.akr,year()),file=basename(p)+'_v'+version;
 try{
  if(d.format==='word'){
   await load('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!window.JSZip);
   if(typeof mtRptDocx==='function'&&typeof mtRptDownloadBlob==='function'){
    const blob=await mtRptDocx(programReportModel(p));mtRptDownloadBlob(blob,file+'.docx');
   }else{
   const zip=new window.JSZip();let body='';
   if(d.cover)body+=para('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',true)+para('DOKUMEN PERENCANAAN PROGRAM',true)+para(p.nama,true)+para((p.kode||p.akr)+' • Tahun '+year());
   body+=para('Versi '+version+' — Rancangan untuk reviu. Belum ditandatangani secara elektronik.');
   if(d.toc)body+=para('DAFTAR ISI',true)+list.map((x,i)=>para((i+1)+'. '+x.title)).join('');
   list.forEach((x,i)=>{body+=para((i+1)+'. '+x.title,true)+table(x.rows)});
   if(d.annex&&annex(p).length)body+=para('LAMPIRAN CHARTER',true)+table(annex(p));
   if(d.sign)body+=para('Mengetahui / menyetujui',true)+para('Pejabat Berwenang');
   const xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr></w:body></w:document>';
   zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
   zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
   zip.file('word/document.xml',xml);
   const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=file+'.docx';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
   }
  }else if(d.format==='pdf'){
   await load('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',()=>!!window.jspdf?.jsPDF);
   const pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4'});let y=23;
   const text=(v,bold=false)=>{
    pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(bold?12:10);
    const lines=pdf.splitTextToSize(String(v||'Belum diisi'),170);
    if(y+lines.length*5>280){pdf.addPage();y=20}
    pdf.text(lines,20,y);y+=lines.length*5+2;
   };
   if(d.cover){pdf.setFillColor(11,36,71);pdf.rect(0,0,210,50,'F');pdf.setTextColor(255,255,255);pdf.setFontSize(14);pdf.text('DOKUMEN PERENCANAAN PROGRAM',20,24);pdf.setFontSize(10);pdf.text(p.nama.slice(0,85),20,35);pdf.setTextColor(18,43,80);y=62}
   text('KEMENTERIAN KEUANGAN · '+year()+' · Versi '+version,true);text('Draf untuk reviu, bukan dokumen keputusan.');
   if(d.toc){text('DAFTAR ISI',true);list.forEach((r,i)=>text((i+1)+'. '+r.title))}
   list.forEach((r,i)=>{text((i+1)+'. '+r.title.toUpperCase(),true);r.rows.forEach(a=>{text(a[0],true);text(a[1])});y+=3});
   if(d.annex&&annex(p).length){text('LAMPIRAN CHARTER',true);annex(p).forEach(a=>{text(a[0],true);text(a[1])})}
   if(d.sign){text('Mengetahui / menyetujui',true);y+=18;text('Pejabat Berwenang')}
   pdf.save(file+'.pdf');
  }else{
   await load('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js',()=>!!window.PptxGenJS);
   const ppt=new window.PptxGenJS();ppt.layout='LAYOUT_WIDE';ppt.author='PMO Kementerian Keuangan';
   const cover=ppt.addSlide();cover.background={color:'0B2447'};
   cover.addText('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',{x:.6,y:.6,w:12,h:.4,fontFace:'Aptos',fontSize:15,color:'FDB913',bold:true});
   cover.addText('DOKUMEN PERENCANAAN PROGRAM',{x:.6,y:2,w:12,h:.75,fontFace:'Aptos',fontSize:26,color:'FFFFFF',bold:true});
   cover.addText(p.nama,{x:.6,y:3,w:12,h:.85,fontFace:'Aptos',fontSize:20,color:'FFFFFF'});
   cover.addText('Tahun '+year()+'  ·  '+(p.kode||p.akr)+' · Versi '+version,{x:.6,y:5.9,w:11,h:.3,fontFace:'Aptos',fontSize:13,color:'FDB913'});
   const pptSlides=slidePages(p);
   pptSlides.forEach((r,i)=>{
    const s=ppt.addSlide();s.background={color:'FFFFFF'};
    s.addShape(ppt.ShapeType.rect,{x:0,y:0,w:13.33,h:.14,line:{color:'FDB913'},fill:{color:'FDB913'}});
    s.addText(r.title,{x:.55,y:.35,w:12,h:.5,fontFace:'Aptos',fontSize:23,bold:true,color:'0B2447'});
    s.addText(p.nama+' · '+year()+' · Versi '+version,{x:.55,y:.95,w:12,h:.3,fontFace:'Aptos',fontSize:10,color:'627892'});
    const rows=r.rows,h=5.4/Math.max(1,rows.length);
    rows.forEach((a,j)=>{
     const yy=1.38+j*h;s.addShape(ppt.ShapeType.rect,{x:.55,y:yy,w:12.2,h:h-.06,line:{color:'DCE6F0'},fill:{color:j%2?'FFFFFF':'F2F6FB'}});
     s.addText(String(a[0]),{x:.75,y:yy+.08,w:3,h:h-.15,fontFace:'Aptos',fontSize:11,bold:true,color:'183C65',margin:0,valign:'mid'});
     s.addText(String(a[1]||'Belum diisi'),{x:3.95,y:yy+.08,w:8.45,h:h-.15,fontFace:'Aptos',fontSize:Math.max(9,12-rows.length/4),color:'30445C',margin:0,valign:'mid'});
    });
    s.addText((i+1)+' / '+pptSlides.length,{x:11.8,y:7.1,w:.85,h:.2,fontFace:'Aptos',fontSize:9,color:'627892'});
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
 const d=S.ui.psBank[key]||(S.ui.psBank[key]={format:'word',selected:[],sections:(mode?PROJECT_SECTIONS:STEPS).map(x=>x[0]),toc:true,slide:0,initialized:false});
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
  rows:data.length?data.map((o,i)=>[String(i+1),o.p.kode||o.p.akr,o.p.nama,o.p.uic||'—',o.p.psStatus||'Draft']):[['—','—','Belum ada program dipilih','—','—']]});
 data.forEach((o,i)=>{
  h1((mode?'Usulan Proyek ':'Program ')+String(i+1).padStart(2,'0')+' — '+o.p.nama);
  B.push({t:'kv',rows:[[mode?'Kode Usulan':'Kode Program',o.p.kode||o.p.akr],['UIC Utama',o.p.uic||'—'],['Jenis',o.p.jenis||'Berkelanjutan'],['Tahun',String(year())],['Status',o.p.psStatus||'Draft'],['Jumlah Proyek',String((o.p.psProjects||[]).length)],['Asal Program',o.p.psOriginProgram||(o.p.psCarry?.sourceYear?'Carry-over '+o.p.psCarry.sourceYear:'Program baru')]]});
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
 return {lang:'id',formal:true,fileName:(mode?'Dokumen_Usulan_Proyek_':'Dokumen_Portofolio_Transformasi_')+year()+'_v'+version,
  header:(mode?'Dokumen Usulan Proyek · ':'Dokumen Portofolio Program Transformasi · ')+year(),
  cover:{kicker:'KEMENTERIAN KEUANGAN REPUBLIK INDONESIA · DRAFT',title:mode?'DOKUMEN USULAN PROYEK':'DOKUMEN PORTOFOLIO PROGRAM TRANSFORMASI',subject:'Tahun Anggaran '+year()+' · Versi '+version,
   chips:['Tahun '+year(),data.length+(mode?' usulan proyek':' program'),'Draft — belum disahkan'],scope:d.sections.map(x=>docSections().find(z=>z[0]===x)?.[1]||x),
   meta:[['Tahun Anggaran',String(year())],['Versi','v'+version],[mode?'Jumlah Usulan Proyek':'Jumlah Program',String(data.length)],['Status','Draft'],['Sumber','Modul Transformasi Kementerian Keuangan'],['Nomor Dokumen',signer.number||'Belum ditetapkan']],noTte:!d.sign,tte:{name:signer.name,title:signer.title,label:signer.label,city:signer.city,date:signer.date}},blocks:B};
}
function splitPortText(text,limit=176){
 const value=String(text||'Belum diisi').trim().replace(/\s+/g,' '),words=value.split(' '),out=[];let line='';
 words.forEach(word=>{
  if(word.length>limit){if(line){out.push(line);line=''}for(let i=0;i<word.length;i+=limit)out.push(word.slice(i,i+limit));return}
  if((line+' '+word).trim().length>limit){if(line)out.push(line);line=word}
  else line=(line+' '+word).trim();
 });
 if(line)out.push(line);return out.length?out:['Belum diisi'];
}
function portSlides(){
 const data=portData(),mode=projectMode(),slides=[{kind:'cover',title:mode?'DOKUMEN USULAN PROYEK':'PORTOFOLIO PROGRAM TRANSFORMASI',programs:data.map(x=>x.p)}];
 for(let o=0;o<Math.max(1,data.length);o+=12)slides.push({kind:'overview',title:(mode?'Ikhtisar Usulan Proyek':'Peta Portofolio Transformasi')+(o?' (lanjutan)':''),programs:data.slice(o,o+12).map(x=>x.p),programOffset:o});
 data.forEach((o,i)=>{
  slides.push({kind:'divider',program:o.p,programIndex:i+1,totalPrograms:data.length});
  o.blocks.forEach(block=>{
   const cards=[];
   (block.rows.length?block.rows:[['Substansi','Belum diisi']]).forEach(row=>{
    const parts=splitPortText(row[1]);parts.forEach((part,j)=>cards.push([String(row[0])+(j?' · lanjutan '+(j+1):''),part]));
   });
   for(let j=0;j<cards.length;j+=4)slides.push({kind:'section',program:o.p,programIndex:i+1,title:block.title+(j?' (lanjutan)':''),rows:cards.slice(j,j+4)});
  });
 });
 return slides;
}
function portfolioPreview(){
 const d=portCfg(),data=portData(),mode=projectMode(),v=nextVersion(docKind(),docId(),year());
 if(d.format==='pptx'){
  const deck=portSlides(),i=Math.max(0,Math.min(+d.slide||0,Math.max(0,deck.length-1))),x=deck[i]||{},fmt=E;
  let body='';
  if(x.kind==='cover')body='<div class="psbank-port-slide-cover"><small>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</small><div class="port-gold-rule"></div><h2>PORTOFOLIO<br>PROGRAM TRANSFORMASI</h2><p>Tahun '+year()+' · Versi '+v+'</p><strong>'+data.length+' PROGRAM TERPILIH</strong></div>';
  else if(x.kind==='overview')body='<div class="psbank-port-slide-overview"><small>RINGKASAN EKSEKUTIF · '+year()+'</small><h2>'+fmt(x.title)+'</h2><div class="port-preview-metrics"><span><b>'+data.length+'</b> '+(mode?'Usulan Proyek':'Program')+'</span><span><b>'+data.reduce((n,o)=>n+(o.p.psProjects||[]).length,0)+'</b> Usulan Proyek</span></div><div class="port-preview-list">'+(x.programs||[]).map((p,j)=>'<p><b>'+String((x.programOffset||0)+j+1).padStart(2,'0')+'</b> '+fmt(p.nama)+' <small>'+fmt(p.kode||p.akr)+'</small></p>').join('')+'</div></div>';
  else if(x.kind==='divider')body='<div class="psbank-port-slide-cover"><small>PROGRAM '+String(x.programIndex).padStart(2,'0')+' / '+x.totalPrograms+'</small><div class="port-gold-rule"></div><h2>'+fmt(x.program?.nama||'')+'</h2><p>'+fmt(x.program?.kode||x.program?.akr)+' · '+year()+'</p><strong>SUBSTANSI PROGRAM</strong></div>';
  else body='<div class="psbank-port-slide-section"><small>PROGRAM '+String(x.programIndex).padStart(2,'0')+' · '+fmt(x.program?.kode||x.program?.akr)+'</small><h2>'+fmt(x.title)+'</h2><p>'+fmt(x.program?.nama)+'</p><div class="port-card-grid count-'+x.rows.length+'">'+x.rows.map(row=>'<article><b>'+fmt(row[0])+'</b><p>'+fmt(row[1])+'</p></article>').join('')+'</div></div>';
  return '<div class="psbank-port-slide">'+body+'<footer>MODUL TRANSFORMASI KEMENTERIAN KEUANGAN <span>v'+v+' · '+(i+1)+' / '+deck.length+'</span></footer></div>'+
   '<div class="psbank-slidecontrols"><button class="btn" data-port-slide="-1" '+(!i?'disabled':'')+'>‹ Sebelumnya</button><span>Slide '+(i+1)+' / '+deck.length+'</span><button class="btn" data-port-slide="1" '+(i>=deck.length-1?'disabled':'')+'>Berikutnya ›</button></div>';
 }
 const model=portfolioModel();
 if(typeof mtRptHtml==='function'){
  const html=mtRptHtml(model);
  return '<iframe class="psbank-port-report-frame" title="Pratinjau dokumen portofolio '+(d.format==='pdf'?'PDF':'Word')+'" srcdoc="'+E(html)+'"></iframe>';
 }
 return '<article class="psbank-docpaper"><header class="psbank-doccover"><small>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</small><h2>'+E(model.cover.title)+'</h2><h3>'+year()+' · Versi '+v+'</h3></header>'+
  model.blocks.map(b=>b.t==='h1'?'<section class="psbank-docsection"><h3>'+E(b.text)+'</h3></section>':b.t==='h2'?'<h4>'+E(b.text)+'</h4>':b.t==='p'?'<p>'+E(b.text)+'</p>':b.t==='table'?'<section class="psbank-docsection"><table><thead><tr>'+b.head.map(x=>'<th>'+E(x)+'</th>').join('')+'</tr></thead><tbody>'+b.rows.map(row=>'<tr>'+row.map(v=>'<td>'+E(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></section>':'').join('')+'</article>';
}
function portfolioBuilder(){
 const d=portCfg(),all=portPrograms(),chosen=portSelected(),mode=projectMode(),steps=docSections(),ver=nextVersion(docKind(),docId(),year());
 return '<div class="psbank-card psbank-portfolio-doc"><div class="psbank-sectionhead"><div><h3>Buat Dokumen Portofolio · '+year()+'</h3><p>Kompilasi substansi beberapa program, dikelompokkan menurut program sumbernya.</p></div><span class="psbank-count">'+chosen.length+' dari '+all.length+(mode?' usulan proyek':' program')+'</span></div>'+
 '<div class="psbank-docbuilder"><div class="psbank-docsettings"><div class="psbank-doccheckhead"><b>Pilih Program</b><button class="btn" type="button" data-port-all>'+(chosen.length===all.length?'Kosongkan':'Pilih Semua')+'</button></div>'+
 '<div class="psbank-portfolio-checks">'+(all.length?all.map(p=>'<label><input type="checkbox" data-port-program="'+E(p.id)+'" '+(d.selected.includes(String(p.id))?'checked':'')+'><span><b>'+E(p.nama)+'</b><small>'+E(p.kode||p.akr)+'</small></span></label>').join('') :'<p>Belum ada '+(mode?'usulan proyek':'program')+' pada tahun ini.</p>')+'</div>'+
 '<div class="psbank-doccheckhead"><b>Substansi</b><span>'+d.sections.length+'/'+steps.length+' dipilih</span></div><div class="psbank-docchecks">'+steps.map((x,i)=>'<label><input type="checkbox" data-port-section="'+x[0]+'" '+(d.sections.includes(x[0])?'checked':'')+'>'+(i+1)+'. '+x[1]+'</label>').join('')+'</div>'+
 tteControls(d,'port')+
 '<div class="psbank-docformat"><strong>Format Ekspor</strong><div class="psbank-formatbuttons">'+[['pdf','PDF'],['word','DOCX'],['pptx','PPTX']].map(x=>'<button type="button" class="btn '+(d.format===x[0]?'on':'')+'" data-port-format="'+x[0]+'" aria-pressed="'+(d.format===x[0])+'">'+x[1]+'</button>').join('')+'</div></div>'+
 versionPanel(docKind(),docId(),year())+'</div>'+
 '<div class="psbank-docpreview"><div class="psbank-docpreview-head"><div><b>Pratinjau '+(d.format==='pptx'?'PowerPoint':d.format==='pdf'?'PDF':'Word')+'</b><small>Portofolio Transformasi '+year()+'</small></div><span>v'+ver+' · '+chosen.length+(mode?' proyek':' program')+'</span></div>'+
 '<div class="psbank-docscroll">'+portfolioPreview()+'</div><div class="psbank-portfolio-download"><button type="button" class="btn pri" data-port-export '+(!chosen.length||!d.sections.length?'disabled':'')+'>↓ Unduh</button></div></div></div></div>';
}
async function portfolioExport(){
 const d=portCfg(),data=portData();
 if(!data.length||!d.sections.length){toast('Pilih program dan substansi terlebih dahulu.');return}
 const model=portfolioModel(),version=nextVersion(docKind(),docId(),year()),file=model.fileName;
 try{
  if(d.format==='word'){
   if(typeof mtRptDocx!=='function'||typeof mtRptDownloadBlob!=='function')throw new Error('Mesin laporan Word Project Management belum tersedia.');
   if(typeof window.JSZip==='undefined')await load('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!window.JSZip);
   const blob=await mtRptDocx(model);
   mtRptDownloadBlob(blob,file+'.docx');
  }else if(d.format==='pdf'){
   await load('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',()=>!!window.jspdf?.jsPDF);
   const pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4'}),blue=[15,48,89],ink=[27,50,81],gold=[245,177,25],pale=[239,245,251];
   const W=210,left=18,right=192,bodyW=174;let y=24;
   const setColor=(color)=>pdf.setTextColor(...color);
   const ensure=h=>{if(y+h>274){pdf.addPage();y=27}};
   const line=(text,sz=10,bold=false,space=4)=>{
    pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(sz);setColor(ink);
    const lines=pdf.splitTextToSize(String(text||'—'),bodyW);
    lines.forEach(t=>{ensure(sz*.49+2);pdf.text(t,left,y);y+=sz*.49+1});y+=space;
   };
   pdf.setFillColor(...blue);pdf.rect(0,0,W,112,'F');
   pdf.setFillColor(...gold);pdf.rect(18,38,22,2.2,'F');
   pdf.setFont('helvetica','bold');pdf.setFontSize(12);pdf.setTextColor(255,198,60);pdf.text('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',18,27);
   pdf.setTextColor(255,255,255);pdf.setFontSize(27);pdf.text(mode?'DOKUMEN USULAN':'PORTOFOLIO PROGRAM',18,57);pdf.text(mode?'PROYEK':'TRANSFORMASI',18,73);
   pdf.setFontSize(14);pdf.text('Tahun Anggaran '+year()+'  |  Versi '+version,18,90);
   y=133;line(data.length+' PROGRAM TERPILIH  |  '+data.reduce((n,o)=>n+(o.p.psProjects||[]).length,0)+' USULAN PROYEK',14,true,8);
   line('DOKUMEN PERENCANAAN · DRAFT — BELUM DISAHKAN',10,false,6);
   pdf.setDrawColor(218,226,238);pdf.line(18,165,192,165);
   y=182;line('Dokumen ini disusun otomatis berdasarkan informasi yang dipilih dari Modul Transformasi Kementerian Keuangan.',11,false,7);
   const tableBlock=b=>{
    const values=b.rows||[],head=b.head||[],n=Math.max(head.length,...values.map(row=>row.length)),weights=(b.widths&&b.widths.length===n?b.widths:Array(n).fill(100/n)),den=weights.reduce((a,v)=>a+v,0),widths=weights.map(x=>bodyW*x/den);
    const draw=(cells,header=false)=>{
     const sizes=cells.map((v,i)=>{pdf.setFont('helvetica',header?'bold':'normal');pdf.setFontSize(header?9.3:9);
      return pdf.splitTextToSize(String(v||'—'),Math.max(10,widths[i]-4.6))});
     const maxLines=Math.max(1,...sizes.map(x=>x.length));
     for(let part=0;part<maxLines;part+=28){
      const slices=sizes.map(lines=>lines.slice(part,part+28)),height=Math.max(11,...slices.map(lines=>lines.length*4.4+5.5));
      ensure(height+2);let x=left;
      cells.forEach((v,i)=>{
       pdf.setFillColor(...(header?blue:(part===0&&i===0?pale:[255,255,255])));pdf.rect(x,y,widths[i],height,'F');
       pdf.setDrawColor(219,227,237);pdf.rect(x,y,widths[i],height);
       pdf.setFont('helvetica',header?'bold':'normal');pdf.setFontSize(header?9.3:9);
       setColor(header?[255,255,255]:ink);pdf.text(slices[i]||[],x+2.4,y+4.6);
       x+=widths[i];
      });y+=height;
     }
    };
    if(head.length)draw(head,true);
    values.forEach(row=>draw(row));
    y+=6;
   };
   model.blocks.forEach(b=>{
    if(b.t==='h1'){pdf.addPage();y=28;pdf.setFillColor(...gold);pdf.rect(left,y-6,17,2,'F');line(b.text,17,true,7)}
    else if(b.t==='h2'){ensure(16);pdf.setFillColor(...gold);pdf.rect(left,y-5,3,8,'F');pdf.setFont('helvetica','bold');pdf.setFontSize(12);setColor(blue);pdf.text(b.text,left+7,y+1);y+=13}
    else if(b.t==='p')line(b.text,10,false,7);
    else if(b.t==='kv'){const rows=b.rows||[];tableBlock({head:['Keterangan','Informasi'],rows,widths:[32,68]})}
    else if(b.t==='table')tableBlock(b);
    else if(b.t==='bullets')(b.items||[]).forEach(t=>line('• '+t,9.7,false,4));
   });
   const pages=pdf.internal.getNumberOfPages();
   for(let i=1;i<=pages;i++){pdf.setPage(i);pdf.setFillColor(...blue);pdf.rect(0,285,210,12,'F');pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.setTextColor(255,255,255);pdf.text('PORTOFOLIO TRANSFORMASI · '+year()+' · v'+version,18,292);pdf.text(i+' / '+pages,192,292,{align:'right'})}
   pdf.save(file+'.pdf');
  }else{
   await load('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js',()=>!!window.PptxGenJS);
   const ppt=new window.PptxGenJS();ppt.layout='LAYOUT_WIDE';ppt.author='PMO Kementerian Keuangan';
   ppt.subject='Dokumen Portofolio Program Transformasi '+year();ppt.title=(mode?'Dokumen Usulan Proyek ':'Portofolio Transformasi ')+year();
   const N='102F56',MID='1F4F81',G='F9B919',W='FFFFFF',PALE='F0F5FA',TEXT='254568',MUTED='657E98',Shape=ppt.ShapeType;
   const slides=portSlides(),count=slides.length;
   const tx=(sl,t,x,y,w,h,size=14,color=TEXT,bold=false,other={})=>sl.addText(String(t||'—'),{x,y,w,h,fontFace:'Aptos',fontSize:size,bold,color,margin:0,breakLine:false,fit:'shrink',valign:'mid',...other});
   const rect=(sl,x,y,w,h,fill,line=fill,radius=0)=>sl.addShape(radius?Shape.roundRect:Shape.rect,{x,y,w,h,rectRadius:radius,rect:{radius},line:{color:line,transparency:line===fill?100:0},fill:{color:fill},radius});
   const footer=(sl,i,dark=false)=>{
    rect(sl,0,7.22,13.333,.28,dark?N:'E9F0F7');
    tx(sl,'KEMENTERIAN KEUANGAN · PORTOFOLIO TRANSFORMASI '+year(),.5,7.25,10,.16,8.5,dark?'C2D3E8':MUTED);
    tx(sl,'v'+version+'   '+i+' / '+count,11.5,7.25,1.35,.16,8.5,dark?'FCD67A':MID,false,{align:'right'});
   };
   slides.forEach((page,i)=>{
    const sl=ppt.addSlide(),num=i+1;sl.background={color:page.kind==='cover'||page.kind==='divider'?N:W};
    if(page.kind==='cover'){
     rect(sl,.65,1.0,.13,4.9,G);
     tx(sl,'KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',1.04,.74,11,.35,15,G,true);
     tx(sl,mode?'DOKUMEN USULAN':'PORTOFOLIO',1.03,2.05,11,.82,44,W,true);
     tx(sl,mode?'PROYEK':'PROGRAM TRANSFORMASI',1.03,2.96,11,.75,36,W,true);
     tx(sl,'Tahun Anggaran '+year()+' · Versi '+version,1.05,4.35,10,.4,18,'CBDCF0');
     rect(sl,1.03,5.35,4.8,.52,MID);tx(sl,data.length+(mode?' USULAN PROYEK':' PROGRAM TERPILIH'),1.25,5.43,4.3,.35,16,W,true);
     footer(sl,num,true);return;
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
     tx(sl,'Peta Portofolio Program',.57,.92,11.8,.65,27,N,true);
     const totalProjects=data.reduce((n,o)=>n+(o.p.psProjects||[]).length,0);
     rect(sl,.6,1.86,5.86,1.06,PALE);rect(sl,6.85,1.86,5.87,1.06,PALE);
     tx(sl,String(data.length),.88,2.02,.85,.62,29,N,true);
     tx(sl,'PROGRAM TERPILIH',1.88,2.1,4,.37,12,MID,true);
     tx(sl,String(totalProjects),7.14,2.02,1.1,.62,29,N,true);
     tx(sl,'USULAN PROYEK',8.46,2.1,3.7,.37,12,MID,true);
     (page.programs||[]).forEach((program,j)=>{
      const col=j%2,row=Math.floor(j/2),xx=.6+col*6.25,yy=3.23+row*.55;
      rect(sl,xx,yy,5.85,.48,row%2?'F6F9FD':PALE);
      tx(sl,String((page.programOffset||0)+j+1).padStart(2,'0'),xx+.12,yy+.09,.36,.24,10,MID,true);
      tx(sl,program.nama,xx+.6,yy+.05,4.5,.37,11.5,N,true);
      tx(sl,program.kode||program.akr,xx+5.05,yy+.13,.66,.23,8.5,MUTED,false,{align:'right'});
     });
     footer(sl,num);return;
    }
    tx(sl,(mode?'USULAN PROYEK ':'PROGRAM ')+String(page.programIndex).padStart(2,'0')+'  ·  '+(page.program?.kode||page.program?.akr),.59,.80,11,.32,11,MID,true);
    tx(sl,page.title,.59,1.2,11.9,.55,26,N,true);
    tx(sl,page.program?.nama,.6,1.78,11.6,.38,12,MUTED);
    const cards=page.rows||[],n=cards.length,oneCol=n===1,cols=oneCol?1:2,rows=Math.ceil(n/cols);
    const gapX=.22,gapY=.17,w=oneCol?12.12:5.95,h=Math.min(4.35,(4.4-(rows-1)*gapY)/rows);
    cards.forEach((card,j)=>{
     const col=j%cols,row=Math.floor(j/cols),xx=.6+col*(w+gapX),yy=2.45+row*(h+gapY);
     rect(sl,xx,yy,w,h,'F2F6FB');rect(sl,xx,yy,.07,h,G);
     tx(sl,card[0],xx+.2,yy+.19,w-.46,.34,12,MID,true,{valign:'mid'});
     tx(sl,card[1],xx+.2,yy+.65,w-.42,h-.81,n===1?17:12.5,TEXT,false,{valign:'top'});
    });
    footer(sl,num);
   });
   await ppt.writeFile({fileName:file+'.pptx'});
  }
  registerExport(docKind(),docId(),year(),d.format,file+'.'+(d.format==='word'?'docx':d.format),{sections:d.sections.slice(),projects:data.map(o=>o.p.id)});
  toast('Dokumen Portofolio v'+version+' berhasil diunduh. Versi bertambah setelah unggah bukti TTE.');
 }catch(e){toast('Ekspor portofolio gagal: '+(e.message||e))}
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
 if(slide){const d=cfg();d.slide=Math.max(0,Math.min(slidePages(p).length-1,(+d.slide||0)+ +slide.dataset.docSlide));save();if(!inline)render();return true}
 if(ev.target.closest('[data-doc-export]')){exportFile(p);return true}
 if(ev.target.closest('[data-doc-signed-kind]')){processSigned(ev);return true}
 if(ev.target.closest('[data-doc-proof-open]')){openSignedProof(ev);return true}
 return false;
}
function change(ev,inline=false){
 const q=ev.target,d=cfg();
 if(q.dataset.docTte!==undefined){tteState(d)[q.dataset.docTte]=q.value;d.tteOpen=true;save();if(!inline)render();return true}
 if(q.hasAttribute('data-doc-tte-enabled')){d.sign=q.checked;d.tteOpen=true;save();if(!inline)render();return true}
 if(q.dataset.docSection!==undefined){const k=q.dataset.docSection;d.sections=q.checked?[...new Set([...d.sections,k])]:d.sections.filter(x=>x!==k);d.slide=0;save();if(!inline)render();return true}
 if(q.dataset.docExtra!==undefined){d[q.dataset.docExtra]=q.checked;save();if(!inline)render();return true}
 if(q.dataset.docFormat!==undefined){d.format=q.value;d.slide=0;save();if(!inline)render();return true}
 return false;
}
window.MT_PS_DOC={fields,sections,slidePages,paper,builder,exportFile,click,change,documentPreview,programReportModel,tteControls,versionPanel,nextVersion,registerExport,confirmSigned,history,processSigned,openSignedProof,portfolioModel,portSlides,splitPortText,portfolioBuilder,portfolioClick,portfolioChange,portfolioExport,version:'20261108-program-document-builder-v3'};
})();