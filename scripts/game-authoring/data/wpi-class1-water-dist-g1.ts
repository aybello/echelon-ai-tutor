// Class 1 Water Distribution, western exam course, gap-fill table g1.
// Fills topics a coverage check found thin: standby power, electrical controls, swabbing, temporary service,
// fire flow, pipe materials, crew safety equipment and maintenance management.
// Entry-level general operator knowledge in original wording. No book text is stored in the repo.
// Every row rests on well-established operator knowledge, so each section is marked "General knowledge".
import type { CourseData } from "../build";
const data: CourseData = {
  courseKey: "wpi-class1-water-dist",
  facts: [
    // General knowledge (generators and engines)
    ["e", "A standby generator keeps a pump station running when the utility power fails.", true, "Pumps and controls stay powered, so pressure and storage are kept up."],
    ["m", "A transfer switch keeps generator power from flowing back out onto the utility lines.", true, "Backfeed would put line crews at risk on lines they believe are dead."],
    ["m", "A standby generator that looks clean and has a full tank does not need test runs.", false, "It is exercised on a schedule, ideally under load, to prove it will start and carry the station."],
    ["m", "Diesel fuel stored for a long time can collect water and sludge that plug the fuel filters.", true, "Old fuel is tested or replaced so the engine does not starve when it is needed."],
    ["h", "Running a diesel generator for long periods at very light load is good for the engine.", false, "Light load leaves unburned fuel and soot in the engine, so exercise runs use a real load where possible."],
    ["e", "Generator exhaust is safe to vent inside a pump station if the door is left open.", false, "Exhaust holds carbon monoxide, so it is piped outdoors away from air intakes."],
    // General knowledge (electrical controls and power)
    ["m", "A pressure switch starts a booster pump when system pressure falls to its low set point.", true, "The set points keep the pressure in the wanted range by starting and stopping the pump."],
    ["m", "A tripped overload relay is reset again and again until the pump stays running.", false, "Repeated trips point to a fault such as a jam, a bad bearing or low voltage that has to be found."],
    ["m", "After a motor is locked out, a start attempt at the controls confirms the power is really isolated.", true, "A failed start shows the lockout is holding before anyone touches the equipment."],
    ["e", "A control panel is safe to open with the pump switched off at the stop button.", false, "A stop button does not isolate the supply, so live parts stay inside. Power is locked out first."],
    ["m", "A battery backup keeps control and alarm circuits working for a time after a power failure.", true, "Operators still get alarms and the controls keep their settings."],
    // General knowledge (swabbing and pigging)
    ["e", "A foam swab is a soft cylinder pushed through a main by water pressure to scrub the pipe wall.", true, "The scrubbing action loosens deposits that the flow then carries out."],
    ["m", "Swabs are launched and caught at hydrants or launching fittings, so a long trench is not dug.", true, "Existing hydrants and small access points serve as the entry and exit."],
    ["m", "Swab runs go ahead without checking that the valves along the route are fully open.", false, "A partly closed valve can stop or trap the swab, so the valves are confirmed open first."],
    // General knowledge (temporary service and bypass)
    ["e", "Customers are told in advance when their water will be shut off for a repair.", true, "Notice lets people plan and cuts down on complaints and surprises."],
    ["m", "A temporary drinking water hose is a type made for drinking water and is cleaned and disinfected before use.", true, "Ordinary hose can leave taste, odour and bacteria in the water."],
    ["m", "A temporary connection between a live main and a hose line is made without backflow protection when the hose is short.", false, "Even a short hose can carry contaminated water back toward the main."],
    ["e", "A temporary water hose can lie across a travelled road with no ramp or cover.", false, "Hose crossing a road needs ramps or covers so vehicles do not crush it and drivers stay safe."],
    ["m", "Customers get water again before the repaired section has been flushed clean.", false, "The repaired section is flushed first so dirt and trapped air do not reach customers."],
    // General knowledge (fire flow)
    ["m", "A hydrant flow test shows how much water the system can deliver while keeping a useful pressure.", true, "It checks the flow and pressure the mains can supply for fire protection."],
    ["m", "A hydrant flow test measures the strength of the pipe wall.", false, "The test measures flow and pressure, not the strength of the pipe."],
    ["e", "Hydrant colour coding by flow capacity helps fire crews choose the best hydrant to use.", true, "The colour signals a flow range so crews know what to expect."],
    ["m", "Closing one valve on a looped main raises the flow available at hydrants nearby.", false, "A closed valve can force water to come from one direction, so flow and pressure fall."],
    ["m", "Fire flow needs are one reason mains in built-up areas are sized larger than daily demand alone would call for.", true, "A large short-term flow has to be available during a fire."],
    ["h", "A pitot gauge is held well to the side of a hydrant outlet, away from the stream.", false, "The tip is held in the middle of the stream close to the outlet to read its pressure."],
    // General knowledge (pipe materials)
    ["m", "HDPE pipe is joined by heat fusion, which makes a strong continuous joint.", true, "The fused joint is as strong as the pipe and resists leakage."],
    ["m", "Plastic pipe stored in strong sunlight for long periods can be weakened by ultraviolet light.", true, "Pipe is kept covered or under shade until it is installed."],
    ["m", "Concrete pressure pipe is a common choice for small house service lines.", false, "Concrete pipe is used for large-diameter mains, not small services."],
    ["m", "Lead pipe is soft and scratches to a shiny silver surface.", true, "This softness helps crews tell lead services from other old pipe."],
    ["m", "Steel pipe resists corrosion without a coating or lining.", false, "Steel rusts, so it needs coatings, linings or cathodic protection."],
    ["e", "Ductile iron pipe is joined by heat fusion.", false, "Fusion is used for HDPE. Ductile iron uses push-on, mechanical or flanged joints."],
    // General knowledge (safety equipment for distribution crews)
    ["m", "A gas monitor is tested to confirm it responds before it is taken into a chamber or trench.", true, "A monitor that does not work gives false comfort."],
    ["m", "A tripod with a winch lets a worker be lifted out of a deep chamber without a rescuer going in.", true, "Retrieval from outside avoids a second person entering a bad atmosphere."],
    ["m", "A trench box is a rigid shield that protects workers inside it if the walls give way.", true, "The box takes the load of the soil instead of the workers."],
    ["e", "A first aid kit is stocked once and left in the truck without checks.", false, "Kits are checked and restocked so supplies are fit for use."],
    ["m", "Hearing protection is put on once the noise starts to hurt.", false, "Damage builds up before pain, so protection goes on before noisy work starts."],
    // General knowledge (maintenance management)
    ["m", "A work order records what job was done, who did it and what was found.", true, "The record shows the history of the equipment."],
    ["m", "A work order is closed when the job is assigned, before the work is done.", false, "It is closed after the work is complete and the findings are recorded."],
    ["m", "Valve and hydrant records are discarded once the work is finished.", false, "The records show condition and repair history and tell when the next visit is due."],
    ["m", "A maintenance schedule shows which valves and hydrants are due for attention.", true, "A schedule keeps routine work from being missed."],
    ["e", "Preventive maintenance starts once a piece of equipment has broken down.", false, "Preventive work is done on a schedule before failure. Fixing a breakdown is corrective work."]
  ],
  boards: [
    // General knowledge (electrical controls)
    { d: "m", prompt: "Match each control or power device to its job.", pairs: [["Motor starter", "Switches power to the motor on and off"], ["Float switch", "Starts or stops a pump from the water level"], ["Pressure switch", "Starts or stops a pump from system pressure"], ["Overload relay", "Opens the starter when the motor draws too much current"], ["Transformer", "Steps the supply voltage up or down"], ["Battery backup", "Keeps controls and alarms alive in a power failure"]] },
    // General knowledge (swabbing)
    { d: "m", prompt: "Match each swabbing term to its meaning.", pairs: [["Foam swab", "Soft cylinder that scrubs the pipe wall"], ["Poly pig", "Firmer cylinder used where deposits are harder"], ["Launch point", "Where the swab enters the main"], ["Receiving point", "Where the swab is caught"], ["Flushing", "Fast water flow with no cylinder in the pipe"], ["Drive water", "Flow that pushes the swab along the pipe"]] },
    // General knowledge (fire flow)
    { d: "m", prompt: "Match each feature to how it helps fire flow.", pairs: [["Hydrant colour code", "Signals the flow range to crews"], ["Flow test", "Shows what the system can deliver"], ["Looped main", "Lets water reach a hydrant from two sides"], ["Larger pipe", "Lowers friction loss at high flow"], ["Elevated storage", "Adds reserve water when demand peaks"], ["Valve checks", "Find valves left closed that would cut the flow"]] },
    // General knowledge (pipe materials)
    { d: "h", prompt: "Match each pipe material to a weakness.", pairs: [["Cast iron", "Brittle and cracks under shock"], ["Steel", "Rusts without coating or protection"], ["PVC", "Weakened by long sunlight exposure"], ["Concrete pressure pipe", "Heavy and awkward to handle"], ["HDPE", "Joints need fusion equipment and a trained crew"], ["Lead", "Dissolves into drinking water"]] },
    // General knowledge (crew safety equipment)
    { d: "e", prompt: "Match each crew safety item to its purpose.", pairs: [["Gas monitor", "Warns of low oxygen or harmful gas"], ["Tripod and winch", "Lifts a worker out of a deep chamber"], ["Trench box", "Shields workers if the trench wall fails"], ["Traffic cones and signs", "Guide drivers around the work area"], ["Safety glasses", "Protect eyes from flying debris"], ["First aid kit", "Supplies for treating minor injuries on site"]] }
  ],
  oddSets: [
    // General knowledge (standby generator set-up)
    { d: "m", rule: "a part of a standby generator set-up", members: ["Transfer switch", "Fuel filter", "Starting battery", "Engine coolant", "Exhaust pipe", "Battery charger"], intruders: ["Hydrant", "Gate key", "Curb box", "Tap saddle"], why: "{odd} belongs to the water system, not to the generator set-up.", max: 5 },
    // General knowledge (pipe materials)
    { d: "m", rule: "a metal pipe material", members: ["Ductile iron", "Cast iron", "Steel pipe", "Copper tube", "Galvanized steel"], intruders: ["PVC", "HDPE", "PEX"], why: "{odd} is a plastic pipe, not a metal one.", max: 5 }
  ],
  sequences: [
    // General knowledge (restoring service after a repair)
    { d: "m", process: "returning a main to use after a repair", steps: ["Close the valves around the break", "Cut out and replace the damaged pipe", "Refill the section slowly with air let out", "Flush the section until the water runs clear", "Return the section to normal service and tell customers"], why: "The break is isolated and repaired, the section is refilled slowly and flushed, then service is restored.", max: 6 },
    // General knowledge (work order tracking)
    { d: "m", process: "a tracked maintenance job", steps: ["Identify the need and open a work order", "Plan the job and assign a crew", "Carry out the work", "Record what was done and found", "Close the work order and update the asset history"], why: "The job is opened, planned, done and recorded, and last of all closed with the history updated.", max: 6 }
  ],
  relations: [
    // General knowledge (generators, electrical controls)
    ["m", "A transfer switch fails to shift to the generator during a power outage.", "the time the pump station stays without power", "increase", "Without the switch shifting, generator power does not reach the station."],
    ["m", "A standby generator is exercised on a regular schedule.", "the chance that it fails to start in a real outage", "decrease", "Routine runs find weak batteries and stale fuel early."],
    ["m", "A pump impeller jams and the motor is overloaded.", "the chance that the overload relay trips", "increase", "Heavy current draw is what the relay senses."],
    ["e", "A battery backup is installed on a station alarm panel.", "the chance of losing alarm signals during a power failure", "decrease", "The batteries keep the alarm circuits powered."],
    // General knowledge (swabbing, temporary service)
    ["m", "The valves along a swab route are checked and fully opened first.", "the chance that the swab gets stuck at a valve", "decrease", "An open valve leaves a clear path for the swab."],
    ["m", "A temporary hose supply is joined to a main without a backflow preventer.", "the chance of contaminated water entering the main", "increase", "Without a barrier, water can flow backward from the hose."],
    ["e", "Customers are notified well ahead of a planned shutdown.", "the number of surprised complaints on the day", "decrease", "Advance notice lets people prepare."],
    // General knowledge (fire flow)
    ["m", "A valve on a looped main near a hydrant is left closed after repairs.", "the flow available at that hydrant", "decrease", "Water has to arrive by a longer path, so friction loss rises."],
    ["m", "A hydrant is opened wide for a flow test.", "the pressure at a nearby hydrant that is not flowing", "decrease", "The flowing hydrant draws water and pressure from the same mains."],
    // General knowledge (pipe materials)
    ["m", "Steel pipe is buried in corrosive soil with no coating or cathodic protection.", "the rate of external corrosion", "increase", "Bare steel in damp, corrosive soil rusts quickly."],
    ["e", "HDPE pipe is used in place of iron in soil that attacks metal.", "the chance of the pipe wall rusting", "decrease", "Plastic does not rust."],
    // General knowledge (safety, maintenance)
    ["m", "A gas monitor is left in the truck while a worker enters a valve vault.", "the chance that a hazardous atmosphere goes unnoticed", "increase", "Without the monitor, low oxygen or harmful gas gives no warning."],
    ["m", "Valve exercising results are recorded along with each valve's condition.", "the ability to spot valves that are getting worse", "increase", "Comparing records over time shows a valve slowly wearing out."]
  ],
  flaws: [
    // General knowledge (generators)
    { d: "m", prompt: "Which statement about standby generators is wrong?", flawed: "Fuel is left to run low between outages", goods: ["The fuel level is checked on a regular schedule", "The starting battery charge is checked on routine visits", "Exercise runs are recorded in a log for the station"], explanation: "Fuel is kept topped up so the generator can run for the whole outage." },
    // General knowledge (electrical controls)
    { d: "e", prompt: "Which statement about working on pump controls is wrong?", flawed: "Pressing the stop button makes the panel safe", goods: ["A lockout holds the power off while the work goes on", "Each worker places a personal lock on the disconnect", "A start test confirms the power is really off first"], explanation: "A stop button leaves live parts in the panel. Power is locked out before the panel is opened." },
    { d: "m", prompt: "Which statement about a pump that will not start is wrong?", flawed: "The motor is replaced before checking the power", goods: ["Power at the disconnect and the fuses is checked first", "The overload relay and breaker status are checked", "Switch settings and alarms at the panel are read"], explanation: "Simple causes such as a tripped breaker, a blown fuse or a switch setting are checked before parts are replaced." },
    // General knowledge (swabbing)
    { d: "m", prompt: "Which statement about swabbing is wrong?", flawed: "A swab moves along with the water shut off", goods: ["Water pressure behind the swab pushes it along the main", "The swab is caught at a planned receiving point", "Dirty water is flushed out of the main after the run"], explanation: "The swab is driven by flowing water, so there has to be flow behind it." },
    // General knowledge (temporary service)
    { d: "m", prompt: "Which statement about a temporary supply during a main repair is wrong?", flawed: "An old garden hose is fine for the supply", goods: ["Hose and fittings are approved for drinking water", "A backflow preventer protects the main at the connection", "Hose is covered or ramped where traffic crosses it"], explanation: "Hose for drinking water is a suitable type and is cleaned first, so water quality is protected." },
    // General knowledge (fire flow)
    { d: "m", prompt: "Which statement about fire flow is wrong?", flawed: "Fire flow needs are ignored when mains are sized", goods: ["Flow test results help check if a system can meet fire needs", "A closed valve can cut the flow available at a hydrant", "Hydrant colour codes hint at the flow a hydrant can give"], explanation: "Fire flow needs are a main reason mains are sized as large as they are." },
    // General knowledge (pipe materials)
    { d: "e", prompt: "Which statement about plastic pipe is wrong?", flawed: "Sunlight makes plastic pipe stronger", goods: ["Plastic pipe is much lighter than iron pipe", "Plastic pipe does not rust the way iron does", "HDPE pipe sections are joined by heat fusion"], explanation: "Long sunlight exposure can weaken some plastic pipe, so stored pipe is kept covered." },
    { d: "m", prompt: "Which statement about iron pipe is wrong?", flawed: "Cast iron mains bend freely without cracking", goods: ["Cast iron is brittle and can crack under shock loads", "Ductile iron is tougher than older cast iron", "Old cast iron mains often have rough, scaled interiors"], explanation: "Cast iron is brittle. Ductile iron is the tougher, more flexible type." },
    // General knowledge (safety equipment)
    { d: "m", prompt: "Which statement about protective equipment for crews is wrong?", flawed: "A harness is worn loose for comfort", goods: ["A harness is fitted snugly before entry into a vault", "Eye protection is worn when cutting or grinding pipe", "Cones and signs are set up before work starts in the road"], explanation: "A loose harness can slip or fail to hold a worker in a fall or a rescue." },
    // General knowledge (maintenance records)
    { d: "m", prompt: "Which statement about maintenance records is wrong?", flawed: "Records are updated once a year from memory", goods: ["Work orders are completed when the job is done", "Hydrant records list repairs and inspection dates", "Records help plan replacements and budgets"], explanation: "Records are kept up to date as the work is done, so they are accurate and useful." }
  ]
};
export default data;
