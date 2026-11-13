import MockExamShell from "@/components/MockExamShell";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  TEXAS_CLASS_D_WATER_MOCK_DURATION_SECONDS,
  TEXAS_CLASS_D_WATER_MOCK_BLUEPRINT,
  TEXAS_CLASS_D_WATER_MOCK_QUESTIONS,
} from "@shared/texasClassD";

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Rules, licensing and records": { bg: "#EDE9FE", color: "#6D28D9" },
  "Safety and operator responsibilities": { bg: "#FEF2F2", color: "#B91C1C" },
  "Source water and general water quality": { bg: "#ECFEFF", color: "#0E7490" },
  "Groundwater systems": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Surface water treatment": { bg: "#DCFCE7", color: "#15803D" },
  "Storage and distribution": { bg: "#FFF7ED", color: "#C2410C" },
  "Disinfection": { bg: "#F0FDF4", color: "#166534" },
  "Water utility math": { bg: "#FEFCE8", color: "#A16207" },
};

/** Not registered publicly until Texas content and commerce are governed live. */
export default function UsTexasClassDMockExam() {
  usePageMeta({
    title: "Texas Class D Water Mock Exam | Echelon Institute",
    description: "A timed Texas Class D Water practice mock built from original Echelon questions and the public TCEQ topic scope.",
    noindex: true,
  });

  return (
    <MockExamShell
      title="Texas Class D Water Mock Exam"
      badge="TEXAS CLASS D · WATER"
      metaDescription="60-question timed Texas Class D Water practice mock. Original Echelon study content based on the public TCEQ topic scope."
      metaKeywords="Texas Class D water mock exam, TCEQ water operator practice, Texas water operator exam prep"
      noindex
      examQuestions={TEXAS_CLASS_D_WATER_MOCK_QUESTIONS}
      examDuration={TEXAS_CLASS_D_WATER_MOCK_DURATION_SECONDS}
      passThreshold={0.7}
      moduleTargets={Object.fromEntries(TEXAS_CLASS_D_WATER_MOCK_BLUEPRINT.map((area) => [area.module, area.total]))}
      moduleColors={MODULE_COLORS}
      productKey="us-texas-class-d-water"
      practicePath="/us-texas-class-d-water"
      practiceLabel="Texas Class D Practice"
      formulaPath="/formulas-us-texas-class-d-water"
      formulaLabel="Texas Class D Formula Sheet"
      showProvinceSelector={false}
      currentPath="/us-texas-class-d-water-mock"
      infoLine={`${TEXAS_CLASS_D_WATER_MOCK_QUESTIONS} questions · Texas · Public TCEQ Class D topic scope`}
      stream="water"
      accentColor="#C2410C"
    />
  );
}
