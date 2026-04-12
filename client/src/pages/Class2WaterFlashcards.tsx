import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function Class2WaterFlashcards() {

  const { questions, modules, isLoading } = useQuestionBank("class2-water");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="Ontario Class 2 Water" backPath="/class2-water">
      <PurchaseGate
        examType="class2-water"
        productKey="class2-water"
        productName="Class 2 Water Treatment Practice Pass"
        price={149}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="Ontario Class 2 Water"
          examType="class2-water"
          backPath="/class2-water"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
