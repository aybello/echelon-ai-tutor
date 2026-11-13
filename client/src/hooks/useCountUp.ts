import { useEffect, useRef, useState } from "react";

/** Animates a number from 0 to `end` when it becomes visible without a motion library. */
export function useCountUp(end: number, duration: number = 1800) {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setCount(end);
      return;
    }
    const element = ref.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setInView(true);
      observer.disconnect();
    }, { rootMargin: "-80px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [end]);

  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(end * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [duration, end, inView]);

  return { ref, count };
}
