# Page-Load Flash Audit — 2026-08-17

## Finding

Public SSR routes injected crawlable content directly into the React root. When JavaScript was enabled, the browser could paint that raw SEO shell briefly before React replaced it, creating the visible page-load flash reported by the learner.

## Correction

The SSR fallback is now hidden in the initial document stylesheet for JavaScript users. A `noscript` stylesheet restores it for visitors without JavaScript, preserving the accessible crawl and no-JavaScript fallback rather than removing it.

## Verification

The visibility rule is covered by focused regression tests alongside SEO and course-navigation tests. TypeScript and a production build passed. The cache-busted public home route loaded normally after deployment, without presenting the raw server SEO shell as its rendered page.
