/* Form dan ekspor Berita Acara Pusmantap; tidak mencatat TTE otomatis. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const FIELDS=[['nomor','Nomor Berita Acara'],['tanggal','Tanggal'],['tempat','Dibuat di'],['pihak1','Pihak pertama – nama'],['jabatan1','Jabatan pihak pertama'],['pihak2','Pihak kedua – nama'],['jabatan2','Jabatan pihak kedua'],['kegiatan','Pelaksanaan / hasil (satu poin per baris)'],['dasar','Dasar / dokumen acuan'],['mengetahui','Mengetahui – Kepala Pusat'],['tembusan','Tembusan']];
const base=()=>({nomor:'',tanggal:new Date().toISOString().slice(0,10),tempat:'Jakarta',pihak1:'',jabatan1:'',pihak2:'',jabatan2:'',kegiatan:'',dasar:'',mengetahui:'Wawan Juswanto',tembusan:'-'});
async function docx(d){
 await docZip();const TW=467.8,P=(x,o)=>dxP(x,Object.assign({line:14,jc:'both'},o||{})),R=(s,y)=>dxR(s||'[Mohon dilengkapi]',{hl:!!y||!s});
 let b=dxKop(TW)+P(dxR('BERITA ACARA',{b:true}),{jc:'center',before:16,after:2})+P(dxR('NOMOR ')+R(d.nomor||'[@NomorND]',true),{jc:'center',after:18});
 const tanggal=d.tanggal?new Date(d.tanggal+'T12:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'';
 b+=P(dxR('Pada hari ini ')+R(tanggal)+dxR(', kami masing-masing:'),{first:36,before:12});
 b+=P(dxR('1. ')+R(d.pihak1)+dxR(', ')+R(d.jabatan1)+dxR(';'),{left:18});
 b+=P(dxR('2. ')+R(d.pihak2)+dxR(', ')+R(d.jabatan2)+dxR(';'),{left:18});
 b+=P(dxR('telah melaksanakan:'),{first:36,before:15});
 const points=String(d.kegiatan||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 (points.length?points:['[uraian kegiatan dan hasil penutupan]']).forEach((x,i)=>{b+=P(dxR((i+1)+'. ')+R(x,!points.length),{left:18})});
 b+=P(dxR('Berita Acara ini dibuat dengan sesungguhnya berdasarkan ')+R(d.dasar)+dxR('.'),{first:36,before:16});
 b+=P(dxR('Dibuat di ')+R(d.tempat||'Jakarta'),{left:252,before:28});
 b+=P(R(d.jabatan1)+dxTab+R(d.jabatan2),{tabs:[[244,'left']],before:20});
 b+=P(dxR('Ditandatangani secara elektronik',{sz:9,col:'A6A6A6'})+dxTab+dxR('Ditandatangani secara elektronik',{sz:9,col:'A6A6A6'}),{tabs:[[244,'left']],before:54});
 b+=P(R(d.pihak1)+dxTab+R(d.pihak2),{tabs:[[244,'left']]});
 b+=P(dxR('Mengetahui'),{left:252,before:36});
 b+=P(dxR('Kepala Pusat Manajemen Transformasi dan Perubahan'),{left:252});
 b+=P(dxR('Ditandatangani secara elektronik',{sz:9,col:'A6A6A6'}),{left:252,before:50});
 b+=P(R(d.mengetahui||'Wawan Juswanto'),{left:252});
 b+=P(dxR('Tembusan:'),{before:24})+P(R(d.tembusan||'-'),{left:18});
 return dxPack(b,{foot:actFoot()});
}
function open(type,defaults,onSave){
 const d=Object.assign(base(),defaults||{});
 const form='<p class="s">Mengikuti format Template Berita Acara Kementerian Keuangan. Isian kosong diberi stabilo kuning pada Word. Dokumen akhir tetap perlu pengesahan sesuai ketentuan tata naskah dinas.</p><div class="fgrid">'+FIELDS.map(([k,lab])=>'<div class="fld'+(['kegiatan','dasar'].includes(k)?' wide':'')+'"><label>'+esc(lab)+'</label>'+(['kegiatan','dasar'].includes(k)?'<textarea class="inp" data-ba-field="'+k+'" rows="3">'+esc(d[k])+'</textarea>':'<input class="inp" data-ba-field="'+k+'" '+(k==='tanggal'?'type="date"':'')+' value="'+esc(d[k])+'">')+'</div>').join('')+'</div><div class="nl-pv" id="mt-ba-pv" style="margin-top:12px"></div>';
 const read=o=>{const data={};o.querySelectorAll('[data-ba-field]').forEach(x=>data[x.dataset.baField]=x.value.trim());return data};
 const pv=o=>{const x=read(o),v=y=>y?esc(y):'<mark>[Perlu dilengkapi]</mark>';o.querySelector('#mt-ba-pv').innerHTML='<div class="nl-pg"><div class="nl-kop"><b>KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</b><b>BADAN TEKNOLOGI, INFORMASI, DAN INTELIJEN KEUANGAN</b><b>PUSAT MANAJEMEN TRANSFORMASI DAN PERUBAHAN</b></div><h3 style="text-align:center">BERITA ACARA</h3><p style="text-align:center">NOMOR '+v(x.nomor)+'</p><p>Pada hari/tanggal '+v(x.tanggal)+', kami masing-masing:</p><p>1. '+v(x.pihak1)+', '+v(x.jabatan1)+'</p><p>2. '+v(x.pihak2)+', '+v(x.jabatan2)+'</p><p>telah melaksanakan:</p><ol>'+String(x.kegiatan||'').split(/\r?\n/).map(k=>'<li>'+v(k)+'</li>').join('')+'</ol><p>Berita Acara ini dibuat berdasarkan '+v(x.dasar)+'</p><p>Dibuat di '+v(x.tempat)+'</p><p>Mengetahui: '+v(x.mengetahui)+'</p></div>'};
 const ov=modal('Berita Acara '+(type==='PM'?'Penutupan Proyek':'Penutupan Manajemen Perubahan'),form,'Simpan Draft Berita Acara',o=>{onSave(read(o));toast('Draft berita acara tersimpan.')},{size:'hp',extra:'<button type="button" class="btn gold" data-mx="mtba-word">⬇ Unduh Word</button>',onExtra:(key,o)=>{if(key==='mtba-word'){docx(read(o)).then(blob=>mtRptDownloadBlob(blob,'Berita_Acara_Penutupan_'+type+'.docx')).catch(err=>toast('Gagal membuat Word: '+err.message))}return false}});
 ov.addEventListener('input',()=>pv(ov));pv(ov);return ov;
}
window.MT_BA={open,docx};
})();