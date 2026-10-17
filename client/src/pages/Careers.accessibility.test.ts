import React, { isValidElement, type ReactElement } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Dialog, DialogClose, DialogOverlay, DialogTitle } from "@/components/ui/dialog";

vi.mock("@/lib/trpc", () => ({ trpc: {} }));
vi.mock("@/components/SiteNav", () => ({ default: () => null }));
vi.mock("@/hooks/usePageMeta", () => ({ usePageMeta: () => {} }));
import { JobModal } from "./Careers";

const job = {
  id: 42, title: "Fixture Water Operator", company: "Fixture Water Authority",
  location: "Fixture, ON", province: "ON", salary: "$30/hr", jobType: "full-time",
  sourceUrl: "https://employer.echelon.test/jobs/water-operator?jobid=fixture-42",
  sourceName: "Synthetic employer", description: "Synthetic duties", postedAt: null, isFeatured: 0,
};
function elements(value: unknown): ReactElement<any>[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!isValidElement(value)) return [];
  const node = value as ReactElement<any>;
  return [node, ...elements(node.props.children)];
}
beforeEach(() => { vi.stubGlobal("React", React); });

describe("job detail accessible modal contract", () => {
  it("uses the shared modal primitives, labels the dialog, and preserves the posting destination", () => {
    const tree = JobModal({ job, onClose: vi.fn(), returnFocusTo: null });
    const nodes = elements(tree);
    expect(tree.type).toBe(Dialog);
    expect(tree.props.open).toBe(true);
    const content = nodes.find(node => node.type === DialogPrimitive.Content)!;
    expect(content.props["aria-modal"]).toBe("true");
    expect(nodes.find(node => node.type === DialogTitle)?.props.children).toBe(job.title);
    expect(nodes.find(node => node.type === DialogClose)?.props["aria-label"]).toBe("Close");
    const link = nodes.find(node => node.type === "a")!;
    expect(link.props).toMatchObject({ href: job.sourceUrl, target: "_blank", rel: "noopener noreferrer" });
    expect(nodes.find(node => node.type === "div" && node.props.className?.includes("overflow-y-auto"))?.props.className).toContain("min-h-0");
  });

  it("dismisses on close/outside events and returns focus to the originating card", () => {
    const onClose = vi.fn();
    const focus = vi.fn();
    const tree = JobModal({ job, onClose, returnFocusTo: { focus } as unknown as HTMLButtonElement });
    const nodes = elements(tree);
    tree.props.onOpenChange(true);
    expect(onClose).not.toHaveBeenCalled();
    tree.props.onOpenChange(false);
    expect(onClose).toHaveBeenCalledOnce();
    nodes.find(node => node.type === DialogOverlay)!.props.onClick();
    expect(onClose).toHaveBeenCalledTimes(2);
    const preventDefault = vi.fn();
    nodes.find(node => node.type === DialogPrimitive.Content)!.props.onCloseAutoFocus({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });
});
