# AI and outbound-service reliability release

This release addresses audit M10 (LLM routing/output limits) and the production-fetch portion of M11 (outbound deadlines). It requires **no database migration**. It does require explicit Gemini credentials/model configuration before deployment. It does not complete the entire audit.

## Behavior

The Tutor and background text-generation jobs call Google's documented OpenAI-compatible Gemini endpoint directly, using `GEMINI_API_KEY` and `GEMINI_MODEL`. There is no fallback to the Forge LLM endpoint or an unrelated OpenAI key. The existing message, tool, image and JSON-schema interfaces are retained. Configure an approved, currently available model; the application no longer silently chooses a hard-coded model. Optional thinking is disabled for the legacy 2.5 Flash family only; other models keep provider defaults.

Both output-limit spellings are honored, invalid/conflicting limits are rejected before a provider call, the default is 2,048 and the upper bound is 8,192. Existing Tutor and memory calls retain their 1,536/350 limits. Background limits are explicit: study emails 512; editorial topic planning 1,536; article drafting 8,192; editorial review 2,048. The separate OpenAI Responses client keeps its configured model and `store: false`, with the same upper bound and a 1,200-token default. Model reasoning can consume part of a provider's total output budget; verify complete responses for the selected model before switching traffic.

The shared request helper covers all application-owned production `fetch` integrations. The deadline covers receiving headers, consuming the response body, and the optional retry. Streaming byte limits apply even when Content-Length is absent or incorrect. Errors/telemetry omit request URLs, keys, prompts, personal data and provider response text. JSON parse failures are redacted too.

| Integration | Total deadline per request | Response ceiling |
| --- | --- | --- |
| Gemini / OpenAI Responses | 45 seconds | 2 MiB |
| Maps / storage URL lookup / storage proxy / Heartbeat | 10 seconds | 1 MiB |
| Owner notification | 8 seconds | 1 MiB |
| Data API | 15 seconds | 1 MiB |
| Audio download | 20 seconds | 16 MiB |
| Transcription | 60 seconds | 2 MiB |
| Storage upload | 60 seconds | 1 MiB receipt |
| Image generation | 120 seconds | 32 MiB |
| Approved editorial-source fetch | 20 seconds | 2 MiB |

Only explicitly enabled GET/HEAD reads retry, at most once, for network errors or 429/502/503/504. Retry-After values longer than one second are surfaced rather than slept through. POSTs, AI generations, uploads, notifications and schedule mutations are never automatically retried: an interrupted write may already have taken effect. Existing higher-level durable job/webhook recovery remains responsible for deciding whether to retry.

The helper buffers bounded non-streaming responses. Do not use it unchanged for future live-token streaming or arbitrarily large downloads. Deadlines are per request; an image-generation-plus-upload workflow has two separately bounded operations. OAuth already has an Axios timeout; Stripe SDK, SMTP and offline maintenance scripts are outside this fetch-specific change.

## Release sequence

1. Review the exact PR head and complete Quality Gate. No credential, live AI request, production message or database change was made during development.
2. In the intended deployment's server secrets, set a dedicated `GEMINI_API_KEY` and the approved `GEMINI_MODEL`. Never use VITE-prefixed variables for keys. Preserve the existing Forge credentials for storage, maps and other remaining platform services; preserve OpenAI configuration for the incident simulator.
3. Verify account permissions, quota and current model availability using the release operator's approved test account. Do not use a learner's real prompt or customer identity. Check a short Tutor answer, a calculation with readable math, a 350-token memory summary, a structured editorial response and the incident simulator. Automated fixtures validate routing/limits/contracts but cannot certify a particular live account's model access.
4. Deploy only after that configuration/preflight is ready. Missing Gemini configuration produces the existing friendly Tutor connection-failure response rather than silently sending prompts to another provider.
5. Confirm normal learner access, expected bounded failure behavior, response completeness and redacted service-error telemetry. No migration, pricing change, customer message or content-bank activation is part of this release.

Rollback preserves server credentials and requires no schema change. Reverting this code restores the prior Forge text-generation route; make that provider change explicitly rather than assuming rollback preserves direct Gemini routing.

## Verification

Regression tests exercise stalled headers, stalled bodies, cancellation, declared and streamed oversized responses, total retry deadlines, non-retried writes, private error redaction, malformed JSON, provider routing, both token-limit spellings, structured output, storage failures, audio limits, notification deadlines and schedule-write ambiguity. Existing Tutor, memory, editorial and incident-simulator tests remain in the full gate. No live provider was invoked in these tests.

References: [Google Gemini OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai), [Node AbortSignal](https://nodejs.org/api/globals.html#static-method-abortsignalanysignals). Documentation was checked September 16, 2026. Model availability must still be confirmed for the deploying account.
