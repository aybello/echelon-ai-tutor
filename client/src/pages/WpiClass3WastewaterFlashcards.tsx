import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { wpiClass3WastewaterQuestions, WPI_CLASS3_WASTEWATER_MODULES } from "@/lib/wpiClass3WastewaterQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function WpiClass3WastewaterFlashcards() {
  return (
    <FlashcardErrorBoundary examName="WPI Class III Wastewater" backPath="/wpi-class3-wastewater">
      <PurchaseGate
        examType="wpi-class3-wastewater"
        productKey="wpi-class3-wastewater"
        productName="WPI Class III Wastewater Practice Pass"
        price={349}
      >
        <FlashcardShell
          questions={wpiClass3WastewaterQuestions as unknown as FlashcardQuestion[]}
          examName="WPI Class III Wastewater"
          examType="wpi-class3-wastewater"
          backPath="/wpi-class3-wastewater"
          modules={WPI_CLASS3_WASTEWATER_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
