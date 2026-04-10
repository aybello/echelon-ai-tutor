import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { wpiClass2WaterDistQuestions as RAW } from "@/lib/wpiClass2WaterDistQuestions";

const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correctAnswer ?? q.correct ?? 0,
  explanation: q.explanation,
}));

// WPI Class II Water Distribution exam blueprint: 100 questions
const MODULE_TARGETS: Record<string, number> = {
  "Distribution System Components":                32,
  "Equipment Installation, O&M & Repair":          28,
  "Water Quality Monitoring & Lab":                20,
  "Security, Safety, Admin & Public Interactions": 20,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Distribution System Components":                { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment Installation, O&M & Repair":          { bg: "#DCFCE7", color: "#15803D" },
  "Water Quality Monitoring & Lab":                { bg: "#EDE9FE", color: "#6D28D9" },
  "Security, Safety, Admin & Public Interactions": { bg: "#FFEDD5", color: "#C2410C" },
};

export default function WpiClass2WaterDistMockExam() {
  return (
    <MockExamShell
      title="WPI Class II Water Distribution Mock Exam"
      badge="WPI CLASS II · WATER DISTRIBUTION"
      metaDescription="100-question timed mock exam for the WPI Class II Water Distribution certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 2 water distribution mock exam, BC EOCP Level II, Alberta AWWOA Class II distribution"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class2-water-dist"
      productName="WPI Class II Water Distribution Practice Pass"
      price={99}
      backPath="/wpi"
      practicePath="/wpi-class2-water-dist"
      practiceLabel="Class II Distribution Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class2-water-dist-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level II) · Alberta (AWWOA Class II) · SK · MB`}
      stream="water"
      accentColor="#0369A1"
    />
  );
}
