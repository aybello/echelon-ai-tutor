import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { wpiClass1WaterDistQuestions, WPI_CLASS1_WATER_DIST_MODULES } from "@/lib/wpiClass1WaterDistQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";

export default function WpiClass1WaterDistFlashcards() {
  return (
    <FlashcardErrorBoundary examName="WPI Class I Water Distribution" backPath="/wpi-class1-water-dist">
      <PurchaseGate
        examType="wpi-class1-water-dist"
        productKey="wpi-class1-water-dist"
        productName="WPI Class I Water Distribution Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={wpiClass1WaterDistQuestions as unknown as FlashcardQuestion[]}
          examName="WPI Class I Water Distribution"
          examType="wpi-class1-water-dist"
          backPath="/wpi-class1-water-dist"
          modules={WPI_CLASS1_WATER_DIST_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
