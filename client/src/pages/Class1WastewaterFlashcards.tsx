import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { CLASS1_WASTEWATER_QUESTIONS, CLASS1_WASTEWATER_MODULES } from "@/lib/class1WastewaterQuestions";

export default function Class1WastewaterFlashcards() {
  return (
    <PurchaseGate
      examType="class1-ww"
      productKey="class1-ww"
      productName="Class 1 Wastewater Treatment Practice Pass"
      price={149}
    >
      <FlashcardShell
        questions={CLASS1_WASTEWATER_QUESTIONS as unknown as FlashcardQuestion[]}
        examName="Ontario Class 1 Wastewater"
        backPath="/class1-ww"
        modules={CLASS1_WASTEWATER_MODULES as unknown as string[]}
      />
    </PurchaseGate>
  );
}
