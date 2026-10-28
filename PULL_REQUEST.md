# Pull Request: Refactor Frontend dari Streamlit ke Next.js 15 (App Router)

**Target Branch:** `main`  
**Source Branch:** `refactor/nextjs-migration`  
**Tipe Perubahan:** `refactor` / `feat`  
**Status Pengujian:** 24/24 Pytest lulus, 20/20 Vitest lulus, Docker Compose verified  

---

## 📌 Ringkasan Eksekutif

Pull Request ini memigrasikan antarmuka pengguna (frontend) dari prototipe **Streamlit** ke aplikasi web produksi modern berbasis **Next.js 15 (App Router)**, **React 19**, **TypeScript**, dan **Tailwind CSS**. 

Migrasi ini dirancang secara khusus untuk memenuhi kebutuhan operasional dan standar keselamatan kerja (**K3**) para **Pengawas Peledakan di tambang terbuka batubara**, mencakup ergonomi lapangan (kontras tinggi, target sentuh sarung tangan $\ge 44\text{px}$, font dasar $\ge 16\text{px}$), streaming respons Server-Sent Events (SSE) yang stabil tanpa full-page refresh, verifikasi rujukan sitasi interaktif (`[S#]`), serta tombol tanggap darurat (*one-tap ERT call*).

---

## 🎯 Motivasi & Latar Belakang

| Aspek | Streamlit (Lama) | Next.js 15 App Router (Baru) |
|---|---|---|
| **Siklus Rendering** | Full-page rerun pada setiap interaksi, rawan flicker | Fine-grained React 19 Client Components, streaming instan |
| **Streaming SSE** | Dukungan SSE terbatas & rentan terputus saat chunk panjang | Native `ReadableStream` parser kustom yang resilien terhadap fragmentasi data |
| **Ergonomi Lapangan Tambang** | Kontras standar web biasa, sulit dibaca di bawah terik matahari | High-contrast safety theme (amber/safety tokens) sesuai standar WCAG AAA |
| **Touch Target K3** | Tombol standar (< 36px), sulit dipencet saat memakai APD/sarung tangan | Seluruh tombol interaktif $\ge 44\text{px}$ |
| **Interaktivitas Sitasi `[S#]`** | Teks sitasi statis di akhir jawaban | Chip sitasi interaktif dengan popover ringkasan & pembuka drawer dokumen rujukan |
| **Protokol Darurat** | Teks biasa di dalam blok chat | `EmergencyBanner` mencolok dengan tombol langsung panggil Tim ERT Site |
| **Manajemen Sesi** | Riwayat hilang saat refresh tab browser | Multi-session conversation management dengan Zustand + persistence `localStorage` |
| **Container & Deployment** | Python runtime besar untuk UI | Multi-stage Docker build dengan output `standalone` ringan |

---

## 🚀 Fitur & Komponen yang Diimplementasikan

### 1. Safety-First UI & Guardrails K3
- **🚨 EmergencyBanner**: Muncul seketika di bagian paling atas saat terdeteksi kondisi darurat (`is_emergency: true`), menyediakan tombol panggil telepon Tim Tanggap Darurat Site (ERT) dan salin nomor darurat.
- **⚠️ CitationWarning**: Callout peringatan otomatis jika jawaban LLM gagal menyertakan sitasi yang valid.
- **🛑 RefusalState**: Tampilan penolakan tegas saat pertanyaan berada di luar basis dokumen atau di bawah `SCORE_THRESHOLD`, mencegah halusinasi teknis.
- **📜 Status Dokumen Dicabut**: Badge merah khusus `DICABUT` pada `SourceCard` dengan informasi dokumen pengganti (`replaced_by`) sesuai Kepmen ESDM.
- **⚖️ Disclaimer Terpusat**: Disclaimer hukum K3 ditampilkan di seluruh antarmuka dan disinkronkan secara konsisten via endpoint `/api/config`.

### 2. Interaktivitas Rujukan Dokumen (Citations & Sources)
- **Interactive CitationChip `[S#]`**: Menampilkan popover cuplikan teks dan persentase relevansi saat di-hover/fokus, serta membuka rujukan lengkap saat diklik.
- **SourcePanel**: Drawer samping (desktop) / Bottom Sheet (mobile) yang memuat daftar seluruh sumber rujukan, cuplikan bab/pasal/bagian, bar visualisasi relevansi skor, dan filter pencarian.

### 3. Arsitektur Komunikasi & BFF (Backend-For-Frontend)
- **Next.js Route Handlers**:
  - `POST /api/chat/stream`: Proxy streaming SSE ke FastAPI backend dengan penanganan error terisolasi.
  - `GET /api/config`: Mengambil disclaimer, ambang skor, dan kontak darurat ERT dari backend.
  - `GET /api/health`: Health check status model dan koleksi vektor Chroma.
  - `POST /api/feedback`: Menyimpan feedback pengguna (bermanfaat / tidak) ke audit log backend.
