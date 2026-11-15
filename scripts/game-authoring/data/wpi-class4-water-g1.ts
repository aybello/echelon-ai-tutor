// Class 4 Water Treatment, western exam course, gap-fill table g1.
// Fills topics a coverage check found thin: blower selection and replacement planning, dechlorination and
// discharge management, plant security and risk, standby power and engines, maintenance management,
// cross-connection control program management, and cathodic protection.
// Judgement and management content for the person in charge of a large or complex plant, in original wording.
// Metric units, no regulation numbers and no jurisdiction-specific values. Each row rests on well-established
// operator and management knowledge, so each section is marked "General knowledge".
import type { CourseData } from "../build";
const data: CourseData = {
  courseKey: "wpi-class4-water",
  facts: [
    // General knowledge (blowers and compressors)
    ["h", "Over the life of a blower, energy cost often outweighs the purchase price, so efficiency belongs in the selection decision.", true, "A blower runs for many hours each year, so small efficiency gains repay a higher price."],
    ["h", "Several smaller blowers staged to follow demand can use less energy than one large blower throttled to the same output.", true, "Staging keeps each running machine close to its efficient operating point."],
    ["h", "A blower sized for peak demand will run efficiently at the lower demands seen most of the year.", false, "Most blowers lose efficiency far from their design point, so turndown has to be planned into the selection."],
    ["h", "A steady rise in blower vibration is best left until the next scheduled overhaul.", false, "A rising trend warns of bearing or alignment trouble, so the repair is planned before it becomes a failure."],
    // General knowledge (dechlorination and discharge management)
    ["h", "Moving from a gas to a liquid dechlorination chemical changes the hazard profile rather than removing it.", true, "Gas calls for leak detection and emergency response, while liquid shifts the risk to storage, spills and handling."],
    ["h", "A dechlorination control strategy often pairs flow pacing with feedback from a residual analyzer after the feed point.", true, "Pacing follows the load and feedback trims the dose to the measured result."],
    ["h", "Overfeeding dechlorination chemical is the lower-risk error because the excess has no effect on the stream.", false, "Excess sulfite-based chemical draws down dissolved oxygen, so overdose is a risk of its own."],
    ["h", "Once chlorine is removed, the flow rate and solids content of backwash water no longer matter to a receiving stream.", false, "A surge of flow or solids can scour and smother a stream even when the water is free of chlorine."],
    // General knowledge (plant security and risk)
    ["h", "A security risk assessment ranks threats by their likelihood and by their consequence to water quality and supply.", true, "Ranking points money and effort at the threats that matter most."],
    ["h", "Layered protection places several barriers in sequence so the failure of one does not open the whole site.", true, "Deterrence, detection, delay and response back each other up."],
    ["h", "Cyber security of control systems is a task for the office computer staff and does not involve plant operations.", false, "Operations staff know the process and the consequences, so they take part in design, response and training."],
    ["h", "Security drills are needed less once an incident response plan has been approved in writing.", false, "A plan that is not practised fails under stress, so drills continue and feed improvements."],
    ["h", "Separating control networks from office networks limits how far a cyber intrusion can spread.", true, "Segmentation keeps a problem in one zone from reaching the process controls."],
    // General knowledge (standby power and engines)
    ["h", "Load shedding schemes drop less critical loads in a planned order so the generator is not overloaded.", true, "A planned order protects the process-critical loads when capacity is limited."],
    ["h", "Fuel management for standby engines includes tracking use, testing stored fuel and planning refills for a long outage.", true, "A long outage drains tanks, so supply and fuel quality are planned ahead."],
    // General knowledge (maintenance management)
    ["h", "Reliability thinking asks what a failure would do and matches the maintenance approach to the way the equipment fails.", true, "Some failure modes suit scheduled work, some suit monitoring and some suit run to failure."],
    ["h", "Condition-based maintenance acts on measured condition rather than the calendar, and it depends on reliable monitoring data.", true, "Poor sensors or missed readings undermine the whole approach."],
    ["h", "Contractor control includes site orientation, lockout coordination and review of the quality of finished work.", true, "Contractors work beside live equipment, so safety and quality are managed in the same way as for staff."],
    ["h", "A maintenance budget set as a fixed share of last year's spending suits the needs of ageing assets.", false, "Asset condition and risk change, so budgets are built from needs and priorities."],
    ["h", "A high count of closed work orders shows that maintenance is effective.", false, "Counts miss quality, backlog and the share of reactive work, so several indicators are read together."],
    ["m", "Asset records are kept current by updating them at replacement, not after repairs and modifications.", false, "Repairs and modifications change condition and configuration, so records are updated with each change."],
    // General knowledge (cross-connection control program management)
    ["h", "A cross-connection program starts by assessing the hazard at each connection and ranking sites by degree of risk.", true, "The assessment decides which protection is needed and where follow-up comes first."],
    ["h", "Program records link each assembly to its location, hazard level, test history and follow-up.", true, "Linked records show gaps, overdue tests and repeat failures."],
    ["h", "A passing test result at installation shows that an assembly will protect for its whole life.", false, "Springs, seats and relief parts wear and foul, so assemblies are retested on a program."],
    ["m", "Customer outreach about backflow rules is best left until an incident shows the need.", false, "Early outreach builds cooperation and prevents the incident, which is far costlier."],
    ["h", "A program works without written authority as long as staff are willing to follow up.", false, "Written authority makes requirements and enforcement steps clear and supports staff in difficult cases."],
    // General knowledge (cathodic protection)
    ["h", "Cathodic protection reduces corrosion of steel tanks and buried pipe by making the protected metal the cathode of the corrosion cell.", true, "A sacrificial anode or an impressed current supplies electrons to the steel instead of letting it give them up."],
    ["h", "Loss of cathodic protection can go unseen until a leak appears, so monitoring is the main defence.", true, "Corrosion damage is hidden underground or under water, so readings give the early warning."],
    ["h", "Coating condition has no bearing on how much protective current a buried pipe needs.", false, "More bare steel means a larger area to protect, so coating condition drives the current needed."],
    ["h", "Cathodic protection readings are filed for compliance and have no value for planning.", false, "Trends in readings show where anodes, coatings or connections are failing and help schedule work."]
  ],
  boards: [
    // General knowledge (dechlorination and discharge management)
    // General knowledge (plant security and risk)
    { d: "h", prompt: "Match each security layer or action to its role.", pairs: [["Deterrence", "Visible signs and lighting that discourage attempts"], ["Detection", "Alarms, cameras and rounds that reveal an intrusion"], ["Delay", "Locks, doors and barriers that slow entry"], ["Response", "Trained staff and agencies acting on an alert"], ["Network segmentation", "Limits the spread of a cyber intrusion"], ["Recovery", "Restoring operations and learning after an event"]] },
    // General knowledge (maintenance management)
    { d: "h", prompt: "Match each maintenance indicator to what it shows.", pairs: [["Planned work ratio", "Share of hours spent on scheduled rather than reactive jobs"], ["Backlog", "Work waiting to be done compared with crew capacity"], ["PM compliance", "Preventive tasks completed by their due date"], ["Mean time between failures", "Average run time between breakdowns of a unit"], ["Maintenance cost per volume treated", "Spending measured against plant output"], ["Equipment availability", "Share of time a unit is ready to run"]] },
    // General knowledge (cross-connection control program management)
    { d: "h", prompt: "Match each cross-connection program element to its purpose.", pairs: [["Hazard assessment", "Rates the degree of hazard at a connection"], ["Tester qualification", "Confirms that people testing assemblies have the skills"], ["Assembly inventory", "List of devices with location and type"], ["Overdue notice", "Prompts the owner to complete a test"], ["Bylaw or policy", "Gives the authority to require protection"], ["Public outreach", "Explains backflow risks and customer duties"]] }
  ],
  oddSets: [
    // General knowledge (maintenance management)
    { d: "h", rule: "a measured condition used in condition-based maintenance", members: ["Vibration level", "Bearing temperature", "Oil analysis", "Motor current", "Thermal image"], intruders: ["Run hours", "Fixed date", "Age"], why: "{odd} is a time or usage basis for preventive work, not a measured condition.", max: 5 }
  ],
  sequences: [],
  relations: [
    // General knowledge (blowers and compressors)
    ["h", "A plant replaces one oversized throttled blower with staged units sized to follow the air demand.", "the energy used per unit of air delivered", "decrease", "Each running unit sits closer to its efficient operating point."],
    ["h", "Blower vibration and efficiency trends are reviewed each year and used to plan replacement.", "the share of blower replacements forced by emergency failure", "decrease", "Trends give warning, so replacement is planned and budgeted ahead of failure."],
    // General knowledge (dechlorination and discharge management)
    ["h", "A residual analyzer with feedback is added to a flow-paced dechlorination feed.", "the chance of both chlorine carry-over and overfeed", "decrease", "Feedback trims the dose when pacing alone drifts from the real need."],
    ["h", "An equalization tank is added to smooth the release of filter backwash water.", "the peak flow reaching the discharge point", "decrease", "The tank holds the surge and releases it at a steadier rate."],
    // General knowledge (plant security and risk)
    ["h", "A layered design adds detection and delay measures ahead of the chemical storage area.", "the time available to respond before an intruder reaches the chemicals", "increase", "Each added layer buys time for a response to arrive."],
    ["h", "Incident response drills are run with operations, management and outside agencies.", "the delay in coordinated action during a real incident", "decrease", "Practice settles roles and contacts before they are needed."],
    ["h", "Remote access to the control system is allowed through shared accounts with no logging.", "the ability to trace who changed a setting after an incident", "decrease", "Shared accounts and missing logs hide who did what."],
    // General knowledge (standby power and engines)
    ["h", "A resilience plan adds a fuel supply contract with priority delivery during a regional emergency.", "the chance of running out of fuel in a prolonged outage", "decrease", "Priority delivery keeps tanks supplied while others compete for fuel."],
    ["h", "Live transfer tests under plant load are added to the exercise program.", "the chance of a hidden fault in the transfer scheme at the next outage", "decrease", "Testing under load exposes weak switches, wiring and controls in advance."],
    // General knowledge (maintenance management)
    ["h", "Criticality ranking directs inspection effort and spares to the highest-consequence assets.", "the average consequence of equipment failures", "decrease", "Effort goes where a failure would hurt most."],
    ["h", "Overdue preventive work orders pile up in the backlog without review.", "the share of maintenance that is reactive", "increase", "Skipped preventive work leads to failures that have to be repaired in a hurry."],
    ["m", "Contractors work near live equipment without orientation or lockout coordination.", "the safety risk to staff and contractors", "increase", "Unfamiliar workers and unclear isolation raise the chance of injury."],
    // General knowledge (cross-connection control program management)
    ["h", "A tracking database flags overdue assembly tests and triggers notices.", "the share of assemblies with overdue test results", "decrease", "Flagged items get follow-up before they pile up."],
    ["h", "New customers are assumed to be low risk without an assessment.", "the chance that a high-hazard connection goes unprotected", "increase", "Without assessment, high-hazard connections are not identified."],
    // General knowledge (cathodic protection)
    ["h", "A rectifier on an impressed current system sits switched off for weeks without notice.", "the corrosion rate of the protected pipe", "increase", "Without protective current the steel corrodes at its natural rate."],
    ["h", "Potential readings are logged on a program and a downward trend triggers inspection.", "the chance that a protection failure goes undetected", "decrease", "Trends show a failing anode, connection or coating early."]
  ],
  flaws: [
    // General knowledge (blowers and compressors)
    { d: "h", prompt: "Which statement about blower redundancy is wrong?", flawed: "Redundancy is judged by blower count", goods: ["Standby capacity is sized to cover the loss of the largest unit where the process needs it", "Shared headers, power feeds and controls are checked for single points of failure", "Standby units are rotated into duty so they stay ready"], explanation: "Counting machines misses shared weak points, so redundancy is judged by what the process needs and what one failure would take out." },
    { d: "h", prompt: "Which statement about replacing blowers is wrong?", flawed: "A cheaper unit saves money despite running cost", goods: ["Life-cycle cost compares purchase, energy and maintenance", "Lead times for large units are built into replacement plans", "Efficiency curves at the real operating points guide selection"], explanation: "Energy and upkeep over the life of a blower usually outweigh a lower purchase price." },
    // General knowledge (dechlorination and discharge management)
    { d: "h", prompt: "Which statement about dechlorination control is wrong?", flawed: "The feed is set at a fixed rate for the year", goods: ["Feed follows the flow and the measured chlorine residual", "Alarms warn of a loss of chemical feed", "Samples are checked downstream of the full mixing point"], explanation: "Load and flow change through the year, so a fixed rate soon over or underfeeds." },
    { d: "h", prompt: "Which statement about handling flush and backwash water is wrong?", flawed: "The plan stays as is when the discharge route changes", goods: ["The plan names the discharge point, the holding step and the dechlorination step", "The plan is tested during real flushing and backwash events", "Results are recorded to support the plan when something changes"], explanation: "A new route brings new receiving-water and flow concerns, so the plan is reviewed." },
    // General knowledge (plant security and risk)
    { d: "h", prompt: "Which statement about a security risk assessment is wrong?", flawed: "The assessment is done at commissioning and filed", goods: ["Reviews follow major changes in the plant or its threats", "Findings feed budget and project priorities", "Cyber and physical risks are assessed together"], explanation: "Threats and the plant both change, so the assessment is revisited and used." },
    { d: "h", prompt: "Which statement about incident response is wrong?", flawed: "Roles are assigned at the time of the incident", goods: ["Roles and decision authority are set in advance", "Drills lead to written improvement actions", "Spokespeople and message approval steps are set out ahead of time"], explanation: "Deciding roles in the middle of an incident wastes time, so they are settled beforehand." },
    // General knowledge (standby power and engines)
    { d: "h", prompt: "Which statement about standby power planning is wrong?", flawed: "Future load growth is left out of the sizing review", goods: ["Load lists are reviewed when equipment is added", "Starting demand of large motors is part of the sizing", "Critical loads are ranked in priority order"], explanation: "Added loads can overload a generator that was sized for the earlier plant." },
    { d: "h", prompt: "Which statement about standby fuel management is wrong?", flawed: "Fuel is trusted if the tank gauge reads full", goods: ["Fuel samples are tested for water and contamination", "Refill triggers are based on use and delivery time", "Fuel turnover is planned so stock stays fresh"], explanation: "A full tank can hold water, growth or sediment, so fuel quality is tested." },
    // General knowledge (maintenance management)
    { d: "h", prompt: "Which statement about maintenance indicators is wrong?", flawed: "One indicator gives the full picture", goods: ["Planned versus reactive work shows how mature the program is", "Backlog trend shows whether the crew keeps pace", "Indicators are reviewed along with their causes"], explanation: "Each indicator hides something, so several are read together with their causes." },
    { d: "h", prompt: "Which statement about replacement planning is wrong?", flawed: "Age alone decides when equipment is replaced", goods: ["Condition, repair history and consequence of failure guide timing", "Replacement costs are compared with continued repair costs", "Capital forecasts are built from asset records"], explanation: "Equipment of the same age can differ widely in condition and consequence, so age is one input among several." },
    { d: "h", prompt: "Which statement about contractor control is wrong?", flawed: "Finished contractor work is accepted unchecked", goods: ["Scope, schedule and acceptance criteria are written into the contract", "Contractors are briefed on site hazards and lockout rules", "Documents from the job are added to the asset records"], explanation: "Checking finished work protects quality and warranty, and the records keep the asset history complete." },
    // General knowledge (cross-connection control program management)
    { d: "h", prompt: "Which statement about running a cross-connection program is wrong?", flawed: "Records are kept by testers, not the program", goods: ["Program records are held centrally and kept current", "Overdue items get follow-up notices and escalation", "Hazard rankings are revisited when customer use changes"], explanation: "The program owns the records, since it needs them to find gaps and take follow-up action." },
    { d: "h", prompt: "Which statement about enforcing backflow protection is wrong?", flawed: "Steps are decided case by case with no policy", goods: ["Steps escalate from notice to formal order in written policy", "Customers are told what is required and by when", "Enforcement decisions are recorded"], explanation: "A written policy keeps enforcement fair and consistent." },
    // General knowledge (cathodic protection)
    { d: "h", prompt: "Which statement about managing cathodic protection is wrong?", flawed: "Very low readings are noted and left for next year", goods: ["Low readings trigger a check of anodes, connections and rectifiers", "Readings are compared with past trends", "Tank interior anodes are inspected during tank inspections"], explanation: "Low readings mean the metal is losing protection now, so the cause is found promptly." },
    { d: "h", prompt: "Which statement about protecting tanks and pipe is wrong?", flawed: "Nearby foreign pipelines have no effect on the system", goods: ["Coatings and cathodic protection are used together on buried steel", "Test points allow readings along the pipeline", "New connections to protected metal are checked for their effect on the system"], explanation: "Nearby buried metal and stray currents can interfere with protection, so interference is checked." }
  ]
};
export default data;
