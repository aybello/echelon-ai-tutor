# WPI Class IV Collection — public exam-material comparison

Reviewed September 15, 2026. Content checkpoint: `33fafbb91379e65da182c3f753b36ea2a90d3b56`. Compiled content digest: `58bb4f9cb661ca7853280609ea60c8235e8ffc8397c12995cfd60986e15f77c1`.

## Finding

The repaired bank has useful original practice material, but matching WPI's topic headings and passing offline checks does not establish exam-style or difficulty equivalence. The clearest remaining issues are metric-only physical calculations, easy-to-dismiss alternatives in several inspected questions, coarse objective mapping and incomplete reference alignment. Some operational and numerical items are stronger than the generic decision questions.

This review changes documentation only. It does not change the compiled package, question count, content digest, import status or mock selector.

## What was actually inspected

- The three illustrative questions on printed pages 3–4 of the [WPI Class IV Collection guide](https://gowpi.org/wp-content/uploads/2026/04/Collection-%E2%80%93-Class-4_final.pdf), its reference matrix, task outline and scored blueprint. The examples cover factual recall, a process-purpose question and a pressure calculation. They illustrate formats, not a representative Class IV test.
- All ten questions in WPI's publicly linked [ABC Very Small Water Systems sample PDF](https://gowpi.org/wp-content/uploads/2022/04/ABCSampleVSWS.pdf). It is a 2008 document for a different certification; used only for structural comparison. It includes direct knowledge, operating choices and numerical work, with answers and worked arithmetic. Its older legal and technical statements were not imported into our bank.
- WPI's [sample-question page](https://gowpi.org/services/sample-exam-questions/), which explicitly warns that samples are not actual exam items and may not represent current content.
- The official Collection sample URL linked there, `http://abcwbt.abccert.org/lxrweb/online/samples/webtest3.asp`, could not be inspected: HTTP timed out and HTTPS entered a redirect loop. No claim is made to have read that Collection sample set.
- WPI's [recommended study-guide page](https://gowpi.org/services/abc-testing/study-guide/) and the [WEF Collection guide listing](https://learn.wef.org/local/catalog/view/product.php?productid=194). The paid book's questions were not accessed. WEF SkillsBuilder was excluded after its landing page specified personal-use restrictions and prohibited AI/automated use.

No confidential or recalled examination questions were used. No official question wording was copied into Echelon's proposed content.

For Echelon, inventory/source/classification checks covered all 503 compiled rows. Manual style inspection used 50 questions, ten evenly spaced by question number within each assigned area, plus all 31 calculation items. Two calculation items overlap that sample: 79 unique questions received this structured inspection. This is a purposive spread across the bank, not a random statistical sample or a complete factual re-audit.

The 50-item sample: 1, 13, 22, 24, 28, 40, 58, 61, 86, 99, 106, 111, 123, 137, 142, 153, 165, 178, 184, 191, 195, 217, 219, 235, 237, 247, 248, 275, 298, 301, 303, 315, 320, 336, 338, 369, 377, 394, 407, 434, 442, 445, 447, 460, 462, 486, 495, 501, 502, 503. Calculation IDs are independently enumerated in `scripts/collectionReview.test.mjs`.

## Concrete comparisons

| Dimension | Evidence from public material | Finding in Echelon | Implication |
| --- | --- | --- | --- |
| Basic format | The inspected examples use four options and a focused question. | All 503 proposed rows have four options and one declared key; median stem length is 17 whitespace-delimited words, range 4–38. | Basic structure is compatible. Length alone is not the main problem. |
| Calculations | The current guide specifies US units followed by metric alternatives, independently solvable. | Physical examples such as Q178, Q228 and Q373 use metric quantities without paired US alternatives. | Appropriate for metric practice, but not a faithful reproduction of that published presentation. Add and independently verify both versions for exam simulation. Currency/count-only questions do not need artificial unit conversion. |
| Reasoning | The guide distinguishes recognition from applying information; application includes basic problem-solving. | Q178 distinguishes pump flow from net drawdown flow; Q184 distinguishes series from parallel pump behaviour. Q317 requires accumulation across two intervals. | Useful reasoning; longer scenarios or harder arithmetic are not automatically more authentic. |
| Distractors | Inspected samples include numerical alternatives and alternatives within the relevant technical subject. Some historical samples also contain weak distractors. | Q123 mixes a ventilation hazard with unrelated hydraulic effects. Q86 includes report page count; Q137 includes subscription renewal date. Q248 offers removing a rating label. | These can reward dismissal of obviously irrelevant or unsafe choices. Strengthen them without imitating weaknesses in old public samples. |
| Repeated answer pattern | No public sample establishes a required frequency of any particular phrasing. | In the inspected sample, Q1, Q28, Q106, Q142, Q407 and Q502 favour generic verification/planning over plainly unreasonable shortcuts. | Editorial concern: repeated structure can cue answers without testing the relevant collection knowledge. This is not a measured item-difficulty result. |
| References | The guide's reference matrix emphasizes CSUS Collection Systems Volumes 1 and 2, eighth edition. | 320 rows cite NEIWPCC variants; 63 cite independent mathematical reasoning. No proposed row cites those CSUS volumes. | Existing references can support facts, but close coverage of WPI's reference emphasis has not been demonstrated. Do not attach book citations until the relevant material is actually checked. |
| Objective mapping | The outline includes concrete operational tasks, supervision, safety and administration. | `blueprintObjective` repeats the broad area rather than identifying a particular task. | Area-level counts cannot establish full task coverage. Build a specific task-to-question map before claiming comprehensive alignment. |

The references above support the published format facts; judgments about Echelon's distractors and reasoning are this review's editorial assessments, not WPI findings.

## Inventory versus an exam form

The current WPI scored targets are shown alongside the authored inventory below. A question bank need not reproduce exam proportions; the selector must enforce the intended form.

| Area | Proposed bank | Bank share | WPI scored form |
| --- | ---: | ---: | ---: |
| Equipment | 65 | 12.9% | 23 |
| Collection O&M/restoration | 104 | 20.7% | 23 |
| Lift stations | 60 | 11.9% | 16 |
| Monitoring/evaluation | 94 | 18.7% | 20 |
| Safety/administration | 180 | 35.8% | 18 |
| Total | 503 | 100% | 100 |

The bank has 43 recall (8.5%), 460 application (91.5%) and 31 calculation items (6.2%, included in application). The scored target is 20 recall, 80 application and 16 calculations. Supply checks pass, but this PR does not implement or test a selector enforcing those quotas. Do not infer compliance from an unweighted draw of 100 rows. Cognitive labels themselves still need editorial verification; a short scenario does not automatically prove application-level reasoning.

## Specific improvement worklist

| Questions | Next improvement |
| --- | --- |
| 86, 137 | Replace unrelated administrative distractors with plausible competing actions that fail for a stated technical or procedural reason. |
| 123 | Compare credible ventilation/odour-control consequences; remove unrelated changes in liquid hydraulics. Preserve a single supported answer. |
| 248 | Test load compatibility with plausible equipment ratings or configuration information; avoid a conspicuous label-removal option. |
| 28, 106, 142, 502, 503 | Require equipment/data evidence and a defined operating decision. Reduce repeated generic digital-tool scenarios and check their individual task fit. |
| 1, 407, 495 | Retain legitimate planning/compliance learning where useful, but avoid treating broad common-sense answers as demonstrated advanced technical depth. |
| Physical calculation items | Add coherent paired units for exam-mode presentation; independently recompute correct answers and plausible error-based alternatives in both systems. Keep a useful metric learning mode if desired. |
| All 503 and future additions | Map to specific official tasks, check cognitive labels, strengthen source traceability and deduplicate decision patterns. Use learner response data later to assess difficulty and discrimination. |

Administration, safety and simple recall are legitimate parts of this course. Their presence is not itself an error. Nor does an original drone scenario automatically fall outside Collection: the published task list includes drone inspection. The concern is the quality and balance of the decision being tested.

## Limits and recommendation

Describe the current package as researched, original WPI-topic-aligned practice content. Do not describe it as a validated reproduction of WPI Class IV difficulty or a compliant live mock form. Public examples provide limited format evidence; neither these examples nor our test suite measure real-exam equivalence.

The comparison is complete to the extent supported by accessible public materials. For a stronger benchmark, the next review should use appropriately licensed Collection-specific preparation/reference material, strengthen the identified items, and validate mock selection separately. The existing 250-addition workstream should prioritize verified operational-task gaps rather than adding more repetitions of general management advice.
