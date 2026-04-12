import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";

export default function WpiClass2WaterDistFlashcards() {

  const { questions, modules, isLoading } = useQuestionBank("wpi-class2-water-dist");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="WPI Class II Water Distribution" backPath="/wpi-class2-water-dist">
      <PurchaseGate
        examType="wpi-class2-water-dist"
        productKey="wpi-class2-water-dist"
        productName="WPI Class II Water Distribution Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WPI Class II Water Distribution"
          examType="wpi-class2-water-dist"
          backPath="/wpi-class2-water-dist"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
