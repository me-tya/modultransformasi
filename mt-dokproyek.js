/* Dokumen Proyek per proyek (Bab V KEP-43 Perencanaan Proyek angka 1–2) — 2026-11-25
   · Disimpan di S.charters (koleksi yang sama) dengan field tambahan:
       cov : daftar cakupan proyek, kunci "proyek" atau "proyek › subproyek" (huruf kecil)
       dk  : kode dokumen, mis. DP-CORE-02 (tetap sama untuk semua versinya)
   · Charter lama (tanpa cov) = dokumen proyek awal yang mencakup semua proyek program yang belum
     punya dokumen sendiri. Tidak ada data yang dipindah/dihapus.
   · Satu proyek/subproyek hanya boleh ada di satu dokumen proyek. Memilih proyek induk berarti
     subproyeknya ikut; bila sebagian subproyek sudah di dokumen lain, induknya tidak bisa dipilih utuh. */
(function(){
'use strict';
const E=v=>esc(v==null?'':v);
const nk=s=>String(s||'').trim().toLowerCase();
const kP=n=>nk(n),kS=(n,s)=>nk(n)+' › '+nk(s);
const RANK={Draft:0,Reviu:1,Disahkan:2};
const pre=p=>'DP-'+String(p.akr||p.kode||'').replace(/^B\d+-/,'').toUpperCase();
const prog=akr=>(S.programs||[]).find(p=>p.akr===akr);

/* Kelompok dokumen per program: satu kelompok = satu dokumen (semua versinya). */
function groups(akr){
 const p=prog(akr)||{akr},G={};
 (S.charters||[]).filter(c=>c.prog===akr).forEach(c=>{(G[c.dk||'']=G[c.dk||'']||[]).push(c)});
 return Object.entries(G).map(([key,all])=>{
  const live=all.filter(c=>c.st!=='Arsip');if(!live.length)return null;
  const c=live.slice().sort((a,b)=>(RANK[a.st]??3)-(RANK[b.st]??3)||(+b.ver||0)-(+a.ver||0))[0];
  const base=live.filter(x=>x.st==='Disahkan').sort((a,b)=>(+b.ver||0)-(+a.ver||0))[0]||null;
  return {key,c,base,all,legacy:!key,code:key||pre(p)+'-01',cov:key?(c.cov||[]):null};
 }).filter(Boolean).sort((a,b)=>a.legacy?-1:b.legacy?1:a.code.localeCompare(b.code));
}
/* Dokumen yang mencakup proyek (dan subproyek). */
function coverOf(akr,n,sub,GG){
 const G=GG||groups(akr),ex=G.filter(g=>!g.legacy);
 if(sub){const own=ex.find(g=>g.cov.includes(kS(n,sub)));if(own)return {g:own};
  const par=ex.find(g=>g.cov.includes(kP(n)));if(par)return {g:par,inh:true}}
 else{const own=ex.find(g=>g.cov.includes(kP(n)));if(own)return {g:own}}
 const lg=G.find(g=>g.legacy);return lg?{g:lg,legacy:true}:null;
}
const okOf=c=>(typeof chDocOk==='function'?chDocOk(c):{});
const PARTS=()=>(typeof CHPG!=='undefined'?CHPG:[]);
const canC=p=>typeof chCan==='function'&&chCan('C',p);

/* ---- sel tabel (dipakai pProgram di Perencanaan) ---- */
function head(){return '<th>Dokumen</th>'+PARTS().map((x,i)=>'<th class="ctr dp-h" title="'+E(x[2]||x[1])+'"><b class="dn2">'+(i+1)+'</b><span class="sm">'+E(x[1])+'</span></th>').join('')}
function cells(p,r,sub,G){
 const o=coverOf(p.akr,r.n,sub&&sub.name,G);
 if(!o){
  return '<td>'+(canC(p)&&!sub?'<button type="button" class="btn sm dp-new" data-act="dpNew" data-p="'+E(p.akr)+'" data-k="'+E(kP(r.n))+'">+ Dokumen</button>':'<span class="s">—</span>')+'</td>'+PARTS().map(()=>'<td class="ctr"><span class="s">·</span></td>').join('');
 }
 const ok=okOf(o.g.c),id=o.g.c.id;
 const tag=o.inh?'<span class="chip c-gray dp-tag" title="Tercakup dokumen proyek induknya">↳ ikut induk</span>':o.legacy?'<span class="chip c-gray dp-tag" title="Dokumen proyek awal (dari charter program sebelumnya) yang berlaku untuk proyek yang belum punya dokumen proyek sendiri">dokumen awal</span>':'';
 return '<td class="dp-cell"><button type="button" class="dp-code" data-act="dpOpen" data-id="'+E(id)+'" data-mode="view" title="Lihat '+E(o.g.code)+'">'+E(o.g.code)+'</button>'+tag+'</td>'+
  PARTS().map(([k,l])=>'<td class="ctr"><button type="button" class="dok-dot'+(ok[k]?' y':'')+'" data-act="dpOpen" data-id="'+E(id)+'" data-tab="'+k+'" data-mode="edit" title="'+E(l)+(ok[k]?' · terisi':' · belum diisi')+' — buka untuk diisi">'+(ok[k]?'✓':'○')+'</button></td>').join('');
}
function docBtn(p,r,sub,G,ico){
 const o=coverOf(p.akr,r.n,sub&&sub.name,G);
 if(o)return '<button type="button" class="pm-ws-icon doc'+(sub?' sub':'')+'" data-act="dpOpen" data-id="'+E(o.g.c.id)+'" data-mode="view" title="Dokumen Perencanaan Proyek '+E(o.g.code)+'" aria-label="Dokumen Perencanaan Proyek">'+ico+'</button>';
 return canC(p)&&!sub?'<button type="button" class="pm-ws-icon doc" data-act="dpNew" data-p="'+E(p.akr)+'" data-k="'+E(kP(r.n))+'" title="Buat Dokumen Perencanaan Proyek" aria-label="Buat Dokumen Perencanaan Proyek">'+ico+'</button>':'<button type="button" class="pm-ws-icon doc" disabled title="Belum ada dokumen proyek">'+ico+'</button>';
}
function rowId(p,r,sub,G){const o=coverOf(p.akr,r.n,sub&&sub.name,G);return o?o.g.c.id:''}
/* Ringkasan di kepala kartu program */
function summary(p,P,G){
 const ex=G.filter(g=>!g.legacy),lg=G.find(g=>g.legacy);
 const unc=P.filter(r=>!coverOf(p.akr,r.n,null,G)).length;
 return (unc?'<span class="chip c-warn" title="Proyek yang belum tercakup dokumen proyek mana pun">'+unc+' proyek belum ada dokumen</span>':'')+
  '<span class="pm-program-count" title="Dokumen proyek di program ini">'+(ex.length+(lg?1:0))+' dokumen proyek</span>';
}
function chips(p,G){return G.map(g=>'<button type="button" class="chip c-info dp-chip" data-act="dpOpen" data-id="'+E(g.c.id)+'" data-mode="view" title="'+E((g.c.judul||'')+' · '+(g.legacy?'dokumen awal':(g.cov||[]).length+' cakupan'))+'">'+E(g.code)+(g.legacy?' · lama':' · '+(g.cov||[]).length+' cakupan')+'</button>').join(' ')}

/* ---- pemilih cakupan ---- */
function tree(p,cur,pick){
 const P=progProjects(p),G=groups(p.akr),own=k=>{const g=G.find(g=>!g.legacy&&g.key!==cur&&g.cov.includes(k));return g?g.code:''};
 return P.map(r=>{const kp=kP(r.n),o=own(kp),subsOwn=(r.subItems||[]).map(x=>own(kS(r.n,x.name))).filter(Boolean),dis=!!o||subsOwn.length>0,on=pick.has(kp)||!!o;
  return '<label class="dp-node'+(dis?' dis':'')+'"><input type="checkbox" data-dpk="'+E(kp)+'" '+(on?'checked':'')+' '+(dis?'disabled':'')+'><b>'+E(r.n)+'</b>'+(r.psPendingWbs?' <span class="chip c-gray">belum ada WBS</span>':'')+(o?' <span class="chip c-gray">di '+E(o)+'</span>':subsOwn.length?' <span class="chip c-warn">sebagian subproyek di '+E(subsOwn[0])+'</span>':'')+'</label>'+
   (r.subItems||[]).map(x=>{const ks=kS(r.n,x.name),so=own(ks),inh=pick.has(kp)||!!o,d2=!!so||inh;
    return '<label class="dp-node sub'+(d2?' dis':'')+'"><input type="checkbox" data-dpk="'+E(ks)+'" '+(pick.has(ks)||so||inh?'checked':'')+' '+(d2?'disabled':'')+'>'+E(x.name)+(so?' <span class="chip c-gray">di '+E(so)+'</span>':inh?' <span class="chip c-gray">↳ ikut induk</span>':'')+'</label>'}).join('')}).join('')||'<p class="s" style="padding:10px">Belum ada proyek. Proyek muncul setelah ditetapkan di Project Selection atau WBS diimpor.</p>';
}
function picker(p,g,preKey){
 const pick=new Set(g?(g.cov||[]):(preKey?[preKey]:[]));
 const body='<div class="fgrid"><label class="fld full"><span>Judul dokumen</span><input class="inp" id="dp-name" value="'+E(g?g.c.dpNama||'':'')+'" placeholder="mis. ICS PNBP & Penganggaran-Belanja"></label></div>'+
  '<div class="dp-tree-h"><b>Cakupan proyek</b>'+(typeof IC==='function'?IC('Proyek = proyek yang ditetapkan di Project Selection (muncul di daftar walau WBS belum dibuat). Memilih proyek induk berarti subproyeknya ikut. Bila proyek ditetapkan di level sub modul, pilih sub modulnya. Satu proyek/subproyek hanya bisa ada di satu dokumen proyek.'):'')+'<span id="dp-n">'+pick.size+' dipilih</span></div><div class="dp-tree" id="dp-tree">'+tree(p,g?g.key:null,pick)+'</div>'+
  (g&&g.base?'<div class="note w" style="margin-top:10px"><span>Dokumen ini sudah disahkan. Perubahan cakupan (ruang lingkup) baru tersimpan bila dirujuk ke Change Request yang sudah disetujui.</span></div>'+crSelect(p):'')+
  (!g?'<p class="s" style="margin:10px 0 0">Bagian Charter Proyek terisi awal dari Charter Program; bagian lain disalin dari dokumen awal program ini (bila ada) sebagai titik awal.</p>':'');
 const ov=modal(g?'Ubah cakupan · '+E(g.code):'+ Dokumen Proyek · '+E(p.nama),body,'Simpan',()=>{
  const cov=[...pick];if(!cov.length){toast('Pilih minimal satu proyek.');return false}
  const name=(ov.querySelector('#dp-name')||{}).value||'';
  if(g){
   if(g.base&&JSON.stringify([...(g.base.cov||[])].sort())!==JSON.stringify(cov.slice().sort())){const cr=(ov.querySelector('#dp-cr')||{}).value;if(!cr){toast('Perubahan ruang lingkup memerlukan Change Request yang sudah disetujui.');return false}
    g.all.filter(c=>c.st!=='Arsip').forEach(c=>{c.cov=cov.slice();c.crRef=cr})}
   else g.all.forEach(c=>{if(c.st!=='Arsip')c.cov=cov.slice()});
   if(name)g.all.forEach(c=>c.dpNama=name);
   log('Ubah cakupan dokumen proyek',g.code+' · '+cov.join(', '));save();render();toast('Cakupan '+g.code+' disimpan.');return;
  }
  const c=create(p,cov,name);save();render();toast(c.dk+' dibuat. Charter Proyek terisi dari Charter Program — lengkapi bagian lainnya.');
  setTimeout(()=>window.MT_DOC_EXPERIENCE?.openProject?.(p,'asis',true,c.id),60);
 },{size:'wide'});
 const sync=()=>{ov.querySelector('#dp-tree').innerHTML=tree(p,g?g.key:null,pick);ov.querySelector('#dp-n').textContent=pick.size+' dipilih'};
 ov.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.dpk;if(!k)return;
  if(e.target.checked){pick.add(k);if(!k.includes(' › '))[...pick].forEach(x=>{if(x.startsWith(k+' › '))pick.delete(x)})}else pick.delete(k);sync()});
}
function crSelect(p){const L=(S.crs||[]).filter(c=>['Disetujui Ketua','Diterapkan'].includes(c.st));
 return '<label class="fld" style="margin-top:8px"><span>Change Request yang disetujui</span><select class="sel" id="dp-cr"><option value="">— pilih CR —</option>'+L.map(c=>'<option value="'+E(c.kode||c.id)+'">'+E((c.kode||'CR')+' · '+(c.st)+' · '+String(c.alasan||c.item||'').slice(0,60))+'</option>').join('')+'</select></label>'}
