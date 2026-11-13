import React, { type ReactNode } from "react";

interface PracticeQuestionStatusProps {
  status: "loading" | "error" | "empty";
  error?: string;
  answerCount: number;
  modules: readonly { name: string }[];
  selectedModule: string | null;
  calcOnly: boolean;
  hasCalcOnly: boolean;
  onModuleChange: (module: string | null) => void;
  onCalcOnlyToggle: () => void;
  onRetry?: () => void;
  onRestart: () => void;
  children?: ReactNode;
}

const buttonStyle = "rounded-lg border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

/** Keep filter recovery available even when there is no question to render. */
export default function PracticeQuestionStatus({
  status, error, answerCount, modules, selectedModule, calcOnly, hasCalcOnly,
  onModuleChange, onCalcOnlyToggle, onRetry, onRestart, children,
}: PracticeQuestionStatusProps) {
  const filterStyle = (active: boolean) => `${buttonStyle} ${active
    ? "border-blue-700 bg-blue-700 text-white"
    : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"}`;

  return <>
    <section className="my-6 rounded-xl border border-slate-200 bg-white p-5 text-slate-900">
      <p role={status === "error" ? "alert" : "status"} className="font-semibold">
        {status === "loading" ? "Loading practice questions…" : status === "error"
          ? error || "Questions could not be loaded. Please try again."
          : "No questions are available for this practice selection."}
      </p>
      {status === "error" && onRetry && <button type="button" onClick={onRetry}
        className={`${buttonStyle} mt-4 border-blue-700 bg-blue-700 text-white`}>Retry loading questions</button>}
      {status === "empty" && <>
        {answerCount > 0 && <p className="mt-3 text-sm">
          Your {answerCount} {answerCount === 1 ? "answer remains" : "answers remain"} in this session.
        </p>}
        <p className="mt-3 text-sm text-slate-600">
          Choose another module{hasCalcOnly && calcOnly ? ", turn off Calc Only," : ""} or adjust your practice mode and difficulty below.
          {" "}Restarting keeps your current filters.
        </p>
        <button type="button" onClick={onRestart} className={`${buttonStyle} mt-4 border-slate-300 bg-white text-slate-800 hover:bg-slate-100`}>
          Restart this selection
        </button>
      </>}
    </section>
    <p className="mb-3 text-sm text-slate-700">Selected module: {selectedModule ?? "All modules"}</p>
    <div role="group" aria-label="Filter questions by module" className="mb-5 flex flex-wrap gap-2">
      <button type="button" aria-pressed={selectedModule === null} onClick={() => onModuleChange(null)} className={filterStyle(selectedModule === null)}>All modules</button>
      {modules.map(module => <button type="button" key={module.name} aria-pressed={selectedModule === module.name}
        onClick={() => onModuleChange(module.name)} className={filterStyle(selectedModule === module.name)}>{module.name}</button>)}
      {hasCalcOnly && <button type="button" aria-pressed={calcOnly} onClick={onCalcOnlyToggle} className={filterStyle(calcOnly)}>
        {calcOnly ? "Turn off Calc Only" : "Calc Only"}
      </button>}
    </div>
    {/* These controls are also used in the dark quiz header and have white text. */}
    {children && <section aria-label="Practice mode and settings" className="rounded-xl p-4 text-white" style={{ backgroundColor: "#0F172A" }}>{children}</section>}
  </>;
}
