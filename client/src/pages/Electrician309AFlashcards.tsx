import { useMemo } from "react";
import FlashcardShell from "@/components/FlashcardShell";
import type { FlashcardQuestion } from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import QuizSkeleton from "@/components/QuizSkeleton";
import {
  ELECTRICIAN_309A_DIAGRAMS,
  Electrician309ADiagram,
  type Electrician309ADiagramId,
} from "@/components/electrician309a/Electrician309ADiagrams";
import { useElectrician309ABank } from "@/hooks/useElectrician309ABank";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  buildElectrician309AFlashcard,
  selectElectrician309AFlashcards,
} from "@/lib/electrician309aFlashcards";

function renderElectrician309AFlashcardDiagram(card: FlashcardQuestion) {
  const diagramId = card.diagramId;
  if (!diagramId || !(diagramId in ELECTRICIAN_309A_DIAGRAMS)) return null;
  return <Electrician309ADiagram id={diagramId as Electrician309ADiagramId} />;
}

export default function Electrician309AFlashcards() {
  usePageMeta({
    title: "Ontario 309A Electrician Flashcards",
    description: "Study Ontario 309A Construction Electrician concepts with explanation-backed flashcards organized by the current exam blueprint.",
    path: "/electrician-309a-flashcards",
  });
  const bank = useElectrician309ABank();
  const flashcards = useMemo(
    () => selectElectrician309AFlashcards(bank.questions),
    [bank.questions],
  );
  if (bank.isLoading) return <QuizSkeleton />;
  if (bank.dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return <FlashcardErrorBoundary>
    <FlashcardShell
      questions={flashcards.map((question) => ({ ...question, difficulty: question.difficulty ?? undefined }))}
      examName="Ontario 309A Construction Electrician"
      examType="electrician-309a"
      backPath="/electrician-309a"
      modules={bank.modules}
      cardContent={buildElectrician309AFlashcard}
      renderFrontSupplement={renderElectrician309AFlashcardDiagram}
    />
  </FlashcardErrorBoundary>;
}
