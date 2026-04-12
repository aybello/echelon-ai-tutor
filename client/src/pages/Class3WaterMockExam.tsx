import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { useQuestionBank, type DBQuestion } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";



const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  'Treatment Process': { bg: '#DBEAFE', color: '#1D4ED8' },
  'Laboratory Analysis': { bg: '#FEF9C3', color: '#A16207' },
  'Equipment O&M': { bg: '#DCFCE7', color: '#15803D' },
  'Source Water Characteristics': { bg: '#EDE9FE', color: '#6D28D9' },
  'Security, Safety & Admin': { bg: '#FEE2E2', color: '#B91C1C' },
  'Water Distribution': { bg: '#E0F2FE', color: '#0284C7' },
};

export default function Class3WaterMockExam() {
  const { questions: dbQuestions, moduleTargets: dbModuleTargets, isLoading: bankLoading } = useQuestionBank("class3-water");
  
  const POOL: ExamQuestion[] = (dbQuestions as any[]).map((q: any) => ({
    id: q.id, module: q.module,
    question: q.question ?? q.text ?? "",
    options: q.options,
    correct: q.correctIndex ?? q.correct ?? q.correctAnswer ?? 0,
    explanation: q.explanation,
  }));

  if (bankLoading) return <QuizSkeleton />;

  return (
    <MockExamShell
      title="Class 3 Water Treatment Mock Exam"
      badge="ONTARIO CLASS III · WATER TREATMENT"
      metaDescription="100-question timed mock exam for the Ontario Class 3 Water Treatment operator certification."
      metaKeywords="Class 3 water treatment mock exam, Ontario operator exam, OWWCO Class 3"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="class3-water"
      productName="Class 3 Water Treatment Practice Pass"
      price={249}
      formulaPath="/formulas-water3"
      formulaLabel="Class 3 Water Formulas"
      backPath="/ontario"
      practicePath="/class3-water"
      practiceLabel="Class 3 Water Practice"
      accentColor="#0369A1"
      accentColor2="#0E7490"
      showProvinceSelector={true}
      currentPath="/class3-water-mock"
      infoLine="552 questions · Ontario (MECP) · BC (EOCP Level III) · Alberta (AWWOA Class III)"
      stream="water"
    />
  );
}
