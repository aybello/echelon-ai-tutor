import { and, between, eq, or, sql } from "drizzle-orm";
import type { InsertQuestion } from "../../drizzle/schema";
import { questionBankMeta, questions } from "../../drizzle/schema";

/**
 * Original practice questions aligned to the user-approved gap matrix and informed by:
 * - OWWCO Water Distribution Operator Need-to-Know (Ontario)
 * - WPI/ABC Wastewater Collection Operator Class I Need-to-Know
 * - WPI formula/conversion-table conventions
 *
 * These are newly authored practice items, not reproduced certification-exam questions.
 */

type Difficulty = "easy" | "medium" | "hard";
type Step = { l: string; c: string };

type DraftQuestion = {
  module: string;
  difficulty: Difficulty;
  question: string;
  answer: string;
  distractors: [string, string, string];
  explanation: string;
  isCalc?: boolean;
  steps?: Step[];
  tip?: string;
};

type TopicBatch = {
  bankKey: "class1-wastewater-coll" | "class1-water-dist";
  module: string;
  topic: string;
  expected: Record<Difficulty, number>;
  drafts: DraftQuestion[];
};

const d = (
  module: string,
  difficulty: Difficulty,
  question: string,
  answer: string,
  distractors: [string, string, string],
  explanation: string,
  extras: Pick<DraftQuestion, "isCalc" | "steps" | "tip"> = {}
): DraftQuestion => ({
  module,
  difficulty,
  question,
  answer,
  distractors,
  explanation,
  ...extras,
});

const calc = (
  module: string,
  difficulty: Difficulty,
  question: string,
  answer: string,
  distractors: [string, string, string],
  explanation: string,
  steps: Step[],
  tip?: string
): DraftQuestion =>
  d(module, difficulty, question, answer, distractors, explanation, {
    isCalc: true,
    steps,
    tip,
  });

const COLLECTION_SCIENCE = "Applied Science & Hydraulics";
const COLLECTION_EQUIPMENT = "Operate Equipment";
const COLLECTION_RESTORE = "Maintain & Restore Collection System";
const DISTRIBUTION_GENERAL = "General";
const DISTRIBUTION_ADMIN = "Administration";

const topicBatches: TopicBatch[] = [];

function addBatch(batch: TopicBatch) {
  const actual = batch.drafts.reduce<Record<Difficulty, number>>(
    (counts, item) => {
      counts[item.difficulty] += 1;
      return counts;
    },
    { easy: 0, medium: 0, hard: 0 }
  );
  for (const difficulty of ["easy", "medium", "hard"] as const) {
    if (actual[difficulty] !== batch.expected[difficulty]) {
      throw new Error(
        `${batch.bankKey}/${batch.topic}: expected ${batch.expected[difficulty]} ${difficulty}, got ${actual[difficulty]}`
      );
    }
  }
  topicBatches.push(batch);
}

