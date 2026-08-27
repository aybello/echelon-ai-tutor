export type JobIngestionResult = {
  ok: boolean;
  runStartedAt: string;
  newCount: number;
  seenCount: number;
  processedCount: number;
  failedUpsertCount: number;
  expiredCount: number;
  totalFetched: number;
  successfulSources: number;
  failedSources: number;
  productiveTiers: number;
  provinceCount: number;
  provinces: string[];
  errors: string[];
};

export type JobIngestionOptions = {
  databaseUrl?: string;
  createConnection?: (databaseUrl: string) => Promise<unknown>;
  ingestRss?: (upsertJob: (job: unknown) => Promise<void>) => Promise<unknown>;
  ingestAssociations?: (
    upsertJob: (job: unknown) => Promise<void>
  ) => Promise<unknown>;
  ingestMunicipal?: (
    upsertJob: (job: unknown) => Promise<void>
  ) => Promise<unknown>;
  now?: () => Date;
};

export function fetchAndIngest(
  options?: JobIngestionOptions
): Promise<JobIngestionResult>;
