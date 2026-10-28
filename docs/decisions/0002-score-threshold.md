# ADR-0002: Ambang skor retrieval dan penolakan tanpa LLM

- **Status:** Diterima; nilai **belum dikalibrasi**

## Konteks
Di domain K3, jawaban yang dikarang lebih berbahaya daripada penolakan.

## Keputusan
- Hit dengan skor < `SCORE_THRESHOLD` dibuang. Jika tidak ada yang tersisa, sistem mengembalikan `REFUSAL_MESSAGE` **tanpa memanggil LLM**.
- Nilai awal 0.78, diatur lewat `.env`.

## Konsekuensi
- Threshold terlalu tinggi → banyak penolakan; terlalu rendah → konteks tidak relevan masuk ke LLM.
- Nilai hanya diubah lewat prosedur `docs/EVAL.md`.

## Riwayat kalibrasi
| Tanggal | Nilai | Data | Alasan |
| --- | --- | --- | --- |
| — | 0.78 | belum ada | nilai awal |
