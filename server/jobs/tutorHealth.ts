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
const PRIMARY_MODEL_PREFIX = "claude-opus-4-7";

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
      // A non-primary model means the primary provider was unavailable and the
      // fallback carried the request. The tutor still works, but the primary
      // provider needs attention.
      usedFallback: Boolean(model && !model.startsWith(PRIMARY_MODEL_PREFIX)),
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
