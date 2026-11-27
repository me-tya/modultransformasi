/* Buat WBS dari Charter Program (Project Selection › Charter Program).
   Susunan level mengikuti Template WBS Standar:
     Lv 2 = Program · Lv 3 = Proyek (pilihan) · Lv 4 = Key Milestone / Tindakan Rencana Kerja · Lv 5 = Kriteria Penyelesaian.
   - Jadwal: dari Rencana Kerja yang cocok dengan milestone (Mulai–Selesai); bila tidak ada, 1 Jan – 31 Des tahun milestone.
   - UIC: dari Rencana Kerja; bila kosong, UIC Utama/Pendukung program.
   - Semua baris dapat disunting dan dipilih sebelum disimpan. Baris yang jalurnya sudah ada di WBS program tidak dicentang.
   - Tujuan simpan: program sudah Ditetapkan → langsung ke WBS aktif (PMO › WBS & Progres);
     belum ditetapkan → Draft WBS program (psWbsDraft) dan otomatis masuk WBS saat penetapan.
   - Kode: [PREFIX]-[nomor] melanjutkan nomor terbesar yang sudah dipakai prefix tersebut. */
(function(){
'use strict';
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const T=v=>String(v==null?'':v).replace(/\r/g,'').trim();
const strip=s=>T(s).replace(/^\s*(?:[•▪●◦▸\-–]|\d+[.)])\s*/,'').replace(/\s+/g,' ').trim();
const list=v=>(Array.isArray(v)?v:T(v).split('\n')).flatMap(x=>String(x==null?'':x).split('\n')).map(strip).filter(Boolean);
const norm=s=>strip(s).toLowerCase().replace(/[^a-z0-9à-ÿ ]+/gi,' ').replace(/\s+/g,' ').trim();
const STOP=new Set(['dan','atau','yang','di','ke','dari','untuk','dengan','pada','dalam','oleh','serta','ditetapkan','selesai','disepakati','tersedianya','telah']);
const words=s=>norm(s).split(' ').filter(w=>w.length>2&&!STOP.has(w));
/* Kemiripan dua teks: sama/termuat, atau ≥60% kata kunci teks terpendek ada di teks lain. */
function sim(a,b){const x=norm(a),y=norm(b);if(!x||!y)return 0;if(x===y)return 1;if(x.includes(y)||y.includes(x))return .9;
 const A=words(a),B=new Set(words(b));if(!A.length||!B.size)return 0;const hit=A.filter(w=>B.has(w)).length;return hit/Math.min(A.length,B.size)}
const isD=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''));
const lastDay=ym=>{const m=String(ym||'').match(/^(\d{4})-(\d{2})/);if(!m)return '';const d=new Date(+m[1],+m[2],0).getDate();return m[1]+'-'+m[2]+'-'+String(d).padStart(2,'0')};
const firstDay=ym=>{const m=String(ym||'').match(/^(\d{4})-(\d{2})/);return m?m[1]+'-'+m[2]+'-01':''};
const say=m=>{try{if(typeof toast==='function')toast(m);else alert(m)}catch(_){}};
const progById=id=>(S.programs||[]).find(x=>String(x.id)===String(id));
const charterOf=p=>{const X=window.MT_CHX;const src=X&&X.fromProgram?X.fromProgram(p):null;return src&&src.c?src.c:null};

function canCreate(p){
 try{if(typeof lv!=='function'||!lv('wbs').includes('C'))return false;return typeof canW!=='function'||canW('wbs','C',p&&p.uic)}catch(_){return false}
}
function prefixOf(p){
 const a=T(p.akr);if(/^[A-Za-z]{2,10}$/.test(a))return a.toUpperCase();
 const k=(T(p.kodeResmi)||T(p.kode)).match(/[A-Za-z]{2,}/g);if(k&&k.length)return k[k.length-1].toUpperCase().slice(0,10);
 const ini=T(p.nama).split(/\s+/).filter(w=>/^[A-Za-z]/.test(w)&&!STOP.has(w.toLowerCase())).map(w=>w[0]).join('').toUpperCase();
 return (ini||'PRG').slice(0,6);
}
function projectsOf(p){
 const all=p.psProjects||[],ids=Array.isArray(p.psSelectedProjectIds)&&p.psSelectedProjectIds.length?new Set(p.psSelectedProjectIds.map(String)):null;
 return all.filter(x=>x&&T(x.name)&&(ids?ids.has(String(x.id)):x.included!==false));
}
const destDraft=p=>p.psStatus!=='Ditetapkan';
const pool=p=>destDraft(p)?(p.psWbsDraft||[]):(S.wbs||[]);
function usedNums(prefix){const re=new RegExp('^'+prefix+'-(\\d+)$','i'),n=[];
 (S.wbs||[]).concat(...(S.programs||[]).map(q=>q.psWbsDraft||[])).forEach(w=>{const m=String(w&&w.k||'').match(re);if(m)n.push(+m[1])});return n}

