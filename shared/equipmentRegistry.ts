/**
 * Equipment Lab registry.
 *
 * One record per modelled unit process. The clarifier already shipped with its
 * own bespoke data file (clarifierLab.ts); this registry generalizes that shape
 * so every additional unit reuses the same renderer, the same page shell and the
 * same SEO contract instead of growing another bespoke page each time.
 *
 * Exam content here is written for Canadian water and wastewater operator
 * certification. Keep operator guidance procedural and non-prescriptive: the
 * plant's own SOPs and the provincial authority always govern real actions.
 */

export type EquipmentView = "isometric" | "top" | "cutaway" | "exploded";

export type EquipmentStream =
  | "water-treatment"
  | "wastewater-treatment"
  | "water-distribution"
  | "wastewater-collection";

export interface EquipmentPart {
  id: string;
  label: string;
  color: string;
  /** What the component physically does. */
  function: string;
  /** What an operator watches, trends or checks in the field. */
  operatorLens: string;
  /** The transferable idea an exam question tests. */
  examConnection: string;
}

export interface EquipmentStage {
  id: string;
  step: string;
  title: string;
  description: string;
  accent: string;
}

/** A worked calculation shown with its formula broken down term by term. */
/** One fully worked example, shown with its substitution step. */
export interface WorkedExample {
  scenario: string;
  substitution: string;
  result: string;
}

export interface EquipmentFormula {
  id: string;
  name: string;
  /**
   * Metric form, which is what Canadian certification exams use.
   * Ontario and the Western provinces examine in cubic metres and kilograms.
   */
  expression: string;
  /** US customary form, kept for candidates writing US-unit exams. */
  expressionUs?: string;
  /** Each symbol explained, so learners see what every term means. */
  terms: { symbol: string; meaning: string; units: string }[];
  /** Worked example in metric, the primary presentation. */
  worked: WorkedExample;
  /** The same calculation in US customary units. */
  workedUs?: WorkedExample;
  /** What the answer means in practice. */
  interpretation: string;
}

/** A troubleshooting pairing: what is seen, why it happens, what it means. */
export interface EquipmentSymptom {
  id: string;
  observation: string;
  likelyCauses: string[];
  examPoint: string;
}

