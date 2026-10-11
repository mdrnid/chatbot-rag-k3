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
