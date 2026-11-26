# MT Incremental Sync — fase 1 (branch uji, jangan merge dahulu)

Baseline: 3aa263be11cf4c63fffabd83bc0b14acb7afe288, backup 261126-MT-12.
- Cache Firestore persisten multi-tab opt-in pada perangkat tepercaya via Pengaturan > Database. Login tetap memverifikasi akun dari server; cache tidak dianggap data resmi.
- Snapshot listener memakai docChanges setelah baseline server dan rebuild penuh setelah snapshot cache/pending. Penghematan billing dari docChanges sendiri tidak diklaim.
- Log audit tidak dibaca saat login. Buka Log Aktivitas atau riwayat aktivitas yang memerlukan fallback; query maksimum 400, cache sesi 5 menit, refresh eksplisit.
- Quota circuit breaker pada error resource-exhausted/quota: jeda listener/write dan jaringan proyek utama, bertahan hingga pergantian hari Pasifik; reload setelah reset.
- Perubahan dokumen yang sudah tercakup fsImportAllowed dibackup ke outbox saat save setelah baseline lengkap. Retry eksplisit memakai compare-and-set yang sudah ada. Data lokal Non-ISTK ditampilkan terpisah dari data terkonfirmasi. Pengguna, log, file lampiran dan config akses tidak masuk outbox umum.
- Tidak mengubah rules, struktur Firestore, database produksi, atau Dashboard CM. Tidak ada mode login offline penuh. Koleksi yang dipakai lintas modul tetap dibaca saat login. Delta antar sesi bergantung pada resume SDK; migrasi timestamp/tombstone seluruh koleksi memerlukan rancangan, backup produksi dan pengujian lanjutan.
- LocalStorage/cache browser harus diperlakukan sebagai data kerja sensitif. Jangan aktifkan cache pada perangkat bersama.
- Uji Node lokal: empat test baru lulus; suite baseline 246 lulus, empat gagal yang sama pada Project Selection (header-charts-charter-history, navigation-tooltips, project-selection-bank). Belum diuji Firebase emulator/produksi atau penghematan billed reads aktual.
