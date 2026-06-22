import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Class1WastewaterCollFlashcards() {
  usePageMeta({
    title: "Ontario Class 1 Wastewater Collection Flashcards",
    description: "Flashcards for the Ontario Class 1 Wastewater Collection operator certification exam.",
  });
  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("class1-wastewater-coll");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return (
    <FlashcardErrorBoundary examName="Ontario Class 1 Wastewater Collection" backPath="/class1-wastewater-coll">
      <PurchaseGate
        examType="class1-wastewater-coll"
        productKey="class1-wastewater-coll"
        productName="Ontario Class 1 Wastewater Collection Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="Ontario Class 1 Wastewater Collection"
          examType="class1-wastewater-coll"
          backPath="/class1-wastewater-coll"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
