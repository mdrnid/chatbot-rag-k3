import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Source } from "@/lib/api/schemas";

export type MessageStatus = "pending" | "streaming" | "completed" | "error";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  sources?: Source[];
  citation_ok?: boolean;
  emergency?: boolean;
  notice?: string | null;
  standalone_question?: string;
  request_id?: string;
  latency_ms?: number;
  ttft_ms?: number;
  error?: { message: string; code?: string };
  status?: MessageStatus;
  rating?: "up" | "down";
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  doc_type?: string | null;
}

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
  docTypeFilter: string | null;
  selectedSourceId: string | null;
  isSourcePanelOpen: boolean;

  // Actions
  createConversation: (title?: string) => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  setDocTypeFilter: (filter: string | null) => void;
  setSelectedSourceId: (sourceId: string | null) => void;
  setSourcePanelOpen: (open: boolean) => void;
  openSourcePanel: (sourceId?: string) => void;
  closeSourcePanel: () => void;

  addMessage: (
    conversationId: string,
    message: Omit<ChatMessage, "id" | "createdAt">
  ) => string;
  updateMessage: (
    conversationId: string,
    messageId: string,
    partial: Partial<ChatMessage>
  ) => void;
  updateLastMessage: (
    conversationId: string,
    partial: Partial<ChatMessage>
  ) => void;
  clearMessages: (conversationId: string) => void;

  getActiveConversation: () => Conversation | undefined;
  getHistoryPayload: (
    conversationId: string,
    maxTurns?: number
  ) => Array<{ role: "user" | "assistant"; content: string }>;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "id-" + Math.random().toString(36).substring(2, 9) + "-" + Date.now();
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      docTypeFilter: null,
      selectedSourceId: null,
      isSourcePanelOpen: false,

      createConversation: (title?: string) => {
        const id = generateId();
        const newConversation: Conversation = {
          id,
          title: title || "Percakapan Baru",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          doc_type: get().docTypeFilter,
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: id,
        }));

        return id;
      },

      deleteConversation: (id: string) => {
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id);
          let newActiveId = state.activeConversationId;
          if (newActiveId === id) {
            newActiveId = filtered.length > 0 ? filtered[0].id : null;
          }
          return {
            conversations: filtered,
            activeConversationId: newActiveId,
          };
        });
      },

      setActiveConversation: (id: string) => {
        set({ activeConversationId: id });
      },

      setDocTypeFilter: (filter: string | null) => {
        set({ docTypeFilter: filter });
      },

      setSelectedSourceId: (sourceId: string | null) => {
        set({ selectedSourceId: sourceId });
      },

      setSourcePanelOpen: (open: boolean) => {
        set({ isSourcePanelOpen: open });
      },

      openSourcePanel: (sourceId?: string) => {
        set({
          isSourcePanelOpen: true,
          selectedSourceId: sourceId ?? get().selectedSourceId,
        });
      },

      closeSourcePanel: () => {
        set({
          isSourcePanelOpen: false,
          selectedSourceId: null,
        });
      },

      addMessage: (conversationId, msg) => {
        const messageId = generateId();
        const now = Date.now();
        const newMessage: ChatMessage = {
          ...msg,
          id: messageId,
          createdAt: now,
          status: msg.status || "completed",
        };

        set((state) => {
          const updatedConversations = state.conversations.map((c) => {
            if (c.id !== conversationId) return c;

            // Auto-update title if it's the first user message
            let title = c.title;
            if (c.messages.length === 0 && msg.role === "user") {
              title =
                msg.content.length > 35
                  ? msg.content.slice(0, 35) + "..."
                  : msg.content;
            }

            return {
              ...c,
              title,
              updatedAt: now,
              messages: [...c.messages, newMessage],
            };
          });

          return { conversations: updatedConversations };
        });

        return messageId;
      },

      updateMessage: (conversationId, messageId, partial) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            return {
              ...c,
              updatedAt: Date.now(),
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, ...partial } : m
              ),
            };
          }),
        }));
      },

      updateLastMessage: (conversationId, partial) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            if (c.messages.length === 0) return c;
            const lastIdx = c.messages.length - 1;
            const updatedMessages = [...c.messages];
            updatedMessages[lastIdx] = {
              ...updatedMessages[lastIdx],
              ...partial,
            };
            return {
              ...c,
              updatedAt: Date.now(),
              messages: updatedMessages,
            };
          }),
        }));
      },

      clearMessages: (conversationId: string) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [], updatedAt: Date.now() }
              : c
          ),
        }));
      },

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId);
      },

      getHistoryPayload: (conversationId: string, maxTurns: number = 6) => {
        const conv = get().conversations.find((c) => c.id === conversationId);
        if (!conv) return [];

        // Exclude pending/error messages from history payload and limit to last maxTurns
        const valid = conv.messages.filter(
          (m) => m.content.trim() !== "" && m.status !== "error"
        );
        const sliced = valid.slice(-maxTurns);
        return sliced.map((m) => ({
          role: m.role,
          content: m.content,
        }));
      },
    }),
    {
      name: "k3-conversation-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        docTypeFilter: state.docTypeFilter,
      }),
    }
  )
);
