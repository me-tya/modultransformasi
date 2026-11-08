/* Standardized WBS reference template for the existing PMO import (SheetJS).
   Data is an illustrative 2027 work breakdown, NOT approved baseline. */
(function(){
 'use strict';
 const list=[
  ['Pemutakhiran Grand Design','Kondisi Saat Ini','','Dokumen asesmen kondisi saat ini'],
  ['Pemutakhiran Grand Design','Kondisi yang Diharapkan','','Dokumen target state / grand design'],
  ['Pemutakhiran Grand Design','Peta Jalan Integrated Core System APBN','Penghapusan','Roadmap penghapusan/phasing-out'],
  ['Pemutakhiran Grand Design','Peta Jalan Integrated Core System APBN','Pengembangan','Roadmap pengembangan/integrasi'],
  ['Arsitektur Proses Bisnis','Arsitektur Proses Bisnis Level 3 As Is','','Dokumen APB L3 As-Is'],
  ['Arsitektur Proses Bisnis','Arsitektur Proses Bisnis Level 3 To Be','','Dokumen APB L3 To-Be'],
  ['Arsitektur Proses Bisnis','Arsitektur Proses Bisnis Level Detail As Is','','Dokumen APB Detail As-Is'],
  ['Arsitektur Proses Bisnis','Arsitektur Proses Bisnis Level Detail To Be','','Dokumen APB Detail To-Be'],
  ['Pengembangan Sistem Informasi','Penyusunan User Requirement','','Dokumen kebutuhan pengguna'],
  ['Pengembangan Sistem Informasi','Penelaahan User Requirement','','Berita acara telaah kebutuhan'],
  ['Pengembangan Sistem Informasi','Analisis dan Perancangan Sistem Informasi','','Dokumen analisis dan rancangan'],
  ['Pengembangan Sistem Informasi','Pengembangan Sistem Informasi','','Laporan hasil pengembangan'],
  ['Pengembangan Sistem Informasi','User Acceptance Test (UAT)','','Berita acara UAT'],
  ['Pengembangan Sistem Informasi','Vulnerability Test','','Laporan vulnerability test'],
  ['Pengembangan Sistem Informasi','Hosting','','Berita acara deployment/hosting']
 ];
 const headers=['Code','Lv 1','Lv 2','Lv 3','Lv 4','Lv 5','Lv 6','Start','Finish','Triwulan Finish','UIC Utama','UIC Pendukung','Jenis Dokumen Pendukung','Catatan Template'];
 const param=[
  ['PENGATURAN TEMPLATE WBS','','',''],
  ['Sel kuning/parameter disesuaikan sebelum impor','','',''],
  ['Parameter','Nilai','Keterangan','Contoh'],
  ['Akronim Program','CORE','Prefix kode WBS; kode item tanpa tahun','CORE'],
  ['Tahun Perencanaan',2027,'Menentukan label payung Level 1','2027'],
  ['Nama Program','Integrated Core System APBN','Level 2','Integrated Core System APBN'],
  ['Nama Proyek','Modul FRSW','Level 3','Modul FRSW'],
  ['Nomor Urut Awal',1,'Naikkan agar kode tidak bertabrakan lintas tahun','CORE-001'],
  ['Status','TEMPLATE, BELUM DITETAPKAN','Bukan baseline WBS','Tanggal masih kosong']
 ];
 const refLevels=[
  ['Level','Objek','Definisi','Contoh','Aturan'],
  ['1','Payung Tahunan','Induk seluruh program transformasi satu tahun','Program Transformasi Kemenkeu 2027','Gunakan tahun aktif'],
  ['2','Program','Program transformasi lintas unit','Integrated Core System APBN','Gunakan nama resmi'],
  ['3','Proyek','Proyek/modul turunan program','Modul FRSW','Ikuti daftar proyek'],
  ['4','Workstream','Tahapan/kelompok kerja utama','Arsitektur Proses Bisnis','Gunakan nama baku'],
  ['5','Deliverable','Keluaran/aktivitas terukur','UAT','Satu item per deliverable'],
  ['6','Sub-deliverable','Rincian Level 5 bila diperlukan','Penghapusan/Pengembangan','Opsional pada peta jalan'],
  [],['KATALOG REFERENSI LV 4–6'],
  ['Lv 4 / Workstream','Lv 5 / Deliverable','Lv 6 (opsional)','Contoh Dokumen Pendukung','Sifat'],
  ...list.map(x=>[x[0],x[1],x[2],x[3],'Contoh standar']),
  [],['Kegiatan tambahan seperti manajemen proyek/perubahan, keamanan, migrasi, dan penutupan ditetapkan sesuai ruang lingkup.']
 ];
 const steps=[
  ['PETUNJUK PENGGUNAAN TEMPLATE STANDAR WBS'],['Ini contoh standar, bukan target yang disetujui. Isi tanggal, UIC dan validasi kode sebelum impor.'],[],
  ['Langkah','Aktivitas','Yang perlu dilakukan','Catatan'],
  ['01','Ubah Pengaturan','Edit akronim, tahun, nama program/proyek dan nomor urut awal','Kode otomatis dibuat pada sheet Data'],
  ['02','Ikuti Level','Gunakan Referensi Levelling Lv 1–6','Lv 6 opsional'],
  ['03','Sesuaikan keluaran','Tambah/hapus baris dan isi pekerjaan sebenarnya','Contoh tidak wajib semuanya'],
  ['04','Lengkapi rencana','Isi Start, Finish, UIC Utama dan Pendukung','Tanggal dan UIC awalnya kosong'],
  ['05','Cek duplikasi','Periksa kode yang sudah dipakai WBS tahun sebelumnya','Kode tidak boleh berulang'],
  ['06','Impor di aplikasi','PMO → WBS → Import WBS; pilih sheet Data','Start/Finish wajib diisi agar bobot tidak nol'],[],
  ['KETENTUAN IMPOR'],['Kolom wajib','Code, Start, Finish'],['Hierarki','Lv 2–Lv 10 dibaca sebagai jalur'],['Format kode','[AKRONIM]-[angka] seperti CORE-001'],['Tanggal','yyyy-mm-dd'],['Status','Belum baseline atau disetujui']
 ];
 function add(wb,rows,name,widths){
  const sh=XLSX.utils.aoa_to_sheet(rows);
  sh['!cols']=widths.map(w=>({wch:w}));sh['!rows']=[{hpt:27}];
  if(name==='Data')sh['!autofilter']={ref:'A1:N'+rows.length};
  XLSX.utils.book_append_sheet(wb,sh,name);
  return sh;
 }
 function download(){
  if(!window.XLSX?.utils?.book_new)throw new Error('Pustaka Excel belum termuat.');
  const wb=XLSX.utils.book_new();
  const rows=[headers,...list.map((r,i)=>['CORE-'+String(i+1).padStart(3,'0'),
   'Program Transformasi Kemenkeu 2027','Integrated Core System APBN','Modul FRSW',r[0],r[1],r[2],
   '','','','','',r[3],'Contoh referensi, sesuaikan sebelum impor'])];
  const sh=add(wb,rows,'Data',[14,37,29,20,34,45,24,15,15,15,19,20,44,40]);
  for(let i=2;i<=rows.length;i++){
   sh['A'+i]={t:'s',f:'IF(Pengaturan!$B$4="","",Pengaturan!$B$4&"-"&TEXT(Pengaturan!$B$8+ROW()-2,"000"))',v:'CORE-'+String(i-1).padStart(3,'0')};
   sh['B'+i]={t:'s',f:'"Program Transformasi Kemenkeu "&Pengaturan!$B$5',v:'Program Transformasi Kemenkeu 2027'};
   sh['C'+i]={t:'s',f:'Pengaturan!$B$6',v:'Integrated Core System APBN'};
   sh['D'+i]={t:'s',f:'Pengaturan!$B$7',v:'Modul FRSW'};
   sh['J'+i]={t:'s',f:'IF(I'+i+'="","","TW "&ROUNDUP(MONTH(I'+i+')/3,0))',v:''};
  }
  add(wb,refLevels,'Referensi Levelling',[34,47,26,47,26]);
  add(wb,param,'Pengaturan',[26,35,53,32]);
  add(wb,steps,'Petunjuk',[20,34,67,62]);
  XLSX.writeFile(wb,'Template_Standar_WBS_dengan_Referensi_Levelling.xlsx',{bookType:'xlsx',compression:true});
 }
 window.MT_STD_WBS_TEMPLATE={download,version:'20261109-standard-wbs-levelling-v1'};
})();