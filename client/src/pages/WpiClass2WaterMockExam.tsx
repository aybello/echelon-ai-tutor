import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { wpiClass2WaterQuestions as RAW } from "@/lib/wpiClass2WaterQuestions";

const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correctAnswer ?? q.correct ?? 0,
  explanation: q.explanation,
}));

const MODULE_TARGETS: Record<string, number> = {
  "Advanced Treatment Processes":     34,
  "System Design & Engineering":      29,
  "Advanced Laboratory & Monitoring": 16,
  "Management, Regulations & Safety": 14,
  "Source Water & Environmental":      7,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Advanced Treatment Processes":     { bg: "#DBEAFE", color: "#1D4ED8" },
  "System Design & Engineering":      { bg: "#DCFCE7", color: "#15803D" },
  "Advanced Laboratory & Monitoring": { bg: "#EDE9FE", color: "#6D28D9" },
  "Management, Regulations & Safety": { bg: "#FFEDD5", color: "#C2410C" },
  "Source Water & Environmental":     { bg: "#CCFBF1", color: "#0F766E" },
};

export default function WpiClass2WaterMockExam() {
  return (
    <MockExamShell
      title="WPI Class II Water Treatment Mock Exam"
      badge="WPI CLASS II · WATER TREATMENT"
      metaDescription="100-question timed mock exam for the WPI Class II Water Treatment certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 2 water treatment mock exam, BC EOCP Level II, Alberta AWWOA Class II"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class2-water"
      productName="WPI Class II Water Treatment Practice Pass"
      price={199}
      backPath="/wpi"
      practicePath="/wpi-class2-water"
      practiceLabel="Class II Water Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class2-water-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level II) · Alberta (AWWOA Class II) · SK · MB`}
      stream="water"
      accentColor="#0F766E"
    />
  );
}
