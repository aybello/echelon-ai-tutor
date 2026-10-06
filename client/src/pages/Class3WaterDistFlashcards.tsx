import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Class3WaterDistFlashcards() {
  usePageMeta({
    title: "Ontario Class 3 Water Distribution and Supply Flashcards",
    description: "Flashcards for the Ontario Class 3 Water Distribution and Supply operator certification exam.",
    noindex: true
  });
  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("class3-water-dist");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return (
    <FlashcardErrorBoundary examName="Ontario Class 3 Water Distribution and Supply" backPath="/class3-water-dist">
      <PurchaseGate
        examType="class3-water-dist"
        productKey="class3-water-dist"
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="Ontario Class 3 Water Distribution and Supply"
          examType="class3-water-dist"
          backPath="/class3-water-dist"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
