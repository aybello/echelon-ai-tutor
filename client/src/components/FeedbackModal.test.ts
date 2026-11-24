import React, { type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
const hooks = vi.hoisted(() => ({ cursor: 0, state: [] as unknown[], options: {} as any, pending: false, mutate: vi.fn(), shown: vi.fn(), reviewed: vi.fn() }));
vi.mock("react", async original => ({ ...await original<typeof import("react")>(),
  useId: () => "review-comment", useEffect: () => {},
  useState(initial: unknown) { const i = hooks.cursor++; if (!(i in hooks.state)) hooks.state[i] = initial;
    return [hooks.state[i], (next: unknown) => { hooks.state[i] = typeof next === "function" ? next(hooks.state[i]) : next; }]; },
}));
vi.mock("@/lib/trpc", () => ({ trpc: { feedback: { submit: { useMutation: (options: any) => {
  hooks.options = options; return { mutate: hooks.mutate, isPending: hooks.pending };
} } } } }));
vi.mock("@/lib/reviewFunnel", () => ({ GOOGLE_REVIEW_URL: "https://g.page/r/CWsjBbkUlS8rEBM/review", markReviewPromptShown: hooks.shown, markAsReviewed: hooks.reviewed }));
import FeedbackModal, { ReviewButton } from "./FeedbackModal";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
type Element = ReactElement<Record<string, any>>;
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  return React.isValidElement<Record<string, any>>(node) ? [node, ...elements(node.props.children)] : [];
}
function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join("");
  if (React.isValidElement<Record<string, any>>(node)) return text(node.props.children);
  return typeof node === "string" || typeof node === "number" ? String(node) : "";
}
function view() {
  const props = { examType: "oit", feedbackType: "quick10" as const, onClose: vi.fn(), onSubmitted: vi.fn() };
  let tree: ReactNode;
  const render = () => { hooks.cursor = 0; tree = FeedbackModal(props); };
  const find = (test: (e: Element) => boolean) => { const element = elements(tree).find(test); if (!element) throw Error("Missing element"); return element; };
  render();
  return { props, render, find, content: () => text(tree),
    rate(star: number) { find(e => e.props["aria-label"]?.startsWith(`${star} star`)).props.onClick(); render(); },
    comment(value: string) { find(e => e.type === "textarea").props.onChange({ target: { value } }); render(); },
    submit() { find(e => e.type === "form").props.onSubmit({ preventDefault() {} }); render(); },
    google: () => find(e => e.type === "a"),
  };
}
beforeEach(() => { vi.stubGlobal("React", React); hooks.state = []; hooks.cursor = 0; hooks.pending = false; hooks.mutate.mockReset(); hooks.reviewed.mockReset(); });
describe("honest optional app reviews", () => {
  it.each([1, 2, 3, 4, 5])("offers the same private form and Google link at rating %i without automatic submission or navigation", star => {
    const v = view(); v.rate(star);
    expect(hooks.mutate).not.toHaveBeenCalled();
    expect(v.find(e => e.type === "textarea").props.maxLength).toBe(1000);
    expect(v.google().props.href).toBe("https://g.page/r/CWsjBbkUlS8rEBM/review");
    expect(v.google().props.target).toBe("_blank");
    expect(v.google().props.rel).toContain("noopener");
    expect(v.google().props.onClick).toBeUndefined();
    expect(v.find(e => e.props["aria-label"]?.startsWith(`${star} star`)).props["aria-pressed"]).toBe(true);
    v.comment(" Helpful explanations "); v.submit();
    expect(hooks.mutate).toHaveBeenCalledOnce();
    expect(hooks.mutate).toHaveBeenCalledWith({ examType: "oit", feedbackType: "quick10", rating: star, comment: "Helpful explanations" });
    expect(v.content()).not.toContain("has been saved");
  });
  it("allows Google reviews before selecting a rating and never infers public posting", () => {
    const v = view(); expect(v.google()).toBeDefined(); v.submit(); expect(hooks.mutate).not.toHaveBeenCalled();
    expect(hooks.reviewed).not.toHaveBeenCalled();
  });
  it("keeps rating and comment after a failure and only thanks after confirmed save", () => {
    const v = view(); v.rate(2); v.comment("Please improve diagrams"); v.submit(); hooks.options.onError(); v.render();
    expect(v.content()).toContain("Your feedback was not saved");
    expect(v.content()).not.toContain("has been saved");
    expect(v.find(e => e.type === "textarea").props.value).toBe("Please improve diagrams");
    expect(v.props.onSubmitted).not.toHaveBeenCalled();
    v.submit(); hooks.options.onSuccess(); v.render();
    expect(v.content()).toContain("has been saved privately");
    expect(v.props.onSubmitted).toHaveBeenCalledOnce();
    expect(v.props.onClose).not.toHaveBeenCalled();
  });
  it("does not send a second request while saving and disables editable fields", () => {
    const v = view(); v.rate(4); hooks.pending = true; v.render(); v.submit();
    expect(hooks.mutate).not.toHaveBeenCalled();
    expect(v.find(e => e.type === "fieldset").props.disabled).toBe(true);
    expect(v.find(e => e.type === "textarea").props.disabled).toBe(true);
  });
  it("is dismissible without submitting and respects the existing reviewed preference", () => {
    const v = view(); v.find(e => e.type === "button" && text(e) === "I already left a review").props.onClick();
    expect(hooks.reviewed).toHaveBeenCalledOnce(); expect(v.props.onClose).toHaveBeenCalledOnce();
    expect(hooks.mutate).not.toHaveBeenCalled();
    v.find(e => e.type === Dialog).props.onOpenChange(false);
    expect(v.props.onClose).toHaveBeenCalledTimes(2);
  });
  it("opens the dashboard entry only on request", () => {
    const render = () => { hooks.cursor = 0; return ReviewButton({ examType: "class1-water" }); };
    let tree = render(); expect(elements(tree).find(e => e.type === FeedbackModal)).toBeUndefined();
    elements(tree).find(e => e.type === Button)!.props.onClick(); tree = render();
    const modal = elements(tree).find(e => e.type === FeedbackModal)!;
    expect(modal.props.examType).toBe("class1-water"); expect(modal.props.feedbackType).toBe("dashboard");
    modal.props.onClose(); expect(elements(render()).find(e => e.type === FeedbackModal)).toBeUndefined();
  });
  it("wires dashboard, completed Quick 10 and all-score quiz results without touching answers", () => {
    const read = (file: string) => readFileSync(file, "utf8");
    expect(read("client/src/pages/StudentDashboard.tsx")).toContain("<ReviewButton examType={selectedCourseKey");
    const quick = read("client/src/pages/Quick10.tsx");
    expect(quick).toMatch(/phase === "done"[\s\S]*<ReviewButton examType={session.courseKey} feedbackType="quick10"/);
    expect(read("client/src/components/QuizShell.tsx")).not.toContain("pct >= 70 && shouldShowReviewPrompt()");
  });
});
