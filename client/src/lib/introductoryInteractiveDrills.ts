import type { DrillExample } from "@/components/InteractiveDrill";

/**
 * Introductory water and wastewater public examples for practice only.
 * These examples are not a paid question bank or reviewed official exam prep.
 */
export const introductoryInteractiveDrills: readonly DrillExample[] = [
  // US EPA, wastewater screening and grit removal:
  // https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1000S7N.TXT
  {
    id: "coarse-screen-ammonia",
    mode: "rapid-swipe",
    prompt: "Will a coarse screen remove dissolved ammonia from wastewater?",
    correctAnswer: false,
    explanation: "No. Dissolved ammonia passes through a physical coarse screen; the screen removes larger solids and debris.",
  },
  {
    id: "coarse-screen-rag",
    mode: "rapid-swipe",
    prompt: "Will a coarse screen retain a cloth rag large enough to be caught on the screen?",
    correctAnswer: true,
    explanation: "Yes. Coarse screens retain large solids such as rags that are large enough to be caught. Smaller or shredded material may pass through.",
  },
  // Irish EPA, coagulation, flocculation and clarification:
  // https://www.epa.ie/publications/compliance--enforcement/drinking-water/advice--guidance/EPA_water_treatment_mgt_coag_flocc_clar2.pdf
  // CDC, how water treatment works:
  // https://www.cdc.gov/drinking-water/about/how-water-treatment-works.html
  {
    id: "water-treatment-process-match",
    mode: "speed-match",
    prompt: "Match each water treatment process to its main role.",
    pairs: [
      { id: "coagulation", left: "Coagulation", right: "Destabilizes fine particles" },
      { id: "flocculation", left: "Flocculation", right: "Promotes larger particle aggregates" },
      { id: "sedimentation", left: "Sedimentation", right: "Settles solids using gravity" },
    ],
    explanation: "Coagulation destabilizes particles, flocculation encourages them to form larger flocs, and sedimentation allows solids to settle by gravity.",
  },
  // US EPA, orientation to wastewater treatment operation:
  // https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=9101XC4I.TXT
  // New York State, activated sludge operational strategies for nitrogen removal:
  // https://extapps.dec.ny.gov/docs/water_pdf/module2.pdf
  {
    id: "primary-clarifier-odd-one-out",
    mode: "odd-one-out",
    prompt: "Which is not a main job of a conventional primary clarifier?",
    options: [
      { id: "settle-solids", label: "Settle suspended solids" },
      { id: "collect-sludge", label: "Collect settled sludge" },
      { id: "remove-scum", label: "Remove floatable scum" },
      { id: "nitrify", label: "Convert ammonia to nitrate" },
    ],
    correctOptionId: "nitrify",
    explanation: "Primary clarification is mainly a physical separation process. Nitrification is a biological conversion of ammonium to nitrite and then nitrate, not a principal job of a primary clarifier.",
  },
  // New York State, activated sludge operational strategies for nitrogen removal:
  // https://extapps.dec.ny.gov/docs/water_pdf/module2.pdf
  {
    id: "oxygen-limitation-nitrification",
    mode: "cause-effect",
    prompt: "In an aeration basin, dissolved oxygen falls from a previously non-limiting level into a limiting range. Other relevant conditions remain unchanged. What happens to the nitrification rate?",
    options: [
      { id: "increases", label: "It increases" },
      { id: "decreases", label: "It decreases" },
      { id: "unchanged", label: "It stays the same" },
    ],
    correctOptionId: "decreases",
    explanation: "Nitrifying microorganisms need oxygen. When oxygen becomes limiting, the nitrification rate decreases relative to the previous non-limited condition; it does not necessarily stop entirely.",
  },
  // Maine DEP, activated sludge process control:
  // https://www.maine.gov/dep/water/wwtreatment/activated_sludge_process_control.pdf
  {
    id: "ras-was-flaw",
    mode: "tap-the-flaw",
    prompt: "Which statement about activated sludge is incorrect?",
    options: [
      { id: "ras", label: "Return activated sludge recycles settled biomass to aeration." },
      { id: "was", label: "Waste activated sludge removes excess solids from the system." },
      { id: "same", label: "Increasing return activated sludge is always the same as increasing waste activated sludge." },
    ],
    correctOptionId: "same",
    explanation: "Return activated sludge (RAS) recycles biomass; waste activated sludge (WAS) removes excess solids. Their rates are not inherently the same, even though WAS may be withdrawn from a RAS line in some systems.",
  },
  // US EPA, orientation to wastewater treatment operation:
  // https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=9101XC4I.TXT
  // Maine DEP, activated sludge process control:
  // https://www.maine.gov/dep/water/wwtreatment/activated_sludge_process_control.pdf
  {
    id: "secondary-clarifier-order",
    mode: "before-after",
    prompt: "In a simplified conventional activated-sludge treatment train, does the secondary clarifier come before or after the aeration basin?",
    correctAnswer: "after",
    explanation: "After. Mixed liquor flows from the aeration basin to the secondary clarifier, where biomass settles and can be returned to aeration.",
  },
];
