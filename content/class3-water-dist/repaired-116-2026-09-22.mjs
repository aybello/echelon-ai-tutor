/**
 * Answer-level replacements for the 116 Class III distribution questions
 * held by the September 22 recovery package.  These remain in_review until
 * an Ontario Class III/IV SME records an approval in the production system.
 */

export const REPAIRED_REGULATORY_NUMBERS = [
  5, 23, 29, 37, 44, 58, 64, 85, 103, 106, 114, 126, 133, 153, 155,
  164, 171, 181, 198, 210, 213, 228, 249, 259, 265, 269, 277, 289, 300,
  311, 321, 323, 354, 366, 367, 374, 386, 391, 402, 405, 413, 436, 437,
  444, 470,
];
export const REPAIRED_NUMERIC_NUMBERS = Array.from({ length: 71 }, (_, i) => 501 + i);
export const REPAIRED_QUESTION_NUMBERS = [...REPAIRED_REGULATORY_NUMBERS, ...REPAIRED_NUMERIC_NUMBERS].sort((a, b) => a - b);

const sources = {
  reg170: {
    sourceTitle: "Ontario Regulation 170/03 — Drinking-Water Systems",
    sourceUrl: "https://www.ontario.ca/laws/regulation/030170",
  },
  reg169: {
    sourceTitle: "Ontario Regulation 169/03 — Ontario Drinking Water Quality Standards",
    sourceUrl: "https://www.ontario.ca/laws/regulation/030169",
  },
  reg128: {
    sourceTitle: "Ontario Regulation 128/04 — Certification of Drinking Water System Operators and Water Quality Analysts",
    sourceUrl: "https://www.ontario.ca/laws/regulation/040128",
  },
  watermain: {
    sourceTitle: "Ontario 2020 Watermain Disinfection Procedure",
    sourceUrl: "https://www.ontario.ca/page/water-main-disinfection-procedure",
  },
  sampling: {
    sourceTitle: "Ontario Practices for Collection and Handling of Drinking Water Samples",
    sourceUrl: "https://www.ontario.ca/page/practices-collection-and-handling-drinking-water-samples",
  },
  hydraulicInstitute: {
    sourceTitle: "Hydraulic Institute — Pump Operating Regions and Reliability",
    sourceUrl: "https://www.pumps.org/2022/12/07/the-basics-of-npsh-pump-operating-regions/",
  },
  awwaLoss: {
    sourceTitle: "AWWA Water Loss Control",
    sourceUrl: "https://www.awwa.org/resource/water-loss-control/",
  },
  epaWaterAge: {
    sourceTitle: "US EPA Distribution System Water Quality — Water Age Management",
    sourceUrl: "https://www.epa.gov/system/files/documents/2022-04/ds-toolbox-fact-sheets_water-age-mgt_final-508_revised.pdf",
  },
  wpi: {
    sourceTitle: "WPI 2025 Class III Water Distribution Need-to-Know Criteria",
    sourceUrl: "https://gowpi.org/wp-content/uploads/2026/04/WaterDistribution-%E2%80%93-Class-3_mh-fin.pdf",
  },
};

