"""Frontend Streamlit. Jalankan: streamlit run app/streamlit_app.py"""
import json
import os
import time

import requests
import streamlit as st
from dotenv import load_dotenv

load_dotenv()
API_URL = os.getenv("API_URL", "http://localhost:8000")
LLM_MODEL = os.getenv("LLM_MODEL", "OpenRouter")
DISCLAIMER = "Alat bantu teknis. Selalu verifikasi keputusan ke dokumen resmi & arahan Pengawas/KTT."

st.set_page_config(page_title="Asisten K3 Peledakan", page_icon="⛑️")
st.title("⛑️ Asisten K3 Peledakan")
st.caption(DISCLAIMER)

if "messages" not in st.session_state:
    st.session_state.messages = []

with st.sidebar:
    choice = st.selectbox("Filter dokumen", ["Semua", "regulasi", "sop"])
    doc_type = None if choice == "Semua" else choice
    if st.button("🗑️ Reset percakapan"):
        st.session_state.messages = []
        st.rerun()

def render_sources(sources: list[dict]) -> None:
    if not sources:
        return
    with st.expander(f"📚 Sumber ({sum(s['cited'] for s in sources)} dikutip)"):
        for s in sorted(sources, key=lambda x: not x["cited"]):
            mark = "✅" if s["cited"] else "▫️"
            st.markdown(f"{mark} **[{s['id']}]** {s['label']}")
            st.caption(s["snippet"])

def stream_events(payload: dict):
    with requests.post(f"{API_URL}/chat/stream", json=payload, stream=True, timeout=180) as r:
        r.raise_for_status()
        for line in r.iter_lines(decode_unicode=True):
            if line and line.startswith("data: "):
                yield json.loads(line[6:])

def render_meta(sources: list[dict], latency: float | None = None) -> None:
    render_sources(sources)

for m in st.session_state.messages:
    with st.chat_message(m["role"]):
        st.markdown(m["content"])
        render_meta(m.get("sources", []), m.get("latency"))

if question := st.chat_input("Tanya tentang K3 peledakan..."):
    history = [{"role": m["role"], "content": m["content"]} for m in st.session_state.messages]
    st.session_state.messages.append({"role": "user", "content": question})
    with st.chat_message("user"):
        st.markdown(question)

    with st.chat_message("assistant"):
        box, text, sources = st.empty(), "", []
        t0 = time.perf_counter()
        latency = None
        try:
            for ev in stream_events({"question": question, "history": history, "doc_type": doc_type}):
                if ev["type"] == "meta" and ev.get("notice"):
                    text = ev["notice"] + "\n\n"
                elif ev["type"] == "token":
                    text += ev["content"]
                    box.markdown(text + "▌")
                elif ev["type"] == "sources":
                    sources = ev["sources"]
                elif ev["type"] == "done":
                    latency = time.perf_counter() - t0
                elif ev["type"] == "error":
                    st.error(f"Terjadi kesalahan: {ev['message']}")
        except requests.RequestException as exc:
            st.error(f"Backend tidak dapat dihubungi ({API_URL}): {exc}")
        if latency is None and text:
            latency = time.perf_counter() - t0
        box.markdown(text)
        render_meta(sources, latency)
    st.session_state.messages.append({"role": "assistant", "content": text, "sources": sources, "latency": latency})
