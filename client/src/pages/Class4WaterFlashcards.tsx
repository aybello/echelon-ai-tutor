import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { QUESTIONS as CLASS4_WATER_QUESTIONS, CLASS4_WATER_MODULES } from "@/lib/class4WaterQuestions";

export default function Class4WaterFlashcards() {
  return (
    <PurchaseGate
      examType="class4-water"
      productKey="class4-water"
      productName="Class 4 Water Treatment Practice Pass"
      price={499}
    >
      <FlashcardShell
        questions={CLASS4_WATER_QUESTIONS as unknown as FlashcardQuestion[]}
        examName="Ontario Class 4 Water"
        examType="class4-water"
        backPath="/class4-water"
        modules={CLASS4_WATER_MODULES as unknown as string[]}
      />
    </PurchaseGate>
  );
}
