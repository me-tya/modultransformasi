(function projectSelectionNative(){
'use strict';
const criteria=[['C1','Keselarasan strategis',7,'Manfaat'],['C2','Skala dampak pengguna',5,'Manfaat'],['C3','Level pengguna',5,'Manfaat'],['C4','Urgensi waktu',6,'Manfaat'],['C5','Gap kesiapan perubahan',5,'Manfaat'],['C6','Tingkat perubahan POSTER',3,'Manfaat'],['C7','Kebutuhan SDM Tim CM',3,'Biaya'],['C8','Nilai manfaat (efisiensi dan layanan)',6,'Manfaat'],['C9','Keterukuran manfaat',4,'Manfaat'],['C10','Kecepatan realisasi manfaat',4,'Manfaat'],['C11','Mitigasi risiko dan kepatuhan',3,'Manfaat'],['C12','Risiko implementasi',4,'Biaya']];
const total=criteria.reduce((a,b)=>a+b[2],0);
const style=document.createElement('style');style.id='psnative-style-20261108';
style.textContent=`
#app .psnv{display:flex;flex-direction:column;gap:12px;min-width:0}
#app .psnv-filter{display:flex;gap:9px;flex-wrap:wrap;padding:13px;background:#fff;border:1px solid #d9e3f0;border-radius:12px}
#app .psnv-filter input,#app .psnv-filter select,.psnv-dialog input,.psnv-dialog select,.psnv-dialog textarea{padding:9px;border:1px solid #cfdaea;border-radius:8px;color:#12345e;background:white;font:inherit}
#app .psnv-filter input{min-width:210px;flex:1}
#app .psnv-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
#app .psnv-stat{background:white;border:1px solid #d9e3f0;border-radius:10px;padding:13px;display:flex;flex-direction:column;gap:4px}
#app .psnv-stat:first-child{background:#143c76;color:white}
#app .psnv-stat b{font-size:27px;color:#16385c}
#app .psnv-stat:first-child b,#app .psnv-stat:first-child span{color:white}
#app .psnv-stat span{font-size:11px;color:#647b93}
#app .psnv-tabs{display:flex;gap:4px;border-bottom:1px solid #cbd9eb}
#app .psnv-tabs button{background:#f3f7fd;color:#21456e;border:1px solid #d7e1ee;border-radius:9px 9px 0 0;padding:11px 15px;font-size:12px;font-weight:800;cursor:pointer}
#app .psnv-tabs button.on{background:#103b78;color:white;border-color:#103b78}
#app .psnv-paper{background:white;border:1px solid #d9e3f0;border-radius:11px;overflow:hidden}
#app .psnv-paper header{padding:14px 16px;display:flex;justify-content:space-between;align-items:center;color:#15375d;font-size:14px;font-weight:850}
#app .psnv-scroll{width:100%;overflow:auto}
#app .psnv-table{width:100%;border-collapse:collapse;font-size:12px}
#app .psnv-table th{padding:11px;text-align:left;white-space:nowrap;background:#edf4fd;color:#23486d}
#app .psnv-table td{padding:12px 11px;border-top:1px solid #e6edf6;color:#2d4765}
#app .psnv-table td small{display:block;color:#78889d;margin-top:3px}
#app .psnv-table tr:hover td{background:#f9fbfe}
#app .psnv-btn{border:1px solid #cbdcee;border-radius:8px;background:white;color:#124775;padding:8px 12px;cursor:pointer;font:inherit;font-size:12px;font-weight:850}
#app .psnv-btn:hover{background:#ebf5ff}
#app .psnv-btn.pri{background:#ffbe21;border-color:#d7a018;color:#0b2b50}
#app .psnv-chip{display:inline-block;border-radius:7px;padding:4px 8px;background:#edf1f7;color:#516c84;font-size:10px;font-weight:850;white-space:nowrap}
#app .psnv-chip.p1{background:#ffe0e0;color:#ad262c}#app .psnv-chip.p2{background:#fff0d0;color:#886000}#app .psnv-chip.p3{background:#dff6ea;color:#147d51}
#app .psnv-notice{border:1px solid #cfdeef;border-radius:9px;background:#f2f8ff;padding:12px;color:#42617f;font-size:12px;line-height:1.5}
.psnv-overlay{position:fixed;z-index:100800;inset:0;background:#061c34b3;display:grid;place-items:center;padding:13px}
.psnv-dialog{background:#fff;width:min(970px,98vw);max-height:95vh;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;color:#203d60}
.psnv-dialog>header{padding:15px 19px;background:#123c78;color:white;display:flex;justify-content:space-between;gap:10px;align-items:center}
.psnv-dialog>header button{border:1px solid #ffffff55;color:white;background:#ffffff22;border-radius:8px;padding:6px 12px;cursor:pointer}
.psnv-dialog main{padding:17px;overflow:auto}
.psnv-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.psnv-grid label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:700}
.psnv-grid label input{width:100%}
.psnv-rate{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:16px}
.psnv-rate label{display:flex;align-items:center;justify-content:space-between;gap:9px;border:1px solid #d9e5f3;border-radius:8px;padding:10px;font-size:12px}
.psnv-rate label small{font-size:10px;display:block;color:#68809a}
.psnv-rate select{min-width:105px}
.psnv-dialog footer{padding:12px 17px;display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #e1e9f3}
@media(max-width:1000px){#app .psnv-stats{grid-template-columns:repeat(3,1fr)}}
@media(max-width:680px){#app .psnv-stats{grid-template-columns:repeat(2,1fr)}.psnv-grid,.psnv-rate{grid-template-columns:1fr}}
`;if(!document.getElementById(style.id))document.head.appendChild(style);
const esc2=x=>esc(String(x??''));
const UI=()=>S.ui.psNative||(S.ui.psNative={q:'',prog:'',rank:'all',tab:'projects'});
const all=()=>{
 const out=[];
 for(const p of progVis())for(const j of progProjects(p)){
 const id=projectKey(p.akr,j.n),entry=(S.projectSelectionAssess||{})[id]||{};
 out.push({id,p,j,entry});
 }
 return out;
};
const rank=x=>{
 let completed=0,weighted=0;
 for(const [k,name,w,kind] of criteria){
 const n=Number((x.scores||{})[k]);if(!n||n<1||n>5)continue;
 completed++;weighted+=(kind==='Biaya'?5-n:n-1)*w/4;
 }
 const score=completed===12?Math.round(weighted/total*1000)/10:null;
 return {completed,score,priority:score==null?'—':score>=70?'P1':score>=40?'P2':'P3'};
};
function page(){
 const f=UI(),allRows=all(),rated=allRows.filter(x=>rank(x.entry).score!==null);
 const rows=allRows.filter(x=>{
 if(f.prog&&x.p.akr!==f.prog)return false;
 const r=rank(x.entry);if(f.rank!=='all'&&(f.rank==='pending'?r.score!==null:r.priority!==f.rank))return false;
 return !f.q||(x.j.n+' '+x.p.nama+' '+x.j.uic+' '+x.p.kode).toLowerCase().includes(f.q.toLowerCase());
 }).sort((a,b)=>(rank(b.entry).score??-1)-(rank(a.entry).score??-1));
 const edit=ME&&['SA','PMOK','PMOU'].includes(ME.role);
 let h=vh('PS','dash','Project Selection','Pemeringkatan proyek transformasi dengan 12 kriteria SMART, progres WBS, dan pemantauan manfaat.');
 h+='<div class="psnv"><div class="psnv-filter"><input id="psnv-search" value="'+esc2(f.q)+'" placeholder="Cari proyek, program, atau UIC…" aria-label="Cari proyek"><select id="psnv-prog" aria-label="Filter program"><option value="">Semua Program</option>'+progVis().map(p=>'<option value="'+esc2(p.akr)+'"'+(f.prog===p.akr?' selected':'')+'>'+esc2(p.nama)+'</option>').join('')+'</select><select id="psnv-rank" aria-label="Filter prioritas">'+[['all','Semua Prioritas'],['P1','Prioritas P1'],['P2','Prioritas P2'],['P3','Prioritas P3'],['pending','Belum Dinilai']].map(([v,l])=>'<option value="'+v+'"'+(f.rank===v?' selected':'')+'>'+l+'</option>').join('')+'</select><button class="psnv-btn" id="psnv-reset">Reset</button><button class="psnv-btn" id="psnv-export">⇩ CSV</button></div>';
 h+='<div class="psnv-stats">'+[['Total Proyek',allRows.length],['Sudah Dinilai',rated.length],['Prioritas P1',rated.filter(x=>rank(x.entry).priority==='P1').length],['Prioritas P2',rated.filter(x=>rank(x.entry).priority==='P2').length],['Prioritas P3',rated.filter(x=>rank(x.entry).priority==='P3').length]].map(([k,v])=>'<div class="psnv-stat"><span>'+k+'</span><b>'+v+'</b></div>').join('')+'</div>';
 h+='<div class="psnv-tabs">'+[['projects','Daftar & Pemeringkatan'],['criteria','Kriteria & Bobot'],['benefits','Monitoring Manfaat']].map(([k,l])=>'<button type="button" data-psnv-tab="'+k+'" class="'+(f.tab===k?'on':'')+'">'+l+'</button>').join('')+'</div>';
 const head=(t,info)=>'<section class="psnv-paper"><header><b>'+t+'</b><span style="font-size:11px;color:#79889b">'+info+'</span></header><div class="psnv-scroll"><table class="psnv-table">';
 if(f.tab==='criteria')h+=head('Daftar 12 kriteria SMART','Total bobot '+total)+'<thead><tr><th>Kode</th><th>Kriteria</th><th>Bobot</th><th>Jenis</th><th>Skala</th></tr></thead><tbody>'+criteria.map(([k,l,w,d])=>'<tr><td>'+k+'</td><td><b>'+l+'</b></td><td>'+w+'</td><td>'+d+'</td><td>1–5'+(d==='Biaya'?' (dibalik)':'')+'</td></tr>').join('')+'</tbody></table></div></section>';
 else if(f.tab==='benefits')h+=head('Indikator & Monitoring Manfaat','Sumber penilaian per proyek')+'<thead><tr><th>Proyek</th><th>UIC</th><th>Manfaat</th><th>Baseline</th><th>Target</th><th>Realisasi</th><th>Aksi</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><b>'+esc2(x.j.n)+'</b><small>'+esc2(x.p.nama)+'</small></td><td>'+esc2(x.j.uic)+'</td><td>'+esc2(x.entry.benefit||'—')+'</td><td>'+esc2(x.entry.base||'—')+'</td><td>'+esc2(x.entry.target||'—')+'</td><td>'+esc2(x.entry.actual||'—')+'</td><td><button class="psnv-btn" data-psnv-open="'+esc2(x.id)+'">'+(edit?'Ubah':'Lihat')+'</button></td></tr>').join('')+'</tbody></table></div></section>';
 else h+=head('Proyek Transformasi','Sumber WBS TA '+S.ui.tahun+' · '+rows.length+' proyek')+'<thead><tr><th>No</th><th>Proyek / Modul</th><th>Program</th><th>UIC</th><th>Progres WBS</th><th>Skor SMART</th><th>Prioritas</th><th>Aksi</th></tr></thead><tbody>'+rows.map((x,i)=>{const r=rank(x.entry);return '<tr><td>'+(i+1)+'</td><td><b>'+esc2(x.j.n)+'</b><small>'+x.j.a.length+' item WBS · '+(x.j.late||0)+' terlambat</small></td><td>'+esc2(x.p.nama)+'</td><td>'+esc2(x.j.uic)+'</td><td>'+x.j.pg+'%</td><td><b>'+(r.score==null?'—':r.score+'/100')+'</b><small>'+r.completed+'/12 kriteria</small></td><td><span class="psnv-chip '+r.priority.toLowerCase()+'">'+(r.score==null?'Belum dinilai':r.priority)+'</span></td><td><button class="psnv-btn" data-psnv-open="'+esc2(x.id)+'">'+(edit?'Nilai Proyek':'Lihat')+'</button></td></tr>'}).join('')+'</tbody></table>'+(rows.length?'':'<p style="padding:18px;color:#657c95">Tidak ada proyek pada filter ini. Coba ubah periode/tahun atau reset filter.</p>')+'</div></section>';
 h+='<div class="psnv-notice">Skor baru dinyatakan lengkap setelah seluruh 12 kriteria dinilai. Kriteria biaya dan risiko dibalik sebelum perhitungan SMART. Data WBS diambil langsung dari Project Management; data penilaian kosong tidak diisi otomatis.</div></div>';
 return h;
}
function mount(){
 const root=document.querySelector('#view .psnv');if(!root)return;
 root.addEventListener('click',evt=>{
 const b=evt.target.closest('button');if(!b)return;
 if(b.dataset.psnvTab){UI().tab=b.dataset.psnvTab;save();render()}
 else if(b.dataset.psnvOpen)edit(b.dataset.psnvOpen);
 else if(b.id==='psnv-reset'){S.ui.psNative={q:'',prog:'',rank:'all',tab:UI().tab};save();render()}
 else if(b.id==='psnv-export')exportCsv();
 });
 root.addEventListener('change',evt=>{if(evt.target.id==='psnv-prog')UI().prog=evt.target.value;else if(evt.target.id==='psnv-rank')UI().rank=evt.target.value;else return;save();render()});
 const input=root.querySelector('#psnv-search');
 if(input)input.addEventListener('input',()=>{UI().q=input.value;const n=input.selectionStart;save();render();const next=document.querySelector('#psnv-search');if(next){next.focus();next.setSelectionRange(n,n)}});
}
function edit(id){
 const x=all().find(z=>z.id===id);if(!x){toast('Data proyek tidak ditemukan.');return}
 const canEdit=ME&&['SA','PMOK','PMOU'].includes(ME.role),d=x.entry||{},ss=d.scores||{};
 const box=document.createElement('div');box.className='psnv-overlay';
 box.innerHTML='<div class="psnv-dialog" role="dialog" aria-modal="true"><header><strong>Penilaian Proyek · '+esc2(x.j.n)+'</strong><button data-close>✕ Tutup</button></header><main><p class="psnv-notice">'+esc2(x.p.nama)+' · UIC '+esc2(x.j.uic)+'. Pilih 1–5 sesuai data asesmen; nilai belum tersedia boleh dikosongkan.</p><div class="psnv-grid">'+[['benefit','Manfaat utama'],['base','Baseline'],['target','Target'],['actual','Realisasi manfaat'],['owner','Benefit owner'],['goLive','Target go-live']].map(([k,l])=>'<label>'+l+'<input data-f="'+k+'" value="'+esc2(d[k]||'')+'" '+(canEdit?'':'readonly')+'></label>').join('')+'</div><div class="psnv-rate">'+criteria.map(([k,l,w,dim])=>'<label><span><b>'+k+' · '+l+'</b><small>Bobot '+w+' · '+dim+'</small></span><select data-score="'+k+'" '+(canEdit?'':'disabled')+'><option value="">Belum dinilai</option>'+[1,2,3,4,5].map(v=>'<option value="'+v+'"'+(Number(ss[k])===v?' selected':'')+'>'+v+'</option>').join('')+'</select></label>').join('')+'</div><label style="display:block;margin-top:14px;font-size:12px">Catatan / bukti asesmen<textarea data-f="notes" style="display:block;width:100%;min-height:66px">'+esc2(d.notes||'')+'</textarea></label></main><footer><button class="psnv-btn" data-close>Tutup</button>'+(canEdit?'<button class="psnv-btn pri" data-save>Simpan Penilaian</button>':'')+'</footer></div>';
 document.body.appendChild(box);
 box.addEventListener('click',evt=>{
 if(evt.target===box||evt.target.closest('[data-close]')){box.remove();return}
 if(!evt.target.closest('[data-save]'))return;
 const obj={...d,scores:{...ss}};box.querySelectorAll('[data-score]').forEach(el=>{if(el.value)obj.scores[el.dataset.score]=+el.value;else delete obj.scores[el.dataset.score]});box.querySelectorAll('[data-f]').forEach(el=>obj[el.dataset.f]=el.value.trim());
 obj.updatedAt=new Date().toISOString();obj.updatedBy=ME.email;
 S.projectSelectionAssess=S.projectSelectionAssess||{};S.projectSelectionAssess[id]=obj;save();box.remove();render();toast('Penilaian proyek tersimpan.');
 });
}
function exportCsv(){
 const head=['Program','Proyek','UIC','Progres WBS','Kriteria Terisi','Skor','Prioritas','Manfaat','Baseline','Target','Realisasi'];
 const csv=[head,...all().filter(x=>!UI().prog||x.p.akr===UI().prog).map(x=>{const r=rank(x.entry);return [x.p.nama,x.j.n,x.j.uic,x.j.pg,r.completed,r.score??'',r.priority,x.entry.benefit||'',x.entry.base||'',x.entry.target||'',x.entry.actual||'']})].map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='Project_Selection_'+S.ui.tahun+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
window.MT_PROJECT_SELECTION=Object.assign({},window.MT_PROJECT_SELECTION||{},{page,mount,version:'20261108-native-PMO-v1'});
if(typeof VIEW!=='undefined'&&VIEW==='project-selection'&&typeof ME!=='undefined'&&ME)render();
})();