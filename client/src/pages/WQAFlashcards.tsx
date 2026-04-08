import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { WQA_QUESTIONS, WQA_MODULES } from "@/lib/wqaQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function WQAFlashcards() {
  return (
    <FlashcardErrorBoundary examName="WQA Water Quality Analyst" backPath="/wqa">
      <PurchaseGate
        examType="wqa"
        productKey="wqa"
        productName="WQA Practice Pass"
        price={149}
      >
        <FlashcardShell
          questions={WQA_QUESTIONS as unknown as FlashcardQuestion[]}
          examName="WQA Water Quality Analyst"
          examType="wqa"
          backPath="/wqa"
          modules={WQA_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