/* Susun baris draf dari charter. */
function build(p,c,opt){
 const yr=opt.year,inY=y=>!yr||+y===+yr,uic=T(p.uic),pend=T(p.pend);
 const ms=(c.ms||[]).filter(m=>T(m.t)&&inY(m.y)).slice().sort((a,b)=>(+a.y||0)-(+b.y||0));
 const kp=(c.kp||[]).filter(k=>T(k.m)||list(k.k).length);
 const rk=(c.rk||[]).filter(r=>T(r.t));
 const usedK=new Set(),usedR=new Set(),rows=[];
 const rkFor=t=>{let best=-1,bs=0;rk.forEach((r,i)=>{if(usedR.has(i))return;const s=sim(t,r.t);if(s>bs){bs=s;best=i}});return bs>=.6?best:-1};
 const kpFor=t=>{const out=[];kp.forEach((k,i)=>{if(!usedK.has(i)&&sim(t,k.m)>=.6)out.push(i)});return out};
 const push=(l4,crit,s,f,u,d,src)=>{if(!crit.length){rows.push({l4,l5:'',s,f,u,d,src});return}crit.forEach(x=>rows.push({l4,l5:x,s,f,u,d,src}))};
 ms.forEach(m=>{const t=strip(m.t).replace(/\.$/,''),y=+m.y||+yr||+c.p1;
  const ri=rkFor(t),r=ri>=0?rk[ri]:null;if(ri>=0)usedR.add(ri);
  const ki=kpFor(t);ki.forEach(i=>usedK.add(i));
  const crit=ki.flatMap(i=>list(kp[i].k));
  push(t,crit,r&&firstDay(r.s)||y+'-01-01',r&&lastDay(r.e)||y+'-12-31',r&&T(r.u)||uic,r&&T(r.pd)||pend,'Milestone '+y+(r?' + Rencana Kerja':'')+(ki.length?' + Kriteria':''))});
 rk.forEach((r,i)=>{if(usedR.has(i))return;const s=firstDay(r.s),f=lastDay(r.e);
  if(yr&&!((s||'').startsWith(String(yr))||(f||'').startsWith(String(yr))||(s&&f&&s.slice(0,4)<=String(yr)&&f.slice(0,4)>=String(yr))))return;
  const t=strip(r.t);const ki=kpFor(t);ki.forEach(j=>usedK.add(j));
  push(t,ki.flatMap(j=>list(kp[j].k)),s||((yr||c.p1)+'-01-01'),f||((yr||c.p1)+'-12-31'),T(r.u)||uic,T(r.pd)||pend,'Rencana Kerja'+(ki.length?' + Kriteria':''))});
 kp.forEach((k,i)=>{if(usedK.has(i))return;const y=+yr||+c.p1;
  push(strip(k.m)||'Milestone',list(k.k),y+'-01-01',y+'-12-31',uic,pend,'Kriteria Penyelesaian')});
 const have=new Set(pool(p).filter(w=>w&&w.prog===p.akr&&!w.arsip).map(w=>(w.p||[]).map(norm).join('>')));
 rows.forEach(r=>{r.dup=have.has(pathOf(p,opt,r).map(norm).join('>'));r.on=!r.dup});
 return rows;
}
const pathOf=(p,opt,r)=>[T(p.nama),opt.lv3,r.l4,r.l5].map(T).filter(Boolean);

