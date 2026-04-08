import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { wpiClass4WaterQuestions, WPI_CLASS4_WATER_MODULES } from "@/lib/wpiClass4WaterQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function WpiClass4WaterFlashcards() {
  return (
    <FlashcardErrorBoundary examName="WPI Class IV Water" backPath="/wpi-class4-water">
      <PurchaseGate
        examType="wpi-class4-water"
        productKey="wpi-class4-water"
        productName="WPI Class IV Water Treatment Practice Pass"
        price={299}
      >
        <FlashcardShell
          questions={wpiClass4WaterQuestions as unknown as FlashcardQuestion[]}
          examName="WPI Class IV Water"
          examType="wpi-class4-water"
          backPath="/wpi-class4-water"
          modules={WPI_CLASS4_WATER_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
