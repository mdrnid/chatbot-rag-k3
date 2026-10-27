import { describe, it, expect, beforeEach } from "vitest";
import { useConversationStore } from "../stores/conversation";

describe("Conversation Store (stores/conversation.ts)", () => {
  beforeEach(() => {
    // Reset store state before each test
    useConversationStore.setState({
      conversations: [],
      activeConversationId: null,
      docTypeFilter: null,
      selectedSourceId: null,
      isSourcePanelOpen: false,
    });
  });

  it("should create a new conversation and set it as active", () => {
    const id = useConversationStore.getState().createConversation("Uji Percakapan");
    const state = useConversationStore.getState();

    expect(state.conversations).toHaveLength(1);
    expect(state.conversations[0].id).toBe(id);
    expect(state.conversations[0].title).toBe("Uji Percakapan");
    expect(state.activeConversationId).toBe(id);
  });

  it("should add messages and auto-update title on first user message", () => {
    const convId = useConversationStore.getState().createConversation();

    useConversationStore.getState().addMessage(convId, {
      role: "user",
      content: "Berapa jarak aman peledakan tambang?",
    });

    let conv = useConversationStore.getState().getActiveConversation();
    expect(conv?.messages).toHaveLength(1);
    expect(conv?.title).toBe("Berapa jarak aman peledakan tambang...");

    useConversationStore.getState().addMessage(convId, {
      role: "assistant",
      content: "Jarak aman adalah 500m.",
    });

    conv = useConversationStore.getState().getActiveConversation();
    expect(conv?.messages).toHaveLength(2);
  });

  it("should update last message during streaming", () => {
    const convId = useConversationStore.getState().createConversation();

    useConversationStore.getState().addMessage(convId, {
      role: "assistant",
      content: "Token 1",
      status: "streaming",
    });

    useConversationStore.getState().updateLastMessage(convId, {
      content: "Token 1 Token 2",
      status: "completed",
    });

    const conv = useConversationStore.getState().getActiveConversation();
    expect(conv?.messages[0].content).toBe("Token 1 Token 2");
    expect(conv?.messages[0].status).toBe("completed");
  });

  it("should correctly trim history to history_turns in getHistoryPayload", () => {
    const convId = useConversationStore.getState().createConversation();

    // Add 10 messages (5 turns)
    for (let i = 1; i <= 5; i++) {
      useConversationStore.getState().addMessage(convId, {
        role: "user",
        content: `Pertanyaan ${i}`,
      });
      useConversationStore.getState().addMessage(convId, {
        role: "assistant",
        content: `Jawaban ${i}`,
      });
    }

    // Limit to 4 messages (2 turns)
    const payload = useConversationStore.getState().getHistoryPayload(convId, 4);
    expect(payload).toHaveLength(4);
    expect(payload[0]).toEqual({ role: "user", content: "Pertanyaan 4" });
    expect(payload[1]).toEqual({ role: "assistant", content: "Jawaban 4" });
    expect(payload[2]).toEqual({ role: "user", content: "Pertanyaan 5" });
    expect(payload[3]).toEqual({ role: "assistant", content: "Jawaban 5" });
  });

  it("should delete conversation and switch active conversation", () => {
    const id1 = useConversationStore.getState().createConversation("Sesi 1");
    const id2 = useConversationStore.getState().createConversation("Sesi 2");

    expect(useConversationStore.getState().conversations).toHaveLength(2);
    expect(useConversationStore.getState().activeConversationId).toBe(id2);

    useConversationStore.getState().deleteConversation(id2);

    const state = useConversationStore.getState();
    expect(state.conversations).toHaveLength(1);
    expect(state.activeConversationId).toBe(id1);
  });
});
