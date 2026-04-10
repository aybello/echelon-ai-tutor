import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { wpiClass1WaterDistQuestions as RAW } from "@/lib/wpiClass1WaterDistQuestions";

const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correctAnswer ?? q.correct ?? 0,
  explanation: q.explanation,
}));

// WPI Class I Water Distribution exam blueprint: 100 questions
const MODULE_TARGETS: Record<string, number> = {
  "Distribution System Components":                35,
  "Equipment Installation, O&M & Repair":          30,
  "Water Quality Monitoring & Lab":                15,
  "Security, Safety, Admin & Public Interactions": 20,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Distribution System Components":                { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment Installation, O&M & Repair":          { bg: "#DCFCE7", color: "#15803D" },
  "Water Quality Monitoring & Lab":                { bg: "#EDE9FE", color: "#6D28D9" },
  "Security, Safety, Admin & Public Interactions": { bg: "#FFEDD5", color: "#C2410C" },
};

export default function WpiClass1WaterDistMockExam() {
  return (
    <MockExamShell
      title="WPI Class I Water Distribution Mock Exam"
      badge="WPI CLASS I · WATER DISTRIBUTION"
      metaDescription="100-question timed mock exam for the WPI Class I Water Distribution certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 1 water distribution mock exam, BC EOCP, Alberta AWWOA Class I distribution"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class1-water-dist"
      productName="WPI Class I Water Distribution Practice Pass"
      price={99}
      backPath="/wpi"
      practicePath="/wpi-class1-water-dist"
      practiceLabel="Class I Distribution Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class1-water-dist-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level I) · Alberta (AWWOA Class I) · SK · MB`}
      stream="water"
      accentColor="#0369A1"
    />
  );
}
