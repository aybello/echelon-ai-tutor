import type { KeyboardEvent } from "react";

/** One action for pointer and keyboard users; Space must not scroll the page. */
export function svgButtonProps(label: string, pressed: boolean, activate: () => void) {
  return {
    role: "button" as const,
    tabIndex: 0,
    "aria-label": label,
    "aria-pressed": pressed,
    className: "process-label-button",
    onClick: activate,
    onKeyDown(event: KeyboardEvent<SVGElement>) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (!event.repeat) activate();
    },
  };
}