// Question batches are declared below. Keeping each official gap-spec topic in its own
// batch makes the required count and difficulty mix executable rather than documentary.

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_SCIENCE,
  topic: "Hydraulic Concepts",
  expected: { easy: 5, medium: 7, hard: 3 },
  drafts: [
    d(
      COLLECTION_SCIENCE,
      "easy",
      "What does static head represent in a wastewater pumping system?",
      "The vertical elevation difference the pump must overcome when no flow is occurring",
      [
        "The pressure lost only through pipe fittings",
        "The velocity created by the impeller",
        "The electrical load on the pump motor",
      ],
      "Static head is the elevation difference between the suction and discharge liquid levels when flow-related losses are absent. Friction head is added separately when the system is flowing."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "Which condition normally causes friction head in a forcemain to increase?",
      "Increasing the flow rate through the same pipe",
      [
        "Lowering the wet-well level while the pump is off",
        "Increasing the pipe diameter at the same flow",
        "Opening an air-release valve at a high point",
      ],
      "Friction loss rises as velocity and flow increase through a given pipe. A larger pipe at the same flow generally reduces velocity and friction loss."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "Pressure head is commonly expressed as which unit?",
      "Metres of liquid column",
      ["Litres per second", "Kilowatt-hours", "Milligrams per litre"],
      "Pressure head expresses pressure as the equivalent height of a liquid column, normally metres of water. It is not a flow, energy, or concentration unit."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "What does pump efficiency compare?",
      "Useful hydraulic power delivered to the liquid with power supplied to the pump",
      [
        "Static head with friction head",
        "Motor speed with wet-well depth",
        "Discharge pressure with atmospheric pressure only",
      ],
      "Pump efficiency is useful hydraulic output divided by power input. Losses inside the pump make the efficiency less than 100%."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "What is flow rate?",
      "The volume of liquid passing a point during a stated time",
      [
        "The force exerted per unit area",
        "The elevation above a reference point",
        "The resistance of a conductor",
      ],
      "Flow rate describes volume per unit time, such as litres per second. Pressure and head describe energy or force conditions, not the amount moving per time."
    ),
    calc(
      COLLECTION_SCIENCE,
      "medium",
      "A pump moves 540 m³ of wastewater in 3 hours. What is its average flow rate?",
      "180 m³/h",
      ["60 m³/h", "162 m³/h", "1,620 m³/h"],
      "Average flow equals total volume divided by elapsed time.",
      [
        { l: "Step 1 — Identify values", c: "Volume = 540 m³; time = 3 h" },
        { l: "Step 2 — Divide", c: "540 m³ ÷ 3 h = 180 m³/h" },
      ]
    ),
    calc(
      COLLECTION_SCIENCE,
      "medium",
      "A pressure gauge reads 196 kPa. Using 9.81 kPa per metre of water, what is the approximate pressure head?",
      "20.0 m",
      ["2.0 m", "19.2 m", "200 m"],
      "Pressure head is pressure divided by the pressure produced by one metre of water.",
      [
        { l: "Step 1 — Use conversion", c: "1 m of water ≈ 9.81 kPa" },
        { l: "Step 2 — Calculate head", c: "196 kPa ÷ 9.81 kPa/m ≈ 20.0 m" },
      ]
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "Two identical pumps operate in parallel. What is their primary combined effect near the design operating range?",
      "They can provide more flow at a similar head than one pump",
      [
        "They double the static head regardless of the system",
        "They eliminate all friction loss",
        "They force each pump to operate at shutoff head",
      ],
      "Parallel pumps add flow at a common head, although the actual gain depends on the system curve. Pumps in series are used when more head is required."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "A pump is operating far to the left of its best-efficiency point. Which condition is most likely?",
      "Low flow with internal recirculation and increased vibration",
      [
        "Maximum flow with no developed head",
        "Zero motor current under full load",
        "A flat system curve with no static head",
      ],
      "Operating well below the best-efficiency flow can cause internal recirculation, vibration, heat, and wear. The pump may still develop considerable head."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "Why does a partially closed discharge valve move a centrifugal pump to a lower flow on its curve?",
      "It increases system resistance and required head",
      [
        "It removes static head from the system",
        "It increases the pump impeller diameter",
        "It converts the pump to positive displacement",
      ],
      "Throttling adds resistance to the system curve, so its intersection with the pump curve occurs at lower flow and higher pump head."
    ),
    calc(
      COLLECTION_SCIENCE,
      "medium",
      "A pump receives 12 kW and delivers 8.4 kW of hydraulic power. What is its efficiency?",
      "70%",
      ["42%", "120%", "3.6%"],
      "Efficiency is useful output divided by input, expressed as a percentage.",
      [
        { l: "Step 1 — Form ratio", c: "8.4 kW ÷ 12 kW = 0.70" },
        { l: "Step 2 — Convert", c: "0.70 × 100 = 70%" },
      ]
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "A wet-well pump starts normally, but discharge flow is much lower than usual and discharge pressure is high. What should the operator suspect first?",
      "A restriction or closed valve in the discharge path",
      [
        "A completely empty forcemain with no resistance",
        "An oversized wet well",
        "A lower wastewater specific gravity",
      ],
      "High discharge pressure with low flow indicates the pump is working against excessive resistance, such as a closed valve or blockage. Worn impellers more often reduce both developed head and flow."
    ),
    d(
      COLLECTION_SCIENCE,
      "hard",
      "After a replacement pump is installed, it delivers more flow but repeatedly overloads its motor. What is the best hydraulic explanation?",
      "The operating point requires more brake power than the motor can supply",
      [
        "The static head has become negative",
        "The wet-well volume is too large for the motor",
        "The check valve is preventing all reverse flow",
      ],
      "A changed pump or system operating point can move the pump into a region with higher power demand. Motor selection must cover the pump's required brake power over the expected operating range."
    ),
    calc(
      COLLECTION_SCIENCE,
      "hard",
      "A forcemain system has 14 m of static head and 11 m of friction head at the required flow. If minor losses are estimated at 2 m, what total dynamic head must the pump overcome?",
      "27 m",
      ["23 m", "25 m", "154 m"],
      "Total dynamic head is the sum of static head and all flow-related losses at the selected flow.",
      [
        {
          l: "Step 1 — List components",
          c: "Static = 14 m, friction = 11 m, minor = 2 m",
        },
        { l: "Step 2 — Add", c: "14 + 11 + 2 = 27 m" },
      ]
    ),
    d(
      COLLECTION_SCIENCE,
      "hard",
      "A pump station's measured operating point has shifted to lower flow and higher head without a speed change. Which investigation is most appropriate?",
      "Check for increased system resistance from a restriction, fouling, or valve position",
      [
        "Assume the wet well has gained storage volume",
        "Reduce motor overload protection immediately",
        "Replace the pressure gauge with a larger range without verification",
      ],
      "Lower flow and higher head indicate the system curve has become steeper or more restrictive. Instrument accuracy should also be verified, but protective settings should not be weakened."
    ),
  ],
});

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_SCIENCE,
  topic: "Basic & Applied Chemistry",
  expected: { easy: 5, medium: 7, hard: 3 },
  drafts: [
    d(
      COLLECTION_SCIENCE,
      "easy",
      "A wastewater pH of 7 is described as what?",
      "Neutral",
      ["Strongly acidic", "Strongly alkaline", "Free of dissolved solids"],
      "On the pH scale, 7 is neutral at typical reference conditions. Values below 7 are acidic and values above 7 are alkaline."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "Under oxygen-poor sewer conditions, which gas is commonly associated with a rotten-egg odour?",
      "Hydrogen sulfide",
      ["Nitrogen", "Oxygen", "Carbon dioxide only"],
      "Hydrogen sulfide can form when sulfate is reduced under anaerobic conditions. It is toxic and can also contribute to odour and corrosion."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "What does dissolved oxygen measure?",
      "The amount of oxygen dissolved in water",
      [
        "The oxygen bound in water molecules",
        "The amount of suspended grit",
        "The chlorine demand of wastewater",
      ],
      "Dissolved oxygen is molecular oxygen available in the liquid. It is distinct from the oxygen chemically bound in H₂O."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "BOD is primarily an indication of what?",
      "The oxygen microorganisms may use while degrading biodegradable material",
      [
        "The total pipe capacity",
        "The wastewater electrical conductivity only",
        "The number of coliform organisms",
      ],
      "Biochemical oxygen demand estimates the oxygen consumed biologically under specified test conditions. It is not a direct pathogen count."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "Why is methane a concern in a confined collection-system space?",
      "It can create a flammable or explosive atmosphere",
      [
        "It always provides adequate breathing oxygen",
        "It neutralizes every corrosive compound",
        "It is visible before reaching a hazardous level",
      ],
      "Methane is combustible and may accumulate in oxygen-deficient spaces. It is colourless, so atmospheric testing is required."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "A sewer has long detention time, warm wastewater, and very low dissolved oxygen. Which condition is most likely to develop?",
      "Anaerobic sulfide formation and odour",
      [
        "Rapid oxygen enrichment without aeration",
        "Immediate precipitation of all dissolved solids",
        "Elimination of biological activity",
      ],
      "Long, warm, oxygen-depleted retention promotes anaerobic conditions and sulfide production. Shortening detention or adding oxygen or suitable chemicals can reduce the problem."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "Why can lowering wastewater pH increase the immediate hazard from dissolved sulfide?",
      "More sulfide shifts to gaseous hydrogen sulfide",
      [
        "All sulfide becomes harmless sulfate instantly",
        "Methane becomes nonflammable",
        "Dissolved oxygen automatically rises",
      ],
      "At lower pH, a greater fraction of sulfide exists as undissociated H₂S, which can leave the liquid as toxic gas."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "An operator adds nitrate to control sewer odour. What is the intended effect?",
      "Provide an alternative electron acceptor that suppresses sulfate reduction",
      [
        "Lower the pipe's hydraulic grade line",
        "Create chlorine residual for drinking water",
        "Increase grit settling by raising velocity",
      ],
      "Nitrate can support biological pathways that limit sulfate reduction and sulfide formation. It does not change pipe hydraulics directly."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "What is the main distinction between BOD and COD?",
      "COD measures chemically oxidizable material, while BOD measures biologically consumed oxygen under test conditions",
      [
        "BOD is always higher than COD",
        "COD counts bacteria and BOD counts viruses",
        "COD measures only dissolved oxygen already present",
      ],
      "COD commonly gives a faster estimate of chemically oxidizable matter; BOD reflects biological oxygen demand over a specified incubation."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "A wastewater sample changes from pH 6 to pH 5. What does the logarithmic pH scale imply?",
      "The hydrogen-ion activity is approximately ten times greater",
      [
        "The acidity has increased by one percent",
        "The sample has ten times more dissolved oxygen",
        "The alkalinity must be unchanged",
      ],
      "A one-unit decrease in pH represents about a tenfold increase in hydrogen-ion activity. pH does not directly state dissolved oxygen or alkalinity."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "Why should incompatible collection-system chemicals be stored separately?",
      "Mixing can cause heat, toxic gas, fire, or loss of treatment effectiveness",
      [
        "Separation always increases chemical strength",
        "All liquid chemicals react safely when diluted",
        "Storage compatibility applies only to drinking-water plants",
      ],
      "Chemical compatibility controls prevent dangerous reactions and preserve product performance. The SDS and facility procedures govern segregation."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "Which observation best indicates that a wastewater line is becoming septic?",
      "Dark wastewater with sulfide odour and depleted dissolved oxygen",
      [
        "Clear water with stable chlorine residual",
        "High flow with no detention time",
        "Cold water with vigorous aeration",
      ],
      "Septic wastewater is associated with anaerobic conditions, dark colour, sulfide odour, and low dissolved oxygen."
    ),
    d(
      COLLECTION_SCIENCE,
      "hard",
      "A forcemain discharge has recurring hydrogen sulfide peaks after long pump-off periods. Which control addresses the cause most directly?",
      "Reduce detention time or maintain conditions that prevent anaerobic sulfide formation",
      [
        "Increase detention time to allow more settling",
        "Close the air-release valves permanently",
        "Lower the wastewater pH",
      ],
      "Long detention encourages anaerobic sulfide generation. Operational changes that reduce retention or add oxygen, nitrate, or another validated control address formation rather than only masking odour."
    ),
    d(
      COLLECTION_SCIENCE,
      "hard",
      "An operator measures a strong sulfide odour at a wet well, but a direct-reading meter shows zero H₂S. What is the safest conclusion?",
      "Do not rely on odour; verify calibration, bump-test status, sampling method, and atmosphere before entry",
      [
        "The atmosphere is safe because the display is zero",
        "The gas is harmless if it can be smelled",
        "Increase the alarm setpoint until the reading appears",
      ],
      "Odour is unreliable because olfactory fatigue can occur, and a zero reading may reflect instrument or sampling failure. Entry decisions require a properly functioning, tested instrument and the full confined-space procedure."
    ),
    d(
      COLLECTION_SCIENCE,
      "hard",
      "A corrosion investigation finds sulfuric acid damage above the normal wastewater level in a concrete sewer. Which sequence best explains it?",
      "H₂S leaves the wastewater, is biologically oxidized on moist surfaces, and forms sulfuric acid",
      [
        "Methane dissolves concrete directly below the flow line",
        "Dissolved oxygen reacts with sand to form hydrochloric acid",
        "BOD converts calcium carbonate into chlorine gas",
      ],
      "Biogenic sulfuric acid corrosion begins with sulfide generation, H₂S release, and oxidation to acid on moist sewer surfaces. The attack is often severe above the water line."
    ),
  ],
});

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_SCIENCE,
  topic: "Electrical Concepts",
  expected: { easy: 4, medium: 5, hard: 3 },
  drafts: [
    d(
      COLLECTION_SCIENCE,
      "easy",
      "What electrical quantity is measured in amperes?",
      "Current",
      ["Voltage", "Resistance", "Power factor"],
      "Amperes measure electric current. Volts measure potential difference and ohms measure resistance."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "What is the purpose of a motor overload relay?",
      "Protect the motor from sustained overcurrent and overheating",
      [
        "Protect only against a direct lightning strike",
        "Increase motor speed above its rating",
        "Replace the disconnecting means",
      ],
      "An overload relay responds to sustained excessive current that can overheat a motor. Short-circuit protection is normally provided separately."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "A normally open control contact has what state when it is not actuated?",
      "Its circuit path is open",
      [
        "Its circuit path is shorted to ground",
        "Its contacts carry full motor current",
        "Its resistance is always zero",
      ],
      "Normally open describes the contact's de-energized or unactuated state. Actuation closes the control path."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "What unit is used for electrical resistance?",
      "Ohm",
      ["Ampere", "Watt-hour", "Volt-ampere only"],
      "Resistance is measured in ohms. Current is measured in amperes and voltage in volts."
    ),
    calc(
      COLLECTION_SCIENCE,
      "medium",
      "A 24 V control circuit has a 12 Ω load. Using Ohm's law, what current should flow?",
      "2 A",
      ["0.5 A", "12 A", "288 A"],
      "Ohm's law gives current as voltage divided by resistance.",
      [
        { l: "Step 1 — Formula", c: "I = V ÷ R" },
        { l: "Step 2 — Substitute", c: "I = 24 V ÷ 12 Ω = 2 A" },
      ]
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "A three-phase pump motor suddenly draws high current on two phases and little current on the third. What should the operator suspect?",
      "A lost phase or serious phase imbalance",
      [
        "Normal balanced operation",
        "An oversized wet well only",
        "A correct low-voltage control signal",
      ],
      "Marked phase-current imbalance can indicate a lost phase, connection problem, or supply fault. The motor should be stopped and qualified electrical personnel involved."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "Why is lockout/tagout required before mechanical work on an electrically driven pump?",
      "To isolate hazardous energy and prevent unexpected startup",
      [
        "To record the pump's normal flow",
        "To increase starter holding current",
        "To test the SCADA alarm remotely",
      ],
      "Lockout/tagout controls electrical and other stored energy so the equipment cannot start unexpectedly during servicing."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "A motor starter's control fuse opens repeatedly. What is the appropriate response?",
      "Find and correct the control-circuit fault before replacing the fuse again",
      [
        "Install a larger fuse without engineering review",
        "Bypass the fuse to keep the pump available",
        "Hold the starter contactor closed manually",
      ],
      "A repeated fuse operation indicates a fault or overload. Increasing or bypassing protection can create fire, shock, and equipment hazards."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "What does a variable-frequency drive primarily change to control an AC motor's speed?",
      "The frequency of the electrical supply to the motor",
      [
        "The wet-well pH",
        "The mechanical seal material",
        "The utility transformer location",
      ],
      "Motor synchronous speed is related to supply frequency, so a VFD varies frequency and voltage in a controlled manner."
    ),
    d(
      COLLECTION_SCIENCE,
      "hard",
      "A pump motor trips on overload only when the wet well is high and the pump is delivering maximum flow. What should be checked first?",
      "Actual phase currents and the pump's required load against motor and overload ratings",
      [
        "Whether the alarm horn is loud enough",
        "Whether the incoming sewer slope is too steep",
        "Whether the control fuse is a different colour",
      ],
      "Load-dependent trips require measurement of current and comparison with nameplate, overload, voltage, phase balance, and pump operating conditions. Protection should not simply be increased."
    ),
    d(
      COLLECTION_SCIENCE,
      "hard",
      "A motor insulation test is required after water intrusion into a terminal box. Who should perform and interpret the test?",
      "A qualified electrical worker following isolation and manufacturer procedures",
      [
        "Any operator while the motor remains energized",
        "The SCADA historian automatically",
        "A CCTV contractor using the sewer camera",
      ],
      "Insulation resistance testing involves electrical hazards and equipment-specific interpretation. It requires qualified personnel and verified isolation."
    ),
    d(
      COLLECTION_SCIENCE,
      "hard",
      "A standby pump starts whenever the lead pump starts, even though the high-level setpoint is not reached. Which fault is most consistent?",
      "A control logic, relay, or level-input fault falsely issuing the lag-start command",
      [
        "Normal alternation after every stop",
        "A larger discharge pipe",
        "Lower wastewater conductivity",
      ],
      "An unintended simultaneous start points to the lag control circuit or logic, including a stuck relay or false level signal. Hydraulic conditions alone do not issue a start command."
    ),
  ],
});

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_SCIENCE,
  topic: "Public Health Principles",
  expected: { easy: 4, medium: 4, hard: 2 },
  drafts: [
    d(
      COLLECTION_SCIENCE,
      "easy",
      "Why must operators avoid direct contact with untreated wastewater?",
      "It may contain disease-causing microorganisms",
      [
        "It always contains enough chlorine for disinfection",
        "It is sterile once it enters a sewer",
        "Only its odour can cause infection",
      ],
      "Untreated wastewater may contain bacteria, viruses, protozoa, and other hazards. Exposure controls and hygiene reduce transmission risk."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "Which route can transmit a wastewater-related gastrointestinal pathogen?",
      "Hand-to-mouth contact after handling contaminated material",
      [
        "Looking at a sewer plan",
        "Hearing a lift-station alarm",
        "Touching clean PPE before use",
      ],
      "Ingestion can occur when contaminated hands, food, or objects reach the mouth. Handwashing and no-eating rules are important controls."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "What do coliform bacteria commonly serve as in water-quality testing?",
      "Indicator organisms for possible contamination or treatment failure",
      [
        "A direct measurement of every virus",
        "A measure of pipe pressure",
        "A chemical used for odour control",
      ],
      "Coliforms are indicators; their presence can signal contamination pathways or inadequate control. They do not enumerate every pathogen."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "Why is vaccination relevant for some wastewater workers?",
      "It can reduce risk from specific occupationally relevant infectious diseases",
      [
        "It replaces gloves and handwashing",
        "It prevents all chemical exposures",
        "It makes atmospheric testing unnecessary",
      ],
      "Vaccination may be one layer of protection according to occupational-health advice. It does not replace engineering controls, PPE, or hygiene."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "An operator receives a splash of wastewater to the eyes. What is the immediate priority?",
      "Flush the eyes promptly and follow the exposure-reporting and medical-evaluation procedure",
      [
        "Wait for symptoms before rinsing",
        "Neutralize the splash with an unknown chemical",
        "Return to work without documenting the exposure",
      ],
      "Immediate flushing reduces contact time, and the event must be managed under the workplace exposure protocol. Chemical neutralization can worsen injury."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "Why should clean and contaminated areas be separated in a collection-system vehicle?",
      "To prevent wastewater organisms from being transferred to food, personal items, and clean equipment",
      [
        "To increase the vehicle's payload rating",
        "To raise dissolved oxygen in samples",
        "To eliminate the need for disinfection",
      ],
      "Physical separation reduces cross-contamination. Cleaning and disinfection procedures are still required."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "A sewage backup enters an occupied basement. Which response best protects public health?",
      "Restrict exposure, stop the source when safe, and initiate approved cleanup and notification procedures",
      [
        "Allow occupants to clean without protective measures",
        "Use a fan to spread aerosols through the building",
        "Ignore the event if the water level drops",
      ],
      "Sewage backups can expose occupants to pathogens and contaminated materials. Access control, safe source control, proper cleanup, and applicable notification are required."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "Why is aerosol generation a concern during high-pressure sewer cleaning?",
      "Fine droplets may carry biological contaminants into the breathing zone",
      [
        "Aerosols remove every pathogen from the work area",
        "Only visible solids can transmit disease",
        "Aerosols prevent eye exposure",
      ],
      "Jetting can aerosolize contaminated wastewater. Work practices, positioning, PPE, and hygiene should control inhalation and mucous-membrane exposure."
    ),
    d(
      COLLECTION_SCIENCE,
      "hard",
      "Several workers develop gastrointestinal symptoms after a sewer-cleaning job. Which investigation would best identify an occupational transmission pathway?",
      "Review splash and aerosol exposure, hygiene, PPE use, breaks, and decontamination practices",
      [
        "Compare only the truck fuel records",
        "Increase pump discharge pressure without review",
        "Assume the illness cannot be work-related because wastewater looked clear",
      ],
      "A transmission investigation examines how contaminated material could have been ingested or contacted. Appearance does not establish microbiological safety."
    ),
    d(
      COLLECTION_SCIENCE,
      "hard",
      "A cross-connection could allow sewage-contaminated water to enter a potable supply used for jetting. What is the strongest preventive control?",
      "Use the approved backflow-prevention method with an air gap or suitable tested device",
      [
        "Rely on positive pressure at the hydrant at all times",
        "Close the jetter nozzle between uses",
        "Add deodorizer to the jetter tank",
      ],
      "Backsiphonage or backpressure can contaminate the potable system. An approved air gap or properly selected and tested backflow preventer provides the required separation."
    ),
  ],
});

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_SCIENCE,
  topic: "Maps & Plans",
  expected: { easy: 3, medium: 3, hard: 2 },
  drafts: [
    d(
      COLLECTION_SCIENCE,
      "easy",
      "What is the main purpose of an as-built sewer drawing?",
      "Show the installed location and configuration of the completed work",
      [
        "Show only the original tender estimate",
        "Replace every field locate",
        "Record employee training hours",
      ],
      "As-built drawings document the work as installed, including approved changes from design. Field locating is still required before excavation."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "On a sewer profile, what does invert elevation identify?",
      "The elevation of the inside bottom of the pipe",
      [
        "The top of the manhole cover only",
        "The ground-water pH",
        "The pipe wall thickness",
      ],
      "Invert elevation is the elevation of the lowest inside surface of the pipe and is used to assess grade and flow direction."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "What does a plan view normally show?",
      "A top-down layout of features and their horizontal locations",
      [
        "Only vertical pipe elevations",
        "A motor wiring schematic",
        "A wastewater laboratory result",
      ],
      "A plan view shows horizontal arrangement. Profiles and sections provide vertical and cross-sectional information."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "Two adjacent manholes have invert elevations of 102.40 m and 101.80 m. In which direction should gravity flow occur?",
      "Toward the manhole with the 101.80 m invert",
      [
        "Toward the 102.40 m invert",
        "Equally in both directions",
        "Flow direction cannot depend on elevation",
      ],
      "Gravity flow moves from higher hydraulic elevation toward lower elevation when the pipe is unobstructed. The lower invert is downstream in this comparison."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "A GIS map and a field locate disagree about a sewer's position. What should the operator do before excavation?",
      "Stop and resolve the discrepancy using approved locating and record-verification procedures",
      [
        "Excavate at the map line without further checks",
        "Ignore the field locate because GIS is always exact",
        "Move the GIS feature after excavation without evidence",
      ],
      "Maps are valuable but may contain offsets or outdated information. The conflict must be resolved before disturbing the ground."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "A drawing scale is 1:500. What does 1 cm measured on the drawing represent in the field?",
      "5 m",
      ["0.5 m", "50 m", "500 m"],
      "At 1:500, one drawing unit equals 500 of the same field units. One centimetre therefore represents 500 cm, or 5 m."
    ),
    d(
      COLLECTION_SCIENCE,
      "hard",
      "A proposed repair drawing shows a service lateral crossing a utility but omits elevations. What is the best decision?",
      "Obtain verified utility and sewer elevations before confirming the repair method",
      [
        "Assume the lateral passes beneath every utility",
        "Select a repair depth from the nearest street sign",
        "Proceed because horizontal coordinates are sufficient",
      ],
      "A crossing cannot be safely designed from horizontal location alone. Verified depths and clearances are required to avoid conflict and maintain grade."
    ),
    d(
      COLLECTION_SCIENCE,
      "hard",
      "An as-built profile shows the downstream invert higher than the upstream invert, but field flow appears normal. What should be investigated?",
      "Possible drawing error, datum mismatch, or unrecorded field change",
      [
        "Whether gravity has reversed temporarily",
        "Whether pH changed the elevation",
        "Whether the pipe diameter is measured in litres",
      ],
      "The inconsistency suggests record or datum problems, or construction differing from the drawing. Survey and field verification should resolve it."
    ),
  ],
});

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_SCIENCE,
  topic: "Units of Expression",
  expected: { easy: 2, medium: 2, hard: 1 },
  drafts: [
    d(
      COLLECTION_SCIENCE,
      "easy",
      "What does the prefix milli- mean?",
      "One-thousandth",
      ["One hundred", "One thousand", "One-millionth"],
      "Milli- represents 10⁻³, or one-thousandth of the base unit."
    ),
    d(
      COLLECTION_SCIENCE,
      "easy",
      "Which unit expresses a volume flow rate?",
      "Litres per second",
      ["Kilopascals", "Milligrams per litre", "Kilowatt-hours"],
      "Litres per second expresses volume divided by time. Kilopascals express pressure and milligrams per litre express concentration."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "Which relationship between litres and cubic metres is correct?",
      "1 m³ equals 1,000 L",
      ["1 m³ equals 100 L", "1 L equals 1,000 m³", "1 m³ equals 10,000 L"],
      "A cubic metre contains 1,000 litres. This relationship is used frequently in flow and volume calculations."
    ),
    d(
      COLLECTION_SCIENCE,
      "medium",
      "A pressure is reported as 70 kPa. Which statement correctly interprets the prefix?",
      "The pressure is 70,000 pascals",
      [
        "The pressure is 70 pascals",
        "The pressure is 0.070 pascal",
        "The pressure is 7,000,000 pascals",
      ],
      "Kilo- means one thousand, so 70 kilopascals equals 70,000 pascals."
    ),
    d(
      COLLECTION_SCIENCE,
      "hard",
      "A flow log mixes US gallons per minute and litres per second without identifying which is used in each row. Why is this a serious problem?",
      "The values cannot be compared or used safely until units are verified and converted",
      [
        "The units are numerically identical",
        "Only pressure calculations require units",
        "Averaging the numbers automatically corrects them",
      ],
      "Unit ambiguity can produce major operating and design errors. Each value needs a verified unit before conversion or comparison."
    ),
  ],
});

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_EQUIPMENT,
  topic: "Pumps",
  expected: { easy: 4, medium: 5, hard: 3 },
  drafts: [
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "Which component of a centrifugal pump adds velocity to the wastewater?",
      "The rotating impeller",
      [
        "The check valve",
        "The wet-well access hatch",
        "The motor overload relay",
      ],
      "The impeller transfers rotational energy to the liquid. The casing then helps convert velocity into pressure."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "Why might a pump station use a slow-closing check valve on a discharge line?",
      "To reduce a rapid flow reversal and pressure surge when the pump stops",
      [
        "To increase motor speed during every start",
        "To measure the wet-well level directly",
        "To add air continuously into the forcemain",
      ],
      "A fast flow reversal can create a damaging pressure surge. Where required by the system design, controlled check-valve closure helps limit that transient while still preventing sustained reverse flow."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "Which pump type moves liquid by trapping and advancing a fixed volume each cycle?",
      "Positive-displacement pump",
      ["Centrifugal pump", "Axial-flow pump", "Mixed-flow pump"],
      "Positive-displacement pumps move discrete volumes and can develop high pressure. Centrifugal pumps impart velocity continuously."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "Why is a metering pump used for chemical addition?",
      "It delivers a controlled, adjustable dose",
      [
        "It grinds sewage solids",
        "It measures motor insulation",
        "It replaces the chemical storage tank",
      ],
      "Metering pumps provide repeatable low-volume chemical feed. They must still be calibrated for the actual system pressure and chemical."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "A centrifugal pump runs, but no discharge pressure develops after maintenance. What should be checked first?",
      "Whether the pump is properly primed and suction and discharge valves are correctly positioned",
      [
        "Whether the alarm beacon is amber",
        "Whether the flow totalizer has been reset",
        "Whether the wet-well ladder is stainless steel",
      ],
      "Loss of prime, air binding, or an incorrect valve lineup can prevent a centrifugal pump from developing flow and head."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "What condition most directly causes cavitation in a centrifugal pump?",
      "Insufficient pressure at the pump suction",
      [
        "Excessive pressure at the motor starter",
        "A fully charged standby battery",
        "An open ventilation fan damper",
      ],
      "When suction pressure falls below the liquid's vapour-pressure requirement, vapour bubbles form and collapse, causing noise, vibration, and damage."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "A screw pump is best suited to which collection-system duty?",
      "Lifting large flows at relatively low head while passing solids",
      [
        "Injecting a few millilitres of polymer per minute",
        "Generating compressed air for controls",
        "Measuring chlorine residual",
      ],
      "Screw pumps can handle debris-laden wastewater gently at low to moderate lift. Metering pumps suit precise chemical dosing."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "A pneumatic ejector station moves wastewater by what means?",
      "Compressed air alternately pressurizes a receiving vessel",
      [
        "A submerged centrifugal impeller runs continuously",
        "A gravity valve creates electrical current",
        "A screw conveyor raises the wet-well floor",
      ],
      "A pneumatic ejector uses compressed air to force wastewater from a vessel after it fills. Sequencing and check valves control the cycle."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "A pump's seal leakage increases suddenly. What is the correct operational response?",
      "Assess leakage against the manufacturer's limits and inspect the seal system promptly",
      [
        "Tighten every fastener while the pump runs",
        "Block the seal drain so leakage cannot be seen",
        "Increase speed until the leakage stops",
      ],
      "A sudden change can signal seal or shaft problems. Safe isolation and manufacturer procedures are required; hiding leakage does not correct it."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "hard",
      "A wet-well pump experiences repeated ragging. Which change is most likely to address the operating cause?",
      "Review pump passage size, impeller type, operating point, and upstream screening",
      [
        "Increase overload settings until the motor no longer trips",
        "Remove the check valve from the discharge",
        "Disable the high-level alarm",
      ],
      "Ragging is influenced by solids characteristics, pump geometry, speed, and upstream control. Electrical protection and alarms must remain effective."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "hard",
      "Two duty pumps show the same discharge pressure, but one draws substantially more current and vibrates. What is the best next step?",
      "Remove the abnormal pump from duty when safe and inspect for mechanical or hydraulic damage",
      [
        "Assume equal pressure proves equal condition",
        "Raise its overload setting",
        "Close the common discharge valve completely while both run",
      ],
      "Current and vibration differences can reveal obstruction, wear, misalignment, or bearing damage even when the common header pressure is the same."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "hard",
      "A centrifugal pump repeatedly cycles near shutoff because downstream flow is restricted. What risk should be controlled?",
      "Internal heating, recirculation, vibration, and pump damage from very low flow",
      [
        "Loss of all developed head",
        "Automatic conversion to a metering pump",
        "Elimination of radial load",
      ],
      "Centrifugal pumps require an acceptable operating range or minimum flow. Prolonged operation near shutoff can overheat and damage the pump."
    ),
  ],
});

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_EQUIPMENT,
  topic: "Motors & Drives",
  expected: { easy: 3, medium: 3, hard: 2 },
  drafts: [
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "What information is found on an electric motor nameplate?",
      "Rated voltage, current, power, speed, and other operating limits",
      [
        "The sewer's as-built invert elevations",
        "The wastewater BOD result",
        "The confined-space entry permit",
      ],
      "The nameplate identifies the motor's electrical and mechanical ratings needed for correct supply, protection, and loading."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "What does a gear reducer do between a motor and driven equipment?",
      "Reduces speed while increasing available torque",
      [
        "Changes AC power to drinking water",
        "Eliminates the need for lubrication",
        "Measures flow through the forcemain",
      ],
      "A gear reducer trades rotational speed for torque according to its ratio. It requires alignment and lubrication."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "Why is coupling alignment important?",
      "Misalignment increases vibration and bearing and seal wear",
      [
        "Alignment raises wastewater pH",
        "Misalignment improves motor efficiency",
        "Alignment replaces shaft guarding",
      ],
      "Proper alignment reduces damaging forces on shafts, bearings, couplings, and seals. Guards remain required after alignment."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "A three-phase motor reverses direction after electrical work. What is the likely cause?",
      "Two supply phases were interchanged",
      [
        "The wet-well setpoint was lowered",
        "The coupling was lubricated",
        "The discharge valve was opened",
      ],
      "Changing the phase sequence reverses a three-phase motor. Rotation must be verified safely before coupling or operation."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "Why should a VFD-driven motor be checked for adequate cooling at very low speed?",
      "A shaft-mounted fan may move less cooling air while the motor still carries load",
      [
        "Low speed always doubles insulation strength",
        "The VFD supplies mechanical lubrication",
        "Cooling depends only on wet-well volume",
      ],
      "Motor self-cooling can decline at low speed. Application limits or separate cooling may be required."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "What is the purpose of a flexible coupling?",
      "Transmit torque while accommodating small permitted misalignment and shock",
      [
        "Provide electrical overload protection",
        "Prevent all reverse flow",
        "Measure the motor's insulation resistance",
      ],
      "A flexible coupling transfers torque and tolerates limited misalignment; it does not excuse poor alignment or replace guarding."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "hard",
      "A motor bearing repeatedly fails shortly after replacement. Which investigation is most complete?",
      "Check alignment, lubrication, loading, vibration, installation, and possible electrical bearing currents",
      [
        "Replace it again without finding the cause",
        "Increase motor speed to smooth the vibration",
        "Disable condition alarms",
      ],
      "Recurring failure requires root-cause analysis across mechanical, lubrication, operating, and electrical factors."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "hard",
      "A driven pump shaft is difficult to turn after the motor is decoupled. What does this indicate?",
      "The mechanical resistance is likely in the pump or driven train rather than the motor",
      [
        "The electrical supply has reversed phase",
        "The overload relay is undersized",
        "The SCADA screen has the wrong units",
      ],
      "Decoupling helps isolate the source of drag. The driven equipment should be safely inspected before recoupling."
    ),
  ],
});

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_EQUIPMENT,
  topic: "Generators",
  expected: { easy: 2, medium: 3, hard: 1 },
  drafts: [
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "What is the purpose of a standby generator at a lift station?",
      "Supply power during loss of the normal utility source",
      [
        "Provide continuous sewer ventilation",
        "Measure forcemain pressure",
        "Replace every station battery",
      ],
      "Standby generation keeps critical pumping and controls available during utility outages."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "What does an automatic transfer switch do?",
      "Transfers the load between normal and standby power sources",
      [
        "Changes pump discharge direction",
        "Controls wastewater pH",
        "Ventilates the generator room",
      ],
      "The transfer switch selects the approved power source and prevents unsafe parallel connection unless designed for it."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "Why should a standby generator be tested under load?",
      "To verify it can start, transfer, and carry the station's actual electrical demand",
      [
        "No-load running proves every load will operate",
        "It increases fuel shelf life indefinitely",
        "It eliminates preventive maintenance",
      ],
      "A load test reveals cooling, fuel, voltage, frequency, and capacity problems that a no-load run may miss."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "Before connecting a portable generator to station equipment, what must be confirmed?",
      "Approved connection, grounding/bonding, voltage, frequency, phase, and isolation from the utility",
      [
        "Only that the fuel tank is full",
        "That the wet well is empty",
        "That the generator is louder than the alarm",
      ],
      "Incorrect connection can damage equipment, energize utility lines, or expose workers. The engineered connection procedure governs use."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "A generator starts but frequency falls sharply as pumps come on. What is the most likely concern?",
      "The generator is overloaded or the engine cannot maintain speed",
      [
        "The discharge check valve is too quiet",
        "The wet-well pH is neutral",
        "The transfer switch is measuring flow",
      ],
      "AC frequency follows engine speed. A large drop under load signals excessive load or an engine/governor/fuel problem."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "hard",
      "A station's largest pump starts successfully on utility power but stalls the generator. What should be evaluated?",
      "Motor starting current, generator transient capacity, starting method, and load sequencing",
      [
        "Only the generator's fuel colour",
        "Whether the sewer map is at 1:500 scale",
        "Removing motor overload protection",
      ],
      "Motor starting can demand several times running current. Generator sizing and staged or reduced-voltage starting must accommodate the transient."
    ),
  ],
});

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_EQUIPMENT,
  topic: "Valves",
  expected: { easy: 3, medium: 3, hard: 2 },
  drafts: [
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "Which valve is commonly used for isolation and is intended to be fully open or fully closed?",
      "Gate valve",
      ["Check valve", "Air-release valve", "Pressure gauge"],
      "A gate valve provides low resistance when fully open and is generally used for isolation rather than throttling."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "What is the function of an air-release valve at a forcemain high point?",
      "Release accumulated air or gas that can restrict flow",
      [
        "Prevent every form of water hammer",
        "Measure electrical resistance",
        "Stop all reverse flow at the pump",
      ],
      "Air pockets collect at high points and can reduce capacity or cause unstable operation. The valve requires safe inspection and maintenance."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "Which valve prevents reverse flow automatically?",
      "Check valve",
      ["Sluice gate", "Plug valve used only for isolation", "Air-vacuum valve"],
      "A check valve responds to flow direction and closes when flow reverses."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "Why is a plug valve often used in wastewater service?",
      "Its port and wiping action can handle solids-laden flow better than some valve designs",
      [
        "It has no moving parts",
        "It is an electrical protective device",
        "It adds oxygen to wastewater",
      ],
      "Eccentric plug valves are common in wastewater because their passage and seating action suit dirty service."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "A check valve slams when a pump stops. What should be investigated?",
      "Closing characteristics, reverse velocity, pump stop sequence, and valve condition",
      [
        "Whether the valve is painted the correct colour",
        "Increasing forcemain detention time",
        "Removing the station high-level alarm",
      ],
      "Valve slam is a transient caused by reverse flow and closure dynamics. Selection, condition, and pump controls can affect it."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "What is the main operating advantage of a butterfly valve?",
      "Quarter-turn operation with compact size for larger pipes",
      [
        "It prevents backflow without an actuator",
        "It meters chemicals at laboratory rates",
        "It has zero head loss in every position",
      ],
      "Butterfly valves are compact quarter-turn valves. Their disc remains in the flow and creates some loss."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "hard",
      "An isolation valve shows fully closed on SCADA, but downstream flow continues. What is the best interpretation?",
      "Position indication may be wrong, or the valve may be obstructed or damaged and not sealing",
      [
        "SCADA proves the valve is mechanically sealed",
        "The flowmeter must be ignored",
        "Reverse the motor phases",
      ],
      "A limit switch reports actuator position, not necessarily seat integrity. Field verification under safe procedures is required."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "hard",
      "A buried valve becomes progressively harder to operate. What is the safest maintenance approach?",
      "Verify valve type and position, inspect the operator, and exercise it within approved torque limits",
      [
        "Apply unlimited torque until it moves",
        "Strike the stem while the line is pressurized",
        "Use it for throttling regardless of design",
      ],
      "Excessive force can break the stem or operator. Condition-based maintenance follows manufacturer and utility limits."
    ),
  ],
});

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_EQUIPMENT,
  topic: "Pipes, Joints & Fittings",
  expected: { easy: 2, medium: 3, hard: 1 },
  drafts: [
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "What is a common advantage of PVC gravity sewer pipe?",
      "It is corrosion resistant and has a smooth interior",
      [
        "It cannot deflect under load",
        "It requires no bedding",
        "It is unaffected by every chemical",
      ],
      "PVC resists many wastewater corrosion mechanisms and has low roughness, but installation and chemical compatibility still matter."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "What is the purpose of a flexible pipe coupling?",
      "Join compatible pipe ends while allowing limited movement or dimensional difference",
      [
        "Increase motor speed",
        "Measure pipe grade",
        "Provide atmospheric ventilation",
      ],
      "Flexible couplings can connect or repair pipes within their rated size, pressure, restraint, and material limits."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "Why must pipe bedding be properly placed and compacted?",
      "It provides uniform support and controls pipe deformation and settlement",
      [
        "It increases wastewater BOD",
        "It replaces leak testing",
        "It eliminates surface restoration",
      ],
      "Bedding transfers loads and supports the pipe. Poor support can cause deflection, joint movement, or grade problems."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "A gasketed pipe joint will not seat evenly. What should be done?",
      "Stop, clean and inspect the bell, spigot, gasket, alignment, and insertion mark",
      [
        "Apply excavator force until it seats",
        "Remove the gasket permanently",
        "Heat the joint with an open flame",
      ],
      "Debris, rolled gaskets, damage, or misalignment can cause leaks. The joint should be reassembled by the approved procedure."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "Why are restrained joints or thrust control required at some forcemain fittings?",
      "Internal pressure creates unbalanced forces at bends, tees, and closures",
      [
        "Gravity flow cannot pass a bend",
        "Restraint increases motor voltage",
        "Fittings always weigh less than straight pipe",
      ],
      "Pressure thrust can separate joints unless restrained by designed joints, anchors, or thrust blocks."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "hard",
      "A flexible gravity sewer repeatedly shows excessive ovality after backfill. What is the most likely installation issue?",
      "Inadequate side support or improper embedment compaction",
      [
        "Too much wastewater alkalinity",
        "An oversized manhole cover",
        "A low motor power factor",
      ],
      "Flexible pipe relies on soil-pipe interaction. Poor haunch support and embedment compaction allow excessive deflection."
    ),
  ],
});

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_EQUIPMENT,
  topic: "Measuring & Control Systems",
  expected: { easy: 3, medium: 4, hard: 3 },
  drafts: [
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "What does a level sensor in a wet well provide to the control system?",
      "A signal representing liquid level",
      [
        "A direct laboratory BOD result",
        "The motor insulation class",
        "The sewer pipe material",
      ],
      "The level signal is used for pump start, stop, alarm, and monitoring functions."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "What is SCADA used for at a lift station?",
      "Supervisory monitoring, data collection, alarms, and authorized remote control",
      [
        "Replacing every local protective device",
        "Physically clearing pump blockages",
        "Disinfecting the wastewater",
      ],
      "SCADA supports supervision and control, but local controls and protective devices remain essential."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "easy",
      "What does a flow totalizer display?",
      "Accumulated volume over time",
      [
        "Instantaneous pressure only",
        "Motor winding temperature only",
        "The current wet-well level only",
      ],
      "A totalizer integrates flow rate to report total volume. Instantaneous flow is a separate value."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "An ultrasonic level sensor suddenly reads maximum level while visual checks show a low wet well. What should be checked?",
      "Echo obstruction, condensation, sensor face condition, wiring, and scaling",
      [
        "Increase pump speed immediately without verification",
        "Assume the visual check is always wrong",
        "Disable the high-level alarm permanently",
      ],
      "False ultrasonic readings can result from blocked sound paths, foam, condensation, configuration, or signal faults. Safe independent verification is needed."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "Why is a magnetic flowmeter suitable for wastewater?",
      "It has no primary obstruction and measures conductive liquid velocity",
      [
        "It measures any gas without a full pipe",
        "It requires a nonconductive liquid",
        "It produces flow by rotating an impeller",
      ],
      "Magnetic meters use Faraday's law and need a conductive, adequately filled pipe. Their open bore suits solids-bearing flows."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "A high-level float operates locally but no SCADA alarm appears. Where is the fault most likely?",
      "In the alarm input, wiring, RTU/PLC logic, communications, or SCADA configuration",
      [
        "In the gravity sewer slope only",
        "In the discharge check valve seat only",
        "In the wastewater pH",
      ],
      "The sensing device works locally, so the failed path is downstream in signal transmission or alarm processing."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "medium",
      "Why are instrument calibration records important?",
      "They demonstrate measurement reliability and show drift or recurring problems",
      [
        "They replace field calibration",
        "They guarantee the process never changes",
        "They are needed only when an instrument fails",
      ],
      "Traceable records support maintenance, compliance, and data interpretation. Calibration still must be performed at required intervals."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "hard",
      "A flowmeter reports stable flow while wet-well drawdown indicates a value 30% lower. What is the best response?",
      "Verify both methods, meter zero and scaling, pipe-full condition, wet-well geometry, influent flow, and time-volume measurements",
      [
        "Average the two values without investigation",
        "Change the meter range until they match",
        "Ignore drawdown because it is not electronic",
      ],
      "A material discrepancy requires independent verification and review of assumptions. Drawdown-based pump flow must account for wet-well geometry, elapsed time, and influent flow during the test; a flowmeter also requires correct zero, scaling, and full-pipe conditions."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "hard",
      "Intermittent communication loss causes pumps to stop even though local level controls are healthy. What control-design principle should be reviewed?",
      "The station should fail safely and retain appropriate local automatic control on communication loss",
      [
        "Every pump should depend entirely on the remote screen",
        "High-level alarms should be disabled during outages",
        "The wet well should be allowed to overflow before local control acts",
      ],
      "Critical pumping should not be made unsafe by loss of supervisory communications. Local protection and defined fail states are required."
    ),
    d(
      COLLECTION_EQUIPMENT,
      "hard",
      "A pressure transmitter reads correctly at zero but increasingly low at higher pressure. What is the likely calibration issue?",
      "A span error",
      ["A zero offset only", "A reversed motor phase", "A sewer-grade error"],
      "A span error changes the slope of the measurement response, causing error that grows across the range. A zero error is a more constant offset."
    ),
  ],
});

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_RESTORE,
  topic: "Pressure Sewers & Forcemains",
  expected: { easy: 3, medium: 3, hard: 2 },
  drafts: [
    d(
      COLLECTION_RESTORE,
      "easy",
      "What is the purpose of a high-level alarm at a grinder-pump pressure-sewer service?",
      "Warn the occupant or operator that the tank level is high or the pump may not be operating correctly",
      [
        "Confirm that the wastewater is disinfected to drinking-water standards",
        "Measure sewer-gas concentration at every property connection",
        "Replace the need for preventive pump maintenance",
      ],
      "A high-level alarm gives early warning of pump, power, or control problems so the issue can be addressed before sewage backs up. It does not replace maintenance or correct the fault itself."
    ),
    d(
      COLLECTION_RESTORE,
      "easy",
      "In a STEP system, what normally enters the pressure sewer?",
      "Septic-tank effluent pumped from the property",
      [
        "Unscreened stormwater only",
        "Dry solids from the septic tank",
        "Potable water from the service line",
      ],
      "A septic tank retains settleable solids, and a pump sends the clarified effluent to the pressure sewer."
    ),
    d(
      COLLECTION_RESTORE,
      "easy",
      "Why are air-release or combination air valves installed at forcemain high points?",
      "To manage trapped air or gas and admit air when required by design",
      [
        "To prevent every pipe blockage",
        "To chlorinate wastewater",
        "To replace isolation valves",
      ],
      "Air pockets can reduce capacity and cause surging, while vacuum conditions may require controlled air admission."
    ),
    d(
      COLLECTION_RESTORE,
      "medium",
      "A grinder-pump alarm sounds at one property while neighbouring units operate normally. What should be checked first?",
      "The local basin level, power, controls, pump, and discharge isolation",
      [
        "The entire treatment plant immediately",
        "The city's potable-water chlorine dose",
        "The road traffic-control plan only",
      ],
      "A single-property alarm points first to its local unit and service connection. The response follows electrical, confined-space, and wastewater safety procedures."
    ),
    d(
      COLLECTION_RESTORE,
      "medium",
      "Why can long retention in a forcemain increase odour at the discharge?",
      "Anaerobic conditions can develop and generate sulfide",
      [
        "Pressure always adds dissolved oxygen",
        "All microorganisms die in a full pipe",
        "The pipe converts sulfide into chlorine",
      ],
      "Extended detention without oxygen promotes septic conditions and H₂S formation."
    ),
    d(
      COLLECTION_RESTORE,
      "medium",
      "A forcemain pressure rises steadily while pump speed is unchanged and flow falls. What condition is most likely?",
      "A developing restriction, closed valve, or air blockage",
      [
        "The pipe is becoming larger",
        "Static head has disappeared",
        "The motor is producing no torque",
      ],
      "Higher required head with lower flow indicates increased system resistance. The pressure indication should also be verified."
    ),
    d(
      COLLECTION_RESTORE,
      "hard",
      "A forcemain repeatedly fails near the same high point. Which investigation best addresses root cause?",
      "Review pressure transients, air-valve performance, restraint, pipe condition, and operating sequence",
      [
        "Patch the pipe each time without recording conditions",
        "Remove all high-level alarms",
        "Run the pump continuously at shutoff",
      ],
      "Repeated location-specific failure can involve trapped air, surge, inadequate restraint, or weakened pipe. Repair without causal analysis invites recurrence."
    ),
    d(
      COLLECTION_RESTORE,
      "hard",
      "A pressure-sewer area experiences low-flow periods and frequent odour complaints. Which response is most defensible?",
      "Measure detention and sulfide conditions, then optimize cycling, flushing, or validated chemical control",
      [
        "Add chemical at an unverified dose",
        "Increase detention time",
        "Seal every vent without review",
      ],
      "Monitoring establishes the mechanism and supports a targeted control. Unverified dosing or sealing can create new hazards."
    ),
  ],
});

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_RESTORE,
  topic: "Infiltration/Inflow Detection",
  expected: { easy: 3, medium: 4, hard: 3 },
  drafts: [
    d(
      COLLECTION_RESTORE,
      "easy",
      "What is infiltration in a sanitary sewer?",
      "Groundwater entering through defective pipes, joints, manholes, or connections",
      [
        "Rainwater entering directly through a roof leader",
        "Wastewater leaving a service lateral",
        "Potable water intentionally used for flushing",
      ],
      "Infiltration is groundwater leakage into the system. Inflow is more direct stormwater entry."
    ),
    d(
      COLLECTION_RESTORE,
      "easy",
      "Which source is an example of inflow?",
      "A roof downspout connected to a sanitary sewer",
      [
        "Groundwater leaking through a cracked pipe",
        "Slow seepage through a manhole barrel",
        "Groundwater entering at a defective joint",
      ],
      "A connected downspout can deliver rainfall runoff directly and rapidly, making it inflow."
    ),
    d(
      COLLECTION_RESTORE,
      "easy",
      "What is smoke testing used to locate?",
      "Connections and openings through which smoke can travel from the sewer",
      [
        "Every submerged crack below groundwater",
        "Pipe wall thickness",
        "Wastewater BOD",
      ],
      "Smoke testing is effective for direct openings and inflow connections, but may not reveal submerged infiltration defects."
    ),
    d(
      COLLECTION_RESTORE,
      "medium",
      "Night-time dry-weather flow remains high after a long rain-free period. What does this suggest?",
      "Groundwater infiltration or a continuous non-domestic discharge",
      [
        "Only roof-leader inflow",
        "A flowmeter must be accurate",
        "A completely dry sewer",
      ],
      "Sustained base flow during dry weather can indicate groundwater infiltration or a continuous source. Field investigation must distinguish them."
    ),
    d(
      COLLECTION_RESTORE,
      "medium",
      "What is the purpose of dye testing during an I/I investigation?",
      "Trace whether water from a suspected source reaches the sanitary sewer",
      [
        "Measure pipe wall strength",
        "Calibrate a combustible-gas sensor",
        "Determine motor phase rotation",
      ],
      "A controlled, documented dye test can confirm a hydraulic connection. The dye and method must be approved."
    ),
    d(
      COLLECTION_RESTORE,
      "medium",
      "Why are temporary flowmeters placed in multiple sewer subcatchments during wet weather?",
      "To compare rainfall response and prioritize areas contributing excess flow",
      [
        "To increase sewer capacity",
        "To stop infiltration mechanically",
        "To disinfect the collection system",
      ],
      "Distributed monitoring shows which areas respond most strongly to rainfall and guides targeted investigation."
    ),
    d(
      COLLECTION_RESTORE,
      "medium",
      "CCTV reveals mineral deposits at several joints but no active flow during dry weather. What should the operator infer?",
      "The joints may experience intermittent groundwater infiltration and need correlation with wet conditions",
      [
        "The deposits prove direct roof inflow",
        "The sewer has never leaked",
        "The camera automatically seals the joints",
      ],
      "Mineral staining can be evidence of past infiltration even when leakage is not visible during inspection."
    ),
    d(
      COLLECTION_RESTORE,
      "hard",
      "A basin's flow rises within minutes of rainfall and falls soon after rain ends. Which source pattern is most likely?",
      "Rapid inflow from direct storm connections or open covers",
      [
        "Only deep groundwater infiltration",
        "Normal sanitary diurnal flow",
        "A pump efficiency increase",
      ],
      "A fast rainfall response is characteristic of inflow. Infiltration often has a slower and more sustained response."
    ),
    d(
      COLLECTION_RESTORE,
      "hard",
      "After several laterals are lined, wet-weather flow changes little. What is the best next step?",
      "Reassess the I/I source model and investigate public mains, manholes, and unrehabilitated connections",
      [
        "Assume lining never reduces I/I",
        "Line every pipe without further monitoring",
        "Delete the pre-repair flow data",
      ],
      "Post-repair monitoring tests whether the intervention addressed the dominant sources. Limited change indicates other sources or incorrect assumptions."
    ),
    d(
      COLLECTION_RESTORE,
      "hard",
      "Two flow sites show the same peak rate, but one serves half the area. Which comparison is most useful for prioritization?",
      "Normalize flow by contributing area, population, or sewer length and compare rainfall response",
      [
        "Rank only by raw peak flow",
        "Choose the site with the newer meter",
        "Ignore antecedent groundwater conditions",
      ],
      "Normalized indicators and rainfall context make catchments of different sizes comparable. Raw peaks alone can mislead."
    ),
  ],
});

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_RESTORE,
  topic: "Physical Inspection — TV/CCTV",
  expected: { easy: 2, medium: 4, hard: 2 },
  drafts: [
    d(
      COLLECTION_RESTORE,
      "easy",
      "Why is a sewer normally cleaned before a detailed CCTV inspection?",
      "To remove deposits that obscure the pipe wall and defects",
      [
        "To increase camera battery voltage",
        "To change pipe material",
        "To eliminate the need for coding",
      ],
      "Cleaning improves visibility and allows the camera to travel. The pre-cleaning condition should still be documented when relevant."
    ),
    d(
      COLLECTION_RESTORE,
      "easy",
      "What should a CCTV operator record at the start of a run?",
      "Pipe reach, direction, date, location, and distance reference",
      [
        "Only the operator's first name",
        "The treatment-plant chlorine dose",
        "The nearest motor's winding resistance",
      ],
      "Reliable identification and distance referencing make observations usable for maintenance and comparison."
    ),
    d(
      COLLECTION_RESTORE,
      "medium",
      "The camera lens becomes smeared and defects are no longer clear. What should be done?",
      "Stop and clean or correct the camera before continuing the inspection",
      [
        "Code every blurred area as a collapse",
        "Increase crawler speed",
        "Estimate defects from the audio track",
      ],
      "Defect coding requires adequate visibility. Continuing with poor imagery produces unreliable records."
    ),
    d(
      COLLECTION_RESTORE,
      "medium",
      "Why should the camera remain centred and oriented during inspection?",
      "It improves defect location, size interpretation, and consistent coding",
      [
        "It increases sewer grade",
        "It seals open joints",
        "It prevents all crawler traction problems",
      ],
      "Stable orientation and centring reduce perspective errors and help locate defects consistently."
    ),
    d(
      COLLECTION_RESTORE,
      "medium",
      "A protruding lateral blocks part of the sewer cross-section. How should it be documented?",
      "Record its clock position, distance, degree of intrusion, and image",
      [
        "Record only the property address",
        "Describe it as infiltration without evidence",
        "Omit it if flow can pass",
      ],
      "Standardized location and severity data support repair decisions and future comparison."
    ),
    d(
      COLLECTION_RESTORE,
      "medium",
      "Why should CCTV observations use a standardized defect-coding system?",
      "To make condition data consistent and comparable between inspectors and surveys",
      [
        "To guarantee every repair priority automatically",
        "To replace engineering judgment",
        "To increase camera resolution",
      ],
      "Standard codes improve repeatability, while engineering and operational context still determine priority."
    ),
    d(
      COLLECTION_RESTORE,
      "hard",
      "A CCTV survey shows a deformation that appears severe only when the crawler tilts. What is the best response?",
      "Re-centre or re-run the camera and verify the defect before assigning severity",
      [
        "Code a collapse immediately",
        "Ignore all deformation findings",
        "Measure ovality from a single tilted frame",
      ],
      "Perspective and camera position can exaggerate deformation. A verified view or suitable measurement is required."
    ),
    d(
      COLLECTION_RESTORE,
      "hard",
      "Recurring blockage occurs, but CCTV after cleaning shows no obvious defect. What should be reviewed next?",
      "Pre-cleaning debris, grade, flow conditions, lateral inputs, cleaning records, and inspection timing",
      [
        "Assume the complaint is false",
        "Increase jet pressure without limit",
        "Replace the nearest manhole cover",
      ],
      "Post-cleaning CCTV may remove evidence of the cause. Combining operational history and hydraulic context can reveal grease, sags, roots, or improper discharges."
    ),
  ],
});

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_RESTORE,
  topic: "Chemical Addition",
  expected: { easy: 2, medium: 2, hard: 1 },
  drafts: [
    d(
      COLLECTION_RESTORE,
      "easy",
      "Why must a root-control chemical be applied according to its approved label and procedure?",
      "To achieve control while protecting workers, the system, treatment processes, and the environment",
      [
        "Any concentration is safe below ground",
        "More chemical always produces a better result",
        "The label applies only to storage",
      ],
      "The approved use defines dose, contact, PPE, and environmental restrictions. Overapplication can cause harm."
    ),
    d(
      COLLECTION_RESTORE,
      "easy",
      "What is the purpose of an odour-control chemical in a collection system?",
      "Prevent sulfide formation, remove sulfide, or limit its release by a defined mechanism",
      [
        "Increase pipe diameter",
        "Replace ventilation in every case",
        "Raise motor efficiency",
      ],
      "Odour-control products work through specific chemical or biological mechanisms and require validated dosing."
    ),
    d(
      COLLECTION_RESTORE,
      "medium",
      "A grease-control product is being considered for a blockage-prone sewer. What should be established before routine use?",
      "The blockage cause, product compatibility, dosing basis, effectiveness, and downstream impacts",
      [
        "Only the product fragrance",
        "Whether it changes the sewer map colour",
        "That it can be poured at any concentration",
      ],
      "Chemical or biological additives should solve a verified cause without harming infrastructure or treatment."
    ),
    d(
      COLLECTION_RESTORE,
      "medium",
      "Why must rodent-control bait be secured and documented in a sewer program?",
      "To control access, prevent unintended exposure, and track placement and retrieval",
      [
        "To increase wastewater flow",
        "To dissolve pipe deposits",
        "To calibrate level sensors",
      ],
      "Controlled placement and records protect workers, the public, and non-target animals and support legal use."
    ),
    d(
      COLLECTION_RESTORE,
      "hard",
      "Sulfide readings remain high after a chemical-feed increase. What is the best response?",
      "Verify sampling, pump calibration, dose delivery, demand, mixing, detention, and the selected chemical mechanism",
      [
        "Continue increasing dose without a limit",
        "Disable the H₂S monitor",
        "Lower pH to release more H₂S",
      ],
      "Poor performance can result from bad data, feed failure, inadequate dose or mixing, or an unsuitable strategy. Systematic verification is safer than uncontrolled dosing."
    ),
  ],
});

