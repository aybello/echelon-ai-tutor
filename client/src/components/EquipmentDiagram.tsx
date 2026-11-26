import React, { useId } from "react";
import type { EquipmentDefinition } from "@shared/equipmentRegistry";
import { EQUIPMENT_DIAGRAM_MODELS, wrapEquipmentLabel, type DiagramPart, type DiagramShape, type DiagramFlow } from "@/lib/equipmentDiagramModels";

export interface EquipmentDiagramProps {
  equipment: EquipmentDefinition;
  activePart?: string | null;
  onSelectPart?: (partId: string) => void;
  compact?: boolean;
}
const diagramColors = {
  concrete: "#cbd5e1", steel: "#94a3b8", water: "#e0f2fe", teal: "#0f766e",
  air: "#0284c7", sludge: "#8b6b4a", media: "#d6c4a0", white: "#ffffff", ink: "#475569", none: "none",
} as const;
const mediumColors: Record<DiagramFlow["medium"], string> = {
  water: "#0f766e", air: "#0284c7", sludge: "#785437", grit: "#785437", pilot: "#0f766e",
};

function Shape({ shape, selected = false }: { shape: DiagramShape; selected?: boolean }) {
  return <path d={shape.d} fill={diagramColors[shape.fill]} stroke={selected ? "#b45309" : diagramColors[shape.stroke]}
    strokeWidth={selected ? Math.max(shape.width, 3) : shape.width} strokeLinejoin="round" strokeLinecap="round" />;
}

function PartLabel({ part, label, number, selected, onSelect }: {
  part: DiagramPart; label: string; number: number; selected: boolean; onSelect?: () => void;
}) {
  const [x, y] = part.labelAt;
  const [ax, ay] = part.anchor;
  const lateral = part.side === "left" || part.side === "right";
  const lines = wrapEquipmentLabel(label, lateral ? 13 : 18);
  const textAnchor = part.side === "left" ? "end" : part.side === "right" ? "start" : "middle";
  const edgeX = part.side === "left" ? 128 : 592;
  const leader = lateral ? `M${x} ${y + 9}H${edgeX}L${ax} ${ay}`
    : part.side === "top" ? `M${x} ${y + lines.length * 18 + 3}V84L${ax} ${ay}`
    : `M${x} ${y - 18}V326L${ax} ${ay}`;
  return <g data-part-id={part.id} data-selected={selected || undefined} onClick={onSelect}
    style={{ cursor: onSelect ? "pointer" : undefined }} aria-hidden="true">
    <path d={leader} fill="none" stroke={selected ? "#b45309" : "#94a3b8"} strokeWidth={selected ? 2 : 1} />
    <circle cx={ax} cy={ay} r={11} fill={selected ? "#fef3c7" : "#ffffff"} stroke={selected ? "#b45309" : "#0f766e"} strokeWidth={2} />
    <text x={ax} y={ay + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill={selected ? "#92400e" : "#115e59"}>{number}</text>
    <text x={x} y={y} textAnchor={textAnchor} fontSize={16} fontWeight={selected ? 700 : 600} fill={selected ? "#92400e" : "#334155"}>
      {lines.map((line, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : 18}>{line}</tspan>)}
    </text>
  </g>;
}

/** Keyboard interaction intentionally lives in the parent inspector's companion buttons. */
export default function EquipmentDiagram({ equipment, activePart, onSelectPart, compact = false }: EquipmentDiagramProps) {
  const instanceId = `equipment-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const model = EQUIPMENT_DIAGRAM_MODELS[equipment.slug];
  if (!model) return compact ? null : <p className="text-sm text-slate-500">This unit uses its dedicated equipment explorer.</p>;
  const titleId = `${instanceId}-title`;
  const descriptionId = `${instanceId}-description`;
  const markerId = (medium: DiagramFlow["medium"]) => `${instanceId}-${medium}`;
  const registeredParts = new Map(equipment.parts.map(item => [item.id, item]));
  const select = (id: string) => !compact && onSelectPart && registeredParts.has(id) ? () => onSelectPart(id) : undefined;
  return <div className={compact ? "equipment-diagram equipment-diagram-compact" : "equipment-diagram"}
    style={{ pointerEvents: compact ? "none" : undefined }}>
    {/* Full diagrams retain a readable type floor on narrow screens by scrolling locally. */}
    <div style={{ width: "100%", overflowX: compact ? undefined : "auto" }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={compact ? "130 85 470 225" : "0 0 720 410"}
        role={compact ? "presentation" : "img"} aria-hidden={compact ? true : undefined}
        aria-labelledby={compact ? undefined : titleId} aria-describedby={compact ? undefined : descriptionId}
        focusable="false" data-equipment-slug={equipment.slug}
        style={{ display: "block", width: "100%", minWidth: compact ? undefined : 640, height: "auto", background: "#ffffff", fontFamily: "inherit" }}>
        {!compact && <><title id={titleId}>{`${equipment.shortTitle} technical schematic`}</title><desc id={descriptionId}>{model.description} Numbered labels correspond to the part inspector. Selected part: {equipment.parts.find(p => p.id === activePart)?.label ?? "none"}.</desc></>}
        <defs>{Object.entries(mediumColors).map(([medium, color]) => <marker key={medium} id={markerId(medium as DiagramFlow["medium"])}
          viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto" markerUnits="strokeWidth">
          <path d="M0 0L10 5L0 10Z" fill={color} />
        </marker>)}</defs>
        <g aria-hidden="true">
          {model.base.map((shape, i) => <Shape key={`base-${i}`} shape={shape} />)}
          {model.parts.map(part => <g key={part.id} data-part-id={compact ? undefined : part.id}
            data-selected={!compact && activePart === part.id || undefined} onClick={select(part.id)}
            style={{ cursor: select(part.id) ? "pointer" : undefined }}>
            {part.shapes.map((shape, i) => <Shape key={i} shape={shape} selected={!compact && activePart === part.id} />)}
            {!compact && <g fill="transparent" stroke="transparent" strokeWidth={14} strokeLinecap="round">
              {part.shapes.map((shape, i) => <path key={i} d={shape.d} fill={shape.fill === "none" ? "none" : "transparent"} strokeWidth={Math.max(14, shape.width)} />)}
            </g>}
          </g>)}
          <g pointerEvents="none">{model.flows.map((flow, i) => <path key={i} data-flow-medium={flow.medium}
            d={flow.d} fill="none" stroke={mediumColors[flow.medium]} strokeWidth={flow.medium === "pilot" ? 2 : 2.5}
            strokeLinejoin="round" strokeLinecap="round" markerEnd={`url(#${markerId(flow.medium)})`} />)}</g>
          {!compact && <>
            {model.notes?.map((note, i) => <text key={i} x={note.x} y={note.y} textAnchor="middle" fontSize={12} fill="#64748b" pointerEvents="none">{note.text}</text>)}
            {model.parts.map(part => {
              const record = registeredParts.get(part.id);
              if (!record) return null;
              return <PartLabel key={part.id} part={part} label={record.label} number={equipment.parts.indexOf(record) + 1}
                selected={activePart === part.id} onSelect={select(part.id)} />;
            })}
          </>}
        </g>
      </svg>
    </div>
    {!compact && <p className="mt-2 text-xs leading-relaxed text-slate-500">Conceptual section, not to scale. Arrows show the service flow path.</p>}
  </div>;
}
