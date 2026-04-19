import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";


export default function WpiClass1WastewaterFlashcards() {
  usePageMeta({
    title: "WPI Class 1 Wastewater Treatment Flashcards",
    description: "Flashcards for WPI Class 1 Wastewater Treatment operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });


  const { questions, modules, isLoading } = useQuestionBank("wpi-class1-wastewater");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="WPI Class I Wastewater" backPath="/wpi-class1-wastewater">
      <PurchaseGate
        examType="wpi-class1-wastewater"
        productKey="wpi-class1-wastewater"
        productName="WPI Class I Wastewater Treatment Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WPI Class I Wastewater"
          examType="wpi-class1-wastewater"
          backPath="/wpi-class1-wastewater"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
