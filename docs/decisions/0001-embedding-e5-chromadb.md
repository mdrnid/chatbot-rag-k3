# ADR-0001: Embedding multilingual-e5-base + ChromaDB

- **Status:** Diterima (Level 2)

## Konteks
Level 2 harus berjalan lokal, murah, dan mendukung Bahasa Indonesia.

## Keputusan
- Embedding `intfloat/multilingual-e5-base` dengan prefix `query:` / `passage:` dan embedding yang dinormalisasi.
- ChromaDB persisten (`data/chroma/`) dengan jarak cosine; skor = `1 - distance`.

## Konsekuensi
- Mengganti model mengubah distribusi skor sehingga `SCORE_THRESHOLD` harus dikalibrasi ulang dan index dibangun ulang.
- Pindah ke `bge-m3` + Qdrant/pgvector adalah cakupan Level 3. Jangan diganti di Level 2 tanpa persetujuan.
