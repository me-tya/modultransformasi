/* Project Selection › Draft RKMK — kerangka naskah KMK + isian pokok dari aplikasi, dan arsip RKMK ditetapkan.
   Aturan:
   - Aplikasi hanya menyusun KERANGKA: kepala KMK, Menimbang/Mengingat/Memutuskan, diktum standar, dan Lampiran.
     Isian pokok yang diambil dari aplikasi: judul & periode, daftar program (Diktum KEDUA), bagian per program di
     Lampiran (Ruang Lingkup & Proses Bisnis, Kondisi yang Diharapkan, Kegiatan, Penanggung Jawab) dari Charter Program,
     dan tabel Milestone dari Key Milestones. Bagian lain ditandai [diisi di Word] (sorot kuning) dan disunting di Word
     selama legal drafting.
   - Pratinjau dan unduhan Word memakai model yang sama (A4 tegak, Bookman Old Style 12 pt).
   - RKMK Ditetapkan: nomor, tanggal, tentang, PDF TTE (disimpan lokal di browser, IndexedDB 'mt-signed-documents'),
     tautan opsional, program yang tercakup. Setiap unggahan menjadi versi baru; program tercakup ditandai p.psRkmkRef.
   - Hak ubah/unggah: SA, PMOK. Peran lain baca saja. */
