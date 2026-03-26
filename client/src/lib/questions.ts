// ECHELON AI TUTOR — Question Bank
// Ontario Water/Wastewater Operator Certification Exam Prep

export interface Step {
  l: string;
  c: string;
}

export interface Question {
  id: number;
  module: string;
  type: "calculation" | "conceptual" | "recall";
  difficulty: "easy" | "medium" | "hard";
  q: string;
  formula?: string;
  options: string[];
  correct: number;
  explanation: string;
  wrongExp?: Record<number, string>;
  steps?: Step[];
  tip: string;
}

export interface HistoryEntry {
  questionId: number;
  module: string;
  difficulty: "easy" | "medium" | "hard";
  correct: boolean;
  confidence: number;
  selectedOption: number;
  wrongExplanation: string | null;
}

export interface PatternInsight {
  module: string;
  wrongCount: number;
  total: number;
  pct: number;
}

export const QUESTIONS: Question[] = [
  // ── DISINFECTION ──
  {
    id: 1,
    module: "Disinfection",
    type: "calculation",
    difficulty: "easy",
    q: "A plant doses 3.5 mg/L of chlorine. The chlorine demand is 2.1 mg/L. What is the chlorine residual?",
    formula: "Chlorine Residual = Dose − Demand",
    options: ["0.6 mg/L", "1.4 mg/L", "2.1 mg/L", "5.6 mg/L"],
    correct: 1,
    explanation:
      "Residual = 3.5 − 2.1 = 1.4 mg/L. O. Reg. 170/03 requires a minimum free chlorine residual throughout the distribution system at all times.",
    wrongExp: {
      0: "You subtracted dose from demand — it should be demand from dose.",
      2: "That's the demand value, not the residual.",
      3: "You added dose and demand instead of subtracting.",
    },
    steps: [
      { l: "Formula", c: "Residual = Dose − Demand" },
      { l: "Substitute", c: "= 3.5 − 2.1" },
      { l: "Answer", c: "= 1.4 mg/L" },
    ],
    tip: "Memorise: Residual = Dose − Demand. The residual is what's left over after the water uses up some chlorine.",
  },
  {
    id: 2,
    module: "Disinfection",
    type: "calculation",
    difficulty: "medium",
    q: "A plant treats 8,000 m³/day and requires a chlorine dose of 1.5 mg/L. How many kg of chlorine are needed daily?",
    formula: "Mass (kg) = Flow (m³/day) × Dose (mg/L) × 0.001",
    options: ["1.2 kg/day", "12 kg/day", "120 kg/day", "1,200 kg/day"],
    correct: 1,
    explanation:
      "Mass = 8,000 × 1.5 × 0.001 = 12 kg/day. The factor 0.001 converts mg/L × m³ into kg (since 1 mg/L in 1 m³ = 1 gram = 0.001 kg).",
    wrongExp: {
      0: "You divided by 1,000 twice — only one conversion is needed.",
      2: "You multiplied by 1 instead of 0.001 for unit conversion.",
      3: "You forgot the 0.001 conversion entirely and just multiplied flow × dose.",
    },
    steps: [
      { l: "Formula", c: "Mass = Flow × Dose × 0.001" },
      { l: "Substitute", c: "= 8,000 × 1.5 × 0.001" },
      { l: "Answer", c: "= 12 kg/day" },
    ],
    tip: "Flow (m³/day) × Dose (mg/L) × 0.001 = kg/day. This formula appears on almost every Ontario operator exam.",
  },
  {
    id: 3,
    module: "Disinfection",
    type: "conceptual",
    difficulty: "easy",
    q: "What is the most commonly used chemical for disinfection in Ontario water systems?",
    options: [
      "Ozone",
      "Ultraviolet light",
      "Sodium hypochlorite",
      "Potassium permanganate",
    ],
    correct: 2,
    explanation:
      "Sodium hypochlorite (NaOCl, liquid bleach) is the most widely used disinfectant in Ontario due to its effectiveness, ease of handling vs chlorine gas, and low cost.",
    wrongExp: {
      0: "Ozone is used in some large systems but is not the most common.",
      1: "UV is growing but is secondary to chlorination in Ontario.",
      3: "KMnO₄ is used for iron/manganese removal, not primary disinfection.",
    },
    tip: "Sodium hypochlorite is safer to handle than chlorine gas and is used in most small-to-medium Ontario systems.",
  },
  // ── HYDRAULICS ──
  {
    id: 4,
    module: "Hydraulics",
    type: "calculation",
    difficulty: "medium",
    q: "A pump fills a 250,000 L reservoir in 4 hours and 10 minutes. What is the average flow rate in L/min?",
    formula: "Flow Rate = Volume ÷ Time (in minutes)",
    options: ["600 L/min", "1,000 L/min", "1,041 L/min", "60,000 L/min"],
    correct: 1,
    explanation:
      "Time = (4×60)+10 = 250 min. Flow = 250,000 ÷ 250 = 1,000 L/min. Always convert time to consistent units before calculating.",
    wrongExp: {
      0: "You converted 4 hours to 400 minutes — 4 hrs = 240 min + 10 = 250 min.",
      2: "You used 240 min (forgot the extra 10 minutes).",
      3: "You divided by hours instead of converting to minutes first.",
    },
    steps: [
      { l: "Convert time", c: "4 hrs × 60 + 10 min = 250 min" },
      { l: "Apply formula", c: "Flow = 250,000 L ÷ 250 min" },
      { l: "Answer", c: "= 1,000 L/min" },
    ],
    tip: "Unit conversion is the most common error on flow rate questions. Always convert time to minutes or hours first — never mix units.",
  },
  {
    id: 5,
    module: "Hydraulics",
    type: "calculation",
    difficulty: "hard",
    q: "A sedimentation basin holds 1,800,000 L. Flow rate is 3,600 m³/hr. What is the hydraulic detention time (HDT) in hours?",
    formula: "HDT = Volume ÷ Flow Rate (same units)",
    options: ["0.5 hours", "2 hours", "5 hours", "0.002 hours"],
    correct: 0,
    explanation:
      "Convert: 1,800,000 L = 1,800 m³. HDT = 1,800 ÷ 3,600 = 0.5 hours (30 min). Always ensure volume and flow are in matching units.",
    wrongExp: {
      1: "You divided flow by volume — it should be volume divided by flow.",
      2: "You forgot to convert litres to m³ (1,800,000 L = 1,800 m³, not 18,000).",
      3: "You misplaced a decimal during unit conversion.",
    },
    steps: [
      { l: "Convert volume", c: "1,800,000 L ÷ 1,000 = 1,800 m³" },
      { l: "Apply formula", c: "HDT = 1,800 ÷ 3,600" },
      { l: "Answer", c: "= 0.5 hours (30 min)" },
    ],
    tip: "HDT = Volume ÷ Flow. Longer HDT means more treatment time — critical for sedimentation and disinfection contact.",
  },
  {
    id: 6,
    module: "Hydraulics",
    type: "conceptual",
    difficulty: "easy",
    q: "What is static head?",
    options: [
      "Energy of motion in water",
      "Pressure due to friction losses",
      "Pressure due to elevation of water",
      "Pressure due to excess sludge",
    ],
    correct: 2,
    explanation:
      "Static head is the pressure created by the weight/elevation of water above a reference point. Dynamic head includes friction losses. Understanding head is essential for pump sizing.",
    wrongExp: {
      0: "That describes velocity head (kinetic energy), not static head.",
      1: "That describes friction head or dynamic head losses.",
      3: "Sludge pressure is not a standard hydraulic term — this is a distractor.",
    },
    tip: "Static = stationary water pressure from height. Dynamic = pressure lost to friction when water moves.",
  },
  // ── REGULATIONS ──
  {
    id: 7,
    module: "Regulations",
    type: "recall",
    difficulty: "easy",
    q: "Which Ontario regulation governs the operational requirements of drinking water systems?",
    options: [
      "O. Reg. 128/04",
      "O. Reg. 129/04",
      "O. Reg. 170/03",
      "Safe Drinking Water Act 2002",
    ],
    correct: 2,
    explanation:
      "O. Reg. 170/03 (Drinking Water Systems) governs day-to-day operational requirements including sampling schedules, monitoring, and reporting. The SDWA 2002 is the overarching legislation.",
    wrongExp: {
      0: "O. Reg. 128/04 covers operator certification, not system operations.",
      1: "O. Reg. 129/04 covers sewage works operator licensing.",
      3: "The SDWA is the parent Act — O. Reg. 170/03 is the specific operational regulation.",
    },
    tip: "O. Reg. 170/03 = the operator's daily bible. Know Schedule A (operational checks) and Schedule B (sampling requirements) inside out.",
  },
  {
    id: 8,
    module: "Regulations",
    type: "conceptual",
    difficulty: "medium",
    q: "An operator notices the chlorine residual has dropped to zero at a sample point. Under O. Reg. 170/03, what must happen?",
    options: [
      "Increase chlorine dose and re-sample",
      "Issue a boil water advisory immediately",
      "Report an Adverse Water Quality Incident (AWQI) to the MOE",
      "Flush the distribution system",
    ],
    correct: 2,
    explanation:
      "A zero chlorine residual is an Adverse Water Quality Incident (AWQI) that must be reported to the Ministry of Environment within 24 hours. The operator must also investigate the cause and take corrective action.",
    wrongExp: {
      0: "While increasing dose may be part of the response, the regulatory reporting obligation must happen first.",
      1: "A boil water advisory may follow but the immediate obligation is AWQI reporting.",
      3: "Flushing may be part of corrective action but is not the first regulatory obligation.",
    },
    tip: "Zero residual = AWQI. Report first, investigate second, correct third. The 24-hour reporting window is non-negotiable.",
  },
  // ── MATH ──
  {
    id: 9,
    module: "Math & Calculations",
    type: "calculation",
    difficulty: "medium",
    q: "A rectangular tank is 15 m long, 6 m wide, and 4 m deep. How many litres does it hold when full?",
    formula: "Volume = L × W × D × 1,000",
    options: ["36,000 L", "360,000 L", "3,600,000 L", "25 L"],
    correct: 1,
    explanation:
      "Volume = 15 × 6 × 4 = 360 m³. Convert: 360 × 1,000 = 360,000 L. Always multiply all three dimensions, then convert m³ to litres.",
    wrongExp: {
      0: "You forgot to multiply by 1,000 to convert m³ to litres.",
      2: "You multiplied by 10,000 instead of 1,000 during conversion.",
      3: "You only multiplied two dimensions instead of all three.",
    },
    steps: [
      { l: "Calculate m³", c: "15 × 6 × 4 = 360 m³" },
      { l: "Convert to litres", c: "360 × 1,000 = 360,000 L" },
      { l: "Answer", c: "360,000 L" },
    ],
    tip: "1 m³ = 1,000 litres. Write this on your exam sheet the moment the exam starts.",
  },
  {
    id: 10,
    module: "Math & Calculations",
    type: "calculation",
    difficulty: "hard",
    q: "A plant pumps 4,500 m³/day. If the pump runs 18 hours per day, what is the pumping rate in L/min?",
    formula: "Rate (L/min) = Volume (L) ÷ Time (min)",
    options: ["250 L/min", "4,167 L/min", "4,167 m³/hr", "75,000 L/hr"],
    correct: 1,
    explanation:
      "Volume = 4,500 m³ = 4,500,000 L. Time = 18 hrs × 60 = 1,080 min. Rate = 4,500,000 ÷ 1,080 = 4,167 L/min.",
    wrongExp: {
      0: "Check your time conversion: 18 hrs × 60 min/hr = 1,080 min, not 18,000.",
      2: "That's a flow rate unit (m³/hr) not L/min — check your unit conversion.",
      3: "You stopped at L/hr instead of converting to L/min.",
    },
    steps: [
      { l: "Convert volume", c: "4,500 m³ × 1,000 = 4,500,000 L" },
      { l: "Convert time", c: "18 hrs × 60 = 1,080 min" },
      { l: "Calculate rate", c: "4,500,000 ÷ 1,080 = 4,167 L/min" },
    ],
    tip: "Multi-step conversions: always convert volume to litres AND time to minutes before dividing.",
  },
  // ── HEALTH & SAFETY ──
  {
    id: 11,
    module: "Health & Safety",
    type: "recall",
    difficulty: "easy",
    q: "What are the two most critical safety concerns when entering a confined space?",
    options: [
      "Lack of oxygen and presence of hazardous gases",
      "Chlorine residual and turbidity",
      "Bad odours and claustrophobia",
      "Very high or very low temperatures",
    ],
    correct: 0,
    explanation:
      "Confined spaces pose two critical risks: oxygen deficiency (below 19.5% O₂ causes unconsciousness) and toxic/flammable gases (H₂S, methane, chlorine). Always test the atmosphere before entry.",
    wrongExp: {
      1: "Chlorine residual and turbidity are water quality parameters, not confined space hazards.",
      2: "Odour and anxiety are symptoms, not the primary hazards — by the time you smell H₂S at dangerous levels it may be too late.",
      3: "Temperature is a concern but not the primary life-threatening hazard.",
    },
    tip: "Never enter a confined space without atmospheric testing. H₂S can knock you unconscious before you can react.",
  },
  {
    id: 12,
    module: "Health & Safety",
    type: "conceptual",
    difficulty: "medium",
    q: "An operator smells hydrogen sulphide at the entrance of a deep confined space. What should they do?",
    options: [
      "Proceed quickly as short exposure is safe",
      "Vent the space while working inside",
      "Do not enter — test atmosphere and only enter with full safety equipment when clear",
      "H₂S is only an irritant — proceed with the task",
    ],
    correct: 2,
    explanation:
      "H₂S is extremely dangerous — it deadens your sense of smell at high concentrations, so you may not detect lethal levels. Never enter until atmosphere is tested clear and all safety equipment is in place.",
    wrongExp: {
      0: "There is no safe short exposure to H₂S in confined space concentrations — it can cause immediate loss of consciousness.",
      1: "Venting while working inside is extremely dangerous — you must not be inside during venting.",
      3: "H₂S is not merely an irritant — at >100 ppm it causes rapid unconsciousness and death.",
    },
    tip: "H₂S: Stop. Don't enter. Ventilate. Test. Only enter with SCBA and a safety watch outside. No exceptions.",
  },
  // ── WASTEWATER ──
  {
    id: 13,
    module: "Wastewater",
    type: "recall",
    difficulty: "easy",
    q: "What does BOD stand for and what does it measure?",
    options: [
      "Biological Oxygen Demand — amount of oxygen fish need",
      "Biochemical Oxygen Demand — organic strength of wastewater",
      "Basic Oxygen Dosage — chlorine required for treatment",
      "Bacterial Oxygen Deficit — lack of bacteria in water",
    ],
    correct: 1,
    explanation:
      "BOD (Biochemical Oxygen Demand) measures the amount of dissolved oxygen microorganisms need to break down organic matter over 5 days at 20°C. Higher BOD = stronger (more polluted) wastewater.",
    wrongExp: {
      0: "BOD is not about fish oxygen needs — it measures microbial oxygen consumption during organic breakdown.",
      2: "There's no such thing as 'Basic Oxygen Dosage' — this is a fabricated distractor.",
      3: "BOD measures oxygen demand, not bacterial deficit.",
    },
    tip: "BOD₅ = 5-day test at 20°C. It's the standard measure of wastewater organic strength. High BOD = high pollution load.",
  },
  {
    id: 14,
    module: "Wastewater",
    type: "calculation",
    difficulty: "medium",
    q: "A wastewater tank is 9.6 m long and 7.6 m wide. The level drops 0.3 m in one hour. How many litres flow out per hour?",
    formula: "Volume = L × W × Drop × 1,000",
    options: ["2,650 L", "17,328 L", "21,888 L", "219 L"],
    correct: 2,
    explanation:
      "Volume = 9.6 × 7.6 × 0.3 = 21.888 m³. Convert: 21.888 × 1,000 = 21,888 L/hr.",
    wrongExp: {
      0: "You may have only multiplied two dimensions — all three (L, W, drop) are needed.",
      1: "You multiplied L × W × depth of tank instead of L × W × drop rate.",
      3: "You forgot to multiply by 1,000 to convert m³ to litres.",
    },
    steps: [
      { l: "Calculate volume", c: "9.6 × 7.6 × 0.3 = 21.888 m³" },
      { l: "Convert", c: "21.888 × 1,000 = 21,888 L" },
      { l: "Answer", c: "21,888 L/hr" },
    ],
    tip: "The 'drop' is your third dimension — think of it as the depth of water that flowed out.",
  },
  // ── WATER QUALITY ──
  {
    id: 15,
    module: "Water Quality",
    type: "conceptual",
    difficulty: "easy",
    q: "What is the impact of lead in drinking water?",
    options: [
      "It causes staining of clothes",
      "It causes filters to plug up",
      "It is harmful to human health",
      "It is highly corrosive to pipes",
    ],
    correct: 2,
    explanation:
      "Lead is a toxic heavy metal with no safe exposure level, especially harmful to children — causing neurological damage and developmental issues. Ontario's MAC is 0.010 mg/L under the Ontario Drinking Water Quality Standards.",
    wrongExp: {
      0: "Lead does not cause visible staining — that's typically iron or manganese.",
      1: "Lead does not plug filters — that's more characteristic of suspended solids or iron floc.",
      3: "While lead can corrode pipes, the primary concern is its toxicity to human health.",
    },
    tip: "Lead: no safe level. Most exposure comes from lead service lines and older plumbing. The corrosion control program targets this.",
  },
];

