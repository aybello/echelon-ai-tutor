import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Class4WastewaterFlashcards() {
  usePageMeta({
    title: "Class 4 Wastewater Treatment Flashcards",
    description: "Flashcards for Ontario OWWCO Class 4 Wastewater Treatment operator certification exam. AI-powered exam prep with detailed explanations.",
  });

  const { questions, modules, isLoading } = useQuestionBank("class4-wastewater");
  if (isLoading) return <QuizSkeleton />;

  return (
    <FlashcardErrorBoundary examName="Ontario Class 4 Wastewater" backPath="/class4-ww">
      <PurchaseGate
        examType="class4-ww"
        productKey="class4-ww"
        productName="Class 4 Wastewater Treatment Practice Pass"
        price={299}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="Ontario Class 4 Wastewater"
          examType="class4-ww"
          backPath="/class4-ww"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
