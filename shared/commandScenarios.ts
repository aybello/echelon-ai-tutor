/**
 * Echelon Command scenario library shared by the browser and server.
 * Each scenario follows the same data shape as the original Cedar Ridge storm scenario.
 * Scenarios are referenced by ID in the router and the UI.
 */

export type Telemetry = {
  label: string;
  value: string;
  unit: string;
  status: "normal" | "warning" | "critical";
  trend: number[];
};

export type Choice = {
  id: string;
  label: string;
  rationale: string;
  points: number;
  consequence: string;
};

export type JudgmentRubric = {
  verifiedBeforeActing: boolean;
  barrierPreserved: boolean;
  escalationInitiated: boolean;
  recordDefensible: boolean;
};

export type JudgmentConfig = {
  prompt: string;
  placeholder: string;
  minCharacters: number;
  ruleBranches: {
    strong: string;
    partial: string;
    unsafe: string;
  };
};

export type ScenarioStep = {
  id: string;
  time: string;
  title: string;
  briefing: string;
  alarm: string;
  focusNode: number;
  telemetry: Telemetry[];
  choices: Choice[];
  judgment?: JudgmentConfig;
  branchSteps?: Record<string, ScenarioStep>;
};

export type ScenarioMeta = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  durationLabel: string;
  facilityName: string;
  incidentLabel: string;
  processNodes: string[];
  steps: ScenarioStep[];
};

