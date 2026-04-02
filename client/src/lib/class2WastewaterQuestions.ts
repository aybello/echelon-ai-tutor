// Class 2 Wastewater Treatment — 500-question bank
// Source: RoyCEU WW Study Guide 2 + original questions

export interface WastewaterQuestion {
  id: number;
  module: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface WastewaterModule {
  name: string;
  color: string;
  icon: string;
  questions: WastewaterQuestion[];
}

export const CLASS2_WW_QUESTIONS: WastewaterQuestion[] = [
  {
    "id": 1,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which type of wastewater typically has the highest demand for oxygen?",
    "options": [
      "Domestic",
      "Storm water",
      "Sanitary",
      "Industrial"
    ],
    "correct": 3,
    "explanation": "Most industrial waste streams have very high BOD, COD and or TSS concentrations. Industrial waste discharges typically have a higher demand for oxygen as compared to domestic waste streams or storm water."
  },
  {
    "id": 2,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the term for a liquid or sludge with a pH of 6.0?",
    "options": [
      "Alkaline",
      "Neutral",
      "Basic",
      "Acidic"
    ],
    "correct": 3,
    "explanation": "The pH scale is 0 to 14 … 0 to 6.9 is acidic … 7.0 is neutral … 7.1 to 14 is basic (alkaline). So, a sample with a pH of 6.0 is a fairly weak acid."
  },
  {
    "id": 3,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What are very small, finely‑divided solids known as:",
    "options": [
      "Settleable",
      "Total",
      "Colloidal",
      "Inert"
    ],
    "correct": 2,
    "explanation": "Colloidal is a general term for scattering of small particles of matter dispersed in a liquid, gas or solid. Common examples of colloidal body liquids are milk or blood."
  },
  {
    "id": 4,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which of the following best describes the term anoxic?",
    "options": [
      "High dissolved oxygen is present.",
      "Nearly anaerobic; very low dissolved oxygen but nitrates and/or nitrites are present.",
      "Completely anaerobic; no dissolved oxygen, nitrates, or nitrites.",
      "Nitrates are very low"
    ],
    "correct": 1,
    "explanation": "An anoxic condition occurs when the dissolved oxygen is very low (closest to zero is best), nitrates are present and a source of carbon is available. In biological denitrification systems, the natural CBOD5 is the carbon supply."
  },
  {
    "id": 5,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which is a higher life form in the activated sludge process ... a free swimming ciliate, a stalked ciliate, or a rotifer?",
    "options": [
      "Free swimming ciliate",
      "Stalked ciliate",
      "Rotifer",
      "They are all the same"
    ],
    "correct": 2,
    "explanation": "Beginning with the lowest life form, the microorganism indicators are amoebas, small flagellates, large flagellates, free swimming ciliates, stalk ciliates, rotifers, nematodes and water bears. So, of the three indicators listed in the question, the rotifer is the highest life form in the activated sludge process."
  },
  {
    "id": 6,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which term describes the conversion of ammonia nitrogen to oxidized nitrogen (usually nitrate)?",
    "options": [
      "Fermentation",
      "Log Growth",
      "Nitrification",
      "Denitrification"
    ],
    "correct": 2,
    "explanation": "Nitrification is the oxidation, or conversion, of ammonia to nitrites and nitrates. Nitrification, however, does not necessarily remove nitrogen from the water, it just converts it from one form to another."
  },
  {
    "id": 7,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What will organic material do in a muffle furnace?",
    "options": [
      "It will burn",
      "It will not burn",
      "It will chance to inorganic material",
      "It will convert to dissolved solids"
    ],
    "correct": 0,
    "explanation": "Organic material, and other volatile matter, will typically burn in a muffle furnace at temperatures of about 550oC. However, just because something burns in a muffle furnace does not necessarily mean that it is biological in nature."
  },
  {
    "id": 8,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the best definition of a shock load?",
    "options": [
      "An unexpected bump",
      "A strong influent waste strength",
      "A high concentration of TSS",
      "A heavy truck load entering the plant"
    ],
    "correct": 1,
    "explanation": "The term “loading” refers to the demand for oxygen placed on the activated sludge process from the flow being treated. A shock load is a high demand for oxygen (from CBOD5, COD or nitrogen) placed on the activated sludge process in a short period of time."
  },
  {
    "id": 9,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which environment does filamentous bacteria like best?",
    "options": [
      "Aerobic",
      "Anaerobic",
      "Facultative",
      "Anoxic"
    ],
    "correct": 0,
    "explanation": "Filamentous bacteria are strict aerobes. This means that filamentous bacteria must be provided dissolved oxygen to survive and grow. Unlike many forms of heterotrophic organisms, filamentous organisms cannot use combined forms of oxygen, like nitrites and nitrates, to grow and multiply."
  },
  {
    "id": 10,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What does one cubic foot of water weigh at 4°C?",
    "options": [
      "7.48 pounds",
      "8.34 pounds",
      "3.14159 pounds",
      "62.4 pounds"
    ],
    "correct": 3,
    "explanation": "One gallon of water at STP (standard temperature and pressure) weighs 8.34 pounds, and one cubic foot of water holds 7.48 gallons … therefore, one cubic foot of water weighs 62.383 pounds (8.34 x 7.48)."
  },
  {
    "id": 11,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which is a higher life form in the activated sludge process ... a free swimming ciliate or a stalked ciliate?",
    "options": [
      "Free swimming ciliate",
      "Stalked ciliate",
      "They are both the same",
      "Rotifers are younger than free swimmers"
    ],
    "correct": 1,
    "explanation": "Based on the typical growth curve of microorganisms, stalked ciliates are higher life forms than free swimming ciliates. When free swimmers are being taken over by stalks (stalk ciliates are becoming dominant over free swimming ciliates), this indicates that the sludge is getting older."
  },
  {
    "id": 12,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What does the \"F\" mean in the process parameter F/M ratio?",
    "options": [
      "lbs/day volatile microorganisms",
      "gpd plant flow",
      "lbs/day influent CBOD5",
      "gpd waste sludge"
    ],
    "correct": 2,
    "explanation": "The “F” actually means “food.” CBOD5 is the food supply for the volatile microorganisms … active bugs. An F/M ratio of, let’s say 0.15, means there are 0.15 pounds of food (CBOD5) available for each one pound of active, volatile microorganism (MLVSS). Or, differently said, there are 15 pounds of food for each 100 pounds of bugs."
  },
  {
    "id": 13,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What factor may be more important in maintaining efficient operation of a primary clarifier?",
    "options": [
      "Location of the tank",
      "Characteristics of the influent wastewater",
      "Number of operators in the facility",
      "Activated sludge SRT"
    ],
    "correct": 1,
    "explanation": "The characteristics of the influent (mainly the flow rate, concentrations of CBOD5, TSS and oil and grease, temperature and other criteria) probably has the largest impact on the overall performance of a primary clarifier."
  },
  {
    "id": 14,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the detention time in a primary clarifier that is 100 feet long, 25 feet wide, 14 feet deep, and the influent flow is 3.5 mgd?",
    "options": [
      "2.3 hours",
      "1.8 hours",
      "1.6 hours",
      "3.1 hours"
    ],
    "correct": 1,
    "explanation": "Detention time in hours = V/Q x 24 V = Volume of the tank in mg Q = Flow entering the tank in mgd"
  },
  {
    "id": 15,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What would be an unacceptable surface loading rate for a primary clarifier?",
    "options": [
      "400 to 600 gpd/ft2",
      "800 to 1,200 gpd/ft2",
      "100 to 300 gpd/ft2",
      "5,000 to 15,000 gpd/ft2"
    ],
    "correct": 3,
    "explanation": "Surface loading rate in gpd/ft2 determines how many gallons per day are applied to each square foot surface area of the tank. Primary clarifiers operate successfully at much higher surface loading rates compared to secondary clarifiers."
  },
  {
    "id": 16,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What factor may be the least important in maintaining efficient operation of a primary clarifier?",
    "options": [
      "Proper design of the tank",
      "Characteristics of the influent wastewater",
      "Care given by the operator",
      "F/M ratio"
    ],
    "correct": 3,
    "explanation": "Primary clarification is a physical process and is fairly unaffected by the biological process parameter of F/M ratio. F/M ratio is a process indicator to identify the basic “diet” of the active microorganisms in the activated sludge process."
  },
  {
    "id": 17,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What may be the better method of removing primary sludge from the clarifier?",
    "options": [
      "Large volumes only a few times each day",
      "Small volumes once each day",
      "Small volumes several times throughout the day",
      "When the blanket gets 1 foot from the weir"
    ],
    "correct": 2,
    "explanation": "Because primary sludge can turn septic (anaerobic) very quickly while in the sludge blanket, it should be removed on a frequent basis … at least every 30 to 60 minutes (or less)."
  },
  {
    "id": 18,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is a typical RAS to Q ratio for a conventional aeration activated sludge process?",
    "options": [
      "10% to 25%",
      "25% to 50%",
      "1% to 2%",
      "75% to 100%"
    ],
    "correct": 1,
    "explanation": "This may be a common R to Q ratio used for the conventional activated sludge process; however, specific conventional aeration plants may actually use higher or lower rates. Extended aeration RAS rates are typically about 75 to 100% … while contact stabilization rates may be 75 to 150 %."
  },
  {
    "id": 19,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which activated sludge growth phase is considered to have the highest F/M ratio, the lowest SRT, the highest sludge yield, and the best oxygen utilization efficiency?",
    "options": [
      "High rate aeration",
      "Extended aeration",
      "Conventional aeration",
      "Declining growth"
    ],
    "correct": 0,
    "explanation": "Looking at the growth curve of microorganisms, the far left side has high food availability, rapid bug growth, high yield of new cells, low solids inventory and excellent oxygen utilization transfer efficiency."
  },
  {
    "id": 20,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which group of bacteria is responsible for conversion of inorganic ammonia in wastewater?",
    "options": [
      "Carbon eaters",
      "Methanogens",
      "Autotrophic",
      "Heterotrophic"
    ],
    "correct": 2,
    "explanation": "There are two main groups of Autotrophic bacteria that are responsible for the conversion of inorganic ammonia to nitrate. The first group, known as ammonia-oxidizing bacteria, convert ammonia to nitrite."
  },
  {
    "id": 21,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which operating parameter is common for a conventional activated sludge process?",
    "options": [
      "D.O. between 4.0 to 5.5 mg/l",
      "SRT between 4 to 8 days",
      "RAS to Q ratio about 150%",
      "F/M ratio between 0.1 to 0.15"
    ],
    "correct": 1,
    "explanation": "The growth phase of microorganisms is basically divided into three (3) categories: 1) The most active phase, log growth, or high rate aeration, typically has an SRT of about 1 to 3 days."
  },
  {
    "id": 22,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the aeration tank MLVSS concentration? · Aeration MLSS is 2,500 mg/l · Aeration MLSS is 77% Volatile",
    "options": [
      "3,500 mg/l",
      "3,000 mg/l",
      "1,925 mg/l",
      "2,625 mg/l"
    ],
    "correct": 2,
    "explanation": "Mixed Liquor Volatile Suspended Solids (MLVSS) is a fractional part of the Mixed Liquor Total Suspended Solids (MLTSS) MLSS x % Volatile = MLVSS = 2,500 mg/l x 0.77 = 1,925 mg/l MLVSS"
  },
  {
    "id": 23,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the surface area of each secondary clarifier? · Two (2) Secondary Clarifiers, Each @ 100 ft. Diameter and 14 ft. Deep",
    "options": [
      "7,850 ft2",
      "3,925 ft2",
      "491 ft2",
      "1,963 ft2 diameter radius"
    ],
    "correct": 0,
    "explanation": "Surface Area =r2 =3.14 x 50 feet, x 50 feet =7,850 ft2"
  },
  {
    "id": 24,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the surface settling rate of the secondary clarifiers? · Influent Flow is 5.75 mgd · Two (2) Secondary Clarifiers, Each @ 100 ft. Diameter and 14 ft. Deep",
    "options": [
      "293 gal/day/ft2",
      "3,414 gal/day/ft2",
      "366 gal/day/ft2",
      "73 gal/day/ft2"
    ],
    "correct": 2,
    "explanation": "Surface Settling Rate, gpd/ft2 =Influent Flow Entering Clarifier, gpd Total Surface Area, ft2 =5,750,000 gpd 15,700 ft2 =366.2 gpd/ft2"
  },
  {
    "id": 25,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the solids loading rate on the secondary clarifiers? •Two (2) Secondary Clarifiers, Each @ 100 ft. Diameter and 14 ft. Deep •Aeration MLSS is 2,500 mg/l •Plant Flow is 5.75 mgd • RAS Rate is 65% of Q",
    "options": [
      "12.6 lbs/day/ft2",
      "8.6 lbs/day/ft2",
      "4.7 lbs/day/ft2",
      "9.9 lbs/day/ft2"
    ],
    "correct": 0,
    "explanation": "Clarifier Solids Loading Rate, lbs/day/ft2 =Total MLSS Entering Clarifier, lbs/day Clarifier Surface Area, ft2"
  },
  {
    "id": 26,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the SVI of this mixed liquor? · Settleometer @ 30 Minutes is 425 ml/l · Aeration MLSS is 2,500 mg/l",
    "options": [
      "5 . 8",
      "75",
      "125",
      "170"
    ],
    "correct": 3,
    "explanation": "SVI =30 min Settleability, ml/l x 1000 MLSS, mg/l = 425 ml/l x 1000 2,500 mg/l =170"
  },
  {
    "id": 27,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "How many gallons of WAS should be removed if a 10 day SRT is the desired target? · Aeration MLSS is 2,500 mg/l · Aeration volume is 0.7854 mg · WAS Concentration is 0.7% Total Solids · WAS Volume is 0.1 mgd",
    "options": [
      "7,642 gpd",
      "28,050 gpd",
      "14,025 gpd",
      "16,428 gpd"
    ],
    "correct": 1,
    "explanation": "WAS Removed, gpd =(Aeration MLSS, lbs  10 day SRT)  (WAS conc., ppm x 8.34 lbs/gal) x 1,000,000"
  },
  {
    "id": 28,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the detention time in the aeration system? (not including RAS flow) · Three Aeration Tanks, Each @ 100 ft. Long, 25 ft. Wide, and 14 ft. Deep · Influent Flow is 5.75 mgd",
    "options": [
      "1.1 hours",
      "10.9 hours",
      "3.3 hours",
      "9.0 hours"
    ],
    "correct": 2,
    "explanation": "Detention Time, hours =V/Q = Tank Volume, mg x 24 hrs/day Influent Flow Entering Tank, mgd"
  },
  {
    "id": 29,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the total length of weir for the secondary clarifiers? · Two (2) Secondary Clarifiers, Each @ 100 ft. Diameter and 14 ft. Deep · Each Secondary Clarifier has a Single Weir Around the Tank's Circumference",
    "options": [
      "628 feet",
      "912 feet",
      "314 feet",
      "157 feet"
    ],
    "correct": 0,
    "explanation": "Length of Weir, feet =Circumference =d =3.14 x 100 ft diameter x 2 tanks =628 feet"
  },
  {
    "id": 30,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "With all of the data and results for this plant, is the F/M ratio within an acceptable range? · Conventional Aeration · SRT is 2.8 days · SVI is 170 · F/M Ratio is 0.76 · Aeration detention Time is 3.3 hours",
    "options": [
      "Yes",
      "No",
      "The effluent quality is very poor",
      "Not enough data to calculate the F/M ratio"
    ],
    "correct": 1,
    "explanation": "Typical conventional activated sludge may have an F/M ratio of about 0.2 to 0.5 … this plant has an F/M ratio of 0.76 … this is on the high side. Decreasing the WAS rate will increase the MLSS inventory and decrease the F/M ratio."
  },
  {
    "id": 31,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "With all of the data and results for this plant, is the SRT within an acceptable range? · Conventional Aeration · SRT is 2.8 days · SVI is 170 · F/M Ratio is 0.76 · Aeration detention Time is 3.3 hours",
    "options": [
      "Yes",
      "No",
      "The effluent quality is very poor",
      "Not enough data to determine the SRT"
    ],
    "correct": 1,
    "explanation": "Typical conventional activated sludge plants may have an SRT of about 4 to 8 days … this plant has an SRT of 2.8 days … this is on the low side. Decreasing the WAS rate will increase the MLSS inventory and increase the SRT."
  },
  {
    "id": 32,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the principal function of slimes that accumulate on the trickling filter media?",
    "options": [
      "To filter out bacteria through sand media",
      "To remove large solids particles",
      "To oxidize organic material",
      "None of the above"
    ],
    "correct": 2,
    "explanation": "The trickling filter oxidizes organic matter as the wastewater is distributed (applied) over the surface of the process unit and trickles down through the media. The trickling filter oxidizes organic matter as the wastewater is distributed (applied) over the surface of the process unit and trickles down through the media. Organisms grow on and throughout the media resulting in oxidation of the organic matter. Organisms grow on and throughout the media resulting in oxidation of the organic matter."
  },
  {
    "id": 33,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What does a recirculation rate of 2:1 mean?",
    "options": [
      "There is 1 mg/l BOD5 being loaded to 1 ft2 of media",
      "The total flow applied to the trickling filter is 2 mgd",
      "The total flow applied to the trickling filter is twice the volume of the raw wastewater flow",
      "The flow applied to the trickling filter is three times the volume of the raw wastewater flow"
    ],
    "correct": 3,
    "explanation": "A recirculation rate of 2:1 means that for every gallon of influent flow, there are two gallons of recirculation flow. So, with a recirculation rate of 2:1, the total flow entering the trickling filter (influent plus recirculation) is three times the volume of the influent flow."
  },
  {
    "id": 34,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the total flow rate applied to a trickling filter that receives a raw wastewater flow of 0.5 mgd, and has a recirculation rate of 1:1?",
    "options": [
      "1.0 mgd",
      "2.0 mgd",
      "1.5 mgd",
      "2.5 mgd"
    ],
    "correct": 0,
    "explanation": "A recirculation rate of 1:1 means that for every gallon of influent flow, there is one gallon of recirculation flow. So, with an influent flow of 0.5 mgd, and a recirculation rate of 1:1, the total flow entering the trickling filter (influent plus recirculation) is 0.5 + 0.5, for a total of 1.0 mgd."
  },
  {
    "id": 35,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the principal make-up of slimes called that accumulate on the trickling filter media?",
    "options": [
      "Amoeba culture",
      "Zoogleal mass",
      "Rotifer growth",
      "None of the above"
    ],
    "correct": 1,
    "explanation": "Zoogleal mass is an aggregate of bacteria forming a jellylike mass with cell walls swollen by the absorption of water or other fluid."
  },
  {
    "id": 36,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What type of gas is generated in largest quantities as the result of anaerobic digestion taking place in a stabilization lagoon?",
    "options": [
      "Hydrogen sulfide",
      "Carbon dioxide",
      "Methane",
      "Nitrogen"
    ],
    "correct": 2,
    "explanation": "Anaerobic decomposition, bacterial activity in the absence of free dissolved oxygen, typically generates large quantities of methane gas. The other gases in the list may also exist in an anaerobic lagoon, but in smaller volumes."
  },
  {
    "id": 37,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What problems can be caused in a lagoon with long, hot operational periods?",
    "options": [
      "All bacteria may die",
      "Excessive algae growth overloads the lagoon",
      "Water level gets too low",
      "The D.O. gets too high"
    ],
    "correct": 1,
    "explanation": "Long, hot operational periods can cause algae overgrowth conditions due to extreme anaerobic decomposition."
  },
  {
    "id": 38,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What type of pond has high",
    "options": [
      "Aerobic",
      "Unaerated",
      "Fermentation",
      "Facultative"
    ],
    "correct": 0,
    "explanation": "This pond is equipped with some type of mechanical aerator for input of oxygen … typically, these ponds have floating mechanical aerators."
  },
  {
    "id": 39,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which time of day will generally have the lowest",
    "options": [
      "O. in an unaerated stabilization pond?",
      "12 midnight",
      "3 p.m.",
      "3 a.m."
    ],
    "correct": 3,
    "explanation": "An unaerated stabilization pond is provided D.O. by activity from algae. During the sunlight hours, algae convert carbon dioxide to oxygen via photosynthesis."
  },
  {
    "id": 40,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which group of bacteria are most responsible for removal of phosphorus in the BNR activated sludge process?",
    "options": [
      "SVI",
      "GSA",
      "Autotrophic",
      "PAO"
    ],
    "correct": 3,
    "explanation": "PAO, or phosphorus accumulating organisms, are responsible for the uptake and removal of phosphorus from the wastewater in a BNR activated sludge process."
  },
  {
    "id": 41,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which zone of a BNR plant produces a release of phosphorus and is responsible for conditioning the phosphorus for later uptake in the downstream zones?",
    "options": [
      "Anoxic",
      "Fermentation",
      "Aerobic",
      "Reaeration"
    ],
    "correct": 1,
    "explanation": "The fermentation zone of a Bardenpho process receives raw wastewater (usually after preliminary treatment) and return activated sludge (from secondary clarifiers). The MLSS is mixed and not aerated in the fermentation zone for a time period of about 1 to 3 hours."
  },
  {
    "id": 42,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which zone produces the largest amount of biological nitrification?",
    "options": [
      "Fermentation",
      "Anoxic",
      "Aerobic",
      "Reaeration"
    ],
    "correct": 2,
    "explanation": "Nitrification is strictly an aerobic process, and, the highest aerobic environment in a typical BNR system is the aeration tank (or aerobic zone). Nitrification, at an average oxygen consumption rate of about 4.6 lbs of O2 for each lb of NH3, converts ammonia nitrogen to nitrate nitrogen."
  },
  {
    "id": 43,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "How much alkalinity is required to convert 1.0 pound of ammonia-nitrogen during the nitrification process?",
    "options": [
      "7.2 lbs",
      "8.34 lbs",
      "7.48 lbs",
      "4.6 lbs"
    ],
    "correct": 0,
    "explanation": "Nitrification consumes alkalinity at the rate of about 7 to 7.2 lbs of alkalinity for each lb of ammonia oxidized. Because this action causes the mixed liquor pH to drop, biological denitrification is desirable, which replenishes the alkalinity at a rate of about 3.6 lbs of alkalinity for each lb of nitrate that is consumed as a source of oxygen."
  },
  {
    "id": 44,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which chemical is commonly used to remove phosphorus from wastewater?",
    "options": [
      "Lime",
      "Sodium Hydroxide",
      "Ferric chloride",
      "Aluminum sulfate"
    ],
    "correct": 3,
    "explanation": "Aluminum sulfate, or Alum, is the only chemical on this list that is typically used to Aluminum sulfate, or Alum, is the only chemical on this list that is typically used to remove phosphorus from wastewater. However, other chemicals have been used for phosphorus removal: sodium aluminate, lime, ferric chloride, and others."
  },
  {
    "id": 45,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Where does \"luxury phosphorus uptake\" occur in the Bardenpho process?",
    "options": [
      "Aerobic",
      "Fermentation",
      "Anoxic",
      "Reaeration"
    ],
    "correct": 0,
    "explanation": "Phosphorus uptake can occur in any zone that contains a source of oxygen. For example, the 1st anoxic zone of Bardenpho can (and usually does) accomplish minor phosphorus uptake through the action of denitrification."
  },
  {
    "id": 46,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "How much alkalinity is put back into the MLSS for each pound of nitrate used as a source of oxygen during the denitrification process?",
    "options": [
      "4.6 lbs",
      "7.2 lbs",
      "2.6 lbs",
      "3.6 lbs"
    ],
    "correct": 3,
    "explanation": "Denitrification replenishes alkalinity at the rate of about 3.6 of alkalinity for each lb of Denitrification replenishes alkalinity at the rate of about 3.6 of alkalinity for each lb of nitrate that is used as a source of oxygen."
  },
  {
    "id": 47,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which major reaction is most likely to occur in an anoxic zone of a BNR process?",
    "options": [
      "Nitrification",
      "Phosphorus uptake",
      "Denitrification",
      "Reaeration"
    ],
    "correct": 2,
    "explanation": "Denitrification is an anoxic reaction and will be typically accomplished at the highest rate in an anoxic zone with adequate food supply (CBOD5). The anoxic reaction is elevated to its highest potential when the bugs are hungry and active, the CBOD5 is plentiful, the tank is mixed without any oxygen transfer and the dissolved oxygen level is as close as possible to zero."
  },
  {
    "id": 48,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the amount of oxygen credit received for each ppm of nitrate used as a source of oxygen in the denitrification process?",
    "options": [
      "2.8 pounds",
      "3.6 pounds",
      "4.6 pounds",
      "7.2 pounds"
    ],
    "correct": 0,
    "explanation": "Denitrification provides a “credit” for oxygen. There are about 2.8 lbs of oxygen supplied to the MLSS for each ppm of nitrate used as a source of oxygen in the denitrification process."
  },
  {
    "id": 49,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which best describes the denitrification cycle?",
    "options": [
      "Nitrates are converted to free nitrogen gas",
      "Ammonia is converted to nitrites and then to nitrates",
      "Ammonia is converted to nitrates and then to nitrites",
      "Nitrates are converted to ammonia and then to nitrites"
    ],
    "correct": 0,
    "explanation": "Denitrification is a biological reduction process (without the need for dissolve oxygen) where nitrate is reduced to nitrite and then further reduced to free nitrogen gas. Denitrification is an anoxic reaction and will be typically accomplished at the highest rate in an anoxic zone with adequate food supply (CBOD5)."
  },
  {
    "id": 50,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which gas can cause clumps of sludge to rise in a secondary clarifier as a result of denitrification?",
    "options": [
      "Oxygen",
      "Carbon dioxide",
      "Hydrogen sulfide",
      "Nitrogen"
    ],
    "correct": 3,
    "explanation": "The end result of denitrification is the formation of nitrogen gas bubbles. When these bubbles are created in the clarifier sludge blanket, they can cause gas and sludge particles to rise to the surface."
  },
  {
    "id": 51,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which blanket detention time method is commonly used in the gravity thickening process?",
    "options": [
      "F/M",
      "SRT",
      "SVRT",
      "OUR"
    ],
    "correct": 2,
    "explanation": "The blanket detention time known as Sludge Volume Retention Time (SVRT) is typically used to calculate the sludge blanket detention time in the gravity thickener."
  },
  {
    "id": 52,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the total volume of the gravity thickener, including the cone volume, given the following data: · 50 ft. diameter · 12 ft. SWD · 3 ft. sludge blanket depth · 4 ft. cone depth",
    "options": [
      "176,154 gals",
      "19,578 gals",
      "324,578 gals",
      "195,777 gals"
    ],
    "correct": 3,
    "explanation": "Total tank volume = tank volume in gallons at SWD plus volume in gallons in the cone"
  },
  {
    "id": 53,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the detention time of the sludge blanket, given the following data: · 50 ft. diameter · 3 ft. sludge blanket depth · 100 KGPD thickened sludge removed · 4 ft. cone depth",
    "options": [
      "30.6 hours",
      "15.3 hours",
      "7.6 hours",
      "22.9 hours"
    ],
    "correct": 1,
    "explanation": "Detention Time of Sludge Blanket, hours also known as Sludge Volume Retention Time (SVRT) (gallons in blanket + gallons in cone) x 24 hr/day  gpd removed from the tank."
  },
  {
    "id": 54,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What device is used to blend polymer and sludge feed before it is applied to the GBT?",
    "options": [
      "Retention vessel",
      "Venturi mixer",
      "Chicane",
      "Drive unit"
    ],
    "correct": 1,
    "explanation": "Venturi Mixer Polymer Dosing Ring"
  },
  {
    "id": 55,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What does a gravity belt thickener most represent?",
    "options": [
      "The bottom half of a belt filter press",
      "A centrifuge",
      "The top half of a belt filter press",
      "A standard gravity thickener"
    ],
    "correct": 2,
    "explanation": "A gravity belt thickener consists of basically all of the components in the top half of a belt filter press. A GBT has a single belt with steering and tension controls, however, there is not a second belt or any pressure control devices."
  },
  {
    "id": 56,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Will sludge be more likely to sink or float when its specific gravity is greater than 1.0?",
    "options": [
      "It will sink",
      "It will float",
      "It will stay in suspension",
      "Specific gravity has no affect on flotation"
    ],
    "correct": 0,
    "explanation": "Material with a specific gravity greater than 1.0 will have a tendency to settle, or sink, due to its weight being heavier than water."
  },
  {
    "id": 57,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the principle concept of the centrifuge?",
    "options": [
      "Dewaters through pressure shearing",
      "Thickens through gravity drainage",
      "Thickens through high speed spinning",
      "Thickens through pressure filtration"
    ],
    "correct": 2,
    "explanation": "High speed spinning in a centrifuge (G force) is responsible for separating water from the sludge slurry. As water is removed and drained away, this results in increased solids concentration."
  },
  {
    "id": 58,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What may be a major difference in operating a centrifuge for sludge thickening as compared to operating a gravity belt thickener?",
    "options": [
      "The centrifuge requires a great deal more polymer to condition the sludge feed",
      "The gravity belt thickener typically requires much more maintenance than a centrifuge",
      "The centrifuge uses higher horsepower components than a gravity belt thickener",
      "The capital cost of a gravity belt thickener is typically much higher than a centrifuge"
    ],
    "correct": 2,
    "explanation": "In order to process equal volumes of sludge feed, a GBT may consist of a total of about 10 hp, while a centrifuge may have about 100 to 200 hp … or more."
  },
  {
    "id": 59,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the liquid effluent called in a centrifuge thickener?",
    "options": [
      "Filtrate",
      "Centrate",
      "Supernate",
      "Subnate"
    ],
    "correct": 1,
    "explanation": "It just is! Centrate comes from a centrifuge … filtrate come from a belt filter press, or plate and frame press."
  },
  {
    "id": 60,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What may be a major difference with a centrifuge for sludge thickening as compared to a gravity belt thickener?",
    "options": [
      "The centrifuge requires significantly more polymer to condition the sludge feed",
      "The gravity belt thickener typically requires much more maintenance than a centrifuge",
      "The centrifuge uses lower horsepower components than a gravity belt thickener",
      "The capital cost of a gravity belt thickener is typically much less than a centrifuge"
    ],
    "correct": 3,
    "explanation": "In order to process equal volumes of sludge feed, a GBT typically costs less than half of the cost of a centrifuge."
  },
  {
    "id": 61,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which sludge thickening process has one continuous belt that allows gravity drainage and thickening of the sludge feed?",
    "options": [
      "Gravity thickener",
      "Gravity belt thickener",
      "Dissolved air flotation",
      "Centrifuge"
    ],
    "correct": 1,
    "explanation": "A gravity belt thickener (GBT) system includes a single belt typically driven by an electric motor and drive train. The system has tension and steering systems that may be either hydraulic or pneumatic."
  },
  {
    "id": 62,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "\\Which sludge thickening process uses air- saturated recycle causing the sludge to rise to the surface of the tank for removal?",
    "options": [
      "Gravity thickener",
      "Gravity belt thickener",
      "Dissolved air flotation",
      "Centrifuge"
    ],
    "correct": 2,
    "explanation": "The Dissolved Air Flotation, or DAF, process thickens waste activated sludge by injecting injecting an air- saturate recycle stream into feed sludge … which then causes the sludge mixture to rise and float to the tank’s surface."
  },
  {
    "id": 63,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which sludge thickening process uses high speed spinning to accomplish thickening of the feed sludge?",
    "options": [
      "Gravity thickener",
      "Gravity belt thickener",
      "Dissolved air flotation",
      "Centrifuge"
    ],
    "correct": 3,
    "explanation": "A centrifuge uses high speed spinning (G force) which is responsible for separating water from the sludge slurry. As water is removed and drained away, this results in increased solids concentration."
  },
  {
    "id": 64,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which sludge thickening process uses an open tank, usually without any internal recycle streams, to accomplish thickening of the feed sludge?",
    "options": [
      "Gravity thickener",
      "Gravity belt thickener",
      "Dissolved air flotation",
      "Centrifuge"
    ],
    "correct": 0,
    "explanation": "Although the feed sludge to a gravity thickener is different than that of a secondary clarifier, the physical process reaction is similar … the separation and thickening of the feed material. Gravity thickener feed sludge is typically primary sludge or waste activated sludge."
  },
  {
    "id": 65,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which factor may have the least affect on the operation of an aerobic digester?",
    "options": [
      "Digester detention time",
      "Temperature of the digesting sludge",
      "Oxygen transfer efficiency",
      "Organic nitrogen level in the sludge feed"
    ],
    "correct": 3,
    "explanation": "Detention time, temperature and oxygen transfer efficiency are all important factors in the operation of an aerobic digester. The organic nitrogen content in the sludge feed has the least affect on determining digester performance."
  },
  {
    "id": 66,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which term is most related to vector attraction reduction in an aerobic digester?",
    "options": [
      "Settleometer",
      "Pathogen",
      "SOUR",
      "F/M"
    ],
    "correct": 2,
    "explanation": "Specific Oxygen Utilization Rate (SOUR) is used as a secondary method of testing for volatile solids reduction to achieve vector attraction reduction (VAR) of aerobically digested sludge. In order to satisfy the VAR requirement, SOUR must be no more than 1.5 mg/hr/gm total solids."
  },
  {
    "id": 67,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which statement best relates to adequate mixing in an aerobic digester?",
    "options": [
      "Not necessary only dissolved oxygen is important",
      "Accomplished with mechanical aerators only",
      "Accomplished with diffused air systems only",
      "Essential to ensure contact between organisms, food supply, and D.O."
    ],
    "correct": 3,
    "explanation": "Mixing the contents of an aerobic digester is essential to provide optimum performance. Mixing ensures adequate contact between the bugs, their food supply and the available dissolved oxygen."
  },
  {
    "id": 68,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What color should the digester gas be, as it is being burned in a waste gas burner, when the methane content is very high?",
    "options": [
      "Yellow",
      "Amber",
      "Green",
      "Blue"
    ],
    "correct": 3,
    "explanation": "High methane content will create a blue flame when the gas is burned. As the methane content decreases, and the carbon dioxide content increases, the flame will turn to a more yellow color."
  },
  {
    "id": 69,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What device is designed to protect the digester tanks and covers from damage?",
    "options": [
      "Hot water system",
      "Pressure/vacuum relief",
      "Gas recirculation compressor",
      "Drip trap"
    ],
    "correct": 1,
    "explanation": "Anaerobic digester tanks and covers can be damaged from either over-pressurization (high pressure) or under-pressurization (vacuum) conditions. A pressure/vacuum relief device is designed to prevent either of these conditions from occurring."
  },
  {
    "id": 70,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What can cause a rise in the volatile acids/alkalinity ratio?",
    "options": [
      "Underfeeding the primary digester",
      "Hydraulically overloading the primary digester",
      "Organically under loading the primary digester",
      "Adequate mixing of the primary digester"
    ],
    "correct": 1,
    "explanation": "Rising acid/alkalinity ratio in an anaerobic digestion process can be the result of over-feeding the primary digester. Higher feed rates mean higher volatile solids loading rates."
  },
  {
    "id": 71,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What should be the minimum acceptable level for volatile solids reduction in a properly operated anaerobic digester … in order to satisfy the rules on vector attraction reduction?",
    "options": [
      "95%",
      "5%",
      "38%",
      "76%"
    ],
    "correct": 2,
    "explanation": "Rule 503 identifies at least 38% volatile solids reduction must be achieved to satisfy the requirement for vector attraction reduction. The volatile solids reduction can be measured using the VanKleek formula, the Approximate Mass Balance (AMB) formula, or other pre-approved methods."
  },
  {
    "id": 72,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which anaerobic digestion temperature range will Thermophilic be stable?",
    "options": [
      "75 to 90°F",
      "120 to 135°F",
      "85 to 100°F",
      "110 to 120°F"
    ],
    "correct": 1,
    "explanation": "Typically, a temperature range between 120 to 135°F represents Thermophilic conditions. Mesophilic temperatures are about 85 to 100°F, with the optimum temperature between 95 to 98°F. Psychrophilic temperatures conditions are normally less than about 68°F."
  },
  {
    "id": 73,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What color may the digested sludge be in a poorly operated anaerobic digestion process?",
    "options": [
      "All black",
      "White",
      "Green with black streaks",
      "Brown with gray streaks"
    ],
    "correct": 3,
    "explanation": "Improper, or inadequate, anaerobically digested sludge is referred to as “green,” even though the sludge is actually gray in color. Also, poorly digested sludge may have a brown color with gray streaks."
  },
  {
    "id": 74,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Why would sodium bicarbonate or lime be added to an anaerobic digester?",
    "options": [
      "To neutralize high acid production",
      "To decrease alkalinity",
      "To decrease pH",
      "To decrease volatile reduction"
    ],
    "correct": 0,
    "explanation": "Sodium bicarbonate neutralizes high acidic produced through digestion and helps to reduce the acid/alkalinity ratio."
  },
  {
    "id": 75,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What color may the digester gas be, as it is being burned in a waste gas burner, when the methane content is very low?",
    "options": [
      "Yellow",
      "Black",
      "Green",
      "Blue"
    ],
    "correct": 0,
    "explanation": "As methane content gets lower (dirty gas), the color of the flame becomes more yellow."
  },
  {
    "id": 76,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is a common pH range in a properly operated anaerobic digester?",
    "options": [
      "7.5 to 8.5",
      "6.8 to 7.2",
      "5.8 to 6.2",
      "8.2 to 9.1"
    ],
    "correct": 1,
    "explanation": "The most optimum pH range in a properly operated anaerobic digestion process is between 6.8 to 7.2."
  },
  {
    "id": 77,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What are the two (2) basic types of lime that can be used in the lime stabilization process?",
    "options": [
      "Hard lime and soft lime",
      "Quicklime and Hydrate lime",
      "Limestone and pebble lime",
      "Calcium hydroxide and ferric chloride"
    ],
    "correct": 1,
    "explanation": "Quicklime is high in calcium oxide content and will result in elevated temperatures, as well as pH, when added to sludge cake. Quicklime can also be referred to as pebble lime. Hydrate lime has no calcium oxide content and will only elevate the pH of a sludge sample … not the temperature. What may be an anticipated result of reducing the belt speed? Answer : b. Improve gravity filtration and create higher cake solids Feedback: Question No. 102 As the belt speed is reduced, this provides for additional gravity drainage time of the conditioned sludge on the top belt, as well as through the pressure zone (in machines with single drive units). As a result, the cake solids may increase, as well as improving the gravity filtration efficiency. 00000000 00000000 00000000 00000000 00000000 00000000"
  },
  {
    "id": 78,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What are the requirements for lime stabilization to accomplish Class B stabilization standards?",
    "options": [
      "Raise the sludge pH to no more than 11.0",
      "Raise the sludge pH to at least 12 for the first 2 hours, and then at least 12.5 for the next 24 hours",
      "Raise the sludge pH to between 10.0 to 10.5",
      "Raise the sludge pH to at least 12 for the first 2 hours, and then at least 11.5 for the next 22 hours What is the water called that is removed by the belt press?"
    ],
    "correct": 3,
    "explanation": "Vector attraction reduction for Class B lime stabilization is accomplished by elevating the pH of the sludge sample to at least 12, where it must remain no less than pH 12 for two hours."
  },
  {
    "id": 79,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is a typical percent solids in the pre-cake leaving the gravity section of a belt filter press?",
    "options": [
      "2% to 4%",
      "30% to 50%",
      "15% to 20%",
      "8% to 10%"
    ],
    "correct": 3,
    "explanation": "Typically, if the total solids content is less than about 8% at this location, this may indicate that the sludge feed rate may be too high, the belt speed may be too high, or the polymer dose may be too low."
  },
  {
    "id": 80,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What may be an anticipated result of reducing the belt speed?",
    "options": [
      "Create a larger floc",
      "Improve gravity filtration and create higher cake solids",
      "Create poor gravity filtration and create lower cake solids",
      "Produce a lower percent solids in the gravity section sludge What may be the result if the belt speed is too slow?"
    ],
    "correct": 1,
    "explanation": "As the belt speed is reduced, this provides for additional gravity drainage time of the conditioned sludge on the top belt, as well as through the pressure zone (in machines with single drive units). As a result, the cake solids may increase, as well as improving the gravity filtration efficiency."
  },
  {
    "id": 81,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the water called that is removed by the belt press?",
    "options": [
      "Mixed liquor",
      "Effluent",
      "Filtrate",
      "Cake"
    ],
    "correct": 2,
    "explanation": "Water removed from a belt filter press, plate and frame press, or gravity belt thickener is called filtrate. Water removed from a centrifuge is called centrate."
  },
  {
    "id": 82,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is polymer called when it has a positive charge?",
    "options": [
      "Anionic",
      "Reverse negative",
      "Non-ionic",
      "Cationic"
    ],
    "correct": 3,
    "explanation": "Polymers basically have three types of charge: positive charge is called cationic; negative charge is called anionic; and neutral charge is called non-ionic. Typical wastewater sludge has a negative charge and requires a positively charged cationic polymer."
  },
  {
    "id": 83,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is polymer called when it has a positive charge?",
    "options": [
      "Anionic",
      "Reverse negative",
      "Non-ionic",
      "Cationic"
    ],
    "correct": 3,
    "explanation": "Polymers basically have three types of charge: positive charge is called cationic; negative charge is called anionic; and neutral charge is called non-ionic. Typical wastewater sludge has a negative charge and requires a positively charged cationic polymer."
  },
  {
    "id": 84,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What may be the result if the system tension pressure of a belt filter press is increased too much?",
    "options": [
      "The floc size may be too small",
      "The belts may blind",
      "Gravity filtration will be too clear",
      "The cake solids may be too high"
    ],
    "correct": 1,
    "explanation": "As belt tension is increased, this can “push” sludge and polymer deeper into the weave of the belt and cause the belts to “blind.” Typically, as belt tension is increased, it requires increased water volume or pressure to properly clean the belts."
  },
  {
    "id": 85,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What chemical is commonly used to condition the sludge being applied to a belt filter press?",
    "options": [
      "Polymer",
      "Chlorine",
      "Lime",
      "Sodium hydroxide"
    ],
    "correct": 0,
    "explanation": "Industrial sludges may require a lime and ferric chloride blend to accomplish dewatering … however, most belt filter presses, dewatering domestic wastewater sludge, can achieve adequate dewatering with the use of polymer."
  },
  {
    "id": 86,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What may be the result if the belt speed is too slow?",
    "options": [
      "The floc size may be too small",
      "Gravity filtration may be poor",
      "The cake solids may be low",
      "The gravity zone may flood"
    ],
    "correct": 3,
    "explanation": "As the belt speed is reduced, and the sludge feed rate is not also reduced, the top gravity section may become hydraulically overloaded and flood."
  },
  {
    "id": 87,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What may be an anticipated result of increasing the belt speed?",
    "options": [
      "Create a larger floc",
      "Improve gravity filtration and create higher cake solids",
      "Decrease gravity drainage time and decrease the cake solids",
      "Create a smaller floc"
    ],
    "correct": 2,
    "explanation": "Increasing the belt speed will reduce the amount of time the conditioned sludge is exposed to the top belt, and in the pressure zone (in machines with only one drive unit). As well as decreasing the gravity zone drainage time, this action of increasing the belt speed may also reduce the total solids content in the cake product."
  },
  {
    "id": 88,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is an alternate method for vector attraction reduction in anaerobic digestion if the volatile solids reduction does not meet the required number?",
    "options": [
      "Chlorine residual",
      "SOUR",
      "Extended 40 day bench test",
      "Ammonia-nitrogen Where is gas chlorine withdrawn from in a one- ton container?"
    ],
    "correct": 2,
    "explanation": "If the volatile solids reduction in an anaerobic digester is less than 38%, an extended bench test of the previously-digested sludge can be conducted in the laboratory at the required specifications of 40 days at 30 to 37oC (86 to 98.6oF)."
  },
  {
    "id": 89,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which is the EPA part that provides rules and regulation for the disposal of wastewater residuals?",
    "options": [
      "305 rule",
      "640 rule",
      "736 rule",
      "503 rule"
    ],
    "correct": 3,
    "explanation": "The EPA regulation for the treatment and disposal of wastewater residuals is 40 CFR Part 503."
  },
  {
    "id": 90,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Where is gas chlorine withdrawn from in a one- ton container?",
    "options": [
      "From the bottom valve",
      "From the top valve",
      "From top or bottom valves",
      "Gas cannot be withdrawn from a one-ton container"
    ],
    "correct": 1,
    "explanation": "Chlorine ton containers are manufactured with liquid chlorine under pressure. Due to evaporative temperature of chlorine, some of the liquid is always being converted to gas inside of the container. Gas is withdrawn from the top valve and liquid is withdrawn from the bottom valve. Question No. 118 What is the detention time of a chlorine contact chamber that is 100 feet long, 15 feet wide, 9 feet deep, and has a plant flow rate of 4.2 mgd? a. About 2 hours b. About 76 minutes c. About 35 minutes d. About 15 minutes 00000000 00000000 00000000 00000000  "
  },
  {
    "id": 91,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Where is gas chlorine withdrawn from in a one-ton container? Answer :",
    "options": [
      "About 2 hours",
      "About 76 minutes",
      "About 35 minutes",
      "About 15 minutes 00000000 00000000 00000000 00000000  "
    ],
    "correct": 2,
    "explanation": "Chlorine supply equals demand plus residual. Demand is the amount of chlorine consumed … residual is the amount of chlorine that is left over after the demand has been satisfied … and the supply is the total amount of chlorine provided."
  },
  {
    "id": 92,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What does this formula represent? Demand + Residual =",
    "options": [
      "Breakpoint",
      "Dosage",
      "Supply",
      "Combined"
    ],
    "correct": 2,
    "explanation": "Chlorine supply equals demand plus residual. Demand is the amount of chlorine consumed … residual is the amount of chlorine that is left over after the demand has been satisfied … and the supply is the total amount of chlorine provided."
  },
  {
    "id": 93,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which component in a chlorine evaporator is responsible for reducing the chlorine gas pressure down to 1 atmosphere?",
    "options": [
      "PRV",
      "O-ring",
      "SBR",
      "Gas injector"
    ],
    "correct": 0,
    "explanation": "The PRV – pressure reducing valve – is responsible for reducing the gas pressure leaving an evaporator to one atmosphere."
  },
  {
    "id": 94,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What type of chlorine residual is attained after the breakpoint is achieved?",
    "options": [
      "Combined",
      "Total",
      "Free",
      "Mono"
    ],
    "correct": 2,
    "explanation": "Free chlorine residual is achieved after all of the demand for chlorine has been satisfied. The breakpoint is known as Trichloramine residual."
  },
  {
    "id": 95,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the detention time of a chlorine contact chamber that is 100 feet long, 15 feet wide, 9 feet deep, and has a plant flow rate of 4.2 mgd?",
    "options": [
      "About 2 hours",
      "About 76 minutes",
      "About 35 minutes",
      "About 15 minutes"
    ],
    "correct": 2,
    "explanation": "Detention time is V/Q. “V” is the volume of the tank, and “Q” is the flow entering the tank. To calculate detention time directly in minutes, the formula is tank volume in ft3 divided by flow in mgd times 92.84 cfm per mgd."
  },
  {
    "id": 96,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What does this formula represent? Contact Chamber ft3 92.84 cfm/mgd x Flow, mgd",
    "options": [
      "Surface settling rate",
      "Detention time in hours",
      "Volume of contact chamber in gallons",
      "Detention time in minutes"
    ],
    "correct": 3,
    "explanation": "This formula takes the volume in cubic feet which is divided by the cubic feet per minute of flow stream (mgd x cfm/mgd). The resultant units is minutes … and the parameter is detention time. Which component may create the highest maintenance requirement in a UV disinfection system? Answer : b. UV lamp Feedback: Question No. 124 Typically, lamps require the most maintenance in a UV system to keep it at peak performance. 00000000 00000000 00000000 00000000 00000000 00000000  "
  },
  {
    "id": 97,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the formula that defines chlorine residual?",
    "options": [
      "Demand - supply = residual",
      "Supply - demand = residual",
      "Supply x demand = residual",
      "Demand + supply = residual"
    ],
    "correct": 1,
    "explanation": "The residual of something, like chlorine or dissolved oxygen, is that which is left over after the demand has been satisfied. So, chlorine demand is the remainder of chlorine supply minus chlorine residual."
  },
  {
    "id": 98,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What type of chlorine comes in solid, or dry form?",
    "options": [
      "Sodium hypochlorite",
      "Ferric chloride",
      "Calcium hypochlorite",
      "Aluminum sulfate"
    ],
    "correct": 2,
    "explanation": "HTH … is High Test Hypochlorite, and is a solid, dry powder. Calcium hypochlorite is also used in solid tablet form (like the hockey pucks used in a swimming pool chlorinator)."
  },
  {
    "id": 99,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which type of chlorine comes in only liquid form?",
    "options": [
      "Ferric chloride",
      "Calcium hypochlorite",
      "Sodium hypochlorite",
      "Caustic soda"
    ],
    "correct": 2,
    "explanation": "Sodium hypochlorite, or liquid bleach, is the only common form of chlorine that comes in liquid form only."
  },
  {
    "id": 100,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What type of channel can UV disinfection be operated in?",
    "options": [
      "Open channel only",
      "Closed channel only",
      "Pipeline only",
      "Either an open channel, a closed channel, or a pipeline"
    ],
    "correct": 3,
    "explanation": "Ultra Violet (UV) disinfection systems can be installed in open channels, closed channels or pipelines."
  },
  {
    "id": 101,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What first must be done to air before it is applied to an air feed ozone generator?",
    "options": [
      "Cooled, separated and dried",
      "Dried and cooled",
      "Cooled and separated",
      "Separated and dried"
    ],
    "correct": 0,
    "explanation": "Air-supplied ozone generators typically require that the air be cooled, separated and dried before it is fed to the generator."
  },
  {
    "id": 102,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What affect on disinfection does ozone have before the ozone demand has been satisfied?",
    "options": [
      "Relatively little disinfection power occurs before the ozone demand is satisfied",
      "Very high disinfection power occurs immediately",
      "The ozone demand does not affect the disinfection power of ozone",
      "Bacteria are immediately killed before the ozone demand is satisfied"
    ],
    "correct": 0,
    "explanation": "Ozone demand must be satisfied before its disinfection activity begins to work. Relatively little disinfection power occurs before the ozone demand is satisfied."
  },
  {
    "id": 103,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What does an closed circuit mean in electrical terms?",
    "options": [
      "That power is disengaged ... dead",
      "That power is active",
      "That power is engaged ... live",
      "The term “open” has nothing to do with electricity"
    ],
    "correct": 2,
    "explanation": "In electrical terms, CLOSED means that the circuit is active and power is engaged. OPEN means that the circuit is inactive and power is not engaged."
  },
  {
    "id": 104,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Given the following data, what should the annual chlorine budget be in a leap-year? · Plant Flow = 1.25 mgd · Odor Control Scrubber = 25 ppd · RAS Chlorine Dosage = 1.2 mg/l · Effluent Chlorine Dosage = 8.75 mg/l · Chlorine Cost = $0.25 per Pound · 10% increase for higher demand periods · Preliminary Treatment Chlorine Dosage = 7.5 mg/l",
    "options": [
      "$20,826",
      "$44,542",
      "$18,743",
      "$23,847"
    ],
    "correct": 0,
    "explanation": "Pounds per day chlorine used = flow, mgd x conc., ppm x 8.34 lbs/gal = 1.25 mgd x (7.5 ppm + 1.2 ppm + 8.75 ppm) x 8.34 lbs/gal + 25 ppd = 206.916 lbs/day"
  },
  {
    "id": 105,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the term when ammonia-N, nitrate-N and nitrite-N are added together?",
    "options": [
      "TN",
      "TIN",
      "NO3",
      "TKN"
    ],
    "correct": 1,
    "explanation": "Total Inorganic Nitrogen (TIN) is a combination of all forms of inorganic nitrogen. These inorganic forms include ammonia, nitrate and nitrite. TIN is the combination of all forms of nitrogen except organic nitrogen."
  },
  {
    "id": 106,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the result of this formula? Total Solids - Fixed Solids =",
    "options": [
      "Total suspended solids",
      "Volatile solids",
      "Fixed suspended solids",
      "Settleable solids"
    ],
    "correct": 1,
    "explanation": "When a solids sample is burned in a muffle furnace, the remaining solids are fixed. So, total solids minus fixed solids equals volatile solids."
  },
  {
    "id": 107,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What will be the volume of a tank if the flow entering is 5 mgd and the detention time is 1.5 hours?",
    "options": [
      "583,000 gals",
      "1.2 mg",
      "0.3957 mg",
      "312,500 gals"
    ],
    "correct": 3,
    "explanation": "Tank Volume, mg =(flow, mgd x D.T., hours)  24 hrs/day =5 mgd x 1.5 hrs  24 hrs/day =0.3125 mg x 1,000,000 =312,500 gallons"
  },
  {
    "id": 108,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the volume in gallons occupied by 45,000 cubic feet of water?",
    "options": [
      "336,600 gals",
      "168,300 gals",
      "375,300 gals",
      "2,808,000 gals"
    ],
    "correct": 0,
    "explanation": "Volume in Gallons =cubic feet x 7.48 gals/ft3 =45,000 cubic feet x 7.48 gals/ft3 =336,600 gallons Question No. 156 What is the total gallons (not including the cone) in a digester, given the following data? · 25 ft diameter · 15 ft side water depth (and it’s full) a. About 29,432 total gallons b. About 55,048 total gallons c. About 58,865 total gallons d. About 3,817 total gallons 00000000 00000000 00000000 00000000  "
  },
  {
    "id": 109,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the volume in gallons occupied by 45,000 cubic feet of water? Answer :",
    "options": [
      "About 29,432 total gallons",
      "About 55,048 total gallons",
      "About 58,865 total gallons",
      "About 3,817 total gallons 00000000 00000000 00000000 00000000  "
    ],
    "correct": 2,
    "explanation": "0.42 is 42 over 100. 42 divided by 2 = 21 … and 100 divided by 2 is 50. Since no other number can be equally divided into the numerator and denominator, the least common denominator for the fraction 0.42 is 42 over 50."
  },
  {
    "id": 110,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What does this formula represent? ⅓ π r2 x depth, ft. x 7.48 gals/ft3",
    "options": [
      "Volume of a cone in ft3",
      "Volume of a circular tank in gallons",
      "Volume of a sphere in gallons",
      "Volume of a cone in gallons"
    ],
    "correct": 3,
    "explanation": "The formula to calculate the volume in gallons of a cone is: ⅓ π r2 x cone depth, ft. x 7.48 gals/ft3."
  },
  {
    "id": 111,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "How many pounds of solids are in a tank that is 100 feet long, 30 feet wide, 14 feet deep, and the MLSS concentration is 3,500 mg/l?",
    "options": [
      "19,170 lbs",
      "350 lbs",
      "1,226 lbs",
      "9,170 lbs What is the daily volume of sludge removed from a primary clarifier if the total dry lbs/day are 1,500, and the moisture content is 95.5%?"
    ],
    "correct": 3,
    "explanation": "Pounds in a Tank = tank volume, mg x concentration, ppm x 8.34 lbs/gal"
  },
  {
    "id": 112,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the demand for chlorine if the residual is 1.1 mg/l and the amount of chlorine applied is 7.4 mg/l?",
    "options": [
      "7.3 mg/l",
      "6.5 mg/l",
      "8.5 mg/l",
      "6.3 mg/l"
    ],
    "correct": 3,
    "explanation": "The formula for chlorine demand is: chlorine supply minus chlorine residual Demand = Supply - Residual = 7.4 mg/l - 1.1 mg/l =6.3 mg/l demand What is the moisture content of a sludge sample that measures 5.25% total solids? Answer : d. 94.75% Feedback: Question No. 159 1.0 - 0.0525 x 100 = 94.75% moisture or 100 - 5.25 = 94.75 00000000 00000000"
  },
  {
    "id": 113,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the total gallons (not including the cone) in a digester, given the following data? · 25 ft diameter · 15 ft side water depth (and it’s full)",
    "options": [
      "About 29,432 total gallons",
      "About 55,048 total gallons",
      "About 58,865 total gallons",
      "About 3,817 total gallons What is the moisture content of a sludge sample that measures 5.25% total solids? Answer : d. 94.75% Feedback: 1.0 - 0.0525 x 100 = 94.75% moisture or 100 - 5.25 = 94.75 00000000 00000000"
    ],
    "correct": 1,
    "explanation": "The formula to calculate tank volume is: π r2 x depth, ft. x 7.48 gals/ft3 Note: r = ½ d"
  },
  {
    "id": 114,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the consumption of chlorine used in 30 days if the flow rate is 2,500 gpm, and the dose rate is 8.5 mg/l?",
    "options": [
      "255 pounds",
      "7,661 pounds",
      "10,219 pounds",
      "8,824 pounds"
    ],
    "correct": 1,
    "explanation": "Chlorine consumption = flow, mgd x dose rate, ppm x 8.34 lbs/gal x 30 days Flow, mgd = 2,500 gpm  694 gpm/mgd = 3.6023 mgd Lbs Chlorine = 3.6023 mgd x 8.5 ppm x 8.34 lbs.gal x 30 days = 7,661 pounds"
  },
  {
    "id": 115,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "What is the daily volume of sludge removed from a primary clarifier if the total dry lbs/day are 1,500, and the moisture content is 95.5%?",
    "options": [
      "1,679 gals/day",
      "6,769 gals/day",
      "3,997 gals/day",
      "1,998 gals/day"
    ],
    "correct": 2,
    "explanation": "This is the Q formula: (Note: 1% totals solids equals 10,000 ppm TSS) Q, mgd = lbs/day  (solids conc., ppm x 8.34 lbs/gal) = 1,500 lbs/day  ((100 - 95.5 x 10,000 ppm) x 8.34 lbs/gal) = 0.0039968 mgd"
  },
  {
    "id": 116,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which of the following is most explosive?",
    "options": [
      "Pure digester gas",
      "Digester gas mixed with methane",
      "Digester gas mixed with air",
      "Digester gas with high CO2 content"
    ],
    "correct": 2,
    "explanation": "Since as explosion requires oxygen, digester gas on its own is not as potentially explosive as digester gas that is mixed with air."
  },
  {
    "id": 117,
    "module": "Treatment Process",
    "difficulty": "easy",
    "question": "Which of the following is NOT a function of preliminary treatment?",
    "options": [
      "Protect downstream equipment from damage",
      "Remove large floating solids",
      "Reduce BOD by 50%",
      "Remove grit and sand"
    ],
    "correct": 2,
    "explanation": "Preliminary treatment (screening, grit removal) is a physical process that protects equipment and removes large solids and grit. It does not significantly reduce BOD — that is accomplished in primary and secondary treatment."
  },
  {
    "id": 118,
    "module": "Treatment Process",
    "difficulty": "easy",
    "question": "Mechanically cleaned bar screens are preferred over manually cleaned screens because they:",
    "options": [
      "Remove finer particles",
      "Automatically remove screenings without operator intervention",
      "Use less energy",
      "Produce less odour"
    ],
    "correct": 1,
    "explanation": "Mechanically cleaned bar screens use rakes or brushes to automatically remove accumulated screenings, reducing manual labour and ensuring continuous operation without clogging."
  },
  {
    "id": 119,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "The velocity in a grit channel should be maintained at approximately 1 ft/s to:",
    "options": [
      "Remove all suspended solids",
      "Allow grit to settle while keeping organic solids in suspension",
      "Maximize BOD removal",
      "Prevent pipe corrosion"
    ],
    "correct": 1,
    "explanation": "At approximately 1 ft/s (0.3 m/s), inorganic grit (SG ~2.65) settles out while lighter organic solids (SG ~1.0-1.2) remain in suspension and pass through to primary treatment."
  },
  {
    "id": 120,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Aerated grit chambers use air diffusers to create a spiral roll pattern that:",
    "options": [
      "Increases the settling rate of all solids",
      "Separates grit from organic matter by differential settling",
      "Provides biological treatment",
      "Neutralizes the pH of the wastewater"
    ],
    "correct": 1,
    "explanation": "In aerated grit chambers, the spiral roll pattern caused by air diffusers causes grit to settle to the bottom while lighter organic matter is kept in suspension and carried out with the flow."
  },
  {
    "id": 121,
    "module": "Treatment Process",
    "difficulty": "easy",
    "question": "Screenings removed from a wastewater bar screen are typically:",
    "options": [
      "Returned to the headworks for further treatment",
      "Washed, compacted, and disposed of in a landfill",
      "Composted and used as fertilizer",
      "Incinerated on-site"
    ],
    "correct": 1,
    "explanation": "Screenings are typically washed to remove organic matter, compacted to reduce volume, and disposed of in a landfill. Some facilities use screenings presses to further reduce volume."
  },
  {
    "id": 122,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Which of the following would cause a decrease in primary clarifier efficiency?",
    "options": [
      "Reducing the surface overflow rate",
      "Increasing the detention time",
      "Hydraulic short-circuiting",
      "Reducing the influent TSS concentration"
    ],
    "correct": 2,
    "explanation": "Hydraulic short-circuiting occurs when wastewater flows directly from the inlet to the outlet without adequate settling time, reducing removal efficiency. Density currents, wind, and poor inlet design can cause short-circuiting."
  },
  {
    "id": 123,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Primary sludge typically has a solids content of:",
    "options": [
      "0.1-0.5%",
      "3-8%",
      "15-25%",
      "30-40%"
    ],
    "correct": 1,
    "explanation": "Primary sludge (raw settled solids from primary clarifiers) typically has a solids content of 3-8%. It is denser and easier to thicken than secondary (biological) sludge."
  },
  {
    "id": 124,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "The weir overflow rate on a primary clarifier affects:",
    "options": [
      "The sludge blanket depth",
      "The turbulence near the effluent weir and solids carryover",
      "The detention time in the tank",
      "The pH of the effluent"
    ],
    "correct": 1,
    "explanation": "High weir overflow rates create turbulence near the effluent weir that can resuspend settled solids and carry them over in the effluent. Typical design WOR is 10,000-15,000 gpd/linear ft."
  },
  {
    "id": 125,
    "module": "Treatment Process",
    "difficulty": "easy",
    "question": "Scum baffles in primary clarifiers are designed to:",
    "options": [
      "Prevent short-circuiting",
      "Prevent floating scum from passing over the effluent weir",
      "Increase the detention time",
      "Reduce the surface overflow rate"
    ],
    "correct": 1,
    "explanation": "Scum baffles are submerged baffles placed in front of the effluent weir to prevent floating scum (grease, oils, plastics) from passing over the weir and contaminating the effluent."
  },
  {
    "id": 126,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "The conventional activated sludge process differs from the extended aeration process primarily in:",
    "options": [
      "The type of microorganisms used",
      "The SRT — extended aeration uses a much longer sludge age",
      "The type of aeration equipment",
      "The source of the wastewater"
    ],
    "correct": 1,
    "explanation": "Extended aeration uses a much longer SRT (20-30+ days) compared to conventional activated sludge (5-15 days). The longer SRT results in more complete oxidation of organic matter and less sludge production."
  },
  {
    "id": 127,
    "module": "Treatment Process",
    "difficulty": "hard",
    "question": "Sequencing Batch Reactors (SBRs) differ from conventional activated sludge in that:",
    "options": [
      "SBRs use separate aeration and settling tanks",
      "SBRs perform aeration, settling, and decanting in a single tank in sequential cycles",
      "SBRs do not require return sludge",
      "SBRs cannot achieve nitrification"
    ],
    "correct": 1,
    "explanation": "SBRs use a single tank that alternates between fill, react (aeration), settle, decant, and idle phases. This eliminates the need for separate secondary clarifiers and return sludge pumping."
  },
  {
    "id": 128,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "The Oxidation Ditch process is a variation of activated sludge that uses:",
    "options": [
      "Pure oxygen instead of air",
      "An oval-shaped channel with horizontal rotors for aeration and mixing",
      "Attached growth media",
      "Anaerobic conditions for BOD removal"
    ],
    "correct": 1,
    "explanation": "Oxidation ditches use oval-shaped channels with horizontal surface aerators (brush rotors or disc aerators) that provide both aeration and circulation. They typically operate at long SRTs (20-30 days) with nitrification."
  },
  {
    "id": 129,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "In the activated sludge process, the return sludge ratio (RAS/Q) is typically:",
    "options": [
      "0.1-0.25",
      "0.25-0.5",
      "0.5-1.5",
      "2.0-3.0"
    ],
    "correct": 2,
    "explanation": "The RAS ratio (return sludge flow / influent flow) is typically 0.5-1.5 (50-150%). Higher RAS ratios are used when the sludge is bulking or when higher MLSS concentrations are needed."
  },
  {
    "id": 130,
    "module": "Treatment Process",
    "difficulty": "hard",
    "question": "Selector tanks in activated sludge systems are used to:",
    "options": [
      "Select the best microorganisms for treatment",
      "Control filamentous bulking by providing a high F/M zone at the inlet",
      "Increase the SRT of the system",
      "Remove nutrients before the aeration tank"
    ],
    "correct": 1,
    "explanation": "Selector tanks create a high F/M zone at the inlet of the aeration tank. Floc-forming bacteria can rapidly take up substrate in this zone, outcompeting filamentous organisms and reducing bulking problems."
  },
  {
    "id": 131,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "The Sludge Age (SRT) in an activated sludge system directly controls:",
    "options": [
      "The influent BOD concentration",
      "The type and activity of microorganisms in the system",
      "The surface overflow rate of the secondary clarifier",
      "The chlorine demand of the effluent"
    ],
    "correct": 1,
    "explanation": "SRT determines which microorganisms can survive in the system. Short SRT (3-5 days) favors fast-growing heterotrophs for BOD removal. Long SRT (>10 days) allows slow-growing nitrifiers to establish and achieve nitrification."
  },
  {
    "id": 132,
    "module": "Treatment Process",
    "difficulty": "hard",
    "question": "Oxygen uptake rate (OUR) in activated sludge is used to:",
    "options": [
      "Measure the chlorine residual",
      "Assess the biological activity and oxygen demand of the mixed liquor",
      "Determine the sludge volume index",
      "Calculate the surface overflow rate"
    ],
    "correct": 1,
    "explanation": "OUR measures the rate at which microorganisms in the mixed liquor consume oxygen. It is used to assess biological activity, detect inhibitory substances, and optimize aeration. High OUR indicates active, healthy biomass."
  },
  {
    "id": 133,
    "module": "Treatment Process",
    "difficulty": "hard",
    "question": "The National Research Council (NRC) equations for trickling filter design are used to:",
    "options": [
      "Calculate the required aeration volume",
      "Estimate BOD removal efficiency based on hydraulic and organic loading",
      "Determine the required SRT",
      "Calculate the polymer dose for sludge dewatering"
    ],
    "correct": 1,
    "explanation": "The NRC equations relate BOD removal efficiency to hydraulic loading, organic loading, recirculation ratio, and filter volume. They are empirical equations developed from operating data on rock media filters."
  },
  {
    "id": 134,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Plastic media trickling filters have advantages over rock media filters because:",
    "options": [
      "They are cheaper to install",
      "They have higher specific surface area and lower weight, allowing deeper filters",
      "They require less maintenance",
      "They achieve better BOD removal at the same loading"
    ],
    "correct": 1,
    "explanation": "Plastic media has a specific surface area of 30-100 m2/m3 compared to 40-70 m2/m3 for rock. More importantly, plastic media is much lighter (50-100 kg/m3 vs 1,200-1,500 kg/m3 for rock), allowing filters 6-12 m deep."
  },
  {
    "id": 135,
    "module": "Treatment Process",
    "difficulty": "hard",
    "question": "The A2/O (Anaerobic/Anoxic/Oxic) process achieves:",
    "options": [
      "BOD removal only",
      "Simultaneous biological nitrogen and phosphorus removal",
      "Chemical phosphorus removal only",
      "Nitrification without denitrification"
    ],
    "correct": 1,
    "explanation": "The A2/O process uses three zones: anaerobic (phosphorus release), anoxic (denitrification), and aerobic (nitrification and phosphorus uptake). It achieves simultaneous biological nitrogen and phosphorus removal."
  },
  {
    "id": 136,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "In biological denitrification, carbon (organic matter) is required as:",
    "options": [
      "A nutrient for bacterial growth",
      "An electron donor for the reduction of nitrate to nitrogen gas",
      "A pH buffer",
      "A source of energy for nitrification"
    ],
    "correct": 1,
    "explanation": "In denitrification, heterotrophic bacteria use nitrate (NO3-) as the electron acceptor and organic carbon (BOD) as the electron donor. Without sufficient carbon, denitrification is incomplete."
  },
  {
    "id": 137,
    "module": "Treatment Process",
    "difficulty": "hard",
    "question": "The Modified Ludzack-Ettinger (MLE) process achieves nitrogen removal by:",
    "options": [
      "Adding an anaerobic zone before the aerobic zone",
      "Recycling nitrified effluent from the aerobic zone to an anoxic zone at the inlet",
      "Using two separate activated sludge systems",
      "Adding methanol to the secondary clarifier"
    ],
    "correct": 1,
    "explanation": "The MLE process has an anoxic zone at the inlet followed by an aerobic zone. Nitrified mixed liquor is recycled from the aerobic zone back to the anoxic zone, where denitrification occurs using influent BOD as the carbon source."
  },
  {
    "id": 138,
    "module": "Treatment Process",
    "difficulty": "hard",
    "question": "Struvite (magnesium ammonium phosphate) formation in digesters and pipes is caused by:",
    "options": [
      "High pH and high concentrations of magnesium, ammonium, and phosphate",
      "Low pH and high sulfate concentrations",
      "High temperature and low dissolved oxygen",
      "High chlorine residual"
    ],
    "correct": 0,
    "explanation": "Struvite (MgNH4PO4.6H2O) forms when magnesium, ammonium, and phosphate concentrations exceed the solubility product, especially at high pH. It forms hard scale in pipes, digesters, and centrifuges, causing operational problems."
  },
  {
    "id": 139,
    "module": "Treatment Process",
    "difficulty": "hard",
    "question": "Breakpoint chlorination occurs when:",
    "options": [
      "Chlorine first appears in the effluent",
      "All chloramines are oxidized and free chlorine residual begins to increase",
      "The pH drops below 6.0",
      "The chlorine dose exceeds 10 mg/L"
    ],
    "correct": 1,
    "explanation": "As chlorine is added to wastewater containing ammonia, chloramines form first. As more chlorine is added, the chloramines are oxidized and destroyed. The breakpoint is where all chloramines are destroyed and free chlorine residual begins to increase."
  },
  {
    "id": 140,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "UV disinfection effectiveness is reduced by:",
    "options": [
      "High dissolved oxygen in the effluent",
      "High turbidity and suspended solids that absorb or scatter UV light",
      "Low temperature of the effluent",
      "High pH above 8.0"
    ],
    "correct": 1,
    "explanation": "UV light must penetrate the wastewater to reach and inactivate microorganisms. High turbidity, suspended solids, and dissolved organic matter absorb or scatter UV light, reducing its effectiveness. Tertiary filtration before UV is often required."
  },
  {
    "id": 141,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Ozone (O3) as a disinfectant has the advantage of:",
    "options": [
      "Low cost and simple operation",
      "Leaving a measurable residual in the effluent",
      "Producing no disinfection byproducts and leaving no residual",
      "Being effective at very low doses"
    ],
    "correct": 2,
    "explanation": "Ozone is a powerful oxidant that leaves no harmful residual (it decomposes to O2) and produces fewer chlorinated disinfection byproducts. However, it is expensive, requires on-site generation, and provides no residual protection."
  },
  {
    "id": 142,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "When the effluent TSS from a secondary clarifier is high and the sludge blanket is rising, the operator should:",
    "options": [
      "Increase the influent flow",
      "Increase the waste sludge rate to lower the sludge blanket",
      "Decrease the return sludge rate",
      "Increase the aeration rate"
    ],
    "correct": 1,
    "explanation": "A rising sludge blanket in the secondary clarifier indicates too much sludge in the system. Increasing the waste sludge (WAS) rate removes excess sludge, lowers the blanket, and reduces the risk of sludge carryover in the effluent."
  },
  {
    "id": 143,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Dissolved oxygen in the aeration tank that is consistently below 0.5 mg/L may cause:",
    "options": [
      "Improved nitrification",
      "Filamentous bulking and poor sludge settling",
      "Reduced BOD loading",
      "Increased SVI"
    ],
    "correct": 1,
    "explanation": "Consistently low DO (<0.5 mg/L) in the aeration tank favors the growth of filamentous organisms that thrive under oxygen-limited conditions. This leads to bulking sludge with high SVI and poor settling in the secondary clarifier."
  },
  {
    "id": 144,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "A sudden increase in influent BOD loading to an activated sludge system may cause:",
    "options": [
      "Improved effluent quality",
      "Temporary decrease in effluent quality until the biomass adapts",
      "Immediate increase in MLSS",
      "Decrease in oxygen demand"
    ],
    "correct": 1,
    "explanation": "A sudden increase in BOD loading (shock load) can temporarily overwhelm the biological system, causing decreased effluent quality. The biomass needs time to grow and adapt to the higher food supply. Equalization can dampen shock loads."
  },
  {
    "id": 145,
    "module": "Treatment Process",
    "difficulty": "hard",
    "question": "Chlorination of return activated sludge (RAS) is used to control:",
    "options": [
      "Nitrification",
      "Filamentous bulking organisms",
      "Phosphorus removal",
      "Dissolved oxygen levels"
    ],
    "correct": 1,
    "explanation": "Low-level chlorination of RAS (1-5 mg/L) selectively kills filamentous organisms that are more sensitive to chlorine than floc-forming bacteria. This is a common control measure for filamentous bulking."
  },
  {
    "id": 146,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Alkalinity in wastewater treatment is important because:",
    "options": [
      "It provides carbon for denitrification",
      "It buffers pH changes and is consumed during nitrification",
      "It increases the BOD of the wastewater",
      "It promotes the growth of filamentous organisms"
    ],
    "correct": 1,
    "explanation": "Alkalinity (typically bicarbonate, HCO3-) buffers pH in the treatment process. Nitrification consumes alkalinity (7.14 mg alkalinity as CaCO3 per mg NH4+-N oxidized), which can lower pH and inhibit nitrification if alkalinity is insufficient."
  },
  {
    "id": 147,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Temperature affects the activated sludge process by:",
    "options": [
      "Having no significant effect on biological activity",
      "Affecting the rate of biological reactions — lower temperature reduces reaction rates",
      "Increasing oxygen solubility at higher temperatures",
      "Reducing the need for aeration at high temperatures"
    ],
    "correct": 1,
    "explanation": "Biological reaction rates decrease at lower temperatures. Nitrification is particularly sensitive to temperature — it can fail below 10 degrees C. Lower temperatures also increase oxygen solubility, which partially compensates for reduced biological activity."
  },
  {
    "id": 148,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "The purpose of an equalization basin before an activated sludge system is to:",
    "options": [
      "Provide primary treatment",
      "Dampen flow and load variations to protect the biological system from shock loads",
      "Remove nutrients before secondary treatment",
      "Provide additional detention time for settling"
    ],
    "correct": 1,
    "explanation": "Equalization basins store wastewater during peak flow/load periods and release it at a uniform rate. This protects the biological system from hydraulic and organic shock loads, improving treatment stability and effluent quality."
  },
  {
    "id": 149,
    "module": "Treatment Process",
    "difficulty": "hard",
    "question": "Reverse osmosis (RO) in advanced wastewater treatment removes:",
    "options": [
      "Only suspended solids",
      "Dissolved salts, organics, and most contaminants through a semi-permeable membrane",
      "Only pathogens",
      "Only nutrients"
    ],
    "correct": 1,
    "explanation": "Reverse osmosis uses pressure to force water through a semi-permeable membrane that rejects dissolved salts, organics, heavy metals, and most contaminants. It produces very high-quality water suitable for indirect potable reuse."
  },
  {
    "id": 150,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Constructed wetlands used for wastewater treatment work by:",
    "options": [
      "Physical filtration only",
      "Combination of physical, chemical, and biological processes in a wetland environment",
      "Chemical precipitation of nutrients",
      "UV disinfection by sunlight"
    ],
    "correct": 1,
    "explanation": "Constructed wetlands use a combination of physical settling, biological uptake by plants and microorganisms, and chemical processes to treat wastewater. They are low-energy, low-maintenance systems used for polishing secondary effluent."
  },
  {
    "id": 151,
    "module": "Treatment Process",
    "difficulty": "hard",
    "question": "The term 'endogenous respiration' in activated sludge refers to:",
    "options": [
      "Oxygen consumption during BOD removal",
      "Microorganisms consuming their own cellular material when food is limited",
      "The respiration of nitrifying bacteria",
      "Oxygen transfer from the atmosphere"
    ],
    "correct": 1,
    "explanation": "Endogenous respiration occurs when microorganisms have consumed all available food (BOD) and begin to metabolize their own cellular material for energy. It occurs at high SRTs and low F/M ratios, resulting in less sludge production."
  },
  {
    "id": 152,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Algae in wastewater stabilization ponds provide:",
    "options": [
      "BOD removal through adsorption",
      "Oxygen through photosynthesis for bacterial oxidation of organic matter",
      "Pathogen removal through predation",
      "Nutrient removal through chemical precipitation"
    ],
    "correct": 1,
    "explanation": "Algae produce oxygen through photosynthesis (CO2 + H2O + light -> O2 + organic matter). This oxygen is used by bacteria to oxidize organic matter (BOD). The bacteria produce CO2 and nutrients that the algae use — a symbiotic relationship."
  },
  {
    "id": 153,
    "module": "Treatment Process",
    "difficulty": "hard",
    "question": "The purpose of a Membrane Bioreactor (MBR) is to:",
    "options": [
      "Replace the primary clarifier",
      "Combine biological treatment with membrane filtration to replace the secondary clarifier",
      "Provide chemical phosphorus removal",
      "Provide UV disinfection"
    ],
    "correct": 1,
    "explanation": "MBRs combine biological treatment (activated sludge) with membrane filtration (microfiltration or ultrafiltration) to replace the secondary clarifier. MBRs produce very high-quality effluent and can operate at higher MLSS concentrations."
  },
  {
    "id": 154,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Two-stage trickling filter systems are used to:",
    "options": [
      "Reduce the hydraulic loading on each filter",
      "Achieve higher BOD removal and/or nitrification",
      "Reduce the recirculation ratio",
      "Treat industrial wastewater only"
    ],
    "correct": 1,
    "explanation": "Two-stage trickling filter systems (with an intermediate clarifier between stages) achieve higher BOD removal (>90%) and can achieve nitrification in the second stage after most BOD has been removed in the first stage."
  },
  {
    "id": 155,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Controlled discharge lagoons differ from continuous discharge lagoons in that:",
    "options": [
      "They use mechanical aeration",
      "They store treated effluent and discharge only when receiving water conditions are favorable",
      "They have shorter detention times",
      "They require more land area"
    ],
    "correct": 1,
    "explanation": "Controlled discharge lagoons store treated effluent during periods when discharge would be harmful (ice-out, low flow in receiving stream) and discharge when conditions are favorable. They require larger storage volume."
  },
  {
    "id": 156,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "The most common form of chlorine used for large wastewater treatment plants is:",
    "options": [
      "Calcium hypochlorite (HTH)",
      "Sodium hypochlorite (liquid bleach)",
      "Chlorine gas (Cl2)",
      "Chlorine dioxide (ClO2)"
    ],
    "correct": 2,
    "explanation": "Chlorine gas (Cl2) is the most cost-effective form for large plants due to its low cost and high available chlorine content (100%). However, it requires special handling due to its toxicity. Smaller plants often use sodium hypochlorite."
  },
  {
    "id": 157,
    "module": "Treatment Process",
    "difficulty": "easy",
    "question": "The purpose of sludge recirculation in a secondary clarifier is to:",
    "options": [
      "Dilute the incoming mixed liquor",
      "Maintain the biological population in the aeration tank and prevent sludge from becoming septic",
      "Increase the surface overflow rate",
      "Improve the effluent quality directly"
    ],
    "correct": 1,
    "explanation": "RAS returns settled biological sludge from the secondary clarifier to the aeration tank to maintain the active biomass concentration (MLSS). Without RAS, the biomass would be washed out and treatment would fail."
  },
  {
    "id": 158,
    "module": "Treatment Process",
    "difficulty": "hard",
    "question": "In the activated sludge process, the F/M (food-to-microorganism) ratio is calculated as:",
    "options": [
      "BOD removed / MLSS",
      "Influent BOD / (MLSS x aeration tank volume)",
      "MLSS / influent BOD",
      "Effluent BOD / influent BOD"
    ],
    "correct": 1,
    "explanation": "F/M = Influent BOD (kg/day) / (MLSS (kg/m3) x aeration tank volume (m3)). F/M controls the metabolic state of the biomass. Low F/M (0.05-0.15 kg BOD/kg MLSS/day) = endogenous; high F/M (0.2-0.6) = log growth phase."
  },
  {
    "id": 159,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Nitrification in activated sludge is performed by:",
    "options": [
      "Heterotrophic bacteria that oxidize organic matter",
      "Autotrophic bacteria (Nitrosomonas and Nitrobacter) that oxidize ammonia",
      "Anaerobic bacteria that reduce nitrate",
      "Algae that assimilate ammonia"
    ],
    "correct": 1,
    "explanation": "Nitrification is a two-step process: Nitrosomonas oxidizes NH4+ to NO2- (step 1), and Nitrobacter oxidizes NO2- to NO3- (step 2). These autotrophic bacteria grow slowly and require long SRTs (>10 days) and adequate alkalinity."
  },
  {
    "id": 160,
    "module": "Treatment Process",
    "difficulty": "easy",
    "question": "The purpose of a secondary clarifier in the activated sludge process is to:",
    "options": [
      "Provide additional BOD removal",
      "Separate the biological floc (sludge) from the treated effluent",
      "Provide aeration for the mixed liquor",
      "Remove nutrients from the effluent"
    ],
    "correct": 1,
    "explanation": "The secondary clarifier separates the biological sludge (activated sludge floc) from the treated effluent by gravity settling. The settled sludge is returned to the aeration tank (RAS) or wasted (WAS)."
  },
  {
    "id": 161,
    "module": "Treatment Process",
    "difficulty": "hard",
    "question": "Foaming in an activated sludge aeration tank is often caused by:",
    "options": [
      "Excessive dissolved oxygen",
      "Nocardia or Microthrix filamentous organisms, or high surfactant concentrations",
      "Low MLSS concentration",
      "High alkalinity"
    ],
    "correct": 1,
    "explanation": "Biological foaming is most commonly caused by Nocardia or Microthrix parvicella filamentous organisms that produce hydrophobic, stable foam. Surfactants (detergents) from industrial discharges can also cause foaming."
  },
  {
    "id": 162,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "The purpose of a gravity thickener for waste activated sludge is to:",
    "options": [
      "Stabilize the sludge before disposal",
      "Increase the solids concentration to reduce the volume of sludge to be processed",
      "Remove pathogens from the sludge",
      "Dewater the sludge to a dry cake"
    ],
    "correct": 1,
    "explanation": "Gravity thickeners increase the solids concentration of WAS from ~0.5-1% to 2-3% by gravity settling. This reduces the volume of sludge to be processed in digesters or dewatering equipment, reducing costs."
  },
  {
    "id": 163,
    "module": "Treatment Process",
    "difficulty": "easy",
    "question": "Anaerobic digestion of wastewater sludge produces:",
    "options": [
      "Carbon dioxide and water only",
      "Methane (CH4) and carbon dioxide (CO2) as biogas",
      "Nitrogen gas and water",
      "Oxygen and carbon dioxide"
    ],
    "correct": 1,
    "explanation": "Anaerobic digestion converts organic matter in sludge to biogas (60-70% CH4, 30-40% CO2) through a series of microbial reactions: hydrolysis, acidogenesis, acetogenesis, and methanogenesis."
  },
  {
    "id": 164,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "The volatile solids reduction in a well-operating mesophilic anaerobic digester is typically:",
    "options": [
      "10-20%",
      "30-40%",
      "50-60%",
      "80-90%"
    ],
    "correct": 2,
    "explanation": "A well-operating mesophilic anaerobic digester (35 degrees C, 20-30 day SRT) typically achieves 50-60% volatile solids reduction. This represents the destruction of biodegradable organic matter, reducing sludge mass and improving dewaterability."
  },
  {
    "id": 165,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Thermophilic anaerobic digestion operates at a temperature of approximately:",
    "options": [
      "20-25 degrees C",
      "35-38 degrees C",
      "50-55 degrees C",
      "65-70 degrees C"
    ],
    "correct": 2,
    "explanation": "Thermophilic anaerobic digestion operates at 50-55 degrees C. It achieves faster reaction rates and better pathogen destruction than mesophilic digestion (35 degrees C), but is more sensitive to temperature fluctuations and requires more energy for heating."
  },
  {
    "id": 166,
    "module": "Treatment Process",
    "difficulty": "hard",
    "question": "Class A biosolids (as defined by EPA 503 regulations) are required to:",
    "options": [
      "Meet only metal concentration limits",
      "Meet pathogen reduction requirements to below detectable levels for specified pathogens",
      "Be treated by anaerobic digestion only",
      "Be applied only to agricultural land"
    ],
    "correct": 1,
    "explanation": "Class A biosolids must meet pathogen reduction requirements to below detectable levels for Salmonella, enteric viruses, and viable helminth ova. They can be applied to lawns, gardens, and other public access areas."
  },
  {
    "id": 167,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "Belt filter presses are used in wastewater treatment for:",
    "options": [
      "Screening influent wastewater",
      "Mechanically dewatering sludge to produce a cake",
      "Thickening waste activated sludge",
      "Filtering tertiary effluent"
    ],
    "correct": 1,
    "explanation": "Belt filter presses dewater conditioned sludge by pressing it between two porous belts. Polymer conditioning is required to improve dewaterability. Typical cake solids: 15-25% for WAS, 20-30% for digested sludge."
  },
  {
    "id": 168,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "The purpose of polymer conditioning before sludge dewatering is to:",
    "options": [
      "Increase the BOD of the sludge",
      "Neutralize the negative charge on sludge particles to improve flocculation and water release",
      "Reduce the pathogen content",
      "Increase the volatile solids content"
    ],
    "correct": 1,
    "explanation": "Sludge particles carry a negative charge that keeps them dispersed. Cationic polymers neutralize this charge, allowing particles to flocculate into larger aggregates that release water more readily during mechanical dewatering."
  },
  {
    "id": 169,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "The purpose of a centrifuge in sludge processing is to:",
    "options": [
      "Digest the sludge anaerobically",
      "Separate solids from liquid using centrifugal force for thickening or dewatering",
      "Measure the volatile solids content",
      "Disinfect the sludge"
    ],
    "correct": 1,
    "explanation": "Centrifuges use centrifugal force (1,000-3,000 x gravity) to rapidly separate solids from liquid. They are used for both thickening (gravity belt thickener alternative) and dewatering (belt press alternative), achieving 20-30% cake solids."
  },
  {
    "id": 170,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "The purpose of lime stabilization of sludge is to:",
    "options": [
      "Reduce the volume of sludge",
      "Raise the pH to 12 or higher to destroy pathogens and reduce odours",
      "Increase the methane production",
      "Improve the dewaterability of the sludge"
    ],
    "correct": 1,
    "explanation": "Lime stabilization raises the sludge pH to 12 or higher by adding calcium oxide (quicklime) or calcium hydroxide (hydrated lime). The high pH destroys pathogens and reduces odours. It is a low-cost alternative to anaerobic digestion."
  },
  {
    "id": 171,
    "module": "Treatment Process",
    "difficulty": "medium",
    "question": "A land application site for biosolids must have adequate setback distances from:",
    "options": [
      "Only residential areas",
      "Water bodies, wells, property lines, and public access areas",
      "Only drinking water wells",
      "Only agricultural areas"
    ],
    "correct": 1,
    "explanation": "Biosolids land application setback distances protect: surface water (prevent runoff), drinking water wells (prevent groundwater contamination), property lines (prevent nuisance), and public access areas (prevent exposure). Specific distances are set by provincial regulations."
  },
  {
    "id": 172,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Which type of sewer system contains domestic and industrial wastes?",
    "options": [
      "Domestic wastewater system",
      "Sanitary sewer system",
      "Separate collection system",
      "Combined sewer system"
    ],
    "correct": 1,
    "explanation": "A sanitary sewer is designed to collect and convey waste streams from homes (domestic) and industries (industrial). A combined sewer system incorporates all of the street runoff and other drains that are combined with the sanitary system and enter the treatment plant. It is not uncommon for the flow to a plant to double or triple when the sewer system is combined."
  },
  {
    "id": 173,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Which of the following lines are not used in transporting wastewater from its source in a home to the treatment plant?",
    "options": [
      "House sewers",
      "Lateral sewers",
      "Trunk sewers",
      "Storm sewers"
    ],
    "correct": 3,
    "explanation": "Storm sewers are designed to only convey street runoff and other rain catch basin flows to a destination … maybe a lake or treatment facility. Sanitary or domestic waste streams are not conveyed through storm drains."
  },
  {
    "id": 174,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Which gases do not usually cause problems in sewer collection systems?",
    "options": [
      "Explosive gases",
      "Hydrogen sulfide",
      "Methane",
      "Carbon dioxide"
    ],
    "correct": 3,
    "explanation": "Carbon dioxide (CO2) is the least harmful gas listed in this question. However, high CO2 concentrations in a space, accompanied with low oxygen concentrations, can be very harmful to people."
  },
  {
    "id": 175,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "If a grit chamber is passing grit through the tank, what adjustment should be made to the velocity?",
    "options": [
      "Increase the velocity",
      "Decrease the velocity",
      "The velocity must be higher than 3.0 fps to function",
      "Velocity has nothing to do with grit removal"
    ],
    "correct": 1,
    "explanation": "Grit chambers are designed to maintain a velocity of about 1.0 fps, which allows heavier inorganic material to settle out and be removed from the chamber and lighter organic material to remain in suspension and leave with the grit chamber effluent. If grit is passing through the chamber, this means the velocity is too high and should be decreased."
  },
  {
    "id": 176,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Which chemical is most commonly used in a wet scrubber odor control system when dealing with H2S gas?",
    "options": [
      "Polymer",
      "Sodium hydroxide",
      "Alum",
      "Water"
    ],
    "correct": 1,
    "explanation": "Hydrogen Sulfide (H2S) odors are more common in the headworks of a treatment facility, opposed to the solids handling portion of the plant. In order for H2S to be effectively removed from the odorous air in a wet scrubber unit, it must be driven into a high pH solution … this is called absorption."
  },
  {
    "id": 177,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Is hydrogen sulfide (H2S) lighter or heavier than the weight of air?",
    "options": [
      "Lighter, it will rise",
      "Heavier, it will settle",
      "No difference, they are both the same weight",
      "Hydrogen sulfide has a neutral weight"
    ],
    "correct": 1,
    "explanation": "Hydrogen sulfide has a specific gravity greater that air … and therefore will settle to making it impossible to smell dangerous concentrations. It is heavier than air and is considered to be a very toxic gas. When H2S burns it produces another very toxic gas - Sulfur Dioxide (SO2)."
  },
  {
    "id": 178,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "What may be the cause of gas and/or solids rise to the surface of a primary clarifier?",
    "options": [
      "Too much sludge being removed",
      "Poor screenings removal",
      "Aeration SRT too low",
      "Not enough sludge being removed"
    ],
    "correct": 3,
    "explanation": "Gas and/or solids rising to the surface in a primary clarifier typically indicates a septic condition in the tank. This can be caused by an inadequate amount of sludge being withdrawn from the tank."
  },
  {
    "id": 179,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "What is the surface loading rate for a primary clarifier, given the following data? · Primary clarifier diameter is 75 feet · Tank depth is 13 feet · Flow entering the clarifier is 2,587 gpm",
    "options": [
      "445 gpd/ft2",
      "844 gpd/ft2",
      "130 gpd/ft2",
      "1,157 gpd/ft2"
    ],
    "correct": 1,
    "explanation": "Surface loading rate in gpd/ft2 is calculated as follows: Gallons per day entering the tank divided by the surface area of the tank in ft2 Gallons per day = 2,587 gpm x 1,440 mins/day = 3,725,280 gpd"
  },
  {
    "id": 180,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Which statement is true regarding sample collection?",
    "options": [
      "Collect the sample when the operator has time",
      "Collect the sample at a convenient location in the plant",
      "Collect the sample so it is representative of the wastewater being tested",
      "Collect the sample bare-handed What is the result of this formula? Total Solids - Fixed Solids = Answer : b. Volatile solids Feedback: When a solids sample is burned in a muffle furnace, the remaining solids are fixed. So, total solids minus fixed solids equals volatile solids. 00000000 00000000 00000000 00000000 00000000 00000000  "
    ],
    "correct": 2,
    "explanation": "All samples should be collected in such a way that they are representative of the conditions within the facility and respective process area at the time of collection."
  },
  {
    "id": 181,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Which dangerous gas will be more likely to rise near the surface of a manhole?",
    "options": [
      "Hydrogen sulfide",
      "Methane",
      "Nitrogen",
      "Carbon dioxide"
    ],
    "correct": 1,
    "explanation": "Deaths are not uncommon when people enter poorly ventilated spaces such as deep wells, underground tanks or sewer systems. Since Hydrogen Sulfide (H2S) gas is heavier than air, its concentration is highest near the bottom of enclosed spaces."
  },
  {
    "id": 182,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Which dangerous gas will be more likely to rise near the surface of a manhole?",
    "options": [
      "Hydrogen sulfide",
      "Methane",
      "Nitrogen",
      "Carbon dioxide"
    ],
    "correct": 1,
    "explanation": "Deaths are not uncommon when people enter poorly ventilated spaces such as deep wells, underground tanks or sewer systems. Since Hydrogen Sulfide (H2S) gas is heavier than air, its concentration is highest near the bottom of enclosed spaces."
  },
  {
    "id": 183,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Which dangerous gas will be more likely to rise near the surface of a manhole?",
    "options": [
      "Hydrogen sulfide",
      "Methane",
      "Nitrogen",
      "Carbon dioxide"
    ],
    "correct": 1,
    "explanation": "Deaths are not uncommon when people enter poorly ventilated spaces such as deep wells, underground tanks or sewer systems. Since Hydrogen Sulfide (H2S) gas is heavier than air, its concentration is highest near the bottom of enclosed spaces."
  },
  {
    "id": 184,
    "module": "Collection Systems",
    "difficulty": "easy",
    "question": "Which type of sewer system is designed to carry both sanitary wastewater and stormwater runoff?",
    "options": [
      "Sanitary sewer system",
      "Storm sewer system",
      "Combined sewer system",
      "Force main system"
    ],
    "correct": 2,
    "explanation": "Combined sewer systems carry both sanitary wastewater and stormwater in the same pipe. During heavy rainfall, combined sewer overflows (CSOs) can occur when the system capacity is exceeded, discharging untreated wastewater."
  },
  {
    "id": 185,
    "module": "Collection Systems",
    "difficulty": "easy",
    "question": "A force main in a wastewater collection system is:",
    "options": [
      "A gravity sewer with a steep slope",
      "A pressurized pipe that carries wastewater under pressure from a pump station",
      "A large-diameter trunk sewer",
      "A sewer that serves industrial areas only"
    ],
    "correct": 1,
    "explanation": "A force main is a pressurized pipe that carries wastewater from a pump (lift) station to a higher elevation or to the treatment plant. Unlike gravity sewers, force mains flow full and under pressure."
  },
  {
    "id": 186,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "The minimum velocity in a gravity sewer to prevent solids deposition is typically:",
    "options": [
      "0.5 ft/s",
      "1.0 ft/s",
      "2.0 ft/s",
      "5.0 ft/s"
    ],
    "correct": 2,
    "explanation": "A minimum self-cleaning velocity of 2.0 ft/s (0.6 m/s) is typically required in gravity sewers to prevent solids from settling and depositing in the pipe. This velocity should be achieved at least once daily."
  },
  {
    "id": 187,
    "module": "Collection Systems",
    "difficulty": "easy",
    "question": "Infiltration in a wastewater collection system refers to:",
    "options": [
      "Stormwater entering through roof drains and catch basins",
      "Groundwater entering through cracks, joints, and defects in sewer pipes",
      "Industrial wastewater discharged to the sewer",
      "Wastewater leaking out of the sewer into the ground"
    ],
    "correct": 1,
    "explanation": "Infiltration is groundwater that enters the collection system through defects in pipes (cracks, broken joints, deteriorated seals). It increases the hydraulic load on the treatment plant and can cause capacity problems."
  },
  {
    "id": 188,
    "module": "Collection Systems",
    "difficulty": "easy",
    "question": "Inflow in a wastewater collection system refers to:",
    "options": [
      "Groundwater entering through pipe defects",
      "Stormwater entering through direct connections (roof drains, catch basins, manhole covers)",
      "Industrial process water",
      "Return flow from irrigation"
    ],
    "correct": 1,
    "explanation": "Inflow is stormwater that enters the sanitary sewer through direct connections such as roof drains, foundation drains, catch basins, and unsealed manhole covers. Inflow is typically more rapid and intense than infiltration."
  },
  {
    "id": 189,
    "module": "Collection Systems",
    "difficulty": "easy",
    "question": "A wet well in a lift station is designed to:",
    "options": [
      "Treat the wastewater before pumping",
      "Provide storage volume to allow pumps to cycle on and off",
      "Remove grit from the wastewater",
      "Measure the flow entering the pump station"
    ],
    "correct": 1,
    "explanation": "The wet well provides storage volume that allows pumps to operate in on/off cycles rather than continuously. The wet well volume is sized to achieve an acceptable pump cycle time (typically 10-15 minutes minimum between starts)."
  },
  {
    "id": 190,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "The minimum cycle time for a lift station pump is important because:",
    "options": [
      "Longer cycles reduce energy consumption",
      "Frequent starts cause motor overheating and premature failure",
      "Shorter cycles improve treatment efficiency",
      "Longer cycles reduce wear on check valves"
    ],
    "correct": 1,
    "explanation": "Each motor start draws a large inrush current (5-7 times running current) that generates heat. Too-frequent starts (short cycles) prevent the motor from cooling between starts, causing overheating and premature motor failure."
  },
  {
    "id": 191,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Hydrogen sulfide (H2S) in sewer collection systems is produced by:",
    "options": [
      "Aerobic bacteria oxidizing organic matter",
      "Sulfate-reducing bacteria under anaerobic conditions",
      "Nitrifying bacteria converting ammonia",
      "Photosynthesis in the sewer"
    ],
    "correct": 1,
    "explanation": "Sulfate-reducing bacteria (SRB) convert sulfate (SO4 2-) to hydrogen sulfide (H2S) under anaerobic conditions. This occurs in septic sewers (long detention times, warm temperatures, high BOD) and causes corrosion and odour problems."
  },
  {
    "id": 192,
    "module": "Collection Systems",
    "difficulty": "hard",
    "question": "Concrete sewer pipe corrosion caused by hydrogen sulfide is a two-step process where:",
    "options": [
      "H2S directly attacks the concrete",
      "H2S is oxidized to sulfuric acid by bacteria on the pipe crown, which then attacks the concrete",
      "H2S reacts with calcium to form calcium sulfide",
      "H2S increases the pH, dissolving the concrete"
    ],
    "correct": 1,
    "explanation": "H2S gas rises to the pipe crown (above the waterline), where Thiobacillus bacteria oxidize it to sulfuric acid (H2SO4). The sulfuric acid attacks the concrete, causing crown corrosion. This is called microbially induced corrosion (MIC)."
  },
  {
    "id": 193,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "To control hydrogen sulfide in a collection system, operators can:",
    "options": [
      "Increase the slope of the sewer pipes",
      "Add oxygen, nitrate, or iron salts to prevent anaerobic conditions",
      "Reduce the flow velocity",
      "Increase the detention time in the sewer"
    ],
    "correct": 1,
    "explanation": "H2S control methods include: adding oxygen (air injection), adding nitrate (as an alternative electron acceptor for SRB), adding iron salts (to precipitate sulfide as iron sulfide), or adding caustic soda to raise pH."
  },
  {
    "id": 194,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "A combined sewer overflow (CSO) occurs when:",
    "options": [
      "A sanitary sewer overflows due to a blockage",
      "A combined sewer system exceeds its capacity during storm events, discharging to receiving waters",
      "A lift station fails and wastewater backs up",
      "A force main breaks and wastewater spills"
    ],
    "correct": 1,
    "explanation": "CSOs occur when rainfall and runoff entering a combined sewer system exceed its capacity. The excess flow (a mixture of stormwater and raw sewage) overflows through relief structures to receiving waters."
  },
  {
    "id": 195,
    "module": "Collection Systems",
    "difficulty": "easy",
    "question": "Sewer cleaning using high-velocity water jets (hydro-jetting) is used to:",
    "options": [
      "Detect leaks in sewer pipes",
      "Remove grease, roots, and debris that have accumulated in the sewer",
      "Repair cracks in sewer pipes",
      "Measure the flow in the sewer"
    ],
    "correct": 1,
    "explanation": "Hydro-jetting uses high-pressure water (1,500-4,000 psi) to clean sewer pipes by removing grease deposits, root intrusions, sediment, and other blockages. It is the most common method for preventive sewer maintenance."
  },
  {
    "id": 196,
    "module": "Collection Systems",
    "difficulty": "easy",
    "question": "CCTV inspection of sewer pipes is used to:",
    "options": [
      "Measure the flow velocity in the pipe",
      "Visually inspect the condition of the pipe interior for defects, cracks, and root intrusions",
      "Detect hydrogen sulfide levels in the sewer",
      "Clean the sewer pipe"
    ],
    "correct": 1,
    "explanation": "CCTV (closed-circuit television) inspection uses a camera mounted on a wheeled crawler to visually inspect the interior of sewer pipes. It identifies defects, root intrusions, cracks, joint failures, and other problems."
  },
  {
    "id": 197,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Trenchless sewer rehabilitation methods include:",
    "options": [
      "Open-cut replacement only",
      "Cured-in-place pipe (CIPP) lining, pipe bursting, and slip lining",
      "Concrete encasement",
      "Chemical grouting only"
    ],
    "correct": 1,
    "explanation": "Trenchless rehabilitation methods repair or replace sewer pipes without extensive excavation. CIPP installs a resin-impregnated liner inside the existing pipe. Pipe bursting fractures the old pipe and pulls a new pipe through. Slip lining inserts a smaller pipe inside the existing pipe."
  },
  {
    "id": 198,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "A sanitary sewer overflow (SSO) must be reported to the regulatory authority because:",
    "options": [
      "It increases the flow to the treatment plant",
      "It is an unpermitted discharge of untreated wastewater that poses public health and environmental risks",
      "It reduces the efficiency of the treatment plant",
      "It indicates the sewer is operating correctly"
    ],
    "correct": 1,
    "explanation": "SSOs are unpermitted discharges of raw or partially treated wastewater that can contaminate surface water, groundwater, and public areas, posing serious public health and environmental risks. They must be reported and corrected promptly."
  },
  {
    "id": 199,
    "module": "Collection Systems",
    "difficulty": "easy",
    "question": "The purpose of a check valve in a lift station force main is to:",
    "options": [
      "Control the flow rate",
      "Prevent backflow of wastewater when the pump stops",
      "Reduce the pressure in the force main",
      "Measure the flow in the force main"
    ],
    "correct": 1,
    "explanation": "Check valves (non-return valves) prevent wastewater from flowing back through the pump when it stops. Without check valves, the weight of water in the force main would cause reverse flow and could damage the pump."
  },
  {
    "id": 200,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "A variable frequency drive (VFD) on a lift station pump allows:",
    "options": [
      "The pump to operate at a fixed speed only",
      "The pump speed to be varied to match the inflow rate, reducing energy consumption",
      "The pump to handle larger solids",
      "The pump to operate without a motor"
    ],
    "correct": 1,
    "explanation": "VFDs allow pump speed to be varied continuously to match the inflow rate, maintaining a more constant wet well level. This reduces energy consumption (pump energy is proportional to speed cubed), reduces wear, and eliminates frequent on/off cycling."
  },
  {
    "id": 201,
    "module": "Collection Systems",
    "difficulty": "easy",
    "question": "Grease buildup in sewer collection systems is primarily caused by:",
    "options": [
      "Industrial chemical discharges",
      "Fats, oils, and grease (FOG) from food service establishments and residences",
      "Stormwater runoff",
      "Root intrusions from trees"
    ],
    "correct": 1,
    "explanation": "Fats, oils, and grease (FOG) from restaurants, food processing facilities, and residences solidify in the sewer, accumulating on pipe walls and causing blockages. FOG control programs (grease traps, inspections) are used to prevent sewer overflows."
  },
  {
    "id": 202,
    "module": "Collection Systems",
    "difficulty": "easy",
    "question": "Root intrusion in sewer pipes is a common problem because:",
    "options": [
      "Roots are attracted to the warmth of the wastewater",
      "Roots seek moisture and nutrients, entering through pipe joints and cracks",
      "Roots grow faster in the presence of H2S",
      "Roots are attracted to the pressure in the sewer"
    ],
    "correct": 1,
    "explanation": "Tree and shrub roots seek moisture and nutrients. They enter sewer pipes through joints, cracks, and service connections, growing into the pipe and causing blockages. Chemical root control (copper sulfate, foaming herbicides) and mechanical cutting are used."
  },
  {
    "id": 203,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Smoke testing of a sewer system is used to:",
    "options": [
      "Detect hydrogen sulfide levels",
      "Identify illegal connections and sources of inflow",
      "Measure the flow in the sewer",
      "Clean the sewer pipes"
    ],
    "correct": 1,
    "explanation": "Smoke testing forces non-toxic smoke into the sewer system. Smoke emerging from the ground, buildings, or storm drains identifies illegal connections, leaking manholes, and other sources of inflow that allow stormwater to enter the sanitary sewer."
  },
  {
    "id": 204,
    "module": "Collection Systems",
    "difficulty": "easy",
    "question": "Lift station alarms are required to alert operators to:",
    "options": [
      "Normal operating conditions",
      "High wet well level, pump failure, and power outages",
      "Routine maintenance schedules",
      "Changes in influent flow rate"
    ],
    "correct": 1,
    "explanation": "Lift station alarms alert operators to abnormal conditions that require immediate response: high wet well level (risk of SSO), pump failure, power outage, and other equipment malfunctions. Alarms are typically connected to SCADA and auto-dialers."
  },
  {
    "id": 205,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "The purpose of a bypass pump setup at a lift station is to:",
    "options": [
      "Increase the pumping capacity during normal operations",
      "Provide emergency pumping capability when the primary pumps fail",
      "Reduce energy consumption",
      "Measure the flow in the wet well"
    ],
    "correct": 1,
    "explanation": "Bypass pumping uses portable pumps to maintain flow when the primary pumps are out of service for maintenance or repair. This prevents wet well overflow and sanitary sewer overflows during pump downtime."
  },
  {
    "id": 206,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "The design of a gravity sewer should ensure that the pipe flows:",
    "options": [
      "Full at all times",
      "At 50-75% full at peak flow to maintain ventilation and self-cleaning velocity",
      "At 100% full at average flow",
      "At less than 25% full to prevent surcharging"
    ],
    "correct": 1,
    "explanation": "Gravity sewers are typically designed to flow at 50-75% full at peak flow. This provides freeboard for unexpected flow increases, maintains ventilation (to prevent H2S buildup), and ensures the pipe can convey peak flows without surcharging."
  },
  {
    "id": 207,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Sewer pipe material selection depends on:",
    "options": [
      "Only the pipe diameter",
      "Soil conditions, groundwater, pipe size, flow velocity, and potential for corrosion",
      "The distance to the treatment plant only",
      "The age of the sewer system"
    ],
    "correct": 1,
    "explanation": "Sewer pipe material selection considers: soil conditions (corrosive soils), groundwater (buoyancy, infiltration), pipe size, flow velocity (abrasion), potential for H2S corrosion, traffic loads, and cost. Common materials: PVC, HDPE, concrete, ductile iron, vitrified clay."
  },
  {
    "id": 208,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Infiltration/inflow (I/I) is measured by comparing:",
    "options": [
      "Influent BOD to effluent BOD",
      "Dry weather flow to wet weather flow at the treatment plant",
      "Pump run times to flow meter readings",
      "MLSS to effluent TSS"
    ],
    "correct": 1,
    "explanation": "I/I is quantified by comparing dry weather flow (base flow without significant groundwater or stormwater contribution) to wet weather flow. The difference represents the I/I entering the system during and after rain events."
  },
  {
    "id": 209,
    "module": "Collection Systems",
    "difficulty": "easy",
    "question": "The purpose of a grease interceptor (grease trap) at a food service establishment is to:",
    "options": [
      "Remove pathogens from the wastewater",
      "Capture fats, oils, and grease before they enter the sewer system",
      "Reduce the BOD of the wastewater",
      "Measure the flow from the establishment"
    ],
    "correct": 1,
    "explanation": "Grease interceptors are installed at food service establishments to capture FOG before it enters the sewer. They work by gravity separation — grease floats to the top and is retained while wastewater flows through. Regular cleaning is required."
  },
  {
    "id": 210,
    "module": "Collection Systems",
    "difficulty": "hard",
    "question": "A sewer system capacity, management, operations, and maintenance (CMOM) program is required to:",
    "options": [
      "Comply with NPDES permit conditions and prevent SSOs",
      "Train new operators on pump maintenance",
      "Calculate the BOD loading to the treatment plant",
      "Design new sewer extensions"
    ],
    "correct": 0,
    "explanation": "CMOM programs are required by the EPA to ensure collection systems are properly managed, operated, and maintained to prevent SSOs. They include capacity assessment, maintenance programs, overflow response plans, and reporting requirements."
  },
  {
    "id": 211,
    "module": "Collection Systems",
    "difficulty": "hard",
    "question": "Cured-in-place pipe (CIPP) lining is a trenchless rehabilitation method that:",
    "options": [
      "Inserts a rigid pipe inside the existing pipe",
      "Installs a resin-impregnated flexible liner that is cured in place to form a new pipe within the old pipe",
      "Fractures the old pipe and pulls in a new pipe",
      "Applies a spray-on coating to the pipe interior"
    ],
    "correct": 1,
    "explanation": "CIPP installs a felt or fiberglass liner saturated with thermosetting resin inside the existing pipe. The liner is inflated and cured (by hot water, steam, or UV light) to form a rigid, jointless pipe within the old pipe, sealing cracks and joints."
  },
  {
    "id": 212,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "The purpose of oxygen injection into a force main is to:",
    "options": [
      "Increase the BOD of the wastewater",
      "Prevent H2S generation by maintaining aerobic conditions",
      "Reduce the pressure in the force main",
      "Improve the efficiency of the pumps"
    ],
    "correct": 1,
    "explanation": "Injecting oxygen (or air) into force mains maintains aerobic conditions that prevent sulfate-reducing bacteria from generating H2S. This controls odours and prevents concrete corrosion in the downstream sewer."
  },
  {
    "id": 213,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "The purpose of a sewer use ordinance (SUO) is to:",
    "options": [
      "Regulate the construction of new sewer extensions",
      "Establish standards for what can be discharged to the sewer system",
      "Set the sewer service rates",
      "Require permits for sewer connections"
    ],
    "correct": 1,
    "explanation": "A sewer use ordinance establishes the rules and regulations governing what can be discharged to the municipal sewer system, including prohibited substances, limits on pollutant concentrations, and requirements for industrial pre-treatment."
  },
  {
    "id": 214,
    "module": "Collection Systems",
    "difficulty": "hard",
    "question": "Surge protection in a force main system is used to:",
    "options": [
      "Increase the pumping capacity",
      "Prevent water hammer damage caused by sudden pump starts and stops",
      "Reduce the pressure in the force main",
      "Measure the flow in the force main"
    ],
    "correct": 1,
    "explanation": "Water hammer (hydraulic transients) occurs when pump starts/stops cause pressure waves in the force main. Surge protection devices (air chambers, surge tanks, slow-closing valves) absorb these pressure waves and prevent pipe damage."
  },
  {
    "id": 215,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Exfiltration from a sewer system refers to:",
    "options": [
      "Groundwater entering the sewer through pipe defects",
      "Wastewater leaking out of the sewer into the surrounding soil",
      "Stormwater entering through manhole covers",
      "Air entering the sewer system"
    ],
    "correct": 1,
    "explanation": "Exfiltration is the leakage of wastewater from the sewer into the surrounding soil and groundwater. It can contaminate groundwater and soil, and indicates pipe defects that also allow infiltration when the groundwater table is high."
  },
  {
    "id": 216,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Dye testing in a sewer system is used to:",
    "options": [
      "Measure the BOD of the wastewater",
      "Trace the flow path and confirm connections between specific locations",
      "Detect hydrogen sulfide",
      "Measure the velocity in the sewer"
    ],
    "correct": 1,
    "explanation": "Dye testing introduces a non-toxic fluorescent dye into a suspected inflow source (catch basin, roof drain, foundation drain). If the dye appears in the sanitary sewer, it confirms an illegal or improper connection."
  },
  {
    "id": 217,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "The minimum depth of cover over a sewer pipe in a roadway is typically:",
    "options": [
      "1 foot",
      "3 feet",
      "5 feet",
      "8 feet"
    ],
    "correct": 1,
    "explanation": "Sewer pipes in roadways typically require a minimum of 3 feet (0.9 m) of cover to protect them from traffic loads and frost penetration. Greater depths may be required in cold climates or under heavy traffic areas."
  },
  {
    "id": 218,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Manhole spacing in a gravity sewer system is typically:",
    "options": [
      "Every 50 feet",
      "Every 100-500 feet",
      "Every 1,000 feet",
      "Every mile"
    ],
    "correct": 1,
    "explanation": "Manholes are typically spaced 100-500 feet (30-150 m) apart, depending on pipe diameter and local standards. They are also required at every change in pipe direction, grade, size, or material, and at every junction."
  },
  {
    "id": 219,
    "module": "Collection Systems",
    "difficulty": "hard",
    "question": "A sewer system's hydraulic capacity is determined by:",
    "options": [
      "The number of manholes in the system",
      "The pipe diameter, slope, roughness coefficient, and Manning's equation",
      "The number of lift stations",
      "The age of the pipes"
    ],
    "correct": 1,
    "explanation": "Gravity sewer capacity is calculated using Manning's equation: Q = (1/n) x A x R^(2/3) x S^(1/2), where n is the roughness coefficient, A is the cross-sectional area, R is the hydraulic radius, and S is the slope."
  },
  {
    "id": 220,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "The purpose of a pre-treatment program for industrial users is to:",
    "options": [
      "Treat industrial wastewater to drinking water standards",
      "Prevent industrial discharges from interfering with treatment plant operations or violating effluent limits",
      "Measure the flow from industrial users",
      "Provide free treatment for small industries"
    ],
    "correct": 1,
    "explanation": "Industrial pre-treatment programs (required under the Clean Water Act) set limits on industrial discharges to prevent interference with biological treatment, protect biosolids quality, and prevent pass-through of pollutants that would violate the plant's NPDES permit."
  },
  {
    "id": 221,
    "module": "Collection Systems",
    "difficulty": "hard",
    "question": "Trenchless pipe bursting is used to:",
    "options": [
      "Clean blocked sewer pipes",
      "Replace deteriorated pipes with new pipes of the same or larger diameter without excavation",
      "Inspect the condition of sewer pipes",
      "Seal cracks in sewer pipes"
    ],
    "correct": 1,
    "explanation": "Pipe bursting uses a bursting head pulled through the existing pipe to fracture it outward while simultaneously pulling in a new pipe (typically HDPE). It replaces deteriorated pipes without excavation and can upsize the pipe diameter."
  },
  {
    "id": 222,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "The purpose of a flow equalization basin in a collection system is to:",
    "options": [
      "Provide primary treatment",
      "Store peak flows and release them at a uniform rate to protect the treatment plant",
      "Remove grit before the treatment plant",
      "Provide emergency storage for spills"
    ],
    "correct": 1,
    "explanation": "Flow equalization basins store peak flows (during wet weather or morning peaks) and release them at a controlled rate. This prevents hydraulic overloading of the treatment plant and maintains more consistent treatment performance."
  },
  {
    "id": 223,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "The purpose of a sewer atlas or GIS mapping system is to:",
    "options": [
      "Record the daily flow measurements",
      "Document the location, size, material, and condition of all sewer system components",
      "Track the maintenance history of lift stations",
      "Calculate the BOD loading to the treatment plant"
    ],
    "correct": 1,
    "explanation": "A sewer atlas or GIS mapping system documents the location, size, material, age, and condition of all sewer pipes, manholes, lift stations, and other components. It is essential for operations, maintenance planning, and emergency response."
  },
  {
    "id": 224,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "Odour control at lift stations is important because:",
    "options": [
      "Odours indicate the pump is working correctly",
      "H2S and other odorous gases are generated in wet wells and can cause nuisance and safety hazards",
      "Odours improve the efficiency of the pumps",
      "Odours indicate the wastewater is being treated"
    ],
    "correct": 1,
    "explanation": "Lift station wet wells generate H2S and other odorous gases from anaerobic decomposition. These gases cause public nuisance complaints, are toxic to workers, and can be explosive (methane). Odour control systems (biofilters, chemical scrubbers) are used."
  },
  {
    "id": 225,
    "module": "Collection Systems",
    "difficulty": "hard",
    "question": "A pressure sewer system (STEP or STEG) is used in:",
    "options": [
      "Dense urban areas with high flows",
      "Low-density areas where gravity sewers are not cost-effective",
      "Industrial areas with high-strength wastewater",
      "Areas with very steep terrain"
    ],
    "correct": 1,
    "explanation": "Pressure sewer systems (Septic Tank Effluent Pumping/Gravity) use individual grinder pumps or effluent pumps at each property to pump wastewater into a small-diameter pressure main. They are cost-effective in low-density rural areas."
  },
  {
    "id": 226,
    "module": "Collection Systems",
    "difficulty": "medium",
    "question": "The purpose of a sewer system emergency response plan is to:",
    "options": [
      "Document the daily operations of the collection system",
      "Provide procedures for responding to SSOs, pump failures, and other emergencies",
      "Train operators on routine maintenance",
      "Calculate the annual capital improvement budget"
    ],
    "correct": 1,
    "explanation": "Emergency response plans document procedures for responding to SSOs, pump station failures, pipe breaks, and other emergencies. They include notification requirements, containment procedures, cleanup protocols, and regulatory reporting requirements."
  },
  {
    "id": 227,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What is the correct incubation time and temperature for the BOD test?",
    "options": [
      "5 days at 20°F",
      "5 days at 20°C",
      "20 days at 5°C",
      "5 days at 68°C"
    ],
    "correct": 1,
    "explanation": "Biochemical oxygen demand (BOD) basically identifies the pollutional strength of the raw wastewater. It determines the amount of oxygen required to breakdown the organic material in the wastewater … measured as mg/L."
  },
  {
    "id": 228,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What process test can be performed in about 10 minutes and identifies the amount of oxygen being consumed by the microorganisms?",
    "options": [
      "OUR, mg/l/hr",
      "SVI ml/mg",
      "SRT, days",
      "F/M ratio"
    ],
    "correct": 0,
    "explanation": "Oxygen Uptake Rate (OUR) is a test that indicates the amount of oxygen consumed in a tested sample. Even though the test can be conducted in about 10 minutes, the units are mg/L of oxygen consumed per hour of time."
  },
  {
    "id": 229,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What is the percent CBOD5 removal efficiency in this plant? · Influent CBOD5 is 200 mg/l · Effluent CBOD5 is 2.5 mg/l",
    "options": [
      "98.8%",
      "100%",
      "89.6%",
      "99.0%"
    ],
    "correct": 0,
    "explanation": "CBOD5 removal efficiency = (In - Out) ÷ In x 100 = % Or, differently written, In - Out x 100 = % In 200 - 2.5 x 100= 98.75% 200"
  },
  {
    "id": 230,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What is the F/M ratio of this activated sludge process? · Influent Flow is 5.75 mgd · Influent CBOD5 is 200 mg/l · Three (3) Aeration Tanks, Each @ 100 ft. Long, 25 ft. Wide, and 14 ft. Deep · Aeration MLSS is 2,500 mg/l · Aeration MLSS is 77% Volatile",
    "options": [
      "0.42",
      "0.21",
      "0.76",
      "1.31"
    ],
    "correct": 2,
    "explanation": "F/M Ratio =F = Influent CBOD5, lbs/day M = Aeration MLVSS, lbs"
  },
  {
    "id": 231,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What is the SRT of this activated sludge plant? · Influent Flow is 5.75 mgd · Effluent TSS is 2.0 mg/l · Aeration MLSS is 2,500 mg/l · WAS Volume is 0.1 mgd · Three Aeration Tanks, Each @ 100 ft. Long, 25 ft. Wide, and 14 ft. Deep · WAS Concentration is 0.7% Total Solids",
    "options": [
      "12 days",
      "8.5 days",
      "6.5 days",
      "2.7 days"
    ],
    "correct": 3,
    "explanation": "SRT, days = Pounds MLSS Inventory in Aeration Lbs/day TSS Removed from the Process"
  },
  {
    "id": 232,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What is the GSA (Gould Sludge Age) in this plant? · Three (3) Aeration Tanks, Each @ 100 ft. Long, 25 ft. Wide, and 14 ft. Deep · Aeration MLSS is 2,500 mg/l · Influent Flow is 5.75 mgd · Influent TSS is 180 mg/l",
    "options": [
      "6.4 days",
      "1.9 days",
      "8.0 days",
      "0.527 days"
    ],
    "correct": 1,
    "explanation": "GSA, days = Pounds MLSS Inventory in Aeration Lbs/day TSS Entering Aeration"
  },
  {
    "id": 233,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Which test indicates the amount of time it takes for sludge particles to float to the surface in the DAF process?",
    "options": [
      "Rise rate",
      "D.O.",
      "Centrifuge spindown",
      "Microscopic exam"
    ],
    "correct": 0,
    "explanation": "Floc time indicates how much time it takes the sludge particles to form a floc. The rise rate test indicates the amount of time it takes for the flocculated sludge to rise to the surface of the test vessel … and, ultimately, in the DAF tank."
  },
  {
    "id": 234,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Which test is not recommended to use for process control of an anaerobic digestion process?",
    "options": [
      "pH",
      "Acid/alkalinity",
      "Volatile reduction",
      "Methane gas production"
    ],
    "correct": 0,
    "explanation": "Because anaerobic digestion has an abundance of alkalinity, the digester can basically go completely “sour” before it is reflected with a drop in pH. This is the reason why pH is a poor indicator of anaerobic digestion process performance."
  },
  {
    "id": 235,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What is the fecal coliform limit to meet standards for Class A biosolids?",
    "options": [
      "1,000 #/gram TS",
      "10,000 #/gram TS",
      "1,000,000 #/gram TS",
      "2,000,000 #/gram TS"
    ],
    "correct": 0,
    "explanation": "It just is! Class A residuals fecal coliform is no more that 1,000 #/gram TS. The fecal coliform limit for Class B residuals is 2,000,000 #/gram TS."
  },
  {
    "id": 236,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What is the fecal coliform limit to meet standards for Class B biosolids?",
    "options": [
      "1,000 #/gram TS",
      "10,000 #/gram TS",
      "1,000,000 #/gram TS",
      "2,000,000 #/gram TS"
    ],
    "correct": 3,
    "explanation": "It just is! The fecal coliform value for Class “B” sludge in the EPA 503 rule is no more than 2,000,000 per gram of total solids. The fecal value for Class “A” is no more than 1,000 per gram of total solids. What pipe material is used to convey chlorine (liquid or gas) under pressure from one-ton containers to downstream equipment components? Answer : a. Black iron pipe Feedback: Question No. 116 The pipe most compatible of conveying chlorine gas or liquid at pressures equal to that in the chlorine ton container is black iron pipe. Liquid chlorine, or gaseous chlorine under pressure, will basically melt PVC pipe. 00000000 00000000 00000000 00000000 00000000 00000000  "
  },
  {
    "id": 237,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Which type of flow meter uses an open channel to measure the flow rate?",
    "options": [
      "Magnetic",
      "Venturi",
      "Parshall flume",
      "Differential pressure"
    ],
    "correct": 2,
    "explanation": "A Parshall flume is a specially shaped open channel flow section, which may be installed in a ditch, canal, or lateral to measure the flow rate. The Parshall flume is a particular form of venturi flume and is named for its principal developer, the late Mr. Ralph L. Parshall."
  },
  {
    "id": 238,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Why are flow measurements important?",
    "options": [
      "They help to determine D.O.",
      "They help to determine loading rates",
      "They help to determine nitrate levels",
      "They help to determine suspended solids removal"
    ],
    "correct": 1,
    "explanation": "Loading rates require knowledge of the particular flow rate entering the facility or a process unit. An accurate flow meter is an integral component in the calculation of plant and process loading rates. Flow measurement is also typically required in many facility operating permits."
  },
  {
    "id": 239,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Proper sampling and laboratory protocol is essential to the efficient operation of a wastewater treatment facility. Treatment units may best be operated and maintained when proper sampling and laboratory procedures are implemente",
    "options": [
      "Total suspended solids",
      "Volatile solids",
      "Fixed suspended solids",
      "Settleable solids 00000000 00000000 00000000 00000000  "
    ],
    "correct": 1,
    "explanation": "When a solids sample is burned in a muffle furnace, the remaining solids are fixed. So, total solids minus fixed solids equals volatile solids. 00000000 00000000 00000000 00000000 00000000 00000000  "
  },
  {
    "id": 240,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What is the term that identifies the probable number of fecal coliform in wastewater effluent?",
    "options": [
      "COD",
      "MPN",
      "pH",
      "D.O."
    ],
    "correct": 1,
    "explanation": "MPN … Most Probable Number … is the term that describes fecal coliform colonies in a wastewater sample."
  },
  {
    "id": 241,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Which lab test requires the use of an analytical balance, a drying oven, filter papers, a muffle furnace, and a desiccator?",
    "options": [
      "VSS",
      "TS",
      "BOD5",
      "Settleable solids"
    ],
    "correct": 0,
    "explanation": "The volatile suspended solids (VSS) test requires the use of an analytical balance, a drying oven, filter papers, a muffle furnace, and a desiccator."
  },
  {
    "id": 242,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What is the TSS concentration, given the following data: · 50 ml of sample · Tare weight of filter is 11.8873 grams · Final weight of filter after drying is 12.2255 grams",
    "options": [
      "2,624 mg/l",
      "13,012 mg/l",
      "6,764 mg/l",
      "1,312 mg/l"
    ],
    "correct": 2,
    "explanation": "TSS, ppm = weight of suspended solids in grams x (1,000,000  ml of sample) Weight of TSS =Final Wt. - Paper Tare Wt. =12.2255 gm - 11.8873 gm =0.3382 gm"
  },
  {
    "id": 243,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What is the standard temperature in the muffle furnace for the VSS test?",
    "options": [
      "20 to 25°C",
      "110 to 115°C",
      "103 to 105°C",
      "545 to 555°C"
    ],
    "correct": 3,
    "explanation": "The acceptable (Standard Methods) temperature of a muffle furnace for the VSS test is about 550°C."
  },
  {
    "id": 244,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What is the temperature of the incubation for a BOD test?",
    "options": [
      "20°F",
      "5°C",
      "25°F",
      "68°F What will be the volume of a tank if the flow entering is 5 mgd and the detention time is 1.5 hours? Answer : d. 312,500 gals Feedback: Tank Volume, mg =(flow, mgd x D.T., hours)  24 hrs/day =5 mgd x 1.5 hrs  24 hrs/day =0.3125 mg x 1,000,000 =312,500 gallons 00000000 00000000 00000000 00000000 00000000 00000000    "
    ],
    "correct": 3,
    "explanation": "The required temperature for a BOD incubator is 68F … which is the same as 20C. Fahrenheit minus 32 divided by 1.8 equals Centigrade. 68F - 32  1.8 = 20C. Question No. 151 What is the volume in gallons occupied by 45,000 cubic feet of water? a. 336,600 gals b. 168,300 gals c. 375,300 gals d. 2,808,000 gals 00000000 00000000 00000000 00000000  "
  },
  {
    "id": 245,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What is the temperature of the incubation for a BOD test? Answer :",
    "options": [
      "336,600 gals",
      "168,300 gals",
      "375,300 gals",
      "2,808,000 gals 00000000 00000000 00000000 00000000  "
    ],
    "correct": 0,
    "explanation": "After the required incubation period, the completed filter paper is held under a magnifying glass and the number of colonies that have grown on the paper are counted. Question No. 152 What is the fraction, in its least common denominator, for the decimal 0.42? a. 42 b. 43 c. 21 d. 84 100 50 50 100 00000000 00000000 00000000 00000000  "
  },
  {
    "id": 246,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "How is fecal coliform identified in the membrane filter test method?",
    "options": [
      "The number of colonies grown on the filter paper",
      "The number of positive tubes",
      "The number of negative tubes",
      "The number of colonies grown in the tube"
    ],
    "correct": 0,
    "explanation": "After the required incubation period, the completed filter paper is held under a magnifying glass and the number of colonies that have grown on the paper are counted. Question No. 152 What is the fraction, in its least common denominator, for the decimal 0.42? a. 42 b. 43 c. 21 d. 84 100 50 50 100 00000000 00000000 00000000 00000000  "
  },
  {
    "id": 247,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What is the standard temperature in the drying oven for the TSS test?",
    "options": [
      "20 to 25°C",
      "110 to 115°C",
      "103 to 105°C",
      "545 to 555°C"
    ],
    "correct": 2,
    "explanation": "The acceptable (Standard Methods) temperature of a drying oven for the TSS test is about 104°C. Question No. 153 What does this formula represent? ⅓ π r2 x depth, ft. x 7.48 gals/ft3 a. Volume of a cone in ft3 b. Volume of a circular tank in gallons c. Volume of a sphere in gallons d. Volume of a cone in gallons 00000000 00000000 00000000 00000000  "
  },
  {
    "id": 248,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What is the standard temperature in the drying oven for the TSS test? Answer :",
    "options": [
      "Volume of a cone in ft3",
      "Volume of a circular tank in gallons",
      "Volume of a sphere in gallons",
      "Volume of a cone in gallons 00000000 00000000 00000000 00000000  "
    ],
    "correct": 2,
    "explanation": "The acceptable (Standard Methods) temperature of a refrigerator storing samples is about 4°C."
  },
  {
    "id": 249,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What temperature should samples be stored in a sample refrigerator?",
    "options": [
      "10°C",
      "1°C",
      "4°C",
      "4°F"
    ],
    "correct": 2,
    "explanation": "The acceptable (Standard Methods) temperature of a refrigerator storing samples is about 4°C."
  },
  {
    "id": 250,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "What is the moisture content of a sludge sample that measures 5.25% total solids?",
    "options": [
      "5.25%",
      "19%",
      ".05%",
      "94.75%"
    ],
    "correct": 3,
    "explanation": "1.0 - 0.0525 x 100 = 94.75% moisture or 100 - 5.25 = 94.75"
  },
  {
    "id": 251,
    "module": "Laboratory Analysis",
    "difficulty": "easy",
    "question": "Which of the following is a physical parameter of wastewater?",
    "options": [
      "BOD",
      "pH",
      "Temperature",
      "Ammonia nitrogen"
    ],
    "correct": 2,
    "explanation": "Temperature is a physical parameter. BOD and ammonia nitrogen are chemical parameters. pH is a chemical parameter. Physical parameters include temperature, colour, odour, turbidity, and solids."
  },
  {
    "id": 252,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The standard method for measuring total suspended solids (TSS) uses a filter with a pore size of:",
    "options": [
      "0.1 um",
      "0.45 um",
      "1.2 um",
      "10 um"
    ],
    "correct": 1,
    "explanation": "TSS is measured by filtering through a glass fibre filter with a nominal pore size of 0.45 um (or 1.2 um for some methods). Particles larger than the pore size are retained on the filter and weighed after drying."
  },
  {
    "id": 253,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The difference between total solids (TS) and total suspended solids (TSS) is:",
    "options": [
      "TS includes dissolved solids; TSS does not",
      "TSS includes dissolved solids; TS does not",
      "They are the same measurement",
      "TS measures volatile solids only"
    ],
    "correct": 0,
    "explanation": "Total Solids (TS) = Total Suspended Solids (TSS) + Total Dissolved Solids (TDS). TSS is the fraction retained on a filter; TDS passes through the filter. TS is measured by evaporating a sample to dryness."
  },
  {
    "id": 254,
    "module": "Laboratory Analysis",
    "difficulty": "hard",
    "question": "The most probable number (MPN) method for coliform testing is based on:",
    "options": [
      "Direct counting of colonies on agar plates",
      "Statistical probability of coliform presence based on a series of dilution tubes",
      "Membrane filtration and colony counting",
      "PCR amplification of coliform DNA"
    ],
    "correct": 1,
    "explanation": "The MPN method uses multiple tubes of growth media at different dilutions. After incubation, positive tubes (gas production or colour change) are counted and compared to statistical tables to estimate the most probable number of coliforms per 100 mL."
  },
  {
    "id": 255,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "A blank sample in laboratory analysis is used to:",
    "options": [
      "Calibrate the instrument",
      "Check for contamination in the reagents and equipment",
      "Measure the background concentration in the sample",
      "Determine the method detection limit"
    ],
    "correct": 1,
    "explanation": "A reagent blank (or method blank) contains all reagents used in the analysis but no sample. It is used to detect contamination in the reagents, glassware, or equipment that could cause false positive results."
  },
  {
    "id": 256,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "A duplicate sample in laboratory analysis is used to:",
    "options": [
      "Check for contamination",
      "Assess the precision (reproducibility) of the analytical method",
      "Determine the accuracy of the method",
      "Calibrate the instrument"
    ],
    "correct": 1,
    "explanation": "Duplicate samples (two portions of the same sample analyzed independently) assess the precision (repeatability) of the analytical method and the analyst. Large differences between duplicates indicate poor precision."
  },
  {
    "id": 257,
    "module": "Laboratory Analysis",
    "difficulty": "hard",
    "question": "A spike (matrix spike) sample in laboratory analysis is used to:",
    "options": [
      "Check for contamination in the reagents",
      "Assess the accuracy (recovery) of the analytical method in the sample matrix",
      "Calibrate the instrument",
      "Measure the background concentration"
    ],
    "correct": 1,
    "explanation": "A matrix spike adds a known amount of the analyte to the sample before analysis. The percent recovery (measured concentration / expected concentration x 100%) assesses whether the sample matrix is interfering with the analysis."
  },
  {
    "id": 258,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Chain of custody (COC) documentation for water samples is required to:",
    "options": [
      "Ensure samples are analyzed within the holding time",
      "Document the possession and handling of samples from collection to analysis",
      "Specify the analytical methods to be used",
      "Record the sample collection location"
    ],
    "correct": 1,
    "explanation": "Chain of custody documents the possession and handling of samples from collection through analysis. It ensures sample integrity and provides a legal record that samples were not tampered with or contaminated during transport."
  },
  {
    "id": 259,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Sample holding time refers to:",
    "options": [
      "The time the sample is in the laboratory before analysis",
      "The maximum time between sample collection and analysis that maintains sample integrity",
      "The time required to perform the analysis",
      "The time the sample can be stored after analysis"
    ],
    "correct": 1,
    "explanation": "Holding time is the maximum time between sample collection and analysis during which the sample remains representative of the original conditions. Exceeding holding times can cause changes in analyte concentrations due to biological activity, chemical reactions, or volatilization."
  },
  {
    "id": 260,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Ammonia (NH3-N) samples should be preserved by:",
    "options": [
      "Freezing at -20 degrees C",
      "Adding sulfuric acid to pH < 2 and refrigerating at 4 degrees C",
      "Adding sodium thiosulfate",
      "Adding sodium hydroxide"
    ],
    "correct": 1,
    "explanation": "Ammonia samples are preserved by acidification to pH < 2 with H2SO4 and refrigeration at 4 degrees C. This prevents biological activity that would convert ammonia to other forms. Holding time is 28 days."
  },
  {
    "id": 261,
    "module": "Laboratory Analysis",
    "difficulty": "hard",
    "question": "The Winkler (iodometric) method is used to measure:",
    "options": [
      "BOD",
      "Dissolved oxygen",
      "pH",
      "Chlorine residual"
    ],
    "correct": 1,
    "explanation": "The Winkler (iodometric) titration method measures dissolved oxygen. Manganese sulfate and alkali-iodide-azide reagents are added to fix the oxygen, then the sample is acidified and titrated with sodium thiosulfate. It is the reference method for DO."
  },
  {
    "id": 262,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The DPD (N,N-diethyl-p-phenylenediamine) method is used to measure:",
    "options": [
      "BOD",
      "Dissolved oxygen",
      "Chlorine residual",
      "Ammonia"
    ],
    "correct": 2,
    "explanation": "The DPD colorimetric method measures chlorine residual. DPD reacts with free chlorine to form a pink colour; the intensity is proportional to the chlorine concentration. It can differentiate between free and combined chlorine."
  },
  {
    "id": 263,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The purpose of seeding in the BOD test is to:",
    "options": [
      "Add nutrients to the sample",
      "Provide a source of microorganisms to oxidize the organic matter",
      "Increase the oxygen content of the dilution water",
      "Neutralize the pH of the sample"
    ],
    "correct": 1,
    "explanation": "Seeding adds a small amount of acclimated microorganisms (from settled sewage, effluent, or river water) to samples that may not contain enough bacteria to perform the BOD test (e.g., industrial effluents, chlorinated samples)."
  },
  {
    "id": 264,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The dilution water used in the BOD test must be:",
    "options": [
      "Tap water with chlorine removed",
      "Distilled or deionized water saturated with oxygen and containing nutrients",
      "Raw wastewater diluted 10:1",
      "Treated effluent from the plant"
    ],
    "correct": 1,
    "explanation": "BOD dilution water must be oxygen-saturated (DO >= 8 mg/L), contain nutrients (phosphate, nitrogen, magnesium, calcium, iron), and be free of organic matter and toxic substances. It is typically prepared from distilled or deionized water."
  },
  {
    "id": 265,
    "module": "Laboratory Analysis",
    "difficulty": "hard",
    "question": "The carbonaceous BOD (CBOD) test differs from the standard BOD test in that:",
    "options": [
      "CBOD uses a shorter incubation time",
      "CBOD uses a nitrification inhibitor to prevent nitrogenous oxygen demand",
      "CBOD measures only dissolved organic matter",
      "CBOD uses a higher incubation temperature"
    ],
    "correct": 1,
    "explanation": "CBOD5 uses a nitrification inhibitor (allyl thiourea or TCMP) to suppress nitrification, measuring only the carbonaceous (organic) oxygen demand. Standard BOD5 includes both carbonaceous and nitrogenous oxygen demand."
  },
  {
    "id": 266,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Alkalinity in wastewater is measured by:",
    "options": [
      "pH meter reading",
      "Titration with a standard acid solution to pH 4.5",
      "Colorimetric method using DPD",
      "Gravimetric method after evaporation"
    ],
    "correct": 1,
    "explanation": "Alkalinity is measured by titrating a sample with a standard sulfuric acid solution to a pH endpoint of 4.5 (total alkalinity). The volume of acid used is proportional to the alkalinity concentration (expressed as mg/L as CaCO3)."
  },
  {
    "id": 267,
    "module": "Laboratory Analysis",
    "difficulty": "easy",
    "question": "The purpose of the settleable solids test (Imhoff cone) is to:",
    "options": [
      "Measure the total suspended solids",
      "Measure the volume of solids that settle by gravity in 60 minutes",
      "Determine the sludge volume index",
      "Measure the volatile fraction of solids"
    ],
    "correct": 1,
    "explanation": "The Imhoff cone test measures settleable solids — the volume of solids (mL/L) that settle by gravity in a 1-litre cone-shaped vessel in 60 minutes. It is a simple field test used to assess primary clarifier performance."
  },
  {
    "id": 268,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Nitrate (NO3--N) in wastewater effluent is regulated because:",
    "options": [
      "It causes corrosion of pipes",
      "It contributes to eutrophication and can cause methemoglobinemia in infants",
      "It increases the BOD of the effluent",
      "It is toxic to fish at low concentrations"
    ],
    "correct": 1,
    "explanation": "Nitrate is regulated because: (1) it contributes to eutrophication in receiving waters; (2) at high concentrations (>10 mg/L as N) it causes methemoglobinemia (blue baby syndrome) in infants who drink the water."
  },
  {
    "id": 269,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The purpose of a calibration curve in colorimetric analysis is to:",
    "options": [
      "Determine the holding time for samples",
      "Establish the relationship between absorbance and concentration for quantitative analysis",
      "Check for contamination in the reagents",
      "Measure the blank absorbance"
    ],
    "correct": 1,
    "explanation": "A calibration curve is prepared by measuring the absorbance of a series of standards with known concentrations. The linear relationship between absorbance and concentration (Beer-Lambert law) is used to calculate the concentration of unknowns."
  },
  {
    "id": 270,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Fecal coliform bacteria are incubated at what temperature for the membrane filtration method?",
    "options": [
      "20 degrees C",
      "35 degrees C",
      "44.5 degrees C",
      "37 degrees C"
    ],
    "correct": 2,
    "explanation": "Fecal coliforms are incubated at 44.5 degrees C (+/-0.2 degrees C) for 24 hours on M-FC agar. This elevated temperature selects for fecal coliforms (which can grow at 44.5 degrees C) over non-fecal coliforms (which cannot tolerate this temperature)."
  },
  {
    "id": 271,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Total coliforms are incubated at what temperature for the membrane filtration method?",
    "options": [
      "20 degrees C",
      "35 degrees C",
      "44.5 degrees C",
      "55 degrees C"
    ],
    "correct": 1,
    "explanation": "Total coliforms are incubated at 35 degrees C (+/-0.5 degrees C) for 24 hours on M-Endo agar. Total coliforms include both fecal and non-fecal coliforms. The higher incubation temperature (44.5 degrees C) selects specifically for fecal coliforms."
  },
  {
    "id": 272,
    "module": "Laboratory Analysis",
    "difficulty": "easy",
    "question": "The purpose of sodium thiosulfate in coliform sample collection is to:",
    "options": [
      "Preserve the sample by killing bacteria",
      "Neutralize residual chlorine that would kill coliform bacteria",
      "Adjust the pH of the sample",
      "Prevent oxidation of the sample"
    ],
    "correct": 1,
    "explanation": "Sodium thiosulfate (Na2S2O3) is added to sample bottles before collection to neutralize residual chlorine. Chlorine would kill coliform bacteria during transport, giving falsely low coliform counts."
  },
  {
    "id": 273,
    "module": "Laboratory Analysis",
    "difficulty": "easy",
    "question": "The purpose of the 30-minute settling test in activated sludge operations is to:",
    "options": [
      "Measure the BOD of the mixed liquor",
      "Determine the volume of sludge that settles in 30 minutes (used to calculate SVI)",
      "Measure the dissolved oxygen in the aeration tank",
      "Determine the MLSS concentration"
    ],
    "correct": 1,
    "explanation": "The 30-minute settling test measures the volume of sludge (mL/L) that settles in a 1-litre graduated cylinder in 30 minutes. Combined with MLSS, it is used to calculate SVI = (settled volume x 1000) / MLSS."
  },
  {
    "id": 274,
    "module": "Laboratory Analysis",
    "difficulty": "easy",
    "question": "Dissolved oxygen (DO) meters must be calibrated:",
    "options": [
      "Once per year",
      "Before each use or at least daily",
      "Only when the probe is replaced",
      "After every 100 measurements"
    ],
    "correct": 1,
    "explanation": "DO meters should be calibrated before each use or at least daily. Calibration is typically done in air (air-saturated water or water-saturated air) at a known temperature and barometric pressure. Membrane fouling and electrolyte depletion affect accuracy."
  },
  {
    "id": 275,
    "module": "Laboratory Analysis",
    "difficulty": "easy",
    "question": "pH meters must be calibrated using:",
    "options": [
      "Distilled water only",
      "At least two buffer solutions that bracket the expected sample pH",
      "A single buffer at pH 7.0",
      "Tap water with known pH"
    ],
    "correct": 1,
    "explanation": "pH meters should be calibrated with at least two buffer solutions that bracket the expected sample pH range (e.g., pH 4 and 7, or pH 7 and 10). Two-point calibration corrects for both slope and offset errors."
  },
  {
    "id": 276,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The purpose of the jar test in wastewater treatment is to:",
    "options": [
      "Measure the BOD of the wastewater",
      "Optimize coagulant/polymer dose for chemical treatment or sludge conditioning",
      "Measure the settleability of activated sludge",
      "Determine the chlorine demand"
    ],
    "correct": 1,
    "explanation": "The jar test simulates coagulation, flocculation, and settling in bench-scale jars. It is used to optimize coagulant type and dose, polymer dose, pH, and mixing conditions for chemical phosphorus removal, sludge conditioning, or other chemical treatment processes."
  },
  {
    "id": 277,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Turbidity measurement is important for UV disinfection because:",
    "options": [
      "High turbidity increases UV dose",
      "High turbidity absorbs UV light, reducing disinfection effectiveness",
      "Low turbidity indicates the presence of pathogens",
      "Turbidity has no effect on UV disinfection"
    ],
    "correct": 1,
    "explanation": "Turbidity (suspended particles) absorbs and scatters UV light, reducing the UV dose delivered to microorganisms. Most UV disinfection systems require effluent turbidity < 2 NTU to ensure adequate pathogen inactivation."
  },
  {
    "id": 278,
    "module": "Laboratory Analysis",
    "difficulty": "easy",
    "question": "The purpose of measuring mixed liquor suspended solids (MLSS) in an activated sludge system is to:",
    "options": [
      "Measure the BOD removal efficiency",
      "Monitor the concentration of biological solids in the aeration tank for process control",
      "Determine the settling rate of the sludge",
      "Measure the dissolved oxygen in the aeration tank"
    ],
    "correct": 1,
    "explanation": "MLSS monitoring is essential for activated sludge process control. It is used to calculate SVI, F/M ratio, SRT, and to determine when to waste sludge. Maintaining MLSS in the target range (1,500-4,000 mg/L) ensures optimal treatment."
  },
  {
    "id": 279,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Microscopic examination of activated sludge is used to:",
    "options": [
      "Count the number of coliform bacteria",
      "Assess the health of the biological community and identify operational problems",
      "Measure the BOD of the mixed liquor",
      "Determine the MLSS concentration"
    ],
    "correct": 1,
    "explanation": "Microscopic examination identifies the types and abundance of microorganisms (floc structure, filaments, protozoa, rotifers) in activated sludge. The microbial community structure indicates the health of the system and can identify problems like bulking, foaming, and poor flocculation."
  },
  {
    "id": 280,
    "module": "Laboratory Analysis",
    "difficulty": "hard",
    "question": "Bioassay testing of wastewater effluent is used to:",
    "options": [
      "Measure the BOD of the effluent",
      "Assess the toxicity of the effluent to aquatic organisms",
      "Measure the coliform count in the effluent",
      "Determine the nutrient content of the effluent"
    ],
    "correct": 1,
    "explanation": "Whole effluent toxicity (WET) testing exposes test organisms (fish, invertebrates, algae) to the effluent to assess its toxicity. WET tests are required by NPDES permits to ensure the effluent does not cause acute or chronic toxicity in receiving waters."
  },
  {
    "id": 281,
    "module": "Laboratory Analysis",
    "difficulty": "hard",
    "question": "The purpose of measuring volatile fatty acids (VFAs) in an anaerobic digester is to:",
    "options": [
      "Measure the BOD of the digester contents",
      "Monitor digester stability — high VFAs indicate digester stress or overloading",
      "Determine the methane production rate",
      "Measure the alkalinity of the digester"
    ],
    "correct": 1,
    "explanation": "VFAs (acetic, propionic, butyric acids) are intermediates in anaerobic digestion. Elevated VFAs indicate that acid-forming bacteria are producing acids faster than methane-forming bacteria can consume them, signaling digester stress or overloading."
  },
  {
    "id": 282,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Digester gas analysis typically measures:",
    "options": [
      "BOD and COD of the gas",
      "Methane (CH4) and carbon dioxide (CO2) percentages",
      "Hydrogen sulfide and ammonia only",
      "Dissolved oxygen in the gas"
    ],
    "correct": 1,
    "explanation": "Digester gas (biogas) is analyzed for methane (CH4) and carbon dioxide (CO2) content. Healthy digesters produce 60-70% CH4 and 30-40% CO2. Low methane content indicates poor digestion or inhibition of methanogens."
  },
  {
    "id": 283,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The purpose of measuring sludge volume index (SVI) is to:",
    "options": [
      "Determine the BOD of the sludge",
      "Assess the settling characteristics of activated sludge",
      "Measure the volatile solids content",
      "Determine the polymer dose for dewatering"
    ],
    "correct": 1,
    "explanation": "SVI = (30-min settled volume in mL/L x 1000) / MLSS in mg/L. It assesses sludge settleability. SVI < 150 mL/g = good settling; SVI 150-250 = marginal; SVI > 250 = bulking sludge with poor settling."
  },
  {
    "id": 284,
    "module": "Laboratory Analysis",
    "difficulty": "hard",
    "question": "The purpose of measuring total Kjeldahl nitrogen (TKN) in wastewater is to:",
    "options": [
      "Measure the nitrate and nitrite content",
      "Determine the organic nitrogen plus ammonia nitrogen loading",
      "Measure the total nitrogen in all forms",
      "Assess the denitrification efficiency"
    ],
    "correct": 1,
    "explanation": "TKN = Organic nitrogen + Ammonia nitrogen (NH3-N + NH4+-N). It represents the nitrogen forms that exert oxygen demand during nitrification and contribute to eutrophication. TKN + NO3--N + NO2--N = Total nitrogen."
  },
  {
    "id": 285,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The purpose of measuring alkalinity in an anaerobic digester is to:",
    "options": [
      "Determine the BOD of the digester contents",
      "Monitor the buffer capacity and stability of the digestion process",
      "Measure the methane content of the biogas",
      "Determine the polymer dose for sludge dewatering"
    ],
    "correct": 1,
    "explanation": "Digester alkalinity (typically 2,000-5,000 mg/L as CaCO3) provides buffering capacity to resist pH drops caused by VFA accumulation. A declining alkalinity/VFA ratio indicates digester stress. Alkalinity monitoring is essential for stable digester operation."
  },
  {
    "id": 286,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Residual chlorine in a treated wastewater effluent sample must be neutralized before:",
    "options": [
      "pH measurement",
      "BOD analysis to prevent killing the seed microorganisms",
      "TSS measurement",
      "COD analysis"
    ],
    "correct": 1,
    "explanation": "Residual chlorine in the effluent sample must be neutralized (with sodium thiosulfate) before BOD analysis. Chlorine would kill the seed microorganisms used in the BOD test, giving falsely low BOD results."
  },
  {
    "id": 287,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The purpose of measuring total volatile solids (TVS) in sludge is to:",
    "options": [
      "Determine the total solids content",
      "Estimate the organic (biodegradable) fraction of the sludge",
      "Measure the pathogen content",
      "Determine the polymer dose for dewatering"
    ],
    "correct": 1,
    "explanation": "TVS (total volatile solids) is the fraction of total solids that burns off at 550 degrees C, representing the organic content. TVS is used to calculate volatile solids loading to digesters, assess digestion efficiency, and estimate the biodegradable fraction."
  },
  {
    "id": 288,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The oxygen saturation concentration in water decreases as:",
    "options": [
      "Temperature decreases",
      "Temperature increases",
      "Altitude decreases",
      "Salinity decreases"
    ],
    "correct": 1,
    "explanation": "Oxygen solubility (saturation) decreases as temperature increases (warm water holds less oxygen) and as salinity increases. At sea level: DO saturation is approximately 14.6 mg/L at 0 degrees C, 9.1 mg/L at 20 degrees C, 7.6 mg/L at 30 degrees C."
  },
  {
    "id": 289,
    "module": "Laboratory Analysis",
    "difficulty": "hard",
    "question": "Nitrite (NO2--N) in a wastewater sample indicates:",
    "options": [
      "Complete nitrification has occurred",
      "Incomplete nitrification — nitrification is stalled at the nitrite stage",
      "Denitrification is occurring",
      "The wastewater is fully treated"
    ],
    "correct": 1,
    "explanation": "Nitrite is an intermediate in nitrification (NH4+ -> NO2- -> NO3-). Elevated nitrite indicates incomplete nitrification, where Nitrosomonas is converting ammonia to nitrite but Nitrobacter is not completing the conversion to nitrate."
  },
  {
    "id": 290,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Total organic carbon (TOC) analysis measures:",
    "options": [
      "The BOD of the wastewater",
      "The total concentration of organic carbon in the sample",
      "The volatile suspended solids",
      "The chemical oxygen demand"
    ],
    "correct": 1,
    "explanation": "TOC measures the total concentration of carbon in organic compounds in the sample. It is a rapid alternative to BOD and COD for monitoring organic loading. TOC analyzers oxidize organic carbon to CO2 and measure it with an infrared detector."
  },
  {
    "id": 291,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The purpose of measuring biogas production rate in an anaerobic digester is to:",
    "options": [
      "Measure the BOD of the digester contents",
      "Monitor digester performance and calculate volatile solids destruction efficiency",
      "Determine the polymer dose for sludge dewatering",
      "Measure the alkalinity of the digester"
    ],
    "correct": 1,
    "explanation": "Biogas production rate (m3/day or ft3/day) is a key performance indicator for anaerobic digesters. Normal production is 12-18 ft3/lb VS destroyed. Declining gas production indicates digester stress, inhibition, or reduced organic loading."
  },
  {
    "id": 292,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The purpose of measuring sludge cake solids content after dewatering is to:",
    "options": [
      "Determine the BOD of the sludge",
      "Assess dewatering performance and calculate the mass of solids for disposal",
      "Measure the pathogen content of the sludge",
      "Determine the polymer dose required"
    ],
    "correct": 1,
    "explanation": "Sludge cake solids content (% dry weight) measures the effectiveness of dewatering. Higher solids content means less water in the cake, reducing transportation and disposal costs. Typical targets: belt filter press 15-25%, centrifuge 20-30%."
  },
  {
    "id": 293,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Biochemical oxygen demand (BOD) is affected by which of the following factors?",
    "options": [
      "Only temperature",
      "Temperature, pH, presence of inhibitory substances, and seed microorganism activity",
      "Only the organic content of the sample",
      "Only the dissolved oxygen level"
    ],
    "correct": 1,
    "explanation": "BOD is affected by: temperature (higher temperature increases reaction rate), pH (optimal 6.5-8.5), presence of inhibitory substances (heavy metals, biocides, chlorine), and the activity of the seed microorganisms."
  },
  {
    "id": 294,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The purpose of measuring effluent turbidity before UV disinfection is to:",
    "options": [
      "Determine the chlorine dose required",
      "Ensure the turbidity is low enough for effective UV disinfection",
      "Measure the coliform count",
      "Determine the BOD of the effluent"
    ],
    "correct": 1,
    "explanation": "Turbidity must be measured before UV disinfection because high turbidity (suspended solids) absorbs and scatters UV light, reducing the UV dose delivered to pathogens. Most UV systems require turbidity < 2 NTU for reliable disinfection."
  },
  {
    "id": 295,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The purpose of a quality control (QC) chart in a laboratory is to:",
    "options": [
      "Document the chain of custody for samples",
      "Monitor the performance of analytical methods over time and detect problems",
      "Specify the holding times for samples",
      "Record the calibration of instruments"
    ],
    "correct": 1,
    "explanation": "QC charts (control charts) plot the results of QC samples (blanks, duplicates, spikes) over time to detect trends, shifts, or out-of-control conditions in the analytical method. They are essential for maintaining data quality."
  },
  {
    "id": 296,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "Chlorophyll-a measurement in receiving water monitoring is used as an indicator of:",
    "options": [
      "BOD in the water",
      "Algal biomass and potential eutrophication",
      "Coliform bacteria levels",
      "Dissolved oxygen depletion"
    ],
    "correct": 1,
    "explanation": "Chlorophyll-a is the primary photosynthetic pigment in algae. Its concentration is used as a measure of algal biomass and is an indicator of eutrophication potential in receiving waters. High chlorophyll-a indicates excessive algal growth."
  },
  {
    "id": 297,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The purpose of measuring total dissolved solids (TDS) in wastewater effluent is to:",
    "options": [
      "Assess the biological activity in the effluent",
      "Evaluate the suitability of the effluent for irrigation or reuse",
      "Measure the organic content of the effluent",
      "Determine the chlorine demand"
    ],
    "correct": 1,
    "explanation": "TDS measures the concentration of dissolved salts and minerals in the effluent. High TDS can limit the use of reclaimed water for irrigation (can damage salt-sensitive plants) and indicates the presence of dissolved pollutants."
  },
  {
    "id": 298,
    "module": "Laboratory Analysis",
    "difficulty": "medium",
    "question": "The purpose of the chlorine demand test is to:",
    "options": [
      "Measure the residual chlorine in the effluent",
      "Determine the amount of chlorine consumed by the wastewater before a residual appears",
      "Measure the coliform count in the effluent",
      "Determine the dechlorination dose required"
    ],
    "correct": 1,
    "explanation": "The chlorine demand test determines how much chlorine is consumed by reactions with organic matter, ammonia, and other substances in the wastewater. Chlorine dose = Chlorine demand + Desired residual. This information is used to optimize the chlorine dose."
  },
  {
    "id": 299,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "What happens to the activity rate of activated sludge microorganisms when the temperature decreases?",
    "options": [
      "The activity rate decreases",
      "The activity rate increases",
      "The activity rate remains the same",
      "Temperature has no effect on activity rate"
    ],
    "correct": 0,
    "explanation": "Bugs are a lot like people … when the temperature drops, the rate of activity is typically reduced. Microorganism activity rate is in proportion to the water temperature … higher temp increase the rate … and lower temp decreases the rate."
  },
  {
    "id": 300,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "What generally happens to the thickened sludge concentration if too much sludge is removed from the bottom of the gravity thickener?",
    "options": [
      "It gets thicker",
      "It gets thinner",
      "Pumping has no affect on the thickened sludge concentration",
      "The blanket gets deeper"
    ],
    "correct": 0,
    "explanation": "Typically, when too much sludge is removed from a gravity thickener, the sludge concentration is reduced (thins out). This is provided that the blanket does not “rathole,” with a high rate of sludge withdrawal from the tank."
  },
  {
    "id": 301,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "What usually happens to the thickened solids content when the belt speed is decreased?",
    "options": [
      "The solids content decreased",
      "The solids content is cut in half",
      "The solids content is increased",
      "Belt speed has nothing to do with thickened sludge solids content"
    ],
    "correct": 2,
    "explanation": "When the belt speed of a GBT is decreased (slowed down), this typically increases the gravity dewatering time and allows more water to be removed. As more water is removed, the resultant sludge cake concentration is increased."
  },
  {
    "id": 302,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "What will happen to the GBT to indicate the need to clean the washbox nozzles?",
    "options": [
      "The cake will get too thick",
      "The belt may break",
      "The belt may have streaks of sludge",
      "The filtrate my be too clear"
    ],
    "correct": 2,
    "explanation": "Streaks of sludge on the belt typically indicate that the nozzles in that area are plugged. Cleaning the washbox nozzles will make the sludge streaks disappear."
  },
  {
    "id": 303,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "What would happen to the pH of the digesting sludge if the aeration to the aerobic digestion system was periodically shut off?",
    "options": [
      "The pH would decrease",
      "The pH would increase",
      "Aeration of the digester has nothing to do with pH",
      "The alkalinity would decrease"
    ],
    "correct": 1,
    "explanation": "Shutting off air to an aerobic digester will encourage biological denitrification to take place. Denitrification consumes nitrates as a source of oxygen, which are acidic in nature."
  },
  {
    "id": 304,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "What would happen to the pH of the digesting sludge if the aeration to the aerobic digestion system was never shut off?",
    "options": [
      "The pH would be low",
      "The pH would be high",
      "Aeration of the digester has nothing to do with pH",
      "The alkalinity would increase"
    ],
    "correct": 0,
    "explanation": "Continuous aeration in an aerobic digester will encourage nitrifying bacteria to convert as much ammonia-nitrogen as possible. This nitrification activity consumes alkalinity at a rate of about 7.2 lbs of alkalinity for each pound of ammonia converted to nitrate."
  },
  {
    "id": 305,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "What happens to the quality of the effluent after ozone is added to it?",
    "options": [
      "The color and odor are increased",
      "The color gets darker but the odor is neutral",
      "The color is unaffected but the odor is greater",
      "The color improves and the odor is neutral"
    ],
    "correct": 3,
    "explanation": "Because ozone is an oxidizer, it helps to improve the color of the water, as well as to reduce its odor characteristics. Question No. 131 What component of a pump keeps the material in the discharge pipe from emptying out through the pump suction when the pump is off? a. Pressure relief b. Check valve c. Mechanical seal d. Volute 00000000 00000000 00000000 00000000  "
  },
  {
    "id": 306,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "What happens to the quality of the effluent after ozone is added to it? Answer :",
    "options": [
      "Pressure relief",
      "Check valve",
      "Mechanical seal",
      "Volute 00000000 00000000 00000000 00000000  "
    ],
    "correct": 0,
    "explanation": "Air-supplied ozone generators typically require that the air be cooled, separated and dried before it is fed to the generator."
  },
  {
    "id": 307,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "What does H2S smell like at high concentrations?",
    "options": [
      "Rotten eggs",
      "Cabbage",
      "No smell",
      "Sweet orange"
    ],
    "correct": 2,
    "explanation": "Hydrogen Sulfide (H2S) is a colorless gas that smells like rotten eggs at low concentrations (from the sulphur). Often referred to as \"sewer gas,\" hydrogen sulfide is highly poisonous."
  },
  {
    "id": 308,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "Under Ontario Regulation 128/04, an Overall Responsible Operator (ORO) must:",
    "options": [
      "Be present at the facility at all times",
      "Hold the appropriate class of certificate for the facility and be designated in writing",
      "Have at least 10 years of experience",
      "Hold both water and wastewater certificates"
    ],
    "correct": 1,
    "explanation": "O. Reg. 128/04 requires that each regulated facility designate an ORO who holds the appropriate class of certificate. The ORO is responsible for the overall operation of the facility and must be designated in writing to the operating authority."
  },
  {
    "id": 309,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "The Environmental Compliance Approval (ECA) for a wastewater treatment plant specifies:",
    "options": [
      "The operator certification requirements only",
      "Effluent quality limits, monitoring requirements, and operating conditions",
      "The design of the treatment process",
      "The salary of the operators"
    ],
    "correct": 1,
    "explanation": "The ECA (formerly Certificate of Approval) issued by the MECP specifies the permitted effluent quality limits, monitoring and reporting requirements, operating conditions, and any special conditions applicable to the specific facility."
  },
  {
    "id": 310,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "When a wastewater treatment plant exceeds an effluent limit in its ECA, the operator must:",
    "options": [
      "Wait until the next quarterly report to report the exceedance",
      "Notify the MECP and take corrective action as specified in the ECA",
      "Reduce the influent flow to the plant",
      "Increase the chemical dosing rates"
    ],
    "correct": 1,
    "explanation": "ECA exceedances must be reported to the MECP within the timeframe specified in the ECA (typically 24 hours for serious exceedances). The operator must also document the cause, corrective actions taken, and preventive measures."
  },
  {
    "id": 311,
    "module": "Safety & Administration",
    "difficulty": "easy",
    "question": "The purpose of an operating log at a wastewater treatment plant is to:",
    "options": [
      "Record the salaries of all operators",
      "Document daily operations, maintenance activities, and process data for regulatory compliance",
      "Plan the annual capital budget",
      "Train new operators"
    ],
    "correct": 1,
    "explanation": "Operating logs document daily process data (flows, DO, MLSS, effluent quality), maintenance activities, chemical usage, equipment problems, and any unusual events. They are required by the ECA and are essential for regulatory compliance and troubleshooting."
  },
  {
    "id": 312,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "Confined space entry in Ontario is governed by:",
    "options": [
      "Ontario Regulation 128/04",
      "Ontario Regulation 632/05 (Confined Spaces)",
      "The Ontario Building Code",
      "The Environmental Protection Act"
    ],
    "correct": 1,
    "explanation": "Confined space entry in Ontario is governed by O. Reg. 632/05 (Confined Spaces) under the Occupational Health and Safety Act (OHSA). It requires written confined space programs, atmospheric testing, rescue plans, and trained entry supervisors."
  },
  {
    "id": 313,
    "module": "Safety & Administration",
    "difficulty": "easy",
    "question": "The Occupational Health and Safety Act (OHSA) in Ontario requires employers to:",
    "options": [
      "Provide free meals to workers",
      "Take every precaution reasonable to protect workers from workplace hazards",
      "Hire only certified operators",
      "Report all accidents to the MECP"
    ],
    "correct": 1,
    "explanation": "The OHSA requires employers to take every precaution reasonable in the circumstances to protect workers from workplace hazards. This includes providing safe equipment, training, PPE, and written procedures for hazardous work."
  },
  {
    "id": 314,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "A worker's right to refuse unsafe work under the OHSA means:",
    "options": [
      "Workers can refuse any work they dislike",
      "Workers can refuse work they believe is likely to endanger themselves or another worker",
      "Workers can refuse work without any consequences",
      "Workers must get written approval before refusing work"
    ],
    "correct": 1,
    "explanation": "Under the OHSA, workers have the right to refuse work they believe is likely to endanger themselves or another worker. The refusal process involves notifying the supervisor, investigation, and if unresolved, involving the Ministry of Labour."
  },
  {
    "id": 315,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "A Joint Health and Safety Committee (JHSC) is required at workplaces with:",
    "options": [
      "More than 5 workers",
      "20 or more workers",
      "50 or more workers",
      "100 or more workers"
    ],
    "correct": 1,
    "explanation": "Under the OHSA, a JHSC is required at workplaces with 20 or more regularly employed workers. The JHSC identifies workplace hazards, recommends improvements, and conducts workplace inspections."
  },
  {
    "id": 316,
    "module": "Safety & Administration",
    "difficulty": "easy",
    "question": "The WHMIS (Workplace Hazardous Materials Information System) program requires:",
    "options": [
      "Annual medical examinations for all workers",
      "Labels on hazardous products and Safety Data Sheets (SDS) accessible to workers",
      "Monthly chemical inventory audits",
      "Quarterly safety training for all workers"
    ],
    "correct": 1,
    "explanation": "WHMIS requires: (1) labels on hazardous products with hazard symbols and safety information; (2) Safety Data Sheets (SDS) accessible to workers; (3) worker education and training on hazardous products in the workplace."
  },
  {
    "id": 317,
    "module": "Safety & Administration",
    "difficulty": "hard",
    "question": "The lower explosive limit (LEL) for methane (CH4) is approximately:",
    "options": [
      "1%",
      "5%",
      "15%",
      "25%"
    ],
    "correct": 1,
    "explanation": "Methane has an LEL of approximately 5% (50,000 ppm) in air. Below the LEL, the mixture is too lean to ignite. Above the upper explosive limit (UEL, ~15%), it is too rich. Gas detectors typically alarm at 10-20% of LEL."
  },
  {
    "id": 318,
    "module": "Safety & Administration",
    "difficulty": "hard",
    "question": "When working with chlorine gas, the minimum respiratory protection required is:",
    "options": [
      "A dust mask",
      "A half-face respirator with acid gas cartridges",
      "A full-face respirator with SCBA",
      "No respiratory protection is needed below 1 ppm"
    ],
    "correct": 2,
    "explanation": "Chlorine gas is highly toxic (IDLH = 10 ppm). For concentrations above the IDLH or in unknown concentrations, SCBA (self-contained breathing apparatus) or supplied-air respirator is required. For lower concentrations, a full-face respirator with chlorine cartridges may be used."
  },
  {
    "id": 319,
    "module": "Safety & Administration",
    "difficulty": "easy",
    "question": "The purpose of a safety shower and eyewash station near chemical storage areas is to:",
    "options": [
      "Provide drinking water for workers",
      "Allow immediate flushing of chemicals from the skin or eyes in case of a spill or splash",
      "Provide cooling water for equipment",
      "Wash chemical containers before disposal"
    ],
    "correct": 1,
    "explanation": "Safety showers and eyewash stations provide immediate first aid for chemical splashes. ANSI/ISEA Z358.1 requires they be located within 10 seconds (approximately 55 feet) of the hazard and deliver tepid water for at least 15 minutes."
  },
  {
    "id": 320,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "The purpose of a pre-entry atmospheric test in a confined space is to:",
    "options": [
      "Determine if the space is clean enough to enter without PPE",
      "Verify that oxygen, flammable gas, and toxic gas levels are within safe limits before entry",
      "Measure the temperature inside the confined space",
      "Determine if the space requires cleaning before entry"
    ],
    "correct": 1,
    "explanation": "Pre-entry atmospheric testing verifies: (1) oxygen 19.5-23.5%; (2) flammable gases < 10% LEL; (3) toxic gases below PELs (H2S < 10 ppm, CO < 35 ppm). Testing must be done from outside the space before entry."
  },
  {
    "id": 321,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "A standby person (attendant) during confined space entry must:",
    "options": [
      "Enter the space to assist if a worker is in trouble",
      "Remain outside the space, maintain communication, and initiate rescue if needed",
      "Perform the atmospheric testing",
      "Operate the ventilation equipment"
    ],
    "correct": 1,
    "explanation": "The attendant (standby person) must remain outside the confined space, maintain continuous communication with entrants, monitor conditions, and initiate rescue procedures (without entering) if an emergency occurs. Entering the space to rescue is extremely dangerous."
  },
  {
    "id": 322,
    "module": "Safety & Administration",
    "difficulty": "easy",
    "question": "Mechanical ventilation of a confined space before entry is used to:",
    "options": [
      "Increase the temperature inside the space",
      "Purge hazardous gases and ensure adequate oxygen levels",
      "Reduce the humidity inside the space",
      "Cool the equipment inside the space"
    ],
    "correct": 1,
    "explanation": "Mechanical ventilation (blowers or fans) purges hazardous gases (H2S, CH4, CO) from the confined space and supplies fresh air to maintain safe oxygen levels. Ventilation must continue during the entire entry operation."
  },
  {
    "id": 323,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "The purpose of a confined space entry permit is to:",
    "options": [
      "Authorize the purchase of confined space equipment",
      "Document the hazard assessment, safety measures, and authorization for entry",
      "Record the maintenance history of the confined space",
      "Calculate the cost of the confined space work"
    ],
    "correct": 1,
    "explanation": "A confined space entry permit documents: the space to be entered, hazards identified, atmospheric test results, required PPE and equipment, rescue procedures, authorized entrants and attendant, and supervisor authorization. It must be completed before each entry."
  },
  {
    "id": 324,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "Fall protection is required when working at heights above:",
    "options": [
      "1 metre (3.3 feet)",
      "3 metres (10 feet)",
      "6 metres (20 feet)",
      "10 metres (33 feet)"
    ],
    "correct": 1,
    "explanation": "Under Ontario's OHSA (O. Reg. 213/91), fall protection is required when working at heights of 3 metres (10 feet) or more, or where there is a risk of falling into operating machinery, electrical equipment, or water. This includes working near open tanks and clarifiers."
  },
  {
    "id": 325,
    "module": "Safety & Administration",
    "difficulty": "easy",
    "question": "The purpose of a Material Safety Data Sheet (MSDS) / Safety Data Sheet (SDS) is to:",
    "options": [
      "Document the purchase history of chemicals",
      "Provide information on chemical hazards, safe handling, emergency response, and disposal",
      "Calculate the chemical dose for treatment",
      "Record the chemical inventory"
    ],
    "correct": 1,
    "explanation": "SDS (formerly MSDS) provides 16 sections of information: chemical identity, hazards, composition, first aid, fire-fighting, accidental release, handling/storage, exposure controls/PPE, physical/chemical properties, stability/reactivity, toxicology, ecology, disposal, transport, regulatory, and other information."
  },
  {
    "id": 326,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "Hearing protection is required when noise levels exceed:",
    "options": [
      "70 dBA",
      "85 dBA",
      "90 dBA",
      "100 dBA"
    ],
    "correct": 1,
    "explanation": "Under Ontario's OHSA, hearing protection is required when workers are exposed to noise levels of 85 dBA or more (8-hour TWA). Wastewater treatment plants have many high-noise areas: pump rooms, blower buildings, and dewatering areas."
  },
  {
    "id": 327,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "The purpose of a safety harness and lifeline during confined space entry is to:",
    "options": [
      "Prevent the worker from falling while climbing",
      "Allow non-entry rescue of an incapacitated worker from outside the space",
      "Support the worker while performing overhead work",
      "Prevent the worker from being swept away by flow"
    ],
    "correct": 1,
    "explanation": "A safety harness and lifeline (retrieval system) allows attendants to retrieve an incapacitated worker from outside the confined space without entering. Non-entry rescue is preferred because entering to rescue is extremely dangerous and has caused many fatalities."
  },
  {
    "id": 328,
    "module": "Safety & Administration",
    "difficulty": "easy",
    "question": "Chemical burns from sodium hydroxide (caustic soda) should be treated by:",
    "options": [
      "Applying vinegar to neutralize the alkali",
      "Immediately flushing with large amounts of water for at least 15-20 minutes",
      "Applying a bandage without flushing",
      "Applying ice to the affected area"
    ],
    "correct": 1,
    "explanation": "Chemical burns from caustic soda should be immediately flushed with large amounts of water for at least 15-20 minutes. Do not try to neutralize with acid — this generates heat and can worsen the burn. Seek medical attention after flushing."
  },
  {
    "id": 329,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "Operator certification in Ontario is governed by:",
    "options": [
      "The Environmental Protection Act",
      "Ontario Regulation 128/04 under the Ontario Water Resources Act",
      "The Occupational Health and Safety Act",
      "The Clean Water Act"
    ],
    "correct": 1,
    "explanation": "Operator certification for wastewater treatment in Ontario is governed by O. Reg. 128/04 (Licensing of Sewage Works Operators) under the Ontario Water Resources Act. It establishes certification classes, examination requirements, and continuing education requirements."
  },
  {
    "id": 330,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "Biosolids land application in Ontario is regulated by:",
    "options": [
      "The Ontario Building Code",
      "Ontario Regulation 267/03 (Nutrient Management Act)",
      "The Clean Water Act",
      "The Environmental Assessment Act"
    ],
    "correct": 1,
    "explanation": "Biosolids land application in Ontario is regulated under O. Reg. 267/03 (Nutrient Management Act), which sets standards for biosolids quality, application rates, setback distances, record-keeping, and nutrient management planning."
  },
  {
    "id": 331,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "An operator who discovers a significant equipment failure that could affect effluent quality should:",
    "options": [
      "Wait until the next scheduled maintenance period to address it",
      "Immediately notify the supervisor and take corrective action, documenting the event in the operating log",
      "Reduce the influent flow to compensate",
      "Increase the chemical dosing rates"
    ],
    "correct": 1,
    "explanation": "Significant equipment failures must be reported immediately to the supervisor and documented in the operating log. Corrective action should be taken as quickly as possible to minimize the impact on effluent quality and prevent regulatory violations."
  },
  {
    "id": 332,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "The purpose of an annual performance report for a wastewater treatment plant is to:",
    "options": [
      "Document the salaries of all operators",
      "Summarize the plant's performance against permit limits and report to the regulatory authority",
      "Plan the annual capital improvement budget",
      "Train new operators on plant operations"
    ],
    "correct": 1,
    "explanation": "Annual performance reports summarize the plant's performance over the year, including effluent quality data, permit compliance, operational events, and maintenance activities. They are submitted to the MECP as required by the ECA."
  },
  {
    "id": 333,
    "module": "Safety & Administration",
    "difficulty": "easy",
    "question": "The purpose of a preventive maintenance (PM) program at a wastewater treatment plant is to:",
    "options": [
      "Respond to equipment failures after they occur",
      "Prevent equipment failures through scheduled inspections, lubrication, and replacement of wear parts",
      "Reduce the number of operators needed",
      "Calculate the annual maintenance budget"
    ],
    "correct": 1,
    "explanation": "Preventive maintenance programs schedule regular inspections, lubrication, adjustments, and replacement of wear parts before failures occur. PM programs reduce emergency repairs, extend equipment life, and prevent treatment failures."
  },
  {
    "id": 334,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "The purpose of a root cause analysis (RCA) after a treatment plant upset or equipment failure is to:",
    "options": [
      "Assign blame to the responsible operator",
      "Identify the underlying cause of the problem to prevent recurrence",
      "Document the cost of the failure",
      "Calculate the regulatory penalties"
    ],
    "correct": 1,
    "explanation": "Root cause analysis identifies the fundamental cause(s) of a problem (not just the symptoms) so that effective corrective actions can be implemented to prevent recurrence. RCA is a key element of a continuous improvement program."
  },
  {
    "id": 335,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "Electrical safety at wastewater treatment plants requires that:",
    "options": [
      "All electrical work be done by operators",
      "Only qualified electricians perform electrical work, and LOTO procedures are followed",
      "Electrical panels be kept unlocked for quick access",
      "Electrical equipment be inspected annually only"
    ],
    "correct": 1,
    "explanation": "Electrical safety requires: qualified electricians for electrical work, LOTO procedures before working on electrical equipment, proper PPE (arc flash protection), and regular inspections. Wastewater environments are particularly hazardous due to moisture and corrosive atmospheres."
  },
  {
    "id": 336,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "The purpose of a spill response plan at a wastewater treatment plant is to:",
    "options": [
      "Document the daily chemical usage",
      "Provide procedures for containing and cleaning up chemical spills to protect workers and the environment",
      "Calculate the annual chemical budget",
      "Train operators on chemical dosing procedures"
    ],
    "correct": 1,
    "explanation": "A spill response plan documents procedures for containing and cleaning up chemical spills, including notification requirements, PPE, containment methods, cleanup procedures, and disposal of contaminated materials. It is required by environmental regulations."
  },
  {
    "id": 337,
    "module": "Safety & Administration",
    "difficulty": "easy",
    "question": "Sodium hypochlorite (liquid bleach) should be stored:",
    "options": [
      "In direct sunlight to maintain potency",
      "In a cool, dark location away from acids and reducing agents",
      "In the same area as chlorine gas cylinders",
      "At high temperatures to prevent freezing"
    ],
    "correct": 1,
    "explanation": "Sodium hypochlorite degrades rapidly when exposed to heat, light, and contaminants. It should be stored in a cool (<25 degrees C), dark location in sealed containers, away from acids (which release chlorine gas) and reducing agents (which cause decomposition)."
  },
  {
    "id": 338,
    "module": "Safety & Administration",
    "difficulty": "hard",
    "question": "Respiratory protection selection is based on:",
    "options": [
      "Worker preference only",
      "The type and concentration of the hazardous substance and the assigned protection factor of the respirator",
      "The cost of the respirator",
      "The size of the worker"
    ],
    "correct": 1,
    "explanation": "Respirator selection requires: (1) identifying the hazardous substance and its concentration; (2) determining the required protection factor; (3) selecting a respirator with an assigned protection factor (APF) that provides adequate protection. Medical clearance and fit testing are also required."
  },
  {
    "id": 339,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "The purpose of calibration of flow meters and other instruments at a wastewater treatment plant is:",
    "options": [
      "It is required by the equipment manufacturer only",
      "Accurate measurements are essential for process control, regulatory compliance, and billing",
      "It reduces the cost of chemicals",
      "It improves the efficiency of the pumps"
    ],
    "correct": 1,
    "explanation": "Accurate flow measurement is essential for: calculating chemical doses, monitoring permit compliance, billing for sewer services, and process control. Flow meters must be regularly calibrated and maintained to ensure accuracy."
  },
  {
    "id": 340,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "The purpose of an energy audit at a wastewater treatment plant is to:",
    "options": [
      "Measure the BOD of the influent wastewater",
      "Identify opportunities to reduce energy consumption and costs",
      "Calculate the annual chemical budget",
      "Determine the staffing requirements"
    ],
    "correct": 1,
    "explanation": "Energy audits identify the major energy consumers at the plant (aeration, pumping, lighting, HVAC) and opportunities for energy efficiency improvements. Wastewater treatment is energy-intensive — aeration alone typically accounts for 50-60% of energy use."
  },
  {
    "id": 341,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "The purpose of a public notification requirement for wastewater treatment plant bypasses is to:",
    "options": [
      "Advertise the plant's services",
      "Inform the public of potential health risks from untreated wastewater discharges",
      "Attract new industrial customers",
      "Report the plant's performance to the regulatory authority"
    ],
    "correct": 1,
    "explanation": "Public notification requirements ensure that the public is informed when untreated or partially treated wastewater is discharged (bypass), allowing them to take precautions (avoiding contact with affected water bodies). Notification requirements are specified in the ECA."
  },
  {
    "id": 342,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "The purpose of a risk assessment for a wastewater treatment plant is to:",
    "options": [
      "Calculate the annual operating budget",
      "Identify hazards, assess their likelihood and consequences, and prioritize risk reduction measures",
      "Determine the staffing requirements",
      "Plan the annual maintenance schedule"
    ],
    "correct": 1,
    "explanation": "Risk assessments identify potential hazards (chemical spills, equipment failures, natural disasters, security threats), assess their likelihood and potential consequences, and prioritize risk reduction measures to protect workers, the public, and the environment."
  },
  {
    "id": 343,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "The purpose of a security plan for a wastewater treatment plant is to:",
    "options": [
      "Prevent unauthorized access that could disrupt operations or contaminate the water supply",
      "Reduce the number of operators needed",
      "Calculate the cost of security equipment",
      "Train operators on security procedures only"
    ],
    "correct": 0,
    "explanation": "Security plans protect wastewater treatment plants from unauthorized access, vandalism, and intentional contamination. They include physical security measures (fencing, locks, cameras), access control, employee training, and emergency response procedures."
  },
  {
    "id": 344,
    "module": "Safety & Administration",
    "difficulty": "easy",
    "question": "The purpose of continuing education requirements for certified operators is to:",
    "options": [
      "Increase the cost of certification",
      "Ensure operators maintain and update their knowledge and skills",
      "Reduce the number of certified operators",
      "Provide employment for training instructors"
    ],
    "correct": 1,
    "explanation": "Continuing education (CE) requirements ensure that certified operators stay current with new technologies, regulations, and best practices. Ontario requires operators to complete a specified number of CE hours per certification period to maintain their certification."
  },
  {
    "id": 345,
    "module": "Safety & Administration",
    "difficulty": "medium",
    "question": "The purpose of an asset management plan for a wastewater treatment plant is to:",
    "options": [
      "Document the daily operations of the plant",
      "Plan for the long-term maintenance, rehabilitation, and replacement of plant assets",
      "Calculate the annual operating budget",
      "Train operators on equipment maintenance"
    ],
    "correct": 1,
    "explanation": "Asset management plans document the condition of all plant assets, estimate their remaining useful life, and develop long-term plans for maintenance, rehabilitation, and replacement. They help utilities plan capital expenditures and maintain service levels."
  },
  {
    "id": 346,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "What pipe material is used to convey chlorine (liquid or gas) under pressure from one-ton containers to downstream equipment components?",
    "options": [
      "Black iron pipe",
      "PVC pipe",
      "Ductile clay pipe",
      "Pre-stressed concrete pipe"
    ],
    "correct": 0,
    "explanation": "The pipe most compatible of conveying chlorine gas or liquid at pressures equal to that in the chlorine ton container is black iron pipe. Liquid chlorine, or gaseous chlorine under pressure, will basically melt PVC pipe."
  },
  {
    "id": 347,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "What pipe material can used to convey chlorine gas, after the pressure has been reduced to one atmosphere, from one-ton containers to downstream equipment components?",
    "options": [
      "Only black iron pipe",
      "PVC pipe",
      "Ductile clay pipe",
      "Pre-stressed concrete pipe"
    ],
    "correct": 1,
    "explanation": "PVC pipe is very adequate to convey gaseous chlorine after pressure reduction, and chlorine solution. However, liquid chlorine, or gaseous chlorine under pressure, will basically melt PVC pipe."
  },
  {
    "id": 348,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "Which component may create the highest maintenance requirement in a UV disinfection system?",
    "options": [
      "UV monitor",
      "UV lamp",
      "UV abilitator",
      "UV residual"
    ],
    "correct": 1,
    "explanation": "Typically, lamps require the most maintenance in a UV system to keep it at peak performance."
  },
  {
    "id": 349,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "Which components are incorporated in a typical centrifugal pump?",
    "options": [
      "Check valve",
      "Impeller",
      "Bearings",
      "All of the above"
    ],
    "correct": 3,
    "explanation": "Check valves, impellers and bearings are all components of a centrifugal pump."
  },
  {
    "id": 350,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "Which component may prevent excessive grease pressure from damaging the bearings?",
    "options": [
      "Vibration sensor",
      "Relief plug",
      "Temperature sensor",
      "Oil pressure gauge"
    ],
    "correct": 1,
    "explanation": "Most pumps have relief plugs designed to prevent bearing damage from over-pressurization during greasing of the bearings."
  },
  {
    "id": 351,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "What component of a pump keeps the material in the discharge pipe from emptying out through the pump suction when the pump is off?",
    "options": [
      "Pressure relief",
      "Check valve",
      "Mechanical seal",
      "Volute"
    ],
    "correct": 1,
    "explanation": "Check valves are installed on the discharge side to prevent the pump from emptying when it is off. Also, check valves prevent the pumped fluid, from a common discharge line, from backflowing through a non-operational pump. Which type of flow meter uses an open channel to measure the flow rate? Answer : c. Parshall flume Feedback: Question No. 135 A Parshall flume is a specially shaped open channel flow section, which may be installed in a ditch, canal, or lateral to measure the flow rate. The Parshall flume is a particular form of venturi flume and is named for its principal developer, the late Mr. Ralph L. Parshall. 00000000 00000000 00000000 00000000 00000000 00000000  "
  },
  {
    "id": 352,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "What may be the problem if a centrifugal pump rotates freely but will not discharge water?",
    "options": [
      "Partially clogged impeller or clogged suction pipe",
      "Impeller is jammed frozen or the discharge pipe is plugged",
      "Cavitation",
      "NPSH too high"
    ],
    "correct": 0,
    "explanation": "If a centrifugal pump rotates freely, but does not discharge the anticipated volume, the impeller may be partially clogged, or the pump suction pipe may be plugged."
  },
  {
    "id": 353,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "What statement describes a reciprocating pump?",
    "options": [
      "Has a rotating impeller",
      "Has a piston that moves back and forth",
      "Has two plug valves on the inlet",
      "Is designed to pump grit"
    ],
    "correct": 1,
    "explanation": "A reciprocating pump is also known as a piston pump. This type of pump has single, double or triple pistons that move up and down in separate cylinders. Every stroke displaces the volume of the cylinder for each piston."
  },
  {
    "id": 354,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "Which item may be the most important when determining the track record of a piece of equipment?",
    "options": [
      "Equipment data",
      "Maintenance frequencies",
      "Maintenance equipment history",
      "List of emergency phone numbers"
    ],
    "correct": 2,
    "explanation": "An accurate maintenance history record will help to determine if replacement of the component may be more cost effective as compared to continued corrective maintenance of the device."
  },
  {
    "id": 355,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "What will the pressure gauge read on the suction of a pump if the pump is located at floor elevation of the tank and the tank has 15 feet of static water level?",
    "options": [
      "About 34.7 psi",
      "About 27.7 psi",
      "About 12.0 psi",
      "About 6.5 psi"
    ],
    "correct": 3,
    "explanation": "Each static foot of head exerts 0.433 psi pressure 15 feet of head x 0.433 psi per foot of head = 6.495 psi Each psi of pressure represents 2.31 feet of head 15 feet of head  2.31 feet per psi = 6.494 psi"
  },
  {
    "id": 356,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "A submersible pump used in a wet well differs from a dry-pit pump in that:",
    "options": [
      "It is more energy efficient",
      "It operates while submerged in the wastewater, eliminating the need for a separate pump room",
      "It can pump larger solids",
      "It requires less maintenance"
    ],
    "correct": 1,
    "explanation": "Submersible pumps are installed directly in the wet well, submerged in the wastewater. They eliminate the need for a separate dry-pit pump room, reducing construction costs. However, they require lifting out of the wet well for maintenance."
  },
  {
    "id": 357,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "A screw pump (Archimedes screw) is used in wastewater treatment for:",
    "options": [
      "Chemical dosing",
      "Lifting large volumes of wastewater at low heads",
      "Pumping sludge at high pressure",
      "Aerating the mixed liquor"
    ],
    "correct": 1,
    "explanation": "Screw pumps (Archimedes screws) lift wastewater using a rotating helical screw in an inclined trough. They are used for low-head, high-flow applications (e.g., lifting raw wastewater from the headworks) and can handle solids and rags without clogging."
  },
  {
    "id": 358,
    "module": "Equipment O&M",
    "difficulty": "hard",
    "question": "Pump affinity laws state that when pump speed is doubled:",
    "options": [
      "Flow doubles, head doubles, and power doubles",
      "Flow doubles, head quadruples, and power increases 8 times",
      "Flow doubles, head stays the same, and power doubles",
      "Flow stays the same, head doubles, and power doubles"
    ],
    "correct": 1,
    "explanation": "Affinity laws: Flow is proportional to speed; Head is proportional to speed squared; Power is proportional to speed cubed. If speed doubles: flow doubles, head quadruples, and power increases 8 times. This is why VFDs save significant energy by reducing pump speed during low-flow periods."
  },
  {
    "id": 359,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a pressure relief valve on a chemical feed system is to:",
    "options": [
      "Increase the chemical dose",
      "Protect the system from over-pressure by releasing pressure when it exceeds a set point",
      "Measure the chemical flow rate",
      "Control the chemical dose automatically"
    ],
    "correct": 1,
    "explanation": "Pressure relief valves protect chemical feed systems (pumps, pipes, tanks) from over-pressure by automatically opening and releasing pressure when it exceeds the set point. Over-pressure can rupture pipes and cause chemical spills."
  },
  {
    "id": 360,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "A dissolved air flotation (DAF) unit is used in wastewater treatment for:",
    "options": [
      "Aerating the mixed liquor",
      "Removing suspended solids and grease by floating them to the surface using dissolved air bubbles",
      "Digesting the primary sludge",
      "Filtering the secondary effluent"
    ],
    "correct": 1,
    "explanation": "DAF units dissolve air into pressurized water, then release it in the flotation tank. The released air bubbles attach to suspended solids and grease, causing them to float to the surface where they are skimmed off. Used for primary treatment, sludge thickening, and grease removal."
  },
  {
    "id": 361,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a sludge blanket detector in a secondary clarifier is to:",
    "options": [
      "Measure the MLSS concentration",
      "Monitor the depth of the sludge blanket to prevent sludge carryover in the effluent",
      "Measure the dissolved oxygen in the clarifier",
      "Detect the presence of filamentous organisms"
    ],
    "correct": 1,
    "explanation": "Sludge blanket detectors (ultrasonic or optical sensors) continuously monitor the depth of the sludge blanket in secondary clarifiers. Operators use this information to adjust RAS rates and prevent the blanket from rising too high and causing sludge carryover."
  },
  {
    "id": 362,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a dissolved oxygen (DO) control system in an activated sludge aeration tank is to:",
    "options": [
      "Maximize the aeration rate at all times",
      "Automatically adjust the aeration rate to maintain DO at the set point, saving energy",
      "Measure the BOD of the mixed liquor",
      "Control the return sludge rate"
    ],
    "correct": 1,
    "explanation": "Automatic DO control systems use DO sensors and variable speed drives or air flow control valves to maintain DO at the set point (typically 2 mg/L). This prevents over-aeration (wastes energy) and under-aeration (reduces treatment efficiency)."
  },
  {
    "id": 363,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a heat exchanger on an anaerobic digester is to:",
    "options": [
      "Cool the biogas before use",
      "Maintain the digester at the optimal temperature by heating the incoming sludge",
      "Recover heat from the effluent",
      "Cool the digester contents during summer"
    ],
    "correct": 1,
    "explanation": "Heat exchangers heat the incoming raw sludge to the digester operating temperature (35 degrees C for mesophilic) using hot water from the boiler or engine cooling water. Maintaining temperature is critical for stable digestion and gas production."
  },
  {
    "id": 364,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a gas holder on an anaerobic digester is to:",
    "options": [
      "Measure the biogas production rate",
      "Store biogas and maintain constant pressure in the digester gas system",
      "Remove hydrogen sulfide from the biogas",
      "Compress the biogas for use in vehicles"
    ],
    "correct": 1,
    "explanation": "Gas holders (floating covers or separate tanks) store biogas produced by the digester and maintain a constant pressure in the gas system. They buffer variations in gas production and consumption, ensuring a steady supply to gas utilization equipment."
  },
  {
    "id": 365,
    "module": "Equipment O&M",
    "difficulty": "hard",
    "question": "The purpose of a flame trap (flame arrester) on a digester gas system is to:",
    "options": [
      "Measure the methane content of the biogas",
      "Prevent a flame from traveling back through the gas piping and causing an explosion",
      "Remove moisture from the biogas",
      "Control the gas pressure"
    ],
    "correct": 1,
    "explanation": "Flame arresters prevent flames from propagating through gas piping by cooling the flame below the ignition temperature. They are required on all digester gas piping to prevent explosions caused by flashback from gas utilization equipment."
  },
  {
    "id": 366,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a condensate trap on a digester gas system is to:",
    "options": [
      "Measure the gas flow rate",
      "Remove water condensate from the gas piping to prevent corrosion and flow problems",
      "Remove hydrogen sulfide from the gas",
      "Control the gas pressure"
    ],
    "correct": 1,
    "explanation": "Biogas is saturated with water vapor. As it cools in the piping, condensate forms and can block gas flow, cause corrosion, and damage gas utilization equipment. Condensate traps collect and drain this water from low points in the gas piping."
  },
  {
    "id": 367,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a hydrogen sulfide (H2S) scrubber on a digester gas system is to:",
    "options": [
      "Measure the H2S content of the biogas",
      "Remove H2S to protect gas utilization equipment from corrosion",
      "Add H2S to the biogas for odour detection",
      "Control the gas pressure"
    ],
    "correct": 1,
    "explanation": "H2S in biogas is corrosive to engines, boilers, and other gas utilization equipment. H2S scrubbers (iron sponge, biological, or chemical scrubbers) remove H2S before the gas is used, extending equipment life."
  },
  {
    "id": 368,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a safety relief valve on a digester is to:",
    "options": [
      "Measure the gas pressure",
      "Prevent over-pressure or vacuum conditions that could damage the digester structure",
      "Control the gas flow rate",
      "Remove condensate from the gas system"
    ],
    "correct": 1,
    "explanation": "Digester safety relief valves protect the digester from over-pressure (caused by excessive gas production or blocked outlets) and vacuum (caused by rapid temperature drops or excessive gas withdrawal). Both conditions can damage the digester structure."
  },
  {
    "id": 369,
    "module": "Equipment O&M",
    "difficulty": "easy",
    "question": "The purpose of a secondary containment system around chemical storage tanks is to:",
    "options": [
      "Protect the tanks from UV light",
      "Contain chemical spills and prevent them from reaching the environment",
      "Provide additional storage capacity",
      "Protect the tanks from freezing"
    ],
    "correct": 1,
    "explanation": "Secondary containment (berms, dikes, or containment basins) surrounds chemical storage tanks to contain spills and prevent chemicals from reaching the environment. The containment volume is typically 110% of the largest tank volume."
  },
  {
    "id": 370,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a polymer make-down system is to:",
    "options": [
      "Dissolve polymer in water at the correct concentration for dosing",
      "Store dry polymer before use",
      "Measure the polymer dose",
      "Mix the polymer with the sludge"
    ],
    "correct": 0,
    "explanation": "Polymer make-down (preparation) systems dissolve dry or neat polymer in water at the correct concentration (0.1-0.5%) for dosing. Proper dilution and mixing time are critical for activating the polymer's charge and maximizing its effectiveness."
  },
  {
    "id": 371,
    "module": "Equipment O&M",
    "difficulty": "easy",
    "question": "The purpose of a mixer in a chemical storage tank is to:",
    "options": [
      "Aerate the chemical solution",
      "Maintain a uniform concentration throughout the tank and prevent settling",
      "Heat the chemical solution",
      "Measure the chemical concentration"
    ],
    "correct": 1,
    "explanation": "Mixers in chemical storage tanks prevent settling of solids (e.g., lime slurry), maintain uniform concentration, and prevent stratification. Proper mixing ensures consistent chemical dosing."
  },
  {
    "id": 372,
    "module": "Equipment O&M",
    "difficulty": "hard",
    "question": "Cavitation in a centrifugal pump is caused by:",
    "options": [
      "Excessive discharge pressure",
      "Formation and collapse of vapor bubbles due to low suction pressure",
      "High viscosity of the pumped fluid",
      "Excessive pump speed"
    ],
    "correct": 1,
    "explanation": "Cavitation occurs when the pressure at the pump suction drops below the vapor pressure of the liquid, causing vapor bubbles to form. When these bubbles collapse in the high-pressure zone of the impeller, they cause noise, vibration, and damage to the impeller."
  },
  {
    "id": 373,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a flow control valve on a chemical feed line is to:",
    "options": [
      "Prevent backflow of chemicals",
      "Regulate the chemical flow rate to achieve the desired dose",
      "Measure the chemical concentration",
      "Protect the pump from over-pressure"
    ],
    "correct": 1,
    "explanation": "Flow control valves regulate the chemical flow rate to achieve the desired dose. They can be manually adjusted or automatically controlled based on the plant flow rate (flow-paced dosing) or the measured parameter (feedback control)."
  },
  {
    "id": 374,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a gas flow meter on a digester gas system is to:",
    "options": [
      "Control the gas pressure",
      "Measure the volume of biogas produced for process monitoring and energy accounting",
      "Remove moisture from the gas",
      "Detect gas leaks"
    ],
    "correct": 1,
    "explanation": "Gas flow meters measure the volume of biogas produced by the digester. Gas production rate is a key performance indicator for digester health. Gas flow data is also used for energy accounting (calculating the energy value of the biogas)."
  },
  {
    "id": 375,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a SCADA (Supervisory Control and Data Acquisition) system at a wastewater treatment plant is to:",
    "options": [
      "Replace the need for operators",
      "Monitor and control plant processes remotely, collect data, and generate alarms",
      "Perform laboratory analysis automatically",
      "Calculate the chemical doses automatically"
    ],
    "correct": 1,
    "explanation": "SCADA systems monitor process variables (flows, levels, DO, pH), control equipment (pumps, valves, aerators), generate alarms for abnormal conditions, and collect data for reporting. They improve operational efficiency and allow remote monitoring."
  },
  {
    "id": 376,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a variable frequency drive (VFD) on an aeration blower is to:",
    "options": [
      "Increase the maximum air flow capacity",
      "Vary the blower speed to match the oxygen demand, saving energy",
      "Filter the air before it enters the diffusers",
      "Measure the air flow rate"
    ],
    "correct": 1,
    "explanation": "VFDs on aeration blowers vary the blower speed to match the oxygen demand of the activated sludge process. Since blower power is proportional to speed cubed, reducing speed during low-demand periods saves significant energy."
  },
  {
    "id": 377,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "Fine bubble diffusers in an activated sludge aeration tank are preferred over coarse bubble diffusers because:",
    "options": [
      "They are easier to maintain",
      "They produce smaller bubbles with higher surface area, achieving better oxygen transfer efficiency",
      "They require less air pressure",
      "They are less expensive"
    ],
    "correct": 1,
    "explanation": "Fine bubble diffusers produce bubbles 1-3 mm in diameter, compared to 10-25 mm for coarse bubble diffusers. The smaller bubbles have much higher surface area per unit volume, achieving oxygen transfer efficiencies of 20-40% vs. 8-12% for coarse bubble."
  },
  {
    "id": 378,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a belt filter press in sludge dewatering is to:",
    "options": [
      "Thicken sludge by gravity settling",
      "Mechanically dewater conditioned sludge by pressing it between two porous belts",
      "Stabilize sludge by anaerobic digestion",
      "Disinfect sludge before land application"
    ],
    "correct": 1,
    "explanation": "Belt filter presses dewater polymer-conditioned sludge by gravity drainage followed by mechanical pressing between two porous belts. They produce a cake with 15-25% solids for WAS and 20-30% for digested sludge."
  },
  {
    "id": 379,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a centrifuge in sludge processing is to:",
    "options": [
      "Digest the sludge anaerobically",
      "Separate solids from liquid using centrifugal force for thickening or dewatering",
      "Measure the volatile solids content",
      "Disinfect the sludge"
    ],
    "correct": 1,
    "explanation": "Centrifuges use centrifugal force (1,000-3,000 x gravity) to rapidly separate solids from liquid. They are used for both thickening (gravity belt thickener alternative) and dewatering (belt press alternative), achieving 20-30% cake solids."
  },
  {
    "id": 380,
    "module": "Equipment O&M",
    "difficulty": "easy",
    "question": "The purpose of a check valve in a pump discharge line is to:",
    "options": [
      "Control the flow rate",
      "Prevent backflow when the pump stops",
      "Reduce the pressure in the discharge line",
      "Measure the flow in the discharge line"
    ],
    "correct": 1,
    "explanation": "Check valves (non-return valves) prevent wastewater from flowing back through the pump when it stops. Without check valves, the weight of water in the discharge pipe would cause reverse flow, potentially damaging the pump and causing wet well overflow."
  },
  {
    "id": 381,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a UV intensity sensor in a UV disinfection system is to:",
    "options": [
      "Measure the turbidity of the effluent",
      "Monitor the UV output of the lamps to ensure adequate disinfection dose",
      "Measure the coliform count in the effluent",
      "Control the flow rate through the UV system"
    ],
    "correct": 1,
    "explanation": "UV intensity sensors (radiometers) monitor the UV output of the lamps in real time. As lamps age and quartz sleeves foul, UV output decreases. The sensor triggers alarms when output falls below the minimum required for adequate disinfection."
  },
  {
    "id": 382,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of quartz sleeve cleaning in a UV disinfection system is to:",
    "options": [
      "Increase the UV wavelength",
      "Remove fouling deposits that reduce UV transmission to the wastewater",
      "Cool the UV lamps",
      "Measure the UV dose"
    ],
    "correct": 1,
    "explanation": "Quartz sleeves protect UV lamps from the wastewater. Mineral deposits, biofilm, and organic matter accumulate on the sleeves, reducing UV transmission. Regular cleaning (mechanical wipers or chemical cleaning) maintains UV output."
  },
  {
    "id": 383,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a sludge pump stroke counter is to:",
    "options": [
      "Measure the sludge volume in the digester",
      "Track the number of pump strokes to calculate the volume of sludge pumped",
      "Control the sludge pumping rate automatically",
      "Detect pump failures"
    ],
    "correct": 1,
    "explanation": "Stroke counters on positive displacement sludge pumps count the number of pump strokes. Since each stroke displaces a known volume, the total volume pumped can be calculated. This is used for process control and record-keeping."
  },
  {
    "id": 384,
    "module": "Equipment O&M",
    "difficulty": "hard",
    "question": "Impeller wear in a centrifugal pump causes:",
    "options": [
      "Increased flow and pressure",
      "Reduced flow and efficiency due to increased clearance between impeller and casing",
      "Increased power consumption",
      "Cavitation"
    ],
    "correct": 1,
    "explanation": "As the impeller wears, the clearance between the impeller and the casing increases, allowing more recirculation of flow within the pump. This reduces the flow and efficiency of the pump without necessarily causing obvious symptoms."
  },
  {
    "id": 385,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a diaphragm pump in chemical dosing applications is to:",
    "options": [
      "Provide high-flow, low-pressure dosing",
      "Provide accurate, low-flow dosing with self-priming capability and chemical resistance",
      "Provide variable-speed dosing",
      "Provide dosing without any moving parts"
    ],
    "correct": 1,
    "explanation": "Diaphragm pumps use a flexible diaphragm to displace chemical. They are self-priming, can handle corrosive chemicals, and provide accurate low-flow dosing. The diaphragm isolates the chemical from the drive mechanism, preventing contamination."
  },
  {
    "id": 386,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a peristaltic pump in chemical dosing applications is to:",
    "options": [
      "Provide high-flow, high-pressure dosing",
      "Provide accurate dosing with no seals or valves that contact the chemical",
      "Provide variable-speed dosing only",
      "Provide dosing of viscous chemicals only"
    ],
    "correct": 1,
    "explanation": "Peristaltic pumps squeeze a flexible tube to move fluid. The chemical only contacts the tube, eliminating seals and valves that could leak or corrode. They are accurate, self-priming, and easy to maintain by replacing the tube."
  },
  {
    "id": 387,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a gravity belt thickener (GBT) in sludge processing is to:",
    "options": [
      "Dewater sludge to a dry cake",
      "Thicken waste activated sludge from ~0.5-1% to 4-6% solids before digestion or dewatering",
      "Stabilize sludge by anaerobic digestion",
      "Disinfect sludge before land application"
    ],
    "correct": 1,
    "explanation": "Gravity belt thickeners thicken WAS from ~0.5-1% to 4-6% solids by gravity drainage on a moving porous belt. Polymer conditioning is required. Thickening reduces the volume of sludge to be processed in digesters or dewatering equipment."
  },
  {
    "id": 388,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a rotary drum thickener in sludge processing is to:",
    "options": [
      "Dewater sludge to a dry cake",
      "Thicken sludge by rotating a drum screen that retains solids while liquid drains through",
      "Stabilize sludge by aerobic digestion",
      "Remove grit from the sludge"
    ],
    "correct": 1,
    "explanation": "Rotary drum thickeners (RDTs) thicken sludge by rotating a drum screen. Polymer-conditioned sludge is fed into the drum; solids are retained while filtrate drains through the screen. RDTs are compact and achieve 4-6% solids from WAS."
  },
  {
    "id": 389,
    "module": "Equipment O&M",
    "difficulty": "hard",
    "question": "The purpose of a thermal dryer in biosolids processing is to:",
    "options": [
      "Stabilize biosolids by anaerobic digestion",
      "Reduce the moisture content of biosolids to produce a dry, granular product for beneficial use",
      "Disinfect biosolids to Class A standards",
      "Reduce the volume of biosolids for landfill disposal"
    ],
    "correct": 1,
    "explanation": "Thermal dryers reduce the moisture content of dewatered biosolids from ~20-30% solids to 90%+ solids by evaporating water using heat. The dry granular product can be used as fertilizer or soil amendment, reducing disposal costs."
  },
  {
    "id": 390,
    "module": "Equipment O&M",
    "difficulty": "easy",
    "question": "The purpose of a screw conveyor in sludge handling is to:",
    "options": [
      "Pump liquid sludge under pressure",
      "Transport dewatered sludge cake horizontally or at a slight incline",
      "Thicken liquid sludge by gravity",
      "Measure the flow of liquid sludge"
    ],
    "correct": 1,
    "explanation": "Screw conveyors transport dewatered sludge cake (a semi-solid material) from dewatering equipment to storage bins, trucks, or other processing equipment. They are enclosed, reducing odour and spillage."
  },
  {
    "id": 391,
    "module": "Equipment O&M",
    "difficulty": "easy",
    "question": "The purpose of an emergency generator at a wastewater treatment plant is to:",
    "options": [
      "Reduce the normal power consumption",
      "Maintain critical operations (pumping, aeration, controls) during power outages",
      "Provide power for laboratory equipment only",
      "Reduce the peak demand charge from the utility"
    ],
    "correct": 1,
    "explanation": "Emergency generators provide backup power to maintain critical operations during power outages: lift station pumps (to prevent SSOs), aeration blowers (to maintain biological treatment), and plant controls. They are required by most regulatory agencies."
  },
  {
    "id": 392,
    "module": "Equipment O&M",
    "difficulty": "hard",
    "question": "The purpose of a biogas engine-generator at a wastewater treatment plant is to:",
    "options": [
      "Compress biogas for sale to the natural gas grid",
      "Convert biogas to electricity and heat for plant use, reducing energy costs",
      "Remove hydrogen sulfide from the biogas",
      "Detect gas leaks in the biogas piping"
    ],
    "correct": 1,
    "explanation": "Biogas engine-generators (cogeneration units) convert biogas to electricity and recover waste heat from the engine cooling water and exhaust. This combined heat and power (CHP) approach can supply 30-50% of the plant's energy needs."
  },
  {
    "id": 393,
    "module": "Equipment O&M",
    "difficulty": "medium",
    "question": "The purpose of a UV lamp replacement schedule is to:",
    "options": [
      "Reduce the cost of UV lamps",
      "Ensure UV lamps are replaced before their output drops below the minimum required for disinfection",
      "Increase the UV dose delivered to the wastewater",
      "Reduce the maintenance frequency"
    ],
    "correct": 1,
    "explanation": "UV lamps lose output over time (typically 10-20% per year). Replacement schedules ensure lamps are replaced before their output drops below the minimum required for adequate disinfection, typically after 8,000-12,000 hours of operation."
  },
  {
    "id": 394,
    "module": "Equipment O&M",
    "difficulty": "hard",
    "question": "The purpose of a sludge blanket level control in a secondary clarifier is to:",
    "options": [
      "Measure the MLSS concentration in the aeration tank",
      "Automatically adjust the RAS rate to maintain the sludge blanket at the target depth",
      "Measure the effluent TSS concentration",
      "Control the influent flow to the clarifier"
    ],
    "correct": 1,
    "explanation": "Automatic sludge blanket level control uses sensors to monitor blanket depth and automatically adjusts the RAS pumping rate to maintain the blanket at the target depth. This prevents sludge carryover and optimizes clarifier performance."
  },
  {
    "id": 395,
    "module": "Equipment O&M",
    "difficulty": "hard",
    "question": "The purpose of a flow equalization tank before a UV disinfection system is to:",
    "options": [
      "Provide additional detention time for disinfection",
      "Dampen flow variations to maintain consistent UV dose at varying flows",
      "Remove suspended solids before UV treatment",
      "Provide backup storage if the UV system fails"
    ],
    "correct": 1,
    "explanation": "UV dose = UV intensity x contact time. At high flows, contact time decreases, reducing UV dose. Flow equalization dampens peak flows, maintaining more consistent contact time and UV dose across the range of plant flows."
  }
];

export const CLASS2_WW_MODULES: WastewaterModule[] = [
  {
    name: "Treatment Process",
    color: "#065F46",
    icon: "Droplets",
    questions: CLASS2_WW_QUESTIONS.filter(q => q.module === "Treatment Process"),
  },
  {
    name: "Collection Systems",
    color: "#1E3A5F",
    icon: "Network",
    questions: CLASS2_WW_QUESTIONS.filter(q => q.module === "Collection Systems"),
  },
  {
    name: "Laboratory Analysis",
    color: "#7C3AED",
    icon: "FlaskConical",
    questions: CLASS2_WW_QUESTIONS.filter(q => q.module === "Laboratory Analysis"),
  },
  {
    name: "Safety & Administration",
    color: "#B91C1C",
    icon: "ShieldCheck",
    questions: CLASS2_WW_QUESTIONS.filter(q => q.module === "Safety & Administration"),
  },
  {
    name: "Equipment O&M",
    color: "#92400E",
    icon: "Wrench",
    questions: CLASS2_WW_QUESTIONS.filter(q => q.module === "Equipment O&M"),
  },
];

export function getClass2WWNextQuestion(
  history: { questionId: number; correct: boolean }[],
  moduleFilter?: string
): WastewaterQuestion | null {
  const pool = moduleFilter
    ? CLASS2_WW_QUESTIONS.filter(q => q.module === moduleFilter)
    : CLASS2_WW_QUESTIONS;
  const usedIds = new Set(history.map(h => h.questionId));
  const available = pool.filter(q => !usedIds.has(q.id));
  if (available.length === 0) return null;
  // Prioritise questions the user got wrong
  const wrongIds = new Set(history.filter(h => !h.correct).map(h => h.questionId));
  const wrongAvailable = available.filter(q => wrongIds.has(q.id));
  const candidates = wrongAvailable.length > 0 ? wrongAvailable : available;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
