/**
 * Server-Side Rendering for Blog Routes
 *
 * Intercepts /blog and /blog/:slug requests BEFORE the SPA catch-all.
 * Fetches post content from the DB, injects full HTML + meta + OG + canonical
 * + BlogPosting JSON-LD into the index.html shell so crawlers see real content
 * without executing JavaScript.
 *
 * Real users still get the interactive SPA — the injected HTML is the crawlable
 * baseline; React hydrates over it on load.
 */

import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { getDb } from "./db";
import { blogPosts } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const SITE_URL = "https://echeloninstitute.ca";
const DEFAULT_OG_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/og-image-new-NPyJfV6kq45KpTXHZ5UW8N.png";
const PUBLISHER_LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/favicon-512_1eb3c09e.png";

/** Read the index.html shell (works in both dev and prod) */
function getIndexHtml(isDev: boolean): string {
  const templatePath = isDev
    ? path.resolve(process.cwd(), "client", "index.html")
    : path.resolve(path.dirname(new URL(import.meta.url).pathname), "public", "index.html");

  if (!fs.existsSync(templatePath)) {
    // Fallback for dev when dist doesn't exist yet
    const devPath = path.resolve(process.cwd(), "client", "index.html");
    return fs.readFileSync(devPath, "utf-8");
  }
  return fs.readFileSync(templatePath, "utf-8");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildBlogPostingJsonLd(post: {
  title: string;
  excerpt: string;
  slug: string;
  author: string;
  publishedAt: Date;
  updatedAt: Date;
}): string {
  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: postUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: post.author || "Echelon Institute",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Echelon Institute",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: PUBLISHER_LOGO,
      },
    },
    image: DEFAULT_OG_IMAGE,
  };
  return JSON.stringify(schema);
}

function injectBlogPostMeta(
  template: string,
  post: {
    title: string;
    excerpt: string;
    metaTitle: string | null;
    metaDescription: string | null;
    slug: string;
    author: string;
    content: string;
    publishedAt: Date;
    updatedAt: Date;
  }
): string {
  const pageTitle = escapeHtml(post.metaTitle || post.title);
  const pageDesc = escapeHtml(post.metaDescription || post.excerpt);
  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  const jsonLd = buildBlogPostingJsonLd(post);

  const headInjection = `
    <title>${pageTitle} | Echelon Institute</title>
    <meta name="description" content="${pageDesc}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${postUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${pageTitle}" />
    <meta property="og:description" content="${pageDesc}" />
    <meta property="og:url" content="${postUrl}" />
    <meta property="og:image" content="${DEFAULT_OG_IMAGE}" />
    <meta property="og:site_name" content="Echelon Institute" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${pageTitle}" />
    <meta name="twitter:description" content="${pageDesc}" />
    <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}" />
    <script type="application/ld+json">${jsonLd}</script>`;

  // Replace the default <title> and inject all meta before </head>
  // Avoid "Echelon Institute | Echelon Institute" if metaTitle already contains the brand name
  const titleSuffix = pageTitle.toLowerCase().includes("echelon") ? "" : " | Echelon Institute";
  let html = template
    .replace(
      /<title>[^<]*<\/title>/,
      `<title>${pageTitle}${titleSuffix}</title>`
    )
    .replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${pageDesc}" />`
    )
    .replace(
      /<link rel="canonical"[^>]*>/,
      `<link rel="canonical" href="${postUrl}" />`
    )
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${pageTitle}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${pageDesc}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${postUrl}" />`)
    .replace(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="article" />`)
    .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${pageTitle}" />`)
    .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${pageDesc}" />`);

  // Inject JSON-LD before </head>
  html = html.replace(
    "</head>",
    `  <script type="application/ld+json">${jsonLd}</script>\n  </head>`
  );

  // Inject the article content into the root div so it's visible without JS
  // React will hydrate over this on load
  const articleHtml = `
    <article id="ssr-blog-content" style="display:none" aria-hidden="true">
      <h1>${escapeHtml(post.title)}</h1>
      ${post.content}
    </article>`;

  html = html.replace(
    /(<div id="root">[\s\S]*?<\/h1>[\s\S]*?<\/div>)/,
    `<div id="root">\n      ${articleHtml}\n    </div>`
  );

  // Fallback: if the above regex didn't match, inject after <div id="root">
  if (!html.includes('id="ssr-blog-content"')) {
    html = html.replace(
      '<div id="root">',
      `<div id="root">\n      ${articleHtml}`
    );
  }

  return html;
}

