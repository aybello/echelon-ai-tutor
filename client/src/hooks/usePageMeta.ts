/**
 * usePageMeta — sets document title, meta description, keywords, and og:* tags per page.
 * Call at the top of each page component.
 */
import { useEffect } from "react";

interface PageMetaOptions {
  title: string;
  description: string;
  /** Comma-separated keywords for the meta keywords tag */
  keywords?: string;
  /** Canonical path, e.g. "/quiz". Defaults to current pathname. */
  path?: string;
  /**
   * Set to true for private/app pages (quiz, dashboard, account, admin, auth).
   * Injects <meta name="robots" content="noindex, nofollow"> and removes canonical.
   */
  noindex?: boolean;
}

const BASE_TITLE = "Echelon Institute";
const BASE_URL = "https://echeloninstitute.ca";
const OG_IMAGE = `${BASE_URL}/og-image.png`;

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function usePageMeta({ title, description, keywords, path, noindex }: PageMetaOptions) {
  useEffect(() => {
    const fullTitle = title.toLowerCase().includes(BASE_TITLE.toLowerCase())
      ? title
      : `${title} | ${BASE_TITLE}`;
    const canonicalUrl = `${BASE_URL}${path ?? window.location.pathname}`;

    // Basic
    document.title = fullTitle;
    setMeta("description", description);
    if (keywords) {
      setMeta("keywords", keywords);
    } else {
      document.querySelector('meta[name="keywords"]')?.remove();
    }

    // Open Graph
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:url", canonicalUrl, true);
    setMeta("og:image", OG_IMAGE, true);
    setMeta("og:type", "website", true);
    setMeta("og:site_name", BASE_TITLE, true);
    setMeta("og:locale", "en_CA", true);

    // Twitter Card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image", OG_IMAGE);

    // Robots: noindex for private/app pages, index for public SEO pages
    setMeta("robots", noindex ? "noindex, nofollow" : "index, follow");

    // Canonical link — only set for indexable pages
    let canonical = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (noindex) {
      // Remove canonical from private pages
      if (canonical) canonical.remove();
    } else {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", canonicalUrl);
    }
  }, [title, description, keywords, path, noindex]);
}
