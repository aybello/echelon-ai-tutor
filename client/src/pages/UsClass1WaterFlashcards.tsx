import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function UsClass1WaterFlashcards() {
  usePageMeta({
    title: "US Class I Water Treatment Flashcards",
    description: "Flashcards for the US Class I Water Treatment operator certification exam, built on the WPI Class 1 Water Treatment Need-to-Know Criteria.",
    noindex: true,
  });

  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("us-class1-water");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <FlashcardErrorBoundary examName="US Class I Water Treatment" backPath="/us-class1-water">
      <PurchaseGate
        examType="us-class1-water"
        productKey="us-class1-water"
        productName="US Class I Water Treatment Practice Pass"
        price={149}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="US Class I Water Treatment"
          examType="us-class1-water"
          backPath="/us-class1-water"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
