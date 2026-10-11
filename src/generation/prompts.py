"""Prompt, format konteks, dan label sitasi."""
from __future__ import annotations

from src.retrieval.schema import RetrievedChunk

SYSTEM_PROMPT = """Anda adalah Asisten K3 Peledakan untuk Pengawas di tambang terbuka batubara.
Aturan wajib:
1. Jawab HANYA berdasarkan KONTEKS yang diberikan. Jangan memakai pengetahuan di luar konteks.
2. Setiap poin/kalimat fakta WAJIB diberi sitasi ID sumber, contoh: [S1] atau [S2][S3].
3. Jika konteks tidak memuat jawabannya, jawab: "Informasi tersebut tidak ditemukan di dokumen yang tersedia. Silakan hubungi Pengawas/KTT." Jangan menebak.
4. Jika sumber berstatus DICABUT, sebutkan bahwa regulasi tersebut sudah dicabut beserta penggantinya bila tercantum.
5. Untuk kondisi darurat, utamakan instruksi menghentikan pekerjaan, mengamankan area, dan menghubungi tim tanggap darurat.
6. Jawab dalam Bahasa Indonesia yang singkat dan jelas; gunakan daftar bernomor untuk langkah kerja."""

CONDENSE_SYSTEM = (
    "Tulis ulang pertanyaan lanjutan menjadi pertanyaan mandiri yang lengkap dalam Bahasa Indonesia "
    "berdasarkan riwayat percakapan. Jangan menjawab. Keluarkan HANYA pertanyaan hasil tulis ulang."
)
CONDENSE_USER = "Riwayat percakapan:\n{history}\n\nPertanyaan lanjutan: {question}\n\nPertanyaan mandiri:"

CITATION_RETRY = (
    "Jawaban Anda belum menyertakan sitasi. Tulis ulang jawaban yang sama dengan sitasi [S#] "
    "di setiap poin, hanya berdasarkan konteks."
)
REFUSAL_MESSAGE = (
    "Informasi tersebut tidak ditemukan di dokumen yang tersedia. "
    "Silakan hubungi Pengawas/KTT atau rujuk SOP resmi perusahaan."
)
NO_CITATION_WARNING = "\n\n⚠️ _Jawaban ini tidak menyertakan sitasi yang valid. Jangan dijadikan acuan; verifikasi ke dokumen sumber._"
DISCLAIMER = (
    "Chatbot ini alat bantu, bukan pengganti SOP resmi perusahaan, regulasi, maupun arahan Pengawas/KTT."
)

def source_label(meta: dict) -> str:
    parts = [meta.get("doc_title", "Dokumen")]
    parts += [meta[k] for k in ("lampiran", "bab", "bagian") if meta.get(k)]
    if meta.get("pasal"):
        parts.append(f"Pasal {meta['pasal']}")
    if meta.get("section"):
        parts.append(meta["section"])
    start, end = meta.get("page_start"), meta.get("page_end")
    if start:
        parts.append(f"hal. {start}" if not end or end == start else f"hal. {start}–{end}")
    label = ", ".join(str(p) for p in parts)
    if meta.get("status") == "dicabut":
        label += f" (DICABUT, diganti {meta.get('replaced_by', '-')})"
    return label

def format_context(chunks: list[RetrievedChunk]) -> str:
    blocks = []
    for i, c in enumerate(chunks, 1):
        header = "[S" + str(i) + "] (" + source_label(c.metadata) + ")"
        blocks.append(header + "\n" + c.text)
    return "\n\n".join(blocks)

def build_user_prompt(question: str, chunks: list[RetrievedChunk]) -> str:
    return f"KONTEKS:\n{format_context(chunks)}\n\nPERTANYAAN: {question}"
