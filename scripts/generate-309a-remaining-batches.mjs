import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const allocation = JSON.parse(readFileSync(resolve(root, "content/309a/309a-allocation.json"), "utf8"));
const taxonomy = JSON.parse(readFileSync(resolve(root, "content/309a/309a-subtask-taxonomy.json"), "utf8"));
const diagrams = JSON.parse(readFileSync(resolve(root, "content/309a/309a-diagrams.json"), "utf8"));
const outputDirectory = resolve(root, "content/309a/questions");

const MODULE_START = { B: 56, C: 196, D: 346, E: 451 };
const CALCULATION_TARGET = { B: 35, C: 30, D: 25, E: 5 };
const DIAGRAM_TARGET = { B: 25, C: 25, D: 20, E: 5 };

const taskProfiles = {
  "B-7": profile("Services and metering", "calculated load, approved service design, equipment ratings, supply-authority requirements and verified site conditions", "incorrect phasing, unsafe clearances, damaged conductors or inaccurate metering", ["single-phase service load", "three-phase service load", "metering-transformer polarity", "phase identification", "service-conductor strain relief", "environmental protection", "metering documentation", "load balance", "service-component layout", "maintenance history"]),
  "B-8": profile("Protection devices", "the protected conductor and equipment ratings, available fault duty, coordination study, application and manufacturer data", "failure to interrupt a fault selectively or loss of the intended shock, arc-fault or surge protection", ["interrupting capability", "continuous-current rating", "time-current coordination", "ground-fault sensing", "arc-fault detection", "surge diversion", "line-load orientation", "trip setting control", "protection-device labelling", "post-trip investigation"]),
  "B-9": profile("Distribution equipment", "approved one-line drawings, bus ratings, phase sequence, equipment condition, enclosure suitability and manufacturer assembly instructions", "overheating, phase errors, damaged buswork or uncontrolled distribution outages", ["bus phasing", "equipment short-circuit rating", "main-bus loading", "termination torque", "ventilation clearance", "switchboard alignment", "panel directory accuracy", "disconnect operation", "thermal inspection trend", "foreign-material control"]),
  "B-10": profile("Power quality and UPS", "critical-load requirements, input and output ratings, waveform and transfer characteristics, battery data, environment and bypass strategy", "unexpected loss of critical loads, reduced battery autonomy or transfer instability", ["UPS load capacity", "battery autonomy", "maintenance bypass", "input power quality", "output waveform", "surge-device status", "battery temperature", "transfer operation", "alarm history", "critical-load prioritization"]),
  "B-11": profile("Bonding and grounding", "the intended fault-current path, system configuration, continuity, connection integrity, engineering information and approved grounding design", "touch-voltage hazards, ineffective protection operation or unreliable ground-fault detection", ["bonding-path continuity", "grounding-electrode connection", "neutral-to-bond relationship", "ground-fault sensor placement", "lightning down-conductor routing", "connection corrosion", "parallel metallic paths", "ground-fault alarm testing", "bonding-jumper integrity", "inspection records"]),
  "B-12": profile("Generation and conversion", "generator or converter ratings, load profile, transfer sequence, voltage, frequency, polarity, ventilation and manufacturer commissioning data", "unstable output, incorrect transfer, equipment damage or unsafe backfeed", ["generator phase sequence", "frequency stability", "voltage regulation", "transfer interlock", "starting-battery condition", "DC polarity", "converter output", "load-bank result", "fuel or energy readiness", "maintenance run record"]),
  "B-13": profile("Renewable generation and storage", "array and storage ratings, series-parallel design, isolation points, inverter limits, polarity, environmental conditions and approved interconnection design", "DC arcing, reversed polarity, inverter shutdown, battery damage or unintended energization", ["PV string voltage", "parallel-string current", "battery usable energy", "DC polarity", "inverter input window", "rapid or emergency shutdown", "storage ventilation", "array shading", "isolation labelling", "energy-flow monitoring"]),
  "B-14": profile("High-voltage systems", "engineered drawings, equipment class, cable test data, termination instructions, grounding plan, access control and authorized high-voltage procedures", "insulation failure, flashover, induced voltage or exposure to hazardous stored energy", ["cable insulation condition", "stress-control termination", "shield continuity", "phasing confirmation", "equipment clearances", "temporary protective grounding", "interlock operation", "test-result trend", "access control", "switching documentation"]),
  "B-15": profile("Transformers", "nameplate ratio and vector information, load and inrush requirements, winding connections, cooling, protection, grounding and test results", "incorrect secondary voltage, phase displacement, overheating or protection misoperation", ["turns ratio", "primary-secondary voltage", "winding polarity", "three-phase connection", "tap position", "cooling clearance", "inrush effect", "secondary loading", "insulation test trend", "audible-noise change"]),
  "C-16": profile("Raceways and conductors", "approved routing, conductor and raceway characteristics, pulling limits, support, environment, termination data and fire-separation requirements", "damaged insulation, excessive pulling stress, moisture entry, poor support or loss of fire separation", ["conductor pulling tension", "bend planning", "raceway support", "cable identification", "termination preparation", "box fill planning", "enclosure environmental suitability", "firestop restoration", "conductor length allowance", "raceway corrosion", "cable-tray loading", "removal impact"]),
  "C-17": profile("Branch circuits and devices", "load and control intent, luminaire and device ratings, polarity, switching logic, location, environment and approved circuit documentation", "incorrect operation, overheating, nuisance tripping, loss of lighting control or unsafe device condition", ["luminaire load", "device polarity", "multi-location switching", "lighting-control sequence", "occupancy sensor coverage", "dimming compatibility", "lighting-standard bonding", "branch-circuit tracing", "traffic-signal sequence", "airport-lighting isolation", "panel schedule", "post-repair functional test"]),
  "C-18": profile("HVAC systems", "equipment nameplate data, approved wiring diagrams, control sequence, disconnecting means, interlocks and manufacturer startup requirements", "compressor damage, simultaneous conflicting commands, loss of airflow proving or unsafe automatic restart", ["compressor interlock", "fan proving", "control transformer loading", "thermostat signal", "damper actuator", "condensate safety", "equipment disconnect", "phase sequence", "control-sequence verification", "service alarm history"]),
  "C-19": profile("Electric heating", "heater rating, supply characteristics, zoning, temperature controls, overtemperature protection, clearances and approved installation information", "overheating, poor comfort control, excessive current or failure of temperature-limiting protection", ["heater current", "element resistance", "zone loading", "thermostat location", "contactor duty", "high-limit operation", "airflow interlock", "floor-sensor placement", "staged heating", "maintenance temperature trend"]),
  "C-20": profile("Exit and emergency lighting", "egress-lighting design, normal-source monitoring, battery capacity, transfer operation, fixture direction, test results and inspection records", "dark egress paths, inadequate duration, failed transfer or misleading exit direction", ["battery autonomy", "charger condition", "normal-source sensing", "transfer response", "exit-sign direction", "remote-head loading", "monthly functional test", "annual duration test", "fixture obstruction", "inspection log"]),
  "C-21": profile("Cathodic protection", "engineered polarity, anode and structure connections, isolation points, reference measurements, rectifier output and corrosion-control records", "accelerated corrosion, ineffective protection or damage caused by reversed polarity", ["rectifier polarity", "anode connection", "structure continuity", "reference-electrode reading", "test-station identification", "isolation-joint integrity", "DC output current", "cable damage", "measurement trend", "maintenance log"]),
  "D-22": profile("Motor starters and controls", "motor nameplate data, control schematic, starter and overload ratings, interlocks, control voltage and verified sequence of operation", "failure to start or stop, contactor damage, overload trips or simultaneous conflicting commands", ["starter size", "overload setting", "control-transformer loading", "seal-in contact", "stop-circuit continuity", "forward-reverse interlock", "soft-start ramp", "contactor coil voltage", "auxiliary contact state", "post-repair sequence test", "contact wear", "control-circuit documentation"]),
  "D-23": profile("Motor drives", "motor and drive ratings, supply quality, grounding and cabling, programmed limits, acceleration profile, load characteristics and manufacturer diagnostics", "overcurrent trips, unstable speed, motor overheating, electrical noise or unsafe automatic restart", ["drive input rating", "motor base frequency", "acceleration time", "deceleration energy", "minimum speed", "current limit", "fault history", "motor-cable routing", "control reference scaling", "bypass sequence", "DC-bus condition", "drive cooling"]),
  "D-24": profile("Motors", "motor nameplate data, supply voltage and phase sequence, driven-load requirements, mounting, alignment, ventilation and diagnostic test results", "incorrect rotation, excessive current, bearing damage, overheating or reduced torque", ["synchronous speed", "motor slip", "phase sequence", "single-phase starting circuit", "shaft alignment", "bearing condition", "winding resistance balance", "insulation trend", "ventilation path", "load current balance", "coupling condition", "DC brush condition"]),
  "D-25": profile("Automated controls", "approved control narrative, input and output types, signal scaling, fail-safe states, network design, program version and controlled commissioning tests", "unexpected equipment operation, unstable loops, false indications or loss of safe fallback", ["digital input state", "analog scaling", "output fail state", "sensor range", "actuator direction", "interlock logic", "alarm priority", "program backup", "network addressing", "loop tuning", "trend history", "change-control record"]),
  "E-26": profile("Signalling systems", "approved system drawings, device function, supervised circuit arrangement, standby supply, field-of-view or coverage, associated-system interfaces and verification results", "missed alarms, false alarms, blind surveillance areas or failed associated-system actions", ["initiating-device circuit", "notification circuit", "end-of-line supervision", "standby battery", "annunciator indication", "camera field of view", "security-zone identification", "door-contact state", "associated-system relay", "verification record"]),
  "E-27": profile("Communication systems", "system topology, cable performance, pathway separation, termination method, equipment power, coverage and documented test limits", "poor signal quality, crosstalk, dropped communication, inadequate intelligibility or incorrect call routing", ["structured-cable permanent link", "fibre polarity", "connector loss", "speaker loading", "amplifier capacity", "intercom call path", "nurse-call priority", "cable bend control", "telecommunications grounding", "certification result"]),
  "E-28": profile("Integrated controls", "control sequence, points list, sensor range, actuator action, communication mapping, fail-safe operation, trend data and approved commissioning plan", "unstable building operation, incorrect commands, energy waste, false alarms or unsafe loss of control", ["sensor scaling", "controller setpoint", "actuator direction", "occupied schedule", "alarm mapping", "network point mapping", "fail-safe state", "trend comparison", "override status", "sequence commissioning"])
};

