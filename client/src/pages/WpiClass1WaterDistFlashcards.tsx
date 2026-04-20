import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function WpiClass1WaterDistFlashcards() {
  usePageMeta({
    title: "WPI Class 1 Water Distribution Flashcards",
    description: "Flashcards for WPI Class 1 Water Distribution operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });


  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("wpi-class1-water-dist");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <FlashcardErrorBoundary examName="WPI Class I Water Distribution" backPath="/wpi-class1-water-dist">
      <PurchaseGate
        examType="wpi-class1-water-dist"
        productKey="wpi-class1-water-dist"
        productName="WPI Class I Water Distribution Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WPI Class I Water Distribution"
          examType="wpi-class1-water-dist"
          backPath="/wpi-class1-water-dist"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
