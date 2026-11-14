# Operator certificate tracker for managers (draft spec)

Status: draft for Manus to review and build. Written 2026-11-14.

## Goal

Let a manager see and manage the certificates of every operator in the organization: class, expiry, training hours and exam plans. It is a tracker the manager keeps up to date. It is not an official record and must not claim compliance.

## Canada-wide scope

The product serves all of Canada, so the tracker must not hard-code Ontario rules. Certification systems differ by province and territory: levels, certificate terms, renewal and continuing education requirements, and exam bodies. Version 1 therefore stores the following per organization and per certificate:

- A jurisdiction field (province or territory) on every certificate and on every organization.
- A rule set per jurisdiction, kept as data and not code: certificate term in years, renewal notice lead time, annual training hours target (may be empty), and the level names used there (for example OIT, Class 1 to 4, or Level I to IV).
- Version 1 ships with the Ontario rule set only. Other provinces start with an empty rule set, which means the tracker shows expiry and reminders from the dates the manager enters and shows no training-hours target until a rule set is added.
- A certificate held in one province may be recognized in another. Store the issuing jurisdiction separately from the jurisdiction where the operator works.

Rule sets for other provinces must be researched and confirmed from each province's own certification authority before they are added. Do not copy the Ontario numbers to another province.

## Ontario facts this spec relies on (the Ontario rule set)

These come from the Ministry of the Environment pages for operator licensing, read on 2026-11-14.

- Operator-in-training (OIT) and Classes 1 to 4 exist for four systems: Water Treatment, Water Distribution and Supply, Wastewater Treatment, Wastewater Collection.
- OIT certificate or licence is valid 3 years and can be renewed once. Class 1 to 4 licences are valid 3 years.
- The Certification Office sends a renewal notice about 90 days before expiry. Renewal is the operator's responsibility and needs experience in the last 5 years.
- Employers provide 40 hours of training each year, and records should be kept in case the Ministry asks.
- An operator writes only one class above the current certificate, and waits at least 90 days between exam attempts, retakes included.

Not confirmed and out of scope for version 1: which class an operator in charge of a given facility must hold, and any automatic check against the certification office.

## Screens

1. **Roster.** One row per operator: name, certificate class and system, expiry date, days to expiry, status chip (current, due in 90 days, due in 30 days, expired), assigned course, readiness score if available.
2. **Due soon.** The same roster filtered to certificates expiring within 90 days, sorted by date. Each row can send a reminder.
3. **Operator detail.** Certificate history, training hours this year against 40, exam plan (target class, planned date, result), notes.
4. **Training log.** Add and edit entries: date, hours, topic, entered by. Show hours per operator and a yearly total.
5. **Exam plan.** Target class, planned exam date, earliest next attempt (last attempt plus 90 days), and a link to the course that matches the target class.

## Data

- Certificate: operator, system, class, certificate number (optional), issue date, expiry date, entered by, entered at, last edited.
- Training entry: operator, date, hours, topic, entered by, entered at.
- Exam entry: operator, target system and class, planned date, attempt date, result (pass, fail, pending), entered by.
- Audit trail: every create, edit and delete with who and when. Deletes are soft.

## Rules

- Status wording is "current", "due soon" and "expired". Never "compliant" or "non-compliant".
- A banner on every screen: "Tracker only. Not an official record. Confirm certificates with the certification office."
- A manager sees only operators of his own organization. An operator can see his own certificate and training records and can flag an entry as wrong. A flag notifies the manager and does not change the record.
- Reminders reuse the existing exam reminder job. Default schedule: 90, 60 and 30 days before expiry, then on expiry.
- Certificate numbers are sensitive. Do not show them in lists, exports or email bodies. Show only on the operator detail screen.

## Connections to existing features

- Certificate class suggests the next course: OIT leads to Class 1 and Class 1 to Class 2, within the same system.
- Readiness score from the existing dashboard appears next to each operator and next to each exam date.
- Existing operator management and licence counts stay as they are. This adds records on top of them.

## Phases

1. Roster, expiry, status chips, due-soon view, reminders.
2. Training log with yearly hours against 40.
3. Exam plan with the 90-day wait and course suggestion.
4. Later and optional: export for audits, facility classification matching after the rule is confirmed.

## Open questions

- Should operators enter their own certificates, or only managers?
- Do managers need to track more than one certificate per operator (for example treatment and distribution)? This spec assumes yes.
- What retention period applies to training records?
- Who owns the data if an operator leaves the organization?
