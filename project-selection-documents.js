/* Inline Document Builder & preview; Word/PDF/PPTX native export. */
(function(){
'use strict';
const B=window.MT_PROJECT_SELECTION,I=B?.internals;if(!B||!I)return;
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const X=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const STEPS=[['identity','Identitas'],['case','Business Case'],['benefits','Manfaat'],['stakeholders','Stakeholder'],['risks','Risiko'],['governance','Tata Kelola'],['review','Reviu']];
const year=()=>+S.ui.tahun||2026;
const cfg=()=>{S.ui.psBank=S.ui.psBank||{};const b=S.ui.psBank;b.doc=b.doc||{format:'word',sections:STEPS.map(x=>x[0]),cover:true,toc:true,sign:false,annex:true,slide:0};b.doc.sections=b.doc.sections||STEPS.map(x=>x[0]);return b.doc};
const title=k=>STEPS.find(s=>s[0]===k)?.[1]||k;
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
function paper(p,key,y){
 return '<article class="psbank-paper"><div class="psbank-paper-head"><small>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</small><h3>'+E(title(key))+'</h3><span>'+E(p.nama)+' · '+y+' · '+E(p.kode||p.akr)+'</span></div>'+
 '<div class="psbank-paper-body">'+fields(p,key,y).map(([a,b])=>'<div class="psbank-paper-row"><b>'+E(a)+'</b><p>'+E(b||'Belum diisi').replace(/\n/g,'<span class="psbank-line"></span>')+'</p></div>').join('')+'</div>'+
 '<div class="psbank-paper-foot"><span>Pratinjau dokumen program</span><span>Tahun '+y+'</span></div></article>';
}
function annex(p){const c=charter(p,year());if(!c)return[];return [['Analisis As-is',join(c.asis?.pb)||join(c.lb)],['Analisis To-be',join(c.tobe?.pb)||join(c.tb)],['Perbandingan',join(c.cs)],['Charter Program',c.tujuan],['Kriteria Penyelesaian',join(c.kp)],['Manfaat',join(c.mf)||join(c.oc)],['Linimasa',join(c.rk)||join(c.ms)]]}
function documentPreview(p){
 const d=cfg(),list=sections(p);
 if(d.format==='pptx'){
  const n=Math.max(0,Math.min(+d.slide||0,list.length-1)),s=list[n]||{title:'Pilih substansi dokumen',rows:[]};
  return '<div class="psbank-slidepreview"><div class="psbank-slidetop"><span>KEMENTERIAN KEUANGAN</span><strong>'+E(p.kode||p.akr)+'</strong></div><h3>'+E(s.title)+'</h3><small>'+E(p.nama)+' · '+year()+'</small>'+
  '<div class="psbank-slidebody">'+s.rows.slice(0,7).map(r=>'<article><b>'+E(r[0])+'</b><p>'+E(String(r[1]||'Belum diisi').slice(0,260))+'</p></article>').join('')+'</div>'+
  '<div class="psbank-slidefoot"><span>Program Transformasi · '+year()+'</span><span>Slide '+(n+1)+' / '+(list.length||1)+'</span></div></div>'+
  '<div class="psbank-slidecontrols"><button class="btn" data-doc-slide="-1" '+(n===0?'disabled':'')+'>‹ Sebelumnya</button><span>'+E(s.title)+'</span><button class="btn" data-doc-slide="1" '+(n>=list.length-1?'disabled':'')+'>Berikutnya ›</button></div>';
 }
 return '<article class="psbank-docpaper">'+(d.cover?'<header class="psbank-doccover"><small>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</small><h2>DOKUMEN PERENCANAAN PROGRAM</h2><h3>'+E(p.nama)+'</h3><p>'+E(p.kode||p.akr)+' · Tahun '+year()+'</p><span>Rancangan untuk reviu — belum disahkan</span></header>':'')+
 (d.toc?'<section class="psbank-doctoc"><b>DAFTAR ISI</b>'+list.map((x,i)=>'<div>'+(i+1)+'. '+E(x.title)+'</div>').join('')+'</section>':'')+
 list.map((x,i)=>'<section class="psbank-docsection"><h4>'+(i+1)+'. '+E(x.title)+'</h4><table>'+x.rows.map(r=>'<tr><th>'+E(r[0])+'</th><td>'+E(r[1]||'Belum diisi')+'</td></tr>').join('')+'</table></section>').join('')+
 (d.annex&&annex(p).length?'<section class="psbank-docsection"><h4>LAMPIRAN CHARTER</h4><table>'+annex(p).map(r=>'<tr><th>'+E(r[0])+'</th><td>'+E(r[1]||'Belum diisi')+'</td></tr>').join('')+'</table></section>':'')+
 (d.sign?'<section class="psbank-docsignature">Mengetahui / menyetujui<br><br><br>Pejabat Berwenang</section>':'')+
 '<footer class="psbank-docfoot">Pratinjau '+(d.format==='pdf'?'PDF':'Word')+' · '+list.length+' substansi · '+year()+'</footer></article>';
}
function builder(p){
 const d=cfg(),list=STEPS,fmt=d.format||'word';
 return '<div class="psbank-docbuilder"><div class="psbank-docsettings"><div class="psbank-docsetting-head"><h3>Dokumen Perencanaan Program · Pratinjau & Ekspor</h3><p>Pilih isi dan format dokumen di sini; pratinjau langsung tampil di sebelah kanan.</p></div>'+
 '<div class="psbank-doccheckhead"><b>Substansi dokumen</b><span>'+d.sections.length+' / 7 dipilih</span></div>'+
 '<div class="psbank-docchecks">'+list.map((x,i)=>'<label><input type="checkbox" data-doc-section="'+x[0]+'" '+(d.sections.includes(x[0])?'checked':'')+'> '+(i+1)+'. '+E(x[1])+'</label>').join('')+'</div>'+
 '<div class="psbank-docextras"><label><input type="checkbox" data-doc-extra="cover" '+(d.cover?'checked':'')+'> Sampul & identitas</label>'+
 '<label><input type="checkbox" data-doc-extra="toc" '+(d.toc?'checked':'')+'> Daftar isi</label>'+
 '<label><input type="checkbox" data-doc-extra="annex" '+(d.annex?'checked':'')+'> Lampiran charter tersedia</label>'+
 '<label><input type="checkbox" data-doc-extra="sign" '+(d.sign?'checked':'')+'> Halaman penandatanganan</label></div>'+
 '<div class="psbank-docsettings-foot"><label>Format Ekspor <select data-doc-format><option value="word" '+(fmt==='word'?'selected':'')+'>Word (.docx)</option><option value="pdf" '+(fmt==='pdf'?'selected':'')+'>PDF (.pdf)</option><option value="pptx" '+(fmt==='pptx'?'selected':'')+'>PowerPoint (.pptx)</option></select></label>'+
 '<button class="btn pri" data-doc-export '+(!d.sections.length?'disabled':'')+'>↓ Ekspor '+(fmt==='word'?'Word':fmt==='pdf'?'PDF':'PPTX')+'</button></div></div>'+
 '<div class="psbank-docpreview"><div class="psbank-docpreview-head"><div><b>Pratinjau '+(fmt==='word'?'Word':fmt==='pdf'?'PDF':'PowerPoint')+'</b><small>'+E(p.nama)+'</small></div><span>'+d.sections.length+' substansi</span></div>'+
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
 const d=cfg(),list=sections(p),file=basename(p);
 try{
  if(d.format==='word'){
   await load('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!window.JSZip);
   const zip=new window.JSZip();let body='';
   if(d.cover)body+=para('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',true)+para('DOKUMEN PERENCANAAN PROGRAM',true)+para(p.nama,true)+para((p.kode||p.akr)+' • Tahun '+year());
   body+=para('Rancangan dokumen untuk reviu. Bukan keputusan atau pengesahan resmi.');
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
   text('KEMENTERIAN KEUANGAN · '+year(),true);text('Draf untuk reviu, bukan dokumen keputusan.');
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
   cover.addText('Tahun '+year()+'  ·  '+(p.kode||p.akr),{x:.6,y:5.9,w:11,h:.3,fontFace:'Aptos',fontSize:13,color:'FDB913'});
   list.forEach((r,i)=>{
    const s=ppt.addSlide();s.background={color:'FFFFFF'};
    s.addShape(ppt.ShapeType.rect,{x:0,y:0,w:13.33,h:.14,line:{color:'FDB913'},fill:{color:'FDB913'}});
    s.addText(r.title,{x:.55,y:.35,w:12,h:.5,fontFace:'Aptos',fontSize:23,bold:true,color:'0B2447'});
    s.addText(p.nama+' · '+year(),{x:.55,y:.95,w:12,h:.3,fontFace:'Aptos',fontSize:10,color:'627892'});
    const rows=r.rows.slice(0,8),h=5.4/Math.max(1,rows.length);
    rows.forEach((a,j)=>{
     const yy=1.38+j*h;s.addShape(ppt.ShapeType.rect,{x:.55,y:yy,w:12.2,h:h-.06,line:{color:'DCE6F0'},fill:{color:j%2?'FFFFFF':'F2F6FB'}});
     s.addText(String(a[0]),{x:.75,y:yy+.08,w:3,h:h-.15,fontFace:'Aptos',fontSize:11,bold:true,color:'183C65',margin:0,valign:'mid'});
     s.addText(String(a[1]||'Belum diisi').slice(0,315),{x:3.95,y:yy+.08,w:8.45,h:h-.15,fontFace:'Aptos',fontSize:Math.max(9,12-rows.length/4),color:'30445C',margin:0,valign:'mid'});
    });
    s.addText((i+1)+' / '+list.length,{x:11.8,y:7.1,w:.85,h:.2,fontFace:'Aptos',fontSize:9,color:'627892'});
   });
   await ppt.writeFile({fileName:file+'.pptx'});
  }
  toast('Ekspor '+String(d.format).toUpperCase()+' selesai.');
 }catch(err){toast('Ekspor gagal: '+(err.message||err))}
}
function click(ev,p){
 const slide=ev.target.closest('[data-doc-slide]');if(slide){const d=cfg();d.slide=Math.max(0,Math.min(sections(p).length-1,(+d.slide||0)+ +slide.dataset.docSlide));save();render();return true}
 if(ev.target.closest('[data-doc-export]')){exportFile(p);return true}
 return false;
}
function change(ev){
 const q=ev.target,d=cfg();
 if(q.dataset.docSection!==undefined){const k=q.dataset.docSection;d.sections=q.checked?[...new Set([...d.sections,k])]:d.sections.filter(x=>x!==k);d.slide=0;save();render();return true}
 if(q.dataset.docExtra!==undefined){d[q.dataset.docExtra]=q.checked;save();render();return true}
 if(q.dataset.docFormat!==undefined){d.format=q.value;d.slide=0;save();render();return true}
 return false;
}
window.MT_PS_DOC={fields,sections,paper,builder,exportFile,click,change,documentPreview,version:'20261108-program-document-builder-v1'};
})();