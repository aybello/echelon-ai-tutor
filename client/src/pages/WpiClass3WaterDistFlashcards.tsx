import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { wpiClass3WaterDistQuestions, WPI_CLASS3_WATER_DIST_MODULES } from "@/lib/wpiClass3WaterDistQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";

export default function WpiClass3WaterDistFlashcards() {
  return (
    <FlashcardErrorBoundary examName="WPI Class III Water Distribution" backPath="/wpi-class3-water-dist">
      <PurchaseGate
        examType="wpi-class3-water-dist"
        productKey="wpi-class3-water-dist"
        productName="WPI Class III Water Distribution Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={wpiClass3WaterDistQuestions as unknown as FlashcardQuestion[]}
          examName="WPI Class III Water Distribution"
          examType="wpi-class3-water-dist"
          backPath="/wpi-class3-water-dist"
          modules={WPI_CLASS3_WATER_DIST_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
