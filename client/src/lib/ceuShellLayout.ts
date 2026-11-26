/** Keep focused CEU controls below the rendered shell, including wrapped labels. */
export function observeCeuShellLayout(root: HTMLElement, context: HTMLElement) {
  const siteHeader = root.querySelector<HTMLElement>(":scope > .echelon-site-header");
  const update = () => {
    const siteHeight = siteHeader?.getBoundingClientRect().height ?? 0;
    const contextHeight = context.getBoundingClientRect().height;
    root.style.setProperty("--ceu-site-header-height", `${siteHeight}px`);
    root.style.setProperty("--ceu-shell-offset", `${siteHeight + contextHeight}px`);
  };

  update();
  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
  observer?.observe(context);
  if (siteHeader) observer?.observe(siteHeader);
  window.addEventListener("resize", update);

  return () => {
    observer?.disconnect();
    window.removeEventListener("resize", update);
  };
}
