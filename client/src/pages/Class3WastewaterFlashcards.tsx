import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";


export default function Class3WastewaterFlashcards() {
  usePageMeta({
    title: "Class 3 Wastewater Treatment Flashcards",
    description: "Flashcards for Ontario OWWCO Class 3 Wastewater Treatment operator certification exam. AI-powered exam prep with detailed explanations.",
  });


  const { questions, modules, isLoading } = useQuestionBank("class3-wastewater");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="Ontario Class 3 Wastewater" backPath="/class3-ww">
      <PurchaseGate
        examType="class3-ww"
        productKey="class3-ww"
        productName="Class 3 Wastewater Treatment Practice Pass"
        price={249}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="Ontario Class 3 Wastewater"
          examType="class3-ww"
          backPath="/class3-ww"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
