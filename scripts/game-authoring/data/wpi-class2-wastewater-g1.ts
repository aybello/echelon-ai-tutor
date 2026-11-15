// Class 2 Wastewater Treatment, western exam course, gap-fill table g1.
// Fills topics a coverage check found thin: plant security, public relations and complaints,
// flow equalization, dissolved air flotation, and generators and engines for plants.
// Working-knowledge general operator content in original wording. No book text is stored in the repo.
// Each row rests on well-established operator knowledge, so each section is marked "General knowledge".
import type { CourseData } from "../build";
const data: CourseData = {
  courseKey: "wpi-class2-wastewater",
  facts: [
    // General knowledge (plant security)
    ["e", "Visitors and contractors sign in on arrival and sign out on leaving, so staff know who is on site.", true, "A sign-in record shows who is in the plant and when they came and went."],
    ["m", "Access to chemical and gas storage is given by job need, and keys or cards are collected when someone changes duties.", true, "Access that follows the job keeps hazardous areas limited to people with a reason to be there."],
    ["m", "Unknown memory sticks are kept out of control system computers because they can carry malware into the process network.", true, "A removable device is an easy path for malware past a firewall."],
    ["m", "An intrusion alarm that trips at night is reset and left unreported if no damage is seen.", false, "Each alarm is reported and checked, since a probe or a faulty sensor both need follow-up."],
    ["m", "One shared login for the whole shift makes the control system more secure because fewer passwords need protecting.", false, "Shared logins hide who made a change and are hard to withdraw when staff leave."],
    ["h", "An email asking for a control system password is safe to answer when it appears to come from the head office.", false, "Senders can be faked, so a request for credentials is confirmed through a known contact before anything is shared."],
    // General knowledge (public relations and complaints)
    ["m", "Staff who speak with a neighbour about odour acknowledge the concern and explain what is being checked.", true, "Listening and showing action calms most complaints and keeps the relationship workable."],
    ["m", "A short follow-up call telling a complainant what was found builds goodwill even when the source stays unclear.", true, "People accept an unclear result better than silence."],
    ["e", "Tour groups are briefed on safety, given protective equipment where needed and kept to a planned route.", true, "Guests do not know the hazards, so the plant sets the rules before the tour starts."],
    ["m", "An operator tells a noise complainant that the plant was there first and the neighbour should accept it.", false, "A dismissive reply turns a small complaint into a dispute, so the concern is noted and passed on for review."],
    ["m", "Calls from people who decline to give a name are not recorded.", false, "The time, place and nature of the problem are still useful, so the call is logged without a name."],
    ["h", "A bypass notice says the water is safe to touch before sample results are known.", false, "Statements stay with confirmed facts, and protective advice is cautious until results are in."],
    // General knowledge (flow equalization)
    ["m", "Equalization gives a steadier load of organic matter to the biological process because strong and weak flows are blended in storage.", true, "Blending narrows the swings in strength reaching the aeration tanks."],
    ["m", "Odour from an equalization basin is reduced by keeping the contents aerobic and by covering or ventilating the basin.", true, "Fresh contents give off less foul gas, and a cover lets odorous air be collected."],
    ["m", "Wet-weather flow held in a basin is released to the plant once the process has spare capacity.", true, "The basin shifts the peak to a time when the plant can handle it."],
    ["m", "Equalization changes the total volume of wastewater the plant treats in a day.", false, "The basin shifts the timing of flow, but the daily volume is the same."],
    ["h", "Solids flushed from a cleaned basin are best sent on to the plant in a single quick slug.", false, "A slug of heavy solids is a shock load, so cleanings are metered to the plant gradually."],
    ["m", "Foam and scum on an equalization basin surface show that the contents are fresh and need no attention.", false, "Scum builds up, blocks level sensors and adds odour, so it is removed."],
    // General knowledge (dissolved air flotation)
    ["m", "Skimmers remove the float from the surface of a flotation tank, while heavy solids that settle are drawn from the bottom.", true, "Two removal paths are needed because most solids float but some still sink."],
    ["m", "Coagulant and polymer dose for a flotation unit is chosen with jar tests, since floc strength decides how well bubbles lift solids.", true, "Jar tests show which dose gives a floc that attaches to bubbles."],
    ["m", "Flotation suits wastewater with fats, oils and light solids that settle poorly.", true, "Bubbles lift material that is nearly as light as water, where settling would be slow."],
    ["h", "A smooth, even cloud of bubbles across the tank is a sign that the air release nozzles are plugging.", false, "Plugging gives patchy or uneven bubbles, while an even cloud means the nozzles are working."],
    // General knowledge (generators and engines for plants)
    ["m", "A transfer switch moves plant load between utility power and the generator, and keeps the two sources from feeding the same line at once.", true, "The switch isolates one source before connecting the other to protect equipment and crews."],
    ["m", "Standby engines are run on a schedule, and with a load, so faults show up before a real outage.", true, "A machine that sits idle develops starting and fuel problems that load testing reveals."],
    ["m", "A generator that starts on a short unloaded run is proven ready to carry the plant through an outage.", false, "Carrying load tests the cooling, fuel supply and the transfer scheme, which an unloaded start does not."],
    ["h", "Stored diesel keeps its quality for years without testing or turnover.", false, "Fuel can gather water, sediment and growth, so it is tested and rotated."],
  ],
  boards: [
    // General knowledge (plant security)
    { d: "m", prompt: "Match each security measure to what it does.", pairs: [["Perimeter fence", "Marks the site boundary and slows entry"], ["Intrusion alarm", "Alerts staff when a door or gate is forced"], ["Visitor log", "Records who was on site and when"], ["Firewall", "Filters traffic between the control network and outside networks"], ["Security lighting", "Makes people and activity visible at night"], ["Key register", "Tracks who holds keys to restricted rooms"]] },
    // General knowledge (public relations and complaints)
    { d: "m", prompt: "Match each public contact situation to the best response.", pairs: [["Caller asks about health risk", "Refer to the person responsible for such questions"], ["Reporter asks who is to blame", "Pass to the designated spokesperson"], ["Neighbour reports an odour", "Log the time, place and what was smelled"], ["School asks for a visit", "Arrange a guided tour with a safety briefing"], ["Complainant is waiting for news", "Call back with what was found"], ["Overflow reaches a public area", "Post a plain-language notice at the site"]] },
    // General knowledge (flow equalization)
    { d: "m", prompt: "Match each equalization problem or feature to its effect.", pairs: [["Floor solids buildup", "Storage volume shrinks over time"], ["Basin full before a storm", "Little room is left for the peak"], ["Pump-back set too high", "Peak load passes on to the plant"], ["Aeration in the basin", "Keeps the contents fresh"], ["High level alarm", "Warns before the basin overflows"], ["Cover and ventilation", "Collects odorous air for treatment"]] }
  ],
  oddSets: [],
  sequences: [],
  relations: [
    // General knowledge (plant security)
    ["m", "A lost key is reported right away and the lock or access code is changed.", "the chance of unauthorized entry through that key", "decrease", "A changed lock makes the lost key useless."],
    ["m", "Control system computers are used for web browsing and personal email.", "the chance of malware reaching the process controls", "increase", "Browsing and email are common ways for malware to enter a network."],
    ["h", "A door alarm is fitted to the chlorine room and tested on a routine schedule.", "the chance that a forced entry goes unnoticed", "decrease", "A tested alarm alerts staff to entry that would otherwise be missed."],
    // General knowledge (public relations and complaints)
    ["m", "Odour complaints are logged with the time, wind direction and plant activity.", "the ability to link complaints to a cause", "increase", "Matching complaints to conditions shows the pattern behind the odour."],
    ["m", "Staff answer a noise complaint in a defensive tone and offer no check.", "the chance the neighbour pursues the complaint further", "increase", "A dismissive answer leaves the caller feeling ignored."],
    ["h", "A plain-language notice goes up promptly after a bypass.", "rumour and mistrust among residents", "decrease", "Early, clear information leaves less room for guesses."],
    // General knowledge (flow equalization)
    ["m", "An equalization basin is placed ahead of the aeration tanks.", "the swings in organic load reaching the aeration process", "decrease", "Blending strong and weak flows evens out the load."],
    ["m", "Mixing and aeration in the basin are out of service for several days.", "the odour from the basin", "increase", "The stored wastewater turns septic without air and mixing."],
    ["h", "The basin is drawn down at the end of each wet-weather event.", "the empty volume ready for the next peak", "increase", "Emptying restores the storage that the next surge needs."],
    // General knowledge (dissolved air flotation)
    ["m", "The air release nozzles of a flotation unit partly plug with scale.", "the evenness of the bubble cloud", "decrease", "Blocked nozzles give patchy bubbles across the tank."],
    ["h", "The skimmer speed is slowed to match the rate of float build-up.", "the water content of the float", "decrease", "Float has time to drain before it is removed."],
    // General knowledge (generators and engines for plants)
    ["m", "The standby generator is exercised under load on a regular schedule.", "the chance of a failure to carry load in a real outage", "decrease", "Load tests reveal weak parts before the plant depends on them."],
    ["h", "Several large motors are started at the same moment on generator power.", "the chance of overloading the generator", "increase", "Starting surges add together and can exceed the generator rating."]
  ],
  flaws: [
    // General knowledge (plant security)
    { d: "m", prompt: "Which statement about visitor control is wrong?", flawed: "Regular drivers move about alone", goods: ["Visitors sign in at the front and wear a visible badge", "Contractors are told the site hazards and rules before work", "Staff escort visitors to areas they need to see"], explanation: "Familiar faces are still signed in and escorted, so staff know who is where." },
    // General knowledge (public relations and complaints)
    { d: "m", prompt: "Which statement about handling an odour call is wrong?", flawed: "The caller is promised the odour ends today", goods: ["Contact details and the time are noted down", "The caller is thanked and told what will be checked", "The complaint is passed to a supervisor for follow-up"], explanation: "A promise that is not kept damages trust, so staff commit to what they will check." },
    { d: "e", prompt: "Which statement about plant tours is wrong?", flawed: "Guests are free to touch equipment", goods: ["A safety briefing is given before the group starts", "Staff escort the group along a planned route", "Guests are kept clear of open tanks and chemical areas"], explanation: "Equipment and covers are hazards to untrained guests, so touching is not allowed." },
    // General knowledge (flow equalization)
    { d: "m", prompt: "Which statement about equalization and downstream processes is wrong?", flawed: "Clarifiers see bigger flow swings", goods: ["Aeration tanks receive a steadier organic load", "Chemical feed rates are easier to hold on target", "Clarifier overflow rates stay closer to design values"], explanation: "Smoothing flow reduces the swings that clarifiers see, which is its purpose." },
    { d: "m", prompt: "Which statement about cleaning an equalization basin is wrong?", flawed: "Floor solids are left until the next big storm", goods: ["Cleaning is planned for a time when storm flow is unlikely", "Floor solids and grit are removed and disposed of properly", "Settled solids shrink the storage volume until removed"], explanation: "Waiting loses storage and builds odour, so cleaning is scheduled ahead of need." },
    // General knowledge (dissolved air flotation)
    { d: "m", prompt: "Which statement about running a flotation unit is wrong?", flawed: "Recycle flow is shut off to let floc form calmly", goods: ["Recycle flow carries the dissolved air to the release point", "Chemical feed is set from jar test results", "Float is skimmed from the surface to a hopper"], explanation: "Recycle flow supplies the bubbles, so without it no bubbles form to lift the floc." },
    { d: "h", prompt: "Which statement about flotation problems is wrong?", flawed: "Poor effluent is fixed by raising chemical dose alone", goods: ["Poor bubble formation can follow a drop in saturator pressure", "Uneven bubbles are checked at the release nozzles", "A change in feed solids or oil can call for a new chemical dose"], explanation: "Poor results have several causes, including air supply, so the dose is not the first fix." },
    // General knowledge (generators and engines for plants)
    { d: "m", prompt: "Which statement about load priorities on standby power is wrong?", flawed: "Comfort loads are served before pumps", goods: ["Life safety and critical process loads come first", "Loads that are not needed are shed to protect the generator", "Large motors are staged to limit the starting surge"], explanation: "Limited generator capacity goes to the loads that protect people and the process first." }
  ]
};
export default data;
