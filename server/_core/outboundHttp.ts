/** Bounded, non-streaming service requests. Deadlines cover headers AND body consumption. */
export type OutboundService =
  | "gemini"
  | "openai"
  | "maps"
  | "notification"
  | "storage"
  | "image"
  | "transcription"
  | "audio"
  | "data"
  | "heartbeat"
  | "editorial-source";
export type RequestPolicy = {
  service: OutboundService;
  timeoutMs: number;
  maxResponseBytes?: number;
  retryRead?: boolean;
};
export class OutboundError extends Error {
  constructor(
    readonly service: OutboundService,
    readonly kind:
      | "timeout"
      | "cancelled"
      | "network"
      | "too_large"
      | "http"
      | "invalid_json",
    readonly status?: number
  ) {
    super(
      `${service} request ${kind}${status === undefined ? "" : ` (${status})`}`
    );
    this.name = "OutboundError";
  }
}

export async function serviceFetch(
  url: string | URL,
  init: RequestInit,
  policy: RequestPolicy
): Promise<Response> {
  const maxBytes = policy.maxResponseBytes ?? 1024 * 1024;
  if (
    !Number.isSafeInteger(policy.timeoutMs) ||
    policy.timeoutMs <= 0 ||
    policy.timeoutMs > 120_000 ||
    !Number.isSafeInteger(maxBytes) ||
    maxBytes <= 0 ||
    maxBytes > 32 * 1024 * 1024
  )
    throw new Error("Invalid outbound request budget");
  const controller = new AbortController();
  const signal = init.signal
    ? AbortSignal.any([controller.signal, init.signal])
    : controller.signal;
  const timeout = setTimeout(() => controller.abort(), policy.timeoutMs);
  const started = Date.now();
  let attempt = 0;
  const interruptedError = () =>
    new OutboundError(
      policy.service,
      controller.signal.aborted ? "timeout" : "cancelled"
    );
  const withinBudget = <T>(work: Promise<T>): Promise<T> =>
    new Promise((resolve, reject) => {
      // Remove the listener after each read instead of accumulating handlers on a shared promise.
      const onAbort = () => {
        signal.removeEventListener("abort", onAbort);
        reject(interruptedError());
      };
      if (signal.aborted) {
        void work.catch(() => {});
        reject(interruptedError());
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });
      work.then(
        value => {
          signal.removeEventListener("abort", onAbort);
          resolve(value);
        },
        error => {
          signal.removeEventListener("abort", onAbort);
          reject(error);
        }
      );
    });
  const pause = async (ms: number) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await withinBudget(
        new Promise(resolve => {
          timer = setTimeout(resolve, ms);
        })
      );
    } finally {
      clearTimeout(timer);
    }
  };
  const canRetry =
    policy.retryRead &&
    ["GET", "HEAD"].includes((init.method ?? "GET").toUpperCase());
  try {
    if (signal.aborted) throw new OutboundError(policy.service, "cancelled");
    while (true) {
      attempt++;
      let response: Response;
      try {
        response = await withinBudget(fetch(url, { ...init, signal }));
      } catch (error) {
        if (error instanceof OutboundError) throw error;
        if (canRetry && attempt === 1) {
          await pause(250);
          continue;
        }
        throw new OutboundError(policy.service, "network");
      }
      if (
        canRetry &&
        attempt === 1 &&
        [429, 502, 503, 504].includes(response.status)
      ) {
        await withinBudget(
          response.body?.cancel().catch(() => {}) ?? Promise.resolve()
        );
        // Respect Retry-After without allowing it to extend the operation's deadline.
        const raw = response.headers.get("retry-after");
        const wait = raw
          ? /^\d+$/.test(raw)
            ? Number(raw) * 1000
            : Date.parse(raw) - Date.now()
          : 250;
        if (Number.isFinite(wait) && wait >= 0 && wait <= 1000) {
          await pause(wait);
          continue;
        }
        throw new OutboundError(policy.service, "http", response.status);
      }
      if (Number(response.headers.get("content-length")) > maxBytes) {
        void response.body?.cancel().catch(() => {});
        throw new OutboundError(policy.service, "too_large");
      }
      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        if (reader)
          while (true) {
            const part = await withinBudget(reader.read());
            if (part.done) break;
            size += part.value.byteLength;
            if (size > maxBytes)
              throw new OutboundError(policy.service, "too_large");
            chunks.push(part.value);
          }
      } catch (error) {
        void reader?.cancel().catch(() => {});
        throw error;
      } finally {
        reader?.releaseLock();
      }
      const body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return new Response(
        [204, 205, 304].includes(response.status) ? null : body,
        {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        }
      );
    }
  } catch (error) {
    const safe =
      error instanceof OutboundError
        ? error
        : new OutboundError(
            policy.service,
            signal.aborted
              ? controller.signal.aborted
                ? "timeout"
                : "cancelled"
              : "network"
          );
    // Never log URLs, headers, prompts, provider response bodies, or raw errors.
    console.warn("[outbound]", {
      service: safe.service,
      kind: safe.kind,
      status: safe.status,
      attempt,
      elapsedMs: Date.now() - started,
    });
    throw safe;
  } finally {
    clearTimeout(timeout);
  }
}

export function requireServiceSuccess(
  response: Response,
  service: OutboundService
) {
  if (!response.ok) throw new OutboundError(service, "http", response.status);
}

export function boundedOutputTokens(
  value: number | undefined,
  fallback: number,
  maximum = 8192
) {
  const requested = value ?? fallback;
  if (!Number.isSafeInteger(requested) || requested < 1)
    throw new Error("Output token limit must be a positive integer");
  return Math.min(requested, maximum);
}

/** JSON parse errors can contain snippets of a private provider response. */
export async function serviceJson<T = unknown>(
  response: Response,
  service: OutboundService
): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new OutboundError(service, "invalid_json");
  }
}
