import { useId, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import type { ModuleConfig } from "@/components/QuizShell";

export default function PracticeOptions({ modules, selectedModule, onModuleChange, hasCalcOnly, calcOnly, onCalcOnlyToggle, children }: {
  modules: ModuleConfig[]; selectedModule: string | null; onModuleChange: (value: string | null) => void;
  hasCalcOnly: boolean; calcOnly: boolean; onCalcOnlyToggle: () => void; children?: ReactNode;
}) {
  const id = useId();
  return <details className="practice-options">
    <summary><SlidersHorizontal size={16} /><strong>Practice options</strong><span>{selectedModule ?? "All modules"}{calcOnly ? " · Calculations only" : ""}</span><ChevronDown size={16} /></summary>
    <div className="practice-options-body">
      {modules.length > 0 && <label htmlFor={id}>Module<select id={id} value={selectedModule ?? ""} onChange={event => onModuleChange(event.target.value || null)}>
        <option value="">All modules</option>{modules.map(module => <option key={module.name} value={module.name}>{module.name}</option>)}
      </select></label>}
      {hasCalcOnly && <label className="practice-calculations"><input type="checkbox" checked={calcOnly} onChange={onCalcOnlyToggle} /> Calculations only</label>}
      {children && <div className="practice-session-options">{children}</div>}
    </div>
  </details>;
}
