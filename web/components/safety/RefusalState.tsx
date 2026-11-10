"use client";

import React from "react";
import { FileQuestion } from "lucide-react";

interface RefusalStateProps {
  message?: string;
}

export function RefusalState({ message }: RefusalStateProps) {
  return (
    <div className="my-2 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
          <FileQuestion className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-foreground">Informasi Tidak Ditemukan dalam Dokumen</h4>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {message ||
              "Informasi yang Anda tanyakan tidak tercantum dalam korpus dokumen regulasi maupun SOP K3 Peledakan yang tersedia."}
          </p>
        </div>
      </div>
    </div>
  );
}
