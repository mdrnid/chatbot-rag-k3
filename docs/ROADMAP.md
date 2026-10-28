# Roadmap & known issues

## Level 3 — Advanced RAG + evaluasi (dikerjakan hanya bila diminta)

- Hybrid search (BM25 + vector, `bge-m3`) + reranker (`bge-reranker-v2-m3`)
- Query rewriting lanjutan / multi-query / HyDE, metadata filtering
- Golden dataset 100+ QA dan evaluasi RAGAS
- Tabel perbandingan eksperimen: chunk size, embedding, dengan/tanpa reranker
- Vector DB ke Qdrant/pgvector
- Observability (Langfuse): latency, token, cost

## Known issues (Level 2)

| # | Masalah | Lokasi | Catatan |
| --- | --- | --- | --- |
| 1 | Stream tidak me-retry sitasi; hanya menambah warning | `rag.stream()` | Disengaja, lihat ADR-0003 |
| 2 | Validasi sitasi longgar: satu `[S#]` valid sudah lulus; frasa "tidak ditemukan di dokumen" di mana pun dianggap penolakan | `rag._check()`, `guardrails.is_refusal()` | Perlu aturan lebih ketat + test |
| 3 | `SCORE_THRESHOLD=0.78` belum dikalibrasi; skor cosine e5 cenderung rapat | `.env`, `retriever.py` | Ikuti `EVAL.md` |
| 4 | `eval/` dan golden dataset belum ada | — | Lihat `EVAL.md` |
| 5 | SOP misfire masih berisi `hal. ___` | `data/raw/sop/` | Hanya diisi manusia |
| 6 | Deteksi darurat berbasis regex; variasi kata/typo bisa lolos | `guardrails._EMERGENCY` | Tambah test positif & negatif |
| 7 | Disclaimer konsisten terpusat | `web/app/api/config/route.ts` | Disinkronkan langsung dari backend `/config` via BFF (selesai pada migrasi Next.js) |
| 8 | Event `error` mengirim `str(exc)` ke klien | `api/main.py` | Bisa membocorkan detail internal |

## Progres & Selesai
- [x] Docker Compose terpadu (`api:8000` + `web:3000` standalone)
- [x] Frontend Next.js 15 App Router dengan safety high-contrast design, chip sitasi interaktif, dan multi-sesi Zustand (lihat ADR-0004)

## Celah test

Belum ada test untuk: `guardrails.py` (darurat, sitasi, penolakan), `prompts.source_label()` (halaman, status dicabut), `retriever.py` (threshold, `build_where`), dan endpoint FastAPI.
