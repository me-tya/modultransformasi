# modultransformasi
## Standar UI: Filter, Cari, dan Ikon Informasi

Aturan ini berlaku untuk seluruh area Modul Transformasi (acuan pertama: Project Selection) dan perlu diikuti saat dibangun ulang.

**Panel Filter** (`mt-filter-kit.js`, komponen `.mt-std-filter`)
- Hanya memuat kolom *kategori* yang tampil di tabel/tampilan aktif: Tahun, Program, UIC, Status, Kategori, Asal, Kelengkapan, Tahapan, PIC, dsb.
- Pilihan dropdown diambil dari data yang ada (bukan daftar tetap), kecuali status baku yang memang didefinisikan aturan bisnis.
- Tidak memuat kolom teks bebas (nama, deskripsi, narasi, catatan) maupun kolom hampir-unik (kode, nomor dokumen) — keduanya dilayani kolom Cari.
- Setiap filter yang ditampilkan wajib benar-benar menyaring data; filter yang tidak berpengaruh dihapus.
- Tampilan satu-program (Charter, Penetapan, Draft RKMK) memakai pemilih Program tanpa opsi "Semua Program".
- Tata letak grid sama lebar; Program memakai 2 kolom. Jumlah kolom menyesuaikan isi agar simetris: ≤5 unit = satu baris penuh, 6 unit = 3×2, 7–8 unit = 4 kolom. Tablet 2 kolom, ponsel 1 kolom.
- Header: judul "Filter · nama tab", label filter aktif, Atur ulang (mengosongkan filter dan Cari tab tersebut), tombol buka/tutup.

**Kolom Cari** (`MT_TABSEARCH`)
- Diletakkan di kanan baris tab tampilan, bukan di dalam panel Filter.
- Hanya mencari teks pada tabel tab tersebut; tab tanpa tabel (pembuat dokumen, formulir) tidak diberi Cari.
- Di tablet/ponsel turun ke baris sendiri di bawah tab.

**Ikon Informasi** (`mt-info-icon.js`, `MT_INFO_ICON`)
- Deskripsi di bawah judul bagian dibungkus ikon ⓘ di samping judul; tampil saat hover, fokus, atau klik/tap.
- Bila ikon ⓘ yang ada sudah memuat informasi serupa, teks deskripsi cukup dihapus.

### Peta filter Project Selection

| Tab | Filter | Cari (samping tab) |
|---|---|---|
| Usulan Program › Riwayat Program | Tahun (termasuk Semua), UIC, Status | nama, kode, UIC |
| Usulan Program › Usulan Program | Tahun, UIC, Asal, Status, Kelengkapan | nama, kode, UIC |
| Usulan Program › Buat Dokumen Portofolio | Tahun | — |
| Pemetaan › Riwayat Proyek | Tahun Anggaran, Tahun Sumber, Program Sumber, UIC | nama proyek, kode, program, UIC |
| Pemetaan › Usulan Proyek | Tahun, Program, UIC Proyek, Status, Kategori | proyek, aplikasi, deskripsi, UIC |
| Pemetaan › Buat Dokumen Proyek | Tahun, Program | — |
| Prioritasi › Penilaian & Peringkat | Tahun, Program, UIC Proyek, Status Penilaian | proyek, UIC, kategori |
| Charter Program, Penetapan Program | Tahun, Program | — |
| Draft RKMK | Tahun, Program, Status Reviu | — |

### Peta filter Change Management

Panel Filter CM memakai grid 6 kolom (`.fbar.mt-g6`, fungsi `fGrid` di index.html): field terakhir otomatis melebar sehingga setiap baris penuh.

- **Filter cakupan (semua tab)**: Tahun, Periode, Program, Unit, Peran unit, Tahapan, Modul.
- **Filter kolom tabel (otomatis per tab)**: kolom pilihan (`t:'sel'`) pada tabel yang sedang tampil, selain Modul, ditambah kolom turunan pada `CF_EXTRA` (Register Risiko: Jenis risiko & Tingkat; Keberhasilan CM: Status; Monev Pelaksanaan: Status implementasi; Pelaksanaan: Status). Pilihan diambil dari nilai yang ada di tabel. State: `S.ui.cf[idTabel][kolom]`; diterapkan di `tRows` sebelum pencarian teks.
- **Cari**: bila satu baris subtab hanya membawahi satu tabel, kolom Cari tabel dipindah ke kanan baris subtab (`MT_PLACE_TBL_SEARCH`). Tab tanpa subtab (Jaringan, Pelaksanaan, Evaluasi Pasca, Penutupan) tetap memakai Cari di header tabel.
- Atur ulang mengosongkan filter cakupan, filter kolom, dan Cari pada tabel yang tampil.