const regulatory = [
  {
    questionNum: 5,
    question: "An owner becomes aware that improperly disinfected water is being directed to users. Under Schedule 16 of O. Reg. 170/03, what is the required initial reporting action?",
    options: ["Record it and include it in the next annual report", "Report it immediately to the Ministry and medical officer of health", "Wait for a confirming laboratory result before reporting", "Notify the system owner only and begin an internal review"],
    correctIndex: 1,
    explanation: "Schedule 16 requires an immediate report to the Ministry and the medical officer of health when an observation indicates that improperly disinfected water is being directed to users. The report is not deferred for confirmation.",
    sourceReference: "Schedule 16, sections 16-4 and 16-6; current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 23,
    question: "Microbiological commissioning samples are taken from a new watermain that has not yet been placed into service. How does Ontario's 2020 Watermain Disinfection Procedure classify those samples for Safe Drinking Water Act reporting?",
    options: ["They are drinking-water tests and every result is immediately reportable", "They are not drinking-water tests and are not Schedule 16 reportable", "They are reportable only when free chlorine is below 1.0 mg/L", "They are construction tests that do not require an accredited laboratory"],
    correctIndex: 1,
    explanation: "The procedure states that microbiological samples and associated residual tests from a new main not yet in service are not drinking-water tests for SDWA purposes and are therefore not reportable. The microbiological samples must still be tested by a licensed and accredited laboratory.",
    sourceReference: "Section 1.1.3, Microbiological Samples for new watermains; checked 2026-09-22.", ...sources.watermain,
  },
  {
    questionNum: 29,
    question: "A large municipal residential system serves 1,500,000 people. Under Schedule 10 of O. Reg. 170/03, what is the minimum number of distribution microbiological samples required each month?",
    options: ["150", "200", "250", "1,500"],
    correctIndex: 2,
    explanation: "For more than 100,000 people, Schedule 10 requires 100 samples plus one additional sample for every 10,000 people served: 100 + 1,500,000/10,000 = 250 samples per month, with at least three taken in each week.",
    sourceReference: "Schedule 10, section 10-2(1)(b); current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 37,
    question: "A distribution sample is reported positive for E. coli. Which action must not be delayed while waiting for a confirmation sample?",
    options: ["Immediate reporting through the Schedule 16 process", "Annual trend analysis", "A capital request for pipe replacement", "A routine customer-satisfaction survey"],
    correctIndex: 0,
    explanation: "E. coli must be not detectable under O. Reg. 169/03. An adverse test result engages the immediate reporting process in Schedule 16 of O. Reg. 170/03; required corrective action and resampling follow, but the initial report is not postponed.",
    sourceReference: "O. Reg. 169/03, Schedule 1; O. Reg. 170/03, Schedule 16; checked 2026-09-22.", ...sources.reg169,
  },
  {
    questionNum: 44,
    question: "Before a newly disinfected chlorinated watermain is placed into service, the free chlorine residual falls below 0.05 mg/L. What does Ontario's 2020 procedure require?",
    options: ["Place the main in service if turbidity is acceptable", "Repeat the microbiological sampling", "Add 0.05 mg/L to the original chlorine dose calculation", "Wait 30 days and use the original sample results"],
    correctIndex: 1,
    explanation: "The procedure directs operating authorities to maintain an acceptable disinfectant concentration. If 0.05 mg/L free chlorine is not maintained before placement into service, microbiological sampling must be repeated.",
    sourceReference: "Section 1.1.3, acceptable disinfectant concentration before placement into service; checked 2026-09-22.", ...sources.watermain,
  },
  {
    questionNum: 58,
    question: "A large municipal residential system serves 80,000 people. What Schedule 10 distribution-sample minimum applies each month?",
    options: ["80 samples, with one in each week", "88 samples, with at least one in each week", "100 samples, with at least three in each week", "108 samples, with at least three in each week"],
    correctIndex: 1,
    explanation: "For 100,000 people or fewer, the rule is eight samples plus one for every 1,000 people: 8 + 80 = 88 per month, with at least one sample taken in each week.",
    sourceReference: "Schedule 10, section 10-2(1)(a); current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 64,
    question: "What information must an owner's immediate Schedule 16 report include in addition to identifying the adverse result or observation?",
    options: ["The laboratory method and instrument serial number used", "Actions being taken and whether required corrective action is underway", "The final root cause and a completed five-year capital plan", "Names and contact details for every potentially affected customer"],
    correctIndex: 1,
    explanation: "Section 16-8 requires the owner to identify the adverse result or observation, describe actions being taken, and state whether corrective action required by Schedule 17 or 18 is being taken.",
    sourceReference: "Schedule 16, section 16-8; current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 85,
    question: "What microbiological standard does O. Reg. 169/03 set for total coliforms in drinking water?",
    options: ["Not detectable", "No more than 1 CFU/100 mL", "No more than 5 CFU/100 mL", "A running annual average below 10 CFU/100 mL"],
    correctIndex: 0,
    explanation: "Schedule 1 of O. Reg. 169/03 lists total coliforms as not detectable. Reporting and corrective-action duties must then be determined under O. Reg. 170/03 for the specific sample and circumstances.",
    sourceReference: "Schedule 1, Microbiological Standards; current consolidation checked 2026-09-22.", ...sources.reg169,
  },
  {
    questionNum: 103,
    question: "After giving the required immediate verbal report of an adverse result, when is the ordinary written Schedule 16 notice due?",
    options: ["Within 24 hours after the immediate report", "Within three business days", "Within seven days after the sample was collected", "Only after the issue has been resolved"],
    correctIndex: 0,
    explanation: "Subject to the specific exceptions in Schedule 16, the written notice is due within 24 hours after the immediate report. A separate issue-resolution notice follows after resolution.",
    sourceReference: "Schedule 16, section 16-7(2); current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 106,
    question: "A calibrated hydraulic model uses Hazen-Williams C = 130 for an older main. If inspection shows increased internal roughness and the model is otherwise unchanged, which adjustment is consistent with the Hazen-Williams relationship?",
    options: ["Increase C, which increases predicted head loss", "Decrease C, which increases predicted head loss", "Decrease C, which decreases predicted head loss", "Leave C unchanged because roughness is represented only by pipe length"],
    correctIndex: 1,
    explanation: "In the Hazen-Williams relation, head loss varies inversely with approximately C^1.852. A lower C represents greater hydraulic resistance and produces more head loss at the same flow, diameter, and length.",
    sourceReference: "Distribution System Components calculation criteria; relationship stated in the explanation; checked 2026-09-22.", ...sources.wpi,
  },
  {
    questionNum: 114,
    question: "A corrective-action resample still detects total coliforms in a chlorinated large municipal residential system. What resampling endpoint does Ontario's corrective-action guidance identify?",
    options: ["One clear sample collected at any later date", "Two consecutive clear sets taken 24 to 48 hours apart", "Four clear samples collected in the same hour", "A clear sample plus a customer complaint survey"],
    correctIndex: 1,
    explanation: "Ontario's corrective-action procedure directs resampling until the parameter is not detected in two consecutive sets of microbiological samples taken 24 to 48 hours apart.",
    sourceReference: "Schedule 17, section 17-6, total-coliform corrective action; current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 126,
    question: "Under Schedule 10, what fraction of the required distribution microbiological samples must also be tested for heterotrophic plate count?",
    options: ["At least 10%", "At least 25%", "At least 50%", "All samples"],
    correctIndex: 1,
    explanation: "Schedule 10 requires at least 25% of the distribution samples required by section 10-2(1) to be tested for general bacteria population expressed as heterotrophic plate counts.",
    sourceReference: "Schedule 10, section 10-2(3); current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 133,
    question: "Once an issue that triggered a Schedule 16 report has been resolved, when must the owner ordinarily send the issue-resolution notice to the medical officer of health and the Ministry?",
    options: ["Within 24 hours", "Within seven days", "Within 30 days", "With the next annual report"],
    correctIndex: 1,
    explanation: "Section 16-9 requires written notice summarizing the action taken and results achieved within seven days after the issue is resolved.",
    sourceReference: "Schedule 16, section 16-9(1); current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 153,
    question: "A centrifugal pump normally operates well to the left of its best efficiency point. Which supervisory response best follows Hydraulic Institute guidance?",
    options: ["Continue there because reliability is unchanged across the pump curve", "Compare the duty point with the manufacturer's preferred operating region", "Throttle the suction valve until vibration falls within limits", "Increase speed until the motor reaches full-load amperage"],
    correctIndex: 1,
    explanation: "The preferred operating region is the range around BEP in which hydraulic efficiency and reliability are not substantially degraded. Its limits are pump-specific, so a universal percentage should not replace the manufacturer's curve and applicable standard.",
    sourceReference: "Definitions of BEP, POR, and AOR; checked 2026-09-22.", ...sources.hydraulicInstitute,
  },
  {
    questionNum: 155,
    question: "A contractor asks a supervisor for the required cover over a new watermain. What is the defensible basis for the answer?",
    options: ["A province-wide minimum cover of exactly 1.2 m", "The approved design and applicable local requirements", "A depth equal to ten times the pipe's nominal diameter", "The shallowest cover achievable with the available excavator"],
    correctIndex: 1,
    explanation: "Required cover is project- and location-specific and can depend on frost protection, grading, conflicts, approved design, and local standards. The earlier question incorrectly presented 1.2 m as a universal Ontario regulatory minimum.",
    sourceReference: "Installation and construction objectives; verify the issued-for-construction design and local standards for the actual project.", ...sources.wpi,
  },
  {
    questionNum: 164,
    question: "Immediately before installing pipe and repair parts during a Category 2 watermain-break repair, what minimum sodium hypochlorite solution does Ontario's 2020 procedure specify for disinfection?",
    options: ["A minimum 0.05% solution", "A minimum 0.25% solution", "A minimum 1% solution", "A minimum 10% solution"],
    correctIndex: 2,
    explanation: "The Category 2 repair sequence specifies disinfecting the pipe and repair parts with a minimum 1% sodium hypochlorite solution immediately before installation.",
    sourceReference: "Category 2 Watermain Breaks, repair sequence step 6 and section 2.2.3; checked 2026-09-22.", ...sources.watermain,
  },
  {
    questionNum: 171,
    question: "What maximum concentration does O. Reg. 169/03 currently prescribe for lead in drinking water?",
    options: ["0.005 mg/L", "0.010 mg/L", "0.015 mg/L", "0.020 mg/L"],
    correctIndex: 1,
    explanation: "Schedule 2 of O. Reg. 169/03 lists the lead standard as 0.010 mg/L, equivalent to 10 micrograms per litre. The former key of 0.005 mg/L was incorrect.",
    sourceReference: "Schedule 2, Chemical Standards; current consolidation checked 2026-09-22.", ...sources.reg169,
  },
  {
    questionNum: 181,
    question: "When choosing distribution-system sampling locations for a parameter that may deteriorate with water age, which location is most appropriate?",
    options: ["A plant tap located before water enters distribution", "A representative downstream point where degradation is plausible", "The nearest hose connection, sampled without flushing", "A customer hot-water tap downstream of the water heater"],
    correctIndex: 1,
    explanation: "Ontario's sampling practice says locations should represent the distribution system and generally be far from entry where degradation, residual loss, or disinfection by-product formation is most likely.",
    sourceReference: "Distribution-system sampling-location guidance; checked 2026-09-22.", ...sources.sampling,
  },
  {
    questionNum: 198,
    question: "Which document closes the Schedule 16 reporting loop after an adverse issue has been resolved?",
    options: ["A purchase order showing the cost of corrective work", "A written notice summarizing corrective actions and results", "A replacement certificate for the operator who responded", "A billing adjustment covering the affected customer period"],
    correctIndex: 1,
    explanation: "The owner must provide an issue-resolution notice summarizing what was done and the results achieved; for the Ministry and medical officer of health it is due within seven days after resolution.",
    sourceReference: "Schedule 16, section 16-9; current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 210,
    question: "Which method satisfies the ordinary requirement for an immediate Schedule 16 report?",
    options: ["Leaving a voicemail without reaching a person", "Speaking in person or by telephone with the designated recipient", "Sending the next monthly operating report", "Posting a note in the control room"],
    correctIndex: 1,
    explanation: "Schedule 16 requires the immediate report to be made by speaking in person or by telephone with the designated person. A voicemail alone does not complete that direct reporting duty.",
    sourceReference: "Schedule 16, section 16-6(2); current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 213,
    question: "A new non-copper watermain is disinfected by continuous feed under Ontario's 2020 procedure. Which minimum initial concentration and contact time apply?",
    options: ["10 mg/L for 24 hours", "25 mg/L for 24 hours", "50 mg/L for 3 hours", "100 mg/L for 30 minutes"],
    correctIndex: 1,
    explanation: "Table 1 specifies at least 25 mg/L initially and a minimum 24-hour contact time for tablet or continuous-feed disinfection. It also limits the allowable concentration decrease, so contact time alone is not sufficient.",
    sourceReference: "Section 1.1.2, Table 1; checked 2026-09-22.", ...sources.watermain,
  },
  {
    questionNum: 228,
    question: "How long is an Ontario drinking-water operator's certificate ordinarily valid before expiry?",
    options: ["One year", "Two years", "Three years", "Five years"],
    correctIndex: 2,
    explanation: "O. Reg. 128/04 states that an operator's certificate expires three years after it is issued unless an earlier date is specified under the regulation.",
    sourceReference: "Section 7(4); current consolidation checked 2026-09-22.", ...sources.reg128,
  },
  {
    questionNum: 249,
    question: "Which pair does Ontario's 2020 procedure define as acceptable minimum disinfectant concentrations before a new watermain is placed into service?",
    options: ["0.05 mg/L free or 0.25 mg/L combined", "0.10 mg/L free or 0.10 mg/L combined", "0.20 mg/L free or 0.20 mg/L combined", "0.50 mg/L free or 1.00 mg/L combined"],
    correctIndex: 0,
    explanation: "The procedure identifies 0.05 mg/L free chlorine for a chlorinated system or 0.25 mg/L combined chlorine for a chloraminated system as the applicable acceptable concentrations in this commissioning context.",
    sourceReference: "Section 1.1.3, acceptable disinfectant concentration; checked 2026-09-22.", ...sources.watermain,
  },
  {
    questionNum: 259,
    question: "At minimum, which microbiological parameters must commissioning samples from a new watermain include under Ontario's 2020 procedure?",
    options: ["E. coli and total coliforms", "HPC and turbidity only", "Lead and copper", "THMs and HAAs"],
    correctIndex: 0,
    explanation: "Section 1.1.3 requires the microbiological samples to include at least E. coli and total coliforms and to be tested by a licensed and accredited laboratory.",
    sourceReference: "Section 1.1.3; checked 2026-09-22.", ...sources.watermain,
  },
  {
    questionNum: 265,
    question: "A large municipal residential system serves 250,000 people. What Schedule 10 minimum applies to distribution microbiological samples?",
    options: ["108 per month, with one in each week", "125 per month, with at least three in each week", "250 per month, with at least one in each week", "350 per month, with at least three in each week"],
    correctIndex: 1,
    explanation: "For populations above 100,000, the monthly minimum is 100 plus one per 10,000 people: 100 + 25 = 125. At least three of the samples must be taken in each week.",
    sourceReference: "Schedule 10, section 10-2(1)(b); current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 269,
    question: "Which minimum conditions apply to slug disinfection of a new watermain under Ontario's 2020 procedure?",
    options: ["25 mg/L for 24 hours", "50 mg/L for 12 hours", "100 mg/L for 3 hours", "200 mg/L for 30 minutes"],
    correctIndex: 2,
    explanation: "Table 1 specifies an initial concentration of at least 100 mg/L and a minimum three-hour contact time for the slug method, with a maximum allowable decrease of 25 mg/L.",
    sourceReference: "Section 1.1.2, Table 1; checked 2026-09-22.", ...sources.watermain,
  },
  {
    questionNum: 277,
    question: "A sample is taken after a new watermain has been placed into service. How does Ontario's procedure treat that sample?",
    options: ["It remains a non-reportable construction sample", "It is a drinking-water test and an adverse result is reportable", "It is reportable only after two positive results", "It is excluded whenever the main was disinfected by continuous feed"],
    correctIndex: 1,
    explanation: "Once the watermain is in service, microbiological samples and residual tests are drinking-water tests for SDWA purposes, and adverse results are reportable.",
    sourceReference: "Section 1.1.4.3, Placing new watermains into service; checked 2026-09-22.", ...sources.watermain,
  },
  {
    questionNum: 289,
    question: "When O. Reg. 170/03 requires a distribution sample for a microbiological parameter, what companion operational test is required at the same time and location?",
    options: ["The applicable free- or combined-chlorine residual", "A lead profile from premise-plumbing stagnation samples", "A scan for all regulated volatile organic chemicals", "A wire-to-water efficiency test on the nearest pump"],
    correctIndex: 0,
    explanation: "Schedule 6 requires another sample at the same time and location for immediate testing of free chlorine residual in a chlorinated system or combined chlorine residual in a chloraminated system.",
    sourceReference: "Schedule 6, section 6-3; current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 300,
    question: "A critical low-pressure SCADA alarm activates, but the regulation and licence do not prescribe a universal two-hour attendance rule. What should the operator do first?",
    options: ["Ignore the signal until the next scheduled operating round", "Verify the alarm and follow the approved response and escalation procedure", "Reset all related alarms before checking the field condition", "Wait for customer complaints before treating it as a real event"],
    correctIndex: 1,
    explanation: "Alarm response must follow the system's approved procedures, licence, and emergency plan. The previous question invented a universal two-hour requirement in O. Reg. 170/03.",
    sourceReference: "Safety, emergency response, monitoring, and administrative task objectives; system-specific legal documents still control.", ...sources.wpi,
  },
  {
    questionNum: 311,
    question: "Which condition indicates inadequate secondary-disinfectant residual under the cited Ontario distribution requirements?",
    options: ["Free chlorine below 0.05 mg/L or combined chlorine below 0.25 mg/L, as applicable", "Free chlorine below 0.50 mg/L in every system", "Combined chlorine below 1.0 mg/L only at the plant", "Any free chlorine result below 4.0 mg/L"],
    correctIndex: 0,
    explanation: "The applicable lower limits are 0.05 mg/L free chlorine for chlorination and 0.25 mg/L combined chlorine for chloramination. The disinfectant type and applicable licence/procedure must be identified before acting.",
    sourceReference: "Secondary disinfection provisions and Schedule 16 adverse-result criteria; current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 321,
    question: "An operator receives an E. coli-positive distribution result. Which sequence is defensible?",
    options: ["Wait for the next routine sample, then decide whether to report", "Make the required immediate report and begin the applicable corrective-action process", "Flush first and report only if flushing fails", "Issue a boil-water advisory without consulting public-health authorities"],
    correctIndex: 1,
    explanation: "The positive result is adverse and requires immediate reporting. Corrective action and public communications then follow the regulation and direction of the medical officer of health; an operator does not unilaterally replace that process.",
    sourceReference: "O. Reg. 169/03, Schedule 1; O. Reg. 170/03, Schedules 16 and 17; checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 323,
    question: "Which minimum conditions apply to spray disinfection of a new watermain under Ontario's 2020 procedure?",
    options: ["25 mg/L for 24 hours", "50 mg/L for 12 hours", "100 mg/L for 3 hours", "200 mg/L for 30 minutes"],
    correctIndex: 3,
    explanation: "Table 1 specifies at least 200 mg/L and a minimum 30-minute contact time for spray disinfection; a concentration-decrease measurement is not required for that method.",
    sourceReference: "Section 1.1.2, Table 1; checked 2026-09-22.", ...sources.watermain,
  },
  {
    questionNum: 354,
    question: "A drinking-water system that serves a designated facility obtains an adverse result. What additional immediate notification duty can Schedule 16 impose on the owner?",
    options: ["Notify the operator of each designated facility served by the system", "Notify only the municipal treasurer", "Notify equipment suppliers before regulators", "Wait until the designated facility requests the result"],
    correctIndex: 0,
    explanation: "Section 16-5 requires the owner to report immediately to the operator of each designated facility served by the system when the provision applies.",
    sourceReference: "Schedule 16, section 16-5; current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 366,
    question: "Which statement correctly distinguishes a drinking-water standard from the response process?",
    options: ["O. Reg. 169/03 sets the parameter standard; O. Reg. 170/03 supplies reporting and corrective-action duties", "O. Reg. 128/04 sets every chemical standard and every sampling frequency", "AWWA C651 determines Ontario lead limits", "A municipal SOP can replace an Ontario drinking-water standard"],
    correctIndex: 0,
    explanation: "O. Reg. 169/03 contains Ontario drinking-water quality standards. O. Reg. 170/03 contains system-specific sampling, reporting, and corrective-action requirements, while O. Reg. 128/04 concerns operator certification.",
    sourceReference: "Relationship among O. Reg. 169/03, O. Reg. 170/03, and O. Reg. 128/04; checked 2026-09-22.", ...sources.reg169,
  },
  {
    questionNum: 367,
    question: "Who may ordinarily be designated overall responsible operator for a Class III distribution subsystem?",
    options: ["An operator-in-training working under routine supervision", "An operator holding only a Class II distribution certificate", "A Class III or Class IV distribution operator", "A professional engineer without an operator certificate"],
    correctIndex: 2,
    explanation: "Section 23 requires the ORO to hold a certificate for the same type of subsystem and of the same class as or higher than the subsystem.",
    sourceReference: "Section 23(1); current consolidation checked 2026-09-22.", ...sources.reg128,
  },
  {
    questionNum: 374,
    question: "A reservoir's nominal turnover is two days, but tracer data show short-circuiting and a stagnant upper layer. What is the best interpretation?",
    options: ["Every parcel of water is exactly two days old", "Nominal volume divided by flow does not capture the older poorly mixed zones", "Short-circuiting always reduces the oldest water age", "Turnover makes mixing measurements unnecessary"],
    correctIndex: 1,
    explanation: "Nominal turnover is a bulk volume-over-flow estimate. Short-circuiting and stratification can leave portions of a tank much older, so mixing, level cycling, and site data must inform water-age control.",
    sourceReference: "Water-age management and storage-tank mixing guidance; checked 2026-09-22.", ...sources.epaWaterAge,
  },
  {
    questionNum: 386,
    question: "An unusual pressure transient occurs during a shift. What must the operating record capture under Ontario's operator record-keeping rules?",
    options: ["Only the final pressure value", "The abnormal condition, action taken, and conclusions drawn", "Only the names of customers who called", "Nothing unless equipment was damaged"],
    correctIndex: 1,
    explanation: "The OIC or authorized recorder must document unusual or abnormal conditions, the actions taken, and conclusions drawn. These operating records must remain accessible for the prescribed five-year period.",
    sourceReference: "Sections 27 and 28; Ontario certification guide record-keeping summary; checked 2026-09-22.", ...sources.reg128,
  },
  {
    questionNum: 391,
    question: "The Class III distribution ORO is absent. Under the ordinary temporary-delegation rule, who may act in the ORO's place?",
    options: ["Only another Class III operator because Class IV is ineligible", "A designated Class II, III, or IV distribution operator", "Any employee with at least five years of municipal service", "An operator-in-training who completed the entry course"],
    correctIndex: 1,
    explanation: "When the ORO is absent or unable to act, an applicable operator not more than one class lower may be designated. For a Class III subsystem that means Class II or higher, subject to the regulation's delegation limits.",
    sourceReference: "Section 23(4) and temporary-delegation limits; current consolidation checked 2026-09-22.", ...sources.reg128,
  },
  {
    questionNum: 402,
    question: "A customer meter under-registers consumption while a buried main leaks. How should an AWWA water audit classify the two losses?",
    options: ["Both are real losses because both reduce billable water", "Both are apparent losses because neither reaches a billed total", "Meter under-registration is apparent loss; main leakage is real loss", "Meter error is authorized use; main leakage is apparent loss"],
    correctIndex: 2,
    explanation: "AWWA distinguishes apparent losses, such as consumption that is not properly measured or billed, from real losses, such as physical leakage from the distribution system.",
    sourceReference: "Definitions of apparent and real water losses; checked 2026-09-22.", ...sources.awwaLoss,
  },
  {
    questionNum: 405,
    question: "When a parameter must be sampled at least weekly under O. Reg. 170/03, what spacing must at least one weekly sample maintain from the preceding weekly sample?",
    options: ["At least one and not more than four days", "At least five and not more than ten days", "Exactly seven days to the minute", "At least ten and not more than twenty days"],
    correctIndex: 1,
    explanation: "Schedule 6 requires at least one weekly sample to be taken at least five days and not more than ten days after the preceding weekly sample for that parameter.",
    sourceReference: "Schedule 6, section 6-1.1(1); current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 413,
    question: "What is the ordinary reporting sequence after an operator becomes aware of a reportable adverse result?",
    options: ["Written annual report, then verbal confirmation", "Immediate direct report, followed by the required written notice within 24 hours", "Correct the condition first, then report only if it returns", "Notify customers first and regulators within 30 days"],
    correctIndex: 1,
    explanation: "The ordinary Schedule 16 sequence is an immediate direct report followed by written notice within 24 hours. Corrective action starts as required; it does not replace or postpone reporting.",
    sourceReference: "Schedule 16, sections 16-6 and 16-7; current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 436,
    question: "A supervisor is redesigning the distribution sampling route. Which approach best follows Ontario sampling-location guidance?",
    options: ["Use only locations nearest the treatment-plant discharge", "Include representative points where degradation is plausible", "Use any convenient tap and omit flushing for consistency", "Move all samples to one secure building to simplify access"],
    correctIndex: 1,
    explanation: "Distribution samples should represent the area being assessed and include locations where degradation, disinfectant decay, or by-product formation may occur; convenience alone is not a valid design basis.",
    sourceReference: "Distribution-system sample-location and flushing guidance; checked 2026-09-22.", ...sources.sampling,
  },
  {
    questionNum: 437,
    question: "After the qualifying 24-month lead-sampling period contains no result above the prescribed lead standard, what reduced distribution sampling frequency can Schedule 15.1 allow?",
    options: ["At least one sample every 36 months at a location likely to have elevated lead", "No further lead sampling", "One sample every week at the treatment plant", "One first-draw sample from every service each year"],
    correctIndex: 0,
    explanation: "Where the Schedule 15.1 reduction conditions are met, at least one distribution sample is taken every 36 months from a point likely to have an elevated lead concentration. The standard itself remains 0.010 mg/L.",
    sourceReference: "Schedule 15.1 reduced-sampling provision; current consolidation checked 2026-09-22.", ...sources.reg170,
  },
  {
    questionNum: 444,
    question: "Four candidates apply for an Ontario Class III distribution operator certificate. Which profile meets the ordinary regulatory combination?",
    options: ["Class I certificate; four years as a general labourer; no approved Class III exam", "Class II certificate; four years as an operator including two as OIC; prescribed education and exam", "Class II certificate; two years as an operator; no OIC time; approved Class III exam", "No operator certificate; four years in engineering consulting; approved Class III exam"],
    correctIndex: 1,
    explanation: "Schedule 3 requires the applicable Class II certificate, a satisfactory Class III examination, four years of operator experience including two years as OIC in a Class II–IV subsystem, and the stated education or accepted equivalents.",
    sourceReference: "Schedule 3, section 6; current consolidation checked 2026-09-22.", ...sources.reg128,
  },
  {
    questionNum: 470,
    question: "What is the strongest operational reason to maintain a documented distribution sampling plan rather than repeatedly using the easiest taps?",
    options: ["It guarantees that every future analytical result will be satisfactory", "It creates representative, repeatable coverage for trends and response", "It eliminates the need to flush and prepare individual sample points", "It replaces the regulation, licence and approved operating procedures"],
    correctIndex: 1,
    explanation: "A documented plan ties required frequencies to representative locations and consistent procedures, making results more comparable and responses auditable. It supplements—not replaces—the regulation, licence, and approved procedures.",
    sourceReference: "Distribution-system sampling-location guidance and WPI sampling-plan objectives; checked 2026-09-22.", ...sources.sampling,
  },
];

