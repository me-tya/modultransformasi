(function charterPlanningPlugin(){
'use strict';
const CPLAN_KEYS=[['asis','Analisis Kondisi Saat Ini (As-is)'],['tobe','Analisis Kondisi yang Diharapkan (To-be)'],['cs','Perbandingan Kondisi'],['ch','Charter Proyek'],['kp','Kriteria Penyelesaian'],['mf','Manfaat Proyek'],['rk','Linimasa dan Rencana Kerja']];
const cpDefault=()=>({asis:1,tobe:1,cs:1,ch:1,kp:1,mf:1,rk:1,toc:1,charts:1,tte:1});
const cpTxt=(x,none='—')=>{const v=Array.isArray(x)?x.filter(y=>String(y??'').trim()).join('\n'):String(x??'').trim();return v||none};
const cpName=(c)=>'Dokumen_Perencanaan_Proyek_'+String(chProg(c).kode||c.prog).replace(/[^A-Za-z0-9_-]/g,'_')+'_v'+c.ver;
const cpNameTable=(head,rows,caption,ws)=>({t:'table',caption,head,rows:rows.length?rows:[head.map((_,i)=>i?'—':'Belum diisi')],small:true,widths:ws});
function cpGanttImg(c){
 const rows=(c.rk||[]).filter(r=>r&&r.s&&r.e),T=chTL(c),N=T.cols.length;if(!rows.length||!N)return null;
 const cv=document.createElement('canvas'),scale=2,W=880,lh=300,right=24,top=57,rh=38,H=top+rows.length*rh+35;cv.width=W*scale;cv.height=H*scale;
 const x=cv.getContext('2d');if(!x)return null;x.scale(scale,scale);x.fillStyle='#fff';x.fillRect(0,0,W,H);
 const colW=(W-lh-right)/N;x.font='bold 12px Arial';x.textBaseline='middle';x.fillStyle='#17365e';x.fillText('Tindakan / Milestone',12,22);
 T.cols.forEach((d,i)=>{const X=lh+i*colW;x.fillStyle=i%2?'#f5f8fc':'#eaf1f9';x.fillRect(X,0,colW,H);x.fillStyle='#244469';x.font=N>16?'9px Arial':'11px Arial';x.fillText(d.yr?String(d.y):String(d.m),X+2,20);x.strokeStyle='#dce6f3';x.beginPath();x.moveTo(X,0);x.lineTo(X,H);x.stroke()});
 x.fillStyle='#16345c';x.font='bold 12px Arial';x.fillText('Jadwal berdasarkan data Linimasa',12,42);
 rows.forEach((r,i)=>{const y=top+i*rh;x.fillStyle=i%2?'#f8fafc':'#fff';x.fillRect(0,y,lh,rh-1);x.fillStyle='#203a5a';x.font='11px Arial';const title=String(r.t||'—');let t=title;while(x.measureText(t).width>lh-20&&t.length>8)t=t.slice(0,-2);if(t!==title)t=t.slice(0,-1)+'…';x.fillText(t,12,y+14);
  x.fillStyle='#7386a1';x.font='10px Arial';x.fillText([r.s,r.e].filter(Boolean).join(' s.d. '),12,y+29);
  const span=rkSpan(T,r);if(span){const bx=lh+span[0]*colW+3,bw=(span[1]-span[0]+1)*colW-6;x.fillStyle='#205ab0';x.fillRect(bx,y+11,Math.max(2,bw),15);}
  x.strokeStyle='#e5edf4';x.beginPath();x.moveTo(0,y+rh);x.lineTo(W,y+rh);x.stroke();
 });
 return {src:cv.toDataURL('image/png'),w:W,h:H};
}
function cpModel(c,inc,sign,num=''){
 const p=chProg(c),knownModules=Array.isArray(p.psProjects)?p.psProjects:[],
 linked=knownModules.find(x=>String(x.id||x.name)===String(c.projectId||c.moduleId||'')),
 storedTitle=String(chJudul(c)||'').trim(),
 title=String(c.moduleName||c.projectName||linked?.name||
  (storedTitle&&storedTitle!==String(p.nama||'').trim()?storedTitle:
   knownModules.length===1?knownModules[0].name:'Nama modul belum ditentukan')),B=[],has=k=>!!inc[k],none='Belum diisi pada dokumen sumber.';
 const h1=t=>B.push({t:'h1',text:t}), h2=t=>B.push({t:'h2',text:t});
 const para=(s)=>B.push({t:'p',text:cpTxt(s,none)});
 const bullets=(a)=>{a=(a||[]).filter(x=>String(x??'').trim());if(a.length)B.push({t:'bullets',items:a.map(String)});else para(none)};
 const table=(head,rows,caption,widths)=>B.push(cpNameTable(head,rows,caption,widths));
 const cs=c.cs||[],A=c.asis||{},T=c.tobe||{},M=c.ms||[],K=c.kp||[],V=c.mf||[],R=c.rk||[];
 const filled=chDocOk(c);
 B.push({t:'h1',text:'Ikhtisar Dokumen Perencanaan Proyek'});
 B.push({t:'kv',rows:[['Nama proyek / program',title],['Kode program',p.kode||c.prog],['Jenis program',p.jenis||'—'],['Periode',c.p1+(+c.p2>+c.p1?' s.d. '+c.p2:'')],['Versi',c.tahun+' · v'+c.ver],['Status sumber',c.st||'—'],['Tujuan',cpTxt(c.tujuan)],['Jumlah bagian dipilih',CPLAN_KEYS.filter(([k])=>has(k)).length+' dari 7']]});
 table(['Dokumen sumber','Status isi','Disertakan'],CPLAN_KEYS.map(([k,l])=>[l,filled[k==='ch'?'ch':k]?'Sudah ada isian':'Belum lengkap',has(k)?'Ya':'Tidak']),'Matriks kelengkapan substansi',[55,25,20]);
 if(has('asis')){
  h1('Analisis Kondisi Saat Ini (As-is)');
  h2('Proses bisnis eksisting');para(A.pb);
  h2('Permasalahan utama');para(A.masalah);
  h2('Korelasi proses bisnis dengan sistem eksisting');
  table(['Proses bisnis','Sistem eksisting','Pemilik','Tingkat dukungan','Celah'],(A.kor||[]).map(r=>[cpTxt(r.p),cpTxt(r.s),cpTxt(r.o),cpTxt(r.dk),cpTxt(r.c)]),'Korelasi proses bisnis dan sistem eksisting',[22,21,15,15,27]);
  h2('Teknologi yang digunakan');para(A.tek);
  if(A.link)B.push({t:'p',text:'Tautan dokumen referensi: '+A.link});
 }
 if(has('tobe')){
  h1('Analisis Kondisi yang Diharapkan (To-be)');
  h2('Pemutakhiran proses bisnis');
  table(['Proses bisnis As-is','Proses bisnis To-be','Jenis perubahan'],(T.pb||[]).map(r=>[cpTxt(r.a),cpTxt(r.b),cpTxt(r.j)]),'Perubahan proses bisnis',[36,44,20]);
  h2('Potensi digitalisasi proses bisnis lainnya');bullets(T.pot);
  h2('Arsitektur aplikasi dan teknologi');para(T.ar);
  if(T.link||T.arLink)B.push({t:'kv',rows:[['Dokumen proses bisnis',cpTxt(T.link)],['Dokumen arsitektur',cpTxt(T.arLink)]]});
 }
 if(has('cs')){
  h1('Perbandingan Kondisi Saat Ini dan Setelah Implementasi');
  table(['No.','Keadaan Saat Ini (Current State)','Keadaan Setelah Implementasi (Future/End State)'],cs.map((r,i)=>[i+1,cpTxt(r.a),cpTxt(r.b)]),'Matriks perubahan kondisi',[7,46,47]);
 }
 if(has('ch')){
  h1('Charter Proyek');
  h2('Identitas dan tujuan');
  B.push({t:'kv',rows:[['Judul',title],['Periode',c.p1+'–'+c.p2],['Tujuan',cpTxt(c.tujuan)]]});
  h2('Latar belakang');bullets(c.lb);
  h2('Terobosan / strategi');para(c.tb);
  h2('Output yang diharapkan');bullets(c.out);
  h2('Outcome yang diharapkan');bullets(c.oc);
  h2('Milestone utama');
  table(['Tahun','Milestone / Tahap','Kelompok WBS'],M.map(r=>[String(r.y||'—'),cpTxt(r.t),cpTxt(r.g)]),'Milestone dalam charter',[13,58,29]);
  if(inc.charts&&M.length){
    const years=[...new Set(M.map(r=>String(r.y||'')).filter(Boolean))].sort();
    const img=rptBarImg(years.map(y=>({l:'Tahun '+y,v:M.filter(m=>String(m.y)===y).length,c:'#205aa6'})),{lw:175});
    if(img)B.push({t:'charts',items:[{title:'Distribusi jumlah milestone per tahun',img,caption:'Sumber: daftar milestone yang diisi pada Charter.'}]});
  }
  h2('Risiko utama');bullets(c.ris);
  h2('Pendukung kesuksesan');bullets(c.pk);
  h2('Struktur penanggung jawab');
  B.push({t:'kv',rows:[['Initiative Champion',cpTxt(c.ch)],['Initiative Owner',cpTxt(c.ow)]]});
 }
 if(has('kp')){
  h1('Kriteria Penyelesaian Proyek');
  B.push({t:'p',text:'Tahun acuan milestone: '+String(c.kpY||c.p1)});
  table(['No.','Milestone / Keluaran','Kriteria penerimaan (acceptance criteria)'],K.map((r,i)=>[i+1,cpTxt(r.m),cpTxt(r.k)]),'Kriteria penyelesaian per milestone',[7,34,59]);
 }
 if(has('mf')){
  h1('Rencana Manfaat Proyek');
  table(['Manfaat','Aspek','Penerima','Indikator','Pengukuran','Baseline','Target','Waktu'],V.map(r=>[cpTxt(r.m),cpTxt(r.asp),cpTxt(r.pen),cpTxt(r.ind),cpTxt(r.mek),cpTxt(r.base),cpTxt(r.tgt),cpTxt(r.wkt)]),'Matriks rencana manfaat dan indikator',[18,10,13,17,16,8,10,8]);
  if(V.length){h2('Dasar evaluasi pascaproyek');para('Indikator, baseline, target, penerima manfaat, dan waktu pencapaian mengacu pada matriks manfaat di atas. Realisasi manfaat diukur pada tahapan evaluasi pascaproyek.')};
 }
 if(has('rk')){
  h1('Linimasa dan Rencana Kerja');
  table(['No.','Milestone / Tindakan','Mulai','Selesai','UIC Utama','UIC Pendukung'],R.map((r,i)=>[i+1,cpTxt(r.t),cpTxt(r.s),cpTxt(r.e),cpTxt(r.u),cpTxt(r.pd)]),'Jadwal dan penanggung jawab',[6,35,13,13,18,15]);
  if(inc.charts&&R.some(r=>r.s&&r.e)){
   const img=cpGanttImg(c);if(img)B.push({t:'charts',items:[{title:'Diagram linimasa (Gantt)',img,caption:'Baris dan rentang waktu berasal dari isian dokumen Linimasa; tidak menunjukkan realisasi.'}]});
  }
 }
 if(!CPLAN_KEYS.some(([k])=>has(k)))B.push({t:'callout',tone:'warn',title:'Belum ada substansi dipilih',lines:['Pilih sekurang-kurangnya satu dokumen untuk menyusun dokumen perencanaan.']});
 const fname=cpName(c);
 const signer=Object.assign({city:'Jakarta',date:rptLongDate(TODAY),label:'Disetujui oleh,'},sign||{});
 return {lang:'id',formal:!!inc.toc,fileName:fname,header:'Dokumen Perencanaan Proyek · '+title,
  cover:{kicker:'DOKUMEN PERENCANAAN PROYEK',title,subject:'Tahun '+c.tahun,chips:['Tahun '+c.tahun,'Versi v'+c.ver,'Periode '+c.p1+'–'+c.p2],scope:[],meta:[...(num?[['Nomor Dokumen',num]]:[]),['Program Induk',String(p.nama||p.kode||c.prog||'—')],['Kode Program',String(p.kode||c.prog||'—')],['Periode',c.p1+' s.d. '+c.p2],['UIC',String(p.uic||'—')],['Versi','v'+c.ver]],noTte:!inc.tte,tte:signer},blocks:B};
}
function cpOptions(c){
 S.ui.cpReport=S.ui.cpReport||{};
 return S.ui.cpReport[c.prog]||(S.ui.cpReport[c.prog]={inc:cpDefault(),sign:{city:'Jakarta',date:rptLongDate(TODAY),label:'Disetujui oleh,',title:'',name:''},no:''});
}
function cpFooter(c){
 const name='Dokumen Perencanaan Proyek';
 return `<section class="card cp-report-panel" id="cp-report-panel" aria-label="Generator ${name}">
 <div class="cp-report-left"><span class="cp-report-icon">▤</span><div><h3>Susun ${name}</h3><p>Gabungkan 7 dokumen (As-is s.d. Linimasa) menjadi satu dokumen resmi. Pilih substansi, grafik, tabel, dan penandatangan; periksa dahulu sebelum diekspor.</p></div></div>
 <div class="cp-report-actions"><button class="btn cp-preview" data-act="cpReport" data-id="${esc(c.id)}" data-format="preview">◉ Pratinjau</button><button class="btn" data-act="cpReport" data-id="${esc(c.id)}" data-format="pdf">⬇ PDF</button><button class="btn" data-act="cpReport" data-id="${esc(c.id)}" data-format="docx">⬇ Word</button><button class="btn pri" data-act="cpReport" data-id="${esc(c.id)}" data-format="pptx">⬇ PowerPoint</button></div></section>`;
}
const originalCharter=pCharter;
pCharter=function(){
 let html=originalCharter();
 if(!S.ui.chp||!html.includes('class="chhero"'))return html;
 const c=S.charters.find(x=>x.id===S.ui.chv&&x.prog===S.ui.chp)||chCur(S.ui.chp);
 if(!c)return html;
 html=html.replace('Charter Program Transformasi: ','Dokumen Perencanaan Proyek: ');
 html=html.replace(' / Charter Program Transformasi</div>',' / Dokumen Perencanaan Proyek</div>');
 html=html.replace(/<button class="hb gold" data-act="chexp" data-id="[^"]+">⇩ Ekspor ▾<\/button>/,
  '<button class="hb gold" type="button" data-act="cpJump">▤ Dokumen Lengkap ↓</button>');
 return html+cpFooter(c);
};
ACT.cpJump=()=>document.getElementById('cp-report-panel')?.scrollIntoView({behavior:'smooth',block:'center'});
ACT.cpReport=el=>{
 const c=S.charters.find(x=>x.id===el.dataset.id);if(!c){toast('Data charter tidak ditemukan.');return}
 const config=cpOptions(c),inc=Object.assign(cpDefault(),config.inc||{}),sg=Object.assign({city:'Jakarta',date:rptLongDate(TODAY),label:'Disetujui oleh,',title:'',name:''},config.sign||{});
 const p=chProg(c),signers=[];
 for(const u of (S.users||[])){if(u.aktif===false||!u.nama)continue;const v=String(u.nama).trim();if(signers.some(x=>x.name===v))continue;signers.push({name:v,title:u.jabatan||u.posisi||''})}
 const opts=signers.map((x,i)=>'<option value="'+i+'">'+esc(x.name)+(x.title?' · '+esc(x.title):'')+'</option>').join('');
 const body=`<div class="cp-modal">
 <div class="cp-control-panel">
 <div class="cp-note"><strong>${esc(p.kode||c.prog)} · ${esc(chJudul(c))}</strong><small>${c.st==='Disahkan'?'Sumber disahkan':'DRAFT — charter belum disahkan'} · Versi ${c.tahun} v${c.ver}</small></div>
 <details open class="cp-config"><summary>Substansi dokumen <b id="cp-count"></b></summary><div class="cp-check-grid">${CPLAN_KEYS.map(([k,l],i)=>'<label><input type="checkbox" data-cp-inc="'+k+'" '+(inc[k]?'checked':'')+'><span><b>'+(i+1)+'.</b> '+esc(l)+'</span></label>').join('')}</div><div class="cp-tools"><button type="button" data-cp-all="1">Pilih semua</button><button type="button" data-cp-all="0">Kosongkan</button></div></details>
 <div class="cp-opt-grid"><label><input type="checkbox" data-cp-inc="toc" ${inc.toc?'checked':''}> Daftar isi, daftar tabel dan gambar</label><label><input type="checkbox" data-cp-inc="charts" ${inc.charts?'checked':''}> Grafik dan diagram linimasa</label><label><input type="checkbox" data-cp-inc="tte" ${inc.tte?'checked':''}> Halaman penandatangan</label></div>
 <details class="cp-config" ${inc.tte?'open':''} id="cp-ttebox"><summary>✎ Atur TTE · Penandatangan & Identitas Dokumen</summary><div class="cp-sign-grid">
 <label>Penandatangan dari daftar pengguna<select id="cp-sign-pick"><option value="">Isi manual / belum ditentukan</option>${opts}</select></label>
 <label>Nama penandatangan<input data-cp-sign="name" value="${esc(sg.name)}" placeholder="Nama lengkap pejabat"></label>
 <label>Jabatan penandatangan<input data-cp-sign="title" value="${esc(sg.title)}" placeholder="Contoh: Kepala Badan ..."></label>
 <label>Keterangan<input data-cp-sign="label" value="${esc(sg.label)}" placeholder="Mengetahui, / Menyetujui,"></label>
 <label>Kota<input data-cp-sign="city" value="${esc(sg.city)}"></label><label>Tanggal<input data-cp-sign="date" value="${esc(sg.date)}"></label>
 <label>Nomor dokumen (opsional)<input id="cp-no" value="${esc(config.no||'')}" placeholder="Nomor / kode dokumen"></label></div></details>
 </div><div class="cp-frame-wrap"><div class="cp-preview-h"><b>Pratinjau Dokumen Perencanaan Proyek</b><span id="cp-state">Menyusun pratinjau…</span></div><iframe id="cp-report-frame" title="Pratinjau dokumen perencanaan proyek"></iframe><div class="psbank-actual-view" data-doc-actual="project" hidden><small data-actual-progress>Menyiapkan pratinjau dari file DOCX…</small></div></div></div>`;
 let model=null;
 const extra='<button class="btn" data-mx="pdf">⬇ PDF (Simpan)</button><button class="btn" data-mx="docx">⬇ Word (.docx)</button><button class="btn pri" data-mx="pptx">⬇ PowerPoint (.pptx)</button>';
 const isInline=!!el.dataset.inline;
 const Version=window.MT_PS_DOC||null;
 const docYear=+(c.tahun||S.ui.tahun||2026),docId=String(c.id||c.prog);
 const version=()=>Version?.nextVersion('project',docId,docYear)||1;
 const markExport=(format)=>Version?.registerExport('project',docId,docYear,format,(model?.fileName||'Dokumen_Perencanaan_Proyek')+'.'+(format==='docx'?'docx':format==='pptx'?'pptx':'pdf'),{sections:CPLAN_KEYS.filter(([k])=>inc[k]).map(x=>x[0])});
 
 const doExport=(format,win)=>{
  if(!model)return false;
  if(!CPLAN_KEYS.some(([k])=>inc[k])){toast('Pilih sekurang-kurangnya satu dokumen sumber.');return false}
  if(format==='pdf'){try{const f=win.querySelector('#cp-report-frame').contentWindow;f.focus();f.print();markExport('pdf');toast('Pratinjau PDF dikirim ke dialog simpan/cetak.')}catch(e){toast('PDF gagal: '+e.message)}return false}
  if(format==='docx'){if(!window.JSZip){toast('Pustaka Word belum dimuat.');return false}mtRptDocx(model).then(b=>{mtRptDownloadBlob(b,model.fileName+'.docx');markExport('docx');toast('Word berhasil dibuat.')}).catch(e=>toast('Ekspor Word gagal: '+(e.message||e)));return false}
  if(format==='pptx'){window.cpCompactPptx(c,inc).then(()=>{markExport('pptx');toast('PowerPoint berhasil diunduh.')}).catch(e=>toast('Ekspor PowerPoint gagal: '+(e.message||e)));return false}
  return false;
 };
  const ov=isInline?document.getElementById('cp-doc-inline'):modal('<span class="exh">Dokumen Perencanaan Proyek · Pratinjau & Ekspor</span>',body,null,null,
 {cancel:'Tutup',size:'wide rpt cp-report-modal',extra,onExtra:doExport});
 if(!ov)return;
 if(isInline){
  const chooser='<div class="cp-inline-top"><span><b>Format Ekspor</b><small>'+esc(chJudul(c))+'</small></span><div class="cp-inline-formats" role="group" aria-label="Format Ekspor">'+
   [['pdf','PDF'],['docx','DOCX'],['pptx','PPTX']].map(a=>'<button type="button" class="btn '+(a[0]==='docx'?'on':'')+'" data-cp-output="'+a[0]+'" aria-pressed="'+(a[0]==='docx')+'">'+a[1]+'</button>').join('')+'</div></div>';
  const ledger=Version?.versionPanel?.('project',docId,docYear)||'';
  let contents=body.replace(/<\/div><div class="cp-frame-wrap">/,ledger+'</div><div class="cp-frame-wrap">');
  contents=contents.replace('<iframe id="cp-report-frame" title="Pratinjau dokumen perencanaan proyek"></iframe>',
   '<iframe id="cp-report-frame" title="Pratinjau dokumen perencanaan proyek"></iframe><div class="cp-inline-slides" hidden><div class="cp-inline-slidebox"></div><div class="cp-inline-slidecontrols"><button type="button" class="btn" data-cp-prev>‹ Sebelumnya</button><span data-cp-slide-count></span><button type="button" class="btn" data-cp-next>Berikutnya ›</button></div></div>'+
   '<div class="cp-inline-download"><span>Dokumen v'+version()+' · belum TTE</span><div><button type="button" class="btn pri" data-cp-inline-export>↓ Unduh</button><button type="button" class="btn" data-cp-inline-close>Tutup</button></div></div>');
  ov.innerHTML=chooser+contents;
 }

 const frame=ov.querySelector('#cp-report-frame'),status=ov.querySelector('#cp-state');
 const persist=()=>{config.inc=Object.assign({},inc);config.sign=Object.assign({},sg);config.no=ov.querySelector('#cp-no').value.trim();save()};
 let slideIndex=0,slides=[];
 const update=()=>{
  try{
   model=cpModel(c,inc,sg,ov.querySelector('#cp-no').value.trim());
   model.fileName=String(model.fileName||'Perencanaan_Proyek').replace(/_v\d+$/,'')+'_v'+version();
   model.cover.chips=[...(model.cover.chips||[]).filter(x=>!/^Versi Dokumen /.test(x)),'Versi Dokumen '+version()];
   frame.srcdoc=mtRptHtml(model);
   const n=CPLAN_KEYS.filter(([k])=>inc[k]).length;
   status.textContent=n+' dari 7 dokumen · '+(inc.toc?'format laporan lengkap':'format ringkas');
   ov.querySelector('#cp-count').textContent=n+'/7 dipilih';
   ov.querySelector('#cp-ttebox').open=!!inc.tte;
   if(isInline){
    const fmt=ov.querySelector('[data-cp-output].on')?.dataset.cpOutput||'docx';
    const slidesPanel=ov.querySelector('.cp-inline-slides');
    const slideBox=ov.querySelector('.cp-inline-slidebox');
    const exportButton=ov.querySelector('[data-cp-inline-export]');
    exportButton.textContent='↓ Unduh';
    exportButton.disabled=!n;
    slidesPanel.hidden=fmt!=='pptx';frame.hidden=fmt==='pptx';
    ov.querySelector('.cp-preview-h b').textContent='Pratinjau '+(fmt==='docx'?'Word':fmt==='pdf'?'PDF':'PowerPoint');
    if(fmt==='pptx'){
     slides=n&&window.cpInlinePptxSlides?window.cpInlinePptxSlides(c,inc):[];
     slideIndex=Math.max(0,Math.min(slideIndex,slides.length-1));
     const slide=slides[slideIndex];
     slideBox.innerHTML=slide?'<div class="dk-scale">'+dkHtml(slide)+'</div>':'<p>Pilih minimal satu substansi untuk menampilkan slide.</p>';
     const scale=Math.min(1,Math.max(.15,(slideBox.clientWidth||640)/1280));
     slideBox.style.height=(720*scale)+'px';
     const inner=slideBox.querySelector('.dk-scale');if(inner)inner.style.transform='scale('+scale+')';
     ov.querySelector('[data-cp-slide-count]').textContent='Slide '+(slides.length?slideIndex+1:0)+' / '+slides.length;
     ov.querySelector('[data-cp-prev]').disabled=slideIndex<=0;
     ov.querySelector('[data-cp-next]').disabled=slideIndex>=slides.length-1;
    }
   }
   const view=ov.querySelector('[data-doc-actual="project"]');
   if(view){
    view.hidden=true;
    const fmt=isInline?(ov.querySelector('[data-cp-output].on')?.dataset.cpOutput||'docx'):'docx';
    if(fmt==='docx'&&window.MT_PS_DOC?.showActualDocumentPreview){
     window.MT_PS_DOC.showActualDocumentPreview(ov,model,'word').then(ok=>{
      if(!view.isConnected)return;
      if(isInline&&(ov.querySelector('[data-cp-output].on')?.dataset.cpOutput||'docx')!=='docx')return;
      view.hidden=!ok;frame.hidden=!!ok;
     }).catch(()=>{if(view.isConnected){view.hidden=true;frame.hidden=false}});
    }
   }
  }catch(e){status.textContent='Gagal menyusun pratinjau';toast('Gagal membuat dokumen: '+e.message)}
 };
 ov.querySelectorAll('[data-cp-inc]').forEach(input=>input.addEventListener('change',()=>{inc[input.dataset.cpInc]=input.checked?1:0;persist();update()}));
 ov.querySelectorAll('[data-cp-all]').forEach(button=>button.addEventListener('click',()=>{for(const [k] of CPLAN_KEYS)inc[k]=+button.dataset.cpAll;ov.querySelectorAll('[data-cp-inc]').forEach(input=>input.checked=!!inc[input.dataset.cpInc]);persist();update()}));
 ov.querySelector('#cp-sign-pick').addEventListener('change',e=>{const chosen=e.target.value===''?null:signers[+e.target.value];if(!chosen)return;sg.name=chosen.name;if(chosen.title)sg.title=chosen.title;ov.querySelectorAll('[data-cp-sign]').forEach(input=>{input.value=sg[input.dataset.cpSign]||''});persist();update()});
 ov.querySelectorAll('[data-cp-sign]').forEach(input=>input.addEventListener('change',()=>{sg[input.dataset.cpSign]=input.value.trim();persist();update()}));
 ov.querySelector('#cp-no').addEventListener('change',()=>{persist();update()});
 if(isInline){
  ov.querySelectorAll('[data-cp-output]').forEach(button=>button.addEventListener('click',()=>{
   ov.querySelectorAll('[data-cp-output]').forEach(b=>{const on=b===button;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
   slideIndex=0;update();
  }));
  ov.querySelector('[data-cp-inline-export]').addEventListener('click',()=>doExport(ov.querySelector('[data-cp-output].on')?.dataset.cpOutput||'docx',ov));
  ov.querySelector('[data-cp-inline-close]').addEventListener('click',()=>{S.ui.cht='ch';save();render()});
  ov.querySelector('[data-cp-prev]').addEventListener('click',()=>{slideIndex--;update()});
  ov.querySelector('[data-cp-next]').addEventListener('click',()=>{slideIndex++;update()});
  ov.addEventListener('click',ev=>{if(ev.target.closest('[data-doc-signed-kind]'))Version?.processSigned(ev);if(ev.target.closest('[data-doc-proof-open]'))Version?.openSignedProof(ev)});
 }
 update();
 if(el.dataset.format&&el.dataset.format!=='preview'){status.title='Format dipilih: '+el.dataset.format.toUpperCase()+' — periksa isi lalu klik tombol unduh di bagian bawah.'}
};
window.cpInitInline=id=>{const x=document.getElementById('cp-doc-inline');if(x&&x.dataset.cpCharter===String(id))ACT.cpReport({dataset:{id:String(id),inline:'1'}})};
if(typeof VIEW!=='undefined'&&VIEW==='pmo-charter'&&typeof ME!=='undefined'&&ME)render();
})();