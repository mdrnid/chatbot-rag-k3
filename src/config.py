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
    emergency_contact_name: str = _str("EMERGENCY_CONTACT_NAME", "ERT")
    emergency_contact_phone: str = _str("EMERGENCY_CONTACT_PHONE", "112")
    cors_origins: tuple[str, ...] = tuple(x.strip() for x in _str("CORS_ORIGINS", "http://localhost:3000").split(",") if x.strip())
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
