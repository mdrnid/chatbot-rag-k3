# Domain K3 Peledakan

Definisi di bawah adalah ringkasan untuk konteks coding, **bukan rujukan hukum**. Isi teknis dan regulasi hanya boleh berasal dari dokumen sumber.

## Glosarium

| Istilah | Arti singkat |
| --- | --- |
| K3 | Keselamatan dan Kesehatan Kerja |
| KTT | Kepala Teknik Tambang; penanggung jawab K3 operasional di tambang |
| Pengawas | Pengawas operasional/teknik; pengguna utama chatbot |
| Juru ledak | Pekerja yang berwenang melakukan peledakan; wajib memiliki KIM |
| KIM | Kartu Izin Meledakkan |
| Handak | Bahan peledak |
| Gudang handak | Tempat penyimpanan bahan peledak |
| Detonator | Alat pemicu ledakan bahan peledak |
| Charging | Pengisian bahan peledak ke lubang ledak |
| Misfire | Gagal ledak; lubang/bahan peledak yang tidak meledak |
| Flyrock | Batu terbang akibat peledakan |
| Radius aman | Jarak aman dari lokasi peledakan; nilainya dari regulasi/perusahaan, **jangan diisi agent** |
| Blokade | Penutupan dan penjagaan akses ke area peledakan |
| SMKP Minerba | Sistem Manajemen Keselamatan Pertambangan Mineral dan Batubara |
| ERT | Emergency Response Team / tim tanggap darurat |

## Dokumen sumber (registry `data/documents.json`)

| File | Dokumen | Status | Catatan |
| --- | --- | --- | --- |
| `kepmen_esdm_1827_2018.pdf` | Kepmen ESDM 1827 K/30/MEM/2018 | berlaku | `page_range` [150, 175] = bagian peledakan; PERLU VERIFIKASI ke PDF |
| `permen_esdm_26_2018.pdf` | Permen ESDM No. 26 Tahun 2018 | berlaku | Kaidah pertambangan yang baik |
| `perpol_17_2017.pdf` | Perkap/Perpol No. 17 Tahun 2017 | berlaku | Bahan peledak komersial; cek perubahan terbaru |
| `permen_esdm_38_2014.pdf` | Permen ESDM No. 38 Tahun 2014 | **dicabut** | Diganti Permen ESDM No. 26 Tahun 2018; dipakai uji guardrail |
| `skkni_peledakan.pdf` | SKKNI Pengeboran/Peledakan | berlaku | Rujukan isi SOP sintetis |
| `sop/sop_04_penanganan_misfire.md` | SOP-BLS-04 Penanganan Misfire (fiktif) | berlaku | Berisi placeholder `hal. ___` |

SNI 7571:2023 (getaran peledakan) bersifat opsional dan berbayar: pakai lokal saja, jangan masuk repo.

## SOP sintetis

Rencana: penerimaan & penyimpanan di gudang handak, charging, pengamanan area & radius aman, penanganan misfire (sudah ada), inspeksi pasca-peledakan. Semua fiktif, untuk portfolio, dan setiap langkah wajib merujuk pasal/halaman regulasi yang diisi manusia.

## Kategori pertanyaan yang harus ditangani

- **Faktual** — dijawab dengan sitasi.
- **Darurat** (kebakaran, longsor, gas, korban, flyrock, ledakan prematur) — notifikasi darurat lebih dulu.
- **Tidak ada di dokumen** — ditolak.
- **Regulasi dicabut** — disebut dicabut beserta penggantinya.
- **Pertanyaan lanjutan** — ditulis ulang memakai riwayat.