const numeric = [
  [501, "70.6 m", "Pressure head = 420/9.81 = 42.81 m. TDH = 22 + 42.81 + 5.8 = 70.61 m.", { options: ["70.6 m", "64.8 m", "48.6 m", "42.8 m"], correctIndex: 0 }],
  [502, "2.5 days", "Nominal turnover = 6,000 m³ / 2,400 m³/day = 2.5 days."],
  [503, "54,750,000 L (54,750 kL)", "Annual loss = 150 m³/day × 365 = 54,750 m³ = 54,750,000 L = 54,750 kL."],
  [504, "114.5 kW", "The first pump's hydraulic output is 101 × 0.85 = 85.85 kW. Required input at 75% efficiency is 85.85/0.75 = 114.47 kW.", { options: ["114.5 kW", "101.0 kW", "85.9 kW", "75.8 kW"], correctIndex: 0 }],
  [505, "0.22 hours", "Travel time = 1,200 m / 1.5 m/s = 800 s = 0.222 h. Diameter is not needed when velocity is given."],
  [506, "604.8 m³/day", "Excess night flow = 52 − 45 = 7 L/s. Daily volume = 7 × 86,400 / 1,000 = 604.8 m³/day."],
  [507, "1.77 m/s", "Flow = 4,800/86,400 = 0.05556 m³/s. Area = π(0.200)²/4 = 0.03142 m², so velocity = 1.768 m/s.", { question: "All 4,800 m³/day of flow passes through one 200 mm inside-diameter feeder main at a constant average rate. What is the mean velocity?", options: ["0.57 m/s", "1.18 m/s", "1.77 m/s", "2.54 m/s"], correctIndex: 2 }],
  [508, "199.2 kWh", "Pressure rise = 715 − 422 = 293 kPa. Hydraulic power = 293,000 × 0.068 = 19.924 kW; over 10 h, energy = 199.24 kWh.", { question: "A booster pump raises pressure from 422 kPa at its inlet to 715 kPa at its outlet while delivering 68 L/s for 10 hours. What hydraulic energy is added, ignoring losses?", options: ["136.0 kWh", "199.2 kWh", "293.0 kWh", "422.0 kWh"], correctIndex: 1 }],
  [509, "1,332 MJ", "Energy dissipated = ΔP × volume = 370,000 Pa × 3,600 m³ = 1.332×10⁹ J = 1,332 MJ.", { options: ["1,080 MJ", "1,332 MJ", "1,800 MJ", "2,448 MJ"], correctIndex: 1 }],
  [510, "49.7 m", "Required water-surface elevation is 114 + 370/9.81 = 151.72 m. Above ground elevation 102 m, the level is 49.72 m.", { options: ["37.7 m", "42.0 m", "49.7 m", "61.7 m"], correctIndex: 2 }],
  [511, "371 L/person", "Usable storage per person = 2,300,000 L / 6,200 = 370.97 L/person.", { question: "A tank has 2,300 m³ of usable storage for a population of 6,200. How much usable storage is available per person?", options: ["186 L/person", "278 L/person", "371 L/person", "519 L/person"], correctIndex: 2 }],
  [512, "60.1%", "For equal length and friction factor, Darcy-Weisbach gives Q proportional to D^2.5 at equal head loss. The 200 mm share is 0.2^2.5/(0.1^2.5 + 0.15^2.5 + 0.2^2.5) = 60.1%.", { question: "Three equal-length parallel pipes have inside diameters of 100, 150, and 200 mm. Assuming equal Darcy friction factors and equal head loss, approximately what share of total flow passes through the 200 mm pipe?", options: ["41.3%", "53.3%", "60.1%", "72.5%"], correctIndex: 2 }],
  [513, "Yes; about 37.9 hours", "Nominal turnover = 7,100/0.052/3,600 = 37.93 h, which is below the stated 48 h planning target. Actual water age can differ with mixing.", { question: "Using an ideal volume-over-flow estimate, a 7,100 m³ tank has a continuous throughflow of 52 L/s. Is its nominal turnover below a 48-hour planning target?", options: ["Yes; about 37.9 hours", "Yes; about 18.6 hours", "No; about 52.0 hours", "No; about 75.9 hours"], correctIndex: 0 }],
  [514, "21.4 m", "A 320 kPa service pressure requires 320/9.81 = 32.62 m of head. With only 11.2 m available, the additional elevation head needed is 21.42 m.", { question: "A tank water surface is 11.2 m above the highest customer, but the design target is 320 kPa at that customer. Ignoring losses, how much additional elevation head is needed?", options: ["11.2 m", "21.4 m", "32.6 m", "43.8 m"], correctIndex: 1 }],
  [515, "34,670 m³/year", "Under the stated linear assumption, new leakage = 41,100 × 485/575 = 34,669.6 m³/year.", { options: ["28,490 m³/year", "34,670 m³/year", "36,910 m³/year", "48,710 m³/year"], correctIndex: 1 }],
  [516, "27.2 kW", "Input power = 9.81 × 0.082 × 25 / 0.74 = 27.17 kW.", { options: ["20.1 kW", "24.7 kW", "27.2 kW", "36.7 kW"], correctIndex: 2 }],
  [517, "1.23 m/s", "Flow = 5,200/86,400 = 0.06019 m³/s; area = π(0.250)²/4 = 0.04909 m²; velocity = 1.226 m/s.", { question: "All 5,200 m³/day of a zone's flow passes through one 250 mm inside-diameter feeder main at a constant average rate. What is the mean velocity?", options: ["0.61 m/s", "0.89 m/s", "1.23 m/s", "1.77 m/s"], correctIndex: 2 }],
  [518, "596 GJ", "Annual energy = 13,800 × 12 = 165,600 kWh. At 3.6 MJ/kWh, this is 596,160 MJ = 596.16 GJ."],
  [519, "611,507 L/day", "NRW volume = 1,240,000 × 0.18 = 223,200 m³/year; per day = 611.51 m³ = 611,507 L."],
  [520, "56.5 L/s", "Area = π(0.300)²/4 = 0.07069 m². Q = Av = 0.07069 × 0.8 = 0.05655 m³/s = 56.5 L/s."],
  [521, "38.7 m", "Velocity = 0.900/[π(0.600)²/4] = 3.183 m/s. Darcy-Weisbach loss = 0.018(2,500/0.600)(3.183²/(2×9.81)) = 38.73 m.", { options: ["9.7 m", "19.4 m", "38.7 m", "77.5 m"], correctIndex: 2 }],
  [522, "52.4 kW", "Hydraulic power = (700−120) kPa × 0.065 m³/s = 37.7 kW. Input power = 37.7/0.72 = 52.36 kW.", { options: ["27.1 kW", "37.7 kW", "45.2 kW", "52.4 kW"], correctIndex: 3 }],
  [523, "1.25 days", "Nominal turnover = 2,000 m³ / 1,600 m³/day = 1.25 days."],
  [524, "373.4 kPa", "Elevation pressure change = 18 × 9.81 = 176.58 kPa. Ignoring losses, exit pressure = 550 − 176.58 = 373.42 kPa."],
  [525, "Pipe C", "At equal flow and friction factor, Darcy-Weisbach loss varies as L/D times velocity squared; the 200 mm Pipe C has the greatest velocity and resistance and therefore the greatest loss."],
  [526, "0.69 days", "Nominal residence time = 500 m³ / 720 m³/day = 0.694 day."],
  [527, "12.2%", "System input = authorized demand plus loss = 720×30 + 3,000 = 24,600 m³. Loss percentage of input = 3,000/24,600 × 100 = 12.20%.", { question: "Over a 30-day month, authorized demand is 720 m³/day and real loss is 3,000 m³. What percentage of system input is lost?", options: ["10.6%", "12.2%", "13.9%", "16.1%"], correctIndex: 1 }],
  [528, "35 pumps", "Peak flow = 2,160/3.6 = 600 L/s. Ceiling(600/18) = 34 duty pumps; one additional unavailable/standby unit gives 35 installed pumps.", { question: "Peak demand is 2,160 m³/h. Each pump can deliver 18 L/s at the required head. How many identical installed pumps are needed to meet peak demand with one pump unavailable?", options: ["33 pumps", "34 pumps", "35 pumps", "36 pumps"], correctIndex: 2 }],
  [529, "326 mm", "Q = 480/3,600 = 0.13333 m³/s. D = sqrt[4Q/(πv)] = 0.3257 m, so the calculated minimum inside diameter is about 326 mm.", { options: ["258 mm", "290 mm", "326 mm", "400 mm"], correctIndex: 2 }],
  [530, "160 kPa", "With the PRV controlling downstream pressure to 450 kPa, differential pressure = 610 − 450 = 160 kPa.", { question: "A PRV has 610 kPa upstream and controls downstream pressure to 450 kPa. What is the pressure differential across the valve?" }],
  [531, "196.2 kPa", "Gauge pressure from 20 m of water head is 20 × 9.81 = 196.2 kPa."],
  [532, "2.75 m/km", "Average hydraulic gradient expressed as head loss per kilometre = 33/12 = 2.75 m/km."],
  [533, "234 kPa", "Pressure increase = (82−48) psi × 6.895 kPa/psi = 234.43 kPa, about 234 kPa."],
  [534, "8.9 hours", "Travel time = 16,000/0.5 = 32,000 s = 8.89 h."],
  [535, "513.5 kWh/1,000 m³", "Specific energy = 95,000/185,000 = 0.5135 kWh/m³ = 513.5 kWh/1,000 m³."],
  [536, "6.0 days", "Nominal turnover = 3,300/550 = 6.0 days."],
  [537, "163.6 L/s", "Area = π(0.350)²/4 = 0.09621 m²; Q = 1.7×0.09621 = 0.16356 m³/s = 163.6 L/s."],
  [538, "60 m³/h increase", "Net rate = 180 + 120 − 240 = +60 m³/h."],
  [539, "98.2 L/s", "Q = Av = [π(0.250)²/4]×2.0 = 0.09817 m³/s = 98.2 L/s."],
  [540, "19.0 min", "One pipe volume travels in L/v = 1,600/1.4 = 1,142.9 s = 19.05 min.", { options: ["12.1 min", "16.3 min", "19.0 min", "22.9 min"], correctIndex: 2 }],
  [541, "40.8 m", "Pump pressure rise = 520−120 = 400 kPa; head = 400/9.81 = 40.77 m."],
  [542, "90 m", "The hydraulic grade line falls by the friction loss: 105 − 15 = 90 m. At an outlet elevation of 82 m, this corresponds to 8 m of pressure head.", { question: "A transmission main begins with an HGL elevation of 105 m and loses 15 m of head to an outlet at elevation 82 m. What is the outlet HGL elevation?", options: ["67 m", "82 m", "90 m", "105 m"], correctIndex: 2 }],
  [543, "1,100 m³/hr", "Total flow = 250 + 350 + 500 = 1,100 m³/h."],
  [544, "2,513 m³", "Stored volume = π(10 m)²(10 m)(0.80) = 2,513.3 m³."],
  [545, "2.0", "Turnovers per day = 12,000/6,000 = 2.0."],
  [546, "59 L/s", "Area = π(0.250)²/4 = 0.04909 m²; Q = 1.2×0.04909 = 0.05890 m³/s = 58.9 L/s, about 59 L/s."],
  [547, "176.6 kPa", "The house is 16 + 2 = 18 m below the water surface. Ignoring losses, gauge pressure = 18×9.81 = 176.58 kPa.", { question: "A tank water surface is 16 m above its base, and a house is 2 m below the tank base. Ignoring losses, what static gauge pressure is expected at the house?", options: ["98.1 kPa", "137.3 kPa", "176.6 kPa", "274.7 kPa"], correctIndex: 2 }],
  [548, "60 L/s", "Peak demand = 2.5×48 = 120 L/s. If two duty pumps share the peak equally, each must deliver 60 L/s.", { question: "A subdivision's peak flow is 2.5 times its 48 L/s average-day flow. If two duty pumps share peak flow equally, what capacity is required from each pump?", options: ["48 L/s", "60 L/s", "86 L/s", "120 L/s"], correctIndex: 1 }],
  [549, "648 m³", "Total length = 4×750 = 3,000 m = 30 hundred-metre sections. Leakage = 30×0.25 = 7.5 L/s = 648 m³/day."],
  [550, "No loss; static head is already 0.68 m short", "Static head = 170−135 = 35.00 m, while 350 kPa requires 350/9.81 = 35.68 m. The target cannot be met even at zero head loss.", { options: ["No loss; static head is already 0.68 m short", "A 0.68 m head loss can be allowed", "A 7.3 m head loss can be allowed", "A 35.0 m head loss can be allowed"], correctIndex: 0 }],
  [551, "126.2 kW", "Flow = 620/3,600 = 0.17222 m³/s. Input power = 9.81×0.17222×56/0.75 = 126.19 kW.", { options: ["94.6 kW", "112.0 kW", "121.0 kW", "126.2 kW"], correctIndex: 3 }],
  [552, "7,200 m³", "A 48-hour nominal age is 2 days; volume = 2×3,600 = 7,200 m³."],
  [553, "0.60 m/100 m", "Gradient = 12/2,000 = 0.006 m/m; over 100 m this is 0.60 m/100 m."],
  [554, "7.11 mg/L", "Initial mixed concentration = (43.2 m³×150 mg/L)/500 m³ = 12.96 mg/L. After 1.5 h at a 0.4 h⁻¹ turnover rate, C = 12.96e^(−0.4×1.5) = 7.11 mg/L.", { question: "A 43.2 m³ pulse at 150 mg/L is instantaneously mixed into a 500 m³ zone, displacing an equal volume. No more contaminant enters. With first-order washout at 0.4 h⁻¹, what concentration remains after 1.5 h?", options: ["3.90 mg/L", "7.11 mg/L", "9.60 mg/L", "12.96 mg/L"], correctIndex: 1 }],
  [555, "10,560 m³", "For the stated 48-hour planning target, maximum nominal storage = 220 m³/h × 48 h = 10,560 m³.", { question: "A planning target limits nominal storage turnover to 48 hours. At an average outflow of 220 m³/h, what maximum operating volume corresponds to that target?" }],
  [556, "14.5 kW", "Hydraulic power dissipated by friction = 9.81×0.18×8.2 = 14.48 kW."],
  [557, "50.5 kW", "Pressure drop = 235,000 Pa; Q = 0.215 m³/s; dissipated hydraulic power = ΔP×Q = 50,525 W = 50.5 kW.", { options: ["5.05 kW", "23.5 kW", "50.5 kW", "75.8 kW"], correctIndex: 2 }],
  [558, "1.10 m/s", "Total flow = 780/3,600 = 0.21667 m³/s; equal flow per pipe = 0.05417 m³/s. Each area is 0.04909 m², so velocity = 1.103 m/s.", { question: "Four identical 250 mm inside-diameter pipes operate in parallel and share 780 m³/h equally. What is the mean velocity in each pipe?", options: ["0.69 m/s", "1.10 m/s", "1.39 m/s", "2.21 m/s"], correctIndex: 1 }],
  [559, "0.12 kWh/m³", "Specific energy = 14,400/120,000 = 0.12 kWh/m³."],
  [560, "2,062 m³", "Cycled depth = 9.2−5.0 = 4.2 m. Volume = π(12.5 m)²×4.2 m = 2,061.67 m³.", { options: ["1,031 m³", "2,062 m³", "4,123 m³", "6,890 m³"], correctIndex: 1 }],
  [561, "0.53 m", "Using the stated SI Hazen-Williams form, h = 10.67(450)(0.060^1.852)/(130^1.852×0.350^4.871) = 0.529 m.", { options: ["0.21 m", "0.53 m", "2.10 m", "4.40 m"], correctIndex: 1 }],
  [562, "28 m", "Static lift = 128−105 = 23 m. Adding 5 m of friction loss gives a total dynamic head of 28 m.", { options: ["18 m", "23 m", "28 m", "33 m"], correctIndex: 2 }],
  [563, "3.0 days", "Nominal turnover = 2,400/800 = 3.0 days.", { options: ["1.5 days", "2.0 days", "3.0 days", "4.8 days"], correctIndex: 2 }],
  [564, "0.063 kPa/m", "Pressure gradient = (525−473)/820 = 0.0634 kPa/m.", { options: ["0.037 kPa/m", "0.063 kPa/m", "0.51 kPa/m", "1.17 kPa/m"], correctIndex: 1 }],
  [565, "Empty after about 1.98 h, with an 8 m³ shortfall", "Withdrawal over two hours is 0.140×7,200 = 1,008 m³. A 1,000 m³ tank empties after 1,000/0.140 = 7,142.9 s = 1.98 h and cannot supply the final 8 m³.", { question: "A full 1,000 m³ tank is the only source for a 140 L/s fire flow lasting two hours. What is the outcome?", options: ["120 m³ remains", "The tank ends exactly empty", "Empty after about 1.98 h, with an 8 m³ shortfall", "Empty after 1.50 h, with a 244 m³ shortfall"], correctIndex: 2 }],
  [566, "208.3 L/s", "Available time is 8 h = 28,800 s. Required rate = 6,000,000/28,800 = 208.3 L/s.", { options: ["125.0 L/s", "166.7 L/s", "208.3 L/s", "300.0 L/s"], correctIndex: 2 }],
  [567, "20 hours", "Under the stated plug-flow tracer assumption, elapsed time from injection to downstream arrival is the travel time: 20 h.", { question: "A conservative tracer pulse injected at a reservoir outlet is detected at a downstream hydrant 20 hours later. Under a plug-flow assumption, what travel time does the test indicate?", options: ["9.1 hours", "18 hours", "20 hours", "22 hours"], correctIndex: 2 }],
  [568, "56.1 m", "Pressure head = 550,000/(1,000×9.81) = 56.07 m.", { options: ["44.6 m", "56.1 m", "74.0 m", "80.2 m"], correctIndex: 1 }],
  [569, "864 m³/day", "Estimated leakage = (16−6) L/s = 10 L/s; daily volume = 10×86,400/1,000 = 864 m³/day.", { options: ["288 m³/day", "432 m³/day", "864 m³/day", "1,440 m³/day"], correctIndex: 2 }],
  [570, "$327.71", "Input power = 9.81×0.235×42/0.78 = 124.13 kW. Cost = 124.13×24×$0.11 = $327.71.", { question: "A pump delivers 235 L/s against 42 m total dynamic head for 24 hours. Overall wire-to-water efficiency is 78% and energy costs $0.11/kWh. Ignoring demand charges, what is the approximate cost?", options: ["$255.61", "$327.71", "$420.13", "$721.25"], correctIndex: 1 }],
  [571, "137.7 to 168.3", "Minimum HGL elevation = 102 + 350/9.81 = 137.68 m; maximum = 102 + 650/9.81 = 168.26 m."],
];

