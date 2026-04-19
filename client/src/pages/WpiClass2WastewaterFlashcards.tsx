import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";


export default function WpiClass2WastewaterFlashcards() {
  usePageMeta({
    title: "WPI Class 2 Wastewater Treatment Flashcards",
    description: "Flashcards for WPI Class 2 Wastewater Treatment operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });


  const { questions, modules, isLoading } = useQuestionBank("wpi-class2-wastewater");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="WPI Class II Wastewater" backPath="/wpi-class2-wastewater">
      <PurchaseGate
        examType="wpi-class2-wastewater"
        productKey="wpi-class2-wastewater"
        productName="WPI Class II Wastewater Treatment Practice Pass"
        price={149}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WPI Class II Wastewater"
          examType="wpi-class2-wastewater"
          backPath="/wpi-class2-wastewater"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
