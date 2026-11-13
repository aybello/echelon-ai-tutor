import MockExamShell from "@/components/MockExamShell";
import { useMockExamMetadata } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";



const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Treatment Process":    { bg: "#DBEAFE", color: "#1D4ED8" },
  "Laboratory Analysis":  { bg: "#EDE9FE", color: "#6D28D9" },
  "Equipment O&M":        { bg: "#DCFCE7", color: "#15803D" },
  "Source Water":         { bg: "#CCFBF1", color: "#0F766E" },
  "Safety & Admin":       { bg: "#FFEDD5", color: "#C2410C" },
};

export default function Class4WaterMockExam() {
  usePageMeta({
    title: "Class 4 Water Treatment Mock Exam",
    description: "Mock Exam for Ontario OWWCO Class 4 Water Treatment operator certification exam. AI-powered exam prep with detailed explanations.",
    noindex: true
  });

  const { moduleTargets: dbModuleTargets, totalQuestions, isLoading: bankLoading, dbUnavailable } = useMockExamMetadata("class4-water");
  

  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <MockExamShell
      title="Class 4 Water Treatment Mock Exam"
      badge="ONTARIO CLASS IV · WATER TREATMENT"
      metaDescription="100-question timed mock exam for the Ontario Class 4 Water Treatment operator certification. 3-hour timer, 70% pass threshold."
      metaKeywords="Class 4 water treatment mock exam, Ontario operator exam, OWWCO Class 4"
      examQuestions={100}
      examDuration={3 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      productKey="class4-water"
      productName="Class 4 Water Treatment Practice Pass"
      price={299}
      backPath="/class4-water"
      practicePath="/class4-water"
      practiceLabel="Class 4 Water Practice"
      showProvinceSelector={true}
      currentPath="/class4-water-mock"
      infoLine={`${totalQuestions} questions · Ontario (MECP) · BC (EOCP Level IV) · Alberta (AWWOA Class IV)`}
      stream="water"
    />
  );
}
