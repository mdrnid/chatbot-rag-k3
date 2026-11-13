"""Guardrail K3: deteksi darurat, cek sitasi, deteksi penolakan.

Trade-off Deteksi Darurat K3:
Deteksi menggunakan pencocokan kata kunci kritis tambang (regex boundary).
- Prinsip K3: Mengutamakan sensitivitas (fail-safe) untuk mencegah keterlambatan penanganan insiden.
- Konsekuensi: Pertanyaan konseptual/prosedural yang memuat kata kunci seperti 'misfire', 'mangkir',
  atau 'flyrock' akan memicu notice darurat (false positive). Ini disengaja agar pekerja/pengawas di pit
  selalu diingatkan tentang batas perimeter & pengamanan sebelum membaca detail prosedur.
- Batasan: Pola ini bukan deteksi semantik sempurna dan tidak memverifikasi entailment/kebenaran faktual.
"""
from __future__ import annotations

import re

_EMERGENCY = re.compile(
    r"\b("
    r"kebakaran|terbakar|longsor|runtuh|tertimbun|gas beracun|keracunan|bocor gas|kebocoran gas|"
    r"korban|terluka|pingsan|meninggal|tewas|ledakan prematur|flyrock|batu terbang|"
    r"misfire|mangkir|gagal ledak"
    r")\b",
    re.I,
)
_CITATION = re.compile(r"\[S(\d+)\]")

def is_emergency(text: str) -> bool:
    return bool(_EMERGENCY.search(text or ""))

def emergency_notice(contact: str) -> str:
    return (
        "🚨 **KONDISI DARURAT?** Hentikan pekerjaan, amankan area dan jauhi lokasi, "
        f"lalu segera hubungi **{contact}**. Ikuti arahan Pengawas/KTT; informasi di bawah hanya pendukung."
    )

def extract_citations(answer: str) -> set[int]:
    return {int(n) for n in _CITATION.findall(answer or "")}

def is_refusal(answer: str) -> bool:
    return "tidak ditemukan di dokumen" in (answer or "").lower()
