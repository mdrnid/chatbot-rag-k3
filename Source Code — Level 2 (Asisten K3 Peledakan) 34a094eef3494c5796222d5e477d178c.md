# Source Code — Level 2 (Asisten K3 Peledakan)

<aside>
🔵

**Level 2 — RAG yang bisa dipakai.** Chunking struktural per Pasal/langkah SOP + metadata, OCR, sitasi wajib & penolakan, memory percakapan, FastAPI streaming, Streamlit, `.env`, logging, unit test (17 test lulus).

</aside>

## Struktur folder

```
k3-rag-chatbot/
├── app/streamlit_app.py
├── data/
│   ├── documents.json        # registry metadata dokumen
│   ├── raw/                  # PDF + sop/*.md
│   ├── processed/            # hasil chunk (.jsonl)
│   └── chroma/               # vector DB
├── src/
│   ├── config.py
│   ├── ingestion/            # parse, clean, chunk, pipeline
│   ├── retrieval/            # embedder, vectorstore, retriever
│   ├── generation/           # prompts, guardrails, llm, rag
│   └── api/main.py           # FastAPI + SSE
├── tests/                    # test_clean, test_chunk, test_rag
├── .env.example
├── pytest.ini
├── requirements.txt
└── README.md
```

## Cara menjalankan

1. `pip install -r requirements.txt` lalu `cp .env.example .env`
2. Pasang Tesseract + bahasa `ind`, dan `ollama pull qwen2.5:7b` (atau isi API key OpenAI di `.env`)
3. Simpan PDF ke `data/raw/` sesuai nama di `data/documents.json`
4. `python -m src.ingestion.pipeline --no-embed` → cek `data/processed/`
5. `python -m src.ingestion.pipeline --reset` → bangun index
6. `uvicorn src.api.main:app --reload` dan `streamlit run app/streamlit_app.py`
7. `pytest`

## Alur per pertanyaan

1. **Query rewriting**: pertanyaan lanjutan + riwayat → pertanyaan mandiri
2. **Retrieval**: vector search top-k, buang yang skornya di bawah `SCORE_THRESHOLD`
3. Tidak ada konteks → **tolak** tanpa memanggil LLM
4. **Deteksi darurat** → notifikasi tanggap darurat tampil paling atas
5. LLM menjawab dengan sitasi `[S#]`; tanpa sitasi → retry sekali, lalu diberi peringatan
6. Sumber dikembalikan dengan label dokumen, pasal, halaman, dan status dicabut

<aside>
⚠️

SOP misfire di `data/raw/sop/` fiktif dan berisi placeholder `hal. ___`. Isi nomor halaman setelah dicek ke Kepmen 1827 asli sebelum dipakai untuk evaluasi. `SCORE_THRESHOLD` (0.78) perlu dikalibrasi dengan 20 pertanyaan uji.

</aside>

## Source code

### Root & konfigurasi

- `README.md`
    
    ```markdown
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
    ```
    
- `requirements.txt`
    
    ```
    # Parsing & OCR
    pymupdf>=1.24
    pytesseract>=0.3.10
    pillow>=10.0
    # Embedding & vector DB
    sentence-transformers>=3.0
    chromadb>=0.5
    # LLM (OpenAI-compatible: OpenAI, Ollama, vLLM, dll.)
    openai>=1.40
    # Backend & frontend
    fastapi>=0.111
    uvicorn[standard]>=0.30
    pydantic>=2.7
    streamlit>=1.36
    requests>=2.32
    python-dotenv>=1.0
    # Testing
    pytest>=8.0
    ```
    
- `.env.example`
    
    ```bash
    # === Path ===
    RAW_DIR=data/raw
    PROCESSED_DIR=data/processed
    DOC_REGISTRY=data/documents.json
    CHROMA_DIR=data/chroma
    COLLECTION=k3_peledakan
    
    # === Ingestion ===
    OCR_LANG=ind
    OCR_MIN_CHARS=50
    MAX_CHUNK_CHARS=3000
    CHUNK_OVERLAP=300
    
    # === Embedding ===
    EMBED_MODEL=intfloat/multilingual-e5-base
    
    # === LLM (OpenAI-compatible) ===
    # Ollama lokal:  LLM_BASE_URL=http://localhost:11434/v1  LLM_API_KEY=ollama  LLM_MODEL=qwen2.5:7b
    # OpenAI:        LLM_BASE_URL=https://api.openai.com/v1  LLM_API_KEY=sk-...  LLM_MODEL=gpt-4o-mini
    LLM_BASE_URL=http://localhost:11434/v1
    LLM_API_KEY=ollama
    LLM_MODEL=qwen2.5:7b
    
    # === Retrieval & chat ===
    TOP_K=5
    SCORE_THRESHOLD=0.78
    EXCLUDE_REVOKED=false
    HISTORY_TURNS=6
    
    # === Guardrail ===
    EMERGENCY_CONTACT=Tim ERT site (radio channel darurat / ext. 112)
    
    # === App ===
    LOG_LEVEL=INFO
    API_URL=http://localhost:8000
    ```
    
- `.gitignore`
    
    ```
    .env
    __pycache__/
    .pytest_cache/
    logs/
    data/chroma/
    data/processed/
    # PDF tidak di-commit (SNI berbayar tidak boleh masuk repo publik)
    data/raw/**/*.pdf
    ```
    
- `pytest.ini`
    
    ```
    [pytest]
    pythonpath = .
    testpaths = tests
    ```
    
- `data/documents.json`
    
    ```json
    [
      {
        "file": "kepmen_esdm_1827_2018.pdf",
        "doc_title": "Kepmen ESDM 1827 K/30/MEM/2018",
        "doc_type": "regulasi",
        "tahun": 2018,
        "status": "berlaku",
        "topik": "peledakan",
        "page_range": [150, 175]
      },
      {
        "file": "permen_esdm_26_2018.pdf",
        "doc_title": "Permen ESDM No. 26 Tahun 2018",
        "doc_type": "regulasi",
        "tahun": 2018,
        "status": "berlaku",
        "topik": "kaidah pertambangan"
      },
      {
        "file": "perpol_17_2017.pdf",
        "doc_title": "Perkap/Perpol No. 17 Tahun 2017",
        "doc_type": "regulasi",
        "tahun": 2017,
        "status": "berlaku",
        "topik": "bahan peledak"
      },
      {
        "file": "permen_esdm_38_2014.pdf",
        "doc_title": "Permen ESDM No. 38 Tahun 2014",
        "doc_type": "regulasi",
        "tahun": 2014,
        "status": "dicabut",
        "replaced_by": "Permen ESDM No. 26 Tahun 2018",
        "topik": "SMKP"
      },
      {
        "file": "skkni_peledakan.pdf",
        "doc_title": "SKKNI Pengeboran/Peledakan",
        "doc_type": "regulasi",
        "status": "berlaku",
        "topik": "kompetensi"
      },
      {
        "file": "sop/sop_04_penanganan_misfire.md",
        "doc_title": "SOP-BLS-04 Penanganan Misfire (fiktif)",
        "doc_type": "sop",
        "tahun": 2026,
        "status": "berlaku",
        "topik": "misfire"
      }
    ]
    ```
    
