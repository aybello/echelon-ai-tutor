import FlashcardShell from "@/components/FlashcardShell";
import FlashcardErrorBoundary from "@/components/FlashcardErrorBoundary";
import QuizSkeleton from "@/components/QuizSkeleton";
import { useElectrician309ABank } from "@/hooks/useElectrician309ABank";

export default function Electrician309AFlashcards() {
  const bank = useElectrician309ABank();
  if (bank.isLoading) return <QuizSkeleton />;
  if (bank.dbUnavailable) return <QuizSkeleton dbUnavailable />;
  return <FlashcardErrorBoundary>
    <FlashcardShell
      questions={bank.questions.map((question) => ({ ...question, difficulty: question.difficulty ?? undefined }))}
      examName="Ontario 309A Construction Electrician"
      examType="electrician-309a"
      backPath="/electrician-309a"
      modules={bank.modules}
    />
  </FlashcardErrorBoundary>;
}