function nextCode(p){const G=groups(p.akr);let n=1;G.forEach(g=>{const m=/-(\d+)$/.exec(g.code);if(m)n=Math.max(n,+m[1])});return pre(p)+'-'+String(n+1).padStart(2,'0')}
function create(p,cov,name){
 const lg=groups(p.akr).find(g=>g.legacy);
 const base=lg?JSON.parse(JSON.stringify(lg.c)):{asis:{pb:'',masalah:'',kor:[],tek:'',link:''},tobe:{pb:[],pot:[],ar:'',link:'',arLink:''},cs:[],kp:[],mf:[],rk:[]};
 const pc=p.psProgramCharter||{};
 ['judul','tujuan','lb','tb','out','oc','ms','ris','pk','ch','ow','p1','p2'].forEach(k=>{if(pc[k]!=null&&(Array.isArray(pc[k])?pc[k].length:String(pc[k]).trim()))base[k]=JSON.parse(JSON.stringify(pc[k]))});
 const c=Object.assign(base,{id:uid(),prog:p.akr,dk:nextCode(p),dpNama:name||'',cov,ver:1,st:'Draft',tahun:+S.ui.tahun||2026,log:[{st:'Draft',by:(ME&&(ME.nama||ME.email))||'PMO',at:TODAY}]});
 delete c.disahkanAt;delete c.disahkanBy;delete c.sumberPptx;
 if(name)c.judul=name;
 S.charters=S.charters||[];S.charters.push(c);log('Buat dokumen proyek',c.dk+' · '+cov.join(', '));return c;
}
/* Aturan ubah setelah disahkan: isian ruang lingkup/output/jadwal/milestone/rencana kerja &
   jumlah kriteria penerimaan wajib dirujuk ke CR; narasi lain langsung menjadi versi baru. */
