"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

interface DisclaimerBarProps {
  disclaimer?: string;
}

export function DisclaimerBar({ disclaimer }: DisclaimerBarProps) {
  const text =
    disclaimer ||
    "Chatbot ini alat bantu, bukan pengganti SOP resmi perusahaan, regulasi, maupun arahan Pengawas/KTT.";

  return (
    <footer className="w-full border-t border-border bg-card/95 py-2 px-4 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 text-center text-xs font-medium text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-amber-500" />
        <p>{text}</p>
      </div>
    </footer>
  );
}
