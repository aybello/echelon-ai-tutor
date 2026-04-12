import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function WpiClass4WastewaterFlashcards() {

  const { questions, modules, isLoading } = useQuestionBank("wpi-class4-wastewater");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="WPI Class IV Wastewater" backPath="/wpi-class4-wastewater">
      <PurchaseGate
        examType="wpi-class4-wastewater"
        productKey="wpi-class4-wastewater"
        productName="WPI Class IV Wastewater Practice Pass"
        price={299}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WPI Class IV Wastewater"
          examType="wpi-class4-wastewater"
          backPath="/wpi-class4-wastewater"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
