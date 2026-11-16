// Class 1 Wastewater Collection, western exam course, top-up table w1.
// Entry-level general operator knowledge in original wording. No book text is stored in the repo.
// Every row rests on well-established operator knowledge, so each section is marked "General knowledge".
import type { CourseData } from "../build";
const data: CourseData = {
  courseKey: "wpi-class1-water-coll",
  facts: [
    // General knowledge (system basics, pipes and flow)
    ["e", "A cleanout on a building sewer gives crews a spot to reach the pipe without going down a manhole.", true, "The cleanout is an access point on the private line, so rodding or jetting can start there."],
    ["e", "Sanitary sewers are built to carry stormwater from street drains.", false, "Sanitary sewers carry household and business wastewater. Storm sewers handle runoff."],
    ["m", "Plastic sewer pipe is much heavier than clay pipe of the same size.", false, "Plastic is light, which makes it easier to handle and lay."],
    ["m", "Vitrified clay pipe resists many chemicals but breaks if it is struck or poorly supported.", true, "Clay is hard and durable but brittle."],
    ["e", "Wastewater moves faster down a steep street than along a flat one.", true, "A steeper fall speeds the flow, while flat runs let solids settle."],
    ["m", "Flow in a sewer stays at the same level through the whole day.", false, "Flow rises and falls with water use, with peaks in the morning and evening."],
    // General knowledge (inflow and infiltration)
    ["e", "Groundwater leaking in through cracked pipes and loose joints is called infiltration.", true, "Water seeps in wherever the pipe wall or a joint is damaged."],
    ["m", "Infiltration is at its worst during long dry spells.", false, "Infiltration rises when the ground is wet and the water table is high."],
    ["e", "Rain from connected downspouts flushes the sanitary sewer clean and does no harm.", false, "Extra rain flow can overload pipes and pumps and lead to overflows."],
    // General knowledge (blockages and their causes)
    ["e", "Cooking grease poured down a drain cools and hardens on the pipe wall.", true, "Grease sticks to the cooler pipe and builds up layer on layer."],
    ["e", "Rinsing grease down the drain with hot water keeps it from causing trouble farther along.", false, "The grease cools again in the pipe and sticks to the wall farther down."],
    ["e", "Wipes labelled flushable can still catch in sewer pipes and pumps.", true, "They do not break up like toilet paper and tangle with other debris."],
    ["m", "Tree roots push straight through sound, unbroken pipe walls.", false, "Roots find their way in at joints and cracks where moisture escapes."],
    ["m", "Roots are drawn to sewer joints because moisture and nutrients seep out there.", true, "Small leaks give roots a reason to grow toward the pipe."],
    ["m", "A sag in a sewer holds water and lets solids settle out.", true, "The low spot slows the flow, so heavier material drops to the bottom."],
    ["m", "Sand and grit settle out most readily where a sewer is steep and fast.", false, "Grit drops out where the flow is slow, such as flat runs and sags."],
    ["m", "A stoppage that keeps returning at the same spot points to a defect such as a sag, an offset joint or roots.", true, "Clearing the blockage treats the symptom, so the cause is inspected."],
    ["m", "A stoppage that clears by itself needs no follow-up because the cause is gone.", false, "The material may have moved downstream, so the line is checked in case it lodges again."],
    // General knowledge (cleaning methods)
    ["m", "Rodding uses a flexible rod or cable pushed through the pipe to break up or clear a blockage.", true, "Cutting heads can be fitted for roots or hardened deposits."],
    ["m", "Jetting a line works from the downstream manhole so loosened debris washes back to where it can be collected.", true, "Working upstream keeps the debris moving toward the crew."],
    ["m", "A jetter nozzle is safe to leave running at full pressure while it is lifted out of the pipe.", false, "Pressure is turned down before the nozzle comes out, since a live nozzle can cut skin and damage equipment."],
    // General knowledge (CCTV inspection)
    ["e", "CCTV inspection lets crews see cracks, roots and sags inside a sewer without digging.", true, "A camera on a tractor or float shows the pipe condition on a screen."],
    ["m", "A camera report lists blockages but leaves out cracks and joint problems.", false, "Reports record cracks, offsets, roots and other defects along with their location."],
    // General knowledge (lift stations)
    ["e", "A float switch starts the pumps when the wet well level is low.", false, "Floats start pumps as the level rises and stop them as it falls."],
    ["m", "Grease and rags in a wet well can foul floats and give false level signals.", true, "A stuck float may not start the pumps when it should."],
    ["m", "After a power outage, a crew checks that the pumps restart and the wet well level is dropping.", true, "A station that fails to restart will fill and may overflow."],
    ["m", "A lift station alarm that clears itself before anyone arrives needs no check.", false, "The cause may still be present, so the station is looked over."],
    ["e", "A single worker can enter a wet well alone if the pumps are switched off.", false, "The air is tested and an attendant stays outside. Switching off the pumps does not make the air safe."],
    // General knowledge (force mains)
    ["e", "A force main carries wastewater under pressure from a lift station to its discharge point.", true, "The pumps push the flow through a pressurized pipe."],
    // General knowledge (hydrogen sulfide and odours)
    ["m", "At high levels hydrogen sulfide dulls the sense of smell, so a lack of odour does not show the air is safe.", true, "The nose stops sensing the gas, which makes smell a poor warning."],
    ["m", "Splashing where flow drops into a manhole releases hydrogen sulfide and odour into the air.", true, "Turbulence drives gas out of the wastewater."],
    ["e", "A strong sewer odour in a neighbourhood is a normal sign of a healthy system.", false, "Strong odour points to a problem such as stale wastewater, a dry trap or a leak."],
    ["m", "A floor drain with a dry trap keeps sewer air out of a building.", false, "A trap blocks sewer air by holding a water seal. A dry trap has no seal."],
    // General knowledge (safety)
    ["e", "A manhole is a confined space because the ways in and out are limited.", true, "Limited access makes escape and rescue harder."],
    ["e", "Opening a manhole cover for a minute makes the air inside safe to breathe.", false, "Harmful gas and low oxygen can remain, so the air is tested."],
    ["e", "A gas detector is tested before use to confirm it responds and alarms.", true, "A detector that has not been checked may fail to warn the worker."],
    ["m", "Crews working in a roadway wear high-visibility clothing so drivers can see them.", true, "Bright clothing helps drivers notice workers in time."],
    ["e", "Steel-toed boots protect feet from dropped covers and tools.", true, "Manhole covers and tools are heavy enough to crush toes."],
    ["e", "A jetter truck is quiet enough that ear protection is not needed.", false, "Pumps and engines are loud enough to damage hearing over time."],
    ["e", "A cloth glove protects the hands as well as a waterproof glove in wastewater.", false, "Cloth soaks through, while waterproof gloves keep wastewater off the skin."],
    // General knowledge (emergency response)
    ["e", "A basement backup call is treated as urgent because wastewater in a home is a health hazard.", true, "Quick response limits damage and exposure for the household."],
    ["m", "A crew that finds the street sewer flowing freely has narrowed the problem down to the private building sewer.", true, "A free-flowing main means the blockage is likely on the private side."],
    ["m", "Hosing overflow wastewater into the nearest storm drain is an acceptable clean up.", false, "Storm drains usually lead to creeks and rivers, so wastewater is recovered, not washed away."],
    // General knowledge (record keeping and customer complaints)
    ["e", "A service request record notes the caller, address, time and the work done.", true, "Those details let crews follow up and spot patterns."],
    ["m", "Cleaning records can be thrown out once the next cleaning is done.", false, "Old records show how often a pipe plugs and help set the cleaning schedule."],
    ["e", "Log entries can be written from memory days later without losing detail.", false, "Details fade fast, so entries are made at the time or soon after."],
    ["m", "Listening politely and writing down the details is a good first step with an upset caller.", true, "The caller feels heard and the crew gets the facts needed to respond."],
    ["e", "A customer call about sewer odour belongs to some other department.", false, "Odour often comes from the sewer system, so the crew follows it up."],
    ["m", "Telling a customer the cause of a backup before the crew has checked is good service.", false, "A guess can be wrong and cause trouble later. The cause is confirmed first."]
  ],
  boards: [
    // General knowledge (blockage materials)
    { d: "e", prompt: "Match each blockage material to its usual source.", pairs: [["Grease", "Cooking fat poured down drains"], ["Roots", "Trees seeking moisture at joints"], ["Wipes and rags", "Items flushed down toilets"], ["Concrete and mortar", "Building work near the sewer"], ["Sand and gravel", "Washed in through broken pipe or open covers"], ["Bottles and toys", "Objects dropped into toilets or drains"]] },
    // General knowledge (cleaning gear)
    { d: "m", prompt: "Match each piece of cleaning gear to the job it does.", pairs: [["Jetter", "Sprays high-pressure water through a nozzle"], ["Power rodder", "Spins a cable fitted with cutting heads"], ["Bucket machine", "Drags a scraper bucket along a cable"], ["Vacuum truck", "Sucks up liquid and solids at the manhole"], ["Hose guide", "Protects the hose and pipe edge at the manhole"], ["Sewer ball", "Inflated ball that scours the pipe with backed-up water"]] },
    // General knowledge (CCTV steps)
    { d: "m", prompt: "Match each camera inspection step to its purpose.", pairs: [["Cleaning the pipe first", "Gives the camera a clear view of the wall"], ["Footage counter", "Ties each defect to a distance"], ["Saved video", "Lets crews compare the pipe from year to year"], ["Camera lights", "Let the camera see inside the dark pipe"], ["Defect coding", "Lists problems by type and location"], ["Surface marking", "Shows where a defect lies above ground"]] },
    // General knowledge (lift station parts)
    { d: "e", prompt: "Match each lift station part to its job.", pairs: [["Wet well", "Collects the incoming wastewater"], ["Float switch", "Signals the pumps to start and stop by level"], ["Control panel", "Holds the starters and alarm circuits"], ["Check valve", "Stops flow from returning to the wet well"], ["Alarm light", "Warns that something is wrong at the station"], ["Force main", "Carries the pumped flow away under pressure"]] },
    // General knowledge (protective equipment by body part)
    { d: "e", prompt: "Match each protective item to the body part it protects.", pairs: [["Hard hat", "Head"], ["Safety glasses", "Eyes"], ["Steel-toed boots", "Feet"], ["Waterproof gloves", "Hands"], ["Hearing protection", "Ears"], ["Respirator", "Lungs"]] },
    // General knowledge (units)
    { d: "e", prompt: "Match each unit to what it measures in collection work.", pairs: [["Litres per second", "Flow rate"], ["Millimetres", "Pipe diameter"], ["Metres per second", "Flow velocity"], ["Percent", "Pipe slope"], ["Kilopascals", "Force main pressure"], ["Cubic metres", "Volume of wastewater"]] },
    // General knowledge (overflow response)
    { d: "m", prompt: "Match each overflow response step to what it achieves.", pairs: [["Clear the blockage", "Stops the overflow at its source"], ["Block the storm drain inlet", "Keeps wastewater out of the creek"], ["Vacuum up the spill", "Recovers wastewater from the ground"], ["Disinfect the area", "Lowers infection risk after cleanup"], ["Post warning signs", "Keeps the public away"], ["Write the incident report", "Records what happened and what was done"]] },
    // General knowledge (backup symptoms)
    // General knowledge (customer complaints)
    { d: "m", prompt: "Match each complaint to a sensible first check.", pairs: [["Sewer odour outside", "Nearby manholes and the lift station"], ["Basement backup", "The street sewer at the nearest manhole"], ["Gurgling toilets", "Venting and the building sewer"], ["Rattling manhole cover", "How the cover sits in its frame"], ["Pavement sinking over a sewer", "A pipe collapse or washout below"], ["Wastewater at a manhole", "An overflow caused by a blockage"]] },
    // General knowledge (types of pipe)
    { d: "e", prompt: "Match each type of pipe to what it carries.", pairs: [["Sanitary sewer", "Household and business wastewater"], ["Storm sewer", "Rain runoff from streets"], ["Combined sewer", "Wastewater and runoff in one pipe"], ["Force main", "Pumped flow under pressure"], ["Building sewer", "Wastewater from one building to the street"], ["Foundation drain", "Groundwater from around a building"]] },
    // General knowledge (gas hazards)
    { d: "m", prompt: "Match each gas hazard to what makes it dangerous.", pairs: [["Hydrogen sulfide", "Toxic and dulls the sense of smell"], ["Methane", "Flammable gas that can explode"], ["Oxygen shortage", "Causes dizziness and collapse"], ["Carbon monoxide", "Poisonous gas from engine exhaust"], ["Gasoline vapour", "Flammable vapour from fuel spilled into the sewer"], ["Carbon dioxide", "Heavier than air and pools in low areas"]] },
    // General knowledge (record keeping)
    { d: "e", prompt: "Match each record to the question it answers.", pairs: [["Maintenance log", "What work was done on this pipe?"], ["Complaint log", "Where are customers calling from?"], ["Overflow report", "What spilled, how much and why?"], ["Inspection video", "What condition is the pipe in?"], ["Daily log", "What did the crew do today?"], ["System map", "Where is the pipe and what size is it?"]] },
    // General knowledge (odour sources)
    { d: "m", prompt: "Match each odour source to what is happening.", pairs: [["Dry trap", "The water seal is gone and sewer air gets in"], ["Drop at a manhole", "Splashing releases gas from the flow"], ["Long idle force main", "Wastewater goes stale and turns septic"], ["Grease cap in a wet well", "Rotting fat gives off a strong smell"], ["Missing cleanout cap", "Sewer air escapes at ground level"], ["Overflow at a manhole", "Raw wastewater is exposed to the air"]] },
    // General knowledge (jetting site hazards)
    { d: "e", prompt: "Match each jetting job hazard to a control.", pairs: [["High-pressure hose", "Keep body parts clear of the nozzle"], ["Passing traffic", "Set out cones and signs"], ["Open manhole", "Guard it with a barricade"], ["Splashing wastewater", "Wear a face shield or eye protection"], ["Wet, slippery ground", "Wear non-slip boots and clean up spills"], ["Loud machine noise", "Wear hearing protection"]] },
    // General knowledge (lift station tasks)
    { d: "m", prompt: "Match each routine lift station task to the trouble it prevents.", pairs: [["Testing the floats", "Pumps that do not start at the set level"], ["Cleaning the wet well", "A grease cap and strong odour"], ["Exercising the standby generator", "Failure during a power outage"], ["Checking run times and amps", "Missed signs of pump wear"], ["Testing the alarms", "Faults that nobody is told about"], ["Locking the hatch", "Unwanted entry and falls"]] },
    // General knowledge (sewer pipe materials)
    { d: "m", prompt: "Match each sewer pipe material to a point about it.", pairs: [["Concrete", "Attacked by acid above the waterline"], ["Vitrified clay", "Hard but brittle"], ["PVC", "Light plastic that can sag under poor backfill"], ["Cast iron", "Rusts and builds up scale"], ["Ductile iron", "Strong pipe suited to pressure mains"], ["HDPE", "Flexible plastic joined by heat fusion"]] }
  ],
  oddSets: [],
  sequences: [
    // General knowledge (clearing a blockage)
    { d: "m", process: "clearing a stoppage with a jetter", steps: ["Set up cones and signs around the work area", "Lift the manhole cover with a proper tool", "Feed the hose and nozzle into the pipe", "Turn up the pressure to break up the blockage", "Pull the hose back while rinsing the pipe", "Replace the cover and pick up the cones"], why: "Traffic control comes first, the cover is lifted, the hose is fed in, the blockage is broken up, the pipe is rinsed on the way out, and the site is cleared last.", max: 6 },
    // General knowledge (basement backup call)
    { d: "m", process: "responding to a basement backup call", steps: ["Record the caller's name, address and the problem", "Arrive at the address and check the manhole nearest the house", "Clear the blockage if it is in the street sewer", "Tell the customer what was found and what happens next", "Record the cause and the work done"], why: "The call is logged, the street sewer is checked, the cause is dealt with, the customer is told, and the paperwork closes the job.", max: 6 },
    // General knowledge (lift station alarm check)
    { d: "m", process: "checking a lift station after a high-level alarm", steps: ["Read the alarm message and note its time", "Arrive at the station and note the wet well level", "Check whether the pumps are running and moving flow", "Find and clear the cause, such as a clogged pump or a tripped breaker", "Confirm the wet well level is dropping", "Reset the alarm and log what was found"], why: "The alarm is read, the station is looked over, the cause is found and cleared, the result is confirmed, and the alarm is reset and logged.", max: 6 },
    // General knowledge (overflow cleanup)
    { d: "m", process: "cleaning up after a sewage overflow has stopped", steps: ["Clear the blockage that caused the overflow", "Recover the spilled wastewater with a vacuum truck", "Wash down the area with clean water", "Apply disinfectant to the affected ground", "Leave the area clean and take down the warning signs"], why: "The source is stopped, spilled wastewater is recovered, the area is washed, disinfected, and the warnings come down last.", max: 6 },
    // General knowledge (trench work)
    { d: "e", process: "digging a trench for a sewer repair", steps: ["Get the buried utilities marked", "Dig the trench with the spoil piled back from the edge", "Install trench protection or slope the walls", "Climb down the ladder into the protected trench", "Repair the pipe", "Backfill in layers and compact the soil"], why: "Utilities are located before digging, the walls are protected before anyone enters, and backfilling follows the repair.", max: 6 },
    // General knowledge (odour complaint)
    { d: "e", process: "following up a sewer odour complaint", steps: ["Record the caller's address and what the odour is like", "Visit the area and confirm the odour", "Check nearby manholes, vents and the lift station for the source", "Correct the cause, such as cleaning grease or reseating a cover", "Call the customer back to confirm the odour is gone"], why: "The details are logged, the odour is confirmed, the source is found and corrected, and the customer is contacted last.", max: 6 }
  ],
  relations: [
    // General knowledge (grease, roots and debris)
    ["e", "Residents stop pouring cooking fat down their drains.", "the grease building up in the sewer", "decrease", "Less fat enters the pipe, so less sticks to the wall."],
    ["e", "A restaurant skips pumping its grease trap for months.", "the grease reaching the street sewer", "increase", "A full trap stops catching grease, so it passes through."],
    ["m", "Roots are left growing in a sewer joint for several years.", "the carrying capacity of the pipe", "decrease", "Roots thicken and snag debris, narrowing the pipe."],
    ["m", "A sewer in a root-prone area is cleaned on a regular schedule.", "the chance of a root stoppage", "decrease", "Regular cutting keeps roots from filling the pipe."],
    ["e", "Customers flush wipes in larger numbers.", "the clogging of lift station pumps", "increase", "Wipes tangle around impellers and build into clogs."],
    ["m", "A sag develops in a flat sewer.", "the solids settling at that spot", "increase", "The low spot slows the flow, so solids drop out."],
    ["m", "A bucket machine removes a heap of sand and gravel from a flat sewer.", "the carrying capacity of the pipe", "increase", "Clearing the deposit opens the pipe again."],
    ["e", "A blockage forms in the sewer just downstream of a house.", "the chance of a basement backup at that house", "increase", "Flow has nowhere to go, so it backs up toward the building."],
    ["m", "A stoppage is cleared and the line is flushed.", "the water level in the upstream manhole", "decrease", "Flow moves on again, so the water drains down."],
    // General knowledge (inflow and infiltration)
    ["e", "A manhole cover is left off during work and heavy rain starts.", "the stormwater entering the sewer", "increase", "Runoff can pour straight into the open manhole."],
    ["m", "An old cracked service line is replaced.", "the infiltration entering from that line", "decrease", "A sound pipe keeps groundwater out."],
    ["e", "A heavy rainstorm falls on an area with leaky sewers.", "the flow arriving at the lift station", "increase", "Rain finds its way into cracks and joints."],
    // General knowledge (lift stations and force mains)
    ["e", "A lift station float switch becomes coated in grease.", "the accuracy of the level signal", "decrease", "A coated float may stick and send a false level."],
    ["e", "A rag clog stops a lift station pump.", "the water level in the wet well", "increase", "Inflow continues while the pump no longer removes it."],
    ["m", "A lift station alarm is set to call the operator by phone.", "the time before staff hear of a problem", "decrease", "The call reaches staff soon after the alarm trips."],
    ["m", "A standby generator at a lift station is exercised on a schedule.", "the chance the station fails in a power outage", "decrease", "Problems are found and fixed before they matter."],
    ["m", "Wastewater sits in a long force main with little pumping.", "the hydrogen sulfide in the wastewater", "increase", "Long holding time uses up oxygen and lets sulfide form."],
    // General knowledge (safety and emergency response)
    ["e", "A crew ventilates a manhole and tests the air before entry.", "the risk of workers breathing harmful gas", "decrease", "Testing finds the hazard and ventilation clears it."],
    ["e", "Cones and advance warning signs are set out before work begins on a road.", "the risk of a driver striking the crew", "decrease", "Drivers get warning and room to slow down."],
    ["m", "Barricades and signs are placed around a sewage overflow.", "the chance of the public touching the wastewater", "decrease", "People are kept back from the contaminated area."],
    // General knowledge (changes that do not touch the system)
    ["e", "A new set of system maps is printed for the crew trucks.", "the infiltration entering the sewer", "unchanged", "A printed map does not change the pipes or the groundwater."],
    ["m", "A camera is pulled through a clean, flowing sewer for inspection.", "the carrying capacity of the pipe", "unchanged", "Looking inside the pipe does not change its size or condition."],
    ["e", "The control panel at a lift station is repainted.", "the pumping capacity of the station", "unchanged", "Paint is cosmetic and does not touch the pumps."]
  ],
  flaws: [
    // General knowledge
    { d: "e", prompt: "Which statement about grease in sewers is wrong?", flawed: "Hot water makes grease safe to pour down drains", goods: ["Grease cools and hardens on the pipe wall, narrowing it over time", "Scraping plates into the garbage cuts the grease going down drains", "A buildup of grease holds other debris and starts blockages"], explanation: "Hot water only moves the grease along. It cools farther down the line and sticks to the wall." },
    { d: "e", prompt: "Which statement about tree roots is wrong?", flawed: "Roots punch through solid pipe walls", goods: ["Roots usually get in at joints and cracks in the pipe", "Roots grow toward the moisture that leaks from the pipe", "Roots tend to grow back after they are cut out"], explanation: "Roots need a joint or crack to enter, and the moisture there draws them in." },
    { d: "m", prompt: "Which statement about lift station wet wells is wrong?", flawed: "A grease cap on the wet well is harmless", goods: ["Grease and rags can foul the floats and send false levels", "Wet wells are cleaned to remove grease and settled solids", "Rags can build up in a wet well and clog the pumps"], explanation: "A grease cap fouls floats, clogs pumps and gives off strong odour, so wet wells are cleaned." },
    { d: "e", prompt: "Which statement about flushed items is wrong?", flawed: "Wipes sold as flushable break up like toilet paper", goods: ["Wipes and rags can wrap around impellers and clog pumps", "Wipes caught on roots or grease can start a blockage", "Toilet paper breaks up in water, but wipes do not"], explanation: "Wipes hold together, so they tangle in pipes and pumps instead of breaking up." },
    { d: "m", prompt: "Which statement about camera inspection records is wrong?", flawed: "Footage is deleted once the report is written", goods: ["Saved video lets crews compare a pipe from year to year", "A footage counter ties each defect to its distance in the pipe", "Defects are coded by type and by location in the pipe"], explanation: "Saved video and reports build a history of the pipe that is used to plan repairs." },
    { d: "e", prompt: "Which statement about gas hazards is wrong?", flawed: "Opening the cover for a minute clears the air", goods: ["Harmful gases and low oxygen are often invisible", "Air is tested before and during manhole entry", "Hydrogen sulfide can dull the sense of smell at high levels"], explanation: "Gas and low oxygen can remain in a manhole after the cover is off, so the air is tested." },
    { d: "m", prompt: "Which statement about basement backup calls is wrong?", flawed: "Guess at the cause when talking to the customer", goods: ["Record the address, time and what the customer sees", "Check the street sewer before blaming the private line", "Treat the call as urgent because of the health risk"], explanation: "The cause is confirmed by checking the sewer, not guessed at on the phone." },
    { d: "m", prompt: "Which statement about work on a roadway is wrong?", flawed: "Signs are set out after the crew starts work", goods: ["Drivers get advance warning before they reach the work area", "Crew members wear high-visibility clothing in the work zone", "Cones guide traffic around the work area and the open manhole"], explanation: "Warning signs go up before work starts so drivers have time to slow down." },
    { d: "m", prompt: "Which statement about trench safety is wrong?", flawed: "Loose, wet soil holds its shape without support", goods: ["Spoil is piled back from the edge to keep load off the wall", "Trench protection is installed before workers enter", "A ladder or ramp gives workers a way out of the trench"], explanation: "Loose or wet soil slumps easily, so walls are protected before anyone goes in." },
    { d: "e", prompt: "Which statement about hygiene on wastewater jobs is wrong?", flawed: "Eating on the job is fine with gloved hands", goods: ["Hands are washed with soap before eating or drinking", "Cuts and scrapes are cleaned and covered before work starts", "Soiled clothing is changed before going home"], explanation: "Gloves can carry germs, so hands are washed before food or drink." }
  ]
};
export default data;
