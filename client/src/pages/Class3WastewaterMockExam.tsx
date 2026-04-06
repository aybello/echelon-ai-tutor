import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { CLASS3_WW_QUESTIONS as RAW } from "@/lib/class3WastewaterQuestions";

const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correct ?? q.correctAnswer ?? 0,
  explanation: q.explanation,
}));

const MODULE_TARGETS: Record<string, number> = {
  "Treatment Process Monitoring":        32,
  "Equipment Operation":                 22,
  "Equipment Evaluation & Maintenance":  15,
  "Laboratory Analysis":                 20,
  "Security, Safety & Admin":            11,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Treatment Process Monitoring":        { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment Operation":                 { bg: "#DCFCE7", color: "#15803D" },
  "Equipment Evaluation & Maintenance":  { bg: "#FFEDD5", color: "#C2410C" },
  "Laboratory Analysis":                 { bg: "#EDE9FE", color: "#6D28D9" },
  "Security, Safety & Admin":            { bg: "#FEE2E2", color: "#B91C1C" },
};

export default function Class3WastewaterMockExam() {
  return (
    <MockExamShell
      title="Class 3 Wastewater Treatment Mock Exam"
      badge="ONTARIO CLASS III · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the Ontario Class 3 Wastewater Treatment operator certification."
      metaKeywords="Class 3 wastewater mock exam, Ontario operator exam, OWWCO Class 3 wastewater"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="class3-ww"
      productName="Class 3 Wastewater Treatment Practice Pass"
      price={129}
      backPath="/ontario"
      practicePath="/class3-ww"
      practiceLabel="Class 3 Wastewater Practice"
      showProvinceSelector={true}
      currentPath="/class3-ww-mock"
      infoLine={`${POOL.length} questions · Ontario (MECP) · BC (EOCP Level III) · Alberta (AWWOA Class III)`}
      stream="wastewater"
    />
  );
}
