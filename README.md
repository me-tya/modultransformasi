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
- Proporsi: baris tab mengisi sisa ruang (tab sama lebar), Cari selebar `clamp(260px, 32%, 420px)` agar placeholder terbaca utuh.
- Hanya mencari teks pada tabel tab tersebut; tab tanpa tabel (pembuat dokumen, formulir) tidak diberi Cari.
- Di tablet/ponsel turun ke baris sendiri di bawah tab.
- WBS & progres: Cari tetap di kanan baris subtab (sama dengan tab lain); tombol aksi (+ Item WBS, menu ⋮) di kanan kepala tabel *Daftar Item WBS*. Chip Program tidak dipakai (pilihan Program ada di panel Filter); bila satu program dipilih, tampil strip info charter.
- Narasi T-Program (tanpa tabel): Cari di kanan subtab menyaring daftar program (kode/nama).

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

## CMO › Jaringan Pengelola Proyek dan Perubahan: SK Tim (Tim Lainnya)

Modul `mt-jaringan-sk.js` (`window.MT_JARINGAN_SK.attach({S,ME,mods,save,toast,mk})`) menggantikan tampilan lama tab Jaringan (data `S.jj` tetap tersimpan, tidak ditampilkan). Data disimpan di `S.modMeta.__JJSK__ = {version, sk:[...]}` sehingga ikut tersinkron lewat jalur `modMeta` (Firestore/localStorage). Tampil di `#cmo-jaringan` dan `#modul-<kode>-t-jaringan`.

**Daftar**: semua modul (item ADP) yang memiliki item WBS kegiatan *Analisis Kebutuhan Jejaring/Jaringan Perubahan* (tahap C5, `jjMods()` di index.html) pada cakupan filter CMO; modul tanpa SK Tim tampil berstatus *Belum dirancang* dengan tombol + Rancang. **Filter** memakai panel standar CM (`cmoFlt`) + filter kolom tabel semu `T.jjsk`: Pemilik probis, Unit mengirim, Deadline isian, Posisi alur (`S.ui.cf.jjsk`). **Contoh data**: bila belum ada SK Tim, PMO/CMO Kemenkeu ditawari popup untuk memuat contoh SK Tim Modul Mekanisme Kerja (OA-84); bisa juga dari Bantuan › Peta Menu › Fitur.

### Alur dan status
`rancang` → `isian` (pengisian unit) → legal drafting (`Draft` → `Permohonan LD` → `Proses LD` → `Penyampaian`) → `Penetapan`. Tidak ada tahap reviu CMO; setelah semua isian masuk, koordinator langsung mengirim ke legal drafting.

| Tahap | Pelaku | Aturan |
|---|---|---|
| Rancang | CMO Kemenkeu (SA, CMOK, PMOK) | Nama tim, komponen (default Template SK Tim: Ketua (bisa ditambah jadi Ketua I, Ketua II, …), Wakil Ketua I/II, Tim PMO Kemenkeu, Tim CMO Kemenkeu, Tim PMO Unit, Tim CMO Unit, Tim Pengelola Komunikasi dan Pelatihan; komponen lain bisa ditambah), unit Eselon I dan **kuota tetap** per unit per komponen, **kedudukan per slot dipilih CMO**, tugas & tanggung jawab (template default), penandatangan, reminder otomatis, **satu deadline per SK Tim**, pemilik probis (bisa lebih dari satu untuk program tematik: Koordinator, Unit 1, Unit 2, ...). Klik **Generate** membuat slot isian. |
| Pengisian unit | CMO/PMO unit (CMOU, PMOU) sesuai unitnya | Mengisi No, Nama/Jabatan, Satker per slot sesuai kuota; tidak bisa menambah slot atau mengubah kedudukan. Bisa lewat form atau **Template Excel per unit** → **Impor Excel** (dicocokkan dengan kolom `ID Slot`, ada pratinjau sebelum diterapkan). Lewat deadline tetap boleh kirim, ditandai *terlambat*. Unit yang sudah kirim bisa dibuka lagi oleh CMO Kemenkeu. |
| Reminder | Sistem | Jadwal default H-7, H-3, H-1, Hari H, H+1, H+2, H+3; hanya ke unit yang belum mengirim; CMO juga bisa "Ingatkan" manual. Papan peringkat urutan unit pengirim. |
| Kirim ke legal drafting | Pemilik probis (koordinator bila tematik) | Aktif setelah semua unit mengirim. |
| Permohonan LD | Pemilik probis / CMO | Impor ND permohonan ke Setban; nomor, hal, dan tanggal terisi otomatis dari ND (bisa dikoreksi manual). |
| Proses LD | Pemilik probis / CMO | Impor ND penyampaian hasil LD dari Setban (nomor, hal, tanggal otomatis) dan isi tautan SharePoint hasil LD. |
| Penyampaian | Pemilik probis / CMO | Import **konsep SK Tim** (belum bernomor) dan **nota pengantar** Nadine ke Kaban (perihal, penandatangan, pengirim, nomor, tanggal; terisi otomatis dari nota). |
| Penetapan | — | Menunggu TTE Kaban; setelah ditetapkan isi nomor & tanggal KEP. |

