# Echelon Command

## Submission profile

**Track:** Education

**Tagline:** AI-powered incident command training for the operators responsible for safe drinking water.

**One-sentence pitch:** Echelon Command puts drinking-water operators inside a live treatment-barrier emergency, makes every decision change the plant, and uses GPT-5.6 to turn the complete response into a personalized after-action review.

## The problem

Water operators carry public-health responsibility, but most digital preparation stops at static questions, reading material and pass/fail scores. Those tools can test recall. They do not reveal whether someone can read a changing plant, preserve multiple treatment barriers, escalate at the right time and maintain a defensible incident record under pressure.

Real emergencies are the wrong place to discover those gaps.

## The solution

Echelon Command is an adaptive emergency simulation for licensed and aspiring drinking-water operators.

The Build Week scenario places the learner in the Cedar Ridge Water Treatment Plant during an extreme-rain event. Raw-water turbidity rises, a filter begins to break through, disinfection margin narrows and a verified barrier deviation requires escalation. Across five critical decisions, the learner must interpret live telemetry, choose a control action and observe the operational consequence.

The simulator tracks three forms of plant resilience in real time:

- Treatment-barrier integrity
- Available operating reserve
- Incident-record integrity

At the end, GPT-5.6 evaluates the entire decision chain and produces a bounded after-action review with specific strengths, improvements and a recommended next drill. The AI does not operate the plant or generate live advice. It evaluates a closed educational record.

## Why GPT-5.6 is essential

A rule engine controls the scenario, consequences and numeric score. GPT-5.6 handles the part that static scoring cannot: evaluating judgment across a sequence.

The model receives a tightly bounded record containing only:

- The known scenario
- The learner's five decisions
- The observed consequence of each decision
- The deterministic score for each decision

It is instructed not to invent regulations, readings or actions. It must return a fixed assessment contract: summary, strengths, improvements and next drill. A deterministic fallback keeps the product functional if the model is unavailable, while the live competition demo should use the GPT-5.6 response.

## What Codex built

Codex was used as the primary engineering environment for the Build Week feature. It helped:

- Inspect the existing Echelon architecture and integrate without replacing the current learning platform
- Design the incident state machine, decision model and plant-consequence system
- Build the responsive SCADA-inspired React experience
- Add the server-side OpenAI Responses API integration for GPT-5.6
- Build and test the structured debrief parser and offline fallback
- Add navigation, architecture documentation and competition setup instructions
- Run TypeScript, focused unit tests and production build verification

**Codex Session ID for `/feedback`:** `[ADD CURRENT SESSION ID]`

## Technical implementation

- React 19 and TypeScript client
- Five-stage deterministic incident state machine
- Live telemetry and process topology
- Cumulative consequence model for barrier, reserve and record health
- tRPC server boundary for debrief generation
- OpenAI Responses API with explicit `gpt-5.6`
- Zod validation and bounded prompt inputs
- Structured GPT response parsing with section-level fallback
- Responsive interface with no additional client dependency

## Design principles

1. **Consequences before commentary.** The plant changes immediately after a decision. AI explains the full pattern only after the scenario.
2. **Operational realism without pretending to be operational software.** The interface evokes a control room while clearly remaining a training simulation.
3. **A defensible safety boundary.** The model receives a closed record and is told not to provide live operating advice or invent requirements.
4. **A complete product loop.** Briefing, telemetry, decision, consequence, score, debrief and next drill exist in one experience.

## Potential impact

The first scenario targets drinking-water treatment, but the interaction model can support wastewater, electrical, HVAC, gas, fire protection and other regulated fields where the quality of a decision sequence matters more than recall alone.

The long-term product is a scenario authoring and competency platform for training providers, utilities, colleges and regulated employers. Organizations could assign incidents, compare decision patterns across teams and identify the exact barrier-management skills that need retraining before a real event.

## Three-minute demo script

### 0:00 to 0:18 | The hook

**Visual:** Begin on the Echelon Command landing screen.

**Narration:**

> Drinking-water operators protect public health, but you cannot learn incident command from a question bank. Echelon Command puts an operator inside the failure, makes every choice change the plant and uses GPT-5.6 to explain the judgment behind the response.

### 0:18 to 0:38 | Enter the control room

**Visual:** Click **Enter the control room**. Pause on the process topology and telemetry.

**Narration:**

> A severe rain event has changed the source water at Cedar Ridge. This is a live five-decision simulation. The operator must read the treatment process, preserve its barriers and maintain a defensible incident record.

### 0:38 to 1:20 | Show consequence, not trivia

**Visual:** Select the best first decision. Show the plant consequence. Advance to Filter 2. Select the middle or poor response so the live plant-state bars visibly deteriorate.

**Narration:**

> The scenario is deterministic where safety and scoring matter. Each action has an authored operational consequence. Watch what happens when I backwash every filter instead of isolating the failed unit: operating reserve falls immediately. This is not a chatbot asking what I would do. It is a stateful training environment responding to what I did.

### 1:20 to 1:55 | Complete the incident

**Visual:** Move quickly through the remaining decisions. Choose one imperfect escalation decision to create a useful debrief.

**Narration:**

> The learner also has to verify disinfection margin, escalate a confirmed barrier deviation and define evidence-based recovery criteria. Echelon records the entire decision chain, including what the operator prioritized, verified and documented.

### 1:55 to 2:30 | Reveal GPT-5.6

**Visual:** Click **Generate after-action review**. Show the score, GPT-5.6 label, strengths and improvements.

**Narration:**

> GPT-5.6 now evaluates that bounded record. The rule engine owns the scenario and score. The model does what static scoring cannot: it finds the pattern across the response and gives specific coaching tied to the actual decisions. It cannot invent readings, actions or regulations, and the simulator remains usable with a deterministic fallback.

### 2:30 to 2:53 | Show the complete loop

**Visual:** Scroll through the decision timeline and recommended next drill.

**Narration:**

> The result is a complete competency loop: incident, consequence, evidence, coaching and the next scenario. A utility or college can see not only whether someone passed, but how they command a failure under pressure.

### 2:53 to 3:00 | Close

**Visual:** End on the after-action review or return to the opening headline.

**Narration:**

> Echelon Command. Train the decisions that protect every drop.

## Recording plan

- Record at 1080p with the browser at 100 percent zoom.
- Seed the demo with a mixed response: strong decisions 1, 3 and 5; imperfect decisions 2 and 4.
- Keep the cursor still during narration and move only when demonstrating an interaction.
- Use the live GPT-5.6 integration. Confirm the debrief badge says **Personalized by GPT-5.6** before recording the final take.
- Keep the final upload below three minutes. Target 2:50 to leave room for platform encoding.

## Final submission checklist

- [ ] Set `OPENAI_API_KEY` in the production environment
- [ ] Confirm `OPENAI_MODEL=gpt-5.6`
- [ ] Deploy the `codex/build-week-command` branch or merge it into the production branch
- [ ] Complete one full production scenario and confirm the GPT-5.6 badge
- [ ] Record and publish a public YouTube demo under three minutes
- [ ] Add the public repository URL and working application URL to Devpost
- [ ] Add screenshots of the control room and after-action review
- [ ] Replace the Codex Session ID placeholder above
- [ ] Submit `/feedback` from the session where the core feature was built
- [ ] Verify the submission category is **Education**
- [ ] Submit before July 21, 2026 at 5:00 PM PDT

## Safety statement

Echelon Command is an educational simulation. It does not monitor a live facility, control treatment equipment or replace approved procedures, facility emergency plans, supervisory direction or governing requirements.
