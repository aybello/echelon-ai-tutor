export function detectProvince(locationStr?: string | null): string;
export function detectJobType(text?: string | null): string;
export function extractSalary(text?: string | null): string | null;
export function isWaterJob(
  title?: string | null,
  description?: string | null
): boolean;
export function truncate(text?: string | null, max?: number): string | null;
export function decodeHtmlEntities(text?: string): string;
export function normalizeUrl(url?: string | null): string | null | undefined;
export function fetchWithTimeout(
  url: string,
  timeoutMs?: number
): Promise<string>;