// ─── Scenario 1: Cedar Ridge — Storm Response ───────────────────────────────
export const CEDAR_RIDGE_STORM: ScenarioMeta = {
  id: "cedar-ridge-storm",
  title: "Cedar Ridge Storm Response",
  subtitle: "Heavy rain causes a turbidity spike at the plant intake",
  badge: "Filtration & Disinfection",
  durationLabel: "8-minute scenario",
  facilityName: "Cedar Ridge WTP",
  incidentLabel: "Storm event — turbidity rising at intake",
  processNodes: ["Raw intake", "Coagulation", "Filtration", "Clearwell", "Distribution"],
  steps: [
    {
      id: "source-shift",
      time: "02:14",
      title: "Raw water quality is changing fast",
      briefing: "A heavy rainstorm hit the watershed. Raw turbidity is climbing quickly. Finished water still looks fine for now, but the dirty water is on its way through the plant.",
      alarm: "HIGH RATE OF CHANGE: RAW TURBIDITY",
      focusNode: 0,
      telemetry: [
        { label: "Raw turbidity", value: "28.4", unit: "NTU", status: "critical", trend: [3, 5, 8, 13, 19, 28] },
        { label: "Filtered turbidity", value: "0.18", unit: "NTU", status: "normal", trend: [0.12, 0.12, 0.13, 0.15, 0.16, 0.18] },
        { label: "Plant flow", value: "18.2", unit: "ML/d", status: "normal", trend: [18, 18, 18, 18, 18, 18] },
        { label: "Free chlorine", value: "1.12", unit: "mg/L", status: "normal", trend: [1.18, 1.16, 1.15, 1.14, 1.13, 1.12] },
      ],
      choices: [
        { id: "verify-optimize", label: "Grab a raw sample to confirm the reading, run a jar test, and adjust coagulant based on the result before the slug reaches filtration", rationale: "Verifying the instrument first avoids reacting to a false alarm, and the jar test gives a defensible dose target for the actual water quality.", points: 20, consequence: "The reading is confirmed real. The jar-test-matched dose builds strong floc ahead of the turbidity slug, keeping filtered water well within limits." },
        { id: "dose-blind", label: "Increase coagulant by 40% immediately based on the SCADA trend, then run a jar test to fine-tune once the dose is flowing", rationale: "The rate of change is steep enough that waiting for a jar test could let untreated water reach the filters — better to act on the trend and verify after.", points: 8, consequence: "The quick increase catches most of the turbidity, but the unverified dose overshoots pH and creates heavy sludge blanket in the clarifier." },
        { id: "wait", label: "Reduce plant flow by 20% to extend the hydraulic detention time, giving the existing dose more contact time to handle the rising turbidity", rationale: "Slowing flow buys time without changing chemical settings — the current dose may be adequate if the water moves through more slowly.", points: 0, consequence: "Flow reduction buys minutes, but the turbidity is rising faster than detention can compensate. The slug reaches filters with inadequate treatment." },
      ],
    },
    {
      id: "filter-breakthrough",
      time: "02:31",
      title: "Filter 2 is failing",
      briefing: "Your coagulant adjustment helped, but Filter 2 is getting worse faster than the others. Its effluent turbidity and headloss are both going up.",
      alarm: "FILTER 2 TURBIDITY HIGH-HIGH",
      focusNode: 2,
      telemetry: [
        { label: "Filter 2 effluent", value: "0.42", unit: "NTU", status: "critical", trend: [0.16, 0.18, 0.21, 0.28, 0.35, 0.42] },
        { label: "Filter 2 headloss", value: "2.7", unit: "m", status: "warning", trend: [1.2, 1.4, 1.7, 2, 2.4, 2.7] },
        { label: "Combined effluent", value: "0.24", unit: "NTU", status: "warning", trend: [0.14, 0.15, 0.17, 0.19, 0.22, 0.24] },
        { label: "Clearwell level", value: "74", unit: "%", status: "normal", trend: [77, 77, 76, 75, 74, 74] },
      ],
      choices: [
        { id: "isolate-filter", label: "Take Filter 2 offline immediately, collect a grab sample for lab confirmation, and verify remaining filters have capacity before redistributing flow", rationale: "Isolating the failing unit stops it from contaminating the combined stream, while the capacity check ensures you don't overload the others.", points: 20, consequence: "The breakthrough is contained. Combined turbidity stabilizes while the team backwashes and inspects Filter 2 under controlled conditions." },
        { id: "backwash-all", label: "Initiate an emergency backwash on Filter 2 while keeping it online, and monitor whether the effluent improves within the next wash cycle", rationale: "A backwash-in-place may restore the media without losing capacity — taking it offline during a storm reduces your treatment margin.", points: 6, consequence: "The backwash helps briefly, but the underlying breakthrough continues because the media is overwhelmed. Combined turbidity keeps rising during the wash." },
        { id: "reduce-alarm", label: "Reduce plant flow to lower the loading rate on all filters equally, buying time for Filter 2 to stabilize without taking anything offline", rationale: "Lower hydraulic loading reduces the stress on all filters simultaneously and avoids the risk of losing capacity during a storm event.", points: 0, consequence: "Flow reduction slows the rate of rise but doesn't stop the breakthrough. Filter 2 continues contaminating the combined output while you wait." },
      ],
    },
    {
      id: "disinfection-risk",
      time: "02:47",
      title: "Chlorine residual is dropping",
      briefing: "The plant is running steadily, but chlorine demand went up and the clearwell residual is falling. You're not sure if you still have enough contact time (CT) for proper disinfection.",
      alarm: "LOW DISINFECTION RESIDUAL",
      focusNode: 3,
      telemetry: [
        { label: "Clearwell residual", value: "0.32", unit: "mg/L", status: "critical", trend: [0.96, 0.81, 0.67, 0.53, 0.41, 0.32] },
        { label: "Clearwell level", value: "68", unit: "%", status: "normal", trend: [74, 73, 72, 70, 69, 68] },
        { label: "Plant pH", value: "7.3", unit: "pH", status: "normal", trend: [7.4, 7.4, 7.3, 7.3, 7.3, 7.3] },
        { label: "Distribution residual", value: "0.61", unit: "mg/L", status: "warning", trend: [0.82, 0.79, 0.74, 0.69, 0.65, 0.61] },
      ],
      choices: [
        { id: "ct-verify", label: "Verify the analyser with a DPD grab sample, calculate actual CT at current flow and level, then make a measured dose increase to restore the target residual", rationale: "The analyser could be drifting after the turbidity event. Confirming the reading and calculating CT tells you whether disinfection is actually at risk before you change anything.", points: 20, consequence: "The analyser is confirmed accurate. The CT calculation shows you're still compliant but trending toward the limit. A measured dose increase restores margin without overshooting." },
        { id: "maximum-dose", label: "Increase chlorine feed by 30% immediately based on the trend, then take a grab sample in 15 minutes to confirm the new residual is adequate", rationale: "The residual is falling fast and CT margin is shrinking — a prompt increase stops the decline while the follow-up sample confirms you've restored the barrier.", points: 7, consequence: "Residual recovers quickly, but the increase was more than needed. Downstream customers report taste and odour complaints within the hour." },
        { id: "trust-downstream", label: "Reduce plant output flow to increase detention time in the clearwell, which raises effective CT without changing the chlorine dose", rationale: "More contact time at the same residual achieves the same CT target — and avoids the risk of over-chlorinating during a turbidity event.", points: 0, consequence: "Flow reduction increases detention time, but the residual is still falling because chlorine demand hasn't changed. CT drops below the required minimum before the flow change takes effect." },
      ],
    },
    {
      id: "confirmation",
      time: "03:06",
      title: "Lab sample confirms the problem",
      briefing: "A retained sample confirms the turbidity excursion actually happened. The plant is stable now, but this event needs to be formally reported and documented.",
      alarm: "BARRIER DEVIATION CONFIRMED",
      focusNode: 4,
      telemetry: [
        { label: "Finished turbidity", value: "0.31", unit: "NTU", status: "warning", trend: [0.18, 0.22, 0.27, 0.34, 0.33, 0.31] },
        { label: "Free chlorine", value: "0.78", unit: "mg/L", status: "normal", trend: [0.32, 0.41, 0.54, 0.66, 0.73, 0.78] },
        { label: "Distribution pressure", value: "486", unit: "kPa", status: "normal", trend: [489, 488, 487, 487, 486, 486] },
        { label: "Open critical alarms", value: "1", unit: "alarm", status: "warning", trend: [1, 2, 3, 3, 2, 1] },
      ],
      choices: [
        { id: "escalate-document", label: "Initiate the formal escalation protocol now, preserve all SCADA screenshots and samples as evidence, and continue verification sampling until stability criteria are met", rationale: "The confirmed excursion triggers a regulatory reporting obligation. Starting the protocol immediately preserves the timeline integrity and keeps verification running in parallel.", points: 20, consequence: "The incident is formally controlled. Notifications, samples, and operator actions are all recorded in one clear timeline with no gaps." },
        { id: "log-later", label: "Document the current stable readings and your corrective actions in the shift log, then compile the formal incident report at end of shift when you have time to do it properly", rationale: "A thorough report written with all the data in hand is more accurate than one rushed mid-event. The shift log captures the key facts in the meantime.", points: 6, consequence: "The shift log captures some information, but the delayed formal report creates timing gaps that weaken the record if audited." },
        { id: "delete-alarm", label: "Acknowledge and close the barrier deviation alarm since readings are now recovering, and note the event in the daily operations summary for management review", rationale: "The alarm served its purpose — it alerted you to the problem. Now that readings are recovering, clearing it reduces alarm fatigue and the daily summary informs management.", points: 0, consequence: "Acknowledging the alarm removes it from the active queue and the system audit trail. The daily summary lacks the detail needed for regulatory reporting." },
      ],
      judgment: {
        prompt: "You are the operator in charge. What do you do next and why? Include what you check, who you call, and what records you keep.",
        placeholder: "First I would check... Then I would call... I would make sure to record...",
        minCharacters: 20,
        ruleBranches: {
          strong: "escalate-document",
          partial: "log-later",
          unsafe: "delete-alarm",
        },
      },
      branchSteps: {
        "escalate-document": {
          id: "stabilize-controlled",
          time: "03:28",
          title: "Controlled recovery",
          briefing: "Your escalation brought the duty manager and compliance lead into the response. The treatment barriers are stable and the timeline is up to date. Leadership asks: when can we close this event?",
          alarm: "RECOVERY CRITERIA REVIEW",
          focusNode: 3,
          telemetry: [
            { label: "Raw turbidity", value: "16.2", unit: "NTU", status: "warning", trend: [28, 27, 25, 22, 19, 16] },
            { label: "Filtered turbidity", value: "0.16", unit: "NTU", status: "normal", trend: [0.31, 0.27, 0.23, 0.2, 0.18, 0.16] },
            { label: "Verified samples", value: "3", unit: "clear", status: "normal", trend: [0, 0, 1, 1, 2, 3] },
            { label: "Open record gaps", value: "0", unit: "items", status: "normal", trend: [4, 4, 3, 2, 1, 0] },
          ],
          choices: [
            { id: "recovery-gate", label: "Wait until all verification criteria are met, then do a documented after-action review", rationale: "Recovery is a controlled step — you need evidence that things are truly stable before closing.", points: 20, consequence: "The plant closes the event with verified stability, a complete timeline, and clear lessons for next time." },
            { id: "normal-now", label: "Go back to normal setpoints and staffing right away", rationale: "The major alarms are gone and things look stable.", points: 7, consequence: "Quick return to normal, but you lose monitoring during the period when problems could still bounce back." },
            { id: "keep-emergency", label: "Stay in emergency mode indefinitely", rationale: "Being cautious is always safer after a serious event.", points: 3, consequence: "Staying in emergency mode too long creates chemical and filter problems of its own." },
          ],
        },
        "log-later": {
          id: "stabilize-record-gap",
          time: "03:28",
          title: "Leadership finds missing records",
          briefing: "The process stabilized, but the duty manager can't match up the alarm time, sample time, and escalation sequence. A regulator wants the incident timeline before they'll approve recovery.",
          alarm: "INCIDENT RECORD INCOMPLETE",
          focusNode: 4,
          telemetry: [
            { label: "Filtered turbidity", value: "0.17", unit: "NTU", status: "normal", trend: [0.31, 0.28, 0.24, 0.21, 0.19, 0.17] },
            { label: "Unlogged actions", value: "4", unit: "items", status: "critical", trend: [0, 1, 2, 3, 4, 4] },
            { label: "Verification samples", value: "2", unit: "clear", status: "normal", trend: [0, 0, 1, 1, 2, 2] },
            { label: "Recovery approval", value: "HOLD", unit: "", status: "warning", trend: [1, 1, 1, 0, 0, 0] },
          ],
          choices: [
            { id: "reconstruct-escalate", label: "Keep the event open, rebuild the timeline from system records, and report the documentation gap", rationale: "A late but honest correction protects the integrity of the record.", points: 20, consequence: "Recovery is delayed while the team fills in the gaps, but both the original problem and the paperwork failure are now formally handled." },
            { id: "estimate-times", label: "Fill in the missing entries from memory and close the event", rationale: "Approximate times can complete the record quickly.", points: 5, consequence: "The log looks complete, but guessed times weaken it if anyone checks later." },
            { id: "process-only", label: "Close the event because the treatment process is stable", rationale: "What matters is that the water is safe now.", points: 0, consequence: "The facility goes into regulatory review without a defensible timeline." },
          ],
        },
        "delete-alarm": {
          id: "stabilize-audit-loss",
          time: "03:28",
          title: "The deleted alarm is discovered",
          briefing: "The process is recovering, but the compliance lead found that the alarm was deleted. The control room record no longer shows when the confirmed problem was seen or handled.",
          alarm: "EVIDENCE CHAIN FAILURE",
          focusNode: 4,
          telemetry: [
            { label: "Filtered turbidity", value: "0.18", unit: "NTU", status: "normal", trend: [0.31, 0.28, 0.25, 0.22, 0.2, 0.18] },
            { label: "Alarm history", value: "MISSING", unit: "", status: "critical", trend: [1, 1, 1, 1, 0, 0] },
            { label: "Independent samples", value: "2", unit: "records", status: "warning", trend: [0, 0, 1, 1, 2, 2] },
            { label: "Incident status", value: "OPEN", unit: "", status: "critical", trend: [1, 1, 1, 1, 1, 1] },
          ],
          choices: [
            { id: "disclose-reconstruct", label: "Tell your supervisor about the deletion, save all remaining evidence, and rebuild the event using other records", rationale: "Be transparent and save what you can. That's the best path forward.", points: 20, consequence: "The alarm history can't be restored, but honest disclosure and backup records create the best recovery path available." },
            { id: "restore-copy", label: "Create a new alarm entry using the time you remember", rationale: "A reconstructed entry might make the timeline look complete.", points: 4, consequence: "The new entry isn't a real system record and creates a second integrity problem." },
            { id: "omit-deletion", label: "Just document the current stable readings and don't mention the deletion", rationale: "The water is safe now, so the deletion doesn't matter.", points: 0, consequence: "Hiding the deletion on top of the original evidence loss makes things much worse." },
          ],
        },
      },
    },
    {
      id: "stabilize",
      time: "03:28",
      title: "Moving from response to recovery",
      briefing: "Raw water is improving. The treatment barriers are stable and leadership asks when the event can be closed.",
      alarm: "RECOVERY GATE AVAILABLE",
      focusNode: 3,
      telemetry: [
        { label: "Raw turbidity", value: "16.2", unit: "NTU", status: "warning", trend: [28, 27, 25, 22, 19, 16] },
        { label: "Filtered turbidity", value: "0.16", unit: "NTU", status: "normal", trend: [0.31, 0.27, 0.23, 0.2, 0.18, 0.16] },
        { label: "Free chlorine", value: "0.84", unit: "mg/L", status: "normal", trend: [0.54, 0.62, 0.71, 0.78, 0.82, 0.84] },
        { label: "Open critical alarms", value: "0", unit: "alarms", status: "normal", trend: [3, 3, 2, 1, 1, 0] },
      ],
      choices: [
        { id: "recovery-gate", label: "Hold current enhanced monitoring until three consecutive verification samples confirm stability, then conduct a formal after-action review before returning to normal operations", rationale: "Recovery should be evidence-based. Three clear samples proves the system is genuinely stable, and the review captures lessons while they're fresh.", points: 20, consequence: "The plant closes the event with verified stability, a complete timeline, and clear lessons for next time." },
        { id: "normal-now", label: "Begin a staged return to normal operations now — restore standard setpoints and reduce monitoring frequency, but keep the incident open for 24 hours as a precaution", rationale: "The process has been stable for over 30 minutes with no alarms. A staged return with a 24-hour watch period balances caution with operational efficiency.", points: 7, consequence: "The staged return works initially, but reduced monitoring misses a brief turbidity rebound overnight that goes unrecorded." },
        { id: "keep-emergency", label: "Maintain full emergency staffing and elevated chemical doses until the raw water source returns completely to baseline conditions", rationale: "The watershed is still draining. Until raw water quality is fully normal, the plant should stay in protective mode to prevent any recurrence.", points: 3, consequence: "Extended emergency dosing creates elevated DBP precursors and unnecessary filter loading. Staff fatigue increases error risk on the next shift." },
      ],
    },
  ],
};

