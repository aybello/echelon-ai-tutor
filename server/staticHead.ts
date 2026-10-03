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
    <header class="ssr-brand"><a href="/">Echelon Institute</a><span>Water &amp; wastewater operator exam preparation</span></header>
    <div class="ssr-content">${body}</div>
    <nav class="ssr-nav" aria-label="Site navigation"><a href="/oit">Ontario OIT</a><a href="/canada/ontario">Ontario courses</a><a href="/wpi">WPI-aligned courses</a><a href="/pricing">Pricing</a><a href="/blog">Blog</a><a href="/account">Sign in</a></nav>
  </div>`;
}

/** Existence is based on route knowledge, never on a failed database read. */
export function prepareAppFallback(template: string, url: string): { html: string; status: 200 | 404 } {
  const route = classifyAppRoute(url);
  const missing = route.kind === "not-found";
  const privatePage = route.kind === "private";
  const title = missing ? "Page Not Found | Echelon Institute" : "Operator Study Resources | Echelon Institute";
  const description = missing ? "The requested page does not exist. Browse Echelon operator courses and resources." : "Independent water and wastewater operator exam preparation and study resources.";
  const canonical = !missing && !privatePage ? `https://echeloninstitute.ca${route.path}` : null;
  const head = `<meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="${missing || privatePage ? "noindex, nofollow" : "index, follow"}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    ${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" /><meta property="og:url" content="${escapeHtml(canonical)}" />` : ""}`;
  const body = brandedShell(missing
    ? `<h1>Page Not Found</h1><p>The page you are looking for does not exist.</p><p><a href="/">Return home</a> or choose a course below.</p>`
    : `<h1>${privatePage ? "Your Echelon workspace" : "Prepare for your operator exam"}</h1><p role="status">Loading your study workspace. Course links and resources are available below.</p><p><a href="/oit">Start Ontario OIT practice</a> or <a href="/wpi">browse WPI-aligned preparation</a>.</p>`);
  const html = replaceStaticHead(template, head, title)
    .replace(/<div id="root">[\s\S]*?<\/div>(?=\s*<script)/, () => `<div id="root">${body}</div>`);
  return { html, status: missing ? 404 : 200 };
}
