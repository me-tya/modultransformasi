/* Standar kode kertas kerja CM (2026-11-24).
   Kode CM = {kode modul}.{huruf}{nn}, unik se-aplikasi, dibuat otomatis, tidak dipakai ulang.
   D dampak (ADP) · R risiko (Register Risiko CM) · I indikator · S stakeholder · K rencana komunikasi · P rencana pelatihan.
   Pelaksanaan memakai kode rencana + "-n" (sesi). Kode WBS rujukan diambil dari item WBS tahap yang sesuai.
   Penyimpanan: field cc (D/I/S), ck/cp (K/P) pada baris; kode R di modMeta[modul].rc; penghitung di modMeta[modul].cseq. */
(function(){
 'use strict';
 const WRITERS=['SA','PMOK','CMOK','CMOU','TIM'];
 const LETTERS=['D','R','I','S','K','P'];
 const RE=/^([DRISKP])(\d+)$/;
 const num=c=>{const m=RE.exec(String(c||''));return m?+m[2]:0};
 const pad=n=>String(n).padStart(2,'0');
 const writer=()=>{try{return !!(ME&&WRITERS.includes(ME.role))}catch(e){return false}};
 const E=v=>String(v==null?'':v).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
 const riskOn=(s,r)=>(+s[r]||0)>0||String(s[r+'k']||'').trim()!=='';
 function riskKeys(){
  const out=[];
  (S.sub||[]).forEach(s=>RISK.forEach(r=>{if(riskOn(s,r[0]))out.push([s.modul,s.id+':'+r[0]])}));
  (S.risks||[]).filter(k=>k.keCmo&&k.item&&k.jenis!=='Isu'&&k.st!=='Ditutup').forEach(k=>out.push([k.item,'p:'+k.id]));
  return out;
 }
 /* Beri kode pada baris yang belum punya. Mengembalikan true bila ada perubahan (perlu disimpan). */
 function ensure(){
  if(!writer()||typeof S==='undefined'||!S)return false;
  let changed=false;
  /* Kode ganda (mis. baris hasil salin) dikosongkan dulu agar diberi nomor baru. */
  const seen=new Set();
  [['sub','cc'],['ind','cc'],['sh','cc'],['sh','ck'],['sh','cp']].forEach(([c,f])=>(S[c]||[]).forEach(x=>{if(!x||!x[f])return;const k=x.modul+'|'+x[f];if(seen.has(k)||!RE.test(x[f])){delete x[f];changed=true}else seen.add(k)}));
  const max={};const bump=(mk,L,n)=>{const k=mk+'|'+L;if(n>(max[k]||0))max[k]=n};
  const meta=mk=>(S.modMeta[mk]=S.modMeta[mk]||{});
  const rows=[['sub','cc','D'],['ind','cc','I'],['sh','cc','S'],['sh','ck','K'],['sh','cp','P']];
  rows.forEach(([c,f,L])=>(S[c]||[]).forEach(x=>{if(x&&x.modul&&x[f])bump(x.modul,L,num(x[f]))}));
  Object.entries(S.modMeta||{}).forEach(([mk,m])=>{if(!m)return;Object.values(m.rc||{}).forEach(c=>bump(mk,'R',num(c)));Object.entries(m.cseq||{}).forEach(([L,n])=>bump(mk,L,+n||0))});
  const next=(mk,L)=>{const k=mk+'|'+L;max[k]=(max[k]||0)+1;const m=meta(mk);m.cseq=Object.assign({},m.cseq||{},{[L]:max[k]});return L+pad(max[k])};
  const need=(x,f,on)=>x&&x.modul&&on&&!x[f];
  (S.sub||[]).forEach(x=>{if(need(x,'cc',true)){x.cc=next(x.modul,'D');changed=true}});
  (S.ind||[]).forEach(x=>{if(need(x,'cc',true)){x.cc=next(x.modul,'I');changed=true}});
  (S.sh||[]).forEach(x=>{
   if(need(x,'cc',true)){x.cc=next(x.modul,'S');changed=true}
   if(need(x,'ck',x.kom)){x.ck=next(x.modul,'K');changed=true}
   if(need(x,'cp',x.pel)){x.cp=next(x.modul,'P');changed=true}
  });
  riskKeys().forEach(([mk,key])=>{if(!mk)return;const m=meta(mk);if(m.rc&&m.rc[key])return;const c=next(mk,'R');m.rc=Object.assign({},m.rc||{},{[key]:c});changed=true});
  return changed;
 }
 const full=(mk,c)=>c?mk+'.'+c:'';
 const cls=c=>'cc-'+String(c||'x').charAt(0).toLowerCase();
 function chip(mk,c,suffix){if(!c)return '<span class="cc-none" title="Kode dibuat otomatis saat data dibuka oleh pengelola CM">—</span>';const t=full(mk,c)+(suffix||'');return '<span class="cc-code '+cls(c)+'" title="Kode CM '+E(t)+'">'+E(t)+'</span>'}
 const rCode=(mk,key)=>((S.modMeta[mk]||{}).rc||{})[key]||'';
 /* Kode WBS rujukan per jenis: ADP | S | K | P | KI | PI */
 const PAT={S:['Perencanaan',/pemangku kepentingan|stakeholder/i],K:['Perencanaan',/komunikasi/i],P:['Perencanaan',/pelatihan|training|kompetensi/i],KI:['Implementasi',/komunikasi|sosialisasi|awareness|kampanye|publikasi/i],PI:['Implementasi',/pelatihan|training|bimtek|t-course/i],J:['*',/jaringan|agen perubahan|t-agent|change agent/i],CRA:['*',/kesiapan|readiness|cra\b/i],M:['Monev',/monitoring|evaluasi|monev|pemantauan/i]};
 function wbsFor(mk,kind){
  let m;try{m=modOf(mk)}catch(e){m=null}if(!m)return null;
  if(kind==='ADP')return m.adp||null;
  const p=PAT[kind];if(!p)return null;const L=p[0]==='*'?[].concat(...Object.values(m.st||{})):((m.st&&m.st[p[0]])||[]);if(!L.length)return null;
  const yr=(S.ui&&S.ui.tahun)||0;const txt=w=>(w.p||[]).slice(-3).join(' ');
  const hit=L.filter(w=>p[1].test(txt(w)));const pool=hit.length?hit:(['S','K','P','J','CRA'].includes(kind)?[]:L);
  return pool.find(w=>yrOf(w)===yr)||pool[0]||null;
 }
 function wbsCell(mk,kind){const w=wbsFor(mk,kind);if(!w)return '<span class="cc-nowbs">⚠ belum ada item WBS tahap ini</span>';return '<span class="code">'+E(w.k)+'</span><span class="sm">'+E(short(deliv(w),48))+'</span>'}
 const wbsText=(mk,kind)=>{const w=wbsFor(mk,kind);return w?w.k+' · '+deliv(w):''};
 /* Sufiks sesi Pelaksanaan: -1 setelah kegiatan mulai/terlaksana. */
 const started=st=>['Berjalan','Terlaksana'].includes(st);
 window.MTCC={ensure,full,chip,rCode,wbsFor,wbsCell,wbsText,started,LETTERS,writer};
})();