- `src/config.py`
    
    ```python
    """Konfigurasi terpusat dari file .env + setup logging."""
    from __future__ import annotations
    
    import logging
    import os
    from dataclasses import dataclass
    from pathlib import Path
    
    from dotenv import load_dotenv
    
    ROOT = Path(__file__).resolve().parents[1]
    load_dotenv(ROOT / ".env")
    
    def _str(key: str, default: str) -> str:
        return os.getenv(key, default)
    
    def _int(key: str, default: int) -> int:
        return int(os.getenv(key, default))
    
    def _float(key: str, default: float) -> float:
        return float(os.getenv(key, default))
    
    def _bool(key: str, default: bool) -> bool:
        return os.getenv(key, str(default)).strip().lower() in {"1", "true", "yes", "ya"}
    
    @dataclass(frozen=True)
    class Settings:
        raw_dir: Path = ROOT / _str("RAW_DIR", "data/raw")
        processed_dir: Path = ROOT / _str("PROCESSED_DIR", "data/processed")
        doc_registry: Path = ROOT / _str("DOC_REGISTRY", "data/documents.json")
        chroma_dir: Path = ROOT / _str("CHROMA_DIR", "data/chroma")
        collection: str = _str("COLLECTION", "k3_peledakan")
    
        ocr_lang: str = _str("OCR_LANG", "ind")
        ocr_min_chars: int = _int("OCR_MIN_CHARS", 50)
        max_chunk_chars: int = _int("MAX_CHUNK_CHARS", 3000)
        chunk_overlap: int = _int("CHUNK_OVERLAP", 300)
    
        embed_model: str = _str("EMBED_MODEL", "intfloat/multilingual-e5-base")
    
        llm_base_url: str = _str("LLM_BASE_URL", "http://localhost:11434/v1")
        llm_api_key: str = _str("LLM_API_KEY", "ollama")
        llm_model: str = _str("LLM_MODEL", "qwen2.5:7b")
    
        top_k: int = _int("TOP_K", 5)
        score_threshold: float = _float("SCORE_THRESHOLD", 0.78)
        exclude_revoked: bool = _bool("EXCLUDE_REVOKED", False)
        history_turns: int = _int("HISTORY_TURNS", 6)
    
        emergency_contact: str = _str("EMERGENCY_CONTACT", "Tim Tanggap Darurat site")
        log_level: str = _str("LOG_LEVEL", "INFO")
    
    settings = Settings()
    
    def setup_logging(level: str | None = None) -> None:
        log_dir = ROOT / "logs"
        log_dir.mkdir(exist_ok=True)
        logging.basicConfig(
            level=(level or settings.log_level).upper(),
            format="%(asctime)s %(levelname)s %(name)s: %(message)s",
            handlers=[
                logging.StreamHandler(),
                logging.FileHandler(log_dir / "app.log", encoding="utf-8"),
            ],
            force=True,
        )
    ```
    

### Ingestion

- `src/ingestion/parse.py`
    
    ```python
    """Parsing PDF (dengan OCR otomatis untuk halaman hasil scan) dan Markdown/TXT."""
    from __future__ import annotations
    
    import io
    import logging
    from dataclasses import dataclass
    from pathlib import Path
    
    log = logging.getLogger(__name__)
    
    @dataclass
    class Page:
        number: int | None  # nomor halaman PDF (1-based); None untuk Markdown/TXT
        text: str
        ocr: bool = False
    
    def _ocr_page(page, lang: str) -> str:
        import pytesseract
        from PIL import Image
    
        pix = page.get_pixmap(dpi=300)
        image = Image.open(io.BytesIO(pix.tobytes("png")))
        return pytesseract.image_to_string(image, lang=lang)
    
    def parse_pdf(
        path: Path,
        ocr_lang: str = "ind",
        ocr_min_chars: int = 50,
        page_range: tuple[int, int] | list[int] | None = None,
    ) -> list[Page]:
        """Ekstrak teks per halaman. Halaman dengan teks < ocr_min_chars dianggap scan -> OCR."""
        import fitz  # PyMuPDF
    
        pages: list[Page] = []
        with fitz.open(path) as doc:
            start, end = page_range or (1, doc.page_count)
            for idx in range(max(start, 1) - 1, min(end, doc.page_count)):
                page = doc[idx]
                text = page.get_text("text")
                used_ocr = False
                if len(text.strip()) < ocr_min_chars:
                    try:
                        text = _ocr_page(page, ocr_lang)
                        used_ocr = True
                    except Exception as exc:  # tesseract belum terpasang, dsb.
                        log.warning("OCR gagal di %s hal. %d: %s", path.name, idx + 1, exc)
                pages.append(Page(idx + 1, text, used_ocr))
        n_ocr = sum(p.ocr for p in pages)
        log.info("Parsed %s: %d halaman (%d via OCR)", path.name, len(pages), n_ocr)
        return pages
    
    def parse_text(path: Path) -> list[Page]:
        return [Page(None, path.read_text(encoding="utf-8"))]
    
    def parse_document(path: Path, **kwargs) -> list[Page]:
        suffix = path.suffix.lower()
        if suffix == ".pdf":
            return parse_pdf(path, **kwargs)
        if suffix in {".md", ".txt"}:
            return parse_text(path)
        raise ValueError(f"Format tidak didukung: {path}")
    ```
    
- `src/ingestion/clean.py`
    
    ```python
    """Cleaning: buang header/footer berulang, nomor halaman, perbaiki pemenggalan kata."""
    from __future__ import annotations
    
    import re
    from collections import Counter
    
    from src.ingestion.parse import Page
    
    Line = tuple[int | None, str]  # (nomor halaman, teks baris)
    
    _PAGE_NUMBER = [
        re.compile(r"^[-–—]?\s*\d{1,4}\s*[-–—]?$"),
        re.compile(r"^(halaman|hal\.?|page)\s*\d+(\s*(dari|of)\s*\d+)?$", re.I),
        re.compile(r"^\d+\s*/\s*\d+$"),
    ]
    # Baris struktural tidak boleh dibuang walau berulang (dipakai chunker).
    _STRUCTURAL = re.compile(r"^(pasal|bab|bagian|lampiran)\b", re.I)
    
    def is_page_number(line: str) -> bool:
        line = line.strip()
        return any(p.match(line) for p in _PAGE_NUMBER)
    
    def fix_hyphenation(text: str) -> str:
        """'pele-\\ndak' -> 'peledak'."""
        return re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    
    def normalize_whitespace(line: str) -> str:
        return re.sub(r"[ \t\u00a0]+", " ", line).strip()
    
    def _key(line: str) -> str:
        return re.sub(r"\d+", "#", normalize_whitespace(line).lower())
    
    def find_repeated_lines(pages_lines: list[list[str]], edge: int = 2, min_ratio: float = 0.5) -> set[str]:
        """Cari baris di tepi atas/bawah halaman yang muncul di >= min_ratio halaman."""
        if len(pages_lines) < 3:
            return set()
        counter: Counter[str] = Counter()
        for lines in pages_lines:
            non_empty = [l for l in lines if l.strip()]
            counter.update({_key(l) for l in non_empty[:edge] + non_empty[-edge:]})
        threshold = max(2, int(len(pages_lines) * min_ratio))
        return {k for k, v in counter.items() if k and v >= threshold}
    
    def clean_pages(pages: list[Page]) -> list[Line]:
        pages_lines = [fix_hyphenation(p.text).splitlines() for p in pages]
        repeated = find_repeated_lines(pages_lines)
        out: list[Line] = []
        for page, lines in zip(pages, pages_lines):
            for raw in lines:
                line = normalize_whitespace(raw)
                if not line or is_page_number(line):
                    continue
                if _key(line) in repeated and not _STRUCTURAL.match(line):
                    continue
                out.append((page.number, line))
        return out
    ```
    