// ─── Scenario 2: Millbrook — Chemical Dosing Failure ───────────────────────
export const MILLBROOK_CHEMICAL_DOSING: ScenarioMeta = {
  id: "millbrook-chemical-dosing",
  title: "Millbrook Chemical Dosing Failure",
  subtitle: "The coagulant pump stops during peak demand",
  badge: "Chemical Feed & Coagulation",
  durationLabel: "8-minute scenario",
  facilityName: "Millbrook WTP",
  incidentLabel: "Coagulant pump failure — no chemical feed",
  processNodes: ["Raw intake", "Chemical feed", "Flocculation", "Sedimentation", "Filtration"],
  steps: [
    {
      id: "pump-alarm",
      time: "10:07",
      title: "Coagulant pump stops",
      briefing: "The main coagulant pump just alarmed and stopped. Raw water is flowing into the flocculation basin with no chemical added. Finished water is still okay, but untreated water will reach the filters soon.",
      alarm: "COAGULANT PUMP FAULT — PUMP STOPPED",
      focusNode: 1,
      telemetry: [
        { label: "Coagulant flow", value: "0.0", unit: "L/h", status: "critical", trend: [42, 42, 42, 20, 5, 0] },
        { label: "Raw turbidity", value: "6.8", unit: "NTU", status: "normal", trend: [6.5, 6.6, 6.7, 6.7, 6.8, 6.8] },
        { label: "Floc basin turbidity", value: "5.9", unit: "NTU", status: "warning", trend: [2.1, 2.3, 2.8, 3.9, 4.8, 5.9] },
        { label: "Filtered turbidity", value: "0.09", unit: "NTU", status: "normal", trend: [0.08, 0.08, 0.09, 0.09, 0.09, 0.09] },
      ],
      choices: [
        { id: "standby-switch", label: "Start the backup pump immediately, verify the dose output matches today's jar test target, and confirm flow on the rotameter before walking away", rationale: "Restoring chemical feed is the priority. The backup is pre-set but needs verification since water quality changes daily.", points: 20, consequence: "The backup pump restores coagulant within minutes. Verified dose matches current conditions and floc formation recovers ahead of the slug." },
        { id: "reduce-flow", label: "Reduce raw water intake by 30% to extend the detention time in the flocculation basin, then troubleshoot the duty pump to get it back online", rationale: "Reducing flow gives the existing chemical residual in the basin more time to work, and fixing the duty pump avoids relying on a backup that hasn't run in weeks.", points: 8, consequence: "Flow reduction extends detention time but doesn't replace the missing coagulant. Floc quality degrades and settled water turbidity rises while you work on the pump." },
        { id: "wait-investigate", label: "Check the pump fault code and VFD status first to determine if it's a simple reset or a mechanical failure, before switching to the backup", rationale: "If it's just a tripped breaker or VFD fault, a reset takes 30 seconds vs. the 5 minutes to prime and start the backup. Diagnosing first avoids unnecessary equipment switching.", points: 0, consequence: "The fault turns out to be mechanical, not electrical. By the time you determine this and switch to backup, 8 minutes of untreated water has entered the flocculation basin." },
      ],
    },
    {
      id: "dose-verification",
      time: "10:19",
      title: "The dose needs adjusting",
      briefing: "The backup pump is running, but it's set to yesterday's dose. A jar test shows you need about 15% more coagulant for today's water quality (alkalinity changed).",
      alarm: "COAGULANT DOSE BELOW TARGET — JAR TEST RESULT",
      focusNode: 1,
      telemetry: [
        { label: "Coagulant flow", value: "38", unit: "L/h", status: "warning", trend: [0, 0, 38, 38, 38, 38] },
        { label: "Floc basin turbidity", value: "4.2", unit: "NTU", status: "warning", trend: [5.9, 5.4, 4.8, 4.5, 4.3, 4.2] },
        { label: "Settled-water turbidity", value: "1.8", unit: "NTU", status: "warning", trend: [0.6, 0.8, 1.1, 1.4, 1.6, 1.8] },
        { label: "Filtered turbidity", value: "0.14", unit: "NTU", status: "normal", trend: [0.09, 0.09, 0.10, 0.11, 0.13, 0.14] },
      ],
      choices: [
        { id: "adjust-dose", label: "Calculate the new target dose from the jar test result, adjust the backup pump output to match, confirm the change on the rotameter, and log the adjustment with the jar test number", rationale: "The jar test gives a defensible dose target for current conditions. Adjusting to match it and logging the reference creates a traceable decision.", points: 20, consequence: "The corrected dose restores floc quality within one detention cycle. Settled water turbidity starts dropping and filter loading stabilizes." },
        { id: "max-dose", label: "Increase the dose by 25% above the jar test recommendation as a safety factor, given that the plant is still recovering from the feed interruption", rationale: "The jar test was done on a grab sample — conditions in the basin are worse because of the gap in treatment. A safety margin accounts for the accumulated untreated water.", points: 6, consequence: "The elevated dose handles the slug well initially, but sustained overdosing drops pH below optimal range, increasing chlorine demand and sludge production." },
        { id: "accept-dose", label: "Leave the backup pump at yesterday's dose setting for now and monitor settled water turbidity — if it doesn't improve in 20 minutes, then adjust", rationale: "The difference is only 15% and filtered water is still compliant. Watching the trend before making changes avoids over-correcting during a transient event.", points: 0, consequence: "The 15% shortfall compounds over time. Settled water turbidity continues rising and filter loading exceeds design within 25 minutes." },
      ],
    },
    {
      id: "filter-loading",
      time: "10:38",
      title: "Filters are getting overloaded",
      briefing: "The period without proper coagulation sent extra solids to the filters. Filter 1 headloss is rising fast and it's overdue for a backwash.",
      alarm: "FILTER 1 HEADLOSS HIGH — EARLY BACKWASH NEEDED",
      focusNode: 4,
      telemetry: [
        { label: "Filter 1 headloss", value: "3.1", unit: "m", status: "critical", trend: [1.4, 1.7, 2.0, 2.4, 2.7, 3.1] },
        { label: "Filter 1 effluent", value: "0.18", unit: "NTU", status: "normal", trend: [0.09, 0.10, 0.12, 0.14, 0.16, 0.18] },
        { label: "Settled-water turbidity", value: "1.1", unit: "NTU", status: "warning", trend: [1.8, 1.6, 1.4, 1.3, 1.2, 1.1] },
        { label: "Clearwell level", value: "71", unit: "%", status: "normal", trend: [75, 74, 73, 72, 72, 71] },
      ],
      choices: [
        { id: "planned-backwash", label: "Initiate a controlled backwash on Filter 1 now, verify Filter 2 has adequate capacity to carry the full load during the wash, and log the early backwash as a consequence of the dosing interruption", rationale: "The headloss trend shows Filter 1 will reach emergency levels within the hour. A planned backwash now is safer than a forced one later, and linking it to the dosing event keeps the incident record complete.", points: 20, consequence: "Filter 1 is restored with a clean backwash. The capacity check confirms Filter 2 can handle the temporary load. The early wash is documented as part of the dosing incident." },
        { id: "delay-backwash", label: "Monitor the headloss trend closely and prepare for backwash, but hold off until Filter 1 reaches the standard 3.5m trigger point to avoid wasting treated backwash water during a low-clearwell period", rationale: "The clearwell is already at 71% and dropping. Using 200 m³ of treated water for an early backwash when the filter effluent is still compliant could create a supply problem.", points: 5, consequence: "Headloss accelerates past 3.5m within 15 minutes and you end up doing an emergency backwash with even less clearwell reserve than you'd have had earlier." },
        { id: "increase-flow", label: "Reduce the coagulant dose slightly to decrease the solids loading on the filters, which should slow the headloss rise and extend the filter run", rationale: "The high headloss is caused by excess solids from the dosing recovery. Trimming the dose back reduces the load without taking any filters offline.", points: 0, consequence: "Reducing the dose during recovery allows poorly-treated water through. Filter effluent turbidity rises as the protective floc layer thins." },
      ],
    },
    {
      id: "root-cause",
      time: "10:55",
      title: "Maintenance finds the cause",
      briefing: "The maintenance team found that the pump failed because of a worn seal — a predictable failure that should have been caught in routine maintenance. The backup pump is running fine. Your supervisor asks what to do next.",
      alarm: "MAINTENANCE FINDING: WORN IMPELLER SEAL",
      focusNode: 1,
      telemetry: [
        { label: "Coagulant flow", value: "44", unit: "L/h", status: "normal", trend: [38, 39, 41, 42, 43, 44] },
        { label: "Floc basin turbidity", value: "2.4", unit: "NTU", status: "normal", trend: [4.2, 3.6, 3.1, 2.8, 2.6, 2.4] },
        { label: "Filtered turbidity", value: "0.11", unit: "NTU", status: "normal", trend: [0.18, 0.16, 0.14, 0.13, 0.12, 0.11] },
        { label: "Open critical alarms", value: "1", unit: "alarm", status: "warning", trend: [2, 2, 2, 1, 1, 1] },
      ],
      choices: [
        { id: "schedule-repair", label: "Arrange immediate seal replacement on the duty pump, add quarterly seal inspections to the preventive maintenance schedule, and document the failure mode in the incident report as a corrective action", rationale: "The worn seal is a predictable failure that should have been caught. Fixing it now restores redundancy, and updating the PM schedule prevents recurrence. The incident report needs the root cause documented.", points: 20, consequence: "The pump is repaired and tested within the shift. The maintenance program now includes seal inspections, and the incident report has a complete root-cause section." },
        { id: "run-standby", label: "Continue on the backup pump and schedule the duty pump repair for the next planned maintenance window in two weeks, since the backup is running well and a hot repair risks introducing new problems", rationale: "The backup is performing normally. Rushing a repair during an active incident introduces risk — better to let things stabilize and do the work properly during a planned outage with parts on hand.", points: 7, consequence: "The plant operates on a single pump for two weeks. If the backup develops any issue, there's no chemical feed redundancy and no time to react." },
        { id: "ignore-cause", label: "Reset the duty pump and run it in parallel with the backup at reduced speed to share the load, which reduces stress on the worn seal while maintaining redundancy", rationale: "Running both pumps at lower speed means neither is working hard. The seal wear is less critical at reduced pressure, and you maintain two-pump redundancy immediately.", points: 0, consequence: "The worn seal leaks at any speed. Running the damaged pump contaminates the coagulant with bearing grease and fails completely within 48 hours during a turbidity event." },
      ],
      judgment: {
        prompt: "The pump failed because of a worn seal that should have been caught. What do you do about it? How do you make sure it doesn't happen again? What needs to be documented?",
        placeholder: "I would fix the pump by... To prevent this again, I would... I need to document...",
        minCharacters: 20,
        ruleBranches: { strong: "schedule-repair", partial: "run-standby", unsafe: "ignore-cause" },
      },
      branchSteps: {
        "schedule-repair": {
          id: "close-event-controlled",
          time: "11:14",
          title: "Closing with everything fixed",
          briefing: "The pump is repaired and tested, the backup is available, and the maintenance update is ready for approval. Your supervisor asks you to formally close the event.",
          alarm: "CORRECTIVE ACTION VERIFICATION NEEDED",
          focusNode: 1,
          telemetry: [
            { label: "Duty pump test", value: "PASS", unit: "", status: "normal", trend: [0, 0, 0, 1, 1, 1] },
            { label: "Standby availability", value: "READY", unit: "", status: "normal", trend: [1, 1, 1, 1, 1, 1] },
            { label: "Filtered turbidity", value: "0.09", unit: "NTU", status: "normal", trend: [0.18, 0.15, 0.12, 0.1, 0.09, 0.09] },
            { label: "Open actions", value: "1", unit: "approval", status: "warning", trend: [4, 3, 3, 2, 1, 1] },
          ],
          choices: [
            { id: "verify-close", label: "Approve the maintenance update, confirm both pumps work, and close with a full review and timeline", rationale: "Only close when the fix, the backup, and the learning are all done and documented.", points: 20, consequence: "The event closes with both pumps working and a complete record that proves everything was handled properly." },
            { id: "close-before-approval", label: "Close the event now and approve the maintenance change next week", rationale: "The physical repair is done, so the paperwork can follow.", points: 7, consequence: "Operations recover, but the prevention action might get lost once the event is closed." },
            { id: "skip-review", label: "Go back to normal without a formal close-out", rationale: "Both pumps are working, so no more action is needed.", points: 0, consequence: "The repair works, but there's no proof that the notification and prevention steps were reviewed." },
          ],
        },
        "run-standby": {
          id: "close-event-redundancy-loss",
          time: "11:14",
          title: "The backup pump starts vibrating",
          briefing: "The broken pump still hasn't been fixed. Now the backup pump is vibrating more and more while carrying the full load. You're one failure away from losing chemical feed entirely.",
          alarm: "CHEMICAL FEED REDUNDANCY AT RISK",
          focusNode: 1,
          telemetry: [
            { label: "Standby vibration", value: "8.2", unit: "mm/s", status: "critical", trend: [2.1, 2.4, 3.2, 4.7, 6.3, 8.2] },
            { label: "Duty pump", value: "OUT", unit: "", status: "critical", trend: [0, 0, 0, 0, 0, 0] },
            { label: "Coagulant flow", value: "41", unit: "L/h", status: "warning", trend: [44, 44, 43, 43, 42, 41] },
            { label: "Filtered turbidity", value: "0.12", unit: "NTU", status: "normal", trend: [0.09, 0.09, 0.1, 0.1, 0.11, 0.12] },
          ],
          choices: [
            { id: "restore-redundancy", label: "Keep the event open, reduce plant loading, rush the main pump repair, and check the backup before declaring it safe", rationale: "Control the new risk while urgently rebuilding a verified backup.", points: 20, consequence: "Plant loading is controlled and maintenance fixes the main pump before the backup gets worse." },
            { id: "watch-vibration", label: "Keep running the backup and watch the vibration trend", rationale: "The pump is still delivering chemical and might hold up.", points: 5, consequence: "You continue with shrinking safety margin and no verified backup." },
            { id: "silence-vibration", label: "Acknowledge the vibration alarm and close the original event", rationale: "The vibration is a separate issue from the original seal failure.", points: 0, consequence: "You close an event while your only working pump is showing warning signs." },
          ],
        },
        "ignore-cause": {
          id: "close-event-repeat-failure",
          time: "11:14",
          title: "The pump fails again",
          briefing: "The unfixed seal has failed again — this time during a turbidity rise. Coagulant flow is zero and the earlier incident report has no corrective action in it.",
          alarm: "REPEAT COAGULANT FEED FAILURE",
          focusNode: 1,
          telemetry: [
            { label: "Coagulant flow", value: "0", unit: "L/h", status: "critical", trend: [44, 42, 39, 21, 7, 0] },
            { label: "Raw turbidity", value: "12.6", unit: "NTU", status: "critical", trend: [6.8, 7.1, 8.2, 9.4, 11.1, 12.6] },
            { label: "Filtered turbidity", value: "0.19", unit: "NTU", status: "warning", trend: [0.09, 0.1, 0.11, 0.13, 0.16, 0.19] },
            { label: "Available feed pumps", value: "1", unit: "pump", status: "warning", trend: [2, 2, 2, 2, 1, 1] },
          ],
          choices: [
            { id: "contain-repeat", label: "Start the backup, slow the plant down until flow is confirmed, save both failure records, and escalate the repeat failure", rationale: "Restore the barrier while treating this repeat as a serious organizational failure.", points: 20, consequence: "Chemical feed is restored under controlled loading and the repeat event gets formal root-cause escalation." },
            { id: "standby-only", label: "Start the backup and go back to full flow right away", rationale: "The backup pump fixes the lost feed.", points: 6, consequence: "Feed returns, but you repeat the same mistake of not verifying or documenting." },
            { id: "manual-dose", label: "Add coagulant by hand while keeping full production", rationale: "Manual addition can bridge the gap without slowing down.", points: 0, consequence: "Uncontrolled manual dosing at full flow creates an unstable coagulation barrier." },
          ],
        },
      },
    },
    {
      id: "close-event",
      time: "11:14",
      title: "Closing the chemical dosing event",
      briefing: "Everything has recovered. Your supervisor needs to confirm that all reporting requirements have been checked before closing the incident.",
      alarm: "INCIDENT CLOSE-OUT REVIEW NEEDED",
      focusNode: 1,
      telemetry: [
        { label: "Coagulant flow", value: "44", unit: "L/h", status: "normal", trend: [38, 40, 42, 43, 44, 44] },
        { label: "Filtered turbidity", value: "0.09", unit: "NTU", status: "normal", trend: [0.18, 0.15, 0.12, 0.10, 0.09, 0.09] },
        { label: "Free chlorine", value: "1.08", unit: "mg/L", status: "normal", trend: [0.91, 0.96, 1.00, 1.04, 1.06, 1.08] },
        { label: "Open critical alarms", value: "0", unit: "alarms", status: "normal", trend: [2, 2, 1, 1, 1, 0] },
      ],
      choices: [
        { id: "full-close", label: "Complete the close-out checklist: verify no regulatory limits were exceeded, confirm all corrective actions are assigned with due dates, document the timeline review, and formally close the incident", rationale: "A structured close-out with assigned actions ensures nothing falls through the cracks. The checklist creates a defensible record if the event is ever audited.", points: 20, consequence: "The incident is closed with a complete record. All corrective actions have owners and deadlines. The facility is audit-ready." },
        { id: "verbal-close", label: "Brief the incoming shift supervisor on what happened, confirm verbally that all process parameters are normal, and return to standard operations with a note to complete the formal report tomorrow", rationale: "The shift change is the natural handover point. A verbal briefing ensures continuity, and writing the formal report tomorrow with fresh eyes produces a better document.", points: 5, consequence: "The verbal handover captures the key facts, but the delayed formal report means some details are lost by tomorrow. The timeline has gaps if audited." },
        { id: "no-close", label: "Keep the incident formally open with enhanced monitoring until the duty pump repair is verified complete and tested, since the root cause hasn't been fully resolved yet", rationale: "The incident was caused by the pump failure. Until the pump is repaired and tested, the underlying vulnerability still exists — closing prematurely could mean reopening if something else fails.", points: 2, consequence: "The open incident creates operational confusion — staff aren't sure if they're still in emergency mode. The lessons-learned review is delayed indefinitely waiting for the repair." },
      ],
    },
  ],
};

