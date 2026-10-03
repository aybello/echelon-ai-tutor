import { afterEach, describe, expect, it, vi } from "vitest";
import { BLOG_MODEL, blogResponseText, retrieveBlogResponse, submitBlogResponse } from "./blogModel";

const input = { instructions: "Test editor", input: "Fictional source data", maxOutputTokens: 2048,
  schema: { name: "test_blog", schema: { type: "object", properties: {}, additionalProperties: false } } };
const completed = { id: "resp_fixture", status: "completed" as const,
  output: [{ type: "message", content: [{ type: "output_text", text: '{"ok":true}' }] }] };
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("blog direct model contract", () => {
  it("uses the requested Sol model, durable background responses and strict JSON", async () => {
    vi.stubEnv("OPENAI_CUSTOM_API_KEY", "test-only-blog-key");
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "resp_fixture", status: "queued" })));
    vi.stubGlobal("fetch", fetch);
    await expect(submitBlogResponse(input)).resolves.toMatchObject({ status: "queued" });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(init.headers.authorization).toBe("Bearer test-only-blog-key");
    expect(JSON.parse(init.body)).toMatchObject({ model: BLOG_MODEL, background: true, store: true,
      reasoning: { effort: "low" }, max_output_tokens: 2048, text: { format: { type: "json_schema", strict: true } } });
  });
  it("retrieves a persisted response without submitting another paid request", async () => {
    vi.stubEnv("OPENAI_CUSTOM_API_KEY", "test-only-blog-key");
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(completed)));
    vi.stubGlobal("fetch", fetch);
    expect(blogResponseText(await retrieveBlogResponse("resp_fixture"))).toBe('{"ok":true}');
    expect(fetch.mock.calls[0][0]).toBe("https://api.openai.com/v1/responses/resp_fixture");
    expect(fetch.mock.calls[0][1].method).toBe("GET");
  });
  it("rejects invalid response identifiers before making a request", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await expect(retrieveBlogResponse("../other-resource")).rejects.toThrow("Invalid blog response");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("fails closed on unexpected provider status", async () => {
    vi.stubEnv("OPENAI_CUSTOM_API_KEY", "test-only-blog-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "resp_fixture", status: "unknown" }))));
    await expect(submitBlogResponse(input)).rejects.toThrow();
  });
  it("does not publish refused or incomplete text", () => {
    expect(() => blogResponseText({ ...completed, status: "incomplete" })).toThrow("not complete");
    expect(() => blogResponseText({ ...completed, output: [{ type: "message", content: [{ type: "refusal" }] }] })).toThrow("refused");
    expect(() => blogResponseText({ ...completed, output: [{ type: "message", content: [{ type: "refusal" }, { type: "output_text", text: "partial text" }] }] })).toThrow("refused");
  });
  it("makes no network request when a direct provider key is absent", async () => {
    vi.stubEnv("OPENAI_CUSTOM_API_KEY", ""); vi.stubEnv("OPENAI_API_KEY", "");
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await expect(submitBlogResponse(input)).rejects.toThrow("credential is not configured");
    expect(fetch).not.toHaveBeenCalled();
  });
});