addBatch({
  bankKey: "class1-wastewater-coll",
  module: COLLECTION_RESTORE,
  topic: "Construction Inspection",
  expected: { easy: 1, medium: 2, hard: 1 },
  drafts: [
    d(
      COLLECTION_RESTORE,
      "easy",
      "What does a mandrel test assess in a flexible gravity sewer?",
      "Whether pipe deflection exceeds the allowable limit",
      [
        "The wastewater pH",
        "Motor phase balance",
        "Manhole atmospheric safety",
      ],
      "A properly sized mandrel verifies that the pipe bore has not deformed beyond the acceptance criterion."
    ),
    d(
      COLLECTION_RESTORE,
      "medium",
      "A new sewer fails a low-pressure air test. What should happen next?",
      "Locate and correct leakage, then repeat the approved test",
      [
        "Accept it because the pipe is new",
        "Increase pressure beyond the test standard",
        "Cover the remaining joints before investigation",
      ],
      "Failure indicates unacceptable leakage or a test setup problem. Both must be resolved using the specified procedure."
    ),
    d(
      COLLECTION_RESTORE,
      "medium",
      "Why are pipe grade and invert elevations checked during installation?",
      "To confirm gravity flow, cover, and connections match the approved design",
      [
        "To determine motor voltage",
        "To set H₂S alarm limits",
        "To eliminate acceptance testing",
      ],
      "Incorrect grade or elevations can create sags, poor flow, and connection conflicts that are difficult to repair after backfill."
    ),
    d(
      COLLECTION_RESTORE,
      "hard",
      "A newly installed sewer passes leakage testing but CCTV shows a persistent sag holding water. What is the appropriate conclusion?",
      "Leak tightness does not prove acceptable grade; the sag must be assessed against specifications",
      [
        "The sewer is acceptable because it does not leak",
        "The camera creates the standing water",
        "The sag will always disappear after commissioning",
      ],
      "Acceptance criteria address multiple requirements. A pipe can be watertight yet fail grade or deformation requirements."
    ),
  ],
});

