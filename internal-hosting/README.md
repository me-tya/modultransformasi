# Hosting internal Modul Transformasi — tahap persiapan
Branch terpisah dari main. Belum merupakan aplikasi produksi yang sudah bermigrasi.

## Artefak
- backup-api.cjs: handler GET /api/v1/backup untuk backend Node.js; database-neutral melalui adapter.
- backup-client.js: klien unduhan JSON same-origin tanpa fallback Firebase.
- backup-api.test.cjs: tes kontrak dengan data sintetis; jalankan node --test internal-hosting/backup-api.test.cjs.

## Kontrak integrasi
Backend memasang createBackupHandler dengan authenticate(req) yang memverifikasi sesi SSO internal dan role SA aktif dari server, bukan header/role yang dikirim oleh browser.
readSnapshot({includeAttachments,user}) harus membaca database tujuan dalam snapshot konsisten; mengembalikan {complete:true,sourceId,attachmentsComplete,collections:{nama:[{id,data}]}}. sourceId merupakan label non-rahasia; jangan sertakan DSN/kredensial. Attachment harus benar-benar diekspor dari storage internal (atau files kosong jika memang tidak ada), bukan hanya URL. Provider harus menggunakan allowlist seluruh koleksi yang disepakati, menangani tipe data dan pagination, dan menolak hasil parsial. Audit akses backup di backend, dengan metadata saja. Handler tidak mengubah database. Untuk data besar gunakan streaming/job export yang terotorisasi; implementasi referensi ini menggunakan JSON dalam memori.

## Langkah migrasi yang belum dilaksanakan
1. Konfirmasi DBMS, API/runtime yang diizinkan, SSO, storage, koneksi server, dan lingkungan uji internal. Kredensial hanya di secret manager/server.
2. Inventaris FS_ARR, FS_MAP, config, files, IndexedDB, sumber data tambahan, sinkron Dashboard CM, integrasi eksternal, dan semua modul yang memakai Firebase. Jangan mengandalkan cache browser.
3. Ekspor sumber Firestore sekali dari lingkungan terotorisasi, beserta lampiran dan metadata. Simpan terenkripsi internal. Migrasikan ID, relasi, status, tanggal, dan audit; autentikasi dimigrasikan ke SSO tanpa password/hash.
4. Siapkan skema database tujuan dan adapter server, CRUD, role/scope authorization, audit dan concurrency control. Verifikasi count per entitas dan relasi, uji lampiran dan restore di staging.
5. Integrasikan seluruh frontend (load/save, login, lampiran, backup, sinkronisasi) dengan API internal. Untuk build internal hapus Firebase SDK/config serta semua fallback eksternal; host library statis secara lokal. Hubungkan Backup All ke MTInternalBackup.backupAll. Jangan hanya mengganti tombol backup, sebab aplikasi utama tetap memakai Firebase.
6. Uji E2E di staging; verifikasi tidak ada request keluar ke Firebase, data benar dan fitur lengkap. Baru deploy build internal; pertahankan main GitHub Pages sebagai lingkungan lama sampai cutover disetujui.

Belum ada DBMS/endpoints/SSO internal yang diberikan, sehingga tidak ada koneksi atau migrasi data produksi yang diklaim. Jangan deploy branch ini sebagai pengganti aplikasi produksi.
