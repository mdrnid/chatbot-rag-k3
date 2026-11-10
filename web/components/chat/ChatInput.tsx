"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Square, CornerDownLeft } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  onStop,
  isStreaming,
  disabled = false,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isStreaming]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isStreaming) {
      onStop();
      return;
    }

    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex w-full items-end gap-2 rounded-2xl border-2 border-border bg-card p-2 shadow-lg transition-colors focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Tanyakan prosedur, regulasi, atau SOP K3 peledakan... (Enter untuk kirim)"
        className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
        aria-label="Input pertanyaan K3 peledakan"
      />

      {isStreaming ? (
        <button
          type="button"
          onClick={onStop}
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground hover:bg-muted active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Hentikan pembuatan jawaban"
          title="Hentikan jawaban"
        >
          <Square className="h-5 w-5 fill-current" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Kirim pertanyaan"
          title="Kirim (Enter)"
        >
          <Send className="h-5 w-5" />
        </button>
      )}
    </form>
  );
}
