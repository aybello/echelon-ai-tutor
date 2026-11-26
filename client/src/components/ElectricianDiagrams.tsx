import React from "react";

export type ElectricianDiagramId =
  | "309A-D01"
  | "309A-D03"
  | "309A-D04"
  | "309A-D05"
  | "309A-D10";

export const ELECTRICIAN_DIAGRAMS: ReadonlyArray<{
  id: ElectricianDiagramId;
  title: string;
  blueprint: string;
  description: string;
  alt: string;
}> = [
  {
    id: "309A-D01",
    title: "Lockout and verify",
    blueprint: "A-1 · Safety",
    description: "A conceptual sequence for isolating energy and confirming absence of voltage.",
    alt: "Five step lockout sequence: identify energy, isolate, lock and tag, verify absence of voltage, then begin work.",
  },
  {
    id: "309A-D03",
    title: "Transformer ratio",
    blueprint: "B-15 · Transformers",
    description: "See how winding turns relate to primary and secondary voltage in a conceptual transformer.",
    alt: "Transformer diagram with primary winding, magnetic core, secondary winding, and a turns-to-voltage ratio relationship.",
  },
  {
    id: "309A-D04",
    title: "Power to protected load",
    blueprint: "B-8 / B-9 · Distribution",
    description: "Trace the conceptual path from a service source through protection to a branch-circuit load.",
    alt: "One-line electrical distribution diagram from service source to main disconnect, distribution panel, branch protection, and load.",
  },
  {
    id: "309A-D05",
    title: "Grounding and bonding",
    blueprint: "B-11 · Fault paths",
    description: "Understand the conceptual fault-current return path and why bonding supports rapid clearing.",
    alt: "Conceptual diagram showing a fault at equipment enclosure, bonding conductor return path, and source protective device.",
  },
  {
    id: "309A-D10",
    title: "Motor starter logic",
    blueprint: "D-22 · Controls",
    description: "Read the functional relationship among stop, start, overload, coil, and motor power contacts.",
    alt: "Simplified motor starter control diagram showing stop and overload contacts in series with a start contact, coil, seal-in contact, and motor power path.",
  },
];

const navy = "#1E3A5F";
const blue = "#0047AB";
const teal = "#00A8B5";
const slate = "#64748B";

function Arrow({ x1, y1, x2, y2, color = blue }: { x1: number; y1: number; x2: number; y2: number; color?: string }) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 10;
  const a = Math.PI / 7;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d={`M ${x2} ${y2} L ${x2 - head * Math.cos(angle - a)} ${y2 - head * Math.sin(angle - a)} L ${x2 - head * Math.cos(angle + a)} ${y2 - head * Math.sin(angle + a)} Z`} fill={color} />
    </g>
  );
}

function Step({ x, label, detail, active = false }: { x: number; label: string; detail: string; active?: boolean }) {
  return (
    <g>
      <circle cx={x} cy="104" r="31" fill={active ? "#DBF6F7" : "#EFF6FF"} stroke={active ? teal : blue} strokeWidth="2.5" />
      <text x={x} y="99" textAnchor="middle" fontSize="10" fontWeight="800" fill={navy}>{label}</text>
      <text x={x} y="113" textAnchor="middle" fontSize="8" fontWeight="700" fill={slate}>{detail}</text>
    </g>
  );
}

function LockoutDiagram() {
  const steps = [
    [60, "1", "Identify"], [155, "2", "Isolate"], [250, "3", "Lock + tag"], [345, "4", "Verify"], [440, "5", "Work"],
  ] as const;
  return (
    <svg viewBox="0 0 500 175" className="h-auto w-full" role="img" aria-labelledby="lockout-title lockout-desc">
      <title id="lockout-title">Lockout and absence-of-voltage sequence</title>
      <desc id="lockout-desc">Conceptual safety sequence for identifying, isolating, locking, verifying, and beginning work.</desc>
      <rect x="16" y="25" width="468" height="118" rx="18" fill="#F8FAFC" stroke="#CBD5E1" />
      {steps.map(([x, label, detail], index) => (
        <React.Fragment key={label}>
          {index < steps.length - 1 && <Arrow x1={x + 35} y1={104} x2={steps[index + 1][0] - 35} y2={104} color={index === 3 ? teal : blue} />}
          <Step x={x} label={label} detail={detail} active={index === 3} />
        </React.Fragment>
      ))}
      <text x="250" y="159" textAnchor="middle" fontSize="10" fontWeight="700" fill={slate}>Conceptual sequence — always follow site procedures and qualified-person requirements.</text>
    </svg>
  );
}

