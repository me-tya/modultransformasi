/* Inline Document Builder & preview; Word/PDF/PPTX native export. */
(function(){
'use strict';
const B=window.MT_PROJECT_SELECTION,I=B?.internals;if(!B||!I)return;
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const X=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const STEPS=[['identity','Identitas'],['case','Business Case'],['benefits','Manfaat'],['stakeholders','Stakeholder'],['risks','Risiko'],['governance','Tata Kelola']];
const year=()=>+S.ui.tahun||2026;
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
 '<div class="psbank-version-rows">'+(rows.length?rows.map(x=>'<div><b>v'+x.version+' · '+E(x.status==='signed'?'Bukti TTE diunggah (belum diverifikasi)':'Dokumen digenerasi')+'</b><span>'+E(x.format||'PDF')+' · '+E(x.fileName||'')+' · '+E(x.createdAt?.slice(0,16).replace('T',' ')||'')+'</span></div>').join(''):'<small>Belum ada riwayat unduhan.</small>')+'</div></details>';
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
function documentPreview(p){
 const d=cfg(),list=sections(p),version=nextVersion('program',p.id||p.akr,year());
 if(d.format='pptx'){
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
function portCfg(){
 S.ui.psBank=S.ui.psBank||{};
 const d=S.ui.psBank.portfolioDoc||(S.ui.psBank.portfolioDoc={format:'word',selected:[],sections:STEPS.map(x=>x[0]),toc:true,slide:0,initialized:false});
 if(!d.initialized){d.selected=portPrograms().map(p=>String(p.id));d.initialized=true}
 return d;
}
function portPrograms(){
 return (S.programs||[]).filter(p=>+p.psYear===year()||(!p.psYear&&+p.mulai<=year()&&+(String(p.periode||'').match(/20\d{2}/g)||[]).slice(-1)[0]>=year()));
}
function portSelected(){const d=portCfg();return portPrograms().filter(p=>d.selected.includes(String(p.id)))}
function portData(){
 const d=portCfg();
 return portSelected().map(p=>({p,blocks:STEPS.filter(x=>d.sections.includes(x[0])).map(x=>({title:x[1],rows:fields(p,x[0],year())}))}));
}
function portSlides(){
 const result=[];
 portData().forEach(o=>o.blocks.forEach(b=>{
  const fields=b.rows.length?b.rows:[['Data','Belum diisi']];
  for(let i=0;i<fields.length;i+=6)result.push({program:o.p,title:b.title+(i?' (lanjutan)':''),rows:fields.slice(i,i+6)});
 }));
 return result;
}
function portfolioPreview(){
 const d=portCfg(),data=portData(),v=nextVersion('portfolio','all',year());
 if(d.format==='pptx'){
  const slides=portSlides(),i=Math.max(0,Math.min(+d.slide||0,Math.max(0,slides.length-1))),x=slides[i];
  return '<div class="psbank-slidepreview"><div class="psbank-slidetop"><span>KEMENTERIAN KEUANGAN · PORTOFOLIO</span><strong>v'+v+'</strong></div>'+
  (x?'<h3>'+E(x.title)+'</h3><small>'+E(x.program.nama)+' · '+year()+'</small><div class="psbank-slidebody">'+x.rows.map(row=>'<article><b>'+E(row[0])+'</b><p>'+E(row[1]||'Belum diisi')+'</p></article>').join('')+'</div>':'<p>Pilih program dan substansi di sebelah kiri.</p>')+
  '</div><div class="psbank-slidecontrols"><button class="btn" data-port-slide="-1" '+(!i?'disabled':'')+'>‹ Sebelumnya</button><span>Slide '+(slides.length?i+1:0)+' / '+slides.length+'</span><button class="btn" data-port-slide="1" '+(i>=slides.length-1?'disabled':'')+'>Berikutnya ›</button></div>';
 }
 return '<div class="psbank-docpaper"><header class="psbank-doccover"><small>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</small><h2>DOKUMEN PORTOFOLIO PROGRAM TRANSFORMASI</h2><h3>Tahun '+year()+' · Versi '+v+'</h3><p>'+data.length+' program terpilih · Rancangan, belum ditandatangani</p></header>'+
 (d.toc?'<section class="psbank-doctoc"><b>DAFTAR PROGRAM</b>'+data.map((o,i)=>'<div>'+(i+1)+'. '+E(o.p.nama)+' ('+E(o.p.kode||o.p.akr)+')</div>').join('')+'</section>':'')+
 data.map((o,i)=>'<section class="psbank-docsection"><h3>'+(i+1)+'. '+E(o.p.nama)+'</h3><p>Kode: '+E(o.p.kode||o.p.akr)+' · UIC: '+E(o.p.uic||'—')+'</p>'+o.blocks.map((b,j)=>'<h4>'+(i+1)+'.'+(j+1)+' '+E(b.title)+'</h4><table>'+b.rows.map(row=>'<tr><th>'+E(row[0])+'</th><td>'+E(row[1]||'Belum diisi')+'</td></tr>').join('')+'</table>').join('')+'</section>').join('')+'</div>';
}
function portfolioBuilder(){
 const d=portCfg(),all=portPrograms(),chosen=portSelected(),ver=nextVersion('portfolio','all',year());
 return '<div class="psbank-card psbank-portfolio-doc"><div class="psbank-sectionhead"><div><h3>Buat Dokumen Portofolio · '+year()+'</h3><p>Kompilasi substansi beberapa program, dikelompokkan menurut program sumbernya.</p></div><span class="psbank-count">'+chosen.length+' dari '+all.length+' program</span></div>'+
 '<div class="psbank-docbuilder"><div class="psbank-docsettings"><div class="psbank-doccheckhead"><b>Pilih Program</b><button class="btn" type="button" data-port-all>'+(chosen.length===all.length?'Kosongkan':'Pilih Semua')+'</button></div>'+
 '<div class="psbank-portfolio-checks">'+(all.length?all.map(p=>'<label><input type="checkbox" data-port-program="'+E(p.id)+'" '+(d.selected.includes(String(p.id))?'checked':'')+'><span><b>'+E(p.nama)+'</b><small>'+E(p.kode||p.akr)+'</small></span></label>').join(''):'<p>Belum ada program pada tahun ini.</p>')+'</div>'+
 '<div class="psbank-doccheckhead"><b>Substansi</b><span>'+d.sections.length+'/'+STEPS.length+' dipilih</span></div><div class="psbank-docchecks">'+STEPS.map((x,i)=>'<label><input type="checkbox" data-port-section="'+x[0]+'" '+(d.sections.includes(x[0])?'checked':'')+'>'+(i+1)+'. '+x[1]+'</label>').join('')+'</div>'+
 '<div class="psbank-docformat"><strong>Format Ekspor</strong><div class="psbank-formatbuttons">'+[['pdf','PDF'],['word','DOCX'],['pptx','PPTX']].map(x=>'<button type="button" class="btn '+(d.format===x[0]?'on':'')+'" data-port-format="'+x[0]+'" aria-pressed="'+(d.format===x[0])+'">'+x[1]+'</button>').join('')+'</div></div>'+
 versionPanel('portfolio','all',year())+'</div>'+
 '<div class="psbank-docpreview"><div class="psbank-docpreview-head"><div><b>Pratinjau '+(d.format==='pptx'?'PowerPoint':d.format==='pdf'?'PDF':'Word')+'</b><small>Portofolio Transformasi '+year()+'</small></div><span>v'+ver+' · '+chosen.length+' program</span></div>'+
 '<div class="psbank-docscroll">'+portfolioPreview()+'</div><div class="psbank-portfolio-download"><button type="button" class="btn pri" data-port-export '+(!chosen.length||!d.sections.length?'disabled':'')+'>↓ Unduh</button></div></div></div></div>';
}
async function portfolioExport(){
 const d=portCfg(),data=portData();
 if(!data.length||!d.sections.length){toast('Pilih program dan substansi dahulu.');return}
 const version=nextVersion('portfolio','all',year()),file='Dokumen_Portofolio_Transformasi_'+year()+'_v'+version;
 try{
  if(d.format==='word'){
   await load('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!window.JSZip);
   const zip=new window.JSZip();let body=para('DOKUMEN PORTOFOLIO PROGRAM TRANSFORMASI',true)+para('Tahun '+year()+' · Versi '+version+' · Draft belum ditandatangani');
   if(d.toc)body+=para('DAFTAR PROGRAM',true)+data.map((o,i)=>para((i+1)+'. '+o.p.nama+' · '+(o.p.kode||o.p.akr))).join('');
   data.forEach((o,i)=>{body+=para((i+1)+'. '+o.p.nama+' ('+(o.p.kode||o.p.akr)+')',true);o.blocks.forEach(b=>{body+=para(b.title,true)+table(b.rows)})});
   const xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr></w:body></w:document>';
   zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
   zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
   zip.file('word/document.xml',xml);
   const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=file+'.docx';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  }else if(d.format==='pdf'){
   await load('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',()=>!!window.jspdf?.jsPDF);
   const pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4'});let y=22;
   const line=(t,bold=false)=>{pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(bold?12:10);const lines=pdf.splitTextToSize(String(t||'—'),170);if(y+lines.length*5>280){pdf.addPage();y=20}pdf.text(lines,20,y);y+=lines.length*5+3};
   line('DOKUMEN PORTOFOLIO TRANSFORMASI · '+year(),true);line('Versi '+version+' · Draft, belum TTE');
   data.forEach((o,i)=>{if(y>210){pdf.addPage();y=20}line((i+1)+'. '+o.p.nama+' ('+(o.p.kode||o.p.akr)+')',true);o.blocks.forEach(b=>{line(b.title,true);b.rows.forEach(x=>{line(x[0],true);line(x[1])})})});
   pdf.save(file+'.pdf');
  }else{
   await load('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js',()=>!!window.PptxGenJS);
   const ppt=new window.PptxGenJS();ppt.layout='LAYOUT_WIDE';ppt.author='PMO Kementerian Keuangan';
   const cover=ppt.addSlide();cover.background={color:'0B2447'};
   cover.addText('DOKUMEN PORTOFOLIO PROGRAM TRANSFORMASI',{x:.7,y:1.7,w:12,h:.8,fontFace:'Aptos',fontSize:29,bold:true,color:'FFFFFF'});
   cover.addText('Tahun '+year()+' · Versi '+version,{x:.7,y:2.8,w:12,h:.5,fontFace:'Aptos',fontSize:18,color:'FDB913'});
   cover.addText(data.length+' Program Terpilih',{x:.7,y:3.6,w:12,h:.4,fontSize:14,color:'FFFFFF'});
   portSlides().forEach(({program,title,rows},i)=>{const sl=ppt.addSlide();sl.background={color:'FFFFFF'};
    sl.addText(program.nama+' · '+title,{x:.5,y:.35,w:12,h:.6,fontSize:20,bold:true,color:'153A65'});
    sl.addText((program.kode||program.akr)+' · '+year()+' · v'+version,{x:.5,y:1,w:12,h:.35,fontSize:11,color:'667E99'});
    const h=5.7/Math.max(1,rows.length);rows.forEach((row,j)=>{const yy=1.45+j*h;sl.addText(row[0],{x:.6,y:yy,w:3,h:h-.1,fontSize:12,bold:true,color:'164B77'});
     sl.addText(String(row[1]||'Belum diisi'),{x:3.8,y:yy,w:8.8,h:h-.1,fontSize:10,color:'30435E',breakLine:false})});
   });
   await ppt.writeFile({fileName:file+'.pptx'});
  }
  registerExport('portfolio','all',year(),d.format,file+'.'+(d.format==='word'?'docx':d.format),{sections:d.sections.slice(),programs:data.map(o=>o.p.id)});
  toast('Dokumen portofolio v'+version+' berhasil diunduh. Versi berikutnya ditetapkan setelah unggah bukti TTE.');
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
 return false;
}
function change(ev,inline=false){
 const q=ev.target,d=cfg();
 if(q.dataset.docSection!==undefined){const k=q.dataset.docSection;d.sections=q.checked?[...new Set([...d.sections,k])]:d.sections.filter(x=>x!==k);d.slide=0;save();if(!inline)render();return true}
 if(q.dataset.docExtra!==undefined){d[q.dataset.docExtra]=q.checked;save();if(!inline)render();return true}
 if(q.dataset.docFormat!==undefined){d.format=q.value;d.slide=0;save();if(!inline)render();return true}
 return false;
}
window.MT_PS_DOC={fields,sections,slidePages,paper,builder,exportFile,click,change,documentPreview,versionPanel,nextVersion,registerExport,confirmSigned,history,processSigned,portfolioBuilder,portfolioClick,portfolioChange,portfolioExport,version:'20261108-program-document-builder-v3'};
})();