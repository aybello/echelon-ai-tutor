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
  ruleBranches?: Record<string, string>;
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

// ─── Scenario 1: Cedar Ridge — Storm Response (original) ───────────────────
export const CEDAR_RIDGE_STORM: ScenarioMeta = {
  id: "cedar-ridge-storm",
  title: "Cedar Ridge Storm Response",
  subtitle: "Turbidity breakthrough during extreme-rain event",
  badge: "Filtration & Disinfection",
  durationLabel: "8-minute scenario",
  facilityName: "Cedar Ridge WTP",
  incidentLabel: "Extreme-rain treatment-barrier response",
  processNodes: ["Raw intake", "Coagulation", "Filtration", "Clearwell", "Distribution"],
  steps: [
    {
      id: "source-shift",
      time: "02:14",
      title: "The source water changes",
      briefing: "A severe rain cell has crossed the watershed. Raw-water turbidity is rising quickly, but finished water remains within the plant's operating envelope.",
      alarm: "HIGH RATE OF CHANGE: RAW TURBIDITY",
      focusNode: 0,
      telemetry: [
        { label: "Raw turbidity", value: "28.4", unit: "NTU", status: "critical", trend: [3, 5, 8, 13, 19, 28] },
        { label: "Filtered turbidity", value: "0.18", unit: "NTU", status: "normal", trend: [0.12, 0.12, 0.13, 0.15, 0.16, 0.18] },
        { label: "Plant flow", value: "18.2", unit: "ML/d", status: "normal", trend: [18, 18, 18, 18, 18, 18] },
        { label: "Free chlorine", value: "1.12", unit: "mg/L", status: "normal", trend: [1.18, 1.16, 1.15, 1.14, 1.13, 1.12] },
      ],
      choices: [
        { id: "verify-optimize", label: "Verify the raw-water reading, run a jar test and adjust coagulation from the validated result", rationale: "Confirm the signal and respond to the changed source-water chemistry before downstream performance deteriorates.", points: 20, consequence: "The reading is confirmed. The optimized coagulant dose strengthens floc formation before the load reaches filtration." },
        { id: "dose-blind", label: "Immediately double the coagulant dose", rationale: "A larger dose might compensate for the turbidity spike.", points: 8, consequence: "Filtered water holds temporarily, but the unverified dose depresses pH and increases sludge loading." },
        { id: "wait", label: "Wait for finished-water turbidity to alarm", rationale: "Finished water is currently compliant, so no action is required yet.", points: 0, consequence: "The untreated load advances through the plant and consumes the response time available to operators." },
      ],
    },
    {
      id: "filter-breakthrough",
      time: "02:31",
      title: "Filter 2 begins to break through",
      briefing: "The source-water response helped, but Filter 2 is deteriorating faster than the other filters. Its effluent turbidity and headloss are both climbing.",
      alarm: "FILTER 2 TURBIDITY HIGH-HIGH",
      focusNode: 2,
      telemetry: [
        { label: "Filter 2 effluent", value: "0.42", unit: "NTU", status: "critical", trend: [0.16, 0.18, 0.21, 0.28, 0.35, 0.42] },
        { label: "Filter 2 headloss", value: "2.7", unit: "m", status: "warning", trend: [1.2, 1.4, 1.7, 2, 2.4, 2.7] },
        { label: "Combined effluent", value: "0.24", unit: "NTU", status: "warning", trend: [0.14, 0.15, 0.17, 0.19, 0.22, 0.24] },
        { label: "Clearwell level", value: "74", unit: "%", status: "normal", trend: [77, 77, 76, 75, 74, 74] },
      ],
      choices: [
        { id: "isolate-filter", label: "Remove Filter 2 from service, preserve the sample and verify performance on the remaining filters", rationale: "Contain a localized breakthrough while maintaining a documented verification chain.", points: 20, consequence: "The breakthrough is isolated. Combined-filter turbidity stabilizes while the team starts a controlled backwash and inspection." },
        { id: "backwash-all", label: "Backwash every filter immediately", rationale: "Reset the entire filtration stage before conditions worsen.", points: 6, consequence: "The plant loses too much filtration capacity at once and clearwell storage begins falling rapidly." },
        { id: "reduce-alarm", label: "Raise the alarm threshold so nuisance alarms stop", rationale: "The high reading may be a temporary storm artifact.", points: 0, consequence: "The process deviation continues without containment and the operator loses a critical warning barrier." },
      ],
    },
    {
      id: "disinfection-risk",
      time: "02:47",
      title: "Disinfection margin narrows",
      briefing: "The plant is hydraulically stable, but chlorine demand has increased and the clearwell residual is declining. Contact-time margin is now uncertain.",
      alarm: "LOW DISINFECTION RESIDUAL",
      focusNode: 3,
      telemetry: [
        { label: "Clearwell residual", value: "0.32", unit: "mg/L", status: "critical", trend: [0.96, 0.81, 0.67, 0.53, 0.41, 0.32] },
        { label: "Clearwell level", value: "68", unit: "%", status: "normal", trend: [74, 73, 72, 70, 69, 68] },
        { label: "Plant pH", value: "7.3", unit: "pH", status: "normal", trend: [7.4, 7.4, 7.3, 7.3, 7.3, 7.3] },
        { label: "Distribution residual", value: "0.61", unit: "mg/L", status: "warning", trend: [0.82, 0.79, 0.74, 0.69, 0.65, 0.61] },
      ],
      choices: [
        { id: "ct-verify", label: "Verify analyser accuracy, calculate the current CT margin and make a controlled dose adjustment", rationale: "Treat the residual as part of a disinfection barrier, not as a standalone number.", points: 20, consequence: "The analyser is valid. A controlled adjustment restores residual while the CT check confirms the barrier remains intact." },
        { id: "maximum-dose", label: "Set the chlorine feed to maximum output", rationale: "Restore residual as quickly as possible.", points: 7, consequence: "Residual recovers, but the uncontrolled response creates an avoidable high-chlorine condition downstream." },
        { id: "trust-downstream", label: "Take no action because distribution residual is still measurable", rationale: "The distribution system still contains a disinfectant residual.", points: 0, consequence: "Clearwell residual continues falling and the plant approaches loss of verified disinfection performance." },
      ],
    },
    {
      id: "confirmation",
      time: "03:06",
      title: "A verification result arrives",
      briefing: "A retained combined-effluent sample confirms the turbidity excursion. Operations are stable, but the event now requires a formal escalation and evidence trail.",
      alarm: "BARRIER DEVIATION CONFIRMED",
      focusNode: 4,
      telemetry: [
        { label: "Finished turbidity", value: "0.31", unit: "NTU", status: "warning", trend: [0.18, 0.22, 0.27, 0.34, 0.33, 0.31] },
        { label: "Free chlorine", value: "0.78", unit: "mg/L", status: "normal", trend: [0.32, 0.41, 0.54, 0.66, 0.73, 0.78] },
        { label: "Distribution pressure", value: "486", unit: "kPa", status: "normal", trend: [489, 488, 487, 487, 486, 486] },
        { label: "Open critical alarms", value: "1", unit: "alarm", status: "warning", trend: [1, 2, 3, 3, 2, 1] },
      ],
      choices: [
        { id: "escalate-document", label: "Initiate the facility's escalation protocol, preserve records and continue verification sampling", rationale: "Escalate through the approved emergency plan while protecting the evidence needed for regulatory review.", points: 20, consequence: "The incident is formally controlled. Notifications, samples, operator actions and instrument checks are preserved in one defensible timeline." },
        { id: "log-later", label: "Continue monitoring and complete the incident log at the end of the shift", rationale: "The immediate process risk has passed, so paperwork can wait.", points: 6, consequence: "The plant remains stable, but delayed escalation creates gaps in the official response record." },
        { id: "delete-alarm", label: "Acknowledge and delete the alarm because the readings are recovering", rationale: "Closing the alarm returns the control room to normal operation.", points: 0, consequence: "The event loses its auditable trail and the organization cannot demonstrate when the deviation was recognized or controlled." },
      ],
      judgment: {
        prompt: "You are the operator in charge. State what you do next and why. Include the checks, escalation and incident record you would require before recovery.",
        placeholder: "I would first verify... Then I would escalate... I would preserve...",
        minCharacters: 20,
      },
      branchSteps: {
        "escalate-document": {
          id: "stabilize-controlled",
          time: "03:28",
          title: "Controlled recovery gate",
          briefing: "Your escalation has brought the duty manager and compliance lead into the response. The treatment barriers are stable, the official timeline is current and leadership asks when the incident can be closed.",
          alarm: "RECOVERY CRITERIA REVIEW",
          focusNode: 3,
          telemetry: [
            { label: "Raw turbidity", value: "16.2", unit: "NTU", status: "warning", trend: [28, 27, 25, 22, 19, 16] },
            { label: "Filtered turbidity", value: "0.16", unit: "NTU", status: "normal", trend: [0.31, 0.27, 0.23, 0.2, 0.18, 0.16] },
            { label: "Verified samples", value: "3", unit: "clear", status: "normal", trend: [0, 0, 1, 1, 2, 3] },
            { label: "Open record gaps", value: "0", unit: "items", status: "normal", trend: [4, 4, 3, 2, 1, 0] },
          ],
          choices: [
            { id: "recovery-gate", label: "Hold recovery until verification criteria are met, then conduct a documented after-action review", rationale: "Recovery is a controlled phase with evidence-based exit criteria and organizational learning.", points: 20, consequence: "The plant closes the event with verified stability, a complete timeline and clear actions for the next extreme-weather event." },
            { id: "normal-now", label: "Return immediately to normal setpoints and staffing", rationale: "The major alarms have cleared and the process looks stable.", points: 7, consequence: "Rapid normalization reduces monitoring during the period when rebound effects are still possible." },
            { id: "keep-emergency", label: "Keep emergency settings indefinitely", rationale: "Conservative operation is safer after a serious event.", points: 3, consequence: "The prolonged emergency state creates avoidable chemical, residual and filter-loading problems." },
          ],
        },
        "log-later": {
          id: "stabilize-record-gap",
          time: "03:28",
          title: "Leadership finds a record gap",
          briefing: "The process has stabilized, but the duty manager cannot reconcile the alarm time, verification sample and escalation sequence. A regulator has requested the incident chronology before recovery is approved.",
          alarm: "INCIDENT RECORD INCOMPLETE",
          focusNode: 4,
          telemetry: [
            { label: "Filtered turbidity", value: "0.17", unit: "NTU", status: "normal", trend: [0.31, 0.28, 0.24, 0.21, 0.19, 0.17] },
            { label: "Unlogged actions", value: "4", unit: "items", status: "critical", trend: [0, 1, 2, 3, 4, 4] },
            { label: "Verification samples", value: "2", unit: "clear", status: "normal", trend: [0, 0, 1, 1, 2, 2] },
            { label: "Recovery approval", value: "HOLD", unit: "", status: "warning", trend: [1, 1, 1, 0, 0, 0] },
          ],
          choices: [
            { id: "reconstruct-escalate", label: "Keep the incident open, reconstruct the timeline from system records and samples, and escalate the documentation gap", rationale: "A late but transparent correction protects the integrity of the official record.", points: 20, consequence: "Recovery is delayed while the team reconciles the record, but both the deviation and documentation failure are formally controlled." },
            { id: "estimate-times", label: "Fill the missing entries from memory and close the incident", rationale: "Approximate entries can complete the record quickly.", points: 5, consequence: "The log appears complete, but unsupported times weaken its reliability during review." },
            { id: "process-only", label: "Close the incident because the treatment process is stable", rationale: "Operational recovery matters more than delayed paperwork.", points: 0, consequence: "The facility enters regulatory review without a defensible chronology." },
          ],
        },
        "delete-alarm": {
          id: "stabilize-audit-loss",
          time: "03:28",
          title: "The audit trail is challenged",
          briefing: "The process is recovering, but the compliance lead discovers that the alarm was deleted. The control-room record no longer shows when the confirmed deviation was acknowledged or controlled.",
          alarm: "EVIDENCE CHAIN FAILURE",
          focusNode: 4,
          telemetry: [
            { label: "Filtered turbidity", value: "0.18", unit: "NTU", status: "normal", trend: [0.31, 0.28, 0.25, 0.22, 0.2, 0.18] },
            { label: "Alarm history", value: "MISSING", unit: "", status: "critical", trend: [1, 1, 1, 1, 0, 0] },
            { label: "Independent samples", value: "2", unit: "records", status: "warning", trend: [0, 0, 1, 1, 2, 2] },
            { label: "Incident status", value: "OPEN", unit: "", status: "critical", trend: [1, 1, 1, 1, 1, 1] },
          ],
          choices: [
            { id: "disclose-reconstruct", label: "Disclose the deletion, preserve all remaining evidence and reconstruct the event with independent records", rationale: "Recovery starts with transparency and preservation of every surviving source.", points: 20, consequence: "The alarm history cannot be restored, but prompt disclosure and corroborating records create the strongest defensible recovery path available." },
            { id: "restore-copy", label: "Create a replacement alarm entry using the remembered time", rationale: "A reconstructed entry may make the timeline look complete.", points: 4, consequence: "The new entry is not a system-generated record and creates a second integrity concern." },
            { id: "omit-deletion", label: "Document only the current stable readings and omit the deletion", rationale: "The recovered process condition should be sufficient to close the event.", points: 0, consequence: "The organization compounds the original evidence loss with an incomplete disclosure." },
          ],
        },
      },
    },
    {
      id: "stabilize",
      time: "03:28",
      title: "Move from response to recovery",
      briefing: "Raw-water conditions are improving. The treatment barriers are stable and leadership asks when the incident can be closed.",
      alarm: "RECOVERY GATE AVAILABLE",
      focusNode: 3,
      telemetry: [
        { label: "Raw turbidity", value: "16.2", unit: "NTU", status: "warning", trend: [28, 27, 25, 22, 19, 16] },
        { label: "Filtered turbidity", value: "0.16", unit: "NTU", status: "normal", trend: [0.31, 0.27, 0.23, 0.2, 0.18, 0.16] },
        { label: "Free chlorine", value: "0.84", unit: "mg/L", status: "normal", trend: [0.54, 0.62, 0.71, 0.78, 0.82, 0.84] },
        { label: "Open critical alarms", value: "0", unit: "alarms", status: "normal", trend: [3, 3, 2, 1, 1, 0] },
      ],
      choices: [
        { id: "recovery-gate", label: "Hold the recovery state until verification criteria are met, then conduct a documented after-action review", rationale: "Recovery is a controlled phase with evidence-based exit criteria and organizational learning.", points: 20, consequence: "The plant closes the event with verified stability, a complete timeline and clear actions for the next extreme-weather event." },
        { id: "normal-now", label: "Return immediately to normal setpoints and staffing", rationale: "The major alarms have cleared and the process looks stable.", points: 7, consequence: "The plant recovers, but rapid normalization reduces monitoring during the period when rebound effects are still possible." },
        { id: "keep-emergency", label: "Keep emergency settings indefinitely", rationale: "Conservative operation is safer after a serious event.", points: 3, consequence: "The plant remains safe but accumulates chemical, residual and filter-loading problems from an unnecessarily prolonged emergency state." },
      ],
    },
  ],
};

