import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { wpiClass4WaterQuestions as RAW } from "@/lib/wpiClass4WaterQuestions";

const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correctAnswer ?? q.correct ?? 0,
  explanation: q.explanation,
}));

const MODULE_TARGETS: Record<string, number> = {
  "Plant Management & Leadership":                32,
  "Emergency Response & Contingency Planning":    20,
  "Advanced Process Control":                     20,
  "Regulatory Compliance & Reporting":            18,
  "Advanced Water Quality":                       10,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Plant Management & Leadership":                { bg: "#CCFBF1", color: "#0F766E" },
  "Emergency Response & Contingency Planning":    { bg: "#EDE9FE", color: "#6D28D9" },
  "Advanced Process Control":                     { bg: "#DBEAFE", color: "#1D4ED8" },
  "Regulatory Compliance & Reporting":            { bg: "#FFEDD5", color: "#C2410C" },
  "Advanced Water Quality":                       { bg: "#DCFCE7", color: "#15803D" },
};

export default function WpiClass4WaterMockExam() {
  return (
    <MockExamShell
      title="WPI Class IV Water Treatment Mock Exam"
      badge="WPI CLASS IV · WATER TREATMENT"
      metaDescription="100-question timed mock exam for the WPI Class IV Water Treatment certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 4 water treatment mock exam, BC EOCP Level IV, Alberta AWWOA Class IV"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class4-water"
      productName="WPI Class IV Water Treatment Practice Pass"
      price={149}
      backPath="/wpi"
      practicePath="/wpi-class4-water"
      practiceLabel="Class IV Water Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class4-water-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level IV) · Alberta (AWWOA Class IV) · SK · MB`}
      stream="water"
      accentColor="#0F766E"
    />
  );
}