// ── ADAPTIVE ENGINE ──────────────────────────────────────────────────────────
export function getNextQuestion(
  history: HistoryEntry[],
  allQuestions: Question[]
): Question | null {
  if (history.length === 0) return allQuestions[0];

  // Find weak modules (>50% wrong in last 6 attempts)
  const recentHistory = history.slice(-6);
  const moduleCounts: Record<string, { wrong: number; total: number }> = {};
  recentHistory.forEach((h) => {
    if (!moduleCounts[h.module]) moduleCounts[h.module] = { wrong: 0, total: 0 };
    moduleCounts[h.module].total++;
    if (!h.correct) moduleCounts[h.module].wrong++;
  });

  const weakModules = Object.entries(moduleCounts)
    .filter(([, v]) => v.wrong / v.total >= 0.5)
    .map(([k]) => k);

  const answered = new Set(history.map((h) => h.questionId));
  const unanswered = allQuestions.filter((q) => !answered.has(q.id));
  if (unanswered.length === 0) return null;

  // Prioritise weak module questions
  if (weakModules.length > 0) {
    const weakQ = unanswered.filter((q) => weakModules.includes(q.module));
    if (weakQ.length > 0) {
      const easy = weakQ.filter((q) => q.difficulty === "easy");
      return easy.length > 0 ? easy[0] : weakQ[0];
    }
  }

  return unanswered[0];
}

export function getPatternInsights(
  history: HistoryEntry[]
): PatternInsight[] | null {
  if (history.length < 3) return null;

  const byModule: Record<
    string,
    { wrong: number; total: number; wrongQs: HistoryEntry[] }
  > = {};
  history.forEach((h) => {
    if (!byModule[h.module])
      byModule[h.module] = { wrong: 0, total: 0, wrongQs: [] };
    byModule[h.module].total++;
    if (!h.correct) {
      byModule[h.module].wrong++;
      byModule[h.module].wrongQs.push(h);
    }
  });

  const patterns = Object.entries(byModule)
    .filter(([, v]) => v.total >= 2 && v.wrong / v.total >= 0.5)
    .map(([module, v]) => ({
      module,
      wrongCount: v.wrong,
      total: v.total,
      pct: Math.round((v.wrong / v.total) * 100),
    }))
    .sort((a, b) => b.pct - a.pct);

  return patterns.length > 0 ? patterns : null;
}
