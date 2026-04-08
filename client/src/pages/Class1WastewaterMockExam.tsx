import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { CLASS1_WASTEWATER_QUESTIONS as RAW } from "@/lib/class1WastewaterQuestions";

const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correct ?? q.correctAnswer ?? 0,
  explanation: q.explanation,
}));

const MODULE_TARGETS: Record<string, number> = {
  "Wastewater Characteristics & Preliminary Treatment": 14,
  "Primary Treatment":      12,
  "Secondary Treatment":    15,
  "Biological Nutrient Removal": 12,
  "Tertiary Treatment & Filtration": 10,
  "Disinfection":           10,
  "Solids Handling & Biosolids": 13,
  "Regulations, Safety & Operations": 14,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Wastewater Characteristics & Preliminary Treatment": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Primary Treatment":      { bg: "#DCFCE7", color: "#15803D" },
  "Secondary Treatment":    { bg: "#EDE9FE", color: "#6D28D9" },
  "Biological Nutrient Removal": { bg: "#CCFBF1", color: "#0F766E" },
  "Tertiary Treatment & Filtration": { bg: "#FEF9C3", color: "#A16207" },
  "Disinfection":           { bg: "#FFEDD5", color: "#C2410C" },
  "Solids Handling & Biosolids": { bg: "#FEE2E2", color: "#B91C1C" },
  "Regulations, Safety & Operations": { bg: "#F3E8FF", color: "#7C3AED" },
};

export default function Class1WastewaterMockExam() {
  return (
    <MockExamShell
      title="Class 1 Wastewater Treatment Mock Exam"
      badge="ONTARIO CLASS I · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the Ontario Class 1 Wastewater Treatment operator certification."
      metaKeywords="Class 1 wastewater mock exam, Ontario operator exam, OWWCO Class 1 wastewater"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="class1-ww"
      productName="Class 1 Wastewater Practice Pass"
      price={99}
      backPath="/ontario"
      practicePath="/class1-ww"
      practiceLabel="Class 1 Wastewater Practice"
      showProvinceSelector={true}
      currentPath="/class1-ww-mock"
      infoLine={`${POOL.length} questions · Ontario (MECP) · BC (EOCP Level I) · Alberta (AWWOA Class I)`}
      stream="wastewater"
    />
  );
}
