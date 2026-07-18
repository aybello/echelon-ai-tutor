# Echelon Command

## Submission profile

**Track:** Education

**Tagline:** AI-powered incident command training for the operators responsible for safe drinking water.

**One-sentence pitch:** Echelon Command puts drinking-water operators inside a live treatment-barrier emergency, interprets their own written judgment with GPT-5.6, changes the incident around that judgment, and verifies the final coaching against the incident record.

## The problem

Water operators carry public-health responsibility, but most digital preparation stops at static questions, reading material and pass/fail scores. Those tools can test recall. They do not reveal whether someone can read a changing plant, preserve multiple treatment barriers, escalate at the right time and maintain a defensible incident record under pressure.

Real emergencies are the wrong place to discover those gaps.

## The solution

Echelon Command is an adaptive emergency simulation for licensed and aspiring drinking-water operators.

The flagship Build Week scenario places the learner in the Cedar Ridge Water Treatment Plant during an extreme-rain event. Raw-water turbidity rises, a filter begins to break through, disinfection margin narrows and a verified barrier deviation requires escalation. At the critical fourth turn, the learner does not pick an answer. They write what they would do and why. GPT-5.6 interprets that judgment, the deterministic engine maps it to an authored safety branch, and the fifth incident development changes around the decision. The same adaptive pattern now powers all four scenarios, covering chemical-feed redundancy, main-break contamination and boil-water-advisory recovery.

The simulator tracks three forms of plant resilience in real time:

- Treatment-barrier integrity
- Available operating reserve
- Incident-record integrity

At the end, GPT-5.6 evaluates the entire decision chain and produces a structured after-action review. A second GPT-5.6 pass checks every factual claim against the canonical incident record. Unsupported reviews are regenerated once and then replaced by a deterministic record-grounded fallback if necessary. The AI does not operate the plant or generate live advice. It interprets and evaluates a closed educational record.

## Why GPT-5.6 is essential

A rule engine controls every valid path, consequence and numeric score. GPT-5.6 handles the parts that static scoring cannot: understanding an operator's own words, mapping them to a safe authored branch and evaluating judgment across a sequence.

The model receives a tightly bounded record containing only:

- The known scenario
- The learner's canonical decision identifiers
- The observed consequence of each decision
- The deterministic score for each decision

It returns strict JSON rather than free-form sections. A separate structured verification pass compares the review with the same canonical record. The server, not the browser or model, calculates and persists the score.

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
- Five-stage incident state machine with three authored final branches
- Live telemetry and process topology
- Cumulative consequence model for barrier, reserve and record health
- Server-authoritative path validation, scoring and run persistence
- Free-text judgment classification with an explicit degraded-mode fallback
- Optional response framework and guided mode for learners who do not know what to type
- OpenAI Responses API with explicit `gpt-5.6`
- Zod validation, bounded prompt inputs and strict JSON Schemas
- Second-pass grounding verification with deterministic fallback
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

### 1:20 to 2:00 | Make GPT-5.6 change the incident

**Visual:** Move through the disinfection decision. At the confirmed barrier deviation, type: "The readings are recovering, so I will keep monitoring and finish the incident log at shift change." Commit the judgment. Show GPT-5.6's rubric, then advance to the new **Leadership finds a record gap** development.

**Narration:**

> Here is where GPT-5.6 becomes part of the simulation itself. I respond in my own words. The model interprets my judgment, but the rule engine owns safety and scoring. Because I delayed escalation and documentation, the next incident is no longer generic. Leadership finds a record gap and a regulator is waiting for the chronology.

### 2:00 to 2:35 | Reveal the verified review

**Visual:** Choose **Keep the incident open, reconstruct the timeline...**, then click **Generate after-action review**. Show the server-owned score, strengths, improvements and **Verified against incident record · GPT-5.6** badge.

**Narration:**

> GPT-5.6 now evaluates the bounded record, then a second model pass checks every factual claim against what actually happened. The visible verification badge means the review cleared that grounding check. If it does not, Echelon regenerates it or serves a deterministic record-grounded review.

### 2:35 to 2:53 | Show the complete loop

**Visual:** Scroll through the decision timeline and recommended next drill.

**Narration:**

> The result is a complete competency loop: incident, consequence, evidence, coaching and the next scenario. A utility or college can see not only whether someone passed, but how they command a failure under pressure.

### 2:53 to 3:00 | Close

**Visual:** End on the after-action review or return to the opening headline.

**Narration:**

> Echelon Command. Train the decisions that protect every drop.

## Recording plan

- Record at 1080p with the browser at 100 percent zoom.
- Use strong decisions 1 to 3, the delayed-documentation written response above, and the best corrective response in the branch-specific final step.
- Keep the cursor still during narration and move only when demonstrating an interaction.
- Use the live GPT-5.6 integration. Confirm the judgment rubric appears and the debrief badge says **Verified against incident record · GPT-5.6** before recording the final take.
- Keep the final upload below three minutes. Target 2:50 to leave room for platform encoding.

## Final submission checklist

- [ ] Set `OPENAI_API_KEY` in the production environment
- [ ] Confirm `OPENAI_MODEL=gpt-5.6`
- [ ] Merge the competition branch into `main` and confirm the production deployment
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
