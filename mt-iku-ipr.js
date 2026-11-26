/* Modul Transformasi — Referensi IKU, IKU Terkait pada aktivitas, dan Ekspor IPR (2026-11-24).
   - Referensi IKU per tahun disimpan di dokumen oneonone/cfg-ikuref {kind:'cfg', ref:{'2026':[{kode,nama,ssNo,ssNama,strategi}]}}
     → dibaca pusat (SA/PMOK/CMOK/KETUA/KAPUS/SEKPIM), ditulis SA/PMOK/CMOK (sesuai firestore.rules koleksi oneonone).
   - Aktivitas menyimpan ikuRefs:[kode IKU] (bisa lebih dari satu) dan kendala (teks).
   - Ekspor IPR: Excel 4 sheet "Capaian TW 1..4" format No | IKU | Realisasi | Bukti Dukung | Kendala | Usulan Strategi |
     Tindakan yang dilaksanakan. Realisasi & Bukti Dukung sengaja kosong (dikelola di aplikasi IKU). */
(function(){
'use strict';
const DOC='cfg-ikuref';
const ROLES_W=['SA','PMOK','CMOK'];
const SS26=[
 ['1','Transformasi dan Manajemen Perubahan Kementerian Keuangan yang Berkesinambungan dan Berdampak'],
 ['2','Perumusan Transformasi dan Perubahan yang Berdampak'],
 ['3','Pengelolaan Transformasi dan Perubahan yang Akseleratif dan Berkelanjutan'],
 ['4','Pengembangan Transformasi dan Perubahan yang Berkelanjutan'],
 ['5','Pemantauan Transformasi dan Perubahan yang Berkesinambungan'],
 ['6','Peningkatan Kompetensi SDM yang Unggul'],
 ['7','Penguatan Tata Kelola Organisasi dan Budaya Kerja Kolaboratif'],
 ['8','Pengelolaan Keuangan yang Akuntabel']];
const IKU26=[
 ['1a-CP','Tingkat Keberhasilan Transformasi Kemenkeu','Memantau capaian milestone program transformasi secara berkala bersama PMO dan CMO Unit Eselon I, serta memberikan pendampingan dan rekomendasi percepatan atas milestone yang berisiko tidak tercapai.'],
 ['1b-CP','Indeks Kepercayaan Stakeholders','Menjaga kualitas layanan manajemen transformasi dan perubahan sesuai Standar Layanan Pusmantap, serta menindaklanjuti umpan balik pemangku kepentingan secara berkala.'],
 ['2a-N','Persentase Keberhasilan Perumusan Program Transformasi dan Manajemen Perubahan Kemenkeu','Mengoordinasikan perumusan dan penyelarasan program transformasi bersama unit pemilik proses bisnis melalui forum koordinasi (T-Forum/T-Lab), serta memastikan dokumen perencanaan program tersusun tepat waktu.'],
 ['3a-CP','Tingkat Keberhasilan Pelaksanaan Project Management Office (PMO)','Menyelenggarakan forum koordinasi PMO (monthly meeting dan 1-on-1) untuk memantau WBS dan milestone, mengidentifikasi isu serta risiko, dan mengeskalasi kendala kepada pengambil keputusan.'],
 ['4a-CP','Tingkat Keberhasilan Pelaksanaan Change Management Office (CMO)','Memberikan pendampingan strategi manajemen perubahan kepada Unit Eselon I melalui narasumber, advisory, dan fasilitasi FGD, serta memantau pengisian dan pelaksanaan Kertas Kerja Manajemen Perubahan.'],
 ['4b-N','Tingkat Keberhasilan Pengembangan Program Transformasi dan Manajemen Perubahan Kemenkeu','Mengembangkan perangkat pendukung program transformasi dan manajemen perubahan (aplikasi, pedoman, dan template) sesuai kebutuhan pengguna, termasuk pengujian dan penyempurnaan berkelanjutan.'],
 ['4c-N','Tingkat Keberhasilan Manajemen Pengetahuan Program Transformasi dan Manajemen Perubahan Kemenkeu','Mengidentifikasi, mendokumentasikan, dan membagikan pengetahuan program transformasi (knowledge mapping, aset intelektual, T-Walk/T-Talk) agar dapat dimanfaatkan seluruh unit.'],
 ['5a-N','Tingkat Kualitas Monitoring dan Evaluasi Implementasi Program Transformasi dan Manajemen Perubahan Kemenkeu','Melaksanakan monitoring dan evaluasi implementasi program transformasi per triwulan, menyusun laporan monev, dan menyampaikan rekomendasi perbaikan kepada unit terkait.'],
 ['6a-N','Tingkat Kualitas Pengembangan Kompetensi SDM Pusmantap','Menyusun dan melaksanakan rencana pengembangan kompetensi pegawai Pusmantap (pelatihan, sertifikasi, dan berbagi pengetahuan) sesuai kebutuhan jabatan.'],
 ['7a-CP','Nilai Evaluasi Reformasi Birokrasi dari KemenPAN-RB','Mendukung pemenuhan komponen evaluasi Reformasi Birokrasi melalui penyediaan data dukung yang lengkap dan tepat waktu.'],
 ['7b-N','Persentase Penyelesaian Proses Bisnis Operasional dan Tindak Lanjut Rekomendasi Hasil Pengawasan','Memantau penyelesaian proses bisnis operasional dan tindak lanjut rekomendasi hasil pengawasan secara berkala hingga tuntas.'],
 ['7c-N','Tingkat Partisipasi Pegawai dalam EA Kemenkeu','Mendorong dan memantau partisipasi pegawai Pusmantap dalam kegiatan EA Kemenkeu secara berkala.'],
 ['8a-N','Tingkat Kualitas Pengelolaan Anggaran dan Pengadaan','Melaksanakan perencanaan, pemantauan penyerapan anggaran, dan pengadaan secara tertib sesuai rencana kegiatan.']];
const ssOf=k=>String(k||'').match(/^(\d+)/)?.[1]||'';
const SEED={'2026':IKU26.map(([kode,nama,strategi])=>{const n=ssOf(kode);return {kode,nama,ssNo:n,ssNama:(SS26.find(s=>s[0]===n)||[])[1]||'',strategi}})};
const E=v=>String(v==null?'':v).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const nk=k=>String(k||'').replace(/\s+/g,'').trim();
const T=(s)=>{try{toast(s)}catch(e){console.log(s)}};
const role=()=>{try{return ME&&ME.role||''}catch(e){return ''}};
const canEdit=()=>ROLES_W.includes(role());
const isPusat=()=>{try{return actGrp()==='pusat'}catch(e){return false}};
const doc=()=>(S.oneonone||[]).find(x=>x.id===DOC);
const yNow=()=>String(new Date().getFullYear());
function years(){const d=doc(),set=new Set(Object.keys(SEED));if(d&&d.ref)Object.keys(d.ref).forEach(y=>set.add(y));try{(actRows()||[]).forEach(x=>x.tahun&&set.add(String(x.tahun)))}catch(e){}set.add(yNow());return [...set].filter(y=>/^\d{4}$/.test(y)).sort()}
function sortRows(r){return r.slice().sort((a,b)=>(+a.ssNo||99)-(+b.ssNo||99)||String(a.kode).localeCompare(String(b.kode),'id',{numeric:true}))}
function ref(y){y=String(y||yNow());const d=doc();const r=d&&d.ref&&Array.isArray(d.ref[y])?d.ref[y]:(SEED[y]||[]);return sortRows(r.filter(x=>x&&x.kode))}
function writeRef(y,rows,what){if(!canEdit()){T('Hanya Superadmin, PMO Kemenkeu, dan CMO Kemenkeu yang dapat mengubah Referensi IKU.');return false}
 let d=doc();if(!d){d={id:DOC,kind:'cfg',tahun:0,tw:0,ref:{}};S.oneonone.push(d)}if(!d.ref||typeof d.ref!=='object')d.ref={};
 d.ref[String(y)]=sortRows(rows).map(x=>({kode:nk(x.kode),nama:String(x.nama||'').trim(),ssNo:String(x.ssNo||ssOf(x.kode)),ssNama:String(x.ssNama||'').trim(),strategi:String(x.strategi||'').trim()}));
 try{actStamp(d)}catch(e){}try{log('Referensi IKU',what||('Pemutakhiran IKU '+y))}catch(e){}save();render();return true}
const yearOfItem=x=>String((x&&(x.tahun||String(x.tgl||'').slice(0,4)))||yNow());
const label=(k,y)=>{const r=ref(y).find(x=>x.kode===k);return r?r.nama:''};
const refsOf=x=>Array.isArray(x&&x.ikuRefs)?x.ikuRefs.map(nk).filter(Boolean):[];

/* ---------- isian IKU Terkait pada form aktivitas ---------- */
function fieldHTML(item){if(!isPusat())return '';const refs=refsOf(item);
 return `<div class="fld wide iku-fld" data-iku-fld><label>IKU terkait${typeof IC==='function'?IC('Boleh lebih dari satu IKU. Dipakai sebagai data dukung kolom Tindakan dan Kendala pada Ekspor IPR.'):''}</label><div class="iku-box"><div class="iku-chips" data-iku-chips></div><button type="button" class="btn sm" data-iku-pick>☑ Pilih IKU</button></div><input type="hidden" id="one-ikuRefs" value="${E(JSON.stringify(refs))}"></div>`}
function readForm(root){const h=root&&root.querySelector('#one-ikuRefs');if(!h)return null;try{const a=JSON.parse(h.value||'[]');return Array.isArray(a)?[...new Set(a.map(nk).filter(Boolean))]:[]}catch(e){return []}}
function formYear(root){const t=root&&root.querySelector('#one-tgl');return t&&/^\d{4}/.test(t.value)?t.value.slice(0,4):String((S.ui&&S.ui.actTahun)||yNow())}
function drawChips(root){const box=root&&root.querySelector('[data-iku-chips]');if(!box)return;const y=formYear(root),refs=readForm(root)||[];
 box.innerHTML=refs.length?refs.map(k=>{const n=label(k,y);return `<span class="iku-chip${n?'':' miss'}" title="${E(n||'Kode tidak ada di Referensi IKU '+y)}"><b>${E(k)}</b><span>${E(n||'tidak ada di referensi '+y)}</span><button type="button" data-iku-rm="${E(k)}" aria-label="Lepas ${E(k)}">×</button></span>`}).join(''):'<span class="iku-none">Belum ada IKU dipilih</span>'}
function setForm(root,refs){const h=root&&root.querySelector('#one-ikuRefs');if(!h)return;h.value=JSON.stringify([...new Set((refs||[]).map(nk).filter(Boolean))]);drawChips(root);h.dispatchEvent(new Event('change',{bubbles:true}))}
function picker(root){const y=formYear(root),rows=ref(y),cur=new Set(readForm(root)||[]);
 if(!rows.length){T('Referensi IKU tahun '+y+' belum ada. Isi dulu di Aktivitas › Referensi IKU.');return}
 const groups=[];rows.forEach(r=>{let g=groups.find(x=>x.no===r.ssNo);if(!g)groups.push(g={no:r.ssNo,nama:r.ssNama,rows:[]});g.rows.push(r)});
 const body=`<p class="iku-pk-h">Centang IKU yang didukung kegiatan ini. Daftar mengikuti Referensi IKU tahun <b>${E(y)}</b> (sesuai tanggal kegiatan).</p><input class="inp iku-pk-q" placeholder="Cari kode atau nama IKU…" data-iku-q><div class="iku-pk">${groups.map(g=>`<div class="iku-pk-g"><div class="iku-pk-ss"><i>${E(g.no)}</i>${E(g.nama||'Sasaran Strategis '+g.no)}</div>${g.rows.map(r=>`<label class="iku-pk-r" data-hay="${E((r.kode+' '+r.nama).toLowerCase())}"><input type="checkbox" value="${E(r.kode)}"${cur.has(r.kode)?' checked':''}><b>${E(r.kode)}</b><span>${E(r.nama)}</span></label>`).join('')}</div>`).join('')}</div>`;
 const ov=modal('Pilih IKU terkait',body,'Terapkan',o=>{setForm(root,[...o.querySelectorAll('.iku-pk input:checked')].map(i=>i.value))},{size:'iku-pk-md'});
 const q=ov.querySelector('[data-iku-q]');q.addEventListener('input',()=>{const v=q.value.toLowerCase().trim();ov.querySelectorAll('.iku-pk-r').forEach(r=>r.hidden=!!v&&!r.dataset.hay.includes(v));ov.querySelectorAll('.iku-pk-g').forEach(g=>g.hidden=![...g.querySelectorAll('.iku-pk-r')].some(r=>!r.hidden))})}
function wireForm(root){if(!root||root.dataset.ikuBound)return;root.dataset.ikuBound='1';drawChips(root);
 root.addEventListener('click',e=>{if(e.target.closest('[data-iku-pick]')){picker(root);return}const rm=e.target.closest('[data-iku-rm]');if(rm){setForm(root,(readForm(root)||[]).filter(k=>k!==rm.dataset.ikuRm))}});
 root.addEventListener('change',e=>{if(e.target&&e.target.id==='one-tgl')drawChips(root)})}

/* ---------- halaman Aktivitas › Referensi IKU ---------- */
const UI=()=>{S.ui=S.ui||{};return S.ui};
function counts(y){const out={};let rows=[];try{rows=actRows()}catch(e){}rows.filter(x=>yearOfItem(x)===String(y)&&!SKIP_ST.includes(safeSt(x))).forEach(x=>{const tw=twOf(x);refsOf(x).forEach(k=>{out[k]=out[k]||[0,0,0,0,0];out[k][tw]++;out[k][0]++})});return out}
function twOf(x){try{const t=oneTwOf(x);if(t>=1&&t<=4)return t}catch(e){}const m=+String(x.tgl||'').slice(5,7);return m?Math.ceil(m/3):1}
function page(){const U=UI(),ys=years();let y=String(U.ikuYear||((U.actTahun&&ys.includes(String(U.actTahun)))?U.actTahun:yNow()));if(!ys.includes(y))y=ys[ys.length-1];
 const rows=ref(y),cnt=counts(y),ed=canEdit(),d=doc(),seeded=!(d&&d.ref&&d.ref[y])&&!!SEED[y];
 const q=String(U.ikuQ||'').toLowerCase().trim(),vis=rows.filter(r=>!q||(r.kode+' '+r.nama+' '+r.ssNama+' '+r.strategi).toLowerCase().includes(q));
 let lastSs=null;const tb=vis.map(r=>{const c=cnt[r.kode]||[0,0,0,0,0];const ss=r.ssNo!==lastSs?`<tr class="iku-ss"><td>${E(r.ssNo)}.</td><td colspan="${ed?6:5}">${E(r.ssNama||'Sasaran Strategis '+r.ssNo)}</td></tr>`:'';lastSs=r.ssNo;
  return ss+`<tr><td class="iku-k">${E(r.kode)}</td><td class="iku-n">${E(r.nama)}</td><td class="iku-s">${E(r.strategi||'—')}</td><td class="iku-c">${[1,2,3,4].map(t=>`<span class="${c[t]?'on':''}" title="TW ${t}: ${c[t]} aktivitas">${c[t]}</span>`).join('')}</td><td class="iku-t">${c[0]}</td>${ed?`<td class="iku-a"><button type="button" class="icon-btn" data-act="ikuEdit" data-k="${E(r.kode)}" title="Ubah IKU" aria-label="Ubah IKU ${E(r.kode)}">✎</button><button type="button" class="icon-btn" data-act="ikuDel" data-k="${E(r.kode)}" title="Hapus IKU" aria-label="Hapus IKU ${E(r.kode)}">🗑</button></td>`:''}</tr>`}).join('');
 const hdr=(typeof AKT_HDR==='function')?AKT_HDR():'';
 return '<div class="cmx">'+hdr+`<div class="card iku-card"><div class="ch iku-ch"><h3>Referensi IKU <span class="s">(${rows.length} IKU · tahun ${E(y)})</span></h3>
  <label class="iku-yr">Tahun <select class="inp" data-iku-year>${ys.map(v=>`<option${v===y?' selected':''}>${v}</option>`).join('')}</select></label>
  <input class="inp iku-q" placeholder="Cari IKU…" value="${E(U.ikuQ||'')}" data-iku-search aria-label="Cari IKU">
  <span class="sp"></span>${ed?`<button type="button" class="btn sm" data-act="ikuImport">⇪ Import IKU</button><button type="button" class="btn sm" data-act="ikuAdd">＋ IKU</button>`:''}${ROLES_W.includes(role())?`<button type="button" class="btn sm gold" data-act="iprExport">⇩ IPR</button>`:''}</div>
  ${seeded?`<div class="iku-note">ⓘ Daftar ${E(y)} masih memakai data awal dari file Capaian IKU Pusmantap ${E(y)}. ${ed?'Perubahan pertama (ubah/tambah/import) akan menyimpannya sebagai referensi resmi.':''}</div>`:''}
  ${rows.length?`<div class="tscroll"><table class="lap iku-tbl"><colgroup><col style="width:82px"><col style="width:30%"><col><col style="width:132px"><col style="width:56px">${ed?'<col style="width:76px">':''}</colgroup><thead><tr><th>Kode</th><th>Nama IKU</th><th>Usulan strategi (normatif, sama tiap TW)</th><th>Aktivitas TW I–IV</th><th>Total</th>${ed?'<th></th>':''}</tr></thead><tbody>${tb||`<tr><td colspan="6" class="od-emp">Tidak ada IKU yang cocok.</td></tr>`}</tbody></table></div>`:`<div class="od-emp">Belum ada Referensi IKU tahun ${E(y)}. ${ed?'Klik <b>Import IKU</b> untuk menempelkan daftar dari aplikasi IKU, atau <b>＋ IKU</b> untuk menambah satu per satu.':''}</div>`}
  </div></div>`}
document.addEventListener('change',e=>{const s=e.target.closest&&e.target.closest('[data-iku-year]');if(s){UI().ikuYear=s.value;save();render()}});
document.addEventListener('input',e=>{const s=e.target.closest&&e.target.closest('[data-iku-search]');if(!s)return;UI().ikuQ=s.value;clearTimeout(s._t);s._t=setTimeout(()=>{const pos=s.selectionStart;render();const n=document.querySelector('[data-iku-search]');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}},250)});
const curYear=()=>{const ys=years();let y=String(UI().ikuYear||yNow());return ys.includes(y)?y:ys[ys.length-1]};
function editIku(k){const y=curYear(),rows=ref(y),r=rows.find(x=>x.kode===k)||{kode:'',nama:'',ssNo:'',ssNama:'',strategi:''},isNew=!k;
 const ssList=[...new Map(rows.map(x=>[x.ssNo,x.ssNama])).entries()];
 const body=`<div class="fgrid iku-form"><div class="fld"><label>Kode IKU <i class="sw-rq">*</i></label><input class="inp" data-f="kode" value="${E(r.kode)}" placeholder="mis. 4a-CP"></div><div class="fld"><label>No. Sasaran Strategis</label><input class="inp" data-f="ssNo" value="${E(r.ssNo)}" placeholder="otomatis dari kode"></div>
  <div class="fld wide"><label>Nama IKU <i class="sw-rq">*</i></label><input class="inp" data-f="nama" value="${E(r.nama)}"></div>
  <div class="fld wide"><label>Nama Sasaran Strategis</label><input class="inp" data-f="ssNama" list="iku-ss-list" value="${E(r.ssNama)}"><datalist id="iku-ss-list">${ssList.map(([n,s])=>`<option value="${E(s)}">${E(n)}</option>`).join('')}</datalist></div>
  <div class="fld wide"><label>Usulan strategi (normatif — dipakai sama di setiap triwulan IPR)</label><textarea class="inp" rows="4" data-f="strategi">${E(r.strategi)}</textarea></div></div>`;
 modal((isNew?'Tambah':'Ubah')+' IKU · '+y,body,'Simpan',o=>{const v=f=>o.querySelector('[data-f="'+f+'"]').value.trim();const kode=nk(v('kode')),nama=v('nama');
  if(!kode||!nama){T('Kode dan nama IKU wajib diisi.');return false}
  if(rows.some(x=>x.kode===kode&&x.kode!==r.kode)){T('Kode '+kode+' sudah ada di tahun '+y+'.');return false}
  const ssNo=v('ssNo')||ssOf(kode),ssNama=v('ssNama')||(rows.find(x=>x.ssNo===ssNo)||{}).ssNama||'';
  const next=rows.filter(x=>x.kode!==r.kode||isNew).concat([{kode,nama,ssNo,ssNama,strategi:v('strategi')}]);
  if(!isNew&&kode!==r.kode)renameRefs(y,r.kode,kode);
  writeRef(y,next,(isNew?'Tambah IKU ':'Ubah IKU ')+kode+' ('+y+')');T('Referensi IKU tersimpan.')},{size:'wide'})}
function renameRefs(y,from,to){let n=0;(S.oneonone||[]).forEach(x=>{if(x.kind==='cfg'||yearOfItem(x)!==String(y)||!Array.isArray(x.ikuRefs))return;const i=x.ikuRefs.indexOf(from);if(i>-1){x.ikuRefs[i]=to;x.ikuRefs=[...new Set(x.ikuRefs)];n++}});if(n)T(n+' aktivitas ikut diperbarui ke kode '+to+'.')}
function delIku(k){const y=curYear(),c=(counts(y)[k]||[0])[0];
 confirmDel(k,()=>{writeRef(y,ref(y).filter(x=>x.kode!==k),'Hapus IKU '+k+' ('+y+')');T('IKU dihapus.'+(c?' '+c+' aktivitas masih menyimpan kode ini dan akan tampil “tidak ada di referensi”.':''))},{delMsg:()=>`<p style="margin:0">IKU <b>${E(k)}</b> dihapus dari Referensi IKU ${E(y)}.${c?` <b>${c}</b> aktivitas sudah terkait IKU ini.`:''}</p>`})}

/* ---------- import (tempel tabel / Excel) ---------- */
const CODE_RE=/(^|[\s\t|])(\d{1,2}[a-z]{1,2}-[A-Za-z]{1,4})(?=$|[\s\t|])/;
function parsePaste(txt,rows){const out=[];let ss=null;
 String(txt||'').split(/\r?\n/).forEach(line=>{const l=line.replace(/ /g,' ').replace(/[​]/g,'').trim();if(!l)return;
  const m=l.match(CODE_RE);
  if(m){const kode=nk(m[2]);let rest=l.slice(l.indexOf(m[2])+m[2].length).split('\t').map(s=>s.trim()).filter(Boolean);
   const nama=(rest.find(s=>/[A-Za-z]{3,}/.test(s))||'').replace(/\s+/g,' ');if(!nama)return;
   const n=ssOf(kode);out.push({kode,nama,ssNo:n,ssNama:(ss&&ss.no===n?ss.nama:'')});return}
  const h=l.match(/^(\d{1,2})\.?\s+([A-Z].{8,})$/);if(h){ss={no:h[1],nama:h[2].replace(/\t.*$/,'').trim()};return}});
 return out}
function parseSheet(aoa){if(!aoa.length)return [];const head=aoa[0].map(h=>String(h||'').toLowerCase());
 const col=(...ks)=>head.findIndex(h=>ks.some(k=>h.includes(k)));
 let ck=col('kode','nomor iku','nomor iki','no iku'),cn=col('nama iku','nama iki','uraian iku','indikator'),cs=col('no ss','no. ss','nomor ss'),csn=col('nama ss','sasaran'),cst=col('strategi');
 let data=aoa.slice(1);if(ck<0||cn<0){data=aoa;ck=-1;cn=-1}
 return data.map(r=>{let kode='',nama='';if(ck>-1){kode=nk(r[ck]);nama=String(r[cn]||'').trim()}else{const i=r.findIndex(c=>CODE_RE.test(' '+String(c||'')+' '));if(i<0)return null;kode=nk(String(r[i]).match(CODE_RE)[2]);nama=String(r.slice(i+1).find(c=>/[A-Za-z]{3,}/.test(String(c||'')))||'').trim()}
  if(!kode||!nama||!/^\d/.test(kode))return null;return {kode,nama:nama.replace(/\s+/g,' '),ssNo:cs>-1&&r[cs]!==''?String(r[cs]).replace(/\D/g,''):ssOf(kode),ssNama:csn>-1?String(r[csn]||'').trim():'',strategi:cst>-1?String(r[cst]||'').trim():''}}).filter(Boolean)}
function importIku(){const y=curYear();
 const body=`<p class="iku-pk-h">Tempel tabel IKU (mis. salin dari halaman <b>Kinerja Utama</b> aplikasi IKU: blok baris tabel lalu Ctrl+C) <b>atau</b> pilih file Excel/CSV berkolom <i>Kode, Nama IKU, No SS, Nama SS, Usulan Strategi</i>. Kode yang sudah ada akan diperbarui namanya; usulan strategi lama tetap dipertahankan bila kolomnya kosong.</p>
  <div class="fgrid"><div class="fld"><label>Tahun referensi</label><input class="inp" type="number" min="2020" max="2100" data-iy value="${E(y)}"></div><div class="fld"><label>Atau file Excel/CSV</label><input class="inp" type="file" accept=".xlsx,.xls,.csv" data-if></div>
  <div class="fld wide"><label>Tempel di sini</label><textarea class="inp" rows="7" data-ip placeholder="1a-CP	Tingkat Keberhasilan Transformasi Kemenkeu&#10;2a-CP	Persentase Keberhasilan Perumusan Program …"></textarea></div></div>
  <label class="iku-repl"><input type="checkbox" data-ir> Ganti seluruh daftar tahun ini dengan hasil import (IKU yang tidak ada di hasil import dihapus)</label>
  <div class="iku-prev" data-iv></div>`;
 let parsed=[];
 const ov=modal('Import Referensi IKU',body,'Simpan hasil import',o=>{if(!parsed.length){T('Belum ada baris IKU yang terbaca.');return false}
  const yy=String(o.querySelector('[data-iy]').value||y).trim(),repl=o.querySelector('[data-ir]').checked,base=repl?[]:ref(yy).slice(),old=ref(yy);
  /* tahun baru: nama SS & usulan strategi diambil dari tahun sebelumnya terdekat bila kodenya/nomor SS-nya sama */
  const prior=years().filter(v=>v<yy).reverse().map(v=>ref(v)).flat();
  parsed.forEach(p=>{const i=base.findIndex(x=>x.kode===p.kode),prev=old.find(x=>x.kode===p.kode)||prior.find(x=>x.kode===p.kode)||{};const ssNama=p.ssNama||prev.ssNama||(base.concat(old,prior).find(x=>x.ssNo===p.ssNo&&x.ssNama)||{}).ssNama||'';
   const row={kode:p.kode,nama:p.nama,ssNo:p.ssNo||prev.ssNo,ssNama,strategi:p.strategi||prev.strategi||''};if(i>-1)base[i]=row;else base.push(row)});
  if(writeRef(yy,base,'Import '+parsed.length+' IKU ('+yy+')')){UI().ikuYear=yy;save();render();T(parsed.length+' IKU tersimpan ke Referensi IKU '+yy+'.')}else return false},{size:'wide'});
 const prev=()=>{const yy=String(ov.querySelector('[data-iy]').value||y),old=ref(yy);ov.querySelector('[data-iv]').innerHTML=parsed.length?`<b>${parsed.length} IKU terbaca</b><table class="lap"><thead><tr><th>Kode</th><th>Nama IKU</th><th>Status</th></tr></thead><tbody>${parsed.map(p=>{const o=old.find(x=>x.kode===p.kode);return `<tr><td>${E(p.kode)}</td><td>${E(p.nama)}</td><td>${!o?'<span class="chip c-info">Baru</span>':o.nama===p.nama?'<span class="chip">Sama</span>':'<span class="chip c-warn">Diperbarui</span>'}</td></tr>`}).join('')}</tbody></table>`:'<small>Belum ada baris IKU yang terbaca. Pastikan tiap baris memuat kode IKU seperti <b>1a-CP</b> diikuti nama IKU.</small>'};
 ov.querySelector('[data-ip]').addEventListener('input',e=>{parsed=parsePaste(e.target.value);prev()});
 ov.querySelector('[data-iy]').addEventListener('input',prev);
 ov.querySelector('[data-if]').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;if(!window.XLSX){T('Pustaka Excel belum termuat.');return}const rd=new FileReader();rd.onload=ev=>{try{const wb=XLSX.read(ev.target.result,{type:'array'});const ws=wb.Sheets[wb.SheetNames[0]];parsed=parseSheet(XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false}));prev()}catch(x){T('File tidak dapat dibaca: '+x.message)}};rd.readAsArrayBuffer(f)});
 prev()}

