/**
 * QuestionBankPrefetcher — silently pre-fetches the top 4 most popular
 * question banks in the background when the app first loads.
 *
 * Pre-fetched banks (in priority order):
 *   1. oit          — Ontario OIT Water (most popular)
 *   2. oit-ww       — Ontario OIT Wastewater
 *   3. wpi-class1-water — WPI Class 1 Water Treatment
 *   4. wpi-class1-wastewater — WPI Class 1 Wastewater Treatment
 *
 * Each bank is fetched sequentially (not in parallel) to avoid hammering
 * the DB. If a bank is already cached, it's skipped entirely.
 *
 * This component renders nothing — it's purely a side-effect runner.
 * Mount it once near the app root (e.g. in App.tsx).
 */
import { useEffect, useRef } from "react";
import { getCached, setCached } from "@/lib/questionCache";

const TOP_BANKS = [
  "oit",
  "oit-ww",
  "wpi-class1-water",
  "wpi-class1-wastewater",
];

// Delay before starting pre-fetch (ms) — let the page render first
const START_DELAY_MS = 3000;
// Gap between each bank fetch (ms) — avoid DB hammering
const BETWEEN_DELAY_MS = 2000;

async function fetchBank(bankKey: string): Promise<void> {
  // Skip if already cached
  if (getCached(bankKey)) return;

  try {
    const [questionsRes, metaRes, overviewsRes] = await Promise.all([
      fetch(`/api/trpc/quiz.getQuestions?input=${encodeURIComponent(JSON.stringify({ json: { bankKey } }))}`),
      fetch(`/api/trpc/quiz.getBankMeta?input=${encodeURIComponent(JSON.stringify({ json: { bankKey } }))}`),
      fetch(`/api/trpc/quiz.getModuleOverviews?input=${encodeURIComponent(JSON.stringify({ json: { bankKey } }))}`),
    ]);

    if (!questionsRes.ok || !metaRes.ok) return;

    const [questionsJson, metaJson, overviewsJson] = await Promise.all([
      questionsRes.json(),
      metaRes.json(),
      overviewsRes.ok ? overviewsRes.json() : Promise.resolve(null),
    ]);

    const questions = questionsJson?.result?.data?.json?.questions ?? [];
    const modules = metaJson?.result?.data?.json?.modules ?? [];
    const moduleTargets = metaJson?.result?.data?.json?.moduleTargets ?? null;
    const formulaLinks = metaJson?.result?.data?.json?.formulaLinks ?? null;
    const totalQuestions = metaJson?.result?.data?.json?.totalQuestions ?? questions.length;
    const overviews = overviewsJson?.result?.data?.json ?? null;
    // Issue L: persist contentVersion so future loads can detect admin content edits
    const contentVersion: number = metaJson?.result?.data?.json?.contentVersion ?? 1;

    if (questions.length === 0) return; // DB down — don't cache

    setCached(bankKey, { questions, modules, moduleTargets, formulaLinks, totalQuestions, overviews, contentVersion });
  } catch {
    // Network error or DB down — silently skip
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function QuestionBankPrefetcher() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;

    // Do NOT prefetch on the public landing page — the DB should only wake up
    // when a user navigates to a quiz or feature page. This prevents visitors
    // from triggering the DB wake-up screen just by loading the homepage.
    const isLandingPage = window.location.pathname === "/";
    if (isLandingPage) return;

    ran.current = true;

    (async () => {
      await sleep(START_DELAY_MS);
      for (const bankKey of TOP_BANKS) {
        await fetchBank(bankKey);
        await sleep(BETWEEN_DELAY_MS);
      }
    })();
  }, []);

  return null;
}
