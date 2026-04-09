import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { CLASS4_WW_QUESTIONS as RAW } from "@/lib/class4WastewaterQuestions";

const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correct ?? q.correctAnswer ?? 0,
  explanation: q.explanation,
}));

const MODULE_TARGETS: Record<string, number> = {
  "Advanced Treatment Process Monitoring": 26,
  "Equipment Operation & Maintenance":     20,
  "Laboratory Analysis & Interpretation":  20,
  "Biosolids Management & Regulations":    12,
  "Plant Management, Safety & Administration": 12,
  "Wastewater Collection":                 10,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Advanced Treatment Process Monitoring": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment Operation & Maintenance":     { bg: "#DCFCE7", color: "#15803D" },
  "Laboratory Analysis & Interpretation":  { bg: "#EDE9FE", color: "#6D28D9" },
  "Biosolids Management & Regulations":    { bg: "#CCFBF1", color: "#0F766E" },
  "Plant Management, Safety & Administration": { bg: "#FEE2E2", color: "#B91C1C" },
  "Wastewater Collection":                 { bg: "#FEF9C3", color: "#A16207" },
};

export default function Class4WastewaterMockExam() {
  return (
    <MockExamShell
      title="Class 4 Wastewater Treatment Mock Exam"
      badge="ONTARIO CLASS IV · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the Ontario Class 4 Wastewater Treatment operator certification."
      metaKeywords="Class 4 wastewater mock exam, Ontario operator exam, OWWCO Class 4 wastewater"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="class4-ww"
      productName="Class 4 Wastewater Treatment Practice Pass"
      price={299}
      backPath="/ontario"
      practicePath="/class4-ww"
      practiceLabel="Class 4 Wastewater Practice"
      showProvinceSelector={true}
      currentPath="/class4-ww-mock"
      infoLine={`${POOL.length} questions · Ontario (MECP) · BC (EOCP Level IV) · Alberta (AWWOA Class IV)`}
      stream="wastewater"
    />
  );
}
