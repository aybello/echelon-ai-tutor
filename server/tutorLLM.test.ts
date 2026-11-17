import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { invokeTutorLLM, TUTOR_GEMINI_MODEL } from "./tutorLLM";

const { fallback } = vi.hoisted(() => ({ fallback: vi.fn() }));
vi.mock("./_core/llm", () => ({ invokeLLM: fallback }));
const params = {
  messages: [{ role: "user" as const, content: "What is chlorine residual?" }],
  maxTokens: 4096,
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const answer = (finishReason = "STOP", text = "Chlorine remaining after demand.") => ({
  responseId: "google-test",
  candidates: [{ finishReason, content: { parts: [{ text }] } }],
  usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20, thoughtsTokenCount: 3, totalTokenCount: 33 },
});
const recovered = { choices: [{ message: { content: "Existing Claude answer" }, finish_reason: "stop" }] };
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "synthetic-google-key");
  fallback.mockReset().mockResolvedValue(recovered);
  fetchMock = vi.fn().mockResolvedValue(json(answer()));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("tutor-only direct Gemini", () => {
  it("routes to the exact model using a header-only server key and preserves result/usage shape", async () => {
    const result = await invokeTutorLLM(params);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://generativelanguage.googleapis.com/v1beta/models/${TUTOR_GEMINI_MODEL}:generateContent`);
    expect(url).not.toContain("synthetic-google-key");
    expect(init.headers["x-goog-api-key"]).toBe("synthetic-google-key");
    const body = JSON.parse(init.body);
    expect(body.generationConfig).toEqual({ maxOutputTokens: 4096 });
    expect(JSON.stringify(body)).not.toContain("synthetic-google-key");
    expect(result).toMatchObject({
      id: "google-test", model: "gemini-4-hydrogen",
      choices: [{ index: 0, message: { role: "assistant", content: "Chlorine remaining after demand." }, finish_reason: "stop" }],
      usage: { prompt_tokens: 10, completion_tokens: 23, total_tokens: 33 },
    });
    expect(fallback).not.toHaveBeenCalled();
  });

  it("maps server policy separately and preserves ordered histories including adjacent roles", async () => {
    await invokeTutorLLM({ messages: [
      { role: "system", content: "Grounding rules" },
      { role: "system", content: "Safety rules" },
      { role: "assistant", content: "Welcome" },
      { role: "assistant", content: "Ask about water" },
      { role: "user", content: "What is CT?" },
      { role: "user", content: "Explain the units" },
      { role: "assistant", content: "Concentration times time" },
      { role: "user", content: "Give an example" },
    ] });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.systemInstruction).toEqual({ parts: [{ text: "Grounding rules\n\nSafety rules" }] });
    expect(body.contents).toEqual([
      { role: "model", parts: [{ text: "Welcome" }, { text: "Ask about water" }] },
      { role: "user", parts: [{ text: "What is CT?" }, { text: "Explain the units" }] },
      { role: "model", parts: [{ text: "Concentration times time" }] },
      { role: "user", parts: [{ text: "Give an example" }] },
    ]);
  });

  it("gives short summaries verified thinking headroom without unsupported thinking config", async () => {
    await invokeTutorLLM({ ...params, maxTokens: 350 });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).generationConfig).toEqual({ maxOutputTokens: 2048 });
  });

  it("returns only visible text parts, never thoughts or signatures", async () => {
    fetchMock.mockResolvedValueOnce(json({ candidates: [{ finishReason: "STOP", content: { parts: [
      { thought: true, text: "private reasoning" }, { text: "Visible ", thoughtSignature: "private signature" },
      { inlineData: { data: "not text" } }, { text: "answer" },
    ] } }] }));
    expect((await invokeTutorLLM(params)).choices[0].message.content).toBe("Visible answer");
  });

  it("normalizes MAX_TOKENS to length for the existing concise retry", async () => {
    fetchMock.mockResolvedValueOnce(json(answer("MAX_TOKENS", "Partial calculation")));
    expect((await invokeTutorLLM(params)).choices[0].finish_reason).toBe("length");
    expect(fallback).not.toHaveBeenCalled();
  });

  it.each([undefined, "", "   "])("uses unchanged fallback without a Google key (%s)", async key => {
    if (key === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = key;
    expect(await invokeTutorLLM(params)).toBe(recovered);
    expect(fallback).toHaveBeenCalledWith(params);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    {}, { candidates: [] }, answer("STOP", "   "), answer("MAX_TOKENS", ""),
    { candidates: [{ finishReason: "STOP", content: { parts: [{ thought: true, text: "Hidden only" }] } }] },
  ])("falls back on empty or thought-only output %#", async body => {
    fetchMock.mockResolvedValueOnce(json(body));
    expect(await invokeTutorLLM(params)).toBe(recovered);
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it.each([400, 401, 403, 429, 500, 503])("recovers from HTTP %i without leaking provider bodies", async status => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce(json({ error: "synthetic-google-key private learner text" }, status));
    expect(await invokeTutorLLM(params)).toBe(recovered);
    expect(JSON.stringify(warn.mock.calls)).not.toMatch(/synthetic-google-key|private learner text/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledWith(params);
  });

  it("redacts raw network errors and malformed JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error("synthetic-google-key private learner text"));
    expect(await invokeTutorLLM(params)).toBe(recovered);
    fetchMock.mockResolvedValueOnce(new Response("synthetic-google-key private learner text"));
    expect(await invokeTutorLLM(params)).toBe(recovered);
    expect(JSON.stringify(warn.mock.calls)).not.toMatch(/synthetic-google-key|private learner text/);
  });

  it.each([
    { promptFeedback: { blockReason: "SAFETY" } },
    answer("SAFETY"), answer("RECITATION"), answer("PROHIBITED_CONTENT"),
  ])("does not bypass a blocked/refused completion through fallback %#", async body => {
    fetchMock.mockResolvedValueOnce(json(body));
    await expect(invokeTutorLLM(params)).rejects.toThrow("blocked");
    expect(fallback).not.toHaveBeenCalled();
  });

  it("has a bounded deadline even if fetch never settles and aborts the Google request", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const pending = invokeTutorLLM(params);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(await pending).toBe(recovered);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it("bounds stalled response bodies as well as headers", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(new Response(new ReadableStream({ start() {} })));
    const pending = invokeTutorLLM(params);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(await pending).toBe(recovered);
  });

  it("does not reinterpret cancellation as an outage", async () => {
    const controller = new AbortController();
    fetchMock.mockImplementationOnce(async () => {
      controller.abort();
      throw new Error("private error");
    });
    await expect(invokeTutorLLM({ ...params, signal: controller.signal })).rejects.toThrow("cancelled");
    expect(fallback).not.toHaveBeenCalled();
    fetchMock.mockClear();
    await expect(invokeTutorLLM({ ...params, signal: controller.signal })).rejects.toThrow("cancelled");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("propagates existing fallback failure rather than fabricating an answer", async () => {
    fetchMock.mockResolvedValueOnce(json({}, 503));
    fallback.mockRejectedValueOnce(new Error("Existing provider unavailable"));
    await expect(invokeTutorLLM(params)).rejects.toThrow("Existing provider unavailable");
    expect(fallback).toHaveBeenCalledTimes(1);
  });
});
