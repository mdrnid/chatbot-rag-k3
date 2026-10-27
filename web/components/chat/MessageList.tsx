"use client";

import React, { useEffect, useRef } from "react";
import { ChatMessage } from "@/stores/conversation";
import { MessageBubble } from "./MessageBubble";
import { EmptyState } from "./EmptyState";

interface MessageListProps {
  messages: ChatMessage[];
  onSelectPrompt: (prompt: string) => void;
  onRegenerate: () => void;
  config?: {
    emergency_contact?: { name: string; phone: string };
    model?: string;
  };
}

export function MessageList({
  messages,
  onSelectPrompt,
  onRegenerate,
  config,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return <EmptyState onSelectPrompt={onSelectPrompt} />;
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        {messages.map((message, idx) => (
          <MessageBubble
            key={message.id || idx}
            message={message}
            isLatest={idx === messages.length - 1}
            onRegenerate={idx === messages.length - 1 ? onRegenerate : undefined}
            config={config}
          />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
