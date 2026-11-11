"use client";

import React, { useState } from "react";
import { Source } from "@/lib/api/schemas";
import { useConversationStore } from "@/stores/conversation";
import { ExternalLink, FileText, AlertCircle } from "lucide-react";

interface CitationChipProps {
  sourceId: string;
  sources?: Source[];
  sourcesLoaded?: boolean;
}

export function CitationChip({
  sourceId,
  sources = [],
  sourcesLoaded = false,
}: CitationChipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const openSourcePanel = useConversationStore((s) => s.openSourcePanel);

  const source = sources.find((s) => s.id === sourceId);
  const isPending = !sourcesLoaded && sources.length === 0;

  // Case 1: Still streaming / sources haven't arrived yet
  if (isPending) {
    return (
      <span
        title="Memuat sitasi..."
        className="mx-0.5 inline-flex items-center rounded border border-muted-foreground/20 bg-muted px-1.5 py-0.2 text-xs font-medium text-muted-foreground animate-pulse cursor-wait select-none"
      >
        [{sourceId}]
      </span>
    );
  }

  // Case 2: Sources arrived, but this ID is not in sources (Invalid citation)
  if (!source) {
    return (
      <span
        title={`Sitasi ${sourceId} tidak ditemukan dalam basis dokumen`}
        className="mx-0.5 inline-flex items-center gap-1 rounded border border-amber-400 bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:border-amber-600 dark:text-amber-200"
      >
        <AlertCircle className="h-3 w-3 shrink-0 text-amber-600" />
        [{sourceId} Tidak Valid]
      </span>
    );
  }

  // Case 3: Valid Citation (Emerald 600 K3)
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={() => openSourcePanel(source.id)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="mx-0.5 inline-flex min-h-[26px] items-center gap-1 rounded border border-emerald-500/40 bg-emerald-50/90 px-2 py-0.5 text-xs font-bold text-emerald-800 transition-all hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/60 dark:border-emerald-700/60 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-label={`Buka rujukan sumber ${source.id}: ${source.label}`}
      >
        <FileText className="h-3 w-3" />
        <span>[{source.id}]</span>
      </button>

      {/* Popover on hover/focus */}
      {isOpen && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-lg border border-border bg-popover p-3.5 text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-between border-b border-border pb-1.5">
            <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
              Rujukan [{source.id}]
            </span>
          </div>

          <p className="mt-2 font-semibold text-xs text-foreground line-clamp-2">
            {source.label}
          </p>

          <p className="mt-1 text-xs text-muted-foreground line-clamp-3 italic">
            "{source.snippet}"
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openSourcePanel(source.id);
              setIsOpen(false);
            }}
            className="mt-3 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground hover:bg-emerald-600 hover:text-white transition-colors"
          >
            <span>Buka Dokumen Lengkap</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </span>
  );
}
