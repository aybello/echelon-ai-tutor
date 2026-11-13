# AI and outbound-service reliability release

This release addresses audit M10 (LLM routing/output limits) and the production-fetch portion of M11 (outbound deadlines). It requires **no database migration** and no separately managed Gemini credential or model configuration. It does not complete the entire audit.

## Behavior

The Tutor and background text-generation jobs use the platform-native server-side AI endpoint with the approved `claude-opus-4-7` model. The application uses the platform-managed `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` credentials, so no separate Google credential reaches the release configuration. The existing message, tool, image and JSON-schema interfaces are retained. The model is explicitly pinned in code and must be reviewed before a future change.

Both output-limit spellings are honored, invalid/conflicting limits are rejected before a provider call, the default is 2,048 and the upper bound is 8,192. The native endpoint requires at least 16 output tokens, so smaller valid caller limits are raised to that minimum. Existing Tutor and memory calls retain their 1,536/350 limits. Background limits are explicit: study emails 512; editorial topic planning 1,536; article drafting 8,192; editorial review 2,048. The separate OpenAI Responses client keeps its configured model and `store: false`, with the same upper bound and a 1,200-token default. Model reasoning can consume part of a provider's total output budget; verify complete responses for the selected model before switching traffic.

The shared request helper covers all application-owned production `fetch` integrations. The deadline covers receiving headers, consuming the response body, and the optional retry. Streaming byte limits apply even when Content-Length is absent or incorrect. Errors/telemetry omit request URLs, keys, prompts, personal data and provider response text. JSON parse failures are redacted too.

| Integration | Total deadline per request | Response ceiling |
| --- | --- | --- |
| Native AI / OpenAI Responses | 45 seconds | 2 MiB |
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
2. Verify that the deployment supplies the platform-managed `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY`. Do not add `GEMINI_API_KEY` or `GEMINI_MODEL`; preserve OpenAI configuration for the incident simulator.
3. Using approved test input only, check a short Tutor answer, a calculation with readable math, a 350-token memory summary, a structured editorial response and the incident simulator. Automated fixtures validate routing/limits/contracts but cannot certify a particular live account's response quality or availability.
4. Deploy only after that configuration/preflight is ready. A missing native platform credential produces the existing friendly Tutor connection-failure response rather than silently sending prompts to another provider.
5. Confirm normal learner access, expected bounded failure behavior, response completeness and redacted service-error telemetry. No migration, pricing change, customer message or content-bank activation is part of this release.

Rollback requires no schema change. Reverting this code restores the former direct-Gemini implementation and reintroduces its external configuration dependency, so prefer a forward fix unless a platform-native provider incident requires immediate rollback.

## Verification

Regression tests exercise stalled headers, stalled bodies, cancellation, declared and streamed oversized responses, total retry deadlines, non-retried writes, private error redaction, malformed JSON, provider routing, both token-limit spellings, structured output, storage failures, audio limits, notification deadlines and schedule-write ambiguity. Existing Tutor, memory, editorial and incident-simulator tests remain in the full gate. No live provider was invoked in these tests.

References: [Node AbortSignal](https://nodejs.org/api/globals.html#static-method-abortsignalanysignals). Documentation was checked September 16, 2026. Native model availability must still be confirmed in the platform catalog before a future model change.