- `src/ingestion/chunk.py`
    
    ```python
    """Chunking struktural: regulasi per Lampiran/BAB/Bagian/Pasal, SOP per bagian/langkah.
    
    Chunk yang terlalu panjang dipecah dengan sliding window (overlap) namun tetap
    membawa konteks induknya (bab, pasal, bagian SOP).
    """
    from __future__ import annotations
    
    import re
    from dataclasses import asdict, dataclass
    
    from src.ingestion.clean import Line
    
    RE_LAMPIRAN = re.compile(r"^LAMPIRAN\s+([IVXLCDM]+)\b\.?\s*(.*)$", re.I)
    RE_BAB = re.compile(r"^BAB\s+([IVXLCDM]+)\b\.?\s*(.*)$")
    RE_BAGIAN = re.compile(r"^Bagian\s+(Ke[a-z]+)\b\s*(.*)$", re.I)
    RE_PASAL = re.compile(r"^Pasal\s+(\d+[A-Z]?)$")
    RE_MD_HEADING = re.compile(r"^(#{1,4})\s+(.+)$")
    RE_SOP_SECTION = re.compile(
        r"^(\d+\.?\s+)?(TUJUAN|RUANG LINGKUP|REFERENSI|DEFINISI|TANGGUNG JAWAB|"
        r"ALAT PELINDUNG DIRI|APD|PERALATAN|PROSEDUR|LANGKAH KERJA|TANGGAP DARURAT|"
        r"PELAPORAN|LAMPIRAN)\b.*$"
    )
    
    @dataclass
    class Chunk:
        text: str
        page_start: int | None = None
        page_end: int | None = None
        lampiran: str | None = None
        bab: str | None = None
        bagian: str | None = None
        pasal: str | None = None
        section: str | None = None  # untuk SOP
    
        def to_dict(self) -> dict:
            return asdict(self)
    
    def _split_long_line(item: Line, max_chars: int) -> list[Line]:
        page, line = item
        out: list[Line] = []
        while len(line) > max_chars:
            cut = line.rfind(" ", 0, max_chars)
            cut = cut if cut > 0 else max_chars
            out.append((page, line[:cut]))
            line = line[cut:].strip()
        if line:
            out.append((page, line))
        return out
    
    def _windows(items: list[Line], max_chars: int, overlap: int) -> list[list[Line]]:
        items = [x for it in items for x in _split_long_line(it, max_chars)]
        windows: list[list[Line]] = []
        cur: list[Line] = []
        size = 0
        for item in items:
            n = len(item[1]) + 1
            if cur and size + n > max_chars:
                windows.append(cur)
                tail: list[Line] = []
                t = 0
                for prev in reversed(cur):
                    if t + len(prev[1]) + 1 > overlap:
                        break
                    tail.insert(0, prev)
                    t += len(prev[1]) + 1
                cur, size = tail, t
            cur.append(item)
            size += n
        if cur:
            windows.append(cur)
        return windows
    
    def _make_chunks(buf: list[Line], ctx: dict, max_chars: int, overlap: int) -> list[Chunk]:
        chunks = []
        for win in _windows(buf, max_chars, overlap):
            pages = [p for p, _ in win if p is not None]
            chunks.append(
                Chunk(
                    text="\n".join(l for _, l in win),
                    page_start=min(pages) if pages else None,
                    page_end=max(pages) if pages else None,
                    **ctx,
                )
            )
        return chunks
    
    def _looks_like_title(line: str) -> bool:
        return len(line) < 120 and not line.endswith((".", ";", ":", ","))
    
    def chunk_regulation(lines: list[Line], max_chars: int = 3000, overlap: int = 300) -> list[Chunk]:
        chunks: list[Chunk] = []
        buf: list[Line] = []
        ctx: dict = {"lampiran": None, "bab": None, "bagian": None, "pasal": None}
        bab_id: str | None = None
        pending_title: str | None = None  # "bab" | "bagian"
    
        def flush() -> None:
            if buf:
                chunks.extend(_make_chunks(buf, dict(ctx), max_chars, overlap))
                buf.clear()
    
        for page, line in lines:
            if m := RE_LAMPIRAN.match(line):
                value = f"Lampiran {m.group(1).upper()}"
                if value != ctx["lampiran"]:  # header lampiran berulang tiap halaman diabaikan
                    flush()
                    ctx.update(lampiran=value, bab=None, bagian=None, pasal=None)
                    bab_id = None
                continue
            if m := RE_BAB.match(line):
                if m.group(1) != bab_id:
                    flush()
                    bab_id = m.group(1)
                    title = m.group(2).strip()
                    ctx.update(bab=f"BAB {bab_id}" + (f" {title}" if title else ""), bagian=None, pasal=None)
                    pending_title = None if title else "bab"
                continue
            if m := RE_BAGIAN.match(line):
                flush()
                title = m.group(2).strip()
                ctx.update(bagian=f"Bagian {m.group(1).capitalize()}" + (f" {title}" if title else ""), pasal=None)
                pending_title = None if title else "bagian"
                continue
            if m := RE_PASAL.match(line):
                flush()
                ctx["pasal"] = m.group(1)
                pending_title = None
                continue
            if pending_title and _looks_like_title(line):
                ctx[pending_title] = f"{ctx[pending_title]} {line}"
                pending_title = None
                continue
            pending_title = None
            buf.append((page, line))
        flush()
        return chunks
    
    def chunk_sop(lines: list[Line], max_chars: int = 3000, overlap: int = 300) -> list[Chunk]:
        chunks: list[Chunk] = []
        buf: list[Line] = []
        section: str | None = None
        parent: str | None = None
    
        def flush() -> None:
            if buf:
                chunks.extend(_make_chunks(buf, {"section": section}, max_chars, overlap))
                buf.clear()
    
        for page, line in lines:
            if m := RE_MD_HEADING.match(line):
                level, title = len(m.group(1)), m.group(2).strip()
                if level == 1:  # judul SOP -> sudah ada di doc_title
                    continue
                flush()
                if level == 2:
                    parent = section = title
                else:
                    section = f"{parent} > {title}" if parent else title
                continue
            if RE_SOP_SECTION.match(line):  # SOP berformat PDF tanpa heading Markdown
                flush()
                parent = section = line.title()
                continue
            buf.append((page, line))
        flush()
        return chunks
    
    def chunk_document(lines: list[Line], doc_type: str, max_chars: int = 3000, overlap: int = 300) -> list[Chunk]:
        if doc_type == "regulasi":
            return chunk_regulation(lines, max_chars, overlap)
        return chunk_sop(lines, max_chars, overlap)
    ```
    
