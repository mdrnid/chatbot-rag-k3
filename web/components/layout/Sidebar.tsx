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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black">
              <HardHat className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm leading-tight text-foreground">
                Asisten K3
              </h1>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Peledakan Tambang
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary md:hidden"
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
            className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-bold text-primary-foreground shadow hover:bg-amber-400 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <Plus className="h-5 w-5" />
            <span>Percakapan Baru</span>
          </button>
        </div>

        {/* Filter Dokumen */}
        <div className="px-3 py-2 border-b border-border/60">
          <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-1.5">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>Filter Jenis Dokumen</span>
          </label>
          <select
            value={docTypeFilter || ""}
            onChange={(e) => setDocTypeFilter(e.target.value || null)}
            className="w-full min-h-[40px] rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                    isActive
                      ? "bg-secondary font-bold text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectConv(conv.id)}
                    className="flex flex-1 items-center gap-2 truncate text-left min-h-[36px]"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{conv.title}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 transition-opacity focus:opacity-100"
                    aria-label={`Hapus percakapan: ${conv.title}`}
                    title="Hapus percakapan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Status Sistem & Theme Toggle */}
        <div className="border-t border-border p-3 space-y-2 bg-card/60">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="font-semibold text-foreground">
                {isOnline ? "Sistem Online" : "Backend Offline"}
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Ubah tema"
              title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <div className="text-[11px] text-muted-foreground font-mono truncate">
            Model: {health?.model || config?.model || "qwen2.5:7b"}
          </div>
        </div>
      </aside>
    </>
  );
}
