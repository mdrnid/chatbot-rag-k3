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