addBatch({
  bankKey: "class1-water-dist",
  module: DISTRIBUTION_GENERAL,
  topic: "Safety Procedures",
  expected: { easy: 10, medium: 15, hard: 10 },
  drafts: [
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What is the first atmospheric condition normally checked before entering a confined space?",
      "Oxygen concentration",
      ["Water hardness", "Pipe pressure", "Motor speed"],
      "Oxygen is tested first because low or enriched oxygen affects both life safety and the performance of some combustible-gas readings. Toxic and combustible hazards are then tested as required."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What is the purpose of lockout/tagout?",
      "Prevent unexpected energization or release of hazardous energy during work",
      [
        "Increase system pressure",
        "Identify water samples",
        "Record customer complaints",
      ],
      "Lockout/tagout isolates and controls electrical, hydraulic, pneumatic, mechanical, and other hazardous energy."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "Why is a trench protective system used?",
      "Protect workers from cave-ins",
      ["Increase pipe flow", "Prevent chlorine decay", "Locate buried valves"],
      "Cave-ins can occur suddenly and are often fatal. Sloping, shoring, or shielding is selected under the applicable excavation procedure."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What is the main purpose of traffic-control signs and devices at a watermain repair?",
      "Guide road users safely around the work zone and protect workers",
      [
        "Increase hydrant flow",
        "Measure trench depth",
        "Disinfect repair fittings",
      ],
      "A planned work zone provides advance warning, channelization, and safe separation for workers, motorists, cyclists, and pedestrians."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "Before using a portable electrical tool in a wet location, what should be confirmed?",
      "The tool, supply, grounding or double insulation, and GFCI protection are suitable",
      [
        "The watermain is PVC",
        "The nearest hydrant is red",
        "The sample bottle is sterile",
      ],
      "Wet conditions increase shock risk. Equipment and protective devices must be rated, inspected, and used according to procedure."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "Why should suspended loads never pass over workers?",
      "A dropped or shifted load can cause crushing or fatal injury",
      [
        "The load changes water pH",
        "It causes pipe corrosion",
        "It reduces chlorine residual",
      ],
      "Workers must stay clear of suspended loads and the fall zone because rigging or lifting equipment can fail."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What does an SDS provide?",
      "Hazard, handling, storage, exposure-control, and emergency information for a product",
      [
        "Watermain invert elevations",
        "Pump performance curves only",
        "Customer billing records",
      ],
      "A safety data sheet communicates chemical hazards and controls. Site procedures and labels must also be followed."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What is the purpose of a tailboard or pre-job safety meeting?",
      "Review the work, hazards, controls, roles, and emergency plan before starting",
      [
        "Replace the written procedure",
        "Approve unplanned scope changes automatically",
        "Set chlorine dose without testing",
      ],
      "A pre-job review ensures the crew shares the same plan and understands changing conditions."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "Why must an excavation be inspected after heavy rain?",
      "Rain can weaken soil and change water, access, and protective-system conditions",
      [
        "Rain always compacts the trench safely",
        "Inspection is required only for concrete pipe",
        "Water eliminates cave-in risk",
      ],
      "Rainfall and water accumulation can reduce stability. A competent inspection is needed before work resumes."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What is the safest lifting principle for a heavy valve box cover?",
      "Use a suitable tool or mechanical aid and avoid awkward manual lifting",
      [
        "Lift quickly with a twisted back",
        "Stand over the opening while pulling",
        "Use damaged hooks if the cover is stuck",
      ],
      "Mechanical assistance and neutral posture reduce strain and pinch injuries. The opening must also be controlled."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A trench is 1.8 m deep and soil begins sloughing from one wall. What should the crew do?",
      "Exit the trench and have the protective system and soil conditions reassessed",
      [
        "Continue while one person watches",
        "Work faster before more soil falls",
        "Remove the access ladder",
      ],
      "Sloughing signals instability. Workers leave the hazard area until a competent person establishes safe conditions."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A valve chamber has a permit-space label, but its cover has been open all morning. Can a worker enter without the confined-space procedure?",
      "No; opening the cover does not remove the classification or documented hazards",
      [
        "Yes, because natural ventilation guarantees safety",
        "Yes, if entry lasts under five minutes",
        "Yes, if no odour is present",
      ],
      "Atmospheres can change and odour is unreliable. Required assessment, testing, ventilation, attendant, rescue, and permit controls still apply."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "During a main repair, a backhoe must swing near overhead power lines. What is the correct control?",
      "Establish required clearance and use the approved electrical-hazard and spotter plan",
      [
        "Rely on the operator's depth perception alone",
        "Touch the line with the bucket to confirm height",
        "Ground the watermain instead of controlling clearance",
      ],
      "Equipment contact or arcing can be fatal. Minimum approach distances and utility-specific controls are required."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A crew finds an unmarked utility crossing the excavation. What should happen?",
      "Stop work, protect the area, and have the utility identified and the locate resolved",
      [
        "Move it with the excavator",
        "Assume it is abandoned",
        "Cut it if it is smaller than the watermain",
      ],
      "Unknown services may be energized, pressurized, or critical. Work cannot continue until ownership and safe handling are established."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why must stored hydraulic pressure be relieved before repairing a valve actuator?",
      "Isolation alone may leave energy capable of moving parts unexpectedly",
      [
        "Pressure improves lockout",
        "Stored energy exists only in electrical circuits",
        "Relieving pressure sterilizes the valve",
      ],
      "Hydraulic accumulators, trapped water, springs, and gravity can retain hazardous energy after the power source is isolated."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A worker is using a cut-off saw on old pipe that may contain hazardous material. What is the correct approach?",
      "Identify the material and use the approved cutting, dust-control, PPE, and disposal procedure",
      [
        "Dry-cut it immediately",
        "Judge material only by colour",
        "Use compressed air to spread dust",
      ],
      "Material identification is essential because asbestos-cement and other materials require specific controls."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "What should be done when water begins accumulating in an occupied trench?",
      "Stop work and control the water and stability hazards before re-entry",
      [
        "Use the water as a trench shield",
        "Remove shoring to improve drainage",
        "Continue if boots are waterproof",
      ],
      "Water can undermine soil and protective systems and create slips, drowning, or electrical hazards."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A traffic-control setup no longer matches traffic after a lane closure changes. What is required?",
      "Reassess and modify the plan and devices before continuing work",
      [
        "Leave it because it was correct at the start",
        "Remove advance-warning signs",
        "Ask workers to direct vehicles without training",
      ],
      "Work-zone controls must reflect actual geometry, traffic, visibility, and pedestrian needs throughout the job."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why is a retrieval system used for some vertical confined-space entries?",
      "It can permit non-entry rescue when compatible with the space and hazards",
      [
        "It replaces atmospheric testing",
        "It allows the attendant to leave",
        "It guarantees rescue through every obstruction",
      ],
      "Non-entry retrieval reduces rescuer exposure but must be suitable for the opening, worker, and internal configuration."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A chlorine-based disinfectant splashes on a worker's skin. What should guide the immediate response?",
      "The product label, SDS, site emergency procedure, and prompt decontamination",
      [
        "Wait for a supervisor before rinsing",
        "Apply another chemical to neutralize it",
        "Cover the chemical with grease",
      ],
      "Prompt flushing or other specified first aid reduces exposure; unapproved neutralization can worsen injury."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A worker must enter a chamber while nearby pumps can change water level. What energy control is required?",
      "Isolate or otherwise control flows and equipment that could engulf or endanger the entrant",
      [
        "Monitor only the pump sound",
        "Leave the pumps on automatic",
        "Rely on the entrant to climb out",
      ],
      "Engulfment and unexpected flow are confined-space hazards that require positive control under the entry plan."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why should excavation spoil be kept back from the trench edge?",
      "It reduces surcharge loading and prevents material falling onto workers",
      [
        "It increases soil moisture",
        "It locates the watermain",
        "It supports the trench wall",
      ],
      "Spoil adds load to the edge and can roll or slide into the excavation. Required setback is maintained."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A portable ladder is the trench access. What must be checked?",
      "It is secured, extends appropriately, is undamaged, and is positioned for ready egress",
      [
        "It is painted the utility colour",
        "It rests on the watermain",
        "It is removed while workers are below",
      ],
      "Safe access must remain available and cannot introduce a fall or collapse hazard."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "What is the purpose of a GFCI in a temporary power circuit?",
      "Interrupt power rapidly when leakage current indicates a ground fault",
      [
        "Regulate pump flow",
        "Increase circuit voltage",
        "Replace equipment grounding",
      ],
      "A GFCI reduces shock exposure by sensing current imbalance. It complements, not replaces, suitable equipment and grounding."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A worker reports dizziness near an open valve chamber. What should the crew do?",
      "Move to fresh air, restrict access, seek assistance, and test the atmosphere under the emergency procedure",
      [
        "Send another worker in to investigate without protection",
        "Assume heat is the only cause",
        "Lower a household smoke detector into the space",
      ],
      "Symptoms can signal atmospheric exposure. Unprotected rescue attempts can create additional victims."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A trench shield is in place, but a worker is standing between the shield and trench wall. Why is this unsafe?",
      "The shield protects only workers located inside its protected area",
      [
        "The shield makes the soil heavier",
        "The worker is too close to the pipe",
        "The space outside is safer during a collapse",
      ],
      "A trench box does not prevent a cave-in; it provides a survival zone inside the shield."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "Atmospheric readings are acceptable at the top of a chamber but hazardous near the bottom. What should change?",
      "Treat the space as hazardous and test and ventilate all representative levels before and during entry",
      [
        "Use only the top reading",
        "Average the readings",
        "Enter while holding the meter above the worker",
      ],
      "Gases stratify by density and airflow. Testing must cover the worker's breathing zone and all levels they may occupy."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A main break undermines pavement beside the excavation. What is the best immediate decision?",
      "Expand the exclusion zone and have excavation, traffic, and structural conditions reassessed",
      [
        "Park heavy equipment on the undermined pavement",
        "Let pedestrians cross one at a time",
        "Cover the void with loose soil",
      ],
      "Undermined surfaces can collapse under people, vehicles, or equipment. The hazard area must be isolated and stabilized."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A crew must isolate a watermain, but a closed valve may leak past its seat. How should hazardous pressure be controlled?",
      "Verify zero energy, drain or bleed pressure, and use additional isolation or engineered controls as required",
      [
        "Treat valve position as proof of isolation",
        "Loosen a fitting to test pressure",
        "Rely on SCADA colour alone",
      ],
      "Valve position does not prove pressure is absent. Isolation must be verified and residual pressure safely controlled."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A rescue plan says to call emergency services but provides no access information or retrieval method. What is missing?",
      "A site-specific, feasible rescue arrangement matched to the space and response time",
      [
        "A larger entry permit font",
        "A water sample result",
        "A spare traffic cone",
      ],
      "A rescue plan must be executable, timely, and coordinated; merely naming a phone number is not sufficient."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "An excavation crosses variable soils and an old backfilled utility cut. Why is one protective slope angle not automatically adequate?",
      "The least stable soil and disturbed zones may require a different engineered or tabulated system",
      [
        "Backfill is always stronger than native soil",
        "Slope rules apply only above watermains",
        "Soil type cannot change across a site",
      ],
      "Disturbed and layered soil can behave differently. A competent assessment governs protective-system selection."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A crew plans hot work in a chamber that previously contained flammable vapour. What is required before work?",
      "Hazard isolation, cleaning or ventilation, gas testing, permit controls, fire watch, and approved rescue planning",
      [
        "One acceptable reading taken the day before",
        "Only hearing protection",
        "Opening the cover without further testing",
      ],
      "Hot work adds an ignition source. Conditions must be controlled and continuously verified under both hot-work and confined-space procedures."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A chlorine leak is suspected in a small pump building. What is the safest first action for an unprotected operator outside?",
      "Stay out, isolate the area, raise the alarm, and use the emergency response plan",
      [
        "Enter briefly to confirm the odour",
        "Turn on an unverified electrical fan from inside",
        "Hold breath and close the cylinder",
      ],
      "Entry into a potentially toxic atmosphere requires trained responders and appropriate protection. Unprotected investigation risks incapacitation."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A machine guard must be removed for alignment. What conditions are required before hands enter the danger zone?",
      "Complete hazardous-energy isolation and verify zero energy before removing the guard",
      [
        "Press the stop button only",
        "Ask a coworker to watch the switch",
        "Run the motor slowly",
      ],
      "A stop command is not energy isolation. Lockout and verification prevent unexpected movement."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A work zone provides a path for cars but forces pedestrians into live traffic. What must be corrected?",
      "Provide an accessible, protected pedestrian route consistent with the traffic-control plan",
      [
        "Tell pedestrians to wait until the repair ends",
        "Remove pedestrian signs",
        "Let workers escort people through the excavation",
      ],
      "Traffic control must address all road users, including pedestrians and accessibility needs, without directing them into hazards."
    ),
  ],
});

