import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function Class4WaterFlashcards() {

  const { questions, modules, isLoading } = useQuestionBank("class4-water");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="Ontario Class 4 Water" backPath="/class4-water">
      <PurchaseGate
        examType="class4-water"
        productKey="class4-water"
        productName="Class 4 Water Treatment Practice Pass"
        price={299}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="Ontario Class 4 Water"
          examType="class4-water"
          backPath="/class4-water"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
