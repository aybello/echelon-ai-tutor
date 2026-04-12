import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
export default function OITWaterFlashcards() {

  const { questions, modules, isLoading } = useQuestionBank("oit");
  if (isLoading) return <QuizSkeleton />;

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
