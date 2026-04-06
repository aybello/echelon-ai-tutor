import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { wpiClass2WaterQuestions, WPI_CLASS2_WATER_MODULES } from "@/lib/wpiClass2WaterQuestions";

export default function WpiClass2WaterFlashcards() {
  return (
    <PurchaseGate
      examType="wpi-class2-water"
      productKey="wpi-class2-water"
      productName="WPI Class II Water Treatment Practice Pass"
      price={199}
    >
      <FlashcardShell
        questions={wpiClass2WaterQuestions as unknown as FlashcardQuestion[]}
        examName="WPI Class II Water"
        backPath="/wpi-class2-water"
        modules={WPI_CLASS2_WATER_MODULES as unknown as string[]}
      />
    </PurchaseGate>
  );
}
