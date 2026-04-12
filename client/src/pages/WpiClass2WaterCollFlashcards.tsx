import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
export default function WpiClass2WaterCollFlashcards() {

  const { questions, modules, isLoading } = useQuestionBank("wpi-class2-wastewater-coll");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="WPI Class II Wastewater Collection" backPath="/wpi-class2-water-coll">
      <PurchaseGate
        examType="wpi-class2-water-coll"
        productKey="wpi-class2-water-coll"
        productName="WPI Class II Wastewater Collection Practice Pass"
        price={149}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WPI Class II Wastewater Collection"
          examType="wpi-class2-water-coll"
          backPath="/wpi-class2-water-coll"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
