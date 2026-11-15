// Class 1 Water Treatment, western exam course, gap-fill table g1.
// Fills topics a coverage check found thin: blowers and compressors, dechlorination, plant security,
// and generators and engines.
// Entry-level general operator knowledge in original wording. No book text is stored in the repo.
// Each row rests on well-established operator knowledge, so each section is marked "General knowledge".
import type { CourseData } from "../build";
const data: CourseData = {
  courseKey: "wpi-class1-water",
  facts: [
    // General knowledge (blowers and compressors)
    ["e", "A blower supplies the air used for aeration and for scouring filter media during a wash.", true, "Air is moved through diffusers or the filter underdrain, so a blower is part of the treatment process."],
    ["m", "A relief valve on a blower discharge line opens to protect the machine and piping if pressure climbs too high.", true, "A blocked or closed discharge line would otherwise overload the blower and the pipe."],
    ["e", "The oil level in a blower is checked before start-up and on routine rounds.", true, "Low oil leads to bearing and gear wear and a costly breakdown."],
    ["m", "Starting a positive displacement blower against a shut discharge valve is normal practice.", false, "This type keeps pushing air into a blocked line, so pressure builds fast and the blower or pipe can be damaged."],
    ["m", "A plugged intake air filter has little effect on how a blower performs.", false, "A restricted intake cuts the air delivered and raises discharge temperature and motor strain."],
    ["e", "Blower noise is harmless, so hearing protection is not needed in the blower room.", false, "Blowers are loud, and hearing damage builds up with repeated exposure."],
    // General knowledge (dechlorination)
    ["e", "Water is dechlorinated before release to a stream because leftover chlorine harms fish and other aquatic life.", true, "Even a small chlorine residual is toxic to many water organisms."],
    ["m", "Sulfur dioxide, sodium bisulfite and sodium sulfite each remove chlorine by reacting with it.", true, "These sulfur-based chemicals change chlorine into harmless chloride and sulfate."],
    ["m", "Sulfur dioxide gas calls for leak detection and ventilation in the feed room, much like chlorine gas.", true, "It is a toxic gas that is harmful to breathe, so the room is set up for safe handling."],
    ["m", "Sulfite-based dechlorination chemicals raise the dissolved oxygen of the water.", false, "They use up dissolved oxygen as they react, so the oxygen level in the discharge tends to fall."],
    ["e", "Once the dechlorination feed is running, the water no longer needs to be tested for chlorine.", false, "A residual test after the feed point confirms that the chlorine is really gone."],
    ["m", "Filter backwash water that carries a chlorine residual is released to a creek without checking it.", false, "The residual is checked and removed or handled as local requirements direct before the water is released."],
    // General knowledge (plant security)
    ["e", "A fence with a locked gate helps keep people with no reason to be at the plant away from it.", true, "A physical barrier slows entry and makes unwanted visitors easy to notice."],
    ["m", "Visitors sign in and wear a badge so staff know who is on site.", true, "A log and badge show who is present and where they are allowed to go."],
    ["e", "Suspicious activity near an intake, well or chemical storage is reported to a supervisor and the proper authorities.", true, "Early reports let others act before tampering or theft does harm."],
    ["e", "Propping a door open for convenience is fine if staff are working nearby.", false, "An open door lets people in unseen and defeats the lock and alarm on it."],
    ["m", "Chemical storage areas are left unlocked in the daytime because staff walk past them often.", false, "Chemicals are a hazard in the wrong hands, so the storage area is kept locked."],
    ["m", "Computer control systems need no password protection because they sit inside the plant fence.", false, "A fence does not stop network threats, so logins and passwords protect the controls."],
    // General knowledge (generators and engines)
    ["e", "A standby generator supplies power to chosen loads at a treatment plant when the utility power fails.", true, "Pumps, disinfection and controls keep running during the outage."],
    ["m", "An automatic transfer switch senses a power loss, starts the generator and moves the load once the generator is ready.", true, "The switch also keeps generator power from feeding back onto the utility lines."],
    ["m", "A weak starting battery and old fuel are common reasons a standby engine fails to start.", true, "Both are checked on routine visits so the unit starts when it is needed."],
    ["m", "A standby generator that started well last year does not need regular exercise runs.", false, "Exercise runs on a schedule, ideally with a load, prove that it will start and carry the plant."],
    ["h", "Lights and office heating are fed from the generator ahead of disinfection and controls, since comfort comes first.", false, "Process-critical loads such as disinfection, key pumps and controls come first when generator power is limited."]
  ],
  boards: [
    // General knowledge (blowers and compressors)
    { d: "m", prompt: "Match each blower part to its purpose.", pairs: [["Intake air filter", "Keeps dust out of the machine and the air stream"], ["Relief valve", "Opens to release air if discharge pressure gets too high"], ["Silencer", "Cuts the noise of the air pulses"], ["Oil sight glass", "Shows the lubricating oil level"], ["Discharge check valve", "Stops air or water from flowing back into a stopped blower"], ["Belt guard", "Keeps hands and clothing away from the moving drive"]] },
    // General knowledge (dechlorination)
    { d: "m", prompt: "Match each dechlorination term to its meaning.", pairs: [["Sulfur dioxide", "Gas that reacts with chlorine once it is dissolved in water"], ["Sodium bisulfite", "Liquid chemical fed by a metering pump to remove chlorine"], ["Residual test", "Shows whether chlorine is still present after the feed point"], ["Overfeed", "Wastes chemical and lowers the dissolved oxygen"], ["Mixing point", "Place where the chemical is blended into the flow"], ["Receiving stream", "Water body protected by removing the chlorine"]] },
    // General knowledge (plant security)
    { d: "e", prompt: "Match each security measure to what it does.", pairs: [["Perimeter fence", "Marks the boundary and slows unwanted entry"], ["Intrusion alarm", "Signals that a door or gate was opened without permission"], ["Visitor log", "Records who came to the plant and when"], ["Security camera", "Records activity so events can be reviewed later"], ["Strong password", "Protects computer and control system logins"], ["Security lighting", "Lets staff and cameras see the site after dark"]] }
  ],
  oddSets: [
    // General knowledge (dechlorination)
  ],
  sequences: [],
  relations: [
    // General knowledge (blowers and compressors)
    ["m", "The intake filter of a blower is left to plug with dust.", "the air flow the blower delivers", "decrease", "A restricted intake starves the blower, so less air is moved."],
    ["e", "A blower runs in a closed room with poor ventilation on a warm day.", "the temperature of the machine and its oil", "increase", "Heat from the blower has nowhere to go, so the room and the machine warm up."],
    // General knowledge (dechlorination)
    ["m", "Excess sodium bisulfite is fed into chlorinated water.", "the dissolved oxygen in the discharge", "decrease", "The extra chemical keeps reacting and uses up oxygen."],
    ["e", "A dechlorination feed pump is started on water that carries a chlorine residual.", "the chlorine residual after the feed point", "decrease", "The chemical reacts with the chlorine and removes it."],
    ["m", "The chlorine dose ahead of the dechlorination point is raised and the dechlorination feed stays the same.", "the chlorine left in the discharge", "increase", "The feed no longer matches the chlorine present, so some passes through."],
    // General knowledge (plant security)
    ["e", "A well house door is left unlocked overnight.", "the chance of tampering at the well", "increase", "An unlocked door gives easy entry to anyone passing by."],
    ["m", "Intrusion alarms at the plant are tested on a routine schedule.", "the chance that an alarm fails when it is needed", "decrease", "Testing finds dead batteries and faults before a real event."],
    // General knowledge (generators and engines)
    ["m", "Standby generator fuel sits in the tank for years without being tested or treated.", "the chance of fuel problems at start-up", "increase", "Old fuel collects water and sludge that plug filters."],
    ["m", "The starting battery and its charger are checked on a routine schedule.", "the chance that the engine fails to crank", "decrease", "Weak batteries are found and replaced before an outage."]
  ],
  flaws: [
    // General knowledge (blowers and compressors)
    { d: "m", prompt: "Which statement about starting a blower is wrong?", flawed: "Guards go on after the first test run", goods: ["The oil level is checked before the first start", "Guards are fitted over the belts and couplings", "Intake and discharge paths are confirmed to be clear"], explanation: "Guards are fitted before the machine turns, since moving belts and couplings can catch hands and clothing." },
    // General knowledge (dechlorination)
    { d: "e", prompt: "Which statement about checking dechlorinated water is wrong?", flawed: "Chlorine is assumed gone once the pump runs", goods: ["A residual test confirms that the chlorine is gone", "Samples are taken after the chemical has mixed in", "Test results are written in the plant log"], explanation: "A running pump does not prove the chlorine is gone, so the water is tested." },
    { d: "m", prompt: "Which statement about sulfur dioxide is wrong?", flawed: "Sulfur dioxide gas is harmless to breathe", goods: ["Leak detection and ventilation are kept in the feed room", "Cylinders are chained so they do not tip over", "Staff are trained before they handle the gas"], explanation: "Sulfur dioxide is a toxic gas, so it is handled with detection, ventilation and training." },
    // General knowledge (plant security)
    { d: "m", prompt: "Which statement about plant keys and access is wrong?", flawed: "Spare keys hang on a hook by the door", goods: ["Keys are signed out and returned on a log", "Lost keys are reported so locks can be changed", "Access cards are turned off when staff leave"], explanation: "Keys left in the open defeat the locks, so keys are controlled and tracked." },
    // General knowledge (generators and engines)
    { d: "m", prompt: "Which statement about a standby generator is wrong?", flawed: "Exercise runs are skipped in busy weeks", goods: ["Fuel and coolant levels are checked on routine rounds", "Run times and problems are written in a log", "The transfer switch is tested along with the generator"], explanation: "Exercise runs are kept on schedule, since a busy plant is the one that suffers most in an outage." }
  ]
};
export default data;