// ─── Scenario 2: Millbrook — Chemical Dosing Failure ───────────────────────
export const MILLBROOK_CHEMICAL_DOSING: ScenarioMeta = {
  id: "millbrook-chemical-dosing",
  title: "Millbrook Chemical Dosing Failure",
  subtitle: "Coagulant feed pump failure during peak demand",
  badge: "Chemical Feed & Coagulation",
  durationLabel: "8-minute scenario",
  facilityName: "Millbrook WTP",
  incidentLabel: "Coagulant feed failure — filtration risk",
  processNodes: ["Raw intake", "Chemical feed", "Flocculation", "Sedimentation", "Filtration"],
  steps: [
    {
      id: "pump-alarm",
      time: "10:07",
      title: "Coagulant pump alarm triggers",
      briefing: "The duty coagulant feed pump has alarmed and stopped. Raw water is entering the flocculation basin without chemical treatment. Finished-water turbidity is still within range but the lag time is short.",
      alarm: "COAGULANT PUMP FAULT — DUTY PUMP STOPPED",
      focusNode: 1,
      telemetry: [
        { label: "Coagulant flow", value: "0.0", unit: "L/h", status: "critical", trend: [42, 42, 42, 20, 5, 0] },
        { label: "Raw turbidity", value: "6.8", unit: "NTU", status: "normal", trend: [6.5, 6.6, 6.7, 6.7, 6.8, 6.8] },
        { label: "Floc basin turbidity", value: "5.9", unit: "NTU", status: "warning", trend: [2.1, 2.3, 2.8, 3.9, 4.8, 5.9] },
        { label: "Filtered turbidity", value: "0.09", unit: "NTU", status: "normal", trend: [0.08, 0.08, 0.09, 0.09, 0.09, 0.09] },
      ],
      choices: [
        { id: "standby-switch", label: "Switch to the standby coagulant pump, verify the dose rate against the current jar-test target and confirm chemical delivery", rationale: "Restore chemical feed immediately using the redundant pump while verifying the dose is correct for current raw-water conditions.", points: 20, consequence: "The standby pump restores coagulant delivery within minutes. Floc formation recovers and filtered turbidity remains within the operating limit." },
        { id: "reduce-flow", label: "Reduce plant flow rate to buy time while investigating the pump fault", rationale: "Lower throughput reduces the rate at which untreated water reaches filtration.", points: 8, consequence: "Flow reduction slows the deterioration but does not restore the chemical barrier. Floc quality continues to decline and filter loading increases." },
        { id: "wait-investigate", label: "Investigate the pump fault before taking any process action", rationale: "Understand the root cause before switching equipment.", points: 0, consequence: "Untreated water continues through the flocculation basin. By the time the fault is diagnosed, settled-water turbidity has risen significantly." },
      ],
    },
    {
      id: "dose-verification",
      time: "10:19",
      title: "Dose rate needs recalculation",
      briefing: "The standby pump is running but the coagulant dose was set for yesterday's raw-water conditions. A jar test shows the current dose is 15% below optimum for today's alkalinity.",
      alarm: "COAGULANT DOSE BELOW OPTIMUM — JAR TEST RESULT",
      focusNode: 1,
      telemetry: [
        { label: "Coagulant flow", value: "38", unit: "L/h", status: "warning", trend: [0, 0, 38, 38, 38, 38] },
        { label: "Floc basin turbidity", value: "4.2", unit: "NTU", status: "warning", trend: [5.9, 5.4, 4.8, 4.5, 4.3, 4.2] },
        { label: "Settled-water turbidity", value: "1.8", unit: "NTU", status: "warning", trend: [0.6, 0.8, 1.1, 1.4, 1.6, 1.8] },
        { label: "Filtered turbidity", value: "0.14", unit: "NTU", status: "normal", trend: [0.09, 0.09, 0.10, 0.11, 0.13, 0.14] },
      ],
      choices: [
        { id: "adjust-dose", label: "Recalculate the dose using the jar-test result, adjust the pump output and document the change in the operating log", rationale: "Apply the evidence-based dose correction and maintain a complete record of the adjustment.", points: 20, consequence: "The corrected dose restores floc quality. Settled-water turbidity begins declining within one hydraulic retention time and the filter load stabilizes." },
        { id: "max-dose", label: "Set the coagulant pump to maximum output to ensure adequate dosing", rationale: "Over-dosing is safer than under-dosing during a chemical feed incident.", points: 6, consequence: "Excess coagulant temporarily improves floc but depresses pH below the optimum range, increasing disinfection demand and sludge production." },
        { id: "accept-dose", label: "Accept the current dose because filtered turbidity is still within the operating limit", rationale: "The finished water is compliant, so the current dose is adequate.", points: 0, consequence: "The sub-optimal dose allows settled-water turbidity to continue rising. Within the next hydraulic cycle the filter load exceeds the design limit." },
      ],
    },
    {
      id: "filter-loading",
      time: "10:38",
      title: "Filter loading increases",
      briefing: "The period of reduced coagulation has increased the settled-water solids load reaching the filters. Filter 1 headloss is rising faster than normal and the run time since last backwash is now 4 hours above the typical trigger.",
      alarm: "FILTER 1 HEADLOSS HIGH — EARLY BACKWASH REQUIRED",
      focusNode: 4,
      telemetry: [
        { label: "Filter 1 headloss", value: "3.1", unit: "m", status: "critical", trend: [1.4, 1.7, 2.0, 2.4, 2.7, 3.1] },
        { label: "Filter 1 effluent", value: "0.18", unit: "NTU", status: "normal", trend: [0.09, 0.10, 0.12, 0.14, 0.16, 0.18] },
        { label: "Settled-water turbidity", value: "1.1", unit: "NTU", status: "warning", trend: [1.8, 1.6, 1.4, 1.3, 1.2, 1.1] },
        { label: "Clearwell level", value: "71", unit: "%", status: "normal", trend: [75, 74, 73, 72, 72, 71] },
      ],
      choices: [
        { id: "planned-backwash", label: "Initiate a controlled backwash on Filter 1, confirm Filter 2 performance can carry the load, and log the early backwash as a consequence of the dosing event", rationale: "Manage the filter loading proactively while maintaining filtration capacity and documenting the causal chain.", points: 20, consequence: "Filter 1 is returned to service after a successful backwash. The early backwash is documented as a consequence of the coagulant failure, completing the incident record." },
        { id: "delay-backwash", label: "Delay the backwash until headloss reaches the standard trigger point", rationale: "Backwashing early wastes treated water and disrupts the filter run.", points: 5, consequence: "Headloss continues rising and Filter 1 approaches the terminal headloss limit. The operator is forced into an emergency backwash under worse conditions." },
        { id: "increase-flow", label: "Increase plant flow to compensate for the reduced filtration efficiency", rationale: "Higher flow will maintain clearwell level while the filter recovers.", points: 0, consequence: "Increasing flow raises the filtration rate on an already-loaded filter, accelerating breakthrough and reducing the time to terminal headloss." },
      ],
    },
    {
      id: "root-cause",
      time: "10:55",
      title: "Pump fault root cause identified",
      briefing: "Maintenance has found that the duty pump failed due to a worn impeller seal — a predictable failure mode. The standby pump is running well. The supervisor asks for a corrective action recommendation.",
      alarm: "MAINTENANCE FINDING: WORN IMPELLER SEAL",
      focusNode: 1,
      telemetry: [
        { label: "Coagulant flow", value: "44", unit: "L/h", status: "normal", trend: [38, 39, 41, 42, 43, 44] },
        { label: "Floc basin turbidity", value: "2.4", unit: "NTU", status: "normal", trend: [4.2, 3.6, 3.1, 2.8, 2.6, 2.4] },
        { label: "Filtered turbidity", value: "0.11", unit: "NTU", status: "normal", trend: [0.18, 0.16, 0.14, 0.13, 0.12, 0.11] },
        { label: "Open critical alarms", value: "1", unit: "alarm", status: "warning", trend: [2, 2, 2, 1, 1, 1] },
      ],
      choices: [
        { id: "schedule-repair", label: "Schedule the duty pump for immediate repair, add an impeller seal inspection to the preventive maintenance program and document the failure mode in the incident report", rationale: "Address the root cause, prevent recurrence and maintain a complete corrective action record.", points: 20, consequence: "The pump is repaired and returned to duty status. The PM program update prevents a repeat failure. The incident report is complete and defensible." },
        { id: "run-standby", label: "Continue running the standby pump and schedule the duty pump repair for the next planned outage", rationale: "The standby pump is working well and a repair can wait for a convenient time.", points: 7, consequence: "The plant operates with reduced redundancy. If the standby pump also fails before the repair is completed, there is no backup chemical feed." },
        { id: "ignore-cause", label: "Return the duty pump to service without repair and monitor its performance", rationale: "The pump may still be functional enough for short-term use.", points: 0, consequence: "The worn seal fails again within days. A second coagulant feed interruption occurs during a higher-turbidity event, creating a more serious treatment barrier risk." },
      ],
    },
    {
      id: "close-event",
      time: "11:14",
      title: "Close the chemical dosing event",
      briefing: "Process conditions have fully recovered. The supervisor needs to confirm that all regulatory notification requirements have been reviewed before closing the incident.",
      alarm: "INCIDENT CLOSE-OUT REVIEW REQUIRED",
      focusNode: 1,
      telemetry: [
        { label: "Coagulant flow", value: "44", unit: "L/h", status: "normal", trend: [38, 40, 42, 43, 44, 44] },
        { label: "Filtered turbidity", value: "0.09", unit: "NTU", status: "normal", trend: [0.18, 0.15, 0.12, 0.10, 0.09, 0.09] },
        { label: "Free chlorine", value: "1.08", unit: "mg/L", status: "normal", trend: [0.91, 0.96, 1.00, 1.04, 1.06, 1.08] },
        { label: "Open critical alarms", value: "0", unit: "alarms", status: "normal", trend: [2, 2, 1, 1, 1, 0] },
      ],
      choices: [
        { id: "full-close", label: "Review the regulatory notification checklist, confirm no reportable exceedance occurred, document the review outcome and close the incident with a complete timeline", rationale: "A formal close-out protects the facility if the event is later reviewed by a regulator or auditor.", points: 20, consequence: "The incident is closed with a complete record. The regulatory review confirms no reportable exceedance. The facility is prepared if the event is ever audited." },
        { id: "verbal-close", label: "Verbally confirm with the supervisor that the event is over and return to normal operations", rationale: "Process conditions are fully recovered and no exceedance occurred.", points: 5, consequence: "The event is closed without a formal record. If a regulator later requests documentation of the chemical feed interruption, the facility cannot demonstrate a structured response." },
        { id: "no-close", label: "Leave the incident open until the pump repair is completed", rationale: "The incident is not truly over until all corrective actions are finished.", points: 2, consequence: "An open incident with no active emergency creates confusion about the facility's current status and delays the after-action learning review." },
      ],
    },
  ],
};