- `src/ingestion/pipeline.py`
    
    ```python
    """Ingestion: parse -> clean -> chunk -> metadata -> embedding -> ChromaDB.
    
    Contoh:
        python -m src.ingestion.pipeline --no-embed   # cek hasil parsing/chunking saja
        python -m src.ingestion.pipeline --reset      # bangun ulang index
    """
    from __future__ import annotations
    
    import argparse
    import hashlib
    import json
    import logging
    from pathlib import Path
    
    from src.config import settings, setup_logging
    from src.ingestion.chunk import Chunk, chunk_document
    from src.ingestion.clean import clean_pages
    from src.ingestion.parse import parse_document
    
    log = logging.getLogger(__name__)
    SUPPORTED = {".pdf", ".md", ".txt"}
    
    def load_registry(path: Path) -> dict[str, dict]:
        if not path.exists():
            log.warning("Registry %s tidak ada, memakai metadata default", path)
            return {}
        return {d["file"]: d for d in json.loads(path.read_text(encoding="utf-8"))}
    
    def default_meta(rel: str) -> dict:
        p = Path(rel)
        is_sop = p.suffix.lower() in {".md", ".txt"} or "sop" in p.parts
        return {"file": rel, "doc_title": p.stem, "doc_type": "sop" if is_sop else "regulasi", "status": "berlaku"}
    
    def context_header(meta: dict, chunk: Chunk) -> str:
        """Konteks induk yang ditempel ke setiap chunk agar maknanya tidak hilang."""
        parts = [meta["doc_title"]]
        if meta.get("status") == "dicabut":
            parts.append(f"STATUS: DICABUT (diganti {meta.get('replaced_by', '-')})")
        parts += [x for x in (chunk.lampiran, chunk.bab, chunk.bagian) if x]
        if chunk.pasal:
            parts.append(f"Pasal {chunk.pasal}")
        if chunk.section:
            parts.append(chunk.section)
        return " | ".join(parts)
    
    def build_records(path: Path, rel: str, meta: dict) -> list[dict]:
        pages = parse_document(
            path,
            **(
                {"ocr_lang": settings.ocr_lang, "ocr_min_chars": settings.ocr_min_chars, "page_range": meta.get("page_range")}
                if path.suffix.lower() == ".pdf"
                else {}
            ),
        )
        lines = clean_pages(pages)
        chunks = chunk_document(lines, meta["doc_type"], settings.max_chunk_chars, settings.chunk_overlap)
        records = []
        for i, ch in enumerate(chunks):
            md = {
                "doc_title": meta["doc_title"],
                "doc_type": meta["doc_type"],
                "tahun": meta.get("tahun"),
                "status": meta.get("status", "berlaku"),
                "replaced_by": meta.get("replaced_by"),
                "topik": meta.get("topik"),
                "source_file": rel,
                "chunk_index": i,
                **{k: v for k, v in ch.to_dict().items() if k != "text"},
            }
            records.append(
                {
                    "id": hashlib.sha1(f"{rel}|{i}".encode()).hexdigest()[:16],
                    "text": f"{context_header(meta, ch)}\n{ch.text}",
                    "metadata": md,
                }
            )
        log.info("%s -> %d chunk", rel, len(records))
        return records
    
    def save_jsonl(path: Path, records: list[dict]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", encoding="utf-8") as f:
            for r in records:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
    
    def main(argv: list[str] | None = None) -> None:
        ap = argparse.ArgumentParser(description="Ingestion dokumen K3 ke vector DB")
        ap.add_argument("--reset", action="store_true", help="Hapus index lalu bangun ulang")
        ap.add_argument("--no-embed", action="store_true", help="Hanya parsing+chunking ke data/processed")
        ap.add_argument("--only", help="Proses satu file (path relatif terhadap RAW_DIR)")
        args = ap.parse_args(argv)
        setup_logging()
    
        registry = load_registry(settings.doc_registry)
        files = sorted(p for p in settings.raw_dir.rglob("*") if p.suffix.lower() in SUPPORTED)
        for missing in set(registry) - {p.relative_to(settings.raw_dir).as_posix() for p in files}:
            log.warning("File di registry belum ada di %s: %s", settings.raw_dir, missing)
    
        per_file: dict[str, list[dict]] = {}
        for path in files:
            rel = path.relative_to(settings.raw_dir).as_posix()
            if args.only and rel != args.only:
                continue
            try:
                records = build_records(path, rel, registry.get(rel) or default_meta(rel))
            except Exception:
                log.exception("Gagal memproses %s", rel)
                continue
            save_jsonl(settings.processed_dir / f"{Path(rel).with_suffix('').as_posix().replace('/', '__')}.jsonl", records)
            per_file[rel] = records
    
        total = sum(len(r) for r in per_file.values())
        log.info("Total %d chunk dari %d file", total, len(per_file))
        if args.no_embed or not total:
            return
    
        from src.retrieval.embedder import get_embedder
        from src.retrieval.vectorstore import VectorStore
    
        embedder = get_embedder(settings.embed_model)
        store = VectorStore(settings.chroma_dir, settings.collection)
        if args.reset:
            store.reset()
        for rel, records in per_file.items():
            store.delete_source(rel)  # re-index bersih per file
            store.upsert(records, embedder.embed_passages([r["text"] for r in records]))
        log.info("Index selesai: %d chunk di koleksi '%s'", store.count(), settings.collection)
    
    if __name__ == "__main__":
        main()
    ```
    

### Retrieval

- `src/retrieval/schema.py`
    
    ```python
    from __future__ import annotations
    
    from dataclasses import dataclass, field
    
    @dataclass
    class RetrievedChunk:
        id: str
        text: str
        metadata: dict = field(default_factory=dict)
        score: float = 0.0  # cosine similarity (0..1)
    ```
    
- `src/retrieval/embedder.py`
    
    ```python
    """Embedding dengan sentence-transformers (default multilingual-e5)."""
    from __future__ import annotations
    
    from functools import lru_cache
    
    class Embedder:
        def __init__(self, model_name: str):
            from sentence_transformers import SentenceTransformer
    
            self.model = SentenceTransformer(model_name)
            self.is_e5 = "e5" in model_name.lower()  # e5 butuh prefix "query:"/"passage:"
    
        def _encode(self, texts: list[str]) -> list[list[float]]:
            return self.model.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=len(texts) > 64).tolist()
    
        def embed_passages(self, texts: list[str]) -> list[list[float]]:
            return self._encode([f"passage: {t}" if self.is_e5 else t for t in texts])
    
        def embed_query(self, text: str) -> list[float]:
            return self._encode([f"query: {text}" if self.is_e5 else text])[0]
    
    @lru_cache(maxsize=2)
    def get_embedder(model_name: str) -> Embedder:
        return Embedder(model_name)
    ```
    
- `src/retrieval/vectorstore.py`
    
    ```python
    """Wrapper ChromaDB (persisten, cosine)."""
    from __future__ import annotations
    
    from pathlib import Path
    
    from src.retrieval.schema import RetrievedChunk
    
    def _clean_meta(meta: dict) -> dict:
        return {k: v for k, v in meta.items() if v is not None and isinstance(v, (str, int, float, bool))}
    
    class VectorStore:
        def __init__(self, path: Path, collection: str):
            import chromadb
    
            self.name = collection
            self.client = chromadb.PersistentClient(path=str(path))
            self.col = self._get()
    
        def _get(self):
            return self.client.get_or_create_collection(self.name, metadata={"hnsw:space": "cosine"})
    
        def reset(self) -> None:
            self.client.delete_collection(self.name)
            self.col = self._get()
    
        def delete_source(self, source_file: str) -> None:
            self.col.delete(where={"source_file": source_file})
    
        def upsert(self, records: list[dict], embeddings: list[list[float]], batch: int = 256) -> None:
            for i in range(0, len(records), batch):
                part = records[i : i + batch]
                self.col.upsert(
                    ids=[r["id"] for r in part],
                    documents=[r["text"] for r in part],
                    metadatas=[_clean_meta(r["metadata"]) for r in part],
                    embeddings=embeddings[i : i + batch],
                )
    
        def count(self) -> int:
            return self.col.count()
    
        def query(self, embedding: list[float], k: int, where: dict | None = None) -> list[RetrievedChunk]:
            res = self.col.query(
                query_embeddings=[embedding],
                n_results=k,
                where=where,
                include=["documents", "metadatas", "distances"],
            )
            return [
                RetrievedChunk(id=i, text=d, metadata=m or {}, score=1.0 - dist)
                for i, d, m, dist in zip(res["ids"][0], res["documents"][0], res["metadatas"][0], res["distances"][0])
            ]
    ```
    
