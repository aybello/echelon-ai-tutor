import {
  Activity,
  Beaker,
  Droplets,
  Gauge,
  Network,
  RefreshCw,
  SlidersHorizontal,
  type LucideProps,
} from "lucide-react";
import type { GuideId } from "@/lib/guideRegistry";

const ICONS: Record<GuideId, React.ComponentType<LucideProps>> = {
  "drinking-water": Droplets,
  "wastewater-treatment": RefreshCw,
  "water-distribution": Network,
  "wastewater-collection": Activity,
  "pumping-systems": Gauge,
  instrumentation: SlidersHorizontal,
  "chemical-feed": Beaker,
};

export default function GuideIcon({ guideId, ...props }: LucideProps & { guideId: GuideId }) {
  const Icon = ICONS[guideId];
  return <Icon aria-hidden="true" {...props} />;
}
