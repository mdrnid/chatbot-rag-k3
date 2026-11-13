"""Unit test untuk guardrail K3: deteksi darurat, cek sitasi, dan penolakan."""
import pytest
from src.generation.guardrails import (
    emergency_notice,
    extract_citations,
    is_emergency,
    is_refusal,
)

@pytest.mark.parametrize(
    "text",
    [
        "Ada kebakaran di area dekat tanggul.",
        "Terjadi longsor pada lereng penambangan.",
        "Pekerja tertimbun material batuan.",
        "Ada kebocoran gas beracun di terowongan.",
        "Korban pingsan dan terluka parah.",
        "Flyrock mengenai kendaraan operasional.",
        "Bagaimana penanganan lubang misfire?",
        "Ada lubang mangkir setelah peledakan.",
        "Terjadi gagal ledak pada baris kedua.",
    ],
)
def test_is_emergency_positive(text):
    assert is_emergency(text) is True

@pytest.mark.parametrize(
    "text",
    [
        "Berapa jarak aman peledakan untuk alat berat?",
        "Apa saja persyaratan izin juru ledak KIM?",
        "Jelaskan ketentuan buku register gudang bahan peledak.",
        "Siapa yang bertanggung jawab mengawasi pengisian ANFO?",
    ],
)
def test_is_emergency_negative(text):
    assert is_emergency(text) is False

def test_is_emergency_tradeoff_conceptual_misfire():
    """Menguji trade-off false-positive: pertanyaan konseptual tentang misfire

    tetap memicu status darurat demi prinsip kehati-hatian K3 (fail-safe).
    """
    assert is_emergency("Apa definisi misfire menurut regulasi?") is True
    assert is_emergency("Jelaskan penyebab lubang mangkir!") is True

def test_emergency_notice():
    notice = emergency_notice("Tim ERT Site")
    assert "🚨 **KONDISI DARURAT?**" in notice
    assert "Tim ERT Site" in notice

def test_extract_citations():
    text = "Berdasarkan Kepmen 1827 [S1] dan Perpol 17/2017 [S2], batas radius [S1] aman 500m."
    cites = extract_citations(text)
    assert cites == {1, 2}
    assert extract_citations("Tidak ada sitasi di sini") == set()

def test_is_refusal():
    assert is_refusal("Informasi tersebut tidak ditemukan di dokumen yang tersedia.") is True
    assert is_refusal("INFORMASI TIDAK DITEMUKAN DI DOKUMEN") is True
    assert is_refusal("Juru ledak wajib memiliki KIM [S1].") is False

