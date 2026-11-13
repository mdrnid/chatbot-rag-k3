"""Backend FastAPI. Jalankan: uvicorn src.api.main:app --reload"""
from __future__ import annotations

import json
import logging
import time
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from functools import lru_cache
from typing import Literal

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.config import settings, setup_logging
from src.generation.prompts import DISCLAIMER
from src.generation.rag import RAGPipeline

setup_logging()
log = logging.getLogger(__name__)

DOC_TYPES = ("regulasi", "sop", "ik")

@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Muat RAG pipeline (embedder + vector store) saat startup, bukan saat request pertama."""
    log.info("Warm-up RAG pipeline (memuat model embedding)...")
    get_pipeline()
    log.info("RAG pipeline siap menerima request.")
    yield

app = FastAPI(title="Asisten K3 Peledakan", version="0.2.0", description=DISCLAIMER, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    history: list[Message] = Field(default_factory=list)
    doc_type: Literal["regulasi", "sop", "ik"] | None = None

class FeedbackRequest(BaseModel):
    request_id: str
    rating: Literal["up", "down"]
    comment: str | None = None

@lru_cache
def get_pipeline() -> RAGPipeline:
    return RAGPipeline(settings)



@app.get("/health")
def health() -> dict:
    from pathlib import Path

    chroma_exists = Path(settings.chroma_dir).exists()
    return {
        "status": "ok",
        "ready": chroma_exists,
        "model": settings.llm_model,
        "collection": settings.collection,
        "chroma_dir_exists": chroma_exists,
    }

@app.get("/config")
def get_config() -> dict:
    return {
        "doc_types": list(DOC_TYPES),
        "disclaimer": DISCLAIMER,
        "emergency_contact": {
            "name": settings.emergency_contact_name,
            "phone": settings.emergency_contact_phone,
        },
        "model": settings.llm_model,
        "version": app.version,
        "history_turns": settings.history_turns,
    }

@app.post("/chat")
def chat(req: ChatRequest, pipeline: RAGPipeline = Depends(get_pipeline)) -> dict:
    res = pipeline.answer(req.question, [m.model_dump() for m in req.history], req.doc_type)
    notice = None
    if res.get("emergency"):
        answer = res.get("answer", "")
        if answer.startswith("🚨"):
            parts = answer.split("\n\n", 1)
            notice = parts[0]
            res["answer"] = parts[1] if len(parts) > 1 else ""
    res["notice"] = notice
    return res

@app.post("/chat/stream")
def chat_stream(req: ChatRequest, pipeline: RAGPipeline = Depends(get_pipeline)) -> StreamingResponse:
    request_id = str(uuid.uuid4())
    t0 = time.perf_counter()
    log.info("STREAM START req_id=%s question=%r doc_type=%s", request_id, req.question, req.doc_type)

    def events():
        try:
            for ev in pipeline.stream(req.question, [m.model_dump() for m in req.history], req.doc_type):
                if ev.get("type") == "meta":
                    ev["request_id"] = request_id
                    log.info(
                        "AUDIT SSE meta req_id=%s standalone=%r emergency=%s",
                        request_id,
                        ev.get("standalone_question"),
                        ev.get("emergency"),
                    )
                elif ev.get("type") == "done":
                    latency_ms = int((time.perf_counter() - t0) * 1000)
                    ev["latency_ms"] = latency_ms
                    log.info("AUDIT SSE done req_id=%s latency_ms=%d", request_id, latency_ms)
                yield f"data: {json.dumps(ev, ensure_ascii=False)}\n\n"
        except Exception as exc:
            log.exception("Streaming gagal req_id=%s: %s", request_id, exc)
            exc_str = str(exc).lower()
            if "timeout" in exc_str or isinstance(exc, TimeoutError):
                code = "LLM_TIMEOUT"
                safe_msg = "Permintaan ke model bahasa melebihi batas waktu (timeout). Silakan coba lagi."
            elif "retriev" in exc_str:
                code = "RETRIEVAL_FAILED"
                safe_msg = "Gagal mengambil dokumen rujukan dari basis data. Silakan hubungi administrator."
            else:
                code = "INTERNAL_ERROR"
                safe_msg = "Terjadi kesalahan internal pada sistem. Silakan coba beberapa saat lagi."
            err_ev = {"type": "error", "message": safe_msg, "code": code}
            yield f"data: {json.dumps(err_ev, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

@app.post("/feedback")
def feedback(req: FeedbackRequest) -> dict:
    log.info("FEEDBACK req_id=%s rating=%s comment=%r", req.request_id, req.rating, req.comment)
    return {"status": "ok"}
