import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";
export default function OITWaterFlashcards() {
  usePageMeta({
    title: "OIT Water Flashcards",
    description: "Flashcards for Ontario OIT (Operator-in-Training) Water certification exam. Free access, no account required.",
  });


  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("oit");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <FlashcardErrorBoundary examName="Ontario OIT Water" backPath="/quiz">
      <FlashcardShell
        questions={questions as unknown as FlashcardQuestion[]}
        examName="Ontario OIT Water"
        examType="oit"
        backPath="/quiz"
        modules={modules as unknown as string[]}
        freeFlipLimit={10}
        productKey="oit"
      />
    </FlashcardErrorBoundary>
  );
}
