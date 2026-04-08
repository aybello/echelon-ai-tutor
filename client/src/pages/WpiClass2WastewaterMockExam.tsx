import MockExamShell, { type ExamQuestion } from "@/components/MockExamShell";
import { WPI_CLASS2_WASTEWATER_QUESTIONS as RAW } from "@/lib/wpiClass2WastewaterQuestions";

const POOL: ExamQuestion[] = (RAW as any[]).map(q => ({
  id: q.id, module: q.module,
  question: q.question ?? q.text ?? "",
  options: q.options,
  correct: q.correctAnswer ?? q.correct ?? 0,
  explanation: q.explanation,
}));

const MODULE_TARGETS: Record<string, number> = {
  "Nutrient Removal":                          27,
  "Biosolids Management":                      22,
  "Secondary Treatment Processes":             19,
  "Advanced Treatment & Effluent Quality":     16,
  "Safety, Regulations & Administration":      16,
};

const MODULE_COLORS: Record<string, { bg: string; color: string }> = {
  "Nutrient Removal":                          { bg: "#DCFCE7", color: "#15803D" },
  "Biosolids Management":                      { bg: "#EDE9FE", color: "#6D28D9" },
  "Secondary Treatment Processes":             { bg: "#CCFBF1", color: "#0F766E" },
  "Advanced Treatment & Effluent Quality":     { bg: "#DBEAFE", color: "#1D4ED8" },
  "Safety, Regulations & Administration":      { bg: "#FFEDD5", color: "#C2410C" },
};

export default function WpiClass2WastewaterMockExam() {
  return (
    <MockExamShell
      title="WPI Class II Wastewater Treatment Mock Exam"
      badge="WPI CLASS II · WASTEWATER TREATMENT"
      metaDescription="100-question timed mock exam for the WPI Class II Wastewater Treatment certification. 2-hour timer, 70% pass threshold."
      metaKeywords="WPI Class 2 wastewater mock exam, BC EOCP Level II wastewater, Alberta AWWOA Class II"
      examQuestions={100}
      examDuration={2 * 60 * 60}
      passThreshold={0.7}
      moduleTargets={MODULE_TARGETS}
      moduleColors={MODULE_COLORS}
      questionPool={POOL}
      productKey="wpi-class2-wastewater"
      productName="WPI Class II Wastewater Treatment Practice Pass"
      price={149}
      backPath="/wpi"
      practicePath="/wpi-class2-wastewater"
      practiceLabel="Class II Wastewater Practice"
      showProvinceSelector={false}
      currentPath="/wpi-class2-wastewater-mock"
      infoLine={`${POOL.length} questions · BC (EOCP Level II) · Alberta (AWWOA Class II) · SK · MB`}
      stream="wastewater"
      accentColor="#0F766E"
    />
  );
}
