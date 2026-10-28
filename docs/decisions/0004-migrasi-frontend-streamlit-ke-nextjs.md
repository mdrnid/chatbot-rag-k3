# ADR-0004: Migrasi Frontend dari Streamlit ke Next.js 15

- **Status:** Diterima (Accepted)
- **Tanggal:** 2026-10-28
- **Pengambil Keputusan:** Tim Pengembang & Tim K3 Tambang

## Konteks

Sebelumnya, antarmuka pengguna (UI) dibangun menggunakan Streamlit (`app/streamlit_app.py`) sebagai solusi prototipe cepat. Meskipun memadai untuk pengujian internal awal, Streamlit menghadapi keterbatasan signifikan untuk deployment produksi dan kebutuhan operasional pengawas lapangan tambang:

1. **Model Eksekusi:** Arsitektur full-page rerun Streamlit menyulitkan penanganan streaming Server-Sent Events (SSE) granular, penataan state multi-turn chat kompleks, dan animasi transisi responsif.
2. **Kebutuhan Ergonomi K3 Lapangan:** Pengawas peledakan di tambang terbuka memerlukan UI dengan standar kontras tinggi (terbaca di bawah terik matahari), target sentuh besar (minimal 44px agar mudah dioperasikan saat mengenakan sarung tangan), dan tata letak mobile-first yang fleksibel.
3. **Interaktivitas Sitasi:** Verifikasi sitasi adalah syarat mutlak keselamatan K3. Pengguna membutuhkan chip sitasi interaktif `[S#]` yang menampilkan popover cuplikan teks serta drawer/bottom sheet sumber rujukan tanpa mengganggu alur membaca jawaban.
4. **Keamanan & Standarisasi Desain:** Warna merah harus dibatasi secara ketat hanya untuk peringatan bahaya/darurat (`EmergencyBanner`) dan dokumen yang dicabut. Kustomisasi styling di Streamlit sangat terbatas dan rentan rusak pada pembaruan versi.
5. **Kesiapan Produksi & Distribusi:** Aplikasi web membutuhkan build mandiri (`output: standalone`) dengan image Docker ringan dan performa tinggi.

## Keputusan

Menggantikan Streamlit dengan frontend modern berbasis:
- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript.
- **Styling:** Tailwind CSS dengan skema warna keamanan kontras tinggi (amber/safety tokens) dan dukungan Dark/Light mode.
- **State Management:** Zustand dengan middleware `persist` (`localStorage`) untuk manajemen multi-sesi percakapan dan status UI.
- **Data Fetching & Streaming:** Native ReadableStream reader + SSE parser kustom yang resilien terhadap pemotongan chunk, serta TanStack React Query untuk query stateless (`/config`, `/health`).
- **Validasi Runtime:** Zod untuk validasi skema event SSE dan respons API.
- **Pengujian:** Vitest + React Testing Library (JSDOM) untuk unit & component test.
- **Containerization:** Multi-stage Dockerfile dengan target `standalone` dan orkestrasi via `docker-compose.yml`.

## Konsekuensi

### Positif (+)
- **Streaming Halus & Resilien:** Konsumsi SSE tanpa flicker atau re-render halaman penuh; state token terbarui secara instan.
- **Pengalaman Sitasi Interaktif:** Pengguna dapat mengeklik chip `[S#]` untuk langsung membuka cuplikan rujukan dokumen asli beserta skor relevansi dan status regulasi (berlaku/dicabut).
- **Protokol Darurat Responsif:** Notifikasi darurat K3 (`is_emergency`) langsung memicu banner merah dengan tombol panggilan cepat satu ketukan ke Tim ERT Site.
- **Audit & Feedback Terintegrasi:** Setiap pesan memiliki aksi salin teks dan tombol feedback (bantuan bermanfaat / tidak) yang tersambung langsung ke endpoint audit backend.
- **Performa & Ukuran Image:** Next.js standalone build meminimalkan overhead runtime Docker.

### Negatif / Biaya (-)
- **Kompleksitas Stack:** Menambah ekosistem Node.js/TypeScript di dalam repository yang sebelumnya murni Python.
- **Maintenance:** Diperlukan pemeliharaan dua suite pengujian (Pytest untuk backend dan Vitest untuk frontend).
