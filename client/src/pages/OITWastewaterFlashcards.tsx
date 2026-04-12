import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function OITWastewaterFlashcards() {

  const { questions, modules, isLoading } = useQuestionBank("class1-wastewater");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="OIT Wastewater" backPath="/oit-ww">
      <PurchaseGate
        examType="class1-ww"
        productKey="oit-ww"
        productName="OIT Wastewater Practice Pass"
        price={49}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="OIT Wastewater"
          examType="oit-ww"
          backPath="/oit-ww"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
