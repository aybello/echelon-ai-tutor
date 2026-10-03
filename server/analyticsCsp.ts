/** Project configuration controls this origin; no user request supplies it. */
export function analyticsCspOrigin(value: string | undefined): string[] {
  if (!value || value.includes('%')) return [];
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || /[\s*;]/.test(url.hostname)) return [];
    return [url.origin];
  } catch { return []; }
}
