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
  // Public, randomly generated UUIDv4. Never reuse for a changed release.
  releaseToken: string;
  // Exact sorted courseKey/exerciseId selections, and private checked versions.
  selected: readonly string[];
  checkedVersions: Readonly<Record<string, string>>;
}>;
export const approvedCorpora: Readonly<Record<string, CorpusApproval>> = Object.freeze({});

// This validates syntax and uniqueness, not the provenance or randomness of a token.
export const releaseTokenPattern = /^checked-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export function validateTrustedApproval(id: string, approvedCorpora: Readonly<Record<string, CorpusApproval>>): CorpusApproval | undefined {
  if (!Object.hasOwn(approvedCorpora, id)) return undefined;
  const approval = approvedCorpora[id];
  if (!approval || ![approval.scope, approval.inventoryEvidence, approval.approvalEvidence].every(v => typeof v === "string" && v.trim().length > 0) ||
      !/^[a-f0-9]{64}$/.test(approval.corpusSha256) || typeof approval.releaseToken !== "string" || !releaseTokenPattern.test(approval.releaseToken) ||
      !Array.isArray(approval.selected) || !approval.selected.length || approval.selected.some(v => typeof v !== "string" || !/^[a-z0-9-]+\/[a-zA-Z0-9_-]+$/.test(v)) ||
      new Set(approval.selected).size !== approval.selected.length || JSON.stringify([...approval.selected].sort()) !== JSON.stringify(approval.selected) ||
      !approval.checkedVersions || typeof approval.checkedVersions !== "object" || Array.isArray(approval.checkedVersions) ||
      Object.values(approval.checkedVersions).some(v => typeof v !== "string" || !/^checked-[a-f0-9]{32}$/.test(v)) ||
      JSON.stringify(Object.keys(approval.checkedVersions).sort()) !== JSON.stringify([...new Set(approval.selected.map(v => v.split("/")[0]))].sort()) ||
      Object.entries(approvedCorpora).some(([otherId, other]) => otherId !== id && other?.releaseToken === approval.releaseToken)) return undefined;
  return approval;
}

export const trustedApproval = (id: string) => validateTrustedApproval(id, approvedCorpora);
