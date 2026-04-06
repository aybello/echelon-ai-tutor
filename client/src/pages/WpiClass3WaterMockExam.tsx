import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { WPI_CLASS3_WATER_QUESTIONS as RAW } from "@/lib/wpiClass3WaterQuestions";

const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correctAnswer ?? q.correct ?? 0,
  explanation: q.explanation,
}));

const MODULE_TARGETS: Record<string, number> = {
  "Advanced Treatment & Disinfection":  24,
  "Filtration & Membrane Systems":      21,
  "Process Control & Optimization":     19,
  "Regulatory Compliance & QMS":        19,
  "Distribution System Management":     17,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Advanced Treatment & Disinfection":  { bg: "#DBEAFE", color: "#1D4ED8" },
  "Filtration & Membrane Systems":      { bg: "#DCFCE7", color: "#15803D" },
  "Process Control & Optimization":     { bg: "#EDE9FE", color: "#6D28D9" },
  "Regulatory Compliance & QMS":        { bg: "#FFEDD5", color: "#C2410C" },
  "Distribution System Management":     { bg: "#CCFBF1", color: "#0F766E" },
};

export default function WpiClass3WaterMockExam() {
  return (
    <MockExamShell
      title="WPI Class III Water Treatment Mock Exam"
      badge="WPI CLASS III · WATER TREATMENT"
      metaDescription="100-question timed mock exam for the WPI Class III Water Treatment certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 3 water treatment mock exam, BC EOCP Level III, Alberta AWWOA Class III"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class3-water"
      productName="WPI Class III Water Treatment Practice Pass"
      price={349}
      backPath="/wpi"
      practicePath="/wpi-class3-water"
      practiceLabel="Class III Water Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class3-water-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level III) · Alberta (AWWOA Class III) · SK · MB`}
      stream="water"
      accentColor="#0F766E"
    />
  );
}
