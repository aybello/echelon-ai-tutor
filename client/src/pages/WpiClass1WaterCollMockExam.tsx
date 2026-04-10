import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { wpiClass1WastewaterCollQuestions as RAW } from "@/lib/wpiClass1WastewaterCollQuestions";
const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correctAnswer ?? q.correct ?? 0,
  explanation: q.explanation,
}));
// WPI Class I Wastewater Collection exam blueprint: 100 questions
const MODULE_TARGETS: Record<string, number> = {
  "Collection System Components":   40,
  "Equipment Operation & Maintenance": 25,
  "Safety & Regulations":           15,
  "Math & Calculations":            10,
  "Environmental & Public Health":  10,
};
const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Collection System Components":   { bg: "#D1FAE5", color: "#065F46" },
  "Equipment Operation & Maintenance": { bg: "#DCFCE7", color: "#15803D" },
  "Safety & Regulations":           { bg: "#FEE2E2", color: "#B91C1C" },
  "Math & Calculations":            { bg: "#DBEAFE", color: "#1D4ED8" },
  "Environmental & Public Health":  { bg: "#CCFBF1", color: "#0F766E" },
};
export default function WpiClass1WaterCollMockExam() {
  return (
    <MockExamShell
      title="WPI Class I Wastewater Collection Mock Exam"
      badge="WPI CLASS I · WASTEWATER COLLECTION"
      metaDescription="100-question timed mock exam for the WPI Class I Wastewater Collection certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 1 wastewater collection mock exam, BC EOCP, Alberta AWWOA Class I collection"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class1-water-coll"
      productName="WPI Class I Wastewater Collection Practice Pass"
      price={99}
      backPath="/wpi"
      practicePath="/wpi-class1-water-coll"
      practiceLabel="Class I Collection Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class1-water-coll-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level I) · Alberta (AWWOA Class I) · SK · MB`}
      stream="wastewater"
      accentColor="#065F46"
    />
  );
}
