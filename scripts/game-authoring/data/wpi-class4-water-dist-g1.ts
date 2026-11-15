// Class 4 Water Distribution, western exam course, gap-fill table g1.
// Fills topics a coverage check found thin: electrical and standby power resilience, maintenance management programs,
// temporary service and bypass planning, swabbing and cleaning program planning, and cold weather planning.
// Judgement and management content for the person in charge of a large or complex system, in original wording.
// Metric units, no regulation numbers, no jurisdiction-specific values, and wording that stays general because practice varies.
// Every row rests on well-established operator and management knowledge, so each section is marked "General knowledge".
import type { CourseData } from "../build";
const data: CourseData = {
  courseKey: "wpi-class4-water-dist",
  facts: [
    // General knowledge (electrical and standby power resilience)
    ["h", "A critical load list names the pumps, controls and instruments that have to run in an outage, and it is revised as the system changes.", true, "A list that is out of date sends generator capacity to the wrong loads when it is needed."],
    ["h", "A generator chosen from the total of the motor running ratings will start the large motors without trouble.", false, "Motors draw several times their running current at start, so sizing looks at starting loads and the start order."],
    ["h", "Loss of telemetry in an outage is planned for with local controls and manual procedures that keep key sites safe to run.", true, "Operators lose their view of remote sites, so each site has to be run safely without it."],
    ["h", "A transfer switch that worked at commissioning needs no further live transfer tests.", false, "Contacts, settings and controls change over time, and a live transfer proves the whole chain still works."],
    ["h", "Runtime on stored fuel is worked out from the actual station load and not from the generator rating.", true, "A generator at partial load burns less fuel, and a heavy load shortens the time a tank lasts."],
    // General knowledge (maintenance management programs)
    ["h", "A valve program is designed around which valves isolate critical areas, so those are exercised and mapped first.", true, "A failed valve costs the most where it controls supply to hospitals, trunk mains or large zones."],
    ["h", "Hydrant inspections are planned at one interval for the whole system whatever a hydrant's condition or location.", false, "Frequency is set by risk, age and past findings, so problem hydrants and key locations get more attention."],
    ["h", "A planned-to-reactive work ratio that moves toward more reactive work warns that preventive effort is falling behind.", true, "A growing share of breakdown jobs shows that failures are arriving faster than planned work prevents them."],
    ["h", "Meeting the preventive maintenance schedule proves that the program targets the right equipment.", false, "Schedule compliance shows that tasks were done, not whether the tasks suit how the equipment fails."],
    ["h", "Contractor work is checked against written specifications and recorded in the asset history.", true, "The utility keeps its own record of the work, so the history stays complete whoever did the job."],
    // General knowledge (temporary service and bypass planning)
    ["h", "Planning a large shutdown starts by finding who loses supply and which customers can be served from another direction.", true, "The plan builds on who is affected and which parts of the network can carry water around the work."],
    ["h", "A temporary supply line is sized from the average daily demand of the customers it serves.", false, "Peak demand and any fire need set the size, because the line has to carry them as well."],
    ["h", "Water quality risk in a long bypass grows with the time water spends in the temporary line.", true, "Residual fades and water warms in standing hose, so residual and temperature are watched."],
    ["m", "Contact with critical users such as hospitals can wait until the day of a shutdown.", false, "Critical users need time to arrange alternate supply, so they are contacted well ahead."],
    // General knowledge (swabbing and cleaning program planning)
    ["h", "A cleaning program matches the method to the problem, using flushing for loose sediment and swabbing or pigging for firmer deposits.", true, "Each method suits a type of deposit, and renewal is the answer where the pipe itself has failed."],
    ["h", "Chlorinated flush water from a cleaning program can go straight to a stream since it is clean drinking water.", false, "Chlorine harms fish and other aquatic life, so flush water is dechlorinated or otherwise controlled first."],
    ["h", "Results of a cleaning program are tracked by comparing complaints, turbidity and residual before and after the work.", true, "Without before and after readings, nobody can show whether the work paid off."],
    // General knowledge (cold weather planning)
    ["m", "Freeze-ups cluster where cover over the pipe is reduced, such as after road regrading.", true, "Less soil over a service lets frost reach the pipe sooner."],
    ["m", "Thaw response is planned after the first freeze-up of the winter, when the first call arrives.", false, "Crews, equipment and priorities are ready before the cold arrives, because calls come in quickly in a hard freeze."],
    ["h", "Frost depth is the same under pavement, bare ground and snow-covered lawns.", false, "Snow, soil type, moisture and surface cover change how deep frost reaches."]
  ],
  boards: [
    // General knowledge (electrical and standby power resilience)
    { d: "h", prompt: "Match each outage planning item to the weakness it addresses.", pairs: [["Critical load list", "Non-essential loads overloading the generator"], ["Live transfer test", "Switch or control faults found only in a real outage"], ["Fuel supply agreement", "Running dry in a long outage"], ["Manual operating procedures", "Loss of telemetry and remote control"], ["Staged restart settings", "Large voltage dip when motors start together"], ["Portable generator hookup", "A station with no permanent standby unit"]] },
    // General knowledge (maintenance management programs)
    { d: "h", prompt: "Match each maintenance program decision to the information that supports it.", pairs: [["Replace a pump instead of repairing it", "Repair cost history compared with replacement cost"], ["Shorten a service interval", "Repeated failures between services"], ["Raise a spare to critical stock", "Long lead time and high consequence of failure"], ["Add a valve to the exercise list", "Records showing it isolates a critical area"], ["Drop a task from the schedule", "Evidence that it finds no problems and has low consequence"], ["Choose a contractor for repeat work", "Quality and cost record of past jobs"]] },
    // General knowledge (swabbing and cleaning program planning)
    { d: "h", prompt: "Match each cleaning program concern to the planning response.", pairs: [["Chlorinated flush water", "Dechlorination before discharge"], ["Sediment in flush water", "Settling or filtering before it reaches a stream"], ["Low pressure during the run", "Work in lower demand and watch zone pressure"], ["Colour complaints", "Notice to customers on the route"], ["A swab lodging in the main", "Valve and pipe condition checks beforehand"], ["No way to show results", "Baseline and follow-up readings"]] }
  ],
  oddSets: [
    // General knowledge (maintenance management programs)
    { d: "h", rule: "an item in a valve program record", members: ["Valve location", "Valve size and type", "Turns to close", "Last exercise date", "Condition notes", "Direction to open"], intruders: ["Meter size", "Pump hours", "Hydrant flow", "Tank level"], why: "{odd} belongs to another asset record, not to the valve record.", max: 5 }
  ],
  sequences: [],
  relations: [
    // General knowledge (electrical and standby power resilience)
    ["h", "The critical load list is not updated after a station adds a large pump.", "the chance that the generator is overloaded in an outage", "increase", "The new load is missing from the list, so it is not planned for in the load order."],
    ["h", "Staged restart steps are set for a station with several large motors on a generator.", "the voltage dip during motor starting", "decrease", "Motors start one at a time, so the starting current is spread out."],
    ["h", "Telemetry radios at remote sites get a battery supply that outlasts the expected outage.", "the time operators lose sight of remote sites", "decrease", "The radios keep sending data after the site power is lost."],
    // General knowledge (maintenance management programs)
    ["h", "Hydrant inspection intervals are shortened for hydrants with repeat failures and lengthened for those with clean records.", "the share of effort spent on hydrants that rarely fail", "decrease", "Effort moves toward the hydrants that show problems."],
    ["h", "Contractors are not required to return work records to the utility.", "the completeness of the asset history", "decrease", "Repairs and findings by the contractor never reach the record."],
    // General knowledge (temporary service and bypass planning)
    ["h", "A temporary bypass is sized for peak demand instead of average demand.", "the chance of low pressure complaints on the bypass", "decrease", "The line can carry the busiest hours without a large pressure drop."],
    ["m", "Critical users such as dialysis units are contacted well before a shutdown.", "the risk of harm to those users", "decrease", "They have time to arrange alternate supply."],
    // General knowledge (swabbing and cleaning program planning)
    ["h", "Customers on the route are told ahead of a cleaning program.", "the number of complaints about discoloured water", "decrease", "People expect the change and know what to do about it."],
    ["h", "A cleaning program starts with no baseline of complaints or turbidity.", "the ability to show whether the work helped", "decrease", "Without a starting point, later readings cannot be compared."],
    // General knowledge (cold weather planning)
    ["h", "Cover over a service is reduced by road regrading.", "the chance that the service freezes in a cold winter", "increase", "Frost reaches the pipe sooner when there is less soil above it."],
    ["m", "Frozen service records are mapped and reviewed each spring.", "the ability to target corrective work at repeat problem areas", "increase", "The map shows where freeze-ups repeat, so work goes where it pays off."]
  ],
  flaws: [
    // General knowledge (electrical and standby power resilience)
    { d: "h", prompt: "Which statement about planning for a long power outage is wrong?", flawed: "Runtime is judged from tank size alone", goods: ["Runtime is found from the real load and the fuel on hand", "Fuel supply arrangements consider road access in a storm", "Priority sites are ranked before an outage happens"], explanation: "A tank only holds fuel, and how long it lasts depends on the load the generator carries." },
    { d: "h", prompt: "Which statement about generator sizing is wrong?", flawed: "Motor starting surges are ignored in sizing", goods: ["Staged starting reduces the size of unit needed", "Soft starters lower the starting current of a large motor", "Load lists show which motors run together"], explanation: "Starting current is several times running current, so it drives the size of the unit needed." },
    // General knowledge (maintenance management programs)
    { d: "h", prompt: "Which statement about designing a valve exercising program is wrong?", flawed: "Side street valves are exercised before trunk valves", goods: ["Valves that control large areas are ranked high", "Valves that fail to close are flagged for repair or replacement", "Results are recorded so that trends can be seen"], explanation: "Valves that isolate critical areas matter most, so they are ranked first." },
    { d: "h", prompt: "Which statement about maintenance performance indicators is wrong?", flawed: "One indicator is enough to judge the program", goods: ["Several indicators are read together for a fuller picture", "Targets reflect the criticality of the assets", "Trends matter as much as single readings"], explanation: "A single measure can hide problems, so indicators are read together." },
    { d: "h", prompt: "Which statement about work order records is wrong?", flawed: "Failure cause is left blank to speed closing", goods: ["Failure cause fields allow trends to be analysed", "Labour, parts and downtime are recorded on each order", "Closed orders update the asset record"], explanation: "Without a cause on the record, repeat failures cannot be spotted or fixed at the source." },
    // General knowledge (temporary service and bypass planning)
    { d: "h", prompt: "Which statement about planning a large shutdown is wrong?", flawed: "Valves are assumed to hold without testing", goods: ["Valves are tested before the date so isolation is certain", "Critical users are contacted ahead of time", "A plan is set for restoring service if the work runs long"], explanation: "A valve that does not hold leaves the section live, so isolation is proven before the work." },
    { d: "h", prompt: "Which statement about a temporary supply for a large area is wrong?", flawed: "Residual is checked at the connection and not at the far end", goods: ["Backflow protection is installed at each connection", "Water is sampled before the supply is put into use", "Hose and fittings are approved for drinking water and cleaned"], explanation: "Residual fades along the line, so the far end shows what customers actually receive." },
    // General knowledge (swabbing and cleaning program planning)
    { d: "h", prompt: "Which statement about planning a swabbing program is wrong?", flawed: "Disposal of flush water is decided during the run", goods: ["Disposal is planned before the work begins", "Routes are chosen using valve and pipe condition records", "Customers on the route are notified in advance"], explanation: "Flush water has to go somewhere safe, so the discharge is planned before the run starts." },
    { d: "h", prompt: "Which statement about judging a main cleaning program is wrong?", flawed: "Success is judged by volume flushed", goods: ["Before and after turbidity readings are compared", "Complaint counts are tracked on the cleaned routes", "Results help decide which routes come next"], explanation: "A large volume of water shows effort, not results, so quality readings and complaints are used." },
    // General knowledge (cold weather planning)
    { d: "h", prompt: "Which statement about cold weather planning is wrong?", flawed: "Thaw equipment is checked once the first call arrives", goods: ["Thaw equipment and crew training are checked before winter", "A priority list puts hospitals and care homes first", "Customers are given freeze prevention advice early"], explanation: "Equipment and crews are ready before the cold arrives, since calls come quickly in a hard freeze." },
    { d: "h", prompt: "Which statement about service design for freezing is wrong?", flawed: "Service depth is set without regard to local frost", goods: ["Cover is chosen to suit local frost conditions", "Insulation is used where cover is too shallow to be deepened", "Records show where services have frozen before"], explanation: "Frost conditions differ from place to place, so depth and protection are matched to the local risk." }
  ]
};
export default data;
