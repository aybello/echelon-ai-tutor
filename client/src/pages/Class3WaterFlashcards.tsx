import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { QUESTIONS as CLASS3_WATER_QUESTIONS, MODULES as CLASS3_WATER_MODULES } from "@/lib/class3WaterQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function Class3WaterFlashcards() {
  return (
    <FlashcardErrorBoundary examName="Ontario Class 3 Water" backPath="/class3-water">
      <PurchaseGate
        examType="class3-water"
        productKey="class3-water"
        productName="Class 3 Water Treatment Practice Pass"
        price={349}
      >
        <FlashcardShell
          questions={CLASS3_WATER_QUESTIONS as unknown as FlashcardQuestion[]}
          examName="Ontario Class 3 Water"
          examType="class3-water"
          backPath="/class3-water"
          modules={CLASS3_WATER_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
