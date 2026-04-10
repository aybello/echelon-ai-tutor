import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { wpiClass2WaterDistQuestions, wpiClass2WaterDistModules } from "@/lib/wpiClass2WaterDistQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";

export default function WpiClass2WaterDistFlashcards() {
  return (
    <FlashcardErrorBoundary examName="WPI Class II Water Distribution" backPath="/wpi-class2-water-dist">
      <PurchaseGate
        examType="wpi-class2-water-dist"
        productKey="wpi-class2-water-dist"
        productName="WPI Class II Water Distribution Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={wpiClass2WaterDistQuestions as unknown as FlashcardQuestion[]}
          examName="WPI Class II Water Distribution"
          examType="wpi-class2-water-dist"
          backPath="/wpi-class2-water-dist"
          modules={wpiClass2WaterDistModules as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
