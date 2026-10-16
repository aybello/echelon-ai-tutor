import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function UsTexasClassDFlashcards() {
  usePageMeta({
    title: "Texas Class D Water Flashcards | Echelon Institute",
    description: "Original Texas Class D Water flashcards based on the public TCEQ operator topic scope.",
    noindex: true,
  });

  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("us-texas-class-d-water");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <FlashcardErrorBoundary examName="Texas Class D Water" backPath="/us-texas-class-d-water">
      <PurchaseGate
        examType="us-texas-class-d-water"
        productKey="us-texas-class-d-water"
        backPath="/us-texas-class-d-water"
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="Texas Class D Water"
          examType="us-texas-class-d-water"
          backPath="/us-texas-class-d-water"
          modules={modules}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
