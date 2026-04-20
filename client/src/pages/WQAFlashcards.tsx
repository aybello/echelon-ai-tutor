import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";


export default function WQAFlashcards() {
  usePageMeta({
    title: "WQA Flashcards",
    description: "Flashcards for Water Quality Analyst (WQA) certification exam. Comprehensive practice with AI-powered explanations.",
  });


  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("wqa");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

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
