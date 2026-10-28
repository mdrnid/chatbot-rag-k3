# ⛑️ Asisten K3 Peledakan (RAG, Level 2 + Web Next.js 15)

Chatbot RAG untuk Pengawas peledakan di tambang terbuka batubara. Menjawab **hanya** dari dokumen, **selalu dengan sitasi** `[S#]` (dokumen, pasal, halaman), dan menolak bila informasi tidak ada di basis dokumen.

> SOP di `data/raw/sop/` adalah **fiktif** untuk portfolio. Chatbot bukan pengganti SOP resmi & arahan Pengawas/KTT.

---

## 🌟 Fitur Utama
- **Backend FastAPI & RAG Engine**:
  - Ingestion PDF (PyMuPDF) + OCR otomatis (Tesseract `ind`) untuk scan fisik.
  - Chunking struktural (Lampiran/BAB/Bagian/Pasal/Langkah SOP) + metadata lengkap.
  - Sitasi wajib `[S#]` dengan verifikasi dan retry otomatis jika sitasi terlewat.
  - Penolakan tegas (`REFUSAL_MESSAGE`) jika skor kemiripan < `SCORE_THRESHOLD`.
  - Penandaan regulasi dicabut (`replaced_by`) dengan badge merah khusus.
  - Deteksi darurat K3 (`is_emergency`) yang memunculkan notice darurat di awal jawaban dan event SSE.
  - Streaming respons menggunakan Server-Sent Events (SSE).
  - Endpoint `/config`, `/health`, `/chat`, `/chat/stream`, dan `/feedback` yang tercatat di audit log.
- **Frontend Produksi Next.js 15 (App Router) & TypeScript**:
  - Desain Mobile-First & High-Contrast (amber/safety theme) ramah pembacaan di lapangan/tambang.
  - Base font size >= 16px, target sentuh (tap target) >= 44px.
  - Aturan warna ketat: Warna **merah** hanya digunakan untuk `EmergencyBanner` dan badge dokumen `DICABUT`.
  - Parser SSE yang resilien terhadap chunk terpotong dan validasi skema runtime (Zod).
  - Chip sitasi interaktif (`[S1]`) dengan popover ringkasan dan pembuka drawer rujukan dokumen.
  - Panel rujukan dokumen (Drawer kanan desktop / Bottom sheet mobile) dengan visualisasi bar relevansi skor.
  - Multi-session conversation management dengan Zustand + `localStorage` persistence.
  - Dukungan mode Gelap / Terang (Dark/Light mode).

---

## 🛠️ Prasyarat & Variabel Environment

Salin file `.env.example` ke `.env`:
```bash
cp .env.example .env
```

### Variabel Environment Backend (`.env`):
| Variabel | Deskripsi | Default |
|---|---|---|
| `LLM_BASE_URL` | Base URL endpoint OpenAI-compatible | `http://localhost:11434/v1` |
| `LLM_API_KEY` | API Key LLM | `ollama` |
| `LLM_MODEL` | Model LLM yang digunakan | `qwen2.5:7b` |
| `SCORE_THRESHOLD` | Ambang batas cosine similarity dokumen | `0.78` |
| `HISTORY_TURNS` | Jumlah riwayat pesan untuk query rewriting | `6` |
| `EMERGENCY_CONTACT_NAME` | Nama kontak tim tanggap darurat | `ERT` |
| `EMERGENCY_CONTACT_PHONE` | Nomor telepon darurat ERT | `112` |
| `CORS_ORIGINS` | Origin yang diizinkan untuk CORS | `http://localhost:3000` |

### Variabel Environment Frontend (`web/.env.local` - opsional):
| Variabel | Deskripsi | Default |
|---|---|---|
| `BACKEND_URL` | URL endpoint backend FastAPI | `http://localhost:8000` |
| `NEXT_PUBLIC_DEBUG_MODE` | Tampilkan metrik latensi, TTFT, dan model | `false` |

---

## 🚀 Panduan Menjalankan

### Cara 1: Menjalankan dengan Docker Compose (Direkomendasikan)
Menjalankan FastAPI backend dan Next.js web application secara bersamaan:
```bash
docker compose up --build
```
- Web Application: [http://localhost:3000](http://localhost:3000)
- FastAPI Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Cara 2: Menjalankan Secara Lokal

#### 1. Setup Backend (Python 3.11+)
```bash
# Aktifkan virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

# Install dependensi backend
pip install -r requirements.txt

# Jalankan server FastAPI
uvicorn src.api.main:app --reload --port 8000
```

#### 2. Setup Frontend Next.js 15 (`web/`)
```bash
cd web

# Install dependensi frontend
npm install # atau pnpm install

# Jalankan development server
npm run dev # atau pnpm dev
```
Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## 🧪 Menjalankan Pengujian (Testing)

### 1. Unit Test Backend (Pytest)
Memverifikasi logika RAG, chunking, sanitasi, dan endpoint FastAPI:
```bash
python -m pytest -q
```
*(Seluruh 24 test unit backend harus lulus)*

### 2. Unit & Component Test Frontend (Vitest)
Memverifikasi SSE parser, citation parser, Zustand store, dan komponen safety K3:
```bash
cd web
npm test # atau pnpm test
```
*(Seluruh 20 test frontend harus lulus)*

### 3. Build Verifikasi Next.js Standalone
```bash
cd web
npm run build
```

---

## 📋 Struktur Direktori Proyek

```text
Chatbot-RAG-K3/
├── Dockerfile              # Dockerfile backend FastAPI
├── docker-compose.yml      # Orkestrasi Docker (api:8000 & web:3000)
├── requirements.txt        # Dependensi Python
├── .env.example            # Template konfigurasi env
├── data/                   # Data dokumen regulasi & SOP
├── src/                    # Backend FastAPI & RAG core logic
│   ├── api/main.py         # Endpoints: /health, /config, /chat, /chat/stream, /feedback
│   ├── config.py           # Konfigurasi terpusat Settings
│   ├── generation/         # RAG pipeline, prompts, LLM client, guardrails
│   ├── ingestion/          # Parser PDF, OCR, chunker, embedding pipeline
│   └── retrieval/          # Chroma vectorstore & retriever
├── tests/                  # Unit test backend (24 passed)
│   ├── test_api.py
│   ├── test_chunk.py
│   ├── test_clean.py
│   └── test_rag.py
└── web/                    # Frontend Next.js 15 App Router
    ├── Dockerfile          # Multi-stage standalone build
    ├── next.config.ts      # output: "standalone"
    ├── app/
    │   ├── api/            # BFF Route Handlers (/chat/stream, /config, /health, /feedback)
    │   ├── globals.css     # Theme safety high-contrast
    │   ├── layout.tsx
    │   └── page.tsx        # UI Utama
    ├── components/
    │   ├── chat/           # CitationChip, MessageBubble, MessageList, ChatInput, EmptyState
    │   ├── layout/         # Sidebar (riwayat & filter dokumen)
    │   ├── safety/         # EmergencyBanner, CitationWarning, RefusalState, DisclaimerBar
    │   └── sources/        # SourcePanel (drawer/sheet) & SourceCard
    ├── hooks/              # useChatStream
    ├── lib/                # sse parser, citation parser, schemas Zod, utils
    ├── stores/             # Zustand conversation store
    └── tests/              # Vitest unit & component test suite (20 passed)
```
