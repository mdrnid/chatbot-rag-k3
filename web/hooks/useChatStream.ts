import { useCallback, useRef, useState } from "react";
import { parseSSEStream } from "@/lib/sse";
import { useConversationStore } from "@/stores/conversation";

export function useChatStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    conversations,
    activeConversationId,
    docTypeFilter,
    createConversation,
    addMessage,
    updateMessage,
    updateLastMessage,
    getHistoryPayload,
  } = useConversationStore();

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (rawQuestion: string, targetConversationId?: string) => {
      const question = rawQuestion.trim();
      if (!question || isStreaming) return;

      let convId = targetConversationId || activeConversationId;
      if (!convId) {
        convId = createConversation(question);
      }

      // 1. Get history before adding the new question (up to 6 turns)
      const history = getHistoryPayload(convId, 6);

      // 2. Add user message
      addMessage(convId, {
        role: "user",
        content: question,
        status: "completed",
      });

      // 3. Add initial empty assistant message in streaming state
      const assistantMsgId = addMessage(convId, {
        role: "assistant",
        content: "",
        status: "streaming",
      });

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setIsStreaming(true);

      const t0 = performance.now();
      let firstTokenReceived = false;
      let ttft_ms: number | undefined;
      let accumulatedContent = "";

      try {
        const payload: Record<string, unknown> = {
          question,
          history,
        };
        if (docTypeFilter) {
          payload.doc_type = docTypeFilter;
        }

        const res = await fetch("/api/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: abortController.signal,
        });

        if (!res.ok) {
          let errText = "Gagal menghubungi server";
          try {
            const errJson = await res.json();
            errText = errJson.error || errJson.message || errText;
          } catch {
            // fallback
          }
          updateMessage(convId, assistantMsgId, {
            status: "error",
            error: {
              message: `HTTP ${res.status}: ${errText}`,
              code: "HTTP_ERROR",
            },
          });
          return;
        }

        if (!res.body) {
          updateMessage(convId, assistantMsgId, {
            status: "error",
            error: {
              message: "Tidak ada stream data dari server",
              code: "EMPTY_BODY",
            },
          });
          return;
        }

        for await (const event of parseSSEStream(res.body)) {
          if (abortController.signal.aborted) {
            break;
          }

          if (event.type === "meta") {
            updateMessage(convId, assistantMsgId, {
              standalone_question: event.standalone_question,
              emergency: event.emergency,
              notice: event.notice,
              request_id: event.request_id,
              ...(event.is_refusal !== undefined ? { is_refusal: event.is_refusal } : {}),
            });
          } else if (event.type === "token") {
            if (!firstTokenReceived) {
              firstTokenReceived = true;
              ttft_ms = Math.round(performance.now() - t0);
            }
            accumulatedContent += event.content;
            updateMessage(convId, assistantMsgId, {
              content: accumulatedContent,
              ttft_ms,
            });
          } else if (event.type === "sources") {
            updateMessage(convId, assistantMsgId, {
              sources: event.sources,
              citation_ok: event.citation_ok,
              ...(event.is_refusal !== undefined ? { is_refusal: event.is_refusal } : {}),
            });
          } else if (event.type === "done") {
            const latency_ms =
              event.latency_ms ?? Math.round(performance.now() - t0);
            updateMessage(convId, assistantMsgId, {
              latency_ms,
              status: "completed",
              ...(event.is_refusal !== undefined ? { is_refusal: event.is_refusal } : {}),
            });
          } else if (event.type === "error") {
            updateMessage(convId, assistantMsgId, {
              status: "error",
              error: {
                message: event.message,
                code: event.code || "INTERNAL_ERROR",
              },
            });
          }
        }
      } catch (err: unknown) {
        if (abortController.signal.aborted) {
          // Stopped by user: retain what has been accumulated
          updateMessage(convId, assistantMsgId, {
            status: "completed",
            content: accumulatedContent || "(Generasi dihentikan oleh pengguna)",
          });
        } else {
          // Network drop or connection aborted
          const errMsg =
            err instanceof Error ? err.message : "Koneksi terputus";
          updateMessage(convId, assistantMsgId, {
            status: "error",
            content: accumulatedContent, // Keep partial response
            error: {
              message: `Gangguan jaringan: ${errMsg}`,
              code: "NETWORK_ERROR",
            },
          });
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [
      isStreaming,
      activeConversationId,
      docTypeFilter,
      createConversation,
      getHistoryPayload,
      addMessage,
      updateMessage,
    ]
  );

  const regenerateLastResponse = useCallback(
    async (targetConversationId?: string) => {
      const convId = targetConversationId || activeConversationId;
      if (!convId) return;

      const conv = conversations.find((c) => c.id === convId);
      if (!conv || conv.messages.length === 0) return;

      // Find the last user message
      let lastUserMsgIndex = -1;
      for (let i = conv.messages.length - 1; i >= 0; i--) {
        if (conv.messages[i].role === "user") {
          lastUserMsgIndex = i;
          break;
        }
      }

      if (lastUserMsgIndex === -1) return;

      const lastUserQuestion = conv.messages[lastUserMsgIndex].content;

      // If the last message is an assistant message (streaming, completed, or failed), remove it before resending
      if (conv.messages.length - 1 > lastUserMsgIndex) {
        useConversationStore.setState((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== convId) return c;
            return {
              ...c,
              messages: c.messages.slice(0, lastUserMsgIndex + 1),
            };
          }),
        }));
      }

      // Re-send using existing user question
      const assistantMsgId = addMessage(convId, {
        role: "assistant",
        content: "",
        status: "streaming",
      });

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setIsStreaming(true);

      const t0 = performance.now();
      let firstTokenReceived = false;
      let ttft_ms: number | undefined;
      let accumulatedContent = "";
      const history = getHistoryPayload(convId, 6);

      try {
        const payload: Record<string, unknown> = {
          question: lastUserQuestion,
          history,
        };
        if (docTypeFilter) payload.doc_type = docTypeFilter;

        const res = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: abortController.signal,
        });

        if (!res.ok || !res.body) {
          updateMessage(convId, assistantMsgId, {
            status: "error",
            error: {
              message: `HTTP ${res.status}`,
              code: "HTTP_ERROR",
            },
          });
          return;
        }

        for await (const event of parseSSEStream(res.body)) {
          if (abortController.signal.aborted) break;

          if (event.type === "meta") {
            updateMessage(convId, assistantMsgId, {
              standalone_question: event.standalone_question,
              emergency: event.emergency,
              notice: event.notice,
              request_id: event.request_id,
              ...(event.is_refusal !== undefined ? { is_refusal: event.is_refusal } : {}),
            });
          } else if (event.type === "token") {
            if (!firstTokenReceived) {
              firstTokenReceived = true;
              ttft_ms = Math.round(performance.now() - t0);
            }
            accumulatedContent += event.content;
            updateMessage(convId, assistantMsgId, {
              content: accumulatedContent,
              ttft_ms,
            });
          } else if (event.type === "sources") {
            updateMessage(convId, assistantMsgId, {
              sources: event.sources,
              citation_ok: event.citation_ok,
              ...(event.is_refusal !== undefined ? { is_refusal: event.is_refusal } : {}),
            });
          } else if (event.type === "done") {
            updateMessage(convId, assistantMsgId, {
              latency_ms:
                event.latency_ms ?? Math.round(performance.now() - t0),
              status: "completed",
              ...(event.is_refusal !== undefined ? { is_refusal: event.is_refusal } : {}),
            });
          } else if (event.type === "error") {
            updateMessage(convId, assistantMsgId, {
              status: "error",
              error: {
                message: event.message,
                code: event.code || "INTERNAL_ERROR",
              },
            });
          }
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          updateMessage(convId, assistantMsgId, {
            status: "error",
            content: accumulatedContent,
            error: {
              message: err instanceof Error ? err.message : "Koneksi terputus",
              code: "NETWORK_ERROR",
            },
          });
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [
      activeConversationId,
      conversations,
      docTypeFilter,
      getHistoryPayload,
      addMessage,
      updateMessage,
    ]
  );

  return {
    isStreaming,
    sendMessage,
    stopGeneration,
    regenerateLastResponse,
  };
}
