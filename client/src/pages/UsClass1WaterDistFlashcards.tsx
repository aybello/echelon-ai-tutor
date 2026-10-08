import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function UsClass1WaterDistFlashcards() {
  usePageMeta({
    title: "US Class I Water Distribution Flashcards",
    description: "Flashcards for the US Class I Water Distribution operator certification exam, built on the WPI Class 1 Water Distribution Need-to-Know Criteria.",
    noindex: true,
  });

  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("us-class1-water-dist");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <FlashcardErrorBoundary examName="US Class I Water Distribution" backPath="/us-class1-water-dist">
      <PurchaseGate
        examType="us-class1-water-dist"
        productKey="us-class1-water-dist"
        productName="US Class I Water Distribution Practice Pass"
        price={149}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="US Class I Water Distribution"
          examType="us-class1-water-dist"
          backPath="/us-class1-water-dist"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
