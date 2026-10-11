import FlashcardShell from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import { usePageMeta } from "@/hooks/usePageMeta";

/** Not registered publicly until Texas content and commerce are governed live. */
export default function UsTexasClassDFlashcards() {
  usePageMeta({
    title: "Texas Class D Water Flashcards | Echelon Institute",
    description: "Original Texas Class D Water flashcards based on the public TCEQ operator topic scope.",
    noindex: true,
  });

  // This dormant surface intentionally makes no question-bank request. When the
  // course is activated, its access-controlled flashcard delivery will be wired
  // in the same release as its public route and product configuration.
  return (
    <FlashcardErrorBoundary examName="Texas Class D Water" backPath="/us-texas-class-d-water">
      <FlashcardShell
        questions={[]}
        examName="Texas Class D Water"
        examType="us-texas-class-d-water"
        backPath="/us-texas-class-d-water"
        modules={[]}
      />
    </FlashcardErrorBoundary>
  );
}
