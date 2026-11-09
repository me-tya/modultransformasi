/* Executive Dashboard v2 — tabbed executive cockpit. Reuses existing DX module engine and PMO filters. */
(function(){
'use strict';
const dbEsc = v=>esc(String(v??''));
const dbPct=(n,d)=>d?Math.round(n/d*1000)/10:0;
const dbN=n=>Number(n||0).toLocaleString('id-ID');
const dbColors={Tercapai:'#178653',Berjalan:'#176bd5',Terlambat:'#d93d4e',Terjadwal:'#9faec5'};
const dbTabs=[['detail','Detail Program & Modul'],['ringkas','Ringkasan Capaian'],['triwulan','Analisis per Triwulan'],['terlambat','Modul Terlambat']];
const dbRows=()=>{const groups=dxModules(dxItems());return groups.flatMap(g=>g.mods.map(m=>({g,m})))};
function dbSummary(rows,n){const r={Tercapai:0,Berjalan:0,Terlambat:0,Terjadwal:0};rows.forEach(({m})=>{const s=dxAt(m,n).st;const k=r[s]===undefined?'Terjadwal':s;r[k]++});return r}
function dbKpis(rows,n){
 const a=dbSummary(rows,n),nAll=rows.length;
 return '<div class="db-kpis" aria-label="Indikator eksekutif">'+[
 ['Total Modul',nAll,'Modul yang dipantau','all'],
 ['Tercapai',a.Tercapai,dbPct(a.Tercapai,nAll)+'% dari modul','ok'],
 ['Berjalan',a.Berjalan,dbPct(a.Berjalan,nAll)+'% dari modul','run'],
 ['Terlambat',a.Terlambat,dbPct(a.Terlambat,nAll)+'% dari modul','late'],
 ['Terjadwal',a.Terjadwal,dbPct(a.Terjadwal,nAll)+'% dari modul','wait']
 ].map(([lab,num,sub,k])=>'<button class="db-kpi db-'+k+'" data-act="dbKpi" data-k="'+k+'" title="Klik untuk lihat detail"><span>'+dbEsc(lab)+'</span><b>'+dbN(num)+'</b><small>'+dbEsc(sub)+'</small></button>').join('')+'</div>';
}
function dbChart(rows,groups){
 const mode=S.ui.dbChart||'bar',selected=(S.ui.pr||'all'),quarter=[1,2,3,4].map(q=>{const a=dbSummary(rows,q);return {q,a,t:rows.length}});
 const segments=[['Terjadwal','wait'],['Terlambat','late'],['Berjalan','run'],['Tercapai','ok']];
 const legend='<div class="db-legend">'+(mode==='vertical'?[['Target','target'],['Realisasi','actual'],['Terlambat','delay']]:[['Tercapai','ok'],['Berjalan','run'],['Terlambat','late'],['Terjadwal','wait']]).map(([s,c])=>'<span><i class="db-swatch db-sw-'+c+'"></i>'+s+'</span>').join('')+'</div>';
 const share=(a,k,t)=>dbPct(a[k],t);
 const seg=(a,k,cl,t)=>{const pct=share(a,k,t),title=k+': '+dbN(a[k])+' modul ('+pct+'%)';return '<i class="db-part db-sw-'+cl+'" style="height:'+pct+'%" title="'+dbEsc(title)+'" aria-label="'+dbEsc(title)+'">'+(pct>=9.5?'<span class="db-part-pct">'+pct+'%</span>':'')+'</i>'};
 let graph='';
 if(mode==='bar'){
  graph='<div class="db-barplot" aria-label="Grafik batang bertumpuk per triwulan dengan persentase status">'+quarter.map(({q,a,t})=>'<button class="db-barcol '+(selected===String(q)?'is-selected':'')+'" data-act="dbQuarter" data-q="'+q+'" title="Lihat detail TW '+q+'"><b>'+dbN(t)+'</b><span class="db-stack">'+segments.map(([k,cl])=>seg(a,k,cl,t)).join('')+'</span><small>TW '+q+'</small></button>').join('')+'</div>';
 }else if(mode==='vertical'){
  const measures=[['Target','target',a=>a.Tercapai+a.Berjalan+a.Terlambat],['Realisasi','actual',a=>a.Tercapai],['Terlambat','delay',a=>a.Terlambat]];
  graph='<div class="db-barplot db-barplot-grouped" aria-label="Grafik batang vertikal: target, realisasi, dan terlambat per triwulan">'+quarter.map(({q,a,t})=>{
   const tgt=a.Tercapai+a.Berjalan+a.Terlambat;
   return '<button type="button" class="db-barcol db-group-col '+(selected===String(q)?'is-selected':'')+'" data-act="dbQuarter" data-q="'+q+'" title="Buka rincian triwulan '+q+'"><b>'+dbN(tgt)+' target</b><span class="db-group-bars">'+
   measures.map(([label,cl,calc])=>{const n=calc(a),pct=dbPct(n,t),tip=label+': '+dbN(n)+' modul ('+pct+'% dari '+dbN(t)+' modul)';return '<i class="db-group-bar db-series-'+cl+'" style="height:'+(t?pct:0)+'%" title="'+dbEsc(tip)+'" aria-label="'+dbEsc(tip)+'"></i>'}).join('')+
   '</span><small>TW '+q+'</small></button>';
  }).join('')+'</div>';
 }else if(mode==='heat'){
  graph='<div class="db-heatwrap"><table class="db-heat"><thead><tr><th>Program</th>'+quarter.map(x=>'<th>TW '+x.q+'</th>').join('')+'</tr></thead><tbody>'+groups.map(g=>'<tr><th title="'+dbEsc(g.p.nama)+'">'+dbEsc(g.p.nama)+'</th>'+quarter.map(({q})=>{const total=g.mods.length,done=g.mods.filter(m=>dxAt(m,q).st==='Tercapai').length,p=dbPct(done,total);return '<td><button data-act="dbQuarter" data-q="'+q+'" style="--heat:'+p+'%" title="'+done+' dari '+total+' modul tercapai">'+p+'%</button></td>'}).join('')+'</tr>').join('')+'</tbody></table></div>';
 }else{
  graph='<div class="db-donutrow">'+quarter.map(({q,a,t})=>{const p=dbPct(a.Tercapai,t);return '<button class="db-donutcol '+(selected===String(q)?'is-selected':'')+'" data-act="dbQuarter" data-q="'+q+'"><span class="db-donut" style="--p:'+p+'%"><b>'+p+'%</b></span><small>TW '+q+'</small></button>'}).join('')+'</div>';
 }
 return '<section class="db-panel db-plot"><div class="db-ph"><div><h3>Capaian Modul per Triwulan</h3><small>Distribusi status modul berdasarkan target sampai akhir tiap triwulan</small></div><label>Model Grafik <select class="db-select" data-on="dbChart" aria-label="Model grafik"><option value="bar" '+(mode==='bar'?'selected':'')+'>Bar Bertumpuk</option><option value="vertical" '+(mode==='vertical'?'selected':'')+'>Bar Vertikal</option><option value="heat" '+(mode==='heat'?'selected':'')+'>Heatmap</option><option value="donut" '+(mode==='donut'?'selected':'')+'>Donut</option></select></label></div>'+graph+legend+'</section>';
}
function dbOverview(rows,groups,n){
 const a=dbSummary(rows,n),p=dbPct(a.Tercapai,rows.length),late=rows.filter(({m})=>dxAt(m,n).st==='Terlambat');
 return '<div class="db-overview">'+dbChart(rows,groups)+
 '<section class="db-panel db-progress"><div class="db-ph"><div><h3>Capaian Kumulatif</h3><small>Modul tercapai s.d. TW '+n+' '+S.ui.tahun+'</small></div></div><div class="db-progressbody"><div class="db-ring" style="--p:'+p+'%"><span><b>'+p+'%</b><small>Tercapai</small></span></div><div class="db-figures">'+[['Tercapai',a.Tercapai,'ok'],['Berjalan',a.Berjalan,'run'],['Terlambat',a.Terlambat,'late'],['Terjadwal',a.Terjadwal,'wait']].map(([l,v,c])=>'<div><i class="db-swatch db-sw-'+c+'"></i><span>'+l+'</span><strong>'+dbN(v)+'</strong></div>').join('')+'</div></div></section>'+
 '<section class="db-side"><div class="db-panel db-quick"><h3>Ringkasan Cepat</h3><p>'+dbN(groups.length)+' program terpantau</p><p>'+dbN(a.Tercapai)+' modul tercapai</p><p>'+dbN(a.Berjalan)+' modul berjalan</p></div><div class="db-panel db-attention"><div class="db-ph"><h3>Perlu Perhatian</h3><button data-act="dbTab" data-tab="terlambat">Lihat Semua ›</button></div><div class="db-alert"><strong>'+dbN(late.length)+' modul terlambat</strong><small>'+(late.length?dbEsc(late[0].m.n):'Tidak ada modul terlambat')+'</small></div></div></section></div>';
}
function dbIsAnnual(){return per().pr==='all'}
function dbCard(m,g,n){
 const s=dxAt(m,n),total=m.a.length,ns=Object.keys(m.subs).length,st=s.st,col=(DX_ST[st]||DX_ST.Terjadwal)[1];
 const annual=dbIsAnnual();
 const quarterBlocks=annual?'<div class="db-module-quarters" aria-label="Target dan realisasi setiap triwulan">'+
  [1,2,3,4].map(q=>{
   const a=m.a.filter(w=>+w.tm>=(q-1)*3+1&&+w.tm<=q*3);
   const achieved=a.filter(w=>doneAt(w,q*3)&&w.v).length;
   const qs=dxAt(m,q),color=(DX_ST[qs.st]||DX_ST.Terjadwal)[1];
   return '<div class="db-quarter-tile '+(a.length?'has-target':'no-target')+'" style="--qcolor:'+color+'">'+
     '<strong>TW '+q+'</strong><span>'+ (a.length?dbEsc(qs.st):'Tanpa target')+'</span>'+
     '<b>'+achieved+'/'+a.length+' <small>item</small></b>'+
     '<i class="db-quarter-track"><em style="width:'+(a.length?achieved/a.length*100:0)+'%"></em></i></div>';
  }).join('')+'</div>':'';

 return '<button class="dx-card db-modcard" style="--c:'+col+'" data-act="dxMod" data-p="'+dbEsc(g.p.akr)+'" data-j="'+dbEsc(m.n)+'" title="Buka rincian modul">'+
 '<span class="dx-top"><span class="dx-st" style="--s:'+col+'">'+dbEsc(st)+'</span>'+(s.cm?'<span class="dx-cm">★ CM</span>':'')+'</span><b class="dx-name">'+dbEsc(m.n)+'</b>'+
 '<span class="dx-sub">'+ns+' sub modul</span><span class="dx-uic">UIC: '+dbEsc(m.x.uic||'—')+'</span>'+
 '<span class="dx-tgt"><em>'+(annual?'Ringkasan akhir tahun':'TW '+ROM[n]+' '+S.ui.tahun)+'</em><b>'+dbEsc(s.lab)+'</b></span>'+quarterBlocks+
 '<span class="dx-pg"><i style="width:'+s.pg+'%;background:'+col+'"></i></span><span class="dx-meta">'+s.done+'/'+s.cum+' item selesai · '+s.pg+'% tervalidasi</span></button>';
}
function dbDetail(groups,n){
 const q=(S.ui.dbSearch||'').trim().toLowerCase(),st=S.ui.dbStatus||'';
 const filt=(g,m)=>{
  const matchesStatus=!st||(dbIsAnnual()?[1,2,3,4].some(t=>dxAt(m,t).st===st):dxAt(m,n).st===st);
  return (!q||(m.n+' '+g.p.nama+' '+m.x.uic+' '+Object.keys(m.subs).join(' ')).toLowerCase().includes(q))&&matchesStatus;
 };
 const sections=groups.map((g,i)=>{
  const filtered=g.mods.filter(m=>filt(g,m));if(!filtered.length)return '';
  const isOpen=S.ui.dbOpened==='__all__'||S.ui.dbOpened===g.p.akr||(S.ui.dbOpened==null&&i===0);
  return '<section class="db-program"><div class="db-programhead"><button data-act="dbOpen" data-p="'+dbEsc(g.p.akr)+'" aria-expanded="'+isOpen+'"><span class="dx-num">'+g.mods.length+'</span><strong>'+dbEsc(g.p.nama)+'</strong><span class="code">'+dbEsc(g.p.kode)+'</span><small>UIC Utama '+dbEsc(g.p.uic||'—')+'</small><span class="db-chev">'+(isOpen?'⌃':'⌄')+'</span></button><button class="db-link" data-act="dxProg" data-p="'+dbEsc(g.p.akr)+'">Detail program ›</button></div>'+(isOpen?'<div class="db-modgrid">'+filtered.map(m=>dbCard(m,g,n)).join('')+'</div>':'')+'</section>';
 }).join('');
 return '<div class="db-detailtoolbar"><label class="db-search"><span>⌕</span><input data-on="dbSearch" value="'+dbEsc(S.ui.dbSearch||'')+'" placeholder="Cari modul, submodul, atau UIC…" aria-label="Cari modul"></label><label>Status <select class="db-select" data-on="dbStatus"><option value="">Semua status</option>'+['Tercapai','Berjalan','Terlambat','Terjadwal'].map(s=>'<option '+((S.ui.dbStatus||'')===s?'selected':'')+'>'+s+'</option>').join('')+'</select></label><button class="db-link" data-act="dbExpand">Buka Semua</button></div>'+
 (dbIsAnnual()?'<p class="db-annual-hint">Setahun · Seluruh TW 1–TW 4 ditampilkan pada setiap modul. Filter status memeriksa semua triwulan; KPI ringkasan menunjukkan kondisi akhir tahun.</p>':'')+
 (sections||'<p class="db-empty">Tidak ada modul sesuai pencarian atau filter.</p>');
}
function dbSummaryTable(groups,n){
 const arr=groups.map(g=>{const a=dbSummary(g.mods.map(m=>({m})),n);return {g,a,count:g.mods.length,p:dbPct(a.Tercapai,g.mods.length)};}).sort((a,b)=>b.p-a.p);
 return '<div class="db-tablewrap"><table class="db-data"><thead><tr><th>Program</th><th>Modul</th><th>Tercapai</th><th>Berjalan</th><th>Terlambat</th><th>Capaian</th></tr></thead><tbody>'+arr.map(x=>'<tr data-act="dxProg" data-p="'+dbEsc(x.g.p.akr)+'"><td>'+dbEsc(x.g.p.nama)+'</td><td>'+x.count+'</td><td>'+x.a.Tercapai+'</td><td>'+x.a.Berjalan+'</td><td>'+x.a.Terlambat+'</td><td><div class="db-mini"><i style="width:'+x.p+'%"></i></div><b>'+x.p+'%</b></td></tr>').join('')+'</tbody></table></div>';
}
function dbQuarterAnalysis(groups){
 return '<div class="db-tablewrap"><table class="db-data"><thead><tr><th>Program</th>'+[1,2,3,4].map(n=>'<th>TW '+n+'</th>').join('')+'</tr></thead><tbody>'+groups.map(g=>'<tr><td>'+dbEsc(g.p.nama)+'</td>'+[1,2,3,4].map(n=>{const achieved=g.mods.filter(m=>dxAt(m,n).st==='Tercapai').length,p=dbPct(achieved,g.mods.length);return '<td><button class="db-cellbtn" data-act="dbQuarter" data-q="'+n+'"><div class="db-mini"><i style="width:'+p+'%"></i></div>'+achieved+'/'+g.mods.length+' ('+p+'%)</button></td>'}).join('')+'</tr>').join('')+'</tbody></table></div>';
}
function dbLate(groups,n){
 const late=groups.flatMap(g=>g.mods.flatMap(m=>{
  const lateQuarters=(dbIsAnnual()?[1,2,3,4]:[n]).filter(q=>dxAt(m,q).st==='Terlambat');
  return lateQuarters.length?[{g,m,s:dxAt(m,lateQuarters[lateQuarters.length-1]),quarters:lateQuarters}]:[];
 }));
 return late.length?'<div class="db-latelist">'+late.map(x=>'<button data-act="dxMod" data-p="'+dbEsc(x.g.p.akr)+'" data-j="'+dbEsc(x.m.n)+'"><span>!</span><strong>'+dbEsc(x.m.n)+'</strong><small>'+dbEsc(x.g.p.nama)+' · '+x.s.late+' item terlambat · UIC '+dbEsc(x.m.x.uic)+'</small><b>Detail ›</b></button>').join('')+'</div>':'<p class="db-empty">Tidak ada modul terlambat pada filter dan periode ini.</p>';
}
function dbTabPanel(groups,n){
 const tab=S.ui.dbTab2||'detail';
 return '<div class="db-tabs" role="tablist" aria-label="Detail eksekutif">'+dbTabs.map(([k,v])=>'<button data-act="dbTab" data-tab="'+k+'" role="tab" aria-selected="'+(k===tab)+'" class="'+(k===tab?'on':'')+'">'+v+'</button>').join('')+'</div><section class="db-panel db-tabpanel" role="tabpanel">'+(tab==='detail'?dbDetail(groups,n):tab==='ringkas'?dbSummaryTable(groups,n):tab==='triwulan'?dbQuarterAnalysis(groups):dbLate(groups,n))+'</section>';
}
function dbRender(){
 const items=dxItems(),groups=dxModules(items),rows=groups.flatMap(g=>g.mods.map(m=>({g,m})));
 const n=dbIsAnnual()?4:dxTw();
 return vh('ED','dash','Executive Dashboard','Monitoring Program Transformasi Kementerian Keuangan', '<button class="btn" data-act="dbHelp" title="Buka panduan Executive Dashboard">ⓘ Bantuan</button> <button class="btn" data-act="lapexp">⇩ Ekspor Laporan</button>')+
 '<div class="db-shell">'+fltBar({res:[items.length,items.length,'item WBS']})+dbKpis(rows,n)+dbOverview(rows,groups,n)+dbTabPanel(groups,n)+'</div>';
}
ACT.dbTab=el=>{S.ui.dbTab2=el.dataset.tab;save();render()};
ACT.dbOpen=el=>{S.ui.dbOpened=S.ui.dbOpened===el.dataset.p?'__none__':el.dataset.p;save();render()};
ACT.dbExpand=()=>{S.ui.dbOpened='__all__';save();render()};
ACT.dbQuarter=el=>{S.ui.pr=String(el.dataset.q);S.ui.dbTab2='detail';save();render()};
ACT.dbKpi=el=>{S.ui.dbStatus=({ok:'Tercapai',run:'Berjalan',late:'Terlambat',wait:'Terjadwal'})[el.dataset.k]||'';S.ui.dbTab2='detail';save();render()};
const oldOnChange=onChange;
onChange=function(el){const k=el.dataset.on,v=el.value;
 if(k==='dbChart'){S.ui.dbChart=v;save();render();return}
 if(k==='dbStatus'){S.ui.dbStatus=v;save();render();return}
 if(k==='dbSearch'){S.ui.dbSearch=v;save();return}
 return oldOnChange(el)
};
document.addEventListener('input',function(e){
 if(!e.target||e.target.dataset.on!=='dbSearch')return;
 S.ui.dbSearch=e.target.value;const pos=e.target.selectionStart;save();
 clearTimeout(window.__mtDashboardSearchTimer);
 window.__mtDashboardSearchTimer=setTimeout(function(){
  render();const input=document.querySelector('.db-search input');
  if(input){input.focus({preventScroll:true});try{input.setSelectionRange(pos,pos)}catch(_){}}
 },260);
});

/* MT-06: Bantuan Executive Dashboard */
const dbHelpMarkup="<div class=\"shell\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"dbHelpTitle\"><header class=\"top\"><div class=\"brand\"><span class=\"brandicon\">?</span><div id=\"dbHelpTitle\">Bantuan Executive Dashboard<small>Panduan praktis untuk pimpinan · Bahasa sederhana · Langsung ke tindakan</small></div></div><button class=\"btnclose\" data-act=\"dbHelpClose\" title=\"Tutup pratinjau\">✕ Tutup</button></header><div class=\"main\"><aside class=\"side\" aria-label=\"Peta menu dashboard\"><h2>Peta menu dashboard</h2><button class=\"navrow active\" data-map=\"start\" data-act=\"dbHelpMap\"><b>1</b>Ringkasan & filter</button><button class=\"navrow\" data-map=\"kpi\" data-act=\"dbHelpMap\"><b>2</b>Kartu indikator (KPI)</button><button class=\"navrow\" data-map=\"chart\" data-act=\"dbHelpMap\"><b>3</b>Capaian per triwulan</button><button class=\"navrow\" data-map=\"attention\" data-act=\"dbHelpMap\"><b>4</b>Perlu perhatian</button><button class=\"navrow\" data-map=\"detail\" data-act=\"dbHelpMap\"><b>5</b>Program & modul</button><button class=\"navrow\" data-map=\"wbs\" data-act=\"dbHelpMap\"><b>6</b>Detail WBS & bukti</button><div class=\"help\">Pilih bagian pada peta menu untuk mengetahui <b>apa yang dilihat, cara membaca, dan keputusan yang bisa diambil</b>.</div></aside><div class=\"workspace\"><nav class=\"tabbar\" role=\"tablist\" aria-label=\"Tab bantuan\"><button data-tab=\"start\" class=\"current\" data-act=\"dbHelpTab\">Mulai di Sini</button><button data-tab=\"chart\" data-act=\"dbHelpTab\">Cara Baca Grafik</button><button data-tab=\"kpi\" data-act=\"dbHelpTab\">Angka & Status</button><button data-tab=\"detail\" data-act=\"dbHelpTab\">Telusuri Detail</button><button data-tab=\"action\" data-act=\"dbHelpTab\">Tindak Lanjut Pimpinan</button><button data-tab=\"faq\" data-act=\"dbHelpTab\">FAQ</button></nav><main class=\"content\" id=\"scroller\">\n<section data-panel=\"start\"><h1>Dashboard ini menjawab tiga pertanyaan</h1><p class=\"lead\">Tidak perlu membaca semua tabel. Mulai dari ringkasan, temukan penyimpangan, lalu buka bukti di level item WBS.</p><div class=\"cards\"><div class=\"metric\"><strong>1 · Bagaimana kondisi umum?</strong><b>Ringkasan</b><small>Lihat jumlah modul dan status keseluruhan.</small></div><div class=\"metric\"><strong>2 · Apa yang perlu perhatian?</strong><b>Masalah</b><small>Identifikasi yang terlambat dan belum tervalidasi.</small></div><div class=\"metric\"><strong>3 · Siapa dan apa tindak lanjutnya?</strong><b>Keputusan</b><small>Buka modul → item WBS → PIC dan tenggat.</small></div></div><h2 class=\"subhead\">Urutan membaca dalam 1 menit</h2><div class=\"steps\"><div class=\"step\"><span class=\"num\">1</span><div><strong>Pilih tahun dan periode terlebih dahulu</strong><p>Misalnya Tahun 2026, TW IV. Program dan Unit boleh dipilih untuk mempersempit cakupan.</p></div></div><div class=\"step\"><span class=\"num\">2</span><div><strong>Baca 5 kartu indikator, lalu grafik capaian</strong><p>Catat jumlah modul tercapai, berjalan, terlambat, dan terjadwal. Cocokkan dengan periode yang dipilih.</p></div></div><div class=\"step\"><span class=\"num\">3</span><div><strong>Masuk ke daftar Perlu Perhatian atau Modul Terlambat</strong><p>Klik modul yang relevan dan telusuri item WBS untuk memastikan kendalanya.</p></div></div><div class=\"step\"><span class=\"num\">4</span><div><strong>Tetapkan tindak lanjut berdasarkan bukti</strong><p>Tentukan PIC, tenggat, dan kebutuhan eskalasi. Status tanpa bukti tervalidasi belum berarti target terpenuhi.</p></div></div></div><div class=\"alert\">Panduan ini berfokus pada keputusan pimpinan, bukan penjelasan teknis pengembangan aplikasi.</div></section>\n<section data-panel=\"chart\" class=\"hide\"><h1>Cara membaca Capaian Modul per Triwulan</h1><p class=\"lead\">Tiga batang berdampingan memperlihatkan perbandingan <b>Target, Realisasi, dan Terlambat</b> pada setiap triwulan.</p><div class=\"chart\"><div class=\"sample\">ILUSTRASI ANGKA · BUKAN DATA AKTUAL</div><div class=\"chartcols\" id=\"chartExample\"><div class=\"qtr\"><div class=\"bars\"><div class=\"bar target\" style=\"height:74%\" title=\"Target: 25 modul (73,5% dari 34)\"></div><div class=\"bar real\" style=\"height:65%\" title=\"Realisasi: 22 modul (64,7% dari 34)\"></div><div class=\"bar late\" style=\"height:7%\" title=\"Terlambat: 2 modul (5,9% dari 34)\"></div></div><label>TW I</label></div><div class=\"qtr\"><div class=\"bars\"><div class=\"bar target\" style=\"height:94%\" title=\"Target: 32 modul (94,1%)\"></div><div class=\"bar real\" style=\"height:85%\" title=\"Realisasi: 29 modul (85,3%)\"></div><div class=\"bar late\" style=\"height:10%\" title=\"Terlambat: 3 modul (8,8%)\"></div></div><label>TW II</label></div><div class=\"qtr\"><div class=\"bars\"><div class=\"bar target\" style=\"height:100%\" title=\"Target: 34 modul (100%)\"></div><div class=\"bar real\" style=\"height:94%\" title=\"Realisasi: 32 modul (94,1%)\"></div><div class=\"bar late\" style=\"height:6%\" title=\"Terlambat: 2 modul (5,9%)\"></div></div><label>TW III</label></div><div class=\"qtr\"><div class=\"bars\"><div class=\"bar target\" style=\"height:100%\" title=\"Target: 34 modul (100%)\"></div><div class=\"bar real\" style=\"height:95%\" title=\"Realisasi: 32 modul (94,1%)\"></div><div class=\"bar late\" style=\"height:6%\" title=\"Terlambat: 2 modul (5,9%)\"></div></div><label>TW IV</label></div></div><div class=\"legend\"><span><i class=\"dot\" style=\"background:#edb629\"></i>Target</span><span><i class=\"dot\" style=\"background:#159d5d\"></i>Realisasi</span><span><i class=\"dot\" style=\"background:#d9415c\"></i>Terlambat</span></div><div class=\"tip\">Arahkan kursor ke salah satu batang. Tooltip bawaan menunjukkan <b>jumlah modul dan persentase dari total modul</b> pada periode itu.</div></div><div class=\"cards\"><div class=\"panel soft\"><h3>Target (emas)</h3>Jumlah modul yang seharusnya sudah mencapai tahapnya sampai periode terpilih; lihat definisi KPI dalam aplikasi.</div><div class=\"panel soft\"><h3>Realisasi (hijau)</h3>Modul yang tercatat tercapai. Untuk verifikasi lebih dalam, buka rincian WBS dan bukti.</div><div class=\"panel soft\"><h3>Terlambat (merah)</h3>Modul yang perlu ditelusuri penyebab dan penanggung jawabnya.</div></div><h2 class=\"subhead\">Contoh interpretasi pimpinan</h2><div class=\"callout\"><b>Jika Target = 34 dan Realisasi = 32:</b> masih ada selisih 2 modul yang perlu ditelusuri statusnya. <b>Jangan otomatis menyebut keduanya terlambat</b>; cek apakah berstatus Terjadwal, Berjalan, atau Terlambat.</div></section>\n<section data-panel=\"kpi\" class=\"hide\"><div class=\"sample\" style=\"margin-bottom:6px\">CONTOH ANGKA · BUKAN DATA AKTUAL</div><h1>Memahami lima angka dan status</h1><p class=\"lead\">Angka pada kartu mengikuti filter. Jangan mencampur status modul dengan progres atau validasi bukti item WBS.</p><div class=\"cards four\"><div class=\"metric\"><strong>Total Modul</strong><b>34</b><small>Jumlah modul yang masuk filter</small></div><div class=\"metric green\"><strong>Tercapai</strong><b>32</b><small>Modul yang mencapai status target</small></div><div class=\"metric red\"><strong>Terlambat</strong><b>2</b><small>Perlu penelusuran</small></div><div class=\"metric\"><strong>Terjadwal</strong><b>0</b><small>Belum memasuki tahapan selesai</small></div></div><p class=\"sample\">ANGKA DI ATAS ILUSTRASI</p><div class=\"panel\"><h3>Istilah yang sering tertukar</h3><div class=\"tablewrap\"><table class=\"tbl\"><thead><tr><th>Istilah</th><th>Arti bagi pimpinan</th><th>Yang harus diperiksa</th></tr></thead><tbody><tr><td><span class=\"pill green\">Tercapai</span></td><td>Status modul menunjukkan target tercapai.</td><td>Item WBS dan bukti tervalidasi.</td></tr><tr><td><span class=\"pill\">Berjalan</span></td><td>Masih dalam pelaksanaan.</td><td>Jadwal, hambatan, estimasi penyelesaian.</td></tr><tr><td><span class=\"pill red\">Terlambat</span></td><td>Melewati tenggat/periode yang ditentukan.</td><td>PIC, akar masalah, keputusan eskalasi.</td></tr><tr><td><span class=\"pill\">Terjadwal</span></td><td>Belum masuk jadwal target.</td><td>Tenggat berikutnya, bukan langsung dikategorikan terlambat.</td></tr><tr><td><span class=\"pill\">Menunggu validasi</span></td><td>Bukti sudah diajukan, belum sah sebagai capaian.</td><td>Validasi PMO Pusat atas bukti.</td></tr></tbody></table></div></div><div class=\"alert\">Status tercapai ≠ bukti sudah divalidasi untuk seluruh item. Gunakan detail item WBS sebelum menyimpulkan kinerja.</div></section>\n<section data-panel=\"detail\" class=\"hide\"><h1>Dari ringkasan menuju bukti WBS</h1><p class=\"lead\">Semua informasi dapat ditelusuri berjenjang. Tidak harus langsung membuka modul Project Management.</p><div class=\"flow\"><span>Dashboard</span><em>›</em><span>Program</span><em>›</em><span>Modul</span><em>›</em><span>Submodul</span><em>›</em><span>Item WBS</span><em>›</em><span>Bukti & PIC</span></div><h2 class=\"subhead\">Contoh pencarian kendala</h2><div class=\"panel\"><div class=\"tablewrap\"><table class=\"tbl\"><thead><tr><th>Kode</th><th>Output</th><th>Status</th><th>PIC</th><th>Aksi</th></tr></thead><tbody><tr><td><b>OA-38</b></td><td>User Acceptance Test (UAT)</td><td><span class=\"pill red\">Terlambat</span></td><td>BaTii (Puspensi)</td><td><button class=\"action\" data-act=\"dbHelpWbs\">Lihat contoh detail ›</button></td></tr><tr><td><b>OA-39</b></td><td>Vulnerability Testing (VT)</td><td><span class=\"pill\">Berjalan</span></td><td>BaTii (Pusilki)</td><td><button class=\"action\" data-act=\"dbHelpWbs\">Lihat contoh detail ›</button></td></tr></tbody></table></div></div><div class=\"panel soft hide\" id=\"wbsExample\"><h3>Detail WBS · OA-38 (contoh)</h3><div class=\"cards\"><div class=\"metric\"><strong>Output</strong><b style=\"font-size:14px\">UAT</b><small>User Acceptance Test</small></div><div class=\"metric\"><strong>Tenggat</strong><b style=\"font-size:14px\">15 Okt 2026</b><small>TW IV</small></div><div class=\"metric\"><strong>Status bukti</strong><b style=\"font-size:14px\">Belum diunggah</b><small>Perlu tindak lanjut PIC</small></div></div><p>Dalam aplikasi nyata, baris WBS akan membuka modal detail yang memuat jalur Lv 1–Lv 6, target, realisasi, penanggung jawab dan bukti.</p></div><div class=\"tip\">Prinsip utama: <b>klik baris modul → klik baris WBS → periksa bukti</b>. Jika bukti belum ada, tindak lanjut diarahkan kepada PIC terkait.</div></section>\n<section data-panel=\"action\" class=\"hide\"><h1>Apa tindak lanjut yang perlu diminta?</h1><p class=\"lead\">Gunakan matriks keputusan agar rapat pimpinan menghasilkan penugasan yang jelas, bukan sekadar membaca laporan.</p><div class=\"panel\"><div class=\"tablewrap\"><table class=\"tbl\"><thead><tr><th>Kondisi</th><th>Pertanyaan pimpinan</th><th>Aksi berikutnya</th></tr></thead><tbody><tr><td><span class=\"pill red\">Terlambat</span></td><td>Apa penyebab dan dampaknya?</td><td>Minta PIC, rencana pemulihan, tenggat baru, eskalasi jika perlu.</td></tr><tr><td><span class=\"pill\">Berjalan, berisiko</span></td><td>Apa hambatan dan dependensinya?</td><td>Putuskan dukungan lintas unit atau prioritas sumber daya.</td></tr><tr><td><span class=\"pill\">Menunggu validasi</span></td><td>Apakah buktinya lengkap dan layak?</td><td>Percepat validasi, jangan hitung sebagai tervalidasi dulu.</td></tr><tr><td><span class=\"pill green\">Tercapai</span></td><td>Apakah hasil diterima dan manfaatnya mulai terukur?</td><td>Validasi output, rencanakan evaluasi manfaat.</td></tr></tbody></table></div></div><h2 class=\"subhead\">Format ringkas bahan rapat</h2><div class=\"panel soft\"><strong>Isu → Bukti → Dampak → PIC → Tenggat → Keputusan</strong><p style=\"margin:7px 0;color:#687d92;font-size:12px\">Contoh: UAT belum selesai → bukti belum diunggah → memengaruhi jadwal pengujian → Puspensi → batas pemulihan disepakati → pimpinan meminta rencana aksi tertulis.</p><button class=\"action\" data-act=\"dbHelpCopy\">Salin format rapat</button></div><div class=\"callout\">Sebaiknya setiap keputusan ditindaklanjuti pada WBS/Change Request yang relevan, agar dapat dimonitor pada periode berikutnya.</div></section>\n<section data-panel=\"faq\" class=\"hide\"><h1>Pertanyaan yang sering muncul</h1><p class=\"lead\">Jawaban singkat dan langsung, untuk pimpinan yang tidak setiap hari membuka aplikasi.</p><details class=\"faq\" open><summary>Kenapa grafik menunjukkan target dan realisasi berbeda?</summary><p>Target dan realisasi menggambarkan ukuran berbeda. Selisihnya perlu dibaca bersama status modul dan periode filter. Klik baris untuk mendapatkan konteks.</p></details><details class=\"faq\"><summary>Kalau capaian 94%, apakah 6% sisanya otomatis terlambat?</summary><p>Tidak. Sisanya bisa Berjalan, Terlambat, atau Terjadwal. Periksa distribusi status sebelum menyimpulkan adanya keterlambatan.</p></details><details class=\"faq\"><summary>Bagaimana mengetahui siapa penanggung jawabnya?</summary><p>Buka Detail Program & Modul, pilih modul, kemudian klik baris item WBS. Lihat UIC Utama, UIC Pendukung dan jadwal pada modal detail.</p></details><details class=\"faq\"><summary>Apa beda selesai aktual dengan bukti tervalidasi?</summary><p>Selesai aktual mencatat pelaksanaan pekerjaan, sedangkan bukti tervalidasi mensyaratkan pemeriksaan bukti sesuai kewenangan PMO.</p></details><details class=\"faq\"><summary>Bagaimana cara memeriksa satu Unit Eselon I saja?</summary><p>Gunakan filter Unit di atas dashboard. Periksa juga Tahun, Periode, dan Program agar pembacaan angka konsisten.</p></details><details class=\"faq\"><summary>Apakah capaian dashboard sudah menunjukkan manfaat transformasi?</summary><p>Belum tentu. Output proyek dan capaian WBS perlu dibedakan dari outcome serta benefit realization. Evaluasi manfaat membutuhkan indikator dan pengukuran tersendiri.</p></details><details class=\"faq\"><summary>Di mana saya meminta tindak lanjut atas proyek terlambat?</summary><p>Temukan modul terlambat, buka item WBS, lalu tetapkan PIC dan tenggat. Jika perubahan target/jadwal formal diperlukan, rujuk mekanisme Change Request.</p></details></section>\n</main><footer class=\"foot\"><span>Panduan penggunaan Executive Dashboard · Angka contoh bukan data aktual</span><div><button class=\"btn\" data-act=\"dbHelpTab\" data-tab=\"start\">Kembali ke awal</button> <button class=\"btn primary\" data-act=\"dbHelpNext\">Tab Berikutnya ›</button></div></footer></div></div></div>";
const dbHelpTabOrder=['start','chart','kpi','detail','action','faq'];
let dbHelpReturnFocus=null;
function dbHelpShow(){
 if(document.getElementById('dbHelpModal'))return;
 document.body.insertAdjacentHTML('beforeend','<div id="dbHelpModal" class="db-help-overlay"><button type="button" class="db-help-backdrop" data-act="dbHelpClose" aria-label="Tutup panel bantuan"></button>'+dbHelpMarkup+'</div>');
 document.body.classList.add('db-help-body-open');
 dbHelpSwitch('start');
 document.querySelector('#dbHelpModal .btnclose')?.focus({preventScroll:true});
}
function dbHelpSwitch(tab){
 const m=document.getElementById('dbHelpModal');
 if(!m||!dbHelpTabOrder.includes(tab))return;
 m.querySelectorAll('[data-panel]').forEach(e=>e.classList.toggle('hide',e.dataset.panel!==tab));
 m.querySelectorAll('.tabbar [data-tab]').forEach(e=>{const current=e.dataset.tab===tab;e.classList.toggle('current',current);e.setAttribute('aria-selected',String(current))});
 const map={start:'start',chart:'chart',kpi:'kpi',detail:'detail',action:'attention',faq:'start'}[tab];
 m.querySelectorAll('.side [data-map]').forEach(e=>e.classList.toggle('active',e.dataset.map===map));
 const scroller=m.querySelector('#scroller');if(scroller)scroller.scrollTop=0;
}
ACT.dbHelp=el=>{dbHelpReturnFocus=el;dbHelpShow()};
/* Khusus saat berada pada Executive Dashboard: kedua pintu Bantuan membuka MT-06.
   Halaman lain tetap menggunakan aksi Bantuan semula. */
const dbExecutivePriorGlobalHelp=ACT.helphome;
ACT.helphome=(el,event,row)=>{
 if(typeof VIEW!=='undefined'&&VIEW==='dashboard')return ACT.dbHelp(el);
 if(typeof dbExecutivePriorGlobalHelp==='function')return dbExecutivePriorGlobalHelp(el,event,row);
};
const dbExecutivePriorContextHelp=ACT.help;
ACT.help=(el,event,row)=>{
 const requested=el?.dataset?.v||(typeof VIEW!=='undefined'?VIEW:'');
 if(requested==='dashboard')return ACT.dbHelp(el);
 if(typeof dbExecutivePriorContextHelp==='function')return dbExecutivePriorContextHelp(el,event,row);
};
ACT.dbHelpClose=()=>{
 document.getElementById('dbHelpModal')?.remove();
 document.body.classList.remove('db-help-body-open');
 if(dbHelpReturnFocus&&dbHelpReturnFocus.isConnected)dbHelpReturnFocus.focus({preventScroll:true});
 dbHelpReturnFocus=null;
};
ACT.dbHelpTab=el=>dbHelpSwitch(el.dataset.tab||'start');
ACT.dbHelpMap=el=>{
 const map=el.dataset.map;
 dbHelpSwitch(({start:'start',kpi:'kpi',chart:'chart',attention:'action',detail:'detail',wbs:'detail'})[map]||'start');
 const m=document.getElementById('dbHelpModal');
 m?.querySelectorAll('.side [data-map]').forEach(x=>x.classList.toggle('active',x.dataset.map===map));
 if(map==='wbs')ACT.dbHelpWbs();
};
ACT.dbHelpNext=()=>{
 const m=document.getElementById('dbHelpModal');if(!m)return;
 const t=m.querySelector('.tabbar [data-tab].current')?.dataset.tab||'start';
 dbHelpSwitch(dbHelpTabOrder[(dbHelpTabOrder.indexOf(t)+1)%dbHelpTabOrder.length]);
};
ACT.dbHelpWbs=()=>{
 const e=document.querySelector('#dbHelpModal #wbsExample');if(!e)return;
 e.classList.remove('hide');e.scrollIntoView({behavior:'smooth',block:'nearest'});
};
ACT.dbHelpCopy=el=>{
 const value='Isu | Bukti | Dampak | PIC | Tenggat | Keputusan',fallback=()=>window.prompt('Salin format rapat:',value);
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(value).then(()=>{if(el?.isConnected)el.textContent='✓ Format disalin'}).catch(fallback)}else fallback();
};
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&document.getElementById('dbHelpModal')){event.preventDefault();event.stopPropagation();ACT.dbHelpClose()}
},true);
/* End MT-06 */

viewDash=dbRender;
if(typeof VIEW!=='undefined'&&VIEW==='dashboard'&&typeof ME!=='undefined'&&ME)render();
})();