import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";


export default function WpiClass3WaterFlashcards() {
  usePageMeta({
    title: "WPI Class 3 Water Treatment Flashcards",
    description: "Flashcards for WPI Class 3 Water Treatment operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });


  const { questions, modules, isLoading } = useQuestionBank("wpi-class3-water");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="WPI Class III Water" backPath="/wpi-class3-water">
      <PurchaseGate
        examType="wpi-class3-water"
        productKey="wpi-class3-water"
        productName="WPI Class III Water Treatment Practice Pass"
        price={249}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WPI Class III Water"
          examType="wpi-class3-water"
          backPath="/wpi-class3-water"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
