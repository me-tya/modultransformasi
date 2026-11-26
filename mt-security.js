/* Modul Transformasi — penguatan keamanan hasil uji kerentanan (VT) 27-11-2026.
   A2/A3  Filter tag HTML & karakter berbahaya pada data (input & data yang disinkronkan) sebelum tampil/tersimpan.
   A4     Batas jumlah karakter pada kolom isian teks.
   C3     Batas waktu sesi: keluar otomatis setelah 60 menit tanpa aktivitas.
   C8/E2  Bersihkan sisa data sensitif di peramban saat keluar.
   F3     Batasi jenis berkas yang dapat diunggah (blokir berkas skrip/eksekusi/HTML/SVG).
   G3     Cegah tampilan di dalam frame situs lain (clickjacking) dan tambah rel="noopener" pada tautan tab baru. */
(function(){
'use strict';
if(window.MT_SEC)return;
/* ---------- G3: anti-clickjacking ---------- */
try{if(window.top!==window.self){document.documentElement.style.display='none';window.top.location=window.self.location}}catch(e){document.documentElement.style.display='none'}

/* ---------- A2/A3: sanitasi data ---------- */
const TAG=/<(?=[A-Za-z!\/?])/g;                       // awal tag HTML → dinetralkan
const HTMLKEY=/Html$|^notulaTeks$/;                    // kolom rich-text yang memang menyimpan HTML terbatas
const CODEKEY=/^(akr|kode|psCode|rid|pgCode|modul)$/;  // kode/akronim yang dipakai di atribut HTML
const LINKKEY=/(link|url|href|tautan)$/i;
const BADHTML=/<\s*(script|iframe|object|embed|style|link|meta|base|form)\b|\son[a-z]+\s*=|javascript\s*:|vbscript\s*:/i;
function cleanHtml(v){return v.replace(/<\s*(script|iframe|object|embed|style|link|meta|base|form)\b[\s\S]*?(<\s*\/\s*\1\s*>|$)/gi,'').replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,'').replace(/(javascript|vbscript)\s*:/gi,'blocked:')}
function cleanStr(k,v){
 if(v.length<2||v.charCodeAt(0)===100&&v.startsWith('data:'))return v;
 if(HTMLKEY.test(k))return BADHTML.test(v)?cleanHtml(v):v;
 let o=v;
 if(o.indexOf('<')>=0)o=o.replace(TAG,'‹');
 if(CODEKEY.test(k)&&/["'`<>]/.test(o))o=o.replace(/["'`<>]/g,'');
 if(LINKKEY.test(k)&&/^\s*(javascript|vbscript|data)\s*:/i.test(o))o='';
 return o;
}
let changed=0;
function walk(o,depth,seen){
 if(!o||typeof o!=='object'||depth>14||seen.has(o))return;seen.add(o);
 if(Array.isArray(o)){for(let i=0;i<o.length;i++){const v=o[i];if(typeof v==='string'){if(v.indexOf('<')>=0){const c=cleanStr('',v);if(c!==v){o[i]=c;changed++}}}else if(v&&typeof v==='object')walk(v,depth+1,seen)}return}
 for(const k in o){if(!Object.prototype.hasOwnProperty.call(o,k))continue;const v=o[k];
  if(typeof v==='string'){if(v.indexOf('<')>=0||((CODEKEY.test(k))&&/["'`]/.test(v))||(LINKKEY.test(k)&&/^\s*(javascript|vbscript|data)\s*:/i.test(v))){const c=cleanStr(k,v);if(c!==v){o[k]=c;changed++}}}
  else if(v&&typeof v==='object'&&!(v instanceof Blob)&&!(ArrayBuffer.isView&&ArrayBuffer.isView(v)))walk(v,depth+1,seen)}
}
function sanitizeState(){try{if(typeof S==='undefined'||!S)return 0;changed=0;const seen=new WeakSet();for(const k in S){if(k==='ui')continue;walk(S[k],0,seen)}return changed}catch(e){return 0}}
function wrap(){
 if(typeof window.render==='function'&&!window.render.__sec){const r=window.render;const w=function(){sanitizeState();return r.apply(this,arguments)};w.__sec=1;window.render=w}
 if(typeof window.save==='function'&&!window.save.__sec){const s=window.save;const w=function(){sanitizeState();return s.apply(this,arguments)};w.__sec=1;window.save=w}
}
wrap();document.addEventListener('DOMContentLoaded',wrap);

/* ---------- A4: batas jumlah karakter ---------- */
const MAXIN=1000,MAXTA=20000,TXT=/^(text|search|email|url|tel|password|)$/i;
function limit(el){if(!el||el.hasAttribute('maxlength'))return;if(el.tagName==='TEXTAREA')el.maxLength=MAXTA;else if(el.tagName==='INPUT'&&TXT.test(el.getAttribute('type')||''))el.maxLength=MAXIN}
document.addEventListener('focusin',e=>limit(e.target),true);
document.addEventListener('paste',e=>{const el=e.target;if(el&&el.isContentEditable){const t=(e.clipboardData&&e.clipboardData.getData('text/plain'))||'';if((el.textContent||'').length+t.length>MAXTA*5){e.preventDefault()}}},true);

/* ---------- F3: jenis berkas unggahan ---------- */
const BLOCK=/\.(exe|msi|bat|cmd|com|scr|pif|cpl|dll|jar|apk|app|hta|js|mjs|cjs|vbs|vbe|wsf|ps1|psm1|sh|bash|php\d?|phtml|asp|aspx|jsp|cgi|pl|py|rb|html?|xhtml|shtml|svgz?|xml|swf|lnk|reg|iso|img)$/i;
window.addEventListener('change',e=>{const inp=e.target;if(!inp||inp.tagName!=='INPUT'||inp.type!=='file'||!inp.files||!inp.files.length)return;
 const all=[...inp.files],bad=all.filter(f=>BLOCK.test(f.name)||/^(text\/html|image\/svg\+xml|application\/(x-msdownload|javascript|x-sh))/i.test(f.type||''));if(!bad.length)return;
 const ok=all.filter(f=>!bad.includes(f));try{const dt=new DataTransfer();ok.forEach(f=>dt.items.add(f));inp.files=dt.files}catch(x){inp.value=''}
 const msg='Jenis berkas tidak diizinkan: '+bad.map(f=>f.name).join(', ')+'. Unggah PDF, dokumen Office, gambar (JPG/PNG), TXT/CSV, atau ZIP.';
 try{(window.toast||alert)(msg)}catch(x){}
 if(!ok.length){e.stopImmediatePropagation();e.preventDefault()}},true);

/* ---------- C3: batas waktu sesi 60 menit tanpa aktivitas ---------- */
const IDLE=60*60*1000,LK='mt_last_act';let last=Date.now(),warned=false;
const touch=()=>{last=Date.now();warned=false;try{localStorage.setItem(LK,String(last))}catch(e){}};
['pointerdown','keydown','wheel','touchstart'].forEach(t=>document.addEventListener(t,()=>{if(Date.now()-last>15000)touch();else last=Date.now()},{capture:true,passive:true}));
function loggedIn(){try{return typeof FB!=='undefined'&&FB&&FB.on&&FB.auth&&FB.auth.currentUser&&typeof ME!=='undefined'&&ME}catch(e){return false}}
async function expire(){try{if(typeof log==='function')log('Sesi berakhir','Tidak ada aktivitas 60 menit');if(typeof save==='function')save()}catch(e){}
 await new Promise(r=>setTimeout(r,700));clearLocal();try{await FB.auth.signOut()}catch(e){}try{sessionStorage.setItem('mt_sess_expired','1')}catch(e){}location.hash='';location.reload()}
setInterval(()=>{if(!loggedIn())return;let l=last;try{l=Math.max(l,+localStorage.getItem(LK)||0)}catch(e){}const idle=Date.now()-l;
 if(idle>=IDLE){expire();return}
 if(idle>=IDLE-5*60*1000&&!warned){warned=true;try{toast('Sesi akan berakhir dalam 5 menit karena tidak ada aktivitas. Klik atau tekan tombol apa saja untuk melanjutkan.')}catch(e){}}},30000);
document.addEventListener('DOMContentLoaded',()=>{try{if(sessionStorage.getItem('mt_sess_expired')){sessionStorage.removeItem('mt_sess_expired');setTimeout(()=>{try{toast('Sesi berakhir karena tidak ada aktivitas selama 60 menit. Silakan masuk kembali.')}catch(e){}},1500)}}catch(e){}});

/* ---------- C8/E2: bersihkan data lokal saat keluar ---------- */
function clearLocal(){try{const ks=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/_demo$/.test(k))ks.push(k)}ks.forEach(k=>localStorage.removeItem(k))}catch(e){}try{sessionStorage.clear()}catch(e){}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-m="out"]');if(b&&loggedIn())setTimeout(clearLocal,1200)},true);

/* ---------- G3: rel=noopener untuk target _blank ---------- */
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[target="_blank"]');if(a){const r=(a.getAttribute('rel')||'');if(!/noopener/.test(r))a.setAttribute('rel',(r+' noopener noreferrer').trim())}},true);

window.MT_SEC={sanitizeState,cleanStr,clearLocal,version:'20261127-vt1'};
})();
