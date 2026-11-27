# LEFT-FOR-HUMAN: TX wastewater treatment Class C (narrow), giveaway rewrite

These wrong options were still flagged by the final GPT review pass (`gpt-6.2-sol`, round 3 of 3), or got no verdict in that pass. They are not approved. A person who knows the TCEQ Class C material should keep, rewrite or drop each one. Item IDs follow `questions/bank-402.json` (`TX-C-WW-nnn`). "Option" is the wrong-option number in `source/` (1 to 3), not the displayed letter, which is shuffled in the build.

Counts: 102 options flagged, 2 options with no verdict, out of 519 options that differ from the original commit (493 conceptual, 26 calculation values). 91 of 251 changed items have at least one flagged option.

| Item | Option | Current text (or value) | GPT reason |
|---|---|---|---|
| TX-C-WW-004 | 3 | The operator's notes from the weekly walk-through, which record that the effluent looked clear. | Visual clarity does not establish compliance with a measured effluent limit. |
| TX-C-WW-025 | 2 | The sampling plan has not been revised since the plant's first permit was issued. | A plan unchanged since the first permit can itself warrant review, so this is also a defensible answer. |
| TX-C-WW-028 | 2 | The lab should be told about the upgrade so it can rebuild its calibration curves. | A process upgrade does not by itself call for rebuilding lab calibration curves or explain why the sampling plan needs review. |
| TX-C-WW-036 | 3 | Keeping the tank's surface agitated so that more air escapes before it can be absorbed. | Promoting air escape before absorption directly opposes the stated goal of transfer into the liquid. |
| TX-C-WW-041 | 3 | The clarifier's sludge blanket depth, since deeper sludge releases oxygen back into the tank. | A deeper sludge blanket is not a source of oxygen for the aeration tank. |
| TX-C-WW-050 | 1 | A tank that is left closed for a shift, because its air slowly cools and condenses on the walls. | It treats cooling and wall condensation as if they removed oxygen from the tank air. |
| TX-C-WW-053 | 1 | Separation keeps the storage room cool, since mixed containers warm the air around them. | Chemicals in separate intact containers do not heat the room merely because they are stored together. |
| TX-C-WW-054 | 1 | It reacts with the room's air moisture, which can leave a corrosive film on the floor. | The floor-film claim is too tangential to be a credible main hazard of an enclosed chlorine release. |
| TX-C-WW-055 | 1 | A clear path keeps the panel's door from rubbing the cables, which is the main cause of outages. | It invents a link between walkway clearance, cable rubbing and the main cause of outages. |
| TX-C-WW-058 | 1 | Storing them together lets the cleaner's label fade from the bleach fumes, so the containers get mixed up. | The label-fading story is not a credible reason to segregate bleach and acidic cleaners. |
| TX-C-WW-060 | 3 | It reduces the need to record the time of each aliquot, once the total is logged. | The recordkeeping shortcut does not explain why aliquots are collected across the full window. |
| TX-C-WW-062 | 1 | So the lab can tell which preservative was added by reading the collector's name on the label. | A collector's name does not identify the preservative added to the bottle. |
| TX-C-WW-062 | 2 | So the time on each bottle replaces the field notes for the sample's collection. | A timestamp cannot replace the other collection details recorded in field notes. |
| TX-C-WW-062 | 3 | So the labeled bottles can skip the batch blank, since each bottle is already accounted for. | Sample identification does not serve the contamination-checking function of a batch blank. |
| TX-C-WW-063 | 3 | Wiping each bottle rim with the same alcohol pad before replacing the cap. | Using the same pad on multiple rims creates an obvious route for cross-contamination. |
| TX-C-WW-071 | 1 | To check that the lab's technician has completed the required training for the method. | A batch control result does not document whether a technician completed required training. |
| TX-C-WW-076 | 1 | To count how many shifts each operator has worked, so the next schedule can be balanced. | Counting shifts for scheduling is a staffing function, not a credible reason to review process logs each shift. |
| TX-C-WW-080 | 3 | Overtime tracks each breakdown, since crews log extra hours just when equipment fails. | The phrase 'just when equipment fails' implies overtime occurs only for breakdowns. |
| TX-C-WW-083 | 2 | The number of open work orders shows how many spare parts the plant should order. | A work-order count does not establish parts needs, and the option gives no link to process control. |
| TX-C-WW-084 | 3 | It lets the plant report the change weeks later, once the first lab results are in. | Reporting weeks after the change does not explain why the regulator should be told beforehand. |
| TX-C-WW-086 | 1 | Lower energy use usually means the plant is treating less flow, so the effluent check can wait. | It argues for postponing the check rather than answering why the operator should still check the effluent. |
| TX-C-WW-092 | 1 | The influent heat shows how much grit reaches the basin, since warm sewage carries more solids. | Influent temperature is not a credible proxy for grit loading. |
| TX-C-WW-095 | 3 | Higher nutrient readings mean the stream has more fish, which use up its oxygen supply. | A high nutrient reading does not indicate that the stream contains more fish. |
| TX-C-WW-096 | 3 | The exact species of bacteria in the sample, which the E. coli count identifies directly. | An E. coli count does not identify the other bacterial species in a sample. |
| TX-C-WW-097 | 2 | The main concern is the bad smell, which drives complaints but does not affect health. | It dismisses health effects rather than explaining why the overflow poses a health concern. |
| TX-C-WW-097 | 3 | The spill lowers the water table near the nearest drinking water well, so the well needs chlorine. | A sewer overflow does not inherently lower the water table or establish a need to chlorinate a well. |
| TX-C-WW-101 | 3 | Nutrient enrichment is the primary concern because algae growth raises the river's salinity during the day. | Nutrient enrichment is relevant, but daytime salinity increases are not a credible reason to prioritize it. |
| TX-C-WW-107 | 3 | Seal the manhole lids with grout before reviewing any flow records. | Grouting the lids is a repair based on an assumed source, not a step that identifies the cause. |
| TX-C-WW-109 | 1 | To hold sewage in a wet well for a short time, so the solids can settle before sampling. | A lift station wet well is not a settling basin for sample preparation. |
| TX-C-WW-110 | 2 | Fresh air drawn through manhole vents dries the pipe walls, which releases odor from the crust. | The pipe-wall drying explanation is not a credible common source of sewer odors. |
| TX-C-WW-110 | 3 | Storm drains that run during rain and push water into the sanitary sewer. | It describes stormwater inflow without explaining a source or release of odor. |
| TX-C-WW-112 | 1 | To measure how much rainwater each manhole adds, so the crew can rank the streets. | A single sewer flow monitor does not isolate the rainwater contribution from each manhole. |
| TX-C-WW-114 | 2 | The plant's bar screen needs extra raking while the crew works upstream, since debris is expected. | Extra screen raking in response to incoming debris is a valid reason to coordinate. |
| TX-C-WW-114 | 3 | The plant's operators can join the crew for the shift, so the plant needs a staffing plan. | Having plant operators join the cleaning crew is not an operational reason to warn the plant about cleaning. |
| TX-C-WW-120 | 3 | Run hours decide which pump's oil is changed first, since oil loses viscosity with use. | Using run hours to schedule oil changes is a valid example of maintenance planning. |
| TX-C-WW-121 | 1 | It keeps the wet well level steady, since one pump runs at full speed through the day. | Running one pump continuously does not describe alternating the lead pump. |
| TX-C-WW-123 | 2 | To start the pumps by timer, so the wet well level is checked once per shift. | Timer-based starts and shift checks do not explain the level control or high-level alarm. |
| TX-C-WW-130 | 3 | To catch the plastic bags that float in the wet well before they reach the pumps. | Keeping plastic bags out of pumps is a valid example of the screen's protective purpose. |
| TX-C-WW-131 | 3 | The screen releases stored sludge into the channel, so the influent solids test rises. | It treats the bar screen as a sludge storage and release unit rather than a screenings barrier. |
| TX-C-WW-133 | 2 | Rinsing returns the screenings' fine solids to the influent, so the screen catches them again. | Sending fines back so the screen can catch them again does not explain preparing screenings for disposal. |
| TX-C-WW-133 | 3 | Pressing adds water to the screenings so they can be pumped to the landfill. | It reverses dewatering by claiming that pressing adds water. |
| TX-C-WW-135 | 2 | A fine screen needs more frequent raking because its bars are spaced farther apart. | Farther-apart bars contradict the defining feature of a fine screen. |
| TX-C-WW-137 | 3 | Sand is taken out last, to keep the sludge pumps from clogging with fine grit. | Saying sand is removed last contradicts the question's premise that grit is removed before primary treatment. |
| TX-C-WW-139 | 2 | The amount of sand captured shows how much rain fell on the plant's service area. | Grit capture is not a credible measure of rainfall across the service area. |
| TX-C-WW-140 | 2 | Sand mixes into the primary sludge and lowers its pH, which makes the thickener foam. | Ordinary sand does not meaningfully acidify primary sludge or explain thickener foaming. |
| TX-C-WW-140 | 3 | Sand drops into the aeration tank and feeds bacteria, which raises the tank's aeration demand. | Mineral sand is not bacterial food and does not directly increase aeration demand. |
| TX-C-WW-141 | 2 | The washer dissolves the grit's coating so the discharge flows more evenly to the bin. | The washer washes organic matter off grit; dissolving a coating to improve flow into the bin is not a credible purpose. |
| TX-C-WW-150 | 1 | The sludge layer holds steady in depth, so the current schedule is already correct. | It explicitly says the current schedule is correct, the opposite of a result indicating adjustment. |
| TX-C-WW-151 | 1 | First-stage sludge has been aerated longer, so more of its water has been driven off. | Primary sludge has not undergone longer aeration, and aeration does not dry it as described. |
| TX-C-WW-154 | 3 | Skimmed grease is mostly water, so it dilutes the anaerobic feed and lowers its gas output. | It treats skimmed grease as mostly dilution water, an obviously misleading premise for the material named. |
| TX-C-WW-155 | 2 | The amount of fabric in the draw-off shows how well the bar screen is operating upstream. | Rags in the draw-off can genuinely indicate upstream screening problems, making this a defensible answer as written. |
| TX-C-WW-157 | 2 | Confirm that the scum box is emptied by pump once a week and the grease is logged. | The fixed weekly schedule has no basis in the scenario and does not verify the effect of the frequency change. |
| TX-C-WW-160 | 1 | Summer rain washes fertilizer into the pond, which feeds algae and raises the pH. | The option stops at algae growth and higher pH without explaining the odor. |
| TX-C-WW-163 | 1 | To keep the pond's sludge from floating up when the water table rises under it. | A rising water table can lift the liner, but the liner does not keep pond sludge from floating. |
| TX-C-WW-164 | 3 | The inlet is set too close to the crest, so wastewater spills over the embankment. | Spilling over the embankment does not explain flow reaching the outlet quickly. |
| TX-C-WW-165 | 2 | Loading sets how often the pond is drained, inspected and cleaned each season and after storms. | Areal BOD loading does not prescribe seasonal or post-storm draining and inspection. |
| TX-C-WW-165 | 3 | Sludge depth in the pond sets its BOD, which tells the lab how often to sample. | This shifts from tracking incoming organic load to setting a sampling schedule from sludge depth. |
| TX-C-WW-166 | 2 | The extra solids sink to the bottom and keep the water from mixing with air. | Solids settling at the bottom do not block air contact at the surface. |
| TX-C-WW-167 | 1 | Cold water lets more algae float to the top, so the outlet pulls them out with the effluent. | The claim that cold water makes algae float into the outlet lacks a credible link to the stated conditions. |
| TX-C-WW-172 | 2 | To spray a little chlorine through the arm each shift, which keeps the media clean. | Routine chlorine application is not the arm's function and could harm the treatment biofilm. |
| TX-C-WW-172 | 3 | To hold the top media layer in place during high flows, so the packing does not shift. | A rotating distributor is not positioned or built to restrain the media. |
| TX-C-WW-173 | 1 | The extra exposed material holds more food for the biofilm, so the bed needs less air. | The claim that holding more food reduces the biofilm's need for air reverses the expected oxygen-demand relationship. |
| TX-C-WW-176 | 2 | Ventilation cools the packing so the slime grows thicker and the liquid drains slower. | Thicker slime and slower drainage are operating problems, not reasons to provide ventilation. |
| TX-C-WW-184 | 3 | To check that the new setting has not raised the effluent's temperature above normal. | The question gives no reason to expect a filter adjustment to heat the effluent. |
| TX-C-WW-187 | 2 | The return sludge rate is too high, so the mixed liquor is thinned and carries less oxygen. | It treats return sludge as dilution water and incorrectly links that dilution to low oxygen. |
| TX-C-WW-192 | 3 | Agitation breaks the sludge into lighter pieces that rise out with the effluent. | Breaking up sludge so it escapes with the effluent is plainly not a purpose of aeration basin mixing. |
| TX-C-WW-195 | 2 | A higher inlet level pushes more solids over the weirs, so the blanket appears to rise. | Solids passing over the weirs do not explain a rise in the settled sludge blanket. |
| TX-C-WW-196 | 3 | Weak floc gets stuck on the clarifier weirs, so the flow over them is uneven. | Weak floc carrying over the weirs does not explain the claimed uneven flow over them. |
| TX-C-WW-200 | 3 | The plant has been running longer each day, so the floc is older and compacts more slowly. | The question gives no basis for longer daily run hours, which do not by themselves establish sludge age. |
| TX-C-WW-203 | 3 | Set the controller to auto and back to manual each hour, so the output is checked. | The arbitrary hourly mode switching does not describe what manual mode lets an operator control. |
| TX-C-WW-204 | 3 | To confirm the sensor's cable has not been replaced since the last calibration. | An accuracy check does not establish whether the cable was replaced. |
| TX-C-WW-209 | 3 | The shape of the plotted curve identifies the cause without needing other operating data. | Trend shape can suggest causes, but claiming it identifies the cause without corroborating data is too categorical. |
| TX-C-WW-212 | 2 | A seasonal change in the water temperature, which shifts the pressure reading gradually. | A gradual seasonal shift explicitly conflicts with the sudden step in the question. |
| TX-C-WW-217 | 1 | Its main hazard is corrosion of nearby electrical contacts in damp areas of the building. | Corrosion of electrical contacts is too narrow and secondary to pass as the main gas hazard. |
| TX-C-WW-220 | 2 | To reconcile the chemical inventory with the amount recorded in the log. | Reconciling inventory is a bookkeeping task, not a reason to check feeder operation. |
| TX-C-WW-226 | 2 | High pH makes the disinfectant react with the basin walls, so less reaches the water. | It invents a high-pH wall reaction as the cause of weaker disinfection. |
| TX-C-WW-230 | 2 | The sludge has enough buffering capacity to handle an increase in the feed rate. | Rising volatile acids do not indicate spare buffering capacity or readiness for more feed. |
| TX-C-WW-232 | 3 | A sharp drop in gas output while the sludge level stays steady. | A drop in gas output without a level change is nonspecific and gives no clear sign of foam. |
| TX-C-WW-239 | 2 | Gas composition shows how much sludge the tank can hold before it has to be emptied. | Methane fraction does not indicate the tank's sludge holding capacity. |
| TX-C-WW-241 | 3 | To prevent the contents from cooling enough to settle between routine mixing cycles. | It invents cooling-induced settling between mixing cycles as a reason for the gas seal. |
| TX-C-WW-242 | 3 | A gas meter reading low caused the laboratory to calculate less volatile solids removal. | Gas meter readings are not inputs to the laboratory's volatile-solids reduction calculation. |
| TX-C-WW-245 | 1 | Stretched mesh makes the rollers spin faster, which shortens the time sludge is pressed. | Stretched fabric does not make the driven rollers turn faster. |
| TX-C-WW-246 | 3 | A cake that comes off the belt in clumps, which points to the press's drive being too fast. | It points to drive speed rather than polymer dosing and gives no clear dosing symptom. |
| TX-C-WW-248 | 3 | The filtrate's odor check during the same shift, which shows the press's belt speed. | Filtrate odor does not indicate belt speed. |
| TX-C-WW-249 | 1 | The feed sludge has been stored longer, so it has thickened and carries more water. | It claims thickening increases the sludge's water content, an obvious contradiction. |
| TX-C-WW-250 | 3 | It shows how many days each load sat in storage before being hauled. | A haul date does not show when the material entered storage. |
| TX-C-WW-251 | 2 | That a good result from one batch establishes the quality of later batches. | A result for one batch plainly does not verify the quality of batches not yet produced. |
| TX-C-WW-252 | 2 | A hard surface keeps the cake warm enough that pathogens stop regrowing for a week. | The claim that a hard surface prevents pathogen regrowth for a week is implausible. |
| TX-C-WW-252 | 3 | The paved surface makes rain run off into the pile, so the cake stays damp. | It presents routing rain into the cake and keeping it wet as a benefit of the pad. |
| TX-C-WW-254 | 3 | Odor control lets the plant skip the moisture test, since smell shows how wet the cake is. | Smell is not a credible substitute for a cake moisture test. |
| TX-C-WW-255 | 2 | To keep rain off the stockpile so the cake can skip its stabilization test. | Keeping rain off the cake plainly does not demonstrate stabilization or waive testing. |
| TX-C-WW-258 | 1 | It shows how quickly the discharge reaches a monitoring point downstream. | Downstream travel time is a separate measurement from dilution. |
| TX-C-WW-258 | 3 | It estimates how many pounds of pollutants the plant releases each day. | The ratio does not provide the effluent concentration and flow needed to calculate daily pollutant mass. |
| TX-C-WW-259 | 2 | The distance the effluent travels downstream from the outfall each day. | Daily travel distance describes transport rather than a defined mixing area. |
| TX-C-WW-261 | 1 | A deep discharge pipe ending on the stream bed, where the current is hard to measure. | Difficulty measuring the current does not explain poor mixing. |
| TX-C-WW-267 | 3 | Dechlorination monitoring checks whether the chemical feed pump has enough spare capacity. | Spare pump capacity is an equipment-sizing issue, not the purpose of routine dechlorination monitoring. |
| TX-C-WW-272 | 2 | Feet of head is the diameter of the pipe, which is used when choosing the pump motor. | It plainly confuses pressure head with the pipe's diameter. |
| TX-C-WW-273 | 2 | The numbers can be calculated as written and labeled with the requested unit afterward. | It repeats the existing distractor's calculate-first mistake, making the correct choice stand out. |
| TX-C-WW-276 | 1 | MGD means mass gravity draw, a term used for the plant's storage tanks. | Mass gravity draw sounds invented and is not a credible wastewater storage term. |
| TX-C-WW-281 | 3 | The % symbol is kept so the calculator knows to skip the conversion step. | It says to keep the percent symbol, contradicting the question's premise that the percentage is rewritten. |
| TX-C-WW-321 | 1 | 3.0 cfs (calculation; key unchanged) | Only 0.1 cfs below the correct answer; rounding the conversion factor early to 1.5 gives this near-match. |
| TX-C-WW-351 | 3 | 87120 ft3 (calculation; key unchanged) | Equals two acres converted to square feet; getting two by subtracting depth from acreage has no plausible basis in the volume calculation. |

## Options with no verdict in the final pass

| Item | Option | Current text |
|---|---|---|
| TX-C-WW-133 | 1 | Washing makes the screenings lighter so they haul more easily. |
| TX-C-WW-195 | 3 | Low feed strength makes the floc buoyant as the organisms use up their food. |
