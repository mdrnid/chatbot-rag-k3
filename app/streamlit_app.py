    """Frontend Streamlit. Jalankan: streamlit run app/streamlit_app.py"""
    import json
    import os
    
    import requests
    import streamlit as st
    from dotenv import load_dotenv
    
    load_dotenv()
    API_URL = os.getenv("API_URL", "http://localhost:8000")
    DISCLAIMER = "Chatbot ini alat bantu, bukan pengganti SOP resmi perusahaan, regulasi, maupun arahan Pengawas/KTT."
    
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
                st.markdown(f"{mark} **[{s['id']}]** {s['label']}  \n_skor: {s['score']}_")
                st.caption(s["snippet"])
    
    def stream_events(payload: dict):
        with requests.post(f"{API_URL}/chat/stream", json=payload, stream=True, timeout=180) as r:
            r.raise_for_status()
            for line in r.iter_lines(decode_unicode=True):
                if line and line.startswith("data: "):
                    yield json.loads(line[6:])
    
    for m in st.session_state.messages:
        with st.chat_message(m["role"]):
            st.markdown(m["content"])
            render_sources(m.get("sources", []))
    
    if question := st.chat_input("Tanya tentang K3 peledakan..."):
        history = [{"role": m["role"], "content": m["content"]} for m in st.session_state.messages]
        st.session_state.messages.append({"role": "user", "content": question})
        with st.chat_message("user"):
            st.markdown(question)
    
        with st.chat_message("assistant"):
            box, text, sources = st.empty(), "", []
            try:
                for ev in stream_events({"question": question, "history": history, "doc_type": doc_type}):
                    if ev["type"] == "meta" and ev.get("notice"):
                        text = ev["notice"] + "\n\n"
                    elif ev["type"] == "token":
                        text += ev["content"]
                        box.markdown(text + "▌")
                    elif ev["type"] == "sources":
                        sources = ev["sources"]
                    elif ev["type"] == "error":
                        st.error(f"Terjadi kesalahan: {ev['message']}")
            except requests.RequestException as exc:
                st.error(f"Backend tidak dapat dihubungi ({API_URL}): {exc}")
            box.markdown(text)
            render_sources(sources)
        st.session_state.messages.append({"role": "assistant", "content": text, "sources": sources})
