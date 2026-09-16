import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const env = vi.hoisted(() => ({
  geminiApiKey: "test-gemini-key",
  geminiModel: "gemini-2.5-flash",
  forgeApiKey: "must-not-be-used",
  forgeApiUrl: "https://forge.invalid",
  openAiApiKey: "test-openai-key",
  openAiModel: "configured-openai-model",
}));
vi.mock("./env", () => ({ ENV: env }));
import { invokeLLM } from "./llm";
import { invokeGPT56 } from "./openaiResponses";
const messages = [{ role: "user" as const, content: "Explain flow rate." }];
let fetchMock: ReturnType<typeof vi.fn>;
const completion = () =>
  new Response(
    JSON.stringify({
      id: "completion-test",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Flow is volume per unit time.",
          },
          finish_reason: "stop",
        },
      ],
    })
  );
beforeEach(() => {
  fetchMock = vi.fn().mockImplementation(async () => completion());
  vi.stubGlobal("fetch", fetchMock);
  env.geminiApiKey = "test-gemini-key";
  env.geminiModel = "gemini-2.5-flash";
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe("Gemini request contract", () => {
  it("uses direct Google routing, a dedicated key, the configured model and caller output budget", async () => {
    await invokeLLM({ messages, maxTokens: 350 });
    const [url, request] = fetchMock.mock.calls[0];
    const body = JSON.parse(request.body);
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
    );
    expect(request.headers.authorization).toBe("Bearer test-gemini-key");
    expect(body.model).toBe(env.geminiModel);
    expect(body.max_tokens).toBe(350);
    expect(body.thinking).toBeUndefined();
    expect(body.reasoning_effort).toBe("none");
  });
  it("supports the snake-case alias and caps excessive limits", async () => {
    await invokeLLM({ messages, max_tokens: 1536 });
    await invokeLLM({ messages, maxTokens: 100000 });
    await invokeLLM({ messages });
    expect(
      fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body).max_tokens)
    ).toEqual([1536, 8192, 2048]);
  });
  it("rejects invalid and conflicting budgets before calling the provider", async () => {
    for (const maxTokens of [0, -1, 1.5, NaN, Infinity])
      await expect(invokeLLM({ messages, maxTokens })).rejects.toThrow(
        "positive integer"
      );
    await expect(
      invokeLLM({ messages, maxTokens: 10, max_tokens: 20 })
    ).rejects.toThrow("Conflicting");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("requires external credentials and an explicit model instead of silently falling back", async () => {
    env.geminiApiKey = "";
    await expect(invokeLLM({ messages })).rejects.toThrow("GEMINI_API_KEY");
    env.geminiApiKey = "test";
    env.geminiModel = "";
    await expect(invokeLLM({ messages })).rejects.toThrow("GEMINI_MODEL");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("preserves structured output, tools and image parts", async () => {
    const schema = {
      name: "answer",
      schema: { type: "object", properties: { answer: { type: "string" } } },
    };
    await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Read this diagram" },
            {
              type: "image_url",
              image_url: { url: "data:image/png;base64,AA==" },
            },
          ],
        },
      ],
      outputSchema: schema,
      tools: [{ type: "function", function: { name: "lookup" } }],
      toolChoice: "required",
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.response_format).toEqual({
      type: "json_schema",
      json_schema: schema,
    });
    expect(body.tool_choice.function.name).toBe("lookup");
    expect(body.messages[0].content[1].type).toBe("image_url");
  });
  it("does not leak provider bodies or return an empty completion as a successful answer", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("PRIVATE patient@example.com", { status: 429 })
    );
    await expect(invokeLLM({ messages })).rejects.toThrow(
      "gemini request http (429)"
    );
    fetchMock.mockResolvedValueOnce(new Response('{"choices":[]}'));
    await expect(invokeLLM({ messages })).rejects.toThrow(
      "no usable completion"
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("redacts malformed provider JSON instead of propagating its response snippet", async () => {
    fetchMock.mockResolvedValue(new Response("PRIVATE prompt text"));
    await expect(invokeLLM({ messages })).rejects.toThrow(
      "gemini request invalid_json"
    );
  });
  it("times out an unresponsive generation once without duplicate billed requests", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const assertion = expect(invokeLLM({ messages })).rejects.toMatchObject({
      kind: "timeout",
    });
    await vi.advanceTimersByTimeAsync(45000);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
it("preserves Responses structured output and store=false while enforcing output limits", async () => {
  fetchMock.mockResolvedValue(
    new Response(
      '{"output":[{"content":[{"type":"output_text","text":"A scenario"}]}]}'
    )
  );
  expect(
    await invokeGPT56("Scenario prompt", {
      maxOutputTokens: 700,
      jsonSchema: { name: "scenario", schema: { type: "object" } },
    })
  ).toBe("A scenario");
  const [url, init] = fetchMock.mock.calls[0];
  const body = JSON.parse(init.body);
  expect(url).toBe("https://api.openai.com/v1/responses");
  expect(body.store).toBe(false);
  expect(body.max_output_tokens).toBe(700);
  expect(body.text.format.name).toBe("scenario");
});
