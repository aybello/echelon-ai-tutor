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
        { id: "verify-optimize", label: "Check the raw reading, run a jar test, and adjust the coagulant dose based on the result", rationale: "Confirm the reading is real, then match the chemical dose to the new water quality before it reaches the filters.", points: 20, consequence: "The reading is confirmed. The adjusted dose builds stronger floc before the dirty water reaches filtration." },
        { id: "dose-blind", label: "Double the coagulant dose right away", rationale: "More chemical might handle the extra turbidity.", points: 8, consequence: "Filtered water holds for now, but the unverified dose drops the pH and creates extra sludge." },
        { id: "wait", label: "Wait until finished water actually alarms", rationale: "Finished water is still fine, so nothing needs to change yet.", points: 0, consequence: "The dirty water moves through the plant unchecked and uses up the time you had to respond." },
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
        { id: "isolate-filter", label: "Take Filter 2 offline, keep a sample, and check that the other filters can handle the load", rationale: "Stop the bad filter from contaminating the combined output while you still have enough capacity.", points: 20, consequence: "The breakthrough is contained. Combined turbidity stabilizes while the team backwashes and inspects Filter 2." },
        { id: "backwash-all", label: "Backwash every filter at once", rationale: "Reset all filters before things get worse.", points: 6, consequence: "Too much capacity goes offline at once. The clearwell starts draining fast." },
        { id: "reduce-alarm", label: "Raise the alarm setpoint so it stops alarming", rationale: "The high reading might just be a storm artifact.", points: 0, consequence: "The problem continues without anyone watching it, and you lose a key warning." },
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
        { id: "ct-verify", label: "Check the analyser, calculate the current CT, and make a controlled dose increase", rationale: "Treat the residual as part of the disinfection barrier — not just a number. Verify before adjusting.", points: 20, consequence: "The analyser is accurate. A controlled increase restores residual while the CT check confirms disinfection is still working." },
        { id: "maximum-dose", label: "Crank the chlorine feed to maximum", rationale: "Get the residual back up as fast as possible.", points: 7, consequence: "Residual recovers, but the uncontrolled increase creates a high-chlorine problem downstream." },
        { id: "trust-downstream", label: "Do nothing — distribution still has some residual", rationale: "There's still chlorine in the system, so it should be fine.", points: 0, consequence: "Clearwell residual keeps falling and you're approaching a loss of disinfection." },
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
        { id: "escalate-document", label: "Start the escalation protocol, save all records, and keep taking verification samples", rationale: "Report through the proper chain, protect the evidence, and keep checking that things stay stable.", points: 20, consequence: "The incident is formally controlled. Notifications, samples, and operator actions are all recorded in one clear timeline." },
        { id: "log-later", label: "Keep monitoring and fill in the paperwork at the end of shift", rationale: "The immediate risk is over, so the log can wait.", points: 6, consequence: "The plant stays stable, but the delayed report creates gaps in the official record." },
        { id: "delete-alarm", label: "Clear the alarm since readings are recovering", rationale: "Closing the alarm gets the control room back to normal.", points: 0, consequence: "The event loses its audit trail. No one can prove when the problem was found or what was done about it." },
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
        { id: "recovery-gate", label: "Wait until all verification criteria are met, then do a documented after-action review", rationale: "Recovery is a controlled step — you need proof that things are truly stable before closing.", points: 20, consequence: "The plant closes the event with verified stability, a complete timeline, and clear lessons for next time." },
        { id: "normal-now", label: "Go back to normal setpoints and staffing right away", rationale: "The major alarms are gone and things look stable.", points: 7, consequence: "The plant recovers, but quick normalization means less monitoring during the period when problems could bounce back." },
        { id: "keep-emergency", label: "Stay in emergency mode indefinitely", rationale: "Being cautious is always safer after a serious event.", points: 3, consequence: "Staying in emergency mode too long creates unnecessary chemical and filter problems." },
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
        { id: "standby-switch", label: "Switch to the backup pump, check the dose matches today's jar test, and confirm chemical is flowing", rationale: "Get chemical feed back online immediately using the backup while making sure the dose is right.", points: 20, consequence: "The backup pump restores coagulant within minutes. Floc formation recovers and filtered turbidity stays within limits." },
        { id: "reduce-flow", label: "Slow down the plant flow to buy time while you investigate the pump", rationale: "Lower flow means less untreated water reaching the filters.", points: 8, consequence: "Slower flow buys time but doesn't fix the missing chemical. Floc quality keeps getting worse." },
        { id: "wait-investigate", label: "Figure out what's wrong with the pump before doing anything else", rationale: "Understand the problem before switching equipment.", points: 0, consequence: "Untreated water keeps flowing through. By the time you diagnose the fault, settled water turbidity has risen a lot." },
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
        { id: "adjust-dose", label: "Recalculate the dose from the jar test, adjust the pump, and log the change", rationale: "Use the test result to set the right dose and keep a record of what you changed.", points: 20, consequence: "The corrected dose restores floc quality. Settled water turbidity starts dropping and filter loading stabilizes." },
        { id: "max-dose", label: "Set the pump to maximum output to be safe", rationale: "Over-dosing is better than under-dosing during an emergency.", points: 6, consequence: "Extra coagulant helps floc temporarily but drops the pH too low, which increases chlorine demand and sludge." },
        { id: "accept-dose", label: "Leave the dose as-is since filtered water is still within limits", rationale: "Finished water is compliant, so the current dose must be enough.", points: 0, consequence: "The low dose lets settled water turbidity keep rising. Within the next cycle, the filter load goes above design limits." },
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
        { id: "planned-backwash", label: "Backwash Filter 1 now, confirm Filter 2 can handle the load, and log it as a result of the dosing event", rationale: "Deal with the overloaded filter before it fails, keep enough capacity online, and document why it happened early.", points: 20, consequence: "Filter 1 is back in service after a good backwash. The early backwash is logged as part of the dosing incident, completing the record." },
        { id: "delay-backwash", label: "Wait until headloss hits the normal trigger point", rationale: "Backwashing early wastes treated water and breaks the filter run.", points: 5, consequence: "Headloss keeps climbing and you end up doing an emergency backwash under worse conditions." },
        { id: "increase-flow", label: "Increase plant flow to keep the clearwell full", rationale: "Higher flow will maintain the clearwell level.", points: 0, consequence: "More flow through an already-loaded filter speeds up breakthrough and makes things worse." },
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
        { id: "schedule-repair", label: "Get the pump repaired now, add seal inspections to the maintenance schedule, and document the failure in the incident report", rationale: "Fix the root cause, prevent it from happening again, and keep a complete record.", points: 20, consequence: "The pump is repaired and back in service. The maintenance program is updated to catch this before it fails again. The incident report is complete." },
        { id: "run-standby", label: "Keep running the backup and schedule the repair for the next planned outage", rationale: "The backup is working fine and a repair can wait.", points: 7, consequence: "The plant runs with no backup. If the backup also fails before the repair, there's no chemical feed at all." },
        { id: "ignore-cause", label: "Put the failed pump back in service without fixing it and see how it goes", rationale: "The pump might still work well enough for a while.", points: 0, consequence: "The worn seal fails again within days during a higher-turbidity event, creating a much more serious problem." },
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
        { id: "full-close", label: "Go through the reporting checklist, confirm no limits were exceeded, document the review, and close with a complete timeline", rationale: "A proper close-out protects the facility if anyone reviews this event later.", points: 20, consequence: "The incident is closed with a complete record. No limits were exceeded. The facility is ready if this event is ever audited." },
        { id: "verbal-close", label: "Verbally confirm with the supervisor that it's over and go back to normal", rationale: "Everything recovered and no limits were exceeded.", points: 5, consequence: "The event is closed without a written record. If a regulator asks about the chemical feed interruption later, there's nothing to show them." },
        { id: "no-close", label: "Leave the incident open until the pump repair is finished", rationale: "The incident isn't really over until all corrective actions are done.", points: 2, consequence: "An open incident with no active emergency creates confusion and delays the lessons-learned review." },
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
        { id: "isolate-zone", label: "Send a crew to close the valves around the break, notify the supervisor, and start the emergency checklist", rationale: "Stop the water loss by isolating the broken section while activating the emergency response.", points: 20, consequence: "The crew closes the valves within 18 minutes. Water loss stops and Zone 3 pressure starts recovering from the reservoir." },
        { id: "boost-pumps", label: "Increase pump output to keep zone pressure up while you investigate", rationale: "More pumping might make up for the pressure loss.", points: 6, consequence: "More pumping pushes more water out the break. The reservoir drains faster and road damage gets worse." },
        { id: "monitor-only", label: "Watch the pressure for 30 minutes before sending anyone", rationale: "It might be a sensor problem or a temporary demand spike.", points: 0, consequence: "The break runs uncontrolled. The reservoir drops below minimum and Zone 3 loses pressure completely, including fire protection." },
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
        { id: "notify-hospital", label: "Check that the hospital's emergency supply is working, send a public notice to affected customers, and give them an estimated fix time", rationale: "Take care of the most critical facility first, then communicate clearly with everyone affected.", points: 20, consequence: "The hospital confirms their supply is fine. Customer calls drop after the notice goes out. People accept the timeline." },
        { id: "restore-first", label: "Focus everything on fixing the pipe before telling anyone", rationale: "Getting water back on is more important than sending notices.", points: 7, consequence: "Without information, customers and media start speculating. The hospital calls you directly, pulling the supervisor away from the repair." },
        { id: "no-notice", label: "Wait until the repair is done before notifying anyone", rationale: "Sending a notice before it's fixed might cause panic.", points: 0, consequence: "Customers without water call 911 and media. The lack of communication turns a pipe break into a public relations crisis." },
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
        { id: "temporary-bypass", label: "Install a temporary bypass to get water to the hospital and critical buildings while the replacement pipe is prepared", rationale: "A bypass gets minimum service to the people who need it most and reduces the health risk of a long outage.", points: 20, consequence: "The bypass restores 45 L/s within 90 minutes. The hospital and care facilities get water back. The full repair is done while the bypass keeps things flowing." },
        { id: "wait-pipe", label: "Wait for the replacement pipe and do one complete repair", rationale: "One repair is faster overall than doing a bypass and then a permanent fix.", points: 8, consequence: "The 4-hour wait extends the outage. The hospital runs out of emergency supply and needs a water tanker, making everything more complicated and expensive." },
        { id: "partial-open", label: "Crack open the isolation valve to let some water through while you wait", rationale: "Some flow is better than no flow for the affected customers.", points: 0, consequence: "Opening the valve floods the excavation with dirty water, contaminating the repair site and making the fix much harder." },
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
        { id: "full-protocol", label: "Do the contamination assessment, flush and disinfect the pipe, and take samples before putting it back in service", rationale: "Follow the protocol to protect public health and keep your compliance record clean.", points: 20, consequence: "The assessment shows a flush is needed. The flush is done, samples are taken, and the main goes back in service with a clean record." },
        { id: "visual-only", label: "Do a visual inspection and put the main back in service without sampling", rationale: "The repair looks clean and the bypass kept water flowing.", points: 4, consequence: "The main goes back without verification. A regulator audit later flags the missing contamination assessment as a compliance gap." },
        { id: "skip-assessment", label: "Put the main back in service right away to restore full pressure", rationale: "Customers have been without full service for over an hour and that's the priority.", points: 0, consequence: "The main goes back without checking. A coliform sample the next day comes back positive, triggering a boil water advisory and a regulatory investigation." },
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
        { id: "full-closeout", label: "Send a restoration notice to customers, document the reservoir recovery plan, submit the incident report, and schedule a post-incident review", rationale: "A complete close-out protects the facility, informs customers, and helps you do better next time.", points: 20, consequence: "Customers get the notice. The report is complete. The review identifies valve maintenance and bypass equipment as priorities." },
        { id: "partial-closeout", label: "Restore service and tell the call centre, but write the report later this week", rationale: "The emergency is over and the report can wait.", points: 6, consequence: "The report is written days later from memory. Key details are missing and the reservoir plan is never documented." },
        { id: "no-closeout", label: "Go back to normal without any formal close-out", rationale: "The repair is done and the system is back to normal.", points: 0, consequence: "No record exists. When a similar break happens six months later, there's nothing to reference for improvement." },
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
        { id: "notify-moh", label: "Call the Medical Officer of Health right away, start the boil water advisory process, and begin investigating why the residual disappeared", rationale: "Zero residual at multiple confirmed points is a public health trigger. You must notify the regulator and warn the public.", points: 20, consequence: "The MOH is notified within 30 minutes. A boil water advisory is issued for the eastern zone. The investigation begins." },
        { id: "flush-first", label: "Flush the mains to try to restore residual before calling the regulator", rationale: "If you can fix it quickly, maybe you won't need a formal advisory.", points: 5, consequence: "Flushing helps some areas but you don't know the cause. The delayed notification violates the reporting timeline and creates a compliance issue." },
        { id: "resample-only", label: "Take more samples and wait for lab results before doing anything", rationale: "The portable kit might be wrong — wait for the lab to confirm.", points: 0, consequence: "The delay means people (including schoolchildren) keep drinking water with no disinfection protection while you wait for lab results." },
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
        { id: "systematic-check", label: "Close the reservoir valve to stop the dilution, check the contractor's permit and meter, then figure out which cause is the main one", rationale: "Fix the most likely controllable cause first while gathering evidence to confirm what actually happened.", points: 20, consequence: "Closing the valve stops the dilution. Residual starts recovering in the transmission main. The contractor's meter confirms they were a secondary factor. Root cause is documented." },
        { id: "stop-contractor", label: "Tell the contractor to stop flushing immediately and check their permit", rationale: "The contractor's unauthorized flow is probably the main cause.", points: 8, consequence: "The contractor stops but the reservoir valve stays open. Residual doesn't recover because the dilution is still happening." },
        { id: "boost-chlorine", label: "Increase the chlorine dose at the plant to push residual into the zone", rationale: "More chlorine from the plant will eventually reach the east zone.", points: 3, consequence: "Higher plant dose takes hours to reach the eastern zone through the pipes. The dilution source is still active so residual doesn't recover in the affected area." },
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
        { id: "direct-notify", label: "Call both school principals directly, make sure they understand the precautions, then give the media a factual statement with a timeline", rationale: "Critical facilities need direct contact. The public needs honest, clear information.", points: 20, consequence: "Both schools confirm and stop using tap water for food. The media statement is factual and reduces public worry. The utility looks responsive." },
        { id: "media-first", label: "Put out the media statement first to control the story, then call the schools", rationale: "A public statement reaches more people faster than individual calls.", points: 6, consequence: "Schools hear about it from the news before you call them. One school already served lunch using tap water. The delayed direct notice is flagged in the regulatory review." },
        { id: "defer-communication", label: "Don't communicate anything until the residual is fixed to avoid causing panic", rationale: "Telling people before it's fixed will just scare them.", points: 0, consequence: "Schools keep using tap water. When the advisory is finally communicated, the delayed notification triggers a formal complaint and regulatory investigation." },
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
        { id: "systematic-flush", label: "Do a planned one-direction flush starting from the main and working outward to dead ends, testing chlorine at each stage", rationale: "Unidirectional flushing is the most effective way to push fresh chlorinated water through every pipe while confirming it worked.", points: 20, consequence: "The systematic flush restores residual throughout the zone within 3 hours. Sampling confirms recovery at all points. The advisory can be lifted once verification samples come back clean." },
        { id: "random-flush", label: "Open hydrants all over the zone at the same time to flush it fast", rationale: "Opening lots of hydrants at once will flush the zone faster.", points: 6, consequence: "Simultaneous flushing creates pressure surges that could pull contamination into service connections. Some dead-end areas aren't reached and stay at zero." },
        { id: "wait-natural", label: "Let normal water flow gradually restore the residual on its own", rationale: "The system will eventually push chlorinated water through as people use water.", points: 0, consequence: "Natural flow takes 18-24 hours to reach dead ends. The boil water advisory stays active much longer, increasing the risk and community impact." },
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
        { id: "wait-second-round", label: "Tell the MOH to wait for the second sample round, and have the public notice ready to send the moment results confirm it's safe", rationale: "The protocol requires two consecutive clean rounds before lifting. Prepare everything so you can act fast once confirmed.", points: 20, consequence: "The second round comes back clean. The advisory is lifted with a complete two-round verification record. The public notice goes out within 30 minutes." },
        { id: "lift-on-residual", label: "Recommend lifting now because residual is back and the first round passed", rationale: "Residual recovery plus one clean round shows the water is safe.", points: 5, consequence: "The MOH lifts it based on one round. The regulatory review later notes the two-round protocol wasn't followed. The utility gets a compliance notice." },
        { id: "lift-immediately", label: "Lift it right now and collect the second round as post-advisory monitoring", rationale: "The water looks safe and customers have been under the advisory for over 4 hours.", points: 0, consequence: "The advisory is lifted before verification is complete. The second round comes back positive for coliform. The advisory has to be re-issued, creating a serious public confidence crisis." },
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
