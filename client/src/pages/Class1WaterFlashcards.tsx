import PurchaseGate from "@/components/PurchaseGate";
import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { CLASS1_WATER_QUESTIONS, CLASS1_WATER_MODULES } from "@/lib/class1WaterQuestions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";


export default function Class1WaterFlashcards() {
  return (
    <FlashcardErrorBoundary examName="Ontario Class 1 Water" backPath="/class1-water">
      <PurchaseGate
        examType="class1-water"
        productKey="class1-water"
        productName="Class 1 Water Treatment Practice Pass"
        price={99}
      >
        <FlashcardShell
          questions={CLASS1_WATER_QUESTIONS as unknown as FlashcardQuestion[]}
          examName="Ontario Class 1 Water"
          examType="class1-water"
          backPath="/class1-water"
          modules={CLASS1_WATER_MODULES as unknown as string[]}
        />
      </PurchaseGate>
    </FlashcardErrorBoundary>

  );
}
