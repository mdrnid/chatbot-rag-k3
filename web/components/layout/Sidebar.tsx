"use client";

import React from "react";
import Link from "next/link";
import { useConversationStore } from "@/stores/conversation";
import { ConfigResponse, HealthResponse } from "@/lib/api/schemas";
import {
  Plus,
  MessageSquare,
  Trash2,
  Filter,
  CheckCircle2,
  XCircle,
  HardHat,
  Moon,
  Sun,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  config?: ConfigResponse;
  health?: HealthResponse;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
  config,
  health,
  isDark,
  onToggleTheme,
}: SidebarProps) {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    createConversation,
    deleteConversation,
    docTypeFilter,
    setDocTypeFilter,
  } = useConversationStore();

  const isOnline = health?.status === "ok";
  const docTypes = config?.doc_types || ["regulasi", "sop", "ik"];

  const handleNewChat = () => {
    createConversation();
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const handleSelectConv = (id: string) => {
    setActiveConversation(id);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            title="Kembali ke Landing Page"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white font-black">
              <HardHat className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm leading-tight text-foreground">
                PT Aryagans
              </h1>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                K3 Peledakan Pit
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary md:hidden"
            aria-label="Tutup sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action: Percakapan Baru */}
        <div className="p-3">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white shadow hover:bg-emerald-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Percakapan Baru</span>
          </button>
        </div>

        {/* Filter Dokumen */}
        <div className="px-3 py-2 border-b border-border/60">
          <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-1.5">
            <Filter className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Filter Jenis Dokumen</span>
          </label>
          <select
            value={docTypeFilter || ""}
            onChange={(e) => setDocTypeFilter(e.target.value || null)}
            className="w-full min-h-[44px] rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Pilih filter jenis dokumen rujukan"
          >
            <option value="">Semua Dokumen</option>
            {docTypes.map((dt) => (
              <option key={dt} value={dt}>
                {dt === "regulasi"
                  ? "Regulasi (Kepmen ESDM)"
                  : dt === "sop"
                  ? "SOP Operasional Site"
                  : dt === "ik"
                  ? "Instruksi Kerja (IK)"
                  : dt.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Riwayat Percakapan */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Riwayat Percakapan
          </div>

          {conversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Belum ada riwayat percakapan.
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <div
                  key={conv.id}
                  className={`group flex items-center justify-between rounded-lg px-2 py-1 text-xs transition-colors ${
                    isActive
                      ? "bg-secondary font-bold text-foreground border-l-2 border-emerald-600"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectConv(conv.id)}
                    className="flex flex-1 items-center gap-2 truncate text-left min-h-[44px] px-1"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="truncate">{conv.title}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 min-h-[44px] min-w-[36px] flex items-center justify-center text-muted-foreground hover:text-red-500 transition-opacity focus:opacity-100"
                    aria-label={`Hapus percakapan: ${conv.title}`}
                    title="Hapus percakapan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Theme Toggle */}
        <div className="border-t border-border p-3 flex items-center justify-end bg-card/60">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Ubah tema"
            title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
