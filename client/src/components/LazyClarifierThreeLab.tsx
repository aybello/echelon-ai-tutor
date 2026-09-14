import { lazy } from "react";

// Shared by the equipment lab and process guide. A stalled chunk must not leave
// either learning surface stuck on its loading panel indefinitely.
export const LazyClarifierThreeLab = lazy(() => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("The interactive 3D model took too long to load.")), 12_000);
  });
  return Promise.race([import("./ClarifierThreeLab"), timeout]).finally(() => clearTimeout(timeoutId));
});
