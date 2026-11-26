/* Project Selection · Referensi & Rubrik interaktif (SMART & MCDA) — v20261127-refx1
   Renderer generik berbasis spec: hero + rumus, alur metode, rubrik kartu/matriks (tinggi statis),
   widget tambahan, referensi dengan filter. Semua kelas diberi awalan rfx- agar tidak bentrok. */
(function(){
'use strict';
const SPEC={},ST={};
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LV=['Sangat rendah','Rendah','Sedang','Tinggi','Sangat tinggi'];
const st=id=>ST[id]||(ST[id]={cur:0,pick:null,mode:'kartu',q:'',filt:'',flow:null});

function hl(txt,q){const t=E(txt);if(!q)return t;const qq=E(q).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return t.replace(new RegExp('('+qq+')','gi'),'<mark>$1</mark>')}
function tagsOf(c){return (c.auto?'<span class="rfx-tag auto">otomatis</span>':'')+(c.cost?'<span class="rfx-tag cost">biaya</span>':'')}

function klist(id){const sp=SPEC[id],s=st(id);let h='',g0=null;
 sp.crit.map((c,i)=>[c,i]).sort((a,b)=>(a[0].gi||0)-(b[0].gi||0)||a[1]-b[1]).forEach(([c,i])=>{
  if(c.grp&&c.grp!==g0){g0=c.grp;h+='<div class="rfx-grp"><i style="background:'+E(c.color)+'"></i>'+E(c.grp)+'</div>'}
  h+='<div class="rfx-k'+(i===s.cur?' rfx-on':'')+'" data-rfx-k="'+i+'" role="button" tabindex="0"><code>'+E(c.code)+'</code><div><b>'+E(c.name)+'</b>'+(c.short||c.auto||c.cost?'<small>'+(c.short?E(c.short):'')+tagsOf(c)+'</small>':'')+'</div><span class="rfx-w">'+E(c.wShort)+'</span></div>'});
 return h}
function kpanel(id,cur,pick){const sp=SPEC[id],s=st(id),c=sp.crit[cur],q=s.q;
 const util=i=>sp.util?sp.util(c,i):(i+1)/5;
 return '<div class="rfx-kh"><span class="rfx-big">'+E(c.code)+'</span><div><h3>'+E(c.name)+' '+tagsOf(c)+'</h3><p>'+hl(c.q,q)+'</p></div><div class="rfx-side">'+c.side+'</div></div>'+
 '<div class="rfx-ladder">'+c.rub.map((t,i)=>{const u=util(i),lvl=c.cost?5-i:i+1;return '<div class="rfx-lv rfx-l'+lvl+(pick===i?' rfx-pick':'')+'" data-rfx-lv="'+i+'" role="button" tabindex="0"><div class="rfx-s"><i>'+(i+1)+'</i><span>'+LV[i]+'</span></div><p>'+hl(t,q)+'</p>'+(sp.utilLabel?'<div class="rfx-u">'+sp.utilLabel(c,i)+'</div>':'')+'<div class="rfx-bar"><b style="width:'+Math.round(u*100)+'%;background:'+(u>=1?'#0F7A4B':'#1D3A78')+'"></b></div></div>'}).join('')+'</div>'+
 (c.cost?'<div class="rfx-costnote"><b>Kriteria biaya.</b> Nilai makin tinggi berarti beban/risiko makin besar sehingga utility makin kecil — warna tangga dibalik.</div>':'')+
 (c.auto?'<div class="rfx-src">⟳ <span><b>Dapat terisi otomatis</b> dari: '+E(c.auto)+'. Penilai tetap memeriksa hasilnya.</span></div>':'')+
 '<div class="rfx-ask"><div class="rfx-q"><b>'+E(sp.askLabel||'Pertanyaan penilai')+'</b>'+hl(c.ask||c.q,q)+'</div><div class="rfx-c"><b>'+E(sp.contribLabel||'Kontribusi ke skor')+'</b>'+(c.evidence?E(c.evidence)+(pick!=null?'<br><br>':''):'')+(pick!=null?sp.contrib(c,pick):(c.evidence?'':sp.contribHint(c)))+'</div></div>'+
 (c.refs&&c.refs.length?'<div class="rfx-refs"><small>Rujukan</small>'+c.refs.map(r=>'<span>'+E(r)+'</span>').join('')+'</div>':'')}
function matrix(id){const sp=SPEC[id],q=st(id).q;
 return '<table><thead><tr><th>Kriteria</th>'+LV.map((l,i)=>'<th>'+(i+1)+' · '+l+'</th>').join('')+'</tr></thead><tbody>'+
 sp.crit.map(c=>'<tr><td>'+E(c.code+' '+c.name)+'<small>'+(c.grp?E(c.grp)+' · ':'')+E(c.wText||'')+tagsOf(c)+'</small></td>'+c.rub.map((t,i)=>{const u=sp.util?sp.util(c,i):(i+1)/5;return '<td class="'+(u>=1?'rfx-c5':'')+'">'+hl(t,q)+'</td>'}).join('')+'</tr>').join('')+'</tbody></table>'}

function html(spec){
 SPEC[spec.id]=spec;const s=st(spec.id);if(s.cur>=spec.crit.length)s.cur=0;
 const flowDet=s.flow!=null&&spec.flow[s.flow]?spec.flow[s.flow].det:'';
 return '<div class="rfx" data-rfx="'+E(spec.id)+'">'+
 '<section class="rfx-hero"><div class="rfx-hl"><div class="rfx-eye">'+E(spec.eyebrow)+'</div><h2>'+E(spec.title)+'</h2><p>'+spec.desc+'</p><div class="rfx-chips">'+spec.chips.map(c=>'<span>'+E(c)+'</span>').join('')+'</div></div>'+
 '<div class="rfx-formula"><small>'+E(spec.formula.label)+'</small><div class="rfx-f">'+spec.formula.f+'</div>'+(spec.formula.sub?'<div class="rfx-fsub">'+spec.formula.sub+'</div>':'')+
 '<div class="rfx-wbar">'+spec.wbar.map(w=>'<i style="width:'+w.pct+'%;background:'+E(w.color)+'" title="'+E(w.title)+'"></i>').join('')+'</div><div class="rfx-wleg" style="grid-template-columns:repeat('+spec.wleg.length+',1fr)">'+spec.wleg.map(l=>'<span><b><i style="background:'+E(l.color)+'"></i>'+E(l.label)+'</b>'+E(l.sub)+'</span>').join('')+'</div></div></section>'+
 '<section class="rfx-sec"><div class="rfx-sech"><h3>'+E(spec.flowTitle||'Alur metode')+'</h3><small>klik tiap langkah untuk aturan lengkap</small><span class="rfx-sp"></span>'+(spec.tools||'')+'</div>'+
 '<div class="rfx-flow">'+spec.flow.map((f,i)=>'<div class="rfx-step'+(s.flow===i?' rfx-on':'')+'" data-rfx-step="'+i+'" role="button" tabindex="0"><div class="rfx-n">'+(i+1)+'</div><h4>'+E(f.t)+'</h4><p>'+E(f.d)+'</p><div class="rfx-out">'+f.out.map(o=>'<span class="rfx-o-'+o[1]+'">'+E(o[0])+'</span>').join('')+'</div></div>').join('')+'</div>'+
 '<div class="rfx-detail'+(flowDet?' rfx-on':'')+'">'+flowDet+'</div></section>'+
 '<section class="rfx-sec"><div class="rfx-sech"><h3>Rubrik skala penilaian 1–5</h3><small>'+spec.rubNote+'</small><span class="rfx-sp"></span>'+
 '<input class="rfx-search" type="search" data-rfx-q value="'+E(s.q)+'" placeholder="'+E(spec.searchPh||'Cari kata di rubrik…')+'" aria-label="Cari kata di rubrik"><span class="rfx-toggle"><button type="button" data-rfx-mode="kartu" class="'+(s.mode==='kartu'?'rfx-on':'')+'">Kartu</button><button type="button" data-rfx-mode="matriks" class="'+(s.mode==='matriks'?'rfx-on':'')+'">Matriks</button></span></div>'+
 '<div class="rfx-rub" style="'+(s.mode==='kartu'?'':'display:none')+'"><div class="rfx-klist">'+klist(spec.id)+'</div><div class="rfx-kpanel">'+kpanel(spec.id,s.cur,s.pick)+'</div></div>'+
 '<div class="rfx-mx" style="'+(s.mode==='matriks'?'':'display:none')+'">'+matrix(spec.id)+'</div></section>'+
 (spec.extra||'')+
 '<section class="rfx-sec"><div class="rfx-sech"><h3>Referensi & literasi</h3><small>'+E(spec.refNote||'klik chip untuk menyorot rujukannya')+'</small><span class="rfx-sp"></span><span class="rfx-kf">'+[{key:'',label:'Semua'}].concat(spec.filters).map(f=>'<button type="button" data-rfx-f="'+E(f.key)+'" class="'+(s.filt===f.key?'rfx-on':'')+'">'+E(f.label)+'</button>').join('')+'</span></div>'+
 '<div class="rfx-rgrid" style="grid-template-columns:repeat('+spec.refCols.length+',1fr)">'+spec.refCols.map(c=>'<div class="rfx-rcol"><h4><i>'+c.icon+'</i>'+E(c.title)+'<small>'+c.items.length+'</small></h4>'+c.items.map(r=>'<div class="rfx-ref'+(s.filt&&!(r.tags||[]).includes(s.filt)?' rfx-dim':'')+'" data-rfx-tags="'+E((r.tags||[]).join(' '))+'"><b>'+E(r.t)+'</b><small>'+E(r.sub)+'</small>'+((r.tags||[]).length?'<div class="rfx-kk">'+r.tags.map(t=>{const f=spec.filters.find(x=>x.key===t);return '<span'+(f&&f.color?' style="background:'+E(f.color)+'33"':'')+'>'+E(f?f.label:t)+'</span>'}).join('')+'</div>':'')+'</div>').join('')+'</div>').join('')+'</div></section>'+
 '<div class="rfx-foot">⚖ <span>'+spec.foot+'</span></div></div>'}

/* tinggi panel rubrik statis = tinggi terbesar dari semua kriteria × semua pilihan skor */
function fit(root){const id=root.dataset.rfx,sp=SPEC[id];if(!sp)return;const kp=root.querySelector('.rfx-kpanel'),kl=root.querySelector('.rfx-klist');
 if(!kp||!kp.offsetParent)return;const s=st(id),keep=kp.innerHTML;kp.style.minHeight='';let m=0;
 for(let i=0;i<sp.crit.length;i++)for(const pk of [null,0,1,2,3,4]){kp.innerHTML=kpanel(id,i,pk);m=Math.max(m,kp.offsetHeight)}
 kp.innerHTML=keep;kp.style.minHeight=m+'px';kl.style.height=m+'px';root.dataset.rfxFit=String(root.offsetWidth);
 const on=kl.querySelector('.rfx-on');if(on&&(on.offsetTop<kl.scrollTop||on.offsetTop>kl.scrollTop+m-40))kl.scrollTop=on.offsetTop-8;void s}
function fitAll(force){document.querySelectorAll('.rfx').forEach(r=>{if(force||r.dataset.rfxFit!==String(r.offsetWidth))fit(r)})}
let raf=0;const sched=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;fitAll(false)})};
if(typeof MutationObserver!=='undefined')new MutationObserver(m=>{if(m.some(x=>x.addedNodes.length))sched()}).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('resize',()=>{clearTimeout(fitAll._t);fitAll._t=setTimeout(()=>fitAll(true),150)});

