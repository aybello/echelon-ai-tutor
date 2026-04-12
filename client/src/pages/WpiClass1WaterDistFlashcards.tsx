import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";

export default function WpiClass1WaterDistFlashcards() {

  const { questions, modules, isLoading } = useQuestionBank("wpi-class1-water-dist");
  if (isLoading) return <QuizSkeleton />;

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
