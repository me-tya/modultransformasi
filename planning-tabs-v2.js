(function planningTabsPlugin(){
'use strict';
const order=[['asis','As-is'],['tobe','To-be'],['cs','Perbandingan'],['ch','Charter'],['kp','Kriteria'],['mf','Manfaat'],['rk','Linimasa']];
const safe=x=>esc(String(x??''));const list=x=>Array.isArray(x)?x.filter(v=>String(v??'').trim()).map(String):String(x??'').trim()?[String(x)]:[];
const limited=(arr,max=4)=>{let x=list(arr);return x.length>max?[...x.slice(0,max),'… dan '+(x.length-max)+' butir lainnya (lihat dokumen lengkap)']:x};
const clean=x=>String(x??'').trim()||'Belum diisi';
const clip=(s,n=185)=>{let t=clean(s);return t.length>n?t.slice(0,n-1).replace(/\s+\S*$/,'')+'…':t};
function makeSlide(c,title,blocks){
 const E=[],p=chProg(c),nv=DK.navy;
 E.push(dkR(0,0,13.33,7.5,'FFFFFF'));E.push(dkR(0,0,13.33,.1,'FDB913'));
 E.push(dkR(0,.10,3.3,.05,nv));
 E.push(dkT(.45,.28,7,.26,'KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',{s:11,b:1,c:DK.mute,sp:1}));
 E.push(dkT(.45,.61,9.9,.48,title,{s:22,b:1,c:nv}));
 E.push(dkT(.45,1.10,10.4,.28,'Program Transformasi: '+chJudul(c),{s:12,c:DK.ink}));
 E.push(dkR(11.1,.38,1.7,.42,nv,{rad:.3}));E.push(dkT(11.12,.40,1.66,.37,p.kode||c.prog,{s:11,b:1,c:DK.gold,a:'center',v:'middle'}));
 for(const b of blocks)dkBox(E,b.x,b.y,b.w,b.h,b.title,limited(b.items,b.max||4),{max:b.size||14});
 E.push(dkR(0,7.11,13.33,.39,nv));E.push(dkR(0,7.11,.16,.39,'FDB913'));
 E.push(dkT(.44,7.12,11,.35,'Dokumen Perencanaan Proyek · '+(p.kode||c.prog)+' · '+title,{s:10,c:'D7E3F5',v:'middle'}));
 return {bg:'FFFFFF',E,n:title};
}
function deck(c,inc){
 inc=inc||Object.fromEntries(order.map(([k])=>[k,1]));
 const D=chDeck3(c),A=c.asis||{},T=c.tobe||{},C=c.cs||[],V=c.mf||[],s={};
 const pairs=(C||[]).slice(0,3).map((r,i)=>({x:.46,y:1.57+i*1.74,w:12.38,h:1.52,title:'Perubahan '+(i+1),items:['Kondisi saat ini: '+clip(r.a,155),'Kondisi diharapkan: '+clip(r.b,155)],max:2,size:14}));
 s.asis=makeSlide(c,'Analisis Kondisi Saat Ini (As-is)',[
 {x:.45,y:1.55,w:6.0,h:2.23,title:'Proses Bisnis Eksisting',items:[clip(A.pb,480)]},
 {x:6.62,y:1.55,w:6.25,h:2.23,title:'Permasalahan Utama',items:[clip(A.masalah,480)]},
 {x:.45,y:4.0,w:6.0,h:2.75,title:'Sistem Eksisting',items:limited((A.kor||[]).map(r=>(r.s||'Sistem')+' — '+(r.c||r.p||'')),4)},
 {x:6.62,y:4.0,w:6.25,h:2.75,title:'Teknologi',items:[clip(A.tek,470)]}
 ]);
 s.tobe=makeSlide(c,'Kondisi yang Diharapkan (To-be)',[
 {x:.45,y:1.55,w:6.0,h:2.48,title:'Pemutakhiran Proses Bisnis',items:limited((T.pb||[]).map(r=>clip((r.a||'As-is')+' → '+(r.b||'To-be'),145)),4)},
 {x:6.62,y:1.55,w:6.25,h:2.48,title:'Peluang Digitalisasi',items:limited(T.pot,4)},
 {x:.45,y:4.25,w:12.42,h:2.48,title:'Arsitektur Aplikasi dan Teknologi',items:[clip(T.ar,700)]}
 ]);
 s.cs=makeSlide(c,'Perbandingan Current dan Future State',pairs.length?pairs:[{x:.45,y:1.6,w:12.4,h:4,title:'Perbandingan Kondisi',items:['Belum ada data perbandingan.']}]);
 s.ch=D.slides[0];s.kp=D.slides[1];
 s.mf=makeSlide(c,'Manfaat dan Indikator Keberhasilan Proyek',[
 {x:.45,y:1.55,w:12.42,h:5.3,title:'Ringkasan Manfaat, Indikator, dan Target',items:limited(V.map(r=>clip((r.m||'Manfaat')+' | '+(r.ind||'Indikator belum diisi')+' | baseline: '+(r.base||'—')+' | target: '+(r.tgt||'—'),200)),5),max:5,size:13}
 ]);
 s.rk=D.slides[2];
 const slides=order.filter(([k])=>inc[k]).map(([k])=>s[k]);
 if(!slides.length)throw new Error('Pilih minimal satu substansi.');
 return {title:'Dokumen Perencanaan Proyek — '+chJudul(c),file:'Dokumen_Perencanaan_Paparan_'+String(chProg(c).kode||c.prog).replace(/[^A-Za-z0-9]+/g,'_')+'_v'+(window.MT_PS_DOC?.nextVersion('project',String(c.id||c.prog),+(c.tahun||S.ui.tahun||2026))||c.ver),slides};
}
async function download(c,inc){const D=deck(c,inc);await dkPptx(D);return D}
window.cpCompactPptx=download;
const before=pCharter;
pCharter=function(){
 const wantsDoc=S.ui.cht==='buat';
 if(wantsDoc)S.ui.cht='ch';
 let html=before();
 if(wantsDoc)S.ui.cht='buat';
 const active=!!(S.ui.chp&&html.includes('class="chhero"'));
 if(!active)return html;
 const c=S.charters.find(v=>v.id===S.ui.chv&&v.prog===S.ui.chp)||chCur(S.ui.chp);
 if(!c)return html;
 // Remove the previous duplicated bottom-of-page generator on every tab.
 const foot=html.indexOf('<section class="card cp-report-panel"');
 if(foot>=0)html=html.slice(0,foot);
 // Keep six original tab renderers and their HTML untouched.
 const tabStart=html.indexOf('<div class="chtabs" role="tablist">');
 const tabEnd=tabStart<0?-1:html.indexOf('</div>',tabStart);
 if(tabEnd>=0)html=html.slice(0,tabEnd)+'<button type="button" role="tab" data-act="cpGoDoc" class="'+(wantsDoc?'on':'')+'" aria-selected="'+wantsDoc+'"><i>8</i><span><b>Buat Dokumen</b></span></button>'+html.slice(tabEnd);
 html=html.replace('class="hb gold" type="button" data-act="cpJump">▤ Dokumen Lengkap ↓','class="hb" type="button" data-act="cpGoDoc">▤ Buat Dokumen');
 html=html.replace(/<div class="chbc"><a href="#pmo-perencanaan">‹ Semua program<\/a> \/ Dokumen Perencanaan Proyek<\/div>/,'');
 const barEnd='</div><section id="ch-active-document">';
 if(html.includes(barEnd))html=html.replace(barEnd,'<a href="#pmo-perencanaan" class="cp-back-link">‹ Semua Program</a>'+barEnd);
 const start=html.indexOf('<section id="ch-active-document">');
 if(start<0)return html;
 const end=html.indexOf('</section>',start);
 if(end<0)return html;
 const content=wantsDoc?docPanel(c):S.ui.cht==='ch'?charterPanel(c):null;
 if(content!=null)html=html.slice(0,start)+'<section id="ch-active-document">'+content+'</section>'+html.slice(end+10);
 if(!wantsDoc&&S.ui.cht==='ch')setTimeout(fitSlides,30);
 if(wantsDoc)setTimeout(()=>window.cpInitInline?.(c.id),0);
 return html;
};
function fitSlides(){
 document.querySelectorAll('#ch-active-document .cp-slide-frame').forEach(box=>{
 const w=box.clientWidth;const inner=box.querySelector('.dk-scale');if(!w||!inner)return;
 inner.style.transform='scale('+(w/1280)+')';box.style.height=(w*720/1280)+'px';
 });
}
window.addEventListener('resize',fitSlides);
function charterPanel(c){
 const source=typeof CHD!=='undefined'&&CHD&&CHD.id===c.id?CHD:c;
 let slide='';try{slide=dkHtml(chDeck3(source).slides[0])}catch(err){slide='<p>Pratinjau Charter belum tersedia.</p>'}
 return '<div class="cp-charter-panel"><div class="cp-panel-head"><div><h3>Charter Program Transformasi</h3><p>Tampilan mengikuti slide pertama template PowerPoint resmi. Isi menggunakan Charter versi yang dipilih.</p></div><div class="cp-panel-btns"><button type="button" class="btn" data-act="cpDeck3">Pratinjau 3 Slide</button><button type="button" class="btn pri" data-act="cpCharterPptx">⇩ Ekspor Charter PPTX</button></div></div><div class="cp-slide-frame"><div class="dk-scale">'+slide+'</div></div><div class="cp-slide-caption">Slide 1 — Charter Program. Slide 2 Kriteria dan slide 3 Linimasa tetap mengikuti template asli pada ekspor.</div></div>';
}
function docPanel(c){
 return '<section class="cp-create" aria-label="Buat Dokumen Perencanaan Proyek"><div class="cp-panel-head"><div><h3>Dokumen Perencanaan Proyek · Pratinjau & Ekspor</h3><p>Pilih substansi, identitas dokumen, dan format ekspor pada panel kiri. Pratinjau Word, PDF, atau PowerPoint tampil langsung di panel kanan.</p></div></div>'+
 '<div id="cp-doc-inline" data-cp-charter="'+safe(c.id)+'" class="cp-report-inline"><div class="cp-note">Memuat formulir dokumen…</div></div></section>';
}
window.cpInlinePptxSlides=(c,inc)=>deck(c,inc).slides;

ACT.cpGoDoc=()=>{S.ui.cht='buat';save();render()};
ACT.cpDeck3=()=>{const c=S.charters.find(v=>v.id===S.ui.chv&&v.prog===S.ui.chp)||chCur(S.ui.chp);if(c)chDeckOpen(c)};
ACT.cpCharterPptx=async()=>{const c=S.charters.find(v=>v.id===S.ui.chv&&v.prog===S.ui.chp)||chCur(S.ui.chp);if(!c)return;try{await dkPptx(chDeck3(c));toast('Ekspor Charter PPTX dijalankan.')}catch(err){toast('Gagal mengekspor PPTX: '+err.message)}};
ACT.cpDeckPreview=()=>{
 const c=S.charters.find(v=>v.id===S.ui.chv&&v.prog===S.ui.chp)||chCur(S.ui.chp);if(!c)return;
 const inc=(S.ui.cpReport||{})[c.prog]?.inc||Object.fromEntries(order.map(([k])=>[k,1]));
 let D;try{D=deck(c,inc)}catch(err){toast(err.message);return}
 const body='<div class="dk-wrap">'+D.slides.map((sl,i)=>'<figure class="dk-f"><div class="dk-box"><div class="dk-scale">'+dkHtml(sl)+'</div></div><figcaption>'+safe((i+1)+'. '+sl.n)+'</figcaption></figure>').join('')+'</div><p class="s">Slide Charter, Kriteria, dan Linimasa menggunakan tiga slide template PPTX asli; substansi lain dibuat ringkas untuk presentasi.</p>';
 const ov=modal('<span class="exh">Pratinjau PPTX Ringkas · '+safe(chJudul(c))+'</span>',body,null,null,{cancel:'Tutup',size:'wide dk-md',extra:'<button class="btn pri" data-mx="ppt">⇩ Unduh PPTX</button>',onExtra:k=>{if(k==='ppt'){download(c,inc).then(()=>toast('PPTX ringkas diunduh.')).catch(e=>toast('Ekspor gagal: '+e.message));return false}}});
 const fit=()=>ov.querySelectorAll('.dk-scale').forEach(b=>{const w=b.parentElement.clientWidth;if(!w)return;b.style.transform='scale('+(w/1280)+')';b.parentElement.style.height=(w*720/1280)+'px'});
 requestAnimationFrame(fit);setTimeout(fit,100);
};
const css=document.createElement('style');css.id='cp-tabs-v2-style';
css.textContent=`
#app .chhero .rt>.hgrp{order:1}
#app .chhero .rt>button[data-act="cpGoDoc"]{order:2;background:#f2f6ff!important;color:#143d72!important;border:1px solid #cad9eb!important;box-shadow:none!important}
#app .chhero .rt>button[data-act="chsub"],#app .chhero .rt>button[data-act="chok"]{order:3}
#app .chhero .rt>button[data-act="chret"]{order:2}
#app .cp-back-link{margin-left:auto;white-space:nowrap;font-size:12px;font-weight:800;color:#185b9c;align-self:center;padding:7px 11px;text-decoration:none}
#app .cp-panel-head{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:15px 18px;background:#f7faff;border-bottom:1px solid #dce7f2}
#app .cp-panel-head h3{color:#0e315e;font-size:16px;margin:0 0 4px}
#app .cp-panel-head p{color:#61738b;font-size:12px;margin:0;line-height:1.5}
#app .cp-panel-btns{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#app .cp-panel-btns .btn{font-size:12px;white-space:nowrap}
#app .cp-charter-panel,#app .cp-create{background:#fff;border:1px solid #d5e3f0;border-radius:12px;overflow:hidden}
#app .cp-slide-frame{width:100%;position:relative;overflow:hidden;background:#fff;min-height:260px}
#app .cp-slide-frame .dk-scale{width:1280px;height:720px;position:absolute;left:0;top:0;transform-origin:0 0}
#app .cp-slide-caption{font-size:11px;color:#6b7d93;padding:10px 16px;background:#f9fbfd}
#app .cp-source-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:9px;padding:18px}
#app .cp-source{border:1px solid #d7e4f2;border-radius:9px;padding:11px;display:flex;align-items:center;gap:8px;font-size:12px;color:#173c65;font-weight:800}
#app .cp-source-n{display:grid;place-items:center;border-radius:7px;background:#eaf2ff;width:26px;height:26px;flex-shrink:0;font-weight:900}
#app .cp-source small{color:#73849a;font-size:10px;margin-left:auto;white-space:nowrap}
#app .cp-create-bar{padding:15px 18px;background:#f7faff;border-top:1px solid #e0e9f5;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
#app .cp-create-bar>span{font-size:12px;color:#526a84;font-weight:700}
@media(max-width:900px){#app .cp-back-link{font-size:11px}#app .cp-panel-head{align-items:flex-start}}
`;document.head.appendChild(css);
if(typeof VIEW!=='undefined'&&VIEW==='pmo-charter'&&typeof ME!=='undefined'&&ME)render();
})();