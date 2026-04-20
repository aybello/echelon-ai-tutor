import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";


export default function WpiClass1WaterFlashcards() {
  usePageMeta({
    title: "WPI Class 1 Water Treatment Flashcards",
    description: "Flashcards for WPI Class 1 Water Treatment operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });


  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("wpi-class1-water");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <FlashcardErrorBoundary examName="WPI Class I Water" backPath="/wpi-class1-water">
      <PurchaseGate
        examType="wpi-class1-water"
        productKey="wpi-class1-water"
        productName="WPI Class I Water Treatment Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WPI Class I Water"
          examType="wpi-class1-water"
          backPath="/wpi-class1-water"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
