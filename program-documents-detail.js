/* Program document viewer: the TTE preview and download share the same original PDF blob.
   Charter Program uses the same chDeck3 / dkHtml / dkPptx model used by Project Selection. */
(function(){
'use strict';
if(window.MT_PM_PROGRAM_DOCS)return;
const esc=value=>String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
let active=null;
const docs=()=>window.MT_PS_DOC;
const currentYear=()=>Number(S?.ui?.tahun)||2026;
function findProgram(code){
 const all=Array.isArray(S?.programs)?S.programs:[];
 return all.find(p=>String(p.akr)===String(code))||all.find(p=>String(p.id)===String(code))||null;
}
function signedRows(p){
 const ids=new Set([p.id,p.akr].filter(Boolean).map(String));
 (S.programs||[]).filter(x=>String(x.akr)===String(p.akr)).forEach(x=>{if(x.id)ids.add(String(x.id))});
 const out=[];
 Object.entries(S.psVersionLedger||{}).forEach(([key,rows])=>{
  const match=/^program:(.*):([0-9]{4})$/.exec(key);
  if(!match||!ids.has(match[1])||!Array.isArray(rows))return;
  rows.filter(x=>x&&x.status==='signed').forEach(x=>out.push(Object.assign({},x,{documentYear:Number(match[2])})));
 });
 const uniq=new Set();
 return out.filter(x=>{if(uniq.has(x.id))return false;uniq.add(x.id);return true})
  .sort((a,b)=>(b.documentYear===currentYear())-(a.documentYear===currentYear())||
   String(b.createdAt||'').localeCompare(String(a.createdAt||''))||
   Number(b.version||0)-Number(a.version||0));
}
function hasCharter(p){
 if(p.psProgramCharter&&typeof p.psProgramCharter==='object'&&Object.keys(p.psProgramCharter).length)return true;
 return (S.charters||[]).some(c=>String(c.prog)===String(p.akr)&&c.st!=='Arsip');
}
function buildDeck(p){
 if(!hasCharter(p))throw Error('Charter Program belum dibuat untuk program ini di Project Selection.');
 if(typeof chDeck3!=='function'||typeof dkHtml!=='function'||typeof dkPptx!=='function'||!docs()?.programCharterSource)
  throw Error('Mesin dokumen Charter Program belum tersedia. Muat ulang aplikasi.');
 const year=Number(p.psYear)||currentYear();
 const deck=chDeck3(docs().programCharterSource(p,year));
 if(!deck?.slides||deck.slides.length!==3)throw Error('Charter Program harus menghasilkan tiga slide.');
 return deck;
}
function cleanup(s){
 if(!s)return;
 s.resize?.disconnect();
 if(s.resizeFn)window.removeEventListener('resize',s.resizeFn);
 if(s.keyFn)document.removeEventListener('keydown',s.keyFn);
 if(s.url)URL.revokeObjectURL(s.url);
 s.node?.remove();
 if(active===s)active=null;
 try{s.focus?.focus({preventScroll:true})}catch(_){}
}
function close(){cleanup(active)}
function dialog(title,subtitle){
 close();
 const node=document.createElement('div');
 node.className='mtpd-backdrop';
 node.innerHTML='<section class="mtpd-dialog" role="dialog" aria-modal="true" aria-label="'+esc(title)+'">'+
  '<header class="mtpd-head"><div><b>'+esc(title)+'</b><small>'+esc(subtitle)+'</small></div><button type="button" data-mtpd-close title="Tutup" aria-label="Tutup">×</button></header>'+
  '<main class="mtpd-body" data-mtpd-body></main>'+
  '<footer class="mtpd-footer"><span data-mtpd-footnote></span><div><button type="button" class="btn" data-mtpd-close>Tutup</button><button type="button" class="btn pri" data-mtpd-download disabled>Unduh</button></div></footer>'+
  '</section>';
 const s={node,focus:document.activeElement,blob:null,url:null,resize:null,resizeFn:null,tick:0};
 active=s;document.body.appendChild(node);
 s.keyFn=e=>{if(e.key==='Escape'&&active===s){e.preventDefault();close()}};
 document.addEventListener('keydown',s.keyFn);
 node.addEventListener('click',ev=>{if(ev.target===node||ev.target.closest('[data-mtpd-close]'))close()});
 node.querySelector('[data-mtpd-close]').focus();
 return s;
}
function message(s,title,detail){
 if(!s||active!==s)return;
 s.node.querySelector('[data-mtpd-body]').innerHTML='<div class="mtpd-state"><strong>'+esc(title)+'</strong><p>'+esc(detail)+'</p></div>';
 s.node.querySelector('[data-mtpd-download]').disabled=true;
}
async function proofBlob(rec){
 const reader=docs()?.readLocalProof;
 if(typeof reader!=='function')throw Error('Modul penyimpanan berkas belum tersedia.');
 const blob=await reader(rec.id);
 if(!blob)throw Error('Berkas asli tidak ditemukan pada browser ini.');
 if(!/\.pdf$/i.test(String(rec.fileName||'')))throw Error('Bukti TTE tidak berformat PDF.');
 if(rec.hash&&window.crypto?.subtle){
  const bytes=new Uint8Array(await blob.arrayBuffer());
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  if(actual.toLowerCase()!==String(rec.hash).toLowerCase())throw Error('Fingerprint PDF berbeda dari catatan saat unggah. Berkas tidak ditampilkan demi keamanan.');
 }
 return blob;
}
function saveFile(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=String(name||'Dokumen_Program.pdf');document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),10000);
}
function pdfSelect(s,rows){
 const choose=s.node.querySelector('[data-mtpd-version]');
 if(choose){choose.innerHTML=rows.map((r,i)=>'<option value="'+i+'">v'+esc(r.version||1)+' · '+r.documentYear+' · '+esc(r.fileName||'Dokumen Program.pdf')+'</option>').join('')}
 let selected=0;
 async function show(i){
  const pos=Number(i);selected=Number.isFinite(pos)&&rows[pos]?pos:0;
  const rec=rows[selected],tick=++s.tick;
  s.blob=null;
  if(s.url){URL.revokeObjectURL(s.url);s.url=null}
  message(s,'Membuka PDF asli…','Pratinjau berasal dari file PDF yang telah diunggah, bukan dokumen yang dibuat ulang.');
  try{
   const blob=await proofBlob(rec);
   if(active!==s||tick!==s.tick)return;
   s.blob=blob;s.url=URL.createObjectURL(blob);
   const frame=document.createElement('iframe');frame.className='mtpd-pdf';frame.title='Pratinjau asli '+(rec.fileName||'Dokumen Program');frame.src=s.url;
   const body=s.node.querySelector('[data-mtpd-body]');body.innerHTML='';body.appendChild(frame);
   s.node.querySelector('[data-mtpd-download]').disabled=false;
   s.node.querySelector('[data-mtpd-download]').textContent='Unduh PDF';
   s.node.querySelector('[data-mtpd-footnote]').textContent='PDF asli unggahan · Tahun '+rec.documentYear+' · v'+(rec.version||1)+' · TTE belum diverifikasi secara kriptografis';
  }catch(e){
   message(s,'Berkas belum dapat dibuka',e?.message||String(e));
   s.node.querySelector('[data-mtpd-footnote]').textContent='Berkas tersimpan lokal pada perangkat/browser saat diunggah.';
  }
 }
 s.node.addEventListener('change',ev=>{if(ev.target.matches('[data-mtpd-version]'))show(ev.target.value)});
 s.node.querySelector('[data-mtpd-download]').addEventListener('click',()=>{if(s.blob)saveFile(s.blob,rows[selected].fileName)});
 show(0);
}
function showPDF(p,rows){
 const s=dialog('Dokumen Program',p.nama+' · '+(p.kodeResmi||p.kode||p.akr||''));
 if(!rows.length){
  message(s,'PDF hasil TTE belum tersedia','Unggah Dokumen Program sebagai PDF hasil TTE melalui Project Selection → Usulan Program → Unggah Dokumen Program.');
  s.node.querySelector('[data-mtpd-footnote]').textContent='Bukan dokumen draft atau hasil generate.';
  return;
 }
 const selector=rows.length>1?'<label class="mtpd-version">Versi unggahan <select data-mtpd-version></select></label>':
  '<div class="mtpd-version">PDF hasil TTE · '+esc(rows[0].fileName)+' · v'+esc(rows[0].version||1)+'</div>';
 s.node.querySelector('[data-mtpd-body]').insertAdjacentHTML('beforebegin',selector);
 pdfSelect(s,rows);
}
function drawSlide(s,i){
 s.slideIndex=i;
 const body=s.node.querySelector('[data-mtpd-body]');
 const deck=s.deck;
 body.innerHTML='<div class="mtpd-slide-panel"><aside class="mtpd-slide-nav" aria-label="Daftar tiga slide">'+
  deck.slides.map((x,j)=>'<button type="button" class="'+(i===j?'is-active':'')+'" data-mtpd-slide="'+j+'"><span>0'+(j+1)+'</span><b>'+esc(x.n||'Slide '+(j+1))+'</b></button>').join('')+
  '</aside><div class="mtpd-stage"><div class="mtpd-slide-box"><div class="dk-scale">'+dkHtml(deck.slides[i])+'</div></div>'+
  '<div class="mtpd-slide-controls"><span>Slide '+(i+1)+' / 3</span><div><button type="button" data-mtpd-prev '+(!i?'disabled':'')+'>← Sebelumnya</button><button type="button" data-mtpd-next '+(i===2?'disabled':'')+'>Berikutnya →</button></div></div></div></div>';
 const fit=()=>{
  const box=body.querySelector('.mtpd-slide-box'),scale=box?.querySelector('.dk-scale');
  if(box&&scale)scale.style.transform='scale('+Math.min(box.clientWidth/1280,box.clientHeight/720).toFixed(5)+')';
 };
 s.resize?.disconnect();s.resize=null;
 if(typeof ResizeObserver==='function'){s.resize=new ResizeObserver(fit);s.resize.observe(body.querySelector('.mtpd-slide-box'))}
 if(!s.resizeFn){s.resizeFn=fit;window.addEventListener('resize',fit)}
 requestAnimationFrame(fit);
}
function showCharter(p,deck){
 const s=dialog('Charter Program',p.nama+' · '+(p.kodeResmi||p.kode||p.akr||''));
 s.deck=deck;
 s.node.querySelector('[data-mtpd-footnote]').textContent='Pratinjau dan PPTX menggunakan model 3 slide yang sama · font dapat bervariasi menurut perangkat.';
 const btn=s.node.querySelector('[data-mtpd-download]');btn.disabled=false;btn.textContent='Unduh PPTX';
 s.node.addEventListener('click',e=>{
  const slide=e.target.closest('[data-mtpd-slide]');
  if(slide){drawSlide(s,Number(slide.dataset.mtpdSlide));return}
  if(e.target.closest('[data-mtpd-prev]')){drawSlide(s,Math.max(0,s.slideIndex-1));return}
  if(e.target.closest('[data-mtpd-next]')){drawSlide(s,Math.min(2,s.slideIndex+1));return}
 });
 btn.addEventListener('click',async()=>{
  btn.disabled=true;btn.textContent='Menyusun PPTX…';
  try{await dkPptx(s.deck)}catch(e){message(s,'Gagal mengunduh Charter Program',e.message||String(e))}
  finally{if(active===s){btn.disabled=false;btn.textContent='Unduh PPTX'}}
 });
 drawSlide(s,0);
}
function errorDialog(title,detail){
 const s=dialog(title,'Detail Program · Project Management');
 message(s,'Dokumen belum tersedia',detail);
}
async function handle(button){
 const p=findProgram(button?.dataset?.p),kind=button?.dataset?.kind,mode=button?.dataset?.mode;
 if(!p)return errorDialog('Dokumen Program','Program tidak ditemukan pada data aplikasi.');
 if(kind==='program'){
  const rows=signedRows(p);
  if(mode!=='download'){showPDF(p,rows);return}
  if(!rows.length){showPDF(p,rows);return}
  button.disabled=true;
  try{const blob=await proofBlob(rows[0]);saveFile(blob,rows[0].fileName)}
  catch(e){errorDialog('Dokumen Program',e.message||String(e))}
  finally{button.disabled=false}
  return;
 }
 if(kind==='charter'){
  let deck;try{deck=buildDeck(p)}catch(e){errorDialog('Charter Program',e.message||String(e));return}
  if(mode!=='download'){showCharter(p,deck);return}
  button.disabled=true;
  try{await dkPptx(deck)}catch(e){errorDialog('Charter Program',e.message||String(e))}
  finally{button.disabled=false}
 }
}
window.MT_PM_PROGRAM_DOCS={handle,signedRows,buildDeck};
})();