const LOCK=[['out','Output / keluaran'],['p1','Periode mulai'],['p2','Periode selesai'],['ms','Key milestones'],['rk','Rencana kerja'],['cov','Ruang lingkup (cakupan proyek)']];
function lockedDiff(d,base){if(!base)return [];const J=v=>JSON.stringify(v==null?'':v);const out=[];
 LOCK.forEach(([k,l])=>{if(J(d[k])!==J(base[k]))out.push(l)});
 const kc=x=>(x||[]).map(r=>(Array.isArray(r.k)?r.k.length:String(r.k||'').split('\n').filter(Boolean).length));
 if(J(kc(d.kp))!==J(kc(base.kp))||(d.kp||[]).length!==(base.kp||[]).length)out.push('Kriteria penerimaan (tambah/hapus kriteria = perubahan scope)');
 return out}
function baseOf(c){if(!c)return null;const all=(S.charters||[]).filter(x=>x.prog===c.prog&&(x.dk||'')===(c.dk||'')&&x.st==='Disahkan'&&x.id!==c.id);return all.sort((a,b)=>(+b.ver||0)-(+a.ver||0))[0]||null}

ACT.dpNew=el=>{const p=prog(el.dataset.p);if(!p)return;if(!canC(p))return toast('Tidak memiliki hak membuat dokumen proyek.');picker(p,null,el.dataset.k||'')};
ACT.dpScope=el=>{const c=(S.charters||[]).find(x=>x.id===el.dataset.id);if(!c||!c.dk)return toast('Dokumen awal mencakup semua proyek yang belum punya dokumen sendiri; buat dokumen proyek baru untuk memisahkannya.');const p=prog(c.prog);const g=groups(c.prog).find(g=>g.key===c.dk);picker(p,g)};
ACT.dpOpen=el=>{const c=(S.charters||[]).find(x=>x.id===el.dataset.id);if(!c)return;const p=prog(c.prog);if(!p)return;
 const X=window.MT_DOC_EXPERIENCE;if(!X||!X.openProject)return toast('Penampil dokumen belum termuat, muat ulang halaman.');
 X.openProject(p,el.dataset.tab||'asis',el.dataset.mode==='edit',c.id)};

