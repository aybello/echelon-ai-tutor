// Class 1 Water Distribution, western exam course, top-up table w1.
// Entry-level general operator knowledge in original wording. No book text is stored in the repo.
// Every row rests on well-established operator knowledge, so each section is marked "General knowledge".
import type { CourseData } from "../build";
const data: CourseData = {
  courseKey: "wpi-class1-water-dist",
  facts: [
    // General knowledge (pipe materials)
    ["e", "Ductile iron pipe is a common choice for mains that carry high pressure.", true, "Its strength suits mains with higher working pressures."],
    ["e", "PVC pipe rusts from the inside as it ages.", false, "PVC is plastic and does not rust. Iron pipe is the type that rusts."],
    ["m", "Plastic pipe is much lighter than iron pipe of the same size, which makes it easier to handle.", true, "Light weight eases hauling and placing in the trench."],
    ["m", "Old galvanized steel service lines tend to corrode on the inside and restrict flow.", true, "Rust and scale build up and narrow the pipe over time."],
    ["m", "Tracer wire laid with plastic main lets crews find the pipe later with a locator.", true, "Plastic pipe cannot be traced by a metal locator without a wire beside it."],
    ["e", "Mains are laid close to the surface to make repairs easier.", false, "Mains are buried deep enough that frost and traffic loads do not reach the pipe."],
    // General knowledge (valves, hydrants, service connections)
    ["e", "A butterfly valve closes by lowering a flat gate into the flow.", false, "A butterfly valve turns a disc a quarter turn. A gate valve lowers a gate."],
    ["m", "A buried valve is turned from the surface with a long key that fits its operating nut.", true, "The key reaches down through the valve box to the nut."],
    ["m", "A large gate valve takes the same number of turns to close as a small one.", false, "Larger valves take many more turns, so closing them is slow work."],
    ["e", "Hydrant nozzle caps protect the threads and keep debris out of the barrel.", true, "Caps also stop children and animals from putting things inside."],
    ["m", "A stiff hydrant is best opened by slipping a pipe over the wrench for extra force.", false, "Extra force can break the stem. A stiff hydrant is reported for repair."],
    ["e", "A service connection joins a customer's building to the distribution main.", true, "The service line runs from the main to the building plumbing."],
    ["m", "The curb stop is the valve screwed directly into the main at the tap.", false, "That is the corporation stop. The curb stop sits farther along the service line."],
    ["m", "A service line often has a gooseneck bend near the main so the pipe can move as the ground settles.", true, "The bend absorbs movement that would otherwise strain the connection."],
    // General knowledge (meters, units, pressure and flow)
    ["e", "A customer meter in a cold area is kept in a heated space or an insulated pit to protect it from frost.", true, "Freezing can crack the meter body."],
    ["e", "One cubic metre of water is 100 litres.", false, "One cubic metre is 1000 litres."],
    ["e", "Pressure and flow rate mean the same thing.", false, "Pressure is force on an area. Flow rate is the volume moving past a point in a set time."],
    ["m", "Flow rate describes how much water passes a point in a set time, such as litres per second.", true, "It is a volume per unit of time."],
    ["m", "A column of water one metre high produces roughly 10 kPa of pressure.", true, "The figure is close to 9.8 kPa for each metre of height."],
    ["m", "The pressure measured at a hydrant while it is flowing is called static pressure.", false, "That is residual pressure. Static pressure is read with no water moving."],
    ["m", "Water pressure at a tap rises as the tap is moved higher above the tank water level.", false, "Pressure falls as the point of use gets higher above the water level."],
    // General knowledge (pumps at a basic level)
    ["m", "A centrifugal pump that runs dry can overheat and damage its seals.", true, "The water in the casing cools and lubricates the seal faces."],
    ["m", "A centrifugal pump can run for long periods against a closed discharge valve without harm.", false, "The energy turns into heat in the casing, which can damage the pump."],
    ["e", "A booster pump is used to reduce pressure in low-lying areas.", false, "A booster pump raises pressure. A pressure reducing valve lowers it."],
    // General knowledge (main installation and disinfection)
    ["m", "New pipe left in a trench overnight is fine with open ends if the weather looks dry.", false, "Pipe ends are plugged because rain, animals and dirt get in quickly."],
    ["m", "Strong chlorine solution is held in a new main for a set contact time before it is flushed out.", true, "The contact time gives the chlorine time to destroy organisms in the pipe."],
    ["m", "Chlorinated water from a main flush is neutralized before it goes to a storm drain or creek.", true, "Strong chlorine harms fish and other aquatic life."],
    // General knowledge (water quality in the system)
    ["e", "Red or brown tap water often comes from iron deposits stirred up in old pipes.", true, "A change in flow can lift the deposits off the pipe wall."],
    ["m", "Milky water that clears from the bottom of the glass upward is usually caused by tiny air bubbles.", true, "The bubbles rise and leave clear water behind."],
    ["e", "A chlorine residual in the distribution system is a sign that the water has gone bad.", false, "The residual protects the water on its way to customers."],
    ["m", "A sudden change in flow direction in a main can stir up sediment and cause discoloured water at taps.", true, "Deposits that sat undisturbed are lifted into the flow."],
    // General knowledge (cross-connection and backflow basics)
    ["e", "A garden hose left with its end under pool water is not a cross-connection.", false, "The hose links the pool to the house plumbing, which is a cross-connection."],
    ["m", "A backflow preventer on an irrigation line is tested after installation and on a regular schedule.", true, "Testing finds a fouled check before it matters."],
    ["e", "An air gap uses a spring-loaded check to stop backflow.", false, "An air gap is an open space with no moving parts."],
    // General knowledge (main breaks and emergency response)
    ["e", "During a main break, crews close valves to isolate the broken section.", true, "Isolating the section stops the loss of water and the damage."],
    // General knowledge (trench and confined-space safety)
    ["e", "Excavated soil is kept back from the trench edge so it does not load the walls.", true, "A pile at the edge adds weight that can bring the wall down."],
    ["e", "A trench deeper than a person needs no way out because workers can climb the walls.", false, "A ladder or ramp gives a quick exit if the walls start to move."],
    ["e", "Looking into a valve chamber with the lid off is enough to show it is safe to enter.", false, "Low oxygen and harmful gases are often invisible, so the air is tested."],
    ["m", "A standby person stays outside a confined space and keeps contact with the person inside.", true, "The standby person raises the alarm and starts the rescue plan."],
    ["m", "Once the first air reading in a confined space looks good, no more testing is needed.", false, "Conditions change, so the air is monitored while work goes on."],
    // General knowledge (record keeping and customer complaints)
    ["e", "A good complaint record notes the time, the address and the nature of the problem.", true, "Those details let crews follow up and spot patterns."],
    ["m", "Records of main breaks lose their value as soon as the break is repaired.", false, "Break records show weak spots and help plan pipe replacement."],
    ["e", "Operators taste water from a complaint to decide whether it is safe.", false, "Tasting is not a safe test. Samples go for proper testing."]
  ],
  boards: [
    // General knowledge (pipe materials)
    { d: "e", prompt: "Match each pipe material to its feature.", pairs: [["PVC", "Plastic pipe that does not rust"], ["Ductile iron", "Strong iron pipe often lined with cement mortar"], ["HDPE", "Flexible plastic pipe joined by heat fusion"], ["Copper", "Smooth tube often used for small service lines"], ["Galvanized steel", "Older service pipe that corrodes and clogs"], ["Concrete pressure pipe", "Large pipe for big mains"]] },
    // General knowledge (valve maintenance signs)
    { d: "m", prompt: "Match each valve problem to its sign.", pairs: [["Stuck valve", "The key will not turn"], ["Leaking packing", "Water seeping around the stem"], ["Broken stem", "The key turns freely but the valve does not move"], ["Worn seat", "Water gets past the valve when it is closed"], ["Valve left partly closed", "Low pressure in the area it feeds"], ["Valve left shut after repairs", "Customers lose water in a section that should be open"]] },
    // General knowledge (hydrant inspection)
    { d: "m", prompt: "Match each hydrant check to what it can find.", pairs: [["Water level in the barrel after use", "A drain that is not working"], ["Operating nut", "Wear or rounding that slips the key"], ["Nozzle threads", "Damage that makes caps stick"], ["Stem packing", "A leak at the top while open"], ["Ground around the hydrant", "Blocked access"], ["Paint and markings", "A hydrant that is hard to see"]] },
    // General knowledge (service line problems)
    { d: "m", prompt: "Match each service line problem to its sign.", pairs: [["Frozen service", "No water in a cold snap"], ["Leak on the service line", "Wet ground between the main and the building"], ["Partly closed curb stop", "Weak flow at every tap in one building"], ["Clogged old galvanized line", "Pressure drops when two taps run at once"], ["Water hammer in the plumbing", "Banging when a valve shuts quickly"], ["Cracked meter body", "Water leaking from the meter after a freeze"]] },
    // General knowledge (water quality terms)
    { d: "e", prompt: "Match each water quality term to its meaning.", pairs: [["Chlorine residual", "Chlorine left in the water to protect it"], ["Turbidity", "Cloudiness caused by tiny particles"], ["Detention time", "How long water stays in pipes or tanks"], ["Sediment", "Solid material that settles out of water"], ["Colour", "A tint in the water from dissolved or suspended matter"], ["Odour", "A smell noticed in the water"]] },
    // General knowledge (units)
    { d: "e", prompt: "Match each measure to its usual unit.", pairs: [["Pressure", "Kilopascals"], ["Flow rate", "Litres per second"], ["Tank volume", "Cubic metres"], ["Pipe diameter", "Millimetres"], ["Chlorine concentration", "Milligrams per litre"], ["Water temperature", "Degrees Celsius"]] },
    // General knowledge (pressure and flow terms)
    { d: "m", prompt: "Match each pressure and flow term to its meaning.", pairs: [["Static pressure", "Pressure read with no water moving"], ["Residual pressure", "Pressure read while water is flowing"], ["Fire flow", "Flow available for fighting a fire"], ["Friction loss", "Pressure lost as water rubs along the pipe"], ["Elevation", "Height above a reference point that affects pressure"], ["Pitot gauge", "Reads the pressure of a stream leaving a hydrant"]] },
    // General knowledge (new main installation tasks)
    { d: "e", prompt: "Match each main installation task to its purpose.", pairs: [["Tracer wire", "Lets the pipe be found later"], ["Pipe bedding", "Supports the pipe along its length"], ["Joint restraint", "Holds fittings against thrust"], ["Plugging pipe ends", "Keeps dirt out of the pipe"], ["Compacting backfill", "Prevents settling of the ground above"], ["Warning tape", "Alerts later diggers to the pipe below"]] },
    // General knowledge (chlorine items for disinfection)
    { d: "m", prompt: "Match each chlorine item to its description.", pairs: [["Sodium hypochlorite solution", "Liquid whose strength fades with age"], ["Calcium hypochlorite granules", "Dry powder mixed with water before use"], ["Calcium hypochlorite tablets", "Placed in pipe lengths during installation"], ["Chlorine gas", "Toxic gas handled by trained staff with safety gear"], ["Dechlorination agent", "Neutralizes chlorine in water being discharged"], ["Test kit", "Measures the chlorine left in a sample"]] },
    // General knowledge (flushing hazards)
    { d: "m", prompt: "Match each flushing hazard to its control.", pairs: [["Erosion at the discharge point", "Use a diffuser or direct the flow to a hard surface"], ["Chlorinated discharge", "Neutralize it before release"], ["Traffic near the work", "Set up cones and signs"], ["Discoloured water for customers", "Warn them beforehand"], ["Water hammer", "Open and close the hydrant slowly"], ["Flooding a roadway", "Pipe the flow to a drain or ditch"]] },
    // General knowledge (main break signs)
    { d: "m", prompt: "Match each main break sign to what it suggests.", pairs: [["Water surfacing in the street", "A leak or break close to the surface"], ["Sudden pressure drop across an area", "A large flow leaving the system"], ["Muddy water at taps nearby", "Sediment stirred by a change in flow"], ["Sinkhole in the pavement", "Soil washed out from under the road"], ["Roar of rushing water", "Water escaping under pressure"], ["Tank level falling faster than normal", "Loss greater than the pumped input"]] },
    // General knowledge (confined space roles and equipment)
    { d: "m", prompt: "Match each confined space role or item to its job.", pairs: [["Entrant", "Goes in and watches for signs of trouble"], ["Attendant", "Stays outside and keeps contact with the entrant"], ["Entry supervisor", "Approves the entry and checks the safeguards"], ["Rescue team", "Ready to retrieve a worker in trouble"], ["Gas detector", "Tests for oxygen level and harmful gases"], ["Blower", "Moves fresh air into the space"]] },
    // General knowledge (booster station components)
    { d: "m", prompt: "Match each booster station part to its job.", pairs: [["Suction valve", "Isolates the pump on the inlet side"], ["Discharge check valve", "Stops water flowing back through the pump"], ["Discharge pressure gauge", "Shows the pressure the pump delivers"], ["Pressure switch", "Starts and stops the pump at set pressures"], ["Control panel", "Houses the starters and alarms"], ["Pressure relief valve", "Opens to release dangerous pressure"]] },
    // General knowledge (personal protective equipment)
    { d: "e", prompt: "Match each safety item to the hazard it addresses.", pairs: [["Hard hat", "Falling objects and bumps"], ["Reflective vest", "Being struck by vehicles"], ["Safety glasses", "Chemical splashes in the eyes"], ["Harness and lifeline", "Falling into a tank or chamber"], ["Ear protection", "Hearing damage near loud pumps"], ["Chemical-resistant gloves", "Skin contact with chlorine solutions"]] }
  ],
  oddSets: [],
  sequences: [
    // General knowledge (isolating a break)
    { d: "m", process: "stopping the flow from a broken main", steps: ["Find the location of the break", "Look up the valves on the system map", "Close the valves around the break slowly", "Check that the flow at the break has stopped", "Record which valves were closed"], why: "The break is located, the valves are found on the map, closed slowly, the result is checked, and the closed valves are recorded so they can be reopened.", max: 8 },
    // General knowledge (new main disinfection, generic)
    { d: "m", process: "disinfecting a new main by the continuous feed method", steps: ["Flush the main clean", "Fill the main with chlorinated water at a steady rate", "Hold the chlorinated water for the contact time", "Flush the strong chlorine out to a safe discharge point", "Collect samples", "Release the main for use after good results"], why: "The pipe is cleaned first, filled and held with chlorine, flushed out, then sampled before it is released.", max: 8 },
    // General knowledge (trench work)
    { d: "m", process: "digging a repair trench safely", steps: ["Request the marking of buried utilities", "Set up traffic control", "Excavate with the spoil kept back from the edge", "Install trench protection before anyone enters", "Climb down by the ladder"], why: "Utilities are marked and traffic is controlled before digging, and protection goes in before anyone enters.", max: 8 },
    // General knowledge (complaint follow-up)
    { d: "m", process: "following up a discoloured water complaint", steps: ["Record the caller's address and details", "Check the records for recent main work or breaks nearby", "Run the cold tap and test the residual and colour", "Flush the nearby main if the cause is in it", "Call the customer back to confirm the water is clear"], why: "The details are logged, records are checked for a cause, the tap is tested, the main is flushed if needed, and the customer is contacted last.", max: 8 },
    // General knowledge (field chlorine test)
    { d: "e", process: "testing a water sample for chlorine with a colour test", steps: ["Rinse the sample cell with the water", "Fill the cell to the mark", "Zero the meter with the plain sample", "Add the reagent powder", "Mix and wait the timed period", "Read the result"], why: "The cell is rinsed and filled, the meter is zeroed on the plain sample, then reagent is added, mixed, timed and read.", max: 8 }
  ],
  relations: [
    // General knowledge (installation, freezing and pipe protection)
    ["e", "A main is buried deeper below the frost line.", "the chance of freeze damage to the pipe", "decrease", "Deeper cover keeps frost away from the pipe."],
    ["m", "Pipe ends are left open in the trench overnight.", "the chance of dirt and animals getting into the pipe", "increase", "Open ends give debris and animals a way in."],
    ["e", "A customer meter pit is insulated.", "the chance of the meter freezing in cold weather", "decrease", "Insulation holds heat around the meter."],
    ["m", "Tracer wire is installed with new plastic main.", "the ability to locate the pipe later", "increase", "A locator can follow the wire to the pipe."],
    ["e", "A hydrant drain is blocked in freezing weather.", "the chance of the barrel freezing", "increase", "Water left in the barrel turns to ice."],
    // General knowledge (pumps, pressure and flow)
    ["m", "A pump runs against a nearly closed discharge valve.", "the heat built up inside the pump casing", "increase", "Energy that cannot leave as flow turns to heat."],
    ["m", "A booster pump is started in a low-pressure zone.", "the pressure at customers' taps in that zone", "increase", "The pump adds energy to the water."],
    ["e", "A customer's tap is at a higher elevation on the same system.", "the pressure at that tap", "decrease", "Pressure falls as the height above the water level grows."],
    ["m", "Demand rises on a hot summer afternoon.", "the residual pressure at hydrants", "decrease", "More flow means more friction loss and lower pressure."],
    ["m", "A larger pipe replaces a smaller one carrying the same flow.", "the pressure lost to friction along the pipe", "decrease", "Slower water in a wider pipe rubs less on the wall."],
    ["e", "A utility changes the paint colour on its hydrants.", "the water pressure in the system", "unchanged", "Paint is cosmetic and does not touch the hydraulics."],
    ["e", "A meter reading is converted from cubic metres to litres.", "the volume of water the customer used", "unchanged", "A change of units does not change the amount of water."],
    ["m", "A valve in a looped system is exercised and then returned to fully open.", "the pressure in the system", "unchanged", "The valve ends up in its normal position, so the flow paths are the same."],
    // General knowledge (water quality in the system)
    ["e", "Chlorinated water from a main flush is run through a dechlorination unit.", "the chlorine reaching the creek", "decrease", "The unit neutralizes the chlorine before release."],
    ["m", "Air is left trapped in a new main when it is filled.", "the spitting and noise at customers' taps", "increase", "Trapped air is carried to the taps as the main is used."],
    ["m", "Flow in a main reverses direction during a break.", "the chance of discoloured water at taps", "increase", "Deposits that sat undisturbed are lifted off the pipe wall."],
    // General knowledge (valves, main breaks and records)
    ["m", "A partly closed valve is left behind after repair work.", "the pressure in the area it feeds", "decrease", "The valve restricts the flow into that area."],
    ["e", "Crews close the valves around a main break promptly.", "the volume of water lost from the break", "decrease", "Isolating the section stops the flow to the break."],
    ["m", "The complaint log is reviewed regularly.", "the chance that a recurring trouble spot is noticed", "increase", "Patterns show up when calls are looked at together."],
    // General knowledge (trench and confined-space safety)
    ["m", "A trench wall is left steep and unsupported after heavy rain.", "the risk of a cave-in", "increase", "Wet soil is heavy and loses its grip."],
    ["e", "A spoil pile is moved back from the trench edge.", "the load on the trench wall", "decrease", "Less weight sits near the edge of the wall."],
    ["m", "The air in a confined space is tested and ventilated before entry.", "the risk of workers breathing bad air", "decrease", "Testing finds the hazard and ventilation clears it."]
  ],
  flaws: [
    // General knowledge
    { d: "e", prompt: "Which statement about service lines is wrong?", flawed: "Galvanized service lines get smoother with age", goods: ["Old galvanized service lines can corrode and clog", "A gooseneck lets a service move as the ground settles", "The service line runs from the main to the building"], explanation: "Galvanized lines corrode and scale up with age, which narrows them." },
    { d: "m", prompt: "Which statement about starting a pump is wrong?", flawed: "A dry pump can be run to test its motor", goods: ["The casing is filled with water before the pump starts", "Running dry can damage the seals", "Guards are put back before the pump is started"], explanation: "Running dry can overheat and damage the pump, so the casing is filled first." },
    { d: "m", prompt: "Which statement about pressure is wrong?", flawed: "Residual pressure is read with no flow", goods: ["Static pressure is read with no water flowing", "Pressure is measured in kilopascals", "Pressure falls as the point of use gets higher above the tank"], explanation: "Residual pressure is read while water is flowing. Static pressure is read with no flow." },
    { d: "e", prompt: "Which statement about handling new pipe is wrong?", flawed: "Pipe sections are laid on bare soil to dry out", goods: ["Pipe ends are plugged when work stops", "Pipe is kept clear of mud and runoff", "Fittings are checked for dirt before they go in"], explanation: "Pipe is kept clean and off the bare ground so dirt does not end up inside the main." },
    { d: "e", prompt: "Which statement about discoloured water is wrong?", flawed: "Red water is a sign of too much chlorine", goods: ["Red or brown water often comes from stirred iron deposits", "Flushing a main can clear water carrying sediment", "A sudden flow change can lift deposits off the pipe wall"], explanation: "Red or brown water comes from iron deposits, not from chlorine." },
    { d: "m", prompt: "Which statement about responding to a main break is wrong?", flawed: "Valves are slammed shut to stop flow fast", goods: ["Valves are closed slowly to limit pressure surges", "Affected customers are told about the outage", "Crews check for other buried utilities before digging"], explanation: "Closing valves quickly can cause a damaging pressure surge, so they are closed slowly." },
    { d: "e", prompt: "Which statement about trench safety is wrong?", flawed: "Excavated soil is piled right at the trench edge", goods: ["Spoil is kept back from the edge of the trench", "A way out is provided for workers in the trench", "Walls are protected when workers enter a deep trench"], explanation: "A pile at the edge adds load to the wall and can bring it down." },
    { d: "m", prompt: "Which statement about entering a valve chamber is wrong?", flawed: "A standby person goes in with the entrant", goods: ["The air is tested before anyone goes in", "A standby person stays outside in contact with the entrant", "Ventilation is used when the air test shows a problem"], explanation: "The standby person stays outside so help can be raised if the entrant is in trouble." },
    { d: "m", prompt: "Which statement about complaint records is wrong?", flawed: "Complaint logs are of little use after a fix", goods: ["Logs show repeat trouble in the same area", "A record includes the address and the problem", "Records help plan flushing and pipe replacement"], explanation: "Logs show patterns and trouble spots long after each complaint is closed." },
    { d: "m", prompt: "Which statement about backflow preventers is wrong?", flawed: "A device that passed once is left alone", goods: ["Devices are tested right after installation", "Devices are retested on a regular schedule", "Test results are kept in the records"], explanation: "Checks wear or foul over time, so devices are tested again on a regular schedule." }
  ]
};
export default data;
