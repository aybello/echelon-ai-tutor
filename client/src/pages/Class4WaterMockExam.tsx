import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { QUESTIONS as RAW } from "@/lib/class4WaterQuestions";

const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correct ?? q.correctAnswer ?? 0,
  explanation: q.explanation,
}));

const MODULE_TARGETS: Record<string, number> = {
  "Treatment Process":       40,
  "Regulations & Management":24,
  "Equipment O&M":           18,
  "Laboratory Analysis":     13,
  "Source Water & Quality":   5,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Treatment Process":       { bg: "#DBEAFE", color: "#1D4ED8" },
  "Laboratory Analysis":     { bg: "#FEF9C3", color: "#A16207" },
  "Equipment O&M":           { bg: "#DCFCE7", color: "#15803D" },
  "Regulations & Management":{ bg: "#FEE2E2", color: "#B91C1C" },
  "Source Water & Quality":  { bg: "#EDE9FE", color: "#6D28D9" },
};

export default function Class4WaterMockExam() {
  return (
    <MockExamShell
      title="Class 4 Water Treatment Mock Exam"
      badge="ONTARIO CLASS IV · WATER TREATMENT"
      metaDescription="100-question timed mock exam for the Ontario Class 4 Water Treatment operator certification. 2-hour timer, 70% pass threshold."
      metaKeywords="Class 4 water treatment mock exam, Ontario operator exam, OWWCO Class 4"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="class4-water"
      productName="Class 4 Water Treatment Practice Pass"
      price={299}
      backPath="/ontario"
      practicePath="/class4-water"
      practiceLabel="Class 4 Water Practice"
      showProvinceSelector={true}
      currentPath="/class4-water-mock"
      infoLine={`${POOL.length} questions · Ontario (MECP) · BC (EOCP Level IV) · Alberta (AWWOA Class IV)`}
      stream="water"
    />
  );
}
