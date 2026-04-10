import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { wpiClass4WastewaterCollQuestions as RAW } from "@/lib/wpiClass4WastewaterCollQuestions";
const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correctAnswer ?? q.correct ?? 0,
  explanation: q.explanation,
}));
// WPI Class IV Wastewater Collection exam blueprint: 100 questions
const MODULE_TARGETS: Record<string, number> = {
  "System Planning & Capital Improvement":          25,
  "Advanced Engineering & Design":                  20,
  "Utility Management & Leadership":                20,
  "Advanced Regulatory & Environmental Management": 20,
  "Emerging Technologies & Innovation":             15,
};
const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "System Planning & Capital Improvement":          { bg: "#FEE2E2", color: "#B91C1C" },
  "Advanced Engineering & Design":                  { bg: "#DBEAFE", color: "#1D4ED8" },
  "Utility Management & Leadership":                { bg: "#FEF9C3", color: "#A16207" },
  "Advanced Regulatory & Environmental Management": { bg: "#DCFCE7", color: "#15803D" },
  "Emerging Technologies & Innovation":             { bg: "#EDE9FE", color: "#6D28D9" },
};
export default function WpiClass4WaterCollMockExam() {
  return (
    <MockExamShell
      title="WPI Class IV Wastewater Collection Mock Exam"
      badge="WPI CLASS IV · WASTEWATER COLLECTION"
      metaDescription="100-question timed mock exam for the WPI Class IV Wastewater Collection certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 4 wastewater collection mock exam, BC EOCP, Alberta AWWOA Class IV collection"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class4-water-coll"
      productName="WPI Class IV Wastewater Collection Practice Pass"
      price={299}
      backPath="/wpi"
      practicePath="/wpi-class4-water-coll"
      practiceLabel="Class IV Collection Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class4-water-coll-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level IV) · Alberta (AWWOA Class IV) · SK · MB`}
      stream="wastewater"
      accentColor="#7F1D1D"
    />
  );
}
