import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { QUESTIONS as CLASS2_WATER_QUESTIONS, MODULES as CLASS2_WATER_MODULES } from "@/lib/class2WaterQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function Class2WaterFlashcards() {
  return (
    <FlashcardErrorBoundary examName="Ontario Class 2 Water" backPath="/class2-water">
      <PurchaseGate
        examType="class2-water"
        productKey="class2-water"
        productName="Class 2 Water Treatment Practice Pass"
        price={199}
      >
        <FlashcardShell
          questions={CLASS2_WATER_QUESTIONS as unknown as FlashcardQuestion[]}
          examName="Ontario Class 2 Water"
          examType="class2-water"
          backPath="/class2-water"
          modules={CLASS2_WATER_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