// ─── Scenario 3: Riverside — Water Main Break ──────────────────────────────
export const RIVERSIDE_MAIN_BREAK: ScenarioMeta = {
  id: "riverside-main-break",
  title: "Riverside Water Main Break",
  subtitle: "Transmission main rupture during morning peak demand",
  badge: "Distribution & Pressure Management",
  durationLabel: "8-minute scenario",
  facilityName: "Riverside Distribution System",
  incidentLabel: "Transmission main rupture — pressure loss",
  processNodes: ["Pumping station", "Transmission main", "Pressure zone", "Service area", "Customers"],
  steps: [
    {
      id: "pressure-drop",
      time: "07:22",
      title: "Pressure drop alarm activates",
      briefing: "A zone pressure alarm has triggered during morning peak demand. Pressure in Zone 3 has dropped 85 kPa in 12 minutes. A field crew reports water surfacing on Elm Street near the 400 mm transmission main.",
      alarm: "ZONE 3 PRESSURE LOW — POSSIBLE MAIN BREAK",
      focusNode: 1,
      telemetry: [
        { label: "Zone 3 pressure", value: "218", unit: "kPa", status: "critical", trend: [412, 390, 362, 320, 268, 218] },
        { label: "Pump station flow", value: "142", unit: "L/s", status: "warning", trend: [88, 95, 108, 121, 133, 142] },
        { label: "Reservoir level", value: "68", unit: "%", status: "warning", trend: [81, 79, 77, 74, 71, 68] },
        { label: "Zone 4 pressure", value: "398", unit: "kPa", status: "normal", trend: [401, 400, 399, 399, 398, 398] },
      ],
      choices: [
        { id: "isolate-zone", label: "Dispatch a crew to isolate the affected section using the nearest boundary valves, notify the duty supervisor and begin the emergency response checklist", rationale: "Contain the break by isolating the affected pipe segment while activating the emergency response structure.", points: 20, consequence: "The isolation crew closes the boundary valves within 18 minutes. Water loss is contained and Zone 3 pressure begins recovering from the reservoir." },
        { id: "boost-pumps", label: "Increase pump station output to maintain zone pressure while investigating", rationale: "Higher pump output may compensate for the pressure loss.", points: 6, consequence: "Increased pumping accelerates water loss from the break and lowers the reservoir faster. The break site grows and road damage increases." },
        { id: "monitor-only", label: "Monitor the pressure trend for 30 minutes before committing resources", rationale: "The pressure drop may be a sensor fault or a temporary demand spike.", points: 0, consequence: "The break continues uncontrolled. Reservoir level drops below the minimum operating level and Zone 3 loses pressure entirely, affecting fire protection." },
      ],
    },
    {
      id: "customer-impact",
      time: "07:41",
      title: "Customer service interruption confirmed",
      briefing: "The isolation is in progress but 340 service connections in Zone 3 are now without water. The call centre is receiving complaints. A hospital on Maple Avenue is on the affected zone and has activated its emergency water supply.",
      alarm: "SERVICE INTERRUPTION — 340 CONNECTIONS AFFECTED",
      focusNode: 3,
      telemetry: [
        { label: "Zone 3 pressure", value: "0", unit: "kPa", status: "critical", trend: [218, 180, 120, 60, 20, 0] },
        { label: "Reservoir level", value: "61", unit: "%", status: "warning", trend: [68, 66, 65, 64, 62, 61] },
        { label: "Pump station flow", value: "78", unit: "L/s", status: "normal", trend: [142, 130, 110, 92, 82, 78] },
        { label: "Zone 4 pressure", value: "394", unit: "kPa", status: "normal", trend: [398, 397, 396, 395, 394, 394] },
      ],
      choices: [
        { id: "notify-hospital", label: "Confirm the hospital's emergency water supply is operational, issue a public service notice for affected customers and provide an estimated restoration time", rationale: "Prioritize critical facilities, communicate proactively with customers and set realistic expectations.", points: 20, consequence: "The hospital confirms adequate emergency supply. Customer calls decrease after the public notice is issued. The restoration timeline is accepted by the community." },
        { id: "restore-first", label: "Focus all resources on restoring pressure before issuing any public communications", rationale: "Restoring service quickly is more important than communications.", points: 7, consequence: "Customers and media fill the information vacuum with speculation. The hospital calls the utility directly, consuming supervisor time that should be focused on the repair." },
        { id: "no-notice", label: "Wait for the repair to be complete before notifying anyone", rationale: "Issuing a notice before the repair is done may cause unnecessary alarm.", points: 0, consequence: "Customers without water contact emergency services and media. The lack of proactive communication escalates the incident into a public relations crisis." },
      ],
    },
    {
      id: "repair-decision",
      time: "08:03",
      title: "Repair scope assessment",
      briefing: "The field crew has exposed the main break. The 400 mm pipe has a 600 mm longitudinal crack — too large for a repair clamp. A full pipe replacement is needed. The crew asks whether to proceed with a temporary bypass or wait for the replacement pipe to arrive (ETA 4 hours).",
      alarm: "PIPE REPLACEMENT REQUIRED — 4-HOUR RESTORATION ESTIMATE",
      focusNode: 1,
      telemetry: [
        { label: "Zone 3 pressure", value: "0", unit: "kPa", status: "critical", trend: [0, 0, 0, 0, 0, 0] },
        { label: "Reservoir level", value: "58", unit: "%", status: "warning", trend: [61, 60, 59, 59, 58, 58] },
        { label: "Bypass flow available", value: "45", unit: "L/s", status: "warning", trend: [0, 0, 0, 0, 0, 45] },
        { label: "Affected connections", value: "340", unit: "services", status: "critical", trend: [340, 340, 340, 340, 340, 340] },
      ],
      choices: [
        { id: "temporary-bypass", label: "Install a temporary bypass to restore partial service to the hospital and critical facilities while the replacement pipe is prepared", rationale: "A bypass restores minimum service to critical customers and reduces the public health risk of a prolonged outage.", points: 20, consequence: "The bypass restores 45 L/s to the zone within 90 minutes. The hospital and care facilities regain normal water service. The full repair is completed on the bypass flow." },
        { id: "wait-pipe", label: "Wait for the replacement pipe and complete a single full repair without a bypass", rationale: "A single repair is faster overall than installing a bypass and then completing the permanent repair.", points: 8, consequence: "The 4-hour wait extends the outage. The hospital exhausts its emergency supply and must request tanker delivery, increasing incident complexity and cost." },
        { id: "partial-open", label: "Partially open the isolation valve to allow some flow while the repair is prepared", rationale: "Some flow is better than no flow for affected customers.", points: 0, consequence: "Partial valve opening allows uncontrolled flow through the break, re-flooding the excavation and contaminating the repair site with soil and surface water." },
      ],
    },
    {
      id: "contamination-risk",
      time: "08:28",
      title: "Contamination risk assessment required",
      briefing: "The repair crew notes that the break site was submerged in surface water for over an hour before isolation. The regulatory protocol requires a contamination risk assessment before the main is returned to service.",
      alarm: "CONTAMINATION RISK ASSESSMENT REQUIRED — REGULATORY PROTOCOL",
      focusNode: 2,
      telemetry: [
        { label: "Zone 3 pressure", value: "38", unit: "kPa", status: "critical", trend: [0, 0, 0, 15, 28, 38] },
        { label: "Reservoir level", value: "56", unit: "%", status: "warning", trend: [58, 57, 57, 56, 56, 56] },
        { label: "Bypass flow", value: "45", unit: "L/s", status: "normal", trend: [45, 45, 45, 45, 45, 45] },
        { label: "Repair progress", value: "60", unit: "%", status: "warning", trend: [0, 15, 30, 45, 55, 60] },
      ],
      choices: [
        { id: "full-protocol", label: "Complete the contamination risk assessment, plan a disinfection flush and collect verification samples before returning the main to service", rationale: "Follow the regulatory protocol to protect public health and maintain the facility's compliance record.", points: 20, consequence: "The assessment confirms a disinfection flush is required. The flush is completed, samples are collected and the main is returned to service with a clean verification record." },
        { id: "visual-only", label: "Conduct a visual inspection of the repair and return the main to service without sampling", rationale: "The repair looks clean and the bypass has maintained flow throughout.", points: 4, consequence: "The main is returned to service without verification. A regulator audit later identifies the missing contamination assessment as a compliance gap." },
        { id: "skip-assessment", label: "Return the main to service immediately to restore full pressure to Zone 3", rationale: "Customers have been without full service for over an hour and pressure restoration is the priority.", points: 0, consequence: "The main is returned without a contamination assessment. A coliform sample collected the next day tests positive, triggering a boil water advisory and a regulatory investigation." },
      ],
    },
    {
      id: "service-restoration",
      time: "09:15",
      title: "Restore service and close the incident",
      briefing: "The repair is complete, the disinfection flush is done and verification samples have been collected. Zone 3 pressure is recovering. The supervisor asks for a final incident close-out.",
      alarm: "RESTORATION COMPLETE — CLOSE-OUT REQUIRED",
      focusNode: 4,
      telemetry: [
        { label: "Zone 3 pressure", value: "386", unit: "kPa", status: "normal", trend: [38, 120, 210, 295, 350, 386] },
        { label: "Reservoir level", value: "54", unit: "%", status: "warning", trend: [56, 55, 55, 54, 54, 54] },
        { label: "Pump station flow", value: "91", unit: "L/s", status: "normal", trend: [45, 55, 68, 78, 86, 91] },
        { label: "Open critical alarms", value: "0", unit: "alarms", status: "normal", trend: [3, 3, 2, 1, 1, 0] },
      ],
      choices: [
        { id: "full-closeout", label: "Issue a service restoration notice, document the reservoir recovery plan, submit the incident report and schedule a post-incident review", rationale: "A complete close-out protects the facility, informs customers and builds organizational resilience.", points: 20, consequence: "Customers receive the restoration notice. The incident report is complete. The post-incident review identifies valve maintenance and bypass equipment as priority investments." },
        { id: "partial-closeout", label: "Restore service and notify the call centre, but defer the incident report to the end of the week", rationale: "The immediate emergency is over and the report can wait.", points: 6, consequence: "The incident report is completed days later from memory. Key details are missing and the reservoir recovery plan is never formally documented." },
        { id: "no-closeout", label: "Return to normal operations without any formal close-out steps", rationale: "The repair is done and the system is back to normal.", points: 0, consequence: "No incident record exists. When a similar break occurs six months later, the utility cannot reference the previous response to improve its procedures." },
      ],
    },
  ],
};