addBatch({
  bankKey: "class1-water-dist",
  module: DISTRIBUTION_GENERAL,
  topic: "Safety Equipment",
  expected: { easy: 5, medium: 7, hard: 3 },
  drafts: [
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What PPE primarily protects the eyes from flying particles?",
      "Safety glasses or goggles selected for the hazard",
      ["Hearing protectors", "High-visibility vest", "Steel-toe boots"],
      "Eye protection is selected for impact, splash, or dust hazards. Other PPE protects different body areas."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What does a four-gas meter commonly measure?",
      "Oxygen, combustible gas, and selected toxic gases",
      [
        "Flow, pressure, pH, and turbidity",
        "Voltage, current, resistance, and power",
        "Chlorine residual, hardness, iron, and manganese",
      ],
      "Common meters measure oxygen, percent LEL, carbon monoxide, and hydrogen sulfide, subject to sensor configuration."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "Why is high-visibility apparel worn in road work?",
      "Make workers more conspicuous to equipment operators and road users",
      [
        "Provide chemical splash protection",
        "Replace traffic-control devices",
        "Prevent hearing damage",
      ],
      "Visibility garments improve recognition but do not replace barriers, spotters, or the work-zone plan."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What is the purpose of a hard hat?",
      "Protect the head from specified impact and penetration hazards",
      [
        "Provide respiratory protection",
        "Measure trench atmosphere",
        "Insulate against every voltage",
      ],
      "Head protection must be of the correct class and condition for the hazard. It has defined, not unlimited, protection."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "When is hearing protection required?",
      "When noise exposure cannot be reduced sufficiently by higher-level controls",
      [
        "Whenever a worker wears gloves",
        "Only after hearing loss occurs",
        "Only in confined spaces",
      ],
      "Engineering and administrative controls come first where practicable; suitable hearing protection completes the program."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A gas detector has passed calibration but fails its bump test. Can it be used?",
      "No; remove it from service until it is corrected and verified",
      [
        "Yes, calibration makes the bump test optional",
        "Yes, if the display reads zero",
        "Yes, for entries under ten minutes",
      ],
      "A bump test confirms sensor response, alarms, and flow path. Failure means the instrument cannot be trusted."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why must a respirator user be fit-tested?",
      "To confirm the selected facepiece can seal adequately to that individual",
      [
        "To measure lung capacity for all work",
        "To eliminate cartridge change schedules",
        "To replace medical evaluation",
      ],
      "Fit testing verifies the model and size; medical assessment, training, inspection, and correct filters are also required."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A worker's safety glasses fog during a critical cut. What is the proper response?",
      "Stop safely and correct visibility using suitable anti-fog or ventilation measures",
      [
        "Remove eye protection while cutting",
        "Continue by feel",
        "Stand closer to the blade",
      ],
      "Impaired vision and absent PPE are both hazards. Work pauses until suitable protection and visibility are restored."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "What should be checked before using a fall-arrest harness?",
      "Webbing, stitching, hardware, labels, fit, compatibility, and inspection status",
      [
        "Only the colour",
        "Only the worker's height",
        "Whether it has been exposed to wastewater",
      ],
      "A complete pre-use inspection and correct fit are needed; damaged or involved-in-a-fall equipment is removed from service."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why are gloves selected by task rather than using one pair for all work?",
      "Materials differ in resistance to cuts, chemicals, heat, puncture, and dexterity needs",
      [
        "Glove colour determines voltage",
        "All glove materials offer equal protection",
        "Thicker gloves always eliminate every hazard",
      ],
      "No glove protects against all hazards. Selection uses the chemical data and mechanical task."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "What is the purpose of a barricade around an open chamber?",
      "Prevent people and vehicles from entering the fall and work hazard area",
      [
        "Ventilate the chamber",
        "Support the chamber walls",
        "Disinfect the ladder",
      ],
      "Barricades define and protect the hazard zone; they must suit the traffic and fall exposure."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A fire extinguisher gauge is in the operable range, but the hose is cracked. What should be done?",
      "Remove it from service and replace or service it",
      [
        "Use it because pressure is acceptable",
        "Tape the hose and return it",
        "Discharge it into the chamber",
      ],
      "Extinguisher readiness includes the cylinder, pin, hose, nozzle, inspection, and correct type—not only pressure."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A gas detector is calibrated with the wrong cylinder concentration entered in its settings. What is the risk?",
      "The displayed values and alarm response may be systematically inaccurate",
      [
        "Only battery life is affected",
        "The meter becomes intrinsically safe",
        "Oxygen readings become unnecessary",
      ],
      "Calibration establishes the sensor response against a known concentration. An incorrect reference creates false confidence."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A worker needs respiratory protection for an atmosphere immediately dangerous to life or health. Which equipment principle applies?",
      "Use positive-pressure supplied-air or SCBA protection specified for IDLH response",
      [
        "Use a disposable dust mask",
        "Use any air-purifying cartridge",
        "Hold a wet cloth over the face",
      ],
      "Air-purifying respirators do not provide oxygen or adequate IDLH protection. Only trained responders with suitable equipment should enter."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A fall-arrest anchor is convenient but its capacity and design are unknown. Can it be used?",
      "No; use only an approved anchor and complete rescue-compatible fall protection plan",
      [
        "Yes, if two workers test it by pulling",
        "Yes, for short tasks",
        "Yes, if the lanyard is new",
      ],
      "Anchor suitability cannot be guessed. The whole system, clearance, swing-fall, and rescue conditions must be verified."
    ),
  ],
});