- `src/retrieval/retriever.py`
    
    ```python
    """Retrieval: vector search + threshold skor + filter metadata."""
    from __future__ import annotations
    
    import logging
    
    from src.config import Settings, settings as default_settings
    from src.retrieval.schema import RetrievedChunk
    
    log = logging.getLogger(__name__)
    
    def build_where(doc_type: str | None, exclude_revoked: bool) -> dict | None:
        conds = []
        if doc_type:
            conds.append({"doc_type": doc_type})
        if exclude_revoked:
            conds.append({"status": {"$ne": "dicabut"}})
        if not conds:
            return None
        return conds[0] if len(conds) == 1 else {"$and": conds}
    
    class Retriever:
        def __init__(self, settings: Settings | None = None, embedder=None, store=None):
            self.s = settings or default_settings
            if embedder is None:
                from src.retrieval.embedder import get_embedder
    
                embedder = get_embedder(self.s.embed_model)
            if store is None:
                from src.retrieval.vectorstore import VectorStore
    
                store = VectorStore(self.s.chroma_dir, self.s.collection)
            self.embedder, self.store = embedder, store
    
        def retrieve(self, question: str, doc_type: str | None = None, top_k: int | None = None) -> list[RetrievedChunk]:
            hits = self.store.query(
                self.embedder.embed_query(question),
                k=top_k or self.s.top_k,
                where=build_where(doc_type, self.s.exclude_revoked),
            )
            kept = [h for h in hits if h.score >= self.s.score_threshold]
            log.info(
                "retrieve q=%r skor=%s lolos=%d/%d",
                question[:80], [round(h.score, 3) for h in hits], len(kept), len(hits),
            )
            return kept
    ```
    

### Generation

- `src/generation/prompts.py`
    
    ```python
    """Prompt, format konteks, dan label sitasi."""
    from __future__ import annotations
    
    from src.retrieval.schema import RetrievedChunk
    
    SYSTEM_PROMPT = """Anda adalah Asisten K3 Peledakan untuk Pengawas di tambang terbuka batubara.
    Aturan wajib:
    1. Jawab HANYA berdasarkan KONTEKS yang diberikan. Jangan memakai pengetahuan di luar konteks.
    2. Setiap poin/kalimat fakta WAJIB diberi sitasi ID sumber, contoh: [S1] atau [S2][S3].
    3. Jika konteks tidak memuat jawabannya, jawab: "Informasi tersebut tidak ditemukan di dokumen yang tersedia. Silakan hubungi Pengawas/KTT." Jangan menebak.
    4. Jika sumber berstatus DICABUT, sebutkan bahwa regulasi tersebut sudah dicabut beserta penggantinya bila tercantum.
    5. Untuk kondisi darurat, utamakan instruksi menghentikan pekerjaan, mengamankan area, dan menghubungi tim tanggap darurat.
    6. Jawab dalam Bahasa Indonesia yang singkat dan jelas; gunakan daftar bernomor untuk langkah kerja."""
    
    CONDENSE_SYSTEM = (
        "Tulis ulang pertanyaan lanjutan menjadi pertanyaan mandiri yang lengkap dalam Bahasa Indonesia "
        "berdasarkan riwayat percakapan. Jangan menjawab. Keluarkan HANYA pertanyaan hasil tulis ulang."
    )
    CONDENSE_USER = "Riwayat percakapan:\n{history}\n\nPertanyaan lanjutan: {question}\n\nPertanyaan mandiri:"
    
    CITATION_RETRY = (
        "Jawaban Anda belum menyertakan sitasi. Tulis ulang jawaban yang sama dengan sitasi [S#] "
        "di setiap poin, hanya berdasarkan konteks."
    )
    REFUSAL_MESSAGE = (
        "Informasi tersebut tidak ditemukan di dokumen yang tersedia. "
        "Silakan hubungi Pengawas/KTT atau rujuk SOP resmi perusahaan."
    )
    NO_CITATION_WARNING = "\n\n⚠️ _Jawaban ini tidak menyertakan sitasi yang valid. Jangan dijadikan acuan; verifikasi ke dokumen sumber._"
    DISCLAIMER = (
        "Chatbot ini alat bantu, bukan pengganti SOP resmi perusahaan, regulasi, maupun arahan Pengawas/KTT."
    )
    
    def source_label(meta: dict) -> str:
        parts = [meta.get("doc_title", "Dokumen")]
        parts += [meta[k] for k in ("lampiran", "bab", "bagian") if meta.get(k)]
        if meta.get("pasal"):
            parts.append(f"Pasal {meta['pasal']}")
        if meta.get("section"):
            parts.append(meta["section"])
        start, end = meta.get("page_start"), meta.get("page_end")
        if start:
            parts.append(f"hal. {start}" if not end or end == start else f"hal. {start}–{end}")
        label = ", ".join(str(p) for p in parts)
        if meta.get("status") == "dicabut":
            label += f" (DICABUT, diganti {meta.get('replaced_by', '-')})"
        return label
    
    def format_context(chunks: list[RetrievedChunk]) -> str:
        blocks = []
        for i, c in enumerate(chunks, 1):
            header = "[S" + str(i) + "] (" + source_label(c.metadata) + ")"
            blocks.append(header + "\n" + c.text)
        return "\n\n".join(blocks)
    
    def build_user_prompt(question: str, chunks: list[RetrievedChunk]) -> str:
        return f"KONTEKS:\n{format_context(chunks)}\n\nPERTANYAAN: {question}"
    ```
    
- `src/generation/guardrails.py`
    
    ```python
    """Guardrail K3: deteksi darurat, cek sitasi, deteksi penolakan."""
    from __future__ import annotations
    
    import re
    
    _EMERGENCY = re.compile(
        r"\b(kebakaran|terbakar|longsor|runtuh|tertimbun|gas beracun|keracunan|bocor gas|kebocoran gas|"
        r"korban|terluka|pingsan|meninggal|tewas|ledakan prematur|flyrock|batu terbang)\b",
        re.I,
    )
    _CITATION = re.compile(r"\[S(\d+)\]")
    
    def is_emergency(text: str) -> bool:
        return bool(_EMERGENCY.search(text or ""))
    
    def emergency_notice(contact: str) -> str:
        return (
            "🚨 **KONDISI DARURAT?** Hentikan pekerjaan, amankan area dan jauhi lokasi, "
            f"lalu segera hubungi **{contact}**. Ikuti arahan Pengawas/KTT; informasi di bawah hanya pendukung."
        )
    
    def extract_citations(answer: str) -> set[int]:
        return {int(n) for n in _CITATION.findall(answer or "")}
    
    def is_refusal(answer: str) -> bool:
        return "tidak ditemukan di dokumen" in (answer or "").lower()
    ```
    
- `src/generation/llm.py`
    
    ```python
    """Klien LLM OpenAI-compatible (OpenAI, Ollama, vLLM, LM Studio)."""
    from __future__ import annotations
    
    from collections.abc import Iterator
    
    from src.config import Settings
    
    class LLMClient:
        def __init__(self, settings: Settings):
            from openai import OpenAI
    
            self.client = OpenAI(base_url=settings.llm_base_url, api_key=settings.llm_api_key, timeout=120)
            self.model = settings.llm_model
    
        def complete(self, messages: list[dict], temperature: float = 0.0) -> str:
            res = self.client.chat.completions.create(model=self.model, messages=messages, temperature=temperature)
            return res.choices[0].message.content or ""
    
        def stream(self, messages: list[dict], temperature: float = 0.0) -> Iterator[str]:
            for event in self.client.chat.completions.create(
                model=self.model, messages=messages, temperature=temperature, stream=True
            ):
                if event.choices and (delta := event.choices[0].delta.content):
                    yield delta
    ```
    
