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
 const legend='<div class="db-legend">'+[['Tercapai','ok'],['Berjalan','run'],['Terlambat','late'],['Terjadwal','wait']].map(([s,c])=>'<span><i class="db-swatch db-sw-'+c+'"></i>'+s+'</span>').join('')+'</div>';
 let graph='';
 if(mode==='bar'){
  graph='<div class="db-barplot">'+quarter.map(({q,a,t})=>'<button class="db-barcol '+(selected===String(q)?'is-selected':'')+'" data-act="dbQuarter" data-q="'+q+'" title="Lihat detail TW '+q+'"><b>'+dbN(t)+'</b><span class="db-stack">'+[['Terjadwal','wait'],['Terlambat','late'],['Berjalan','run'],['Tercapai','ok']].map(([k,cl])=>'<i class="db-part db-sw-'+cl+'" style="height:'+(t?a[k]/t*100:0)+'%"></i>').join('')+'</span><small>TW '+q+'</small></button>').join('')+'</div>';
 }else if(mode==='heat'){
  graph='<div class="db-heatwrap"><table class="db-heat"><thead><tr><th>Program</th>'+quarter.map(x=>'<th>TW '+x.q+'</th>').join('')+'</tr></thead><tbody>'+groups.map(g=>'<tr><th title="'+dbEsc(g.p.nama)+'">'+dbEsc(g.p.nama)+'</th>'+quarter.map(({q})=>{const total=g.mods.length,done=g.mods.filter(m=>dxAt(m,q).st==='Tercapai').length,p=dbPct(done,total);return '<td><button data-act="dbQuarter" data-q="'+q+'" style="--heat:'+p+'%" title="'+done+' dari '+total+' modul tercapai">'+p+'%</button></td>'}).join('')+'</tr>').join('')+'</tbody></table></div>';
 }else{
  graph='<div class="db-donutrow">'+quarter.map(({q,a,t})=>{const p=dbPct(a.Tercapai,t);return '<button class="db-donutcol '+(selected===String(q)?'is-selected':'')+'" data-act="dbQuarter" data-q="'+q+'"><span class="db-donut" style="--p:'+p+'%"><b>'+p+'%</b></span><small>TW '+q+'</small></button>'}).join('')+'</div>';
 }
 return '<section class="db-panel db-plot"><div class="db-ph"><div><h3>Peta Modul per Triwulan</h3><small>Distribusi status modul berdasarkan target sampai akhir tiap triwulan</small></div><label>Model Grafik <select class="db-select" data-on="dbChart" aria-label="Model grafik"><option value="bar" '+(mode==='bar'?'selected':'')+'>Bar Bertumpuk</option><option value="heat" '+(mode==='heat'?'selected':'')+'>Heatmap</option><option value="donut" '+(mode==='donut'?'selected':'')+'>Donut</option></select></label></div>'+graph+legend+'</section>';
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
 return vh('ED','dash','Executive Dashboard','Monitoring Program Transformasi Kementerian Keuangan', '<button class="btn" data-act="lapexp">⇩ Ekspor Laporan</button>')+
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
viewDash=dbRender;
if(typeof VIEW!=='undefined'&&VIEW==='dashboard'&&typeof ME!=='undefined'&&ME)render();
})();