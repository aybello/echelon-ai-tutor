import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { CLASS2_WW_QUESTIONS as RAW } from "@/lib/class2WastewaterQuestions";

const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correct ?? q.correctAnswer ?? 0,
  explanation: q.explanation,
}));

const MODULE_TARGETS: Record<string, number> = {
  "Treatment Process":       43,
  "Collection Systems":      14,
  "Laboratory Analysis":     18,
  "Safety & Administration": 12,
  "Equipment O&M":           13,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Treatment Process":       { bg: "#DBEAFE", color: "#1D4ED8" },
  "Collection Systems":      { bg: "#DCFCE7", color: "#15803D" },
  "Laboratory Analysis":     { bg: "#EDE9FE", color: "#6D28D9" },
  "Safety & Administration": { bg: "#FEE2E2", color: "#B91C1C" },
  "Equipment O&M":           { bg: "#FFEDD5", color: "#C2410C" },
};

export default function Class2WastewaterMockExam() {
  return (
    <MockExamShell
      title="Class 2 Wastewater Treatment Mock Exam"
      badge="ONTARIO CLASS II · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the Ontario Class 2 Wastewater Treatment operator certification."
      metaKeywords="Class 2 wastewater mock exam, Ontario operator exam, OWWCO Class 2 wastewater"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="class2-ww"
      productName="Class 2 Wastewater Treatment Practice Pass"
      price={199}
      backPath="/ontario"
      practicePath="/class2-ww"
      practiceLabel="Class 2 Wastewater Practice"
      showProvinceSelector={true}
      currentPath="/class2-ww-mock"
      infoLine={`${POOL.length} questions · Ontario (MECP) · BC (EOCP Level II) · Alberta (AWWOA Class II)`}
      stream="wastewater"
    />
  );
}
