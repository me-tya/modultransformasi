/* Realisasi manfaat & indeks adopsi (2026-11-25)
   Sub-tab "Monev & Manfaat" dipindah dari Project Selection › Prioritasi:
   · target manfaat tetap di Usulan Program (Benefits Register, psBenefits);
   · realisasi & evaluasi manfaat → Project Management › Pascaproyek (tab Realisasi Manfaat & Portofolio);
   · indikator keberhasilan CM → Change Management › ADP › Indikator (panel pemindahan data lama).
   Data tetap di dokumen program (psBenefits, psProjects[].benefits/indicators); tidak ada koleksi baru. */
(function(){
'use strict';
const E=v=>esc(v==null?'':v);
const ic=t=>(typeof IC==='function'?IC(t):'');
const progs=()=>(typeof progVis==='function'?progVis():S.programs||[]).filter(p=>!S.ui.prog||p.akr===S.ui.prog);
const n=v=>{const x=parseFloat(String(v==null?'':v).replace(',','.'));return isFinite(x)?x:null};
const lastQ=o=>{const q=o.quarters||{};for(const k of ['Q4','Q3','Q2','Q1'])if(q[k]!==''&&q[k]!=null)return q[k];return o.actual==null?'':o.actual};
function pctOf(target,real,down){const t=n(target),r=n(real);if(t==null||r==null||r<0)return null;if((down&&r<=0)||(!down&&t<=0))return null;return Math.round((down?t/r:r/t)*1000)/10}
const PMO=()=>ME&&['SA','PMOK','PMOU'].includes(ME.role);

/* Baris realisasi manfaat: target program (Usulan) + manfaat tingkat proyek (data lama Monev & Manfaat) */
function rows(){const out=[];progs().forEach(p=>{
 (p.psBenefits||[]).forEach((b,i)=>out.push({id:p.akr+'|B|'+(b.id||i),_src:b,_p:p,program:p.akr,lingkup:'Program',name:b.name,indikator:b.indicator||'',base:b.baseline||'',target:b.target||'',unit:b.unit||'',owner:b.owner||'',due:b.due||'',arah:b.arah||'Naik',real:b.real||'',tglReal:b.tglReal||'',note:b.realNote||''}));
 (p.psProjects||[]).forEach(x=>(x.benefits||[]).forEach((b,i)=>out.push({id:p.akr+'|P|'+x.id+'|'+(b.id||i),_src:b,_p:p,_proj:x,program:p.akr,lingkup:'Proyek: '+(x.name||''),name:b.name,indikator:b.indicator||'',base:b.base||'',target:b.target||'',unit:b.unit||'',owner:b.owner||'',due:b.due||'',arah:b.direction||'Naik',real:lastQ(b),tglReal:b.tglReal||'',note:b.note||''})))});
 out.forEach(r=>{r.pct=pctOf(r.target,r.real,r.arah==='Turun');r.st=r.real===''||r.real==null?(r.due&&r.due<TODAY?'Belum dievaluasi':'Belum jatuh tempo'):r.pct==null?'Belum diukur':r.pct>=100?'Tercapai':r.pct>=80?'On Track':'Di bawah target'});return out}
Object.assign(CHIP,{'Tercapai':'ok','Belum diukur':'gray','Belum dievaluasi':'warn','Di bawah target':'bad'});
function saveRow(r,isNew){if(isNew){const p=S.programs.find(x=>x.akr===r.program);if(!p)return;p.psBenefits=p.psBenefits||[];
  p.psBenefits.push({id:'bn'+uid(),name:r.name,indicator:r.indikator,baseline:r.base,target:r.target,unit:r.unit,owner:r.owner,due:r.due,arah:r.arah,real:r.real,tglReal:r.tglReal,realNote:r.note});return}
 const b=r._src;if(!b)return;if(r.lingkup==='Program'){Object.assign(b,{name:r.name,indicator:r.indikator,baseline:r.base,target:r.target,unit:r.unit,owner:r.owner,due:r.due,arah:r.arah,real:r.real,tglReal:r.tglReal,realNote:r.note})}
 else{Object.assign(b,{name:r.name,indicator:r.indikator,base:r.base,target:r.target,unit:r.unit,owner:r.owner,due:r.due,direction:r.arah,actual:r.real,tglReal:r.tglReal,note:r.note});if(b.quarters)b.quarters={}}}
function delRow(r){const p=r._p;if(r.lingkup==='Program')p.psBenefits=(p.psBenefits||[]).filter(b=>b!==r._src);else if(r._proj)r._proj.benefits=(r._proj.benefits||[]).filter(b=>b!==r._src)}

function realisasi(){const R=rows(),ev=R.filter(r=>r.pct!=null),idx=ev.length?Math.round(ev.reduce((a,r)=>a+Math.min(r.pct,120),0)/ev.length):null;
 const k=(l,v,d,col)=>'<div class="kpi"><div class="l">'+l+'</div><div class="v"'+(col?' style="color:'+col+'"':'')+'>'+v+'</div><div class="d">'+d+'</div></div>';
 return '<div class="kpis">'+k('Manfaat terdaftar',R.length,'target dari Usulan Program & proyek')+k('Indeks manfaat',idx==null?'—':idx+'%','rata-rata capaian yang sudah dievaluasi','var(--ok)')+k('Tercapai',R.filter(r=>r.st==='Tercapai').length,'capaian ≥ 100%')+k('Perlu perhatian',R.filter(r=>['Di bawah target','Belum dievaluasi'].includes(r.st)).length,'di bawah target / lewat tenggat belum dievaluasi','var(--warn)')+'</div>'+
 tbl('ppManfaat',{ent:'realisasi manfaat',title:'Register Realisasi Manfaat'+ic('Target manfaat berasal dari Usulan Program › Manfaat (Benefits Register) dan terbawa otomatis. PMO mengisi realisasi saat evaluasi pascaproyek. Indeks adopsi dari Change Management menjadi masukan (Bab V angka 4 huruf g).'),add:true,edit:true,del:true,wide:true,addLabel:'Manfaat',list:()=>[],rows:()=>rows(),
  canAdd:PMO,canEdit:PMO,canDel:r=>ME&&['SA','PMOK'].includes(ME.role),label:r=>r.name,onAdd:r=>saveRow(r,true),onSave:(r,isNew)=>{if(!isNew)saveRow(r,false)},onDel:r=>delRow(r),
  cols:[{k:'program',l:'Program',t:'sel',o:()=>progs().map(p=>[p.akr,p.akr+' · '+(p.nama||'')]),req:true,fshow:r=>!r,r:r=>'<span class="code">'+E(r.program)+'</span><span class="sm">'+E(r.lingkup)+'</span>'},
   {k:'name',l:'Manfaat',req:true,w:1,r:r=>'<b>'+E(r.name)+'</b>'+(r.indikator?'<span class="sm">'+E(r.indikator)+'</span>':'')},{k:'indikator',l:'Indikator / KPI',tbl:false},
   {k:'base',l:'Baseline',tbl:false},{k:'target',l:'Target',r:r=>E(r.target||'—')+(r.unit?' '+E(r.unit):'')},{k:'unit',l:'Satuan',tbl:false},{k:'arah',l:'Arah',t:'sel',o:['Naik','Turun'],tbl:false},
   {k:'owner',l:'Benefit owner',tbl:false},{k:'due',l:'Tenggat realisasi',t:'date',r:r=>fmtD(r.due)},
   {k:'real',l:'Realisasi',info:'Nilai realisasi pada saat evaluasi; capaian dihitung otomatis terhadap target.',r:r=>r.real!==''&&r.real!=null?'<b>'+E(r.real)+'</b>'+(r.pct!=null?'<span class="sm">'+r.pct+'%</span>':''):'—'},
   {k:'tglReal',l:'Tanggal evaluasi',t:'date',tbl:false},{k:'note',l:'Catatan evaluasi',t:'ta',tbl:false},
   {k:'_st',l:'Status',frm:false,r:r=>chipSt(r.st),x:r=>r.st}]})}

/* Indeks adopsi per program = rata-rata indeks keberhasilan CM modul (Monev › Keberhasilan CM) */
function adopsiProg(p){try{const ms=mods().filter(m=>m.prog===p.akr);const v=ms.map(m=>idxMod(m.kode)).filter(x=>x!=null);return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):null}catch(e){return null}}
function manfaatProg(p){const R=rows().filter(r=>r.program===p.akr&&r.pct!=null);return R.length?Math.round(R.reduce((a,r)=>a+Math.min(r.pct,120),0)/R.length):null}
function portofolio(){const P=progs().map(p=>({p,a:adopsiProg(p),m:manfaatProg(p)}));const both=P.filter(x=>x.a!=null&&x.m!=null);
 const xp=v=>50+Math.min(100,Math.max(0,v))*4,yp=v=>450-Math.min(100,Math.max(0,v))*4;
 const svg=both.length?'<svg viewBox="0 0 520 500" style="max-width:460px;width:100%" role="img" aria-label="Matriks adopsi dan manfaat"><rect x="50" y="50" width="400" height="400" fill="#F9FBFD" stroke="#DCE3EF"/><line x1="50" y1="'+yp(80)+'" x2="450" y2="'+yp(80)+'" stroke="#D2A73C" stroke-dasharray="5 5"/><line x1="'+xp(80)+'" y1="50" x2="'+xp(80)+'" y2="450" stroke="#D2A73C" stroke-dasharray="5 5"/><text x="250" y="486" text-anchor="middle" fill="#304D70" font-size="12">Indeks adopsi (%) · Change Management</text><text x="22" y="250" transform="rotate(-90 22 250)" text-anchor="middle" fill="#304D70" font-size="12">Indeks manfaat (%) · Pascaproyek</text>'+
  both.map(x=>'<g><title>'+E(x.p.akr)+' · adopsi '+x.a+'% · manfaat '+x.m+'%</title><circle cx="'+xp(x.a)+'" cy="'+yp(x.m)+'" r="8" fill="'+(x.a<80||x.m<80?'#C65A50':'#1C5C93')+'"/><text x="'+(xp(x.a)+10)+'" y="'+(yp(x.m)+4)+'" font-size="11" fill="#1d2433">'+E(x.p.akr)+'</text></g>').join('')+'</svg>':'<div class="card empty" style="margin:0">Belum ada program yang punya kedua indeks (adopsi dari Monev CM dan manfaat yang sudah dievaluasi).</div>';
 return '<div class="g21"><div class="card"><div class="ch"><h3>Matriks Adopsi × Manfaat'+ic('Kanan atas = adopsi dan manfaat ≥ 80%. Titik merah perlu perhatian. Adopsi dari indikator keberhasilan CM (Monev › Keberhasilan CM), manfaat dari Register Realisasi Manfaat.')+'</h3></div><div class="pad" style="display:grid;place-items:center">'+svg+'</div></div>'+
 '<div class="card"><div class="ch"><h3>Per program</h3></div><div class="tscroll"><table class="tcard"><thead><tr><th>Program</th><th>Adopsi</th><th>Manfaat</th><th>Perhatian</th></tr></thead><tbody>'+
 P.map(x=>'<tr><td><span class="code">'+E(x.p.akr)+'</span> '+E(short(x.p.nama||'',36))+'</td><td>'+(x.a==null?'—':x.a+'%')+'</td><td>'+(x.m==null?'—':x.m+'%')+'</td><td>'+((x.a!=null&&x.a<80)||(x.m!=null&&x.m<80)?'<span class="chip c-warn">Ya</span>':'—')+'</td></tr>').join('')+'</tbody></table></div></div></div>'}

function view(){return (S.ui.sub&&S.ui.sub.ppv)||'eval'}
const NAV=()=>'<div class="mf-nav" style="margin:0 0 12px">'+subNav('ppv',[['eval','Register Evaluasi','Register evaluasi pascaproyek'],['manfaat','Realisasi Manfaat','Target manfaat dari Usulan Program dan realisasinya'],['porto','Portofolio Adopsi × Manfaat','Matriks indeks adopsi CM dan indeks manfaat per program']],'eval')+'</div>';

/* ---------- Panel pemindahan indikator CM lama dari Project Selection ---------- */
function oldInds(){const out=[];(S.programs||[]).forEach(p=>(p.psProjects||[]).forEach(x=>(x.indicators||[]).forEach((o,i)=>{if(!o.moved)out.push({p,x,o,i})})));return out}
function guess(p,x){try{const nm=String(x.name||'').toLowerCase().trim();const ms=mods().filter(m=>m.prog===p.akr);if(!nm)return '';const hit=ms.find(m=>String(m.nama||'').toLowerCase()===nm)||ms.find(m=>{const a=String(m.nama||'').toLowerCase();return a&&(a.includes(nm)||nm.includes(a))});return hit?hit.kode:''}catch(e){return ''}}
function migrPanel(mk){if(!ME||!['SA','CMOK','PMOK'].includes(ME.role))return '';const L=oldInds().filter(z=>!mk||guess(z.p,z.x)===mk||!guess(z.p,z.x));if(!L.length)return '';
 const opts=p=>{try{return mods().filter(m=>m.prog===p.akr).map(m=>[m.kode,m.kode+' · '+short(m.nama,40)])}catch(e){return []}};
 return '<details class="card mf-mig"><summary><b>Indikator CM dari Project Selection ('+L.length+')</b>'+ic('Indikator keberhasilan CM yang dulu diisi di Project Selection › Monev & Manfaat. Pilih modul, lalu pindahkan agar menjadi indikator modul (kode I) dan realisasinya diisi di Monev › Keberhasilan CM. Data asal tidak dihapus.')+'</summary><div class="tscroll"><table class="tcard"><thead><tr><th>Program · proyek</th><th>Indikator</th><th>Target</th><th>Realisasi terakhir</th><th>Modul tujuan</th><th></th></tr></thead><tbody>'+
 L.map((z,j)=>{const g=guess(z.p,z.x);return '<tr><td><span class="code">'+E(z.p.akr)+'</span> '+E(z.x.name)+'</td><td>'+E(z.o.name)+'</td><td>'+E(z.o.target||'—')+' '+E(z.o.unit||'')+'</td><td>'+E(lastQ(z.o)||'—')+'</td><td><select data-mfmod="'+j+'"><option value="">— pilih modul —</option>'+opts(z.p).map(o=>'<option value="'+E(o[0])+'"'+(o[0]===g?' selected':'')+'>'+E(o[1])+'</option>').join('')+'</select></td><td><button class="btn sm pri" data-act="mfMove" data-j="'+j+'" data-mk="'+E(mk||'')+'">Pindahkan</button></td></tr>'}).join('')+'</tbody></table></div></details>'}
ACT.mfMove=el=>{const mk=el.dataset.mk,L=oldInds().filter(z=>!mk||guess(z.p,z.x)===mk||!guess(z.p,z.x)),z=L[+el.dataset.j];if(!z)return;
 const sel=document.querySelector('select[data-mfmod="'+el.dataset.j+'"]'),mod=sel&&sel.value;if(!mod){toast('Pilih modul tujuan.');return}
 const t=n(z.o.target);S.ind.push({id:uid(),modul:mod,nama:z.o.name,baseline:z.o.base||'',tg:t==null?'':t,sat:z.o.unit||'',arah:z.o.direction==='Turun'?'↓':'↑',bobot:'',real:n(lastQ(z.o))==null?'':n(lastQ(z.o)),per:'',cat:'Dipindah dari Project Selection ('+z.p.akr+' · '+(z.x.name||'')+')'});
 z.o.moved=mod;log('Pindah indikator CM dari Project Selection',z.p.akr+' · '+z.o.name+' → '+mod);save();render();toast('Indikator dipindah ke '+mod+'. Lengkapi bobot di ADP › Indikator.')};

window.MTMF={NAV,realisasi,portofolio,migrPanel,rows,view,adopsiProg,manfaatProg};
})();