Peran lihat saja: KAPUS, KETUA, SEKPIM. Setiap aksi dicatat di **Riwayat** (waktu, aktor, peran, aksi).

### Unduhan
- **Word**: mengisi template KEP Squad Team Modul Mekanisme Kerja (base64 di modul) — diktum, lampiran A (pimpinan), B (dikelompokkan per Eselon I), C (unit), penandatangan, tembusan.
- **Excel per unit**: sheet `Isian` (ID Slot, No, Komponen, Kedudukan, Jenis Isian, NIP, Nama, Jabatan, Satuan Kerja) + `Petunjuk`.
- **Rekap Excel** (CMO): sheet `Susunan` dan `Unit`.

Setiap naskah dinas yang dicatat (ND permohonan LD, ND hasil LD, nota pengantar Nadine, KEP) menyimpan **nomor, tanggal, dan hal/tentang**.

### Bantuan › Peta Menu › Fitur

Setiap kartu menu di Peta Menu (PM & CM) punya bagian lipat **Fitur di menu ini** (`SKFEAT` di index.html), dikelompokkan per tab. Klik fitur → aplikasi membuka menu/tab lalu menjalankan tombolnya (`skRunFeat`): `add:ID`, `xls:ID`, `act:NAMA`, `txt:LABEL`, `jj:AKSI` (modul SK Tim: new, seed, fill, ld, sk, guide), atau `tab`. Pencarian Peta Menu juga mencari nama fitur dan membuka kelompoknya. Fitur ikut terindeks di Tanya Bantuan. Alur Aplikasi memuat alur **Penetapan SK Tim jaringan (Tim Lainnya)**.

## Project Selection › Draft RKMK (kerangka KMK)

Modul `rkmk-draft.js` (`window.MT_RKMK`). Aplikasi hanya menyusun **kerangka** naskah KMK; legal drafting dilakukan di Word.

- **Terisi otomatis dari aplikasi:** judul & periode (dari periode Charter Program terpilih), Diktum KEDUA (daftar program), Lampiran A per program — a. Ruang Lingkup dan Proses Bisnis (Latar Belakang + Terobosan), b. Kondisi yang Diharapkan (Tujuan + Outcome), c. Kegiatan (Output), d. Penanggung Jawab (Initiative Champion/Owner, UIC utama/pendukung) — dan Lampiran B tabel Milestone (Key Milestones per tahun, sel tahun diarsir).
- **Ditandai `[…]` (sorot kuning) untuk diisi di Word:** nomor, Menimbang huruf a, Mengingat, Diktum KETIGA, tanggal & nama penandatangan.
- Pratinjau dan unduhan Word memakai model yang sama (A4 tegak, Bookman Old Style 12 pt). Data: `S.psRkmkDoc[tahun] = {title, signYear, programIds|null, docs:[...]}`.
- **RKMK Ditetapkan** (SA, PMOK): nomor KMK, tanggal, tentang, PDF TTE (IndexedDB lokal `mt-signed-documents`, kunci `rkmk:<id>`), tautan opsional, program tercakup. Setiap unggahan = versi baru; program tercakup diberi `p.psRkmkRef`.