function open(pid){
 const p=progById(pid);if(!p){say('Program tidak ditemukan.');return}
 const c=charterOf(p);if(!c){say('Charter Program belum tersedia.');return}
 if(!canCreate(p)){say('Anda tidak memiliki hak menyusun WBS untuk UIC program ini.');return}
 const y1=+c.p1||+p.psYear||new Date().getFullYear(),y2=Math.max(y1,+c.p2||y1),years=[];for(let y=y1;y<=y2&&years.length<10;y++)years.push(y);
 const prj=projectsOf(p),lv3Opts=prj.map(x=>T(x.name)).concat(['Pelaksanaan Program']);
 const opt={year:years.includes(+p.psYear)?+p.psYear:0,lv3:prj.length===1?T(prj[0].name):'Pelaksanaan Program',prefix:prefixOf(p)};
 let rows=build(p,c,opt);
 document.querySelectorAll('.cwb-ov').forEach(x=>x.remove());
 const ov=document.createElement('div');ov.className='chx-ov cwb-ov';
 const draft=destDraft(p);
 ov.innerHTML='<section class="chx-dlg cwb-dlg" role="dialog" aria-modal="true" aria-label="Buat WBS dari Charter"><header><div><b>Buat WBS dari Charter</b><small>'+E(p.nama)+' · '+(draft?'disimpan sebagai Draft WBS program, aktif setelah program ditetapkan':'disimpan ke PMO › WBS &amp; Progres')+'</small></div><button type="button" data-cwb-close aria-label="Tutup">×</button></header>'+
  '<main><div class="cwb-top">'+
   '<label>Tahun<select data-cwb-opt="year">'+[[0,'Semua ('+y1+(y2>y1?'–'+y2:'')+')']].concat(years.map(y=>[y,String(y)])).map(([v,l])=>'<option value="'+v+'"'+(+v===+opt.year?' selected':'')+'>'+E(l)+'</option>').join('')+'</select></label>'+
   '<label class="cwb-grow">Lv 3 · Proyek<select data-cwb-opt="lv3">'+lv3Opts.map(n=>'<option'+(n===opt.lv3?' selected':'')+'>'+E(n)+'</option>').join('')+'</select></label>'+
   '<label>Prefix kode<input data-cwb-opt="prefix" value="'+E(opt.prefix)+'" maxlength="10" spellcheck="false"></label>'+
   '<span class="cwb-info" tabindex="0" title="Lv 2 = Program · Lv 3 = Proyek · Lv 4 = Key Milestone / Tindakan Rencana Kerja · Lv 5 = Kriteria Penyelesaian. Jadwal diambil dari Rencana Kerja yang cocok; bila tidak ada, 1 Jan – 31 Des tahun milestone. Baris yang jalurnya sudah ada di WBS tidak dicentang.">ⓘ</span>'+
   '<span class="cwb-sum" data-cwb-sum></span>'+
  '</div><div class="cwb-wrap"><table class="cwb-tb"><colgroup><col style="width:34px"><col style="width:88px"><col><col><col style="width:128px"><col style="width:128px"><col style="width:120px"><col style="width:140px"></colgroup>'+
   '<thead><tr><th><input type="checkbox" data-cwb-all aria-label="Pilih semua"></th><th>Kode</th><th>Lv 4 · Milestone / Tindakan</th><th>Lv 5 · Deliverable (Kriteria)</th><th>Mulai</th><th>Selesai</th><th>UIC Utama</th><th>UIC Pendukung</th></tr></thead><tbody data-cwb-body></tbody></table></div></main>'+
  '<footer><span class="cwb-note">Baris dapat disunting langsung. Bobot, target bulanan dan cakupan UE I dihitung otomatis dari jadwal dan UIC.</span><span style="flex:1"></span><button type="button" class="btn" data-cwb-close>Batal</button><button type="button" class="btn" data-cwb-xlsx title="Unduh baris terpilih dalam format Template WBS (sheet Data) yang bisa diimpor lagi lewat Import Excel">⇩ Export Excel</button><button type="button" class="btn mt-dlbtn" data-cwb-save>Simpan ke WBS</button></footer></section>';
 document.body.appendChild(ov);
 const body=ov.querySelector('[data-cwb-body]'),sum=ov.querySelector('[data-cwb-sum]'),btn=ov.querySelector('[data-cwb-save]'),all=ov.querySelector('[data-cwb-all]');
 const codes=()=>{const pre=String(opt.prefix||'').toUpperCase();let n=Math.max(0,...usedNums(pre)),w=Math.max(3,...usedNums(pre).map(x=>String(x).length));
  return rows.map(r=>r.on?pre+'-'+String(++n).padStart(w,'0'):'')};
 const paint=()=>{const k=codes();
  body.innerHTML=rows.length?rows.map((r,i)=>'<tr class="'+(r.on?'':'off')+'"><td><input type="checkbox" data-cwb-on="'+i+'"'+(r.on?' checked':'')+' aria-label="Sertakan baris '+(i+1)+'"></td>'+
   '<td class="cwb-k">'+(r.on?E(k[i]):(r.dup?'<span class="cwb-dup" title="Jalur ini sudah ada di WBS program">sudah ada</span>':'—'))+'</td>'+
   '<td><textarea rows="2" data-cwb-f="l4" data-i="'+i+'" title="'+E(r.src)+'">'+E(r.l4)+'</textarea></td>'+
   '<td><textarea rows="2" data-cwb-f="l5" data-i="'+i+'" placeholder="(opsional)">'+E(r.l5)+'</textarea></td>'+
   '<td><input type="date" data-cwb-f="s" data-i="'+i+'" value="'+E(r.s)+'"></td><td><input type="date" data-cwb-f="f" data-i="'+i+'" value="'+E(r.f)+'"></td>'+
   '<td><input data-cwb-f="u" data-i="'+i+'" value="'+E(r.u)+'"></td><td><input data-cwb-f="d" data-i="'+i+'" value="'+E(r.d)+'"></td></tr>').join(''):
   '<tr><td colspan="8" class="cwb-empty">Charter belum memiliki Key Milestones, Kriteria Penyelesaian, atau Rencana Kerja'+(opt.year?' untuk tahun '+opt.year:'')+'.</td></tr>';
  const n=rows.filter(r=>r.on).length,d=rows.filter(r=>r.dup).length;
  sum.textContent=rows.length+' baris · '+n+' dipilih'+(d?' · '+d+' sudah ada':'');
  btn.textContent='Simpan '+n+' item ke WBS';btn.disabled=!n;ov.querySelector('[data-cwb-xlsx]').disabled=!n;
  all.checked=!!rows.length&&rows.every(r=>r.on);all.indeterminate=n>0&&!all.checked};
 paint();
 const close=()=>{ov.remove();document.removeEventListener('keydown',esc,true)},esc=e=>{if(e.key==='Escape'){e.stopPropagation();close()}};document.addEventListener('keydown',esc,true);
 ov.addEventListener('input',e=>{const t=e.target,f=t.dataset.cwbF;if(f){rows[+t.dataset.i][f]=t.value;return}
  if(t.dataset.cwbOpt==='prefix'){const v=t.value.toUpperCase().replace(/[^A-Z]/g,'');if(v!==t.value)t.value=v;opt.prefix=v;const k=codes();body.querySelectorAll('tr').forEach((tr,i)=>{const td=tr.querySelector('.cwb-k');if(td&&rows[i]&&rows[i].on)td.textContent=k[i]})}});
 ov.addEventListener('change',e=>{const t=e.target;
  if(t.dataset.cwbOn!=null){rows[+t.dataset.cwbOn].on=t.checked;paint();return}
  if(t.matches('[data-cwb-all]')){rows.forEach(r=>r.on=t.checked);paint();return}
  const o=t.dataset.cwbOpt;if(o==='year'||o==='lv3'){opt[o]=o==='year'?+t.value:t.value;rows=build(p,c,opt);paint()}});
 ov.addEventListener('click',e=>{const t=e.target;if(t===ov||t.closest('[data-cwb-close]')){close();return}
  const xl=t.closest('[data-cwb-xlsx]');if(!xl&&!t.closest('[data-cwb-save]'))return;
  const pre=String(opt.prefix||'').toUpperCase();if(!/^[A-Z]{2,10}$/.test(pre)){say('Prefix kode harus 2–10 huruf, mis. OA atau CORE.');return}
  const pick=rows.map((r,i)=>[r,i]).filter(([r])=>r.on);
  for(const [r,i] of pick){if(!T(r.l4)){say('Baris '+(i+1)+': Lv 4 wajib diisi.');return}if(!isD(r.s)||!isD(r.f)){say('Baris '+(i+1)+': tanggal Mulai dan Selesai wajib diisi.');return}if(r.f<r.s){say('Baris '+(i+1)+': tanggal Selesai harus ≥ Mulai.');return}}
  if(xl){exportXlsx(p,opt,pick,codes());return}
  const k=codes(),taken=new Set((S.wbs||[]).concat(...(S.programs||[]).map(q=>q.psWbsDraft||[])).map(w=>w&&w.k));
  if(pick.some(([,i])=>taken.has(k[i]))){say('Kode bentrok dengan kode yang sudah ada. Ubah prefix kode.');return}
  const dW=typeof durW==='function'?durW:(s,f)=>Math.round((new Date(f)-new Date(s))/864e5)+1;
  const ue=(u,d)=>{try{return typeof ueFrom==='function'?ueFrom(u,d):[]}catch(_){return []}};
  const items=pick.map(([r,i])=>({id:k[i],k:k[i],prog:p.akr,p:pathOf(p,opt,r),s:r.s,f:r.f,u:T(r.u),d:T(r.d),j:'',w:dW(r.s,r.f),tm:+r.f.slice(5,7),rm:0,ue:ue(T(r.u),T(r.d)),v:0,cm:'',arsip:false,src:'charter'}));
  if(draft){p.psWbsDraft=(p.psWbsDraft||[]).concat(items)}
  else{S.wbs=S.wbs||[];S.wbs.push(...items);try{WIDX=null}catch(_){}try{MODC=null}catch(_){}}
  try{if(typeof log==='function')log('Buat WBS dari Charter',p.nama+': '+items.length+' item ('+items[0].k+' s.d. '+items[items.length-1].k+')'+(draft?' sebagai Draft WBS':''))}catch(_){}
  close();try{if(typeof render==='function')render()}catch(_){}try{if(typeof save==='function')save()}catch(_){}
  say(items.length+' item WBS dibuat ('+items[0].k+' s.d. '+items[items.length-1].k+'). '+(draft?'Tersimpan sebagai Draft WBS program; otomatis masuk WBS saat program ditetapkan.':'Lihat di PMO › WBS & Progres.'));
 });
}
/* Export: format sheet Data Template WBS Standar (Code, Lv 1–6, Start, Finish, Triwulan Finish, UIC, Jenis Dokumen),
   sama dengan yang dibaca PMO › WBS & Progres › Import Excel. */
