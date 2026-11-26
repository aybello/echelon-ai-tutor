import type { CeuLesson } from "@shared/ceuLearning";
import { ceuDiagramFor } from "@shared/ceuDiagrams";

const FAMILY_COLORS = {
  treatment: { accent: "#0f766e", soft: "#ccfbf1", ink: "#115e59" },
  control: { accent: "#2563eb", soft: "#dbeafe", ink: "#1e40af" },
  evidence: { accent: "#7c3aed", soft: "#ede9fe", ink: "#5b21b6" },
  calculation: { accent: "#c2410c", soft: "#ffedd5", ink: "#9a3412" },
  safety: { accent: "#b45309", soft: "#fef3c7", ink: "#92400e" },
  leadership: { accent: "#be185d", soft: "#fce7f3", ink: "#9d174d" },
} as const;

type Colors = (typeof FAMILY_COLORS)[keyof typeof FAMILY_COLORS];

function Label({ x, y, children, anchor = "middle", color = "#14283d", size = 13, weight = 700 }: { x: number; y: number; children: string; anchor?: "start" | "middle" | "end"; color?: string; size?: number; weight?: number }) {
  return <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={size} fontWeight={weight}>{children}</text>;
}

function CustomVisual({ variant, colors }: { variant: string; colors: Colors }) {
  if (variant === "ppm-conversion") {
    return <>
      <Label x={24} y={34} anchor="start" color={colors.ink} size={14}>ppm by volume</Label>
      <rect x={24} y={50} width={250} height={38} rx={10} fill={colors.soft} stroke={colors.accent} strokeWidth={2} />
      <Label x={149} y={75}>2,500 ppm</Label>
      <path d="M 286 69 H 444" stroke={colors.accent} strokeWidth={3} /><path d="M 432 61 L 444 69 L 432 77" fill="none" stroke={colors.accent} strokeWidth={3} />
      <Label x={365} y={53} size={11} color={colors.ink}>÷ 10,000</Label>
      <rect x={456} y={50} width={250} height={38} rx={10} fill={colors.soft} stroke={colors.accent} strokeWidth={2} />
      <Label x={581} y={75}>0.25% by volume</Label>
      <Label x={24} y={130} anchor="start" color={colors.ink} size={12}>Reverse direction: percent × 10,000 = ppm</Label>
      <Label x={24} y={154} anchor="start" color="#526579" size={11}>Illustrative gas-meter reading, not an exposure limit.</Label>
    </>;
  }
  if (variant === "pressure-scale") {
    return <>
      <Label x={24} y={34} anchor="start" color={colors.ink} size={14}>Pressure reference scale</Label>
      <line x1="52" y1="92" x2="704" y2="92" stroke={colors.accent} strokeWidth={4} />
      {[52, 215, 378, 541, 704].map(x => <line key={x} x1={x} y1="82" x2={x} y2="102" stroke={colors.accent} strokeWidth={2} />)}
      <Label x={52} y={126} size={11}>0 psia</Label><Label x={52} y={70} size={11} color={colors.ink}>Perfect vacuum</Label>
      <Label x={378} y={126} size={11}>14.7 psia</Label><Label x={378} y={70} size={11} color={colors.ink}>0 psig at sea level</Label>
      <Label x={704} y={126} size={11}>Positive psig</Label><Label x={704} y={70} anchor="end" size={11} color={colors.ink}>Absolute = gauge + atmosphere</Label>
      <rect x={125} y={145} width={510} height={30} rx={9} fill={colors.soft} stroke={colors.accent} strokeWidth={1.5} />
      <Label x={380} y={165} size={12}>A negative suction gauge can still be positive absolute pressure.</Label>
    </>;
  }
  if (variant === "ratio-bar") {
    return <>
      <Label x={24} y={34} anchor="start" color={colors.ink} size={14}>1 part polymer + 24 parts water = 25 total parts</Label>
      <rect x={24} y={62} width={26} height={42} rx={6} fill={colors.accent} />
      <rect x={52} y={62} width={624} height={42} rx={6} fill={colors.soft} stroke={colors.accent} strokeWidth={2} />
      <Label x={37} y={88} color="#fff" size={11}>1</Label><Label x={364} y={88} color={colors.ink}>24 parts water</Label>
      <Label x={24} y={138} anchor="start" color={colors.ink} size={12}>Finished-batch share uses the 25-part total as the denominator.</Label>
    </>;
  }
  return <>
    <Label x={24} y={34} anchor="start" color={colors.ink} size={14}>Conventional municipal wastewater treatment train</Label>
    {["Influent", "Screens + grit", "Primary clarifier", "Biological treatment", "Secondary clarification", "Disinfection", "Effluent"].map((label, index) => {
      const x = 18 + index * 104;
      return <g key={label}><rect x={x} y={62} width={86} height={48} rx={9} fill={colors.soft} stroke={colors.accent} strokeWidth={1.8} /><Label x={x + 43} y={91} size={10} color={colors.ink}>{label}</Label>{index < 6 && <path d={`M ${x + 89} 86 H ${x + 101}`} stroke={colors.accent} strokeWidth={2} />}</g>;
    })}
    <path d="M 270 122 C 270 176, 486 176, 486 122" fill="none" stroke={colors.accent} strokeWidth={2.5} strokeDasharray="6 5" />
    <Label x={378} y={193} size={11} color={colors.ink}>Solids leave at primary and secondary stages; water continues forward.</Label>
  </>;
}

