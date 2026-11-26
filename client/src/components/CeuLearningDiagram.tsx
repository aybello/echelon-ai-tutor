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

export default function CeuLearningDiagram({ module }: { module: Pick<CeuLesson, "id" | "title"> }) {
  const diagram = ceuDiagramFor(module);
  const colors = FAMILY_COLORS[diagram.family];
  const titleId = `ceu-diagram-title-${module.id}`;
  const descriptionId = `ceu-diagram-description-${module.id}`;
  const nodeWidth = 148;
  const nodeGap = 18;
  const startX = 20;

  return (
    <figure className={`ceu-learning-diagram ceu-learning-diagram-${diagram.family}`} aria-labelledby={titleId}>
      <div className="ceu-learning-diagram-heading">
        <div>
          <span className="ceu-diagram-eyebrow">Visual guide</span>
          <h2 id={titleId}>{diagram.title}</h2>
        </div>
        <span className="ceu-diagram-legend"><i style={{ backgroundColor: colors.accent }} /> {diagram.family === "treatment" ? "Material flow" : "Learning loop"}</span>
      </div>
      <svg
        viewBox="0 0 820 178"
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
        className="ceu-learning-diagram-svg"
      >
        <desc id={descriptionId}>{diagram.caption} {diagram.steps.join(", then ")}.</desc>
        <line x1="34" y1="76" x2="786" y2="76" stroke={colors.accent} strokeWidth="4" strokeLinecap="round" opacity="0.2" />
        {diagram.steps.map((step, index) => {
          const x = startX + index * (nodeWidth + nodeGap);
          const center = x + nodeWidth / 2;
          return (
            <g key={step}>
              {index < diagram.steps.length - 1 && (
                <>
                  <line x1={x + nodeWidth + 4} y1="76" x2={x + nodeWidth + nodeGap - 6} y2="76" stroke={colors.accent} strokeWidth="2.5" />
                  <path d={`M ${x + nodeWidth + nodeGap - 13} 70 L ${x + nodeWidth + nodeGap - 5} 76 L ${x + nodeWidth + nodeGap - 13} 82`} fill="none" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}
              <rect x={x} y="34" width={nodeWidth} height="84" rx="14" fill={colors.soft} stroke={colors.accent} strokeWidth="2" />
              <circle cx={center} cy="58" r="13" fill={colors.accent} />
              <text x={center} y="63" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="800">{index + 1}</text>
              <text x={center} y="91" textAnchor="middle" fill={colors.ink} fontSize="13" fontWeight="800">
                {step.length > 19 ? <><tspan x={center} dy="0">{step.slice(0, 18)}</tspan><tspan x={center} dy="16">{step.slice(18)}</tspan></> : step}
              </text>
            </g>
          );
        })}
        <text x="34" y="151" fill={colors.ink} fontSize="12" fontWeight="700">Start with the question or incoming condition</text>
        <text x="786" y="151" textAnchor="end" fill={colors.ink} fontSize="12" fontWeight="700">Finish with evidence you can hand over</text>
      </svg>
      <figcaption>{diagram.caption}</figcaption>
    </figure>
  );
}
