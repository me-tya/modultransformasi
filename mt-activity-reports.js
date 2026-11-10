/* Modul Transformasi — laporan Aktivitas mengikuti workflow DashboardCM (LKG, LMV, LKP). */
(function(){
'use strict';
const prefix='mt-arl',LBL={single:'Generate Laporan Kegiatan',filtered:'Generate Laporan Monitoring & Evaluasi',compiled:'Kompilasi Laporan'};
const INC=[['summary','Ringkasan eksekutif'],['charts','Grafik & statistik'],['docs','Kelengkapan dokumen'],['list','Daftar kegiatan'],['gallery','Dokumentasi foto'],['analysis','Analisis kendala & tindak lanjut']];
const PART=[['overview','Overview Dashboard'],['monev','Monitoring dan Evaluasi Agenda'],['calendar','Kalender Kegiatan'],['status','Status Kegiatan (Workboard)'],['matrix','Matriks Kategori, Program, dan Unit']];
function E(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function A(v){return Array.isArray(v)?v:[]}
function X(v){return String(v==null?'':v).trim()}
function dt(v){if(!v)return '-';const d=new Date(v+'T00:00:00');return isNaN(d)?String(v):new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(d)}
function strip(v){return X(v).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
function fmt(n){return Number(n||0).toLocaleString('id-ID')}
function docs(x){const fields=[['und','Undangan'],['st','Surat Tugas'],['materi','Materi'],['notula','Notula'],['dok','Dokumentasi'],['hadir','Daftar Hadir'],['notulaTte','Notula TTE']];
 return fields.map(([k,label])=>({k,label,ok:(attNorm(x[k]).items||[]).length>0||k==='notula'&&!!strip(x.notulaTeks)}));}
function pct(n,d){return d?Math.round(n/d*100):0}
function present(items){const date=A(items).map(x=>x.tgl).filter(Boolean).sort(),earliest=date[0]||'',last=A(items).map(x=>x.tglSelesai||x.tgl).filter(Boolean).sort().at(-1)||'';
 return earliest?dt(earliest)+(earliest!==last?' – '+dt(last):''):'Semua periode';}
function filtered(){
 const all=actRows(),u=S.ui||{},tw=+u.oneTw||0,kat=u.actKat||'',sf=u.actSt||'',pf=u.actPic||'',q=X(u.actQ).toLowerCase();
 return all.filter(x=>(!u.actTahun||String(x.tahun)===String(u.actTahun))&&(!tw||oneTwOf(x)===tw)&&(!kat||actKatOf(x)===kat)&&(!sf||actSt(x)[0].split(' · ')[0]===sf)&&(!pf||A(x.pic).includes(pf))&&(!u.actProg||x.program===u.actProg)&&(!u.actUnit||x.unitP===u.actUnit)&&(!u.actLay||x.layanan===u.actLay)&&(!u.actFrom||(x.tglSelesai||x.tgl||'')>=u.actFrom)&&(!u.actTo||(x.tgl||'9999')<=u.actTo)&&(!q||[actName(x),x.program,x.tema,x.uic,x.kat,x.unitP,A(x.pic).join(' '),x.lokasi,x.link,x.tujuan,x.narsum,x.peserta,x.ringkas,x.tl,x.undStatus,strip(x.notulaTeks)].join(' ').toLowerCase().includes(q)));
}
function scope(items){const u=S.ui||{},filters=[['Tahun',u.actTahun],['Triwulan',u.oneTw?('TW '+u.oneTw):''],['Kategori',u.actKat],['Program',u.actProg],['Unit',u.actUnit],['Layanan',u.actLay],['Status',u.actSt],['PIC',u.actPic],['Mulai',u.actFrom],['Selesai',u.actTo],['Pencarian',u.actQ]].filter(a=>a[1]);
 return 'Periode: '+present(items)+(filters.length?' • '+filters.map(x=>x[0]+': '+x[1]).join(' • '):'');}
function stats(items){
 const by={status:{},kategori:{},unit:{},program:{},bulan:{}};let done=0,docSum=0;
 items.forEach(x=>{const st=actSt(x)[0].split(' · ')[0];if(st==='Selesai')done++;
  for(const [k,v] of [['status',st],['kategori',actKatOf(x)],['unit',x.unitP],['program',x.program],['bulan',X(x.tgl).slice(0,7)]]){const t=v||'Belum ditentukan';by[k][t]=(by[k][t]||0)+1}
  docSum+=docs(x).filter(i=>i.ok).length});
 return {n:items.length,done,pct:pct(done,items.length),docPct:pct(docSum,items.length*7),by};
}
function top(obj){return Object.entries(obj||{}).sort((a,b)=>b[1]-a[1]).slice(0,10)}

/* Memakai AI Worker yang sama dengan DashboardCM, hanya saat checkbox dipilih. */
function aiWorker(){try{return X(localStorage.getItem('cm_ai_worker_url_v1')||'https://cm-assistant.ristya-onlineshop.workers.dev')}catch(e){return ''}}
function aiAvailable(){return /^https:\/\//i.test(aiWorker())}
async function aiAnalysis(items,mode,lang){
 if(!aiAvailable())throw Error('AI Worker belum dikonfigurasi di DashboardCM.');
 const rows=items.slice(0,60).map(x=>({nama:actName(x),tgl:x.tgl,unit:x.unitP,program:x.program,status:actSt(x)[0],tujuan:x.tujuan,hasil:x.ringkas,tindakLanjut:x.tl,catatan:strip(x.notulaTeks||x.catatan)}));
 const prompt=lang==='en'?'Analyze the following activity data. Use headings: Key Achievements, Issues Identified, Follow-up Actions, Recommendations. Use facts only.':'Analisis data kegiatan berikut dalam Bahasa Indonesia formal. Gunakan subjudul: Capaian Utama, Identifikasi Kendala, Tindak Lanjut, Rekomendasi. Berikan analisis ringkas berbasis data, jangan mengarang fakta, tanggal, atau angka. Pusmantap adalah pendamping manajemen perubahan.';
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),45000);
 try{
  const response=await fetch(aiWorker(),{method:'POST',headers:{'Content-Type':'application/json'},signal:ctrl.signal,
   body:JSON.stringify({question:prompt,history:[],conversationScope:{dateFrom:S.ui.actFrom||'',dateTo:S.ui.actTo||'',activityIds:items.slice(0,60).map(x=>x.id)},routeHint:'activity',locale:lang,currentTab:'table',context:('REPORT DATA\n'+JSON.stringify(rows)).slice(0,14000),responseStyle:'Formal report analysis with grounded, short paragraphs.',privateContext:false,clientVersion:'MT-20261110'})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.error||data.message||('HTTP '+response.status));
  if(!X(data.answer))throw Error('AI Worker tidak mengembalikan hasil.');
  return X(data.answer).slice(0,12000);
 }finally{clearTimeout(timer)}
}
function settings(){try{return JSON.parse(localStorage.getItem('mt-activity-report-settings')||'{}')}catch(e){return {}}}
function signer(){const p=settings().tte||{};return {date:p.date||new Date().toISOString().slice(0,10),city:p.city||'Jakarta',label:p.label||'Mengetahui,',title:p.title||'Ketua Tim Pengelolaan Manajemen Perubahan',name:p.name||''}}
function saveReportPrefs(options){try{localStorage.setItem('mt-activity-report-settings',JSON.stringify(options))}catch(e){}}

function mtArFeedbackCount(items){return items.reduce((n,x)=>n+(Array.isArray(x.reportFeedback)?x.reportFeedback.length:0),0)}
function mtArFeedbackOpen(items){
 const root=document.createElement('div');root.className='mt-ar-overlay';
 const all=items.flatMap(x=>(Array.isArray(x.reportFeedback)?x.reportFeedback:[]).map(f=>({item:x,t:f.text,at:f.at,by:f.by}))).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
 const cards=all.length?all.slice(0,75).map(f=>'<article><strong>'+E(actName(f.item))+'</strong><p>'+E(f.t)+'</p><small>'+E(f.at||'')+' · '+E(f.by||'')+'</small></article>').join(''):'<p>Belum ada feedback internal.</p>';
 root.innerHTML='<div class="mt-ar-modal mt-ar-feedback-modal" role="dialog" aria-modal="true"><header><div><h2>Feedback Internal</h2><p>Catatan untuk tim pengelola, tidak masuk ke laporan.</p></div><button data-fbclose title="Tutup">×</button></header><div class="mt-ar-body"><div class="mt-ar-feedback-list">'+cards+'</div><label class="mt-ar-feedback-field">Kegiatan<select data-fbitem>'+items.map(x=>'<option value="'+E(x.id)+'">'+E(actName(x).slice(0,110))+'</option>').join('')+'</select></label><label class="mt-ar-feedback-field">Umpan balik / tindak lanjut<textarea rows="4" data-fbtext placeholder="Tuliskan feedback untuk kegiatan terpilih..."></textarea></label></div><footer><button data-fbclose>Batal</button><button class="mt-ar-gold" data-fbsave>Simpan Feedback</button></footer></div>';
 document.body.appendChild(root);
 root.addEventListener('click',e=>{if(e.target===root||e.target.closest('[data-fbclose]'))root.remove()});
 root.querySelector('[data-fbsave]').onclick=()=>{
  const x=items.find(z=>String(z.id)===root.querySelector('[data-fbitem]').value),val=X(root.querySelector('[data-fbtext]').value);
  if(!x||!val){toast('Pilih kegiatan dan isi feedback.');return}
  if(!actCanEdit()){toast('Tidak memiliki izin mengubah feedback.');return}
  if(!Array.isArray(x.reportFeedback))x.reportFeedback=[];
  x.reportFeedback.unshift({at:new Date().toISOString().slice(0,16).replace('T',' '),by:(ME&&ME.nama)||'',text:val});
  save();root.remove();
  document.querySelectorAll('.mt-ar-feedback-btn span').forEach(el=>el.textContent=String(mtArFeedbackCount(items)));
  toast('Feedback berhasil disimpan untuk kegiatan.');
 };
}
function tteForm(){const t=signer();const f=(k,l,ph='')=>'<label>'+l+'<input data-rpttte="'+k+'" '+(k==='date'?'type="date"':'type="text"')+' value="'+E(t[k])+'" placeholder="'+E(ph)+'"></label>';
 return '<section class="mt-ar-tte"><b>✍ Tanda tangan elektronik (TTE)</b><div class="mt-ar-ttegrid">'+f('date','Tanggal tanda tangan')+f('city','Kota (opsional)','Jakarta')+f('label','Keterangan di atas jabatan (opsional)','Mengetahui,')+f('title','Jabatan','[Jabatan]')+f('name','Nama pejabat','[Nama Pejabat]')+'</div></section>';}
function readTte(root){const o={};root.querySelectorAll('[data-rpttte]').forEach(x=>o[x.dataset.rpttte]=X(x.value));return o}
function title(mode,items,lang){const type=mode==='single'?'Laporan Kegiatan':mode==='compiled'?'Kompilasi Laporan':'Laporan Monitoring dan Evaluasi';
 const u=S.ui||{},subject=[u.actProg,u.actUnit].filter(Boolean).join(' / ');return type+(items.length===1&&mode==='single'?' — '+actName(items[0]):' '+(u.actTahun||'')+(u.oneTw?' TW '+u.oneTw:'')+' — '+(subject||present(items)));}
function form(mode,items,go){
 const opts=settings(),host=document.createElement('div');host.className='mt-ar-overlay';host.setAttribute('role','presentation');
 const checks=(arr,cls)=>'<div class="mt-ar-checks '+cls+'">'+arr.map(([k,l])=>'<label><input type="checkbox" data-rptinc="'+k+'" '+((opts[mode]||{})[k]!==false?'checked':'')+'> '+E(l)+'</label>').join('')+'</div>';
 let inner='';
 if(mode==='filtered')inner='<div class="mt-ar-banner"><small>JUDUL LAPORAN (OTOMATIS DARI FILTER)</small><b>'+E(title(mode,items,'id'))+'</b><em>Rentang bulanan atau triwulanan dan pilihan Program/Unit mengikuti filter aktif.</em></div><b>Sertakan</b>'+checks(INC,'mt-ar-two');
 if(mode==='compiled')inner='<b>Laporan yang dihimpun</b>'+checks(PART,'mt-ar-two')+'<p>Setiap bagian memakai filter aktif yang sama. Bagian kalender mengikuti tanggal kegiatan pada periode tersebut.</p>';
 if(mode==='single')inner='';
 inner+='<label class="mt-ar-ai"><input type="checkbox" data-rptai '+(aiAvailable()?'':'disabled')+' '+(opts.ai&&aiAvailable()?'checked':'')+'><span><b>✦ Analisis berbasis AI</b><small>'+(aiAvailable()?'Menggunakan AI Worker DashboardCM yang dikonfigurasi untuk menganalisis capaian, kendala, tindak lanjut dan rekomendasi. Data aktivitas terpilih dikirim ke Worker hanya jika dicentang.':'Konfigurasi AI Worker belum tersedia; laporan biasa tetap dapat dibuat.')+'</small></span></label>'+tteForm()+'<label class="mt-ar-language">Bahasa<select data-rptlang><option value="id">Bahasa Indonesia</option><option value="en">English</option></select></label>';
 host.innerHTML='<div class="mt-ar-modal" role="dialog" aria-modal="true" aria-label="'+E(LBL[mode])+'"><header><div><h2>'+E(LBL[mode])+'</h2><p>'+E(mode==='single'?actName(items[0])+' · '+dt(items[0].tgl):fmt(items.length)+' kegiatan sesuai filter aktif')+'</p>'+(mode==='single'?'':'<p><b>Cakupan laporan:</b> '+E(scope(items))+'</p>')+'</div><button data-rptclose title="Tutup" aria-label="Tutup">×</button></header><div class="mt-ar-body">'+inner+'</div><footer>'+(mode==='filtered'?'<button type="button" class="mt-ar-feedback-btn" data-rptfb>▤ Feedback <span>'+mtArFeedbackCount(items)+'</span></button>':'')+'<button type="button" data-rptclose>Batal</button><button type="button" class="mt-ar-gold" data-rptgo>Preview Laporan</button></footer></div>';
 document.body.appendChild(host);
 host.addEventListener('click',e=>{if(e.target===host||e.target.closest('[data-rptclose]'))host.remove();});
 if(host.querySelector('[data-rptfb]'))host.querySelector('[data-rptfb]').onclick=()=>mtArFeedbackOpen(items);
 host.querySelector('[data-rptgo]').onclick=async()=>{
  const inc={};host.querySelectorAll('[data-rptinc]').forEach(e=>inc[e.dataset.rptinc]=e.checked);
  if(mode!=='single'&&!Object.values(inc).some(Boolean)){toast('Pilih sekurangnya satu bagian laporan.');return}
  const tte=readTte(host),lang=host.querySelector('[data-rptlang]').value,ai=!!host.querySelector('[data-rptai]')?.checked;
  const btn=host.querySelector('[data-rptgo]');btn.disabled=true;btn.textContent=ai?'Menganalisis data…':'Menyusun pratinjau…';
  let aiText='';
  if(ai){try{aiText=await aiAnalysis(items,mode,lang)}catch(err){toast('Analisis AI tidak dapat dibuat: '+(err.message||err)+'. Laporan tetap dibuat tanpa AI.')}}
  saveReportPrefs(Object.assign({},opts,{tte,[mode]:inc,lang,ai}));host.remove();preview(mode,items,{inc,tte,lang,aiText},go);
 };
 const sel=host.querySelector('[data-rptlang]');sel.value=opts.lang||'id';return host;
}

function mtArGallery(items){
 const cards=[];
 for(const x of items){const files=attNorm(x.dok).items||[];
  files.forEach((f,i)=>{
   const isImg=/\.(?:png|jpe?g|webp|gif)$/i.test(f.nama||'')||/^image\//.test(f.type||'');
   if(f.t==='f'&&isImg)cards.push('<figure><img data-rptimg="'+E(x.id)+'" data-rptfi="'+i+'" alt="'+E(f.nama||'Foto')+'"><figcaption><b>'+E(actName(x))+'</b><small>'+E(f.nama||'Foto')+'</small></figcaption></figure>');
   else if(f.t==='l')cards.push('<figure class="mt-ar-gallery-link"><b>'+E(actName(x))+'</b><a href="'+E(f.link)+'" target="_blank" rel="noopener">Buka dokumentasi eksternal</a></figure>');
  });
 }
 return cards.length?'<div class="mt-ar-gallery">'+cards.slice(0,60).join('')+'</div>':'<p>Belum ada dokumentasi foto.</p>';
}
function mtArLoadGallery(root,items){
 root.querySelectorAll('img[data-rptimg]').forEach(img=>{
  const x=items.find(v=>String(v.id)===img.dataset.rptimg),m=x&&attNorm(x.dok).items[Number(img.dataset.rptfi)];
  if(!m||m.t!=='f')return;
  fileLoad(m).then(blob=>{if(!img.isConnected)return;const u=URL.createObjectURL(blob);img.onload=()=>URL.revokeObjectURL(u);img.onerror=()=>URL.revokeObjectURL(u);img.src=u}).catch(()=>{img.alt='Foto tidak tersedia'});
 });
}
function card(label,n,sub){return '<div class="mt-ar-kpi"><small>'+E(label)+'</small><b>'+E(n)+'</b><span>'+E(sub||'')+'</span></div>';}
function table(head,rows){return '<table class="mt-ar-table"><thead><tr>'+head.map(h=>'<th>'+E(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+E(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';}
function chapter(t,body){return '<section class="mt-ar-chapter"><h3>'+E(t)+'</h3>'+body+'</section>';}
function bars(obj){const ranks=top(obj),max=ranks.reduce((n,r)=>Math.max(n,r[1]),0)||1;return '<div class="mt-ar-bars">'+ranks.map(([k,n])=>'<div class="mt-ar-bar"><span>'+E(k)+'</span><div><i style="width:'+Math.round(n/max*100)+'%"></i></div><b>'+fmt(n)+'</b></div>').join('')+'</div>';}
function render(mode,items,opt){
 const st=stats(items),sections=[],sub=opt.lang==='en'?'Activity Report':'Laporan Aktivitas';
 if(mode==='single'){const x=items[0],dc=docs(x);
  sections.push(chapter('Ringkasan Kegiatan','<div class="mt-ar-kpis">'+card('Tanggal',dt(x.tgl))+card('Status',actSt(x)[0])+card('Durasi',(x.tglSelesai&&x.tgl!==x.tglSelesai)?'Lintas hari':'1 hari')+card('Kelengkapan',pct(dc.filter(x=>x.ok).length,dc.length)+'%')+'</div>'));
  sections.push(chapter('Identitas Kegiatan',table(['Informasi','Keterangan'],[['Nama',actName(x)],['Kategori',actKatOf(x)],['Unit',x.unitP||'-'],['Program',x.program||'-'],['Metode',x.mode||'-'],['Waktu',x.jam||'-'],['Lokasi',x.lokasi||x.link||'-'],['PIC',A(x.pic).join(', ')||'-'],['Narasumber',x.narsum||'-'],['Peserta',x.peserta||'-']])));
  sections.push(chapter('Tujuan, Hasil & Tindak Lanjut','<h4>Tujuan</h4><p>'+E(x.tujuan||'-')+'</p><h4>Hasil</h4><p>'+E(x.ringkas||'-')+'</p><h4>Tindak lanjut</h4><p class="mt-ar-preserve">'+E(x.tl||'-')+'</p>'));
  sections.push(chapter('Pembahasan dan Catatan','<p class="mt-ar-preserve">'+E(strip(x.notulaTeks)||x.catatan||'-')+'</p>'));
  sections.push(chapter('Kelengkapan Dokumen',table(['Dokumen','Status'],dc.map(a=>[a.label,a.ok?'Ada':'Belum ada']))));
 }else{
  if(mode==='filtered'&&opt.inc.summary!==false||mode==='compiled'&&opt.inc.overview!==false)sections.push(chapter('Ringkasan Eksekutif','<div class="mt-ar-kpis">'+card('Jumlah kegiatan',fmt(st.n))+card('Selesai',fmt(st.done))+card('Capaian penyelesaian',st.pct+'%')+card('Kelengkapan dokumen',st.docPct+'%')+'</div><p>Dihitung dari '+fmt(st.n)+' aktivitas sesuai filter. '+fmt(st.done)+' selesai; '+fmt(st.n-st.done)+' belum berstatus selesai.</p>'));
  if(mode==='filtered'&&opt.inc.charts!==false||mode==='compiled'&&opt.inc.monev!==false)sections.push(chapter('Grafik & Statistik','<h4>Distribusi status</h4>'+bars(st.by.status)+'<h4>Aktivitas per bulan</h4>'+bars(st.by.bulan)));
  if(mode==='filtered'&&opt.inc.docs!==false)sections.push(chapter('Kelengkapan Dokumen','<p>Rata-rata kelengkapan '+st.docPct+'% dari tujuh kelompok dokumen.</p>'+table(['Dokumen','Terisi'],[['Undangan','und'],['Surat Tugas','st'],['Materi','materi'],['Notula','notula'],['Dokumentasi','dok'],['Daftar Hadir','hadir'],['Notula TTE','notulaTte']].map(([l,k])=>[l,items.filter(x=>docs(x).find(a=>a.k===k)?.ok).length+' / '+items.length]))));
  if(mode==='filtered'&&opt.inc.list!==false||mode==='compiled'&&opt.inc.calendar!==false)sections.push(chapter('Daftar Kegiatan',table(['Tanggal','Kegiatan','Unit','Status'],items.map(x=>[dt(x.tgl),actName(x),x.unitP||'-',actSt(x)[0]]))));
  if(mode==='filtered'&&opt.inc.gallery!==false)sections.push(chapter('Dokumentasi Foto',mtArGallery(items)));
  if(mode==='filtered'&&opt.inc.analysis!==false||mode==='compiled'&&opt.inc.monev!==false)sections.push(chapter('Kendala & Tindak Lanjut',table(['Kegiatan','Catatan / kendala','Tindak lanjut'],items.filter(x=>X(x.tl)||X(x.catatan)).map(x=>[actName(x),strip(x.catatan)||'-',x.tl||'-']))));
  if(mode==='compiled'&&opt.inc.status!==false)sections.push(chapter('Status Kegiatan (Workboard)',bars(st.by.status)));
  if(mode==='compiled'&&opt.inc.matrix!==false)sections.push(chapter('Matriks Kategori, Program & Unit','<h4>Kategori</h4>'+bars(st.by.kategori)+'<h4>Program</h4>'+bars(st.by.program)+'<h4>Unit</h4>'+bars(st.by.unit)));
 }
 if(opt.aiText)sections.push(chapter('Analisis Berbasis AI','<p class="mt-ar-preserve">'+E(opt.aiText)+'</p>'));
 const signature='<section class="mt-ar-sign"><p>'+E(opt.tte.city||'Jakarta')+', '+E(dt(opt.tte.date))+'</p><p>'+E(opt.tte.label||'')+'</p><p>'+E(opt.tte.title||'')+'</p><div class="mt-ar-signspace"></div><b>'+E(opt.tte.name||'[Nama pejabat]')+'</b><small>Ditandatangani secara elektronik</small></section>';
 return '<article class="mt-ar-paper"><div class="mt-ar-kop"><b>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</b><span>BADAN TEKNOLOGI, INFORMASI, DAN INTELIJEN KEUANGAN</span><span>PUSAT MANAJEMEN TRANSFORMASI DAN PERUBAHAN</span></div><h1>'+E(title(mode,items,opt.lang))+'</h1><p class="mt-ar-sub">'+E(sub)+' · '+fmt(items.length)+' kegiatan · '+E(scope(items))+'</p>'+sections.join('')+signature+'</article>';
}
async function word(mode,items,opt){
 await docZip();
 const W=467.8,heading=(t)=>dxP(dxR(t,{b:true,sz:12,col:'12275A'}),{before:11,after:5,line:15,keep:true});
 const pp=(t)=>dxP(dxR(String(t||'-'),{sz:10.5}),{line:15,after:3});
 const row=(a,b)=>dxTbl([125,W-125],[dxCell(125,pp(a))+dxCell(W-125,pp(b))],{grid:true});
 let body=dxKop(W)+dxP('',{line:6})+dxP(dxR(title(mode,items,opt.lang),{b:true,sz:14}),{jc:'center',line:18,after:8});
 body+=heading('Cakupan laporan')+pp(scope(items));
 const st=stats(items);
 if(mode==='single'){
  const x=items[0];body+=heading('Profil Kegiatan');
  for(const [l,v] of [['Kegiatan',actName(x)],['Tanggal',dt(x.tgl)],['Jam',x.jam],['Unit',x.unitP],['Program',x.program],['PIC',A(x.pic).join(', ')],['Metode',x.mode],['Lokasi',x.lokasi||x.link],['Status',actSt(x)[0]]])body+=row(l,v||'-');
  for(const [l,v] of [['Tujuan',x.tujuan],['Ringkasan Hasil',x.ringkas],['Tindak Lanjut',x.tl],['Catatan dan Pembahasan',strip(x.notulaTeks)||x.catatan]])body+=heading(l)+pp(v||'-');
  body+=heading('Kelengkapan Dokumen');docs(x).forEach(a=>body+=row(a.label,a.ok?'Ada':'Belum ada'));
 }else{
  body+=heading('Ringkasan Eksekutif')+pp('Total '+st.n+' kegiatan; '+st.done+' berstatus selesai ('+st.pct+'%); kelengkapan dokumen '+st.docPct+'%.');
  if((mode==='filtered'&&opt.inc.charts!==false)||(mode==='compiled'&&opt.inc.monev!==false)){body+=heading('Distribusi Status');for(const [l,v] of top(st.by.status))body+=row(l,String(v));}
  if(mode==='filtered'&&opt.inc.docs!==false){body+=heading('Kelengkapan Dokumen');for(const label of ['Undangan','Surat Tugas','Materi','Notula','Dokumentasi','Daftar Hadir','Notula TTE'])body+=row(label,String(items.filter(x=>docs(x).some(d=>d.label===label&&d.ok)).length)+' / '+items.length);}
  if(mode==='filtered'&&opt.inc.list!==false||mode==='compiled'&&opt.inc.calendar!==false){body+=heading('Daftar Kegiatan');for(const x of items)body+=pp(dt(x.tgl)+' — '+actName(x)+' — '+actSt(x)[0]);}
  if(mode==='filtered'&&opt.inc.gallery!==false){body+=heading('Dokumentasi Foto');for(const x of items.filter(x=>attNorm(x.dok).items.length))body+=pp(actName(x)+': '+attNorm(x.dok).items.map(i=>i.nama||i.link||'Lampiran').join('; '));}
  if(mode==='filtered'&&opt.inc.analysis!==false||mode==='compiled'&&opt.inc.monev!==false){body+=heading('Catatan dan Tindak Lanjut');for(const x of items.filter(x=>x.tl||x.catatan))body+=pp(actName(x)+': '+(x.tl||x.catatan));}
  if(mode==='compiled'&&opt.inc.status!==false){body+=heading('Status Kegiatan');for(const [l,v] of top(st.by.status))body+=row(l,String(v));}
  if(mode==='compiled'&&opt.inc.matrix!==false)for(const [k,l] of [['kategori','Kategori'],['program','Program'],['unit','Unit']]){body+=heading('Matriks '+l);for(const [name,n] of top(st.by[k]))body+=row(name,String(n));}
 }
 if(opt.aiText)body+=heading('Analisis Berbasis AI')+pp(opt.aiText);
 body+=heading((opt.tte.city||'Jakarta')+', '+dt(opt.tte.date))+pp(opt.tte.label||'')+pp(opt.tte.title||'')+dxP('',{before:38})+pp(opt.tte.name||'[Nama pejabat]')+pp('Ditandatangani secara elektronik');
 return dxPack(body);
}
function preview(mode,items,opt,go){
 const h=document.createElement('div');h.className='mt-ar-overlay';h.innerHTML='<div class="mt-ar-modal preview" role="dialog" aria-modal="true"><header><div><h2>Preview '+E(mode==='single'?'Laporan Kegiatan':mode==='compiled'?'Kompilasi Laporan':'Laporan Monitoring & Evaluasi')+'</h2><p>'+fmt(items.length)+' kegiatan sesuai cakupan</p></div><button title="Tutup" data-close>×</button></header><div class="mt-ar-previewbody">'+render(mode,items,opt)+'</div><footer><button type="button" data-back>Kembali</button><button type="button" data-print>Cetak / Simpan PDF</button><button type="button" class="mt-ar-gold" data-word>⬇ Unduh Word</button></footer></div>';
 document.body.appendChild(h);mtArLoadGallery(h,items);
 h.addEventListener('click',e=>{if(e.target===h||e.target.closest('[data-close]'))h.remove()});
 h.querySelector('[data-back]').onclick=()=>{h.remove();form(mode,items,go)};
 h.querySelector('[data-print]').onclick=()=>{const area=h.querySelector('.mt-ar-paper'),w=window.open('','_blank');if(!w){toast('Izinkan pop-up untuk pratinjau cetak.');return}w.document.write('<!doctype html><html><head><title>'+E(title(mode,items,opt.lang))+'</title><style>body{font:11pt Arial;color:#12275A;margin:16mm}h1{font-size:17pt}h3{font-size:13pt;margin-top:22px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bcc6d7;padding:5px}.mt-ar-kpis{display:flex;gap:18px}.mt-ar-kpi{display:grid}.mt-ar-bars{display:none}.mt-ar-sign{margin-top:40px;text-align:right}.mt-ar-signspace{height:50px}</style></head><body>'+area.innerHTML+'</body></html>');w.document.close();w.focus();w.print()};
 h.querySelector('[data-word]').onclick=async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Menyusun Word…';try{const doc=await word(mode,items,opt);const file=title(mode,items,opt.lang).replace(/[\\/:*?"<>|]+/g,'_').slice(0,90)+'.docx';mtRptDownloadBlob(doc,file);toast('Dokumen Word berhasil dibuat.')}catch(err){toast('Gagal membuat Word: '+(err.message||err))}finally{b.disabled=false;b.textContent='⬇ Unduh Word'}};
}
function open(mode,item){try{const items=mode==='single'?[item]:filtered();if(!items.length){toast('Belum ada aktivitas sesuai filter untuk dibuatkan laporan.');return}form(mode,items)}catch(e){toast('Gagal membuka laporan: '+(e.message||e))}}
ACT.oneReport=el=>{const x=(S.oneonone||[]).find(y=>String(y.id)===String(el.dataset.id));if(x)open('single',x)};
ACT.oneReportFilter=()=>open('filtered');
ACT.oneReportCompile=()=>open('compiled');
window.mtActivityReports={open,filtered};
})();
