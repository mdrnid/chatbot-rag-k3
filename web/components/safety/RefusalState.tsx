"use client";

import React from "react";
import { FileQuestion, ShieldAlert } from "lucide-react";

interface RefusalStateProps {
  message?: string;
}

export function RefusalState({ message }: RefusalStateProps) {
  return (
    <div className="my-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
          <FileQuestion className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">Informasi Tidak Ditemukan dalam Dokumen</h4>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {message ||
              "Maaf, informasi yang Anda tanyakan tidak ditemukan dalam basis dokumen regulasi maupun SOP K3 Peledakan yang tersedia saat ini."}
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Sesuai standar keselamatan K3 peledakan, asisten ini tidak boleh berspekulasi tanpa dasar hukum atau rujukan dokumen teknis resmi.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
