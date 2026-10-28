"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConversationStore } from "@/stores/conversation";
import { useChatStream } from "@/hooks/useChatStream";
import { Sidebar } from "@/components/layout/Sidebar";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { SourcePanel } from "@/components/sources/SourcePanel";
import { DisclaimerBar } from "@/components/safety/DisclaimerBar";
import { ConfigResponse, HealthResponse } from "@/lib/api/schemas";
import { Menu, BookMarked, HardHat } from "lucide-react";

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const {
    conversations,
    activeConversationId,
    createConversation,
    openSourcePanel,
    getActiveConversation,
  } = useConversationStore();

  const { isStreaming, sendMessage, stopGeneration, regenerateLastResponse } =
    useChatStream();

  // Query Backend Config
  const { data: config } = useQuery<ConfigResponse>({
    queryKey: ["config"],
    queryFn: async () => {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Gagal memuat konfigurasi");
      return res.json();
    },
  });

  // Query Backend Health
  const { data: health } = useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("Backend offline");
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Ensure an active conversation exists on initial load
  useEffect(() => {
    if (conversations.length === 0 && !activeConversationId) {
      createConversation();
    }
  }, [conversations.length, activeConversationId, createConversation]);

  // Handle theme toggle
  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  const activeConv = getActiveConversation();
  const messages = activeConv?.messages || [];

  // Count citations from the latest assistant message
  const latestAssistantMsg = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.sources && m.sources.length > 0);
  const sourceCount = latestAssistantMsg?.sources?.length || 0;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        config={config}
        health={health}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top App Bar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary md:hidden"
              aria-label="Buka menu navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <HardHat className="h-5 w-5 text-primary md:hidden" />
              <h2 className="font-bold text-sm text-foreground truncate max-w-[200px] sm:max-w-md">
                {activeConv?.title || "Asisten K3 Peledakan"}
              </h2>
            </div>
          </div>

          {/* Right Action: Open Sources Panel */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openSourcePanel()}
              className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary active:scale-95 transition-colors"
              aria-label="Buka panel rujukan dokumen"
            >
              <BookMarked className="h-4 w-4 text-primary" />
              <span>Dokumen Rujukan</span>
              {sourceCount > 0 && (
                <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.2 text-[11px] font-bold text-primary">
                  {sourceCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Chat Messages View */}
        <main className="flex-1 overflow-y-auto">
          <MessageList
            messages={messages}
            onSelectPrompt={(p) => sendMessage(p)}
            onRegenerate={() => regenerateLastResponse()}
            config={{
              emergency_contact: config?.emergency_contact,
              model: health?.model || config?.model,
            }}
          />
        </main>

        {/* Input Bar Area */}
        <div className="border-t border-border bg-background/80 p-3 sm:p-4 backdrop-blur">
          <div className="mx-auto w-full max-w-3xl">
            <ChatInput
              onSendMessage={(q) => sendMessage(q)}
              onStop={stopGeneration}
              isStreaming={isStreaming}
              disabled={health?.status === "offline"}
            />
          </div>
        </div>

        {/* Mandatory Bottom Disclaimer Bar */}
        <DisclaimerBar disclaimer={config?.disclaimer} />
      </div>

      {/* Global Sources Drawer / Bottom Sheet */}
      <SourcePanel />
    </div>
  );
}
