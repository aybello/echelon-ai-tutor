import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { CLASS2_WW_QUESTIONS, CLASS2_WW_MODULES } from "@/lib/class2WastewaterQuestions";

export default function Class2WastewaterFlashcards() {
  return (
    <PurchaseGate
      examType="class2-ww"
      productKey="class2-ww"
      productName="Class 2 Wastewater Treatment Practice Pass"
      price={199}
    >
      <FlashcardShell
        questions={CLASS2_WW_QUESTIONS as unknown as FlashcardQuestion[]}
        examName="Ontario Class 2 Wastewater"
        examType="class2-ww"
        backPath="/class2-ww"
        modules={CLASS2_WW_MODULES as unknown as string[]}
      />
    </PurchaseGate>
  );
}
