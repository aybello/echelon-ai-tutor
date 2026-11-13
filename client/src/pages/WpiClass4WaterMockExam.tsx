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

export default function WpiClass4WaterMockExam() {
  usePageMeta({
    title: "WPI Class 4 Water Treatment Mock Exam",
    description: "Mock Exam for WPI Class 4 Water Treatment operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
    noindex: true
  });

  const { moduleTargets: dbModuleTargets, totalQuestions, isLoading: bankLoading, dbUnavailable } = useMockExamMetadata("wpi-class4-water");
  

  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <MockExamShell
      title="WPI Class IV Water Treatment Mock Exam"
      badge="WPI CLASS IV · WATER TREATMENT"
      metaDescription="100-question timed mock exam for the WPI Class IV Water Treatment certification. 3-hour timer, 70% pass threshold."
      metaKeywords="WPI Class IV water treatment mock exam, ABC WPI exam prep, BC EOCP Level IV, Alberta AWWOA Class IV, US water operator exam"
      examQuestions={100}
      examDuration={3 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      productKey="wpi-class4-water"
      productName="WPI Class IV Water Treatment Practice Pass"
      price={299}
      backPath="/wpi"
      practicePath="/wpi-class4-water"
      practiceLabel="Class IV Water Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class4-water-mock"
      infoLine={`${totalQuestions} questions · Canada & US · ABC/WPI Standard · Class IV`}
      stream="water"
      accentColor="#0F766E"
    />
  );
}
