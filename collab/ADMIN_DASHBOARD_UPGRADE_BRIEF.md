# Manus Build Brief — Echelon Owner Admin Dashboard Upgrade

## Goal

Upgrade the current `/admin` page from a basic admin table viewer into a true **Owner Command Center** for Ay.

This dashboard is not for generic admins.

It is for the founder/owner to answer:

```txt
1. How much money did we make?
2. What is growing or slowing down?
3. Who needs attention?
4. What is broken?
5. What should Ay do next?
```

Current admin already includes tabs for:

```txt
Revenue
Subscriptions
Trial Emails
Waitlist
Error Reports
Score History
Feedback
System Health
Organizations
```

Keep those, but restructure the dashboard so the default experience is an owner-level overview.

---

# 1. Primary objective

Build a founder dashboard that shows:

```txt
Business health
Revenue performance
Customer access issues
Trial-to-paid conversion
Product/question-bank health
Team/organization activity
System issues
Clear next actions
```

The dashboard should feel like:

```txt
“What does Ay need to know and do today?”
```

Not just:

```txt
“Here are database tables.”
```

---

# 2. Access/security requirements

The owner dashboard must remain protected.

Do not weaken admin security.

Required:

```txt
/admin must remain admin-only.
All admin backend procedures must use adminProcedure or equivalent.
No customer can access admin data.
No email-session-only user can access /admin.
Only role === "admin" can access.
```

Do not move owner dashboard data into public procedures.

Do not expose sensitive configuration in public health endpoints.

Admin health can show protected internal details, but public health should stay minimal.

---

# 3. Route

Use the existing route:

```txt
/admin
```

The dashboard should open to a new default tab:

```txt
Owner Overview
```

Suggested tab order:

```txt
Owner Overview
Revenue
Customers
Subscriptions
Trials & Funnel
Product Health
Question Reports
Organizations
Feedback
System Health
Admin Actions
```

Older tabs can be preserved, but reorganized under these clearer owner-focused tabs.

---

# 4. Owner Overview tab

Create a new default tab called:

```txt
Owner Overview
```

This should be the first thing Ay sees.

## Top metric cards

Show:

```txt
Revenue Today
Revenue This Week
Revenue This Month
Total Revenue
New Purchases Today
New Purchases This Month
Active Subscribers
Trial Signups This Month
Free-to-Paid Conversion
Open Question Reports
Low-Rated Feedback
System Issues
```

Use clear formatting:

```txt
CA$1,240 this month
+18% vs last month
12 purchases this week
3 open issues
```

If comparison data is not available yet, build the structure and show “—” safely.

---

# 5. “Needs Attention” panel

Add a highly visible section near the top:

```txt
Needs Attention
```

This should summarize urgent founder actions.

Examples:

```txt
3 unresolved question reports
2 low-rated feedback submissions
18 trial users hit the limit but did not purchase
1 failed or missing Stripe reconciliation item
2 subscriptions past due
1 organization has unused seats
```

Each item should link to the relevant tab.

If there are no issues, show:

```txt
All clear. No urgent owner actions right now.
```

This is one of the most important sections.

---

# 6. Revenue analytics tab

Improve the Revenue tab beyond a purchase table.

## Required revenue views

Show:

```txt
Revenue by date
Revenue by month
Revenue by product
Revenue by exam type
Ontario vs WPI revenue
One-time purchases vs subscriptions
Average order value
Top-selling courses
Recent purchases
Refunds / failed payments if available
```

## Filters

Add filters:

```txt
Today
7 days
30 days
90 days
All time
Ontario
WPI
One-time
Subscription
Product / exam type
```

## Required charts

Add simple charts if practical:

```txt
Monthly revenue trend
Revenue by product
Purchase count by exam type
```

Charts can be basic. Accuracy matters more than style.

---

# 7. Customer search and customer profile

Add a new tab:

```txt
Customers
```

This is critical.

Ay needs to quickly solve support issues like:

```txt
“I paid but cannot access.”
“I bought the wrong exam.”
“I need my magic link again.”
“My subscription is not showing.”
```

## Customer search

Allow search by:

```txt
Email
Name
Phone
Stripe session ID
Product key
Exam type
```

## Customer profile view

When a customer is selected, show:

```txt
Name
Email
Phone
Created date / first seen
Purchases
Subscriptions
Unlocked exams
Active access status
Last activity
Questions answered
Mock exam attempts
Readiness score if available
Exam date if available
Trial history
Magic-link / OTP status if available
```

