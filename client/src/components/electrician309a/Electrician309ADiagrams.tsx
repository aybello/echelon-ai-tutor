import type { ReactNode } from "react";

type DiagramNode = { label: string; detail: string };

type DiagramDefinition = {
  title: string;
  description: string;
  nodes: readonly DiagramNode[];
  feedback?: boolean;
};

export const ELECTRICIAN_309A_DIAGRAMS = {
  "309A-D01": { title: "Safe isolation sequence", description: "Conceptual sequence; site procedures and qualified supervision govern the actual work.", nodes: [{ label: "1 · Identify", detail: "Every energy source" }, { label: "2 · Isolate", detail: "Open approved isolating means" }, { label: "3 · Lock + tag", detail: "Maintain personal control" }, { label: "4 · Stored energy", detail: "Release, block or control" }, { label: "5 · Verify", detail: "Prove tester, test, re-prove" }] },
  "309A-D02": { title: "Drawing-to-field workflow", description: "Current project information must remain traceable through installation.", nodes: [{ label: "Legend", detail: "Symbols and abbreviations" }, { label: "One-line", detail: "Functional power path" }, { label: "Plan", detail: "Location and routing" }, { label: "Field check", detail: "Conflicts and conditions" }, { label: "As-built", detail: "Authorized installed change" }] },
  "309A-D03": { title: "Transformer relationship", description: "Voltage ratio follows the winding-turns ratio in an ideal transformer.", nodes: [{ label: "Primary", detail: "V₁ · N₁" }, { label: "Magnetic flux", detail: "Alternating core flux" }, { label: "Secondary", detail: "V₂ · N₂" }] },
  "309A-D04": { title: "Distribution and protection path", description: "Protection is coordinated along the source-to-load path.", nodes: [{ label: "Source", detail: "Available electrical energy" }, { label: "Main protection", detail: "Service or system boundary" }, { label: "Distribution", detail: "Bus and switching" }, { label: "Feeder protection", detail: "Downstream circuit" }, { label: "Load", detail: "Utilization equipment" }] },
  "309A-D05": { title: "Conceptual bonding fault path", description: "A low-impedance metallic path supports prompt operation of protection.", nodes: [{ label: "Line conductor", detail: "Unintended contact" }, { label: "Metal enclosure", detail: "Faulted exposed part" }, { label: "Bonding path", detail: "Continuous return route" }, { label: "Source point", detail: "Completes fault circuit" }, { label: "Protection", detail: "Interrupts fault current" }], feedback: true },
  "309A-D06": { title: "PV and storage conversion", description: "A conceptual DC-to-AC renewable-energy path.", nodes: [{ label: "PV array", detail: "DC generation" }, { label: "DC isolation", detail: "Controlled separation" }, { label: "Inverter", detail: "DC to AC conversion" }, { label: "AC distribution", detail: "Loads and interconnection" }, { label: "Storage", detail: "Bidirectional energy path" }], feedback: true },
  "309A-D07": { title: "Conductor route variables", description: "Route length, current and resistance contribute to voltage drop.", nodes: [{ label: "Source", detail: "Vsource" }, { label: "Outgoing path", detail: "Length L · resistance R" }, { label: "Load", detail: "Current I" }, { label: "Return path", detail: "Complete circuit length" }, { label: "Load voltage", detail: "Vsource − Vdrop" }] },
  "309A-D08": { title: "Multi-location switching principle", description: "End and intermediate switching states create or interrupt a complete path.", nodes: [{ label: "Supply", detail: "Circuit source" }, { label: "End switch A", detail: "Selects traveller path" }, { label: "Intermediate", detail: "Straight or crossed" }, { label: "End switch B", detail: "Selects traveller path" }, { label: "Luminaire", detail: "On when path is complete" }] },
  "309A-D09": { title: "Emergency-lighting sequence", description: "Loss of normal power causes stored energy to supply emergency luminaires.", nodes: [{ label: "Normal source", detail: "Powers load and charger" }, { label: "Charger", detail: "Maintains battery" }, { label: "Battery", detail: "Stored energy" }, { label: "Transfer function", detail: "Detects source loss" }, { label: "Emergency lights", detail: "Illumination during outage" }], feedback: true },
  "309A-D10": { title: "Starter control path", description: "A conceptual seal-in circuit with stop and overload protection contacts.", nodes: [{ label: "Stop", detail: "Normally closed command" }, { label: "Start", detail: "Momentary run command" }, { label: "Seal-in", detail: "Auxiliary holding contact" }, { label: "Overload", detail: "Normally closed trip contact" }, { label: "Starter coil", detail: "Operates power contacts" }], feedback: true },
  "309A-D11": { title: "Forward/reverse interlock", description: "Interlocks prevent forward and reverse contactors from closing together.", nodes: [{ label: "Forward command", detail: "Requests forward contactor" }, { label: "Reverse NC interlock", detail: "Blocks if reverse is active" }, { label: "Mechanical interlock", detail: "Physical mutual exclusion" }, { label: "Forward contactor", detail: "Forward phase sequence" }, { label: "Reverse contactor", detail: "Alternate phase sequence" }], feedback: true },
  "309A-D12": { title: "Variable-frequency drive", description: "The drive converts fixed-frequency input to adjustable motor output.", nodes: [{ label: "AC input", detail: "Fixed voltage and frequency" }, { label: "Rectifier", detail: "AC to DC" }, { label: "DC bus", detail: "Filters and stores energy" }, { label: "Inverter", detail: "Synthesizes variable AC" }, { label: "Motor", detail: "Speed and torque response" }], feedback: true },
  "309A-D13": { title: "Motor speed and slip", description: "Rotor speed remains below synchronous speed when an induction motor produces torque.", nodes: [{ label: "Frequency", detail: "f in hertz" }, { label: "Pole count", detail: "P poles" }, { label: "Synchronous speed", detail: "Ns = 120f ÷ P" }, { label: "Slip", detail: "Difference from Ns" }, { label: "Rotor speed", detail: "Nr = Ns(1 − slip)" }] },
  "309A-D14": { title: "Fire-alarm functional path", description: "Initiation is evaluated by the control unit before notification and associated actions.", nodes: [{ label: "Initiating device", detail: "Detects or reports condition" }, { label: "Input circuit", detail: "Carries supervised signal" }, { label: "Control unit", detail: "Evaluates system state" }, { label: "Notification", detail: "Audible and visual output" }, { label: "Associated systems", detail: "Approved control functions" }] },
  "309A-D15": { title: "Structured-cabling hierarchy", description: "Permanent links connect telecommunications spaces to work areas.", nodes: [{ label: "Entrance facility", detail: "External service handoff" }, { label: "Equipment room", detail: "Core equipment" }, { label: "Backbone", detail: "Inter-room connection" }, { label: "Telecom room", detail: "Horizontal distribution" }, { label: "Work area", detail: "User outlet and cord" }] },
  "309A-D16": { title: "Sensor-controller-actuator loop", description: "Feedback lets the controller compare measured and desired process values.", nodes: [{ label: "Setpoint", detail: "Desired value" }, { label: "Controller", detail: "Compares and decides" }, { label: "Actuator", detail: "Changes the process" }, { label: "Process", detail: "Controlled result" }, { label: "Sensor", detail: "Measures feedback" }], feedback: true }
} as const satisfies Record<string, DiagramDefinition>;

