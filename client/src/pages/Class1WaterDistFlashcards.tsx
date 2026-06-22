import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Class1WaterDistFlashcards() {
  usePageMeta({
    title: "Ontario Class 1 Water Distribution Flashcards",
    description: "Flashcards for the Ontario Class 1 Water Distribution operator certification exam.",
  });
  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("class1-water-dist");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return (
    <FlashcardErrorBoundary examName="Ontario Class 1 Water Distribution" backPath="/class1-water-dist">
      <PurchaseGate
        examType="class1-water-dist"
        productKey="class1-water-dist"
        productName="Ontario Class 1 Water Distribution Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="Ontario Class 1 Water Distribution"
          examType="class1-water-dist"
          backPath="/class1-water-dist"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
