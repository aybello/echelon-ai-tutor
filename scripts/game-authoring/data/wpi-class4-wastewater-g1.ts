// Class 4 Wastewater Treatment, western exam course, gap-fill table g1.
// Fills topics a coverage check found thin: security risk management, dissolved air flotation performance,
// equalization and wet-weather operation as a plant strategy, and communication and public trust.
// Judgement and management content for the person in charge of a large or complex plant, in original wording.
// Metric units, no regulation numbers and no jurisdiction-specific values. Each row rests on well-established
// operator and management knowledge, so each section is marked "General knowledge".
import type { CourseData } from "../build";
const data: CourseData = {
  courseKey: "wpi-class4-wastewater",
  facts: [
    // General knowledge (security risk management)
    ["m", "A risk register records each identified threat with its rating, the controls in place and the person responsible for follow-up.", true, "Named owners and recorded controls turn an assessment into actions that can be tracked."],
    ["h", "In operational technology, safe and steady operation ranks above confidentiality, so updates are tested and scheduled around process risk.", true, "A hasty patch on a live control system can stop the process, so changes are staged and checked."],
    ["h", "Layered security assumes each barrier can fail, so detection and response are placed behind the delay measures.", true, "Backing up each layer keeps one failure from opening the whole site."],
    ["h", "A control system compromised by malware is safely restored from backups without first checking that the backups are clean and tested.", false, "An untested or infected backup can bring the problem straight back, so backups are verified before use."],
    ["m", "One strong perimeter fence lets a utility reduce its spending on detection and response.", false, "Barriers delay but do not stop a determined intruder, so detection and response stay in the plan."],
    // General knowledge (dissolved air flotation performance management)
    ["h", "Optimizing recycle ratio means finding the point past which extra recycle stops improving float and starts adding flow and turbulence.", true, "Beyond that point the added hydraulic load disturbs floc and carries solids out."],
    ["h", "Float solids and effluent quality trade against each other through skimmer speed and float depth, so targets are set for both.", true, "Drier float can cost clarity, and the reverse, so one target alone misleads."],
    ["m", "A chemical dose chosen from one good jar test is held for the season because feed quality stays steady.", false, "Feed solids, oil and pH shift, so the dose is checked against current conditions and retested."],
    ["h", "Float solids are the best measure of unit performance because the two move together with effluent clarity.", false, "The two can move apart, so both are tracked."],
    ["h", "Wear in the recycle pump and saturator has little effect on performance until the unit fails outright.", false, "Falling pressure and flow reduce dissolved air gradually, so performance slips well before failure."],
    // General knowledge (equalization and wet-weather operation as a plant strategy)
    ["m", "Sizing storage means comparing records of peak flows and loads with what the process can accept, rather than relying on averages.", true, "Averages hide the peaks that cause washout and shock loads."],
    ["h", "A return strategy that empties the basin as fast as the plant can safely accept after an event protects the plant better against a second storm.", true, "A basin that is still full offers little protection when the next peak arrives, but release is still held within the plant's capacity."],
    ["h", "Odour from an equalization basin is a detail to settle after construction at little cost.", false, "Covers, ventilation and air supply are far harder to add later, so odour is part of the design."],
    ["h", "Past flow records are a sufficient basis for sizing with no allowance for growth or changing rainfall patterns.", false, "Growth and shifting rainfall alter future peaks, so the design looks ahead."],
    // General knowledge (communication and public trust)
    ["h", "A communication plan for construction sets out expected noise, truck traffic and odour periods and gives neighbours a contact for concerns.", true, "Advance notice and a named contact lower surprise and keep concerns from building."],
    ["h", "Records of what was said, to whom and when support consistent messages and a later review of how an upset was handled.", true, "Records show whether commitments were kept and help the next response."],
    ["m", "Saying little during an upset protects public trust because each statement adds liability.", false, "Silence invites rumour, while prompt factual updates show control."]
  ],
  boards: [
    // General knowledge (security risk management)
    { d: "h", prompt: "Match each security management tool to its purpose.", pairs: [["Risk register", "Tracks threats, ratings, controls and owners"], ["Tabletop exercise", "Talks a scenario through to test roles and decisions"], ["Network segmentation", "Keeps a compromise in one zone from reaching the others"], ["Vulnerability assessment", "Finds weak points in assets and defences"], ["After-action review", "Turns lessons from a drill or event into actions"], ["Access review", "Removes accounts and keys that are no longer needed"]] },
    // General knowledge (dissolved air flotation performance management)
    { d: "h", prompt: "Match each flotation management term to what it describes.", pairs: [["Recycle ratio", "Share of clarified flow returned to supply the air"], ["Air-to-solids ratio", "Compares the air supplied with the solids load"], ["Jar test", "Selects the chemical and dose that give strong floc"], ["Float solids", "Dryness of the skimmed layer"], ["Saturator pressure", "Sets how much air dissolves in the recycle water"], ["Surface loading", "Feed flow per unit of tank area"]] }
  ],
  oddSets: [],
  sequences: [],
  relations: [
    // General knowledge (security risk management)
    ["m", "Findings from each drill are tracked to completion with owners and dates.", "the repeat of the same weakness in later drills", "decrease", "Closed actions mean the same gap is not found again."],
    ["h", "A vendor keeps open remote access to the control network through shared credentials.", "the exposure of the process to outside intrusion", "increase", "An open, shared path is easy to misuse and hard to trace."],
    ["h", "The risk assessment is not updated after a new chemical storage area is built.", "the chance that the new area's risk goes unmanaged", "increase", "Risks that are not assessed are not given controls."],
    // General knowledge (dissolved air flotation performance management)
    ["m", "Recycle ratio is raised well past the optimum.", "turbulence and solids carry-over in the effluent", "increase", "Extra flow disturbs floc and carries it out of the tank."],
    ["h", "Air supply is raised in step with a rise in feed solids to hold the air-to-solids ratio.", "the chance of poor float capture", "decrease", "Each kilogram of solids still gets enough air to be lifted."],
    ["h", "Chemical dose is trended against feed quality and reset at each jar test.", "the chemical wasted through overdosing", "decrease", "The dose follows the real need instead of a fixed habit."],
    // General knowledge (equalization and wet-weather operation as a plant strategy)
    ["h", "The return rate from storage is tied to measured process capacity.", "the chance that stored flow upsets the plant", "decrease", "Release stays within what the downstream units can treat."],
    ["m", "Basin mixing and cleaning are dropped from the maintenance plan to save budget.", "the odour complaints and the loss of storage volume", "increase", "Settled solids turn septic and take up storage."],
    // General knowledge (communication and public trust)
    ["m", "Neighbours are told in advance about planned odorous work and given a contact.", "the share of residents surprised by the work", "decrease", "Advance notice replaces surprise with expectation."],
    ["h", "Communication records are kept with dates, sources and approved wording.", "the chance of contradictory statements in later events", "decrease", "Staff can see what was said before and keep the message consistent."]
  ],
  flaws: [
    // General knowledge (security risk management)
    { d: "h", prompt: "Which statement about security incident response planning is wrong?", flawed: "Control system recovery steps are left untested", goods: ["The plan names who decides on isolating process systems", "Contact lists for agencies and vendors are kept current", "Exercises test both the physical and the cyber response"], explanation: "Recovery steps that were not tried tend to fail in a real event, so they are exercised." },
    { d: "h", prompt: "Which statement about layered protection is wrong?", flawed: "Each layer is judged alone, not as a system", goods: ["The weakest layer is looked for along with the strongest", "Detection is matched with a response that arrives in time", "Critical assets get more layers than low-value ones"], explanation: "Layers work as a system, so gaps between them are as important as the strength of each." },
    // General knowledge (dissolved air flotation performance management)
    { d: "h", prompt: "Which statement about optimizing a flotation unit is wrong?", flawed: "Several settings are changed at once to save time", goods: ["One change is made and its effect is watched before the next", "Results are compared with records of feed quality", "Float solids and effluent quality are both measured"], explanation: "Changing many settings at once hides which one caused the result." },
    { d: "h", prompt: "Which statement about replacing flotation equipment is wrong?", flawed: "Saturator and recycle pump condition is not tracked", goods: ["Pressure and flow trends help decide when to replace", "Spares for long lead items are considered in the plan", "Replacement is compared with repair costs over time"], explanation: "Trends in pressure and flow give warning, so tracking them lets replacement be planned." },
    // General knowledge (equalization and wet-weather operation as a plant strategy)
    { d: "h", prompt: "Which statement about planning wet-weather storage is wrong?", flawed: "Volume is set from average daily flow plus a margin", goods: ["Records of peak flows and loads drive the sizing", "The return strategy empties the basin before the next event", "Level controls and an overflow route protect the basin"], explanation: "Averages hide the storm peaks that storage exists to hold." },
    { d: "m", prompt: "Which statement about odour from storage is wrong?", flawed: "Odour planning begins after neighbours complain", goods: ["Mixing, aeration and cleaning limit septic conditions", "Covers and air treatment are weighed near housing", "Complaint records help adjust the plan"], explanation: "Odour is cheaper to prevent in design than to correct after complaints." },
    // General knowledge (communication and public trust)
    { d: "h", prompt: "Which statement about communicating during an upset is wrong?", flawed: "Updates stop once the plant is back to normal", goods: ["Updates say what is known, what is done and when the next news comes", "Staff and partner agencies hear the same message", "Decisions on who speaks are made ahead of time"], explanation: "A closing update confirms recovery and explains the cause, which completes the story and holds trust." },
    { d: "m", prompt: "Which statement about working with neighbours and agencies is wrong?", flawed: "Contact lists wait for a crisis to be checked", goods: ["Relationships are built before they are needed", "Commitments made to neighbours are tracked and kept", "Concerns raised are recorded with the response given"], explanation: "Lists go stale between events, so they are checked on a schedule and not left to follow a crisis." }
  ]
};
export default data;
