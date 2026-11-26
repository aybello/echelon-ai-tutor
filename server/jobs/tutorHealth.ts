import { invokeLLM } from "../_core/llm";

/**
 * AI Tutor health probe.
 *
 * The tutor went dark in production and the first signal was a customer
 * review, not an alert. This probe exercises the same code path a learner
 * uses, so an outage is detected by the system rather than reported by a
 * paying customer.
 *
 * It sends one tiny prompt. It does not touch learner data, entitlements, or
 * question banks.
 */
export type TutorHealthResult = {
  ok: boolean;
  model: string | null;
  latencyMs: number;
  /** True when the primary provider failed and the fallback answered. */
  usedFallback: boolean;
  error: string | null;
};

const PROBE_PROMPT = "Reply with the single word: ready";

export async function checkTutorHealth(): Promise<TutorHealthResult> {
  const started = Date.now();
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a health probe. Answer in one word." },
        { role: "user", content: PROBE_PROMPT },
      ],
      maxTokens: 16,
    });

    const reply = String(response?.choices?.[0]?.message?.content ?? "").trim();
    const model = response?.model ?? null;

    if (!reply) {
      return {
        ok: false,
        model,
        latencyMs: Date.now() - started,
        usedFallback: false,
        error: "Tutor provider returned an empty answer",
      };
    }

    return {
      ok: true,
      model,
      latencyMs: Date.now() - started,
      // Read the provider tag, never the model name. The primary provider
      // routes requests to whichever model it chooses and returns that
      // model's name, so a model-name check reports false outages.
      usedFallback: response?.servedBy === "fallback",
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      model: null,
      latencyMs: Date.now() - started,
      usedFallback: false,
      // Provider error text can carry account details, so only the error class
      // and status are surfaced.
      error: error instanceof Error ? error.message : "Unknown tutor failure",
    };
  }
}
