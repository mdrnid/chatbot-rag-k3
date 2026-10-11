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
