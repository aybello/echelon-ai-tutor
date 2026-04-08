import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { wpiClass1WaterQuestions, WPI_CLASS1_WATER_MODULES } from "@/lib/wpiClass1WaterQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function WpiClass1WaterFlashcards() {
  return (
    <FlashcardErrorBoundary examName="WPI Class I Water" backPath="/wpi-class1-water">
      <PurchaseGate
        examType="wpi-class1-water"
        productKey="wpi-class1-water"
        productName="WPI Class I Water Treatment Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={wpiClass1WaterQuestions as unknown as FlashcardQuestion[]}
          examName="WPI Class I Water"
          examType="wpi-class1-water"
          backPath="/wpi-class1-water"
          modules={WPI_CLASS1_WATER_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
