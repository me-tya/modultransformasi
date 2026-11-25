/* =====================================================================
   Charter Program · Impor "Tabulasi Charter IS" + Unduh Plain (RKMK)
   ---------------------------------------------------------------------
   1) Impor: membaca sheet "Tabulasi Charter IS" (Tabulasi Tindak Lanjut
      LOM, satu baris = satu Inisiatif Strategis) lalu mengisi Charter
      Program (p.psProgramCharter) pada program tahun tujuan.
      - Kolom dikenali dari judul kolom, bukan posisi.
      - Program dicocokkan otomatis (kode IS yang pernah diimpor → nama
        sama → kemiripan kata); pengguna bisa mengganti, melewati, atau
        (SA/PMO Kemenkeu) membuat usulan program baru berstatus Draft.
      - Charter berstatus Disahkan dan program Ditetapkan tidak ditimpa.
      - Rencana Kerja yang sudah berisi tidak ditimpa; bila kosong diisi
        dari Milestones (Level 4) + Penanggung Jawab, bulan Mulai/Selesai
        dibiarkan kosong (tidak ditebak).
   2) Unduh Plain: format tabel hitam-putih seperti lampiran charter
      RKMK (Charter · Kriteria Penyelesaian · Rencana Kerja · Perbandingan
      bila ada) sebagai Word, PowerPoint, atau PDF (cetak). Pratinjau di
      layar memakai model data yang sama dengan berkas unduhan.
   API: window.MT_CHARTER_IS
   ===================================================================== */
(function mtCharterIS(root){
'use strict';
const VERSION='20261125-cis1';
const G=root||{};
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const XE=x=>String(x==null?'':x).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const T=x=>String(x==null?'':x).replace(/\r\n?/g,'\n').replace(/ /g,' ').trim();
const clone=x=>JSON.parse(JSON.stringify(x));
const BUL=/^\s*(?:[•▪▸◦●·\-–—*]\s*|(?:[a-z]|\d{1,2})[.)]\s+)/i;
const lines=v=>T(v).split('\n').map(s=>s.trim()).filter(Boolean);
const strip=s=>String(s||'').replace(BUL,'').trim();
const items=v=>lines(v).map(strip).filter(Boolean);
/* index.html memakai `let S, ME` dan `const ACT` (bukan properti window): akses lewat typeof. */
function g(k){try{switch(k){
 case 'S':return typeof S!=='undefined'?S:G.S;
 case 'ME':return typeof ME!=='undefined'?ME:G.ME;
 case 'ACT':return typeof ACT!=='undefined'?ACT:G.ACT;
 case 'modal':return typeof modal!=='undefined'?modal:G.modal;
 case 'toast':return typeof toast!=='undefined'?toast:G.toast;
 case 'save':return typeof save!=='undefined'?save:G.save;
 case 'render':return typeof render!=='undefined'?render:G.render;
 case 'busy':return typeof busy!=='undefined'?busy:G.busy;
 case 'busyOff':return typeof busyOff!=='undefined'?busyOff:G.busyOff;
 case 'chLib':return typeof chLib!=='undefined'?chLib:G.chLib;
 case 'MT_INFO_ICON':return typeof MT_INFO_ICON!=='undefined'?MT_INFO_ICON:G.MT_INFO_ICON;
 default:return G[k];
}}catch(_){return undefined}}
const st=()=>g('S')||{};
const me=()=>g('ME')||null;
const say=m=>{const t=g('toast');if(typeof t==='function')t(m)};
const year=()=>+(st().ui||{}).psSelectedYear||+(st().ui||{}).tahun||2026;

/* ---------- 1. Pembacaan sheet ---------- */
const HEAD=h=>String(h||'').toLowerCase().replace(/\s+/g,' ').trim();
const COLS=[
 ['kode',h=>/^kode\b/.test(h)],
 ['klaster',h=>/^klaster/.test(h)],
 ['subisu',h=>/^sub ?isu/.test(h)],
 ['lead',h=>/^lead|^uic/.test(h)],
 ['judul',h=>/^program transformasi/.test(h)],
 ['tujuan',h=>/^tujuan program/.test(h)],
 ['lb',h=>/^latar belakang/.test(h)],
 ['tb',h=>/^terobosan/.test(h)],
 ['out',h=>/^output\b/.test(h)],
 ['oc',h=>/^outcome\b/.test(h)],
 ['ms',h=>/^key milestone/.test(h)],
 ['ris',h=>/^risiko/.test(h)],
 ['pk',h=>/^pendukung kesuksesan/.test(h)],
 ['ch',h=>/initiative champion/.test(h)],
 ['ow',h=>/initiative owner/.test(h)],
 ['kp',h=>/level 4|^kriteria penyelesaian/.test(h)],
 ['pj',h=>/^penanggung jawab/.test(h)]
];
function headerMap(row){
 const m={};(row||[]).forEach((h,i)=>{const n=HEAD(h);if(!n)return;for(const [k,f] of COLS)if(m[k]==null&&f(n)){m[k]=i;break}});
 return m;
}
/* aoa = array baris (array sel). Mengembalikan {rows, header, missing}. */
function fromAoa(aoa){
 let hi=-1,map=null;
 for(let i=0;i<Math.min(15,(aoa||[]).length);i++){const m=headerMap(aoa[i]);if(m.judul!=null&&m.tujuan!=null){hi=i;map=m;break}}
 if(hi<0)return {rows:[],header:null,missing:['Program Transformasi','Tujuan Program']};
 const rows=[];
 for(let i=hi+1;i<aoa.length;i++){
  const r=aoa[i]||[],get=k=>map[k]==null?'':T(r[map[k]]);
  const judul=get('judul');if(!judul)continue;
  const rec={row:i+1};COLS.forEach(([k])=>rec[k]=get(k));rec.judul=judul.replace(/\s+/g,' ');
  rows.push(rec);
 }
 const LABEL={tujuan:'Tujuan Program',lb:'Latar Belakang',tb:'Terobosan',out:'Output',oc:'Outcome',ms:'Key Milestones',ris:'Risiko',pk:'Pendukung Kesuksesan',ch:'Initiative Champion',ow:'Initiative Owner',kp:'Milestones (Level 4) dan Kriteria Penyelesaian',pj:'Penanggung Jawab'};
 return {rows,header:map,missing:Object.keys(LABEL).filter(k=>map[k]==null).map(k=>LABEL[k])};
}
function pickSheet(wb){
 const XL=g('XLSX');const names=wb.SheetNames||[];
 const order=[...names.filter(n=>/charter\s*is/i.test(n)),...names.filter(n=>!/charter\s*is/i.test(n))];
 for(const n of order){const aoa=XL.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:'',raw:false,blankrows:false});const r=fromAoa(aoa);if(r.header)return Object.assign(r,{sheet:n})}
 return null;
}
async function readFile(file){
 if(!g('XLSX')){const L=g('chLib');if(typeof L==='function')await L('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',()=>!!g('XLSX'));}
 const XL=g('XLSX');if(!XL)throw new Error('Pustaka Excel belum termuat.');
 const wb=XL.read(await file.arrayBuffer(),{type:'array'});
 const r=pickSheet(wb);if(!r)throw new Error('Sheet "Tabulasi Charter IS" (kolom Program Transformasi & Tujuan Program) tidak ditemukan.');
 r.file=file.name;return r;
}

