import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { wpiClass3WastewaterCollQuestions, WPI_CLASS3_WASTEWATER_COLL_MODULES } from "@/lib/wpiClass3WastewaterCollQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
export default function WpiClass3WaterCollFlashcards() {
  return (
    <FlashcardErrorBoundary examName="WPI Class III Wastewater Collection" backPath="/wpi-class3-water-coll">
      <PurchaseGate
        examType="wpi-class3-water-coll"
        productKey="wpi-class3-water-coll"
        productName="WPI Class III Wastewater Collection Practice Pass"
        price={249}
      >
        <FlashcardShell
          questions={wpiClass3WastewaterCollQuestions as unknown as FlashcardQuestion[]}
          examName="WPI Class III Wastewater Collection"
          examType="wpi-class3-water-coll"
          backPath="/wpi-class3-water-coll"
          modules={WPI_CLASS3_WASTEWATER_COLL_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