(function(){
'use strict';
const E=x=>String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const X=E;
const T=v=>String(v==null?'':v).replace(/\r/g,'').trim();
const strip=s=>T(s).replace(/^\s*(?:[•▪●◦▸\-–]|\d+[.)])\s*/,'').trim();
const list=v=>(Array.isArray(v)?v:T(v).split('\n')).flatMap(x=>String(x==null?'':x).split('\n')).map(strip).filter(Boolean);
const me=()=>{try{return typeof ME!=='undefined'?ME:null}catch(_){return null}};
const can=()=>!!me()&&['SA','PMOK'].includes(me().role);
const year=()=>+(S.ui&&S.ui.psSelectedYear)||+(S.ui&&S.ui.tahun)||new Date().getFullYear();
const say=m=>{try{toast(m)}catch(_){}};
const uid=t=>(t||'rk')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const HURUF='abcdefghijklmnopqrstuvwxyz';
const DIKTUM=['KESATU','KEDUA','KETIGA','KEEMPAT','KELIMA','KEENAM','KETUJUH','KEDELAPAN'];
const PH=t=>({ph:t}); // penanda isian manual

function store(){S.psRkmkDoc=S.psRkmkDoc||{};const y=year();const d=S.psRkmkDoc[y]||(S.psRkmkDoc[y]={title:'',signYear:'',programIds:null,docs:[]});d.docs=d.docs||[];return d}
function programs(){return (S.programs||[]).filter(p=>+p.psYear===year()&&!p.arsip&&p.psListStatus!=='Arsip')}
function charterOf(p){let c=null;try{c=window.MT_PS_DOC?.programCharterSource?.(p,year())}catch(_){}return c||p.psProgramCharter||null}
function chosen(){const d=store(),all=programs();return d.programIds?all.filter(p=>d.programIds.includes(String(p.id))):all}
function period(ps){let a=Infinity,b=-Infinity;ps.forEach(p=>{const c=charterOf(p)||{};const p1=+c.p1||+p.psYear,p2=Math.max(p1,+c.p2||p1);if(p1)a=Math.min(a,p1);if(p2)b=Math.max(b,p2)});if(!isFinite(a)){a=b=year()}return [a,b]}
const upper=s=>String(s||'').toUpperCase();
const title=d=>{const [a,b]=period(chosen());return T(d.title)||('Peta Rencana Program Transformasi Kementerian Keuangan Tahun '+a+(b>a?' - '+b:''))};

/* ---------- MODEL ---------- */
function model(){
 const d=store(),ps=chosen(),[p1,p2]=period(ps),yrs=[];for(let y=p1;y<=p2;y++)yrs.push(y);
 const ttl=title(d),TTL=upper(ttl),sy=T(d.signYear)||String(new Date().getFullYear());
 const progItems=ps.map(p=>p.nama);
 const lamp=ps.map((p,i)=>{const c=charterOf(p)||{},noC=!charterOf(p);
  const lb=list(c.lb),tb=list(c.tb),oc=list(c.oc),out=list(c.out),ow=list(c.ow);
  return {no:i+1,nama:p.nama,noC,
   ruang:{lb,tb},kondisi:{tujuan:T(c.tujuan),oc},kegiatan:out,
   pj:{champion:T(c.ch)||T(p.sponsor),owner:ow,uic:T(p.uic),pend:T(p.pend)}}});
 const ms=ps.map(p=>{const c=charterOf(p)||{};return {nama:p.nama,rows:(c.ms||[]).filter(m=>T(m.t)&&+m.y).sort((a,b)=>+a.y-+b.y).map(m=>({t:T(m.t),y:+m.y}))}});
 return {ttl,TTL,sy,p1,p2,yrs,ps,progItems,lamp,ms,
  menimbang:[
   [PH('bahwa … (latar belakang dan dasar kebutuhan program transformasi; diisi di Word)')],
   ['bahwa untuk memberikan arah, prioritas, tahapan, dan target pelaksanaan program transformasi Kementerian Keuangan Tahun '+p1+(p2>p1?'–'+p2:'')+', perlu disusun '+ttl+';'],
   ['bahwa berdasarkan pertimbangan sebagaimana dimaksud dalam huruf a dan huruf b, perlu menetapkan Keputusan Menteri Keuangan tentang '+ttl+';']],
  mengingat:[[PH('… (dasar hukum; diisi di Word)')],[PH('…')]],
  diktum:[
   ['Menetapkan '+ttl+' sebagaimana tercantum dalam Lampiran yang merupakan bagian tidak terpisahkan dari Keputusan Menteri ini.'],
   [ttl+' sebagaimana dimaksud dalam Diktum KESATU terdiri atas program transformasi:',{items:progItems}],
   [PH('… (pengaturan pelaksanaan, koordinasi, pemantauan, dan evaluasi; diisi di Word)')],
   ['Keputusan Menteri ini mulai berlaku pada tanggal ditetapkan.']]};
}

/* ---------- PRATINJAU HTML ---------- */
function inl(parts){return parts.map(x=>typeof x==='string'?E(x):x&&x.ph?'<mark class="rk-ph">['+E(x.ph)+']</mark>':'').join(' ')}
function previewHtml(m){
 const row3=(lab,items,sep)=>items.map((it,i)=>'<tr><td class="rk-l">'+(i?'':lab)+'</td><td class="rk-c">'+(i?'':':')+'</td><td class="rk-n">'+(sep==='a'?HURUF[i]+'.':(i+1)+'.')+'</td><td>'+inl(it)+'</td></tr>').join('');
 const dk=m.diktum.map((it,i)=>'<tr><td class="rk-l">'+DIKTUM[i]+'</td><td class="rk-c">:</td><td colspan="2">'+inl(it.filter(x=>!x||!x.items))+
  (it.find(x=>x&&x.items)?'<ol class="rk-alpha">'+it.find(x=>x&&x.items).items.map(t=>'<li>'+E(t)+';</li>').join('')+'</ol>':'')+'</td></tr>').join('');
 const num=L=>L.length?'<ol class="rk-num">'+L.map(t=>'<li>'+E(t)+'</li>').join('')+'</ol>':'<p><mark class="rk-ph">[belum diisi pada Charter Program]</mark></p>';
 const lamp=m.lamp.map(x=>'<h4>'+x.no+'. '+E(x.nama)+'</h4>'+(x.noC?'<p><mark class="rk-ph">[Charter Program belum dibuat untuk program ini]</mark></p>':'')+
  '<h5>a. Ruang Lingkup dan Proses Bisnis</h5>'+num(x.ruang.lb)+(x.ruang.tb.length?'<p>Terobosan yang dilakukan meliputi:</p>'+num(x.ruang.tb):'')+
  '<h5>b. Kondisi yang Diharapkan</h5>'+(x.kondisi.tujuan?'<p>'+E(x.kondisi.tujuan)+'</p>':'')+num(x.kondisi.oc)+
  '<h5>c. Kegiatan</h5>'+num(x.kegiatan)+
  '<h5>d. Penanggung Jawab</h5><table class="rk-kv"><tr><td>Initiative Champion</td><td>:</td><td>'+E(x.pj.champion||'—')+'</td></tr><tr><td>Initiative Owner</td><td>:</td><td>'+E(x.pj.owner.join('; ')||'—')+'</td></tr><tr><td>UIC Utama</td><td>:</td><td>'+E(x.pj.uic||'—')+'</td></tr><tr><td>UIC Pendukung</td><td>:</td><td>'+E(x.pj.pend||'—')+'</td></tr></table>').join('');
 let n=0;const msRows=m.ms.map(g=>'<tr class="rk-grp"><td colspan="'+(2+m.yrs.length)+'">'+E(g.nama)+'</td></tr>'+(g.rows.length?g.rows.map(r=>'<tr><td>'+(++n)+'.</td><td>'+E(r.t)+'</td>'+m.yrs.map(y=>'<td class="'+(y===r.y?'on':'')+'"></td>').join('')+'</tr>').join(''):'<tr><td></td><td><mark class="rk-ph">[Key Milestones belum diisi]</mark></td>'+m.yrs.map(()=>'<td></td>').join('')+'</tr>')).join('');
 return '<div class="rk-paper">'+
  '<p class="rk-c1"><b>KEPUTUSAN MENTERI KEUANGAN REPUBLIK INDONESIA</b></p><p class="rk-c1"><b>NOMOR <mark class="rk-ph">[…]</mark> TAHUN '+E(m.sy)+'</b></p><p class="rk-c1"><b>TENTANG</b></p><p class="rk-c1"><b>'+E(m.TTL)+'</b></p><p class="rk-c1 rk-sp">DENGAN RAHMAT TUHAN YANG MAHA ESA</p><p class="rk-c1"><b>MENTERI KEUANGAN REPUBLIK INDONESIA,</b></p>'+
  '<table class="rk-t">'+row3('Menimbang',m.menimbang,'a')+row3('Mengingat',m.mengingat,'1')+'</table>'+
  '<p class="rk-c1 rk-sp"><b>MEMUTUSKAN:</b></p><table class="rk-t"><tr><td class="rk-l">Menetapkan</td><td class="rk-c">:</td><td colspan="2"><b>KEPUTUSAN MENTERI KEUANGAN TENTANG '+E(m.TTL)+'.</b></td></tr>'+dk+'</table>'+
  '<div class="rk-sign"><p>Ditetapkan di Jakarta<br>pada tanggal <mark class="rk-ph">[…]</mark></p><p><b>MENTERI KEUANGAN REPUBLIK INDONESIA,</b></p><p class="rk-sp">Ditandatangani secara elektronik</p><p><mark class="rk-ph">[NAMA]</mark></p></div>'+
  '<div class="rk-break">Lampiran</div><div class="rk-lhead"><p>LAMPIRAN<br>KEPUTUSAN MENTERI KEUANGAN REPUBLIK INDONESIA<br>NOMOR <mark class="rk-ph">[…]</mark><br>TENTANG<br>'+E(m.TTL)+'</p></div>'+
  '<h3>A. PROGRAM TRANSFORMASI KEMENTERIAN KEUANGAN</h3>'+(lamp||'<p><mark class="rk-ph">[Belum ada program dipilih]</mark></p>')+
  '<h3>B. MILESTONE PROGRAM TRANSFORMASI KEMENTERIAN KEUANGAN</h3><table class="rk-ms"><thead><tr><th>No</th><th>Kegiatan</th>'+m.yrs.map(y=>'<th>'+y+'</th>').join('')+'</tr></thead><tbody>'+msRows+'</tbody></table>'+
  '<div class="rk-sign"><p><b>MENTERI KEUANGAN REPUBLIK INDONESIA,</b></p><p class="rk-sp">Ditandatangani secara elektronik</p><p><mark class="rk-ph">[NAMA]</mark></p></div></div>';
}

/* ---------- WORD (.docx) ---------- */
function docxXml(m){
 const F='Bookman Old Style',SZ=24;
 const rpr=o=>'<w:rPr><w:rFonts w:ascii="'+F+'" w:hAnsi="'+F+'" w:cs="'+F+'"/>'+(o&&o.b?'<w:b/>':'')+(o&&o.hl?'<w:highlight w:val="yellow"/>':'')+'<w:sz w:val="'+(o&&o.sz||SZ)+'"/><w:szCs w:val="'+(o&&o.sz||SZ)+'"/></w:rPr>';
 const r=(t,o)=>'<w:r>'+rpr(o)+'<w:t xml:space="preserve">'+X(t)+'</w:t></w:r>';
 const runs=(parts,o)=>parts.map(x=>typeof x==='string'?r(x+' ',o):x&&x.ph?r('['+x.ph+'] ',Object.assign({},o,{hl:1})):'').join('');
 const p=(content,o={})=>'<w:p><w:pPr><w:spacing w:before="0" w:after="'+(o.after==null?80:o.after)+'" w:line="276" w:lineRule="auto"/>'+(o.jc?'<w:jc w:val="'+o.jc+'"/>':'<w:jc w:val="both"/>')+(o.ind?'<w:ind w:left="'+o.ind+'"'+(o.hang?' w:hanging="'+o.hang+'"':'')+'/>':'')+(o.pb?'<w:pageBreakBefore/>':'')+(o.keep?'<w:keepNext/>':'')+'</w:pPr>'+content+'</w:p>';
 const c1=(t,b,o)=>p(r(t,{b}),Object.assign({jc:'center',after:0},o||{}));
 const noB='<w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(k=>'<w:'+k+' w:val="nil"/>').join('')+'</w:tblBorders>';
 const cell=(w,content,o={})=>'<w:tc><w:tcPr><w:tcW w:w="'+w+'" w:type="dxa"/>'+(o.span>1?'<w:gridSpan w:val="'+o.span+'"/>':'')+(o.fill?'<w:shd w:val="clear" w:color="auto" w:fill="'+o.fill+'"/>':'')+(o.vc?'<w:vAlign w:val="center"/>':'')+'</w:tcPr>'+(content||p(''))+'</w:tc>';
 const tbl=(grid,rows,borders)=>'<w:tbl><w:tblPr><w:tblW w:w="'+grid.reduce((a,b)=>a+b,0)+'" w:type="dxa"/><w:tblLayout w:type="fixed"/>'+(borders?'<w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(k=>'<w:'+k+' w:val="single" w:sz="4" w:color="000000"/>').join('')+'</w:tblBorders>':noB)+'<w:tblCellMar><w:left w:w="60" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>'+grid.map(w=>'<w:gridCol w:w="'+w+'"/>').join('')+'</w:tblGrid>'+rows.join('')+'</w:tbl>';
 const tr=(cells,head)=>'<w:tr>'+(head?'<w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>':'<w:trPr><w:cantSplit/></w:trPr>')+cells+'</w:tr>';
 const G=[1650,280,420,7250];
 const body=[];
 body.push(c1('KEPUTUSAN MENTERI KEUANGAN REPUBLIK INDONESIA',1),p(r('NOMOR ',{b:1})+r('[…]',{b:1,hl:1})+r(' TAHUN '+m.sy,{b:1}),{jc:'center',after:0}),c1('TENTANG',1),c1(m.TTL,1,{after:240}),c1('DENGAN RAHMAT TUHAN YANG MAHA ESA',0,{after:240}),c1('MENTERI KEUANGAN REPUBLIK INDONESIA,',1,{after:240}));
 const rows3=(lab,items,sep)=>items.map((it,i)=>tr(cell(G[0],p(r(i?'':lab),{jc:'left'}))+cell(G[1],p(r(i?'':':'),{jc:'left'}))+cell(G[2],p(r(sep==='a'?HURUF[i]+'.':(i+1)+'.'),{jc:'left'}))+cell(G[3],p(runs(it)))));
 body.push(tbl(G,[...rows3('Menimbang',m.menimbang,'a'),tr(cell(G[0],p(''))+cell(G[1],p(''))+cell(G[2],p(''))+cell(G[3],p(''))),...rows3('Mengingat',m.mengingat,'1')]));
 body.push(c1('MEMUTUSKAN:',1,{after:160}));
 const drows=[tr(cell(G[0],p(r('Menetapkan'),{jc:'left'}))+cell(G[1],p(r(':'),{jc:'left'}))+cell(G[2]+G[3],p(r('KEPUTUSAN MENTERI KEUANGAN TENTANG '+m.TTL+'.',{b:1})),{span:2}))];
 m.diktum.forEach((it,i)=>{const items=(it.find(x=>x&&x.items)||{}).items;
  drows.push(tr(cell(G[0],p(r(DIKTUM[i]),{jc:'left'}))+cell(G[1],p(r(':'),{jc:'left'}))+cell(G[2]+G[3],p(runs(it.filter(x=>!x||!x.items)))+(items?items.map((t,j)=>p(r(HURUF[j]+'.\t'+t+(j<items.length-1?';':'.')),{ind:420,hang:420})).join(''):''),{span:2})))});
 body.push(tbl(G,drows));
 const sign=()=>[p(r('Ditetapkan di Jakarta'),{jc:'left',ind:5200,after:0}),p(r('pada tanggal ')+r('[…]',{hl:1}),{jc:'left',ind:5200,after:200}),p(r('MENTERI KEUANGAN REPUBLIK INDONESIA,'),{jc:'left',ind:5200,after:200}),p(r('Ditandatangani secara elektronik'),{jc:'left',ind:5200,after:200}),p(r('[NAMA]',{hl:1}),{jc:'left',ind:5200})];
 body.push(p('',{after:200}),...sign());
 /* Lampiran */
 body.push(p(r('LAMPIRAN'),{jc:'left',ind:4800,after:0,pb:1}),p(r('KEPUTUSAN MENTERI KEUANGAN REPUBLIK INDONESIA'),{jc:'left',ind:4800,after:0}),p(r('NOMOR ')+r('[…]',{hl:1}),{jc:'left',ind:4800,after:0}),p(r('TENTANG'),{jc:'left',ind:4800,after:0}),p(r(m.TTL),{jc:'left',ind:4800,after:300}));
 const H=(t,ind)=>p(r(t,{b:1}),{jc:'left',ind:ind||0,keep:1,after:120});
 const nums=(L,ind)=>L.length?L.map((t,i)=>p(r((i+1)+')\t'+t),{ind:ind+420,hang:420})).join(''):p(r('[belum diisi pada Charter Program]',{hl:1}),{ind});
 body.push(H('A.\tPROGRAM TRANSFORMASI KEMENTERIAN KEUANGAN'));
 if(!m.lamp.length)body.push(p(r('[Belum ada program dipilih]',{hl:1}),{ind:420}));
 m.lamp.forEach(x=>{
  body.push(H(x.no+'.\t'+x.nama,420));
  if(x.noC)body.push(p(r('[Charter Program belum dibuat untuk program ini]',{hl:1}),{ind:840}));
  body.push(H('a.\tRuang Lingkup dan Proses Bisnis',840),nums(x.ruang.lb,840));
  if(x.ruang.tb.length)body.push(p(r('Terobosan yang dilakukan meliputi:'),{ind:840}),nums(x.ruang.tb,840));
  body.push(H('b.\tKondisi yang Diharapkan',840));if(x.kondisi.tujuan)body.push(p(r(x.kondisi.tujuan),{ind:840}));body.push(nums(x.kondisi.oc,840));
  body.push(H('c.\tKegiatan',840),nums(x.kegiatan,840));
  body.push(H('d.\tPenanggung Jawab',840));
  [['Initiative Champion',x.pj.champion],['Initiative Owner',x.pj.owner.join('; ')],['UIC Utama',x.pj.uic],['UIC Pendukung',x.pj.pend]].forEach(([k,v])=>body.push(p(r(k+'\t: '+(v||'—')),{ind:1260,hang:420})));
 });
 body.push(H('B.\tMILESTONE PROGRAM TRANSFORMASI KEMENTERIAN KEUANGAN'));
 const W=9600,yw=Math.min(900,Math.floor(4200/Math.max(1,m.yrs.length))),nw=560,kw=W-nw-yw*m.yrs.length,grid=[nw,kw].concat(m.yrs.map(()=>yw));
 const ms=[tr(cell(nw,p(r('No',{b:1}),{jc:'center',after:0}),{fill:'D9D9D9',vc:1})+cell(kw,p(r('Kegiatan',{b:1}),{jc:'center',after:0}),{fill:'D9D9D9',vc:1})+m.yrs.map(y=>cell(yw,p(r(String(y),{b:1}),{jc:'center',after:0}),{fill:'D9D9D9'})).join(''),1)];
 let n=0;m.ms.forEach(g=>{ms.push(tr(cell(W,p(r(g.nama,{b:1}),{jc:'left',after:0}),{span:grid.length,fill:'F2F2F2'})));
  (g.rows.length?g.rows:[null]).forEach(rw=>ms.push(tr(cell(nw,p(r(rw?(++n)+'.':''),{jc:'center',after:0}))+cell(kw,p(rw?r(rw.t):r('[Key Milestones belum diisi]',{hl:1}),{jc:'left',after:0}))+m.yrs.map(y=>cell(yw,p('',{after:0}),{fill:rw&&rw.y===y?'404040':null})).join(''))))});
 body.push(tbl(grid,ms,true),p('',{after:240}),...sign().slice(2));
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body.join('')+
  '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1701" w:right="1008" w:bottom="1152" w:left="1296" w:header="709" w:footer="706" w:gutter="0"/></w:sectPr></w:body></w:document>';
}
function lib(url,ok){return new Promise((res,rej)=>{if(ok())return res();const s=document.createElement('script');s.src=url;s.onload=()=>ok()?res():rej(Error('Pustaka gagal dimuat'));s.onerror=()=>rej(Error('Pustaka gagal dimuat. Periksa koneksi internet.'));document.head.appendChild(s)})}
async function docxBlob(m){await lib('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',()=>!!window.JSZip);const z=new JSZip();
 z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
 z.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 z.file('word/_rels/document.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>');
 z.file('word/document.xml',docxXml(m));
 return z.generateAsync({type:'blob',compression:'DEFLATE',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})}
function saveBlob(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),15000)}

