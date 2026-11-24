/**
 * Certificate Expiry Alert Job
 * Runs daily (managed job "certificate-expiry-alerts"). For every tracked
 * operator certificate, when today is exactly 90, 60, 30, 7, or 0 days before
 * its expiry date, it emails the organization's managers and the operator.
 * Every successful send is logged in certificate_alerts, keyed by
 * (certificate, threshold, expiry date, recipient), so a re-run the same day
 * never sends a duplicate, and a renewal (new expiry date) starts a fresh
 * alert cycle.
 */
import { and, eq, gte, lte } from "drizzle-orm";
import { certificates } from "../../drizzle/schema";
import {
  certificateTypeLabel,
  courseKeyForCertificateType,
  daysUntilExpiry,
  dueAlertThreshold,
} from "../../shared/certificates";
import { getCourseByKey } from "../../shared/courseRegistry";
import {
  findUserIdByEmail,
  getAlertRecipients,
  claimAlertSend,
  markAlertFailed,
  markAlertSent,
} from "../certificates/certificateService";
import { getDb } from "../db";
import { sendCertificateExpiryEmail } from "../email";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function runCertificateExpiryAlerts(
  assertOwned: () => Promise<void> = async () => {},
): Promise<{ sent: number; considered: number; errors: string[] }> {
  const db = await getDb();
  if (!db) return { sent: 0, considered: 0, errors: ["Database unavailable"] };
  const errors: string[] = [];
  let sent = 0;
  let considered = 0;

  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const windowStart = new Date(todayStart.getTime() - 7 * DAY_MS);
  const windowEnd = new Date(todayStart.getTime() + 91 * DAY_MS - 1);

  const rows = await db
    .select()
    .from(certificates)
    .where(and(gte(certificates.expiresAt, windowStart), lte(certificates.expiresAt, windowEnd)));

  const siteUrl = process.env.FRONTEND_URL ?? "https://echeloninstitute.ca";

  for (const cert of rows) {
    await assertOwned();
    const days = daysUntilExpiry(cert.expiresAt, now);
    const threshold = dueAlertThreshold(days);
    if (threshold === null) continue;
    const [live] = await db.select().from(certificates).where(eq(certificates.id, cert.id)).limit(1);
    if (!live || live.expiresAt.getTime() !== cert.expiresAt.getTime() || dueAlertThreshold(daysUntilExpiry(live.expiresAt, now)) !== threshold) continue;
    considered += 1;
    const currentCert = live;

    let recipients: Awaited<ReturnType<typeof getAlertRecipients>>;
    try {
      recipients = await getAlertRecipients(db, currentCert);
    } catch (error) {
      errors.push(`Certificate ${cert.id}: could not resolve alert recipients (${error instanceof Error ? error.message : String(error)})`);
      continue;
    }

    const courseKey = courseKeyForCertificateType(currentCert.certificateType);
    const quizPath = courseKey ? getCourseByKey(courseKey)?.quizPath : null;
    const courseUrl = quizPath ? `${siteUrl}${quizPath}` : undefined;

    const targets: Array<{ email: string; isOperator: boolean }> = [
      ...recipients.managerEmails.map((email) => ({ email, isOperator: false })),
      ...(recipients.operatorEmail ? [{ email: recipients.operatorEmail, isOperator: true }] : []),
    ];
    const seen = new Set<string>();
    for (const target of targets) {
      const email = target.email.toLowerCase();
      if (seen.has(email)) continue;
      seen.add(email);
      try {
        await assertOwned();
        const claim = await claimAlertSend(db, {
          certificateId: currentCert.id,
          thresholdDays: threshold,
          expiresAt: currentCert.expiresAt,
          recipientEmail: email,
          recipientUserId: await findUserIdByEmail(db, email),
        });
        if (!claim) continue;
        try {
          const [fresh] = await db.select().from(certificates).where(eq(certificates.id, currentCert.id)).limit(1);
          if (!fresh || fresh.expiresAt.getTime() !== currentCert.expiresAt.getTime()) { await markAlertFailed(db, claim.id, claim.token, "Certificate changed before delivery."); continue; }
          await assertOwned();
          await sendCertificateExpiryEmail({
            email,
            orgName: recipients.orgName,
            operatorName: fresh.operatorName,
            certificateLabel: certificateTypeLabel(fresh.certificateType),
            certificateNumber: fresh.certificateNumber,
            expiresAt: fresh.expiresAt,
            thresholdDays: threshold,
            isOperator: target.isOperator,
            courseUrl,
            dashboardUrl: target.isOperator ? `${siteUrl}/account` : `${siteUrl}/team`,
          });
          if (await markAlertSent(db, claim.id, claim.token)) sent += 1;
        } catch (sendError) {
          await markAlertFailed(db, claim.id, claim.token, sendError instanceof Error ? sendError.message : String(sendError));
          throw sendError;
        }
      } catch (error) {
        errors.push(`Certificate ${cert.id} to ${email}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  if (sent > 0) console.log(`[certificate-expiry-alerts] sent ${sent} alert(s) across ${considered} certificate(s) at a threshold today`);
  return { sent, considered, errors };
}