- `src/generation/rag.py`
    
    ```python
    """Pipeline RAG: query rewriting (memory) -> retrieval -> guardrail -> LLM -> sitasi."""
    from __future__ import annotations
    
    import logging
    import time
    from collections.abc import Iterator
    from dataclasses import dataclass
    
    from src.config import Settings, settings as default_settings
    from src.generation import prompts
    from src.generation.guardrails import emergency_notice, extract_citations, is_emergency, is_refusal
    from src.retrieval.schema import RetrievedChunk
    
    log = logging.getLogger(__name__)
    
    @dataclass
    class Prepared:
        question: str
        standalone: str
        chunks: list[RetrievedChunk]
        notice: str | None
        messages: list[dict] | None  # None = tidak ada konteks relevan -> tolak
    
    class RAGPipeline:
        def __init__(self, settings: Settings | None = None, retriever=None, llm=None):
            self.s = settings or default_settings
            if retriever is None:
                from src.retrieval.retriever import Retriever
    
                retriever = Retriever(self.s)
            if llm is None:
                from src.generation.llm import LLMClient
    
                llm = LLMClient(self.s)
            self.retriever, self.llm = retriever, llm
    
        # ---------- memory ----------
        def condense(self, question: str, history: list[dict]) -> str:
            if not history:
                return question
            recent = history[-self.s.history_turns :]
            transcript = "\n".join(
                f"{'Pengguna' if t['role'] == 'user' else 'Asisten'}: {t['content'][:800]}" for t in recent
            )
            try:
                out = self.llm.complete(
                    [
                        {"role": "system", "content": prompts.CONDENSE_SYSTEM},
                        {"role": "user", "content": prompts.CONDENSE_USER.format(history=transcript, question=question)},
                    ]
                ).strip()
            except Exception:
                log.exception("Query rewriting gagal, pakai pertanyaan asli")
                return question
            return out.splitlines()[0].strip() if out else question
    
        # ---------- core ----------
        def prepare(self, question: str, history: list[dict] | None = None, doc_type: str | None = None) -> Prepared:
            standalone = self.condense(question, history or [])
            chunks = self.retriever.retrieve(standalone, doc_type=doc_type)
            notice = emergency_notice(self.s.emergency_contact) if is_emergency(question) or is_emergency(standalone) else None
            messages = None
            if chunks:
                messages = [
                    {"role": "system", "content": prompts.SYSTEM_PROMPT},
                    {"role": "user", "content": prompts.build_user_prompt(standalone, chunks)},
                ]
            return Prepared(question, standalone, chunks, notice, messages)
    
        @staticmethod
        def _check(answer: str, chunks: list[RetrievedChunk]) -> tuple[set[int], bool]:
            cited = {i for i in extract_citations(answer) if 1 <= i <= len(chunks)}
            return cited, bool(cited) or is_refusal(answer)
    
        @staticmethod
        def _sources(chunks: list[RetrievedChunk], cited: set[int]) -> list[dict]:
            return [
                {
                    "id": f"S{i}",
                    "label": prompts.source_label(c.metadata),
                    "score": round(c.score, 3),
                    "cited": i in cited,
                    "snippet": c.text[:500],
                    "metadata": c.metadata,
                }
                for i, c in enumerate(chunks, 1)
            ]
    
        def _audit(self, p: Prepared, ok: bool, t0: float) -> None:
            log.info(
                "AUDIT q=%r standalone=%r chunks=%d darurat=%s sitasi_ok=%s latency=%.2fs",
                p.question, p.standalone, len(p.chunks), bool(p.notice), ok, time.perf_counter() - t0,
            )
    
        def answer(self, question: str, history: list[dict] | None = None, doc_type: str | None = None) -> dict:
            t0 = time.perf_counter()
            p = self.prepare(question, history, doc_type)
            if not p.messages:
                answer, cited, ok = prompts.REFUSAL_MESSAGE, set(), True
            else:
                answer = self.llm.complete(p.messages)
                cited, ok = self._check(answer, p.chunks)
                if not ok:  # jawaban tanpa sumber = gagal -> minta ulang sekali
                    log.warning("Jawaban tanpa sitasi, retry")
                    retry_messages = p.messages + [
                        {"role": "assistant", "content": answer},
                        {"role": "user", "content": prompts.CITATION_RETRY},
                    ]
                    answer = self.llm.complete(retry_messages)
                    cited, ok = self._check(answer, p.chunks)
                if not ok:
                    answer += prompts.NO_CITATION_WARNING
            if p.notice:
                answer = f"{p.notice}\n\n{answer}"
            self._audit(p, ok, t0)
            return {
                "answer": answer,
                "standalone_question": p.standalone,
                "emergency": bool(p.notice),
                "citation_ok": ok,
                "sources": self._sources(p.chunks, cited),
                "disclaimer": prompts.DISCLAIMER,
            }
    
        def stream(self, question: str, history: list[dict] | None = None, doc_type: str | None = None) -> Iterator[dict]:
            t0 = time.perf_counter()
            p = self.prepare(question, history, doc_type)
            yield {"type": "meta", "standalone_question": p.standalone, "emergency": bool(p.notice), "notice": p.notice}
            if not p.messages:
                yield {"type": "token", "content": prompts.REFUSAL_MESSAGE}
                yield {"type": "sources", "sources": [], "citation_ok": True}
                self._audit(p, True, t0)
                yield {"type": "done"}
                return
            parts: list[str] = []
            for token in self.llm.stream(p.messages):
                parts.append(token)
                yield {"type": "token", "content": token}
            cited, ok = self._check("".join(parts), p.chunks)
            if not ok:
                yield {"type": "token", "content": prompts.NO_CITATION_WARNING}
            yield {"type": "sources", "sources": self._sources(p.chunks, cited), "citation_ok": ok}
            self._audit(p, ok, t0)
            yield {"type": "done"}
    ```
    

### API & Frontend

- `src/api/main.py`
    
    ```python
    """Backend FastAPI. Jalankan: uvicorn src.api.main:app --reload"""
    from __future__ import annotations
    
    import json
    import logging
    from functools import lru_cache
    from typing import Literal
    
    from fastapi import FastAPI
    from fastapi.responses import StreamingResponse
    from pydantic import BaseModel, Field
    
    from src.config import settings, setup_logging
    from src.generation.prompts import DISCLAIMER
    from src.generation.rag import RAGPipeline
    
    setup_logging()
    log = logging.getLogger(__name__)
    app = FastAPI(title="Asisten K3 Peledakan", version="0.2.0", description=DISCLAIMER)
    
    class Message(BaseModel):
        role: Literal["user", "assistant"]
        content: str
    
    class ChatRequest(BaseModel):
        question: str = Field(min_length=3, max_length=1000)
        history: list[Message] = Field(default_factory=list)
        doc_type: Literal["regulasi", "sop", "ik"] | None = None
    
    @lru_cache
    def get_pipeline() -> RAGPipeline:
        return RAGPipeline(settings)
    
    @app.get("/health")
    def health() -> dict:
        return {"status": "ok", "model": settings.llm_model, "collection": settings.collection}
    
    @app.post("/chat")
    def chat(req: ChatRequest) -> dict:
        return get_pipeline().answer(req.question, [m.model_dump() for m in req.history], req.doc_type)
    
    @app.post("/chat/stream")
    def chat_stream(req: ChatRequest) -> StreamingResponse:
        def events():
            try:
                for ev in get_pipeline().stream(req.question, [m.model_dump() for m in req.history], req.doc_type):
                    yield f"data: {json.dumps(ev, ensure_ascii=False)}\n\n"
            except Exception as exc:
                log.exception("Streaming gagal")
                yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
    
        return StreamingResponse(events(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})
    ```
    