function redrawK(root){const id=root.dataset.rfx,s=st(id),kl=root.querySelector('.rfx-klist'),top=kl.scrollTop;
 kl.innerHTML=klist(id);kl.scrollTop=top;root.querySelector('.rfx-kpanel').innerHTML=kpanel(id,s.cur,s.pick)}
function act(root,el,ev){const id=root.dataset.rfx,sp=SPEC[id],s=st(id);if(!sp)return false;
 if(el.dataset.rfxStep!=null){const i=+el.dataset.rfxStep;s.flow=s.flow===i?null:i;root.querySelectorAll('.rfx-step').forEach((x,j)=>x.classList.toggle('rfx-on',j===s.flow));const d=root.querySelector('.rfx-detail');d.innerHTML=s.flow==null?'':sp.flow[i].det;d.classList.toggle('rfx-on',s.flow!=null);return true}
 if(el.dataset.rfxK!=null){s.cur=+el.dataset.rfxK;s.pick=null;redrawK(root);return true}
 if(el.dataset.rfxLv!=null){const v=+el.dataset.rfxLv;s.pick=s.pick===v?null:v;redrawK(root);return true}
 if(el.dataset.rfxMode){s.mode=el.dataset.rfxMode;root.querySelectorAll('[data-rfx-mode]').forEach(b=>b.classList.toggle('rfx-on',b===el));root.querySelector('.rfx-rub').style.display=s.mode==='kartu'?'':'none';const mx=root.querySelector('.rfx-mx');mx.style.display=s.mode==='matriks'?'':'none';mx.innerHTML=matrix(id);if(s.mode==='kartu')fit(root);return true}
 if(el.dataset.rfxF!=null){s.filt=el.dataset.rfxF;root.querySelectorAll('[data-rfx-f]').forEach(b=>b.classList.toggle('rfx-on',b===el));root.querySelectorAll('.rfx-ref').forEach(r=>r.classList.toggle('rfx-dim',!!s.filt&&!r.dataset.rfxTags.split(' ').includes(s.filt)));return true}
 if(el.dataset.rfxAct&&sp.act){sp.act(el.dataset.rfxAct,el,root,ev);return true}
 return false}
