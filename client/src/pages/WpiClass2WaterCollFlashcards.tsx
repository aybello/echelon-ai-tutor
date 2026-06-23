import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";
export default function WpiClass2WaterCollFlashcards() {
  usePageMeta({
    title: "WPI Class 2 Water Collection Flashcards",
    description: "Flashcards for WPI Class 2 Water Collection operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });


  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("wpi-class2-wastewater-coll");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <FlashcardErrorBoundary examName="WPI Class II Water Collection" backPath="/wpi-class2-water-coll">
      <PurchaseGate
        examType="wpi-class2-water-coll"
        productKey="wpi-class2-water-coll"
        productName="WPI Class II Wastewater Collection Practice Pass"
        price={149}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WPI Class II Water Collection"
          examType="wpi-class2-water-coll"
          backPath="/wpi-class2-water-coll"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