- `app/streamlit_app.py`
    
    ```python
    """Frontend Streamlit. Jalankan: streamlit run app/streamlit_app.py"""
    import json
    import os
    
    import requests
    import streamlit as st
    from dotenv import load_dotenv
    
    load_dotenv()
    API_URL = os.getenv("API_URL", "http://localhost:8000")
    DISCLAIMER = "Chatbot ini alat bantu, bukan pengganti SOP resmi perusahaan, regulasi, maupun arahan Pengawas/KTT."
    
    st.set_page_config(page_title="Asisten K3 Peledakan", page_icon="⛑️")
    st.title("⛑️ Asisten K3 Peledakan")
    st.caption(DISCLAIMER)
    
    if "messages" not in st.session_state:
        st.session_state.messages = []
    
    with st.sidebar:
        choice = st.selectbox("Filter dokumen", ["Semua", "regulasi", "sop"])
        doc_type = None if choice == "Semua" else choice
        if st.button("🗑️ Reset percakapan"):
            st.session_state.messages = []
            st.rerun()
    
    def render_sources(sources: list[dict]) -> None:
        if not sources:
            return
        with st.expander(f"📚 Sumber ({sum(s['cited'] for s in sources)} dikutip)"):
            for s in sorted(sources, key=lambda x: not x["cited"]):
                mark = "✅" if s["cited"] else "▫️"
                st.markdown(f"{mark} **[{s['id']}]** {s['label']}  \n_skor: {s['score']}_")
                st.caption(s["snippet"])
    
    def stream_events(payload: dict):
        with requests.post(f"{API_URL}/chat/stream", json=payload, stream=True, timeout=180) as r:
            r.raise_for_status()
            for line in r.iter_lines(decode_unicode=True):
                if line and line.startswith("data: "):
                    yield json.loads(line[6:])
    
    for m in st.session_state.messages:
        with st.chat_message(m["role"]):
            st.markdown(m["content"])
            render_sources(m.get("sources", []))
    
    if question := st.chat_input("Tanya tentang K3 peledakan..."):
        history = [{"role": m["role"], "content": m["content"]} for m in st.session_state.messages]
        st.session_state.messages.append({"role": "user", "content": question})
        with st.chat_message("user"):
            st.markdown(question)
    
        with st.chat_message("assistant"):
            box, text, sources = st.empty(), "", []
            try:
                for ev in stream_events({"question": question, "history": history, "doc_type": doc_type}):
                    if ev["type"] == "meta" and ev.get("notice"):
                        text = ev["notice"] + "\n\n"
                    elif ev["type"] == "token":
                        text += ev["content"]
                        box.markdown(text + "▌")
                    elif ev["type"] == "sources":
                        sources = ev["sources"]
                    elif ev["type"] == "error":
                        st.error(f"Terjadi kesalahan: {ev['message']}")
            except requests.RequestException as exc:
                st.error(f"Backend tidak dapat dihubungi ({API_URL}): {exc}")
            box.markdown(text)
            render_sources(sources)
        st.session_state.messages.append({"role": "assistant", "content": text, "sources": sources})
    ```
    

### Data contoh

- `data/raw/sop/sop_04_penanganan_misfire.md`
    
    ```markdown
    # SOP-BLS-04 Penanganan Misfire (Gagal Ledak)
    
    > FIKTIF, dibuat untuk portfolio. Bukan SOP resmi perusahaan mana pun. Nomor halaman rujukan (hal. ___) wajib diisi setelah dicek ke dokumen asli.
    
    ## 1. Tujuan
    
    Menetapkan langkah kerja aman bila terdapat lubang ledak yang gagal meledak (misfire) setelah peledakan di tambang terbuka batubara, untuk mencegah ledakan tak terduga dan cedera pekerja.
    
    ## 2. Ruang Lingkup
    
    Berlaku untuk seluruh kegiatan peledakan di area pit, meliputi juru ledak, pengawas peledakan, dan pekerja yang berada di sekitar area peledakan.
    
    ## 3. Referensi
    
    - Kepmen ESDM 1827 K/30/MEM/2018, Lampiran III, bagian keselamatan bahan peledak dan peledakan (hal. ___)
    - Perkap/Perpol No. 17 Tahun 2017 tentang pengamanan bahan peledak komersial
    - SKKNI bidang pengeboran dan peledakan
    
    ## 4. Tanggung Jawab
    
    - Juru ledak pemegang KIM: memastikan dan menangani lubang misfire.
    - Pengawas peledakan: menetapkan status area, mengizinkan atau melarang masuk ke area.
    - KTT: menerima laporan dan memastikan tindak lanjut.
    
    ## 5. APD
    
    - Helm, sepatu keselamatan, rompi reflektif, kacamata keselamatan, sarung tangan.
    - Radio komunikasi untuk koordinasi dengan pengawas dan penjaga blokade.
    
    ## 6. Prosedur
    
    ### Langkah 1 – Identifikasi misfire
    
    1. Setelah peledakan, area tetap diblokade; tidak ada yang masuk sebelum dinyatakan aman.
    2. Juru ledak memeriksa indikasi misfire: lubang yang tidak terbongkar, sisa sumbu/detonator, atau bahan peledak terlihat.
    (Rujukan: Kepmen ESDM 1827 K/30/MEM/2018, Lampiran III, hal. ___)
    
    ### Langkah 2 – Waktu tunggu dan larangan mendekat
    
    1. Bila dicurigai misfire, seluruh pekerja dilarang mendekati lubang ledak.
    2. Tunggu sesuai waktu tunggu yang ditetapkan regulasi/KTT sebelum pemeriksaan (isi angka dari Kepmen 1827 hal. ___).
    3. Blokade dan radius aman tetap dipertahankan selama waktu tunggu.
    (Rujukan: Kepmen ESDM 1827 K/30/MEM/2018, Lampiran III, hal. ___)
    
    ### Langkah 3 – Pemeriksaan oleh juru ledak
    
    1. Hanya juru ledak pemegang KIM yang boleh memeriksa lubang misfire, didampingi pengawas peledakan.
    2. Tandai lubang misfire dengan penanda yang jelas dan mudah terlihat.
    (Rujukan: Kepmen ESDM 1827 K/30/MEM/2018, Lampiran III, hal. ___)
    
    ### Langkah 4 – Penanganan lubang misfire
    
    1. Penanganan dilakukan sesuai metode yang diizinkan regulasi dan prosedur perusahaan, di bawah pengawasan pengawas peledakan.
    2. Dilarang mencabut atau mengebor ulang lubang misfire.
    3. Area baru dibuka kembali setelah juru ledak dan pengawas menyatakan aman.
    (Rujukan: Kepmen ESDM 1827 K/30/MEM/2018, Lampiran III, hal. ___)
    
    ### Langkah 5 – Pelaporan dan pencatatan
    
    1. Catat kejadian misfire di buku catatan bahan peledak/peledakan.
    2. Laporkan kepada KTT dan lakukan investigasi penyebab.
    (Rujukan: Kepmen ESDM 1827 K/30/MEM/2018, Lampiran III, hal. ___)
    
    ## 7. Tanggap Darurat
    
    1. Bila terjadi ledakan tak terduga atau ada korban: hentikan semua pekerjaan, amankan area, dan hubungi tim tanggap darurat.
    2. Jangan mendekati lubang ledak sebelum dinyatakan aman oleh juru ledak dan pengawas.
    ```
    

### Tests

- `tests/test_clean.py`
    
    ```python
    from src.ingestion.clean import clean_pages, fix_hyphenation, is_page_number
    from src.ingestion.parse import Page
    
    WORDS = ["gudang", "juru ledak", "detonator", "radius aman", "misfire", "blokade"]
    
    def test_page_number_detection():
        assert is_page_number("12")
        assert is_page_number("- 12 -")
        assert is_page_number("Halaman 3 dari 10")
        assert not is_page_number("12. Juru ledak wajib memiliki KIM")
    
    def test_hyphenation():
        assert fix_hyphenation("bahan pele-\ndak") == "bahan peledak"
    
    def test_header_footer_and_page_numbers_removed():
        pages = [
            Page(i, f"KEPUTUSAN MENTERI ESDM\nPembahasan {w} bagian awal.\nUraian {w} lanjutan.\nPenutup {w}.\n{i}")
            for i, w in enumerate(WORDS, 1)
        ]
        texts = [t for _, t in clean_pages(pages)]
        assert "KEPUTUSAN MENTERI ESDM" not in texts
        assert not any(t.isdigit() for t in texts)
        assert "Uraian misfire lanjutan." in texts
    
    def test_structural_header_kept():
        pages = [Page(i, f"LAMPIRAN III\nIsi {w} satu.\nIsi {w} dua.\nIsi {w} tiga.") for i, w in enumerate(WORDS, 1)]
        texts = [t for _, t in clean_pages(pages)]
        assert texts.count("LAMPIRAN III") == len(WORDS)
    
    def test_page_numbers_tracked():
        lines = clean_pages([Page(7, "Baris A"), Page(8, "Baris B")])
        assert lines == [(7, "Baris A"), (8, "Baris B")]
    ```
    
