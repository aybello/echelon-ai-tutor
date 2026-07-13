/**
 * useStructuredData — injects JSON-LD structured data into the document head.
 * Automatically cleans up on unmount so page-specific schemas don't leak.
 *
 * Uses a serialized ref to detect real changes, preventing the double-injection
 * race condition that caused the "Duplicate field FAQPage" GSC error.
 *
 * Usage:
 *   useStructuredData([graphSchema]);
 */
import { useEffect, useRef } from "react";

export function useStructuredData(schemas: Record<string, unknown>[]) {
  const scriptRefs = useRef<HTMLScriptElement[]>([]);
  // Serialize once per render — only re-inject if content actually changed
  const serialized = JSON.stringify(schemas);
  const prevSerialized = useRef<string>("");

  useEffect(() => {
    // Skip if schemas haven't changed — prevents double-injection on re-renders
    if (serialized === prevSerialized.current) return;
    prevSerialized.current = serialized;

    // Remove any previously injected scripts from this hook instance
    scriptRefs.current.forEach((el) => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    scriptRefs.current = [];

    // Inject one script tag per schema (typically just one @graph block)
    for (const schema of schemas) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      script.setAttribute("data-structured-data", "true");
      document.head.appendChild(script);
      scriptRefs.current.push(script);
    }

    // Cleanup on unmount
    return () => {
      scriptRefs.current.forEach((el) => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
      scriptRefs.current = [];
      prevSerialized.current = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);
}
