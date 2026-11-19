import new0 from "./courses/ceu-chlorination-principles.json" with { type: "json" };
import new1 from "./courses/ceu-basic-instrumentation.json" with { type: "json" };
import new2 from "./courses/ceu-water-distribution-overview.json" with { type: "json" };
import new3 from "./courses/ceu-supervisor-essentials.json" with { type: "json" };
import c0 from "./courses/ceu-activated-sludge-troubleshooting.json" with { type: "json" };
import c1 from "./courses/ceu-coagulation-filtration.json" with { type: "json" };
import c2 from "./courses/ceu-collection-wet-weather.json" with { type: "json" };
import c3 from "./courses/ceu-disinfection-ct.json" with { type: "json" };
import c4 from "./courses/ceu-distribution-water-quality.json" with { type: "json" };
import c5 from "./courses/ceu-drinking-water-compliance.json" with { type: "json" };
import c6 from "./courses/ceu-instrumentation-scada.json" with { type: "json" };
import c7 from "./courses/ceu-sampling-data-quality.json" with { type: "json" };
import c8 from "./courses/ceu-wastewater-treatment-process-control.json" with { type: "json" };
import c9 from "./courses/ceu-water-treatment-process-control.json" with { type: "json" };
import type { CeuCurriculum } from "../../shared/ceuLearning";
import safety from "./courses/ceu-basic-safety.json" with { type: "json" };
import hydraulics from "./courses/ceu-basic-hydraulics.json" with { type: "json" };
import math from "./courses/ceu-basic-math.json" with { type: "json" };
import waterConcepts from "./courses/ceu-water-treatment-concepts.json" with { type: "json" };
import wastewaterConcepts from "./courses/ceu-wastewater-treatment-concepts.json" with { type: "json" };
export const ceuCurricula = [
  safety, hydraulics, math, waterConcepts, wastewaterConcepts, new0, new1, new2, new3,
  c0,
  c1,
  c2,
  c3,
  c4,
  c5,
  c6,
  c7,
  c8,
  c9,
] as CeuCurriculum[];
export function ceuCourse(key: string) {
  return ceuCurricula.find(c => c.key === key);
}
/** Only this representation may cross the public course endpoint. */
export function publicCeuCourse(course: CeuCurriculum) {
  const { finalAssessment, alternateFinalAssessment, plannedMinutes, ...publicFields } = course;
  return {
    ...publicFields,
    delivery: "Self-paced lessons, optional quick checks, a graded final exam and a non-credit certificate. Duration is being validated; no contact-hour award is made.",
    modules: course.modules.map(
      ({ facilitatorGuide, assignment, rubric, activities, checks, ...lesson }) => ({
        ...lesson,
        checks: checks.map(({ correctIndex, explanation, ...q }) => q),
      })
    ),
    finalQuestionCount: finalAssessment.length,
  };
}
