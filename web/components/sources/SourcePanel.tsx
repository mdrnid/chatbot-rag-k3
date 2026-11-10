"use client";

import React, { useEffect, useRef } from "react";
import { useConversationStore } from "@/stores/conversation";
import { SourceCard } from "./SourceCard";
import { X, BookMarked, ExternalLink } from "lucide-react";

export function SourcePanel() {
  const {
    isSourcePanelOpen,
    closeSourcePanel,
    selectedSourceId,
    getActiveConversation,
  } = useConversationStore();

  const panelRef = useRef<HTMLDivElement>(null);
  const activeConversation = getActiveConversation();

  // Find all sources from the latest assistant message or messages in the conversation
  const messages = activeConversation?.messages || [];
  const latestAssistantMsgWithSources = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.sources && m.sources.length > 0);

  const sources = latestAssistantMsgWithSources?.sources || [];

  // Auto scroll to highlighted source card
  useEffect(() => {
    if (isSourcePanelOpen && selectedSourceId) {
      const el = document.getElementById(`source-${selectedSourceId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [isSourcePanelOpen, selectedSourceId]);

  if (!isSourcePanelOpen) return null;

  const citedCount = sources.filter((s) => s.cited).length;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeSourcePanel}
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer / Bottom sheet container */}
      <section
        role="dialog"
        aria-label="Panel Rujukan Dokumen"
        ref={panelRef}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-border bg-card shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-full sm:w-[480px] sm:rounded-none sm:border-l sm:border-t-0 animate-in slide-in-from-bottom-5 sm:slide-in-from-right-5"
      >
        {/* Panel Header */}
        <header className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-base text-foreground">
              Dokumen Rujukan ({sources.length})
            </h3>
            {citedCount > 0 && (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {citedCount} dikutip
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={closeSourcePanel}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Tutup panel dokumen"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <BookMarked className="h-12 w-12 stroke-[1.5] text-muted-foreground/60" />
              <p className="mt-3 font-semibold text-sm">Belum ada dokumen rujukan</p>
              <p className="mt-1 text-xs">
                Dokumen rujukan akan muncul saat asisten memberikan jawaban dengan sitasi.
              </p>
            </div>
          ) : (
            sources
              .sort((a, b) => (b.cited ? 1 : 0) - (a.cited ? 1 : 0))
              .map((source) => (
                <SourceCard
                  key={source.id}
                  source={source}
                  isHighlighted={source.id === selectedSourceId}
                />
              ))
          )}
        </div>
      </section>
    </>
  );
}
