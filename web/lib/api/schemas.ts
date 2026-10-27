import { z } from "zod";

export const SourceSchema = z.object({
  id: z.string(),
  label: z.string(),
  score: z.number(),
  cited: z.boolean(),
  snippet: z.string(),
  metadata: z.record(z.unknown()),
});

export type Source = {
  id: string;
  label: string;
  score: number;
  cited: boolean;
  snippet: string;
  metadata: Record<string, unknown>;
};

export const StreamMetaEventSchema = z.object({
  type: z.literal("meta"),
  standalone_question: z.string(),
  emergency: z.boolean(),
  notice: z.string().nullable(),
  request_id: z.string().optional(),
});

export const StreamTokenEventSchema = z.object({
  type: z.literal("token"),
  content: z.string(),
});

export const StreamSourcesEventSchema = z.object({
  type: z.literal("sources"),
  sources: z.array(SourceSchema),
  citation_ok: z.boolean(),
});

export const StreamDoneEventSchema = z.object({
  type: z.literal("done"),
  latency_ms: z.number().optional(),
});

export const StreamErrorEventSchema = z.object({
  type: z.literal("error"),
  message: z.string(),
  code: z.string().optional(),
});

export const StreamEventSchema = z.discriminatedUnion("type", [
  StreamMetaEventSchema,
  StreamTokenEventSchema,
  StreamSourcesEventSchema,
  StreamDoneEventSchema,
  StreamErrorEventSchema,
]);

export type StreamEvent =
  | { type: "meta"; standalone_question: string; emergency: boolean; notice: string | null; request_id?: string }
  | { type: "token"; content: string }
  | { type: "sources"; sources: Source[]; citation_ok: boolean }
  | { type: "done"; latency_ms?: number }
  | { type: "error"; message: string; code?: string };

export const ConfigResponseSchema = z.object({
  doc_types: z.array(z.string()),
  disclaimer: z.string(),
  emergency_contact: z.object({
    name: z.string(),
    phone: z.string(),
  }),
  model: z.string(),
  version: z.string(),
  history_turns: z.number(),
});

export type ConfigResponse = z.infer<typeof ConfigResponseSchema>;

export const HealthResponseSchema = z.object({
  status: z.string(),
  model: z.string(),
  collection: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const FeedbackRequestSchema = z.object({
  request_id: z.string(),
  rating: z.enum(["up", "down"]),
  comment: z.string().optional(),
});

export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
