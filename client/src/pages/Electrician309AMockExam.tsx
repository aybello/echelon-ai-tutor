import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import QuizSkeleton from "@/components/QuizSkeleton";
import { Electrician309ADiagram, ELECTRICIAN_309A_DIAGRAMS, type Electrician309ADiagramId } from "@/components/electrician309a/Electrician309ADiagrams";
import { useElectrician309ABank } from "@/hooks/useElectrician309ABank";

const MODULE_COLORS = {
  "A. Performs common occupational skills": { bg: "#DBEAFE", color: "#1D4ED8" },
  "B. Installs, services and maintains generating, distribution and service systems": { bg: "#FEF3C7", color: "#B45309" },
  "C. Installs, services and maintains wiring systems": { bg: "#DCFCE7", color: "#15803D" },
  "D. Installs, services and maintains motors and control systems": { bg: "#EDE9FE", color: "#6D28D9" },
  "E. Installs, services and maintains signalling and communication systems": { bg: "#CCFBF1", color: "#0F766E" },
};

function isDiagramId(value: unknown): value is Electrician309ADiagramId {
  return typeof value === "string" && value in ELECTRICIAN_309A_DIAGRAMS;
}

export default function Electrician309AMockExam() {
  const bank = useElectrician309ABank();
  const pool: ExamQuestion[] = bank.questions.map((question) => ({
    id: question.id,
    module: question.module,
    question: question.question,
    options: question.options,
    correct: question.correctIndex,
    explanation: question.explanation,
    diagramId: question.diagramId,
    diagramAlt: question.diagramAlt,
  }));
  if (bank.isLoading) return <QuizSkeleton />;
  if (bank.dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return <MockExamShell
    title="Ontario 309A Electrician Mock Exam"
    badge="ONTARIO 309A · CONSTRUCTION ELECTRICIAN"
    metaDescription="Free 100-question Ontario 309A Construction Electrician practice mock exam based on the current official Red Seal weighting."
    noindex
    examQuestions={100}
    examDuration={4 * 60 * 60}
    passThreshold={0.7}
    moduleTargets={bank.moduleTargets}
    moduleColors={MODULE_COLORS}
    questionPool={pool}
    productKey="electrician-309a"
    scoreExamType="electrician-309a"
    productName="Ontario 309A Electrician"
    price={0}
    freeAccess
    practicePath="/electrician-309a"
    practiceLabel="309A Electrician Practice"
    currentPath="/electrician-309a-mock"
    infoLine={`${bank.totalQuestions} original questions · 16 concept diagrams · Free course`}
    renderQuestionSupplement={(question) => isDiagramId(question.diagramId)
      ? <Electrician309ADiagram id={question.diagramId} caption={question.diagramAlt ?? undefined} />
      : null}
    accentColor="#0047AB"
    accentColor2="#087C99"
  />;
}
