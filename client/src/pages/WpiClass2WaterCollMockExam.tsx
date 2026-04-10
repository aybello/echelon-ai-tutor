import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { wpiClass2WastewaterCollQuestions as RAW } from "@/lib/wpiClass2WastewaterCollQuestions";
const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correctAnswer ?? q.correct ?? 0,
  explanation: q.explanation,
}));
// WPI Class II Wastewater Collection exam blueprint: 100 questions
const MODULE_TARGETS: Record<string, number> = {
  "Advanced Collection System Design":   25,
  "Intermediate Lift Station Operations": 25,
  "System Maintenance & Rehabilitation": 20,
  "Hydraulics & Flow Analysis":          20,
  "Regulatory Compliance & Reporting":   10,
};
const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Advanced Collection System Design":   { bg: "#DBEAFE", color: "#1D4ED8" },
  "Intermediate Lift Station Operations": { bg: "#EDE9FE", color: "#6D28D9" },
  "System Maintenance & Rehabilitation": { bg: "#DCFCE7", color: "#15803D" },
  "Hydraulics & Flow Analysis":          { bg: "#CCFBF1", color: "#0F766E" },
  "Regulatory Compliance & Reporting":   { bg: "#FFEDD5", color: "#C2410C" },
};
export default function WpiClass2WaterCollMockExam() {
  return (
    <MockExamShell
      title="WPI Class II Wastewater Collection Mock Exam"
      badge="WPI CLASS II · WASTEWATER COLLECTION"
      metaDescription="100-question timed mock exam for the WPI Class II Wastewater Collection certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 2 wastewater collection mock exam, BC EOCP, Alberta AWWOA Class II collection"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class2-water-coll"
      productName="WPI Class II Wastewater Collection Practice Pass"
      price={149}
      backPath="/wpi"
      practicePath="/wpi-class2-water-coll"
      practiceLabel="Class II Collection Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class2-water-coll-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level II) · Alberta (AWWOA Class II) · SK · MB`}
      stream="wastewater"
      accentColor="#1E3A5F"
    />
  );
}
