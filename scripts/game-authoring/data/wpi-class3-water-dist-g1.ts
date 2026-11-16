// Class 3 Water Distribution, western exam course, gap-fill table g1.
// Fills topics a coverage check found thin at Class 3: standby generators, electrical controls, swabbing, temporary service,
// maintenance management, safety equipment, fire flow testing, thawing and disinfecting new mains.
// Written for the operator who runs a medium system and supervises crews: practical judgement with some planning, between the Class 2 and Class 4 tables.
// Original wording. Metric units, no regulation numbers, no jurisdiction-specific values, and wording that stays general because practice varies.
// Every row rests on well-established operator knowledge, so each section is marked "General knowledge".
import type { CourseData } from "../build";
const data: CourseData = {
  courseKey: "wpi-class3-water-dist",
  facts: [
    // General knowledge (standby generators and engines)
    ["m", "A standby generator is exercised under load on a schedule, and not just run with no load.", true, "Running under load tests the engine, the transfer switch and the fuel system together."],
    ["m", "Engine oil, coolant level and battery charge are checked before a standby generator test run.", true, "Low fluids and a weak battery are common reasons a standby engine fails to start."],
    ["m", "Diesel fuel kept in a standby tank for years holds its quality without testing or turnover.", false, "Fuel ages and collects water and sediment, so it is tested, treated or rotated."],
    ["m", "A portable generator can be wired into a building supply through a normal outlet without isolating the utility.", false, "Backfeed endangers line crews and can wreck the generator, so a transfer switch or approved isolation is used."],
    ["h", "A transfer switch lets the generator and the utility supply feed the building at the same time.", false, "The switch isolates one source before it closes onto the other, which prevents backfeed."],
    // General knowledge (electrical controls and power)
    ["m", "A pump control circuit uses a low voltage signal to start a motor that runs at a higher voltage.", true, "Starters and relays let a small control signal switch the larger motor circuit."],
    ["m", "A motor overload relay keeps a motor running when it draws too much current.", false, "It trips the starter when the current stays above a safe level."],
    ["m", "Resetting a tripped motor starter again and again is a sound way to find out what is wrong.", false, "Repeated starts on a fault add heat and wear to the windings, so the cause of the trip is found first."],
    ["h", "Lockout and tagout is applied before work begins inside a pump's electrical enclosure.", true, "Stored and live energy is isolated so that the circuit cannot start while crews are working."],
    // General knowledge (swabbing and pigging)
    ["m", "Swabbing cleans a main by pushing a soft foam swab through it with the pressure of the water.", true, "The swab scrubs deposits off the pipe wall as the flow carries it along."],
    ["m", "Valves along a swab route are left as found, without checking them first.", false, "A partly closed valve can trap the swab and lead to a dig, so the route is checked."],
    ["h", "Swabbing suits a main with soft deposits and sound pipe, while a badly corroded main is renewed.", true, "Cleaning does not restore pipe that has lost its wall, and scrubbing weak pipe can make it worse."],
    ["m", "Swabbing water is discharged through a hydrant with a diffuser to limit erosion.", true, "The diffuser slows the stream so that it does not cut into the ground."],
    // General knowledge (temporary service and bypass)
    ["m", "Temporary supply hose that crosses a road is ramped or covered so that traffic can pass over it.", true, "Bare hose is crushed by vehicles and is a trip hazard for people on foot."],
    ["m", "Temporary supply hose can be used straight from a storage shed without cleaning.", false, "Stored hose carries dirt and bacteria into the water, so it is cleaned and disinfected first."],
    ["h", "A temporary connection to a customer's building can go without backflow protection.", false, "The temporary line can lose pressure and draw water back from the building."],
    // General knowledge (fire flow)
    ["m", "In a hydrant flow test, the residual pressure is read at the hydrant that is flowing.", false, "A separate nearby hydrant records the residual pressure while the test hydrant flows."],
    ["h", "The fire flow a system should supply is set by the demand a building could place on it in a fire.", true, "Larger and riskier buildings need more water, and the system is checked against that demand."],
    ["m", "Available fire flow stays the same through the day because the system holds one pressure.", false, "Demand changes through the day, so pressure and available flow rise and fall with it."],
    ["h", "A hydrant at the end of a long, small main delivers more flow than one near the source.", false, "Friction losses along the longer path reduce the pressure that is left to push water out."],
    // General knowledge (maintenance management)
    ["m", "A preventive maintenance program waits for equipment to fail before it schedules service.", false, "Planned service happens before failure, which finds wear early and reduces breakdowns."],
    ["h", "Spare parts for critical pumps are held on the shelf when the lead time to replace them is long.", true, "A part that takes months to arrive would otherwise leave the station out of service for a long time."],
    ["m", "Maintenance history on a pump helps decide whether to repair it or replace it.", true, "Repeated failures and rising repair costs point toward replacement."],
    ["m", "A maintenance plan does not need written procedures when the crew is experienced.", false, "Written procedures keep the work consistent from job to job and train new staff."],
    // General knowledge (safety equipment)
    ["m", "A gas monitor is tested by checking that it powers on.", false, "A bump test against a known gas shows that the sensors still respond before crews rely on them."],
    ["m", "A tripod and winch can lift a worker out of a vault without the rescuer having to enter.", true, "Retrieval from outside avoids putting a second person at risk."],
    ["m", "Cones and signs are set out before crews start to dig in a road.", true, "Drivers need warning of the work zone before they reach it."],
    // General knowledge (thawing and frost)
    ["m", "Electric thawing suits metal service pipe but not plastic pipe.", true, "Plastic does not carry the current, and the heat can damage it."],
    ["m", "An open flame torch is a good way to thaw a frozen plastic service.", false, "Flame can melt plastic pipe and start a fire, so safer methods are used."],
    // General knowledge (disinfecting new mains)
    ["m", "A new main is chlorinated first and flushed of dirt afterwards.", false, "Chlorine works poorly where dirt shelters bacteria, so the main is flushed clean first."],
    ["h", "Heavily chlorinated water from disinfecting a main is dechlorinated before it goes to a ditch or stream.", true, "Chlorine harms fish and other aquatic life, so it is removed before release."],
    ["m", "Samples from a new main are taken after the strong chlorine has been flushed out and system water has refilled the main.", true, "Samples then show the quality of the water customers will receive."],
    ["h", "A new main goes into service after sample results meet the limits set by the local authority.", true, "Passing results show the main is clean enough to carry drinking water."]
  ],
  boards: [
    // General knowledge (standby generators and engines)
    { d: "m", prompt: "Match each standby generator part to its job.", pairs: [["Transfer switch", "Connects the load to the generator and isolates the utility"], ["Day tank", "Holds a small fuel supply close to the engine"], ["Battery charger", "Keeps the starting batteries topped up"], ["Exhaust system", "Carries engine fumes to the outside"], ["Governor", "Holds engine speed steady as the load changes"], ["Block heater", "Keeps the engine warm for quick starts"]] },
    // General knowledge (electrical controls and power)
    { d: "m", prompt: "Match each control device to what it does.", pairs: [["Overload relay", "Trips when a motor draws too much current for too long"], ["Float switch", "Starts or stops a pump from a tank level"], ["Pressure switch", "Starts or stops a pump from system pressure"], ["Run-time meter", "Counts the hours a motor has run"], ["Disconnect switch", "Isolates equipment from its power supply"], ["Circuit breaker", "Opens the circuit on a short or a heavy overload"]] },
    // General knowledge (fire flow)
    { d: "m", prompt: "Match each hydrant flow test item to its role.", pairs: [["Static pressure", "The pressure read before any water is flowing"], ["Residual pressure", "The pressure read while water is flowing"], ["Pitot gauge", "Reads the pressure of the flowing stream to find the flow"], ["Flowing hydrant", "Where the water is discharged and measured"], ["Residual hydrant", "Where system pressure is read during the test"], ["Diffuser", "Slows the stream to limit erosion"]] },
    // General knowledge (temporary service and bypass)
    { d: "m", prompt: "Match each temporary supply concern to the action taken.", pairs: [["Hose across a road", "Ramp or cover it for traffic"], ["Connection to a building", "Backflow preventer at the connection"], ["Hose from storage", "Clean and disinfect before use"], ["Long temporary line", "Check the residual at the far end"], ["Customers on the temporary supply", "Notice with the schedule and instructions"], ["Hydrant used as the source", "Check its condition and fit a meter and backflow device"]] },
    // General knowledge (maintenance management)
    { d: "m", prompt: "Match each maintenance record to what it shows.", pairs: [["Work order", "The job requested, carried out and closed"], ["Equipment history", "Repairs and failures over time on one asset"], ["Preventive maintenance schedule", "What service is due and when"], ["Spare parts inventory", "Which replacement parts are on hand"], ["Lubrication log", "When and with what lubricant a machine was serviced"], ["Failure cause code", "Why a repair was needed"]] },
    // General knowledge (thawing and frost)
    { d: "m", prompt: "Match each frost item to its note.", pairs: [["Electric thawing", "Suits metal pipe only"], ["Hot water injection", "Needs a way to control the discharge"], ["Open flame", "Avoided because of fire and pipe damage risk"], ["Thaw priority list", "Hospitals and care homes come first"], ["Frozen service map", "Shows where freeze-ups repeat"], ["Deeper service cover", "Keeps frost away from the pipe by design"]] }
  ],
  oddSets: [
    // General knowledge (standby generators and engines)
    { d: "m", rule: "an item checked before a standby generator test run", members: ["Engine oil level", "Coolant level", "Battery charge", "Fuel level", "Air filter", "Exhaust path clear"], intruders: ["Hydrant paint", "Valve key", "Chlorine residual", "Meter reading"], why: "{odd} is not part of a generator pre-run check.", max: 5 },
    // General knowledge (electrical controls and power)
    { d: "m", rule: "a device that protects a motor circuit", members: ["Overload relay", "Circuit breaker", "Fuse", "Phase monitor", "Ground fault protection"], intruders: ["Pitot gauge", "Foam swab", "Hydrant cap", "Valve key"], why: "{odd} does nothing to protect a motor circuit.", max: 5 },
    // General knowledge (thawing and frost)
    { d: "m", rule: "an item in a thaw crew kit", members: ["Electric thawing unit", "Cable and clamps", "Hot water thaw unit", "Hose", "Insulated gloves", "Warning signs"], intruders: ["Pitot gauge", "Sample bottles", "Foam swab"], why: "{odd} is not a thawing tool.", max: 5 }
  ],
  sequences: [
    // General knowledge (swabbing and pigging)
    { d: "m", process: "swabbing a main", steps: ["Confirm the route, valves and flush water disposal", "Insert the swab at the launch point", "Push the swab through with controlled flow", "Recover the swab at the receiving point", "Flush the line until the water runs clear", "Record the results and check the water quality"], why: "The route and disposal are settled first, the swab is run and recovered, the line is flushed clear, and the results are recorded last.", max: 6 },
    // General knowledge (standby generators and engines)
    { d: "m", process: "a standby generator load test", steps: ["Check fluids, battery and fuel", "Start the engine and let it reach speed", "Transfer the load through the transfer switch", "Run under load and watch the gauges", "Return the load to utility power", "Let the engine cool down, then record the test"], why: "The checks come first, the engine is started before it takes load, the load is returned before shutdown, and the record closes the test.", max: 6 },
    // General knowledge (fire flow)
    { d: "m", process: "a hydrant flow test", steps: ["Record the static pressure at the residual hydrant", "Open the flowing hydrant slowly", "Read the pitot and residual pressures together", "Close the flowing hydrant slowly", "Record the results and work out the flow"], why: "Static pressure is read before water flows, the readings are taken while it flows, and the flow is worked out after the hydrant is closed.", max: 5 }
  ],
  relations: [
    // General knowledge (standby generators and engines)
    ["m", "A standby generator is exercised under load every month.", "the chance it fails to carry load in a real outage", "decrease", "Regular load tests find weak batteries, fuel problems and switch faults early."],
    ["m", "Fuel sits in a standby tank for years without being tested.", "the chance of engine trouble from bad fuel", "increase", "Water and sediment build up in old fuel and can clog filters or stall the engine."],
    // General knowledge (electrical controls and power)
    ["h", "A motor overload relay is set well above the motor's rated current.", "the protection the motor gets from overload", "decrease", "The relay trips late or not at all, so the motor can overheat."],
    ["m", "A pump that tripped on overload is reset again and again with no investigation.", "the chance of motor winding damage", "increase", "Repeated starts on a fault add heat and wear to the windings."],
    // General knowledge (swabbing and pigging)
    ["m", "A swab is sent through a main that has a partly closed valve on the route.", "the chance that the swab lodges in the main", "increase", "A partly closed valve can trap the swab."],
    ["m", "A diffuser is fitted to the hydrant used to discharge flush water.", "erosion of the soil at the discharge point", "decrease", "The diffuser slows the stream so that it does not cut into the ground."],
    // General knowledge (temporary service and bypass)
    ["h", "Residual chlorine is measured at the far end of a long temporary supply line.", "the chance that poor quality water reaches customers unnoticed", "decrease", "The far end shows what customers receive after the residual has faded."],
    ["m", "Temporary hose is left lying across a busy road with no ramp.", "the chance of the hose being crushed or causing a trip", "increase", "Vehicles run over it and people stumble on it."],
    // General knowledge (fire flow)
    ["m", "A hydrant flow test is repeated after a main is replaced with a larger pipe.", "the accuracy of the system's fire flow records", "increase", "The records then match the new pipe."],
    ["h", "A large main that supplies a zone is shut down for repair during the day.", "the fire flow available in the zone", "decrease", "Water has to take a longer, smaller path, so pressure and flow drop."],
    // General knowledge (maintenance management)
    ["m", "Spare parts for critical pumps are kept on the shelf instead of being ordered after a failure.", "the length of an outage after a pump failure", "decrease", "The part is on hand, so repair starts at once."],
    // General knowledge (safety equipment)
    ["m", "A gas monitor is bump tested before each day's use.", "the chance that a faulty monitor is relied on", "decrease", "A failed sensor is found before a worker trusts it."],
    // General knowledge (disinfecting new mains)
    ["m", "A new main is flushed of dirt before chlorine is added.", "the effectiveness of disinfection", "increase", "Chlorine reaches the pipe wall instead of being used up on dirt."],
    ["h", "Heavily chlorinated water from disinfection is discharged to a stream without dechlorination.", "the risk of harm to fish", "increase", "Chlorine is toxic to aquatic life."],
    // General knowledge (thawing and frost)
    ["m", "A frozen plastic service is thawed with a high current electric unit.", "the chance of damaging the pipe", "increase", "Plastic does not carry the current, and the heat can damage the pipe or its fittings."]
  ],
  flaws: [
    // General knowledge (standby generators and engines)
    { d: "m", prompt: "Which statement about standby generators is wrong?", flawed: "A generator tested with no load proves it can carry load", goods: ["Exercising under load tests the engine and the transfer switch", "Fluid levels and batteries are checked before a test", "Test results are recorded for later comparison"], explanation: "A no-load run shows that the engine starts, not that it can carry a load." },
    { d: "m", prompt: "Which statement about connecting a portable generator is wrong?", flawed: "A plug-in cable to a wall outlet is a safe way to connect", goods: ["A transfer switch isolates the building from the utility lines", "Backfeed can injure line crews", "A qualified person makes the connection"], explanation: "A cable into an outlet can backfeed the utility and injure line crews." },
    // General knowledge (electrical controls and power)
    { d: "m", prompt: "Which statement about motor protection is wrong?", flawed: "Raising the overload setting protects a motor that keeps tripping", goods: ["Repeated trips are investigated for a cause before the motor is restarted", "Overload relays are set to the motor's rated current", "A phase monitor guards against a lost phase"], explanation: "A higher setting hides the fault and lets the motor overheat, so the cause is found instead." },
    // General knowledge (swabbing and pigging)
    { d: "m", prompt: "Which statement about swabbing is wrong?", flawed: "Swabbing repairs a main that has lost wall thickness", goods: ["Swabbing removes soft deposits and biofilm from the pipe wall", "Valves on the route are confirmed open first", "A launch point and a receiving point are planned in advance"], explanation: "Swabbing cleans the inside of the pipe. It cannot restore wall that corrosion has removed." },
    // General knowledge (temporary service and bypass)
    { d: "m", prompt: "Which statement about a temporary water supply is wrong?", flawed: "Backflow protection is skipped on short supply lines", goods: ["Hose is approved for drinking water and cleaned first", "Residual is checked at the far end of a long line", "Customers are told when and for how long supply is changed"], explanation: "A short line can still lose pressure and draw water back, so backflow protection is used." },
    // General knowledge (fire flow)
    { d: "m", prompt: "Which statement about hydrant flow testing is wrong?", flawed: "Static pressure is read with the test hydrant fully open", goods: ["Residual pressure is read at a nearby hydrant while water flows", "The pitot gauge is held in the centre of the stream", "A diffuser limits erosion at the discharge point"], explanation: "Static pressure is read before any water flows. Residual pressure is read while it flows." },
    { d: "h", prompt: "Which statement about fire flow is wrong?", flawed: "Fire flow is independent of main size and pressure", goods: ["Larger buildings call for more water in a fire", "Tests show how much flow a hydrant can deliver at a set pressure", "Closing a large main in a zone can lower the available fire flow"], explanation: "Small mains and low pressure limit the flow that can be delivered." },
    // General knowledge (maintenance management)
    { d: "m", prompt: "Which statement about maintenance records is wrong?", flawed: "Repair costs are left out of the equipment history", goods: ["Failure dates show whether breakdowns are becoming more frequent", "Parts and labour are recorded on each work order", "History helps decide whether to repair or replace"], explanation: "Repair costs are part of the history, because they show when replacement makes more sense." },
    { d: "h", prompt: "Which statement about maintenance planning is wrong?", flawed: "Critical spares are ordered after a failure happens", goods: ["Long lead times raise the need for stocked spares", "Critical equipment is ranked so that effort goes where failure hurts most", "Service intervals are adjusted using repair history"], explanation: "Ordering after a failure leaves the equipment out of service for the whole lead time." },
    // General knowledge (safety equipment)
    { d: "m", prompt: "Which statement about gas monitors is wrong?", flawed: "A monitor that powers on needs no further testing", goods: ["Monitors are bump tested on a set schedule", "Sensors are calibrated at the interval the maker sets", "Readings are checked before entry and while the work goes on"], explanation: "A monitor can power on with a failed sensor, so it is tested against a known gas." },
    // General knowledge (thawing and frost)
    { d: "m", prompt: "Which statement about thawing a frozen service is wrong?", flawed: "Electric thawing is a good choice for plastic service pipe", goods: ["Electric thawing suits metal service pipe", "Hot water thawing needs a way to control the discharge", "An open flame is a fire and damage risk near pipe and buildings"], explanation: "Plastic does not carry the current, and the heat can damage the pipe." },
    // General knowledge (disinfecting new mains)
    { d: "h", prompt: "Which statement about disinfecting a new main is wrong?", flawed: "Samples are taken while strong chlorine is still in the main", goods: ["The main is flushed clean before chlorine goes in", "Chlorinated discharge is dechlorinated before it reaches a stream", "Results are reviewed before the main is put into service"], explanation: "Samples are taken after the strong chlorine is flushed out, so they show the water customers will receive." }
  ]
};
export default data;
