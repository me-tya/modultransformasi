/* Laporan Kegiatan & Laporan Monev Aktivitas — mesin laporan DashboardCM (Activity Report Generator v2).
   Kode bagian "MESIN DASHBOARDCM" disalin apa adanya dari me-tya/DashboardCM (index.html) supaya pratinjau
   dan hasil Word SAMA PERSIS. Yang ditambahkan di sini hanya:
   1) shim lingkungan DashboardCM (state, toast, akses berkas, penomoran),
   2) adapter data aktivitas Modul Transformasi (S.oneonone) → bentuk agenda DashboardCM,
   3) pengikatan tombol di menu Aktivitas (Generate Laporan per kegiatan & Laporan dari filter).
   Untuk memperbarui: salin ulang fungsi cmRpt* dari DashboardCM, lalu jalankan tests/activity-report-dcm-engine.test.cjs. */
(function(){
if(window.MT_DCM_REPORT)return;
/* ===================== SHIM LINGKUNGAN DASHBOARDCM ===================== */
let currentLang='id';
const state={agendas:[],filters:{},activeTab:'table',sortKey:'tglMulai',sortDir:'asc'};
const toast=(m)=>{try{(window.toast||(()=>{}))(String(m||''))}catch(e){}};
const isLoggedIn=()=>{try{return typeof ME!=='undefined'&&!!ME}catch(e){return false}};
const getCurrentUserEmail=()=>{try{return (ME&&ME.email)||''}catch(e){return ''}};
const cmCanMutate=()=>{try{return typeof actCanEdit==='function'?!!actCanEdit():true}catch(e){return true}};
const cmWaSend=txt=>{try{window.open('https://wa.me/?text='+encodeURIComponent(String(txt||'')),'_blank','noopener')}catch(e){}};
const openDetail=id=>{try{const x=(S.oneonone||[]).find(z=>String(z.id)===String(id));if(x&&typeof editOneOnOne==='function')editOneOnOne(x.id)}catch(e){}};
/* Penomoran dokumen: disimpan pada dokumen konfigurasi 'cfg-docnum' (kind:'cfg') di koleksi oneonone,
   ikut sinkron Firestore dan boleh ditulis peran yang mengelola Aktivitas. Terpisah dari penomoran DashboardCM. */
function docnumDoc(create){const arr=S.oneonone||(S.oneonone=[]);let d=arr.find(x=>x&&x.id==='cfg-docnum');if(!d&&create){d={id:'cfg-docnum',kind:'cfg',tahun:0,tw:0,kv:{}};arr.push(d)}return d}
async function firestoreGet(key){try{const d=docnumDoc(false);return (d&&d.kv&&d.kv[key])||null}catch(e){return null}}
async function firestoreSet(key,val){try{const d=docnumDoc(true);d.kv=Object.assign({},d.kv||{},{[key]:val});if(typeof save==='function')save()}catch(e){}}
/* Registry lampiran: refId → item lampiran Modul Transformasi (link/data/berkas Firestore). */
const MTREF=new Map();
const blobToDataUrl=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(b)});
async function mtRefBlob(m){
 if(!m)return null;
 if(m.t==='d'&&m.data){const r=await fetch(m.data);return await r.blob()}
 if(m.t==='f'&&typeof fileLoad==='function')return await fileLoad(m);
 if(m.t==='l'&&m.link){try{const r=await fetch(m.link,{mode:'cors'});if(r.ok)return await r.blob()}catch(e){}}
 return null;
}
async function fetchDocImageDataUrl(refId){
 const m=MTREF.get(refId);if(!m)return null;
 if(m.t==='d'&&/^data:image\//i.test(m.data||''))return m.data;
 try{const b=await mtRefBlob(m);if(!b)return null;const u=await blobToDataUrl(b);return /^data:image\//i.test(u)?u:(/^data:application\/octet-stream/i.test(u)?u.replace(/^data:application\/octet-stream/i,'data:image/jpeg'):null)}catch(e){return null}
}
async function cmActivityNotulaLoadChunks(meta){
 const m=meta&&MTREF.get(meta.id);if(!m)return [];
 try{const b=await mtRefBlob(m);if(!b||typeof docText!=='function')return [];
  const f=new File([b],m.nama||'notula',{type:b.type||m.type||''});const parts=await docText(f);
  const text=Array.isArray(parts)?parts.join('\n'):String(parts||'');return text?[{text}]:[]}catch(e){return []}
}
let MT_FILTERED=[];
const getFiltered=()=>MT_FILTERED.slice();
/* ===================== MESIN DASHBOARDCM (disalin apa adanya) ===================== */
const I18N = {
  en: {
    tabTasks: 'Assignments', tabOverview: 'Overview', tabActivity: 'Agenda', tabCalendar: 'Calendar', tabKanban: 'Workboard',
    tabMatrix: 'Matrix', tabKnowledge: 'Knowledge', tabSurvey: 'CRA', tabSquadTeam: 'Squad Team', tabResource: 'CM Team', tabPriority: 'Priority',
    reminderCenter: 'Notification Center', reminderTitle: 'Reminder / Notification Center',
    addActivity: 'Add Activity', editActivity: 'Edit Activity', addNewActivity: 'Add New Activity',
    activityDetails: 'Activity Details',
    signInGoogle: 'Sign in with Google', signOut: 'Sign out',
    importExcel: 'Import Excel', exportExcel: 'Export Excel',
    backupAll: 'Backup All', restoreAll: 'Restore All',
    backupAllTitle: 'Download one file with Activity, Audit Log, Knowledge, Squad Team, and Reminder data',
    restoreAllTitle: 'Restore Activity, Knowledge, Squad Team, and Reminder data from a backup file',
    lastUpdatedLabel: 'Last updated:', lastImportLabel: 'Last import:',
    lastUpdatedTitle: 'Last time any data was saved in this browser',
    lastImportTitle: 'Last time data was imported from the shared Excel file',
    searchPlaceholder: 'Search activity, PIC, program, category, notes/meeting notes...', clearSearchTitle: 'Clear search',
    filtersLabel: 'Filters', resetLabel: 'Reset', dateSepTo: 'to',
    allCategories: 'All Categories', allPrograms: 'All Programs', allUnits: 'All Requesting Units',
    allLayanan: 'All (Service & Non-Service)', allStatus: 'All Status', allPic: 'All PIC',
    allYears: 'All Years', allUnitTypes: 'All (Internal & External)',
    updatedByLabel: 'Updated by', updatedByUntracked: 'No edit history yet (sign in to track who updates this)',
    storageSaving: 'Saving...', storageSaved: 'Saved', storageSynced: 'Synced', storageSyncFailed: 'Sync failed',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', close: 'Close',
    kpiTotalActivities: 'Total Activities', kpiAllPeriods: 'all periods',
    kpiThisMonth: 'This Month', kpiCompleted: 'Completed', kpiOfTotal: '% of total',
    kpiScheduledOngoing: 'Scheduled', kpiNeedsFollowUp: 'needs follow-up',
    kpiService: 'Service', kpiOfTotalActivities: '% of total activities',
    kpiActiveUnits: 'Requesting Units', kpiDistinctUnits: 'distinct units submitting',
    kpiTopCategory: 'T-House Program', kpiActivitiesSuffix: 'activities',
    chartTrendTitle: 'Activity Trend per Month (Service vs Non-Service)',
    chartStatusTitle: 'Status Distribution', chartLayananTitle: 'Service vs Non-Service',
    chartKategoriTitle: 'Activities per Category (T-House)', chartPicTitle: 'PIC Workload (Top 10)',
    chartUnitTitle: 'Activities per Requesting Unit',
    axisMonth: 'Month', axisActivities: 'Number of Activities', unitActivitiesLower: 'activities',
    axisCategory: 'Category', axisPic: 'PIC', axisRequestingUnit: 'Requesting Unit',
    langSwitchTitle: 'Switch UI language',
    paginationShowing: 'Showing', paginationOf: 'of',
    fieldActivityName: 'Activity Name', fieldStartDate: 'Start Date', fieldEndDate: 'End Date',
    fieldTime: 'Time', fieldService: 'Service', fieldRequestingUnit: 'Requesting Unit',
    fieldCategory: 'Category', fieldRelatedProgram: 'Related Program', fieldStatus: 'Status',
    fieldCmPic: 'CM Team PIC', fieldLocationChannel: 'Location/Channel', fieldSpeakerUnit: "Speaker's Home Unit",
    fieldTargetParticipants: 'Target Participants', fieldInvitation: 'Invitation', fieldAssignmentLetter: 'Assignment Letter',
    fieldObjectiveOutput: 'Objective / Output', fieldMaterials: 'Materials', fieldNotes: 'Notes',
    fieldDocumentation: 'Documentation',
    docAddImages: '+ Add Files', docUploading: 'Uploading...', docNoFiles: 'No files yet',
    docUploadHint: 'Images, PDF, Office files, video, audio, ZIP, and others · max 600 KB per local file · multiple files allowed; use a SharePoint/Drive link for larger files',
    docRemoveTitle: 'Remove image', docOpenTitle: 'Open full image',
    toastDocUploaded: 'Image uploaded', toastDocRemoved: 'Image removed',
    toastDocUploadFailed: 'Failed to upload file', toastDocTooLarge: 'File too large (max 600 KB); use a SharePoint/Drive link',
    toastDocInvalidType: 'Unsupported file type — use PNG, JPG, JPEG, WEBP, or GIF',
    toastDocLoginRequired: 'Sign in with Google first to upload documentation images',
    fromKnowledge: 'From Knowledge', saveChanges: 'Save Changes',
    toastMaterialsInserted: 'Materials link inserted from Knowledge',
    toastInvitationInserted: 'Invitation link inserted from Knowledge',
    toastAssignmentInserted: 'Assignment letter link inserted from Knowledge',
    addNewCategoryOption: '+ Add new category...', newCategoryPlaceholder: 'Type new category name, then press Tab or click elsewhere',
    toastCategoryAdded: 'New category added to the list',
    manageCategories: 'Manage category list', manageCategoriesShort: 'Manage',
    manageUnits: 'Manage unit list',
    catManageTitle: 'Manage Categories',
    catManageSubtitle: 'Rename or delete categories below — renaming updates every Activity that uses it, so nothing gets orphaned.',
    catUsedBySuffix: 'activities', catRenameTitle: 'Rename', catDeleteTitle: 'Delete',
    catMoveUp: 'Move up', catMoveDown: 'Move down',
    catReassignPrefix: 'This category is used by', catReassignSuffix: '. Choose a replacement category before deleting:',
    catReassignPlaceholder: '-- choose replacement --', catReassignConfirm: 'Move & Delete',
    catDeleteSimpleConfirm: 'Delete this category from the list?',
    catAddNewBtn: '+ Add category', catAddNewPlaceholder: 'New category name',
    toastCategoryRenamed: 'Category renamed — all matching activities updated',
    toastCategoryDeleted: 'Category deleted', toastCategoryReassigned: 'Activities moved and category deleted',
    manageUnitsTitle: 'Manage Units',
    manageUnitsSubtitle: 'Rename, delete, or tag units as Internal (official Kemenkeu UE I) or External — renaming updates every Activity that uses it, in both Requesting Unit and Speaker\'s Home Unit.',
    unitTypeInternal: 'Internal', unitTypeExternal: 'External',
    toastUnitRenamed: 'Unit renamed — all matching activities updated',
    addNewUnitOption: '+ Add new unit...', newUnitPlaceholder: 'Type new unit name, then press Tab or click elsewhere',
    selectUnitPlaceholder: '-- Select unit --', selectCategoryPlaceholder: '-- Select category --',
    unitAddNewPlaceholder: 'New unit name', toastUnitAdded: 'New unit added to the list',
    detailLabelDate: 'Date', edit: 'Edit', serviceBadgeCheck: '\u2714 Service', nonServiceBadge: 'Non-Service',
    confirmDeleteTitle: 'Delete Activity?', confirmDeletePrefix: 'You are about to delete',
    confirmDeleteSuffix: 'This action cannot be undone.', yesDelete: 'Yes, Delete',
    toastActivityDeleted: 'Activity deleted successfully',
    squadTeamDirectory: 'Squad Team Directory', contactSearchPlaceholder: 'Search name, NIP, position, unit...',
    allTeams: 'All Teams', allRoles: 'All Roles', allUnitsShort: 'All Units',
    authSignInFailedPrefix: 'Sign-in failed: ',
    authDomainNotAuthorized: 'This domain is not authorized yet in Firebase Console (Authentication → Settings → Authorized domains).',
    toastActivityUpdated: 'Activity data updated by another team member',
    toastKnowledgeUpdated: 'Knowledge data updated by another team member',
    toastSquadTeamUpdated: 'Squad Team data updated by another team member',
    toastConnected: 'Connected — data now syncs automatically with the team',
    toastSyncFailed: 'Signed in, but data sync failed',
    toastSignedOut: 'Signed out — data stays saved in this browser',
  },
  id: {
    tabTasks: 'Penugasan', tabOverview: 'Ringkasan', tabActivity: 'Agenda', tabCalendar: 'Kalender', tabKanban: 'Workboard',
    tabMatrix: 'Matriks', tabKnowledge: 'Pengetahuan', tabSurvey: 'CRA', tabSquadTeam: 'Tim Squad', tabResource: 'Tim CM', tabPriority: 'Prioritas',
    reminderCenter: 'Pusat Notifikasi', reminderTitle: 'Reminder / Pusat Notifikasi',
    addActivity: 'Tambah Activity', editActivity: 'Edit Activity', addNewActivity: 'Tambah Activity Baru',
    activityDetails: 'Detail Activity',
    signInGoogle: 'Masuk dengan Google', signOut: 'Keluar',
    importExcel: 'Impor Excel', exportExcel: 'Ekspor Excel',
    backupAll: 'Backup Semua', restoreAll: 'Restore Semua',
    backupAllTitle: 'Unduh satu file berisi data Activity, Audit Log, Knowledge, Squad Team, dan Reminder',
    restoreAllTitle: 'Pulihkan data Activity, Knowledge, Squad Team, dan Reminder dari file backup',
    lastUpdatedLabel: 'Terakhir diperbarui:', lastImportLabel: 'Impor terakhir:',
    lastUpdatedTitle: 'Waktu terakhir data disimpan di browser ini',
    lastImportTitle: 'Waktu terakhir data diimpor dari file Excel bersama',
    searchPlaceholder: 'Cari activity, PIC, program, kategori, catatan/notulen...', clearSearchTitle: 'Hapus pencarian',
    filtersLabel: 'Filter', resetLabel: 'Reset', dateSepTo: 's/d',
    allCategories: 'Semua Kategori', allPrograms: 'Semua Program', allUnits: 'Semua Unit Pengusul',
    allLayanan: 'Semua (Layanan & Non-Layanan)', allStatus: 'Semua Status', allPic: 'Semua PIC',
    allYears: 'Semua Tahun', allUnitTypes: 'Semua (Internal & Eksternal)',
    updatedByLabel: 'Diperbarui oleh', updatedByUntracked: 'Belum ada riwayat edit (login dulu supaya tercatat siapa yang update)',
    storageSaving: 'Menyimpan...', storageSaved: 'Tersimpan', storageSynced: 'Tersinkron', storageSyncFailed: 'Sinkron gagal',
    save: 'Simpan', cancel: 'Batal', delete: 'Hapus', close: 'Tutup',
    kpiTotalActivities: 'Total Activity', kpiAllPeriods: 'semua periode',
    kpiThisMonth: 'Bulan Ini', kpiCompleted: 'Selesai', kpiOfTotal: '% dari total',
    kpiScheduledOngoing: 'Terjadwal', kpiNeedsFollowUp: 'perlu tindak lanjut',
    kpiService: 'Layanan', kpiOfTotalActivities: '% dari total activity',
    kpiActiveUnits: 'Unit Pengusul', kpiDistinctUnits: 'unit berbeda yang mengajukan',
    kpiTopCategory: 'Program T-House', kpiActivitiesSuffix: 'activity',
    chartTrendTitle: 'Tren Activity per Bulan (Layanan vs Non-Layanan)',
    chartStatusTitle: 'Distribusi Status', chartLayananTitle: 'Layanan vs Non-Layanan',
    chartKategoriTitle: 'Activity per Kategori (T-House)', chartPicTitle: 'Beban Kerja PIC (Top 10)',
    chartUnitTitle: 'Activity per Unit Pengusul',
    axisMonth: 'Bulan', axisActivities: 'Jumlah Activity', unitActivitiesLower: 'activity',
    axisCategory: 'Kategori', axisPic: 'PIC', axisRequestingUnit: 'Unit Pengusul',
    langSwitchTitle: 'Ganti bahasa tampilan',
    authSignInFailedPrefix: 'Gagal masuk: ',
    authDomainNotAuthorized: 'Domain ini belum diizinkan di Firebase Console (Authentication → Settings → Authorized domains).',
    paginationShowing: 'Menampilkan', paginationOf: 'dari',
    fieldActivityName: 'Nama Activity', fieldStartDate: 'Tanggal Mulai', fieldEndDate: 'Tanggal Selesai',
    fieldTime: 'Waktu', fieldService: 'Layanan', fieldRequestingUnit: 'Unit Pengusul',
    fieldCategory: 'Kategori', fieldRelatedProgram: 'Program Terkait', fieldStatus: 'Status',
    fieldCmPic: 'PIC Tim CM', fieldLocationChannel: 'Lokasi/Channel', fieldSpeakerUnit: 'Unit Asal Narasumber',
    fieldTargetParticipants: 'Target Peserta', fieldInvitation: 'Undangan', fieldAssignmentLetter: 'Surat Tugas',
    fieldObjectiveOutput: 'Tujuan / Output', fieldMaterials: 'Materi', fieldNotes: 'Catatan',
    fieldDocumentation: 'Dokumentasi',
    docAddImages: '+ Tambah File', docUploading: 'Mengunggah...', docNoFiles: 'Belum ada file',
    docUploadHint: 'Gambar, PDF, file Office, video, audio, ZIP, dan lainnya · maks 600 KB per file lokal · bisa pilih beberapa; gunakan link SharePoint/Drive untuk file besar',
    docRemoveTitle: 'Hapus gambar', docOpenTitle: 'Buka gambar penuh',
    toastDocUploaded: 'Gambar berhasil diunggah', toastDocRemoved: 'Gambar dihapus',
    toastDocUploadFailed: 'Gagal mengunggah file', toastDocTooLarge: 'File terlalu besar (maks 600 KB); gunakan link SharePoint/Drive',
    toastDocInvalidType: 'Tipe file tidak didukung — gunakan PNG, JPG, JPEG, WEBP, atau GIF',
    toastDocLoginRequired: 'Login dengan Google dulu untuk mengunggah gambar dokumentasi',
    fromKnowledge: 'Dari Knowledge', saveChanges: 'Simpan Perubahan',
    toastMaterialsInserted: 'Link materi dimasukkan dari Knowledge',
    toastInvitationInserted: 'Link undangan dimasukkan dari Knowledge',
    toastAssignmentInserted: 'Link surat tugas dimasukkan dari Knowledge',
    addNewCategoryOption: '+ Tambah kategori baru...', newCategoryPlaceholder: 'Ketik nama kategori baru, lalu tekan Tab atau klik di luar',
    toastCategoryAdded: 'Kategori baru ditambahkan ke daftar',
    manageCategories: 'Kelola daftar kategori', manageCategoriesShort: 'Kelola',
    manageUnits: 'Kelola daftar unit',
    catManageTitle: 'Kelola Kategori',
    catManageSubtitle: 'Ganti nama atau hapus kategori di bawah — mengganti nama akan otomatis memperbarui semua Activity yang memakainya.',
    catUsedBySuffix: 'activity', catRenameTitle: 'Ganti nama', catDeleteTitle: 'Hapus',
    catMoveUp: 'Naikkan', catMoveDown: 'Turunkan',
    catReassignPrefix: 'Kategori ini dipakai oleh', catReassignSuffix: '. Pilih kategori pengganti sebelum menghapus:',
    catReassignPlaceholder: '-- pilih pengganti --', catReassignConfirm: 'Pindahkan & Hapus',
    catDeleteSimpleConfirm: 'Hapus kategori ini dari daftar?',
    catAddNewBtn: '+ Tambah kategori', catAddNewPlaceholder: 'Nama kategori baru',
    toastCategoryRenamed: 'Kategori diganti nama — semua activity terkait diperbarui',
    toastCategoryDeleted: 'Kategori dihapus', toastCategoryReassigned: 'Activity dipindahkan dan kategori dihapus',
    manageUnitsTitle: 'Kelola Unit',
    manageUnitsSubtitle: 'Ganti nama, hapus, atau tandai unit sebagai Internal (UE I resmi Kemenkeu) atau Eksternal — mengganti nama otomatis memperbarui semua Activity yang memakainya, baik di Requesting Unit maupun Speaker\'s Home Unit.',
    unitTypeInternal: 'Internal', unitTypeExternal: 'Eksternal',
    toastUnitRenamed: 'Unit diganti nama — semua activity terkait diperbarui',
    addNewUnitOption: '+ Tambah unit baru...', newUnitPlaceholder: 'Ketik nama unit baru, lalu tekan Tab atau klik di luar',
    selectUnitPlaceholder: '-- Pilih unit --', selectCategoryPlaceholder: '-- Pilih kategori --',
    unitAddNewPlaceholder: 'Nama unit baru', toastUnitAdded: 'Unit baru ditambahkan ke daftar',
    detailLabelDate: 'Tanggal', edit: 'Edit', serviceBadgeCheck: '\u2714 Layanan', nonServiceBadge: 'Non-Layanan',
    confirmDeleteTitle: 'Hapus Activity?', confirmDeletePrefix: 'Kamu akan menghapus',
    confirmDeleteSuffix: 'Tindakan ini tidak dapat dibatalkan.', yesDelete: 'Ya, Hapus',
    toastActivityDeleted: 'Activity berhasil dihapus',
    squadTeamDirectory: 'Direktori Tim Squad', contactSearchPlaceholder: 'Cari nama, NIP, jabatan, unit...',
    allTeams: 'Semua Tim', allRoles: 'Semua Peran', allUnitsShort: 'Semua Unit',
    toastActivityUpdated: 'Data Activity diperbarui oleh anggota tim lain',
    toastKnowledgeUpdated: 'Data Knowledge diperbarui oleh anggota tim lain',
    toastSquadTeamUpdated: 'Data Squad Team diperbarui oleh anggota tim lain',
    toastConnected: 'Tersambung — data kini tersinkron otomatis dengan tim',
    toastSyncFailed: 'Berhasil masuk, tapi sinkronisasi data gagal',
    toastSignedOut: 'Berhasil keluar — data tetap tersimpan di browser ini',
  },
};
var CM_LBL_ACTIVE=new Map();
function t(key) {
  const r=(I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
  if(!CM_LBL_ACTIVE.size)return r;const o=CM_LBL_ACTIVE.get(r)||CM_LBL_ACTIVE.get(I18N.en[key]);return o?cmLblPick(o,r):r;
}
function uiText(en,id){ const r=currentLang === 'id' ? id : en; if(!CM_LBL_ACTIVE.size)return r; const o=CM_LBL_ACTIVE.get(en)||CM_LBL_ACTIVE.get(id); return o?cmLblPick(o,r):r; }
function cmLblPick(o,fallback,lang){const l=lang||currentLang;const v=String((l==='id'?o.id:o.en)||'').trim();return v||fallback;}
function activityStatusLabel(status) {
  const labels={
    Scheduled:uiText('Scheduled','Terjadwal'), Pending:uiText('Awaiting Confirmation','Menunggu Konfirmasi'),
    Ongoing:uiText('Ongoing','Sedang Berlangsung'), Completed:uiText('Completed','Selesai'),
    Postponed:uiText('Postponed','Ditunda'), Cancelled:uiText('Cancelled','Dibatalkan'), 'Not Attended':uiText('Not Attended','Tidak Dihadiri')
  };
  return labels[status]||status||'-';
}
function fmtRupiah(n) {
  n = Number(n) || 0;
  return 'Rp ' + n.toLocaleString('id-ID');
}
function fmtDate(d, format) {
  if (!d) return '-';
  const dj = dayjs(d);
  if (!dj.isValid()) return d;
  return dj.format(format || 'DD MMM YYYY');
}
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function splitNames(str) {
  if (!str) return [];
  return String(str).split(/\s*[,;\n]\s*|\s+dan\s+|\s+&\s+/gi).map(s => s.trim()).filter(Boolean);
}
const CM_PIC_ROSTER=['Wawan Juswanto','Arifudin Miftakhul Huda','Atitya Pritasari','Sarah Khairina','Dessy Monica Wirsal','Dina Septiani','Ainurrisya Zafirah','Zalik Fakri','Alfarisi Muslim','Kurniawan Jabar Malik','Muhammad Nailun Najih'];
const CM_PIC_ALIASES={'tya':'Atitya Pritasari','atitya':'Atitya Pritasari','sarah':'Sarah Khairina','dessy':'Dessy Monica Wirsal','desy':'Dessy Monica Wirsal','arifudin':'Arifudin Miftakhul Huda','fira':'Ainurrisya Zafirah','dina':'Dina Septiani','zalik':'Zalik Fakri','alfarisi':'Alfarisi Muslim','malik':'Kurniawan Jabar Malik','aji':'Muhammad Nailun Najih','wawan':'Wawan Juswanto','pak wawan':'Wawan Juswanto'};
function cmPicCanon(name){
  const raw=String(name||'').trim().replace(/\s+/g,' ');if(!raw)return '';
  const low=raw.toLowerCase(),bare=low.replace(/^(pak|bapak|bu|ibu|mas|mbak)\s+/,'');
  let rn={};try{rn=cmPicPrefs().renames||{};}catch(e){}
  if(rn[low]||rn[bare])return rn[low]||rn[bare];
  const hit=CM_PIC_ALIASES[low]||CM_PIC_ALIASES[bare];if(hit)return hit;
  const full=CM_PIC_ROSTER.find(n=>n.toLowerCase()===low||n.toLowerCase()===bare);return full||raw;
}
function cmPicList(str){const out=[],add=c=>{if(c&&!out.some(x=>x.toLowerCase()===c.toLowerCase()))out.push(c);};splitNames(str).forEach(n=>{const c=cmPicCanon(n);if(c!==n.trim().replace(/\s+/g,' ')||CM_PIC_ROSTER.includes(c)){add(c);return;}const words=n.trim().split(/\s+/);if(words.length>1&&words.every(w=>CM_PIC_ALIASES[w.toLowerCase()])){words.forEach(w=>add(CM_PIC_ALIASES[w.toLowerCase()]));return;}add(c);});return out;}
const CM_PIC_PREFS_KEY='pusmantap-cm-pic-prefs-v1';
const CM_PUSMANTAP_STAFF_SEED_ID='pusmantap-staff-2026-10';
const CM_PUSMANTAP_STAFF=['Wawan Juswanto','Arifudin Miftakhul Huda','Zalik Fakri','Sasmika Kusuma','Alfarisi Muslim','Atitya Pritasari','Andos Heriyanto Hutahaean','Winny Irmarooke','Rahmatullah Priyo Kusuma','Meida Embrianto','Astika Trisnawati Suprapto','Dhanang Jaka Purwandaru','Dina Septiani','Sarah Khairina','Daryan Ciptadi','Kurniawan Jabar Malik','W Friendica M Aprilawan Putera','Anggi Maulana Ciptadi','Selly Galvani'];
let cmPicPrefsCache=null,cmPicPrefsRemoteChecked=false;
function cmPicPrefsNormalize(p){
  p=p&&typeof p==='object'?p:{};
  const clean=a=>{const out=[];(Array.isArray(a)?a:[]).forEach(x=>{x=String(x||'').trim().replace(/\s+/g,' ');if(x&&!out.some(y=>y.toLowerCase()===x.toLowerCase()))out.push(x);});return out;};
  const rn={};Object.entries(p.renames&&typeof p.renames==='object'?p.renames:{}).forEach(([k,v])=>{k=String(k||'').trim().toLowerCase().replace(/\s+/g,' ');v=String(v||'').trim().replace(/\s+/g,' ');if(k&&v&&k!==v.toLowerCase())rn[k]=v;});
  const out={hidden:clean(p.hidden),extra:clean(p.extra),staff:clean(p.staff),teamAdd:clean(p.teamAdd),teamRemove:clean(p.teamRemove),renames:rn,seeded:clean(p.seeded)};
  // one-time seed of Pusmantap employees (kept editable/deletable afterwards)
  if(!out.seeded.includes(CM_PUSMANTAP_STAFF_SEED_ID)){CM_PUSMANTAP_STAFF.forEach(n=>{if(!out.staff.some(x=>x.toLowerCase()===n.toLowerCase())&&!out.extra.some(x=>x.toLowerCase()===n.toLowerCase()))out.staff.push(n);});out.seeded.push(CM_PUSMANTAP_STAFF_SEED_ID);}
  return out;
}
function cmPicPrefs(){if(cmPicPrefsCache)return cmPicPrefsCache;try{cmPicPrefsCache=cmPicPrefsNormalize(JSON.parse(localStorage.getItem(CM_PIC_PREFS_KEY)||'{}'));}catch(e){cmPicPrefsCache=cmPicPrefsNormalize({});}return cmPicPrefsCache;}
const CM_ESELON1_UNITS=[
  {code:'SETJEN',short:'Setjen',name:'Sekretariat Jenderal'},
  {code:'ITJEN',short:'Itjen',name:'Inspektorat Jenderal'},
  {code:'DJSEF',short:'DJSEF',name:'Direktorat Jenderal Strategi Ekonomi dan Fiskal'},
  {code:'DJA',short:'DJA',name:'Direktorat Jenderal Anggaran'},
  {code:'DJP',short:'DJP',name:'Direktorat Jenderal Pajak'},
  {code:'DJBC',short:'DJBC',name:'Direktorat Jenderal Bea dan Cukai'},
  {code:'DJPB',short:'DJPb',name:'Direktorat Jenderal Perbendaharaan'},
  {code:'DJKN',short:'DJKN',name:'Direktorat Jenderal Kekayaan Negara'},
  {code:'DJPK',short:'DJPK',name:'Direktorat Jenderal Perimbangan Keuangan'},
  {code:'DJPPR',short:'DJPPR',name:'Direktorat Jenderal Pengelolaan Pembiayaan dan Risiko'},
  {code:'DJSPSK',short:'DJSPSK',name:'Direktorat Jenderal Stabilitas dan Pengembangan Sektor Keuangan'},
  {code:'BATII',short:'BaTii',name:'Badan Teknologi, Informasi, dan Intelijen Keuangan'},
  {code:'BPPK',short:'BPPK',name:'Badan Pendidikan dan Pelatihan Keuangan'},
  {code:'LNSW',short:'LNSW',name:'Lembaga National Single Window'},
  {code:'EKSTERNAL',short:'Eksternal',name:'Eksternal'}
];
const CM_UNIT_REF_DEFAULT=CM_ESELON1_UNITS.filter(u=>u.code!=='EKSTERNAL').map(u=>({...u}));
let cmUnitRefList=CM_UNIT_REF_DEFAULT.map(u=>({...u})),cmUnitRefUnsub=null,cmUnitRefUi={open:false,draft:null};
function cmUnitRef(){return cmUnitRefList;}
let cmRptLangCur='';
function cmRptStatus(k){const lang=cmRptLangCur||currentLang;const id={Scheduled:'Terjadwal',Pending:'Menunggu Konfirmasi',Ongoing:'Sedang Berlangsung',Completed:'Selesai',Postponed:'Ditunda',Cancelled:'Dibatalkan','Not Attended':'Tidak Dihadiri'},en={Scheduled:'Scheduled',Pending:'Awaiting Confirmation',Ongoing:'Ongoing',Completed:'Completed',Postponed:'Postponed',Cancelled:'Cancelled','Not Attended':'Not Attended'};const key=k||'Scheduled';return (lang==='en'?en:id)[key]||(typeof activityStatusLabel==='function'?activityStatusLabel(key):key);}
function cmReportSafe(v){return String(v??'').trim()||'-'}
function cmReportFilterContext(items=[]){
  const f=state.filters||{};
  const itemDates=(items||[]).flatMap(a=>[a.tglMulai,a.tglSelesai]).filter(Boolean).sort();
  const fallbackFrom=itemDates[0]||'';
  const fallbackTo=itemDates[itemDates.length-1]||fallbackFrom;
  return {
    dateFrom:f.dateFrom||fallbackFrom,
    dateTo:f.dateTo||fallbackTo,
    kategori:f.kategori||'ALL',program:f.program||'ALL',status:f.status||'ALL',pic:f.pic||'ALL',unit:f.unit||'ALL',layanan:f.layanan||'ALL',tahun:f.tahun||'ALL',unitType:f.unitType||'ALL',search:f.search||''
  };
}
function cmReportDateRange(items,ctx=cmReportFilterContext(items)){
  if(ctx.dateFrom||ctx.dateTo){
    const a=ctx.dateFrom||ctx.dateTo,b=ctx.dateTo||ctx.dateFrom;
    return a===b?fmtDate(a):`${fmtDate(a)} – ${fmtDate(b)}`;
  }
  return '-';
}
function cmReportFilterSummary(items,lang='id'){
  const c=cmReportFilterContext(items),parts=[];
  const add=(label,val)=>{if(val&&val!=='ALL')parts.push(`${label}: ${val}`)};
  if(c.dateFrom||c.dateTo)parts.push(`${lang==='id'?'Periode':'Period'}: ${cmReportDateRange(items,c)}`);
  add(lang==='id'?'Kategori':'Category',c.kategori);add('Program',c.program);add('Status',c.status);add('PIC',c.pic);add(lang==='id'?'Unit Pemohon':'Requesting Unit',c.unit);add(lang==='id'?'Layanan':'Service',c.layanan);add(lang==='id'?'Tahun':'Year',c.tahun);add(lang==='id'?'Tipe Unit':'Unit Type',c.unitType);
  if(c.search)parts.push(`${lang==='id'?'Pencarian':'Search'}: "${c.search}"`);
  return parts;
}
function cmRptHas(v){const s=String(v??'').trim();return !!s&&!/^[-–—]$/.test(s);}
function cmRptDocNa(a,k){return /^[-–—]$/.test(String(a?.[k]??'').trim())&&!cmRptHas(a?.[k+'Url'])&&!parseActivityFiles(a?.[k+'Files']).length;}
function cmRptDocFlags(a){
  return {
    undangan:cmRptHas(a.undangan)||cmRptHas(a.undanganUrl)||parseActivityFiles(a.undanganFiles).length>0||cmRptDocNa(a,'undangan'),
    suratTugas:cmRptHas(a.suratTugas)||cmRptHas(a.suratTugasUrl)||parseActivityFiles(a.suratTugasFiles).length>0||cmRptDocNa(a,'suratTugas'),
    materi:cmRptHas(a.materi)||parseActivityFiles(a.materiFiles).length>0,
    notula:parseActivityNotula(a.notula).length>0||cmRptHas(String(a.notulaTeks||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').trim()),
    dokumentasi:parseDokumentasi(a.dokumentasi).length>0
  };
}
const CM_RPT_DOC_KEYS=['undangan','suratTugas','materi','notula','dokumentasi'];
function cmRptDocLabel(k,lang){const id={undangan:'Undangan',suratTugas:'Surat Tugas',materi:'Materi',notula:'Notula',dokumentasi:'Dokumentasi Foto'},en={undangan:'Invitation',suratTugas:'Assignment Letter',materi:'Materials',notula:'Minutes',dokumentasi:'Photo Documentation'};return (lang==='en'?en:id)[k]||k;}
function cmRptDocPct(a){const f=cmRptDocFlags(a);return Math.round(CM_RPT_DOC_KEYS.filter(k=>f[k]).length/CM_RPT_DOC_KEYS.length*100);}
function cmReportStats(items){
  const byStatus={},byStatusKey={},byMonth={},byMonthDone={},byProgram={},byUnit={},byPic={},byKategori={},byLayanan={};
  const docs={undangan:0,suratTugas:0,materi:0,notula:0,dokumentasi:0},docsDone={undangan:0,suratTugas:0,materi:0,notula:0,dokumentasi:0};
  let completed=0,needsUpdate=0;
  items.forEach(a=>{
    const key=a.statusNorm||'Scheduled',st=cmRptStatus(key);byStatus[st]=(byStatus[st]||0)+1;byStatusKey[key]=(byStatusKey[key]||0)+1;
    const mo=(a.tglMulai||'').slice(0,7);if(mo){byMonth[mo]=(byMonth[mo]||0)+1;if(key==='Completed')byMonthDone[mo]=(byMonthDone[mo]||0)+1;}
    const pr=cmReportSafe(a.programTerkait);byProgram[pr]=(byProgram[pr]||0)+1;
    const un=cmReportSafe(a.unitPemohon);byUnit[un]=(byUnit[un]||0)+1;
    const kt=cmReportSafe(a.kategori);byKategori[kt]=(byKategori[kt]||0)+1;
    const ly=cmReportSafe(a.layanan);byLayanan[ly]=(byLayanan[ly]||0)+1;
    (typeof cmPicList==='function'?cmPicList(a.picTimCM):String(a.picTimCM||'').split(',').map(x=>x.trim()).filter(Boolean)).forEach(x=>byPic[x]=(byPic[x]||0)+1);
    if(key==='Completed')completed++;
    if(a.statusNeedsUpdate)needsUpdate++;
    const f=cmRptDocFlags(a);CM_RPT_DOC_KEYS.forEach(k=>{if(f[k]){docs[k]++;if(key==='Completed')docsDone[k]++;}});
  });
  const top=o=>Object.entries(o).filter(([k])=>k!=='-').sort((a,b)=>b[1]-a[1])[0]||['-',0];
  return {byStatus,byStatusKey,byMonth,byMonthDone,byProgram,byUnit,byPic,byKategori,byLayanan,docs,docsDone,completed,needsUpdate,
    topMonth:top(byMonth),topProgram:top(byProgram),topUnit:top(byUnit),topPic:top(byPic),topKategori:top(byKategori)};
}
const CM_RPT_ROMAN=['I','II','III','IV'];
const CM_RPT_PALETTE=['#2F5BD3','#F2A93B','#16A37F','#E25563','#7C5CE0','#1BA7C9','#E66AA8','#7FB43A','#F07C3A','#5B6B82'];
const CM_RPT_STATUS_COLOR={Completed:'#16A37F',Scheduled:'#2F5BD3',Ongoing:'#F2A93B',Pending:'#C28A1E',Postponed:'#7C5CE0','Not Attended':'#8A94A6',Cancelled:'#E25563'};
const CM_RPT_ORG=['KEMENTERIAN KEUANGAN REPUBLIK INDONESIA','Badan Teknologi, Informasi, dan Intelijen Keuangan','Pusat Manajemen Transformasi dan Perubahan'];
function cmRptT(lang,id,en){const r=lang==='en'?en:id;if(!CM_LBL_ACTIVE.size)return r;const o=CM_LBL_ACTIVE.get(en)||CM_LBL_ACTIVE.get(id);return o?cmLblPick(o,r,lang==='en'?'en':'id'):r;}
function cmRptLongDate(d,lang){const x=dayjs(d);return x.isValid()?x.locale(lang==='en'?'en':'id').format('D MMMM YYYY'):cmReportSafe(d);}
function cmRptPeriodFromRange(from,to,lang){
  const a=dayjs(from),b=dayjs(to),L=(i,e)=>cmRptT(lang,i,e),loc=lang==='en'?'en':'id';
  const range=from===to?cmRptLongDate(from,lang):`${cmRptLongDate(from,lang)} – ${cmRptLongDate(to,lang)}`;
  const base={from,to,range};
  if(!a.isValid()||!b.isValid())return {...base,kind:'custom',label:L(`Periode ${range}`,`Period ${range}`),short:range};
  const fullStart=a.date()===1,fullEnd=b.date()===b.daysInMonth(),sameYear=a.year()===b.year(),months=sameYear?b.month()-a.month()+1:-1,y=a.year();
  if(fullStart&&fullEnd&&sameYear){
    if(months===1){const m=a.locale(loc).format('MMMM YYYY');return {...base,kind:'month',label:L(`Bulan ${m}`,m),short:m};}
    if(months===3&&a.month()%3===0){const q=CM_RPT_ROMAN[a.month()/3];return {...base,kind:'quarter',label:L(`Triwulan ${q} ${y}`,`Quarter ${q} ${y}`),short:L(`Triwulan ${q} ${y}`,`Q${a.month()/3+1} ${y}`)};}
    if(months===6&&a.month()%6===0){const s=a.month()===0?'I':'II';return {...base,kind:'semester',label:L(`Semester ${s} ${y}`,`Semester ${s} ${y}`),short:`Semester ${s} ${y}`};}
    if(months===12){return {...base,kind:'year',label:L(`Tahun ${y}`,`Year ${y}`),short:String(y)};}
  }
  if(from===to)return {...base,kind:'day',label:L(`Tanggal ${range}`,range),short:range};
  return {...base,kind:'custom',label:L(`Periode ${range}`,`Period ${range}`),short:range};
}
function cmRptPeriod(items,lang){
  const f=state.filters||{};let from=f.dateFrom||'',to=f.dateTo||'';
  if(!from&&!to&&f.tahun&&f.tahun!=='ALL')return cmRptPeriodFromRange(`${f.tahun}-01-01`,`${f.tahun}-12-31`,lang);
  if(!from&&!to){
    const ds=(items||[]).map(a=>a.tglMulai).filter(Boolean).sort();
    if(!ds.length)return {kind:'all',label:cmRptT(lang,'Seluruh Periode','All Periods'),short:cmRptT(lang,'Seluruh Periode','All Periods'),from:'',to:'',range:'-'};
    const r=cmRptPeriodFromRange(ds[0],ds[ds.length-1],lang);
    return {...r,kind:'all',label:cmRptT(lang,'Seluruh Periode','All Periods'),short:cmRptT(lang,'Seluruh Periode','All Periods')};
  }
  if(!from)from=to;if(!to)to=from;
  return cmRptPeriodFromRange(from,to,lang);
}
function cmRptSubject(lang){
  const f=state.filters||{},L=(i,e)=>cmRptT(lang,i,e);
  const prog=f.program&&f.program!=='ALL'?f.program:'',unit=f.unit&&f.unit!=='ALL'?f.unit:'';
  const base=L('Monitoring dan Evaluasi','Monitoring and Evaluation');
  if(prog&&unit)return {text:`${base} ${L('Proyek','Project')} ${prog} — ${L('Unit','Unit')} ${unit}`,focus:'program'};
  if(prog)return {text:`${base} ${L('Proyek','Project')} ${prog}`,focus:'program'};
  if(unit)return {text:`${base} ${L('Proyek Unit','Projects of Unit')} ${unit}`,focus:'unit'};
  return {text:`${base} ${L('Kegiatan Change Management','Change Management Activities')}`,focus:'all'};
}
function cmRptFileName(s){return String(s||'Laporan').replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim().slice(0,150);}
let cmRptTteDate='';
function cmRptSigner(){let s={name:'',title:'',label:'',city:''};try{s=Object.assign(s,JSON.parse(localStorage.getItem('cmRptSigner')||'{}'))}catch(e){}s.date=cmRptTteDate||dayjs().format('YYYY-MM-DD');return s;}
function cmRptTteFieldsHtml(sg){
  return `<div class="cm-rpt2-tte"><div class="cm-rpt2-tte-h">✍ ${uiText('Electronic signature (TTE)','Tanda tangan elektronik (TTE)')}</div><div class="cm-rpt2-grid">
  <label>${uiText('Signing date','Tanggal tanda tangan')}<input type="date" data-tte="date" value="${escapeHtml(sg.date||'')}"></label>
  <label>${uiText('City (optional)','Kota (opsional)')}<input data-tte="city" value="${escapeHtml(sg.city||'')}" placeholder="Jakarta"></label>
  <label>${uiText('Caption above position (optional)','Keterangan di atas jabatan (opsional)')}<input data-tte="label" value="${escapeHtml(sg.label||'')}" placeholder="${uiText('e.g. Acknowledged,','mis. Mengetahui,')}"></label>
  <label class="span2">${uiText('Position','Jabatan')}<input data-tte="title" value="${escapeHtml(sg.title||'')}" placeholder="${uiText('[Position]','[Jabatan]')}"></label>
  <label>${uiText('Signer name','Nama pejabat')}<input data-tte="name" value="${escapeHtml(sg.name||'')}" placeholder="${uiText('[Signer Name]','[Nama Pejabat]')}"></label>
  </div></div>`;
}
function cmRptTteRead(root){const o={};root.querySelectorAll('[data-tte]').forEach(x=>o[x.dataset.tte]=x.value.trim());if(o.date)cmRptTteDate=o.date;cmRptSaveSigner({name:o.name||'',title:o.title||'',label:o.label||'',city:o.city||''});return cmRptSigner();}
function cmRptSaveSigner(s){try{localStorage.setItem('cmRptSigner',JSON.stringify(s||{}))}catch(e){}}
function cmRptPrefs(){try{return Object.assign({ai:false,lang:'id',inc:{summary:true,charts:true,docs:true,list:true,gallery:true,analysis:true,recs:true}},JSON.parse(localStorage.getItem('cmRptPrefs')||'{}'))}catch(e){return {ai:false,lang:'id',inc:{summary:true,charts:true,docs:true,list:true,gallery:true,analysis:true,recs:true}}}}
function cmRptSavePrefs(p){try{localStorage.setItem('cmRptPrefs',JSON.stringify(p||{}))}catch(e){}}
function cmRptTop(obj,n=8){return Object.entries(obj||{}).filter(([k])=>k!=='-').sort((a,b)=>b[1]-a[1]).slice(0,n);}
function cmRptPct(n,d){return d?Math.round(n/d*100):0;}
async function cmRptChart(cfg,w=720,h=340){
  if(typeof Chart==='undefined')return null;
  const holder=document.createElement('div');holder.style.cssText=`position:fixed;left:-12000px;top:0;width:${w}px;height:${h}px;pointer-events:none`;
  const c=document.createElement('canvas');c.style.width=w+'px';c.style.height=h+'px';c.width=w*2;c.height=h*2;holder.appendChild(c);document.body.appendChild(holder);
  const font={family:"'Segoe UI', Arial, sans-serif",size:15};
  cfg.options=Object.assign({responsive:false,animation:false,devicePixelRatio:2,maintainAspectRatio:false,layout:{padding:{top:14,right:18,bottom:6,left:6}}},cfg.options||{});
  cfg.options.plugins=Object.assign({legend:{labels:{font,color:'#344054',boxWidth:14}}},cfg.options.plugins||{});
  const plugins=[...(cfg.plugins||[])];if(window.ChartDataLabels)plugins.push(window.ChartDataLabels);
  plugins.push({id:'cmRptBg',beforeDraw(ch){const x=ch.ctx;x.save();x.globalCompositeOperation='destination-over';x.fillStyle='#ffffff';x.fillRect(0,0,ch.width,ch.height);x.restore();}});
  cfg.plugins=plugins;
  let chart=null;
  try{const prevFont=Chart.defaults.font.family;Chart.defaults.font.family=font.family;chart=new Chart(c.getContext('2d'),cfg);Chart.defaults.font.family=prevFont;return {src:c.toDataURL('image/png'),w,h};}
  catch(e){console.warn('Report chart failed',e);return null;}
  finally{try{chart&&chart.destroy()}catch(e){}holder.remove();}
}
function cmRptBarCfg(labels,data,{horizontal=false,colors,label='',max,pct=false}={}){
  const bg=colors||labels.map((_,i)=>CM_RPT_PALETTE[i%CM_RPT_PALETTE.length]);
  return {type:'bar',data:{labels,datasets:[{label,data,backgroundColor:bg,borderRadius:6,maxBarThickness:horizontal?26:46}]},
    options:{indexAxis:horizontal?'y':'x',plugins:{legend:{display:false},datalabels:{anchor:'end',align:horizontal?'right':'top',color:'#1d2433',font:{weight:'bold',size:15},formatter:v=>pct?v+'%':v}},
      scales:{x:{grid:{display:!horizontal?false:true,color:'#EEF1F6'},ticks:{color:'#344054',font:{size:15}},max:horizontal?max:undefined,beginAtZero:true},y:{grid:{color:'#EEF1F6',display:horizontal?false:true},ticks:{color:'#344054',font:{size:15},precision:0},beginAtZero:true,max:horizontal?undefined:max}}}};
}
function cmRptDoughnutCfg(labels,data,colors,center){
  const total=data.reduce((s,v)=>s+v,0);
  return {type:'doughnut',data:{labels,datasets:[{data,backgroundColor:colors,borderColor:'#fff',borderWidth:3}]},
    options:{cutout:'58%',plugins:{legend:{position:'right',labels:{font:{size:15},color:'#344054',boxWidth:16,padding:14}},datalabels:{color:'#fff',font:{weight:'bold',size:15},formatter:v=>total&&v/total>=0.06?Math.round(v/total*100)+'%':''}}},
    plugins:[{id:'cmRptCenter',afterDraw(ch){if(!center)return;const {ctx,chartArea:a}=ch;const cx=(a.left+a.right)/2,cy=(a.top+a.bottom)/2;ctx.save();ctx.textAlign='center';ctx.fillStyle='#12275A';ctx.font="bold 34px 'Segoe UI', Arial";ctx.fillText(center[0],cx,cy+4);ctx.font="15px 'Segoe UI', Arial";ctx.fillStyle='#667085';ctx.fillText(center[1],cx,cy+24);ctx.restore();}}]};
}
async function cmRptNormalizeImage(src,maxW=1400){
  return new Promise(res=>{if(!src)return res(null);const im=new Image();im.onload=()=>{try{const s=Math.min(1,maxW/(im.naturalWidth||maxW));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.naturalWidth*s));c.height=Math.max(1,Math.round(im.naturalHeight*s));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);res({src:c.toDataURL('image/jpeg',0.86),w:c.width,h:c.height});}catch(e){res(null)}};im.onerror=()=>res(null);im.src=src;});
}
function cmRptQr(text){
  try{
    if(typeof QRCode==='undefined')return null;
    const div=document.createElement('div');div.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(div);
    new QRCode(div,{text:String(text||'TTE').slice(0,200),width:256,height:256,colorDark:'#12275A',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
    const cv=div.querySelector('canvas');const url=cv?cv.toDataURL('image/png'):null;div.remove();
    return url?{src:url,w:256,h:256}:null;
  }catch(e){return null}
}
async function cmRptImagesFor(a,max=12){
  const docs=parseDokumentasi(a.dokumentasi).slice(0,max),out=[];
  if(!docs.length||typeof fetchDocImageDataUrl!=='function')return out;
  for(const d of docs){try{const url=await fetchDocImageDataUrl(d.refId);if(!url)continue;const img=await cmRptNormalizeImage(url);if(img)out.push({...img,caption:d.name||''});}catch(e){}}
  return out;
}
function cmRptAiAvailable(){try{return typeof cmAiWorkerUrl==='function'&&/^https:\/\//i.test(cmAiWorkerUrl()||'')}catch(e){return false}}
let cmRptAiLastError='';
async function cmRptAi(contextText,lang,kind,scope={}){
  cmRptAiLastError='';
  if(!cmRptAiAvailable()){cmRptAiLastError=cmRptT(lang,'AI Worker belum dikonfigurasi','AI Worker not configured');return null;}
  const id=lang!=='en';
  const heads=id?['Capaian Utama','Identifikasi Kendala','Tindak Lanjut','Rekomendasi']:['Key Achievements','Issues Identified','Follow-up Actions','Recommendations'];
  const hb=heads.map(h=>'**'+h+'**').join(', ');
  const question=id
    ?`Tolong susun analisis monitoring dan evaluasi untuk laporan ${kind==='single'?'satu kegiatan':'periodik'} Change Management berdasarkan REPORT DATA pada konteks. Gunakan subjudul tebal: ${hb}.`
    :`Please write the monitoring and evaluation analysis for this ${kind==='single'?'single-activity':'periodic'} Change Management report based on REPORT DATA in the context. Use bold subheadings: ${hb}.`;
  const style=id
    ?`RESPONSE STYLE\nTulis dalam Bahasa Indonesia formal yang sederhana dan mudah dipahami semua generasi. Gunakan persis subjudul tebal: ${hb}. Di bawah tiap subjudul tulis 2-5 butir singkat diawali "- ". Untuk Tindak Lanjut sebutkan pihak dan target waktu bila ada di data. Hanya gunakan data pada REPORT DATA; jangan mengarang angka. Posisikan Pusmantap hanya sebagai pendamping/konsultatif, bukan pelaksana atau pengambil keputusan. Jangan menulis HTML, tag <br>, atau tabel.`
    :`RESPONSE STYLE\nWrite in plain formal English readable by all generations. Use exactly these bold subheadings: ${hb}. Under each, 2-5 short bullets starting with "- ". Include owner and timeline for follow-ups when available. Use only REPORT DATA; do not invent numbers. Pusmantap is advisory only. No HTML, <br> tags, or tables.`;
  const maxChars=(typeof CM_AI_CONTEXT_MAX_CHARS!=='undefined'?CM_AI_CONTEXT_MAX_CHARS:16000);
  const header=`${style}\n\nCURRENT DASHBOARD\nBuild: ${typeof CM_APP_BUILD!=='undefined'?CM_APP_BUILD:''}\nBrowser date: ${dayjs().format('YYYY-MM-DD')}\nActive tab: ${state.activeTab}\nLanguage: ${lang}\nAuthenticated: ${isLoggedIn()?'yes':'no'}\nTask: M&E report analysis\n\nREPORT DATA\n`;
  const convScope={date:'',dateFrom:scope.dateFrom||'',dateTo:scope.dateTo||'',period:(scope.dateFrom||scope.dateTo)?'range':'',activityIds:(scope.activityIds||[]).slice(0,60)};
  const call=async(priv,limit)=>{
    let idToken='';if(priv&&window.cmGetFirebaseIdToken){try{idToken=await window.cmGetFirebaseIdToken()}catch(e){idToken=''}}
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),90000);
    try{
      const res=await fetch(cmAiWorkerUrl(),{method:'POST',headers:{'Content-Type':'application/json'},signal:ctrl.signal,body:JSON.stringify({question,history:[],conversationScope:convScope,routeHint:'activity',locale:lang,currentTab:state.activeTab,context:(header+String(contextText||'')).slice(0,limit),responseStyle:'Formal M&E report. Bold subheadings with "- " bullet points only. Never return HTML or literal <br> tags.',privateContext:!!(priv&&idToken),idToken,clientVersion:typeof CM_APP_BUILD!=='undefined'?CM_APP_BUILD:''})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok){const e=new Error(res.status===429?cmRptT(lang,'Rate limit AI tercapai, coba lagi beberapa saat lagi','AI rate limit reached, try again shortly'):(data.error||data.message||`HTTP ${res.status}`));e.status=res.status;throw e;}
      if(!data.answer)throw new Error(cmRptT(lang,'Worker tidak mengembalikan jawaban','Worker returned no answer'));
      return data;
    }catch(e){if(e&&e.name==='AbortError')throw new Error(cmRptT(lang,'Waktu tunggu AI habis (90 detik)','AI request timed out (90s)'));throw e;}
    finally{clearTimeout(timer);}
  };
  let data=null;
  try{data=await call(isLoggedIn(),maxChars);}
  catch(e1){
    console.warn('AI report analysis attempt 1 failed',e1);
    if(e1.status===429)cmRptAiLastError=e1.message;
    else{try{data=await call(false,Math.min(maxChars,9000));}catch(e2){console.warn('AI report analysis attempt 2 failed',e2);cmRptAiLastError=(e2&&e2.message)||String(e2);}}
  }
  if(!data){toast(`${cmRptT(lang,'Analisis AI gagal','AI analysis failed')}: ${cmRptAiLastError}. ${cmRptT(lang,'Laporan memakai analisis otomatis.','Using automatic analysis.')}`,'error');return null;}
  const secs=cmRptParseAi(String(data.answer));
  if(!secs.length){cmRptAiLastError=cmRptT(lang,'Jawaban AI kosong','Empty AI answer');return null;}
  secs.model=data.model||'';
  return secs;
}
function cmRptParseAi(text){
  const sections=[];let cur=null;
  String(text).replace(/<br\s*\/?>/gi,'\n').split(/\r?\n/).forEach(raw=>{
    const line=raw.trim();if(!line)return;
    const h=line.match(/^(?:#+\s*)?\*\*([^*]{2,60}?):?\*\*:?\s*(.*)$/)||line.match(/^#+\s*(.+)$/);
    if(h&&!/^[-*•]\s/.test(line)){cur={title:h[1].replace(/\*\*/g,'').replace(/:$/,'').trim(),bullets:[],paras:[]};sections.push(cur);if(h[2]&&h[2].trim())cur.paras.push(h[2].trim());return;}
    if(!cur){cur={title:'',bullets:[],paras:[]};sections.push(cur);}
    const b=line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if(b)cur.bullets.push(b[1]);else cur.paras.push(line);
  });
  return sections.filter(s=>s.title||s.bullets.length||s.paras.length);
}
const CM_RPT_THEMES=[
  {key:'sistem',id:'Sistem & Aplikasi',en:'System & Application',color:'#2F5BD3',re:/\b(aplikasi|sistem|system|fitur|modul|error|bug|akses|login|server|dashboard|integrasi|interkoneksi|crm|tiket|ticket|database|uji coba|ujicoba|uat|deploy|go[- ]?live|mockup|prototype|infrastruktur|jaringan)\b/i},
  {key:'sdm',id:'SDM & Kapabilitas',en:'People & Capability',color:'#16A37F',re:/\b(sdm|pegawai|pengguna|user|pelatihan|training|tot|transfer knowledge|kompetensi|pemahaman|literasi|kapasitas|kesiapan|readiness|admin|operator|helpdesk|service ?desk|beban kerja|narasumber|pengelola)\b/i},
  {key:'regulasi',id:'Regulasi & Proses Bisnis',en:'Regulation & Business Process',color:'#7C5CE0',re:/\b(regulasi|peraturan|pmk|kmk|perdirjen|juknis|juklak|sop|nota dinas|\bnd\b|kebijakan|probis|proses bisnis|norma waktu|ketentuan|dasar hukum|standar|mekanisme|alur|tata kelola)\b/i},
  {key:'koordinasi',id:'Koordinasi & Stakeholder',en:'Coordination & Stakeholders',color:'#F2A93B',re:/\b(koordinasi|stakeholder|pemangku|keterlibatan|engagement|komunikasi|sosialisasi|diseminasi|unit[- ]unit|lintas unit|uic|pic|eselon|pimpinan|dukungan|sponsor|resistensi|penolakan|keberatan|aspirasi)\b/i},
  {key:'data',id:'Data & Informasi',en:'Data & Information',color:'#1BA7C9',re:/\b(data|validasi|migrasi|rekonsiliasi|informasi|laporan|pelaporan|kualitas data|cleansing|master data|indikator|metadata)\b/i},
  {key:'waktu',id:'Waktu & Jadwal',en:'Time & Schedule',color:'#E25563',re:/\b(jadwal|waktu|tenggat|deadline|terlambat|tertunda|ditunda|mundur|pending|molor|timeline|target waktu|tidak sempat)\b/i},
  {key:'anggaran',id:'Anggaran & Sarana',en:'Budget & Facilities',color:'#C28A1E',re:/\b(anggaran|biaya|dana|dipa|pagu|sarana|prasarana|perangkat|ruangan|fasilitas|lisensi)\b/i}
];
const CM_RPT_K_RE=/\b(kendala|hambatan|masalah|permasalahan|belum|terlambat|tertunda|kurang|keterbatasan|terbatas|sulit|kesulitan|tidak dapat|tidak bisa|tidak sesuai|tidak optimal|gagal|error|bug|risiko|resiko|resistensi|menolak|penolakan|keberatan|tantangan|keluhan|komplain|complaint|gap|bottleneck|masih manual|minim|rendah|lambat|overload|bingung|tumpang tindih|duplikasi|belum jelas|tidak jelas|tidak ada)\b/i;
const CM_RPT_KSTRONG_RE=/\b(belum|tidak dapat|tidak bisa|gagal|terlambat|tertunda|resistensi|menolak|penolakan|kritis|mendesak|blocking|error|tidak ada)\b/i;
const CM_RPT_T_RE=/\b(perlu|akan|agar|supaya|segera|tindak lanjut|ditindaklanjuti|follow ?up|rencana|direncanakan|diharapkan|disepakati|kesepakatan|sepakat|diputuskan|meminta|diminta|mohon|harus|wajib|dijadwalkan|target|paling lambat|selanjutnya|next step|rekomendasi|usulan|diusulkan|menyampaikan|menyiapkan|melengkapi|menindaklanjuti|menunjuk|tunjuk|dilanjutkan|melanjutkan)\b/i;
const CM_RPT_KEXPLICIT_RE=/\b(kendala|terkendala|hambatan|tantangan|masalah|permasalahan|keluhan|komplain|complaint|resistensi|penolakan|gagal|error|bug|tidak dapat|tidak bisa|belum lulus|belum dapat|blm dapat|blm|tdk bisa|gak bisa|nggak bisa|masih menunggu|nunggu|terlambat|tertunda|bottleneck)\b/i;
const CM_RPT_TSTART_RE=/^(?:\S+\s+){0,5}?(akan|perlu|agar|mohon|diminta|direncanakan|disepakati|diharapkan|segera|harus|wajib)\b/i;
const CM_RPT_GREET_RE=/^(selamat (pagi|siang|sore|malam)|assalam|halo|hai|terima ?kasih|wassalam|mohon maaf|izin|ijin)\b/i;
const CM_RPT_DECISION_RE=/\b(disepakati|sepakat|kesepakatan|diputuskan|keputusan|ditetapkan|setuju|menyetujui)\b/i;
const CM_RPT_NOISE_RE=/^(kementerian keuangan|badan teknologi|pusat manajemen|gedung|jalan|jl\.|telepon|faksimile|laman|email|surel|notula|notulen|daftar hadir|peserta rapat|pimpinan rapat|notulis|nip\b|mengetahui|dicatat oleh|hari\s*\/?\s*tanggal|waktu\s*:|tempat\s*:|agenda\s*:|acara\s*:|lampiran|demikian|a\.\s*dasar|b\.\s*waktu|c\.\s*agenda|rapat dilaksanakan pada|link|https?:)/i;
const CM_RPT_HEAD_K_RE=/^(?:[a-h]\.|\d+\.|[ivx]+\.)?\s*(kendala|permasalahan|hambatan|isu|issues?|tantangan|risiko)(\s+(yang\s+)?(dihadapi|utama|dan\s+\w+))?\s*:?\s*$/i;
const CM_RPT_HEAD_T_RE=/^(?:[a-h]\.|\d+\.|[ivx]+\.)?\s*(tindak\s*lanjut|rencana\s*tindak\s*lanjut|kesepakatan|keputusan|kesimpulan(\s+dan\s+tindak\s*lanjut)?|next\s*steps?|rekomendasi|action\s*items?)\s*:?\s*$/i;
const CM_RPT_HEAD_H_RE=/^(?:[a-h]\.|\d+\.|[ivx]+\.)?\s*(hasil(\s+rapat|\s+pembahasan|\s+diskusi)?|pembahasan|pokok(\s+pembahasan)?|ringkasan|poin\s+diskusi|diskusi)\s*:?\s*$/i;
function cmRptCleanSentence(s){
  return String(s||'').replace(/\s+/g,' ').replace(/^[\s\-–—•*·>»]+/,'').replace(/^\(?\d{1,2}[.)]\s*(?=\S)/,'').replace(/^(\(?[a-h][.)]|[ivx]{1,4}[.)])\s+/i,'').replace(/^(hasil rapat|catatan|note|notes|hal|perihal)\s*:\s*/i,'').trim();
}
function cmRptSegment(text){
  const out=[];let mode='';
  String(text||'').replace(/\r/g,'').replace(/\t/g,' ').split(/\n+/).forEach(raw=>{
    let line=raw.trim();if(!line)return;
    if(CM_RPT_HEAD_K_RE.test(line)){mode='k';return;}
    if(CM_RPT_HEAD_T_RE.test(line)){mode='t';return;}
    if(CM_RPT_HEAD_H_RE.test(line)){mode='h';return;}
    // inline heading "Kendala: xxx"
    const inl=line.match(/^(kendala|permasalahan|hambatan|tindak lanjut|kesepakatan|keputusan)\s*:\s*(.+)$/i);
    let lm=mode;if(inl){lm=/tindak|sepakat|putus/i.test(inl[1])?'t':'k';line=inl[2];}
    line.split(/\s(?=\d{1,2}[.)]\s+[A-Z])/).forEach(part=>{
      part.split(/(?<=[a-z0-9)\]"”][.;!?])\s+(?=[A-Z])/).forEach(seg=>{
        const s=cmRptCleanSentence(seg);if(s.length<14)return;
        if(CM_RPT_NOISE_RE.test(s))return;
        const letters=s.replace(/[^A-Za-z]/g,''),upper=s.replace(/[^A-Z]/g,'');
        if(letters.length>8&&upper.length/letters.length>0.75&&s.length<110)return; // header in caps
        out.push({text:s,mode:lm});
      });
    });
  });
  return out;
}
function cmRptTheme(s){const t=CM_RPT_THEMES.find(x=>x.re.test(s));return t||{key:'lainnya',id:'Lainnya',en:'Other',color:'#8A94A6'};}
function cmRptActors(extra=[]){
  const base=[...cmUnitRef().map(u=>u.short||u.code),'Pusmantap','Tim CM','BaTii','Pusintek','Puspensi','Pusakti','Pusilki','Pusdiklat','Setjen','Itjen','BPPK','DJA','DJPb','DJPK','DJKN','DJSPSK','DJPPR','DJP','DJBC','DJSEF','LNSW','Biro SDM','Biro Organta','Biro KLI','Biro Umum','Biro Perencanaan','Biro Hukum','Kemenkeu Prime','Service Desk','PMO','UIC','CMO','Tim Teknis','Tim IT','Pak Ka','Kapus','Narasumber','Peserta'];
  const units=(state.agendas||[]).map(a=>String(a.unitPemohon||'').trim()).filter(x=>x&&x.length>=3&&x!=='-');
  const pics=(state.agendas||[]).flatMap(a=>(typeof cmPicList==='function'?cmPicList(a.picTimCM):String(a.picTimCM||'').split(',').map(x=>x.trim()).filter(Boolean))).filter(x=>x.length>=3);
  const aliasNames=typeof CM_PIC_ALIASES==='object'?Object.keys(CM_PIC_ALIASES).filter(k=>k.length>=3).map(k=>k.replace(/\b\w/g,c=>c.toUpperCase())):[];
  return [...new Set([...base,...units,...extra,...pics,...aliasNames])].sort((a,b)=>b.length-a.length);
}
function cmRptFindActor(s,actors){
  // prefer actor that appears before an action verb
  const verb=s.search(/\b(perlu|akan|agar|diminta|meminta|menyampaikan|menyiapkan|melengkapi|menindaklanjuti|harus|wajib|segera|menunjuk|melanjutkan)\b/i);
  let best=null,bestPos=1e9;
  for(const a of actors){const re=new RegExp('(^|[^A-Za-z])'+a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=$|[^A-Za-z])','i');const m=s.match(re);if(!m)continue;const pos=m.index;const score=(verb>-1&&pos<verb?0:1000)+pos;if(score<bestPos){bestPos=score;best=a;}}
  return best;
}
function cmRptFindDue(s,lang){
  const mon='(jan(?:uari)?|feb(?:ruari)?|mar(?:et)?|apr(?:il)?|mei|jun(?:i)?|jul(?:i)?|agu(?:stus)?|agt|sep(?:tember)?|okt(?:ober)?|nov(?:ember)?|des(?:ember)?)';
  const pats=[new RegExp('(paling lambat|sebelum|maksimal|selambat-lambatnya|tanggal|tgl\\.?|pada)?\\s*\\d{1,2}\\s+'+mon+'(\\s+\\d{4})?','i'),new RegExp('\\b'+mon+'\\s+\\d{4}\\b','i'),/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/,/\b(minggu|pekan|bulan) (depan|ini|berikutnya)\b/i,/\bakhir (bulan|tahun|triwulan|minggu|pekan)( ini)?\b/i,/\b(tw|triwulan|q|semester)\s?(i{1,3}v?|iv|[1-4])\b/i,/\b(hari ini|besok|segera|secepatnya|asap)\b/i];
  for(const p of pats){const m=s.match(p);if(m)return m[0].trim().replace(/^(pada|tanggal|tgl\.?)\s+/i,'');}
  return '';
}
function cmRptShort(s,n=280){s=String(s||'').trim();s=s.charAt(0).toUpperCase()+s.slice(1);return s.length>n?s.slice(0,n-1).replace(/\s+\S*$/,'')+'…':s;}
function cmRptKey(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().slice(0,90);}
function cmRptAnalyzeSources(sources,opts={}){
  const actors=cmRptActors(opts.actors||[]),kendala=[],tl=[],hasil=[],keputusan=[],seen=new Set();
  sources.forEach(src=>{
    cmRptSegment(src.text).forEach((seg,idx)=>{
      const s=seg.text,k=cmRptKey(s);if(seen.has(k))return;
      if(CM_RPT_GREET_RE.test(s)){seen.add(k);return;}
      const explicitK=CM_RPT_KEXPLICIT_RE.test(s),tStart=CM_RPT_TSTART_RE.test(s),notNeed=/\b(belum|tidak) perlu\b/i.test(s);
      let isK=seg.mode==='k'||explicitK||(CM_RPT_K_RE.test(s)&&!CM_RPT_T_RE.test(s));
      let isT=seg.mode==='t'||(CM_RPT_T_RE.test(s)&&!(explicitK&&!tStart&&seg.mode!=='t'));
      if(notNeed&&!explicitK)isK=false;
      if(notNeed)isT=false;
      if(isK&&isT&&seg.mode!=='k'){if(tStart&&!/^(kendala|hambatan|tantangan|masalah|permasalahan)/i.test(s))isK=false;else if(!tStart)isT=false;}
      const isD=CM_RPT_DECISION_RE.test(s);
      let used=false;
      if(isK){const th=cmRptTheme(s);kendala.push({text:cmRptShort(s),theme:th,priority:CM_RPT_KSTRONG_RE.test(s)?'Tinggi':'Sedang',src:src.label});used=true;}
      if(isT){const th=cmRptTheme(s);let act=cmRptFindActor(s,actors)||'';if(act&&typeof cmPicCanon==='function')act=cmPicCanon(act);if(/^(pusmantap|tim cm|cmo)$/i.test(act))act=act+' (pendampingan)';
        tl.push({text:cmRptShort(s),theme:th,actor:act,due:cmRptFindDue(s),decision:isD,src:src.label});used=true;}
      if(isD&&!isT)keputusan.push({text:cmRptShort(s),src:src.label});
      if(!used&&s.length>=40&&(seg.mode==='h'||/\b(dibahas|membahas|menjelaskan|dipaparkan|memaparkan|disampaikan|menyampaikan|diskusi|menyepakati|menghasilkan|hasil)\b/i.test(s)||src.kind==='catatan'))hasil.push({text:cmRptShort(s,240),src:src.label,pos:idx});
      seen.add(k);
    });
  });
  const dd=list=>{const kept=[];list.forEach(x=>{const w=new Set(cmRptKey(x.text).split(' ').filter(t=>t.length>3));if(kept.some(y=>{const v=y._w;let inter=0;w.forEach(t=>{if(v.has(t))inter++});return inter/Math.max(1,Math.min(w.size,v.size))>=0.6;}))return;Object.defineProperty(x,'_w',{value:w,enumerable:false});kept.push(x);});return kept;};
  return {kendala:dd(kendala),tl:dd(tl),hasil:hasil.slice(0,6),keputusan:keputusan.slice(0,6),sourcesUsed:sources.filter(x=>String(x.text||'').trim()).map(x=>x.label)};
}
async function cmRptActivitySources(a,lang){
  const L=(i,e)=>cmRptT(lang,i,e),src=[];
  if(cmRptHas(a.catatan))src.push({label:L('Catatan','Notes'),kind:'catatan',text:a.catatan});
  for(const n of parseActivityNotula(a.notula)){
    let text='';
    try{if(typeof cmActivityNotulaLoadChunks==='function'){const ch=await cmActivityNotulaLoadChunks(n);text=(ch||[]).map(c=>c.text||'').join('\n');}}catch(e){}
    if(!text)text=n.searchPreview||'';
    if(text)src.push({label:`${L('Notula','Minutes')}${n.fileName?': '+n.fileName:''}`,kind:'notula',full:text.length>(n.searchPreview||'').length,text:text.slice(0,60000)});
  }
  const nt=cmAfHtmlText(a.notulaTeks||'');
  if(cmRptHas(nt))src.push({label:L('Catatan notula','Written minutes'),kind:'notula',full:true,text:nt.slice(0,60000)});
  if(cmRptHas(a.ringkasanHasil))src.push({label:L('Ringkasan hasil','Result summary'),kind:'catatan',text:String(a.ringkasanHasil)});
  if(cmRptHas(a.tindakLanjut))src.push({label:L('Tindak lanjut','Follow-up'),kind:'catatan',text:String(a.tindakLanjut)});
  return src;
}
function cmRptAdminIssues(a,lang){
  const L=(i,e)=>cmRptT(lang,i,e),flags=cmRptDocFlags(a),k=[],t=[],today=dayjs().format('YYYY-MM-DD'),pic=(typeof cmPicList==='function'?cmPicList(a.picTimCM):String(a.picTimCM||'').split(',').map(x=>x.trim()).filter(Boolean))[0]||L('PIC Tim CM','CM team PIC');
  const adm={key:'admin',id:'Administrasi Kegiatan',en:'Activity Administration',color:'#5B6B82'};
  if(a.statusNeedsUpdate){k.push({text:L('Status kegiatan belum diperbarui padahal tanggal pelaksanaan sudah lewat.','Activity status has not been updated although the date has passed.'),theme:adm,priority:'Sedang',src:L('Data kegiatan','Activity data')});t.push({text:L('Memperbarui status kegiatan di dashboard.','Update the activity status in the dashboard.'),theme:adm,actor:pic,due:L('Segera','Immediately'),src:L('Rekomendasi monev','M&E recommendation')});}
  const missing=CM_RPT_DOC_KEYS.filter(x=>!flags[x]);
  if(a.statusNorm==='Completed'&&missing.length){k.push({text:L(`Bukti dukung belum lengkap: ${missing.map(x=>cmRptDocLabel(x,lang)).join(', ')}.`,`Supporting evidence incomplete: ${missing.map(x=>cmRptDocLabel(x,lang)).join(', ')}.`),theme:adm,priority:missing.includes('notula')?'Tinggi':'Sedang',src:L('Data kegiatan','Activity data')});t.push({text:L(`Melengkapi dan mengunggah ${missing.map(x=>cmRptDocLabel(x,lang)).join(', ')} ke dashboard.`,`Upload ${missing.map(x=>cmRptDocLabel(x,lang)).join(', ')} to the dashboard.`),theme:adm,actor:pic,due:L('Maks. 3 hari kerja','Within 3 working days'),src:L('Rekomendasi monev','M&E recommendation')});}
  if(cmIsEoEnabled(a.eoEnabled)){const p=cmEoProgress(a.eoChecklist),over=p.items.filter(x=>!x.done&&x.dueDate&&x.dueDate<today);if(over.length){k.push({text:L(`${over.length} item checklist EO melewati tenggat dan belum selesai.`,`${over.length} EO checklist items are overdue.`),theme:adm,priority:'Tinggi',src:'Checklist EO'});over.slice(0,4).forEach(x=>t.push({text:L(`Menyelesaikan item EO: ${x.task}.`,`Complete EO item: ${x.task}.`),theme:adm,actor:x.pic||pic,due:L('Segera','Immediately'),src:'Checklist EO'}));}}
  return {k,t};
}
function cmRptThemeRecs(kendala,tl,lang){
  // monev recommendations for themes with kendala but no explicit follow-up (Pusmantap as advisor only)
  const L=(i,e)=>cmRptT(lang,i,e),covered=new Set(tl.map(x=>x.theme.key)),out=[];
  const rec={
    sistem:[L('Mengoordinasikan perbaikan/penyesuaian sistem dengan UIC aplikasi dan tim teknis; Pusmantap mendampingi penyusunan pesan perubahan kepada pengguna.','Coordinate system fixes with the application UIC and technical team; Pusmantap supports change messaging.'),L('UIC aplikasi / tim teknis','Application UIC / technical team')],
    sdm:[L('Menyiapkan penguatan kapabilitas pengguna (pelatihan, ToT, panduan singkat) oleh unit pemilik proses, dengan pendampingan desain pembelajaran dari Pusmantap.','Prepare capability building (training, ToT, quick guides) by the process owner, with learning design support from Pusmantap.'),L('Unit pemilik proses','Process owner unit')],
    regulasi:[L('Menginventarisasi kebutuhan penyesuaian regulasi/SOP dan menyampaikannya kepada unit pemilik kebijakan.','Inventory regulation/SOP adjustments and submit them to the policy owner.'),L('Unit pemilik kebijakan','Policy owner unit')],
    koordinasi:[L('Menetapkan PIC dan forum koordinasi rutin antarunit; Pusmantap memfasilitasi pemetaan stakeholder dan strategi engagement.','Assign PICs and a regular coordination forum; Pusmantap facilitates stakeholder mapping and engagement strategy.'),L('UIC / unit terkait','UIC / related units')],
    data:[L('Menyepakati sumber, format, dan jadwal validasi data dengan pemilik data.','Agree on data source, format and validation schedule with the data owner.'),L('Pemilik data','Data owner')],
    waktu:[L('Menyusun ulang jadwal pelaksanaan dan memantau milestone secara berkala.','Re-plan the schedule and monitor milestones regularly.'),L('UIC / PIC kegiatan','UIC / activity PIC')],
    anggaran:[L('Mengidentifikasi kebutuhan anggaran/sarana dan mengusulkannya melalui mekanisme perencanaan unit.','Identify budget/facility needs and propose them through unit planning.'),L('Unit pengusul','Proposing unit')]
  };
  [...new Set(kendala.map(x=>x.theme.key))].forEach(key=>{if(!covered.has(key)&&rec[key]){const th=kendala.find(x=>x.theme.key===key).theme;out.push({text:rec[key][0],theme:th,actor:rec[key][1],due:L('Dibahas pada koordinasi berikutnya','Next coordination meeting'),src:L('Rekomendasi monev','M&E recommendation'),rec:true});}});
  return out;
}
function cmRptPriorityCell(p,lang){const hi=p==='Tinggi';return {text:hi?cmRptT(lang,'Tinggi','High'):cmRptT(lang,'Sedang','Medium'),color:'FFFFFF',fill:hi?'E25563':'F2A93B',bold:true,align:'center'};}
function cmRptThemeName(th,lang){return lang==='en'?th.en:th.id;}
async function cmRptThemeChart(list,lang,title){
  const cnt={};list.forEach(x=>{const n=cmRptThemeName(x.theme,lang);cnt[n]=cnt[n]||{n:0,c:x.theme.color};cnt[n].n++;});
  const e=Object.entries(cnt).sort((a,b)=>b[1].n-a[1].n);if(!e.length)return null;
  return cmRptChart(cmRptBarCfg(e.map(x=>x[0]),e.map(x=>x[1].n),{horizontal:true,colors:e.map(x=>x[1].c)}),560,Math.max(200,70+e.length*40));
}
function cmRptJoin(arr,lang){const a=arr.filter(Boolean);if(a.length<2)return a.join('');return a.slice(0,-1).join(', ')+(lang==='en'?' and ':' dan ')+a[a.length-1];}
function cmRptFmt1(n,lang){const v=Math.round(n*10)/10;return lang==='en'?String(v):String(v).replace('.',',');}
function cmRptNarrTrend(st,lang){
  const L=(i,e)=>cmRptT(lang,i,e),ml=m=>dayjs(m+'-01').locale(lang==='en'?'en':'id').format('MMMM YYYY');
  const ms=Object.keys(st.byMonth).sort();if(!ms.length)return '';
  const dn=m=>st.byMonthDone[m]||0,curM=dayjs().format('YYYY-MM');
  if(ms.length===1){const m=ms[0];return L(`Seluruh kegiatan pada periode ini berlangsung di bulan **${ml(m)}**, yaitu ${st.byMonth[m]} kegiatan, dengan ${dn(m)} di antaranya sudah selesai.`,`All activities in this period fall in **${ml(m)}**: ${st.byMonth[m]} activities, ${dn(m)} of them completed.`);}
  const sum=ms.reduce((s,m)=>s+st.byMonth[m],0),avg=sum/ms.length;
  const peak=[...ms].sort((a,b)=>st.byMonth[b]-st.byMonth[a])[0],low=[...ms].sort((a,b)=>st.byMonth[a]-st.byMonth[b])[0];
  const f=ms[0],l=ms[ms.length-1],fv=st.byMonth[f],lv=st.byMonth[l];
  const lastOpen=l>=curM,dir=(lv>fv?L('meningkat','increased'):lv<fv?L('menurun','decreased'):L('sama','unchanged'))+(lastOpen?L(' (catatan: bulan tersebut masih berjalan atau belum tiba, sehingga angkanya dapat bertambah)',' (note: that month is current or upcoming, so the figure may still grow)'):'');
  const gaps=ms.map(m=>[m,st.byMonth[m]-dn(m)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
  let gapTxt;
  if(!gaps.length)gapTxt=L('Garis kegiatan selesai berimpit dengan batang di setiap bulan, artinya seluruh kegiatan per bulan sudah selesai.','The completed line matches the bars every month, so all activities are completed.');
  else{const g=gaps[0],ongoing=g[0]>=curM&&!(lastOpen&&g[0]===l);gapTxt=L(`Selisih terbesar antara batang (total) dan garis (selesai) terdapat pada **${ml(g[0])}**, dengan ${g[1]} kegiatan belum berstatus selesai${ongoing?', yang wajar karena bulan tersebut masih berjalan atau belum tiba':''}.`,`The largest gap between bars (total) and line (completed) is in **${ml(g[0])}**, with ${g[1]} activities not yet completed${ongoing?', which is expected as that month is current or upcoming':''}.`);}
  return L(`Dalam ${ms.length} bulan, rata-rata terdapat ${cmRptFmt1(avg,lang)} kegiatan per bulan. Puncak kegiatan terjadi pada **${ml(peak)}** (${st.byMonth[peak]} kegiatan)${peak!==low?`, sedangkan yang paling sedikit pada ${ml(low)} (${st.byMonth[low]} kegiatan)`:''}. Dibandingkan ${ml(f)} (${fv} kegiatan), jumlah kegiatan pada ${ml(l)} (${lv} kegiatan) ${dir==='sama'?'tetap sama':dir}. ${gapTxt}`,
    `Over ${ms.length} months there were on average ${cmRptFmt1(avg,lang)} activities per month. The peak was **${ml(peak)}** (${st.byMonth[peak]})${peak!==low?`, the lowest ${ml(low)} (${st.byMonth[low]})`:''}. Compared with ${ml(f)} (${fv}), ${ml(l)} (${lv}) ${dir}. ${gapTxt}`);
}
function cmRptNarrStatus(st,total,lang){
  const L=(i,e)=>cmRptT(lang,i,e),e=Object.entries(st.byStatusKey).sort((a,b)=>b[1]-a[1]);if(!e.length)return '';
  const g=k=>st.byStatusKey[k]||0,done=g('Completed'),up=g('Scheduled')+g('Ongoing'),del=g('Pending')+g('Postponed'),cx=g('Cancelled')+g('Not Attended');
  const top=e[0];let t=(top[0]!=='Completed'?L(`Status terbanyak adalah **${cmRptStatus(top[0])}** (${top[1]} kegiatan, ${cmRptPct(top[1],total)}%). `,`The most common status is **${cmRptStatus(top[0])}** (${top[1]}, ${cmRptPct(top[1],total)}%). `):'')+L(`Dari ${total} kegiatan, **${done} (${cmRptPct(done,total)}%) sudah selesai**`,`Of ${total} activities, **${done} (${cmRptPct(done,total)}%) are completed**`);
  const parts=[];if(up)parts.push(L(`${up} masih terjadwal atau berlangsung`,`${up} scheduled or ongoing`));if(del)parts.push(L(`${del} menunggu konfirmasi atau ditunda dan perlu dipantau`,`${del} awaiting confirmation or postponed and need monitoring`));if(cx)parts.push(L(`${cx} dibatalkan atau tidak dihadiri`,`${cx} cancelled or not attended`));
  t+=(parts.length?(lang==='en'?'; ':', sementara ')+cmRptJoin(parts,lang):'')+'.';
  if(st.needsUpdate)t+=L(` Terdapat ${st.needsUpdate} kegiatan yang tanggalnya sudah lewat tetapi statusnya belum diperbarui, sehingga capaian sebenarnya bisa lebih tinggi dari yang tampak di grafik.`,` ${st.needsUpdate} past activities have not had their status updated, so actual completion may be higher than shown.`);
  return t;
}
function cmRptNarrDist(obj,total,lang,o){
  // o: {noun:['kategori','category'], shown:8}
  const L=(i,e)=>cmRptT(lang,i,e),noun=lang==='en'?o.noun[1]:o.noun[0],all=Object.entries(obj).filter(([k])=>k!=='-').sort((a,b)=>b[1]-a[1]);
  const blank=obj['-']||0,blankTxt=blank?L(` Sebanyak ${blank} kegiatan belum mencantumkan ${noun}.`,` ${blank} activities have no ${noun} recorded.`):'';
  if(!all.length)return L(`Belum ada data ${noun} yang dapat dipetakan.`,`No ${noun} data to map yet.`)+blankTxt;
  const n=all.length,top=all[0];
  if(n===1)return L(`Seluruh kegiatan yang tercatat (${top[1]}) berasal dari ${noun} **${top[0]}**.`,`All recorded activities (${top[1]}) come from ${noun} **${top[0]}**.`)+blankTxt;
  const k=Math.min(3,n),topK=all.slice(0,k),share=cmRptPct(topK.reduce((s,x)=>s+x[1],0),total);
  const rest=all.slice(1,k).map(x=>`${x[0]} (${x[1]})`);
  let t=L(`Terdapat ${n} ${noun} yang tercatat. **${top[0]}** paling menonjol dengan ${top[1]} kegiatan (${cmRptPct(top[1],total)}% dari total)${rest.length?`, disusul ${cmRptJoin(rest,lang)}`:''}.`,`${n} ${noun} are recorded. **${top[0]}** leads with ${top[1]} activities (${cmRptPct(top[1],total)}%)${rest.length?`, followed by ${cmRptJoin(rest,lang)}`:''}.`);
  if(n>3){const t1=cmRptPct(top[1],total),conc=share>=70||t1>=40;t+=L(` ${k} ${noun} teratas mencakup ${share}% kegiatan, ${conc?(t1>=40?`dengan porsi terbesar pada ${top[0]} sehingga kegiatan cenderung terkonsentrasi`:'menunjukkan kegiatan terkonsentrasi pada sedikit '+noun):'menunjukkan sebaran yang relatif merata'}.`,` The top ${k} account for ${share}% of activities, ${conc?(t1>=40?`with ${top[0]} taking the largest share, so activities are concentrated`:'showing a strong concentration'):'showing a fairly even spread'}.`);}
  if(o.shown&&n>o.shown)t+=L(` Grafik menampilkan ${o.shown} ${noun} teratas; ${n-o.shown} lainnya tidak ditampilkan.`,` The chart shows the top ${o.shown}; ${n-o.shown} others are omitted.`);
  return t+blankTxt;
}
function cmRptNarrPic(st,total,lang){
  const L=(i,e)=>cmRptT(lang,i,e),all=Object.entries(st.byPic).sort((a,b)=>b[1]-a[1]);if(!all.length)return L('Belum ada PIC yang tercatat pada kegiatan periode ini.','No PICs recorded in this period.');
  const n=all.length,sum=all.reduce((s,x)=>s+x[1],0),avg=sum/n,top=all[0],minV=all[n-1][1],lows=all.filter(x=>x[1]===minV).map(x=>x[0]);
  let t=L(`Sebanyak ${n} PIC terlibat, dengan rata-rata ${cmRptFmt1(avg,lang)} kegiatan per orang. **${top[0]}** paling banyak terlibat (${top[1]} kegiatan atau ${cmRptPct(top[1],total)}% dari seluruh kegiatan)`,`${n} PICs were involved, averaging ${cmRptFmt1(avg,lang)} activities each. **${top[0]}** was most involved (${top[1]}, ${cmRptPct(top[1],total)}% of all activities)`);
  t+=n>1&&top[1]>=avg*1.5?L(', cukup jauh di atas rata-rata sehingga pemerataan beban kerja perlu diperhatikan.',', well above average, so workload balance deserves attention.'):L('; beban kerja antar-PIC relatif seimbang.','; workload is fairly balanced.');
  if(n>1&&minV<top[1]){const lw=lows.length>4?`${lows.slice(0,4).join(', ')}${lang==='en'?`, and ${lows.length-4} others`:`, serta ${lows.length-4} PIC lainnya`}`:cmRptJoin(lows,lang);t+=L(` Keterlibatan paling sedikit: ${lw} (masing-masing ${minV} kegiatan).`,` Least involved: ${lw} (${minV} each).`);}
  return t;
}
function cmRptNarrDocs(have,miss,base,lang,done){
  const L=(i,e)=>cmRptT(lang,i,e),lab=CM_RPT_DOC_KEYS.map(k=>cmRptDocLabel(k,lang)),idx=lab.map((_,i)=>i);
  const best=[...idx].sort((a,b)=>have[b]-have[a])[0],worst=[...idx].sort((a,b)=>miss[b]-miss[a])[0];
  const full=idx.filter(i=>have[i]===base).map(i=>lab[i]),zero=idx.filter(i=>have[i]===0).map(i=>lab[i]);
  const unitTxt=done?L('kegiatan selesai','completed activities'):L('kegiatan','activities');
  if(!idx.some(i=>miss[i]))return L(`Seluruh ${base} ${unitTxt} sudah dilengkapi kelima jenis dokumen.`,`All ${base} ${unitTxt} have all five document types.`);
  let t=full.length?L(`${cmRptJoin(full,lang)} sudah tersedia di seluruh ${base} ${unitTxt}. `,`${cmRptJoin(full,lang)} is available for all ${base} ${unitTxt}. `):(have[best]?L(`Dokumen yang paling banyak tersedia adalah **${lab[best]}** (${have[best]} dari ${base} ${unitTxt}). `,`The most available document is **${lab[best]}** (${have[best]} of ${base}). `):'');
  if(zero.length)t+=L(`**${cmRptJoin(zero,lang)}** belum tersedia sama sekali. `,`**${cmRptJoin(zero,lang)}** is not available for any activity. `);
  const others=idx.filter(i=>miss[i]>0&&have[i]>0).sort((a,b)=>miss[b]-miss[a]);
  if(others.length)t+=L(`Kekurangan lainnya: ${cmRptJoin(others.map(i=>`${lab[i]} (${miss[i]} belum ada)`),lang)}.`,`Other gaps: ${cmRptJoin(others.map(i=>`${lab[i]} (${miss[i]} missing)`),lang)}.`);
  else if(!zero.length)t+=L(`Kekurangan terbanyak ada pada **${lab[worst]}** (${miss[worst]} belum ada).`,`The largest gap is **${lab[worst]}** (${miss[worst]} missing).`);
  return t.trim();
}
function cmRptNarrIssues(K,lang,unitEntries){
  const L=(i,e)=>cmRptT(lang,i,e),c={};K.forEach(x=>{const n=cmRptThemeName(x.theme,lang);c[n]=(c[n]||0)+1});
  const e=Object.entries(c).sort((a,b)=>b[1]-a[1]);if(!e.length)return '';
  const hi=K.filter(x=>x.priority==='Tinggi').length;
  let t=L(`Kendala paling banyak terkait aspek **${e[0][0]}** (${e[0][1]} dari ${K.length} kendala, ${cmRptPct(e[0][1],K.length)}%)${e[1]?`, disusul aspek ${e[1][0]} (${e[1][1]})`:''}.`,`Most issues relate to **${e[0][0]}** (${e[0][1]} of ${K.length}, ${cmRptPct(e[0][1],K.length)}%)${e[1]?`, followed by ${e[1][0]} (${e[1][1]})`:''}.`);
  if(unitEntries&&unitEntries.length)t+=unitEntries.length===1?L(` Seluruh kendala berasal dari kegiatan ${unitEntries[0][0]}.`,` All issues come from ${unitEntries[0][0]}.`):L(` Dari sisi unit, **${unitEntries[0][0]}** mencatat kendala terbanyak (${unitEntries[0][1]}), diikuti ${unitEntries[1][0]} (${unitEntries[1][1]}).`,` By unit, **${unitEntries[0][0]}** has the most issues (${unitEntries[0][1]}), followed by ${unitEntries[1][0]} (${unitEntries[1][1]}).`);
  if(hi)t+=L(` Sebanyak ${hi} kendala berprioritas tinggi perlu ditangani lebih dahulu.`,` ${hi} high-priority issues should be addressed first.`);
  return t;
}
function cmRptNarrClarity(clear,actorOnly,unclear,lang){
  const L=(i,e)=>cmRptT(lang,i,e),n=clear+actorOnly+unclear;if(!n)return '';
  return L(`Dari ${n} tindak lanjut, ${clear} sudah jelas pihak dan target waktunya${actorOnly?`, ${actorOnly} baru jelas pihaknya`:''}${unclear?`, dan ${unclear} belum menyebutkan penanggung jawab`:''}.${actorOnly||unclear?' Tindak lanjut yang belum lengkap perlu dikonfirmasi pada koordinasi berikutnya agar dapat dipantau.':' Seluruh tindak lanjut sudah siap dipantau.'}`,
    `Of ${n} follow-ups, ${clear} have an owner and timeline${actorOnly?`, ${actorOnly} have an owner only`:''}${unclear?`, and ${unclear} have no owner`:''}.${actorOnly||unclear?' Incomplete ones should be confirmed at the next coordination meeting.':' All follow-ups are ready to be monitored.'}`);
}
function cmRptStatusCell(key,lang){const c=CM_RPT_STATUS_COLOR[key]||'#5B6B82';return {text:cmRptStatus(key||'Scheduled'),color:'FFFFFF',fill:c.replace('#',''),bold:true,align:'center'};}
async function cmRptBuildRangeModel(items,opts){
  cmRptAiFailed='';cmRptLangCur=opts.lang;const lang=opts.lang,L=(i,e)=>cmRptT(lang,i,e),st=cmReportStats(items),per=cmRptPeriod(items,lang),subj=cmRptSubject(lang),inc=opts.inc||{};
  const total=items.length,done=st.completed,rate=cmRptPct(done,total);
  const upcoming=(st.byStatusKey.Scheduled||0)+(st.byStatusKey.Ongoing||0),delayed=(st.byStatusKey.Pending||0)+(st.byStatusKey.Postponed||0);
  const units=Object.keys(st.byUnit).filter(k=>k!=='-').length,programs=Object.keys(st.byProgram).filter(k=>k!=='-').length,pics=Object.keys(st.byPic).length;
  const title=L('LAPORAN MONITORING DAN EVALUASI','MONITORING AND EVALUATION REPORT');
  const fileName=cmRptFileName(`${subj.text} - ${per.short}`);
  const signer=opts.signer||{};
  const blocks=[];let rangeAnalysis=null;
  const monthLabel=m=>dayjs(m+'-01').locale(lang==='en'?'en':'id').format('MMMM YYYY');
  // 1. Ringkasan
  blocks.push({t:'h1',text:L('Ringkasan Eksekutif','Executive Summary')});
  blocks.push({t:'kpis',items:[
    {label:L('Total kegiatan','Total activities'),value:total,sub:per.short,color:'2F5BD3'},
    {label:L('Selesai','Completed'),value:done,sub:`${rate}% ${L('dari total','of total')}`,color:'16A37F'},
    {label:L('Terjadwal / berjalan','Scheduled / ongoing'),value:upcoming,sub:L('belum selesai','not yet completed'),color:'F2A93B'},
    {label:L('Tertunda','Delayed'),value:delayed,sub:L('pending / ditunda','pending / postponed'),color:'E25563'},
    {label:L('Unit dilayani','Units served'),value:units,sub:`${programs} ${L('program','programs')}`,color:'7C5CE0'},
    {label:L('PIC terlibat','PICs involved'),value:pics,sub:L('anggota tim CM','CM team members'),color:'1BA7C9'}]});
  if(!total){blocks.push({t:'callout',tone:'warn',title:L('Tidak ada data','No data'),lines:[L('Tidak ada kegiatan yang sesuai filter aktif.','No activities match the active filters.')]});}
  else{
    const tm=st.topMonth[0]!=='-'?monthLabel(st.topMonth[0]):'-';
    blocks.push({t:'p',text:L(
      `Selama **${per.label}**, tercatat **${total} kegiatan** dalam lingkup ${subj.text.replace(/^Monitoring dan Evaluasi /,'').toLowerCase().startsWith('kegiatan')?'kegiatan Change Management':subj.text.replace(/^Monitoring dan Evaluasi /,'')}. Sebanyak **${done} kegiatan (${rate}%) telah selesai**, ${upcoming} masih terjadwal atau berjalan, dan ${delayed} tertunda. Bulan paling padat adalah **${tm}** dengan ${st.topMonth[1]} kegiatan.${subj.focus!=='unit'?` Unit yang paling banyak dilayani adalah **${st.topUnit[0]}** (${st.topUnit[1]} kegiatan).`:''}${subj.focus!=='program'?` Program dengan kegiatan terbanyak adalah **${st.topProgram[0]}** (${st.topProgram[1]} kegiatan).`:''}`,
      `During **${per.label}**, **${total} activities** were recorded. **${done} (${rate}%) are completed**, ${upcoming} are scheduled or ongoing, and ${delayed} are delayed. The busiest month was **${tm}** with ${st.topMonth[1]} activities.${subj.focus!=='unit'?` The most served unit was **${st.topUnit[0]}** (${st.topUnit[1]}).`:''}${subj.focus!=='program'?` The most active program was **${st.topProgram[0]}** (${st.topProgram[1]}).`:''}`)});
    const highlights=[];
    highlights.push(L(`Tingkat penyelesaian kegiatan ${rate}% (${done} dari ${total}).`,`Completion rate ${rate}% (${done} of ${total}).`));
    if(st.topKategori[0]!=='-')highlights.push(L(`Jenis kegiatan paling sering: ${st.topKategori[0]} (${st.topKategori[1]} kegiatan).`,`Most frequent activity type: ${st.topKategori[0]} (${st.topKategori[1]}).`));
    if(st.topPic[0]!=='-')highlights.push(L(`PIC paling aktif: ${st.topPic[0]} (${st.topPic[1]} kegiatan).`,`Most active PIC: ${st.topPic[0]} (${st.topPic[1]} activities).`));
    const notulaN=st.docsDone.notula||0,fotoN=st.docsDone.dokumentasi||0;
    if(done)highlights.push(L(`Bukti dari ${done} kegiatan selesai: notula tersedia di ${notulaN} kegiatan, dokumentasi foto di ${fotoN} kegiatan.`,`Evidence for ${done} completed activities: minutes in ${notulaN}, photos in ${fotoN}.`));
    blocks.push({t:'callout',tone:'info',title:L('Poin penting','Key points'),lines:highlights});
  }
  if(total&&inc.charts!==false){
    // 2. Tren & status
    blocks.push({t:'h1',text:L('Tren dan Status Kegiatan','Activity Trend and Status')});
    const months=Object.keys(st.byMonth).sort();
    const trend=await cmRptChart({type:'bar',data:{labels:months.map(m=>dayjs(m+'-01').locale(lang==='en'?'en':'id').format('MMM YY')),datasets:[
      {type:'bar',label:L('Total kegiatan','Total'),data:months.map(m=>st.byMonth[m]),backgroundColor:'#2F5BD3',borderRadius:6,maxBarThickness:46,order:2},
      {type:'line',label:L('Selesai','Completed'),data:months.map(m=>st.byMonthDone[m]||0),borderColor:'#16A37F',backgroundColor:'#16A37F',borderWidth:3,pointRadius:5,tension:.3,order:1,datalabels:{display:false}}]},
      options:{plugins:{legend:{position:'top'},datalabels:{anchor:'end',align:'top',color:'#12275A',font:{weight:'bold',size:15}}},scales:{x:{grid:{display:false},ticks:{color:'#344054',font:{size:15}}},y:{beginAtZero:true,ticks:{precision:0,color:'#344054',font:{size:15}},grid:{color:'#EEF1F6'}}}}},660,320);
    const sk=Object.keys(st.byStatusKey).sort((a,b)=>st.byStatusKey[b]-st.byStatusKey[a]);
    const status=await cmRptChart(cmRptDoughnutCfg(sk.map(k=>cmRptStatus(k)),sk.map(k=>st.byStatusKey[k]),sk.map(k=>CM_RPT_STATUS_COLOR[k]||'#5B6B82'),[`${rate}%`,L('selesai','completed')]),620,320);
    blocks.push({t:'charts',items:[{title:L('Jumlah kegiatan per bulan','Activities per month'),img:trend,caption:L('Batang = total kegiatan; garis = kegiatan selesai.','Bars = total; line = completed.')}]});
    blocks.push({t:'p',text:cmRptNarrTrend(st,lang)});
    blocks.push({t:'charts',items:[{title:L('Komposisi status kegiatan','Status composition'),img:status,caption:L('Persentase dihitung dari seluruh kegiatan pada periode laporan.','Percentages of all activities in the period.')}]});
    blocks.push({t:'p',text:cmRptNarrStatus(st,total,lang)});
    // 3. Sebaran
    blocks.push({t:'h1',text:L('Sebaran Kegiatan','Activity Distribution')});
    const kat=cmRptTop(st.byKategori,8);
    const katImg=await cmRptChart(cmRptBarCfg(kat.map(x=>x[0]),kat.map(x=>x[1]),{horizontal:true}),660,Math.max(220,60+kat.length*38));
    blocks.push({t:'charts',items:[{title:L('Kegiatan menurut jenis / kategori','Activities by category'),img:katImg}]});
    blocks.push({t:'p',text:cmRptNarrDist(st.byKategori,total,lang,{noun:['jenis kegiatan','activity types'],shown:8})});
    if(subj.focus!=='unit'){const un=cmRptTop(st.byUnit,8);const unImg=await cmRptChart(cmRptBarCfg(un.map(x=>x[0]),un.map(x=>x[1]),{horizontal:true,colors:un.map((_,i)=>['#7C5CE0','#9B84EA','#B6A6F0'][Math.min(i,2)])}),660,Math.max(220,60+un.length*38));blocks.push({t:'charts',items:[{title:L('Unit pemohon dengan kegiatan terbanyak','Top requesting units'),img:unImg}]});
      blocks.push({t:'p',text:cmRptNarrDist(st.byUnit,total,lang,{noun:['unit pemohon','requesting units'],shown:8})});}
    if(subj.focus!=='program'){const pr=cmRptTop(st.byProgram,8);const prImg=await cmRptChart(cmRptBarCfg(pr.map(x=>String(x[0]).slice(0,42)),pr.map(x=>x[1]),{horizontal:true,colors:pr.map((_,i)=>['#1BA7C9','#4DBCD6','#82D1E3'][Math.min(i,2)])}),660,Math.max(220,60+pr.length*38));blocks.push({t:'charts',items:[{title:L('Program dengan kegiatan terbanyak','Top programs'),img:prImg}]});
      blocks.push({t:'p',text:cmRptNarrDist(st.byProgram,total,lang,{noun:['program','programs'],shown:8})});}
    // 4. PIC
    blocks.push({t:'h1',text:L('Keterlibatan Tim (PIC)','Team Involvement (PIC)')});
    const pc=cmRptTop(st.byPic,10);
    const pcImg=await cmRptChart(cmRptBarCfg(pc.map(x=>x[0]),pc.map(x=>x[1]),{horizontal:true,colors:pc.map(()=> '#F2A93B')}),660,Math.max(220,70+pc.length*38));
    blocks.push({t:'charts',items:[{title:L('Jumlah kegiatan per PIC','Activities per PIC'),img:pcImg,caption:L('Satu kegiatan dapat melibatkan lebih dari satu PIC.','One activity may involve several PICs.')}]});
    blocks.push({t:'p',text:cmRptNarrPic(st,total,lang)});
  }
  if(total&&inc.docs!==false){
    blocks.push({t:'h1',text:L('Kelengkapan Dokumen dan Bukti Kegiatan','Document and Evidence Completeness')});
    const base=done||total,src=done?st.docsDone:st.docs;
    const have=CM_RPT_DOC_KEYS.map(k=>Math.min(src[k]||0,base)),miss=have.map(v=>base-v);
    const docCfg={type:'bar',data:{labels:CM_RPT_DOC_KEYS.map(k=>cmRptDocLabel(k,lang)),datasets:[
        {label:L('Sudah ada','Available'),data:have,backgroundColor:'#2F5BD3',maxBarThickness:28,datalabels:{color:'#ffffff',anchor:'center',align:'center',font:{weight:'bold',size:15},formatter:v=>v>0?v:''}},
        {label:L('Belum ada','Not yet'),data:miss,backgroundColor:'#E4E8F0',maxBarThickness:28,datalabels:{color:'#5B6B82',anchor:'center',align:'center',font:{weight:'bold',size:15},formatter:v=>v>0?v:''}}]},
      options:{indexAxis:'y',plugins:{legend:{position:'top',align:'start'}},
        scales:{x:{stacked:true,beginAtZero:true,max:base,grid:{color:'#EEF1F6'},ticks:{precision:0,color:'#344054',font:{size:15}}},y:{stacked:true,grid:{display:false},ticks:{color:'#344054',font:{size:15}}}}}};
    const docImg=await cmRptChart(docCfg,660,300);
    blocks.push({t:'p',text:L(`Grafik berikut menunjukkan jumlah ${done?'kegiatan selesai':'kegiatan'} yang sudah dan belum dilengkapi setiap jenis dokumen, dari total ${base} ${done?'kegiatan selesai':'kegiatan'}.`,`The chart shows how many ${done?'completed ':''}activities already have each document type and how many do not, out of ${base}.`)});
    blocks.push({t:'charts',items:[{title:L('Jumlah kegiatan menurut kelengkapan dokumen','Activities by document availability'),img:docImg}]});
    blocks.push({t:'p',text:cmRptNarrDocs(have,miss,base,lang,!!done)});
    blocks.push({t:'table',head:[L('Jenis dokumen','Document'),L('Sudah ada','Available'),L('Belum ada','Not yet')],widths:[50,25,25],rows:CM_RPT_DOC_KEYS.map((k,i)=>[cmRptDocLabel(k,lang),{text:String(have[i]),bold:true,align:'center'},{text:String(miss[i]),align:'center'}])});
  }
  if(total&&inc.list!==false){
    blocks.push({t:'h1',text:L('Daftar Kegiatan','Activity List')});
    const shown=items.slice(0,300);
    blocks.push({t:'table',small:true,head:['No',L('Tanggal','Date'),L('Kegiatan','Activity'),L('Unit','Unit'),'Program','PIC','Status',L('Dok.','Docs')],widths:[5,12,30,10,14,12,11,6],
      rows:shown.map((a,i)=>[String(i+1),fmtDate(a.tglMulai),cmRptActCell(a,lang),cmReportSafe(a.unitPemohon),cmReportSafe(a.programTerkait),((typeof cmPicList==='function'?cmPicList(a.picTimCM):String(a.picTimCM||'').split(',').map(x=>x.trim()).filter(Boolean)).join('\n')||'-'),cmRptStatusCell(a.statusNorm,lang),{text:cmRptDocPct(a)+'%',align:'center'}])});
    if(items.length>shown.length)blocks.push({t:'p',text:L(`Ditampilkan 300 dari ${items.length} kegiatan.`,`Showing 300 of ${items.length} activities.`),muted:true});
  }
  if(total&&inc.gallery!==false){
    const cand=items.filter(a=>parseDokumentasi(a.dokumentasi).length).sort((a,b)=>(b.statusNorm==='Completed')-(a.statusNorm==='Completed')).slice(0,8),imgs=[];
    for(const a of cand){const r=await cmRptImagesFor(a,1);if(r[0])imgs.push({...r[0],caption:`${fmtDate(a.tglMulai)} · ${cmReportSafe(a.namaKegiatan).slice(0,70)}`});}
    if(imgs.length){blocks.push({t:'h1',text:L('Dokumentasi Kegiatan','Activity Documentation')});blocks.push({t:'gallery',images:imgs});}
  }
  if(total&&inc.analysis!==false){
    const K=[],T=[];let analysed=0;
    for(const a of items){
      if(!cmRptHas(a.catatan)&&!parseActivityNotula(a.notula).length)continue;
      const src=await cmRptActivitySources(a,lang);if(!src.length)continue;analysed++;
      const an=cmRptAnalyzeSources(src,{actors:(typeof cmPicList==='function'?cmPicList(a.picTimCM):String(a.picTimCM||'').split(',').map(x=>x.trim()).filter(Boolean))});
      const act=`${fmtDate(a.tglMulai)} · ${cmReportSafe(a.namaKegiatan).slice(0,70)}`;
      const kTop=[...an.kendala].sort((x,y)=>(y.priority==='Tinggi')-(x.priority==='Tinggi')).slice(0,5);
      const tScore=x=>(x.decision?3:0)+(x.actor?2:0)+(x.due?2:0);
      const tTop=[...an.tl].map((x,i)=>({x,i})).sort((p,q)=>tScore(q.x)-tScore(p.x)||p.i-q.i).slice(0,6).map(o=>o.x);
      kTop.forEach(x=>K.push({...x,act,unit:cmReportSafe(a.unitPemohon),date:a.tglMulai}));
      tTop.forEach(x=>T.push({...x,act,unit:cmReportSafe(a.unitPemohon),date:a.tglMulai,score:tScore(x)}));
    }
    rangeAnalysis={K,T,analysed};
    const hiK=K.filter(x=>x.priority==='Tinggi').length,recsT=cmRptThemeRecs(K,T,lang),allT=[...T,...recsT],clearT=allT.filter(x=>x.actor&&x.due).length,unclearT=allT.filter(x=>!x.actor).length;
    const thc={};K.forEach(x=>{const n=cmRptThemeName(x.theme,lang);thc[n]=(thc[n]||0)+1});const topTh=Object.entries(thc).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0]);
    blocks.push({t:'h1',text:L('Identifikasi Kendala','Issue Identification')});
    blocks.push({t:'p',text:L(
      `Analisis dilakukan terhadap catatan dan notula dari **${analysed} kegiatan** (maksimal 5 kendala dan 6 tindak lanjut paling relevan per kegiatan) (${cmRptPct(analysed,total)}% dari ${total} kegiatan). Teridentifikasi **${K.length} kendala**${K.length?` (${hiK} prioritas tinggi)`:''}${topTh.length?` yang didominasi aspek **${topTh.join('** dan **')}**`:''}, serta **${T.length} rencana tindak lanjut**. ${analysed<total?`Sebanyak ${total-analysed} kegiatan belum memiliki catatan/notula sehingga kendalanya belum dapat dipetakan.`:''}`,
      `Notes and minutes from **${analysed} activities** (${cmRptPct(analysed,total)}% of ${total}) were analysed, revealing **${K.length} issues**${K.length?` (${hiK} high priority)`:''}${topTh.length?`, mainly on **${topTh.join('** and **')}**`:''}, and **${T.length} follow-up actions**. ${analysed<total?`${total-analysed} activities have no notes/minutes yet.`:''}`)});
    blocks.push({t:'kpis',items:[
      {label:L('Kegiatan dianalisis','Activities analysed'),value:analysed,sub:`${cmRptPct(analysed,total)}% ${L('punya catatan/notula','with notes/minutes')}`,color:'1BA7C9'},
      {label:L('Kendala','Issues'),value:K.length,sub:`${hiK} ${L('prioritas tinggi','high priority')}`,color:'E25563'},
      {label:L('Kejelasan tindak lanjut','Follow-up clarity'),value:allT.length?cmRptPct(clearT,allT.length)+'%':'-',sub:`${allT.length} ${L('tindak lanjut','follow-ups')}`,color:'16A37F'}]});
    if(K.length){
      const kImg=await cmRptThemeChart(K,lang);
      const uc={};K.forEach(x=>uc[x.unit]=(uc[x.unit]||0)+1);const ue=Object.entries(uc).filter(x=>x[0]!=='-').sort((a,b)=>b[1]-a[1]).slice(0,8);
      const uImg=ue.length?await cmRptChart(cmRptBarCfg(ue.map(x=>x[0]),ue.map(x=>x[1]),{horizontal:true,colors:ue.map(()=> '#E25563')}),560,Math.max(200,70+ue.length*40)):null;
      blocks.push({t:'charts',items:[{title:L('Kendala menurut aspek','Issues by aspect'),img:kImg},...(uImg?[{title:L('Kendala menurut unit','Issues by unit'),img:uImg}]:[])]});
      blocks.push({t:'p',text:cmRptNarrIssues(K,lang,ue)});
      const sorted=[...K].sort((a,b)=>(b.priority==='Tinggi')-(a.priority==='Tinggi')||String(b.date).localeCompare(String(a.date)));
      blocks.push({t:'table',small:true,head:['No',L('Kegiatan','Activity'),L('Kendala','Issue'),L('Aspek','Aspect'),L('Prioritas','Priority')],widths:[5,24,45,15,11],rows:sorted.slice(0,30).map((x,i)=>[String(i+1),x.act,x.text,cmRptThemeName(x.theme,lang),cmRptPriorityCell(x.priority,lang)])});
      if(K.length>30)blocks.push({t:'p',muted:true,text:L(`Ditampilkan 30 dari ${K.length} kendala (prioritas tinggi didahulukan).`,`Showing 30 of ${K.length} issues.`)});
    }else blocks.push({t:'callout',tone:analysed?'good':'warn',title:analysed?L('Tidak ada kendala menonjol','No notable issues'):L('Belum ada bahan analisis','No material to analyse'),lines:[analysed?L('Tidak ditemukan kendala pada catatan/notula kegiatan periode ini.','No issues found in this period\'s notes/minutes.'):L('Belum ada kegiatan dengan catatan atau notula pada periode ini.','No activities with notes or minutes in this period.')]});
    blocks.push({t:'h1',text:L('Tindak Lanjut','Follow-up Actions')});
    if(allT.length){
      blocks.push({t:'p',text:L(`Terdapat **${allT.length} tindak lanjut**; **${clearT} (${cmRptPct(clearT,allT.length)}%)** sudah jelas pihak dan target waktunya${unclearT?`, dan **${unclearT} belum memiliki penanggung jawab**`:''}.${recsT.length?` ${recsT.length} di antaranya merupakan rekomendasi monev untuk aspek kendala yang belum ditindaklanjuti.`:''}`,`**${allT.length} follow-ups**; **${clearT} (${cmRptPct(clearT,allT.length)}%)** have an owner and timeline${unclearT?`, **${unclearT} have no owner**`:''}.`)});
      const tl=[...T].sort((a,b)=>(b.score||0)-(a.score||0)||String(b.date).localeCompare(String(a.date)));
      blocks.push({t:'table',small:true,head:['No',L('Kegiatan','Activity'),L('Tindak lanjut','Action'),L('Pihak','Owner'),L('Target','Timeline')],widths:[5,22,43,16,14],rows:[...tl.slice(0,30),...recsT].map((x,i)=>[String(i+1),x.rec?{text:L('Rekomendasi monev','M&E recommendation'),color:'5B3FC4',bold:true}:x.act,(x.decision?L('**[Kesepakatan]** ','**[Agreed]** '):'')+x.text,x.actor||{text:L('Perlu ditetapkan','To be assigned'),color:'C53030',bold:true},x.due||{text:L('Belum ditentukan','Not set'),color:'B7791F'}])});
      if(T.length>30)blocks.push({t:'p',muted:true,text:L(`Ditampilkan 30 dari ${T.length} tindak lanjut.`,`Showing 30 of ${T.length} follow-ups.`)});
    }else blocks.push({t:'callout',tone:'info',title:L('Belum ada tindak lanjut','No follow-up yet'),lines:[L('Belum ada rencana tindak lanjut yang tercatat pada periode ini.','No follow-up actions recorded in this period.')]});
  }
  if(opts.ai&&total){
    const ctx=cmRptRangeContext(items,st,per,subj,lang,rangeAnalysis);
    const ai=await cmRptAi(ctx,lang,'range',{dateFrom:per.from||'',dateTo:per.to||'',activityIds:items.map(x=>x.id)});
    if(ai&&ai.length)blocks.push({t:'ai',title:L('Analisis Berbasis AI','AI-assisted Analysis'),note:L('Mohon ditelaah sebelum digunakan.','Please review before use.')+(ai.model?` · Model: ${ai.model}`:''),sections:ai});else cmRptAiFailed=cmRptAiLastError||'unknown';
  }
  const qr=cmRptQr(`TTE-PLACEHOLDER | ${title} ${per.label} | ${subj.text}`);
  return {kind:'range',lang,fileName,title:`${title} ${per.label.toUpperCase()}`,
    cover:{kicker:title,title:per.label.toUpperCase(),subject:subj.text,chips:[`${total} ${L('kegiatan','activities')}`,`${rate}% ${L('selesai','completed')}`],
      scope:cmReportFilterSummary(items,lang),meta:[[L('Periode laporan','Report period'),per.range||per.label],[L('Lingkup','Scope'),subj.text],[L('Jumlah kegiatan','Activities'),String(total)],[L('Disusun oleh','Prepared by'),'Pusmantap — BaTii (CMO Kemenkeu)'],[L('Tanggal penyusunan','Prepared on'),cmRptLongDate(signer.date||dayjs().format('YYYY-MM-DD'),lang)]],
      tte:{qr,name:signer.name,title:signer.title,label:signer.label,city:signer.city,date:cmRptLongDate(signer.date||dayjs().format('YYYY-MM-DD'),lang)}},
    header:`${subj.text} · ${per.short}`,blocks};
}
function cmRptRangeContext(items,st,per,subj,lang,ra){
  const lines=[`REPORT: ${subj.text} | PERIOD: ${per.label} (${per.range||'-'}) | TOTAL=${items.length} | COMPLETED=${st.completed} | NEEDS_STATUS_UPDATE=${st.needsUpdate}`,
    `BY_STATUS: ${Object.entries(st.byStatus).map(([k,v])=>k+'='+v).join(', ')}`,
    `BY_MONTH: ${Object.entries(st.byMonth).sort().map(([k,v])=>k+'='+v).join(', ')}`,
    `BY_CATEGORY: ${cmRptTop(st.byKategori,10).map(([k,v])=>k+'='+v).join(', ')}`,
    `BY_UNIT: ${cmRptTop(st.byUnit,10).map(([k,v])=>k+'='+v).join(', ')}`,
    `BY_PROGRAM: ${cmRptTop(st.byProgram,10).map(([k,v])=>k+'='+v).join(', ')}`,
    `BY_PIC: ${cmRptTop(st.byPic,10).map(([k,v])=>k+'='+v).join(', ')}`,
    `DOCS_ON_COMPLETED: ${CM_RPT_DOC_KEYS.map(k=>k+'='+st.docsDone[k]+'/'+st.completed).join(', ')}`];
  if(ra){lines.push(`ISSUES_FROM_NOTES (${ra.K.length}, from ${ra.analysed} activities with notes/minutes):`);ra.K.slice(0,30).forEach(x=>lines.push(`- [${x.priority}] ${x.act}: ${x.text.slice(0,220)}`));lines.push(`FOLLOWUPS_FROM_NOTES (${ra.T.length}):`);ra.T.slice(0,30).forEach(x=>lines.push(`- ${x.act}: ${x.text.slice(0,220)} | owner=${x.actor||'-'} | due=${x.due||'-'}`));}
  lines.push('ACTIVITIES:');
  items.slice(0,80).forEach(a=>lines.push(`- ${a.tglMulai} | ${cmReportSafe(a.namaKegiatan).slice(0,120)} | ${cmReportSafe(a.kategori)} | ${cmReportSafe(a.unitPemohon)} | ${cmReportSafe(a.programTerkait)} | ${cmRptStatus(a.statusNorm)} | output: ${String(a.tujuanOutput||'-').slice(0,160)}`));
  return lines.join('\n');
}
async function cmRptBuildSingleModel(a,opts){cmRptAiFailed='';
  cmRptLangCur=opts.lang;const lang=opts.lang,L=(i,e)=>cmRptT(lang,i,e),signer=opts.signer||{};
  const flags=cmRptDocFlags(a),docPct=cmRptDocPct(a),start=a.tglMulai,end=a.tglSelesai||a.tglMulai;
  const days=Math.max(1,dayjs(end).diff(dayjs(start),'day')+1||1),pics=(typeof cmPicList==='function'?cmPicList(a.picTimCM):String(a.picTimCM||'').split(',').map(x=>x.trim()).filter(Boolean));
  const dateText=start===end?cmRptLongDate(start,lang):`${cmRptLongDate(start,lang)} – ${cmRptLongDate(end,lang)}`;
  const prog=cmRptHas(a.programTerkait)?a.programTerkait:'';
  const lokRaw=String(a.lokasiChannel||'').trim(),lokIsUrl=/^https?:\/\//i.test(lokRaw),lokText=lokIsUrl?L('Daring','Online')+(/teams\./i.test(lokRaw)?' (Microsoft Teams)':/zoom\./i.test(lokRaw)?' (Zoom)':''):lokRaw;
  const subject=prog?`${L('Monitoring dan Evaluasi Proyek','Monitoring and Evaluation of Project')} ${prog}`:L('Monitoring dan Evaluasi Kegiatan Change Management','Monitoring and Evaluation of Change Management Activity');
  const blocks=[];
  blocks.push({t:'h1',text:L('Ringkasan Kegiatan','Activity Summary')});
  blocks.push({t:'kpis',items:[
    {label:L('Tanggal','Date'),value:dayjs(start).isValid()?dayjs(start).locale(lang==='en'?'en':'id').format('D MMM'):'-',sub:dayjs(start).isValid()?dayjs(start).format('YYYY'):'',color:'2F5BD3'},
    {label:L('Waktu','Time'),value:cmReportSafe(a.waktu).split(/\s*-\s*/)[0]||'-',sub:cmRptHas(a.waktu)?a.waktu:L('Seharian','All day'),color:'1BA7C9'},
    {label:L('Durasi','Duration'),value:days,sub:L('hari','day(s)'),color:'7C5CE0'},
    {label:'Status',value:cmRptStatus(a.statusNorm),sub:a.statusNeedsUpdate?L('perlu pembaruan','needs update'):L('terkini','current'),color:(CM_RPT_STATUS_COLOR[a.statusNorm]||'#5B6B82').replace('#','')},
    {label:'PIC',value:pics.length||'-',sub:L('anggota tim','team members'),color:'F2A93B'},
    {label:L('Kelengkapan dokumen','Document completeness'),value:docPct+'%',sub:`${CM_RPT_DOC_KEYS.filter(k=>flags[k]).length} / 5`,color:docPct>=80?'16A37F':docPct>=50?'C28A1E':'E25563'}]});
  blocks.push({t:'p',text:L(
    `Kegiatan **${cmReportSafe(a.namaKegiatan)}** dilaksanakan pada **${dateText}**${cmRptHas(a.waktu)?` pukul ${a.waktu}`:''}${cmRptHas(lokText)?(lokIsUrl?` secara ${lokText.toLowerCase().replace('(microsoft teams)','melalui Microsoft Teams').replace('(zoom)','melalui Zoom')}`:` di ${lokText}`):''}. Kegiatan ini diajukan oleh **${cmReportSafe(a.unitPemohon)}**${prog?` dalam rangka **${prog}**`:''}, dengan PIC tim CM ${pics.length?pics.join(', '):'-'}. Status saat ini: **${cmRptStatus(a.statusNorm)}**.`,
    `**${cmReportSafe(a.namaKegiatan)}** took place on **${dateText}**${cmRptHas(a.waktu)?` at ${a.waktu}`:''}${cmRptHas(lokText)?` (${lokText})`:''}, requested by **${cmReportSafe(a.unitPemohon)}**${prog?` for **${prog}**`:''}, with CM PIC(s) ${pics.join(', ')||'-'}. Current status: **${cmRptStatus(a.statusNorm)}**.`)});
  blocks.push({t:'h1',text:L('Detail Kegiatan','Activity Details')});
  const link=typeof getMeetingLink==='function'?getMeetingLink(a):'';
  blocks.push({t:'kv',rows:[[L('Nama kegiatan','Activity'),cmReportSafe(a.namaKegiatan)],[L('Nomor undangan','Invitation no.'),cmRptInvNo(a,lang)||'-'],[L('Kategori','Category'),cmReportSafe(a.kategori)],['Program',cmReportSafe(a.programTerkait)],[L('Layanan','Service'),cmReportSafe(a.layanan)],[L('Unit pemohon','Requesting unit'),cmReportSafe(a.unitPemohon)],[L('Unit asal narasumber','Speaker unit'),cmReportSafe(a.unitAsalNarsum)],[L('Peserta / sasaran','Target participants'),cmReportSafe(a.pesertaTarget)],[L('Tanggal & waktu','Date & time'),`${dateText}${cmRptHas(a.waktu)?' · '+a.waktu:''}`],[L('Lokasi / kanal','Location / channel'),cmReportSafe(lokText)],...(cmRptHas(link)||lokIsUrl?[[L('Tautan rapat','Meeting link'),cmRptHas(link)?link:lokRaw]]:[]),['PIC Tim CM',(pics.join('\n')||'-')],...(Number(a.estimasiBiaya)>0?[[L('Estimasi biaya','Estimated cost'),fmtRupiah(a.estimasiBiaya)]]:[])]});
  if(cmRptHas(a.tujuanOutput))blocks.push({t:'callout',tone:'good',title:L('Tujuan dan output','Objective and output'),lines:[a.tujuanOutput]});
  // ===== analysis of catatan + notula =====
  const sources=await cmRptActivitySources(a,lang);
  const ana=cmRptAnalyzeSources(sources,{actors:pics});
  const adm=cmRptAdminIssues(a,lang);
  const kendala=[...ana.kendala.sort((x,y)=>(y.priority==='Tinggi')-(x.priority==='Tinggi')),...adm.k];
  const tlAll=[...ana.tl,...adm.t];const recs=cmRptThemeRecs(ana.kendala,ana.tl,lang);const tl=[...tlAll,...recs];
  const hi=kendala.filter(x=>x.priority==='Tinggi').length,clear=tl.filter(x=>x.actor&&x.due).length,actorOnly=tl.filter(x=>x.actor&&!x.due).length,unclear=tl.length-clear-actorOnly;
  const themeTop=(()=>{const c={};ana.kendala.forEach(x=>{const n=cmRptThemeName(x.theme,lang);c[n]=(c[n]||0)+1});return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0]);})();
  blocks.push({t:'h1',text:L('Hasil dan Analisis Kegiatan','Results and Analysis')});
  if(!sources.length){
    blocks.push({t:'callout',tone:'warn',title:L('Belum ada bahan analisis','No material to analyse'),lines:[L('Kegiatan ini belum memiliki catatan maupun notula, sehingga hasil, kendala, dan tindak lanjut belum dapat diidentifikasi dari substansi kegiatan. Analisis di bawah hanya mencakup aspek administrasi.','This activity has no notes or minutes, so results, issues and follow-ups cannot be identified from its substance. The analysis below covers administration only.')]});
  }else{
    const srcTxt=ana.sourcesUsed.join(', ');
    blocks.push({t:'p',text:L(
      `Analisis disusun dari **${srcTxt}**. Dari bahan tersebut teridentifikasi **${ana.kendala.length} kendala substantif**${ana.kendala.filter(x=>x.priority==='Tinggi').length?` (${ana.kendala.filter(x=>x.priority==='Tinggi').length} berprioritas tinggi)`:''}${themeTop.length?`, terutama pada aspek **${themeTop.join('** dan **')}**`:''}, serta **${ana.tl.length} rencana tindak lanjut**${ana.keputusan.length?` dan ${ana.keputusan.length} kesepakatan/keputusan`:''}. ${tl.length?`Sebanyak **${clear} dari ${tl.length} tindak lanjut (${cmRptPct(clear,tl.length)}%)** sudah jelas pihak dan target waktunya${unclear?`, sedangkan ${unclear} belum menyebutkan penanggung jawab`:''}.`:''}${recs.length?` Untuk kendala yang belum memiliki tindak lanjut eksplisit, laporan ini menambahkan ${recs.length} rekomendasi monev.`:''}`,
      `This analysis draws on **${srcTxt}**. It identifies **${ana.kendala.length} substantive issues**${themeTop.length?`, mainly on **${themeTop.join('** and **')}**`:''}, and **${ana.tl.length} follow-up actions**${ana.keputusan.length?` plus ${ana.keputusan.length} agreements/decisions`:''}. ${tl.length?`**${clear} of ${tl.length} follow-ups (${cmRptPct(clear,tl.length)}%)** have a clear owner and timeline.`:''}${recs.length?` ${recs.length} M&E recommendations were added for issues without an explicit follow-up.`:''}`)});
    const pts=[...ana.hasil.map(x=>x.text),...ana.keputusan.map(x=>L('Kesepakatan: ','Agreement: ')+x.text)].slice(0,8);
    if(pts.length)blocks.push({t:'callout',tone:'good',title:L('Pokok hasil kegiatan','Key results'),lines:pts});
  }
  blocks.push({t:'kpis',items:[
    {label:L('Kendala teridentifikasi','Issues identified'),value:kendala.length,sub:`${hi} ${L('prioritas tinggi','high priority')}`,color:'E25563'},
    {label:L('Tindak lanjut','Follow-ups'),value:tl.length,sub:`${ana.tl.length} ${L('dari notula/catatan','from minutes/notes')}`,color:'2F5BD3'},
    {label:L('Kejelasan tindak lanjut','Follow-up clarity'),value:tl.length?cmRptPct(clear,tl.length)+'%':'-',sub:L('punya pihak & target waktu','with owner & timeline'),color:'16A37F'}]});
  if(kendala.length||tl.length){
    const kImg=kendala.length?await cmRptThemeChart(kendala,lang):null;
    const tImg=tl.length?await cmRptChart(cmRptDoughnutCfg([L('Pihak & target jelas','Owner & timeline'),L('Pihak saja','Owner only'),L('Belum jelas','Unclear')],[clear,actorOnly,unclear],['#16A37F','#F2A93B','#E25563'],[`${cmRptPct(clear,tl.length)}%`,L('jelas','clear')]),560,280):null;
    const items=[];if(kImg)items.push({title:L('Kendala menurut aspek','Issues by aspect'),img:kImg});if(tImg)items.push({title:L('Kejelasan tindak lanjut','Follow-up clarity'),img:tImg});
    if(items.length){blocks.push({t:'charts',items});
      const nk=kImg?cmRptNarrIssues(kendala,lang,null):'',nt=tImg?cmRptNarrClarity(clear,actorOnly,unclear,lang):'';
      if(nk||nt)blocks.push({t:'p',text:[nk,nt].filter(Boolean).join(' ')});}
  }
  blocks.push({t:'h1',text:L('Identifikasi Kendala','Issue Identification')});
  if(kendala.length){
    blocks.push({t:'p',text:L('Kendala berikut diidentifikasi dari catatan, notula, dan data administrasi kegiatan. Prioritas **Tinggi** diberikan untuk kendala yang menghambat (belum/tidak dapat dilaksanakan, terlambat, resistensi) atau berdampak pada bukti dukung utama.','Issues below are identified from notes, minutes and activity data. **High** priority marks blocking issues or missing key evidence.')});
    blocks.push({t:'table',head:['No',L('Kendala','Issue'),L('Aspek','Aspect'),L('Prioritas','Priority'),L('Sumber','Source')],widths:[6,50,17,12,15],rows:kendala.slice(0,25).map((x,i)=>[String(i+1),x.text,cmRptThemeName(x.theme,lang),cmRptPriorityCell(x.priority,lang),x.src])});
  }else blocks.push({t:'callout',tone:'good',title:L('Tidak ada kendala menonjol','No notable issues'),lines:[L('Tidak ditemukan kendala pada catatan, notula, maupun data administrasi kegiatan.','No issues were found in notes, minutes, or activity data.')]});
  blocks.push({t:'h1',text:L('Tindak Lanjut','Follow-up Actions')});
  if(tl.length){
    blocks.push({t:'p',text:L('Daftar tindak lanjut disusun dari rencana aksi dan kesepakatan pada catatan/notula, dilengkapi rekomendasi monev untuk kendala yang belum ditindaklanjuti. Kolom pihak dan target yang kosong perlu dikonfirmasi pada koordinasi berikutnya.','Follow-ups come from action items and agreements in notes/minutes, plus M&E recommendations for unaddressed issues. Empty owner/timeline cells need confirmation.')});
    blocks.push({t:'table',head:['No',L('Tindak lanjut','Action'),L('Pihak','Owner'),L('Target waktu','Timeline'),L('Sumber','Source')],widths:[6,46,17,14,17],rows:tl.slice(0,30).map((x,i)=>[String(i+1),(x.decision?L('**[Kesepakatan]** ','**[Agreed]** '):'')+x.text,x.actor?x.actor:{text:L('Perlu ditetapkan','To be assigned'),color:'C53030',bold:true},x.due?x.due:{text:L('Belum ditentukan','Not set'),color:'B7791F'},x.rec?{text:x.src,color:'5B3FC4',bold:true}:x.src])});
  }else blocks.push({t:'callout',tone:'info',title:L('Belum ada tindak lanjut','No follow-up yet'),lines:[L('Belum ada rencana tindak lanjut yang tercatat.','No follow-up actions have been recorded.')]});
  // charts
  blocks.push({t:'h1',text:L('Gambaran Visual','Visual Overview')});
  const docImg=await cmRptChart(cmRptDoughnutCfg([L('Sudah ada','Available'),L('Belum ada','Missing')],[CM_RPT_DOC_KEYS.filter(k=>flags[k]).length,CM_RPT_DOC_KEYS.filter(k=>!flags[k]).length],['#16A37F','#E4E7EC'],[`${docPct}%`,L('lengkap','complete')]),560,280);
  const docBars=await cmRptChart(cmRptBarCfg(CM_RPT_DOC_KEYS.map(k=>cmRptDocLabel(k,lang)),CM_RPT_DOC_KEYS.map(k=>flags[k]?100:0),{horizontal:true,pct:true,max:100,colors:CM_RPT_DOC_KEYS.map(k=>flags[k]?'#16A37F':'#E25563')}),560,260);
  blocks.push({t:'charts',items:[{title:L('Kelengkapan dokumen kegiatan','Document completeness'),img:docImg},{title:L('Status per jenis dokumen','Status per document'),img:docBars,caption:L('Hijau = tersedia, merah = belum ada.','Green = available, red = missing.')}]});
  {const okL=CM_RPT_DOC_KEYS.filter(k=>flags[k]).map(k=>cmRptDocLabel(k,lang)),noL=CM_RPT_DOC_KEYS.filter(k=>!flags[k]).map(k=>cmRptDocLabel(k,lang)),isDone=a.statusNorm==='Completed';
    blocks.push({t:'p',text:!noL.length?L('Kelima jenis dokumen kegiatan (undangan, surat tugas, materi, notula, dan dokumentasi foto) sudah tersedia di dashboard.','All five document types are available in the dashboard.')
      :!okL.length?L(`Belum ada satu pun dokumen kegiatan yang diunggah ke dashboard.${isDone?' Karena kegiatan sudah selesai, bukti dukung perlu segera dilengkapi.':' Dokumen dapat dilengkapi seiring persiapan dan pelaksanaan kegiatan.'}`,`No documents have been uploaded yet.${isDone?' As the activity is completed, evidence should be uploaded soon.':''}`)
      :L(`Sebanyak ${okL.length} dari 5 jenis dokumen sudah tersedia, yaitu ${cmRptJoin(okL,lang)}. Dokumen yang belum ada: **${cmRptJoin(noL,lang)}**.${isDone?' Karena kegiatan sudah selesai, dokumen tersebut perlu segera dilengkapi sebagai bukti dukung.':' Dokumen tersebut dapat dilengkapi seiring persiapan dan pelaksanaan kegiatan.'}`,`${okL.length} of 5 document types are available: ${cmRptJoin(okL,lang)}. Missing: **${cmRptJoin(noL,lang)}**.${isDone?' As the activity is completed, these should be uploaded soon.':''}`)});}
  if(cmIsEoEnabled(a.eoEnabled)){
    const p=cmEoProgress(a.eoChecklist),phases=['Planning','Execution','Post Event'];
    if(p.total){const eoImg=await cmRptChart({type:'bar',data:{labels:phases.map(x=>cmEoPhaseLabel(x)),datasets:[{label:L('Selesai','Done'),data:phases.map(ph=>p.items.filter(x=>x.phase===ph&&x.done).length),backgroundColor:'#16A37F',borderRadius:5},{label:L('Belum','Open'),data:phases.map(ph=>p.items.filter(x=>x.phase===ph&&!x.done).length),backgroundColor:'#F2A93B',borderRadius:5}]},options:{plugins:{legend:{position:'top'},datalabels:{color:'#fff',font:{weight:'bold'},formatter:v=>v||''}},scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,beginAtZero:true,ticks:{precision:0}}}}},660,280);
      blocks.push({t:'charts',items:[{title:L(`Progres checklist EO (${p.pct}% selesai)`,`EO checklist progress (${p.pct}% done)`),img:eoImg}]});
      const open=phases.map(ph=>[ph,p.items.filter(x=>x.phase===ph&&!x.done).length]).sort((x,y)=>y[1]-x[1]),today=dayjs().format('YYYY-MM-DD'),over=p.items.filter(x=>!x.done&&x.dueDate&&x.dueDate<today).length;
      blocks.push({t:'p',text:p.done===p.total?L(`Seluruh ${p.total} item checklist EO sudah selesai di semua tahap.`,`All ${p.total} EO checklist items are done.`)
        :L(`Checklist EO berisi ${p.total} item, ${p.done} di antaranya sudah selesai (${p.pct}%). Item yang belum selesai paling banyak berada pada tahap **${cmEoPhaseLabel(open[0][0])}** (${open[0][1]} item).${over?` Sebanyak ${over} item sudah melewati tenggat dan perlu segera ditindaklanjuti.`:''}`,`The EO checklist has ${p.total} items, ${p.done} done (${p.pct}%). Most open items are in **${cmEoPhaseLabel(open[0][0])}** (${open[0][1]}).${over?` ${over} items are overdue.`:''}`)});}
  }
  if(prog){
    const y=String(start||'').slice(0,4),same=(state.agendas||[]).filter(x=>x.programTerkait===prog&&String(x.tglMulai||'').slice(0,4)===y),mo=Array.from({length:12},(_,i)=>`${y}-${String(i+1).padStart(2,'0')}`),cur=String(start||'').slice(0,7);
    if(same.length>1){const ctxImg=await cmRptChart(cmRptBarCfg(mo.map(m=>dayjs(m+'-01').locale(lang==='en'?'en':'id').format('MMM')),mo.map(m=>same.filter(x=>String(x.tglMulai||'').slice(0,7)===m).length),{colors:mo.map(m=>m===cur?'#F2A93B':'#C7D3F2')}),660,260);
      blocks.push({t:'charts',items:[{title:L(`Posisi kegiatan dalam ${prog} sepanjang ${y}`,`This activity within ${prog} in ${y}`),img:ctxImg,caption:L(`Batang oranye = bulan kegiatan ini. Total ${same.length} kegiatan ${prog} pada ${y}.`,`Orange bar = this activity's month. ${same.length} ${prog} activities in ${y}.`)}]});
      const cnt=mo.map(m=>[m,same.filter(x=>String(x.tglMulai||'').slice(0,7)===m).length]),act=cnt.filter(x=>x[1]>0),pk=[...cnt].sort((p,q)=>q[1]-p[1])[0],curN=(cnt.find(x=>x[0]===cur)||[cur,0])[1],mn=m=>dayjs(m+'-01').locale(lang==='en'?'en':'id').format('MMMM');
      blocks.push({t:'p',text:L(`Sepanjang ${y}, ${prog} memiliki ${same.length} kegiatan yang tersebar di ${act.length} bulan. Pada bulan kegiatan ini (${mn(cur)}) terdapat ${curN} kegiatan program${curN===pk[1]?', menjadikannya bulan tersibuk untuk program ini':`, sedangkan bulan tersibuk adalah ${mn(pk[0])} dengan ${pk[1]} kegiatan`}.`,`In ${y}, ${prog} has ${same.length} activities across ${act.length} months. This activity's month (${mn(cur)}) has ${curN}${curN===pk[1]?', the busiest month for the program':`; the busiest is ${mn(pk[0])} with ${pk[1]}`}.`)});}
  }
  // documents
  blocks.push({t:'h1',text:L('Dokumen dan Notula','Documents and Minutes')});
  const fileNames=raw=>parseActivityFiles(raw).map(x=>x.name||(typeof fileNameFromUrl==='function'?fileNameFromUrl(x.url||''):'')||'file').join(', ');
  const docRow=(label,ok,detail,na)=>[label,{text:na?L('Tidak ada / N/A','Not applicable'):ok?L('Tersedia','Available'):L('Belum ada','Missing'),color:'FFFFFF',fill:na?'8A94A6':ok?'16A37F':'E25563',bold:true,align:'center'},detail||'-'];
  const notes=parseActivityNotula(a.notula);
  blocks.push({t:'table',head:[L('Dokumen','Document'),'Status',L('Keterangan','Details')],widths:[24,16,60],rows:[
    docRow(cmRptDocLabel('undangan',lang),flags.undangan,[cmRptHas(a.undangan)?a.undangan:'',fileNames(a.undanganFiles)].filter(Boolean).join(' · '),cmRptDocNa(a,'undangan')),
    docRow(cmRptDocLabel('suratTugas',lang),flags.suratTugas,[cmRptHas(a.suratTugas)?a.suratTugas:'',fileNames(a.suratTugasFiles)].filter(Boolean).join(' · '),cmRptDocNa(a,'suratTugas')),
    docRow(cmRptDocLabel('materi',lang),flags.materi,[cmRptHas(a.materi)?(isUrlLike(a.materi)?fileNameFromUrl(a.materi):a.materi):'',fileNames(a.materiFiles)].filter(Boolean).join(' · ')),
    docRow(cmRptDocLabel('notula',lang),flags.notula,notes.map(n=>n.fileName).filter(Boolean).join(', ')),
    docRow(cmRptDocLabel('dokumentasi',lang),flags.dokumentasi,`${parseDokumentasi(a.dokumentasi).length} ${L('foto','photo(s)')}`)]});
  if(cmIsEoEnabled(a.eoEnabled)){const p=cmEoProgress(a.eoChecklist);if(p.total){blocks.push({t:'h1',text:L('Checklist EO / Event Organizer','EO Checklist')});blocks.push({t:'table',small:true,head:[L('Tahap','Phase'),L('Tugas','Task'),'PIC',L('Tenggat','Due'),'Status'],widths:[16,40,16,14,14],rows:p.items.map(x=>[cmEoPhaseLabel(x.phase),cmReportSafe(x.task),cmReportSafe(x.pic),x.dueDate?fmtDate(x.dueDate):'-',{text:x.done?L('Selesai','Done'):L('Belum','Open'),color:'FFFFFF',fill:x.done?'16A37F':'F2A93B',bold:true,align:'center'}])});}}
  const imgs=await cmRptImagesFor(a,12);
  if(imgs.length){blocks.push({t:'h1',text:L('Dokumentasi Foto','Photo Documentation')});blocks.push({t:'gallery',images:imgs});}
  else if(flags.dokumentasi){blocks.push({t:'h1',text:L('Dokumentasi Foto','Photo Documentation')});blocks.push({t:'callout',tone:'warn',title:L('Foto belum dapat dimuat','Photos could not be loaded'),lines:[L('Masuk (login) terlebih dahulu agar foto dokumentasi dapat disertakan dalam laporan.','Sign in so documentation photos can be included.')]});}
  // AI + monev notes
  if(opts.ai){const ctx=cmRptSingleContext(a,flags,lang,sources);const ai=await cmRptAi(ctx,lang,'single',{dateFrom:a.tglMulai||'',dateTo:a.tglSelesai||a.tglMulai||'',activityIds:[a.id]});if(ai&&ai.length)blocks.push({t:'ai',title:L('Analisis Berbasis AI','AI-assisted Analysis'),note:L('Mohon ditelaah sebelum digunakan.','Please review before use.')+(ai.model?` · Model: ${ai.model}`:''),sections:ai});else cmRptAiFailed=cmRptAiLastError||'unknown';}
  blocks.push({t:'h1',text:L('Kesimpulan Monev','M&E Conclusion')});
  const level=hi>=2||(tl.length&&unclear/tl.length>0.5)?['Perlu Pemantauan Intensif','Needs Close Monitoring','warn']:(kendala.length||tl.length)?['Pemantauan Berkala','Regular Monitoring','info']:['Terkendali','Under Control','good'];
  blocks.push({t:'callout',tone:level[2],title:`${L('Status tindak lanjut','Follow-up status')}: ${L(level[0],level[1])}`,lines:[L(
    `${kendala.length?`Terdapat ${kendala.length} kendala (${hi} prioritas tinggi) dan ${tl.length} tindak lanjut yang perlu dipantau.`:'Tidak terdapat kendala menonjol.'} ${unclear?`Prioritaskan penetapan penanggung jawab untuk ${unclear} tindak lanjut yang belum jelas.`:''} Perkembangan tindak lanjut agar dimutakhirkan pada dashboard dan dibahas pada koordinasi berikutnya. Peran Pusmantap dalam tindak lanjut bersifat pendampingan dan konsultatif.`,
    `${kendala.length?`${kendala.length} issues (${hi} high priority) and ${tl.length} follow-ups require monitoring.`:'No notable issues.'} ${unclear?`Assign owners for ${unclear} unclear follow-ups first.`:''} Progress should be updated in the dashboard and reviewed at the next coordination meeting. Pusmantap's role is advisory.`)]});
  const title=L('LAPORAN KEGIATAN','ACTIVITY REPORT');
  const qr=cmRptQr(`TTE-PLACEHOLDER | ${title} | ${a.id} | ${cmReportSafe(a.namaKegiatan).slice(0,80)}`);
  return {kind:'single',lang,fileName:cmRptFileName(`Laporan Kegiatan - ${cmReportSafe(a.namaKegiatan).slice(0,90)} - ${start||''}`),title:`${title} — ${cmReportSafe(a.namaKegiatan)}`,
    cover:{kicker:title,title:cmReportSafe(a.namaKegiatan),subject,chips:[cmRptStatus(a.statusNorm),cmReportSafe(a.kategori),dateText],scope:[],
      meta:[[L('Tanggal kegiatan','Activity date'),dateText],[L('Nomor undangan','Invitation no.'),cmRptInvNo(a,lang)||'-'],[L('Unit pemohon','Requesting unit'),cmReportSafe(a.unitPemohon)],['Program',cmReportSafe(a.programTerkait)],['PIC Tim CM',pics.join(', ')||'-'],[L('Disusun oleh','Prepared by'),'Pusmantap — BaTii (CMO Kemenkeu)'],[L('Tanggal penyusunan','Prepared on'),cmRptLongDate(signer.date||dayjs().format('YYYY-MM-DD'),lang)]],
      tte:{qr,name:signer.name,title:signer.title,label:signer.label,city:signer.city,date:cmRptLongDate(signer.date||dayjs().format('YYYY-MM-DD'),lang)}},
    header:`${L('Laporan Kegiatan','Activity Report')} · ${cmReportSafe(a.namaKegiatan).slice(0,70)}`,blocks};
}
function cmRptSingleContext(a,flags,lang,sources){
  const notes=(sources&&sources.length?sources.filter(x=>x.kind==='notula').map(x=>`${x.label}: ${String(x.text).slice(0,6000)}`):parseActivityNotula(a.notula).map(n=>`${n.fileName||'-'}: ${String(n.searchPreview||'').slice(0,1200)}`)).join('\n');
  return `ACTIVITY: ${cmReportSafe(a.namaKegiatan)}\nDATE: ${a.tglMulai}${a.tglSelesai&&a.tglSelesai!==a.tglMulai?' to '+a.tglSelesai:''} ${a.waktu||''}\nCATEGORY: ${cmReportSafe(a.kategori)} | PROGRAM: ${cmReportSafe(a.programTerkait)} | UNIT: ${cmReportSafe(a.unitPemohon)} | PIC: ${cmReportSafe(a.picTimCM)} | STATUS: ${cmRptStatus(a.statusNorm)}${a.statusNeedsUpdate?' (needs update)':''}\nLOCATION: ${cmReportSafe(a.lokasiChannel)} | PARTICIPANTS: ${cmReportSafe(a.pesertaTarget)}\nOBJECTIVE/OUTPUT: ${String(a.tujuanOutput||'-').slice(0,1500)}\nNOTES: ${String(a.catatan||'-').slice(0,1500)}\nDOCUMENTS: ${CM_RPT_DOC_KEYS.map(k=>k+'='+(flags[k]?'yes':'no')).join(', ')}\nMINUTES:\n${notes||'-'}`;
}
function cmRptInvNo(a,lang){const L=(i,e)=>lang==='en'?e:i,info=typeof cmInvitationInfo==='function'?cmInvitationInfo(typeof cmInvitationNo==='function'?cmInvitationNo(a):a?.undangan):null;if(!info)return '';if(info.kind==='official')return info.text;if(info.kind==='informal')return L('Informal (tanpa undangan)','Informal (no invitation)');return L(`Belum terbit (${info.text})`,`Not issued yet (${info.text})`);}
function cmRptActCell(a,lang){const n=cmRptInvNo(a,lang);return cmReportSafe(a.namaKegiatan)+(n?`\n${lang==='en'?'Invitation':'Undangan'}: ${n}`:'');}
function cmRptMd(s){return escapeHtml(String(s??'')).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');}
function cmRptHtml(model){
  const c=model.cover,L=(i,e)=>cmRptT(model.lang,i,e),F=!!model.formal;let n=0,m2=0,fg=0,tb=0,nn=false,an=0;const toc=[],figs=[],tabs=[];
  const tte0=c.tte||{};
  const tteHtml=`<div class="tte">${tte0.date?`<div class="tdt">${escapeHtml(tte0.city?tte0.city+', '+tte0.date:tte0.date)}</div>`:''}${tte0.label?`<div class="tlb">${escapeHtml(tte0.label)}</div>`:''}<div class="tj">${escapeHtml(tte0.title||L('[Jabatan]','[Position]'))}</div><div class="tsp"></div><div class="tl">${L('Ditandatangani secara elektronik','Electronically signed')}</div><div class="tn">${escapeHtml(tte0.name||L('[Nama Pejabat]','[Signer Name]'))}</div></div>`;
  const cell=v=>{if(v&&typeof v==='object'){const st=[v.fill?`background:#${v.fill}`:'',v.bg?`background:#${v.bg}`:'',v.color?`color:#${v.color}`:'',v.bold?'font-weight:700':'',v.align?`text-align:${v.align}`:''].filter(Boolean).join(';');return `<td style="${st}">${v.fill?`<span class="pill">${cmRptMd(v.text)}</span>`:cmRptMd(v.text)}</td>`;}return `<td>${cmRptMd(v)}</td>`;};
  const body=model.blocks.map(b=>{
    switch(b.t){
      case 'h1':if(b.nonum){nn=true;m2=0;an++;const id='app'+an;if(F)toc.push({l:1,id,t:b.text});return `<h2 class="sec pb" id="${id}">${escapeHtml(b.text)}</h2>`;}nn=false;n++;m2=0;if(F)toc.push({l:1,id:'sec'+n,t:n+'   '+b.text});return `<h2 class="sec" id="sec${n}"><span class="num">${n}</span>${escapeHtml(b.text)}</h2>`;
      case 'tte':return `<div class="endtte">${tteHtml}</div>`;
      case 'part':n=0;return `<div class="part${b.soft?' soft':''}"><span>${escapeHtml(b.kicker||'')}</span><b>${escapeHtml(b.text)}</b>${b.sub?`<small>${escapeHtml(b.sub)}</small>`:''}</div>`;
      case 'h2':{if(F&&nn){m2++;const id='app'+an+'_'+m2;toc.push({l:2,id,t:b.text});return `<h3 class="sub" id="${id}">${escapeHtml(b.text)}</h3>`;}if(F){m2++;const id='sec'+n+'_'+m2;toc.push({l:2,id,t:n+'.'+m2+'   '+b.text});return `<h3 class="sub" id="${id}">${n}.${m2}&nbsp;&nbsp;${escapeHtml(b.text)}</h3>`;}return `<h3 class="sub">${escapeHtml(b.text)}</h3>`;}
      case 'p':return `<p class="${b.muted?'muted':''}">${cmRptMd(b.text)}</p>`;
      case 'kpis':return `<div class="kpis">${b.items.map(k=>`<div class="kpi" style="--c:#${k.color}"><div class="kv">${escapeHtml(String(k.value))}</div><div class="kl">${escapeHtml(k.label)}</div><div class="ks">${escapeHtml(k.sub||'')}</div></div>`).join('')}</div>`;
      case 'charts':if(F)return b.items.map(x=>{fg++;const id='fig'+fg,t=`${L('Gambar','Figure')} ${fg}. ${x.title}`;figs.push({id,t});return `<figure class="chart ff" id="${id}">${x.img?`<img src="${x.img.src}" alt="">`:`<div class="noimg">${L('Grafik tidak tersedia','Chart unavailable')}</div>`}<figcaption class="fcap">${escapeHtml(t)}</figcaption>${x.caption?`<small>${escapeHtml(x.caption)}</small>`:''}</figure>`;}).join('');
        return `<div class="charts n${b.items.length}">${b.items.map(x=>`<figure class="chart"><figcaption>${escapeHtml(x.title)}</figcaption>${x.img?`<img src="${x.img.src}" alt="">`:`<div class="noimg">${L('Grafik tidak tersedia','Chart unavailable')}</div>`}${x.caption?`<small>${escapeHtml(x.caption)}</small>`:''}</figure>`).join('')}</div>`;
      case 'callout':return `<div class="callout ${b.tone||'info'}"><b>${escapeHtml(b.title)}</b>${b.lines.length>1?`<ul>${b.lines.map(l=>`<li>${cmRptMd(l)}</li>`).join('')}</ul>`:`<p>${cmRptMd(b.lines[0])}</p>`}</div>`;
      case 'bullets':return `<ul class="bul">${b.items.map(l=>`<li>${cmRptMd(l)}</li>`).join('')}</ul>`;
      case 'kv':return `<table class="kvt">${b.rows.map(r=>`<tr><th>${escapeHtml(r[0])}</th><td>${cmRptMd(r[1])}</td></tr>`).join('')}</table>`;
      case 'table':return (F&&b.caption?(()=>{tb++;const id='tab'+tb,t=`${L('Tabel','Table')} ${tb}. ${b.caption}`;tabs.push({id,t});return `<div class="tcap" id="${id}">${escapeHtml(t)}</div>`;})():'')+`<table class="tbl ${b.small?'small':''} ${b.fixed?'fixed':''}"><colgroup>${(b.widths||[]).map(w=>`<col style="width:${w}%">`).join('')}</colgroup><thead><tr>${b.head.map(h=>`<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r=>`<tr>${r.map(cell).join('')}</tr>`).join('')}</tbody></table>`;
      case 'gallery':return `<div class="gallery">${b.images.map(im=>`<figure><img src="${im.src}" alt=""><figcaption>${escapeHtml(im.caption||'')}</figcaption></figure>`).join('')}</div>`;
      case 'ai':return `<div class="ai"><div class="aih">✦ ${escapeHtml(b.title)}</div><div class="ain">${escapeHtml(b.note||'')}</div>${b.sections.map(s=>`${s.title?`<h4>${escapeHtml(s.title)}</h4>`:''}${s.paras.map(p=>`<p>${cmRptMd(p)}</p>`).join('')}${s.bullets.length?`<ul>${s.bullets.map(x=>`<li>${cmRptMd(x)}</li>`).join('')}</ul>`:''}`).join('')}</div>`;
      default:return '';
    }
  }).join('\n');
  const tte=c.tte||{};
  const fmList=(arr,empty)=>arr.length?arr.map(e=>`<a class="l${e.l||1}" href="#${e.id}">${escapeHtml(e.t)}</a>`).join(''):`<p class="muted">${escapeHtml(empty)}</p>`;
  const front=F?`<div class="sheet content front"><h2 class="fm">${L('DAFTAR ISI','TABLE OF CONTENTS')}</h2><div class="toc">${fmList(toc,'')}</div><h2 class="fm pb">${L('DAFTAR GAMBAR','LIST OF FIGURES')}</h2><div class="toc">${fmList(figs,L('Tidak terdapat gambar.','No figures.'))}</div><h2 class="fm pb">${L('DAFTAR TABEL','LIST OF TABLES')}</h2><div class="toc">${fmList(tabs,L('Tidak terdapat tabel.','No tables.'))}</div></div>`:'';
  return `<!doctype html><html lang="${model.lang}"><head><meta charset="utf-8"><title>${escapeHtml(model.fileName)}</title><style>
  @page{size:A4;margin:14mm 14mm 16mm}
  *{box-sizing:border-box}html{background:#E9EDF3}body{margin:0;font-family:'Segoe UI',Inter,Arial,sans-serif;color:#1d2433;font-size:13.5px;line-height:1.62;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .sheet{width:min(794px,100%);margin:18px auto;background:#fff;box-shadow:0 6px 24px rgba(16,24,40,.12);border-radius:6px;overflow:hidden}
  .cover{min-height:1090px;display:flex;flex-direction:column}
  .band{background:linear-gradient(120deg,#12275A 0%,#1F3F86 60%,#2F5BD3 100%);color:#fff;padding:34px 44px 30px;position:relative;overflow:hidden}.band .org{position:relative;z-index:1}
  .band:after{content:"";position:absolute;right:-60px;top:-60px;width:260px;height:260px;border-radius:50%;background:rgba(242,169,59,.22)}
  .org{font-size:11.5px;letter-spacing:.4px;opacity:.92;line-height:1.5}.org b{font-size:13px;letter-spacing:1px}
  .stripe{height:8px;background:linear-gradient(90deg,#F2A93B,#E25563,#7C5CE0,#1BA7C9,#16A37F)}
  .ctitle{padding:44px 44px 10px}.kick{color:#2F5BD3;font-weight:800;letter-spacing:1.6px;font-size:14px}
  .big{font-size:34px;line-height:1.18;font-weight:800;color:#12275A;margin:8px 0 10px}.subj{font-size:19px;color:#344054;font-weight:600}
  .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.chip{background:#EEF3FF;color:#1F3F86;border-radius:999px;padding:5px 13px;font-weight:700;font-size:12.5px}
  .scope{margin:18px 44px 0;background:#FFF8EC;border-left:5px solid #F2A93B;padding:10px 14px;border-radius:6px;font-size:12.5px}
  .meta{margin:18px 44px 0;border-collapse:collapse;width:calc(100% - 88px);font-size:13px}.meta th{text-align:left;color:#667085;font-weight:600;width:34%;padding:7px 0;border-bottom:1px solid #EEF1F6}.meta td{padding:7px 0;border-bottom:1px solid #EEF1F6;font-weight:600}
  .tte{margin:auto 56px 48px auto;width:340px;font-family:Arial,'Segoe UI',sans-serif;color:#111;font-size:14px;line-height:1.35}
  .tte .tdt{margin-bottom:14px}.tte .tlb{margin-bottom:12px}.tte .tj{margin-bottom:10px}
  .tte img{width:110px;height:110px;display:block}.tte .tsp{height:calc(5 * 1.35em)}.qrph{width:110px;height:110px;border:2px dashed #9AA7C2;display:flex;align-items:center;justify-content:center;color:#9AA7C2;font-weight:800}
  .tte .tl{color:#A0A4AB;font-size:14px;margin-top:4px}.tte .tn{font-size:14px;margin-top:2px}
  .content{padding:34px 44px 40px}
  .runhead{display:flex;justify-content:space-between;font-size:11px;color:#98A2B3;border-bottom:1px solid #EEF1F6;padding-bottom:8px;margin-bottom:6px}
  h2.sec{display:flex;align-items:center;gap:10px;color:#12275A;font-size:21px;margin:30px 0 12px;break-after:avoid}
  h2.sec .num{background:#12275A;color:#fff;border-radius:9px;min-width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;font-size:16px}
  p{margin:8px 0 10px}p.muted{color:#667085;font-size:12.5px}
  .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:10px 0 14px}
  .kpi{border-radius:12px;padding:14px 16px;background:color-mix(in srgb,var(--c) 10%,#fff);border:1px solid color-mix(in srgb,var(--c) 30%,#fff);border-top:5px solid var(--c);break-inside:avoid}
  .kv{font-size:28px;font-weight:800;color:var(--c);line-height:1.1}.kl{font-weight:700;color:#1d2433;margin-top:4px}.ks{font-size:12px;color:#667085}
  .charts{display:grid;gap:14px;margin:8px 0 14px}.charts.n2{grid-template-columns:1fr 1fr}
  .chart{margin:0;border:1px solid #E4E7EC;border-radius:12px;padding:12px 14px;break-inside:avoid;background:#fff}.chart figcaption{font-weight:700;color:#12275A;margin-bottom:6px}.chart img{width:100%;display:block}.chart small{color:#667085;font-size:12px}
  .noimg{padding:30px;text-align:center;color:#98A2B3;background:#F8FAFC;border-radius:8px}
  .callout{border-radius:10px;padding:12px 16px;margin:12px 0;break-inside:avoid}.callout ul{margin:6px 0 0 18px;padding:0}.callout p{margin:4px 0 0}
  .callout.info{background:#EEF4FF;border-left:5px solid #2F5BD3}.callout.good{background:#ECFAF4;border-left:5px solid #16A37F}.callout.warn{background:#FFF4E5;border-left:5px solid #F2A93B}
  .bul{margin:6px 0 12px 20px;padding:0}.bul li{margin:6px 0}
  table{border-collapse:collapse;width:100%}
  .tbl{margin:8px 0 14px;font-size:12.5px}.tbl th{background:#12275A;color:#fff;text-align:left;padding:8px;font-weight:700}.tbl td{padding:7px 8px;border-bottom:1px solid #E4E7EC;vertical-align:top}.tbl tbody tr:nth-child(even) td{background:#F8FAFD}.tbl.small{font-size:11.5px}.tbl.fixed{table-layout:fixed}.tbl.fixed td{word-wrap:break-word}.tbl thead{display:table-header-group}.tbl tr{break-inside:avoid}
  .tbl td .pill{display:inline-block;border-radius:999px;padding:2px 9px;font-size:11px;color:#fff}
  .tbl td[style*="background"]{background-clip:padding-box}
  .kvt{margin:8px 0 14px;font-size:13px}.kvt th{width:32%;text-align:left;background:#F3F6FB;color:#344054;padding:8px 10px;border-bottom:1px solid #fff;vertical-align:top}.kvt td{padding:8px 10px;border-bottom:1px solid #EEF1F6}
  .gallery{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:8px 0}.gallery figure{margin:0;border:1px solid #E4E7EC;border-radius:10px;overflow:hidden;break-inside:avoid;background:#fff}.gallery img{width:100%;height:220px;object-fit:cover;display:block}.gallery figcaption{font-size:11.5px;color:#475467;padding:7px 10px}
  .ai{border:1px solid #D9CCFF;background:linear-gradient(180deg,#F7F3FF,#fff);border-radius:12px;padding:14px 18px;margin:14px 0;break-inside:avoid}.aih{font-weight:800;color:#5B3FC4;font-size:16px}.ain{font-size:11.5px;color:#7A6AA8;margin-bottom:6px}.ai h4{margin:10px 0 4px;color:#3B2A84}.ai ul{margin:4px 0 6px 18px;padding:0}
  .part{margin:34px 0 10px;padding:16px 20px;border-radius:12px;background:linear-gradient(120deg,#12275A,#2F5BD3);color:#fff;break-before:page;break-after:avoid}.part span{display:block;font-size:11.5px;letter-spacing:1.4px;color:#F7D58A;font-weight:800}.part b{display:block;font-size:22px;line-height:1.25}.part small{display:block;opacity:.85;font-size:12.5px;margin-top:2px}.content>.runhead+.part{margin-top:4px;break-before:auto}.part.soft{break-before:auto}
  h3.sub{color:#1F3F86;font-size:16px;margin:20px 0 6px;padding-bottom:4px;border-bottom:2px solid #EEF1F6;break-after:avoid}
  .foot{font-size:11px;color:#98A2B3;text-align:center;padding:10px 0 0;border-top:1px solid #EEF1F6;margin-top:24px}
  .tcap{font-weight:700;color:#12275A;text-align:center;font-size:12.5px;margin:16px 0 4px;break-after:avoid}
  figure.ff{margin:14px 0;border:1px solid #E4E7EC;border-radius:10px;padding:12px 14px;break-inside:avoid;text-align:center}figure.ff img{max-width:100%;display:block;margin:0 auto}figure.ff .fcap{font-weight:700;color:#12275A;font-size:12.5px;margin-top:8px}figure.ff small{display:block;color:#667085;font-size:12px}
  .front h2.fm{text-align:center;color:#12275A;font-size:19px;letter-spacing:.5px;margin:6px 0 16px}.front h2.fm.pb{margin-top:40px}
  .toc a{display:flex;color:#1d2433;text-decoration:none;padding:4px 0;border-bottom:1px dotted #C9D0DD;font-size:13px}.toc a.l1{font-weight:700;margin-top:6px}.toc a.l2{padding-left:26px}.toc a:hover{color:#2F5BD3}
  .endtte{display:flex;justify-content:flex-end;break-inside:avoid}.endtte .tte{margin:36px 0 10px auto}
  @media print{html{background:#fff}.sheet{box-shadow:none;margin:0;width:auto;border-radius:0}.cover{min-height:265mm;break-after:page}.front{break-after:page}h2.sec.pb{break-before:page}.front h2.fm.pb{break-before:page;margin-top:0}.content>h2.sec:first-of-type{break-before:auto}.content{padding:0}.runhead{display:none}}
  @media (max-width:640px){.band,.ctitle,.content{padding-left:20px;padding-right:20px}.scope,.meta{margin-left:20px;margin-right:20px;width:calc(100% - 40px)}.big{font-size:26px}.kpis{grid-template-columns:1fr 1fr}.charts.n2,.gallery{grid-template-columns:1fr}.tte{margin:24px 20px;width:auto}}
  </style></head><body>
  <div class="sheet cover"><div class="band"><div class="org"><b>${escapeHtml(CM_RPT_ORG[0])}</b><br>${escapeHtml(CM_RPT_ORG[1])}<br>${escapeHtml(CM_RPT_ORG[2])}</div></div><div class="stripe"></div>
  <div class="ctitle"><div class="kick">${escapeHtml(c.kicker)}</div><div class="big">${escapeHtml(c.title)}</div><div class="subj">${escapeHtml(c.subject)}</div><div class="chips">${(c.chips||[]).filter(cmRptHas).map(x=>`<span class="chip">${escapeHtml(x)}</span>`).join('')}</div></div>
  ${c.scope&&c.scope.length?`<div class="scope"><b>${L('Filter yang digunakan','Filters used')}:</b> ${c.scope.map(escapeHtml).join(' • ')}</div>`:''}
  <table class="meta">${c.meta.map(r=>`<tr><th>${escapeHtml(r[0])}</th><td>${escapeHtml(r[1])}</td></tr>`).join('')}</table>
  ${c.noTte?'':tteHtml}
  </div>${front}
  <div class="sheet content"><div class="runhead"><span>${escapeHtml(model.header||'')}</span><span>${escapeHtml(c.kicker)}</span></div>${body}<div class="foot">${escapeHtml(model.header||'')}${F?'':` · ${L('Sumber data: Dashboard Master Agenda Change Management','Data source: Change Management Master Agenda dashboard')}`}</div></div>
  </body></html>`;
}
function cmDx(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');}
function cmDxRuns(text,o={}){
  const parts=String(text??'').split(/(\*\*[^*]+\*\*)/g).filter(x=>x!=='');
  return parts.map(p=>{const bold=o.b||/^\*\*.*\*\*$/.test(p);const t=bold&&/^\*\*.*\*\*$/.test(p)?p.slice(2,-2):p;
    return String(t).split('\n').map((seg,i)=>`<w:r><w:rPr>${bold?'<w:b/>':''}${o.i?'<w:i/>':''}${o.color?`<w:color w:val="${o.color}"/>`:''}${o.sz?`<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>`:''}${o.caps?'<w:caps/>':''}</w:rPr>${i?'<w:br/>':''}<w:t xml:space="preserve">${cmDx(seg)}</w:t></w:r>`).join('');}).join('')||'<w:r><w:t></w:t></w:r>';
}
function cmDxP(runs,o={}){
  const ppr=[o.style?`<w:pStyle w:val="${o.style}"/>`:'',o.keepNext?'<w:keepNext/>':'',o.pageBreakBefore?'<w:pageBreakBefore/>':'',o.shade?`<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>`:'',o.borderLeft?`<w:pBdr><w:left w:val="single" w:sz="24" w:space="8" w:color="${o.borderLeft}"/></w:pBdr>`:'',`<w:spacing w:before="${o.before??0}" w:after="${o.after??100}" w:line="${o.line??276}" w:lineRule="auto"/>`,o.indent?`<w:ind w:left="${o.indent}" w:right="${o.indentR||0}"/>`:'',o.align?`<w:jc w:val="${o.align}"/>`:'',o.numId?`<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${o.numId}"/></w:numPr>`:''].join('');
  return `<w:p><w:pPr>${ppr}</w:pPr>${runs}</w:p>`;
}
function cmDxCell(content,w,o={}){
  const b=o.noBorder?'<w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders>':(o.borders||'');
  return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${o.span?`<w:gridSpan w:val="${o.span}"/>`:''}${b}${o.fill?`<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>`:''}<w:tcMar><w:top w:w="${o.padT??70}" w:type="dxa"/><w:left w:w="${o.padL??110}" w:type="dxa"/><w:bottom w:w="${o.padB??70}" w:type="dxa"/><w:right w:w="${o.padR??110}" w:type="dxa"/></w:tcMar><w:vAlign w:val="${o.v||'top'}"/></w:tcPr>${content||cmDxP('')}</w:tc>`;
}
function cmDxTable(rows,widths,o={}){
  const total=widths.reduce((s,x)=>s+x,0);
  const bc=o.borderColor||'E4E7EC',border=o.noBorder?'<w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>':`<w:tblBorders><w:top w:val="single" w:sz="4" w:color="${bc}"/><w:left w:val="single" w:sz="4" w:color="${bc}"/><w:bottom w:val="single" w:sz="4" w:color="${bc}"/><w:right w:val="single" w:sz="4" w:color="${bc}"/><w:insideH w:val="single" w:sz="4" w:color="${bc}"/><w:insideV w:val="single" w:sz="4" w:color="${bc}"/></w:tblBorders>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/>${o.jc?`<w:jc w:val="${o.jc}"/>`:''}<w:tblLayout w:type="fixed"/>${border}</w:tblPr><w:tblGrid>${widths.map(w=>`<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${rows.map(r=>`<w:tr><w:trPr><w:cantSplit/>${r.header?'<w:tblHeader/>':''}</w:trPr>${r.cells.join('')}</w:tr>`).join('')}</w:tbl>${o.after===false?'':cmDxP('',{after:o.after??120})}`;
}
async function cmRptDocx(model){
  if(typeof JSZip==='undefined')throw new Error('JSZip not available');
  const W=9638,EMU=635,media=[],L=(i,e)=>cmRptT(model.lang,i,e);let docPr=1;
  const addImg=(img,widthTw)=>{if(!img||!img.src)return '';const m=img.src.match(/^data:image\/(png|jpe?g);base64,(.*)$/);if(!m)return '';const ext=m[1]==='png'?'png':'jpeg';const id=`rIdImg${media.length+1}`;media.push({id,ext,data:m[2],name:`image${media.length+1}.${ext==='png'?'png':'jpg'}`});
    const cx=Math.round(widthTw*EMU),cy=Math.round(cx*(img.h/img.w));const n=docPr++;
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${n}" name="Gambar ${n}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${n}" name="${media[media.length-1].name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;};
  const c=model.cover,x=[];
  // cover
  x.push(cmDxTable([{cells:[cmDxCell(cmDxP(cmDxRuns(CM_RPT_ORG[0],{b:true,color:'FFFFFF',sz:22}),{after:40})+cmDxP(cmDxRuns(CM_RPT_ORG[1],{color:'DCE4F5',sz:19}),{after:20})+cmDxP(cmDxRuns(CM_RPT_ORG[2],{color:'DCE4F5',sz:19}),{after:20}),W,{fill:'12275A',padT:260,padB:260,padL:300,padR:300,noBorder:true})]},{cells:[cmDxCell(cmDxP('',{after:0,line:120}),W,{fill:'F2A93B',padT:20,padB:20,noBorder:true})]}],[W],{noBorder:true,after:false}));
  x.push(cmDxP('',{after:360}));
  x.push(cmDxP(cmDxRuns(c.kicker,{b:true,color:'2F5BD3',sz:26}),{after:80}));
  x.push(cmDxP(cmDxRuns(c.title,{b:true,color:'12275A',sz:52}),{after:120,line:240}));
  x.push(cmDxP(cmDxRuns(c.subject,{b:true,color:'344054',sz:30}),{after:200}));
  const chips=(c.chips||[]).filter(cmRptHas);
  if(chips.length)x.push(cmDxP(chips.map((t,i)=>cmDxRuns(`  ${t}  `,{b:true,color:'1F3F86',sz:20})+(i<chips.length-1?cmDxRuns('   '):'')).join(''),{after:220}));
  if(c.scope&&c.scope.length)x.push(cmDxP(cmDxRuns(`${L('Filter yang digunakan','Filters used')}: `,{b:true,sz:20})+cmDxRuns(c.scope.join(' • '),{sz:20}),{shade:'FFF8EC',borderLeft:'F2A93B',after:200,indent:120,indentR:120}));
  x.push(cmDxTable(c.meta.map(r=>({cells:[cmDxCell(cmDxP(cmDxRuns(r[0],{color:'667085',sz:21}),{after:0}),3300,{borders:'<w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:right w:val="nil"/><w:bottom w:val="single" w:sz="4" w:color="EEF1F6"/></w:tcBorders>'}),cmDxCell(cmDxP(cmDxRuns(r[1],{b:true,sz:21}),{after:0}),W-3300,{borders:'<w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:right w:val="nil"/><w:bottom w:val="single" w:sz="4" w:color="EEF1F6"/></w:tcBorders>'})]})),[3300,W-3300],{noBorder:true,after:480}));
  const t=c.tte||{};
  const tw=4300,ar={color:'111111',sz:22};
  let tteX='';
  if(t.date)tteX+=cmDxP(cmDxRuns(t.city?`${t.city}, ${t.date}`:t.date,ar),{after:200});
  if(t.label)tteX+=cmDxP(cmDxRuns(t.label,ar),{after:160});
  tteX+=cmDxP(cmDxRuns(t.title||L('[Jabatan]','[Position]'),ar),{after:120});
  for(let i=0;i<5;i++)tteX+=cmDxP('',{after:0,line:240,lineRule:'auto'});
  tteX+=cmDxP(cmDxRuns(L('Ditandatangani secara elektronik','Electronically signed'),{color:'A0A4AB',sz:22}),{after:20});
  tteX+=cmDxP(cmDxRuns(t.name||L('[Nama Pejabat]','[Signer Name]'),ar),{after:0});
  const tteTbl=cmDxTable([{cells:[cmDxCell(cmDxP('',{after:0}),W-tw,{noBorder:true}),cmDxCell(tteX,tw,{noBorder:true,padL:0})]}],[W-tw,tw],{noBorder:true,after:false});
  if(!c.noTte)x.push(tteTbl);
  const F=!!model.formal,capFig=L('Gambar','Figure'),capTab=L('Tabel','Table');
  const fldRun=(t,rp)=>`<w:r>${rp?`<w:rPr>${rp}</w:rPr>`:''}${t}</w:r>`;
  const capP=(label,num,text,o={})=>{const rp='<w:b/><w:color w:val="12275A"/><w:sz w:val="20"/><w:szCs w:val="20"/>';return cmDxP(fldRun(`<w:t xml:space="preserve">${cmDx(label)} </w:t>`,rp)+fldRun('<w:fldChar w:fldCharType="begin"/>',rp)+fldRun(`<w:instrText xml:space="preserve"> SEQ ${cmDx(label)} \\* ARABIC </w:instrText>`,rp)+fldRun('<w:fldChar w:fldCharType="separate"/>',rp)+fldRun(`<w:t>${num}</w:t>`,rp)+fldRun('<w:fldChar w:fldCharType="end"/>',rp)+fldRun(`<w:t xml:space="preserve">. ${cmDx(text)}</w:t>`,rp),{style:'Caption',align:'center',keepNext:!!o.keepNext,before:o.before??80,after:o.after??100});};
  if(F){
    // daftar isi / gambar / tabel (field Word; diperbarui otomatis saat dokumen dibuka)
    let hn=0,hm=0,fn=0,tn=0,nnP=false;const toc=[],figs=[],tabs=[];
    model.blocks.forEach(b=>{if(b.t==='h1'){if(b.nonum){nnP=true;toc.push({style:'TOC1',text:b.text});}else{nnP=false;hn++;hm=0;toc.push({style:'TOC1',text:`${hn}   ${b.text}`});}}else if(b.t==='h2'){if(nnP)toc.push({style:'TOC2',text:b.text});else{hm++;toc.push({style:'TOC2',text:`${hn}.${hm}   ${b.text}`});}}else if(b.t==='charts')b.items.forEach(it=>{fn++;figs.push({style:'TableofFigures',text:`${capFig} ${fn}. ${it.title}`});});else if(b.t==='table'&&b.caption){tn++;tabs.push({style:'TableofFigures',text:`${capTab} ${tn}. ${b.caption}`});}});
    const field=(instr,items)=>items.map((it,i)=>`<w:p><w:pPr><w:pStyle w:val="${it.style}"/><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="${W}"/></w:tabs></w:pPr>${i===0?`<w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r><w:r><w:instrText xml:space="preserve"> ${cmDx(instr)} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>`:''}${cmDxRuns(it.text,{sz:it.style==='TOC1'?22:21,b:it.style==='TOC1'})}<w:r><w:tab/></w:r>${i===items.length-1?'<w:r><w:fldChar w:fldCharType="end"/></w:r>':''}</w:p>`).join('');
    const fmT=t=>cmDxP(cmDxRuns(t,{b:true,color:'12275A',sz:30}),{pageBreakBefore:true,align:'center',after:280});
    x.push(fmT(L('DAFTAR ISI','TABLE OF CONTENTS')));x.push(toc.length?field('TOC \\o "1-2" \\h \\z \\u',toc):cmDxP(''));
    x.push(fmT(L('DAFTAR GAMBAR','LIST OF FIGURES')));x.push(figs.length?field(`TOC \\h \\z \\c "${capFig}"`,figs):cmDxP(cmDxRuns(L('Tidak terdapat gambar.','No figures.'),{color:'667085'})));
    x.push(fmT(L('DAFTAR TABEL','LIST OF TABLES')));x.push(tabs.length?field(`TOC \\h \\z \\c "${capTab}"`,tabs):cmDxP(cmDxRuns(L('Tidak terdapat tabel.','No tables.'),{color:'667085'})));
  }
  let fgN=0,tbN=0,h2N=0,nnB=false;
  // body
  let n=0,first=true;
  for(const b of model.blocks){
    switch(b.t){
      case 'part':{n=0;x.push(cmDxP('',{pageBreakBefore:first||!b.soft,before:b.soft&&!first?240:0,after:0}));x.push(cmDxTable([{cells:[cmDxCell(cmDxP(cmDxRuns(b.kicker||'',{b:true,color:'F7D58A',sz:19}),{after:40})+cmDxP(cmDxRuns(b.text,{b:true,color:'FFFFFF',sz:36}),{after:b.sub?40:0,line:240})+(b.sub?cmDxP(cmDxRuns(b.sub,{color:'DCE4F5',sz:20}),{after:0}):''),W,{fill:'12275A',padT:200,padB:200,padL:280,padR:280,noBorder:true})]}],[W],{noBorder:true,after:200}));first=false;break;}
      case 'h2':if(F&&nnB){x.push(cmDxP(cmDxRuns(b.text,{b:true,color:'1F3F86',sz:26}),{style:'Heading2',keepNext:true,before:220,after:80}));break;}if(F){h2N++;x.push(cmDxP(cmDxRuns(`${n}.${h2N}   `,{b:true,color:'1F3F86',sz:26})+cmDxRuns(b.text,{b:true,color:'1F3F86',sz:26}),{style:'Heading2',keepNext:true,before:220,after:80}));break;}x.push(cmDxP(cmDxRuns(b.text,{b:true,color:'1F3F86',sz:26}),{keepNext:true,before:220,after:80}));break;
      case 'tte':x.push(cmDxP('',{after:200}));x.push(tteTbl);break;
      case 'h1':{if(b.nonum){nnB=true;x.push(cmDxP(cmDxRuns(b.text,{b:true,color:'12275A',sz:32}),{style:'Heading1',keepNext:true,before:0,after:140,pageBreakBefore:true}));first=false;break;}nnB=false;n++;h2N=0;x.push(cmDxP(cmDxRuns(`${n}  `,{b:true,color:'F2A93B',sz:32})+cmDxRuns(b.text,{b:true,color:'12275A',sz:32}),{style:'Heading1',keepNext:true,before:first?0:360,after:140,pageBreakBefore:first}));first=false;break;}
      case 'p':x.push(cmDxP(cmDxRuns(b.text,{sz:b.muted?19:22,color:b.muted?'667085':'1D2433'}),{after:140,align:'both'}));break;
      case 'kpis':{const per=3,w=Math.floor(W/per),rows=[];for(let i=0;i<b.items.length;i+=per){rows.push({cells:b.items.slice(i,i+per).map(k=>cmDxCell(cmDxP(cmDxRuns(String(k.value),{b:true,color:k.color,sz:40}),{after:20,line:240})+cmDxP(cmDxRuns(k.label,{b:true,sz:20}),{after:0})+cmDxP(cmDxRuns(k.sub||'',{color:'667085',sz:17}),{after:0}),w,{fill:cmRptTint(k.color),padT:120,padB:120,padL:160,borders:`<w:tcBorders><w:top w:val="single" w:sz="36" w:color="${k.color}"/><w:left w:val="single" w:sz="12" w:color="FFFFFF"/><w:bottom w:val="single" w:sz="12" w:color="FFFFFF"/><w:right w:val="single" w:sz="12" w:color="FFFFFF"/></w:tcBorders>`}))});}
        x.push(cmDxTable(rows,Array(per).fill(w),{noBorder:true,after:160}));break;}
      case 'charts':{if(F){b.items.forEach(it=>{fgN++;x.push(cmDxP(addImg(it.img,W-600)||cmDxRuns(L('Grafik tidak tersedia','Chart unavailable'),{i:true,color:'98A2B3'}),{align:'center',keepNext:true,before:120,after:40}));x.push(capP(capFig,fgN,it.title,{after:it.caption?20:180}));if(it.caption)x.push(cmDxP(cmDxRuns(it.caption,{color:'667085',sz:18,i:true}),{after:180,align:'center'}));});break;}
        if(b.items.length===2){const w=Math.floor(W/2);x.push(cmDxTable([{cells:b.items.map(it=>cmDxCell(cmDxP(cmDxRuns(it.title,{b:true,color:'12275A',sz:20}),{after:60,keepNext:true})+cmDxP(addImg(it.img,w-260)||cmDxRuns(L('Grafik tidak tersedia','Chart unavailable'),{i:true,color:'98A2B3'}),{after:40,align:'center'})+(it.caption?cmDxP(cmDxRuns(it.caption,{color:'667085',sz:17}),{after:0}):''),w,{padT:120,padB:120}))}],[w,w],{borderColor:'E4E7EC'}));}
        else b.items.forEach(it=>{x.push(cmDxP(cmDxRuns(it.title,{b:true,color:'12275A',sz:22}),{keepNext:true,after:60,before:80}));x.push(cmDxP(addImg(it.img,W-400)||cmDxRuns(L('Grafik tidak tersedia','Chart unavailable'),{i:true,color:'98A2B3'}),{align:'center',after:it.caption?40:160,keepNext:!!it.caption}));if(it.caption)x.push(cmDxP(cmDxRuns(it.caption,{color:'667085',sz:18,i:true}),{after:160,align:'center'}));});break;}
      case 'callout':{const tone={info:['EEF4FF','2F5BD3'],good:['ECFAF4','16A37F'],warn:['FFF4E5','F2A93B']}[b.tone||'info'];
        const inner=cmDxP(cmDxRuns(b.title,{b:true,color:tone[1],sz:21}),{after:60})+b.lines.map(l=>cmDxP(cmDxRuns((b.lines.length>1?'•  ':'')+l,{sz:21}),{after:50,indent:b.lines.length>1?200:0})).join('');
        x.push(cmDxTable([{cells:[cmDxCell(inner,W,{fill:tone[0],padL:220,padR:200,padT:120,padB:120,borders:`<w:tcBorders><w:top w:val="nil"/><w:right w:val="nil"/><w:bottom w:val="nil"/><w:left w:val="single" w:sz="36" w:color="${tone[1]}"/></w:tcBorders>`})]}],[W],{noBorder:true,after:160}));break;}
      case 'bullets':b.items.forEach(l=>x.push(cmDxP(cmDxRuns(l,{sz:22}),{numId:1,after:80})));x.push(cmDxP('',{after:60}));break;
      case 'kv':x.push(cmDxTable(b.rows.map(r=>({cells:[cmDxCell(cmDxP(cmDxRuns(r[0],{b:true,color:'344054',sz:20}),{after:0}),3100,{fill:'F3F6FB'}),cmDxCell(cmDxP(cmDxRuns(r[1],{sz:20}),{after:0}),W-3100)]})),[3100,W-3100],{borderColor:'E4E7EC'}));break;
      case 'table':{if(F&&b.caption){tbN++;x.push(capP(capTab,tbN,b.caption,{keepNext:true,before:160,after:60}));}const ws=b.widths.map(p=>Math.round(W*p/100));ws[ws.length-1]+=W-ws.reduce((s,v)=>s+v,0);const sz=b.small?17:19;
        const head={header:true,cells:b.head.map((h,i)=>cmDxCell(cmDxP(cmDxRuns(h,{b:true,color:'FFFFFF',sz}),{after:0}),ws[i],{fill:'12275A'}))};
        const rows=b.rows.map((r,ri)=>({cells:r.map((v,i)=>{const o=v&&typeof v==='object'?v:{text:v};return cmDxCell(cmDxP(cmDxRuns(o.text,{b:o.bold,color:o.color?String(o.color).replace('#',''):undefined,sz}),{after:0,align:o.align==='center'?'center':undefined}),ws[i],{fill:o.fill||o.bg||(ri%2?'F8FAFD':undefined),v:o.v||'center'});})}));
        x.push(cmDxTable([head,...rows],ws,{borderColor:'E4E7EC'}));break;}
      case 'gallery':{const w=Math.floor(W/2),rows=[];for(let i=0;i<b.images.length;i+=2){const pair=b.images.slice(i,i+2);while(pair.length<2)pair.push(null);rows.push({cells:pair.map(im=>cmDxCell(im?cmDxP(addImg(im,w-240),{after:40,align:'center'})+cmDxP(cmDxRuns(im.caption||'',{color:'475467',sz:16}),{after:0}):cmDxP(''),w,{padT:100,padB:100}))});}x.push(cmDxTable(rows,[w,w],{borderColor:'E4E7EC'}));break;}
      case 'ai':{let inner=cmDxP(cmDxRuns('✦ '+b.title,{b:true,color:'5B3FC4',sz:24}),{after:20})+cmDxP(cmDxRuns(b.note||'',{i:true,color:'7A6AA8',sz:16}),{after:80});
        b.sections.forEach(s=>{if(s.title)inner+=cmDxP(cmDxRuns(s.title,{b:true,color:'3B2A84',sz:21}),{before:80,after:40});s.paras.forEach(p=>inner+=cmDxP(cmDxRuns(p,{sz:20}),{after:50}));s.bullets.forEach(p=>inner+=cmDxP(cmDxRuns('•  '+p,{sz:20}),{after:40,indent:200}));});
        x.push(cmDxTable([{cells:[cmDxCell(inner,W,{fill:'F7F3FF',padL:220,padR:200,padT:140,padB:140})]}],[W],{borderColor:'D9CCFF',after:160}));break;}
    }
  }
  const footerXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:pBdr><w:top w:val="single" w:sz="4" w:space="6" w:color="E4E7EC"/></w:pBdr><w:tabs><w:tab w:val="right" w:pos="${W}"/></w:tabs></w:pPr><w:r><w:rPr><w:color w:val="98A2B3"/><w:sz w:val="16"/></w:rPr><w:t xml:space="preserve">${cmDx(model.header||'')}</w:t></w:r><w:r><w:rPr><w:color w:val="98A2B3"/><w:sz w:val="16"/></w:rPr><w:tab/><w:t xml:space="preserve">${cmDx(L('Halaman ','Page '))}</w:t></w:r><w:r><w:rPr><w:color w:val="98A2B3"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:color w:val="98A2B3"/><w:sz w:val="16"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:rPr><w:color w:val="98A2B3"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:color w:val="98A2B3"/><w:sz w:val="16"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:color w:val="98A2B3"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;
  const emptyFtr=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p/></w:ftr>`;
  const ns='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${ns}><w:body>${x.join('')}<w:sectPr><w:footerReference w:type="default" r:id="rIdFtr1"/><w:footerReference w:type="first" r:id="rIdFtr2"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/><w:titlePg/></w:sectPr></w:body></w:document>`;
  const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="id-ID"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="12275A"/><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="1F3F86"/><w:sz w:val="26"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Caption"><w:name w:val="caption"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:color w:val="12275A"/><w:sz w:val="20"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="TOC1"><w:name w:val="toc 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="39"/><w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9628"/></w:tabs><w:spacing w:before="120" w:after="60"/></w:pPr><w:rPr><w:b/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="TOC2"><w:name w:val="toc 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="39"/><w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9628"/></w:tabs><w:spacing w:after="60"/><w:ind w:left="440"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="TableofFigures"><w:name w:val="table of figures"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="99"/><w:pPr><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9628"/></w:tabs><w:spacing w:after="60"/></w:pPr></w:style><w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>`;
  const numbering=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="●"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="460" w:hanging="300"/></w:pPr><w:rPr><w:color w:val="F2A93B"/><w:sz w:val="18"/></w:rPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;
  const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdNum" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rIdFtr1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rIdFtr2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer2.xml"/>${model.formal?'<Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>':''}${media.map(m=>`<Relationship Id="${m.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${m.name}"/>`).join('')}</Relationships>`;
  const ct=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/word/footer2.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>${model.formal?'<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>':''}</Types>`;
  const core=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${cmDx(model.fileName)}</dc:title><dc:creator>Pusmantap BaTii</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().replace(/\.\d+Z$/,'Z')}</dcterms:created></cp:coreProperties>`;
  const zip=new JSZip();
  zip.file('[Content_Types].xml',ct);
  zip.folder('_rels').file('.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>');
  zip.folder('docProps').file('core.xml',core);
  const w=zip.folder('word');w.file('document.xml',doc);w.file('styles.xml',styles);w.file('numbering.xml',numbering);w.file('footer1.xml',footerXml);w.file('footer2.xml',emptyFtr);w.folder('_rels').file('document.xml.rels',rels);if(model.formal)w.file('settings.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:updateFields w:val="true"/><w:defaultTabStop w:val="720"/></w:settings>');
  const md=w.folder('media');media.forEach(m=>md.file(m.name,m.data,{base64:true}));
  return zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
function cmRptTint(hex){const h=String(hex||'2F5BD3').replace('#','');const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);const mix=v=>Math.round(v*0.1+255*0.9).toString(16).padStart(2,'0');return (mix(r)+mix(g)+mix(b)).toUpperCase();}
function cmRptDownloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function cmOpenActivityReportBuilder(){
  try{
    const items=getFiltered(),prefs=cmRptPrefs(),signer=cmRptSigner(),filterLines=cmReportFilterSummary(items,currentLang);
    const aiOk=cmRptAiAvailable();
    const host=document.createElement('div');host.className='mtdcm modal-overlay cm-report-modal';
    const titleFor=lang=>{const per=cmRptPeriod(items,lang),subj=cmRptSubject(lang);return `${cmRptT(lang,'Laporan Monitoring dan Evaluasi','Monitoring and Evaluation Report')} ${per.label} — ${subj.text}`;};
    const chk=(k,label)=>`<label><input type="checkbox" data-inc="${k}" ${prefs.inc[k]!==false?'checked':''}> ${label}</label>`;
    host.innerHTML=`<div class="modal-box"><div class="modal-head"><div><h2>${uiText('Generate Monitoring & Evaluation Report','Generate Laporan Monitoring & Evaluasi')}</h2><p>${items.length} ${uiText('activities match the current filters','activity sesuai filter aktif')}</p><div class="cm-report-filter-context"><b>${uiText('Report scope','Cakupan laporan')}:</b> ${filterLines.map(escapeHtml).join(' • ')||uiText('All Agenda data','Seluruh data Agenda')}</div></div><button class="modal-close" data-close>&times;</button></div>
    <div class="modal-body">
      <div class="cm-rpt2-title"><small>${uiText('Report title (auto from filters)','Judul laporan (otomatis dari filter)')}</small><b id="cmRptTitlePreview">${escapeHtml(titleFor(prefs.lang))}</b><em>${uiText('Monthly range → "Bulan …", full quarter → "Triwulan …", Program/Unit filter → document name.','Rentang 1 bulan → "Bulan …", 1 triwulan penuh → "Triwulan …", filter Program/Unit → nama dokumen.')}</em></div>
      <div style="margin-top:14px"><b>${uiText('Include','Sertakan')}</b><div class="cm-report-checks">${chk('summary',uiText('Executive summary','Ringkasan eksekutif'))}${chk('charts',uiText('Charts & statistics','Grafik & statistik'))}${chk('docs',uiText('Document completeness','Kelengkapan dokumen'))}${chk('list',uiText('Activity list','Daftar kegiatan'))}${chk('gallery',uiText('Photo documentation','Dokumentasi foto'))}${chk('analysis',uiText('Issues & follow-up analysis','Analisis kendala & tindak lanjut'))}</div></div>
      <label class="cm-rpt2-ai ${aiOk?'':'disabled'}"><input type="checkbox" id="cmRptAi" ${prefs.ai&&aiOk?'checked':''} ${aiOk?'':'disabled'}><span><b>✦ ${uiText('AI-assisted analysis','Analisis berbasis AI')}</b><small>${aiOk?uiText('Uses the configured AI Worker to write achievements, findings and recommendations from the data.','Memakai AI Worker yang sudah dikonfigurasi untuk menulis capaian, temuan, dan rekomendasi dari data.'):uiText('Configure the AI Worker in AI Settings to enable.','Konfigurasikan AI Worker di AI Settings untuk mengaktifkan.')}</small></span></label>
      ${cmRptTteFieldsHtml(signer)}
      <div class="cm-rpt2-grid"><label>${uiText('Language','Bahasa')}<select id="cmReportLang"><option value="id" ${prefs.lang!=='en'?'selected':''}>Bahasa Indonesia</option><option value="en" ${prefs.lang==='en'?'selected':''}>English</option></select></label></div>
    </div><div class="modal-foot"><button type="button" class="btn cm-fb-btn" id="cmRptFeedback" title="${uiText('Internal follow-up notes for the CM team (not included in the report)','Masukan internal untuk Tim CM (tidak masuk ke laporan)')}">${CM_FB_ICON}${uiText('Feedback','Feedback')}<span class="cm-fb-count" id="cmRptFeedbackCount"></span></button><button class="btn btn-outline" data-close>${uiText('Cancel','Batal')}</button><button class="btn btn-gold" id="cmPreviewReport">${uiText('Preview Report','Preview Laporan')}</button></div></div>`;
    document.body.appendChild(host);
    host.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>host.remove());
    host.querySelector('#cmReportLang').onchange=e=>{host.querySelector('#cmRptTitlePreview').textContent=titleFor(e.target.value);};
    {const n=cmRptInternalFeedback(items,currentLang).length,b=host.querySelector('#cmRptFeedbackCount');if(b)b.textContent=n?String(n):'';host.querySelector('#cmRptFeedback').onclick=()=>cmRptOpenFeedback(items);}
    host.querySelector('#cmPreviewReport').onclick=()=>{
      const inc={};host.querySelectorAll('[data-inc]').forEach(x=>inc[x.dataset.inc]=x.checked);
      const lang=host.querySelector('#cmReportLang').value,ai=!!host.querySelector('#cmRptAi')?.checked;
      const sg=cmRptTteRead(host);cmRptSavePrefs({ai,lang,inc});host.remove();
      cmShowReportPreview(items,'monitoring',inc,lang,{ai,signer:sg});
    };
  }catch(err){console.error('Open activity report builder failed:',err);toast(uiText('Unable to open Activity Report: ','Gagal membuka Activity Report: ')+(err?.message||String(err)),'error');}
}
let cmRptAiFailed='';
const CM_FB_ICON='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-right:5px"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>';
function cmRptInternalFeedback(items,lang=currentLang){
  lang=lang==='en'?'en':'id';const L=(i,e)=>lang==='en'?e:i,today=dayjs().format('YYYY-MM-DD'),out=[];
  const pics=a=>(typeof cmPicList==='function'?cmPicList(a.picTimCM):String(a.picTimCM||'').split(',').map(x=>x.trim()).filter(Boolean)).join(', ');
  const done=items.filter(a=>a.statusNorm==='Completed'),total=items.length;
  const add=(key,tone,title,detail,list)=>{if(list&&!list.length)return;out.push({key,tone,title,detail,list:(list||[]).slice().sort((a,b)=>String(b.tglMulai).localeCompare(String(a.tglMulai)))});};
  add('status','red',L('Status perlu diperbarui','Status needs updating'),L('Tanggal kegiatan sudah lewat, tetapi statusnya belum diperbarui.','The activity date has passed but the status has not been updated.'),items.filter(a=>a.statusNeedsUpdate));
  add('notula','amber',L('Notula belum diunggah','Minutes not uploaded'),L('Kegiatan sudah selesai tetapi belum ada notula sebagai bukti dukung dan bahan tindak lanjut.','Completed activities without minutes as supporting evidence.'),done.filter(a=>!cmRptDocFlags(a).notula));
  add('foto','amber',L('Dokumentasi foto belum diunggah','Photos not uploaded'),L('Kegiatan selesai tanpa dokumentasi foto, sehingga capaian sulit diverifikasi.','Completed activities without photo documentation.'),done.filter(a=>!cmRptDocFlags(a).dokumentasi));
  add('delay','red',L('Kegiatan tertunda','Delayed activities'),L('Masih menunggu konfirmasi atau ditunda; tetapkan jadwal pengganti atau alasan pembatalan.','Awaiting confirmation or postponed; set a new date or close them.'),items.filter(a=>['Pending','Postponed'].includes(a.statusNorm)));
  const pm={};items.forEach(a=>String(pics(a)).split(', ').filter(Boolean).forEach(p=>pm[p]=(pm[p]||0)+1));const top=Object.entries(pm).sort((a,b)=>b[1]-a[1])[0];
  if(top&&total>=8&&top[1]/total>=0.35)out.push({key:'load',tone:'blue',title:L('Pemerataan beban kerja','Workload balance'),detail:L(`${top[0]} terlibat pada ${top[1]} dari ${total} kegiatan (${Math.round(top[1]/total*100)}%). Pertimbangkan pembagian PIC yang lebih merata.`,`${top[0]} is involved in ${top[1]} of ${total} activities (${Math.round(top[1]/total*100)}%). Consider sharing the load.`),list:[]});
  const per=typeof cmRptPeriod==='function'?cmRptPeriod(items,lang):{},rate=total?Math.round(done.length/total*100):0;
  if(per.to&&per.to<today&&total&&rate<60)out.push({key:'rate',tone:'red',title:L('Tingkat penyelesaian rendah','Low completion'),detail:L(`Periode sudah berakhir dengan tingkat penyelesaian ${rate}%. Identifikasi hambatan bersama unit pemohon.`,`The period has ended with ${rate}% completion. Identify blockers with requesting units.`),list:[]});
  out.forEach(x=>x.pics=pics);return out;
}
function cmRptFeedbackText(fb,note,lang){
  const L=(i,e)=>lang==='en'?e:i,lines=[`*${L('Masukan Internal Monev Kegiatan CM','Internal M&E Feedback - CM Activities')}*`];
  const f=(typeof getFiltered==='function'?cmReportFilterSummary(getFiltered(),lang):[]);if(f.length)lines.push(`_${f.join(' • ')}_`);
  fb.forEach((x,i)=>{lines.push('',`${i+1}. *${x.title}*${x.list.length?` (${x.list.length})`:''}`,`   ${x.detail}`);x.list.slice(0,15).forEach(a=>lines.push(`   - ${fmtDate(a.tglMulai)} · ${cmReportSafe(a.namaKegiatan).slice(0,80)}${x.pics(a)?` · PIC: ${x.pics(a)}`:''}`));if(x.list.length>15)lines.push(`   ${L(`… dan ${x.list.length-15} lainnya`,`… and ${x.list.length-15} more`)}`);});
  if(String(note||'').trim())lines.push('',`*${L('Catatan','Notes')}:* ${note.trim()}`);
  return lines.join('\n');
}
function cmRptOpenFeedback(items){
  const lang=currentLang==='en'?'en':'id',fb=cmRptInternalFeedback(items||[],lang),host=document.createElement('div');host.className='mtdcm modal-overlay cm-fb-modal';
  const card=(x,i)=>`<details class="cm-fb-item ${x.tone}" ${i<2?'open':''}><summary><span class="cm-fb-dot"></span><b>${escapeHtml(x.title)}</b>${x.list.length?`<span class="cm-fb-n">${x.list.length}</span>`:''}</summary><p>${escapeHtml(x.detail)}</p>${x.list.length?`<ul>${x.list.slice(0,40).map(a=>`<li><button type="button" class="cm-fb-act" data-id="${escapeHtml(a.id)}"><span>${escapeHtml(fmtDate(a.tglMulai))}</span><b>${escapeHtml(cmReportSafe(a.namaKegiatan))}</b><small>${escapeHtml(x.pics(a)||'-')}</small></button></li>`).join('')}</ul>${x.list.length>40?`<small class="cm-fb-more">${uiText(`Showing 40 of ${x.list.length}`,`Menampilkan 40 dari ${x.list.length}`)}</small>`:''}`:''}</details>`;
  host.innerHTML=`<div class="modal-box"><div class="modal-head"><div><h2>${uiText('Internal Feedback','Masukan Internal')}</h2><p>${uiText('Follow-up points for the CM team based on the active filters. These notes are not included in the report.','Poin tindak lanjut untuk Tim CM berdasarkan filter aktif. Catatan ini tidak dimasukkan ke laporan.')}</p></div><button class="modal-close" data-close>&times;</button></div>
    <div class="modal-body">${fb.length?fb.map(card).join(''):`<div class="cm-fb-empty">✓ ${uiText('No follow-up needed. Status, minutes, and photos are complete.','Tidak ada yang perlu ditindaklanjuti. Status, notula, dan foto sudah lengkap.')}</div>`}
    <label class="cm-fb-note">${uiText('Additional notes (optional)','Catatan tambahan (opsional)')}<textarea rows="3" placeholder="${uiText('e.g. deadline for completing documents','mis. tenggat melengkapi dokumen')}"></textarea></label></div>
    <div class="modal-foot"><button class="btn btn-outline" data-close>${uiText('Close','Tutup')}</button><button class="btn btn-outline" data-copy>${uiText('Copy','Salin')}</button><button class="btn cm-fb-wa" data-wa>${iconWhatsApp()} ${uiText('Share to WhatsApp','Kirim ke WhatsApp')}</button></div></div>`;
  document.body.appendChild(host);
  const txt=()=>cmRptFeedbackText(fb,host.querySelector('textarea').value,lang);
  host.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>host.remove());
  host.querySelector('[data-copy]').onclick=async()=>{try{await copyTextToClipboard(txt());toast(uiText('Feedback copied.','Masukan disalin.'),'success');}catch(e){}};
  host.querySelector('[data-wa]').onclick=()=>cmWaSend(txt());
  host.querySelectorAll('.cm-fb-act').forEach(b=>b.onclick=()=>{if(typeof openDetail==='function')openDetail(b.dataset.id);});
}
function cmRptAiNotice(host,err,retry){
  host.querySelector('.cm-ai-notice')?.remove();if(!err)return;
  const raw=String(err),rate=/rate limit|429|too many|TPM|tokens per minute/i.test(raw),m=/try again in\s*([\d.]+)\s*s/i.exec(raw);let wait=m?Math.ceil(parseFloat(m[1])):(rate?20:0);
  const reason=rate?uiText('The AI service is busy (usage limit per minute reached).','Layanan AI sedang sibuk (batas pemakaian per menit tercapai).'):/timeout|abort/i.test(raw)?uiText('The AI service did not respond in time.','Layanan AI tidak merespons tepat waktu.'):uiText('The AI service could not be reached.','Layanan AI tidak dapat dihubungi.');
  const el=document.createElement('div');el.className='cm-ai-notice';el.setAttribute('role','alert');
  el.innerHTML=`<div class="cm-ai-n-ic">✦</div><div class="cm-ai-n-body"><b>${uiText('AI analysis was not added','Analisis AI belum ditambahkan')}</b><p>${reason} ${uiText('The report is still complete without the AI section.','Laporan tetap lengkap tanpa bagian AI.')}</p><details><summary>${uiText('Technical detail','Detail teknis')}</summary><code>${escapeHtml(raw.slice(0,400))}</code></details></div><div class="cm-ai-n-act"><button type="button" class="btn btn-sm cm-ai-n-retry" ${wait?'disabled':''}>${uiText('Try again','Coba lagi')}${wait?` <span>(${wait}s)</span>`:''}</button><button type="button" class="cm-ai-n-x" aria-label="${uiText('Close','Tutup')}">&times;</button></div>`;
  const anchor=host.querySelector('.cm-rpt2-toolbar');anchor.parentNode.insertBefore(el,anchor.nextSibling);
  const btn=el.querySelector('.cm-ai-n-retry');
  if(wait){const t=setInterval(()=>{if(!document.body.contains(el)){clearInterval(t);return;}wait--;if(wait<=0){clearInterval(t);btn.disabled=false;btn.innerHTML=uiText('Try again','Coba lagi');}else btn.querySelector('span').textContent=`(${wait}s)`;},1000);}
  btn.onclick=()=>{el.remove();retry();};el.querySelector('.cm-ai-n-x').onclick=()=>el.remove();
  toast(uiText('AI analysis unavailable; report built without it.','Analisis AI tidak tersedia; laporan disusun tanpa bagian AI.'),'info');
}
const CM_DOCNUM_KEY='mt_doc_numbering_v1';
const CM_DOC_TYPES=[['LPP','Laporan Hasil Prioritisasi Proyek'],['LMI','Laporan Monev Indikator & Manfaat CM'],['LMV','Laporan Monitoring & Evaluasi Kegiatan'],['LKG','Laporan Kegiatan'],['LKP','Kompilasi Laporan'],['LOV','Laporan Overview'],['LKL','Laporan Kalender'],['LWB','Laporan Workboard'],['LMX','Laporan Matriks'],['LKT','Laporan Statistik Kunjungan Tamu']];
const CM_DOCNUM_FMT='{KODE}-{NO:3}/{UNIT}/{TAHUN}';
let cmDocNumState=null,cmDocNumLoaded=false;
function cmDocNumDefault(){return {unit:'TI.2',types:Object.fromEntries(CM_DOC_TYPES.map(([k,l])=>[k,{kode:k,label:l,format:CM_DOCNUM_FMT}])),counters:{},log:[]};}
function cmDocNumNorm(raw){const d=cmDocNumDefault();raw=raw&&typeof raw==='object'?raw:{};if(raw.unit!=null&&String(raw.unit).trim())d.unit=String(raw.unit).trim();Object.keys(d.types).forEach(k=>{const t=raw.types&&raw.types[k];if(t){d.types[k].kode=String(t.kode||k).trim()||k;d.types[k].label=String(t.label||d.types[k].label).trim()||d.types[k].label;d.types[k].format=String(t.format||CM_DOCNUM_FMT).trim()||CM_DOCNUM_FMT;}});d.counters=raw.counters&&typeof raw.counters==='object'?Object.fromEntries(Object.entries(raw.counters).filter(([k,v])=>Number.isFinite(Number(v))).map(([k,v])=>[k,Math.max(0,Math.round(Number(v)))])):{};d.log=Array.isArray(raw.log)?raw.log.slice(-100):[];return d;}
async function cmDocNumLoad(force){if(cmDocNumLoaded&&!force)return cmDocNumState;let raw=null;try{raw=JSON.parse(localStorage.getItem(CM_DOCNUM_KEY)||'null')}catch(e){}try{if(typeof firestoreGet==='function'){const v=await firestoreGet(CM_DOCNUM_KEY);if(v)raw=JSON.parse(v);}}catch(e){}cmDocNumState=cmDocNumNorm(raw);cmDocNumLoaded=true;return cmDocNumState;}
async function cmDocNumSave(){try{localStorage.setItem(CM_DOCNUM_KEY,JSON.stringify(cmDocNumState))}catch(e){}try{if(typeof firestoreSet==='function')await firestoreSet(CM_DOCNUM_KEY,JSON.stringify(cmDocNumState));}catch(e){console.error(e)}}
function cmDocNumKey(type,date){const st=cmDocNumState||cmDocNumDefault();return `${(st.types[type]||{kode:type}).kode}|${dayjs(date||undefined).format('YYYY')}`;}
function cmDocNumFormat(type,no,date,stOverride){const st=stOverride||cmDocNumState||cmDocNumDefault(),t=st.types[type]||{kode:type,format:CM_DOCNUM_FMT};const d=dayjs(date||undefined);const rom=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][d.month()];
 return String(t.format||CM_DOCNUM_FMT).replace(/\{KODE\}/g,t.kode).replace(/\{NO(?::(\d+))?\}/g,(m,w)=>String(no).padStart(Number(w)||1,'0')).replace(/\{UNIT\}/g,st.unit).replace(/\{TAHUN\}/g,d.format('YYYY')).replace(/\{BULAN\}/g,d.format('MM')).replace(/\{BULAN_ROMAWI\}/g,rom);}
function cmDocNumNext(type){const st=cmDocNumState||cmDocNumDefault();return (Number(st.counters[cmDocNumKey(type)])||0)+1;}
async function cmDocNumReserve(type,title){await cmDocNumLoad(true);const st=cmDocNumState,key=cmDocNumKey(type),no=(Number(st.counters[key])||0)+1;st.counters[key]=no;const num=cmDocNumFormat(type,no);st.log=(st.log||[]).concat([{no:num,type,title:String(title||'').slice(0,160),at:new Date().toISOString(),by:(typeof getCurrentUserEmail==='function'&&getCurrentUserEmail())||''}]).slice(-100);await cmDocNumSave();return num;}
function cmRptPreviewModal(titleText,build,opts){
  const host=document.createElement('div');host.className='mtdcm modal-overlay cm-rpt2-modal';
  const aiOk=cmRptAiAvailable();
  host.innerHTML=`<div class="modal-box"><div class="modal-head"><div><h2>${escapeHtml(titleText)}</h2><p class="cm-rpt2-status">${uiText('Preparing report…','Menyiapkan laporan…')}</p></div><button class="modal-close" data-close>&times;</button></div>
  <div class="modal-body"><div class="cm-rpt2-toolbar">${opts.noAi?'':`<label class="${aiOk?'':'disabled'}"><input type="checkbox" id="cmRpt2Ai" ${opts.ai&&aiOk?'checked':''} ${aiOk?'':'disabled'}> ✦ ${uiText('AI analysis','Analisis AI')}</label>`}<select id="cmRpt2Lang"><option value="id" ${opts.lang!=='en'?'selected':''}>Bahasa Indonesia</option><option value="en" ${opts.lang==='en'?'selected':''}>English</option></select><button class="btn btn-outline btn-sm" id="cmRpt2TteBtn">✍ ${uiText('TTE settings','Atur TTE')}</button>${opts.onSettings?`<button class="btn btn-outline btn-sm" id="cmRpt2Settings">⚙ ${uiText('Settings','Pengaturan')}</button>`:''}${opts.extraHtml||''}${opts.docType?`<label class="cm-rpt2-no">${uiText('Document no.','No. dokumen')}<input id="cmRpt2No" placeholder="${uiText('automatic on download','otomatis saat diunduh')}"></label><small class="cm-rpt2-nohint" id="cmRpt2NoHint"></small>`:''}</div>
  <div class="cm-rpt2-ttepanel" hidden>${cmRptTteFieldsHtml(cmRptSigner())}<div style="text-align:right;margin-top:8px"><button class="btn btn-gold btn-sm" id="cmRpt2TteApply">${uiText('Apply','Terapkan')}</button></div></div>
  <div class="cm-rpt2-frame-wrap"><div class="cm-rpt2-loading"><span class="cm-rpt2-spin"></span>${uiText('Building charts and layout…','Menyusun grafik dan tata letak…')}</div><iframe class="cm-rpt2-frame" title="Report preview"></iframe></div></div>
  <div class="modal-foot">${opts.feedbackItems?`<button type="button" class="btn cm-fb-btn" id="cmRpt2Feedback" title="${uiText('Internal follow-up notes for the CM team (not included in the report)','Masukan internal untuk Tim CM (tidak masuk ke laporan)')}">${CM_FB_ICON}Feedback<span class="cm-fb-count">${cmRptInternalFeedback(opts.feedbackItems,currentLang).length||''}</span></button>`:''}<button class="btn btn-outline" data-close>${uiText('Close','Tutup')}</button><button class="btn btn-outline" id="cmRpt2Pdf" disabled>⬇ PDF</button><button class="btn btn-gold" id="cmRpt2Word" disabled>⬇ Word (.docx)</button></div></div>`;
  document.body.appendChild(host);
  const frame=host.querySelector('iframe'),status=host.querySelector('.cm-rpt2-status'),loading=host.querySelector('.cm-rpt2-loading'),btnPdf=host.querySelector('#cmRpt2Pdf'),btnWord=host.querySelector('#cmRpt2Word');
  let model=null,html='',busy=false,reservedNo='',reservedFor='',curExtraKey='';
  const ensureNo=async()=>{if(!opts.docType||!model)return;const man=host.querySelector('#cmRpt2No')?.value.trim();let no=man||reservedNo;if(!no&&cmCanMutate()){no=await cmDocNumReserve(opts.docType,model.fileName);reservedNo=no;reservedFor=curExtraKey;}if(!no)return;if(model.cover.meta[0])model.cover.meta[0][1]=no;model.docNo=no;html=cmRptHtml(model);await new Promise(res=>{frame.onload=()=>res();frame.srcdoc=html;setTimeout(res,1500);});const hint=host.querySelector('#cmRpt2NoHint');if(hint)hint.textContent=man?uiText('manual number','nomor manual'):uiText('number issued','nomor telah diberikan');};
  const run=async()=>{
    if(busy)return;busy=true;btnPdf.disabled=btnWord.disabled=true;loading.style.display='flex';status.textContent=uiText('Preparing report…','Menyiapkan laporan…');
    try{
      const o={...opts,ai:!!host.querySelector('#cmRpt2Ai')?.checked,lang:host.querySelector('#cmRpt2Lang').value,signer:cmRptSigner(),extra:opts.readExtra?opts.readExtra(host):{}};
      model=await build(o);
      {const ek=JSON.stringify(o.extra||{});if(reservedNo&&reservedFor!==ek)reservedNo='';o.__ek=ek;curExtraKey=ek;}
      if(opts.docType){await cmDocNumLoad();const man=host.querySelector('#cmRpt2No')?.value.trim();const no=man||reservedNo||cmDocNumFormat(opts.docType,cmDocNumNext(opts.docType));model.cover.meta=[[o.lang==='en'?'Number':'Nomor',no],...(model.cover.meta||[])];model.docNo=no;const hint=host.querySelector('#cmRpt2NoHint');if(hint)hint.textContent=man?uiText('manual number','nomor manual'):reservedNo?uiText('number issued','nomor telah diberikan'):(cmCanMutate()?uiText('provisional — final number is issued on download','sementara — nomor final diberikan saat diunduh'):uiText('view mode — no number is issued','mode lihat — nomor tidak diterbitkan'));}
      html=cmRptHtml(model);frame.srcdoc=html;
      status.textContent=`${model.fileName}`;btnPdf.disabled=btnWord.disabled=false;
      cmRptAiNotice(host,o.ai&&cmRptAiFailed?cmRptAiFailed:'',run);
    }catch(e){console.error('Report build failed',e);status.textContent=uiText('Failed to build report: ','Gagal menyusun laporan: ')+(e?.message||e);toast(status.textContent,'error');}
    finally{loading.style.display='none';busy=false;}
  };
  host.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>host.remove());
  host.querySelector('#cmRpt2Ai')?.addEventListener('change',run);
  host.querySelector('#cmRpt2Lang').addEventListener('change',run);
  host.querySelectorAll('[data-rpt-extra]').forEach(x=>x.addEventListener('change',run));
  host.querySelector('#cmRpt2No')?.addEventListener('change',run);
  const ttePanel=host.querySelector('.cm-rpt2-ttepanel');
  host.querySelector('#cmRpt2TteBtn').addEventListener('click',()=>{ttePanel.hidden=!ttePanel.hidden;});
  host.querySelector('#cmRpt2TteApply').addEventListener('click',()=>{cmRptTteRead(ttePanel);ttePanel.hidden=true;run();});
  host.querySelector('#cmRpt2Settings')?.addEventListener('click',()=>{host.remove();opts.onSettings();});
  host.querySelector('#cmRpt2Feedback')?.addEventListener('click',()=>cmRptOpenFeedback(opts.feedbackItems));
  btnPdf.onclick=async()=>{try{await ensureNo();const w=frame.contentWindow;if(!w)throw new Error('preview not ready');const t=w.document.title;w.document.title=model.fileName;w.focus();w.print();setTimeout(()=>{try{w.document.title=t}catch(e){}},1500);}catch(e){toast(uiText('Unable to print: ','Gagal mencetak: ')+(e.message||e),'error');}};
  btnWord.onclick=async()=>{try{btnWord.disabled=true;await ensureNo();const blob=await cmRptDocx(model);cmRptDownloadBlob(blob,model.fileName+'.docx');toast(uiText('Word report downloaded.','Laporan Word berhasil diunduh.'),'success');}catch(e){console.error(e);toast(uiText('Word export failed: ','Gagal ekspor Word: ')+(e.message||e),'error');}finally{btnWord.disabled=false;}};
  run();
  return host;
}
function cmShowReportPreview(items,type,inc,lang,extra={}){
  return cmRptPreviewModal(uiText('Monitoring & Evaluation Report Preview','Preview Laporan Monitoring & Evaluasi'),o=>cmRptBuildRangeModel(items,{lang:o.lang,ai:o.ai,inc:inc||{},signer:o.signer||cmRptSigner()}),{lang:lang||currentLang,ai:!!extra.ai,onSettings:cmOpenActivityReportBuilder,feedbackItems:items,docType:'LMV'});
}
async function cmGenerateSingleActivityDocx(a,opt){
  if(!a){toast(uiText('Activity data was not found.','Data activity tidak ditemukan.'),'error');return false;}
  const prefs=cmRptPrefs();
  if(!opt){cmRptSingleSetup(a);return true;}
  cmRptPreviewModal(`${uiText('Activity Report','Laporan Kegiatan')} — ${cmReportSafe(a.namaKegiatan).slice(0,80)}`,o=>cmRptBuildSingleModel(a,{lang:o.lang,ai:o.ai,signer:o.signer||cmRptSigner()}),{lang:opt.lang||prefs.lang||'id',ai:!!opt.ai,docType:'LKG'});
  return true;
}
function cmRptSingleSetup(a){
  const prefs=cmRptPrefs(),aiOk=cmRptAiAvailable(),host=document.createElement('div');host.className='mtdcm modal-overlay cm-report-modal';
  host.innerHTML=`<div class="modal-box"><div class="modal-head"><div><h2>${uiText('Generate Activity Report','Generate Laporan Kegiatan')}</h2><p>${escapeHtml(cmReportSafe(a.namaKegiatan))} · ${escapeHtml(fmtDate(a.tglMulai))}</p></div><button class="modal-close" data-close>&times;</button></div>
  <div class="modal-body">${cmRptTteFieldsHtml(cmRptSigner())}
  <label class="cm-rpt2-ai ${aiOk?'':'disabled'}"><input type="checkbox" id="cmRptSAi" ${prefs.ai&&aiOk?'checked':''} ${aiOk?'':'disabled'}><span><b>✦ ${uiText('AI-assisted analysis','Analisis berbasis AI')}</b><small>${aiOk?uiText('Adds AI analysis of achievements, issues, follow-ups and recommendations.','Menambahkan analisis AI: capaian, kendala, tindak lanjut, dan rekomendasi.'):uiText('Configure the AI Worker in AI Settings to enable.','Konfigurasikan AI Worker di AI Settings untuk mengaktifkan.')}</small></span></label>
  <div class="cm-rpt2-grid"><label>${uiText('Language','Bahasa')}<select id="cmRptSLang"><option value="id" ${prefs.lang!=='en'?'selected':''}>Bahasa Indonesia</option><option value="en" ${prefs.lang==='en'?'selected':''}>English</option></select></label></div></div>
  <div class="modal-foot"><button class="btn btn-outline" data-close>${uiText('Cancel','Batal')}</button><button class="btn btn-gold" id="cmRptSGo">${uiText('Preview Report','Preview Laporan')}</button></div></div>`;
  document.body.appendChild(host);
  host.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>host.remove());
  host.querySelector('#cmRptSGo').onclick=()=>{cmRptTteRead(host);const lang=host.querySelector('#cmRptSLang').value,ai=!!host.querySelector('#cmRptSAi')?.checked;cmRptSavePrefs({...prefs,lang,ai});host.remove();cmGenerateSingleActivityDocx(a,{lang,ai});};
}
function cmInvitationInfo(raw){
  const no=String(raw??'').trim().replace(/\s+/g,' ');
  if(!no||/^[-–—]+$/.test(no)||/^(tidak ada|tdk ada|belum ada|none|n\/?a)$/i.test(no))return null;
  if(/^informal$/i.test(no))return {kind:'informal',text:no};
  if(no.includes('/'))return {kind:'official',text:no};
  // Official numbers saved file-name style (no "/"), e.g. "UND-44 TI.2 2026 Renja TW II" → UND-44/TI.2/2026
  const m=/^((?:UND|ND|S|SP|SE|SR|KEP|PENG)-\d+)\s+([A-Z]{1,5}(?:\.\d+)+)\s+(\d{4})\b/i.exec(no);
  if(m)return {kind:'official',text:`${m[1].toUpperCase()}/${m[2].toUpperCase()}/${m[3]}`,full:no};
  return {kind:'pending',text:no};
}
function cmInvitationNo(a){
  const main=String(a?.undangan??'').trim();if(main)return main;
  let rows=[];try{rows=parseActivityFiles(a?.undanganFiles);}catch(e){}
  for(let i=rows.length-1;i>=0;i--){const n=String(rows[i]?.nomor||'').trim();if(n)return n;}
  return '';
}
function iconWhatsApp(){return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.3 11.6a8.3 8.3 0 0 1-12.2 7.3L3.4 20l1.1-4.5a8.3 8.3 0 1 1 15.8-3.9Z"/><path d="M8.2 7.8c.2-.4.4-.5.7-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.3.1.5-.1.7l-.6.8c-.2.2-.1.4 0 .6.7 1.2 1.7 2.2 2.9 2.9.2.1.4.2.6 0l.9-1.1c.2-.2.4-.3.7-.2l1.8.8c.3.1.4.3.4.5 0 .3-.2 1.3-.8 1.8-.6.5-1.4.8-2.4.6-1.2-.2-3-1-5-2.8-1.5-1.3-2.5-2.9-2.9-4-.4-1.2 0-2 .3-2.3Z"/></svg>`;}
function cmIsEoEnabled(value){
  if(typeof value==='boolean')return value;
  return ['true','1','yes','ya','on'].includes(String(value??'').trim().toLowerCase());
}
function cmEoItemId(){return `EOI-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;}
function cmParseEoChecklist(raw){
  let list=raw;
  if(typeof raw==='string'){
    try{list=JSON.parse(raw||'[]');}catch(e){list=[];}
  }
  if(!Array.isArray(list))return [];
  return list.map((x,i)=>({
    id:String(x?.id||cmEoItemId()),
    phase:['Planning','Execution','Post Event'].includes(String(x?.phase))?String(x.phase):'Planning',
    task:String(x?.task||x?.title||`Checklist ${i+1}`),
    pic:String(x?.pic||''),
    dueDate:String(x?.dueDate||''),
    priority:['High','Medium','Low'].includes(String(x?.priority))?String(x.priority):'Medium',
    notes:String(x?.notes||''),
    done:typeof x?.done==='boolean'?x.done:['true','1','yes','ya','done','selesai'].includes(String(x?.done||'').trim().toLowerCase()),
    completedAt:String(x?.completedAt||''),
    completedBy:String(x?.completedBy||'')
  }));
}
function cmEoProgress(raw){
  const items=Array.isArray(raw)?raw:cmParseEoChecklist(raw),total=items.length,done=items.filter(x=>x.done).length;
  return {items,total,done,pct:total?Math.round(done/total*100):0};
}
function cmEoPhaseLabel(v){return v==='Execution'?uiText('Execution','Pelaksanaan'):v==='Post Event'?uiText('Post Event','Pasca Acara'):uiText('Planning','Persiapan');}
function isUrlLike(s) {
  if (!s) return false;
  return /^(https?:\/\/|www\.)/i.test(String(s).trim());
}
function fileNameFromUrl(url) {
  try {
    const u = new URL(url);
    const fileParam = u.searchParams.get('file');
    if (fileParam) return decodeURIComponent(fileParam);
    const segments = u.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && last.includes('.')) return decodeURIComponent(last);
    return u.hostname + u.pathname;
  } catch (e) {
    return url;
  }
}
function parseActivityFiles(raw) {
  if (!raw) return [];
  try { const rows=typeof raw==='string'?JSON.parse(raw):raw; return Array.isArray(rows)?rows.filter(x=>x&&(x.url||x.refId)):[]; }
  catch(e){ return []; }
}
function parseActivityNotula(raw){
  if(!raw)return[];
  if(Array.isArray(raw))return raw.filter(x=>x&&x.id);
  try{const arr=JSON.parse(raw);return Array.isArray(arr)?arr.filter(x=>x&&x.id):[];}catch(e){return[];}
}
function parseDokumentasi(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(d => d && d.refId) : [];
  } catch (e) {
    return [];
  }
}
function getMeetingMode(a){
  if(a?.meetingMode&&['online','offline','hybrid'].includes(a.meetingMode))return a.meetingMode;
  const raw=String(a?.lokasiChannel||'').trim();
  if(/^hybrid$/i.test(raw)||(/https?:\/\//i.test(raw)&&/\s[|;+]\s/.test(raw)))return 'hybrid';
  if(/https?:\/\//i.test(raw)||/\b(ms\s*teams?|microsoft\s*teams?|zoom|google\s*meet|webex|youtube|webinar)\b/i.test(raw))return 'online';
  return 'offline';
}
function getMeetingLink(a){if(a?.meetingLink!=null)return getMeetingMode(a)==='offline'?'':String(a.meetingLink||'');return getMeetingMode(a)==='online'?String(a?.lokasiChannel||''):'';}
function cmAfSanitizeHtml(html){
  const allow=new Set(['B','STRONG','I','EM','U','P','BR','UL','OL','LI','H3','H4','DIV','SPAN','A','BLOCKQUOTE','TABLE','THEAD','TBODY','TR','TD','TH']);
  let doc;try{doc=new DOMParser().parseFromString('<div>'+String(html||'')+'</div>','text/html');}catch(e){return escapeHtml(String(html||''));}
  const walk=node=>{[...node.childNodes].forEach(ch=>{
    if(ch.nodeType===3)return;
    if(ch.nodeType!==1){ch.remove();return;}
    if(!allow.has(ch.tagName)){if(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED'].includes(ch.tagName)){ch.remove();return;}walk(ch);ch.replaceWith(...ch.childNodes);return;}
    [...ch.attributes].forEach(at=>{if(!(ch.tagName==='A'&&at.name==='href'))ch.removeAttribute(at.name);});
    if(ch.tagName==='A'){const h=String(ch.getAttribute('href')||'');if(!/^https?:\/\//i.test(h))ch.removeAttribute('href');else{ch.setAttribute('target','_blank');ch.setAttribute('rel','noopener');}}
    walk(ch);
  });};
  const root=doc.body.firstElementChild||doc.body;walk(root);return root.innerHTML;
}
function cmAfHtmlText(html){const d=document.createElement('div');d.innerHTML=cmAfSanitizeHtml(html);d.querySelectorAll('li,p,div,br,h3,h4,tr').forEach(n=>n.insertAdjacentText('afterend','\n'));return d.textContent.replace(/\n{3,}/g,'\n\n').trim();}
function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  ta.remove();
  return Promise.resolve();
}
const CM_APP_BUILD='CM-DASHBOARD-V20.4-REPORTS-R61007';
const CM_AI_WORKER_STORAGE='cm_ai_worker_url_v1';
const CM_AI_DEFAULT_WORKER='https://cm-assistant.ristya-onlineshop.workers.dev';
const CM_AI_CONTEXT_MAX_CHARS=16000;
function cmAiWorkerUrl(){try{return localStorage.getItem(CM_AI_WORKER_STORAGE)||CM_AI_DEFAULT_WORKER}catch(e){return CM_AI_DEFAULT_WORKER}}
/* ===================== ADAPTER MODUL TRANSFORMASI → AGENDA DASHBOARDCM ===================== */
const ARR=v=>Array.isArray(v)?v:(v?[v]:[]);
const att=v=>{try{return typeof attNorm==='function'?attNorm(v):{no:'',items:[]}}catch(e){return {no:'',items:[]}}};
const isImg=m=>(m.t==='d'&&/^data:image\//i.test(m.data||''))||/^image\//i.test(m.type||'')||/\.(jpe?g|png|gif|webp|bmp)$/i.test(m.nama||m.link||'');
const STATUS={'Selesai':'Completed','Terjadwal':'Scheduled','Berlangsung':'Ongoing','Hari ini':'Ongoing','Ditunda':'Postponed','Dibatalkan':'Cancelled','Menunggu Konfirmasi':'Pending','Tidak Dihadiri':'Not Attended','Belum dijadwalkan':'Pending'};
function mtStatus(x){let s='';try{s=String(actSt(x)[0]||'').split(' · ')[0]}catch(e){s=x.stat||''}return STATUS[s]||'Scheduled'}
function fileList(x,field,prefix){
 return att(x[field]).items.map((m,i)=>{const ref=prefix+':'+x.id+':'+i;MTREF.set(ref,m);
  return m.t==='l'&&m.link?{name:m.nama||'Tautan',url:m.link,nomor:''}:{name:m.nama||'Berkas',refId:ref,nomor:''}});
}
function mtToAgenda(x){
 const src=x.dashboardSource||{},ex=src.extra||{};
 const jam=String(x.jam||''),jm=jam.match(/(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/);
 const und=att(x.und),st=att(x.st);
 const dok=att(x.dok).items.map((m,i)=>({m,i})).filter(o=>isImg(o.m)).map(o=>{const ref='mtd:'+x.id+':'+o.i;MTREF.set(ref,o.m);return {refId:ref,name:o.m.nama||'Dokumentasi'}});
 const notMeta=ARR(src.notulaMeta);
 const notula=att(x.notula).items.map((m,i)=>{const ref='mtn:'+x.id+':'+i;MTREF.set(ref,m);const meta=notMeta.find(z=>(z.fileName||z.name)===m.nama)||{};
  return {id:ref,fileName:m.nama||'Notula',searchPreview:meta.searchPreview||'',textPartCount:0}});
 let nama='';try{nama=typeof actName==='function'?actName(x):x.nama}catch(e){nama=x.nama||''}
 let kat='';try{kat=typeof actKatOf==='function'?actKatOf(x):x.kat}catch(e){kat=x.kat||''}
 return {
  id:String(x.id),no:x.no||'',namaKegiatan:nama||'',kategori:kat||'',
  tglMulai:String(x.tgl||'').slice(0,10),tglSelesai:String(x.tglSelesai||x.tgl||'').slice(0,10),
  waktu:jam,jamMulai:jm?jm[1].replace('.',':'):'',jamSelesai:jm?jm[2].replace('.',':'):'',
  layanan:x.layanan||'',unitPemohon:x.unitP||'',programTerkait:x.program||'',picTimCM:ARR(x.pic).join(', '),
  statusNorm:mtStatus(x),status:mtStatus(x),statusNeedsUpdate:!!ex.statusNeedsUpdate,
  lokasiChannel:x.lokasi||'',meetingLocation:x.lokasi||'',meetingLink:x.link||'',meetingMode:x.mode||'',
  tujuanOutput:x.tujuan||'',catatan:x.catatan||'',pesertaTarget:x.peserta||'',unitAsalNarsum:x.narsum||'',
  ringkasanHasil:x.ringkas||'',tindakLanjut:x.tl||'',notulaTeks:x.notulaTeks||'',
  undangan:und.no||'',undanganUrl:'',undanganFiles:JSON.stringify(fileList(x,'und','mtu')),
  suratTugas:st.no||'',suratTugasUrl:'',suratTugasFiles:JSON.stringify(fileList(x,'st','mts')),
  materi:'',materiFiles:JSON.stringify(fileList(x,'materi','mtm')),
  notula:JSON.stringify(notula),dokumentasi:JSON.stringify(dok),
  estimasiBiaya:ex.estimasiBiaya||'',eoEnabled:!!ex.eoEnabled,eoChecklist:src.eoChecklist||'[]',
  _search:[nama,x.program,x.unitP,ARR(x.pic).join(' ')].join(' ').toLowerCase()
 };
}
function mtAllAgendas(){let rows=[];try{rows=typeof actRows==='function'?actRows():(S.oneonone||[])}catch(e){rows=S.oneonone||[]}return rows.map(mtToAgenda)}
/* Filter Daftar Aktivitas Modul Transformasi → state.filters DashboardCM (judul/cakupan laporan). */
function mtFilterState(){
 const u=S.ui||{},tw=+u.oneTw||0;let from=u.actFrom||'',to=u.actTo||'';
 if(tw&&!from&&!to){const y=+(u.actTahun||S.ui.tahun||new Date().getFullYear()),m1=(tw-1)*3+1,m3=m1+2,last=new Date(y,m3,0).getDate();from=`${y}-${String(m1).padStart(2,'0')}-01`;to=`${y}-${String(m3).padStart(2,'0')}-${last}`}
 const v=x=>x?String(x):'ALL';
 return {kategori:v(u.actKat),program:v(u.actProg),status:v(u.actSt),pic:v(u.actPic),unit:v(u.actUnit),layanan:v(u.actLay),tahun:v(u.actTahun),unitType:'ALL',dateFrom:from,dateTo:to,search:u.actQ||''};
}
function mtFilteredRows(){
 const all=(typeof actRows==='function'?actRows():[]),u=S.ui||{},tw=+u.oneTw||0,kat=u.actKat||'',sf=u.actSt||'',pf=u.actPic||'',q=String(u.actQ||'').toLowerCase();
 const strip=v=>String(v||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 return all.filter(x=>(!u.actTahun||String(x.tahun)===String(u.actTahun))&&(!tw||oneTwOf(x)===tw)&&(!kat||actKatOf(x)===kat)&&(!sf||actSt(x)[0].split(' · ')[0]===sf)&&(!pf||ARR(x.pic).includes(pf))&&(!u.actProg||x.program===u.actProg)&&(!u.actUnit||x.unitP===u.actUnit)&&(!u.actLay||x.layanan===u.actLay)&&(!u.actFrom||(x.tglSelesai||x.tgl||'')>=u.actFrom)&&(!u.actTo||(x.tgl||'9999')<=u.actTo)&&(!q||[actName(x),x.program,x.tema,x.uic,x.kat,x.unitP,ARR(x.pic).join(' '),x.lokasi,x.link,x.tujuan,x.narsum,x.peserta,x.ringkas,x.tl,x.undStatus,strip(x.notulaTeks)].join(' ').toLowerCase().includes(q)));
}
function prepare(){MTREF.clear();state.agendas=mtAllAgendas();state.filters=mtFilterState();}
function libsReady(){const miss=[];if(typeof dayjs==='undefined')miss.push('dayjs');if(typeof JSZip==='undefined')miss.push('JSZip');if(typeof Chart==='undefined')miss.push('Chart.js');if(typeof QRCode==='undefined')miss.push('QRCode');return miss}
function openSingle(id){
 const miss=libsReady();if(miss.length){toast('Pustaka laporan belum termuat: '+miss.join(', ')+'. Periksa koneksi lalu muat ulang halaman.');return}
 prepare();const a=state.agendas.find(z=>String(z.id)===String(id));
 if(!a){toast('Data aktivitas tidak ditemukan.');return}
 MT_FILTERED=[a];cmGenerateSingleActivityDocx(a);
}
function openFiltered(){
 const miss=libsReady();if(miss.length){toast('Pustaka laporan belum termuat: '+miss.join(', ')+'. Periksa koneksi lalu muat ulang halaman.');return}
 prepare();const ids=new Set(mtFilteredRows().map(x=>String(x.id)));MT_FILTERED=state.agendas.filter(a=>ids.has(a.id));
 if(!MT_FILTERED.length){toast('Tidak ada aktivitas sesuai filter.');return}
 cmOpenActivityReportBuilder();
}

/* ===== Ekspor Kalender bulanan ke Word & Excel (port cmXBuildCalendarModel / cmXExportCalendarExcel Dashboard CM) =====
   Data = kegiatan yang terlihat di Kalender Aktivitas (sudah tersaring role, lihat actRows), hari libur dari liburYear()
   (impor resmi → SKB bawaan → proyeksi). */
const xL=lang=>(i,e)=>cmRptT(lang,i,e);
const xLoc=lang=>lang==='en'?'en':'id';
const xMonth=(m,lang)=>{const d=dayjs(m+'-01');return d.isValid()?d.locale(xLoc(lang)).format('MMMM YYYY'):m};
const xDay=(d,lang,fmt='dddd, D MMMM YYYY')=>{const x=dayjs(d);return x.isValid()?x.locale(xLoc(lang)).format(fmt):cmReportSafe(d)};
const xPics=a=>cmPicList(a.picTimCM);
const xSorted=obj=>Object.entries(obj||{}).sort((a,b)=>b[1]-a[1]||String(a[0]).localeCompare(String(b[0])));
function xDateRange(a,lang){const s=a.tglMulai,e=a.tglSelesai&&a.tglSelesai!==a.tglMulai?a.tglSelesai:'';if(!e)return xDay(s,lang,'D MMM YYYY');const ds=dayjs(s),de=dayjs(e);if(ds.isValid()&&de.isValid()&&ds.isSame(de,'month'))return `${ds.format('D')}–${de.locale(xLoc(lang)).format('D MMM YYYY')}`;return `${xDay(s,lang,'D MMM YYYY')} – ${xDay(e,lang,'D MMM YYYY')}`}
const xHolText=h=>h?(h.id||h.en||''):'';
function xCalData(month){
 const ms=dayjs(month+'-01').startOf('day'),me=ms.endOf('month').startOf('day'),firstDow=(ms.day()+6)%7,byDay={},items=[];
 mtAllAgendas().forEach(a=>{const s=dayjs(a.tglMulai).startOf('day');if(!s.isValid())return;let e=dayjs(a.tglSelesai||a.tglMulai).startOf('day');if(!e.isValid()||e.isBefore(s))e=s;
  if(e.isBefore(ms,'day')||s.isAfter(me,'day'))return;items.push(a);let c=s.isBefore(ms,'day')?ms:s;const end=e.isAfter(me,'day')?me:e;
  while(!c.isAfter(end,'day')){const k=c.format('YYYY-MM-DD');(byDay[k]||(byDay[k]=[])).push(a);c=c.add(1,'day')}});
 items.sort((a,b)=>String(a.tglMulai).localeCompare(String(b.tglMulai))||String(a.jamMulai||a.waktu||'').localeCompare(String(b.jamMulai||b.waktu||'')));
 Object.values(byDay).forEach(l=>l.sort((a,b)=>String(a.jamMulai||'99').localeCompare(String(b.jamMulai||'99'))));
 let LB={items:{},label:'',src:''};try{if(typeof liburYear==='function')LB=liburYear(ms.year())}catch(e){}
 const holidays=[];for(let d=1;d<=ms.daysInMonth();d++){const k=ms.date(d).format('YYYY-MM-DD'),h=LB.items[k];if(h)holidays.push({date:k,item:h})}
 const weekOf=k=>Math.floor((dayjs(k).date()-1+firstDow)/7)+1;
 return {month,ms,me,firstDow,byDay,items,holidays,holSrc:LB.src,holLabel:LB.label,weekOf,weeks:Math.ceil((firstDow+ms.daysInMonth())/7)};
}
function xCalNarr(d,lang){const L=xL(lang),n=d.items.length,mLab=xMonth(d.month,lang);
 if(!n)return L(`Tidak ada kegiatan yang tercatat pada **${mLab}**.${d.holidays.length?` Bulan ini memiliki ${d.holidays.length} hari libur nasional/cuti bersama.`:''}`,`No activities are recorded in **${mLab}**.`);
 const days=Object.keys(d.byDay).sort(),busy=[...days].sort((a,b)=>d.byDay[b].length-d.byDay[a].length||a.localeCompare(b))[0];
 let work=0;for(let i=1;i<=d.ms.daysInMonth();i++){const k=d.ms.date(i),dow=(k.day()+6)%7,ks=k.format('YYYY-MM-DD');if(dow<5&&!d.holidays.some(h=>h.date===ks))work++}
 const workDays=days.filter(k=>{const dow=(dayjs(k).day()+6)%7;return dow<5&&!d.holidays.some(h=>h.date===k)}).length;
 const wk={};days.forEach(k=>{wk[d.weekOf(k)]=(wk[d.weekOf(k)]||0)+d.byDay[k].length});const topW=xSorted(wk)[0];
 const offDay=d.items.filter(a=>{const k=a.tglMulai,dow=(dayjs(k).day()+6)%7;return dow>=5||d.holidays.some(h=>h.date===k)}).length;
 const done=d.items.filter(a=>a.statusNorm==='Completed').length,multi=d.items.filter(a=>a.tglSelesai&&a.tglSelesai!==a.tglMulai).length;
 let t=L(`Pada **${mLab}** terdapat **${n} kegiatan** yang tersebar pada ${days.length} hari kalender, mencakup ${workDays} dari ${work} hari kerja (${cmRptPct(workDays,work)}%). Hari tersibuk adalah **${xDay(busy,lang,'dddd, D MMMM')}** dengan ${d.byDay[busy].length} kegiatan, dan pekan ke-${topW[0]} menjadi pekan terpadat (${topW[1]} kegiatan-hari).`,
  `In **${mLab}** there are **${n} activities** across ${days.length} calendar days.`);
 t+=L(` Sebanyak ${done} kegiatan (${cmRptPct(done,n)}%) berstatus selesai.`,` ${done} completed.`);
 if(multi)t+=L(` ${multi} kegiatan berlangsung lebih dari satu hari.`,` ${multi} span more than one day.`);
 if(d.holidays.length)t+=L(` Bulan ini memiliki ${d.holidays.length} hari libur nasional/cuti bersama${d.holSrc==='proyeksi'?' (proyeksi, belum berdasarkan SKB)':''}${offDay?`, dan ${offDay} kegiatan dimulai pada akhir pekan atau hari libur`:''}.`,` ${d.holidays.length} holidays.`);
 else if(offDay)t+=L(` ${offDay} kegiatan dimulai pada akhir pekan.`,` ${offDay} start on a weekend.`);
 return t}
function xWrap({lang,signer,kicker,title,subject,chips,scope,meta,fileName,header,blocks}){const L=xL(lang),sg=signer||cmRptSigner(),date=cmRptLongDate(sg.date||dayjs().format('YYYY-MM-DD'),lang);
 return {kind:'menu',lang,fileName:cmRptFileName(fileName),title:`${kicker} ${title}`,
  cover:{kicker,title,subject,chips:chips||[],scope:scope||[],meta:[...(meta||[]),[L('Disusun oleh','Prepared by'),'Pusmantap — BaTii'],[L('Tanggal penyusunan','Prepared on'),date]],tte:{qr:null,name:sg.name,title:sg.title,label:sg.label,city:sg.city,date}},header,blocks}}
function xScope(){let g='';try{g=typeof actGrp==='function'?actGrp():''}catch(e){}let u='';try{u=(ME&&ME.unit)||''}catch(e){}
 return g==='unit'?['Kegiatan PMO & CMO '+u]:g==='tim'?['Kegiatan terkait modul tim']:['Kegiatan PMO & CMO Kemenkeu (Pusat)']}
async function buildCalendarModel(month,o){o=o||{};prepare();const lang=o.lang||'id',L=xL(lang);cmRptLangCur=lang;
 const d=xCalData(month),n=d.items.length,mLab=xMonth(d.month,lang),blocks=[],dn=['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
 const days=Object.keys(d.byDay).sort(),busy=[...days].sort((a,b)=>d.byDay[b].length-d.byDay[a].length||a.localeCompare(b))[0];
 const done=d.items.filter(a=>a.statusNorm==='Completed').length,open=d.items.filter(a=>['Scheduled','Ongoing','Pending'].includes(a.statusNorm)).length;
 blocks.push({t:'h1',text:L('Ringkasan Bulan','Monthly Summary')});
 blocks.push({t:'kpis',items:[{label:'Kegiatan',value:n,sub:mLab,color:'2F5BD3'},{label:'Hari berkegiatan',value:days.length,sub:'hari kalender',color:'1BA7C9'},
  {label:'Hari tersibuk',value:busy?dayjs(busy).format('D'):'-',sub:busy?`${xDay(busy,lang,'dddd')} · ${d.byDay[busy].length} kegiatan`:'-',color:'7C5CE0'},
  {label:'Selesai',value:done,sub:`${cmRptPct(done,n)}%`,color:'16A37F'},{label:'Belum selesai',value:open,sub:'terjadwal / menunggu',color:'F2A93B'},
  {label:'Hari libur',value:d.holidays.length,sub:d.holSrc==='proyeksi'?'nasional & cuti (proyeksi)':'nasional & cuti bersama',color:'E25563'}]});
 blocks.push({t:'p',text:xCalNarr(d,lang)});
 blocks.push({t:'h1',text:`Kalender ${mLab}`});
 const rows=[];for(let w=0;w<d.weeks;w++){const r=[];for(let i=0;i<7;i++){const dayNum=w*7+i-d.firstDow+1;if(dayNum<1||dayNum>d.ms.daysInMonth()){r.push({text:'',bg:'F5F6F8'});continue}
  const k=d.ms.date(dayNum).format('YYYY-MM-DD'),evs=d.byDay[k]||[],h=d.holidays.find(x=>x.date===k);let txt=`**${dayNum}**`;if(h)txt+=`\n${xHolText(h.item)}`;
  evs.slice(0,3).forEach(a=>{txt+=`\n• ${a.jamMulai?a.jamMulai.replace(':','.')+' ':''}${cmReportSafe(a.namaKegiatan).slice(0,48)}${String(a.namaKegiatan||'').length>48?'…':''}`});if(evs.length>3)txt+=`\n+${evs.length-3} lainnya`;
  r.push(h?{text:txt,bg:h.item.type==='collective'?'E3F4F5':'FDECEE'}:(i>=5?{text:txt,bg:'F8FAFD'}:txt))}rows.push(r)}
 blocks.push({t:'table',small:true,fixed:true,head:dn,widths:[14,14,14,14,14,15,15],rows});
 blocks.push({t:'p',muted:true,text:'Sel merah muda menandai hari libur nasional, hijau toska muda menandai cuti bersama, dan abu-abu muda menandai akhir pekan. Sumber hari libur: '+(d.holLabel||'-')+'.'});
 if(n){blocks.push({t:'h1',text:'Sebaran Waktu Kegiatan'});
  const wkMap={};for(let w=1;w<=d.weeks;w++)wkMap[w]=0;days.forEach(k=>{wkMap[d.weekOf(k)]+=d.byDay[k].length});
  const dowMap=[0,0,0,0,0,0,0];days.forEach(k=>{dowMap[(dayjs(k).day()+6)%7]+=d.byDay[k].length});
  try{const wkImg=await cmRptChart(cmRptBarCfg(Object.keys(wkMap).map(w=>`Pekan ${w}`),Object.values(wkMap),{colors:Object.keys(wkMap).map(()=>'#2F5BD3')}),460,300);
   const dowImg=await cmRptChart(cmRptBarCfg(dn,dowMap,{colors:dn.map((_,i)=>i>=5?'#8A94A6':'#16A37F')}),460,300);
   blocks.push({t:'charts',items:[{title:'Kegiatan per pekan',img:wkImg},{title:'Kegiatan per hari dalam pekan',img:dowImg}]})}catch(e){console.info('Grafik kalender:',e)}
  const wkE=xSorted(wkMap),dE=dowMap.map((v,i)=>[dn[i],v]).sort((a,b)=>b[1]-a[1]),quiet=Object.entries(wkMap).filter(x=>!x[1]).map(x=>x[0]);
  blocks.push({t:'p',text:`Grafik kiri menghitung kegiatan per hari kalender pada setiap pekan (kegiatan multi-hari dihitung pada setiap harinya). Pekan ke-${wkE[0][0]} paling padat dengan ${wkE[0][1]} kegiatan-hari${quiet.length?`, sementara pekan ke-${quiet.join(', ')} tidak memiliki kegiatan`:''}. Grafik kanan menunjukkan hari **${dE[0][0]}** sebagai hari dengan kegiatan terbanyak (${dE[0][1]})${dowMap[5]+dowMap[6]?`, dan terdapat ${dowMap[5]+dowMap[6]} kegiatan-hari pada akhir pekan`:', tanpa kegiatan pada akhir pekan'}.`});
  blocks.push({t:'h1',text:'Agenda Kegiatan'});
  blocks.push({t:'table',small:true,head:['No','Tanggal','Waktu','Kegiatan','Kategori','Unit','PIC','Status'],widths:[5,13,9,29,10,10,12,12],
   rows:d.items.map((a,i)=>[String(i+1),xDateRange(a,lang),cmReportSafe(a.waktu),cmRptActCell(a,lang),cmReportSafe(a.kategori),cmReportSafe(a.unitPemohon),xPics(a).join('\n')||'-',cmRptStatusCell(a.statusNorm,lang)])})}
 if(d.holidays.length){blocks.push({t:'h1',text:'Hari Libur Nasional dan Cuti Bersama'});
  blocks.push({t:'table',head:['Tanggal','Keterangan','Jenis','Kegiatan pada hari itu'],widths:[24,40,16,20],
   rows:d.holidays.map(h=>[xDay(h.date,lang,'dddd, D MMM YYYY'),xHolText(h.item),h.item.type==='collective'?'Cuti bersama':'Libur nasional',{text:String((d.byDay[h.date]||[]).length),align:'center'}])})}
 return xWrap({lang,signer:o.signer,kicker:'LAPORAN KALENDER KEGIATAN',title:mLab.toUpperCase(),subject:'Agenda PMO & CMO — Modul Transformasi',
  chips:[`${n} kegiatan`,`${days.length} hari berkegiatan`],scope:xScope(),meta:[['Bulan',mLab],['Jumlah kegiatan',String(n)],['Hari libur',String(d.holidays.length)]],
  fileName:`Kalender Kegiatan - ${mLab}`,header:`Kalender Kegiatan · ${mLab}`,blocks})}
async function calendarWord(month){try{toast('Menyiapkan file Word…');const model=await buildCalendarModel(month,{lang:'id',signer:cmRptSigner()});const blob=await cmRptDocx(model);cmRptDownloadBlob(blob,model.fileName+'.docx');toast('Kalender berhasil diekspor ke Word.')}
 catch(e){console.error(e);toast('Gagal ekspor Word: '+(e.message||e))}}
function calendarExcel(month){try{if(typeof XLSX==='undefined')throw new Error('Pustaka Excel belum termuat');prepare();
 const lang='id',d=xCalData(month),mLab=xMonth(d.month,lang),wb=XLSX.utils.book_new(),dn=['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'],plain=s=>String(s||'').replace(/\*\*/g,'');
 const days=Object.keys(d.byDay),done=d.items.filter(a=>a.statusNorm==='Completed').length;
 const sum=[[`Kalender Kegiatan ${mLab}`],[CM_RPT_ORG[2]+' — '+CM_RPT_ORG[1]],[],['Indikator','Nilai'],['Jumlah kegiatan',d.items.length],['Hari berkegiatan',days.length],['Kegiatan selesai',done],['Hari libur nasional/cuti bersama',d.holidays.length],['Sumber hari libur',d.holLabel||'-'],[],['Uraian'],[plain(xCalNarr(d,lang))],[],['Cakupan',xScope().join(' • ')]];
 const ws0=XLSX.utils.aoa_to_sheet(sum);ws0['!cols']=[{wch:38},{wch:90}];XLSX.utils.book_append_sheet(wb,ws0,'Ringkasan');
 const grid=[[`Kalender ${mLab}`],dn];
 for(let w=0;w<d.weeks;w++){const keys=[];for(let i=0;i<7;i++){const dayNum=w*7+i-d.firstDow+1;keys.push(dayNum>=1&&dayNum<=d.ms.daysInMonth()?d.ms.date(dayNum).format('YYYY-MM-DD'):null)}
  grid.push(keys.map(k=>{if(!k)return '';const h=d.holidays.find(x=>x.date===k);return `${dayjs(k).date()}${h?' — '+xHolText(h.item):''}`}));
  const max=Math.max(0,...keys.map(k=>k?(d.byDay[k]||[]).length:0));
  for(let r=0;r<max;r++)grid.push(keys.map(k=>{const a=k?(d.byDay[k]||[])[r]:null;return a?`• ${cmReportSafe(a.namaKegiatan)}${cmRptHas(a.waktu)?' ('+a.waktu+')':''}`:''}))}
 const ws1=XLSX.utils.aoa_to_sheet(grid);ws1['!cols']=dn.map(()=>({wch:34}));XLSX.utils.book_append_sheet(wb,ws1,'Kalender');
 const ag=d.items.map((a,i)=>({No:i+1,'Tanggal Mulai':a.tglMulai||'','Tanggal Selesai':a.tglSelesai||a.tglMulai||'',Hari:xDay(a.tglMulai,lang,'dddd'),Waktu:a.waktu||'','Nama Kegiatan':a.namaKegiatan||'','Nomor Undangan':cmRptInvNo(a,lang),Kategori:a.kategori||'','Program Terkait':a.programTerkait||'','Unit Pemohon':a.unitPemohon||'',Layanan:a.layanan||'',PIC:xPics(a).join(', '),'Lokasi / Kanal':a.lokasiChannel||'',Status:cmRptStatus(a.statusNorm)}));
 const ws2=ag.length?XLSX.utils.json_to_sheet(ag):XLSX.utils.aoa_to_sheet([['Tidak ada kegiatan pada bulan ini.']]);
 ws2['!cols']=[{wch:5},{wch:12},{wch:12},{wch:10},{wch:14},{wch:60},{wch:18},{wch:14},{wch:18},{wch:14},{wch:9},{wch:28},{wch:28},{wch:16}];XLSX.utils.book_append_sheet(wb,ws2,'Agenda');
 const rk=[['Tanggal','Hari','Jumlah Kegiatan','Daftar Kegiatan','Keterangan Libur','Jenis Libur']];
 for(let i=1;i<=d.ms.daysInMonth();i++){const k=d.ms.date(i).format('YYYY-MM-DD'),ev=d.byDay[k]||[],h=d.holidays.find(x=>x.date===k);rk.push([k,xDay(k,lang,'dddd'),ev.length,ev.map(a=>cmReportSafe(a.namaKegiatan)).join('; '),h?xHolText(h.item):'',h?(h.item.type==='collective'?'Cuti bersama':'Libur nasional'):''])}
 const ws3=XLSX.utils.aoa_to_sheet(rk);ws3['!cols']=[{wch:12},{wch:10},{wch:10},{wch:100},{wch:40},{wch:16}];XLSX.utils.book_append_sheet(wb,ws3,'Rekap Harian');
 XLSX.writeFile(wb,cmRptFileName(`Kalender Kegiatan - ${mLab}`)+'.xlsx');toast('Kalender berhasil diekspor ke Excel.')}
 catch(e){console.error(e);toast('Gagal ekspor Excel: '+(e.message||e))}}
if(typeof dayjs!=='undefined'){try{dayjs.locale('id')}catch(e){}}
if(typeof ACT!=='undefined'){
 ACT.oneReport=el=>openSingle(el.dataset.id);
 ACT.oneReportFilter=()=>openFiltered();
}
window.MT_DCM_REPORT={openSingle,openFiltered,mtToAgenda,_buildSingle:(id,o)=>{prepare();const a=state.agendas.find(z=>String(z.id)===String(id));return cmRptBuildSingleModel(a,Object.assign({lang:'id',ai:false,signer:cmRptSigner()},o||{}))},_html:m=>cmRptHtml(m),_docx:m=>cmRptDocx(m),calendarWord,calendarExcel,_calendarModel:buildCalendarModel,version:'dcm-R61007'};
})();
