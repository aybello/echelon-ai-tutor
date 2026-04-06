import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { wpiClass4WastewaterQuestions as RAW } from "@/lib/wpiClass4WastewaterQuestions";

const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correctAnswer ?? q.correct ?? 0,
  explanation: q.explanation,
}));

const MODULE_TARGETS: Record<string, number> = {
  "Advanced Process Control & Optimization":           20,
  "Advanced Nutrient Removal & Resource Recovery":     18,
  "Emerging Technologies & Innovation":                12,
  "Plant Management, Asset Management & Leadership":   15,
  "Regulatory Compliance, Reporting & Environmental Management": 15,
  "Emergency Response & Resilience Planning":          12,
  "Health, Safety & Environmental Stewardship":         8,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Advanced Process Control & Optimization":           { bg: "#DBEAFE", color: "#1D4ED8" },
  "Advanced Nutrient Removal & Resource Recovery":     { bg: "#DCFCE7", color: "#15803D" },
  "Emerging Technologies & Innovation":                { bg: "#EDE9FE", color: "#6D28D9" },
  "Plant Management, Asset Management & Leadership":   { bg: "#FEE2E2", color: "#B91C1C" },
  "Regulatory Compliance, Reporting & Environmental Management": { bg: "#FEF9C3", color: "#A16207" },
  "Emergency Response & Resilience Planning":          { bg: "#FFEDD5", color: "#C2410C" },
  "Health, Safety & Environmental Stewardship":        { bg: "#F1F5F9", color: "#475569" },
};

export default function WpiClass4WastewaterMockExam() {
  return (
    <MockExamShell
      title="WPI Class IV Wastewater Treatment Mock Exam"
      badge="WPI CLASS IV · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the WPI Class IV Wastewater Treatment certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 4 wastewater mock exam, BC EOCP Level IV wastewater, Alberta AWWOA Class IV"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class4-wastewater"
      productName="WPI Class IV Wastewater Practice Pass"
      price={149}
      backPath="/wpi"
      practicePath="/wpi-class4-wastewater"
      practiceLabel="Class IV Wastewater Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class4-wastewater-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level IV) · Alberta (AWWOA Class IV) · SK · MB`}
      stream="wastewater"
      accentColor="#0F766E"
    />
  );
}
