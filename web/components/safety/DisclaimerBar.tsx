"use client";

import React from "react";

interface DisclaimerBarProps {
  disclaimer?: string;
}

export function DisclaimerBar({ disclaimer }: DisclaimerBarProps) {
  const text =
    disclaimer ||
    "Alat bantu teknis. Selalu verifikasi keputusan ke dokumen resmi & arahan Pengawas/KTT.";

  return (
    <div className="w-full pb-2 px-4 text-center">
      <p className="text-[11px] text-muted-foreground/75 select-none">
        {text}
      </p>
    </div>
  );
}
