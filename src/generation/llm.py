"""Klien LLM OpenAI-compatible (OpenAI, Ollama, vLLM, LM Studio)."""
from __future__ import annotations

from collections.abc import Iterator

from src.config import Settings

class LLMClient:
    def __init__(self, settings: Settings):
        from openai import OpenAI

        self.client = OpenAI(base_url=settings.llm_base_url, api_key=settings.llm_api_key, timeout=120)
        self.model = settings.llm_model

    def complete(self, messages: list[dict], temperature: float = 0.0) -> str:
        res = self.client.chat.completions.create(model=self.model, messages=messages, temperature=temperature)
        return res.choices[0].message.content or ""

    def stream(self, messages: list[dict], temperature: float = 0.0) -> Iterator[str]:
        for event in self.client.chat.completions.create(
            model=self.model, messages=messages, temperature=temperature, stream=True
        ):
            if event.choices and (delta := event.choices[0].delta.content):
                yield delta
