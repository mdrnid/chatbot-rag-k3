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
