# Pull Request: Migrasi Frontend ke Next.js 15, Integrasi SSE Chat, dan Sistem Desain K3 Kontras Tinggi

- **Branch Sumber:** `feat/fix-projects`
- **Branch Target:** `main`
- **Tipe Perubahan:** Feature (`feat`), Architecture Refactor, UI/UX Redesign
- **Status Verifikasi:** 
  - Backend: 25 unit tests passed (`pytest`)
  - Frontend: 21 unit & component tests passed (`vitest`)

---

## 1. Ringkasan Eksekutif

Pull Request ini mengimplementasikan antarmuka web modern berbasis **Next.js 15 (App Router) + React 19 + TypeScript** untuk Asisten K3 Peledakan Tambang, menggantikan UI prototipe Streamlit (`app/streamlit_app.py`) sebagai frontend produksi utama. 

Pembaruan ini dirancang khusus untuk memenuhi standar ergonomi dan keselamatan pengawas operasional lapangan tambang terbuka batubara:
1. **Streaming Resilien & Bebas Kedip (SSE):** Penguraian Server-Sent Events secara native dengan state management Zustand, mencegah full-page reload khas Streamlit.
2. **Interaktivitas Sitasi K3 `[S#]`:** Sitasi dapat diklik langsung untuk memunculkan popover cuplikan pasal, nomor halaman, status regulasi (berlaku vs dicabut), dan skor kesamaan kosinus.
3. **Protokol Darurat & Safety Guardrails:** Komponen UI khusus (`EmergencyBanner`, `CitationWarning`, `RefusalState`, `DisclaimerBar`) dengan pewarnaan semantik ketat (warna merah *khusus* untuk kondisi darurat dan regulasi dicabut).
4. **Ergonomi Lapangan Tambang (Kontras & Aksesibilitas):** Mematuhi standar WCAG AAA untuk keterbacaan di bawah terik matahari dan ukuran target sentuh minimal 44×44px agar mudah dioperasikan dengan sarung tangan kerja.

---

## 2. Rincian Perubahan (What Was Changed)

### A. Frontend Web Client (`web/`)
- **App Router & Layout:**
  - `web/app/page.tsx`: Landing page interaktif dengan video background, kartu kapabilitas RAG, metrik kepatuhan K3, panduan mitigasi risiko, dan navigasi langsung ke `/chat`.
  - `web/app/chat/page.tsx`: Halaman kerja utama pengawas tambang yang memadukan input chat multi-turn, panel sumber referensi, drawer riwayat sesi, dan toggle tema.
  - `web/app/layout.tsx` & `globals.css`: Setup font inter/geist, styling tema dark/light, dan token warna keselamatan tambang.
- **Komponen Keselamatan K3 (`web/components/safety/`):**
  - `EmergencyBanner.tsx`: Muncul otomatis saat event SSE `emergency: true` terdeteksi, menyediakan peringatan prioritas tinggi dan tombol panggilan cepat satu ketukan ke Tim Tanggap Darurat (ERT Site).
  - `CitationChip.tsx` & `CitationWarning.tsx`: Visualisasi sitasi `[S#]` dengan penanda status regulasi dicabut (badge merah + informasi regulasi pengganti).
  - `RefusalState.tsx`: State penolakan eksplisit saat pertanyaan berada di luar cakupan dokumen atau skor relevansi < threshold.
  - `DisclaimerBar.tsx`: Disclaimer hukum K3 permanen di bagian bawah layar.
- **Komponen Chat & Sumber (`web/components/chat/` & `web/components/sources/`):**
  - `MessageList.tsx`, `MessageBubble.tsx`, `ChatInput.tsx`, `EmptyState.tsx`: Alur percakapan responsif dengan dukungan Markdown, blok kode, aksi salin teks, serta tombol feedback audit.
  - `SourcePanel.tsx`, `SourceCard.tsx`: Panel rujukan dokumen sumber (SOP, Regulasi, IK) dengan filtering status dokumen.
  - `streaming-text.tsx`: Animasi streaming teks realistis yang terintegrasi dengan rendering chip sitasi.
- **State & Streaming Engine:**
  - `web/hooks/useChatStream.ts`: Hook konsumsi SSE yang mengelola lifecycle event (`meta`, `token`, `sources`, `done`, `error`).
  - `web/stores/conversation.ts`: Zustand store dengan persistensi `localStorage` untuk manajemen riwayat sesi chat, percakapan aktif, dan switch topik.
  - `web/lib/citations.ts` & `web/lib/sse.ts`: Utilitas parser SSE dan deteksi regex sitasi `[S#]`.
- **Pengujian Frontend (`web/tests/`):**
  - 4 test file (21 tests) mencakup parser sitasi, state store, SSE lifecycle, dan rendering komponen keselamatan.

