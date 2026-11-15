// Class 1 Wastewater Collection, western exam course, gap-fill table g1.
// Fills topics a coverage check found thin: public health principles for collection crews, flow monitoring
// equipment, electrical controls and security at collection sites.
// Entry-level general operator knowledge in original wording. No book text is stored in the repo.
// Each row rests on well-established operator knowledge, so each section is marked "General knowledge".
import type { CourseData } from "../build";
const data: CourseData = {
  courseKey: "wpi-class1-water-coll",
  facts: [
    // General knowledge (public health principles)
    ["e", "Wastewater carries bacteria, viruses and parasites that can make collection workers sick.", true, "Human waste puts disease-causing organisms in the flow, so contact with it is treated as a health risk."],
    ["e", "Germs from wastewater can enter the body through the mouth, broken skin and the eyes.", true, "Swallowing, open cuts and splashes to the eyes are the usual routes, which is why hygiene and protective gear matter."],
    ["m", "Workers who handle wastewater are encouraged to talk with a health professional about vaccinations.", true, "Vaccines can protect against some diseases linked to sewage work, but the right ones depend on the person and the job."],
    ["e", "Eating, drinking and smoking are kept out of work areas so germs are not carried from hands to the mouth.", true, "Hands and gloves pick up contamination, so food and tobacco stay away from the job."],
    ["e", "A small cut on the hand can be left uncovered if it does not hurt.", false, "Even a small break in the skin lets germs in, so cuts are cleaned and covered with a waterproof dressing before work."],
    ["m", "Hand sanitizer is a full replacement for soap and water on hands soiled by wastewater.", false, "Sanitizer works poorly on dirty hands. Soap and clean running water remove both the dirt and the germs."],
    ["m", "Wastewater is a health risk when swallowed but harmless on the skin and in the eyes.", false, "Germs can reach the body through broken skin and the eyes as well as the mouth."],
    ["m", "A dead rat in a manhole is safe to pick up bare-handed because wastewater has washed it clean.", false, "Animals can carry disease and wastewater does not clean them, so crews use tools and gloves and avoid direct contact."],
    // General knowledge (flow monitoring equipment)
    ["e", "A depth sensor in a sewer measures how deep the wastewater is in the pipe.", true, "Depth is the starting point for working out how much flow is passing."],
    ["m", "An area-velocity meter works out flow by combining the depth of the flow with its speed.", true, "Depth gives the area of the flow and the sensor reads the velocity. Together they give the flow rate."],
    ["m", "A portable flow logger records readings at set intervals so the flow pattern can be reviewed later.", true, "The stored data is downloaded after the logger has been in place for a period of time."],
    ["m", "A rise in flow that begins soon after rain starts and falls soon after it stops points to inflow.", true, "Inflow enters quickly from surface sources and drains away quickly when the rain ends."],
    ["e", "A rain gauge measures the depth of wastewater flowing in a pipe.", false, "A rain gauge measures rainfall. Depth sensors read the level of the flow in the pipe."],
    ["m", "Silt or grease on a depth sensor makes no difference to its readings because the sensor is waterproof.", false, "Silt, grease and slime can coat or bury the sensor and give false readings, so sensors are cleaned and checked."],
    ["m", "A newly installed meter is trusted without comparing its depth reading to a manual measurement.", false, "A quick check against a measured depth shows whether the sensor is reading correctly."],
    ["h", "Infiltration shows up as a flow peak that starts and ends with each rain shower.", false, "Inflow responds quickly to rain. Infiltration rises slowly as the ground wets and falls slowly as it dries."],
    // General knowledge (electrical controls)
    ["m", "A motor starter switches a pump motor on and off and protects it with an overload device.", true, "The starter connects the motor to its power supply and opens the circuit if the current stays too high."],
    ["m", "Pump alternation shares the run time between pumps so wear is spread out.", true, "Taking turns as the lead pump keeps one pump from doing the work while the other sits idle."],
    ["h", "A tripped breaker is investigated before it is reset because the cause may still be present.", true, "Resetting without a check can repeat the fault and damage the motor or wiring."],
    ["e", "A pump that will not start is fixed by replacing the pump right away.", false, "Simple causes such as a tripped breaker, a blown fuse or a switch in the wrong position are checked first."],
    ["m", "A control panel door can be left open at a lift station because the wiring inside is low voltage.", false, "Panels hold energized parts and are kept closed and locked to protect people and keep out moisture and tampering."],
    ["m", "A pump switched off at the panel is safe to work on without locking out the power.", false, "A switch can be turned back on by someone else, so the power is locked and tagged and the circuit is tested."],
    // General knowledge (security at collection sites)
    ["e", "A locked fence and gate around a lift station keep out people and animals that could be hurt or cause damage.", true, "Physical barriers slow entry and protect both the public and the equipment."],
    ["m", "A lock or bolted cover makes a manhole harder to open for people who have no reason to be in the sewer.", true, "A loose cover is a fall and entry hazard and invites vandalism."],
    ["m", "Chemicals stored at a station are kept in a locked, labelled area.", true, "Locks and labels keep hazardous products from misuse and let crews know what is stored."],
    ["e", "An unlocked hatch at a lift station is harmless because few people know it is there.", false, "An open hatch is a fall and entry hazard and invites vandalism or dumping."],
    ["m", "A crew that finds a broken lock or dumped material at a station can leave it unreported if it looks minor.", false, "Damage and dumping are reported to a supervisor so the site is secured and any hazard is dealt with."]
  ],
  boards: [
    // General knowledge (routes of infection)
    { d: "m", prompt: "Match each route of infection to an example of how it happens.", pairs: [["Swallowing", "Eating or smoking with dirty hands"], ["Open wound", "Wastewater touching a cut or scrape"], ["Eye splash", "Spray from a hose or pump"], ["Breathing", "Inhaling mist from spraying water"], ["Animal bite", "A bite from a sewer rat"], ["Needlestick", "A sharp piercing the skin through a glove"]] },
    // General knowledge (flow monitoring items)
    { d: "e", prompt: "Match each flow monitoring item to its job.", pairs: [["Depth sensor", "Measures how deep the flow is"], ["Velocity sensor", "Measures how fast the flow moves"], ["Rain gauge", "Records how much rain has fallen"], ["Flow logger", "Stores readings at set intervals"], ["Flume", "Narrowed channel that links depth to flow"], ["Weir", "Crest the water spills over so depth gives the flow"]] },
    // General knowledge (lift station electrical items)
    { d: "m", prompt: "Match each lift station electrical item to its job.", pairs: [["Motor starter", "Switches the pump motor on and off"], ["Float switch", "Senses the level in the wet well"], ["Circuit breaker", "Opens the circuit on high current and is reset"], ["Alternator", "Takes turns choosing which pump leads"], ["Telemetry unit", "Sends alarm signals to staff away from the site"], ["Lockout lock", "Keeps power from returning during repair work"]] }
  ],
  oddSets: [
    // General knowledge (flow monitoring devices)
    { d: "m", rule: "a device that measures or records wastewater flow", members: ["Area-velocity meter", "Portable flow logger", "Parshall flume", "V-notch weir", "Depth sensor", "Velocity sensor"], intruders: ["Pipe camera", "Gas detector", "Pipe locator"], why: "{odd} is used for inspection or safety work and does not measure flow.", max: 5 }
  ],
  sequences: [],
  relations: [
    // General knowledge (public health)
    ["e", "A crew member eats lunch in the truck cab right after clearing a stoppage, without washing.", "the chance of swallowing germs from wastewater", "increase", "Germs on the hands move to the food and then to the mouth."],
    ["m", "Soiled work clothes are washed with the family laundry at home.", "the chance of germs spreading to the household", "increase", "Contaminated clothing carries germs into the home and onto other laundry."],
    ["m", "A worker covers a cut with a waterproof dressing and wears gloves before wastewater work.", "the chance of germs entering through the skin", "decrease", "The dressing and gloves block contact between the wound and wastewater."],
    // General knowledge (flow monitoring)
    ["e", "Grease and slime build up on the face of a depth sensor.", "the accuracy of the depth readings", "decrease", "A coated sensor reads the wrong level."],
    ["h", "A meter is installed in a straight run of pipe instead of just below a drop.", "the steadiness of the velocity readings", "increase", "Smooth flow gives steadier readings, while turbulence at drops and bends makes them jump."],
    ["m", "Leaking joints are sealed in a section where a meter showed high wet weather flow.", "the wet weather flow measured in that section", "decrease", "Less water enters through the joints, so the peak flow drops."],
    // General knowledge (electrical controls)
    ["m", "A pump alternator is fitted at a lift station with two pumps.", "the difference in run time between the two pumps", "decrease", "Taking turns as the lead pump evens out the hours each pump runs."],
    ["m", "A telemetry alarm unit loses its battery backup during a power outage.", "the chance that staff hear of a high-level condition", "decrease", "Without power the unit cannot send its alarm signal."],
    // General knowledge (security)
    ["e", "A damaged station fence and gate lock are repaired promptly.", "the chance of unauthorized entry to the station", "decrease", "A sound fence and lock keep people out."]
  ],
  flaws: [
    // General knowledge (public health)
    { d: "e", prompt: "Which statement about protective clothing for wastewater work is wrong?", flawed: "Wet work clothes are fine in the lunchroom", goods: ["Waterproof gloves keep wastewater off the hands", "Splash protection guards the eyes and face from spray", "Work boots are washed down after a messy job"], explanation: "Soiled clothing carries germs, so it stays out of eating areas and is changed before a break." },
    { d: "m", prompt: "Which statement about handling contaminated tools and surfaces is wrong?", flawed: "Wiping a tool with a dry rag leaves it clean", goods: ["Soiled tools are washed and disinfected after the job", "Door handles and steering wheels pick up germs from dirty gloves", "Spills on a truck floor are cleaned and disinfected"], explanation: "A dry wipe leaves germs behind, so tools are washed and disinfected." },
    // General knowledge (flow monitoring)
    { d: "m", prompt: "Which statement about installing and checking a flow meter is wrong?", flawed: "Meter position makes no difference to readings", goods: ["Sensors are placed where the flow is smooth and steady", "Readings are compared with a manual depth check after install", "The location and sensor depth are written in the site log"], explanation: "Turbulence, drops and bends upset the readings, so the location is chosen with care." },
    { d: "m", prompt: "Which statement about flow data and rainfall is wrong?", flawed: "Rain records add little to a study of flow peaks", goods: ["A flow peak soon after rain starts suggests inflow", "A slow rise after long rain suggests infiltration", "Steady extra flow overnight can point to groundwater leaking in"], explanation: "Matching rain records to flow peaks shows how much of the flow comes from rain." },
    // General knowledge (electrical controls)
    { d: "e", prompt: "Which statement about troubleshooting a pump that will not start is wrong?", flawed: "Keep resetting the breaker until the pump runs", goods: ["Look for a tripped breaker or blown fuse before anything else", "Check that the level control is calling for the pump to run", "Lock out the power before touching pump wiring"], explanation: "A breaker that keeps tripping points to a fault, so the cause is found before power is restored." },
    { d: "h", prompt: "Which statement about control panels and alarms is wrong?", flawed: "A silenced alarm needs no further follow-up", goods: ["Panel doors are kept closed to keep out moisture and tampering", "A telemetry unit sends alarm signals to staff away from the station", "Alarm and level settings are tested on a regular schedule"], explanation: "Silencing stops the noise but the fault remains, so the cause is found and fixed." },
    // General knowledge (security)
    { d: "m", prompt: "Which statement about security at collection sites is wrong?", flawed: "A stranger at a station is best ignored", goods: ["Locks and fences are checked for damage on routine visits", "Vandalism and dumping are reported so sites can be secured", "Alarms alert staff when someone enters a station without permission"], explanation: "Unfamiliar people near equipment are reported to a supervisor, and crews avoid confronting them." }
  ]
};
export default data;
