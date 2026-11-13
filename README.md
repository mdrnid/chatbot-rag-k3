# ⛑️ Asisten K3 Peledakan (Prototipe RAG K3 — Level 2 + Web Next.js 15)

Prototipe asisten RAG berbahasa Indonesia untuk **Pengawas Peledakan di tambang terbuka batubara**. Sistem dirancang untuk menjawab pertanyaan teknis berbasis dokumen terdaftar, menyertakan sitasi tag rujukan `[S#]`, serta menolak pertanyaan yang berada di luar basis pengetahuan atau di bawah ambang batas kesesuaian.

> ⚠️ **Pemberitahuan Batasan & Keselamatan**:
> 1. Proyek ini adalah **prototipe portofolio AI Engineering**, BUKAN sistem siap produksi (production-ready).
> 2. Sistem ini **BUKAN pengganti** Standar Operasional Prosedur (SOP) resmi perusahaan, regulasi perundang-undangan, arahan Pengawas Operasional, wewenang Kepala Teknik Tambang (KTT), maupun layanan darurat resmi.
> 3. Dokumen SOP di `data/raw/sop/` bersifat **fiktif** untuk keperluan uji mekanisme portofolio.
> 4. Validasi sitasi saat ini memverifikasi format kemunculan tag sitasi `[S#]`, dan **bukan pembuktian matematis entailment/faithfulness faktual mutlak**. Selalu lakukan verifikasi silang ke dokumen fisik/resmi.

---

## 🏗️ Arsitektur Sistem

```mermaid
flowchart TD
    User([Pengguna / Pengawas Pit]) -->|Pertanyaan & Riwayat| WebUI[Next.js 15 Web App /chat]
    WebUI -->|SSE Stream /chat/stream| API[FastAPI BFF Server]
    
    subgraph Guardrails & Routing
        API --> GuardrailCheck{Deteksi Darurat K3?}
        GuardrailCheck -->|Ya| EmgNotice[Munculkan Notice Darurat Segera]
        GuardrailCheck -->|Lanjut| QueryRewrite[Query Rewriting / Condense Memory]
    end
    
    subgraph Ingestion & Retrieval
        QueryRewrite --> Retriever[Retriever Engine]
        Retriever -->|Embed Query| E5[multilingual-e5-base]
        E5 --> Chroma[(ChromaDB Vectorstore)]
        Chroma -->|Cosine Similarity| FilterThreshold{Skor >= 0.78?}
    end
    
    subgraph Generation & Validation
        FilterThreshold -->|Tidak| Refusal[Penolakan Standar Tanpa LLM]
        FilterThreshold -->|Ya| LLM[LLM OpenAI-Compatible]
        LLM --> CitationCheck{Validasi ID Sitasi [S#]?}
        CitationCheck -->|Belum ada| RetryLLM[Retry Prompt 1x]
        CitationCheck -->|Tetap tidak ada| CitationWarn[Warning Sitasi Tidak Valid]
    end

    EmgNotice --> StreamResponse[Server-Sent Events]
    Refusal --> StreamResponse
    LLM --> StreamResponse
    CitationWarn --> StreamResponse
    StreamResponse --> WebUI
```

---

## 🌟 Fitur & Status Implementasi

| Komponen | Status Implementasi | Catatan & Batasan |
|---|---|---|
| **Deteksi Darurat** | Aktif (Regex K3) | Mencakup insiden, korban, flyrock, misfire/mangkir. Mengutamakan fail-safe (false-positive pada teks konseptual). |
| **Penolakan Konteks** | Aktif | Menolak deterministik tanpa panggil LLM bila skor kemiripan < `SCORE_THRESHOLD` (0.78). |
| **Sitasi ID `[S#]`** | Aktif (Verifikasi ID) | Memastikan ID sumber terdaftar muncul di teks jawaban. *Catatan: Tidak memverifikasi entailment semantik penuh.* |
| **Regulasi Dicabut** | Aktif | Menampilkan penanda khusus regulasi dicabut (`replaced_by`) pada sumber rujukan. |
| **Streaming & Error** | Aktif (SSE) | Sanitasi error internal agar tidak membocorkan stack trace sistem. |

