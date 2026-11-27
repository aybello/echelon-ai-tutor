# Source check: ceu-effluent-filtration (checked 2026-11-26 while drafting)

Sources: WEF MOP 11 6th ed. Vol II Ch. 24 (mop.txt, printed pages 24-x); Wisconsin Solids Separation Study Guide Subclass B (WI, section numbers); Spellman Handbook 2nd ed. (sp6, 5.6.8); Spellman Vol III (sp4, 4.4); Water Quality Control Handbook (WQC, 8.x). Verdicts: SUPPORTED, CONTRADICTED, NOT COVERED. Arithmetic items are general arithmetic using stated constants (Spellman formulas where noted).

## Totals
Lesson claims 59: SUPPORTED 52, CONTRADICTED 0, NOT COVERED 7. Question claims 64 (28 arithmetic recomputed by `numcheck.py`; 36 concept): concept 35 SUPPORTED and 1 NOT COVERED (the M4 F2 classroom assumption); arithmetic 28 rows, formula SUPPORTED where cited in the lesson, otherwise general arithmetic.

## Lesson claims
| Location | Claim | Verdict | Evidence |
|---|---|---|---|
| M1 | Tertiary treatment = advanced treatment beyond secondary; sand or mixed media filters, cloth discs, membranes | SUPPORTED | WI Sec.1 C: "provide advanced wastewater treatment beyond secondary biological treatment... sand or mixed media filters, cloth discs, membranes" |
| M1 | Filtration typically a tertiary step; primary goal removing suspended solids | SUPPORTED | MOP 24-6: "Filtration is typically a tertiary treatment step located downstream of secondary processes" |
| M1 | "Tertiary" and "advanced" similar but not identical | SUPPORTED | sp4 4.1 note: "do not have precisely the same meaning" |
| M1 | Clarifier carry-over sources: pin floc, rising blanket, algae | NOT COVERED | General; WI 2.3.10 supports clarifier as main solids source |
| M1 | TSS weighed mg/L; turbidity NTU light scatter | NOT COVERED | Definitions are general; MOP 24-45 "turbidity, an indirect measure of suspended solids" supports the indirect point |
| M1 | Turbidity best control parameter, measured rapidly and automatically | SUPPORTED | MOP 24-45: "best filter control parameter because it can be measured rapidly and automatically" |
| M1 | Filtering coagulated, settled effluent: SS from 3-5 mg/L to virtually zero; P 0.5-1 to 0.1 or less | SUPPORTED | MOP 24-7 (stated in lesson as a book example, not a limit) |
| M1 | Coag, sedimentation, filtration reduce bacteria and viruses; viruses break through at first turbidity rise | SUPPORTED | MOP 24-27: "viruses... will break through filters at the first sign of turbidity breakthrough" |
| M1 | Mechanisms: straining, sedimentation, flocculation, adsorption | SUPPORTED | MOP 24-40 |
| M1 | Removal could exceed 95 percent; 95-99 percent typical | SUPPORTED | WI 2.3.1; sp4 4.4.1 "95 to 99% of the suspended matter" |
| M1 | Wastewater sticky, concentrated; thin sand beds blind; dual/multimedia use more depth | SUPPORTED | MOP 24-20 |
| M1 | Shallow-bed under about 18 in; deep-bed 30-48 in anthracite, sand, garnet | SUPPORTED | WI 2.3.1 |
| M1 | Semicontinuous vs continuous backwash; gravity or pressure | SUPPORTED | MOP 24-7, 24-8 |
| M1 | Disc cloth nylon or polyester, about 10 micrometre pores | SUPPORTED | WI 2.3.14 |
| M1 | Submerged disc outside to inside, suction on 1-2 discs at a time; partially submerged inside to outside, sprays | SUPPORTED | WI 2.3.14 |
| M1 | Disc benefits: footprint, lower head, retrofit | SUPPORTED | WI 2.3.13 |
| M1 | Microfiltration separates suspended and colloidal solids too small for media filter; high cost | SUPPORTED | WQC 8.8.1.4, 8.8.2 ("high capital and operating cost"); MOP/WQC |
| M1 | Filter does not remove dissolved ammonia/BOD; nitrification separate | SUPPORTED | sp4 4.5 nitrification as separate step; dissolved-pass-through is general |
| M1 | Filtration alone on activated sludge occasionally; less effective on trickling filter and RBC effluent; regulators require coag or direct filtration for reuse | SUPPORTED | MOP 24-7 |
| M1 | Advanced treatment costly, benefit not always large | SUPPORTED | sp4 4.1 |
| M2 | Bed 10-36 in of 0.35-1.5 mm grains; large particles near surface | SUPPORTED | MOP 24-7 |
| M2 | Dual media anthracite over sand; multimedia adds garnet; specific gravities 1.4, 2.65, 4.5 | SUPPORTED | MOP 24-20 |
| M2 | Backwash sorts grains by density so coarse light grains end on top | NOT COVERED | General filter practice; not quoted in checked texts |
| M2 | Stores solids "throughout the depth of the bed rather than only at the surface" | SUPPORTED | MOP 24-20 |
| M2 | Components: media, underdrain, troughs, media support (gravel, strainers, plates) | SUPPORTED | WI 2.3.2 |
| M2 | Diatomaceous earth filter has septum and filter aid precoat; diatomite blinds on wastewater | SUPPORTED | WQC 8.7.4.2; MOP 24-20 |
| M2 | Three rate control methods | SUPPORTED | MOP 24-41 |
| M2 | Uniform flow matters, local high velocity pushes solids through | NOT COVERED | Royce-independent general principle; not found in textbooks read |
| M2 | Hydraulic loading = gpm / ft2 (Spellman 5.83) | SUPPORTED | sp6 Eq. 5.83 |
| M2 | UFRV = gal / ft2; compares runs; declines as filter deteriorates | SUPPORTED | sp6 5.6.8.3 |
| M2 | Pounds = mg/L x MGD x 8.34; 1 MGD = 694.4 gpm | SUPPORTED | sp6 Eq. 5.94 and 1,440 min/day (5.134) |
| M2 | Clean-bed head loss same at given flow; rising initial head loss means short wash or surface wash arm | SUPPORTED | MOP 24-44 |
| M2 | Backwash scheduled by head loss, time, or total flow | SUPPORTED | WI 2.3.3 |
| M2 | Surges push particles through bed; change flow gradually | SUPPORTED | MOP 24-44 |
| M2 | Filter aid four benefits; need rises with cooler water, flow, turbidity; optimum dose; 3-4 runs to coat; direct filtration | SUPPORTED | MOP 24-7, 24-41, 24-43 |
| M2 | Too much aid clogs surface | SUPPORTED | WI 2.3.11; sp4 4.4.2 symptom 5 |
| M2 | Records: initial head loss, UFRV comparison example | SUPPORTED | MOP 24-44; sp6 5.6.8.3 (numbers are the course's own) |
| M3 | Backwash triggers; turbidity max takes filter out of service | SUPPORTED | WI 2.3.3, 2.3.4; MOP 24-44 |
| M3 | Flow reversed through underdrain, bed expands, solids to troughs | SUPPORTED | WI 2.3.4 |
| M3 | Rise rate (in./min) = gpm/ft2 x 1.6 | SUPPORTED | sp6 Eq. 5.88 |
| M3 | Proper backwash expands bed 20-25 percent; other texts differ | SUPPORTED | sp6 5.6.8.11; WQC 8.7.4 gives 30-50 percent (lesson says ranges differ) |
| M3 | Warm water less viscous; raise rate | SUPPORTED | MOP Table 24.3; sp4 4.4.2 symptom 11 |
| M3 | Three backwash methods; air scour 3-4 min before; air-water floats coal | SUPPORTED | MOP 24-41/42 |
| M3 | End auxiliary scour before wash ends | SUPPORTED | sp4 symptom 10; MOP Table 24.3 |
| M3 | Washwater under about 5 percent; small plants 8-10 percent; causes | SUPPORTED | MOP 24-45; sp4 symptom 4 |
| M3 | Washwater held and returned at controlled rate; blended, sometimes to rapid mix | SUPPORTED | MOP 24-7, 24-45 |
| M3 | Slug of washwater loads clarifier and returns as carry-over | NOT COVERED | Inference from "avoid hydraulic surges through the plant" (MOP 24-7) |
| M3 | Disc cleaning: suction, sprays, solids pumped to headworks; chemical cleaning every few months | SUPPORTED | WI 2.3.14-2.3.16 |
| M3 | Mudballs up to over 2 in; uneven filtering, cracks; reduce effective area; percent mudball volume | SUPPORTED | WQC 8.7.4.1; sp6 5.6.8.10 |
| M3 | Media loss causes: high rate, unlevel troughs, long surface wash, uneven distribution | SUPPORTED | MOP Table 24.3 |
| M3 | Observing spent washwater, even boil, level troughs | NOT COVERED | Practice advice; MOP Table 24.3 supports trough levelness |
| M4 | Daily observations list | SUPPORTED | WI 2.3.6 |
| M4 | Turbidity-to-TSS factors 2.0-2.4 settled, 1.3-1.5 filter effluent | SUPPORTED | MOP 24-45 Eq. 24.7, 24.8 |
| M4 | Causes of high turbidity; viruses 0.5 NTU | SUPPORTED | MOP Table 24.3, 24-27 |
| M4 | Short-run causes; chlorine for algae and slime | SUPPORTED | MOP Table 24.3; WI 3.6.3, 3.6.4 |
| M4 | Clarifier determines filter solids loading | SUPPORTED | WI 2.3.10 |
| M4 | Final clarifier problem causes | SUPPORTED | WI Fig. 3.6.1.3 |
| M4 | Turbidimeter calibration at least weekly; fill from bottom; extended out-of-service steps | SUPPORTED | MOP 24-46, 24-43; WI 2.3.8, 2.3.9 |
| M4 | Safety hazards (automatic start, noise, slips) | NOT COVERED | General recognition-level statement |

## Question claims (concept)
All 36 concept questions rest on the lesson claims above (WI, MOP, Spellman, WQC rows). Concept answers from: tertiary purpose, turbidity vs TSS, disc cleaning, microfiltration, wastewater filtering difficulty, disc selection, bed storage, residual recycle (M1); layering, head loss, filter aid, rate control, surges (M2); triggers, expansion, media loss, disc maintenance, washwater return, scour, warm weather, mudballs (M3); breakthrough, algae, upstream, records, troubleshooting, virus warning (M4). Classroom assumption in M4 F2 (run length inversely proportional to solids) is labelled an assumption in the prompt and is NOT COVERED by any source.

## Arithmetic
28 numeric questions recomputed by `numcheck.py` (python3 -I) with separate formulas: all match the marked answer, and none equals a number in its own prompt.
