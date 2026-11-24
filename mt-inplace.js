/* Buka di tempat (2026-11-25): klik kode WBS di menu mana pun → detail WBS + unggah bukti dukung tanpa pindah menu;
   tombol Charter → pratinjau charter di jendela, tanpa pindah ke Dokumen Proyek. */
(function(){
'use strict';
/* 1) Charter: pratinjau di tempat kecuali sedang berada di halaman Dokumen Proyek */
const _chopen=ACT.chopen;
ACT.chopen=el=>{const akr=el.dataset.p;if(['pmo-charter','pmo-perencanaan'].includes(VIEW)||!akr)return _chopen(el);
 const p=(S.programs||[]).find(x=>x.akr===akr),c=typeof chCur==='function'?chCur(akr):null;
 if(!c){toast('Program ini belum memiliki charter.');return}
 let pages=[];try{pages=chDocPages(c)}catch(e){console.warn(e)}
 const body='<div class="inp-ch-meta">'+chipSt(c.st||'Draft')+' <b>'+esc(p?(p.kode||p.akr)+' · '+(p.nama||''):akr)+'</b></div><div class="inp-ch">'+pages.map(h=>'<div class="inp-ch-pg">'+h+'</div>').join('')+'</div>';
 modal('Charter Program Transformasi',body,null,null,{size:'wide',cancel:'Tutup',extra:'<button class="btn" data-mx="pdf">⬇ PDF</button><button class="btn" data-mx="doc">⬇ Word</button><button class="btn" data-mx="go">Buka di Dokumen Proyek ›</button>',
  onExtra:k=>{if(k==='pdf'){chPdf(c);return false}if(k==='doc'){chDoc(c);return false}if(k==='go')_chopen(el)}})};
/* 2) Klik kode WBS sudah ditangani global (index.html: codeWbs → wbsDetail); tombol "Bukti dukung" di detail kini membuka unggah di tempat (BK_HERE). */
})();
