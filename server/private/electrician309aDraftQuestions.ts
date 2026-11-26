import type { Electrician309AModuleCode } from "../../shared/electrician309aBlueprint";
import {
  ELECTRICIAN_309A_BLUEPRINT_VERSION,
  ELECTRICIAN_309A_PROGRAM_KEY,
  type CertificationQuestionGovernance,
} from "../../shared/certificationPrograms";

/**
 * First-pass diagnostic content for the Sept. 22 skilled-trades demo.
 *
 * These questions are ORIGINAL Echelon practice items. They are not copied from
 * Red Seal sample questions. Every item is mapped to the official CURRENT-exam
 * Construction Electrician blueprint, but remains DRAFT until Echelon's documented
 * research review checks technical accuracy, wording, and trade realism.
 *
 * We deliberately avoid Canadian Electrical Code rule-number memorization in this
 * first set because the CEC is a licensed standard and exact code-rule items need
 * controlled source access plus documented source review.
 */

export interface Electrician309ADraftQuestion
  extends CertificationQuestionGovernance {
  id: number;
  module: Electrician309AModuleCode;
  task: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  isCalc: boolean;
  sourceTitle: string;
  sourceUrl: string;
  sourceReference: string;
  blueprintObjective: string;
  reviewStatus: "draft";
}

type Electrician309AQuestionDraft = Omit<
  Electrician309ADraftQuestion,
  | "programKey"
  | "blueprintVersion"
  | "sourceVerifiedAt"
  | "approvedForPractice"
  | "approvedForMock"
  | "retiredAt"
>;

const RED_SEAL_WEIGHTING_URL =
  "https://red-seal.ca/eng/trades/constelectric/previous/exam-weightings.shtml";

