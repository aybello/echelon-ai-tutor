import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { wpiClass3WastewaterQuestions as RAW } from "@/lib/wpiClass3WastewaterQuestions";

const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correctAnswer ?? q.correct ?? 0,
  explanation: q.explanation,
}));

const MODULE_TARGETS: Record<string, number> = {
  "Advanced Biological Treatment":         17,
  "Biological Nutrient Removal":           17,
  "Membrane Bioreactors & Advanced Processes": 6,
  "Industrial Pretreatment & Toxicity":    11,
  "Advanced Biosolids Management":         17,
  "Regulatory Compliance & Reporting":     10,
  "Advanced Process Control & Troubleshooting": 6,
  "Health, Safety & Environmental Management": 16,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Advanced Biological Treatment":         { bg: "#DBEAFE", color: "#1D4ED8" },
  "Biological Nutrient Removal":           { bg: "#DCFCE7", color: "#15803D" },
  "Membrane Bioreactors & Advanced Processes": { bg: "#EDE9FE", color: "#6D28D9" },
  "Industrial Pretreatment & Toxicity":    { bg: "#FEE2E2", color: "#B91C1C" },
  "Advanced Biosolids Management":         { bg: "#CCFBF1", color: "#0F766E" },
  "Regulatory Compliance & Reporting":     { bg: "#FEF9C3", color: "#A16207" },
  "Advanced Process Control & Troubleshooting": { bg: "#FFEDD5", color: "#C2410C" },
  "Health, Safety & Environmental Management": { bg: "#F1F5F9", color: "#475569" },
};

export default function WpiClass3WastewaterMockExam() {
  return (
    <MockExamShell
      title="WPI Class III Wastewater Treatment Mock Exam"
      badge="WPI CLASS III · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the WPI Class III Wastewater Treatment certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 3 wastewater mock exam, BC EOCP Level III wastewater, Alberta AWWOA Class III"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class3-wastewater"
      productName="WPI Class III Wastewater Practice Pass"
      price={99}
      backPath="/wpi"
      practicePath="/wpi-class3-wastewater"
      practiceLabel="Class III Wastewater Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class3-wastewater-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level III) · Alberta (AWWOA Class III) · SK · MB`}
      stream="wastewater"
      accentColor="#0F766E"
    />
  );
}