function profile(label, principle, risk, topics) {
  return { label, principle, risk, topics };
}

const contexts = [
  "a new installation", "a planned upgrade", "a commissioning check", "a maintenance outage",
  "an intermittent fault investigation", "a post-repair test", "a field-layout conflict", "a documented inspection"
];

const conditions = [
  "the latest approved drawing is available",
  "the equipment has recently been replaced",
  "the issue appears only when the load increases",
  "the condition is intermittent",
  "a previous test result is available for comparison",
  "the enclosure shows no obvious mechanical damage",
  "the operator reports a recent process change",
  "the system is being prepared for return to service",
  "the work affects a critical operating load",
  "another trade has changed the nearby installation",
  "the maintenance log shows a recurring trend",
  "the current nameplate differs from an older record",
  "an alarm was acknowledged but its cause was not recorded",
  "the measured values are stable but outside the approved expectation",
  "the field labels do not fully match the as-built record",
  "the deficiency was discovered during a controlled functional test",
  "the installation must remain traceable for the next shift"
];

function balancedSequence(entries) {
  const total = Object.values(entries).reduce((sum, count) => sum + count, 0);
  const used = Object.fromEntries(Object.keys(entries).map((key) => [key, 0]));
  const result = [];
  for (let position = 0; position < total; position += 1) {
    const key = Object.keys(entries)
      .filter((candidate) => used[candidate] < entries[candidate])
      .sort((a, b) => ((position + 1) * entries[b] / total - used[b]) - ((position + 1) * entries[a] / total - used[a]))[0];
    used[key] += 1;
    result.push(key);
  }
  return result;
}