### B. Backend API & Integrasi (`src/`)
- **Endpoint Enhancements (`src/api/main.py`):**
  - Penambahan endpoint `/feedback` untuk menangani umpan balik pengguna terhadap jawaban bot (berguna untuk audit K3).
  - Konfigurasi CORS middleware untuk mengizinkan komunikasi cross-origin yang aman antara Next.js client dan FastAPI backend.
  - Refinement penanganan event SSE pada `/chat/stream` agar payload konsisten dengan ekspektasi frontend.
- **Pipeline RAG (`src/generation/rag.py`):**
  - Integrasi penandaan darurat dan validasi sitasi yang sinkron dengan kontrak API.

### C. DevOps & Dokumentasi
- `docker-compose.yml` & `web/Dockerfile`: Konfigurasi multi-container untuk menjalankan FastAPI backend (:8000) dan Next.js standalone frontend (:3000) secara harmonis.
- `DESIGN.md`: Dokumentasi sistem desain, palet warna keselamatan, tipografi, dan panduan komponen UI.
- `docs/decisions/0004-migrasi-frontend-streamlit-ke-nextjs.md`: Catatan arsitektur resmi (ADR) mengenai latar belakang dan pertimbangan migrasi.
- `README.md` & `docs/ARCHITECTURE.md`: Diperbarui untuk mencerminkan arsitektur fullstack baru.

---

## 3. Matriks Kepatuhan Aturan Keselamatan K3 (AGENTS.md)

| Aturan K3 | Status | Implementasi di PR ini |
| :--- | :---: | :--- |
| **1. Sitasi Wajib** |  TERPENUHI | Validasi sitasi tetap aktif di backend (`_check()`). Frontend menampilkan chip `[S#]` interaktif dan memberi `CitationWarning` jika jawaban tidak bersitasi. |
| **2. Tanpa Konteks → Tolak** |  TERPENUHI | Logika threshold skor tidak diubah. Frontend menampilkan `RefusalState` khusus saat bot menolak pertanyaan di luar dokumen. |
| **3. Darurat di Paling Atas** |  TERPENUHI | Event `emergency: true` memicu `EmergencyBanner` di posisi paling atas layar chat dengan tombol kontak ERT langsung. |
| **4. Regulasi Dicabut Ditandai** |  TERPENUHI | Chip sitasi dan kartu sumber menampilkan badge status dicabut beserta informasi `replaced_by` secara transparan. |
| **5. Disclaimer Tetap Tampil** |  TERPENUHI | `DisclaimerBar` terpasang permanen pada layout antarmuka chat. |
| **6. Dokumen adalah Data** |  TERPENUHI | Tidak ada prompt injection atau eksekusi instruksi dari dokumen hasil retrieval. |

---

## 4. Hasil Verifikasi Pengujian

### Backend Verification
```bash
python -m pytest -q
```
**Hasil:**
```text
.........................                                                [100%]
25 passed in 1.51s
```

### Frontend Verification
```bash
cd web
npm test -- --run
```
**Hasil:**
```text
 ✓ tests/citations.test.ts (6 tests) 9ms
 ✓ tests/conversation.test.ts (5 tests) 11ms
 ✓ tests/sse.test.ts (5 tests) 28ms
 ✓ tests/components.test.tsx (5 tests) 142ms

 Test Files  4 passed (4)
      Tests  21 passed (21)
   Duration  75.61s
```

---

## 5. Panduan Menjalankan & Menguji Secara Lokal

### Menjalankan Backend (FastAPI)
```bash
# Dari root direktori proyek
python -m venv .venv
source .venv/bin/activate  # atau .venv\Scripts\Activate.ps1 di Windows
uvicorn src.api.main:app --reload --port 8000
```

### Menjalankan Frontend (Next.js)
```bash
# Dari folder web
cd web
npm install # atau pnpm install
npm run dev -- -p 3000
```
Buka browser di `http://localhost:3000` untuk melihat landing page dan `http://localhost:3000/chat` untuk antarmuka tanya jawab K3.

### Menjalankan via Docker Compose
```bash
docker compose up --build
```
Akses frontend di port 3000 dan backend API di port 8000.

---

## 6. Checklist Reviewer

- [x] Semua unit test backend (25) dan frontend (21) lulus tanpa error.
- [x] Tidak ada API key, token, atau file credential (`.env`) yang ter-commit.
- [x] Tidak ada artefak build (`.next`, `data/chroma`, `.venv`) yang masuk dalam staging git.
- [x] Kontrak API `/chat` dan `/chat/stream` tetap kompatibel dan tidak ada pemecahan kontrak lama.
- [x] Protokol darurat dan disclaimer K3 tampil secara benar pada UI web.
