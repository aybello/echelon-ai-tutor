import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";


export default function WpiClass3WastewaterFlashcards() {
  usePageMeta({
    title: "WPI Class 3 Wastewater Treatment Flashcards",
    description: "Flashcards for WPI Class 3 Wastewater Treatment operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
  });


  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("wpi-class3-wastewater");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <FlashcardErrorBoundary examName="WPI Class III Wastewater" backPath="/wpi-class3-wastewater">
      <PurchaseGate
        examType="wpi-class3-wastewater"
        productKey="wpi-class3-wastewater"
        productName="WPI Class III Wastewater Practice Pass"
        price={249}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WPI Class III Wastewater"
          examType="wpi-class3-wastewater"
          backPath="/wpi-class3-wastewater"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
