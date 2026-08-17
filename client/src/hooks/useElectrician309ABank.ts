import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import type { DBQuestion, ModuleOverview } from "@/hooks/useQuestionBank";
import { ELECTRICIAN_309A_MODULES } from "@shared/electrician309aBlueprint";

export const ELECTRICIAN_309A_MODULE_LABELS = Object.fromEntries(
  ELECTRICIAN_309A_MODULES.map((module) => [module.code, `${module.code}. ${module.title}`]),
) as Record<string, string>;

const GUIDE_CONTENT: Record<string, Omit<ModuleOverview, "title">> = {
  A: {
    intro: "Build safe, traceable work habits before touching the technical problem. Questions in this area reward correct sequencing, tool selection, drawing interpretation, documentation, and clear communication.",
    keyPoints: [
      { heading: "Hazard control", body: "Assess the task before choosing PPE. Elimination, isolation, and other controls come before personal protective equipment." },
      { heading: "Safe isolation", body: "Maintain control of personal locks and prove the tester before and after an absence-of-voltage check." },
      { heading: "Current information", body: "Use the latest drawing revision and record authorized field changes for future operation and maintenance." },
      { heading: "Commissioning", body: "A failed protective function prevents acceptance even when the remaining checks pass." },
    ],
    examTips: ["Put the steps in a defensible order: assess, isolate, verify, work, test, document.", "Do not treat PPE or a single measurement as a substitute for the complete safe-work process."],
  },
  B: {
    intro: "Follow electrical energy from the supply to the load. Connect ratings, fault paths, protection, conversion equipment, and test results instead of memorizing isolated component names.",
    keyPoints: [
      { heading: "Distribution path", body: "Trace the source, main protection, bus, feeder protection, conductors, and connected load on the one-line before diagnosing a result." },
      { heading: "Grounding and bonding", body: "Bonding provides a continuous low-impedance fault-current path; grounding establishes the intended system reference to earth. One does not replace the other." },
      { heading: "Protection", body: "A protective device must suit the protected equipment, interrupt the available fault duty, and coordinate with downstream protection where required." },
      { heading: "Conversion systems", body: "Transformer ratios, transfer sequences, inverter limits, polarity, isolation, and stored-energy conditions all affect the operating decision." },
    ],
    formulaHint: "Three-phase apparent power: S = √3 × Vline × Iline; ideal transformer ratio: Vp/Vs = Np/Ns",
    examTips: ["Identify the system relationship before choosing a test or adjustment.", "Reject answers that bypass rating checks, phase verification, or a confirmed fault path."],
  },
  C: {
    intro: "Treat a wiring system as a complete route. Conductor, enclosure, support, termination, connected device, control method, and operating environment all affect the final result.",
    keyPoints: [
      { heading: "Route planning", body: "Control pulling tension, bend stress, support, moisture entry, corrosion, and termination allowance as one installation problem." },
      { heading: "Circuit integrity", body: "Preserve polarity, bonding, conductor identification, and device ratings through every splice and termination." },
      { heading: "Control sequence", body: "Test multi-location switching, HVAC interlocks, sensors, dimmers, and emergency transfer through their complete operating sequence." },
      { heading: "Fire and corrosion protection", body: "Restore penetrated fire separations and preserve the intended polarity of cathodic-protection current." },
    ],
    formulaHint: "Simplified two-wire voltage drop: Vdrop = 2 × one-way length × current × conductor resistance per unit length",
    examTips: ["Read the question as a source-to-load path, not as an isolated component fact.", "When a control is involved, identify the permissive, command, output, and proof of operation."],
  },
  D: {
    intro: "Read control systems as cause-and-effect paths. Separate the power circuit from the control circuit, then follow commands, permissives, interlocks, protection, and feedback in order.",
    keyPoints: [
      { heading: "Starter logic", body: "A seal-in contact maintains the coil circuit; stop and overload contacts open the path when operation must cease." },
      { heading: "Interlocking", body: "Forward and reverse contactors require electrical and mechanical protection against simultaneous closure." },
      { heading: "Variable-frequency drives", body: "Use nameplate data, programmed limits, grounding, wiring separation, and fault history before changing parameters." },
      { heading: "Feedback control", body: "Confirm sensor range, scaling, action direction, actuator response, and fail-safe state as one loop." },
    ],
    formulaHint: "Synchronous speed: Ns = 120f/P; induction-motor rotor speed is lower while producing torque",
    examTips: ["Trace the control circuit in the de-energized state before predicting operation.", "Change one confirmed cause at a time and repeat the full sequence after correction."],
  },
  E: {
    intro: "Start with the required signal path. Identify how a condition is detected, supervised, processed, communicated, and verified at the final device or associated system.",
    keyPoints: [
      { heading: "Supervision", body: "A supervised circuit must distinguish normal, alarm, and trouble conditions rather than treating every change as an alarm." },
      { heading: "Standby power", body: "Confirm capacity under the required duty; open-circuit battery voltage alone does not prove usable autonomy." },
      { heading: "Communication paths", body: "Verify termination, polarity, addressing, connector condition, bend control, and measured link performance." },
      { heading: "Integrated controls", body: "Use the points list, signal range, sequence, fail-safe state, alarm mapping, and trend data during commissioning." },
    ],
    examTips: ["Trace the test end to end from field input to final output or associated-system action.", "Separate a communication fault, configuration fault, and field-device fault before replacing equipment."],
  },
};

const MODULE_OVERVIEWS = Object.fromEntries(
  ELECTRICIAN_309A_MODULES.map((module) => [
    ELECTRICIAN_309A_MODULE_LABELS[module.code],
    { title: `${module.code}. ${module.title}`, ...GUIDE_CONTENT[module.code] } satisfies ModuleOverview,
  ]),
) as Record<string, ModuleOverview>;

export const ELECTRICIAN_309A_MODULE_TARGETS = Object.fromEntries(
  ELECTRICIAN_309A_MODULES.map((module) => [ELECTRICIAN_309A_MODULE_LABELS[module.code], module.examQuestions]),
) as Record<string, number>;

/** Adapts governed certification records to the standard Echelon course-bank contract. */
export function useElectrician309ABank() {
  const query = trpc.electricianReview.get309ABetaPractice.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: 4,
    retryDelay: 5000,
  });

  const questions = useMemo<DBQuestion[]>(() => (query.data?.questions ?? []).map((question) => ({
    id: question.id,
    module: ELECTRICIAN_309A_MODULE_LABELS[question.module] ?? question.module,
    difficulty: question.difficulty,
    question: question.question,
    options: question.options,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    steps: question.steps,
    tip: question.tip ?? undefined,
    isCalc: question.isCalc,
    topic: question.taskCode,
    diagramId: question.diagramId,
    diagramAlt: question.diagramAlt,
  })), [query.data]);

  return {
    questions,
    modules: ELECTRICIAN_309A_MODULES.map((module) => ELECTRICIAN_309A_MODULE_LABELS[module.code]),
    moduleTargets: ELECTRICIAN_309A_MODULE_TARGETS,
    totalQuestions: query.data?.total ?? 0,
    overviews: MODULE_OVERVIEWS,
    isLoading: query.isLoading,
    isFullyLoaded: query.isSuccess,
    dbUnavailable: query.isError,
  };
}
