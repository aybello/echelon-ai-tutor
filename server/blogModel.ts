import { z } from "zod";
import { requireServiceSuccess, serviceFetch, serviceJson } from "./_core/outboundHttp";

export const BLOG_MODEL = "gpt-6.1-sol";
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
  if (response.status !== "completed") throw new Error("Blog model response is not complete");
  if ((response.output ?? []).some(item => item.content?.some(part => part.type === "refusal")))
    throw new Error("Blog model refused the request");
  const text = (response.output ?? []).filter(item => item.type === "message")
    .flatMap(item => item.content ?? []).filter(part => part.type === "output_text")
    .map(part => part.text ?? "").join("");
  if (!text.trim()) throw new Error("Blog model returned no usable text");
  return text;
}
function key(): string {
  const value = process.env.OPENAI_CUSTOM_API_KEY || process.env.OPENAI_API_KEY;
  if (!value) throw new Error("Direct OpenAI credential is not configured for blog automation");
  return value;
}
async function request(path: string, init: RequestInit, signal?: AbortSignal) {
  const response = await serviceFetch(`https://api.openai.com/v1/responses${path}`, {
    ...init,
    headers: { "content-type": "application/json", authorization: `Bearer ${key()}` },
    signal,
  }, { service: "openai", timeoutMs: 10_000, maxResponseBytes: 512 * 1024 });
  requireServiceSuccess(response, "openai");
  return responseSchema.parse(await serviceJson(response, "openai"));
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
  if (!/^resp_[a-zA-Z0-9_-]+$/.test(id)) throw new Error("Invalid blog response identifier");
  return request(`/${encodeURIComponent(id)}`, { method: "GET" }, signal);
}
