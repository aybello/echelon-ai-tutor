/**
 * Echelon Institute — Reusable Animation Components
 * All animations respect prefers-reduced-motion for accessibility.
 * Mobile-first: animations are lightweight and performant.
 */
"use client";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface AnimProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  once?: boolean;
}

// ─── FadeUp ────────────────────────────────────────────────────────────────

export function FadeUp({ children, delay = 0, className, once = true }: AnimProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: "-60px" });
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── FadeIn ────────────────────────────────────────────────────────────────

export function FadeIn({ children, delay = 0, className, once = true }: AnimProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: "-60px" });
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── SlideLeft ─────────────────────────────────────────────────────────────

export function SlideLeft({ children, delay = 0, className, once = true }: AnimProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: "-60px" });
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: -32 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -32 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── SlideRight ────────────────────────────────────────────────────────────

export function SlideRight({ children, delay = 0, className, once = true }: AnimProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: "-60px" });
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: 32 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 32 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerContainer + StaggerItem ───────────────────────────────────────

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  once?: boolean;
  style?: React.CSSProperties;
}

export function StaggerContainer({ children, className, once = true, style }: StaggerContainerProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: "-60px" });
  const reduced = useReducedMotion();

  if (reduced) return <div className={className} style={style}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── ScaleOnHover ──────────────────────────────────────────────────────────

export function ScaleOnHover({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}

// ─── PageTransition ────────────────────────────────────────────────────────

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