---

## 📚 Status Dokumen: Terdaftar vs Tersedia vs Terindeks

Penting untuk membedakan status dokumen dalam repositori ini:

1. **Dokumen Terdaftar (`data/documents.json`)**:
   Metadata regulasi resmi (Kepmen ESDM 1827/2018, Permen ESDM 26/2018, Perpol 17/2017, Permen ESDM 38/2014) dan SOP fiktif yang dicatat sebagai acuan skema sistem.
2. **File Tersedia (`data/raw/`)**:
   - File markdown SOP sintetis (`data/raw/sop/sop_04_penanganan_misfire.md`) tersedia di repo.
   - File PDF regulasi nasional yang berhak cipta atau dokumen internal **tidak didistribusikan** secara bebas di dalam repositori publik.
3. **Dokumen Terindeks (`data/chroma/`)**:
   Indeks vektor lokal yang dihasilkan dari proses ingestion (`python -m src.ingestion.pipeline`). Endpoint `/health` menyediakan status readiness apakah indeks telah dibangun di lokal.

---

## 🛠️ Prasyarat & Variabel Lingkungan

Salin template konfigurasi:
```bash
cp .env.example .env
```

### Variabel Lingkungan Backend (`.env`):
| Variabel | Deskripsi | Default |
|---|---|---|
| `LLM_BASE_URL` | Base URL endpoint OpenAI-compatible (Ollama / vLLM / OpenAI) | `http://localhost:11434/v1` |
| `LLM_API_KEY` | API Key LLM | `ollama` |
| `LLM_MODEL` | Model LLM yang digunakan | `qwen2.5:7b` |
| `SCORE_THRESHOLD` | Ambang batas cosine similarity dokumen | `0.78` |
| `HISTORY_TURNS` | Jumlah riwayat pesan untuk query rewriting | `6` |
| `EMERGENCY_CONTACT_NAME` | Nama tim tanggap darurat (konfigurasi per site) | `ERT Site (Contoh)` |
| `EMERGENCY_CONTACT_PHONE` | Nomor kontak darurat site | `112` |
| `CORS_ORIGINS` | Origin yang diizinkan untuk CORS | `http://localhost:3000` |

---

## 🚀 Panduan Menjalankan

### Cara 1: Menjalankan dengan Docker Compose
```bash
docker compose up --build
```
- Web Application: [http://localhost:3000](http://localhost:3000)
- FastAPI Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Liveness & Readiness: [http://localhost:8000/health](http://localhost:8000/health)

### Cara 2: Menjalankan Secara Lokal

#### 1. Setup Backend (Python 3.11+)
```bash
python -m venv .venv
# Windows:
.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt

# Pengujian ekstraksi & chunking tanpa embedding model:
python -m src.ingestion.pipeline --no-embed

# Ingestion penuh ke database Chroma (jika PDF/SOP tersedia):
python -m src.ingestion.pipeline

# Jalankan server FastAPI
uvicorn src.api.main:app --reload --port 8000
```

#### 2. Setup Frontend Next.js 15 (`web/`)
```bash
cd web
npm install
npm run dev
```

---

## 🧪 Evaluasi & Pengujian

### 1. Unit Test Backend (Pytest)
Memverifikasi logika RAG, chunking, sanitasi error, dan guardrail K3:
```bash
python -m pytest -q
```

### 2. Runner Evaluasi Terukur (P2)
Mengevaluasi akurasi deteksi darurat dan metrik penolakan berbasis dataset uji:
```bash
python scripts/run_eval.py
```

### 3. Unit & Component Test Frontend (Vitest)
```bash
cd web
npm test
```

### 4. Build Verifikasi Next.js Standalone
```bash
cd web
npm run build
```
