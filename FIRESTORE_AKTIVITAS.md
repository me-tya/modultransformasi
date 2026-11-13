# Memasang aturan Firestore untuk Aktivitas & Kalender

Aturan ini membatasi **siapa yang bisa membaca dan menulis** kegiatan di koleksi `oneonone`, sesuai pembagian di aplikasi:

| Role | Baca | Tulis |
|---|---|---|
| Superadmin, PMO Kementerian, CMO Kementerian | Seluruh koleksi | Seluruh koleksi |
| Ketua | Seluruh koleksi | — |
| PMO & CMO Unit Eselon I | Kegiatan milik unitnya (`ownGrp = unit`, `ownUnit = unit akun`) | Tambah, ubah, hapus kegiatan milik unitnya; pemilik tidak bisa dipindah |
| Tim Pengelola Proyek | Kegiatan yang `modKeys`-nya memuat modul timnya | Tambah, ubah, hapus kegiatan milik timnya |
| Tanpa login / akun nonaktif | — | — |

Data pribadi Tim PMO & CMO Unit (NIP, HP, foto) dan master Pusmantap (dokumen `cfg-…`) hanya terbaca oleh Pusat.

Aturan lengkap ada di berkas [`firestore.rules`](firestore.rules). Aturan ini juga menyertakan koleksi lain persis seperti contoh yang tertanam di aplikasi. Setiap perubahan berkas diuji otomatis di Firestore Emulator lewat GitHub Actions (**Uji aturan Firestore**, 28 skenario).

## Langkah pemasangan

1. **Pastikan aplikasi versi terbaru sudah tayang**, lalu buka dengan Ctrl+F5.
2. **Masuk sekali sebagai Superadmin, PMO Kementerian, atau CMO Kementerian.** Aplikasi otomatis melengkapi "stempel akses" (`ownGrp`, `ownUnit`, `ownMods`, `modKeys`) pada semua kegiatan lama. Tunggu sampai lencana database menunjukkan **Tersimpan ke Firestore**.
   Langkah ini perlu agar Tim Pengelola Proyek bisa melihat kegiatan Pusat yang Program-nya terkait modulnya. Langkah ini juga perlu agar kegiatan yang kemarin sudah dibuat unit/tim muncul di akun unit/tim tersebut.
3. **Cadangkan aturan yang sedang berlaku.** Buka [Firebase Console](https://console.firebase.google.com) → proyek Modul Transformasi → **Firestore Database** → tab **Rules**. Salin seluruh isinya ke berkas teks, misalnya `rules-cadangan-2026-11-13.txt`.
4. **Bandingkan dengan `firestore.rules`.** Bagian di luar `match /oneonone/{id}` seharusnya sama dengan aturan yang berlaku. Kalau di Console ada aturan tambahan yang tidak ada di berkas ini, sisipkan aturan itu ke `firestore.rules` dulu (atau minta Claude menyisipkannya) supaya tidak hilang.
5. **Tempel isi `firestore.rules`** ke editor Rules (ganti seluruh isinya), lalu klik **Publish**. Perubahan berlaku dalam ±1 menit.
6. **Uji dengan akun nyata:**
   - Akun PMO Unit (mis. PMO DJKN): menu Aktivitas hanya menampilkan kegiatan DJKN; tambah kegiatan baru berhasil tersimpan.
   - Akun CMO dari unit yang sama: melihat kegiatan yang sama.
   - Akun PMO Kementerian: semua kegiatan Pusat tetap tampil dan bisa diubah.
   - Kalau muncul "Ditolak" / *permission-denied*, catat akun dan langkahnya, lalu lanjut ke Rollback.

## Rollback

Firestore Database → Rules → tempel kembali isi berkas cadangan dari langkah 3 → Publish.

## Syarat data pengguna

Aturan membaca profil di koleksi `users/{email}`:

- `aktif` harus `true`.
- `role` salah satu: `SA`, `PMOK`, `CMOK`, `KETUA`, `PMOU`, `CMOU`, `TIM`.
- `unit` untuk PMOU/CMOU **harus sama persis** dengan nama unit yang dipakai pada kegiatan (mis. `DJKN`).
- `modules` untuk TIM berisi kode modul yang ditugaskan (Pengaturan › Pengguna › Modul ditugaskan).

## Yang belum dicakup

- Berkas lampiran (koleksi `files`) masih terbaca oleh semua akun aktif yang mengetahui ID berkasnya. ID-nya acak dan tidak bisa didaftar dari aplikasi unit, tapi belum dibatasi per pemilik.
- Koleksi selain `oneonone` belum dibatasi per unit. Lihat daftar persyaratan di [`P0_SECURITY_FIRESTORE.md`](P0_SECURITY_FIRESTORE.md).
