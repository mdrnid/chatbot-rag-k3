"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { ChatMessage, useConversationStore } from "@/stores/conversation";
import { CitationChip } from "./CitationChip";
import { EmergencyBanner } from "@/components/safety/EmergencyBanner";
import { CitationWarning } from "@/components/safety/CitationWarning";
import { RefusalState } from "@/components/safety/RefusalState";
import { parseCitations } from "@/lib/citations";
import { MessageLoading } from "@/components/ui/message-loading";
import {
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Terminal,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
  isLatest: boolean;
  onRegenerate?: () => void;
  config?: {
    emergency_contact?: { name: string; phone: string };
    model?: string;
  };
}

export function MessageBubble({
  message,
  isLatest,
  onRegenerate,
  config,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState<"up" | "down" | undefined>(message.rating);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const updateMessage = useConversationStore((s) => s.updateMessage);
  const activeConversationId = useConversationStore((s) => s.activeConversationId);

  const isUser = message.role === "user";
  const sourcesLoaded = message.status === "completed" || Boolean(message.sources?.length);
  const isDebugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";

  // Check if answer is a refusal message
  const isRefusal =
    !isUser &&
    (Boolean(message.is_refusal) ||
      message.content.includes("Informasi tersebut tidak ditemukan") ||
      message.content.includes("Maaf, informasi tersebut tidak ditemukan") ||
      message.content.includes("tidak ada dalam basis dokumen") ||
      (message.status === "completed" && message.sources && message.sources.length === 0));

  const handleCopy = async () => {
    try {
      let copyText = message.content;
      if (message.sources && message.sources.length > 0) {
        copyText += "\n\n--- Rujukan Dokumen K3 ---\n";
        message.sources.forEach((s) => {
          copyText += `[${s.id}] ${s.label}\n`;
        });
      }
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleFeedback = async (vote: "up" | "down") => {
    if (!message.request_id || isSubmittingFeedback) return;
    setIsSubmittingFeedback(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: message.request_id,
          rating: vote,
        }),
      });
      setRating(vote);
      if (activeConversationId) {
        updateMessage(activeConversationId, message.id, { rating: vote });
      }
    } catch (err) {
      console.error("Gagal mengirim feedback:", err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Helper to render text with CitationChips
  const renderTextWithCitations = (children: React.ReactNode): React.ReactNode => {
    if (typeof children === "string") {
      const segments = parseCitations(children, message.sources, sourcesLoaded);
      if (segments.length <= 1 && segments[0]?.type === "text") {
        return children;
      }
      return segments.map((seg, idx) => {
        if (seg.type === "text") {
          return <React.Fragment key={idx}>{seg.text}</React.Fragment>;
        }
        return (
          <CitationChip
            key={idx}
            sourceId={seg.sourceId}
            sources={message.sources}
            sourcesLoaded={sourcesLoaded}
          />
        );
      });
    }

    if (Array.isArray(children)) {
      return children.map((c, i) => (
        <React.Fragment key={i}>{renderTextWithCitations(c)}</React.Fragment>
      ));
    }

    return children;
  };

  if (isUser) {
    return (
      <div className="flex w-full justify-end my-3">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-emerald-600 px-4 py-3 text-white font-medium shadow-sm leading-relaxed dark:bg-emerald-700">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col my-4">
      {/* 1. Emergency Banner (sticky & non-dismissible) if emergency notice is active */}
      {Boolean(message.emergency || message.notice) && (
        <EmergencyBanner
          notice={message.notice}
          contact={config?.emergency_contact}
        />
      )}

      {/* 2. Message Body */}
      <div className="relative rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
        {isRefusal ? (
          <RefusalState message={message.content} />
        ) : !message.content && message.status === "streaming" ? (
          <div className="flex items-center gap-2.5 py-1 text-muted-foreground">
            <MessageLoading className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium">Memeriksa rujukan regulasi...</span>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={{
                p: ({ children }) => <p className="mb-3 last:mb-0">{renderTextWithCitations(children)}</p>,
                li: ({ children }) => <li className="mb-1">{renderTextWithCitations(children)}</li>,
                h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{renderTextWithCitations(children)}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{renderTextWithCitations(children)}</h2>,
                h3: ({ children }) => <h3 className="text-base font-bold mb-1.5">{renderTextWithCitations(children)}</h3>,
                strong: ({ children }) => <strong className="font-bold">{renderTextWithCitations(children)}</strong>,
              }}
            >
              {message.content}
            </ReactMarkdown>

            {message.status === "streaming" && (
              <span className="inline-block h-4 w-2 animate-pulse bg-emerald-600 dark:bg-emerald-400 ml-1 rounded-sm" />
            )}
          </div>
        )}

        {/* 4. Citation Warning Callout if citation_ok is false */}
        {message.citation_ok === false && message.status === "completed" && (
          <CitationWarning />
        )}

        {/* 5. Error banner if status is error */}
        {message.status === "error" && message.error && (
          <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3.5 text-xs text-foreground">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Gangguan Pengambilan Jawaban ({message.error.code || "ERROR"})</p>
              <p className="mt-0.5 text-muted-foreground">{message.error.message}</p>
              {onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="mt-2.5 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700 active:scale-95 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Coba Lagi</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 6. Action Toolbar with touch target >= 44px */}
        {message.status !== "streaming" && message.content && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95 transition-colors"
                title="Salin jawaban beserta sitasi"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Tersalin" : "Salin"}</span>
              </button>

              {isLatest && onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95 transition-colors"
                  title="Buat ulang jawaban"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Regenerate</span>
                </button>
              )}
            </div>

            {/* Feedback 👍 / 👎 with touch target >= 44px */}
            {message.request_id && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleFeedback("up")}
                  disabled={isSubmittingFeedback || rating === "up"}
                  className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-xs transition-colors ${
                    rating === "up"
                      ? "bg-emerald-600 text-white font-bold dark:bg-emerald-600"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  aria-label="Jawaban akurat"
                  title="Bagus / Akurat"
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback("down")}
                  disabled={isSubmittingFeedback || rating === "down"}
                  className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-xs transition-colors ${
                    rating === "down"
                      ? "bg-secondary text-foreground font-bold"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  aria-label="Jawaban kurang akurat"
                  title="Kurang akurat"
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 7. Debug info footer if NEXT_PUBLIC_DEBUG_MODE is enabled */}
        {isDebugMode && (message.request_id || message.latency_ms || message.ttft_ms) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded bg-muted/80 p-2 font-mono text-[11px] text-muted-foreground border border-border">
            <span className="flex items-center gap-1 font-bold text-foreground">
              <Terminal className="h-3 w-3" /> DEBUG:
            </span>
            {message.request_id && <span>ID: {message.request_id.slice(0, 8)}...</span>}
            {message.latency_ms !== undefined && <span>Latensi: {message.latency_ms}ms</span>}
            {message.ttft_ms !== undefined && <span>TTFT: {message.ttft_ms}ms</span>}
            {config?.model && <span>Model: {config.model}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
