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
