import { StreamEvent, StreamEventSchema } from "./api/schemas";

/**
 * Async generator that consumes a ReadableStream of Uint8Array chunks,
 * parses SSE frames (handles partial chunks, multi-events per chunk, CRLF/LF),
 * and yields validated StreamEvents.
 */
export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<StreamEvent, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // SSE event blocks are separated by double newline (\n\n or \r\n\r\n)
      const parts = buffer.split(/\r?\n\r?\n/);
      // The last element is either empty (if buffer ended with \n\n) or the remainder of an incomplete event
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const trimmedPart = part.trim();
        if (!trimmedPart) continue;

        // An SSE event can have multiple lines (data:, event:, id:, etc.)
        const lines = trimmedPart.split(/\r?\n/);
        const dataLines: string[] = [];

        for (const line of lines) {
          if (line.startsWith("data:")) {
            // Cut off "data:" and any leading space
            const dataContent = line.slice(5).replace(/^\s/, "");
            dataLines.push(dataContent);
          }
        }

        if (dataLines.length === 0) continue;

        const rawData = dataLines.join("\n");
        try {
          const parsed = JSON.parse(rawData);
          const validation = StreamEventSchema.safeParse(parsed);
          if (validation.success) {
            yield validation.data;
          } else {
            console.warn("SSE Event validation failed:", validation.error, parsed);
          }
        } catch (err) {
          console.warn("Failed to parse SSE JSON:", err, rawData);
        }
      }
    }

    // Flush remaining buffer if it has a complete data line
    if (buffer.trim()) {
      const lines = buffer.trim().split(/\r?\n/);
      const dataLines = lines
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).replace(/^\s/, ""));
      if (dataLines.length > 0) {
        try {
          const parsed = JSON.parse(dataLines.join("\n"));
          const validation = StreamEventSchema.safeParse(parsed);
          if (validation.success) {
            yield validation.data;
          }
        } catch {
          // ignore incomplete trailing data at EOF
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
