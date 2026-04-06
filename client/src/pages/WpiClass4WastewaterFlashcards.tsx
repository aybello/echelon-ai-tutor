import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { wpiClass4WastewaterQuestions, WPI_CLASS4_WASTEWATER_MODULES } from "@/lib/wpiClass4WastewaterQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function WpiClass4WastewaterFlashcards() {
  return (
    <FlashcardErrorBoundary examName="WPI Class IV Wastewater" backPath="/wpi-class4-wastewater">
      <PurchaseGate
        examType="wpi-class4-wastewater"
        productKey="wpi-class4-wastewater"
        productName="WPI Class IV Wastewater Practice Pass"
        price={499}
      >
        <FlashcardShell
          questions={wpiClass4WastewaterQuestions as unknown as FlashcardQuestion[]}
          examName="WPI Class IV Wastewater"
          examType="wpi-class4-wastewater"
          backPath="/wpi-class4-wastewater"
          modules={WPI_CLASS4_WASTEWATER_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
