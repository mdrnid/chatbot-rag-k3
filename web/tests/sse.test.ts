import { describe, it, expect } from "vitest";
import { parseSSEStream } from "../lib/sse";

function createStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

describe("SSE Parser (lib/sse.ts)", () => {
  it("should parse normal single SSE events", async () => {
    const stream = createStream([
      'data: {"type": "meta", "standalone_question": "Radius", "emergency": false, "notice": null}\n\n',
      'data: {"type": "token", "content": "Halo"}\n\n',
      'data: {"type": "done"}\n\n',
    ]);

    const events = [];
    for await (const event of parseSSEStream(stream)) {
      events.push(event);
    }

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({
      type: "meta",
      standalone_question: "Radius",
      emergency: false,
      notice: null,
    });
    expect(events[1]).toEqual({ type: "token", content: "Halo" });
    expect(events[2]).toEqual({ type: "done" });
  });

  it("should handle chunk split in the middle of a data line", async () => {
    // First chunk has partial JSON, second chunk completes it
    const stream = createStream([
      'data: {"type": "token", "con',
      'tent": "Peledakan aman"}\n\n',
      'data: {"type": "done", "latency_ms": 120}\n\n',
    ]);

    const events = [];
    for await (const event of parseSSEStream(stream)) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: "token", content: "Peledakan aman" });
    expect(events[1]).toEqual({ type: "done", latency_ms: 120 });
  });

  it("should handle multiple events in a single chunk", async () => {
    const stream = createStream([
      'data: {"type": "token", "content": "A"}\n\ndata: {"type": "token", "content": "B"}\n\ndata: {"type": "done"}\n\n',
    ]);

    const events = [];
    for await (const event of parseSSEStream(stream)) {
      events.push(event);
    }

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ type: "token", content: "A" });
    expect(events[1]).toEqual({ type: "token", content: "B" });
    expect(events[2]).toEqual({ type: "done" });
  });

  it("should correctly parse error events with code", async () => {
    const stream = createStream([
      'data: {"type": "error", "message": "Koneksi LLM timeout", "code": "LLM_TIMEOUT"}\n\n',
    ]);

    const events = [];
    for await (const event of parseSSEStream(stream)) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      type: "error",
      message: "Koneksi LLM timeout",
      code: "LLM_TIMEOUT",
    });
  });

  it("should correctly parse is_refusal in meta and done events", async () => {
    const stream = createStream([
      'data: {"type": "meta", "standalone_question": "Harga", "emergency": false, "notice": null, "is_refusal": true}\n\n',
      'data: {"type": "token", "content": "Informasi tersebut tidak ditemukan..."}\n\n',
      'data: {"type": "sources", "sources": [], "citation_ok": true, "is_refusal": true}\n\n',
      'data: {"type": "done", "is_refusal": true}\n\n',
    ]);

    const events = [];
    for await (const event of parseSSEStream(stream)) {
      events.push(event);
    }

    expect(events).toHaveLength(4);
    expect(events[0].type).toBe("meta");
    if (events[0].type === "meta") {
      expect(events[0].is_refusal).toBe(true);
    }
    expect(events[2].type).toBe("sources");
    if (events[2].type === "sources") {
      expect(events[2].is_refusal).toBe(true);
    }
    expect(events[3].type).toBe("done");
    if (events[3].type === "done") {
      expect(events[3].is_refusal).toBe(true);
    }
  });
});
