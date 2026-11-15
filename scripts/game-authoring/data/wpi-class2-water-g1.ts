// Class 2 Water Treatment, western exam course, gap-fill table g1.
// Fills topics a coverage check found thin: blowers and compressors, dechlorination, plant security,
// generators and engines, maintenance management, cross-connection control inside a plant, and
// electrical controls with basic cathodic protection.
// Working-knowledge operator content in original wording. Metric units, no regulation numbers and no
// jurisdiction-specific values. Each row rests on well-established operator knowledge, so each section
// is marked "General knowledge".
import type { CourseData } from "../build";
const data: CourseData = {
  courseKey: "wpi-class2-water",
  facts: [
    // General knowledge (blowers and compressors)
    ["m", "A centrifugal blower delivers less air as its discharge pressure rises, while a positive displacement blower moves close to a fixed volume of air per turn.", true, "Flow from a centrifugal machine follows the system pressure. A positive displacement machine moves a set pocket of air with each rotation."],
    ["m", "Rotary lobe blowers have tight clearances, so grit in the intake air wears them quickly.", true, "Dust scores the lobes and casing and opens the clearances, which cuts the air delivered."],
    ["m", "Topping up a blower sump with whatever oil is on hand is acceptable.", false, "The wrong grade or a mix of oil types harms lubrication and seals, so the maker's specification is followed."],
    ["m", "Air scour during a filter wash needs a different air rate than process aeration, so a blower serving both needs a way to vary its output.", true, "Speed control, staged units or a bypass let one blower system meet each demand."],
    ["h", "Running a blower at full output and venting the surplus air to atmosphere carries no energy cost.", false, "The blower still draws full power, so the surplus air is paid for and then wasted."],
    // General knowledge (dechlorination)
    ["m", "Sulfur dioxide dissolves in water to form a weak acid solution before it reacts with chlorine.", true, "The solution is fed to the flow, where it removes the chlorine and lowers the pH slightly."],
    ["m", "Sodium bisulfite and sodium sulfite solutions slowly lose strength when they are exposed to air.", true, "Oxygen reacts with the chemical, so stock is kept covered and used within a reasonable time."],
    ["m", "A dechlorination feed is paced to the flow and the chlorine residual, so the dose follows changes in the water.", true, "A fixed rate would underfeed at times and overfeed at others."],
    ["m", "Overfeeding a sulfite-based chemical is harmless to the receiving stream because the excess is inert.", false, "Excess chemical keeps reacting and draws down dissolved oxygen in the water."],
    ["e", "Flushing water from a main that still carries a chlorine residual is harmless to fish if it runs to a storm drain.", false, "Chlorinated water is toxic to aquatic life, and storm drains lead to streams."],
    ["m", "Sulfur dioxide cylinders and chlorine cylinders share piping and fittings, so equipment is swapped between the two.", false, "Each gas has its own dedicated equipment, since mixing the two systems is dangerous and damages parts."],
    // General knowledge (plant security)
    ["m", "An intrusion alarm is most useful when it reports to a staffed location or an on-call person who can respond.", true, "An alarm nobody hears or acts on does not protect the site."],
    ["m", "Chemical delivery drivers are watched at the fill connection so the product goes into the right tank.", true, "A mix-up at fill time can cause a dangerous reaction, so deliveries are supervised."],
    ["e", "Staff are asked not to plug unknown USB drives into plant computers.", true, "Infected drives are a common way for malware to reach control systems."],
    ["m", "Wellheads and intakes need less protection than the plant building because they are outdoors.", false, "Remote sites are easier to tamper with unseen, so locks, fencing and alarms matter there."],
    ["e", "A security concern is held back until it is proven to be a real threat.", false, "Early reports let others check and act before harm is done, even when the concern proves harmless."],
    // General knowledge (generators and engines)
    ["m", "Running a diesel engine at light load for long periods leaves unburned fuel and soot in the exhaust system.", true, "This build-up is called wet stacking, and a proper load during exercise runs helps burn it off."],
    ["m", "A block heater keeps engine coolant warm so a standby engine starts quickly in cold weather.", true, "A warm engine cranks and fires faster, so the generator is ready when the power fails."],
    ["e", "A manual transfer switch moves the load to the generator with no one present.", false, "A person throws a manual switch, so the load stays off the generator until staff arrive."],
    ["m", "An engine that cranks strongly but does not start points to a flat starting battery.", false, "Strong cranking shows the battery is fine, so fuel, air or ignition problems are checked."],
    ["m", "Fuel filters on a standby engine are left alone until the engine stalls.", false, "Filters are changed on a schedule, because plugged filters stall engines under load."],
    // General knowledge (maintenance management)
    ["e", "A work order records what was done, who did it and which parts were used.", true, "The details build the equipment history that later planning depends on."],
    ["m", "An equipment history helps decide whether repeated repairs justify replacing a unit.", true, "Repair frequency and cost over time show when a unit has reached the end of its useful life."],
    ["m", "Minimum stock levels for critical spares reflect how long a part takes to arrive and how badly its absence would hurt.", true, "Long delivery times and serious consequences call for holding a spare."],
    ["m", "Corrective maintenance is planned work that keeps equipment from failing.", false, "Corrective work repairs a failure or a found defect. Preventive work is the planned work done to avoid failure."],
    ["e", "Equipment manuals are thrown out once the equipment is running.", false, "Manuals hold service steps, limits and parts lists that are needed for years."],
    // General knowledge (cross-connection and backflow in a plant)
    ["m", "Backflow comes from backpressure, when downstream pressure exceeds supply pressure, or from backsiphonage, when supply pressure drops.", true, "Both reverse the flow, and different devices protect against each."],
    ["h", "A hose-end vacuum breaker protects against backsiphonage but not against high downstream pressure.", true, "It admits air when supply pressure falls, but it does not hold back a pressure that pushes liquid the wrong way."],
    ["m", "Backflow assemblies are tested with gauges at their test cocks by trained testers.", true, "Test results show whether the checks and relief parts are still sealing."],
    ["h", "A single check valve is an acceptable backflow assembly where a connection could carry a health hazard.", false, "One check valve can foul or leak, so health hazards call for assemblies built for that level of risk."],
    ["m", "A hose connection on a chemical feed water line needs no backflow protection when the hose is short.", false, "Hose length does not matter, since the risk is a hose end sitting in liquid when pressure falls."],
    ["m", "Backflow assembly choice depends on pipe size, not on the degree of hazard.", false, "The hazard at the connection decides the protection level, and size is just a matter of fit."],
    // General knowledge (electrical controls and cathodic protection)
    ["m", "A level switch in a tank signals a pump to start or stop as the liquid level rises or falls.", true, "Float or probe switches open and close contacts at set levels."],
    ["h", "Battery backup on a control panel keeps the controller and alarms running through a short power loss.", true, "Alarms and data keep working while a generator starts or the power returns."],
    ["m", "Sacrificial anodes are used up over time, so they are inspected and replaced when worn.", true, "A depleted anode no longer protects the steel."],
    ["m", "A blown fuse is fixed by fitting a larger fuse so it does not blow again.", false, "A larger fuse leaves wiring and equipment unprotected, so the cause of the overload is found instead."],
    ["m", "A tripped overload relay is reset again and again until the motor runs.", false, "Repeated resets can burn out the motor, so the cause of the trip is found first."],
    ["h", "A good coating on a buried steel pipe makes cathodic protection unnecessary.", false, "Coatings develop small flaws, and cathodic protection guards the bare spots."]
  ],
  boards: [
    // General knowledge (blowers and compressors)
    { d: "m", prompt: "Match each blower or air system item to its description.", pairs: [["Centrifugal blower", "Spinning impeller whose flow falls as pressure rises"], ["Rotary lobe blower", "Meshing lobes carry fixed pockets of air"], ["Piston compressor", "Pistons squeeze air in cylinders for high pressure"], ["Variable speed drive", "Changes air output by changing blower speed"], ["Blow-off valve", "Vents surplus air when demand drops"], ["Header pressure signal", "Used to match air supply to demand"]] },
    // General knowledge (dechlorination)
    { d: "m", prompt: "Match each dechlorination item to its role.", pairs: [["Residual analyzer", "Checks for chlorine left after the feed point"], ["Flow pacing", "Matches the chemical feed to the water flow"], ["Mixing zone", "Gives the chemical contact and time to react"], ["Dissolved oxygen meter", "Shows the oxygen effect of the dose"], ["Gas eductor", "Uses water flow to draw sulfur dioxide into solution"], ["Containment curb", "Holds spilled chemical around storage tanks"]] },
    // General knowledge (maintenance management)
    { d: "m", prompt: "Match each maintenance record to what it shows.", pairs: [["Work order", "Request and record of a single job"], ["Equipment history", "Past repairs, readings and costs for one unit"], ["PM schedule", "Recurring tasks and when they fall due"], ["Parts inventory", "Spares on hand and where they are kept"], ["Lubrication log", "Oil and grease added and when"], ["Manufacturer manual", "Maker's service steps and limits"]] },
    // General knowledge (cross-connection and backflow in a plant)
    { d: "m", prompt: "Match each backflow protection item to its description.", pairs: [["Air gap", "Open space between a fill pipe and the tank water level"], ["Hose-end vacuum breaker", "Screws onto a hose tap to guard against backsiphonage"], ["Reduced pressure assembly", "Two checks and a relief valve for high-hazard connections"], ["Double check assembly", "Two checks in series for lower-hazard connections"], ["Test cock", "Port where gauges attach for testing"], ["Injection point check valve", "Keeps chemical solution from backing up the feed line"]] }
  ],
  oddSets: [
    // General knowledge (electrical controls and cathodic protection)
  ],
  sequences: [],
  relations: [
    // General knowledge (blowers and compressors)
    ["m", "A relief valve on a blower discharge is set below the normal running pressure of the system.", "the air reaching the process", "decrease", "The valve lifts during normal running and vents part of the flow to atmosphere."],
    ["m", "The motor speed of a positive displacement blower is turned down by a drive while system pressure stays the same.", "the volume of air delivered", "decrease", "This type of blower moves a set volume per turn, so output follows speed."],
    // General knowledge (dechlorination)
    ["m", "The dechlorination feed pump loses its prime and stops delivering chemical.", "the chlorine in the discharge", "increase", "With no chemical reaching the water, the chlorine passes through untreated."],
    ["m", "A tank of sodium bisulfite solution sits open to the air for several months.", "the strength of the solution", "decrease", "Oxygen from the air slowly reacts with the chemical and weakens it."],
    ["h", "The dechlorination feed is paced to the flow of the backwash water.", "the chance of chlorine carry-over as the flow changes", "decrease", "The dose rises and falls with the flow instead of staying fixed."],
    // General knowledge (plant security)
    ["m", "Visitors are logged and escorted while inside the plant.", "the chance that an unknown person reaches process areas", "decrease", "Escorts and a record keep visitors where they belong."],
    ["m", "The password for the control system is written on a note stuck to the control room monitor.", "the chance of unauthorized access to the controls", "increase", "Anyone who walks in can read the password and log on."],
    // General knowledge (generators and engines)
    ["m", "A diesel generator is exercised again and again at very light load.", "the build-up of unburned fuel in the exhaust", "increase", "Low load keeps the engine cool, so fuel burns poorly and leaves residue."],
    ["m", "The block heater on a standby engine fails during a cold spell.", "the chance of a slow or failed start", "increase", "Cold oil and coolant make the engine hard to turn and slow to fire."],
    // General knowledge (maintenance management)
    ["m", "Parts used and labour hours are recorded on each closed work order.", "the usefulness of the maintenance history for spotting repeat problems", "increase", "Detailed records show which equipment fails often and why."],
    ["m", "A frequently used spare part is not restocked after it is used.", "the downtime at the next failure of that part", "increase", "The repair waits while the part is ordered and delivered."],
    // General knowledge (cross-connection and backflow in a plant)
    ["m", "A vacuum breaker is fitted on the hose connection at a washdown station.", "the chance that drain water is siphoned back into the line", "decrease", "The breaker admits air when supply pressure drops, which stops the siphon."],
    ["h", "A pump raises the pressure of a nonpotable line above the potable supply pressure at an unprotected connection.", "the chance of flow from the nonpotable line into the potable supply", "increase", "Higher pressure on the nonpotable side pushes liquid the wrong way."],
    // General knowledge (electrical controls and cathodic protection)
    ["m", "The low-level cutout switch on a pump fails to open when the liquid level drops.", "the chance of the pump running dry", "increase", "The pump keeps running without water and overheats."],
    ["m", "Loose terminal connections in a control panel are found and tightened during a routine inspection.", "the chance of overheating and nuisance trips in the panel", "decrease", "Tight connections carry current without heating up."],
    ["m", "A sacrificial anode on a buried steel tank is used up and not replaced.", "the corrosion rate of the tank steel", "increase", "With no anode left to corrode, the steel itself starts to corrode."]
  ],
  flaws: [
    // General knowledge (blowers and compressors)
    { d: "m", prompt: "Which statement about blower air filters is wrong?", flawed: "A dirty filter is fine until the blower trips", goods: ["Pressure drop across the filter shows when it needs cleaning", "Filter changes follow the dust load and the maker's advice", "A clogged filter raises the discharge temperature of the blower"], explanation: "A dirty filter cuts airflow and strains the machine long before a trip, so it is cleaned or changed on condition." },
    // General knowledge (dechlorination)
    { d: "m", prompt: "Which statement about storing and feeding bisulfite is wrong?", flawed: "Bisulfite can share a tank with hypochlorite", goods: ["Tanks are labelled and kept in their own containment", "Staff wear eye and skin protection when handling it", "Storage is ventilated because fumes irritate the lungs"], explanation: "Bisulfite and hypochlorite react violently, so each has its own tank and containment." },
    // General knowledge (plant security)
    { d: "m", prompt: "Which statement about chemical delivery security is wrong?", flawed: "Fill connection caps stay off between deliveries", goods: ["Fill connections are locked when no delivery is under way", "The storage and fill area is checked after each delivery", "Inventory is compared with use to spot loss"], explanation: "Open fill connections invite tampering and wrong-tank deliveries, so they are capped and locked." },
    // General knowledge (generators and engines)
    { d: "m", prompt: "Which statement about a transfer switch is wrong?", flawed: "Utility and generator can feed the plant at once", goods: ["The switch connects the load to one source at a time", "A delay on return lets utility power settle before the load goes back", "Tests include the move back to utility power"], explanation: "Joining both sources can damage equipment and endanger line crews, so the switch connects one source at a time." },
    // General knowledge (maintenance management)
    { d: "m", prompt: "Which statement about work orders is wrong?", flawed: "Urgent jobs skip the record", goods: ["Each job is tracked from request to closing", "Closed orders show the findings and parts used", "Priority is set when a request comes in"], explanation: "Urgent jobs are recorded too, since the history shows which equipment fails often." },
    { d: "m", prompt: "Which statement about spare parts is wrong?", flawed: "Critical spares are ordered once the unit fails", goods: ["Spare lists come from manuals and repair history", "Stock is counted and compared with records on a schedule", "Shelf life is checked for rubber and electronic parts"], explanation: "Critical spares are held ahead of time, because waiting for delivery extends downtime." },
    // General knowledge (cross-connection and backflow in a plant)
    { d: "m", prompt: "Which statement about backflow assemblies is wrong?", flawed: "Failed units wait for the next outage", goods: ["Failed assemblies are repaired and retested", "Assemblies are installed where testers can reach them", "Test results are filed with the plant records"], explanation: "A failed assembly no longer protects the water, so it is repaired and retested promptly." },
    { d: "h", prompt: "Which statement about hose connections at a plant is wrong?", flawed: "A valve on the tap lets a hose rest in a tank", goods: ["Hoses are kept off the floor and out of sumps and tanks", "Hose taps on potable lines carry a vacuum breaker", "Signs mark water outlets that are not for drinking"], explanation: "A valve does not stop backflow, so a hose end is kept out of liquid and the tap is protected." },
    // General knowledge (electrical controls and cathodic protection)
    { d: "m", prompt: "Which statement about troubleshooting a failed motor circuit is wrong?", flawed: "Wiring is touched before power is locked out", goods: ["The cause of a trip is found before the overload is reset", "Power is locked out before panel work begins", "Meter readings are compared with the nameplate ratings"], explanation: "Locking out power first protects the person, and readings are then compared with the equipment ratings." },
    { d: "h", prompt: "Which statement about cathodic protection on tanks and buried metal is wrong?", flawed: "Protection is checked at installation and then left", goods: ["Readings are taken on a regular program and logged", "Rectifier output is checked where impressed current is used", "Low readings call for inspection of anodes and connections"], explanation: "Anodes wear and connections fail, so protection is checked on a regular program." }
  ]
};
export default data;