function TransformerDiagram() {
  const coil = (x: number, color: string) => Array.from({ length: 5 }, (_, index) => (
    <path key={`${x}-${index}`} d={`M ${x} ${56 + index * 17} q -17 8 0 16 q 17 8 0 16`} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
  ));
  return (
    <svg viewBox="0 0 500 175" className="h-auto w-full" role="img" aria-labelledby="transformer-title transformer-desc">
      <title id="transformer-title">Transformer turns and voltage relationship</title>
      <desc id="transformer-desc">A primary and secondary winding are separated by a magnetic core. The voltage ratio concept follows the turns ratio.</desc>
      <rect x="18" y="18" width="464" height="140" rx="18" fill="#F8FAFC" stroke="#CBD5E1" />
      <rect x="218" y="37" width="64" height="88" rx="10" fill="#DCECF5" stroke={navy} strokeWidth="3" />
      <text x="250" y="84" textAnchor="middle" fontSize="10" fontWeight="800" fill={navy}>MAGNETIC</text>
      <text x="250" y="98" textAnchor="middle" fontSize="10" fontWeight="800" fill={navy}>CORE</text>
      <g>{coil(179, blue)}</g>
      <g transform="scale(-1 1) translate(-679 0)">{coil(179, teal)}</g>
      <Arrow x1={48} y1={82} x2={151} y2={82} />
      <Arrow x1={349} y1={82} x2={452} y2={82} color={teal} />
      <text x="100" y="60" textAnchor="middle" fontSize="11" fontWeight="800" fill={navy}>PRIMARY</text>
      <text x="100" y="119" textAnchor="middle" fontSize="10" fontWeight="700" fill={slate}>Vₚ · Nₚ turns</text>
      <text x="400" y="60" textAnchor="middle" fontSize="11" fontWeight="800" fill={navy}>SECONDARY</text>
      <text x="400" y="119" textAnchor="middle" fontSize="10" fontWeight="700" fill={slate}>Vₛ · Nₛ turns</text>
      <text x="250" y="145" textAnchor="middle" fontSize="11" fontWeight="800" fill={blue}>Vₚ / Vₛ = Nₚ / Nₛ</text>
    </svg>
  );
}

function DistributionDiagram() {
  const boxes = [
    [42, "SERVICE", "source"], [138, "MAIN", "disconnect"], [234, "PANEL", "distribution"], [330, "BRANCH", "protection"], [426, "LOAD", "utilization"],
  ] as const;
  return (
    <svg viewBox="0 0 500 175" className="h-auto w-full" role="img" aria-labelledby="distribution-title distribution-desc">
      <title id="distribution-title">Distribution hierarchy and protective device path</title>
      <desc id="distribution-desc">Conceptual electrical one-line path from service source through main disconnect, panel, branch protection, and load.</desc>
      <rect x="18" y="18" width="464" height="140" rx="18" fill="#F8FAFC" stroke="#CBD5E1" />
      {boxes.map(([x, heading, detail], index) => (
        <React.Fragment key={heading}>
          {index < boxes.length - 1 && <Arrow x1={x + 58} y1={85} x2={boxes[index + 1][0] - 8} y2={85} color={index === 3 ? teal : blue} />}
          <rect x={x} y="57" width="58" height="56" rx="10" fill={heading === "LOAD" ? "#DBF6F7" : "#EFF6FF"} stroke={heading === "LOAD" ? teal : blue} strokeWidth="2" />
          <text x={x + 29} y="80" textAnchor="middle" fontSize="9" fontWeight="800" fill={navy}>{heading}</text>
          <text x={x + 29} y="95" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={slate}>{detail}</text>
        </React.Fragment>
      ))}
      <text x="250" y="143" textAnchor="middle" fontSize="10" fontWeight="700" fill={slate}>Each protection layer has a distinct function in a conceptual system path.</text>
    </svg>
  );
}

