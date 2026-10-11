from src.ingestion.chunk import chunk_regulation, chunk_sop

REG = [
    (1, "BAB I"),
    (1, "KETENTUAN UMUM"),
    (1, "Pasal 1"),
    (1, "Dalam peraturan ini yang dimaksud dengan:"),
    (1, "1. Bahan peledak adalah bahan yang dapat meledak."),
    (2, "Pasal 2"),
    (2, "Juru ledak wajib memiliki KIM sebagaimana dimaksud dalam"),
    (2, "Pasal 1 angka 1."),
    (2, "BAB II"),
    (3, "PENYIMPANAN"),
    (3, "Bagian Kesatu"),
    (3, "Gudang"),
    (3, "Pasal 3"),
    (3, "Gudang bahan peledak harus dikunci."),
    (4, "Lanjutan Pasal 3 di halaman berikutnya."),
]

def test_regulation_split_per_pasal():
    chunks = chunk_regulation(REG)
    assert [c.pasal for c in chunks] == ["1", "2", "3"]
    assert chunks[0].bab == "BAB I KETENTUAN UMUM"
    assert chunks[2].bab == "BAB II PENYIMPANAN"
    assert chunks[2].bagian == "Bagian Kesatu Gudang"
    assert (chunks[2].page_start, chunks[2].page_end) == (3, 4)

def test_inline_pasal_reference_is_not_split():
    # "Pasal 1 angka 1." bukan heading karena tidak berdiri sendiri
    chunks = chunk_regulation(REG)
    assert "Pasal 1 angka 1." in chunks[1].text

def test_repeated_lampiran_header_does_not_split():
    lines = [(1, "LAMPIRAN III"), (1, "teks a"), (2, "LAMPIRAN III"), (2, "teks b")]
    chunks = chunk_regulation(lines)
    assert len(chunks) == 1
    assert chunks[0].lampiran == "Lampiran III"
    assert (chunks[0].page_start, chunks[0].page_end) == (1, 2)

def test_long_pasal_split_with_overlap_and_context():
    lines = [(1, "BAB III PELEDAKAN"), (1, "Pasal 9")] + [(1 + i // 10, f"Kalimat ke-{i} tentang peledakan.") for i in range(60)]
    chunks = chunk_regulation(lines, max_chars=300, overlap=60)
    assert len(chunks) > 1
    assert all(c.pasal == "9" and c.bab == "BAB III PELEDAKAN" for c in chunks)
    assert all(len(c.text) <= 300 for c in chunks)
    assert chunks[0].text.splitlines()[-1] == chunks[1].text.splitlines()[0]  # overlap

def test_sop_sections():
    lines = [
        (None, "# SOP Misfire"),
        (None, "## 1. Tujuan"),
        (None, "Mencegah ledakan tak terduga."),
        (None, "## 6. Prosedur"),
        (None, "### Langkah 1 – Identifikasi"),
        (None, "Periksa lubang."),
        (None, "### Langkah 2 – Waktu tunggu"),
        (None, "Dilarang mendekat."),
    ]
    chunks = chunk_sop(lines)
    assert [c.section for c in chunks] == [
        "1. Tujuan",
        "6. Prosedur > Langkah 1 – Identifikasi",
        "6. Prosedur > Langkah 2 – Waktu tunggu",
    ]
    assert all(c.page_start is None for c in chunks)
