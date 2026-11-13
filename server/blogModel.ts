import { z } from "zod";
import { requireServiceSuccess, serviceFetch, serviceJson } from "./_core/outboundHttp";

export const BLOG_MODEL = "gpt-6.1-sol";
const providerFailureLabels = {
  missing_credential: "Direct OpenAI credential is not configured for blog automation",
  schema_unexpected: "Blog provider response schema is unexpected",
  invalid_response_id: "Invalid blog response identifier",
  response_not_complete: "Blog model response is not complete",
  response_refused: "Blog model refused the request",
  response_empty: "Blog model returned no usable text",
} as const;
export type BlogProviderFailureKind = keyof typeof providerFailureLabels;
/** Public labels only: never attach provider bodies, validation issues or raw causes. */
export class BlogProviderError extends Error {
  readonly service = "openai";
  constructor(readonly kind: BlogProviderFailureKind, readonly status?: number) {
    super(providerFailureLabels[kind]);
    this.name = "BlogProviderError";
  }
}
export function isBlogProviderFailureKind(value: unknown): value is BlogProviderFailureKind {
  return typeof value === "string" && Object.hasOwn(providerFailureLabels, value);
}
export type BlogModelRequest = {
  instructions: string;
  input: string;
  schema: { name: string; schema: Record<string, unknown> };
  maxOutputTokens: number;
};
const responseSchema = z.object({
  id: z.string().regex(/^resp_[a-zA-Z0-9_-]+$/),
  status: z.enum(["queued", "in_progress", "completed", "failed", "cancelled", "incomplete"]),
  output: z.array(z.object({
    type: z.string(),
    content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional(),
  }).passthrough()).optional(),
});
export type BlogModelResponse = z.infer<typeof responseSchema>;
export function blogResponseText(response: BlogModelResponse): string {
  if (response.status !== "completed") throw new BlogProviderError("response_not_complete");
  if ((response.output ?? []).some(item => item.content?.some(part => part.type === "refusal")))
    throw new BlogProviderError("response_refused");
  const text = (response.output ?? []).filter(item => item.type === "message")
    .flatMap(item => item.content ?? []).filter(part => part.type === "output_text")
    .map(part => part.text ?? "").join("");
  if (!text.trim()) throw new BlogProviderError("response_empty");
  return text;
}
function key(): string {
  const value = process.env.OPENAI_CUSTOM_API_KEY || process.env.OPENAI_API_KEY;
  if (!value) throw new BlogProviderError("missing_credential");
  return value;
}
async function request(path: string, init: RequestInit, signal?: AbortSignal) {
  const response = await serviceFetch(`https://api.openai.com/v1/responses${path}`, {
    ...init,
    headers: { "content-type": "application/json", authorization: `Bearer ${key()}` },
    signal,
  }, { service: "openai", timeoutMs: 10_000, maxResponseBytes: 512 * 1024 });
  requireServiceSuccess(response, "openai");
  const parsed = responseSchema.safeParse(await serviceJson(response, "openai"));
  if (!parsed.success) throw new BlogProviderError("schema_unexpected", response.status);
  return parsed.data;
}
export async function submitBlogResponse(input: BlogModelRequest, signal?: AbortSignal) {
  return request("", { method: "POST", body: JSON.stringify({
    model: BLOG_MODEL,
    background: true,
    // Public official sources and unpublished blog text only. Enables restart-safe polling.
    store: true,
    reasoning: { effort: "low" },
    max_output_tokens: input.maxOutputTokens,
    instructions: input.instructions,
    input: input.input,
    text: { format: { type: "json_schema", strict: true, ...input.schema } },
  }) }, signal);
}
export async function retrieveBlogResponse(id: string, signal?: AbortSignal) {
  if (!/^resp_[a-zA-Z0-9_-]+$/.test(id)) throw new BlogProviderError("invalid_response_id");
  return request(`/${encodeURIComponent(id)}`, { method: "GET" }, signal);
}