export interface EquipmentDefinition {
  id: string;
  /** URL segment under /equipment-lab/. */
  slug: string;
  moduleNumber: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  /** One-line summary used on cards and meta descriptions. */
  summary: string;
  stream: EquipmentStream;
  accent: string;
  /** Which 3D scene renders this unit. "clarifier" is the shipped scene. */
  sceneId: "clarifier" | "aeration-basin";
  /** Courses where this equipment is examinable, for internal linking. */
  relatedTopics: string[];
  /** Route of the matching process guide. */
  guideRoute: string;
  /** Route of related practice. */
  practiceRoute: string;
  parts: readonly EquipmentPart[];
  stages: readonly EquipmentStage[];
  formulas: readonly EquipmentFormula[];
  symptoms: readonly EquipmentSymptom[];
  /** Crawlable prose. Real teaching content, not marketing copy. */
  seo: {
    title: string;
    description: string;
    h1: string;
    sections: { heading: string; paragraphs: string[] }[];
    faq: { question: string; answer: string }[];
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Module 02 — Activated sludge aeration basin
 * ──────────────────────────────────────────────────────────────────────────── */

const AERATION_BASIN: EquipmentDefinition = {
  id: "aeration-basin",
  slug: "aeration-basin",
  moduleNumber: "02",
  title: "Activated sludge aeration basin",
  shortTitle: "Aeration basin",
  eyebrow: "Secondary treatment",
  summary:
    "See how diffused air, mixed liquor and return sludge work together to grow the biomass that removes dissolved organic load.",
  stream: "wastewater-treatment",
  accent: "#0EA5E9",
  sceneId: "aeration-basin",
  relatedTopics: [
    "Activated sludge",
    "Dissolved oxygen control",
    "MLSS and MLVSS",
    "Sludge age and F/M ratio",
    "Return and waste activated sludge",
  ],
  guideRoute: "/wastewater",
  practiceRoute: "/class1-ww",

  parts: [
    {
      id: "influent-channel",
      label: "Influent Channel",
      color: "#38BDF8",
      function:
        "Carries primary effluent into the basin and combines it with return activated sludge to form mixed liquor.",
      operatorLens:
        "Watch for uneven splitting between parallel basins and for solids or rags collecting at the inlet.",
      examConnection:
        "Mixed liquor is primary effluent plus return activated sludge. The blend sets the starting food-to-microorganism balance.",
    },
    {
      id: "diffuser-grid",
      label: "Fine Bubble Diffuser Grid",
      color: "#34D399",
      function:
        "Releases small air bubbles across the basin floor to transfer oxygen into the mixed liquor and keep solids in suspension.",
      operatorLens:
        "Look for dead spots, uneven boil patterns, and rising header pressure that can indicate fouled or torn diffusers.",
      examConnection:
        "Fine bubbles transfer oxygen more efficiently than coarse bubbles because smaller bubbles give more surface area per volume of air.",
    },
    {
      id: "blower",
      label: "Blower & Air Header",
      color: "#FBBF24",
      function:
        "Supplies pressurized air to the diffuser grid and sets how much oxygen reaches the biomass.",
      operatorLens:
        "Trend air flow against dissolved oxygen. Follow site lockout and isolation procedures before any mechanical work.",
      examConnection:
        "Aeration is typically the largest single energy user at a treatment plant, so air delivery is controlled rather than left wide open.",
    },
    {
      id: "do-probe",
      label: "Dissolved Oxygen Probe",
      color: "#C084FC",
      function:
        "Measures dissolved oxygen in the mixed liquor so air supply can be matched to the biological demand.",
      operatorLens:
        "Verify calibration on the plant's schedule. A drifting probe can drive the blowers to the wrong setpoint.",
      examConnection:
        "Too little dissolved oxygen can encourage some filamentous organisms and poor settling. Over-aerating wastes energy, and the extra turbulence it creates can shear floc apart. Many plants operate near 2 mg/L, but the target is set by the plant's own process requirements.",
    },
    {
      id: "mixed-liquor",
      label: "Mixed Liquor Zone",
      color: "#8B5CF6",
      function:
        "Holds the aerated blend of wastewater and biomass where microorganisms consume dissolved and colloidal organic matter.",
      operatorLens:
        "Trend MLSS, settleability and the visual appearance of the floc and surface foam.",
      examConnection:
        "MLSS is the total suspended solids in the aeration basin. MLVSS is the volatile portion, used as a proxy for biomass. It is not purely living organisms because it also includes dead cells and other volatile organic material.",
    },
    {
      id: "ras-line",
      label: "Return Activated Sludge Line",
      color: "#F97316",
      function:
        "Returns settled biomass from the secondary clarifier to the head of the basin to maintain the microbial population.",
      operatorLens:
        "Confirm return flow is actually moving before adjusting rates, and coordinate changes with clarifier blanket trends.",
      examConnection:
        "Return activated sludge maintains the inventory of organisms. Without it, biomass would simply wash out of the system.",
    },
    {
      id: "was-line",
      label: "Waste Activated Sludge Line",
      color: "#B45309",
      function:
        "Removes surplus biomass from the system so the sludge inventory and sludge age stay within the target range.",
      operatorLens:
        "Wasting is the primary lever for controlling sludge age. Change it gradually and watch the response over days, not hours.",
      examConnection:
        "Wasting controls sludge age and the food-to-microorganism ratio. Returning sludge maintains inventory; wasting reduces it.",
    },
  ],

  stages: [
    {
      id: "blend",
      step: "01",
      title: "Blend mixed liquor",
      description:
        "Primary effluent joins return activated sludge at the basin inlet, creating the mixed liquor that carries the biomass.",
      accent: "#38BDF8",
    },
    {
      id: "aerate",
      step: "02",
      title: "Transfer oxygen",
      description:
        "Fine bubbles rise through the basin, dissolving oxygen into the liquid and keeping solids suspended.",
      accent: "#34D399",
    },
    {
      id: "metabolize",
      step: "03",
      title: "Consume organic load",
      description:
        "Microorganisms use the dissolved oxygen to break down organic matter and grow new cell mass that settles well.",
      accent: "#8B5CF6",
    },
    {
      id: "control",
      step: "04",
      title: "Control inventory",
      description:
        "Return sludge maintains the population while waste sludge removes the surplus grown each day.",
      accent: "#F97316",
    },
  ],

  formulas: [
    {
      id: "fm-ratio",
      name: "Food-to-microorganism ratio",
      expression: "F/M = (Q x BOD / 1000) / (V x MLVSS / 1000)",
      expressionUs: "F/M = (Q x BOD x 8.34) / (V x MLVSS x 8.34)",
      terms: [
        { symbol: "F/M", meaning: "Food-to-microorganism ratio", units: "kg BOD per kg MLVSS per day" },
        { symbol: "Q", meaning: "Flow entering the aeration basin, not including return sludge", units: "m3/day" },
        { symbol: "BOD", meaning: "BOD concentration entering the biological process", units: "mg/L" },
        { symbol: "V", meaning: "Aeration basin volume", units: "m3" },
        { symbol: "MLVSS", meaning: "Mixed liquor volatile suspended solids", units: "mg/L" },
      ],
      worked: {
        scenario:
          "A basin receives 8,000 m3/day with a BOD of 150 mg/L. The basin volume is 3,000 m3 and MLVSS is 2,000 mg/L.",
        substitution:
          "Food = 8,000 x 150 / 1,000 = 1,200 kg/day. Microorganisms = 3,000 x 2,000 / 1,000 = 6,000 kg. F/M = 1,200 / 6,000",
        result: "F/M = 0.20 kg BOD per kg MLVSS per day",
      },
      workedUs: {
        scenario:
          "The same basin in US units: 2.0 MGD at 150 mg/L BOD, 0.75 MG volume, 2,000 mg/L MLVSS.",
        substitution:
          "Food = 2.0 x 150 x 8.34 = 2,502 lb/day. Microorganisms = 0.75 x 2,000 x 8.34 = 12,510 lb. F/M = 2,502 / 12,510",
        result: "F/M = 0.20 lb BOD per lb MLVSS per day",
      },
      interpretation:
        "In metric, dividing by 1,000 converts m3 and mg/L into kilograms. In US units the 8.34 lb/gal factor does the same job, and it cancels out of the ratio. Use the flow entering the process, not the flow including return sludge. A low F/M means many organisms for the available food, though a very low F/M held for a long time can bring its own settling problems.",
    },
    {
      id: "sludge-age",
      name: "Sludge age (solids retention time)",
      expression: "Sludge age = Solids held in the system / Solids leaving per day",
      terms: [
        { symbol: "Sludge age", meaning: "Average time a solids particle stays in the system, also called SRT or mean cell residence time", units: "days" },
        { symbol: "Solids held", meaning: "Mass of suspended solids in the aeration basin, found from V x MLSS / 1000", units: "kg" },
        { symbol: "Solids leaving", meaning: "Mass removed daily as waste activated sludge plus solids lost with the effluent", units: "kg/day" },
      ],
      worked: {
        scenario:
          "A 3,000 m3 basin runs at 2,500 mg/L MLSS. Wasting removes 700 kg/day and about 50 kg/day leaves with the effluent.",
        substitution:
          "Solids held = 3,000 x 2,500 / 1,000 = 7,500 kg. Sludge age = 7,500 / (700 + 50) = 7,500 / 750",
        result: "Sludge age = 10 days",
      },
      interpretation:
        "Note the system boundary. This example counts only the solids in the aeration basin, which is the common simplified form used on many exams. A full-system SRT also includes the solids held in the secondary clarifier, so read each question carefully. Increasing the wasting rate lowers sludge age. Nitrification generally needs a longer sludge age, especially in cold weather.",
    },
    {
      id: "detention-time",
      name: "Hydraulic detention time",
      expression: "HRT = 24 x V / Q",
      terms: [
        { symbol: "HRT", meaning: "Nominal hydraulic retention time based on influent flow", units: "hours" },
        { symbol: "V", meaning: "Basin volume", units: "m3" },
        { symbol: "Q", meaning: "Flow rate through the basin", units: "m3/day" },
        { symbol: "24", meaning: "Converts days into hours", units: "hours per day" },
      ],
      worked: {
        scenario: "A 3,000 m3 basin receives 8,000 m3/day.",
        substitution: "HRT = 24 x 3,000 / 8,000 = 72,000 / 8,000",
        result: "HRT = 9.0 hours",
      },
      workedUs: {
        scenario: "The same basin in US units: 750,000 gallons receiving 2.0 MGD.",
        substitution:
          "Q = 2,000,000 / 24 = 83,333 gal/hr. HRT = 750,000 / 83,333",
        result: "HRT = 9.0 hours",
      },
      interpretation:
        "This is nominal detention time based on the influent flow. If a question asks for the actual time through the basin including return sludge, add the return flow to Q. Detention time follows the water and is measured in hours. Sludge age follows the solids and is measured in days, because return sludge keeps recycling the biomass.",
    },
    {
      id: "svi",
      name: "Sludge volume index",
      expression: "SVI = (Settled volume after 30 minutes x 1000) / MLSS",
      terms: [
        { symbol: "SVI", meaning: "Volume occupied by one gram of sludge after settling for 30 minutes", units: "mL/g" },
        { symbol: "Settled volume", meaning: "Sludge volume read from a 1 litre settleometer after 30 minutes", units: "mL/L" },
        { symbol: "1000", meaning: "Converts milligrams into grams", units: "mg per g" },
        { symbol: "MLSS", meaning: "Mixed liquor suspended solids concentration", units: "mg/L" },
      ],
      worked: {
        scenario:
          "A settleometer reads 250 mL/L after 30 minutes. The MLSS is 2,500 mg/L.",
        substitution: "SVI = (250 x 1,000) / 2,500 = 250,000 / 2,500",
        result: "SVI = 100 mL/g",
      },
      interpretation:
        "SVI describes how well the sludge settles and compacts. Lower values generally indicate dense, fast settling sludge, while high values indicate sludge that will not compact and may be bulking. Many plants treat roughly 80 to 120 mL/g as a well settling range, but compare against your own plant history rather than a universal target.",
    },
  ],
  symptoms: [
    {
      id: "low-do",
      observation: "Dissolved oxygen falls below the target across the basin",
      likelyCauses: [
        "Increased organic or hydraulic load",
        "Fouled or damaged diffusers reducing transfer",
        "Blower capacity or air valve restriction",
        "A drifting dissolved oxygen probe reading high",
      ],
      examPoint:
        "Sustained low dissolved oxygen can favour filamentous organisms, which settle poorly and can cause bulking in the clarifier.",
    },
    {
      id: "bulking",
      observation: "Sludge settles slowly and the blanket rises in the clarifier",
      likelyCauses: [
        "Low dissolved oxygen",
        "Low food-to-microorganism ratio over a long period",
        "Nutrient deficiency",
        "Septic or unbalanced influent",
      ],
      examPoint:
        "Bulking sludge is usually a settleability problem created in the aeration basin, even though it is first noticed in the clarifier.",
    },
    {
      id: "dark-foam",
      observation: "Thick dark brown foam covers much of the surface",
      likelyCauses: [
        "Sludge age longer than the process needs",
        "Insufficient wasting",
        "Hydrophobic filamentous organisms such as Gordonia or Microthrix",
        "Fats, oils and grease entering the process",
      ],
      examPoint:
        "Light billowy white foam usually points to young sludge from start-up, over-wasting or a high food-to-microorganism ratio. Dark stable foam often accompanies long sludge age, but foam colour alone does not confirm sludge age because foam-forming organisms and grease produce it too.",
    },
    {
      id: "pin-floc",
      observation: "Tiny dark pinpoint floc leaves a turbid effluent while the sludge settles quickly",
      likelyCauses: [
        "Sludge age too long and the process is near starvation conditions",
        "Insufficient wasting",
        "A very low food-to-microorganism ratio held for an extended period",
        "Excessive aeration turbulence shearing the floc apart",
      ],
      examPoint:
        "Pin floc and straggler floc sit at opposite ends of the sludge age range and have opposite corrections. Pin floc is small, dark and associated with old sludge, so the usual response is to waste more. Straggler floc is light and fluffy and is associated with young sludge, so the usual response is to waste less. Treating one as the other makes the problem worse.",
    },
    {
      id: "straggler-floc",
      observation:
        "Light fluffy floc particles drift over the clarifier weir while the bulk sludge still settles",
      likelyCauses: [
        "Sludge age too short",
        "Over-wasting",
        "Start-up or recovery after a washout",
        "A high food-to-microorganism ratio",
      ],
      examPoint:
        "Straggler floc indicates young sludge that has not yet formed dense settleable particles. The usual correction is to reduce wasting so inventory can build, which is the opposite of the correction for pin floc. Confusing the two leads an operator to apply exactly the wrong fix.",
    },
  ],

  seo: {
    title: "How an Activated Sludge Aeration Basin Works | Echelon Institute",
    description:
      "Interactive 3D aeration basin for water and wastewater operators. See diffusers, mixed liquor, RAS and WAS, with worked F/M, sludge age and detention time calculations for certification exams.",
    h1: "Inside an Activated Sludge Aeration Basin",
    sections: [
      {
        heading: "What an Aeration Basin Does",
        paragraphs: [
          "The aeration basin is the biological heart of the activated sludge process. Primary effluent enters the basin and mixes with return activated sludge to form mixed liquor. Air is supplied through diffusers so that microorganisms have the dissolved oxygen they need to consume dissolved and colloidal organic matter.",
          "The organisms grow as they feed. That new growth forms floc particles heavy enough to settle in the secondary clarifier that follows. The clarified water continues toward disinfection while the settled biomass is either returned to the basin or wasted from the system.",
        ],
      },
      {
        heading: "Mixed Liquor, MLSS and MLVSS",
        paragraphs: [
          "Mixed liquor is the combination of incoming wastewater and the biological solids held in the basin. Mixed liquor suspended solids, written as MLSS, is the total concentration of suspended solids in that blend. Mixed liquor volatile suspended solids, written as MLVSS, is the volatile portion of those solids and is used as a proxy for biomass. It is not a direct count of living organisms, because it also includes dead cells and other volatile organic material.",
          "Operators trend both values because process control decisions depend on knowing how much biomass is working in the basin. Calculations such as the food-to-microorganism ratio use MLVSS because it better represents the organic fraction rather than inert mineral material. MLVSS is a proxy rather than a direct count of living organisms, since it also includes dead cells and other volatile organic matter.",
        ],
      },
      {
        heading: "Return Sludge and Waste Sludge Do Different Jobs",
        paragraphs: [
          "Return activated sludge, abbreviated RAS, carries settled biomass from the secondary clarifier back to the head of the aeration basin. Its job is to maintain the microbial population. Without return sludge the organisms would simply wash out with the flow.",
          "Waste activated sludge, abbreviated WAS, removes surplus biomass from the system entirely. Its job is to control how much inventory is held and therefore how old the sludge becomes. This distinction appears frequently on certification exams because the two streams look similar on a drawing but serve opposite purposes.",
        ],
      },
      {
        heading: "Dissolved Oxygen Control",
        paragraphs: [
          "Dissolved oxygen is monitored in the basin so that air delivery can be matched to the biological demand. Supplying too little oxygen can allow filamentous organisms to dominate, which produces a sludge that will not settle properly in the clarifier. Supplying far more than needed wastes a large amount of energy, since aeration is typically the single largest electrical load at a treatment plant.",
          "Fine bubble diffusers transfer oxygen more efficiently than coarse bubble systems because smaller bubbles provide more surface area for a given volume of air. Fouled or torn diffusers reduce that efficiency and often show up first as uneven surface boil patterns or rising header pressure.",
        ],
      },
      {
        heading: "Calculations Operators Are Expected to Know",
        paragraphs: [
          "Three calculations appear repeatedly in certification examinations for this process. The food-to-microorganism ratio compares the organic load entering the basin against the mass of organisms available to treat it. Sludge age, also called mean cell residence time, describes how long solids remain in the system. Hydraulic detention time describes how long the liquid remains in the basin.",
          "Sludge age and detention time are easy to confuse. Detention time follows the water, which passes through in a matter of hours. Sludge age follows the solids, which are continually returned and therefore stay in the system for days. Each worked example in this lab shows the full formula, what every term means, and the substitution used to reach the answer.",
        ],
      },
      {
        heading: "Common Problems and What They Indicate",
        paragraphs: [
          "Bulking sludge settles slowly and causes the blanket to rise in the secondary clarifier. It is usually created by conditions in the aeration basin such as sustained low dissolved oxygen or a long period at a low food-to-microorganism ratio, even though the symptom is first observed downstream.",
          "Pin floc and straggler floc are easy to confuse and have opposite corrections. Pin floc is tiny, dark and pinpoint sized, and it is associated with old sludge, a very low food-to-microorganism ratio and insufficient wasting. Straggler floc is light and fluffy, and it is associated with young sludge and over-wasting. Treating pin floc as though it were straggler floc, by wasting less, drives sludge age even higher and makes the problem worse.",
          "Foam appearance offers another clue but is not proof on its own. Light billowy white foam commonly appears during start-up or when the sludge is young. Dark stable foam can accompany a long sludge age, but hydrophobic filamentous organisms and incoming fats, oils and grease also produce it, so confirm with settleability testing and process data rather than colour alone.",
        ],
      },
      {
        heading: "Settleability Testing and Sludge Volume Index",
        paragraphs: [
          "The 30 minute settleability test is the most common bench check associated with aeration basin health. A one litre sample of mixed liquor is allowed to settle in a settleometer and the sludge volume is read after 30 minutes. That reading, combined with the MLSS concentration, produces the sludge volume index.",
          "Sludge volume index expresses the volume occupied by one gram of sludge after settling, in millilitres per gram. Low values generally indicate dense sludge that settles and compacts quickly. High values indicate sludge that will not compact, which is the signature of bulking. Compare results against the plant's own history rather than a single universal number, since each process has a different normal range.",
        ],
      },
      {
        heading: "Nitrification and Alkalinity",
        paragraphs: [
          "When conditions allow, nitrifying organisms in the aeration basin convert ammonia to nitrite and then to nitrate. Nitrification requires a longer sludge age than simple organic removal, enough dissolved oxygen, suitable pH and sufficient alkalinity. Cold water slows the nitrifying organisms considerably, which is why many Canadian plants need a longer sludge age in winter to keep nitrifying.",
          "Nitrification consumes alkalinity and can lower pH if the incoming wastewater does not carry enough buffering capacity. Operators monitor alkalinity for this reason, because a falling pH can slow the same nitrifying organisms the process depends on. Nitrification also increases oxygen demand in the basin beyond what carbonaceous removal alone would require.",
        ],
      },
    ],
    faq: [
      {
        question: "What is the difference between pin floc and straggler floc?",
        answer:
          "Pin floc is tiny, dark and pinpoint sized and indicates old sludge with a very low food-to-microorganism ratio, so the usual correction is to waste more. Straggler floc is light and fluffy and indicates young sludge, so the usual correction is to waste less. They have opposite causes and opposite fixes.",
      },
      {
        question: "How do you calculate sludge volume index?",
        answer:
          "Multiply the 30 minute settled sludge volume in millilitres per litre by 1,000, then divide by the MLSS in milligrams per litre. The answer is in millilitres per gram. Higher values indicate sludge that will not compact well.",
      },
      {
        question: "Why does nitrification consume alkalinity?",
        answer:
          "Converting ammonia to nitrate is an acid producing reaction, so it uses up the alkalinity that buffers the wastewater. If alkalinity runs short the pH falls, which can slow the same nitrifying organisms the process relies on. Nitrification also raises the oxygen demand in the basin.",
      },
      {
        question: "What is the difference between RAS and WAS?",
        answer:
          "Return activated sludge is recycled back to the aeration basin to maintain the microbial population. Waste activated sludge is removed from the system to control the total sludge inventory and sludge age. One maintains the organisms, the other reduces them.",
      },
      {
        question: "What is MLSS in wastewater treatment?",
        answer:
          "MLSS stands for mixed liquor suspended solids, the total concentration of suspended solids in the aeration basin. MLVSS, the volatile portion, approximates the biologically active fraction and is used in food-to-microorganism calculations.",
      },
      {
        question: "How do you calculate sludge age?",
        answer:
          "Divide the pounds of suspended solids held in the aeration system by the pounds of solids leaving each day through wasting and the effluent. The answer is expressed in days. Increasing the wasting rate lowers sludge age.",
      },
      {
        question: "Why does low dissolved oxygen cause bulking sludge?",
        answer:
          "Sustained low dissolved oxygen favours filamentous organisms over the floc forming organisms that settle well. The filaments bridge between floc particles and keep them from compacting, so the sludge settles slowly and the clarifier blanket rises.",
      },
      {
        question: "Is detention time the same as sludge age?",
        answer:
          "No. Hydraulic detention time tracks how long the liquid stays in the basin, usually a matter of hours. Sludge age tracks how long solids stay in the system, usually several days, because return activated sludge keeps recycling the biomass.",
      },
    ],
  },
};

/* ────────────────────────────────────────────────────────────────────────────
 * Registry
 * ──────────────────────────────────────────────────────────────────────────── */

export const EQUIPMENT_REGISTRY: readonly EquipmentDefinition[] = [AERATION_BASIN];

export function findEquipment(slug: string): EquipmentDefinition | undefined {
  return EQUIPMENT_REGISTRY.find(item => item.slug === slug);
}

/** Every Equipment Lab route that should be crawlable and in the sitemap. */
export function equipmentRoutes(): string[] {
  return EQUIPMENT_REGISTRY.map(item => `/equipment-lab/${item.slug}`);
}
