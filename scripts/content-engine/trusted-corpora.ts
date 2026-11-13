/**
 * Prior full-corpus completeness approvals, maintained in committed source only.
 * Entries must bind a canonical whole document SHA-256 to a separately reviewed
 * inventory/scope and approval record. Never populate from the compilation request,
 * environment, an automatic self-hash, or an unreviewed private file.
 * A documentary declaration is not authentication or proof of actual completeness.
 * Only the separately reviewed, owner-authorized OIT AI release is active.
 * This is documentary AI approval, never a human technical-review claim.
 */
import oitApproval from "../../server/interactiveContent/reviewed-2026-11-13/approval.json";
import oitPins from "../../server/interactiveContent/reviewed-2026-11-13/active-pins.json";

export type CorpusApproval = Readonly<{
  corpusSha256: string;
  scope: string;
  inventoryEvidence: string;
  approvalEvidence: string;
  // Required by the committed-bank adapter, optional for private legacy inputs.
  committedBankSha256?: string;
  // Public, randomly generated UUIDv4. Never reuse for a changed release.
  releaseToken: string;
  // Exact sorted courseKey/exerciseId selections, and private checked versions.
  selected: readonly string[];
  checkedVersions: Readonly<Record<string, string>>;
}>;
export const approvedCorpora: Readonly<Record<string, CorpusApproval>> = Object.freeze({
  [oitApproval.approvalId]: Object.freeze(oitApproval.approval),
});

/** Separately reviewed exact compiled manifest bytes, one active checked release per
 * course. The manifest commits to full shard and legacy bytes. Never derive these
 * pins automatically from mutable output or from a compilation request. */
export type ActiveCheckedRelease = Readonly<{ approvalId: string; manifestSha256: string }>;
export const activeCheckedReleases: Readonly<Record<string, ActiveCheckedRelease>> = Object.freeze(oitPins);

export function activeCheckedRelease(courseKey: string): ActiveCheckedRelease | undefined {
  if (!Object.hasOwn(activeCheckedReleases, courseKey)) return undefined;
  const pin = activeCheckedReleases[courseKey];
  if (!pin || typeof pin.approvalId !== "string" || !pin.approvalId || !/^[a-f0-9]{64}$/.test(pin.manifestSha256) || !trustedApproval(pin.approvalId))
    throw new Error("Invalid active checked release binding");
  return pin;
}

// This validates syntax and uniqueness, not the provenance or randomness of a token.
export const releaseTokenPattern = /^checked-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export function validateTrustedApproval(id: string, approvedCorpora: Readonly<Record<string, CorpusApproval>>): CorpusApproval | undefined {
  if (!Object.hasOwn(approvedCorpora, id)) return undefined;
  const approval = approvedCorpora[id];
  if (!approval || ![approval.scope, approval.inventoryEvidence, approval.approvalEvidence].every(v => typeof v === "string" && v.trim().length > 0) ||
      !/^[a-f0-9]{64}$/.test(approval.corpusSha256) || typeof approval.releaseToken !== "string" || !releaseTokenPattern.test(approval.releaseToken) ||
      (approval.committedBankSha256 !== undefined && !/^[a-f0-9]{64}$/.test(approval.committedBankSha256)) ||
      !Array.isArray(approval.selected) || !approval.selected.length || approval.selected.some(v => typeof v !== "string" || !/^[a-z0-9-]+\/[a-zA-Z0-9_-]+$/.test(v)) ||
      new Set(approval.selected).size !== approval.selected.length || JSON.stringify([...approval.selected].sort()) !== JSON.stringify(approval.selected) ||
      !approval.checkedVersions || typeof approval.checkedVersions !== "object" || Array.isArray(approval.checkedVersions) ||
      Object.values(approval.checkedVersions).some(v => typeof v !== "string" || !/^checked-[a-f0-9]{32}$/.test(v)) ||
      JSON.stringify(Object.keys(approval.checkedVersions).sort()) !== JSON.stringify([...new Set(approval.selected.map(v => v.split("/")[0]))].sort()) ||
      Object.entries(approvedCorpora).some(([otherId, other]) => otherId !== id && other?.releaseToken === approval.releaseToken)) return undefined;
  return approval;
}

export const trustedApproval = (id: string) => validateTrustedApproval(id, approvedCorpora);