const XH=['Code','Lv 1','Lv 2','Lv 3','Lv 4','Lv 5','Lv 6','Start','Finish','Triwulan Finish','UIC Utama','UIC Pendukung','Jenis Dokumen Pendukung','Catatan Template'];
function exportXlsx(p,opt,pick,k){
 if(!window.XLSX||!XLSX.utils){say('Pustaka Excel belum termuat. Periksa koneksi internet.');return}
 const data=[XH].concat(pick.map(([r,i])=>{const L=pathOf(p,opt,r);return [k[i],'Program Transformasi Kemenkeu '+r.f.slice(0,4),L[0]||'',L[1]||'',L[2]||'',L[3]||'','',r.s,r.f,'TW '+Math.ceil(+r.f.slice(5,7)/3),T(r.u),T(r.d),'','Dari Charter Program · '+r.src]}));
 const wb=XLSX.utils.book_new(),sh=XLSX.utils.aoa_to_sheet(data);
 sh['!cols']=[14,34,34,28,40,48,16,12,12,14,18,22,26,34].map(w=>({wch:w}));sh['!autofilter']={ref:'A1:N'+data.length};
 XLSX.utils.book_append_sheet(wb,sh,'Data');
 const yrs=[...new Set(pick.map(([r])=>r.f.slice(0,4)))].sort();
 XLSX.writeFile(wb,'WBS_dari_Charter_'+String(opt.prefix||'').toUpperCase()+'_'+(yrs.length>1?yrs[0]+'-'+yrs[yrs.length-1]:yrs[0]||'')+'.xlsx',{bookType:'xlsx',compression:true});
 try{if(typeof log==='function')log('Export WBS dari Charter',p.nama+': '+pick.length+' baris')}catch(_){}
 say(pick.length+' baris WBS diekspor ke Excel (format Template WBS, sheet Data).');
}
const btn=pid=>{const p=progById(pid);return p&&canCreate(p)?'<button type="button" class="chx-sumb" data-chx-wbs="'+E(pid)+'" title="Create WBS: susun item WBS dari Key Milestones, Kriteria Penyelesaian dan Rencana Kerja charter ini">⊞ Buat WBS</button>':''};
document.addEventListener('click',ev=>{const b=ev.target.closest&&ev.target.closest('[data-chx-wbs]');if(!b)return;ev.preventDefault();ev.stopPropagation();open(b.dataset.chxWbs)},true);
window.MT_CHARTER_WBS={open,build,btn,prefixOf,sim};
if(window.MT_CHX)window.MT_CHX.wbsBtn=btn;
})();
