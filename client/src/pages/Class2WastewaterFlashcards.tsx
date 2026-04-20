import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";


export default function Class2WastewaterFlashcards() {
  usePageMeta({
    title: "Class 2 Wastewater Treatment Flashcards",
    description: "Flashcards for Ontario OWWCO Class 2 Wastewater Treatment operator certification exam. AI-powered exam prep with detailed explanations.",
  });


  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("class2-wastewater");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

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
