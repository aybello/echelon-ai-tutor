import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function WpiClass3WaterDistFlashcards() {
  usePageMeta({
    title: "WPI Class 3 Water Distribution Flashcards",
    description: "Flashcards for WPI Class 3 Water Distribution operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });


  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("wpi-class3-water-dist");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <FlashcardErrorBoundary examName="WPI Class III Water Distribution" backPath="/wpi-class3-water-dist">
      <PurchaseGate
        examType="wpi-class3-water-dist"
        productKey="wpi-class3-water-dist"
        productName="WPI Class III Water Distribution Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WPI Class III Water Distribution"
          examType="wpi-class3-water-dist"
          backPath="/wpi-class3-water-dist"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