const SEL='[data-rfx-step],[data-rfx-k],[data-rfx-lv],[data-rfx-mode],[data-rfx-f],[data-rfx-act]';
document.addEventListener('click',ev=>{const el=ev.target.closest&&ev.target.closest(SEL);if(!el)return;const root=el.closest('.rfx');if(!root)return;if(act(root,el,ev)){ev.preventDefault();ev.stopPropagation()}},true);
document.addEventListener('keydown',ev=>{if(ev.key!=='Enter'&&ev.key!==' ')return;const el=ev.target.closest&&ev.target.closest('[data-rfx-step],[data-rfx-k],[data-rfx-lv]');if(!el)return;const root=el.closest('.rfx');if(root&&act(root,el,ev))ev.preventDefault()});
document.addEventListener('input',ev=>{const t=ev.target;if(!t.closest)return;const root=t.closest('.rfx');if(!root)return;const id=root.dataset.rfx,sp=SPEC[id],s=st(id);
 if(t.matches('[data-rfx-q]')){s.q=t.value.trim();if(s.q){const lq=s.q.toLowerCase(),i=sp.crit.findIndex(c=>(c.name+' '+c.q+' '+c.rub.join(' ')).toLowerCase().includes(lq));if(i>=0&&i!==s.cur){s.cur=i;s.pick=null}}redrawK(root);root.querySelector('.rfx-mx').innerHTML=matrix(id);ev.stopPropagation();return}
 if(t.dataset.rfxIn&&sp.input){sp.input(t.dataset.rfxIn,t,root);ev.stopPropagation()}},true);