// ─── Scenario 4: Lakeview — Boil Water Advisory ────────────────────────────
export const LAKEVIEW_BOIL_WATER: ScenarioMeta = {
  id: "lakeview-boil-water",
  title: "Lakeview Boil Water Advisory",
  subtitle: "Loss of disinfection residual triggers public health response",
  badge: "Public Health & Regulatory Response",
  durationLabel: "8-minute scenario",
  facilityName: "Lakeview Distribution System",
  incidentLabel: "Boil water advisory — disinfection residual loss",
  processNodes: ["Treatment plant", "Transmission", "Storage", "Distribution", "Public health"],
  steps: [
    {
      id: "residual-loss",
      time: "14:33",
      title: "Disinfection residual lost in distribution",
      briefing: "Routine distribution sampling has returned a zero chlorine residual at three consecutive monitoring points in the eastern pressure zone. The zone serves 4,200 connections including two elementary schools. The loss has been confirmed by a portable analyser.",
      alarm: "ZERO RESIDUAL CONFIRMED — THREE MONITORING POINTS",
      focusNode: 3,
      telemetry: [
        { label: "East zone residual", value: "0.00", unit: "mg/L", status: "critical", trend: [0.42, 0.31, 0.19, 0.08, 0.02, 0.00] },
        { label: "Transmission residual", value: "0.88", unit: "mg/L", status: "normal", trend: [0.91, 0.90, 0.89, 0.89, 0.88, 0.88] },
        { label: "Storage tank level", value: "62", unit: "%", status: "normal", trend: [64, 63, 63, 62, 62, 62] },
        { label: "System pressure", value: "374", unit: "kPa", status: "normal", trend: [378, 377, 376, 375, 374, 374] },
      ],
      choices: [
        { id: "notify-moh", label: "Immediately notify the Medical Officer of Health, initiate the boil water advisory protocol and begin investigating the cause of residual loss", rationale: "A confirmed zero residual at multiple points is a public health trigger requiring immediate regulatory notification and public communication.", points: 20, consequence: "The MOH is notified within 30 minutes. A boil water advisory is issued for the eastern zone. The investigation begins with a systematic review of the distribution system." },
        { id: "flush-first", label: "Flush the affected mains to restore residual before notifying the regulator", rationale: "Restoring residual quickly may resolve the issue before a formal advisory is needed.", points: 5, consequence: "Flushing restores residual in some areas but the cause is unknown. The delayed notification violates the regulatory reporting timeline and creates a compliance record issue." },
        { id: "resample-only", label: "Collect additional samples and wait for laboratory confirmation before taking any action", rationale: "A portable analyser result should be confirmed by a certified laboratory before issuing a public advisory.", points: 0, consequence: "The delay in notification extends the period during which the public may be consuming water without a disinfection barrier. Schools are not notified and children continue using the water." },
      ],
    },
    {
      id: "cause-investigation",
      time: "14:52",
      title: "Root cause investigation begins",
      briefing: "The investigation has identified two possible causes: a stuck-open reservoir inlet valve that has been diluting chlorinated water with unchlorinated storage, or a high-demand flushing event by a contractor that consumed residual faster than the system could replenish it. Both require different responses.",
      alarm: "ROOT CAUSE INVESTIGATION — TWO CANDIDATE CAUSES",
      focusNode: 2,
      telemetry: [
        { label: "East zone residual", value: "0.00", unit: "mg/L", status: "critical", trend: [0.00, 0.00, 0.00, 0.00, 0.00, 0.00] },
        { label: "Reservoir inlet valve", value: "100", unit: "% open", status: "critical", trend: [22, 35, 58, 78, 92, 100] },
        { label: "Contractor flow meter", value: "18", unit: "L/s", status: "warning", trend: [0, 0, 0, 8, 14, 18] },
        { label: "Storage tank level", value: "59", unit: "%", status: "warning", trend: [62, 61, 61, 60, 60, 59] },
      ],
      choices: [
        { id: "systematic-check", label: "Close the reservoir inlet valve to eliminate the dilution cause, confirm the contractor's permit and flow meter, then determine which cause is primary before adjusting the response", rationale: "Address the most likely controllable cause first while gathering evidence to confirm the root cause.", points: 20, consequence: "Closing the inlet valve stops the dilution. Residual begins recovering in the transmission main. The contractor's flow meter confirms the secondary contribution. The root cause is documented." },
        { id: "stop-contractor", label: "Order the contractor to stop all flushing immediately and investigate their permit", rationale: "The contractor's unauthorized flow is the most likely cause.", points: 8, consequence: "The contractor stops but the reservoir inlet valve remains open. Residual does not recover because the dilution source is still active." },
        { id: "boost-chlorine", label: "Increase the treatment plant chlorine dose to push residual into the distribution system", rationale: "Higher plant output will eventually restore residual throughout the zone.", points: 3, consequence: "Increased plant dose takes hours to reach the eastern zone through the transmission main. The dilution source remains active and residual does not recover in the affected area." },
      ],
    },
    {
      id: "public-communication",
      time: "15:14",
      title: "Public communication required",
      briefing: "The boil water advisory has been issued but two elementary schools have not yet been directly notified. School administrators are calling the utility. The media has also contacted the communications team for a statement.",
      alarm: "SCHOOL NOTIFICATION OVERDUE — MEDIA INQUIRY RECEIVED",
      focusNode: 4,
      telemetry: [
        { label: "East zone residual", value: "0.04", unit: "mg/L", status: "critical", trend: [0.00, 0.00, 0.00, 0.01, 0.02, 0.04] },
        { label: "Transmission residual", value: "0.91", unit: "mg/L", status: "normal", trend: [0.88, 0.88, 0.89, 0.90, 0.90, 0.91] },
        { label: "Boil water advisory", value: "Active", unit: "", status: "warning", trend: [0, 0, 0, 1, 1, 1] },
        { label: "Open notifications", value: "2", unit: "schools", status: "critical", trend: [4, 4, 3, 3, 2, 2] },
      ],
      choices: [
        { id: "direct-notify", label: "Call both school principals directly, confirm they have received the advisory and understand the precautions, then provide a factual media statement with a restoration timeline", rationale: "Direct notification to critical facilities and transparent public communication are both required under the advisory protocol.", points: 20, consequence: "Both schools confirm receipt and immediately stop using tap water for food preparation. The media statement is factual and reduces public anxiety. The utility is seen as responsive." },
        { id: "media-first", label: "Issue the media statement first to control the public narrative, then notify the schools", rationale: "A public statement will reach more people faster than individual calls.", points: 6, consequence: "Schools learn of the advisory from the media before receiving direct notification. One school has already served lunch using tap water. The delayed direct notification is noted in the regulatory review." },
        { id: "defer-communication", label: "Defer all external communication until the residual is restored to avoid causing unnecessary panic", rationale: "Communicating before the problem is solved will alarm the public unnecessarily.", points: 0, consequence: "Schools continue using tap water. When the advisory is eventually communicated, the delayed notification triggers a formal complaint and a regulatory investigation into the utility's emergency response." },
      ],
    },
    {
      id: "residual-recovery",
      time: "15:38",
      title: "Residual recovery strategy",
      briefing: "The root cause has been controlled. Residual is recovering in the transmission main but the eastern zone still shows zero. The team must decide how to restore residual throughout the zone before the advisory can be lifted.",
      alarm: "RESIDUAL RECOVERY PLAN REQUIRED",
      focusNode: 3,
      telemetry: [
        { label: "East zone residual", value: "0.00", unit: "mg/L", status: "critical", trend: [0.00, 0.00, 0.00, 0.00, 0.00, 0.00] },
        { label: "Transmission residual", value: "0.94", unit: "mg/L", status: "normal", trend: [0.88, 0.89, 0.90, 0.91, 0.93, 0.94] },
        { label: "Storage tank level", value: "57", unit: "%", status: "warning", trend: [59, 58, 58, 57, 57, 57] },
        { label: "System pressure", value: "371", unit: "kPa", status: "normal", trend: [374, 373, 373, 372, 371, 371] },
      ],
      choices: [
        { id: "systematic-flush", label: "Execute a systematic unidirectional flushing program starting from the transmission main and working outward to dead ends, sampling at each stage to verify residual recovery", rationale: "Unidirectional flushing is the most effective method for restoring residual while minimizing water waste and ensuring complete coverage.", points: 20, consequence: "The systematic flush restores residual throughout the zone within 3 hours. Sampling confirms recovery at all monitoring points. The advisory can be lifted once verification samples are collected." },
        { id: "random-flush", label: "Open hydrants throughout the zone simultaneously to flush the system quickly", rationale: "Opening multiple hydrants at once will flush the zone faster.", points: 6, consequence: "Simultaneous flushing creates pressure transients that may introduce contamination at service connections. Some dead-end areas are not reached and residual remains at zero." },
        { id: "wait-natural", label: "Allow natural system flow to restore residual without active flushing", rationale: "The system will eventually restore residual on its own as chlorinated water moves through.", points: 0, consequence: "Natural flow takes 18-24 hours to restore residual in dead-end areas. The boil water advisory remains in effect for an extended period, increasing public health risk and community impact." },
      ],
    },
    {
      id: "advisory-lift",
      time: "18:45",
      title: "Lifting the boil water advisory",
      briefing: "Residual has been restored throughout the zone. Two rounds of verification samples have been collected. The laboratory has confirmed no coliform or E. coli in the first round. The second round results are pending. The MOH is asking whether the advisory can be lifted.",
      alarm: "ADVISORY LIFT DECISION REQUIRED — SECOND SAMPLE ROUND PENDING",
      focusNode: 4,
      telemetry: [
        { label: "East zone residual", value: "0.52", unit: "mg/L", status: "normal", trend: [0.00, 0.12, 0.28, 0.38, 0.46, 0.52] },
        { label: "Sample round 1", value: "Pass", unit: "", status: "normal", trend: [0, 0, 0, 0, 1, 1] },
        { label: "Sample round 2", value: "Pending", unit: "", status: "warning", trend: [0, 0, 0, 0, 0, 0] },
        { label: "System pressure", value: "378", unit: "kPa", status: "normal", trend: [371, 373, 374, 376, 377, 378] },
      ],
      choices: [
        { id: "wait-second-round", label: "Advise the MOH to wait for the second round of sample results before lifting the advisory, and prepare the public notification for immediate release once results are confirmed", rationale: "Two consecutive clean sample rounds are required by the regulatory protocol before an advisory can be lifted. Preparing the notification in advance minimizes the delay after confirmation.", points: 20, consequence: "The second round returns clean results. The advisory is lifted with a complete two-round verification record. The public notification is issued within 30 minutes of the laboratory confirmation." },
        { id: "lift-on-residual", label: "Recommend lifting the advisory now because residual has been restored and the first sample round passed", rationale: "Residual recovery and one clean sample round demonstrate that the water is safe.", points: 5, consequence: "The MOH lifts the advisory based on one sample round. The regulatory review later notes that the two-round protocol was not followed. The utility receives a compliance notice." },
        { id: "lift-immediately", label: "Lift the advisory immediately and collect the second round of samples as a post-advisory verification", rationale: "The water looks safe and customers have been under the advisory for over 4 hours.", points: 0, consequence: "The advisory is lifted before verification is complete. The second sample round returns a positive coliform result. The advisory must be re-issued, creating a serious public confidence crisis." },
      ],
    },
  ],
};

export const ALL_SCENARIOS: ScenarioMeta[] = [
  CEDAR_RIDGE_STORM,
  MILLBROOK_CHEMICAL_DOSING,
  RIVERSIDE_MAIN_BREAK,
  LAKEVIEW_BOIL_WATER,
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
