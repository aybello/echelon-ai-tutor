import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function WQAFlashcards() {

  const { questions, modules, isLoading } = useQuestionBank("wqa");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="WQA Water Quality Analyst" backPath="/wqa">
      <PurchaseGate
        examType="wqa"
        productKey="wqa"
        productName="WQA Practice Pass"
        price={149}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="WQA Water Quality Analyst"
          examType="wqa"
          backPath="/wqa"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
