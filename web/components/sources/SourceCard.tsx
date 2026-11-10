"use client";

import React from "react";
import { Source } from "@/lib/api/schemas";
import { CheckCircle2, AlertTriangle, BookOpen } from "lucide-react";

interface SourceCardProps {
  source: Source;
  isHighlighted?: boolean;
}

export function SourceCard({ source, isHighlighted = false }: SourceCardProps) {
  const isRevoked =
    source.metadata?.status === "dicabut" ||
    Boolean(source.metadata?.replaced_by);
  const replacedBy = (source.metadata?.replaced_by as string) || "Dokumen Pengganti Terkait";

  const scorePercent = Math.min(Math.round(source.score * 100), 100);

  return (
    <article
      id={`source-${source.id}`}
      className={`rounded-xl border p-4 transition-all ${
        isHighlighted
          ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500/40"
          : "border-border bg-card hover:border-muted-foreground/40"
      }`}
    >
      {/* Header: ID, Badge Dikutip, Revoked Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary font-black text-xs text-foreground">
            {source.id}
          </span>
          <span className="font-bold text-sm text-foreground">
            {source.metadata?.doc_type ? String(source.metadata.doc_type).toUpperCase() : "DOKUMEN"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {source.cited && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Dikutip</span>
            </span>
          )}

          {/* WARNA MERAH KHUSUS DICABUT SESUAI ATURAN KESELAMATAN */}
          {isRevoked && (
            <span
              role="alert"
              className="inline-flex items-center gap-1 rounded-md border border-rose-600 bg-rose-600 px-2 py-0.5 text-xs font-black text-white shadow-sm dark:bg-rose-700"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-white" />
              <span>DICABUT → Digantikan oleh {replacedBy}</span>
            </span>
          )}
        </div>
      </div>

      {/* Label Dokumen */}
      <div className="mt-3 flex items-start gap-2">
        <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <h4 className="font-semibold text-sm text-foreground leading-snug">
          {source.label}
        </h4>
      </div>

      {/* Relevansi Progress Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Skor Relevansi</span>
          <span className="font-bold text-foreground">{scorePercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      {/* Snippet Teks Rujukan */}
      <div className="mt-3 rounded-md bg-muted/60 p-3 text-xs leading-relaxed text-foreground/90 font-mono">
        <p className="whitespace-pre-wrap">{source.snippet}</p>
      </div>

      {/* Detail Metadata jika ada */}
      {source.metadata && (
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          {Boolean(source.metadata.tahun) && (
            <span>Tahun: {String(source.metadata.tahun)}</span>
          )}
          {Boolean(source.metadata.page_start) && (
            <span>Halaman: {String(source.metadata.page_start)}</span>
          )}
          {Boolean(source.metadata.pasal) && (
            <span>Pasal: {String(source.metadata.pasal)}</span>
          )}
        </div>
      )}
    </article>
  );
}
