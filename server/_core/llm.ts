import { ENV } from "./env";
import {
  serviceJson,
  serviceFetch,
  requireServiceSuccess,
  boundedOutputTokens,
} from "./outboundHttp";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?:
      | "audio/mpeg"
      | "audio/wav"
      | "application/pdf"
      | "audio/mp4"
      | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  ToolChoicePrimitive | ToolChoiceByName | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  signal?: AbortSignal;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const NATIVE_MODEL = "claude-opus-4-7";
const NATIVE_MIN_OUTPUT_TOKENS = 16;
const resolveNativeChatUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";
const assertNativeProviderConfigured = () => {
  if (!ENV.forgeApiKey)
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
};

/**
 * Direct-provider fallback.
 *
 * The AI Tutor used to depend on a single upstream provider. When that
 * provider returned "usage exhausted", every tutor reply, every session
 * summary and every trigger digest failed at once for paying learners. The
 * fallback keeps the learner-facing feature alive when the primary provider
 * is unavailable, rate limited, out of credit, or erroring.
 *
 * Tool calls and JSON-schema responses are NOT routed here. Those callers
 * depend on provider-specific response shapes, so they keep failing loudly
 * rather than silently returning a different contract.
 */
const FALLBACK_MODEL = "claude-opus-4-5";
const FALLBACK_URL = "https://api.anthropic.com/v1/messages";
const isFallbackConfigured = () =>
  typeof process.env.ANTHROPIC_API_KEY === "string" &&
  process.env.ANTHROPIC_API_KEY.trim().length > 0;

type AnthropicTextBlock = { type: string; text?: string };
type AnthropicReply = {
  id?: string;
  model?: string;
  content?: AnthropicTextBlock[];
  stop_reason?: string | null;
  usage?: { input_tokens?: number; output_tokens?: number };
};

/** Collapse any message content shape into the plain text the fallback accepts. */
const flattenToText = (content: MessageContent | MessageContent[]): string =>
  ensureArray(content)
    .map(part => {
      if (typeof part === "string") return part;
      if (part.type === "text") return part.text;
      return "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();

async function invokeFallbackLLM(
  params: InvokeParams,
  maxTokens: number
): Promise<InvokeResult> {
  // Anthropic takes the system prompt as a separate field, not as a message.
  const systemPrompt = params.messages
    .filter(message => message.role === "system")
    .map(message => flattenToText(message.content))
    .filter(Boolean)
    .join("\n\n");

  const turns = params.messages
    .filter(message => message.role === "user" || message.role === "assistant")
    .map(message => ({
      role: message.role as "user" | "assistant",
      content: flattenToText(message.content),
    }))
    .filter(message => message.content.length > 0);

  if (turns.length === 0) {
    throw new Error("Fallback provider requires at least one user message");
  }

  const response = await serviceFetch(
    FALLBACK_URL,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: FALLBACK_MODEL,
        max_tokens: maxTokens,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: turns,
      }),
      signal: params.signal,
    },
    { service: "anthropic", timeoutMs: 45_000, maxResponseBytes: 2 * 1024 * 1024 }
  );

  requireServiceSuccess(response, "anthropic");
  const result = await serviceJson<AnthropicReply>(response, "anthropic");
  const text = (result?.content ?? [])
    .filter(block => block?.type === "text" && typeof block.text === "string")
    .map(block => block.text as string)
    .join("")
    .trim();

  if (!text) {
    throw new Error("Fallback AI provider returned no usable completion");
  }

  // Reshaped into the same contract every existing caller already reads.
  return {
    id: result?.id ?? "fallback",
    created: Math.floor(Date.now() / 1000),
    model: result?.model ?? FALLBACK_MODEL,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: result?.stop_reason ?? "stop",
      },
    ],
    usage: {
      prompt_tokens: result?.usage?.input_tokens ?? 0,
      completion_tokens: result?.usage?.output_tokens ?? 0,
      total_tokens:
        (result?.usage?.input_tokens ?? 0) + (result?.usage?.output_tokens ?? 0),
    },
  };
}

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (
    params.maxTokens !== undefined &&
    params.max_tokens !== undefined &&
    params.maxTokens !== params.max_tokens
  ) {
    throw new Error("Conflicting output token limits");
  }
  const resolvedMaxTokens = Math.max(
    NATIVE_MIN_OUTPUT_TOKENS,
    boundedOutputTokens(params.maxTokens ?? params.max_tokens, 2048)
  );

  // Plain text completions can be served by either provider. Tool calls and
  // structured JSON stay on the primary provider only.
  const usesPlainTextContract =
    (!tools || tools.length === 0) &&
    (!normalizedResponseFormat || normalizedResponseFormat.type === "text");
  const canUseFallback = usesPlainTextContract && isFallbackConfigured();

  if (!ENV.forgeApiKey) {
    if (canUseFallback) return invokeFallbackLLM(params, resolvedMaxTokens);
    assertNativeProviderConfigured();
  }

  const payload: Record<string, unknown> = {
    model: NATIVE_MODEL,
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  payload.max_tokens = resolvedMaxTokens;

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  try {
    const response = await serviceFetch(
      resolveNativeChatUrl(),
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${ENV.forgeApiKey}`,
        },
        body: JSON.stringify(payload),
        signal: params.signal,
      },
      { service: "forge", timeoutMs: 45_000, maxResponseBytes: 2 * 1024 * 1024 }
    );

    requireServiceSuccess(response, "forge");
    const result = await serviceJson<InvokeResult>(response, "forge");
    if (
      !Array.isArray(result?.choices) ||
      !result.choices[0]?.message ||
      (!result.choices[0].message.content &&
        !result.choices[0].message.tool_calls?.length)
    ) {
      throw new Error("Native AI provider returned no usable completion");
    }
    return result;
  } catch (primaryError) {
    // A caller cancellation is the learner closing the panel, not an outage.
    if (params.signal?.aborted) throw primaryError;
    if (!canUseFallback) throw primaryError;
    console.error(
      "[LLM] Primary provider unavailable, using fallback provider:",
      primaryError instanceof Error ? primaryError.message : "unknown error"
    );
    return invokeFallbackLLM(params, resolvedMaxTokens);
  }
}
