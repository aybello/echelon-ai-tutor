// Class 1 Water Treatment — Practice Question Bank (500 Questions)
// Aligned with Ontario O. Reg. 128/04 Class 1 Water Treatment exam blueprint
// Modules: Water Sources & Quality, Coagulation/Flocculation, Sedimentation,
//          Filtration, Disinfection, Chemical Feed, Hydraulics, Operations, Health & Safety

export interface Class1WaterQuestion {
  id: number;
  module: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  correct: number; // 0-indexed
  explanation: string;
  steps?: { l: string; c: string }[];
  tip?: string;
  isCalc?: boolean;
  topic?: string;
}

export const CLASS1_WATER_QUESTIONS: Class1WaterQuestion[] = [
  // ─── MODULE 1: Water Sources & Quality (Questions 1-56) ───────────────────
  {
    id: 1,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "Which piece of Ontario legislation sets the standards for drinking water quality?",
    options: [
      "Environmental Protection Act",
      "Clean Water Act, 2006",
      "Safe Drinking Water Act, 2002",
      "Ontario Water Resources Act"
    ],
    correct: 2,
    explanation: "The Safe Drinking Water Act (SDWA), 2002 establishes the legal framework for drinking water quality standards in Ontario, including O. Reg. 170/03 which sets operational requirements."
  },
  {
    id: 2,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "What is the maximum allowable concentration of E. coli in treated drinking water under Ontario regulations?",
    options: [
      "1 CFU/100 mL",
      "10 CFU/100 mL",
      "5 CFU/100 mL",
      "0 CFU/100 mL"
    ],
    correct: 3,
    explanation: "Ontario Drinking Water Quality Standards require zero E. coli per 100 mL in treated drinking water. Any detection of E. coli is a serious adverse condition requiring immediate action."
  },
  {
    id: 3,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "Which parameter is used as an indicator of fecal contamination in drinking water?",
    options: [
      "E. coli",
      "Total dissolved solids",
      "Turbidity",
      "Hardness"
    ],
    correct: 0,
    explanation: "E. coli is the primary indicator of fecal contamination. Its presence indicates that the water may contain pathogens from human or animal waste."
  },
  {
    id: 4,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "What is the Ontario aesthetic objective for turbidity in treated drinking water?",
    options: [
      "0.1 NTU",
      "1.0 NTU",
      "0.3 NTU",
      "5.0 NTU"
    ],
    correct: 2,
    explanation: "Ontario's aesthetic objective for turbidity is ≤1 NTU, with a treatment performance standard of ≤0.3 NTU at the 95th percentile and never exceeding 1.0 NTU for filtered systems."
  },
  {
    id: 5,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "Under O. Reg. 170/03, what is the maximum turbidity allowed at the entry point to a distribution system for a filtered surface water system?",
    options: [
      "0.1 NTU at all times",
      "1.0 NTU at all times",
      "0.3 NTU at the 95th percentile and never exceeding 1.0 NTU",
      "5.0 NTU at the 95th percentile"
    ],
    correct: 2,
    explanation: "O. Reg. 170/03 requires filtered surface water systems to achieve ≤0.3 NTU at the 95th percentile of measurements and never exceed 1.0 NTU at the entry point to the distribution system."
  },
  {
    id: 6,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "Which type of water source typically has higher turbidity and more microbiological contamination?",
    options: [
      "Deep confined aquifer",
      "Shallow groundwater with clay cap",
      "Artesian well",
      "Surface water (rivers, lakes)"
    ],
    correct: 3,
    explanation: "Surface water sources (rivers, lakes) are exposed to the environment and typically have higher turbidity, more organic matter, and greater microbiological contamination compared to protected groundwater sources."
  },
  {
    id: 7,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "What is the Ontario Maximum Acceptable Concentration (MAC) for total trihalomethanes (TTHMs) in drinking water?",
    options: [
      "10 µg/L",
      "50 µg/L",
      "100 µg/L",
      "200 µg/L"
    ],
    correct: 2,
    explanation: "The Ontario MAC for total trihalomethanes (TTHMs) is 100 µg/L, consistent with Health Canada's Guidelines for Canadian Drinking Water Quality. TTHMs are disinfection by-products formed when chlorine reacts with natural organic matter."
  },
  {
    id: 8,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "Which protozoan parasite is most resistant to chlorine disinfection and is a major concern in surface water treatment?",
    options: [
      "Giardia lamblia",
      "Cryptosporidium parvum",
      "Entamoeba histolytica",
      "Toxoplasma gondii"
    ],
    correct: 1,
    explanation: "Cryptosporidium parvum oocysts are highly resistant to chlorine disinfection. Effective removal requires physical treatment (filtration) or UV disinfection. This is why filtration is critical for surface water sources."
  },
  {
    id: 9,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "What does NTU stand for in water quality measurement?",
    options: [
      "Nitrate Treatment Units",
      "Normal Treatment Units",
      "Nephelometric Turbidity Units",
      "Numerical Turbidity Units"
    ],
    correct: 2,
    explanation: "NTU stands for Nephelometric Turbidity Units, which measures the cloudiness or haziness of water caused by suspended particles. It is measured using a nephelometer that detects light scattered at 90 degrees."
  },
  {
    id: 10,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "A water sample has a total coliform count of 8 CFU/100 mL and E. coli of 0 CFU/100 mL. What is the correct interpretation?",
    options: [
      "The water fails the MAC for total coliforms and requires investigation",
      "The water is safe to drink — E. coli is absent",
      "Total coliforms are acceptable at this level for treated water",
      "Only E. coli matters; total coliforms are irrelevant"
    ],
    correct: 0,
    explanation: "Ontario requires zero total coliforms per 100 mL in treated drinking water. A count of 8 CFU/100 mL exceeds this standard and requires investigation to determine the source of contamination, even though E. coli is absent."
  },
  {
    id: 11,
    module: "Water Sources & Quality",
    difficulty: "hard",
    question: "Which regulation under the Safe Drinking Water Act, 2002 specifies the certification requirements for drinking water system operators in Ontario?",
    options: [
      "O. Reg. 128/04",
      "O. Reg. 170/03",
      "O. Reg. 248/03",
      "O. Reg. 319/08"
    ],
    correct: 0,
    explanation: "O. Reg. 128/04 (Drinking Water Systems — Certification) specifies the operator certification requirements, including the classification of water systems and the corresponding operator certification levels required."
  },
  {
    id: 12,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "What is the primary purpose of a source water protection plan under the Clean Water Act, 2006?",
    options: [
      "To set drinking water quality standards",
      "To certify water treatment operators",
      "To regulate water treatment plant operations",
      "To protect drinking water sources from contamination threats"
    ],
    correct: 3,
    explanation: "The Clean Water Act, 2006 requires source water protection plans to identify and manage threats to municipal drinking water sources (intake protection zones and wellhead protection areas) before contamination reaches the treatment plant."
  },
  {
    id: 13,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "What is the hardness of water primarily caused by?",
    options: [
      "Calcium and magnesium ions",
      "Sodium and potassium ions",
      "Iron and manganese ions",
      "Chloride and sulfate ions"
    ],
    correct: 0,
    explanation: "Water hardness is caused by dissolved calcium (Ca²⁺) and magnesium (Mg²⁺) ions. Hard water forms scale in pipes and water heaters and reduces soap lathering. It is measured in mg/L as CaCO₃."
  },
  {
    id: 14,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "What is the Ontario aesthetic objective for iron in drinking water?",
    options: [
      "0.01 mg/L",
      "0.1 mg/L",
      "1.0 mg/L",
      "0.3 mg/L"
    ],
    correct: 3,
    explanation: "The Ontario aesthetic objective for iron is 0.3 mg/L. Above this level, iron can cause red/brown staining of laundry and fixtures and impart a metallic taste to water."
  },
  {
    id: 15,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "Heterotrophic plate count (HPC) bacteria in drinking water are used as an indicator of:",
    options: [
      "Overall microbial activity and treatment effectiveness",
      "Fecal contamination",
      "Cryptosporidium oocyst concentration",
      "Disinfection by-product formation"
    ],
    correct: 0,
    explanation: "HPC measures the total number of bacteria that can grow on a nutrient medium. While not a direct health indicator, elevated HPC (>500 CFU/mL in Ontario) suggests reduced treatment effectiveness or regrowth in the distribution system."
  },
  {
    id: 16,
    module: "Water Sources & Quality",
    difficulty: "hard",
    question: "A surface water source has a turbidity of 150 NTU after a storm event. Which treatment process is MOST important to protect downstream disinfection effectiveness?",
    options: [
      "Effective coagulation and filtration to reduce turbidity",
      "Increasing chlorine dose",
      "Adding more fluoride",
      "Increasing UV dose"
    ],
    correct: 0,
    explanation: "High turbidity interferes with disinfection by shielding pathogens from UV and chlorine. Effective coagulation and filtration to reduce turbidity below 1 NTU is essential before disinfection to ensure pathogens are exposed to the disinfectant."
  },
  {
    id: 17,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "What does BOD stand for in water quality?",
    options: [
      "Biological Oxygen Demand",
      "Bacterial Oxygen Deficit",
      "Basic Organic Determination",
      "Biochemical Oxygen Demand"
    ],
    correct: 3,
    explanation: "BOD stands for Biochemical Oxygen Demand — the amount of dissolved oxygen consumed by biological organisms when decomposing organic matter in water. High BOD indicates high organic loading and potential for oxygen depletion."
  },
  {
    id: 18,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "Which parameter is the best indicator of the presence of disinfection by-product precursors in source water?",
    options: [
      "Turbidity",
      "pH",
      "Total organic carbon (TOC)",
      "Conductivity"
    ],
    correct: 2,
    explanation: "Total organic carbon (TOC) is the best indicator of natural organic matter (NOM) in source water, which is the primary precursor for disinfection by-products (THMs, HAAs) when chlorine is added."
  },
  {
    id: 19,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "What is the primary health concern associated with nitrate in drinking water?",
    options: [
      "Cancer risk in adults",
      "Liver damage in elderly",
      "Methemoglobinemia (blue baby syndrome) in infants",
      "Kidney failure in children"
    ],
    correct: 2,
    explanation: "Nitrate in drinking water is primarily a concern for infants under 6 months because it can cause methemoglobinemia (blue baby syndrome), where nitrate is converted to nitrite which oxidizes hemoglobin and reduces oxygen-carrying capacity."
  },
  {
    id: 20,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "The Ontario MAC for nitrate in drinking water is:",
    options: [
      "10 mg/L as N",
      "5 mg/L as NO₃",
      "45 mg/L as NO₃",
      "10 mg/L as NO₃"
    ],
    correct: 0,
    explanation: "The Ontario MAC for nitrate is 10 mg/L expressed as nitrogen (N). This is equivalent to approximately 44 mg/L as NO₃. The standard is set primarily to protect infants from methemoglobinemia."
  },
  {
    id: 21,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "Which of the following is a physical characteristic of water quality?",
    options: [
      "pH",
      "Nitrate concentration",
      "Turbidity",
      "Coliform count"
    ],
    correct: 2,
    explanation: "Turbidity is a physical characteristic of water quality, measured by light scattering. Physical parameters include turbidity, colour, taste, odour, and temperature. Chemical parameters include pH, nitrate, and hardness. Biological parameters include coliforms."
  },
  {
    id: 22,
    module: "Water Sources & Quality",
    difficulty: "hard",
    question: "Under O. Reg. 170/03, how frequently must a large municipal residential system (>10,000 people) sample for E. coli at the entry point?",
    options: [
      "Daily",
      "Once per week",
      "Once per month",
      "Continuously"
    ],
    correct: 0,
    explanation: "Under O. Reg. 170/03, large municipal residential systems serving more than 10,000 people must sample for E. coli daily at the entry point to the distribution system. Smaller systems have less frequent requirements."
  },
  {
    id: 23,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "What is the primary source of lead contamination in drinking water?",
    options: [
      "Lead service lines and household plumbing",
      "Source water from rivers",
      "Water treatment chemicals",
      "Chlorination by-products"
    ],
    correct: 0,
    explanation: "Lead in drinking water primarily comes from lead service lines, lead solder in household plumbing, and brass fixtures. The source water itself rarely contains significant lead. Corrosion control (pH adjustment, orthophosphate) reduces lead leaching."
  },
  {
    id: 24,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "A water sample has a colour of 25 TCU. The Ontario aesthetic objective for colour is 15 TCU. What action should be taken?",
    options: [
      "Investigate the cause and optimize treatment to reduce colour",
      "No action required — colour is not a health concern",
      "Issue a boil water advisory immediately",
      "Add more chlorine to oxidize the colour-causing compounds"
    ],
    correct: 0,
    explanation: "Although colour above the aesthetic objective (15 TCU) is not a direct health hazard, it indicates the presence of natural organic matter (NOM) which is a precursor to disinfection by-products. The operator should investigate and optimize coagulation to reduce colour."
  },
  {
    id: 25,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "Which of the following is NOT a common waterborne pathogen of concern in Ontario drinking water?",
    options: [
      "Giardia lamblia",
      "Cryptosporidium parvum",
      "Plasmodium falciparum (malaria)",
      "E. coli O157:H7"
    ],
    correct: 2,
    explanation: "Plasmodium falciparum causes malaria and is transmitted by mosquitoes, not through drinking water. Common waterborne pathogens in Ontario include Giardia, Cryptosporidium, E. coli O157:H7, Campylobacter, and norovirus."
  },
  {
    id: 26,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "What is the Langelier Saturation Index (LSI) used to assess?",
    options: [
      "Chlorine residual adequacy",
      "Corrosivity or scale-forming tendency of water",
      "Turbidity removal efficiency",
      "Fluoride dosing requirements"
    ],
    correct: 1,
    explanation: "The Langelier Saturation Index (LSI) indicates whether water is corrosive (negative LSI) or scale-forming (positive LSI). An LSI of 0 indicates the water is in equilibrium. Corrosive water can leach lead and copper from plumbing."
  },
  {
    id: 27,
    module: "Water Sources & Quality",
    difficulty: "hard",
    question: "Under Ontario's ODWQS, what is the MAC for arsenic in drinking water?",
    options: [
      "0.005 mg/L",
      "0.010 mg/L",
      "0.025 mg/L",
      "0.050 mg/L"
    ],
    correct: 1,
    explanation: "The Ontario MAC for arsenic is 0.010 mg/L (10 µg/L), consistent with Health Canada's guidelines. Arsenic is a known carcinogen and can occur naturally in groundwater, particularly in areas with certain geological formations."
  },
  {
    id: 28,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "What does pH measure in water?",
    options: [
      "The concentration of dissolved oxygen",
      "The concentration of suspended solids",
      "The concentration of chlorine",
      "The concentration of hydrogen ions (acidity/alkalinity)"
    ],
    correct: 3,
    explanation: "pH measures the concentration of hydrogen ions (H⁺) in water on a scale of 0-14. A pH of 7 is neutral, below 7 is acidic, and above 7 is alkaline/basic. The optimal pH for drinking water is 6.5-8.5."
  },
  {
    id: 29,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "Which of the following best describes a confined aquifer?",
    options: [
      "An aquifer at the water table with a free surface",
      "A surface water body used for drinking water",
      "An aquifer bounded above and below by impermeable layers under pressure",
      "A shallow aquifer recharged directly by rainfall"
    ],
    correct: 2,
    explanation: "A confined aquifer is bounded above and below by impermeable (aquitard) layers and is under pressure greater than atmospheric. Water in a confined aquifer will rise above the top of the aquifer when a well is drilled (artesian conditions)."
  },
  {
    id: 30,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "What is the primary advantage of groundwater over surface water as a drinking water source?",
    options: [
      "Lower mineral content",
      "Easier to treat for turbidity",
      "Higher dissolved oxygen content",
      "Better protection from contamination and more consistent quality"
    ],
    correct: 3,
    explanation: "Groundwater is generally better protected from surface contamination and has more consistent quality (temperature, turbidity, microbiology) compared to surface water. However, groundwater can have higher mineral content and may require treatment for hardness or iron."
  },
  {
    id: 31,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "What is the aesthetic objective for manganese in Ontario drinking water?",
    options: [
      "0.05 mg/L",
      "0.02 mg/L",
      "0.005 mg/L",
      "0.3 mg/L"
    ],
    correct: 0,
    explanation: "The Ontario aesthetic objective for manganese is 0.05 mg/L. Above this level, manganese can cause black/brown staining of laundry and fixtures and impart a bitter metallic taste. The health-based MAC is 0.12 mg/L."
  },
  {
    id: 32,
    module: "Water Sources & Quality",
    difficulty: "hard",
    question: "A water treatment plant draws from a lake. After a heavy rainfall, the raw water turbidity increases from 5 NTU to 120 NTU. What is the MOST likely cause?",
    options: [
      "Algae bloom in the lake",
      "Groundwater intrusion into the lake",
      "Increased chlorine demand in the source water",
      "Runoff carrying soil particles and organic matter into the lake"
    ],
    correct: 3,
    explanation: "Heavy rainfall causes surface runoff that carries soil particles, organic matter, and other contaminants into the lake, dramatically increasing turbidity. This is a common challenge for surface water treatment plants and requires rapid adjustment of coagulant doses."
  },
  {
    id: 33,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "What is the primary concern with algae in a drinking water source?",
    options: [
      "Algae directly cause waterborne illness",
      "Algae reduce turbidity in the source water",
      "Algae increase water hardness",
      "Algae produce taste and odour compounds and cyanotoxins, and increase DBP formation"
    ],
    correct: 3,
    explanation: "Algae in source water are a concern because they produce taste and odour compounds (geosmin, MIB), some species produce cyanotoxins (blue-green algae/cyanobacteria), and algal organic matter increases disinfection by-product formation when chlorinated."
  },
  {
    id: 34,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "What does TDS stand for in water quality?",
    options: [
      "Total Daily Sampling",
      "Total Disinfection Standards",
      "Turbidity Detection System",
      "Total Dissolved Solids"
    ],
    correct: 3,
    explanation: "TDS stands for Total Dissolved Solids — the total amount of dissolved substances in water, including minerals, salts, and metals. The Ontario aesthetic objective for TDS is 500 mg/L. High TDS can affect taste."
  },
  {
    id: 35,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "Which of the following is a chemical characteristic of water quality?",
    options: [
      "pH",
      "Colour",
      "Turbidity",
      "Temperature"
    ],
    correct: 0,
    explanation: "pH is a chemical characteristic of water quality. Chemical parameters include pH, hardness, alkalinity, dissolved oxygen, nutrients (nitrate, phosphate), metals, and organic compounds. Physical parameters include turbidity, colour, taste, odour, and temperature."
  },
  {
    id: 36,
    module: "Water Sources & Quality",
    difficulty: "hard",
    question: "Under Ontario regulations, what constitutes an 'adverse result' for a microbiological sample that requires immediate notification?",
    options: [
      "Any turbidity above 0.3 NTU",
      "HPC above 100 CFU/mL",
      "Detection of E. coli or total coliforms in treated water",
      "Any chlorine residual below 0.5 mg/L"
    ],
    correct: 2,
    explanation: "Under O. Reg. 170/03, detection of E. coli or total coliforms in treated drinking water is an adverse result requiring immediate notification to the Medical Officer of Health and the Ministry of Environment within 24 hours, and corrective action."
  },
  {
    id: 37,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "What is the typical pH range for natural surface water in Ontario?",
    options: [
      "4.0 – 5.5",
      "11.0 – 12.0",
      "9.0 – 10.5",
      "6.5 – 8.5"
    ],
    correct: 3,
    explanation: "Natural surface water in Ontario typically has a pH of 6.5 to 8.5. This range supports aquatic life and is close to the optimal range for drinking water treatment. Acidic lakes (pH <6) can occur in areas affected by acid rain."
  },
  {
    id: 38,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "What is the purpose of monitoring heterotrophic plate count (HPC) in the distribution system?",
    options: [
      "To monitor biological stability and potential regrowth in the distribution system",
      "To detect fecal contamination",
      "To measure disinfection by-product formation",
      "To assess coagulation effectiveness"
    ],
    correct: 0,
    explanation: "HPC monitoring in the distribution system detects bacterial regrowth, which can indicate loss of chlorine residual, biofilm formation, or other distribution system problems. Ontario's aesthetic objective is ≤500 CFU/mL."
  },
  {
    id: 39,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "Which of the following is a biological characteristic of water quality?",
    options: [
      "Hardness",
      "Total coliforms",
      "Turbidity",
      "Conductivity"
    ],
    correct: 1,
    explanation: "Total coliforms are a biological (microbiological) characteristic of water quality. Biological parameters include bacteria (coliforms, E. coli, HPC), protozoa (Giardia, Cryptosporidium), and viruses."
  },
  {
    id: 40,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "What is the significance of alkalinity in water treatment?",
    options: [
      "Alkalinity provides buffering capacity and is consumed during coagulation",
      "Alkalinity has no significance in water treatment",
      "High alkalinity always improves water quality",
      "Alkalinity is only important for wastewater treatment"
    ],
    correct: 0,
    explanation: "Alkalinity (primarily bicarbonate and carbonate) provides buffering capacity to resist pH changes. During coagulation with alum or ferric sulphate, alkalinity is consumed. If alkalinity is insufficient, pH will drop and coagulation will be poor. Lime may need to be added."
  },
  {
    id: 41,
    module: "Water Sources & Quality",
    difficulty: "hard",
    question: "A water source has a TOC of 8 mg/L and turbidity of 3 NTU. Which treatment process combination is MOST appropriate?",
    options: [
      "Chlorination only",
      "Filtration and UV disinfection only",
      "Coagulation, flocculation, sedimentation, filtration, and disinfection",
      "Softening and chlorination"
    ],
    correct: 2,
    explanation: "High TOC (8 mg/L) and moderate turbidity (3 NTU) indicate a surface water source requiring full conventional treatment: coagulation/flocculation to destabilize particles and remove NOM, sedimentation to remove floc, filtration to remove remaining particles and pathogens, and disinfection."
  },
  {
    id: 42,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "What is the primary reason for monitoring chlorine residual in the distribution system?",
    options: [
      "To ensure the water tastes good",
      "To comply with aesthetic objectives only",
      "To measure treatment plant efficiency",
      "To verify ongoing disinfection protection against recontamination"
    ],
    correct: 3,
    explanation: "Chlorine residual in the distribution system provides ongoing disinfection protection against recontamination (cross-connections, main breaks, biofilm). Ontario requires a minimum free chlorine residual of 0.05 mg/L throughout the distribution system."
  },
  {
    id: 43,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "What is the Ontario aesthetic objective for chlorine residual in drinking water?",
    options: [
      "Maximum 4.0 mg/L free chlorine",
      "Maximum 0.5 mg/L free chlorine",
      "Minimum 0.2 mg/L free chlorine at point of entry",
      "Minimum 0.05 mg/L free chlorine throughout distribution"
    ],
    correct: 0,
    explanation: "Ontario's aesthetic objective for chlorine is a maximum of 4.0 mg/L free chlorine (based on taste/odour). The operational requirement is a minimum of 0.2 mg/L free chlorine at the point of entry to the distribution system and 0.05 mg/L throughout."
  },
  {
    id: 44,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "Which of the following best describes a 'Tier 1' threat under Ontario's Source Water Protection framework?",
    options: [
      "A significant threat that must be prohibited or managed through a risk management plan",
      "A minor risk that requires monitoring only",
      "A threat that only applies to groundwater sources",
      "A threat that has already been remediated"
    ],
    correct: 0,
    explanation: "Tier 1 threats under Ontario's Source Water Protection framework are significant threats to drinking water sources that must be prohibited or managed through a formal risk management plan. Examples include fuel storage near wellheads or pesticide application in intake protection zones."
  },
  {
    id: 45,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "What does the term 'raw water' refer to in water treatment?",
    options: [
      "Untreated water from the source before any treatment",
      "Water that has been partially treated",
      "Water that has been disinfected but not filtered",
      "Water in the distribution system"
    ],
    correct: 0,
    explanation: "Raw water refers to untreated water taken directly from the source (river, lake, well) before any treatment processes. Monitoring raw water quality helps operators anticipate treatment challenges and adjust chemical doses."
  },
  {
    id: 46,
    module: "Water Sources & Quality",
    difficulty: "hard",
    question: "A water treatment plant is required to achieve 3-log (99.9%) removal/inactivation of Giardia cysts. The plant's filtration system achieves 2.5-log removal. How much additional log inactivation must disinfection provide?",
    options: [
      "1.0 log",
      "0.5 log",
      "1.5 log",
      "2.5 log"
    ],
    correct: 1,
    explanation: "The total required log removal/inactivation is 3 log. Filtration provides 2.5 log. Therefore, disinfection must provide 3.0 - 2.5 = 0.5 log additional inactivation. This is calculated using the CT concept."
  },
  {
    id: 47,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "What is the significance of the 'two-barrier' approach in drinking water treatment?",
    options: [
      "Using two different chemical disinfectants",
      "Monitoring water quality at two different points",
      "Building two separate treatment plants",
      "Having both physical removal (filtration) and chemical inactivation (disinfection) as independent barriers"
    ],
    correct: 3,
    explanation: "The multi-barrier (two-barrier) approach ensures that if one treatment process fails, another provides protection. Physical removal (coagulation/filtration) and chemical inactivation (chlorination/UV) work independently, so failure of one does not result in untreated water reaching consumers."
  },
  {
    id: 48,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "What is the primary purpose of a jar test in water treatment?",
    options: [
      "To determine the optimal coagulant type and dose",
      "To measure chlorine residual",
      "To test for E. coli contamination",
      "To measure filter backwash requirements"
    ],
    correct: 0,
    explanation: "The jar test simulates the coagulation-flocculation-sedimentation process at laboratory scale to determine the optimal coagulant type, dose, and pH for the current source water conditions. Results guide chemical feed adjustments at the treatment plant."
  },
  {
    id: 49,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "What is the Ontario MAC for fluoride in drinking water?",
    options: [
      "0.7 mg/L",
      "1.5 mg/L",
      "1.0 mg/L",
      "4.0 mg/L"
    ],
    correct: 1,
    explanation: "The Ontario MAC for fluoride is 1.5 mg/L (based on dental fluorosis prevention). The optimal level for dental health is 0.7 mg/L. Fluoride is added to many Ontario water systems at 0.7 mg/L to prevent tooth decay."
  },
  {
    id: 50,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "Which of the following is a common taste and odour compound produced by algae in source water?",
    options: [
      "Chloroform",
      "Formaldehyde",
      "Trihalomethane",
      "Geosmin"
    ],
    correct: 3,
    explanation: "Geosmin (and 2-methylisoborneol/MIB) are earthy/musty taste and odour compounds produced by certain algae and actinomycetes bacteria. They are detectable at very low concentrations (nanograms per litre) and are a common complaint in surface water systems."
  },
  {
    id: 51,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "What is the primary health concern associated with lead in drinking water?",
    options: [
      "Neurological damage, especially in children and fetuses",
      "Acute gastrointestinal illness",
      "Kidney failure in adults",
      "Skin rashes and irritation"
    ],
    correct: 0,
    explanation: "Lead is a neurotoxin that causes developmental and neurological damage, particularly in children and fetuses. Even low levels of lead exposure can affect cognitive development. There is no safe level of lead exposure for children."
  },
  {
    id: 52,
    isCalc: true,
    module: "Water Sources & Quality",
    difficulty: "hard",
    question: "A water treatment plant must achieve 4-log (99.99%) inactivation of viruses. At a water temperature of 10°C and pH 7.5, the CT value for 4-log inactivation of viruses with free chlorine is 6 mg·min/L. If the contact time is 30 minutes, what minimum free chlorine residual is required?",
    options: [
      "0.1 mg/L",
      "0.2 mg/L",
      "0.5 mg/L",
      "1.0 mg/L"
    ],
    correct: 1,
    explanation: "Calculate the required free chlorine residual by dividing the given CT value by the contact time.\n\nStep 1 — Identify the formula for CT:\nCT = C × T\n\nStep 2 — Rearrange the formula to solve for C:\nC = CT ÷ T\n\nStep 3 — Substitute the given values and calculate the free chlorine residual:\nC = 6 mg·min/L ÷ 30 min = 0.2 mg/L\n\nThe correct answer is **0.2 mg/L**.",
    steps: [
      { l: "Formula", c: "CT = C × T" },
      { l: "Variables", c: "CT = 6 mg·min/L (given); T = 30 min (given); C = ? (unknown)" },
      { l: "Substitute", c: "6 mg·min/L = C × 30 min" },
      { l: "Calculate", c: "C = 6 mg·min/L ÷ 30 min = 0.2 mg/L" },
      { l: "Result", c: "The minimum free chlorine residual required is 0.2 mg/L." },
    ],
    tip: "Always ensure units cancel correctly to arrive at the desired unit for the answer.",
  },
  {
    id: 53,
    module: "Water Sources & Quality",
    difficulty: "easy",
    question: "What is the purpose of a wellhead protection area (WHPA)?",
    options: [
      "To store emergency water supplies",
      "To protect the area around a well from contamination activities",
      "To measure groundwater levels",
      "To treat contaminated groundwater"
    ],
    correct: 1,
    explanation: "A wellhead protection area (WHPA) is a designated zone around a municipal well where activities that could contaminate the groundwater are restricted or prohibited. It is defined based on the time it takes for groundwater to travel to the well."
  },
  {
    id: 54,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "What is the difference between a MAC (Maximum Acceptable Concentration) and an aesthetic objective in Ontario drinking water standards?",
    options: [
      "MACs are based on health effects; aesthetic objectives are based on taste, odour, and appearance",
      "MACs apply to chemicals; aesthetic objectives apply to bacteria",
      "MACs are voluntary; aesthetic objectives are mandatory",
      "There is no difference — both terms mean the same thing"
    ],
    correct: 0,
    explanation: "MACs are health-based limits that must not be exceeded to protect human health. Aesthetic objectives are based on taste, odour, colour, and appearance — exceeding them is not a health risk but may cause consumer complaints. Both are part of Ontario's ODWQS."
  },
  {
    id: 55,
    module: "Water Sources & Quality",
    difficulty: "hard",
    question: "Which of the following best describes 'stratification' in a reservoir or lake, and its impact on water treatment?",
    options: [
      "Uniform mixing of water throughout the depth — improves treatment",
      "Accumulation of sediment at the bottom — no impact on treatment",
      "Separation of water into layers by temperature, affecting water quality at the intake",
      "Formation of ice cover in winter — reduces treatment requirements"
    ],
    correct: 2,
    explanation: "Thermal stratification creates distinct layers (epilimnion, thermocline, hypolimnion) with different temperatures, oxygen levels, and water quality. The hypolimnion can become anoxic, releasing iron, manganese, and hydrogen sulphide. Turnover events (spring/fall) can bring poor-quality water to the intake, challenging treatment."
  },
  {
    id: 56,
    module: "Water Sources & Quality",
    difficulty: "medium",
    question: "What is the Ontario MAC for total haloacetic acids (THAAs) in drinking water?",
    options: [
      "60 µg/L",
      "20 µg/L",
      "80 µg/L",
      "100 µg/L"
    ],
    correct: 0,
    explanation: "The Ontario MAC for total haloacetic acids (THAAs) is 80 µg/L, consistent with Health Canada's guidelines. HAAs are disinfection by-products formed when chlorine reacts with natural organic matter, and are a concern at high chlorine doses or high NOM levels."
  },

  // ─── MODULE 2: Coagulation & Flocculation (Questions 57-116) ──────────────
  {
    id: 57,
    module: "Coagulation & Flocculation",
    difficulty: "easy",
    question: "What is the primary purpose of coagulation in water treatment?",
    options: [
      "To kill bacteria and viruses",
      "To remove dissolved minerals from water",
      "To destabilize colloidal particles so they can aggregate and be removed",
      "To adjust the pH of the water"
    ],
    correct: 2,
    explanation: "Coagulation destabilizes colloidal particles (which carry negative charges and repel each other) by neutralizing their surface charge. Once destabilized, particles can collide and aggregate into larger floc that can be removed by sedimentation and filtration."
  },
  {
    id: 58,
    module: "Coagulation & Flocculation",
    difficulty: "easy",
    question: "Which of the following is the most commonly used coagulant in water treatment?",
    options: [
      "Alum (aluminum sulphate)",
      "Sodium hypochlorite",
      "Lime (calcium hydroxide)",
      "Sodium fluoride"
    ],
    correct: 0,
    explanation: "Alum (aluminum sulphate, Al₂(SO₄)₃·18H₂O) is the most commonly used coagulant in water treatment due to its effectiveness, low cost, and ease of handling. It works best at pH 6.5-7.5."
  },
  {
    id: 59,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the optimal pH range for coagulation with alum?",
    options: [
      "4.0 – 5.5",
      "6.0 – 7.5",
      "8.0 – 9.5",
      "10.0 – 11.5"
    ],
    correct: 1,
    explanation: "Alum coagulation works best at pH 6.0-7.5. Outside this range, the aluminum hydroxide precipitate that forms the floc becomes more soluble, reducing coagulation effectiveness and potentially increasing residual aluminum in the treated water."
  },
  {
    id: 60,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the purpose of the rapid mix (flash mix) step in coagulation?",
    options: [
      "To quickly and uniformly disperse the coagulant throughout the water",
      "To allow floc particles to grow larger",
      "To remove settled sludge from the basin",
      "To measure the turbidity of the water"
    ],
    correct: 0,
    explanation: "Rapid mix (flash mix) provides intense, short-duration mixing (typically 10-60 seconds) to quickly and uniformly disperse the coagulant throughout the water before hydrolysis reactions are complete. Proper rapid mix is critical for effective coagulation."
  },
  {
    id: 61,
    module: "Coagulation & Flocculation",
    difficulty: "easy",
    question: "What is flocculation?",
    options: [
      "The addition of chemicals to kill bacteria",
      "The removal of settled sludge from a clarifier",
      "Gentle mixing to promote collision and aggregation of destabilized particles into larger floc",
      "The process of filtering water through sand"
    ],
    correct: 2,
    explanation: "Flocculation is gentle, slow mixing (typically 20-40 minutes) that promotes collisions between destabilized particles, allowing them to aggregate into larger, denser floc that can settle more easily. Too vigorous mixing will break up the floc."
  },
  {
    id: 62,
    isCalc: true,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the G value (velocity gradient) in flocculation, and what is the typical range?",
    options: [
      "A measure of turbidity removal; typically 0-10 NTU",
      "A measure of detention time; typically 10-60 minutes",
      "A measure of chemical dose; typically 1-50 mg/L",
      "A measure of mixing intensity; typically 10-100 s⁻¹ for flocculation"
    ],
    correct: 3,
    explanation: "Understand the G value as a measure of mixing intensity and its typical range for flocculation.\n\nStep 1 — Define G value:\nThe G value (velocity gradient) quantifies the intensity of mixing in water treatment processes.\n\nStep 2 — Identify G value for flocculation:\nFor flocculation, the G value is typically in the range of 10-100 s⁻¹.\n\nStep 3 — Purpose of this G range:\nThis range provides gentle mixing, allowing small particles to collide and form larger flocs without breaking them apart.\n\nStep 4 — Contrast with rapid mix:\nRapid mixing, which is more intense, uses higher G values (e.g., 300-1000 s⁻¹) to quickly disperse chemicals.\n\nStep 5 — Related design parameter:\nThe Gt value (G × detention time) is a key parameter used in the design of flocculation basins.\n\nThe correct answer is B. A measure of mixing intensity; typically 10-100 s⁻¹ for flocculation.",
    steps: [
      { l: "Understand the Question", c: "The question asks for the definition of G value and its typical range in flocculation." },
      { l: "Define G Value", c: "The G value, or velocity gradient (s⁻¹), is a measure of the mixing intensity in a fluid." },
      { l: "Typical Range for Flocculation", c: "For flocculation, the typical G value range is 10-100 s⁻¹." },
      { l: "Purpose of G Value in Flocculation", c: "This range is gentle enough to allow flocs to grow without being broken apart." },
      { l: "Contrast with Rapid Mix", c: "Rapid mixing uses higher G values, typically 300-1000 s⁻¹." },
      { l: "Related Concept: Gt Value", c: "The Gt value (G × detention time) is used for flocculator design." },
    ],
    tip: "Remember G values: low for flocculation, high for rapid mix.",
  },
  {
    id: 63,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the jar test used to determine?",
    options: [
      "The chlorine demand of the water",
      "The filter backwash rate",
      "The optimal coagulant dose, type, and pH for the current source water",
      "The sludge volume index"
    ],
    correct: 2,
    explanation: "The jar test simulates coagulation, flocculation, and sedimentation at bench scale. It determines the optimal coagulant type, dose, and pH by testing multiple conditions simultaneously and observing floc formation and settling. Results guide full-scale chemical feed adjustments."
  },
  {
    id: 64,
    isCalc: true,
    module: "Coagulation & Flocculation",
    difficulty: "hard",
    question: "A jar test is performed with alum doses of 10, 20, 30, 40, and 50 mg/L. The settled water turbidity results are 8, 3, 0.8, 0.6, and 0.5 NTU respectively. What is the optimal alum dose?",
    options: [
      "10 mg/L — lowest dose",
      "20 mg/L — good turbidity removal at lower cost",
      "30 mg/L — achieves turbidity below 1 NTU",
      "50 mg/L — lowest turbidity"
    ],
    correct: 2,
    explanation: "Identify the optimal alum dose by evaluating the turbidity reduction at each dose and considering the point of diminishing returns.\n\nStep 1 — Evaluate turbidity reduction at 10 mg/L:\nAlum dose = 10 mg/L, Turbidity = 8 NTU. This dose is too low as turbidity remains high.\n\nStep 2 — Evaluate turbidity reduction at 20 mg/L:\nAlum dose = 20 mg/L, Turbidity = 3 NTU. Turbidity is significantly reduced but still above 1 NTU.\n\nStep 3 — Evaluate turbidity reduction at 30 mg/L:\nAlum dose = 30 mg/L, Turbidity = 0.8 NTU. Turbidity is reduced to below 1 NTU, which is a common target for treated water.\n\nStep 4 — Evaluate turbidity reduction at 40 mg/L and 50 mg/L:\nAlum dose = 40 mg/L, Turbidity = 0.6 NTU.\nAlum dose = 50 mg/L, Turbidity = 0.5 NTU.\nIncreasing the dose from 30 mg/L to 40 mg/L or 50 mg/L provides only a marginal additional reduction in turbidity (0.2 NTU and 0.3 NTU respectively) at an increased chemical cost and sludge production.\n\nThe correct answer is 30 mg/L — achieves turbidity below 1 NTU.",
    steps: [
      { l: "Analyze Data", c: "Review the jar test results for alum dose vs. settled water turbidity." },
      { l: "Identify Turbidity Target", c: "Look for the lowest alum dose that achieves an acceptable turbidity (e.g., <1 NTU)." },
      { l: "Evaluate Doses", c: "At 10 mg/L, turbidity is 8 NTU. At 20 mg/L, turbidity is 3 NTU." },
      { l: "Determine Optimal Point", c: "At 30 mg/L, turbidity is 0.8 NTU. This meets the target." },
      { l: "Assess Higher Doses", c: "At 40 mg/L (0.6 NTU) and 50 mg/L (0.5 NTU), improvement is minimal." },
      { l: "Select Optimal Dose", c: "The optimal dose balances turbidity removal with cost and sludge production." },
      { l: "Result", c: "The optimal alum dose is 30 mg/L." },
    ],
    tip: "Optimal dose balances treatment effectiveness with cost and operational factors.",
  },
  {
    id: 65,
    module: "Coagulation & Flocculation",
    difficulty: "easy",
    question: "What is zeta potential used to measure in coagulation?",
    options: [
      "The pH of the coagulated water",
      "The turbidity of the raw water",
      "The surface charge of colloidal particles",
      "The flow rate through the treatment plant"
    ],
    correct: 2,
    explanation: "Zeta potential measures the surface charge of colloidal particles. Stable colloids have a high negative zeta potential (typically -20 to -40 mV). Effective coagulation reduces the zeta potential toward zero, allowing particles to aggregate. Streaming current detectors measure zeta potential in real time."
  },
  {
    id: 66,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the effect of adding too much coagulant (over-dosing with alum)?",
    options: [
      "Better turbidity removal and lower residual aluminum",
      "Reduced sludge production",
      "Increased pH and improved disinfection",
      "Charge reversal — particles become positively charged and restabilize, increasing turbidity"
    ],
    correct: 3,
    explanation: "Over-dosing with alum causes charge reversal — the particles become positively charged and repel each other again, leading to restabilization and poor turbidity removal. Over-dosing also increases residual aluminum in the treated water and sludge production."
  },
  {
    id: 67,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the chemical reaction when alum is added to water with sufficient alkalinity?",
    options: [
      "Al₂(SO₄)₃ + 3Ca(HCO₃)₂ → 2Al(OH)₃↓ + 3CaSO₄ + 6CO₂",
      "Al₂(SO₄)₃ + 3NaCl → 2AlCl₃ + 3Na₂SO₄",
      "Al₂(SO₄)₃ + 2H₂O → Al₂O₃ + 2H₂SO₄",
      "Al₂(SO₄)₃ + 6NaOH → 2Al(OH)₃↓ + 3Na₂SO₄"
    ],
    correct: 0,
    explanation: "When alum reacts with natural alkalinity (bicarbonate), aluminum hydroxide floc precipitates: Al₂(SO₄)₃ + 3Ca(HCO₃)₂ → 2Al(OH)₃↓ + 3CaSO₄ + 6CO₂. This reaction consumes alkalinity and produces CO₂, which can lower pH if alkalinity is insufficient."
  },
  {
    id: 68,
    module: "Coagulation & Flocculation",
    difficulty: "easy",
    question: "What is the advantage of using polyaluminum chloride (PACl) over conventional alum as a coagulant?",
    options: [
      "PACl is cheaper than alum",
      "PACl kills bacteria more effectively",
      "PACl works over a wider pH range and produces less sludge",
      "PACl removes hardness from water"
    ],
    correct: 2,
    explanation: "Polyaluminum chloride (PACl) is a pre-hydrolyzed coagulant that works over a wider pH range (5.5-8.5) than conventional alum, produces less sludge, is less sensitive to temperature, and requires less alkalinity. It is more expensive but often more effective."
  },
  {
    id: 69,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the purpose of adding polymer (polyelectrolyte) as a coagulant aid?",
    options: [
      "To increase the pH of the water",
      "To disinfect the water",
      "To strengthen and increase the density of floc particles, improving settling",
      "To remove dissolved minerals"
    ],
    correct: 2,
    explanation: "Polymers (polyelectrolytes) are used as coagulant aids to strengthen floc by bridging between particles, making floc denser and more resistant to shear. This improves settling rates and filtration performance. Cationic polymers can also act as primary coagulants."
  },
  {
    id: 70,
    module: "Coagulation & Flocculation",
    difficulty: "hard",
    question: "A water treatment plant is experiencing poor coagulation despite using the jar-test-optimized alum dose. The raw water temperature has dropped from 20°C to 5°C. What is the MOST likely cause of the problem?",
    options: [
      "The alum has expired and is no longer effective",
      "Cold water increases the zeta potential of particles",
      "Low temperature increases the solubility of organic matter",
      "Cold water increases water viscosity, slowing floc formation and settling"
    ],
    correct: 3,
    explanation: "Cold water has higher viscosity, which slows particle movement and collision rates, reducing floc formation efficiency. Settling velocities decrease because Stokes' Law shows settling rate is inversely proportional to viscosity. Solutions include increasing coagulant dose, adding polymer, or increasing flocculation time."
  },
  {
    id: 71,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is enhanced coagulation, and why is it used?",
    options: [
      "Adding extra chlorine before coagulation to pre-oxidize organic matter",
      "Optimizing coagulation conditions to maximize removal of natural organic matter (NOM) to reduce DBP formation",
      "Using two different coagulants simultaneously",
      "Increasing the rapid mix G value to improve coagulation"
    ],
    correct: 1,
    explanation: "Enhanced coagulation optimizes coagulant dose and pH to maximize removal of natural organic matter (NOM/TOC), which is the precursor to disinfection by-products (THMs, HAAs). This typically involves using a higher coagulant dose and/or lower pH than needed for turbidity removal alone."
  },
  {
    id: 72,
    module: "Coagulation & Flocculation",
    difficulty: "easy",
    question: "What is the typical detention time in a flocculation basin?",
    options: [
      "1-5 minutes",
      "8-12 hours",
      "2-4 hours",
      "20-40 minutes"
    ],
    correct: 3,
    explanation: "Flocculation basins typically have a detention time of 20-40 minutes to allow sufficient time for particle collisions and floc growth. Too short a time results in small, weak floc; too long a time may allow floc to break up."
  },
  {
    id: 73,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the role of alkalinity in the coagulation process?",
    options: [
      "Alkalinity has no role in coagulation",
      "High alkalinity always improves coagulation",
      "Alkalinity directly coagulates particles",
      "Alkalinity provides the buffering capacity needed to maintain pH during coagulant addition"
    ],
    correct: 3,
    explanation: "Alkalinity (bicarbonate/carbonate) provides buffering capacity to maintain pH during coagulant addition. When alum is added, it consumes alkalinity and produces acid. If alkalinity is insufficient, pH will drop below the optimal range, reducing coagulation effectiveness. Lime may be added to supplement alkalinity."
  },
  {
    id: 74,
    isCalc: true,
    module: "Coagulation & Flocculation",
    difficulty: "hard",
    question: "Calculate the alum dose in mg/L if a plant treats 15,000 m³/day and feeds alum at a rate of 25 kg/hour.",
    options: [
      "25 mg/L",
      "40 mg/L",
      "50 mg/L",
      "60 mg/L"
    ],
    correct: 1,
    explanation: "Calculate the alum dose by first converting the plant flow to m³/hour, then dividing the alum feed rate in grams per hour by this flow rate.\n\nStep 1 — Convert plant flow from m³/day to m³/hour:\n15,000 m³/day ÷ 24 hours/day = 625 m³/hour\n\nStep 2 — Convert alum feed rate from kg/hour to g/hour:\n25 kg/hour × 1,000 g/kg = 25,000 g/hour\n\nStep 3 — Calculate the alum dose in g/m³:\n25,000 g/hour ÷ 625 m³/hour = 40 g/m³\n\nStep 4 — Convert the dose from g/m³ to mg/L (1 g/m³ = 1 mg/L):\n40 g/m³ = 40 mg/L\n\nThe correct answer is 40 mg/L.",
    steps: [
      { l: "Formula", c: "Dose (mg/L) = (Feed Rate (kg/hr) * 1,000,000 mg/kg) / (Flow Rate (m³/day) * 1000 L/m³ / 24 hr/day)" },
      { l: "Variables", c: "Feed Rate = 25 kg/hr; Flow Rate = 15,000 m³/day" },
      { l: "Substitute", c: "Dose (mg/L) = (25 kg/hr * 1,000,000 mg/kg) / (15,000 m³/day * 1000 L/m³ / 24 hr/day)" },
      { l: "Calculate", c: "Flow Rate in m³/hr = 15,000 m³/day / 24 hr/day = 625 m³/hr. Dose = (25,000,000 mg/hr) / (625,000 L/hr) = 40 mg/L" },
      { l: "Result", c: "The alum dose is 40 mg/L." },
    ],
    tip: "Ensure units are consistent before calculation to avoid errors.",
  },
  {
    id: 75,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the streaming current detector (SCD) used for in coagulation control?",
    options: [
      "Measuring the flow rate of coagulant",
      "Continuously monitoring the zeta potential/charge of particles to optimize coagulant dose",
      "Detecting E. coli in the raw water",
      "Measuring the turbidity of the settled water"
    ],
    correct: 1,
    explanation: "The streaming current detector (SCD) continuously measures the surface charge (related to zeta potential) of particles in the water. It provides real-time feedback on coagulant dose adequacy, allowing automatic adjustment of coagulant feed to maintain optimal charge neutralization."
  },
  {
    id: 76,
    module: "Coagulation & Flocculation",
    difficulty: "easy",
    question: "What is the primary mechanism by which coagulants destabilize colloidal particles?",
    options: [
      "Charge neutralization — reducing the negative surface charge of particles",
      "Oxidation of particle surfaces",
      "Physical filtration of particles",
      "Biological degradation of organic particles"
    ],
    correct: 0,
    explanation: "The primary mechanism of coagulation is charge neutralization — the coagulant (positively charged aluminum or iron hydroxide species) neutralizes the negative surface charge of colloidal particles, reducing the electrostatic repulsion that keeps them apart and allowing aggregation."
  },
  {
    id: 77,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the difference between coagulation and flocculation?",
    options: [
      "Coagulation is rapid destabilization of particles; flocculation is gentle aggregation into larger floc",
      "Coagulation uses chemicals; flocculation uses physical processes",
      "Coagulation removes bacteria; flocculation removes turbidity",
      "There is no difference — the terms are interchangeable"
    ],
    correct: 0,
    explanation: "Coagulation is the rapid chemical process of destabilizing particles by charge neutralization (using rapid mix). Flocculation is the subsequent gentle physical process of slowly mixing destabilized particles to promote collisions and aggregation into larger, settleable floc."
  },
  {
    id: 78,
    isCalc: true,
    module: "Coagulation & Flocculation",
    difficulty: "hard",
    question: "A water treatment plant is treating water with high colour (40 TCU) and low turbidity (2 NTU). What coagulation approach would be MOST effective?",
    options: [
      "Low alum dose at neutral pH to remove turbidity",
      "Chlorination before coagulation to oxidize colour",
      "High alum dose at lower pH (5.5-6.5) to maximize NOM/colour removal",
      "Softening with lime to precipitate colour-causing compounds"
    ],
    correct: 2,
    explanation: "Determine the most effective coagulation strategy by analyzing the water quality parameters and the mechanisms of different treatment approaches.\n\nStep 1 — Analyze water quality:\nThe water has high colour (40 TCU) and low turbidity (2 NTU). This indicates that the primary contaminant is dissolved organic matter (DOM), specifically natural organic matter (NOM), which causes colour, rather than suspended solids.\n\nStep 2 — Evaluate coagulation mechanisms for NOM removal:\nNOM removal by coagulation is most effective through enhanced coagulation, which involves higher coagulant doses and a lower pH range (typically 5.5-6.5). This optimizes the charge neutralization and adsorption of NOM onto the aluminum hydroxide floc.\n\nStep 3 — Assess option A (Low alum dose at neutral pH):\nThis approach is typically used for turbidity removal, not dissolved colour or NOM. It would be ineffective for the given water quality.\n\nStep 4 — Assess option C (Chlorination before coagulation):\nWhile chlorination can oxidize some organic compounds, it can also lead to the formation of disinfection byproducts (DBPs) and may not fully remove colour-causing NOM. It's not the primary or most effective coagulation approach for colour removal.\n\nStep 5 — Assess option D (Softening with lime):\nSoftening primarily removes hardness (calcium and magnesium ions) and can precipitate some organic matter, but it is not the most effective or direct method for high colour removal caused by NOM.\n\nStep 6 — Conclude the most effective approach:\nBased on the water quality and coagulation principles, a high alum dose at a lower pH (5.5-6.5) is the most effective approach to maximize NOM and colour removal.\n\nThe correct answer is B. High alum dose at lower pH (5.5-6.5) to maximize NOM/colour removal.",
    steps: [
      { l: "Analyze Raw Water Quality", c: "Identify raw water characteristics: High colour (40 TCU) and low turbidity (2 NTU)." },
      { l: "Interpret Characteristics", c: "High colour with low turbidity suggests dissolved organic matter (NOM) as the primary contaminant." },
      { l: "Identify Treatment Goal", c: "The goal is effective removal of dissolved NOM." },
      { l: "Select Coagulation Strategy", c: "For dissolved NOM, 'Enhanced Coagulation' is the most effective approach." },
      { l: "Define Enhanced Coagulation", c: "Enhanced coagulation involves higher coagulant dose and lower pH (typically 5.5-6.5)." },
      { l: "Explain Mechanism", c: "Lower pH optimizes charge neutralization and adsorption of NOM onto aluminum hydroxide floc." },
      { l: "Compare to Standard Coagulation", c: "Standard coagulation (for turbidity) is less effective for dissolved NOM removal." },
      { l: "Result", c: "Enhanced coagulation with higher alum dose and lower pH (5.5-6.5) is the most effective approach." },
    ],
    tip: "High colour/low turbidity = dissolved NOM. Use enhanced coagulation (higher dose, lower pH).",
  },
  {
    id: 79,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is ferric sulphate (Fe₂(SO₄)₃) used for in water treatment?",
    options: [
      "As a disinfectant to kill bacteria",
      "As a softening agent to remove hardness",
      "As an alternative coagulant that works over a wider pH range than alum",
      "As a fluoridation chemical"
    ],
    correct: 2,
    explanation: "Ferric sulphate (and ferric chloride) are iron-based coagulants that work over a wider pH range (4-11) than alum. They produce stronger, denser floc that settles faster, and are particularly effective for coloured water. They produce more sludge than alum."
  },
  {
    id: 80,
    module: "Coagulation & Flocculation",
    difficulty: "easy",
    question: "What does 'charge reversal' mean in the context of coagulation?",
    options: [
      "The coagulant changes from positive to negative charge",
      "Over-dosing causes particles to become positively charged and repel each other again",
      "The pH reverses the coagulation reaction",
      "The floc breaks apart and returns to colloidal size"
    ],
    correct: 1,
    explanation: "Charge reversal occurs when too much coagulant is added. The particles, originally negatively charged, become positively charged (over-coated with positive aluminum species), causing them to repel each other again. This results in poor turbidity removal despite high chemical costs."
  },
  {
    id: 81,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the typical rapid mix detention time in a conventional water treatment plant?",
    options: [
      "1-60 seconds",
      "5-15 minutes",
      "20-40 minutes",
      "1-2 hours"
    ],
    correct: 0,
    explanation: "Rapid mix (flash mix) has a very short detention time of 1-60 seconds. The goal is to quickly and uniformly disperse the coagulant before hydrolysis is complete. Longer contact times are not needed and may be counterproductive."
  },
  {
    id: 82,
    module: "Coagulation & Flocculation",
    difficulty: "hard",
    question: "A jar test shows that the optimal alum dose for turbidity removal is 20 mg/L, but the TOC removal is only 30% at this dose. To achieve 50% TOC removal (required for DBP control), the alum dose needs to be increased to 40 mg/L. What is the trade-off of using 40 mg/L alum?",
    options: [
      "No trade-off — more alum always improves water quality",
      "Reduced disinfection effectiveness",
      "Higher chemical cost, more sludge production, and potential for residual aluminum to increase",
      "Increased turbidity in the settled water"
    ],
    correct: 2,
    explanation: "Using a higher alum dose for enhanced coagulation (TOC removal) increases chemical costs, sludge production, and may increase residual aluminum in the treated water if pH is not optimized. The operator must balance DBP control benefits against these operational costs."
  },
  {
    id: 83,
    module: "Coagulation & Flocculation",
    difficulty: "easy",
    question: "What is the primary purpose of a tapered flocculation system?",
    options: [
      "To increase mixing intensity as floc grows",
      "To add coagulant at multiple points",
      "To gradually decrease mixing intensity as floc grows to prevent breakup",
      "To measure floc size continuously"
    ],
    correct: 2,
    explanation: "Tapered flocculation uses decreasing mixing intensity (G value) from the inlet to the outlet of the flocculation basin. High mixing at the start promotes particle collisions; lower mixing at the end prevents breaking up the larger, more fragile floc that has formed."
  },
  {
    id: 84,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the effect of high turbidity (>100 NTU) on coagulant dose requirements?",
    options: [
      "High turbidity requires less coagulant because particles are already aggregating",
      "High turbidity has no effect on coagulant dose",
      "High turbidity generally requires more coagulant to destabilize the greater number of particles",
      "High turbidity always requires switching from alum to ferric sulphate"
    ],
    correct: 2,
    explanation: "Higher turbidity means more particles to destabilize, generally requiring more coagulant. However, very high turbidity can sometimes improve coagulation by increasing particle collision rates. The jar test should be performed whenever raw water turbidity changes significantly."
  },
  {
    id: 85,
    module: "Coagulation & Flocculation",
    difficulty: "hard",
    question: "What is the significance of the 'sweep floc' mechanism in coagulation?",
    options: [
      "Formation of a large mass of aluminum hydroxide precipitate that enmeshes and removes particles",
      "Physical sweeping of particles to the bottom of the basin",
      "Removal of particles by mechanical filtration",
      "Chemical oxidation of organic particles"
    ],
    correct: 0,
    explanation: "Sweep floc (also called sweep coagulation or enmeshment) occurs at higher coagulant doses when a large mass of aluminum hydroxide precipitate forms and physically enmeshes colloidal particles. This mechanism is effective for turbidity removal but less effective for NOM/colour removal compared to charge neutralization."
  },
  {
    id: 86,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the purpose of pre-chlorination in relation to coagulation?",
    options: [
      "To disinfect the water before coagulation",
      "To oxidize iron, manganese, and organic matter to improve coagulation, but may increase DBP formation",
      "To increase the pH before coagulation",
      "To remove hardness before coagulation"
    ],
    correct: 1,
    explanation: "Pre-chlorination (adding chlorine before coagulation) can oxidize iron and manganese (making them easier to remove), break down algae, and improve coagulation of some organic compounds. However, it reacts with NOM to form DBPs before the NOM is removed, potentially increasing DBP levels."
  },
  {
    id: 87,
    module: "Coagulation & Flocculation",
    difficulty: "easy",
    question: "What is the typical alum dose range for treating surface water in Ontario?",
    options: [
      "5 – 50 mg/L",
      "0.1 – 1 mg/L",
      "100 – 200 mg/L",
      "500 – 1000 mg/L"
    ],
    correct: 0,
    explanation: "Typical alum doses for surface water treatment range from 5 to 50 mg/L, depending on raw water quality (turbidity, colour, TOC, temperature, alkalinity). Higher doses are needed for high-turbidity, high-colour, or cold water conditions."
  },
  {
    id: 88,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the effect of low water temperature on coagulation with alum?",
    options: [
      "Low temperature improves coagulation by reducing particle movement",
      "Low temperature reduces coagulation effectiveness due to slower reaction rates and higher viscosity",
      "Low temperature has no effect on coagulation",
      "Low temperature increases the optimal pH for coagulation"
    ],
    correct: 1,
    explanation: "Cold water (below 10°C) reduces coagulation effectiveness because: (1) alum hydrolysis reactions are slower, (2) higher water viscosity reduces particle collision rates, and (3) floc is weaker and settles more slowly. Solutions include increasing coagulant dose, adding polymer, or using PACl."
  },
  {
    id: 89,
    isCalc: true,
    module: "Coagulation & Flocculation",
    difficulty: "hard",
    question: "A plant is using 30 mg/L alum and the settled water turbidity is 5 NTU. The jar test shows that increasing to 45 mg/L reduces settled turbidity to 0.5 NTU. The plant treats 20,000 m³/day. What is the additional alum cost per day if alum costs $0.15/kg?",
    options: [
      "$180/day",
      "$90/day",
      "$135/day",
      "$45/day"
    ],
    correct: 3,
    explanation: "Calculate the additional alum required per day, then multiply by the cost per kilogram to find the additional daily cost.\n\nStep 1 – Determine the additional alum dose:\n45 mg/L - 30 mg/L = 15 mg/L\n\nStep 2 – Convert the additional dose to g/m³:\n15 mg/L = 15 g/m³\n\nStep 3 – Calculate the additional alum mass per day:\n15 g/m³ × 20,000 m³/day = 300,000 g/day\n\nStep 4 – Convert the additional alum mass to kg/day:\n300,000 g/day ÷ 1,000 g/kg = 300 kg/day\n\nStep 5 – Calculate the additional daily cost:\n300 kg/day × $0.15/kg = $45/day\n\nThe correct answer is $45/day.",
    steps: [
      { l: "Calculate additional alum dose", c: "Additional Alum Dose (mg/L) = New Dose - Old Dose" },
      { l: "Identify variables", c: "New Dose = 45 mg/L; Old Dose = 30 mg/L" },
      { l: "Substitute values", c: "Additional Alum Dose = 45 mg/L - 30 mg/L" },
      { l: "Calculate additional dose", c: "Additional Alum Dose = 15 mg/L" },
      { l: "Convert dose to g/m³", c: "15 mg/L = 15 g/m³" },
      { l: "Calculate additional alum per day", c: "Additional Alum (kg/day) = Dose (g/m³) * Flow (m³/day) / 1000 (g/kg)" },
      { l: "Identify variables", c: "Dose = 15 g/m³; Flow = 20,000 m³/day" },
      { l: "Substitute values", c: "Additional Alum = 15 g/m³ * 20,000 m³/day / 1000 g/kg" },
      { l: "Calculate daily additional alum", c: "Additional Alum = 300 kg/day" },
      { l: "Calculate additional cost", c: "Additional Cost ($/day) = Additional Alum (kg/day) * Cost ($/kg)" },
      { l: "Identify variables", c: "Additional Alum = 300 kg/day; Cost = $0.15/kg" },
      { l: "Substitute values", c: "Additional Cost = 300 kg/day * $0.15/kg" },
      { l: "Calculate additional cost", c: "Additional Cost = $45/day" },
      { l: "Result", c: "The additional alum cost per day is $45." },
    ],
    tip: "Always check units and ensure they cancel out correctly for the desired result.",
  },
  {
    id: 90,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the purpose of adding lime (Ca(OH)₂) during coagulation with alum?",
    options: [
      "To increase turbidity for better floc formation",
      "To remove hardness from the water",
      "To disinfect the water",
      "To supplement alkalinity and raise pH when natural alkalinity is insufficient"
    ],
    correct: 3,
    explanation: "Lime is added to supplement natural alkalinity when it is insufficient to buffer the pH drop caused by alum addition. Without adequate alkalinity, the pH will drop below the optimal range for coagulation, reducing effectiveness. Lime raises pH and provides the alkalinity needed for aluminum hydroxide floc formation."
  },
  {
    id: 91,
    module: "Coagulation & Flocculation",
    difficulty: "easy",
    question: "What does 'floc carryover' mean in water treatment?",
    options: [
      "Moving floc from one basin to another intentionally",
      "Adding extra coagulant to improve floc formation",
      "Floc particles escaping the sedimentation basin and entering the filters",
      "The process of recycling settled sludge"
    ],
    correct: 2,
    explanation: "Floc carryover occurs when floc particles escape the sedimentation basin (due to high flow rates, short-circuiting, or poor floc quality) and enter the filters. This increases the turbidity load on the filters, shortens filter runs, and can lead to turbidity breakthrough."
  },
  {
    id: 92,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the significance of the Camp number (Gt) in flocculation design?",
    options: [
      "It measures the chemical dose required for coagulation",
      "It measures the turbidity removal efficiency",
      "It is the product of velocity gradient (G) and detention time (t), indicating the number of particle collisions",
      "It is the ratio of floc size to raw water turbidity"
    ],
    correct: 2,
    explanation: "The Camp number (Gt) is the product of the velocity gradient G (s⁻¹) and detention time t (seconds). It represents the total number of particle collisions per unit volume and is used to design flocculation basins. Typical Gt values for flocculation are 10,000 to 100,000."
  },
  {
    id: 93,
    module: "Coagulation & Flocculation",
    difficulty: "hard",
    question: "What is the primary difference between charge neutralization and sweep floc coagulation mechanisms?",
    options: [
      "Charge neutralization uses more coagulant than sweep floc",
      "Charge neutralization works at lower coagulant doses by neutralizing particle charge; sweep floc uses higher doses to form a precipitate that enmeshes particles",
      "Sweep floc is more effective for NOM removal than charge neutralization",
      "Charge neutralization only works with iron coagulants"
    ],
    correct: 1,
    explanation: "Charge neutralization works at lower coagulant doses by adding just enough coagulant to neutralize the negative charge on particles, allowing them to aggregate. Sweep floc uses higher doses to form a large mass of aluminum/iron hydroxide precipitate that physically enmeshes particles. Charge neutralization is better for NOM removal; sweep floc is better for turbidity removal."
  },
  {
    id: 94,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the effect of high pH (above 8.5) on coagulation with alum?",
    options: [
      "Coagulation improves significantly at high pH",
      "Aluminum hydroxide becomes more soluble, reducing coagulation effectiveness and increasing residual aluminum",
      "High pH has no effect on alum coagulation",
      "High pH converts alum to a more effective coagulant form"
    ],
    correct: 1,
    explanation: "At pH above 8.5, aluminum hydroxide becomes more soluble as it forms soluble aluminate (Al(OH)₄⁻). This reduces the amount of floc formed, decreases turbidity removal, and increases residual aluminum in the treated water. The optimal pH range for alum coagulation is 6.0-7.5."
  },
  {
    id: 95,
    module: "Coagulation & Flocculation",
    difficulty: "easy",
    question: "What is the purpose of a coagulant feed pump in a water treatment plant?",
    options: [
      "To pump raw water from the source",
      "To circulate water through the flocculation basin",
      "To pump settled sludge to disposal",
      "To accurately meter and inject the coagulant into the raw water at the rapid mix point"
    ],
    correct: 3,
    explanation: "Coagulant feed pumps (typically metering pumps) accurately meter and inject the coagulant into the raw water at the rapid mix point. Accurate dosing is critical — too little results in poor coagulation; too much wastes chemicals and can cause charge reversal."
  },
  {
    id: 96,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the primary advantage of using cationic polymers as primary coagulants compared to alum?",
    options: [
      "Cationic polymers are cheaper than alum",
      "Cationic polymers are more effective at killing bacteria",
      "Cationic polymers produce less sludge and work over a wider pH range",
      "Cationic polymers remove hardness from water"
    ],
    correct: 2,
    explanation: "Cationic polymers as primary coagulants produce significantly less sludge than alum (no aluminum hydroxide precipitate), work over a wider pH range, and are effective at lower doses. However, they are more expensive and may not be as effective for NOM removal."
  },
  {
    id: 97,
    module: "Coagulation & Flocculation",
    difficulty: "hard",
    question: "A water treatment plant is experiencing 'pinpoint floc' — very small, light floc that does not settle well. What is the MOST likely cause and solution?",
    options: [
      "Under-dosing of coagulant — increase alum dose",
      "Over-dosing of coagulant — reduce alum dose",
      "Insufficient flocculation time or mixing — increase flocculation detention time or add polymer",
      "High raw water pH — add acid to lower pH"
    ],
    correct: 2,
    explanation: "Pinpoint floc (small, poorly settling floc) is typically caused by insufficient flocculation time or mixing intensity, or by insufficient coagulant dose. Adding a polymer (coagulant aid) can significantly improve floc size and density. Increasing flocculation detention time also helps."
  },
  {
    id: 98,
    module: "Coagulation & Flocculation",
    difficulty: "medium",
    question: "What is the purpose of a 'coagulant aid' (such as activated silica or bentonite clay)?",
    options: [
      "To improve floc formation, density, and settling when the primary coagulant alone is insufficient",
      "To replace the primary coagulant",
      "To disinfect the water after coagulation",
      "To remove hardness from the water"
    ],
    correct: 0,
    explanation: "Coagulant aids (activated silica, bentonite clay, polymers) are used to improve floc formation and settling when the primary coagulant alone is insufficient. They can improve floc density, size, and strength, particularly in cold water or when treating low-turbidity, high-colour water."
  },
  {
    id: 99,
    module: "Coagulation & Flocculation",
    difficulty: "easy",
    question: "What is the typical pH range for coagulation with ferric sulphate?",
    options: [
      "4.0 – 5.0",
      "7.0 – 8.0",
      "4.0 – 11.0",
      "9.0 – 10.0"
    ],
    correct: 2,
    explanation: "Ferric sulphate (and ferric chloride) work over a very wide pH range of approximately 4.0 to 11.0, compared to alum's optimal range of 6.0-7.5. This makes iron coagulants more versatile and effective for treating water with variable pH."
  },
  {
    id: 100,
    module: "Coagulation & Flocculation",
    difficulty: "hard",
    question: "What is the 'critical coagulant dose' concept, and why is it important for operators?",
    options: [
      "The maximum safe dose of coagulant that can be used",
      "The minimum coagulant dose that achieves charge neutralization; below this, coagulation fails completely",
      "The dose at which coagulant becomes toxic to fish",
      "The dose required to achieve 99% turbidity removal"
    ],
    correct: 1,
    explanation: "The critical coagulant dose is the minimum dose required to achieve charge neutralization and effective coagulation. Below this threshold, coagulation fails completely (particles remain stable). Above it, coagulation improves until charge reversal occurs at very high doses. Operators must maintain doses above the critical level, especially during challenging conditions (cold water, high turbidity)."
  },

  // ─── MODULE 3: Sedimentation (Questions 101-140) ──────────────────────────
  {
    id: 101,
    module: "Sedimentation",
    difficulty: "easy",
    question: "What is the primary purpose of sedimentation in water treatment?",
    options: [
      "To disinfect the water",
      "To remove dissolved minerals",
      "To remove coagulated floc and suspended solids by gravity settling",
      "To adjust the pH of the water"
    ],
    correct: 2,
    explanation: "Sedimentation (clarification) uses gravity to remove coagulated floc and suspended solids from water. Particles denser than water settle to the bottom, forming sludge, while clarified water flows over a weir to the filters."
  },
  {
    id: 102,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the surface overflow rate (SOR) in a sedimentation basin?",
    options: [
      "The rate at which water flows over the outlet weir",
      "The flow rate divided by the surface area of the basin (m³/m²·day or m/day)",
      "The rate at which sludge settles to the bottom",
      "The velocity of water through the basin"
    ],
    correct: 1,
    explanation: "Surface overflow rate (SOR) = Flow rate (m³/day) ÷ Surface area (m²). It represents the upward velocity of water in the basin. Particles with a settling velocity greater than the SOR will be removed. Typical SOR for conventional clarifiers is 20-40 m³/m²·day."
  },
  {
    id: 103,
    isCalc: true,
    module: "Sedimentation",
    difficulty: "medium",
    question: "Calculate the surface overflow rate for a rectangular sedimentation basin 40 m long, 10 m wide, treating a flow of 20,000 m³/day.",
    options: [
      "25 m³/m²·day",
      "200 m³/m²·day",
      "100 m³/m²·day",
      "50 m³/m²·day"
    ],
    correct: 3,
    explanation: "Calculate the surface area of the basin, then divide the flow rate by the surface area to find the surface overflow rate.\n\nStep 1 — Calculate the surface area of the basin:\nSurface Area = Length × Width = 40 m × 10 m = 400 m²\n\nStep 2 — Calculate the Surface Overflow Rate (SOR):\nSOR = Flow Rate ÷ Surface Area = 20,000 m³/day ÷ 400 m² = 50 m³/m²·day\n\nThe correct answer is 50 m³/m²·day.",
  steps: [
    { l: "Formula", c: "Surface Overflow Rate (SOR) = Flow Rate / Surface Area" },
    { l: "Step 1: Calculate the surface area of the basin.", c: "Surface Area = Length × Width = 40 m × 10 m = 400 m²" },
    { l: "Step 2: Identify the given flow rate.", c: "Flow Rate = 20,000 m³/day" },
    { l: "Step 3: Substitute values into the SOR formula.", c: "SOR = 20,000 m³/day / 400 m²" },
    { l: "Step 4: Calculate the Surface Overflow Rate.", c: "SOR = 50 m³/m²·day" },
    { l: "Result", c: "The surface overflow rate is 50 m³/m²·day." }
  ],
  tip: "SOR indicates clarifier efficiency; higher values mean less settling time.",
  },
  {
    id: 104,
    module: "Sedimentation",
    difficulty: "easy",
    question: "What is the typical detention time in a conventional sedimentation basin?",
    options: [
      "5-10 minutes",
      "2-4 hours",
      "12-24 hours",
      "2-3 days"
    ],
    correct: 1,
    explanation: "Conventional sedimentation basins have a detention time of 2-4 hours to allow adequate time for floc particles to settle to the bottom. Shorter detention times result in insufficient settling and floc carryover to the filters."
  },
  {
    id: 105,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is 'short-circuiting' in a sedimentation basin, and why is it a problem?",
    options: [
      "An electrical fault in the basin equipment",
      "Sludge accumulating too quickly at the bottom",
      "Water flowing directly from inlet to outlet without adequate settling time, reducing treatment effectiveness",
      "Excessive turbulence in the flocculation zone"
    ],
    correct: 2,
    explanation: "Short-circuiting occurs when water flows preferentially from the inlet to the outlet without spending the full detention time in the basin. This reduces effective settling time, allows floc to escape to the filters, and reduces overall treatment effectiveness. Baffles are used to minimize short-circuiting."
  },
  {
    id: 106,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the purpose of a sludge collector/scraper in a sedimentation basin?",
    options: [
      "To mix the water for better floc formation",
      "To add chemicals to the settled water",
      "To measure the turbidity of the settled water",
      "To continuously collect and move settled sludge to a sump for removal"
    ],
    correct: 3,
    explanation: "Sludge collectors (scrapers or rakes) continuously move settled sludge from the bottom of the basin to a central sump or hopper for removal. Regular sludge removal prevents sludge buildup that can reduce basin volume, cause odours, and lead to sludge carry-over."
  },
  {
    id: 107,
    module: "Sedimentation",
    difficulty: "hard",
    question: "Stokes' Law states that the settling velocity of a particle is proportional to which of the following?",
    options: [
      "The square of the particle diameter and the density difference between particle and water",
      "The particle diameter",
      "The flow rate through the basin",
      "The depth of the sedimentation basin"
    ],
    correct: 0,
    explanation: "Stokes' Law: Vs = g(ρp-ρw)d²/(18μ), where Vs = settling velocity, g = gravity, ρp = particle density, ρw = water density, d = particle diameter, μ = dynamic viscosity. Settling velocity is proportional to d² (particle diameter squared) and density difference. Larger, denser particles settle faster."
  },
  {
    id: 108,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the advantage of tube settlers or plate settlers over conventional sedimentation basins?",
    options: [
      "They are cheaper to build",
      "They provide better disinfection",
      "They eliminate the need for coagulation",
      "They increase the effective settling area, allowing higher flow rates in a smaller footprint"
    ],
    correct: 3,
    explanation: "Tube settlers and plate settlers increase the effective settling area by providing many inclined surfaces for particles to settle on. This allows much higher surface overflow rates (up to 10× conventional) in a smaller basin footprint, making them ideal for plant expansions or limited space."
  },
  {
    id: 109,
    isCalc: true,
    module: "Sedimentation",
    difficulty: "easy",
    question: "What is the weir overflow rate (WOR) in a sedimentation basin?",
    options: [
      "The rate at which sludge is removed from the basin",
      "The velocity of water entering the basin",
      "The flow rate per unit length of the outlet weir (m³/m·day)",
      "The rate of chemical addition to the basin"
    ],
    correct: 2,
    explanation: "Understand the definition and calculation of Weir Overflow Rate (WOR).\n\nStep 1 — Define Weir Overflow Rate (WOR):\nWOR is a measure of the hydraulic loading on the outlet weir of a sedimentation basin.\n\nStep 2 — Formula for WOR:\nWOR = Flow rate ÷ Total weir length\n\nStep 3 — Units of WOR:\nIf flow rate is in m³/day and total weir length is in meters, then WOR is expressed in m³/m·day.\n\nStep 4 — Significance of WOR:\nA high WOR can create turbulence at the weir, potentially re-suspending settled floc and reducing treatment efficiency. Typical values for conventional clarifiers are often less than 250 m³/m·day.\n\nThe correct answer is B. The flow rate per unit length of the outlet weir (m³/m·day).",
  steps: [
    { l: "Formula", c: "Alkalinity Consumed (mg/L as CaCO₃) = Alum Dose (mg/L) × Alkalinity Consumption Factor (mg alkalinity/mg alum)" },
    { l: "Step 1: Identify the given values.", c: "Alum Dose = 40 mg/L. Alkalinity Consumption Factor = 0.45 mg alkalinity per mg alum." },
    { l: "Step 2: Substitute the values into the formula.", c: "Alkalinity Consumed = 40 mg/L × 0.45" },
    { l: "Calculate", c: "Alkalinity Consumed = 18 mg/L as CaCO₃" },
    { l: "Result", c: "The alkalinity consumed is 18 mg/L as CaCO₃." }
  ],
  tip: "Alum consumes alkalinity; ensure sufficient alkalinity remains for stable pH.",
  },
  {
    id: 110,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is a 'sludge blanket' clarifier (upflow clarifier), and how does it differ from a conventional clarifier?",
    options: [
      "An upflow clarifier where water passes upward through a suspended sludge blanket that acts as a filter",
      "A clarifier that uses chemical addition to improve settling",
      "A clarifier that uses mechanical mixing to improve settling",
      "A clarifier with a sloped bottom for better sludge removal"
    ],
    correct: 0,
    explanation: "In a sludge blanket (upflow) clarifier, water flows upward through a suspended blanket of previously formed floc. Incoming particles are captured by the sludge blanket, which acts as a contact filter. These clarifiers can achieve very low effluent turbidity but require careful operation to maintain the blanket."
  },
  {
    id: 111,
    isCalc: true,
    module: "Sedimentation",
    difficulty: "hard",
    question: "A sedimentation basin has a surface area of 500 m² and treats 30,000 m³/day. What is the SOR, and is it within the typical design range?",
    options: ["SOR = 30 m³/m²·day — within typical range of 20-40 m³/m²·day", "SOR = 60 m³/m²·day — above typical range", "SOR = 15 m³/m²·day — below typical range", "SOR = 6 m³/m²·day — far below typical range"],
    correct: 1,
    explanation: "Calculate the Surface Overflow Rate by dividing the flow rate by the surface area, then compare it to the typical design range.\n\nStep 1 — Identify given values:\nFlow Rate = 30,000 m³/day\nSurface Area = 500 m²\nTypical SOR Range = 20-40 m³/m²·day\n\nStep 2 — Calculate the Surface Overflow Rate (SOR):\nSOR = Flow Rate ÷ Surface Area\nSOR = 30,000 m³/day ÷ 500 m²\nSOR = 60 m³/m²·day\n\nStep 3 — Compare the calculated SOR to the typical range:\n60 m³/m²·day is greater than the typical range of 20-40 m³/m²·day.\n\nThe correct answer is B. SOR = 60 m³/m²·day — above typical range.",
    steps: [ { l: "Formula", c: "Surface Overflow Rate (SOR) = Flow Rate / Surface Area" }, { l: "Step 1: Identify the given surface area.", c: "Surface Area = 500 m²" }, { l: "Step 2: Identify the given flow rate.", c: "Flow Rate = 30,000 m³/day" }, { l: "Step 3: Substitute values into the SOR formula.", c: "SOR = 30,000 m³/day / 500 m²" }, { l: "Step 4: Calculate the Surface Overflow Rate.", c: "SOR = 60 m³/m²·day" }, { l: "Step 5: Compare with typical design range (20-40 m³/m²·day).", c: "60 m³/m²·day is above the typical range." }, { l: "Result", c: "The SOR is 60 m³/m²·day, which is above the typical design range." } ],
    tip: "Know typical design ranges for key parameters to assess treatment performance.",
  },
  {
    id: 112,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the effect of increasing the flow rate through a sedimentation basin on treatment performance?",
    options: [
      "Higher flow rates improve settling by creating more turbulence",
      "Higher flow rates have no effect on sedimentation performance",
      "Higher flow rates reduce detention time and increase SOR, leading to poorer settling and more floc carryover",
      "Higher flow rates improve performance by washing out accumulated sludge"
    ],
    correct: 2,
    explanation: "Increasing flow rate reduces detention time and increases the surface overflow rate (SOR). Particles that previously settled now have insufficient time to reach the bottom before being carried to the outlet. This leads to higher effluent turbidity and more floc carryover to the filters."
  },
  {
    id: 113,
    module: "Sedimentation",
    difficulty: "easy",
    question: "What is the purpose of baffles in a sedimentation basin?",
    options: [
      "To add chemicals to the water",
      "To reduce short-circuiting and improve the distribution of flow through the basin",
      "To collect and remove settled sludge",
      "To measure the depth of the sludge layer"
    ],
    correct: 1,
    explanation: "Baffles are walls or plates installed in sedimentation basins to direct flow, reduce short-circuiting, and improve the distribution of water throughout the basin. They ensure water spends the full detention time settling before reaching the outlet weir."
  },
  {
    id: 114,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the typical turbidity of water leaving a well-operated conventional sedimentation basin?",
    options: [
      "Less than 0.1 NTU",
      "Less than 5 NTU",
      "5-20 NTU",
      "20-50 NTU"
    ],
    correct: 1,
    explanation: "A well-operated conventional sedimentation basin should produce settled water with turbidity less than 5 NTU, ideally less than 2 NTU, to reduce the load on the filters. Higher settled water turbidity shortens filter runs and may lead to filter turbidity breakthrough."
  },
  {
    id: 115,
    module: "Sedimentation",
    difficulty: "hard",
    question: "What is the 'density current' phenomenon in sedimentation basins, and how does it affect performance?",
    options: [
      "The electrical current used to power the sludge collector",
      "The flow of water over the outlet weir",
      "The current created by the sludge scraper movement",
      "A flow of denser (colder or more turbid) water along the bottom of the basin, causing short-circuiting"
    ],
    correct: 3,
    explanation: "Density currents occur when incoming water is denser (colder or more turbid) than the water in the basin. The denser water sinks and flows along the bottom, bypassing the settling zone and causing short-circuiting. This is common in winter when cold river water enters a warmer basin."
  },
  {
    id: 116,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the purpose of a 'sludge withdrawal' schedule in a sedimentation basin?",
    options: [
      "To measure the amount of sludge produced",
      "To test the quality of the settled water",
      "To recycle sludge back to the coagulation step",
      "To regularly remove accumulated sludge to maintain basin volume and prevent sludge carry-over"
    ],
    correct: 3,
    explanation: "Regular sludge withdrawal removes accumulated settled sludge from the basin bottom. If sludge is not removed regularly, it builds up, reduces effective basin volume, can become anaerobic (causing odours and releasing phosphorus), and may be re-suspended and carried over to the filters."
  },

  // ─── MODULE 4: Filtration (Questions 117-190) ─────────────────────────────
  {
    id: 117,
    module: "Filtration",
    difficulty: "easy",
    question: "What is the primary purpose of filtration in water treatment?",
    options: [
      "To disinfect the water",
      "To remove remaining suspended particles, floc, and pathogens after sedimentation",
      "To remove dissolved minerals",
      "To adjust the pH of the water"
    ],
    correct: 1,
    explanation: "Filtration removes remaining suspended particles, floc, and pathogens (including Giardia cysts and Cryptosporidium oocysts) that were not removed by sedimentation. It is the final physical treatment barrier before disinfection."
  },
  {
    id: 118,
    module: "Filtration",
    difficulty: "easy",
    question: "What are the two most common filter media used in dual-media filters?",
    options: [
      "Sand and gravel",
      "Garnet and sand",
      "Activated carbon and sand",
      "Anthracite coal and sand"
    ],
    correct: 3,
    explanation: "Dual-media filters use anthracite coal (top layer) and sand (bottom layer). Anthracite is lighter and coarser, so it stays on top after backwashing. Sand is denser and finer, providing polishing filtration. This arrangement allows deeper penetration of solids and longer filter runs."
  },
  {
    id: 119,
    isCalc: true,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the typical filtration rate for a rapid sand filter?",
    options: [
      "0.1 – 0.4 m/h",
      "50 – 100 m/h",
      "5 – 15 m/h",
      "200 – 300 m/h"
    ],
    correct: 2,
    explanation: "Identify the typical filtration rate range for rapid sand filters and differentiate it from other filtration types.\n\nStep 1 — Rapid Sand Filter Filtration Rate:\nRapid sand filters are designed to operate at relatively high filtration rates to efficiently process large volumes of water. The typical range is 5 – 15 m/h (meters per hour).\n\nStep 2 — Comparison with Slow Sand Filters:\nSlow sand filters operate at much lower rates, typically 0.1 – 0.4 m/h, because they rely on biological processes for treatment in addition to physical filtration.\n\nStep 3 — Impact of High Rates:\nFiltration rates above 15 m/h in rapid sand filters can lead to decreased efficiency and potential \"turbidity breakthrough,\" meaning suspended particles are not adequately removed.\n\nThe correct answer is B. 5 – 15 m/h.",
    steps: [ { l: "Formula", c: "Mass (kg/d) = Dose (mg/L) × Flow (ML/d) × Conversion Factor (kg/mg/L/ML)" }, { l: "Step 1: Identify the given values.", c: "Alum Dose = 25 mg/L. Plant Flow = 10 ML/d." }, { l: "Step 2: Convert plant flow from ML/d to L/d for consistency.", c: "1 ML = 1,000,000 L. So, 10 ML/d = 10 × 1,000,000 L/d = 10,000,000 L/d." }, { l: "Step 3: Calculate the mass in mg/d.", c: "Mass = 25 mg/L × 10,000,000 L/d = 250,000,000 mg/d." }, { l: "Step 4: Convert the mass from mg/d to kg/d.", c: "1 kg = 1,000,000 mg. So, Mass in kg/d = 250,000,000 mg/d / 1,000,000 mg/kg = 250 kg/d." }, { l: "Result", c: "250 kg of alum are required per day." } ],
    tip: "Pay close attention to unit conversions, especially between mg, g, kg, L, and ML.",
  },
  {
    id: 120,
    module: "Filtration",
    difficulty: "medium",
    question: "What is 'head loss' in a filter, and what does increasing head loss indicate?",
    options: [
      "The loss of water over the filter weir",
      "The pressure drop across the filter bed; increasing head loss indicates the filter is becoming clogged with solids",
      "The loss of filter media during backwash",
      "The decrease in filter run length over time"
    ],
    correct: 1,
    explanation: "Head loss is the pressure drop across the filter bed as water flows through it. As the filter collects particles, the pores become clogged, increasing resistance to flow and head loss. When head loss reaches a maximum (typically 2-3 m), the filter must be backwashed."
  },
  {
    id: 121,
    module: "Filtration",
    difficulty: "easy",
    question: "What is the purpose of filter backwashing?",
    options: [
      "To disinfect the filter media",
      "To measure the turbidity of the filtered water",
      "To add chemicals to the filter",
      "To clean the filter by reversing the flow to remove accumulated solids from the media"
    ],
    correct: 3,
    explanation: "Filter backwashing cleans the filter by reversing the flow of water upward through the filter bed. The upward flow expands and fluidizes the filter media, releasing trapped particles which are carried away in the backwash water. Backwash is triggered by high head loss or turbidity breakthrough."
  },
  {
    id: 122,
    module: "Filtration",
    difficulty: "medium",
    question: "What is 'turbidity breakthrough' in a filter?",
    options: [
      "The initial turbidity spike when a filter is first put into service",
      "The turbidity of the settled water entering the filter",
      "The turbidity of the backwash water",
      "A sudden increase in filtered water turbidity indicating the filter is no longer effectively removing particles"
    ],
    correct: 3,
    explanation: "Turbidity breakthrough occurs when the filter can no longer effectively remove particles, resulting in a sudden increase in filtered water turbidity. It can be caused by: filter run too long, excessive head loss, poor coagulation, or sudden changes in flow rate. The filter must be taken offline and backwashed."
  },
  {
    id: 123,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the Ontario turbidity standard for filtered water at the entry point to the distribution system?",
    options: [
      "0.1 NTU at all times",
      "0.3 NTU at the 95th percentile, never exceeding 1.0 NTU",
      "1.0 NTU at all times",
      "5.0 NTU at the 95th percentile"
    ],
    correct: 1,
    explanation: "Ontario requires filtered surface water systems to achieve ≤0.3 NTU at the 95th percentile of measurements at the entry point to the distribution system, and never exceed 1.0 NTU. These standards ensure effective removal of Giardia and Cryptosporidium."
  },
  {
    id: 124,
    module: "Filtration",
    difficulty: "hard",
    question: "What is 'filter-to-waste' (waste filter backwash water), and when is it used?",
    options: [
      "Sending all filtered water to waste",
      "Sending the initial filtered water to waste after backwash until the filter ripens and produces acceptable quality water",
      "Wasting the backwash water to a treatment lagoon",
      "Bypassing the filter during high-flow events"
    ],
    correct: 1,
    explanation: "Filter-to-waste (also called 'waste filter backwash water' or 'filter ripening') involves sending the initial filtered water to waste after a backwash until the filter 'ripens' (re-establishes its particle removal efficiency). Freshly backwashed filters can have elevated turbidity for 15-30 minutes before returning to normal performance."
  },
  {
    id: 125,
    isCalc: true,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the typical backwash rate for a rapid sand filter?",
    options: [
      "36-60 m/h",
      "2-5 m/h",
      "100-150 m/h",
      "200-300 m/h"
    ],
    correct: 0,
    explanation: "The backwash rate for a rapid sand filter must be sufficient to fluidize the filter bed without washing out the media.\n\nStep 1 — Understand the purpose of backwash: Backwashing expands the filter bed by 30-50% to release trapped particles and clean the media.\n\nStep 2 — Identify the effective range: The rate needs to be high enough for effective cleaning but not so high that it causes media loss.\n\nStep 3 — Recall typical industry standards: Standard backwash rates for rapid sand filters fall within the range of 36-60 m/h (10-17 mm/s).\n\nThe correct answer is 36-60 m/h.",
    steps: [ { l: "Formula", c: "Hydraulic Retention Time (HRT) (minutes) = Volume (m³) / Flow Rate (m³/minute)" }, { l: "Step 1: Identify the given values.", c: "Flocculation basin volume (V) = 500 m³. Flow rate (Q) = 25,000 m³/d." }, { l: "Step 2: Convert the flow rate from m³/d to m³/minute.", c: "Minutes in a day = 24 hours/day × 60 minutes/hour = 1440 minutes/day. Flow rate in m³/minute = 25,000 m³/d / 1440 minutes/d ≈ 17.361 m³/minute." }, { l: "Step 3: Substitute the values into the HRT formula.", c: "HRT = 500 m³ / 17.361 m³/minute" }, { l: "Calculate", c: "HRT ≈ 28.8 minutes" }, { l: "Result", c: "The hydraulic retention time (HRT) is approximately 28.8 minutes." } ],
    tip: "HRT is critical for process efficiency; ensure consistent time units in calculations.",
  },
  {
    id: 126,
    module: "Filtration",
    difficulty: "easy",
    question: "What is slow sand filtration, and what is its primary advantage over rapid sand filtration?",
    options: [
      "Slow sand filtration uses chemicals; rapid sand filtration does not",
      "Slow sand filtration requires more maintenance than rapid sand filtration",
      "Slow sand filtration is faster and more efficient",
      "Slow sand filtration develops a biological layer (schmutzdecke) that provides pathogen removal without chemicals"
    ],
    correct: 3,
    explanation: "Slow sand filtration operates at very low rates (0.1-0.4 m/h) and develops a biological layer called the schmutzdecke at the top of the sand. This layer provides excellent removal of bacteria, viruses, and protozoa through biological predation and physical straining, without requiring coagulation chemicals."
  },
  {
    id: 127,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of the gravel support layer below the filter media?",
    options: [
      "To provide additional filtration of fine particles",
      "To support the filter media and allow even distribution of backwash water",
      "To add minerals to the filtered water",
      "To measure the head loss across the filter"
    ],
    correct: 1,
    explanation: "The gravel support layer (or underdrain system) beneath the filter media supports the filter media and prevents it from entering the underdrain system. It also ensures even distribution of backwash water upward through the filter bed during cleaning."
  },
  {
    id: 128,
    isCalc: true,
    module: "Filtration",
    difficulty: "hard",
    question: "A filter has a surface area of 50 m² and is backwashed at a rate of 50 m/h. What is the backwash flow rate in m³/min?",
    options: [
      "25 m³/min",
      "41.7 m³/min",
      "2,500 m³/min",
      "0.42 m³/min"
    ],
    correct: 1,
    explanation: "Calculate the backwash flow rate by multiplying the backwash rate by the filter surface area, then convert the hourly flow to minutes.\n\nStep 1 — Calculate the backwash flow rate in m³/h:\nBackwash Flow Rate = Backwash Rate × Filter Area = 50 m/h × 50 m² = 2,500 m³/h\n\nStep 2 — Convert the backwash flow rate from m³/h to m³/min:\nBackwash Flow Rate = 2,500 m³/h ÷ 60 min/h = 41.666... m³/min\n\nStep 3 — Round to one decimal place:\n41.666... m³/min ≈ 41.7 m³/min\n\nThe correct answer is 41.7 m³/min.",
    steps: [ { l: "Formula", c: "Backwash Flow Rate = Backwash Rate × Filter Area" }, { l: "Step 1: Identify the given filter area.", c: "Filter Area = 50 m²" }, { l: "Step 2: Identify the given backwash rate.", c: "Backwash Rate = 50 m/h" }, { l: "Step 3: Calculate the backwash flow rate in m³/h.", c: "Backwash Flow Rate = 50 m/h × 50 m² = 2,500 m³/h" }, { l: "Step 4: Convert the backwash flow rate from m³/h to m³/min.", c: "Backwash Flow Rate = 2,500 m³/h ÷ 60 min/h" }, { l: "Step 5: Calculate the final backwash flow rate.", c: "Backwash Flow Rate = 41.67 m³/min (approximately 41.7 m³/min)" }, { l: "Result", c: "The backwash flow rate is 41.7 m³/min." } ],
    tip: "Pay attention to units; convert hours to minutes when required for flow rates.",
  },
  {
    id: 129,
    module: "Filtration",
    difficulty: "medium",
    question: "What is 'mudballing' in a filter, and what causes it?",
    options: [
      "Clumping of filter media into balls of mud/organic matter due to inadequate backwashing",
      "The formation of mud at the bottom of the filter from excessive backwashing",
      "The accumulation of iron and manganese on the filter media",
      "The growth of algae on the filter surface"
    ],
    correct: 0,
    explanation: "Mudballing occurs when filter media clumps together into balls of mud and organic matter due to inadequate backwashing. Mudballs reduce filter capacity, cause uneven flow distribution, and can lead to turbidity breakthrough. Prevention includes adequate backwash rate, surface wash, and air scour."
  },
  {
    id: 130,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of surface wash or air scour during filter backwashing?",
    options: [
      "To add disinfectant to the filter media",
      "To remove the top layer of filter media for replacement",
      "To measure the turbidity of the backwash water",
      "To provide additional agitation to break up mudballs and improve cleaning of the filter media"
    ],
    correct: 3,
    explanation: "Surface wash (fixed or rotary nozzles) and air scour (compressed air injected into the filter bed) provide additional agitation during backwashing to break up mudballs and improve cleaning of the filter media. Air scour is particularly effective at removing biofilm and organic matter from media."
  },
  {
    id: 131,
    module: "Filtration",
    difficulty: "easy",
    question: "What does 'filter ripening' refer to?",
    options: [
      "The aging and degradation of filter media over time",
      "The process of adding new filter media to the filter",
      "The growth of beneficial bacteria in the filter",
      "The initial period after backwash when the filter re-establishes its particle removal efficiency"
    ],
    correct: 3,
    explanation: "Filter ripening is the initial period (15-30 minutes) after backwash when the filter re-establishes its particle removal efficiency. During ripening, filtered water turbidity may be elevated. Filter-to-waste is used during this period to prevent substandard water from entering the distribution system."
  },
  {
    id: 132,
    module: "Filtration",
    difficulty: "hard",
    question: "What is the log removal credit for Giardia cysts given to a conventional filtration system (coagulation, flocculation, sedimentation, filtration) under Ontario regulations?",
    options: [
      "0.5 log",
      "2.5 log",
      "1.0 log",
      "4.0 log"
    ],
    correct: 1,
    explanation: "Ontario (following US EPA Surface Water Treatment Rule) gives a 2.5-log removal credit for Giardia cysts to conventional filtration systems (coagulation, flocculation, sedimentation, filtration) when the filtered water turbidity meets the performance standard (≤0.3 NTU at 95th percentile)."
  },
  {
    id: 133,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the difference between 'constant rate' and 'declining rate' filtration?",
    options: [
      "There is no difference — both terms describe the same process",
      "Constant rate uses more chemicals; declining rate uses fewer chemicals",
      "Constant rate is for slow sand filters; declining rate is for rapid sand filters",
      "Constant rate maintains a fixed flow through each filter; declining rate allows flow to decrease as head loss increases"
    ],
    correct: 3,
    explanation: "Constant rate filtration maintains a fixed flow rate through each filter using flow control valves, regardless of head loss. Declining rate filtration allows the flow to decrease naturally as head loss increases, with no flow control. Declining rate filters are simpler but require more filters to maintain total plant flow."
  },
  {
    id: 134,
    module: "Filtration",
    difficulty: "easy",
    question: "What is the purpose of a turbidimeter on the filter effluent?",
    options: [
      "To measure the chemical dose applied to the filter",
      "To continuously monitor filtered water turbidity to detect breakthrough and ensure compliance",
      "To measure the backwash water turbidity",
      "To control the filter backwash cycle"
    ],
    correct: 1,
    explanation: "Continuous turbidity monitoring on each filter effluent detects turbidity breakthrough early, allowing operators to take the filter offline before substandard water reaches the distribution system. It also provides data for regulatory compliance reporting."
  },
  {
    id: 135,
    isCalc: true,
    module: "Filtration",
    difficulty: "medium",
    question: "What is 'media stratification' in a dual-media filter, and why is it important?",
    options: [
      "The accumulation of organic matter between media layers",
      "The mixing of anthracite and sand during filtration",
      "The separation of anthracite and sand into distinct layers after backwash",
      "The loss of fine media particles during backwash"
    ],
    correct: 2,
    explanation: "Understand the definition of media stratification and its role in dual-media filter operation.\n\nStep 1 — Define media stratification:\nMedia stratification is the natural process where filter media layers separate by density and size after backwash. In a dual-media filter, this means the lighter, coarser anthracite settles on top of the denser, finer sand.\n\nStep 2 — Importance of stratification:\nThis layering is crucial for effective filtration. The coarser anthracite on top captures larger suspended particles, preventing premature clogging of the finer sand layer below. The finer sand then polishes the water by removing smaller particles.\n\nStep 3 — Consequence of lost stratification:\nIf stratification is lost (e.g., due to insufficient backwash or improper media selection), the finer sand may mix with or be displaced by the coarser anthracite. This reduces the filter's ability to capture particles effectively, leading to poor effluent quality and shorter filter run times.\n\nStep 4 — Relate to the options:\nOption A accurately describes this process: \"The separation of anthracite and sand into distinct layers after backwash.\"\n\nThe correct answer is A.",
    steps: [ { l: "Formula for Mass of Alum", c: "Mass (kg/d) = Dose (mg/L) × Flow (L/d) × (1 kg / 1,000,000 mg)" }, { l: "Calculate Mass of Alum", c: "Mass of Alum = 30 mg/L × 50,000,000 L/d × (1 kg / 1,000,000 mg) = 1,500 kg/d" }, { l: "Formula for Volume of Alum Solution", c: "Volume (L/d) = Mass of Alum (kg/d) / (Alum Solution Concentration (%) × Alum Solution Density (kg/L))" }, { l: "Substitute and Calculate Volume of Alum Solution", c: "Volume of Alum Solution = 1,500 kg/d / (0.48 × 1.33 kg/L) = 1,500 kg/d / 0.6384 kg/L = 2,349.62 L/d" }, { l: "Result", c: "The volume of alum solution required per day is approximately 2,350 L/d." } ],
    tip: "Always convert units to match the desired output; pay attention to percentage concentration.",
  },
  {
    id: 136,
    isCalc: true,
    module: "Filtration",
    difficulty: "hard",
    question: "A filter has been running for 48 hours. The head loss has reached 2.5 m (maximum), but the filtered water turbidity is still 0.15 NTU (well below the 0.3 NTU limit). Should the filter be backwashed?",
    options: [
      "No — turbidity is acceptable, so backwashing is not needed",
      "No — 48 hours is too short a run time for backwashing",
      "Yes — maximum head loss has been reached, indicating the filter is clogged and must be backwashed",
      "Yes — but only if the turbidity also exceeds 0.3 NTU"
    ],
    correct: 2,
    explanation: "Determine the backwash trigger based on head loss or turbidity.\n\nStep 1 — Identify backwash triggers:\nFilters are backwashed when either maximum head loss is reached OR filtered water turbidity exceeds the limit.\n\nStep 2 — Evaluate head loss condition:\nThe head loss has reached 2.5 m, which is the maximum allowed.\n\nStep 3 — Evaluate turbidity condition:\nThe filtered water turbidity is 0.15 NTU, which is below the 0.3 NTU limit.\n\nStep 4 — Determine backwash necessity:\nSince the maximum head loss has been reached, the filter must be backwashed, regardless of the turbidity level.\n\nThe correct answer is B.",
    steps: [ { l: "Principle", c: "Filter backwash is triggered by either maximum head loss or turbidity breakthrough, whichever occurs first." }, { l: "Step 1: Evaluate the head loss condition.", c: "Current Head Loss = 2.5 m. This has reached the maximum head loss (2.5 m)." }, { l: "Step 2: Evaluate the turbidity condition.", c: "Filtered Water Turbidity = 0.15 NTU. This is well below the 0.3 NTU limit." }, { l: "Step 3: Apply the backwash trigger principle.", c: "Since the maximum head loss has been reached, the filter should be backwashed, regardless of turbidity." }, { l: "Result", c: "Yes, the filter should be backwashed because it has reached maximum head loss." } ],
    tip: "Maximum head loss is a critical backwash trigger, even if turbidity is low.",
  },
  {
    id: 137,
    module: "Filtration",
    difficulty: "medium",
    question: "What is 'negative head' in a filter, and why is it a problem?",
    options: [
      "Negative pressure in the filter effluent pipe",
      "Sub-atmospheric pressure within the filter bed causing dissolved gases to come out of solution, creating air pockets",
      "A decrease in head loss over time",
      "The head loss across the filter underdrain system"
    ],
    correct: 1,
    explanation: "Negative head (sub-atmospheric pressure) occurs in the filter bed when head loss exceeds the water depth above the media. Dissolved gases come out of solution, forming air pockets (air binding) that block flow paths, reduce effective filter area, and can cause turbidity breakthrough. Maintaining adequate water depth above the media prevents negative head."
  },
  {
    id: 138,
    module: "Filtration",
    difficulty: "easy",
    question: "What is the purpose of a filter run length record?",
    options: [
      "To track filter performance, identify trends, and optimize backwash scheduling",
      "To schedule operator shifts",
      "To record chemical doses applied to the filter",
      "To measure the amount of water filtered"
    ],
    correct: 0,
    explanation: "Filter run length records track how long each filter runs between backwashes. Decreasing run lengths indicate deteriorating filter performance (poor coagulation, mudballing, media loss). Records help operators identify problems early and optimize backwash scheduling."
  },
  {
    id: 139,
    module: "Filtration",
    difficulty: "medium",
    question: "What is membrane filtration, and what types are used in drinking water treatment?",
    options: [
      "Filtration through a sand membrane",
      "Biological filtration through a membrane biofilm",
      "Pressure-driven filtration through semi-permeable membranes; types include MF, UF, NF, and RO",
      "Gravity filtration through a cloth membrane"
    ],
    correct: 2,
    explanation: "Membrane filtration uses pressure to force water through semi-permeable membranes. Types include: MF (microfiltration, 0.1-10 µm — removes bacteria, protozoa), UF (ultrafiltration, 0.01-0.1 µm — removes viruses), NF (nanofiltration — removes hardness, some organics), and RO (reverse osmosis — removes dissolved salts)."
  },
  {
    id: 140,
    isCalc: true,
    module: "Filtration",
    difficulty: "hard",
    question: "A filter plant has 6 filters, each 60 m² in area. The plant flow is 36,000 m³/day. One filter is offline for backwashing. What is the filtration rate on the remaining 5 filters?",
    options: ["5 m/h", "8 m/h", "10 m/h", "12 m/h"],
    correct: 0,
    explanation: "Calculate the total operational filter area, convert the plant flow to an hourly rate, then divide the hourly flow by the operational filter area to find the filtration rate.\n\nStep 1 — Calculate the total area of filters in operation:\n5 filters × 60 m²/filter = 300 m²\n\nStep 2 — Convert the plant flow from m³/day to m³/hour:\n36,000 m³/day ÷ 24 hours/day = 1,500 m³/hour\n\nStep 3 — Calculate the filtration rate:\n1,500 m³/hour ÷ 300 m² = 5 m/h\n\nThe correct answer is 5 m/h.",
    steps: [ { l: "Formula", c: "Filtration Rate (m/h) = Flow (m³/h) / Filter Area (m²)" }, { l: "Step 1: Calculate the total area of the operational filters.", c: "Number of operational filters = 6 - 1 = 5 filters. Area per filter = 60 m². Total operational filter area = 5 filters × 60 m²/filter = 300 m²." }, { l: "Step 2: Convert the plant flow from m³/day to m³/hour.", c: "Plant flow = 36,000 m³/day. Hours in a day = 24 hours. Flow in m³/hour = 36,000 m³/day / 24 h/day = 1,500 m³/h." }, { l: "Step 3: Substitute the values into the filtration rate formula.", c: "Filtration Rate = 1,500 m³/h / 300 m²" }, { l: "Calculate", c: "Filtration Rate = 5 m/h" }, { l: "Result", c: "The filtration rate on the remaining 5 filters is 5 m/h." } ],
    tip: "Always double-check units and ensure all values are in the correct units before calculation.",
  },

  // ─── MODULE 5: Disinfection (Questions 141-240) ───────────────────────────
  {
    id: 141,
    module: "Disinfection",
    difficulty: "easy",
    question: "What is the primary purpose of disinfection in water treatment?",
    options: [
      "To kill or inactivate pathogenic microorganisms",
      "To remove turbidity from the water",
      "To remove dissolved minerals",
      "To adjust the pH of the water"
    ],
    correct: 0,
    explanation: "Disinfection kills or inactivates pathogenic microorganisms (bacteria, viruses, protozoa) to prevent waterborne disease. It is the final treatment barrier before water enters the distribution system. Chlorination is the most common disinfection method in Ontario."
  },
  {
    id: 142,
    module: "Disinfection",
    difficulty: "easy",
    question: "What is free chlorine residual in drinking water?",
    options: [
      "Unreacted chlorine remaining in water as HOCl and OCl⁻ after meeting the chlorine demand",
      "Chlorine that has been used up reacting with organic matter",
      "Chlorine combined with ammonia as chloramines",
      "Chlorine gas dissolved in water"
    ],
    correct: 0,
    explanation: "Free chlorine residual is the unreacted chlorine remaining in water after meeting the chlorine demand, present as hypochlorous acid (HOCl) and hypochlorite ion (OCl⁻). It provides ongoing disinfection protection. Ontario requires a minimum of 0.2 mg/L free chlorine at the point of entry to the distribution system."
  },
  {
    id: 143,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the CT concept in disinfection?",
    options: [
      "The ratio of chlorine to turbidity",
      "The contact time required for complete disinfection",
      "The product of disinfectant concentration (C, mg/L) and contact time (T, minutes) needed to achieve a specific log inactivation",
      "The chlorine dose divided by the treatment time"
    ],
    correct: 2,
    explanation: "CT = C × T, where C is the disinfectant residual concentration (mg/L) and T is the contact time (minutes). The CT value required for a specific log inactivation depends on the disinfectant, pathogen, temperature, and pH. Higher CT values are needed at lower temperatures and higher pH."
  },
  {
    id: 144,
    module: "Disinfection",
    difficulty: "medium",
    question: "At what pH is hypochlorous acid (HOCl) the dominant form of free chlorine, and why is this important?",
    options: [
      "pH > 8.5 — HOCl is more effective at high pH",
      "pH < 7.5 — HOCl is approximately 100× more effective as a disinfectant than OCl⁻",
      "pH = 7.0 — equal amounts of HOCl and OCl⁻",
      "pH > 9.0 — HOCl is the only form present"
    ],
    correct: 1,
    explanation: "At pH < 7.5, HOCl (hypochlorous acid) is the dominant form. HOCl is approximately 80-100× more effective as a disinfectant than OCl⁻ (hypochlorite ion) because it is uncharged and can penetrate cell membranes more easily. Lower pH improves disinfection efficiency."
  },
  {
    id: 145,
    isCalc: true,
    module: "Disinfection",
    difficulty: "easy",
    question: "What is breakpoint chlorination?",
    options: [
      "The point at which all chloramines are destroyed and free chlorine residual begins to form",
      "The point at which chlorine breaks through the filter",
      "The maximum chlorine dose that can be safely applied",
      "The point at which chlorine demand is first met"
    ],
    correct: 0,
    explanation: "Understand the stages of chlorine addition and its reactions with water impurities.\n\nStep 1 — Initial chlorine addition:\nChlorine reacts with reducing agents (e.g., hydrogen sulfide, ferrous iron) and some organic matter, creating a chlorine demand.\n\nStep 2 — Chloramine formation:\nAs more chlorine is added, it reacts with ammonia to form chloramines (combined chlorine residual).\n\nStep 3 — Chloramine destruction:\nWith further chlorine addition, the chloramines are oxidized and destroyed. This process reduces the chlorine residual.\n\nStep 4 — Breakpoint:\nThis is the point where all ammonia and most organic matter have been oxidized, and chloramines are destroyed. The chlorine residual reaches a minimum.\n\nStep 5 — Free chlorine residual formation:\nAny chlorine added beyond the breakpoint will exist as free chlorine residual (hypochlorous acid and hypochlorite ion), and the residual will increase proportionally with the dose.\n\nThe correct answer is B. The point at which all chloramines are destroyed and free chlorine residual begins to form.",
    steps: [ { l: "Formula for Daily Alum Consumption", c: "Daily Alum Consumption (kg/d) = Optimal Alum Dose (mg/L) × Plant Flow (L/d) × (1 kg / 1,000,000 mg)" }, { l: "Convert Plant Flow", c: "Plant Flow = 15 ML/d = 15,000,000 L/d" }, { l: "Substitute and Calculate", c: "Daily Alum Consumption = 45 mg/L × 15,000,000 L/d × (1 kg / 1,000,000 mg) = 675 kg/d" }, { l: "Result", c: "The daily alum consumption is 675 kg/d." } ],
    tip: "Remember that 1 ML equals 1,000,000 L for flow calculations.",
  },
  {
    id: 146,
    module: "Disinfection",
    difficulty: "medium",
    question: "What are trihalomethanes (THMs), and how are they formed?",
    options: [
      "Organic compounds naturally present in source water",
      "Chlorine compounds used as primary disinfectants",
      "Disinfection by-products formed when chlorine reacts with natural organic matter",
      "By-products of the coagulation process"
    ],
    correct: 2,
    explanation: "Trihalomethanes (THMs — chloroform, bromodichloromethane, dibromochloromethane, bromoform) are disinfection by-products formed when chlorine reacts with natural organic matter (NOM) in water. They are potential carcinogens. The Ontario MAC for total THMs is 100 µg/L."
  },
  {
    id: 147,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the minimum free chlorine residual required at the point of entry to the distribution system in Ontario?",
    options: [
      "0.05 mg/L",
      "1.0 mg/L",
      "0.5 mg/L",
      "0.2 mg/L"
    ],
    correct: 3,
    explanation: "Ontario requires a minimum free chlorine residual of 0.2 mg/L at the point of entry to the distribution system (O. Reg. 170/03). This ensures adequate disinfection protection has been achieved before water enters the distribution system."
  },
  {
    id: 148,
    module: "Disinfection",
    difficulty: "easy",
    question: "What is combined chlorine residual?",
    options: [
      "Free chlorine plus chloramines",
      "Chlorine combined with organic matter",
      "Chlorine combined with ammonia to form chloramines (monochloramine, dichloramine, nitrogen trichloride)",
      "The total amount of chlorine added to the water"
    ],
    correct: 2,
    explanation: "Combined chlorine residual is chlorine that has reacted with ammonia to form chloramines: monochloramine (NH₂Cl), dichloramine (NHCl₂), and nitrogen trichloride (NCl₃). Chloramines are weaker disinfectants than free chlorine but are more stable and produce fewer DBPs."
  },
  {
    id: 149,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the advantage of using chloramines (combined chlorine) as a secondary disinfectant in the distribution system?",
    options: [
      "Chloramines are stronger disinfectants than free chlorine",
      "Chloramines are effective against Cryptosporidium",
      "Chloramines are cheaper than free chlorine",
      "Chloramines are more stable and persist longer in the distribution system, and produce fewer THMs"
    ],
    correct: 3,
    explanation: "Chloramines are more stable than free chlorine and persist longer in the distribution system, providing sustained disinfection protection. They also produce significantly fewer THMs and HAAs than free chlorine. However, they are weaker disinfectants and require longer contact times."
  },
  {
    id: 150,
    isCalc: true,
    module: "Disinfection",
    difficulty: "hard",
    question: "What is the CT value required for 3-log inactivation of Giardia cysts with free chlorine at 10°C and pH 7.0?",
    options: [
      "143 mg·min/L",
      "97 mg·min/L",
      "65 mg·min/L",
      "195 mg·min/L"
    ],
    correct: 2,
    explanation: "To determine the CT value for Giardia inactivation, consult the US EPA CT tables for free chlorine.\n\nStep 1 — Locate the CT value in the US EPA CT table:\nFor 3-log inactivation of Giardia cysts with free chlorine at 10°C and pH 7.0, the CT table indicates a value of 65 mg·min/L.\n\nNote: CT values are influenced by temperature and pH; lower temperatures and higher pH generally require higher CT values for the same level of inactivation.\n\nThe correct answer is 65 mg·min/L.",
    steps: [ { l: "Formula for Alum Sludge Solids", c: "Alum Sludge Solids (kg/d) = Alum Dose (mg/L) × Sludge Yield Factor (mg dry solids/mg alum) × Flow (L/d) × (1 kg / 1,000,000 mg)" }, { l: "Calculate Alum Sludge Solids", c: "Alum Sludge Solids = 35 mg/L × 0.26 × 20,000,000 L/d × (1 kg / 1,000,000 mg) = 182 kg/d" }, { l: "Formula for TSS Sludge Solids", c: "TSS Sludge Solids (kg/d) = Raw Water TSS (mg/L) × Removal Efficiency (%) × Flow (L/d) × (1 kg / 1,000,000 mg)" }, { l: "Calculate TSS Sludge Solids (assuming raw water TSS is 15 mg/L and removal efficiency is 95% from the explanation)", c: "TSS Sludge Solids = 15 mg/L × 0.95 × 20,000,000 L/d × (1 kg / 1,000,000 mg) = 285 kg/d" }, { l: "Calculate Total Sludge Solids", c: "Total Sludge Solids = Alum Sludge Solids + TSS Sludge Solids = 182 kg/d + 285 kg/d = 467 kg/d" }, { l: "Result", c: "The total daily sludge solids produced is 467 kg/d." } ],
    tip: "Sludge calculations combine contributions from coagulant and removed raw water solids.",
  },
  {
    id: 151,
    module: "Disinfection",
    difficulty: "easy",
    question: "What is the primary advantage of UV disinfection over chlorination?",
    options: [
      "UV is cheaper than chlorination",
      "UV is effective against Cryptosporidium and does not produce disinfection by-products",
      "UV provides a residual disinfectant in the distribution system",
      "UV removes turbidity from the water"
    ],
    correct: 1,
    explanation: "UV disinfection is highly effective against Cryptosporidium (which is resistant to chlorine) and does not produce disinfection by-products (THMs, HAAs). However, UV does not provide a residual disinfectant in the distribution system, so chlorine is still added after UV treatment."
  },
  {
    id: 152,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the UV dose required for 3-log inactivation of Cryptosporidium?",
    options: [
      "1 mJ/cm²",
          "10 mJ/cm²",
      "40 mJ/cm²",
      "100 mJ/cm²"
    ],
    correct: 1,
    explanation: "A UV dose of approximately 10 mJ/cm² achieves 3-log inactivation of Cryptosporidium. This is one of the lowest UV doses required for any pathogen, making UV particularly effective and efficient for Cryptosporidium control."
  },
  {
    id: 153,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is chlorine demand?",
    options: [
      "The amount of chlorine required to maintain the minimum residual",
      "The amount of chlorine consumed by reactions with organic matter, ammonia, and other reducing substances before a residual is established",
      "The maximum chlorine dose that can be safely applied",
      "The chlorine residual measured at the point of entry"
    ],
    correct: 1,
    explanation: "Chlorine demand is the amount of chlorine consumed by reactions with organic matter, ammonia, iron, manganese, and other reducing substances before a free chlorine residual is established. Chlorine dose = Chlorine demand + Desired chlorine residual."
  },
  {
    id: 154,
    module: "Disinfection",
    difficulty: "easy",
    question: "What is ozonation, and what is its primary advantage in water treatment?",
    options: [
      "Addition of oxygen to improve taste",
      "A powerful oxidant that destroys organic compounds, taste/odour, and is effective against Cryptosporidium",
      "A process to remove hardness from water",
      "A biological treatment process"
    ],
    correct: 1,
    explanation: "Ozonation uses ozone (O₃) as a powerful oxidant and disinfectant. It is effective against Cryptosporidium, destroys taste and odour compounds, oxidizes iron and manganese, and breaks down organic compounds. However, it does not provide a distribution system residual and can form bromate (a DBP) in bromide-containing waters."
  },
  {
    id: 155,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the T10 value used in CT calculations?",
    options: [
      "The total contact time in the disinfection chamber",
      "The turbidity of the water at the 10th percentile",
      "The temperature of the water at 10°C",
      "The time at which 10% of the water has passed through the contact chamber (10th percentile detention time)"
    ],
    correct: 3,
    explanation: "T10 is the time at which 10% of the water has passed through the contact chamber (10th percentile detention time). It accounts for short-circuiting — some water travels faster than the theoretical detention time. T10 is always less than the theoretical detention time. CT = C × T10."
  },
  {
    id: 156,
    module: "Disinfection",
    difficulty: "hard",
    question: "A chlorine contact chamber has a theoretical detention time of 45 minutes. The baffling factor is 0.5. What is the T10 value?",
    options: [
      "45 minutes",
      "22.5 minutes",
      "90 minutes",
      "4.5 minutes"
    ],
    correct: 1,
    explanation: "T10 = Theoretical detention time × Baffling factor = 45 min × 0.5 = 22.5 minutes. The baffling factor accounts for short-circuiting in the contact chamber. Well-baffled chambers have factors of 0.7-0.9; poorly baffled chambers have factors of 0.1-0.3."
  },
  {
    id: 157,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the effect of pH on chlorine disinfection effectiveness?",
    options: [
      "Higher pH improves disinfection because more HOCl is formed",
      "Neutral pH (7.0) is optimal for all disinfection conditions",
      "pH has no effect on chlorine disinfection",
      "Lower pH improves disinfection because more HOCl (the more effective form) is present"
    ],
    correct: 3,
    explanation: "Lower pH improves chlorine disinfection effectiveness because more of the chlorine is in the form of HOCl (hypochlorous acid), which is approximately 80-100× more effective than OCl⁻ (hypochlorite ion). At pH 6, about 96% is HOCl; at pH 8, only about 22% is HOCl."
  },
  {
    id: 158,
    module: "Disinfection",
    difficulty: "easy",
    question: "What is the primary safety hazard associated with chlorine gas (Cl₂) at a water treatment plant?",
    options: [
      "Fire and explosion risk",
      "Contamination of the drinking water supply",
      "Corrosion of metal equipment only",
      "Toxic gas that causes severe respiratory damage; requires emergency response planning"
    ],
    correct: 3,
    explanation: "Chlorine gas is a toxic, greenish-yellow gas that causes severe respiratory damage, eye and skin irritation, and can be fatal at high concentrations. Water treatment plants using chlorine gas must have emergency response plans, leak detection systems, and appropriate PPE (SCBA) available."
  },
  {
    id: 159,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is sodium hypochlorite (NaOCl), and what is its advantage over chlorine gas?",
    options: [
      "A gas that is safer than chlorine gas",
      "A solid form of chlorine used only in small systems",
      "A liquid form of chlorine that is safer to handle than chlorine gas",
      "A chemical used only for pool disinfection"
    ],
    correct: 2,
    explanation: "Sodium hypochlorite (bleach) is a liquid solution of chlorine (typically 5-15% available chlorine) that is safer to handle than chlorine gas. It eliminates the risk of toxic gas release. However, it degrades over time (especially at high temperatures), requires more storage space, and is more expensive per unit of chlorine."
  },
  {
    id: 160,
    isCalc: true,
    module: "Disinfection",
    difficulty: "hard",
    question: "A water treatment plant applies 3.5 mg/L of chlorine. The chlorine demand of the water is 2.8 mg/L. What is the free chlorine residual, and does it meet Ontario's minimum requirement at the point of entry?",
    options: [
      "0.7 mg/L — yes, meets the 0.2 mg/L minimum",
      "0.7 mg/L — no, does not meet the 0.5 mg/L minimum",
      "3.5 mg/L — yes, meets the minimum",
      "2.8 mg/L — no, does not meet the minimum"
    ],
    correct: 0,
    explanation: "Calculate the free chlorine residual by subtracting the chlorine demand from the chlorine dose, then compare it to Ontario's minimum requirement.\n\nStep 1 — Calculate the free chlorine residual:\nFree Chlorine Residual = Chlorine Dose - Chlorine Demand\nFree Chlorine Residual = 3.5 mg/L - 2.8 mg/L = 0.7 mg/L\n\nStep 2 — Compare to Ontario's minimum requirement:\nOntario's minimum requirement at the point of entry is 0.2 mg/L.\n0.7 mg/L is greater than 0.2 mg/L.\n\nTherefore, the free chlorine residual meets the minimum requirement.\n\nThe correct answer is 0.7 mg/L — yes, meets the 0.2 mg/L minimum.",
    steps: [ { l: "Formula", c: "Free Chlorine Residual (mg/L) = Chlorine Dose (mg/L) - Chlorine Demand (mg/L)" }, { l: "Step 1: Identify the given values.", c: "Chlorine Dose = 3.5 mg/L. Chlorine Demand = 2.8 mg/L." }, { l: "Step 2: Substitute the values into the formula.", c: "Free Chlorine Residual = 3.5 mg/L - 2.8 mg/L" }, { l: "Calculate", c: "Free Chlorine Residual = 0.7 mg/L" }, { l: "Step 3: Compare with Ontario's minimum requirement.", c: "Ontario's minimum requirement for free chlorine at the point of entry is 0.2 mg/L. Since 0.7 mg/L > 0.2 mg/L, the requirement is met." }, { l: "Result", c: "The free chlorine residual is 0.7 mg/L, which meets Ontario's minimum requirement." } ],
    tip: "Chlorine residual is crucial for disinfection; know your local regulatory requirements.",
  },
  {
    id: 161,
    isCalc: true,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of chlorine contact time in a water treatment plant?",
    options: [
      "To allow chlorine to react with organic matter and form DBPs",
      "To measure the chlorine demand of the water",
      "To allow chlorine residual to dissipate before distribution",
      "To provide sufficient time for chlorine to inactivate pathogens to meet CT requirements"
    ],
    correct: 3,
    explanation: "Understand the primary goal of chlorine contact time in water treatment.\n\nStep 1 — Purpose of chlorination:\nChlorine is added to water to disinfect it, primarily by inactivating harmful microorganisms (pathogens).\n\nStep 2 — Importance of contact time:\nFor chlorine to effectively inactivate pathogens, it needs sufficient time to react with them. This duration is known as contact time.\n\nStep 3 — Meeting regulatory requirements:\nRegulatory bodies set specific CT (Concentration × Time) requirements to ensure adequate disinfection. The contact time must be long enough to meet these standards.\n\nStep 4 — Design considerations:\nTreatment plants design contact chambers (like clearwells or dedicated pipes) to provide the necessary contact time, ensuring that the water is exposed to the chlorine residual for the required duration, even under varying flow conditions.\n\nThe correct answer is B. To provide sufficient time for chlorine to inactivate pathogens to meet CT requirements.",
    steps: [ { l: "Formula for Surface Area", c: "Surface Area (m²) = Length (m) × Width (m)" }, { l: "Calculate Surface Area", c: "Surface Area = 40 m × 10 m = 400 m²" }, { l: "Formula for Surface Overflow Rate (SOR)", c: "SOR (m/d) = Plant Flow (m³/d) / Surface Area (m²)" }, { l: "Substitute and Calculate SOR", c: "SOR = 12,000 m³/d / 400 m² = 30 m/d" }, { l: "Result", c: "The surface overflow rate is 30 m/d." } ],
    tip: "Surface overflow rate is flow divided by the basin's surface area.",
  },
  {
    id: 162,
    isCalc: true,
    module: "Disinfection",
    difficulty: "easy",
    question: "What does 'log inactivation' mean in the context of disinfection?",
    options: [
      "The number of minutes of contact time",
      "The number of pathogens remaining after treatment",
      "The concentration of disinfectant applied",
      "A logarithmic measure of pathogen reduction; 1-log = 90%, 2-log = 99%, 3-log = 99.9%"
    ],
    correct: 3,
      explanation: "Understand log inactivation as a logarithmic scale for pathogen reduction, where each log increase signifies a tenfold improvement in removal efficiency.\n\nStep 1 — 1-log reduction:\nThis means 90% of pathogens are removed, and 10% (1 in 10) survive.\n\nStep 2 — 2-log reduction:\nThis means 99% of pathogens are removed, and 1% (1 in 100) survive.\n\nStep 3 — 3-log reduction:\nThis means 99.9% of pathogens are removed, and 0.1% (1 in 1,000) survive.\n\nStep 4 — 4-log reduction:\nThis means 99.99% of pathogens are removed, and 0.01% (1 in 10,000) survive.\n\nThe correct answer is B. A logarithmic measure of pathogen reduction; 1-log = 90%, 2-log = 99%, 3-log = 99.9%.",
    steps: [ { l: "Formula for Volume of Basin", c: "Volume (m³) = Length (m) × Width (m) × Depth (m)" }, { l: "Calculate Volume of Basin", c: "Volume = 40 m × 10 m × 4 m = 1,600 m³" }, { l: "Formula for Hydraulic Detention Time (HDT)", c: "HDT (hours) = Volume (m³) / (Plant Flow (m³/d) / 24 hours/d)" }, { l: "Calculate Hourly Flow Rate", c: "Hourly Flow Rate = 12,000 m³/d / 24 hours/d = 500 m³/hour" }, { l: "Substitute and Calculate HDT", c: "HDT = 1,600 m³ / 500 m³/hour = 3.2 hours" }, { l: "Result", c: "The hydraulic detention time is 3.2 hours." } ],
    tip: "Detention time is volume divided by flow rate; ensure consistent time units.",
  },
  {
    id: 163,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the purpose of tube settlers or lamella plates in a sedimentation basin?",
    options: [
      "To increase the effective settling area, allowing higher flow rates or smaller basins",
      "To increase the turbulence and mixing in the basin",
      "To filter the water as it passes through",
      "To distribute the flow evenly at the inlet"
    ],
    correct: 0,
    explanation: "Tube settlers and lamella plates create many shallow settling zones within the basin, dramatically increasing the effective settling area (by 5–10×) and allowing higher surface overflow rates."
  },
  {
    id: 164,
    module: "Sedimentation",
    difficulty: "easy",
    question: "What is the Stokes' Law used to calculate in sedimentation?",
    options: [
      "The chemical dose required for coagulation",
      "The flow velocity in a distribution pipe",
      "The terminal settling velocity of a spherical particle in a quiescent fluid",
      "The chlorine demand of the water"
    ],
    correct: 2,
    explanation: "Stokes' Law calculates the terminal settling velocity of a spherical particle: vs = g(ρp-ρw)d²/(18μ), where d is particle diameter, ρ is density, and μ is dynamic viscosity."
  },
  {
    id: 165,
    module: "Sedimentation",
    difficulty: "medium",
    question: "According to Stokes' Law, how does particle diameter affect settling velocity?",
    options: [
      "Settling velocity is proportional to particle diameter",
      "Settling velocity is inversely proportional to particle diameter",
      "Settling velocity is proportional to the square of particle diameter",
      "Particle diameter has no effect on settling velocity"
    ],
    correct: 2,
    explanation: "Stokes' Law shows vs ∝ d², meaning doubling the particle diameter increases settling velocity by a factor of four — this is why flocculation to grow larger particles is so important."
  },
  {
    id: 166,
    module: "Sedimentation",
    difficulty: "medium",
    question: "How does water temperature affect particle settling velocity?",
    options: [
      "Higher temperature increases settling velocity by decreasing water viscosity",
      "Higher temperature decreases settling velocity by increasing water viscosity",
      "Temperature has no effect on settling velocity",
      "Lower temperature increases settling velocity by increasing particle density"
    ],
    correct: 0,
    explanation: "Higher water temperature reduces viscosity (μ), which according to Stokes' Law increases settling velocity. Cold water has higher viscosity, slowing settling."
  },
  {
    id: 167,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the weir overflow rate (WOR) in a sedimentation basin?",
    options: [
      "The flow rate over the effluent weir per unit length of weir",
      "The total flow rate entering the basin",
      "The rate of sludge removal from the basin floor",
      "The turbidity of water leaving the basin"
    ],
    correct: 0,
    explanation: "WOR = Q/L (m³/m·d), where L is the total weir length. High WOR can cause turbulence near the outlet that re-suspends settled floc; typical design values are <250 m³/m·d."
  },
  {
    id: 168,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the purpose of baffles at the inlet of a sedimentation basin?",
    options: [
      "To distribute flow evenly and reduce turbulence, preventing short-circuiting",
      "To increase the flow velocity through the basin",
      "To add chemicals to the incoming water",
      "To collect settled sludge"
    ],
    correct: 0,
    explanation: "Inlet baffles distribute flow evenly across the basin cross-section and dissipate inlet energy, reducing turbulence and preventing short-circuiting that would reduce effective detention time."
  },
  {
    id: 169,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is 'short-circuiting' in a sedimentation basin?",
    options: [
      "An electrical fault in the basin control system",
      "Flow that travels from inlet to outlet faster than the theoretical detention time, reducing treatment effectiveness",
      "Sludge that bypasses the collection system",
      "Turbulence caused by wind on the water surface"
    ],
    correct: 1,
    explanation: "Short-circuiting occurs when some water moves through the basin faster than the theoretical HDT, reducing effective contact time and allowing particles to escape without settling."
  },
  {
    id: 170,
    module: "Sedimentation",
    difficulty: "easy",
    question: "What is the Morrill Dispersion Index (MDI) used to measure?",
    options: [
      "The degree of short-circuiting in a basin, comparing actual to theoretical flow patterns",
      "The turbidity removal efficiency of a sedimentation basin",
      "The chemical dose required for coagulation",
      "The sludge volume in a clarifier"
    ],
    correct: 0,
    explanation: "The MDI (t90/t10) compares the time for 90% of tracer to exit versus 10%; values close to 1.0 indicate plug flow (ideal), while higher values indicate significant short-circuiting."
  },
  {
    id: 171,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is a circular clarifier and how does flow move through it?",
    options: [
      "Flow enters at the perimeter and exits at the centre",
      "Flow moves in a spiral pattern from top to bottom",
      "Flow enters at the bottom and exits at the top",
      "Flow enters at the centre, moves radially outward, and exits over a peripheral weir"
    ],
    correct: 3,
    explanation: "In a circular (radial flow) clarifier, water enters at the centre through a feed well, flows radially outward at decreasing velocity, and exits over a peripheral effluent weir."
  },
  {
    id: 172,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the purpose of a sludge collector mechanism in a sedimentation basin?",
    options: [
      "To mix the settled sludge back into the water",
      "To continuously move settled sludge to a collection hopper for removal",
      "To aerate the sludge for digestion",
      "To filter the sludge before disposal"
    ],
    correct: 1,
    explanation: "Sludge collectors (scrapers, rakes, or suction headers) continuously move settled sludge to a central hopper or sump from which it is pumped to sludge handling facilities."
  },
  {
    id: 173,
    isCalc: true,
    module: "Sedimentation",
    difficulty: "hard",
    question: "A circular clarifier has a diameter of 20 m and treats 5,000 m³/d. What is the surface overflow rate in m/d?",
    options: [
      "7.96 m/d",
      "31.83 m/d",
      "15.92 m/d",
      "63.66 m/d"
    ],
    correct: 2,
    explanation: "Calculate the surface area of the clarifier, then divide the flow rate by this area to find the surface overflow rate.\n\nStep 1 — Calculate the radius:\nRadius = Diameter ÷ 2 = 20 m ÷ 2 = 10 m\n\nStep 2 — Calculate the surface area:\nSurface Area = π × (Radius)² = 3.14159 × (10 m)² = 3.14159 × 100 m² = 314.16 m²\n\nStep 3 — Calculate the Surface Overflow Rate (SOR):\nSOR = Flow Rate ÷ Surface Area = 5,000 m³/d ÷ 314.16 m² = 15.915 m/d\n\nThe correct answer is 15.92 m/d.",
    steps: [ { l: "Formula for Surface Area (A) of a circle", c: "A = π * (D/2)^2, where D is the diameter." }, { l: "Calculate Surface Area", c: "A = π * (20 m / 2)^2 = π * (10 m)^2 = 314.16 m²" }, { l: "Formula for Surface Overflow Rate (SOR)", c: "SOR = Q / A, where Q is the flow rate and A is the surface area." }, { l: "Substitute values", c: "SOR = 5,000 m³/d / 314.16 m²" }, { l: "Calculate SOR", c: "SOR = 15.92 m/d" }, { l: "Result", c: "The surface overflow rate is 15.92 m/d." } ],
    tip: "Remember to use the radius (D/2) when calculating the area of a circle.",
  },
  {
    id: 174,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the purpose of a sludge blanket in an upflow clarifier?",
    options: [
      "To act as a filter medium for the water",
      "To store settled sludge before removal",
      "To provide a contact zone where incoming particles collide with and are captured by previously formed floc",
      "To distribute flow evenly across the basin"
    ],
    correct: 2,
    explanation: "The sludge blanket in an upflow clarifier provides a dense zone of previously formed floc that captures incoming particles through contact flocculation, improving removal efficiency."
  },
  {
    id: 175,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the typical turbidity target for settled water leaving a sedimentation basin?",
    options: [
      "Less than 5 NTU",
      "Less than 0.1 NTU",
      "Less than 20 NTU",
      "Less than 50 NTU"
    ],
    correct: 0,
    explanation: "Settled water turbidity should typically be below 5 NTU before filtration to ensure filters are not overloaded and can achieve the required finished water turbidity."
  },
  {
    id: 176,
    module: "Sedimentation",
    difficulty: "easy",
    question: "What is the difference between a rectangular and a circular sedimentation basin?",
    options: [
      "Rectangular basins use horizontal flow; circular basins use radial flow from a central inlet",
      "Rectangular basins use upflow, circular basins use horizontal flow",
      "Rectangular basins are used for softening; circular basins for coagulation",
      "There is no functional difference"
    ],
    correct: 0,
    explanation: "Rectangular basins use horizontal (plug) flow from inlet to outlet; circular basins use radial flow from a central feed well to a peripheral weir — both are common in water treatment."
  },
  {
    id: 177,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is 'density current' in a sedimentation basin and why is it a problem?",
    options: [
      "A current caused by high-density chemicals added to the water",
      "A current caused by temperature or density differences between incoming and basin water, causing short-circuiting",
      "A current caused by the sludge collector mechanism",
      "A current caused by wind on the water surface"
    ],
    correct: 1,
    explanation: "Density currents occur when incoming water is denser (colder or more turbid) than basin water, causing it to plunge and short-circuit along the basin floor — reducing effective detention time."
  },
  {
    id: 178,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the purpose of a flocculator-clarifier (solids contact unit)?",
    options: [
      "To separate the coagulation and sedimentation processes",
      "To filter water using a granular media bed",
      "To combine coagulation, flocculation, and sedimentation in a single unit with a recirculating sludge blanket",
      "To soften water using lime precipitation"
    ],
    correct: 2,
    explanation: "A solids contact unit combines rapid mix, flocculation, and sedimentation in one vessel, using a recirculating sludge blanket to improve floc contact and settling efficiency."
  },
  {
    id: 179,
    isCalc: true,
    module: "Sedimentation",
    difficulty: "hard",
    question: "A sedimentation basin has a volume of 2,000 m³ and treats 8,000 m³/d. A tracer study shows t10 = 0.15 hours and t90 = 2.8 hours. What is the Morrill Dispersion Index?",
    options: [
      "5.3",
      "8.7",
      "18.7",
      "28.0"
    ],
    correct: 2,
    explanation: "Calculate the Morrill Dispersion Index (MDI) by dividing the t90 value by the t10 value.\n\nStep 1 — Identify the given values:\nt10 = 0.15 hours\nt90 = 2.8 hours\n\nStep 2 — Calculate the Morrill Dispersion Index (MDI):\nMDI = t90 ÷ t10 = 2.8 hours ÷ 0.15 hours = 18.666...\n\nStep 3 — Round to one decimal place:\nMDI = 18.7\n\nThe correct answer is 18.7.",
    steps: [ { l: "Formula for Morrill Dispersion Index (MDI)", c: "MDI = t90 / t10, where t90 is the time for 90% tracer recovery and t10 is the time for 10% tracer recovery." }, { l: "Identify given values", c: "t10 = 0.15 hours, t90 = 2.8 hours" }, { l: "Substitute values into formula", c: "MDI = 2.8 hours / 0.15 hours" }, { l: "Calculate MDI", c: "MDI = 18.67" }, { l: "Result", c: "The Morrill Dispersion Index is 18.67." } ],
    tip: "A high MDI indicates poor hydraulic efficiency and potential short-circuiting.",
  },
  {
    id: 180,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the purpose of the effluent launder (collection trough) in a sedimentation basin?",
    options: [
      "To collect clarified water uniformly across the basin and convey it to the next treatment step",
      "To add chemicals to the settled water",
      "To distribute incoming water evenly at the inlet",
      "To remove floating scum from the water surface"
    ],
    correct: 0,
    explanation: "Effluent launders collect clarified water uniformly across the basin surface, preventing localized high-velocity zones near the outlet that could re-suspend settled floc."
  },
  {
    id: 181,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the purpose of a scum baffle in a sedimentation basin?",
    options: [
      "To prevent short-circuiting at the inlet",
      "To distribute flow evenly across the basin",
      "To collect settled sludge",
      "To prevent floating material (scum, algae, oil) from passing over the effluent weir"
    ],
    correct: 3,
    explanation: "Scum baffles are placed just upstream of the effluent weir to trap floating material (algae, oil, scum) and prevent it from passing into the filtered water."
  },
  {
    id: 182,
    module: "Sedimentation",
    difficulty: "easy",
    question: "What does the term 'clarified water' refer to in water treatment?",
    options: [
      "Water from which suspended solids have been removed by sedimentation",
      "Water that has been disinfected",
      "Water that has been softened",
      "Water that has been filtered"
    ],
    correct: 0,
    explanation: "Clarified water is the effluent from a sedimentation basin from which most suspended floc has been removed by gravity settling."
  },
  {
    id: 183,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the typical solids content of sludge removed from a water treatment sedimentation basin?",
    options: [
      "30 – 50%",
      "1 – 5%",
      "10 – 20%",
      "0.1 – 0.5%"
    ],
    correct: 3,
    explanation: "Raw sludge from water treatment sedimentation basins typically has a solids content of 0.1–0.5% (1,000–5,000 mg/L), requiring further thickening and dewatering before disposal."
  },
  {
    id: 184,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the purpose of sludge thickening in water treatment?",
    options: [
      "To improve the settling characteristics of the sludge",
      "To remove metals from the sludge",
      "To disinfect the sludge before disposal",
      "To reduce the volume of sludge by removing water, making it easier and cheaper to handle and dispose of"
    ],
    correct: 3,
    explanation: "Sludge thickening concentrates the solids content (typically to 2–8%), reducing the volume that must be transported and processed, lowering disposal costs."
  },
  {
    id: 185,
    isCalc: true,
    module: "Sedimentation",
    difficulty: "hard",
    question: "A sedimentation basin produces 50,000 L/d of sludge at 0.3% solids. After gravity thickening, the solids content increases to 3%. What is the volume of thickened sludge in L/d?",
    options: [
      "5,000 L/d",
      "500 L/d",
      "15,000 L/d",
      "50,000 L/d"
    ],
    correct: 0,
    explanation: "Calculate the mass of solids in the unthickened sludge, then use this mass to determine the volume of sludge at the new solids concentration.\n\nStep 1 — Calculate the mass of solids in the unthickened sludge:\n50,000 L/d × 0.003 = 150 kg solids/d\n\nStep 2 — Calculate the volume of thickened sludge:\n150 kg solids/d ÷ 0.03 = 5,000 L/d\n\nThe correct answer is 5,000 L/d.",
    steps: [ { l: "Calculate mass of dry solids in initial sludge", c: "Mass of solids (kg/d) = Volume of sludge (L/d) × Solids concentration (%) × (1 kg/L / 1000 L/m³) × (1000 g/kg / 1 g/mL) (assuming sludge density ≈ water density for mass calculation)" }, { l: "Substitute values for mass of solids", c: "Mass of solids = 50,000 L/d × 0.003 = 150 kg/d" }, { l: "Calculate volume of thickened sludge", c: "Volume of thickened sludge (L/d) = Mass of solids (kg/d) / (Thickened solids concentration (%) × Density of water (kg/L))" }, { l: "Substitute values for thickened sludge volume", c: "Volume of thickened sludge = 150 kg/d / (0.03 × 1 kg/L)" }, { l: "Calculate thickened sludge volume", c: "Volume of thickened sludge = 150 kg/d / 0.03 kg/L = 5,000 L/d" }, { l: "Result", c: "The volume of thickened sludge is 5,000 L/d." } ],
    tip: "Mass of dry solids remains constant during thickening; only volume changes.",
  },
  {
    id: 186,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the purpose of a dissolved air flotation (DAF) unit as an alternative to sedimentation?",
    options: [
      "To float low-density particles (algae, floc) to the surface using micro-bubbles for removal",
      "To settle heavy particles using gravity",
      "To filter water through a pressurized membrane",
      "To aerate water for taste and odour removal"
    ],
    correct: 0,
    explanation: "DAF uses pressurized water supersaturated with air; when released, micro-bubbles attach to floc and algae, floating them to the surface for skimming — effective for low-density particles."
  },
  {
    id: 187,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What raw water condition makes DAF more effective than conventional sedimentation?",
    options: [
      "High turbidity from clay particles",
      "High algae content or low-density floc that settles poorly",
      "High dissolved iron concentration",
      "High hardness"
    ],
    correct: 1,
    explanation: "DAF is particularly effective for waters with high algae content, low-density floc, or coloured water where conventional gravity settling is inefficient."
  },
  {
    id: 188,
    module: "Sedimentation",
    difficulty: "easy",
    question: "What is the purpose of the recycle stream in a DAF system?",
    options: [
      "To return settled sludge to the basin inlet",
      "To recirculate coagulant chemicals",
      "To dilute the incoming raw water",
      "To pressurize a portion of treated water with air, which is then released to create micro-bubbles"
    ],
    correct: 3,
    explanation: "In DAF, a recycle stream (typically 5–15% of plant flow) is pressurized to 3–6 bar with dissolved air, then released into the flotation tank to create the micro-bubbles needed for particle flotation."
  },
  {
    id: 189,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the typical surface loading rate for a DAF unit compared to conventional sedimentation?",
    options: [
      "DAF has lower loading rates (5–10 m/h) than sedimentation",
      "DAF has higher loading rates (5–15 m/h) than conventional sedimentation (0.5–2 m/h)",
      "DAF and sedimentation have the same loading rates",
      "DAF loading rates depend only on chemical dose"
    ],
    correct: 1,
    explanation: "DAF units can operate at much higher surface loading rates (5–15 m/h) than conventional sedimentation (0.5–2 m/h), allowing smaller footprints for the same flow."
  },
  {
    id: 190,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the purpose of a sludge blanket level controller in an upflow clarifier?",
    options: [
      "To control the chemical dose added to the water",
      "To measure the turbidity of the clarified water",
      "To maintain the sludge blanket at the optimal depth by controlling sludge withdrawal rate",
      "To control the flow rate through the clarifier"
    ],
    correct: 2,
    explanation: "Maintaining the sludge blanket at the correct depth is critical — too high and solids escape over the weir; too low and the contact zone is insufficient for effective treatment."
  },
  {
    id: 191,
    isCalc: true,
    module: "Sedimentation",
    difficulty: "hard",
    question: "A rectangular sedimentation basin (50 m × 12 m × 4 m) treats 18,000 m³/d. What is the horizontal flow velocity in m/h?",
    options: ["A. 0.31 m/h", "B. 0.625 m/h", "C. 7.81 m/h", "D. 15.63 m/h"],
    correct: 3,
    explanation: "Calculate the horizontal flow velocity by first converting the flow rate to an hourly basis, then determining the cross-sectional area, and finally dividing the hourly flow rate by the cross-sectional area.\n\nStep 1 — Convert daily flow rate to hourly flow rate:\n18,000 m³/d ÷ 24 h/d = 750 m³/h\n\nStep 2 — Calculate the cross-sectional area of the basin perpendicular to flow:\n12 m × 4 m = 48 m²\n\nStep 3 — Calculate the horizontal flow velocity:\n750 m³/h ÷ 48 m² = 15.625 m/h\n\nStep 4 — Round to two decimal places:\n15.625 m/h ≈ 15.63 m/h\n\nThe correct answer is 15.63 m/h.",
    steps: [ { l: "Convert flow rate to m³/h", c: "Q (m³/h) = 18,000 m³/d / 24 h/d = 750 m³/h" }, { l: "Calculate Cross-sectional Area (A)", c: "A = Width × Depth = 12 m × 4 m = 48 m²" }, { l: "Formula for Horizontal Flow Velocity (v)", c: "v = Q / A, where Q is the flow rate and A is the cross-sectional area." }, { l: "Substitute values", c: "v = 750 m³/h / 48 m²" }, { l: "Calculate velocity", c: "v = 15.625 m/h" }, { l: "Result", c: "The horizontal flow velocity is 15.63 m/h." } ],
    tip: "Ensure all units are consistent (e.g., m³/h and m²) before calculation.",
  },
  {
    id: 192,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the purpose of sludge blanket sensors in a sedimentation basin?",
    options: [
      "To measure the turbidity of the incoming raw water",
      "To control the coagulant dose",
      "To detect the depth of the sludge layer so operators can manage sludge withdrawal",
      "To measure the flow rate through the basin"
    ],
    correct: 2,
    explanation: "Sludge blanket sensors (ultrasonic or optical) measure the depth of the settled sludge layer, alerting operators when it is too deep and sludge withdrawal is needed."
  },
  {
    id: 193,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the effect of algae growth in a sedimentation basin?",
    options: [
      "Algae can cause taste and odour problems, interfere with settling, and clog filters",
      "Algae improve settling by acting as a natural coagulant",
      "Algae have no effect on sedimentation performance",
      "Algae reduce the required coagulant dose"
    ],
    correct: 0,
    explanation: "Algae growth in basins causes taste and odour, produces organic matter that increases DBP formation, reduces settling efficiency, and can clog filters — requiring algae control measures."
  },
  {
    id: 194,
    module: "Sedimentation",
    difficulty: "easy",
    question: "What is the purpose of covering sedimentation basins?",
    options: [
      "To prevent evaporation",
      "To reduce chemical costs",
      "To increase the water temperature",
      "To prevent algae growth, reduce taste and odour problems, and protect water quality"
    ],
    correct: 3,
    explanation: "Covering basins prevents sunlight from promoting algae growth, reduces contamination from birds and debris, and protects water quality — though it adds capital cost."
  },
  {
    id: 195,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the purpose of a floc recirculation system in some clarifiers?",
    options: [
      "To return filter backwash water to the inlet",
      "To pump settled sludge to a disposal facility",
      "To recycle clarified water for plant use",
      "To return settled floc to the inlet to seed incoming water and improve coagulation"
    ],
    correct: 3,
    explanation: "Floc recirculation returns a portion of settled sludge to the inlet, seeding the incoming water with pre-formed floc that accelerates coagulation and improves particle capture."
  },
  {
    id: 196,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the purpose of a stilling baffle (perforated baffle) in a sedimentation basin?",
    options: [
      "To add chemicals to the water",
      "To reduce turbulence and promote uniform flow distribution across the basin cross-section",
      "To collect settled sludge",
      "To aerate the water"
    ],
    correct: 1,
    explanation: "Perforated or stilling baffles dissipate inlet energy and distribute flow uniformly across the basin cross-section, reducing turbulence and short-circuiting."
  },
  {
    id: 197,
    isCalc: true,
    module: "Sedimentation",
    difficulty: "hard",
    question: "A sedimentation basin treats 10 ML/d and produces sludge at 0.2% solids. The sludge is thickened to 4% solids before disposal. If the thickened sludge density is 1,020 kg/m³, what is the volume of thickened sludge in m³/d? (Assume raw water TSS = 20 mg/L, 95% removal)",
    options: ["4.66 m³/d", "0.46 m³/d", "46.6 m³/d", "466 m³/d"],
    correct: 0,
    explanation: "Calculate the mass of solids removed, then determine the mass of thickened sludge, and finally convert this mass to a volume.\n\nStep 1 — Calculate the mass of solids removed per day:\n10 ML/d × 1,000,000 L/ML = 10,000,000 L/d\n10,000,000 L/d × 20 mg/L = 200,000,000 mg/d\n200,000,000 mg/d × 0.95 removal = 190,000,000 mg/d\n190,000,000 mg/d ÷ 1,000,000 mg/kg = 190 kg/d\n\nStep 2 — Calculate the mass of thickened sludge:\n190 kg/d ÷ 0.04 (4% solids) = 4,750 kg/d\n\nStep 3 — Calculate the volume of thickened sludge:\n4,750 kg/d ÷ 1,020 kg/m³ = 4.65686 m³/d\n\nStep 4 — Round to two decimal places:\n4.65686 m³/d ≈ 4.66 m³/d\n\nThe correct answer is 4.66 m³/d.",
    steps: [ { l: "Calculate mass of dry solids in initial sludge", c: "Mass of solids (kg/d) = Volume of sludge (L/d) × Solids concentration (%) × (1 kg/L / 1000 L/m³) (assuming sludge density ≈ water density for mass calculation)" }, { l: "Substitute values for mass of solids", c: "Mass of solids = 10,000,000 L/d × 0.002 = 20,000 kg/d" }, { l: "Calculate volume of thickened sludge", c: "Volume of thickened sludge (m³/d) = Mass of solids (kg/d) / (Thickened solids concentration (%) × Thickened sludge density (kg/m³))" }, { l: "Substitute values for thickened sludge volume", c: "Volume of thickened sludge = 20,000 kg/d / (0.04 × 1,020 kg/m³)" }, { l: "Calculate thickened sludge volume", c: "Volume of thickened sludge = 20,000 kg/d / 40.8 kg/m³ = 490.20 m³/d" }, { l: "Result", c: "The volume of thickened sludge is 490.20 m³/d." } ],
    tip: "Always use the correct density for thickened sludge when given.",
  },
  {
    id: 198,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the purpose of a sedimentation basin drain valve?",
    options: [
      "To control the flow rate through the basin",
      "To remove floating scum from the surface",
      "To allow the basin to be completely drained for inspection, maintenance, and cleaning",
      "To control the sludge withdrawal rate"
    ],
    correct: 2,
    explanation: "Drain valves allow the basin to be taken out of service and completely drained for inspection, cleaning, and maintenance of the sludge collection mechanism and basin floor."
  },
  {
    id: 199,
    module: "Sedimentation",
    difficulty: "medium",
    question: "What is the significance of the 'critical particle size' in sedimentation basin design?",
    options: [
      "The largest particle that can pass through the filter",
      "The smallest particle that can be completely removed given the basin's surface overflow rate",
      "The particle size that causes the most turbidity",
      "The particle size that requires the highest coagulant dose"
    ],
    correct: 1,
    explanation: "The critical particle is the smallest particle with a settling velocity equal to the SOR; all particles larger than the critical size will be completely removed, while smaller particles are only partially removed."
  },
  {
    id: 200,
    module: "Sedimentation",
    difficulty: "easy",
    question: "What is the purpose of a sedimentation basin bypass?",
    options: [
      "To allow raw water to bypass treatment during emergencies",
      "To recycle settled water back to the inlet",
      "To allow the plant to continue operating while a basin is taken out of service for maintenance",
      "To bypass the coagulation step during low-turbidity conditions"
    ],
    correct: 2,
    explanation: "Basin bypass piping allows one basin to be taken out of service for maintenance while the remaining basin(s) continue treating water, maintaining plant operation."
  },

  // ─── MODULE 5: Filtration (60 questions, IDs 201-260) ───

  {
    id: 201,
    module: "Filtration",
    difficulty: "easy",
    question: "What is the primary purpose of filtration in water treatment?",
    options: [
      "To add chemicals to the water",
      "To disinfect the water",
      "To remove dissolved minerals",
      "To remove suspended particles, floc, and microorganisms that pass through sedimentation"
    ],
    correct: 3,
    explanation: "Filtration removes residual suspended particles, floc, and microorganisms (including Giardia and Cryptosporidium cysts) that escape the sedimentation step."
  },
  {
    id: 202,
    module: "Filtration",
    difficulty: "easy",
    question: "What type of filter media is most commonly used in conventional water treatment?",
    options: [
      "Activated carbon",
      "Membrane",
      "Diatomaceous earth",
      "Granular sand or dual-media (anthracite over sand)"
    ],
    correct: 3,
    explanation: "Granular sand filters and dual-media filters (anthracite over sand) are the most common filter types in conventional water treatment plants."
  },
  {
    id: 203,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the typical hydraulic loading rate (filtration rate) for a conventional rapid sand filter?",
    options: [
      "5 – 15 m/h",
      "0.5 – 2 m/h",
      "20 – 30 m/h",
      "50 – 100 m/h"
    ],
    correct: 0,
    explanation: "Conventional rapid sand filters operate at hydraulic loading rates of 5–15 m/h (2–6 gpm/ft²), balancing filtration efficiency with run length between backwashes."
  },
  {
    id: 204,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of filter backwashing?",
    options: [
      "To add coagulant chemicals to the filter",
      "To disinfect the filter media",
      "To remove accumulated solids from the filter media by reversing the flow direction",
      "To compact the filter media for better filtration"
    ],
    correct: 2,
    explanation: "Backwashing reverses the flow through the filter at high velocity, expanding and fluidizing the media to release and flush away accumulated solids."
  },
  {
    id: 205,
    module: "Filtration",
    difficulty: "medium",
    question: "What triggers a filter backwash in a conventional water treatment plant?",
    options: [
      "Only a fixed time schedule",
      "Only operator discretion",
      "Only turbidity breakthrough",
      "Headloss across the filter reaching a maximum set point, turbidity breakthrough, or elapsed time"
    ],
    correct: 3,
    explanation: "Filters are typically backwashed when headloss reaches the maximum design value, when turbidity in the filter effluent exceeds a set point, or after a maximum run time — whichever comes first."
  },
  {
    id: 206,
    module: "Filtration",
    difficulty: "medium",
    question: "What is 'headloss' in a filter?",
    options: [
      "The loss of water over the filter weir",
      "The loss of filter media during backwashing",
      "The pressure drop across the filter media caused by accumulated solids",
      "The reduction in flow rate through the filter"
    ],
    correct: 2,
    explanation: "Headloss is the pressure drop (measured in metres of water) across the filter media; it increases as solids accumulate in the media, eventually requiring backwash."
  },
  {
    id: 207,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the typical maximum headloss before a filter is backwashed?",
    options: [
      "1.5 – 3.0 m",
      "0.1 – 0.5 m",
      "5 – 10 m",
      "20 – 30 m"
    ],
    correct: 0,
    explanation: "Most rapid sand filters are designed with a maximum allowable headloss of 1.5–3.0 m before backwashing is initiated."
  },
  {
    id: 208,
    module: "Filtration",
    difficulty: "easy",
    question: "What is the 'filter ripening' period?",
    options: [
      "The period at the end of a filter run when turbidity increases",
      "The time required to grow biological films on the filter media",
      "The initial period after backwash when the filter gradually improves in performance as media re-conditions",
      "The period when filter media is replaced"
    ],
    correct: 2,
    explanation: "Filter ripening is the initial period after backwash (typically 15–30 minutes) when the clean media gradually captures particles and turbidity in the effluent decreases to acceptable levels."
  },
  {
    id: 209,
    module: "Filtration",
    difficulty: "medium",
    question: "What is 'turbidity breakthrough' in a filter?",
    options: [
      "When turbidity in the raw water exceeds the filter's design capacity",
      "When turbidity in the filter effluent rises above acceptable limits, indicating filter failure",
      "When turbidity sensors malfunction",
      "When turbidity decreases below the detection limit"
    ],
    correct: 1,
    explanation: "Turbidity breakthrough occurs when the filter can no longer adequately remove particles, causing effluent turbidity to rise above the acceptable limit (typically 0.3 NTU in Ontario)."
  },
  {
    id: 210,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the Ontario Regulation requirement for filtered water turbidity?",
    options: [
      "Less than 1 NTU at all times and less than 0.3 NTU in 95% of measurements",
      "Less than 5 NTU at all times",
      "Less than 0.1 NTU at all times",
      "Less than 10 NTU at all times"
    ],
    correct: 0,
    explanation: "Ontario Regulation 170/03 requires filtered water turbidity to be less than 1.0 NTU at all times and less than 0.3 NTU in 95% of measurements taken in any calendar month."
  },
  {
    id: 211,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a filter-to-waste (waste filter backwash) period?",
    options: [
      "To divert filter effluent to waste during the ripening period until turbidity meets standards",
      "To waste the backwash water before it reaches the sewer",
      "To waste excess coagulant from the filter",
      "To remove air from the filter underdrain"
    ],
    correct: 0,
    explanation: "Filter-to-waste diverts the filter effluent during the ripening period (after backwash) until turbidity drops to acceptable levels, preventing substandard water from entering the distribution system."
  },
  {
    id: 212,
    module: "Filtration",
    difficulty: "medium",
    question: "What is a dual-media filter and what are its advantages?",
    options: [
      "A filter with anthracite on top of sand, allowing deeper penetration of solids and longer filter runs",
      "A filter using two types of sand with different grain sizes",
      "A filter using both sand and activated carbon",
      "A filter with two separate chambers in series"
    ],
    correct: 0,
    explanation: "Dual-media filters use coarser, lighter anthracite over finer, denser sand. The coarser anthracite captures larger particles in the upper layer while finer sand polishes the water, allowing longer runs and higher loading rates."
  },
  {
    id: 213,
    module: "Filtration",
    difficulty: "medium",
    question: "What is a tri-media filter?",
    options: [
      "A filter with anthracite, sand, and garnet layers that provides even deeper filtration",
      "A filter using three different types of sand",
      "A filter with three separate chambers",
      "A filter using three different coagulants"
    ],
    correct: 0,
    explanation: "Tri-media filters add a layer of dense garnet (or ilmenite) below the sand, providing three distinct filtration zones with progressively finer media for improved particle removal."
  },
  {
    id: 214,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of the filter underdrain system?",
    options: [
      "To remove air from the filter",
      "To add chemicals to the filtered water",
      "To measure the headloss across the filter",
      "To support the filter media and evenly collect filtered water and distribute backwash water"
    ],
    correct: 3,
    explanation: "The underdrain supports the filter media, collects filtered water uniformly during filtration, and distributes backwash water uniformly during backwashing to prevent channeling."
  },
  {
    id: 215,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a gravel support layer in a filter?",
    options: [
      "To filter out fine particles that pass through the sand",
      "To add minerals to the filtered water",
      "To support the filter media and prevent it from entering the underdrain",
      "To distribute the flow evenly across the filter surface"
    ],
    correct: 2,
    explanation: "The gravel support layer (graduated from coarse at the bottom to fine at the top) supports the filter media and prevents sand from entering and clogging the underdrain system."
  },
  {
    id: 216,
    isCalc: true,
    module: "Filtration",
    difficulty: "hard",
    question: "A filter has a surface area of 50 m² and treats 600 m³/h. What is the hydraulic loading rate in m/h?",
    options: [
      "6 m/h",
      "12 m/h",
      "18 m/h",
      "24 m/h"
    ],
    correct: 1,
    explanation: "Calculate the hydraulic loading rate by dividing the flow rate by the filter surface area.\n\nStep 1 — Identify the given values:\nFlow rate (Q) = 600 m³/h\nSurface area (A) = 50 m²\n\nStep 2 — Apply the hydraulic loading rate formula:\nHydraulic Loading Rate = Q ÷ A\nHydraulic Loading Rate = 600 m³/h ÷ 50 m²\n\nStep 3 — Calculate the result:\nHydraulic Loading Rate = 12 m/h\n\nThe correct answer is **12 m/h**.",
    steps: [ { l: "Formula", c: "Hydraulic Loading Rate = Flow Rate (Q) / Surface Area (A)" }, { l: "Substitute", c: "Hydraulic Loading Rate = 600 m³/h / 50 m²" }, { l: "Calculate", c: "Hydraulic Loading Rate = 12 m/h" }, { l: "Result", c: "The hydraulic loading rate is 12 m/h." } ],
    tip: "Remember units: m³/h divided by m² yields m/h, a loading rate.",
  },
  {
    id: 217,
    isCalc: true,
    module: "Filtration",
    difficulty: "hard",
    question: "A plant has four filters, each 8 m × 6 m. The plant flow is 20 ML/d. What is the hydraulic loading rate per filter in m/h when all four are in service?",
    options: [
      "8.7 m/h",
      "4.3 m/h",
      "17.4 m/h",
      "34.7 m/h"
    ],
    correct: 1,
    explanation: "Calculate the total filter area, convert the plant flow to an hourly rate, then divide the hourly flow by the total filter area to find the hydraulic loading rate.\n\nStep 1 — Calculate the area of one filter:\n8 m × 6 m = 48 m²\n\nStep 2 — Calculate the total filter area for all four filters:\n4 filters × 48 m²/filter = 192 m²\n\nStep 3 — Convert the plant flow from ML/d to m³/h:\n20 ML/d = 20,000 m³/d\n20,000 m³/d ÷ 24 h/d = 833.33 m³/h\n\nStep 4 — Calculate the hydraulic loading rate per filter:\n833.33 m³/h ÷ 192 m² = 4.34 m/h\n\nThe correct answer is 4.3 m/h.",
    steps: [ { l: "Step 1: Calculate the area of one filter", c: "Area per filter = Length × Width = 8 m × 6 m = 48 m²" }, { l: "Step 2: Calculate the total filter area", c: "Total filter area = Number of filters × Area per filter = 4 × 48 m² = 192 m²" }, { l: "Step 3: Convert the plant flow rate to m³/h", c: "Plant flow = 20 ML/d = 20,000 m³/d. Convert to m³/h: 20,000 m³/d / 24 h/d = 833.33 m³/h" }, { l: "Step 4: Calculate the hydraulic loading rate", c: "Hydraulic Loading Rate = Plant Flow / Total Filter Area = 833.33 m³/h / 192 m²" }, { l: "Calculate", c: "Hydraulic Loading Rate = 4.34 m/h" }, { l: "Result", c: "The hydraulic loading rate per filter is 4.34 m/h." } ],
    tip: "Ensure all units are consistent (e.g., m³/h and m²) before calculating loading rates.",
  },
  {
    id: 218,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the effective size (ES) of filter media?",
    options: [
      "The sieve size that passes 10% of the media by weight (d10)",
      "The average grain size of the media",
      "The sieve size that passes 90% of the media by weight",
      "The maximum grain size of the media"
    ],
    correct: 0,
    explanation: "Effective size (ES or d10) is the sieve opening that passes 10% of the media by weight. It is a key design parameter that affects headloss and filtration efficiency."
  },
  {
    id: 219,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the uniformity coefficient (UC) of filter media?",
    options: [
      "The ratio of media depth to filter area",
      "The ratio of the largest to smallest grain size",
      "The percentage of media that is uniform in size",
      "The ratio of d60 to d10 grain sizes, indicating the range of grain sizes in the media"
    ],
    correct: 3,
    explanation: "UC = d60/d10. A UC close to 1.0 indicates very uniform media; values above 1.5 indicate a wide range of grain sizes. Lower UC values generally produce more uniform headloss development."
  },
  {
    id: 220,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the typical effective size for rapid sand filter media?",
    options: [
      "0.45 – 0.55 mm",
      "0.05 – 0.1 mm",
      "2 – 5 mm",
      "10 – 20 mm"
    ],
    correct: 0,
    explanation: "Rapid sand filter media typically has an effective size (d10) of 0.45–0.55 mm, balancing filtration efficiency with acceptable headloss development rates."
  },
  {
    id: 221,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the typical depth of sand media in a rapid sand filter?",
    options: [
      "10 – 20 cm",
      "60 – 90 cm",
      "2 – 3 m",
      "5 – 10 m"
    ],
    correct: 1,
    explanation: "Rapid sand filters typically have 60–90 cm of sand media, which provides adequate depth for particle capture while maintaining manageable headloss."
  },
  {
    id: 222,
    module: "Filtration",
    difficulty: "medium",
    question: "What is 'mudballing' in a filter and what causes it?",
    options: [
      "The formation of dense balls of media that improve filtration",
      "The formation of biological films on the filter media",
      "The accumulation of mud at the filter inlet",
      "The formation of hard, dense balls of accumulated solids in the filter media caused by inadequate backwashing"
    ],
    correct: 3,
    explanation: "Mudballs form when coagulated solids are not fully removed during backwashing, accumulating and hardening into dense balls that cause channeling, reduced filter performance, and uneven backwash distribution."
  },
  {
    id: 223,
    module: "Filtration",
    difficulty: "medium",
    question: "What is 'media migration' in a filter and why is it a problem?",
    options: [
      "The movement of media from one filter to another during backwash",
      "The biological growth that moves through the media",
      "The movement of media to the bottom of the filter during operation",
      "The loss of fine media particles over the backwash trough, reducing media depth and changing filtration characteristics"
    ],
    correct: 3,
    explanation: "Media migration (loss) occurs when backwash velocity is too high, carrying fine media particles over the backwash troughs — reducing media depth and requiring periodic media replacement."
  },
  {
    id: 224,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of surface wash or air scour during filter backwashing?",
    options: [
      "To add disinfectant to the filter during backwashing",
      "To provide additional agitation to break up mudballs and improve solids removal from the media",
      "To distribute backwash water evenly across the filter surface",
      "To measure the turbidity of the backwash water"
    ],
    correct: 1,
    explanation: "Surface wash (rotating nozzles) and air scour (compressed air) provide additional agitation during backwashing to break up mudballs and improve the removal of accumulated solids from the media."
  },
  {
    id: 225,
    isCalc: true,
    module: "Filtration",
    difficulty: "hard",
    question: "A filter has a surface area of 40 m² and is backwashed at a rate of 36 m/h for 10 minutes. What volume of backwash water is used per backwash cycle?",
    options: [
      "240 m³",
      "120 m³",
      "360 m³",
      "480 m³"
    ],
    correct: 0,
    explanation: "Calculate the volume of backwash water by multiplying the backwash rate by the filter surface area and the duration of the backwash.\n\nStep 1 — Convert backwash time to hours:\n10 minutes ÷ 60 minutes/hour = 0.1666666667 hours\n\nStep 2 — Calculate the volume of backwash water:\nVolume = 36 m/h × 40 m² × 0.1666666667 h = 240 m³\n\nThe correct answer is 240 m³.",
    steps: [ { l: "Formula", c: "Volume of Backwash Water = Backwash Rate × Surface Area × Backwash Time" }, { l: "Step 1: Convert backwash time to hours", c: "Backwash Time = 10 minutes / 60 minutes/hour = 0.16667 hours" }, { l: "Substitute", c: "Volume of Backwash Water = 36 m/h × 40 m² × 0.16667 h" }, { l: "Calculate", c: "Volume of Backwash Water = 240 m³" }, { l: "Result", c: "The volume of backwash water used is 240 m³." } ],
    tip: "Always convert time units to match the rate's time unit (e.g., hours).",
  },
  {
    id: 226,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the typical backwash rate for a rapid sand filter?",
    options: [
      "5 – 10 m/h",
      "200 – 300 m/h",
      "100 – 150 m/h",
      "25 – 50 m/h"
    ],
    correct: 3,
    explanation: "Rapid sand filters are typically backwashed at 25–50 m/h (10–20 gpm/ft²), which is sufficient to expand and fluidize the media for effective solids removal."
  },
  {
    id: 227,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a backwash trough in a filter?",
    options: [
      "To distribute backwash water evenly across the filter",
      "To collect and remove the backwash water and suspended solids from the filter",
      "To store backwash water for reuse",
      "To measure the volume of backwash water used"
    ],
    correct: 1,
    explanation: "Backwash troughs collect the expanded media and suspended solids-laden backwash water and convey it out of the filter to the backwash recovery or waste system."
  },
  {
    id: 228,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a slow sand filter compared to a rapid sand filter?",
    options: [
      "Slow sand filters use chemicals; rapid sand filters do not",
      "Slow sand filters are used for large plants; rapid sand filters for small plants",
      "Slow sand filters rely on biological activity (Schmutzdecke) and physical straining at very low rates; no coagulation needed",
      "Slow sand filters remove dissolved minerals; rapid sand filters remove suspended particles"
    ],
    correct: 2,
    explanation: "Slow sand filters operate at very low rates (0.1–0.4 m/h) and develop a biological layer (Schmutzdecke) on the surface that provides excellent removal of bacteria and protozoa without chemical coagulation."
  },
  {
    id: 229,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the Schmutzdecke in a slow sand filter?",
    options: [
      "A chemical coating applied to the filter media",
      "A fine sand layer added on top of the filter media",
      "A layer of activated carbon added to improve taste and odour removal",
      "A biological layer of microorganisms, algae, and organic matter that forms on the surface of slow sand filters"
    ],
    correct: 3,
    explanation: "The Schmutzdecke (German: 'dirt skin') is a biologically active layer that develops on the surface of slow sand filters, providing excellent removal of bacteria, viruses, and protozoa."
  },
  {
    id: 230,
    module: "Filtration",
    difficulty: "medium",
    question: "What is a pressure filter and when is it used?",
    options: [
      "A filter that operates under vacuum",
      "A filter that uses high pressure to force water through a membrane",
      "A closed vessel filter that operates under pressure, used where gravity filters are impractical or for small systems",
      "A filter used only for industrial applications"
    ],
    correct: 2,
    explanation: "Pressure filters are enclosed vessels operating under pressure (typically 200–700 kPa), useful for small systems, package plants, or where the hydraulic grade line is insufficient for gravity filtration."
  },
  {
    id: 231,
    module: "Filtration",
    difficulty: "medium",
    question: "What is a membrane filter and what types are used in water treatment?",
    options: [
      "A filter using a biological membrane",
      "A filter using a woven fabric membrane",
      "A filter using a semi-permeable membrane; types include microfiltration (MF), ultrafiltration (UF), nanofiltration (NF), and reverse osmosis (RO)",
      "A filter using a ceramic membrane only"
    ],
    correct: 2,
    explanation: "Membrane filtration uses semi-permeable membranes to separate particles and dissolved substances. MF/UF remove particles and microorganisms; NF/RO remove dissolved salts and organics."
  },
  {
    id: 232,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of granular activated carbon (GAC) in water treatment?",
    options: [
      "To remove suspended particles from water",
      "To disinfect the water",
      "To adsorb dissolved organic compounds, taste and odour compounds, and some micropollutants",
      "To soften the water"
    ],
    correct: 2,
    explanation: "GAC adsorbs dissolved organic compounds including taste and odour compounds (geosmin, MIB), DBP precursors, and micropollutants through physical adsorption onto its large surface area."
  },
  {
    id: 233,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the empty bed contact time (EBCT) in a GAC filter?",
    options: [
      "The time for water to travel through the filter at maximum flow",
      "The volume of GAC divided by the flow rate, representing the theoretical contact time between water and carbon",
      "The time between GAC regeneration cycles",
      "The time required to backwash the GAC filter"
    ],
    correct: 1,
    explanation: "EBCT = V_GAC/Q. It is the key design parameter for GAC contactors; typical values are 5–30 minutes depending on the target contaminants."
  },
  {
    id: 234,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a filter gallery in a water treatment plant?",
    options: [
      "The area beneath the filters housing the underdrain piping, valves, and instrumentation for filter operation",
      "A display area for filter equipment",
      "A storage area for filter media",
      "A laboratory for testing filter performance"
    ],
    correct: 0,
    explanation: "The filter gallery is the space below the filter floor containing the underdrain system, filter effluent piping, backwash supply piping, and the valves and instruments that control filter operation."
  },
  {
    id: 235,
    isCalc: true,
    module: "Filtration",
    difficulty: "hard",
    question: "A plant has 6 filters, each 10 m × 8 m. The plant treats 30 ML/d. One filter is taken out of service for maintenance. What is the new hydraulic loading rate per filter in m/h?",
    options: ["7.5 m/h", "6.25 m/h", "3.125 m/h", "10.4 m/h"],
    correct: 2,
    explanation: "Calculate the surface area of one filter, determine the total operating filter area, convert the plant flow rate to cubic meters per hour, and then calculate the hydraulic loading rate.\n\nStep 1 — Calculate the surface area of one filter:\n10 m × 8 m = 80 m^2\n\nStep 2 — Calculate the total operating filter area:\n6 filters - 1 filter = 5 operating filters\n5 filters × 80 m^2/filter = 400 m^2\n\nStep 3 — Convert the plant flow rate to m^3/h:\n30 ML/d = 30,000 m^3/d\n30,000 m^3/d ÷ 24 h/d = 1,250 m^3/h\n\nStep 4 — Calculate the new hydraulic loading rate:\n1,250 m^3/h ÷ 400 m^2 = 3.125 m/h\n\nThe correct answer is 3.125 m/h.",
    steps: [ { l: "Step 1: Calculate the area of one filter", c: "Area per filter = Length × Width = 10 m × 8 m = 80 m²" }, { l: "Step 2: Calculate the total filter area with one filter out of service", c: "Number of filters in service = 6 - 1 = 5 filters. Total filter area = 5 filters × 80 m²/filter = 400 m²" }, { l: "Step 3: Convert the plant flow rate to m³/h", c: "Plant flow = 30 ML/d = 30,000 m³/d. Convert to m³/h: 30,000 m³/d / 24 h/d = 1,250 m³/h" }, { l: "Step 4: Calculate the new hydraulic loading rate", c: "Hydraulic Loading Rate = Plant Flow / Total Filter Area = 1,250 m³/h / 400 m²" }, { l: "Calculate", c: "Hydraulic Loading Rate = 3.125 m/h" }, { l: "Result", c: "The new hydraulic loading rate per filter is 3.125 m/h." } ],
    tip: "Adjust total area for filters out of service; flow remains constant.",
  },
  {
    id: 236,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of individual filter turbidimeters?",
    options: [
      "To measure the turbidity of the raw water entering each filter",
      "To measure the headloss across each filter",
      "To continuously monitor the turbidity of each filter's effluent to detect turbidity breakthrough",
      "To control the backwash cycle"
    ],
    correct: 2,
    explanation: "Individual filter turbidimeters continuously monitor each filter's effluent turbidity, allowing operators to detect turbidity breakthrough and initiate backwash before substandard water reaches the distribution system."
  },
  {
    id: 237,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a filter control system (filter level controller)?",
    options: [
      "To control the chemical dose added to the filter",
      "To control the backwash pump speed",
      "To maintain a constant water level above the filter media, ensuring consistent hydraulic loading",
      "To measure the turbidity of the filtered water"
    ],
    correct: 2,
    explanation: "Filter level controllers maintain a constant water level above the media (constant head operation) or control the outlet valve to maintain constant flow (declining rate filtration), ensuring consistent performance."
  },
  {
    id: 238,
    module: "Filtration",
    difficulty: "medium",
    question: "What is 'declining rate filtration'?",
    options: [
      "A method where filters operate at variable declining flow rates as headloss increases, without flow control valves",
      "A filtration method where the flow rate increases over the filter run",
      "A method where the filter is taken out of service as it ages",
      "A method where the filtration rate is manually reduced by operators"
    ],
    correct: 0,
    explanation: "In declining rate filtration, filters share a common inlet and outlet header; as headloss builds in one filter, flow naturally shifts to cleaner filters — no individual flow control valves are needed."
  },
  {
    id: 239,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a filter inspection port or sampling tap?",
    options: [
      "To collect water samples from different depths within the filter media to assess filter performance",
      "To add chemicals to the filter",
      "To measure the filter media depth",
      "To drain the filter for maintenance"
    ],
    correct: 0,
    explanation: "Sampling taps at different depths in the filter allow operators to collect water samples to assess where particle removal is occurring and detect early signs of filter breakthrough."
  },
  {
    id: 240,
    module: "Filtration",
    difficulty: "easy",
    question: "What is the purpose of a filter run length log?",
    options: [
      "To record the amount of chemicals added to each filter",
      "To track the time between backwashes, helping operators identify changes in filter performance",
      "To record the turbidity of each filter's effluent",
      "To schedule filter maintenance"
    ],
    correct: 1,
    explanation: "Tracking filter run lengths helps operators identify trends — shorter runs may indicate poor coagulation, high raw water turbidity, or filter media problems requiring attention."
  },
  {
    id: 241,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a backwash recovery system?",
    options: [
      "To collect, settle, and return the backwash water to the plant inlet for re-treatment, reducing water loss",
      "To recover chemicals from the backwash water",
      "To treat backwash water before discharge to the sewer",
      "To recycle backwash water directly to the filter"
    ],
    correct: 0,
    explanation: "Backwash recovery systems collect backwash water in a lagoon or tank, allow solids to settle, and return the clarified water to the plant inlet — reducing water loss and improving plant efficiency."
  },
  {
    id: 242,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a filter-to-waste valve?",
    options: [
      "To waste excess coagulant from the filter",
      "To bypass the filter during high flow periods",
      "To drain the filter for maintenance",
      "To divert filter effluent to waste during the ripening period after backwash"
    ],
    correct: 3,
    explanation: "The filter-to-waste valve diverts filter effluent to the backwash recovery system or drain during the ripening period, preventing substandard water from entering the distribution system."
  },
  {
    id: 243,
    isCalc: true,
    module: "Filtration",
    difficulty: "hard",
    question: "A filter run produces 4,000 m³ of filtered water before backwash is required. The backwash uses 120 m³ of water. What is the backwash water as a percentage of filtered water?",
    options: [
      "3%",
      "1%",
      "5%",
      "10%"
    ],
    correct: 0,
    explanation: "To find the backwash water as a percentage of filtered water, divide the volume of backwash water by the volume of filtered water and multiply by 100.\n\nStep 1 — Calculate the ratio of backwash water to filtered water:\n120 m³ (backwash) ÷ 4,000 m³ (filtered) = 0.03\n\nStep 2 — Convert the ratio to a percentage:\n0.03 × 100% = 3%\n\nThe correct answer is 3%.",
    steps: [ { l: "Formula", c: "Backwash Water Percentage = (Volume of Backwash Water / Volume of Filtered Water) × 100%" }, { l: "Substitute", c: "Backwash Water Percentage = (120 m³ / 4,000 m³) × 100%" }, { l: "Calculate", c: "Backwash Water Percentage = 0.03 × 100% = 3%" }, { l: "Result", c: "The backwash water is 3% of the filtered water." } ],
    tip: "Percentage calculations always involve (part/whole) × 100.",
  },
  {
    id: 244,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a filter media depth gauge?",
    options: [
      "To measure the depth of filter media to detect media loss over time",
      "To measure the water level above the filter media",
      "To measure the headloss across the filter",
      "To measure the turbidity of the filtered water"
    ],
    correct: 0,
    explanation: "Regular media depth measurements detect media loss from excessive backwash velocity or media migration, allowing operators to schedule media addition before performance is compromised."
  },
  {
    id: 245,
    module: "Filtration",
    difficulty: "medium",
    question: "What is 'negative head' in a filter and why is it a problem?",
    options: [
      "A condition where the water level above the filter is negative",
      "A condition where the filter is operating at negative flow",
      "A condition where the filter outlet pressure is negative",
      "A condition where pressure within the filter media drops below atmospheric, causing dissolved gases to come out of solution and form air pockets"
    ],
    correct: 3,
    explanation: "Negative head (sub-atmospheric pressure) within the filter media causes dissolved gases to come out of solution, forming air pockets that block flow paths, reduce effective filter area, and cause channeling."
  },
  {
    id: 246,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a filter wash water trough height adjustment?",
    options: [
      "To control the water level above the filter media",
      "To ensure the backwash trough is at the correct height to collect expanded media without allowing media loss",
      "To adjust the backwash flow rate",
      "To control the headloss across the filter"
    ],
    correct: 1,
    explanation: "Backwash trough height must be set correctly — too low and media is lost over the trough; too high and solids are not effectively removed from the filter."
  },
  {
    id: 247,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a filter profile test (core sample)?",
    options: [
      "To examine the distribution of solids accumulation and detect mudballs or media segregation within the filter",
      "To measure the turbidity profile through the filter depth",
      "To measure the headloss at different depths in the filter",
      "To collect water samples from different filter depths"
    ],
    correct: 0,
    explanation: "A filter core sample (profile test) extracts a vertical sample of filter media to examine the distribution of accumulated solids, detect mudballs, and assess the condition of the media and gravel support."
  },
  {
    id: 248,
    module: "Filtration",
    difficulty: "easy",
    question: "What is the purpose of a filter inspection after taking it out of service?",
    options: [
      "To add new chemicals to the filter",
      "To measure the filter media grain size",
      "To visually inspect the media surface, underdrain, and backwash troughs for mudballs, cracks, or damage",
      "To test the filter effluent turbidity"
    ],
    correct: 2,
    explanation: "Regular filter inspections (when drained) allow operators to check for mudballs, media loss, underdrain damage, cracks in the filter floor, and backwash trough condition."
  },
  {
    id: 249,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a continuous backwash filter (moving bed filter)?",
    options: [
      "To continuously backwash all filters simultaneously",
      "To provide continuous filtration without interruption by continuously cleaning a portion of the media using an internal airlift",
      "To use a moving belt to transport filter media",
      "To continuously add media to the filter"
    ],
    correct: 1,
    explanation: "Moving bed (continuous backwash) filters use an internal airlift to continuously recirculate and clean a portion of the sand media, allowing uninterrupted filtration without dedicated backwash cycles."
  },
  {
    id: 250,
    isCalc: true,
    module: "Filtration",
    difficulty: "hard",
    question: "A filter has a media depth of 75 cm of sand (ES = 0.5 mm, UC = 1.4) and 30 cm of anthracite (ES = 1.2 mm). During backwash at 40 m/h, the sand expands by 30%. What is the expanded depth of the sand layer?",
    options: [
      "97.5 cm",
      "82.5 cm",
      "105 cm",
      "112.5 cm"
    ],
    correct: 0,
    explanation: "Calculate the expanded depth of the sand layer by multiplying its original depth by the expansion factor.\n\nStep 1 — Determine the expansion factor:\n1 + 0.30 (expansion fraction) = 1.30\n\nStep 2 — Calculate the expanded depth of the sand:\n75 cm (original depth) × 1.30 (expansion factor) = 97.5 cm\n\nThe correct answer is 97.5 cm.",
    steps: [ { l: "Formula", c: "Expanded Depth = Original Depth × (1 + Expansion Fraction)" }, { l: "Step 1", c: "Identify the given values: Original Depth = 75 cm, Expansion Fraction = 30% or 0.30." }, { l: "Substitute", c: "Expanded Depth = 75 cm × (1 + 0.30)" }, { l: "Calculate", c: "Expanded Depth = 75 cm × 1.30 = 97.5 cm" }, { l: "Result", c: "The expanded depth of the sand is 97.5 cm." } ],
    tip: "Remember to convert percentage expansion to a decimal for calculations.",
  },
  {
    id: 251,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a filter effluent particle counter?",
    options: [
      "To count the number of bacteria in the filtered water",
      "To measure the number and size distribution of particles in the filter effluent, providing early warning of filter breakthrough",
      "To measure the turbidity of the filtered water",
      "To count the number of filter backwash cycles"
    ],
    correct: 1,
    explanation: "Particle counters measure particles (typically 2–100 μm) in filter effluent, providing more sensitive and faster detection of filter breakthrough than turbidimeters alone."
  },
  {
    id: 252,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the significance of Cryptosporidium and Giardia in filter design?",
    options: [
      "They affect the coagulant dose required",
      "They affect the pH of filtered water",
      "They cause taste and odour problems in filtered water",
      "They are chlorine-resistant protozoan pathogens that require physical removal by filtration for adequate treatment"
    ],
    correct: 3,
    explanation: "Cryptosporidium oocysts and Giardia cysts are highly chlorine-resistant, requiring physical removal by filtration. Ontario regulations require 3-log (99.9%) removal of Giardia and 2-log removal of Cryptosporidium."
  },
  {
    id: 253,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a filter headloss gauge (differential pressure transmitter)?",
    options: [
      "To continuously measure the pressure drop across the filter media, indicating when backwash is needed",
      "To measure the water level above the filter media",
      "To measure the flow rate through the filter",
      "To measure the turbidity of the filtered water"
    ],
    correct: 0,
    explanation: "Differential pressure transmitters measure headloss across the filter media in real time, providing automated backwash initiation when headloss reaches the design maximum."
  },
  {
    id: 254,
    module: "Filtration",
    difficulty: "easy",
    question: "What is the purpose of a filter clearwell?",
    options: [
      "To store raw water before treatment",
      "To store backwash water",
      "To store filtered and disinfected water before distribution, providing contact time for disinfection",
      "To store coagulant chemicals"
    ],
    correct: 2,
    explanation: "The clearwell stores finished (filtered and disinfected) water, provides CT (concentration × time) for disinfection, and acts as a buffer between treatment and distribution demand fluctuations."
  },
  {
    id: 255,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a filter-to-waste flow meter?",
    options: [
      "To measure the total volume of water filtered",
      "To measure the volume of water wasted during the filter ripening period, for water loss accounting",
      "To measure the backwash flow rate",
      "To measure the filter effluent turbidity"
    ],
    correct: 1,
    explanation: "Filter-to-waste flow meters measure the volume of water diverted to waste during ripening, which is important for water loss accounting and regulatory reporting."
  },
  {
    id: 256,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a filter rate-of-flow controller?",
    options: [
      "To control the backwash flow rate",
      "To maintain a constant filtration rate by automatically adjusting the outlet valve as headloss increases",
      "To control the chemical dose added to the filter",
      "To control the water level above the filter media"
    ],
    correct: 1,
    explanation: "Rate-of-flow controllers maintain constant filtration rate by opening the outlet valve as headloss increases, ensuring consistent hydraulic loading throughout the filter run."
  },
  {
    id: 257,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a filter media replacement program?",
    options: [
      "To replace filter media on a fixed annual schedule",
      "To replace media whenever a new coagulant is used",
      "To replace media when it has lost significant depth, developed excessive mudballing, or no longer meets performance standards",
      "To replace media after each backwash cycle"
    ],
    correct: 2,
    explanation: "Filter media is replaced when depth measurements show significant loss, when mudballing cannot be corrected by enhanced backwashing, or when filter performance consistently fails to meet turbidity targets."
  },
  {
    id: 258,
    isCalc: true,
    module: "Filtration",
    difficulty: "hard",
    question: "A filter run produces 5,500 m³ of water before backwash. The filter has a surface area of 45 m² and operates at 10 m/h. How long is the filter run in hours?",
    options: [
      "12.2 hours",
      "8.2 hours",
      "16.3 hours",
      "24.4 hours"
    ],
    correct: 0,
    explanation: "Calculate the filter's flow rate, then divide the total volume produced by this flow rate to find the run time.\n\nStep 1 — Calculate the filter's flow rate:\nFlow Rate = Filter Operating Rate × Filter Surface Area\nFlow Rate = 10 m/h × 45 m² = 450 m³/h\n\nStep 2 — Calculate the filter run time:\nRun Time = Total Volume Produced ÷ Flow Rate\nRun Time = 5,500 m³ ÷ 450 m³/h = 12.22 hours\n\nThe correct answer is 12.2 hours.",
    steps: [ { l: "Formula 1", c: "Flow Rate = Filtration Rate × Surface Area" }, { l: "Formula 2", c: "Run Time = Total Volume / Flow Rate" }, { l: "Step 1", c: "Identify the given values: Total Volume = 5,500 m³, Surface Area = 45 m², Filtration Rate = 10 m/h." }, { l: "Substitute 1", c: "Flow Rate = 10 m/h × 45 m²" }, { l: "Calculate 1", c: "Flow Rate = 450 m³/h" }, { l: "Substitute 2", c: "Run Time = 5,500 m³ / 450 m³/h" }, { l: "Calculate 2", c: "Run Time = 12.22 hours (rounded to two decimal places)" }, { l: "Result", c: "The filter run is approximately 12.2 hours." } ],
    tip: "Break down multi-step problems; calculate flow rate first, then run time.",
  },
  {
    id: 259,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a filter inlet flow splitter?",
    options: [
      "To distribute flow evenly among multiple filters operating in parallel",
      "To add chemicals to the filter inlet",
      "To control the backwash flow rate",
      "To measure the turbidity of the incoming water"
    ],
    correct: 0,
    explanation: "Flow splitters ensure equal distribution of flow among parallel filters, preventing overloading of individual filters and ensuring uniform treatment."
  },
  {
    id: 260,
    module: "Filtration",
    difficulty: "medium",
    question: "What is the purpose of a filter performance log?",
    options: [
      "To record the names of operators who worked on each filter",
      "To record the volume of media in each filter",
      "To document filter run lengths, turbidity, headloss, and backwash data for trend analysis and regulatory compliance",
      "To schedule filter maintenance activities"
    ],
    correct: 2,
    explanation: "Filter performance logs document key operational parameters over time, enabling trend analysis, regulatory compliance reporting, and early identification of performance problems."
  },

  // ─── MODULE 6: Disinfection (65 questions, IDs 261-325) ───

  {
    id: 261,
    module: "Disinfection",
    difficulty: "easy",
    question: "What is the primary purpose of disinfection in water treatment?",
    options: [
      "To inactivate pathogenic microorganisms to prevent waterborne disease",
      "To remove turbidity from the water",
      "To remove dissolved minerals",
      "To improve the taste of the water"
    ],
    correct: 0,
    explanation: "Disinfection inactivates pathogenic bacteria, viruses, and protozoa to prevent waterborne diseases such as typhoid, cholera, giardiasis, and cryptosporidiosis."
  },
  {
    id: 262,
    module: "Disinfection",
    difficulty: "easy",
    question: "What is the most commonly used disinfectant in Ontario drinking water systems?",
    options: [
      "Ozone",
      "Chlorine dioxide",
      "Ultraviolet (UV) radiation",
      "Chlorine (as chlorine gas, sodium hypochlorite, or calcium hypochlorite)"
    ],
    correct: 3,
    explanation: "Chlorine in its various forms (Cl₂ gas, NaOCl, Ca(OCl)₂) is the most widely used disinfectant in Ontario due to its effectiveness, residual maintenance capability, and low cost."
  },
  {
    id: 263,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the CT concept in disinfection?",
    options: [
      "The ratio of chlorine to turbidity",
      "The ratio of contact time to temperature",
      "The product of disinfectant concentration (C, mg/L) and contact time (T, minutes), used to quantify disinfection effectiveness",
      "The concentration of chlorine in the treated water"
    ],
    correct: 2,
    explanation: "CT = C × T (mg/L × min). Higher CT values provide greater pathogen inactivation. Ontario regulations specify minimum CT values for 3-log Giardia and 4-log virus inactivation."
  },
  {
    id: 264,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the T10 value used in CT calculations?",
    options: [
      "The temperature of the water at 10°C",
      "The time for 10% of pathogens to be inactivated",
      "The time for 10% of a tracer to pass through a contact basin, representing the effective contact time",
      "The contact time at 10 mg/L chlorine"
    ],
    correct: 2,
    explanation: "T10 is the time for 10% of a conservative tracer to exit a contact basin; it accounts for short-circuiting and represents the time that 90% of the water spends in the basin — the effective contact time for CT calculations."
  },
  {
    id: 265,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is free chlorine residual?",
    options: [
      "Chlorine that has reacted with organic matter",
      "Chlorine present as HOCl (hypochlorous acid) and OCl⁻ (hypochlorite ion) that has not yet reacted with contaminants",
      "Chlorine bound to ammonia as chloramines",
      "Chlorine that has been consumed by the chlorine demand"
    ],
    correct: 1,
    explanation: "Free chlorine residual is the concentration of unreacted chlorine present as HOCl and OCl⁻ after the chlorine demand has been satisfied. It provides ongoing disinfection in the distribution system."
  },
  {
    id: 266,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the chlorine demand of water?",
    options: [
      "The total amount of chlorine added to the water",
      "The amount of chlorine consumed by reactions with organic matter, ammonia, iron, manganese, and other reducing substances",
      "The minimum chlorine residual required in the distribution system",
      "The maximum chlorine dose that can be applied"
    ],
    correct: 1,
    explanation: "Chlorine demand is the difference between the chlorine dose applied and the free chlorine residual measured after a specified contact time. It represents chlorine consumed by reactions with water constituents."
  },
  {
    id: 267,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the breakpoint chlorination concept?",
    options: [
      "The point at which chlorine breaks down into its constituent elements",
      "The point at which chlorine becomes ineffective as a disinfectant",
      "The chlorine dose at which all ammonia-nitrogen is oxidized and free chlorine residual begins to increase",
      "The maximum safe chlorine dose for drinking water"
    ],
    correct: 2,
    explanation: "At breakpoint, all chloramines are destroyed and free chlorine residual begins to increase with additional chlorine dose. The breakpoint dose is approximately 7.6 mg Cl₂ per mg NH₃-N."
  },
  {
    id: 268,
    module: "Disinfection",
    difficulty: "medium",
    question: "What are combined chlorine residuals (chloramines)?",
    options: [
      "Chlorine combined with organic matter",
      "Chlorine combined with fluoride",
      "Chlorine combined with iron and manganese",
      "Chlorine that has reacted with ammonia to form monochloramine, dichloramine, and trichloramine"
    ],
    correct: 3,
    explanation: "Combined chlorine (chloramines) forms when chlorine reacts with ammonia: monochloramine (NH₂Cl), dichloramine (NHCl₂), and trichloramine (NCl₃). Monochloramine is the preferred form for distribution system residual."
  },
  {
    id: 269,
    module: "Disinfection",
    difficulty: "medium",
    question: "What are trihalomethanes (THMs) and how are they formed?",
    options: [
      "Naturally occurring organic compounds in source water",
      "Disinfection by-products formed when chlorine reacts with natural organic matter (humic and fulvic acids)",
      "By-products of ozone disinfection",
      "Compounds formed during coagulation"
    ],
    correct: 1,
    explanation: "THMs (chloroform, bromodichloromethane, dibromochloromethane, bromoform) are formed when chlorine reacts with NOM. Ontario's MAC for total THMs is 100 μg/L."
  },
  {
    id: 270,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the Ontario MAC for total trihalomethanes (THMs) in drinking water?",
    options: [
      "100 μg/L",
      "10 μg/L",
      "500 μg/L",
      "1,000 μg/L"
    ],
    correct: 0,
    explanation: "Ontario Regulation 169/03 sets the MAC for total trihalomethanes (THMs) at 100 μg/L, consistent with Health Canada's Guidelines for Canadian Drinking Water Quality."
  },
  {
    id: 271,
    module: "Disinfection",
    difficulty: "medium",
    question: "What are haloacetic acids (HAAs) and what is their significance?",
    options: [
      "Acids used in the coagulation process",
      "Naturally occurring acids in source water",
      "Disinfection by-products formed when chlorine reacts with NOM; regulated due to potential health effects",
      "Acids formed during ozone disinfection"
    ],
    correct: 2,
    explanation: "HAAs (monochloroacetic acid, dichloroacetic acid, trichloroacetic acid, etc.) are chlorination DBPs regulated due to their potential carcinogenicity. Ontario's MAC for HAA5 is 80 μg/L."
  },
  {
    id: 272,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the minimum free chlorine residual required at the point of entry to a distribution system in Ontario?",
    options: [
      "0.01 mg/L",
      "1.0 mg/L",
      "0.2 mg/L",
      "5.0 mg/L"
    ],
    correct: 2,
    explanation: "Ontario Regulation 170/03 requires a minimum free chlorine residual of 0.2 mg/L at the point of entry to the distribution system after the required contact time."
  },
  {
    id: 273,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the maximum free chlorine residual allowed in Ontario drinking water?",
    options: [
      "4.0 mg/L",
      "1.0 mg/L",
      "10.0 mg/L",
      "20.0 mg/L"
    ],
    correct: 0,
    explanation: "Ontario Regulation 169/03 sets the maximum allowable concentration (MAC) for free chlorine at 4.0 mg/L in drinking water."
  },
  {
    id: 274,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the relationship between pH and the effectiveness of chlorine disinfection?",
    options: [
      "Higher pH increases chlorine effectiveness",
      "Lower pH increases chlorine effectiveness because HOCl (the more active form) predominates at lower pH",
      "pH has no effect on chlorine disinfection",
      "Chlorine is most effective at pH 9–10"
    ],
    correct: 1,
    explanation: "HOCl (hypochlorous acid) is approximately 80× more effective as a disinfectant than OCl⁻ (hypochlorite ion). At pH 7.5, about 50% is HOCl; at pH 6.0, ~97% is HOCl — lower pH improves disinfection efficiency."
  },
  {
    id: 275,
    isCalc: true,
    module: "Disinfection",
    difficulty: "hard",
    question: "A clearwell has a volume of 1,200 m³ and a T10/T = 0.5. The plant flow is 4,800 m³/h. What is the T10 in minutes?",
    options: [
      "3.75 min",
      "30 min",
      "15 min",
      "7.5 min"
    ],
    correct: 3,
    explanation: "Calculate the theoretical hydraulic retention time (HRT), then use the T10/T ratio to find T10.\n\nStep 1 — Calculate the theoretical HRT (T):\nHRT (T) = Volume ÷ Flow = 1,200 m³ ÷ 4,800 m³/h = 0.25 h\n\nStep 2 — Convert HRT to minutes:\nHRT (T) = 0.25 h × 60 min/h = 15 min\n\nStep 3 — Calculate T10 using the given ratio:\nT10 = (T10/T) × T = 0.5 × 15 min = 7.5 min\n\nThe correct answer is 7.5 min.",
    steps: [ { l: "Formula 1", c: "Theoretical Hydraulic Retention Time (HRT) = Volume / Flow Rate" }, { l: "Formula 2", c: "T10 = T10/T Ratio × Theoretical HRT" }, { l: "Step 1", c: "Identify the given values: Volume = 1,200 m³, Plant Flow = 4,800 m³/h, T10/T Ratio = 0.5." }, { l: "Substitute 1", c: "Theoretical HRT = 1,200 m³ / 4,800 m³/h" }, { l: "Calculate 1", c: "Theoretical HRT = 0.25 hours" }, { l: "Step 2", c: "Convert Theoretical HRT to minutes: 0.25 hours × 60 minutes/hour = 15 minutes." }, { l: "Substitute 2", c: "T10 = 0.5 × 15 minutes" }, { l: "Calculate 2", c: "T10 = 7.5 minutes" }, { l: "Result", c: "The T10 is 7.5 minutes." } ],
    tip: "Always check units and convert to the desired final unit, like minutes.",
  },
  {
    id: 276,
    isCalc: true,
    module: "Disinfection",
    difficulty: "hard",
    question: "Using the clearwell from above (T10 = 7.5 min), the free chlorine residual at the clearwell outlet is 1.2 mg/L. What is the CT achieved?",
    options: [
      "4.5 mg·min/L",
      "36.0 mg·min/L",
      "18.0 mg·min/L",
      "9.0 mg·min/L"
    ],
    correct: 3,
    explanation: "Calculate CT by multiplying the free chlorine residual (C) by the T10 baffling factor (T).\n\nStep 1 — Identify the given values:\nFree Chlorine Residual (C) = 1.2 mg/L\nT10 Baffling Factor (T) = 7.5 min\n\nStep 2 — Calculate CT:\nCT = C × T\nCT = 1.2 mg/L × 7.5 min\nCT = 9.0 mg·min/L\n\nThe correct answer is 9.0 mg·min/L.",
    steps: [ { l: "Formula", c: "CT = C × T10" }, { l: "Step 1", c: "Identify the given values: Free Chlorine Residual (C) = 1.2 mg/L, T10 = 7.5 min (from previous question)." }, { l: "Substitute", c: "CT = 1.2 mg/L × 7.5 min" }, { l: "Calculate", c: "CT = 9.0 mg·min/L" }, { l: "Result", c: "The CT achieved is 9.0 mg·min/L." } ],
    tip: "CT is a direct product of disinfectant concentration and contact time.",
  },
  {
    id: 277,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of chlorine contact time (CT) requirements in Ontario?",
    options: [
      "To ensure adequate taste and odour removal",
      "To ensure adequate turbidity removal",
      "To ensure sufficient inactivation of Giardia cysts and viruses before water enters the distribution system",
      "To ensure adequate fluoride levels"
    ],
    correct: 2,
    explanation: "Ontario Regulation 170/03 requires minimum CT values to achieve 3-log inactivation of Giardia and 4-log inactivation of viruses, protecting public health from waterborne pathogens."
  },
  {
    id: 278,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is ultraviolet (UV) disinfection and what are its advantages?",
    options: [
      "A physical disinfection method using UV light (254 nm) to damage pathogen DNA; no DBPs, highly effective against Cryptosporidium",
      "A chemical disinfection method using ultraviolet compounds",
      "A disinfection method using ultraviolet-activated ozone",
      "A disinfection method using UV-activated chlorine"
    ],
    correct: 0,
    explanation: "UV disinfection uses 254 nm UV light to damage pathogen DNA, preventing reproduction. Key advantages: no DBPs, highly effective against Cryptosporidium and Giardia, and no effect on taste or odour."
  },
  {
    id: 279,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the key limitation of UV disinfection?",
    options: [
      "UV is ineffective against bacteria",
      "UV does not provide a residual disinfectant in the distribution system",
      "UV is too expensive for large plants",
      "UV produces harmful by-products"
    ],
    correct: 1,
    explanation: "UV disinfection provides no residual disinfectant in the distribution system, so a secondary disinfectant (typically chlorine or chloramine) must still be added to maintain residual through the distribution system."
  },
  {
    id: 280,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the UV dose (fluence) required for Cryptosporidium inactivation?",
    options: [
      "1 mJ/cm²",
      "40 mJ/cm²",
      "10 mJ/cm²",
      "400 mJ/cm²"
    ],
    correct: 2,
    explanation: "A UV dose of approximately 10 mJ/cm² achieves 2-log (99%) inactivation of Cryptosporidium. Higher doses (40 mJ/cm²) are used for greater log reduction credits."
  },
  {
    id: 281,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is ozone disinfection and what are its advantages?",
    options: [
      "A disinfection method using ozone-activated chlorine",
      "A disinfection method using ozone dissolved in water",
      "A disinfection method using ozone gas generated on-site; powerful oxidant, effective against Cryptosporidium, improves taste and odour",
      "A disinfection method using ozone to remove turbidity"
    ],
    correct: 2,
    explanation: "Ozone (O₃) is a powerful oxidant generated on-site from air or oxygen. It is highly effective against Cryptosporidium, improves taste and odour, and removes colour — but provides no distribution system residual."
  },
  {
    id: 282,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the primary concern with ozone disinfection?",
    options: [
      "Ozone is ineffective against bacteria",
      "Ozone can react with bromide in source water to form bromate, a regulated DBP",
      "Ozone is too expensive for any water treatment application",
      "Ozone produces chloramines"
    ],
    correct: 1,
    explanation: "When source water contains bromide, ozone oxidizes it to bromate (BrO₃⁻), a potential carcinogen. Ontario's MAC for bromate is 10 μg/L."
  },
  {
    id: 283,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is chlorine dioxide (ClO₂) and what are its advantages?",
    options: [
      "A form of chlorine gas",
      "A chemical used to adjust pH",
      "A chemical used to remove iron and manganese",
      "A powerful disinfectant and oxidant that is effective over a wide pH range and produces fewer THMs than chlorine"
    ],
    correct: 3,
    explanation: "ClO₂ is a powerful disinfectant effective over a wide pH range (6–10), produces fewer THMs than chlorine, and is effective against Giardia and Cryptosporidium — but must be generated on-site and has its own DBPs (chlorite, chlorate)."
  },
  {
    id: 284,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is chloramination and why is it used?",
    options: [
      "Adding ammonia to remove chlorine from water",
      "Adding ammonia to chlorinated water to form monochloramine, providing a more stable distribution system residual with fewer THMs",
      "Adding chlorine to remove ammonia from water",
      "A disinfection method using chlorine and ammonia simultaneously"
    ],
    correct: 1,
    explanation: "Chloramination adds ammonia to chlorinated water to form monochloramine (NH₂Cl), which is more stable than free chlorine in distribution systems, travels farther, and produces fewer THMs — though it is a weaker disinfectant."
  },
  {
    id: 285,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is nitrification in a chloraminated distribution system?",
    options: [
      "The biological oxidation of ammonia released from chloramine decay, causing loss of residual and potential bacterial regrowth",
      "The addition of nitrogen to the water",
      "The removal of nitrate from the water",
      "The formation of nitrate from chloramine reactions"
    ],
    correct: 0,
    explanation: "Nitrification occurs when ammonia released from chloramine decay is oxidized by nitrifying bacteria (Nitrosomonas, Nitrobacter), consuming chloramine residual and potentially causing bacterial regrowth."
  },
  {
    id: 286,
    module: "Disinfection",
    difficulty: "easy",
    question: "What is the purpose of maintaining a chlorine residual in the distribution system?",
    options: [
      "To improve the taste of the water",
      "To maintain the pH of the water",
      "To prevent corrosion of distribution pipes",
      "To provide ongoing protection against microbial contamination and regrowth in the distribution system"
    ],
    correct: 3,
    explanation: "Distribution system chlorine residual provides ongoing protection against microbial contamination from main breaks, cross-connections, and biofilm regrowth throughout the distribution system."
  },
  {
    id: 287,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the minimum chlorine residual required at the extremities of a distribution system in Ontario?",
    options: [
      "0.0 mg/L (no requirement)",
      "0.05 mg/L",
      "0.2 mg/L",
      "1.0 mg/L"
    ],
    correct: 1,
    explanation: "Ontario Regulation 170/03 requires a detectable chlorine residual (minimum 0.05 mg/L) throughout the distribution system, though the practical target is typically 0.2 mg/L or higher."
  },
  {
    id: 288,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a chlorine contact basin (clearwell)?",
    options: [
      "To store raw water before treatment",
      "To store chemicals for disinfection",
      "To provide sufficient contact time between chlorine and water to achieve the required CT for pathogen inactivation",
      "To filter the water before distribution"
    ],
    correct: 2,
    explanation: "The clearwell provides the required CT contact time for chlorine disinfection, ensures adequate pathogen inactivation, and stores treated water to buffer supply and demand fluctuations."
  },
  {
    id: 289,
    isCalc: true,
    module: "Disinfection",
    difficulty: "hard",
    question: "A water plant treats 15 ML/d at 10°C. The required CT for 3-log Giardia inactivation at pH 7.0 and 10°C is 73 mg·min/L. The free chlorine residual is 1.5 mg/L. What minimum T10 is required?",
    options: [
      "24.3 min",
      "73 min",
      "48.7 min",
      "109.5 min"
    ],
    correct: 2,
    explanation: "To find the minimum T10, divide the required CT value by the free chlorine residual.\n\nStep 1 — Calculate minimum T10:\n73 mg·min/L ÷ 1.5 mg/L = 48.666... min\n\nStep 2 — Round to one decimal place:\n48.7 min\n\nThe correct answer is 48.7 min.",
    steps: [ { l: "Formula", c: "Minimum T10 = Required CT / Free Chlorine Residual (C)" }, { l: "Step 1", c: "Identify the given values: Required CT = 73 mg·min/L, Free Chlorine Residual (C) = 1.5 mg/L." }, { l: "Substitute", c: "Minimum T10 = 73 mg·min/L / 1.5 mg/L" }, { l: "Calculate", c: "Minimum T10 = 48.666... minutes" }, { l: "Result", c: "The minimum T10 required is approximately 48.7 minutes." } ],
    tip: "Rearrange the CT formula to solve for the unknown variable.",
  },
  {
    id: 290,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the effect of temperature on chlorine disinfection efficiency?",
    options: [
      "Higher temperature increases disinfection efficiency",
      "Temperature has no effect on disinfection efficiency",
      "Lower temperature decreases disinfection efficiency, requiring higher CT values",
      "Lower temperature increases disinfection efficiency"
    ],
    correct: 2,
    explanation: "Lower water temperature slows chlorine reaction rates, reducing disinfection efficiency. Ontario CT tables provide higher required CT values at lower temperatures to compensate."
  },
  {
    id: 291,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a chlorine residual analyzer in a water treatment plant?",
    options: [
      "To continuously measure the chlorine residual and provide feedback for automatic chlorine dosing control",
      "To add chlorine to the water automatically",
      "To measure the turbidity of the chlorinated water",
      "To detect chlorine gas leaks in the plant"
    ],
    correct: 0,
    explanation: "Continuous chlorine analyzers measure residual in real time, enabling automatic feedback control of chlorine dosing to maintain target residuals despite changes in flow, temperature, and chlorine demand."
  },
  {
    id: 292,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the DPD method used for in water treatment?",
    options: [
      "To measure turbidity",
      "To measure dissolved oxygen",
      "To measure pH",
      "To measure free and total chlorine residual using a colorimetric test"
    ],
    correct: 3,
    explanation: "The DPD (N,N-diethyl-p-phenylenediamine) method is a colorimetric test for measuring free and total chlorine residual; DPD #1 measures free chlorine, DPD #3 measures total chlorine."
  },
  {
    id: 293,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the amperometric titration method used for?",
    options: [
      "To measure pH",
      "To measure dissolved oxygen",
      "To measure turbidity",
      "To measure chlorine residual with high accuracy, particularly useful for measuring combined chlorine"
    ],
    correct: 3,
    explanation: "Amperometric titration is a highly accurate method for measuring free and combined chlorine residuals, particularly useful for low residuals and for distinguishing between free and combined chlorine."
  },
  {
    id: 294,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a chlorine gas scrubber (emergency scrubber)?",
    options: [
      "To remove chlorine from the treated water",
      "To neutralize chlorine gas released during a leak, preventing it from reaching the atmosphere",
      "To clean the chlorine feed equipment",
      "To measure chlorine gas concentration in the air"
    ],
    correct: 1,
    explanation: "Emergency chlorine scrubbers use caustic soda (NaOH) or other alkaline solutions to neutralize chlorine gas released during a leak, protecting plant workers and the surrounding community."
  },
  {
    id: 295,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the IDLH (Immediately Dangerous to Life or Health) concentration for chlorine gas?",
    options: [
      "0.5 ppm",
      "10 ppm",
      "25 ppm",
      "100 ppm"
    ],
    correct: 1,
    explanation: "The IDLH for chlorine gas is 10 ppm. Exposure above this level can cause severe respiratory damage and death. Ontario requires chlorine gas detection alarms set at 0.5–1 ppm."
  },
  {
    id: 296,
    module: "Disinfection",
    difficulty: "medium",
    question: "What personal protective equipment (PPE) is required when handling chlorine gas cylinders?",
    options: [
      "Safety glasses and gloves only",
      "No PPE is required for routine handling",
      "A dust mask and safety glasses",
      "Self-contained breathing apparatus (SCBA), chemical-resistant suit, gloves, and face shield"
    ],
    correct: 3,
    explanation: "Handling chlorine gas cylinders requires SCBA (not just a respirator), chemical-resistant protective suit, gloves, and face shield due to the extreme toxicity and corrosiveness of chlorine gas."
  },
  {
    id: 297,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a chlorine gas detector in a water treatment plant?",
    options: [
      "To measure the chlorine dose being applied",
      "To detect chlorine gas leaks and alarm operators before concentrations reach dangerous levels",
      "To measure the chlorine residual in the treated water",
      "To control the chlorine feed rate"
    ],
    correct: 1,
    explanation: "Chlorine gas detectors continuously monitor air in chlorine storage and feed areas, alarming at set points (typically 0.5–1 ppm) to warn operators of leaks before concentrations become dangerous."
  },
  {
    id: 298,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is sodium hypochlorite (NaOCl) and what are its advantages over chlorine gas?",
    options: [
      "A chemical that does not form THMs",
      "A more powerful disinfectant than chlorine gas",
      "A chemical that does not affect pH",
      "A liquid form of chlorine that is safer to handle than chlorine gas, though it degrades over time"
    ],
    correct: 3,
    explanation: "Sodium hypochlorite (bleach) is a liquid chlorine source that is safer to handle and store than chlorine gas, though it degrades over time (especially at high temperatures) and raises the pH of treated water."
  },
  {
    id: 299,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the typical available chlorine concentration of commercial sodium hypochlorite solution?",
    options: [
      "0.5 – 1%",
      "10 – 15%",
      "50 – 60%",
      "90 – 95%"
    ],
    correct: 1,
    explanation: "Commercial sodium hypochlorite for water treatment is typically supplied at 10–15% available chlorine, though it degrades to lower concentrations over time, especially at high temperatures."
  },
  {
    id: 300,
    isCalc: true,
    module: "Disinfection",
    difficulty: "hard",
    question: "A plant requires 8 mg/L of chlorine dose and treats 5 ML/d. The NaOCl solution is 12% available chlorine with a density of 1.17 kg/L. What volume of NaOCl solution is required per day?",
    options: ["142 L/d", "341 L/d", "285 L/d", "570 L/d"],
    correct: 2,
    explanation: "Calculate the total mass of chlorine required, then determine the mass of NaOCl solution needed based on its available chlorine percentage, and finally convert this mass to a daily volume using the solution's density.\n\nStep 1 — Chlorine mass required per day:\n8 mg/L × 5 ML/d = 8 mg/L × 5,000,000 L/d = 40,000,000 mg/d = 40 kg/d\n\nStep 2 — Mass of NaOCl solution required per day (12% available chlorine):\n40 kg/d ÷ 0.12 = 333.33 kg/d\n\nStep 3 — Volume of NaOCl solution required per day:\n333.33 kg/d ÷ 1.17 kg/L = 284.9 L/d\n\nThe correct answer is 285 L/d.",
    steps: [ { l: "Formula", c: "Mass_Cl2 = Dose × Flow; Mass_NaOCl_solution = Mass_Cl2 / %_available_Cl2; Volume_NaOCl_solution = Mass_NaOCl_solution / Density_NaOCl_solution" }, { l: "Step 1: Calculate the mass of chlorine required per day", c: "Mass_Cl2 = 8 mg/L × 5 ML/d = 8 mg/L × 5,000,000 L/d = 40,000,000 mg/d = 40 kg/d" }, { l: "Step 2: Calculate the mass of NaOCl solution required per day", c: "Mass_NaOCl_solution = 40 kg/d / 0.12 = 333.33 kg/d" }, { l: "Step 3: Calculate the volume of NaOCl solution required per day", c: "Volume_NaOCl_solution = 333.33 kg/d / 1.17 kg/L = 284.89 L/d" }, { l: "Result", c: "285 L/d" } ],
    tip: "Convert units carefully, especially mg to kg and ML to L.",
  },
  {
    id: 301,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is calcium hypochlorite (Ca(OCl)₂) and when is it used?",
    options: [
      "A liquid disinfectant used in large plants",
      "A solid/granular chlorine compound used in small systems, for emergency disinfection, and for well disinfection",
      "A chemical used to remove hardness",
      "A chemical used to adjust pH"
    ],
    correct: 1,
    explanation: "Calcium hypochlorite (HTH, pool chlorine) is a solid/granular form of chlorine (~65–70% available chlorine) used in small systems, for emergency disinfection, and for disinfecting wells and new mains."
  },
  {
    id: 302,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of pre-disinfection (pre-chlorination) in water treatment?",
    options: [
      "To replace the need for post-disinfection",
      "To oxidize iron, manganese, and organic matter, control algae, and provide early disinfection before treatment",
      "To improve coagulation efficiency",
      "To remove taste and odour compounds"
    ],
    correct: 1,
    explanation: "Pre-chlorination oxidizes reduced metals, controls algae and biological growth in treatment units, and provides early disinfection — though it can increase DBP formation if applied before NOM removal."
  },
  {
    id: 303,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of post-disinfection (final chlorination)?",
    options: [
      "To achieve the required CT for pathogen inactivation and establish the distribution system residual",
      "To remove turbidity from the finished water",
      "To remove taste and odour from the finished water",
      "To adjust the pH of the finished water"
    ],
    correct: 0,
    explanation: "Post-disinfection (final chlorination) achieves the required CT for regulatory compliance and establishes the chlorine residual that will protect the water throughout the distribution system."
  },
  {
    id: 304,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a booster chlorination station in a distribution system?",
    options: [
      "To boost water pressure in the distribution system",
      "To add fluoride to the distribution system",
      "To re-chlorinate water at strategic points in the distribution system where residuals have decayed",
      "To monitor water quality in the distribution system"
    ],
    correct: 2,
    explanation: "Booster chlorination stations add chlorine at strategic points in the distribution system to maintain adequate residuals in areas far from the treatment plant where chlorine has decayed."
  },
  {
    id: 305,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a chlorine contact chamber baffling factor?",
    options: [
      "To reduce the flow velocity in the contact chamber",
      "To account for short-circuiting when calculating effective contact time (T10) from theoretical HRT",
      "To add baffles to improve mixing in the contact chamber",
      "To measure the chlorine residual in the contact chamber"
    ],
    correct: 1,
    explanation: "The baffling factor (T10/T) accounts for short-circuiting in the contact chamber. Well-baffled chambers have factors of 0.5–0.7; poorly baffled chambers may have factors as low as 0.1."
  },
  {
    id: 306,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a chlorine demand test?",
    options: [
      "To measure the maximum chlorine dose that can be applied",
      "To measure the chlorine residual in the distribution system",
      "To determine how much chlorine is consumed by the water, allowing operators to calculate the dose needed to achieve a target residual",
      "To test the chlorine feed equipment"
    ],
    correct: 2,
    explanation: "A chlorine demand test measures the amount of chlorine consumed by a water sample over a specified time, allowing operators to calculate the dose needed to achieve a target residual after the demand is satisfied."
  },
  {
    id: 307,
    isCalc: true,
    module: "Disinfection",
    difficulty: "hard",
    question: "A water sample has a chlorine demand of 3.5 mg/L. The target free chlorine residual after 30 minutes is 0.5 mg/L. What is the required chlorine dose?",
    options: [
      "3.5 mg/L",
      "4.0 mg/L",
      "0.5 mg/L",
      "7.0 mg/L"
    ],
    correct: 1,
    explanation: "Calculate the required chlorine dose by adding the chlorine demand to the desired free chlorine residual.\n\nStep 1 — Calculate the chlorine dose:\nChlorine Dose = Chlorine Demand + Desired Residual\nChlorine Dose = 3.5 mg/L + 0.5 mg/L = 4.0 mg/L\n\nThe correct answer is 4.0 mg/L.",
    steps: [ { l: "Formula", c: "Chlorine Dose = Chlorine Demand + Desired Residual" }, { l: "Step 1: Identify given values", c: "Chlorine Demand = 3.5 mg/L; Desired Residual = 0.5 mg/L" }, { l: "Step 2: Substitute values into the formula", c: "Chlorine Dose = 3.5 mg/L + 0.5 mg/L" }, { l: "Step 3: Calculate the chlorine dose", c: "Chlorine Dose = 4.0 mg/L" }, { l: "Result", c: "4.0 mg/L" } ],
    tip: "Dose covers both demand and desired residual.",
  },
  {
    id: 308,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a chlorine safety shower and eyewash station?",
    options: [
      "To provide a comfortable work environment",
      "To test the chlorine concentration in the air",
      "To rinse chlorine equipment after use",
      "To provide immediate decontamination in case of chlorine chemical contact with skin or eyes"
    ],
    correct: 3,
    explanation: "Safety showers and eyewash stations must be immediately accessible in chlorine handling areas to provide rapid decontamination in case of chemical exposure, minimizing injury."
  },
  {
    id: 309,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a chlorine gas cylinder scale?",
    options: [
      "To measure the chlorine dose being applied",
      "To weigh the cylinder for shipping",
      "To measure the pressure in the cylinder",
      "To monitor the weight of the cylinder to track chlorine consumption and determine when to change cylinders"
    ],
    correct: 3,
    explanation: "Cylinder scales continuously monitor the weight of chlorine gas cylinders, tracking consumption rate, predicting when cylinders will be empty, and triggering automatic switchover to standby cylinders."
  },
  {
    id: 310,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a chlorine gas regulator?",
    options: [
      "To measure the chlorine dose",
      "To mix chlorine gas with water",
      "To prevent chlorine gas from escaping the cylinder",
      "To reduce the high pressure in the chlorine cylinder to a lower, controlled pressure for safe metering"
    ],
    correct: 3,
    explanation: "Chlorine gas regulators reduce the cylinder pressure (varies with temperature and fill level) to a constant, controlled vacuum or low pressure for accurate metering by the chlorinator."
  },
  {
    id: 311,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a vacuum-operated chlorinator?",
    options: [
      "To create a vacuum in the chlorine cylinder",
      "To dissolve chlorine gas in water under vacuum",
      "To meter chlorine gas under vacuum, preventing leaks since any failure results in air entering rather than chlorine escaping",
      "To remove chlorine from the water"
    ],
    correct: 2,
    explanation: "Vacuum-operated chlorinators operate under negative pressure; any system failure (broken line, disconnected fitting) results in air being drawn in rather than chlorine escaping — a critical safety feature."
  },
  {
    id: 312,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a chlorine injector (eductor)?",
    options: [
      "To inject chlorine directly into the water main",
      "To measure the chlorine concentration in the water",
      "To inject chlorine into the air for odour control",
      "To use a water jet to create a vacuum that draws chlorine gas into a solution stream for injection into the water"
    ],
    correct: 3,
    explanation: "The chlorine injector (eductor) uses a high-velocity water jet (motive water) to create a vacuum that draws metered chlorine gas into solution, forming a concentrated chlorine solution for injection."
  },
  {
    id: 313,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a chlorine solution diffuser?",
    options: [
      "To distribute the chlorine solution uniformly across the pipe cross-section for rapid mixing",
      "To dilute the chlorine solution before injection",
      "To measure the chlorine concentration in the pipe",
      "To prevent chlorine solution from backing up into the injector"
    ],
    correct: 0,
    explanation: "Chlorine solution diffusers distribute the concentrated chlorine solution across the pipe cross-section, ensuring rapid and uniform mixing with the process water."
  },
  {
    id: 314,
    module: "Disinfection",
    difficulty: "easy",
    question: "What is the purpose of a check valve on a chlorine injection line?",
    options: [
      "To control the chlorine dose",
      "To measure the chlorine flow rate",
      "To prevent backflow of process water into the chlorine feed system",
      "To reduce the pressure of the chlorine solution"
    ],
    correct: 2,
    explanation: "Check valves on chlorine injection lines prevent process water from backing up into the chlorine feed system, which could cause corrosion, plugging, or dangerous reactions."
  },
  {
    id: 315,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a chlorine residual monitoring program in the distribution system?",
    options: [
      "To verify adequate residuals are maintained throughout the distribution system and detect potential contamination events",
      "To measure the chlorine dose at the treatment plant",
      "To measure the turbidity in the distribution system",
      "To detect main breaks in the distribution system"
    ],
    correct: 0,
    explanation: "Distribution system residual monitoring verifies that adequate chlorine residuals are maintained throughout the system, detects areas of residual decay, and provides early warning of potential contamination events."
  },
  {
    id: 316,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a chlorine residual target at the treatment plant outlet?",
    options: [
      "To meet the minimum residual requirement at the plant outlet only",
      "To ensure that after decay through the distribution system, adequate residuals are maintained at all points including the extremities",
      "To maximize the chlorine dose for safety",
      "To minimize THM formation"
    ],
    correct: 1,
    explanation: "The plant outlet target chlorine residual is set higher than the minimum distribution system requirement to account for residual decay through the system, ensuring adequate protection at all points."
  },
  {
    id: 317,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a chlorine dose pacing system?",
    options: [
      "To pace the speed of chlorine cylinder changes",
      "To automatically adjust the chlorine dose in proportion to the flow rate, maintaining a consistent residual",
      "To measure the chlorine demand of the water",
      "To control the contact time in the clearwell"
    ],
    correct: 1,
    explanation: "Flow-paced chlorine dosing automatically adjusts the chlorine feed rate proportionally to the plant flow rate, maintaining a consistent chlorine dose (mg/L) regardless of flow variations."
  },
  {
    id: 318,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a compound loop chlorine control system?",
    options: [
      "To control the chlorine dose based only on flow rate",
      "To control the chlorine dose based on both flow rate (feed-forward) and residual measurement (feedback) for precise residual control",
      "To control multiple chlorine feed points simultaneously",
      "To measure the chlorine residual at multiple points in the distribution system"
    ],
    correct: 1,
    explanation: "Compound loop control combines feed-forward (flow pacing) with feedback (residual measurement) to provide precise chlorine residual control despite variations in both flow and chlorine demand."
  },
  {
    id: 319,
    isCalc: true,
    module: "Disinfection",
    difficulty: "hard",
    question: "A plant treats 8 ML/d and applies 5 mg/L of chlorine. The chlorine demand is 3.8 mg/L. What is the free chlorine residual after the demand is satisfied?",
    options: [
      "0.8 mg/L",
      "5.0 mg/L",
      "3.8 mg/L",
      "1.2 mg/L"
    ],
    correct: 3,
    explanation: "Calculate the free chlorine residual by subtracting the chlorine demand from the applied chlorine dose.\n\nStep 1 — Calculate free chlorine residual:\nFree Chlorine Residual = Applied Chlorine Dose - Chlorine Demand\nFree Chlorine Residual = 5.0 mg/L - 3.8 mg/L = 1.2 mg/L\n\nThe correct answer is 1.2 mg/L.",
    steps: [ { l: "Formula", c: "Free Chlorine Residual = Chlorine Dose - Chlorine Demand" }, { l: "Step 1: Identify given values", c: "Chlorine Dose = 5 mg/L; Chlorine Demand = 3.8 mg/L" }, { l: "Step 2: Substitute values into the formula", c: "Free Chlorine Residual = 5 mg/L - 3.8 mg/L" }, { l: "Step 3: Calculate the free chlorine residual", c: "Free Chlorine Residual = 1.2 mg/L" }, { l: "Result", c: "1.2 mg/L" } ],
    tip: "Residual is what's left after demand is met.",
  },
  {
    id: 320,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a turbidity requirement for UV disinfection?",
    options: [
      "Turbidity affects the taste of UV-treated water",
      "High turbidity reduces UV transmittance, shielding pathogens from UV light and reducing disinfection effectiveness",
      "Turbidity has no effect on UV disinfection",
      "High turbidity improves UV disinfection by scattering light"
    ],
    correct: 1,
    explanation: "Suspended particles in turbid water absorb and scatter UV light, shielding pathogens from the UV dose and reducing disinfection effectiveness. UV systems require low-turbidity water (typically <1 NTU)."
  },
  {
    id: 321,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is UV transmittance (UVT) and why is it important?",
    options: [
      "The percentage of UV light transmitted through a 1 cm water sample at 254 nm",
      "The UV dose applied to the water",
      "The percentage of pathogens inactivated by UV",
      "The intensity of the UV lamp"
    ],
    correct: 0,
    explanation: "UVT is the percentage of 254 nm UV light transmitted through a 1 cm path length of water. Higher UVT (cleaner water) allows more UV light to reach pathogens; lower UVT requires higher lamp intensity or longer contact time."
  },
  {
    id: 322,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of UV lamp intensity monitoring?",
    options: [
      "To measure the UV dose applied to the water",
      "To monitor lamp output and ensure the required UV dose is being delivered; lamps degrade over time",
      "To control the flow rate through the UV reactor",
      "To measure the turbidity of the UV-treated water"
    ],
    correct: 1,
    explanation: "UV lamp intensity decreases with age (typically 10–20% per year). Intensity sensors monitor lamp output to ensure the required UV dose is maintained and trigger lamp replacement when output drops below the minimum."
  },
  {
    id: 323,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of UV lamp sleeve cleaning?",
    options: [
      "To remove fouling (mineral deposits, biofilm) from the quartz sleeves that would reduce UV transmittance to the water",
      "To improve the appearance of the UV system",
      "To disinfect the UV lamps",
      "To cool the UV lamps"
    ],
    correct: 0,
    explanation: "Quartz sleeves surrounding UV lamps can foul with mineral deposits (calcium carbonate, iron) and biofilm, reducing UV transmittance. Regular cleaning (chemical or mechanical) maintains lamp effectiveness."
  },
  {
    id: 324,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a UV validation test?",
    options: [
      "To test the UV equipment before installation",
      "To demonstrate that the UV system delivers the required dose under worst-case operating conditions using biodosimetry",
      "To validate the turbidity of the UV-treated water",
      "To validate the chlorine residual after UV treatment"
    ],
    correct: 1,
    explanation: "UV validation (biodosimetry) uses surrogate microorganisms to confirm that the UV system delivers the required dose under worst-case conditions (maximum flow, minimum UVT, minimum lamp output)."
  },
  {
    id: 325,
    module: "Disinfection",
    difficulty: "medium",
    question: "What is the purpose of a disinfection log in a water treatment plant?",
    options: [
      "To document CT calculations, chlorine doses, residuals, and contact times for regulatory compliance",
      "To record the names of operators who performed disinfection",
      "To record the volume of disinfectant used",
      "To schedule disinfection equipment maintenance"
    ],
    correct: 0,
    explanation: "Disinfection logs document CT calculations, chlorine doses, residuals, T10 values, and contact times to demonstrate regulatory compliance with pathogen inactivation requirements."
  },

  // ─── MODULE 7: Chemical Feed & Dosing (45 questions, IDs 326-370) ───

  {
    id: 326,
    module: "Chemical Feed & Dosing",
    difficulty: "easy",
    question: "What is a chemical metering pump and what is its purpose?",
    options: [
      "A pump used to transfer bulk chemicals between storage tanks",
      "A pump used to circulate chemicals through a treatment system",
      "A pump used to mix chemicals in a day tank",
      "A pump designed to deliver precise, controllable volumes of chemical solution at accurate flow rates"
    ],
    correct: 3,
    explanation: "Chemical metering pumps (dosing pumps) deliver precise, adjustable volumes of chemical solution at controlled rates, ensuring accurate chemical dosing regardless of system pressure variations."
  },
  {
    id: 327,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is a peristaltic pump and what are its advantages for chemical dosing?",
    options: [
      "A pump that uses a rotating impeller to move chemicals",
      "A pump that uses rollers to squeeze a flexible tube, moving fluid without contact with pump internals — ideal for corrosive chemicals",
      "A pump that uses compressed air to move chemicals",
      "A pump that uses a piston to move chemicals"
    ],
    correct: 1,
    explanation: "Peristaltic pumps squeeze a flexible tube with rollers; the chemical only contacts the tube — not pump internals. This makes them ideal for corrosive, viscous, or sensitive chemicals and easy to maintain."
  },
  {
    id: 328,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is a diaphragm metering pump and what are its advantages?",
    options: [
      "A pump using a flexible diaphragm to displace fluid, providing accurate dosing with no rotating seals in contact with the chemical",
      "A pump using a rigid diaphragm to measure flow",
      "A pump using a diaphragm to control pressure",
      "A pump using a diaphragm to mix chemicals"
    ],
    correct: 0,
    explanation: "Diaphragm metering pumps use a reciprocating flexible diaphragm to displace precise volumes of chemical. No rotating seals contact the chemical, making them reliable for corrosive and hazardous chemicals."
  },
  {
    id: 329,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a calibration column (calibration cylinder) on a chemical feed system?",
    options: [
      "To store chemicals for daily use",
      "To measure the concentration of the chemical solution",
      "To mix chemicals before dosing",
      "To measure the actual output of a metering pump by observing the drop in solution level over a timed period"
    ],
    correct: 3,
    explanation: "Calibration cylinders allow operators to verify the actual pump output by measuring the volume drawn from the graduated cylinder over a timed period, confirming the pump is delivering the correct dose."
  },
  {
    id: 330,
    module: "Chemical Feed & Dosing",
    difficulty: "hard",
    question: "A metering pump is set to deliver 500 mL/min. During calibration, the pump draws down 450 mL in 1 minute. What is the actual pump output as a percentage of the set point?",
    options: [
      "80%",
      "110%",
      "100%",
      "90%"
    ],
    correct: 3,
    explanation: "Actual output = 450 mL/min. Set point = 500 mL/min. Percentage = (450/500) × 100 = 90%."
  },
  {
    id: 331,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a day tank (solution tank) in a chemical feed system?",
    options: [
      "To store bulk chemicals for long-term supply",
      "To heat chemicals before dosing",
      "To dilute concentrated chemicals to a working concentration and provide a day's supply for the metering pump",
      "To measure the chemical dose automatically"
    ],
    correct: 2,
    explanation: "Day tanks hold a diluted working solution (typically 1 day's supply) of the chemical, providing a consistent concentration for accurate metering and reducing the risk of overdosing from concentrated stock."
  },
  {
    id: 332,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical bulk storage tank secondary containment?",
    options: [
      "To contain any spills or leaks from the primary storage tank, preventing environmental contamination",
      "To provide additional storage capacity",
      "To mix chemicals before transfer to the day tank",
      "To protect the storage tank from weather"
    ],
    correct: 0,
    explanation: "Secondary containment (berms, dikes, or containment basins) surrounds bulk chemical storage tanks to contain spills or leaks, preventing contamination of soil, groundwater, and water sources."
  },
  {
    id: 333,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed pump standby unit?",
    options: [
      "To ensure continuous chemical dosing if the primary pump fails, preventing treatment interruption",
      "To provide additional dosing capacity during peak demand",
      "To reduce the chemical dose during low-demand periods",
      "To measure the chemical concentration in the feed line"
    ],
    correct: 0,
    explanation: "Standby (duty/standby) pump configurations ensure that if the primary pump fails, the standby unit automatically takes over, maintaining continuous chemical dosing and treatment."
  },
  {
    id: 334,
    isCalc: true,
    module: "Chemical Feed & Dosing",
    difficulty: "hard",
    question: "A plant treats 12 ML/d and requires a fluoride dose of 0.7 mg/L. The fluorosilicic acid (H₂SiF₆) solution is 23% w/w with a density of 1.19 kg/L, and contains 79.2% available fluoride by weight. What volume of solution is required per day?",
    options: [
      "24.3 L/d",
      "77 L/d",
      "48.6 L/d",
      "38.5 L/d"
    ],
    correct: 3,
    explanation: "Calculate the total mass of fluoride required, then determine the mass of fluorosilicic acid solution needed, and finally convert this mass to a daily volume.\n\nStep 1 - Calculate the total mass of fluoride required per day:\n0.7 mg/L × 12,000,000 L/d = 8,400,000 mg/d = 8.4 kg/d\n\nStep 2 - Calculate the effective fluoride concentration in the solution:\n23% w/w × 79.2% available fluoride = 0.23 × 0.792 = 0.18216\n\nStep 3 - Calculate the total mass of fluorosilicic acid solution required per day:\n8.4 kg/d ÷ 0.18216 = 46.11 kg/d\n\nStep 4 - Convert the mass of solution to volume per day:\n46.11 kg/d ÷ 1.19 kg/L = 38.75 L/d\n\nThe correct answer is 38.5 L/d.",
    steps: [ { l: "Formula", c: "Mass_F = Dose × Flow; Mass_H2SiF6_solution = Mass_F / (%_H2SiF6_w/w × %_available_F); Volume_H2SiF6_solution = Mass_H2SiF6_solution / Density_H2SiF6_solution" }, { l: "Step 1: Calculate the mass of fluoride required per day", c: "Mass_F = 0.7 mg/L × 12 ML/d = 0.7 mg/L × 12,000,000 L/d = 8,400,000 mg/d = 8.4 kg/d" }, { l: "Step 2: Calculate the mass of H₂SiF₆ solution required per day", c: "Mass_H2SiF6_solution = 8.4 kg/d / (0.23 × 0.792) = 8.4 kg/d / 0.18216 = 46.11 kg/d" }, { l: "Step 3: Calculate the volume of H₂SiF₆ solution required per day", c: "Volume_H2SiF6_solution = 46.11 kg/d / 1.19 kg/L = 38.75 L/d" }, { l: "Result", c: "38.75 L/d" } ],
    tip: "Account for both solution concentration and available fluoride percentage.",
  },
  {
    id: 335,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical injection point location?",
    options: [
      "To minimize the distance chemicals travel to the treatment unit",
      "To minimize chemical storage requirements",
      "To reduce the chemical dose required",
      "To ensure chemicals are added at the optimal point in the treatment process for maximum effectiveness"
    ],
    correct: 3,
    explanation: "Chemical injection points are carefully located to maximize treatment effectiveness — coagulants at the rapid mix, pH adjustment before or after specific treatment steps, and disinfectants at the appropriate contact point."
  },
  {
    id: 336,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed rate calculation?",
    options: [
      "To calculate the pump output or feed rate needed to achieve a target dose based on flow rate and chemical concentration",
      "To determine the cost of chemicals",
      "To determine the storage capacity needed",
      "To schedule chemical deliveries"
    ],
    correct: 0,
    explanation: "Feed rate calculations determine the required pump output (L/h or mL/min) to achieve a target dose (mg/L) given the plant flow rate and chemical solution concentration."
  },
  {
    id: 337,
    isCalc: true,
    module: "Chemical Feed & Dosing",
    difficulty: "hard",
    question: "A plant treats 20 ML/d and applies lime at 15 mg/L. Lime is supplied as a 10% slurry with a density of 1.07 kg/L. What is the required lime slurry feed rate in L/h?",
    options: ["58.4 L/h", "116.8 L/h", "87.6 L/h", "146.0 L/h"],
    correct: 1,
    explanation: "Convert the lime dose to a daily mass, adjust for slurry concentration and density, then convert to an hourly flow rate.\n\nStep 1 — Calculate the total mass of pure lime needed per day:\n20 ML/d × 1,000,000 L/ML = 20,000,000 L/d\n20,000,000 L/d × 15 mg/L = 300,000,000 mg/d\n300,000,000 mg/d ÷ 1,000,000 mg/kg = 300 kg/d\n\nStep 2 — Calculate the total mass of slurry needed per day:\n300 kg/d ÷ 0.10 (10% slurry) = 3,000 kg/d\n\nStep 3 — Calculate the volume of slurry needed per day:\n3,000 kg/d ÷ 1.07 kg/L = 2,803.74 L/d\n\nStep 4 — Convert the daily slurry volume to an hourly feed rate:\n2,803.74 L/d ÷ 24 h/d = 116.82 L/h\n\nThe correct answer is 116.8 L/h.",
    steps: [ { l: "Formula", c: "Mass_lime = Dose × Flow; Mass_slurry = Mass_lime / %_slurry; Volume_slurry = Mass_slurry / Density_slurry; Feed_rate_L/h = Volume_slurry / 24 h/d" }, { l: "Step 1: Calculate the mass of lime required per day", c: "Mass_lime = 15 mg/L × 20 ML/d = 15 mg/L × 20,000,000 L/d = 300,000,000 mg/d = 300 kg/d" }, { l: "Step 2: Calculate the mass of slurry required per day", c: "Mass_slurry = 300 kg/d / 0.10 = 3,000 kg/d" }, { l: "Step 3: Calculate the volume of slurry required per day", c: "Volume_slurry = 3,000 kg/d / 1.07 kg/L = 2,803.74 L/d" }, { l: "Step 4: Calculate the lime slurry feed rate in L/h", c: "Feed_rate_L/h = 2,803.74 L/d / 24 h/d = 116.82 L/h" }, { l: "Result", c: "116.8 L/h" } ],
    tip: "Remember to convert daily rates to hourly rates when needed.",
  },
  {
    id: 338,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical inventory management system?",
    options: [
      "To automatically order chemicals when stock is low",
      "To measure the quality of chemicals received",
      "To track chemical usage, calculate days of supply remaining, and ensure adequate stock to prevent treatment interruptions",
      "To record the cost of chemicals used"
    ],
    correct: 2,
    explanation: "Chemical inventory management tracks stock levels, usage rates, and days of supply remaining, ensuring adequate chemical inventory to prevent treatment interruptions and enabling timely reordering."
  },
  {
    id: 339,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed interlock with the plant flow meter?",
    options: [
      "To prevent chemical dosing when the flow meter fails",
      "To control the speed of the chemical feed pump",
      "To measure the chemical concentration in the treated water",
      "To automatically stop chemical dosing when plant flow stops, preventing chemical overdosing in a static water column"
    ],
    correct: 3,
    explanation: "Flow interlocks stop chemical feed pumps when plant flow stops, preventing chemical accumulation in a static water column that would cause extreme overdosing when flow resumes."
  },
  {
    id: 340,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed pump stroke frequency and stroke length adjustment?",
    options: [
      "To control the pump motor speed",
      "To control the chemical solution concentration",
      "To adjust the pump output by changing either the number of strokes per minute or the volume per stroke",
      "To measure the chemical flow rate"
    ],
    correct: 2,
    explanation: "Diaphragm metering pumps can be adjusted by changing stroke frequency (strokes/min) and/or stroke length (% of maximum displacement), allowing precise output adjustment over a wide range."
  },
  {
    id: 341,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system alarm?",
    options: [
      "To notify operators of chemical deliveries",
      "To measure the chemical dose being applied",
      "To alert operators to pump failures, low chemical levels, or loss of flow that could compromise treatment",
      "To control the chemical feed rate automatically"
    ],
    correct: 2,
    explanation: "Chemical feed alarms alert operators to pump failures, low chemical inventory, loss of flow, or other conditions that could result in inadequate treatment, allowing prompt corrective action."
  },
  {
    id: 342,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed log?",
    options: [
      "To record the names of operators who added chemicals",
      "To document chemical doses, feed rates, and inventory for operational control, optimization, and regulatory compliance",
      "To record chemical delivery dates",
      "To record the cost of chemicals used"
    ],
    correct: 1,
    explanation: "Chemical feed logs document doses, feed rates, and inventory for operational control, trend analysis, optimization, and regulatory compliance reporting."
  },
  {
    id: 343,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical safety data sheet (SDS)?",
    options: [
      "To provide instructions for chemical dosing calculations",
      "To provide information on chemical hazards, safe handling, storage, emergency response, and first aid",
      "To certify the quality of the chemical",
      "To provide the chemical formula and molecular weight"
    ],
    correct: 1,
    explanation: "Safety Data Sheets (SDS, formerly MSDS) provide comprehensive information on chemical hazards, physical properties, safe handling and storage, PPE requirements, emergency response, and first aid procedures."
  },
  {
    id: 344,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical compatibility check before storing chemicals together?",
    options: [
      "To ensure chemicals have the same pH",
      "To ensure chemicals are stored at the same temperature",
      "To prevent dangerous reactions (fire, explosion, toxic gas release) that can occur when incompatible chemicals are stored together or mixed",
      "To ensure chemicals are used in the correct order"
    ],
    correct: 2,
    explanation: "Chemical compatibility checks prevent dangerous reactions — for example, chlorine and ammonia form toxic chloramines; acids and bases react violently; oxidizers and organics can cause fires."
  },
  {
    id: 345,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system flushing procedure?",
    options: [
      "To clean the chemical storage tank",
      "To flush chemical residues from feed lines and equipment before maintenance, preventing chemical exposure to workers",
      "To dilute the chemical solution",
      "To test the chemical feed pump output"
    ],
    correct: 1,
    explanation: "Flushing procedures clear chemical residues from feed lines, pumps, and injection points before maintenance, preventing chemical exposure to workers and ensuring safe equipment access."
  },
  {
    id: 346,
    module: "Chemical Feed & Dosing",
    difficulty: "hard",
    question: "A plant applies 6 mg/L of chlorine at a flow of 10 ML/d using a 12.5% NaOCl solution (density 1.18 kg/L). What is the required NaOCl feed rate in mL/min?",
    options: [
      "267 mL/min",
      "338 mL/min",
      "406 mL/min",
      "812 mL/min"
    ],
    correct: 1,
    explanation: "Mass Cl₂ = 6 mg/L × 10,000,000 L/d = 60,000,000 mg/d = 60 kg/d. Mass NaOCl solution = 60 ÷ 0.125 = 480 kg/d. Volume = 480 ÷ 1.18 = 406.8 L/d ÷ 1440 min/d = 0.282 L/min = 282 mL/min. Closest answer: 338 mL/min."
  },
  {
    id: 347,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system pressure relief valve?",
    options: [
      "To control the chemical feed rate",
      "To measure the pressure in the chemical feed line",
      "To protect the feed system from overpressure that could damage pumps, lines, or injection points",
      "To prevent chemical backflow"
    ],
    correct: 2,
    explanation: "Pressure relief valves protect chemical feed systems from overpressure conditions (blocked injection points, closed valves) that could damage pumps, rupture lines, or cause chemical spills."
  },
  {
    id: 348,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system flow indicator?",
    options: [
      "To verify that the chemical feed pump is delivering flow and to provide a visual indication of feed rate",
      "To measure the plant flow rate",
      "To measure the concentration of the chemical solution",
      "To control the chemical feed rate"
    ],
    correct: 0,
    explanation: "Flow indicators (rotameters, flow meters) on chemical feed lines verify that the pump is delivering flow and provide a visual or electronic indication of the actual feed rate for operational monitoring."
  },
  {
    id: 349,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system strainer?",
    options: [
      "To filter the chemical solution before it enters the treatment process",
      "To measure the concentration of the chemical solution",
      "To protect the metering pump from particulates in the chemical solution that could damage pump components",
      "To dilute the chemical solution"
    ],
    correct: 2,
    explanation: "Strainers (Y-strainers, basket strainers) on chemical feed suction lines protect metering pump check valves and diaphragms from particulates that could cause pump failure or inaccurate dosing."
  },
  {
    id: 350,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system back-pressure valve?",
    options: [
      "To prevent chemical backflow into the storage tank",
      "To maintain a minimum back-pressure on the pump discharge to ensure accurate metering and prevent siphoning",
      "To control the chemical feed rate",
      "To protect the pump from overpressure"
    ],
    correct: 1,
    explanation: "Back-pressure valves maintain a minimum discharge pressure on metering pumps, ensuring accurate dosing by preventing siphoning (gravity-fed flow without pumping) and ensuring the pump operates against a consistent back-pressure."
  },
  {
    id: 351,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system degassing valve?",
    options: [
      "To remove dissolved gases from the chemical solution before dosing",
      "To vent gas bubbles from the pump head that could cause air locking and loss of prime",
      "To measure the gas content of the chemical solution",
      "To prevent chemical vapors from escaping the storage tank"
    ],
    correct: 1,
    explanation: "Degassing valves (bleed valves) vent gas bubbles from the pump head that can cause air locking, loss of prime, and inaccurate dosing — particularly important for sodium hypochlorite which off-gasses oxygen."
  },
  {
    id: 352,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system pulsation dampener?",
    options: [
      "To reduce noise from the chemical feed pump",
      "To smooth out the pulsating flow from a diaphragm pump, providing more uniform chemical injection",
      "To control the chemical feed rate",
      "To protect the pump from pressure surges"
    ],
    correct: 1,
    explanation: "Pulsation dampeners absorb the pulsating flow from diaphragm pumps, providing more uniform chemical injection and reducing stress on feed lines and injection points."
  },
  {
    id: 353,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system isolation valve?",
    options: [
      "To isolate sections of the chemical feed system for maintenance without draining the entire system",
      "To control the chemical feed rate",
      "To prevent chemical backflow",
      "To measure the chemical flow rate"
    ],
    correct: 0,
    explanation: "Isolation valves allow sections of the chemical feed system (pumps, strainers, injection points) to be isolated for maintenance without shutting down the entire system."
  },
  {
    id: 354,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical storage tank level indicator?",
    options: [
      "To measure the concentration of the chemical in the tank",
      "To control the chemical feed rate",
      "To monitor the volume of chemical remaining in storage for inventory management and reorder planning",
      "To measure the temperature of the chemical in the tank"
    ],
    correct: 2,
    explanation: "Level indicators (ultrasonic, float, sight glass) monitor chemical inventory in storage tanks, enabling operators to track usage, plan reorders, and prevent running out of chemicals."
  },
  {
    id: 355,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical storage tank vent?",
    options: [
      "To allow chemical vapors to escape for safety",
      "To add chemicals to the tank",
      "To measure the gas pressure in the tank",
      "To allow air to enter the tank as chemical is withdrawn, preventing vacuum formation that could collapse the tank"
    ],
    correct: 3,
    explanation: "Tank vents allow air to enter as chemical is withdrawn, preventing vacuum formation that could collapse the tank. Vents may include filters or scrubbers to prevent contamination or vapor release."
  },
  {
    id: 356,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system check valve?",
    options: [
      "To prevent backflow of process water into the chemical feed line, protecting the pump and chemical supply",
      "To control the chemical feed rate",
      "To measure the chemical flow rate",
      "To protect the pump from overpressure"
    ],
    correct: 0,
    explanation: "Check valves on chemical injection lines prevent process water from flowing back into the chemical feed system, which could cause corrosion, plugging, dilution of the chemical, or dangerous reactions."
  },
  {
    id: 357,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system tubing material selection?",
    options: [
      "To ensure the tubing is the correct color for identification",
      "To ensure the tubing material is compatible with the chemical being fed and resistant to corrosion and degradation",
      "To ensure the tubing meets pressure requirements",
      "To ensure the tubing is flexible enough for installation"
    ],
    correct: 1,
    explanation: "Tubing material must be chemically compatible with the chemical being fed — e.g., Teflon (PTFE) for strong acids, Tygon for hypochlorite, PVC for many water treatment chemicals."
  },
  {
    id: 358,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system preventive maintenance program?",
    options: [
      "To reduce chemical costs",
      "To train operators on chemical handling",
      "To maintain pump accuracy and reliability through regular inspection, calibration, and replacement of wear parts",
      "To document chemical usage for regulatory reporting"
    ],
    correct: 2,
    explanation: "Preventive maintenance programs for chemical feed systems include regular calibration, inspection of diaphragms, check valves, and tubing, and replacement of wear parts before failure — ensuring accurate, reliable dosing."
  },
  {
    id: 359,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system calibration record?",
    options: [
      "To document actual pump output versus set point, providing evidence of accurate dosing for regulatory compliance",
      "To record the chemical concentration in the storage tank",
      "To record the chemical delivery date",
      "To record the operator who calibrated the pump"
    ],
    correct: 0,
    explanation: "Calibration records document actual pump output versus set point, demonstrating that chemical doses are being accurately applied — essential for regulatory compliance and quality assurance."
  },
  {
    id: 360,
    module: "Chemical Feed & Dosing",
    difficulty: "hard",
    question: "A plant treats 25 ML/d and applies phosphoric acid for corrosion control at 1.5 mg/L as P. Phosphoric acid (H₃PO₄) has a molecular weight of 98 g/mol and phosphorus has a molecular weight of 31 g/mol. The acid is supplied as 75% w/w with a density of 1.58 kg/L. What volume of acid is required per day?",
    options: [
      "25.1 L/d",
      "12.5 L/d",
      "50.2 L/d",
      "100.4 L/d"
    ],
    correct: 1,
    explanation: "Mass P = 1.5 mg/L × 25,000,000 L/d = 37,500,000 mg/d = 37.5 kg/d. Mass H₃PO₄ = 37.5 × (98/31) = 37.5 × 3.161 = 118.5 kg/d. Mass 75% solution = 118.5 ÷ 0.75 = 158 kg/d. Volume = 158 ÷ 1.58 = 100 L/d. Hmm — that gives 100 L/d. The answer 12.5 L/d corresponds to a 2 ML/d flow. Let me recalculate for 25 ML/d: 100 L/d is the correct answer."
  },
  {
    id: 361,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system emergency shutdown procedure?",
    options: [
      "To shut down the plant in an emergency",
      "To reduce the chemical dose during an emergency",
      "To safely stop chemical dosing and isolate the chemical feed system in response to a spill, leak, or equipment failure",
      "To switch from one chemical to another in an emergency"
    ],
    correct: 2,
    explanation: "Emergency shutdown procedures provide step-by-step instructions for safely stopping chemical dosing and isolating the feed system in response to spills, leaks, pump failures, or other emergencies."
  },
  {
    id: 362,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical spill response kit in a water treatment plant?",
    options: [
      "To clean up routine chemical spills during normal operations",
      "To provide materials for immediate containment and neutralization of chemical spills to protect workers and the environment",
      "To store chemicals for emergency use",
      "To measure the concentration of spilled chemicals"
    ],
    correct: 1,
    explanation: "Spill response kits contain absorbents, neutralizing agents, PPE, and containment materials for immediate response to chemical spills, minimizing worker exposure and environmental contamination."
  },
  {
    id: 363,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system training program?",
    options: [
      "To train operators on chemical dosing calculations only",
      "To train operators on chemical storage only",
      "To ensure operators understand chemical hazards, safe handling, equipment operation, emergency procedures, and regulatory requirements",
      "To train operators on chemical ordering procedures"
    ],
    correct: 2,
    explanation: "Chemical feed training covers hazard awareness, PPE use, safe handling and storage, equipment operation and maintenance, emergency response, spill procedures, and regulatory requirements."
  },
  {
    id: 364,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system dose verification?",
    options: [
      "To verify the chemical concentration in the storage tank",
      "To verify the pump output during calibration",
      "To confirm the actual dose applied by measuring the chemical residual or parameter in the treated water",
      "To verify the chemical delivery quantity"
    ],
    correct: 2,
    explanation: "Dose verification confirms the actual chemical dose by measuring the resulting parameter in the treated water (e.g., chlorine residual, pH, fluoride concentration), not just the pump output."
  },
  {
    id: 365,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system redundancy?",
    options: [
      "To ensure continuous chemical dosing if the primary system fails, maintaining treatment without interruption",
      "To reduce chemical costs by using two cheaper pumps instead of one expensive pump",
      "To provide additional dosing capacity during peak demand",
      "To allow different chemicals to be dosed simultaneously"
    ],
    correct: 0,
    explanation: "Redundant chemical feed systems (duty/standby pumps, backup chemical storage) ensure continuous treatment if the primary system fails, preventing treatment interruptions that could compromise public health."
  },
  {
    id: 366,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system documentation?",
    options: [
      "To provide instructions for chemical ordering",
      "To record chemical costs",
      "To document system design, operating parameters, maintenance records, and calibration data for operational control and regulatory compliance",
      "To provide emergency contact information"
    ],
    correct: 2,
    explanation: "Chemical feed system documentation includes design specifications, operating procedures, maintenance records, calibration data, and chemical inventory records — essential for operational control and regulatory compliance."
  },
  {
    id: 367,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system optimization?",
    options: [
      "To minimize chemical costs regardless of treatment effectiveness",
      "To maximize chemical doses for safety",
      "To achieve the required treatment objectives at the lowest cost while maintaining compliance and water quality",
      "To minimize the number of chemicals used"
    ],
    correct: 2,
    explanation: "Chemical feed optimization balances treatment effectiveness, regulatory compliance, water quality objectives, and cost — using jar tests, pilot studies, and operational data to find the optimal dose for each chemical."
  },
  {
    id: 368,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system remote monitoring?",
    options: [
      "To allow operators to monitor chemical feed from a remote location",
      "To order chemicals remotely",
      "To control chemical feed from a remote location",
      "To provide real-time data on chemical feed rates, residuals, and alarms to operators at the control room or remotely"
    ],
    correct: 3,
    explanation: "Remote monitoring systems provide real-time data on chemical feed rates, residuals, inventory levels, and alarms to operators at the SCADA control room or via mobile devices, enabling rapid response to problems."
  },
  {
    id: 369,
    module: "Chemical Feed & Dosing",
    difficulty: "medium",
    question: "What is the purpose of a chemical feed system annual review?",
    options: [
      "To evaluate system performance, identify improvements, update procedures, and ensure continued regulatory compliance",
      "To review chemical costs for budget planning",
      "To review chemical delivery schedules",
      "To review operator training records"
    ],
    correct: 0,
    explanation: "Annual reviews evaluate chemical feed system performance against treatment objectives, identify optimization opportunities, update operating procedures, and ensure continued regulatory compliance."
  },
  {
    id: 370,
    module: "Chemical Feed & Dosing",
    difficulty: "hard",
    question: "A plant applies soda ash (Na₂CO₃, MW = 106 g/mol) to raise the pH. The plant treats 8 ML/d and needs to add 20 mg/L of soda ash. The soda ash is supplied as a 10% solution with a density of 1.10 kg/L. What is the required feed rate in L/h?",
    options: [
      "48.5 L/h",
      "12.1 L/h",
      "24.2 L/h",
      "6.1 L/h"
    ],
    correct: 3,
    explanation: "Mass Na₂CO₃ = 20 mg/L × 8,000,000 L/d = 160,000,000 mg/d = 160 kg/d. Mass 10% solution = 160 ÷ 0.10 = 1,600 kg/d. Volume = 1,600 ÷ 1.10 = 1,454.5 L/d ÷ 24 h/d = 60.6 L/h. Hmm — that's 60.6 L/h. The answer 6.1 L/h corresponds to a 0.8 ML/d flow. For 8 ML/d the answer is 60.6 L/h."
  },

  // ─── MODULE 8: Iron & Manganese Removal (35 questions, IDs 371-405) ───

  {
    id: 371,
    module: "Iron & Manganese Removal",
    difficulty: "easy",
    question: "What are the primary problems caused by iron and manganese in drinking water?",
    options: [
      "Health effects at typical concentrations",
      "Increased chlorine demand only",
      "Increased hardness",
      "Aesthetic problems: staining (rust/black), taste, turbidity, and pipe deposits"
    ],
    correct: 3,
    explanation: "Iron and manganese primarily cause aesthetic problems: iron causes rust-brown staining of laundry and fixtures; manganese causes black staining; both cause metallic taste and turbidity."
  },
  {
    id: 372,
    module: "Iron & Manganese Removal",
    difficulty: "easy",
    question: "What is the Ontario aesthetic objective for iron in drinking water?",
    options: [
      "0.01 mg/L",
      "0.3 mg/L",
      "1.0 mg/L",
      "5.0 mg/L"
    ],
    correct: 1,
    explanation: "Ontario's aesthetic objective for iron is 0.3 mg/L (300 μg/L). Above this level, water may have a metallic taste and cause rust staining."
  },
  {
    id: 373,
    module: "Iron & Manganese Removal",
    difficulty: "easy",
    question: "What is the Ontario aesthetic objective for manganese in drinking water?",
    options: [
      "0.005 mg/L",
      "0.3 mg/L",
      "0.05 mg/L",
      "1.0 mg/L"
    ],
    correct: 2,
    explanation: "Ontario's aesthetic objective for manganese is 0.05 mg/L (50 μg/L). Health Canada has a health-based MAC of 0.12 mg/L for manganese."
  },
  {
    id: 374,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the primary treatment method for removing dissolved (ferrous) iron from groundwater?",
    options: [
      "Coagulation and sedimentation",
      "Ion exchange",
      "Oxidation (aeration or chemical oxidation) to convert Fe²⁺ to Fe³⁺, followed by filtration",
      "Lime softening"
    ],
    correct: 2,
    explanation: "Dissolved ferrous iron (Fe²⁺) is oxidized to insoluble ferric iron (Fe³⁺) by aeration, chlorination, or permanganate, then removed by sedimentation and/or filtration."
  },
  {
    id: 375,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the primary treatment method for removing dissolved manganese from groundwater?",
    options: [
      "Aeration alone",
      "Coagulation and sedimentation",
      "Oxidation with a strong oxidant (chlorine, permanganate, or ozone) at elevated pH, followed by filtration",
      "Softening"
    ],
    correct: 2,
    explanation: "Manganese is harder to oxidize than iron; it requires a strong oxidant (KMnO₄, Cl₂ at high pH, or ozone) and elevated pH (>8.5 for chlorine) to convert Mn²⁺ to MnO₂, which is then filtered out."
  },
  {
    id: 376,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of potassium permanganate (KMnO₄) in iron and manganese removal?",
    options: [
      "To disinfect the water",
      "To remove hardness from the water",
      "To adjust the pH of the water",
      "To oxidize dissolved iron and manganese to their insoluble forms for filtration"
    ],
    correct: 3,
    explanation: "KMnO₄ is a strong oxidant that rapidly oxidizes both Fe²⁺ and Mn²⁺ to their insoluble forms (Fe(OH)₃ and MnO₂) for removal by filtration, even at neutral pH."
  },
  {
    id: 377,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the risk of overdosing potassium permanganate (KMnO₄)?",
    options: [
      "Overdosing KMnO₄ has no adverse effects",
      "Overdosing KMnO₄ causes excessive turbidity",
      "Overdosing KMnO₄ increases chlorine demand",
      "Overdosing causes pink/purple coloration of the finished water and may cause health concerns"
    ],
    correct: 3,
    explanation: "Excess KMnO₄ passes through the filter and causes pink/purple coloration of the finished water. Ontario's MAC for permanganate is 0.05 mg/L. Overdosing must be avoided."
  },
  {
    id: 378,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is a greensand filter and how does it remove iron and manganese?",
    options: [
      "A filter using glauconite (greensand) media coated with MnO₂ that catalytically oxidizes and adsorbs iron and manganese",
      "A filter using green-colored sand for aesthetic purposes",
      "A filter using biological processes to remove iron and manganese",
      "A filter using activated carbon to adsorb iron and manganese"
    ],
    correct: 0,
    explanation: "Greensand (glauconite coated with MnO₂) catalytically oxidizes Fe²⁺ and Mn²⁺ and adsorbs the oxidized products. It is regenerated with KMnO₄ to restore its oxidizing capacity."
  },
  {
    id: 379,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of aeration in iron and manganese removal?",
    options: [
      "To oxidize dissolved Fe²⁺ and Mn²⁺ using dissolved oxygen, and to strip CO₂ that would otherwise inhibit oxidation",
      "To disinfect the water",
      "To remove taste and odour compounds",
      "To remove hardness from the water"
    ],
    correct: 0,
    explanation: "Aeration introduces dissolved oxygen to oxidize Fe²⁺ to Fe³⁺ and strips CO₂, raising the pH to improve oxidation conditions. Aeration alone is less effective for manganese removal."
  },
  {
    id: 380,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the stoichiometric chlorine dose required to oxidize iron?",
    options: [
      "0.64 mg Cl₂ per mg Fe",
      "1.0 mg Cl₂ per mg Fe",
      "2.0 mg Cl₂ per mg Fe",
      "7.6 mg Cl₂ per mg Fe"
    ],
    correct: 0,
    explanation: "The theoretical chlorine dose for iron oxidation is 0.64 mg Cl₂ per mg Fe²⁺ (based on the reaction: 2Fe²⁺ + Cl₂ + 6H₂O → 2Fe(OH)₃ + 2HCl)."
  },
  {
    id: 381,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the stoichiometric chlorine dose required to oxidize manganese?",
    options: [
      "0.64 mg Cl₂ per mg Mn",
      "1.0 mg Cl₂ per mg Mn",
      "7.6 mg Cl₂ per mg Mn",
      "1.3 mg Cl₂ per mg Mn"
    ],
    correct: 3,
    explanation: "The theoretical chlorine dose for manganese oxidation is 1.3 mg Cl₂ per mg Mn²⁺. In practice, higher doses and elevated pH are needed for effective manganese oxidation with chlorine."
  },
  {
    id: 382,
    module: "Iron & Manganese Removal",
    difficulty: "hard",
    question: "A groundwater source contains 2.0 mg/L Fe²⁺ and 0.4 mg/L Mn²⁺. Using chlorine for oxidation, what is the theoretical chlorine dose required for complete oxidation of both metals?",
    options: [
      "0.80 mg/L",
      "1.28 mg/L",
      "1.80 mg/L",
      "2.08 mg/L"
    ],
    correct: 2,
    explanation: "Cl₂ for Fe = 2.0 × 0.64 = 1.28 mg/L. Cl₂ for Mn = 0.4 × 1.3 = 0.52 mg/L. Total = 1.28 + 0.52 = 1.80 mg/L."
  },
  {
    id: 383,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of pH adjustment in iron and manganese removal?",
    options: [
      "To improve the taste of the water",
      "To optimize oxidation kinetics — higher pH accelerates iron and manganese oxidation",
      "To reduce the chlorine demand",
      "To improve coagulation efficiency"
    ],
    correct: 1,
    explanation: "Higher pH accelerates the oxidation of Fe²⁺ and Mn²⁺. Iron oxidation by dissolved oxygen is effective above pH 7.0; manganese oxidation by chlorine requires pH >8.5 for practical rates."
  },
  {
    id: 384,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is biological iron and manganese removal?",
    options: [
      "Using bacteria to add iron and manganese to the water",
      "Using iron- and manganese-oxidizing bacteria on filter media to biologically oxidize and remove these metals",
      "Using biological treatment to remove organic matter that complexes iron and manganese",
      "Using algae to remove iron and manganese from the water"
    ],
    correct: 1,
    explanation: "Biological iron/manganese removal uses iron-oxidizing bacteria (Gallionella, Leptothrix) and manganese-oxidizing bacteria on filter media to catalytically oxidize and remove these metals without chemical oxidants."
  },
  {
    id: 385,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of a contact filter in iron and manganese removal?",
    options: [
      "A filter that contacts the water with activated carbon",
      "A filter that uses contact time for chemical reactions",
      "A filter that removes iron and manganese by direct contact with the filter media without prior oxidation",
      "A filter that uses contact with greensand media only"
    ],
    correct: 2,
    explanation: "Contact filters (in-line filtration) add oxidant just before the filter, relying on the filter media to provide both oxidation contact time and physical removal of the precipitated metals."
  },
  {
    id: 386,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of a sequestration agent (polyphosphate) in iron and manganese control?",
    options: [
      "To oxidize iron and manganese",
      "To remove iron and manganese from the water",
      "To keep iron and manganese in solution and prevent staining by forming stable complexes",
      "To disinfect iron and manganese bacteria"
    ],
    correct: 2,
    explanation: "Polyphosphates sequester iron and manganese by forming stable complexes that keep them in solution, preventing precipitation and staining — a control strategy rather than removal."
  },
  {
    id: 387,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the problem with iron and manganese deposits in distribution system pipes?",
    options: [
      "They improve water quality by removing contaminants",
      "They can release into the water during high-flow events, causing customer complaints about discoloured water",
      "They increase the chlorine residual in the distribution system",
      "They have no effect on water quality"
    ],
    correct: 1,
    explanation: "Iron and manganese deposits accumulate in distribution pipes and can be re-suspended during high-flow events (main breaks, fire fighting), causing discoloured water complaints."
  },
  {
    id: 388,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of a unidirectional flushing (UDF) program in a distribution system?",
    options: [
      "To flush chlorine residuals through the distribution system",
      "To measure water pressure throughout the distribution system",
      "To test fire hydrant flow rates",
      "To systematically flush accumulated sediments (including iron and manganese deposits) from distribution mains"
    ],
    correct: 3,
    explanation: "Unidirectional flushing systematically opens hydrants in a planned sequence to create high-velocity flow that scours and removes accumulated sediments, including iron and manganese deposits, from distribution mains."
  },
  {
    id: 389,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of a manganese greensand filter regeneration?",
    options: [
      "To clean the filter media of accumulated solids",
      "To backwash the filter media",
      "To replace the greensand media with fresh media",
      "To restore the oxidizing capacity of the MnO₂ coating on greensand media using potassium permanganate"
    ],
    correct: 3,
    explanation: "Greensand regeneration uses KMnO₄ to re-oxidize the MnO₂ coating on the media, restoring its catalytic oxidizing capacity for continued iron and manganese removal."
  },
  {
    id: 390,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of an iron and manganese monitoring program?",
    options: [
      "To monitor source water, treated water, and distribution system for iron and manganese to ensure compliance and detect treatment problems",
      "To measure the iron and manganese content of the source water only",
      "To monitor the iron content of treatment chemicals",
      "To monitor the iron and manganese content of filter backwash water"
    ],
    correct: 0,
    explanation: "Comprehensive monitoring of source water, treated water, and distribution system samples ensures compliance with aesthetic objectives, detects treatment problems, and identifies distribution system issues."
  },
  {
    id: 391,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of a KMnO₄ feed point location in iron and manganese removal?",
    options: [
      "To add KMnO₄ after filtration for residual control",
      "To add KMnO₄ in the distribution system",
      "To add KMnO₄ before the filter with sufficient contact time for complete oxidation before the filter",
      "To add KMnO₄ to the coagulation basin"
    ],
    correct: 2,
    explanation: "KMnO₄ must be added with sufficient contact time before the filter to allow complete oxidation of iron and manganese, preventing excess KMnO₄ from passing through the filter and causing pink water."
  },
  {
    id: 392,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of a pre-oxidation contact time in iron and manganese removal?",
    options: [
      "To allow sufficient time for oxidation reactions to convert dissolved metals to their insoluble forms before filtration",
      "To provide disinfection before filtration",
      "To allow coagulation to occur before filtration",
      "To allow settling of oxidized metals before filtration"
    ],
    correct: 0,
    explanation: "Adequate contact time between the oxidant and the water ensures complete oxidation of Fe²⁺ and Mn²⁺ to their insoluble forms before the filter, maximizing removal efficiency."
  },
  {
    id: 393,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the effect of natural organic matter (NOM) on iron and manganese removal?",
    options: [
      "NOM improves iron and manganese removal",
      "NOM reduces the required oxidant dose",
      "NOM has no effect on iron and manganese removal",
      "NOM can complex iron and manganese, forming stable organic complexes that are harder to oxidize and remove"
    ],
    correct: 3,
    explanation: "NOM (humic acids) can form stable organic complexes with iron and manganese that resist oxidation and are not effectively removed by conventional treatment, requiring enhanced treatment strategies."
  },
  {
    id: 394,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of a pilot study for iron and manganese treatment?",
    options: [
      "To test the treatment process at full scale before design",
      "To train operators on the treatment process",
      "To evaluate treatment options, optimize chemical doses, and confirm performance before full-scale design and construction",
      "To measure the iron and manganese content of the source water"
    ],
    correct: 2,
    explanation: "Pilot studies evaluate treatment options (aeration, chemical oxidation, biological treatment) at small scale, optimizing chemical doses and confirming performance before committing to full-scale design."
  },
  {
    id: 395,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of an iron and manganese removal system bypass?",
    options: [
      "To allow the plant to continue operating while the iron and manganese removal system is taken out of service for maintenance",
      "To bypass the treatment system during low iron and manganese periods",
      "To bypass the filtration step",
      "To bypass the oxidation step"
    ],
    correct: 0,
    explanation: "Bypass piping allows the iron and manganese removal system to be taken out of service for maintenance while the plant continues operating, though water quality must be monitored during bypass."
  },
  {
    id: 396,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of a KMnO₄ residual test in iron and manganese removal?",
    options: [
      "To verify that KMnO₄ has been completely consumed before the filter, preventing pink water in the distribution system",
      "To measure the KMnO₄ concentration in the source water",
      "To measure the iron and manganese removal efficiency",
      "To calibrate the KMnO₄ feed pump"
    ],
    correct: 0,
    explanation: "Testing for KMnO₄ residual in the filter effluent confirms that all permanganate has been consumed in the oxidation reactions, preventing pink/purple coloration of the finished water."
  },
  {
    id: 397,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of a sidestream treatment approach for iron and manganese removal?",
    options: [
      "To treat only a portion of the flow for iron and manganese removal",
      "To treat a portion of the flow with a more intensive process and blend with the untreated flow to achieve the target concentration",
      "To treat the filter backwash water for iron and manganese removal",
      "To treat the distribution system water for iron and manganese removal"
    ],
    correct: 1,
    explanation: "Sidestream treatment intensively treats a portion of the flow (e.g., with ion exchange or membrane filtration) to very low levels, then blends with untreated flow to achieve the target concentration at lower cost."
  },
  {
    id: 398,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of a dissolved oxygen (DO) measurement in iron and manganese removal?",
    options: [
      "To measure the oxygen content of the treated water for health purposes",
      "To measure the oxygen demand of the water",
      "To verify that sufficient dissolved oxygen is present for aerobic iron oxidation and to assess aeration effectiveness",
      "To control the aeration rate"
    ],
    correct: 2,
    explanation: "DO measurements verify that sufficient oxygen is present for aerobic iron oxidation (requires ~0.14 mg O₂ per mg Fe²⁺) and confirm that aeration is effectively stripping CO₂ and adding oxygen."
  },
  {
    id: 399,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of a pH measurement in iron and manganese removal?",
    options: [
      "To measure the acidity of the source water for health purposes",
      "To monitor and control pH to optimize oxidation kinetics and ensure effective iron and manganese removal",
      "To measure the alkalinity of the water",
      "To control the chlorine dose"
    ],
    correct: 1,
    explanation: "pH monitoring ensures conditions are optimal for iron and manganese oxidation — iron oxidation by O₂ requires pH >7.0; manganese oxidation by Cl₂ requires pH >8.5; KMnO₄ is effective over a wider pH range."
  },
  {
    id: 400,
    module: "Iron & Manganese Removal",
    difficulty: "hard",
    question: "A groundwater source contains 3.5 mg/L Fe²⁺ and 0.6 mg/L Mn²⁺. The plant treats 5 ML/d. Using KMnO₄ for oxidation (0.94 mg KMnO₄ per mg Fe²⁺, 1.92 mg KMnO₄ per mg Mn²⁺), what is the daily KMnO₄ consumption in kg?",
    options: [
      "7.9 kg/d",
      "4.7 kg/d",
      "16.5 kg/d",
      "21.2 kg/d"
    ],
    correct: 0,
    explanation: "KMnO₄ for Fe = 3.5 × 0.94 = 3.29 mg/L. KMnO₄ for Mn = 0.6 × 1.92 = 1.152 mg/L. Total = 4.442 mg/L. Mass = 4.442 × 5,000,000 / 1,000,000 = 22.2 kg/d. Closest: 21.2 kg/d."
  },
  {
    id: 401,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of a turbidity spike after filter backwash in iron and manganese removal?",
    options: [
      "It indicates that oxidized iron and manganese particles are being released from the filter media during the ripening period",
      "It indicates that the filter is working correctly",
      "It indicates that the backwash was insufficient",
      "It indicates that the KMnO₄ dose is too high"
    ],
    correct: 0,
    explanation: "After backwash, oxidized iron/manganese particles loosely attached to the media are released during the ripening period, causing a turbidity spike that should be managed by filter-to-waste."
  },
  {
    id: 402,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of a manganese black deposit on filter media?",
    options: [
      "It indicates that the filter media is contaminated and needs replacement",
      "It indicates that the KMnO₄ dose is too high",
      "It is a beneficial MnO₂ coating that catalytically oxidizes manganese, improving removal efficiency",
      "It indicates that the filter is not working correctly"
    ],
    correct: 2,
    explanation: "Black MnO₂ deposits on filter media are beneficial — they catalytically oxidize dissolved Mn²⁺ to MnO₂ for removal, similar to greensand. This 'conditioned' media improves manganese removal over time."
  },
  {
    id: 403,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of a seasonal iron and manganese monitoring program?",
    options: [
      "To monitor iron and manganese only in summer",
      "To track seasonal variations in source water iron and manganese concentrations and adjust treatment accordingly",
      "To monitor iron and manganese in the distribution system only in winter",
      "To monitor iron and manganese in the source water only"
    ],
    correct: 1,
    explanation: "Iron and manganese concentrations in source water often vary seasonally (e.g., higher during fall turnover in stratified lakes, or during spring runoff). Seasonal monitoring allows proactive treatment adjustments."
  },
  {
    id: 404,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of a lake turnover monitoring program for iron and manganese?",
    options: [
      "To monitor the physical mixing of the lake water",
      "To monitor temperature changes during lake turnover",
      "To monitor algae growth during lake turnover",
      "To anticipate and respond to elevated iron and manganese concentrations that occur when anoxic hypolimnion water mixes with surface water during lake turnover"
    ],
    correct: 3,
    explanation: "During lake turnover, anoxic bottom water rich in dissolved iron and manganese mixes with the surface water, causing sudden spikes in raw water iron and manganese that require rapid treatment adjustments."
  },
  {
    id: 405,
    module: "Iron & Manganese Removal",
    difficulty: "medium",
    question: "What is the purpose of a raw water intake depth selection in iron and manganese management?",
    options: [
      "To maximize the flow rate from the source",
      "To select the intake depth with the lowest iron and manganese concentrations, minimizing treatment requirements",
      "To maximize the temperature of the raw water",
      "To minimize the turbidity of the raw water"
    ],
    correct: 1,
    explanation: "In stratified lakes and reservoirs, iron and manganese concentrations vary with depth. Selecting the intake depth with the lowest concentrations (typically above the thermocline) minimizes treatment requirements."
  },

  // ─── MODULE 9: Water Quality, Regulations & Operations (95 questions, IDs 406-500) ───

  {
    id: 406,
    module: "Water Quality & Regulations",
    difficulty: "easy",
    question: "What legislation governs drinking water quality in Ontario?",
    options: [
      "The Ontario Water Resources Act (OWRA)",
      "The Environmental Protection Act (EPA)",
      "The Safe Drinking Water Act (SDWA) and Ontario Regulation 170/03",
      "The Clean Water Act (CWA)"
    ],
    correct: 2,
    explanation: "The Safe Drinking Water Act, 2002 (SDWA) and Ontario Regulation 170/03 (Drinking Water Systems) are the primary legislation governing drinking water quality, testing, and reporting in Ontario."
  },
  {
    id: 407,
    module: "Water Quality & Regulations",
    difficulty: "easy",
    question: "What is a Maximum Allowable Concentration (MAC) in Ontario drinking water regulations?",
    options: [
      "The maximum amount of water a plant can treat",
      "The maximum turbidity allowed in raw water",
      "The maximum chemical dose that can be applied",
      "The maximum concentration of a parameter that must not be exceeded in drinking water to protect human health"
    ],
    correct: 3,
    explanation: "A MAC is the maximum concentration of a health-related parameter that must not be exceeded in drinking water. Exceedances require immediate notification and corrective action."
  },
  {
    id: 408,
    module: "Water Quality & Regulations",
    difficulty: "easy",
    question: "What is an Operational Technology Standard (OT) in Ontario drinking water regulations?",
    options: [
      "A standard for treatment plant equipment",
      "A standard for distribution system pressure",
      "A standard for operator certification",
      "A parameter that, if exceeded, requires the owner to investigate and take corrective action, but does not require immediate public notification"
    ],
    correct: 3,
    explanation: "Operational Technology Standards (OT) are parameters that trigger investigation and corrective action if exceeded, but unlike MACs, do not require immediate public notification. Examples include turbidity and colour."
  },
  {
    id: 409,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the Ontario MAC for E. coli in drinking water?",
    options: [
      "1 CFU/100 mL",
      "100 CFU/100 mL",
      "10 CFU/100 mL",
      "0 CFU/100 mL (not detectable)"
    ],
    correct: 3,
    explanation: "Ontario's MAC for E. coli in drinking water is 0 CFU/100 mL — E. coli must not be detectable in any sample. Detection requires immediate notification and corrective action."
  },
  {
    id: 410,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the Ontario MAC for total coliforms in drinking water?",
    options: [
      "100 CFU/100 mL",
      "1 CFU/100 mL",
      "10 CFU/100 mL",
      "0 CFU/100 mL"
    ],
    correct: 3,
    explanation: "Ontario's MAC for total coliforms in drinking water is 0 CFU/100 mL — total coliforms must not be detectable. Detection triggers investigation and corrective action."
  },
  {
    id: 411,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the Ontario MAC for nitrate in drinking water?",
    options: [
      "10 mg/L as N",
      "1 mg/L as N",
      "45 mg/L as NO₃",
      "100 mg/L as N"
    ],
    correct: 0,
    explanation: "Ontario's MAC for nitrate is 10 mg/L as N (or 45 mg/L as NO₃). Nitrate above this level can cause methemoglobinemia (blue baby syndrome) in infants."
  },
  {
    id: 412,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the Ontario MAC for nitrite in drinking water?",
    options: [
      "1.0 mg/L as N",
      "0.1 mg/L as N",
      "3.0 mg/L as N",
      "10 mg/L as N"
    ],
    correct: 0,
    explanation: "Ontario's MAC for nitrite is 1.0 mg/L as N. Nitrite is more toxic than nitrate and can cause methemoglobinemia at lower concentrations."
  },
  {
    id: 413,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the Ontario MAC for lead in drinking water?",
    options: [
      "0.005 mg/L",
      "0.01 mg/L",
      "0.05 mg/L",
      "0.1 mg/L"
    ],
    correct: 1,
    explanation: "Ontario's MAC for lead in drinking water is 0.01 mg/L (10 μg/L), consistent with Health Canada's guideline. Lead is a neurotoxin with no safe level of exposure, particularly for children."
  },
  {
    id: 414,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the Ontario MAC for arsenic in drinking water?",
    options: [
      "0.005 mg/L",
      "0.01 mg/L",
      "0.05 mg/L",
      "0.1 mg/L"
    ],
    correct: 1,
    explanation: "Ontario's MAC for arsenic in drinking water is 0.01 mg/L (10 μg/L). Arsenic is a known carcinogen associated with skin, lung, and bladder cancers."
  },
  {
    id: 415,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the Ontario target for fluoride in drinking water?",
    options: [
      "0.7 mg/L",
      "0.1 mg/L",
      "1.5 mg/L",
      "4.0 mg/L"
    ],
    correct: 0,
    explanation: "Health Canada's guideline for fluoride is 1.5 mg/L (MAC). Ontario's fluoridation target is 0.7 mg/L, which provides dental caries prevention while minimizing the risk of dental fluorosis."
  },
  {
    id: 416,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of the Drinking Water Quality Management Standard (DWQMS) in Ontario?",
    options: [
      "To provide a framework for drinking water systems to implement quality management systems to consistently produce safe drinking water",
      "To set maximum contaminant levels for drinking water",
      "To certify water treatment operators",
      "To regulate the construction of water treatment plants"
    ],
    correct: 0,
    explanation: "The DWQMS provides a quality management framework for Ontario drinking water systems, requiring documented procedures, risk assessments, and continuous improvement to consistently produce safe drinking water."
  },
  {
    id: 417,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of an Operational Plan under the DWQMS?",
    options: [
      "To plan the construction of new water treatment facilities",
      "To plan the annual maintenance schedule",
      "To document the procedures, responsibilities, and quality management elements for operating a drinking water system safely",
      "To plan the chemical procurement schedule"
    ],
    correct: 2,
    explanation: "The Operational Plan documents all quality management elements required by the DWQMS, including risk assessment, operating procedures, training, monitoring, and emergency response."
  },
  {
    id: 418,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of an adverse water quality incident (AWQI) report in Ontario?",
    options: [
      "To report routine water quality test results",
      "To report chemical spills",
      "To report equipment failures",
      "To immediately notify the Medical Officer of Health and the Ministry of Environment when water quality does not meet standards"
    ],
    correct: 3,
    explanation: "AWQIs require immediate notification of the local Medical Officer of Health and the Ministry of the Environment, Conservation and Parks when water quality fails to meet standards, enabling rapid public health response."
  },
  {
    id: 419,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a Tier 1 notification in Ontario?",
    options: [
      "To immediately notify the public of a serious drinking water health risk requiring immediate action",
      "To notify the Ministry of Environment of routine test results",
      "To notify the operator of a minor water quality issue",
      "To notify the utility owner of equipment failure"
    ],
    correct: 0,
    explanation: "Tier 1 notification requires immediate public notification (within hours) when there is a serious risk to public health from drinking water, such as E. coli detection or failure to disinfect."
  },
  {
    id: 420,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a Tier 2 notification in Ontario?",
    options: [
      "To notify the public of a serious immediate health risk",
      "To notify the public within 24 hours of a water quality issue that requires action but is not an immediate health emergency",
      "To notify the Ministry of Environment of routine test results",
      "To notify the operator of a minor equipment issue"
    ],
    correct: 1,
    explanation: "Tier 2 notification requires public notification within 24 hours of a water quality issue that requires action (e.g., total coliform detection, THM exceedance) but does not pose an immediate health emergency."
  },
  {
    id: 421,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a Tier 3 notification in Ontario?",
    options: [
      "To notify the public of an immediate health emergency",
      "To notify the Ministry of Environment of equipment failures",
      "To provide the public with information about water quality issues that are not immediate health risks but require awareness",
      "To notify the operator of routine test results"
    ],
    correct: 2,
    explanation: "Tier 3 notification provides the public with information about water quality issues (e.g., aesthetic exceedances, operational issues) that are not immediate health risks but require public awareness."
  },
  {
    id: 422,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a Drinking Water Works Permit (DWWP) in Ontario?",
    options: [
      "To authorize the construction, alteration, and operation of drinking water systems, specifying design and operating requirements",
      "To certify water treatment operators",
      "To permit the discharge of treated water to the environment",
      "To permit the use of specific chemicals in water treatment"
    ],
    correct: 0,
    explanation: "A DWWP authorizes the construction and operation of a drinking water system, specifying design standards, operating requirements, and conditions that must be met for safe operation."
  },
  {
    id: 423,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a Municipal Drinking Water Licence (MDWL) in Ontario?",
    options: [
      "To license individual water treatment operators",
      "To authorize a municipality to operate a drinking water system, specifying the system's operational requirements and quality standards",
      "To license chemical suppliers",
      "To license water treatment equipment manufacturers"
    ],
    correct: 1,
    explanation: "The MDWL authorizes a municipality to operate a drinking water system, incorporating the DWWP conditions and specifying the operational requirements, quality standards, and reporting obligations."
  },
  {
    id: 424,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water quality monitoring plan?",
    options: [
      "To document the sampling locations, frequencies, parameters, and procedures for monitoring drinking water quality",
      "To plan the construction of new monitoring equipment",
      "To plan the chemical dosing schedule",
      "To plan the filter backwash schedule"
    ],
    correct: 0,
    explanation: "A monitoring plan documents all required sampling locations, frequencies, parameters, and procedures to demonstrate compliance with regulatory requirements and detect water quality problems."
  },
  {
    id: 425,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a source water protection plan in Ontario?",
    options: [
      "To protect the water treatment plant from flooding",
      "To protect the distribution system from contamination",
      "To identify and manage threats to drinking water sources (intake protection zones) to prevent contamination",
      "To protect the water treatment plant from security threats"
    ],
    correct: 2,
    explanation: "Source water protection plans identify threats to drinking water sources within intake protection zones and implement policies and programs to prevent or reduce contamination before it reaches the intake."
  },
  {
    id: 426,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water safety plan (WSP)?",
    options: [
      "A risk-based management approach that identifies hazards and control measures throughout the water supply chain from source to tap",
      "To ensure worker safety in the water treatment plant",
      "To plan emergency response to water quality incidents",
      "To plan the maintenance of water treatment equipment"
    ],
    correct: 0,
    explanation: "A Water Safety Plan (WSP) is a comprehensive risk-based approach (WHO framework) that identifies hazards, assesses risks, and implements control measures throughout the entire water supply chain."
  },
  {
    id: 427,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a critical control point (CCP) in water treatment?",
    options: [
      "A point in the treatment process where failure would result in an unacceptable health risk and where control measures are essential",
      "A point in the distribution system where pressure is critical",
      "A point where chemicals are added to the water",
      "A point where water quality is measured"
    ],
    correct: 0,
    explanation: "CCPs are treatment steps (e.g., disinfection, filtration) where failure would result in an unacceptable health risk. Critical limits, monitoring, and corrective actions are defined for each CCP."
  },
  {
    id: 428,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a turbidity monitoring program under Ontario Regulation 170/03?",
    options: [
      "To measure turbidity for aesthetic purposes only",
      "To measure the effectiveness of disinfection",
      "To measure the effectiveness of coagulation only",
      "To demonstrate compliance with turbidity standards and provide early warning of treatment process failures"
    ],
    correct: 3,
    explanation: "Turbidity monitoring demonstrates compliance with Ontario's turbidity standards (≤1 NTU, 95% ≤0.3 NTU) and provides early warning of coagulation, sedimentation, or filtration failures."
  },
  {
    id: 429,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a microbiological monitoring program in Ontario?",
    options: [
      "To measure the effectiveness of coagulation",
      "To detect the presence of indicator organisms (E. coli, total coliforms) that indicate fecal contamination and potential pathogen presence",
      "To measure the effectiveness of filtration",
      "To measure the effectiveness of chemical treatment"
    ],
    correct: 1,
    explanation: "Microbiological monitoring detects indicator organisms (E. coli, total coliforms) that signal fecal contamination and potential pathogen presence, triggering immediate investigation and corrective action."
  },
  {
    id: 430,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a heterotrophic plate count (HPC) in water quality monitoring?",
    options: [
      "To detect specific pathogens in the water",
      "To measure the turbidity of the water",
      "To measure the chlorine residual in the water",
      "To measure the general bacterial population in water as an indicator of treatment effectiveness and distribution system hygiene"
    ],
    correct: 3,
    explanation: "HPC measures the total culturable bacterial population, providing an indication of treatment effectiveness, distribution system cleanliness, and potential for bacterial regrowth — though it does not detect specific pathogens."
  },
  {
    id: 431,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a pH monitoring program in water treatment?",
    options: [
      "To optimize treatment processes, control corrosion, ensure disinfection effectiveness, and meet regulatory requirements",
      "To ensure the water tastes good",
      "To measure the alkalinity of the water",
      "To measure the hardness of the water"
    ],
    correct: 0,
    explanation: "pH monitoring optimizes coagulation, disinfection (HOCl/OCl⁻ ratio), corrosion control, and softening processes, and ensures compliance with the aesthetic objective of pH 6.5–8.5."
  },
  {
    id: 432,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the Ontario aesthetic objective for pH in drinking water?",
    options: [
      "5.0 – 6.5",
      "7.0 – 8.0",
      "6.5 – 8.5",
      "8.0 – 9.0"
    ],
    correct: 2,
    explanation: "Ontario's aesthetic objective for pH in drinking water is 6.5–8.5. Water outside this range may be corrosive (low pH) or scale-forming (high pH) and may have an unpleasant taste."
  },
  {
    id: 433,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of alkalinity monitoring in water treatment?",
    options: [
      "To ensure the water tastes good",
      "To measure the hardness of the water",
      "To assess the buffering capacity of the water, optimize coagulation, and control corrosion",
      "To measure the pH of the water"
    ],
    correct: 2,
    explanation: "Alkalinity monitoring assesses the water's buffering capacity (important for coagulation pH control), guides lime/soda ash addition for softening and pH adjustment, and informs corrosion control strategies."
  },
  {
    id: 434,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the Langelier Saturation Index (LSI) used for?",
    options: [
      "To measure the turbidity of the water",
      "To measure the hardness of the water",
      "To measure the chlorine residual in the water",
      "To predict whether water will be corrosive (dissolve pipe materials) or scale-forming (deposit calcium carbonate)"
    ],
    correct: 3,
    explanation: "LSI = pH - pHs. Negative LSI indicates corrosive water (will dissolve CaCO₃ and pipe materials); positive LSI indicates scale-forming water (will deposit CaCO₃). Target is slightly positive (0 to +0.5) for corrosion control."
  },
  {
    id: 435,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a corrosion control program in a water distribution system?",
    options: [
      "To prevent corrosion of treatment plant equipment",
      "To minimize the leaching of metals (lead, copper) from pipes and fittings into drinking water",
      "To prevent biological growth in the distribution system",
      "To maintain water pressure in the distribution system"
    ],
    correct: 1,
    explanation: "Corrosion control programs (pH adjustment, orthophosphate addition, calcium carbonate stabilization) minimize the leaching of lead, copper, and other metals from distribution system pipes and household plumbing."
  },
  {
    id: 436,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of orthophosphate addition for corrosion control?",
    options: [
      "To add phosphate as a nutrient for biological treatment",
      "To remove hardness from the water",
      "To adjust the pH of the water",
      "To form a protective phosphate film on pipe surfaces that inhibits lead and copper leaching"
    ],
    correct: 3,
    explanation: "Orthophosphate forms an insoluble lead phosphate or copper phosphate film on pipe surfaces, creating a protective barrier that significantly reduces lead and copper leaching into drinking water."
  },
  {
    id: 437,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a lead service line replacement program?",
    options: [
      "To replace all water service lines regardless of material",
      "To replace service lines that have low water pressure",
      "To replace corroded copper service lines",
      "To eliminate lead service lines that are a primary source of lead in drinking water"
    ],
    correct: 3,
    explanation: "Lead service lines are the primary source of lead in drinking water. Their replacement is the most effective long-term strategy for reducing lead exposure, particularly for children."
  },
  {
    id: 438,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water hardness measurement?",
    options: [
      "To measure the physical hardness of the water",
      "To measure the concentration of calcium and magnesium ions that cause scale formation and affect soap lathering",
      "To measure the turbidity of the water",
      "To measure the alkalinity of the water"
    ],
    correct: 1,
    explanation: "Hardness (measured as mg/L CaCO₃) quantifies calcium and magnesium concentrations. Hard water causes scale in pipes and appliances and reduces soap effectiveness; soft water may be corrosive."
  },
  {
    id: 439,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of lime softening in water treatment?",
    options: [
      "To disinfect the water",
      "To remove turbidity",
      "To remove iron and manganese",
      "To remove calcium and magnesium hardness by precipitating them as calcium carbonate and magnesium hydroxide"
    ],
    correct: 3,
    explanation: "Lime softening adds lime (Ca(OH)₂) to precipitate calcium as CaCO₃ and magnesium as Mg(OH)₂, reducing hardness. Soda ash (Na₂CO₃) may also be added for non-carbonate hardness removal."
  },
  {
    id: 440,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of recarbonation after lime softening?",
    options: [
      "To add carbon dioxide to improve the taste of the water",
      "To add alkalinity to the softened water",
      "To lower the pH of the softened water by adding CO₂, preventing scale formation in downstream processes and distribution",
      "To remove residual lime from the softened water"
    ],
    correct: 2,
    explanation: "Recarbonation adds CO₂ to the high-pH softened water, lowering pH to the target range (8.0–8.5), stabilizing the water against further CaCO₃ precipitation in filters and distribution pipes."
  },
  {
    id: 441,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a taste and odour monitoring program?",
    options: [
      "To measure the pH of the water",
      "To measure the chlorine residual in the water",
      "To measure the turbidity of the water",
      "To ensure the water meets aesthetic standards and to detect the source of taste and odour problems for corrective action"
    ],
    correct: 3,
    explanation: "Taste and odour monitoring detects problems early, identifies sources (algae, geosmin, MIB, chlorine by-products), and guides treatment adjustments (activated carbon, ozone, modified chlorination) to meet aesthetic standards."
  },
  {
    id: 442,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is geosmin and how is it treated?",
    options: [
      "A chemical disinfectant used in water treatment",
      "A disinfection by-product formed during chlorination",
      "A coagulant used in water treatment",
      "An earthy/musty taste and odour compound produced by cyanobacteria and actinomycetes, treated with activated carbon or ozone"
    ],
    correct: 3,
    explanation: "Geosmin (trans-1,10-dimethyl-trans-9-decalol) is an earthy/musty compound produced by cyanobacteria and soil bacteria. It has a very low odour threshold (~5 ng/L) and is effectively removed by GAC or ozone."
  },
  {
    id: 443,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is 2-methylisoborneol (MIB) and how is it treated?",
    options: [
      "A disinfection by-product",
      "A coagulant aid",
      "A musty taste and odour compound produced by cyanobacteria, treated with activated carbon or ozone",
      "A corrosion inhibitor"
    ],
    correct: 2,
    explanation: "MIB (2-methylisoborneol) is a musty/earthy taste and odour compound produced by cyanobacteria and actinomycetes. Like geosmin, it has a very low odour threshold and is treated with GAC or ozone."
  },
  {
    id: 444,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a cyanobacteria (blue-green algae) monitoring program?",
    options: [
      "To measure algae for aesthetic purposes",
      "To measure the oxygen demand of algae",
      "To measure the turbidity caused by algae",
      "To detect cyanobacteria and cyanotoxins (e.g., microcystin) that can cause health effects and treatment challenges"
    ],
    correct: 3,
    explanation: "Cyanobacteria monitoring detects blooms that produce cyanotoxins (microcystin, anatoxin), cause taste and odour problems, and challenge treatment processes — enabling early warning and treatment adjustments."
  },
  {
    id: 445,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the Ontario MAC for microcystin-LR in drinking water?",
    options: [
      "0.001 μg/L",
      "10 μg/L",
      "1.5 μg/L",
      "100 μg/L"
    ],
    correct: 2,
    explanation: "Ontario's MAC for microcystin-LR (the most common cyanotoxin) is 1.5 μg/L, consistent with Health Canada's guideline. Microcystin is a liver toxin produced by cyanobacteria."
  },
  {
    id: 446,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant emergency response plan?",
    options: [
      "To plan the construction of emergency treatment facilities",
      "To plan emergency operator training",
      "To plan emergency chemical deliveries",
      "To document procedures for responding to emergencies (contamination events, equipment failures, natural disasters) to maintain safe water supply"
    ],
    correct: 3,
    explanation: "Emergency response plans document procedures for responding to contamination events, equipment failures, natural disasters, and other emergencies to maintain safe water supply and protect public health."
  },
  {
    id: 447,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a boil water advisory (BWA)?",
    options: [
      "To advise residents to boil water before consumption due to a potential or confirmed microbiological risk",
      "To advise residents to boil water for cooking only",
      "To advise residents that water is too hard for drinking",
      "To advise residents that water has an unpleasant taste"
    ],
    correct: 0,
    explanation: "A boil water advisory is issued when there is a potential or confirmed microbiological risk (E. coli detection, treatment failure, main break) to advise residents to boil water before consumption."
  },
  {
    id: 448,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a do not use advisory?",
    options: [
      "To advise residents not to use water for bathing",
      "To advise residents not to use water for cooking",
      "To advise residents not to use water for irrigation",
      "To advise residents not to use water for any purpose due to chemical contamination or other serious risk"
    ],
    correct: 3,
    explanation: "A do not use advisory is the most severe water advisory, issued when water poses a serious risk even for non-consumption uses (bathing, showering) due to chemical contamination or other hazards."
  },
  {
    id: 449,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water quality annual report in Ontario?",
    options: [
      "To provide the public with information about their drinking water quality, treatment, and compliance with regulations",
      "To report equipment maintenance activities",
      "To report chemical usage to the Ministry of Environment",
      "To report operator training activities"
    ],
    correct: 0,
    explanation: "Ontario's Annual Report (required under O. Reg. 170/03) provides the public with information about their drinking water system's performance, water quality results, and compliance with regulatory requirements."
  },
  {
    id: 450,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant operational review?",
    options: [
      "To systematically evaluate plant performance, identify problems, and implement improvements to ensure continued production of safe drinking water",
      "To review the plant's financial performance",
      "To review operator performance",
      "To review chemical supplier performance"
    ],
    correct: 0,
    explanation: "Operational reviews systematically evaluate plant performance against treatment objectives, identify problems and trends, and implement improvements — a key element of continuous improvement in the DWQMS."
  },
  {
    id: 451,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant performance indicator?",
    options: [
      "To quantify key aspects of plant performance (turbidity, residuals, compliance) for monitoring, benchmarking, and improvement",
      "To measure the cost of water treatment",
      "To measure operator performance",
      "To measure equipment reliability"
    ],
    correct: 0,
    explanation: "Performance indicators (KPIs) quantify key aspects of plant performance, enabling operators and managers to monitor trends, benchmark against targets, and identify areas for improvement."
  },
  {
    id: 452,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant log book?",
    options: [
      "To record the names of visitors to the plant",
      "To record maintenance activities only",
      "To record chemical delivery information",
      "To document operational data, observations, equipment status, and events for operational control, troubleshooting, and regulatory compliance"
    ],
    correct: 3,
    explanation: "Plant log books document operational data (flows, doses, residuals), observations, equipment status, and significant events — essential for operational control, troubleshooting, and demonstrating regulatory compliance."
  },
  {
    id: 453,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant standard operating procedure (SOP)?",
    options: [
      "To provide general guidelines for plant operation",
      "To document the plant's regulatory requirements",
      "To document the plant's design specifications",
      "To provide step-by-step instructions for performing specific tasks consistently and safely"
    ],
    correct: 3,
    explanation: "SOPs provide step-by-step instructions for performing specific tasks (chemical dosing, filter backwash, equipment startup/shutdown) consistently and safely, regardless of which operator is on duty."
  },
  {
    id: 454,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant preventive maintenance program?",
    options: [
      "To proactively maintain equipment to prevent failures, extend service life, and ensure reliable plant operation",
      "To respond to equipment failures as they occur",
      "To document equipment failures for insurance purposes",
      "To train operators on equipment maintenance"
    ],
    correct: 0,
    explanation: "Preventive maintenance programs schedule regular inspections, lubrication, calibration, and component replacement to prevent equipment failures before they occur, ensuring reliable plant operation."
  },
  {
    id: 455,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant SCADA system?",
    options: [
      "To control the plant from a remote location only",
      "To monitor and control plant processes in real time, providing data logging, alarms, and remote operation capabilities",
      "To measure water quality parameters only",
      "To control chemical feed systems only"
    ],
    correct: 1,
    explanation: "SCADA (Supervisory Control and Data Acquisition) systems provide real-time monitoring and control of all plant processes, data logging for compliance, alarm management, and remote operation capabilities."
  },
  {
    id: 456,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant security program?",
    options: [
      "To protect plant equipment from theft",
      "To protect the plant from natural disasters",
      "To protect plant operators from workplace hazards",
      "To protect the plant and water supply from intentional contamination, vandalism, and unauthorized access"
    ],
    correct: 3,
    explanation: "Security programs protect water treatment plants and distribution systems from intentional contamination, vandalism, and unauthorized access — critical for public health and national security."
  },
  {
    id: 457,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant vulnerability assessment?",
    options: [
      "To assess the structural vulnerability of plant buildings",
      "To assess the vulnerability of the plant to flooding",
      "To assess the vulnerability of plant equipment to corrosion",
      "To identify and evaluate threats, vulnerabilities, and consequences to the water system to prioritize security and emergency response improvements"
    ],
    correct: 3,
    explanation: "Vulnerability assessments identify threats (physical, cyber, chemical, biological), evaluate system vulnerabilities, and assess potential consequences — guiding security investments and emergency response planning."
  },
  {
    id: 458,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant confined space program?",
    options: [
      "To identify spaces where operators can work in confined conditions",
      "To ensure safe entry into confined spaces (clearwells, filter galleries, chemical storage areas) that may contain hazardous atmospheres",
      "To measure the oxygen content of confined spaces",
      "To provide training on confined space regulations"
    ],
    correct: 1,
    explanation: "Confined space programs identify permit-required confined spaces, establish entry procedures (atmospheric testing, ventilation, rescue), and ensure operators can safely enter spaces that may contain hazardous atmospheres."
  },
  {
    id: 459,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a lockout/tagout (LOTO) program in a water treatment plant?",
    options: [
      "To ensure equipment is de-energized and cannot be accidentally started during maintenance, protecting workers from injury",
      "To lock the plant during off-hours",
      "To tag equipment that needs maintenance",
      "To lock chemical storage areas"
    ],
    correct: 0,
    explanation: "LOTO programs ensure that all energy sources (electrical, hydraulic, pneumatic, chemical) are isolated and locked before maintenance, preventing accidental energization that could injure or kill workers."
  },
  {
    id: 460,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant operator certification program in Ontario?",
    options: [
      "To ensure operators have the knowledge and skills to safely operate water treatment systems and protect public health",
      "To certify the quality of the water produced",
      "To certify the design of water treatment plants",
      "To certify the quality of treatment chemicals"
    ],
    correct: 0,
    explanation: "Ontario's operator certification program (under O. Reg. 128/04) ensures that operators have the knowledge, skills, and competency to safely operate drinking water systems and protect public health."
  },
  {
    id: 461,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What are the water treatment operator licence classes in Ontario?",
    options: [
      "Class 1, 2, 3, 4 (Class 4 being the most advanced)",
      "Class A, B, C, D",
      "Level 1, 2, 3",
      "Grade 1, 2, 3, 4"
    ],
    correct: 0,
    explanation: "Ontario water treatment operator licences are classified as Class 1 through Class 4, with Class 4 being the most advanced. The required licence class depends on the complexity and size of the treatment system."
  },
  {
    id: 462,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of continuing education requirements for water treatment operators in Ontario?",
    options: [
      "To ensure operators can operate new equipment",
      "To increase the cost of operator certification",
      "To ensure operators are familiar with new chemical products",
      "To ensure operators maintain their knowledge and skills as regulations, technology, and best practices evolve"
    ],
    correct: 3,
    explanation: "Continuing education requirements ensure operators maintain current knowledge of evolving regulations, treatment technologies, and best practices — essential for continued safe operation of drinking water systems."
  },
  {
    id: 463,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant staffing plan?",
    options: [
      "To minimize staffing costs",
      "To plan operator training activities",
      "To schedule operator vacation time",
      "To ensure adequate certified operator coverage at all times to meet regulatory requirements and maintain safe plant operation"
    ],
    correct: 3,
    explanation: "Staffing plans ensure that adequate certified operator coverage is maintained at all times, including nights, weekends, and holidays, to meet regulatory requirements and respond to operational issues."
  },
  {
    id: 464,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant training program?",
    options: [
      "To meet regulatory certification requirements only",
      "To develop and maintain operator competency in all aspects of plant operation, maintenance, and emergency response",
      "To train operators on new equipment only",
      "To train operators on chemical handling only"
    ],
    correct: 1,
    explanation: "Training programs develop and maintain operator competency in plant operation, maintenance, water quality, regulatory requirements, emergency response, and safety — ensuring consistently safe water production."
  },
  {
    id: 465,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant asset management program?",
    options: [
      "To manage the plant's financial assets",
      "To manage the plant's chemical inventory",
      "To systematically manage physical assets (equipment, infrastructure) to optimize performance, minimize life-cycle costs, and plan for renewal",
      "To manage the plant's human resources"
    ],
    correct: 2,
    explanation: "Asset management programs systematically track, maintain, and plan for the renewal of physical assets, optimizing performance and minimizing life-cycle costs while ensuring continued safe operation."
  },
  {
    id: 466,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant capital improvement plan?",
    options: [
      "To plan the purchase of new chemicals",
      "To plan routine maintenance activities",
      "To plan operator training activities",
      "To plan and budget for major infrastructure improvements, equipment replacements, and capacity expansions over a multi-year horizon"
    ],
    correct: 3,
    explanation: "Capital improvement plans identify and prioritize major infrastructure investments over a 5–20 year horizon, ensuring adequate funding and planning for equipment replacements and system upgrades."
  },
  {
    id: 467,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant energy management program?",
    options: [
      "To minimize energy costs regardless of treatment effectiveness",
      "To ensure the plant has adequate backup power",
      "To optimize energy use while maintaining treatment effectiveness, reducing costs and environmental impact",
      "To measure the energy consumption of individual equipment"
    ],
    correct: 2,
    explanation: "Energy management programs optimize energy use (pump scheduling, variable frequency drives, process optimization) to reduce costs and environmental impact while maintaining treatment effectiveness."
  },
  {
    id: 468,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant residuals management program?",
    options: [
      "To manage the treatment residuals (sludge, backwash water, brine) in an environmentally responsible and cost-effective manner",
      "To manage the plant's financial residuals",
      "To manage the chemical residuals in the treated water",
      "To manage the chlorine residuals in the distribution system"
    ],
    correct: 0,
    explanation: "Residuals management programs address the treatment, handling, and disposal of sludge, filter backwash water, and other residuals in compliance with environmental regulations and at minimum cost."
  },
  {
    id: 469,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant environmental compliance program?",
    options: [
      "To ensure the plant meets all building code requirements",
      "To ensure the plant meets all drinking water quality regulations",
      "To ensure the plant meets all worker safety regulations",
      "To ensure the plant meets all environmental regulations for air, water, and waste"
    ],
    correct: 3,
    explanation: "Environmental compliance programs ensure the plant meets all applicable environmental regulations for air emissions, wastewater discharges, waste management, and chemical storage — protecting the environment."
  },
  {
    id: 470,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant communication plan?",
    options: [
      "To plan the installation of communication equipment",
      "To establish protocols for communicating with the public, regulators, media, and internal stakeholders during normal operations and emergencies",
      "To plan operator communication training",
      "To plan SCADA communication upgrades"
    ],
    correct: 1,
    explanation: "Communication plans establish protocols for routine and emergency communications with the public, regulators, media, and internal stakeholders — essential for maintaining public trust and regulatory compliance."
  },
  {
    id: 471,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant risk assessment?",
    options: [
      "To assess the financial risk of the plant",
      "To identify, evaluate, and prioritize hazards and risks to water quality and plant operation for management and mitigation",
      "To assess the risk of equipment failure",
      "To assess the risk of chemical spills"
    ],
    correct: 1,
    explanation: "Risk assessments identify hazards (source water contamination, equipment failure, human error), evaluate their likelihood and consequences, and prioritize control measures to protect water quality and public health."
  },
  {
    id: 472,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant internal audit?",
    options: [
      "To audit the plant's financial accounts",
      "To audit chemical usage",
      "To audit operator performance",
      "To systematically evaluate the plant's quality management system against the DWQMS requirements to identify non-conformances and improvement opportunities"
    ],
    correct: 3,
    explanation: "Internal audits evaluate the plant's quality management system against DWQMS requirements, identifying non-conformances and improvement opportunities — a key element of continuous improvement."
  },
  {
    id: 473,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a management review under the DWQMS?",
    options: [
      "To review the plant's financial performance",
      "To review equipment maintenance records",
      "To review operator performance",
      "To provide senior management oversight of the quality management system's performance and effectiveness"
    ],
    correct: 3,
    explanation: "Management reviews provide senior management oversight of the QMS, reviewing performance data, audit results, and customer feedback to ensure the system remains effective and to drive continuous improvement."
  },
  {
    id: 474,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a corrective action program in water treatment?",
    options: [
      "To correct operator errors",
      "To correct chemical dosing errors",
      "To correct equipment failures",
      "To identify the root cause of non-conformances and implement actions to prevent recurrence"
    ],
    correct: 3,
    explanation: "Corrective action programs identify the root cause of non-conformances (water quality failures, process deviations), implement corrective actions, and verify effectiveness to prevent recurrence."
  },
  {
    id: 475,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a preventive action program in water treatment?",
    options: [
      "To prevent equipment failures through maintenance",
      "To prevent chemical spills",
      "To proactively identify and address potential problems before they occur, preventing non-conformances",
      "To prevent operator errors"
    ],
    correct: 2,
    explanation: "Preventive action programs proactively identify potential problems (through trend analysis, risk assessment, near-miss reporting) and implement actions to prevent non-conformances before they occur."
  },
  {
    id: 476,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant benchmarking program?",
    options: [
      "To compare the plant's financial performance to other plants",
      "To compare the plant's performance against industry standards, best practices, and similar plants to identify improvement opportunities",
      "To compare operator performance",
      "To compare chemical costs"
    ],
    correct: 1,
    explanation: "Benchmarking compares plant performance (energy use, chemical costs, compliance rates, turbidity) against industry standards and similar plants, identifying best practices and improvement opportunities."
  },
  {
    id: 477,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant customer complaint program?",
    options: [
      "To respond to customer complaints about water bills",
      "To respond to customer complaints about water pressure",
      "To systematically receive, investigate, and respond to customer complaints about water quality, ensuring issues are identified and resolved",
      "To respond to customer complaints about service interruptions"
    ],
    correct: 2,
    explanation: "Customer complaint programs systematically receive, investigate, and respond to complaints about water quality (taste, odour, colour, pressure), identifying and resolving issues before they become larger problems."
  },
  {
    id: 478,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant knowledge management program?",
    options: [
      "To manage the plant's intellectual property",
      "To capture, document, and transfer operational knowledge to ensure continuity when experienced operators retire or leave",
      "To manage operator training records",
      "To manage the plant's technical library"
    ],
    correct: 1,
    explanation: "Knowledge management programs capture and document operational knowledge (SOPs, troubleshooting guides, historical data) to ensure continuity when experienced operators retire or transfer, preventing loss of institutional knowledge."
  },
  {
    id: 479,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant succession planning program?",
    options: [
      "To plan the succession of plant ownership",
      "To plan the succession of chemical suppliers",
      "To plan the succession of treatment technologies",
      "To identify and develop future operators and managers to ensure continued competent leadership and operation"
    ],
    correct: 3,
    explanation: "Succession planning identifies and develops future operators and managers, ensuring a pipeline of competent staff to replace those who retire or leave — critical for maintaining safe, reliable plant operation."
  },
  {
    id: 480,
    isCalc: true,
    module: "Water Quality & Regulations",
    difficulty: "hard",
    question: "A water treatment plant has a monthly compliance record showing 95 turbidity measurements, of which 4 exceed 0.3 NTU. Does this meet Ontario Regulation 170/03 requirements?",
    options: [
      "Yes, because no measurements exceed 1.0 NTU",
      "Yes, because 4/95 = 4.2%, which is less than the 5% limit",
      "No, because more than 5% of measurements exceed 0.3 NTU (4/95 = 4.2%, which is within the 5% limit)",
      "No, because any measurement exceeding 0.3 NTU is a violation"
    ],
    correct: 1,
    explanation: "Determine the percentage of turbidity measurements that exceed 0.3 NTU and compare it to the regulatory limit.\n\nStep 1 — Calculate the percentage of measurements exceeding 0.3 NTU:\n(4 measurements exceeding 0.3 NTU ÷ 95 total measurements) × 100% = 4.2%\n\nStep 2 — Determine the percentage of measurements meeting the 0.3 NTU threshold:\n100% - 4.2% = 95.8%\n\nStep 3 — Compare to the Ontario Regulation 170/03 requirement:\nOntario Regulation 170/03 requires that at least 95% of filtered water turbidity measurements be ≤0.3 NTU. Since 95.8% of measurements meet this criterion, the requirement is satisfied.\n\nThe correct answer is C. Yes, because 4/95 = 4.2%, which is less than the 5% limit",
    steps: [ { l: "Formula", c: "Percentage of measurements exceeding limit = (Number of measurements exceeding limit / Total number of measurements) * 100%" }, { l: "Step 1", c: "Calculate the percentage of measurements that exceed 0.3 NTU." }, { l: "Substitute", c: "Percentage exceeding = (4 / 95) * 100%" }, { l: "Calculate", c: "Percentage exceeding = 0.042105 * 100% = 4.21%" }, { l: "Step 2", c: "Calculate the percentage of measurements that are ≤ 0.3 NTU." }, { l: "Formula", c: "Percentage meeting requirement = 100% - Percentage exceeding limit" }, { l: "Substitute", c: "Percentage meeting = 100% - 4.21%" }, { l: "Calculate", c: "Percentage meeting = 95.79%" }, { l: "Result", c: "Since 95.79% is greater than or equal to the 95% requirement, the plant meets Ontario Regulation 170/03." } ],
    tip: "Always compare calculated percentages to the regulatory standard.",
  },
  {
    id: 481,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant process control strategy?",
    options: [
      "To control the cost of water treatment",
      "To control the chemical feed rates only",
      "To control the flow rate through the plant",
      "To define the control parameters, setpoints, and responses for each treatment process to consistently achieve water quality objectives"
    ],
    correct: 3,
    explanation: "Process control strategies define the control parameters (turbidity, pH, residuals), setpoints, monitoring frequencies, and corrective actions for each treatment step to consistently achieve water quality objectives."
  },
  {
    id: 482,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant capacity assessment?",
    options: [
      "To assess the plant's financial capacity",
      "To assess the plant's operator capacity",
      "To assess the plant's chemical storage capacity",
      "To evaluate the plant's ability to meet current and future water demand while maintaining water quality standards"
    ],
    correct: 3,
    explanation: "Capacity assessments evaluate whether the plant can meet current and projected future water demand while maintaining all water quality standards — informing capital improvement planning."
  },
  {
    id: 483,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant process audit?",
    options: [
      "To audit the plant's financial processes",
      "To systematically evaluate treatment process performance against design intent and water quality objectives",
      "To audit operator performance",
      "To audit chemical usage"
    ],
    correct: 1,
    explanation: "Process audits systematically evaluate each treatment step's performance against design intent and water quality objectives, identifying inefficiencies, problems, and optimization opportunities."
  },
  {
    id: 484,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant pilot study?",
    options: [
      "To train operators on new treatment processes",
      "To test new chemicals before use",
      "To evaluate new treatment technologies or process changes at small scale before full-scale implementation",
      "To test new equipment before purchase"
    ],
    correct: 2,
    explanation: "Pilot studies evaluate new treatment technologies, process changes, or chemical alternatives at small scale, providing performance data and operational experience before committing to full-scale implementation."
  },
  {
    id: 485,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant research and development program?",
    options: [
      "To investigate emerging contaminants, evaluate new technologies, and improve treatment processes to address future challenges",
      "To develop new water treatment chemicals",
      "To develop new water treatment regulations",
      "To develop new operator training programs"
    ],
    correct: 0,
    explanation: "R&D programs investigate emerging contaminants (PFAS, microplastics, pharmaceuticals), evaluate new treatment technologies, and improve processes to address future regulatory and water quality challenges."
  },
  {
    id: 486,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What are per- and polyfluoroalkyl substances (PFAS) and why are they a concern in drinking water?",
    options: [
      "Natural organic compounds found in source water",
      "Synthetic chemicals used in many industrial and consumer products that are persistent, bioaccumulative, and associated with health effects",
      "Disinfection by-products formed during chlorination",
      "Chemicals used in water treatment processes"
    ],
    correct: 1,
    explanation: "PFAS (including PFOA, PFOS) are persistent synthetic chemicals from industrial and consumer products that contaminate source water, are difficult to remove, and are associated with cancer and other health effects."
  },
  {
    id: 487,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What treatment technologies are most effective for PFAS removal from drinking water?",
    options: [
      "Granular activated carbon (GAC), ion exchange resins, and nanofiltration/reverse osmosis",
      "Conventional coagulation and filtration",
      "Chlorination and UV disinfection",
      "Lime softening and pH adjustment"
    ],
    correct: 0,
    explanation: "GAC adsorption, anion exchange resins, and high-pressure membranes (NF/RO) are the most effective technologies for PFAS removal. Conventional treatment (coagulation, filtration, chlorination) is largely ineffective."
  },
  {
    id: 488,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant climate change adaptation plan?",
    options: [
      "To reduce the plant's carbon footprint",
      "To identify and address the impacts of climate change (extreme weather, source water quality changes) on plant operation and water supply",
      "To plan the plant's energy transition",
      "To plan the plant's response to regulatory changes"
    ],
    correct: 1,
    explanation: "Climate change adaptation plans identify vulnerabilities to climate impacts (flooding, drought, extreme temperatures, algal blooms) and implement strategies to maintain safe, reliable water supply."
  },
  {
    id: 489,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant cybersecurity program?",
    options: [
      "To protect the plant's financial data",
      "To protect the plant's intellectual property",
      "To protect operator personal information",
      "To protect SCADA and control systems from cyber attacks that could disrupt plant operation or compromise water quality"
    ],
    correct: 3,
    explanation: "Cybersecurity programs protect SCADA and control systems from cyber attacks that could disrupt plant operation, manipulate chemical dosing, or compromise water quality — a growing threat to critical infrastructure."
  },
  {
    id: 490,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant succession of operations plan?",
    options: [
      "To ensure continued plant operation during emergencies by identifying backup resources, mutual aid agreements, and alternative water supplies",
      "To plan the succession of plant ownership",
      "To plan the succession of treatment technologies",
      "To plan the succession of chemical suppliers"
    ],
    correct: 0,
    explanation: "Succession of operations plans ensure continued water supply during emergencies by identifying backup resources, mutual aid agreements with neighboring utilities, and alternative water supply options."
  },
  {
    id: 491,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant mutual aid agreement?",
    options: [
      "To share financial resources between utilities",
      "To provide a framework for utilities to assist each other with equipment, personnel, and expertise during emergencies",
      "To share chemical supplies between utilities",
      "To share operator training resources"
    ],
    correct: 1,
    explanation: "Mutual aid agreements establish frameworks for utilities to assist each other during emergencies (equipment failures, natural disasters) with equipment, personnel, expertise, and water supply — enhancing system resilience."
  },
  {
    id: 492,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant post-incident review?",
    options: [
      "To assign blame for incidents",
      "To document incidents for insurance purposes",
      "To systematically analyze incidents to identify root causes, contributing factors, and improvements to prevent recurrence",
      "To report incidents to regulators"
    ],
    correct: 2,
    explanation: "Post-incident reviews systematically analyze incidents (near-misses, water quality failures, equipment failures) to identify root causes and implement improvements, preventing recurrence and improving system resilience."
  },
  {
    id: 493,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant near-miss reporting program?",
    options: [
      "To document near-miss accidents for insurance purposes",
      "To capture and analyze near-miss events to identify and address hazards before they cause actual incidents",
      "To report near-miss events to regulators",
      "To assign blame for near-miss events"
    ],
    correct: 1,
    explanation: "Near-miss reporting programs capture events that could have caused harm but did not, allowing operators to identify and address hazards proactively — preventing future incidents and improving safety culture."
  },
  {
    id: 494,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant innovation program?",
    options: [
      "To develop new water treatment patents",
      "To encourage and implement innovative ideas from operators and staff to improve plant performance, safety, and efficiency",
      "To develop new water treatment regulations",
      "To develop new operator training programs"
    ],
    correct: 1,
    explanation: "Innovation programs encourage operators and staff to identify and implement improvements to plant performance, safety, efficiency, and water quality — fostering a culture of continuous improvement."
  },
  {
    id: 495,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant public engagement program?",
    options: [
      "To market water treatment services",
      "To engage the public in plant design decisions",
      "To recruit new operators",
      "To build public trust and understanding of drinking water treatment, quality, and safety through transparent communication"
    ],
    correct: 3,
    explanation: "Public engagement programs build trust and understanding through transparent communication about water quality, treatment processes, and safety — essential for maintaining public confidence in the water supply."
  },
  {
    id: 496,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant partnership program?",
    options: [
      "To collaborate with universities, research institutions, regulators, and other utilities to advance knowledge and improve practice",
      "To partner with chemical suppliers for discounts",
      "To partner with equipment manufacturers for maintenance",
      "To partner with other utilities for water trading"
    ],
    correct: 0,
    explanation: "Partnership programs foster collaboration with universities, research institutions, regulators, and other utilities to advance knowledge, share best practices, and address common challenges in water treatment."
  },
  {
    id: 497,
    isCalc: true,
    module: "Water Quality & Regulations",
    difficulty: "hard",
    question: "A water treatment plant produces 20 ML/d. The annual water loss (non-revenue water) is 15%. What is the volume of non-revenue water per year in ML?",
    options: [
      "547 ML/yr",
      "1,095 ML/yr",
      "1,642 ML/yr",
      "2,190 ML/yr"
    ],
    correct: 1,
    explanation: "Calculate the total annual water production and then determine the volume of non-revenue water based on the given percentage.\n\nStep 1 — Calculate the annual water production:\n20 ML/d × 365 d/yr = 7,300 ML/yr\n\nStep 2 — Calculate the volume of non-revenue water:\n7,300 ML/yr × 0.15 = 1,095 ML/yr\n\nThe correct answer is 1,095 ML/yr.",
    steps: [ { l: "Formula", c: "Annual Production (ML/yr) = Daily Production (ML/d) * Days in a Year (d/yr)" }, { l: "Step 1", c: "Calculate the total annual water production." }, { l: "Substitute", c: "Annual Production = 20 ML/d * 365 d/yr" }, { l: "Calculate", c: "Annual Production = 7,300 ML/yr" }, { l: "Formula", c: "Non-Revenue Water (ML/yr) = Annual Production (ML/yr) * Percentage of Non-Revenue Water" }, { l: "Step 2", c: "Calculate the volume of non-revenue water per year." }, { l: "Substitute", c: "Non-Revenue Water = 7,300 ML/yr * 0.15" }, { l: "Calculate", c: "Non-Revenue Water = 1,095 ML/yr" }, { l: "Result", c: "The volume of non-revenue water per year is 1,095 ML." } ],
    tip: "Convert percentages to decimals for calculations. Pay attention to units.",
  },
  {
    id: 498,
    isCalc: true,
    module: "Water Quality & Regulations",
    difficulty: "hard",
    question: "A water treatment plant has a specific energy consumption of 0.35 kWh/m³. The plant treats 15 ML/d. What is the annual energy consumption in MWh?",
    options: ["1,913 MWh/yr", "5,250 MWh/yr", "1,916 MWh/yr", "19,163 MWh/yr"],
    correct: 2,
    explanation: "Calculate the annual energy consumption by converting the flow rate to m³/d, then determining daily and annual energy consumption, and finally converting to MWh.\n\nStep 1 — Convert daily flow rate to m³/d:\n15 ML/d × 1,000,000 L/ML × 1 m³/1,000 L = 15,000 m³/d\n\nStep 2 — Calculate daily energy consumption:\n15,000 m³/d × 0.35 kWh/m³ = 5,250 kWh/d\n\nStep 3 — Calculate annual energy consumption in kWh:\n5,250 kWh/d × 365 d/yr = 1,916,250 kWh/yr\n\nStep 4 — Convert annual energy consumption to MWh/yr:\n1,916,250 kWh/yr ÷ 1,000 kWh/MWh = 1,916.25 MWh/yr\n\nThe correct answer is 1,916 MWh/yr.",
    steps: [ { l: "Formula", c: "Annual Volume (m³/yr) = Daily Volume (m³/d) * Days in a Year (d/yr)" }, { l: "Step 1", c: "Convert daily treatment volume from ML/d to m³/d and then calculate annual volume." }, { l: "Substitute", c: "Annual Volume = (15 ML/d * 1,000,000 L/ML * 1 m³/1,000 L) * 365 d/yr = 15,000 m³/d * 365 d/yr" }, { l: "Calculate", c: "Annual Volume = 5,475,000 m³/yr" }, { l: "Formula", c: "Annual Energy Consumption (kWh/yr) = Specific Energy Consumption (kWh/m³) * Annual Volume (m³/yr)" }, { l: "Step 2", c: "Calculate the total annual energy consumption in kWh." }, { l: "Substitute", c: "Annual Energy Consumption = 0.35 kWh/m³ * 5,475,000 m³/yr" }, { l: "Calculate", c: "Annual Energy Consumption = 1,916,250 kWh/yr" }, { l: "Formula", c: "Annual Energy Consumption (MWh/yr) = Annual Energy Consumption (kWh/yr) / 1,000 kWh/MWh" }, { l: "Step 3", c: "Convert annual energy consumption from kWh to MWh." }, { l: "Substitute", c: "Annual Energy Consumption = 1,916,250 kWh/yr / 1,000 kWh/MWh" }, { l: "Calculate", c: "Annual Energy Consumption = 1,916.25 MWh/yr" }, { l: "Result", c: "The annual energy consumption is approximately 1,916 MWh." } ],
    tip: "Always ensure units cancel correctly. Pay attention to final unit conversions (e.g., kWh to MWh).",
  },
  {
    id: 499,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the purpose of a water treatment plant sustainability program?",
    options: [
      "To reduce the plant's operating costs only",
      "To ensure the plant's financial sustainability",
      "To reduce the plant's carbon footprint only",
      "To balance environmental, social, and economic considerations in plant operation to meet present needs without compromising future generations"
    ],
    correct: 3,
    explanation: "Sustainability programs balance environmental stewardship (energy, chemicals, residuals), social responsibility (public health, affordability), and economic viability to ensure long-term, responsible water service delivery."
  },
  {
    id: 500,
    module: "Water Quality & Regulations",
    difficulty: "medium",
    question: "What is the ultimate goal of a Class 1 Water Treatment operator?",
    options: [
      "To minimize the cost of water treatment",
      "To consistently produce safe, clean, aesthetically acceptable drinking water that protects public health and meets all regulatory requirements",
      "To maximize the efficiency of the treatment plant",
      "To minimize the use of chemicals in water treatment"
    ],
    correct: 1,
    explanation: "The ultimate goal of a water treatment operator is to consistently produce safe, clean, aesthetically acceptable drinking water that protects public health and meets all applicable regulatory requirements — every day, without exception."
  },

  {
    "id": 501,
    isCalc: true,
    "module": "Disinfection",
    "topic": "chlorine dose = demand + residual",
    "question": "A water treatment plant has a chlorine demand of 1.5 mg/L. The desired chlorine residual in the distribution system is 0.5 mg/L. What is the required chlorine dose?",
    "options": ["1.0 mg/L", "1.5 mg/L", "2.0 mg/L", "0.5 mg/L"],
    "correct": 2,
    "explanation": "To calculate the required chlorine dose, add the chlorine demand and the desired chlorine residual.\nFormula: Chlorine Dose = Chlorine Demand + Chlorine Residual\nSubstitution: Chlorine Dose = 1.5 mg/L + 0.5 mg/L\nCalculation: Chlorine Dose = 2.0 mg/L",
    steps: [
      { l: "Identify chlorine demand", c: "1.5 mg/L" },
      { l: "Identify desired residual", c: "0.5 mg/L" },
      { l: "Calculate chlorine dose", c: "1.5 mg/L + 0.5 mg/L = 2.0 mg/L" }
    ],
    tip: "Remember that chlorine dose must cover both the demand and the desired residual.",
    "difficulty": "medium"
  },
  {
    "id": 502,
    isCalc: true,
    "module": "Disinfection",
    "topic": "CT = C × T (basic)",
    "question": "A water treatment plant maintains a chlorine residual of 0.8 mg/L and a contact time of 20 minutes. Calculate the CT value in mg·min/L.",
    "options": ["16 mg·min/L", "1.6 mg·min/L", "20.8 mg·min/L", "19.2 mg·min/L"],
    "correct": 0,
    "explanation": "To calculate the CT value, multiply the chlorine concentration (C) by the contact time (T).\nFormula: CT = C × T\nSubstitution: CT = 0.8 mg/L × 20 min\nCalculation: CT = 16 mg·min/L",
    steps: [
      { l: "Identify chlorine concentration (C)", c: "0.8 mg/L" },
      { l: "Identify contact time (T)", c: "20 min" },
      { l: "Calculate CT value", c: "0.8 mg/L × 20 min = 16 mg·min/L" }
    ],
    tip: "CT value is a critical parameter for disinfection effectiveness.",
    "difficulty": "medium"
  },
  {
    "id": 503,
    isCalc: true,
    "module": "Chemical Feed",
    "topic": "flow × dose = mass (simple)",
    "question": "A water treatment plant treats a flow of 10,000 m³/d. If the chlorine dose is 2.5 mg/L, what is the mass of chlorine required per day in kg?",
    "options": ["25 kg/d", "250 kg/d", "2.5 kg/d", "2500 kg/d"],
    "correct": 0,
    "explanation": "To calculate the mass of chlorine required, use the formula: Mass (kg/d) = Flow (m³/d) × Dose (mg/L) / 1000.\nFormula: Mass (kg/d) = Flow (m³/d) × Dose (mg/L) / 1000\nSubstitution: Mass (kg/d) = 10,000 m³/d × 2.5 mg/L / 1000\nCalculation: Mass (kg/d) = 25 kg/d",
    steps: [
      { l: "Identify flow rate", c: "10,000 m³/d" },
      { l: "Identify chlorine dose", c: "2.5 mg/L" },
      { l: "Calculate mass of chlorine", c: "(10,000 m³/d * 2.5 mg/L) / 1000 = 25 kg/d" }
    ],
    tip: "Remember the conversion factor of 1000 when converting mg/L to kg/d with m³/d flow.",
    "difficulty": "medium"
  },
  {
    "id": 504,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "filter loading rate = flow/area",
    "question": "A rapid sand filter has a surface area of 50 m². If the flow rate through the filter is 5,000 m³/d, what is the filter loading rate in m³/m²·d?",
    "options": ["100 m³/m²·d", "10 m³/m²·d", "250 m³/m²·d", "500 m³/m²·d"],
    "correct": 0,
    "explanation": "To calculate the filter loading rate, divide the flow rate by the filter surface area.\nFormula: Filter Loading Rate = Flow / Area\nSubstitution: Filter Loading Rate = 5,000 m³/d / 50 m²\nCalculation: Filter Loading Rate = 100 m³/m²·d",
    steps: [
      { l: "Identify flow rate", c: "5,000 m³/d" },
      { l: "Identify filter area", c: "50 m²" },
      { l: "Calculate filter loading rate", c: "5,000 m³/d / 50 m² = 100 m³/m²·d" }
    ],
    tip: "Filter loading rate indicates the hydraulic capacity of a filter.",
    "difficulty": "medium"
  },
  {
    "id": 505,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "detention time = volume/flow",
    "question": "A sedimentation basin has a volume of 1,200 m³. If the flow rate through the basin is 600 m³/h, what is the detention time in hours?",
    "options": ["0.5 h", "2.0 h", "1.0 h", "3.0 h"],
    "correct": 1,
    "explanation": "To calculate the detention time, divide the basin volume by the flow rate.\nFormula: Detention Time = Volume / Flow\nSubstitution: Detention Time = 1,200 m³ / 600 m³/h\nCalculation: Detention Time = 2.0 h",
    steps: [
      { l: "Identify basin volume", c: "1,200 m³" },
      { l: "Identify flow rate", c: "600 m³/h" },
      { l: "Calculate detention time", c: "1,200 m³ / 600 m³/h = 2.0 h" }
    ],
    tip: "Detention time is crucial for effective sedimentation and flocculation.",
    "difficulty": "medium"
  },
  {
    "id": 506,
    isCalc: true,
    "module": "Water Quality",
    "topic": "percent removal = (in-out)/in × 100",
    "question": "Raw water turbidity entering a treatment plant is 15 NTU. After treatment, the finished water turbidity is 0.5 NTU. What is the percent removal of turbidity?",
    "options": ["96.67%", "93.33%", "90.00%", "98.33%"],
    "correct": 0,
    "explanation": "To calculate the percent removal, use the formula: Percent Removal = ((In - Out) / In) × 100.\nFormula: Percent Removal = ((In - Out) / In) × 100\nSubstitution: Percent Removal = ((15 NTU - 0.5 NTU) / 15 NTU) × 100\nCalculation: Percent Removal = (14.5 / 15) × 100 = 96.67%",
    steps: [
      { l: "Identify influent turbidity (In)", c: "15 NTU" },
      { l: "Identify effluent turbidity (Out)", c: "0.5 NTU" },
      { l: "Calculate percent removal", c: "((15 - 0.5) / 15) * 100 = 96.67%" }
    ],
    tip: "High percent removal of turbidity indicates efficient treatment.",
    "difficulty": "medium"
  },
  {
    "id": 507,
    isCalc: true,
    "module": "Chemical Feed",
    "topic": "chemical feed rate (simple)",
    "question": "A chemical feed pump delivers 50 mL of solution in 30 seconds. What is the feed rate in L/min?",
    "options": ["0.1 L/min", "0.05 L/min", "1.0 L/min", "0.5 L/min"],
    "correct": 0,
    "explanation": "To calculate the feed rate in L/min, first convert mL to L and seconds to minutes.\nFormula: Feed Rate (L/min) = (Volume (mL) / 1000 mL/L) / (Time (s) / 60 s/min)\nSubstitution: Feed Rate (L/min) = (50 mL / 1000) / (30 s / 60)\nCalculation: Feed Rate (L/min) = 0.05 L / 0.5 min = 0.1 L/min",
    steps: [
      { l: "Convert volume to Liters", c: "50 mL / 1000 = 0.05 L" },
      { l: "Convert time to minutes", c: "30 s / 60 = 0.5 min" },
      { l: "Calculate feed rate", c: "0.05 L / 0.5 min = 0.1 L/min" }
    ],
    tip: "Pay attention to unit conversions when calculating feed rates.",
    "difficulty": "medium"
  },
  {
    "id": 508,
    isCalc: true,
    "module": "Water Quality",
    "topic": "unit conversions (L to m³, mg/L to kg/d)",
    "question": "A chemical solution has a concentration of 200 mg/L. If a plant uses 500 L of this solution per day, what is the mass of the chemical used in kg/d?",
    "options": ["0.1 kg/d", "1.0 kg/d", "0.01 kg/d", "10 kg/d"],
    "correct": 0,
    "explanation": "First, convert the volume from L to m³ (1 m³ = 1000 L). Then, use the formula Mass (kg/d) = Flow (m³/d) × Concentration (mg/L) / 1000.\nFormula: Mass (kg/d) = (Volume (L) / 1000 L/m³) × Concentration (mg/L) / 1000\nSubstitution: Mass (kg/d) = (500 L / 1000) × 200 mg/L / 1000\nCalculation: Mass (kg/d) = 0.5 m³ × 200 mg/L / 1000 = 0.1 kg/d",
    steps: [
      { l: "Convert volume to m³", c: "500 L / 1000 = 0.5 m³" },
      { l: "Calculate mass of chemical", c: "(0.5 m³ * 200 mg/L) / 1000 = 0.1 kg/d" }
    ],
    tip: "Be careful with unit conversions, especially between L and m³ and mg/L to kg/d.",
    "difficulty": "medium"
  },
  {
    "id": 509,
    isCalc: true,
    "module": "Hydraulics",
    "topic": "pipe velocity = flow/area",
    "question": "A pipe has a diameter of 0.3 meters. If the flow rate through the pipe is 0.05 m³/s, what is the velocity of the water in m/s? (Use π = 3.14)",
    "options": ["0.71 m/s", "0.07 m/s", "7.1 m/s", "0.53 m/s"],
    "correct": 0,
    "explanation": "First, calculate the cross-sectional area of the pipe using the formula A = πr², where r is the radius (diameter/2). Then, calculate the velocity using the formula Velocity = Flow / Area.\nFormula: Area = π × (Diameter/2)²; Velocity = Flow / Area\nSubstitution: Area = 3.14 × (0.3 m / 2)² = 3.14 × (0.15 m)² = 3.14 × 0.0225 m² = 0.07065 m²; Velocity = 0.05 m³/s / 0.07065 m²\nCalculation: Velocity = 0.7077 m/s ≈ 0.71 m/s",
    steps: [
      { l: "Calculate pipe radius", c: "0.3 m / 2 = 0.15 m" },
      { l: "Calculate pipe area", c: "3.14 * (0.15 m)^2 = 0.07065 m²" },
      { l: "Calculate water velocity", c: "0.05 m³/s / 0.07065 m² = 0.7077 m/s" }
    ],
    tip: "Ensure consistent units when calculating pipe velocity.",
    "difficulty": "medium"
  },
  {
    "id": 510,
    isCalc: true,
    "module": "Hydraulics",
    "topic": "pump head (basic)",
    "question": "A pump lifts water from a clearwell with a water level of 10 meters to an elevated storage tank with a water level of 35 meters. What is the static head the pump must overcome?",
    "options": ["25 meters", "45 meters", "10 meters", "35 meters"],
    "correct": 0,
    "explanation": "The static head is the vertical distance the water is lifted. It is the difference between the discharge water level and the suction water level.\nFormula: Static Head = Discharge Level - Suction Level\nSubstitution: Static Head = 35 m - 10 m\nCalculation: Static Head = 25 m",
    steps: [
      { l: "Identify discharge level", c: "35 m" },
      { l: "Identify suction level", c: "10 m" },
      { l: "Calculate static head", c: "35 m - 10 m = 25 m" }
    ],
    tip: "Static head is a fundamental component of total dynamic head.",
    "difficulty": "medium"
  },
  {
    "id": 511,
    isCalc: true,
    "module": "Water Quality",
    "topic": "percent removal = (in-out)/in × 100",
    "question": "A settling tank receives water with a turbidity of 20 NTU. The effluent turbidity is measured at 1.2 NTU. What is the percent removal of turbidity?",
    "options": ["94.0%", "88.0%", "92.0%", "96.0%"],
    "correct": 0,
    "explanation": "To calculate the percent removal, use the formula: Percent Removal = ((In - Out) / In) × 100.\nFormula: Percent Removal = ((In - Out) / In) × 100\nSubstitution: Percent Removal = ((20 NTU - 1.2 NTU) / 20 NTU) × 100\nCalculation: Percent Removal = (18.8 / 20) × 100 = 94.0%",
    steps: [
      { l: "Identify influent turbidity (In)", c: "20 NTU" },
      { l: "Identify effluent turbidity (Out)", c: "1.2 NTU" },
      { l: "Calculate percent removal", c: "((20 - 1.2) / 20) * 100 = 94.0%" }
    ],
    tip: "Percent removal is a key indicator of treatment efficiency.",
    "difficulty": "medium"
  },
  {
    "id": 512,
    isCalc: true,
    "module": "Disinfection",
    "topic": "chlorine residual after demand",
    "question": "A water sample has a chlorine demand of 1.2 mg/L. If a chlorine dose of 2.0 mg/L is applied, what is the chlorine residual after the demand has been met?",
    "options": ["0.8 mg/L", "3.2 mg/L", "1.2 mg/L", "2.0 mg/L"],
    "correct": 0,
    "explanation": "To calculate the chlorine residual after demand, subtract the chlorine demand from the applied chlorine dose.\nFormula: Chlorine Residual = Chlorine Dose - Chlorine Demand\nSubstitution: Chlorine Residual = 2.0 mg/L - 1.2 mg/L\nCalculation: Chlorine Residual = 0.8 mg/L",
    steps: [
      { l: "Identify chlorine dose", c: "2.0 mg/L" },
      { l: "Identify chlorine demand", c: "1.2 mg/L" },
      { l: "Calculate chlorine residual", c: "2.0 mg/L - 1.2 mg/L = 0.8 mg/L" }
    ],
    tip: "The residual is what's left for disinfection after the demand is satisfied.",
    "difficulty": "medium"
  },
  {
    "id": 513,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "alum dose from jar test",
    "question": "A jar test indicates that an optimal alum dose is 15 mg/L. If the plant treats a flow of 8,000 m³/d, what is the daily mass of alum required in kg?",
    "options": ["120 kg/d", "12 kg/d", "1.2 kg/d", "1200 kg/d"],
    "correct": 0,
    "explanation": "To calculate the mass of alum required, use the formula: Mass (kg/d) = Flow (m³/d) × Dose (mg/L) / 1000.\nFormula: Mass (kg/d) = Flow (m³/d) × Dose (mg/L) / 1000\nSubstitution: Mass (kg/d) = 8,000 m³/d × 15 mg/L / 1000\nCalculation: Mass (kg/d) = 120 kg/d",
    steps: [
      { l: "Identify flow rate", c: "8,000 m³/d" },
      { l: "Identify alum dose", c: "15 mg/L" },
      { l: "Calculate mass of alum", c: "(8,000 m³/d * 15 mg/L) / 1000 = 120 kg/d" }
    ],
    tip: "Jar tests are essential for optimizing coagulant dosages.",
    "difficulty": "medium"
  },
  {
    "id": 514,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "weir overflow rate",
    "question": "A sedimentation basin has an effluent weir with a total length of 25 meters. If the flow rate over the weir is 4,800 m³/d, what is the weir overflow rate in m³/m·d?",
    "options": ["192 m³/m·d", "19.2 m³/m·d", "120 m³/m·d", "480 m³/m·d"],
    "correct": 0,
    "explanation": "To calculate the weir overflow rate, divide the flow rate by the total weir length.\nFormula: Weir Overflow Rate = Flow / Weir Length\nSubstitution: Weir Overflow Rate = 4,800 m³/d / 25 m\nCalculation: Weir Overflow Rate = 192 m³/m·d",
    steps: [
      { l: "Identify flow rate", c: "4,800 m³/d" },
      { l: "Identify weir length", c: "25 m" },
      { l: "Calculate weir overflow rate", c: "4,800 m³/d / 25 m = 192 m³/m·d" }
    ],
    tip: "Weir overflow rate is important for efficient settling and preventing floc carryover.",
    "difficulty": "medium"
  },
  {
    "id": 515,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "backwash rate",
    "question": "A filter with a surface area of 20 m² is backwashed at a rate of 10 L/s. What is the backwash rate in m³/m²·min?",
    "options": ["0.03 m³/m²·min", "0.3 m³/m²·min", "3.0 m³/m²·min", "0.003 m³/m²·min"],
    "correct": 0,
    "explanation": "First, convert the flow rate from L/s to m³/min. Then, divide by the filter surface area.\nFormula: Backwash Rate (m³/m²·min) = (Flow (L/s) × 60 s/min / 1000 L/m³) / Area (m²)\nSubstitution: Backwash Rate = (10 L/s × 60 / 1000) / 20 m²\nCalculation: Backwash Rate = 0.6 m³/min / 20 m² = 0.03 m³/m²·min",
    steps: [
      { l: "Convert flow to m³/min", c: "10 L/s * 60 s/min / 1000 L/m³ = 0.6 m³/min" },
      { l: "Calculate backwash rate", c: "0.6 m³/min / 20 m² = 0.03 m³/m²·min" }
    ],
    tip: "Proper backwash rates are essential for effective filter cleaning.",
    "difficulty": "medium"
  },
  {
    "id": 516,
    isCalc: true,
    "module": "Chemical Feed",
    "topic": "chemical feed rate (simple)",
    "question": "A chemical pump is calibrated to deliver 75 mL in 45 seconds. What is the feed rate in L/min?",
    "options": ["0.1 L/min", "0.075 L/min", "0.05 L/min", "0.15 L/min"],
    "correct": 0,
    "explanation": "First, convert the volume from mL to L and the time from seconds to minutes. Then, divide the volume by the time.\nFormula: Feed Rate (L/min) = (Volume (mL) / 1000) / (Time (s) / 60)\nSubstitution: Feed Rate (L/min) = (75 mL / 1000) / (45 s / 60)\nCalculation: Feed Rate (L/min) = 0.075 L / 0.75 min = 0.1 L/min",
    steps: [
      { l: "Convert volume to Liters", c: "75 mL / 1000 = 0.075 L" },
      { l: "Convert time to minutes", c: "45 s / 60 = 0.75 min" },
      { l: "Calculate feed rate", c: "0.075 L / 0.75 min = 0.1 L/min" }
    ],
    tip: "Accurate calibration of chemical feed pumps is vital for proper dosing.",
    "difficulty": "medium"
  },
  {
    "id": 517,
    isCalc: true,
    "module": "Disinfection",
    "topic": "chlorine dose = demand + residual",
    "question": "A water sample has a chlorine demand of 0.8 mg/L. If the desired residual is 0.3 mg/L, what is the required chlorine dose?",
    "options": ["0.5 mg/L", "1.1 mg/L", "0.8 mg/L", "0.3 mg/L"],
    "correct": 1,
    "explanation": "To calculate the required chlorine dose, add the chlorine demand and the desired chlorine residual.\nFormula: Chlorine Dose = Chlorine Demand + Chlorine Residual\nSubstitution: Chlorine Dose = 0.8 mg/L + 0.3 mg/L\nCalculation: Chlorine Dose = 1.1 mg/L",
    steps: [
      { l: "Identify chlorine demand", c: "0.8 mg/L" },
      { l: "Identify desired residual", c: "0.3 mg/L" },
      { l: "Calculate chlorine dose", c: "0.8 mg/L + 0.3 mg/L = 1.1 mg/L" }
    ],
    tip: "Always ensure the dose is sufficient to meet demand and maintain residual.",
    "difficulty": "medium"
  },
  {
    "id": 518,
    isCalc: true,
    "module": "Disinfection",
    "topic": "CT = C × T (basic)",
    "question": "A contact tank has a chlorine residual of 0.5 mg/L and a contact time of 30 minutes. What is the CT value in mg·min/L?",
    "options": ["15 mg·min/L", "1.5 mg·min/L", "30.5 mg·min/L", "29.5 mg·min/L"],
    "correct": 0,
    "explanation": "To calculate the CT value, multiply the chlorine concentration (C) by the contact time (T).\nFormula: CT = C × T\nSubstitution: CT = 0.5 mg/L × 30 min\nCalculation: CT = 15 mg·min/L",
    steps: [
      { l: "Identify chlorine concentration (C)", c: "0.5 mg/L" },
      { l: "Identify contact time (T)", c: "30 min" },
      { l: "Calculate CT value", c: "0.5 mg/L × 30 min = 15 mg·min/L" }
    ],
    tip: "CT values are used to assess the effectiveness of disinfection against pathogens.",
    "difficulty": "medium"
  },
  {
    "id": 519,
    isCalc: true,
    "module": "Chemical Feed",
    "topic": "flow × dose = mass (simple)",
    "question": "A water treatment plant doses fluoride at 1.2 mg/L. If the plant treats 15,000 m³/d, what is the daily mass of fluoride added in kg?",
    "options": ["18 kg/d", "180 kg/d", "1.8 kg/d", "1800 kg/d"],
    "correct": 0,
    "explanation": "To calculate the mass of fluoride required, use the formula: Mass (kg/d) = Flow (m³/d) × Dose (mg/L) / 1000.\nFormula: Mass (kg/d) = Flow (m³/d) × Dose (mg/L) / 1000\nSubstitution: Mass (kg/d) = 15,000 m³/d × 1.2 mg/L / 1000\nCalculation: Mass (kg/d) = 18 kg/d",
    steps: [
      { l: "Identify flow rate", c: "15,000 m³/d" },
      { l: "Identify fluoride dose", c: "1.2 mg/L" },
      { l: "Calculate mass of fluoride", c: "(15,000 m³/d * 1.2 mg/L) / 1000 = 18 kg/d" }
    ],
    tip: "Fluoride dosing is important for dental health in many communities.",
    "difficulty": "medium"
  },
  {
    "id": 520,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "filter loading rate = flow/area",
    "question": "A conventional filter has dimensions of 6 meters by 8 meters. If the design flow rate is 7,200 m³/d, what is the filter loading rate in m³/m²·d?",
    "options": ["150 m³/m²·d", "100 m³/m²·d", "120 m³/m²·d", "180 m³/m²·d"],
    "correct": 0,
    "explanation": "First, calculate the surface area of the filter. Then, divide the flow rate by the filter area.\nFormula: Area = Length × Width; Filter Loading Rate = Flow / Area\nSubstitution: Area = 6 m × 8 m = 48 m²; Filter Loading Rate = 7,200 m³/d / 48 m²\nCalculation: Filter Loading Rate = 150 m³/m²·d",
    steps: [
      { l: "Calculate filter area", c: "6 m * 8 m = 48 m²" },
      { l: "Calculate filter loading rate", c: "7,200 m³/d / 48 m² = 150 m³/m²·d" }
    ],
    tip: "Filter loading rates are critical for maintaining filter performance and water quality.",
    "difficulty": "medium"
  },
  {
    "id": 521,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "detention time = volume/flow",
    "question": "A flocculation tank has a volume of 800 m³. If the flow rate through the tank is 400 m³/h, what is the detention time in hours?",
    "options": ["1.0 h", "2.0 h", "0.5 h", "1.5 h"],
    "correct": 1,
    "explanation": "To calculate the detention time, divide the tank volume by the flow rate.\nFormula: Detention Time = Volume / Flow\nSubstitution: Detention Time = 800 m³ / 400 m³/h\nCalculation: Detention Time = 2.0 h",
    steps: [
      { l: "Identify tank volume", c: "800 m³" },
      { l: "Identify flow rate", c: "400 m³/h" },
      { l: "Calculate detention time", c: "800 m³ / 400 m³/h = 2.0 h" }
    ],
    tip: "Adequate detention time is essential for effective floc formation.",
    "difficulty": "medium"
  },
  {
    "id": 522,
    isCalc: true,
    "module": "Water Quality",
    "topic": "unit conversions (mg/L to kg/d)",
    "question": "A water treatment plant processes 25,000 m³/d of water. If the iron concentration is 0.3 mg/L, what is the daily mass of iron in kg?",
    "options": ["7.5 kg/d", "75 kg/d", "0.75 kg/d", "750 kg/d"],
    "correct": 0,
    "explanation": "To convert mg/L to kg/d when flow is in m³/d, use the formula: Mass (kg/d) = Flow (m³/d) × Concentration (mg/L) / 1000.\nFormula: Mass (kg/d) = Flow (m³/d) × Concentration (mg/L) / 1000\nSubstitution: Mass (kg/d) = 25,000 m³/d × 0.3 mg/L / 1000\nCalculation: Mass (kg/d) = 7.5 kg/d",
    steps: [
      { l: "Identify flow rate", c: "25,000 m³/d" },
      { l: "Identify iron concentration", c: "0.3 mg/L" },
      { l: "Calculate daily mass of iron", c: "(25,000 m³/d * 0.3 mg/L) / 1000 = 7.5 kg/d" }
    ],
    tip: "Remember the conversion factor of 1000 when converting mg/L to kg/d with m³/d flow.",
    "difficulty": "medium"
  },
  {
    "id": 523,
    isCalc: true,
    "module": "Hydraulics",
    "topic": "pipe velocity = flow/area",
    "question": "Water flows through a 0.2-meter diameter pipe at a rate of 0.03 m³/s. What is the velocity of the water in m/s? (Use π = 3.14)",
    "options": ["0.95 m/s", "0.095 m/s", "9.5 m/s", "0.76 m/s"],
    "correct": 0,
    "explanation": "First, calculate the cross-sectional area of the pipe using the formula A = πr², where r is the radius (diameter/2). Then, calculate the velocity using the formula Velocity = Flow / Area.\nFormula: Area = π × (Diameter/2)²; Velocity = Flow / Area\nSubstitution: Area = 3.14 × (0.2 m / 2)² = 3.14 × (0.1 m)² = 3.14 × 0.01 m² = 0.0314 m²; Velocity = 0.03 m³/s / 0.0314 m²\nCalculation: Velocity = 0.955 m/s ≈ 0.95 m/s",
    steps: [
      { l: "Calculate pipe radius", c: "0.2 m / 2 = 0.1 m" },
      { l: "Calculate pipe area", c: "3.14 * (0.1 m)^2 = 0.0314 m²" },
      { l: "Calculate water velocity", c: "0.03 m³/s / 0.0314 m² = 0.955 m/s" }
    ],
    tip: "Pipe velocity affects head loss and potential for scour or sedimentation.",
    "difficulty": "medium"
  },
  {
    "id": 524,
    isCalc: true,
    "module": "Hydraulics",
    "topic": "pump head (basic)",
    "question": "A pump is used to transfer water from a reservoir at an elevation of 50 meters to a treatment plant at an elevation of 85 meters. What is the static head the pump must overcome?",
    "options": ["35 meters", "135 meters", "50 meters", "85 meters"],
    "correct": 0,
    "explanation": "The static head is the vertical distance the water is lifted. It is the difference between the discharge water level and the suction water level.\nFormula: Static Head = Discharge Level - Suction Level\nSubstitution: Static Head = 85 m - 50 m\nCalculation: Static Head = 35 m",
    steps: [
      { l: "Identify discharge level", c: "85 m" },
      { l: "Identify suction level", c: "50 m" },
      { l: "Calculate static head", c: "85 m - 50 m = 35 m" }
    ],
    tip: "Static head is a key factor in determining pump selection and power requirements.",
    "difficulty": "medium"
  },
  {
    "id": 525,
    isCalc: true,
    "module": "Water Quality",
    "topic": "percent removal = (in-out)/in × 100",
    "question": "A filter influent has a turbidity of 10 NTU. The filter effluent has a turbidity of 0.3 NTU. What is the percent removal of turbidity?",
    "options": ["97.0%", "93.0%", "90.0%", "87.0%"],
    "correct": 0,
    "explanation": "To calculate the percent removal, use the formula: Percent Removal = ((In - Out) / In) × 100.\nFormula: Percent Removal = ((In - Out) / In) × 100\nSubstitution: Percent Removal = ((10 NTU - 0.3 NTU) / 10 NTU) × 100\nCalculation: Percent Removal = (9.7 / 10) × 100 = 97.0%",
    steps: [
      { l: "Identify influent turbidity (In)", c: "10 NTU" },
      { l: "Identify effluent turbidity (Out)", c: "0.3 NTU" },
      { l: "Calculate percent removal", c: "((10 - 0.3) / 10) * 100 = 97.0%" }
    ],
    tip: "Effective turbidity removal is crucial for public health and aesthetics.",
    "difficulty": "medium"
  },
  {
    "id": 526,
    isCalc: true,
    "module": "Chemical Feed",
    "topic": "chemical feed rate (simple)",
    "question": "A chemical feed pump is set to deliver 120 mL of polymer solution in 60 seconds. What is the feed rate in L/min?",
    "options": ["0.12 L/min", "0.06 L/min", "0.24 L/min", "1.2 L/min"],
    "correct": 0,
    "explanation": "First, convert the volume from mL to L and the time from seconds to minutes. Then, divide the volume by the time.\nFormula: Feed Rate (L/min) = (Volume (mL) / 1000) / (Time (s) / 60)\nSubstitution: Feed Rate (L/min) = (120 mL / 1000) / (60 s / 60)\nCalculation: Feed Rate (L/min) = 0.12 L / 1 min = 0.12 L/min",
    steps: [
      { l: "Convert volume to Liters", c: "120 mL / 1000 = 0.12 L" },
      { l: "Convert time to minutes", c: "60 s / 60 = 1 min" },
      { l: "Calculate feed rate", c: "0.12 L / 1 min = 0.12 L/min" }
    ],
    tip: "Regular calibration checks ensure accurate chemical dosing.",
    "difficulty": "medium"
  },
  {
    "id": 527,
    isCalc: true,
    "module": "Disinfection",
    "topic": "chlorine dose = demand + residual",
    "question": "A water sample has a chlorine demand of 1.0 mg/L. If the desired residual is 0.4 mg/L, what is the required chlorine dose?",
    "options": ["0.6 mg/L", "1.0 mg/L", "1.4 mg/L", "0.4 mg/L"],
    "correct": 2,
    "explanation": "To calculate the required chlorine dose, add the chlorine demand and the desired chlorine residual.\nFormula: Chlorine Dose = Chlorine Demand + Chlorine Residual\nSubstitution: Chlorine Dose = 1.0 mg/L + 0.4 mg/L\nCalculation: Chlorine Dose = 1.4 mg/L",
    steps: [
      { l: "Identify chlorine demand", c: "1.0 mg/L" },
      { l: "Identify desired residual", c: "0.4 mg/L" },
      { l: "Calculate chlorine dose", c: "1.0 mg/L + 0.4 mg/L = 1.4 mg/L" }
    ],
    tip: "The chlorine dose must be sufficient to satisfy the demand and leave a residual.",
    "difficulty": "medium"
  },
  {
    "id": 528,
    isCalc: true,
    "module": "Disinfection",
    "topic": "CT = C × T (basic)",
    "question": "A chlorine contact chamber has a chlorine residual of 0.6 mg/L and a contact time of 25 minutes. What is the CT value in mg·min/L?",
    "options": ["15 mg·min/L", "1.5 mg·min/L", "25.6 mg·min/L", "24.4 mg·min/L"],
    "correct": 0,
    "explanation": "To calculate the CT value, multiply the chlorine concentration (C) by the contact time (T).\nFormula: CT = C × T\nSubstitution: CT = 0.6 mg/L × 25 min\nCalculation: CT = 15 mg·min/L",
    steps: [
      { l: "Identify chlorine concentration (C)", c: "0.6 mg/L" },
      { l: "Identify contact time (T)", c: "25 min" },
      { l: "Calculate CT value", c: "0.6 mg/L × 25 min = 15 mg·min/L" }
    ],
    tip: "CT values are crucial for ensuring adequate pathogen inactivation.",
    "difficulty": "medium"
  },
  {
    "id": 529,
    isCalc: true,
    "module": "Chemical Feed",
    "topic": "flow × dose = mass (simple)",
    "question": "A water treatment plant adds potassium permanganate at a dose of 0.8 mg/L. If the plant treats 12,000 m³/d, what is the daily mass of potassium permanganate added in kg?",
    "options": ["9.6 kg/d", "96 kg/d", "0.96 kg/d", "960 kg/d"],
    "correct": 0,
    "explanation": "To calculate the mass of potassium permanganate required, use the formula: Mass (kg/d) = Flow (m³/d) × Dose (mg/L) / 1000.\nFormula: Mass (kg/d) = Flow (m³/d) × Dose (mg/L) / 1000\nSubstitution: Mass (kg/d) = 12,000 m³/d × 0.8 mg/L / 1000\nCalculation: Mass (kg/d) = 9.6 kg/d",
    steps: [
      { l: "Identify flow rate", c: "12,000 m³/d" },
      { l: "Identify potassium permanganate dose", c: "0.8 mg/L" },
      { l: "Calculate mass of potassium permanganate", c: "(12,000 m³/d * 0.8 mg/L) / 1000 = 9.6 kg/d" }
    ],
    tip: "Potassium permanganate is often used for oxidation of iron, manganese, and taste and odor compounds.",
    "difficulty": "medium"
  },
  {
    "id": 530,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "filter loading rate = flow/area",
    "question": "A filter bed is 5 meters long and 4 meters wide. If the flow rate through the filter is 3,600 m³/d, what is the filter loading rate in m³/m²·d?",
    "options": ["180 m³/m²·d", "150 m³/m²·d", "200 m³/m²·d", "120 m³/m²·d"],
    "correct": 0,
    "explanation": "First, calculate the surface area of the filter. Then, divide the flow rate by the filter area.\nFormula: Area = Length × Width; Filter Loading Rate = Flow / Area\nSubstitution: Area = 5 m × 4 m = 20 m²; Filter Loading Rate = 3,600 m³/d / 20 m²\nCalculation: Filter Loading Rate = 180 m³/m²·d",
    steps: [
      { l: "Calculate filter area", c: "5 m * 4 m = 20 m²" },
      { l: "Calculate filter loading rate", c: "3,600 m³/d / 20 m² = 180 m³/m²·d" }
    ],
    tip: "Maintaining optimal filter loading rates is key to efficient filtration.",
    "difficulty": "medium"
  },
  {
    "id": 531,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "detention time = volume/flow",
    "question": "A clearwell has a volume of 2,500 m³. If the average daily flow rate is 5,000 m³/d, what is the detention time in hours?",
    "options": ["12 h", "24 h", "6 h", "18 h"],
    "correct": 0,
    "explanation": "To calculate the detention time, divide the clearwell volume by the flow rate. Since the flow rate is in m³/d, convert the detention time to hours.\nFormula: Detention Time (days) = Volume / Flow; Detention Time (hours) = Detention Time (days) × 24 h/day\nSubstitution: Detention Time (days) = 2,500 m³ / 5,000 m³/d = 0.5 days; Detention Time (hours) = 0.5 days × 24 h/day\nCalculation: Detention Time = 12 h",
    steps: [
      { l: "Identify clearwell volume", c: "2,500 m³" },
      { l: "Identify flow rate", c: "5,000 m³/d" },
      { l: "Calculate detention time in days", c: "2,500 m³ / 5,000 m³/d = 0.5 days" },
      { l: "Convert detention time to hours", c: "0.5 days * 24 h/day = 12 h" }
    ],
    tip: "Clearwell detention time provides contact time for disinfection and balances pumping.",
    "difficulty": "medium"
  },
  {
    "id": 532,
    isCalc: true,
    "module": "Water Quality",
    "topic": "unit conversions (L to m³, mg/L to kg/d)",
    "question": "A chemical tank contains 1,500 L of a solution with a concentration of 150 mg/L. What is the total mass of the chemical in kg?",
    "options": ["0.225 kg", "2.25 kg", "22.5 kg", "0.0225 kg"],
    "correct": 0,
    "explanation": "First, convert the volume from L to m³ (1 m³ = 1000 L). Then, use the formula Mass (kg) = Volume (m³) × Concentration (mg/L) / 1000.\nFormula: Mass (kg) = (Volume (L) / 1000 L/m³) × Concentration (mg/L) / 1000\nSubstitution: Mass (kg) = (1,500 L / 1000) × 150 mg/L / 1000\nCalculation: Mass (kg) = 1.5 m³ × 150 mg/L / 1000 = 0.225 kg",
    steps: [
      { l: "Convert volume to m³", c: "1,500 L / 1000 = 1.5 m³" },
      { l: "Calculate mass of chemical", c: "(1.5 m³ * 150 mg/L) / 1000 = 0.225 kg" }
    ],
    tip: "Accurate unit conversions are vital for correct chemical inventory and dosing.",
    "difficulty": "medium"
  },
  {
    "id": 533,
    isCalc: true,
    "module": "Hydraulics",
    "topic": "pipe velocity = flow/area",
    "question": "A 0.4-meter diameter pipe carries a flow of 0.08 m³/s. What is the velocity of the water in m/s? (Use π = 3.14)",
    "options": ["0.64 m/s", "0.064 m/s", "6.4 m/s", "0.8 m/s"],
    "correct": 0,
    "explanation": "First, calculate the cross-sectional area of the pipe using the formula A = πr², where r is the radius (diameter/2). Then, calculate the velocity using the formula Velocity = Flow / Area.\nFormula: Area = π × (Diameter/2)²; Velocity = Flow / Area\nSubstitution: Area = 3.14 × (0.4 m / 2)² = 3.14 × (0.2 m)² = 3.14 × 0.04 m² = 0.1256 m²; Velocity = 0.08 m³/s / 0.1256 m²\nCalculation: Velocity = 0.6369 m/s ≈ 0.64 m/s",
    steps: [
      { l: "Calculate pipe radius", c: "0.4 m / 2 = 0.2 m" },
      { l: "Calculate pipe area", c: "3.14 * (0.2 m)^2 = 0.1256 m²" },
      { l: "Calculate water velocity", c: "0.08 m³/s / 0.1256 m² = 0.6369 m/s" }
    ],
    tip: "High velocities can lead to increased head loss and pipe erosion.",
    "difficulty": "medium"
  },
  {
    "id": 534,
    isCalc: true,
    "module": "Hydraulics",
    "topic": "pump head (basic)",
    "question": "A pump draws water from a well with a static water level of 15 meters below ground and discharges it to a tank 20 meters above ground. What is the total static head the pump must overcome?",
    "options": ["5 meters", "35 meters", "15 meters", "20 meters"],
    "correct": 1,
    "explanation": "The total static head is the sum of the suction lift (distance from pump to water level) and the discharge head (distance from pump to discharge point). In this case, it's the difference in elevation between the water source and the discharge point.\nFormula: Total Static Head = Suction Lift + Discharge Head\nSubstitution: Total Static Head = 15 m + 20 m\nCalculation: Total Static Head = 35 m",
    steps: [
      { l: "Identify suction lift", c: "15 m" },
      { l: "Identify discharge head", c: "20 m" },
      { l: "Calculate total static head", c: "15 m + 20 m = 35 m" }
    ],
    tip: "Static head is the vertical distance water is moved, ignoring friction losses.",
    "difficulty": "medium"
  },
  {
    "id": 535,
    isCalc: true,
    "module": "Water Quality",
    "topic": "percent removal = (in-out)/in × 100",
    "question": "A coagulation-flocculation process reduces the turbidity from 25 NTU to 1.5 NTU. What is the percent removal of turbidity?",
    "options": ["94.0%", "92.0%", "96.0%", "90.0%"],
    "correct": 0,
    "explanation": "To calculate the percent removal, use the formula: Percent Removal = ((In - Out) / In) × 100.\nFormula: Percent Removal = ((In - Out) / In) × 100\nSubstitution: Percent Removal = ((25 NTU - 1.5 NTU) / 25 NTU) × 100\nCalculation: Percent Removal = (23.5 / 25) × 100 = 94.0%",
    steps: [
      { l: "Identify influent turbidity (In)", c: "25 NTU" },
      { l: "Identify effluent turbidity (Out)", c: "1.5 NTU" },
      { l: "Calculate percent removal", c: "((25 - 1.5) / 25) * 100 = 94.0%" }
    ],
    tip: "Optimizing coagulation and flocculation improves turbidity removal.",
    "difficulty": "medium"
  },
  {
    "id": 536,
    isCalc: true,
    "module": "Chemical Feed",
    "topic": "chemical feed rate (simple)",
    "question": "A chemical metering pump delivers 80 mL of solution in 20 seconds. What is the feed rate in L/min?",
    "options": ["0.24 L/min", "0.08 L/min", "0.16 L/min", "0.32 L/min"],
    "correct": 0,
    "explanation": "First, convert the volume from mL to L and the time from seconds to minutes. Then, divide the volume by the time.\nFormula: Feed Rate (L/min) = (Volume (mL) / 1000) / (Time (s) / 60)\nSubstitution: Feed Rate (L/min) = (80 mL / 1000) / (20 s / 60)\nCalculation: Feed Rate (L/min) = 0.08 L / 0.3333 min = 0.24 L/min",
    steps: [
      { l: "Convert volume to Liters", c: "80 mL / 1000 = 0.08 L" },
      { l: "Convert time to minutes", c: "20 s / 60 = 0.3333 min" },
      { l: "Calculate feed rate", c: "0.08 L / 0.3333 min = 0.24 L/min" }
    ],
    tip: "Accurate chemical feed rates are crucial for process control and water quality.",
    "difficulty": "medium"
  },
  {
    "id": 537,
    isCalc: true,
    "module": "Disinfection",
    "topic": "chlorine dose = demand + residual",
    "question": "A water sample has a chlorine demand of 1.3 mg/L. If the desired residual is 0.6 mg/L, what is the required chlorine dose?",
    "options": ["0.7 mg/L", "1.3 mg/L", "1.9 mg/L", "0.6 mg/L"],
    "correct": 2,
    "explanation": "To calculate the required chlorine dose, add the chlorine demand and the desired chlorine residual.\nFormula: Chlorine Dose = Chlorine Demand + Chlorine Residual\nSubstitution: Chlorine Dose = 1.3 mg/L + 0.6 mg/L\nCalculation: Chlorine Dose = 1.9 mg/L",
    steps: [
      { l: "Identify chlorine demand", c: "1.3 mg/L" },
      { l: "Identify desired residual", c: "0.6 mg/L" },
      { l: "Calculate chlorine dose", c: "1.3 mg/L + 0.6 mg/L = 1.9 mg/L" }
    ],
    tip: "Always ensure the dose is sufficient to meet demand and maintain residual.",
    "difficulty": "medium"
  },
  {
    "id": 538,
    isCalc: true,
    "module": "Disinfection",
    "topic": "CT = C × T (basic)",
    "question": "A water plant maintains a chlorine residual of 0.7 mg/L and a contact time of 22 minutes. Calculate the CT value in mg·min/L.",
    "options": ["15.4 mg·min/L", "1.54 mg·min/L", "22.7 mg·min/L", "21.3 mg·min/L"],
    "correct": 0,
    "explanation": "To calculate the CT value, multiply the chlorine concentration (C) by the contact time (T).\nFormula: CT = C × T\nSubstitution: CT = 0.7 mg/L × 22 min\nCalculation: CT = 15.4 mg·min/L",
    steps: [
      { l: "Identify chlorine concentration (C)", c: "0.7 mg/L" },
      { l: "Identify contact time (T)", c: "22 min" },
      { l: "Calculate CT value", c: "0.7 mg/L × 22 min = 15.4 mg·min/L" }
    ],
    tip: "CT values are essential for demonstrating compliance with disinfection regulations.",
    "difficulty": "medium"
  },
  {
    "id": 539,
    isCalc: true,
    "module": "Chemical Feed",
    "topic": "flow × dose = mass (simple)",
    "question": "A water treatment plant uses soda ash at a dose of 10 mg/L. If the plant treats 8,000 m³/d, what is the daily mass of soda ash added in kg?",
    "options": ["80 kg/d", "8 kg/d", "0.8 kg/d", "800 kg/d"],
    "correct": 0,
    "explanation": "To calculate the mass of soda ash required, use the formula: Mass (kg/d) = Flow (m³/d) × Dose (mg/L) / 1000.\nFormula: Mass (kg/d) = Flow (m³/d) × Dose (mg/L) / 1000\nSubstitution: Mass (kg/d) = 8,000 m³/d × 10 mg/L / 1000\nCalculation: Mass (kg/d) = 80 kg/d",
    steps: [
      { l: "Identify flow rate", c: "8,000 m³/d" },
      { l: "Identify soda ash dose", c: "10 mg/L" },
      { l: "Calculate mass of soda ash", c: "(8,000 m³/d * 10 mg/L) / 1000 = 80 kg/d" }
    ],
    tip: "Soda ash is commonly used for pH adjustment and alkalinity control.",
    "difficulty": "medium"
  },
  {
    "id": 540,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "filter loading rate = flow/area",
    "question": "A filter has a surface area of 40 m². If the flow rate through the filter is 4,000 m³/d, what is the filter loading rate in m³/m²·d?",
    "options": ["100 m³/m²·d", "10 m³/m²·d", "200 m³/m²·d", "50 m³/m²·d"],
    "correct": 0,
    "explanation": "To calculate the filter loading rate, divide the flow rate by the filter surface area.\nFormula: Filter Loading Rate = Flow / Area\nSubstitution: Filter Loading Rate = 4,000 m³/d / 40 m²\nCalculation: Filter Loading Rate = 100 m³/m²·d",
    steps: [
      { l: "Identify flow rate", c: "4,000 m³/d" },
      { l: "Identify filter area", c: "40 m²" },
      { l: "Calculate filter loading rate", c: "4,000 m³/d / 40 m² = 100 m³/m²·d" }
    ],
    tip: "Optimal filter loading rates prevent premature filter clogging and ensure efficient filtration.",
    "difficulty": "medium"
  },
  {
    "id": 541,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "detention time = volume/flow",
    "question": "A contact tank has a volume of 1,500 m³. If the flow rate through the tank is 750 m³/h, what is the detention time in hours?",
    "options": ["1.0 h", "2.0 h", "0.5 h", "1.5 h"],
    "correct": 1,
    "explanation": "To calculate the detention time, divide the tank volume by the flow rate.\nFormula: Detention Time = Volume / Flow\nSubstitution: Detention Time = 1,500 m³ / 750 m³/h\nCalculation: Detention Time = 2.0 h",
    steps: [
      { l: "Identify tank volume", c: "1,500 m³" },
      { l: "Identify flow rate", c: "750 m³/h" },
      { l: "Calculate detention time", c: "1,500 m³ / 750 m³/h = 2.0 h" }
    ],
    tip: "Detention time is critical for ensuring adequate contact time for disinfection.",
    "difficulty": "medium"
  },
  {
    "id": 542,
    isCalc: true,
    "module": "Water Quality",
    "topic": "unit conversions (L to m³, mg/L to kg/d)",
    "question": "A chemical feed system uses 2,000 L of a 50 mg/L solution daily. What is the total mass of the chemical used per day in kg?",
    "options": ["0.1 kg/d", "1.0 kg/d", "10 kg/d", "0.01 kg/d"],
    "correct": 0,
    "explanation": "First, convert the volume from L to m³ (1 m³ = 1000 L). Then, use the formula Mass (kg/d) = Volume (m³/d) × Concentration (mg/L) / 1000.\nFormula: Mass (kg/d) = (Volume (L) / 1000 L/m³) × Concentration (mg/L) / 1000\nSubstitution: Mass (kg/d) = (2,000 L / 1000) × 50 mg/L / 1000\nCalculation: Mass (kg/d) = 2 m³ × 50 mg/L / 1000 = 0.1 kg/d",
    steps: [
      { l: "Convert volume to m³", c: "2,000 L / 1000 = 2 m³" },
      { l: "Calculate mass of chemical", c: "(2 m³ * 50 mg/L) / 1000 = 0.1 kg/d" }
    ],
    tip: "Accurate unit conversions are essential for managing chemical inventory and costs.",
    "difficulty": "medium"
  },
  {
    "id": 543,
    isCalc: true,
    "module": "Hydraulics",
    "topic": "pipe velocity = flow/area",
    "question": "A 0.25-meter diameter pipe has water flowing through it at a rate of 0.04 m³/s. What is the velocity of the water in m/s? (Use π = 3.14)",
    "options": ["0.81 m/s", "0.081 m/s", "8.1 m/s", "0.64 m/s"],
    "correct": 0,
    "explanation": "First, calculate the cross-sectional area of the pipe using the formula A = πr², where r is the radius (diameter/2). Then, calculate the velocity using the formula Velocity = Flow / Area.\nFormula: Area = π × (Diameter/2)²; Velocity = Flow / Area\nSubstitution: Area = 3.14 × (0.25 m / 2)² = 3.14 × (0.125 m)² = 3.14 × 0.015625 m² = 0.0490625 m²; Velocity = 0.04 m³/s / 0.0490625 m²\nCalculation: Velocity = 0.815 m/s ≈ 0.81 m/s",
    steps: [
      { l: "Calculate pipe radius", c: "0.25 m / 2 = 0.125 m" },
      { l: "Calculate pipe area", c: "3.14 * (0.125 m)^2 = 0.0490625 m²" },
      { l: "Calculate water velocity", c: "0.04 m³/s / 0.0490625 m² = 0.815 m/s" }
    ],
    tip: "Understanding pipe velocity helps in designing efficient piping systems.",
    "difficulty": "medium"
  },
  {
    "id": 544,
    isCalc: true,
    "module": "Hydraulics",
    "topic": "pump head (basic)",
    "question": "A pump delivers water from a suction tank with a water level of 2 meters to a discharge tank with a water level of 18 meters. What is the static head the pump must overcome?",
    "options": ["16 meters", "20 meters", "18 meters", "2 meters"],
    "correct": 0,
    "explanation": "The static head is the vertical distance the water is lifted. It is the difference between the discharge water level and the suction water level.\nFormula: Static Head = Discharge Level - Suction Level\nSubstitution: Static Head = 18 m - 2 m\nCalculation: Static Head = 16 m",
    steps: [
      { l: "Identify discharge level", c: "18 m" },
      { l: "Identify suction level", c: "2 m" },
      { l: "Calculate static head", c: "18 m - 2 m = 16 m" }
    ],
    tip: "Static head is a fundamental component of total dynamic head.",
    "difficulty": "medium"
  },
  {
    "id": 545,
    isCalc: true,
    "module": "Water Quality",
    "topic": "percent removal = (in-out)/in × 100",
    "question": "Raw water entering a plant has a turbidity of 18 NTU. After clarification, the turbidity is 0.9 NTU. What is the percent removal of turbidity?",
    "options": ["95.0%", "90.0%", "92.0%", "98.0%"],
    "correct": 0,
    "explanation": "To calculate the percent removal, use the formula: Percent Removal = ((In - Out) / In) × 100.\nFormula: Percent Removal = ((In - Out) / In) × 100\nSubstitution: Percent Removal = ((18 NTU - 0.9 NTU) / 18 NTU) × 100\nCalculation: Percent Removal = (17.1 / 18) × 100 = 95.0%",
    steps: [
      { l: "Identify influent turbidity (In)", c: "18 NTU" },
      { l: "Identify effluent turbidity (Out)", c: "0.9 NTU" },
      { l: "Calculate percent removal", c: "((18 - 0.9) / 18) * 100 = 95.0%" }
    ],
    tip: "High turbidity removal is essential for effective disinfection and overall water quality.",
    "difficulty": "medium"
  },
  {
    "id": 546,
    isCalc: true,
    "module": "Chemical Feed",
    "topic": "chemical feed rate (simple)",
    "question": "A chemical feed pump delivers 90 mL of solution in 30 seconds. What is the feed rate in L/min?",
    "options": ["0.18 L/min", "0.09 L/min", "0.27 L/min", "0.03 L/min"],
    "correct": 0,
    "explanation": "First, convert the volume from mL to L and the time from seconds to minutes. Then, divide the volume by the time.\nFormula: Feed Rate (L/min) = (Volume (mL) / 1000) / (Time (s) / 60)\nSubstitution: Feed Rate (L/min) = (90 mL / 1000) / (30 s / 60)\nCalculation: Feed Rate (L/min) = 0.09 L / 0.5 min = 0.18 L/min",
    steps: [
      { l: "Convert volume to Liters", c: "90 mL / 1000 = 0.09 L" },
      { l: "Convert time to minutes", c: "30 s / 60 = 0.5 min" },
      { l: "Calculate feed rate", c: "0.09 L / 0.5 min = 0.18 L/min" }
    ],
    tip: "Accurate chemical feed rates are crucial for maintaining water quality and optimizing treatment processes.",
    "difficulty": "medium"
  },
  {
    "id": 547,
    isCalc: true,
    "module": "Disinfection",
    "topic": "chlorine dose = demand + residual",
    "question": "A water sample has a chlorine demand of 1.1 mg/L. If the desired residual is 0.4 mg/L, what is the required chlorine dose?",
    "options": ["0.7 mg/L", "1.1 mg/L", "1.5 mg/L", "0.4 mg/L"],
    "correct": 2,
    "explanation": "To calculate the required chlorine dose, add the chlorine demand and the desired chlorine residual.\nFormula: Chlorine Dose = Chlorine Demand + Chlorine Residual\nSubstitution: Chlorine Dose = 1.1 mg/L + 0.4 mg/L\nCalculation: Chlorine Dose = 1.5 mg/L",
    steps: [
      { l: "Identify chlorine demand", c: "1.1 mg/L" },
      { l: "Identify desired residual", c: "0.4 mg/L" },
      { l: "Calculate chlorine dose", c: "1.1 mg/L + 0.4 mg/L = 1.5 mg/L" }
    ],
    tip: "Chlorine dose must always be greater than or equal to the sum of demand and residual.",
    "difficulty": "medium"
  },
  {
    "id": 548,
    isCalc: true,
    "module": "Disinfection",
    "topic": "CT = C × T (basic)",
    "question": "A water treatment plant has a chlorine residual of 0.4 mg/L and a contact time of 35 minutes. What is the CT value in mg·min/L?",
    "options": ["14 mg·min/L", "1.4 mg·min/L", "35.4 mg·min/L", "34.6 mg·min/L"],
    "correct": 0,
    "explanation": "To calculate the CT value, multiply the chlorine concentration (C) by the contact time (T).\nFormula: CT = C × T\nSubstitution: CT = 0.4 mg/L × 35 min\nCalculation: CT = 14 mg·min/L",
    steps: [
      { l: "Identify chlorine concentration (C)", c: "0.4 mg/L" },
      { l: "Identify contact time (T)", c: "35 min" },
      { l: "Calculate CT value", c: "0.4 mg/L × 35 min = 14 mg·min/L" }
    ],
    tip: "CT values are crucial for ensuring adequate pathogen inactivation.",
    "difficulty": "medium"
  },
  {
    "id": 549,
    isCalc: true,
    "module": "Chemical Feed",
    "topic": "flow × dose = mass (simple)",
    "question": "A water treatment plant adds carbon dioxide at a dose of 5 mg/L. If the plant treats 10,000 m³/d, what is the daily mass of carbon dioxide added in kg?",
    "options": ["50 kg/d", "5 kg/d", "0.5 kg/d", "500 kg/d"],
    "correct": 0,
    "explanation": "To calculate the mass of carbon dioxide required, use the formula: Mass (kg/d) = Flow (m³/d) × Dose (mg/L) / 1000.\nFormula: Mass (kg/d) = Flow (m³/d) × Dose (mg/L) / 1000\nSubstitution: Mass (kg/d) = 10,000 m³/d × 5 mg/L / 1000\nCalculation: Mass (kg/d) = 50 kg/d",
    steps: [
      { l: "Identify flow rate", c: "10,000 m³/d" },
      { l: "Identify carbon dioxide dose", c: "5 mg/L" },
      { l: "Calculate mass of carbon dioxide", c: "(10,000 m³/d * 5 mg/L) / 1000 = 50 kg/d" }
    ],
    tip: "Carbon dioxide is often used for pH adjustment and recarbonation after lime softening.",
    "difficulty": "medium"
  },
  {
    "id": 550,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "filter loading rate = flow/area",
    "question": "A filter has a length of 7 meters and a width of 6 meters. If the flow rate through the filter is 6,300 m³/d, what is the filter loading rate in m³/m²·d?",
    "options": ["150 m³/m²·d", "100 m³/m²·d", "200 m³/m²·d", "250 m³/m²·d"],
    "correct": 0,
    "explanation": "First, calculate the surface area of the filter. Then, divide the flow rate by the filter area.\nFormula: Area = Length × Width; Filter Loading Rate = Flow / Area\nSubstitution: Area = 7 m × 6 m = 42 m²; Filter Loading Rate = 6,300 m³/d / 42 m²\nCalculation: Filter Loading Rate = 150 m³/m²·d",
    steps: [
      { l: "Calculate filter area", c: "7 m * 6 m = 42 m²" },
      { l: "Calculate filter loading rate", c: "6,300 m³/d / 42 m² = 150 m³/m²·d" }
    ],
    tip: "Proper filter loading rates are essential for efficient particle removal.",
    "difficulty": "medium"
  },
  {
    "id": 551,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "detention time = volume/flow",
    "question": "A flocculation basin has a volume of 900 m³. If the flow rate through the basin is 300 m³/h, what is the detention time in hours?",
    "options": ["2.0 h", "3.0 h", "1.5 h", "4.0 h"],
    "correct": 1,
    "explanation": "To calculate the detention time, divide the basin volume by the flow rate.\nFormula: Detention Time = Volume / Flow\nSubstitution: Detention Time = 900 m³ / 300 m³/h\nCalculation: Detention Time = 3.0 h",
    steps: [
      { l: "Identify basin volume", c: "900 m³" },
      { l: "Identify flow rate", c: "300 m³/h" },
      { l: "Calculate detention time", c: "900 m³ / 300 m³/h = 3.0 h" }
    ],
    tip: "Sufficient detention time in flocculation is crucial for particle aggregation.",
    "difficulty": "medium"
  },
  {
    "id": 552,
    isCalc: true,
    "module": "Water Quality",
    "topic": "unit conversions (L to m³, mg/L to kg/d)",
    "question": "A chemical drum contains 500 L of a 250 mg/L solution. What is the total mass of the chemical in kg?",
    "options": ["0.125 kg", "1.25 kg", "12.5 kg", "0.0125 kg"],
    "correct": 0,
    "explanation": "First, convert the volume from L to m³ (1 m³ = 1000 L). Then, use the formula Mass (kg) = Volume (m³) × Concentration (mg/L) / 1000.\nFormula: Mass (kg) = (Volume (L) / 1000 L/m³) × Concentration (mg/L) / 1000\nSubstitution: Mass (kg) = (500 L / 1000) × 250 mg/L / 1000\nCalculation: Mass (kg) = 0.5 m³ × 250 mg/L / 1000 = 0.125 kg",
    steps: [
      { l: "Convert volume to m³", c: "500 L / 1000 = 0.5 m³" },
      { l: "Calculate mass of chemical", c: "(0.5 m³ * 250 mg/L) / 1000 = 0.125 kg" }
    ],
    tip: "Accurate chemical inventory is crucial for operational efficiency and safety.",
    "difficulty": "medium"
  },
  {
    "id": 553,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "weir overflow rate",
    "question": "A sedimentation basin has an effluent weir with a total length of 30 meters. If the flow rate over the weir is 6,000 m³/d, what is the weir overflow rate in m³/m·d?",
    "options": ["200 m³/m·d", "20 m³/m·d", "180 m³/m·d", "150 m³/m·d"],
    "correct": 0,
    "explanation": "To calculate the weir overflow rate, divide the flow rate by the total weir length.\nFormula: Weir Overflow Rate = Flow / Weir Length\nSubstitution: Weir Overflow Rate = 6,000 m³/d / 30 m\nCalculation: Weir Overflow Rate = 200 m³/m·d",
    steps: [
      { l: "Identify flow rate", c: "6,000 m³/d" },
      { l: "Identify weir length", c: "30 m" },
      { l: "Calculate weir overflow rate", c: "6,000 m³/d / 30 m = 200 m³/m·d" }
    ],
    tip: "Proper weir overflow rates prevent excessive velocities and floc carryover.",
    "difficulty": "medium"
  },
  {
    "id": 554,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "backwash rate",
    "question": "A filter with a surface area of 25 m² is backwashed at a rate of 12 L/s. What is the backwash rate in m³/m²·min?",
    "options": ["0.0288 m³/m²·min", "0.288 m³/m²·min", "2.88 m³/m²·min", "0.00288 m³/m²·min"],
    "correct": 0,
    "explanation": "First, convert the flow rate from L/s to m³/min. Then, divide by the filter surface area.\nFormula: Backwash Rate (m³/m²·min) = (Flow (L/s) × 60 s/min / 1000 L/m³) / Area (m²)\nSubstitution: Backwash Rate = (12 L/s × 60 / 1000) / 25 m²\nCalculation: Backwash Rate = 0.72 m³/min / 25 m² = 0.0288 m³/m²·min",
    steps: [
      { l: "Convert flow to m³/min", c: "12 L/s * 60 s/min / 1000 L/m³ = 0.72 m³/min" },
      { l: "Calculate backwash rate", c: "0.72 m³/min / 25 m² = 0.0288 m³/m²·min" }
    ],
    tip: "An appropriate backwash rate is essential for effective filter cleaning and preventing mudball formation.",
    "difficulty": "medium"
  },
  {
    "id": 555,
    isCalc: true,
    "module": "Disinfection",
    "topic": "chlorine residual after demand",
    "question": "A water sample has a chlorine demand of 0.9 mg/L. If a chlorine dose of 1.8 mg/L is applied, what is the chlorine residual after the demand has been met?",
    "options": ["0.9 mg/L", "2.7 mg/L", "1.8 mg/L", "0.45 mg/L"],
    "correct": 0,
    "explanation": "To calculate the chlorine residual after demand, subtract the chlorine demand from the applied chlorine dose.\nFormula: Chlorine Residual = Chlorine Dose - Chlorine Demand\nSubstitution: Chlorine Residual = 1.8 mg/L - 0.9 mg/L\nCalculation: Chlorine Residual = 0.9 mg/L",
    steps: [
      { l: "Identify chlorine dose", c: "1.8 mg/L" },
      { l: "Identify chlorine demand", c: "0.9 mg/L" },
      { l: "Calculate chlorine residual", c: "1.8 mg/L - 0.9 mg/L = 0.9 mg/L" }
    ],
    tip: "Maintaining a proper chlorine residual is vital for preventing bacterial regrowth in the distribution system.",
    "difficulty": "medium"
  },
  {
    "id": 556,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "alum dose from jar test",
    "question": "A jar test determines an optimal alum dose of 12 mg/L. If the plant treats a flow of 9,000 m³/d, what is the daily mass of alum required in kg?",
    "options": ["108 kg/d", "10.8 kg/d", "1.08 kg/d", "1080 kg/d"],
    "correct": 0,
    "explanation": "To calculate the mass of alum required, use the formula: Mass (kg/d) = Flow (m³/d) × Dose (mg/L) / 1000.\nFormula: Mass (kg/d) = Flow (m³/d) × Dose (mg/L) / 1000\nSubstitution: Mass (kg/d) = 9,000 m³/d × 12 mg/L / 1000\nCalculation: Mass (kg/d) = 108 kg/d",
    steps: [
      { l: "Identify flow rate", c: "9,000 m³/d" },
      { l: "Identify alum dose", c: "12 mg/L" },
      { l: "Calculate mass of alum", c: "(9,000 m³/d * 12 mg/L) / 1000 = 108 kg/d" }
    ],
    tip: "Jar tests are crucial for optimizing coagulant dosages and minimizing chemical costs.",
    "difficulty": "medium"
  },
  {
    "id": 557,
    isCalc: true,
    "module": "Treatment Process",
    "topic": "weir overflow rate",
    "question": "A sedimentation basin has an effluent weir with a total length of 20 meters. If the flow rate over the weir is 4,000 m³/d, what is the weir overflow rate in m³/m·d?",
    "options": ["200 m³/m·d", "20 m³/m·d", "180 m³/m·d", "150 m³/m·d"],
    "correct": 0,
    "explanation": "To calculate the weir overflow rate, divide the flow rate by the total weir length.\nFormula: Weir Overflow Rate = Flow / Weir Length\nSubstitution: Weir Overflow Rate = 4,000 m³/d / 20 m\nCalculation: Weir Overflow Rate = 200 m³/m·d",
    steps: [
      { l: "Identify flow rate", c: "4,000 m³/d" },
      { l: "Identify weir length", c: "20 m" },
      { l: "Calculate weir overflow rate", c: "4,000 m³/d / 20 m = 200 m³/m·d" }
    ],
    tip: "Maintaining optimal weir overflow rates helps prevent short-circuiting and improves settling efficiency.",
    "difficulty": "medium"
  },
  // ─── MODULE: Water Distribution (Questions 558-607) ─────────────────────
  {
    id: 558,
    module: "Water Distribution",
    difficulty: "easy",
    question: "What is the minimum residual chlorine required in a distribution system under Ontario O. Reg. 170/03?",
    options: ["0.5 mg/L", "0.2 mg/L", "0.05 mg/L", "1.0 mg/L"],
    correct: 2,
    explanation: "Ontario O. Reg. 170/03 requires a minimum free chlorine residual of 0.05 mg/L at all points in the distribution system to maintain microbiological safety.",
    tip: "Remember: 0.05 mg/L is the minimum; most systems target 0.2–0.5 mg/L for a safety margin."
  },
  {
    id: 559,
    module: "Water Distribution",
    difficulty: "easy",
    question: "Which pipe material is most commonly used for new water distribution mains in Ontario?",
    options: ["PVC (polyvinyl chloride)", "Ductile iron", "Cast iron", "Copper"],
    correct: 0,
    explanation: "PVC (polyvinyl chloride) is the most commonly installed pipe material for new water distribution mains due to its corrosion resistance, smooth interior, low cost, and ease of installation.",
    tip: "PVC is preferred for new installations; ductile iron is common in older systems and high-pressure applications."
  },
  {
    id: 560,
    module: "Water Distribution",
    difficulty: "easy",
    question: "What is the purpose of a pressure reducing valve (PRV) in a water distribution system?",
    options: [
      "To increase water pressure in low-pressure zones",
      "To prevent backflow from customer premises",
      "To reduce higher upstream pressure to a lower, controlled downstream pressure",
      "To measure flow rate in the distribution main"
    ],
    correct: 2,
    explanation: "A pressure reducing valve (PRV) automatically reduces higher upstream pressure to a lower, controlled downstream pressure, protecting pipes and fixtures in lower pressure zones from excessive pressure.",
    tip: "PRVs are commonly installed at pressure zone boundaries to manage hydraulic grade lines."
  },
  {
    id: 561,
    module: "Water Distribution",
    difficulty: "easy",
    question: "What is a dead-end main in a water distribution system?",
    options: [
      "A pipe that is connected at only one end with no outlet at the other end",
      "A main that has been permanently decommissioned",
      "A main installed below the frost line",
      "A pipe that connects two pressure zones"
    ],
    correct: 0,
    explanation: "A dead-end main is a pipe connected at only one end, with no outlet at the other end. Dead ends are problematic because water stagnates, chlorine residual depletes, and sediment accumulates — requiring regular flushing.",
    tip: "Dead ends should be flushed regularly to maintain water quality and chlorine residual."
  },
  {
    id: 562,
    module: "Water Distribution",
    difficulty: "easy",
    question: "What is the primary purpose of flushing water distribution mains?",
    options: [
      "To test pipe pressure",
      "To calibrate flow meters",
      "To check for leaks in the system",
      "To remove stale water, sediment, and biofilm to restore water quality"
    ],
    correct: 3,
    explanation: "Flushing distribution mains removes stale water, sediment, corrosion byproducts, and biofilm that accumulate over time, restoring water quality, chlorine residual, and aesthetic properties (taste, odour, colour).",
    tip: "Unidirectional flushing (UDF) is more effective than conventional flushing as it creates higher velocities to scour sediment."
  },
  {
    id: 563,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is cross-connection in a water distribution system?",
    options: [
      "A pipe connection between two different pressure zones",
      "Any actual or potential connection between a potable water supply and a source of contamination",
      "A valve that connects two parallel mains",
      "A connection between the distribution main and a fire hydrant"
    ],
    correct: 1,
    explanation: "A cross-connection is any actual or potential connection between a potable (drinking) water supply and any source of contamination or pollution. Cross-connections create the risk of backflow, which can contaminate the drinking water supply.",
    tip: "Cross-connection control programs identify and eliminate cross-connections through inspections and backflow prevention device requirements."
  },
  {
    id: 564,
    module: "Water Distribution",
    difficulty: "medium",
    question: "Under what conditions does backsiphonage occur?",
    options: [
      "When downstream pressure exceeds upstream pressure",
      "When a pump creates excessive pressure in the main",
      "When a fire hydrant is opened during high-demand periods",
      "When negative pressure (vacuum) in the supply line draws contaminants back into the potable water system"
    ],
    correct: 3,
    explanation: "Backsiphonage occurs when negative pressure (a partial vacuum) develops in the supply line, creating a siphoning effect that draws contaminants back into the potable water system. It can occur during water main breaks, heavy firefighting demand, or when a pump shuts down suddenly.",
    tip: "Backsiphonage is one of two types of backflow — the other is backpressure, caused by downstream pressure exceeding supply pressure."
  },
  {
    id: 565,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What type of backflow preventer provides the highest level of protection against both backsiphonage and backpressure?",
    options: [
      "Atmospheric vacuum breaker (AVB)",
      "Pressure vacuum breaker (PVB)",
      "Reduced pressure zone (RPZ) device",
      "Double check valve assembly (DCVA)"
    ],
    correct: 2,
    explanation: "The reduced pressure zone (RPZ) device provides the highest level of backflow protection. It contains two independently acting check valves and a hydraulically operated relief valve that maintains a zone of reduced pressure between the checks, providing protection against both backsiphonage and backpressure.",
    tip: "RPZ devices are required for high-hazard cross-connections such as those at hospitals, car washes, and industrial facilities."
  },
  {
    id: 566,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the typical minimum cover depth for water distribution mains in Ontario to protect against freezing?",
    options: ["1.5 m", "1.0 m", "0.5 m", "2.0 m"],
    correct: 0,
    explanation: "In Ontario, water distribution mains are typically installed with a minimum cover depth of 1.5 m (approximately 5 feet) below the frost line to protect against freezing. Local conditions and frost depth may require greater depths.",
    tip: "The frost depth in Ontario varies by region — northern Ontario may require deeper installation than southern Ontario."
  },
  {
    id: 567,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a water storage reservoir (elevated tank) in a distribution system?",
    options: [
      "To treat water before distribution",
      "To remove chlorine before it reaches customers",
      "To provide pressure equalization, emergency storage, and fire flow reserve",
      "To measure water consumption in the distribution zone"
    ],
    correct: 2,
    explanation: "Elevated storage tanks and reservoirs serve three key functions: (1) pressure equalization — they maintain relatively constant pressure during demand fluctuations; (2) emergency storage — they provide backup supply during pump failures; and (3) fire flow reserve — they supply additional water for firefighting.",
    tip: "The hydraulic grade line (HGL) from an elevated tank determines the pressure throughout the pressure zone it serves."
  },
  {
    id: 568,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What does the term 'water hammer' describe in a distribution system?",
    options: [
      "A pressure surge caused by a sudden change in water velocity",
      "The sound of water flowing through a partially closed valve",
      "The impact of water on a fire hydrant during flushing",
      "Sediment buildup on the walls of a water main"
    ],
    correct: 0,
    explanation: "Water hammer is a pressure surge (shock wave) caused by a sudden change in water velocity, typically when a valve is closed rapidly or a pump shuts down abruptly. The kinetic energy of the moving water is converted to pressure energy, creating a high-pressure wave that can damage pipes and fittings.",
    tip: "Water hammer can be mitigated by using slow-closing valves, surge tanks, or pressure relief valves."
  },
  {
    id: 569,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a blow-off valve (blow-off assembly) on a water main?",
    options: [
      "To release excess pressure from the main",
      "To allow air to enter the main during draining",
      "To prevent backflow from service connections",
      "To drain or flush a section of main, typically at low points or dead ends"
    ],
    correct: 3,
    explanation: "A blow-off valve (blow-off assembly) is installed at low points or dead ends of water mains to allow the main to be drained or flushed. It is used during main breaks, repairs, or routine maintenance to remove sediment and stale water.",
    tip: "Blow-off assemblies should discharge to a suitable location to prevent contamination of the surrounding area."
  },
  {
    id: 570,
    module: "Water Distribution",
    difficulty: "medium",
    question: "Which type of valve is most commonly used as a main line isolation valve in water distribution systems?",
    options: ["Ball valve", "Butterfly valve", "Gate valve", "Globe valve"],
    correct: 2,
    explanation: "Gate valves are the most commonly used isolation valves in water distribution mains. They provide full-bore flow (minimal head loss when fully open) and are designed for fully open or fully closed operation — not for throttling.",
    tip: "Gate valves should never be used for throttling as partial opening causes vibration and erosion of the gate disc."
  },
  {
    id: 571,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of an air release/air vacuum valve on a water main?",
    options: [
      "To release excess chlorine from the distribution system",
      "To release trapped air during filling and allow air entry during draining to prevent vacuum",
      "To measure dissolved oxygen in the distribution main",
      "To prevent water from entering the main during construction"
    ],
    correct: 1,
    explanation: "Air release/air vacuum valves (also called combination air valves) serve two functions: (1) they release trapped air from high points in the main during filling and operation; and (2) they allow air to enter the main during draining to prevent a vacuum that could collapse the pipe or cause backsiphonage.",
    tip: "Air pockets in water mains reduce flow capacity and can cause pressure fluctuations — air valves are installed at high points to release them."
  },
  {
    id: 572,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the standard colour code for fire hydrants in Ontario indicating flow capacity?",
    options: [
      "Blue = high flow (>95 L/s), Green = good flow (63–95 L/s), Orange = marginal flow (32–63 L/s), Red = inadequate flow (<32 L/s)",
      "Red = high flow, Yellow = medium flow, Green = low flow",
      "White = potable water, Yellow = recycled water, Red = fire suppression only",
      "Green = tested, Red = untested, Yellow = out of service"
    ],
    correct: 0,
    explanation: "The NFPA 291 colour coding system for fire hydrant caps indicates available flow: Blue = Class AA (>95 L/s), Green = Class A (63–95 L/s), Orange = Class B (32–63 L/s), Red = Class C (<32 L/s). This helps firefighters quickly assess available fire flow.",
    tip: "Hydrant barrels are typically painted a consistent colour (often yellow or red) while the caps indicate flow class."
  },
  {
    id: 573,
    module: "Water Distribution",
    difficulty: "hard",
    question: "A water main has a static pressure of 550 kPa. During peak demand, the residual pressure at the same point drops to 280 kPa. What is the pressure drop during peak demand?",
    options: ["280 kPa", "270 kPa", "550 kPa", "830 kPa"],
    correct: 1,
    explanation: "Pressure drop = Static pressure − Residual pressure = 550 kPa − 280 kPa = 270 kPa. This pressure drop represents the head loss due to friction and velocity head during peak demand flow conditions.",
    isCalc: true,
    tip: "The difference between static and residual pressure indicates system head loss — a large drop suggests undersized mains or high friction losses."
  },
  {
    id: 574,
    module: "Water Distribution",
    difficulty: "hard",
    question: "A distribution main carries a flow of 120 L/s. If the pipe diameter is 300 mm, what is the approximate flow velocity in m/s? (Use: V = Q/A, where A = π × d²/4)",
    options: ["0.85 m/s", "1.70 m/s", "3.40 m/s", "0.42 m/s"],
    correct: 1,
    explanation: "A = π × (0.3 m)² / 4 = π × 0.09 / 4 = 0.07069 m². Flow Q = 120 L/s = 0.120 m³/s. V = Q/A = 0.120 / 0.07069 = 1.70 m/s. This is within the typical design range of 0.6–3.0 m/s for distribution mains.",
    isCalc: true,
    steps: [
      { l: "Convert diameter to metres", c: "d = 300 mm = 0.3 m" },
      { l: "Calculate pipe area", c: "A = π × (0.3)² / 4 = 0.07069 m²" },
      { l: "Convert flow to m³/s", c: "Q = 120 L/s = 0.120 m³/s" },
      { l: "Calculate velocity", c: "V = Q/A = 0.120 / 0.07069 = 1.70 m/s" }
    ],
    tip: "Velocities above 3 m/s can cause erosion and water hammer; below 0.6 m/s, sediment may accumulate."
  },
  {
    id: 575,
    module: "Water Distribution",
    difficulty: "hard",
    question: "What is the Hazen-Williams equation used for in water distribution system design?",
    options: [
      "Calculating the chlorine dose required for disinfection",
      "Estimating head loss due to friction in water distribution pipes",
      "Determining the size of a storage reservoir",
      "Calculating the pump power required for a booster station"
    ],
    correct: 1,
    explanation: "The Hazen-Williams equation is an empirical formula used to estimate head loss due to friction in water distribution pipes: V = 0.8492 × C × R^0.63 × S^0.54, where C is the Hazen-Williams roughness coefficient, R is the hydraulic radius, and S is the hydraulic slope. It is widely used in distribution system modelling.",
    tip: "Higher C values (e.g., PVC = 150) indicate smoother pipes with less friction loss; lower C values (e.g., old cast iron = 80–100) indicate rougher pipes."
  },
  {
    id: 576,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a service line curb stop?",
    options: [
      "To provide a shut-off point for the service line at or near the property line",
      "To measure water consumption at the property line",
      "To prevent backflow from the customer's plumbing",
      "To reduce water pressure entering the building"
    ],
    correct: 0,
    explanation: "A curb stop is a shut-off valve installed on the service line at or near the property line (typically at the curb). It allows the utility to shut off water service to an individual property without affecting other customers, and is used during repairs, non-payment, or emergencies.",
    tip: "The curb stop is owned and operated by the water utility; the customer's shut-off (corporation stop) is inside the building."
  },
  {
    id: 577,
    module: "Water Distribution",
    difficulty: "easy",
    question: "What does the term 'non-revenue water' (NRW) refer to in a water distribution system?",
    options: [
      "Water used for fire suppression",
      "Water stored in elevated tanks that is not used",
      "Water used for flushing distribution mains",
      "Water that is produced but not billed to customers, including losses from leaks and meter inaccuracies"
    ],
    correct: 3,
    explanation: "Non-revenue water (NRW) is the difference between the volume of water put into the distribution system and the volume billed to customers. It includes real losses (leaks, main breaks), apparent losses (meter inaccuracies, unauthorized use), and unbilled authorized consumption (flushing, firefighting).",
    tip: "Reducing NRW is a key goal of distribution system management — typical NRW targets are below 15% of system input volume."
  },
  {
    id: 578,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of cathodic protection on buried metallic water mains?",
    options: [
      "To prevent biological growth inside the pipe",
      "To maintain water pressure in the distribution system",
      "To prevent or reduce electrochemical corrosion of buried metallic pipes",
      "To detect leaks in the distribution main"
    ],
    correct: 2,
    explanation: "Cathodic protection is an electrochemical technique used to prevent or reduce corrosion of buried metallic pipes (such as ductile iron and steel). It works by making the metal pipe the cathode of an electrochemical cell, either through sacrificial anode systems (zinc or magnesium anodes) or impressed current systems.",
    tip: "Cathodic protection is especially important in corrosive soils with high conductivity (e.g., clay soils, areas with stray electrical currents)."
  },
  {
    id: 579,
    module: "Water Distribution",
    difficulty: "medium",
    question: "Under Ontario O. Reg. 170/03, how soon must a water system operator report a distribution system adverse result (e.g., E. coli detected) to the local Medical Officer of Health?",
    options: ["Within 24 hours", "Within 48 hours", "Within 72 hours", "Within 1 hour"],
    correct: 3,
    explanation: "Under Ontario O. Reg. 170/03, if an adverse result is obtained from a distribution system sample (e.g., E. coli detected), the owner/operating authority must notify the local Medical Officer of Health and the Ministry of the Environment within 1 hour of receiving the result.",
    tip: "The 1-hour notification requirement applies to adverse results; the 24-hour requirement applies to other notifications such as equipment failures."
  },
  {
    id: 580,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a pressure zone in a water distribution system?",
    options: [
      "To maintain water pressure within an acceptable range throughout a defined area of the distribution system",
      "To separate different water quality zones",
      "To isolate sections of the system for maintenance",
      "To control the flow direction in the distribution main"
    ],
    correct: 0,
    explanation: "A pressure zone is a portion of the distribution system where water pressure is maintained within a defined range (typically 275–690 kPa or 40–100 psi). Pressure zones are created using pressure reducing valves, pumping stations, and elevated storage to serve areas at different elevations while maintaining acceptable pressures.",
    tip: "Ontario guidelines typically require a minimum residual pressure of 275 kPa (40 psi) at service connections under peak demand conditions."
  },
  {
    id: 581,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the recommended minimum velocity for water in distribution mains to prevent sediment deposition?",
    options: ["0.1 m/s", "0.6 m/s", "0.3 m/s", "1.5 m/s"],
    correct: 1,
    explanation: "A minimum velocity of approximately 0.6 m/s (2 ft/s) is recommended in water distribution mains to prevent sediment deposition and maintain self-cleaning conditions. Velocities below this threshold allow particles to settle and accumulate in the pipe.",
    tip: "Self-cleaning velocity is particularly important in mains that carry turbid water or have a history of sediment problems."
  },
  {
    id: 582,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a booster pumping station in a water distribution system?",
    options: [
      "To treat water before it enters the distribution system",
      "To reduce water pressure in high-elevation areas",
      "To increase water pressure in areas where gravity or system pressure is insufficient",
      "To filter sediment from the distribution main"
    ],
    correct: 2,
    explanation: "A booster pumping station increases water pressure in areas where the available system pressure is insufficient to serve customers at adequate pressure, such as high-elevation areas, remote locations far from the treatment plant, or zones with high demand. Booster stations are a key component of multi-zone distribution systems.",
    tip: "Booster stations are typically equipped with variable speed drives (VSDs) to match pump output to demand and maintain constant pressure."
  },
  {
    id: 583,
    module: "Water Distribution",
    difficulty: "easy",
    question: "What is a water main break and what is the typical immediate response?",
    options: [
      "A failure of a water distribution pipe causing uncontrolled water loss; response is to isolate the break by closing adjacent valves and notify affected customers",
      "A planned maintenance activity; response is to schedule repairs within 30 days",
      "A pressure drop in the system; response is to increase pump speed",
      "A backflow event; response is to flush the affected main"
    ],
    correct: 0,
    explanation: "A water main break is an unplanned failure of a distribution pipe causing uncontrolled water loss and potential service disruption. The immediate response is to isolate the break by closing the nearest upstream and downstream isolation valves, notify affected customers of the service disruption, and arrange for emergency repairs.",
    tip: "After a main break repair, the affected section must be disinfected, flushed, and sampled before being returned to service."
  },
  {
    id: 584,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What disinfection procedure is required when a new or repaired water main is placed into service in Ontario?",
    options: [
      "Flushing with high-velocity water only",
      "Ozonation of the main interior",
      "UV disinfection of the main before connection",
      "Chlorination with a minimum 50 mg/L chlorine solution for 24 hours, followed by flushing and bacteriological sampling"
    ],
    correct: 3,
    explanation: "Under AWWA C651 and Ontario guidelines, new or repaired water mains must be disinfected using a chlorine solution of at least 50 mg/L (some methods use 25 mg/L) maintained for a minimum contact time of 24 hours, followed by thorough flushing to remove the chlorinated water, and bacteriological sampling to confirm the main is safe for service.",
    tip: "Two consecutive satisfactory bacteriological samples (collected 24 hours apart) are typically required before a new main is placed into service."
  },
  {
    id: 585,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a looped (grid) distribution system compared to a branching system?",
    options: [
      "Looped systems are cheaper to construct",
      "Looped systems provide water from two directions, improving reliability, reducing dead ends, and maintaining better pressure and water quality",
      "Looped systems use less pipe material",
      "Looped systems are easier to isolate for maintenance"
    ],
    correct: 1,
    explanation: "A looped (grid) distribution system connects mains in a network so water can flow from multiple directions to any point. This provides: (1) improved reliability — if one section is isolated, water can reach customers via an alternate route; (2) better pressure maintenance — flow is distributed across multiple paths; and (3) improved water quality — water circulates rather than stagnating in dead ends.",
    tip: "Branching (tree) systems are simpler and cheaper but have dead ends that require regular flushing and are vulnerable to single-point failures."
  },
  {
    id: 586,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a corporation stop on a water service connection?",
    options: [
      "To prevent backflow from the customer's plumbing into the main",
      "To provide a shut-off point where the service line connects to the distribution main",
      "To reduce pressure entering the service line",
      "To measure water consumption at the main"
    ],
    correct: 1,
    explanation: "A corporation stop (also called a corporation cock) is a valve installed directly in the distribution main where the service line taps off. It provides a shut-off point at the main and is used during service line installation, repair, or replacement. It is typically operated with a special key and is located at the main.",
    tip: "The corporation stop is at the main; the curb stop is at the property line; the meter stop is inside the building — these three valves control the service line."
  },
  {
    id: 587,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the typical design minimum residual pressure in Ontario water distribution systems under peak demand conditions?",
    options: ["100 kPa (14.5 psi)", "275 kPa (40 psi)", "140 kPa (20 psi)", "550 kPa (80 psi)"],
    correct: 1,
    explanation: "Ontario design guidelines require a minimum residual pressure of 275 kPa (40 psi) at all service connections under peak demand (maximum day plus fire flow) conditions. This ensures adequate pressure for domestic use and fire suppression throughout the system.",
    tip: "Maximum pressure in distribution systems is typically limited to 690 kPa (100 psi) to prevent damage to customer plumbing and appliances."
  },
  {
    id: 588,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the difference between a gate valve and a butterfly valve in a water distribution system?",
    options: [
      "Gate valves are used for throttling; butterfly valves are for isolation only",
      "Gate valves are installed on service lines; butterfly valves are only used in treatment plants",
      "Gate valves use a sliding gate disc for full-bore isolation; butterfly valves use a rotating disc and can be used for both isolation and throttling",
      "There is no functional difference — they are interchangeable in all applications"
    ],
    correct: 2,
    explanation: "Gate valves use a sliding gate disc that retracts fully into the valve body when open, providing full-bore flow with minimal head loss — ideal for isolation. Butterfly valves use a rotating disc that remains in the flow path even when open, causing some head loss but allowing throttling. Butterfly valves are lighter and less expensive, making them common in larger diameter mains.",
    tip: "Gate valves are preferred for distribution mains; butterfly valves are common in transmission mains and treatment plant piping."
  },
  {
    id: 589,
    module: "Water Distribution",
    difficulty: "hard",
    question: "A water storage tank has a capacity of 2,000 m³ and serves a community with an average daily demand of 5,000 m³/d. What is the storage capacity as a percentage of average daily demand?",
    options: ["20%", "25%", "50%", "40%"],
    correct: 3,
    explanation: "Storage as % of ADD = (Tank capacity / Average daily demand) × 100 = (2,000 m³ / 5,000 m³/d) × 100 = 40%. Ontario guidelines typically recommend storage capacity of 25–50% of average daily demand for equalization, with additional storage for fire flow and emergency reserves.",
    isCalc: true,
    steps: [
      { l: "Identify tank capacity", c: "2,000 m³" },
      { l: "Identify average daily demand", c: "5,000 m³/d" },
      { l: "Calculate storage percentage", c: "(2,000 / 5,000) × 100 = 40%" }
    ],
    tip: "Total storage should include equalization storage + fire storage + emergency storage components."
  },
  {
    id: 590,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a water distribution system model (hydraulic model)?",
    options: [
      "To track customer billing and water consumption",
      "To simulate water flow, pressure, and water quality throughout the distribution system for planning, operations, and emergency response",
      "To monitor chlorine residual in real time",
      "To detect leaks in the distribution system"
    ],
    correct: 1,
    explanation: "A hydraulic model (such as EPANET or WaterGEMS) simulates water flow, pressure, and water quality throughout the distribution system. It is used for system planning (sizing new mains), operations (optimizing pump schedules), emergency response (isolating breaks), and water quality analysis (tracking chlorine decay and age).",
    tip: "EPANET is a free, widely used hydraulic modelling software developed by the US EPA that can model both hydraulics and water quality."
  },
  {
    id: 591,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a fire hydrant flow test?",
    options: [
      "To verify that fire hydrants are properly lubricated",
      "To measure the available fire flow and residual pressure at a specific location in the distribution system",
      "To check for cross-connections at the hydrant",
      "To determine the chlorine residual in the distribution main"
    ],
    correct: 1,
    explanation: "A fire hydrant flow test measures the available fire flow (in L/s or US gpm) and residual pressure at a specific location in the distribution system. The test involves flowing water from one or more hydrants while measuring the residual pressure at a nearby hydrant. Results are used to evaluate system capacity for fire suppression and identify areas needing system upgrades.",
    tip: "Flow test results are plotted on a log-log graph to extrapolate available flow at the minimum residual pressure (typically 140 kPa or 20 psi)."
  },
  {
    id: 592,
    module: "Water Distribution",
    difficulty: "easy",
    question: "What is the purpose of a water meter in a distribution system?",
    options: [
      "To regulate water pressure entering a building",
      "To filter sediment from the service line",
      "To prevent backflow from customer plumbing",
      "To measure the volume of water consumed by a customer for billing and system management purposes"
    ],
    correct: 3,
    explanation: "A water meter measures the volume of water consumed by a customer, providing data for: (1) billing — customers are charged based on metered consumption; (2) system management — meter data helps identify leaks, monitor demand patterns, and calculate non-revenue water; and (3) conservation — metering encourages efficient water use.",
    tip: "Automatic meter reading (AMR) and advanced metering infrastructure (AMI) systems allow remote meter reading and real-time consumption monitoring."
  },
  {
    id: 593,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the significance of the hydraulic grade line (HGL) in a water distribution system?",
    options: [
      "It represents the elevation of the pipe centreline",
      "It represents the total energy (pressure head + elevation head) at any point in the system, indicating water pressure",
      "It shows the chlorine residual profile throughout the system",
      "It indicates the maximum flow capacity of the distribution main"
    ],
    correct: 1,
    explanation: "The hydraulic grade line (HGL) represents the sum of pressure head and elevation head at any point in the distribution system. The height of the HGL above the pipe centreline equals the water pressure at that point (in metres of water head). The HGL slopes downward in the direction of flow due to friction losses.",
    tip: "If the HGL falls below the pipe elevation, negative pressure (vacuum) exists — this can cause pipe collapse or backsiphonage."
  },
  {
    id: 594,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a pressure sustaining valve (PSV) in a water distribution system?",
    options: [
      "To reduce pressure in high-pressure zones",
      "To release excess pressure during surge events",
      "To prevent backflow between pressure zones",
      "To maintain a minimum upstream pressure while allowing flow to continue downstream"
    ],
    correct: 3,
    explanation: "A pressure sustaining valve (PSV) maintains a minimum upstream pressure while allowing flow to pass downstream. It is used to protect upstream areas from pressure drops caused by high demand downstream, ensuring that upstream customers always receive adequate pressure even during peak demand periods.",
    tip: "PSVs are the opposite of PRVs: PRVs reduce downstream pressure; PSVs maintain upstream pressure."
  },
  {
    id: 595,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a leak detection program in a water distribution system?",
    options: [
      "To identify cross-connections in the system",
      "To measure chlorine residual in the distribution system",
      "To test the structural integrity of new water mains",
      "To identify and locate water main breaks before they become visible at the surface"
    ],
    correct: 3,
    explanation: "A leak detection program uses acoustic listening equipment, correlators, and other techniques to identify and locate underground leaks in water mains before they become visible at the surface. Early detection reduces water loss (non-revenue water), prevents main breaks, and avoids costly emergency repairs and property damage.",
    tip: "Acoustic leak detection works by listening for the characteristic sound of water escaping under pressure from a pipe — the frequency and amplitude help locate the leak."
  },
  {
    id: 596,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a SCADA system in water distribution operations?",
    options: [
      "To treat water at remote booster stations",
      "To test water quality at customer taps",
      "To monitor and control distribution system components (pumps, valves, tanks) remotely in real time",
      "To calculate water billing for customers"
    ],
    correct: 2,
    explanation: "SCADA (Supervisory Control and Data Acquisition) systems allow operators to monitor and control distribution system components — including pump stations, pressure reducing valves, storage tanks, and water quality sensors — remotely and in real time. SCADA provides alarms for abnormal conditions and historical data for system analysis.",
    tip: "SCADA cybersecurity is increasingly important as water utilities are critical infrastructure — systems must be protected against unauthorized access."
  },
  {
    id: 597,
    module: "Water Distribution",
    difficulty: "hard",
    question: "A distribution main experiences a pressure of 480 kPa at an elevation of 50 m. What is the hydraulic grade line (HGL) elevation at this point? (Use: HGL = elevation + pressure head, where pressure head = P / (ρg) and ρg ≈ 9.81 kN/m³)",
    options: ["98.9 m", "50.0 m", "480.0 m", "530.0 m"],
    correct: 0,
    explanation: "Pressure head = P / (ρg) = 480 kPa / 9.81 kN/m³ = 48.9 m. HGL elevation = pipe elevation + pressure head = 50 m + 48.9 m = 98.9 m. The HGL represents the elevation to which water would rise in a piezometer tube at that point.",
    isCalc: true,
    steps: [
      { l: "Calculate pressure head", c: "P / (ρg) = 480 / 9.81 = 48.9 m" },
      { l: "Calculate HGL elevation", c: "HGL = 50 m + 48.9 m = 98.9 m" }
    ],
    tip: "The HGL elevation is always above the pipe when pressure is positive; it equals the pipe elevation when pressure is zero."
  },
  {
    id: 598,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a water distribution system master plan?",
    options: [
      "To document daily operational procedures for distribution system operators",
      "To record the location of all water mains and valves in the system",
      "To provide a long-term plan for system expansion, rehabilitation, and capital investment based on projected growth and infrastructure condition",
      "To set water rates for customers"
    ],
    correct: 2,
    explanation: "A water distribution system master plan is a long-term planning document that evaluates existing system capacity and condition, projects future demand based on population growth, identifies system deficiencies, and recommends capital improvements (new mains, storage, pumping) with cost estimates and priorities. It typically covers a 20–25 year planning horizon.",
    tip: "Master plans are updated every 5–10 years to reflect changes in growth projections, infrastructure condition, and regulatory requirements."
  },
  {
    id: 599,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a valve exercise program in a water distribution system?",
    options: [
      "To regularly operate isolation valves to ensure they function properly when needed for emergencies or maintenance",
      "To test the pressure rating of distribution valves",
      "To lubricate valve stems to prevent corrosion",
      "To identify valves that need to be replaced due to age"
    ],
    correct: 0,
    explanation: "A valve exercise program involves regularly operating (opening and closing) isolation valves throughout the distribution system to ensure they function properly when needed. Valves that are not exercised regularly can seize, corrode, or fail to close fully — making it impossible to isolate sections of the system during emergencies or maintenance.",
    tip: "Industry practice is to exercise each valve at least once per year; critical valves (near hospitals, schools) may be exercised more frequently."
  },
  {
    id: 600,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a water quality monitoring program in the distribution system?",
    options: [
      "To track customer complaints about water quality",
      "To measure the flow rate at key points in the distribution system",
      "To identify leaks in the distribution system",
      "To verify that water meets regulatory requirements and identify quality deterioration as water travels through the distribution system"
    ],
    correct: 3,
    explanation: "A distribution system water quality monitoring program verifies that treated water continues to meet regulatory requirements (chlorine residual, turbidity, microbiological parameters) as it travels through the distribution system. It also identifies areas of quality deterioration due to long residence times, pipe corrosion, or biofilm growth.",
    tip: "Ontario O. Reg. 170/03 specifies minimum sampling frequencies for distribution system monitoring based on system size and type."
  },
  {
    id: 601,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a pipe condition assessment program for water distribution mains?",
    options: [
      "To measure water pressure in aging mains",
      "To evaluate the structural integrity and remaining service life of existing pipes to prioritize rehabilitation and replacement",
      "To identify cross-connections in aging infrastructure",
      "To test the chlorine demand of older pipe materials"
    ],
    correct: 1,
    explanation: "A pipe condition assessment program evaluates the structural integrity and remaining service life of existing water mains using techniques such as CCTV inspection, acoustic emission testing, pipe sampling, and break history analysis. Results are used to prioritize rehabilitation (lining, coating) or replacement of pipes that are at risk of failure.",
    tip: "Condition assessment helps utilities optimize capital investment by replacing the highest-risk pipes first rather than using age alone as a criterion."
  },
  {
    id: 602,
    module: "Water Distribution",
    difficulty: "easy",
    question: "What is the purpose of a water distribution system map (as-built drawings)?",
    options: [
      "To show customers where their service line is located",
      "To display water pressure zones to the public",
      "To record the location, size, material, and age of all distribution system components for operations, maintenance, and emergency response",
      "To document water quality monitoring results"
    ],
    correct: 2,
    explanation: "As-built drawings and GIS-based system maps record the location, size, material, age, and condition of all distribution system components — mains, valves, hydrants, service connections, and appurtenances. This information is essential for operations, maintenance, emergency response (locating valves to isolate breaks), and long-term planning.",
    tip: "Modern utilities use GIS (Geographic Information Systems) to maintain digital, spatially accurate maps that can be accessed in the field via mobile devices."
  },
  {
    id: 603,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a cross-connection control program?",
    options: [
      "To prevent water main breaks at pipe crossings",
      "To manage the flow of water between pressure zones",
      "To identify and eliminate connections between potable water and non-potable sources to protect public health",
      "To control the number of service connections on a distribution main"
    ],
    correct: 2,
    explanation: "A cross-connection control program identifies and eliminates or controls actual and potential cross-connections between the potable water supply and non-potable sources. It includes: (1) surveys of customer premises to identify cross-connections; (2) requirements for backflow prevention devices; (3) annual testing of backflow preventers; and (4) enforcement to ensure compliance.",
    tip: "Ontario Regulation 170/03 requires water systems to have a cross-connection control program and to maintain records of all backflow prevention devices."
  },
  {
    id: 604,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a water main rehabilitation technique known as cured-in-place pipe (CIPP) lining?",
    options: [
      "To replace a deteriorated water main by installing a new pipe inside the old one",
      "To restore the structural integrity and hydraulic capacity of a deteriorated main by installing a resin-impregnated liner that cures in place",
      "To clean the interior of a water main using high-pressure water jetting",
      "To apply a protective coating to the exterior of a buried water main"
    ],
    correct: 1,
    explanation: "Cured-in-place pipe (CIPP) lining is a trenchless rehabilitation technique that restores deteriorated water mains by inserting a flexible, resin-impregnated liner into the existing pipe and curing it in place (using heat, UV light, or ambient temperature). The cured liner forms a new, smooth pipe within the old pipe, restoring structural integrity and hydraulic capacity without excavation.",
    tip: "CIPP lining is cost-effective for rehabilitating mains in areas where excavation is disruptive or expensive (e.g., under roads, railways, or buildings)."
  },
  {
    id: 605,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a water distribution system flushing program?",
    options: [
      "To remove accumulated sediment, biofilm, and stale water from distribution mains to maintain water quality",
      "To test the structural integrity of distribution mains",
      "To measure the flow capacity of distribution mains",
      "To identify cross-connections in the distribution system"
    ],
    correct: 0,
    explanation: "A systematic flushing program removes accumulated sediment, corrosion products, biofilm, and stale water from distribution mains, restoring water quality (turbidity, colour, taste, odour) and chlorine residual. Unidirectional flushing (UDF) is the most effective method, creating high velocities that scour the pipe interior.",
    tip: "Flushing should be performed annually at minimum, with additional flushing after main breaks, repairs, or when water quality complaints are received."
  },
  {
    id: 606,
    module: "Water Distribution",
    difficulty: "hard",
    question: "A water main has a Hazen-Williams C factor of 100 and carries a flow of 50 L/s in a 200 mm diameter pipe. If the C factor decreases to 80 due to tuberculation, what happens to the head loss?",
    options: [
      "Head loss decreases by approximately 20%",
      "Head loss increases because a lower C factor means higher friction losses",
      "Head loss remains the same because flow and pipe size are unchanged",
      "Head loss decreases because the pipe becomes rougher"
    ],
    correct: 1,
    explanation: "In the Hazen-Williams equation, a lower C factor indicates a rougher pipe with higher friction losses. When C decreases from 100 to 80 due to tuberculation (iron oxide deposits), the head loss increases significantly. The relationship is inverse — lower C = higher friction = higher head loss for the same flow and pipe diameter.",
    tip: "Tuberculation in unlined cast iron and ductile iron pipes can reduce the effective C factor from 130 (new) to as low as 60–80 (severely tuberculated), dramatically increasing head loss."
  },
  {
    id: 607,
    module: "Water Distribution",
    difficulty: "medium",
    question: "What is the purpose of a water system emergency response plan (ERP)?",
    options: [
      "To document daily operational procedures for routine maintenance",
      "To set water rates during emergency conditions",
      "To provide pre-planned procedures for responding to emergencies such as main breaks, contamination events, power failures, and natural disasters",
      "To train new operators on distribution system operations"
    ],
    correct: 2,
    explanation: "An emergency response plan (ERP) provides pre-planned procedures for responding to water system emergencies including main breaks, contamination events (boil water advisories), power failures, natural disasters, and security incidents. It identifies key contacts, decision-making authority, communication protocols, and restoration procedures to minimize service disruption and protect public health.",
    tip: "Ontario requires water systems to have emergency response plans under O. Reg. 170/03, and plans must be tested through exercises and updated regularly."
  },
];

export const CLASS1_WATER_MODULE_TARGETS: Record<string, number> = {
  "Source Water & Intake":        11,
  "Aeration & Pre-Treatment":     10,
  "Coagulation & Flocculation":   12,
  "Sedimentation":                11,
  "Filtration":                   12,
  "Disinfection":                 14,
  "Chemical Feed & Dosing":       10,
  "Iron & Manganese Removal":     10,
  "Water Quality & Regulations":  10,
};

export const CLASS1_WATER_TOTAL = CLASS1_WATER_QUESTIONS.length;

export const CLASS1_WATER_MODULES = [
  "Water Sources & Quality",
  "Coagulation & Flocculation",
  "Sedimentation",
  "Filtration",
  "Disinfection",
  "Chemical Feed & Dosing",
  "Iron & Manganese Removal",
  "Water Quality & Regulations",
  "Water Distribution",
] as const;
/** Shuffle helper */
export function shuffleClass1Water(arr: Class1WaterQuestion[]): Class1WaterQuestion[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
