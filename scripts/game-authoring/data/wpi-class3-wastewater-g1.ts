// Class 3 Wastewater Treatment, western exam course, gap-fill table g1.
// Fills topics a coverage check found thin, at depth: security risk and response planning,
// public communication during upsets and overflows, flow equalization sizing and operation,
// and dissolved air flotation performance control.
// General operator knowledge in original wording. No book text is stored in the repo.
// Each row rests on well-established operator knowledge, so each section is marked "General knowledge".
import type { CourseData } from "../build";
const data: CourseData = {
  courseKey: "wpi-class3-wastewater",
  facts: [
    // General knowledge (security and risk)
    ["h", "A vulnerability assessment lists critical assets and ranks them by likelihood and consequence, so protection goes first where harm would be greatest.", true, "Ranking by risk directs limited money and effort to the assets whose loss would hurt most."],
    ["m", "Keeping the control network separate from the office network limits how far an infection can spread toward process controls.", true, "Separation means a problem on an office computer has a harder path to the equipment that runs the plant."],
    ["m", "A response plan names who makes decisions, who calls outside agencies and how staff are reached when an event occurs.", true, "Clear roles save time and confusion when people are under stress."],
    ["h", "A security plan written once stays current without revision as staff, equipment and threats change.", false, "Plans are reviewed after changes and drills, or they drift away from the real site."],
    ["m", "Cameras and fences make a layered defence on their own, so a response plan adds little.", false, "Barriers delay and detect, but people still need a plan for what to do when something happens."],
    // General knowledge (public communication)
    ["h", "A communication plan prepared before an upset sets who speaks, what is said first and how updates reach the public.", true, "Deciding these points ahead of time avoids delay and mixed messages during an event."],
    ["m", "Messages from the plant, the utility office and health officials are kept consistent so the public is not confused.", true, "Conflicting statements damage trust and make it harder for people to act on advice."],
    ["h", "Early statements about the cause and volume of an overflow are given in firm detail to build confidence.", false, "Early figures are often estimates, so statements stay with confirmed facts and say more is being learned."],
    ["m", "Technical terms and lab results are the best way to reassure a worried public.", false, "Plain language works better, since raw data is hard for most people to judge."],
    ["h", "Silence until the investigation is finished is the best way to protect public trust.", false, "A prompt notice of what is known and what people should do builds trust, while silence invites rumour."],
    // General knowledge (flow equalization)
    ["h", "The storage an equalization basin needs can be read from the largest gap between cumulative inflow and cumulative average flow on a mass diagram.", true, "That gap is the greatest volume to be held so that a steady flow can be released."],
    ["h", "An in-line basin receives the whole flow, so it evens out strength as well as flow, while a side-line basin diverts the excess above a set rate and smooths load less.", true, "In-line operation blends the entire flow, whereas side-line operation leaves part of it untouched."],
    ["h", "Pumping from the basin at a rate paced to plant inflow or loading reduces the swings reaching the biology.", true, "A controlled release keeps downstream tanks near their design condition."],
    ["h", "Sizing an equalization basin from average daily flow alone gives enough storage for a storm peak.", false, "Storm and daily peaks are well above the average, so the volume is set from the peak pattern."],
    ["h", "Because wet-weather flow is dilute, holding it back in the basin gives little protection to the biology against washout.", false, "Holding back a hydraulic surge keeps solids in the clarifiers and the mixed liquor in the plant."],
    ["m", "Foam and floating scum on the basin surface are left to build because they do not affect pumps and mixers.", false, "Scum can foul level sensors, plug pump inlets and carry odour, so it is removed."],
    // General knowledge (dissolved air flotation)
    ["h", "The air-to-solids ratio compares the mass of air released with the mass of solids fed, and it rises when recycle flow or saturation pressure is increased.", true, "More recycle water or higher pressure carries more dissolved air to the release point."],
    ["h", "A flotation jar test helps choose the coagulant and polymer dose that gives good bubble attachment.", true, "The test shows which dose forms floc that floats well and leaves clear water."],
    ["m", "A milky cloud of fine bubbles rising evenly across the tank shows that air saturation and release are working.", true, "Even, fine bubbles mean the saturator and release valves are doing their job."],
    ["h", "Raising the recycle ratio well above what is needed improves float quality without adding to the hydraulic load.", false, "Extra recycle adds flow and turbulence, which can break up floc and carry solids out."],
    ["h", "Large coarse bubbles from a poorly set release valve lift solids as well as fine bubbles do.", false, "Coarse bubbles rise fast and disturb floc, while fine bubbles attach gently and lift it."],
    ["m", "Raising the feed flow beyond the design surface loading has little effect on effluent quality.", false, "A higher surface loading carries unfloated solids out with the effluent."],
    ["m", "A swing in feed pH has little effect on how well the coagulant works in a flotation unit.", false, "Coagulants work in a limited pH range, so a swing can leave the floc weak."]
  ],
  boards: [
    // General knowledge (public communication)
    { d: "m", prompt: "Match each communication tool to what it provides.", pairs: [["Pre-written message templates", "Speed up notices during an upset"], ["Spokesperson briefing", "Keeps one voice for the media"], ["Shoreline warning sign", "Warns people away from affected water"], ["Front desk call script", "Gives staff consistent answers to callers"], ["After-event summary", "Explains the cause and the fixes to the community"], ["Agency contact list", "Lets staff notify partners quickly"]] },
    // General knowledge (flow equalization)
    { d: "h", prompt: "Match each equalization design term to its meaning.", pairs: [["In-line basin", "Receives the entire plant flow"], ["Side-line basin", "Takes just the flow above a set rate"], ["Mass diagram", "Plots cumulative volume to size the storage"], ["Drawdown", "Emptying the basin to restore capacity after a peak"], ["Flow-paced release", "Pump rate tied to the measured plant flow"], ["Emergency overflow", "Protects the basin from spilling when it is full"]] },
    // General knowledge (dissolved air flotation)
  ],
  oddSets: [
    // General knowledge (flow equalization)
    { d: "m", rule: "a benefit of equalizing flow", members: ["Steadier clarifier loading", "Stable chemical dosing", "Less hydraulic washout", "Softer batch discharge shocks", "Even load on blowers"], intruders: ["Higher flow peaks", "Sharper load swings", "More shock loads"], why: "{odd} is the opposite of what equalization gives." },
    // General knowledge (dissolved air flotation)
  ],
  sequences: [],
  relations: [
    // General knowledge (security and risk)
    ["m", "Drills and tabletop exercises of the security response plan are held on a regular basis.", "the time staff take to respond to a real event", "decrease", "Practice exposes gaps and builds familiarity, so people act faster when it counts."],
    ["h", "The control network is linked straight to the office network and the internet with no separation.", "the exposure of process controls to outside cyber threats", "increase", "Each open path gives an outside threat another route toward the equipment."],
    // General knowledge (public communication)
    ["m", "Updates during an upset are issued at the times the plant promised.", "public trust in the plant", "increase", "Keeping promises shows the public that the plant is open and in control."],
    ["h", "Staff give callers different explanations of the same overflow.", "public confusion and mistrust", "increase", "Mixed messages suggest the plant does not know what happened."],
    // General knowledge (flow equalization)
    ["m", "The basin is drawn down too slowly after a storm and is nearly full when the next storm arrives.", "the protection offered against the next peak", "decrease", "Little empty volume is left to absorb the new surge."],
    ["h", "A strong batch discharge from an industry is routed through the equalization basin instead of straight to the plant.", "the sudden shock on the biology", "decrease", "Blending the batch with the stored flow dilutes it and spreads it over time."],
    ["m", "Mixing power in the basin is cut below what keeps solids suspended.", "the solids settling out in the basin", "increase", "Without enough energy, solids drop to the floor."],
    // General knowledge (dissolved air flotation)
    ["m", "The saturator pressure falls while the recycle flow stays the same.", "the air supplied per kg of solids", "decrease", "Less air dissolves at lower pressure, so each kilogram of solids gets less air."],
    ["h", "Feed solids concentration rises while recycle flow and pressure stay the same.", "the air-to-solids ratio", "decrease", "The same air is shared among more solids."],
    ["m", "An underdosed coagulant is raised to the dose found best in the jar test.", "the solids in the flotation effluent", "decrease", "Stronger floc attaches to the bubbles and floats instead of passing through."]
  ],
  flaws: [
    // General knowledge (security and risk)
    { d: "h", prompt: "Which statement about security risk ranking is wrong?", flawed: "Consequences are left out of the ranking", goods: ["Likelihood and consequence are both considered", "Critical assets such as chemical storage rank high", "The ranking is reviewed after changes to the site"], explanation: "Consequence is half of risk, so a ranking without it misdirects protection." },
    { d: "m", prompt: "Which statement about responding to a security incident is wrong?", flawed: "Records are skipped to keep the response quick", goods: ["Staff follow the roles set out in the plan", "Notes on times and actions are kept for the review", "A review afterwards looks for gaps in the plan"], explanation: "Records support the review and a later investigation, so they are kept during the response." },
    // General knowledge (public communication)
    { d: "m", prompt: "Which statement about speaking to the media during an upset is wrong?", flawed: "Each staff member gives their own account", goods: ["A designated spokesperson speaks for the plant", "Statements stay with confirmed facts", "Questions without a known answer are noted for follow-up"], explanation: "Separate accounts conflict, so one trained voice speaks for the plant." },
    { d: "h", prompt: "Which statement about a public notice of an overflow is wrong?", flawed: "Advice on water contact is left out", goods: ["The notice says where and what happened in plain words", "It tells people which areas to avoid", "It says how and when updates will follow"], explanation: "Protective advice is the most useful part of the notice, so it is included." },
    // General knowledge (flow equalization)
    { d: "h", prompt: "Which statement about sizing an equalization basin is wrong?", flawed: "Peak storm flow is ignored in the volume", goods: ["Volume is based on the cumulative flow difference", "A level control and overflow protect against spills", "Records of daily flow patterns support the sizing"], explanation: "Storage has to cover the peak pattern, so the peaks drive the volume." },
    { d: "h", prompt: "Which statement about releasing flow from the basin is wrong?", flawed: "Pump rate is set without regard to treatment limits", goods: ["Release is paced to what the downstream process handles", "Pumping is slowed as the plant nears its limit", "Basin level is watched so the basin is ready for the next peak"], explanation: "The point of the basin is to match the plant's capacity, so release is tied to it." },
    // General knowledge (dissolved air flotation)
    { d: "h", prompt: "Which statement about air-to-solids ratio is wrong?", flawed: "A higher solids load needs less air to hold it", goods: ["Heavier solids loads call for more air", "Recycle flow and pressure both change the air supplied", "Tracking the ratio helps spot poor flotation"], explanation: "More solids need more air, so the supply is raised as the load rises." },
    { d: "m", prompt: "Which statement about float from a flotation unit is wrong?", flawed: "Skimmer speed has no effect on float", goods: ["Faster skimming tends to give a wetter float", "Float is removed to a hopper or sump", "Float solids are tracked in the lab"], explanation: "Skimmer speed changes how much water leaves with the float, so it affects float solids." }
  ]
};
export default data;
