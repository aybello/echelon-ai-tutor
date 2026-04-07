import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

/**
 * Animates a number from 0 to `end` when the element comes into view.
 * Respects prefers-reduced-motion.
 */
export function useCountUp(end: number, duration: number = 1800) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();
  const [count, setCount] = useState(reduced ? end : 0);

  useEffect(() => {
    if (!inView || reduced) {
      setCount(end);
      return;
    }
    let startTime: number | null = null;
    const startVal = 0;

    function step(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(startVal + (end - startVal) * eased));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [inView, end, duration, reduced]);

  return { ref, count };
}