/* ---------- 2. Konversi baris → charter ---------- */
function parseMs(v,y0){
 const out=[];let y=null;
 lines(v).forEach(l=>{
  const m=l.match(/^(20\d{2})\s*(?:[:：]\s*(.*))?$/);
  if(m){y=+m[1];if(m[2]&&strip(m[2]))out.push({y,t:strip(m[2]),g:''});return}
  const t=strip(l);if(t)out.push({y:y||y0,t,g:''});
 });
 return out;
}
function parseKp(v){
 const out=[],split=s=>{const d=s.match(/^(.+?)\s+[—–-]\s+(.+)$/);return d?{m:d[1].trim(),k:[d[2].trim()]}:{m:s.trim(),k:[]}};
 lines(v).forEach(l=>{
  const n=l.match(/^\s*\d{1,2}[.)]\s*(.+)$/);
  if(n)out.push(split(n[1]));
  else if(out.length&&BUL.test(l))out[out.length-1].k.push(strip(l));
  else out.push(split(strip(l)));
 });
 return out.filter(x=>x.m);
}
function parsePj(v){
 const s=T(v).replace(/\n/g,' | ');
 const u=((s.match(/utama\s*:\s*([^|]+)/i)||[])[1]||'').trim(),pd=((s.match(/pendukung\s*:\s*([^|]+)/i)||[])[1]||'').trim();
 return {u:u||(!pd?s:''),pd,raw:T(v)};
}
const parseOw=v=>T(v).split(/\n|;/).map(strip).filter(Boolean);
function leadUnit(rec){
 const pj=parsePj(rec.pj);if(pj.u)return pj.u.split(/[,;]/)[0].trim();
 return String(rec.lead||'').split(/[(;,:]/)[0].trim();
}
function toCharter(rec,p,Y,base,meta){
 const ms=parseMs(rec.ms,Y),ys=ms.map(m=>+m.y).filter(Boolean);
 const kp=parseKp(rec.kp),pj=parsePj(rec.pj),now=new Date().toISOString(),M=me();
 const d=base&&typeof base==='object'&&Object.keys(base).length?clone(base):{
  id:'program-charter-'+p.id,prog:p.akr,tahun:Y,ver:1,st:'Draft',
  asis:{pb:'',masalah:'',kor:[],tek:'',link:''},tobe:{pb:[],pot:[],ar:'',link:'',arLink:''},
  cs:[],kp:[],mf:[],rk:[],doc:{link:''},log:[]};
 Object.assign(d,{prog:p.akr,judul:rec.judul||p.nama||'',tujuan:T(rec.tujuan),lb:items(rec.lb),tb:items(rec.tb).join('\n'),
  out:items(rec.out),oc:items(rec.oc),p1:ys.length?Math.min(...ys):Y,p2:ys.length?Math.max(...ys):Y,ms,
  ris:items(rec.ris),pk:items(rec.pk),ch:strip(T(rec.ch).split('\n')[0]||''),ow:parseOw(rec.ow),kp});
 const keepRk=Array.isArray(d.rk)&&d.rk.some(r=>T(r&&r.t));
 if(!keepRk)d.rk=kp.map(k=>({t:k.m,s:'',e:'',u:pj.u,pd:pj.pd}));
 d.tahun=+d.tahun||Y;d.st=d.st||'Draft';
 d.sumberImpor={jenis:'Tabulasi Charter IS',file:(meta&&meta.file)||'',sheet:(meta&&meta.sheet)||'',baris:rec.row||'',kode:rec.kode||'',klaster:rec.klaster||'',subisu:rec.subisu||'',lead:rec.lead||'',penanggungJawab:pj.raw,at:now,by:(M&&M.email)||''};
 d.log=(Array.isArray(d.log)?d.log:[]).concat([{t:now,u:(M&&M.email)||'',a:'Impor Tabulasi Charter IS '+(rec.kode||'')+' ('+((meta&&meta.file)||'Excel')+')'}]);
 return {charter:d,keepRk};
}

/* ---------- 3. Program tujuan & pencocokan ---------- */
const STOP=new Set(['dan','untuk','yang','serta','dalam','pada','the','and','of','program','transformasi','kemenkeu','sebagai','melalui']);
const nm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const tok=s=>new Set(nm(s).split(' ').filter(w=>w.length>2&&!STOP.has(w)));
function jac(a,b){const A=tok(a),B=tok(b);if(!A.size||!B.size)return 0;let n=0;A.forEach(w=>{if(B.has(w))n++});
 /* Jaccard, atau keterkandungan penuh nama pendek (≥2 kata) di nama panjang, mis. "Spending Better" ⊂ "APBN ... (Spending Better)" */
 const mn=Math.min(A.size,B.size);return Math.max(n/(A.size+B.size-n),mn>=2&&n===mn?.8:0)}
function programsOf(Y){
 const all=(st().programs||[]).filter(p=>p&&!p.arsip&&p.psListStatus!=='Arsip');
 return all.filter(p=>+p.psYear===+Y);
}
function score(rec,p){
 const src=p.psProgramCharter&&p.psProgramCharter.sumberImpor;
 if(src&&rec.kode&&String(src.kode)===String(rec.kode))return 1.01;
 if(nm(p.nama)===nm(rec.judul))return 1;
 return Math.max(jac(rec.judul,p.nama),jac(rec.subisu,p.nama)*.9,p.psProgramCharter?jac(rec.judul,p.psProgramCharter.judul)*.95:0);
}
function autoMatch(rows,progs){
 const pairs=[];rows.forEach((r,i)=>progs.forEach(p=>{const s=score(r,p);if(s>=.5)pairs.push({i,p,s})}));
 pairs.sort((a,b)=>b.s-a.s);const used=new Set(),res=rows.map(()=>null);
 pairs.forEach(x=>{if(res[x.i]||used.has(String(x.p.id)))return;res[x.i]={id:String(x.p.id),s:x.s};used.add(String(x.p.id))});
 return res;
}
function canProg(p){
 const M=me();if(!M||!p)return false;if(!['SA','PMOK','PMOU'].includes(M.role))return false;
 if(p.psStatus==='Ditetapkan')return false;if(M.role==='PMOU'&&p.uic&&p.uic!==M.unit)return false;return true;
}
const canCreate=()=>{const M=me();return !!M&&['SA','PMOK'].includes(M.role)};
const canImport=()=>{const M=me();return !!M&&['SA','PMOK','PMOU'].includes(M.role)};
function nextAkr(Y){const S=st();let k;do{k='PS'+Y+'-IS'+Math.random().toString(36).slice(2,7).toUpperCase()}while((S.programs||[]).some(p=>p.akr===k)||(S.wbs||[]).some(w=>w.prog===k));return k}
function newProgram(rec,Y){
 const M=me(),pj=parsePj(rec.pj),id='program-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
 return {id,akr:nextAkr(Y),psYear:Y,psDraft:true,psStatus:'Draft',psListStatus:'Baru',psThreshold:80,psPrioritize:false,
  psProjects:[],psWeights:{},psGovernanceV:1,psBenefits:[],psStakeholders:[],psRiskRegister:[],mulai:Y,periode:Y+'–'+Y,status:'Perencanaan',
  nama:rec.judul,kodeResmi:'',kode:'',jenis:'',uic:leadUnit(rec),pend:pj.pd,sponsor:strip(T(rec.ch).split('\n')[0]||''),
  psObjective:T(rec.tujuan),psBackground:items(rec.lb).join('\n'),psStrategy:items(rec.tb).join('\n'),psOutcome:items(rec.oc).join('\n'),
  psThemes:[rec.klaster,rec.subisu].filter(Boolean).join(' · '),psSumberImpor:{jenis:'Tabulasi Charter IS',kode:rec.kode||''},
  psUpdatedAt:new Date().toISOString(),psUpdatedBy:(M&&M.email)||''};
}

/* ---------- 4. Model plain (dipakai pratinjau, Word, PPTX, PDF) ---------- */
function charterOf(p){
 if(p&&p.psProgramCharter&&typeof p.psProgramCharter==='object'&&Object.keys(p.psProgramCharter).length)return p.psProgramCharter;
 const L=(st().charters||[]).filter(c=>p&&c.prog===p.akr&&!c.dk&&c.st!=='Arsip').sort((a,b)=>(+b.ver||0)-(+a.ver||0));
 return L[0]||null;
}
const ym=v=>/^\d{4}-(0[1-9]|1[0-2])$/.test(String(v||'').trim())?String(v).trim():'';
function model(p,c){
 c=c||charterOf(p)||{};
 const p1=+c.p1||+p.psYear||year(),p2=Math.max(p1,+c.p2||p1),yrs=[];for(let y=p1;y<=p2;y++)yrs.push(y);
 const ms=yrs.map(y=>({y,L:(c.ms||[]).filter(m=>+m.y===y&&T(m.t)).map(m=>T(m.t))})).filter(x=>x.L.length);
 (c.ms||[]).filter(m=>T(m.t)&&!yrs.includes(+m.y)).forEach(m=>{let x=ms.find(z=>z.y===+m.y);if(!x){x={y:+m.y||'',L:[]};ms.push(x)}x.L.push(T(m.t))});
 const rk=(c.rk||[]).filter(r=>T(r&&r.t)).map(r=>({t:T(r.t),s:ym(r.s),e:ym(r.e),u:T(r.u),pd:T(r.pd)}));
 const rkY=[];rk.forEach(r=>[r.s,r.e].filter(Boolean).forEach(v=>{const y=+v.slice(0,4);if(!rkY.includes(y))rkY.push(y)}));
 let gy=rkY.length?[Math.min(...rkY)]:[p1];if(rkY.length){for(let y=Math.min(...rkY)+1;y<=Math.max(...rkY);y++)gy.push(y)}
 return {id:p.id,kode:p.kodeResmi||p.kode||'',judul:T(c.judul)||T(p.nama),tujuan:T(c.tujuan),lb:(c.lb||[]).map(T).filter(Boolean),
  tb:String(c.tb||'').split('\n').map(T).filter(Boolean),out:(c.out||[]).map(T).filter(Boolean),oc:(c.oc||[]).map(T).filter(Boolean),
  periode:p1===p2?String(p1):p1+' s.d. '+p2,ris:(c.ris||[]).map(T).filter(Boolean),pk:(c.pk||[]).map(T).filter(Boolean),ms,
  ch:T(c.ch),ow:(c.ow||[]).map(T).filter(Boolean),kp:(c.kp||[]).filter(k=>T(k&&k.m)).map(k=>({m:T(k.m),k:(Array.isArray(k.k)?k.k:[k.k]).map(T).filter(Boolean)})),
  rk,gantt:{years:gy,quarter:gy.length>2},cs:(c.cs||[]).filter(x=>T(x&&x.a)||T(x&&x.b)).map(x=>({a:T(x.a),b:T(x.b)})),has:!!(c&&Object.keys(c).length)};
}
const num=L=>L.length>1?L.map((t,i)=>(i+1)+'. '+t):L;
const alpha=L=>L.length>1?L.map((t,i)=>String.fromCharCode(97+i%26)+'. '+t):L;
/* Kolom gantt: bulan (≤2 tahun) atau triwulan (>2 tahun) */
function ganttCols(m){
 const C=[];m.gantt.years.forEach(y=>{if(m.gantt.quarter)[1,2,3,4].forEach(q=>C.push({y,l:'TW'+['I','II','III','IV'][q-1],a:y+'-'+String(q*3-2).padStart(2,'0'),b:y+'-'+String(q*3).padStart(2,'0')}));else for(let i=1;i<=12;i++){const v=y+'-'+String(i).padStart(2,'0');C.push({y,l:String(i),a:v,b:v})}});
 return C;
}
const on=(r,c)=>!!(r.s&&r.e&&r.s<=c.b&&r.e>=c.a);
const pjLines=r=>[r.u?'Utama: '+r.u:'',r.pd?'Pendukung: '+r.pd:''].filter(Boolean);
/* Struktur tabel generik (dipakai HTML, Word, PPTX): sel {t:[baris], b, al, cs, rs, fill} */
function tables(m){
 const H=(t,o)=>Object.assign({t:[t],b:1,al:'center'},o||{}),C=(L,o)=>Object.assign({t:L.length?L:['—']},o||{});
 const ms=[];m.ms.forEach(x=>{ms.push({b:1,s:String(x.y)});num(x.L).forEach(s=>ms.push({s}))});
 const up=[{b:1,s:'Initiative Champion: ',r:m.ch||'—'},{b:1,s:'Initiative Owner:'}].concat(alpha(m.ow).map(s=>({s})));
 const charter={title:'Charter Program Transformasi: ',charter:1,w:[1,1,1,1],rows:[
  [H('Tujuan Program',{al:'left'}),C([m.tujuan],{cs:3})],
  [H('Latar Belakang'),H('Terobosan'),H('Output'),H('Outcome')],
  [C(num(m.lb)),C(num(m.tb)),C(num(m.out)),C(num(m.oc))],
  [H('Pendukung Kesuksesan'),H('Periode'),H('Risiko',{cs:2})],
  [C(num(m.pk),{rs:3}),C([m.periode]),C(num(m.ris),{cs:2})],
  [null,H('Key Milestones'),H('Unit Pengelola',{cs:2})],
  [null,{rich:ms.length?ms:[{s:'—'}]},{rich:up,cs:2}]
 ]};
 const kp={title:'Kriteria Penyelesaian Program Transformasi: ',w:[.38,.62],rows:[[H('Milestones (Level 4)'),H('Kriteria Penyelesaian')]].concat(
  (m.kp.length?m.kp:[{m:'—',k:[]}]).map((k,i)=>[C([(m.kp.length?(i+1)+'. ':'')+k.m]),C(num(k.k))]))};
 const cols=ganttCols(m),nC=cols.length;
 const yrRow=[H('Tindakan',{rs:2})];m.gantt.years.forEach(y=>yrRow.push(H(String(y),{cs:m.gantt.quarter?4:12})));yrRow.push(H('Penanggung Jawab',{rs:2}));
 const rk={title:'Rencana Kerja Program Transformasi: ',gantt:nC,w:[.27].concat(cols.map(()=>.5/nC)).concat([.23]),rows:[yrRow,[null].concat(cols.map(c=>H(c.l,{small:1}))).concat([null])].concat(
  (m.rk.length?m.rk:[{t:'—',s:'',e:'',u:'',pd:''}]).map((r,i)=>[C([(m.rk.length?(i+1)+'. ':'')+r.t])].concat(cols.map(c=>({t:[''],fill:on(r,c)?'404040':''}))).concat([C(pjLines(r))])))};
 const out=[charter,kp,rk];
 if(m.cs.length)out.push({title:'Perbandingan Kondisi Saat Ini (Current State) dan Kondisi Setelah Implementasi (End State) Program Transformasi: ',w:[.5,.5],rows:[[H('Keadaan Saat Ini (Current State)'),H('Keadaan Setelah Implementasi (Future/End State)')]].concat(m.cs.map(x=>[C([x.a]),C([x.b])]))});
 return out;
}

/* ---------- 5. HTML (pratinjau & PDF) ---------- */
const CSS='.mtcis-doc,.mtcis-doc *{font-family:"Bookman Old Style",Georgia,serif!important;letter-spacing:normal}.mtcis-doc .mtcis-pg{display:block}.mtcis-doc{font-family:"Bookman Old Style",Georgia,serif;color:#000;font-size:12px;line-height:1.3}.mtcis-doc .mtcis-kop{text-align:center;font-size:11px;margin:0 0 4px}.mtcis-doc h4{font-size:13px;margin:6px 0 6px;font-weight:700}.mtcis-doc h4 span{font-weight:400}'+
 '.mtcis-doc table{width:100%;border-collapse:collapse;table-layout:fixed;margin:0 0 14px}.mtcis-doc td{border:1px solid #000;padding:3px 5px;vertical-align:top;word-wrap:break-word}.mtcis-doc td.h{font-weight:700;text-align:center;vertical-align:middle}.mtcis-doc td.l{text-align:left}.mtcis-doc td.sm{font-size:10px;padding:2px 0;text-align:center}.mtcis-doc td.g{padding:0}.mtcis-doc p{margin:0 0 2px}'+
 '.mtcis-doc .mtcis-pg{page-break-after:always;break-after:page;padding:6px 0 10px;border-bottom:1px dashed #C9D3E3;margin-bottom:12px}.mtcis-doc .mtcis-pg:last-child{border-bottom:0}';
function cellHtml(c){
 if(c.rich)return c.rich.map(x=>'<p>'+(x.b?'<b>'+E(x.s)+'</b>':E(x.s))+(x.r!=null?E(x.r):'')+'</p>').join('');
 return c.t.map(s=>'<p>'+E(s)+'</p>').join('');
}
function tableHtml(t,m){
 const sumW=t.w.reduce((a,b)=>a+b,0);
 return '<div class="mtcis-pg"><p class="mtcis-kop">KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</p><h4>'+E(t.title)+'<span>'+E(m.judul)+'</span></h4><table><colgroup>'+t.w.map(w=>'<col style="width:'+(w/sumW*100).toFixed(2)+'%">').join('')+'</colgroup>'+
  t.rows.map(r=>'<tr>'+r.filter(Boolean).map(c=>'<td'+(c.cs?' colspan="'+c.cs+'"':'')+(c.rs?' rowspan="'+c.rs+'"':'')+' class="'+[c.b?'h':'',c.al==='left'?'l':'',c.small?'sm':'',c.fill!==undefined&&!c.b&&t.gantt&&c.t&&c.t[0]===''?'g':''].join(' ')+'"'+(c.fill?' style="background:#'+c.fill+'"':'')+'>'+cellHtml(c)+'</td>').join('')+'</tr>').join('')+'</table></div>';
}
const html=models=>'<div class="mtcis-doc">'+models.map(m=>tables(m).map(t=>tableHtml(t,m)).join('')).join('')+'</div>';

/* ---------- 6. Word (.docx, OOXML polos) ---------- */
const WF='Bookman Old Style';
function wRun(t,o){o=o||{};return '<w:r><w:rPr><w:rFonts w:ascii="'+WF+'" w:hAnsi="'+WF+'" w:cs="'+WF+'"/>'+(o.b?'<w:b/>':'')+'<w:sz w:val="'+(o.sz||22)+'"/><w:szCs w:val="'+(o.sz||22)+'"/></w:rPr><w:t xml:space="preserve">'+XE(t)+'</w:t></w:r>'}
function wPara(runs,o){o=o||{};const hang=o.hang?'<w:ind w:left="'+o.hang+'" w:hanging="'+o.hang+'"/>':'';
 return '<w:p><w:pPr>'+(o.keep?'<w:keepNext/>':'')+(o.br?'<w:pageBreakBefore/>':'')+'<w:spacing w:before="0" w:after="'+(o.after==null?20:o.after)+'" w:line="240" w:lineRule="auto"/>'+hang+(o.jc?'<w:jc w:val="'+o.jc+'"/>':'')+'</w:pPr>'+runs+'</w:p>'}
function wCellParas(c,sz){
 if(c.rich)return c.rich.map(x=>wPara(wRun(x.s,{b:x.b,sz})+(x.r!=null?wRun(x.r,{sz}):''))).join('');
 return c.t.map(s=>{const n=String(s).match(/^((?:\d{1,2}|[a-z])\.)\s(.*)$/);return wPara(wRun(s,{b:c.b,sz}),{jc:c.b&&c.al!=='left'?'center':(c.small?'center':''),hang:n&&!c.b?(n[1].length>2?360:300):0})}).join('');
}
function wTable(t,total){
 const sumW=t.w.reduce((a,b)=>a+b,0),W=t.w.map(w=>Math.round(w/sumW*total)),B='<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>';
 /* hitung peta sel: baris berikut dari sel rowspan diisi vMerge continue */
 const grid=t.rows.map(()=>[]),out=[];
 t.rows.forEach((r,ri)=>{let ci=0;r.forEach(c=>{while(grid[ri][ci])ci++;if(!c){return}const cs=c.cs||1,rs=c.rs||1;for(let k=0;k<rs;k++)for(let j=0;j<cs;j++){if(!grid[ri+k])grid[ri+k]=[];grid[ri+k][ci+j]=k===0&&j===0?{c,start:1}:(j===0?{cont:c,cs}:{skip:1})}ci+=cs})});
 grid.forEach(row=>{let tr='<w:tr>';for(let ci=0;ci<W.length;ci++){const x=row[ci];if(!x||x.skip)continue;const c=x.c||x.cont,cs=c.cs||1,w=W.slice(ci,ci+cs).reduce((a,b)=>a+b,0);
  const pr='<w:tcPr><w:tcW w:w="'+w+'" w:type="dxa"/>'+(cs>1?'<w:gridSpan w:val="'+cs+'"/>':'')+((c.rs||1)>1?(x.start?'<w:vMerge w:val="restart"/>':'<w:vMerge/>'):'')+(c.fill?'<w:shd w:val="clear" w:color="auto" w:fill="'+c.fill+'"/>':'')+
   '<w:tcMar><w:top w:w="30" w:type="dxa"/><w:left w:w="'+(c.small||t.gantt&&c.fill!==undefined?20:80)+'" w:type="dxa"/><w:bottom w:w="30" w:type="dxa"/><w:right w:w="'+(c.small||t.gantt&&c.fill!==undefined?20:80)+'" w:type="dxa"/></w:tcMar>'+(c.b?'<w:vAlign w:val="center"/>':'')+'</w:tcPr>';
  tr+='<w:tc>'+pr+(x.start?wCellParas(c,c.small?16:20):wPara(''))+'</w:tc>'}out.push(tr+'</w:tr>')});
 return '<w:tbl><w:tblPr><w:tblW w:w="'+total+'" w:type="dxa"/><w:tblBorders>'+B+'</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>'+W.map(w=>'<w:gridCol w:w="'+w+'"/>').join('')+'</w:tblGrid>'+out.join('')+'</w:tbl>';
}
function docxBody(models){
 const total=16838-2*850;let first=true,b='';
 models.forEach(m=>tables(m).forEach(t=>{
  b+=wPara(wRun('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',{sz:18}),{jc:'center',br:!first,after:60});first=false;
  b+=wPara(wRun(t.title,{b:1,sz:24})+wRun(m.judul,{sz:24}),{keep:1,after:120});
  b+=wTable(t,total)+wPara('',{after:0});
 }));
 return b+'<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="850" w:right="850" w:bottom="850" w:left="850" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>';
}
async function docxBlob(models,type){
 const L=g('chLib');if(!g('JSZip')&&typeof L==='function')await L('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!g('JSZip'));
 const Z=g('JSZip');if(!Z)throw new Error('Pustaka Word belum tersedia.');
 const z=new Z(),W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
 z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
 z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 z.file('word/_rels/document.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
 z.file('word/styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="'+W+'"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="'+WF+'" w:hAnsi="'+WF+'" w:cs="'+WF+'" w:eastAsia="'+WF+'"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="id-ID"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>');
 z.file('word/document.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="'+W+'"><w:body>'+docxBody(models)+'</w:body></w:document>');
 return z.generateAsync({type:type||'blob',compression:'DEFLATE',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}

/* ---------- 7. PowerPoint plain (tabel asli, font 12–14, slide terisi penuh) ---------- */
const PF='Bookman Old Style';
const estLines=(L,w,fs)=>L.reduce((a,s)=>a+Math.max(1,Math.ceil(String(s).length*(fs*.58/72)/Math.max(.3,w-.14))),0);
function cellLines(c){return c.rich?c.rich.map(x=>x.s+(x.r||'')):c.t}
const cellH=(c,w,fs)=>estLines(cellLines(c),w,fs)*fs*1.2/72+.12;
/* tinggi per baris; sel rowspan dibebankan ke baris terakhir rentangnya */
function heights(rows,W,fs){
 const hs=rows.map(()=>.3),spans=[];
 rows.forEach((r,ri)=>{let ci=0;r.forEach(c=>{if(!c){ci++;return}const cs=c.cs||1,w=W.slice(ci,ci+cs).reduce((a,b)=>a+b,0);ci+=cs;
  if((c.rs||1)>1)spans.push({ri,rs:c.rs,h:cellH(c,w,fs)});else hs[ri]=Math.max(hs[ri],cellH(c,w,fs))})});
 spans.forEach(x=>{const end=Math.min(hs.length,x.ri+x.rs),have=hs.slice(x.ri,end).reduce((a,b)=>a+b,0);if(have<x.h)hs[end-1]+=x.h-have});
 return hs;
}
const sum=a=>a.reduce((x,y)=>x+y,0);
/* Pilih font terbesar (14→12) yang muat; bila tidak muat pada 12, pecah. */
function layout(t,TW,AV){
 const sumW=t.w.reduce((a,b)=>a+b,0);let W=t.w.map(w=>w/sumW*TW);
 if(t.gantt){const fix=TW-W[0]-W[W.length-1],each=Math.max(.3,fix/t.gantt);W=[W[0]].concat(Array(t.gantt).fill(each)).concat([TW-W[0]-each*t.gantt])}
 const FS=t.charter?[14,13,12]:[16,15,14,13,12];
 const fit=(rows,WW)=>{for(const fs of FS){const hs=heights(rows,WW,fs);if(sum(hs)<=AV)return {rows,W:WW,fs,hs}}return null};
 const one=fit(t.rows,W);if(one)return [one];
 if(t.charter){
  const W2=[.26,.38,.18,.18].map(x=>x*TW),A=t.rows.slice(0,3),B=t.rows.slice(3);
  return [fit(A,W)||{rows:A,W,fs:12,hs:heights(A,W,12)},fit(B,W2)||{rows:B,W:W2,fs:12,hs:heights(B,W2,12)}];
 }
 const head=t.gantt?2:1,hdr=t.rows.slice(0,head),body=t.rows.slice(head),out=[];
 const hH=sum(heights(hdr,W,12));let cur=[],h=hH;
 body.forEach(r=>{const rh=sum(heights([r],W,12));if(cur.length&&h+rh>AV){out.push(hdr.concat(cur));cur=[];h=hH}cur.push(r);h+=rh});
 if(cur.length||!out.length)out.push(hdr.concat(cur));
 return out.map(rows=>({rows,W,fs:12,hs:heights(rows,W,12)}));
}
function pptCell(c,fs){
 const o={bold:!!c.b,align:c.b&&c.al!=='left'?'center':(c.small?'center':'left'),valign:c.b?'middle':'top',fontSize:c.small?12:fs,fontFace:PF,color:'000000'};
 if(c.cs)o.colspan=c.cs;if(c.rs)o.rowspan=c.rs;if(c.fill)o.fill={color:c.fill};if(c.small||c.fill!==undefined&&!c.b)o.margin=c.small?[2,0,2,0]:[2,4,2,4];
 let text;
 if(c.rich)text=c.rich.flatMap((x,i,a)=>{const L=[{text:x.s,options:{bold:!!x.b,breakLine:x.r==null&&i<a.length-1}}];if(x.r!=null)L.push({text:x.r,options:{bold:false,breakLine:i<a.length-1}});return L});
 else text=c.t.length>1?c.t.map((s,i)=>({text:s,options:{breakLine:i<c.t.length-1}})):String(c.t[0]||'');
 return {text,options:o};
}
async function pptxWrite(models,fileName){
 const L=g('chLib'),PG=()=>g('PptxGenJS');
 if(!PG()&&typeof L==='function'){try{await L('https://cdnjs.cloudflare.com/ajax/libs/pptxgenjs/3.12.0/pptxgen.bundle.js',()=>!!PG())}catch(e){await L('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js',()=>!!PG())}}
 const P=PG();if(!P)throw new Error('Pustaka PowerPoint belum tersedia.');
 const ppt=new P();ppt.layout='LAYOUT_WIDE';ppt.author='PMO Kementerian Keuangan';ppt.title='Charter Program Transformasi (plain)';
 const X0=.4,TW=13.33-2*X0,TOP=.98,AV=7.5-TOP-.22;
 models.forEach(m=>tables(m).forEach(t=>{
  const parts=layout(t,TW,AV);
  parts.forEach((pt,pi)=>{
   const s=ppt.addSlide();s.background={color:'FFFFFF'};
   s.addText('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',{x:X0,y:.12,w:TW,h:.3,fontFace:PF,fontSize:12,color:'000000',align:'center'});
   s.addText([{text:t.title,options:{bold:true}},{text:m.judul+(parts.length>1?' ('+(pi+1)+'/'+parts.length+')':''),options:{bold:false}}],{x:X0,y:.42,w:TW,h:.5,fontFace:PF,fontSize:14,color:'000000',valign:'middle'});
   /* regangkan baris agar tabel mengisi slide (maks. 4×) */
   const k=Math.min(4,AV/Math.max(.1,sum(pt.hs))),rowH=pt.hs.map(h=>+(h*k).toFixed(3));
   s.addTable(pt.rows.map(r=>r.filter(Boolean).map(c=>pptCell(c,pt.fs))),{x:X0,y:TOP,w:TW,colW:pt.W,rowH,fontFace:PF,fontSize:pt.fs,color:'000000',border:{type:'solid',pt:.75,color:'000000'},valign:'top',margin:[3,5,3,5],autoPage:false});
  });
 }));
 return ppt.writeFile({fileName});
}

/* ---------- 8. UI ---------- */
function download(blob,name){const a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}
const safe=s=>String(s||'').replace(/[^A-Za-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,60)||'Program';
function fileBase(models,Y){return models.length===1?'Charter_Plain_RKMK_'+safe(models[0].kode||models[0].judul)+'_'+Y:'Charter_Plain_RKMK_'+models.length+'_Program_'+Y}
function printPdf(models,Y){
 const w=window.open('','_blank');if(!w){say('Pop-up diblokir. Izinkan pop-up untuk menyimpan PDF.');return}
 w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+E(fileBase(models,Y))+'</title><style>'+CSS+'@page{size:A4 landscape;margin:12mm}body{margin:0}.mtcis-doc .mtcis-pg{border:0;margin:0;padding:0}.mtcis-doc .mtcis-pg:last-child{page-break-after:auto;break-after:auto}td{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>'+html(models)+'</body></html>');
 w.document.close();setTimeout(()=>{try{w.focus();w.print()}catch(_){}},350);
}
function openPlain(programId){
 const S=st(),Y=year(),M=g('modal');if(typeof M!=='function')return;
 const all=programsOf(Y).filter(p=>charterOf(p)),cur=(S.programs||[]).find(p=>String(p.id)===String(programId));
 if(!all.length&&!(cur&&charterOf(cur))){say('Belum ada Charter Program pada tahun '+Y+'.');return}
 const ui={scope:cur&&charterOf(cur)?'one':'all'};
 const pick=()=>ui.scope==='one'&&cur?[model(cur)]:all.map(p=>model(p));
 const body='<style>'+CSS+'</style><div class="mtcis-plain"><div class="mtcis-bar"><label><input type="radio" name="mtcis-scope" value="one" '+(cur&&charterOf(cur)?'':'disabled')+' '+(ui.scope==='one'?'checked':'')+'> Program terpilih'+(cur?': <b>'+E(cur.nama)+'</b>':'')+'</label>'+
  '<label><input type="radio" name="mtcis-scope" value="all" '+(ui.scope==='all'?'checked':'')+' '+(all.length?'':'disabled')+'> Semua program '+Y+' yang memiliki charter ('+all.length+')</label>'+
  (typeof g('MT_INFO_ICON')==='function'?g('MT_INFO_ICON')('Format plain: tabel hitam-putih tanpa warna/desain, siap disalin ke lampiran RKMK. Word dan PDF A4 lanskap; PowerPoint 16:9 dengan font 12–16 (memenuhi slide) dan tabel yang otomatis dipecah ke slide lanjutan bila terlalu panjang. Rencana Kerja: kolom bulan untuk ≤2 tahun, triwulan untuk >2 tahun.'):'')+'</div><div class="mtcis-pv" data-mtcis-pv></div></div>';
 const ov=M('Unduh Charter Program · Plain (RKMK)',body,null,null,{size:'mtcis-md',cancel:'Tutup',extra:'<button class="btn" data-mx="pdf">⇩ PDF</button><button class="btn" data-mx="pptx">⇩ PowerPoint</button><button class="btn pri" data-mx="docx">⇩ Word</button>',
  onExtra:(k)=>{const L=pick(),base=fileBase(L,Y),busy=g('busy'),off=g('busyOff');
   if(k==='pdf'){printPdf(L,Y);return false}
   (async()=>{try{if(typeof busy==='function')busy('Menyusun berkas plain…',base);
     if(k==='docx'){download(await docxBlob(L),base+'.docx');say('Word plain diunduh.')}
     else{await pptxWrite(L,base+'.pptx');say('PowerPoint plain diunduh.')}}
    catch(e){say('Gagal membuat berkas: '+(e.message||e))}finally{if(typeof off==='function')off()}})();
   return false}});
 const draw=()=>{ov.querySelector('[data-mtcis-pv]').innerHTML=html(pick())};draw();
 ov.addEventListener('change',e=>{if(e.target.name==='mtcis-scope'){ui.scope=e.target.value;draw()}});
}
function openImport(){
 if(!canImport()){say('Impor charter hanya untuk SA, PMO Kemenkeu, dan PMO Unit.');return}
 const inp=document.createElement('input');inp.type='file';inp.accept='.xlsx,.xls,.xlsm';
 inp.onchange=async()=>{const f=inp.files&&inp.files[0];if(!f)return;const busy=g('busy'),off=g('busyOff');
  try{if(typeof busy==='function')busy('Membaca Tabulasi Charter IS…',f.name);const r=await readFile(f);if(typeof off==='function')off();
   if(!r.rows.length){say('Tidak ada baris IS dengan kolom Program Transformasi terisi.');return}importDialog(r)}
  catch(e){if(typeof off==='function')off();say('Gagal membaca Excel: '+(e.message||e))}};
 inp.click();
}
function importDialog(r){
 const M=g('modal');const U={Y:year(),sel:{},target:{},open:''};
 const init=()=>{const progs=programsOf(U.Y),auto=autoMatch(r.rows,progs);r.rows.forEach((x,i)=>{const a=auto[i];U.target[i]=a?a.id:(canCreate()?'__new__':'');U.sel[i]=!!U.target[i]})};
 const statusOf=i=>{const t=U.target[i];if(!t)return ['skip','Dilewati'];if(t==='__new__')return ['new','Program baru (Draft '+U.Y+') + charter'];
  const p=(st().programs||[]).find(x=>String(x.id)===t);if(!p)return ['skip','Program tidak ditemukan'];
  if(!canProg(p))return ['lock',p.psStatus==='Ditetapkan'?'Program sudah ditetapkan':'Di luar kewenangan unit'];
  const c=p.psProgramCharter;if(c&&c.st==='Disahkan')return ['lock','Charter sudah disahkan'];
  return c&&Object.keys(c).length?['over','Timpa isian charter'+(Array.isArray(c.rk)&&c.rk.some(z=>T(z&&z.t))?' (Rencana Kerja dipertahankan)':'')]:['fill','Isi charter baru']};
 const progOpts=i=>{const progs=programsOf(U.Y),t=U.target[i];return '<option value="">— Lewati —</option>'+(canCreate()?'<option value="__new__"'+(t==='__new__'?' selected':'')+'>+ Buat usulan program baru</option>':'')+
  progs.map(p=>'<option value="'+E(p.id)+'"'+(String(p.id)===t?' selected':'')+(canProg(p)?'':' disabled')+'>'+E((p.kodeResmi||p.kode?(p.kodeResmi||p.kode)+' · ':'')+p.nama)+(p.psProgramCharter&&Object.keys(p.psProgramCharter).length?' · ada charter':'')+'</option>').join('')};
 const previewOf=i=>{const rec=r.rows[i],t=U.target[i],p=t&&t!=='__new__'?(st().programs||[]).find(x=>String(x.id)===t):null,pp=p||{id:'baru',akr:'BARU',nama:rec.judul,psYear:U.Y};
  const {charter}=toCharter(rec,pp,U.Y,p&&p.psProgramCharter,r);return html([model(pp,charter)])};
 const rowsHtml=()=>r.rows.map((x,i)=>{const [k,l]=statusOf(i),dis=k==='lock'||k==='skip';return '<tr class="'+(U.open===String(i)?'on':'')+'"><td><input type="checkbox" data-mtcis-sel="'+i+'" '+(U.sel[i]&&!dis?'checked':'')+' '+(dis?'disabled':'')+' aria-label="Pilih '+E(x.judul)+'"></td><td><b>'+E(x.kode||'—')+'</b><small>'+E(x.klaster||'')+'</small></td><td><b>'+E(x.judul)+'</b><small>'+E(x.lead||'')+'</small></td><td><select data-mtcis-target="'+i+'" aria-label="Program tujuan '+E(x.judul)+'">'+progOpts(i)+'</select></td><td><span class="mtcis-st '+k+'">'+E(l)+'</span></td><td><button type="button" class="btn btn-sm" data-mtcis-open="'+i+'">'+(U.open===String(i)?'Tutup':'Pratinjau')+'</button></td></tr>'+
  (U.open===String(i)?'<tr class="mtcis-pvrow"><td colspan="6"><div class="mtcis-pv">'+previewOf(i)+'</div></td></tr>':'')}).join('');
 const yrs=[2025,2026,2027,2028,2029];
 const body='<style>'+CSS+'</style><div class="mtcis-imp"><div class="mtcis-bar"><span>Berkas <b>'+E(r.file)+'</b> · sheet <b>'+E(r.sheet)+'</b> · '+r.rows.length+' IS</span><label>Tahun program tujuan <select data-mtcis-year>'+yrs.map(y=>'<option'+(y===U.Y?' selected':'')+'>'+y+'</option>').join('')+'</select></label>'+
  (typeof g('MT_INFO_ICON')==='function'?g('MT_INFO_ICON')('Pemetaan kolom: Program Transformasi → Judul; Tujuan Program; Latar Belakang; Terobosan; Output; Outcome; Key Milestones (dipisah per tahun); Risiko; Pendukung Kesuksesan; Initiative Champion; Initiative Owner; Milestones (Level 4) dan Kriteria Penyelesaian → Kriteria Penyelesaian; Penanggung Jawab → UIC Utama/Pendukung Rencana Kerja (bulan Mulai/Selesai diisi manual). Kode IS, klaster, dan Lead/UIC dicatat sebagai sumber impor. Charter Disahkan dan program Ditetapkan tidak ditimpa.'):'')+'</div>'+
  (r.missing.length?'<div class="note w" style="margin:0 0 8px"><span>Kolom tidak ditemukan dan akan dibiarkan kosong: '+E(r.missing.join(', '))+'.</span></div>':'')+
  '<div class="mtcis-tw"><table class="mtcis-tbl"><thead><tr><th><input type="checkbox" data-mtcis-all aria-label="Pilih semua"></th><th>Kode IS</th><th>Program Transformasi (Excel)</th><th>Program tujuan di aplikasi</th><th>Hasil</th><th></th></tr></thead><tbody data-mtcis-rows></tbody></table></div></div>';
 init();
 const ov=M('Impor Charter Program · Tabulasi Charter IS',body,'Terapkan Impor',()=>apply(r,U),{size:'mtcis-md'});
 const draw=()=>{ov.querySelector('[data-mtcis-rows]').innerHTML=rowsHtml();const n=r.rows.filter((x,i)=>U.sel[i]&&!['lock','skip'].includes(statusOf(i)[0])).length;const all=ov.querySelector('[data-mtcis-all]'),elig=r.rows.filter((x,i)=>!['lock','skip'].includes(statusOf(i)[0]));if(all)all.checked=!!elig.length&&n===elig.length;const ok=ov.querySelector('[data-ok]');if(ok){ok.textContent='Terapkan Impor ('+n+')';ok.disabled=!n}};
 draw();
 ov.addEventListener('change',e=>{const t=e.target;
  if(t.matches('[data-mtcis-year]')){U.Y=+t.value;U.open='';init();draw();return}
  if(t.matches('[data-mtcis-target]')){const i=+t.dataset.mtcisTarget,v=t.value;if(v&&v!=='__new__')Object.keys(U.target).forEach(j=>{if(+j!==i&&U.target[j]===v){U.target[j]='';U.sel[j]=false}});U.target[i]=v;U.sel[i]=!!v;draw();return}
  if(t.matches('[data-mtcis-sel]')){U.sel[+t.dataset.mtcisSel]=t.checked;draw();return}
  if(t.matches('[data-mtcis-all]')){r.rows.forEach((x,i)=>U.sel[i]=t.checked&&!!U.target[i]);draw()}});
 ov.addEventListener('click',e=>{const b=e.target.closest('[data-mtcis-open]');if(!b)return;U.open=U.open===b.dataset.mtcisOpen?'':b.dataset.mtcisOpen;draw()});
}
function apply(r,U){
 const S=st();S.programs=S.programs||[];let nNew=0,nFill=0,lastId='';const skipped=[];
 r.rows.forEach((rec,i)=>{
  if(!U.sel[i]||!U.target[i])return;
  let p;
  if(U.target[i]==='__new__'){if(!canCreate())return;p=newProgram(rec,U.Y);S.programs.push(p);nNew++}
  else p=S.programs.find(x=>String(x.id)===U.target[i]);
  if(!p||!canProg(p)||(p.psProgramCharter&&p.psProgramCharter.st==='Disahkan')){skipped.push(rec.kode||rec.judul);return}
  p.psProgramCharter=toCharter(rec,p,U.Y,p.psProgramCharter,r).charter;nFill++;lastId=String(p.id);
 });
 if(!nFill){say('Tidak ada charter yang diimpor.');return false}
 const ui=S.ui||(S.ui={});ui.psSelectedYear=U.Y;
 try{const P=g('MT_PROJECT_SELECTION');const s=P&&P.internals&&P.internals.state&&P.internals.state();if(s){s.prog=lastId;s.tab='charter'}}catch(_){}
 const sv=g('save'),rd=g('render');if(typeof sv==='function')sv();if(typeof rd==='function')rd();
 say(nFill+' charter program diisi dari Tabulasi Charter IS'+(nNew?' ('+nNew+' usulan program baru dibuat, lengkapi kode resmi & UIC di Usulan Program)':'')+(skipped.length?'; dilewati: '+skipped.join(', '):'')+'. Bulan Rencana Kerja perlu diisi.');
}
const API={version:VERSION,fromAoa,parseMs,parseKp,parsePj,parseOw,toCharter,autoMatch,score,model,tables,html,docxBody,docxBlob,pptxWrite,readFile,openImport,openPlain,newProgram,leadUnit,canImport};
G.MT_CHARTER_IS=API;
const A=g('ACT');if(A&&typeof A==='object'){A.mtCisImport=()=>openImport();A.mtCisPlain=el=>openPlain(el&&el.dataset?el.dataset.id:'')}
})(typeof window!=='undefined'?window:globalThis);
