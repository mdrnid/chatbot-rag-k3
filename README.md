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
