// OIT MOCK EXAM — migrated onto MockExamShell (2025-06)
// 100 questions · 3-hour timer · 70% pass threshold
// productKey="oit" (Stripe gate + saved examType)
import MockExamShell from "@/components/MockExamShell";
import { useMockExamMetadata } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { Link } from "wouter";

const MODULE_TARGETS: Record<string, number> = {
  "Disinfection": 11,
  "Chemical Feed & Storage": 12,
  "Hydraulics": 10,
  "Math & Calculations": 11,
  "Ontario Regulations": 11,
  "Pumping Systems": 11,
  "Water Treatment": 11,
  "Wastewater Treatment": 5,
  "Water Quality & Sampling": 11,
  "Health & Safety": 7,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Disinfection":             { bg: "#DBEAFE", color: "#1D4ED8" },
  "Chemical Feed & Storage":  { bg: "#FEF9C3", color: "#A16207" },
  "Hydraulics":               { bg: "#DCFCE7", color: "#15803D" },
  "Math & Calculations":      { bg: "#FFEDD5", color: "#C2410C" },
  "Ontario Regulations":      { bg: "#EDE9FE", color: "#6D28D9" },
  "Pumping Systems":          { bg: "#CCFBF1", color: "#0F766E" },
  "Water Treatment":          { bg: "#DBEAFE", color: "#0369A1" },
  "Wastewater Treatment":     { bg: "#ECFDF5", color: "#065F46" },
  "Water Quality & Sampling": { bg: "#FEF9C3", color: "#A16207" },
  "Health & Safety":          { bg: "#FEE2E2", color: "#B91C1C" },
};

export default function OITMockExam() {
  const { totalQuestions, isLoading, dbUnavailable } = useMockExamMetadata("oit");

  if (isLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <>
    <nav aria-label="OIT mock exam streams" className="bg-slate-50 px-5 py-3 text-center text-sm">
      <Link href="/oit-ww-mock" className="font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900">
        Looking for Ontario OIT Wastewater? Open the separate Wastewater mock exam.
      </Link>
    </nav>
    <MockExamShell
      title="Ontario OIT Water Mock Exam"
      badge="ONTARIO OPERATOR-IN-TRAINING · WATER"
      metaDescription="100-question timed mock exam for Ontario Operator-in-Training (OIT) Water preparation. 3-hour timer, 70% pass threshold, and full module breakdown on results."
      metaKeywords="Ontario OIT Water mock exam, Ontario operator in training exam, water operator practice test, OWWCO OIT, MECP OIT, timed exam prep"
      examQuestions={100}
      examDuration={3 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      productKey="oit"
      productName="OIT Water Practice Pass"
      price={49}
      freeQuestionLimit={30}
      features={[
        `${totalQuestions.toLocaleString()} OIT Water questions — unlimited attempts`,
        "Complete 100-question timed mock exams",
        "Full flashcard deck and saved progress",
        "Module-by-module performance tracking",
      ]}
      backPath="/oit-mock"
      practicePath="/quiz"
      practiceLabel="OIT Water Practice Mode"
      showProvinceSelector={false}
      currentPath="/oit-mock"
      infoLine={`${totalQuestions} questions · Ontario OIT Water`}
    />
    </>
  );
}
