/* Bingkai foto profil Satu Kemenkeu.
   Foto aset-satu.kemenkeu.go.id berlatar merah polos dengan banyak ruang kosong di atas kepala, sehingga di lingkaran
   avatar wajah terlihat kecil. Modul ini mendeteksi letak kepala (piksel yang berbeda dari warna latar) lalu
   memotong tampilan ke kepala + bahu memakai CSS object-view-box. Yang disimpan hanya koordinat bingkai
   (kpCfg().fbox + cache peramban), bukan salinan foto. Bila server foto menolak dibaca (CORS), dipakai bingkai bawaan via CSS. */
(function(){
 'use strict';
 const HOST='aset-satu.kemenkeu.go.id';
 const MEM={},FAIL={},BUSY={};let saveT=0,applyT=0;
 const key=u=>String(u||'').split('/').pop().slice(0,64);
 try{Object.assign(MEM,JSON.parse(localStorage.getItem('MT_FBOX')||'{}'))}catch(e){}
 const store=()=>{try{const k=kpCfg();k.fbox=k.fbox||{};return k.fbox}catch(e){return MEM}};
 function frameOf(img){
  const W=120,H=Math.max(1,Math.round(img.naturalHeight*W/img.naturalWidth));const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,W,H);
  const d=x.getImageData(0,0,W,H).data,px=(i,j)=>{const o=(j*W+i)*4;return [d[o],d[o+1],d[o+2]]};
  const bgs=[px(2,2),px(W-3,2),px(2,Math.min(H-1,20)),px(W-3,Math.min(H-1,20))],bg=[0,1,2].map(k=>bgs.reduce((a,b)=>a+b[k],0)/bgs.length);
  const fg=(i,j)=>{const p=px(i,j);return Math.abs(p[0]-bg[0])+Math.abs(p[1]-bg[1])+Math.abs(p[2]-bg[2])>90};
  let top=-1;for(let j=0;j<H&&top<0;j++){let n=0;for(let i=Math.round(W*.2);i<W*.8;i++)if(fg(i,j))n++;if(n>=Math.max(2,W*.03))top=j}
  if(top<0)return null;
  const band=Math.max(4,Math.round(H*.16)),Ls=[],Rs=[];
  for(let j=top;j<Math.min(H,top+band);j++){let l=-1,r=-1;for(let i=0;i<W;i++)if(fg(i,j)){if(l<0)l=i;r=i}if(l>=0){Ls.push(l);Rs.push(r)}}
  if(!Ls.length)return null;Ls.sort((a,b)=>a-b);Rs.sort((a,b)=>a-b);
  const l=Ls[Math.floor(Ls.length/2)],r=Rs[Math.floor(Rs.length/2)],hw=Math.max(8,r-l),cx=(l+r)/2;
  let s=Math.min(W,H,hw*2.6),y0=Math.max(0,top-s*.16),x0=Math.min(Math.max(0,cx-s/2),W-s);if(y0+s>H)y0=Math.max(0,H-s);
  const f=v=>(Math.max(0,v)*100).toFixed(1)+'%';
  return [f(y0/H),f(1-(x0+s)/W),f(1-(y0+s)/H),f(x0/W)].join(' ');
 }
 function detect(url){if(BUSY[url]||FAIL[url])return;BUSY[url]=1;const im=new Image();im.crossOrigin='anonymous';im.decoding='async';
  im.onload=()=>{let b=null;try{b=frameOf(im)}catch(e){FAIL[url]=1}BUSY[url]=0;if(!b){FAIL[url]=1;return}const S2=store();S2[key(url)]=b;MEM[key(url)]=b;schedSave();schedApply()};
  im.onerror=()=>{BUSY[url]=0;FAIL[url]=1};im.src=url}
 /* Disimpan di cache peramban; ikut tersimpan ke data bersama saat editor menyimpan perubahan berikutnya. */
 function schedSave(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem('MT_FBOX',JSON.stringify(MEM))}catch(e){}},800)}
 function apply(){const S2=store();document.querySelectorAll('img[src*="'+HOST+'"]').forEach(img=>{const b=S2[key(img.src)]||MEM[key(img.src)];if(b){if(img.dataset.fb!==b){img.style.objectViewBox='inset('+b+')';img.style.objectFit='cover';img.style.objectPosition='50% 50%';img.dataset.fb=b}}else detect(img.src)})}
 function schedApply(){clearTimeout(applyT);applyT=setTimeout(apply,60)}
 window.MT_FOTO_FRAME={apply,detect,frameOf};
 const st=document.createElement('style');st.id='mt-foto-frame-css';
 /* Bingkai bawaan bila deteksi belum/tidak bisa: dekatkan ke kepala & bahu. */
 st.textContent='img[src*="'+HOST+'"]:not([data-fb]){object-fit:cover;object-position:50% 30%;object-view-box:inset(16% 18% 18% 18%)}';
 (document.head||document.documentElement).appendChild(st);
 new MutationObserver(schedApply).observe(document.documentElement,{childList:true,subtree:true});
 document.addEventListener('DOMContentLoaded',schedApply);
})();
