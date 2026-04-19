import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";
export default function WpiClass4WaterCollFlashcards() {
  usePageMeta({
    title: "WPI Class 4 Water Collection Flashcards",
    description: "Flashcards for WPI Class 4 Water Collection operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });


  const { questions, modules, isLoading } = useQuestionBank("wpi-class4-wastewater-coll");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="WPI Class IV Wastewater Collection" backPath="/wpi-class4-water-coll">
      <PurchaseGate
        examType="wpi-class4-water-coll"
        productKey="wpi-class4-water-coll"
        productName="WPI Class IV Wastewater Collection Practice Pass"
        price={299}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WPI Class IV Wastewater Collection"
          examType="wpi-class4-water-coll"
          backPath="/wpi-class4-water-coll"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
