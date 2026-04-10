import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { wpiClass2WastewaterCollQuestions, WPI_CLASS2_WASTEWATER_COLL_MODULES } from "@/lib/wpiClass2WastewaterCollQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
export default function WpiClass2WaterCollFlashcards() {
  return (
    <FlashcardErrorBoundary examName="WPI Class II Wastewater Collection" backPath="/wpi-class2-water-coll">
      <PurchaseGate
        examType="wpi-class2-water-coll"
        productKey="wpi-class2-water-coll"
        productName="WPI Class II Wastewater Collection Practice Pass"
        price={149}
      >
        <FlashcardShell
          questions={wpiClass2WastewaterCollQuestions as unknown as FlashcardQuestion[]}
          examName="WPI Class II Wastewater Collection"
          examType="wpi-class2-water-coll"
          backPath="/wpi-class2-water-coll"
          modules={WPI_CLASS2_WASTEWATER_COLL_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>
  );
}
