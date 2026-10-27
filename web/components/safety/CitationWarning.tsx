"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

export function CitationWarning() {
  return (
    <div
      role="status"
      className="mt-3 flex items-start gap-3 rounded-lg border-2 border-amber-500 bg-amber-500/15 p-3 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
      <div className="text-sm">
        <p className="font-bold tracking-tight">Peringatan: Verifikasi Sitasi Tidak Lengkap</p>
        <p className="mt-0.5 leading-relaxed opacity-90">
          Jawaban di atas mungkin tidak sepenuhnya didukung oleh dokumen resmi yang tersedia atau belum menyertakan sitasi rujukan secara lengkap. Harap verifikasi langsung ke dokumen fisik SOP/Regulasi sebelum mengambil keputusan teknis di lapangan.
        </p>
      </div>
    </div>
  );
}
