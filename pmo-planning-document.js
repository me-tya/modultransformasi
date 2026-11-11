/* PMO · Buat Dokumen Perencanaan — reuse document engine and portfolio builder visual language. */
(function(){
'use strict';
const E=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const TEXT=v=>{if(Array.isArray(v))return v.map(TEXT).filter(x=>x&&x!=='—').join('; ')||'—';if(v&&typeof v==='object')return Object.entries(v).filter(([,x])=>x!=null&&x!=='').map(([k,x])=>k+': '+TEXT(x)).join('; ')||'—';return String(v==null||v===''?'—':v)};
const sections=()=>CHPG.map(([k,n])=>[k,n]);
const year=()=>+S.ui.tahun||2026;
const all=()=>pmoProgramList();
function config(){
 S.ui.pmPlanDoc=S.ui.pmPlanDoc||{};
 const d=S.ui.pmPlanDoc,ps=all(),ids=ps.map(p=>String(p.akr));
 if(d.year!==year()){d.year=year();d.selected=ids;d.slide=0}
 if(!Array.isArray(d.selected))d.selected=ids;
 if(!Array.isArray(d.sections))d.sections=sections().map(x=>x[0]);
 d.sections=d.sections.filter(k=>sections().some(s=>s[0]===k));
 if(!['word','pdf','pptx'].includes(d.format))d.format='word';
 if(!['classic','activity'].includes(d.template))d.template='activity';
 if(!d.tte||typeof d.tte!=='object')d.tte={name:'',title:'',label:'Mengetahui',city:'Jakarta',date:'',number:''};
 if(d.sign==null)d.sign=true;
 return d;
}
const chosen=()=>{const d=config();return all().filter(p=>d.selected.includes(String(p.akr)))};
function current(p){
 const cs=chList(p.akr);
 return cs.find(x=>x.st==='Draft')||cs.find(x=>x.st==='Reviu')||chCur(p.akr)||null;
}
function rows(c,key){
 if(!c)return [['Status','Dokumen proyek belum dibuat untuk program ini.']];
 const a=c.asis||{},b=c.tobe||{},l=[];
 const add=(lab,val)=>l.push([lab,TEXT(val)]);
 if(key==='asis'){
  add('Proses bisnis saat ini',a.pb);add('Permasalahan utama',a.masalah);
  (a.kor||[]).forEach((r,i)=>add('Sistem eksisting '+(i+1),[r.p,r.s,r.o,r.dk,r.c].filter(Boolean)));
  add('Teknologi digunakan',a.tek);return l;
 }
 if(key==='tobe'){
  (b.pb||[]).forEach((r,i)=>add('Perubahan proses bisnis '+(i+1),'As-is: '+TEXT(r.a)+' → To-be: '+TEXT(r.b)+(r.j?' ('+r.j+')':'')));
  add('Potensi digitalisasi',b.pot);add('Arsitektur aplikasi dan teknologi',b.ar);return l;
 }
 if(key==='cs'){(c.cs||[]).forEach((r,i)=>add('Perbandingan '+(i+1),'Saat ini: '+TEXT(r.a)+' → Target: '+TEXT(r.b)));return l}
 if(key==='ch'){
  [['Judul charter',c.judul],['Tujuan',c.tujuan],['Latar belakang',c.lb],['Terobosan',c.tb],['Keluaran',c.out],['Outcome',c.oc],['Milestone', (c.ms||[]).map(r=>[r.y,r.t].filter(Boolean).join(' · '))],['Risiko',c.ris],['Faktor pendukung',c.pk],['Initiative Champion',c.ch],['Initiative Owner',c.ow],['Periode',String(c.p1||year())+' – '+String(c.p2||year())]].forEach(x=>add(x[0],x[1]));return l;
 }
 if(key==='kp'){(c.kp||[]).forEach((r,i)=>add('Milestone '+(i+1)+' · '+(r.m||'—'),r.k));return l}
 if(key==='mf'){(c.mf||[]).forEach((r,i)=>add('Manfaat '+(i+1)+' · '+(r.m||'—'),[['Aspek',r.asp],['Penerima',r.pen],['Indikator',r.ind],['Pengukuran',r.mek],['Baseline',r.base],['Target',r.tgt],['Waktu',r.wkt]].filter(x=>x[1]!=null&&x[1]!=='').map(x=>x[0]+': '+TEXT(x[1])).join(' | ')));return l}
 if(key==='rk'){(c.rk||[]).forEach((r,i)=>add('Rencana kerja '+(i+1)+' · '+(r.t||'—'),Object.entries(r).filter(([k,v])=>k!=='t'&&v!=null&&v!=='').map(([k,v])=>k+': '+TEXT(v)).join(' | ')));return l}
 return l;
}
function bundle(){
 const d=config();return chosen().map(p=>{const c=current(p);return {p,c,blocks:sections().filter(x=>d.sections.includes(x[0])).map(([key,title])=>({key,title,rows:rows(c,key)}))}})
}
function version(){return window.MT_PS_DOC?.nextVersion('planning','all',year())||1}
function model(){
 const d=config(),data=bundle(),B=[],v=version();
 B.push({t:'h1',text:'Ringkasan Eksekutif'});
 B.push({t:'p',text:'Kompilasi tujuh dokumen perencanaan proyek dari program yang dipilih pada Modul Transformasi untuk Tahun Anggaran '+year()+'. Isian disalin dari versi charter yang tersedia saat dokumen diunduh.'});
 B.push({t:'kv',rows:[['Tahun Anggaran',String(year())],['Program terpilih',String(data.length)],['Substansi',d.sections.length+' dari 7 dokumen'],['Versi','Draft v'+v],['Status','Rancangan · belum disahkan']]});
 B.push({t:'table',caption:'Daftar program dalam dokumen',head:['No.','Program Transformasi','Kode','Status Dokumen Proyek'],widths:[7,55,18,20],rows:data.length?data.map((o,i)=>[String(i+1),o.p.nama,o.p.kodeResmi||o.p.kode||'—',o.c?.st||'Belum dibuat']):[['—','Tidak ada program dipilih','—','—']]});
 data.forEach((o,i)=>{
  B.push({t:'h1',text:'Program '+String(i+1).padStart(2,'0')+' — '+o.p.nama});
  B.push({t:'kv',rows:[['Kode Program',o.p.kodeResmi||o.p.kode||'Belum ditetapkan'],['UIC Utama',o.p.uic||'—'],['Status Dokumen Proyek',o.c?.st||'Belum dibuat'],['Versi Charter',o.c?'v'+o.c.ver:'—']]});
  o.blocks.forEach(x=>{
   B.push({t:'h2',text:x.title});
   const filled=x.rows.filter(r=>r[1]&&r[1]!=='—'&&!/^belum diisi$/i.test(r[1]));
   if(filled.length)B.push({t:'table',caption:x.title+' · '+o.p.nama,head:['Komponen','Uraian'],widths:[30,70],rows:filled});
   else B.push({t:'p',text:'Substansi '+x.title+' belum memiliki data yang dapat dikompilasi.'});
  });
 });
 B.push({t:'h1',text:'Catatan Penggunaan'});
 B.push({t:'bullets',items:['Data bersifat snapshot pada saat ekspor, bukan pembaruan langsung dari charter.','Dokumen belum berlaku sebagai pengesahan tanpa tanda tangan elektronik yang sah.','Nomor versi baru diterbitkan setelah bukti PDF TTE dicatat; penyimpanan bukti masih bersifat lokal perangkat.']});
 if(d.sign)B.push({t:'tte'});
 const t=d.tte;
 return {lang:'id',formal:true,template:d.template,toc:true,
  fileName:'Dokumen_Perencanaan_Proyek_'+year()+'_v'+v,header:'Dokumen Perencanaan Proyek · '+year(),
  cover:{kicker:'DOKUMEN PERENCANAAN PROYEK',title:'Kompilasi Dokumen Perencanaan',subject:'Tahun Anggaran '+year(),chips:[data.length+' program',d.sections.length+' substansi','Draft v'+v],scope:[],
   meta:[['Nomor Dokumen',t.number||'Belum ditetapkan'],['Tahun Anggaran',String(year())],['Versi','v'+v],['Program terpilih',String(data.length)],['Pengelola',ME?.unit||'PMO Kementerian Keuangan']],
   noTte:!d.sign,tte:{name:t.name,title:t.title,label:t.label,city:t.city,date:t.date}},blocks:B};
}
function slides(){
 const data=bundle(),pages=[{title:'Dokumen Perencanaan Proyek',sub:'Tahun Anggaran '+year(),rows:[['Program',String(data.length)],['Substansi',String(config().sections.length)],['Versi','v'+version()]]}];
 data.forEach(o=>{pages.push({title:o.p.nama,sub:'Profil Program · '+(o.p.kode||''),rows:[['UIC',o.p.uic||'—'],['Status',o.c?.st||'Belum dibuat']]});o.blocks.forEach(b=>{
  const data=b.rows.length?b.rows:[['Substansi','Belum diisi']];
  const items=[];data.forEach(r=>{const chunks=window.MT_PS_DOC?.splitPortText?.(r[1],160)||[r[1]];chunks.forEach((v,j)=>items.push([r[0]+(j?' (lanjutan)':''),v]))});
  for(let k=0;k<items.length;k+=4)pages.push({title:b.title+(k?' (lanjutan)':''),sub:o.p.nama,rows:items.slice(k,k+4)});
 })});
 return pages;
}
function preview(){
 const d=config();
 if(d.format==='pptx'){
  const s=slides(),i=Math.max(0,Math.min(s.length-1,d.slide||0)),p=s[i];
  return '<div class="mt-plan-slide"><small>KEMENTERIAN KEUANGAN · '+E(year())+'</small><h2>'+E(p.title)+'</h2><p>'+E(p.sub)+'</p><div class="mt-plan-slidegrid">'+p.rows.map(r=>'<article><b>'+E(r[0])+'</b><span>'+E(r[1])+'</span></article>').join('')+'</div><footer>DOKUMEN PERENCANAAN PROYEK <span>'+ (i+1)+' / '+s.length+'</span></footer></div>'+
   '<div class="psbank-slidecontrols"><button class="btn" data-plan-slide="-1" '+(!i?'disabled':'')+'>‹ Sebelumnya</button><span>Slide '+(i+1)+' / '+s.length+'</span><button class="btn" data-plan-slide="1" '+(i>=s.length-1?'disabled':'')+'>Berikutnya ›</button></div>';
 }
 if(typeof mtRptHtml!=='function')return '<p class="note">Mesin pratinjau belum siap.</p>';
 return '<iframe class="psbank-port-report-frame" title="Pratinjau Dokumen Perencanaan" srcdoc="'+E(mtRptHtml(model()))+'"></iframe>';
}
function builder(){
 const d=config(),ps=all(),selected=chosen(),keys=sections(),v=version(),api=window.MT_PS_DOC;
 return '<div class="psbank-card psbank-portfolio-doc mt-plan-document" id="mt-plan-builder"><div class="psbank-sectionhead"><div><h3>Buat Dokumen Perencanaan · '+year()+'</h3><p>Kompilasi tujuh dokumen proyek berdasarkan pilihan program dan substansi; pratinjau dan ekspor tanpa mengubah charter sumber.</p></div><span class="psbank-count">'+selected.length+' dari '+ps.length+' program</span></div>'+
 '<div class="psbank-docbuilder"><div class="psbank-docsettings"><div class="psbank-doccheckhead"><b>Pilih Program</b><button class="btn" type="button" data-plan-all>'+(selected.length===ps.length?'Kosongkan':'Pilih Semua')+'</button></div>'+
 '<div class="psbank-portfolio-checks">'+(ps.length?ps.map(p=>'<label><input type="checkbox" data-plan-program="'+E(p.akr)+'" '+(d.selected.includes(String(p.akr))?'checked':'')+'><span><b>'+E(p.nama)+'</b><small>'+E(p.kodeResmi||p.kode)+' · '+E(current(p)?.st||'Belum dibuat')+'</small></span></label>').join(''):'<p>Belum ada program yang tersedia untuk filter saat ini.</p>')+'</div>'+
 '<div class="psbank-doccheckhead"><b>Substansi Perencanaan</b><span>'+d.sections.length+' / '+keys.length+' dipilih</span></div>'+
 '<div class="psbank-docchecks">'+keys.map((x,i)=>'<label><input type="checkbox" data-plan-section="'+E(x[0])+'" '+(d.sections.includes(x[0])?'checked':'')+'>'+(i+1)+'. '+E(x[1])+'</label>').join('')+'</div>'+
 '<div class="psbank-template-picker"><label><b>Template Word / PDF</b><select data-plan-template><option value="activity" '+(d.template==='activity'?'selected':'')+'>Warna · Laporan Kegiatan</option><option value="classic" '+(d.template==='classic'?'selected':'')+'>Formal · Navy–Emas</option></select></label></div>'+
 '<div class="mt-plan-tte"><label><input type="checkbox" data-plan-sign '+(d.sign?'checked':'')+'> Sertakan blok penandatanganan elektronik (TTE)</label>'+
 (d.sign?'<div class="mt-plan-ttegr"><input type="text" data-plan-tte="name" placeholder="Nama pejabat" value="'+E(d.tte.name)+'"><input type="text" data-plan-tte="title" placeholder="Jabatan" value="'+E(d.tte.title)+'"><input type="text" data-plan-tte="label" placeholder="Keterangan (mis. Mengetahui)" value="'+E(d.tte.label)+'"><input type="text" data-plan-tte="city" placeholder="Kota" value="'+E(d.tte.city)+'"><input type="date" data-plan-tte="date" value="'+E(d.tte.date)+'"><input type="text" data-plan-tte="number" placeholder="Nomor dokumen" value="'+E(d.tte.number)+'"></div>':'')+'</div>'+
 '<div class="psbank-docformat"><strong>Format Ekspor</strong><div class="psbank-formatbuttons">'+[['pdf','PDF'],['word','DOCX'],['pptx','PPTX']].map(x=>'<button type="button" class="btn '+(d.format===x[0]?'on':'')+'" data-plan-format="'+x[0]+'" aria-pressed="'+(d.format===x[0])+'">'+x[1]+'</button>').join('')+'</div></div>'+
 (api?.versionPanel?.('planning','all',year())||'')+'</div>'+
 '<div class="psbank-docpreview"><div class="psbank-docpreview-head"><div><b>Pratinjau '+(d.format==='pptx'?'PowerPoint':d.format==='pdf'?'PDF':'Word')+'</b><small>Dokumen Perencanaan · '+year()+'</small></div><span>v'+v+' · '+selected.length+' program</span></div>'+
 '<div class="psbank-docscroll">'+preview()+'</div><div class="psbank-portfolio-download"><button type="button" class="btn pri" data-plan-export '+(!selected.length||!d.sections.length?'disabled':'')+'>↓ Unduh '+(d.format==='word'?'DOCX':d.format.toUpperCase())+'</button></div></div></div></div>';
}
function page(){
 return vh('C','pmo','Buat Dokumen Perencanaan','Pilih program dan tujuh substansi dokumen proyek, lalu pratinjau serta ekspor sesuai kebutuhan.')+pmoTabs('dokplan')+builder();
}
function redraw(){
 const old=document.getElementById('mt-plan-builder');if(!old)return;
 const settings=old.querySelector('.psbank-docsettings')?.scrollTop||0;
 const previewScroll=old.querySelector('.psbank-docscroll')?.scrollTop||0;
 old.outerHTML=builder();
 const next=document.getElementById('mt-plan-builder');
 if(next){next.querySelector('.psbank-docsettings').scrollTop=settings;next.querySelector('.psbank-docscroll').scrollTop=previewScroll}
}
async function downloadPdf(m){
 if(!window.jspdf)await chLib('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',()=>!!window.jspdf);
 const pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4'}),W=210,H=297,margin=17,usable=W-2*margin;let y=20,pageNo=1;
 const clean=t=>String(t??'').replace(/\*\*/g,'').replace(/[^\x20-\x7e\u00a0-\u00ff]/g,c=>({'→':'-','–':'-','—':'-','•':'*'}[c]||'?'));
 const header=()=>{pdf.setFillColor(16,47,86);pdf.rect(0,0,W,12,'F');pdf.setTextColor(255,255,255);pdf.setFont('helvetica','bold');pdf.setFontSize(9);pdf.text('KEMENTERIAN KEUANGAN - DOKUMEN PERENCANAAN',margin,8);pdf.setTextColor(32,49,70)};
 const newpage=()=>{pdf.addPage();pageNo++;y=20;header()};
 const line=(t,bold=false,size=10,after=3)=>{pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);const parts=pdf.splitTextToSize(clean(t),usable);const step=size*.43+1.5;parts.forEach(p=>{if(y+step>H-17)newpage();pdf.text(p,margin,y);y+=step});y+=after};
 header();line('DOKUMEN PERENCANAAN PROYEK',true,17,4);line('Tahun Anggaran '+year()+' - Draft v'+version(),false,11,7);
 m.blocks.forEach(b=>{
  if(b.t==='h1'){y+=4;line(b.text,true,13,4)}
  else if(b.t==='h2'){y+=2;line(b.text,true,11,2)}
  else if(b.t==='p')line(b.text,false,9,4);
  else if(b.t==='kv'||b.t==='table'){if(b.t==='table'&&b.caption)line(b.caption,true,9,2);(b.rows||[]).forEach(r=>line(r.map(TEXT).join('   |   '),false,9,2));y+=4}
  else if(b.t==='bullets')(b.items||[]).forEach(it=>line('- '+it,false,9,1));
  else if(b.t==='tte')line('TTE: '+[config().tte.name,config().tte.title,config().tte.city,config().tte.date].filter(Boolean).join(' / '),false,9,3);
 });
 pdf.save(m.fileName+'.pdf');
}
async function exportFile(){
 const d=config(),api=window.MT_PS_DOC;
 if(!chosen().length||!d.sections.length){toast('Pilih minimal satu program dan substansi.');return}
 const m=model();
 try{
  if(d.format==='word'){
   if(!window.JSZip)await chLib('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!window.JSZip);
   mtRptDownloadBlob(await mtRptDocx(m),m.fileName+'.docx');
  }else if(d.format==='pdf')await (api?.exportFormalPdf?api.exportFormalPdf(m,m.fileName+'.pdf'):downloadPdf(m));
  else mtRptDownloadBlob(await rptPptx(m),m.fileName+'.pptx');
  api?.registerExport?.('planning','all',year(),d.format,m.fileName+'.'+(d.format==='word'?'docx':d.format),{sections:d.sections.slice(),programs:chosen().map(p=>p.akr)});
  toast('Dokumen Perencanaan v'+version()+' berhasil diunduh. Nomor versi baru setelah bukti TTE tercatat.');
  redraw();
 }catch(err){toast('Ekspor gagal: '+(err.message||err))}
}
document.addEventListener('click',function(e){
 if(!e.target.closest('#mt-plan-builder'))return;
 const d=config(),t=e.target;
 if(t.closest('[data-plan-all]')){d.selected=d.selected.length===all().length?[]:all().map(p=>String(p.akr));save();redraw();return}
 const fmt=t.closest('[data-plan-format]');if(fmt){d.format=fmt.dataset.planFormat;d.slide=0;save();redraw();return}
 const slide=t.closest('[data-plan-slide]');if(slide){d.slide=Math.max(0,Math.min(slides().length-1,(d.slide||0)+Number(slide.dataset.planSlide)));save();redraw();return}
 if(t.closest('[data-plan-export]')){exportFile();return}
 if(t.closest('[data-doc-signed-kind]')){window.MT_PS_DOC?.processSigned?.(e);return}
 if(t.closest('[data-doc-proof-open]')){window.MT_PS_DOC?.openSignedProof?.(e);return}
});
document.addEventListener('change',function(e){
 if(!e.target.closest('#mt-plan-builder'))return;
 const t=e.target,d=config();
 if(t.dataset.planProgram!==undefined){const k=t.dataset.planProgram;d.selected=t.checked?[...new Set([...d.selected,k])]:d.selected.filter(x=>x!==k);d.slide=0}
 else if(t.dataset.planSection!==undefined){const k=t.dataset.planSection;d.sections=t.checked?[...new Set([...d.sections,k])]:d.sections.filter(x=>x!==k);d.slide=0}
 else if(t.dataset.planTemplate!==undefined)d.template=t.value;
 else if(t.hasAttribute('data-plan-sign'))d.sign=t.checked;
 else if(t.dataset.planTte!==undefined)d.tte[t.dataset.planTte]=t.value;
 else return;
 save();redraw();
});
const css=document.createElement('style');css.id='mt-plan-document-style';css.textContent=
 '#app .mt-plan-document{font-family:inherit;--mt-navy:#102f56}'+
 '#app .mt-plan-document .psbank-docbuilder{grid-template-columns:minmax(310px,.76fr) minmax(0,1.5fr);min-height:550px}'+
 '#app .mt-plan-document .psbank-docsettings{max-height:660px;overflow-y:auto}'+
 '#app .mt-plan-document .psbank-docscroll{min-height:0;height:570px!important;max-height:65vh!important;overflow:auto!important}'+
 '#app .mt-plan-tte{border:1px solid #d7e3f0;border-radius:8px;padding:10px;font-size:11px;color:#264969}'+
 '#app .mt-plan-tte>label{display:flex;align-items:center;gap:7px;font-weight:750}'+
 '#app .mt-plan-ttegr{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}'+
 '#app .mt-plan-ttegr input{min-width:0;width:100%;box-sizing:border-box;height:34px;border:1px solid #cbd9e9;border-radius:6px;padding:6px;font:inherit;background:#fff}'+
 '#app .mt-plan-slide{background:#fff;min-height:410px;border-top:8px solid #f9b919;box-shadow:0 2px 12px #1234561a;padding:26px;color:#102f56;position:relative;font-family:inherit}'+
 '#app .mt-plan-slide>small{font-weight:800;color:#56718d;font-size:11px}'+
 '#app .mt-plan-slide h2{font-size:23px;margin:16px 0 6px;color:#102f56}'+
 '#app .mt-plan-slide>p{color:#56718d;font-size:12px;margin:0 0 24px}'+
 '#app .mt-plan-slidegrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding-bottom:36px}'+
 '#app .mt-plan-slidegrid article{background:#ecf3fa;border-left:4px solid #f9b919;min-width:0;padding:12px}'+
 '#app .mt-plan-slidegrid article b{display:block;margin-bottom:7px;font-size:11px}'+
 '#app .mt-plan-slidegrid article span{display:block;font-size:12px;line-height:1.5;overflow-wrap:anywhere}'+
 '#app .mt-plan-slide footer{position:absolute;bottom:0;left:0;right:0;background:#102f56;color:#fff;padding:8px 17px;font-size:10px;display:flex;justify-content:space-between}'+
 '@media(max-width:1050px){#app .mt-plan-document .psbank-docbuilder{grid-template-columns:1fr}#app .mt-plan-document .psbank-docsettings{max-height:400px}#app .mt-plan-document .psbank-docscroll{height:500px!important}}'+
 '@media(max-width:560px){#app .mt-plan-ttegr,#app .mt-plan-slidegrid{grid-template-columns:1fr}}';
document.head.appendChild(css);
window.MT_PMO_PLAN={page,builder,model,exportFile};
})();
