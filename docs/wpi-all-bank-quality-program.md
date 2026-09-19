# WPI all-bank quality program

## Scope

The program covers the 16 sold WPI banks: Water Treatment, Wastewater Treatment,
Water Distribution and Wastewater Collection at Classes I through IV. It keeps
Echelon's WPI-alignment promise and raises each bank to that standard; it does
not weaken the promise or hide weak questions.

## Controlled workflow

1. Export all 16 banks from the current database in one repeatable-read,
   read-only snapshot:

   ```bash
   node scripts/export-wpi-bank-review.mjs --out /private/wpi-bank-review.json
   ```

   Run this only in the private release environment with `DATABASE_URL` already
   configured. The export contains correct answers and must not be committed,
   emailed, placed in a public ticket or stored with customer data.

   Generate the first structural worklist without accessing the database again:

   ```bash
   node scripts/audit-wpi-bank-snapshot.mjs \
     --in /private/wpi-bank-review.json \
     --out /private/wpi-bank-audit.json
   ```

2. Reconcile every bank against its current WPI Need-to-Know Criteria and exam
   blueprint. Record the source edition, content areas, scored distribution,
   cognitive split, calculation target and optional pre-test handling.

3. Review questions in batches of 100. Every item must have one defensible
   answer, three plausible but wrong distractors, a useful explanation,
   appropriate class difficulty, a traceable objective and source, and correct
   jurisdictional wording. Independently recalculate every numerical item.

4. Run whole-bank checks after each batch: exact and near duplicates, repeated
   templates, answer-position balance, length and wording cues, option overlap,
   unsafe distractors, missing classifications, source gaps and blueprint
   feasibility. Automated flags are review candidates, not proof of factual
   error.

5. Produce an immutable repair package preserving question identity and learner
   history. It must include before/after hashes, a complete disposition ledger,
   source evidence, calculation fixtures, blueprint coverage and rollback data.

6. Release only after a fresh comparison to production, verified database
   backup, isolated import/rollback rehearsal, database-backed tests and a mock
   generation test proving the active profile is feasible.

## Batch order

1. Class IV Wastewater Treatment and Class IV Wastewater Collection, because
   customers are actively using them.
2. The remaining Class IV banks.
3. All Class I banks.
4. Classes II and III, one stream at a time.

No new questions should be added to a bank until its historical questions pass
the same gate. Expansion is a separate release after repair.
