# Echelon Command

Echelon Command is an adaptive incident simulator for the people responsible for drinking-water safety. It places an operator inside a live control-room scenario, changes plant conditions in response to their decisions, and uses GPT-5.6 to generate a decision-specific after-action review.

This Build Week project is part of Echelon Institute, a preparation and professional-development platform for regulated water and wastewater operators.

## The problem

Operator certification products primarily teach recall through notes, flashcards and multiple-choice questions. Those tools are useful for examinations, but they do not reproduce the pressure of a real plant upset:

- Several process signals change at once.
- One action changes the next decision.
- Operators must verify instruments before acting.
- Treatment barriers must be understood as a system.
- Escalation and documentation matter alongside process control.

Echelon Command teaches that missing layer: operational judgment.

## What the simulator demonstrates

The included Cedar Ridge scenario follows a turbidity breakthrough during an extreme-rain event. The learner must:

1. Respond to a rapid source-water change.
2. Contain a filter breakthrough.
3. Protect the disinfection barrier.
4. Escalate and preserve the incident record.
5. Move from emergency response into verified recovery.

Each choice changes the displayed consequence, the learner's incident timeline and the live state of the plant's barriers, operating reserve or incident record. At the end, GPT-5.6 evaluates the complete decision chain and returns strengths, improvement priorities and a recommended next drill.

## Why GPT-5.6

The simulation engine and scoring rules remain deterministic so safety-critical training does not depend on a model inventing the right answer. GPT-5.6 is used where generative reasoning adds value: synthesizing the learner's full decision history into an individualized after-action review.

The integration uses the OpenAI Responses API with `gpt-5.6`, medium reasoning effort and a bounded evaluation prompt. If an API key is unavailable, the application returns a deterministic offline debrief so the scenario remains fully runnable.

## Built with Codex

Codex was used to inspect the existing Echelon architecture, design the scenario state machine, implement the control-room experience, add the GPT-5.6 Responses API integration, wire the tRPC endpoint, and validate the production build.

## Run locally

Requirements:

- Node.js 20+
- pnpm
- MySQL-compatible `DATABASE_URL` for the complete Echelon platform
- `JWT_SECRET`
- `OPENAI_API_KEY` for personalized GPT-5.6 debriefs

```bash
pnpm install
pnpm dev
```

Open:

```text
http://localhost:3000/command
```

Relevant optional environment configuration:

```bash
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-5.6
```

## Architecture

- `client/src/pages/IncidentCommand.tsx`: scenario, telemetry interface, branching decisions and debrief UI
- `server/routers/incidentCommandRouter.ts`: validated debrief endpoint and fallback evaluator
- `server/_core/openaiResponses.ts`: focused OpenAI Responses API client
- `server/_core/env.ts`: server-only OpenAI configuration

No API key is exposed to the browser. The browser submits only canonical step and choice identifiers. The server reconstructs the authoritative score, labels and consequences before constructing the model input, and the endpoint is covered by the existing AI rate limit.

## Safety boundary

Echelon Command is an educational simulator. It is not a live plant-control system and does not replace approved facility procedures, an emergency response plan, operator judgment or governing requirements.

## Build Week track

Education

The project advances AI for professional education by moving beyond question answering into adaptive, consequence-based practice for a regulated workforce that protects public health.