/* ---------- Ekspor IPR ---------- */
const SKIP_ST=['Dibatalkan','Ditunda','Tidak Dihadiri'];
function tglId(s){const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);if(!m)return '';return +m[3]+' '+['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][+m[2]-1]+' '+m[1]}
function iprData(y){let all=[];try{all=actRows()}catch(e){}const today=new Date().toISOString().slice(0,10);
 const acts=all.filter(x=>yearOfItem(x)===String(y)&&refsOf(x).length&&!SKIP_ST.includes(safeSt(x))&&String(x.tgl||'')<=today);
 const rows=ref(y),known=new Set(rows.map(r=>r.kode));
 const tw=[1,2,3,4].map(t=>{const inTw=acts.filter(x=>twOf(x)===t).sort((a,b)=>String(a.tgl).localeCompare(String(b.tgl)));
  const per={};rows.forEach(r=>{const L=inTw.filter(x=>refsOf(x).includes(r.kode));per[r.kode]={tindakan:L.map((x,i)=>(i+1)+'. '+tglId(x.tgl)+' — '+actTitle(x)+(x.unitP?' ('+x.unitP+')':'')).join('\n'),kendala:L.filter(x=>String(x.kendala||'').trim()).map(x=>'• '+actTitle(x)+': '+String(x.kendala).trim()).join('\n'),n:L.length}});return per});
 const orphan=acts.filter(x=>refsOf(x).some(k=>!known.has(k))).length;return {rows,tw,acts,orphan}}
function safeSt(x){try{return actStBase(x)}catch(e){return x.stat||''}}
function actTitle(x){try{return actName(x)}catch(e){return x.nama||'Kegiatan'}}
let excelJsP=null;
function loadExcelJS(){if(window.ExcelJS)return Promise.resolve(window.ExcelJS);if(excelJsP)return excelJsP;excelJsP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';s.onload=()=>window.ExcelJS?res(window.ExcelJS):rej(new Error('ExcelJS tidak tersedia'));s.onerror=()=>{excelJsP=null;rej(new Error('Gagal memuat ExcelJS'))};document.head.appendChild(s)});return excelJsP}
const HEAD=['No','IKU','Realisasi','Bukti Dukung','Kendala','Usulan Strategi','Tindakan yang dilaksanakan'];
function sheetRows(D,t){const out=[];let last=null;D.rows.forEach(r=>{if(r.ssNo!==last){out.push({ss:true,v:[r.ssNo+'.',r.ssNama||'Sasaran Strategis '+r.ssNo,'','','','','']});last=r.ssNo}const p=D.tw[t-1][r.kode]||{};out.push({ss:false,v:[r.kode,r.nama,'','',p.kendala||'',r.strategi||'',p.tindakan||'']})});return out}
async function buildXlsx(y){const D=iprData(y);
 try{const X=await loadExcelJS();const wb=new X.Workbook();wb.creator='Modul Transformasi';wb.created=new Date();
  const thin={style:'thin',color:{argb:'FF000000'}},border={top:thin,left:thin,bottom:thin,right:thin},font={name:'Barlow',size:14};
  [1,2,3,4].forEach(t=>{const ws=wb.addWorksheet('Capaian TW '+t,{views:[{state:'frozen',ySplit:1,zoomScale:50}]});
   ws.columns=[12.7,64.3,34.4,65,17.4,35.3,93.6].map(w=>({width:w}));
   const h=ws.addRow(HEAD);h.height=37.5;h.eachCell(c=>{c.font=Object.assign({},font,{bold:true,color:{argb:'FFFFFFFF'}});c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1F497D'}};c.alignment={horizontal:'center',vertical:'middle',wrapText:true};c.border=border});
   sheetRows(D,t).forEach(r=>{const row=ws.addRow(r.v);row.eachCell({includeEmpty:true},(c,i)=>{c.font=Object.assign({},font,{bold:r.ss});c.border=border;c.alignment={vertical:'top',horizontal:i===1?'center':'left',wrapText:true};if(r.ss)c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFDE9D9'}}})})});
  return {buf:await wb.xlsx.writeBuffer(),D}}
 catch(e){console.warn('[IPR] ExcelJS tidak tersedia, memakai format sederhana',e);if(!window.XLSX)throw e;
  const wb=XLSX.utils.book_new();[1,2,3,4].forEach(t=>{const ws=XLSX.utils.aoa_to_sheet([HEAD].concat(sheetRows(D,t).map(r=>r.v)));ws['!cols']=[12.7,64.3,34.4,65,17.4,35.3,93.6].map(w=>({wch:w}));XLSX.utils.book_append_sheet(wb,ws,'Capaian TW '+t)});
  return {buf:XLSX.write(wb,{type:'array',bookType:'xlsx'}),D}}}
/* IPR 261126: pratinjau isi sheet sebelum unduh */
function iprPvTw(y){const d=new Date();return String(y)===String(d.getFullYear())?Math.ceil((d.getMonth()+1)/3):1}
function iprPreviewHTML(D,t){const W=[6,20,9,9,16,17,23],tot=100,rows=sheetRows(D,t),n=[1,2,3,4].map(k=>D.acts.filter(x=>twOf(x)===k).length);
 const cell=(r,c,i)=>{const em=!r.ss&&!c&&(i===2||i===3);return '<td'+(em?' class="em"':'')+'>'+(em?'—':E(c))+'</td>'};
 return '<div class="ipr-pv-tabs" role="tablist">'+[1,2,3,4].map(k=>'<button type="button" role="tab" data-pvt="'+k+'" class="'+(k===t?'on':'')+'" aria-selected="'+(k===t)+'">Capaian TW '+k+'<i>'+n[k-1]+'</i></button>').join('')+'</div>'
  +'<div class="ipr-pv-sc"><table><colgroup>'+W.map(w=>'<col style="width:'+(w/tot*100).toFixed(2)+'%">').join('')+'</colgroup><thead><tr>'+HEAD.map(h=>'<th>'+E(h)+'</th>').join('')+'</tr></thead><tbody>'
  +(rows.length?rows.map(r=>'<tr'+(r.ss?' class="ss"':'')+'>'+r.v.map((c,i)=>cell(r,c,i)).join('')+'</tr>').join(''):'<tr><td colspan="7" class="em" style="text-align:center">Referensi IKU masih kosong.</td></tr>')
  +'</tbody></table></div><div class="ipr-pv-ft"><span>Sheet “Capaian TW '+t+'” · '+rows.filter(r=>!r.ss).length+' IKU</span><span>Realisasi &amp; Bukti Dukung dikosongkan (dikelola di aplikasi IKU)</span></div>'}
function iprPvWire(ov,getY,btn){const pv=ov.querySelector('[data-xp]');let t=iprPvTw(getY());
 const draw=()=>{if(pv.hidden)return;pv.innerHTML=iprPreviewHTML(iprData(getY()),t)};
 pv.addEventListener('click',e=>{const b=e.target.closest('[data-pvt]');if(b){t=+b.dataset.pvt;draw()}});
 const toggle=()=>{pv.hidden=!pv.hidden;if(btn)btn.textContent=pv.hidden?'👁 Pratinjau':'✕ Tutup pratinjau';draw();if(!pv.hidden)pv.scrollIntoView({block:'nearest',behavior:'smooth'})};
 return {draw,toggle,year:()=>{t=iprPvTw(getY());draw()}}}
function iprExport(){if(!ROLES_W.includes(role())){T('Ekspor IPR hanya untuk PMO Kemenkeu dan CMO Kemenkeu.');return}
 const ys=years(),y0=String(UI().ikuYear||UI().actTahun||yNow());
 const body=`<div class="fgrid"><div class="fld"><label>Tahun IPR</label><select class="inp" data-xy>${ys.map(v=>`<option${v===y0?' selected':''}>${v}</option>`).join('')}</select></div></div><div class="iku-sum" data-xs></div><div class="ipr-pv" data-xp hidden></div>
  <p class="iku-pk-h">Isi tiap sheet: <b>Kendala</b> dari isian Kendala aktivitas, <b>Usulan Strategi</b> dari Referensi IKU (sama setiap TW), <b>Tindakan yang dilaksanakan</b> dari aktivitas pada TW tersebut yang dikaitkan ke IKU itu. Kolom Realisasi dan Bukti Dukung dibiarkan kosong (dikelola di aplikasi IKU). Kegiatan dibatalkan, ditunda, tidak dihadiri, atau yang tanggalnya belum lewat tidak ikut.</p>`;
 const ov=modal('Ekspor IPR (Excel)',body,'⇩ Unduh Excel',o=>{const y=o.querySelector('[data-xy]').value;const btn=o.querySelector('[data-ok]');btn.disabled=true;btn.textContent='Menyusun…';
  buildXlsx(y).then(({buf})=>{const url=URL.createObjectURL(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const a=document.createElement('a');a.href=url;a.download='IPR_Pusmantap_'+y+'.xlsx';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);try{log('Ekspor IPR','Tahun '+y)}catch(e){}T('Excel IPR '+y+' diunduh.');o.remove()}).catch(e=>{btn.disabled=false;btn.textContent='⇩ Unduh Excel';T('Gagal menyusun Excel IPR: '+e.message)});return false},{size:'wide',extra:'<button type="button" class="btn" data-mx="pv">👁 Pratinjau</button>',onExtra:()=>{PV.toggle();return false}});
 const PV=iprPvWire(ov,()=>ov.querySelector('[data-xy]').value,ov.querySelector('[data-mx="pv"]'));
 const sum=()=>{const y=ov.querySelector('[data-xy]').value,D=iprData(y);const per=[1,2,3,4].map(t=>Object.values(D.tw[t-1]).filter(p=>p.n).length);
  ov.querySelector('[data-xs]').innerHTML=D.rows.length?`<div class="iku-sumg">${[1,2,3,4].map(t=>`<div><small>TW ${['I','II','III','IV'][t-1]}</small><b>${D.acts.filter(x=>twOf(x)===t).length}</b><span>aktivitas · ${per[t-1]}/${D.rows.length} IKU terisi</span></div>`).join('')}</div>${D.orphan?`<p class="iku-warn">⚠ ${D.orphan} aktivitas memakai kode IKU yang tidak ada di Referensi IKU ${E(y)} dan tidak ikut terekspor.</p>`:''}`:`<p class="iku-warn">Referensi IKU ${E(y)} masih kosong. Isi dulu di tab Referensi IKU.</p>`};
 ov.querySelector('[data-xy]').addEventListener('change',()=>{sum();PV.year()});sum()}

ACT.ikuAdd=()=>editIku('');
ACT.ikuEdit=el=>editIku(el.dataset.k);
ACT.ikuDel=el=>delIku(el.dataset.k);
ACT.ikuImport=()=>importIku();
ACT.iprExport=()=>iprExport();
function badge(x){const r=refsOf(x);return r.length?'<span class="iku-mini">'+r.map(k=>'<span title="'+E(label(k,yearOfItem(x))||'IKU '+k)+'">IKU '+E(k)+'</span>').join('')+'</span>':''}
/* Pilihan filter IKU di Daftar Aktivitas: referensi tahun terpilih (atau tahun berjalan) + kode yang sudah dipakai aktivitas. */
function filterOptions(year,rows){const ys=year?[String(year)]:[yNow()],seen=new Map();ys.forEach(y=>ref(y).forEach(r=>seen.set(r.kode,r.kode+' · '+r.nama)));
 (rows||[]).forEach(x=>{if(year&&yearOfItem(x)!==String(year))return;refsOf(x).forEach(k=>{if(!seen.has(k))seen.set(k,k+(label(k,yearOfItem(x))?' · '+label(k,yearOfItem(x)):''))})});
 return [...seen.entries()].sort((a,b)=>a[0].localeCompare(b[0],'id',{numeric:true}))}
window.MTIKU={badge,filterOptions,DOC,SEED,ref,years,writeRef,fieldHTML,readForm,setForm,wireForm,drawChips,page,parsePaste,parseSheet,iprData,buildXlsx,refsOf,canEdit,isPusat};
})();
