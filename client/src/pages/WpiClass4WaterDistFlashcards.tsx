import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { wpiClass4WaterDistQuestions, WPI_CLASS4_WATER_DIST_MODULES } from "@/lib/wpiClass4WaterDistQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
export default function WpiClass4WaterDistFlashcards() {
  return (
    <FlashcardErrorBoundary examName="WPI Class IV Water Distribution" backPath="/wpi-class4-water-dist">
      <PurchaseGate
        examType="wpi-class4-water-dist"
        productKey="wpi-class4-water-dist"
        productName="WPI Class IV Water Distribution Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={wpiClass4WaterDistQuestions as unknown as FlashcardQuestion[]}
          examName="WPI Class IV Water Distribution"
          examType="wpi-class4-water-dist"
          backPath="/wpi-class4-water-dist"
          modules={WPI_CLASS4_WATER_DIST_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