- **Resilient SSE Parser (`web/lib/sse.ts`)**: Mampu menangani pemotongan chunk TCP/SSE dan memvalidasi event (`meta`, `token`, `sources`, `done`, `error`) secara runtime via **Zod**.

### 4. Manajemen State & Pengalaman Pengguna (UX)
- **Zustand Conversation Store (`web/stores/conversation.ts`)**: Mendukung pembuatan sesi baru, penghapusan sesi, penggantian nama percakapan, pemilihan filter dokumen (`regulasi`, `sop`, `ik`), dan peralihan mode tema (Dark/Light).
- **Aksi Cepat Pesan**: Tombol salin teks respons, tombol feedback jempol baik/buruk, dan render Markdown yang aman via `rehype-sanitize`.

---

## 🏗️ Perubahan Backend & Infrastruktur

1. **FastAPI Lifespan Warm-up (`src/api/main.py`)**:
   - Menambahkan event `lifespan` untuk memuat RAG pipeline (embedding model & ChromaDB) saat server pertama kali dinyalakan, menghilangkan latensi "cold start" pada pertanyaan pertama pengguna.
2. **Docker Compose Terpadu (`docker-compose.yml`)**:
   - Menghubungkan container `k3-rag-api` (FastAPI pada port 8000) dan `k3-rag-web` (Next.js 15 standalone pada port 3000) dalam satu jaringan internal bridge.
   - Menambahkan cache volume HuggingFace (`HF_HOME`) agar model embedding tidak diunduh berulang kali.

---

## 🧪 Verifikasi & Hasil Pengujian

### 1. Backend Unit Test (Pytest)
```bash
python -m pytest -q
```
**Hasil:** `24 passed in 1.71s` ✅ (Termasuk pengujian RAG pipeline, chunking, sanitasi teks, guardrails, dan endpoint API).

### 2. Frontend Unit & Component Test (Vitest)
```bash
cd web && npm test
```
**Hasil:** `20 passed across 4 test suites` ✅
- `tests/citations.test.ts` (6 tests)
- `tests/conversation.test.ts` (5 tests)
- `tests/sse.test.ts` (4 tests)
- `tests/components.test.tsx` (5 tests)

### 3. Container & Integration Test
- Menjalankan `docker compose up --build`.
- Container `k3-rag-api` dan `k3-rag-web` berhasil aktif dan saling berkomunikasi di `http://localhost:3000`.

---

## 📋 File yang Berubah (Summary)

```text
Chatbot-RAG-K3/
├── docker-compose.yml                 # Layanan web Next.js & api FastAPI terpadu
├── src/api/main.py                    # Lifespan warm-up RAG pipeline
├── README.md                          # Panduan menjalankan Next.js & pengujian lengkap
├── docs/
│   ├── ARCHITECTURE.md                # Diagram Mermaid & penjelasan arsitektur frontend web
│   ├── ROADMAP.md                     # Pembaruan status Docker Compose & disclaimer terpusat
│   └── decisions/
│       └── 0004-migrasi-frontend-streamlit-ke-nextjs.md # ADR keputusan migrasi Next.js 15
└── web/                               # Folder baru frontend Next.js 15 (App Router)
    ├── app/                           # Route Handlers & UI Page
    ├── components/                    # Komponen Chat, Safety K3, Layout, Sources
    ├── hooks/                         # useChatStream
    ├── lib/                           # SSE parser, Zod schemas, citation parser
    ├── stores/                        # Zustand conversation store
    ├── tests/                         # Vitest suite
    ├── Dockerfile                     # Multi-stage standalone build
    └── package.json                   # Dependensi Next.js 15 & React 19
```

---

## ⚠️ Catatan Penting Sebelum Merge (Git Hygiene)

> [!IMPORTANT]
> Pada commit awal migrasi (`93de01b`), folder build output `web/.next/` sempat ter-commit ke Git index (menambah 2.000+ file dan 650.000+ baris dependensi standalone).
> 
> **Langkah yang disarankan sebelum melakukan merge PR:**
> 1. Hapus `web/.next` dari tracking git (tanpa menghapus file fisik di lokal):
>    ```bash
>    git rm -r --cached web/.next
>    ```
> 2. Pastikan `.next/` dan `web/.next/` tercantum di `.gitignore`.
> 3. Hapus baris `docs/` dari `.gitignore` agar dokumen arsitektur dan ADR dapat ikut masuk ke remote repository.
> 4. Commit perbaikan hygiene ini:
>    ```bash
>    git commit -m "chore: untrack web/.next build artifacts and include docs in tracking"
>    ```
