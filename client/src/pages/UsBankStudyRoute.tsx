import { useParams } from "wouter";
import { getCourseByKey } from "@shared/courseRegistry";
import { pennsylvaniaBank, PA_PRACTICE_MOCK, type PennsylvaniaCourseKey } from "@shared/pennsylvaniaBanks";
import UsBankQuiz from "./UsBankQuiz";
import MockExamShell from "@/components/MockExamShell";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import PurchaseGate from "@/components/PurchaseGate";
import QuizSkeleton from "@/components/QuizSkeleton";
import { useQuestionBank, useMockExamMetadata } from "@/hooks/useQuestionBank";

type StudyTool = "practice" | "mock" | "flashcards";
export default function UsBankStudyRoute({ tool }: { tool: StudyTool }) {
  const { courseKey = "" } = useParams<{ courseKey: string }>();
  const bank = pennsylvaniaBank(courseKey);
  const course = getCourseByKey(courseKey);
  if (!bank || !course?.isActive) return <main><h1>Course not found</h1><a href="/us/states/pennsylvania">Pennsylvania preparation</a></main>;
  if (tool === "practice") return <UsBankQuiz key={courseKey} courseKey={bank.courseKey} />;
  if (tool === "mock") return <UsBankMock key={courseKey} courseKey={bank.courseKey} />;
  return <UsBankFlashcards key={courseKey} courseKey={bank.courseKey} />;
}
function UsBankMock({ courseKey }: { courseKey: PennsylvaniaCourseKey }) {
  const course = getCourseByKey(courseKey)!;
  const { isLoading, dbUnavailable } = useMockExamMetadata(courseKey);
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return <MockExamShell
    title={`${course.displayName} Practice Mock`}
    badge="PENNSYLVANIA · INDEPENDENT PRACTICE"
    noindex
    metaDescription="Echelon practice session, not an official Pennsylvania exam blueprint or prediction. Full course-pass sales are not available yet."
    examQuestions={PA_PRACTICE_MOCK.count}
    examDuration={PA_PRACTICE_MOCK.duration}
    passThreshold={PA_PRACTICE_MOCK.passThreshold}
    moduleTargets={{}}
    moduleColors={{}}
    productKey={courseKey}
    practicePath={course.quizPath}
    practiceLabel={course.shortName}
    currentPath={course.mockExamPath}
    infoLine="Echelon practice settings only: 100 questions, 3 hours, 70% practice target. Not Pennsylvania exam requirements. Full course-pass sales are not available yet."
    stream={course.track === "wastewater-collection" ? "wastewater" : "water"}
    showProvinceSelector={false}
    accentColor="#0369A1"
  />;
}
function UsBankFlashcards({ courseKey }: { courseKey: PennsylvaniaCourseKey }) {
  const course = getCourseByKey(courseKey)!;
  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank(courseKey, "full", "flashcards");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return <FlashcardErrorBoundary examName={course.displayName} backPath={course.quizPath}>
    <PurchaseGate examType={courseKey} productKey={course.productKey} backPath={course.quizPath}>
      <FlashcardShell questions={questions.filter(q => !q.isCalc) as unknown as FlashcardQuestion[]}
        examName={course.displayName} examType={courseKey} backPath={course.quizPath} modules={modules} />
    </PurchaseGate>
  </FlashcardErrorBoundary>;
}