function evenlySelected(total, count) {
  const selected = new Set();
  for (let index = 0; index < count; index += 1) selected.add(Math.floor((index + 0.5) * total / count));
  return selected;
}

function number(value, digits = 1) {
  return Number(value.toFixed(digits));
}

function numericOptions(correct, increment, digits = 1, unit = "") {
  return [correct, correct - increment, correct + increment, correct + 2 * increment]
    .map((value) => `${number(value, digits)}${unit}`);
}

function placeCorrect(correct, distractors, correctIndex) {
  const options = [...distractors.slice(0, 3)];
  options.splice(correctIndex, 0, correct);
  return options;
}

function calculationFor(taskCode, itemNumber, correctIndex) {
  const n = itemNumber;
  if (taskCode === "B-7") {
    const voltage = 600; const current = 20 + (n % 6) * 5; const pf = 0.8 + (n % 3) * 0.05;
    const answer = number(Math.sqrt(3) * voltage * current * pf / 1000, 1);
    return calc(`A balanced three-phase service supplies ${current} A at ${voltage} V with a power factor of ${pf.toFixed(2)}. What is the approximate real power?`, `${answer} kW`, numericOptions(answer, 5, 1, " kW").filter((x) => x !== `${answer} kW`), `For a balanced three-phase load, real power is √3 × line voltage × line current × power factor.`, [["Formula", "P = √3 × V × I × PF."], ["Substitute", `P = 1.732 × ${voltage} × ${current} × ${pf.toFixed(2)} ÷ 1000 = ${answer} kW.`]], "Keep volts and amperes together, then divide by 1000 to report kilowatts.", correctIndex);
  }
  if (["B-8", "B-9", "B-12", "B-14"].includes(taskCode)) {
    const voltage = taskCode === "B-14" ? 4160 : 600; const kva = 30 + (n % 7) * 15;
    const answer = number(kva * 1000 / (Math.sqrt(3) * voltage), 1);
    return calc(`A balanced three-phase load is ${kva} kVA at ${voltage} V. What line current does this represent approximately?`, `${answer} A`, numericOptions(answer, Math.max(2, number(answer * 0.2, 1)), 1, " A").filter((x) => x !== `${answer} A`), `Three-phase apparent power relates to line voltage and current by S = √3 × V × I.`, [["Rearrange", "I = S ÷ (√3 × V)."], ["Calculate", `I = ${kva * 1000} ÷ (1.732 × ${voltage}) = ${answer} A.`]], "Convert kVA to VA before dividing by the three-phase voltage factor.", correctIndex);
  }
  if (taskCode === "B-10") {
    const watts = 1200 + (n % 5) * 300; const batteryWh = 2400 + (n % 4) * 600; const efficiency = 0.85;
    const answer = number(batteryWh * efficiency / watts, 2);
    return calc(`A UPS battery bank stores ${batteryWh} Wh. At 85% usable conversion efficiency, how long can it theoretically support a ${watts} W load?`, `${answer} h`, numericOptions(answer, 0.25, 2, " h").filter((x) => x !== `${answer} h`), `Estimated runtime is usable stored energy divided by load power; actual autonomy must be confirmed with approved battery data and testing.`, [["Usable energy", `${batteryWh} Wh × 0.85 = ${number(batteryWh * efficiency, 0)} Wh.`], ["Runtime", `${number(batteryWh * efficiency, 0)} Wh ÷ ${watts} W = ${answer} h.`]], "Battery age, temperature and discharge rate can reduce real runtime below this ideal estimate.", correctIndex);
  }
  if (taskCode === "B-11") {
    const r1 = 6 + (n % 4) * 2; const r2 = r1; const answer = number((r1 * r2) / (r1 + r2), 1);
    return calc(`Two independent paths of ${r1} Ω each are connected in parallel for a conceptual resistance check. What is their equivalent resistance?`, `${answer} Ω`, numericOptions(answer, 1, 1, " Ω").filter((x) => x !== `${answer} Ω`), `For two equal resistances in parallel, the equivalent is one-half of either resistance. This is a theory calculation, not a grounding-design value.`, [["Formula", "Req = (R1 × R2) ÷ (R1 + R2)."], ["Calculate", `Req = (${r1} × ${r2}) ÷ (${r1} + ${r2}) = ${answer} Ω.`]], "Parallel paths reduce equivalent resistance; verify real bonding systems by approved inspection and test methods.", correctIndex);
  }
  if (taskCode === "B-13") {
    const modules = 8 + (n % 5); const moduleVoltage = 36 + (n % 3) * 4; const answer = modules * moduleVoltage;
    return calc(`A PV string has ${modules} modules in series, each operating at ${moduleVoltage} V under the stated condition. What is the string operating voltage?`, `${answer} V`, numericOptions(answer, moduleVoltage, 0, " V").filter((x) => x !== `${answer} V`), `Series-connected source voltages add while the same string current passes through each module.`, [["Identify", `${modules} series modules at ${moduleVoltage} V each.`], ["Calculate", `${modules} × ${moduleVoltage} V = ${answer} V.`]], "Check the inverter input window and worst-case environmental voltage separately; this is only the stated operating condition.", correctIndex);
  }
  if (taskCode === "B-15") {
    const primary = 600; const secondary = [120, 208, 240][n % 3]; const primaryTurns = 500; const answer = number(primaryTurns * secondary / primary, 1);
    return calc(`An ideal transformer has ${primaryTurns} primary turns at ${primary} V and a ${secondary} V secondary. Approximately how many secondary turns are required?`, `${answer} turns`, numericOptions(answer, 25, 1, " turns").filter((x) => x !== `${answer} turns`), `For an ideal transformer, voltage ratio equals turns ratio: Vp/Vs = Np/Ns.`, [["Rearrange", "Ns = Np × Vs ÷ Vp."], ["Calculate", `Ns = ${primaryTurns} × ${secondary} ÷ ${primary} = ${answer} turns.`]], "Keep primary values together and secondary values together when setting up the ratio.", correctIndex);
  }
  if (taskCode === "C-16") {
    const length = 20 + (n % 6) * 5; const current = 12 + (n % 5) * 3; const resistance = 0.004; const answer = number(2 * length * current * resistance, 2);
    return calc(`A single-phase two-conductor circuit has a one-way length of ${length} m, carries ${current} A, and each conductor has ${resistance} Ω/m resistance. What is the approximate circuit voltage drop?`, `${answer} V`, numericOptions(answer, 1, 2, " V").filter((x) => x !== `${answer} V`), `The current travels out and back, so the simplified drop is 2 × one-way length × current × resistance per metre.`, [["Circuit length", `2 × ${length} m = ${2 * length} m.`], ["Voltage drop", `${2 * length} × ${current} × ${resistance} = ${answer} V.`]], "Use the complete current path, not only the one-way route length.", correctIndex);
  }
  if (taskCode === "C-17") {
    const fixtures = 8 + (n % 6) * 2; const watts = 18 + (n % 4) * 6; const answer = fixtures * watts;
    return calc(`A lighting branch has ${fixtures} luminaires rated ${watts} W each. What is their total connected lighting power?`, `${answer} W`, numericOptions(answer, watts * 2, 0, " W").filter((x) => x !== `${answer} W`), `For identical loads, total connected power is the quantity multiplied by the power of each luminaire.`, [["Identify", `${fixtures} luminaires × ${watts} W each.`], ["Calculate", `${fixtures} × ${watts} = ${answer} W.`]], "Connected power is not the same as energy use; operating time would be needed for watt-hours.", correctIndex);
  }
  if (taskCode === "C-18") {
    const va = 120 + (n % 6) * 30; const voltage = 24; const answer = number(va / voltage, 2);
    return calc(`An HVAC control transformer supplies ${va} VA at ${voltage} V. What is its rated secondary current?`, `${answer} A`, numericOptions(answer, 1.25, 2, " A").filter((x) => x !== `${answer} A`), `For a single-phase control transformer, apparent power equals voltage multiplied by current.`, [["Formula", "I = VA ÷ V."], ["Calculate", `I = ${va} ÷ ${voltage} = ${answer} A.`]], "Compare the total connected control VA with the transformer rating, including simultaneous loads.", correctIndex);
  }
  if (taskCode === "C-19") {
    const voltage = 240; const resistance = 12 + (n % 5) * 4; const answer = number((voltage * voltage) / resistance / 1000, 2);
    return calc(`A resistive heater element measures ${resistance} Ω and is supplied at ${voltage} V. What is its theoretical power?`, `${answer} kW`, numericOptions(answer, 0.8, 2, " kW").filter((x) => x !== `${answer} kW`), `For a resistive load, power can be calculated from P = V²/R.`, [["Formula", "P = V² ÷ R."], ["Calculate", `P = ${voltage}² ÷ ${resistance} = ${number((voltage * voltage) / resistance, 0)} W = ${answer} kW.`]], "A measured resistance and operating-temperature resistance may differ; confirm actual performance with approved tests.", correctIndex);
  }
  if (taskCode === "C-20") {
    const heads = 4 + (n % 5); const watts = 6; const hours = 2; const answer = heads * watts * hours;
    return calc(`An emergency unit supplies ${heads} identical ${watts} W heads for ${hours} hours. Ignoring losses, what energy must the battery deliver?`, `${answer} Wh`, numericOptions(answer, 12, 0, " Wh").filter((x) => x !== `${answer} Wh`), `Energy in watt-hours equals total load power multiplied by operating time.`, [["Total power", `${heads} × ${watts} W = ${heads * watts} W.`], ["Energy", `${heads * watts} W × ${hours} h = ${answer} Wh.`]], "Real battery selection must include conversion losses, ageing, temperature and the required duration margin.", correctIndex);
  }
  if (taskCode === "C-21") {
    const area = 120 + (n % 5) * 30; const density = 15; const answer = number(area * density / 1000, 2);
    return calc(`An engineered cathodic-protection design calls for ${density} mA per square metre over ${area} m². What total design current does that represent?`, `${answer} A`, numericOptions(answer, 0.5, 2, " A").filter((x) => x !== `${answer} A`), `Total current is current density multiplied by protected area, with milliamperes converted to amperes.`, [["Multiply", `${density} mA/m² × ${area} m² = ${density * area} mA.`], ["Convert", `${density * area} mA ÷ 1000 = ${answer} A.`]], "The current-density value must come from the approved corrosion-control design, not from this practice example.", correctIndex);
  }
  if (taskCode === "D-22") {
    const coils = 3 + (n % 5); const coilVa = 12; const voltage = 120; const answer = number(coils * coilVa / voltage, 2);
    return calc(`A control transformer simultaneously supplies ${coils} coils rated ${coilVa} VA each at ${voltage} V. What secondary current do those coils require?`, `${answer} A`, numericOptions(answer, 0.2, 2, " A").filter((x) => x !== `${answer} A`), `Add the simultaneous coil VA, then divide by the control voltage to obtain current.`, [["Total VA", `${coils} × ${coilVa} VA = ${coils * coilVa} VA.`], ["Current", `${coils * coilVa} VA ÷ ${voltage} V = ${answer} A.`]], "Also consider transformer inrush and every load that can be energized at the same time.", correctIndex);
  }
  if (taskCode === "D-23") {
    const baseHz = 60; const baseRpm = 1760; const hz = 30 + (n % 5) * 5; const answer = number(baseRpm * hz / baseHz, 0);
    return calc(`Ignoring low-speed compensation and slip change, a motor runs 1760 rpm at 60 Hz. What approximate speed is expected at ${hz} Hz with proportional VFD control?`, `${answer} rpm`, numericOptions(answer, 150, 0, " rpm").filter((x) => x !== `${answer} rpm`), `For a first approximation, induction-motor speed varies in proportion to applied frequency when pole count is unchanged.`, [["Ratio", `Speed ratio = ${hz} ÷ ${baseHz}.`], ["Calculate", `1760 × ${hz} ÷ ${baseHz} = ${answer} rpm.`]], "Actual speed depends on load, slip, programmed limits and the motor-drive application.", correctIndex);
  }
  if (taskCode === "D-24") {
    const poles = [2, 4, 6, 8][n % 4]; const frequency = 60; const answer = 120 * frequency / poles;
    return calc(`What is the synchronous speed of a ${poles}-pole AC motor supplied at ${frequency} Hz?`, `${answer} rpm`, numericOptions(answer, 300, 0, " rpm").filter((x) => x !== `${answer} rpm`), `Synchronous speed is determined by frequency and pole count using Ns = 120f/P.`, [["Formula", "Ns = 120 × f ÷ P."], ["Calculate", `Ns = 120 × ${frequency} ÷ ${poles} = ${answer} rpm.`]], "An induction motor's loaded rotor speed is slightly below synchronous speed because it requires slip to produce torque.", correctIndex);
  }
  if (taskCode === "D-25" || taskCode === "E-28") {
    const percent = [25, 40, 60, 75][n % 4]; const answer = number(4 + 16 * percent / 100, 1);
    return calc(`A 4–20 mA signal represents 0–100% of a process range. What current represents ${percent}%?`, `${answer} mA`, numericOptions(answer, 2, 1, " mA").filter((x) => x !== `${answer} mA`), `The live span is 16 mA above a 4 mA zero. Multiply the span by the percentage, then add 4 mA.`, [["Span contribution", `16 mA × ${percent / 100} = ${number(16 * percent / 100, 1)} mA.`], ["Add live zero", `${number(16 * percent / 100, 1)} + 4 = ${answer} mA.`]], "Subtract the 4 mA live zero before converting a measured current back to percentage.", correctIndex);
  }
  if (taskCode === "E-26") {
    const devices = 12 + (n % 5) * 4; const ma = 18; const answer = number(devices * ma / 1000, 3);
    return calc(`A signalling circuit has ${devices} devices drawing ${ma} mA each in the stated alarm condition. What is their total current?`, `${answer} A`, numericOptions(answer, 0.05, 3, " A").filter((x) => x !== `${answer} A`), `Total current is the number of identical devices multiplied by current per device, then converted from milliamperes to amperes.`, [["Total milliamperes", `${devices} × ${ma} mA = ${devices * ma} mA.`], ["Convert", `${devices * ma} mA ÷ 1000 = ${answer} A.`]], "Include every simultaneous panel and field load when checking the approved standby-supply calculation.", correctIndex);
  }
  if (taskCode === "E-27") {
    const speakers = 4 + (n % 5) * 2; const watts = 5; const answer = speakers * watts;
    return calc(`A distributed audio zone has ${speakers} speakers tapped at ${watts} W each. What total amplifier load does the zone present?`, `${answer} W`, numericOptions(answer, 10, 0, " W").filter((x) => x !== `${answer} W`), `For a constant-voltage distributed system, add the selected wattage taps to estimate the amplifier load.`, [["Identify", `${speakers} speakers at ${watts} W each.`], ["Calculate", `${speakers} × ${watts} W = ${answer} W.`]], "The amplifier requires suitable spare capacity; confirm the design with approved equipment information.", correctIndex);
  }
  const voltage = 24; const resistance = 6 + (n % 5) * 2; const answer = number(voltage / resistance, 2);
  return calc(`A ${voltage} V control load has an effective resistance of ${resistance} Ω. What current does the simplified circuit draw?`, `${answer} A`, numericOptions(answer, 0.5, 2, " A").filter((x) => x !== `${answer} A`), `Ohm's law gives current as voltage divided by resistance.`, [["Formula", "I = V ÷ R."], ["Calculate", `I = ${voltage} ÷ ${resistance} = ${answer} A.`]], "Use this simplified relationship only when the load can be treated as resistive under the stated condition.", correctIndex);
}

