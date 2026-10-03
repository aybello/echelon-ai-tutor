export type JobVerification = { status: "verified" | "expired" | "missing" | "unverified" | "unavailable"; postedAt: Date | null; closingAt: Date | null };
export function plainJobText(value?: string): string;
export function sourceDate(value: unknown): Date | null;
export function parseJobDates(text: string): { postedAt: Date | null; closingAt: Date | null };
export function pdfToText(bytes: Uint8Array): Promise<string>;
export function fetchJobDocument(url: string, deps?: { fetch: typeof fetch; pdfToText: typeof pdfToText }): Promise<{ missing: boolean; text: string }>;
export function verifyJob(job: { title?: string; sourceUrl: string; description?: string | null; postedAt?: Date | string | null; closingAt?: Date | string | null }, options?: { now?: Date; fetchDocument?: (url: string) => Promise<{ missing: boolean; text: string }> }): Promise<JobVerification>;
