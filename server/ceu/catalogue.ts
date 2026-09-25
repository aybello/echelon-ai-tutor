import c0 from "./courses/ceu-activated-sludge-troubleshooting.json";
import c1 from "./courses/ceu-coagulation-filtration.json";
import c2 from "./courses/ceu-collection-wet-weather.json";
import c3 from "./courses/ceu-disinfection-ct.json";
import c4 from "./courses/ceu-distribution-water-quality.json";
import c5 from "./courses/ceu-drinking-water-compliance.json";
import c6 from "./courses/ceu-instrumentation-scada.json";
import c7 from "./courses/ceu-sampling-data-quality.json";
import c8 from "./courses/ceu-wastewater-treatment-process-control.json";
import c9 from "./courses/ceu-water-treatment-process-control.json";
import type { CeuCurriculum } from "../../shared/ceuLearning";
export const ceuCurricula = [
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
  const { finalAssessment, ...publicFields } = course;
  return {
    ...publicFields,
    modules: course.modules.map(
      ({ facilitatorGuide, assignment, rubric, checks, ...lesson }) => ({
        ...lesson,
        checks: checks.map(({ correctIndex, explanation, ...q }) => q),
      })
    ),
    finalQuestionCount: finalAssessment.length,
  };
}