const questionDrafts: Electrician309AQuestionDraft[] = [
  {
    id: 309001,
    module: "A",
    task: "A-1",
    difficulty: "medium",
    question:
      "After a disconnect has been opened, locked, and tagged before electrical work begins, what is the most important next step before touching the conductors?",
    options: [
      "Remove the equipment grounding conductor",
      "Verify absence of voltage with an appropriate test instrument",
      "Close the disconnect once to confirm it is mechanically free",
      "Measure conductor insulation resistance while the circuit is energized",
    ],
    correctIndex: 1,
    explanation:
      "Lockout/tagout controls the energy source, but the worker must still verify the circuit is in the expected de-energized state before contact. Verification is part of establishing an electrically safe work condition.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "A-1.03 Performs lock-out and tag-out procedures",
    blueprintObjective: "A-1 Performs safety-related functions",
    reviewStatus: "draft",
  },
  {
    id: 309002,
    module: "A",
    task: "A-3",
    difficulty: "easy",
    question:
      "An electrician sees an unfamiliar symbol on a one-line drawing. What should be checked first to determine what the symbol represents?",
    options: [
      "The drawing legend and notes",
      "The project payroll sheet",
      "The manufacturer's warranty period",
      "The equipment room paint schedule",
    ],
    correctIndex: 0,
    explanation:
      "Legends, notes, and project specifications define the symbols and conventions used on drawings. Interpreting them correctly is a core part of organizing electrical work.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "A-3.01 Interprets plans, drawings and specifications",
    blueprintObjective: "A-3 Organizes work",
    reviewStatus: "draft",
  },
  {
    id: 309003,
    module: "A",
    task: "A-5",
    difficulty: "medium",
    question:
      "Before energizing newly installed electrical equipment during commissioning, which action best reduces the chance of damaging the equipment?",
    options: [
      "Increase the protective-device rating temporarily",
      "Verify connections, equipment ratings, and required pre-energization checks",
      "Disconnect all bonding conductors until the first load test",
      "Operate every control in manual mode before reviewing documentation",
    ],
    correctIndex: 1,
    explanation:
      "Commissioning should confirm installation integrity, correct connections, equipment ratings, and required checks before energization. Protective devices and bonding should not be defeated for convenience.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "A-5.01 Startup/shutdown; A-5.02 commissioning/decommissioning",
    blueprintObjective: "A-5 Commissions and decommissions electrical systems",
    reviewStatus: "draft",
  },
  {
    id: 309004,
    module: "B",
    task: "B-15",
    difficulty: "medium",
    question:
      "An ideal transformer has a 600 V primary and a 120 V secondary. If the primary winding has 500 turns, approximately how many turns should the secondary have?",
    options: ["50 turns", "100 turns", "250 turns", "2,500 turns"],
    correctIndex: 1,
    explanation:
      "For an ideal transformer, Vp/Vs = Np/Ns. The voltage ratio is 600/120 = 5, so Ns = 500/5 = 100 turns.",
    isCalc: true,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "B-15 Installs, services and maintains transformers",
    blueprintObjective: "B-15 Transformers",
    reviewStatus: "draft",
  },
  {
    id: 309005,
    module: "B",
    task: "B-11",
    difficulty: "medium",
    question:
      "What is a primary safety purpose of bonding exposed conductive equipment parts together and to the grounding system?",
    options: [
      "To increase normal load current",
      "To provide a low-impedance path for fault current so protective devices can operate",
      "To improve the power factor of every connected load",
      "To eliminate the need for overcurrent protection",
    ],
    correctIndex: 1,
    explanation:
      "Bonding helps create an effective fault-current path. A sufficiently low-impedance path allows protective devices to operate promptly when a fault energizes normally non-current-carrying conductive parts.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "B-11.01 Installs bonding and grounding systems",
    blueprintObjective: "B-11 Bonding, grounding and ground-fault systems",
    reviewStatus: "draft",
  },
  {
    id: 309006,
    module: "B",
    task: "B-8",
    difficulty: "easy",
    question:
      "What is the main function of an overcurrent protective device in an electrical circuit?",
    options: [
      "Maintain a constant power factor",
      "Open the circuit when current exceeds safe limits",
      "Increase voltage during motor starting",
      "Convert alternating current to direct current",
    ],
    correctIndex: 1,
    explanation:
      "Fuses and circuit breakers interrupt current when an overcurrent condition reaches their operating characteristics, limiting conductor and equipment damage.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "B-8.01 Installs overcurrent protection devices",
    blueprintObjective: "B-8 Protection devices",
    reviewStatus: "draft",
  },
  {
    id: 309007,
    module: "B",
    task: "B-10",
    difficulty: "easy",
    question:
      "What problem is an uninterruptible power supply (UPS) primarily intended to address for a critical electronic load?",
    options: [
      "Temporary loss or disturbance of the normal power source",
      "Mechanical overload of a driven motor",
      "Low insulation resistance in branch-circuit wiring",
      "Excessive building heat loss",
    ],
    correctIndex: 0,
    explanation:
      "A UPS supplies conditioned or stored electrical energy to support critical loads through short interruptions and certain power-quality disturbances.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "B-10 Power conditioning, UPS and surge suppression systems",
    blueprintObjective: "B-10 Power conditioning and UPS systems",
    reviewStatus: "draft",
  },
  {
    id: 309008,
    module: "B",
    task: "B-9",
    difficulty: "hard",
    question:
      "A balanced three-phase load operates at 600 V line-to-line, draws 40 A, and has a power factor of 0.80. Approximately how much real power does it consume?",
    options: ["19.2 kW", "26.6 kW", "33.3 kW", "57.6 kW"],
    correctIndex: 2,
    explanation:
      "Three-phase real power is P = √3 × V × I × power factor. P ≈ 1.732 × 600 × 40 × 0.80 = 33,254 W, or about 33.3 kW.",
    isCalc: true,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "B-9 Power distribution equipment",
    blueprintObjective: "B-9 Power distribution equipment",
    reviewStatus: "draft",
  },
  {
    id: 309009,
    module: "B",
    task: "B-12",
    difficulty: "medium",
    question:
      "Why must a standby generator transfer arrangement prevent the generator source and the normal utility source from being unintentionally connected together?",
    options: [
      "To prevent dangerous backfeed and unintended source paralleling",
      "To make the generator run at a lower frequency",
      "To reduce the generator's oil pressure",
      "To increase the normal service voltage",
    ],
    correctIndex: 0,
    explanation:
      "Transfer equipment must control the relationship between sources. Unintended paralleling or backfeed can endanger workers and damage equipment unless the system is specifically engineered for parallel operation.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "B-12 AC generating systems",
    blueprintObjective: "B-12 Power generation and conversion systems",
    reviewStatus: "draft",
  },
  {
    id: 309010,
    module: "B",
    task: "B-10",
    difficulty: "medium",
    question:
      "A surge protective device is intended primarily to limit which electrical condition?",
    options: [
      "Long-duration mechanical overload",
      "Transient overvoltage",
      "Normal inrush current",
      "Low-frequency vibration",
    ],
    correctIndex: 1,
    explanation:
      "Surge protective devices limit transient overvoltages by diverting or clamping surge energy. They do not replace overload or short-circuit protection.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "B-10 Power conditioning, UPS and surge suppression systems",
    blueprintObjective: "B-10 Surge suppression systems",
    reviewStatus: "draft",
  },
  {
    id: 309011,
    module: "C",
    task: "C-16",
    difficulty: "medium",
    question:
      "A long feeder has unacceptable voltage drop while load current and supply voltage cannot be changed. Which design change most directly reduces conductor voltage drop?",
    options: [
      "Use a larger conductor cross-sectional area",
      "Increase conductor resistance",
      "Add more series connections to the load",
      "Reduce the insulation thickness only",
    ],
    correctIndex: 0,
    explanation:
      "For the same material and length, increasing conductor cross-sectional area lowers resistance. Lower resistance reduces I×R voltage drop at the same load current.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "C-16.01 Installs conductors and cables",
    blueprintObjective: "C-16 Raceways, conductors, cables and enclosures",
    reviewStatus: "draft",
  },
  {
    id: 309012,
    module: "C",
    task: "C-17",
    difficulty: "easy",
    question:
      "Two identical lamps are connected in parallel across a 120 V source. Ignoring conductor voltage drop, what voltage is applied across each lamp?",
    options: ["60 V", "120 V", "240 V", "The voltage depends only on lamp wattage"],
    correctIndex: 1,
    explanation:
      "Loads connected in parallel share the same two supply nodes, so each branch sees the source voltage.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "C-17 Branch circuitry and devices",
    blueprintObjective: "C-17 Branch circuitry and devices",
    reviewStatus: "draft",
  },
  {
    id: 309013,
    module: "C",
    task: "C-16",
    difficulty: "medium",
    question:
      "An electrician wants to check continuity of an isolated conductor. What is the appropriate circuit condition for a standard continuity test?",
    options: [
      "Energized at full load",
      "De-energized and isolated from sources that could affect the measurement",
      "Energized through a larger fuse",
      "Connected in parallel with an unknown live circuit",
    ],
    correctIndex: 1,
    explanation:
      "A continuity or resistance measurement is normally made on a de-energized, isolated circuit. Applying an ohmmeter to an energized circuit can damage the instrument and create a hazard.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "C-16.05 Services and maintains raceways, conductors, cables and enclosures",
    blueprintObjective: "C-16 Wiring-system servicing and maintenance",
    reviewStatus: "draft",
  },
  {
    id: 309014,
    module: "C",
    task: "C-17",
    difficulty: "medium",
    question:
      "A branch circuit breaker repeatedly trips only after several additional loads are switched on. There is no evidence of a short circuit. What is the most likely first condition to investigate?",
    options: [
      "Sustained circuit overload",
      "A higher-than-normal insulation resistance",
      "A disconnected load",
      "An open neutral on an unrelated circuit",
    ],
    correctIndex: 0,
    explanation:
      "If tripping correlates with added load and there is no indication of a fault, total branch-circuit current should be checked against the circuit design and protective-device characteristics.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "C-17.05 Performs servicing of branch circuitry",
    blueprintObjective: "C-17 Branch-circuit troubleshooting",
    reviewStatus: "draft",
  },
  {
    id: 309015,
    module: "C",
    task: "C-20",
    difficulty: "easy",
    question:
      "What is the essential purpose of an emergency lighting system when normal building power is lost?",
    options: [
      "Provide required illumination for safe egress",
      "Increase the normal lighting circuit power factor",
      "Maintain every receptacle in the building",
      "Prevent all fire alarm devices from operating",
    ],
    correctIndex: 0,
    explanation:
      "Emergency lighting provides illumination needed for safe movement and egress when normal lighting power is unavailable.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "C-20 Exit and emergency lighting systems",
    blueprintObjective: "C-20 Exit and emergency lighting systems",
    reviewStatus: "draft",
  },
  {
    id: 309016,
    module: "C",
    task: "C-19",
    difficulty: "medium",
    question:
      "A purely resistive 240 V heater has a resistance of 24 Ω. Approximately how much power does it draw?",
    options: ["240 W", "1,200 W", "2,400 W", "5,760 W"],
    correctIndex: 2,
    explanation:
      "For a resistive load, P = V²/R. P = 240²/24 = 2,400 W.",
    isCalc: true,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "C-19 Electric heating systems",
    blueprintObjective: "C-19 Electric heating systems",
    reviewStatus: "draft",
  },
  {
    id: 309017,
    module: "C",
    task: "C-16",
    difficulty: "medium",
    question:
      "During planning, a conduit run appears likely to contain more conductors than originally designed. What should be done before installation proceeds?",
    options: [
      "Verify the revised conductor count and conduit design against applicable requirements before pulling conductors",
      "Pull the conductors first and check compliance only if they fit",
      "Remove conductor identification to create more space",
      "Use lubricant as a substitute for checking the conduit design",
    ],
    correctIndex: 0,
    explanation:
      "Changes in conductor count can affect conduit sizing, pulling conditions, and other installation requirements. The revised design should be checked before installation rather than relying on whether conductors can physically be forced into the raceway.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "C-16 Raceways, conductors, cables and enclosures",
    blueprintObjective: "C-16 Raceway and conductor installation planning",
    reviewStatus: "draft",
  },
  {
    id: 309018,
    module: "D",
    task: "D-24",
    difficulty: "easy",
    question:
      "A three-phase induction motor is rotating opposite to the required direction after installation. What common field correction reverses its rotation?",
    options: [
      "Interchange any two phase conductors supplying the motor",
      "Connect all three phase conductors together",
      "Remove the equipment bonding conductor",
      "Increase the motor overload setting until rotation changes",
    ],
    correctIndex: 0,
    explanation:
      "Interchanging any two phase conductors reverses the phase sequence seen by a three-phase motor and therefore reverses its direction of rotation.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "D-24.03 Installs three-phase motors",
    blueprintObjective: "D-24 Motors",
    reviewStatus: "draft",
  },
  {
    id: 309019,
    module: "D",
    task: "D-22",
    difficulty: "medium",
    question:
      "What condition is a motor overload relay primarily intended to protect against?",
    options: [
      "Sustained motor overcurrent that can cause overheating",
      "Every instantaneous short circuit on the feeder",
      "Loss of building fire alarm communication",
      "High-frequency data interference",
    ],
    correctIndex: 0,
    explanation:
      "An overload relay responds to sustained overload conditions that can overheat a motor. Short-circuit and ground-fault protection is provided by appropriately coordinated overcurrent protective devices.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "D-22 Motor starters and controls",
    blueprintObjective: "D-22 Motor starters and controls",
    reviewStatus: "draft",
  },
  {
    id: 309020,
    module: "D",
    task: "D-23",
    difficulty: "medium",
    question:
      "For a standard AC induction motor controlled by a variable-frequency drive, which output quantity is most directly varied to control motor speed?",
    options: ["Frequency", "Insulation class", "Bearing diameter", "Frame colour"],
    correctIndex: 0,
    explanation:
      "A variable-frequency drive changes the frequency of the electrical supply to control the speed of an AC motor, while also managing voltage/current as required by its control strategy.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "D-23.01 Installs AC drives",
    blueprintObjective: "D-23 Drives",
    reviewStatus: "draft",
  },
  {
    id: 309021,
    module: "D",
    task: "D-22",
    difficulty: "easy",
    question:
      "In a typical magnetic motor starter, what happens when the contactor coil is energized normally?",
    options: [
      "The main power contacts close",
      "The motor windings become mechanically disconnected",
      "The overload elements are bypassed permanently",
      "The supply frequency doubles automatically",
    ],
    correctIndex: 0,
    explanation:
      "Energizing the contactor coil creates the magnetic force that pulls the contactor into its operated state, closing its normally open main power contacts.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "D-22.01 Installs motor starters",
    blueprintObjective: "D-22 Motor starters and controls",
    reviewStatus: "draft",
  },
  {
    id: 309022,
    module: "D",
    task: "D-25",
    difficulty: "medium",
    question:
      "In an automated control loop, what is the usual role of a field sensor?",
    options: [
      "Measure a process condition and provide an input signal to the control system",
      "Supply all branch-circuit overcurrent protection",
      "Act as the building service disconnect",
      "Replace every final control element",
    ],
    correctIndex: 0,
    explanation:
      "Sensors measure process or equipment conditions such as temperature, pressure, position, or level and provide information to a controller or automation system.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "D-25 Automated control systems",
    blueprintObjective: "D-25 Automated control systems",
    reviewStatus: "draft",
  },
  {
    id: 309023,
    module: "E",
    task: "E-26",
    difficulty: "easy",
    question:
      "Which device is an example of an initiating input in a fire alarm system?",
    options: ["Smoke detector", "Exit sign", "Motor starter", "Power-factor capacitor"],
    correctIndex: 0,
    explanation:
      "A smoke detector can initiate an alarm condition by sending a signal to the fire alarm control system when its detection criteria are met.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "E-26.01 Installs fire alarm systems",
    blueprintObjective: "E-26 Signalling systems",
    reviewStatus: "draft",
  },
  {
    id: 309024,
    module: "E",
    task: "E-27",
    difficulty: "medium",
    question:
      "Why is electromagnetic interference a concern when routing communication cabling near power conductors?",
    options: [
      "It can induce unwanted noise into communication signals",
      "It always raises the building service voltage",
      "It mechanically increases conductor diameter",
      "It eliminates the need for cable testing",
    ],
    correctIndex: 0,
    explanation:
      "Changing magnetic and electric fields associated with power circuits can couple unwanted signals into nearby communication cabling. Proper system design, routing, separation, shielding, and bonding practices help manage interference.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "E-27 Communication systems",
    blueprintObjective: "E-27 Communication systems",
    reviewStatus: "draft",
  },
  {
    id: 309025,
    module: "E",
    task: "E-28",
    difficulty: "medium",
    question:
      "A building automation controller receives a room-temperature signal and commands a damper motor to change position. In this control sequence, what is the damper motor?",
    options: ["An actuator", "A drawing legend", "An overcurrent device", "A current transformer used only for metering"],
    correctIndex: 0,
    explanation:
      "The controller processes the sensor input and commands an actuator. The damper motor converts the control signal into physical movement of the damper.",
    isCalc: false,
    sourceTitle: "Construction Electrician — Examination Weightings",
    sourceUrl: RED_SEAL_WEIGHTING_URL,
    sourceReference: "E-28 Integrated control systems",
    blueprintObjective: "E-28 Integrated control systems",
    reviewStatus: "draft",
  },
];

const questions: Electrician309ADraftQuestion[] = questionDrafts.map(
  (question) => ({
    ...question,
    programKey: ELECTRICIAN_309A_PROGRAM_KEY,
    blueprintVersion: ELECTRICIAN_309A_BLUEPRINT_VERSION,
    sourceVerifiedAt: "2026-08-15",
    approvedForPractice: false,
    approvedForMock: false,
    retiredAt: null,
  }),
);

export default questions;
