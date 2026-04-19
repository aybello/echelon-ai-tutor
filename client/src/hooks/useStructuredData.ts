/**
 * useStructuredData — injects JSON-LD structured data into the document head.
 * Automatically cleans up on unmount so page-specific schemas don't leak.
 *
 * Usage:
 *   useStructuredData([orgSchema, faqSchema, ...]);
 */
import { useEffect, useRef } from "react";

export function useStructuredData(schemas: Record<string, unknown>[]) {
  const scriptRefs = useRef<HTMLScriptElement[]>([]);

  useEffect(() => {
    // Clean up any previous scripts from this hook instance
    scriptRefs.current.forEach((el) => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    scriptRefs.current = [];

    // Inject new scripts
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
    };
  }, [JSON.stringify(schemas)]);
}
