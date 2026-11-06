/* CRA native module for Modul Transformasi — no iframe, isolated storage in modMeta. */
(function(){
'use strict';
const KEY='__CRA_NATIVE__';
const ROLES=['Sponsor','Pemilik Proses Bisnis','PMO','CMO','Pengguna'];
const QUESTIONS=[
 {id:'q1',dimension:'Awareness',text:'Saya memahami tujuan dan manfaat perubahan yang akan dilaksanakan.',critical:true},
 {id:'q2',dimension:'Desire',text:'Saya mendukung perubahan dan bersedia berpartisipasi dalam implementasinya.',critical:false},
 {id:'q3',dimension:'Knowledge',text:'Saya memahami proses bisnis dan cara kerja baru yang akan diterapkan.',critical:true},
 {id:'q4',dimension:'Ability',text:'Saya memiliki keterampilan dan dukungan untuk menggunakan sistem atau proses baru.',critical:true},
 {id:'q5',dimension:'Reinforcement',text:'Tersedia pimpinan, bantuan, dan mekanisme tindak lanjut untuk menjaga keberlanjutan perubahan.',critical:false}
];
let ctx=null, tab='surveys', chosen='', editing='', statusFilter='all';
const e=s=>String(s==null?'':s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const ds=()=>{let m=ctx.S.modMeta;if(!m||typeof m!=='object')ctx.S.modMeta=m={};let v=m[KEY];if(!v||!Array.isArray(v.surveys)||!Array.isArray(v.responses))v=m[KEY]={surveys:[],responses:[],version:1};return v};
const save=()=>{ctx.save(); ctx.toast('Perubahan CRA disimpan.');};
const canEdit=()=>['SA','CMOK','CMOU','TIM'].includes(ctx.ME?.role);
const now=()=>new Date().toISOString();
const uuid=()=> 'cra-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
const pct=x=>Math.round(x*20);
const answersFor=id=>ds().responses.filter(x=>x.surveyId===id);
const stats=id=>{
 const s=ds().surveys.find(x=>x.id===id),r=answersFor(id),items=[];
 if(!s)return {count:0,avg:0,score:0,critical:0,coverage:0,status:'Belum dinilai',items:[]};
 (s.questions||[]).forEach(q=>{const v=r.map(a=>Number(a.answers?.[q.id])).filter(n=>Number.isFinite(n)&&n>=1&&n<=5);items.push({q,avg:v.length?v.reduce((a,b)=>a+b,0)/v.length:0,n:v.length});});
 const values=items.filter(x=>x.n),avg=values.length?values.reduce((a,b)=>a+b.avg,0)/values.length:0;
 const critical=items.filter(x=>x.q.critical&&x.n),crit=critical.length?critical.reduce((a,b)=>a+b.avg,0)/critical.length:0;
 const coverage=s.target?Math.round(100*r.length/s.target):0; const score=pct(avg);
 let status='Belum dinilai';
 if(r.length){status=score>=80&&crit>=4?'Siap':score>=70?'Siap Bersyarat':score>=50?'Perlu Penguatan':'Belum Siap';}
 return {count:r.length,avg,score,critical:crit,coverage,status,items};
};
const label=(n)=> n==='Siap'?'good':n==='Siap Bersyarat'?'info':n==='Perlu Penguatan'?'warn':'bad';
const select=(arr,sel)=>arr.map(x=>'<option value="'+e(x)+'"'+(String(x)===String(sel)?' selected':'')+'>'+e(x)+'</option>').join('');
const chips=(rows)=>rows.map(([k,n])=>'<button type="button" class="cra-tab'+(tab===k?' active':'')+'" data-cra="tab" data-val="'+k+'">'+n+'</button>').join('');
const card=(title,val,sub)=>'<div class="cra-stat"><small>'+e(title)+'</small><strong>'+e(val)+'</strong><span>'+e(sub||'')+'</span></div>';
const surveyList=()=>{
 const d=ds(),all=d.surveys.filter(s=>statusFilter==='all'||s.status===statusFilter),count=d.responses.length;
 return '<div class="cra-kpis">'+card('Total survei',d.surveys.length,'Semua periode')+card('Survei aktif',d.surveys.filter(x=>x.status==='Aktif').length,'Dapat diisi')+card('Total respons',count,'Seluruh asesmen')+card('Proyek dinilai',new Set(d.surveys.map(x=>x.module).filter(Boolean)).size,'Terkait modul CM')+'</div>'+
 '<div class="cra-panel"><div class="cra-toolbar"><h3>Daftar Survei CRA</h3><div class="cra-actions"><select id="cra-status-filter"><option value="all">Semua status</option>'+select(['Draft','Aktif','Ditutup'],statusFilter)+'</select>'+(canEdit()?'<button class="btn pri" data-cra="new">＋ Tambah Survei</button>':'')+'</div></div>'+
 (all.length?'<div class="cra-table-wrap"><table class="cra-table"><thead><tr><th>Nama survei / proyek</th><th>Status</th><th>Respons</th><th>Skor</th><th>Kesiapan</th><th>Aksi</th></tr></thead><tbody>'+all.map(s=>{const t=stats(s.id);return '<tr><td><b>'+e(s.name)+'</b><small>'+e(s.moduleName||s.module||'Belum dikaitkan')+' · '+e(s.year)+'</small></td><td><span class="cra-pill">'+e(s.status)+'</span></td><td>'+t.count+' / '+(s.target||'—')+'</td><td><b>'+ (t.count?t.score+'%':'—') +'</b></td><td><span class="cra-pill '+label(t.status)+'">'+e(t.status)+'</span></td><td><button class="btn" data-cra="open" data-id="'+e(s.id)+'">Detail</button></td></tr>'}).join('')+'</tbody></table></div>':'<div class="cra-empty">Belum ada survei. Buat survei CRA untuk mulai mengukur kesiapan perubahan.</div>')+'</div>';
};
const form=(s)=>{
 const all=ctx.mods(),questions=s?.questions?.length?s.questions:QUESTIONS,edit=!!s;
 return '<div class="cra-panel"><div class="cra-toolbar"><h3>'+(edit?'Ubah Survei':'Buat Survei CRA')+'</h3><button class="btn" data-cra="list">Kembali</button></div>'+
 '<form id="cra-survey-form"><div class="cra-grid"><label>Nama Survei *<input name="name" required maxlength="180" value="'+e(s?.name||'')+'" placeholder="Mis. CRA Implementasi Core APBN"></label><label>Proyek / Modul CM <select name="module"><option value="">Pilih modul</option>'+all.map(m=>'<option value="'+e(m.kode)+'"'+(m.kode===s?.module?' selected':'')+'>'+e(m.kode+' · '+m.nama)+'</option>').join('')+'</select></label><label>Tahun Anggaran <input type="number" name="year" min="2020" max="2040" value="'+e(s?.year||ctx.S.ui.tahun)+'"></label><label>Target respons <input type="number" name="target" min="1" max="100000" value="'+e(s?.target||30)+'"></label><label>Mulai <input type="date" name="start" value="'+e(s?.start||'')+'"></label><label>Tutup <input type="date" name="end" value="'+e(s?.end||'')+'"></label></div><label class="cra-full">Tujuan / Deskripsi <textarea name="description" rows="2">'+e(s?.description||'')+'</textarea></label>'+
 '<h4>Pertanyaan asesmen (skala 1–5)</h4><p class="cra-muted">Pertanyaan dapat disesuaikan. Item kritis harus mencapai rata-rata minimal 4/5 agar berstatus Siap.</p><div id="cra-question-editor">'+questions.map((q,i)=>'<div class="cra-question-edit" data-qid="'+e(q.id)+'"><b>'+(i+1)+'.</b><input aria-label="Dimensi" class="cra-q-dim" value="'+e(q.dimension||'')+'" placeholder="Dimensi"><input aria-label="Pertanyaan" class="cra-q-text" value="'+e(q.text||'')+'" placeholder="Pertanyaan asesmen"><label><input type="checkbox" class="cra-q-critical"'+(q.critical?' checked':'')+'> Kritis</label><button type="button" class="btn" data-cra="remove-question">Hapus</button></div>').join('')+'</div><div class="cra-actions"><button class="btn" type="button" data-cra="add-question">＋ Pertanyaan</button><button class="btn pri" type="submit">Simpan Survei</button></div></form></div>';
};
const detail=(s)=>{
 const t=stats(s.id),r=answersFor(s.id),isManager=canEdit();
 return '<div class="cra-panel"><div class="cra-toolbar"><div><h3>'+e(s.name)+'</h3><p class="cra-muted">'+e(s.moduleName||s.module||'Tanpa modul')+' · '+e(s.year)+' · '+e(s.status)+'</p></div><button class="btn" data-cra="list">Kembali</button></div>'+
 '<p>'+e(s.description||'')+'</p><div class="cra-kpis">'+card('Skor kesiapan',t.count?t.score+'%':'—','Rata-rata jawaban')+card('Klasifikasi',t.status,'Berdasarkan ambang CRA')+card('Respons',t.count,'Target '+s.target)+card('Skor item kritis',t.count?t.critical.toFixed(2)+'/5':'—','Syarat siap: ≥4/5')+'</div>'+
 '<div class="cra-actions">'+(s.status==='Aktif'&&isManager?'<button class="btn pri" data-cra="respond">Isi Asesmen</button>':'')+(isManager?'<button class="btn" data-cra="edit">Ubah</button><button class="btn" data-cra="toggle">'+(s.status==='Aktif'?'Tutup Survei':'Aktifkan Survei')+'</button><button class="btn" data-cra="export">Ekspor CSV</button>':'')+'</div>'+
 '<h4>Hasil per dimensi</h4><div class="cra-table-wrap"><table class="cra-table"><thead><tr><th>Dimensi</th><th>Pertanyaan</th><th>Rata-rata</th><th>Respons</th></tr></thead><tbody>'+t.items.map(i=>'<tr><td>'+e(i.q.dimension)+(i.q.critical?' <span title="Indikator kritis">*</span>':'')+'</td><td>'+e(i.q.text)+'</td><td>'+ (i.n?i.avg.toFixed(2)+' / 5':'—')+'</td><td>'+i.n+'</td></tr>').join('')+'</tbody></table></div>'+
 '<h4>Riwayat respons</h4>'+(r.length?'<div class="cra-table-wrap"><table class="cra-table"><thead><tr><th>Responden</th><th>Peran</th><th>Waktu</th><th>Skor</th></tr></thead><tbody>'+r.map(x=>'<tr><td>'+e(x.name)+'</td><td>'+e(x.role)+'</td><td>'+e(x.created?.slice(0,16).replace('T',' '))+'</td><td>'+e(pct(Object.values(x.answers||{}).map(Number).reduce((a,b)=>a+b,0)/Math.max(1,Object.values(x.answers||{}).length)).toString())+'%</td></tr>').join('')+'</tbody></table></div>':'<p class="cra-muted">Belum ada respons.</p>')+'</div>';
};
const respond=(s)=>'<div class="cra-panel"><div class="cra-toolbar"><h3>Isi Asesmen · '+e(s.name)+'</h3><button class="btn" data-cra="open" data-id="'+e(s.id)+'">Kembali</button></div><form id="cra-response-form"><div class="cra-grid"><label>Nama responden *<input name="name" required maxlength="100" value="'+e(ctx.ME?.nama||'')+'"></label><label>Peran dalam perubahan *<select name="role" required>'+select(ROLES,'Pengguna')+'</select></label></div>'+
 s.questions.map((q,i)=>'<fieldset class="cra-q"><legend>'+(i+1)+'. '+e(q.text)+(q.critical?' <span title="Item kritis">*</span>':'')+'</legend><small>'+e(q.dimension)+'</small><div class="cra-scale">'+[1,2,3,4,5].map(n=>'<label><input type="radio" required name="'+e(q.id)+'" value="'+n+'"><b>'+n+'</b></label>').join('')+'</div><small>1 = Sangat tidak setuju · 5 = Sangat setuju</small></fieldset>').join('')+'<button type="submit" class="btn pri">Kirim Asesmen</button></form></div>';
const make=()=>{
 const d=ds(),s=d.surveys.find(x=>x.id===chosen);
 const title='<div class="vh"><h1>Change Readiness Assessment (CRA)</h1><p class="s">Survei dan analisis kesiapan perubahan per proyek · terintegrasi dengan Modul Transformasi</p></div>';
 const nav='<div class="cra-tabs">'+chips([['surveys','Survei'],['reference','Referensi'],['history','Riwayat']])+'</div>';
 let body='';
 if(tab==='new'||tab==='edit')body=form(tab==='edit'?s:null);
 else if(tab==='detail'&&s)body=detail(s);
 else if(tab==='respond'&&s)body=respond(s);
 else if(tab==='reference')body='<div class="cra-panel"><h3>Kerangka CRA</h3><p>Penilaian menggunakan skala 1–5. Skor keseluruhan = rata-rata penilaian seluruh pertanyaan × 20%. Kesiapan diukur melalui Awareness, Desire, Knowledge, Ability, dan Reinforcement.</p><div class="cra-table-wrap"><table class="cra-table"><thead><tr><th>Skor</th><th>Klasifikasi</th><th>Implikasi</th></tr></thead><tbody><tr><td>≥80%, kritis ≥4</td><td>Siap</td><td>Go-live dengan hypercare standar</td></tr><tr><td>70–79%, atau nilai kritis belum memenuhi syarat siap</td><td>Siap Bersyarat</td><td>Tindak lanjuti area lemah sebelum go-live</td></tr><tr><td>50–69%</td><td>Perlu Penguatan</td><td>Penguatan komunikasi dan pelatihan</td></tr><tr><td>&lt;50%</td><td>Belum Siap</td><td>Pertimbangkan penundaan go-live</td></tr></tbody></table></div><p class="cra-muted">Klasifikasi merupakan acuan internal CRA, bukan keputusan otomatis atas go-live. Keputusan tetap mempertimbangkan risiko operasional dan tata kelola proyek.</p></div>';
 else if(tab==='history')body='<div class="cra-panel"><h3>Riwayat dan Hasil Survei</h3>'+(d.surveys.length?d.surveys.map(x=>{const t=stats(x.id);return '<div class="cra-history"><div><b>'+e(x.name)+'</b><small>'+e(x.status)+' · '+t.count+' respons · '+e(x.year)+'</small></div><div><strong>'+ (t.count?t.score+'%':'—')+'</strong> <button class="btn" data-cra="open" data-id="'+e(x.id)+'">Lihat hasil</button></div></div>'}).join(''):'<p>Belum ada survei.</p>')+'</div>';
 else body=surveyList();
 return title+nav+'<section class="cra-native">'+body+'</section>';
};
function attach(context){ctx=context;render();}
function render(){const v=document.getElementById('view');if(!v)return;v.innerHTML=make();bind(v);}
function bind(v){
 v.querySelectorAll('[data-cra]').forEach(b=>b.addEventListener('click',()=>{
 const a=b.dataset.cra;if(a==='tab'){tab=b.dataset.val;chosen='';}
 if(a==='list'){tab='surveys';chosen='';}
 if(a==='new'){tab='new';chosen='';}
 if(a==='open'){tab='detail';chosen=b.dataset.id;}
 if(a==='edit'){tab='edit';}
 if(a==='respond'){if(!canEdit()){ctx.toast('Akun belum memiliki izin pengisian CRA.');return;}tab='respond';}
 if(a==='toggle'){if(!canEdit())return;const s=ds().surveys.find(x=>x.id===chosen);if(s){s.status=s.status==='Aktif'?'Ditutup':'Aktif';s.updated=now();save();}}
 if(a==='export'){exportCSV(chosen);return;}
 if(a==='add-question'){const box=v.querySelector('#cra-question-editor');const div=document.createElement('div');div.className='cra-question-edit';div.dataset.qid=uuid();div.innerHTML='<b>＋</b><input class="cra-q-dim" placeholder="Dimensi" aria-label="Dimensi"><input class="cra-q-text" placeholder="Pertanyaan asesmen" aria-label="Pertanyaan"><label><input type="checkbox" class="cra-q-critical"> Kritis</label><button type="button" class="btn" data-cra="remove-question">Hapus</button>';box.appendChild(div);div.querySelector('button').onclick=()=>div.remove();return;}
 if(a==='remove-question'){b.closest('.cra-question-edit')?.remove();return;}
 render();
 }));
 const filter=v.querySelector('#cra-status-filter');if(filter){filter.value=statusFilter;filter.onchange=()=>{statusFilter=filter.value;render();};}
 const sf=v.querySelector('#cra-survey-form');if(sf)sf.onsubmit=ev=>{
 ev.preventDefault();if(!canEdit())return;
 const fd=new FormData(sf),name=String(fd.get('name')||'').trim(),questions=[...sf.querySelectorAll('.cra-question-edit')].map((d,i)=>({id:d.dataset.qid||uuid(),dimension:d.querySelector('.cra-q-dim').value.trim()||'Umum',text:d.querySelector('.cra-q-text').value.trim(),critical:d.querySelector('.cra-q-critical').checked})).filter(q=>q.text);
 if(!name||!questions.length){ctx.toast('Nama survei dan minimal satu pertanyaan wajib diisi.');return;}
 const current=ds().surveys.find(x=>x.id===chosen),module=String(fd.get('module')||''),mod=ctx.mods().find(m=>m.kode===module),o=current||{id:uuid(),created:now(),status:'Draft'};
 Object.assign(o,{name,module,moduleName:mod?.nama||'',year:Number(fd.get('year'))||ctx.S.ui.tahun,target:Number(fd.get('target'))||30,start:String(fd.get('start')||''),end:String(fd.get('end')||''),description:String(fd.get('description')||''),questions,updated:now()});
 if(!current)ds().surveys.unshift(o);chosen=o.id;tab='detail';save();render();
 };
 const rf=v.querySelector('#cra-response-form');if(rf)rf.onsubmit=ev=>{
 ev.preventDefault();const s=ds().surveys.find(x=>x.id===chosen);if(!s||s.status!=='Aktif'||!canEdit()){ctx.toast('Survei tidak aktif atau akses tulis tidak tersedia.');return;}
 const fd=new FormData(rf),answers={};for(const q of s.questions){const n=Number(fd.get(q.id));if(!Number.isFinite(n)||n<1||n>5){ctx.toast('Semua pertanyaan wajib dijawab.');return;}answers[q.id]=n;}
 ds().responses.push({id:uuid(),surveyId:s.id,name:String(fd.get('name')||'').trim(),role:String(fd.get('role')||''),email:ctx.ME?.email||'',answers,created:now()});tab='detail';save();render();
 };
}
function exportCSV(id){const s=ds().surveys.find(x=>x.id===id);if(!s)return;const headers=['Nama','Peran','Email','Waktu',...s.questions.map(q=>q.dimension+' — '+q.text)],rows=[headers,...answersFor(id).map(r=>[r.name,r.role,r.email,r.created,...s.questions.map(q=>r.answers?.[q.id]||'')])];const csv='\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const u=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download='CRA_'+String(s.name).replace(/[^a-z0-9-]+/gi,'_')+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
window.CRA_NATIVE={attach};
})();