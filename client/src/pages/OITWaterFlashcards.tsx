import FlashcardShell, { type FlashcardQuestion } from "@/components/FlashcardShell";
import { QUESTIONS, OIT_MODULES } from "@/lib/questions";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
export default function OITWaterFlashcards() {
  return (
    <FlashcardErrorBoundary examName="Ontario OIT Water" backPath="/quiz">
      <FlashcardShell
        questions={QUESTIONS as unknown as FlashcardQuestion[]}
        examName="Ontario OIT Water"
        examType="oit"
        backPath="/quiz"
        modules={OIT_MODULES as unknown as string[]}
        freeFlipLimit={10}
        productKey="oit"
      />
    </FlashcardErrorBoundary>
  );
}
