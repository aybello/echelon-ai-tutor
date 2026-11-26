import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";


export default function OITWastewaterFlashcards() {
  usePageMeta({
    title: "OIT Wastewater Flashcards",
    description: "Flashcards for Ontario OIT (Operator-in-Training) Wastewater certification exam. Free access, no account required.",
    noindex: true
  });


  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("oit-ww", "full", "flashcards");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <FlashcardErrorBoundary examName="OIT Wastewater" backPath="/oit-ww">
      <FlashcardShell
        questions={questions as unknown as FlashcardQuestion[]}
        examName="OIT Wastewater"
        examType="oit-ww"
        backPath="/oit-ww"
        modules={modules as unknown as string[]}
        freeFlipLimit={50}
        productKey="oit-ww"
        allowMorePreview={false}
      />
    </FlashcardErrorBoundary>

  );
}
