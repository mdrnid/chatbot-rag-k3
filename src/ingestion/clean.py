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
