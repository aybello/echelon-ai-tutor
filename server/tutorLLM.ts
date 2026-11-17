import { invokeLLM, type InvokeResult } from "./_core/llm";
import {
  boundedOutputTokens,
  requireServiceSuccess,
  serviceFetch,
  serviceJson,
} from "./_core/outboundHttp";

// Tutor chat and session summaries accept text only. Tools, files and structured
// provider contracts deliberately remain on the existing shared invokeLLM path.
type TutorParams = {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  maxTokens?: number;
  signal?: AbortSignal;
};
export const TUTOR_GEMINI_MODEL = "gemini-4-hydrogen";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TUTOR_GEMINI_MODEL}:generateContent`;

type GeminiReply = {
  responseId?: string;
  promptFeedback?: { blockReason?: string };
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
    totalTokenCount?: number;
  };
};
class TutorSafetyBlock extends Error {
  constructor() {
    super("Tutor provider blocked this completion");
  }
}

export async function invokeTutorLLM(params: TutorParams): Promise<InvokeResult> {
  if (params.signal?.aborted) throw new Error("Tutor request cancelled");
  const maxTokens = boundedOutputTokens(params.maxTokens, 2048);
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return invokeLLM(params);

  const system = params.messages.filter(m => m.role === "system").map(m => m.content).join("\n\n");
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
  for (const message of params.messages) {
    if (message.role === "system") continue;
    const role = message.role === "assistant" ? "model" : "user";
    const previous = contents.at(-1);
    // Preserve adjacent turns in order without requiring alternating client input.
    if (previous?.role === role) previous.parts.push({ text: message.content });
    else contents.push({ role, parts: [{ text: message.content }] });
  }

  try {
    const response = await serviceFetch(GEMINI_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      signal: params.signal,
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents,
        // Provider-default thinking shares this budget. Give short summaries
        // the verified 2048-token minimum; preserve the larger chat cap. Do not
        // assume this model accepts thinkingBudget: 0.
        generationConfig: { maxOutputTokens: Math.max(2048, maxTokens) },
      }),
    }, { service: "google", timeoutMs: 30_000, maxResponseBytes: 2 * 1024 * 1024 });
    requireServiceSuccess(response, "google");
    const result = await serviceJson<GeminiReply>(response, "google");
    const candidate = result?.candidates?.[0];
    const finish = candidate?.finishReason;
    // Never bypass a provider safety/refusal decision by sending it elsewhere.
    if (result?.promptFeedback?.blockReason || (finish && !["STOP", "MAX_TOKENS"].includes(finish))) {
      throw new TutorSafetyBlock();
    }
    const text = (candidate?.content?.parts ?? [])
      .filter(part => part.thought !== true && typeof part.text === "string")
      .map(part => part.text)
      .join("")
      .trim();
    if (!text) throw new Error("Tutor provider returned no visible text");
    const usage = result.usageMetadata;
    const promptTokens = usage?.promptTokenCount ?? 0;
    const completionTokens = (usage?.candidatesTokenCount ?? 0) + (usage?.thoughtsTokenCount ?? 0);
    return {
      id: result.responseId ?? "tutor-gemini",
      created: Math.floor(Date.now() / 1000),
      model: TUTOR_GEMINI_MODEL,
      choices: [{
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: finish === "MAX_TOKENS" ? "length" : "stop",
      }],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: usage?.totalTokenCount ?? promptTokens + completionTokens,
      },
    };
  } catch (error) {
    if (params.signal?.aborted) throw new Error("Tutor request cancelled");
    if (error instanceof TutorSafetyBlock) throw error;
    // Fixed diagnostic only: raw provider errors/bodies can contain secrets or
    // learner text. One Google attempt, then the unchanged Claude recovery path.
    console.warn("[AI Tutor] Gemini unavailable; using existing provider fallback");
    return invokeLLM(params);
  }
}
