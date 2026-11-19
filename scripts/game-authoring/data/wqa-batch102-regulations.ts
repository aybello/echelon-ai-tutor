// Water Quality Analyst (WQA), batch 102: Ontario regulation and protocol items. Every regulatory
// statement cites the section it comes from. Sources (uploaded in the session, 2026-11-19):
//  - O. Reg. 170/03 (Drinking-Water Systems), last amendment O. Reg. 269/22
//  - O. Reg. 169/03 (Ontario Drinking Water Quality Standards), last amendment O. Reg. 457/16
//  - Protocol of Accepted Drinking Water Testing Methods, Version 2.0, May 2010 (dated; check currency)
//  - Practices for the Collection and Handling of Drinking Water Samples (ontario.ca), updated January 6, 2026 (guidance, not regulation)
// STATUS: drafted and validated only. Regulatory statements need a technical reviewer before publication.
import type { CourseData } from "../build";

const data: CourseData = {
  courseKey: "wqa",
  facts: [
    ["m", "Under Ontario Regulation 170/03, a chlorinating system keeps its free chlorine residual at not less than 0.05 mg/L.", true, "O. Reg. 170/03, Sched. 1, s. 1-2 (2) 4 (i): applies where the system chlorinates and does not chloramine, at all times and locations in the distribution system."],
    ["m", "Under Ontario Regulation 170/03, a chloraminating system keeps its combined chlorine residual at not less than 0.25 mg/L.", true, "O. Reg. 170/03, Sched. 1, s. 1-2 (2) 4 (ii): the combined chlorine residual minimum for a system that provides chloramination."],
    ["h", "Under Ontario Regulation 170/03, adjustments to water treatment equipment may be made by an operator who is not certified.", false, "O. Reg. 170/03, Sched. 1, s. 1-2 (2) 5: adjustments are carried out only by certified operators or emergency substitute operators."],
    ["m", "A free chlorine residual of 0.03 mg/L meets the minimum for a chlorinating system under Ontario Regulation 170/03.", false, "The minimum is 0.05 mg/L (O. Reg. 170/03, Sched. 1, s. 1-2 (2) 4 (i)), so 0.03 mg/L is below it."],
    ["e", "Samples for distribution testing are taken from the point at which water enters the distribution system, unless otherwise specified.", true, "O. Reg. 170/03, Sched. 6, s. 6-2: the point of entry to the distribution system or the plumbing connected to it."],
    ["m", "When a microbiological sample is taken and tested, a free chlorine residual sample is taken at the same time and location and tested immediately.", true, "O. Reg. 170/03, Sched. 6, s. 6-3 (1): the residual sample is for systems that chlorinate and do not chloramine; combined chlorine applies to systems that chloramine."],
    ["h", "Schedule 6 requires a chlorine residual test alongside raw-water microbiological samples.", false, "The opposite is true: s. 6-3 (2) excludes raw-water samples from the residual companion requirement."],
    ["m", "A microbiological sample from the distribution system needs no companion chlorine residual sample.", false, "O. Reg. 170/03, Sched. 6, s. 6-3 (1) requires a companion residual sample for distribution microbiological samples."],
    ["e", "Under Schedule 6, samples are taken as grab samples unless continuous monitoring or authorized in-line microbiological equipment is used.", true, "O. Reg. 170/03, Sched. 6, s. 6-4 (1)."],
    ["m", "Continuous monitoring may be used under Schedule 6 for free chlorine residual and fluoride, among other listed parameters.", true, "O. Reg. 170/03, Sched. 6, s. 6-4 (2): the listed parameters are turbidity, fluoride, free chlorine residual, and free and total chlorine residual for combined residual."],
    ["h", "Continuous monitoring is permitted under Schedule 6 for E. coli counts.", false, "O. Reg. 170/03, Sched. 6, s. 6-4 (2) lists turbidity, fluoride and chlorine residuals only; E. coli is not in the list."],
    ["h", "In-line microbiological equipment needs no equivalence to an accredited test method.", false, "O. Reg. 170/03, Sched. 6, s. 6-4 (3): it may be used only if the Director is of the opinion that its method is equivalent to an accredited method."],
    ["m", "In-line microbiological equipment can be used when the Director judges its method equivalent to an accredited method.", true, "O. Reg. 170/03, Sched. 6, s. 6-4 (3)."],
    ["m", "Schedule 6 sets sampling frequencies from weekly to six-monthly.", false, "Schedule 6 sets sampling frequencies from weekly to every 60 months (O. Reg. 170/03, Sched. 6, s. 6-1.1 (1) to (7)); a six-month frequency is not listed."],
    ["e", "Under the Safe Drinking Water Act, 2002, licensed Ontario laboratories and eligible out-of-province laboratories may conduct tests on drinking water samples.", true, "Protocol of Accepted Drinking Water Testing Methods, Version 2.0 (May 2010), section 1 (Introduction), page 3."],
    ["m", "A drinking water laboratory needs accreditation for the selected method, or Director authorization, to run a test.", true, "Protocol, section 1 (Introduction): accreditation by SCC, CALA or an equivalent body, or authorization by the Director."],
    ["h", "A laboratory may run drinking water tests without validating its methods, if the method is accredited.", false, "Protocol, section 1: the laboratory must also use validated methods and show that it meets or exceeds the reporting detection limit."],
    ["e", "Drinking water samples shall not be filtered in the field.", true, "Practices for the Collection and Handling of Drinking Water Samples (ontario.ca, updated January 6, 2026): guidance, not regulation."],
    ["m", "Microbiological sample bottles contain a dechlorinating agent to neutralise residual chlorine in the sample.", true, "Practices for the Collection and Handling of Drinking Water Samples (ontario.ca, updated January 6, 2026): guidance, not regulation."],
    ["h", "Preservatives are interchangeable, so a sample can use whichever preservative is at hand.", false, "Practices (updated January 6, 2026): preservatives are not interchangeable and the laboratory provides the right one."],
  ],
  boards: [],
  oddSets: [],
  sequences: [],
  relations: [
    ["m", "A chlorinating system's free chlorine residual falls to 0.03 mg/L at a far-end tap.", "compliance with the 0.05 mg/L minimum", "decrease", "O. Reg. 170/03, Sched. 1, s. 1-2 (2) 4 (i): the residual must not be less than 0.05 mg/L at all locations."],
    ["m", "A chloraminating system's combined chlorine residual falls to 0.20 mg/L.", "compliance with the 0.25 mg/L minimum", "decrease", "O. Reg. 170/03, Sched. 1, s. 1-2 (2) 4 (ii)."],
    ["h", "An operator who is not certified adjusts water treatment equipment.", "the regulatory standing of the adjustment", "decrease", "O. Reg. 170/03, Sched. 1, s. 1-2 (2) 5: only certified or emergency substitute operators may make adjustments."],
    ["h", "A chlorine residual is not tested with a distribution microbiological sample.", "the regulatory compliance of the sampling", "decrease", "O. Reg. 170/03, Sched. 6, s. 6-3 (1) requires the companion residual sample."],
    ["h", "An in-line microbiological analyser is used without an accredited-equivalent method.", "the regulatory standing of its results", "decrease", "O. Reg. 170/03, Sched. 6, s. 6-4 (3)."],
    ["m", "A distribution sample is taken from a point before the water enters the distribution system.", "the regulatory compliance of the sampling point", "decrease", "O. Reg. 170/03, Sched. 6, s. 6-2 sets the point of entry as the sampling point, unless otherwise specified."],
  ],
  flaws: [
    { d: "m", prompt: "Tap the flawed statement about chlorine residual minimums.", flawed: "A combined residual of 0.05 mg/L meets the chloramination minimum.", goods: ["A free chlorine residual of 0.05 mg/L meets the minimum where the system chlorinates and does not chloramine, under O. Reg. 170/03, Sched. 1, s. 1-2 (2) 4 (i).", "A combined chlorine residual of 0.25 mg/L meets the chloramination minimum under O. Reg. 170/03, Sched. 1, s. 1-2 (2) 4 (ii)."], explanation: "The chloramination minimum is 0.25 mg/L (s. 1-2 (2) 4 (ii)); 0.05 mg/L is the chlorination minimum." },
    { d: "h", prompt: "Tap the flawed statement about sampling location.", flawed: "Distribution samples are taken at the raw-water intake.", goods: ["Distribution samples are taken from the point at which water enters the distribution system, unless otherwise specified (O. Reg. 170/03, Sched. 6, s. 6-2).", "Raw-water samples are excluded from the companion chlorine residual requirement (O. Reg. 170/03, Sched. 6, s. 6-3 (2))."], explanation: "The raw-water intake is not the distribution sampling point (s. 6-2)." },
    { d: "h", prompt: "Tap the flawed statement about in-line microbiological equipment.", flawed: "In-line equipment needs no equivalence to an accredited test method.", goods: ["In-line microbiological equipment can be used when the Director judges its method equivalent to an accredited method (O. Reg. 170/03, Sched. 6, s. 6-4 (3)).", "Continuous monitoring can be used under Schedule 6 for free chlorine residual (O. Reg. 170/03, Sched. 6, s. 6-4 (2))."], explanation: "The Director's equivalence judgement applies to in-line microbiological equipment (s. 6-4 (3))." },
    { d: "h", prompt: "Tap the flawed statement about drinking water laboratories.", flawed: "A test may use an unvalidated method once the lab is accredited.", goods: ["A laboratory needs accreditation for the selected method, or Director authorization, to run a test (Protocol, Version 2.0, section 1).", "A validated method is checked to show it meets the reporting detection limit (Protocol, Version 2.0, section 1)."], explanation: "The protocol requires validation as well as accreditation." },
  ],
};

export default data;