// ─── Scenario 3: Riverside — Water Main Break ──────────────────────────────
export const RIVERSIDE_MAIN_BREAK: ScenarioMeta = {
  id: "riverside-main-break",
  title: "Riverside Water Main Break",
  subtitle: "A big pipe bursts during morning rush hour",
  badge: "Distribution & Pressure Management",
  durationLabel: "8-minute scenario",
  facilityName: "Riverside Distribution System",
  incidentLabel: "Transmission main rupture — pressure loss",
  processNodes: ["Pumping station", "Transmission main", "Pressure zone", "Service area", "Customers"],
  steps: [
    {
      id: "pressure-drop",
      time: "07:22",
      title: "Pressure drops fast",
      briefing: "A zone pressure alarm went off during morning peak. Zone 3 pressure dropped 85 kPa in 12 minutes. A field crew reports water coming up through the road near the 400 mm main on Elm Street.",
      alarm: "ZONE 3 PRESSURE LOW — POSSIBLE MAIN BREAK",
      focusNode: 1,
      telemetry: [
        { label: "Zone 3 pressure", value: "218", unit: "kPa", status: "critical", trend: [412, 390, 362, 320, 268, 218] },
        { label: "Pump station flow", value: "142", unit: "L/s", status: "warning", trend: [88, 95, 108, 121, 133, 142] },
        { label: "Reservoir level", value: "68", unit: "%", status: "warning", trend: [81, 79, 77, 74, 71, 68] },
        { label: "Zone 4 pressure", value: "398", unit: "kPa", status: "normal", trend: [401, 400, 399, 399, 398, 398] },
      ],
      choices: [
        { id: "isolate-zone", label: "Dispatch a crew to close the boundary valves around the suspected break location, notify the duty supervisor, and activate the distribution emergency checklist", rationale: "The field report confirms water surfacing at the main. Isolating the section stops the loss while the checklist ensures nothing is missed in the response sequence.", points: 20, consequence: "The crew closes the valves within 18 minutes. Water loss stops and Zone 3 pressure begins recovering from the reservoir." },
        { id: "boost-pumps", label: "Increase pump station output to maintain Zone 3 pressure while dispatching a crew to confirm the break location and assess severity before isolating", rationale: "Maintaining pressure protects fire flow and customer service. Confirming the exact location before closing valves avoids isolating the wrong section and affecting more customers than necessary.", points: 6, consequence: "Higher pumping maintains some pressure temporarily but pushes more water through the break. Road damage worsens and the reservoir drains 15% faster while the crew locates the exact point." },
        { id: "monitor-only", label: "Cross-reference the pressure drop with Zone 4 readings and pump station flow to determine if this is a real break or an instrument fault before dispatching resources", rationale: "Zone 4 is stable and the pressure drop could be a failed transmitter. Sending a crew based on one sensor reading wastes resources if it's a false alarm — and the pump station flow increase could be normal morning demand.", points: 0, consequence: "The analysis takes 25 minutes. The break is real — pump station flow confirms the loss. By the time you dispatch, the reservoir has dropped to critical and Zone 3 has lost fire protection." },
      ],
    },
    {
      id: "customer-impact",
      time: "07:41",
      title: "Customers lose water",
      briefing: "The isolation is in progress but 340 homes and businesses in Zone 3 are now without water. The call centre is getting complaints. A hospital on Maple Avenue is in the affected zone and has switched to its emergency supply.",
      alarm: "SERVICE INTERRUPTION — 340 CONNECTIONS",
      focusNode: 3,
      telemetry: [
        { label: "Zone 3 pressure", value: "0", unit: "kPa", status: "critical", trend: [218, 180, 120, 60, 20, 0] },
        { label: "Reservoir level", value: "61", unit: "%", status: "warning", trend: [68, 66, 65, 64, 62, 61] },
        { label: "Pump station flow", value: "78", unit: "L/s", status: "normal", trend: [142, 130, 110, 92, 82, 78] },
        { label: "Zone 4 pressure", value: "394", unit: "kPa", status: "normal", trend: [398, 397, 396, 395, 394, 394] },
      ],
      choices: [
        { id: "notify-hospital", label: "Contact the hospital directly to confirm their emergency supply is adequate, issue a public service interruption notice with an estimated restoration time, and assign a liaison for critical facilities", rationale: "The hospital is the highest-risk customer in the zone. Confirming their backup and communicating a timeline to all affected parties reduces panic and demonstrates controlled response.", points: 20, consequence: "The hospital confirms 6 hours of emergency supply. The public notice reduces call centre volume by 70%. Customers accept the timeline and the media reports factually." },
        { id: "restore-first", label: "Prioritize getting the repair crew mobilized and the bypass installed as fast as possible — the fastest way to help customers is to restore their water, not send them a notice about not having it", rationale: "Every minute spent on communications is a minute not spent on restoration. The hospital has its own emergency protocols. Getting water back faster helps everyone more than a notice does.", points: 7, consequence: "The repair proceeds efficiently, but without information customers flood the call centre and social media. The hospital calls the supervisor directly, pulling attention from coordination." },
        { id: "no-notice", label: "Send an internal situation report to management and the call centre so they can handle inquiries, but hold off on a public notice until you have a confirmed restoration time to avoid setting expectations you can't meet", rationale: "Issuing a public timeline before you know the repair scope creates a commitment. If the repair takes longer than estimated, you'll face a second wave of complaints. Better to communicate once with accurate information.", points: 0, consequence: "The call centre handles early inquiries, but without a public notice customers escalate to 911 and media. The delay in communication is later cited as a failure in the incident review." },
      ],
    },
    {
      id: "repair-decision",
      time: "08:03",
      title: "How to fix the pipe",
      briefing: "The crew dug up the break. The 400 mm pipe has a 600 mm crack — too big for a clamp. It needs a full pipe replacement. The replacement pipe arrives in 4 hours. The crew asks: install a temporary bypass now, or wait for the new pipe?",
      alarm: "PIPE REPLACEMENT NEEDED — 4-HOUR WAIT",
      focusNode: 1,
      telemetry: [
        { label: "Zone 3 pressure", value: "0", unit: "kPa", status: "critical", trend: [0, 0, 0, 0, 0, 0] },
        { label: "Reservoir level", value: "58", unit: "%", status: "warning", trend: [61, 60, 59, 59, 58, 58] },
        { label: "Bypass flow available", value: "45", unit: "L/s", status: "warning", trend: [0, 0, 0, 0, 0, 45] },
        { label: "Affected connections", value: "340", unit: "services", status: "critical", trend: [340, 340, 340, 340, 340, 340] },
      ],
      choices: [
        { id: "temporary-bypass", label: "Install a temporary above-ground bypass using available 150mm layflat hose to restore partial service to critical facilities while the permanent replacement pipe is in transit", rationale: "The hospital's emergency supply is finite. A bypass at reduced capacity keeps critical facilities served and reduces the health risk of an extended outage, even though it adds work for the crew.", points: 20, consequence: "The bypass restores 45 L/s within 90 minutes. The hospital and care facilities get water back. The permanent repair proceeds in parallel without time pressure." },
        { id: "wait-pipe", label: "Keep the zone isolated and focus the crew on site preparation so the permanent repair can be completed as quickly as possible once the replacement pipe arrives in 4 hours", rationale: "A bypass takes crew time away from prep work and only provides partial flow. If the crew focuses on excavation, bedding, and joint preparation now, the permanent repair can be done in 2 hours once the pipe arrives — total outage of 6 hours vs. bypass setup plus repair.", points: 8, consequence: "The prep work is efficient, but the 4-hour wait exhausts the hospital's emergency supply. A water tanker is needed, adding cost and complexity to the response." },
        { id: "partial-open", label: "Partially open one isolation valve to allow reduced flow through the damaged section — the crack is above the pipe invert so low-pressure flow may pass without significant leakage", rationale: "The break is a longitudinal crack on the crown. At reduced pressure, water may flow through the lower portion of the pipe without significant loss, providing some service while you wait for the replacement.", points: 0, consequence: "Even at reduced pressure, water escapes through the crack and floods the excavation. The repair site is contaminated with turbid water, requiring additional flushing and disinfection before the new pipe can be installed." },
      ],
    },
    {
      id: "contamination-risk",
      time: "08:28",
      title: "Is the pipe contaminated?",
      briefing: "The repair crew noticed that the break site was underwater (surface water) for over an hour before it was isolated. The rules say you need a contamination check before putting the main back in service.",
      alarm: "CONTAMINATION RISK — ASSESSMENT REQUIRED",
      focusNode: 2,
      telemetry: [
        { label: "Zone 3 pressure", value: "38", unit: "kPa", status: "critical", trend: [0, 0, 0, 15, 28, 38] },
        { label: "Reservoir level", value: "56", unit: "%", status: "warning", trend: [58, 57, 57, 56, 56, 56] },
        { label: "Bypass flow", value: "45", unit: "L/s", status: "normal", trend: [45, 45, 45, 45, 45, 45] },
        { label: "Repair progress", value: "60", unit: "%", status: "warning", trend: [0, 15, 30, 45, 55, 60] },
      ],
      choices: [
        { id: "full-protocol", label: "Conduct the full contamination assessment: swab the repair area, flush the main at high velocity until clear, apply chlorinated water at 50 mg/L for 24 hours, then collect bacteriological samples before returning to service", rationale: "The pipe was submerged in surface water for over an hour. The provincial guidelines require a full disinfection protocol when external contamination is possible, regardless of how clean the repair looks.", points: 20, consequence: "The protocol adds 4 hours but produces clean sample results. The main returns to service with full documentation and no compliance risk." },
        { id: "visual-only", label: "Perform a visual inspection of the repair, flush the main until the water runs clear at the downstream hydrant, and collect a bacteriological sample — but return the main to service immediately rather than waiting 24 hours for results", rationale: "The repair site was only briefly submerged and the crew used clean materials. A flush-to-clear plus sampling satisfies due diligence while restoring service hours earlier than the full 24-hour disinfection protocol.", points: 4, consequence: "Service is restored quickly, but the next-day sample shows elevated heterotrophic plate count. The regulator flags the decision to return to service before results were available." },
        { id: "skip-assessment", label: "Flush the main at the nearest hydrant until clear, check chlorine residual at the downstream end, and return to service once residual is above 0.2 mg/L — the presence of adequate residual confirms disinfection", rationale: "Chlorine residual is the standard indicator of safe water. If the flushed water shows adequate residual at the far end, the pipe is effectively disinfected and safe to return to service without waiting for lab results.", points: 0, consequence: "Residual confirms free chlorine is present, but chlorine contact time was insufficient to inactivate organisms in biofilm disturbed by the repair. A coliform-positive sample triggers a boil water advisory." },
      ],
      judgment: {
        prompt: "The repair site was underwater. What do you need to see before putting the main back in service? Who do you notify? What records do you keep?",
        placeholder: "Before restoring service, I would check... I would protect customers by... I need to notify...",
        minCharacters: 20,
        ruleBranches: { strong: "full-protocol", partial: "visual-only", unsafe: "skip-assessment" },
      },
      branchSteps: {
        "full-protocol": {
          id: "service-restoration-verified",
          time: "09:15",
          title: "Service restored with clean results",
          briefing: "The contamination check and flush are done. Samples passed and Zone 3 pressure is recovering under a documented plan.",
          alarm: "VERIFIED RESTORATION GATE",
          focusNode: 4,
          telemetry: [
            { label: "Zone 3 pressure", value: "386", unit: "kPa", status: "normal", trend: [38, 120, 210, 295, 350, 386] },
            { label: "Verification samples", value: "PASS", unit: "", status: "normal", trend: [0, 0, 0, 1, 1, 1] },
            { label: "Pump station flow", value: "91", unit: "L/s", status: "normal", trend: [45, 55, 68, 78, 86, 91] },
            { label: "Open critical alarms", value: "0", unit: "alarms", status: "normal", trend: [3, 3, 2, 1, 1, 0] },
          ],
          choices: [
            { id: "full-closeout", label: "Send the restoration notice, document the reservoir recovery plan, submit the incident report, and schedule a post-incident review", rationale: "Complete the public, operational, and organizational close-out together.", points: 20, consequence: "Customers are informed, the recovery is controlled, and the review identifies valve and bypass improvements for next time." },
            { id: "partial-closeout", label: "Restore service and tell the call centre, but write the incident report later this week", rationale: "The emergency is over and the report can wait.", points: 6, consequence: "Service recovers, but important details are later filled in from memory." },
            { id: "no-closeout", label: "Go back to normal without any formal close-out", rationale: "Verification passed, so no more work is needed.", points: 0, consequence: "No incident record exists. The utility loses the learning and can't prove its restoration process was complete." },
          ],
        },
        "visual-only": {
          id: "service-restoration-evidence-gap",
          time: "09:15",
          title: "The inspector asks for your samples",
          briefing: "Pressure is back, but the public health inspector wants to see the contamination assessment and sample results. All you have is a field visual inspection.",
          alarm: "RESTORATION EVIDENCE INCOMPLETE",
          focusNode: 4,
          telemetry: [
            { label: "Zone 3 pressure", value: "382", unit: "kPa", status: "normal", trend: [38, 115, 205, 286, 344, 382] },
            { label: "Verification samples", value: "NONE", unit: "", status: "critical", trend: [0, 0, 0, 0, 0, 0] },
            { label: "Customer complaints", value: "3", unit: "calls", status: "warning", trend: [0, 0, 1, 1, 2, 3] },
            { label: "Incident status", value: "OPEN", unit: "", status: "warning", trend: [1, 1, 1, 1, 1, 1] },
          ],
          choices: [
            { id: "reopen-verify", label: "Keep the event open, admit the gap, collect samples now, and take precautions until results come back", rationale: "Fix the gap honestly before calling the restoration complete.", points: 20, consequence: "Close-out is delayed, but verification is completed and the correction is documented." },
            { id: "sample-after-fact", label: "Collect samples now but don't tell the inspector about the gap", rationale: "Getting samples now should satisfy the requirement.", points: 5, consequence: "Samples are collected late. The inspector notes the timeline discrepancy." },
            { id: "defend-visual", label: "Tell the inspector the visual inspection was enough", rationale: "The repair looked clean and water is flowing normally.", points: 0, consequence: "The evidence gap becomes a formal compliance finding." },
          ],
        },
        "skip-assessment": {
          id: "service-restoration-positive-sample",
          time: "09:15",
          title: "A sample comes back positive",
          briefing: "You put the main back without checking. A routine sample the next day found coliform bacteria in Zone 3. Pressure is fine, but you now have a public health problem.",
          alarm: "POSITIVE COLIFORM — ZONE 3",
          focusNode: 4,
          telemetry: [
            { label: "Zone 3 pressure", value: "389", unit: "kPa", status: "normal", trend: [38, 125, 220, 305, 355, 389] },
            { label: "Coliform result", value: "POSITIVE", unit: "", status: "critical", trend: [0, 0, 0, 0, 0, 1] },
            { label: "Affected connections", value: "340", unit: "services", status: "critical", trend: [340, 340, 340, 340, 340, 340] },
            { label: "Open notifications", value: "4", unit: "groups", status: "critical", trend: [0, 0, 1, 2, 3, 4] },
          ],
          choices: [
            { id: "escalate-advisory", label: "Notify public health, issue the required advisory, flush the affected main, and save the decision record", rationale: "Treat the positive result and the skipped check as one controlled incident.", points: 20, consequence: "Customers get precautions while you flush and resample. The record shows what happened and what you did about it." },
            { id: "resample-first", label: "Take another sample before telling customers", rationale: "The first result might be wrong.", points: 4, consequence: "Public health action is delayed while people might be drinking contaminated water." },
            { id: "flush-quietly", label: "Flush the zone without telling anyone about the result", rationale: "Fixing it quietly avoids public alarm.", points: 0, consequence: "Hiding the result on top of skipping the assessment makes the situation much worse." },
          ],
        },
      },
    },
    {
      id: "service-restoration",
      time: "09:15",
      title: "Closing the main break event",
      briefing: "The repair is done, the flush is complete, and samples have been collected. Zone 3 pressure is recovering. Your supervisor asks for a final close-out.",
      alarm: "RESTORATION COMPLETE — CLOSE-OUT NEEDED",
      focusNode: 4,
      telemetry: [
        { label: "Zone 3 pressure", value: "386", unit: "kPa", status: "normal", trend: [38, 120, 210, 295, 350, 386] },
        { label: "Reservoir level", value: "54", unit: "%", status: "warning", trend: [56, 55, 55, 54, 54, 54] },
        { label: "Pump station flow", value: "91", unit: "L/s", status: "normal", trend: [45, 55, 68, 78, 86, 91] },
        { label: "Open critical alarms", value: "0", unit: "alarms", status: "normal", trend: [3, 3, 2, 1, 1, 0] },
      ],
      choices: [
        { id: "full-closeout", label: "Issue the service restoration notice to all affected customers, document the reservoir recovery monitoring plan, submit the completed incident report to the regulator, and schedule a post-incident review within 7 days", rationale: "The regulatory framework requires notification of both the interruption and the restoration. The reservoir needs a recovery plan because it's at 54%. A timely review captures lessons while they're fresh.", points: 20, consequence: "Customers are informed, the reservoir recovery is monitored to target, the incident report satisfies the regulator, and the review identifies valve maintenance and bypass pre-staging as priorities." },
        { id: "partial-closeout", label: "Notify the call centre that service is restored so they can close customer complaints, and draft the incident report over the next few days once all the crew timesheets and material records are compiled", rationale: "A thorough incident report requires crew hours, material costs, and contractor invoices that won't be available until later this week. A rushed report now would be incomplete and need revision anyway.", points: 6, consequence: "Customer complaints are closed promptly, but the delayed report loses operational details. The reservoir recovery plan is never formalized and the post-incident review doesn't happen." },
        { id: "no-closeout", label: "Return to normal operations and monitor the reservoir recovery passively — the system will refill naturally overnight and the repair documentation is already in the maintenance management system", rationale: "The CMMS already has the work order with repair details. The reservoir will recover to normal levels by morning through normal pump operation. A separate close-out process duplicates existing records.", points: 0, consequence: "The CMMS captures the repair but not the emergency response decisions. When a similar break occurs, there's no record of what worked, what didn't, or how to improve the response." },
      ],
    },
  ],
};

