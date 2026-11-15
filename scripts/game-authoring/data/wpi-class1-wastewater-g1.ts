// Class 1 Wastewater Treatment, western exam course, gap-fill table g1.
// Fills topics a coverage check found thin: plant security, public relations and complaints,
// flow equalization, and dissolved air flotation other than sludge thickening.
// Entry-level general operator knowledge in original wording. No book text is stored in the repo.
// Each row rests on well-established operator knowledge, so each section is marked "General knowledge".
import type { CourseData } from "../build";
const data: CourseData = {
  courseKey: "wpi-class1-wastewater",
  facts: [
    // General knowledge (plant security)
    ["e", "Fences, locked gates and good lighting make it harder for unauthorized people to enter a plant unnoticed.", true, "Physical barriers and visibility slow entry and make strangers easy to spot."],
    ["m", "Chlorine and other gas cylinders are kept in a locked, signed area that trained staff enter.", true, "Gas and chemical storage is a hazard in the wrong hands, so access to it is controlled."],
    ["m", "Passwords and regular software updates help protect the computers that run plant controls.", true, "Weak logins and old software are common ways for outside threats to get into a control system."],
    ["e", "A delivery driver who says they are a supplier is left to walk through the plant alone.", false, "Visitors and contractors are signed in and escorted so staff know who is on site and where they are."],
    ["m", "Plugging an unknown memory stick found in the parking lot into a plant computer is a safe way to find its owner.", false, "Unknown devices can carry malware, so they are handed to a supervisor instead of being plugged in."],
    ["e", "An intrusion alarm that keeps going off for no clear reason is best switched off to stop the nuisance.", false, "A repeated false alarm points to a fault or a poor setting, so it is reported and repaired."],
    // General knowledge (public relations and complaints)
    ["e", "An odour complaint is written down with the date, time, place and what the caller noticed.", true, "A good record helps staff look for a cause and shows the plant took the call seriously."],
    ["m", "An operator who is asked about a topic outside their job passes the caller to the person who handles such questions.", true, "Referring the question avoids wrong answers and gives the caller someone who can help."],
    ["m", "A notice about an overflow or bypass uses plain language to say what happened and what people should do.", true, "Clear, simple wording helps the public act sensibly, for example by staying out of the water."],
    ["e", "An operator gives a reporter their best guess about the cause of an overflow on the spot.", false, "Guesses can turn out wrong, so questions from the media go to the person named to speak for the plant."],
    ["m", "A complaint about odour is not worth recording when the plant seems to be running normally.", false, "Each complaint is logged because the pattern over time can point to a real source."],
    ["e", "Guests on a plant tour need no safety briefing because the group stays on the walkways.", false, "Tour guests are briefed on hazards and escorted, since walkways can still be wet, noisy or slippery."],
    // General knowledge (flow equalization)
    ["m", "An equalization basin holds back part of a flow peak and releases it to the plant later at a steadier rate.", true, "Storing the extra water protects downstream tanks from a sudden surge."],
    ["m", "A mixer in an equalization basin keeps solids suspended so the stored wastewater stays uniform.", true, "Without mixing, solids settle out and the water leaving the basin changes in strength."],
    ["e", "Stored flow is often sent on to the plant during the low-flow overnight hours.", true, "Daily flow has peaks and lows, and the basin fills at the peak and drains when the plant has spare capacity."],
    ["m", "Settled solids and grit on the floor of an equalization basin are left in place because they do no harm.", false, "Buildup takes up storage volume, turns septic and causes odour, so the basin is cleaned on a schedule."],
    ["m", "Keeping the basin nearly full before a storm gives the most room to catch the wet-weather peak.", false, "The basin is drawn down so it has empty volume ready for the next surge."],
    ["e", "Equalization makes the flow reaching the plant less steady than before.", false, "Its purpose is to smooth out flow and load, not to increase the swings."],
    // General knowledge (dissolved air flotation)
    ["e", "Dissolved air flotation lifts suspended solids, oil and grease to the surface with very fine air bubbles.", true, "Bubbles attach to particles, making them lighter than water so they float."],
    ["m", "In a flotation unit, air is dissolved in water under pressure and fine bubbles form when the pressure is released.", true, "The sudden drop in pressure turns dissolved air into a cloud of tiny bubbles."],
    ["m", "A part of the clear effluent is often pressurized, saturated with air and recycled to the tank to supply the bubbles.", true, "Recycling clean water avoids breaking up the fragile floc in the incoming flow."],
    ["m", "Skimmers on a flotation unit scrape the settled solids from the bottom of the tank.", false, "The float is skimmed from the surface, and heavy solids are removed from the bottom separately."],
    ["m", "Flotation works poorly on algae-rich water because the algae settle too quickly.", false, "Algae are light and settle poorly, which is why flotation is a good choice for such flows."],
    ["e", "Coagulant and polymer do not help a flotation unit because bubbles do the whole job of capturing particles.", false, "Chemicals make fine particles clump into floc that the bubbles can grab and lift."]
  ],
  boards: [
    // General knowledge (plant security)
    { d: "e", prompt: "Match each security item to what it does.", pairs: [["Card reader at the gate", "Records who enters and when"], ["Lock on chemical storage", "Keeps chemicals away from unauthorized people"], ["Anti-virus and updates", "Protect control system computers from malware"], ["Staff escort", "Keeps visitors with someone who knows the site"], ["Alarm panel", "Alerts staff when a door is forced"], ["Incident report", "Writes down suspicious events for follow-up"]] },
    // General knowledge (public relations and complaints)
    { d: "m", prompt: "Match each public contact term to its meaning.", pairs: [["Complaint log", "Written record of each call and what was done"], ["Designated spokesperson", "Person who speaks for the plant to the media"], ["Plant tour", "Visit with a safety briefing and an escort"], ["Public notice", "Plain-language message about an overflow or bypass"], ["Follow-up call", "Tells the caller what was found and done"], ["Referral", "Passing a question to the proper person"]] },
    // General knowledge (flow equalization)
    { d: "m", prompt: "Match each equalization term to its meaning.", pairs: [["Diurnal peak", "Daily period of high flow"], ["Wet-weather peak", "Surge from storm water entering the sewers"], ["Drawdown", "Emptying the basin to make room for the next peak"], ["Mixer", "Keeps solids from settling out in the basin"], ["Level sensor", "Shows how full the basin is"], ["Pump-back", "Sends stored flow on to the plant"]] },
    // General knowledge (dissolved air flotation)
    { d: "m", prompt: "Match each flotation part to its job.", pairs: [["Saturator", "Holds recycle water under pressure with air"], ["Recycle pump", "Moves part of the clear effluent to the saturator"], ["Pressure release valve", "Drops the pressure so fine bubbles form"], ["Skimmer", "Removes the float from the surface"], ["Float hopper", "Collects the skimmed float"], ["Coagulant feed", "Helps fine particles clump so bubbles can lift them"]] }
  ],
  oddSets: [],
  sequences: [],
  relations: [
    // General knowledge (plant security)
    ["e", "A staff access card is left active after the person leaves the job.", "the chance of unauthorized entry", "increase", "A card in the wrong hands still opens doors."],
    ["m", "One shared, easy password is used at the control system workstation.", "the chance of unauthorized access to the controls", "increase", "A weak, shared login is easy to guess or pass along."],
    // General knowledge (public relations and complaints)
    ["e", "Complaints are answered politely and the caller is told what the plant will check.", "the chance a complaint grows into a larger dispute", "decrease", "People calm down when they feel heard and know someone is acting."],
    // General knowledge (flow equalization)
    ["m", "The equalization basin is drawn down to a low level before a storm arrives.", "the room available to hold the peak flow", "increase", "More empty volume means more storm flow can be stored."],
    ["m", "The mixer in the equalization basin fails and solids settle out.", "the odour from the basin", "increase", "Settled solids turn septic and give off foul gases."],
    ["e", "Stored flow is released from the basin to the plant at a steady rate.", "the swings in load on the clarifiers", "decrease", "A steady feed avoids sudden surges in tank loading."],
    // General knowledge (dissolved air flotation)
    ["e", "The coagulant dose to a flotation unit is cut far too low.", "the solids carried out with the effluent", "increase", "Weak floc does not attach to the bubbles, so solids leave with the water."],
    ["m", "The recycle pump of a flotation unit is shut off while feed continues.", "the number of bubbles available to lift solids", "decrease", "The recycle flow carries the dissolved air that makes the bubbles."],
    ["m", "The saturator pressure drops below its normal setting.", "the amount of air released in the tank", "decrease", "Less air dissolves at lower pressure, so fewer bubbles form."]
  ],
  flaws: [
    // General knowledge (plant security)
    { d: "m", prompt: "Which statement about suspicious activity near the plant is wrong?", flawed: "An operator confronts the person alone", goods: ["Staff note what was seen and the time", "The sighting is reported to a supervisor", "Staff keep a safe distance and call for help"], explanation: "Staff do not confront strangers, since doing so is risky, and they report what they saw." },
    // General knowledge (public relations and complaints)
    { d: "e", prompt: "Which statement about recording a complaint is wrong?", flawed: "Contact details are not worth noting", goods: ["The date and time of the call are written down", "The location and type of problem are logged", "Follow-up actions are recorded for later review"], explanation: "Contact details let staff call back, so a full record is kept." },
    { d: "m", prompt: "Which statement about speaking to the public during an overflow is wrong?", flawed: "Guesses fill the gaps in the facts", goods: ["Facts known so far are stated clearly", "Questions on health risk go to the spokesperson", "Staff avoid blaming people or other parties"], explanation: "Statements stick to what is known, since a wrong guess damages trust." },
    // General knowledge (flow equalization)
    { d: "m", prompt: "Which statement about operating an equalization basin is wrong?", flawed: "Grit is left to build up on the floor", goods: ["Mixing keeps solids from settling on the floor", "The basin is drained and cleaned on a schedule", "Air supply keeps the contents fresh and limits odour"], explanation: "Grit takes up storage volume and turns septic, so the basin is cleaned regularly." },
    // General knowledge (dissolved air flotation)
    { d: "m", prompt: "Which statement about air in a flotation unit is wrong?", flawed: "Bubbles form as pressure builds in the tank", goods: ["Air dissolves in recycle water under pressure", "Bubbles form as pressure drops at the release valve", "Float is skimmed from the surface of the tank"], explanation: "Bubbles form when the pressure is released, not when it is raised." }
  ]
};
export default data;