export default function CeuLearningDiagram({ module }: { module: Pick<CeuLesson, "id" | "title"> }) {
  const diagram = ceuDiagramFor(module);
  const colors = FAMILY_COLORS[diagram.family];
  const titleId = `ceu-diagram-title-${module.id}`;
  const descriptionId = `ceu-diagram-description-${module.id}`;
  const nodeWidth = 132;
  const nodeGap = 10;
  const startX = 10;
  const custom = diagram.variant !== "steps";

  return (
    <figure className={`ceu-learning-diagram ceu-learning-diagram-${diagram.family}`} aria-labelledby={titleId}>
      <div className="ceu-learning-diagram-heading">
        <div><span className="ceu-diagram-eyebrow">Visual guide</span><h2 id={titleId}>{diagram.title}</h2></div>
        <span className="ceu-diagram-legend"><i style={{ backgroundColor: colors.accent }} /> {diagram.family === "treatment" ? "Material flow" : "Learning loop"}</span>
      </div>
      <svg viewBox={custom ? "0 0 730 220" : "0 0 730 178"} role="img" aria-labelledby={`${titleId} ${descriptionId}`} className="ceu-learning-diagram-svg">
        <desc id={descriptionId}>{diagram.caption} {diagram.steps.join(", then ")}.</desc>
        {custom ? <CustomVisual variant={diagram.variant} colors={colors} /> : <>
          <line x1="20" y1="76" x2="710" y2="76" stroke={colors.accent} strokeWidth="4" strokeLinecap="round" opacity="0.2" />
          {diagram.steps.map((step, index) => {
            const x = startX + index * (nodeWidth + nodeGap);
            const center = x + nodeWidth / 2;
            const words = step.split(" ");
            const first = words.length > 1 ? words.slice(0, Math.ceil(words.length / 2)).join(" ") : step;
            const second = words.length > 1 ? words.slice(Math.ceil(words.length / 2)).join(" ") : "";
            return <g key={step}>
              {index < diagram.steps.length - 1 && <path d={`M ${x + nodeWidth + 2} 76 H ${x + nodeWidth + nodeGap - 4}`} stroke={colors.accent} strokeWidth="2.5" markerEnd="url(#ceu-arrow)" />}
              <rect x={x} y="34" width={nodeWidth} height="84" rx="14" fill={colors.soft} stroke={colors.accent} strokeWidth="2" />
              <circle cx={center} cy="58" r="13" fill={colors.accent} /><Label x={center} y={63} color="#fff" size={13} weight={800}>{String(index + 1)}</Label>
              <Label x={center} y={91} color={colors.ink} size={12} weight={800}>{first}</Label>{second && <Label x={center} y={107} color={colors.ink} size={12} weight={800}>{second}</Label>}
            </g>;
          })}
          <text x="20" y="151" fill={colors.ink} fontSize="11" fontWeight="700">Start with the question or incoming condition</text>
          <text x="710" y="151" textAnchor="end" fill={colors.ink} fontSize="11" fontWeight="700">Finish with evidence you can hand over</text>
          <defs><marker id="ceu-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill={colors.accent} /></marker></defs>
        </>}
      </svg>
      <figcaption>{diagram.caption}</figcaption>
    </figure>
  );
}
