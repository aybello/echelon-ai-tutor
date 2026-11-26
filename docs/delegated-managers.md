# Delegated team managers

`organizations.managerEmail` remains the primary owner and billing identity. An explicitly approved manager-only membership uses the existing `organization_members` varchar role column with `role = delegated_manager`, `status = assigned`, and both `courseKey` and `courseKeys` null. Legacy `role = manager` memberships are not delegated access grants.

Current delegates can sign in through the existing email-code flow, discover their teams in the existing organization chooser, and use existing roster, reporting, assignment, revocation, enrollment retry and reminder APIs. Every request resolves the verified identity and selected organization again; supplying `orgId` never grants access. Revoked or malformed delegates and pending, cancelled or expired organizations do not gain access. Existing paid Flex reporting windows retain manager reporting access but do not extend Annual learner assignment rights.

## Primary-owner-only APIs

The org router provides:

- `listDelegatedManagers({ orgId? })`: lists explicit delegated memberships, including revoked history.
- `addDelegatedManager({ orgId?, email, name? })`: normalizes the identity, safely adds or reactivates manager-only delegation, and accepts an already assigned duplicate idempotently.
- `removeDelegatedManager({ orgId?, email })`: marks only the delegated membership revoked; repeated removal is safe.

All three require the primary owner. The existing chooser semantics apply if the owner has more than one eligible team. No global account or admin role is created or changed. No dedicated manager-management UI is included in this patch.

Adding delegation rejects existing operator memberships (including revoked, empty-course operators), legacy managers, course-bearing delegates and orphaned org subscription or licence-usage history. The owner cannot be added or removed through delegation. Normal single/bulk Annual assignment also rejects explicit delegated memberships before ledger or subscription writes. These changes share the existing organization transaction lock to avoid an operator/delegate collision.

Delegation never writes `seatsTotal`, subscriptions or the named-operator usage ledger, and revocation never deletes paid usage history. Operators assigned by the primary owner or any delegate share exactly the same org-locked Annual licence pool. Team billing portal access, Annual quantity changes and purchases into an existing team remain primary-owner-only; independent personal billing is unchanged.

## Validation and release boundary

`server/teams/delegatedManagers.test.ts` exercises the real routers against a fully mocked JavaScript Drizzle builder: no SQL engine, database connection, socket, real email delivery or Stripe request. Existing focused resolver, entitlement, OTP and Account tests cover owner regressions. MySQL lock concurrency remains the existing implementation pattern, not a claim proven by these synthetic tests.

This is code preparation only. No organization, delegate or entitlement activation is performed by preparing or testing the feature. Customer provisioning must wait for completed payment and separate authorization. There is no migration, billing-model change or increase in purchased operator licences.
