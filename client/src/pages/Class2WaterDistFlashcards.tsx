import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Class2WaterDistFlashcards() {
  usePageMeta({
    title: "Ontario Class 2 Water Distribution Flashcards",
    description: "Flashcards for the Ontario Class 2 Water Distribution operator certification exam.",
  });
  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("class2-water-dist");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return (
    <FlashcardErrorBoundary examName="Ontario Class 2 Water Distribution" backPath="/class2-water-dist">
      <PurchaseGate
        examType="class2-water-dist"
        productKey="class2-water-dist"
        productName="Ontario Class 2 Water Distribution Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="Ontario Class 2 Water Distribution"
          examType="class2-water-dist"
          backPath="/class2-water-dist"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
