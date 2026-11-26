export function ingestRss(upsertJob: (job: unknown) => Promise<void>, options?: { signal?: AbortSignal }): Promise<{
  errors: string[];
  totalFetched: number;
  successfulSources: number;
  failedSources: number;
}>;
