import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { wpiClass2WastewaterQuestions, WPI_CLASS2_WASTEWATER_MODULES } from "@/lib/wpiClass2WastewaterQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function WpiClass2WastewaterFlashcards() {
  return (
    <FlashcardErrorBoundary examName="WPI Class II Wastewater" backPath="/wpi-class2-wastewater">
      <PurchaseGate
        examType="wpi-class2-wastewater"
        productKey="wpi-class2-wastewater"
        productName="WPI Class II Wastewater Treatment Practice Pass"
        price={199}
      >
        <FlashcardShell
          questions={wpiClass2WastewaterQuestions as unknown as FlashcardQuestion[]}
          examName="WPI Class II Wastewater"
          examType="wpi-class2-wastewater"
          backPath="/wpi-class2-wastewater"
          modules={WPI_CLASS2_WASTEWATER_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
