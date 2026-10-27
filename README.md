# ⛑️ Asisten K3 Peledakan (RAG, Level 2)

Chatbot RAG untuk Pengawas peledakan di tambang terbuka batubara. Menjawab **hanya** dari dokumen, **selalu dengan sitasi** (dokumen, pasal, halaman), dan menolak bila informasi tidak ada.

> SOP di `data/raw/sop/` adalah **fiktif** untuk portfolio. Chatbot bukan pengganti SOP resmi & arahan Pengawas/KTT.

## Fitur Level 2
- Parsing PDF (PyMuPDF) + OCR otomatis (Tesseract `ind`) untuk halaman hasil scan
- Cleaning header/footer berulang, nomor halaman, pemenggalan kata
- Chunking struktural: Lampiran/BAB/Bagian/Pasal (regulasi), bagian/langkah (SOP) + metadata
- Sitasi wajib `[S#]` + retry jika tidak ada sitasi, penolakan jika skor di bawah threshold
- Penandaan regulasi dicabut, deteksi pertanyaan darurat
- Memory percakapan (query rewriting pertanyaan lanjutan)
- FastAPI + streaming SSE, frontend Streamlit
- Konfigurasi `.env`, logging + audit log, unit test

## Setup
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# OCR: sudo apt install tesseract-ocr tesseract-ocr-ind
# LLM lokal: ollama pull qwen2.5:7b
```

Simpan PDF ke `data/raw/` dengan nama sesuai `data/documents.json`. `page_range` Kepmen 1827 membatasi ke bagian peledakan, sesuaikan setelah cek PDF.

## Menjalankan
```bash
python -m src.ingestion.pipeline --no-embed   # cek hasil chunk di data/processed/
python -m src.ingestion.pipeline --reset      # bangun index ChromaDB
uvicorn src.api.main:app --reload             # API di :8000 (docs: /docs)
streamlit run app/streamlit_app.py            # UI
pytest                                        # unit test
```

Contoh API:
```bash
curl -X POST localhost:8000/chat -H "Content-Type: application/json" \
  -d '{"question":"Apa syarat menjadi juru ledak?","history":[]}'
```

## Kalibrasi
- `SCORE_THRESHOLD`: jalankan 20 pertanyaan uji, lihat skor di `logs/app.log`, pilih ambang yang memisahkan pertanyaan relevan vs tidak relevan.
- Tambah SOP sintetis lain (charging, radius aman, gudang handak, inspeksi pasca-peledakan) dengan format Markdown yang sama (`##` bagian, `###` langkah, rujukan di setiap langkah).
