import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { wpiClass1WastewaterCollQuestions, WPI_CLASS1_WASTEWATER_COLL_MODULES } from "@/lib/wpiClass1WastewaterCollQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
export default function WpiClass1WaterCollFlashcards() {
  return (
    <FlashcardErrorBoundary examName="WPI Class I Wastewater Collection" backPath="/wpi-class1-water-coll">
      <PurchaseGate
        examType="wpi-class1-water-coll"
        productKey="wpi-class1-water-coll"
        productName="WPI Class I Wastewater Collection Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={wpiClass1WastewaterCollQuestions as unknown as FlashcardQuestion[]}
          examName="WPI Class I Wastewater Collection"
          examType="wpi-class1-water-coll"
          backPath="/wpi-class1-water-coll"
          modules={WPI_CLASS1_WASTEWATER_COLL_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
