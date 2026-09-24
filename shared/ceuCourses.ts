export type CeuApprovalStatus = "director_approval_required" | "ceu_value_review_required";
export type CeuCourseStream = "drinking_water" | "wastewater";

export interface CeuCourseModule {
  number: number;
  title: string;
  durationMinutes: number;
  summary: string;
}

export interface CeuCourse {
  key: string;
  title: string;
  shortTitle: string;
  stream: CeuCourseStream;
  approvalStatus: CeuApprovalStatus;
  statusLabel: string;
  statusDescription: string;
  plannedContactHours: number;
  audience: string;
  outcomes: readonly string[];
  modules: readonly CeuCourseModule[];
  completionRequirements: readonly string[];
  publicDisclosure: string;
  ctaLabel: string;
}

/**
 * Approval-ready course blueprints for Echelon's continuing-education catalogue.
 *
 * These records intentionally contain no price, Course ID, assessed CEU value, or
 * approval claim. Those items may only be added after the applicable written
 * Ontario approval or review outcome is received.
 */
export const CEU_COURSES = [
  {
    key: "ceu-drinking-water-compliance",
    title: "Drinking Water Operations and Regulatory Compliance",
    shortTitle: "Drinking Water Compliance",
    stream: "drinking_water",
    approvalStatus: "director_approval_required",
    statusLabel: "Director approval required",
    statusDescription:
      "Ontario Director approval through WWOCS is required before any Director-approved CEU claim. A complete supporting package must be prepared for submission.",
    plannedContactHours: 7,
    audience:
      "Experienced Ontario drinking-water operators responsible for operational decisions, compliance records, incident response, and shift oversight.",
    outcomes: [
      "Map operator responsibilities and escalation duties to applicable Ontario drinking-water requirements.",
      "Evaluate control-limit deviations, sampling information, and test results to identify required operational responses.",
      "Develop defensible adverse-result and incident responses with documented corrective actions.",
      "Assemble traceable operational records and explain compliance decisions in an integrated case.",
    ],
    modules: [
      {
        number: 1,
        title: "Ontario drinking-water compliance map and operator accountability",
        durationMinutes: 60,
        summary:
          "Map regulatory duties, operator roles, approval conditions, and escalation responsibilities. Use scenarios to distinguish operator decisions from matters requiring supervisory or regulatory direction.",
      },
      {
        number: 2,
        title: "Operating within control limits",
        durationMinutes: 60,
        summary:
          "Interpret operating limits, alarms, trends, and procedural controls. Evaluate deviations and select verification, adjustment, and escalation steps using fictional operating scenarios.",
      },
      {
        number: 3,
        title: "Sampling, testing, and result review",
        durationMinutes: 90,
        summary:
          "Review sampling plans, collection controls, sample traceability, testing records, and result validity. Identify gaps that affect compliance decisions and distinguish operational readings from required compliance testing.",
      },
      {
        number: 4,
        title: "Adverse results, incidents, and corrective-action decision-making",
        durationMinutes: 75,
        summary:
          "Work through adverse-result and incident cases. Identify applicable notification and reporting duties, prioritize protective actions, and document corrective-action decisions and follow-up verification.",
      },
      {
        number: 5,
        title: "Records, reporting, and audit-ready operational evidence",
        durationMinutes: 60,
        summary:
          "Evaluate logs, reports, communications, and corrective-action records for accuracy and traceability. Reconstruct an event timeline and identify missing evidence without obscuring original records.",
      },
      {
        number: 6,
        title: "Integrated compliance practicum and knowledge verification",
        durationMinutes: 75,
        summary:
          "Resolve a fictional compliance case using operating data, results, and records. Submit a decision rationale, complete knowledge verification, and participate in an instructor debrief and course evaluation.",
      },
    ],
    completionRequirements: [
      "Participate in all six modules with documented attendance across the planned seven contact hours.",
      "Complete engagement checks, case exercises, and required operational evidence reviews.",
      "Submit the integrated practicum and knowledge assessment, meeting the documented successful-completion policy finalized before delivery.",
      "Submit the course evaluation.",
    ],
    publicDisclosure:
      "Proposed online learning path planned for a maximum of seven contact hours in one day, excluding breaks. Contact hours are not a CEU value. Ontario Director approval through WWOCS is required before any Director-approved CEU claim. No approval or CEU value is claimed.",
    ctaLabel: "Request course and approval updates",
  },
  {
    key: "ceu-water-treatment-process-control",
    title: "Water Treatment Process Control and Optimization",
    shortTitle: "Water Treatment Process Control",
    stream: "drinking_water",
    approvalStatus: "director_approval_required",
    statusLabel: "Director approval required",
    statusDescription:
      "Ontario Director approval through WWOCS is required before any Director-approved CEU claim. Content must remain general, non-promotional, and non-site-specific.",
    plannedContactHours: 7,
    audience:
      "Experienced Ontario water treatment operators who interpret process data, troubleshoot treatment performance, and evaluate operational adjustments.",
    outcomes: [
      "Interpret raw-water changes and treatment trends to anticipate process-control needs.",
      "Evaluate coagulation, clarification, filtration, and disinfection adjustments within defined operating constraints.",
      "Validate instrumentation, sampling, and SCADA information before making process-control decisions.",
      "Develop an evidence-based optimization response with verification measures and escalation criteria.",
    ],
    modules: [
      {
        number: 1,
        title: "Process-control foundations and Ontario operating context",
        durationMinutes: 60,
        summary:
          "Connect treatment objectives, operating constraints, process variability, and operator accountability. Distinguish optimization opportunities from changes requiring authorization or further technical review.",
      },
      {
        number: 2,
        title: "Raw-water characterization and treatment-train response",
        durationMinutes: 60,
        summary:
          "Interpret fictional raw-water datasets for changing turbidity, temperature, pH, and organic loading. Predict treatment-train effects and identify monitoring priorities.",
      },
      {
        number: 3,
        title: "Coagulation, flocculation, clarification, and filtration optimization",
        durationMinutes: 90,
        summary:
          "Evaluate jar-test results, chemical-feed relationships, clarification performance, filter trends, and backwash indicators. Compare adjustments using general process principles rather than site-specific instructions.",
      },
      {
        number: 4,
        title: "Disinfection process control and treated-water protection",
        durationMinutes: 75,
        summary:
          "Analyze disinfectant demand, residual trends, contact-time considerations, and treated-water quality indicators. Evaluate trade-offs and identify conditions requiring verification or escalation.",
      },
      {
        number: 5,
        title: "Instrumentation, SCADA, sampling, and data integrity",
        durationMinutes: 60,
        summary:
          "Reconcile online signals, grab samples, calibration records, and SCADA trends. Detect unreliable measurements, timestamp gaps, and alarm issues before recommending process changes.",
      },
      {
        number: 6,
        title: "Optimization decisions, upset response, and continuous improvement",
        durationMinutes: 75,
        summary:
          "Build a response to a fictional treatment upset and propose a controlled optimization trial. Define baseline measures, verification checks, stopping criteria, and documentation. Complete assessment, debrief, and evaluation.",
      },
    ],
    completionRequirements: [
      "Participate in all six modules with documented attendance across the planned seven contact hours.",
      "Complete engagement checks, process-data exercises, and calculation activities.",
      "Submit the optimization case and knowledge assessment, meeting the documented successful-completion policy finalized before delivery.",
      "Submit the course evaluation.",
    ],
    publicDisclosure:
      "Proposed online learning path planned for a maximum of seven contact hours in one day, excluding breaks. Contact hours are not a CEU value. Ontario Director approval through WWOCS is required before any Director-approved CEU claim. No approval or CEU value is claimed. Instruction is general, non-promotional, and not a substitute for site-specific procedures.",
    ctaLabel: "Request course and approval updates",
  },
  {
    key: "ceu-wastewater-treatment-process-control",
    title: "Wastewater Treatment Operations and Process Control",
    shortTitle: "Wastewater Process Control",
    stream: "wastewater",
    approvalStatus: "ceu_value_review_required",
    statusLabel: "OWWCO course-value review required",
    statusDescription:
      "OWWCO wastewater-course review may determine course length or CEU value. Review is required before stating an assessed CEU value or course status. Wastewater-only courses are not Director approved for drinking-water renewal.",
    plannedContactHours: 7,
    audience:
      "Experienced Ontario wastewater treatment operators responsible for biological process control, clarification, solids management, and effluent performance.",
    outcomes: [
      "Interpret wastewater monitoring data while accounting for sampling limitations, data quality, and safety boundaries.",
      "Diagnose biological treatment and secondary clarification performance using trends and process-control calculations.",
      "Evaluate interactions among nutrient removal, final treatment, solids handling, and effluent protection.",
      "Defend operational priorities, adjustments, and escalation decisions in an integrated virtual shift.",
    ],
    modules: [
      {
        number: 1,
        title: "Ontario operator context, treatment-process overview, and safety boundaries",
        durationMinutes: 60,
        summary:
          "Connect operator responsibilities, facility operating requirements, and treatment objectives. Identify process interfaces and safety boundaries, including situations requiring authorized procedures or specialist support.",
      },
      {
        number: 2,
        title: "Monitoring, sampling awareness, data quality, and operational records",
        durationMinutes: 60,
        summary:
          "Evaluate sampling representativeness, laboratory and field results, instrument checks, and shift records. Identify questionable data and determine what additional evidence is needed before acting.",
      },
      {
        number: 3,
        title: "Biological treatment and secondary clarification control",
        durationMinutes: 90,
        summary:
          "Analyze biomass condition, oxygen demand, settling behavior, sludge blanket trends, and return and waste sludge relationships. Compare likely causes of deteriorating treatment and solids separation.",
      },
      {
        number: 4,
        title: "Process-control calculations and troubleshooting decisions",
        durationMinutes: 75,
        summary:
          "Calculate and interpret loading, food-to-microorganism ratio, solids retention time, and solids balances from fictional datasets. Check units and assumptions, then use results to prioritize troubleshooting.",
      },
      {
        number: 5,
        title: "Nutrients, final treatment, solids, and effluent protection",
        durationMinutes: 60,
        summary:
          "Evaluate nutrient-removal constraints, final treatment performance, solids processing, and sidestream impacts. Identify cross-process consequences of adjustments and measures to protect effluent quality.",
      },
      {
        number: 6,
        title: "Integrated virtual shift: case simulation, decision rationale, and instructor debrief",
        durationMinutes: 75,
        summary:
          "Manage a fictional shift with changing flows, process alarms, and effluent risks. Submit calculations, prioritized actions, and a shift handover. Complete knowledge verification, instructor debrief, and course evaluation.",
      },
    ],
    completionRequirements: [
      "Participate in all six modules with documented attendance across the planned seven contact hours.",
      "Complete engagement checks, monitoring reviews, and process-control calculations.",
      "Submit the virtual-shift case and knowledge assessment, meeting the documented successful-completion policy finalized before delivery.",
      "Submit the course evaluation.",
    ],
    publicDisclosure:
      "Proposed online learning path planned for a maximum of seven contact hours in one day, excluding breaks. Contact hours are not a CEU value. OWWCO review is required before stating an assessed CEU value or course status. Neither is claimed. Wastewater-only courses are not Director approved for drinking-water renewal.",
    ctaLabel: "Request course and review updates",
  },
] as const satisfies readonly CeuCourse[];

export function getCeuCourseByKey(key: string): CeuCourse | undefined {
  return CEU_COURSES.find((course) => course.key === key);
}

export function plannedCourseMinutes(course: CeuCourse): number {
  return course.modules.reduce((total, module) => total + module.durationMinutes, 0);
}
