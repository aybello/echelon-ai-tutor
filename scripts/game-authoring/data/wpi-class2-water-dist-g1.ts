// Class 2 Water Distribution, western exam course, gap-fill table g1.
// Fills topics a coverage check found thin: electrical controls and power at pump stations and reservoirs,
// generators and engines, maintenance management, temporary service and bypass, swabbing and pigging,
// and thawing frozen services and mains.
// Working-knowledge level general operator knowledge in original wording. No book text is stored in the repo.
// Practice varies between utilities, so wording stays general. Metric units, no jurisdiction-specific values.
// Every row rests on well-established operator knowledge, so each section is marked "General knowledge".
import type { CourseData } from "../build";
const data: CourseData = {
  courseKey: "wpi-class2-water-dist",
  facts: [
    // General knowledge (electrical controls and power)
    ["m", "A magnetic motor starter lets a small control signal switch a large motor load on and off.", true, "The control circuit carries little current, while the starter contacts carry the full motor current."],
    ["m", "An overload relay is the device that protects a motor circuit from a direct short circuit.", false, "Fuses and breakers react to a short circuit. The overload relay responds to excess current that lasts for a time."],
    ["m", "A step-down transformer lowers the supply voltage to the level a control circuit needs.", true, "Control circuits and small loads run at a lower voltage than the incoming supply."],
    ["m", "A float switch senses the pressure in a main to start a booster pump.", false, "A float switch follows water level. A pressure switch is the device that senses pressure."],
    ["m", "A hand-off-auto selector lets an operator take a pump out of remote control and run it by hand.", true, "In the hand position the pump runs whatever the level, pressure or remote signals say, so it is used with care."],
    ["h", "A low-level alarm switch is set below the normal pump-start level of a reservoir.", true, "If the level falls to the alarm point, the pumps are not keeping up and operators are warned early."],
    ["m", "A battery backup for a control panel needs no testing as long as the charger light is on.", false, "A charger light does not show whether the batteries can carry the load, so they are load tested and replaced on schedule."],
    // General knowledge (generators and engines)
    ["h", "An open transition transfer switch breaks the utility connection before it makes the generator connection.", true, "The break-before-make action keeps the two sources from being joined together."],
    ["m", "Fuel kept in a half-empty tank gathers more condensation than fuel kept in a full tank.", true, "More empty space in the tank means more moist air, and water drops out into the fuel."],
    ["m", "A starter motor that clicks without turning, or turns slowly, often points to a weak battery.", true, "A weak battery cannot deliver enough current to turn the engine briskly."],
    ["e", "When generator capacity is limited, building lighting is restored before the pumps and controls.", false, "Loads that keep water moving and the controls alive come first, and comfort loads come later."],
    ["m", "A generator is connected to the station by closing its breaker onto the live utility feed to save time.", false, "Joining a generator to a live supply without proper equipment can damage both. A transfer switch picks one source at a time."],
    ["m", "Oil and coolant levels on a standby unit are checked after it fails, since it sits idle.", false, "Levels are checked on routine visits, because an idle engine still leaks and loses fluid."],
    // General knowledge (maintenance management)
    ["m", "Valve exercising records note the turns to close and the valve's condition, so changes show up over time.", true, "A valve that takes fewer turns or sticks more than before is likely to need attention."],
    ["m", "Equipment histories are kept for large pumps but not for valves or hydrants.", false, "Valves and hydrants wear and fail too, and their histories show which ones to repair or replace."],
    ["h", "A minimum stock level on a spare part triggers a reorder before the last spare is used.", true, "A reorder point keeps a replacement on the shelf when the next failure comes."],
    ["m", "A preventive maintenance interval is set once and left alone even when histories show repeat trouble.", false, "Equipment histories are used to adjust intervals, so frequent failures call for more attention."],
    ["e", "A hydrant that passes its inspection is dropped from the records until it fails.", false, "Each inspection is recorded, so the history shows condition and tells when the next visit is due."],
    // General knowledge (temporary service and bypass)
    ["m", "A temporary bypass line is flushed and disinfected before it is connected to the system.", true, "Dirty pipe or hose would carry contamination into the drinking water supply."],
    ["h", "Chlorine residual in a temporary supply line is checked at the customer end, not just at the connection.", true, "Residual can fade along a long hose, so the far end shows what customers receive."],
    ["m", "Valves are opened quickly when service is restored so customers get water back sooner.", false, "Quick opening causes pressure surges and stirs up sediment, so valves are opened slowly."],
    ["m", "Customers are advised to run their cold taps briefly when normal service returns after a shutdown.", true, "Running the taps clears air and any discoloured water from the household plumbing."],
    // General knowledge (swabbing and pigging)
    ["m", "A swab scrubs the pipe wall with a soft solid body, which flushing velocity alone does not do.", true, "The contact scrubbing loosens deposits that flowing water alone would leave behind."],
    ["m", "A swab smaller than the pipe diameter gives the best scrubbing of the wall.", false, "A swab is sized to fit snugly, so it presses against the wall and does not let water slip past."],
    ["m", "A flush after a swab run is skipped because the swab carries the deposits out of the main.", false, "The swab loosens material, and a flush carries the loosened material out of the pipe."],
    ["h", "The receiving point for a swab run is planned so the swab and the flush water are caught and drained safely.", true, "Flow and debris arrive at the end of the run, so the discharge has to be ready for them."],
    ["h", "A swab is the right choice for clearing a main with a collapsed section.", false, "A swab or pig can lodge in a damaged pipe, so the condition of the main is checked first."],
    // General knowledge (thawing frozen services and mains)
    ["m", "Frozen services are most common where the cover over the pipe is shallow or the ground is bare.", true, "Frost reaches shallow pipe sooner, and snow cover insulates the ground when it is present."],
    ["m", "Electrical thawing passes current through a metal pipe to warm it and is not suited to plastic pipe.", true, "Plastic does not carry the current, and heat or current through it can cause damage."],
    ["h", "Electrical thawing through a service with a meter in line poses no risk to the meter.", false, "Current can damage a meter and its electronics, so the meter and grounding are dealt with first."],
    ["e", "Plastic pipe tolerates a torch flame as well as metal pipe does.", false, "Open flame melts or weakens plastic, so it is not used to thaw plastic pipe."]
  ],
  boards: [
    // General knowledge (electrical controls and power)
    { d: "m", prompt: "Match each station electrical item to what it does.", pairs: [["Run-time meter", "Shows the hours a pump has run"], ["Phase monitor", "Trips the motor on a lost or reversed phase"], ["Control relay", "Passes a small signal to switch another circuit"], ["Ammeter", "Shows the current a motor is drawing"], ["Surge protector", "Limits damage from voltage spikes"], ["Alarm dialer", "Calls out to an operator when a fault occurs"]] },
    // General knowledge (maintenance management)
    { d: "m", prompt: "Match each maintenance record to the question it answers.", pairs: [["Hydrant inspection sheet", "Is this hydrant ready for use?"], ["Valve exercising log", "When was this valve last operated?"], ["Equipment history", "How often has this pump failed?"], ["Spare parts list", "Is a replacement on the shelf?"], ["Work order", "Has this repair been assigned and closed?"], ["Preventive maintenance schedule", "What work is due next month?"]] },
    // General knowledge (swabbing)
    { d: "m", prompt: "Match each swab program step to its purpose.", pairs: [["Route check", "Finds closed valves that would stop the swab"], ["Customer notice", "Warns of possible colour or low pressure"], ["Choosing swab size", "Gives a snug fit against the wall"], ["Receiving point set-up", "Gives a place to catch the swab"], ["Flushing afterward", "Clears loosened deposits from the main"], ["Record keeping", "Notes what came out and the pipe condition"]] }
  ],
  oddSets: [
    // General knowledge (generators and engines)
    { d: "m", rule: "an item checked on a standby engine before a test run", members: ["Engine oil level", "Coolant level", "Fuel tank level", "Battery charge", "Air filter", "Belt condition"], intruders: ["Packing", "Impeller", "Strainer", "Wear ring"], why: "{odd} is a pump part, not an engine check.", max: 5 }
  ],
  sequences: [],
  relations: [
    // General knowledge (electrical controls and power)
    ["m", "The batteries in a station control panel backup are not tested and their cells weaken.", "the chance that alarms fail to signal during a power loss", "increase", "Weak cells cannot carry the alarm and control circuits for long."],
    ["m", "Supply voltage drops well below normal at a pump motor.", "the heat in the motor windings", "increase", "The motor draws more current to deliver the same load, and the extra current heats the windings."],
    ["m", "Restart delay timers return pumps to service one at a time after an outage.", "the surge in electrical demand when power returns", "decrease", "Staggered starts spread the motor starting current over a longer time."],
    // General knowledge (generators and engines)
    ["m", "Fuel in a standby generator tank is tested and cleaned on a schedule.", "the chance of fuel-related stalling in an outage", "decrease", "Water and sludge are found and removed before they plug the filters."],
    ["m", "A starting battery in a standby unit is left in service past its useful life.", "the chance that the engine fails to start", "increase", "An aged battery loses the capacity to turn the engine over."],
    // General knowledge (maintenance management)
    ["m", "Equipment histories show a pump bearing failing repeatedly, and its service interval is shortened.", "the chance of the next bearing failure in service", "decrease", "More frequent attention catches wear before the bearing fails."],
    ["m", "Hydrant and valve records are not updated after crews finish work.", "the chance that a failed valve is found only during an emergency", "increase", "Without current records, weak units are not spotted ahead of time."],
    // General knowledge (temporary service and bypass)
    ["m", "A temporary hose supply stays in place for several days in warm weather.", "the chance of bacterial growth in the hose water", "increase", "Warm water standing in a hose loses residual and supports growth."],
    ["m", "Valves are opened slowly while a repaired main is refilled.", "the size of the pressure surge in the main", "decrease", "Slow filling lets air escape and keeps the flow change gentle."],
    // General knowledge (swabbing)
    ["m", "A swab is sized smaller than the pipe it passes through.", "the scrubbing contact with the pipe wall", "decrease", "A loose swab lets water slip past, so it presses less firmly against the wall."],
    ["m", "A flush is carried out after a swab run.", "the turbidity delivered to customers after the run", "decrease", "Loosened deposits are carried out of the main before service returns."],
    // General knowledge (thawing)
    ["m", "Insulation is added to an exposed pipe at a meter location.", "the chance that the pipe freezes", "decrease", "Insulation slows the loss of heat from the pipe to the cold air."]
  ],
  flaws: [
    // General knowledge (electrical controls and power)
    { d: "m", prompt: "Which statement about restoring a station after a power failure is wrong?", flawed: "Large pumps are started together to restore pressure fast", goods: ["Control settings and alarm history are checked after power returns", "Pumps are brought back in a planned and staged order", "Tank levels are reviewed before the pumps are restarted"], explanation: "Starting large pumps together causes a big electrical surge and a pressure surge in the pipes." },
    { d: "m", prompt: "Which statement about a blown control fuse is wrong?", flawed: "A larger fuse is fitted to stop repeat blowing", goods: ["A blown fuse is replaced with one of the same rating", "Repeated blowing is traced to a fault in the circuit", "Power is isolated and tested dead before a fuse is changed"], explanation: "A larger fuse removes the protection and lets the fault damage the wiring or equipment." },
    // General knowledge (generators and engines)
    { d: "m", prompt: "Which statement about generator load priorities is wrong?", flawed: "Comfort loads come back before pumps do", goods: ["Pumps and controls needed for service are restored first", "Large loads are stepped on one at a time to avoid overload", "A written load list guides the order of restoration"], explanation: "Water supply loads come first, and comfort loads wait until capacity is available." },
    // General knowledge (maintenance management)
    { d: "m", prompt: "Which statement about valve and hydrant records is wrong?", flawed: "Condition notes are skipped to save time", goods: ["Each visit's date and findings are recorded", "Valves that fail to operate are flagged for repair", "Records show which units are overdue for a visit"], explanation: "Condition notes show which valves and hydrants are getting worse, so they are part of each record." },
    { d: "m", prompt: "Which statement about preventive maintenance planning is wrong?", flawed: "Histories are ignored when setting intervals", goods: ["Frequent failures call for a shorter service interval", "Reliable units may be checked less often over time", "Completed tasks are recorded against each unit"], explanation: "Equipment histories are the evidence that tells whether an interval is too long or too short." },
    // General knowledge (temporary service and bypass)
    { d: "m", prompt: "Which statement about ending a temporary supply is wrong?", flawed: "Customers return before the section is flushed", goods: ["Valves are opened slowly to limit pressure surges", "Water quality is checked before customers are switched back", "Customers are told when normal supply returns"], explanation: "The repaired section is flushed and checked first, so dirt and air do not reach customers." },
    // General knowledge (swabbing)
    { d: "m", prompt: "Which statement about preparing a swab run is wrong?", flawed: "Valves on the route are left as found", goods: ["The route is checked for closed or partly closed valves", "Launch and receiving points are chosen and prepared beforehand", "The disposal of flush water is planned before the run"], explanation: "A closed or partly closed valve can stop the swab, so the valves along the route are checked first." },
    // General knowledge (thawing)
    { d: "m", prompt: "Which statement about thawing a frozen service is wrong?", flawed: "Current is applied before checking the meter", goods: ["The thaw method is chosen to suit the pipe material", "Thawing equipment is operated by trained staff", "Each thawed service is recorded for later review"], explanation: "Current can damage a meter and its wiring, so the meter and the grounding are dealt with first." }
  ]
};
export default data;
