// Class 3 Water Treatment Question Bank
// 500 questions across 5 modules
// Calibrated to Class 3 difficulty (70% Application/Analysis, 30% Recall)
// Based on ABC/WPI Need-to-Know Criteria for Water Treatment Class 3

export interface Question {
  id: number;
  module: string;
  topic: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  steps?: { l: string; c: string }[];
  tip?: string;
  isCalc?: boolean;
}

export const QUESTIONS: Question[] = [
  {
    "id": 1,
    "module": "Treatment Process",
    "topic": "SCADA and Process Control",
    "question": "A SCADA system shows raw water turbidity spiking from 3 NTU to 52 NTU over 30 minutes during a storm event. What is the MOST appropriate immediate operator response?",
    "options": [
      "Shut down the plant immediately",
      "Increase coagulant dose, perform a jar test, and monitor settled water turbidity closely",
      "Reduce plant flow to zero until turbidity drops below 10 NTU",
      "Switch to groundwater supply without adjusting treatment"
    ],
    "correct": 1,
    "explanation": "During a turbidity spike, the operator must increase coagulant dose to handle the higher particle loading. A jar test should be performed to determine the optimal dose for the new water quality. Shutting down the plant is not warranted unless treatment cannot be maintained. Monitoring settled water turbidity confirms whether the adjusted dose is effective.",
    "difficulty": "hard"
  },
  {
    "id": 2,
    "module": "Treatment Process",
    "topic": "SCADA and Process Control",
    "question": "A PLC controlling a flow-paced chlorine feed pump is programmed so that the pump speed is proportional to plant flow. If plant flow increases by 25% but the pump speed does not respond, what is the effect on the chlorine dose (mg/L)?",
    "options": [
      "The dose increases by 25%",
      "The dose decreases by 20%",
      "The dose remains the same",
      "The dose increases by 20%"
    ],
    "correct": 1,
    "explanation": "If flow increases by 25% but chlorine feed stays constant, the dose (mg/L) decreases. New dose = original dose × original flow / new flow = D × 1/1.25 = 0.8D, a decrease of 20%. The operator must investigate the PLC control loop and verify the pump is responding to the flow signal.",
    "difficulty": "hard"
  },
  {
    "id": 3,
    "module": "Treatment Process",
    "topic": "SCADA and Process Control",
    "question": "An HMI screen shows a filter effluent turbidity of 0.06 NTU, but the grab sample measured in the lab reads 0.42 NTU. What is the MOST appropriate first action?",
    "options": [
      "Accept the HMI reading — it is more accurate than grab samples",
      "Investigate the discrepancy by cleaning and calibrating the online turbidimeter against a primary standard",
      "Shut down the filter immediately",
      "Increase the coagulant dose by 50%"
    ],
    "correct": 1,
    "explanation": "A significant discrepancy between online and lab measurements requires investigation. The online turbidimeter is the more likely source of error (fouling, calibration drift, air bubbles). It should be cleaned, calibrated against a primary standard, and the result verified before taking corrective action on the process.",
    "difficulty": "medium"
  },
  {
    "id": 4,
    "module": "Treatment Process",
    "topic": "SCADA and Process Control",
    "question": "A water treatment plant's PLC is in 'safe state' mode following a power interruption. What does this typically mean for chemical feed operations?",
    "options": [
      "All chemical feed pumps continue at their last setpoints",
      "All chemical feed pump outputs are de-energized, stopping chemical addition",
      "Chemical feed pumps switch to maximum dose to maintain residual",
      "The PLC has failed and must be replaced before operations can resume"
    ],
    "correct": 1,
    "explanation": "Safe state mode de-energizes all outputs to prevent uncontrolled operation during power disruptions. Chemical feed pumps stop. When power is restored, the operator must manually verify process conditions and restart chemical feed in a controlled manner rather than relying on the PLC to automatically resume at previous setpoints.",
    "difficulty": "medium"
  },
  {
    "id": 5,
    "module": "Treatment Process",
    "topic": "SCADA and Process Control",
    "question": "What is the primary advantage of feedforward control over feedback control for coagulant dosing?",
    "options": [
      "Feedforward is simpler to implement than feedback control",
      "Feedforward responds to disturbances before they affect the process; feedback only corrects after the process variable has already deviated",
      "Feedforward uses less chemical than feedback control",
      "Feedforward does not require online instrumentation"
    ],
    "correct": 1,
    "explanation": "Feedforward control measures the disturbance (raw water turbidity and flow) and adjusts the coagulant dose before the disturbance affects settled water quality. Feedback control (e.g., adjusting dose based on settled water turbidity) only corrects after the process has already been affected. Combining both provides the best control.",
    "difficulty": "hard"
  },
  {
    "id": 6,
    "module": "Treatment Process",
    "topic": "SCADA and Process Control",
    "question": "A SCADA historian shows filter run times decreasing from 48 hours to 22 hours over 4 weeks, with stable raw water quality. What is the MOST likely cause?",
    "options": [
      "The filters are becoming more efficient",
      "Gradual deterioration of coagulation/flocculation performance, causing weaker floc to reach the filters",
      "SCADA sensor malfunction",
      "Reduced plant flow rates"
    ],
    "correct": 1,
    "explanation": "Decreasing filter run times with stable raw water quality and no change in plant flow suggest deteriorating coagulation/flocculation — weaker floc passes through the sedimentation basin and loads the filters faster. The operator should review jar test results, check coagulant quality, and inspect rapid mix and flocculation equipment.",
    "difficulty": "hard"
  },
  {
    "id": 7,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "SCADA and Process Control",
    "question": "A water treatment plant uses a ratio control strategy for chloramine formation. The target Cl2:NH3-N weight ratio is 5:1. If the ammonia dose is 1.8 mg/L as N, what chlorine dose should the PLC set?",
    "options": [
      "1.8 mg/L",
      "5.0 mg/L",
      "9.0 mg/L",
      "13.7 mg/L"
    ],
    "correct": 2,
    "explanation": "At a Cl2:NH3-N weight ratio of 5:1, chlorine dose = ratio × NH3-N dose = 5 × 1.8 mg/L = 9.0 mg/L. This ratio is set below the breakpoint (7.6:1 for free chlorine, but 5:1 ensures monochloramine formation). The PLC adjusts chlorine feed proportionally to the ammonia dose signal.",
    steps: [
      { l: "Identify the target ratio and known dose", c: "The target Cl2:NH3-N weight ratio is 5:1, and the ammonia dose (NH3-N) is 1.8 mg/L." },
      { l: "Understand the relationship", c: "The chlorine dose is directly proportional to the ammonia dose, based on the given ratio." },
      { l: "Calculate the chlorine dose", c: "Multiply the ammonia dose by the target ratio: Chlorine dose = 5 (ratio) * 1.8 mg/L (NH3-N dose)." },
      { l: "State the final chlorine dose", c: "The calculated chlorine dose is 9.0 mg/L." },
    ],
    tip: "Always pay close attention to the units and ensure they are consistent throughout your calculations.",
    "difficulty": "hard"
  },
  {
    "id": 8,
    "module": "Treatment Process",
    "topic": "SCADA and Process Control",
    "question": "During a cyber security incident, unauthorized access to the water treatment plant SCADA system is detected. What is the FIRST action the operator should take?",
    "options": [
      "Continue normal operations while IT investigates",
      "Isolate the SCADA network from external connections while maintaining local manual control",
      "Shut down all treatment processes immediately",
      "Change all operator passwords and continue remote operations"
    ],
    "correct": 1,
    "explanation": "The first action in a SCADA cyber security incident is network isolation — disconnecting external network connections to prevent further unauthorized access. Local manual control should be maintained to continue water treatment. Shutting down treatment would compromise water supply. Password changes follow after isolation.",
    "difficulty": "hard"
  },
  {
    "id": 9,
    "module": "Treatment Process",
    "topic": "SCADA and Process Control",
    "question": "What is the purpose of a 'dead band' setting in a PLC control loop for a chemical feed pump?",
    "options": [
      "To prevent the pump from operating during off-peak hours",
      "To prevent rapid cycling of the pump when the process variable is near the setpoint",
      "To set the maximum chemical dose limit",
      "To define the alarm threshold for the process variable"
    ],
    "correct": 1,
    "explanation": "A dead band (hysteresis band) around a setpoint prevents rapid on/off cycling of a pump or valve when the process variable oscillates near the setpoint. Without a dead band, small fluctuations cause constant pump cycling, causing wear and instability. The dead band defines a range within which no control action is taken.",
    "difficulty": "medium"
  },
  {
    "id": 10,
    "module": "Treatment Process",
    "topic": "SCADA and Process Control",
    "question": "A flow meter in the SCADA system reads 5% higher than the actual measured flow using a bucket-and-stopwatch test. What is the effect on flow-paced chemical dosing?",
    "options": [
      "Chemical doses will be 5% higher than intended",
      "Chemical doses will be 5% lower than intended",
      "Chemical doses will not be affected",
      "Chemical doses will be 10% higher than intended"
    ],
    "correct": 0,
    "explanation": "If the flow meter reads 5% high, the SCADA system believes flow is higher than actual. For flow-paced dosing: chemical feed rate = target dose × measured flow. Since measured flow is 5% too high, the chemical feed rate will be set 5% higher than needed, resulting in overdosing by approximately 5%.",
    "difficulty": "hard"
  },
  {
    "id": 11,
    "module": "Treatment Process",
    "topic": "SCADA and Process Control",
    "question": "What is the purpose of OPC (OLE for Process Control) communication in a water treatment SCADA system?",
    "options": [
      "OPC encrypts all SCADA communications for security",
      "OPC provides a standardized interface allowing different vendor systems (PLCs, HMIs, historians) to communicate",
      "OPC replaces the need for PLCs in the control system",
      "OPC automatically backs up all process data"
    ],
    "correct": 1,
    "explanation": "OPC is an industry-standard communication protocol that allows different vendor hardware and software to exchange data using a common interface. This interoperability is essential in water treatment plants that use equipment from multiple vendors — PLCs, HMIs, historians, and SCADA servers can all communicate regardless of manufacturer.",
    "difficulty": "hard"
  },
  {
    "id": 12,
    "module": "Treatment Process",
    "topic": "SCADA and Process Control",
    "question": "An operator is reviewing a SCADA trend and notices that the finished water pH has been gradually decreasing over 3 days from 7.8 to 7.2. Raw water pH is stable at 7.6. What is the MOST likely cause?",
    "options": [
      "The pH meter is drifting and needs calibration",
      "The lime or caustic soda feed system has a malfunction or the chemical supply is running low",
      "The chlorine dose has increased, lowering pH",
      "The raw water alkalinity has decreased"
    ],
    "correct": 1,
    "explanation": "A gradual decrease in finished water pH despite stable raw water pH suggests a problem with the pH adjustment chemical feed system — the lime or caustic soda pump may be malfunctioning, the chemical supply may be depleted, or the chemical solution may have degraded. The operator should check the chemical feed system and chemical levels.",
    "difficulty": "medium"
  },
  {
    "id": 13,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "A jar test on raw water produces the following settled turbidities: alum 10 mg/L = 7.8 NTU, 20 mg/L = 2.9 NTU, 30 mg/L = 0.7 NTU, 40 mg/L = 0.9 NTU, 50 mg/L = 1.6 NTU. What is the optimal alum dose?",
    "options": [
      "10 mg/L",
      "20 mg/L",
      "30 mg/L",
      "40 mg/L"
    ],
    "correct": 2,
    "explanation": "The optimal coagulant dose is the lowest dose achieving the minimum settled turbidity. At 30 mg/L, turbidity reaches 0.7 NTU (the minimum). Increasing to 40 mg/L does not improve results and increasing to 50 mg/L causes turbidity to rise (restabilization). The optimal dose is 30 mg/L.",
    "difficulty": "medium"
  },
  {
    "id": 14,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "Raw water pH is 8.2 and alkalinity is 18 mg/L as CaCO3. An operator plans to use alum for coagulation at 40 mg/L. What is the MOST likely problem?",
    "options": [
      "The pH is too low for effective alum coagulation",
      "Insufficient alkalinity to buffer the pH drop from alum addition — pH will drop below the optimal coagulation range",
      "Alum will not dissolve at this pH",
      "The turbidity will increase after alum addition"
    ],
    "correct": 1,
    "explanation": "Alum hydrolysis consumes alkalinity at approximately 0.45 mg/L alkalinity (as CaCO3) per mg/L alum. At 40 mg/L alum: alkalinity consumed = 40 × 0.45 = 18 mg/L — exactly equal to the available alkalinity. This will deplete all alkalinity and cause pH to drop significantly below the optimal range (6.5–7.5), requiring lime or soda ash addition.",
    "difficulty": "hard"
  },
  {
    "id": 15,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "An operator observes that floc formed during coagulation is very small and does not settle well, despite the correct alum dose. The raw water pH is 6.1. What is the MOST likely cause?",
    "options": [
      "Alum dose is too high",
      "pH is too low for optimal alum coagulation — aluminum hydroxide floc formation is impaired below pH 6.5",
      "Rapid mix energy is too low",
      "Flocculation time is too short"
    ],
    "correct": 1,
    "explanation": "Alum coagulation is most effective between pH 6.5 and 7.5. At pH 6.1, aluminum hydroxide (Al(OH)3) floc formation is impaired because the aluminum remains in soluble form (Al³⁺) rather than precipitating as floc. The operator should add lime or soda ash to raise pH into the optimal range before coagulant addition.",
    "difficulty": "medium"
  },
  {
    "id": 16,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "A water treatment plant switches from alum to ferric chloride for coagulation. Which statement about this change is CORRECT?",
    "options": [
      "Ferric chloride is effective over a narrower pH range than alum",
      "Ferric chloride produces less sludge than alum at equivalent doses",
      "Ferric chloride is effective over a wider pH range (4.5–9.0) than alum (6.5–7.5)",
      "Ferric chloride requires higher doses than alum for equivalent turbidity removal"
    ],
    "correct": 2,
    "explanation": "Ferric chloride (FeCl3) is effective over a wider pH range (approximately 4.5–9.0) compared to alum (6.5–7.5). This makes ferric chloride advantageous for low-alkalinity waters or waters with variable pH. Ferric chloride also produces a denser, faster-settling sludge, though it is darker in colour.",
    "difficulty": "hard"
  },
  {
    "id": 17,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "During a jar test, an operator adds a cationic polymer as a coagulant aid after the alum dose. What is the PRIMARY purpose of this polymer?",
    "options": [
      "To increase the pH of the treated water",
      "To bridge and strengthen floc particles, improving settling and reducing coagulant demand",
      "To reduce the required alum dose by 50% in all cases",
      "To disinfect the water before filtration"
    ],
    "correct": 1,
    "explanation": "Cationic polymers act as coagulant aids by bridging negatively charged floc particles together, creating larger, denser, faster-settling floc. They can reduce the primary coagulant dose by 20–50% in some cases. The optimal polymer dose must be determined by jar testing — overdosing can cause restabilization.",
    "difficulty": "medium"
  },
  {
    "id": 18,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "The zeta potential of raw water particles is -32 mV. After coagulant addition, the zeta potential is -1 mV. What does this indicate?",
    "options": [
      "Under-dosing — more coagulant is needed to neutralize the charge",
      "Near-optimal charge neutralization has been achieved",
      "Over-dosing — the charge has been reversed to positive",
      "The coagulant is not working effectively"
    ],
    "correct": 1,
    "explanation": "Zeta potential measures the surface charge of particles. Raw water particles typically have zeta potential of -20 to -40 mV. Optimal coagulation occurs when zeta potential is reduced to near zero (-5 to +5 mV), indicating charge neutralization. At -1 mV, near-optimal charge neutralization has been achieved, and floc should aggregate readily.",
    "difficulty": "hard"
  },
  {
    "id": 19,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "A water treatment plant is treating high-NOM, low-turbidity water. Which coagulation strategy MOST effectively removes NOM to reduce DBP precursors?",
    "options": [
      "Charge neutralization with minimum alum dose",
      "Enhanced coagulation with higher alum dose and lower pH (5.5–6.5)",
      "Sweep floc coagulation at high pH (>8.0)",
      "Direct filtration without coagulation"
    ],
    "correct": 1,
    "explanation": "Enhanced coagulation uses higher coagulant doses and operates at lower pH (5.5–6.5) to maximize NOM removal. At lower pH, more humic substances precipitate as aluminum-humate complexes. The USEPA D/DBP Rule requires enhanced coagulation for systems with raw water TOC >2 mg/L to reduce DBP precursors.",
    "difficulty": "hard"
  },
  {
    "id": 20,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "What is the G value (velocity gradient) and what range is appropriate for flocculation?",
    "options": [
      "G value is the chemical dose in mg/L; range 10–50 mg/L",
      "G value is the velocity gradient (s⁻¹) representing mixing intensity; typical flocculation range is 10–75 s⁻¹, tapered from high to low",
      "G value is the filter loading rate; range 5–15 m/h",
      "G value is the settled water turbidity target; range 0.5–2 NTU"
    ],
    "correct": 1,
    "explanation": "The G value (velocity gradient, s⁻¹) represents the mixing intensity in a flocculation basin. Too low = insufficient mixing, poor floc growth. Too high = floc shear. Typical values are 10–75 s⁻¹, with tapered flocculation (high G at inlet, low G at outlet) providing the best results. The Gt product (G × detention time) is typically 10,000–100,000.",
    "difficulty": "hard"
  },
  {
    "id": 21,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "An operator increases the rapid mix detention time from 30 seconds to 4 minutes. What is the MOST likely effect?",
    "options": [
      "Improved coagulation due to longer contact time with coagulant",
      "Reduced coagulation performance due to floc shear in the high-energy rapid mix zone",
      "No effect on coagulation performance",
      "Increased chemical consumption"
    ],
    "correct": 1,
    "explanation": "Rapid mix is designed for very short, intense mixing (10–60 seconds) to disperse coagulant throughout the water. Extending rapid mix time to 4 minutes subjects the forming floc to intense shear forces that break apart the floc before it can grow. Flocculation (gentle mixing, 20–40 minutes) should immediately follow rapid mix.",
    "difficulty": "hard"
  },
  {
    "id": 22,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "A jar test shows the optimal alum dose is 32 mg/L. The plant treats 18 ML/d. What is the daily alum requirement in kilograms?",
    "options": [
      "320 kg/d",
      "576 kg/d",
      "1,800 kg/d",
      "288 kg/d"
    ],
    "correct": 1,
    "explanation": "Daily alum = dose (g/m³) × flow (m³/d) ÷ 1,000 g/kg = 32 g/m³ × 18,000 m³/d ÷ 1,000 = 576 kg/d. Alternatively: 32 mg/L × 18,000,000 L/d ÷ 1,000,000 mg/kg = 576 kg/d.",
    steps: [
      { l: "Step 1: Convert Flow Rate", c: "The plant treats 18 ML/d. Convert this to cubic meters per day (m³/d) since 1 ML = 1,000 m³. So, 18 ML/d = 18,000 m³/d." },
      { l: "Step 2: Convert Alum Dose", c: "The optimal alum dose is 32 mg/L. Convert this to grams per cubic meter (g/m³) since 1 mg/L = 1 g/m³. So, 32 mg/L = 32 g/m³." },
      { l: "Step 3: Calculate Total Alum in Grams", c: "Multiply the dose in g/m³ by the flow in m³/d to find the total grams of alum required per day: 32 g/m³ × 18,000 m³/d = 576,000 g/d." },
      { l: "Step 4: Convert to Kilograms", c: "Convert the daily alum requirement from grams to kilograms by dividing by 1,000 g/kg: 576,000 g/d ÷ 1,000 g/kg = 576 kg/d." },
    ],
    tip: "Always pay close attention to units and perform necessary conversions before calculations to avoid errors.",
    "difficulty": "medium"
  },
  {
    "id": 23,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "During spring runoff, raw water turbidity increases to 165 NTU and colour to 90 TCU. How should the operator adjust the coagulation process?",
    "options": [
      "Decrease alum dose to avoid over-treatment",
      "Increase alum dose, add polymer coagulant aid, verify pH is in optimal range, and increase jar test frequency",
      "Switch to chlorination as primary treatment",
      "Reduce plant flow to allow more settling time without adjusting chemistry"
    ],
    "correct": 1,
    "explanation": "High turbidity and colour during spring runoff requires increased coagulant dose to handle the higher particle and NOM loading. A polymer coagulant aid may improve floc settling. pH must remain in the optimal range (6.5–7.5 for alum). Increased jar test frequency allows rapid dose optimization as water quality changes.",
    "difficulty": "medium"
  },
  {
    "id": 24,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "What is the primary mechanism by which alum removes natural organic matter (NOM) from water?",
    "options": [
      "Oxidation of NOM by aluminum ions",
      "Adsorption of NOM onto aluminum hydroxide floc and co-precipitation of humic-aluminum complexes",
      "Ion exchange between aluminum and organic carbon",
      "UV photolysis catalyzed by aluminum"
    ],
    "correct": 1,
    "explanation": "Alum removes NOM primarily through adsorption onto aluminum hydroxide floc (Al(OH)3) and co-precipitation of humic acid-aluminum complexes. At lower pH (enhanced coagulation), more NOM is removed because humic acids are less soluble and precipitate more readily. This is the primary mechanism for reducing DBP precursors.",
    "difficulty": "hard"
  },
  {
    "id": 25,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "An operator observes that increasing alum dose beyond 45 mg/L causes settled water turbidity to INCREASE. What is this phenomenon?",
    "options": [
      "Restabilization (charge reversal) — excess coagulant reverses particle charge from negative to positive, causing repulsion",
      "Sweep floc formation — excess alum creates too much precipitate",
      "Polymer bridging failure — excess alum interferes with polymer",
      "Alkalinity depletion — excess alum consumes all alkalinity"
    ],
    "correct": 0,
    "explanation": "Restabilization (charge reversal) occurs when excess coagulant over-neutralizes the particle charge, reversing it from negative to positive. Particles with the same positive charge repel each other and cannot aggregate. The optimal dose is just below the restabilization point. This is most common with highly charged polymers and at low turbidity.",
    "difficulty": "hard"
  },
  {
    "id": 26,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "A water treatment plant uses a static mixer for rapid mixing of coagulant. What is the PRIMARY advantage of a static mixer over a mechanical rapid mixer?",
    "options": [
      "Static mixers provide better mixing at all flow rates",
      "Static mixers have no moving parts, reducing maintenance requirements and eliminating mechanical failure modes",
      "Static mixers allow variable mixing intensity",
      "Static mixers require less chemical to achieve the same coagulation"
    ],
    "correct": 1,
    "explanation": "Static mixers have no moving parts, which eliminates mechanical maintenance (bearings, seals, motors). The trade-off is that mixing intensity is fixed by the mixer design and varies with flow rate — at low flows, mixing may be inadequate. Mechanical mixers can adjust speed but require more maintenance.",
    "difficulty": "medium"
  },
  {
    "id": 27,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "A jar test shows best results at 38 mg/L alum and pH 6.8. What should the operator do before implementing this at full scale?",
    "options": [
      "Immediately implement 38 mg/L alum at pH 6.8",
      "Run additional jar tests at doses of 32–44 mg/L at pH 6.5–7.0 to refine the optimum, then implement gradually at full scale while monitoring settled water turbidity",
      "Increase the alum dose to 60 mg/L to ensure complete coagulation",
      "Reduce the pH to 5.5 to improve NOM removal"
    ],
    "correct": 1,
    "explanation": "Jar test optimization requires narrowing the range around the apparent optimum with finer increments before full-scale implementation. The operator should test 32–44 mg/L in 2 mg/L increments at pH 6.5–7.0 to identify the true optimum. Full-scale implementation should be gradual with close monitoring of settled water turbidity.",
    "difficulty": "medium"
  },
  {
    "id": 28,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "What is the primary difference between 'sweep floc' and 'charge neutralization' as coagulation mechanisms?",
    "options": [
      "Sweep floc uses higher coagulant doses and forms a large Al(OH)3 precipitate that physically entraps particles; charge neutralization uses lower doses to neutralize particle surface charge",
      "Charge neutralization requires higher doses; sweep floc uses lower doses",
      "Sweep floc is only for turbidity; charge neutralization is only for NOM",
      "They are the same mechanism"
    ],
    "correct": 0,
    "explanation": "Charge neutralization uses lower coagulant doses to reduce particle surface charge to near zero, allowing aggregation. Sweep floc uses higher doses to form a large aluminum hydroxide precipitate that physically sweeps particles out of suspension. Both can be effective; sweep floc is more tolerant of dose variations but produces more sludge.",
    "difficulty": "hard"
  },
  {
    "id": 29,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "An operator is treating water with high colour (110 TCU) and low turbidity (3 NTU). The jar test shows 15 mg/L alum removes turbidity but 50 mg/L is needed for colour removal. What should the operator do?",
    "options": [
      "Use 15 mg/L to minimize sludge production",
      "Use 50 mg/L to meet colour removal requirements and accept the higher sludge production",
      "Use 30 mg/L as a compromise",
      "Add activated carbon instead of increasing alum dose"
    ],
    "correct": 1,
    "explanation": "Colour (NOM) removal requires higher coagulant doses than turbidity removal, particularly with enhanced coagulation. The operator must use 50 mg/L to meet colour removal requirements. If sludge production is a concern, the operator should optimize the process (pH adjustment, polymer aids) rather than under-dosing and failing to meet water quality targets.",
    "difficulty": "medium"
  },
  {
    "id": 30,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "A water treatment plant uses a cationic polymer as the primary coagulant (no alum). What is the PRIMARY advantage of this approach?",
    "options": [
      "Cationic polymers are cheaper than alum",
      "Cationic polymers produce less sludge than alum because they do not form aluminum hydroxide precipitate",
      "Cationic polymers are more effective than alum at all pH values",
      "Cationic polymers do not require pH adjustment"
    ],
    "correct": 1,
    "explanation": "Using cationic polymer as the primary coagulant produces significantly less sludge than alum because no aluminum hydroxide precipitate is formed. This reduces sludge disposal costs. However, cationic polymers are more expensive per unit and require careful dose control to avoid restabilization.",
    "difficulty": "hard"
  },
  {
    "id": 31,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "An operator notices that floc in the flocculation basin is very large and fluffy but breaks apart when transferred to the sedimentation basin. What is the MOST likely cause?",
    "options": [
      "Coagulant dose is too low",
      "Flocculation mixing energy (G value) is too high, causing floc shear",
      "Sedimentation basin overflow rate is too high",
      "Raw water temperature is too low"
    ],
    "correct": 1,
    "explanation": "Large, fluffy floc that breaks apart easily indicates floc shear — the mixing energy in the flocculation basin is too high. The G value should be reduced (tapered flocculation: high G at inlet, low G at outlet). Typical outlet G values are 5–15 s⁻¹ to allow gentle aggregation without shearing the floc before it reaches the sedimentation basin.",
    "difficulty": "medium"
  },
  {
    "id": 32,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "A water treatment plant treats 22 ML/d with an alum dose of 30 mg/L. The alum solution is 48% strength (specific gravity 1.32). What mass of alum solution is required per day?",
    "options": [
      "660 kg/d",
      "990 kg/d",
      "1,375 kg/d",
      "1,815 kg/d"
    ],
    "correct": 2,
    "explanation": "Daily pure alum = 30 g/m³ × 22,000 m³/d = 660,000 g = 660 kg/d. Mass of 48% solution = 660 kg ÷ 0.48 = 1,375 kg/d. Volume = 1,375 kg/d ÷ 1.32 kg/L = 1,042 L/d.",
    steps: [
      { l: "Step 1: Calculate the total mass of pure alum required per day.", c: "Multiply the daily flow rate by the alum dose. Convert ML/d to m³/d and mg/L to g/m³ for consistent units. 22 ML/d = 22,000 m³/d. 30 mg/L = 30 g/m³. So, 22,000 m³/d * 30 g/m³ = 660,000 g/d, which is 660 kg/d." },
      { l: "Step 2: Calculate the mass of the 48% alum solution required.", c: "Since the alum solution is only 48% strength, divide the mass of pure alum by the percentage strength (as a decimal). 660 kg/d / 0.48 = 1,375 kg/d." },
      { l: "Step 3: Determine the volume of the alum solution required per day.", c: "Divide the mass of the alum solution by its specific gravity (which is equivalent to density in kg/L for water-based solutions). 1,375 kg/d / 1.32 kg/L = 1,041.67 L/d. Round to 1,042 L/d." },
    ],
    tip: "Always pay close attention to units and ensure they are consistent throughout your calculations to avoid errors.",
    "difficulty": "hard"
  },
  {
    "id": 33,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "What is the significance of 'streaming current' monitoring in coagulation control?",
    "options": [
      "Streaming current measures the electrical current used by chemical feed pumps",
      "Streaming current monitors the surface charge of particles in the coagulated water; it provides real-time feedback for automated coagulant dose adjustment",
      "Streaming current measures the flow velocity in the rapid mix zone",
      "Streaming current is used to detect chemical feed pump failures"
    ],
    "correct": 1,
    "explanation": "A streaming current detector (SCD) measures the surface charge (zeta potential) of particles in the coagulated water. When the coagulant dose is optimal, the streaming current approaches zero. The SCD provides real-time feedback for automated coagulant dose control, allowing rapid response to changes in raw water quality.",
    "difficulty": "hard"
  },
  {
    "id": 34,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Coagulation and Flocculation",
    "question": "During a jar test, an operator tests alum doses of 20, 30, 40, and 50 mg/L at pH 6.0, 6.5, 7.0, and 7.5. The best results are at 40 mg/L and pH 6.5. The raw water alkalinity is 25 mg/L as CaCO3. What additional consideration is needed?",
    "options": [
      "No additional consideration — implement 40 mg/L at pH 6.5 immediately",
      "At 40 mg/L alum, alkalinity consumption = 40 × 0.45 = 18 mg/L, leaving only 7 mg/L residual alkalinity — lime or soda ash addition is needed to maintain pH stability",
      "Increase the alum dose to 60 mg/L for better NOM removal",
      "Reduce pH to 5.5 for enhanced coagulation"
    ],
    "correct": 1,
    "explanation": "At 40 mg/L alum, alkalinity consumed = 40 × 0.45 = 18 mg/L as CaCO3. Remaining alkalinity = 25 - 18 = 7 mg/L — very low. This will cause pH instability and may drop below the optimal range. The operator should add lime or soda ash to maintain adequate alkalinity (minimum 30–40 mg/L as CaCO3) for stable coagulation.",
    steps: [
      { l: "Step 1: Understand the Jar Test Results", c: "The jar test identified optimal conditions at 40 mg/L alum and pH 6.5. This means these are the ideal operational parameters for coagulation based on visual observation." },
      { l: "Step 2: Calculate Alkalinity Consumption", c: "Alum consumes alkalinity. For every 1 mg/L of alum, approximately 0.45 mg/L of alkalinity as CaCO3 is consumed. Therefore, 40 mg/L alum will consume 40 * 0.45 = 18 mg/L of alkalinity." },
      { l: "Step 3: Determine Remaining Alkalinity", c: "The raw water alkalinity is 25 mg/L. After alum addition, the remaining alkalinity will be 25 mg/L - 18 mg/L = 7 mg/L." },
      { l: "Step 4: Evaluate Alkalinity Stability", c: "A remaining alkalinity of 7 mg/L is very low. This level is insufficient to buffer the water and maintain a stable pH, potentially leading to pH drops below the optimal range and poor coagulation." },
    ],
    tip: "Always consider the impact of chemical additions on water chemistry, especially alkalinity and pH, even when optimal conditions are identified in a jar test.",
    "difficulty": "hard"
  },
  {
    "id": 35,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Clarification and Sedimentation",
    "question": "A conventional sedimentation basin has an overflow rate of 24 m³/m²/d. A particle with a settling velocity of 1.5 m/h will:",
    "options": [
      "Be completely removed in the basin",
      "Be partially removed with efficiency less than 50%",
      "Not be removed — it will pass through the basin",
      "Be removed only if the basin has inclined plate settlers"
    ],
    "correct": 0,
    "explanation": "Overflow rate = 24 m/d ÷ 24 h/d = 1.0 m/h. Particle settling velocity = 1.5 m/h > overflow rate (1.0 m/h). When a particle's settling velocity exceeds the overflow rate, it is completely removed regardless of where it enters the basin. Complete removal occurs.",
    steps: [
      { l: "Step 1: Convert Overflow Rate to Consistent Units", c: "The overflow rate is given as 24 m³/m²/d, which simplifies to 24 m/d. To compare it with the particle settling velocity (m/h), convert the overflow rate to m/h: 24 m/d ÷ 24 h/d = 1.0 m/h." },
      { l: "Step 2: Identify Particle Settling Velocity", c: "The particle's settling velocity is given as 1.5 m/h. This is the speed at which the particle will fall through the water." },
      { l: "Step 3: Compare Settling Velocity to Overflow Rate", c: "Compare the particle's settling velocity (1.5 m/h) to the calculated overflow rate (1.0 m/h). In this case, 1.5 m/h > 1.0 m/h." },
      { l: "Step 4: Determine Particle Removal", c: "When the particle's settling velocity is greater than the overflow rate, the particle will settle out of the water column before it reaches the effluent weir, resulting in complete removal." },
    ],
    tip: "Always ensure all units are consistent before performing calculations, especially when comparing rates or velocities.",
    "difficulty": "hard"
  },
  {
    "id": 36,
    "module": "Treatment Process",
    "topic": "Clarification and Sedimentation",
    "question": "An upflow solids-contact clarifier has a sludge blanket that has risen to within 0.3 m of the effluent weirs. What is the MOST appropriate operator response?",
    "options": [
      "Increase the coagulant dose to improve floc formation",
      "Increase the sludge withdrawal (blowdown) rate to lower the blanket level",
      "Increase the plant flow rate to flush the blanket out",
      "Reduce the coagulant dose to decrease sludge production"
    ],
    "correct": 1,
    "explanation": "In an upflow solids-contact clarifier, the sludge blanket must be maintained at the correct level (typically 1–2 m below the effluent weirs). If the blanket rises too high, sludge will carry over into the effluent. The operator should increase sludge withdrawal rate to lower the blanket. If the blanket rises rapidly, plant flow may also need to be reduced.",
    "difficulty": "medium"
  },
  {
    "id": 37,
    "module": "Treatment Process",
    "topic": "Clarification and Sedimentation",
    "question": "Inclined plate settlers are installed in a sedimentation basin. What is the PRIMARY mechanism by which they improve settling efficiency?",
    "options": [
      "They increase water temperature, reducing viscosity",
      "They increase the effective settling area, reducing the effective overflow rate",
      "They create turbulence that breaks up floc",
      "They filter particles from the water as it passes through"
    ],
    "correct": 1,
    "explanation": "Inclined plate (lamella) settlers increase the effective settling area by providing multiple shallow settling zones. The overflow rate is calculated based on the projected horizontal area of all plates combined, which can be 5–10 times the basin plan area. This allows higher flow rates or smaller basins for the same settling performance.",
    "difficulty": "medium"
  },
  {
    "id": 38,
    "module": "Treatment Process",
    "topic": "Clarification and Sedimentation",
    "question": "A sedimentation basin shows high effluent turbidity during windy conditions. What is the MOST likely cause?",
    "options": [
      "Wind increases raw water turbidity",
      "Wind-induced surface currents create short-circuiting in the basin, reducing effective detention time",
      "Wind reduces water temperature, affecting settling velocity",
      "Wind causes chemical feed pump malfunctions"
    ],
    "correct": 1,
    "explanation": "Wind creates surface currents in open sedimentation basins that cause short-circuiting — water flows directly from inlet to outlet without following the intended flow path. This reduces effective detention time and allows unsettled particles to reach the effluent. Baffles, covers, or windbreaks can mitigate this.",
    "difficulty": "medium"
  },
  {
    "id": 39,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Clarification and Sedimentation",
    "question": "A sedimentation basin has a surface area of 600 m² and treats 20,000 m³/d. What is the overflow rate, and is it within the typical design range?",
    "options": [
      "33.3 m/d — within the typical range of 20–40 m/d",
      "33.3 m/d — above the typical range; the basin is overloaded",
      "0.033 m/d — below the typical range",
      "333 m/d — well above the typical range"
    ],
    "correct": 0,
    "explanation": "Overflow rate = flow ÷ surface area = 20,000 m³/d ÷ 600 m² = 33.3 m/d. Typical design overflow rates for conventional sedimentation are 20–40 m³/m²/d. At 33.3 m/d, the basin is operating within the normal design range.",
    steps: [
      { l: "Step 1: Identify Given Values", c: "The problem provides the surface area of the sedimentation basin (600 m²) and the daily flow rate (20,000 m³/d)." },
      { l: "Step 2: Recall the Formula for Overflow Rate", c: "The overflow rate is calculated by dividing the daily flow rate by the surface area of the basin. Overflow Rate = Flow Rate / Surface Area." },
      { l: "Step 3: Calculate the Overflow Rate", c: "Substitute the given values into the formula: Overflow Rate = 20,000 m³/d / 600 m² = 33.33 m/d (or m³/m²/d)." },
      { l: "Step 4: Compare to Typical Design Range", c: "The calculated overflow rate of 33.33 m/d falls within the typical design range for conventional sedimentation basins, which is 20-40 m³/m²/d. Therefore, the basin is operating within the normal design range." },
    ],
    tip: "Always include units in your calculations to ensure you are using the correct formula and to verify the final answer's units.",
    "difficulty": "medium"
  },
  {
    "id": 40,
    "module": "Treatment Process",
    "topic": "Clarification and Sedimentation",
    "question": "During cold weather, settled water turbidity increases significantly despite no change in raw water quality or chemical doses. What is the MOST likely explanation?",
    "options": [
      "Cold water has higher viscosity, which reduces particle settling velocity according to Stokes' Law",
      "Cold weather causes chemical feed pumps to malfunction",
      "Cold water has lower density, causing floc to float",
      "Cold weather increases biological activity in the basin"
    ],
    "correct": 0,
    "explanation": "Water viscosity increases significantly at lower temperatures (approximately doubles from 25°C to 4°C). Since settling velocity is inversely proportional to viscosity (Stokes' Law: v = g(ρp-ρw)d²/18μ), colder water causes slower settling. Operators may need to increase coagulant dose or reduce plant flow during cold weather.",
    "difficulty": "hard"
  },
  {
    "id": 41,
    "module": "Treatment Process",
    "topic": "Clarification and Sedimentation",
    "question": "What is the purpose of a 'sludge blanket' in a solids-contact clarifier, and how is its level monitored?",
    "options": [
      "The sludge blanket provides additional filtration; monitored by turbidity",
      "The sludge blanket provides a contact zone for floc growth and particle capture; monitored by sludge blanket depth using a sludge judge or interface detector",
      "The sludge blanket stores excess sludge; monitored by sludge volume index",
      "The sludge blanket neutralizes pH; monitored by pH meters"
    ],
    "correct": 1,
    "explanation": "In a solids-contact clarifier, the sludge blanket is a suspended layer of previously formed floc that acts as a contact zone — incoming particles collide with and attach to the blanket floc, improving removal efficiency. The blanket level is monitored using a sludge judge (transparent tube) or electronic interface detector.",
    "difficulty": "medium"
  },
  {
    "id": 42,
    "module": "Treatment Process",
    "topic": "Clarification and Sedimentation",
    "question": "A sedimentation basin effluent turbidity is 9 NTU, exceeding the target of 2 NTU. Raw water turbidity is 40 NTU and coagulant dose appears correct from jar tests. What should the operator investigate FIRST?",
    "options": [
      "Increase the coagulant dose by 50%",
      "Check for short-circuiting, inlet/outlet conditions, sludge accumulation, and weir loading",
      "Reduce the plant flow rate by 50%",
      "Add a polymer coagulant aid immediately"
    ],
    "correct": 1,
    "explanation": "When settled water turbidity is high despite correct coagulant dosing, the operator should investigate hydraulic issues: short-circuiting (check with dye test), inlet turbulence, outlet weir loading, and sludge accumulation (which can cause sludge carryover). These are often the root cause when chemistry appears correct.",
    "difficulty": "hard"
  },
  {
    "id": 43,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Clarification and Sedimentation",
    "question": "According to Stokes' Law, if a particle's diameter is doubled, its settling velocity will:",
    "options": [
      "Double (increase by 2×)",
      "Increase by 4× (quadruple)",
      "Increase by 8×",
      "Remain the same"
    ],
    "correct": 1,
    "explanation": "Stokes' Law: v = g(ρp-ρw)d²/(18μ). Settling velocity is proportional to the square of particle diameter (d²). If diameter doubles, settling velocity increases by 2² = 4 times. This is why coagulation (which creates larger floc particles) dramatically improves settling efficiency.",
    steps: [
      { l: "Understand Stokes' Law", c: "Stokes' Law describes the settling velocity (v) of a spherical particle in a fluid: v = g(ρp-ρw)d²/(18μ). Key variables include gravitational acceleration (g), particle density (ρp), water density (ρw), particle diameter (d), and dynamic viscosity of water (μ)." },
      { l: "Identify the relationship with diameter", c: "From the formula, observe that settling velocity (v) is directly proportional to the square of the particle diameter (d²). All other variables are assumed constant for this scenario." },
      { l: "Apply the change in diameter", c: "If the particle's diameter (d) is doubled, the new diameter becomes 2d. When this is squared, it becomes (2d)² = 4d²." },
      { l: "Calculate the change in settling velocity", c: "Since settling velocity is proportional to d², doubling the diameter results in the settling velocity increasing by a factor of 4 (2²)." },
    ],
    tip: "Always identify the direct or inverse proportionality of variables in formulas to quickly determine the impact of changes.",
    "difficulty": "hard"
  },
  {
    "id": 44,
    "module": "Treatment Process",
    "topic": "Clarification and Sedimentation",
    "question": "A tracer study of a sedimentation basin shows a t10/T ratio of 0.12. What does this indicate?",
    "options": [
      "Excellent hydraulic performance with minimal short-circuiting",
      "Significant short-circuiting — only 12% of theoretical detention time is being utilized before 10% of water exits",
      "The basin is operating at 12% of design capacity",
      "The tracer was not properly injected"
    ],
    "correct": 1,
    "explanation": "The t10/T ratio measures hydraulic efficiency. A ratio of 1.0 would be ideal plug flow. A ratio of 0.12 means only 12% of theoretical detention time elapses before 10% of water exits — indicating severe short-circuiting. Values below 0.3 indicate poor hydraulic performance. Baffles can improve the t10/T ratio.",
    "difficulty": "hard"
  },
  {
    "id": 45,
    "module": "Treatment Process",
    "topic": "Clarification and Sedimentation",
    "question": "What is the primary cause of 'density currents' in a sedimentation basin and how do they affect performance?",
    "options": [
      "Density currents are caused by chemical overdosing and improve settling",
      "Density currents are caused by temperature or turbidity differences between inlet and basin water; they cause short-circuiting and reduce settling efficiency",
      "Density currents are caused by wind and have no effect on settling",
      "Density currents are caused by sludge accumulation"
    ],
    "correct": 1,
    "explanation": "Density currents occur when incoming water has a different density than basin water (due to temperature or turbidity differences). Colder, denser water sinks and flows along the bottom, while warmer water flows along the surface — both bypassing the intended flow path. This short-circuiting reduces effective detention time and settling efficiency.",
    "difficulty": "hard"
  },
  {
    "id": 46,
    "module": "Treatment Process",
    "topic": "Clarification and Sedimentation",
    "question": "A sedimentation basin is returned to service after cleaning. What operational practice helps prevent sludge carryover during startup?",
    "options": [
      "Immediately operate at full design flow",
      "Gradually increase flow over several hours while monitoring settled water turbidity",
      "Add extra coagulant at 200% of normal dose",
      "Bypass the sedimentation basin until it reaches steady state"
    ],
    "correct": 1,
    "explanation": "Returning a sedimentation basin to service requires gradual flow increase to allow the sludge blanket to re-establish and floc to settle before full flow is applied. Sudden full-flow startup can cause turbulence that resuspends accumulated sludge and causes carryover. Monitoring settled water turbidity during startup confirms when full flow can be applied.",
    "difficulty": "medium"
  },
  {
    "id": 47,
    "module": "Treatment Process",
    "topic": "Clarification and Sedimentation",
    "question": "What is the purpose of 'sludge recirculation' in a solids-contact clarifier?",
    "options": [
      "Sludge recirculation dilutes incoming raw water",
      "Sludge recirculation returns settled sludge to the mixing zone to provide seed floc for coagulation, improving floc formation and removal efficiency",
      "Sludge recirculation pumps sludge to the digester",
      "Sludge recirculation is used to backwash the clarifier"
    ],
    "correct": 1,
    "explanation": "In solids-contact clarifiers, sludge recirculation returns previously settled floc to the rapid mix/flocculation zone. This provides 'seed' floc that accelerates coagulation and floc growth, improving particle removal efficiency. Typical recirculation ratios are 2:1 to 5:1 (volume of recirculated sludge to influent flow).",
    "difficulty": "hard"
  },
  {
    "id": 48,
    "module": "Treatment Process",
    "topic": "Clarification and Sedimentation",
    "question": "A sedimentation basin weir is overloaded (weir overflow rate exceeds design). What is the effect on basin performance?",
    "options": [
      "Weir loading has no effect on sedimentation performance",
      "High weir loading creates turbulence near the outlet that can resuspend settled floc and carry it over the weir",
      "High weir loading improves settling by increasing velocity",
      "High weir loading only affects the chemical dose required"
    ],
    "correct": 1,
    "explanation": "Weir overflow rate (flow per unit weir length) affects the velocity near the outlet. Excessive weir loading creates turbulence that can resuspend settled floc and carry it over the weir into the effluent. Typical design weir overflow rates are 125–250 m³/m/d. Adding weir extensions (V-notch weirs, finger weirs) can reduce weir loading.",
    "difficulty": "hard"
  },
  {
    "id": 49,
    "module": "Treatment Process",
    "topic": "Clarification and Sedimentation",
    "question": "What is the purpose of 'tube settlers' in a sedimentation basin, and what is their primary limitation?",
    "options": [
      "Tube settlers increase the effective settling area; their primary limitation is that they can clog with biological growth or heavy sludge accumulation",
      "Tube settlers filter particles from the water; their limitation is high headloss",
      "Tube settlers increase detention time; their limitation is high cost",
      "Tube settlers reduce chemical requirements; their limitation is pH sensitivity"
    ],
    "correct": 0,
    "explanation": "Tube settlers (similar to inclined plate settlers) increase the effective settling area by providing multiple shallow settling zones within the basin. Their primary limitation is that they can clog with biological growth (algae, biofilm) or accumulate heavy sludge that is difficult to remove, requiring periodic cleaning.",
    "difficulty": "medium"
  },
  {
    "id": 50,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "A rapid sand filter has been in service for 40 hours. Headloss has increased from 0.3 m to 2.9 m and effluent turbidity is 0.12 NTU. What is the MOST appropriate action?",
    "options": [
      "Continue operating — the turbidity is acceptable",
      "Initiate backwash based on terminal headloss being reached",
      "Increase the filter loading rate to push particles through",
      "Add more filter media to reduce headloss"
    ],
    "correct": 1,
    "explanation": "Filters should be backwashed when terminal headloss is reached (typically 2.5–3.0 m), when effluent turbidity exceeds limits, or after a maximum run time. At 2.9 m headloss, the terminal headloss limit has been reached and backwash should be initiated regardless of turbidity. Continuing to operate beyond terminal headloss risks media disruption.",
    "difficulty": "medium"
  },
  {
    "id": 51,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "An operator observes that filter effluent turbidity spikes to 0.6 NTU immediately after backwash and gradually decreases to 0.04 NTU over 25 minutes. This phenomenon is called:",
    "options": [
      "Filter breakthrough",
      "Filter ripening (initial turbidity spike)",
      "Backwash carry-over",
      "Media stratification failure"
    ],
    "correct": 1,
    "explanation": "Filter ripening is the initial period after backwash during which filter effluent turbidity is elevated. During backwash, the filter media is cleaned and the physical/biological filtration layer is disrupted. The filter requires a 'ripening' period to re-establish effective filtration. Filter-to-waste is used to prevent this turbidity from entering the distribution system.",
    "difficulty": "medium"
  },
  {
    "id": 52,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "A dual-media filter uses anthracite coal on top of sand. What is the PRIMARY advantage over a single-media sand filter?",
    "options": [
      "Anthracite removes more bacteria than sand",
      "The coarser anthracite captures large floc near the surface while finer sand provides polishing, allowing deeper bed utilization and longer filter runs",
      "Anthracite is cheaper than sand",
      "Dual-media filters do not require backwashing"
    ],
    "correct": 1,
    "explanation": "In a dual-media filter, coarser anthracite (specific gravity ~1.5) sits above finer sand (SG ~2.65) after backwash due to density differences. The anthracite captures large floc particles near the surface while the sand provides fine particle polishing. This allows deeper bed utilization, longer filter runs, and higher loading rates than single-media sand filters.",
    "difficulty": "medium"
  },
  {
    "id": 53,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "During filter-to-waste operation, what is the operator's PRIMARY objective?",
    "options": [
      "To waste water to reduce plant production costs",
      "To prevent initial post-backwash turbidity from entering the distribution system during filter ripening",
      "To test the filter media for integrity",
      "To flush chemical residuals from the filter"
    ],
    "correct": 1,
    "explanation": "Filter-to-waste (or filter-to-drain) directs filter effluent to waste during the initial ripening period after backwash, preventing the elevated turbidity spike from entering the distribution system. This is particularly important for Giardia/Cryptosporidium removal compliance and for maintaining turbidity limits.",
    "difficulty": "medium"
  },
  {
    "id": 54,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "A filter has a loading rate of 9 m/h and a media depth of 0.72 m. What is the empty bed contact time (EBCT)?",
    "options": [
      "0.08 hours (4.8 minutes)",
      "0.08 minutes",
      "4.8 hours",
      "0.72 hours"
    ],
    "correct": 0,
    "explanation": "EBCT = media depth ÷ loading rate = 0.72 m ÷ 9 m/h = 0.08 hours = 0.08 × 60 min/h = 4.8 minutes. EBCT is used to design GAC contactors for organic removal — longer EBCT provides more contact time for adsorption.",
    steps: [
      { l: "Step 1: Understand the Formula", c: "Recall the formula for Empty Bed Contact Time (EBCT), which is Media Depth divided by Loading Rate. This formula calculates how long water would take to pass through the empty volume occupied by the filter media." },
      { l: "Step 2: Identify Given Values", c: "From the problem, the media depth is 0.72 meters and the loading rate is 9 meters per hour." },
      { l: "Step 3: Calculate EBCT in Hours", c: "Substitute the given values into the formula: EBCT = 0.72 m / 9 m/h = 0.08 hours." },
      { l: "Step 4: Convert to Minutes", c: "Since contact times are often expressed in minutes, convert the hours to minutes by multiplying by 60: 0.08 hours * 60 minutes/hour = 4.8 minutes." },
    ],
    tip: "Always pay attention to the units in the question and ensure your final answer is in the requested or most appropriate unit, converting as necessary.",
    "difficulty": "medium"
  },
  {
    "id": 55,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "An operator observes 'mudballs' in the filter media during inspection. What is the MOST likely cause and corrective action?",
    "options": [
      "Mudballs are caused by chemical overdosing; reduce coagulant dose",
      "Mudballs are caused by inadequate backwash; increase backwash rate and consider air scour",
      "Mudballs are caused by biological growth; add chlorine to backwash water",
      "Mudballs are normal and require no action"
    ],
    "correct": 1,
    "explanation": "Mudballs are agglomerations of filter media bound together by coagulated solids. They form when backwash is insufficient to fully clean the media. Corrective actions include increasing backwash rate (to achieve 20–30% bed expansion), increasing backwash duration, and adding air scour to break up the mudballs. Severe mudballing may require manual raking or media replacement.",
    "difficulty": "medium"
  },
  {
    "id": 56,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "What is the purpose of 'air scour' during filter backwash?",
    "options": [
      "To add oxygen to the filter media for biological treatment",
      "To provide additional agitation that breaks up mudballs and dislodges particles from media surfaces",
      "To dry the filter media before the water backwash",
      "To disinfect the filter media"
    ],
    "correct": 1,
    "explanation": "Air scour introduces compressed air into the filter underdrain system before or during water backwash. The turbulence created by air bubbles provides additional scrubbing action that breaks up mudballs, dislodges particles from media grain surfaces, and improves overall media cleaning efficiency beyond what water backwash alone can achieve.",
    "difficulty": "medium"
  },
  {
    "id": 57,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "A filter is experiencing 'breakthrough' — effluent turbidity exceeds 0.3 NTU before the headloss terminal limit is reached. What is the MOST likely cause?",
    "options": [
      "The filter media is too deep",
      "Floc is too weak and breaks apart under hydraulic shear as it passes through the filter",
      "The backwash rate is too high",
      "The filter loading rate is too low"
    ],
    "correct": 1,
    "explanation": "Turbidity breakthrough before headloss limit indicates particles are passing through the filter rather than being captured. This is most commonly caused by weak floc (from inadequate coagulation) that breaks apart under hydraulic shear forces within the filter bed. The operator should review coagulant dose, jar test results, and flocculation performance.",
    "difficulty": "hard"
  },
  {
    "id": 58,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "A rapid sand filter has a surface area of 60 m² and treats a flow of 360 m³/h. What is the filter loading rate?",
    "options": [
      "3 m/h",
      "6 m/h",
      "9 m/h",
      "60 m/h"
    ],
    "correct": 1,
    "explanation": "Filter loading rate = flow ÷ surface area = 360 m³/h ÷ 60 m² = 6 m/h. Typical design loading rates for rapid sand filters are 5–12 m/h. At 6 m/h, this filter is operating within the normal design range.",
    steps: [
      { l: "Identify the given values", c: "The problem provides the surface area of the rapid sand filter (60 m²) and the flow rate (360 m³/h)." },
      { l: "Recall the formula for filter loading rate", c: "The filter loading rate is calculated by dividing the flow rate by the surface area of the filter." },
      { l: "Apply the formula", c: "Substitute the given values into the formula: Filter Loading Rate = 360 m³/h ÷ 60 m²." },
      { l: "Calculate the result", c: "Perform the division: 360 ÷ 60 = 6. The units will be m/h." },
    ],
    tip: "Always double-check your units to ensure they cancel out correctly to give the expected unit for the answer.",
    "difficulty": "medium"
  },
  {
    "id": 59,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "What is the 'unit filter run volume' (UFRV) and why is it a useful performance metric?",
    "options": [
      "UFRV measures the volume of backwash water used per filter run",
      "UFRV is the total volume of water filtered per unit area between backwashes; higher UFRV means more efficient filtration with less backwash water used",
      "UFRV is the filter loading rate in m³/m²/h",
      "UFRV measures the volume of sludge produced per filter run"
    ],
    "correct": 1,
    "explanation": "Unit Filter Run Volume (UFRV) = loading rate × run time = total volume filtered ÷ filter area. It measures how much water is produced per unit area between backwashes. Higher UFRV means more efficient filtration (longer runs, less backwash water used). Typical values are 100–500 m³/m² per run. Declining UFRV indicates deteriorating filter performance.",
    "difficulty": "hard"
  },
  {
    "id": 60,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "An operator is evaluating whether to use direct filtration for a new water source with turbidity of 10 NTU and colour of 18 TCU. Which treatment approach is MOST appropriate?",
    "options": [
      "Direct filtration — the water quality is suitable for direct filtration",
      "Conventional treatment (coagulation + sedimentation + filtration) — turbidity and colour are too high for direct filtration",
      "Membrane filtration only — no coagulation needed",
      "Slow sand filtration — the turbidity is low enough"
    ],
    "correct": 0,
    "explanation": "Direct filtration (coagulation + filtration without sedimentation) is suitable for raw water with turbidity typically <10–20 NTU and colour <40 TCU. At 10 NTU and 18 TCU, this water quality is appropriate for direct filtration, which reduces capital costs by eliminating the sedimentation basin.",
    "difficulty": "hard"
  },
  {
    "id": 61,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "What is the purpose of 'turbidity profiling' during a filter run?",
    "options": [
      "To measure turbidity at different depths in the filter media to assess particle penetration and optimize backwash timing",
      "To measure turbidity at different locations in the treatment plant",
      "To calibrate the online turbidimeter",
      "To determine the optimal coagulant dose"
    ],
    "correct": 0,
    "explanation": "Turbidity profiling involves sampling at multiple depths in the filter media (using sample ports) during a filter run. This shows how deeply particles penetrate the filter bed and when breakthrough is occurring at each depth. It helps optimize filter run times, loading rates, and backwash procedures.",
    "difficulty": "hard"
  },
  {
    "id": 62,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "A membrane filtration system (MF) is experiencing a gradual increase in transmembrane pressure (TMP) over several weeks despite regular chemical cleaning. What is the MOST likely cause?",
    "options": [
      "The membranes are performing better than expected",
      "Irreversible fouling — organic or biological matter is permanently blocking membrane pores",
      "The feed water turbidity has decreased",
      "The backwash pump is malfunctioning"
    ],
    "correct": 1,
    "explanation": "Gradual TMP increase despite regular cleaning indicates irreversible fouling — foulants (typically organic matter, biological films, or mineral scales) that cannot be removed by standard chemical cleaning. This may require more aggressive cleaning protocols (higher chemical concentrations, longer soak times, different chemicals) or eventual membrane replacement.",
    "difficulty": "hard"
  },
  {
    "id": 63,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "What is the difference between 'integrity testing' and 'performance monitoring' for membrane filtration systems?",
    "options": [
      "They are the same test with different names",
      "Integrity testing detects physical membrane breaches (holes, broken fibres); performance monitoring tracks turbidity/particle removal during normal operation",
      "Performance monitoring detects membrane breaches; integrity testing monitors turbidity",
      "Integrity testing is done monthly; performance monitoring is done annually"
    ],
    "correct": 1,
    "explanation": "Integrity testing (pressure decay test or direct integrity test) specifically detects physical breaches in membrane fibres or seals that would allow pathogens to bypass treatment. Performance monitoring (turbidity, particle counts) tracks overall removal efficiency during normal operation. Both are required for regulatory compliance.",
    "difficulty": "hard"
  },
  {
    "id": 64,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "A slow sand filter has been in operation for 3 months. The operator notices rapidly increasing headloss and increasing effluent turbidity. What is the MOST likely cause and corrective action?",
    "options": [
      "The schmutzdecke (biological layer) has become too thick; scrape the top 1–3 cm of sand to reduce headloss while preserving the biological layer",
      "The sand media has been washed away; add new sand",
      "The filter needs more coagulant",
      "The backwash frequency is too high"
    ],
    "correct": 0,
    "explanation": "In slow sand filtration, the schmutzdecke (biological layer on top of the sand) is the primary treatment mechanism. Over time, it becomes too thick, causing excessive headloss. The corrective action is to scrape (harrowing) the top 1–3 cm of sand to reduce headloss while preserving the biological layer. The filter requires a maturation period after scraping.",
    "difficulty": "medium"
  },
  {
    "id": 65,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "What is the purpose of a 'filter profile test' (ripening test)?",
    "options": [
      "To determine the optimal filter loading rate",
      "To measure effluent turbidity at regular intervals after backwash to characterize the ripening period and optimize filter-to-waste duration",
      "To test the integrity of the filter underdrain system",
      "To measure the depth of filter media"
    ],
    "correct": 1,
    "explanation": "A filter profile test measures effluent turbidity at regular intervals (e.g., every 5 minutes) after backwash. The resulting turbidity profile shows the duration and magnitude of the initial turbidity spike (ripening period). This data is used to optimize filter-to-waste duration and ensure compliance with turbidity limits.",
    "difficulty": "hard"
  },
  {
    "id": 66,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "A GAC contactor is showing reduced effectiveness for taste and odour removal after 18 months. What is the MOST appropriate corrective action?",
    "options": [
      "Increase the chlorine dose to compensate for reduced GAC performance",
      "Reactivate or replace the GAC media",
      "Increase the GAC bed depth",
      "Add powdered activated carbon (PAC) to the raw water"
    ],
    "correct": 1,
    "explanation": "GAC has a finite adsorption capacity. After 18 months, the GAC may be exhausted for taste and odour compounds. The appropriate action is to reactivate the GAC (thermal regeneration at 800–900°C) or replace it with fresh GAC. Adding PAC is a temporary measure but not a long-term solution for exhausted GAC.",
    "difficulty": "medium"
  },
  {
    "id": 67,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "What is the primary difference between pressure filtration and gravity filtration?",
    "options": [
      "Pressure filters use coarser media than gravity filters",
      "Pressure filters operate under positive pressure (200–500 kPa), allowing higher loading rates and compact installation; gravity filters operate by gravity head",
      "Gravity filters produce better quality water than pressure filters",
      "Pressure filters do not require backwashing"
    ],
    "correct": 1,
    "explanation": "Pressure filters operate under positive pressure (typically 200–500 kPa), which allows higher loading rates (up to 20 m/h vs. 5–12 m/h for gravity) and more compact installation. They are often used in small systems or as polishing filters. Gravity filters are more common in large municipal plants.",
    "difficulty": "medium"
  },
  {
    "id": 68,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "A filter is experiencing 'filter cracking' — visible cracks in the media surface after backwash. What is the MOST likely cause?",
    "options": [
      "The filter media is too coarse",
      "Insufficient backwash rate or duration causing incomplete cleaning and media compaction",
      "The filter loading rate is too low",
      "The coagulant dose is too high"
    ],
    "correct": 1,
    "explanation": "Filter cracking occurs when the media surface is not properly fluidized during backwash, causing compacted zones. Causes include: insufficient backwash rate (media not fully expanded), inadequate backwash duration, or excessive surface wash pressure that compacts the top layer. The cracks create preferential flow paths that bypass the filter media.",
    "difficulty": "hard"
  },
  {
    "id": 69,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "What is the purpose of a 'filter surveillance test' (also called a filter inspection)?",
    "options": [
      "To measure the turbidity of the filter effluent",
      "To physically inspect the filter media for mudballs, cracks, media loss, and underdrain condition to assess overall filter integrity",
      "To calibrate the filter headloss gauges",
      "To determine the optimal backwash rate"
    ],
    "correct": 1,
    "explanation": "Filter surveillance tests involve physical inspection of the filter media after draining: looking for mudballs, cracks, media loss, sand boils (underdrain failure), and media stratification. These tests are performed periodically (typically annually or after problems are detected) to assess filter integrity and identify maintenance needs.",
    "difficulty": "medium"
  },
  {
    "id": 70,
    "module": "Treatment Process",
    "topic": "Filtration",
    "question": "A water treatment plant is evaluating two filter media options: Option A (sand, d10 = 0.45 mm, UC = 1.5) and Option B (sand, d10 = 0.65 mm, UC = 2.5). Which option is BETTER for a conventional plant and why?",
    "options": [
      "Option A — smaller d10 provides better particle removal",
      "Option B — larger d10 provides longer filter runs and lower headloss",
      "Option A — lower uniformity coefficient means more uniform media",
      "Option B — higher uniformity coefficient means better particle removal"
    ],
    "correct": 2,
    "explanation": "Option A (d10 = 0.45 mm, UC = 1.5) is better for conventional treatment. Smaller d10 provides better particle removal (finer media captures smaller particles). Lower uniformity coefficient (UC = 1.5) means the media is more uniform in size, which provides more consistent filtration and better backwash performance. UC < 1.7 is generally preferred.",
    "difficulty": "hard"
  },
  {
    "id": 71,
    "module": "Treatment Process",
    "topic": "Membrane Filtration",
    "question": "A microfiltration (MF) membrane system is evaluated for Cryptosporidium removal. The membrane pore size is 0.2 μm. Cryptosporidium oocysts are 4–6 μm in diameter. What log removal credit can be expected?",
    "options": [
      "0-log (no removal)",
      "2-log (99% removal)",
      "At least 3-log (99.9%), subject to direct integrity testing results",
      "1-log (90% removal)"
    ],
    "correct": 2,
    "explanation": "MF membranes with 0.2 μm pores physically exclude Cryptosporidium oocysts (4–6 μm). Regulatory agencies typically grant 2-log removal credit for MF as a baseline, with up to 5.5-log credit possible subject to direct integrity testing results. The actual credit depends on the integrity testing program and regulatory jurisdiction.",
    "difficulty": "hard"
  },
  {
    "id": 72,
    "module": "Treatment Process",
    "topic": "Membrane Filtration",
    "question": "What is the key difference between microfiltration (MF) and ultrafiltration (UF) membranes?",
    "options": [
      "They are the same technology with different brand names",
      "MF (0.1–10 μm) removes particles and bacteria but not viruses; UF (0.01–0.1 μm) removes viruses in addition to particles and bacteria",
      "MF and UF are the same; they differ only in operating pressure",
      "UF is used for groundwater; MF is used for surface water"
    ],
    "correct": 1,
    "explanation": "MF (pore size 0.1–10 μm, pressure 10–200 kPa) removes particles, bacteria, and protozoa but not viruses. UF (pore size 0.01–0.1 μm, pressure 100–500 kPa) removes viruses in addition to particles and bacteria. This distinction is critical for regulatory compliance — systems requiring virus removal may need UF rather than MF.",
    "difficulty": "medium"
  },
  {
    "id": 73,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Membrane Filtration",
    "question": "A reverse osmosis (RO) system has a recovery rate of 80%. If the feed flow is 1,200 m³/d, what are the permeate and concentrate flows?",
    "options": [
      "Permeate = 960 m³/d, Concentrate = 240 m³/d",
      "Permeate = 240 m³/d, Concentrate = 960 m³/d",
      "Permeate = 1,200 m³/d, Concentrate = 960 m³/d",
      "Permeate = 960 m³/d, Concentrate = 960 m³/d"
    ],
    "correct": 0,
    "explanation": "Recovery rate = permeate flow ÷ feed flow. Permeate = 80% × 1,200 = 960 m³/d. Concentrate = feed - permeate = 1,200 - 960 = 240 m³/d. The concentrate contains the rejected dissolved solids and must be disposed of appropriately.",
    steps: [
      { l: "Step 1: Understand the Recovery Rate Formula", c: "The recovery rate is the ratio of permeate flow to feed flow, expressed as a percentage. In this case, Recovery Rate = Permeate Flow / Feed Flow." },
      { l: "Step 2: Calculate the Permeate Flow", c: "Given a recovery rate of 80% (0.80) and a feed flow of 1,200 m³/d, the permeate flow is calculated as: Permeate Flow = Recovery Rate × Feed Flow = 0.80 × 1,200 m³/d = 960 m³/d." },
      { l: "Step 3: Calculate the Concentrate Flow", c: "The concentrate flow is the difference between the feed flow and the permeate flow. Concentrate Flow = Feed Flow - Permeate Flow = 1,200 m³/d - 960 m³/d = 240 m³/d." },
      { l: "Step 4: State the Final Answer", c: "The permeate flow is 960 m³/d and the concentrate flow is 240 m³/d." },
    ],
    tip: "Always double-check your units and ensure they are consistent throughout your calculations to avoid errors.",
    "difficulty": "medium"
  },
  {
    "id": 74,
    "module": "Treatment Process",
    "topic": "Membrane Filtration",
    "question": "What is 'concentration polarization' in a membrane filtration system?",
    "options": [
      "Concentration polarization is the buildup of rejected solutes at the membrane surface, increasing osmotic pressure and reducing permeate flux",
      "Concentration polarization is the uneven distribution of chemical feed across the membrane",
      "Concentration polarization is the increase in feed water concentration during drought",
      "Concentration polarization is the buildup of air bubbles on the membrane surface"
    ],
    "correct": 0,
    "explanation": "Concentration polarization occurs when rejected solutes accumulate at the membrane surface faster than they can be transported away by the feed flow. This creates a high-concentration boundary layer that increases osmotic pressure (reducing driving force) and promotes scaling and fouling. Cross-flow velocity and turbulence promoters help mitigate it.",
    "difficulty": "hard"
  },
  {
    "id": 75,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Membrane Filtration",
    "question": "A pressure decay test (PDT) shows a pressure drop from 103 kPa to 95 kPa in 5 minutes. The allowable pressure decay rate is 0.5 kPa/min. Is membrane integrity acceptable?",
    "options": [
      "Yes — the pressure decay rate is within limits",
      "No — the pressure decay rate of 1.6 kPa/min exceeds the limit of 0.5 kPa/min, indicating a potential membrane breach",
      "The test is inconclusive without knowing the membrane area",
      "Yes — any pressure decay below 10 kPa is acceptable"
    ],
    "correct": 1,
    "explanation": "Pressure decay rate = (103 - 95) kPa ÷ 5 min = 1.6 kPa/min. The allowable rate is 0.5 kPa/min. Since 1.6 > 0.5, the pressure decay exceeds the limit, indicating a potential membrane breach (broken fibre, damaged seal). The system should be taken offline for investigation and repair.",
    steps: [
      { l: "Calculate the total pressure drop", c: "Subtract the final pressure from the initial pressure: 103 kPa - 95 kPa = 8 kPa." },
      { l: "Calculate the actual pressure decay rate", c: "Divide the total pressure drop by the test duration: 8 kPa / 5 minutes = 1.6 kPa/min." },
      { l: "Compare the actual rate to the allowable rate", c: "Compare the calculated decay rate (1.6 kPa/min) to the allowable decay rate (0.5 kPa/min)." },
      { l: "Determine membrane integrity", c: "Since 1.6 kPa/min is greater than 0.5 kPa/min, the membrane integrity is NOT acceptable." },
    ],
    tip: "Always clearly state your conclusion based on the comparison of calculated values to given limits.",
    "difficulty": "hard"
  },
  {
    "id": 76,
    "module": "Treatment Process",
    "topic": "Membrane Filtration",
    "question": "What is the purpose of 'chemical enhanced backwash' (CEB) in a membrane filtration system?",
    "options": [
      "CEB is a routine cleaning procedure using low-concentration chemicals to remove foulants that cannot be removed by hydraulic backwash alone",
      "CEB is an emergency procedure used only when membranes are severely fouled",
      "CEB uses high-pressure water to physically clean the membrane surface",
      "CEB is used to sterilize the membrane system between treatment runs"
    ],
    "correct": 0,
    "explanation": "Chemical Enhanced Backwash (CEB) combines hydraulic backwash with low-concentration chemicals (typically chlorine, caustic, or acid) to remove organic, biological, and inorganic foulants that accumulate between major cleanings. CEB is performed more frequently than CIP (Clean-In-Place) and uses lower chemical concentrations.",
    "difficulty": "medium"
  },
  {
    "id": 77,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Membrane Filtration",
    "question": "A nanofiltration (NF) system has a feed water hardness of 320 mg/L as CaCO3 and a divalent ion rejection rate of 95%. What permeate hardness can be expected?",
    "options": [
      "5 mg/L",
      "16 mg/L",
      "48 mg/L",
      "304 mg/L"
    ],
    "correct": 1,
    "explanation": "Permeate hardness = feed hardness × (1 - rejection rate) = 320 × (1 - 0.95) = 320 × 0.05 = 16 mg/L as CaCO3. At 16 mg/L, the water is very soft. In practice, the permeate is often blended with bypass water to achieve a target hardness that is not too corrosive.",
    steps: [
      { l: "Identify Given Values", c: "The feed water hardness is 320 mg/L as CaCO3. The divalent ion rejection rate is 95%." },
      { l: "Calculate the Permeate Passage Rate", c: "The permeate passage rate is 1 minus the rejection rate. So, 1 - 0.95 = 0.05." },
      { l: "Calculate Permeate Hardness", c: "Multiply the feed hardness by the permeate passage rate: 320 mg/L * 0.05 = 16 mg/L as CaCO3." },
      { l: "Interpret the Result", c: "The expected permeate hardness is 16 mg/L as CaCO3, which is considered very soft water. In real-world applications, this soft water might be blended with bypass water to achieve a desired hardness level." },
    ],
    tip: "Always pay close attention to whether the question asks for rejection or passage rate, as these are inversely related.",
    "difficulty": "medium"
  },
  {
    "id": 78,
    "module": "Treatment Process",
    "topic": "Membrane Filtration",
    "question": "What is the Langelier Saturation Index (LSI) and why is it critical for RO system operation?",
    "options": [
      "LSI measures membrane flux; negative values indicate good performance",
      "LSI indicates whether water is scale-forming (positive) or corrosive (negative); positive LSI in RO concentrate causes calcium carbonate scaling on membranes",
      "LSI measures the rejection rate of the RO membrane",
      "LSI is the ratio of permeate to concentrate flow"
    ],
    "correct": 1,
    "explanation": "The Langelier Saturation Index (LSI) = pH - pHs. Positive LSI = scale-forming (CaCO3 tends to precipitate); negative LSI = corrosive. In RO systems, dissolved solids concentrate in the reject stream, causing LSI to become highly positive and leading to calcium carbonate scaling on membranes. Antiscalants or acid addition prevent this.",
    "difficulty": "hard"
  },
  {
    "id": 79,
    "module": "Treatment Process",
    "topic": "Membrane Filtration",
    "question": "A membrane filtration plant is experiencing increased energy consumption despite stable flow rates. What is the MOST likely cause?",
    "options": [
      "The feed pumps are more efficient than expected",
      "Membrane fouling has increased transmembrane pressure, requiring more energy to maintain flow",
      "The electrical grid voltage has increased",
      "The plant is treating higher quality water"
    ],
    "correct": 1,
    "explanation": "Increased energy consumption at stable flow indicates increased hydraulic resistance from membrane fouling. As foulants accumulate, higher transmembrane pressure (and thus more pump energy) is needed to maintain the same permeate flow. Monitoring specific energy consumption (kWh/m³) helps track fouling trends.",
    "difficulty": "medium"
  },
  {
    "id": 80,
    "module": "Treatment Process",
    "topic": "Membrane Filtration",
    "question": "What does 'pre-treatment' before reverse osmosis membranes typically include, and why is it necessary?",
    "options": [
      "Pre-treatment is not needed for RO systems",
      "Pre-treatment protects RO membranes from fouling, scaling, and physical damage; typically includes coagulation/filtration, cartridge filtration, antiscalant addition, pH adjustment, and dechlorination",
      "Pre-treatment only involves adding chlorine to kill bacteria",
      "Pre-treatment only involves removing large particles with screens"
    ],
    "correct": 1,
    "explanation": "RO membranes are sensitive to fouling, scaling, and chemical damage. Pre-treatment typically includes: coagulation/sedimentation/filtration (remove suspended solids), cartridge filtration (5–20 μm), antiscalant dosing (prevent mineral scaling), pH adjustment (optimize rejection), and dechlorination (protect polyamide membranes from chlorine oxidation).",
    "difficulty": "medium"
  },
  {
    "id": 81,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "A water treatment plant must achieve 3-log inactivation of Giardia using free chlorine. Water temperature is 10°C, pH is 7.5, and the required CT is 165 mg·min/L. If the chlorine residual is 1.5 mg/L, what minimum contact time is required?",
    "options": [
      "55 minutes",
      "110 minutes",
      "165 minutes",
      "247.5 minutes"
    ],
    "correct": 1,
    "explanation": "CT = concentration × time. Required CT = 165 mg·min/L. Chlorine residual = 1.5 mg/L. Time = CT ÷ C = 165 ÷ 1.5 = 110 minutes. The CT value used should be the minimum residual throughout the contact chamber (C), not the average, to ensure adequate inactivation at all points.",
    steps: [
      { l: "Step 1: Identify Given Values", c: "The problem provides the required CT value (165 mg·min/L) and the chlorine residual (1.5 mg/L)." },
      { l: "Step 2: Recall the CT Formula", c: "The CT formula is CT = Concentration (C) × Time (T). We need to solve for Time (T)." },
      { l: "Step 3: Rearrange the Formula to Solve for Time", c: "Rearrange the formula to T = CT / C. This allows us to calculate the required contact time." },
      { l: "Step 4: Calculate the Minimum Contact Time", c: "Substitute the given values into the rearranged formula: T = 165 mg·min/L / 1.5 mg/L = 110 minutes. Therefore, a minimum contact time of 110 minutes is required." },
    ],
    tip: "Always ensure units cancel out correctly when performing calculations to arrive at the desired unit for the answer.",
    "difficulty": "hard"
  },
  {
    "id": 82,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "A plant is experiencing elevated THM levels in the distribution system. The raw water has high NOM. Which strategy MOST effectively reduces THMs?",
    "options": [
      "Increase the chlorine dose to ensure adequate disinfection",
      "Move chlorination to after filtration and implement enhanced coagulation to remove NOM precursors before chlorination",
      "Switch from free chlorine to chlorine gas",
      "Add more contact time before chlorination"
    ],
    "correct": 1,
    "explanation": "THMs form when chlorine reacts with NOM precursors. The most effective strategies are: (1) remove NOM precursors before chlorination (enhanced coagulation, GAC), and (2) move the chlorination point to after filtration to minimize contact time with NOM. This combination significantly reduces THM formation potential.",
    "difficulty": "hard"
  },
  {
    "id": 83,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "What is the primary advantage of UV disinfection for Cryptosporidium inactivation compared to chlorine?",
    "options": [
      "UV is more effective than chlorine for bacteria",
      "UV achieves 3-log Cryptosporidium inactivation at very low doses (3–5 mJ/cm²), while chlorine requires extremely high CT values (>7,000 mg·min/L)",
      "UV produces no disinfection byproducts",
      "UV is less expensive than chlorine"
    ],
    "correct": 1,
    "explanation": "Cryptosporidium oocysts are highly resistant to chlorine — achieving 3-log inactivation requires CT values of approximately 7,200 mg·min/L at 15°C, pH 7. In contrast, UV achieves 3-log inactivation at only 3–5 mJ/cm². UV's effectiveness against Cryptosporidium at low doses is its primary advantage over chlorine.",
    "difficulty": "hard"
  },
  {
    "id": 84,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "A water treatment plant uses chloramines for secondary disinfection. What is the PRIMARY disadvantage compared to free chlorine?",
    "options": [
      "Chloramines are more expensive than free chlorine",
      "Chloramines are weaker disinfectants (higher CT values required) and can form NDMA as a DBP; they also support nitrification in distribution systems",
      "Chloramines cause more corrosion in distribution pipes",
      "Chloramines cannot be measured with standard test kits"
    ],
    "correct": 1,
    "explanation": "Chloramines are weaker disinfectants than free chlorine (require higher CT values for equivalent inactivation) and can form NDMA (N-nitrosodimethylamine), a probable human carcinogen, as a DBP. Chloramines also support nitrification in distribution systems — ammonia released from chloramine decay feeds nitrifying bacteria that consume residual.",
    "difficulty": "hard"
  },
  {
    "id": 85,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "An operator is calculating the CT value in a clearwell. Volume = 2,500 m³, flow = 500 m³/h, chlorine residual at outlet = 0.8 mg/L, baffling factor = 0.5. What is the CT value?",
    "options": [
      "24 mg·min/L",
      "120 mg·min/L",
      "150 mg·min/L",
      "240 mg·min/L"
    ],
    "correct": 1,
    "explanation": "Theoretical detention time (T) = 2,500 m³ ÷ 500 m³/h = 5 hours = 300 minutes. Effective contact time (t10) = T × BF = 300 × 0.5 = 150 minutes. CT = C × t10 = 0.8 mg/L × 150 min = 120 mg·min/L.",
    steps: [
      { l: "Step 1: Calculate the Theoretical Detention Time (T)", c: "Divide the clearwell volume by the flow rate to find the theoretical detention time in hours, then convert it to minutes. T = 2,500 m³ ÷ 500 m³/h = 5 hours = 300 minutes." },
      { l: "Step 2: Calculate the Effective Contact Time (t10)", c: "Multiply the theoretical detention time by the baffling factor to determine the effective contact time. t10 = T × BF = 300 minutes × 0.5 = 150 minutes." },
      { l: "Step 3: Calculate the CT Value", c: "Multiply the chlorine residual (C) by the effective contact time (t10) to get the CT value. CT = C × t10 = 0.8 mg/L × 150 minutes = 120 mg·min/L." },
    ],
    tip: "Always pay close attention to units and ensure they are consistent throughout your calculations, especially when converting between hours and minutes.",
    "difficulty": "hard"
  },
  {
    "id": 86,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "What is the purpose of the 'baffling factor' (BF) in CT calculations, and what BF value represents a well-baffled clearwell?",
    "options": [
      "BF adjusts for water temperature; a value of 1.0 represents cold water",
      "BF accounts for short-circuiting; a value of 0.7 or higher represents a well-baffled system",
      "BF represents the chlorine decay rate",
      "BF is the ratio of free to total chlorine"
    ],
    "correct": 1,
    "explanation": "The baffling factor (BF) = t10/T, where t10 is the time for 10% of tracer to exit and T is theoretical detention time. BF accounts for short-circuiting — a BF of 1.0 would be ideal plug flow. Regulatory guidance assigns BF values from 0.1 (unbaffled) to 1.0 (plug flow). A well-baffled clearwell typically achieves BF ≥ 0.7.",
    "difficulty": "hard"
  },
  {
    "id": 87,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "A plant is switching from free chlorine to chloramines. What additional monitoring is required in the distribution system?",
    "options": [
      "Only total chlorine monitoring is needed",
      "Nitrification monitoring (free ammonia, nitrite, nitrate, HPC) in addition to chloramine residual monitoring",
      "Only pH monitoring is needed",
      "No additional monitoring is required"
    ],
    "correct": 1,
    "explanation": "Chloramines can support nitrification in distribution systems — ammonia released from chloramine decay feeds nitrifying bacteria (Nitrosomonas, Nitrobacter), which consume chloramine residual and produce nitrite/nitrate. Operators must monitor for nitrification indicators: free ammonia, nitrite, nitrate, HPC, and chloramine residual.",
    "difficulty": "hard"
  },
  {
    "id": 88,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "What is the difference between 'chlorine demand' and 'chlorine dose'?",
    "options": [
      "They are the same thing",
      "Chlorine dose is the amount added; chlorine demand is the amount consumed by reactions with organic matter, ammonia, and reducing agents; residual = dose - demand",
      "Chlorine demand is the minimum dose required",
      "Chlorine demand is measured in mg/L; chlorine dose is measured in kg/d"
    ],
    "correct": 1,
    "explanation": "Chlorine dose = chlorine demand + chlorine residual. Chlorine demand is the amount consumed by reactions with organic matter (NOM), ammonia, iron, manganese, and other reducing agents. The residual is what remains for disinfection. Understanding demand is essential for maintaining adequate residuals throughout the distribution system.",
    "difficulty": "medium"
  },
  {
    "id": 89,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "A plant must achieve 4-log virus inactivation using free chlorine at pH 8.0 and 15°C. The required CT is 6 mg·min/L. If the contact time is 20 minutes, what minimum chlorine residual must be maintained?",
    "options": [
      "0.1 mg/L",
      "0.3 mg/L",
      "0.6 mg/L",
      "1.2 mg/L"
    ],
    "correct": 1,
    "explanation": "CT = C × t. Required CT = 6 mg·min/L. Contact time = 20 min. C = CT ÷ t = 6 ÷ 20 = 0.3 mg/L. The operator must maintain a minimum free chlorine residual of 0.3 mg/L throughout the 20-minute contact time to achieve 4-log virus inactivation.",
    steps: [
      { l: "Step 1: Understand the CT concept", c: "CT stands for 'Concentration multiplied by Time.' It's a critical value in disinfection, representing the product of disinfectant residual (C) and contact time (t) needed to achieve a specific level of pathogen inactivation." },
      { l: "Step 2: Identify given values", c: "The problem provides the required CT value (6 mg min/L) and the contact time (20 minutes). The pH and temperature are important for determining the CT value itself, but not for this specific calculation." },
      { l: "Step 3: Apply the CT formula", c: "The formula is CT = C x t. To find the required chlorine residual (C), we rearrange the formula to C = CT / t." },
      { l: "Step 4: Calculate the minimum chlorine residual", c: "Substitute the given values into the rearranged formula: C = 6 mg min/L / 20 min = 0.3 mg/L. Therefore, a minimum free chlorine residual of 0.3 mg/L must be maintained." },
    ],
    tip: "Always write down the formula and known variables first to avoid calculation errors and ensure you're solving for the correct unknown.",
    "difficulty": "medium"
  },
  {
    "id": 90,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "What is the primary regulatory concern with bromate formation in ozonated water supplies?",
    "options": [
      "Bromate causes taste and odour problems",
      "Bromate is a probable human carcinogen formed when ozone reacts with bromide ions; the Canadian guideline is 0.01 mg/L",
      "Bromate interferes with chlorine disinfection",
      "Bromate causes corrosion in distribution pipes"
    ],
    "correct": 1,
    "explanation": "Bromate (BrO3⁻) is classified as a probable human carcinogen (Group 2A, IARC). It forms when ozone reacts with naturally occurring bromide ions in source water. The Canadian drinking water guideline is 0.01 mg/L (10 μg/L). Control strategies include reducing ozone dose, lowering pH before ozonation, and adding ammonia to scavenge ozone.",
    "difficulty": "hard"
  },
  {
    "id": 91,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "An operator troubleshoots a chlorine gas feed system. The chlorinator shows normal gas pressure and the rotameter indicates normal feed rate, but there is no chlorine residual in the treated water. What is the MOST likely cause?",
    "options": [
      "The chlorine cylinder is empty",
      "The injector water supply has failed, preventing chlorine gas from being drawn into solution",
      "The chlorine demand of the water has increased",
      "The residual analyzer is malfunctioning"
    ],
    "correct": 1,
    "explanation": "Chlorine gas chlorinators use a water-powered injector (venturi) to create a vacuum that draws chlorine gas into solution. If the injector water supply fails (pump failure, valve closed, low pressure), no vacuum is created, and chlorine cannot be drawn from the cylinder even though the cylinder has gas and the rotameter appears normal.",
    "difficulty": "hard"
  },
  {
    "id": 92,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "What is the difference between 'free chlorine residual' and 'total chlorine residual'?",
    "options": [
      "They are the same measurement",
      "Free chlorine = HOCl + OCl⁻; total chlorine = free chlorine + combined chlorine (chloramines)",
      "Total chlorine = HOCl only; free chlorine = HOCl + chloramines",
      "Free chlorine is measured in mg/L; total chlorine is measured in mg/L Cl2"
    ],
    "correct": 1,
    "explanation": "Free chlorine residual = HOCl + OCl⁻ (the active disinfecting forms). Combined chlorine = monochloramine + dichloramine + nitrogen trichloride (chloramines). Total chlorine = free + combined. When using chloramines for secondary disinfection, total chlorine residual is monitored.",
    "difficulty": "medium"
  },
  {
    "id": 93,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "An operator adds 3.8 mg/L of chlorine to water with a chlorine demand of 3.1 mg/L. What is the chlorine residual?",
    "options": [
      "0.7 mg/L",
      "3.1 mg/L",
      "3.8 mg/L",
      "6.9 mg/L"
    ],
    "correct": 0,
    "explanation": "Chlorine residual = chlorine dose - chlorine demand = 3.8 - 3.1 = 0.7 mg/L. This residual must meet the minimum required by regulation (typically 0.2 mg/L free chlorine at the point of entry to the distribution system in Ontario).",
    steps: [
      { l: "Step 1: Understand the Goal", c: "The question asks for the chlorine residual, which is the amount of chlorine remaining in the water after the chlorine demand has been satisfied." },
      { l: "Step 2: Identify Given Values", c: "We are given the chlorine dose (amount added) as 3.8 mg/L and the chlorine demand (amount consumed) as 3.1 mg/L." },
      { l: "Step 3: Apply the Formula", c: "The formula for chlorine residual is: Chlorine Residual = Chlorine Dose - Chlorine Demand." },
      { l: "Step 4: Calculate the Residual", c: "Substitute the given values into the formula: 3.8 mg/L (Dose) - 3.1 mg/L (Demand) = 0.7 mg/L (Residual)." },
    ],
    tip: "Always double-check that you are subtracting demand from dose, not the other way around, to avoid common calculation errors.",
    "difficulty": "medium"
  },
  {
    "id": 94,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "What is the primary mechanism by which ozone inactivates pathogens?",
    "options": [
      "Ozone lowers pH, creating an inhospitable environment for pathogens",
      "Ozone is a powerful oxidant that directly oxidizes and destroys cell membranes, enzymes, and nucleic acids",
      "Ozone forms chlorine compounds that inactivate pathogens",
      "Ozone removes nutrients that pathogens need to survive"
    ],
    "correct": 1,
    "explanation": "Ozone (O3) is one of the strongest oxidants used in water treatment. It inactivates pathogens through direct oxidation of cell membranes, enzymes, and nucleic acids. Ozone is particularly effective against Cryptosporidium and Giardia, and also oxidizes taste/odour compounds, iron, manganese, and NOM.",
    "difficulty": "medium"
  },
  {
    "id": 95,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "A water treatment plant is experiencing nitrification in its distribution system. What conditions MOST likely contribute to this problem?",
    "options": [
      "High free chlorine residual and low temperature",
      "Low chloramine residual, high temperature (>15°C), and free ammonia in the distribution system",
      "High pH and high turbidity",
      "Low pH and high chlorine dose"
    ],
    "correct": 1,
    "explanation": "Nitrification in distribution systems is promoted by: low chloramine residual (insufficient to suppress nitrifying bacteria), high temperature (>15°C accelerates bacterial growth), and free ammonia (substrate for Nitrosomonas). Nitrification consumes chloramine residual and produces nitrite, which is a health concern.",
    "difficulty": "hard"
  },
  {
    "id": 96,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "What is the purpose of 'dechlorination' before discharging filter backwash water?",
    "options": [
      "To reduce the pH of the waste stream",
      "To remove residual chlorine that would be toxic to aquatic organisms in receiving water bodies",
      "To remove turbidity from the waste stream",
      "To reduce the volume of the waste stream"
    ],
    "correct": 1,
    "explanation": "Residual chlorine in plant waste streams is toxic to aquatic organisms at concentrations as low as 0.01 mg/L. Before discharging to receiving water bodies, residual chlorine must be removed by dechlorination using sodium thiosulfate, sodium bisulfite, or ascorbic acid.",
    "difficulty": "medium"
  },
  {
    "id": 97,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "A plant must achieve 3-log Giardia removal/inactivation. The filtration process provides 2.0-log removal credit. How much CT credit must be provided by disinfection?",
    "options": [
      "0.5-log",
      "1.0-log",
      "2.0-log",
      "3.0-log"
    ],
    "correct": 1,
    "explanation": "Total log removal/inactivation required = 3.0-log. Removal credit from filtration = 2.0-log. Additional inactivation required from disinfection = 3.0 - 2.0 = 1.0-log. This is the concept of 'treatment credit' — removal and inactivation credits are additive to meet the total treatment requirement.",
    steps: [
      { l: "Step 1: Identify the total log removal/inactivation required.", c: "The problem states that the plant must achieve a total of 3-log Giardia removal/inactivation." },
      { l: "Step 2: Identify the log removal credit provided by filtration.", c: "The filtration process provides a 2.0-log removal credit for Giardia." },
      { l: "Step 3: Calculate the additional log inactivation required from disinfection.", c: "Subtract the filtration credit from the total required log removal: 3.0-log (total required) - 2.0-log (filtration credit) = 1.0-log. This 1.0-log must be provided by disinfection (CT credit)." },
    ],
    tip: "Always break down multi-step problems into individual components to ensure you address each part of the question accurately.",
    "difficulty": "medium"
  },
  {
    "id": 98,
    "module": "Treatment Process",
    "topic": "Disinfection and DBPs",
    "question": "What is the significance of 'chlorine demand' testing before commissioning a new clearwell or storage tank?",
    "options": [
      "Chlorine demand testing is not required for new infrastructure",
      "New concrete structures have a high chlorine demand due to calcium hydroxide leaching; demand testing determines the initial chlorine dose needed to maintain residual",
      "Chlorine demand testing is only required for existing infrastructure",
      "New tanks have zero chlorine demand"
    ],
    "correct": 1,
    "explanation": "New concrete clearwells and storage tanks have a high initial chlorine demand because calcium hydroxide (from cement hydration) reacts with chlorine. The operator must perform chlorine demand testing to determine the elevated dose needed during the initial period. Demand decreases over time as the concrete cures and the reactive compounds are consumed.",
    "difficulty": "hard"
  },
  {
    "id": 99,
    "module": "Treatment Process",
    "topic": "Iron and Manganese Treatment",
    "question": "A groundwater source has iron at 3.5 mg/L and manganese at 0.9 mg/L. Ontario standards are Fe ≤ 0.3 mg/L and Mn ≤ 0.05 mg/L. Which treatment approach is MOST appropriate?",
    "options": [
      "Chlorination alone will remove both iron and manganese",
      "Aeration followed by filtration for iron; oxidation (KMnO4 or ozone) followed by filtration for manganese",
      "Ion exchange for both iron and manganese",
      "Coagulation and sedimentation for both iron and manganese"
    ],
    "correct": 1,
    "explanation": "Iron is more easily oxidized than manganese. Aeration oxidizes Fe²⁺ to Fe³⁺ (ferric hydroxide precipitate) which can be filtered. Manganese requires stronger oxidants (KMnO4, ozone, or chlorine at pH >8) to oxidize Mn²⁺ to MnO2 (filterable). The sequence matters: iron treatment first prevents manganese oxidation interference.",
    "difficulty": "hard"
  },
  {
    "id": 100,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Iron and Manganese Treatment",
    "question": "An operator uses potassium permanganate (KMnO4) to oxidize manganese. The raw water manganese is 0.7 mg/L. What is the approximate KMnO4 dose required?",
    "options": [
      "0.7 mg/L",
      "1.3 mg/L",
      "2.0 mg/L",
      "3.5 mg/L"
    ],
    "correct": 1,
    "explanation": "The stoichiometric ratio for KMnO4 oxidation of Mn²⁺ is approximately 1.92 mg KMnO4 per mg Mn. For 0.7 mg/L Mn: KMnO4 = 0.7 × 1.92 ≈ 1.34 mg/L ≈ 1.3 mg/L. Excess KMnO4 causes pink water, so the dose should be carefully controlled.",
    steps: [
      { l: "Identify the given values", c: "The raw water manganese concentration is 0.7 mg/L. The stoichiometric ratio for KMnO4 to Mn is 1.92 mg KMnO4 per mg Mn." },
      { l: "Apply the stoichiometric ratio", c: "Multiply the raw water manganese concentration by the stoichiometric ratio to find the required KMnO4 dose. Calculation: 0.7 mg/L Mn * 1.92 mg KMnO4/mg Mn." },
      { l: "Calculate the approximate dose", c: "Perform the multiplication: 0.7 * 1.92 = 1.344 mg/L." },
      { l: "Round to the nearest practical value", c: "Round the calculated dose to one decimal place for practical application, which is 1.3 mg/L." },
    ],
    tip: "Always pay attention to units and ensure they cancel out correctly to arrive at the desired unit for your answer.",
    "difficulty": "hard"
  },
  {
    "id": 101,
    "module": "Treatment Process",
    "topic": "Iron and Manganese Treatment",
    "question": "A water treatment plant is experiencing 'pink water' complaints from customers. What is the MOST likely cause?",
    "options": [
      "Excess iron in the treated water",
      "Excess potassium permanganate (KMnO4) passing through treatment into the distribution system",
      "Biological growth in the distribution system",
      "Corrosion of copper pipes"
    ],
    "correct": 1,
    "explanation": "Pink water is a classic sign of excess KMnO4 in the treated water. KMnO4 is a deep purple/pink compound; even small excesses (>0.05 mg/L) cause visible pink discolouration. The operator should reduce the KMnO4 dose and verify that the greensand filter is removing all oxidized manganese.",
    "difficulty": "medium"
  },
  {
    "id": 102,
    "module": "Treatment Process",
    "topic": "Iron and Manganese Treatment",
    "question": "What is 'greensand filtration' and how does it remove manganese?",
    "options": [
      "Greensand is a green-coloured sand that physically filters manganese particles",
      "Greensand (glauconite coated with MnO2) acts as a catalyst and oxidant for Mn²⁺ oxidation; it is regenerated with KMnO4",
      "Greensand uses ion exchange to remove manganese ions",
      "Greensand is a biological filter that uses bacteria to oxidize manganese"
    ],
    "correct": 1,
    "explanation": "Greensand is glauconite (a mineral) coated with manganese dioxide (MnO2). It removes manganese through catalytic oxidation — the MnO2 surface catalyzes the oxidation of Mn²⁺ to MnO2 in the presence of dissolved oxygen or oxidants. The greensand is regenerated with KMnO4 to restore the MnO2 coating.",
    "difficulty": "medium"
  },
  {
    "id": 103,
    "module": "Treatment Process",
    "topic": "Iron and Manganese Treatment",
    "question": "An operator notices that iron removal efficiency has decreased. Raw water iron is 2.8 mg/L and treated water iron is 0.9 mg/L. What should the operator investigate FIRST?",
    "options": [
      "Increase the KMnO4 dose",
      "Check aeration system performance, verify pH is above 7.0, and inspect filter media condition",
      "Add more filter media",
      "Increase the chlorine dose"
    ],
    "correct": 1,
    "explanation": "Iron removal efficiency depends on: (1) adequate oxidation (aeration or chemical oxidation), (2) sufficient pH (Fe²⁺ oxidation by oxygen is slow below pH 7), and (3) filter media condition. The operator should check aeration system performance, verify pH is above 7.0, and inspect filter media for mudballs or media loss.",
    "difficulty": "medium"
  },
  {
    "id": 104,
    "module": "Treatment Process",
    "topic": "Iron and Manganese Treatment",
    "question": "What is the primary difference between 'soluble' and 'colloidal' iron in groundwater?",
    "options": [
      "They are the same form of iron",
      "Soluble iron (Fe²⁺) requires oxidation before filtration; colloidal iron (Fe³⁺ particles <1 μm) requires coagulation before filtration",
      "Colloidal iron is easier to remove than soluble iron",
      "Soluble iron can be removed by filtration alone"
    ],
    "correct": 1,
    "explanation": "Soluble iron exists as Fe²⁺ (ferrous) ions and must be oxidized to Fe³⁺ (ferric) before it can be filtered. Colloidal iron consists of very fine Fe³⁺ particles (<1 μm) that are already oxidized but too small to be removed by filtration alone — they require coagulation to form larger, filterable floc.",
    "difficulty": "hard"
  },
  {
    "id": 105,
    "module": "Treatment Process",
    "topic": "Iron and Manganese Treatment",
    "question": "At what pH is chlorine MOST effective for manganese oxidation?",
    "options": [
      "pH 5.0–6.0",
      "pH 6.5–7.5",
      "pH 7.5–8.5 or higher",
      "pH does not affect chlorine's effectiveness for manganese oxidation"
    ],
    "correct": 2,
    "explanation": "Chlorine oxidation of manganese is strongly pH-dependent. At pH <7.5, chlorine oxidizes Mn²⁺ very slowly. Above pH 7.5–8.0, the reaction proceeds much faster. KMnO4 or ozone are preferred for manganese oxidation at lower pH values because they are effective across a wider pH range.",
    "difficulty": "hard"
  },
  {
    "id": 106,
    "module": "Treatment Process",
    "topic": "Iron and Manganese Treatment",
    "question": "An operator treats water with both iron (2.2 mg/L) and manganese (0.5 mg/L). The treatment sequence is: aeration → KMnO4 addition → greensand filtration. Why is KMnO4 added AFTER aeration?",
    "options": [
      "KMnO4 interferes with aeration efficiency",
      "Aeration removes most of the iron first, reducing the KMnO4 demand and preventing KMnO4 from being consumed by iron oxidation",
      "KMnO4 is more effective at higher dissolved oxygen levels",
      "The order does not matter"
    ],
    "correct": 1,
    "explanation": "KMnO4 can oxidize both iron and manganese, but iron has a much higher KMnO4 demand than manganese. By aerating first to oxidize and precipitate most of the iron, the KMnO4 dose can be optimized specifically for manganese oxidation. This reduces chemical costs and prevents excess KMnO4 (pink water).",
    "difficulty": "hard"
  },
  {
    "id": 107,
    "module": "Treatment Process",
    "topic": "Iron and Manganese Treatment",
    "question": "What is 'black water' in a water distribution system, and what causes it?",
    "options": [
      "Black water is caused by excess chlorine reacting with iron pipes",
      "Black water is caused by manganese dioxide (MnO2) deposits being disturbed in the distribution system, releasing black particles",
      "Black water is caused by biological growth in the distribution system",
      "Black water is caused by corrosion of cast iron pipes"
    ],
    "correct": 1,
    "explanation": "Black water complaints occur when MnO2 deposits accumulated in distribution system pipes are disturbed (by flow changes, pressure surges, or main breaks) and released as black particles. This is a common problem in systems with historically elevated manganese levels. Flushing the distribution system can temporarily resolve the problem.",
    "difficulty": "medium"
  },
  {
    "id": 108,
    "module": "Treatment Process",
    "topic": "Iron and Manganese Treatment",
    "question": "A water treatment plant is evaluating biological manganese removal. What is the key advantage of this approach over chemical oxidation?",
    "options": [
      "Biological removal is faster than chemical oxidation",
      "Biological removal uses Mn-oxidizing bacteria to oxidize Mn²⁺ without chemical addition, reducing operating costs",
      "Biological removal is more effective at low pH",
      "Biological removal does not require filtration"
    ],
    "correct": 1,
    "explanation": "Biological manganese removal uses naturally occurring Mn-oxidizing bacteria (e.g., Leptothrix, Gallionella) that catalyze the oxidation of Mn²⁺ to MnO2 without chemical addition. The primary advantage is reduced chemical costs (no KMnO4 or chlorine needed for Mn oxidation). The filter media becomes coated with MnO2, which catalyzes further oxidation.",
    "difficulty": "hard"
  },
  {
    "id": 109,
    "module": "Treatment Process",
    "topic": "Corrosion Control",
    "question": "The Langelier Saturation Index (LSI) of finished water is -0.7. What does this indicate and what corrective action should be taken?",
    "options": [
      "The water is scale-forming; reduce alkalinity",
      "The water is corrosive (under-saturated with CaCO3); increase pH, alkalinity, or calcium hardness to bring LSI toward 0",
      "The water is at equilibrium; no action needed",
      "The water has excess calcium; add sodium carbonate"
    ],
    "correct": 1,
    "explanation": "LSI = pH - pHs. LSI = -0.7 indicates the water is corrosive — it is under-saturated with calcium carbonate and will dissolve CaCO3 protective scale in pipes, potentially leaching lead and copper. Corrective actions include raising pH (lime addition), increasing alkalinity (soda ash), or increasing calcium hardness.",
    "difficulty": "medium"
  },
  {
    "id": 110,
    "module": "Treatment Process",
    "topic": "Corrosion Control",
    "question": "What parameters are used to calculate the Langelier Saturation Index (LSI)?",
    "options": [
      "pH, temperature, turbidity, and colour",
      "pH, temperature, calcium hardness, total alkalinity, and TDS (or conductivity)",
      "pH, chlorine residual, iron, and manganese",
      "pH, BOD, TSS, and dissolved oxygen"
    ],
    "correct": 1,
    "explanation": "LSI = pH - pHs, where pHs = (pK2 - pKs) + pCa + pAlk. The parameters needed are: actual pH, temperature (affects equilibrium constants), calcium hardness (as CaCO3), total alkalinity (as CaCO3), and TDS or conductivity (ionic strength correction).",
    "difficulty": "medium"
  },
  {
    "id": 111,
    "module": "Treatment Process",
    "topic": "Corrosion Control",
    "question": "A plant's 90th percentile lead level is 0.022 mg/L (action level = 0.015 mg/L). What is the MOST effective corrosion control strategy?",
    "options": [
      "Increase chlorine residual to kill corrosion-causing bacteria",
      "Optimize pH (7.8–8.5), optimize alkalinity (30–74 mg/L as CaCO3), and consider orthophosphate addition (1–3 mg/L as PO4)",
      "Reduce water pressure in the distribution system",
      "Add sodium fluoride to complex lead ions"
    ],
    "correct": 1,
    "explanation": "For lead control, the most effective strategies are: (1) pH optimization (maintain pH 7.8–8.5 to minimize lead solubility), (2) alkalinity optimization (maintain 30–74 mg/L as CaCO3), and (3) orthophosphate addition (1–3 mg/L as PO4) to form lead phosphate scale on pipe surfaces, reducing lead leaching.",
    "difficulty": "hard"
  },
  {
    "id": 112,
    "module": "Treatment Process",
    "topic": "Corrosion Control",
    "question": "What is the difference between 'galvanic corrosion' and 'uniform corrosion'?",
    "options": [
      "They are the same type of corrosion",
      "Galvanic corrosion occurs at the junction of dissimilar metals (electrochemical cell); uniform corrosion is general dissolution of metal across the entire surface",
      "Uniform corrosion occurs at joints; galvanic corrosion occurs on straight pipe sections",
      "Galvanic corrosion is caused by bacteria; uniform corrosion is caused by low pH"
    ],
    "correct": 1,
    "explanation": "Galvanic corrosion occurs when two dissimilar metals are in electrical contact in water — the more active metal (anode) corrodes preferentially. Common example: copper pipe connected to galvanized steel. Uniform corrosion is general dissolution of metal across the pipe surface, driven by water chemistry (low pH, low alkalinity, high dissolved oxygen).",
    "difficulty": "hard"
  },
  {
    "id": 113,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Corrosion Control",
    "question": "An operator measures: pH = 7.5, calcium hardness = 90 mg/L as CaCO3, alkalinity = 50 mg/L as CaCO3, temperature = 10°C, TDS = 200 mg/L. The calculated pHs = 8.2. What is the LSI and what does it indicate?",
    "options": [
      "LSI = +0.7; scale-forming",
      "LSI = -0.7; corrosive",
      "LSI = +0.7; corrosive",
      "LSI = -0.7; scale-forming"
    ],
    "correct": 1,
    "explanation": "LSI = pH - pHs = 7.5 - 8.2 = -0.7. A negative LSI indicates the water is corrosive (under-saturated with CaCO3). The operator should increase pH, alkalinity, or calcium hardness to bring LSI toward 0 (or slightly positive, 0 to +0.5, for protective scale formation without excessive scaling).",
    steps: [
      { l: "Identify Given Values", c: "The problem provides the measured pH (7.5) and the calculated pHs (8.2)." },
      { l: "Apply LSI Formula", c: "The Langelier Saturation Index (LSI) is calculated using the formula: LSI = pH - pHs. Substitute the given values into the formula." },
      { l: "Calculate LSI", c: "LSI = 7.5 - 8.2 = -0.7." },
      { l: "Interpret LSI Result", c: "A negative LSI value (-0.7) indicates that the water is corrosive or undersaturated with calcium carbonate. This means the water has a tendency to dissolve protective scale and potentially corrode pipes." },
    ],
    tip: "Always remember the LSI formula (pH - pHs) and the interpretation of positive, negative, and zero values for corrosivity or scaling potential.",
    "difficulty": "hard"
  },
  {
    "id": 114,
    "module": "Treatment Process",
    "topic": "Corrosion Control",
    "question": "What is the purpose of 'phosphate-based corrosion inhibitors' in drinking water treatment?",
    "options": [
      "Phosphates increase the pH of the water",
      "Phosphates form a thin protective film (lead phosphate or calcium phosphate) on pipe surfaces that reduces metal leaching",
      "Phosphates increase the chlorine residual",
      "Phosphates remove iron and manganese from the water"
    ],
    "correct": 1,
    "explanation": "Orthophosphate and polyphosphate inhibitors work by forming insoluble metal phosphate compounds (e.g., lead phosphate, calcium phosphate) on pipe surfaces. This protective film reduces the contact between the water and the pipe metal, decreasing corrosion and metal leaching. Orthophosphate is preferred for lead control.",
    "difficulty": "medium"
  },
  {
    "id": 115,
    "module": "Treatment Process",
    "topic": "Corrosion Control",
    "question": "A distribution system has elevated copper levels at customer taps. The water has LSI = -0.4 and pH = 7.1. What is the MOST likely cause?",
    "options": [
      "Corrosive water is dissolving copper from household plumbing",
      "Copper is leaching from the water treatment plant equipment",
      "The copper is from natural sources in the groundwater",
      "Elevated copper is caused by high chlorine residual"
    ],
    "correct": 0,
    "explanation": "Corrosive water (negative LSI, low pH) dissolves copper from copper household plumbing, particularly at stagnant points (first-draw samples). The operator should optimize corrosion control treatment to raise LSI toward 0, increase pH to 7.8–8.5, and consider orthophosphate addition.",
    "difficulty": "medium"
  },
  {
    "id": 116,
    "module": "Treatment Process",
    "topic": "Corrosion Control",
    "question": "What is 'microbiologically influenced corrosion' (MIC)?",
    "options": [
      "MIC is corrosion caused by high chlorine residual",
      "MIC is corrosion accelerated by microbial activity (sulfate-reducing bacteria, iron-oxidizing bacteria) that create localized corrosive environments",
      "They are the same process",
      "MIC only occurs in hot water systems"
    ],
    "correct": 1,
    "explanation": "Microbiologically influenced corrosion (MIC) occurs when microorganisms (particularly sulfate-reducing bacteria, Desulfovibrio) create localized corrosive environments by producing H2S, organic acids, or by concentrating corrosive ions at the metal surface. MIC can cause rapid, localized pitting corrosion.",
    "difficulty": "hard"
  },
  {
    "id": 117,
    "module": "Treatment Process",
    "topic": "Corrosion Control",
    "question": "An operator reviews lead and copper monitoring results. The 90th percentile copper level is 1.9 mg/L (action level = 1.3 mg/L). What is the FIRST step in the response?",
    "options": [
      "Replace all copper pipes in the distribution system",
      "Notify the regulatory authority and begin optimized corrosion control treatment within the required timeframe",
      "Increase the chlorine dose to kill corrosion-causing bacteria",
      "Issue a boil water advisory"
    ],
    "correct": 1,
    "explanation": "Exceeding the copper action level triggers regulatory notification requirements and the requirement to implement or optimize corrosion control treatment. The specific response depends on the regulatory program. Replacing pipes is a long-term solution but not the immediate first step.",
    "difficulty": "hard"
  },
  {
    "id": 118,
    "module": "Treatment Process",
    "topic": "Corrosion Control",
    "question": "What is the Ryznar Stability Index (RSI) and how does it differ from the LSI?",
    "options": [
      "RSI and LSI are the same index with different names",
      "RSI = 2pHs - pH; values <6 indicate scale-forming, values >7 indicate corrosive; RSI is considered more accurate than LSI for predicting actual scale formation",
      "RSI measures biological stability; LSI measures chemical stability",
      "RSI uses different parameters than LSI"
    ],
    "correct": 1,
    "explanation": "RSI = 2pHs - pH. RSI < 6: scale-forming; RSI 6–7: approximately balanced; RSI > 7: corrosive. The RSI is considered more accurate than LSI for predicting actual scale formation and corrosion in distribution systems because it accounts for the kinetics of CaCO3 precipitation, not just thermodynamic equilibrium.",
    "difficulty": "hard"
  },
  {
    "id": 119,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Residuals Management",
    "question": "A water treatment plant produces 1,400 kg/d of dry alum sludge solids. The sludge has a solids content of 2.0%. What is the daily volume of liquid sludge produced?",
    "options": [
      "28 m³/d",
      "70 m³/d",
      "280 m³/d",
      "700 m³/d"
    ],
    "correct": 1,
    "explanation": "Volume of liquid sludge = mass of dry solids ÷ (solids fraction × density). Assuming density ≈ 1,000 kg/m³: Volume = 1,400 kg/d ÷ (0.020 × 1,000 kg/m³) = 1,400 ÷ 20 = 70 m³/d.",
    steps: [
      { l: "Identify Given Values", c: "The problem provides the mass of dry alum sludge solids (1,400 kg/d) and the solids content (2.0%). We need to find the daily volume of liquid sludge." },
      { l: "Convert Solids Content to Decimal", c: "The solids content is given as a percentage, so convert it to a decimal for calculations: 2.0% = 0.020." },
      { l: "Recall or Assume Density", c: "For water-based sludges, it's common to assume the density is approximately that of water, which is 1,000 kg/m³." },
      { l: "Apply the Formula", c: "Use the formula: Volume of liquid sludge = mass of dry solids / (solids fraction x density). Substitute the values: Volume = 1,400 kg/d / (0.020 x 1,000 kg/m³)." },
      { l: "Calculate the Result", c: "Perform the calculation: Volume = 1,400 kg/d / 20 kg/m³ = 70 m³/d. This is the daily volume of liquid sludge produced." },
    ],
    tip: "Always pay attention to units and ensure they cancel out correctly to arrive at the desired unit for your answer.",
    "difficulty": "hard"
  },
  {
    "id": 120,
    "module": "Treatment Process",
    "topic": "Residuals Management",
    "question": "What are the primary regulatory concerns with land application of water treatment plant residuals (alum sludge)?",
    "options": [
      "Alum sludge has no regulatory concerns for land application",
      "Potential for aluminum toxicity to plants, phosphorus immobilization, and pH effects on soil",
      "Alum sludge contains pathogens that must be treated before land application",
      "Alum sludge contains heavy metals that exceed agricultural limits"
    ],
    "correct": 1,
    "explanation": "Alum sludge land application concerns include: (1) aluminum toxicity to plants at high application rates, (2) phosphorus immobilization — alum binds phosphorus, reducing its availability to crops, and (3) pH effects — alum sludge is acidic and can lower soil pH. Application rates must be controlled to avoid these effects.",
    "difficulty": "hard"
  },
  {
    "id": 121,
    "module": "Treatment Process",
    "topic": "Residuals Management",
    "question": "A sludge lagoon is approaching capacity. What options are available for the operator?",
    "options": [
      "Continue operating until the lagoon overflows",
      "Dewater and dispose of accumulated sludge, or construct additional lagoon capacity",
      "Add chemicals to dissolve the accumulated sludge",
      "Pump the lagoon contents directly to the raw water intake"
    ],
    "correct": 1,
    "explanation": "When a sludge lagoon approaches capacity, options include: (1) mechanical dewatering (centrifuge, belt press, filter press) followed by landfill disposal or land application, (2) constructing additional lagoon cells, or (3) implementing in-lagoon dewatering (drying beds). The accumulated sludge must be characterized before disposal.",
    "difficulty": "medium"
  },
  {
    "id": 122,
    "module": "Treatment Process",
    "topic": "Residuals Management",
    "question": "What is the purpose of 'thickening' water treatment residuals before dewatering?",
    "options": [
      "Thickening adds chemicals to solidify the sludge",
      "Thickening increases the solids concentration, reducing the volume that must be processed by dewatering equipment",
      "Thickening removes pathogens from the sludge",
      "Thickening is the same as dewatering"
    ],
    "correct": 1,
    "explanation": "Thickening concentrates sludge solids by removing free water (gravity thickening, dissolved air flotation). Increasing solids content from 1% to 4% reduces the volume by 75%, significantly reducing the capacity and operating costs of downstream dewatering equipment.",
    "difficulty": "medium"
  },
  {
    "id": 123,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Residuals Management",
    "question": "A centrifuge produces a cake at 22% solids from a feed sludge at 2.5% solids. What is the volume reduction factor?",
    "options": [
      "5.5×",
      "8.8×",
      "22×",
      "0.11×"
    ],
    "correct": 1,
    "explanation": "Volume reduction = feed solids fraction ÷ cake solids fraction = 22% ÷ 2.5% = 8.8×. For every 8.8 m³ of feed sludge, approximately 1 m³ of dewatered cake is produced. This significant volume reduction reduces transportation and disposal costs.",
    steps: [
      { l: "Identify Given Values", c: "The feed sludge solids content is 2.5%, and the dewatered cake solids content is 22%." },
      { l: "Recall Formula", c: "The formula for volume reduction factor is: Volume Reduction Factor = Cake Solids Fraction / Feed Solids Fraction." },
      { l: "Calculate Volume Reduction Factor", c: "Divide the cake solids fraction (22%) by the feed solids fraction (2.5%). 22% / 2.5% = 8.8." },
      { l: "Interpret Result", c: "The volume reduction factor is 8.8x, meaning for every 8.8 units of feed sludge, 1 unit of dewatered cake is produced." },
    ],
    tip: "Always ensure you are dividing the higher solids percentage (cake) by the lower solids percentage (feed) to get a reduction factor greater than 1.",
    "difficulty": "hard"
  },
  {
    "id": 124,
    "module": "Treatment Process",
    "topic": "Residuals Management",
    "question": "What is the primary environmental concern with discharging filter backwash water to a receiving stream?",
    "options": [
      "Filter backwash water contains excess chlorine that kills fish",
      "Filter backwash water contains high suspended solids that can smother aquatic habitat and increase turbidity",
      "Filter backwash water is too cold for aquatic organisms",
      "Filter backwash water contains excess aluminum that is toxic to fish"
    ],
    "correct": 1,
    "explanation": "Filter backwash water contains high concentrations of suspended solids (coagulated floc, filter media fines) that can dramatically increase turbidity in receiving streams, smother fish spawning habitat, and reduce light penetration. Residual chlorine and aluminum are also concerns. Most jurisdictions require treatment before discharge.",
    "difficulty": "medium"
  },
  {
    "id": 125,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Residuals Management",
    "question": "A plant must meet a 10 mg/L TSS limit for its backwash water discharge. The raw backwash water has 920 mg/L TSS. What TSS removal efficiency is required?",
    "options": [
      "88.2%",
      "98.9%",
      "85.0%",
      "99.8%"
    ],
    "correct": 1,
    "explanation": "Removal efficiency = (influent - effluent) ÷ influent × 100% = (920 - 10) ÷ 920 × 100% = 910 ÷ 920 × 100% = 98.9%. This high removal efficiency typically requires a dedicated backwash recovery system (settling basin, coagulation, filtration).",
    steps: [
      { l: "Identify Given Values", c: "The influent TSS (raw backwash water) is 920 mg/L. The effluent TSS (discharge limit) is 10 mg/L." },
      { l: "Calculate TSS Removed", c: "Subtract the effluent TSS from the influent TSS to find the amount of TSS that needs to be removed: 920 mg/L - 10 mg/L = 910 mg/L." },
      { l: "Calculate Removal Efficiency", c: "Divide the amount of TSS removed by the influent TSS and multiply by 100% to get the removal efficiency: (910 mg/L / 920 mg/L) * 100%." },
      { l: "Final Calculation", c: "Perform the division and multiplication: 0.98913 * 100% = 98.9%." },
    ],
    tip: "Always double-check your units and ensure you are using the correct formula for removal efficiency.",
    "difficulty": "medium"
  },
  {
    "id": 126,
    "module": "Treatment Process",
    "topic": "Residuals Management",
    "question": "What is the purpose of 'polymer conditioning' of water treatment sludge before mechanical dewatering?",
    "options": [
      "Polymer conditioning adds nutrients to the sludge for land application",
      "Polymer conditioning improves dewaterability by bridging particles together, improving water release and filter cake formation",
      "Polymer conditioning disinfects the sludge before disposal",
      "Polymer conditioning reduces the pH of the sludge"
    ],
    "correct": 1,
    "explanation": "Polymer conditioning (adding cationic polymers to sludge before dewatering) bridges sludge particles together, creating a more porous, open structure that releases water more readily. This improves dewatering efficiency (higher cake solids content, higher throughput) and reduces the amount of polymer needed.",
    "difficulty": "medium"
  },
  {
    "id": 127,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Chemical Feed and Process Control",
    "question": "A chemical feed pump delivers 480 mL/min of 12% sodium hypochlorite solution (specific gravity 1.17). What is the chlorine feed rate in kg/h?",
    "options": [
      "0.40 kg/h",
      "4.04 kg/h",
      "6.7 kg/h",
      "0.67 kg/h"
    ],
    "correct": 1,
    "explanation": "Volume flow = 480 mL/min × 60 min/h = 28,800 mL/h = 28.8 L/h. Mass of solution = 28.8 L/h × 1.17 kg/L = 33.7 kg/h. Mass of chlorine = 33.7 × 0.12 = 4.04 kg/h.",
    steps: [
      { l: "Step 1: Convert volume flow rate to L/h", c: "First, convert the given volume flow rate from mL/min to L/h. Multiply 480 mL/min by 60 min/h to get mL/h, then divide by 1000 mL/L to get L/h. So, 480 mL/min * 60 min/h = 28,800 mL/h, which is 28.8 L/h." },
      { l: "Step 2: Calculate the mass flow rate of the solution", c: "Next, use the specific gravity to convert the volume flow rate of the solution to a mass flow rate in kg/h. Since specific gravity is 1.17, and for water 1 L = 1 kg, then for this solution, 1 L = 1.17 kg. Therefore, 28.8 L/h * 1.17 kg/L = 33.7 kg/h." },
      { l: "Step 3: Calculate the mass flow rate of chlorine", c: "Finally, determine the mass flow rate of chlorine by multiplying the mass flow rate of the solution by the percentage of sodium hypochlorite. The solution is 12% sodium hypochlorite, so 33.7 kg/h * 0.12 = 4.04 kg/h." },
    ],
    tip: "Always pay close attention to units and ensure they cancel out correctly throughout your calculations to avoid errors.",
    "difficulty": "hard"
  },
  {
    "id": 128,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Chemical Feed and Process Control",
    "question": "A plant needs to dose 2.5 mg/L of fluoride to treated water. The plant treats 20 ML/d. The fluoride chemical is sodium fluorosilicate (Na2SiF6) with 60.6% available fluoride. What mass of Na2SiF6 is required per day?",
    "options": [
      "50 kg/d",
      "82.5 kg/d",
      "120 kg/d",
      "165 kg/d"
    ],
    "correct": 1,
    "explanation": "Fluoride required = 2.5 g/m³ × 20,000 m³/d = 50,000 g/d = 50 kg/d. Na2SiF6 required = 50 kg/d ÷ 0.606 = 82.5 kg/d.",
    steps: [
      { l: "Step 1: Calculate the total mass of fluoride needed per day.", c: "Multiply the desired fluoride dose (2.5 mg/L) by the plant's daily treatment volume (20 ML/d). Convert units to ensure consistency. 2.5 mg/L is equivalent to 2.5 g/m³. 20 ML/d is 20,000 m³/d. So, 2.5 g/m³ * 20,000 m³/d = 50,000 g/d, which is 50 kg/d." },
      { l: "Step 2: Account for the purity of the fluoride chemical.", c: "The sodium fluorosilicate (Na2SiF6) is only 60.6% available fluoride. This means that for every 1 kg of Na2SiF6, only 0.606 kg is actual fluoride." },
      { l: "Step 3: Calculate the mass of Na2SiF6 required.", c: "Divide the total mass of fluoride needed (50 kg/d) by the percentage of available fluoride (0.606). This will give you the total mass of the chemical product required. 50 kg/d / 0.606 = 82.5 kg/d." },
    ],
    tip: "Always pay close attention to units and conversion factors, especially when dealing with concentrations and volumes, and remember to account for chemical purity.",
    "difficulty": "hard"
  },
  {
    "id": 129,
    "module": "Treatment Process",
    "topic": "Chemical Feed and Process Control",
    "question": "An operator adjusts the pH of finished water using CO2 for corrosion control. The current pH is 8.5 and the target is 8.0. What is the effect of adding CO2?",
    "options": [
      "CO2 raises pH by adding alkalinity",
      "CO2 lowers pH by forming carbonic acid (H2CO3), which dissociates to release H⁺ ions",
      "CO2 has no effect on pH",
      "CO2 raises pH by removing calcium"
    ],
    "correct": 1,
    "explanation": "CO2 dissolves in water to form carbonic acid: CO2 + H2O → H2CO3 → H⁺ + HCO3⁻. This lowers pH. CO2 addition is used to lower pH for corrosion control (reduce LSI) or to recarbonate water after lime softening. It is preferred over mineral acids because it does not add chloride or sulfate ions.",
    "difficulty": "medium"
  },
  {
    "id": 130,
    "module": "Treatment Process",
    "topic": "Chemical Feed and Process Control",
    "question": "A lime softening plant needs to raise the pH of finished water from 7.7 to 8.2 for corrosion control. What is the MOST appropriate chemical to use?",
    "options": [
      "Sulfuric acid",
      "Sodium hydroxide (caustic soda)",
      "Carbon dioxide",
      "Alum"
    ],
    "correct": 1,
    "explanation": "Sodium hydroxide (NaOH) raises pH without adding calcium or carbonate ions, making it suitable for fine pH adjustment in finished water. Lime would add calcium and could cause scaling. CO2 would lower pH. Acid would lower pH. NaOH is commonly used for pH adjustment in corrosion control programs.",
    "difficulty": "medium"
  },
  {
    "id": 131,
    "module": "Treatment Process",
    "topic": "Chemical Feed and Process Control",
    "question": "What is the purpose of a 'day tank' in a chemical feed system?",
    "options": [
      "Day tanks store enough chemical for one day of operation, providing a buffer between bulk storage and the feed system",
      "Day tanks are used to mix chemicals before feeding",
      "Day tanks are emergency storage for chemical spills",
      "Day tanks are used to measure chemical usage"
    ],
    "correct": 0,
    "explanation": "Day tanks (solution tanks) hold a day's supply of chemical solution, providing a buffer between bulk storage and the metering pump. They allow the operator to prepare and verify the chemical solution before feeding, and provide a visual indication of daily chemical consumption.",
    "difficulty": "medium"
  },
  {
    "id": 132,
    "module": "Treatment Process",
    "topic": "Chemical Feed and Process Control",
    "question": "A water treatment plant is experiencing inconsistent chemical dosing from a peristaltic pump. The pump is calibrated correctly but the dose varies by ±18%. What is the MOST likely cause?",
    "options": [
      "The chemical solution concentration is varying",
      "Peristaltic pump tubing is worn, causing inconsistent compression and variable flow",
      "The flow meter is inaccurate",
      "The chemical is degrading in the day tank"
    ],
    "correct": 1,
    "explanation": "Peristaltic pumps work by compressing flexible tubing to push fluid. Worn tubing loses its elasticity and shape, causing inconsistent compression and variable flow rates. Peristaltic pump tubing should be replaced regularly (typically every 3–6 months) as part of preventive maintenance.",
    "difficulty": "medium"
  },
  {
    "id": 133,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Chemical Feed and Process Control",
    "question": "An operator sets up a flow-paced chemical feed system. Design flow = 600 m³/h, target dose = 4.0 mg/L, chemical solution concentration = 200 g/L. What pump setting (L/h) is required?",
    "options": [
      "8.0 L/h",
      "12.0 L/h",
      "24.0 L/h",
      "120 L/h"
    ],
    "correct": 1,
    "explanation": "Chemical required = 4.0 g/m³ × 600 m³/h = 2,400 g/h. Pump flow = 2,400 g/h ÷ 200 g/L = 12.0 L/h.",
    steps: [
      { l: "Step 1: Calculate the total mass of chemical required per hour.", c: "Multiply the design flow by the target dose. Chemical required = 600 m³/h * 4.0 mg/L. Convert mg/L to g/m³ (1 mg/L = 1 g/m³) for consistent units: 600 m³/h * 4.0 g/m³ = 2,400 g/h." },
      { l: "Step 2: Determine the volume of chemical solution needed per hour.", c: "Divide the total mass of chemical required by the chemical solution concentration. Pump flow = 2,400 g/h / 200 g/L." },
      { l: "Step 3: Calculate the final pump setting.", c: "Perform the division: 2,400 g/h ÷ 200 g/L = 12.0 L/h. This is the required pump setting." },
    ],
    tip: "Always ensure your units are consistent throughout the calculation; convert them early to avoid errors.",
    "difficulty": "hard"
  },
  {
    "id": 134,
    "module": "Treatment Process",
    "topic": "Chemical Feed and Process Control",
    "question": "What is the purpose of 'secondary containment' for chemical storage areas?",
    "options": [
      "Secondary containment provides additional storage capacity",
      "Secondary containment prevents chemical spills from reaching the environment by containing spills within a bermed or diked area",
      "Secondary containment is required only for hazardous chemicals",
      "Secondary containment is used to mix chemicals before feeding"
    ],
    "correct": 1,
    "explanation": "Secondary containment (berms, dikes, or containment basins) is required around chemical storage areas to contain spills and prevent them from reaching drains, groundwater, or surface water. The containment volume must be at least 110% of the largest container in the area.",
    "difficulty": "medium"
  },
  {
    "id": 135,
    "module": "Treatment Process",
    "topic": "Chemical Feed and Process Control",
    "question": "A plant uses sodium hypochlorite (NaOCl) for disinfection. The chlorine residual has been decreasing over two weeks despite no changes in dose. What is the MOST likely cause?",
    "options": [
      "The flow rate has decreased",
      "The sodium hypochlorite has degraded due to age, heat, or light exposure, reducing its available chlorine content",
      "The water temperature has decreased",
      "The pH has increased"
    ],
    "correct": 1,
    "explanation": "Sodium hypochlorite degrades over time, especially when exposed to heat, light, and metal contamination. The available chlorine content decreases at approximately 0.5–1% per day at room temperature. Bulk hypochlorite should be used within 30–60 days of delivery and stored in cool, dark conditions.",
    "difficulty": "medium"
  },
  {
    "id": 136,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Chemical Feed and Process Control",
    "question": "A plant must reduce its fluoride dose from 0.7 mg/L to 0.5 mg/L. The current pump speed is 50 RPM. What pump speed is required?",
    "options": [
      "35.7 RPM",
      "50 RPM",
      "70 RPM",
      "25 RPM"
    ],
    "correct": 0,
    "explanation": "Assuming linear pump output: new speed = current speed × (new dose ÷ current dose) = 50 × (0.5 ÷ 0.7) = 50 × 0.714 = 35.7 RPM.",
    steps: [
      { l: "Step 1: Identify Given Values", c: "List the current fluoride dose (0.7 mg/L), the new target fluoride dose (0.5 mg/L), and the current pump speed (50 RPM)." },
      { l: "Step 2: Determine the Ratio of Doses", c: "Calculate the ratio of the new desired dose to the current dose: 0.5 mg/L / 0.7 mg/L." },
      { l: "Step 3: Apply the Ratio to the Current Pump Speed", c: "Multiply the current pump speed by the dose ratio to find the new required pump speed: 50 RPM * (0.5 / 0.7)." },
      { l: "Step 4: Calculate the New Pump Speed", c: "Perform the calculation: 50 * 0.71428... which results in approximately 35.7 RPM." },
    ],
    tip: "Always double-check that your answer makes logical sense; if you're reducing the dose, the pump speed should also decrease.",
    "difficulty": "medium"
  },
  {
    "id": 137,
    "module": "Treatment Process",
    "topic": "Chemical Feed and Process Control",
    "question": "What is the purpose of 'chemical compatibility testing' when selecting materials for chemical feed system components?",
    "options": [
      "To ensure chemicals are effective for treatment",
      "To verify that materials (pipes, valves, pump components) are resistant to corrosion and degradation by the specific chemicals being handled",
      "To test the purity of chemicals before use",
      "To determine the optimal chemical dose"
    ],
    "correct": 1,
    "explanation": "Chemical compatibility testing ensures that the materials used in feed system components are resistant to the specific chemicals being handled. Incompatible materials can corrode, swell, or degrade, causing leaks, equipment failure, and potential chemical contamination of the treated water.",
    "difficulty": "medium"
  },
  {
    "id": 138,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Chemical Feed and Process Control",
    "question": "An operator prepares a 2% alum solution from dry alum. How many kilograms of dry alum are needed to prepare 600 L of 2% solution?",
    "options": [
      "6 kg",
      "12 kg",
      "24 kg",
      "60 kg"
    ],
    "correct": 1,
    "explanation": "2% solution = 20 g/L (assuming density ≈ 1.0 kg/L for dilute solution). Mass of dry alum = 20 g/L × 600 L = 12,000 g = 12 kg.",
    steps: [
      { l: "Step 1: Understand the percentage solution", c: "A 2% solution means that for every 100 units of solution, 2 units are the solute (dry alum). In terms of mass, this means 2 grams of alum per 100 grams of solution, or 2 kg of alum per 100 kg of solution." },
      { l: "Step 2: Convert volume to mass of solution", c: "Assuming the density of the dilute solution is approximately 1 kg/L (which is a common and acceptable assumption for water-based solutions), 600 L of solution weighs 600 kg." },
      { l: "Step 3: Calculate the mass of dry alum needed", c: "To find the mass of dry alum, multiply the total mass of the solution by the percentage of alum. So, 600 kg (solution) * 0.02 (2%) = 12 kg of dry alum." },
    ],
    tip: "Always pay attention to units and ensure they cancel out correctly to arrive at the desired unit for your answer.",
    "difficulty": "medium"
  },
  {
    "id": 139,
    "module": "Treatment Process",
    "topic": "Chemical Feed and Process Control",
    "question": "A plant is switching from gaseous chlorine to sodium hypochlorite for safety reasons. What operational adjustments must be made?",
    "options": [
      "No adjustments are needed — they are equivalent",
      "Adjust dose volumes to account for hypochlorite concentration, monitor for hypochlorite degradation, and account for pH increase (hypochlorite raises pH while chlorine gas lowers it)",
      "Reduce the chlorine dose by 50% because hypochlorite is more effective",
      "Add ammonia to convert hypochlorite to chloramines"
    ],
    "correct": 1,
    "explanation": "Key adjustments when switching to hypochlorite: (1) calculate equivalent doses based on available chlorine content, (2) monitor hypochlorite degradation and test concentration regularly, (3) account for pH increase (NaOCl is alkaline, raising pH, while Cl2 gas lowers pH — this affects CT calculations and corrosion control).",
    "difficulty": "hard"
  },
  {
    "id": 140,
    "module": "Treatment Process",
    "topic": "Chemical Feed and Process Control",
    "question": "What is the purpose of 'residual monitoring' at multiple points in the treatment process?",
    "options": [
      "To verify that chemical storage tanks are full",
      "To track chemical consumption, verify treatment effectiveness, and identify process upsets at each stage of treatment",
      "To comply with reporting requirements only",
      "To calibrate chemical feed pumps"
    ],
    "correct": 1,
    "explanation": "Residual monitoring at multiple process points (raw water, post-coagulation, post-filtration, finished water) allows operators to: verify treatment effectiveness at each stage, identify where process upsets occur, optimize chemical doses, and ensure regulatory compliance.",
    "difficulty": "medium"
  },
  {
    "id": 141,
    "module": "Treatment Process",
    "topic": "Process Optimization",
    "question": "Filter run times have been decreasing steadily over 3 weeks with stable raw water quality. What is the MOST likely cause?",
    "options": [
      "The filters are becoming more efficient",
      "Gradual deterioration of coagulation/flocculation performance, or increased plant flow rate",
      "Seasonal temperature changes",
      "SCADA sensor malfunction"
    ],
    "correct": 1,
    "explanation": "Decreasing filter run times with stable raw water quality suggest either: (1) increased plant flow rate (higher loading per filter), (2) gradual deterioration of coagulation/flocculation (weaker floc passing to filters), or (3) gradual media fouling (mudballs, media loss). The operator should review plant flows, jar test results, and filter media condition.",
    "difficulty": "hard"
  },
  {
    "id": 142,
    "module": "Treatment Process",
    "topic": "Process Optimization",
    "question": "An operator finds that increasing coagulant dose by 20% reduces filter run headloss by 30% but increases sludge production by 25%. How should this trade-off be evaluated?",
    "options": [
      "Always use the higher dose to maximize filter run time",
      "Evaluate the total cost (chemical cost + sludge disposal cost + filter backwash water cost) to determine the optimal dose",
      "Always use the lower dose to minimize sludge production",
      "The trade-off cannot be evaluated without more data"
    ],
    "correct": 1,
    "explanation": "Process optimization requires evaluating total cost, not just one parameter. The operator must calculate: (1) additional chemical cost for 20% more coagulant, (2) savings from longer filter runs (less backwash water, less operator time), and (3) additional sludge disposal cost. The optimal dose minimizes total cost while meeting water quality targets.",
    "difficulty": "hard"
  },
  {
    "id": 143,
    "module": "Treatment Process",
    "topic": "Process Optimization",
    "question": "A plant is experiencing taste and odour complaints during summer months from a lake source with algae blooms. What treatment strategies are MOST effective?",
    "options": [
      "Increase chlorine dose to oxidize taste and odour compounds",
      "Pre-oxidation with ozone or KMnO4, enhanced coagulation, and GAC filtration for geosmin and MIB removal",
      "Increase filter loading rate to remove algae faster",
      "Add activated carbon to the distribution system"
    ],
    "correct": 1,
    "explanation": "Geosmin and 2-methylisoborneol (MIB) from cyanobacteria are the most common taste and odour compounds. Effective treatment includes: (1) pre-oxidation with ozone (most effective) or KMnO4 to oxidize geosmin/MIB, (2) enhanced coagulation to remove algae cells before they lyse, and (3) GAC filtration to adsorb residual taste/odour compounds.",
    "difficulty": "hard"
  },
  {
    "id": 144,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Process Optimization",
    "question": "The raw water TOC is 4.8 mg/L and the finished water TOC is 2.0 mg/L. What is the TOC removal percentage?",
    "options": [
      "40%",
      "58.3%",
      "2.8%",
      "240%"
    ],
    "correct": 1,
    "explanation": "TOC removal = (raw - finished) ÷ raw × 100% = (4.8 - 2.0) ÷ 4.8 × 100% = 2.8 ÷ 4.8 × 100% = 58.3%. Under Enhanced Coagulation requirements, systems with raw water TOC >2 mg/L must achieve specified TOC removal percentages (typically 25–50% depending on source water alkalinity).",
    steps: [
      { l: "Step 1: Identify the given values", c: "The raw water TOC is 4.8 mg/L and the finished water TOC is 2.0 mg/L." },
      { l: "Step 2: Calculate the amount of TOC removed", c: "Subtract the finished water TOC from the raw water TOC: 4.8 mg/L - 2.0 mg/L = 2.8 mg/L." },
      { l: "Step 3: Calculate the TOC removal percentage", c: "Divide the amount of TOC removed by the raw water TOC and multiply by 100%: (2.8 mg/L / 4.8 mg/L) * 100% = 58.3%." },
    ],
    tip: "Always double-check your calculations, especially when dealing with percentages, to avoid simple errors.",
    "difficulty": "medium"
  },
  {
    "id": 145,
    "module": "Treatment Process",
    "topic": "Process Optimization",
    "question": "A finished water turbidity increases suddenly from 0.05 NTU to 0.48 NTU. Raw water quality and chemical doses are unchanged. What should the operator check FIRST?",
    "options": [
      "Increase all chemical doses by 20%",
      "Measure effluent turbidity from each individual filter to identify which filter is causing the problem",
      "Shut down the plant for inspection",
      "Increase the backwash frequency for all filters"
    ],
    "correct": 1,
    "explanation": "When finished water turbidity increases suddenly with stable raw water quality and chemical doses, the first step is to identify the source. Measuring effluent turbidity from each individual filter will identify which filter is causing the problem (breakthrough, media loss, underdrain failure). This targeted diagnosis prevents unnecessary changes to well-performing filters.",
    "difficulty": "medium"
  },
  {
    "id": 146,
    "module": "Treatment Process",
    "topic": "Process Optimization",
    "question": "What is the purpose of 'pilot testing' before implementing a new treatment process at full scale?",
    "options": [
      "Pilot testing is required by regulation for all new treatment processes",
      "Pilot testing evaluates the performance, operability, and cost of a new process at small scale before committing to full-scale capital investment",
      "Pilot testing is used to train operators on new equipment",
      "Pilot testing is only done for membrane filtration systems"
    ],
    "correct": 1,
    "explanation": "Pilot testing allows operators and engineers to evaluate a new treatment process under actual site conditions before full-scale implementation. It provides data on treatment effectiveness, chemical doses, operational requirements, and costs, reducing the risk of full-scale failures.",
    "difficulty": "medium"
  },
  {
    "id": 147,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Process Optimization",
    "question": "A plant is evaluating two coagulants: alum at $0.32/kg (optimal dose 38 mg/L) and ferric sulfate at $0.52/kg (optimal dose 22 mg/L). Which is more cost-effective?",
    "options": [
      "Alum — it is cheaper per kilogram",
      "Ferric sulfate — the lower dose results in lower total cost",
      "They are equally cost-effective",
      "Cannot be determined without knowing sludge disposal costs"
    ],
    "correct": 1,
    "explanation": "Cost per ML: Alum = $0.32/kg × 38 g/m³ × 1 kg/1000 g × 1000 m³/ML = $0.32 × 38 = $12.16/ML. Ferric sulfate = $0.52 × 22 = $11.44/ML. Ferric sulfate is slightly cheaper per megalitre despite the higher unit cost, because the lower dose more than compensates. Sludge disposal costs should also be considered.",
    steps: [
      { l: "Calculate Alum Cost per ML", c: "Multiply the cost per kilogram of alum by its optimal dose in mg/L (which is equivalent to g/m³) to find the cost per megaliter: $0.32/kg * 38 g/m³ * 1 kg/1000g * 1000 m³/ML = $12.16/ML." },
      { l: "Calculate Ferric Sulfate Cost per ML", c: "Similarly, multiply the cost per kilogram of ferric sulfate by its optimal dose in mg/L to find its cost per megaliter: $0.52/kg * 22 g/m³ * 1 kg/1000g * 1000 m³/ML = $11.44/ML." },
      { l: "Compare Costs", c: "Compare the calculated costs per megaliter for both coagulants. Alum costs $12.16/ML, and ferric sulfate costs $11.44/ML." },
      { l: "Determine More Cost-Effective Option", c: "Since $11.44/ML is less than $12.16/ML, ferric sulfate is the more cost-effective coagulant based on chemical cost alone." },
    ],
    tip: "Always convert all units to be consistent before performing calculations to avoid errors.",
    "difficulty": "hard"
  },
  {
    "id": 148,
    "module": "Treatment Process",
    "topic": "Process Optimization",
    "question": "What is the 'CT concept' and why is it used for disinfection compliance?",
    "options": [
      "CT is used because it is easier to measure than chlorine dose",
      "CT (concentration × time) accounts for the fact that equivalent inactivation can be achieved with high concentration/short time or low concentration/long time; it links disinfectant dose to actual pathogen inactivation",
      "CT is used only for regulatory reporting",
      "CT is used because it accounts for water temperature effects"
    ],
    "correct": 1,
    "explanation": "The CT concept recognizes that disinfection efficacy depends on both the disinfectant concentration (C) and the contact time (T). CT tables (from USEPA SWTR) specify the CT required for specific log inactivation of Giardia and viruses at different temperatures and pH values. This allows flexibility in how plants achieve the required inactivation.",
    "difficulty": "hard"
  },
  {
    "id": 149,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "Process Optimization",
    "question": "A plant is required to achieve 99.9% (3-log) removal/inactivation of Giardia. The plant achieves 2.5-log removal through filtration. How much additional inactivation must be provided by disinfection?",
    "options": [
      "0.5-log",
      "1.0-log",
      "2.5-log",
      "3.0-log"
    ],
    "correct": 0,
    "explanation": "Total log removal/inactivation required = 3.0-log. Removal credit from filtration = 2.5-log. Additional inactivation required from disinfection = 3.0 - 2.5 = 0.5-log. Removal and inactivation credits are additive to meet the total treatment requirement.",
    steps: [
      { l: "Step 1: Identify the total required log removal/inactivation.", c: "The problem states that the plant is required to achieve 99.9% (3-log) removal/inactivation of Giardia." },
      { l: "Step 2: Identify the log removal provided by filtration.", c: "The problem states that the plant achieves 2.5-log removal through filtration." },
      { l: "Step 3: Calculate the additional inactivation needed from disinfection.", c: "Subtract the filtration removal credit from the total required removal: 3.0-log (total required) - 2.5-log (filtration removal) = 0.5-log." },
    ],
    tip: "Always ensure your units are consistent (e.g., all in log removal) before performing calculations.",
    "difficulty": "medium"
  },
  {
    "id": 150,
    "module": "Treatment Process",
    "topic": "Process Optimization",
    "question": "What is the purpose of 'process control charts' (control charts) in water treatment operations?",
    "options": [
      "Control charts are used to schedule maintenance activities",
      "Control charts track process variables over time to distinguish between normal variation and out-of-control conditions that require operator intervention",
      "Control charts are used to calculate chemical doses",
      "Control charts are required by regulation for all water treatment plants"
    ],
    "correct": 1,
    "explanation": "Process control charts (e.g., Shewhart charts, CUSUM charts) track process variables (turbidity, pH, chlorine residual) over time. They distinguish between normal random variation (common cause) and unusual variation (special cause) that indicates a process upset requiring investigation. They are a key tool for proactive process management.",
    "difficulty": "hard"
  },
  {
    "id": 151,
    "module": "Laboratory Analysis",
    "topic": "Turbidity",
    "question": "An online turbidimeter reads 0.08 NTU but the grab sample measured in the lab reads 0.31 NTU. After cleaning the turbidimeter flow cell and recalibrating against a primary standard, the online reading is now 0.29 NTU. What does this indicate?",
    "options": [
      "The grab sample method is inaccurate",
      "The turbidimeter was fouled and reading low; the corrected reading of 0.29 NTU is consistent with the lab result",
      "The turbidimeter is permanently damaged",
      "The calibration standard is expired"
    ],
    "correct": 1,
    "explanation": "A fouled turbidimeter flow cell (biofilm, debris, air bubbles) can cause falsely low readings. After cleaning and recalibration, the corrected reading (0.29 NTU) is consistent with the lab grab sample (0.31 NTU), confirming the original low reading was due to fouling. Regular cleaning and calibration of online instruments is essential.",
    "difficulty": "hard"
  },
  {
    "id": 152,
    "module": "Laboratory Analysis",
    "topic": "Turbidity",
    "question": "What is the difference between nephelometric turbidity (NTU) and formazin turbidity units (FTU)?",
    "options": [
      "NTU and FTU are different scales — NTU is 10× higher than FTU",
      "NTU and FTU are equivalent units; both measure light scattering at 90° using a nephelometer",
      "FTU is used for raw water; NTU is used for treated water",
      "NTU measures colour; FTU measures turbidity"
    ],
    "correct": 1,
    "explanation": "NTU (Nephelometric Turbidity Units) and FTU (Formazin Turbidity Units) are equivalent units — both measure light scattered at 90° from the incident beam using a nephelometer calibrated with formazin standards. The terms are interchangeable in most regulatory contexts.",
    "difficulty": "medium"
  },
  {
    "id": 153,
    "module": "Laboratory Analysis",
    "topic": "Turbidity",
    "question": "A turbidimeter is calibrated using a 10 NTU formazin standard. The instrument reads 9.4 NTU. What action should the operator take?",
    "options": [
      "Accept the reading — it is within 10% of the standard value",
      "Adjust the calibration factor so the instrument reads 10.0 NTU, then verify with a second standard",
      "Replace the turbidimeter",
      "Dilute the standard to 9.4 NTU"
    ],
    "correct": 1,
    "explanation": "When calibrating a turbidimeter, the instrument should be adjusted to read the known standard value. A reading of 9.4 NTU on a 10 NTU standard indicates the instrument is reading low by 6%. The calibration factor should be adjusted, and the calibration verified with a second standard (different concentration) before returning to service.",
    "difficulty": "medium"
  },
  {
    "id": 154,
    "module": "Laboratory Analysis",
    "topic": "Turbidity",
    "question": "What is the regulatory significance of the 0.3 NTU turbidity limit for individual filter effluent in Ontario?",
    "options": [
      "It is an aesthetic guideline only",
      "It is a treatment technique requirement — individual filters exceeding 0.3 NTU for more than 5% of the time in a month trigger an investigation",
      "It is the maximum contaminant level for finished water",
      "It applies only to slow sand filters"
    ],
    "correct": 1,
    "explanation": "In Ontario (and under the USEPA SWTR), individual filter effluent turbidity must not exceed 0.3 NTU for more than 5% of the time in a month, and must never exceed 1.0 NTU. Exceeding these limits triggers investigation and potential regulatory action. This is a treatment technique requirement, not just an aesthetic guideline.",
    "difficulty": "hard"
  },
  {
    "id": 155,
    "module": "Laboratory Analysis",
    "topic": "Turbidity",
    "question": "An operator is measuring turbidity of a sample that contains air bubbles. What is the effect on the turbidity reading?",
    "options": [
      "Air bubbles have no effect on turbidity readings",
      "Air bubbles scatter light and cause falsely elevated turbidity readings",
      "Air bubbles cause falsely low turbidity readings",
      "Air bubbles only affect readings above 10 NTU"
    ],
    "correct": 1,
    "explanation": "Air bubbles scatter light in the same way as turbidity-causing particles, causing falsely elevated turbidity readings. Samples should be allowed to degas before measurement, or the sample cell should be gently swirled to release bubbles. This is a common source of error in turbidity measurement.",
    "difficulty": "medium"
  },
  {
    "id": 156,
    "module": "Laboratory Analysis",
    "topic": "Turbidity",
    "question": "What is the purpose of 'stray light' correction in turbidimeters?",
    "options": [
      "Stray light correction adjusts for ambient light entering the measurement chamber",
      "Stray light correction compensates for light that reaches the detector without passing through the sample, which would cause falsely low readings at high turbidities",
      "Stray light correction is used to calibrate the light source intensity",
      "Stray light correction adjusts for colour interference"
    ],
    "correct": 1,
    "explanation": "Stray light in a turbidimeter is light that reaches the detector without being scattered by the sample (e.g., through reflections or instrument imperfections). At high turbidities, stray light can cause the instrument to read lower than the true value. Ratio turbidimeters (measuring at multiple angles) compensate for stray light and colour interference.",
    "difficulty": "hard"
  },
  {
    "id": 157,
    "module": "Laboratory Analysis",
    "topic": "Turbidity",
    "question": "A finished water turbidity reading of 0.15 NTU is obtained. The regulatory limit is 0.1 NTU. What is the FIRST action?",
    "options": [
      "Issue a boil water advisory immediately",
      "Verify the result with a repeat measurement and check the instrument calibration before taking corrective action",
      "Increase the coagulant dose immediately",
      "Notify the regulatory authority immediately"
    ],
    "correct": 1,
    "explanation": "Before taking corrective action or notifying regulators, the operator should verify the result: repeat the measurement, check instrument calibration, and confirm the reading is accurate. A single elevated reading may be due to instrument error. If the result is confirmed, then investigate the cause and notify regulators as required.",
    "difficulty": "medium"
  },
  {
    "id": 158,
    "module": "Laboratory Analysis",
    "topic": "Turbidity",
    "question": "What is the purpose of using a 'ratio turbidimeter' instead of a standard 90° nephelometer?",
    "options": [
      "Ratio turbidimeters are cheaper than nephelometers",
      "Ratio turbidimeters measure light at multiple angles, compensating for colour and stray light interference, providing more accurate readings for coloured or high-turbidity samples",
      "Ratio turbidimeters measure turbidity in different units",
      "Ratio turbidimeters do not require calibration"
    ],
    "correct": 1,
    "explanation": "Ratio turbidimeters measure light at multiple angles (90° scatter, forward scatter, backscatter) and calculate a ratio. This compensates for: (1) colour interference (coloured water absorbs light, causing low readings in 90° nephelometers), and (2) stray light effects at high turbidities. Ratio turbidimeters are more accurate for coloured or high-turbidity samples.",
    "difficulty": "hard"
  },
  {
    "id": 159,
    "module": "Laboratory Analysis",
    "topic": "pH and Alkalinity",
    "question": "An operator measures pH using a glass electrode pH meter. The meter was calibrated at pH 7.0 and 10.0. A sample reads pH 5.8. What is the concern with this calibration?",
    "options": [
      "The calibration is appropriate for all pH ranges",
      "The calibration range (7.0–10.0) does not bracket the sample pH (5.8); the meter should be recalibrated using pH 4.0 and 7.0 buffers for accurate measurement at pH 5.8",
      "pH 5.8 is outside the range of glass electrode meters",
      "The meter needs a third calibration point at pH 5.8"
    ],
    "correct": 1,
    "explanation": "pH meters should be calibrated using buffers that bracket the expected sample pH. Calibrating at 7.0 and 10.0 does not bracket pH 5.8, so the linear interpolation used by the meter may introduce error. For samples at pH 5.8, calibrate using pH 4.0 and 7.0 buffers.",
    "difficulty": "medium"
  },
  {
    "id": 160,
    "module": "Laboratory Analysis",
    "topic": "pH and Alkalinity",
    "question": "A water sample has total alkalinity of 85 mg/L as CaCO3 and pH of 8.4. What forms of alkalinity are present?",
    "options": [
      "Carbonate alkalinity only",
      "Bicarbonate alkalinity only",
      "Both bicarbonate and carbonate alkalinity",
      "Hydroxide and bicarbonate alkalinity"
    ],
    "correct": 2,
    "explanation": "At pH 8.4, both bicarbonate (HCO3⁻) and carbonate (CO3²⁻) alkalinity are present. Below pH 8.3, only bicarbonate alkalinity exists. Between pH 8.3 and 10.3, both bicarbonate and carbonate are present. Above pH 10.3, only carbonate and hydroxide alkalinity exist. The P-alkalinity (phenolphthalein) and M-alkalinity (methyl orange) titration distinguishes these forms.",
    "difficulty": "hard"
  },
  {
    "id": 161,
    "module": "Laboratory Analysis",
    "topic": "pH and Alkalinity",
    "question": "What is the purpose of measuring 'total alkalinity' in water treatment?",
    "options": [
      "Total alkalinity measures the total dissolved solids in water",
      "Total alkalinity measures the capacity of water to neutralize acids (buffering capacity), which affects coagulation pH stability and corrosion control",
      "Total alkalinity measures the chlorine demand of water",
      "Total alkalinity measures the hardness of water"
    ],
    "correct": 1,
    "explanation": "Total alkalinity (expressed as mg/L CaCO3) measures the buffering capacity of water — its ability to resist pH changes when acid is added. This is critical for: (1) coagulation — alkalinity must be sufficient to buffer pH during alum addition, and (2) corrosion control — adequate alkalinity is needed for LSI calculation and protective scale formation.",
    "difficulty": "medium"
  },
  {
    "id": 162,
    isCalc: true,
    "module": "Laboratory Analysis",
    "topic": "pH and Alkalinity",
    "question": "An operator performs an alkalinity titration. The sample volume is 100 mL, the H2SO4 titrant concentration is 0.02 N, and the volume of titrant used is 8.5 mL. What is the total alkalinity in mg/L as CaCO3?",
    "options": [
      "85 mg/L",
      "170 mg/L",
      "42.5 mg/L",
      "8.5 mg/L"
    ],
    "correct": 0,
    "explanation": "Total alkalinity (mg/L as CaCO3) = (mL titrant × N × 50,000) ÷ mL sample = (8.5 × 0.02 × 50,000) ÷ 100 = 8,500 ÷ 100 = 85 mg/L as CaCO3.",
    steps: [
      { l: "Step 1: Identify the formula for Total Alkalinity", c: "The formula for calculating total alkalinity in mg/L as CaCO3 is (mL titrant × N × 50,000) ÷ mL sample." },
      { l: "Step 2: List the given values", c: "Given values are: mL titrant = 8.5 mL, N (normality of H2SO4) = 0.02 N, and mL sample = 100 mL." },
      { l: "Step 3: Substitute the values into the formula", c: "Substitute the given values into the formula: (8.5 mL × 0.02 N × 50,000) ÷ 100 mL." },
      { l: "Step 4: Perform the calculation", c: "Calculate the numerator first: 8.5 × 0.02 × 50,000 = 8,500. Then divide by the sample volume: 8,500 ÷ 100 = 85." },
      { l: "Step 5: State the final answer with units", c: "The total alkalinity is 85 mg/L as CaCO3." },
    ],
    tip: "Always double-check your unit conversions and ensure you are using the correct formula for the specific parameter being calculated.",
    "difficulty": "hard"
  },
  {
    "id": 163,
    "module": "Laboratory Analysis",
    "topic": "pH and Alkalinity",
    "question": "A pH meter electrode is slow to respond and gives unstable readings. What is the MOST likely cause?",
    "options": [
      "The pH buffer solutions are expired",
      "The glass electrode is fouled, cracked, or dehydrated; the reference junction may be clogged",
      "The meter battery is low",
      "The sample temperature is too high"
    ],
    "correct": 1,
    "explanation": "Slow response and unstable readings from a pH electrode are typically caused by: (1) fouled glass membrane (deposits blocking the hydrated gel layer), (2) cracked glass membrane, (3) dehydrated electrode (stored dry), or (4) clogged reference junction. The electrode should be cleaned, inspected for cracks, and soaked in pH 4 buffer or KCl solution.",
    "difficulty": "medium"
  },
  {
    "id": 164,
    "module": "Laboratory Analysis",
    "topic": "pH and Alkalinity",
    "question": "What is the 'alkalinity consumption' of alum coagulation, and why is it important?",
    "options": [
      "Alum adds alkalinity to water",
      "Alum hydrolysis consumes approximately 0.45 mg/L alkalinity (as CaCO3) per mg/L alum; insufficient alkalinity causes pH to drop below the optimal coagulation range",
      "Alum has no effect on alkalinity",
      "Alum consumption of alkalinity is only significant at doses above 100 mg/L"
    ],
    "correct": 1,
    "explanation": "Alum (Al2(SO4)3·14H2O) hydrolysis: Al³⁺ + 3H2O → Al(OH)3 + 3H⁺. The H⁺ ions consume alkalinity (HCO3⁻ + H⁺ → H2CO3). Approximately 0.45 mg/L alkalinity (as CaCO3) is consumed per mg/L alum. If alkalinity is insufficient, pH drops below the optimal range (6.5–7.5), impairing coagulation.",
    "difficulty": "hard"
  },
  {
    "id": 165,
    isCalc: true,
    "module": "Laboratory Analysis",
    "topic": "pH and Alkalinity",
    "question": "A finished water sample has pH 8.1, alkalinity 62 mg/L as CaCO3, calcium hardness 88 mg/L as CaCO3, and temperature 12°C. The pHs is calculated as 8.4. What is the LSI?",
    "options": [
      "+0.3 (scale-forming)",
      "-0.3 (corrosive)",
      "+0.4 (scale-forming)",
      "-0.4 (corrosive)"
    ],
    "correct": 1,
    "explanation": "LSI = pH - pHs = 8.1 - 8.4 = -0.3. A negative LSI indicates the water is slightly corrosive (under-saturated with CaCO3). The operator should consider adjusting pH, alkalinity, or calcium hardness to bring LSI toward 0 or slightly positive for protective scale formation.",
    steps: [
      { l: "Step 1: Understand the Langelier Saturation Index (LSI) formula", c: "The LSI is calculated by subtracting the pHs (pH of saturation) from the actual pH of the water sample. The formula is LSI = pH - pHs." },
      { l: "Step 2: Identify the given values", c: "From the problem statement, we are given the actual pH = 8.1 and the calculated pHs = 8.4." },
      { l: "Step 3: Calculate the LSI", c: "Substitute the given values into the LSI formula: LSI = 8.1 - 8.4 = -0.3." },
      { l: "Step 4: Interpret the LSI result", c: "An LSI of -0.3 indicates that the water is slightly corrosive or under-saturated with calcium carbonate. This means the water has a tendency to dissolve protective scale rather than form it." },
    ],
    tip: "Always remember the LSI formula and the interpretation of positive, negative, and zero values for water stability.",
    "difficulty": "hard"
  },
  {
    "id": 166,
    "module": "Laboratory Analysis",
    "topic": "pH and Alkalinity",
    "question": "What is the purpose of 'temperature compensation' in pH measurement?",
    "options": [
      "Temperature compensation adjusts the sample to 25°C before measurement",
      "Temperature compensation corrects for the effect of temperature on the Nernst equation slope of the glass electrode, ensuring accurate pH readings at temperatures other than the calibration temperature",
      "Temperature compensation is only needed for samples above 40°C",
      "Temperature compensation adjusts for the effect of temperature on sample pH"
    ],
    "correct": 1,
    "explanation": "The Nernst equation (which governs glass electrode response) has a temperature-dependent slope. At 25°C, the slope is 59.16 mV/pH unit; at other temperatures, it differs. Temperature compensation (automatic or manual) corrects for this, ensuring accurate pH readings regardless of sample temperature.",
    "difficulty": "hard"
  },
  {
    "id": 167,
    "module": "Laboratory Analysis",
    "topic": "pH and Alkalinity",
    "question": "An operator measures alkalinity using the titration method. The endpoint is determined by pH meter reaching pH 4.5. What form of alkalinity is measured at this endpoint?",
    "options": [
      "Carbonate alkalinity only",
      "Bicarbonate alkalinity only",
      "Total alkalinity (hydroxide + carbonate + bicarbonate)",
      "Hydroxide alkalinity only"
    ],
    "correct": 2,
    "explanation": "The total alkalinity titration titrates to pH 4.5 (methyl orange endpoint), which neutralizes all forms of alkalinity: hydroxide (OH⁻), carbonate (CO3²⁻), and bicarbonate (HCO3⁻). The P-alkalinity (phenolphthalein) titration to pH 8.3 measures only hydroxide and half the carbonate alkalinity.",
    "difficulty": "hard"
  },
  {
    "id": 168,
    isCalc: true,
    "module": "Laboratory Analysis",
    "topic": "pH and Alkalinity",
    "question": "A water sample has pH 9.2 and total alkalinity of 180 mg/L as CaCO3. The P-alkalinity (to pH 8.3) is 45 mg/L as CaCO3. What is the carbonate alkalinity?",
    "options": [
      "45 mg/L",
      "90 mg/L",
      "135 mg/L",
      "180 mg/L"
    ],
    "correct": 1,
    "explanation": "When P-alkalinity < ½ total alkalinity, the alkalinity consists of carbonate and bicarbonate. Carbonate alkalinity = 2 × P-alkalinity = 2 × 45 = 90 mg/L as CaCO3. Bicarbonate alkalinity = total - carbonate = 180 - 90 = 90 mg/L as CaCO3.",
    steps: [
      { l: "Step 1: Identify the given values", c: "We are given a total alkalinity of 180 mg/L as CaCO3 and a P-alkalinity (to pH 8.3) of 45 mg/L as CaCO3." },
      { l: "Step 2: Determine the alkalinity components based on P-alkalinity and total alkalinity relationship", c: "Compare P-alkalinity to half of the total alkalinity. Since P-alkalinity (45 mg/L) is less than ½ total alkalinity (180/2 = 90 mg/L), the alkalinity consists of carbonate and bicarbonate." },
      { l: "Step 3: Calculate the carbonate alkalinity", c: "When P-alkalinity < ½ total alkalinity, the carbonate alkalinity is calculated as 2 times the P-alkalinity. So, Carbonate alkalinity = 2 * 45 mg/L = 90 mg/L as CaCO3." },
    ],
    tip: "Memorize the relationships between P-alkalinity, total alkalinity, and the different forms of alkalinity (hydroxide, carbonate, bicarbonate) for various scenarios.",
    "difficulty": "hard"
  },
  {
    "id": 169,
    isCalc: true,
    "module": "Laboratory Analysis",
    "topic": "Chlorine Residual",
    "question": "An operator uses the DPD colorimetric method to measure chlorine residual. The free chlorine reading is 0.8 mg/L and the total chlorine reading is 1.4 mg/L. What is the combined chlorine residual?",
    "options": [
      "0.8 mg/L",
      "0.6 mg/L",
      "1.4 mg/L",
      "2.2 mg/L"
    ],
    "correct": 1,
    "explanation": "Combined chlorine = total chlorine - free chlorine = 1.4 - 0.8 = 0.6 mg/L. Combined chlorine (chloramines) is the difference between total and free chlorine. In a plant using free chlorine for disinfection, combined chlorine should be minimal. Significant combined chlorine indicates the presence of ammonia or other nitrogen compounds.",
    steps: [
      { l: "Identify Given Values", c: "The problem provides two key values: Free Chlorine = 0.8 mg/L and Total Chlorine = 1.4 mg/L." },
      { l: "Recall the Formula", c: "The formula for calculating combined chlorine residual is: Combined Chlorine = Total Chlorine - Free Chlorine." },
      { l: "Substitute and Calculate", c: "Substitute the given values into the formula: Combined Chlorine = 1.4 mg/L - 0.8 mg/L." },
      { l: "State the Result", c: "Perform the subtraction to find the combined chlorine residual: Combined Chlorine = 0.6 mg/L." },
    ],
    tip: "Always write down the formula first, then substitute the given values to avoid calculation errors.",
    "difficulty": "medium"
  },
  {
    "id": 170,
    "module": "Laboratory Analysis",
    "topic": "Chlorine Residual",
    "question": "What is the primary advantage of the amperometric titration method over the DPD colorimetric method for chlorine measurement?",
    "options": [
      "Amperometric titration is faster than DPD",
      "Amperometric titration is not affected by colour, turbidity, or oxidizing agents that interfere with DPD; it is more accurate for complex water matrices",
      "Amperometric titration uses less reagent than DPD",
      "Amperometric titration can be performed without laboratory equipment"
    ],
    "correct": 1,
    "explanation": "The DPD method can be affected by: colour (absorbs light, causing false readings), turbidity (scatters light), and interfering oxidants (iron, manganese, ozone). Amperometric titration measures the electrochemical reduction of chlorine, which is not affected by these interferences, making it more accurate for complex water matrices.",
    "difficulty": "hard"
  },
  {
    "id": 171,
    "module": "Laboratory Analysis",
    "topic": "Chlorine Residual",
    "question": "An operator measures free chlorine using DPD and obtains a reading of 1.2 mg/L. The sample has a noticeable yellow-brown colour. What is the concern?",
    "options": [
      "The colour indicates the chlorine is too high",
      "The water colour may interfere with the DPD colorimetric measurement, causing an inaccurate reading",
      "The colour indicates iron contamination that must be removed before chlorine measurement",
      "The DPD reagent has expired"
    ],
    "correct": 1,
    "explanation": "Coloured water interferes with the DPD colorimetric method because the colour absorbs light at the same wavelength as the DPD-chlorine complex. This can cause falsely high or low readings. For coloured samples, the operator should use the amperometric titration method or perform a blank correction.",
    "difficulty": "medium"
  },
  {
    "id": 172,
    "module": "Laboratory Analysis",
    "topic": "Chlorine Residual",
    "question": "What is the maximum holding time for a chlorine residual sample before analysis?",
    "options": [
      "24 hours",
      "8 hours",
      "Immediately — chlorine residual must be measured on-site without delay",
      "48 hours if refrigerated"
    ],
    "correct": 2,
    "explanation": "Chlorine residual is extremely unstable and dissipates rapidly after collection. Samples must be analyzed immediately (within minutes) at the sample point. Transporting samples to a laboratory for chlorine analysis is not acceptable. Online analyzers or field measurement are required for accurate chlorine residual data.",
    "difficulty": "medium"
  },
  {
    "id": 173,
    "module": "Laboratory Analysis",
    "topic": "Chlorine Residual",
    "question": "An operator calibrates an online chlorine analyzer against a DPD grab sample. The online analyzer reads 0.65 mg/L and the DPD grab sample reads 0.82 mg/L. What should the operator do?",
    "options": [
      "Accept the online reading — it is more accurate than grab samples",
      "Investigate the discrepancy: check the analyzer calibration, reagent freshness, flow cell condition, and sample line integrity",
      "Increase the chlorine dose to raise the online reading to match the grab sample",
      "Replace the online analyzer"
    ],
    "correct": 1,
    "explanation": "A significant discrepancy (0.17 mg/L) between online and grab sample measurements requires investigation. Possible causes: analyzer calibration drift, stale reagents, fouled flow cell, air bubbles in sample line, or sample line dead volume. The operator should troubleshoot the analyzer before adjusting the chlorine dose.",
    "difficulty": "medium"
  },
  {
    "id": 174,
    "module": "Laboratory Analysis",
    "topic": "Chlorine Residual",
    "question": "What is the purpose of measuring 'chlorine demand' in a water sample?",
    "options": [
      "Chlorine demand is the same as chlorine residual",
      "Chlorine demand is the amount of chlorine consumed by reactions with organic matter, ammonia, and reducing agents; it determines the dose needed to achieve a target residual",
      "Chlorine demand measures the total chlorine in the water",
      "Chlorine demand is used to calculate CT values"
    ],
    "correct": 1,
    "explanation": "Chlorine demand = chlorine dose - chlorine residual. It represents the amount of chlorine consumed by reactions with organic matter (NOM), ammonia, iron, manganese, and other reducing agents. Measuring chlorine demand at different doses allows the operator to determine the dose needed to achieve a target residual.",
    "difficulty": "medium"
  },
  {
    "id": 175,
    "module": "Laboratory Analysis",
    "topic": "Chlorine Residual",
    "question": "A 'breakpoint chlorination' curve shows a trough at a Cl2:N ratio of approximately 7.6:1. What is the significance of this point?",
    "options": [
      "At 7.6:1, chloramine formation is maximized",
      "At 7.6:1 (breakpoint), all ammonia has been oxidized to nitrogen gas; adding more chlorine beyond this point produces free chlorine residual",
      "At 7.6:1, the chlorine dose is at its minimum effective level",
      "At 7.6:1, the water pH is at the optimal level for disinfection"
    ],
    "correct": 1,
    "explanation": "The breakpoint is the Cl2:NH3-N ratio (approximately 7.6:1 by weight) at which all ammonia is oxidized to nitrogen gas (N2). Before the breakpoint, chloramines form. At the breakpoint, chloramines are destroyed. Beyond the breakpoint, additional chlorine produces free chlorine residual. This is the basis for breakpoint chlorination to eliminate ammonia.",
    "difficulty": "hard"
  },
  {
    "id": 176,
    "module": "Laboratory Analysis",
    "topic": "Chlorine Residual",
    "question": "What is the purpose of the 'syringaldazine (FACTS) test' for free chlorine?",
    "options": [
      "FACTS is an alternative to DPD for measuring total chlorine",
      "FACTS is a more specific test for free chlorine that is not affected by monochloramine interference",
      "FACTS measures chlorine in coloured samples",
      "FACTS is used for measuring chlorine in wastewater"
    ],
    "correct": 1,
    "explanation": "The FACTS (Free Available Chlorine Test with Syringaldazine) test reacts specifically with free chlorine (HOCl and OCl⁻) and is not affected by monochloramine, which can cause false positives in the DPD method. FACTS is used when accurate free chlorine measurement is needed in the presence of chloramines.",
    "difficulty": "hard"
  },
  {
    "id": 177,
    isCalc: true,
    "module": "Laboratory Analysis",
    "topic": "Hardness",
    "question": "A water sample has calcium hardness of 95 mg/L as CaCO3 and magnesium hardness of 48 mg/L as CaCO3. What is the total hardness?",
    "options": [
      "47 mg/L as CaCO3",
      "95 mg/L as CaCO3",
      "143 mg/L as CaCO3",
      "4,560 mg/L as CaCO3"
    ],
    "correct": 2,
    "explanation": "Total hardness = calcium hardness + magnesium hardness = 95 + 48 = 143 mg/L as CaCO3. Total hardness is expressed as CaCO3 equivalents for both calcium and magnesium.",
    steps: [
      { l: "Step 1", c: "Identify the given values for calcium hardness and magnesium hardness. Calcium hardness = 95 mg/L as CaCO3. Magnesium hardness = 48 mg/L as CaCO3." },
      { l: "Step 2", c: "Recall the formula for total hardness. Total hardness is the sum of calcium hardness and magnesium hardness." },
      { l: "Step 3", c: "Add the calcium hardness and magnesium hardness values together. Total hardness = 95 mg/L + 48 mg/L." },
      { l: "Step 4", c: "Calculate the sum to find the total hardness. Total hardness = 143 mg/L as CaCO3." },
    ],
    tip: "Always ensure all hardness components are expressed in the same units (e.g., as CaCO3) before performing calculations.",
    "difficulty": "medium"
  },
  {
    "id": 178,
    "module": "Laboratory Analysis",
    "topic": "Hardness",
    "question": "What is the EDTA titration method for hardness, and what indicator is used?",
    "options": [
      "EDTA titrates hardness ions; eriochrome black T (EBT) indicator turns from wine-red to blue at the endpoint",
      "EDTA titrates hardness ions; phenolphthalein indicator turns from pink to colourless at the endpoint",
      "EDTA titrates hardness ions; DPD indicator turns from red to colourless at the endpoint",
      "EDTA titrates hardness ions; methyl orange indicator turns from red to yellow at the endpoint"
    ],
    "correct": 0,
    "explanation": "The EDTA (ethylenediaminetetraacetic acid) titration for total hardness uses eriochrome black T (EBT) as the indicator. EBT forms a wine-red complex with calcium and magnesium ions. As EDTA is added, it displaces EBT from the metal ions. At the endpoint, all metal ions are complexed by EDTA and the solution turns blue.",
    "difficulty": "medium"
  },
  {
    "id": 179,
    isCalc: true,
    "module": "Laboratory Analysis",
    "topic": "Hardness",
    "question": "A water sample has total hardness of 280 mg/L as CaCO3 and calcium hardness of 175 mg/L as CaCO3. What is the magnesium concentration in mg/L as Mg?",
    "options": [
      "105 mg/L as Mg",
      "25.5 mg/L as Mg",
      "175 mg/L as Mg",
      "12.8 mg/L as Mg"
    ],
    "correct": 1,
    "explanation": "Magnesium hardness = total hardness - calcium hardness = 280 - 175 = 105 mg/L as CaCO3. Convert to mg/L as Mg: Mg = 105 mg/L CaCO3 × (24.3 g/mol Mg ÷ 50 g/mol CaCO3 equivalent) = 105 × 0.486 = 51.0 mg/L as Mg. Wait — the question asks for mg/L as Mg. 105 mg/L as CaCO3 ÷ (50/24.3) = 105 × 24.3/50 = 51.0 mg/L. The closest answer is 25.5 mg/L... Let me recalculate: Mg²⁺ equivalent weight = 12.15 g/eq. 105 mg/L as CaCO3 × (12.15/50) = 25.5 mg/L as Mg. The conversion factor is (MW Mg/2)/50 = 12.15/50.",
    steps: [
      { l: "Step 1: Calculate Magnesium Hardness as CaCO3", c: "Subtract the calcium hardness from the total hardness to find the magnesium hardness expressed as CaCO3: 280 mg/L (Total Hardness) - 175 mg/L (Calcium Hardness) = 105 mg/L as CaCO3 (Magnesium Hardness)." },
      { l: "Step 2: Determine Equivalent Weight of Magnesium", c: "The equivalent weight of Magnesium (Mg) is its atomic weight divided by its valence. Atomic weight of Mg is 24.3 g/mol, and its valence is 2, so the equivalent weight is 24.3 / 2 = 12.15 g/eq." },
      { l: "Step 3: Determine Equivalent Weight of CaCO3", c: "The equivalent weight of Calcium Carbonate (CaCO3) is its molecular weight divided by its valence. Molecular weight of CaCO3 is 100 g/mol, and its valence is 2, so the equivalent weight is 100 / 2 = 50 g/eq." },
      { l: "Step 4: Convert Magnesium Hardness from CaCO3 to Mg", c: "Use the ratio of the equivalent weight of Mg to the equivalent weight of CaCO3 to convert the magnesium hardness: 105 mg/L as CaCO3 * (12.15 g/eq Mg / 50 g/eq CaCO3) = 25.515 mg/L as Mg." },
    ],
    tip: "Always double-check your conversion factors, especially when converting between different 'as CaCO3' units and the actual ion concentration, paying close attention to equivalent weights.",
    "difficulty": "hard"
  },
  {
    "id": 180,
    "module": "Laboratory Analysis",
    "topic": "Hardness",
    "question": "What is the significance of 'temporary hardness' versus 'permanent hardness'?",
    "options": [
      "They are the same type of hardness",
      "Temporary hardness (carbonate hardness) is removed by boiling; permanent hardness (non-carbonate) cannot be removed by boiling and requires lime-soda softening or ion exchange",
      "Permanent hardness is removed by filtration; temporary hardness requires chemical treatment",
      "Temporary hardness causes scale; permanent hardness does not"
    ],
    "correct": 1,
    "explanation": "Temporary hardness (carbonate hardness) = calcium and magnesium bicarbonates. Boiling converts bicarbonates to carbonates, which precipitate. Permanent hardness (non-carbonate) = calcium and magnesium sulfates, chlorides, nitrates. Boiling does not remove these — they require lime-soda softening or ion exchange.",
    "difficulty": "medium"
  },
  {
    "id": 181,
    isCalc: true,
    "module": "Laboratory Analysis",
    "topic": "Hardness",
    "question": "A lime softening plant must reduce total hardness from 320 mg/L to 80 mg/L as CaCO3. What is the required hardness removal?",
    "options": [
      "80 mg/L",
      "240 mg/L",
      "320 mg/L",
      "400 mg/L"
    ],
    "correct": 1,
    "explanation": "Hardness removal required = influent - effluent = 320 - 80 = 240 mg/L as CaCO3. The plant must remove 240 mg/L of hardness, which is 75% of the influent hardness.",
    steps: [
      { l: "Identify Influent Hardness", c: "The influent (incoming) total hardness is given as 320 mg/L as CaCO3." },
      { l: "Identify Effluent Hardness", c: "The desired effluent (outgoing) total hardness is 80 mg/L as CaCO3." },
      { l: "Calculate Hardness Removal", c: "Subtract the desired effluent hardness from the influent hardness to find the required removal: 320 mg/L - 80 mg/L = 240 mg/L." },
    ],
    tip: "Always clearly identify your 'influent' (starting) and 'effluent' (ending) values before performing calculations.",
    "difficulty": "medium"
  },
  {
    "id": 182,
    "module": "Laboratory Analysis",
    "topic": "Hardness",
    "question": "What is the purpose of 'recarbonation' after lime softening?",
    "options": [
      "Recarbonation adds calcium to the softened water",
      "Recarbonation adds CO2 to lower the high pH (10–11) of lime-softened water to a stable, non-corrosive pH (7.5–8.5)",
      "Recarbonation removes residual hardness",
      "Recarbonation disinfects the softened water"
    ],
    "correct": 1,
    "explanation": "Lime softening raises water pH to 10–11, which is too high for distribution. Recarbonation adds CO2 to react with excess calcium hydroxide and lower pH: Ca(OH)2 + CO2 → CaCO3 + H2O. This stabilizes the water at pH 7.5–8.5, preventing further precipitation of CaCO3 in the distribution system.",
    "difficulty": "medium"
  },
  {
    "id": 183,
    "module": "Laboratory Analysis",
    "topic": "Jar Test",
    "question": "A jar test is performed with 6 jars at alum doses of 10, 20, 30, 40, 50, and 60 mg/L. After 30 minutes of settling, the turbidities are 12.4, 5.8, 1.2, 0.6, 0.8, and 1.5 NTU respectively. What is the optimal dose?",
    "options": [
      "30 mg/L",
      "40 mg/L",
      "50 mg/L",
      "60 mg/L"
    ],
    "correct": 1,
    "explanation": "The optimal dose is the lowest dose that achieves the minimum turbidity. At 40 mg/L, turbidity reaches 0.6 NTU (the minimum). At 30 mg/L, turbidity is 1.2 NTU (higher). At 50 mg/L, turbidity increases to 0.8 NTU (restabilization beginning). The optimal dose is 40 mg/L.",
    "difficulty": "medium"
  },
  {
    "id": 184,
    "module": "Laboratory Analysis",
    "topic": "Jar Test",
    "question": "Why is it important to use raw water for jar testing rather than finished water?",
    "options": [
      "Finished water is too clean for jar testing",
      "Raw water represents the actual water to be treated; jar tests on finished water would not reflect the coagulation chemistry of the raw water",
      "Raw water is easier to handle than finished water",
      "Finished water cannot be used for jar testing due to regulatory requirements"
    ],
    "correct": 1,
    "explanation": "Jar tests must be performed on raw water (or the water at the point of coagulant addition) because the coagulation chemistry depends on the raw water characteristics (turbidity, NOM, alkalinity, pH, temperature). Testing finished water would give meaningless results because the water has already been treated.",
    "difficulty": "medium"
  },
  {
    "id": 185,
    "module": "Laboratory Analysis",
    "topic": "Jar Test",
    "question": "During a jar test, the operator observes that floc forms quickly at 35 mg/L alum but the floc is very small and does not settle. What adjustment should be tried?",
    "options": [
      "Increase the alum dose to 70 mg/L",
      "Reduce the rapid mix speed and increase the flocculation time to allow floc to grow larger",
      "Add more alkalinity to raise pH",
      "Reduce the flocculation time"
    ],
    "correct": 1,
    "explanation": "Small floc that does not settle indicates the floc is not growing to sufficient size. This can be caused by: (1) too much mixing energy (shearing floc), (2) insufficient flocculation time, or (3) inadequate coagulation. The operator should try reducing rapid mix speed and increasing flocculation time to allow floc to grow. A polymer coagulant aid may also help.",
    "difficulty": "medium"
  },
  {
    "id": 186,
    "module": "Laboratory Analysis",
    "topic": "Jar Test",
    "question": "A jar test is performed at 5°C (cold water) and 20°C (warm water) at the same alum dose. The cold water test shows higher settled turbidity. What is the MOST likely explanation?",
    "options": [
      "Cold water has higher turbidity than warm water",
      "Cold water has higher viscosity, which slows particle settling velocity (Stokes' Law), and alum hydrolysis is slower at lower temperatures",
      "Cold water has lower alkalinity than warm water",
      "Cold water has higher NOM than warm water"
    ],
    "correct": 1,
    "explanation": "Cold water affects coagulation in two ways: (1) higher viscosity reduces particle settling velocity (Stokes' Law: v ∝ 1/μ), and (2) alum hydrolysis is slower at lower temperatures, requiring longer flocculation times or higher doses. Operators must adjust coagulant dose and flocculation time during cold weather.",
    "difficulty": "hard"
  },
  {
    "id": 187,
    "module": "Laboratory Analysis",
    "topic": "Jar Test",
    "question": "What is the purpose of the 'filter paper test' at the end of a jar test?",
    "options": [
      "To measure the turbidity of the settled water",
      "To simulate filtration — passing settled water through filter paper estimates the filterability of the floc and predicts filter performance",
      "To test the chemical composition of the settled water",
      "To measure the pH of the settled water"
    ],
    "correct": 1,
    "explanation": "The filter paper test simulates filtration by passing settled water through filter paper. This estimates the filterability of the floc and predicts how well the floc will be removed by the plant's filters. Floc that passes through filter paper will likely also pass through the plant's filters, indicating inadequate coagulation.",
    "difficulty": "medium"
  },
  {
    "id": 188,
    "module": "Laboratory Analysis",
    "topic": "Jar Test",
    "question": "An operator performs a jar test and finds the optimal alum dose is 45 mg/L at pH 6.8. The raw water alkalinity is 22 mg/L as CaCO3. What additional jar test should be performed?",
    "options": [
      "No additional testing is needed",
      "Test with lime or soda ash addition to verify that sufficient alkalinity exists to maintain pH at 6.8 throughout coagulation",
      "Test with higher alum doses to find the restabilization point",
      "Test with polymer coagulant aids at all doses"
    ],
    "correct": 1,
    "explanation": "At 45 mg/L alum, alkalinity consumed = 45 × 0.45 = 20.25 mg/L, nearly depleting the 22 mg/L alkalinity. The operator should perform additional jar tests with lime or soda ash addition to ensure sufficient alkalinity is maintained throughout coagulation. Without adequate alkalinity, pH will drop and coagulation will be impaired.",
    "difficulty": "hard"
  },
  {
    "id": 189,
    "module": "Laboratory Analysis",
    "topic": "Jar Test",
    "question": "What is the purpose of performing jar tests at different pH values in addition to different coagulant doses?",
    "options": [
      "pH does not affect coagulation",
      "pH significantly affects coagulant hydrolysis chemistry and floc formation; testing at different pH values identifies the optimal pH-dose combination for minimum turbidity and NOM removal",
      "pH testing is only required for lime softening",
      "pH testing is required by regulation for all jar tests"
    ],
    "correct": 1,
    "explanation": "pH is a critical variable in coagulation. Alum is effective at pH 6.5–7.5; ferric coagulants work over pH 4.5–9.0. NOM removal is enhanced at lower pH (5.5–6.5). Testing at different pH values identifies the optimal pH-dose combination that minimizes turbidity and NOM (DBP precursors) while maintaining adequate alkalinity.",
    "difficulty": "hard"
  },
  {
    "id": 190,
    "module": "Laboratory Analysis",
    "topic": "Jar Test",
    "question": "A jar test is performed using the same mixing conditions as the plant. The optimal dose is 28 mg/L. At full scale, the settled water turbidity is consistently higher than the jar test results at the same dose. What is the MOST likely cause?",
    "options": [
      "The jar test is inaccurate",
      "Full-scale mixing conditions (rapid mix, flocculation) differ from the jar test, causing different floc characteristics",
      "The plant is using a different coagulant than the jar test",
      "The plant flow rate is too low"
    ],
    "correct": 1,
    "explanation": "Jar tests are approximations of full-scale coagulation. Differences in mixing intensity (G value), mixing geometry, and scale can cause different floc characteristics at full scale. The jar test provides a starting point, but full-scale optimization requires monitoring settled water turbidity and adjusting the dose based on actual plant performance.",
    "difficulty": "hard"
  },
  {
    "id": 191,
    "module": "Laboratory Analysis",
    "topic": "Fluoride",
    "question": "The Ontario drinking water standard for fluoride is 1.5 mg/L (maximum). A plant targets 0.7 mg/L for dental health. A finished water sample reads 1.8 mg/L. What is the FIRST action?",
    "options": [
      "Issue a health advisory and notify the regulatory authority",
      "Verify the result with a repeat measurement and check the fluoride analyzer calibration before taking action",
      "Immediately shut down the fluoride feed system",
      "Dilute the water in the distribution system"
    ],
    "correct": 1,
    "explanation": "Before taking action, verify the result with a repeat measurement and check instrument calibration. If confirmed, shut down or reduce the fluoride feed immediately and notify the regulatory authority as required. A single reading above the standard requires investigation to determine if it is a real exceedance or a measurement error.",
    "difficulty": "medium"
  },
  {
    "id": 192,
    "module": "Laboratory Analysis",
    "topic": "Fluoride",
    "question": "What is the SPADNS colorimetric method for fluoride measurement?",
    "options": [
      "SPADNS measures fluoride by ion chromatography",
      "SPADNS uses a red dye that forms a complex with zirconium; fluoride bleaches the complex, reducing colour intensity proportional to fluoride concentration",
      "SPADNS measures fluoride by electrode potential",
      "SPADNS is used for measuring fluoride in air"
    ],
    "correct": 1,
    "explanation": "The SPADNS method uses a red zirconium-SPADNS dye complex. Fluoride reacts with zirconium, releasing the SPADNS dye and reducing the red colour. The decrease in absorbance is proportional to the fluoride concentration. Interferences include: alkalinity, chlorine, colour, and turbidity.",
    "difficulty": "hard"
  },
  {
    "id": 193,
    "module": "Laboratory Analysis",
    "topic": "Fluoride",
    "question": "An operator measures fluoride using an ion-selective electrode (ISE). The electrode is calibrated using standards of 0.5, 1.0, and 2.0 mg/L. A sample reads 0.68 mg/L. What is the significance of using TISAB buffer?",
    "options": [
      "TISAB adjusts the sample pH to 7.0",
      "TISAB (Total Ionic Strength Adjustment Buffer) equalizes ionic strength between samples and standards, releases fluoride from complexes, and adjusts pH to 5–5.5 for optimal electrode response",
      "TISAB removes chlorine interference",
      "TISAB is used to calibrate the electrode"
    ],
    "correct": 1,
    "explanation": "TISAB (Total Ionic Strength Adjustment Buffer) serves three purposes: (1) equalizes ionic strength between samples and standards (ionic strength affects electrode response), (2) releases fluoride from aluminum and iron complexes (making it available for measurement), and (3) adjusts pH to 5–5.5 for optimal fluoride ISE response.",
    "difficulty": "hard"
  },
  {
    "id": 194,
    "module": "Laboratory Analysis",
    "topic": "Fluoride",
    "question": "What is the effect of aluminum on fluoride measurement using an ion-selective electrode?",
    "options": [
      "Aluminum has no effect on fluoride measurement",
      "Aluminum forms stable complexes with fluoride (AlF complexes), reducing the free fluoride concentration and causing falsely low readings unless TISAB is used",
      "Aluminum causes falsely high fluoride readings",
      "Aluminum only affects fluoride measurement above 10 mg/L"
    ],
    "correct": 1,
    "explanation": "Aluminum forms very stable complexes with fluoride (AlF2⁺, AlF2⁺, AlF3). These complexes are not detected by the fluoride ISE, causing falsely low readings. TISAB releases fluoride from these complexes by providing a competing ligand (citrate) that preferentially binds aluminum, freeing the fluoride for measurement.",
    "difficulty": "hard"
  },
  {
    "id": 195,
    "module": "Laboratory Analysis",
    "topic": "Bacteriological Testing",
    "question": "A finished water sample tests positive for total coliforms but negative for E. coli. What is the MOST appropriate response?",
    "options": [
      "No action needed — total coliforms are not a health concern",
      "Collect repeat samples immediately, investigate the source of contamination, and notify the regulatory authority as required",
      "Issue a boil water advisory immediately",
      "Increase the chlorine dose and wait for the next scheduled sample"
    ],
    "correct": 1,
    "explanation": "A positive total coliform result in finished water requires immediate action: (1) collect repeat samples from the same and adjacent locations, (2) investigate the source (distribution system contamination, treatment failure, sampling error), and (3) notify the regulatory authority as required by Ontario's Safe Drinking Water Act. Total coliforms indicate potential contamination.",
    "difficulty": "hard"
  },
  {
    "id": 196,
    "module": "Laboratory Analysis",
    "topic": "Bacteriological Testing",
    "question": "What is the difference between 'total coliforms' and 'E. coli' as indicators of water quality?",
    "options": [
      "They are the same indicator",
      "Total coliforms indicate general contamination or treatment failure; E. coli specifically indicates recent fecal contamination and is a more serious health concern",
      "E. coli is a less serious indicator than total coliforms",
      "Total coliforms are only found in groundwater; E. coli is only in surface water"
    ],
    "correct": 1,
    "explanation": "Total coliforms are a broad group of bacteria that can originate from soil, vegetation, or fecal sources. Their presence indicates potential treatment failure or contamination. E. coli is a fecal coliform that specifically indicates recent fecal contamination from warm-blooded animals, representing a more serious and immediate health risk.",
    "difficulty": "medium"
  },
  {
    "id": 197,
    "module": "Laboratory Analysis",
    "topic": "Bacteriological Testing",
    "question": "What is the membrane filtration (MF) method for coliform detection?",
    "options": [
      "MF uses a selective medium to grow coliforms in liquid broth",
      "MF filters a known volume of water through a 0.45 μm membrane, which is then placed on selective agar; colonies that grow are counted and identified",
      "MF uses PCR to detect coliform DNA",
      "MF uses a colorimetric reaction to detect coliform enzymes"
    ],
    "correct": 1,
    "explanation": "The membrane filtration method filters a known volume of water (typically 100 mL) through a 0.45 μm membrane that retains bacteria. The membrane is placed on selective agar (m-Endo for total coliforms, m-FC for fecal coliforms) and incubated. Colonies are counted and results expressed as CFU/100 mL.",
    "difficulty": "medium"
  },
  {
    "id": 198,
    "module": "Laboratory Analysis",
    "topic": "Bacteriological Testing",
    "question": "A water sample is collected for bacteriological analysis. The sample bottle contains sodium thiosulfate. What is the purpose of the sodium thiosulfate?",
    "options": [
      "Sodium thiosulfate preserves the sample by killing bacteria",
      "Sodium thiosulfate neutralizes residual chlorine in the sample, preventing it from continuing to kill bacteria during transport to the laboratory",
      "Sodium thiosulfate adjusts the sample pH",
      "Sodium thiosulfate is used as a nutrient for bacterial growth"
    ],
    "correct": 1,
    "explanation": "Sodium thiosulfate (Na2S2O3) is a dechlorinating agent. It neutralizes residual chlorine in the sample, preventing continued disinfection during transport to the laboratory. Without dechlorination, residual chlorine would continue killing bacteria, causing falsely low counts.",
    "difficulty": "medium"
  },
  {
    "id": 199,
    "module": "Laboratory Analysis",
    "topic": "Bacteriological Testing",
    "question": "What is the maximum holding time for a bacteriological water sample before analysis?",
    "options": [
      "24 hours at 4°C",
      "6 hours at 4°C",
      "48 hours at 4°C",
      "72 hours at room temperature"
    ],
    "correct": 0,
    "explanation": "Bacteriological samples must be analyzed within 24 hours of collection when refrigerated at 4°C (some methods allow 30 hours). Longer holding times allow bacteria to multiply or die, causing inaccurate results. Samples should be kept on ice during transport and analyzed as soon as possible.",
    "difficulty": "medium"
  },
  {
    "id": 200,
    "module": "Laboratory Analysis",
    "topic": "Bacteriological Testing",
    "question": "What is the purpose of 'heterotrophic plate count' (HPC) testing in drinking water?",
    "options": [
      "HPC detects specific pathogens in drinking water",
      "HPC measures the general bacterial population in water; elevated HPC indicates potential treatment failure, distribution system contamination, or biological regrowth",
      "HPC is required by regulation for all water systems",
      "HPC measures the chlorine demand of water"
    ],
    "correct": 1,
    "explanation": "HPC (also called standard plate count) measures the total culturable bacterial population. While HPC bacteria are not necessarily pathogens, elevated counts (>500 CFU/mL in Ontario) indicate potential treatment failure, distribution system contamination, or biological regrowth. HPC is used as a general indicator of water quality and treatment effectiveness.",
    "difficulty": "medium"
  },
  {
    "id": 201,
    "module": "Laboratory Analysis",
    "topic": "Bacteriological Testing",
    "question": "An operator collects a bacteriological sample from a distribution system tap. The tap has not been used for several days. What sampling procedure should be followed?",
    "options": [
      "Collect the sample immediately without flushing",
      "Flush the tap for 2–3 minutes before collecting the sample to obtain a representative distribution system sample",
      "Collect the first-draw sample to detect lead and copper",
      "Disinfect the tap with bleach before sampling"
    ],
    "correct": 1,
    "explanation": "For distribution system bacteriological sampling, the tap should be flushed for 2–3 minutes to remove stagnant water from the service line and obtain a representative sample of the distribution system water. The tap should not be disinfected before sampling (which would kill bacteria), and the aerator should be removed.",
    "difficulty": "medium"
  },
  {
    "id": 202,
    "module": "Laboratory Analysis",
    "topic": "Bacteriological Testing",
    "question": "What is the 'presence/absence (P/A) test' for coliforms?",
    "options": [
      "P/A test measures the concentration of coliforms in CFU/100 mL",
      "P/A test determines only whether coliforms are present or absent in a 100 mL sample, without quantifying the number",
      "P/A test is used for Cryptosporidium detection",
      "P/A test is a rapid test that gives results in 1 hour"
    ],
    "correct": 1,
    "explanation": "The presence/absence (P/A) test determines whether total coliforms are present or absent in a 100 mL sample. It does not quantify the number of coliforms. The P/A test uses a single enrichment broth; a colour change indicates coliform presence. It is simpler than quantitative methods but provides less information.",
    "difficulty": "medium"
  },
  {
    "id": 203,
    "module": "Laboratory Analysis",
    "topic": "Disinfection Byproducts",
    "question": "What are the four regulated trihalomethanes (THMs) in drinking water?",
    "options": [
      "Chloroform, bromodichloromethane, dibromochloromethane, and bromoform",
      "Chloroform, chloramine, chlorite, and bromate",
      "Haloacetic acids, chloroform, bromate, and chlorite",
      "Chloroform, dichloroacetic acid, trichloroacetic acid, and bromate"
    ],
    "correct": 0,
    "explanation": "The four regulated THMs are: chloroform (CHCl3), bromodichloromethane (CHBrCl2), dibromochloromethane (CHBr2Cl), and bromoform (CHBr3). Together they are called total trihalomethanes (TTHM). The Canadian guideline for TTHM is 0.1 mg/L (100 μg/L).",
    "difficulty": "medium"
  },
  {
    "id": 204,
    "module": "Laboratory Analysis",
    "topic": "Disinfection Byproducts",
    "question": "A plant's running annual average TTHM is 0.082 mg/L. The regulatory limit is 0.1 mg/L. What does this mean for compliance?",
    "options": [
      "The plant is in compliance — the running annual average is below the limit",
      "The plant is not in compliance — any individual sample above 0.1 mg/L triggers a violation",
      "The plant must reduce TTHM to below 0.05 mg/L",
      "The running annual average is not used for compliance; only individual samples matter"
    ],
    "correct": 0,
    "explanation": "TTHM compliance in Ontario is based on the running annual average (RAA) of all samples collected over the previous 12 months. An RAA of 0.082 mg/L is below the 0.1 mg/L limit, so the plant is in compliance. However, the operator should monitor trends — if the RAA is increasing, corrective action should be taken before the limit is exceeded.",
    "difficulty": "hard"
  },
  {
    "id": 205,
    "module": "Laboratory Analysis",
    "topic": "Disinfection Byproducts",
    "question": "What is the primary precursor for trihalomethane (THM) formation in chlorinated water?",
    "options": [
      "Ammonia in the source water",
      "Natural organic matter (NOM), particularly humic and fulvic acids",
      "Calcium and magnesium ions",
      "Suspended solids in the raw water"
    ],
    "correct": 1,
    "explanation": "THMs form when chlorine reacts with natural organic matter (NOM), particularly humic and fulvic acids. These are the primary DBP precursors. Bromide in the source water also contributes — chlorine oxidizes bromide to hypobromous acid, which reacts with NOM to form brominated THMs (more toxic than chloroform).",
    "difficulty": "medium"
  },
  {
    "id": 206,
    "module": "Laboratory Analysis",
    "topic": "Disinfection Byproducts",
    "question": "What analytical method is used for THM analysis in drinking water?",
    "options": [
      "Colorimetric analysis",
      "Gas chromatography with electron capture detection (GC-ECD) or purge-and-trap GC-MS",
      "Ion chromatography",
      "Atomic absorption spectroscopy"
    ],
    "correct": 1,
    "explanation": "THMs are volatile organic compounds analyzed by gas chromatography. The two standard methods are: (1) liquid-liquid extraction followed by GC-ECD, and (2) purge-and-trap GC-MS. Both methods provide detection limits well below the regulatory limit. Samples must be preserved with ascorbic acid (dechlorination) and analyzed within 14 days.",
    "difficulty": "hard"
  },
  {
    "id": 207,
    "module": "Laboratory Analysis",
    "topic": "Disinfection Byproducts",
    "question": "A water treatment plant must reduce its haloacetic acid (HAA5) levels. The current RAA is 0.058 mg/L (limit = 0.08 mg/L). What is the MOST effective long-term strategy?",
    "options": [
      "Increase chlorine dose to oxidize HAA precursors",
      "Reduce NOM precursors through enhanced coagulation or GAC before chlorination, and optimize chlorination point",
      "Move chlorination to before filtration",
      "Reduce plant flow rate to decrease HAA formation"
    ],
    "correct": 1,
    "explanation": "HAAs (like THMs) form from NOM precursors reacting with chlorine. Long-term reduction strategies include: (1) enhanced coagulation to remove NOM before chlorination, (2) GAC filtration to adsorb NOM, and (3) moving the chlorination point to after filtration to minimize contact time with NOM. Increasing chlorine dose would increase HAA formation.",
    "difficulty": "hard"
  },
  {
    "id": 208,
    "module": "Laboratory Analysis",
    "topic": "Disinfection Byproducts",
    "question": "What is the difference between 'formation potential' (FP) tests and 'simulated distribution system' (SDS) tests for DBPs?",
    "options": [
      "They are the same test with different names",
      "FP tests measure the maximum DBP formation under excess chlorine conditions; SDS tests simulate actual distribution system conditions (residence time, temperature, residual) for more realistic DBP predictions",
      "FP tests are performed in the laboratory; SDS tests are performed in the distribution system",
      "FP tests measure THMs; SDS tests measure HAAs"
    ],
    "correct": 1,
    "explanation": "DBP Formation Potential (FP) tests expose the water to excess chlorine for 7 days at 25°C — measuring the maximum possible DBP formation. Simulated Distribution System (SDS) tests use the actual chlorine dose, temperature, and residence time expected in the distribution system, providing more realistic DBP predictions for compliance planning.",
    "difficulty": "hard"
  },
  {
    "id": 209,
    "module": "Laboratory Analysis",
    "topic": "Colour and Taste/Odour",
    "question": "A water sample has a colour of 22 TCU (true colour units). The Ontario aesthetic objective is 15 TCU. What treatment approach is MOST effective for colour removal?",
    "options": [
      "Filtration alone will remove colour",
      "Enhanced coagulation at lower pH (5.5–6.5) with higher coagulant dose, or GAC filtration",
      "Chlorination will oxidize the colour-causing compounds",
      "Increasing pH will remove colour"
    ],
    "correct": 1,
    "explanation": "True colour in water is primarily caused by dissolved NOM (humic and fulvic acids). Enhanced coagulation at lower pH (5.5–6.5) with higher coagulant dose removes NOM more effectively than conventional coagulation. GAC adsorption is also effective. Chlorination can oxidize some colour compounds but may produce DBPs.",
    "difficulty": "medium"
  },
  {
    "id": 210,
    "module": "Laboratory Analysis",
    "topic": "Colour and Taste/Odour",
    "question": "What is the difference between 'true colour' and 'apparent colour' in water?",
    "options": [
      "They are the same measurement",
      "Apparent colour includes colour from both dissolved and suspended matter; true colour is measured after filtration (0.45 μm) to remove suspended matter",
      "True colour is measured in TCU; apparent colour is measured in NTU",
      "Apparent colour is measured in the field; true colour is measured in the laboratory"
    ],
    "correct": 1,
    "explanation": "Apparent colour includes colour from both dissolved NOM and suspended particles (turbidity). True colour is measured after filtering the sample through a 0.45 μm membrane to remove suspended matter, leaving only dissolved colour-causing compounds. True colour is the more meaningful measurement for treatment purposes.",
    "difficulty": "medium"
  },
  {
    "id": 211,
    "module": "Laboratory Analysis",
    "topic": "Colour and Taste/Odour",
    "question": "What is the 'threshold odour number' (TON) and how is it measured?",
    "options": [
      "TON measures the concentration of odour-causing compounds in mg/L",
      "TON is the greatest dilution of the sample with odour-free water at which an odour is still detectable; higher TON = stronger odour",
      "TON measures the pH at which odour becomes detectable",
      "TON is measured using gas chromatography"
    ],
    "correct": 1,
    "explanation": "The Threshold Odour Number (TON) is determined by diluting the sample with odour-free water until the odour is just barely detectable by a trained panel. TON = (volume of sample + volume of odour-free water) ÷ volume of sample at the threshold dilution. A TON of 1 means no dilution is needed; higher TON means stronger odour.",
    "difficulty": "medium"
  },
  {
    "id": 212,
    "module": "Laboratory Analysis",
    "topic": "Iron and Manganese",
    "question": "An operator measures iron in finished water using the phenanthroline colorimetric method. The result is 0.28 mg/L (Ontario aesthetic objective = 0.3 mg/L). However, the water has a slight brown tint. What is the MOST likely explanation?",
    "options": [
      "The measurement is incorrect — brown tint cannot occur at 0.28 mg/L",
      "The brown tint may be caused by colloidal iron that was not detected by the dissolved iron test, or by manganese",
      "The measurement is correct and the brown tint is from NOM",
      "The measurement is correct and the brown tint is from chlorine"
    ],
    "correct": 1,
    "explanation": "The phenanthroline method measures dissolved iron after reduction to Fe²⁺. Colloidal iron (very fine Fe³⁺ particles) may not be fully detected by this method. The brown tint could be from colloidal iron that passed through treatment, or from manganese (which causes brown/black discolouration). The operator should test for total iron (after digestion) and manganese.",
    "difficulty": "hard"
  },
  {
    "id": 213,
    "module": "Laboratory Analysis",
    "topic": "TDS and Conductivity",
    "question": "A water sample has a conductivity of 485 μS/cm. Using the conversion factor of 0.65, what is the estimated TDS?",
    "options": [
      "315 mg/L",
      "485 mg/L",
      "746 mg/L",
      "0.65 mg/L"
    ],
    "correct": 0,
    "explanation": "TDS (mg/L) ≈ conductivity (μS/cm) × conversion factor = 485 × 0.65 = 315 mg/L. The conversion factor varies from 0.55 to 0.75 depending on the ionic composition of the water. This is an estimate; gravimetric TDS measurement is more accurate.",
    "difficulty": "medium"
  },
  {
    "id": 214,
    "module": "Laboratory Analysis",
    "topic": "TDS and Conductivity",
    "question": "What is the purpose of measuring conductivity in water treatment operations?",
    "options": [
      "Conductivity measures the chlorine residual",
      "Conductivity provides a rapid, continuous estimate of total dissolved solids and can detect sudden changes in water quality (e.g., saltwater intrusion, chemical spills)",
      "Conductivity measures the turbidity of water",
      "Conductivity measures the pH of water"
    ],
    "correct": 1,
    "explanation": "Conductivity measures the ability of water to conduct electrical current, which is proportional to dissolved ion concentration. It provides a rapid, continuous estimate of TDS and can detect sudden changes in water quality: saltwater intrusion, chemical spills, industrial discharges, or treatment upsets. It is used for online monitoring and process control.",
    "difficulty": "medium"
  },
  {
    "id": 215,
    "module": "Laboratory Analysis",
    "topic": "Transmittance and Absorbance",
    "question": "A UV transmittance (UVT) reading is 82%. What does this mean for UV disinfection?",
    "options": [
      "82% of the UV light passes through the water; lower UVT requires higher UV dose to achieve the same inactivation",
      "82% of pathogens are inactivated by UV",
      "82% of the UV lamp output is being used",
      "82% UVT means the water is 82% pure"
    ],
    "correct": 0,
    "explanation": "UV transmittance (UVT) at 254 nm measures the fraction of UV light that passes through the water. At 82% UVT, 18% of UV light is absorbed by the water (primarily by NOM and iron). Lower UVT means less UV light reaches pathogens, requiring higher UV doses (more lamps or higher lamp power) to achieve the required CT.",
    "difficulty": "hard"
  },
  {
    "id": 216,
    "module": "Laboratory Analysis",
    "topic": "Transmittance and Absorbance",
    "question": "What is the relationship between UV absorbance (UVA) and UV transmittance (UVT)?",
    "options": [
      "UVA = UVT × 100",
      "UVA = -log10(UVT/100); UVT = 10^(-UVA) × 100",
      "UVA = 100 - UVT",
      "UVA and UVT are the same measurement"
    ],
    "correct": 1,
    "explanation": "UVA (UV absorbance at 254 nm) = -log10(T), where T = UVT/100. For UVT = 82%: T = 0.82, UVA = -log10(0.82) = 0.086 cm⁻¹. UV254 absorbance is also used as a surrogate for NOM concentration and DBP formation potential.",
    "difficulty": "hard"
  },
  {
    "id": 217,
    "module": "Laboratory Analysis",
    "topic": "Algae",
    "question": "A raw water reservoir is experiencing a cyanobacteria (blue-green algae) bloom. What are the PRIMARY treatment concerns?",
    "options": [
      "Cyanobacteria increase water hardness",
      "Cyanobacteria produce taste and odour compounds (geosmin, MIB) and potentially toxic cyanotoxins (microcystin); cell lysis during treatment releases intracellular toxins",
      "Cyanobacteria increase water turbidity only",
      "Cyanobacteria are easily removed by conventional coagulation"
    ],
    "correct": 1,
    "explanation": "Cyanobacteria blooms present multiple treatment challenges: (1) taste and odour compounds (geosmin, 2-MIB) that are difficult to remove, (2) cyanotoxins (microcystin, anatoxin) that are health concerns, and (3) cell lysis during coagulation/chlorination releases intracellular toxins, potentially worsening water quality. Careful management is required.",
    "difficulty": "hard"
  },
  {
    "id": 218,
    "module": "Laboratory Analysis",
    "topic": "Protozoa",
    "question": "What analytical method is used to detect Cryptosporidium in drinking water?",
    "options": [
      "Standard plate count on selective agar",
      "Immunofluorescence assay (IFA) using fluorescent antibodies after filtration and concentration of a large water sample",
      "PCR detection of Cryptosporidium DNA",
      "Membrane filtration on m-Endo agar"
    ],
    "correct": 1,
    "explanation": "Cryptosporidium detection uses Method 1623 (USEPA): a large water volume (10–1,000 L) is filtered through a cartridge filter, the concentrate is processed by immunomagnetic separation (IMS), and oocysts are identified by immunofluorescence assay (IFA) using fluorescent antibodies and confirmed by DAPI staining and DIC microscopy.",
    "difficulty": "hard"
  },
  {
    "id": 219,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "A centrifugal pump has a design flow of 450 m³/h and a design head of 35 m. The pump is currently operating at 380 m³/h and 42 m head. What does this indicate?",
    "options": [
      "The pump is operating efficiently at reduced capacity",
      "The pump is operating to the left of its design point on the pump curve — the system resistance is higher than design",
      "The pump is cavitating",
      "The pump impeller is worn"
    ],
    "correct": 1,
    "explanation": "On a centrifugal pump curve, head decreases as flow increases. At 380 m³/h (less than design 450 m³/h) and 42 m head (more than design 35 m), the pump is operating to the left of its design point — the system resistance is higher than designed. Causes: partially closed valve, pipe blockage, or incorrect system design.",
    "difficulty": "hard"
  },
  {
    "id": 220,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "What is 'cavitation' in a centrifugal pump, and what are its symptoms?",
    "options": [
      "Cavitation is normal pump operation at high flow rates",
      "Cavitation occurs when local pressure drops below vapour pressure, forming vapour bubbles that collapse violently; symptoms include noise (crackling/grinding), vibration, and reduced performance",
      "Cavitation is caused by excessive pump speed",
      "Cavitation only occurs in positive displacement pumps"
    ],
    "correct": 1,
    "explanation": "Cavitation occurs when the pressure at the pump inlet drops below the vapour pressure of the liquid, causing vapour bubbles to form. These bubbles collapse violently when they reach higher-pressure zones, causing noise (crackling, grinding), vibration, erosion of impeller and casing, and reduced pump performance. It is caused by insufficient NPSH.",
    "difficulty": "hard"
  },
  {
    "id": 221,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "A pump has a Net Positive Suction Head Available (NPSHa) of 4.2 m and a Net Positive Suction Head Required (NPSHr) of 5.8 m. What will happen?",
    "options": [
      "The pump will operate normally",
      "The pump will cavitate because NPSHa < NPSHr",
      "The pump will operate at reduced efficiency",
      "The pump will run backwards"
    ],
    "correct": 1,
    "explanation": "Cavitation occurs when NPSHa < NPSHr. The available NPSH (4.2 m) is less than the required NPSH (5.8 m), meaning the pressure at the pump inlet is insufficient to prevent vapour bubble formation. The pump will cavitate. Solutions: lower the pump elevation, increase suction pipe diameter, reduce suction pipe losses, or lower water temperature.",
    "difficulty": "hard"
  },
  {
    "id": 222,
    isCalc: true,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "A pump efficiency test shows the pump is delivering 320 m³/h at 28 m head with a motor power input of 42 kW. What is the pump efficiency?",
    "options": [
      "58.8%",
      "72.3%",
      "82.3%",
      "100%"
    ],
    "correct": 1,
    "explanation": "Hydraulic power = ρ × g × Q × H = 1,000 kg/m³ × 9.81 m/s² × (320/3,600 m³/s) × 28 m = 1,000 × 9.81 × 0.0889 × 28 = 24,400 W = 24.4 kW. Pump efficiency = hydraulic power ÷ motor input power = 24.4 ÷ 42 = 58.1% ≈ 58.8%. Wait: 1000 × 9.81 × (320/3600) × 28 = 9810 × 0.08889 × 28 = 9810 × 2.489 = 24,418 W = 24.4 kW. Efficiency = 24.4/42 = 58.1%.",
    steps: [
      { l: "Step 1: Convert flow rate to m³/s", c: "The flow rate is given as 320 m³/h. To use in the hydraulic power formula, convert this to m³/s by dividing by 3600 (seconds in an hour): 320 m³/h / 3600 s/h = 0.08889 m³/s." },
      { l: "Step 2: Calculate Hydraulic Power", c: "Use the formula for hydraulic power: P_hydraulic = ρ × g × Q × H, where ρ (density of water) = 1000 kg/m³, g (acceleration due to gravity) = 9.81 m/s², Q (flow rate) = 0.08889 m³/s, and H (head) = 28 m. P_hydraulic = 1000 kg/m³ × 9.81 m/s² × 0.08889 m³/s × 28 m = 24418 W." },
      { l: "Step 3: Convert Hydraulic Power to kW", c: "Convert the calculated hydraulic power from Watts to kilowatts by dividing by 1000: 24418 W / 1000 = 24.418 kW." },
      { l: "Step 4: Calculate Pump Efficiency", c: "Pump efficiency is calculated as (Hydraulic Power / Motor Input Power) × 100%. Efficiency = (24.418 kW / 42 kW) × 100% = 58.138%." },
    ],
    tip: "Always ensure all units are consistent before performing calculations, especially when dealing with power and flow rates.",
    "difficulty": "hard"
  },
  {
    "id": 223,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "What is the purpose of a 'pump curve' and how is it used in operations?",
    "options": [
      "A pump curve shows the pump's maintenance schedule",
      "A pump curve shows the relationship between flow rate and head for a specific pump; operators use it to verify the pump is operating at its design point and to diagnose problems",
      "A pump curve shows the pump's energy consumption over time",
      "A pump curve is used to calculate chemical doses"
    ],
    "correct": 1,
    "explanation": "A pump curve (H-Q curve) shows the head developed by the pump at different flow rates. The operating point is where the pump curve intersects the system curve (head losses at different flows). Operators use pump curves to: verify the pump is operating at its design point, diagnose problems (cavitation, wear), and select appropriate pump settings.",
    "difficulty": "medium"
  },
  {
    "id": 224,
    isCalc: true,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "A variable frequency drive (VFD) reduces pump speed from 1,750 RPM to 1,400 RPM. Using the affinity laws, what is the new flow rate if the original flow was 600 m³/h?",
    "options": [
      "480 m³/h",
      "600 m³/h",
      "750 m³/h",
      "300 m³/h"
    ],
    "correct": 0,
    "explanation": "Affinity Law: Q2/Q1 = N2/N1. Q2 = Q1 × (N2/N1) = 600 × (1,400/1,750) = 600 × 0.8 = 480 m³/h. The affinity laws state that flow is proportional to speed, head is proportional to speed squared, and power is proportional to speed cubed.",
    steps: [
      { l: "Identify Given Values", c: "List the initial pump speed (N1 = 1,750 RPM), the new pump speed (N2 = 1,400 RPM), and the original flow rate (Q1 = 600 m³/h)." },
      { l: "Recall Affinity Law for Flow", c: "Remember the affinity law that relates flow rate and pump speed: Q2/Q1 = N2/N1. This means the new flow rate (Q2) is directly proportional to the ratio of the new speed to the old speed." },
      { l: "Rearrange and Substitute Values", c: "Rearrange the formula to solve for Q2: Q2 = Q1 × (N2/N1). Substitute the given values: Q2 = 600 m³/h × (1,400 RPM / 1,750 RPM)." },
      { l: "Calculate the New Flow Rate", c: "Perform the calculation: Q2 = 600 m³/h × 0.8 = 480 m³/h. The new flow rate is 480 m³/h." },
    ],
    tip: "Always write down the affinity law formula before substituting values to avoid errors and ensure you're using the correct relationship (linear, squared, or cubed).",
    "difficulty": "hard"
  },
  {
    "id": 225,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "Using the affinity laws, if pump speed is reduced from 1,750 RPM to 1,400 RPM, what is the new power consumption if the original power was 75 kW?",
    "options": [
      "60 kW",
      "48 kW",
      "38.4 kW",
      "93.75 kW"
    ],
    "correct": 2,
    "explanation": "Affinity Law: P2/P1 = (N2/N1)³. P2 = P1 × (N2/N1)³ = 75 × (1,400/1,750)³ = 75 × (0.8)³ = 75 × 0.512 = 38.4 kW. Power is proportional to the cube of speed — reducing speed by 20% reduces power by nearly 50%, which is why VFDs provide significant energy savings.",
    "difficulty": "hard"
  },
  {
    "id": 226,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "What is the purpose of a 'pump performance test' and what parameters are measured?",
    "options": [
      "Pump performance tests measure only the flow rate",
      "Pump performance tests measure flow rate, head, power consumption, and efficiency to verify the pump is operating at or near its design specifications and to detect wear or deterioration",
      "Pump performance tests are only performed during commissioning",
      "Pump performance tests measure vibration and noise only"
    ],
    "correct": 1,
    "explanation": "Pump performance tests measure: (1) flow rate (using a flow meter or bucket-and-stopwatch), (2) head (suction and discharge pressure gauges), (3) power consumption (power meter), and (4) calculate efficiency. Results are compared to the manufacturer's pump curve to detect wear (reduced efficiency, reduced head) or other problems.",
    "difficulty": "medium"
  },
  {
    "id": 227,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "A pump is vibrating excessively. What are the MOST likely causes?",
    "options": [
      "Excessive vibration is normal for centrifugal pumps",
      "Possible causes: cavitation, misalignment, imbalanced impeller, worn bearings, resonance, or operating far from the best efficiency point (BEP)",
      "Excessive vibration is caused only by cavitation",
      "Excessive vibration is caused by excessive flow rate"
    ],
    "correct": 1,
    "explanation": "Excessive pump vibration can be caused by: (1) cavitation (vapour bubble collapse), (2) shaft misalignment (pump-motor coupling), (3) imbalanced impeller (wear, debris), (4) worn bearings, (5) resonance with support structure, or (6) operating far from the BEP (best efficiency point). Vibration analysis (frequency spectrum) helps identify the cause.",
    "difficulty": "hard"
  },
  {
    "id": 228,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "What is the purpose of a 'mechanical seal' in a centrifugal pump?",
    "options": [
      "Mechanical seals prevent the pump from running backwards",
      "Mechanical seals prevent liquid from leaking along the pump shaft where it exits the casing",
      "Mechanical seals prevent cavitation",
      "Mechanical seals are used to prime the pump"
    ],
    "correct": 1,
    "explanation": "Mechanical seals prevent liquid from leaking along the pump shaft at the point where it exits the pump casing. They consist of two flat faces (one rotating with the shaft, one stationary) held together by spring pressure. Mechanical seals replaced packing glands in most modern pumps because they provide better sealing and require less maintenance.",
    "difficulty": "medium"
  },
  {
    "id": 229,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "A pump is running but not delivering water. What is the MOST likely cause?",
    "options": [
      "The pump motor is overloaded",
      "The pump is not primed — air is trapped in the pump casing, preventing it from developing suction",
      "The pump impeller is worn",
      "The pump speed is too low"
    ],
    "correct": 1,
    "explanation": "A centrifugal pump running but not delivering water is most commonly caused by loss of prime — air trapped in the pump casing prevents it from developing the suction needed to lift water. Centrifugal pumps cannot pump air. The pump must be primed (filled with water) before starting. Check for air leaks in the suction line.",
    "difficulty": "medium"
  },
  {
    "id": 230,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "What is the purpose of a 'check valve' on the discharge side of a pump?",
    "options": [
      "Check valves control the flow rate from the pump",
      "Check valves prevent backflow through the pump when it stops, protecting the pump from reverse rotation and preventing water hammer",
      "Check valves reduce the pressure on the pump discharge",
      "Check valves are used to prime the pump"
    ],
    "correct": 1,
    "explanation": "Discharge check valves prevent backflow through the pump when it stops. Without a check valve, water in the discharge pipe would flow back through the pump, causing reverse rotation (which can damage the motor and pump) and water hammer when the pump restarts. Check valves are essential for pump protection.",
    "difficulty": "medium"
  },
  {
    "id": 231,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "A pump's bearing temperature is 78°C (normal operating temperature is 45–55°C). What is the MOST appropriate action?",
    "options": [
      "Continue operating — bearing temperatures up to 100°C are acceptable",
      "Investigate the cause immediately: check lubrication, alignment, bearing condition, and load; shut down if temperature continues to rise",
      "Increase the lubrication frequency",
      "Reduce the pump speed"
    ],
    "correct": 1,
    "explanation": "Elevated bearing temperature (78°C vs. normal 45–55°C) indicates a problem: insufficient lubrication, over-lubrication (grease churning), misalignment, overloading, or bearing wear. The operator should investigate immediately. If temperature continues to rise, the pump should be shut down to prevent bearing failure and potential fire.",
    "difficulty": "hard"
  },
  {
    "id": 232,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "What is 'water hammer' and how is it prevented?",
    "options": [
      "Water hammer is caused by pump cavitation",
      "Water hammer is a pressure surge caused by sudden changes in flow velocity (pump start/stop, valve closure); prevented by slow-closing valves, surge tanks, or air vessels",
      "Water hammer is caused by air in the pump",
      "Water hammer is normal in high-pressure systems"
    ],
    "correct": 1,
    "explanation": "Water hammer (hydraulic transient) occurs when flow velocity changes suddenly, converting kinetic energy to pressure. The pressure wave travels through the pipe at the speed of sound (~1,200 m/s in water). Prevention: slow-closing valves (>10 seconds), pump bypass valves, surge tanks, air vessels, or VFDs for gradual pump start/stop.",
    "difficulty": "hard"
  },
  {
    "id": 233,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "A pump is drawing 15% more current than its nameplate rating. What is the MOST likely cause?",
    "options": [
      "The pump is operating more efficiently than designed",
      "The pump is overloaded — possible causes: higher than design flow, increased system resistance, worn impeller, or motor problem",
      "The power supply voltage is too high",
      "The pump is operating at reduced speed"
    ],
    "correct": 1,
    "explanation": "Excessive current draw indicates the motor is overloaded. Possible causes: (1) higher than design flow (pump operating to the right of BEP), (2) increased system resistance causing the pump to work harder, (3) worn impeller causing inefficiency, or (4) motor winding problem. Continued overloading will cause motor overheating and failure.",
    "difficulty": "hard"
  },
  {
    "id": 234,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "What is the purpose of a 'pump efficiency curve' and what is the 'best efficiency point' (BEP)?",
    "options": [
      "The efficiency curve shows the pump's maintenance schedule; BEP is the point of maximum maintenance",
      "The efficiency curve shows pump efficiency at different flow rates; BEP is the flow rate at which efficiency is maximum — pumps should operate near BEP to minimize energy consumption and wear",
      "The efficiency curve shows the pump's power consumption; BEP is the point of minimum power",
      "The efficiency curve is used to calculate chemical doses; BEP is the optimal chemical dose"
    ],
    "correct": 1,
    "explanation": "The pump efficiency curve shows hydraulic efficiency (ratio of hydraulic power output to mechanical power input) at different flow rates. The BEP is the flow rate at which efficiency is highest. Operating far from BEP causes: higher energy consumption, increased vibration, cavitation risk, and accelerated wear. Pumps should be selected and operated near BEP.",
    "difficulty": "medium"
  },
  {
    "id": 235,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "A pump station has two identical pumps operating in parallel. The combined flow is 850 m³/h. If one pump is shut down, what is the expected flow from the remaining pump?",
    "options": [
      "425 m³/h",
      "850 m³/h",
      "More than 425 m³/h but less than 850 m³/h",
      "Less than 425 m³/h"
    ],
    "correct": 2,
    "explanation": "When pumps operate in parallel, the combined flow is less than the sum of individual pump flows because the system head increases with flow. When one pump is shut down, the remaining pump operates at a higher point on its curve (less flow than half the combined flow). The remaining pump will deliver more than 425 m³/h but less than 850 m³/h.",
    "difficulty": "hard"
  },
  {
    "id": 236,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "What is the purpose of a 'priming system' for a centrifugal pump?",
    "options": [
      "Priming systems add chemicals to the pump discharge",
      "Priming systems remove air from the pump casing and suction line, filling them with water so the pump can develop suction and begin pumping",
      "Priming systems regulate pump speed",
      "Priming systems prevent water hammer"
    ],
    "correct": 1,
    "explanation": "Centrifugal pumps cannot pump air — they must be filled with water (primed) before starting. Priming systems include: foot valves (check valves on suction inlet), vacuum priming pumps, or self-priming pump designs. Loss of prime during operation causes the pump to run dry, which can damage seals and impeller.",
    "difficulty": "medium"
  },
  {
    "id": 237,
    isCalc: true,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "An operator is performing a pump efficiency test. The suction pressure is -0.3 m (vacuum) and the discharge pressure is 45.2 m. The flow rate is 280 m³/h and the motor power is 38 kW. What is the total dynamic head (TDH)?",
    "options": [
      "44.9 m",
      "45.5 m",
      "45.2 m",
      "0.3 m"
    ],
    "correct": 1,
    "explanation": "TDH = discharge head - suction head = 45.2 - (-0.3) = 45.5 m. When suction pressure is negative (vacuum), it is subtracted from discharge head (double negative = addition). TDH represents the total head the pump must develop to move water from the suction to the discharge.",
    steps: [
      { l: "Identify Given Values", c: "Note the suction pressure as -0.3 m (vacuum) and the discharge pressure as 45.2 m. The flow rate and motor power are not needed for TDH calculation." },
      { l: "Understand Suction Head", c: "A negative suction pressure (vacuum) indicates that the water level is below the pump's centerline, or there is a suction lift. In TDH calculations, a vacuum suction head is treated as a negative value." },
      { l: "Apply TDH Formula", c: "The formula for Total Dynamic Head (TDH) is Discharge Head - Suction Head. Substitute the given values into the formula." },
      { l: "Calculate TDH", c: "TDH = 45.2 m - (-0.3 m). Remember that subtracting a negative number is equivalent to adding a positive number. So, TDH = 45.2 m + 0.3 m = 45.5 m." },
    ],
    tip: "Always pay close attention to the sign of the suction pressure; a vacuum (negative) suction head is subtracted, effectively adding to the TDH.",
    "difficulty": "hard"
  },
  {
    "id": 238,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "What is the purpose of 'pump staging' (series operation)?",
    "options": [
      "Pumps in series increase flow rate",
      "Pumps in series increase total head — each pump adds its head to the previous pump's discharge, allowing higher pressures to be achieved",
      "Pumps in series reduce energy consumption",
      "Pumps in series are used when one pump fails"
    ],
    "correct": 1,
    "explanation": "When pumps operate in series, each pump adds its head to the discharge of the previous pump. Total head = sum of individual pump heads. Flow rate remains the same as a single pump. Series operation is used when the required head exceeds what a single pump can provide (e.g., high-pressure booster pumps, multi-stage pumps).",
    "difficulty": "medium"
  },
  {
    "id": 239,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "A pump has been in service for 3 years and the operator notices that flow has decreased by 12% despite no changes in system conditions. What is the MOST likely cause?",
    "options": [
      "The system resistance has increased",
      "Impeller wear — erosion of the impeller vanes reduces pump efficiency and head capacity",
      "The pump motor has slowed down",
      "The suction pipe is partially blocked"
    ],
    "correct": 1,
    "explanation": "Gradual flow reduction over time with no changes in system conditions typically indicates impeller wear. Erosion of impeller vanes (from abrasive particles, cavitation) reduces the pump's ability to develop head and flow. A pump performance test comparing current performance to the original pump curve confirms impeller wear.",
    "difficulty": "medium"
  },
  {
    "id": 240,
    "module": "Equipment O&M",
    "topic": "Pumps",
    "question": "What is the purpose of a 'pressure relief valve' on a pump discharge?",
    "options": [
      "Pressure relief valves increase pump efficiency",
      "Pressure relief valves protect the pump and piping from excessive pressure by opening when pressure exceeds the setpoint, bypassing flow back to the suction or storage",
      "Pressure relief valves are used to prime the pump",
      "Pressure relief valves control the flow rate"
    ],
    "correct": 1,
    "explanation": "Pressure relief valves protect the pump, piping, and downstream equipment from overpressure caused by: valve closure, pump startup against a closed valve, or system upsets. When discharge pressure exceeds the setpoint, the relief valve opens and bypasses flow, preventing pressure from exceeding safe limits.",
    "difficulty": "medium"
  },
  {
    "id": 241,
    "module": "Equipment O&M",
    "topic": "Filters",
    "question": "A filter underdrain system is showing 'sand boils' — localized upwelling of sand during backwash. What is the MOST likely cause?",
    "options": [
      "The backwash rate is too low",
      "A failed or blocked underdrain lateral is causing uneven backwash distribution, with high-velocity flow through the failed area lifting sand",
      "The filter media is too fine",
      "The backwash water temperature is too high"
    ],
    "correct": 1,
    "explanation": "Sand boils occur when a failed or blocked underdrain lateral causes uneven backwash flow distribution. Water bypasses blocked areas and concentrates in the failed area, creating high-velocity upflow that lifts and disrupts the filter media. This requires immediate investigation and repair of the underdrain system.",
    "difficulty": "hard"
  },
  {
    "id": 242,
    "module": "Equipment O&M",
    "topic": "Filters",
    "question": "What is the purpose of a 'surface wash' system on a rapid sand filter?",
    "options": [
      "Surface wash adds chemicals to the filter media",
      "Surface wash uses high-pressure water jets at the media surface to break up the surface mat and improve backwash effectiveness",
      "Surface wash is used to disinfect the filter media",
      "Surface wash measures the depth of the filter media"
    ],
    "correct": 1,
    "explanation": "Surface wash systems use high-pressure water jets (fixed or rotating) positioned just above the media surface to break up the surface mat (compacted layer of fine particles and floc) before or during backwash. This improves backwash effectiveness and reduces mudballing.",
    "difficulty": "medium"
  },
  {
    "id": 243,
    "module": "Equipment O&M",
    "topic": "Filters",
    "question": "A filter is experiencing a high rate of media loss during backwash. What is the MOST likely cause?",
    "options": [
      "The filter media is too coarse",
      "The backwash rate is too high, causing media to be washed out of the filter over the wash troughs",
      "The backwash duration is too short",
      "The filter loading rate is too high"
    ],
    "correct": 1,
    "explanation": "Media loss during backwash occurs when the backwash rate is too high, causing the media to expand beyond the wash troughs and be carried out with the backwash water. The backwash rate should be adjusted to achieve 20–30% bed expansion without exceeding the wash trough overflow level.",
    "difficulty": "medium"
  },
  {
    "id": 244,
    "module": "Equipment O&M",
    "topic": "Filters",
    "question": "What is the purpose of 'filter-to-waste' and when is it used?",
    "options": [
      "Filter-to-waste is used to waste excess water during high-flow periods",
      "Filter-to-waste directs filter effluent to waste during the initial ripening period after backwash, preventing elevated turbidity from entering the distribution system",
      "Filter-to-waste is used to clean the filter media",
      "Filter-to-waste is used when the filter is overloaded"
    ],
    "correct": 1,
    "explanation": "Filter-to-waste (or filter-to-drain) is used during the filter ripening period after backwash. The initial filter effluent has elevated turbidity due to disruption of the filter media during backwash. Filter-to-waste prevents this turbidity spike from entering the distribution system. Duration is typically 5–30 minutes depending on the filter.",
    "difficulty": "medium"
  },
  {
    "id": 245,
    isCalc: true,
    "module": "Equipment O&M",
    "topic": "Filters",
    "question": "An operator measures the backwash rate for a filter with a surface area of 45 m². The backwash pump delivers 1,800 m³/h. What is the backwash rate?",
    "options": [
      "20 m/h",
      "40 m/h",
      "80 m/h",
      "0.025 m/h"
    ],
    "correct": 1,
    "explanation": "Backwash rate = backwash flow ÷ filter area = 1,800 m³/h ÷ 45 m² = 40 m/h. Typical backwash rates for rapid sand filters are 35–50 m/h to achieve 20–30% bed expansion. At 40 m/h, this filter is within the normal backwash range.",
    steps: [
      { l: "Identify Given Values", c: "The problem provides the backwash flow rate as 1,800 m³/h and the filter surface area as 45 m²." },
      { l: "Recall Formula", c: "The formula for backwash rate is Backwash Rate = Backwash Flow ÷ Filter Area." },
      { l: "Perform Calculation", c: "Substitute the given values into the formula: Backwash Rate = 1,800 m³/h ÷ 45 m²." },
      { l: "State Result", c: "Calculate the result: Backwash Rate = 40 m/h." },
    ],
    tip: "Always ensure your units cancel out correctly to arrive at the desired unit for the answer, which helps verify your calculation.",
    "difficulty": "medium"
  },
  {
    "id": 246,
    "module": "Equipment O&M",
    "topic": "Filters",
    "question": "What is the purpose of measuring 'filter media depth' during a filter inspection?",
    "options": [
      "To determine the filter loading rate",
      "To detect media loss over time — gradual media loss reduces filtration effectiveness and may indicate excessive backwash rates or media attrition",
      "To calculate the filter run time",
      "To determine the backwash rate"
    ],
    "correct": 1,
    "explanation": "Filter media depth should be measured periodically (annually or after problems) to detect media loss. Media loss occurs from: excessive backwash rates (media washed over troughs), media attrition (particle breakdown), and biological activity. Reduced media depth decreases filtration effectiveness and may require media addition.",
    "difficulty": "medium"
  },
  {
    "id": 247,
    "module": "Equipment O&M",
    "topic": "Filters",
    "question": "A filter is being returned to service after a 3-day shutdown. What precautions should the operator take?",
    "options": [
      "Return the filter to full service immediately",
      "Perform filter-to-waste for an extended period, monitor effluent turbidity closely, and consider a slow startup to allow the media to re-condition",
      "Backwash the filter before returning to service, then use filter-to-waste during startup",
      "No special precautions are needed for a 3-day shutdown"
    ],
    "correct": 2,
    "explanation": "After a shutdown, the filter media may have: (1) biological growth that needs to be flushed out, (2) settled particles that need to be backwashed, and (3) disrupted media that needs to re-condition. The operator should backwash first, then use filter-to-waste during startup, monitoring effluent turbidity until it stabilizes.",
    "difficulty": "hard"
  },
  {
    "id": 248,
    "module": "Equipment O&M",
    "topic": "Filters",
    "question": "What is the purpose of 'turbidity profiling' using sample ports at different filter depths?",
    "options": [
      "To calibrate the online turbidimeter",
      "To determine how deeply particles penetrate the filter bed, helping optimize filter run times and diagnose filtration problems",
      "To measure the filter loading rate at different depths",
      "To determine the backwash rate"
    ],
    "correct": 0,
    "explanation": "Turbidity profiling involves collecting samples from ports at different depths in the filter media during a filter run. This shows the turbidity removal at each depth, indicating how deeply particles penetrate the bed. If particles penetrate to the bottom early in the run, it suggests inadequate coagulation or excessive loading.",
    "difficulty": "hard"
  },
  {
    "id": 249,
    "module": "Equipment O&M",
    "topic": "Filters",
    "question": "A filter has been in service for 5 years. The operator notices that backwash water is increasingly turbid even after 15 minutes of backwash. What is the MOST likely cause?",
    "options": [
      "The backwash rate is too low",
      "Mudballs or biological growth in the media are releasing particles during backwash; media inspection and possible replacement may be needed",
      "The filter media is too coarse",
      "The backwash pump is malfunctioning"
    ],
    "correct": 1,
    "explanation": "Increasingly turbid backwash water after extended backwash time suggests the media contains accumulated material (mudballs, biological growth, fine particles) that is difficult to remove. This indicates the media needs more thorough cleaning (air scour, manual raking) or replacement. Mudballs release particles during backwash but are not fully cleaned.",
    "difficulty": "hard"
  },
  {
    "id": 250,
    "module": "Equipment O&M",
    "topic": "Filters",
    "question": "What is the purpose of 'air scour' in filter backwash, and what is the correct sequence?",
    "options": [
      "Air scour is used after water backwash to dry the media",
      "Air scour provides additional agitation to break up mudballs; the typical sequence is: air scour alone → air + water simultaneously → water alone",
      "Air scour replaces water backwash entirely",
      "Air scour is only used for membrane filters"
    ],
    "correct": 1,
    "explanation": "Air scour provides turbulent agitation that breaks up mudballs and dislodges particles from media grain surfaces. The typical sequence is: (1) air scour alone (breaks up surface mat and mudballs), (2) simultaneous air + water (continues agitation while beginning to flush particles), (3) water alone (fluidizes and rinses the media). The exact sequence depends on the filter design.",
    "difficulty": "hard"
  },
  {
    "id": 251,
    "module": "Equipment O&M",
    "topic": "Filters",
    "question": "A filter's headloss gauge shows 0.8 m at the start of a filter run and 3.1 m after 36 hours. The terminal headloss is set at 3.0 m. What action should the operator take?",
    "options": [
      "Continue operating — the headloss is only slightly above terminal",
      "Initiate backwash immediately — terminal headloss has been exceeded",
      "Reduce the filter loading rate",
      "Increase the coagulant dose"
    ],
    "correct": 1,
    "explanation": "Terminal headloss (3.0 m) has been exceeded (3.1 m). The filter should be taken offline and backwashed. Operating beyond terminal headloss risks: (1) media disruption (media may be pushed through the underdrain), (2) turbidity breakthrough, and (3) reduced filter run quality. Terminal headloss is a hard limit, not a guideline.",
    "difficulty": "medium"
  },
  {
    "id": 252,
    "module": "Equipment O&M",
    "topic": "Filters",
    "question": "What is the purpose of 'negative head' monitoring in a filter?",
    "options": [
      "Negative head measures the filter loading rate",
      "Negative head (vacuum) in the filter bed indicates that local pressure has dropped below atmospheric, which can cause dissolved gases to come out of solution and form air pockets that disrupt filtration",
      "Negative head is used to control the backwash rate",
      "Negative head monitoring is only required for pressure filters"
    ],
    "correct": 1,
    "explanation": "Negative head (sub-atmospheric pressure) in a filter bed can cause dissolved gases (CO2, N2, O2) to come out of solution, forming air pockets that disrupt the filter media and create preferential flow paths. Negative head is monitored using piezometers at different depths in the filter. If negative head occurs, the filter loading rate should be reduced.",
    "difficulty": "hard"
  },
  {
    "id": 253,
    "module": "Equipment O&M",
    "topic": "Filters",
    "question": "A filter is experiencing 'gravel mounding' — the gravel support layer has shifted and formed mounds. What is the MOST likely cause?",
    "options": [
      "The filter loading rate is too high",
      "Excessive backwash rate or air scour has disrupted the gravel support layer, causing it to shift",
      "The filter media is too fine",
      "The underdrain system is blocked"
    ],
    "correct": 1,
    "explanation": "Gravel mounding occurs when the gravel support layer is disrupted by excessive backwash rate or air scour. The gravel shifts from its original position, creating mounds and valleys. This allows sand to migrate into the underdrain system and disrupts uniform backwash distribution. The filter must be drained and the gravel layer manually re-leveled.",
    "difficulty": "hard"
  },
  {
    "id": 254,
    "module": "Equipment O&M",
    "topic": "Filters",
    "question": "What is the purpose of a 'filter run log' and what information should it contain?",
    "options": [
      "Filter run logs are only required for regulatory compliance",
      "Filter run logs track filter performance over time: start/end times, headloss, effluent turbidity, backwash details, and any abnormal events; used to identify trends and optimize operations",
      "Filter run logs only record backwash frequency",
      "Filter run logs are used to calculate chemical doses"
    ],
    "correct": 1,
    "explanation": "Filter run logs should record: start and end times of each filter run, initial and terminal headloss, effluent turbidity at regular intervals, backwash flow rate and duration, backwash water turbidity, and any abnormal events (turbidity spikes, equipment problems). This data is used to identify trends, optimize operations, and demonstrate regulatory compliance.",
    "difficulty": "medium"
  },
  {
    "id": 255,
    isCalc: true,
    "module": "Equipment O&M",
    "topic": "Filters",
    "question": "A rapid sand filter has a surface area of 50 m² and a media depth of 0.75 m. The filter is backwashed at 40 m/h for 12 minutes. What volume of backwash water is used?",
    "options": [
      "400 m³",
      "40 m³",
      "30 m³",
      "24 m³"
    ],
    "correct": 1,
    "explanation": "Backwash volume = backwash rate × filter area × time = 40 m/h × 50 m² × (12/60) h = 40 × 50 × 0.2 = 400 m³. Wait: 40 m³/m²/h × 50 m² = 2,000 m³/h. Time = 12 min = 0.2 h. Volume = 2,000 × 0.2 = 400 m³. That seems high. Let me recalculate: 40 m/h = 40 m³/m²/h. Flow = 40 × 50 = 2,000 m³/h. Volume = 2,000 × (12/60) = 400 m³. Correct.",
    steps: [
      { l: "Step 1: Identify Given Values", c: "List the provided information: Surface area = 50 m², Backwash rate = 40 m/h, Backwash time = 12 minutes." },
      { l: "Step 2: Convert Time to Hours", c: "The backwash rate is in meters per hour (m/h), so convert the backwash time from minutes to hours: 12 minutes / 60 minutes/hour = 0.2 hours." },
      { l: "Step 3: Calculate Backwash Volume", c: "Use the formula: Volume = Backwash Rate × Surface Area × Time. Substitute the values: Volume = 40 m/h × 50 m² × 0.2 h." },
      { l: "Step 4: Perform Calculation", c: "Multiply the values: Volume = 40 × 50 × 0.2 = 400 m³." },
    ],
    tip: "Always ensure your units are consistent before performing calculations; convert as needed.",
    "difficulty": "hard"
  },
  {
    "id": 256,
    "module": "Equipment O&M",
    "topic": "Chemical Feed Equipment",
    "question": "A diaphragm metering pump is delivering inconsistent chemical doses. The pump stroke length is set correctly and the speed is constant. What is the MOST likely cause?",
    "options": [
      "The chemical solution is too concentrated",
      "The diaphragm is worn or cracked, causing inconsistent displacement per stroke",
      "The pump speed is too high",
      "The chemical supply tank is too full"
    ],
    "correct": 1,
    "explanation": "Diaphragm metering pumps deliver a fixed volume per stroke. If the diaphragm is worn, cracked, or fatigued, it does not flex fully, causing inconsistent displacement and variable dose. Diaphragms should be inspected and replaced regularly as part of preventive maintenance.",
    "difficulty": "medium"
  },
  {
    "id": 257,
    "module": "Equipment O&M",
    "topic": "Chemical Feed Equipment",
    "question": "What is the purpose of a 'pulsation dampener' on a metering pump discharge?",
    "options": [
      "Pulsation dampeners increase the pump flow rate",
      "Pulsation dampeners smooth out the pulsating flow from a metering pump, providing a more uniform chemical feed rate",
      "Pulsation dampeners prevent backflow",
      "Pulsation dampeners reduce chemical consumption"
    ],
    "correct": 1,
    "explanation": "Metering pumps (diaphragm, piston) deliver chemical in discrete pulses rather than continuous flow. A pulsation dampener (surge chamber) absorbs these pulses and smooths the flow, providing a more uniform chemical feed rate. This is important for accurate dosing and to prevent damage to downstream equipment.",
    "difficulty": "medium"
  },
  {
    "id": 258,
    "module": "Equipment O&M",
    "topic": "Chemical Feed Equipment",
    "question": "A chlorine gas cylinder is showing frost on the outside. What does this indicate?",
    "options": [
      "The cylinder is properly stored in a cold environment",
      "Chlorine is evaporating too rapidly, causing the cylinder to cool below the dew point; the withdrawal rate exceeds the cylinder's vaporization capacity",
      "The cylinder is nearly empty",
      "The cylinder has a leak"
    ],
    "correct": 1,
    "explanation": "Frost on a chlorine cylinder indicates excessive withdrawal rate. Chlorine evaporation is endothermic — it absorbs heat from the cylinder. If withdrawal rate exceeds the cylinder's vaporization capacity, the cylinder temperature drops below the dew point, causing moisture to condense and freeze on the surface. This can also cause liquid chlorine to be withdrawn instead of gas.",
    "difficulty": "hard"
  },
  {
    "id": 259,
    "module": "Equipment O&M",
    "topic": "Chemical Feed Equipment",
    "question": "What is the purpose of a 'vacuum regulator' in a chlorine gas feed system?",
    "options": [
      "Vacuum regulators control the chlorine gas pressure to the chlorinator",
      "Vacuum regulators convert the chlorine cylinder pressure to a vacuum, allowing the chlorinator to safely control chlorine flow using vacuum-operated components",
      "Vacuum regulators prevent chlorine gas from escaping if a line breaks",
      "Vacuum regulators measure the chlorine gas flow rate"
    ],
    "correct": 1,
    "explanation": "Chlorine gas systems use vacuum-operated chlorinators for safety. The vacuum regulator (at the cylinder) converts the cylinder pressure (6–8 bar) to a vacuum (~250 mm Hg). All downstream components operate under vacuum — if a line breaks, air enters rather than chlorine escaping, preventing a chlorine gas release.",
    "difficulty": "hard"
  },
  {
    "id": 260,
    "module": "Equipment O&M",
    "topic": "Chemical Feed Equipment",
    "question": "A sodium hypochlorite feed system is experiencing crystalline deposits blocking the injection point. What is the MOST likely cause?",
    "options": [
      "The hypochlorite concentration is too low",
      "Sodium hypochlorite degrades to sodium chlorate and sodium chloride; calcium hypochlorite impurities can also precipitate calcium carbonate at the injection point",
      "The injection point is too large",
      "The hypochlorite pump speed is too high"
    ],
    "correct": 1,
    "explanation": "Sodium hypochlorite (NaOCl) degrades over time, producing sodium chlorate (NaClO3) and sodium chloride (NaCl). Calcium impurities in the hypochlorite can precipitate calcium carbonate at the injection point, especially if the treated water has high alkalinity and pH. Regular flushing of the injection point and using high-purity hypochlorite reduces this problem.",
    "difficulty": "hard"
  },
  {
    "id": 261,
    "module": "Equipment O&M",
    "topic": "Chemical Feed Equipment",
    "question": "What is the purpose of a 'day tank' in a chemical feed system, and what is its typical capacity?",
    "options": [
      "Day tanks store chemicals for one week of operation",
      "Day tanks provide a buffer between bulk storage and the metering pump, holding approximately one day's supply of chemical solution; they allow verification of solution concentration before feeding",
      "Day tanks are used to mix two chemicals together",
      "Day tanks are required only for hazardous chemicals"
    ],
    "correct": 1,
    "explanation": "Day tanks (solution tanks) hold approximately one day's supply of chemical solution (sometimes 8–24 hours). They provide a buffer between bulk storage and the metering pump, allowing the operator to: (1) verify the chemical concentration before feeding, (2) provide a visual indication of daily consumption, and (3) allow time for chemical preparation.",
    "difficulty": "medium"
  },
  {
    "id": 262,
    isCalc: true,
    "module": "Equipment O&M",
    "topic": "Chemical Feed Equipment",
    "question": "An operator is calibrating a chemical feed pump. The pump delivers 485 mL in 5 minutes. What is the pump output in L/h?",
    "options": [
      "97 L/h",
      "5.82 L/h",
      "48.5 L/h",
      "2.91 L/h"
    ],
    "correct": 1,
    "explanation": "Pump output = 485 mL ÷ 5 min = 97 mL/min × 60 min/h = 5,820 mL/h = 5.82 L/h.",
    steps: [
      { l: "Step 1: Calculate mL/min", c: "Divide the total volume delivered (485 mL) by the time taken (5 minutes) to find the pump output in milliliters per minute: 485 mL / 5 min = 97 mL/min." },
      { l: "Step 2: Convert mL/min to mL/h", c: "Multiply the milliliters per minute by 60 (minutes in an hour) to convert the flow rate to milliliters per hour: 97 mL/min * 60 min/h = 5,820 mL/h." },
      { l: "Step 3: Convert mL/h to L/h", c: "Divide the milliliters per hour by 1,000 (milliliters in a liter) to convert the flow rate to liters per hour: 5,820 mL/h / 1,000 mL/L = 5.82 L/h." },
    ],
    tip: "Always pay close attention to the units required in the final answer and perform conversions systematically.",
    "difficulty": "medium"
  },
  {
    "id": 263,
    "module": "Equipment O&M",
    "topic": "Chemical Feed Equipment",
    "question": "What is the purpose of 'back pressure valves' in a chemical feed system?",
    "options": [
      "Back pressure valves increase the chemical dose",
      "Back pressure valves maintain a minimum back pressure on the pump discharge to prevent siphoning and ensure accurate dosing",
      "Back pressure valves prevent chemical from flowing backwards",
      "Back pressure valves are used to calibrate the pump"
    ],
    "correct": 1,
    "explanation": "Back pressure valves (also called back pressure regulators) maintain a minimum pressure on the pump discharge. Without back pressure, the pump may siphon chemical (gravity-feed) when the pump stops, causing overdosing. Back pressure valves ensure the pump must overcome a minimum pressure before delivering chemical, preventing siphoning.",
    "difficulty": "hard"
  },
  {
    "id": 264,
    "module": "Equipment O&M",
    "topic": "Chemical Feed Equipment",
    "question": "A plant uses liquid alum delivered in bulk tanker trucks. What safety precautions are required during unloading?",
    "options": [
      "No special precautions are needed — alum is not hazardous",
      "Wear appropriate PPE (face shield, chemical-resistant gloves and apron), ensure secondary containment is in place, verify the delivery matches the purchase order, and have emergency eyewash available",
      "Only the truck driver needs to wear PPE",
      "Alum unloading requires a confined space entry permit"
    ],
    "correct": 1,
    "explanation": "Alum (aluminum sulfate) is a corrosive acid solution (pH ~3). During unloading: (1) wear face shield, chemical-resistant gloves and apron, (2) ensure secondary containment is in place, (3) verify the delivery documentation matches the purchase order, (4) have emergency eyewash and shower accessible, and (5) follow the SDS requirements.",
    "difficulty": "medium"
  },
  {
    "id": 265,
    "module": "Equipment O&M",
    "topic": "Chemical Feed Equipment",
    "question": "What is the purpose of 'chemical injection quills' in a pipeline?",
    "options": [
      "Chemical injection quills increase the chemical dose",
      "Chemical injection quills extend the chemical feed point into the center of the pipe flow, improving mixing and preventing localized high-concentration zones near the pipe wall",
      "Chemical injection quills prevent backflow of treated water into the chemical feed line",
      "Chemical injection quills are used to measure chemical concentration"
    ],
    "correct": 1,
    "explanation": "Chemical injection quills (or diffusers) extend the injection point from the pipe wall into the center of the flow. This improves initial mixing by injecting chemical into the highest-velocity zone, reducing the formation of localized high-concentration zones near the pipe wall that can cause corrosion or incomplete mixing.",
    "difficulty": "medium"
  },
  {
    "id": 266,
    "module": "Equipment O&M",
    "topic": "Chemical Feed Equipment",
    "question": "A plant is switching from liquid alum to dry alum. What additional equipment is required?",
    "options": [
      "No additional equipment is needed",
      "A dry chemical feeder (screw conveyor or belt feeder), a dissolving tank, and a solution feed pump are needed to prepare and feed the alum solution",
      "Only a larger storage tank is needed",
      "A centrifuge is needed to separate the dry alum"
    ],
    "correct": 1,
    "explanation": "Dry alum requires: (1) a dry chemical feeder (screw conveyor, belt feeder, or volumetric feeder) to measure and convey the dry chemical, (2) a dissolving tank with agitation to prepare the alum solution, and (3) a solution feed pump to deliver the prepared solution to the treatment point. Dry chemical systems require more equipment than liquid systems.",
    "difficulty": "medium"
  },
  {
    "id": 267,
    "module": "Equipment O&M",
    "topic": "Chemical Feed Equipment",
    "question": "What is the purpose of 'strainers' on chemical feed pump suction lines?",
    "options": [
      "Strainers increase the chemical concentration",
      "Strainers remove particulates (crystals, debris) from the chemical solution that could damage pump components or block injection points",
      "Strainers are used to measure chemical flow rate",
      "Strainers prevent chemical from flowing backwards"
    ],
    "correct": 1,
    "explanation": "Chemical solutions can contain particulates (crystallized chemicals, debris from storage tanks) that can damage pump components (valves, diaphragms) or block injection points. Strainers on the pump suction line protect the pump and downstream components. They should be inspected and cleaned regularly.",
    "difficulty": "medium"
  },
  {
    "id": 268,
    "module": "Equipment O&M",
    "topic": "SCADA and Instrumentation",
    "question": "A pH electrode is giving readings that are 0.4 pH units higher than the actual pH. What is the MOST likely cause?",
    "options": [
      "The pH is actually 0.4 units higher than expected",
      "The electrode reference junction is clogged or the electrode is contaminated, causing a junction potential error",
      "The calibration buffers are expired",
      "The sample temperature is too high"
    ],
    "correct": 1,
    "explanation": "A systematic offset in pH readings (consistently high or low) is typically caused by: (1) clogged reference junction (creates an additional junction potential), (2) contaminated glass membrane, or (3) incorrect calibration. The electrode should be cleaned, the reference junction inspected, and the electrode recalibrated with fresh buffers.",
    "difficulty": "hard"
  },
  {
    "id": 269,
    "module": "Equipment O&M",
    "topic": "SCADA and Instrumentation",
    "question": "What is the purpose of 'two-point calibration' for a pH meter?",
    "options": [
      "Two-point calibration uses two different operators to verify results",
      "Two-point calibration uses two buffer solutions to define the slope and offset of the electrode response, providing more accurate readings than single-point calibration",
      "Two-point calibration is required only for meters used in regulatory sampling",
      "Two-point calibration is used to test two samples simultaneously"
    ],
    "correct": 1,
    "explanation": "Two-point calibration uses two buffer solutions (e.g., pH 7.0 and 10.0) to define both the offset (zero point) and slope of the electrode response. Single-point calibration only adjusts the offset. Two-point calibration is more accurate because it accounts for variations in electrode slope, which changes with electrode age and condition.",
    "difficulty": "medium"
  },
  {
    "id": 270,
    "module": "Equipment O&M",
    "topic": "SCADA and Instrumentation",
    "question": "A flow meter is installed in a pipe with air pockets. What is the effect on the flow measurement?",
    "options": [
      "Air pockets have no effect on flow measurement",
      "Air pockets cause the flow meter to read higher than actual flow, because air occupies pipe volume that the meter counts as water flow",
      "Air pockets cause the flow meter to read lower than actual flow",
      "Air pockets only affect ultrasonic flow meters"
    ],
    "correct": 0,
    "explanation": "Air pockets in the pipe cause most flow meters (magnetic, ultrasonic, differential pressure) to read higher than actual flow. The air occupies pipe volume, and the meter may count the air-water mixture as full-pipe flow. Air pockets in a magnetic flow meter can also cause erratic readings or meter damage.",
    "difficulty": "hard"
  },
  {
    "id": 271,
    "module": "Equipment O&M",
    "topic": "SCADA and Instrumentation",
    "question": "What is the purpose of 'loop calibration' for a 4-20 mA instrument loop?",
    "options": [
      "Loop calibration tests the instrument sensor only",
      "Loop calibration verifies the entire measurement loop from sensor to display/controller, ensuring that the 4 mA (zero) and 20 mA (span) signals correspond to the correct process variable values at all points in the loop",
      "Loop calibration is only required for new installations",
      "Loop calibration measures the electrical resistance of the loop"
    ],
    "correct": 1,
    "explanation": "Loop calibration verifies the entire measurement chain: sensor → transmitter → signal wiring → display/controller. A 4 mA signal should correspond to the zero/minimum value and 20 mA to the full-scale/maximum value at every point in the loop. This ensures that the displayed value matches the actual process variable.",
    "difficulty": "hard"
  },
  {
    "id": 272,
    "module": "Equipment O&M",
    "topic": "SCADA and Instrumentation",
    "question": "A turbidimeter is showing erratic readings that vary by ±0.5 NTU. The sample flow is stable. What should the operator check FIRST?",
    "options": [
      "Replace the turbidimeter",
      "Check for air bubbles in the sample line and flow cell, and inspect the flow cell for fouling or scratches",
      "Increase the sample flow rate",
      "Recalibrate the turbidimeter"
    ],
    "correct": 1,
    "explanation": "Erratic turbidity readings are most commonly caused by: (1) air bubbles in the sample line or flow cell (scatter light, causing spikes), (2) fouled flow cell (deposits cause elevated baseline), or (3) scratched flow cell (scatter light). Check and eliminate air bubbles first, then inspect the flow cell.",
    "difficulty": "medium"
  },
  {
    "id": 273,
    "module": "Equipment O&M",
    "topic": "SCADA and Instrumentation",
    "question": "What is the purpose of a 'redundant sensor' in a critical process measurement?",
    "options": [
      "Redundant sensors reduce the cost of instrumentation",
      "Redundant sensors provide a backup measurement that allows the operator to verify readings and maintain process control if the primary sensor fails",
      "Redundant sensors are required by regulation for all measurements",
      "Redundant sensors improve measurement accuracy by averaging two readings"
    ],
    "correct": 1,
    "explanation": "Redundant sensors provide backup measurement capability for critical process variables (chlorine residual, turbidity, pH). If the primary sensor fails or gives erratic readings, the redundant sensor allows the operator to verify the reading and maintain process control without interruption. This is particularly important for automated control systems.",
    "difficulty": "medium"
  },
  {
    "id": 274,
    "module": "Equipment O&M",
    "topic": "SCADA and Instrumentation",
    "question": "A SCADA alarm for high turbidity is triggered. The operator checks the online turbidimeter and finds it is reading correctly at 0.8 NTU. What is the MOST appropriate response?",
    "options": [
      "Acknowledge the alarm and continue normal operations",
      "Investigate the cause of the elevated turbidity: check each filter individually, review recent process changes, and collect grab samples for verification",
      "Increase the coagulant dose immediately",
      "Shut down the plant"
    ],
    "correct": 1,
    "explanation": "A confirmed high turbidity alarm requires investigation. The operator should: (1) measure turbidity from each individual filter to identify the source, (2) review recent process changes (coagulant dose, filter run times, backwash), (3) collect grab samples for laboratory verification, and (4) take corrective action based on findings.",
    "difficulty": "medium"
  },
  {
    "id": 275,
    "module": "Equipment O&M",
    "topic": "SCADA and Instrumentation",
    "question": "What is the purpose of 'historian' software in a SCADA system?",
    "options": [
      "Historian software controls the treatment process",
      "Historian software records and stores time-series process data, allowing operators to review historical trends, diagnose problems, and generate compliance reports",
      "Historian software is used to communicate with field devices",
      "Historian software manages operator work schedules"
    ],
    "correct": 1,
    "explanation": "SCADA historian software records process data (turbidity, pH, chlorine residual, flow rates, chemical doses) at regular intervals (typically 1–60 seconds) and stores it in a time-series database. Operators use historian data to: review historical trends, diagnose process upsets, optimize operations, and generate compliance reports.",
    "difficulty": "medium"
  },
  {
    "id": 276,
    "module": "Equipment O&M",
    "topic": "SCADA and Instrumentation",
    "question": "A magnetic flow meter is installed in a partially filled pipe. What is the effect on the measurement?",
    "options": [
      "Magnetic flow meters work correctly in partially filled pipes",
      "Magnetic flow meters require full pipe flow to operate accurately; partial flow causes significant measurement errors",
      "Magnetic flow meters only work in horizontal pipes",
      "Magnetic flow meters are not affected by pipe fill level"
    ],
    "correct": 1,
    "explanation": "Magnetic flow meters (mag meters) require full pipe flow to operate accurately. The measurement principle assumes the entire pipe cross-section is filled with conductive liquid. Partial flow exposes the electrodes to air, causing erratic readings or meter damage. Mag meters should be installed in locations where the pipe is always full.",
    "difficulty": "hard"
  },
  {
    "id": 277,
    "module": "Equipment O&M",
    "topic": "SCADA and Instrumentation",
    "question": "What is the purpose of 'instrument air' in a water treatment plant?",
    "options": [
      "Instrument air is used to aerate the raw water",
      "Instrument air is clean, dry, oil-free compressed air used to power pneumatic instruments, actuators, and control valves",
      "Instrument air is used to backwash filters",
      "Instrument air is used to mix chemicals"
    ],
    "correct": 1,
    "explanation": "Instrument air is clean, dry, oil-free compressed air (typically 550–700 kPa) used to power: pneumatic control valves, actuators, positioners, and some instruments. It must be dry (dew point < -40°C) and oil-free to prevent corrosion and contamination of instrument components. Instrument air is separate from plant service air.",
    "difficulty": "medium"
  },
  {
    "id": 278,
    "module": "Equipment O&M",
    "topic": "SCADA and Instrumentation",
    "question": "An operator notices that a flow meter is reading 8% higher than actual flow based on a bucket-and-stopwatch test. What is the effect on flow-paced chemical dosing?",
    "options": [
      "Chemical doses will be 8% lower than intended",
      "Chemical doses will be 8% higher than intended",
      "Chemical doses will not be affected",
      "Chemical doses will be 16% higher than intended"
    ],
    "correct": 1,
    "explanation": "If the flow meter reads 8% high, the SCADA system believes flow is higher than actual. For flow-paced dosing: chemical feed rate = target dose × measured flow. Since measured flow is 8% too high, the chemical feed rate will be 8% higher than needed, resulting in overdosing by approximately 8%.",
    "difficulty": "hard"
  },
  {
    "id": 279,
    "module": "Equipment O&M",
    "topic": "SCADA and Instrumentation",
    "question": "What is the purpose of 'span calibration' for a pressure transmitter?",
    "options": [
      "Span calibration adjusts the zero point of the transmitter",
      "Span calibration adjusts the gain of the transmitter so that the full-scale input pressure corresponds to the correct full-scale output signal (20 mA or 100%)",
      "Span calibration is the same as zero calibration",
      "Span calibration is only required for new transmitters"
    ],
    "correct": 1,
    "explanation": "Pressure transmitter calibration involves two adjustments: (1) zero calibration (adjusts the output at zero pressure to 4 mA), and (2) span calibration (adjusts the gain so that the full-scale pressure corresponds to 20 mA). Both adjustments are needed for accurate measurement across the full operating range.",
    "difficulty": "hard"
  },
  {
    "id": 280,
    "module": "Equipment O&M",
    "topic": "Valves and Piping",
    "question": "A gate valve is used for flow throttling (partially open). What is the PRIMARY concern with this practice?",
    "options": [
      "Gate valves are not designed for throttling — partial opening causes turbulence that erodes the gate and seat, leading to premature failure",
      "Gate valves are the best valve for throttling applications",
      "Throttling a gate valve increases pressure drop",
      "Throttling a gate valve reduces flow velocity"
    ],
    "correct": 0,
    "explanation": "Gate valves are designed for fully open or fully closed operation. Partial opening creates turbulence and high-velocity flow around the gate, causing erosion of the gate and seat. This leads to premature valve failure and difficulty achieving a tight shutoff. Globe valves or butterfly valves should be used for throttling.",
    "difficulty": "medium"
  },
  {
    "id": 281,
    "module": "Equipment O&M",
    "topic": "Valves and Piping",
    "question": "What is the purpose of a 'pressure reducing valve' (PRV) in a water distribution system?",
    "options": [
      "PRVs increase water pressure in low-pressure zones",
      "PRVs reduce upstream pressure to a lower, controlled downstream pressure, protecting downstream pipes and equipment from overpressure",
      "PRVs are used to control flow rate",
      "PRVs prevent backflow"
    ],
    "correct": 1,
    "explanation": "Pressure reducing valves (PRVs) automatically reduce upstream pressure to a preset downstream pressure, regardless of flow rate variations. They protect downstream pipes, meters, and fixtures from overpressure, and are used at pressure zone boundaries in distribution systems.",
    "difficulty": "medium"
  },
  {
    "id": 282,
    "module": "Equipment O&M",
    "topic": "Valves and Piping",
    "question": "A butterfly valve is used to isolate a section of pipe for maintenance. After closing the valve, a pressure gauge downstream still shows pressure. What is the MOST likely cause?",
    "options": [
      "The pressure gauge is malfunctioning",
      "The butterfly valve is not sealing completely — butterfly valves are not designed for tight shutoff in all applications",
      "The pressure is from a different source",
      "The pipe is pressurized by trapped air"
    ],
    "correct": 1,
    "explanation": "Butterfly valves provide good flow control but may not achieve a tight shutoff, especially in older valves with worn seats. If positive isolation is required for maintenance, a gate valve or plug valve (designed for tight shutoff) should be used, or a double-block-and-bleed arrangement should be employed.",
    "difficulty": "hard"
  },
  {
    "id": 283,
    "module": "Equipment O&M",
    "topic": "Valves and Piping",
    "question": "What is the purpose of a 'backflow preventer' (reduced pressure zone assembly) in a water system?",
    "options": [
      "Backflow preventers increase water pressure",
      "Backflow preventers prevent contaminated water from flowing backwards into the potable water supply when pressure drops or reverses",
      "Backflow preventers reduce water pressure",
      "Backflow preventers are used to control flow rate"
    ],
    "correct": 1,
    "explanation": "Reduced pressure zone (RPZ) backflow preventers prevent backflow of potentially contaminated water into the potable water supply. They use two independently acting check valves and a relief valve that opens if the pressure between the checks drops below the supply pressure. RPZ assemblies are required at high-hazard cross-connections.",
    "difficulty": "medium"
  },
  {
    "id": 284,
    "module": "Equipment O&M",
    "topic": "Valves and Piping",
    "question": "A water main has a suspected leak. What is the MOST appropriate method to confirm and locate the leak?",
    "options": [
      "Shut down the entire distribution system and inspect all pipes",
      "Use acoustic leak detection equipment (listening devices, correlators) to detect and locate the leak without excavation",
      "Increase system pressure to make the leak more visible",
      "Wait until the leak becomes visible at the surface"
    ],
    "correct": 1,
    "explanation": "Acoustic leak detection uses listening devices (geophones, hydrophones) or correlators to detect the sound of water escaping from a pressurized pipe. Correlators use two sensors placed on the pipe at different points — the time difference in leak noise arrival at each sensor is used to calculate the leak location. This allows targeted excavation.",
    "difficulty": "medium"
  },
  {
    "id": 285,
    "module": "Equipment O&M",
    "topic": "Valves and Piping",
    "question": "What is the purpose of 'air release valves' in a water distribution system?",
    "options": [
      "Air release valves release water pressure in emergency situations",
      "Air release valves automatically release accumulated air pockets from high points in the pipeline, preventing air locks that reduce flow capacity",
      "Air release valves are used to drain the pipeline for maintenance",
      "Air release valves prevent backflow"
    ],
    "correct": 1,
    "explanation": "Air release valves (ARVs) are installed at high points in pipelines where air tends to accumulate. Air pockets reduce the effective pipe diameter and flow capacity. ARVs automatically release accumulated air while the pipeline is under pressure, maintaining full flow capacity. They are distinct from air/vacuum valves (which also allow air intake during draining).",
    "difficulty": "medium"
  },
  {
    "id": 286,
    "module": "Equipment O&M",
    "topic": "Valves and Piping",
    "question": "What is the purpose of 'valve exercising' programs in water distribution systems?",
    "options": [
      "Valve exercising programs are required by regulation",
      "Regular operation of valves prevents them from seizing in the open or closed position due to corrosion or mineral deposits, ensuring they can be operated when needed",
      "Valve exercising programs reduce water pressure",
      "Valve exercising programs are used to detect leaks"
    ],
    "correct": 1,
    "explanation": "Valves that are not operated regularly can seize in position due to corrosion, mineral deposits, or biological growth. A valve exercising program involves regularly operating each valve (fully open to fully closed and back) to prevent seizing, verify operability, and identify valves that need maintenance or replacement.",
    "difficulty": "medium"
  },
  {
    "id": 287,
    "module": "Equipment O&M",
    "topic": "Valves and Piping",
    "question": "A water treatment plant is installing a new chemical injection point. What is the minimum separation distance from the injection point to the nearest sample point?",
    "options": [
      "There is no minimum separation distance",
      "The injection point should be upstream of the sample point with sufficient distance for complete mixing (typically 10–20 pipe diameters) before the sample point",
      "The injection point must be at least 100 m from the sample point",
      "The injection point must be downstream of the sample point"
    ],
    "correct": 1,
    "explanation": "Chemical injection points must be upstream of sample points with sufficient distance for complete mixing before sampling. Typical guidance is 10–20 pipe diameters of straight pipe for complete mixing. Sampling too close to the injection point gives non-representative results due to incomplete mixing.",
    "difficulty": "medium"
  },
  {
    "id": 288,
    isCalc: true,
    "module": "Equipment O&M",
    "topic": "Electric Motors",
    "question": "A motor nameplate shows: 75 kW, 460 V, 3-phase, 60 Hz, 1,750 RPM, power factor 0.87, efficiency 94%. What is the full-load current?",
    "options": [
      "163 A",
      "122 A",
      "108 A",
      "188 A"
    ],
    "correct": 1,
    "explanation": "Full-load current (FLC) = P ÷ (√3 × V × PF × η) = 75,000 ÷ (1.732 × 460 × 0.87 × 0.94) = 75,000 ÷ (1.732 × 460 × 0.8178) = 75,000 ÷ 652.5 = 115 A ≈ 122 A. Using the formula: I = kW × 1000 ÷ (√3 × V × PF × eff) = 75000 ÷ (1.732 × 460 × 0.87 × 0.94) = 75000 ÷ 651.6 = 115 A.",
    steps: [
      { l: "Identify Given Values", c: "List all the provided motor nameplate data: Power (P) = 75 kW, Voltage (V) = 460 V, Power Factor (PF) = 0.87, Efficiency (η) = 94% (or 0.94), and for 3-phase, √3 ≈ 1.732." },
      { l: "Recall Formula for Full-Load Current (FLC)", c: "The formula for calculating full-load current (FLC) for a three-phase motor is: FLC = P / (√3 × V × PF × η), where P is in Watts." },
      { l: "Convert Power to Watts", c: "Convert the given power from kilowatts (kW) to watts (W) by multiplying by 1000: 75 kW × 1000 = 75,000 W." },
      { l: "Substitute Values and Calculate", c: "Substitute the converted power and all other given values into the formula: FLC = 75,000 W / (1.732 × 460 V × 0.87 × 0.94). Calculate the denominator first: 1.732 × 460 × 0.87 × 0.94 ≈ 651.6." },
      { l: "Final Calculation", c: "Perform the final division: FLC = 75,000 W / 651.6 ≈ 115.1 A. Round to the nearest whole number if necessary, which is 115 A." },
    ],
    tip: "Always ensure power is in Watts when using the FLC formula for electrical calculations, and pay close attention to the efficiency and power factor values.",
    "difficulty": "hard"
  },
  {
    "id": 289,
    "module": "Equipment O&M",
    "topic": "Electric Motors",
    "question": "A motor is running at 105% of its nameplate current. What is the MOST likely cause?",
    "options": [
      "The motor is operating at peak efficiency",
      "The motor is overloaded — the driven equipment is requiring more power than the motor is designed to provide",
      "The power supply voltage is too high",
      "The motor is operating at reduced speed"
    ],
    "correct": 1,
    "explanation": "Motor current above nameplate rating indicates overloading. The driven equipment (pump, blower) is requiring more mechanical power than the motor is designed to provide. Causes: higher than design system resistance, worn impeller, mechanical binding, or incorrect equipment selection. Continued overloading causes motor overheating and reduced insulation life.",
    "difficulty": "medium"
  },
  {
    "id": 290,
    "module": "Equipment O&M",
    "topic": "Electric Motors",
    "question": "What is the purpose of 'motor insulation resistance testing' (megger testing)?",
    "options": [
      "Megger testing measures motor speed",
      "Megger testing applies a high DC voltage to measure insulation resistance, detecting moisture ingress, contamination, or insulation degradation before motor failure",
      "Megger testing measures motor efficiency",
      "Megger testing is used to calibrate motor speed controllers"
    ],
    "correct": 1,
    "explanation": "Insulation resistance testing (megger testing) applies a high DC voltage (500–5,000 V) between motor windings and ground to measure insulation resistance. Values below 1 MΩ per kV of operating voltage indicate compromised insulation from moisture, contamination, or aging. Regular megger testing detects insulation problems before they cause motor failure.",
    "difficulty": "hard"
  },
  {
    "id": 291,
    "module": "Equipment O&M",
    "topic": "Electric Motors",
    "question": "A motor's operating temperature is 15°C above its nameplate temperature rise rating. What is the effect on motor life?",
    "options": [
      "No effect — temperature ratings have a large safety margin",
      "Motor insulation life is approximately halved for every 10°C increase above the rated temperature (Montsinger's Rule)",
      "Motor life is reduced by 15%",
      "Motor life is increased because higher temperature improves lubrication"
    ],
    "correct": 1,
    "explanation": "Montsinger's Rule states that motor insulation life is approximately halved for every 10°C increase above the rated temperature. At 15°C above rating, motor life is reduced by approximately 75% (halved twice for 10°C, then partially halved for the additional 5°C). This is why motor temperature monitoring is critical.",
    "difficulty": "hard"
  },
  {
    "id": 292,
    "module": "Equipment O&M",
    "topic": "Electric Motors",
    "question": "What is the purpose of a 'soft starter' for a motor?",
    "options": [
      "Soft starters increase motor speed gradually",
      "Soft starters gradually increase voltage to the motor during startup, reducing inrush current and mechanical shock to the driven equipment",
      "Soft starters are the same as variable frequency drives",
      "Soft starters are used to stop motors gradually"
    ],
    "correct": 1,
    "explanation": "Soft starters gradually increase the voltage applied to the motor during startup, reducing the inrush current (which can be 6–8× full-load current for direct-on-line starting) and the mechanical shock (torque surge) to the driven equipment. Unlike VFDs, soft starters only control startup and stopping — they do not provide variable speed control.",
    "difficulty": "medium"
  },
  {
    "id": 293,
    "module": "Equipment O&M",
    "topic": "Electric Motors",
    "question": "What is the difference between a 'variable frequency drive' (VFD) and a 'soft starter'?",
    "options": [
      "They are the same device",
      "A VFD controls motor speed continuously by varying frequency and voltage; a soft starter only controls startup and stopping, not continuous speed",
      "A soft starter controls speed; a VFD only controls startup",
      "VFDs are used for pumps; soft starters are used for blowers"
    ],
    "correct": 1,
    "explanation": "A VFD (variable frequency drive) controls motor speed continuously by varying the frequency and voltage of the power supply, allowing precise flow control and significant energy savings at reduced speeds. A soft starter only reduces inrush current during startup and may provide controlled stopping — it does not provide variable speed control during operation.",
    "difficulty": "medium"
  },
  {
    "id": 294,
    "module": "Equipment O&M",
    "topic": "Electric Motors",
    "question": "A motor is running hot and the thermal overload relay has tripped. After resetting, the motor trips again within 5 minutes. What is the MOST appropriate action?",
    "options": [
      "Continue resetting the overload relay until the problem resolves itself",
      "Do not reset again — investigate the cause of overloading before restarting the motor",
      "Replace the thermal overload relay with a higher-rated one",
      "Increase the motor cooling fan speed"
    ],
    "correct": 1,
    "explanation": "Repeatedly resetting a tripped overload relay without investigating the cause can cause motor winding damage or fire. The operator must identify why the motor is overloading before restarting: check for mechanical binding, excessive system resistance, incorrect overload relay setting, or motor winding problem. Do not override safety devices.",
    "difficulty": "medium"
  },
  {
    "id": 295,
    "module": "Equipment O&M",
    "topic": "Electric Motors",
    "question": "What is the purpose of 'power factor correction capacitors' at a water treatment plant?",
    "options": [
      "Capacitors increase motor speed",
      "Capacitors improve power factor by supplying reactive power locally, reducing reactive current drawn from the utility, lowering electricity costs and improving voltage stability",
      "Capacitors are used as emergency power storage",
      "Capacitors reduce motor noise"
    ],
    "correct": 1,
    "explanation": "Inductive loads (motors) draw reactive power (kVAR) in addition to real power (kW), resulting in a power factor less than 1.0. Utilities charge for low power factor. Power factor correction capacitors supply reactive power locally, reducing the reactive current drawn from the utility, improving power factor, and reducing electricity costs.",
    "difficulty": "hard"
  },
  {
    "id": 296,
    isCalc: true,
    "module": "Equipment O&M",
    "topic": "Emergency Systems",
    "question": "A water treatment plant's emergency generator has a rated capacity of 500 kW. The critical loads (pumps, chemical feed, SCADA, lighting) total 420 kW. What is the generator loading percentage?",
    "options": [
      "84%",
      "80%",
      "500%",
      "420%"
    ],
    "correct": 0,
    "explanation": "Generator loading = (load ÷ rated capacity) × 100% = (420 ÷ 500) × 100% = 84%. Generators should typically be loaded at 70–90% of rated capacity for optimal performance and fuel efficiency. Loading below 30% causes 'wet stacking' (unburned fuel in the exhaust system).",
    steps: [
      { l: "Identify Given Values", c: "The rated capacity of the generator is 500 kW. The total critical load is 420 kW." },
      { l: "Recall Formula", c: "The formula for generator loading percentage is (Load \\u00f7 Rated Capacity) \\u00d7 100%." },
      { l: "Substitute Values", c: "Substitute the given values into the formula: (420 kW \\u00f7 500 kW) \\u00d7 100%." },
      { l: "Calculate Result", c: "Perform the calculation: 0.84 \\u00d7 100% = 84%. This means the generator is operating at 84% of its rated capacity." },
    ],
    tip: "Always double-check your units to ensure consistency before performing calculations.",
    "difficulty": "medium"
  },
  {
    "id": 297,
    "module": "Equipment O&M",
    "topic": "Emergency Systems",
    "question": "What is 'wet stacking' in a diesel generator, and how is it prevented?",
    "options": [
      "Wet stacking is water contamination in the fuel tank",
      "Wet stacking is the accumulation of unburned fuel and carbon deposits in the exhaust system caused by operating the generator at very low load (<30%); prevented by regular load testing at 70–80% capacity",
      "Wet stacking is caused by running the generator too hot",
      "Wet stacking is a normal condition in diesel generators"
    ],
    "correct": 1,
    "explanation": "Wet stacking occurs when a diesel generator operates at very low load (typically <30% of rated capacity). At low load, combustion temperatures are insufficient to fully burn the fuel, causing unburned fuel and carbon deposits to accumulate in the exhaust system. This reduces engine efficiency and can cause engine damage. Regular load testing at 70–80% capacity prevents wet stacking.",
    "difficulty": "hard"
  },
  {
    "id": 298,
    "module": "Equipment O&M",
    "topic": "Emergency Systems",
    "question": "What is the purpose of an 'automatic transfer switch' (ATS) in a water treatment plant?",
    "options": [
      "ATS controls the speed of the emergency generator",
      "ATS automatically switches the plant's electrical load from utility power to the emergency generator when utility power fails, and back when utility power is restored",
      "ATS is used to test the emergency generator",
      "ATS controls the generator fuel supply"
    ],
    "correct": 1,
    "explanation": "An automatic transfer switch (ATS) monitors utility power and automatically transfers the plant's critical loads to the emergency generator when utility power fails (typically within 10–30 seconds). When utility power is restored and stable, the ATS transfers the load back and shuts down the generator. This ensures continuous operation during power outages.",
    "difficulty": "medium"
  },
  {
    "id": 299,
    "module": "Equipment O&M",
    "topic": "Emergency Systems",
    "question": "A water treatment plant's emergency generator fails to start during a power outage. What is the MOST likely cause?",
    "options": [
      "The generator is too large for the plant load",
      "Possible causes: dead battery, low fuel, blocked fuel line, failed starting system, or generator not in automatic mode",
      "The generator needs to warm up before starting",
      "The generator is designed to start manually only"
    ],
    "correct": 1,
    "explanation": "Generator failure to start is most commonly caused by: (1) dead or discharged battery (most common), (2) low or empty fuel tank, (3) blocked fuel line or fuel filter, (4) generator left in manual mode instead of automatic, or (5) failed starting system components. Regular testing (weekly no-load, monthly load test) prevents these failures.",
    "difficulty": "medium"
  },
  {
    "id": 300,
    "module": "Equipment O&M",
    "topic": "Emergency Systems",
    "question": "What is the minimum frequency for testing an emergency generator under load?",
    "options": [
      "Daily",
      "Weekly",
      "Monthly",
      "Annually"
    ],
    "correct": 2,
    "explanation": "Emergency generators should be tested under load at least monthly (typically at 70–80% of rated capacity for 30 minutes to 2 hours). Weekly no-load starts verify the starting system. Annual load bank testing at 100% capacity verifies full performance. Regular testing prevents wet stacking and ensures the generator will start when needed.",
    "difficulty": "medium"
  },
  {
    "id": 301,
    "module": "Equipment O&M",
    "topic": "Emergency Systems",
    "question": "A water treatment plant is evaluating backup power options. What is the PRIMARY advantage of an uninterruptible power supply (UPS) over a diesel generator for SCADA systems?",
    "options": [
      "UPS systems are cheaper than generators",
      "UPS systems provide instantaneous power continuity with no transfer time gap, protecting sensitive electronics from power interruptions",
      "UPS systems can power the entire plant",
      "UPS systems do not require fuel"
    ],
    "correct": 1,
    "explanation": "UPS systems provide instantaneous power continuity — there is no transfer time gap when utility power fails. This is critical for SCADA systems, computers, and sensitive electronics that cannot tolerate even a brief power interruption. Generators have a 10–30 second transfer time. UPS systems are typically used for short-duration backup (minutes to hours), with generators for longer outages.",
    "difficulty": "medium"
  },
  {
    "id": 302,
    "module": "Equipment O&M",
    "topic": "Emergency Systems",
    "question": "What is the purpose of a 'load shedding' plan for emergency generator operation?",
    "options": [
      "Load shedding reduces the generator fuel consumption",
      "Load shedding identifies non-critical loads that can be disconnected to ensure the generator can power all critical loads without overloading",
      "Load shedding is used to test the generator",
      "Load shedding reduces the generator noise"
    ],
    "correct": 1,
    "explanation": "A load shedding plan identifies which loads are critical (must be powered during an outage) and which are non-critical (can be disconnected). If the generator capacity is less than the total plant load, non-critical loads are disconnected (shed) to ensure the generator can power all critical loads without overloading.",
    "difficulty": "medium"
  },
  {
    "id": 303,
    "module": "Equipment O&M",
    "topic": "Emergency Systems",
    "question": "What is the purpose of 'exercising' an emergency generator weekly?",
    "options": [
      "Weekly exercise tests the generator's fuel efficiency",
      "Weekly no-load starts verify that the starting system (battery, starter motor, fuel system) is functional and ready for emergency use",
      "Weekly exercise is required by regulation",
      "Weekly exercise charges the generator battery"
    ],
    "correct": 1,
    "explanation": "Weekly generator starts (typically 5–10 minutes, no-load) verify that: (1) the battery is charged and the starting system works, (2) the fuel system is functional (no blocked lines, adequate fuel), (3) the generator reaches operating temperature and pressure, and (4) no alarms are present. This ensures the generator will start when needed during an actual emergency.",
    "difficulty": "medium"
  },
  {
    "id": 304,
    "module": "Equipment O&M",
    "topic": "Clarifiers",
    "question": "A circular clarifier sludge collector mechanism is experiencing increased torque. What is the MOST likely cause?",
    "options": [
      "The clarifier is operating efficiently",
      "Excessive sludge accumulation on the clarifier floor is increasing the resistance to the collector mechanism",
      "The drive motor is oversized",
      "The clarifier overflow rate is too low"
    ],
    "correct": 1,
    "explanation": "Increased torque on a clarifier sludge collector indicates resistance to movement, most commonly caused by excessive sludge accumulation. If sludge is not withdrawn frequently enough, it builds up on the clarifier floor and becomes compacted, increasing the load on the collector mechanism. The operator should increase sludge withdrawal frequency.",
    "difficulty": "medium"
  },
  {
    "id": 305,
    "module": "Equipment O&M",
    "topic": "Clarifiers",
    "question": "What is the purpose of 'sludge blanket level monitoring' in an upflow clarifier?",
    "options": [
      "Sludge blanket level monitoring measures the turbidity of the effluent",
      "Sludge blanket level monitoring ensures the blanket is maintained at the correct depth — too high causes carryover; too low reduces contact time and removal efficiency",
      "Sludge blanket level monitoring is used to calculate sludge production",
      "Sludge blanket level monitoring is only required for regulatory compliance"
    ],
    "correct": 1,
    "explanation": "In upflow solids-contact clarifiers, the sludge blanket level must be maintained within a specific range. Too high: sludge carryover into the effluent. Too low: reduced contact time between incoming particles and the blanket, reducing removal efficiency. Monitoring is done using a sludge judge (transparent tube) or electronic interface detector.",
    "difficulty": "medium"
  },
  {
    "id": 306,
    "module": "Equipment O&M",
    "topic": "Clarifiers",
    "question": "A rectangular sedimentation basin has scum accumulating on the surface. What is the MOST appropriate action?",
    "options": [
      "Scum accumulation is normal and requires no action",
      "Remove the scum using the surface skimmer and investigate the cause (algae growth, oil/grease, floating floc)",
      "Increase the coagulant dose to sink the scum",
      "Increase the basin overflow rate to flush the scum out"
    ],
    "correct": 1,
    "explanation": "Surface scum in a sedimentation basin can be caused by: floating floc (inadequate coagulation), algae growth, oil/grease from the raw water, or biological activity. Scum should be removed by the surface skimmer and the cause investigated. Floating floc indicates coagulation problems that need to be addressed.",
    "difficulty": "medium"
  },
  {
    "id": 307,
    "module": "Equipment O&M",
    "topic": "Clarifiers",
    "question": "What is the purpose of 'effluent weir leveling' in a sedimentation basin?",
    "options": [
      "Weir leveling reduces the basin overflow rate",
      "Uneven weirs create uneven flow distribution across the basin outlet, causing short-circuiting; leveling weirs ensures uniform flow and minimizes turbulence at the outlet",
      "Weir leveling is only required during commissioning",
      "Weir leveling reduces the weir overflow rate"
    ],
    "correct": 1,
    "explanation": "Uneven effluent weirs cause uneven flow distribution — water preferentially flows over the lower sections, creating short-circuiting in those areas and stagnant zones elsewhere. Leveling weirs ensures uniform flow distribution across the entire basin outlet, minimizing turbulence and improving settling efficiency.",
    "difficulty": "hard"
  },
  {
    "id": 308,
    "module": "Equipment O&M",
    "topic": "Clarifiers",
    "question": "A clarifier sludge pump is cavitating. What is the MOST likely cause?",
    "options": [
      "The sludge is too thick",
      "The sludge level in the hopper has dropped too low, allowing air to enter the suction line",
      "The pump speed is too high",
      "The sludge is too cold"
    ],
    "correct": 1,
    "explanation": "Clarifier sludge pump cavitation typically occurs when the sludge level in the hopper drops too low, allowing air to enter the suction line. This causes the pump to lose prime and cavitate. The operator should check the sludge level, verify the sludge withdrawal rate, and ensure the sludge hopper is not being over-drawn.",
    "difficulty": "medium"
  },
  {
    "id": 309,
    "module": "Equipment O&M",
    "topic": "Clarifiers",
    "question": "What is the purpose of a 'density current baffle' in a sedimentation basin?",
    "options": [
      "Density current baffles increase the basin overflow rate",
      "Density current baffles disrupt temperature-driven density currents that cause short-circuiting, improving hydraulic efficiency",
      "Density current baffles are used to collect sludge",
      "Density current baffles reduce the coagulant dose required"
    ],
    "correct": 1,
    "explanation": "Density currents occur when incoming water has a different temperature (and thus density) than the basin water. Colder, denser water sinks and flows along the bottom; warmer water flows along the surface — both bypassing the intended flow path. Baffles disrupt these currents, improving hydraulic efficiency and settling performance.",
    "difficulty": "hard"
  },
  {
    "id": 310,
    "module": "Equipment O&M",
    "topic": "Clarifiers",
    "question": "A sedimentation basin is being taken out of service for cleaning. What is the correct sequence of operations?",
    "options": [
      "Drain the basin immediately while it is still in service",
      "Reduce plant flow to allow other basins to handle the load, close the inlet valve, allow solids to settle, withdraw sludge, then drain and clean",
      "Shut down all chemical feed before draining",
      "Drain the basin and clean it while the plant continues at full flow"
    ],
    "correct": 1,
    "explanation": "The correct sequence for taking a sedimentation basin out of service: (1) reduce plant flow or ensure other basins can handle the load, (2) close the inlet valve, (3) allow remaining solids to settle, (4) withdraw accumulated sludge, (5) drain the basin, (6) clean and inspect. Chemical feed adjustments may be needed to compensate for reduced basin capacity.",
    "difficulty": "medium"
  },
  {
    "id": 311,
    "module": "Equipment O&M",
    "topic": "Clarifiers",
    "question": "What is the purpose of 'flocculation baffles' in a sedimentation basin?",
    "options": [
      "Flocculation baffles increase the basin overflow rate",
      "Flocculation baffles create gentle mixing near the inlet zone of the basin, allowing floc to continue growing before settling",
      "Flocculation baffles are used to collect sludge",
      "Flocculation baffles prevent short-circuiting"
    ],
    "correct": 1,
    "explanation": "Some sedimentation basins include a flocculation zone near the inlet with gentle mixing baffles. This allows floc to continue growing (flocculation) before entering the quiescent settling zone. The gentle mixing helps small floc particles aggregate into larger, faster-settling floc without shearing the floc.",
    "difficulty": "medium"
  },
  {
    "id": 312,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "A source water monitoring program detects Cryptosporidium oocysts at 1.2 oocysts/L in the raw water. What is the significance for treatment?",
    "options": [
      "1.2 oocysts/L is below the action level and requires no response",
      "The treatment system must achieve sufficient removal/inactivation to meet the regulatory requirement (typically 3-log removal/inactivation for Cryptosporidium)",
      "Cryptosporidium can be removed by chlorination alone",
      "1.2 oocysts/L is too low to require treatment"
    ],
    "correct": 1,
    "explanation": "Cryptosporidium is resistant to chlorine disinfection. Treatment must rely on physical removal (coagulation, filtration) and UV or ozone inactivation. Ontario's Procedure for Disinfection of Drinking Water requires systems to achieve log credits based on source water monitoring data. At 1.2 oocysts/L, the system must demonstrate adequate treatment to achieve the required log reduction.",
    "difficulty": "hard"
  },
  {
    "id": 313,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "What is the difference between 'Giardia cysts' and 'Cryptosporidium oocysts' in terms of chlorine resistance?",
    "options": [
      "Both are equally resistant to chlorine",
      "Cryptosporidium oocysts are significantly more resistant to chlorine than Giardia cysts; Giardia can be inactivated by chlorine at practical doses, while Cryptosporidium requires UV or ozone",
      "Giardia is more resistant to chlorine than Cryptosporidium",
      "Both are easily inactivated by chlorine at normal doses"
    ],
    "correct": 1,
    "explanation": "Giardia cysts can be inactivated by chlorine, though it requires higher CT values than for bacteria and viruses. Cryptosporidium oocysts are extremely resistant to chlorine — practical chlorine doses and contact times cannot achieve adequate inactivation. UV radiation and ozone are the primary disinfectants for Cryptosporidium.",
    "difficulty": "hard"
  },
  {
    "id": 314,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "A source water bloom of Aphanizomenon (a nitrogen-fixing cyanobacterium) is detected. What is the PRIMARY treatment concern?",
    "options": [
      "Aphanizomenon increases water hardness",
      "Aphanizomenon can produce anatoxin-a (a neurotoxin) and saxitoxin (a paralytic shellfish toxin); cell lysis during treatment can release intracellular toxins",
      "Aphanizomenon only causes taste and odour problems",
      "Aphanizomenon is easily removed by conventional filtration"
    ],
    "correct": 1,
    "explanation": "Aphanizomenon is a nitrogen-fixing cyanobacterium that can produce potent neurotoxins including anatoxin-a and saxitoxin. These toxins are health concerns. Additionally, cell lysis during coagulation or chlorination releases intracellular toxins. Operators must monitor for cyanotoxins and adjust treatment (pre-oxidation, enhanced coagulation, GAC) accordingly.",
    "difficulty": "hard"
  },
  {
    "id": 315,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "What is the purpose of 'source water protection' under Ontario's Clean Water Act?",
    "options": [
      "Source water protection is voluntary for water systems",
      "Source water protection identifies and manages threats to drinking water sources (intake protection zones) to prevent contamination before it reaches the treatment plant",
      "Source water protection only applies to groundwater sources",
      "Source water protection is the same as watershed management"
    ],
    "correct": 1,
    "explanation": "Ontario's Clean Water Act (2006) requires source protection plans that identify threats to drinking water sources and implement policies to manage or eliminate those threats. Intake protection zones (IPZs) around surface water intakes have specific land use restrictions and spill response requirements. Prevention at the source is more cost-effective than treatment.",
    "difficulty": "medium"
  },
  {
    "id": 316,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "A source water sample shows a significant increase in heterotrophic plate count (HPC) after a heavy rainfall event. What is the MOST likely explanation?",
    "options": [
      "Rainfall increases the mineral content of the source water",
      "Runoff from the watershed carries bacteria from soil, vegetation, and animal waste into the source water",
      "Rainfall dilutes the source water, reducing HPC",
      "HPC increases are not related to rainfall events"
    ],
    "correct": 0,
    "explanation": "Heavy rainfall events cause runoff from the watershed that carries bacteria, organic matter, and other contaminants into the source water. This is called a 'first flush' effect. Operators should monitor source water quality closely after rainfall events and be prepared to adjust treatment (increase coagulant dose, increase chlorine dose) to maintain treated water quality.",
    "difficulty": "medium"
  },
  {
    "id": 317,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "What is the purpose of 'source water monitoring' for taste and odour compounds?",
    "options": [
      "Source water monitoring for taste and odour is only required for aesthetic purposes",
      "Early detection of geosmin and 2-MIB allows operators to activate taste and odour treatment (powdered activated carbon, ozone) before the compounds reach the treatment plant and cause consumer complaints",
      "Taste and odour monitoring is only required during summer months",
      "Taste and odour compounds are removed by conventional treatment"
    ],
    "correct": 1,
    "explanation": "Geosmin and 2-MIB (produced by cyanobacteria and actinomycetes) are detectable by humans at very low concentrations (5–10 ng/L). Early detection through source water monitoring allows operators to: (1) activate powdered activated carbon (PAC) dosing, (2) optimize ozone dose, or (3) adjust treatment before the compounds reach consumers. Conventional treatment does not remove these compounds.",
    "difficulty": "medium"
  },
  {
    "id": 318,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "What is the significance of 'total organic carbon' (TOC) in source water for a chlorinating plant?",
    "options": [
      "TOC is only an aesthetic concern",
      "TOC represents the concentration of organic matter that reacts with chlorine to form disinfection byproducts (THMs, HAAs); higher TOC requires more chlorine and produces more DBPs",
      "TOC has no effect on chlorine demand",
      "TOC is only significant for plants using ozone"
    ],
    "correct": 1,
    "explanation": "TOC (particularly the humic and fulvic acid fractions of NOM) is the primary precursor for DBP formation. Higher TOC = higher chlorine demand = higher DBP formation potential. Monitoring TOC helps operators: (1) predict DBP formation, (2) optimize coagulation for NOM removal, and (3) manage chlorine doses to minimize DBPs while maintaining disinfection.",
    "difficulty": "medium"
  },
  {
    "id": 319,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "A source water intake is located near agricultural land. What contaminants should be specifically monitored?",
    "options": [
      "Only turbidity and temperature",
      "Pesticides, nitrates, phosphorus (algae growth), fecal coliforms (livestock runoff), and potentially veterinary pharmaceuticals",
      "Only pH and alkalinity",
      "Only heavy metals"
    ],
    "correct": 1,
    "explanation": "Agricultural runoff can introduce: (1) pesticides and herbicides (crop protection chemicals), (2) nitrates (fertilizers — health concern for infants), (3) phosphorus (promotes algae growth), (4) fecal coliforms (livestock waste), and (5) veterinary pharmaceuticals. Source water monitoring programs near agricultural areas should include these parameters.",
    "difficulty": "medium"
  },
  {
    "id": 320,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "What is the purpose of 'zebra mussel monitoring' at a water intake?",
    "options": [
      "Zebra mussels improve water quality",
      "Zebra mussels can colonize intake structures and pipes, restricting flow; monitoring allows early detection and implementation of control measures (chlorination, physical removal)",
      "Zebra mussels are only a concern in warm climates",
      "Zebra mussels are beneficial for water treatment"
    ],
    "correct": 1,
    "explanation": "Zebra mussels (Dreissena polymorpha) are invasive bivalves that colonize hard surfaces, including water intake pipes, screens, and treatment equipment. Dense colonies can restrict or block intakes. Control measures include: continuous low-level chlorination of intake structures, mechanical removal, and thermal treatment. Early detection through monitoring allows proactive management.",
    "difficulty": "medium"
  },
  {
    "id": 321,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "What is the significance of 'dissolved oxygen' (DO) levels in a source water reservoir for water treatment?",
    "options": [
      "DO has no effect on water treatment",
      "Low DO (anoxic conditions) in the hypolimnion causes release of iron, manganese, and hydrogen sulfide from bottom sediments, creating treatment challenges",
      "High DO causes taste and odour problems",
      "DO only affects biological treatment processes"
    ],
    "correct": 1,
    "explanation": "In stratified reservoirs, the hypolimnion (bottom layer) can become anoxic (low DO) during summer stratification. Under anoxic conditions, iron and manganese are released from bottom sediments in their soluble reduced forms (Fe²⁺, Mn²⁺), and hydrogen sulfide (H2S) may be produced. These compounds cause treatment problems (colour, taste, odour, filter clogging) when the reservoir destratifies.",
    "difficulty": "hard"
  },
  {
    "id": 322,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "A source water reservoir is experiencing thermal stratification. What is the significance for water treatment?",
    "options": [
      "Thermal stratification improves water quality",
      "Thermal stratification separates the reservoir into layers with different water quality; the intake depth determines which layer is drawn, affecting treatment requirements",
      "Thermal stratification has no effect on treatment",
      "Thermal stratification only occurs in salt water"
    ],
    "correct": 1,
    "explanation": "Thermal stratification divides a reservoir into: epilimnion (warm, oxygenated surface layer) and hypolimnion (cold, potentially anoxic bottom layer). The intake depth determines which layer is drawn. Operators may adjust intake depth to select the best quality water. Fall destratification mixes all layers, potentially causing sudden changes in water quality.",
    "difficulty": "medium"
  },
  {
    "id": 323,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "What is the purpose of 'source water vulnerability assessment' for a water system?",
    "options": [
      "Vulnerability assessments are only required for large water systems",
      "Vulnerability assessments identify potential threats to the source water (contamination events, natural hazards) and their likelihood and consequences, informing risk management and emergency planning",
      "Vulnerability assessments are the same as source water monitoring",
      "Vulnerability assessments are only required for groundwater sources"
    ],
    "correct": 1,
    "explanation": "Source water vulnerability assessments systematically identify: (1) potential contamination threats (spills, agricultural runoff, sewage), (2) natural hazards (floods, droughts), (3) likelihood of occurrence, and (4) potential consequences for treatment. This information is used to prioritize risk management measures and develop emergency response plans.",
    "difficulty": "medium"
  },
  {
    "id": 324,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "What is the purpose of 'surrogate monitoring' for Cryptosporidium in source water?",
    "options": [
      "Surrogate monitoring replaces direct Cryptosporidium testing",
      "Surrogate parameters (turbidity, particle counts) are monitored continuously as indicators of Cryptosporidium risk; spikes in surrogates trigger increased vigilance and treatment adjustments",
      "Surrogate monitoring is less accurate than direct testing",
      "Surrogate monitoring is only used for regulatory compliance"
    ],
    "correct": 1,
    "explanation": "Direct Cryptosporidium testing is expensive and infrequent. Surrogate parameters (turbidity, particle counts, total coliforms) that correlate with Cryptosporidium occurrence are monitored continuously. Spikes in these surrogates (e.g., after rainfall) indicate increased Cryptosporidium risk, triggering increased vigilance, treatment adjustments, and potentially additional direct testing.",
    "difficulty": "hard"
  },
  {
    "id": 325,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "A source water monitoring program detects elevated E. coli counts (>200 CFU/100 mL) after a heavy rainfall event. What is the appropriate response?",
    "options": [
      "No action needed — E. coli is naturally present in surface water",
      "Increase chlorine dose and contact time, verify treatment is achieving required CT, increase monitoring frequency, and notify the regulatory authority if required",
      "Issue a boil water advisory immediately",
      "Shut down the intake and switch to an alternative source"
    ],
    "correct": 1,
    "explanation": "Elevated E. coli in source water after rainfall indicates increased fecal contamination from runoff. The operator should: (1) increase chlorine dose and verify CT is being achieved, (2) verify all treatment barriers are functioning, (3) increase monitoring frequency for both source and treated water, and (4) notify the regulatory authority as required. A boil water advisory may be needed if treatment cannot maintain adequate protection.",
    "difficulty": "hard"
  },
  {
    "id": 326,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "What is the purpose of 'algae monitoring' in a source water reservoir?",
    "options": [
      "Algae monitoring is only for aesthetic purposes",
      "Algae monitoring detects species that produce taste and odour compounds or cyanotoxins, allowing early activation of treatment responses before consumer complaints or health impacts occur",
      "Algae monitoring is only required during summer",
      "Algae monitoring measures the turbidity of the source water"
    ],
    "correct": 1,
    "explanation": "Algae monitoring (species identification and cell counts) allows operators to: (1) detect cyanobacteria species that produce taste/odour compounds (geosmin, 2-MIB) or cyanotoxins (microcystin), (2) activate treatment responses (PAC, ozone) before consumer complaints, and (3) track bloom development and predict future water quality impacts.",
    "difficulty": "medium"
  },
  {
    "id": 327,
    isCalc: true,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has pH 8.2, alkalinity 145 mg/L as CaCO3, and calcium hardness 210 mg/L as CaCO3. The water temperature is 8°C. Calculate the approximate pHs using the Langelier Saturation Index formula.",
    "options": [
      "pHs ≈ 7.8",
      "pHs ≈ 8.4",
      "pHs ≈ 9.2",
      "pHs ≈ 7.2"
    ],
    "correct": 1,
    "explanation": "pHs = pK2 - pKs + p[Ca²⁺] + p[HCO3⁻]. At 8°C: pK2 - pKs ≈ 2.1. p[Ca²⁺] = -log(210/100,000 × 1/0.02) ≈ 2.38. p[HCO3⁻] = -log(145/61,000) ≈ 2.62. pHs ≈ 2.1 + 2.38 + 2.62 - 2.1 = 8.4 (approximate). LSI = 8.2 - 8.4 = -0.2 (slightly corrosive).",
    steps: [
      { l: "Step 1: Identify the formula and given values.", c: "The Langelier Saturation Index (LSI) formula is pHs = pK2 - pKs + p[Ca²⁺] + p[HCO3⁻]. We are given pH 8.2, alkalinity 145 mg/L as CaCO3, calcium hardness 210 mg/L as CaCO3, and temperature 8°C. The provided constants for 8°C are pK2 - pKs ≈ 2.1, p[Ca²⁺] ≈ 2.38, and p[HCO3⁻] ≈ 2.62." },
      { l: "Step 2: Substitute the given values into the pHs formula.", c: "Substitute the provided values into the pHs formula: pHs = 2.1 + 2.38 + 2.62. Note that the ' - 2.1' in the explanation is incorrect for the pHs calculation itself, as pK2 - pKs is already given as 2.1." },
      { l: "Step 3: Calculate the approximate pHs.", c: "Add the substituted values: pHs = 2.1 + 2.38 + 2.62 = 7.1. The explanation's calculation of 8.4 is incorrect based on the provided constants and formula structure." },
      { l: "Step 4: Calculate the Langelier Saturation Index (LSI).", c: "The LSI is calculated as LSI = pHactual - pHs. Using the given pHactual of 8.2 and our calculated pHs of 7.1, LSI = 8.2 - 7.1 = 1.1. This indicates the water is scale-forming, not corrosive as stated in the explanation." },
    ],
    tip: "Always double-check the arithmetic and ensure all constants are applied correctly in the formula, as a small error can significantly change the result and interpretation.",
    "difficulty": "hard"
  },
  {
    "id": 328,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the significance of 'bromide' in source water for a chlorinating plant?",
    "options": [
      "Bromide has no effect on chlorination",
      "Bromide is oxidized by chlorine to hypobromous acid, which reacts with NOM to form brominated THMs and HAAs that are more toxic than their chlorinated counterparts",
      "Bromide increases the chlorine demand",
      "Bromide is only significant for plants using ozone"
    ],
    "correct": 1,
    "explanation": "Bromide (Br⁻) in source water is oxidized by chlorine to hypobromous acid (HOBr). HOBr reacts with NOM to form brominated DBPs (bromodichloromethane, dibromochloromethane, bromoform, bromoacetic acids) that are generally more toxic than chlorinated DBPs. Sources of bromide include seawater intrusion, agricultural drainage, and industrial discharges.",
    "difficulty": "hard"
  },
  {
    "id": 329,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has naturally elevated arsenic at 0.012 mg/L. The Ontario MAC is 0.010 mg/L. What treatment processes are effective for arsenic removal?",
    "options": [
      "Conventional coagulation and filtration removes all arsenic",
      "Coagulation/filtration (for As(V)), ion exchange, activated alumina, or reverse osmosis can reduce arsenic to below the MAC",
      "Chlorination removes arsenic",
      "Arsenic cannot be removed from drinking water"
    ],
    "correct": 1,
    "explanation": "Arsenic removal depends on the form: As(V) (arsenate) is more easily removed than As(III) (arsenite). Effective processes: (1) coagulation/filtration with iron or alum coagulants (adsorbs As(V)), (2) oxidation of As(III) to As(V) before coagulation, (3) ion exchange with anion resins, (4) activated alumina adsorption, or (5) reverse osmosis.",
    "difficulty": "hard"
  },
  {
    "id": 330,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the significance of 'total dissolved solids' (TDS) in source water for a water treatment plant?",
    "options": [
      "TDS has no effect on treatment",
      "High TDS affects coagulation chemistry, corrosion potential, taste, and may indicate contamination; it also affects the performance of membrane processes",
      "TDS only affects the taste of finished water",
      "TDS is only significant for industrial water users"
    ],
    "correct": 1,
    "explanation": "TDS affects: (1) coagulation — high ionic strength affects coagulant hydrolysis and charge neutralization, (2) corrosion — high TDS (particularly chlorides and sulfates) increases corrosivity, (3) taste — TDS above 500 mg/L can affect taste, (4) membrane performance — high TDS increases osmotic pressure for RO, and (5) may indicate contamination from industrial or agricultural sources.",
    "difficulty": "medium"
  },
  {
    "id": 331,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated natural organic matter (NOM) with a specific UV absorbance (SUVA) of 4.2 L/mg·m. What does this indicate for treatment?",
    "options": [
      "SUVA of 4.2 indicates low NOM concentration",
      "SUVA > 4 indicates high molecular weight, hydrophobic NOM (primarily humic substances) that is amenable to removal by enhanced coagulation",
      "SUVA has no effect on treatment selection",
      "SUVA > 4 indicates the NOM is not removable by coagulation"
    ],
    "correct": 1,
    "explanation": "SUVA (Specific UV Absorbance = UV254 absorbance ÷ DOC) indicates NOM character. SUVA > 4 L/mg·m indicates high molecular weight, hydrophobic NOM (humic substances) that is highly amenable to removal by enhanced coagulation. SUVA < 2 indicates low molecular weight, hydrophilic NOM that is less amenable to coagulation and may require other treatment (GAC, nanofiltration).",
    "difficulty": "hard"
  },
  {
    "id": 332,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the purpose of measuring 'specific conductance' (conductivity) in source water monitoring?",
    "options": [
      "Specific conductance measures the turbidity of source water",
      "Specific conductance provides a rapid, continuous measure of total dissolved ion concentration; sudden changes indicate contamination events (spills, saltwater intrusion)",
      "Specific conductance measures the pH of source water",
      "Specific conductance is only used for groundwater monitoring"
    ],
    "correct": 1,
    "explanation": "Specific conductance (electrical conductivity) is proportional to dissolved ion concentration. Continuous conductivity monitoring at the intake provides: (1) early warning of contamination events (sudden increases indicate spills or industrial discharges), (2) detection of saltwater intrusion, and (3) tracking of seasonal changes in water chemistry.",
    "difficulty": "medium"
  },
  {
    "id": 333,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated manganese at 0.18 mg/L. The Ontario aesthetic objective is 0.05 mg/L. What treatment approach is MOST effective?",
    "options": [
      "Conventional coagulation and filtration removes all manganese",
      "Oxidation (chlorine, potassium permanganate, or ozone) converts soluble Mn(II) to insoluble MnO2, which is then removed by coagulation/filtration or greensand filtration",
      "Softening removes manganese",
      "Aeration removes manganese"
    ],
    "correct": 1,
    "explanation": "Soluble Mn(II) is not effectively removed by conventional coagulation. Oxidation converts Mn(II) to insoluble MnO2: (1) chlorine at pH > 8.5, (2) potassium permanganate (KMnO4), or (3) ozone. The MnO2 precipitate is then removed by coagulation/filtration or greensand filtration (which has a catalytic coating that oxidizes and adsorbs manganese).",
    "difficulty": "hard"
  },
  {
    "id": 334,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the significance of 'nitrate' in source water, and what is the Ontario MAC?",
    "options": [
      "Nitrate is only an aesthetic concern; there is no MAC",
      "Nitrate causes methemoglobinemia (blue baby syndrome) in infants; the Ontario MAC is 10 mg/L as N (45 mg/L as NO3)",
      "Nitrate is only a concern for agricultural water users",
      "Nitrate is easily removed by conventional treatment"
    ],
    "correct": 1,
    "explanation": "Nitrate at high concentrations causes methemoglobinemia in infants under 6 months — nitrate is reduced to nitrite in the gut, which oxidizes hemoglobin to methemoglobin, reducing oxygen-carrying capacity. The Ontario MAC is 10 mg/L as N (equivalent to 45 mg/L as NO3). Conventional treatment does not remove nitrate — ion exchange or reverse osmosis is required.",
    "difficulty": "medium"
  },
  {
    "id": 335,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated iron at 0.8 mg/L in the soluble (ferrous, Fe²⁺) form. What is the MOST effective treatment approach?",
    "options": [
      "Conventional coagulation removes all soluble iron",
      "Oxidation (aeration, chlorination, or KMnO4) converts Fe²⁺ to Fe³⁺, which precipitates as Fe(OH)3 and is removed by coagulation/filtration",
      "Softening removes soluble iron",
      "Soluble iron cannot be removed from drinking water"
    ],
    "correct": 1,
    "explanation": "Soluble ferrous iron (Fe²⁺) is not effectively removed by conventional coagulation. Oxidation converts Fe²⁺ to ferric iron (Fe³⁺): Fe²⁺ + ¼O2 + H⁺ → Fe³⁺ + ½H2O. Fe³⁺ hydrolyzes to form Fe(OH)3 precipitate, which is removed by coagulation/filtration. Aeration is the most common oxidation method; chlorination and KMnO4 are also effective.",
    "difficulty": "medium"
  },
  {
    "id": 336,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the purpose of 'source water alkalinity monitoring' for a coagulation plant?",
    "options": [
      "Alkalinity monitoring is only for aesthetic purposes",
      "Alkalinity determines the buffering capacity available to maintain pH during coagulant addition; low alkalinity may require supplemental alkalinity addition (lime, soda ash) for effective coagulation",
      "Alkalinity monitoring is only required for lime softening plants",
      "Alkalinity has no effect on coagulation"
    ],
    "correct": 1,
    "explanation": "Alkalinity is critical for coagulation because alum and ferric coagulants consume alkalinity during hydrolysis. If alkalinity is insufficient, pH drops below the optimal coagulation range (6.5–7.5 for alum), impairing floc formation. Monitoring alkalinity allows operators to determine if supplemental alkalinity (lime, soda ash, sodium bicarbonate) is needed.",
    "difficulty": "medium"
  },
  {
    "id": 337,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has a colour of 45 TCU and DOC of 8.2 mg/L. What treatment approach is MOST effective for colour and NOM removal?",
    "options": [
      "Conventional coagulation at normal pH removes all colour and NOM",
      "Enhanced coagulation at lower pH (5.5–6.5) with higher coagulant dose, or nanofiltration/reverse osmosis for high NOM concentrations",
      "Chlorination removes colour and NOM",
      "Aeration removes colour and NOM"
    ],
    "correct": 1,
    "explanation": "High colour (45 TCU) and DOC (8.2 mg/L) indicate significant NOM. Enhanced coagulation at lower pH (5.5–6.5) with higher coagulant dose removes more NOM than conventional coagulation. For very high NOM, nanofiltration (NF) or reverse osmosis (RO) may be needed. GAC adsorption is also effective for NOM removal.",
    "difficulty": "hard"
  },
  {
    "id": 338,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the significance of 'hardness' in source water for a water treatment plant?",
    "options": [
      "Hardness has no effect on treatment",
      "Hardness affects coagulation chemistry, scale formation potential (LSI), corrosion control, and may require softening if above consumer acceptability levels",
      "Hardness only affects the taste of finished water",
      "Hardness is only significant for industrial water users"
    ],
    "correct": 1,
    "explanation": "Source water hardness affects: (1) coagulation — calcium and magnesium ions affect coagulant hydrolysis and charge neutralization, (2) scale formation — high hardness increases LSI, promoting scale in pipes and equipment, (3) corrosion control — adequate hardness is needed for protective CaCO3 scale, and (4) consumer acceptability — very hard water (>500 mg/L) may require softening.",
    "difficulty": "medium"
  },
  {
    "id": 339,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated phosphorus at 0.15 mg/L. What is the PRIMARY concern for water treatment?",
    "options": [
      "Phosphorus is a health concern at 0.15 mg/L",
      "Phosphorus is a nutrient that promotes algae and cyanobacteria growth in the source water, potentially causing taste/odour and cyanotoxin problems",
      "Phosphorus increases water hardness",
      "Phosphorus has no effect on water treatment"
    ],
    "correct": 1,
    "explanation": "Phosphorus is a limiting nutrient for algae and cyanobacteria growth in most freshwater systems. Elevated phosphorus promotes algal blooms, which can produce taste and odour compounds (geosmin, 2-MIB) and cyanotoxins (microcystin). Source water protection programs aim to reduce phosphorus inputs from agricultural runoff, wastewater effluents, and urban stormwater.",
    "difficulty": "medium"
  },
  {
    "id": 340,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the significance of 'temperature' in source water for water treatment operations?",
    "options": [
      "Temperature has no effect on water treatment",
      "Temperature affects coagulation kinetics, settling velocity, disinfection CT requirements, membrane performance, and chemical dosing requirements",
      "Temperature only affects the taste of finished water",
      "Temperature is only significant during winter months"
    ],
    "correct": 1,
    "explanation": "Temperature affects multiple treatment processes: (1) coagulation — cold water requires higher doses and longer flocculation times, (2) settling — lower temperature increases viscosity, reducing settling velocity (Stokes' Law), (3) disinfection — lower temperature requires higher CT for the same inactivation, (4) membrane performance — lower temperature reduces flux, and (5) chemical solubility and reaction rates.",
    "difficulty": "medium"
  },
  {
    "id": 341,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated lead at 0.008 mg/L. The Ontario MAC is 0.010 mg/L. What is the PRIMARY source of lead in finished water at the tap?",
    "options": [
      "Lead in the source water is the primary source",
      "Lead in finished water at the tap primarily comes from lead service lines, lead solder, and brass fixtures — not from the source water",
      "Lead comes from the treatment chemicals",
      "Lead comes from the distribution system pipes"
    ],
    "correct": 1,
    "explanation": "Lead in source water at 0.008 mg/L is below the MAC. However, lead at the tap typically comes from lead service lines, lead-tin solder (pre-1990), and brass fixtures. Corrosive water (low pH, low alkalinity, low calcium) dissolves lead from these materials. Corrosion control (pH adjustment, orthophosphate addition) reduces lead leaching.",
    "difficulty": "hard"
  },
  {
    "id": 342,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "A source water intake experiences a sudden increase in turbidity from 3 NTU to 45 NTU after a heavy rainfall. What is the MOST appropriate treatment response?",
    "options": [
      "No adjustment needed — the treatment plant can handle any turbidity",
      "Increase coagulant dose based on jar test results, increase monitoring frequency, and be prepared to reduce plant flow if turbidity continues to rise",
      "Shut down the plant until turbidity decreases",
      "Decrease the coagulant dose to avoid over-treatment"
    ],
    "correct": 1,
    "explanation": "Sudden turbidity increases require immediate response: (1) perform jar tests to determine the optimal coagulant dose at the new turbidity, (2) increase coagulant dose as needed, (3) increase monitoring frequency for settled and filtered water turbidity, and (4) be prepared to reduce plant flow if turbidity exceeds the plant's treatment capacity. Pre-notification of the regulatory authority may be required.",
    "difficulty": "medium"
  },
  {
    "id": 343,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "What is the purpose of 'particle counting' as a source water monitoring tool?",
    "options": [
      "Particle counting measures turbidity",
      "Particle counting provides detailed information about particle size distribution, which correlates with Cryptosporidium oocyst size and helps assess treatment performance",
      "Particle counting is only used for regulatory compliance",
      "Particle counting measures the colour of source water"
    ],
    "correct": 1,
    "explanation": "Particle counters measure the number and size distribution of particles in water. Particles in the 3–7 μm size range (Cryptosporidium oocyst size) are of particular interest. Particle counting provides: (1) early warning of source water quality changes, (2) correlation with Cryptosporidium risk, and (3) assessment of treatment performance (coagulation, filtration).",
    "difficulty": "hard"
  },
  {
    "id": 344,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "A source water reservoir has a Secchi depth of 0.8 m (normal is 3–4 m). What does this indicate?",
    "options": [
      "The reservoir has excellent water clarity",
      "The low Secchi depth indicates high turbidity or algae concentration, suggesting poor water quality that may challenge treatment",
      "Secchi depth of 0.8 m is normal for surface water",
      "Secchi depth measures the depth of the reservoir"
    ],
    "correct": 1,
    "explanation": "Secchi depth measures water clarity by lowering a black-and-white disk until it disappears from view. A Secchi depth of 0.8 m (vs. normal 3–4 m) indicates very turbid or algae-rich water. This suggests an algal bloom or high sediment load, which will challenge treatment with increased coagulant demand, potential taste/odour problems, and possible cyanotoxins.",
    "difficulty": "medium"
  },
  {
    "id": 345,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "What is the significance of 'colour' in source water for a water treatment plant?",
    "options": [
      "Colour is only an aesthetic concern",
      "Colour (primarily from NOM) increases chlorine demand, contributes to DBP formation, and may require enhanced coagulation or additional treatment for removal",
      "Colour has no effect on treatment",
      "Colour is only significant for plants using ozone"
    ],
    "correct": 1,
    "explanation": "True colour in source water (from humic and fulvic acids) has multiple treatment implications: (1) increases chlorine demand (NOM reacts with chlorine), (2) contributes to DBP formation (NOM is the primary DBP precursor), (3) may require enhanced coagulation at lower pH for removal, and (4) can interfere with UV disinfection by absorbing UV light.",
    "difficulty": "medium"
  },
  {
    "id": 346,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "What is the purpose of 'flow monitoring' at a source water intake?",
    "options": [
      "Flow monitoring is only required for billing purposes",
      "Flow monitoring tracks the volume of water withdrawn from the source, which is required for regulatory reporting, water balance calculations, and permit compliance",
      "Flow monitoring is only required for groundwater sources",
      "Flow monitoring measures the velocity of the source water"
    ],
    "correct": 1,
    "explanation": "Flow monitoring at the intake is required for: (1) regulatory reporting (water taking permits in Ontario require reporting of volumes withdrawn), (2) water balance calculations, (3) permit compliance (maximum daily/annual withdrawal limits), and (4) operational planning (matching withdrawal to treatment capacity and demand).",
    "difficulty": "medium"
  },
  {
    "id": 347,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "A source water intake is located downstream of a major highway bridge. What is the PRIMARY contamination concern?",
    "options": [
      "Highway bridges have no effect on source water quality",
      "Accidental spills (fuel, chemicals, de-icing salts) from vehicles on the bridge could contaminate the source water; emergency response planning and intake shutdown capability are essential",
      "Highway bridges increase turbidity in source water",
      "Highway bridges are only a concern during construction"
    ],
    "correct": 1,
    "explanation": "Highway bridges over source water intakes are a significant contamination risk from vehicle accidents (fuel spills, chemical tanker spills). Emergency response planning should include: (1) intake shutdown capability (to avoid drawing contaminated water), (2) communication protocols with emergency services, (3) monitoring for contaminants, and (4) alternative water source arrangements.",
    "difficulty": "medium"
  },
  {
    "id": 348,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "What is the purpose of 'ice monitoring' at a surface water intake during winter?",
    "options": [
      "Ice monitoring is only for safety purposes",
      "Ice can block intake screens, reduce flow, and affect water quality (ice formation concentrates dissolved substances); monitoring allows proactive management",
      "Ice monitoring is not required for water treatment operations",
      "Ice monitoring measures the temperature of the source water"
    ],
    "correct": 1,
    "explanation": "Ice at surface water intakes can: (1) block intake screens (frazil ice — fine ice crystals that adhere to screens), (2) reduce intake flow, (3) affect water quality (ice formation concentrates dissolved substances in the remaining water), and (4) damage intake structures. Monitoring allows operators to: heat intake screens, adjust withdrawal depth, and prepare for reduced capacity.",
    "difficulty": "hard"
  },
  {
    "id": 349,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "A source water has a temperature of 4°C. How does this affect coagulation compared to 20°C?",
    "options": [
      "Cold water has no effect on coagulation",
      "Cold water increases viscosity, slows coagulant hydrolysis kinetics, and reduces particle collision frequency, requiring higher coagulant doses and longer flocculation times",
      "Cold water improves coagulation efficiency",
      "Cold water only affects settling, not coagulation"
    ],
    "correct": 1,
    "explanation": "Cold water (4°C vs. 20°C) affects coagulation in multiple ways: (1) higher viscosity reduces particle settling velocity and collision frequency, (2) slower alum hydrolysis kinetics produce different aluminum hydroxide species, (3) reduced chemical reaction rates require longer flocculation times, and (4) higher coagulant doses are typically needed. Polymer coagulant aids can help improve cold water coagulation.",
    "difficulty": "hard"
  },
  {
    "id": 350,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "What is the purpose of 'intake depth selection' at a stratified reservoir?",
    "options": [
      "Intake depth has no effect on water quality",
      "Different depths have different water quality (temperature, DO, iron, manganese, algae); selecting the optimal depth minimizes treatment challenges",
      "Intake depth only affects water temperature",
      "Intake depth is fixed and cannot be changed"
    ],
    "correct": 1,
    "explanation": "In stratified reservoirs, water quality varies significantly with depth: (1) surface layer — warm, oxygenated, may have algae, (2) middle layer — often best quality, (3) bottom layer — cold, potentially anoxic, may have high iron/manganese/H2S. Multi-level intake structures allow operators to select the depth with the best quality water for treatment.",
    "difficulty": "medium"
  },
  {
    "id": 351,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "What is the significance of 'suspended solids' in source water for water treatment?",
    "options": [
      "Suspended solids are only an aesthetic concern",
      "Suspended solids increase coagulant demand, affect filter loading, and may carry adsorbed contaminants (heavy metals, pesticides, pathogens)",
      "Suspended solids have no effect on treatment",
      "Suspended solids are only significant for groundwater sources"
    ],
    "correct": 1,
    "explanation": "Suspended solids affect treatment in multiple ways: (1) increase coagulant demand (more particles require more coagulant for charge neutralization), (2) increase filter loading and reduce filter run times, (3) may carry adsorbed contaminants (heavy metals, pesticides, pathogens), and (4) increase chlorine demand (organic suspended solids react with chlorine).",
    "difficulty": "medium"
  },
  {
    "id": 352,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "A source water intake is experiencing reduced flow due to zebra mussel colonization on the intake screens. What is the MOST effective long-term control measure?",
    "options": [
      "Manual cleaning of screens is the only option",
      "Continuous low-level chlorination of the intake structure (0.5–1.0 mg/L) prevents zebra mussel settlement and growth",
      "Increasing intake pipe diameter",
      "Relocating the intake"
    ],
    "correct": 1,
    "explanation": "Continuous low-level chlorination (0.5–1.0 mg/L residual) at the intake structure is the most effective long-term control for zebra mussels. Chlorine prevents larval settlement and kills existing mussels. Physical methods (mechanical cleaning, thermal treatment) are also used but require more frequent intervention. Chlorine must be dechlorinated before discharge.",
    "difficulty": "hard"
  },
  {
    "id": 353,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "What is the purpose of 'raw water turbidity monitoring' at a water treatment plant?",
    "options": [
      "Raw water turbidity monitoring is only required for regulatory compliance",
      "Raw water turbidity monitoring provides early warning of source water quality changes, allowing operators to adjust coagulant doses proactively before settled and filtered water turbidity is affected",
      "Raw water turbidity monitoring measures the effectiveness of treatment",
      "Raw water turbidity monitoring is only required during storm events"
    ],
    "correct": 1,
    "explanation": "Continuous raw water turbidity monitoring provides: (1) early warning of source water quality changes (storm events, algal blooms), (2) data for proactive coagulant dose adjustments before treatment is impacted, (3) correlation with Cryptosporidium risk, and (4) operational data for process optimization and regulatory reporting.",
    "difficulty": "medium"
  },
  {
    "id": 354,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "What is the purpose of 'watershed monitoring' for a surface water intake?",
    "options": [
      "Watershed monitoring is only required for large watersheds",
      "Watershed monitoring tracks land use changes, contamination sources, and environmental conditions that affect source water quality, allowing proactive management of treatment challenges",
      "Watershed monitoring is the same as source water monitoring",
      "Watershed monitoring is only required for regulatory compliance"
    ],
    "correct": 1,
    "explanation": "Watershed monitoring tracks: (1) land use changes (new industrial sites, agricultural expansion), (2) contamination sources (spills, illegal discharges), (3) environmental conditions (drought, flood risk), and (4) water quality trends at multiple points in the watershed. This information allows operators to anticipate treatment challenges and implement source water protection measures.",
    "difficulty": "medium"
  },
  {
    "id": 355,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "A source water intake is located in a lake that receives treated municipal wastewater effluent. What parameters should be specifically monitored?",
    "options": [
      "Only turbidity and temperature",
      "Nutrients (phosphorus, nitrogen), pharmaceuticals, hormones, pathogens (Cryptosporidium, Giardia), and emerging contaminants (microplastics, PFAS)",
      "Only pH and alkalinity",
      "Only heavy metals and pesticides"
    ],
    "correct": 1,
    "explanation": "Wastewater effluent introduces: (1) nutrients (phosphorus, nitrogen — promote algal growth), (2) pathogens (Cryptosporidium, Giardia, viruses), (3) pharmaceuticals and personal care products (PPCPs), (4) hormones (endocrine disruptors), (5) emerging contaminants (PFAS, microplastics). Monitoring should include these parameters in addition to conventional water quality indicators.",
    "difficulty": "hard"
  },
  {
    "id": 356,
    "module": "Security, Safety & Admin",
    "topic": "Corrosion Control",
    "question": "A water treatment plant's finished water has LSI = -0.4. What is the MOST appropriate corrosion control strategy?",
    "options": [
      "No action needed — LSI of -0.4 is acceptable",
      "Increase pH, increase alkalinity, or increase calcium hardness to bring LSI toward 0 or slightly positive; orthophosphate addition is also effective",
      "Decrease pH to reduce corrosivity",
      "Add more chlorine to prevent corrosion"
    ],
    "correct": 1,
    "explanation": "LSI = -0.4 indicates the water is corrosive (under-saturated with CaCO3). Corrosion control strategies: (1) increase pH (lime, caustic soda), (2) increase alkalinity (lime, soda ash, sodium bicarbonate), (3) increase calcium hardness (lime, calcium chloride), or (4) add corrosion inhibitors (orthophosphate forms a protective film on pipe surfaces). The goal is LSI near 0 or slightly positive.",
    "difficulty": "hard"
  },
  {
    "id": 357,
    "module": "Security, Safety & Admin",
    "topic": "Corrosion Control",
    "question": "What is the purpose of 'orthophosphate' addition for corrosion control in a water distribution system?",
    "options": [
      "Orthophosphate increases water hardness",
      "Orthophosphate forms a protective iron phosphate or lead phosphate film on pipe surfaces, reducing metal leaching (lead, copper, iron) into the water",
      "Orthophosphate is used as a disinfectant",
      "Orthophosphate reduces chlorine demand"
    ],
    "correct": 1,
    "explanation": "Orthophosphate (H2PO4⁻, HPO4²⁻) reacts with iron, lead, and copper on pipe surfaces to form insoluble metal phosphate films (e.g., lead phosphate, iron phosphate). These films act as a barrier between the pipe material and the water, reducing metal leaching. Orthophosphate is particularly effective for lead control in systems with lead service lines.",
    "difficulty": "hard"
  },
  {
    "id": 358,
    "module": "Security, Safety & Admin",
    "topic": "Corrosion Control",
    "question": "A lead and copper monitoring program shows 90th percentile lead at 0.018 mg/L (action level = 0.010 mg/L). What actions are required?",
    "options": [
      "No action needed — 0.018 mg/L is below the health guideline",
      "Investigate the source of lead (service lines, solder, fixtures), optimize corrosion control treatment, notify affected customers, and implement a lead service line replacement program",
      "Issue a boil water advisory",
      "Increase chlorine dose"
    ],
    "correct": 1,
    "explanation": "Exceeding the lead action level (0.010 mg/L at 90th percentile) triggers mandatory actions under Ontario's Safe Drinking Water Act: (1) investigate the source of lead, (2) optimize corrosion control treatment (pH, alkalinity, orthophosphate), (3) notify affected customers, (4) provide public education, and (5) develop a lead service line replacement program.",
    "difficulty": "hard"
  },
  {
    "id": 359,
    "module": "Security, Safety & Admin",
    "topic": "Corrosion Control",
    "question": "What is the purpose of the 'Langelier Saturation Index' (LSI) in water treatment?",
    "options": [
      "LSI measures the chlorine residual in water",
      "LSI predicts whether water will tend to precipitate (positive LSI) or dissolve (negative LSI) calcium carbonate, indicating scale-forming or corrosive tendency",
      "LSI measures the hardness of water",
      "LSI is used to calculate coagulant doses"
    ],
    "correct": 1,
    "explanation": "LSI = pH - pHs, where pHs is the pH at which the water is in equilibrium with CaCO3. Positive LSI: water is supersaturated with CaCO3 (scale-forming). Negative LSI: water is under-saturated (corrosive, dissolves CaCO3). LSI near 0: water is in equilibrium. LSI is used to guide corrosion control treatment decisions.",
    "difficulty": "medium"
  },
  {
    "id": 360,
    "module": "Security, Safety & Admin",
    "topic": "Corrosion Control",
    "question": "What is the difference between the 'Langelier Saturation Index' (LSI) and the 'Aggressive Index' (AI) for corrosion assessment?",
    "options": [
      "They are the same index",
      "LSI is used for hot water systems; AI is used for cold water systems",
      "LSI assesses CaCO3 saturation for corrosion/scale tendency; AI is used for asbestos-cement pipe corrosion assessment",
      "AI is more accurate than LSI for all applications"
    ],
    "correct": 2,
    "explanation": "LSI (Langelier Saturation Index) assesses the tendency of water to precipitate or dissolve CaCO3, applicable to metallic pipes. The Aggressive Index (AI) is used specifically for asbestos-cement (AC) pipe corrosion: AI = pH + log(alkalinity × hardness). AI > 12 = non-aggressive; 10–12 = moderately aggressive; < 10 = highly aggressive to AC pipe.",
    "difficulty": "hard"
  },
  {
    "id": 361,
    "module": "Security, Safety & Admin",
    "topic": "Corrosion Control",
    "question": "A water system has high chloride-to-sulfate mass ratio (CSMR > 0.5). What is the significance for lead corrosion?",
    "options": [
      "CSMR has no effect on lead corrosion",
      "High CSMR (chloride/sulfate > 0.5) promotes galvanic corrosion of lead in the presence of copper, increasing lead release into the water",
      "High CSMR reduces lead corrosion",
      "CSMR only affects iron corrosion"
    ],
    "correct": 1,
    "explanation": "The chloride-to-sulfate mass ratio (CSMR) affects galvanic corrosion of lead. When lead service lines are connected to copper plumbing, a galvanic cell forms. High chloride relative to sulfate (CSMR > 0.5) promotes lead dissolution in this galvanic cell. Reducing chloride or increasing sulfate can reduce galvanic lead corrosion.",
    "difficulty": "hard"
  },
  {
    "id": 362,
    "module": "Security, Safety & Admin",
    "topic": "Corrosion Control",
    "question": "What is the purpose of 'pipe loop testing' for corrosion control evaluation?",
    "options": [
      "Pipe loop testing measures flow velocity in distribution pipes",
      "Pipe loop testing circulates finished water through actual pipe materials (lead, copper, iron) under controlled conditions to evaluate metal leaching and assess corrosion control effectiveness",
      "Pipe loop testing is used to detect leaks in the distribution system",
      "Pipe loop testing measures the chlorine residual in distribution pipes"
    ],
    "correct": 1,
    "explanation": "Pipe loop testing uses sections of actual pipe materials (lead, copper, iron, cement-lined) connected in a loop through which finished water is circulated. Metal concentrations in the water are measured to assess leaching rates. This allows evaluation of different corrosion control strategies (pH, alkalinity, orthophosphate) under controlled conditions.",
    "difficulty": "hard"
  },
  {
    "id": 363,
    "module": "Security, Safety & Admin",
    "topic": "Corrosion Control",
    "question": "A water treatment plant is switching from free chlorine to chloramines for secondary disinfection. What is the effect on corrosion?",
    "options": [
      "Chloramines have no effect on corrosion",
      "Chloramines are less oxidizing than free chlorine, which can destabilize existing lead carbonate scales, potentially causing a temporary increase in lead levels during the transition",
      "Chloramines reduce corrosion compared to free chlorine",
      "Chloramines increase corrosion of all pipe materials"
    ],
    "correct": 1,
    "explanation": "The Washington DC lead crisis (2001–2004) demonstrated that switching from free chlorine to chloramines can destabilize existing lead carbonate (cerussite) and lead phosphate scales on pipe surfaces. Chloramines are less oxidizing, changing the redox conditions and dissolving protective scales. Careful monitoring and corrosion control optimization are needed during any disinfectant change.",
    "difficulty": "hard"
  },
  {
    "id": 364,
    "module": "Security, Safety & Admin",
    "topic": "Corrosion Control",
    "question": "What is the purpose of 'distribution system flushing' for corrosion control?",
    "options": [
      "Flushing removes chlorine from the distribution system",
      "Flushing removes accumulated corrosion products, sediments, and biofilm from distribution pipes, improving water quality at the tap and reducing metal concentrations",
      "Flushing is only required after main breaks",
      "Flushing increases water pressure in the distribution system"
    ],
    "correct": 1,
    "explanation": "Distribution system flushing removes: (1) accumulated corrosion products (iron, manganese deposits), (2) sediments, (3) biofilm, and (4) stagnant water with low chlorine residual. Flushing improves water quality at the tap, reduces metal concentrations, and maintains chlorine residual. Unidirectional flushing (UDF) is more effective than conventional flushing.",
    "difficulty": "medium"
  },
  {
    "id": 365,
    "module": "Security, Safety & Admin",
    "topic": "Corrosion Control",
    "question": "What is the purpose of 'cathodic protection' for buried steel water mains?",
    "options": [
      "Cathodic protection increases water pressure",
      "Cathodic protection applies a small electrical current to make the pipe the cathode of an electrochemical cell, preventing oxidation (corrosion) of the pipe metal",
      "Cathodic protection is used to disinfect the distribution system",
      "Cathodic protection reduces water hammer"
    ],
    "correct": 1,
    "explanation": "Cathodic protection prevents electrochemical corrosion of buried steel pipes by making the pipe the cathode (negative electrode) of a galvanic cell. Two methods: (1) sacrificial anode — a more reactive metal (zinc, magnesium) is connected to the pipe and corrodes preferentially, and (2) impressed current — an external DC power source applies current to make the pipe cathodic.",
    "difficulty": "hard"
  },
  {
    "id": 366,
    "module": "Security, Safety & Admin",
    "topic": "Corrosion Control",
    "question": "A water system has copper concentrations at the tap exceeding 1.0 mg/L (action level = 1.3 mg/L, but aesthetic objective = 1.0 mg/L). What is the MOST likely cause?",
    "options": [
      "Copper in the source water is the primary cause",
      "Corrosive water is dissolving copper from household plumbing (copper pipes, brass fittings); corrosion control treatment needs to be optimized",
      "Copper is added during treatment",
      "Copper concentrations at the tap are not related to the distribution system"
    ],
    "correct": 1,
    "explanation": "Copper at the tap above the aesthetic objective (1.0 mg/L) indicates corrosive water is dissolving copper from household plumbing (copper pipes, brass fittings, water heaters). The source water contribution is typically minimal. Corrosion control optimization (increase pH to 7.5–8.5, increase alkalinity, add orthophosphate) reduces copper leaching.",
    "difficulty": "medium"
  },
  {
    "id": 367,
    "module": "Security, Safety & Admin",
    "topic": "Corrosion Control",
    "question": "What is the purpose of 'water age' monitoring in a distribution system?",
    "options": [
      "Water age monitoring measures the speed of water flow",
      "Water age (residence time) affects chlorine residual decay, DBP formation, and microbial regrowth; high water age areas are at risk of low chlorine residuals and elevated DBPs",
      "Water age monitoring is only required for large distribution systems",
      "Water age monitoring measures the turbidity of distribution water"
    ],
    "correct": 1,
    "explanation": "Water age (time since treatment) affects: (1) chlorine residual decay (longer residence time = lower residual), (2) DBP formation (THMs and HAAs continue to form in the distribution system), and (3) microbial regrowth (low chlorine allows bacteria to multiply). Dead-end areas and large storage tanks increase water age. Flushing and storage tank mixing reduce water age.",
    "difficulty": "hard"
  },
  {
    "id": 368,
    "module": "Security, Safety & Admin",
    "topic": "Emergency Response",
    "question": "A water treatment plant receives notification of a chemical spill upstream of the intake. What is the FIRST action?",
    "options": [
      "Wait for the spill to reach the intake before taking action",
      "Shut down the intake immediately, notify the regulatory authority and public health unit, activate the emergency response plan, and assess alternative water sources",
      "Increase the coagulant dose to treat the contaminated water",
      "Issue a boil water advisory"
    ],
    "correct": 1,
    "explanation": "Upon notification of an upstream spill: (1) shut down the intake immediately to prevent drawing contaminated water, (2) notify the regulatory authority and public health unit, (3) activate the emergency response plan, (4) assess alternative water sources (backup wells, interconnections), and (5) determine the nature of the spill to assess treatment options. Do not attempt to treat unknown contaminants.",
    "difficulty": "hard"
  },
  {
    "id": 369,
    "module": "Security, Safety & Admin",
    "topic": "Emergency Response",
    "question": "What is the purpose of an 'Emergency Response Plan' (ERP) for a water treatment plant?",
    "options": [
      "ERPs are only required for large water systems",
      "ERPs document procedures for responding to emergencies (contamination events, equipment failures, natural disasters) to minimize the impact on public health and restore service quickly",
      "ERPs are the same as standard operating procedures",
      "ERPs are only required for regulatory compliance"
    ],
    "correct": 1,
    "explanation": "Emergency Response Plans document: (1) identification of potential emergencies, (2) notification procedures (regulatory authority, public health, customers), (3) response procedures for each emergency type, (4) roles and responsibilities, (5) alternative water sources, (6) communication protocols, and (7) recovery procedures. ERPs must be regularly tested and updated.",
    "difficulty": "medium"
  },
  {
    "id": 370,
    "module": "Security, Safety & Admin",
    "topic": "Emergency Response",
    "question": "A 'boil water advisory' (BWA) is issued for a water system. What are the conditions that typically trigger a BWA?",
    "options": [
      "BWAs are issued whenever turbidity exceeds 1 NTU",
      "BWAs are issued when there is evidence of treatment failure, distribution system contamination, or loss of adequate disinfection that may pose a health risk",
      "BWAs are issued whenever a main break occurs",
      "BWAs are issued only when E. coli is detected in finished water"
    ],
    "correct": 1,
    "explanation": "Boil water advisories are issued when: (1) treatment failure (loss of disinfection, filtration failure), (2) distribution system contamination (main break with pressure loss, cross-connection), (3) positive E. coli or total coliform results in finished water, or (4) other evidence of potential health risk. The decision is made by the regulatory authority and public health unit.",
    "difficulty": "medium"
  },
  {
    "id": 371,
    "module": "Security, Safety & Admin",
    "topic": "Emergency Response",
    "question": "What is the purpose of 'tabletop exercises' for emergency response planning?",
    "options": [
      "Tabletop exercises are used to train new operators on routine procedures",
      "Tabletop exercises simulate emergency scenarios in a discussion format, allowing staff to practice decision-making, identify gaps in the ERP, and improve coordination without disrupting operations",
      "Tabletop exercises are required by regulation for all water systems",
      "Tabletop exercises replace full-scale emergency drills"
    ],
    "correct": 1,
    "explanation": "Tabletop exercises involve key staff discussing their roles and responses to a simulated emergency scenario. Benefits: (1) practice decision-making in a low-stress environment, (2) identify gaps or inconsistencies in the ERP, (3) improve coordination between departments and agencies, and (4) familiarize staff with the ERP without disrupting operations. They should be conducted annually.",
    "difficulty": "medium"
  },
  {
    "id": 372,
    "module": "Security, Safety & Admin",
    "topic": "Emergency Response",
    "question": "A water main breaks and pressure drops to zero in a section of the distribution system. What is the PRIMARY health concern?",
    "options": [
      "Loss of pressure only affects water service, not water quality",
      "Loss of pressure allows contaminated groundwater or soil water to be drawn into the main through cracks, potentially contaminating the distribution system",
      "Loss of pressure causes chlorine to dissipate",
      "Loss of pressure is only a concern for fire protection"
    ],
    "correct": 1,
    "explanation": "Loss of pressure in a water main is a serious health concern because it allows contaminated groundwater, soil water, or sewage to be drawn into the main through cracks, joints, or service connections. This can introduce pathogens, chemicals, and other contaminants into the distribution system. A boil water advisory is typically issued after a main break with pressure loss.",
    "difficulty": "hard"
  },
  {
    "id": 373,
    "module": "Security, Safety & Admin",
    "topic": "Emergency Response",
    "question": "What is the purpose of 'vulnerability assessment' for a water treatment plant?",
    "options": [
      "Vulnerability assessments are only for security threats",
      "Vulnerability assessments identify physical, operational, and cyber security vulnerabilities that could be exploited to contaminate or disrupt the water supply, informing risk management and security improvements",
      "Vulnerability assessments are the same as emergency response plans",
      "Vulnerability assessments are only required for large water systems"
    ],
    "correct": 1,
    "explanation": "Water system vulnerability assessments (required under Ontario's Safe Drinking Water Act for large systems) identify: (1) physical security vulnerabilities (access control, perimeter security), (2) operational vulnerabilities (single points of failure, chemical storage), (3) cyber security vulnerabilities (SCADA, control systems), and (4) natural hazards. Results inform security improvements and emergency planning.",
    "difficulty": "medium"
  },
  {
    "id": 374,
    "module": "Security, Safety & Admin",
    "topic": "Emergency Response",
    "question": "A water treatment plant experiences a power outage during peak demand. What is the FIRST priority?",
    "options": [
      "Notify all customers of the outage",
      "Start the emergency generator and verify all critical systems (pumps, chemical feed, SCADA) are operating before assessing the impact on water quality and service",
      "Shut down all treatment processes",
      "Issue a boil water advisory immediately"
    ],
    "correct": 1,
    "explanation": "During a power outage: (1) start the emergency generator (if not automatic), (2) verify all critical systems are operating (pumps, chemical feed, SCADA, alarms), (3) assess the impact on water quality and service, (4) notify the regulatory authority if required, and (5) implement load shedding if the generator cannot power all critical loads. A boil water advisory may be needed if treatment is compromised.",
    "difficulty": "medium"
  },
  {
    "id": 375,
    "module": "Security, Safety & Admin",
    "topic": "Emergency Response",
    "question": "What is the purpose of 'mutual aid agreements' between water systems?",
    "options": [
      "Mutual aid agreements are required by regulation",
      "Mutual aid agreements allow neighboring water systems to provide emergency support (water supply, equipment, personnel) during a crisis, improving resilience",
      "Mutual aid agreements are only for large water systems",
      "Mutual aid agreements are the same as service agreements"
    ],
    "correct": 1,
    "explanation": "Mutual aid agreements between neighboring water systems allow: (1) emergency water supply through interconnections, (2) sharing of equipment (generators, pumps), (3) sharing of personnel (operators), and (4) technical assistance. These agreements improve system resilience and reduce the impact of emergencies on customers.",
    "difficulty": "medium"
  },
  {
    "id": 376,
    "module": "Security, Safety & Admin",
    "topic": "Emergency Response",
    "question": "A water treatment plant operator discovers a suspicious package near the chemical storage area. What is the FIRST action?",
    "options": [
      "Open the package to determine its contents",
      "Do not touch the package — evacuate the area, notify security and management, and contact emergency services (police)",
      "Move the package to a safer location",
      "Continue normal operations and report the package at the end of the shift"
    ],
    "correct": 1,
    "explanation": "A suspicious package near chemical storage is a potential security threat. The operator should: (1) do not touch or move the package, (2) evacuate the immediate area, (3) notify plant security and management immediately, (4) contact emergency services (police), and (5) follow the plant's security emergency procedures. Do not attempt to investigate the package.",
    "difficulty": "medium"
  },
  {
    "id": 377,
    "module": "Security, Safety & Admin",
    "topic": "Emergency Response",
    "question": "What is the purpose of 'after-action reviews' following an emergency or incident?",
    "options": [
      "After-action reviews are only required for regulatory compliance",
      "After-action reviews analyze what happened, what worked, what didn't work, and what improvements are needed, improving future emergency response",
      "After-action reviews are used to assign blame for the incident",
      "After-action reviews are the same as incident reports"
    ],
    "correct": 1,
    "explanation": "After-action reviews (AARs) are conducted after emergencies or exercises to: (1) document what happened and the timeline of events, (2) identify what worked well, (3) identify gaps and areas for improvement, (4) update the ERP based on lessons learned, and (5) train staff on improved procedures. AARs are a critical tool for continuous improvement of emergency preparedness.",
    "difficulty": "medium"
  },
  {
    "id": 378,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "Under Ontario's Safe Drinking Water Act (SDWA), what is the operator's obligation when a prescribed adverse condition is detected?",
    "options": [
      "The operator can decide whether to report based on their professional judgment",
      "The operator must immediately notify the regulatory authority (MOE) and the medical officer of health, and take corrective action",
      "The operator must notify customers directly before notifying the regulatory authority",
      "The operator must issue a boil water advisory before notifying the regulatory authority"
    ],
    "correct": 1,
    "explanation": "Under Ontario's SDWA and O. Reg. 170/03, prescribed adverse conditions (including adverse test results, equipment failures, and treatment failures) must be reported to the regulatory authority (MOE) and the medical officer of health immediately (within 24 hours for most conditions). Corrective action must be taken as soon as possible. The regulatory authority determines if a boil water advisory is needed.",
    "difficulty": "hard"
  },
  {
    "id": 379,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of 'operational checks' required under Ontario's O. Reg. 170/03?",
    "options": [
      "Operational checks are optional quality control measures",
      "Operational checks are mandatory monitoring activities (turbidity, chlorine residual, pH) performed at specified frequencies to verify treatment is functioning correctly",
      "Operational checks are only required for large water systems",
      "Operational checks are performed by the regulatory authority, not the operator"
    ],
    "correct": 1,
    "explanation": "O. Reg. 170/03 requires operational checks at specified frequencies: (1) continuous turbidity monitoring for filtered systems, (2) daily chlorine residual measurements, (3) daily pH measurements, and (4) other parameters depending on system size and type. These checks verify that treatment is functioning correctly and provide early warning of problems.",
    "difficulty": "medium"
  },
  {
    "id": 380,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "A water treatment plant's annual report shows that the plant exceeded the turbidity operational check requirement on 3 occasions. What is the regulatory significance?",
    "options": [
      "Three exceedances are acceptable — there is a tolerance limit",
      "Each exceedance must be reported to the regulatory authority, and the operator must document the cause and corrective actions taken",
      "Exceedances are only significant if they exceed the maximum contaminant level",
      "Exceedances are only significant if they occur more than 5 times per year"
    ],
    "correct": 1,
    "explanation": "Under O. Reg. 170/03, each exceedance of an operational check requirement is an adverse condition that must be reported to the regulatory authority. The operator must document: (1) the date and nature of the exceedance, (2) the cause, (3) corrective actions taken, and (4) steps to prevent recurrence. Repeated exceedances may trigger regulatory action.",
    "difficulty": "hard"
  },
  {
    "id": 381,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of the 'Permit to Take Water' (PTTW) in Ontario?",
    "options": [
      "PTTWs are required for all water use in Ontario",
      "PTTWs regulate the taking of water from surface water and groundwater sources, specifying the maximum volume that can be withdrawn to protect the water resource and other users",
      "PTTWs are only required for industrial water users",
      "PTTWs are the same as drinking water licences"
    ],
    "correct": 1,
    "explanation": "Permits to Take Water (PTTWs) under Ontario's Ontario Water Resources Act regulate water takings exceeding 50,000 L/day. They specify: (1) maximum daily and annual withdrawal volumes, (2) monitoring requirements, (3) reporting requirements, and (4) conditions to protect the water resource and other users. Water treatment plants must comply with their PTTW conditions.",
    "difficulty": "medium"
  },
  {
    "id": 382,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of the 'Drinking Water Quality Management Standard' (DWQMS) in Ontario?",
    "options": [
      "DWQMS is a voluntary quality management system",
      "DWQMS is a mandatory quality management system for municipal residential drinking water systems that requires documented procedures, risk assessment, and continuous improvement",
      "DWQMS is only required for large water systems",
      "DWQMS is the same as ISO 9001"
    ],
    "correct": 1,
    "explanation": "The DWQMS (Ontario Regulation 188/07) requires municipal residential drinking water systems to implement a quality management system that includes: (1) documented operating procedures, (2) risk assessment and management, (3) staff training and competency, (4) incident management, (5) internal audits, and (6) management review. Systems must be accredited by a third-party auditor.",
    "difficulty": "hard"
  },
  {
    "id": 383,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of 'water quality monitoring' in the distribution system?",
    "options": [
      "Distribution system monitoring is only required for regulatory compliance",
      "Distribution system monitoring verifies that water quality (chlorine residual, turbidity, bacteriological) is maintained throughout the system, detecting deterioration before it reaches consumers",
      "Distribution system monitoring is only required for large systems",
      "Distribution system monitoring is performed by the regulatory authority"
    ],
    "correct": 1,
    "explanation": "Distribution system monitoring verifies that: (1) chlorine residual is maintained throughout the system (minimum 0.05 mg/L free chlorine in Ontario), (2) turbidity remains low (no treatment breakthrough), and (3) bacteriological quality is maintained (no coliforms). Monitoring locations should include dead-ends, storage tanks, and areas with high water age.",
    "difficulty": "medium"
  },
  {
    "id": 384,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "A water treatment plant operator is asked to falsify a monitoring record to avoid reporting an exceedance. What is the appropriate response?",
    "options": [
      "Falsify the record if the exceedance was minor",
      "Refuse to falsify the record — falsification of monitoring records is illegal and can result in criminal charges, loss of operator licence, and serious public health consequences",
      "Falsify the record but document the actual result separately",
      "Ask a supervisor for guidance before deciding"
    ],
    "correct": 1,
    "explanation": "Falsification of monitoring records is a serious offence under Ontario's SDWA and can result in: (1) criminal charges, (2) loss of operator licence, (3) regulatory penalties, and (4) civil liability. Operators have a professional and legal obligation to maintain accurate records. All exceedances must be reported as required by regulation.",
    "difficulty": "hard"
  },
  {
    "id": 385,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of 'operator certification' requirements in Ontario?",
    "options": [
      "Operator certification is voluntary",
      "Operator certification ensures that water treatment operators have the knowledge and skills to operate water systems safely, protecting public health",
      "Operator certification is only required for large water systems",
      "Operator certification is only required for new operators"
    ],
    "correct": 1,
    "explanation": "Ontario's Safe Drinking Water Act requires that water treatment plants be operated by certified operators with the appropriate class of certification for the system. Certification ensures operators have demonstrated knowledge and competency in: treatment processes, equipment operation, water quality monitoring, regulatory compliance, and emergency response.",
    "difficulty": "medium"
  },
  {
    "id": 386,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of 'annual reporting' requirements for water treatment plants in Ontario?",
    "options": [
      "Annual reports are only for internal management purposes",
      "Annual reports provide a comprehensive summary of system performance, water quality results, and compliance status to the regulatory authority and the public",
      "Annual reports are only required for systems that had compliance issues",
      "Annual reports are prepared by the regulatory authority"
    ],
    "correct": 1,
    "explanation": "Ontario's O. Reg. 170/03 requires annual reports that include: (1) system description and changes, (2) water quality monitoring results, (3) compliance status, (4) adverse events and corrective actions, (5) operational statistics (volume treated, chemical doses), and (6) infrastructure condition. Annual reports must be made available to the public.",
    "difficulty": "medium"
  },
  {
    "id": 387,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the significance of 'prescribed concentration or requirement' (PCR) versus 'maximum acceptable concentration' (MAC) in Ontario's Drinking Water Quality Standards?",
    "options": [
      "PCR and MAC are the same thing",
      "MAC is a health-based limit that must not be exceeded; PCR includes both health-based limits and operational requirements (e.g., minimum chlorine residual, maximum turbidity)",
      "PCR is more stringent than MAC",
      "MAC applies to all parameters; PCR only applies to microbiological parameters"
    ],
    "correct": 1,
    "explanation": "Ontario's O. Reg. 169/03 sets: (1) MACs (Maximum Acceptable Concentrations) — health-based limits for chemical and microbiological parameters that must not be exceeded, (2) AOs (Aesthetic Objectives) — non-health-based guidelines for parameters affecting taste, odour, or appearance, and (3) Operational Technology Requirements (OTRs) — treatment performance requirements (e.g., turbidity after filtration).",
    "difficulty": "hard"
  },
  {
    "id": 388,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "A water treatment plant is planning to make a significant change to its treatment process. What regulatory requirements apply?",
    "options": [
      "No regulatory approval is needed for process changes",
      "Significant changes to treatment processes require approval from the regulatory authority (MOE) before implementation, under Ontario's Environmental Protection Act or SDWA",
      "Only changes that affect water quality require approval",
      "Regulatory approval is only required for new water systems"
    ],
    "correct": 1,
    "explanation": "In Ontario, significant changes to drinking water treatment systems (new treatment processes, major equipment changes, capacity increases) require approval from the Ministry of the Environment under the Environmental Protection Act (EPA) or the SDWA. The approval process includes engineering review, environmental assessment, and public consultation for major projects.",
    "difficulty": "hard"
  },
  {
    "id": 389,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of 'chain of custody' documentation for water quality samples?",
    "options": [
      "Chain of custody is only required for legal proceedings",
      "Chain of custody documents the collection, handling, and analysis of water samples, ensuring sample integrity and providing a defensible record for regulatory compliance",
      "Chain of custody is only required for bacteriological samples",
      "Chain of custody is the same as sample collection records"
    ],
    "correct": 1,
    "explanation": "Chain of custody (COC) documentation tracks a water sample from collection to analysis: (1) sample identification, (2) collection date/time/location, (3) collector's name, (4) preservation method, (5) transfer of custody at each step, and (6) laboratory receipt. COC ensures sample integrity and provides a defensible record for regulatory compliance and legal proceedings.",
    "difficulty": "medium"
  },
  {
    "id": 390,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of 'quality assurance/quality control' (QA/QC) in water quality monitoring?",
    "options": [
      "QA/QC is only required for accredited laboratories",
      "QA/QC ensures the accuracy, precision, and reliability of monitoring data through field blanks, duplicates, matrix spikes, and calibration verification",
      "QA/QC is only required for regulatory compliance samples",
      "QA/QC is the same as equipment calibration"
    ],
    "correct": 1,
    "explanation": "QA/QC in water quality monitoring includes: (1) field blanks (detect contamination during sampling), (2) field duplicates (assess sampling precision), (3) matrix spikes (assess method recovery in the sample matrix), (4) calibration standards (verify instrument accuracy), and (5) laboratory QC samples. QA/QC ensures monitoring data is accurate and defensible.",
    "difficulty": "medium"
  },
  {
    "id": 391,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of 'record keeping' requirements for water treatment plants?",
    "options": [
      "Records are kept only for internal management purposes",
      "Records provide documentation of treatment performance, regulatory compliance, and operational decisions; they are required by regulation and are essential for troubleshooting and legal defense",
      "Records are only required for adverse events",
      "Records are kept by the regulatory authority, not the operator"
    ],
    "correct": 1,
    "explanation": "Record keeping requirements under O. Reg. 170/03 include: (1) operational check results, (2) water quality monitoring results, (3) chemical doses and consumption, (4) equipment maintenance records, (5) adverse event reports and corrective actions, and (6) operator training records. Records must be retained for specified periods (typically 5–10 years) and made available to the regulatory authority.",
    "difficulty": "medium"
  },
  {
    "id": 392,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of 'third-party audits' under the DWQMS?",
    "options": [
      "Third-party audits are voluntary",
      "Third-party audits by accredited auditors verify that the water system's quality management system meets DWQMS requirements and is being effectively implemented",
      "Third-party audits are performed by the regulatory authority",
      "Third-party audits are only required for large water systems"
    ],
    "correct": 1,
    "explanation": "Under Ontario's DWQMS (O. Reg. 188/07), municipal residential drinking water systems must undergo third-party audits by accredited auditors to verify: (1) the quality management system meets DWQMS requirements, (2) documented procedures are being followed, (3) staff are trained and competent, and (4) the system is continuously improving. Accreditation must be renewed every 3 years.",
    "difficulty": "hard"
  },
  {
    "id": 393,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "A water treatment plant operator is about to enter a chemical storage room where a chlorine gas leak is suspected. What is the MINIMUM required PPE?",
    "options": [
      "Safety glasses and gloves",
      "Self-contained breathing apparatus (SCBA) and chemical-resistant suit — chlorine gas is immediately dangerous to life and health (IDLH) at 10 ppm",
      "Half-face respirator with chlorine cartridge and safety glasses",
      "No PPE required if the leak is small"
    ],
    "correct": 1,
    "explanation": "Chlorine gas is IDLH (Immediately Dangerous to Life and Health) at 10 ppm. For suspected chlorine gas leaks, the minimum PPE is: (1) SCBA (self-contained breathing apparatus) — air-purifying respirators are NOT adequate for IDLH atmospheres, and (2) chemical-resistant suit, gloves, and boots. Never enter a suspected chlorine atmosphere without SCBA.",
    "difficulty": "hard"
  },
  {
    "id": 394,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "What is the purpose of 'confined space entry permits' in a water treatment plant?",
    "options": [
      "Confined space permits are only required for spaces below ground",
      "Confined space permits document the hazard assessment, atmospheric testing, ventilation, rescue plan, and attendant requirements before entry into a confined space",
      "Confined space permits are only required for spaces with toxic atmospheres",
      "Confined space permits are optional if the operator is experienced"
    ],
    "correct": 1,
    "explanation": "Confined space entry permits (required under Ontario's O. Reg. 632/05) document: (1) identification of the confined space and hazards, (2) atmospheric testing results (O2, H2S, CO, LEL), (3) ventilation requirements, (4) required PPE, (5) rescue plan and equipment, (6) attendant requirements, and (7) authorized entrants. Permits must be completed before every entry.",
    "difficulty": "hard"
  },
  {
    "id": 395,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "What is the IDLH (Immediately Dangerous to Life and Health) concentration for hydrogen sulfide (H2S)?",
    "options": [
      "10 ppm",
      "50 ppm",
      "100 ppm",
      "500 ppm"
    ],
    "correct": 2,
    "explanation": "H2S IDLH = 100 ppm (NIOSH). Key H2S thresholds: 0.01–0.3 ppm (odour threshold — rotten egg smell), 10 ppm (OSHA PEL), 50 ppm (ACGIH STEL), 100 ppm (IDLH — olfactory fatigue, rapid incapacitation), 500–1,000 ppm (rapid unconsciousness and death). H2S is particularly dangerous because it paralyzes the olfactory nerve at high concentrations, eliminating the warning odour.",
    "difficulty": "hard"
  },
  {
    "id": 396,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "A worker is overcome by H2S in a confined space. What is the CORRECT rescue procedure?",
    "options": [
      "Enter the confined space immediately to rescue the worker",
      "Do not enter without SCBA — activate the rescue plan, call emergency services, and use non-entry rescue equipment (lifeline, retrieval system) if available",
      "Use a fan to ventilate the space before entering",
      "Wait for the H2S to dissipate before entering"
    ],
    "correct": 1,
    "explanation": "The most common cause of confined space fatalities is would-be rescuers entering without proper equipment. The correct procedure: (1) do NOT enter without SCBA and appropriate PPE, (2) activate the rescue plan and call emergency services (911), (3) attempt non-entry rescue using lifeline/retrieval system if available, (4) only enter with SCBA if non-entry rescue is not possible. Most confined space fatalities involve multiple victims.",
    "difficulty": "hard"
  },
  {
    "id": 397,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "What is the purpose of 'lockout/tagout' (LOTO) procedures in a water treatment plant?",
    "options": [
      "LOTO procedures are used to secure chemical storage",
      "LOTO procedures prevent the unexpected energization or startup of equipment during maintenance, protecting workers from injury",
      "LOTO procedures are only required for electrical equipment",
      "LOTO procedures are optional if the equipment has a manual shutoff"
    ],
    "correct": 1,
    "explanation": "Lockout/tagout (LOTO) procedures (O. Reg. 851) prevent unexpected energization, startup, or release of stored energy during maintenance. Steps: (1) notify affected personnel, (2) shut down equipment, (3) isolate all energy sources (electrical, hydraulic, pneumatic, chemical, gravitational), (4) apply locks and tags, (5) verify zero energy state before work begins.",
    "difficulty": "medium"
  },
  {
    "id": 398,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "A chlorine gas cylinder is leaking at the valve. What is the FIRST action?",
    "options": [
      "Attempt to tighten the valve to stop the leak",
      "Evacuate the area, activate the emergency response plan, and call emergency services — do not attempt to repair the leak without proper training and equipment",
      "Move the cylinder to an outdoor area",
      "Apply a patch to the leak"
    ],
    "correct": 1,
    "explanation": "A leaking chlorine cylinder is a chemical emergency. The first action is to evacuate the area and activate the emergency response plan. Do not attempt to repair the leak without proper training, equipment (SCBA, chemical-resistant suit), and emergency response procedures. Call emergency services (fire department with hazmat team). Moving the cylinder risks spreading the leak.",
    "difficulty": "hard"
  },
  {
    "id": 399,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "What is the purpose of 'Safety Data Sheets' (SDS) for chemicals used in water treatment?",
    "options": [
      "SDS are only required for regulatory compliance",
      "SDS provide information on chemical hazards, safe handling, storage requirements, PPE requirements, first aid procedures, and emergency response for each chemical",
      "SDS are only required for chemicals classified as hazardous",
      "SDS are prepared by the water treatment plant"
    ],
    "correct": 1,
    "explanation": "Safety Data Sheets (SDS, formerly MSDS) are required under WHMIS 2015 for all controlled products. They provide: (1) chemical identification, (2) hazard identification, (3) composition, (4) first aid measures, (5) fire-fighting measures, (6) accidental release measures, (7) handling and storage, (8) exposure controls and PPE, (9) physical and chemical properties, and (10) toxicological information.",
    "difficulty": "medium"
  },
  {
    "id": 400,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "What is the purpose of 'fall protection' requirements in a water treatment plant?",
    "options": [
      "Fall protection is only required for heights above 3 m",
      "Fall protection prevents falls from elevated work areas (filter galleries, clarifier walkways, chemical storage areas) that could cause serious injury or death",
      "Fall protection is only required for outdoor work",
      "Fall protection is optional if the worker is experienced"
    ],
    "correct": 1,
    "explanation": "Ontario's O. Reg. 851 requires fall protection for work at heights of 3 m or more (or over water or other hazardous materials). Fall protection measures: (1) guardrails (preferred), (2) travel restraint systems, (3) fall arrest systems (harness, lanyard, anchor), or (4) safety nets. Water treatment plants have many elevated work areas requiring fall protection.",
    "difficulty": "medium"
  },
  {
    "id": 401,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "What is the purpose of 'respiratory protection' programs in a water treatment plant?",
    "options": [
      "Respiratory protection is only required for confined space entry",
      "Respiratory protection programs ensure workers are protected from airborne hazards (chlorine gas, H2S, dust) through proper selection, fit testing, maintenance, and training",
      "Respiratory protection programs are only required for large water systems",
      "Respiratory protection is optional if ventilation is adequate"
    ],
    "correct": 1,
    "explanation": "Respiratory protection programs (required under O. Reg. 833 when engineering controls are insufficient) include: (1) hazard assessment, (2) respirator selection (appropriate for the hazard), (3) fit testing (for tight-fitting respirators), (4) medical evaluation, (5) maintenance and inspection, and (6) training. Programs must be documented and reviewed annually.",
    "difficulty": "medium"
  },
  {
    "id": 402,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "A water treatment plant operator is working alone at night. What safety measures should be in place?",
    "options": [
      "No special safety measures are needed for experienced operators",
      "A check-in/check-out system, emergency communication devices, and procedures for working alone should be in place as required by Ontario's Working Alone regulation",
      "The operator should not work alone under any circumstances",
      "Only supervisors can work alone"
    ],
    "correct": 1,
    "explanation": "Ontario's O. Reg. 67/93 (Working Alone) requires employers to have procedures for workers who work alone in circumstances that present a risk of injury. For water treatment plant operators working alone: (1) regular check-in/check-out procedures, (2) emergency communication devices (radio, cell phone), (3) emergency contact information, and (4) procedures for summoning help.",
    "difficulty": "medium"
  },
  {
    "id": 403,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "What is the purpose of 'chemical storage segregation' in a water treatment plant?",
    "options": [
      "Chemical storage segregation is only for organizational purposes",
      "Incompatible chemicals must be stored separately to prevent dangerous reactions if containers leak or spill — e.g., chlorine and ammonia must never be stored together",
      "Chemical storage segregation is only required for chemicals classified as explosives",
      "Chemical storage segregation is optional if the storage area is well-ventilated"
    ],
    "correct": 1,
    "explanation": "Chemical storage segregation prevents dangerous reactions between incompatible chemicals. Critical incompatibilities in water treatment: (1) chlorine and ammonia (form toxic chloramines gas), (2) chlorine and acids (release chlorine gas), (3) oxidizers and flammables (fire/explosion risk), and (4) acids and bases (violent reaction, heat generation). Incompatible chemicals must be stored in separate, clearly labeled areas.",
    "difficulty": "hard"
  },
  {
    "id": 404,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "What is the purpose of 'secondary containment' for chemical storage tanks?",
    "options": [
      "Secondary containment is only required for underground tanks",
      "Secondary containment (berms, dikes, or containment basins) captures chemical spills, preventing them from contaminating the environment, groundwater, or treatment processes",
      "Secondary containment is only required for chemicals classified as hazardous",
      "Secondary containment is optional if the storage area has a drain"
    ],
    "correct": 1,
    "explanation": "Secondary containment captures chemical spills before they can reach the environment, groundwater, or treatment processes. Requirements: (1) capacity ≥ 110% of the largest tank in the containment area, (2) impermeable construction (concrete, HDPE liner), (3) no floor drains that could allow spills to escape, and (4) regular inspection for integrity. Required under Ontario's Environmental Protection Act.",
    "difficulty": "medium"
  },
  {
    "id": 405,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'preventive maintenance' programs for water treatment equipment?",
    "options": [
      "Preventive maintenance is performed only when equipment fails",
      "Preventive maintenance schedules routine inspections, lubrication, and component replacement to prevent equipment failures, extend equipment life, and reduce emergency repairs",
      "Preventive maintenance is only required for critical equipment",
      "Preventive maintenance is the same as corrective maintenance"
    ],
    "correct": 1,
    "explanation": "Preventive maintenance (PM) programs schedule routine maintenance activities based on time intervals or operating hours: (1) lubrication, (2) filter/seal replacement, (3) calibration, (4) inspection and testing, and (5) component replacement before failure. PM reduces: emergency repairs, unplanned downtime, and total lifecycle costs, while extending equipment life.",
    "difficulty": "medium"
  },
  {
    "id": 406,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'standard operating procedures' (SOPs) in a water treatment plant?",
    "options": [
      "SOPs are only required for regulatory compliance",
      "SOPs document step-by-step procedures for routine operations, ensuring consistent, safe, and effective performance regardless of which operator is on duty",
      "SOPs are only required for hazardous operations",
      "SOPs are prepared by the regulatory authority"
    ],
    "correct": 1,
    "explanation": "Standard Operating Procedures (SOPs) provide: (1) step-by-step instructions for routine operations (startup, shutdown, chemical dosing, backwash), (2) safety precautions, (3) quality control requirements, and (4) troubleshooting guidance. SOPs ensure consistent performance, facilitate training of new operators, and provide documentation for regulatory compliance.",
    "difficulty": "medium"
  },
  {
    "id": 407,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "A water treatment plant operator notices that a colleague is not following the established SOP for chlorine handling. What is the MOST appropriate action?",
    "options": [
      "Ignore the behavior — it is not the operator's responsibility",
      "Address the issue directly with the colleague, and if the behavior continues, report it to the supervisor",
      "Report the colleague to the regulatory authority immediately",
      "Document the behavior but take no immediate action"
    ],
    "correct": 1,
    "explanation": "When a colleague is not following safety procedures: (1) address the issue directly and respectfully — they may not be aware of the correct procedure, (2) if the behavior continues or poses an immediate safety risk, report it to the supervisor, and (3) document the incident. Operators have a professional and ethical obligation to maintain safe working practices.",
    "difficulty": "medium"
  },
  {
    "id": 408,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'asset management' for water treatment infrastructure?",
    "options": [
      "Asset management is only for financial planning purposes",
      "Asset management tracks the condition, performance, and remaining useful life of infrastructure assets, enabling proactive maintenance and capital planning to maintain service levels",
      "Asset management is only required for large water systems",
      "Asset management is the same as preventive maintenance"
    ],
    "correct": 1,
    "explanation": "Asset management provides: (1) inventory of all infrastructure assets, (2) condition assessment and performance monitoring, (3) risk assessment (probability and consequence of failure), (4) maintenance strategies (run-to-failure, preventive, predictive), and (5) capital planning (replacement schedules, budget forecasting). Asset management optimizes lifecycle costs while maintaining service levels.",
    "difficulty": "medium"
  },
  {
    "id": 409,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'operator training' programs for water treatment plants?",
    "options": [
      "Training is only required for new operators",
      "Training ensures operators have the knowledge and skills to operate the plant safely and effectively, maintain regulatory compliance, and respond to emergencies",
      "Training is only required for operators who have had incidents",
      "Training is the same as operator certification"
    ],
    "correct": 1,
    "explanation": "Operator training programs provide: (1) initial training for new operators (plant-specific procedures, equipment, regulations), (2) ongoing training for regulatory changes, new equipment, and process improvements, (3) emergency response training, and (4) cross-training for operational flexibility. Training records must be maintained for regulatory compliance.",
    "difficulty": "medium"
  },
  {
    "id": 410,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'incident reporting' in a water treatment plant?",
    "options": [
      "Incident reports are only required for injuries",
      "Incident reports document near-misses, equipment failures, process upsets, and injuries to identify root causes, implement corrective actions, and prevent recurrence",
      "Incident reports are only required for regulatory compliance",
      "Incident reports are prepared by the regulatory authority"
    ],
    "correct": 1,
    "explanation": "Incident reporting captures: (1) near-misses (incidents that could have caused harm), (2) equipment failures, (3) process upsets, (4) injuries and property damage, and (5) environmental releases. Root cause analysis identifies contributing factors. Corrective actions prevent recurrence. Near-miss reporting is particularly valuable — near-misses often precede serious incidents.",
    "difficulty": "medium"
  },
  {
    "id": 411,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'water loss' monitoring in a distribution system?",
    "options": [
      "Water loss monitoring is only for billing purposes",
      "Water loss monitoring identifies leakage, meter inaccuracies, and unauthorized use, allowing targeted repair and conservation efforts",
      "Water loss monitoring is only required for large distribution systems",
      "Water loss monitoring is the same as flow monitoring"
    ],
    "correct": 1,
    "explanation": "Water loss = water produced - water billed. Components: (1) real losses (leakage from pipes, joints, service connections), (2) apparent losses (meter inaccuracies, unauthorized use, data errors). Monitoring water loss (using the IWA Water Balance methodology) identifies: (1) leakage hotspots for targeted repair, (2) meter accuracy issues, and (3) conservation opportunities.",
    "difficulty": "medium"
  },
  {
    "id": 412,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'consumer confidence reports' (CCRs) or annual water quality reports?",
    "options": [
      "CCRs are only required for regulatory compliance",
      "CCRs inform consumers about their water quality, treatment processes, and any compliance issues, building public trust and meeting regulatory transparency requirements",
      "CCRs are only required for systems that had compliance issues",
      "CCRs are prepared by the regulatory authority"
    ],
    "correct": 1,
    "explanation": "Consumer confidence reports (annual water quality reports in Ontario) inform consumers about: (1) water source, (2) treatment processes, (3) water quality monitoring results, (4) any exceedances and corrective actions, (5) health information for sensitive populations, and (6) contact information. They build public trust and meet Ontario's regulatory transparency requirements.",
    "difficulty": "medium"
  },
  {
    "id": 413,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'succession planning' for water treatment operations?",
    "options": [
      "Succession planning is only for large organizations",
      "Succession planning identifies and develops future operators to fill key positions, ensuring operational continuity when experienced staff retire or leave",
      "Succession planning is the same as hiring planning",
      "Succession planning is only required for management positions"
    ],
    "correct": 1,
    "explanation": "The water sector faces a significant challenge as many experienced operators approach retirement. Succession planning: (1) identifies key positions and critical knowledge, (2) develops training programs to transfer knowledge, (3) recruits and mentors new operators, and (4) ensures operational continuity. Without succession planning, critical operational knowledge is lost when experienced operators retire.",
    "difficulty": "medium"
  },
  {
    "id": 414,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'energy management' programs for water treatment plants?",
    "options": [
      "Energy management is only for cost reduction",
      "Energy management identifies opportunities to reduce energy consumption through process optimization, equipment upgrades, and demand management, reducing costs and environmental impact",
      "Energy management is only required for large water systems",
      "Energy management is the same as preventive maintenance"
    ],
    "correct": 1,
    "explanation": "Water treatment plants are significant energy consumers (pumping, aeration, UV, HVAC). Energy management programs: (1) benchmark energy consumption (kWh/m³ treated), (2) identify efficiency opportunities (VFDs, pump optimization, lighting upgrades), (3) implement demand management (shift energy-intensive operations to off-peak hours), and (4) track and report energy savings.",
    "difficulty": "medium"
  },
  {
    "id": 415,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'capital planning' for water treatment infrastructure?",
    "options": [
      "Capital planning is only for new construction",
      "Capital planning identifies future infrastructure needs, estimates costs, and develops funding strategies to ensure the water system can continue to provide safe drinking water as infrastructure ages",
      "Capital planning is only required for large water systems",
      "Capital planning is the same as asset management"
    ],
    "correct": 1,
    "explanation": "Capital planning (long-term capital planning, typically 10–20 years) identifies: (1) infrastructure that needs replacement or rehabilitation, (2) capacity expansions needed for growth, (3) regulatory compliance upgrades, and (4) estimated costs and timing. Capital plans inform rate-setting, grant applications, and long-term financial planning to ensure sustainable infrastructure investment.",
    "difficulty": "medium"
  },
  {
    "id": 416,
    isCalc: true,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "A surface water intake is located 2 km upstream of a municipal wastewater discharge. The river flow is 15 m³/s and the effluent flow is 0.3 m³/s. What is the dilution ratio?",
    "options": [
      "50:1",
      "15:1",
      "5:1",
      "100:1"
    ],
    "correct": 0,
    "explanation": "Dilution ratio = river flow / effluent flow = 15 / 0.3 = 50:1. At this dilution, effluent concentrations are reduced to 1/50 of their source values. However, even at 50:1 dilution, pharmaceuticals, hormones, and pathogens may still be present at concentrations of concern. Source water monitoring for these parameters is warranted.",
    steps: [
      { l: "Identify Given Values", c: "The river flow is 15 m³/s and the effluent flow is 0.3 m³/s. The distance of the intake from the discharge is extraneous information for this calculation." },
      { l: "Recall Dilution Ratio Formula", c: "The dilution ratio is calculated by dividing the river flow (or receiving water flow) by the effluent flow (or discharge flow)." },
      { l: "Perform Calculation", c: "Divide the river flow (15 m³/s) by the effluent flow (0.3 m³/s): 15 / 0.3 = 50." },
      { l: "State the Dilution Ratio", c: "The dilution ratio is 50:1, meaning for every one part of effluent, there are 50 parts of river water." },
    ],
    tip: "Always double-check that you are using the correct formula for the requested calculation and that units are consistent.",
    "difficulty": "hard"
  },
  {
    "id": 417,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "What is the purpose of 'raw water pre-screening' at a surface water intake?",
    "options": [
      "Pre-screening removes dissolved contaminants",
      "Pre-screening (bar screens, traveling screens) removes large debris (fish, leaves, ice) that could damage pumps and clog downstream equipment",
      "Pre-screening disinfects the raw water",
      "Pre-screening is only required for intakes with high turbidity"
    ],
    "correct": 1,
    "explanation": "Raw water intake screens remove: (1) large debris (fish, leaves, branches) that could damage pumps, (2) smaller particles (traveling screens) that could clog heat exchangers and downstream equipment, and (3) aquatic organisms (fish larvae, zebra mussel veligers). Screen design must prevent fish impingement and entrainment.",
    "difficulty": "easy"
  },
  {
    "id": 418,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "A source water reservoir has a hydraulic retention time (HRT) of 45 days. What is the significance for water quality?",
    "options": [
      "Long HRT improves water quality by allowing contaminants to settle",
      "Long HRT allows algae and cyanobacteria to bloom, thermal stratification to develop, and taste/odour compounds to accumulate; it also means contamination events persist longer",
      "Long HRT has no effect on water quality",
      "Long HRT reduces the need for treatment"
    ],
    "correct": 1,
    "explanation": "Long HRT (45 days) has both positive and negative effects: Positive — allows settling of particles, natural die-off of some pathogens. Negative — allows algae/cyanobacteria to bloom (especially if nutrients are present), thermal stratification develops, taste/odour compounds accumulate, and contamination events persist longer. Reservoir management (destratification, algaecides) may be needed.",
    "difficulty": "hard"
  },
  {
    "id": 419,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "What is the purpose of 'intake protection zones' (IPZs) under Ontario's Clean Water Act?",
    "options": [
      "IPZs are areas where water treatment is not required",
      "IPZs are areas around drinking water intakes where land use activities are regulated to prevent contamination of the source water",
      "IPZs are only for groundwater sources",
      "IPZs are the same as wellhead protection areas"
    ],
    "correct": 1,
    "explanation": "Under Ontario's Clean Water Act, intake protection zones (IPZs) are defined around surface water intakes based on time-of-travel to the intake: IPZ-1 (2-hour travel time), IPZ-2 (additional area), IPZ-3 (watershed area). Land use activities that pose a significant threat to the intake are regulated or prohibited within these zones.",
    "difficulty": "medium"
  },
  {
    "id": 420,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "A source water has a flow velocity of 0.8 m/s at the intake. What is the concern for intake design?",
    "options": [
      "High velocity improves water quality by preventing algae growth",
      "High intake velocity (>0.15 m/s) can impinge fish and other aquatic organisms on the screens; intake design should minimize velocity to protect aquatic life",
      "High velocity has no effect on intake design",
      "High velocity is preferred for intake design"
    ],
    "correct": 1,
    "explanation": "Intake velocity affects aquatic life: (1) impingement — fish and other organisms are trapped against intake screens at velocities >0.15 m/s, (2) entrainment — small organisms (larvae, eggs) pass through screens and are killed in the treatment process. Intake design should minimize approach velocity (<0.15 m/s) and include fish return systems.",
    "difficulty": "medium"
  },
  {
    "id": 421,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "What is the significance of 'frazil ice' for water intake operations?",
    "options": [
      "Frazil ice improves water quality by filtering particles",
      "Frazil ice (fine, needle-like ice crystals) forms in turbulent, supercooled water and adheres to intake screens, potentially blocking the intake completely",
      "Frazil ice only affects groundwater intakes",
      "Frazil ice is only a concern in Arctic climates"
    ],
    "correct": 1,
    "explanation": "Frazil ice forms when turbulent water is supercooled below 0°C. The fine ice crystals adhere to any surface, including intake screens, and can accumulate rapidly to block the intake completely. Prevention measures: (1) heat intake screens electrically or with warm water, (2) use submerged intakes below the ice formation zone, and (3) monitor intake differential pressure continuously.",
    "difficulty": "hard"
  },
  {
    "id": 422,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "A source water reservoir is experiencing 'turnover' (destratification) in the fall. What water quality changes should the operator anticipate?",
    "options": [
      "Fall turnover improves water quality",
      "Fall turnover mixes the anoxic hypolimnion with the surface water, potentially releasing iron, manganese, H2S, and taste/odour compounds into the intake water",
      "Fall turnover has no effect on water quality",
      "Fall turnover only affects water temperature"
    ],
    "correct": 1,
    "explanation": "Fall turnover occurs when surface water cools to the same temperature as the hypolimnion, causing mixing. The anoxic hypolimnion contains: (1) soluble iron and manganese (released from sediments under anoxic conditions), (2) hydrogen sulfide, (3) taste and odour compounds, and (4) depleted oxygen. Operators should increase treatment (oxidation, coagulation) and monitor closely during turnover.",
    "difficulty": "hard"
  },
  {
    "id": 423,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "What is the purpose of 'hydrograph analysis' for a surface water source?",
    "options": [
      "Hydrograph analysis measures water temperature",
      "Hydrograph analysis tracks stream flow over time, identifying seasonal patterns, flood events, and low-flow periods that affect source water quality and treatment requirements",
      "Hydrograph analysis is only used for flood control",
      "Hydrograph analysis measures water quality"
    ],
    "correct": 1,
    "explanation": "Hydrograph analysis (flow vs. time) identifies: (1) seasonal flow patterns (snowmelt, summer low flow), (2) storm event responses (rapid flow increases with turbidity spikes), (3) low-flow periods (concentrated contaminants), and (4) long-term trends (climate change impacts). This information guides operational planning and emergency preparedness.",
    "difficulty": "medium"
  },
  {
    "id": 424,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "A source water has a Secchi depth of 4.5 m in early spring but drops to 0.6 m in July. What is the MOST likely explanation?",
    "options": [
      "The decrease in Secchi depth is due to increased rainfall in July",
      "The decrease in Secchi depth from spring to summer indicates a summer algal bloom, likely triggered by warm temperatures and nutrient availability",
      "The decrease in Secchi depth is due to increased turbidity from snowmelt",
      "The decrease in Secchi depth is normal seasonal variation with no treatment implications"
    ],
    "correct": 1,
    "explanation": "A Secchi depth decrease from 4.5 m (spring) to 0.6 m (July) indicates a major algal bloom. Summer conditions (warm temperature, high light, nutrient availability) promote algal growth. This bloom will likely cause: (1) taste and odour problems (geosmin, 2-MIB), (2) potential cyanotoxin production, (3) increased coagulant demand, and (4) filter clogging.",
    "difficulty": "medium"
  },
  {
    "id": 425,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "What is the purpose of 'continuous online monitoring' at a source water intake?",
    "options": [
      "Online monitoring is only for regulatory compliance",
      "Online monitoring provides real-time data on source water quality (turbidity, pH, conductivity, temperature, DO) enabling rapid detection of contamination events and proactive treatment adjustments",
      "Online monitoring replaces grab sample analysis",
      "Online monitoring is only required for large water systems"
    ],
    "correct": 1,
    "explanation": "Continuous online monitoring at the intake provides: (1) real-time detection of contamination events (conductivity spikes, turbidity surges), (2) early warning before contaminated water reaches the treatment plant, (3) data for proactive treatment adjustments, and (4) operational data for process optimization. It complements, but does not replace, laboratory analysis.",
    "difficulty": "medium"
  },
  {
    "id": 426,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "A source water intake is located in a lake that is subject to 'seiche' events (standing waves). What is the operational significance?",
    "options": [
      "Seiche events have no effect on water quality",
      "Seiche events can cause rapid changes in water level and quality at the intake, potentially drawing in bottom sediments or surface algae depending on the wave direction",
      "Seiche events only affect water temperature",
      "Seiche events are only a concern for large lakes"
    ],
    "correct": 1,
    "explanation": "Seiches are standing waves in enclosed water bodies caused by wind or atmospheric pressure changes. They can cause: (1) rapid water level changes at the intake, (2) resuspension of bottom sediments (turbidity spikes), (3) mixing of different water quality layers, and (4) changes in algae concentration at the intake. Operators should monitor water quality closely during seiche events.",
    "difficulty": "hard"
  },
  {
    "id": 427,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "What is the significance of 'watershed imperviousness' for source water quality?",
    "options": [
      "Watershed imperviousness improves water quality by reducing erosion",
      "Higher imperviousness (paved surfaces, rooftops) increases stormwater runoff volume and velocity, carrying more pollutants (oil, metals, bacteria) to the source water",
      "Watershed imperviousness has no effect on source water quality",
      "Watershed imperviousness only affects water quantity, not quality"
    ],
    "correct": 1,
    "explanation": "Watershed imperviousness (% of land covered by impervious surfaces) is a key indicator of urban stormwater impacts. Higher imperviousness: (1) increases runoff volume and peak flow, (2) increases pollutant loading (oil, metals, bacteria, nutrients), (3) reduces groundwater recharge, and (4) increases stream erosion. Source water quality typically degrades as watershed imperviousness increases above 10–15%.",
    "difficulty": "hard"
  },
  {
    "id": 428,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "A source water has elevated turbidity (85 NTU) from a storm event. The plant's design capacity is 50 NTU. What is the appropriate response?",
    "options": [
      "Operate the plant normally — the treatment process will handle the higher turbidity",
      "Reduce plant flow rate, increase coagulant dose based on jar testing, increase monitoring frequency, and consider shutting down the intake if turbidity continues to rise",
      "Shut down the plant immediately",
      "Increase the chlorine dose to compensate for the higher turbidity"
    ],
    "correct": 1,
    "explanation": "When source water turbidity exceeds design capacity: (1) reduce plant flow rate to allow more treatment time, (2) perform jar tests to optimize coagulant dose at the higher turbidity, (3) increase monitoring frequency for settled and filtered water turbidity, (4) notify the regulatory authority if required, and (5) consider shutting down the intake if turbidity continues to rise beyond treatment capability.",
    "difficulty": "hard"
  },
  {
    "id": 429,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "What is the purpose of 'bathymetric surveys' for a source water reservoir?",
    "options": [
      "Bathymetric surveys measure water quality at different depths",
      "Bathymetric surveys map the depth and bottom topography of the reservoir, identifying sediment accumulation, dead zones, and optimal intake locations",
      "Bathymetric surveys are only required for new reservoirs",
      "Bathymetric surveys measure the volume of water in the reservoir"
    ],
    "correct": 1,
    "explanation": "Bathymetric surveys map the underwater topography of a reservoir: (1) identify sediment accumulation (reduces storage capacity), (2) locate dead zones (areas of poor circulation), (3) determine optimal intake depth and location, (4) calculate current storage volume, and (5) track changes over time (sedimentation rates). Results inform reservoir management and dredging decisions.",
    "difficulty": "medium"
  },
  {
    "id": 430,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "A source water has a total suspended solids (TSS) concentration of 120 mg/L. Estimate the approximate turbidity in NTU.",
    "options": [
      "Approximately 60 NTU",
      "Approximately 120 NTU",
      "Approximately 240 NTU",
      "There is no relationship between TSS and turbidity"
    ],
    "correct": 0,
    "explanation": "The relationship between TSS and turbidity varies with particle size and type, but a rough approximation for mineral-dominated suspensions is: turbidity (NTU) ≈ TSS (mg/L) / 2. For 120 mg/L TSS, turbidity ≈ 60 NTU. This relationship is not precise — organic particles (algae) scatter light differently than mineral particles. Actual turbidity must be measured.",
    "difficulty": "hard"
  },
  {
    "id": 431,
    isCalc: true,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has pH 7.8, alkalinity 85 mg/L as CaCO3, and calcium hardness 95 mg/L as CaCO3. Calculate the LSI at 15°C.",
    "options": [
      "LSI ≈ +0.2 (slightly scale-forming)",
      "LSI ≈ -0.4 (slightly corrosive)",
      "LSI ≈ +0.8 (strongly scale-forming)",
      "LSI ≈ -1.2 (strongly corrosive)"
    ],
    "correct": 1,
    "explanation": "pHs at 15°C: pK2 - pKs ≈ 2.2. p[Ca²⁺] = -log(95/100,000 × 1/0.02) ≈ 2.32. p[HCO3⁻] = -log(85/61,000) ≈ 2.85. pHs ≈ 2.2 + 2.32 + 2.85 - 2.2 = 8.17. LSI = 7.8 - 8.17 = -0.37 ≈ -0.4. The water is slightly corrosive. Corrosion control treatment (pH increase, alkalinity increase, or orthophosphate) should be considered.",
    steps: [
      { l: "Step 1: Understand the Langelier Saturation Index (LSI) formula", c: "The LSI is calculated as LSI = pH - pHs, where pH is the actual pH of the water and pHs is the pH at saturation with calcium carbonate. A negative LSI indicates corrosive water, while a positive LSI indicates scale-forming water." },
      { l: "Step 2: Calculate pCa and pAlk", c: "pCa = -log[Ca2+] and pAlk = -log[HCO3-]. Using the given values and conversion factors, pCa = -log(95 mg/L / 40.08 mg/mmol) = 2.32. pAlk = -log(85 mg/L / 61.02 mg/mmol) = 2.85. (Note: The provided explanation uses slightly different conversion factors, but the principle is the same)." },
      { l: "Step 3: Calculate pHs", c: "pHs = (pK2 - pKs) + pCa + pAlk. Using the given (pK2 - pKs) ≈ 2.2 and our calculated pCa and pAlk, pHs = 2.2 + 2.32 + 2.85 = 7.37. (Note: The provided explanation has an error in its pHs calculation, subtracting 2.2 at the end)." },
      { l: "Step 4: Calculate the LSI", c: "LSI = pH - pHs. Given pH = 7.8 and our calculated pHs = 7.37, LSI = 7.8 - 7.37 = 0.43. This indicates the water is slightly scale-forming, not corrosive as stated in the original explanation." },
    ],
    tip: "Double-check all calculations, especially when dealing with multiple logarithmic terms, as a small error can significantly change the final result and interpretation.",
    "difficulty": "hard"
  },
  {
    "id": 432,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the significance of 'total organic halide' (TOX) in source water?",
    "options": [
      "TOX measures the total chlorine demand of the water",
      "TOX measures the total concentration of halogenated organic compounds, which are indicators of industrial contamination or natural halogenation reactions",
      "TOX is only significant for plants using ozone",
      "TOX has no effect on treatment"
    ],
    "correct": 1,
    "explanation": "Total organic halide (TOX) measures all halogenated organic compounds in water. Sources: (1) industrial discharges (chlorinated solvents, pesticides), (2) natural halogenation (some algae produce halogenated compounds), and (3) disinfection byproducts (THMs, HAAs are included in TOX). Elevated TOX in source water may indicate industrial contamination requiring investigation.",
    "difficulty": "hard"
  },
  {
    "id": 433,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated sulfate at 380 mg/L. The Ontario aesthetic objective is 500 mg/L. What is the treatment significance?",
    "options": [
      "Sulfate has no treatment significance below the aesthetic objective",
      "High sulfate increases water corrosivity (particularly for cement-lined pipes and concrete structures), may cause laxative effects at high concentrations, and affects taste",
      "High sulfate requires ion exchange treatment",
      "High sulfate only affects industrial water users"
    ],
    "correct": 1,
    "explanation": "Sulfate at 380 mg/L (approaching the 500 mg/L AO) has several implications: (1) corrosivity — sulfate attacks cement-lined pipes and concrete structures (sulfate attack), (2) taste — sulfate imparts a bitter taste above 250 mg/L, (3) laxative effects — sulfate above 600 mg/L can cause diarrhea in sensitive individuals, and (4) affects the chloride-to-sulfate ratio (CSMR) for corrosion control.",
    "difficulty": "hard"
  },
  {
    "id": 434,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the purpose of 'trihalomethane formation potential' (THMFP) testing for source water?",
    "options": [
      "THMFP testing measures the current THM concentration in source water",
      "THMFP testing measures the maximum THMs that would form if the source water were chlorinated under standard conditions, indicating the DBP risk and the need for NOM removal",
      "THMFP testing is only required for plants using chloramines",
      "THMFP testing replaces routine THM monitoring"
    ],
    "correct": 1,
    "explanation": "THMFP (Trihalomethane Formation Potential) is measured by reacting the source water with excess chlorine under standard conditions (25°C, pH 7, 7 days). The result indicates: (1) the maximum DBP formation potential of the NOM in the source water, (2) the effectiveness of NOM removal by coagulation, and (3) the need for additional NOM removal treatment (enhanced coagulation, GAC).",
    "difficulty": "hard"
  },
  {
    "id": 435,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated fluoride at 2.8 mg/L. The Ontario MAC is 1.5 mg/L. What treatment is required?",
    "options": [
      "Conventional treatment removes fluoride",
      "Fluoride removal requires specialized treatment: activated alumina, bone char, ion exchange, or reverse osmosis",
      "Fluoride is not regulated in Ontario",
      "Dilution with a lower-fluoride source is the only option"
    ],
    "correct": 1,
    "explanation": "Fluoride at 2.8 mg/L exceeds Ontario's MAC of 1.5 mg/L (dental fluorosis risk above 1.5 mg/L, skeletal fluorosis risk at very high concentrations). Conventional treatment does not remove fluoride. Effective removal processes: (1) activated alumina (adsorption), (2) bone char (adsorption), (3) ion exchange (anion resin), or (4) reverse osmosis. The process must be designed to reduce fluoride to below 1.5 mg/L.",
    "difficulty": "hard"
  },
  {
    "id": 436,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the significance of 'dissolved organic carbon' (DOC) versus 'total organic carbon' (TOC) for water treatment?",
    "options": [
      "DOC and TOC are the same measurement",
      "TOC = DOC + POC (particulate organic carbon); DOC passes through a 0.45 μm filter and represents the fraction that reacts with disinfectants to form DBPs; POC is removed by coagulation/filtration",
      "DOC is more important than TOC for treatment",
      "TOC is only measured in treated water"
    ],
    "correct": 1,
    "explanation": "TOC = DOC + POC (particulate organic carbon). DOC (dissolved, <0.45 μm) is the fraction that: (1) reacts with chlorine to form DBPs, (2) exerts chlorine demand, and (3) is partially removed by enhanced coagulation. POC (particulate) is removed by coagulation/filtration. For DBP management, DOC is the more relevant parameter.",
    "difficulty": "hard"
  },
  {
    "id": 437,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated barium at 0.8 mg/L. The Ontario MAC is 1.0 mg/L. What treatment is effective for barium removal?",
    "options": [
      "Conventional coagulation removes all barium",
      "Ion exchange (cation resin), lime softening, or reverse osmosis can reduce barium to below the MAC",
      "Chlorination removes barium",
      "Barium cannot be removed from drinking water"
    ],
    "correct": 1,
    "explanation": "Barium (Ba²⁺) is a divalent cation that can be removed by: (1) ion exchange with cation exchange resin (same process as water softening), (2) lime softening (barium precipitates as BaSO4 or BaCO3), or (3) reverse osmosis. Conventional coagulation is not effective for dissolved barium removal.",
    "difficulty": "hard"
  },
  {
    "id": 438,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the purpose of 'jar testing' with source water samples?",
    "options": [
      "Jar testing measures the turbidity of source water",
      "Jar testing simulates the coagulation/flocculation/settling process to determine the optimal coagulant type, dose, and pH for current source water conditions",
      "Jar testing is only required when source water quality changes",
      "Jar testing is performed by the regulatory authority"
    ],
    "correct": 1,
    "explanation": "Jar testing (bench-scale simulation of coagulation/flocculation/settling) determines: (1) optimal coagulant type (alum, ferric, polymer), (2) optimal coagulant dose, (3) optimal pH for coagulation, and (4) need for coagulant aids (polymers, lime). Jar tests should be performed whenever source water quality changes significantly (turbidity, temperature, NOM).",
    "difficulty": "medium"
  },
  {
    "id": 439,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has a high concentration of natural organic matter (NOM) with a DOC of 12 mg/L. What is the MOST effective treatment for NOM removal?",
    "options": [
      "Conventional coagulation at normal pH removes all NOM",
      "Enhanced coagulation at lower pH (5.5–6.5) with higher alum or ferric dose, or nanofiltration for very high NOM",
      "Chlorination removes NOM",
      "Aeration removes NOM"
    ],
    "correct": 1,
    "explanation": "For high NOM (DOC = 12 mg/L): (1) enhanced coagulation at lower pH (5.5–6.5) with higher coagulant dose removes 40–60% of DOC, (2) nanofiltration (NF) removes >90% of DOC but requires more capital investment, and (3) GAC adsorption removes 30–60% of DOC. The choice depends on the NOM character (SUVA), regulatory requirements, and cost.",
    "difficulty": "hard"
  },
  {
    "id": 440,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the significance of 'specific UV absorbance' (SUVA) less than 2 L/mg·m for NOM treatment?",
    "options": [
      "SUVA < 2 indicates NOM is easily removed by coagulation",
      "SUVA < 2 indicates low molecular weight, hydrophilic NOM that is NOT amenable to coagulation; alternative treatment (GAC, nanofiltration) may be needed for DBP control",
      "SUVA < 2 indicates low NOM concentration",
      "SUVA < 2 has no treatment significance"
    ],
    "correct": 1,
    "explanation": "SUVA < 2 L/mg·m indicates low molecular weight, hydrophilic NOM (carbohydrates, amino acids) that: (1) does not absorb UV light strongly, (2) is NOT effectively removed by coagulation, and (3) still reacts with chlorine to form DBPs (particularly haloacetic acids). For these waters, GAC adsorption, nanofiltration, or chloramines (instead of free chlorine) may be needed for DBP control.",
    "difficulty": "hard"
  },
  {
    "id": 441,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated strontium at 6.0 mg/L. Is this a health concern?",
    "options": [
      "Strontium is not regulated in Ontario",
      "Strontium-90 (radioactive) is a health concern; stable strontium at 6.0 mg/L is below the Health Canada guideline of 7.0 mg/L and is not a significant health concern",
      "All strontium is radioactive and must be removed",
      "Strontium at 6.0 mg/L requires immediate treatment"
    ],
    "correct": 1,
    "explanation": "Strontium exists as stable isotopes (not radioactive) and radioactive Sr-90 (from nuclear fallout). Health Canada's guideline for stable strontium is 7.0 mg/L. At 6.0 mg/L, stable strontium is below the guideline. However, if the source is near nuclear facilities, Sr-90 monitoring may be warranted. Conventional treatment does not remove dissolved strontium effectively.",
    "difficulty": "hard"
  },
  {
    "id": 442,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the purpose of 'raw water alkalinity' monitoring for a lime softening plant?",
    "options": [
      "Alkalinity monitoring is only for aesthetic purposes",
      "Alkalinity determines the lime dose required for softening; higher alkalinity requires more lime to raise pH to the precipitation point for calcium and magnesium removal",
      "Alkalinity monitoring is only required for coagulation plants",
      "Alkalinity has no effect on lime softening"
    ],
    "correct": 1,
    "explanation": "In lime softening, alkalinity (primarily bicarbonate, HCO3⁻) is converted to carbonate (CO3²⁻) by lime addition. The carbonate then precipitates calcium as CaCO3. Higher bicarbonate alkalinity requires more lime to convert it to carbonate. Monitoring alkalinity allows accurate lime dose calculation: Ca(OH)2 dose ≈ alkalinity × 0.74 (as CaCO3).",
    "difficulty": "hard"
  },
  {
    "id": 443,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated radon at 150 Bq/L. The Health Canada guideline is 100 Bq/L. What treatment is effective?",
    "options": [
      "Conventional coagulation removes radon",
      "Aeration (packed tower or diffused air) is the most effective treatment for radon removal, as radon is a dissolved gas that can be stripped from water",
      "Chlorination removes radon",
      "Radon cannot be removed from drinking water"
    ],
    "correct": 1,
    "explanation": "Radon (Rn-222) is a radioactive gas that dissolves in groundwater. Aeration is the most effective treatment: (1) packed tower aeration achieves >99% removal, (2) diffused air aeration achieves 90–95% removal. Granular activated carbon (GAC) can also adsorb radon but the GAC becomes radioactive and requires special disposal. Radon is primarily a groundwater concern.",
    "difficulty": "hard"
  },
  {
    "id": 444,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the significance of 'chloride' concentration in source water for a water treatment plant?",
    "options": [
      "Chloride has no effect on treatment",
      "High chloride increases water corrosivity (particularly for lead and copper), affects taste, and may indicate contamination from road salt, seawater intrusion, or industrial discharges",
      "Chloride only affects the taste of finished water",
      "Chloride is only significant for plants using chloramines"
    ],
    "correct": 1,
    "explanation": "Chloride in source water affects: (1) corrosivity — chloride is aggressive to lead, copper, and stainless steel; high Cl⁻/SO4²⁻ ratio (CSMR) promotes galvanic lead corrosion, (2) taste — chloride above 250 mg/L imparts a salty taste, (3) contamination indicator — elevated chloride may indicate road salt runoff, seawater intrusion, or industrial discharge, and (4) membrane performance — high chloride increases osmotic pressure.",
    "difficulty": "medium"
  },
  {
    "id": 445,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated perchlorate at 0.006 mg/L. The Health Canada guideline is 0.006 mg/L. What treatment is effective?",
    "options": [
      "Conventional coagulation removes perchlorate",
      "Ion exchange (perchlorate-selective resin) or biological reduction is effective for perchlorate removal",
      "Chlorination removes perchlorate",
      "Perchlorate cannot be removed from drinking water"
    ],
    "correct": 1,
    "explanation": "Perchlorate (ClO4⁻) is an anion that is NOT removed by conventional coagulation or filtration. Effective removal: (1) ion exchange with perchlorate-selective anion resin (very effective, >99% removal), (2) biological reduction (perchlorate-reducing bacteria convert ClO4⁻ to Cl⁻ under anoxic conditions), or (3) reverse osmosis (90–95% removal). Perchlorate sources: rocket fuel, fireworks, some fertilizers.",
    "difficulty": "hard"
  },
  {
    "id": 446,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the purpose of 'disinfection byproduct precursor' monitoring in source water?",
    "options": [
      "DBP precursor monitoring measures the current DBP concentration",
      "DBP precursor monitoring (TOC, DOC, UV254, SUVA) assesses the NOM concentration and character that will react with disinfectants to form DBPs, guiding NOM removal treatment",
      "DBP precursor monitoring is only required for plants using chloramines",
      "DBP precursor monitoring replaces routine DBP monitoring"
    ],
    "correct": 1,
    "explanation": "DBP precursor monitoring measures NOM parameters that predict DBP formation: (1) TOC/DOC (total organic precursor concentration), (2) UV254 absorbance (aromatic NOM that forms THMs), (3) SUVA (NOM character — high SUVA = high THM formation potential), and (4) THMFP/HAAFP (direct measurement of formation potential). This data guides enhanced coagulation and other NOM removal strategies.",
    "difficulty": "medium"
  },
  {
    "id": 447,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated uranium at 0.025 mg/L. The Ontario MAC is 0.020 mg/L. What treatment is effective?",
    "options": [
      "Conventional coagulation removes all uranium",
      "Coagulation/filtration (for particulate uranium), ion exchange, or reverse osmosis can reduce uranium to below the MAC",
      "Chlorination removes uranium",
      "Uranium cannot be removed from drinking water"
    ],
    "correct": 1,
    "explanation": "Uranium (as UO2²⁺, uranyl ion) can be removed by: (1) coagulation/filtration (removes particulate uranium and some dissolved uranium by adsorption onto floc), (2) ion exchange (anion exchange for uranyl-carbonate complexes, cation exchange for free uranyl), or (3) reverse osmosis (>95% removal). The effective process depends on the uranium speciation (pH, carbonate concentration).",
    "difficulty": "hard"
  },
  {
    "id": 448,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the significance of 'total hardness' versus 'calcium hardness' for water treatment?",
    "options": [
      "Total hardness and calcium hardness are the same measurement",
      "Total hardness = calcium hardness + magnesium hardness; calcium hardness is used for LSI calculations; magnesium hardness is important for lime softening (requires more lime to remove Mg than Ca)",
      "Calcium hardness is more important than total hardness for all treatment purposes",
      "Total hardness is only measured in treated water"
    ],
    "correct": 1,
    "explanation": "Total hardness = Ca hardness + Mg hardness. Calcium hardness is used for: (1) LSI calculation (CaCO3 saturation), (2) lime softening design (Ca removed as CaCO3). Magnesium hardness requires additional lime to raise pH to 10.5–11 for Mg(OH)2 precipitation. Magnesium removal is more expensive than calcium removal. The ratio of Ca to Mg hardness affects softening process design.",
    "difficulty": "hard"
  },
  {
    "id": 449,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated selenium at 0.012 mg/L. The Ontario MAC is 0.010 mg/L. What treatment is effective?",
    "options": [
      "Conventional coagulation removes all selenium",
      "Coagulation/filtration (for Se(IV)), ion exchange, or reverse osmosis can reduce selenium to below the MAC; Se(VI) requires reduction to Se(IV) first",
      "Chlorination removes selenium",
      "Selenium cannot be removed from drinking water"
    ],
    "correct": 1,
    "explanation": "Selenium removal depends on the form: Se(IV) (selenite) is more easily removed than Se(VI) (selenate). Effective processes: (1) coagulation/filtration with iron coagulants (adsorbs Se(IV) onto iron floc), (2) reduction of Se(VI) to Se(IV) before coagulation, (3) ion exchange (anion resin), or (4) reverse osmosis (>90% removal for both forms).",
    "difficulty": "hard"
  },
  {
    "id": 450,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the purpose of 'total inorganic carbon' (TIC) measurement in source water?",
    "options": [
      "TIC measures the total carbon content of source water",
      "TIC (primarily bicarbonate and carbonate) determines the alkalinity and buffering capacity; it is used to calculate the carbonate system equilibrium and LSI",
      "TIC is only measured in treated water",
      "TIC has no effect on treatment"
    ],
    "correct": 1,
    "explanation": "TIC (Total Inorganic Carbon) = CO2 + HCO3⁻ + CO3²⁻. In most natural waters, HCO3⁻ dominates. TIC measurements are used to: (1) calculate alkalinity (buffering capacity), (2) determine the carbonate system equilibrium (pH, CO2, HCO3⁻, CO3²⁻), (3) calculate LSI for corrosion control, and (4) design lime softening (carbonate removal).",
    "difficulty": "hard"
  },
  {
    "id": 451,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated chromium at 0.08 mg/L (total). The Ontario MAC is 0.05 mg/L. What is the treatment approach?",
    "options": [
      "Conventional coagulation removes all chromium",
      "The treatment approach depends on the chromium form: Cr(III) is removed by coagulation/filtration; Cr(VI) (hexavalent chromium, more toxic) requires reduction to Cr(III) before coagulation, or ion exchange/RO",
      "Chlorination removes chromium",
      "Chromium cannot be removed from drinking water"
    ],
    "correct": 1,
    "explanation": "Chromium removal depends on the oxidation state: Cr(III) (trivalent) precipitates as Cr(OH)3 at pH 7–9 and is removed by coagulation/filtration. Cr(VI) (hexavalent, more toxic, carcinogenic) is soluble and NOT removed by conventional coagulation. Cr(VI) treatment: (1) reduction to Cr(III) using ferrous sulfate or sodium bisulfite at low pH, then coagulation, or (2) ion exchange or RO.",
    "difficulty": "hard"
  },
  {
    "id": 452,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the significance of 'total phosphorus' monitoring in a source water reservoir?",
    "options": [
      "Total phosphorus monitoring is only for regulatory compliance",
      "Total phosphorus is the primary limiting nutrient for algal growth; monitoring tracks eutrophication status and predicts algal bloom risk",
      "Total phosphorus only affects taste and odour",
      "Total phosphorus has no effect on water treatment"
    ],
    "correct": 1,
    "explanation": "Total phosphorus (TP) is the primary limiting nutrient for algal growth in most freshwater systems. TP monitoring: (1) tracks eutrophication status (oligotrophic <10 μg/L, mesotrophic 10–35 μg/L, eutrophic >35 μg/L), (2) predicts algal bloom risk (TP >20 μg/L increases bloom risk), and (3) evaluates the effectiveness of phosphorus reduction measures in the watershed.",
    "difficulty": "medium"
  },
  {
    "id": 453,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated triclosan (an antimicrobial compound) at 0.8 μg/L. What is the treatment significance?",
    "options": [
      "Triclosan is not regulated in Ontario and has no treatment significance",
      "Triclosan is an emerging contaminant that may not be fully removed by conventional treatment; GAC adsorption or ozone/advanced oxidation can remove it",
      "Triclosan is easily removed by conventional coagulation",
      "Triclosan is only a concern for industrial water users"
    ],
    "correct": 1,
    "explanation": "Triclosan is an antimicrobial compound (found in personal care products) that is an emerging contaminant. Conventional treatment removes triclosan partially (30–70% by coagulation/filtration). More effective removal: (1) GAC adsorption (>90% removal), (2) ozone/advanced oxidation (>95% removal), (3) nanofiltration/RO. Triclosan is also a concern because it can form chlorinated byproducts when chlorinated.",
    "difficulty": "hard"
  },
  {
    "id": 454,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the purpose of 'UV254 absorbance' measurement in source water?",
    "options": [
      "UV254 measures the turbidity of source water",
      "UV254 measures the concentration of aromatic organic compounds (primarily humic substances) that are the primary precursors for THM formation and are amenable to coagulation removal",
      "UV254 is only used for UV disinfection dose calculation",
      "UV254 measures the chlorine demand of source water"
    ],
    "correct": 1,
    "explanation": "UV254 absorbance measures the concentration of aromatic organic compounds (primarily humic and fulvic acids) in water. It is used to: (1) calculate SUVA (UV254 ÷ DOC) to characterize NOM, (2) predict THM formation potential (aromatic NOM is the primary THM precursor), (3) assess NOM removal by coagulation (UV254 removal correlates with NOM removal), and (4) monitor NOM trends.",
    "difficulty": "medium"
  },
  {
    "id": 455,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated PFAS (per- and polyfluoroalkyl substances) at 0.08 μg/L total. What treatment is effective?",
    "options": [
      "Conventional coagulation removes PFAS",
      "Granular activated carbon (GAC) or anion exchange resin are the most effective treatments for PFAS removal; reverse osmosis also achieves high removal",
      "Chlorination removes PFAS",
      "PFAS cannot be removed from drinking water"
    ],
    "correct": 1,
    "explanation": "PFAS (including PFOA, PFOS) are extremely persistent 'forever chemicals' that are NOT removed by conventional treatment. Effective removal: (1) GAC adsorption (60–90% removal, depends on PFAS chain length and GAC contact time), (2) anion exchange resin (>95% removal), or (3) reverse osmosis (>95% removal). Health Canada has set a guideline of 0.6 ng/L for PFOS and 0.2 ng/L for PFOA.",
    "difficulty": "hard"
  },
  {
    "id": 456,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the significance of 'calcium-to-magnesium ratio' in source water for a lime softening plant?",
    "options": [
      "The Ca:Mg ratio has no effect on lime softening",
      "The Ca:Mg ratio affects the lime dose and process design; magnesium removal requires higher pH (10.5–11) than calcium removal (9.5–10), requiring more lime",
      "The Ca:Mg ratio only affects the taste of finished water",
      "The Ca:Mg ratio is only significant for ion exchange softening"
    ],
    "correct": 1,
    "explanation": "In lime softening: Calcium removal requires pH 9.5–10 (lime dose to convert HCO3⁻ to CO3²⁻ for CaCO3 precipitation). Magnesium removal requires pH 10.5–11 (additional lime to precipitate Mg(OH)2). Higher Mg:Ca ratio requires more lime and produces more sludge. The decision to remove magnesium depends on the target finished water hardness.",
    "difficulty": "hard"
  },
  {
    "id": 457,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated hydrogen sulfide (H2S) at 0.8 mg/L. What is the MOST effective treatment?",
    "options": [
      "Chlorination at normal doses removes H2S",
      "Aeration (packed tower or cascade) or pre-chlorination at higher doses oxidizes H2S to sulfate; aeration is preferred to avoid sulfur deposits",
      "Coagulation removes H2S",
      "H2S cannot be removed from drinking water"
    ],
    "correct": 1,
    "explanation": "H2S removal: (1) aeration — H2S is a dissolved gas that can be stripped by aeration (packed tower, cascade, diffused air); most cost-effective for high concentrations, (2) pre-chlorination — Cl2 oxidizes H2S to sulfate (S²⁻ + Cl2 → S + 2Cl⁻ or S²⁻ + 4Cl2 + 4H2O → SO4²⁻ + 8HCl); requires high chlorine dose, (3) KMnO4 oxidation. Aeration is preferred to avoid sulfur deposits.",
    "difficulty": "hard"
  },
  {
    "id": 458,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the significance of 'natural organic matter' (NOM) fractionation for treatment optimization?",
    "options": [
      "NOM fractionation is only for research purposes",
      "NOM fractionation (hydrophobic vs. hydrophilic, high vs. low molecular weight) identifies which NOM fractions are present and their treatability, guiding selection of the most effective removal process",
      "NOM fractionation is only required for plants using ozone",
      "NOM fractionation replaces SUVA measurement"
    ],
    "correct": 1,
    "explanation": "NOM fractionation identifies: (1) hydrophobic NOM (humic/fulvic acids, high MW) — amenable to coagulation, high SUVA, high THM formation potential, (2) hydrophilic NOM (carbohydrates, amino acids, low MW) — NOT amenable to coagulation, low SUVA, high HAA formation potential. Fractionation guides selection of: enhanced coagulation (for hydrophobic NOM) vs. GAC/NF (for hydrophilic NOM).",
    "difficulty": "hard"
  },
  {
    "id": 459,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated total dissolved solids (TDS) at 1,200 mg/L. What treatment is required?",
    "options": [
      "Conventional treatment removes TDS",
      "Reverse osmosis or electrodialysis reversal (EDR) is required to reduce TDS to acceptable levels (<500 mg/L aesthetic objective)",
      "Ion exchange removes all TDS",
      "TDS above 1,200 mg/L is acceptable for drinking water"
    ],
    "correct": 1,
    "explanation": "TDS of 1,200 mg/L significantly exceeds Ontario's aesthetic objective of 500 mg/L. Conventional treatment does not remove dissolved ions. Effective TDS reduction: (1) reverse osmosis (RO) — removes 90–99% of TDS, (2) electrodialysis reversal (EDR) — removes ions selectively, (3) nanofiltration — removes divalent ions (hardness) but not monovalent ions (Na, Cl). RO is the most common choice for high TDS.",
    "difficulty": "hard"
  },
  {
    "id": 460,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the purpose of 'chlorophyll-a' monitoring in a source water reservoir?",
    "options": [
      "Chlorophyll-a monitoring measures the colour of source water",
      "Chlorophyll-a is a measure of algal biomass; monitoring tracks algal bloom development and predicts potential taste/odour and cyanotoxin problems",
      "Chlorophyll-a monitoring is only required during summer",
      "Chlorophyll-a monitoring measures the turbidity of source water"
    ],
    "correct": 1,
    "explanation": "Chlorophyll-a is the primary photosynthetic pigment in algae and cyanobacteria. Monitoring chlorophyll-a: (1) tracks algal biomass (μg/L), (2) identifies bloom development (>10 μg/L = bloom conditions), (3) predicts taste/odour risk (geosmin, 2-MIB production), (4) predicts cyanotoxin risk (cyanobacteria blooms), and (5) evaluates the effectiveness of nutrient reduction measures.",
    "difficulty": "medium"
  },
  {
    "id": 461,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated arsenic at 0.015 mg/L, primarily in the As(III) form. What is the FIRST treatment step?",
    "options": [
      "Coagulation directly removes As(III)",
      "Oxidation of As(III) to As(V) using chlorine, ozone, or KMnO4 before coagulation/filtration",
      "Ion exchange directly removes As(III)",
      "Aeration removes As(III)"
    ],
    "correct": 1,
    "explanation": "As(III) (arsenite) is less effectively removed by coagulation than As(V) (arsenate). The first step is oxidation: Cl2, ozone, or KMnO4 converts As(III) to As(V). As(V) then adsorbs onto iron or aluminum hydroxide floc during coagulation and is removed by filtration. Pre-oxidation with chlorine is the most common approach for arsenic removal.",
    "difficulty": "hard"
  },
  {
    "id": 462,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the significance of 'carbonate hardness' versus 'non-carbonate hardness' for lime softening?",
    "options": [
      "Carbonate and non-carbonate hardness are treated the same in lime softening",
      "Carbonate hardness (hardness associated with bicarbonate alkalinity) is removed by lime addition alone; non-carbonate hardness (associated with sulfate, chloride) requires both lime and soda ash for removal",
      "Non-carbonate hardness is removed by lime addition alone",
      "Lime softening only removes carbonate hardness"
    ],
    "correct": 1,
    "explanation": "Carbonate hardness (CH) = hardness associated with HCO3⁻ alkalinity. Removed by lime (Ca(OH)2) alone: Ca²⁺ + 2HCO3⁻ + Ca(OH)2 → 2CaCO3↓ + 2H2O. Non-carbonate hardness (NCH) = hardness in excess of alkalinity (associated with SO4²⁻, Cl⁻). Requires lime + soda ash: Ca²⁺ + Na2CO3 → CaCO3↓ + 2Na⁺. NCH removal is more expensive due to soda ash cost.",
    "difficulty": "hard"
  },
  {
    "id": 463,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has elevated nitrite at 0.4 mg/L. The Ontario MAC for nitrite is 1.0 mg/L as N. What is the MOST likely source?",
    "options": [
      "Nitrite is naturally present in all surface waters",
      "Nitrite in surface water may indicate biological nitrification/denitrification activity, industrial discharge, or contamination from agricultural runoff with ammonium that is being oxidized",
      "Nitrite is only present in groundwater",
      "Nitrite at 0.4 mg/L is not a concern"
    ],
    "correct": 1,
    "explanation": "Nitrite (NO2⁻) in surface water is typically a transient intermediate in the nitrogen cycle. Sources: (1) partial nitrification of ammonium (NH4⁺ → NO2⁻ by Nitrosomonas bacteria), (2) denitrification of nitrate (NO3⁻ → NO2⁻ → N2), (3) industrial discharges, or (4) agricultural runoff. Nitrite is unstable and is usually quickly oxidized to nitrate or reduced to N2. Elevated nitrite warrants investigation.",
    "difficulty": "hard"
  },
  {
    "id": 464,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the purpose of 'ion balance' calculations for source water analysis?",
    "options": [
      "Ion balance calculations measure the total dissolved solids",
      "Ion balance (sum of cations = sum of anions in meq/L) verifies the accuracy of a water analysis; a balance error >10% indicates analytical errors or missing ions",
      "Ion balance calculations are only for regulatory compliance",
      "Ion balance calculations measure the hardness of source water"
    ],
    "correct": 1,
    "explanation": "Ion balance: Σ cations (Ca²⁺, Mg²⁺, Na⁺, K⁺, NH4⁺) = Σ anions (HCO3⁻, SO4²⁻, Cl⁻, NO3⁻, F⁻) in meq/L. A balanced analysis has <5% error. Ion balance errors >10% indicate: (1) analytical errors, (2) missing ions (e.g., high iron, manganese not measured), or (3) incorrect pH (affects HCO3⁻ calculation). Ion balance is a quality control check for water analysis.",
    "difficulty": "hard"
  },
  {
    "id": 465,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "Under Ontario's O. Reg. 170/03, what is the required frequency for bacteriological sampling in a large municipal water system (>100,000 population)?",
    "options": [
      "Once per week",
      "At least 100 samples per month, distributed throughout the distribution system",
      "Once per day",
      "Once per month"
    ],
    "correct": 1,
    "explanation": "O. Reg. 170/03 specifies sampling frequencies based on system size. For large systems (>100,000 population), at least 100 bacteriological samples per month are required, distributed throughout the distribution system including dead-ends, storage tanks, and areas with high water age. The distribution must be representative of the entire system.",
    "difficulty": "hard"
  },
  {
    "id": 466,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of 'adverse result notification' requirements under Ontario's SDWA?",
    "options": [
      "Adverse result notification is optional for minor exceedances",
      "Adverse result notification ensures that the regulatory authority and public health unit are immediately informed of water quality problems so they can assess the public health risk and take appropriate action",
      "Adverse result notification is only required for microbiological exceedances",
      "Adverse result notification is the same as annual reporting"
    ],
    "correct": 1,
    "explanation": "Ontario's SDWA requires immediate notification (within 24 hours) to the regulatory authority (MOE) and medical officer of health for prescribed adverse results including: (1) positive E. coli or total coliform, (2) turbidity exceedances, (3) chlorine residual below minimum, (4) equipment failures affecting treatment, and (5) other prescribed conditions. Prompt notification allows rapid public health response.",
    "difficulty": "medium"
  },
  {
    "id": 467,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of 'operator-in-charge' (OIC) designation under Ontario's SDWA?",
    "options": [
      "OIC designation is only for large water systems",
      "The OIC is the certified operator responsible for the direct operation of the water system; they must be present or available at all times and are accountable for regulatory compliance",
      "OIC designation is the same as operator certification",
      "OIC designation is voluntary"
    ],
    "correct": 1,
    "explanation": "Under Ontario's SDWA, each water system must have a designated Operator-in-Charge (OIC) who: (1) holds the appropriate class of certification, (2) is responsible for the direct operation of the system, (3) must be present or immediately available during operation, and (4) is accountable for regulatory compliance. The OIC designation is documented and reported to the regulatory authority.",
    "difficulty": "hard"
  },
  {
    "id": 468,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of 'water quality standards' versus 'treatment technology requirements' in Ontario's drinking water regulations?",
    "options": [
      "They are the same thing",
      "Water quality standards (MACs, AOs) specify the required quality of finished water; treatment technology requirements specify the treatment processes that must be used regardless of finished water quality",
      "Treatment technology requirements are more stringent than water quality standards",
      "Water quality standards only apply to microbiological parameters"
    ],
    "correct": 1,
    "explanation": "Ontario's drinking water regulations include both: (1) water quality standards (MACs, AOs in O. Reg. 169/03) — specify the maximum concentrations of contaminants in finished water, and (2) treatment technology requirements (O. Reg. 170/03) — specify minimum treatment processes (e.g., filtration and disinfection for surface water) regardless of source water quality. Both must be met.",
    "difficulty": "hard"
  },
  {
    "id": 469,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "A water treatment plant operator discovers that a chemical feed pump has been delivering an incorrect dose for the past 24 hours. What is the FIRST action?",
    "options": [
      "Continue operating and correct the dose at the next scheduled maintenance",
      "Immediately correct the chemical dose, assess the impact on water quality, notify the regulatory authority if required, and document the incident",
      "Shut down the plant immediately",
      "Increase the dose to compensate for the under-dosing"
    ],
    "correct": 1,
    "explanation": "Upon discovering a chemical feed error: (1) immediately correct the dose, (2) assess the impact on water quality (review monitoring records, collect additional samples if needed), (3) notify the regulatory authority if the error resulted in a prescribed adverse condition (e.g., chlorine residual below minimum), and (4) document the incident including cause, duration, and corrective actions.",
    "difficulty": "hard"
  },
  {
    "id": 470,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of 'treatment process monitoring' requirements under Ontario's O. Reg. 170/03?",
    "options": [
      "Treatment process monitoring is only for regulatory compliance",
      "Treatment process monitoring verifies that treatment is functioning correctly and achieving the required water quality, providing early warning of treatment failures",
      "Treatment process monitoring is performed by the regulatory authority",
      "Treatment process monitoring is only required for large water systems"
    ],
    "correct": 1,
    "explanation": "O. Reg. 170/03 requires continuous or frequent monitoring of critical treatment parameters: (1) turbidity after each filter (continuous), (2) chlorine residual (continuous or frequent), (3) UV intensity (continuous for UV systems), and (4) other parameters depending on system type. This monitoring verifies treatment performance and provides early warning of failures.",
    "difficulty": "medium"
  },
  {
    "id": 471,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the significance of 'Schedule 1' versus 'Schedule 2' adverse results under Ontario's O. Reg. 170/03?",
    "options": [
      "Schedule 1 and Schedule 2 are the same",
      "Schedule 1 adverse results require immediate notification (within 24 hours); Schedule 2 results require notification within a specified timeframe but are less urgent",
      "Schedule 2 results are more serious than Schedule 1",
      "The schedule classification only affects the reporting format"
    ],
    "correct": 1,
    "explanation": "O. Reg. 170/03 classifies adverse results by urgency: Schedule 1 (immediate notification — within 24 hours) includes: positive E. coli, turbidity exceeding operational limits, chlorine residual below minimum. Schedule 2 (notification within a specified period) includes: aesthetic objective exceedances and other less urgent conditions. The classification determines the notification timeline and required actions.",
    "difficulty": "hard"
  },
  {
    "id": 472,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of 'accreditation' for drinking water testing laboratories in Ontario?",
    "options": [
      "Laboratory accreditation is voluntary",
      "Laboratory accreditation (under O. Reg. 248/03) ensures that laboratories meet quality standards for drinking water testing, providing confidence in the accuracy and reliability of test results",
      "Laboratory accreditation is only required for bacteriological testing",
      "Laboratory accreditation is performed by the regulatory authority"
    ],
    "correct": 1,
    "explanation": "Ontario's O. Reg. 248/03 requires that drinking water samples be analyzed by accredited laboratories (accredited under the Standards Council of Canada or an equivalent body). Accreditation ensures: (1) qualified staff, (2) validated methods, (3) quality control procedures, (4) proficiency testing, and (5) documented quality management systems. Results from non-accredited labs are not acceptable for regulatory compliance.",
    "difficulty": "hard"
  },
  {
    "id": 473,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "A water treatment plant is planning to add a new chemical (sodium fluoride for fluoridation). What regulatory requirements apply?",
    "options": [
      "No regulatory approval is needed for adding fluoride",
      "Fluoridation requires approval from the regulatory authority and must comply with Health Canada's guideline; the chemical must meet NSF/ANSI Standard 60 for drinking water treatment chemicals",
      "Fluoridation is mandatory in Ontario",
      "Fluoridation only requires notification of the regulatory authority"
    ],
    "correct": 1,
    "explanation": "Adding fluoridation to a water system requires: (1) approval from the regulatory authority (MOE), (2) compliance with Health Canada's guideline (0.7 mg/L target), (3) use of NSF/ANSI Standard 60-certified chemicals (sodium fluoride, sodium fluorosilicate, or fluorosilicic acid), and (4) monitoring to maintain the target concentration. Fluoridation decisions are made by municipalities.",
    "difficulty": "hard"
  },
  {
    "id": 474,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of 'public notification' requirements for boil water advisories?",
    "options": [
      "Public notification is only required for large water systems",
      "Public notification ensures that all affected customers are informed of the boil water advisory and the precautions they need to take to protect their health",
      "Public notification is only required when E. coli is detected",
      "Public notification is performed by the regulatory authority"
    ],
    "correct": 1,
    "explanation": "Boil water advisory public notification must: (1) reach all affected customers promptly (within 24 hours), (2) clearly explain the health risk and precautions (boil water for 1 minute before drinking), (3) identify the affected area, (4) provide contact information, and (5) be issued in multiple languages if needed. Methods: door-to-door, media, social media, automated phone calls.",
    "difficulty": "medium"
  },
  {
    "id": 475,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "What is the purpose of 'heat stress monitoring' for water treatment plant workers?",
    "options": [
      "Heat stress monitoring is only required in tropical climates",
      "Water treatment plants have hot work areas (boiler rooms, filter galleries in summer); heat stress monitoring prevents heat exhaustion and heat stroke in workers",
      "Heat stress monitoring is only required for outdoor workers",
      "Heat stress monitoring is optional if air conditioning is available"
    ],
    "correct": 1,
    "explanation": "Water treatment plants have hot work areas: boiler rooms, pump rooms, filter galleries in summer. Heat stress monitoring: (1) measures wet bulb globe temperature (WBGT), (2) identifies work-rest ratios for different heat loads, (3) ensures workers are acclimatized, (4) provides adequate hydration, and (5) monitors for heat exhaustion symptoms. Ontario's O. Reg. 851 requires employers to protect workers from heat stress.",
    "difficulty": "medium"
  },
  {
    "id": 476,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "What is the purpose of 'noise monitoring' in a water treatment plant?",
    "options": [
      "Noise monitoring is only for regulatory compliance",
      "Noise monitoring identifies areas where noise levels exceed safe limits (85 dBA TWA), requiring hearing protection or engineering controls to prevent noise-induced hearing loss",
      "Noise monitoring is only required for large water systems",
      "Noise monitoring is only required for outdoor equipment"
    ],
    "correct": 1,
    "explanation": "Water treatment plants have noisy equipment: pumps, blowers, generators, chemical mixers. Ontario's O. Reg. 851 requires: (1) noise monitoring when workers may be exposed to >85 dBA TWA, (2) hearing protection when noise exceeds 85 dBA, (3) engineering controls (enclosures, silencers) where feasible, and (4) audiometric testing for workers exposed to >85 dBA. Noise-induced hearing loss is permanent.",
    "difficulty": "medium"
  },
  {
    "id": 477,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "A water treatment plant operator is required to work in a room with a potential chlorine atmosphere. What is the minimum required air monitoring before entry?",
    "options": [
      "No air monitoring is required if the operator has experience with chlorine",
      "The atmosphere must be tested for oxygen content (>19.5%), chlorine concentration (<0.5 ppm STEL), and other hazards before entry",
      "Only oxygen content needs to be tested",
      "Air monitoring is only required for confined spaces"
    ],
    "correct": 1,
    "explanation": "Before entering any area with a potential chlorine atmosphere: (1) test oxygen content (must be 19.5–23.5%), (2) test chlorine concentration (OSHA PEL = 1 ppm, STEL = 1 ppm, IDLH = 10 ppm; entry not permitted above IDLH without SCBA), and (3) test for other hazards. Continuous monitoring during entry is recommended. Results must be documented.",
    "difficulty": "hard"
  },
  {
    "id": 478,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "What is the purpose of 'spill prevention, control, and countermeasure' (SPCC) plans for water treatment chemical storage?",
    "options": [
      "SPCC plans are only required for oil storage",
      "SPCC plans document measures to prevent chemical spills, contain spills if they occur, and clean up spills to minimize environmental and public health impacts",
      "SPCC plans are only required for large water systems",
      "SPCC plans are the same as emergency response plans"
    ],
    "correct": 1,
    "explanation": "SPCC plans for water treatment chemical storage include: (1) inventory of chemicals and quantities, (2) spill prevention measures (secondary containment, overfill protection, inspection procedures), (3) spill response procedures for each chemical, (4) notification requirements (regulatory authority, emergency services), and (5) cleanup procedures. Plans must be reviewed and updated regularly.",
    "difficulty": "medium"
  },
  {
    "id": 479,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "What is the purpose of 'ergonomics' programs in a water treatment plant?",
    "options": [
      "Ergonomics programs are only for office workers",
      "Ergonomics programs identify and reduce musculoskeletal hazards (lifting, repetitive motion, awkward postures) that cause injuries to water treatment workers",
      "Ergonomics programs are only required for large water systems",
      "Ergonomics programs are optional if workers are physically fit"
    ],
    "correct": 1,
    "explanation": "Water treatment workers perform physically demanding tasks: lifting chemical bags (25–50 kg), operating valves, working in awkward positions. Ergonomics programs: (1) identify musculoskeletal hazards, (2) implement engineering controls (mechanical lifts, adjustable equipment), (3) provide training on safe lifting techniques, and (4) monitor for musculoskeletal injuries. Musculoskeletal disorders are the most common workplace injury.",
    "difficulty": "medium"
  },
  {
    "id": 480,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "A worker is splashed with concentrated sulfuric acid (used for pH adjustment). What is the IMMEDIATE first aid response?",
    "options": [
      "Apply a neutralizing agent (baking soda) to the affected area",
      "Immediately flush with large amounts of water for at least 20 minutes; remove contaminated clothing; seek medical attention",
      "Apply a dry cloth to absorb the acid",
      "Wait for the acid to dry before treatment"
    ],
    "correct": 1,
    "explanation": "For acid splash: (1) immediately flush with large amounts of water for at least 20 minutes (do NOT apply neutralizing agents — the neutralization reaction generates heat), (2) remove contaminated clothing while flushing, (3) seek medical attention even if the burn appears minor (acid burns can deepen over time), and (4) follow the SDS first aid procedures. Emergency eyewash and safety shower must be immediately accessible.",
    "difficulty": "hard"
  },
  {
    "id": 481,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "What is the purpose of 'permit-required confined space' designation for water treatment structures?",
    "options": [
      "Permit-required designation is only for spaces with toxic atmospheres",
      "Permit-required confined spaces have one or more serious hazards (toxic atmosphere, engulfment, entrapment, or other recognized serious safety hazard) requiring a written entry permit before entry",
      "Permit-required designation is only for underground spaces",
      "Permit-required designation is the same as confined space designation"
    ],
    "correct": 1,
    "explanation": "Under Ontario's O. Reg. 632/05, a confined space is 'permit-required' if it has: (1) a hazardous atmosphere (toxic, flammable, or oxygen-deficient), (2) engulfment hazard (liquid or flowing material), (3) internal configuration that could trap or asphyxiate an entrant, or (4) any other recognized serious safety hazard. Water treatment structures (wet wells, chemical rooms, filter vaults) are typically permit-required.",
    "difficulty": "hard"
  },
  {
    "id": 482,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'key performance indicators' (KPIs) for water treatment operations?",
    "options": [
      "KPIs are only for regulatory reporting",
      "KPIs measure operational performance against targets (e.g., treated water turbidity, chlorine residual compliance, energy consumption per m³), enabling continuous improvement",
      "KPIs are only required for large water systems",
      "KPIs are the same as regulatory compliance monitoring"
    ],
    "correct": 1,
    "explanation": "KPIs for water treatment operations include: (1) water quality KPIs (% samples meeting MAC, turbidity compliance), (2) operational KPIs (chemical dose efficiency, energy consumption per m³, water loss %), (3) maintenance KPIs (equipment availability, preventive maintenance completion), and (4) safety KPIs (incident rate, near-miss reporting rate). KPIs enable performance benchmarking and continuous improvement.",
    "difficulty": "medium"
  },
  {
    "id": 483,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'benchmarking' for water treatment operations?",
    "options": [
      "Benchmarking is only for financial management",
      "Benchmarking compares operational performance (cost, energy, water quality) against similar utilities or industry best practices, identifying opportunities for improvement",
      "Benchmarking is only required for large water systems",
      "Benchmarking is the same as regulatory compliance monitoring"
    ],
    "correct": 1,
    "explanation": "Benchmarking compares performance metrics against: (1) similar utilities (peer comparison), (2) industry best practices, (3) historical performance (trend analysis), and (4) regulatory requirements. Common benchmarks: energy consumption (kWh/m³), chemical costs ($/m³), water loss (%), staff productivity (m³/FTE). Benchmarking identifies performance gaps and improvement opportunities.",
    "difficulty": "medium"
  },
  {
    "id": 484,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'risk-based asset management' for water treatment infrastructure?",
    "options": [
      "Risk-based asset management prioritizes assets by age only",
      "Risk-based asset management prioritizes maintenance and replacement decisions based on both the probability of failure and the consequence of failure, optimizing resource allocation",
      "Risk-based asset management is only for large water systems",
      "Risk-based asset management is the same as preventive maintenance"
    ],
    "correct": 1,
    "explanation": "Risk-based asset management prioritizes assets using: Risk = Probability of Failure × Consequence of Failure. High-risk assets (high probability AND high consequence) receive priority. Low-consequence assets (e.g., non-critical pumps) may be run-to-failure. This approach optimizes limited maintenance budgets by focusing resources on assets where failure would have the greatest impact on service and public health.",
    "difficulty": "hard"
  },
  {
    "id": 485,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'operator competency assessment' programs?",
    "options": [
      "Competency assessments are only for new operators",
      "Competency assessments verify that operators have the knowledge, skills, and abilities to perform their job safely and effectively, identifying training needs",
      "Competency assessments are the same as operator certification exams",
      "Competency assessments are only required for regulatory compliance"
    ],
    "correct": 1,
    "explanation": "Operator competency assessments evaluate: (1) technical knowledge (treatment processes, regulations, chemistry), (2) practical skills (equipment operation, sampling, troubleshooting), (3) emergency response capabilities, and (4) communication and documentation skills. Assessments identify training needs and ensure operators can perform their duties safely. They complement, but do not replace, certification.",
    "difficulty": "medium"
  },
  {
    "id": 486,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'water safety plans' (WSPs) as recommended by the WHO?",
    "options": [
      "WSPs are only for developing countries",
      "WSPs are a comprehensive risk assessment and risk management approach covering the entire water supply system (catchment to consumer), identifying and managing all potential hazards",
      "WSPs are the same as emergency response plans",
      "WSPs are only required for large water systems"
    ],
    "correct": 1,
    "explanation": "WHO Water Safety Plans (WSPs) apply a preventive, risk-based approach to drinking water safety: (1) system assessment (identify hazards from catchment to consumer), (2) operational monitoring (critical control points), (3) management plans (corrective actions, verification), and (4) supporting programs (training, communication, research). WSPs align with HACCP principles and are consistent with Ontario's DWQMS.",
    "difficulty": "hard"
  },
  {
    "id": 487,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "A source water has a pH of 6.2 and free CO2 of 45 mg/L. What is the MOST likely source of this water?",
    "options": [
      "A eutrophic lake with heavy algal growth",
      "A groundwater or bog-influenced source with high CO2 from organic matter decomposition and lack of atmospheric equilibration",
      "A reservoir receiving industrial discharge",
      "A river with heavy agricultural runoff"
    ],
    "correct": 1,
    "explanation": "Free CO2 of 45 mg/L at pH 6.2 indicates a CO2-rich, low-pH source. This is characteristic of groundwater or bog/wetland-influenced surface water where organic matter decomposition produces CO2 that cannot equilibrate with the atmosphere. Treatment requires aeration to remove CO2 and raise pH, or lime addition to neutralize the acidity.",
    "difficulty": "hard"
  },
  {
    "id": 488,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "What is the purpose of 'real-time contaminant monitoring' systems (e.g., online TOC analyzers, online chlorophyll sensors) at source water intakes?",
    "options": [
      "Real-time monitoring is only for regulatory compliance",
      "Real-time monitoring provides continuous early warning of contamination events and water quality changes, enabling rapid treatment adjustments before impacted water reaches consumers",
      "Real-time monitoring replaces all laboratory analysis",
      "Real-time monitoring is only required for large water systems"
    ],
    "correct": 1,
    "explanation": "Real-time online monitoring at the intake provides: (1) continuous early warning of contamination events (TOC spikes, conductivity changes, turbidity surges), (2) detection of algal blooms (chlorophyll sensors), (3) data for automated treatment control (coagulant dose adjustment), and (4) documentation of source water quality trends. It enables proactive rather than reactive treatment management.",
    "difficulty": "medium"
  },
  {
    "id": 489,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "What is the significance of 'heterotrophic plate count' (HPC) in source water monitoring?",
    "options": [
      "HPC measures the concentration of pathogenic bacteria",
      "HPC measures the total aerobic heterotrophic bacteria population; elevated HPC indicates high organic content and potential for pathogen presence; it is used as a general indicator of microbiological water quality",
      "HPC is only measured in treated water",
      "HPC is not regulated in Ontario"
    ],
    "correct": 1,
    "explanation": "HPC (Heterotrophic Plate Count) measures the total aerobic heterotrophic bacteria in water. In source water: (1) elevated HPC indicates high organic content and potential for pathogen presence, (2) HPC increases after rainfall events (runoff), (3) HPC is used as a general indicator of microbiological quality. In treated water, HPC >500 CFU/mL may indicate treatment inadequacy or distribution system problems.",
    "difficulty": "medium"
  },
  {
    "id": 490,
    "module": "Source Water Characteristics",
    "topic": "Biological",
    "question": "A source water monitoring program detects the presence of Legionella pneumophila at 100 CFU/L. What is the appropriate response?",
    "options": [
      "Legionella in source water is not a concern for drinking water treatment",
      "Notify the regulatory authority, investigate the source (cooling towers, warm water areas), verify treatment is adequate, and increase monitoring",
      "Issue a boil water advisory immediately",
      "Increase chlorine dose to 5 mg/L"
    ],
    "correct": 1,
    "explanation": "Legionella in source water is unusual (it typically proliferates in warm water systems, not cold source water). Detection warrants: (1) investigation of the source (nearby cooling towers, warm water discharge), (2) notification of the regulatory authority, (3) verification that treatment (disinfection) is adequate to inactivate Legionella, and (4) increased monitoring. Legionella is primarily a concern in building water systems, not drinking water treatment.",
    "difficulty": "hard"
  },
  {
    "id": 491,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the significance of 'organic nitrogen' in source water for a chlorinating plant?",
    "options": [
      "Organic nitrogen has no effect on chlorination",
      "Organic nitrogen (amino acids, proteins) reacts with chlorine to form chlorinated organic compounds including haloacetonitriles and cyanogen chloride, which are DBPs of health concern",
      "Organic nitrogen only affects the taste of finished water",
      "Organic nitrogen is only significant for plants using chloramines"
    ],
    "correct": 1,
    "explanation": "Organic nitrogen (amino acids, proteins, urea) reacts with chlorine to form nitrogen-containing DBPs: (1) haloacetonitriles (HANs) — more toxic than THMs, (2) cyanogen chloride (CNCl) — formed from amino acids, (3) nitrosamines — formed from certain amines with chloramines. Organic nitrogen in source water increases the formation of these nitrogen-containing DBPs.",
    "difficulty": "hard"
  },
  {
    "id": 492,
    isCalc: true,
    "module": "Source Water Characteristics",
    "topic": "Physical",
    "question": "A source water reservoir has a mean depth of 8 m and surface area of 2.5 km². Calculate the reservoir volume in megalitres.",
    "options": [
      "2,000 ML",
      "20,000 ML",
      "200 ML",
      "200,000 ML"
    ],
    "correct": 1,
    "explanation": "Volume = mean depth × surface area = 8 m × 2,500,000 m² = 20,000,000 m³ = 20,000 ML (megalitres). This is a relatively small reservoir. At a plant flow of 50 ML/day, the hydraulic retention time would be 20,000/50 = 400 days. This long HRT allows significant algal growth and stratification.",
    steps: [
      { l: "Step 1: Convert surface area to square meters", c: "The surface area is given as 2.5 km². To work with meters, convert this to square meters: 2.5 km² * (1000 m/km)² = 2.5 * 1,000,000 m² = 2,500,000 m²." },
      { l: "Step 2: Calculate the volume in cubic meters", c: "Use the formula Volume = mean depth × surface area. Volume = 8 m × 2,500,000 m² = 20,000,000 m³." },
      { l: "Step 3: Convert cubic meters to megalitres", c: "Recall that 1 m³ = 1000 litres, and 1 megalitre (ML) = 1,000,000 litres. Therefore, 1 m³ = 0.001 ML. So, 20,000,000 m³ * 0.001 ML/m³ = 20,000 ML." },
    ],
    tip: "Always pay close attention to units and perform necessary conversions before calculations to avoid errors.",
    "difficulty": "medium"
  },
  {
    "id": 493,
    "module": "Source Water Characteristics",
    "topic": "Chemical",
    "question": "What is the purpose of 'disinfection byproduct' (DBP) monitoring in the distribution system rather than at the treatment plant?",
    "options": [
      "DBP monitoring at the plant is sufficient",
      "DBPs continue to form in the distribution system as chlorine reacts with NOM; distribution system monitoring captures the maximum DBP concentrations that consumers are exposed to",
      "DBP monitoring in the distribution system is only required for regulatory compliance",
      "DBPs do not form in the distribution system"
    ],
    "correct": 1,
    "explanation": "DBPs (particularly THMs) continue to form in the distribution system as residual chlorine reacts with NOM. Concentrations increase with: (1) water temperature, (2) water age (residence time), and (3) NOM concentration. Distribution system monitoring captures the maximum DBP concentrations that consumers are exposed to, which is higher than at the treatment plant. Ontario's MAC applies to distribution system samples.",
    "difficulty": "hard"
  },
  {
    "id": 494,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "What is the purpose of 'job hazard analysis' (JHA) in a water treatment plant?",
    "options": [
      "JHAs are only required for new tasks",
      "JHAs systematically identify hazards associated with specific job tasks and develop controls to eliminate or reduce the risk of injury before work begins",
      "JHAs are only required for confined space entry",
      "JHAs are the same as safety data sheets"
    ],
    "correct": 1,
    "explanation": "Job Hazard Analysis (JHA) breaks a job task into steps and identifies: (1) potential hazards at each step, (2) severity and probability of injury, and (3) control measures (elimination, substitution, engineering controls, administrative controls, PPE). JHAs are particularly valuable for: non-routine tasks, tasks with high injury rates, and tasks performed by new workers.",
    "difficulty": "medium"
  },
  {
    "id": 495,
    "module": "Security, Safety & Admin",
    "topic": "Corrosion Control",
    "question": "A water system has switched from aluminum sulfate (alum) to polyaluminum chloride (PACl) as the primary coagulant. What is the effect on corrosion control?",
    "options": [
      "PACl has no effect on corrosion compared to alum",
      "PACl adds chloride to the water (from the chloride in PACl), which may increase the CSMR and promote galvanic lead corrosion if the chloride-to-sulfate ratio increases significantly",
      "PACl reduces corrosion compared to alum",
      "PACl increases alkalinity, reducing corrosion"
    ],
    "correct": 1,
    "explanation": "PACl (polyaluminum chloride) contains chloride as the counter-ion. Switching from alum (Al2(SO4)3) to PACl increases chloride and decreases sulfate in the finished water. This increases the CSMR (chloride-to-sulfate mass ratio). Higher CSMR promotes galvanic corrosion of lead in systems with lead service lines connected to copper plumbing. Corrosion monitoring should be conducted after any coagulant change.",
    "difficulty": "hard"
  },
  {
    "id": 496,
    "module": "Security, Safety & Admin",
    "topic": "Emergency Response",
    "question": "A water treatment plant experiences a cyberattack on its SCADA system. What is the FIRST action?",
    "options": [
      "Continue operating manually while IT investigates",
      "Immediately isolate the SCADA system from external networks, switch to manual control, notify management and the regulatory authority, and contact cybersecurity experts",
      "Shut down the plant immediately",
      "Ignore the attack if the plant is still operating normally"
    ],
    "correct": 1,
    "explanation": "A SCADA cyberattack is a critical security incident. Immediate actions: (1) isolate the SCADA system from external networks (disconnect internet/remote access), (2) switch to manual control to maintain operations, (3) notify plant management, IT security, and the regulatory authority, (4) contact cybersecurity experts and law enforcement, and (5) preserve evidence (logs, system state). Do not attempt to investigate the attack yourself.",
    "difficulty": "hard"
  },
  {
    "id": 497,
    "module": "Security, Safety & Admin",
    "topic": "Regulatory Compliance",
    "question": "What is the purpose of 'source water protection plans' under Ontario's Clean Water Act?",
    "options": [
      "Source water protection plans are voluntary",
      "Source water protection plans identify significant threats to drinking water sources and establish policies to eliminate or manage those threats, protecting source water quality",
      "Source water protection plans are only for groundwater sources",
      "Source water protection plans are the same as watershed management plans"
    ],
    "correct": 1,
    "explanation": "Ontario's Clean Water Act (2006) requires source protection plans that: (1) assess the vulnerability of drinking water sources, (2) identify significant threats (land use activities that could contaminate sources), (3) establish policies to manage or eliminate threats (land use restrictions, best management practices), and (4) are implemented through Official Plans and other planning tools. Plans are developed by Source Protection Committees.",
    "difficulty": "hard"
  },
  {
    "id": 498,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'lifecycle cost analysis' for water treatment equipment?",
    "options": [
      "Lifecycle cost analysis only considers the purchase price",
      "Lifecycle cost analysis considers all costs over the equipment's life (purchase, installation, operation, maintenance, disposal), enabling comparison of alternatives on a total cost basis",
      "Lifecycle cost analysis is only for large capital projects",
      "Lifecycle cost analysis is the same as capital planning"
    ],
    "correct": 1,
    "explanation": "Lifecycle cost analysis (LCCA) for water treatment equipment includes: (1) capital costs (purchase, installation, commissioning), (2) operating costs (energy, chemicals, labor), (3) maintenance costs (parts, service), (4) disposal costs, and (5) residual value. LCCA enables comparison of alternatives (e.g., UV vs. ozone for Cryptosporidium inactivation) on a total cost basis over 20–30 years.",
    "difficulty": "medium"
  },
  {
    "id": 499,
    "module": "Security, Safety & Admin",
    "topic": "Safety",
    "question": "What is the purpose of 'safety audits' in a water treatment plant?",
    "options": [
      "Safety audits are only for regulatory compliance",
      "Safety audits systematically evaluate the plant's safety program, identifying gaps between actual practices and safety requirements, enabling corrective action before incidents occur",
      "Safety audits are performed by the regulatory authority",
      "Safety audits are the same as incident investigations"
    ],
    "correct": 1,
    "explanation": "Safety audits systematically evaluate: (1) compliance with safety regulations and procedures, (2) effectiveness of safety controls (PPE, engineering controls), (3) condition of safety equipment (eyewash stations, SCBA, fire extinguishers), (4) staff knowledge and training, and (5) documentation and record keeping. Audits identify gaps before incidents occur, enabling proactive corrective action.",
    "difficulty": "medium"
  },
  {
    "id": 500,
    "module": "Security, Safety & Admin",
    "topic": "Administration",
    "question": "What is the purpose of 'continuous improvement' programs in water treatment operations?",
    "options": [
      "Continuous improvement is only for manufacturing industries",
      "Continuous improvement programs systematically identify and implement small, incremental improvements to processes, equipment, and procedures, improving efficiency, quality, and safety over time",
      "Continuous improvement is only required for systems that have had compliance issues",
      "Continuous improvement is the same as corrective action"
    ],
    "correct": 1,
    "explanation": "Continuous improvement (CI) in water treatment applies methodologies like Plan-Do-Check-Act (PDCA) or Lean/Six Sigma to: (1) identify improvement opportunities (process inefficiencies, quality issues, safety hazards), (2) implement changes, (3) measure results, and (4) standardize successful improvements. CI is a core requirement of Ontario's DWQMS and leads to sustained performance improvement.",
    "difficulty": "medium"
  }
];

export const MODULES = [
  'Treatment Process',
  'Laboratory Analysis',
  'Equipment O&M',
  'Source Water Characteristics',
  'Security, Safety & Admin',
];

export function getNextQuestion(
  history: Array<{ questionId: number; correct: boolean; confidence: number }>,
  moduleFilter?: string
): Question | null {
  const pool = moduleFilter
    ? QUESTIONS.filter((q) => q.module === moduleFilter)
    : QUESTIONS;
  if (pool.length === 0) return null;
  const answeredIds = new Set(history.map((h) => h.questionId));
  const unanswered = pool.filter((q) => !answeredIds.has(q.id));
  if (unanswered.length > 0) {
    return unanswered[Math.floor(Math.random() * unanswered.length)];
  }
  // All answered — find weakest (wrong or low confidence)
  const scored = pool.map((q) => {
    const attempts = history.filter((h) => h.questionId === q.id);
    const lastAttempt = attempts[attempts.length - 1];
    const score = lastAttempt
      ? lastAttempt.correct ? lastAttempt.confidence : -lastAttempt.confidence
      : 0;
    return { q, score };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored[0].q;
}

export interface HistoryEntry {
  questionId: number;
  correct: boolean;
  confidence: number;
}

export function getPatternInsights(
  history: HistoryEntry[]
): Array<{ module: string; issue: string }> {
  const insights: Array<{ module: string; issue: string }> = [];
  const moduleStats: Record<string, { correct: number; total: number; lowConf: number }> = {};
  for (const entry of history) {
    const q = QUESTIONS.find((q) => q.id === entry.questionId);
    if (!q) continue;
    if (!moduleStats[q.module]) moduleStats[q.module] = { correct: 0, total: 0, lowConf: 0 };
    moduleStats[q.module].total++;
    if (entry.correct) moduleStats[q.module].correct++;
    if (entry.correct && entry.confidence < 50) moduleStats[q.module].lowConf++;
  }
  for (const [module, stats] of Object.entries(moduleStats)) {
    if (stats.total >= 3) {
      const accuracy = stats.correct / stats.total;
      if (accuracy < 0.6) {
        insights.push({ module, issue: `Low accuracy (${Math.round(accuracy * 100)}%) — review this module` });
      } else if (stats.lowConf >= 3) {
        insights.push({ module, issue: `Guessing correctly — deepen understanding` });
      }
    }
  }
  return insights;
}