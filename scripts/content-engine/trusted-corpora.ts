/**
 * Prior full-corpus completeness approvals, maintained in committed source only.
 * Entries must bind a canonical whole document SHA-256 to a separately reviewed
 * inventory/scope and approval record. Never populate from the compilation request,
 * environment, an automatic self-hash, or an unreviewed private file.
 * A documentary declaration is not authentication or proof of actual completeness.
 * No genuine full-corpus approval is available yet: checked builds fail closed.
 */
export type CorpusApproval = Readonly<{
  corpusSha256: string;
  scope: string;
  inventoryEvidence: string;
  approvalEvidence: string;
}>;
export const approvedCorpora: Readonly<Record<string, CorpusApproval>> = Object.freeze({});
