# October 3 learning repair: reviewed taxonomy and limitations

## Source review

- [OWWCO exam preparation](https://owwco.ca/preparing-for-your-exam/) states that Ontario wastewater treatment Classes 1 to 4 use WPI standardized exams. It does not identify the currently adopted outline year in the retrieved text.
- [WPI 2025 criteria index](https://gowpi.org/services/2025-need-to-know-criteria/) requires confirmation with the certifying authority for the jurisdiction and exam date.
- WPI 2025 [Class I](https://gowpi.org/wp-content/uploads/2026/04/WastewaterTreatment-%E2%80%93-Class-1_mh-fin.pdf), pages 4 and 6 to 9: equipment 39, treatment process 38, laboratory 10, safety/administration 13.
- WPI 2025 [Class II](https://gowpi.org/wp-content/uploads/2026/04/WastewaterTreatment-%E2%80%93-Class-2_mh-fin.pdf), pages 4 and 6 to 9: equipment 37, treatment process 40, laboratory 10, safety/administration 13.
- The existing Echelon mock targets match those 2025 **topic** totals. The retrieved [2019 Class I](https://gowpi.org/download/6277/?tmstv=1711393194) and [2019 Class II](https://gowpi.org/download/6279/?tmstv=1711393310) guides have five different areas/totals. This repair does not silently switch outline years or claim Ontario adopted the newer exam. It retains current mock sizes, duration, scoring, and advertised topic split. It does not add a claim of cognitive/calculation quota compliance.
- Canonical current chapter identities come from `scripts/lib/ontarioTreatmentModuleRestoration.mjs` and public `quiz.getBankMeta` metadata. The follow-up reads an owner-authorized, content-only ACTIVE export offline; no question texts, answer keys, modules, IDs, governance status or histories are changed.

## Conservative chapter-to-area decisions

| Bank/chapter | Mock area decision | Rationale |
| --- | --- | --- |
| Class II: Treatment Process | Treatment Process Evaluation & Adjustment | Direct naming alias for the process chapter. |
| Class II: Equipment O&M | Equipment Evaluation, Maintenance & Operation | Direct naming alias for the equipment chapter. |
| Class II: Laboratory Analysis | Laboratory Analysis | Exact area identity. |
| Class II: Safety & Administration | Safety & Admin | Direct naming alias for the safety/administrative chapter. |
| Class II: Collection Systems | Explicit classification required | A separate collection topic is not wholly one wastewater-treatment exam area. |
| Class I: Wastewater Characteristics & Preliminary Treatment | Explicit classification required | Characteristics/testing, equipment, and process tasks cross areas. |
| Class I: Primary Treatment | Explicit classification required | WPI separately lists primary equipment and primary process work. |
| Class I: Secondary Treatment | Explicit classification required | WPI separately lists secondary equipment and secondary process work. |
| Class I: Biological Nutrient Removal | Explicit classification required | Equipment, process adjustment and analytical tasks are not distinguished by chapter. |
| Class I: Tertiary Treatment & Filtration | Explicit classification required | Filtration equipment and filtration processes appear in distinct areas. |
| Class I: Disinfection | Explicit classification required | Equipment, treatment adjustment and laboratory verification cross areas. |
| Class I: Solids Handling & Biosolids | Explicit classification required | Dewatering/digestion equipment and solids processes appear in distinct areas. |
| Class I: Regulations, Safety & Operations | Explicit classification required | The chapter includes operations as well as safety and regulatory tasks. |
| Class I: Wastewater Collection | Explicit classification required | A separate collection topic is not wholly one wastewater-treatment exam area. |

Exact legacy exam-area labels remain eligible without requiring retroactive review of otherwise valid banks. Unknown or ambiguous chapter labels do not count toward quotas. There is no keyword classifier, ID-range assignment, random quota substitution, or module relabelling.

For identities outside the classified snapshot, the existing `questions.blueprintObjective` field can hold an **exact** reviewed area label, with `reviewStatus = approved`. An unknown or unapproved explicit objective remains excluded even when a module alias exists. The issuance-only query reads these existing governance columns; active mock responses never expose them. No schema change or migration is necessary.

**Code-provided task-area coverage (October 3, 2026):** `server/wastewaterMockAreaManifest.json` contains a complete inspected high-confidence subset from the existing single GPT-6.1-Sol proposal (870 original questions classified; 749 initially high-confidence). This is **reviewed AI-assisted task-area metadata, not full human or technical-content approval**. Questions remain `unreviewed`; no `reviewStatus` or `blueprintObjective` is written or promoted. The server-only resolver uses bank plus question number and SHA-256 of a versioned JSON tuple containing the exact stem, parsed option strings/order, correct index and module. Matching metadata takes priority over generic objectives. Changing any hashed content excludes that identity until classification is renewed; it cannot fall back to a legacy chapter alias. All unselected/ambiguous snapshot identities are explicitly excluded from mock issuance. Outside-snapshot approved exact objectives and known legacy areas retain their previous fallback behavior.

| Bank | Eligible equipment / process / laboratory / safety | Exact 100-question quotas |
| --- | --- | --- |
| Class I | 78 / 66 / 22 / 23 | 39 / 38 / 10 / 13 |
| Class II | 38 / 62 / 24 / 21 | 37 / 40 / 10 / 13 |

Classification review moved Class I Q205 (biological oxygen provision) and Class II Q169 (biofilter microbial mechanism) and Q234 (dewatering disposal-volume objective) to process; ambiguous equipment/safety, lab/process and jurisdiction-sensitive items were excluded rather than forced into quotas. Class II equipment has only one surplus question, so future changes must recheck coverage. The manifest ships identities, hashes, area codes and provenance only—not the question bank, raw prompt or provider response IDs.

The offline private snapshot test validates every accepted hash and the full eligible/excluded identity partition, then runs 20 deterministic mocks per bank with exact quotas, 100 unique IDs, preserved content/modules/answers, and valid original signed-session behavior. It also verifies the actual `startMock` router using database-free snapshot stubs and confirms answer/governance non-disclosure. Reproduce with `python3 scripts/auditWastewaterMockCoverage.py --snapshot /absolute/private/mock-current-content.json --output /absolute/private/mock-coverage-runs.json`; tests execute through `/home/ubuntu/pr-review/run_audit_safe.py`, without checkout, login or production calls. Normal CI skips the private snapshot gate and runs synthetic hash/schema/fallback regressions.

**Still pending:** Subject-matter technical review of question content and answer correctness, jurisdiction/exam-date adoption confirmation, and broader task coverage beyond this subset. This release supplies classification coverage, not certification of exam fidelity or cognitive/calculation quotas. Every issue still checks actual coverage before creating a signed session; shortage or changed content remains a recoverable fail-closed condition. Practice, grading, existing issued sessions and histories are unchanged. Future governed releases must preserve identities/content and renew classifications offline before claiming coverage; never use a production mock as a verification probe.

## WPI Class I wastewater notes

Reviewed [public note topics](https://echeloninstitute.ca/api/trpc/quiz.getModuleOverviews?input=%7B%22json%22%3A%7B%22bankKey%22%3A%22wpi-class1-wastewater%22%7D%7D) and [practice module metadata](https://echeloninstitute.ca/api/trpc/quiz.getBankMeta?input=%7B%22json%22%3A%7B%22bankKey%22%3A%22wpi-class1-wastewater%22%7D%7D) on October 3, 2026. These are recommendations to **existing study notes**, not per-question exam classifications or an audit of every note's factual content.

| Practice module | Related note topics | Reviewed coverage |
| --- | --- | --- |
| Treatment Process | Primary & Secondary Treatment; Solids Handling & Biosolids | Existing process descriptions and solids-process operation/control. |
| Equipment Evaluation, Maintenance & Operation | Primary & Secondary Treatment; Solids Handling & Biosolids; Wastewater Collection Systems | Existing clarifier/aeration equipment, dewatering equipment and pump/lift-station maintenance descriptions. These notes do not claim exhaustive equipment coverage. |
| Laboratory Analysis | Laboratory & Monitoring | Sampling, BOD/TSS, DO/pH and QA/QC. |
| Security, Safety & Administrative Procedures | Safety, Regulations & Admin | Hazards, confined spaces, reporting and emergency response. |

Single-topic mappings open readable notes; multi-topic mappings show a clearly labelled chooser rather than an arbitrary first note. Every available note remains selectable, including when a recommendation or cached note key is unavailable. Deep-link Notes and the post-answer shortcut use the same resolver. Other courses retain exact-match note behavior, with a chooser fallback.

## Sludge unit check

With flow in m³/day, removed solids in mg/L, density in kg/m³ and solids as a mass fraction:

`V = Q × SS_removed × 0.001 / (density × solids_fraction)`.

`150 mg/L = 0.15 kg/m³`; `5,000 × 0.15 = 750 kg/day`; `1,000 × 0.04 = 40 kg/m³`; `750 / 40 = 18.75 m³/day`.

The rendered formula uses the shared calculation/example object. Independent Python Decimal and bc checks are retained in the external completion artifacts, not committed production data.