- `tests/test_chunk.py`
    
    ```python
    from src.ingestion.chunk import chunk_regulation, chunk_sop
    
    REG = [
        (1, "BAB I"),
        (1, "KETENTUAN UMUM"),
        (1, "Pasal 1"),
        (1, "Dalam peraturan ini yang dimaksud dengan:"),
        (1, "1. Bahan peledak adalah bahan yang dapat meledak."),
        (2, "Pasal 2"),
        (2, "Juru ledak wajib memiliki KIM sebagaimana dimaksud dalam"),
        (2, "Pasal 1 angka 1."),
        (2, "BAB II"),
        (3, "PENYIMPANAN"),
        (3, "Bagian Kesatu"),
        (3, "Gudang"),
        (3, "Pasal 3"),
        (3, "Gudang bahan peledak harus dikunci."),
        (4, "Lanjutan Pasal 3 di halaman berikutnya."),
    ]
    
    def test_regulation_split_per_pasal():
        chunks = chunk_regulation(REG)
        assert [c.pasal for c in chunks] == ["1", "2", "3"]
        assert chunks[0].bab == "BAB I KETENTUAN UMUM"
        assert chunks[2].bab == "BAB II PENYIMPANAN"
        assert chunks[2].bagian == "Bagian Kesatu Gudang"
        assert (chunks[2].page_start, chunks[2].page_end) == (3, 4)
    
    def test_inline_pasal_reference_is_not_split():
        # "Pasal 1 angka 1." bukan heading karena tidak berdiri sendiri
        chunks = chunk_regulation(REG)
        assert "Pasal 1 angka 1." in chunks[1].text
    
    def test_repeated_lampiran_header_does_not_split():
        lines = [(1, "LAMPIRAN III"), (1, "teks a"), (2, "LAMPIRAN III"), (2, "teks b")]
        chunks = chunk_regulation(lines)
        assert len(chunks) == 1
        assert chunks[0].lampiran == "Lampiran III"
        assert (chunks[0].page_start, chunks[0].page_end) == (1, 2)
    
    def test_long_pasal_split_with_overlap_and_context():
        lines = [(1, "BAB III PELEDAKAN"), (1, "Pasal 9")] + [(1 + i // 10, f"Kalimat ke-{i} tentang peledakan.") for i in range(60)]
        chunks = chunk_regulation(lines, max_chars=300, overlap=60)
        assert len(chunks) > 1
        assert all(c.pasal == "9" and c.bab == "BAB III PELEDAKAN" for c in chunks)
        assert all(len(c.text) <= 300 for c in chunks)
        assert chunks[0].text.splitlines()[-1] == chunks[1].text.splitlines()[0]  # overlap
    
    def test_sop_sections():
        lines = [
            (None, "# SOP Misfire"),
            (None, "## 1. Tujuan"),
            (None, "Mencegah ledakan tak terduga."),
            (None, "## 6. Prosedur"),
            (None, "### Langkah 1 – Identifikasi"),
            (None, "Periksa lubang."),
            (None, "### Langkah 2 – Waktu tunggu"),
            (None, "Dilarang mendekat."),
        ]
        chunks = chunk_sop(lines)
        assert [c.section for c in chunks] == [
            "1. Tujuan",
            "6. Prosedur > Langkah 1 – Identifikasi",
            "6. Prosedur > Langkah 2 – Waktu tunggu",
        ]
        assert all(c.page_start is None for c in chunks)
    ```
    
- `tests/test_rag.py`
    
    ```python
    """Uji logika RAG dengan retriever & LLM palsu (tanpa model/DB)."""
    from src.config import Settings
    from src.generation import prompts
    from src.generation.rag import RAGPipeline
    from src.retrieval.schema import RetrievedChunk
    
    CHUNK = RetrievedChunk(
        id="a",
        text="Juru ledak wajib memiliki KIM.",
        metadata={"doc_title": "Kepmen ESDM 1827 K/30/MEM/2018", "lampiran": "Lampiran III", "page_start": 157},
        score=0.9,
    )
    
    class FakeRetriever:
        def __init__(self, chunks):
            self.chunks, self.last_query = chunks, None
    
        def retrieve(self, question, doc_type=None, top_k=None):
            self.last_query = question
            return self.chunks
    
    class FakeLLM:
        def __init__(self, *replies):
            self.replies, self.calls = list(replies), 0
    
        def complete(self, messages, temperature=0.0):
            self.calls += 1
            return self.replies.pop(0)
    
        def stream(self, messages, temperature=0.0):
            self.calls += 1
            yield from self.replies.pop(0).split(" ")
    
    def make(chunks, *replies):
        retriever, llm = FakeRetriever(chunks), FakeLLM(*replies)
        return RAGPipeline(Settings(), retriever, llm), retriever, llm
    
    def test_refuses_without_context_and_skips_llm():
        rag, _, llm = make([])
        out = rag.answer("Berapa harga detonator?")
        assert out["answer"] == prompts.REFUSAL_MESSAGE
        assert llm.calls == 0
    
    def test_answer_with_citation():
        rag, _, _ = make([CHUNK], "Juru ledak wajib memiliki KIM [S1].")
        out = rag.answer("Apa syarat juru ledak?")
        assert out["citation_ok"] and out["sources"][0]["cited"]
        assert "hal. 157" in out["sources"][0]["label"]
    
    def test_retry_when_no_citation():
        rag, _, llm = make([CHUNK], "Juru ledak wajib punya KIM.", "Juru ledak wajib punya KIM [S1].")
        out = rag.answer("Apa syarat juru ledak?")
        assert llm.calls == 2 and out["citation_ok"]
    
    def test_warning_when_still_no_citation():
        rag, _, _ = make([CHUNK], "tanpa sitasi", "tetap tanpa sitasi")
        out = rag.answer("Apa syarat juru ledak?")
        assert not out["citation_ok"] and prompts.NO_CITATION_WARNING in out["answer"]
    
    def test_emergency_notice_first():
        rag, _, _ = make([CHUNK], "Hentikan pekerjaan [S1].")
        out = rag.answer("Ada korban terkena flyrock, apa yang harus dilakukan?")
        assert out["emergency"] and out["answer"].startswith("🚨")
    
    def test_history_rewrites_query():
        rag, retriever, _ = make([CHUNK], "Apa syarat KIM untuk juru ledak?", "Jawaban [S1].")
        rag.answer("Syaratnya apa?", history=[{"role": "user", "content": "Apa itu KIM?"}, {"role": "assistant", "content": "Kartu Izin Meledakkan."}])
        assert retriever.last_query == "Apa syarat KIM untuk juru ledak?"
    
    def test_stream_events():
        rag, _, _ = make([CHUNK], "Wajib KIM [S1].")
        events = list(rag.stream("Apa syarat juru ledak?"))
        assert events[0]["type"] == "meta" and events[-1]["type"] == "done"
        src = next(e for e in events if e["type"] == "sources")
        assert src["citation_ok"]
    ```