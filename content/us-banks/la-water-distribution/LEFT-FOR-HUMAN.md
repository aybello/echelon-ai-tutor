# Left for human: Louisiana Water Distribution practice bank (`la-water-distribution`)

Status: validated local candidate. Not imported, not activated, not published, not pushed. Items are `unreviewed` in the package.

## Decisions needed before any import

1. **Bank identity gate.** The dossier (`docs/us-launch/state-dossiers/la-water-distribution.md`, "Bank recommendation") says not to create a new unique bank identity until the earlier dedicated US Class I water-distribution package has been recovered and compared (readiness doc, Phase A). That comparison was not done in this session. The queue entry (#20, Suitable) and the owner direction were followed to build the bank. The owner should decide whether the identity may be created.
2. **Outline not checked.** The LDH Need-to-Know outline, the LDH program page, the operator certification rule and the exam application all returned HTTP 403 from ldh.la.gov on 2026-11-27. The block came from the origin server, not the egress proxy, and was not worked around. Topic structure follows the dossier summary of objectives. Someone with access should check the bank against the live Need-to-Know, class by class, before import.
3. **Qualified review.** All review was by GPT (gpt-6.2-sol), which is a model reviewer. The dossier requires an independent qualified review. None has been done.

## Round 3 flags left unresolved (three-round limit reached)

These 46 real items were still flagged by GPT in round 3 (20% of 230 real items; threshold is under 10%). They were not edited after round 3. Each needs a human decision: keep, rewrite the distractor or key, or drop the item. Item ids are `LA-WD-` plus the question number.

| Item | GPT category | GPT note (round 3) |
|---|---|---|
| LA-WD-001 | scope | Tests source classification only, not distribution-system operations. |
| LA-WD-006 | scope | Tests selection of a water source rather than operation of the distribution system. |
| LA-WD-007 | distractor | B is also defensible: warmer water is less viscous and can flow faster through a main at the same head loss. |
| LA-WD-019 | explanation | The explanation wrongly rules out pressure measurement at hydrants, which can be used to measure static and residual main pressure. |
| LA-WD-026 | giveaway | B concerns a service-connection restriction, which is unrelated to main cover. |
| LA-WD-027 | giveaway | A introduces an unrelated valve box; the stem describes a block behind a bend. |
| LA-WD-032 | distractor | D also includes flushing, which removes debris. The unnecessary wait does not make D wrong as written. |
| LA-WD-035 | giveaway | D describes a pump-start delay, unrelated to how long disinfectant acts on the water. |
| LA-WD-036 | giveaway | A clogged drain on one hydrant is unrelated to a steady residual decline along the network. |
| LA-WD-038 | giveaway | The plant pump-speed and flow-meter options are unrelated to measuring residual at distant points. |
| LA-WD-039 | giveaway | A introduces a hydrant pressure change unrelated to chlorine underdosing. |
| LA-WD-042 | giveaway | D proposes inspecting individual joints for corrosion pits by flushing, which cannot perform that inspection. |
| LA-WD-043 | giveaway | The stem's 'bacteriological' directly cues 'bacteria' in A; the other options are unrelated measurements. |
| LA-WD-045 | giveaway | D links the sample to the main's flow rate, which is unrelated to whether the hydrant outlet was flushed. |
| LA-WD-048 | distractor | C can also be a recordkeeping purpose if flushing records are used to document crew costs; the stem does not limit the question to water-quality operations. |
| LA-WD-050 | giveaway | A proposes counting customers, which is unrelated to collecting repeat water samples. |
| LA-WD-056 | ambiguous | The type of bacteriological problem is unspecified. The sampling record is useful for checking collection errors, but the residual record may be the better first check if the concern is loss of disinfection. |
| LA-WD-059 | explanation | A pressure difference alone does not distinguish backsiphonage from backpressure. Backsiphonage involves subatmospheric pressure on the supply side. |
| LA-WD-076 | giveaway | Counting service-line fittings is unrelated to testing meter registration accuracy. |
| LA-WD-078 | giveaway | The pipe-joint diameter measurement in C is unrelated to what the hydraulic grade line represents. |
| LA-WD-079 | giveaway | A higher chlorine residual does not explain a pressure difference along the main. |
| LA-WD-087 | giveaway | The billing-cycle meter-reading schedule is unrelated to selecting service-line material for corrosive soil. |
| LA-WD-089 | distractor | B is arguably correct for large cast-iron pipe: its weight can prevent manual handling, and the stem does not specify pipe size. |
| LA-WD-092 | giveaway | The utility's color code for pipe sizes is unrelated to the operational reasons for comparing joint types. |
| LA-WD-098 | scope | The item asks how to size source capacity rather than how to operate the distribution system. |
| LA-WD-099 | ambiguous | A low tank level does not establish inadequate storage capacity; low starting volume, inadequate inflow, or pump scheduling can also cause it. |
| LA-WD-120 | giveaway | C concerns chlorine residual testing, which is unrelated to district flow metering for water-loss accounting. |
| LA-WD-122 | giveaway | Only C refers to water level, directly repeating what the stem says the sensor measures. |
| LA-WD-123 | ambiguous | The stem does not specify a pressure transmitter; a chlorine residual transmitter would make C correct. |
| LA-WD-134 | key | Cleaning can restore flow area, but relining alone does not enlarge the bore; it can improve capacity by reducing friction. |
| LA-WD-135 | ambiguous | The same pressure at one point does not establish the same head difference across the main. A smaller head difference could also explain lower flow. |
| LA-WD-139 | explanation | A curve change alone does not prove declining performance or identify wear, fouling, or damage as the cause. |
| LA-WD-143 | distractor | A is arguably correct: the warranty can affect repair costs, and the coating can affect maintenance costs. The stem does not ask for the most complete list. |
| LA-WD-145 | giveaway | D divides head by speed, a ratio unrelated to recovering the added cost. |
| LA-WD-148 | distractor | The stem asks what to consider, not what matters most. Labor rates in C can affect rebuild cost, so C is also defensible. |
| LA-WD-150 | scope | The item tests managerial cost reporting rather than a distribution-system operation or maintenance decision. |
| LA-WD-153 | giveaway | Removing the repair line from the next report is a throwaway option: it hides the increase rather than investigating it. |
| LA-WD-156 | explanation | The explanation incorrectly treats bench-valve maintenance as necessarily belonging to another group; a meter shop may maintain its own bench. |
| LA-WD-157 | giveaway | Meter-pit sizing is unrelated to bench test results, and A is the only option that grammatically completes the stem. |
| LA-WD-166 | giveaway | Changing assignments daily without notice is an unrelated staffing practice, not a safety-program element. |
| LA-WD-168 | giveaway | Sending a planned shutdown notice after the work is finished makes it useless as advance notice. |
| LA-WD-169 | giveaway | Making bill payment a condition of reviewing a water-quality complaint is unrelated to handling the complaint. |
| LA-WD-170 | giveaway | Listing crew hours for a public works budget is unrelated to the purpose of a water-quality report. |
| LA-WD-173 | giveaway | B is ruled out by timing alone: it places the meeting after the work, while the stem explicitly asks about communication before the project affects the neighborhood. |
| LA-WD-185 | ambiguous | The stem assigns 150 psi to a water surface rather than clearly stating that the gauge reads 150 psi. |
| LA-WD-227 | arithmetic | The balance gives 0.226 MGD of total water loss. It equals real loss only if other apparent losses, such as unauthorized consumption, are zero. |

## Borderline keys and stems to check first

- **LA-WD-134** (key): "Cleaning or relining the main to restore flow area". Relining does not enlarge the bore. The key is defensible only if relining is read as restoring a smooth wall. Consider a stem change.
- **LA-WD-059, LA-WD-139, LA-WD-156, LA-WD-019** (explanations): the explanation wording was flagged as overstated. Check each explanation text against the item.
- **LA-WD-123, LA-WD-185, LA-WD-135, LA-WD-099** (ambiguous stems): add an assumption or narrow the question.
- **LA-WD-227** (arithmetic): the real-loss result depends on apparent losses being zero. Stem states meter error is absent, but unauthorized use is not excluded.
- **LA-WD-177** is labelled easy. The brief asks for calculations to be about 60% medium and 40% hard, so this label is the one exception.

## Coverage limits

- 11 conceptual topics have 6 or 7 items, below the brief target of 8 to 12: Pump types and components; Construction material tradeoffs; Sampling and cross-connection program planning; Water-loss control and flow measurement; Instrumentation and controls; Pump curves and main carrying-capacity loss; Pump performance testing and curve interpretation; Pump replacement economics; Cost reports and budgeting; Meter-shop functions; Safety program planning.
- Safety content is limited to program concepts. No worksite or chemical-handling instructions were written.
