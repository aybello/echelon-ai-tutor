/**
 * usePageMeta — sets document title, meta description, and og:* tags per page.
 * Call at the top of each page component.
 */
import { useEffect } from "react";

interface PageMetaOptions {
  title: string;
  description: string;
  /** Canonical path, e.g. "/quiz". Defaults to current pathname. */
  path?: string;
}

const BASE_TITLE = "Echelon Institute";
const BASE_URL = "https://echelonai-9kar7mkg.manus.space";
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

export function usePageMeta({ title, description, path }: PageMetaOptions) {
  useEffect(() => {
    const fullTitle = `${title} | ${BASE_TITLE}`;
    const canonicalUrl = `${BASE_URL}${path ?? window.location.pathname}`;

    // Basic
    document.title = fullTitle;
    setMeta("description", description);

    // Open Graph
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:url", canonicalUrl, true);
    setMeta("og:image", OG_IMAGE, true);
    setMeta("og:type", "website", true);
    setMeta("og:site_name", BASE_TITLE, true);

    // Twitter Card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image", OG_IMAGE);

    // Canonical link
    let canonical = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);
  }, [title, description, path]);
}
