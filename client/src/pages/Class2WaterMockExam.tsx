import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { QUESTIONS as POOL_RAW } from "@/lib/class2WaterQuestions";

const POOL: ExamQuestion[] = (POOL_RAW as any[]).map(q => ({
  id: q.id,
  module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correct ?? q.correctAnswer ?? 0,
  explanation: q.explanation,
}));

const MODULE_TARGETS: Record<string, number> = {
  'Treatment Process': 29,
  'Laboratory Analysis': 22,
  'Equipment Operation & Maintenance': 14,
  'Security, Safety & Administrative': 14,
  'Source Water Characteristics': 12,
  'Water Distribution': 9,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  'Treatment Process': { bg: '#DBEAFE', color: '#1D4ED8' },
  'Laboratory Analysis': { bg: '#FEF9C3', color: '#A16207' },
  'Equipment Operation & Maintenance': { bg: '#DCFCE7', color: '#15803D' },
  'Source Water Characteristics': { bg: '#EDE9FE', color: '#6D28D9' },
  'Security, Safety & Administrative': { bg: '#FEE2E2', color: '#B91C1C' },
  'Water Distribution': { bg: '#E0F2FE', color: '#0284C7' },
};

export default function Class2WaterMockExam() {
  return (
    <MockExamShell
      title="Class 2 Water Treatment Mock Exam"
      badge="ONTARIO CLASS II · WATER TREATMENT"
      metaDescription="100-question timed mock exam for the Ontario Class 2 Water Treatment operator certification. 2-hour timer, 70% pass threshold, and full module breakdown on results."
      metaKeywords="Class 2 water treatment mock exam, Ontario operator exam, OWWCO Class 2, O. Reg. 128/04 practice test"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="class2-water"
      productName="Class 2 Water Treatment Practice Pass"
      price={149}
      formulaPath="/formulas-water2"
      formulaLabel="Class 2 Water Formulas"
      backPath="/ontario"
      practicePath="/class2-water"
      practiceLabel="Class 2 Water Practice"
      accentColor="#0369A1"
      accentColor2="#0E7490"
      showProvinceSelector={true}
      currentPath="/class2-water-mock"
      infoLine="500+ questions · Ontario (MECP) · BC (EOCP Level II) · Alberta (AWWOA Class II)"
      stream="water"
    />
  );
}