addBatch({
  bankKey: "class1-water-dist",
  module: DISTRIBUTION_GENERAL,
  topic: "Hydraulic Concepts",
  expected: { easy: 7, medium: 12, hard: 6 },
  drafts: [
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What does water pressure represent?",
      "Force exerted per unit area",
      [
        "Volume passing per unit time",
        "Pipe length per unit mass",
        "Chlorine consumed per day",
      ],
      "Pressure is force divided by area and is commonly reported as kilopascals or psi."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What is static pressure in a distribution main?",
      "Pressure measured when water is not flowing at the test point",
      [
        "Pressure lost through fittings while flowing",
        "The minimum fire-flow rate",
        "The velocity head at maximum demand",
      ],
      "Static pressure reflects elevation and system energy without local flow losses at the measurement point."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "Why does pressure generally decrease at a higher elevation in the same pressure zone?",
      "More pressure head is used to reach the higher elevation",
      [
        "Water becomes less dense enough to stop flow",
        "Pipe roughness disappears",
        "Chlorine residual creates pressure",
      ],
      "Elevation head and pressure head trade within the system energy balance. Roughly 9.81 kPa corresponds to one metre of water head."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What is head loss?",
      "A reduction in hydraulic energy caused by pipe and fitting resistance",
      [
        "The elevation of a reservoir",
        "The diameter of a hydrant outlet",
        "The total chlorine residual",
      ],
      "Friction and local disturbances dissipate hydraulic energy, commonly expressed as metres of head."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What normally happens to velocity when the same flow enters a smaller-diameter pipe?",
      "Velocity increases",
      [
        "Velocity becomes zero",
        "Velocity decreases",
        "Pressure and velocity become identical units",
      ],
      "For a fixed flow, velocity equals flow divided by area. Smaller area produces higher velocity."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What does a pump curve show?",
      "The relationship between pump head and flow at stated operating conditions",
      [
        "Only the pipe material",
        "The daily chlorine sample schedule",
        "The excavation soil type",
      ],
      "A pump curve describes pump performance; the operating point occurs where it intersects the system curve."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What is the main purpose of a pressure-reducing valve?",
      "Maintain a lower downstream pressure within its control range",
      [
        "Prevent every reverse-flow event",
        "Measure water age",
        "Increase upstream reservoir elevation",
      ],
      "A PRV throttles to control downstream pressure. It requires correct sizing, pilots, strainers, and maintenance."
    ),
    calc(
      DISTRIBUTION_GENERAL,
      "medium",
      "A reservoir water surface is 25 m above a pressure gauge. Ignoring losses, what pressure is expected using 9.81 kPa per metre?",
      "About 245 kPa",
      ["About 25 kPa", "About 98 kPa", "About 2,450 kPa"],
      "Static pressure equals elevation head multiplied by the pressure per metre of water.",
      [
        { l: "Step 1 — Head", c: "Elevation head = 25 m" },
        { l: "Step 2 — Pressure", c: "25 m × 9.81 kPa/m = 245.25 kPa" },
      ]
    ),
    calc(
      DISTRIBUTION_GENERAL,
      "medium",
      "A main carries 30 L/s through an internal area of 0.025 m². What is the average velocity?",
      "1.2 m/s",
      ["0.12 m/s", "7.5 m/s", "750 m/s"],
      "Convert flow to cubic metres per second and divide by area.",
      [
        { l: "Step 1 — Convert", c: "30 L/s = 0.030 m³/s" },
        { l: "Step 2 — Divide", c: "0.030 m³/s ÷ 0.025 m² = 1.2 m/s" },
      ]
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A hydrant test shows a large difference between static and residual pressure at moderate flow. What can this indicate?",
      "High distribution-system resistance or limited supply capacity",
      [
        "The hydrant has no connection to a main",
        "Static pressure is always incorrect",
        "Chlorine residual is too high",
      ],
      "A large pressure drop under flow can reflect small or rough mains, restrictions, closed valves, or limited source capacity."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why can a dead-end main have lower pressure during high demand than a well-looped main?",
      "Flow has fewer paths, so more passes through the same restrictive route",
      [
        "Dead ends eliminate friction",
        "Looping prevents any pressure loss",
        "Water at dead ends has no mass",
      ],
      "Looping provides alternate paths and can reduce head loss and improve reliability, though actual conditions depend on the network."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A partially closed boundary valve has what likely hydraulic effect?",
      "It adds head loss and may reduce downstream pressure and flow",
      [
        "It increases pipe diameter",
        "It raises reservoir elevation",
        "It eliminates water hammer",
      ],
      "A restriction steepens the effective system resistance. Pressure patterns and valve records can help locate it."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why does tuberculation in an iron main reduce hydraulic capacity?",
      "It narrows the effective area and increases roughness",
      [
        "It makes the pipe perfectly smooth",
        "It increases pump efficiency",
        "It converts pressure to chlorine residual",
      ],
      "Internal corrosion deposits obstruct flow and increase friction, so more head is needed for the same flow."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Two pumps operate in parallel at a booster station. What is the intended effect?",
      "Increase available flow at the system head",
      [
        "Double pressure at zero flow in every case",
        "Remove all pipe friction",
        "Reverse the suction and discharge",
      ],
      "Parallel operation adds flow, with actual gain determined by the combined pump curve and system curve."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "What happens to friction loss if flow through the same watermain increases substantially?",
      "Friction loss increases more rapidly than flow",
      [
        "Friction loss becomes zero",
        "Friction loss decreases",
        "Friction loss equals static pressure",
      ],
      "Common pipe-flow relationships show head loss rising nonlinearly with flow. This drives pressure drops during peaks and fire flow."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A pressure gauge oscillates rapidly when a pump starts. What should be investigated?",
      "Hydraulic transient, air, check-valve action, and instrument damping or condition",
      [
        "Water hardness only",
        "The customer billing cycle",
        "The trench soil classification",
      ],
      "Rapid pressure changes can be true surge or instrument behaviour. Both system conditions and gauge installation should be assessed."
    ),
    calc(
      DISTRIBUTION_GENERAL,
      "medium",
      "A pressure zone has 360 kPa at elevation 110 m. Ignoring losses, what pressure is expected at elevation 120 m?",
      "About 262 kPa",
      ["About 98 kPa", "About 360 kPa", "About 458 kPa"],
      "A 10 m elevation rise uses about 98.1 kPa of pressure head.",
      [
        { l: "Step 1 — Elevation change", c: "120 m − 110 m = 10 m" },
        { l: "Step 2 — Pressure change", c: "10 m × 9.81 kPa/m = 98.1 kPa" },
        { l: "Step 3 — Subtract", c: "360 − 98.1 ≈ 262 kPa" },
      ]
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why is a system curve steeper when a valve is throttled?",
      "The system requires more head at each flow because resistance increased",
      [
        "The pump impeller becomes larger",
        "Static elevation decreases",
        "Water viscosity becomes zero",
      ],
      "Added valve loss increases the friction component of required head, shifting the operating point."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A high-elevation customer has adequate static pressure but poor pressure during morning peaks. What is the likely cause?",
      "Demand-related head loss in the supply path",
      [
        "The elevation changes every morning",
        "Static pressure cannot be measured",
        "The service meter creates supply pressure",
      ],
      "Peak flow raises friction loss, and high elevations have less pressure head available. Restrictions or undersized infrastructure may worsen it."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A booster station pump operates well to the right of its best-efficiency point. What combination is most concerning?",
      "Excess flow, higher power demand, low efficiency, and possible cavitation or wear",
      [
        "Zero flow and maximum head only",
        "No radial or axial loads",
        "Guaranteed motor unloading",
      ],
      "Far-right operation can exceed motor or hydraulic limits and reduce reliability. The system and pump curves must be reviewed."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "Closing a large valve too quickly creates a pressure spike. What causes the transient?",
      "Rapid change in water velocity converts momentum into a pressure wave",
      [
        "The water instantly boils",
        "Chlorine creates extra volume",
        "Static head disappears",
      ],
      "Water hammer results from abrupt velocity change. Controlled valve and pump operation and surge devices reduce it."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "Pressure logging shows normal values at the zone inlet but repeated low-pressure events at one branch. What is the best investigation?",
      "Compare synchronized flow and pressure data, valve status, elevations, and branch restrictions",
      [
        "Raise the whole zone pressure immediately",
        "Ignore local data",
        "Replace every service meter",
      ],
      "Localized events point to branch demand or resistance. Coordinated data helps distinguish capacity, valves, main condition, and customer-side issues."
    ),
    calc(
      DISTRIBUTION_GENERAL,
      "hard",
      "A pump delivers 0.040 m³/s against 32 m of head. Using water density 1,000 kg/m³ and g = 9.81 m/s², what is approximate hydraulic power?",
      "12.6 kW",
      ["1.26 kW", "78.5 kW", "126 kW"],
      "Hydraulic power is ρgQH.",
      [
        { l: "Step 1 — Formula", c: "P = ρgQH" },
        { l: "Step 2 — Substitute", c: "1,000 × 9.81 × 0.040 × 32 = 12,557 W" },
        { l: "Step 3 — Convert", c: "12,557 W ≈ 12.6 kW" },
      ]
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A field gauge shows lower pressure than expected at the far end of an older watermain. After verifying the gauge, which system condition could contribute most directly?",
      "Increased friction loss from a roughened main or a partially closed valve",
      [
        "A larger pipe diameter than shown on the plan",
        "Eliminating all customer demand from the district",
        "A reservoir surface elevation that is higher than usual",
      ],
      "Roughness, deposits, restrictions, and valve position can increase head loss and lower downstream pressure. Operators should verify field conditions and report findings using approved procedures."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A pump trip produces sub-atmospheric pressure at a watermain high point. What risk must be evaluated?",
      "Column separation, contamination intrusion, pipe damage, and severe return surge",
      [
        "Automatic increase in chlorine residual",
        "Permanent elimination of air pockets",
        "Higher static pressure",
      ],
      "Negative transients can admit contamination through leaks, form vapour cavities, and damage infrastructure when pressure recovers."
    ),
  ],
});

addBatch({
  bankKey: "class1-water-dist",
  module: DISTRIBUTION_GENERAL,
  topic: "Electrical Concepts",
  expected: { easy: 5, medium: 7, hard: 3 },
  drafts: [
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What electrical quantity is measured in volts?",
      "Electrical potential difference",
      ["Current", "Resistance", "Energy consumption"],
      "Voltage is electrical potential difference. Current is measured in amperes and resistance in ohms."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What is the function of a circuit breaker?",
      "Interrupt current under specified overload or short-circuit conditions",
      [
        "Control chlorine dose",
        "Measure water pressure",
        "Increase motor speed continuously",
      ],
      "A breaker provides overcurrent protection and switching within its rating. Motor overload protection may be separate."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What does SCADA stand for?",
      "Supervisory Control and Data Acquisition",
      [
        "System Chlorination and Distribution Analysis",
        "Static Current and Direct Amperage",
        "Safety Control and Drainage Assessment",
      ],
      "SCADA is used to supervise processes, acquire data, alarm conditions, and execute authorized controls."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What does a motor starter do?",
      "Controls motor power and commonly provides overload protection",
      ["Measure turbidity", "Prevent backflow", "Store pump curves"],
      "A starter switches motor power through a contactor and integrates protective and control functions."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What is the purpose of an electrical disconnect?",
      "Provide a means to isolate equipment from its power source",
      [
        "Adjust system pressure",
        "Increase pipe flow",
        "Disinfect electrical panels",
      ],
      "A properly rated disconnect supports safe isolation. Lockout and verification are still required."
    ),
    calc(
      DISTRIBUTION_GENERAL,
      "medium",
      "A 120 V heater has a resistance of 20 Ω. What current does it draw?",
      "6 A",
      ["0.17 A", "20 A", "2,400 A"],
      "Ohm's law gives current as voltage divided by resistance.",
      [
        { l: "Step 1 — Formula", c: "I = V ÷ R" },
        { l: "Step 2 — Calculate", c: "120 V ÷ 20 Ω = 6 A" },
      ]
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A three-phase booster motor loses one phase while running. What condition can result?",
      "High current, low torque, overheating, and damage",
      [
        "Normal balanced operation",
        "Lower current in every winding",
        "Improved efficiency",
      ],
      "Single-phasing unbalances currents and can rapidly overheat a motor. Protective devices should trip and the cause must be corrected."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why is a VFD used on a distribution pump?",
      "Match pump speed to demand and pressure while reducing throttling and starting stress",
      [
        "Eliminate all electrical protection",
        "Increase pipe diameter",
        "Measure chlorine residual",
      ],
      "Variable speed can improve pressure control and energy use, but requires correct minimum-flow and control settings."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A control panel shows a tripped overload. What should the operator do before resetting it?",
      "Identify the cause and verify motor, pump, current, and process conditions",
      [
        "Reset repeatedly until it holds",
        "Install a larger overload",
        "Bypass the trip contact",
      ],
      "An overload trip is evidence of excess current or heat. Repeated reset can damage equipment or create a hazard."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "What is the basic purpose of a pressure switch in a water-distribution control system?",
      "Changes contact state when pressure crosses a preset threshold",
      [
        "Measures flow directly",
        "Provides motor power without a starter",
        "Raises reservoir elevation",
      ],
      "A pressure switch translates a high- or low-pressure setpoint into a change of electrical contact state. The approved control drawing determines the specific alarm or equipment response."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why should control wires and power conductors be separated as designed?",
      "To reduce interference and meet insulation, heat, and safety requirements",
      [
        "To increase chlorine demand",
        "To reduce pipe friction",
        "To avoid calibrating instruments",
      ],
      "Power conductors can induce noise in sensitive signals, and electrical codes govern separation and routing."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A remote pressure reading is fixed at zero but the local gauge is normal. What should be checked?",
      "Transmitter power, signal loop, wiring, scaling, and input configuration",
      [
        "The main's pipe material only",
        "The reservoir's paint colour",
        "The customer meter register",
      ],
      "The process pressure exists, so the problem is likely in sensing or signal transmission rather than the hydraulic source."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A VFD-controlled pump repeatedly accelerates and decelerates around its pressure setpoint. What is the most appropriate Class 1 operator response?",
      "Verify the pressure reading and operating conditions, then report the instability for qualified review before changing control settings",
      [
        "Remove the pressure sensor so the pump holds one speed",
        "Increase maximum speed without limits until the cycling stops",
        "Change control settings repeatedly without documenting the original configuration",
      ],
      "Repeated speed changes can reflect a poor pressure signal or an operating/control issue. Operators should verify observable conditions, document the behaviour, and have authorized personnel assess configuration changes."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A motor has correct line voltage but one phase current is much higher. What is the best response?",
      "Stop and have phase balance, connections, windings, and mechanical load evaluated",
      [
        "Raise overload settings",
        "Assume voltage proves the motor is healthy",
        "Reverse two phases while running",
      ],
      "Current imbalance can damage the motor and may originate in connections, winding faults, supply imbalance, or load."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A SCADA command can start a pump even though a local maintenance inhibit is active. What does that indicate?",
      "The control logic does not enforce the safety interlock across all start paths",
      [
        "Remote control should override every local condition",
        "The pump needs a larger motor",
        "The pressure transmitter range is too low",
      ],
      "A documented maintenance inhibit should block automatic, remote, and local start paths as designed. It is a control-system measure only and never replaces physical lockout/tagout and verified energy isolation."
    ),
  ],
});