/* Panel Dokumen Proyek di Workspace Proyek */
function wsPanel(p,proj,sub,head,hint){
 const o=coverOf(p.akr,proj,sub||null);
 if(!o)return '<section class="ws-panel">'+head('dokumen','Dokumen Proyek',canC(p)&&!sub?'<button type="button" class="btn sm pri" data-act="dpNew" data-p="'+E(p.akr)+'" data-k="'+E(kP(proj))+'">+ Dokumen Proyek</button>':'')+hint('Proyek ini belum tercakup dokumen proyek. Dokumen proyek (7 bagian, Bab V KEP-43) disusun pada T-1 dan disepakati paling lambat 15 hari kerja setelah K-Wide ditetapkan.')+'</section>';
 const c=o.g.c,ok=okOf(c),n=PARTS().filter(x=>ok[x[0]]).length;
 return '<section class="ws-panel">'+head('dokumen','Dokumen Proyek '+E(o.g.code),'<button type="button" class="btn sm" data-act="dpOpen" data-id="'+E(c.id)+'" data-mode="view">👁 Lihat</button>'+(o.g.legacy?'':'<button type="button" class="btn sm" data-act="dpScope" data-id="'+E(c.id)+'">Ubah cakupan</button>'),(c.st||'Draft')+' · v'+(c.ver||1)+' · '+n+'/7 bagian terisi')+
  hint(o.inh?'Subproyek ini tercakup dokumen proyek induknya.':o.legacy?'Dokumen proyek awal program ini (dari charter sebelumnya) berlaku untuk proyek yang belum punya dokumen sendiri.':'Cakupan: '+E((c.cov||[]).join(', ')))+
  '<div class="ws-dp">'+PARTS().map(([k,l],i)=>'<button type="button" class="'+(ok[k]?'y':'')+'" data-act="dpOpen" data-id="'+E(c.id)+'" data-tab="'+k+'" data-mode="edit" title="'+E(l)+'"><i>'+(i+1)+'</i>'+E(l)+(ok[k]?' ✓':'')+'</button>').join('')+'</div></section>';
}
window.MTDP={wsPanel,groups,coverOf,head,cells,docBtn,rowId,summary,chips,picker,create,lockedDiff,baseOf,crSelect,kP,kS,LOCK};
})();
