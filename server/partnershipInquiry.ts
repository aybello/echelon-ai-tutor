import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { contactSubmissions } from "../drizzle/schema";
import { partnershipInquirySchema, type PartnershipInquiryInput } from "../shared/partnershipInquiry";
import { getDb } from "./db";
import { sendContactEmail } from "./email";
import { notifyOwner } from "./_core/notification";

export interface PartnershipLead {
  id: number;
  requestKey: string;
  name: string;
  email: string;
  organization: string;
  partnershipType: string;
  message: string;
}
export interface PartnershipStore {
  save: (input: Omit<PartnershipLead, "id">) => Promise<{ lead: PartnershipLead; created: boolean }>;
  notificationStatus: (id: number, status: "sent" | "failed") => Promise<void>;
}
export interface PartnershipDependencies {
  store: PartnershipStore;
  notify: (lead: PartnershipLead) => Promise<void>;
  reportFailure: (id: number) => void;
}

/** A retry with the same key can only acknowledge the exact original saved fields. */
export async function receivePartnershipInquiry(raw: PartnershipInquiryInput, deps: PartnershipDependencies) {
  const input = partnershipInquirySchema.parse(raw);
  if (input.website) throw new TRPCError({ code: "BAD_REQUEST", message: "Unable to accept this inquiry." });
  const { website: _website, ...fields } = input;
  let saved: Awaited<ReturnType<PartnershipStore["save"]>>;
  try {
    saved = await deps.store.save(fields);
  } catch {
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Your inquiry could not be saved. Please retry. Your form has been kept." });
  }
  if (Object.entries(fields).some(([key, value]) => saved.lead[key as keyof PartnershipLead] !== value)) {
    throw new TRPCError({ code: "CONFLICT", message: "This receipt belongs to an earlier inquiry. Please start a new inquiry." });
  }
  if (saved.created) {
    // Receipt depends only on the saved row. Durable pending/failed status is available to the owner.
    void deliverPartnershipNotification(saved.lead, deps);
  }
  return { success: true as const, receiptId: saved.lead.id };
}

export async function deliverPartnershipNotification(lead: PartnershipLead, deps: PartnershipDependencies): Promise<void> {
  try {
    await deps.notify(lead);
    await deps.store.notificationStatus(lead.id, "sent");
  } catch {
    deps.reportFailure(lead.id);
    try { await deps.store.notificationStatus(lead.id, "failed"); } catch { deps.reportFailure(lead.id); }
  }
}

function isDuplicateKey(error: unknown): boolean {
  const value = error as { code?: string; cause?: unknown } | null;
  return value?.code === "ER_DUP_ENTRY" || Boolean(value?.cause && isDuplicateKey(value.cause));
}

/** Uses the existing searchable contact table. Unique requestKey makes concurrent/lost-response retries durable. */
export async function persistedPartnershipInquiry(input: PartnershipInquiryInput) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Your inquiry could not be saved. Please retry." });
  const store: PartnershipStore = {
    async save(fields) {
      let created = true;
      try {
        await db.insert(contactSubmissions).values({
          ...fields,
          subject: "Partnership inquiry",
          followUpStatus: "new",
          notificationStatus: "pending",
        });
      } catch (error) {
        if (!isDuplicateKey(error)) throw error;
        created = false;
      }
      const [row] = await db.select().from(contactSubmissions).where(eq(contactSubmissions.requestKey, fields.requestKey)).limit(1);
      if (!row || !row.requestKey || row.organization === null || row.partnershipType === null) throw new Error("Saved receipt unavailable");
      return { lead: { ...row, requestKey: row.requestKey, organization: row.organization, partnershipType: row.partnershipType }, created };
    },
    async notificationStatus(id, status) {
      await db.update(contactSubmissions).set({ notificationStatus: status }).where(eq(contactSubmissions.id, id));
    },
  };
  return receivePartnershipInquiry(input, {
    store,
    async notify(lead) {
      const message = `Organization: ${lead.organization}\nPartnership type: ${lead.partnershipType || "Not specified"}\nFollow-up status: new\nReceipt: ${lead.id}\n\n${lead.message}`;
      // Both channels are secondary. Failure of either is recorded for owner follow-up.
      const outcomes = await Promise.allSettled([
        sendContactEmail({ name: lead.name, email: lead.email, subject: "Partnership inquiry", message }),
        notifyOwner({ title: `Partnership inquiry #${lead.id}`, content: message }).then(sent => { if (!sent) throw new Error("Owner notification unavailable"); }),
      ]);
      if (outcomes.some(outcome => outcome.status === "rejected")) throw new Error("Partnership notification incomplete");
    },
    reportFailure(id) { console.error(`[Partnership] Notification requires follow-up for receipt ${id}; saved inquiry retained.`); },
  });
}
