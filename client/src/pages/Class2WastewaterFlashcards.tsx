import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function Class2WastewaterFlashcards() {

  const { questions, modules, isLoading } = useQuestionBank("class2-wastewater");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="Ontario Class 2 Wastewater" backPath="/class2-ww">
      <PurchaseGate
        examType="class2-ww"
        productKey="class2-ww"
        productName="Class 2 Wastewater Treatment Practice Pass"
        price={149}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="Ontario Class 2 Wastewater"
          examType="class2-ww"
          backPath="/class2-ww"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
