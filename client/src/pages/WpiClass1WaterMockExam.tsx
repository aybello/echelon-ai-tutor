import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { wpiClass1WaterQuestions as RAW } from "@/lib/wpiClass1WaterQuestions";

const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correctAnswer ?? q.correct ?? 0,
  explanation: q.explanation,
}));

const MODULE_TARGETS: Record<string, number> = {
  "Treatment Process":   31,
  "Equipment O&M":       26,
  "Laboratory Analysis": 16,
  "Source Water":        15,
  "Safety & Admin":      12,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Treatment Process":   { bg: "#DBEAFE", color: "#1D4ED8" },
  "Equipment O&M":       { bg: "#DCFCE7", color: "#15803D" },
  "Laboratory Analysis": { bg: "#EDE9FE", color: "#6D28D9" },
  "Source Water":        { bg: "#CCFBF1", color: "#0F766E" },
  "Safety & Admin":      { bg: "#FFEDD5", color: "#C2410C" },
};

export default function WpiClass1WaterMockExam() {
  return (
    <MockExamShell
      title="WPI Class I Water Treatment Mock Exam"
      badge="WPI CLASS I · WATER TREATMENT"
      metaDescription="100-question timed mock exam for the WPI Class I Water Treatment certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 1 water treatment mock exam, BC EOCP Level I, Alberta AWWOA Class I"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class1-water"
      productName="WPI Class I Water Treatment Practice Pass"
      price={79}
      backPath="/wpi"
      practicePath="/wpi-class1-water"
      practiceLabel="Class I Water Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class1-water-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level I) · Alberta (AWWOA Class I) · SK · MB`}
      stream="water"
      accentColor="#0F766E"
    />
  );
}