addBatch({
  bankKey: "class1-water-dist",
  module: DISTRIBUTION_GENERAL,
  topic: "Applied Science",
  expected: { easy: 6, medium: 9, hard: 5 },
  drafts: [
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What does pH indicate?",
      "How acidic or alkaline the water is",
      [
        "The water pressure",
        "The pipe diameter",
        "The number of service connections",
      ],
      "pH reflects hydrogen-ion activity on a logarithmic scale. It affects corrosion, treatment, and disinfectant chemistry."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What does turbidity measure?",
      "The scattering of light by particles in water",
      [
        "Water pressure",
        "Chlorine dose only",
        "Electrical resistance of a motor",
      ],
      "Turbidity is an optical measure related to suspended and colloidal material. It is reported in nephelometric turbidity units."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What is chlorine residual?",
      "Chlorine remaining after the water's chlorine demand has been satisfied",
      [
        "The total pipe corrosion rate",
        "The amount of dissolved oxygen",
        "The water's hardness only",
      ],
      "Residual is the measurable disinfectant remaining after reactions. It can provide continuing protection in distribution."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "Why is iron corrosion a water-quality concern?",
      "It can cause red water, deposits, leaks, and customer complaints",
      [
        "It always raises chlorine residual",
        "It makes water sterile",
        "It eliminates tuberculation",
      ],
      "Corrosion can release iron and build deposits, affecting appearance, capacity, and infrastructure condition."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What is an example of a microorganism relevant to drinking-water safety?",
      "Bacterium",
      ["Sand grain", "Chloride ion", "Air bubble"],
      "Bacteria, viruses, and protozoa can affect drinking-water safety. Sand, ions, and bubbles are not organisms."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What does water hardness primarily reflect?",
      "Dissolved calcium and magnesium",
      ["Water velocity", "Free chlorine only", "Number of coliforms"],
      "Hardness is mainly caused by calcium and magnesium ions and can contribute to scale."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A chlorine residual falls sharply across a storage area with long water age. What is the most likely explanation?",
      "Chlorine decays over time through reactions with water, deposits, and biofilm",
      [
        "Static head consumes chlorine",
        "Pressure converts chlorine into turbidity",
        "Hardness creates chlorine automatically",
      ],
      "Long residence time increases the opportunity for chlorine demand and natural decay."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why can disturbing tuberculation during a flow reversal cause discoloured water?",
      "Deposits and corrosion products can be mobilized into the water",
      [
        "Flow reversal sterilizes the pipe",
        "Pressure creates new iron instantly",
        "The water loses all minerals",
      ],
      "A hydraulic change can scour loose material from pipe walls. Controlled flushing and operational planning reduce impacts."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A free-chlorine sample is tested long after collection. Why may the result be unreliable?",
      "Chlorine can decay after sampling, so specified immediate testing is important",
      [
        "The bottle increases pressure",
        "Chlorine becomes a microorganism",
        "Temperature never affects chemistry",
      ],
      "Residual changes with time, light, temperature, and demand. Field procedures require prompt measurement."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "What water condition tends to increase metal corrosion risk?",
      "Aggressive water with unsuitable pH, alkalinity, and stability",
      [
        "A correctly managed corrosion-control program",
        "A sealed sample bottle",
        "A smooth hydraulic grade line",
      ],
      "Corrosion depends on water chemistry, materials, temperature, disinfectant, and protective scales—not a single factor alone."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why is a representative bacteriological sample tap disinfected before collection?",
      "To avoid external tap contamination affecting the sample",
      [
        "To disinfect the entire watermain",
        "To increase flow pressure",
        "To lower turbidity in the system",
      ],
      "Tap preparation helps ensure the result represents the distribution water rather than organisms on the fixture."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A customer reports black particles after a hydrant operation. Which cause is plausible?",
      "Mobilized manganese deposits or deteriorated rubber components",
      [
        "Pure oxygen crystals",
        "Increased pipe diameter",
        "Static head sediment",
      ],
      "Black material can originate from manganese deposits or plumbing components. Sampling and inspection should identify it rather than assume a cause."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why can warm water and low disinfectant residual encourage biofilm growth?",
      "Microbial activity can increase when temperature and nutrients are favourable and control is weak",
      [
        "Warm water prevents all metabolism",
        "Biofilm grows only in reservoirs",
        "Pressure alone sterilizes mains",
      ],
      "Biofilm is influenced by temperature, nutrients, disinfectant, pipe surfaces, and water age."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A sample has pH 8 compared with pH 7. What does the pH scale imply?",
      "Its hydrogen-ion activity is approximately one-tenth as great",
      [
        "It is one percent less acidic",
        "It has ten times the chlorine residual",
        "It must be ten times harder",
      ],
      "Each pH unit is a tenfold change in hydrogen-ion activity. pH does not directly set residual or hardness."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why should a turbidity instrument be verified with standards?",
      "To confirm its optical response and measurement accuracy",
      [
        "To increase main pressure",
        "To remove particles from the sample",
        "To calibrate a flowmeter",
      ],
      "Standards check instrument response. Clean cells, correct technique, and maintenance also affect results."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A zone has adequate entry residual but repeated low residual at dead ends. Which response addresses the underlying conditions?",
      "Evaluate water age, demand, storage turnover, flushing, and disinfectant demand",
      [
        "Raise pressure without measuring residual",
        "Sample only at the zone inlet",
        "Close more boundary valves",
      ],
      "Low-use areas can experience long residence and decay. A system-level water-age strategy is more defensible than blind dosing."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "After a major flow change, turbidity rises but chlorine residual remains stable. What should the operator infer?",
      "Deposits may have been mobilized even though disinfectant residual did not change",
      [
        "Stable chlorine proves there are no particles",
        "The turbidity meter must be wrong",
        "Pressure and turbidity are identical",
      ],
      "Hydraulic disturbance can release particles independently of a large immediate residual change. Both data sets should be verified."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "Lead levels increase after a source-water chemistry change. Which mechanism should be investigated?",
      "The change may have destabilized protective scales or altered corrosion control",
      [
        "Lead is created by chlorine",
        "Pipe pressure converts copper into lead",
        "Only bacteriological sampling can explain it",
      ],
      "Water chemistry changes can alter scale solubility and corrosion rates. Distribution materials and treatment history must be reviewed."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A bacteriological sample is positive, but its control and nearby repeats are negative. What is the correct conclusion?",
      "Follow the regulatory response while investigating sampling, site, and system causes; do not dismiss either possibility",
      [
        "The original result is automatically false",
        "The entire system is proven contaminated",
        "Chlorine residual no longer matters",
      ],
      "A positive result requires the prescribed response. Investigation distinguishes true system contamination from localized or sampling contamination."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A disinfectant residual reading is unexpectedly high after reagent addition, but the sample is intensely coloured. What should be considered?",
      "Method interference and verification with an appropriate approved technique",
      [
        "Colour cannot affect colorimetric tests",
        "Report the value without review",
        "Dilute with tap water of unknown quality",
      ],
      "Colour and turbidity can interfere with colorimetric methods. Approved blanks, alternative methods, or laboratory confirmation may be required."
    ),
  ],
});

addBatch({
  bankKey: "class1-water-dist",
  module: DISTRIBUTION_GENERAL,
  topic: "Public Health",
  expected: { easy: 4, medium: 5, hard: 3 },
  drafts: [
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What is a cross-connection?",
      "A connection between a potable system and a source that may contaminate it",
      [
        "A loop between two potable mains only",
        "A pipe-support bracket",
        "A customer service meter",
      ],
      "Cross-connections create a path for contaminants to enter through backpressure or backsiphonage."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What is backsiphonage?",
      "Backflow caused by negative or sub-atmospheric pressure in the potable supply piping",
      [
        "Forward flow caused by high reservoir level",
        "Leakage through a closed hydrant",
        "Normal meter registration",
      ],
      "A vacuum or sub-atmospheric pressure can draw non-potable material into the drinking-water system. Backpressure is different: it occurs when downstream pressure exceeds potable-system pressure."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "During a boil-water advisory, which instruction is appropriate for water used for drinking or food preparation?",
      "Follow the authority-issued boiling or alternative-safe-supply instruction before using the water",
      [
        "Assume water is safe if it looks clear",
        "Use only cold tap water without further precautions",
        "Wait until the next billing cycle for instructions",
      ],
      "A boil-water advisory gives affected consumers temporary risk-reduction instructions when microbiological safety may be compromised. The applicable authority specifies the required action and when it can end."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "Which disease can be transmitted through contaminated drinking water?",
      "Giardiasis",
      ["A broken bone", "Noise-induced hearing loss", "Electrical shock"],
      "Giardia is a waterborne protozoan pathogen. The other conditions are not infectious waterborne diseases."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A hose submerged in a pesticide tank is connected to a hydrant without protection. What hazard exists?",
      "Backsiphonage or backpressure could contaminate the potable system",
      [
        "The hose increases fire flow",
        "The tank disinfects the main",
        "The hydrant becomes an air valve",
      ],
      "The submerged connection is a severe cross-connection. An approved air gap or suitable backflow prevention is required."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why can a low-pressure event increase contamination risk?",
      "Contaminated water may enter through leaks or cross-connections when internal pressure is lost",
      [
        "Low pressure sterilizes the pipe",
        "Pathogens cannot move through water",
        "Only high pressure causes intrusion",
      ],
      "Positive pressure helps keep external contamination out. Pressure loss requires investigation and the prescribed response."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "What is the role of an air gap in cross-connection control?",
      "Provide physical separation between the potable outlet and receiving vessel",
      [
        "Reduce chlorine demand",
        "Measure backpressure",
        "Increase pump efficiency",
      ],
      "A properly sized air gap is a highly reliable physical separation because there is no continuous connection."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A backflow-prevention assembly has not been tested at its required interval. What is the concern?",
      "Internal components may have failed without visible evidence",
      [
        "It automatically becomes an air gap",
        "Testing is needed only after contamination",
        "The assembly always fails closed safely",
      ],
      "Check valves and relief mechanisms can foul or wear. Qualified testing verifies performance."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why should consumers not be told a boil-water advisory is lifted until authorized?",
      "Premature lifting may expose people before required evidence and approval are complete",
      [
        "Boiling lowers water pressure",
        "Only the media can test samples",
        "Advisories are unrelated to health",
      ],
      "Clear, authorized communication prevents conflicting instructions and protects public health."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A main break creates negative pressure beside a flooded sanitary sewer trench. What is the primary public-health concern?",
      "Contaminated water may be drawn into the drinking-water main through the break",
      [
        "The watermain will become larger",
        "Chlorine residual must increase",
        "The sanitary sewer will supply fire flow",
      ],
      "The combination of contamination source and negative pressure creates a direct intrusion pathway. Isolation, repair, disinfection, sampling, and notification follow the approved plan."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A facility needs both backpressure and backsiphonage protection against a high health hazard. What determines device selection?",
      "The hazard classification, hydraulic condition, applicable standard, and local program",
      [
        "Pipe colour only",
        "Whether the device is least expensive",
        "The customer's preference alone",
      ],
      "Backflow devices have different capabilities. A high hazard and backpressure may require a reduced-pressure principle assembly or physical separation, subject to requirements."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "Several gastrointestinal illness reports cluster in one pressure zone after a low-pressure event. What is the best utility response?",
      "Activate the incident plan, preserve pressure and water-quality data, sample strategically, notify authorities, and control exposure",
      [
        "Wait for definitive proof before documenting anything",
        "Flush without collecting any evidence",
        "Assume complaints are unrelated",
      ],
      "A potential outbreak needs coordinated operational, epidemiological, regulatory, and communication action while evidence is gathered."
    ),
  ],
});

addBatch({
  bankKey: "class1-water-dist",
  module: DISTRIBUTION_GENERAL,
  topic: "Maps & Plans",
  expected: { easy: 3, medium: 3, hard: 2 },
  drafts: [
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What does a water-distribution system map primarily show?",
      "The location and relationship of mains, valves, hydrants, and other assets",
      [
        "Only customer bills",
        "Water chemistry reactions",
        "Motor winding diagrams",
      ],
      "System maps support operations, isolation, maintenance, and emergency response."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What is an as-built drawing?",
      "A record of the infrastructure as installed, including approved field changes",
      [
        "The original concept drawing only",
        "A daily operator log",
        "A laboratory chain-of-custody form",
      ],
      "As-builts capture final alignment, size, material, elevation, and appurtenances where recorded."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "easy",
      "What does a drawing legend explain?",
      "Symbols, line types, abbreviations, and other conventions",
      [
        "The hydraulic grade only",
        "The contractor's payroll",
        "The chlorine demand",
      ],
      "A legend is required to interpret graphical conventions correctly."
    ),
    calc(
      DISTRIBUTION_GENERAL,
      "medium",
      "A map scale is 1:1,000. What field distance does 2 cm on the drawing represent?",
      "20 m",
      ["2 m", "200 m", "2,000 m"],
      "Two centimetres at 1:1,000 equals 2,000 cm, or 20 m.",
      [
        { l: "Step 1 — Apply the scale", c: "2 cm × 1,000 = 2,000 cm" },
        { l: "Step 2 — Convert centimetres to metres", c: "2,000 cm ÷ 100 = 20 m" },
      ],
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "A valve shown on GIS cannot be found at the mapped point. What should the operator do?",
      "Use approved locating, records, measurements, and field evidence to resolve and correct the asset position",
      [
        "Assume the valve was removed",
        "Excavate immediately at the symbol",
        "Delete the valve from GIS",
      ],
      "GIS coordinates may be approximate or outdated. Verification precedes excavation and documented correction follows."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "medium",
      "Why are valve numbers linked to work orders and maps?",
      "To identify the exact asset and preserve its operating and maintenance history",
      ["To calculate pH", "To set motor voltage", "To replace field tags"],
      "A stable asset identifier connects spatial and maintenance records. Field identification remains important."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "An isolation plan relies on a boundary valve not shown on the latest map but present on an older as-built. What is the safest approach?",
      "Verify the valve and connected mains in the field and records before relying on it",
      [
        "Assume the older drawing is exact",
        "Assume the latest map proves it does not exist",
        "Close unrelated valves instead",
      ],
      "Conflicting records require resolution because isolation effectiveness affects customers, fire flow, pressure, and repair safety."
    ),
    d(
      DISTRIBUTION_GENERAL,
      "hard",
      "A proposed watermain crosses a sewer, but the plan lacks vertical separation details. What should occur?",
      "Obtain design and surveyed elevations and confirm required separation and protection",
      [
        "Assume horizontal separation is sufficient",
        "Set both pipes at the same elevation",
        "Proceed and update the drawing later",
      ],
      "Horizontal coordinates alone cannot establish a safe crossing. Applicable separation and protection requirements must be designed and verified."
    ),
  ],
});

