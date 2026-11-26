import { replaceAppRoot } from "./replaceAppRoot";
import { classifyAppRoute } from "../shared/appRoutes";

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Replace only server-owned head fields. Analytics and application scripts are untouched. */
export function replaceStaticHead(template: string, head: string, title: string): string {
  return template
    .replace(/<title>[^<]*<\/title>/g, () => `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta (?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g, "")
    .replace(/<link rel="canonical"[^>]*>/g, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "")
    .replace("</head>", () => `${head}\n</head>`);
}

export function brandedShell(body: string): string {
  return `<div data-ssr-fallback="true" id="ssr-page-shell">
    <header class="ssr-brand"><a href="/">Echelon Institute</a><span>AI-powered exam prep for skilled trades — water &amp; wastewater first</span></header>
    <div class="ssr-content">${body}</div>
    <nav class="ssr-nav" aria-label="Site navigation"><a href="/oit">Ontario OIT</a><a href="/canada/ontario">Ontario courses</a><a href="/wpi">WPI-aligned courses</a><a href="/electrician-309a">Free Ontario 309A prep</a><a href="/pricing">Pricing</a><a href="/blog">Blog</a><a href="/account">Sign in</a></nav>
  </div>`;
}

/** Existence is based on route knowledge, never on a failed database read. */
export function prepareAppFallback(template: string, url: string): { html: string; status: 200 | 404 } {
  const route = classifyAppRoute(url);
  const missing = route.kind === "not-found";
  const privatePage = route.kind === "private";
  const activityPage = route.kind === "public" && /^\/courses\/[a-z0-9-]+\/interactive$/.test(route.path);
  const title = missing ? "Page Not Found | Echelon Institute" : "Skilled Trades Study Resources | Echelon Institute";
  const description = missing ? "The requested page does not exist. Browse Echelon courses and study resources." : "AI-powered exam prep for the skilled-trades workforce, starting with water and wastewater. Canadian courses and supported US preparation, plus free Ontario 309A practice and mock exams.";
  const canonical = !missing && !privatePage && !activityPage ? `https://echeloninstitute.ca${route.path}` : null;
  const head = `<meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="${missing || privatePage || activityPage ? "noindex, nofollow" : "index, follow"}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    ${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" /><meta property="og:url" content="${escapeHtml(canonical)}" />` : ""}`;
  const body = missing
    ? brandedShell(`<h1>Page Not Found</h1><p>The page you are looking for does not exist.</p><p><a href="/">Return home</a> or choose a course below.</p>`)
    : `<div class="app-loading" role="status" aria-label="Loading page"><span class="app-loading-spinner" aria-hidden="true"></span></div><noscript><p>JavaScript is needed to open the study tools. <a href="/">Return home</a>.</p></noscript>`;
  const html = replaceAppRoot(replaceStaticHead(template, head, title), body);
  return { html, status: missing ? 404 : 200 };
}
