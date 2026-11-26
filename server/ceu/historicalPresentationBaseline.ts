/** Test-only projection for the separately reviewed 2026-11-25 CEU diagrams.
 * Only these exact authored additions can be removed. Any edit to an addition
 * or to the pre-existing source still fails the original historical digest.
 */
export function historicalCeuPresentationSource(path: string, source: string): string {
  let additions: string[];
  if (path === "client/src/pages/ContinuingEducationCourse.tsx") {
    additions = [
      'import CeuLearningDiagram from "@/components/CeuLearningDiagram";\n',
      'import { ceuDiagramSlideId } from "@shared/ceuDiagrams";\n',
      '  const diagramSlideId = useMemo(\n    () => (activeModule ? ceuDiagramSlideId(activeModule, slides) : ""),\n    [activeModule, slides]\n  );\n',
      '              {activeSlide.id === diagramSlideId && <CeuLearningDiagram module={activeModule} />}\n',
    ];
  } else if (path === "client/src/pages/ContinuingEducationCourse.css") {
    additions = [`

.ceu-learning-diagram { margin: 28px 0 32px; padding: 20px 20px 16px; border: 1px solid #d7e3ee; border-radius: 13px; background: linear-gradient(135deg, #f8fbfe 0%, #eef6fb 100%); }
.ceu-learning-diagram-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 5px; }
.ceu-learning-diagram-heading h2 { margin: 0; color: #14283d; font-size: 18px; letter-spacing: -.02em; }
.ceu-diagram-eyebrow { display: block; margin-bottom: 4px; color: var(--ceu-blue); font-size: 10px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
.ceu-diagram-legend { display: inline-flex; align-items: center; gap: 7px; color: #526579; font-size: 11px; font-weight: 750; white-space: nowrap; }
.ceu-diagram-legend i { width: 9px; height: 9px; border-radius: 50%; }
.ceu-learning-diagram-svg { display: block; width: 100%; height: auto; margin-top: 5px; }
.ceu-learning-diagram figcaption { margin-top: 2px; color: #526579; font-size: 12px; line-height: 1.45; }
.ceu-learning-diagram-treatment { border-color: #b7ddd7; }
.ceu-learning-diagram-safety { border-color: #ead7aa; }
.ceu-learning-diagram-calculation { border-color: #f0c8b0; }
@media (max-width: 680px) {
  .ceu-learning-diagram { margin: 22px 0 27px; padding: 15px 12px 13px; overflow: hidden; }
  .ceu-learning-diagram-heading { display: block; }
  .ceu-diagram-legend { margin-top: 8px; }
  .ceu-learning-diagram-svg { width: 100%; max-width: 100%; }
}
`];
  } else {
    return source;
  }
  for (const addition of additions) {
    if (source.split(addition).length !== 2) throw new Error("Historical CEU projection requires the exact reviewed diagram addition");
    source = source.replace(addition, "");
  }
  return source;
}
