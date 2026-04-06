import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { wpiClass3WaterQuestions, WPI_CLASS3_WATER_MODULES } from "@/lib/wpiClass3WaterQuestions";

export default function WpiClass3WaterFlashcards() {
  return (
    <PurchaseGate
      examType="wpi-class3-water"
      productKey="wpi-class3-water"
      productName="WPI Class III Water Treatment Practice Pass"
      price={349}
    >
      <FlashcardShell
        questions={wpiClass3WaterQuestions as unknown as FlashcardQuestion[]}
        examName="WPI Class III Water"
        backPath="/wpi-class3-water"
        modules={WPI_CLASS3_WATER_MODULES as unknown as string[]}
      />
    </PurchaseGate>
  );
}