// ─── Scenario 4: Lakeview — Boil Water Advisory ────────────────────────────
export const LAKEVIEW_BOIL_WATER: ScenarioMeta = {
  id: "lakeview-boil-water",
  title: "Lakeview Boil Water Advisory",
  subtitle: "Chlorine residual disappears in the distribution system",
  badge: "Public Health & Regulatory Response",
  durationLabel: "8-minute scenario",
  facilityName: "Lakeview Distribution System",
  incidentLabel: "Boil water advisory — no chlorine residual in the east zone",
  processNodes: ["Treatment plant", "Transmission", "Storage", "Distribution", "Public health"],
  steps: [
    {
      id: "residual-loss",
      time: "14:33",
      title: "Zero chlorine in the east zone",
      briefing: "Routine sampling found zero chlorine residual at three monitoring points in a row in the eastern zone. This zone serves 4,200 connections including two elementary schools. A portable test kit confirmed the zero readings.",
      alarm: "ZERO RESIDUAL CONFIRMED — THREE POINTS",
      focusNode: 3,
      telemetry: [
        { label: "East zone residual", value: "0.00", unit: "mg/L", status: "critical", trend: [0.42, 0.31, 0.19, 0.08, 0.02, 0.00] },
        { label: "Transmission residual", value: "0.88", unit: "mg/L", status: "normal", trend: [0.91, 0.90, 0.89, 0.89, 0.88, 0.88] },
        { label: "Storage tank level", value: "62", unit: "%", status: "normal", trend: [64, 63, 63, 62, 62, 62] },
        { label: "System pressure", value: "374", unit: "kPa", status: "normal", trend: [378, 377, 376, 375, 374, 374] },
      ],
      choices: [
        { id: "notify-moh", label: "Contact the Medical Officer of Health immediately to report the confirmed zero-residual finding, initiate the boil water advisory notification process for the eastern zone, and begin a parallel investigation into the cause", rationale: "Three confirmed zero readings at separate monitoring points triggers the mandatory notification threshold. The investigation can run in parallel with the public health response — you don't need to know the cause before protecting the public.", points: 20, consequence: "The MOH is notified within 30 minutes. A boil water advisory is issued for the eastern zone. The investigation begins while the public is protected." },
        { id: "flush-first", label: "Initiate an emergency flushing program at the nearest hydrants to push chlorinated water into the zone, while simultaneously notifying the MOH — if residual recovers within 30 minutes, the advisory may not be needed", rationale: "If the cause is simple (stagnation or a closed valve), flushing may restore residual quickly. Notifying the MOH in parallel satisfies the reporting requirement while you attempt a rapid fix.", points: 5, consequence: "Flushing restores residual at one point but not the others. The MOH was notified but the 30-minute delay in issuing the advisory means schools served lunch with unprotected water." },
        { id: "resample-only", label: "Collect formal lab samples at all three monitoring points plus two additional locations to establish the extent of the zero-residual zone before making a notification decision", rationale: "The portable DPD kit confirmed zero, but lab analysis provides the legally defensible evidence needed for a formal advisory. Mapping the extent first ensures the advisory covers the right area and avoids unnecessary disruption to unaffected customers.", points: 0, consequence: "Lab results take 4 hours. During that time, 4,200 connections including two schools continue using water with no disinfection barrier. The delayed notification becomes a regulatory investigation." },
      ],
    },
    {
      id: "cause-investigation",
      time: "14:52",
      title: "Finding the cause",
      briefing: "The investigation found two possible causes: (1) a stuck-open reservoir valve is diluting chlorinated water with unchlorinated storage water, or (2) a contractor is flushing hydrants nearby and using up all the residual. Each cause needs a different fix.",
      alarm: "TWO POSSIBLE CAUSES IDENTIFIED",
      focusNode: 2,
      telemetry: [
        { label: "East zone residual", value: "0.00", unit: "mg/L", status: "critical", trend: [0.00, 0.00, 0.00, 0.00, 0.00, 0.00] },
        { label: "Reservoir inlet valve", value: "100", unit: "% open", status: "critical", trend: [22, 35, 58, 78, 92, 100] },
        { label: "Contractor flow meter", value: "18", unit: "L/s", status: "warning", trend: [0, 0, 0, 8, 14, 18] },
        { label: "Storage tank level", value: "59", unit: "%", status: "warning", trend: [62, 61, 61, 60, 60, 59] },
      ],
      choices: [
        { id: "systematic-check", label: "Close the reservoir inlet valve to eliminate the dilution path, verify the contractor's flow and permit status, then compare the residual recovery rate to determine which factor was primary", rationale: "The reservoir valve at 100% open is the more likely primary cause since it's introducing unchlorinated water directly into the zone. Closing it first addresses the larger dilution source while you verify the contractor's contribution.", points: 20, consequence: "Closing the valve stops the dilution. Residual begins recovering in the transmission main within 20 minutes, confirming it was the primary cause. The contractor's 18 L/s was a secondary factor. Root cause is documented." },
        { id: "stop-contractor", label: "Contact the contractor immediately to halt all hydrant flushing, verify their permit and flow records, and monitor whether residual recovers once their demand stops", rationale: "The contractor is drawing 18 L/s from the zone — that's significant flow that could strip residual from the mains. Their activity started around the same time residual began dropping. Stopping them is the fastest single action you can take.", points: 8, consequence: "The contractor stops within 10 minutes, but residual doesn't recover because the reservoir valve is still open and diluting the supply. You've addressed a symptom, not the primary cause." },
        { id: "boost-chlorine", label: "Increase the plant chlorine dose by 50% to overcome whatever is consuming residual in the zone, while sending a crew to investigate both potential causes in the field", rationale: "Regardless of the cause, higher chlorine output from the plant will eventually restore residual in the zone. The field investigation can determine root cause while the treatment adjustment provides immediate protection.", points: 3, consequence: "The higher dose enters the transmission main but takes 3+ hours to reach the eastern zone through normal flow. Meanwhile, the dilution source continues unchecked and the advisory remains active." },
      ],
    },
    {
      id: "public-communication",
      time: "15:14",
      title: "Schools haven't been told yet",
      briefing: "The boil water advisory is issued but two elementary schools haven't been directly notified. School administrators are calling you. The media also wants a statement.",
      alarm: "SCHOOL NOTIFICATION OVERDUE — MEDIA CALLING",
      focusNode: 4,
      telemetry: [
        { label: "East zone residual", value: "0.04", unit: "mg/L", status: "critical", trend: [0.00, 0.00, 0.00, 0.01, 0.02, 0.04] },
        { label: "Transmission residual", value: "0.91", unit: "mg/L", status: "normal", trend: [0.88, 0.88, 0.89, 0.90, 0.90, 0.91] },
        { label: "Boil water advisory", value: "Active", unit: "", status: "warning", trend: [0, 0, 0, 1, 1, 1] },
        { label: "Open notifications", value: "2", unit: "schools", status: "critical", trend: [4, 4, 3, 3, 2, 2] },
      ],
      choices: [
        { id: "direct-notify", label: "Call both school principals directly to confirm they've received and understood the boil water precautions, then issue a prepared media statement with the current timeline and next steps", rationale: "Schools are the highest-risk facilities because children are the most vulnerable population. Direct contact ensures they act immediately rather than relying on broadcast notifications that may be missed.", points: 20, consequence: "Both schools confirm receipt and shut off drinking fountains. The media statement is factual and reduces speculation. The utility demonstrates a controlled, prioritized response." },
        { id: "media-first", label: "Issue the media statement and social media advisory immediately to reach the maximum number of people in the shortest time, then follow up with direct calls to the schools and care facilities", rationale: "A public broadcast reaches thousands of people simultaneously, including parents who can contact schools themselves. Direct calls to two schools take time that delays the broader public notification.", points: 6, consequence: "The broad notification reaches many people quickly, but schools hear about it from parents and media before receiving official guidance. One school served lunch with tap water before the principal saw the news." },
        { id: "defer-communication", label: "Focus all resources on fixing the root cause and restoring residual first — once the situation is resolved, issue a combined notification explaining what happened and confirming the water is now safe", rationale: "Issuing an advisory creates public anxiety and economic impact. If the cause can be fixed within an hour, a retrospective notification avoids unnecessary panic while still informing the public of what occurred.", points: 0, consequence: "The root cause takes longer than expected. Schools continue using unprotected water for 3 hours. The delayed notification becomes the central finding in the regulatory investigation." },
      ],
    },
    {
      id: "residual-recovery",
      time: "15:38",
      title: "How to restore the chlorine",
      briefing: "The root cause is fixed. Residual is recovering in the transmission main, but the eastern zone still shows zero. You need to get chlorine throughout the entire zone before the advisory can be lifted.",
      alarm: "RESIDUAL RECOVERY PLAN NEEDED",
      focusNode: 3,
      telemetry: [
        { label: "East zone residual", value: "0.00", unit: "mg/L", status: "critical", trend: [0.00, 0.00, 0.00, 0.00, 0.00, 0.00] },
        { label: "Transmission residual", value: "0.94", unit: "mg/L", status: "normal", trend: [0.88, 0.89, 0.90, 0.91, 0.93, 0.94] },
        { label: "Storage tank level", value: "57", unit: "%", status: "warning", trend: [59, 58, 58, 57, 57, 57] },
        { label: "System pressure", value: "371", unit: "kPa", status: "normal", trend: [374, 373, 373, 372, 371, 371] },
      ],
      choices: [
        { id: "systematic-flush", label: "Execute a planned unidirectional flushing program starting from the transmission main and working outward to dead ends, with chlorine residual testing at each valve closure point before moving to the next section", rationale: "Unidirectional flushing ensures fresh chlorinated water displaces the stagnant water in a controlled sequence. Testing at each stage provides evidence that every section has been restored before moving on.", points: 20, consequence: "The systematic flush restores verified residual throughout the zone within 3 hours. Every section has documented recovery. The advisory can be lifted once bacteriological samples confirm safety." },
        { id: "random-flush", label: "Open multiple hydrants simultaneously across the zone to create high-velocity flow that displaces the unchlorinated water quickly, then sample at all monitoring points once flow stabilizes", rationale: "High-velocity simultaneous flushing moves more water faster than sequential flushing. The turbulent flow scours pipe walls and the volume displaced in one hour exceeds what unidirectional flushing achieves in three.", points: 6, consequence: "The high-velocity flush restores residual at main-line monitors, but creates pressure transients that don't reach dead ends. Two areas near schools still show zero residual after the flush completes." },
        { id: "wait-natural", label: "Allow normal customer demand to gradually draw chlorinated water from the transmission main into the zone, supplemented by targeted flushing only at the three confirmed zero-residual monitoring points", rationale: "The root cause is fixed and transmission residual is 0.94 mg/L. Normal demand will pull this chlorinated water through the zone naturally. Targeted flushing at the worst points accelerates recovery where it matters most.", points: 0, consequence: "The three monitoring points recover within 2 hours, but dead-end areas between them remain at zero for 18+ hours. The advisory cannot be lifted because full zone coverage isn't achieved." },
      ],
      judgment: {
        prompt: "The cause is fixed but the east zone still has no chlorine. How will you restore it and prove it's safe before recommending the advisory be lifted?",
        placeholder: "I would restore residual by... I would verify each area by...",
        minCharacters: 20,
        ruleBranches: { strong: "systematic-flush", partial: "random-flush", unsafe: "wait-natural" },
      },
      branchSteps: {
        "systematic-flush": {
          id: "advisory-lift-verified",
          time: "18:45",
          title: "Ready to lift the advisory",
          briefing: "The systematic flush reached every monitoring point. Residual is back and the first round of lab samples is clean. The second round is still pending.",
          alarm: "SECOND SAMPLE ROUND PENDING",
          focusNode: 4,
          telemetry: [
            { label: "East zone residual", value: "0.52", unit: "mg/L", status: "normal", trend: [0, 0.12, 0.28, 0.38, 0.46, 0.52] },
            { label: "Dead-end coverage", value: "100", unit: "%", status: "normal", trend: [0, 20, 45, 70, 90, 100] },
            { label: "Sample round 1", value: "PASS", unit: "", status: "normal", trend: [0, 0, 0, 0, 1, 1] },
            { label: "Sample round 2", value: "PENDING", unit: "", status: "warning", trend: [0, 0, 0, 0, 0, 0] },
          ],
          choices: [
            { id: "wait-second-round", label: "Wait for the second clean sample round and have the public notice ready to send the moment results confirm", rationale: "The protocol requires two clean rounds. Have everything ready so you can lift it fast once confirmed.", points: 20, consequence: "The second round passes and the advisory is lifted with a complete verification record." },
            { id: "lift-on-residual", label: "Recommend lifting now since residual is back and the first round passed", rationale: "The available evidence shows recovery.", points: 5, consequence: "The advisory is lifted before the full protocol is complete." },
            { id: "lift-immediately", label: "Lift it right now — customers have waited long enough", rationale: "People have been boiling water for hours already.", points: 0, consequence: "You abandon the final verification step at the point of recovery." },
          ],
        },
        "random-flush": {
          id: "advisory-lift-pressure-transient",
          time: "18:45",
          title: "A dead end still has no chlorine",
          briefing: "The random flushing restored residual at the central monitors, but a dead-end area near a school still shows zero after a pressure surge. You can't prove the whole zone is safe.",
          alarm: "DEAD-END RESIDUAL ZERO",
          focusNode: 4,
          telemetry: [
            { label: "Central residual", value: "0.48", unit: "mg/L", status: "normal", trend: [0, 0.1, 0.22, 0.34, 0.42, 0.48] },
            { label: "School-zone residual", value: "0.00", unit: "mg/L", status: "critical", trend: [0, 0, 0, 0, 0, 0] },
            { label: "Minimum pressure", value: "91", unit: "kPa", status: "critical", trend: [371, 330, 275, 198, 123, 91] },
            { label: "Zone coverage", value: "82", unit: "%", status: "warning", trend: [0, 25, 45, 62, 74, 82] },
          ],
          choices: [
            { id: "targeted-recovery", label: "Keep the advisory active, stabilize pressure, and do a targeted flush and sample plan for the unverified dead end", rationale: "Fix the coverage gap properly before making a zone-wide safety claim.", points: 20, consequence: "The dead end is brought into the verified recovery area without causing another pressure problem." },
            { id: "exclude-dead-end", label: "Lift the advisory for most of the zone and keep only the school block under precaution", rationale: "Most of the zone has recovered.", points: 5, consequence: "A partial lift is attempted without a fully documented plan for the remaining area." },
            { id: "average-result", label: "Use the zone-wide average residual and lift the advisory", rationale: "The average across all monitors is now acceptable.", points: 0, consequence: "Averages hide the specific unprotected dead end and create a false safety claim." },
          ],
        },
        "wait-natural": {
          id: "advisory-lift-prolonged-outage",
          time: "18:45",
          title: "The advisory extends overnight",
          briefing: "Natural flow hasn't restored the eastern dead ends. Schools and care facilities need an overnight water plan, and public health wants a defined recovery timeline.",
          alarm: "RESIDUAL LOSS CONTINUES — 18 HOURS",
          focusNode: 4,
          telemetry: [
            { label: "East zone residual", value: "0.06", unit: "mg/L", status: "critical", trend: [0, 0, 0.01, 0.02, 0.04, 0.06] },
            { label: "Advisory duration", value: "18", unit: "hours", status: "critical", trend: [4, 6, 9, 12, 15, 18] },
            { label: "Critical facilities", value: "4", unit: "open needs", status: "warning", trend: [2, 2, 3, 3, 4, 4] },
            { label: "Verified coverage", value: "35", unit: "%", status: "critical", trend: [0, 8, 15, 21, 29, 35] },
          ],
          choices: [
            { id: "activate-recovery", label: "Keep the advisory, start a proper flushing and sampling plan, and arrange alternate water for critical facilities", rationale: "Move from waiting to a controlled recovery with a real timeline.", points: 20, consequence: "The utility establishes a credible recovery timeline and protects critical facilities while verification proceeds." },
            { id: "wait-overnight", label: "Keep waiting overnight and check again in the morning", rationale: "More time should eventually restore residual.", points: 4, consequence: "The advisory continues without any defined plan for restoring the barrier." },
            { id: "lift-for-fatigue", label: "Lift the advisory because people have been complying long enough", rationale: "Advisory fatigue might be a bigger risk than low residual at this point.", points: 0, consequence: "You lift precautions while most of the zone is still unverified." },
          ],
        },
      },
    },
    {
      id: "advisory-lift",
      time: "18:45",
      title: "Can you lift the boil water advisory?",
      briefing: "Residual is back throughout the zone. Two rounds of samples have been collected. The first round is clean (no coliform, no E. coli). The second round is still pending. The Medical Officer of Health asks if the advisory can be lifted.",
      alarm: "ADVISORY LIFT DECISION — SECOND SAMPLE PENDING",
      focusNode: 4,
      telemetry: [
        { label: "East zone residual", value: "0.52", unit: "mg/L", status: "normal", trend: [0.00, 0.12, 0.28, 0.38, 0.46, 0.52] },
        { label: "Sample round 1", value: "Pass", unit: "", status: "normal", trend: [0, 0, 0, 0, 1, 1] },
        { label: "Sample round 2", value: "Pending", unit: "", status: "warning", trend: [0, 0, 0, 0, 0, 0] },
        { label: "System pressure", value: "378", unit: "kPa", status: "normal", trend: [371, 373, 374, 376, 377, 378] },
      ],
      choices: [
        { id: "wait-second-round", label: "Advise the MOH that the protocol requires two consecutive clean sample rounds before lifting, prepare all public notification materials now, and issue the lift notice within 30 minutes of the second round confirming clean", rationale: "The two-round requirement exists because a single clean result doesn't rule out intermittent contamination. Having materials pre-staged means the advisory is lifted at the earliest defensible moment.", points: 20, consequence: "The second round comes back clean 4 hours later. The advisory is lifted with a complete verification record. Public confidence is maintained because the process was transparent and thorough." },
        { id: "lift-on-residual", label: "Recommend a conditional lift to the MOH based on confirmed residual recovery at all monitoring points plus one clean bacteriological round, with enhanced monitoring for 48 hours as a precaution", rationale: "Residual recovery at all points plus one clean round provides strong evidence of safety. The 48-hour enhanced monitoring period catches any delayed contamination while reducing the public burden of the advisory.", points: 5, consequence: "The MOH accepts the conditional lift. Enhanced monitoring shows no issues, but the regulatory review notes the two-round protocol wasn't fully followed and issues a procedural finding." },
        { id: "lift-immediately", label: "Recommend lifting immediately based on the restored residual and first clean round — the second round can be collected as post-advisory surveillance to confirm the decision was correct", rationale: "The advisory has been active for over 4 hours and is causing significant community disruption. Residual is confirmed at 0.52 mg/L everywhere and one full bacteriological round is clean. Continuing the advisory beyond this point causes more harm than the residual risk justifies.", points: 0, consequence: "The advisory is lifted. The second sample round reveals coliform at one dead-end location. The advisory must be re-issued, creating a serious public confidence crisis and regulatory investigation." },
      ],
    },
  ],
};

