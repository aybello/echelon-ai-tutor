// Class 3 Water Treatment, western exam course, gap-fill table g1.
// Fills topics a coverage check found thin: maintenance management, cross-connection control at a plant,
// and standby power and engines for plants.
// Plant-wide judgement in original wording, metric units, no regulation numbers and no jurisdiction-specific values.
// Each row rests on well-established operator knowledge, so each section is marked "General knowledge".
import type { CourseData } from "../build";
const data: CourseData = {
  courseKey: "wpi-class3-water",
  facts: [
    // General knowledge (maintenance management)
    ["m", "Criticality ranking puts equipment in order by how badly its failure would hurt treatment, safety or water quality.", true, "The ranking points effort and spare parts at the equipment that matters most."],
    ["h", "A critical duty with a standby unit can rank lower than a single unit with no backup that serves the same job.", true, "Redundancy softens the effect of one failure, so the consequence of losing one unit is smaller."],
    ["h", "A rising trend in bearing vibration can justify moving a repair from the breakdown list to a planned job.", true, "A trend gives warning, so the work is scheduled during a convenient outage."],
    ["m", "Oil analysis can show wear metals and contamination in a gearbox before the unit sounds or feels wrong.", true, "Particles and water in the oil are early signs of internal wear or seal trouble."],
    ["h", "Predictive maintenance replaces parts on a fixed calendar date whatever their condition.", false, "Fixed-date replacement is time-based preventive work. Predictive work follows measured condition."],
    ["m", "Work orders are written for breakdowns but not for routine preventive tasks, since those are simply done.", false, "Orders for routine tasks show that work was done and build the history used for planning."],
    ["h", "Stocking a full set of spares for each piece of equipment is the sound way to protect uptime.", false, "Spares are chosen by criticality, delivery time and cost, so stock stays useful and affordable."],
    ["h", "Lockout coordination matters little once operations has stopped the equipment at the controls.", false, "A stop command does not isolate energy, so maintenance and operations agree on a proper lockout."],
    // General knowledge (cross-connection control)
    ["m", "An air gap is a dependable backflow barrier because no physical link joins the two systems.", true, "Open air between the outlet and the water level leaves no path for reverse flow."],
    ["h", "A chemical feed line that discharges into a pressurized pipe needs backflow protection at the injection point.", true, "Without it, process water can be pushed or drawn back into the chemical line and tank."],
    ["h", "Reduced-pressure assemblies are chosen where a failure would put a health hazard into the water.", true, "They give a higher level of protection than a double-check assembly."],
    ["m", "A hose left lying in a chemical tank or drain while joined to a plant water tap creates a cross-connection.", true, "A pressure drop can pull the tank liquid back into the water supply."],
    ["m", "A double-check assembly gives more protection than an air gap.", false, "An air gap leaves no physical connection, so it is the stronger barrier."],
    ["h", "An interconnection with another water system is safe without backflow protection when both supplies are treated.", false, "Differences in pressure and quality between the systems are why the connection is protected."],
    ["h", "Backflow assemblies are tested at installation and need no further checks.", false, "Springs, seats and relief parts wear or foul, so assemblies are tested on a regular program."],
    // General knowledge (standby power and engines)
    ["h", "Generator size is based on the running loads plus the extra current drawn when large motors start.", true, "Starting current is several times running current, so it sets the size needed."],
    ["h", "Starting large motors one after another with a timed delay lowers the peak demand on a generator.", true, "Staggered starts avoid a single large surge that could stall the engine."],
    ["m", "Load shedding drops less important loads so the generator can carry the process-critical ones.", true, "It keeps the plant running when generator capacity is limited."],
    ["h", "A transfer test done with the generator unloaded shows that the plant will ride through an outage.", false, "Without the real load, weak points in the switch, wiring and engine stay hidden."],
    ["m", "Diesel fuel that looks clear is safe for a long outage without testing.", false, "Water, microbes and sediment are hard to see, so stored fuel is tested and polished."],
    ["h", "Exhaust emissions are not a consideration when planning engine run time.", false, "Run hours and exhaust are tracked, and local air requirements may limit how long an engine runs."]
  ],
  boards: [
    // General knowledge (maintenance management)
    { d: "m", prompt: "Match each maintenance term to its meaning.", pairs: [["Criticality ranking", "Orders equipment by the consequence of its failure"], ["Work order", "Request, plan and record of one job"], ["Equipment history", "Record of past repairs, readings and costs"], ["Lead time", "Delay between ordering a part and receiving it"], ["Reorder point", "Stock level that triggers buying more"], ["Lockout coordination", "Operations and maintenance agree on how to isolate equipment"]] },
    // General knowledge (cross-connection control)
  ],
  oddSets: [
    // General knowledge (maintenance management)
    { d: "m", rule: "a measured condition used in predictive maintenance", members: ["Bearing temperature", "Vibration level", "Oil wear metals", "Motor current", "Thermal imaging"], intruders: ["Calendar date", "Fixed interval"], why: "{odd} is a time basis for preventive work, not a measured condition.", max: 4 }
  ],
  sequences: [],
  relations: [
    // General knowledge (maintenance management)
    ["h", "Bearing vibration on a main pump trends upward and the pump is repaired during a planned outage.", "the chance of an unplanned shutdown of that pump", "decrease", "The wear is dealt with before it turns into a failure."],
    ["m", "Work orders are closed without recording findings or parts used.", "the usefulness of the maintenance history for planning", "decrease", "Missing detail hides repeat problems and real repair costs."],
    ["h", "A critical spare with a long delivery time is dropped from stock to save money.", "the downtime after a failure of that part", "increase", "The repair waits for the part to be shipped."],
    // General knowledge (cross-connection control)
    ["h", "A hose is left under the liquid in a chemical day tank while joined to a plant water tap and line pressure drops.", "the chance that tank liquid is drawn into the water supply", "increase", "Low pressure in the line can siphon the liquid back through the hose."],
    ["m", "An air gap is built into the water line that fills a polymer mixing tank.", "the chance of tank water flowing back into the supply", "decrease", "Open air between the pipe and the water leaves no path for reverse flow."],
    ["h", "Backflow assembly test results are tracked, and failed assemblies are repaired and retested.", "the chance that a failed device stays in service unnoticed", "decrease", "Testing finds failures, and repair and retesting returns the protection."],
    // General knowledge (standby power and engines)
    ["h", "Several large motors start at the same instant when the generator picks up the plant.", "the peak demand placed on the generator", "increase", "The starting currents add together in one surge."],
    ["h", "A plant adds routine testing and polishing of its stored standby diesel.", "the chance of a fuel-related shutdown during a long outage", "decrease", "Water and sediment are found and removed before they plug filters."]
  ],
  flaws: [
    // General knowledge (maintenance management)
    { d: "h", prompt: "Which statement about preventive and predictive maintenance is wrong?", flawed: "Predictive work waits for a failure to start", goods: ["Preventive tasks follow a set time or run-hour schedule", "Predictive work follows a measured condition such as vibration", "Corrective work follows a failure or a found defect"], explanation: "Predictive work uses condition data to act before failure." },
    { d: "h", prompt: "Which statement about criticality ranking is wrong?", flawed: "Ranking is set once and left unchanged", goods: ["Rankings are reviewed when the plant or its process changes", "Higher ranked equipment gets earlier and closer attention", "Backup units and bypasses are weighed in the ranking"], explanation: "Plants change, so rankings are revisited to stay accurate." },
    { d: "m", prompt: "Which statement about maintenance records is wrong?", flawed: "Repeat failures are fixed with no record review", goods: ["Repeated failures on one unit are flagged for a root cause check", "Trends in repair cost help decide whether to repair or replace", "Parts used and labour hours are recorded on closed orders"], explanation: "Records are how repeat failures and costly equipment are found." },
    // General knowledge (cross-connection control)
    { d: "m", prompt: "Which statement about air gaps is wrong?", flawed: "The fill pipe dips into the tank water", goods: ["The fill pipe ends above the tank overflow level", "An air gap has open air between pipe and water", "Added pipe extensions are checked on rounds"], explanation: "A pipe that dips into the water removes the air gap and gives backflow a path." },
    { d: "h", prompt: "Which statement about backflow assemblies is wrong?", flawed: "A bypass around an assembly is left unprotected", goods: ["Assemblies are installed where they can be reached for testing", "Test results are kept and failures are repaired promptly", "Assembly type is matched to the degree of hazard"], explanation: "An unprotected bypass defeats the assembly by giving backflow a way around it." },
    { d: "h", prompt: "Which statement about plant interconnections is wrong?", flawed: "A closed valve alone separates two systems", goods: ["Interconnections get backflow protection at the connection", "Pressure and quality differences between sources are weighed", "Emergency connections are checked when not in use"], explanation: "A valve can leak or be opened by mistake, so the connection is protected against reverse flow." },
    // General knowledge (standby power and engines)
    { d: "h", prompt: "Which statement about sizing a standby generator is wrong?", flawed: "Motor starting current is left out of sizing", goods: ["Loads are ranked to decide what stays on during an outage", "Altitude and temperature can reduce engine output", "The size is checked against the loads the transfer scheme carries"], explanation: "Starting current is a main driver of the size needed, so it is counted." },
    { d: "h", prompt: "Which statement about running and testing plant engines is wrong?", flawed: "Light-load runs prove the unit can carry the plant", goods: ["Run time and fuel use are logged to plan refuelling", "Exhaust and cooling paths are checked during the run", "Transfer tests include the switch and plant loads"], explanation: "Proof of capacity needs a real load, since light runs hide weak points." }
  ]
};
export default data;
