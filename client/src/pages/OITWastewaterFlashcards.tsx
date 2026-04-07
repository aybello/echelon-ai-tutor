import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { CLASS1_WASTEWATER_QUESTIONS, CLASS1_WASTEWATER_MODULES } from "@/lib/class1WastewaterQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function OITWastewaterFlashcards() {
  return (
    <FlashcardErrorBoundary examName="OIT Wastewater" backPath="/oit-ww">
      <PurchaseGate
        examType="class1-ww"
        productKey="oit-ww"
        productName="OIT Wastewater Practice Pass"
        price={59}
      >
        <FlashcardShell
          questions={CLASS1_WASTEWATER_QUESTIONS as unknown as FlashcardQuestion[]}
          examName="OIT Wastewater"
          examType="oit-ww"
          backPath="/oit-ww"
          modules={CLASS1_WASTEWATER_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
