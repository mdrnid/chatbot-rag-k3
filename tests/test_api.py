"""Unit test endpoint FastAPI (GET /config, POST /chat, POST /chat/stream, POST /feedback)."""
import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from src.api.main import app, get_pipeline
from src.retrieval.schema import RetrievedChunk

client = TestClient(app)

DUMMY_CHUNK = RetrievedChunk(
    id="s1",
    text="Radius aman peledakan adalah 500 meter untuk manusia.",
    metadata={"doc_title": "Kepmen ESDM 1827", "page_start": 42},
    score=0.88,
)

def test_get_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "model" in data

def test_get_config():
    res = client.get("/config")
    assert res.status_code == 200
    data = res.json()
    assert "regulasi" in data["doc_types"]
    assert "sop" in data["doc_types"]
    assert "ik" in data["doc_types"]
    assert "disclaimer" in data
    assert data["emergency_contact"]["name"] == "ERT"
    assert data["emergency_contact"]["phone"] == "112"
    assert "model" in data
    assert "version" in data
    assert isinstance(data["history_turns"], int)

def test_cors_preflight():
    res = client.options(
        "/config",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert res.headers.get("access-control-allow-origin") == "http://localhost:3000"

def test_post_feedback(caplog):
    res = client.post(
        "/feedback",
        json={"request_id": "test-uuid-123", "rating": "up", "comment": "Jawaban akurat"},
    )
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
    assert any("FEEDBACK req_id=test-uuid-123 rating=up" in r.message for r in caplog.records)

def test_post_chat_separates_emergency_notice():
    fake_pipeline = MagicMock()
    fake_pipeline.answer.return_value = {
        "answer": "🚨 KEADAAN DARURAT 🚨\n\nSegera lakukan evakuasi korban ke muster point [S1].",
        "standalone_question": "Evakuasi darurat",
        "emergency": True,
        "citation_ok": True,
        "sources": [{"id": "S1", "label": "SOP", "score": 0.9, "cited": True, "snippet": "...", "metadata": {}}],
        "disclaimer": "Disclaimer K3",
    }
    app.dependency_overrides[get_pipeline] = lambda: fake_pipeline
    try:
        res = client.post("/chat", json={"question": "Ada ledakan liar dan pekerja luka!"})
        assert res.status_code == 200
        data = res.json()
        assert data["emergency"] is True
        assert data["notice"] == "🚨 KEADAAN DARURAT 🚨"
        assert not data["answer"].startswith("🚨")
        assert "Segera lakukan evakuasi" in data["answer"]
    finally:
        app.dependency_overrides.clear()

def test_chat_stream_includes_request_id_and_latency():
    fake_pipeline = MagicMock()
    fake_pipeline.stream.return_value = [
        {"type": "meta", "standalone_question": "Radius aman", "emergency": False, "notice": None},
        {"type": "token", "content": "Radius "},
        {"type": "token", "content": "500m [S1]."},
        {"type": "sources", "sources": [], "citation_ok": True},
        {"type": "done"},
    ]
    app.dependency_overrides[get_pipeline] = lambda: fake_pipeline
    try:
        res = client.post("/chat/stream", json={"question": "Berapa radius aman peledakan?"})
        assert res.status_code == 200
        assert "text/event-stream" in res.headers["content-type"]
        events = []
        for line in res.iter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))
        
        meta = next(e for e in events if e["type"] == "meta")
        assert "request_id" in meta
        assert meta["emergency"] is False

        done = next(e for e in events if e["type"] == "done")
        assert "latency_ms" in done
        assert isinstance(done["latency_ms"], int)
    finally:
        app.dependency_overrides.clear()

def test_chat_stream_error_handling():
    fake_pipeline = MagicMock()
    def failing_stream(*args, **kwargs):
        raise TimeoutError("LLM server timeout after 30s")
        yield  # make it a generator
    fake_pipeline.stream.side_effect = failing_stream
    app.dependency_overrides[get_pipeline] = lambda: fake_pipeline
    try:
        res = client.post("/chat/stream", json={"question": "Berapa jarak aman?"})
        events = []
        for line in res.iter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))
        err = next(e for e in events if e["type"] == "error")
        assert err["code"] == "LLM_TIMEOUT"
        # Memverifikasi bahwa exception internal mentah tidak dibocorkan langsung
        assert "LLM server timeout after 30s" not in err["message"]
        assert "timeout" in err["message"].lower()
    finally:
        app.dependency_overrides.clear()
