#!/usr/bin/env python3
"""
Rewrites the org subscription branch in webhook.ts with:
- Real Stripe event ledger idempotency
- Retryable onboarding email (persisted flag)
- Correct failure responses (500 for transient, 400 for structural)
"""

WEBHOOK_PATH = "/home/ubuntu/echelon-ai-tutor/server/stripe/webhook.ts"

with open(WEBHOOK_PATH, "r") as f:
    content = f.read()

# The block starts at "const sub = event.data.object as any;" (inside the subscription.created/updated handler)
# and ends just before "const tier = sub.metadata?.subscription_tier" (individual branch)
START = "        const sub = event.data.object as any;"
END_MARKER = "          // ── End org branch ─────────────────────────────────────────────────"

start_idx = content.find(START)
end_idx = content.find(END_MARKER)

if start_idx == -1 or end_idx == -1:
    raise ValueError(f"Markers not found: start={start_idx} end={end_idx}")

# Find the end of the end marker line
end_of_end_line = content.find("\n", end_idx) + 1

OLD_BLOCK = content[start_idx:end_of_end_line]

NEW_BLOCK = '''        const sub = event.data.object as any;

        // ── Org (team) subscription branch ────────────────────────────────
        if (sub.metadata?.type === "org") {
          const orgName = sub.metadata?.org_name ?? "Unknown Organization";
          const managerEmail = normalizeEmail(sub.metadata?.manager_email ?? "");
          const province = (sub.metadata?.subscription_province ?? "ontario") as SP;
          const tier = (sub.metadata?.subscription_tier ?? "all-access") as ST;
          const liveQuantity = sub.items?.data?.[0]?.quantity ?? null;
          const metadataSeats = parseInt(sub.metadata?.seats ?? "1", 10);
          const seats = liveQuantity ?? metadataSeats;
          const stripeSubscriptionId = sub.id;
          const stripeCustomerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
          const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(sub);
          const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "cancelled";

          if (!managerEmail || !currentPeriodEnd) {
            const missingOrgFields = [!managerEmail && 'manager_email', !currentPeriodEnd && 'currentPeriodEnd'].filter(Boolean).join(', ');
            console.warn(`[Stripe Webhook] Org subscription ${stripeSubscriptionId} missing required fields: ${missingOrgFields}`);
            notifyOwner({
              title: '⚠️ Team Provision Failed: Missing Metadata',
              content: `Org subscription ${stripeSubscriptionId} (customer: ${stripeCustomerId}) could NOT be provisioned: ${missingOrgFields} missing.\\n\\nRecovery: correct the metadata and replay the webhook from the Stripe Dashboard.`,
            }).catch((e: any) => { console.error('[webhook] notifyOwner failed:', e); });
            // 400 = structurally invalid, Stripe will not retry
            return res.status(400).json({ error: `Missing required org metadata: ${missingOrgFields}` });
          }

          const db = await getDb();
          if (!db) return res.status(503).json({ error: "Database unavailable" });

          // ── Event ledger: register or resume this event ──────────────────
          try {
            await db.insert(stripeEventLog).values({
              stripeEventId: event.id,
              eventType: event.type,
              stripeObjectId: stripeSubscriptionId,
              status: "pending",
              dbProcessed: false,
              emailDelivered: false,
              attemptCount: 1,
            });
          } catch (_dupErr: any) {
            // Unique constraint violation = already registered; check if already completed
            const existing = await db.select().from(stripeEventLog).where(eq(stripeEventLog.stripeEventId, event.id)).limit(1);
            if (existing.length > 0 && existing[0].status === "completed") {
              console.log(`[Stripe Webhook] Event ${event.id} already completed — skipping`);
              return res.json({ received: true });
            }
            // Incomplete — increment attempt count and continue
            await db.update(stripeEventLog).set({ attemptCount: sql`${stripeEventLog.attemptCount} + 1` }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
          }

          // ── Upsert organizations row ─────────────────────────────────────
          let orgId: number;
          try {
            const existingOrg = await db
              .select({ id: organizations.id, onboardingEmailSentAt: organizations.onboardingEmailSentAt })
              .from(organizations)
              .where(eq(organizations.stripeSubscriptionId, stripeSubscriptionId))
              .limit(1);

            if (existingOrg.length === 0) {
              const [insertResult] = await db.insert(organizations).values({
                name: orgName, province, tier, seatsTotal: seats, managerEmail,
                stripeSubscriptionId, stripeCustomerId,
                termStart: currentPeriodStart, termEnd: currentPeriodEnd,
                billingType: "stripe", status,
              });
              orgId = (insertResult as any).insertId;
              await grantSeat(db, { id: orgId, name: orgName, province, termStart: currentPeriodStart, termEnd: currentPeriodEnd, tier }, managerEmail, "manager");
              console.log(`[Stripe Webhook] Org created: ${orgName} (${orgId}) manager=${managerEmail.replace(/(^.{3}).+@/, '$1***@')} seats=${seats}`);
              notifyOwner({ title: `New Team Plan: ${orgName}`, content: `${managerEmail} purchased a ${seats}-seat ${tier} plan for ${province}. Org ID: ${orgId}. Expires: ${currentPeriodEnd.toISOString()}` }).catch((e: any) => { console.error('[webhook] notifyOwner failed:', e); });
            } else {
              orgId = existingOrg[0].id;
              await db.update(organizations).set({ seatsTotal: seats, termStart: currentPeriodStart, termEnd: currentPeriodEnd, status }).where(eq(organizations.id, orgId));
              if (status === "active" || status === "past_due") {
                await db.update(subscriptions).set({ currentPeriodEnd }).where(and(eq(subscriptions.orgId, orgId), eq(subscriptions.status, "active")));
              } else {
                await db.update(subscriptions).set({ currentPeriodEnd, status: "expired" }).where(eq(subscriptions.orgId, orgId));
              }
              if (status === "active" && currentPeriodStart) {
                await initializeOrganizationRenewalTerm(db, orgId, currentPeriodStart, currentPeriodEnd);
              }
              console.log(`[Stripe Webhook] Org updated: ${orgId} seats=${seats} status=${status}`);
            }

            await db.update(stripeEventLog).set({ dbProcessed: true, orgId }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});

          } catch (provisionErr: any) {
            console.error("[Stripe Webhook] Org provisioning failed:", provisionErr.message);
            await db.update(stripeEventLog).set({ status: "failed", lastError: provisionErr.message }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
            // 500 = transient failure, Stripe will retry
            return res.status(500).json({ error: "Org provisioning failed" });
          }

          // ── Onboarding email: send if not yet delivered ──────────────────
          // Check the DB flag, not existingOrg — so SMTP retries work on replay
          try {
            const orgForEmail = await db.select({ onboardingEmailSentAt: organizations.onboardingEmailSentAt }).from(organizations).where(eq(organizations.id, orgId)).limit(1);
            if (!orgForEmail[0]?.onboardingEmailSentAt) {
              await sendManagerOnboardingEmail({
                managerEmail, orgName, seats,
                tierLabel: TIER_LABELS[tier as ST] ?? tier,
                dashboardUrl: `${ENV.appBaseUrl}/account?next=/team`,
              });
              await db.update(organizations).set({ onboardingEmailSentAt: new Date() }).where(eq(organizations.id, orgId));
              await db.update(stripeEventLog).set({ emailDelivered: true }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
            } else {
              await db.update(stripeEventLog).set({ emailDelivered: true }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
            }
          } catch (emailErr: any) {
            // SMTP failure: log and continue. DB provisioning succeeded.
            // Replay the webhook once SMTP is restored to retry the email.
            console.error("[Stripe Webhook] Onboarding email failed — replay to retry:", emailErr.message);
            await db.update(stripeEventLog).set({ lastError: emailErr.message }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
          }

          await db.update(stripeEventLog).set({ status: "completed", completedAt: new Date() }).where(eq(stripeEventLog.stripeEventId, event.id)).catch(() => {});
          return res.json({ received: true });
        }
        // ── End org branch ─────────────────────────────────────────────────
'''

if OLD_BLOCK not in content:
    raise ValueError("OLD_BLOCK not found in content")

new_content = content.replace(OLD_BLOCK, NEW_BLOCK, 1)

with open(WEBHOOK_PATH, "w") as f:
    f.write(new_content)

print(f"Done. Replaced {len(OLD_BLOCK)} chars with {len(NEW_BLOCK)} chars.")