document.addEventListener('change',ev=>{const t=ev.target;if(t.closest&&t.closest('.rfx')&&(t.matches('[data-rfx-q]')||t.dataset.rfxIn))ev.stopPropagation()},true);

(function css(){if(document.getElementById('rfx-style'))return;const x=document.createElement('style');x.id='rfx-style';x.textContent=`
.rfx{--rn:#12275A;--rn2:#1D3A78;--ri:#0F2346;--rm:#64748B;--rl:#E2E8F0;--rs:#F5F8FD;--rg:#F2B92C;--rg2:#FFF4D6;--rok:#0F7A4B;color:var(--ri);font-size:13px}
.rfx *{box-sizing:border-box}
.rfx-hero{position:relative;overflow:hidden;border-radius:18px;background:linear-gradient(115deg,#0E1F4A,#1D3A78 65%,#24479A);color:#fff;padding:20px 22px;display:grid;grid-template-columns:1.2fr 1fr;gap:22px;align-items:center}
.rfx-hero:after{content:"";position:absolute;right:-70px;top:-90px;width:330px;height:330px;border-radius:50%;border:1px solid rgba(242,185,44,.35);box-shadow:0 0 0 30px rgba(242,185,44,.05),0 0 0 70px rgba(242,185,44,.03);pointer-events:none}
.rfx-hl{position:relative;z-index:1}.rfx-eye{font-size:11px;letter-spacing:.08em;font-weight:800;color:var(--rg);text-transform:uppercase}
.rfx-hero h2{margin:6px 0;font-size:22px;color:#fff;line-height:1.25}.rfx-hero p{margin:0;color:#C7D4EC;line-height:1.6;font-size:13px}
.rfx-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}.rfx-chips span{font-size:11px;font-weight:700;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);border-radius:999px;padding:3px 10px;color:#fff}
.rfx-formula{position:relative;z-index:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:14px 16px}
.rfx-formula small{display:block;font-size:10.5px;font-weight:800;letter-spacing:.06em;color:#C7D4EC;text-transform:uppercase}
.rfx-f{font-size:19px;font-weight:800;margin:6px 0 6px;font-family:"Cambria Math",Georgia,serif;color:#fff}.rfx-f em{color:var(--rg);font-style:normal}
.rfx-fsub{font-size:11.5px;color:#C7D4EC;margin-bottom:6px}.rfx-fsub b{color:#fff}
.rfx-wbar{display:flex;height:10px;border-radius:6px;overflow:hidden;margin-top:6px}.rfx-wbar i{display:block;height:100%;border-right:1px solid #12275A}
.rfx-wleg{display:grid;gap:4px;margin-top:6px;font-size:10.5px;color:#C7D4EC}.rfx-wleg b{display:block;color:#fff;font-size:11.5px}.rfx-wleg b i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px}
.rfx-sec{margin-top:18px}.rfx-sech{display:flex;align-items:center;gap:10px;margin:0 0 10px;flex-wrap:wrap}.rfx-sech h3{margin:0;font-size:15px;color:var(--rn)}.rfx-sech small{color:var(--rm);font-size:12px}.rfx-sp{flex:1}
.rfx-flow{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.rfx-step{background:#fff;border:1px solid var(--rl);border-radius:14px;padding:14px;position:relative;cursor:pointer;transition:.15s}
.rfx-step:hover{box-shadow:0 10px 24px rgba(18,39,90,.08);border-color:#B9C9E4}.rfx-step.rfx-on{border:2px solid var(--rn);padding:13px;box-shadow:0 10px 24px rgba(18,39,90,.12)}
.rfx-n{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:var(--rn);color:var(--rg);font-weight:900}
.rfx-step h4{margin:10px 0 4px;font-size:14px;color:var(--ri)}.rfx-step p{margin:0;color:#475569;line-height:1.5;font-size:12.5px}
.rfx-out{margin-top:10px;display:flex;gap:5px;flex-wrap:wrap}.rfx-out span{font-size:10.5px;font-weight:800;border-radius:999px;padding:2px 8px}
.rfx-step:not(:last-child):after{content:"›";position:absolute;right:-12px;top:50%;transform:translateY(-50%);width:20px;height:20px;border-radius:50%;background:var(--rg);color:var(--ri);display:grid;place-items:center;font-weight:900;z-index:2}
.rfx-o-ok{background:#E3F5EB;color:var(--rok)}.rfx-o-bad{background:#FDE8E8;color:#B42318}.rfx-o-warn{background:var(--rg2);color:#8A5A00}.rfx-o-n{background:#EEF2FB;color:var(--rn)}
.rfx-detail{margin-top:10px;background:#fff;border:1px solid var(--rl);border-radius:14px;padding:14px 16px;display:none}
.rfx-detail.rfx-on{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.rfx-detail h5{margin:0 0 6px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--rn)}
.rfx-detail p,.rfx-detail li{font-size:12.8px;line-height:1.6;color:#1E293B;margin:0}.rfx-detail ul{margin:0;padding-left:18px}
.rfx-tip{background:var(--rg2);border-radius:10px;padding:9px 12px;font-size:12px;color:#5C4300;margin-top:8px}.rfx-tip.bad{background:#FDE8E8;color:#991B1B}
.rfx-cat{display:flex;gap:6px;margin-top:6px}.rfx-cat span{flex:1;text-align:center;border-radius:8px;padding:7px 4px;font-size:11.5px;font-weight:800}
.rfx-rub{display:grid;grid-template-columns:300px 1fr;gap:14px;align-items:start}
.rfx-klist{background:#fff;border:1px solid var(--rl);border-radius:14px;padding:8px;display:flex;flex-direction:column;gap:3px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#C9D8EE transparent}
.rfx-grp{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--rm);padding:8px 10px 2px;display:flex;gap:6px;align-items:center}.rfx-grp i{width:8px;height:8px;border-radius:2px;display:inline-block}
.rfx-k{display:grid;grid-template-columns:38px 1fr auto;gap:8px;align-items:center;padding:9px 10px;border-radius:10px;cursor:pointer;flex:none}
.rfx-k:hover{background:var(--rs)}.rfx-k.rfx-on{background:var(--rn);color:#fff}
.rfx-k code{font-family:ui-monospace,Consolas,monospace;font-weight:900;font-size:12px;background:#EEF2FB;color:var(--rn);border-radius:6px;text-align:center;padding:3px 0}
.rfx-k.rfx-on code{background:var(--rg);color:var(--ri)}
.rfx-k b{font-size:12.5px;line-height:1.3}.rfx-k small{display:block;font-size:10.5px;color:var(--rm)}.rfx-k.rfx-on small{color:#C7D4EC}
.rfx-w{font-size:11px;font-weight:800;color:var(--rn2)}.rfx-k.rfx-on .rfx-w{color:var(--rg)}
.rfx-tag{font-size:9.5px;font-weight:800;border-radius:5px;padding:1px 5px;margin-left:4px;vertical-align:1px;white-space:nowrap}.rfx-tag.auto{background:#E0F2FE;color:#075985}.rfx-tag.cost{background:#FDE8E8;color:#B42318}
.rfx-k small .rfx-tag:first-child{margin-left:0}.rfx-k.rfx-on .rfx-tag.auto{background:#0EA5E9;color:#fff}.rfx-k.rfx-on .rfx-tag.cost{background:#F87171;color:#fff}
.rfx-kpanel{background:#fff;border:1px solid var(--rl);border-radius:14px;padding:16px 18px;display:flex;flex-direction:column}
.rfx-kh{display:flex;gap:14px;align-items:flex-start}.rfx-big{font-family:ui-monospace,Consolas,monospace;font-size:24px;font-weight:900;color:var(--rn);background:#EEF2FB;border-radius:12px;padding:6px 12px;flex:none}
.rfx-kh h3{margin:2px 0 4px;font-size:17px;color:var(--ri)}.rfx-kh p{margin:0;color:#475569;line-height:1.55}
.rfx-side{margin-left:auto;text-align:right;flex:none}.rfx-side b{display:block;font-size:22px;color:var(--rn2)}.rfx-side small{color:var(--rm);font-size:11px}
.rfx-ladder{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:16px;flex:1}
.rfx-lv{border-radius:12px;padding:12px;border:1px solid var(--rl);background:#fff;min-height:150px;display:flex;flex-direction:column;cursor:pointer;transition:transform .15s,box-shadow .15s}
.rfx-lv:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(18,39,90,.08)}
.rfx-s{display:flex;align-items:center;gap:8px}.rfx-s i{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;font-style:normal;font-weight:900;color:#fff;flex:none}
.rfx-s span{font-size:10.5px;font-weight:800;color:var(--rm);text-transform:uppercase;letter-spacing:.04em}
.rfx-lv p{margin:10px 0 0;font-size:12.8px;line-height:1.5}.rfx-u{font-size:11px;font-weight:800;color:var(--rm);margin-top:8px}
.rfx-bar{margin-top:auto;height:5px;border-radius:4px;background:#EEF2F7;overflow:hidden}.rfx-bar b{display:block;height:100%}
.rfx-lv.rfx-pick{outline:3px solid var(--rg);outline-offset:-1px}
.rfx-l1 .rfx-s i{background:#94A3B8}.rfx-l2 .rfx-s i{background:#7C93B8}.rfx-l3 .rfx-s i{background:#4D6FA8}.rfx-l4 .rfx-s i{background:#1D3A78}.rfx-l5 .rfx-s i{background:var(--rok)}.rfx-l5{background:#F3FBF6;border-color:#BFE5CE}
.rfx-costnote{margin-top:12px;background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:9px 12px;font-size:12.3px;color:#991B1B}
.rfx-src{margin-top:12px;display:flex;gap:10px;align-items:center;background:#F0F9FF;border:1px solid #BAE6FD;border-radius:10px;padding:9px 12px;font-size:12.3px;color:#075985}
.rfx-ask{margin-top:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.rfx-ask>div{border-radius:10px;padding:10px 12px;font-size:12.3px;line-height:1.5}.rfx-q{background:var(--rs)}.rfx-c{background:var(--rg2);color:#5C4300}
.rfx-ask b{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}.rfx-ask b.rfx-inl{display:inline;text-transform:none;letter-spacing:0;font-size:13px}
.rfx-refs{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;align-items:center}.rfx-refs small{font-weight:800;color:var(--rm);font-size:11px;margin-right:4px}
.rfx-refs span{font-size:11.5px;border:1px solid var(--rl);border-radius:999px;padding:3px 10px;background:var(--rs)}
.rfx-mx{background:#fff;border:1px solid var(--rl);border-radius:14px;overflow:auto;max-height:560px}
.rfx-mx table{border-collapse:separate;border-spacing:0;width:100%;font-size:12px}
.rfx-mx th{position:sticky;top:0;background:var(--rn);color:#fff;text-align:left;padding:10px;font-size:11px;letter-spacing:.04em;z-index:1}
.rfx-mx td{padding:10px;border-bottom:1px solid #EEF2F7;vertical-align:top;line-height:1.45}
.rfx-mx td:first-child{font-weight:800;width:220px;background:#FBFCFE}.rfx-mx td:first-child small{display:block;font-weight:600;color:var(--rm);margin-top:2px}
.rfx-mx td.rfx-c5{background:#F3FBF6}.rfx-mx tr:hover td{background:#F5F8FD}
.rfx-toggle{display:inline-flex;border:1px solid #C9D8EE;border-radius:10px;overflow:hidden}.rfx-toggle button{border:0;background:#fff;padding:7px 12px;font:700 12px inherit;cursor:pointer;color:var(--ri)}.rfx-toggle button.rfx-on{background:var(--rn);color:#fff}
.rfx-search{height:34px;border:1px solid #C9D8EE;border-radius:10px;padding:0 12px;font:inherit;width:240px;background:#fff}
.rfx mark{background:#FFE38A;border-radius:3px;padding:0 1px;color:inherit}
.rfx-kf{display:flex;gap:4px;flex-wrap:wrap}.rfx-kf button{border:1px solid #C9D8EE;background:#fff;color:var(--rn);border-radius:999px;padding:4px 10px;font:800 11px inherit;cursor:pointer}.rfx-kf button.rfx-on{background:var(--rn);color:#fff;border-color:var(--rn)}
.rfx-rgrid{display:grid;gap:12px}
.rfx-rcol{background:#fff;border:1px solid var(--rl);border-radius:14px;padding:14px}
.rfx-rcol h4{margin:0 0 10px;display:flex;align-items:center;gap:8px;font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:var(--rn)}
.rfx-rcol h4 i{font-style:normal;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:#EEF2FB}.rfx-rcol h4 small{margin-left:auto;color:var(--rm);font-weight:700}
.rfx-ref{padding:9px 0;border-top:1px dashed var(--rl);transition:opacity .15s}.rfx-rcol h4+.rfx-ref{border-top:0}
.rfx-ref b{display:block;font-size:12.5px;line-height:1.4}.rfx-ref small{color:var(--rm);font-size:11.5px}
.rfx-kk{display:flex;gap:4px;margin-top:5px;flex-wrap:wrap}.rfx-kk span{font-size:10px;font-weight:800;border-radius:5px;padding:1px 6px;background:#EEF2FB;color:var(--rn)}
.rfx-ref.rfx-dim{opacity:.3}
.rfx-foot{margin-top:16px;display:flex;gap:10px;align-items:center;background:#fff;border:1px solid var(--rl);border-left:4px solid var(--rg);border-radius:12px;padding:12px 14px;font-size:12.5px;color:#334155}.rfx-foot b{color:var(--rn)}
.rfx-tools{display:flex;gap:6px;flex-wrap:wrap}
.rfx-calc{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.rfx-box{background:#fff;border:1px solid var(--rl);border-radius:14px;padding:14px 16px}
.rfx-box h4{margin:0 0 2px;font-size:14px;color:var(--ri)}.rfx-box>p{margin:0 0 10px;color:var(--rm);font-size:12px}
.rfx-row{display:grid;grid-template-columns:130px 1fr 34px;gap:10px;align-items:center;padding:6px 0;border-top:1px dashed var(--rl)}.rfx-row:first-of-type{border-top:0}.rfx-row.r2{grid-template-columns:130px 1fr}
.rfx-row b{font-size:12.5px}.rfx-row input{width:100%;accent-color:#1D3A78}.rfx-row output{font-weight:900;color:var(--rn);text-align:center;background:#EEF2FB;border-radius:7px;padding:3px 0}
.rfx-pills{display:flex;gap:4px}.rfx-pills button{flex:1;border:1px solid #C9D8EE;background:#fff;border-radius:8px;padding:6px 4px;font:700 11.5px inherit;cursor:pointer;color:var(--ri)}.rfx-pills button.rfx-on{background:var(--rn);color:#fff;border-color:var(--rn)}
.rfx-res{margin-top:12px;display:flex;align-items:center;gap:12px;background:var(--rn);color:#fff;border-radius:12px;padding:10px 14px}
.rfx-res .v{font-size:26px;font-weight:900;color:var(--rg);min-width:34px;text-align:center}.rfx-res small{color:#C7D4EC;display:block;font-size:11.5px}.rfx-res b{font-size:13px}
.rfx-scale{position:relative;margin-top:22px}
.rfx-band{display:grid;height:46px;border-radius:12px;overflow:hidden;font-weight:800;font-size:12px}
.rfx-band div{display:flex;flex-direction:column;justify-content:center;padding:0 12px;min-width:0}.rfx-band small{font-weight:600;font-size:10.5px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rfx-ticks{display:flex;justify-content:space-between;font-size:10.5px;color:var(--rm);margin-top:4px}
.rfx-thr{position:absolute;top:-8px;height:62px;width:0;border-left:2px dashed var(--ri)}
.rfx-thr span{position:absolute;top:-20px;left:-36px;white-space:nowrap;font-size:11px;font-weight:800;background:var(--rg);border-radius:6px;padding:2px 6px}
.rfx-thrctl{display:flex;align-items:center;gap:10px;margin-top:14px;font-size:12.3px;flex-wrap:wrap}.rfx-thrctl input{flex:1;min-width:160px;accent-color:#F2B92C}
.rfx-rules{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.rfx-rules div{background:var(--rs);border-radius:10px;padding:10px 12px;font-size:12.3px;line-height:1.5}.rfx-rules b{display:block;color:var(--rn);margin-bottom:2px}
@media(max-width:1100px){.rfx-hero,.rfx-calc{grid-template-columns:1fr}.rfx-flow{grid-template-columns:repeat(2,1fr)}.rfx-step:after{display:none}.rfx-rub{grid-template-columns:240px 1fr}.rfx-rgrid{grid-template-columns:1fr!important}.rfx-ladder{grid-template-columns:repeat(3,1fr)}.rfx-detail.rfx-on,.rfx-rules{grid-template-columns:1fr}}
`;document.head.appendChild(x)})();

window.MT_PS_REFX={html,fit,fitAll,E,version:'20261127-refx1'};
})();
