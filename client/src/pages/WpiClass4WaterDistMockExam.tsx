import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { wpiClass4WaterDistQuestions as RAW } from "@/lib/wpiClass4WaterDistQuestions";
const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correctAnswer ?? q.correct ?? 0,
  explanation: q.explanation,
}));
// WPI Class IV Water Distribution exam blueprint: 100 questions
const MODULE_TARGETS: Record<string, number> = {
  "Distribution System Components":                23,
  "Equipment Installation, O&M & Repair":          21,
  "Water Quality Monitoring & Lab":                30,
  "Security, Safety, Admin & Public Interactions": 26,
};
const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Distribution System Components":                { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment Installation, O&M & Repair":          { bg: "#DCFCE7", color: "#15803D" },
  "Water Quality Monitoring & Lab":                { bg: "#EDE9FE", color: "#6D28D9" },
  "Security, Safety, Admin & Public Interactions": { bg: "#FFEDD5", color: "#C2410C" },
};
export default function WpiClass4WaterDistMockExam() {
  return (
    <MockExamShell
      title="WPI Class IV Water Distribution Mock Exam"
      badge="WPI CLASS IV · WATER DISTRIBUTION"
      metaDescription="100-question timed mock exam for the WPI Class IV Water Distribution certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 4 water distribution mock exam, BC EOCP Level IV, Alberta AWWOA Class IV distribution"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class4-water-dist"
      productName="WPI Class IV Water Distribution Practice Pass"
      price={99}
      backPath="/wpi"
      practicePath="/wpi-class4-water-dist"
      practiceLabel="Class IV Distribution Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class4-water-dist-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level IV) · Alberta (AWWOA Class IV) · SK · MB`}
      stream="water"
      accentColor="#1E3A5F"
    />
  );
}
