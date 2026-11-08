/* Pemetaan proyek lintas-program dan lintas-tahun. Tahun sumber tidak dimutasi. */
(function(){
'use strict';
const B=window.MT_PROJECT_SELECTION,I=B?.internals;if(!B||!I)return;
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const C=x=>JSON.parse(JSON.stringify(x)),year=()=>+S.ui.tahun||2026;
const uid=t=>(t||'proj')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
const can=p=>!!ME&&['SA','PMOK','PMOU'].includes(ME.role)&&(!p||ME.role!=='PMOU'||!p.uic||p.uic===ME.unit)&&(!p||p.psStatus!=='Ditetapkan');
const bank=()=>{S.ui.psBank=S.ui.psBank||{};const b=S.ui.psBank;b.map=b.map||{year:2026,program:'',q:'',selected:[]};return b};
const get=id=>(S.programs||[]).find(p=>String(p.id)===String(id));
const sourceWbs=(p,y)=>(S.wbs||[]).filter(w=>w.prog===p.akr&&!w.arsip&&+(String(w.f||w.s||'').slice(0,4))===+y);
function modules(p,y){
 if(!p)return[];
 const dict=new Map();
 (p.psProjects||[]).forEach(x=>{const name=String(x.name||'').trim();if(name)dict.set(name.toLowerCase(),{name,uic:x.uic||p.uic,original:x,rows:[]})});
 sourceWbs(p,y).forEach(w=>{
  const path=w.p||[],core=p.akr==='CORE'||/core system apbn/i.test(p.nama||'');
  let name=core&&/pengembangan integrated core system/i.test(path[2]||'')?(path[3]||path[4]):(path[2]||path[1]||path[3]);
  const all=path.join(' / '),special=all.match(/\b(FRSW|SIPK)\b/i);
  if(special&&!new RegExp('\\b'+special[1]+'\\b','i').test(String(name||'')))name=special[1].toUpperCase();
  name=String(name||'(tanpa nama modul)').trim();const key=name.toLowerCase();
  const x=dict.get(key)||{name,uic:String(w.u||p.uic||'').split(/[,(]/)[0].trim(),original:null,rows:[]};
  x.rows.push(w);dict.set(key,x);
 });
 return [...dict.values()].sort((a,b)=>a.name.localeCompare(b.name,'id'));
}
function eligible(p,y){if(p.psYear)return +p.psYear===+y;const match=String(p.periode||'').match(/20\d{2}/g)||[];const from=+p.mulai||+(match[0]||0),to=+(match[match.length-1]||from);return from&&from<=y&&to>=y}
function sourceList(y,target){return (S.programs||[]).filter(p=>p.id!==target.id&&eligible(p,y))}
function shift(v,from,to){return typeof v==='string'&&new RegExp('^'+from+'-\\d{2}-\\d{2}').test(v)?String(to)+v.slice(4):v}
function target(){
 const id=bank().target;const p=get(id);
 return p&&+p.psYear===year()?p:I.pickedProgram();
}
function render(){
 const p=target();if(!p)return '<div class="psbank-card psbank-empty">Belum ada program tahun '+year()+'. Tambahkan dari Daftar Program terlebih dahulu.</div>';
 const m=bank().map,years=[2025,2026,2027,2028,2029].filter(x=>x<=year());
 const sources=sourceList(+m.year,p);
 if(!sources.some(x=>String(x.id)===String(m.program)))m.program=sources[0]?.id||'';
 const s=get(m.program),q=String(m.q||'').toLowerCase(),catalog=modules(s,+m.year).filter(x=>[x.name,x.uic,...x.rows.flatMap(w=>w.p||[])].join(' ').toLowerCase().includes(q));
 const arr=p.psProjects||[],draft=p.psWbsDraft||[];
 return '<div class="psbank-card"><div class="psbank-sectionhead"><div><h3>Pemetaan Proyek / Modul</h3><p>Tentukan ruang lingkup program tujuan dan ambil modul dari program lain, termasuk Core APBN 2026.</p></div>'+
 (can(p)?'<button class="btn pri" data-pswf="add-project">+ Proyek Baru</button>':'')+'</div>'+
 '<div class="psbank-mapping-summary"><span>Program Tujuan: <b>'+E(p.nama)+'</b> · '+E(p.kode||p.akr)+'</span><span><b>'+arr.length+'</b> proyek/modul · <b>'+draft.length+'</b> WBS draft</span></div>'+
 '<div class="psbank-mapcols"><section class="psbank-mapbox"><h4>Proyek dalam '+E(p.nama)+'</h4><p>Susunan program '+year()+'. Perubahan belum mengubah data historis.</p>'+
 '<div class="psbank-mapitems">'+(arr.length?arr.map(x=>{
  const n=draft.filter(w=>(w.p||[]).some(z=>String(z).toLowerCase()===String(x.name).toLowerCase())).length;
  return '<article><div><b>'+E(x.name)+'</b><small>'+E(x.uic||p.uic||'—')+' · '+n+' item WBS</small></div><div class="psbank-rowactions"><button class="btn btn-outline btn-sm" data-pswf-project="'+E(x.id)+'">Ubah</button>'+
  (can(p)?'<button class="btn btn-ghost btn-sm" data-scope-remove="'+E(x.id)+'">Hapus</button>':'')+'</div></article>'
 }).join(''):'<div class="psbank-empty">Belum ada proyek. Pilih modul dari program sumber di sebelah kanan.</div>')+'</div></section>'+
 '<section class="psbank-mapbox"><h4>Ambil Proyek dari Program Lain</h4><p>Contoh: Digitalisasi Core System APBN → pilih FRSW dan SIPK untuk Digitalisasi Core Non APBN.</p>'+
 '<div class="psbank-mapcontrols"><label>Tahun Sumber <select data-scope-year>'+years.map(y=>'<option value="'+y+'" '+(y===+m.year?'selected':'')+'>'+y+'</option>').join('')+'</select></label>'+
 '<label>Program Sumber <select data-scope-program>'+sources.map(x=>'<option value="'+E(x.id)+'" '+(x.id===m.program?'selected':'')+'>'+E(x.nama)+'</option>').join('')+'</select></label></div>'+
 '<label class="psbank-searchlabel">Cari Modul <input type="search" data-scope-search value="'+E(m.q||'')+'" placeholder="FRSW, SIPK, nama proyek..."></label>'+
 '<div class="psbank-mapitems psbank-catalog">'+(catalog.length?catalog.map(x=>{
  const id=m.program+'::'+x.name;return '<label class="psbank-catalogitem"><input type="checkbox" data-scope-select="'+E(id)+'" '+(m.selected.includes(id)?'checked':'')+'><span><b>'+E(x.name)+'</b><small>'+E(x.uic||'—')+' · '+x.rows.length+' item WBS sumber</small></span></label>';
 }).join(''):'<div class="psbank-empty">Modul tidak ditemukan. Ganti program/tahun sumber atau kata pencarian.</div>')+'</div>'+
 '<div class="psbank-mapfoot"><span>'+m.selected.length+' dipilih</span><button class="btn pri" data-scope-transfer '+(!can(p)||!m.selected.length?'disabled':'')+'>+ Masukkan ke Program Tujuan</button></div></section></div>'+
 '<div class="psbank-note">Pemindahan berlaku pada usulan tahun '+year()+'. Program dan realisasi 2026 tidak dihapus. Jika modul sudah ditetapkan pada program tahun tujuan lainnya, perubahan memerlukan Change Request.</div></div>';
}
function remove(id){
 const p=target(),x=p?.psProjects?.find(z=>String(z.id)===String(id));if(!p||!x||!can(p))return;
 const n=(p.psWbsDraft||[]).filter(w=>(w.p||[]).some(v=>String(v).toLowerCase()===String(x.name).toLowerCase())).length;
 if(!window.confirm('Hapus modul '+x.name+' dari usulan '+p.nama+' beserta '+n+' WBS draft? Data sumber tidak berubah.'))return;
 p.psProjects=p.psProjects.filter(z=>z!==x);
 p.psWbsDraft=(p.psWbsDraft||[]).filter(w=>!(w.p||[]).some(v=>String(v).toLowerCase()===String(x.name).toLowerCase()));
 save();window.render();toast('Modul dikeluarkan dari program usulan.');
}
function transfer(){
 const p=target(),m=bank().map,s=get(m.program);if(!p||!s||!can(p))return;
 const selected=new Set(m.selected),items=modules(s,+m.year).filter(x=>selected.has(s.id+'::'+x.name));
 if(!items.length){toast('Pilih minimal satu modul pada program sumber.');return}
 const others=I.programs().filter(q=>q.id!==p.id),dupes=[];
 items.forEach(item=>others.forEach(other=>{
  const rows=(other.psProjects||[]).filter(x=>String(x.name||'').toLowerCase()===item.name.toLowerCase()&&(x.psOriginAkr===s.akr||x.psOriginAkr===s.psCarry?.sourceAkr||other.psCarry?.sourceAkr===s.akr));
  if(rows.length)dupes.push({other,rows});
 }));
 if(dupes.some(x=>x.other.psStatus==='Ditetapkan')){toast('Modul sudah berada pada program yang ditetapkan. Gunakan revisi/Change Request.');return}
 if(dupes.length&&!window.confirm('Sebagian modul sudah ada pada program tujuan lain tahun '+year()+'. Pindahkan dari usulan lama ke '+p.nama+'?'))return;
 let n=0,count=0;
 items.forEach(item=>{
  others.forEach(other=>{
   const rows=(other.psProjects||[]).filter(x=>String(x.name||'').toLowerCase()===item.name.toLowerCase()&&(x.psOriginAkr===s.akr||x.psOriginAkr===s.psCarry?.sourceAkr||other.psCarry?.sourceAkr===s.akr));
   if(!rows.length)return;
   other.psProjects=other.psProjects.filter(x=>!rows.includes(x));
   other.psWbsDraft=(other.psWbsDraft||[]).filter(w=>!rows.some(x=>(w.p||[]).some(v=>String(v).toLowerCase()===String(x.name).toLowerCase())));
  });
  if((p.psProjects||[]).some(x=>String(x.name).toLowerCase()===item.name.toLowerCase()))return;
  const orig=C(item.original||{});
  const z={...orig,id:uid('proj'),name:item.name,uic:item.uic||s.uic||p.uic,status:'Usulan',included:true,scores:{},poster:{},risks:{},indicators:[],benefits:[],psOriginAkr:s.akr,psOriginProgram:s.nama,psOriginYear:m.year};
  z.start=shift(z.start,+m.year,year());z.goLive=shift(z.goLive,+m.year,year());
  p.psProjects=p.psProjects||[];p.psProjects.push(z);n++;
  const used=new Set([...(S.wbs||[]).map(w=>w.k),...(p.psWbsDraft||[]).map(w=>w.k)]);
  item.rows.forEach(w=>{
   let i=1,k;do{k=p.akr+'-'+i++}while(used.has(k));used.add(k);
   const x=C(w);x.id=x.k=k;x.prog=p.akr;x.p=(x.p||[]).slice();
   if(x.p[0]===s.akr||x.p[0]===s.nama)x.p[0]=p.akr;
   x.s=shift(x.s,+m.year,year());x.f=shift(x.f,+m.year,year());x.tm=x.f?+x.f.slice(5,7):0;
   x.rm=0;x.v=0;x.arsip=false;x.psCarryDraft=true;x.psSourceWbs=w.k;x.psSourceYear=m.year;x.psSourceProgram=s.akr;
   delete x.bukti;delete x.actual;delete x.aktual;delete x.realisasi;
   p.psWbsDraft=p.psWbsDraft||[];p.psWbsDraft.push(x);count++;
  });
 });
 m.selected=[];p.psUpdatedAt=new Date().toISOString();save();window.render();
 toast(n+' modul telah dimasukkan ke program tujuan, bersama '+count+' item WBS draft.');
}
function click(ev){
 const rm=ev.target.closest('[data-scope-remove]');if(rm){remove(rm.dataset.scopeRemove);return true}
 if(ev.target.closest('[data-scope-transfer]')){transfer();return true}
 return false;
}
function change(ev){
 const el=ev.target,m=bank().map;
 if(el.dataset.scopeTarget!==undefined){bank().target=el.value;I.state().prog=el.value;save();window.render();return true}
 if(el.dataset.scopeYear!==undefined){m.year=+el.value;m.program='';m.selected=[];save();window.render();return true}
 if(el.dataset.scopeProgram!==undefined){m.program=el.value;m.selected=[];save();window.render();return true}
 if(el.dataset.scopeSelect!==undefined){const id=el.dataset.scopeSelect;m.selected=el.checked?[...new Set([...m.selected,id])]:m.selected.filter(x=>x!==id);save();window.render();return true}
 return false;
}
window.MT_PS_SCOPE={modules,sourceWbs,render,transfer,click,change,bank,target,version:'20261108-scope-map-v1'};
})();