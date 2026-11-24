/* Revisi rencana CM sebagai living document (2026-11-25)
   Berlaku setelah paket 5 Perencanaan diajukan/tervalidasi (baseline = Rev 0). Sebelum itu rencana bebas diubah (Draft).
   Tingkat perubahan: Ringan (tercatat di log) · Sedang (alasan wajib, Rev baru, notifikasi CMO Kemenkeu) ·
   Besar (alasan + pengganti; Change Request bila target item WBS bergeser). Revisi tidak menurunkan capaian WBS. */
(function(){
'use strict';
const E=v=>esc(v==null?'':v);
const ic=t=>(typeof IC==='function'?IC(t):'');
const meta=mk=>(S.modMeta[mk]=S.modMeta[mk]||{});
const rv=mk=>{const m=meta(mk);m.rev=m.rev||{n:0,log:[]};m.rev.log=m.rev.log||[];return m.rev};
const pkRen=()=>window.MTPK&&MTPK.PK.find(p=>p.id==='ren');
function locked(mk){try{const p=pkRen();if(!p)return false;return ['Menunggu validasi','Tervalidasi'].includes(MTPK.stOf(mk,p).st)||!!(meta(mk).rev&&meta(mk).rev.base)}catch(e){return false}}
const twOf=v=>{const m=String(v||'').match(/(\d{4})-(\d{2})/);return m?m[1]+'-'+Math.ceil(+m[2]/3):String(v||'')};
const LBL={k_info:'Jenis informasi',k_katKom:'Kategori komunikasi',k_kanal:'Kanal',k_frek:'Frekuensi',k_keg:'Kegiatan',k_out:'Output',k_waktu:'Waktu',k_pic:'UIC/PIC',k_met:'Metode',k_dur:'Durasi',k_lok:'Lokasi',
 p_now:'Kompetensi saat ini',p_need:'Kompetensi dibutuhkan',p_gap:'Gap',p_prog:'Program pelatihan',p_tuj:'Tujuan',p_butuh:'Kebutuhan pendukung',p_met:'Metode',p_waktu:'Waktu',p_uic:'UIC',p_ind:'Indikator keberhasilan'};
const SEL=['k_katKom','k_kanal','k_met'];
function changes(K,d,old){const pre=K?'k_':'p_',out=[];Object.keys(d).forEach(k=>{if(!k.startsWith(pre)||k==='revAlasan')return;const a=old[k]==null?'':String(old[k]),b=d[k]==null?'':String(d[k]);if(a!==b&&!(b===''&&SEL.includes(k)))out.push({k,a,b})});return out}
function wbsFinish(mk,K){try{const w=MTCC.wbsFor(mk,K?'KI':'PI');return w&&w.f?String(w.f).slice(0,7):''}catch(e){return ''}}
function tierOf(K,ch,old,mk){if(!ch.length)return null;let t=0,cr=false;const wk=K?'k_waktu':'p_waktu';
 ch.forEach(c=>{if(c.k===wk&&c.a&&c.b){if(twOf(c.a)!==twOf(c.b))t=Math.max(t,1);const fin=wbsFinish(mk,K);if(fin&&String(c.b).slice(0,7)>fin){t=2;cr=true}}
  if(c.k==='k_katKom'&&c.a==='Must Have'&&c.b!=='Must Have')t=2});
 return {t,cr,label:['Ringan','Sedang','Besar'][t]}}
const fmtCh=ch=>ch.map(c=>(LBL[c.k]||c.k)+(c.k.endsWith('waktu')?': '+(c.a||'—')+' → '+(c.b||'—'):'')).join('; ');
function record(mk,o){const r=rv(mk);if(o.tier!=='Ringan')r.n++;r.log.push(Object.assign({n:r.n,tgl:TODAY,by:ME&&ME.nama||'',seen:o.tier==='Ringan'},o));log('Revisi rencana CM',mk+' · '+o.tier+' · Rev '+r.n+(o.kode?' · '+o.kode:''))}
function baseline(mk){const r=rv(mk);if(r.base)return;const L=implRows(s=>s.modul===mk);r.base=TODAY;r.log.push({n:0,tier:'Baseline',tgl:TODAY,by:ME&&ME.nama||'',ket:L.filter(x=>x.ccT==='K').length+' rencana komunikasi, '+L.filter(x=>x.ccT==='P').length+' rencana pelatihan',seen:true})}

/* Form rencana: kolom alasan muncul setelah baseline */
function cols(K){return [{k:'revAlasan',l:'Alasan perubahan',t:'ta',tbl:false,fshow:s=>!!(s&&locked(s.modul)),hint:'Wajib bila mengubah jadwal lintas triwulan, kategori Must Have, atau melewati target item WBS.',
 info:'Rencana sudah menjadi baseline (paket Perencanaan diajukan/tervalidasi). Ringan: tercatat otomatis. Sedang/Besar: alasan wajib dan menjadi Rev baru; CMO Kemenkeu mendapat notifikasi. Capaian WBS tidak turun.'}]}
function validate(K,d,row){if(!row||!locked(row.modul))return true;const ch=changes(K,d,row),t=tierOf(K,ch,row,row.modul);if(!t){row._rev=null;return true}
 if(t.t>=1&&!String(d.revAlasan||'').trim()){toast('Perubahan tingkat '+t.label+': isi alasan perubahan.');return false}
 row._rev={tier:t.label,cr:t.cr,ch:fmtCh(ch),alasan:String(d.revAlasan||'').trim()};return true}
function onSave(K,row){const r=row._rev;delete row._rev;delete row.revAlasan;if(!r)return;
 record(row.modul,{tier:r.tier,kode:MTCC.full(row.modul,K?row.ck:row.cp),ch:r.ch,alasan:r.alasan,cr:r.cr});
 if(r.cr)setTimeout(()=>toast('Jadwal baru melewati target item WBS Implementasi: ajukan Change Request di Project Management.'),400)}

/* Centang/lepas Kom./Pel. setelah baseline = tambah/batal rencana */
function guardToggle(s,f,checked,el){if(!s||!locked(s.modul))return false;if(el)el.checked=!checked;
 const K=f==='kom',mh=K&&s.k_katKom==='Must Have'&&!checked,tier=mh?'Besar':'Sedang',kode=MTCC.full(s.modul,K?s.ck:s.cp)||s.rin;
 const body='<p style="margin:0 0 8px">'+(checked?'Menambah rencana '+(K?'komunikasi':'pelatihan')+' untuk <b>'+E(s.rin)+'</b> setelah baseline.':'Membatalkan rencana <b>'+E(kode)+'</b> ('+E(s.rin)+').')+' Tingkat perubahan: '+chipSt(tier)+'</p>'+
 '<div class="fld"><label for="rvA">Alasan perubahan *</label><textarea id="rvA"></textarea></div>'+(mh?'<div class="fld" style="margin-top:8px"><label for="rvP">Rencana pengganti * '+ic('Pembatalan rencana Must Have wajib menyebut pengganti, mis. digabung ke K01 atau rencana baru.')+'</label><input id="rvP"></div>':'');
 modal('Perubahan rencana setelah baseline',body,'Simpan perubahan',ov=>{const a=(ov.querySelector('#rvA').value||'').trim(),pg=mh?(ov.querySelector('#rvP').value||'').trim():'';
  if(!a||(mh&&!pg)){toast(mh?'Isi alasan dan rencana pengganti.':'Isi alasan perubahan.');return false}
  s[f]=checked;record(s.modul,{tier,kode,ch:checked?'Rencana ditambah':'Rencana dibatalkan',alasan:a,pengganti:pg});save();render();toast('Perubahan dicatat sebagai Rev '+rv(s.modul).n+'.')},{size:'sm'});return true}
const _unc=ACT.uncheck;ACT.uncheck=el=>{const s=S.sh.find(x=>x.id===el.dataset.i);if(guardToggle(s,el.dataset.f,false,null))return;return _unc(el)};

/* Reviu TW → revisi */
function fromReviu(x){if(!x||x.revDone||x.st!=='Dikirim ke CMO Kemenkeu'||!String(x.kep||'').trim()||!locked(x.modul))return;record(x.modul,{tier:'Reviu TW',kode:x.per,ch:x.kep,alasan:x.kes||'',seen:false});x.revDone=true}

/* Tombol & riwayat */
function tools(mk){if(!mk)return '';const r=rv(mk),lk=locked(mk);return '<span class="rv-st">'+(lk?chipSt('Baseline')+' <b>Rev '+r.n+'</b>':'<span class="chip c-gray">Draft</span>')+ic(lk?'Rencana sudah menjadi baseline. Perubahan dicatat sebagai revisi (living document) tanpa menurunkan capaian WBS.':'Sebelum paket Perencanaan diajukan, rencana bebas diubah tanpa riwayat revisi.')+'</span>'+(r.log.length?'<button class="btn sm" data-act="rvLog" data-mk="'+E(mk)+'">Riwayat revisi</button>':'')}
ACT.rvLog=el=>{const mk=el.dataset.mk,r=rv(mk),boss=ME&&['SA','CMOK'].includes(ME.role);
 const rows=r.log.slice().reverse().map(x=>'<tr><td><b>'+(x.tier==='Baseline'?'Rev 0':'Rev '+x.n)+'</b></td><td>'+fmtD(x.tgl)+'</td><td>'+chipSt(x.tier)+(x.cr?' <span class="chip c-bad">perlu CR</span>':'')+'</td><td>'+E(x.kode||'')+'</td><td>'+E(x.ch||x.ket||'')+(x.pengganti?'<span class="sm">Pengganti: '+E(x.pengganti)+'</span>':'')+'</td><td>'+E(x.alasan||'')+'</td><td>'+E(x.by||'')+'</td></tr>').join('');
 if(boss){r.log.forEach(x=>x.seen=true);save()}
 modal('Riwayat revisi rencana · '+esc(mk),'<div class="tscroll"><table class="tcard"><thead><tr><th>Rev</th><th>Tanggal</th><th>Tingkat</th><th>Kode</th><th>Perubahan</th><th>Alasan</th><th>Oleh</th></tr></thead><tbody>'+rows+'</tbody></table></div>',null,null,{size:'wide',cancel:'Tutup'})};
Object.assign(CHIP,{'Baseline':'ok','Ringan':'gray','Sedang':'warn','Besar':'bad','Reviu TW':'info'});
function tasks(out){try{if(!ME||!['SA','CMOK'].includes(ME.role))return;let n=0,mk='';Object.entries(S.modMeta||{}).forEach(([k,m])=>{const c=((m&&m.rev&&m.rev.log)||[]).filter(x=>!x.seen&&x.tier!=='Ringan').length;if(c){n+=c;mk=mk||k}});
 if(n)out.push(['CMO',n+' revisi rencana CM perlu direviu',mk?'modul-'+mk+'-t-rencana':'cmo-rencana','Reviu'])}catch(e){}}

window.MTRV={locked,cols,validate,onSave,guardToggle,fromReviu,tools,tasks,baseline,record,tierOf,changes};
})();
