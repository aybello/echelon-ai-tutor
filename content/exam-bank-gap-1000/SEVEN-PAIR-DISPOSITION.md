# Seven Pair Near Duplicate Disposition

Scope: the completed new-versus-new masked token Jaccard check in tools/dedup_gap.py (threshold 0.85) flagged seven same bank pairs. Each pair was read in full (question, options, steps, explanation). In every case the pair was the same formula and scenario with different numbers, so the second item (higher suffix) was replaced in place with a genuinely different calculation question in the same module, keeping the itemId, questionNum, bankKey, difficulty and cognitiveLevel from the assignment. Batch files are the source of truth; additions.json was regenerated with tools/assemble_gap.py and each affected bank validates with 0 errors and 0 calculation problems. Full hashes, old stems and new stems for every pair are recorded in each bank's disposition.json under nearDuplicatePairReview.

| Bank | Pair | Similarity | Decision | Reason |
| --- | --- | --- | --- | --- |
| class3-ww | WASTEWATER-TREATMENT-L3-663 / WASTEWATER-TREATMENT-L3-667 | 0.9697 | replaced (667) | Both items are the direct F/M ratio calculation, BOD load divided by MLVSS inventory, differing only in flow, BOD, volume and MLVSS numbers. |
| class4-ww | WASTEWATER-TREATMENT-L4-528 / WASTEWATER-TREATMENT-L4-614 | 0.8800 | replaced (614) | Both items forecast dry solids production as BOD removed multiplied by a given solids yield of 0.65, differing only in the BOD removed value. |
| wpi-class1-wastewater | WASTEWATER-TREATMENT-L1-486 / WASTEWATER-TREATMENT-L1-653 | 0.9355 | replaced (653) | Both items compute the surface overflow rate for two identical rectangular clarifiers as total flow divided by total surface area, differing only in clarifier dimensions. |
| wpi-class2-wastewater | WASTEWATER-TREATMENT-L2-488 / WASTEWATER-TREATMENT-L2-528 | 0.8750 | replaced (528) | Both items solve for the waste sludge flow from the SRT mass balance, inventory divided by target SRT minus the effluent solids loss, divided by the waste sludge concentration, differing only in basin volume, concentrations, SRT and flows. |
| wpi-class4-water-dist | DISTRIBUTION-L4-587 / DISTRIBUTION-L4-631 | 0.8846 | replaced (631) | Both items price a two component renewal program as length multiplied by a per metre rate plus a count multiplied by a unit cost, differing only in the components, lengths, counts and rates. |
| wpi-class1-water-coll | COLLECTION-L1-573 / COLLECTION-L1-577 | 0.9091 | replaced (577) | Both items compute force main detention time as pipe volume divided by flow, pi times radius squared times length converted to litres, divided by flow and by 60, differing only in length, diameter and flow. |
| wpi-class2-water-coll | COLLECTION-L2-493 / COLLECTION-L2-497 | 0.9259 | replaced (497) | Both items compute CIPP liner surface area as pi times diameter times the total length of two segments, differing only in segment lengths and diameter. |

## Replacement questions

| Bank | Item | New question |
| --- | --- | --- |
| class3-ww | WASTEWATER-TREATMENT-L3-667 | Weir overflow rate for a circular clarifier: Weir overflow rate = Flow / (pi x Weir diameter), expected 190.99 m3/m/day. |
| class4-ww | WASTEWATER-TREATMENT-L4-614 | Volumetric BOD loading on an aeration basin: Volumetric BOD loading = (Flow x BOD / 1000) / Basin volume, expected 0.66 kg/m3/day. |
| wpi-class1-wastewater | WASTEWATER-TREATMENT-L1-653 | Weir overflow rate for a clarifier effluent launder: Weir overflow rate = Flow / Weir length, expected 150.0 m3/m/day. |
| wpi-class2-wastewater | WASTEWATER-TREATMENT-L2-528 | Surface overflow rate for a circular secondary clarifier: Surface overflow rate = Flow / (pi x Radius x Radius), expected 23.87 m3/m2/day. |
| wpi-class4-water-dist | DISTRIBUTION-L4-631 | Watermain replacement cycle in years: Replacement cycle = Network length / Annual replacement length, expected 90.0 years. |
| wpi-class1-water-coll | COLLECTION-L1-577 | Trench excavation volume: Excavated volume = Length x Width x Depth, expected 360.0 m3. |
| wpi-class2-water-coll | COLLECTION-L2-497 | Loose trench excavation volume with a swell factor: Loose volume = Length x Width x Depth x Swell factor, expected 257.13 m³. |

## Additional pairs found by the completed check

None. The full package run of the completed check flagged exactly the seven pairs above and no others, before or after the replacements. After the replacements the full run reports zero near duplicate flags in every bank, and exact, expression, option collision and cross bank counts are all zero.
