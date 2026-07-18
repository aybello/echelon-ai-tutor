# Echelon Command

Echelon Command is an adaptive incident simulator for the people responsible for drinking-water safety. It places an operator inside a live control-room scenario, changes plant conditions in response to their decisions, uses GPT-5.6 to interpret free-text operational judgment, and verifies its decision-specific after-action review against the canonical incident record.

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

The simulator includes four complete scenarios: Cedar Ridge storm response, Millbrook chemical dosing failure, Riverside water-main break and Lakeview boil-water advisory. Cedar Ridge includes the competition's adaptive AI judgment turn. The learner must:

1. Respond to a rapid source-water change.
2. Contain a filter breakthrough.
3. Protect the disinfection barrier.
4. Write the escalation and evidence plan in their own words.
5. Respond to a branch-specific recovery complication caused by that judgment.

At Cedar Ridge's confirmed barrier deviation, GPT-5.6 maps the learner's written judgment to one of three authored safety branches. The next plant development then changes to a controlled recovery, an incomplete incident record or a broken evidence chain. At the end, GPT-5.6 evaluates the complete decision chain and a second model pass checks every factual claim against the canonical record before the review is displayed.

## Why GPT-5.6

The simulation engine and scoring rules remain deterministic so safety-critical training does not depend on a model inventing the right answer. GPT-5.6 is used where language reasoning adds value: interpreting a free-text judgment into an authored branch and synthesizing the learner's full decision history into an individualized after-action review.

The integration uses the OpenAI Responses API with strict JSON Schemas. The low-latency judgment classifier uses low reasoning effort, while debrief generation uses medium reasoning effort. A second structured pass verifies grounding. If judgment AI is unavailable, the interface visibly enters degraded mode and offers the canonical choices. If debrief generation or verification fails, the application returns a deterministic record-grounded review.

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

- `shared/commandScenarios.ts`: canonical scenarios, scoring choices and branch-specific developments shared by client and server
- `client/src/pages/IncidentCommand.tsx`: telemetry interface, written judgment turn, branching incident and verified debrief UI
- `server/routers/incidentCommandRouter.ts`: authoritative timeline evaluator, GPT judgment classifier, grounded debrief verifier and fallback evaluator
- `server/_core/openaiResponses.ts`: focused OpenAI Responses API client
- `server/_core/env.ts`: server-only OpenAI configuration

No API key is exposed to the browser. The browser submits only canonical step and choice identifiers. The server rejects impossible paths and reconstructs the authoritative score, labels and consequences before saving a run or constructing model input. The written judgment can select a branch, but it cannot create points, consequences or safety rules.

Both OAuth and verified email-OTP operators receive server-owned run history, leaderboard persistence and queued follow-up drills. Anonymous visitors can complete a scenario and receive a review, but their score is not persisted.

## Safety boundary

Echelon Command is an educational simulator. It is not a live plant-control system and does not replace approved facility procedures, an emergency response plan, operator judgment or governing requirements.

## Build Week track

Education

The project advances AI for professional education by moving beyond question answering into adaptive, consequence-based practice for a regulated workforce that protects public health.
