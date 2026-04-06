import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { CLASS1_WASTEWATER_QUESTIONS, CLASS1_WASTEWATER_MODULES } from "@/lib/class1WastewaterQuestions";

export default function OITWastewaterFlashcards() {
  return (
    <PurchaseGate
      examType="class1-ww"
      productKey="oit-ww"
      productName="OIT Wastewater Practice Pass"
      price={79}
    >
      <FlashcardShell
        questions={CLASS1_WASTEWATER_QUESTIONS as unknown as FlashcardQuestion[]}
        examName="OIT Wastewater"
        backPath="/oit-ww"
        modules={CLASS1_WASTEWATER_MODULES as unknown as string[]}
      />
    </PurchaseGate>
  );
}
