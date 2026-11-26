import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { interactiveDrillExampleSchema } from "../../shared/interactiveSessions";
import {
  canonicalJson,
  compileLegacyRelease,
  digest,
  eligibleCourseKeys,
  type ClassifiedExample,
} from "../../server/interactiveContent/engine/compiler";
import {
  activeCheckedRelease,
  activeCheckedReleases,
  trustedApproval,
  type CorpusApproval,
} from "./trusted-corpora";

/** Server/build-only: never scan private authoring stores or choose a bank from env. */
export const committedReleasePath = fileURLToPath(
  new URL("../../server/interactiveContent/reviewed-2026-11-13/release.json", import.meta.url)
);
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const maxBankBytes = 64 * 1024 * 1024;
export const committedReleaseSchema = z.object({
  format: z.literal("reviewed-interactive-release-v1"),
  approvalId: z.string().min(1).max(120),
  corpusSha256: z.string().regex(/^[a-f0-9]{64}$/),
  records: z.array(z.object({
    courseKey: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
    example: interactiveDrillExampleSchema,
    topicId: z.literal("unclassified"),
    difficulty: z.enum(["easy", "medium", "hard"]),
  }).strict()).min(1).max(38 * 12000),
}).strict();

/** Read exactly one regular, server-only file. Missing is distinct from invalid. */
function readCommittedBank(): Buffer | undefined {
  let stat;
  try { stat = lstatSync(committedReleasePath); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > maxBankBytes ||
      realpathSync(committedReleasePath) !== resolve(realpathSync(repoRoot), "server/interactiveContent/reviewed-2026-11-13/release.json"))
    throw new Error("Invalid committed reviewed release file");
  const bytes = readFileSync(committedReleasePath);
  if (!bytes.length || bytes.length > maxBankBytes || !Buffer.from(bytes.toString("utf8")).equals(bytes))
    throw new Error("Invalid committed reviewed release bytes");
  return bytes;
}

/** Default build path. Prior committed registries supply every trust decision;
 * this payload contains no authoring evidence and cannot establish its own approval.
 * The unchanged compiler independently enforces all active exact manifest pins. */
export function compileApprovedOrLegacyRelease(outputDir?: string) {
  const bytes = readCommittedBank();
  if (bytes === undefined) return compileLegacyRelease({ outputDir });
  const raw: unknown = JSON.parse(bytes.toString("utf8"));
  const bank = committedReleaseSchema.parse(raw);
  // Reject payloads changed by parser normalization, rather than silently trimming.
  if (!isDeepStrictEqual(raw, bank)) throw new Error("Noncanonical committed reviewed release payload");
  const approval = trustedApproval(bank.approvalId);
  if (!approval || approval.corpusSha256 !== bank.corpusSha256)
    throw new Error("No trusted prior approval for committed reviewed release");
  // Optional for legacy/private approval entries, mandatory for this bank path.
  const bankSha256 = (approval as CorpusApproval & { committedBankSha256?: string }).committedBankSha256;
  if (!bankSha256 || !/^[a-f0-9]{64}$/.test(bankSha256) || digest(bytes) !== bankSha256)
    throw new Error("Committed reviewed release bytes do not match trusted approval");
  const eligible = new Set(eligibleCourseKeys());
  const keys = bank.records.map(row => `${row.courseKey}/${row.example.id}`);
  if (new Set(keys).size !== keys.length) throw new Error("Duplicate committed reviewed release item id");
  if (bank.records.some(row => !eligible.has(row.courseKey))) throw new Error("Noncanonical or ineligible reviewed release course");
  if (canonicalJson([...keys].sort()) !== canonicalJson(approval.selected))
    throw new Error("Committed reviewed release selection does not match trusted approval");
  const additions = new Map<string, ClassifiedExample[]>();
  for (const { courseKey, example, topicId, difficulty } of bank.records) {
    const rows = additions.get(courseKey) ?? [];
    rows.push({ example, topicId, difficulty });
    additions.set(courseKey, rows);
  }
  if (canonicalJson([...additions.keys()].sort()) !== canonicalJson(Object.keys(approval.checkedVersions).sort()))
    throw new Error("Committed reviewed release course scope does not match trusted approval");
  for (const [courseKey, rows] of additions) {
    if (approval.checkedVersions[courseKey] !== `checked-${digest(canonicalJson(rows)).slice(0, 32)}`)
      throw new Error("Committed reviewed release records do not match trusted checked versions");
    const pin = activeCheckedRelease(courseKey);
    if (!pin || pin.approvalId !== bank.approvalId) throw new Error("Committed reviewed release has no matching active course pin");
  }
  for (const courseKey of Object.keys(activeCheckedReleases)) {
    const pin = activeCheckedRelease(courseKey);
    if (!eligible.has(courseKey) || !additions.has(courseKey) || pin?.approvalId !== bank.approvalId)
      throw new Error("Active checked course missing or mismatched in committed reviewed release");
  }
  const result = compileLegacyRelease({
    outputDir,
    additionalRecords: additions,
    checkedRelease: { approvalId: bank.approvalId, publicVersion: approval.releaseToken },
  });
  return { ...result, newItemCount: bank.records.length };
}
