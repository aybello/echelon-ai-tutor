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
import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import { certificateAlerts, certificates } from "../../drizzle/schema";
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
  markAlertUncertain,
} from "../certificates/certificateService";
import { getDb } from "../db";
import { sendCertificateExpiryEmail } from "../email";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function runCertificateExpiryAlerts(
  assertOwned: () => Promise<void> = async () => {}
): Promise<{ sent: number; considered: number; errors: string[] }> {
  const db = await getDb();
  if (!db) return { sent: 0, considered: 0, errors: ["Database unavailable"] };
  const errors: string[] = [];
  let sent = 0;
  let considered = 0;

  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const windowStart = new Date(todayStart.getTime() - 7 * DAY_MS);
  const windowEnd = new Date(todayStart.getTime() + 91 * DAY_MS - 1);

  const rows = await db
    .select()
    .from(certificates)
    .where(
      and(
        gte(certificates.expiresAt, windowStart),
        lte(certificates.expiresAt, windowEnd)
      )
    );

  const siteUrl = process.env.FRONTEND_URL ?? "https://echeloninstitute.ca";
  const retryLedgerRows = await db
    .select({
      certificateId: certificateAlerts.certificateId,
      thresholdDays: certificateAlerts.thresholdDays,
      expiresAt: certificateAlerts.expiresAt,
    })
    .from(certificateAlerts)
    .where(
      or(
        eq(certificateAlerts.status, "failed"),
        and(
          eq(certificateAlerts.status, "pending"),
          or(
            isNull(certificateAlerts.leaseUntil),
            lte(certificateAlerts.leaseUntil, now)
          )
        )
      )
    );
  const retryThresholds = new Map<number, Set<number>>();
  for (const alert of retryLedgerRows) {
    const set = retryThresholds.get(alert.certificateId) ?? new Set<number>();
    set.add(alert.thresholdDays);
    retryThresholds.set(alert.certificateId, set);
  }
  const retryCertificates = await Promise.all(
    [...retryThresholds.keys()].map(async certificateId => {
      const [cert] = await db
        .select()
        .from(certificates)
        .where(eq(certificates.id, certificateId))
        .limit(1);
      return cert ?? null;
    })
  );
  const workRows = [...rows];
  for (const cert of retryCertificates) {
    if (cert && !workRows.some(row => row.id === cert.id)) workRows.push(cert);
  }

  for (const cert of workRows) {
    await assertOwned();
    const days = daysUntilExpiry(cert.expiresAt, now);
    const thresholdCandidates = new Set<number>();
    const dueThreshold = dueAlertThreshold(days);
    if (dueThreshold !== null) thresholdCandidates.add(dueThreshold);
    for (const retryThreshold of retryThresholds.get(cert.id) ?? []) {
      const matchingLedgerRow = retryLedgerRows.some(
        alert =>
          alert.certificateId === cert.id &&
          alert.thresholdDays === retryThreshold &&
          alert.expiresAt.getTime() === cert.expiresAt.getTime()
      );
      if (matchingLedgerRow) thresholdCandidates.add(retryThreshold);
    }
    if (thresholdCandidates.size === 0) continue;
    const [live] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.id, cert.id))
      .limit(1);
    if (!live || live.expiresAt.getTime() !== cert.expiresAt.getTime())
      continue;
    considered += 1;
    const currentCert = live;

    for (const threshold of thresholdCandidates) {
      let recipients: Awaited<ReturnType<typeof getAlertRecipients>>;
      try {
        recipients = await getAlertRecipients(db, currentCert);
      } catch (error) {
        errors.push(
          `Certificate ${cert.id}: could not resolve alert recipients (${error instanceof Error ? error.message : String(error)})`
        );
        continue;
      }

      const courseKey = courseKeyForCertificateType(
        currentCert.certificateType
      );
      const quizPath = courseKey ? getCourseByKey(courseKey)?.quizPath : null;
      const courseUrl = quizPath ? `${siteUrl}${quizPath}` : undefined;

      const targets: Array<{ email: string; isOperator: boolean }> = [
        ...recipients.managerEmails.map(email => ({
          email,
          isOperator: false,
        })),
        ...(recipients.operatorEmail
          ? [{ email: recipients.operatorEmail, isOperator: true }]
          : []),
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
            const [fresh] = await db
              .select()
              .from(certificates)
              .where(eq(certificates.id, currentCert.id))
              .limit(1);
            const freshRecipients = fresh
              ? await getAlertRecipients(db, fresh)
              : null;
            const freshCourseKey = fresh
              ? courseKeyForCertificateType(fresh.certificateType)
              : null;
            const freshQuizPath = freshCourseKey
              ? getCourseByKey(freshCourseKey)?.quizPath
              : null;
            const freshCourseUrl = freshQuizPath
              ? `${siteUrl}${freshQuizPath}`
              : undefined;
            const recipientStillAuthorized = freshRecipients
              ? target.isOperator
                ? freshRecipients.operatorEmail?.toLowerCase() === email
                : freshRecipients.managerEmails.some(
                    managerEmail => managerEmail.toLowerCase() === email
                  )
              : false;
            if (
              !fresh ||
              fresh.expiresAt.getTime() !== currentCert.expiresAt.getTime() ||
              fresh.certificateType !== currentCert.certificateType ||
              !recipientStillAuthorized
            ) {
              await markAlertFailed(
                db,
                claim.id,
                claim.token,
                "Certificate or recipient authorization changed before delivery."
              );
              continue;
            }
            if (!fresh || !freshRecipients) continue;
            await assertOwned();
            await sendCertificateExpiryEmail({
              email,
              orgName: freshRecipients.orgName,
              operatorName: fresh.operatorName,
              certificateLabel: certificateTypeLabel(fresh.certificateType),
              certificateNumber: fresh.certificateNumber,
              expiresAt: fresh.expiresAt,
              thresholdDays: threshold,
              isOperator: target.isOperator,
              courseUrl: freshCourseUrl,
              dashboardUrl: target.isOperator
                ? `${siteUrl}/account`
                : `${siteUrl}/team`,
            });
            if (await markAlertSent(db, claim.id, claim.token)) {
              sent += 1;
            } else {
              const finalized = await markAlertUncertain(
                db,
                claim.id,
                claim.token,
                "SMTP accepted the message but alert ledger finalization was not confirmed; automatic retry disabled."
              );
              throw new Error(
                finalized
                  ? "Alert delivery is uncertain; automatic retry disabled."
                  : "Alert delivery is uncertain and could not be fenced; manual reconciliation required."
              );
            }
          } catch (sendError) {
            await markAlertFailed(
              db,
              claim.id,
              claim.token,
              sendError instanceof Error ? sendError.message : String(sendError)
            );
            throw sendError;
          }
        } catch (error) {
          errors.push(
            `Certificate ${cert.id} to ${email}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }
  }

  if (sent > 0)
    console.log(
      `[certificate-expiry-alerts] sent ${sent} alert(s) across ${considered} certificate(s) at a threshold today`
    );
  return { sent, considered, errors };
}
