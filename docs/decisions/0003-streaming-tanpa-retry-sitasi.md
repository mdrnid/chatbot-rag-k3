# ADR-0003: Streaming tanpa retry sitasi

- **Status:** Diterima sementara; perlu ditinjau

## Konteks
`answer()` me-retry sekali bila jawaban tanpa sitasi. Pada `stream()`, token sudah terkirim ke pengguna sehingga jawaban tidak bisa ditarik kembali.

## Keputusan
Stream mengirim token langsung. Jika sitasi tidak valid, kirim `NO_CITATION_WARNING` sebagai token tambahan dan `citation_ok: false` di event `sources`.

## Konsekuensi
- Pengguna bisa melihat jawaban tanpa sitasi beserta peringatan.
- Alternatif yang belum diputuskan: buffer jawaban, cek sitasi (dan retry), lalu kirim. Ini menambah latensi. Jangan diterapkan tanpa persetujuan; jika disetujui, ubah ADR ini dan kontrak SSE.
