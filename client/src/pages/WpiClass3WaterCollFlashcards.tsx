import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
export default function WpiClass3WaterCollFlashcards() {

  const { questions, modules, isLoading } = useQuestionBank("wpi-class3-wastewater-coll");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="WPI Class III Wastewater Collection" backPath="/wpi-class3-water-coll">
      <PurchaseGate
        examType="wpi-class3-water-coll"
        productKey="wpi-class3-water-coll"
        productName="WPI Class III Wastewater Collection Practice Pass"
        price={249}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WPI Class III Wastewater Collection"
          examType="wpi-class3-water-coll"
          backPath="/wpi-class3-water-coll"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