## Customer actions

Add admin actions where safe:

```txt
Resend magic link
Resend purchase confirmation email
Copy customer email
Copy customer details
View Stripe session/customer link if available
Run access audit for this email
```

Optional, but useful if already supported safely:

```txt
Grant access manually
Revoke access manually
Change product/exam access
```

Manual grant/revoke should only be built if it is auditable and safe.

If built, log:

```txt
Admin user
Customer email
Action taken
Timestamp
Reason
```

---

# 8. Subscriptions tab

Improve subscription visibility.

Show:

```txt
Active subscriptions
Past due subscriptions
Cancelled subscriptions
Monthly recurring revenue
Annual recurring revenue
Subscription revenue by tier
Subscription revenue by province
Upcoming renewals
Recently cancelled
```

For each subscription, show:

```txt
Email
Name
Phone
Tier
Province
Status
Amount
Current period start
Current period end
Stripe subscription ID
Created date
```

Actions:

```txt
Copy email
Open customer profile
Run reconciliation
Backfill contact info
```

Keep existing subscription reconciliation, but make it clearer.

---

# 9. Trials & Funnel tab

Replace or improve the old Trial Emails tab.

Show:

```txt
Trial signups
Trial users who hit free limit
Trial users who purchased
Trial-to-paid conversion rate
Most popular free trial exams
Trial signups by source
Recent trial users
```

Important funnel:

```txt
Visited / started trial
Answered free questions
Hit free limit
Entered email
Purchased
```

If some funnel data does not exist yet, create the structure and show what is currently available. Add TODO comments for missing instrumentation.

Useful metrics:

```txt
Trial signups today
Trial signups this month
Conversion this month
Best converting exam
Most abandoned exam
```

---

# 10. Product Health tab

Create a new tab:

```txt
Product Health
```

This should help Ay know which courses/question banks need improvement.

Show:

```txt
Most used exam banks
Least used exam banks
Most missed questions
Most reported questions
Lowest accuracy questions
Lowest confidence topics
Weakest modules by exam
Exam banks with low engagement
Question banks with missing explanations/steps/tips if available
```

For each exam bank, show:

```txt
Exam name
Question count
Active students
Questions answered
Average accuracy
Question reports
Most missed topic
Last activity
```

This tab should help answer:

```txt
Which exam bank should we improve next?
Which questions are hurting trust?
Which course is getting traction?
```

---

# 11. Question Reports tab

Rename or enhance the existing Error Reports tab into:

```txt
Question Reports
```

Show:

```txt
Open reports
Dismissed reports if available
Reports by type
Reports by exam bank
Reports by module
Most reported question
Recent reports
```

For each report, show:

```txt
Question ID
Question text
Module
Exam/bank if available
Report type
User details if available
Created date
Status
```

Actions:

```txt
Mark reviewed
Dismiss
Copy question text
Open related question if possible
```

---

# 12. Organizations tab

Improve the org/team owner view.

Show:

```txt
Organizations
Seats purchased
Seats assigned
Unused seats
Manager emails
Team revenue
Team activity
Team readiness
At-risk operators
Renewal date if available
```

For each organization:

```txt
Organization name
Manager email
Seats purchased
Seats assigned
Seats unused
Active operators
Average accuracy
Average readiness
Created date
Revenue
```

Actions:

```txt
View organization
Copy manager email
Resend manager access link
Export team report
```

Do not weaken team manager access checks.

---

# 13. Feedback tab

Improve feedback so Ay can act on it.

Show:

```txt
Average rating
Feedback count
Low-rated feedback
Recent comments
Feedback by page / feature if available
```

Highlight:

```txt
1-star and 2-star feedback
Repeated complaints
Feature requests
Positive testimonials
```

Actions:

```txt
Mark reviewed
Dismiss
Copy feedback
Tag as testimonial
```

---

# 14. System Health tab

Keep this admin-only.

Show:

```txt
Database status
Stripe status
Email sending status
AI tutor status
Magic-link status
Webhook status
Last successful webhook
Last failed webhook
Cron/job status
Question bank counts
Trigger logs
Recent server errors if available
```

Do not show secret values.

Safe display:

```txt
Configured / Not configured
Healthy / Warning / Error
Last successful run
```

Never display:

```txt
Actual API keys
Secrets
Tokens
Raw cron secret
```

---

# 15. Admin Actions tab

Create a tab for owner operations.

Useful actions:

