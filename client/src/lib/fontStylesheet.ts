/** Promote an existing preload without an inline HTML event handler. */
export function enableFontStylesheet(doc: Document) {
  const link = doc.getElementById('echelon-font-style') as HTMLLinkElement | null;
  if (link?.tagName === 'LINK' && link.getAttribute('as') === 'style') link.rel = 'stylesheet';
}
