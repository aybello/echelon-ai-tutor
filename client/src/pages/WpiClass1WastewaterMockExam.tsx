import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { WPI_CLASS1_WASTEWATER_QUESTIONS as POOL_RAW } from "@/lib/wpiClass1WastewaterQuestions";

const POOL: ExamQuestion[] = (POOL_RAW as any[]).map(q => ({
  id: q.id,
  module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correct ?? q.correctAnswer ?? 0,
  explanation: q.explanation,
}));

const MODULE_TARGETS: Record<string, number> = {
  'Primary & Secondary Treatment': 26,
  'Safety, Regulations & Admin': 20,
  'Wastewater Collection Systems': 19,
  'Laboratory & Monitoring': 18,
  'Solids Handling & Biosolids': 17,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  'Wastewater Collection Systems': { bg: '#DBEAFE', color: '#1D4ED8' },
  'Primary & Secondary Treatment': { bg: '#CCFBF1', color: '#0F766E' },
  'Solids Handling & Biosolids': { bg: '#DCFCE7', color: '#15803D' },
  'Laboratory & Monitoring': { bg: '#EDE9FE', color: '#6D28D9' },
  'Safety, Regulations & Admin': { bg: '#FFEDD5', color: '#C2410C' },
};

export default function WpiClass1WastewaterMockExam() {
  return (
    <MockExamShell
      title="WPI Class I Wastewater Treatment Mock Exam"
      badge="WPI CLASS I · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for WPI Class I Wastewater Treatment certification."
      metaKeywords="WPI Class 1 wastewater mock exam, EOCP Level I wastewater, AWWOA Class I practice test"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class1-wastewater"
      productName="WPI Class I Wastewater Treatment Practice Pass"
      price={79}
      backPath="/wpi"
      practicePath="/wpi-class1-ww"
      practiceLabel="WPI Class I Wastewater Practice"
      accentColor="#0F766E"
      accentColor2="#0369A1"
      showProvinceSelector={false}
      currentPath="/wpi-class1-ww-mock"
      infoLine="594 questions · BC (EOCP Level I) · Alberta (AWWOA Class I) · SK · MB"
      stream="wastewater"
    />
  );
}
