import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";
export default function WpiClass1WaterCollFlashcards() {
  usePageMeta({
    title: "WPI Class 1 Water Collection Flashcards",
    description: "Flashcards for WPI Class 1 Water Collection operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });


  const { questions, modules, isLoading } = useQuestionBank("wpi-class1-wastewater-coll");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="WPI Class I Wastewater Collection" backPath="/wpi-class1-water-coll">
      <PurchaseGate
        examType="wpi-class1-water-coll"
        productKey="wpi-class1-water-coll"
        productName="WPI Class I Wastewater Collection Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WPI Class I Wastewater Collection"
          examType="wpi-class1-water-coll"
          backPath="/wpi-class1-water-coll"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
