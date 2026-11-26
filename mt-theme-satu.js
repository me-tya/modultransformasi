/* Tema warna Satu Kemenkeu (uji coba). Aktif hanya bila alamat memuat ?tema=satu.
   Mengganti keluarga navy menjadi biru Satu Kemenkeu pada latar, garis tepi, bayangan dan fill;
   warna teks, kuning Kemenkeu, warna status, ukuran dan tata letak tidak diubah. */
(function(){
'use strict';
if(!/[?&]tema=satu\b/.test(location.search))return;
function hls(r,g,b){r/=255;g/=255;b/=255;var mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,h=0,s=0,d=mx-mn;
 if(d){s=l>0.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?((g-b)/d+(g<b?6:0)):mx===g?((b-r)/d+2):((r-g)/d+4);h*=60}return [h,l,s]}
function rgbOf(h,l,s){function f(n){var k=(n+h/30)%12,a=s*Math.min(l,1-l);return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))}return [f(0),f(8),f(4)]}
/* Navy (hue 195–235, saturasi ≥ 0,30, gelap) → biru Satu Kemenkeu dengan terang sebanding. */
function navy2blue(r,g,b){var x=hls(r,g,b);if(!(x[0]>=195&&x[0]<=235&&x[2]>=0.30&&x[1]<=0.42))return null;return rgbOf(214,Math.min(0.55,0.30+x[1]*0.55),0.68)}
function hex2(n){return ('0'+n.toString(16)).slice(-2).toUpperCase()}
function recolor(v){
 v=v.replace(/#([0-9a-fA-F]{6})\b|#([0-9a-fA-F]{3})\b/g,function(m,a,b){var h=a||b.replace(/./g,'$&$&'),n=navy2blue(parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16));return n?'#'+hex2(n[0])+hex2(n[1])+hex2(n[2]):m});
 return v.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*([,)\/])/g,function(m,r,g,b,t){var n=navy2blue(+r,+g,+b);return n?m.slice(0,m.indexOf('(')+1)+n.join(', ')+t:m});
}
var SKIPV={'--side':1,'--side-2':1,'--side-ink':1,'--side-mute':1},VMAP={},vSeen=new WeakSet(),ROOTCS=null;
/* Kumpulkan variabel warna dari SEMUA aturan (mis. --navy-900 didefinisikan di .cmx, bukan :root). */
function collectVars(rules){for(var i=0;i<rules.length;i++){var r=rules[i];if(r.cssRules&&!r.style){collectVars(r.cssRules);continue}
 if(!r.style||vSeen.has(r))continue;vSeen.add(r);for(var j=0;j<r.style.length;j++){var k=r.style[j];if(k.indexOf('--')===0&&!(k in VMAP)){var v=r.style.getPropertyValue(k).trim();if(/^#|^rgb/.test(v))VMAP[k]=v}}}}
function varVal(k){if(k in VMAP)return VMAP[k];if(!ROOTCS)ROOTCS=getComputedStyle(document.documentElement);return ROOTCS.getPropertyValue(k).trim()}
function subvars(v){return v.replace(/var\((--[\w-]+)\)/g,function(m,k){if(SKIPV[k])return m;var x=varVal(k);if(!x)return m;var n=recolor(x);return n!==x?n:m})}
var PROP=/((?:^|;|\s)(?:background(?:-color|-image)?|border(?:-[a-z]+)*(?:-color)?|outline(?:-color)?|box-shadow|fill)\s*:\s*)([^;]*)/gi;
function fixText(t){return t.replace(PROP,function(m,p,v){return p+recolor(subvars(v))})}
var doneR=new WeakSet();
function fixRules(rules){for(var i=0;i<rules.length;i++){var r=rules[i];
 if(r.cssRules&&!r.style)fixRules(r.cssRules);
 else if(r.style){if(doneR.has(r))continue;doneR.add(r);var t=r.style.cssText;if(t&&/background|border|outline|shadow|fill/i.test(t)){var n=fixText(t);if(n!==t)r.style.cssText=n}if(r.cssRules&&r.cssRules.length)fixRules(r.cssRules)}}}
function fixSheets(){var L=document.styleSheets,i,s;for(i=0;i<L.length;i++){s=L[i];if(s.ownerNode&&s.ownerNode.id==='mt-theme-satu')continue;try{collectVars(s.cssRules)}catch(e){}}
 for(i=0;i<L.length;i++){s=L[i];if(s.ownerNode&&s.ownerNode.id==='mt-theme-satu')continue;try{fixRules(s.cssRules)}catch(e){}}}
var seen=new WeakMap();
function fixEl(el){var t=el.getAttribute&&el.getAttribute('style');if(!t||seen.get(el)===t)return;var n=fixText(t);if(n!==t)el.setAttribute('style',n);seen.set(el,n)}
function fixTree(root){if(root.nodeType!==1)return;fixEl(root);var l=root.querySelectorAll('[style]');for(var i=0;i<l.length;i++)fixEl(l[i])}
/* Kerangka: header bergradasi biru, sidebar tetap gelap. */
var st=document.createElement('style');st.id='mt-theme-satu';
st.textContent='html:root body #app header.top.top{background:linear-gradient(90deg,#1B4D93 0%,#2563B5 100%)!important}html:root body #app aside.side.side{background:#132A4D!important;background-image:none!important}';
function run(){fixSheets();fixTree(document.body);document.head.appendChild(st)}
var mo=new MutationObserver(function(ms){var sheets=false;ms.forEach(function(m){
 if(m.type==='attributes')fixEl(m.target);
 else m.addedNodes.forEach(function(n){if(n.id==='mt-theme-satu')return;if(n.nodeName==='STYLE'||n.nodeName==='LINK'){sheets=true;if(n.nodeName==='LINK')n.addEventListener('load',fixSheets)}else fixTree(n)})});
 if(sheets)setTimeout(fixSheets,0)});
function start(){run();Array.prototype.forEach.call(document.querySelectorAll('link[rel=stylesheet]'),function(l){l.addEventListener('load',fixSheets)});mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['style']});addEventListener('load',fixSheets)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.MT_THEME_SATU=true;
})();
