    from src.ingestion.clean import clean_pages, fix_hyphenation, is_page_number
    from src.ingestion.parse import Page
    
    WORDS = ["gudang", "juru ledak", "detonator", "radius aman", "misfire", "blokade"]
    
    def test_page_number_detection():
        assert is_page_number("12")
        assert is_page_number("- 12 -")
        assert is_page_number("Halaman 3 dari 10")
        assert not is_page_number("12. Juru ledak wajib memiliki KIM")
    
    def test_hyphenation():
        assert fix_hyphenation("bahan pele-\ndak") == "bahan peledak"
    
    def test_header_footer_and_page_numbers_removed():
        pages = [
            Page(i, f"KEPUTUSAN MENTERI ESDM\nPembahasan {w} bagian awal.\nUraian {w} lanjutan.\nPenutup {w}.\n{i}")
            for i, w in enumerate(WORDS, 1)
        ]
        texts = [t for _, t in clean_pages(pages)]
        assert "KEPUTUSAN MENTERI ESDM" not in texts
        assert not any(t.isdigit() for t in texts)
        assert "Uraian misfire lanjutan." in texts
    
    def test_structural_header_kept():
        pages = [Page(i, f"LAMPIRAN III\nIsi {w} satu.\nIsi {w} dua.\nIsi {w} tiga.") for i, w in enumerate(WORDS, 1)]
        texts = [t for _, t in clean_pages(pages)]
        assert texts.count("LAMPIRAN III") == len(WORDS)
    
    def test_page_numbers_tracked():
        lines = clean_pages([Page(7, "Baris A"), Page(8, "Baris B")])
        assert lines == [(7, "Baris A"), (8, "Baris B")]
