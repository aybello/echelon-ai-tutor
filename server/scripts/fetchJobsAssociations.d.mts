export type AssociationJob = {
  title: string;
  company: string;
  location: string;
  province: string;
  sourceUrl: string;
  description: string | null;
  jobType: string;
};

export function parseAwwOA(html: string): AssociationJob[];
export function parseSwwa(html: string): AssociationJob[];
export function parseCwwa(html: string): AssociationJob[];
export function parseCwra(html: string): AssociationJob[];
export function ingestAssociations(
  upsertJob: (job: unknown) => Promise<void>
): Promise<{
  errors: string[];
  totalFetched: number;
  successfulSources: number;
  failedSources: number;
}>;
