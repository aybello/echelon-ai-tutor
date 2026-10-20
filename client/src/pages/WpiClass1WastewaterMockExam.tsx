import MockExamShell from "@/components/MockExamShell";
import { useMockExamMetadata } from "@/hooks/useQuestionBank";
import QuizSkeleton from "@/components/QuizSkeleton";
import { usePageMeta } from "@/hooks/usePageMeta";



const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Equipment Evaluation, Maintenance & Operation": { bg: "#DBEAFE", color: "#1D4ED8" },
  "Treatment Process Evaluation & Adjustment":     { bg: "#DCFCE7", color: "#15803D" },
  "Laboratory Analysis":                           { bg: "#EDE9FE", color: "#6D28D9" },
  "Safety & Admin":                                { bg: "#FEE2E2", color: "#B91C1C" },
};

export default function WpiClass1WastewaterMockExam() {
  usePageMeta({
    title: "WPI Class 1 Wastewater Treatment Mock Exam",
    description: "Mock Exam for WPI Class 1 Wastewater Treatment operator certification exam. Practice with hundreds of questions aligned to Canadian provincial standards.",
    noindex: true
  });

  const { moduleTargets: dbModuleTargets, totalQuestions, isLoading: bankLoading, dbUnavailable } = useMockExamMetadata("wpi-class1-wastewater");
  

  if (bankLoading) return <QuizSkeleton />;
  if (dbUnavailable) return <QuizSkeleton dbUnavailable />;

  return (
    <MockExamShell
      title="WPI Class I Wastewater Treatment Mock Exam"
      badge="WPI CLASS I · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the WPI Class I Wastewater Treatment certification. 3-hour timer, 70% pass threshold."
      metaKeywords="WPI Class I wastewater treatment mock exam, ABC WPI exam prep, BC EOCP Level I, Alberta AWWOA Class I, US wastewater operator exam"
      examQuestions={100}
      examDuration={3 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={dbModuleTargets ?? {}}
      moduleColors={MODULE_COLORS}
      productKey="wpi-class1-wastewater"
      productName="WPI Class I Wastewater Treatment Practice Pass"
      price={99}
      backPath="/wpi"
      practicePath="/wpi-class1-wastewater"
      practiceLabel="Class I Wastewater Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class1-wastewater-mock"
      infoLine={`${totalQuestions} questions · Canada & US · ABC/WPI Standard · Class I`}
      stream="wastewater"
      accentColor="#0F766E"
    />
  );
}
