import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { CLASS4_WW_QUESTIONS, CLASS4_WASTEWATER_MODULES } from "@/lib/class4WastewaterQuestions";

const C4WW_MODULE_NAMES = CLASS4_WASTEWATER_MODULES.map((m) => (m as unknown as { name: string }).name);

export default function Class4WastewaterFlashcards() {
  return (
    <PurchaseGate
      examType="class4-ww"
      productKey="class4-ww"
      productName="Class 4 Wastewater Treatment Practice Pass"
      price={499}
    >
      <FlashcardShell
        questions={CLASS4_WW_QUESTIONS as unknown as FlashcardQuestion[]}
        examName="Ontario Class 4 Wastewater"
        examType="class4-ww"
        backPath="/class4-ww"
        modules={C4WW_MODULE_NAMES}
      />
    </PurchaseGate>
  );
}
