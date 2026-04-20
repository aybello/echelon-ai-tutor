import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";


export default function Class3WaterFlashcards() {
  usePageMeta({
    title: "Class 3 Water Treatment Flashcards",
    description: "Flashcards for Ontario OWWCO Class 3 Water Treatment operator certification exam. AI-powered exam prep with detailed explanations.",
  });


  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("class3-water");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <FlashcardErrorBoundary examName="Ontario Class 3 Water" backPath="/class3-water">
      <PurchaseGate
        examType="class3-water"
        productKey="class3-water"
        productName="Class 3 Water Treatment Practice Pass"
        price={249}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="Ontario Class 3 Water"
          examType="class3-water"
          backPath="/class3-water"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
