import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function Class1WaterFlashcards() {

  const { questions, modules, isLoading } = useQuestionBank("class1-water");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="Ontario Class 1 Water" backPath="/class1-water">
      <PurchaseGate
        examType="class1-water"
        productKey="class1-water"
        productName="Class 1 Water Treatment Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="Ontario Class 1 Water"
          examType="class1-water"
          backPath="/class1-water"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
