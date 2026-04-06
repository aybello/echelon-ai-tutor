import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { WQA_QUESTIONS, WQA_MODULES } from "@/lib/wqaQuestions";

export default function WQAFlashcards() {
  return (
    <PurchaseGate
      examType="wqa"
      productKey="wqa"
      productName="WQA Practice Pass"
      price={179}
    >
      <FlashcardShell
        questions={WQA_QUESTIONS as unknown as FlashcardQuestion[]}
        examName="WQA Water Quality Analyst"
        backPath="/wqa"
        modules={WQA_MODULES as unknown as string[]}
      />
    </PurchaseGate>
  );
}
