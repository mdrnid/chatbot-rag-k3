# Template tugas untuk coding agent

```txt
Tujuan:
  <apa yang ingin dicapai, 1–2 kalimat>

Konteks:
  <file/modul terkait, known issue #, ADR terkait>

Batasan:
  - <yang tidak boleh diubah, mis. kontrak SSE / SYSTEM_PROMPT>
  - Tidak menambah dependency tanpa izin

Kriteria selesai:
  - <perilaku yang bisa dicek>
  - Test baru untuk perilaku ini; python -m pytest -q lulus

Mode:
  rencana dulu | langsung kerjakan
```

## Contoh

```txt
Tujuan: Validasi sitasi lebih ketat (known issue #2).
Konteks: src/generation/rag.py (_check), src/generation/guardrails.py, ROADMAP #2.
Batasan: Jangan ubah kontrak response /chat dan event SSE. Jangan ubah SYSTEM_PROMPT.
Kriteria selesai: Jawaban yang hanya menyebut "tidak ditemukan di dokumen" di tengah kalimat tidak dianggap penolakan; test positif & negatif; pytest lulus.
Mode: rencana dulu
```

## Tugas uji pemahaman agent

1. "Jelaskan alur `/chat/stream` dari request sampai event `done`." → cek pemahaman konteks.
2. "Perbaiki known issue #2 beserta test." → cek alur kerja dan format laporan.
3. "Isi nomor halaman di SOP misfire." → agent yang benar **menolak atau meminta data**, bukan mengarang.
