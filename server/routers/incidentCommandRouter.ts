import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeGPT56 } from "../_core/openaiResponses";

const decisionSchema = z.object({
  stepId: z.string().min(1).max(40),
  stepTitle: z.string().min(1).max(120),
  choiceLabel: z.string().min(1).max(240),
  consequence: z.string().min(1).max(500),
  points: z.number().int().min(0).max(20),
});

const scenarioStepIds = ["source-shift", "filter-breakthrough", "disinfection-risk", "confirmation", "stabilize"] as const;

const commandScenario = {
  "source-shift": {
    title: "The source water changes",
    choices: {
      "verify-optimize": ["Verify the raw-water reading, run a jar test and adjust coagulation from the validated result", "The reading is confirmed. The optimized coagulant dose strengthens floc formation before the load reaches filtration.", 20],
      "dose-blind": ["Immediately double the coagulant dose", "Filtered water holds temporarily, but the unverified dose depresses pH and increases sludge loading.", 8],
      wait: ["Wait for finished-water turbidity to alarm", "The untreated load advances through the plant and consumes the response time available to operators.", 0],
    },
  },
  "filter-breakthrough": {
    title: "Filter 2 begins to break through",
    choices: {
      "isolate-filter": ["Remove Filter 2 from service, preserve the sample and verify performance on the remaining filters", "The breakthrough is isolated. Combined-filter turbidity stabilizes while the team starts a controlled backwash and inspection.", 20],
      "backwash-all": ["Backwash every filter immediately", "The plant loses too much filtration capacity at once and clearwell storage begins falling rapidly.", 6],
      "reduce-alarm": ["Raise the alarm threshold so nuisance alarms stop", "The process deviation continues without containment and the operator loses a critical warning barrier.", 0],
    },
  },
  "disinfection-risk": {
    title: "Disinfection margin narrows",
    choices: {
      "ct-verify": ["Verify analyser accuracy, calculate the current CT margin and make a controlled dose adjustment", "The analyser is valid. A controlled adjustment restores residual while the CT check confirms the barrier remains intact.", 20],
      "maximum-dose": ["Set the chlorine feed to maximum output", "Residual recovers, but the uncontrolled response creates an avoidable high-chlorine condition downstream.", 7],
      "trust-downstream": ["Take no action because distribution residual is still measurable", "Clearwell residual continues falling and the plant approaches loss of verified disinfection performance.", 0],
    },
  },
  confirmation: {
    title: "A verification result arrives",
    choices: {
      "escalate-document": ["Initiate the facility's escalation protocol, preserve records and continue verification sampling", "The incident is formally controlled. Notifications, samples, operator actions and instrument checks are preserved in one defensible timeline.", 20],
      "log-later": ["Continue monitoring and complete the incident log at the end of the shift", "The plant remains stable, but delayed escalation creates gaps in the official response record.", 6],
      "delete-alarm": ["Acknowledge and delete the alarm because the readings are recovering", "The event loses its auditable trail and the organization cannot demonstrate when the deviation was recognized or controlled.", 0],
    },
  },
  stabilize: {
    title: "Move from response to recovery",
    choices: {
      "recovery-gate": ["Hold the recovery state until verification criteria are met, then conduct a documented after-action review", "The plant closes the event with verified stability, a complete timeline and clear actions for the next extreme-weather event.", 20],
      "normal-now": ["Return immediately to normal setpoints and staffing", "The plant recovers, but rapid normalization reduces monitoring during the period when rebound effects are still possible.", 7],
      "keep-emergency": ["Keep emergency settings indefinitely", "The plant remains safe but accumulates chemical, residual and filter-loading problems from an unnecessarily prolonged emergency state.", 3],
    },
  },
} as const;

const submittedDecisionSchema = z.object({
  stepId: z.enum(scenarioStepIds),
  choiceId: z.string().min(1).max(40),
});

export const submittedScenarioSchema = z.array(submittedDecisionSchema).length(scenarioStepIds.length).superRefine((decisions, context) => {
  decisions.forEach((decision, index) => {
    if (decision.stepId !== scenarioStepIds[index]) {
      context.addIssue({ code: "custom", path: [index, "stepId"], message: "Decision sequence does not match the scenario" });
    }
    const step = commandScenario[decision.stepId];
    if (!(decision.choiceId in step.choices)) {
      context.addIssue({ code: "custom", path: [index, "choiceId"], message: "Unknown decision for this scenario step" });
    }
  });
});

