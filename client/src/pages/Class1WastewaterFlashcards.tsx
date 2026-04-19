import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";


export default function Class1WastewaterFlashcards() {
  usePageMeta({
    title: "Class 1 Wastewater Treatment Flashcards",
    description: "Flashcards for Ontario OWWCO Class 1 Wastewater Treatment operator certification exam. AI-powered exam prep with detailed explanations.",
  });


  const { questions, modules, isLoading } = useQuestionBank("class1-wastewater");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="Ontario Class 1 Wastewater" backPath="/class1-ww">
      <PurchaseGate
        examType="class1-ww"
        productKey="class1-ww"
        productName="Class 1 Wastewater Treatment Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="Ontario Class 1 Wastewater"
          examType="class1-ww"
          backPath="/class1-ww"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
