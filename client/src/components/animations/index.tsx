import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface AnimProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  once?: boolean;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function useReveal(once: boolean, margin = "-60px") {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }
    const element = ref.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      const inView = Boolean(entry?.isIntersecting);
      setVisible(inView);
      if (inView && once) observer.disconnect();
    }, { rootMargin: margin });
    observer.observe(element);
    return () => observer.disconnect();
  }, [margin, once]);

  return { ref, visible };
}

function revealStyle(visible: boolean, delay: number, transform: string, kind: "fade" | "slide"): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translate3d(0, 0, 0)" : transform,
    transition: `${kind === "fade" ? "opacity 180ms" : "opacity 420ms cubic-bezier(0.23, 1, 0.32, 1), transform 420ms cubic-bezier(0.23, 1, 0.32, 1)"}`,
    transitionDelay: `${Math.max(delay, 0)}ms`,
    willChange: "opacity, transform",
  };
}

function Reveal({ children, delay = 0, className, once = true, transform, kind = "slide" }: AnimProps & { transform: string; kind?: "fade" | "slide" }) {
  const { ref, visible } = useReveal(once);
  return <div ref={ref} data-echelon-reveal className={className} style={revealStyle(visible, delay * 1000, transform, kind)}>{children}</div>;
}

/** Native CSS and IntersectionObserver replaces Framer Motion on public routes. */
export function FadeUp(props: AnimProps) {
  return <Reveal {...props} transform="translate3d(0, 18px, 0)" />;
}

export function FadeIn(props: AnimProps) {
  return <Reveal {...props} transform="translate3d(0, 0, 0)" kind="fade" />;
}

export function SlideLeft(props: AnimProps) {
  return <Reveal {...props} transform="translate3d(-24px, 0, 0)" />;
}

export function SlideRight(props: AnimProps) {
  return <Reveal {...props} transform="translate3d(24px, 0, 0)" />;
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  once?: boolean;
  style?: CSSProperties;
}

export function StaggerContainer({ children, className, once = true, style }: StaggerContainerProps) {
  const { ref, visible } = useReveal(once);
  return <div ref={ref} data-echelon-reveal className={className} style={{ ...style, opacity: visible ? 1 : 0, transition: "opacity 180ms ease-out" }}>{children}</div>;
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function ScaleOnHover({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
