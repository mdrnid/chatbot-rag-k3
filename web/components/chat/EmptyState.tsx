"use client";

import React from "react";
import { HardHat, ShieldCheck, Flame, Compass, ArrowRight } from "lucide-react";

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const EXAMPLE_PROMPTS = [
  {
    title: "Radius Aman Peledakan",
    desc: "Berapa jarak aman minimum peledakan untuk manusia dan unit alat berat?",
    prompt: "Berapa jarak aman minimum peledakan untuk manusia dan alat berat menurut regulasi?",
  },
  {
    title: "Syarat & Kualifikasi Juru Ledak",
    desc: "Apa syarat kepemilikan KIM dan kompetensi juru ledak?",
    prompt: "Apa saja persyaratan juru ledak dan kewajiban memiliki KIM berdasarkan Kepmen 1827?",
  },
  {
    title: "Penanganan Misfire (Mangkir)",
    desc: "Langkah penanganan jika terjadi mangkir ledak di lokasi blasting?",
    prompt: "Bagaimana prosedur aman penanganan misfire atau lubang mangkir menurut SOP K3?",
  },
  {
    title: "Waktu Tunggu Pasca Peledakan",
    desc: "Berapa lama waktu tunggu sebelum area peledakan boleh diperiksa?",
    prompt: "Berapa lama waktu tunggu pasca peledakan sebelum juru ledak boleh memeriksa hasil peledakan?",
  },
];

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center sm:py-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 ring-4 ring-emerald-500/10 dark:text-emerald-400">
        <HardHat className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span>Panduan Pengawas & Juru Ledak • Regulasi ESDM & SOP Site</span>
      </div>

      <h2 className="mt-3 font-extrabold text-2xl text-foreground sm:text-3xl tracking-tight">
        Asisten K3 Peledakan
      </h2>

      <p className="mt-2 max-w-lg text-sm text-muted-foreground leading-relaxed sm:text-base">
        Sistem panduan keselamatan berbasis regulasi resmi (Kepmen ESDM 1827) dan SOP site. Seluruh jawaban wajib menyertakan sitasi rujukan dokumen.
      </p>

      {/* Suggested Prompts Grid */}
      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 text-left">
        {EXAMPLE_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-emerald-500/60 hover:bg-card/90 hover:shadow-sm active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[96px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  {item.title}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {item.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