export type Electrician309ADiagramId = keyof typeof ELECTRICIAN_309A_DIAGRAMS;

function Arrow({ x1, x2, y, markerId, dashed = false }: { x1: number; x2: number; y: number; markerId: string; dashed?: boolean }) {
  return <line x1={x1} x2={x2} y1={y} y2={y} stroke="#1E3A5F" strokeWidth="3" strokeDasharray={dashed ? "8 6" : undefined} markerEnd={`url(#${markerId})`} />;
}

export function Electrician309ADiagram({ id, caption }: { id: Electrician309ADiagramId; caption?: ReactNode }) {
  const diagram: DiagramDefinition = ELECTRICIAN_309A_DIAGRAMS[id];
  const width = 920;
  const nodeWidth = 148;
  const gap = 34;
  const startX = 18;
  const y = 76;
  const markerId = `${id}-arrow`;

  return (
    <figure className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <svg viewBox={`0 0 ${width} 230`} className="h-auto w-full" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>{diagram.title}</title>
        <desc id={`${id}-desc`}>{diagram.description} {diagram.nodes.map((node) => `${node.label}: ${node.detail}.`).join(" ")}</desc>
        <defs><marker id={markerId} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#1E3A5F" /></marker></defs>
        <text x="18" y="28" fill="#0f172a" fontSize="20" fontWeight="700">{diagram.title}</text>
        <text x="18" y="50" fill="#475569" fontSize="13">{diagram.description}</text>
        {diagram.nodes.map((node, index) => {
          const x = startX + index * (nodeWidth + gap);
          return (
            <g key={node.label}>
              {index > 0 && <Arrow x1={x - gap + 4} x2={x - 6} y={y + 42} markerId={markerId} dashed={index % 2 === 0} />}
              <rect x={x} y={y} width={nodeWidth} height="84" rx="12" fill={index % 2 === 0 ? "#eff6ff" : "#ecfeff"} stroke={index % 2 === 0 ? "#0047AB" : "#0f766e"} strokeWidth="2" />
              <text x={x + 12} y={y + 28} fill="#0f172a" fontSize="14" fontWeight="700">{node.label}</text>
              <text x={x + 12} y={y + 53} fill="#334155" fontSize="12">{node.detail}</text>
            </g>
          );
        })}
        {diagram.feedback && <path d="M 836 174 C 836 214, 90 214, 90 170" fill="none" stroke="#0f766e" strokeWidth="3" strokeDasharray="7 6" markerEnd={`url(#${markerId})`} />}
      </svg>
      <figcaption className="mt-2 text-sm text-slate-600">{caption ?? diagram.description}</figcaption>
    </figure>
  );
}
