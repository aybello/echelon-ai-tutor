export function ingestMunicipal(
  upsertJob: (job: unknown) => Promise<void>,
  options?: { signal?: AbortSignal }
): Promise<{
  errors: string[];
  totalFetched: number;
  successfulSources: number;
  failedSources: number;
  sourceOutcomes: Array<{ source: string; status: "success" | "failed"; count: number }>;
}>;
