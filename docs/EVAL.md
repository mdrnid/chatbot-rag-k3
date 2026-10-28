# Evaluasi & kalibrasi

Status: **belum diimplementasikan** di Level 2 (folder `eval/` belum ada). Dokumen ini menetapkan format dan prosedurnya.

## Golden dataset — `eval/golden.jsonl`

Satu baris JSON per pertanyaan:

```json
{"id": "q001", "category": "faktual", "question": "Apa syarat menjadi juru ledak?", "history": [], "should_refuse": false, "expected_sources": [{"doc_title": "Kepmen ESDM 1827 K/30/MEM/2018", "pasal": null, "page": null}], "expected_answer": "DIISI MANUSIA dari dokumen asli"}
```

- `category`: `faktual` | `darurat` | `tak_terjawab` | `dicabut` | `lanjutan`.
- `expected_answer`, `pasal`, dan `page` **diisi manusia** dari dokumen asli. Agent boleh membuat struktur, skrip, dan pertanyaan, tetapi tidak boleh mengarang jawaban atau rujukan.
- Jangan membuat pertanyaan yang jawabannya hanya ada di dokumen yang tidak diindeks (misalnya SNI berbayar).

## Kalibrasi `SCORE_THRESHOLD` (nilai awal 0.78, belum dikalibrasi)

1. Siapkan minimal 20 pertanyaan: ±12 dapat dijawab dari dokumen, ±8 tidak dapat dijawab (di luar topik atau tidak ada di dokumen).
2. Bangun index (`pipeline --reset`, dengan izin), lalu jalankan retrieval untuk setiap pertanyaan dan catat skor top-k dari log `retrieve ... skor=[...]`.
3. Pilih ambang yang paling baik memisahkan skor tertinggi pertanyaan relevan vs tidak relevan. Utamakan **tidak menjawab pertanyaan yang tak terjawab**, walaupun beberapa pertanyaan relevan ikut tertolak.
4. Catat data skor, nilai baru, dan alasannya di `docs/decisions/0002-score-threshold.md`, lalu ubah `.env.example`.

## Metrik Level 2 (manual)

| Metrik | Cara cek |
| --- | --- |
| Penolakan benar | Pertanyaan `tak_terjawab` dijawab `REFUSAL_MESSAGE` |
| Sitasi valid | `citation_ok = true` dan sumber yang dikutip memang memuat jawabannya |
| Source hit | Dokumen di `expected_sources` muncul di `sources` |
| Darurat | Pertanyaan `darurat` memunculkan notifikasi di awal |
| Dicabut | Jawaban `dicabut` menyebut status dan penggantinya |

Target angka ditetapkan pemilik proyek setelah baseline pertama diukur. Level 3 menambahkan RAGAS (faithfulness, answer relevancy, context precision/recall) dengan 100+ QA.
