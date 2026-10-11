    """Pipeline RAG: query rewriting (memory) -> retrieval -> guardrail -> LLM -> sitasi."""
    from __future__ import annotations
    
    import logging
    import time
    from collections.abc import Iterator
    from dataclasses import dataclass
    
    from src.config import Settings, settings as default_settings
    from src.generation import prompts
    from src.generation.guardrails import emergency_notice, extract_citations, is_emergency, is_refusal
    from src.retrieval.schema import RetrievedChunk
    
    log = logging.getLogger(__name__)
    
    @dataclass
    class Prepared:
        question: str
        standalone: str
        chunks: list[RetrievedChunk]
        notice: str | None
        messages: list[dict] | None  # None = tidak ada konteks relevan -> tolak
    
    class RAGPipeline:
        def __init__(self, settings: Settings | None = None, retriever=None, llm=None):
            self.s = settings or default_settings
            if retriever is None:
                from src.retrieval.retriever import Retriever
    
                retriever = Retriever(self.s)
            if llm is None:
                from src.generation.llm import LLMClient
    
                llm = LLMClient(self.s)
            self.retriever, self.llm = retriever, llm
    
        # ---------- memory ----------
        def condense(self, question: str, history: list[dict]) -> str:
            if not history:
                return question
            recent = history[-self.s.history_turns :]
            transcript = "\n".join(
                f"{'Pengguna' if t['role'] == 'user' else 'Asisten'}: {t['content'][:800]}" for t in recent
            )
            try:
                out = self.llm.complete(
                    [
                        {"role": "system", "content": prompts.CONDENSE_SYSTEM},
                        {"role": "user", "content": prompts.CONDENSE_USER.format(history=transcript, question=question)},
                    ]
                ).strip()
            except Exception:
                log.exception("Query rewriting gagal, pakai pertanyaan asli")
                return question
            return out.splitlines()[0].strip() if out else question
    
        # ---------- core ----------
        def prepare(self, question: str, history: list[dict] | None = None, doc_type: str | None = None) -> Prepared:
            standalone = self.condense(question, history or [])
            chunks = self.retriever.retrieve(standalone, doc_type=doc_type)
            notice = emergency_notice(self.s.emergency_contact) if is_emergency(question) or is_emergency(standalone) else None
            messages = None
            if chunks:
                messages = [
                    {"role": "system", "content": prompts.SYSTEM_PROMPT},
                    {"role": "user", "content": prompts.build_user_prompt(standalone, chunks)},
                ]
            return Prepared(question, standalone, chunks, notice, messages)
    
        @staticmethod
        def _check(answer: str, chunks: list[RetrievedChunk]) -> tuple[set[int], bool]:
            cited = {i for i in extract_citations(answer) if 1 <= i <= len(chunks)}
            return cited, bool(cited) or is_refusal(answer)
    
        @staticmethod
        def _sources(chunks: list[RetrievedChunk], cited: set[int]) -> list[dict]:
            return [
                {
                    "id": f"S{i}",
                    "label": prompts.source_label(c.metadata),
                    "score": round(c.score, 3),
                    "cited": i in cited,
                    "snippet": c.text[:500],
                    "metadata": c.metadata,
                }
                for i, c in enumerate(chunks, 1)
            ]
    
        def _audit(self, p: Prepared, ok: bool, t0: float) -> None:
            log.info(
                "AUDIT q=%r standalone=%r chunks=%d darurat=%s sitasi_ok=%s latency=%.2fs",
                p.question, p.standalone, len(p.chunks), bool(p.notice), ok, time.perf_counter() - t0,
            )
    
        def answer(self, question: str, history: list[dict] | None = None, doc_type: str | None = None) -> dict:
            t0 = time.perf_counter()
            p = self.prepare(question, history, doc_type)
            if not p.messages:
                answer, cited, ok = prompts.REFUSAL_MESSAGE, set(), True
            else:
                answer = self.llm.complete(p.messages)
                cited, ok = self._check(answer, p.chunks)
                if not ok:  # jawaban tanpa sumber = gagal -> minta ulang sekali
                    log.warning("Jawaban tanpa sitasi, retry")
                    retry_messages = p.messages + [
                        {"role": "assistant", "content": answer},
                        {"role": "user", "content": prompts.CITATION_RETRY},
                    ]
                    answer = self.llm.complete(retry_messages)
                    cited, ok = self._check(answer, p.chunks)
                if not ok:
                    answer += prompts.NO_CITATION_WARNING
            if p.notice:
                answer = f"{p.notice}\n\n{answer}"
            self._audit(p, ok, t0)
            return {
                "answer": answer,
                "standalone_question": p.standalone,
                "emergency": bool(p.notice),
                "citation_ok": ok,
                "sources": self._sources(p.chunks, cited),
                "disclaimer": prompts.DISCLAIMER,
            }
    
        def stream(self, question: str, history: list[dict] | None = None, doc_type: str | None = None) -> Iterator[dict]:
            t0 = time.perf_counter()
            p = self.prepare(question, history, doc_type)
            yield {"type": "meta", "standalone_question": p.standalone, "emergency": bool(p.notice), "notice": p.notice}
            if not p.messages:
                yield {"type": "token", "content": prompts.REFUSAL_MESSAGE}
                yield {"type": "sources", "sources": [], "citation_ok": True}
                self._audit(p, True, t0)
                yield {"type": "done"}
                return
            parts: list[str] = []
            for token in self.llm.stream(p.messages):
                parts.append(token)
                yield {"type": "token", "content": token}
            cited, ok = self._check("".join(parts), p.chunks)
            if not ok:
                yield {"type": "token", "content": prompts.NO_CITATION_WARNING}
            yield {"type": "sources", "sources": self._sources(p.chunks, cited), "citation_ok": ok}
            self._audit(p, ok, t0)
            yield {"type": "done"}