addBatch({
  bankKey: "class1-water-dist",
  module: DISTRIBUTION_ADMIN,
  topic: "Emergency Response",
  expected: { easy: 2, medium: 4, hard: 2 },
  drafts: [
    d(
      DISTRIBUTION_ADMIN,
      "easy",
      "What is the first purpose of a watermain-break response plan?",
      "Protect people and water quality while controlling the break and maintaining essential service",
      [
        "Restore pavement before isolating water",
        "Avoid documenting the event",
        "Maximize flow through the damaged main",
      ],
      "The response balances life safety, contamination control, isolation, customers, fire protection, repair, and restoration."
    ),
    d(
      DISTRIBUTION_ADMIN,
      "easy",
      "What is mutual aid?",
      "Prearranged assistance from other organizations during an emergency",
      [
        "A customer rebate",
        "A pump-control setting",
        "A water-quality test method",
      ],
      "Mutual-aid agreements define contacts, resources, authority, and reimbursement before an incident."
    ),
    d(
      DISTRIBUTION_ADMIN,
      "medium",
      "A large break threatens to drain an elevated tank. What should operations prioritize?",
      "Control isolation, pumping, storage, pressure, fire-flow needs, and customer notification as one coordinated response",
      [
        "Close every zone valve without analysis",
        "Wait until the tank is empty",
        "Increase pressure in the broken main",
      ],
      "Uncoordinated isolation can spread outages or pressure problems. The incident plan uses system data to stabilize service."
    ),
    d(
      DISTRIBUTION_ADMIN,
      "medium",
      "Why is a valve-isolation plan prepared before excavating a break?",
      "To identify valves, affected customers and facilities, pressure impacts, and fallback isolation",
      [
        "To eliminate the need for field verification",
        "To calculate chlorine demand only",
        "To select traffic cones",
      ],
      "A planned isolation reduces outage scope and surprises. Valve status must still be confirmed in the field."
    ),
    d(
      DISTRIBUTION_ADMIN,
      "medium",
      "A contamination complaint is received from one building. What should be done first?",
      "Collect structured information, assess immediate risk, and compare building plumbing with nearby system conditions",
      [
        "Announce system-wide contamination immediately",
        "Dismiss a single complaint",
        "Tell the customer to remove their meter",
      ],
      "A disciplined investigation protects health while distinguishing premise plumbing from distribution causes. Escalation follows evidence and regulatory requirements."
    ),
    d(
      DISTRIBUTION_ADMIN,
      "medium",
      "Why must emergency communications use one authorized source of truth?",
      "To prevent conflicting instructions and keep operational, regulatory, and public messages aligned",
      [
        "To prevent operators from recording data",
        "To reduce water pressure",
        "To replace the incident commander",
      ],
      "Consistent, approved messages protect credibility and public action while the situation changes."
    ),
    d(
      DISTRIBUTION_ADMIN,
      "hard",
      "A break isolation would also remove supply to a hospital. What is the best response?",
      "Coordinate alternate supply, staged isolation, hospital needs, fire protection, and public-health controls before shutting down when conditions permit",
      [
        "Close the valves without notification",
        "Keep the failed main open regardless of contamination",
        "Transfer the decision to the repair contractor",
      ],
      "Critical customers require explicit continuity planning, but unsafe water or uncontrolled damage may still require rapid action."
    ),
    d(
      DISTRIBUTION_ADMIN,
      "hard",
      "After pressure is restored from a major event, why is reopening valves slowly important?",
      "It limits surge, deposit mobilization, air movement, and secondary breaks",
      [
        "It guarantees no sampling is needed",
        "It immediately removes all air",
        "It increases chlorine demand deliberately",
      ],
      "Controlled restoration reduces hydraulic shock and water-quality disturbance while crews monitor pressure and flushing."
    ),
  ],
});

addBatch({
  bankKey: "class1-water-dist",
  module: DISTRIBUTION_ADMIN,
  topic: "Maintenance Management",
  expected: { easy: 2, medium: 2, hard: 1 },
  drafts: [
    d(
      DISTRIBUTION_ADMIN,
      "easy",
      "What is preventive maintenance?",
      "Planned work performed to reduce the likelihood of failure",
      [
        "Repair performed only after failure",
        "Emergency customer notification",
        "A laboratory sampling method",
      ],
      "Preventive work uses time, usage, or condition triggers to preserve reliability."
    ),
    d(
      DISTRIBUTION_ADMIN,
      "easy",
      "Why are work orders assigned asset identifiers?",
      "To link labour, materials, findings, and history to the correct asset",
      ["To measure pH", "To increase hydrant pressure", "To replace all maps"],
      "Asset-linked work history supports planning, recurring-failure analysis, and lifecycle decisions."
    ),
    d(
      DISTRIBUTION_ADMIN,
      "medium",
      "A valve-exercising program repeatedly finds the same valves inaccessible. What should management do?",
      "Create corrective work, assign ownership and due dates, and track restoration of access",
      [
        "Record the issue without action",
        "Remove the valves from the asset list",
        "Assume they will work during an emergency",
      ],
      "Known access defects are operational risks. A closed-loop maintenance process must correct and verify them."
    ),
    d(
      DISTRIBUTION_ADMIN,
      "medium",
      "How should limited maintenance resources be prioritized?",
      "By risk, considering likelihood and consequence of failure plus regulatory and service needs",
      [
        "By asset age alone",
        "By whichever complaint is newest",
        "Equally across every asset regardless of condition",
      ],
      "Risk-based planning combines condition, criticality, failure history, redundancy, safety, and compliance."
    ),
    d(
      DISTRIBUTION_ADMIN,
      "hard",
      "A pump has rising vibration but still meets flow targets. What is the best maintenance decision?",
      "Trend the condition, verify the measurement, and plan intervention before functional failure",
      [
        "Run to failure because output is acceptable",
        "Disable the vibration alarm",
        "Increase speed to hide the trend",
      ],
      "Condition indicators can reveal deterioration before performance falls. Planned work can reduce damage and outage risk."
    ),
  ],
});

addBatch({
  bankKey: "class1-water-dist",
  module: DISTRIBUTION_ADMIN,
  topic: "Record Keeping & Information Systems",
  expected: { easy: 1, medium: 2, hard: 1 },
  drafts: [
    d(
      DISTRIBUTION_ADMIN,
      "easy",
      "Why must an operator log be legible and time-stamped?",
      "So actions and conditions can be reconstructed accurately",
      [
        "To increase water pressure",
        "To eliminate electronic records",
        "To replace sampling",
      ],
      "Clear, contemporaneous records support shift continuity, compliance, investigation, and decision-making."
    ),
    d(
      DISTRIBUTION_ADMIN,
      "medium",
      "A SCADA value is manually overridden during a repair. What should be recorded?",
      "Who changed it, when, why, the authorized value, safeguards, and when normal control was restored",
      [
        "Only the final value",
        "Nothing because SCADA keeps data",
        "The operator's personal opinion only",
      ],
      "Temporary overrides can create persistent risk. Traceable records and restoration checks are essential."
    ),
    d(
      DISTRIBUTION_ADMIN,
      "medium",
      "Why should valve-field changes be updated in GIS and maintenance records promptly?",
      "Emergency isolation depends on accurate location, status, and configuration data",
      [
        "Updates increase pipe diameter",
        "GIS replaces field locating",
        "Old maps are always sufficient",
      ],
      "Unrecorded changes can expand outages and delay response. Controlled data updates preserve a shared source of truth."
    ),
    d(
      DISTRIBUTION_ADMIN,
      "hard",
      "A pressure incident is investigated, but SCADA clocks, logger clocks, and work-order times differ. What should be done?",
      "Reconcile time sources and document uncertainty before drawing causal conclusions",
      [
        "Sort all records alphabetically",
        "Use whichever time best supports the theory",
        "Average the clock readings without context",
      ],
      "Event sequence depends on synchronized timestamps. Misalignment can falsely reverse cause and effect."
    ),
  ],
});

addBatch({
  bankKey: "class1-water-dist",
  module: DISTRIBUTION_ADMIN,
  topic: "Public Relations & Security",
  expected: { easy: 1, medium: 1, hard: 1 },
  drafts: [
    d(
      DISTRIBUTION_ADMIN,
      "easy",
      "How should an operator respond to a customer water-quality complaint?",
      "Listen, record specific observations and timing, explain the next steps, and follow the investigation procedure",
      [
        "Promise a cause before testing",
        "Dismiss the complaint",
        "Tell the customer to contact another utility",
      ],
      "A respectful, structured intake preserves evidence and trust without making unsupported claims."
    ),
    d(
      DISTRIBUTION_ADMIN,
      "medium",
      "A secure reservoir hatch is found open with no work order. What is the correct response?",
      "Treat it as a security and water-quality incident, restrict access, preserve evidence, and notify required personnel",
      [
        "Close it and make no record",
        "Assume wind opened it",
        "Post a photo publicly before reporting",
      ],
      "An unexplained breach requires coordinated security, operational, and regulatory assessment."
    ),
    d(
      DISTRIBUTION_ADMIN,
      "hard",
      "Social media claims the utility is hiding contamination, but current data do not confirm it. What should communication do?",
      "Acknowledge the concern, state verified facts and uncertainties, describe actions underway, and provide update timing",
      [
        "Attack the person who posted",
        "Say nothing until every question is resolved",
        "Declare the system safe without qualification",
      ],
      "Transparent, evidence-based communication maintains trust while avoiding speculation or premature assurance."
    ),
  ],
});

const BANK_STARTS = {
  "class1-wastewater-coll": 575,
  "class1-water-dist": 568,
} as const;

const ANSWER_POSITION_OFFSETS = {
  "class1-wastewater-coll": 0,
  "class1-water-dist": 2,
} as const;

function buildQuestions(): InsertQuestion[] {
  const next = { ...BANK_STARTS };
  return topicBatches.flatMap(batch =>
    batch.drafts.map(draft => {
      const questionNum = next[batch.bankKey]++;
      const correctIndex =
        (questionNum -
          BANK_STARTS[batch.bankKey] +
          ANSWER_POSITION_OFFSETS[batch.bankKey]) %
        4;
      const options = [...draft.distractors];
      options.splice(correctIndex, 0, draft.answer);

      return {
        bankKey: batch.bankKey,
        questionNum,
        module: draft.module,
        difficulty: draft.difficulty,
        question: draft.question,
        options: JSON.stringify(options),
        correctIndex,
        explanation: draft.explanation,
        steps: draft.steps ? JSON.stringify(draft.steps) : null,
        tip: draft.tip ?? null,
        isCalc: draft.isCalc ? "yes" : "no",
        topic: draft.isCalc ? "Calculations" : null,
        // The approved specification does not assign cognitive level per question, and
        // difficulty is not a safe proxy for WPI's recall/application classification.
        cognitiveLevel: null,
      } satisfies InsertQuestion;
    })
  );
}

export const examBankGapQuestions = buildQuestions();

export function validateGapQuestions(
  rows: InsertQuestion[] = examBankGapQuestions
) {
  if (rows.length !== 300)
    throw new Error(`Expected 300 questions, got ${rows.length}`);

  const expectedTotals = new Map([
    ["class1-wastewater-coll", 150],
    ["class1-water-dist", 150],
  ]);
  const seenKeys = new Set<string>();
  const seenText = new Set<string>();
  const answerPositions = [0, 0, 0, 0];

  for (const row of rows) {
    const bankKey = row.bankKey;
    const questionNum = Number(row.questionNum);
    const key = `${bankKey}:${questionNum}`;
    if (seenKeys.has(key)) throw new Error(`Duplicate question key: ${key}`);
    seenKeys.add(key);

    const normalizedText = String(row.question)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    if (seenText.has(normalizedText))
      throw new Error(`Duplicate question text: ${row.question}`);
    seenText.add(normalizedText);

    const options = JSON.parse(String(row.options)) as unknown[];
    if (options.length !== 4)
      throw new Error(`${key} must have exactly four options`);
    if (new Set(options.map(String)).size !== 4)
      throw new Error(`${key} has duplicate options`);
    if (Number(row.correctIndex) < 0 || Number(row.correctIndex) > 3) {
      throw new Error(`${key} has invalid correctIndex`);
    }
    answerPositions[Number(row.correctIndex)] += 1;

    if (!row.explanation || String(row.explanation).trim().length < 20) {
      throw new Error(`${key} has an inadequate explanation`);
    }
    if (row.isCalc === "yes") {
      const steps = row.steps ? JSON.parse(String(row.steps)) : [];
      if (!Array.isArray(steps) || steps.length === 0)
        throw new Error(`${key} calculation has no steps`);
    } else if (row.steps != null || row.topic != null) {
      throw new Error(`${key} non-calculation must have null steps and topic`);
    }
  }

  for (const [bankKey, expected] of Array.from(expectedTotals.entries())) {
    const actual = rows.filter(row => row.bankKey === bankKey).length;
    if (actual !== expected)
      throw new Error(`${bankKey}: expected ${expected}, got ${actual}`);
  }

  if (Math.max(...answerPositions) - Math.min(...answerPositions) > 1) {
    throw new Error(
      `Correct answers are not balanced: ${answerPositions.join(", ")}`
    );
  }

  return { total: rows.length, answerPositions };
}

export async function insertGapQuestions() {
  validateGapQuestions();
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db)
    throw new Error(
      "DATABASE_URL is required to insert exam-bank gap questions"
    );

  const existingRanges = await db
    .select({
      bankKey: questions.bankKey,
      questionNum: questions.questionNum,
      question: questions.question,
      options: questions.options,
      correctIndex: questions.correctIndex,
      explanation: questions.explanation,
    })
    .from(questions)
    .where(
      or(
        and(
          eq(questions.bankKey, "class1-wastewater-coll"),
          between(questions.questionNum, 575, 724)
        ),
        and(
          eq(questions.bankKey, "class1-water-dist"),
          between(questions.questionNum, 568, 717)
        )
      )
    );
  if (existingRanges.length > 0) {
    if (existingRanges.length === examBankGapQuestions.length) {
      const existingByKey = new Map(
        existingRanges.map(row => [`${row.bankKey}:${row.questionNum}`, row]),
      );
      const mismatch = examBankGapQuestions.find(row => {
        const existing = existingByKey.get(`${row.bankKey}:${row.questionNum}`);
        return !existing ||
          existing.question !== row.question ||
          existing.options !== row.options ||
          existing.correctIndex !== row.correctIndex ||
          existing.explanation !== row.explanation;
      });
      if (!mismatch) return { inserted: 0, alreadyPresent: true };
    }
    const preview = existingRanges
      .slice(0, 10)
      .map(row => `${row.bankKey}#${row.questionNum}`)
      .join(", ");
    throw new Error(
      `Refusing to overwrite ${existingRanges.length} existing question numbers: ${preview}`
    );
  }

  for (const bankKey of Object.keys(BANK_STARTS) as Array<
    keyof typeof BANK_STARTS
  >) {
    const existingTextRows = await db
      .select({ question: questions.question })
      .from(questions)
      .where(eq(questions.bankKey, bankKey));
    const existingText = new Set(
      existingTextRows.map(row =>
        row.question.trim().toLowerCase().replace(/\s+/g, " ")
      )
    );
    const duplicate = examBankGapQuestions.find(
      row =>
        row.bankKey === bankKey &&
        existingText.has(
          String(row.question).trim().toLowerCase().replace(/\s+/g, " ")
        )
    );
    if (duplicate)
      throw new Error(
        `Existing bank already contains question text: ${duplicate.question}`
      );
  }

  await db.transaction(async tx => {
    for (let i = 0; i < examBankGapQuestions.length; i += 50) {
      await tx.insert(questions).values(examBankGapQuestions.slice(i, i + 50));
    }

    for (const [bankKey, requiredModule] of [
      ["class1-wastewater-coll", COLLECTION_SCIENCE],
      ["class1-water-dist", null],
    ] as const) {
      const [meta] = await tx
        .select()
        .from(questionBankMeta)
        .where(eq(questionBankMeta.bankKey, bankKey))
        .limit(1);
      if (!meta)
        throw new Error(`Missing question_bank_meta row for ${bankKey}`);

      const modules = JSON.parse(meta.modules) as Array<
        string | { name: string }
      >;
      if (
        requiredModule &&
        !modules.some(module =>
          typeof module === "string"
            ? module === requiredModule
            : module.name === requiredModule
        )
      ) {
        modules.push(requiredModule);
      }
      await tx
        .update(questionBankMeta)
        .set({
          modules: JSON.stringify(modules),
          totalQuestions: sql`(SELECT COUNT(*) FROM ${questions} WHERE ${questions.bankKey} = ${bankKey})`,
          contentVersion: sql`${questionBankMeta.contentVersion} + 1`,
          blueprintVersion: sql`${questionBankMeta.blueprintVersion} + 1`,
        })
        .where(eq(questionBankMeta.bankKey, bankKey));
    }
  });

  return { inserted: examBankGapQuestions.length };
}
