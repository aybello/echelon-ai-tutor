import React, { type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
const hooks = vi.hoisted(() => ({ cursor: 0, state: [] as unknown[], options: {} as any, pending: false, email: null as string | null, mutate: vi.fn(), handled: vi.fn() }));
vi.mock("react", async original => ({ ...await original<typeof import("react")>(), useId: () => "suggestion", useEffect: () => {}, useState(initial: unknown) { const i = hooks.cursor++; if (!(i in hooks.state)) hooks.state[i] = initial; return [hooks.state[i], (next: unknown) => { hooks.state[i] = typeof next === "function" ? next(hooks.state[i]) : next; }]; } }));
vi.mock("@/lib/trpc", () => ({ trpc: { dashboardAuth: { me: { useQuery: () => ({ data: { email: hooks.email } }) } }, auth: { me: { useQuery: () => ({ data: null }) } }, featureRequests: { submit: { useMutation: (options: any) => { hooks.options = options; return { mutate: hooks.mutate, isPending: hooks.pending }; } } } } }));
vi.mock("@/lib/featureSuggestionPrompt", () => ({ canInviteSuggestion: () => true, markSuggestionHandled: hooks.handled }));
import { FeatureSuggestionModal, SuggestionButton } from "./FeatureSuggestion";
type Element = ReactElement<Record<string, any>>;
function elements(node: ReactNode): Element[] { if (Array.isArray(node)) return node.flatMap(elements); return React.isValidElement<Record<string, any>>(node) ? [node, ...elements(node.props.children)] : []; }
function text(node: ReactNode): string { if (Array.isArray(node)) return node.map(text).join(""); if (React.isValidElement<Record<string, any>>(node)) return text(node.props.children); return typeof node === "string" || typeof node === "number" ? String(node) : ""; }
function view() {
  const props = { courseKey: "oit", source: "quick10" as const, onClose: vi.fn(), onSubmitted: vi.fn() };
  let tree: ReactNode;
  const render = () => { hooks.cursor = 0; tree = FeatureSuggestionModal(props); };
  const find = (test: (e: Element) => boolean) => { const el = elements(tree).find(test); if (!el) throw Error("Missing element"); return el; };
  render();
  return { props, render, find, content: () => text(tree), fill(value: string) { find(e => e.type === "textarea" && e.props.required).props.onChange({ target: { value } }); render(); }, submit() { find(e => e.type === "form").props.onSubmit({ preventDefault() {} }); render(); } };
}
beforeEach(() => { vi.stubGlobal("React", React); vi.stubGlobal("window", { location: { pathname: "/quick-10", search: "?token=do-not-send" } }); hooks.state = []; hooks.cursor = 0; hooks.pending = false; hooks.email = null; hooks.mutate.mockReset(); hooks.handled.mockReset(); });
describe("private feature suggestions", () => {
  it("requires a meaningful suggestion, not a rating", () => { const v = view(); v.submit(); expect(hooks.mutate).not.toHaveBeenCalled(); expect(v.content()).not.toContain("Your rating"); v.fill("  Clearer units  "); v.submit(); expect(hooks.mutate).toHaveBeenCalledWith({ courseKey: "oit", source: "quick10", pagePath: "/quick-10", suggestion: "Clearer units", problem: undefined, followUpAllowed: false }); });
  it("retains text after failure and only confirms acknowledged saves", () => { const v = view(); v.fill("Add more diagrams"); v.submit(); hooks.options.onError(); v.render(); expect(v.content()).toContain("was not saved"); expect(v.content()).not.toContain("has been saved privately"); expect(v.find(e => e.type === "textarea" && e.props.required).props.value).toBe("Add more diagrams"); expect(hooks.handled).not.toHaveBeenCalled(); hooks.options.onSuccess(); v.render(); expect(v.content()).toContain("has been saved privately"); expect(hooks.handled).toHaveBeenCalledOnce(); });
  it("lets verified learners opt into follow-up, default off", () => { hooks.email = "learner@example.test"; const v = view(); const checkbox = v.find(e => e.type === "input"); expect(checkbox.props.checked).toBe(false); checkbox.props.onChange({ target: { checked: true } }); v.render(); v.fill("Add diagrams"); v.submit(); expect(hooks.mutate.mock.calls[0][0].followUpAllowed).toBe(true); expect(hooks.mutate.mock.calls[0][0]).not.toHaveProperty("email"); });
  it("blocks duplicate clicks while pending", () => { hooks.pending = true; const v = view(); v.fill("Add diagrams"); v.submit(); expect(hooks.mutate).not.toHaveBeenCalled(); });
  it("manual dashboard entry does not depend on cooldown", () => { hooks.cursor = 0; let tree = SuggestionButton({ courseKey: "oit" }); expect(text(tree)).toContain("Suggest an improvement"); elements(tree).find(e => e.props.onClick)!.props.onClick(); hooks.cursor = 0; tree = SuggestionButton({ courseKey: "oit" }); expect(elements(tree).some(e => e.type === FeatureSuggestionModal)).toBe(true); });
  it("mounts invitations only in completed sessions and keeps rating collection separate", () => { const quick = readFileSync("client/src/pages/Quick10.tsx", "utf8"); expect(quick.indexOf('<SuggestionInvitation courseKey={session.courseKey}')).toBeGreaterThan(quick.indexOf('phase === "done"')); expect(quick.indexOf('phase === "done"')).toBeGreaterThan(0); const practice = readFileSync("client/src/components/QuizShell.tsx", "utf8"); expect(practice.indexOf('<SuggestionInvitation courseKey=')).toBeGreaterThan(practice.indexOf('if (!current && history.length > 0)')); });
});
