# Writer flags for the reviewer

Items a writer was least sure about. A reviewer should read these first. Remove an item if it depends on local practice, since the writer brief says to leave those out.

## Batch 1: Network components

Conceptual (by the start of the question):
1. "How does a dry-barrel hydrant protect itself in freezing weather?" Stated only that the main valve sits below the frost line and the barrel drains.
2. "In systems that use a common color scheme, what does the color on a hydrant bonnet or cap usually tell firefighters?" Rated flow class. A utility convention, may vary locally.
3. "What does an altitude valve do at a ground-level tank?" The explanation adds that a two-way valve lets flow back when pressure drops. That is not true of every installation.
4. "Why is minimum night flow into a metered zone useful in finding leakage?" The explanation says "about 2 to 4 in the morning", typical and not universal.
5. "Why is it often harder to hear a leak on plastic pipe than on metal pipe?"
6. "For which kind of connection is a double check valve assembly generally selected?" and "A plant mixes toxic chemicals ... Which protection is appropriate for that high hazard?" Both follow the usual hazard-based scheme, and some jurisdictions differ.
7. "Which limit applies to an atmospheric vacuum breaker?" and "How does a pressure vacuum breaker differ from an atmospheric vacuum breaker?"
8. "A reduced-pressure assembly is installed in a pit with no drain, and the pit floods. Why is that a problem?"
9. "Why is a service saddle often used when tapping certain mains?" Depends on pipe material and local practice.
10. "Why is a flexible loop or gooseneck often put in a service line near the main?" Practice varies.
11. "Why is a temporary connection that fills a main being disinfected from a live main usually fitted with backflow protection?"
12. "Why is a new main pressure tested before it is connected for service?" and "Why are water samples taken after a new main has been disinfected and flushed?" Framed as general practice.
13. "How does the registration of an old, worn meter usually change?" Under-registration is typical and not universal.
14. "Which condition suits a turbine meter best?"
15. "Why does a fire-service detector assembly often include a small meter on a bypass line?"
16. "A flow test shows the pressure falling from 70 psi static to 25 psi residual at only a moderate flow. What does that suggest?" Restricted or too-small mains. A partly closed valve is also plausible.

Calculations to double-check:
- Thrust at a dead end uses the nominal pipe diameter. The 90-degree bend item uses sin 45° = 0.707, stated in the question.
- The hydrant flow formula Q = 29.83 × c × d² × √p uses a pre-computed √36 = 6, stated in the question.
- The backflow "excess pressure from a 120 ft column" item (120 × 0.433 − 40 = 11.96 psi) is a simplified back-pressure illustration.

## Batch 2: Hydraulics

Conceptual (in file order):
1. "About how many feet of water column produce 1 psi" and "Which flow is about equal to 1 MGD". Rounded constants (2.31, 694).
2. "A gauge at 700 ft reads 62 psi... what does a gauge at 560 ft read" (about 123 psi), and "A gauge at ground level reads 55 psi... 46 ft higher" (about 35 psi). Rounded estimates.
3. "What mainly sets the no-flow pressure on the low side of a pressure reducing station" (the pilot setting). Assumes a conventional valve with supply available.
4. "What does it mean if the HGL falls below the pipe elevation" (pressure below atmospheric), and the cavitation and negative-pressure questions near it.
5. "How does the C factor of an unlined iron main change as it ages" and "Which pipe usually has the lowest friction loss". "Poorly lined rough concrete" as a wrong option is arguably ambiguous.
6. "Lining an old rough 8-inch main: effect on capacity" (usually rises). Depends on pipe condition and lining thickness.
7. "A cleaning program raises C: what happens with the same pump head?" Presumes C really improves.
8. "If the flow through a pipe is doubled, friction loss rises by much more than double". The explanation says roughly 3.5 to 4 times, which holds for an exponent near 1.85 to 2.
9. "Small systems have higher peaking factors". A tendency, not a rule.
10. "Why is fire flow often checked together with maximum day demand" and "Which demand judges routine pressure (peak hour)". Design convention.
11. "Pump operating far right on its curve: cavitation and motor overload". Overload depends on the pump's power curve; some are non-overloading.
12. "Two identical pumps in parallel deliver less than twice the flow". Wording is dense.
13. "Which pipe produces the larger surge for the same velocity change". HDPE chosen as the flexible example because PVC is borderline.
14. "How fast do pressure waves travel" ("some thousands of feet per second"). Varies with pipe.
15. "Which practice reduces surge when a pump starts (soft starter or controlled valve opening)".
16. "Pressure drops and flow into a zone rises sharply: likely a large leak or main break". Other causes are possible, such as a hydrant opened in a flushing program.
17. "A recorder on a hydrant shows pressure dipping each afternoon: daily peak demand".
18. "A PRV station separates zones with grade lines 1,200 and 1,000 ft: about 87 psi". Uses 0.433 psi per ft.

Calculations to check:
- Velocity items (8-in at 500 gpm, 10-in at 1,100 gpm, 6-in at 350 gpm) and the 12-in to 8-in continuity item. They state the 448.8 and 0.785 constants.
- Pump affinity items (flow proportional to speed, head to speed squared). Idealised.
- "Pump discharges at 92 psi, suction 8 psi": total head ignores velocity head and gauge elevation difference.
- Pressure-drop-per-100-gpm and head-loss-per-1,000-ft items are simple ratios.
- The two peaking-factor items use the unit "times" for a unitless ratio.