/* ---------- PENYIMPANAN PDF LOKAL ---------- */
function idb(mode,fn){return new Promise((res,rej)=>{if(!window.indexedDB)return rej(Error('Penyimpanan lokal tidak tersedia.'));const q=indexedDB.open('mt-signed-documents',1);
 q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('proofs'))q.result.createObjectStore('proofs')};q.onerror=()=>rej(Error('Tidak dapat membuka penyimpanan lokal.'));
 q.onsuccess=()=>{const db=q.result,tx=db.transaction('proofs',mode),st=tx.objectStore('proofs'),out=fn(st);tx.oncomplete=()=>{db.close();res(out&&out.result)};tx.onerror=()=>{db.close();rej(Error('Gagal mengakses berkas lokal.'))}}})}
const putFile=(id,file)=>idb('readwrite',st=>st.put(file,id));
const getFile=id=>idb('readonly',st=>st.get(id));

/* ---------- TAMPILAN ---------- */
function view(){
 const d=store(),all=programs(),sel=chosen(),m=model(),ed=can(),ic=typeof MT_INFO_ICON==='function'?MT_INFO_ICON:()=>'';
 const latest=d.docs[d.docs.length-1];
 const settings='<div class="rk-set"><label><span>Judul Keputusan</span><textarea rows="2" data-rk-title '+(ed?'':'readonly')+' placeholder="'+E(title({title:''}))+'">'+E(d.title||'')+'</textarea></label>'+
  '<label><span>Tahun penetapan</span><input data-rk-signyear inputmode="numeric" maxlength="4" value="'+E(d.signYear||'')+'" placeholder="'+new Date().getFullYear()+'" '+(ed?'':'readonly')+'></label>'+
  '<div class="rk-progs"><div class="rk-progs-h"><b>Program dalam Lampiran ('+sel.length+'/'+all.length+')</b>'+(ed&&all.length?'<button type="button" class="btn btn-sm" data-rk-all>'+(sel.length===all.length?'Kosongkan':'Pilih semua')+'</button>':'')+'</div>'+
  (all.length?all.map(p=>'<label class="rk-pi"><input type="checkbox" data-rk-prog="'+E(p.id)+'" '+(sel.includes(p)?'checked':'')+' '+(ed?'':'disabled')+'><span>'+E(p.nama)+(charterOf(p)?'':' <em>· charter belum ada</em>')+'</span></label>').join(''):'<p class="s">Belum ada program pada tahun '+year()+'.</p>')+'</div>'+
  '<p class="rk-note"><mark class="rk-ph">[…]</mark> = diisi/disunting di Word saat legal drafting. Isian program dan milestone diambil otomatis dari Charter Program.</p>'+
  '<button type="button" class="btn pri rk-dl" data-rk-docx '+(sel.length?'':'disabled')+'>↓ Unduh Kerangka RKMK (.docx)</button></div>';
 const final='<div class="ps27-card rk-final"><div class="ps27-cardtop"><div><h3>RKMK Ditetapkan'+ic('Unggah KMK yang sudah ditetapkan (PDF TTE). Setiap unggahan menjadi versi baru dan menandai program yang tercakup.')+'</h3></div>'+
  (latest?'<span class="ps27-status rk-ok">Ditetapkan · '+E(latest.number)+'</span>':'<span class="ps27-status">Belum ada</span>')+(ed?'<button type="button" class="btn pri" data-rk-upload-open>↑ Unggah RKMK Ditetapkan</button>':'')+'</div>'+
  (d.docs.length?'<div class="rk-tw"><table class="rk-hist"><thead><tr><th>Versi</th><th>Nomor KMK</th><th>Tanggal</th><th>Tentang</th><th>Program</th><th>Berkas</th></tr></thead><tbody>'+
   d.docs.slice().reverse().map(x=>'<tr><td>v'+x.version+'</td><td><b>'+E(x.number)+'</b></td><td>'+E(x.date)+'</td><td>'+E(x.title)+'</td><td>'+(x.programIds||[]).length+'</td><td>'+(x.fileId?'<button type="button" class="btn btn-sm" data-rk-open="'+E(x.fileId)+'">Lihat PDF</button> ':'')+(x.link?'<a href="'+E(x.link)+'" target="_blank" rel="noopener">Tautan</a>':'')+'</td></tr>').join('')+'</tbody></table></div>':
   '<p class="s" style="margin:6px 2px">Belum ada RKMK yang ditetapkan untuk tahun '+year()+'.</p>')+'</div>';
 return '<div class="ps27-card rk-wrap"><div class="ps27-cardtop"><div><h3>Draft RKMK · '+year()+ic('Kerangka naskah KMK: bagian umum ditandai untuk diisi di Word; daftar program, uraian program, dan milestone terisi otomatis dari Charter Program. Pratinjau sama dengan berkas Word yang diunduh.')+'</h3></div><span class="ps27-status">Kerangka</span></div>'+
  '<div class="rk-grid">'+settings+'<div class="rk-prev">'+previewHtml(m)+'</div></div></div>'+final;
}
function uploadDialog(){
 const d=store(),all=programs(),sel=chosen();
 const ov=document.createElement('div');ov.className='pswf-overlay rk-ov';
 ov.innerHTML='<section class="pswf-modal rk-modal" role="dialog" aria-modal="true" aria-label="Unggah RKMK Ditetapkan"><header><h2>Unggah RKMK Ditetapkan · '+year()+'</h2><button type="button" data-rk-close aria-label="Tutup">✕</button></header><main>'+
  '<div class="rk-form"><label><span>Nomor KMK *</span><input data-f="number" placeholder="mis. 123/KMK.01/2026"></label><label><span>Tanggal penetapan *</span><input type="date" data-f="date"></label>'+
  '<label class="w"><span>Tentang *</span><input data-f="title" value="'+E(title(d))+'"></label><label class="w"><span>Berkas PDF hasil TTE *</span><input type="file" accept="application/pdf,.pdf" data-f="file"></label>'+
  '<label class="w"><span>Tautan dokumen (opsional, mis. JDIH/SharePoint)</span><input data-f="link" placeholder="https://…"></label>'+
  '<div class="w"><span class="rk-lab">Program yang tercakup</span><div class="rk-pgrid">'+all.map(p=>'<label class="rk-pi"><input type="checkbox" data-f-prog="'+E(p.id)+'" '+(sel.includes(p)?'checked':'')+'><span>'+E(p.nama)+'</span></label>').join('')+'</div></div>'+
  '<p class="rk-note w">PDF disimpan di browser perangkat ini. Agar dapat dibuka dari perangkat lain, isi juga tautan dokumen.</p></div></main>'+
  '<footer><button class="btn" type="button" data-rk-close>Batal</button><button class="btn pri" type="button" data-rk-save>Simpan</button></footer></section>';
 document.body.appendChild(ov);
 ov.addEventListener('click',async e=>{
  if(e.target===ov||e.target.closest('[data-rk-close]')){ov.remove();return}
  if(!e.target.closest('[data-rk-save]'))return;
  const v=k=>T(ov.querySelector('[data-f="'+k+'"]')?.value),file=ov.querySelector('[data-f="file"]').files[0];
  if(!v('number')||!v('date')||!v('title')){say('Nomor, tanggal, dan tentang wajib diisi.');return}
  if(!file||!/\.pdf$/i.test(file.name)){say('Pilih berkas PDF hasil TTE.');return}
  if(v('link')&&!/^https?:\/\//i.test(v('link'))){say('Tautan harus diawali http(s)://');return}
  const ids=[...ov.querySelectorAll('[data-f-prog]:checked')].map(x=>x.dataset.fProg);
  if(!ids.length){say('Pilih minimal satu program yang tercakup.');return}
  const id=uid('rkmk'),fileId='rkmk:'+id;
  try{await putFile(fileId,file)}catch(err){say(err.message);return}
  const rec={id,version:d.docs.length+1,number:v('number'),date:v('date'),title:v('title'),link:v('link'),fileId,fileName:file.name,size:file.size,programIds:ids,at:new Date().toISOString(),by:me()?.email||''};
  d.docs.push(rec);
  (S.programs||[]).forEach(p=>{if(ids.includes(String(p.id)))p.psRkmkRef={id,number:rec.number,date:rec.date,version:rec.version}});
  if(typeof save==='function')save();ov.remove();if(typeof render==='function')render();say('RKMK '+rec.number+' tersimpan sebagai versi v'+rec.version+'.');
 });
}
/* ---------- EVENT ---------- */
document.addEventListener('click',async ev=>{
 const t=ev.target;if(!t.closest)return;
 if(t.closest('[data-rk-docx]')){ev.preventDefault();const b=t.closest('[data-rk-docx]');b.disabled=true;
  try{const m=model();saveBlob(await docxBlob(m),'Kerangka_RKMK_'+m.ttl.replace(/[^A-Za-z0-9]+/g,'_').slice(0,70)+'_'+year()+'.docx');say('Kerangka RKMK diunduh. Sunting bagian bertanda kuning di Word.')}catch(e){say('Gagal membuat Word: '+(e.message||e))}finally{b.disabled=false}return}
 if(t.closest('[data-rk-all]')&&can()){const d=store(),all=programs();d.programIds=chosen().length===all.length?[]:null;save();render();return}
 if(t.closest('[data-rk-upload-open]')&&can()){uploadDialog();return}
 const o=t.closest('[data-rk-open]');if(o){try{const f=await getFile(o.dataset.rkOpen);if(!f)throw Error('Berkas tidak ditemukan di browser ini. Gunakan tautan dokumen.');const u=URL.createObjectURL(f);window.open(u,'_blank');setTimeout(()=>URL.revokeObjectURL(u),60000)}catch(e){say(e.message||'Berkas tidak ditemukan di browser ini.')}}
});
document.addEventListener('change',ev=>{
 const t=ev.target;if(!can())return;
 if(t.matches?.('[data-rk-prog]')){const d=store(),all=programs();const cur=new Set(chosen().map(p=>String(p.id)));if(t.checked)cur.add(t.dataset.rkProg);else cur.delete(t.dataset.rkProg);d.programIds=cur.size===all.length?null:[...cur];save();render();return}
 if(t.matches?.('[data-rk-title]')){store().title=T(t.value);save();render();return}
 if(t.matches?.('[data-rk-signyear]')){const v=T(t.value);if(v&&!/^\d{4}$/.test(v)){say('Tahun penetapan 4 digit.');return}store().signYear=v;save();render();return}
});
window.MT_RKMK={view,model,docxXml,docxBlob,previewHtml,version:'20261125-rkmk1'};
})();