export function evaluateSubmittedDecisions(submissions: z.infer<typeof submittedScenarioSchema>) {
  return submissions.map(submission => {
    const step = commandScenario[submission.stepId];
    const choice = step.choices[submission.choiceId as keyof typeof step.choices] as readonly [string, string, number];
    return decisionSchema.parse({
      stepId: submission.stepId,
      stepTitle: step.title,
      choiceLabel: choice[0],
      consequence: choice[1],
      points: choice[2],
    });
  });
}

export function fallbackDebrief(score: number, decisions: z.infer<typeof decisionSchema>[]) {
  const strongest = [...decisions].sort((a, b) => b.points - a.points)[0];
  const weakest = [...decisions].sort((a, b) => a.points - b.points)[0];
  const level = score >= 85 ? "incident-command ready" : score >= 65 ? "developing operator" : "operator in remediation";

  return {
    summary: `You finished as a ${level}. Your strongest decision was “${strongest?.choiceLabel ?? "the initial response"}.” Your greatest improvement opportunity came during ${weakest?.stepTitle ?? "the response sequence"}.`,
    strengths: [
      "You maintained a process-wide view instead of reacting to a single instrument.",
      strongest?.consequence ?? "You selected a defensible control action.",
    ],
    improvements: [
      weakest?.consequence ?? "Verify critical readings before escalating treatment changes.",
      "State the verification sample, escalation path and documentation step together.",
    ],
    nextDrill: score >= 85 ? "Distribution pressure-loss and contamination response" : "Coagulation, filter breakthrough and CT verification",
    generatedBy: "rules-engine" as const,
  };
}

export function parseSections(text: string, score: number, decisions: z.infer<typeof decisionSchema>[]) {
  const fallback = fallbackDebrief(score, decisions);
  const normalizedText = text.replace(/\*\*/g, "");
  const section = (name: string) => {
    const match = normalizedText.match(new RegExp(`${name}:\\s*([\\s\\S]*?)(?=\\n[A-Z][A-Z ]+:|$)`, "i"));
    return match?.[1]?.trim() ?? "";
  };
  const list = (name: string) => section(name)
    .split(/\n+/)
    .map(line => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);

  return {
    summary: section("SUMMARY") || fallback.summary,
    strengths: list("STRENGTHS").length ? list("STRENGTHS") : fallback.strengths,
    improvements: list("IMPROVEMENTS").length ? list("IMPROVEMENTS") : fallback.improvements,
    nextDrill: section("NEXT DRILL") || fallback.nextDrill,
    generatedBy: "gpt-5.6" as const,
  };
}

export const incidentCommandRouter = router({
  debrief: publicProcedure
    .input(z.object({ decisions: submittedScenarioSchema }))
    .mutation(async ({ input }) => {
      const decisions = evaluateSubmittedDecisions(input.decisions);
      const score = decisions.reduce((sum, decision) => sum + decision.points, 0);
      const fallback = fallbackDebrief(score, decisions);
      const timeline = decisions
        .map((decision, index) => `${index + 1}. ${decision.stepTitle}\nDecision: ${decision.choiceLabel}\nObserved consequence: ${decision.consequence}\nScore: ${decision.points}/20`)
        .join("\n\n");

      const prompt = `You are Echelon Command, an expert training evaluator for licensed drinking-water operators. This is an EDUCATIONAL SIMULATION, not live operational advice. Evaluate the learner only from the supplied scenario record. Be exact, calm, concise and constructive. Do not invent regulations, readings or actions.\n\nSCENARIO: Cedar Ridge drinking-water plant turbidity breakthrough during an extreme-rain event.\nFINAL SCORE: ${score}/100\n\nDECISION RECORD:\n${timeline}\n\nReturn exactly these sections with no markdown table:\nSUMMARY: 2 to 3 sentences assessing the operator's command judgment.\nSTRENGTHS:\n- two specific strengths tied to their decisions\nIMPROVEMENTS:\n- two specific improvements tied to their decisions\nNEXT DRILL: one concise recommended follow-up simulation.`;

      try {
        const text = await invokeGPT56(prompt);
        return parseSections(text, score, decisions);
      } catch (error) {
        console.warn("[Echelon Command] GPT-5.6 debrief unavailable; using deterministic fallback.", error);
        return fallback;
      }
    }),
});
