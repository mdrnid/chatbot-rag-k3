"use client";

import React, { useState } from "react";
import { AlertOctagon, PhoneCall, Copy, Check } from "lucide-react";

interface EmergencyBannerProps {
  notice?: string | null;
  contact?: {
    name: string;
    phone: string;
  };
}

export function EmergencyBanner({ notice, contact }: EmergencyBannerProps) {
  const [copied, setCopied] = useState(false);

  const phone = contact?.phone || "112";
  const name = contact?.name || "Tim ERT";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-30 mb-4 flex flex-col gap-3 rounded-lg border-2 border-red-700 bg-red-600 p-4 text-white shadow-xl dark:bg-red-700"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-800 text-white">
          <AlertOctagon className="h-6 w-6 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-white/20 px-2 py-0.5 text-xs font-black uppercase tracking-wider">
              Protokol Darurat K3
            </span>
            <span className="text-xs font-semibold text-red-100">Wajib Ditaati</span>
          </div>
          <p className="mt-1 font-bold text-white leading-relaxed sm:text-lg">
            {notice || "KEADAAN DARURAT TERDETEKSI: Utamakan keselamatan jiwa. Hentikan seluruh aktivitas peledakan!"}
          </p>
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-red-500/60 pt-3">
        <span className="text-xs font-medium text-red-100">
          Kontak Darurat ({name}):
        </span>
        <a
          href={`tel:${phone}`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-white px-4 py-2 font-bold text-red-700 shadow hover:bg-red-50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <PhoneCall className="h-5 w-5" />
          <span>Hubungi Langsung ({phone})</span>
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-red-800/80 px-3 py-2 text-sm font-semibold text-white hover:bg-red-900 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span>{copied ? "Nomor Tersalin!" : "Salin Nomor"}</span>
        </button>
      </div>
    </div>
  );
}