function BondingDiagram() {
  return (
    <svg viewBox="0 0 500 175" className="h-auto w-full" role="img" aria-labelledby="bonding-title bonding-desc">
      <title id="bonding-title">Grounding and bonding conceptual fault path</title>
      <desc id="bonding-desc">A conceptual diagram of a source protective device, equipment enclosure, and bonding return path during a fault.</desc>
      <rect x="18" y="18" width="464" height="140" rx="18" fill="#F8FAFC" stroke="#CBD5E1" />
      <rect x="55" y="55" width="72" height="58" rx="10" fill="#EFF6FF" stroke={blue} strokeWidth="2" />
      <text x="91" y="79" textAnchor="middle" fontSize="9" fontWeight="800" fill={navy}>SOURCE +</text>
      <text x="91" y="93" textAnchor="middle" fontSize="9" fontWeight="800" fill={navy}>PROTECTION</text>
      <rect x="336" y="55" width="92" height="58" rx="10" fill="#FFF7ED" stroke="#D97706" strokeWidth="2" />
      <text x="382" y="79" textAnchor="middle" fontSize="9" fontWeight="800" fill={navy}>EQUIPMENT</text>
      <text x="382" y="93" textAnchor="middle" fontSize="9" fontWeight="800" fill={navy}>ENCLOSURE</text>
      <Arrow x1={128} y1={69} x2={335} y2={69} color={blue} />
      <text x="232" y="57" textAnchor="middle" fontSize="8" fontWeight="700" fill={slate}>normal supply path</text>
      <circle cx="382" cy="116" r="7" fill="#EF4444" />
      <text x="396" y="120" fontSize="8" fontWeight="800" fill="#B91C1C">fault</text>
      <path d="M 382 123 L 382 137 L 145 137 L 145 104 L 127 104" fill="none" stroke={teal} strokeWidth="4" strokeLinecap="round" strokeDasharray="8 4" />
      <path d="M 130 105 L 119 99 L 120 112 Z" fill={teal} />
      <text x="255" y="154" textAnchor="middle" fontSize="10" fontWeight="800" fill={teal}>bonding return path supports protective-device operation</text>
    </svg>
  );
}

function MotorStarterDiagram() {
  return (
    <svg viewBox="0 0 500 175" className="h-auto w-full" role="img" aria-labelledby="motor-title motor-desc">
      <title id="motor-title">Across-the-line motor starter control concept</title>
      <desc id="motor-desc">A simplified control logic diagram showing stop, overload, start, coil, seal-in contact, and motor power contacts.</desc>
      <rect x="18" y="18" width="464" height="140" rx="18" fill="#F8FAFC" stroke="#CBD5E1" />
      <line x1="55" y1="42" x2="55" y2="130" stroke={navy} strokeWidth="3" />
      <line x1="445" y1="42" x2="445" y2="130" stroke={navy} strokeWidth="3" />
      <text x="55" y="34" textAnchor="middle" fontSize="9" fontWeight="800" fill={slate}>CONTROL</text>
      <text x="445" y="34" textAnchor="middle" fontSize="9" fontWeight="800" fill={slate}>RETURN</text>
      <line x1="55" y1="76" x2="445" y2="76" stroke={blue} strokeWidth="2.5" />
      {[[110, "STOP"], [180, "OL"], [250, "START"]].map(([x, label]) => (
        <g key={label as string}>
          <rect x={(x as number) - 22} y="64" width="44" height="24" rx="5" fill="#FFF" stroke={label === "START" ? teal : blue} strokeWidth="2" />
          <text x={x as number} y="80" textAnchor="middle" fontSize="8" fontWeight="800" fill={navy}>{label}</text>
        </g>
      ))}
      <circle cx="350" cy="76" r="22" fill="#DBF6F7" stroke={teal} strokeWidth="2.5" />
      <text x="350" y="80" textAnchor="middle" fontSize="9" fontWeight="800" fill={navy}>COIL</text>
      <path d="M 250 101 L 250 117 L 328 117 L 328 101" fill="none" stroke={teal} strokeWidth="2.5" strokeDasharray="6 4" />
      <text x="289" y="132" textAnchor="middle" fontSize="8" fontWeight="800" fill={teal}>seal-in contact</text>
      <Arrow x1={350} y1={108} x2={410} y2={108} color={teal} />
      <rect x="409" y="95" width="40" height="26" rx="6" fill="#EFF6FF" stroke={blue} strokeWidth="2" />
      <text x="429" y="112" textAnchor="middle" fontSize="8" fontWeight="800" fill={navy}>MOTOR</text>
      <text x="250" y="151" textAnchor="middle" fontSize="10" fontWeight="700" fill={slate}>Functional concept only — not an installation diagram.</text>
    </svg>
  );
}

export function ElectricianDiagram({ id }: { id: ElectricianDiagramId }) {
  switch (id) {
    case "309A-D01": return <LockoutDiagram />;
    case "309A-D03": return <TransformerDiagram />;
    case "309A-D04": return <DistributionDiagram />;
    case "309A-D05": return <BondingDiagram />;
    case "309A-D10": return <MotorStarterDiagram />;
  }
}

export function ElectricianDiagramLibrary() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {ELECTRICIAN_DIAGRAMS.map((diagram) => (
        <article key={diagram.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 p-4"><ElectricianDiagram id={diagram.id} /></div>
          <div className="p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#0047AB]">{diagram.blueprint}</p>
            <h3 className="mt-2 text-lg font-extrabold text-[#1E3A5F]">{diagram.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{diagram.description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