export const NUMERIC_EXPECTED_ANSWERS = Object.fromEntries(numeric.map(([questionNum, answer]) => [questionNum, answer]));

// Move selected correct answers without changing wording so the final review
// payload has an exact 29/29/29/29 A/B/C/D distribution.
const KEY_REBALANCE = new Map([
  ...[5, 23, 44, 58, 64, 106].map(questionNum => [questionNum, 0]),
  ...[114, 126, 133, 153, 155, 171, 181, 198, 210, 213, 265].map(questionNum => [questionNum, 3]),
  ...[29, 164, 228, 269, 367, 402, 507, 510].map(questionNum => [questionNum, 3]),
]);

function normalizedOptions(value) {
  return typeof value === "string" ? JSON.parse(value) : structuredClone(value);
}

function fail(message) {
  throw new Error(`Invalid 116-question repair payload: ${message}`);
}

export function buildRepairedQuestions(liveRows) {
  if (!Array.isArray(liveRows)) fail("liveRows must be an array");
  const live = new Map(liveRows.map(row => [Number(row.questionNum), row]));
  const replacements = new Map(regulatory.map(item => [item.questionNum, item]));

  for (const [questionNum, answer, explanation, override = {}] of numeric) {
    const before = live.get(questionNum);
    if (!before) fail(`missing live row ${questionNum}`);
    const options = override.options ? structuredClone(override.options) : normalizedOptions(before.options);
    const correctIndex = override.correctIndex ?? options.indexOf(answer);
    if (correctIndex < 0 || options[correctIndex] !== answer) fail(`answer not represented exactly once at ${questionNum}`);
    replacements.set(questionNum, {
      questionNum,
      question: override.question ?? before.question,
      options,
      correctIndex,
      explanation,
      sourceReference: "Independent SI calculation shown in the explanation; Class III calculation topic verified against the WPI 2025 need-to-know criteria on 2026-09-22.",
      ...sources.wpi,
    });
  }

  if (replacements.size !== 116) fail(`expected 116 replacements, got ${replacements.size}`);
  const output = [];
  for (const questionNum of REPAIRED_QUESTION_NUMBERS) {
    const before = live.get(questionNum);
    const replacement = replacements.get(questionNum);
    if (!before || !replacement) fail(`missing row or replacement ${questionNum}`);
    const after = {
      ...before,
      ...replacement,
      options: structuredClone(replacement.options),
      steps: null,
      tip: null,
      isCalc: REPAIRED_NUMERIC_NUMBERS.includes(questionNum) ? "yes" : "no",
      topic: REPAIRED_NUMERIC_NUMBERS.includes(questionNum) ? "Calculations" : before.topic,
      cognitiveLevel: "application",
      blueprintObjective: REPAIRED_NUMERIC_NUMBERS.includes(questionNum)
        ? "Perform and interpret distribution-system calculations"
        : "Apply Ontario distribution-system regulatory and operational requirements",
      reviewStatus: "in_review",
      reviewedBy: null,
      reviewedAt: null,
    };
    const targetIndex = KEY_REBALANCE.get(questionNum);
    if (targetIndex !== undefined && targetIndex !== after.correctIndex) {
      const [answer] = after.options.splice(after.correctIndex, 1);
      after.options.splice(targetIndex, 0, answer);
      after.correctIndex = targetIndex;
    }
    output.push(after);
  }
  return output;
}
