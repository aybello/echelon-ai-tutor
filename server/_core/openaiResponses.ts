import { ENV } from "./env";

type OpenAIOutputPart = {
  type?: string;
  text?: string;
};

type OpenAIOutputItem = {
  type?: string;
  content?: OpenAIOutputPart[];
};

type OpenAIResponse = {
  output_text?: string;
  output?: OpenAIOutputItem[];
};

function extractOutputText(response: OpenAIResponse): string {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  return (response.output ?? [])
    .flatMap(item => item.content ?? [])
    .filter(part => part.type === "output_text" && typeof part.text === "string")
    .map(part => part.text!.trim())
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Small Responses API wrapper used by the Build Week incident simulator.
 * Kept separate from the legacy Forge chat-completions client so the feature
 * has an explicit, auditable GPT-5.6 integration.
 */
export async function invokeGPT56(input: string): Promise<string> {
  if (!ENV.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: ENV.openAiModel,
      reasoning: { effort: "medium" },
      text: { verbosity: "medium" },
      store: false,
      max_output_tokens: 1200,
      input,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI Responses API failed: ${response.status} ${detail}`);
  }

  const result = (await response.json()) as OpenAIResponse;
  const text = extractOutputText(result);
  if (!text) throw new Error("OpenAI returned an empty debrief");
  return text;
}