function calc(question, correct, distractors, explanation, steps, tip, correctIndex) {
  return { question, options: placeCorrect(correct, distractors, correctIndex), correctIndex, explanation, steps: steps.map(([label, content]) => ({ label, content })), tip, isCalc: "yes" };
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function knowledgeQuestion({ type, profile: taskProfile, topic, subtaskTitle, context, correctIndex, diagramId, variant }) {
  const lowerTopic = topic.toLowerCase();
  const displayTopic = capitalize(topic);
  const diagramLead = diagramId ? "Using the referenced conceptual diagram, " : "";
  let question;
  let correct;
  if (type === "foundation") {
    const stems = [
      `${diagramLead}for ${context}, which statement best describes the role of ${lowerTopic} when an electrician ${subtaskTitle.toLowerCase()}?`,
      `${diagramLead}during ${context}, what information should govern the electrician's decision about ${lowerTopic} while the electrician ${subtaskTitle.toLowerCase()}?`,
      `${diagramLead}why should ${lowerTopic} be confirmed before work continues during ${context} where the electrician ${subtaskTitle.toLowerCase()}?`,
      `${diagramLead}which verification approach is most defensible for ${lowerTopic} during ${context} when the electrician ${subtaskTitle.toLowerCase()}?`
    ];
    question = stems[variant % stems.length];
    correct = `Verify ${lowerTopic} against the approved design, equipment rating, manufacturer data, and measured site condition.`;
  } else if (type === "applied_scenario") {
    const stems = [
      `${diagramLead}during ${context}, the crew finds that ${lowerTopic} does not match the approved information. What should the electrician do next?`,
      `${diagramLead}field information for ${lowerTopic} conflicts with the approved record during ${context}. Which response maintains control of the work?`,
      `${diagramLead}the crew is ready to continue during ${context}, but ${lowerTopic} has not been verified. What should happen next?`,
      `${diagramLead}during ${context}, a technician proposes accepting ${lowerTopic} based on a previous job. What should the supervising electrician require?`
    ];
    question = stems[variant % stems.length];
    correct = `Pause, verify ${lowerTopic} against approved information, resolve the discrepancy, document it, and then continue.`;
  } else {
    const stems = [
      `${diagramLead}after ${context}, the system shows a problem involving ${lowerTopic}. Which troubleshooting response is most appropriate?`,
      `${diagramLead}a symptom involving ${lowerTopic} appears during ${context}. How should the electrician isolate the cause?`,
      `${diagramLead}a repair changed one condition during ${context}, but the problem involving ${lowerTopic} remains. What is the best next approach?`,
      `${diagramLead}the maintenance record shows a recurring problem with ${lowerTopic} during ${context}. Which response is most reliable?`
    ];
    question = stems[variant % stems.length];
    correct = `Isolate the function, test ${lowerTopic}, correct the confirmed cause, and repeat the controlled functional test.`;
  }
  const distractorPool = [
    `Accept ${lowerTopic} from appearance alone because similar equipment worked on a previous project.`,
    `Bypass the protective or verification step so the system can remain available while the cause is assumed.`,
    `Change several unrelated settings at once, then treat any temporary improvement as proof of the repair.`,
    `Copy the previous project's setting for ${lowerTopic} without checking the present equipment or design.`,
    `Replace the largest accessible component first and document the reason only if the problem returns.`,
    `Clear the alarm or deficiency record and wait for another failure before collecting test information.`,
    `Use an operator's memory as the only acceptance record for ${lowerTopic}.`,
    `Continue the work and treat final energization as the first verification of ${lowerTopic}.`
  ];
  const distractors = [0, 1, 2].map((offset) => distractorPool[(variant * 2 + offset) % distractorPool.length]);
  question = capitalize(question);
  return {
    question,
    options: placeCorrect(correct, distractors, correctIndex),
    correctIndex,
    explanation: `${displayTopic} can directly affect ${taskProfile.risk}. The reliable approach is to use ${taskProfile.principle}, make one controlled decision at a time, and preserve test and change records for independent review.`,
    steps: null,
    tip: null,
    isCalc: "no"
  };
}

function calculationTopic(taskCode) {
  return ({
    "B-7": "three-phase real power", "B-8": "protected load current", "B-9": "distribution load current",
    "B-10": "UPS battery runtime", "B-11": "parallel path resistance", "B-12": "generator load current",
    "B-13": "PV string voltage", "B-14": "high-voltage load current", "B-15": "transformer turns ratio",
    "C-16": "circuit voltage drop", "C-17": "connected lighting power", "C-18": "control transformer current",
    "C-19": "resistive heating power", "C-20": "emergency battery energy", "C-21": "cathodic protection design current",
    "D-22": "control transformer coil current", "D-23": "frequency-speed relationship", "D-24": "synchronous motor speed",
    "D-25": "analog signal scaling", "E-26": "signalling device current", "E-27": "audio zone load",
    "E-28": "analog signal scaling"
  })[taskCode] ?? "electrical quantity";
}

function calculationSubtask(taskCode, defaultCode, taskIndex) {
  const compatible = {
    "B-7": ["B-7.02", "B-7.04"],
    "B-12": ["B-12.01", "B-12.02"],
    "D-23": ["D-23.01", "D-23.02"],
    "D-24": ["D-24.01", "D-24.02", "D-24.03", "D-24.04"],
    "E-27": ["E-27.02", "E-27.04"]
  }[taskCode];
  return compatible ? compatible[taskIndex % compatible.length] : defaultCode;
}

function diagramFor(taskCode, itemNumber) {
  if (taskCode.startsWith("B-15")) return "309A-D03";
  if (taskCode.startsWith("B-11")) return "309A-D05";
  if (taskCode.startsWith("B-13")) return "309A-D06";
  if (taskCode.startsWith("B-")) return "309A-D04";
  if (taskCode.startsWith("C-17")) return "309A-D08";
  if (taskCode.startsWith("C-20")) return "309A-D09";
  if (taskCode.startsWith("C-")) return "309A-D07";
  if (taskCode.startsWith("D-22")) return itemNumber % 2 ? "309A-D10" : "309A-D11";
  if (taskCode.startsWith("D-23")) return "309A-D12";
  if (taskCode.startsWith("D-24")) return "309A-D13";
  if (taskCode.startsWith("D-25")) return "309A-D16";
  if (taskCode.startsWith("E-26")) return "309A-D14";
  if (taskCode.startsWith("E-27")) return "309A-D15";
  return "309A-D16";
}

function createBatch(mwa) {
  const taskTypeSequence = balancedSequence({
    foundation: mwa.questionMix.foundation,
    applied_scenario: mwa.questionMix.appliedScenario,
    troubleshooting_or_calculation: mwa.questionMix.troubleshootingOrCalculation
  });
  const diagramPositions = evenlySelected(mwa.bankTarget, DIAGRAM_TARGET[mwa.code]);
  const criticalPositions = new Set(taskTypeSequence.map((type, index) => type === "troubleshooting_or_calculation" ? index : null).filter((value) => value !== null));
  const recallPositions = new Set(taskTypeSequence.map((type, index) => type === "foundation" ? index : null).filter((value) => value !== null).slice(0, mwa.cognitiveMix.recall));
  const calcPositions = new Set([...criticalPositions].slice(0, CALCULATION_TARGET[mwa.code]));
  const taxonomyMwa = taxonomy.majorWorkActivities.find((candidate) => candidate.code === mwa.code);
  const subtaskTitleByCode = new Map(taxonomyMwa.subtasks);
  const questions = [];
  let moduleIndex = 0;

  for (const task of mwa.tasks) {
    const profileForTask = taskProfiles[task.code];
    const subtasks = taxonomyMwa.subtasks.filter(([code]) => code.startsWith(`${task.code}.`));
    for (let taskIndex = 0; taskIndex < task.bankTarget; taskIndex += 1) {
      const bankItemNumber = MODULE_START[mwa.code] + moduleIndex;
      const type = taskTypeSequence[moduleIndex];
      const isCalculation = calcPositions.has(moduleIndex);
      const defaultSubtaskCode = subtasks[taskIndex % subtasks.length][0];
      const subtaskCode = isCalculation ? calculationSubtask(task.code, defaultSubtaskCode, taskIndex) : defaultSubtaskCode;
      const subtaskTitle = subtaskTitleByCode.get(subtaskCode);
      const topic = isCalculation ? calculationTopic(task.code) : profileForTask.topics[taskIndex % profileForTask.topics.length];
      const correctIndex = (bankItemNumber - 1) % 4;
      const diagramId = diagramPositions.has(moduleIndex) ? diagramFor(task.code, bankItemNumber) : null;
      const equipmentTag = `${task.code.replace("-", "")}-${String(taskIndex + 1).padStart(2, "0")}`;
      const context = `${contexts[(taskIndex + moduleIndex) % contexts.length]} on equipment ${equipmentTag}, where ${conditions[(taskIndex * 3 + moduleIndex) % conditions.length]}`;
      const body = isCalculation
        ? calculationFor(task.code, bankItemNumber, correctIndex)
        : knowledgeQuestion({ type, profile: profileForTask, topic, subtaskTitle, context, correctIndex, diagramId, variant: bankItemNumber });
      if (isCalculation) {
        body.question = `During ${context}, while evaluating ${topic.toLowerCase()} for work that ${subtaskTitle.toLowerCase()}, ${body.question.charAt(0).toLowerCase()}${body.question.slice(1)}`;
      }

      questions.push({
        bankItemNumber,
        taskCode: task.code,
        subtaskCode,
        topic: topic.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        difficulty: type === "foundation" ? (taskIndex % 3 === 0 ? "easy" : "medium") : type === "applied_scenario" ? "medium" : "hard",
        questionType: type,
        cognitiveLevel: criticalPositions.has(moduleIndex) ? "critical_thinking" : recallPositions.has(moduleIndex) ? "recall" : "procedural_application",
        ...body,
        diagramId,
        diagramAlt: diagramId ? diagrams.diagrams.find((diagram) => diagram.id === diagramId).altText : null,
        sourceReference: `MWA ${mwa.code}, Task ${task.code}, Sub-task ${subtaskCode}`,
        blueprintObjective: `Apply ${topic.toLowerCase()} knowledge while the electrician ${subtaskTitle.toLowerCase()}.`,
        contentHash: "0".repeat(64)
      });
      moduleIndex += 1;
    }
  }

  return {
    batch: mwa.code,
    title: mwa.title,
    questionDefaults: {
      bankKey: allocation.bankKey,
      bankVersionKey: allocation.bankVersionKey,
      blueprintVersion: allocation.blueprintVersion,
      module: mwa.code,
      steps: null,
      tip: null,
      isCalc: "no",
      diagramId: null,
      diagramAlt: null,
      sourceId: `red-seal-previous-rsos-mwa-${mwa.code.toLowerCase()}`,
      sourceTitle: `Construction Electrician previous RSOS — Major Work Activity ${mwa.code}`,
      sourceUrl: taxonomyMwa.sourceUrl,
      authorIdentity: "OpenAI Codex",
      origin: "ai_assisted",
      contentStatus: "draft",
      publicEligibility: false
    },
    questions
  };
}

mkdirSync(outputDirectory, { recursive: true });
for (const mwa of allocation.majorWorkActivities.filter((candidate) => candidate.code !== "A")) {
  const batch = createBatch(mwa);
  const path = resolve(outputDirectory, `batch-${mwa.code.toLowerCase()}.json`);
  writeFileSync(path, `${JSON.stringify(batch, null, 2)}\n`);
  console.log(`Generated ${batch.questions.length} questions for batch ${mwa.code}.`);
}