```txt
Run purchase reconciliation
Run subscription reconciliation
Backfill contact info
Resend purchase confirmation
Resend magic link
Export purchases CSV
Export trial emails CSV
Export subscriptions CSV
Export customer list CSV
```

Optional future actions:

```txt
Create discount code
Grant manual access
Revoke manual access
Send announcement email
```

Only implement high-risk actions if safely gated and audited.

---

# 16. Mobile owner view

Ay will likely check `/admin` from his phone.

Make the dashboard mobile-friendly.

On mobile, prioritize:

```txt
Revenue Today
Revenue This Month
New Purchases
Active Subscribers
Needs Attention
Latest Customers
Open Issues
```

Tables can scroll horizontally if needed, but the top owner overview should be clean on mobile.

---

# 17. Data/API implementation

Add or extend admin backend procedures as needed.

Suggested new admin endpoints:

```txt
admin.ownerOverview
admin.revenueAnalytics
admin.customerSearch
admin.customerProfile
admin.productHealth
admin.trialFunnel
admin.organizationOverview
admin.adminActionsLog
```

All must use:

```txt
adminProcedure
```

Do not use publicProcedure for owner data.

---

# 18. Performance requirements

Avoid loading every table by default.

The Owner Overview should load fast.

Use:

```txt
Aggregated SQL queries
Date filters
Pagination
Lazy loading per tab
Reasonable limits
```

Do not load 500 purchases, 500 subscriptions, all score history, and all feedback on initial page load unless needed.

---

# 19. UX requirements

Design should be:

```txt
Clean
Founder-focused
Fast to scan
Action-oriented
Mobile-friendly
Professional
```

Use clear labels and not too many emojis.

Emojis are okay for quick scanning, but avoid making it look childish.

Use status colors:

```txt
Green = healthy/good
Amber = warning
Red = needs attention
Blue = informational
```

---

# 20. Acceptance criteria

This build is complete when:

```txt
/admin opens to Owner Overview by default.
Owner Overview shows revenue, purchases, subscribers, trials, conversion, open issues, and needs-attention items.
Revenue tab has useful founder analytics, not just rows.
Customers tab supports search and customer profile view.
Subscriptions tab shows active/past due/cancelled and MRR/ARR-style summaries.
Trials & Funnel tab shows trial-to-paid visibility.
Product Health tab shows exam/question-bank performance signals.
Question Reports tab is easy to review and act on.
Organizations tab shows seats, managers, activity, and team health.
Feedback tab highlights low-rated and useful feedback.
System Health is admin-only and does not expose secrets.
Admin Actions tab includes safe operational shortcuts.
Dashboard remains role === admin only.
All new backend procedures use adminProcedure.
Mobile layout is usable.
```

---

# 21. Manual QA checklist

Run:

```txt
pnpm check
pnpm test
```

Manual checks:

```txt
Non-logged-in user cannot access /admin.
Logged-in non-admin cannot access /admin.
Admin user can access /admin.
Owner Overview loads.
Needs Attention panel loads.
Revenue tab loads.
Customer search works.
Customer profile opens.
Subscriptions tab loads.
Trial funnel tab loads.
Product Health tab loads.
Question Reports tab loads.
Organizations tab loads.
Feedback tab loads.
System Health tab loads.
Admin Actions tab loads.
CSV exports still work.
Reconciliation actions still work.
Mobile layout works.
No secrets displayed.
```

---

# 22. Handoff format

Return:

```md
## Manus Handoff — Owner Admin Dashboard Upgrade

Branch:
Commit hash:
Files changed:

## What was built
- ...

## New admin tabs
- ...

## New backend endpoints
- ...

## Owner Overview metrics
- ...

## Needs Attention rules
- ...

## Customer search/profile
- ...

## Revenue analytics
- ...

## Product health analytics
- ...

## Admin actions
- ...

## Security/access checks
- ...

## Tests run
- pnpm check:
- pnpm test:

## Manual QA
- Non-admin blocked:
- Admin access:
- Owner Overview:
- Revenue:
- Customers:
- Subscriptions:
- Trials & Funnel:
- Product Health:
- Question Reports:
- Organizations:
- Feedback:
- System Health:
- Admin Actions:
- Mobile:

## Known limitations / TODOs
- ...
```

---

## Final instruction

Build this as Ay’s founder cockpit.

The dashboard should not just show data.

It should tell Ay:

```txt
What happened.
What changed.
What needs attention.
What to do next.
```
