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

## Batch 3: Storage

Conceptual (the questions below depend on practice that varies or on a stated simplification):
1. "Why do many utilities keep routine tank cycling above the fire reserve level?"
2. "Which tank volume is normally drawn on first when demand exceeds supply?" Assumes the usual layout.
3. "Why can a pump station with a tank on the system be sized for maximum day demand instead of peak hour demand?" Design convention.
4. "Why is the pump start level set above the fire reserve level?"
5. "Why do many systems fill a tank during the night?"
6. "A level transmitter is on a pipe that carries flow instead of at the tank wall. Why might its reading mislead?"
7. "Why is the lower part of a tall standpipe often poor at supplying the zone by gravity?"
8. "A ground-level reservoir has a water surface lower than the zone needs... what happens to zone pressure if the pump stops?"
9. "Why might a small system choose a hydropneumatic tank?" and "Why can a hydropneumatic tank that has lost its air cushion cause the pump to cycle often?"
10. "How is a roof hatch commonly protected from contamination?"
11. "Why does an overflow pipe usually end with an air gap and a screen or flap?" and "Why is an overflow pipe sized to carry at least the maximum inflow rate?"
12. "What do cathodic protection systems in some steel tanks do?"
13. "Why is a tank often disinfected before it returns to service after cleaning?" and "Why is the water in a tank often tested for bacteria after cleaning and before service?"
14. "Why must some tank inspections be done with the tank taken out of service?"
15. "Why can an early recoat be sensible before the tank leaks?"
16. "Why are tank sites often fenced and monitored?"
17. "Which sign points to pitting corrosion on tank steel?"
18. "Why do warm summer temperatures add to a tank water quality concern?"
19. "Why might the chlorine residual in a tank be lower than in the mains feeding it?"
20. "A tank is made larger but the daily demand stays the same. What happens to water age?" and "A tall narrow tank and a short wide tank hold the same volume. Which statement is correct for the same draw?"

Calculations that rely on a simplified assumption:
- The fire plus equalizing item assumes equalizing volume of 25% of maximum day demand.
- The emergency reserve item assumes 50,000 gal.
- The "tank turns over once" items assume a fully mixed tank.
- The hydropneumatic item converts a psi range to feet, assuming pump start and stop settings are the range.

## Batch 4: Water quality and monitoring

Conceptual:
1. "Why might a utility switch temporarily to free chlorine in a chloraminated system with nitrification?" A practice some utilities use.
2. "Why is a sample bottle ... supplied with a dechlorinating agent" and "Why are samples for bacteria generally kept cool and delivered within a limited time". General practice, no times or temperatures.
3. "A routine sample shows a positive result for total coliform ... What does this generally mean?" and "What is the general next step after a positive routine bacteriological result?" Detail varies.
4. "What do heterotrophic plate count bacteria give a general picture of?" A simplification.
5. "A rise in white or cloudy water complaints in cold months is often tied to what?" Dissolved air. Typical, not universal.
6. "What is a possible cause of rotten egg odor at hot water taps only?" Water heater bacteria and anode reactions are typical.
7. "Low pressure complaints from a single customer ... most often point to" a property-side problem. A tendency.
8. "Compared with free chlorine, how does chloramine usually behave" and "How does warm water usually affect chlorine residual decay". Tendencies.
9. "Why does a larger-diameter main in a low-demand area tend to raise water age?" and the "subdivision planned for many homes" question. Assume low demand and plug flow.
10. "How does unidirectional flushing differ from conventional flushing?" Depends on the program.
11. "Why do operators think about where flushed water goes?" and "Why is a flushing program usually planned with a map and a sequence?"
12. "Why do renewal projects often include replacing old service lines?" and "When might replacing a main make more sense than cleaning and lining it?" Planning judgements.
13. "Why might a cleaned main need renewed attention to its disinfectant residual?" A generalisation.
14. "Why can a change in the source or treatment of water lead to colored water complaints?" and "How might lead or copper in tap water relate to the distribution system and plumbing?"
15. "Why is cement-mortar lining often used ... with regard to corrosion?" The pH claim holds for fresh cement mortar and is variable.
16. "Who should test a backflow prevention assembly, in general terms?" Tester certification varies by jurisdiction. The related containment versus isolation question is a policy choice.

Calculations that rely on a stated simplification:
- The residual-loss item (0.15 mg/L per day for 2 days, then 0.05) is an invented decay pattern, stated in the question.
- The 12.5% hypochlorite item assumes 8.34 lb/gal, stated and slightly off in reality.
- The dead-end water age items treat the main as a single plug.
- The negative-pressure item is a simplified static illustration.
- Percent-of-samples and percent-positive items use targets or counts stated in the question, not regulatory limits.
- The coupon item assumes a steady corrosion rate.
