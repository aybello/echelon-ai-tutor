import type { Electrician309AModuleCode } from "@shared/electrician309aBlueprint";
import { Electrician309ADiagram, type Electrician309ADiagramId } from "./Electrician309ADiagrams";

const WORKFLOWS: Record<Electrician309AModuleCode, readonly string[]> = {
  A: [
    "Define the task, identify every energy source, and assess the site hazards.",
    "Apply the required controls, isolation, lockout, and absence-of-voltage verification.",
    "Select inspected tools, access equipment, supports, and lifting methods for the task.",
    "Complete the work against the current drawings and approved specifications.",
    "Test, document, communicate, and hand over the system in a controlled state.",
  ],
  B: [
    "Establish the supply arrangement, voltage, phases, calculated load, and available source information.",
    "Trace the one-line path through service equipment, protection, distribution, and the connected load.",
    "Check equipment ratings, conductor relationships, bonding, and environmental suitability.",
    "Verify polarity, phase sequence, settings, and interlocks before functional testing.",
    "Compare measured results with approved design and manufacturer information, then document the outcome.",
  ],
  C: [
    "Read the current layout and identify the supply, load, control points, and environmental conditions.",
    "Plan conductor type, route, bends, supports, enclosures, and pulling method as one system.",
    "Protect insulation and fire separations while installing and terminating conductors.",
    "Verify polarity, identification, control sequence, and equipment interfaces.",
    "Functionally test the complete circuit and update labels, schedules, and maintenance records.",
  ],
  D: [
    "Confirm motor, starter, or drive nameplate data and the driven-load requirement.",
    "Trace the control path from stop and safety contacts through start logic to the output device.",
    "Check overloads, interlocks, control voltage, phase sequence, and programmed limits.",
    "Test one condition at a time while monitoring current, speed, feedback, and fault history.",
    "Correct the confirmed cause, restore safeguards, and repeat the complete operating sequence.",
  ],
  E: [
    "Confirm the approved system drawing, device function, pathway, and standby-power requirement.",
    "Trace the signal from the initiating or input device to the control equipment.",
    "Verify supervision, addressing, polarity, termination, and communication-path performance.",
    "Confirm notification, display, priority, and associated-system actions under controlled tests.",
    "Record every tested point, deficiency, correction, and final verification result.",
  ],
};

const MODULE_DIAGRAMS: Record<Electrician309AModuleCode, readonly Electrician309ADiagramId[]> = {
  A: ["309A-D01", "309A-D02"],
  B: ["309A-D04", "309A-D05", "309A-D03", "309A-D06"],
  C: ["309A-D07", "309A-D08", "309A-D09"],
  D: ["309A-D10", "309A-D11", "309A-D12", "309A-D13", "309A-D16"],
  E: ["309A-D14", "309A-D15", "309A-D16"],
};

export function Electrician309AStudySupplement({ moduleCode }: { moduleCode: Electrician309AModuleCode }) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section>
        <h3 style={{ margin: "0 0 10px", fontSize: 14, color: "#0F172A" }}>Working process</h3>
        <ol style={{ display: "grid", gap: 8, margin: 0, padding: 0, listStyle: "none" }}>
          {WORKFLOWS[moduleCode].map((step, index) => (
            <li key={step} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#F8FAFC", borderRadius: 10, padding: 10, color: "#475569", fontSize: 12, lineHeight: 1.6 }}>
              <span style={{ display: "inline-flex", width: 24, height: 24, flex: "0 0 24px", alignItems: "center", justifyContent: "center", borderRadius: 99, background: "#0047AB", color: "white", fontWeight: 800 }}>{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h3 style={{ margin: "0 0 10px", fontSize: 14, color: "#0F172A" }}>Concept diagrams</h3>
        <div style={{ display: "grid", gap: 14 }}>
          {MODULE_DIAGRAMS[moduleCode].map((id) => <Electrician309ADiagram key={id} id={id} />)}
        </div>
      </section>
    </div>
  );
}
