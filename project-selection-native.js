(function projectSelectionNative(){
'use strict';
const criteria=[['C1','Keselarasan strategis',7,'Manfaat'],['C2','Skala dampak pengguna',5,'Manfaat'],['C3','Level pengguna',5,'Manfaat'],['C4','Urgensi waktu',6,'Manfaat'],['C5','Gap kesiapan perubahan',5,'Manfaat'],['C6','Tingkat perubahan POSTER',3,'Manfaat'],['C7','Kebutuhan SDM Tim CM',3,'Biaya'],['C8','Nilai manfaat (efisiensi dan layanan)',6,'Manfaat'],['C9','Keterukuran manfaat',4,'Manfaat'],['C10','Kecepatan realisasi manfaat',4,'Manfaat'],['C11','Mitigasi risiko dan kepatuhan',3,'Manfaat'],['C12','Risiko implementasi',4,'Biaya']];
const total=criteria.reduce((a,b)=>a+b[2],0);
const style=document.createElement('style');style.id='psnative-style-20261108';
style.textContent="\n/* Project Selection meniru visual menu Priority Dashboard CM, tanpa shell atau login CM.\n   Semua selector dibatasi .psnv agar tema Modul Transformasi tidak berubah. */\n#app .psnv{--prio-navy:#0b2447;--prio-line:#dce3ef;display:flex;flex-direction:column;gap:12px;min-width:0;font-family:'Inter','Nunito Sans',system-ui,sans-serif;color:#193451}\n#app .psnv *{box-sizing:border-box}\n#app .psnv .prio-hero{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 20px;border-radius:14px;background:linear-gradient(120deg,#0b2447,#1d3a7a);color:#fff;flex-wrap:wrap}\n#app .psnv .prio-hero h2{margin:0 0 4px;font-size:20px;font-weight:850;color:#fff;line-height:1.25}\n#app .psnv .prio-hero p{margin:0;font-size:12.5px;color:#e4ecf7;line-height:1.5;max-width:700px}\n#app .psnv .prio-hero-actions{display:flex;gap:8px;flex-wrap:wrap}\n#app .psnv .prio-btn{cursor:pointer;border:1px solid #cbd6e7;background:#fff;color:#173d66;border-radius:9px;padding:9px 13px;font:750 12px inherit;white-space:nowrap}\n#app .psnv .prio-btn:hover{background:#eaf3fd}\n#app .psnv .prio-btn.gold{background:#fdb913;border-color:#fdb913;color:#102d4d;font-weight:850}\n#app .psnv .prio-btn.white{background:rgba(255,255,255,.12);color:#fff;border-color:#fff8}\n#app .psnv .prio-btn.white:hover{background:#ffffff35}\n#app .psnv .prio-subtabs{display:flex;gap:6px;align-items:stretch;flex-wrap:nowrap;overflow-x:auto;border-bottom:2px solid #dce3ef;padding:3px 0 0}\n#app .psnv .prio-subtabs button{cursor:pointer;flex:none;border:0;background:transparent;color:#566c84;border-radius:9px 9px 0 0;padding:11px 14px;font:800 12px inherit;white-space:nowrap}\n#app .psnv .prio-subtabs button:hover{background:#eef3fa;color:#123b6a}\n#app .psnv .prio-subtabs button.active{background:#fff;color:#123b6a;box-shadow:inset 0 -4px 0 #fdb913}\n#app .psnv .prio-tab-n{display:inline-flex;justify-content:center;min-width:22px;padding:2px 6px;margin-left:6px;border-radius:20px;background:#e5ebf3;color:#274c77;font-size:10px}\n#app .psnv .prio-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr)) minmax(0,1.6fr);gap:9px}\n#app .psnv .prio-kpi{display:flex;flex-direction:column;gap:4px;min-width:0;padding:13px 14px;background:#fff;border:1px solid #dce3ef;border-top:3px solid #c7ceda;border-radius:12px}\n#app .psnv .prio-kpi b{font-weight:850;font-size:22px;line-height:1.15;color:#173d66}\n#app .psnv .prio-kpi small{font-size:11px;color:#667b93}\n#app .psnv .prio-kpi.k-high{border-top-color:#c0392b}\n#app .psnv .prio-kpi.k-mid{border-top-color:#c9a84c}\n#app .psnv .prio-kpi.k-low{border-top-color:#5b8dd6}\n#app .psnv .prio-kpi.k-top{border-top-color:#1d3a7a;background:linear-gradient(135deg,#f5f8fd,#fff)}\n#app .psnv .prio-kpi.k-top b{font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n#app .psnv .prio-scopebar{display:flex;flex-wrap:wrap;gap:9px;align-items:center;padding:12px;background:#fff;border:1px solid #dce3ef;border-radius:11px}\n#app .psnv .prio-scopebar label{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:750}\n#app .psnv .prio-scopebar select{max-width:300px}\n#app .psnv .prio-scopebar select,#app .psnv .prio-toolbar input{font:inherit;font-size:12px;padding:9px 11px;border:1px solid #cfdaea;border-radius:9px;color:#203d60;background:#fff}\n#app .psnv .prio-toolbar{display:flex;gap:9px;align-items:center;flex-wrap:wrap}\n#app .psnv .prio-search{flex:1 1 210px;min-width:160px}\n#app .psnv .prio-chips{display:flex;gap:6px;flex-wrap:wrap}\n#app .psnv .prio-chip{cursor:pointer;border:1px solid #dce3ef;border-radius:30px;padding:7px 12px;font-size:11.5px;font-weight:750;background:#fff;color:#4b617c}\n#app .psnv .prio-chip.on{background:#173f74;color:#fff;border-color:#173f74}\n#app .psnv .prio-sp{flex:1}\n#app .psnv .prio-seg{display:flex;align-items:stretch;border:1px solid #dce3ef;background:#fff;border-radius:9px;overflow:hidden}\n#app .psnv .prio-seg button{border:0;cursor:pointer;font:750 11.5px inherit;padding:8px 11px;color:#536985;background:transparent}\n#app .psnv .prio-seg button.on{background:#fff3d9;color:#765414}\n#app .psnv .prio-list{background:#fff;border:1px solid #dce3ef;border-radius:14px;padding:13px;display:flex;flex-direction:column;gap:9px;min-width:0}\n#app .psnv .prio-list-head{display:flex;justify-content:space-between;align-items:center;gap:9px;flex-wrap:wrap;padding:3px 4px}\n#app .psnv .prio-list-head h3{font-size:14.5px;color:#143968;margin:0}\n#app .psnv .prio-list-head span{font-size:11px;color:#74869a}\n#app .psnv .prio-row{display:grid;grid-template-columns:52px minmax(0,1fr) 115px auto;align-items:center;gap:12px;padding:12px;border:1px solid #dce3ef;border-left:4px solid #bfc9d8;border-radius:11px;background:#fff}\n#app .psnv .prio-row.cat-high{border-left-color:#c0392b}\n#app .psnv .prio-row.cat-mid{border-left-color:#c9a84c}\n#app .psnv .prio-row.cat-low{border-left-color:#5b8dd6}\n#app .psnv .prio-row:hover{box-shadow:0 4px 14px #12275a11}\n#app .psnv .prio-rank{display:flex;flex-direction:column;align-items:center;justify-content:center;width:47px;height:47px;border-radius:12px;background:#f2f5fb}\n#app .psnv .prio-rank b{font-size:18px;color:#173d66}\n#app .psnv .prio-rank small{font-size:9px;color:#7c8da0}\n#app .psnv .prio-title{min-width:0}\n#app .psnv .prio-title h4{font-size:13px;font-weight:800;color:#193451;margin:0 0 5px}\n#app .psnv .prio-meta{display:flex;gap:5px 12px;flex-wrap:wrap;color:#627790;font-size:11px}\n#app .psnv .prio-meta b{color:#27496e}\n#app .psnv .prio-score{text-align:center}\n#app .psnv .prio-score b{display:block;color:#183f73;font-size:19px}\n#app .psnv .prio-score small{display:block;font-size:10px;color:#718299;margin:3px 0}\n#app .psnv .prio-tag{display:inline-block;border-radius:8px;padding:3px 8px;font-size:10px;font-weight:800;background:#e7edf5;color:#506b88}\n#app .psnv .prio-tag.p1{background:#fdecea;color:#ab362e}\n#app .psnv .prio-tag.p2{background:#fbf4e2;color:#8a6a1b}\n#app .psnv .prio-tag.p3{background:#eaf1ff;color:#315c96}\n#app .psnv .prio-utils{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}\n#app .psnv .prio-utility{width:27px;text-align:center;font-size:9px;color:#667b93}\n#app .psnv .prio-utility i{display:block;height:6px;border-radius:5px;background:#e3eaf4;overflow:hidden}\n#app .psnv .prio-utility i:before{content:'';display:block;height:100%;width:var(--pct);background:linear-gradient(90deg,#4477b0,#e5af30)}\n#app .psnv .prio-utility b{font-size:9px}\n#app .psnv .prio-actions{display:flex;flex-direction:column;gap:5px}\n#app .psnv .prio-empty{padding:25px 18px;text-align:center;color:#71859d;font-size:12px}\n#app .psnv .prio-tablewrap{overflow:auto}\n#app .psnv .prio-table{width:100%;border-collapse:collapse;font-size:12px}\n#app .psnv .prio-table th{background:#f4f6fb;color:#163d69;padding:11px;text-align:left;white-space:nowrap}\n#app .psnv .prio-table td{border-top:1px solid #e7edf5;padding:11px;vertical-align:top}\n#app .psnv .prio-table small{display:block;color:#71859d}\n#app .psnv .prio-note{padding:12px;border:1px solid #d3e2f2;background:#f2f7fd;color:#46627e;border-radius:9px;font-size:12px;line-height:1.6}\n#app .psnv .prio-note.warn{background:#fff8e9;border-color:#edd8aa;color:#856223}\n#app .psnv .prio-panel{background:#fff;border:1px solid #dce3ef;border-radius:12px;padding:15px;line-height:1.65;font-size:12px}\n#app .psnv .prio-panel h3{font-size:15px;color:#1b426f;margin:0 0 8px}\n#app .psnv .prio-panel p{margin:0 0 9px}\n#app .psnv .prio-panel .prio-btn{margin:8px 5px 0 0}\n#app .psnv .prio-weight{width:76px;padding:6px;border:1px solid #cbd8e8;border-radius:7px;color:#17406e}\n#app .psnv .prio-quad{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}\n#app .psnv .prio-quad-cell{min-height:150px;padding:13px;background:#fff;border-radius:12px;border:1px solid #dce3ef}\n#app .psnv .prio-quad-cell h4{margin:0 0 8px;color:#153f71;font-size:13px}\n#app .psnv .prio-quad-cell p{margin:6px 0;font-size:11px}\n.psnv-overlay{position:fixed;z-index:100800;inset:0;background:#061c34b3;display:grid;place-items:center;padding:13px}\n.psnv-dialog{background:#fff;width:min(970px,98vw);max-height:95vh;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;color:#203d60}\n.psnv-dialog>header{padding:15px 19px;background:linear-gradient(110deg,#0d2847,#15558a);border-bottom:3px solid #fdb913;color:white;display:flex;justify-content:space-between;gap:10px;align-items:center}\n.psnv-dialog>header button{border:1px solid #ffffff55;color:white;background:#ffffff22;border-radius:8px;padding:6px 12px;cursor:pointer}\n.psnv-dialog main{padding:17px;overflow:auto}\n.psnv-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}\n.psnv-grid label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:700}\n.psnv-grid label input,.psnv-grid label select{width:100%}\n.psnv-dialog input,.psnv-dialog select,.psnv-dialog textarea{padding:9px;border:1px solid #cfdaea;border-radius:8px;color:#12345e;background:white;font:inherit}\n.psnv-rate{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:16px}\n.psnv-rate label{display:flex;align-items:center;justify-content:space-between;gap:9px;border:1px solid #d9e5f3;border-radius:8px;padding:10px;font-size:12px}\n.psnv-rate label small{font-size:10px;display:block;color:#68809a}\n.psnv-rate select{min-width:105px}\n.psnv-dialog footer{padding:12px 17px;display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #e1e9f3}\n@media(max-width:1020px){#app .psnv .prio-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}#app .psnv .prio-row{grid-template-columns:46px minmax(0,1fr) 95px}}\n@media(max-width:680px){#app .psnv .prio-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}#app .psnv .prio-row{grid-template-columns:44px minmax(0,1fr)}#app .psnv .prio-score,#app .psnv .prio-actions{grid-column:2;text-align:left;flex-direction:row}#app .psnv .prio-quad,.psnv-grid,.psnv-rate{grid-template-columns:1fr}#app .psnv .prio-hero{padding:14px}}\n";if(!document.getElementById(style.id))document.head.appendChild(style);
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
  const r=rank(x.entry);
  if(f.rank!=='all'&&(f.rank==='pending'?r.score!==null:r.priority!==f.rank))return false;
  return !f.q||(x.j.n+' '+x.p.nama+' '+x.j.uic+' '+(x.j.pic||'')).toLowerCase().includes(f.q.toLowerCase());
 }).sort((a,b)=>f.sort==='name'?a.j.n.localeCompare(b.j.n,'id'):f.sort==='golive'?String(a.entry.goLive||'9999').localeCompare(String(b.entry.goLive||'9999')):(rank(b.entry).score??-1)-(rank(a.entry).score??-1));
 const cnt={P1:0,P2:0,P3:0};valid.forEach(x=>cnt[rank(x.entry).priority]++);
 const first=rows.find(x=>rank(x.entry).score!=null),totalW=criteria.reduce((n,c)=>n+Number(weights()[c[0]]??c[2]),0);
 const ta=(label,value,cls)=>'<div class="prio-kpi '+(cls||'')+'"><b>'+value+'</b><small>'+label+'</small></div>';
 const tabs=[['projects','▤ Proyek',allRows.length],['criteria','⚖ Kriteria & Bobot',12],['monev','📈 Monev Indikator & Manfaat',null],['reference','📘 Referensi & Formula',null]];
 let h=vh('PS','dash','Project Selection','Penilaian dan pemeringkatan prioritas proyek transformasi menggunakan metode SMART.');
 h+='<section class="psnv prio-page" aria-label="Project Selection: menu Priority">';
 h+='<div class="prio-hero"><div><h2>Prioritas Proyek Transformasi</h2><p>Pemeringkatan proyek dan inisiatif transformasi dengan metode SMART (Simple Multi-Attribute Rating Technique).</p></div><div class="prio-hero-actions">'+(edit?'<button type="button" class="prio-btn gold" id="psnv-add">+ Tambah Proyek</button>':'')+'<button type="button" class="prio-btn white" id="psnv-export">⇩ Excel (CSV)</button><button type="button" class="prio-btn white" id="psnv-report">▤ Laporan</button></div></div>';
 h+='<div class="prio-subtabs" role="tablist">'+tabs.map(([k,l,n])=>'<button type="button" role="tab" aria-selected="'+(f.tab===k)+'" data-psnv-tab="'+k+'" class="'+(f.tab===k?'active':'')+'">'+l+(n==null?'':' <em class="prio-tab-n">'+n+'</em>')+'</button>').join('')+'</div>';
 if(f.tab==='projects'){
   h+='<div class="prio-scopebar"><label>Lingkup Program <select id="psnv-prog"><option value="">Semua Program Transformasi</option>'+progVis().map(p=>'<option value="'+esc2(p.akr)+'"'+(f.prog===p.akr?' selected':'')+'>'+esc2(p.nama)+'</option>').join('')+'</select></label><span class="prio-sp"></span><span style="font-size:11px;color:#708398">Sumber: proyek WBS Modul Transformasi + usulan Project Selection</span></div>';
   h+='<div class="prio-kpis">'+ta('Proyek diranking',allRows.length,'')+ta('Prioritas Tinggi · ≥70',cnt.P1,'k-high')+ta('Prioritas Sedang · 40–69',cnt.P2,'k-mid')+ta('Prioritas Rendah · <40',cnt.P3,'k-low')+ta('Prioritas teratas',first?esc2(first.j.n):'—','k-top')+'</div>';
   h+='<div class="prio-toolbar"><input id="psnv-search" type="search" class="prio-search" placeholder="Cari proyek, unit, PIC…" value="'+esc2(f.q)+'" aria-label="Cari proyek">'+
       '<div class="prio-chips">'+[['all','Semua'],['P1','P1 Tinggi'],['P2','P2 Sedang'],['P3','P3 Rendah'],['pending','Belum dinilai']].map(([k,l])=>'<button type="button" class="prio-chip '+(f.rank===k?'on':'')+'" data-psnv-filter="'+k+'">'+l+'</button>').join('')+'</div>'+
       '<span class="prio-sp"></span><div class="prio-seg">'+[['score','Skor ↓'],['golive','Go-live'],['name','Nama']].map(([k,l])=>'<button type="button" data-psnv-sort="'+k+'" class="'+(f.sort===k?'on':'')+'">'+l+'</button>').join('')+'</div>'+
       '<div class="prio-seg"><button data-psnv-view="list" class="'+(f.view==='list'?'on':'')+'">☰ Daftar</button><button data-psnv-view="quad" class="'+(f.view==='quad'?'on':'')+'">◫ Kuadran</button></div><button type="button" class="prio-btn" id="psnv-reset">Reset</button></div>';
   if(f.view==='quad'){
     const cells=[['Tinggi / Mendesak',true,true],['Tinggi / Tidak Mendesak',true,false],['Rendah / Mendesak',false,true],['Rendah / Tidak Mendesak',false,false]];
     h+='<div class="prio-note">Kuadran indikatif berdasarkan kriteria C8 (nilai manfaat) dan C4 (urgensi waktu), bukan pengganti skor SMART.</div><div class="prio-quad">'+cells.map(([l,impact,urgent])=>{
       const group=rows.filter(x=>(Number((x.entry.scores||{}).C8)>=3)===impact&&(Number((x.entry.scores||{}).C4)>=3)===urgent);
       return '<div class="prio-quad-cell"><h4>'+l+' · '+group.length+'</h4>'+group.map(x=>'<p><button class="prio-btn" type="button" data-psnv-open="'+esc2(x.id)+'">'+esc2(x.j.n)+'</button> '+(rank(x.entry).score??'—')+'</p>').join('')+'</div>';
     }).join('')+'</div>';
   } else {
     h+='<section class="prio-list"><div class="prio-list-head"><h3>Peringkat prioritas</h3><span>Batang C1–C12 = utility per kriteria · '+rows.length+' proyek ditampilkan</span></div>';
     h+=rows.map((x,i)=>{
      const r=rank(x.entry),ss=x.entry.scores||{},cat=r.priority==='P1'?'cat-high':r.priority==='P2'?'cat-mid':r.priority==='P3'?'cat-low':'';
      const bars=criteria.map(c=>{const n=Number(ss[c[0]])||0,u=n?(c[3]==='Biaya'?5-n:n-1)/4*100:0;return '<span class="prio-utility" title="'+esc2(c[1])+'"><i style="--pct:'+u+'%"></i><b>'+c[0]+'</b></span>'}).join('');
      return '<article class="prio-row '+cat+'"><div class="prio-rank"><b>'+(i+1)+'</b><small>RANK</small></div>'+
      '<div class="prio-title"><h4>'+esc2(x.j.n)+'</h4><div class="prio-meta"><span><b>Program</b> '+esc2(x.p.nama)+'</span><span><b>UIC</b> '+esc2(x.j.uic)+'</span><span><b>Progres</b> '+x.j.pg+'%</span>'+ (x.entry.goLive?'<span><b>Go-live</b> '+esc2(x.entry.goLive)+'</span>':'')+'</div><div class="prio-utils">'+bars+'</div></div>'+
      '<div class="prio-score"><b>'+(r.score==null?'—':r.score)+'</b><small>'+(r.score==null?r.completed+'/12 terisi':'Skor / 100')+'</small><span class="prio-tag '+r.priority.toLowerCase()+'">'+(r.score==null?'Belum dinilai':r.priority)+'</span></div>'+
      '<div class="prio-actions"><button type="button" class="prio-btn" data-psnv-open="'+esc2(x.id)+'">'+(edit?'✎ Nilai / Rincian':'Rincian')+'</button></div></article>';
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
  if(b.dataset.psnvTab){UI().tab=b.dataset.psnvTab;save();render()}
  else if(b.dataset.psnvFilter){UI().rank=b.dataset.psnvFilter;save();render()}
  else if(b.dataset.psnvSort){UI().sort=b.dataset.psnvSort;save();render()}
  else if(b.dataset.psnvView){UI().view=b.dataset.psnvView;save();render()}
  else if(b.dataset.psnvOpen)edit(b.dataset.psnvOpen);
  else if(b.id==='psnv-reset'){const t=UI().tab;S.ui.psNative={q:'',prog:'',rank:'all',tab:t,sort:'score',view:'list'};save();render()}
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
 root.addEventListener('change',evt=>{if(evt.target.id==='psnv-prog'){UI().prog=evt.target.value;save();render()}});
 const input=root.querySelector('#psnv-search');
 if(input)input.addEventListener('input',()=>{UI().q=input.value;const n=input.selectionStart;save();render();const next=document.querySelector('#psnv-search');if(next){next.focus();next.setSelectionRange(n,n)}});
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