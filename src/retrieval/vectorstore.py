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