import { OAKDALE_ALGAE_BLOOM, PINEWOOD_POWER_OUTAGE, CLEARWATER_CYBER, MAPLEWOOD_SEWER_OVERFLOW, HILLCREST_CHLORINE_LEAK, BROOKFIELD_CASCADE, WESTLAKE_FLOODING, THORNTON_BACKFLOW } from "./commandScenariosExpanded";

export const ALL_SCENARIOS: ScenarioMeta[] = [
  CEDAR_RIDGE_STORM,
  MILLBROOK_CHEMICAL_DOSING,
  RIVERSIDE_MAIN_BREAK,
  LAKEVIEW_BOIL_WATER,
  OAKDALE_ALGAE_BLOOM,
  PINEWOOD_POWER_OUTAGE,
  CLEARWATER_CYBER,
  MAPLEWOOD_SEWER_OVERFLOW,
  HILLCREST_CHLORINE_LEAK,
  BROOKFIELD_CASCADE,
  WESTLAKE_FLOODING,
  THORNTON_BACKFLOW,
];

export function getScenarioById(id: string): ScenarioMeta | undefined {
  return ALL_SCENARIOS.find(s => s.id === id);
}

export function getScenarioStepAtIndex(
  scenario: ScenarioMeta,
  index: number,
  previousChoiceIds: string[],
): ScenarioStep | undefined {
  const baseStep = scenario.steps[index];
  if (!baseStep || index === 0) return baseStep;
  const previousBaseStep = scenario.steps[index - 1];
  const previousChoiceId = previousChoiceIds[index - 1];
  return previousBaseStep?.branchSteps?.[previousChoiceId] ?? baseStep;
}
