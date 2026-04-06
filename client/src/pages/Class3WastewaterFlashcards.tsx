import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { CLASS3_WW_QUESTIONS, CLASS3_WW_MODULES } from "@/lib/class3WastewaterQuestions";

export default function Class3WastewaterFlashcards() {
  return (
    <PurchaseGate
      examType="class3-ww"
      productKey="class3-ww"
      productName="Class 3 Wastewater Treatment Practice Pass"
      price={349}
    >
      <FlashcardShell
        questions={CLASS3_WW_QUESTIONS as unknown as FlashcardQuestion[]}
        examName="Ontario Class 3 Wastewater"
        examType="class3-ww"
        backPath="/class3-ww"
        modules={CLASS3_WW_MODULES as unknown as string[]}
      />
    </PurchaseGate>
  );
}
