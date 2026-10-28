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

  // Case 3: Valid Citation
  const scorePercent = Math.round(source.score * 100);

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
        className="mx-0.5 inline-flex min-h-0 items-center gap-0.5 rounded border border-amber-500/50 bg-amber-500/15 px-1.5 py-0.5 text-xs font-bold text-amber-900 transition-all hover:bg-amber-500 hover:text-black dark:text-amber-300 dark:hover:text-black focus:outline-none focus:ring-2 focus:ring-amber-500"
        aria-label={`Buka rujukan sumber ${source.id}: ${source.label}`}
      >
        <FileText className="h-3 w-3" />
        <span>[{source.id}]</span>
      </button>

      {/* Popover on hover/focus */}
      {isOpen && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-between border-b border-border pb-1.5">
            <span className="font-bold text-xs text-primary">
              Rujukan [{source.id}]
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              Relevansi: {scorePercent}%
            </span>
          </div>

          <p className="mt-1.5 font-semibold text-xs text-foreground line-clamp-2">
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
            className="mt-2.5 flex w-full min-h-[36px] items-center justify-center gap-1.5 rounded bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
          >
            <span>Buka Dokumen Lengkap</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </span>
  );
}
