import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { wpiClass4WastewaterCollQuestions, WPI_CLASS4_WASTEWATER_COLL_MODULES } from "@/lib/wpiClass4WastewaterCollQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
export default function WpiClass4WaterCollFlashcards() {
  return (
    <FlashcardErrorBoundary examName="WPI Class IV Wastewater Collection" backPath="/wpi-class4-water-coll">
      <PurchaseGate
        examType="wpi-class4-water-coll"
        productKey="wpi-class4-water-coll"
        productName="WPI Class IV Wastewater Collection Practice Pass"
        price={299}
      >
        <FlashcardShell
          questions={wpiClass4WastewaterCollQuestions as unknown as FlashcardQuestion[]}
          examName="WPI Class IV Wastewater Collection"
          examType="wpi-class4-water-coll"
          backPath="/wpi-class4-water-coll"
          modules={WPI_CLASS4_WASTEWATER_COLL_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
