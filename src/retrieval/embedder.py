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
