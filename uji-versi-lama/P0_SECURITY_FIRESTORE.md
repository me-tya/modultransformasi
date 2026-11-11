# P0 — Pengendalian Akses Firebase dan Aktivasi Workflow

Repository: `me-tya/modultransformasi` — November 2026.

## Yang sudah tersedia di `index.html`

- Change Request berjenjang: PMO Unit → PMO Kemenkeu (hasil telaah wajib) → Ketua Organisasi Pengelola Proyek dan Perubahan (keputusan dan rujukan wajib) → PMO Kemenkeu (penerapan WBS setelah persetujuan).
- Rekam `pic`, `hist`, `owner`, `prog`, `telaah`, `keputusan`; masing-masing item CR memiliki status dan penerima tindakan.
- Tugas dan notifikasi mengikuti PIC dan role yang berlaku melalui mekanisme `tasks()` / `BELL` yang sudah ada.
- Superadmin dapat mengalihkan PIC CR aktif disertai alasan.
- Penutupan proyek mempunyai tiga dasar normatif; pengajuan dan persetujuan menolak kekurangan kriteria/dokumen sesuai dasar.
- Bantuan PMO menyediakan alur CR, Peta Menu memiliki tautan ke 7 Dokumen Proyek dan subtab CM.

## Penting: belum menjadi keamanan server-side

Perubahan kode UI/client **tidak cukup** untuk mengamankan Firebase. `RULES` yang tertanam di `index.html` merupakan string contoh/penampil; **tidak otomatis menyebarkan Firestore Security Rules yang berlaku**. Security Rules yang aktif harus diverifikasi langsung di Firebase Console/proyek yang berwenang sebelum menggunakan workflow untuk data resmi.

Keterbatasan arsitektur saat ini:
1. `fsDocs()/fsFlush()` menyinkronkan berbagai koleksi dokumen dari state client; sebagian data masih perlu difilter dan diberi label kepemilikan unit/proyek per dokumen.
2. `canW()` / `scope()` di browser dapat disiasati melalui akses langsung ke Firestore bila aturan database memperbolehkan.
3. Kebijakan yang memberi hak tulis `wbs` atau `crs` kepada role secara umum, tanpa memvalidasi dokumen lama/baru, unit, dan status persetujuan, masih berisiko melewati alur.
4. Role `KETUA` yang baru memerlukan izin pembaruan dokumen CR secara spesifik pada **aturan Firestore terpasang**; izin umum untuk role PMO tidak otomatis mengizinkan Ketua.

## Persyaratan implementasi backend sebelum go-live

1. **Normalisasi kepemilikan data.** Simpan `ownerUnit`, `programId`, `projectId`, `createdBy` (dan `assigneeUid`) per dokumen yang relevan; lakukan migrasi data lama. Jangan mengandalkan pencocokan nama unit pada string UIC yang bebas diedit.
2. **Role & identity tepercaya.** Terbitkan role dan unit via Firebase Authentication custom claims atau rekaman user yang hanya dapat dikelola administrator; bukan parameter bebas dari browser.
3. **Aturan baca/tulis lintas unit.** Unit hanya boleh membaca dan memodifikasi data sesuai cakupannya (atau sesuai dasar kebutuhan baca lintas unit yang ditetapkan). Jangan izinkan pembacaan massal semua `crs`, `wbs`, bukti, dan artefak per-unit tanpa pemeriksaan.
4. **Transisi CR atomik.** Backend/Cloud Functions atau rules validasi per-field wajib menegakkan matriks:
   - PMOU: `Draft/Dikembalikan → Diajukan` untuk proyek sendiri.
   - PMOK/PIC: `Diajukan/Telaah → Menunggu Persetujuan Ketua` disertai `telaah`.
   - KETUA/PIC: `Menunggu Persetujuan Ketua → Disetujui Ketua/Ditolak` disertai `keputusan.by`, `ref`, `cat`.
   - PMOK/PIC: `Disetujui Ketua → Diterapkan` disertai perubahan WBS tepat satu kali.
   - Penugasan kembali PIC hanya oleh administrator, dengan riwayat immutable.
5. **Batasi tulis WBS.** Mutasi baseline dari CR harus dilakukan secara atomik oleh backend tepercaya sesudah validasi otorisasi Ketua; bukan langsung dari client `crApply`. Hindari akses tulis `wbs` yang memberi kewenangan melewati persetujuan CR.
6. **Penutupan proyek.** Validasi dokumen dan tiga dasar penutupan pada backend saat pengajuan dan persetujuan, bukan hanya pada `tpP0Gate()` browser.
7. **Audit trail immutable.** Simpan transisi dalam append-only collection dengan timestamp server, actor UID dan status lama/baru; pengguna biasa tidak boleh mengedit/menghapusnya.
8. **Uji Firestore Emulator.** Uji minimal dua PMO dalam role sama namun hanya satu PIC, dua PMO Unit berbeda, KETUA, PMOK, CMO, akun nonaktif, akses tanpa login, direct Firestore writes, dan race/double approval. Harus ada pengujian negatif terhadap akses data lintas unit dan WBS sebelum persetujuan.

## Aktivasi role Ketua

- Superadmin login ke Pengaturan → Pengguna → tambahkan akun dengan email Kemenkeu yang benar dan role **Ketua Organisasi Pengelola Proyek dan Perubahan**; tidak ada akun Ketua fiktif yang otomatis dibuat.
- Matriks hak akses role Ketua diisi otomatis saat Superadmin membuka aplikasi: `cr:R`, `crok:RU`, menu lainnya `-`.
- Setelah aturan Firestore benar-benar ditinjau dan diterapkan, lakukan uji E2E dari PMO Unit sampai WBS berubah dan cek audit.

## Checklist rilis
- [x] Alur, modal telaah/keputusan, PIC, notifikasi dan histori di kode browser
- [x] Validasi tujuh bagian Dokumen Proyek
- [x] Tiga alasan dan validasi Penutupan Proyek di kode browser
- [x] Bantuan Alur Change Request dan Peta Menu level tab
- [ ] Akun Ketua riil ditetapkan oleh administrator
- [ ] Deployed Firestore rules diverifikasi dan diperketat
- [ ] Kontrol keamanan diuji pada emulator + data uji antarunit
- [ ] Workflow CR dan penutupan dipindahkan ke transaksi backend yang otoritatif

**Status:** kode workflow telah diperbarui, tetapi pengamanan backend dan uji operasional belum selesai. Jangan menganggap workflow P0 ini siap untuk keputusan resmi sampai daftar syarat rilis terpenuhi.
