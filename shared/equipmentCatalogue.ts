import { EQUIPMENT_REGISTRY, type EquipmentDefinition, type EquipmentStream } from "./equipmentRegistry";

export const EQUIPMENT_STREAM_LABELS: Record<EquipmentStream, string> = {
  "water-treatment": "Water treatment",
  "wastewater-treatment": "Wastewater treatment",
  "water-distribution": "Water distribution",
  "wastewater-collection": "Wastewater collection",
};

export interface EquipmentCatalogueItem {
  id: string;
  moduleNumber: string;
  title: string;
  summary: string;
  stream: EquipmentStream;
  href: string;
  topics: readonly string[];
  definition?: EquipmentDefinition;
}

export function equipmentCatalogue(): EquipmentCatalogueItem[] {
  return [
    {
      id: "circular-clarifier",
      moduleNumber: "01",
      title: "Circular clarifier",
      summary: "Follow settling, sludge collection and clarified effluent through a centre-feed circular clarifier.",
      stream: "wastewater-treatment",
      href: "/equipment-lab#clarifier",
      topics: ["settling", "sedimentation", "sludge", "weir", "secondary treatment"],
    },
    ...EQUIPMENT_REGISTRY.map(definition => ({
      id: definition.id,
      moduleNumber: definition.moduleNumber,
      title: definition.title,
      summary: definition.summary,
      stream: definition.stream,
      href: `/equipment-lab/${definition.slug}`,
      topics: definition.relatedTopics,
      definition,
    })),
  ];
}

export function filterEquipmentCatalogue(
  items: readonly EquipmentCatalogueItem[],
  query = "",
  stream: EquipmentStream | "all" = "all"
): EquipmentCatalogueItem[] {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return items.filter(item => {
    if (stream !== "all" && item.stream !== stream) return false;
    const haystack = `${item.title} ${item.summary} ${item.topics.join(" ")} ${EQUIPMENT_STREAM_LABELS[item.stream]}`.toLocaleLowerCase();
    return terms.every(term => haystack.includes(term));
  });
}
