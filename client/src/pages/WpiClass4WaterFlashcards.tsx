import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";


export default function WpiClass4WaterFlashcards() {
  usePageMeta({
    title: "WPI Class 4 Water Treatment Flashcards",
    description: "Flashcards for WPI Class 4 Water Treatment operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });


  const { questions, modules, isLoading } = useQuestionBank("wpi-class4-water");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="WPI Class IV Water" backPath="/wpi-class4-water">
      <PurchaseGate
        examType="wpi-class4-water"
        productKey="wpi-class4-water"
        productName="WPI Class IV Water Treatment Practice Pass"
        price={299}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WPI Class IV Water"
          examType="wpi-class4-water"
          backPath="/wpi-class4-water"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
