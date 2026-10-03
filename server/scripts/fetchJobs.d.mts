import type { verifyJob } from "./jobVerification.mjs";
import type { ConnectionOptions } from "mysql2";

export type JobIngestionResult = {
  ok: boolean;
  runStartedAt: string;
  newCount: number;
  seenCount: number;
  processedCount: number;
  failedUpsertCount: number;
  expiredCount: number;
  deduplicatedCount: number;
  duplicateInputCount: number;
  totalFetched: number;
  successfulSources: number;
  failedSources: number;
  productiveTiers: number;
  provinceCount: number;
  provinces: string[];
  verificationUnavailable: number;
  quarantinedCount: number;
  errors: string[];
};

export type JobIngestionOptions = {
  databaseUrl?: string;
  createConnection?: (settings: string | ConnectionOptions) => Promise<unknown>;
  /** Recovery runs may refresh source-confirmed jobs without bulk expiry. */
  skipExpiry?: boolean;
  verifyJob?: typeof verifyJob;
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
