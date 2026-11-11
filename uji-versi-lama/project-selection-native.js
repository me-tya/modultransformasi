(function projectSelectionNative(){
'use strict';
const criteria=[['C1','Keselarasan strategis',7,'Manfaat'],['C2','Skala dampak pengguna',5,'Manfaat'],['C3','Level pengguna',5,'Manfaat'],['C4','Urgensi waktu',6,'Manfaat'],['C5','Gap kesiapan perubahan',5,'Manfaat'],['C6','Tingkat perubahan POSTER',3,'Manfaat'],['C7','Kebutuhan SDM Tim CM',3,'Biaya'],['C8','Nilai manfaat (efisiensi dan layanan)',6,'Manfaat'],['C9','Keterukuran manfaat',4,'Manfaat'],['C10','Kecepatan realisasi manfaat',4,'Manfaat'],['C11','Mitigasi risiko dan kepatuhan',3,'Manfaat'],['C12','Risiko implementasi',4,'Biaya']];
const total=criteria.reduce((a,b)=>a+b[2],0);
const style=document.createElement('style');style.id='psnative-style-20261108';
style.textContent="\n/* Only native project-selection modal and shim. The Priority page CSS is\n   imported from project-selection-priority.css copied from Dashboard CM. */\n#app .psnv{min-width:0}\n#app .psnv .prio-hero-actions{display:flex;gap:8px;flex-wrap:wrap}\n#app .psnv .prio-subtabs .cm-survey-subtab{cursor:pointer}\n#app .psnv .prio-row{min-width:0}\n#app .psnv .prio-score .prio-cat{white-space:nowrap}\n#app .psnv .prio-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px}\n#app .psnv .prio-actions .btn{white-space:nowrap}\n#app .psnv .prio-note.warn{background:#FFF7E3;border:1px solid #EBCB78;border-radius:10px;padding:9px 13px;font-size:12px;color:#795a13}\n.psnv-overlay{position:fixed;z-index:100800;inset:0;background:#061c34b3;display:grid;place-items:center;padding:13px}\n.psnv-dialog{background:#fff;width:min(970px,98vw);max-height:95vh;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;color:#203d60}\n.psnv-dialog>header{padding:15px 19px;background:linear-gradient(110deg,#0d2847,#15558a);border-bottom:3px solid #fdb913;color:white;display:flex;justify-content:space-between;gap:10px;align-items:center}\n.psnv-dialog>header button{border:1px solid #ffffff55;color:white;background:#ffffff22;border-radius:8px;padding:6px 12px;cursor:pointer}\n.psnv-dialog main{padding:17px;overflow:auto}\n.psnv-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}\n.psnv-grid label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:700}\n.psnv-grid label input,.psnv-grid label select{width:100%}\n.psnv-dialog input,.psnv-dialog select,.psnv-dialog textarea{padding:9px;border:1px solid #cfdaea;border-radius:8px;color:#12345e;background:white;font:inherit}\n.psnv-rate{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:16px}\n.psnv-rate label{display:flex;align-items:center;justify-content:space-between;gap:9px;border:1px solid #d9e5f3;border-radius:8px;padding:10px;font-size:12px}\n.psnv-rate label small{font-size:10px;display:block;color:#68809a}\n.psnv-rate select{min-width:105px}\n.psnv-dialog footer{padding:12px 17px;display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #e1e9f3}\n.psnv-btn{border:1px solid #cbdcee;border-radius:8px;background:white;color:#124775;padding:8px 12px;cursor:pointer;font:inherit;font-size:12px;font-weight:850}\n.psnv-btn.pri{background:#fdb913;border-color:#e1a713;color:#0b2b50}\n@media(max-width:680px){.psnv-grid,.psnv-rate{grid-template-columns:1fr}}\n";if(!document.getElementById(style.id))document.head.appendChild(style);
const esc2=x=>esc(String(x??''));
const UI=()=>S.ui.psNative||(S.ui.psNative={q:'',prog:'',rank:'all',tab:'projects',sort:'score',view:'list'});
const all=()=>{
 const out=[];
 for(const p of progVis())for(const j of progProjects(p)){
 const id=projectKey(p.akr,j.n),entry=(S.projectSelectionAssess||{})[id]||{};
 out.push({id,p,j,entry});
 }
 const ext=Array.isArray(S.projectSelectionExtra)?S.projectSelectionExtra:[];
 for(const z of ext){if(!z||!z.id)continue;const p=progVis().find(a=>a.akr===z.program)||{akr:z.program||'',nama:z.program||'Program belum tersedia',kode:''};
  const j={n:z.name||'Proyek baru',uic:z.uic||'—',pg:0,a:[],late:0,pic:z.pic||'',status:z.status||'Usulan'};
  out.push({id:z.id,p,j,entry:(S.projectSelectionAssess||{})[z.id]||{},extra:true});
 }
 return out;
};
const weights=()=>S.projectSelectionWeights||{};
const rank=x=>{
 let completed=0,weighted=0;
 for(const [k,name,w0,kind] of criteria){
 const w=Number(weights()[k]??w0);
 const n=Number((x.scores||{})[k]);if(!n||n<1||n>5)continue;
 completed++;weighted+=(kind==='Biaya'?5-n:n-1)*w/4;
 }
 const totalW=criteria.reduce((sum,c)=>sum+Number(weights()[c[0]]??c[2]),0);
 const score=completed===12&&totalW>0?Math.round(weighted/totalW*1000)/10:null;
 return {completed,score,priority:score==null?'—':score>=70?'P1':score>=40?'P2':'P3'};
};

function page(){
 const f=UI();if(!f.sort)f.sort='score';if(!f.view)f.view='list';
 const allRows=all(),edit=!!(ME&&['SA','PMOK','PMOU'].includes(ME.role));
 const valid=allRows.filter(x=>rank(x.entry).score!=null);
 const rows=allRows.filter(x=>{
  if(f.prog&&x.p.akr!==f.prog)return false;
  if(f.ue&&x.j.uic!==f.ue)return false;
  if(f.km&&(rank(x.entry).score??-1)<80)return false;
  const r=rank(x.entry);
  if(f.rank!=='all'&&(f.rank==='pending'?r.score!==null:(f.rank==='Usulan'||f.rank==='Berjalan'?((x.j.status||'Berjalan')!==f.rank):r.priority!==f.rank)))return false;
  return !f.q||(x.j.n+' '+x.p.nama+' '+x.j.uic+' '+(x.j.pic||'')).toLowerCase().includes(f.q.toLowerCase());
 }).sort((a,b)=>f.sort==='name'?a.j.n.localeCompare(b.j.n,'id'):f.sort==='golive'?String(a.entry.goLive||'9999').localeCompare(String(b.entry.goLive||'9999')):(rank(b.entry).score??-1)-(rank(a.entry).score??-1));
 const cnt={P1:0,P2:0,P3:0};valid.forEach(x=>cnt[rank(x.entry).priority]++);
 const first=rows.find(x=>rank(x.entry).score!=null),totalW=criteria.reduce((n,c)=>n+Number(weights()[c[0]]??c[2]),0);
 const ta=(label,value,cls)=>'<div class="prio-kpi '+(cls||'')+'"><b>'+value+'</b><small>'+label+'</small></div>';
 const tabs=[['projects','▤ Proyek',allRows.length],['criteria','⚖ Kriteria & Bobot',12],['monev','📈 Monev Indikator & Manfaat',allRows.filter(x=>x.entry.benefit).length],['reference','📘 Referensi & Formula',null]];
 let h=''; // Priority owns its heading; the Modul Transformasi shell remains the only application shell.
 h+='<section class="psnv prio-page" aria-label="Project Selection: menu Priority">';
 h+='<div class="prio-hero"><div><h2>Prioritas Proyek CM</h2><p>Pemeringkatan proyek/inisiatif pendampingan Change Management dengan metode SMART (Simple Multi-Attribute Rating Technique).</p></div><div class="prio-hero-actions">'+(edit?'<button type="button" class="btn btn-gold btn-sm" id="psnv-add">+ Tambah Proyek</button>':'')+'<button type="button" class="btn btn-outline btn-sm prio-btn-light" id="psnv-export">⇩ Excel</button><button type="button" class="btn btn-outline btn-sm prio-btn-light" id="psnv-report">📄 Laporan</button></div></div>';
 h+='<div class="cm-survey-subtabs prio-subtabs" role="tablist">'+tabs.map(([k,l,n])=>'<button type="button" role="tab" aria-selected="'+(f.tab===k)+'" data-psnv-tab="'+k+'" class="cm-survey-subtab '+(f.tab===k?'active':'')+'">'+l+(n==null?'':' <em class="prio-tab-n">'+n+'</em>')+'</button>').join('')+'</div>';
 if(f.tab==='projects'){
   const units=[...new Set(allRows.map(x=>x.j.uic).filter(Boolean))].sort();
   h+='<div class="prio-scope"><span class="prio-scope-l">Lingkup peringkat</span><button type="button" class="prio-scope-b '+(!f.prog&&!f.ue&&!f.km?'on':'')+'" data-psnv-scope="all">Semua</button>'+
      '<label class="prio-scope-sel '+(f.ue?'on':'')+'"><span>UE I / UIC</span><select id="psnv-ue"><option value="">— pilih —</option>'+units.map(u=>'<option value="'+esc2(u)+'" '+(f.ue===u?'selected':'')+'>'+esc2(u)+' ('+allRows.filter(x=>x.j.uic===u).length+')</option>').join('')+'</select></label>'+
      '<label class="prio-scope-sel '+(f.prog?'on':'')+'"><span>Berkelanjutan / Program</span><select id="psnv-prog"><option value="">— pilih —</option>'+progVis().map(p=>'<option value="'+esc2(p.akr)+'" '+(f.prog===p.akr?'selected':'')+'>'+esc2(p.nama)+'</option>').join('')+'</select></label>'+
      '<button type="button" class="prio-scope-b km '+(f.km?'on':'')+'" data-psnv-scope="km">🏛 Tingkat Kementerian <em>'+valid.filter(x=>rank(x.entry).score>=80).length+'</em></button></div>';
   h+='<div class="prio-kpis">'+ta('Proyek diranking',allRows.length,'')+ta('Prioritas Tinggi · ≥70',cnt.P1,'k-high')+ta('Prioritas Sedang · 40–69',cnt.P2,'k-mid')+ta('Prioritas Rendah · <40',cnt.P3,'k-low')+ta('Prioritas teratas',first?esc2(first.j.n):'—','k-top')+'</div>';
   h+='<div class="prio-toolbar"><input id="psnv-search" type="search" class="prio-search" placeholder="Cari proyek, unit, PIC…" value="'+esc2(f.q)+'" aria-label="Cari proyek">'+
       '<div class="prio-chips">'+[['all','Semua'],['Usulan','Usulan'],['Berjalan','Berjalan'],['P1','P1 Tinggi'],['P2','P2 Sedang'],['P3','P3 Rendah'],['pending','Belum dinilai']].map(([k,l])=>'<button type="button" class="prio-chip '+(f.rank===k?'on':'')+'" data-psnv-filter="'+k+'">'+l+'</button>').join('')+'</div>'+
       '<span class="prio-sp"></span><div class="prio-seg">'+[['score','Skor ↓'],['golive','Go-live'],['name','Nama']].map(([k,l])=>'<button type="button" data-psnv-sort="'+k+'" class="'+(f.sort===k?'on':'')+'">'+l+'</button>').join('')+'</div>'+
       '<div class="prio-seg"><button data-psnv-view="list" class="'+(f.view==='list'?'on':'')+'">☰ Daftar</button><button data-psnv-view="quad" class="'+(f.view==='quad'?'on':'')+'">◫ Kuadran</button></div><button type="button" class="prio-btn" id="psnv-reset">Reset</button></div>';
   if(f.view==='quad'){
     const W=920,H=440,pl=56,pr=24,pt=24,pb=48,xmax=50,x=v=>pl+Math.min(xmax,Math.max(0,v))/xmax*(W-pl-pr),y=v=>pt+(1-Math.max(0,Math.min(100,v))/100)*(H-pt-pb);
     const xm=15,ym=70;
     const box=(x0,y0,x1,y1,fill,t,sub)=>'<rect x="'+x(x0)+'" y="'+y(y1)+'" width="'+(x(x1)-x(x0))+'" height="'+(y(y0)-y(y1))+'" fill="'+fill+'"/><text x="'+(x(x0)+10)+'" y="'+(y(y1)+18)+'" class="qt">'+t+'</text><text x="'+(x(x0)+10)+'" y="'+(y(y1)+35)+'" class="qs">'+sub+'</text>';
     h+='<div class="prio-quad"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Kuadran prioritas berdasarkan skor dan beban pendampingan">'+
       box(0,ym,xm,100,'#E9F6EF','Prioritas cepat','Skor tinggi · beban ringan')+
       box(xm,ym,xmax,100,'#FFF6E3','Fokus utama','Skor tinggi · alokasikan kapasitas')+
       box(0,0,xm,ym,'#F4F6FB','Dukungan ringan','Skor rendah · beban ringan')+
       box(xm,0,xmax,ym,'#FDEEEC','Tinjau ulang','Skor rendah · beban berat')+
       [0,25,50,75,100].map(v=>'<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(v)+'" y2="'+y(v)+'" class="gl"/><text x="'+(pl-8)+'" y="'+(y(v)+4)+'" text-anchor="end" class="ax">'+v+'</text>').join('')+
       [0,10,20,30,40,50].map(v=>'<text x="'+x(v)+'" y="'+(H-pb+18)+'" text-anchor="middle" class="ax">'+v+'</text>').join('')+
       '<text x="'+(W/2)+'" y="'+(H-8)+'" text-anchor="middle" class="ax">Estimasi beban pendampingan · orang-hari/bulan (C7)</text>'+
       '<text transform="translate(16 '+(H/2)+') rotate(-90)" class="ax" text-anchor="middle">Skor SMART</text>'+
       rows.filter(o=>rank(o.entry).score!=null).map(o=>{
         const sc=rank(o.entry).score,effort=Number((o.entry.scores||{}).C7)||3,loads=[2,7,15,30,45],lx=loads[effort-1]||15;
         const fill=sc>=70?'#C0392B':sc>=40?'#C8A84B':'#5B8DD6';
         return '<g data-psnv-open="'+esc2(o.id)+'" style="cursor:pointer" tabindex="0" role="button" aria-label="Rincian '+esc2(o.j.n)+'"><title>'+esc2(o.j.n)+' · skor '+sc+'</title><circle cx="'+x(lx)+'" cy="'+y(sc)+'" r="8" fill="'+fill+'" stroke="white" stroke-width="2"/></g>';
       }).join('')+'</svg></div>';
   } else {
     h+='<section class="prio-list"><div class="prio-list-head"><h3>Peringkat prioritas</h3><span>Batang C1–C12 = utility per kriteria · '+rows.length+' proyek ditampilkan</span></div>';
     h+=rows.map((x,i)=>{
       const r=rank(x.entry),ss=x.entry.scores||{},cat=r.priority==='P1'?'high':r.priority==='P2'?'mid':'low',open=(f.open||[]).includes(x.id);
       const bars=criteria.map(c=>{
         const v=Number(ss[c[0]])||0,u=v?(c[3]==='Biaya'?5-v:v-1)/4:0;
         return '<span class="prio-u" title="'+esc2(c[0]+' '+c[1]+': '+(v||'belum dinilai')+'; utility '+u.toFixed(2))+'"><span class="prio-ub"><i style="height:'+Math.max(4,Math.round(u*100))+'%"></i></span><em>'+c[0]+'</em></span>';
       }).join('');
       const catText=r.priority==='P1'?'Tinggi':r.priority==='P2'?'Sedang':r.priority==='P3'?'Rendah':'Belum dinilai';
       const details=criteria.map(([k,l,w0,kind])=>{
         const v=Number(ss[k])||0,u=v?(kind==='Biaya'?5-v:v-1)/4:0,w=Number(weights()[k]??w0);
         const wn=totalW?w/totalW*100:0;
         return '<tr><td><b>'+k+'</b> '+l+'</td><td>'+kind+'</td><td>'+(v||'—')+'</td><td>'+u.toFixed(3)+'</td><td>'+wn.toFixed(1)+'%</td><td>'+(u*wn).toFixed(2)+'</td></tr>';
       }).join('');
       const status=x.j.status||'Berjalan',pname=x.p.nama||'—';
       return '<article class="prio-row cat-'+cat+(open?' open':'')+'" data-psnv-id="'+esc2(x.id)+'">'+
       '<div class="prio-rank"><b>'+(i+1)+'</b><small>'+r.priority+'</small></div>'+
       '<div class="prio-main"><div class="prio-title"><h4>'+esc2(x.j.n)+'</h4></div>'+
       '<div class="prio-meta"><span class="prio-status st-'+esc2(status.toLowerCase())+'">'+esc2(status)+'</span><span class="prio-ue">'+esc2(x.j.uic||'—')+'</span><span class="prio-prog">'+esc2(pname)+'</span>'+
       '<span>Progres WBS: <b>'+esc2(x.j.pg)+'%</b></span>'+
       (x.entry.goLive?'<span>Go-live: <b>'+esc2(x.entry.goLive)+'</b></span>':'')+
       (x.j.pic?'<span>PIC: '+esc2(x.j.pic)+'</span>':'')+
       (r.completed<12?'<span class="prio-warn" title="Kriteria belum lengkap">⚠ Data belum lengkap ('+r.completed+'/12)</span>':'')+'</div>'+
       '<div class="prio-utils" aria-label="Utility setiap kriteria">'+bars+'</div></div>'+
       '<div class="prio-score"><b>'+(r.score==null?'—':r.score.toFixed(1))+'</b><div class="prio-bar"><i style="width:'+(r.score??0)+'%"></i></div><span class="prio-cat">Prioritas '+catText+'</span></div>'+
       '<div class="prio-actions"><button type="button" class="btn btn-outline btn-sm" data-psnv-detail="'+esc2(x.id)+'">'+(open?'Tutup':'Rincian')+'</button>'+
       (edit?'<button type="button" class="btn btn-ghost btn-sm" data-psnv-open="'+esc2(x.id)+'" title="Edit / Nilai Proyek">✎</button>':'')+
       (edit&&x.extra?'<button type="button" class="btn btn-ghost btn-sm prio-del" data-psnv-delete="'+esc2(x.id)+'" title="Hapus usulan">🗑</button>':'')+'</div>'+
       (open?'<div class="prio-detail"><div class="prio-prog-detail"><span><b>Program:</b> '+esc2(pname)+'</span><span><b>UIC:</b> '+esc2(x.j.uic||'—')+'</span><span><b>Status:</b> '+esc2(status)+'</span><span><b>Skor:</b> '+(r.score??'—')+'</span></div>'+
       '<table><thead><tr><th>Kriteria</th><th>Jenis</th><th>Nilai (1–5)</th><th>Utility</th><th>Bobot</th><th>Kontribusi</th></tr></thead><tbody>'+details+'</tbody><tfoot><tr><td colspan="5"><b>Skor SMART = Σ bobot × utility</b></td><td><b>'+(r.score??'—')+'</b></td></tr></tfoot></table>'+
       (x.entry.notes?'<p class="prio-note">'+esc2(x.entry.notes)+'</p>':'')+'</div>':'')+'</article>';
     }).join('');
     if(!rows.length)h+='<div class="prio-empty">Tidak ada proyek sesuai filter. Ubah periode/tahun atau reset filter.</div>';
     h+='</section>';
   }
   h+='<p class="prio-note warn">⚠ Penilaian belum lengkap tidak diberi prioritas P1–P3. Proyek dari WBS tetap dikelola dalam Project Management; usulan tambahan hanya tersimpan di Project Selection.</p>';
 } else if(f.tab==='criteria'){
   h+='<section class="prio-panel"><h3>Kriteria & Bobot SMART</h3><p>Bobot awal mengacu pada 12 kriteria Priority Dashboard CM. Penyesuaian bobot hanya memengaruhi Project Selection di Modul Transformasi, tidak mengubah Dashboard CM.</p><div class="prio-tablewrap"><table class="prio-table"><thead><tr><th>Kode</th><th>Kriteria</th><th>Jenis</th><th>Bobot</th><th>Skala</th></tr></thead><tbody>'+
     criteria.map(([k,l,w,d])=>'<tr><td><b>'+k+'</b></td><td>'+l+'</td><td>'+d+'</td><td>'+(edit?'<input type="number" min="1" max="20" step="1" class="prio-weight" data-psnv-weight="'+k+'" value="'+(weights()[k]??w)+'">':(weights()[k]??w))+'</td><td>1–5'+(d==='Biaya'?' (dibalik)':'')+'</td></tr>').join('')+'</tbody></table></div><p><b>Total bobot aktif: '+totalW+'</b></p>'+
     (edit?'<button class="prio-btn gold" id="psnv-weight-save">Simpan Bobot</button><button class="prio-btn" id="psnv-weight-reset">Kembalikan Bobot Awal</button>':'')+'</section>';
 } else if(f.tab==='monev'){
   h+='<section class="prio-list"><div class="prio-list-head"><h3>Monev Indikator & Manfaat</h3><span>Baseline, target, realisasi, dan benefit owner</span></div><div class="prio-tablewrap"><table class="prio-table"><thead><tr><th>Proyek</th><th>UIC</th><th>Indikator / Manfaat</th><th>Baseline</th><th>Target</th><th>Realisasi</th><th>Benefit Owner</th><th>Aksi</th></tr></thead><tbody>'+
    rows.map(x=>'<tr><td><b>'+esc2(x.j.n)+'</b><small>'+esc2(x.p.nama)+'</small></td><td>'+esc2(x.j.uic)+'</td><td>'+esc2(x.entry.benefit||'—')+'</td><td>'+esc2(x.entry.base||'—')+'</td><td>'+esc2(x.entry.target||'—')+'</td><td>'+esc2(x.entry.actual||'—')+'</td><td>'+esc2(x.entry.owner||'—')+'</td><td><button type="button" class="prio-btn" data-psnv-open="'+esc2(x.id)+'">'+(edit?'Ubah':'Lihat')+'</button></td></tr>').join('')+'</tbody></table></div></section>';
 }else{
   h+='<section class="prio-panel"><h3>Referensi & Formula SMART</h3><p><b>Metode Simple Multi-Attribute Rating Technique (SMART)</b> menggabungkan utility setiap kriteria dengan bobot relatifnya. Arah manfaat bernilai makin besar makin baik, sedangkan kriteria biaya/risiko dibalik.</p><div class="prio-note"><b>Utility manfaat</b> = (nilai − 1) / 4<br><b>Utility biaya</b> = (5 − nilai) / 4<br><b>Skor akhir</b> = 100 × Σ(bobot × utility) / Σ(bobot)</div><p>Rentang prioritas: <b>P1 ≥ 70</b> (tinggi), <b>P2 40–69,9</b> (sedang), <b>P3 &lt; 40</b> (rendah). Skor hanya dihitung setelah 12 kriteria terisi.</p><p>Data proyek WBS berasal dari Project Management di tahun yang dipilih. Data penilaian, manfaat, dan bobot disimpan pada penyimpanan Modul Transformasi dan mengikuti hak akses PMO yang sudah ada. Tidak ada ketergantungan pada akun atau login Dashboard CM.</p></section>';
 }
 h+='</section>';return h;
}


function mount(){
 const root=document.querySelector('#view .psnv');if(!root)return;
 root.addEventListener('click',evt=>{
  const b=evt.target.closest('button');if(!b)return;
  if(b.dataset.psnvDetail){const id=b.dataset.psnvDetail;UI().open=UI().open||[];UI().open=UI().open.includes(id)?UI().open.filter(v=>v!==id):UI().open.concat(id);save();render()}
  else if(b.dataset.psnvDelete){deleteProject(b.dataset.psnvDelete)}
  else if(b.dataset.psnvScope){if(b.dataset.psnvScope==='all'){UI().prog='';UI().ue='';UI().km=false}else{UI().km=true;UI().prog='';UI().ue=''}save();render()}
  else if(b.dataset.psnvTab){UI().tab=b.dataset.psnvTab;save();render()}
  else if(b.dataset.psnvFilter){UI().rank=b.dataset.psnvFilter;save();render()}
  else if(b.dataset.psnvSort){UI().sort=b.dataset.psnvSort;save();render()}
  else if(b.dataset.psnvView){UI().view=b.dataset.psnvView;save();render()}
  else if(b.dataset.psnvOpen)edit(b.dataset.psnvOpen);
  else if(b.id==='psnv-reset'){const t=UI().tab;S.ui.psNative={q:'',prog:'',ue:'',km:false,rank:'all',tab:t,sort:'score',view:'list'};save();render()}
  else if(b.id==='psnv-export')exportCsv();
  else if(b.id==='psnv-report')printReport();
  else if(b.id==='psnv-add')addProject();
  else if(b.id==='psnv-weight-save'){
    const x={},els=root.querySelectorAll('[data-psnv-weight]');let ok=true;
    els.forEach(e=>{const v=Number(e.value);if(!Number.isInteger(v)||v<1||v>20)ok=false;else x[e.dataset.psnvWeight]=v});
    if(!ok){toast('Bobot harus berupa bilangan bulat 1–20.');return}
    S.projectSelectionWeights=x;save();render();toast('Bobot SMART tersimpan.');
  }
  else if(b.id==='psnv-weight-reset'){S.projectSelectionWeights={};save();render();toast('Bobot awal dipulihkan.')}
 });
 root.addEventListener('change',evt=>{if(evt.target.id==='psnv-prog'){UI().prog=evt.target.value;UI().ue='';UI().km=false;save();render()}else if(evt.target.id==='psnv-ue'){UI().ue=evt.target.value;UI().prog='';UI().km=false;save();render()}});
 const input=root.querySelector('#psnv-search');
 if(input)input.addEventListener('input',()=>{
  UI().q=input.value;const cursor=input.selectionStart;save();
  clearTimeout(window.__mtPsnvSearchTimer);
  window.__mtPsnvSearchTimer=setTimeout(()=>{
   render();const next=document.querySelector('#view #psnv-search');
   if(next){next.focus({preventScroll:true});try{next.setSelectionRange(cursor,cursor)}catch(_){}}
  },260);
 });
}
function deleteProject(id){
 if(!ME||!['SA','PMOK','PMOU'].includes(ME.role))return;
 const x=(S.projectSelectionExtra||[]).find(z=>z.id===id);
 if(!x)return;
 if(!window.confirm('Hapus usulan "'+x.name+'"?'))return;
 S.projectSelectionExtra=S.projectSelectionExtra.filter(z=>z.id!==id);
 if(S.projectSelectionAssess)delete S.projectSelectionAssess[id];
 save();render();toast('Usulan proyek dihapus.');
}
function addProject(){
 if(!ME||!['SA','PMOK','PMOU'].includes(ME.role))return;
 const progs=progVis();if(!progs.length){toast('Belum ada program yang dapat dipilih.');return}
 const box=document.createElement('div');box.className='psnv-overlay';
 box.innerHTML='<div class="psnv-dialog" role="dialog" aria-modal="true" aria-labelledby="psnv-add-title"><header><strong id="psnv-add-title">Tambah Proyek · Project Selection</strong><button type="button" data-close>✕ Tutup</button></header><main><p class="prio-note">Usulan tambahan hanya muncul di Project Selection, tidak membuat WBS baru di Project Management.</p><div class="psnv-grid"><label>Nama Proyek *<input data-f="name" maxlength="200" required></label><label>Program Transformasi *<select data-f="program">'+progs.map(p=>'<option value="'+esc2(p.akr)+'">'+esc2(p.nama)+'</option>').join('')+'</select></label><label>UIC / Unit Penanggung Jawab<input data-f="uic" maxlength="120"></label><label>PIC<input data-f="pic" maxlength="120"></label><label>Status<select data-f="status"><option>Usulan</option><option>Berjalan</option><option>Ditunda</option><option>Selesai</option></select></label><label>Target Go-live<input type="date" data-f="goLive"></label></div></main><footer><button type="button" class="prio-btn" data-close>Batal</button><button type="button" class="prio-btn gold" data-save>Tambah Proyek</button></footer></div>';
 document.body.appendChild(box);
 box.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>box.remove()));
 box.addEventListener('click',e=>{if(e.target===box)box.remove();if(!e.target.closest('[data-save]'))return;
  const get=k=>box.querySelector('[data-f="'+k+'"]').value.trim();
  if(!get('name')){toast('Nama Proyek wajib diisi.');return}
  const id='ps-extra-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
  S.projectSelectionExtra=S.projectSelectionExtra||[];
  S.projectSelectionExtra.push({id,name:get('name'),program:get('program'),uic:get('uic'),pic:get('pic'),status:get('status')});
  S.projectSelectionAssess=S.projectSelectionAssess||{};
  S.projectSelectionAssess[id]={goLive:get('goLive'),scores:{},updatedAt:new Date().toISOString(),updatedBy:ME.email||''};
  save();box.remove();UI().tab='projects';render();toast('Proyek baru ditambahkan ke Project Selection.');
 });
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

function printReport(){
 const rows=all().filter(x=>!UI().prog||x.p.akr===UI().prog).sort((a,b)=>(rank(b.entry).score??-1)-(rank(a.entry).score??-1));
 const t='<h1>Laporan Prioritas Proyek Transformasi</h1><p>Tahun '+esc2(S.ui.tahun)+' · metode SMART 12 kriteria</p><table><thead><tr><th>No</th><th>Program</th><th>Proyek</th><th>UIC</th><th>Skor</th><th>Prioritas</th><th>Manfaat</th></tr></thead><tbody>'+rows.map((x,i)=>{const r=rank(x.entry);return '<tr><td>'+(i+1)+'</td><td>'+esc2(x.p.nama)+'</td><td>'+esc2(x.j.n)+'</td><td>'+esc2(x.j.uic)+'</td><td>'+(r.score??'—')+'</td><td>'+esc2(r.priority)+'</td><td>'+esc2(x.entry.benefit||'—')+'</td></tr>'}).join('')+'</tbody></table><p class="note">Data belum lengkap tidak diberi kategori prioritas. Sumber: Modul Transformasi.</p>';
 const w=window.open('','_blank');if(!w){toast('Browser memblokir jendela laporan. Izinkan pop-up untuk mencetak.');return}
 w.document.open();w.document.write('<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Laporan Project Selection</title><style>body{font:12px Arial,sans-serif;color:#173456;margin:28px}h1{font-size:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd7e8;text-align:left;padding:8px}th{background:#eaf0f8}.note{font-size:10px;color:#67788c}@media print{@page{size:landscape;margin:12mm}}</style></head><body>'+t+'</body></html>');w.document.close();w.focus();w.print();
}

window.MT_PROJECT_SELECTION=Object.assign({},window.MT_PROJECT_SELECTION||{},{page,mount,version:'20261108-priority-visual-no-cm-auth-v2'});
if(typeof VIEW!=='undefined'&&VIEW==='project-selection'&&typeof ME!=='undefined'&&ME)render();
})();