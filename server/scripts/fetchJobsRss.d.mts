export function ingestRss(upsertJob: (job: unknown) => Promise<void>): Promise<{
  errors: string[];
  totalFetched: number;
  successfulSources: number;
  failedSources: number;
}>;
