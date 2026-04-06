import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { WPI_CLASS1_WASTEWATER_QUESTIONS, WPI_CLASS1_WASTEWATER_MODULES } from "@/lib/wpiClass1WastewaterQuestions";

export default function WpiClass1WastewaterFlashcards() {
  return (
    <PurchaseGate
      examType="wpi-class1-wastewater"
      productKey="wpi-class1-wastewater"
      productName="WPI Class I Wastewater Treatment Practice Pass"
      price={149}
    >
      <FlashcardShell
        questions={WPI_CLASS1_WASTEWATER_QUESTIONS as unknown as FlashcardQuestion[]}
        examName="WPI Class I Wastewater"
        examType="wpi-class1-wastewater"
        backPath="/wpi-class1-wastewater"
        modules={WPI_CLASS1_WASTEWATER_MODULES as unknown as string[]}
      />
    </PurchaseGate>
  );
}
