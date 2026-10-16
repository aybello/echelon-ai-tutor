# Audit fixes: email follow-up, learning records and browser checks

The email capture now retains a canonical product and recognized province or US
state. Immediate study-plan emails, bounded follow-ups and recovery fallback links
use the same pricing-link contract as the application. Existing captures retain
their available context; a missing historic province/state cannot be reconstructed.

The optional, unchecked reminder checkbox permits at most two follow-up emails.
The date and copy version are retained. Legacy captures are not treated as consent.
An existing opt-out is never cleared by a new public study-plan request. Phone
capture remains optional and an existing lead can now update its number.

Email-wide unsubscribe and historical individual/subscription/Teams suppression
are rechecked before sending. Each email/stage uses a shared durable delivery
receipt. Concurrent workers and repeated capture rows cannot send that stage twice.
An ambiguous SMTP result remains held for inspection; it is never automatically
resent. A known missing SMTP configuration does not consume a delivery receipt.
This intentionally favours avoiding duplicate messages over automatic retry after
uncertain delivery. These suppression checks do not grant course access or count
subscription rows as cash revenue.

Dated official-exam reports identify one sitting by organization, normalized email,
canonical course and calendar date. Retakes retain previous results. Retried reports
and corrections to the same sitting do not create another outcome. Matching legacy
dates can be adopted without deleting other records. Records already overwritten
before this fix cannot be recovered by this change.

Readiness for an outcome is reconstructed from attempts strictly before the exam
day because the exam's time is unknown. Current bank topic definitions are still
used; this is a reconstruction, not proof of the score displayed on that past day.
Undated manager reports do not receive a readiness score. Model versions are bumped
so old report-time scores are excluded from the new model's calibration cohort.
The model remains uncalibrated and must not be marketed as a pass prediction.

US sludge-mass instructions now change with the unit selector, and browser tests
use an accessible sign-in field name. The Process Guide request assertion matches
actual renderer chunks without confusing the small lazy-loader module with 3D.

## Release order

1. Verify a database backup and the current migration ledger using the existing
   migration procedure. Apply additive migration `0080_lead_context_and_exam_attempts`
   before deploying this application version. The SQL does not backfill consent,
   delete outcomes or change existing prices or licences.
2. Run the full Quality and Public Tree Privacy gates on the exact release commit.
   The Quality gate includes isolated MySQL coverage of concurrent sends, ambiguous
   SMTP, historical buyers and duplicate opt-outs, alongside forward migration rehearsal.
3. Deploy only after both checks pass. Validate one synthetic study-plan request and
   one synthetic dated outcome in the designated non-production environment.

Rollback: deploy the preceding application version; retain the additive columns and
index. Do not clear delivery receipts or consent history to retry a deployment.
The old worker does not enforce the new permission policy, so keep its scheduled
lead follow-up disabled if an application rollback is necessary.

Repository administration is separate: require `validate` and `privacy` checks and
reviewed pull requests on `main`. This source change cannot enable GitHub branch
protection through the available repository connector.
