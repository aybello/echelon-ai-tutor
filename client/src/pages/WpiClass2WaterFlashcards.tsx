import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function WpiClass2WaterFlashcards() {

  const { questions, modules, isLoading } = useQuestionBank("wpi-class2-water");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="WPI Class II Water" backPath="/wpi-class2-water">
      <PurchaseGate
        examType="wpi-class2-water"
        productKey="wpi-class2-water"
        productName="WPI Class II Water Treatment Practice Pass"
        price={149}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WPI Class II Water"
          examType="wpi-class2-water"
          backPath="/wpi-class2-water"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