function injectBlogIndexMeta(template: string): string {
  const pageTitle = "Blog — Water &amp; Wastewater Operator Resources";
  const pageDesc =
    "Guides, exam prep tips, certification walkthroughs, and career resources for Canadian water and wastewater operators.";
  const pageUrl = `${SITE_URL}/blog`;

  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${pageTitle} | Echelon Institute</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${pageDesc}" />`)
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${pageUrl}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${pageTitle}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${pageDesc}" />`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${pageUrl}" />`);
}

export function registerBlogSsrRoutes(app: Express, isDev: boolean) {
  // Blog index — inject correct meta
  app.get("/blog", async (_req: Request, res: Response) => {
    try {
      const template = getIndexHtml(isDev);
      const html = injectBlogIndexMeta(template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (err) {
      console.error("[blogSsr] /blog error:", err);
      res.status(500).send("Internal server error");
    }
  });

  // Individual blog post — full SSR with content + meta + JSON-LD
  app.get("/blog/:slug", async (req: Request, res: Response) => {
    const { slug } = req.params;

    // Basic slug validation — no path traversal, reasonable length
    if (!slug || !/^[a-z0-9-]{1,250}$/.test(slug)) {
      return res.status(404).send("Not found");
    }

    try {
      const db = await getDb();
      if (!db) {
        // DB unavailable — fall through to SPA (graceful degradation)
        const template = getIndexHtml(isDev);
        return res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }

      const [post] = await db
        .select()
        .from(blogPosts)
        .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, 1)))
        .limit(1);

      if (!post) {
        // Real 404 — not a soft 404 SPA shell
        return res.status(404).set({ "Content-Type": "text/html" }).send(`
          <!doctype html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <title>Post Not Found | Echelon Institute</title>
              <meta name="robots" content="noindex" />
            </head>
            <body>
              <h1>Post not found</h1>
              <p><a href="/blog">Back to Blog</a></p>
            </body>
          </html>`);
      }

      const template = getIndexHtml(isDev);
      const html = injectBlogPostMeta(template, post);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (err) {
      console.error(`[blogSsr] /blog/${slug} error:`, err);
      res.status(500).send("Internal server error");
    }
  });
}

/** Build the dynamic sitemap from DB posts + static routes */
export async function buildDynamicSitemap(): Promise<string> {
  const staticRoutes = [
    { url: `${SITE_URL}/`, priority: "1.0", changefreq: "weekly" },
    { url: `${SITE_URL}/guides`, priority: "0.9", changefreq: "monthly" },
    { url: `${SITE_URL}/pricing`, priority: "0.9", changefreq: "monthly" },
    { url: `${SITE_URL}/about`, priority: "0.7", changefreq: "monthly" },
    { url: `${SITE_URL}/jobs`, priority: "0.7", changefreq: "daily" },
    { url: `${SITE_URL}/blog`, priority: "0.9", changefreq: "weekly" },
    { url: `${SITE_URL}/wpi`, priority: "0.8", changefreq: "monthly" },
    { url: `${SITE_URL}/faq`, priority: "0.7", changefreq: "monthly" },
    { url: `${SITE_URL}/teams`, priority: "0.9", changefreq: "weekly" },
    { url: `${SITE_URL}/guides`, priority: "0.8", changefreq: "monthly" },
    { url: `${SITE_URL}/process`, priority: "0.7", changefreq: "monthly" },
    { url: `${SITE_URL}/wastewater`, priority: "0.7", changefreq: "monthly" },
    { url: `${SITE_URL}/distribution-guide`, priority: "0.7", changefreq: "monthly" },
    { url: `${SITE_URL}/collection-guide`, priority: "0.7", changefreq: "monthly" },
    { url: `${SITE_URL}/pumping`, priority: "0.7", changefreq: "monthly" },
    { url: `${SITE_URL}/instrumentation`, priority: "0.7", changefreq: "monthly" },
    { url: `${SITE_URL}/us`, priority: "0.9", changefreq: "weekly" },
    { url: `${SITE_URL}/us/states`, priority: "0.8", changefreq: "monthly" },
    { url: `${SITE_URL}/us/courses`, priority: "0.8", changefreq: "monthly" },
    { url: `${SITE_URL}/privacy`, priority: "0.3", changefreq: "yearly" },
    { url: `${SITE_URL}/terms`, priority: "0.3", changefreq: "yearly" },
    { url: `${SITE_URL}/refund`, priority: "0.3", changefreq: "yearly" },
  ];

  let postEntries = "";
  try {
    const db = await getDb();
    if (db) {
      const posts = await db
        .select({
          slug: blogPosts.slug,
          publishedAt: blogPosts.publishedAt,
          updatedAt: blogPosts.updatedAt,
        })
        .from(blogPosts)
        .where(eq(blogPosts.published, 1))
        .orderBy(desc(blogPosts.publishedAt));

      postEntries = posts
        .map(
          (p) => `
  <url>
    <loc>${SITE_URL}/blog/${p.slug}</loc>
    <lastmod>${(p.updatedAt || p.publishedAt).toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
        )
        .join("");
    }
  } catch (err) {
    console.error("[blogSsr] sitemap DB error:", err);
  }

  const staticEntries = staticRoutes
    .map(
      (r) => `
  <url>
    <loc>${r.url}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${postEntries}
</urlset>`;
}
