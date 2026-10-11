"""Uji logika RAG dengan retriever & LLM palsu (tanpa model/DB)."""
from src.config import Settings
from src.generation import prompts
from src.generation.rag import RAGPipeline
from src.retrieval.schema import RetrievedChunk

CHUNK = RetrievedChunk(
    id="a",
    text="Juru ledak wajib memiliki KIM.",
    metadata={"doc_title": "Kepmen ESDM 1827 K/30/MEM/2018", "lampiran": "Lampiran III", "page_start": 157},
    score=0.9,
)

class FakeRetriever:
    def __init__(self, chunks):
        self.chunks, self.last_query = chunks, None

    def retrieve(self, question, doc_type=None, top_k=None):
        self.last_query = question
        return self.chunks

class FakeLLM:
    def __init__(self, *replies):
        self.replies, self.calls = list(replies), 0

    def complete(self, messages, temperature=0.0):
        self.calls += 1
        return self.replies.pop(0)

    def stream(self, messages, temperature=0.0):
        self.calls += 1
        yield from self.replies.pop(0).split(" ")

def make(chunks, *replies):
    retriever, llm = FakeRetriever(chunks), FakeLLM(*replies)
    return RAGPipeline(Settings(), retriever, llm), retriever, llm

def test_refuses_without_context_and_skips_llm():
    rag, _, llm = make([])
    out = rag.answer("Berapa harga detonator?")
    assert out["answer"] == prompts.REFUSAL_MESSAGE
    assert llm.calls == 0

def test_answer_with_citation():
    rag, _, _ = make([CHUNK], "Juru ledak wajib memiliki KIM [S1].")
    out = rag.answer("Apa syarat juru ledak?")
    assert out["citation_ok"] and out["sources"][0]["cited"]
    assert "hal. 157" in out["sources"][0]["label"]

def test_retry_when_no_citation():
    rag, _, llm = make([CHUNK], "Juru ledak wajib punya KIM.", "Juru ledak wajib punya KIM [S1].")
    out = rag.answer("Apa syarat juru ledak?")
    assert llm.calls == 2 and out["citation_ok"]

def test_warning_when_still_no_citation():
    rag, _, _ = make([CHUNK], "tanpa sitasi", "tetap tanpa sitasi")
    out = rag.answer("Apa syarat juru ledak?")
    assert not out["citation_ok"] and prompts.NO_CITATION_WARNING in out["answer"]

def test_emergency_notice_first():
    rag, _, _ = make([CHUNK], "Hentikan pekerjaan [S1].")
    out = rag.answer("Ada korban terkena flyrock, apa yang harus dilakukan?")
    assert out["emergency"] and out["answer"].startswith("🚨")

def test_history_rewrites_query():
    rag, retriever, _ = make([CHUNK], "Apa syarat KIM untuk juru ledak?", "Jawaban [S1].")
    rag.answer("Syaratnya apa?", history=[{"role": "user", "content": "Apa itu KIM?"}, {"role": "assistant", "content": "Kartu Izin Meledakkan."}])
    assert retriever.last_query == "Apa syarat KIM untuk juru ledak?"

def test_stream_events():
    rag, _, _ = make([CHUNK], "Wajib KIM [S1].")
    events = list(rag.stream("Apa syarat juru ledak?"))
    assert events[0]["type"] == "meta" and events[-1]["type"] == "done"
    src = next(e for e in events if e["type"] == "sources")
    assert src["citation_ok"]
