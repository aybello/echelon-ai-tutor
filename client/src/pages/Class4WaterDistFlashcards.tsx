import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Class4WaterDistFlashcards() {
  usePageMeta({
    title: "Ontario Class 4 Water Distribution Flashcards",
    description: "Flashcards for the Ontario Class 4 Water Distribution operator certification exam.",
  });
  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("class4-water-dist");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return (
    <FlashcardErrorBoundary examName="Ontario Class 4 Water Distribution" backPath="/class4-water-dist">
      <PurchaseGate
        examType="class4-water-dist"
        productKey="class4-water-dist"
        productName="Ontario Class 4 Water Distribution Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="Ontario Class 4 Water Distribution"
          examType="class4-water-dist"
          backPath="/class4-water-dist"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
