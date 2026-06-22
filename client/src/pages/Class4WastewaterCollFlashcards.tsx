import { useQuestionBank } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Class4WastewaterCollFlashcards() {
  usePageMeta({
    title: "Ontario Class 4 Wastewater Collection Flashcards",
    description: "Flashcards for the Ontario Class 4 Wastewater Collection operator certification exam.",
  });
  const { questions, modules, isLoading, dbUnavailable } = useQuestionBank("class4-wastewater-coll");
  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return (
    <FlashcardErrorBoundary examName="Ontario Class 4 Wastewater Collection" backPath="/class4-wastewater-coll">
      <PurchaseGate
        examType="class4-wastewater-coll"
        productKey="class4-wastewater-coll"
        productName="Ontario Class 4 Wastewater Collection Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={questions as unknown as FlashcardQuestion[]}
          examName="Ontario Class 4 Wastewater Collection"
          examType="class4-wastewater-coll"
          backPath="/class4-wastewater-coll"
          modules={modules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
