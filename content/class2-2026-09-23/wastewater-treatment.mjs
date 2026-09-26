import { family as F, calculation as C, numeric as N } from "./helpers.mjs";
import { waterTreatment } from "./water-treatment.mjs";
const E="Equipment Evaluation, Maintenance & Operation", P="Treatment Process Evaluation & Adjustment", L="Laboratory Analysis", A="Safety & Admin";
export const wastewaterTreatment = [
  F(P,"Headworks screening","WW_PRIMARY","Preliminary treatment: removal of large debris before downstream equipment.","Which action or finding best addresses the headworks problem?",
    ["Inspect the upstream screen for blinding and increase cleaning frequency.","Check whether bypass flow is carrying unscreened debris downstream.","Verify screenings handling and compactor operation.","Compare flow and headloss across both parallel screens."],[
    ["Upstream level rises and differential head across one screen increases as rags accumulate.",0,"Screen blinding restricts influent passage."],
    ["Large debris reaches grit equipment only when a bypass gate is open.",1,"The bypass permits solids to evade screening."],
    ["The screen catches debris but compacted screenings overflow their container.",2,"Downstream handling has become the limiting step."],
    ["One of two screens overflows at high flow although the other still has capacity.",3,"Flow split and unit-specific headloss should be compared."],
    ["The rake cycle stops and wet rags accumulate on the bars.",0,"Restoring cleaning is the immediate control."],
  ]),
  F(P,"Grit removal","WW_PRIMARY","Preliminary treatment: settleable grit, pump wear, and organic carryover.","Which observation best identifies the problem?",
    ["Grit is passing through and accumulating in downstream basins.","Excess organic material is being removed with the grit.","An upstream change in flow has shortened effective grit residence.","The grit washing or classification equipment is not separating solids effectively."],[
    ["Sand deposits appear in primary channels while grit hopper collection suddenly falls.",0,"Grit carryover suggests inadequate removal."],
    ["Grit containers contain unusually high amounts of putrescible organic solids.",1,"Organic carryover implies poor separation or operating conditions."],
    ["Grit performance worsens only during a high-flow storm surge.",2,"Hydraulic loading changes capture effectiveness."],
    ["The grit chamber collects solids but discharged material remains excessively wet and dirty.",3,"The washer or classifier may not be functioning as intended."],
    ["Downstream pump wear increases as grit capture declines despite unchanged influent sand content.",0,"Grit is likely passing through the headworks."],
  ]),
  F(P,"Primary clarifier solids","WW_PRIMARY","Primary sedimentation: sludge withdrawal, scum, surface loading, and short circuiting.","Which check most directly tests the observed cause?",
    ["Verify primary sludge pumping and blanket depth.","Inspect scum skimming and surface removal.","Assess peak flow and hydraulic loading across clarifiers.","Inspect inlet baffles for short circuiting."],[
    ["A primary blanket rises and solids carry over after the sludge pump trips.",0,"Loss of withdrawal permits blanket accumulation."],
    ["Floating grease leaves over the effluent weir while settled solids remain controlled.",1,"Scum-removal failure is the direct issue."],
    ["All clarifiers deteriorate during short high-flow peaks but recover at normal flow.",2,"The common hydraulic load is the lead."],
    ["One clarifier shows a localized plume after its inlet baffle breaks.",3,"A damaged baffle can shorten the flow path."],
    ["The sludge hopper fills despite stable influent because the draw-off valve is closed.",0,"Sludge removal should be restored."],
  ]),
  F(P,"Aeration dissolved oxygen","WW_BIO","Activated sludge: oxygen supply, load changes, and instrument validation.","Which first check best fits the trend?",
    ["Compare air delivery and blower status with basin DO.","Compare influent organic loading and oxygen demand.","Verify the DO probe with an independent reading.","Inspect diffuser distribution for localized dead zones."],[
    ["DO falls across every lane while blower discharge flow is abnormally low.",0,"Air-supply loss can explain a common DO decline."],
    ["DO falls during an unexpected high-BOD industrial discharge with stable airflow.",1,"Higher substrate loading increases oxygen demand."],
    ["One online DO sensor reads zero while a calibrated handheld unit reads normally nearby.",2,"The sensor should be verified before adjusting air."],
    ["Only one end of a basin has low DO and its diffusers show little air release.",3,"Uneven air distribution is a local cause."],
    ["All aeration lanes lose DO when a lead blower trips.",0,"Common air supply is the immediate check."],
  ]),
  F(P,"Return activated sludge","WW_BIO","Activated sludge: return rate, blanket control, and solids balance.","Which action or measurement is most relevant?",
    ["Verify RAS pump delivery and clarifier sludge blanket.","Compare RAS rate with current influent and solids loading.","Check the RAS line for blockage or air binding.","Compare RAS solids concentration with MLSS and clarifier performance."],[
    ["Final clarifier blanket rises after its return-sludge pump stops.",0,"Sludge return is needed to move settled biomass back to aeration."],
    ["A fixed return setting is used despite a large sustained change in influent flow.",1,"Return should be interpreted against actual hydraulic and solids conditions."],
    ["RAS pump speed is high but measured line flow is near zero and suction pressure drops.",2,"A line or suction fault can prevent actual return."],
    ["RAS flow is normal yet MLSS falls and settled solids seem unusually dilute.",3,"Concentration data complete the solids balance."],
    ["A rising blanket follows an observed RAS pump trip at otherwise stable inflow.",0,"Restoring or substituting return capacity is the first process check."],
  ]),
  F(P,"Waste activated sludge","WW_BIO","Activated sludge: wasting affects biomass inventory and solids retention time.","Which trend or action best diagnoses the issue?",
    ["Check whether the actual WAS mass rate differs from its target.","Compare MLSS and SRT trends before increasing wasting.","Check the final effluent solids loss before attributing inventory change to wasting.","Verify wasting pump run-time, flow, and sludge concentration."],[
    ["MLSS rises for a week after the WAS valve is found closed.",0,"Reduced actual wasting permits solids inventory to build."],
    ["An operator proposes doubling wasting after one high MLSS result without checking the trend.",1,"Inventory and retention trends should guide the adjustment."],
    ["MLSS falls suddenly during severe clarifier carryover, with unchanged WAS settings.",2,"Effluent solids loss is another removal path."],
    ["The WAS pump indicates run time but its flowmeter records almost no waste flow.",3,"Actual waste mass must be measured, not inferred from a command."],
    ["A prolonged wasting reduction is followed by higher solids inventory and longer estimated SRT.",0,"WAS mass control is the likely driver."],
  ]),
  F(P,"Sludge settleability","WW_BIO","Secondary sedimentation: sludge volume, blanket, and effluent solids.","Which check best distinguishes the mechanism?",
    ["Run a settleability test and review sludge-volume index.","Compare clarifier hydraulic and solids loading at peak flow.","Inspect scum or floating solids for denitrification signs.","Check whether RAS withdrawal is sufficient to control the blanket."],[
    ["Settling tests show a large, diffuse sludge volume and final effluent solids rise at ordinary flow.",0,"Poor biological settleability should be characterized."],
    ["Solids carryover occurs only during a wet-weather peak with good bench settling.",1,"Hydraulic loading is a likely contributor."],
    ["Small clumps rise to the clarifier surface after extended detention and gas bubbles are visible.",2,"Gas-associated rising sludge can indicate denitrification."],
    ["Blanket depth climbs steadily while the return pump flow is below its normal range.",3,"Insufficient withdrawal can raise the blanket."],
    ["Final effluent solids rise while the 30-minute settleometer remains very slow to compact.",0,"Settleability measurements are central to diagnosis."],
  ]),
  F(P,"Nitrification response","WW_BIO","Biological nitrogen conversion: oxygen, retention, temperature, and alkalinity.","Which process condition should be checked first?",
    ["Verify aeration DO and distribution before changing other controls.","Compare solids retention time and wasting with the nitrification trend.","Check pH and alkalinity through the biological stage.","Compare temperature and ammonia loading with prior operating periods."],[
    ["Effluent ammonia rises after blower air delivery drops, while influent ammonia remains steady.",0,"Oxygen shortage can inhibit ammonia oxidation."],
    ["Effluent ammonia rises after several days of unusually high wasting.",1,"Shortened biomass residence can reduce nitrifier retention."],
    ["Effluent ammonia rises as basin pH and alkalinity decline, with stable DO.",2,"Nitrification consumes alkalinity and is sensitive to low pH."],
    ["Cold-weather ammonia removal deteriorates despite stable DO and measured wasting.",3,"Temperature changes biological reaction rates."],
    ["Aeration DO drops after a diffuser header fault and effluent ammonia follows upward.",0,"Restoring oxygen delivery is the direct check."],
  ]),
  F(P,"Denitrification diagnosis","WW_BIO","Biological nitrogen removal: anoxic conditions, nitrate, and available carbon.","Which condition best explains the trend?",
    ["An anoxic zone is receiving too much dissolved oxygen.","Nitrate supply to the anoxic zone has fallen.","Readily biodegradable carbon may be insufficient for nitrate reduction.","Clarifier solids may be rising because of denitrification gas."],[
    ["Anoxic-zone DO increases after a recycled stream starts carrying aerated water.",0,"Oxygen competes with nitrate as an electron acceptor."],
    ["Nitrate loading to an anoxic stage falls after an internal recycle pump trips.",1,"Reduced nitrate delivery changes denitrification potential."],
    ["Effluent nitrate stays high despite adequate anoxic volume and nitrate recycling, while influent carbon falls.",2,"Carbon limitation can restrict nitrate removal."],
    ["Small settled-sludge clumps float after long clarifier detention with visible gas bubbles.",3,"Denitrification gas can lift settled solids."],
    ["Aeration leakage into the designated anoxic zone coincides with reduced nitrate removal.",0,"High DO is contrary to intended anoxic operation."],
  ]),
  F(P,"Phosphorus treatment","WW_BIO","Phosphorus removal: chemical dose, mixing, solids separation, and source load.","Which first check best fits the evidence?",
    ["Confirm coagulant feed rate and actual concentration.","Check injection-point mixing and residence before separation.","Compare final solids carryover with total phosphorus increase.","Compare influent phosphorus load with its historical range."],[
    ["Effluent soluble phosphorus rises while the ferric day tank stops declining.",0,"The indicated chemical dose may not be delivered."],
    ["A new injector discharges just before the effluent sampling point with little mixing time.",1,"Contact and separation may be inadequate."],
    ["Total phosphorus rises during final clarifier carryover while soluble phosphorus remains stable.",2,"Particulate phosphorus can leave with escaping solids."],
    ["Influent phosphorus doubles after an industrial change although chemical feed remains constant.",3,"Load change can overwhelm the previous control setting."],
    ["A metering pump reports normal stroke but its suction tank is empty.",0,"Actual chemical delivery must be verified."],
  ]),
  F(P,"Secondary clarifier loading","WW_BIO","Final sedimentation: hydraulic loading, solids loading, RAS, and inlet distribution.","What is the most informative comparison?",
    ["Compare peak inflow with available clarifier hydraulic capacity.","Compare MLSS and incoming solids load with normal operation.","Check blanket depth and actual RAS withdrawal.","Inspect inlet energy dissipation and outlet distribution."],[
    ["Effluent solids rise only when wet-weather flow doubles.",0,"Peak hydraulic loading may shorten separation time."],
    ["Carryover worsens after MLSS rises greatly without a change in flow.",1,"Solids loading has increased."],
    ["The blanket rises during normal flow when the return pump is partially blocked.",2,"Actual sludge withdrawal should be checked."],
    ["Only one clarifier has a visible plume beside a damaged centre feed well.",3,"Local hydraulics may cause short circuiting."],
    ["A storm peak overwhelms all clarifiers despite similar bench settleability.",0,"The common hydraulic surge is the lead."],
  ]),
  F(P,"Wet-weather process response","WW_PRIMARY","Sewage works: wet-weather peak flow and process capacity.","Which action best preserves process control?",
    ["Compare actual peak flow with process hydraulic capacity and operating procedure.","Check whether upstream I/I or storm inflow is driving the surge.","Protect the biological solids inventory from unplanned washout.","Verify that any alternate routing follows the approved site plan."],[
    ["Headworks and clarifiers approach high-water alarms during a sudden rainfall peak.",0,"Actual hydraulic loading must be established before routing changes."],
    ["Plant flow doubles after rain while dry-weather sanitary demand is unchanged.",1,"Infiltration and inflow should be investigated."],
    ["Final effluent solids rise and aeration MLSS falls during a high-flow episode.",2,"Solids washout threatens continued process performance."],
    ["An operator considers opening a treatment bypass without checking its authorization and monitoring plan.",3,"Alternate routing requires the approved operating response."],
    ["A second storm pushes several units above their usual flow range.",0,"Capacity and procedure should be checked against the actual load."],
  ]),
  F(P,"Sequencing batch reactor phases","WW_BIO","Sequencing batch reactor: fill, react, settle, decant, and idle control.","Which phase or control should be examined?",
    ["React-phase aeration and mixing for inadequate oxidation.","Settle-phase quiescence before decant begins.","Decanter operation and withdrawal level.","Fill-phase distribution and equalization between basins."],[
    ["Effluent ammonia rises while an SBR's programmed aeration time is shortened.",0,"The reaction phase provides aerobic treatment."],
    ["Effluent solids rise after a mixer continues running into the planned settling phase.",1,"Quiescent settling has been disrupted."],
    ["A decanter draws visible sludge at the end of its withdrawal cycle.",2,"Decant depth and equipment should be checked."],
    ["One basin repeatedly overfills during the fill phase while its parallel basin has spare capacity.",3,"Flow distribution and equalization need review."],
    ["The programmed aeration blower misses much of a react period.",0,"A reduced aerobic reaction period can affect treatment."],
  ]),
  F(P,"Fixed-film treatment","WW_BIO","Biological treatment: attached-growth media, hydraulic distribution, and sloughing.","Which observation best guides troubleshooting?",
    ["Check rotating biological contactor drive and submerged operation.","Check trickling-filter distributor rotation and wetting pattern.","Compare sudden biomass sloughing with downstream clarifier loading.","Assess influent organic loading before changing media operation."],[
    ["An RBC basin has untreated sectors because its shaft stops rotating.",0,"Media contact and aeration depend on rotation."],
    ["A trickling filter has one dry quadrant after its distributor arm jams.",1,"Uneven wetting reduces use of the media area."],
    ["Final clarifier solids rise immediately after a visible biofilm sloughing event.",2,"Sloughed biomass increases clarifier solids loading."],
    ["A fixed-film unit's removal declines after an unexpected high-strength industrial load.",3,"Influent loading should be quantified."],
    ["The RBC motor runs but the disk assembly remains stationary.",0,"Mechanical transfer to the media needs repair."],
  ]),
  F(P,"Effluent disinfection","WW_DISINFECT","Sewage effluent disinfection: contact, turbidity, dose, and flow.","Which factor or check best addresses the disinfection concern?",
    ["Peak flow reduces effective contact time.","Suspended solids increase shielding and disinfectant demand.","The chemical feed delivers less than its indicated dose.","The effluent sample is taken ahead of the contact or UV process."],[
    ["Effluent flow doubles through the same contact volume during rain.",0,"Higher flow reduces available detention time."],
    ["High effluent suspended solids accompany poorer final pathogen indicators.",1,"Particles can interfere with disinfection performance."],
    ["The feed controller is unchanged but chemical day-tank drawdown almost stops.",2,"Actual disinfectant delivery may be low."],
    ["A new quality tap is mounted just upstream of the UV reactor.",3,"Its reading cannot represent the disinfected effluent."],
    ["An unusually high discharge rate coincides with less contact time and worse quality.",0,"Hydraulic detention should be checked."],
  ]),
  F(P,"Dechlorination balance","WW_DISINFECT","Effluent chemical disinfection and dechlorination: feed verification and residual monitoring.","Which check should direct the adjustment?",
    ["Measure residual after the dechlorination contact point.","Check whether dechlorinating agent feed is actually delivered.","Confirm the upstream chlorine demand and residual before changing neutralizer dose.","Verify the sample point is downstream of adequate mixing."],[
    ["Final effluent retains measurable chlorine after a neutralizer set-point change.",0,"A downstream residual measurement confirms actual dechlorination."],
    ["A neutralizer pump indicates running but its tank level has not changed.",1,"Actual chemical delivery may have failed."],
    ["Chlorine residual entering dechlorination drops unexpectedly after a change in secondary effluent quality.",2,"The upstream load should be verified before retuning feed."],
    ["One tap beside the neutralizer injection point reads zero while a well-mixed outlet reads chlorine.",3,"Sampling after adequate mixing is necessary."],
    ["A discharge residual increases and only a pre-neutralization sample is recorded.",0,"The final post-treatment residual must be measured."],
  ]),
  F(P,"Digester stability","WW_STABILIZE","Sludge stabilization: feed, mixing, temperature, and digester-gas trends.","Which trend most directly explains the change?",
    ["Check whether sludge feed rate or strength rose abruptly.","Verify mixing performance and absence of dead zones.","Compare actual temperature with the stable operating range.","Check the gas-meter and composition measurements before changing feed."],[
    ["Volatile acids rise after a large high-strength sludge slug enters the digester.",0,"A sudden organic load can upset process balance."],
    ["Gas production falls after the digester's mixer is taken out of service, with feed unchanged.",1,"Poor mixing can change contact and create uneven conditions."],
    ["Digester performance worsens as heat-exchanger output drops and contents cool.",2,"Temperature affects biological stabilization."],
    ["The gas totalizer drops to zero while an independent gas-flow check remains normal.",3,"A measurement fault should be resolved before altering feed."],
    ["Daily feed mass doubles immediately before a digester upset.",0,"The abrupt load change is the first lead."],
  ]),
  F(P,"Sludge thickening","WW_SOLIDS","Thickening: solids concentration, filtrate, polymer, and throughput.","Which measurement best isolates the issue?",
    ["Compare feed and thickened-solids concentration with flow.","Compare centrate or filtrate solids with polymer dose and mixing.","Check hydraulic loading versus the unit's normal operating range.","Inspect belt or screen condition and washwater performance."],[
    ["The volume of thickened sludge rises but its solids concentration falls sharply.",0,"Concentration and flow together determine captured solids."],
    ["Centrate becomes cloudy just as polymer feed stops.",1,"Chemical conditioning affects separation."],
    ["Capture declines only when operators double unit throughput.",2,"Excess loading can impair thickening."],
    ["A belt thickener carries a cake smear and its wash nozzles are clogged.",3,"Dirty media can reduce drainage and capture."],
    ["A thickener reports high volume reduction but no solids samples were taken.",0,"Mass balance requires actual solids concentrations."],
  ]),
  F(P,"Sludge dewatering","WW_SOLIDS","Dewatering: cake dryness, centrate solids, conditioning, and equipment condition.","Which operational comparison is most useful?",
    ["Compare cake solids and centrate quality before judging performance.","Compare polymer dose and solution preparation with past runs.","Check feed solids concentration and hydraulic loading.","Inspect the press or centrifuge for mechanical or wear changes."],[
    ["Cake looks drier but centrate solids rise markedly on the same run.",0,"Higher dryness may have come at the cost of solids capture."],
    ["Cake suddenly becomes wetter when the polymer aging tank is bypassed.",1,"Conditioning may have changed."],
    ["A centrifuge's cake changes after dilute sludge replaces its usual thickened feed.",2,"Feed concentration and loading affect dewatering."],
    ["Poor cake quality begins after a worn scroll is discovered despite stable feed and polymer.",3,"Equipment condition is a plausible cause."],
    ["Operators report improvement based only on cake appearance, without filtrate measurements.",0,"Both cake and liquid quality matter."],
  ]),
  F(P,"Toxic inhibition recognition","WW_BIO","Biological treatment: sudden process inhibition and unusual influent.","Which comparison best tests the suspected cause?",
    ["Compare influent industrial discharge timing with oxygen uptake and removal trends.","Verify DO analyzer and blower readings before concluding biology failed.","Check pH or temperature excursions in the affected basin.","Compare a parallel basin receiving a different influent fraction."],[
    ["Oxygen uptake and COD removal drop after a documented unusual industrial slug.",0,"A time-matched source event supports inhibition investigation."],
    ["One online DO signal changes abruptly while a portable meter and effluent quality remain stable.",1,"Instrumentation should be ruled out."],
    ["Biological activity slows after a strong low-pH event reaches the basin.",2,"An extreme pH can inhibit biomass."],
    ["Only one of two parallel basins deteriorates after a split-flow change.",3,"Comparing feed fractions can locate the influence."],
    ["Plant removal deteriorates in step with a new industrial discharge and normal airflow.",0,"The influent timing merits investigation."],
  ]),
  F(E,"Aeration blower","WW_BIO","Aeration supply: blower flow, pressure, inlet restriction, and basin oxygen.","Which equipment check best fits the evidence?",
    ["Compare actual blower air delivery with basin oxygen trend.","Check inlet filter differential for restriction.","Check a blocked discharge header or closed valve.","Inspect vibration and bearing temperature before continued operation."],[
    ["All aeration lanes lose DO when one lead blower's measured air delivery falls.",0,"The reduced supply is a common cause."],
    ["Blower suction pressure falls while its inlet filter differential rises.",1,"Inlet restriction can limit air delivery."],
    ["Discharge pressure rises but distributed air flow drops after a header valve is closed.",2,"Downstream restriction is the lead."],
    ["A blower becomes noisy and its bearing housing overheats at unchanged load.",3,"Mechanical condition must be checked."],
    ["DO improves when standby blower adds measured air to the header.",0,"The original air delivery was inadequate."],
  ]),
  F(E,"Diffuser pattern","WW_BIO","Aeration equipment: uniform oxygen transfer and diffuser maintenance.","Which check most directly explains the local pattern?",
    ["Inspect diffuser fouling in the affected grid.","Check the air-header valve or branch pressure.","Compare local oxygen demand and influent distribution.","Verify the portable DO reading at multiple depths and positions."],[
    ["One grid produces visibly fewer fine bubbles after months without cleaning, at normal header pressure.",0,"Local diffuser fouling can reduce oxygen transfer."],
    ["A zone has no air after an air-header isolation valve is left closed.",1,"The supply branch is restricted."],
    ["Only the influent end of one lane needs more air after a flow split sends it concentrated wastewater.",2,"Localized demand may drive the DO difference."],
    ["A single probe shows a low DO pocket that is absent in repeated measurements nearby.",3,"Spatial measurements can verify whether the signal is representative."],
    ["Air pressure is normal but coarse uneven bubbling appears over a small section.",0,"Diffuser condition should be inspected."],
  ]),
  F(E,"RAS pump checks","WW_PUMPS","Sludge pumping: measured return rate, suction, check valve, and solids concentration.","Which equipment check should be first?",
    ["Compare commanded speed with actual return flow.","Inspect the pump suction and wet-well level for air binding.","Check discharge valve and check valve for restriction.","Sample RAS concentration before inferring returned mass."],[
    ["A RAS pump speeds up but the flowmeter shows almost no additional return.",0,"Commanded speed does not prove delivered flow."],
    ["The return pump repeatedly loses prime as its suction well empties.",1,"Suction conditions are the immediate cause."],
    ["Discharge pressure rises while return flow drops after a valve repair.",2,"A closed or restricted discharge path should be checked."],
    ["Return flow is unchanged but aeration biomass still declines during a sludge concentration shift.",3,"The returned solids mass depends on concentration as well as volume."],
    ["The pump runs for its usual hours but recorded return volume is half the prior value.",0,"Actual delivery needs verification."],
  ]),
  F(E,"Primary sludge pump","WW_PRIMARY","Primary sludge withdrawal: hopper level, pump delivery, and plugging.","Which equipment cause best fits the signal?",
    ["A plugged suction or draw-off pipe is limiting sludge withdrawal.","An air leak or loss of prime has reduced pump delivery.","A discharge check or valve is restricting the route.","The sludge flowmeter may be reading incorrectly."],[
    ["The hopper blanket rises and suction pressure falls while pump speed stays steady.",0,"A suction restriction can reduce sludge removal."],
    ["The pump runs but repeatedly needs manual priming after an empty hopper.",1,"Air entry or loss of prime affects delivery."],
    ["Pump discharge pressure climbs sharply after a discharge valve was partly closed.",2,"The changed outlet restriction is the lead."],
    ["A flowmeter suddenly reads zero but timed storage-level changes show continued pumping.",3,"The meter reading should be checked."],
    ["The draw-off line plugs with accumulated solids after an extended shutdown.",0,"A physical suction or line restriction is likely."],
  ]),
  F(E,"Screen rake","WW_PRIMARY","Screening equipment: rake timing, drive torque, and debris bypass.","Which part should be checked?",
    ["Inspect rake drive, chain and overload after a jam.","Check whether screen differential initiates automatic cleaning.","Inspect screenings conveyor and receiving bin.","Check bypass-gate position and flow split."],[
    ["The rake stalls with a high motor-torque alarm and accumulated rags.",0,"The jam and drive need attention."],
    ["The screen blinds but the differential sensor never triggers a rake cycle.",1,"Control initiation has failed."],
    ["Rakes clear bars but screenings pile up beneath a stopped conveyor.",2,"Handling downstream of the rake is blocked."],
    ["Debris reaches the grit chamber even though the screen runs normally, and the bypass gate is open.",3,"Unscreened bypass flow is the explanation."],
    ["The chain jumps its track at every cleaning cycle.",0,"Mechanical rake-drive condition needs inspection."],
  ]),
  F(E,"Grit classifier","WW_PRIMARY","Grit handling: pumping, separation, washing, and discharge.","Which test should direct maintenance?",
    ["Measure actual grit slurry flow from the chamber.","Check classifier separation and drain performance.","Inspect washwater supply and grit cleanliness.","Check discharge conveyor and bin capacity."],[
    ["The chamber accumulates grit while the grit pump indicates running.",0,"Actual slurry transfer should be confirmed."],
    ["Grit slurry reaches the classifier but most grit leaves with its liquid return.",1,"The separator is failing to retain solids."],
    ["Discharged grit contains heavy organic residue after washwater pressure drops.",2,"The washing stage is impaired."],
    ["Clean grit backs up when the receiving container is full.",3,"The discharge path has no capacity."],
    ["A pump current trace looks normal but no grit reaches the classifier.",0,"Measured slurry delivery is needed."],
  ]),
  F(E,"Centrifuge inspection","WW_SOLIDS","Sludge dewatering equipment: scroll, feed, cake, and centrate.","Which equipment check is most targeted?",
    ["Inspect scroll differential speed and torque.","Check actual sludge feed concentration and rate.","Verify polymer pump delivery and solution condition.","Inspect centrate outlet and discharge for restriction."],[
    ["The centrifuge reports high torque and loses cake conveyance at unchanged feed.",0,"Scroll operation can explain the mechanical loading."],
    ["Cake becomes wet when a dilute sludge source is switched into the machine.",1,"Feed condition changed."],
    ["Centrate solids rise just after polymer day tank runs dry.",2,"Conditioning delivery should be verified."],
    ["Liquid backs up from the centrate outlet although cake production is normal.",3,"The liquid discharge may be restricted."],
    ["Differential drive speed changes unexpectedly while all feed conditions remain steady.",0,"The scroll drive needs inspection."],
  ]),
  F(E,"UV effluent unit","WW_DISINFECT","Effluent UV equipment: lamp status, transmittance, flow, and sensor condition.","Which equipment check best matches the UV alarm?",
    ["Confirm lamp output and power on the affected bank.","Measure UV transmittance of the current effluent.","Compare flow with the reactor's validated operating range.","Verify the intensity sensor and sleeve condition."],[
    ["One reactor alarms low dose just as a lamp circuit trips.",0,"Lost lamp output reduces irradiation."],
    ["All reactors alarm when darker effluent arrives at normal flow.",1,"Lower transmittance reduces effective dose."],
    ["A dose alarm appears only at wet-weather peak flow.",2,"Higher flow shortens exposure and may exceed validated operation."],
    ["One sensor reads low while redundant measurement remains stable and the sleeve is fouled.",3,"Sensor and sleeve condition require verification."],
    ["A lamp bank fails to energize during the morning start sequence.",0,"The affected output should be confirmed."],
  ]),
];

const commonEquipment = new Map([
  ["Pump suction diagnosis","WW_PUMPS"], ["Check valve behaviour","WW_PUMPS"],
  ["Valve position diagnosis","WW_PUMPS"], ["Flowmeter discrepancy","WW_CONTROLS"],
  ["Instrument loop troubleshooting","WW_CONTROLS"], ["Generator readiness","WW_PUMPS"],
  ["Pump seal and bearing trends","WW_PUMPS"],
]);
const commonSafety = new Map([
  ["Energy isolation","OHS_LOCKOUT"], ["Chemical spill response","WW_DISINFECT"],
  ["Confined space pre-entry","WC_SAFETY"], ["Alarm verification","WW_CONTROLS"],
  ["Operations record integrity","WW_CONTROLS"], ["Access and SCADA security","WW_CONTROLS"],
  ["Public communication","WW_CONTROLS"],
]);
function adapt(item, module, sourceKey) {
  const replace = text => text.replaceAll("finished-water", "final-effluent").replaceAll("filtered-water", "treated-effluent").replaceAll("clearwell", "wet well").replaceAll("reservoir", "holding tank").replaceAll("water-quality", "effluent-quality")
    .replaceAll("tank-level", "wet-well-level").replaceAll("tank level", "wet-well level").replaceAll("tank drawdown", "wet-well drawdown").replaceAll("source level", "wet-well level")
    .replaceAll("treatment pumps", "sewage pumps").replaceAll("low-residual", "low-UV-dose").replaceAll("low residual", "low UV dose").replaceAll("downstream water is still being delivered", "treated effluent continues discharging")
    .replaceAll("high-turbidity", "high-effluent-TSS").replaceAll("A filter remains isolated", "An aeration blower remains isolated").replaceAll("chlorine set point", "polymer set point")
    .replaceAll("during distribution", "during discharge").replaceAll("cloudy water", "sewage odour").replaceAll("treated water is safe", "effluent meets its discharge limits")
    .replaceAll("calls customers during an isolation", "contacts neighbours during a spill");
  return {
    ...item, module, sourceKey,
    sourceReference: `${item.topic}: apply the cited equipment/control or safety provisions in a wastewater facility; review the scenario against the site procedure.`,
    ask: replace(item.ask), options: item.options.map(replace),
    cases: item.cases.map(([situation, answer, explanation]) => [`At a wastewater treatment facility: ${replace(situation)}`, answer, replace(explanation)]),
  };
}
for (const item of waterTreatment) {
  if (commonEquipment.has(item.topic)) wastewaterTreatment.push(adapt(item,E,commonEquipment.get(item.topic)));
  if (commonSafety.has(item.topic)) wastewaterTreatment.push(adapt(item,A,commonSafety.get(item.topic)));
}

wastewaterTreatment.push(
  C(E,"Pump run rate","WW_PUMPS","Pump delivery from measured volume and elapsed time.",([v,t])=>{const q=v/t*60;return N(`A sewage transfer pump moves ${v} m³ in ${t} minutes at steady level. What is its approximate flow?`,q,"m³/h","Rate = measured volume ÷ time in minutes × 60.",`${v} ÷ ${t} × 60 = ${q} m³/h.`,[q*.8,q*1.25,q*1.5],1);},[[42,12],[48,16],[60,15],[70,14],[90,18]]),
  C(E,"Aeration tank hydraulic time","WW_BIO","Nominal hydraulic detention: aeration volume divided by influent flow.",([v,q])=>{const t=v/q*24;return N(`A biological reactor has ${v} m³ of active liquid volume and receives ${q} m³/d. What is its nominal hydraulic detention time?`,t,"h","Nominal time = active volume ÷ daily flow × 24 h/day.",`${v} ÷ ${q} × 24 = ${t} h.`,[t*.5,t*1.25,t*2],1);},[[1200,4000],[1500,5000],[2100,6000],[2000,4800],[2700,7200]]),
  C(E,"Aeration power","WW_BIO","Electrical energy from blower power and run time.",([kw,h])=>N(`A blower draws ${kw} kW on average and runs for ${h} hours. Approximately how much electrical energy does it use?`,kw*h,"kWh","Energy = average electrical power × elapsed operating hours.",`${kw} × ${h} = ${kw*h} kWh.`,[kw*h*.5,kw*h*1.25,kw*h*2],0),[[30,8],[40,6],[45,10],[55,12],[60,9]]),
  F(L,"BOD sampling validity","WW_CONTROLS","Laboratory analysis: representative samples and sample handling for process data.","Which change would make the comparison more reliable?",
    ["Collect influent and effluent samples with times matched to hydraulic travel.","Use the correct preserved and cooled method for laboratory transport.","Check whether a composite or grab is appropriate for the stated objective.","Verify that aliquots came from the designated sample ports."],[
    ["An influent sample is compared with effluent taken at exactly the same clock time despite a long plant detention period.",0,"Travel time should be considered when attributing removal."],
    ["A BOD bottle waits warm in a truck long past the laboratory's accepted window.",1,"Handling affects analytical validity."],
    ["An operator uses one quiet-hour grab to represent an entire day of strongly varying influent load.",2,"The sampling design should match the period represented."],
    ["A sample labelled final effluent actually came from a tap upstream of secondary clarification.",3,"Sample location changes the meaning of the result."],
    ["Two treatment stages are compared using samples taken on unrelated days with different loads.",0,"Time pairing is necessary for a meaningful comparison."],
  ]),
  F(L,"DO probe verification","WW_CONTROLS","Process monitoring: dissolved-oxygen measurement and probe maintenance.","Which check best addresses the reading discrepancy?",
    ["Compare the fixed probe with a calibrated portable meter at the same point.","Inspect the probe for fouling and follow its cleaning procedure.","Check the sensor cable and PLC signal scaling.","Repeat readings at several basin depths to identify a real gradient."],[
    ["One basin sensor reads nearly zero while a fresh portable measurement at its tip is normal.",0,"Independent comparison identifies an instrument discrepancy."],
    ["A DO sensor responds sluggishly and has visible biofilm on its sensing face.",1,"Fouling may impair response."],
    ["The field sensor shows a normal value locally but SCADA displays ten times that value after a PLC edit.",2,"Signal scaling should be checked."],
    ["One surface DO result differs from deeper readings near a submerged mixing zone.",3,"A spatial profile tests a true gradient."],
    ["Two adjacent meters disagree by several mg/L at the same depth after calibration.",0,"An independent calibrated measurement is appropriate."],
  ]),
  F(L,"Solids trend interpretation","WW_BIO","Activated sludge monitoring: MLSS, RAS concentration, clarifier blanket, and effluent solids.","Which paired data best explains the inventory change?",
    ["Compare WAS mass removed with MLSS over several days.","Compare clarifier blanket depth and RAS solids concentration.","Compare final effluent TSS with inventory loss.","Check whether the MLSS sample was representative and mixed."],[
    ["MLSS declines gradually while measured WAS solids removal rises sharply.",0,"Increased wasting reduces inventory over time."],
    ["A blanket rises while RAS flow remains steady but its solids concentration falls.",1,"Return mass can change without a volumetric rate change."],
    ["MLSS drops suddenly during final clarifier carryover and effluent TSS spikes.",2,"Solids escape in the effluent."],
    ["A single low MLSS result was taken from a stagnant side channel.",3,"A representative mixed sample should be confirmed."],
    ["Several days of reduced wasting are followed by higher mixed-liquor solids.",0,"A mass balance over time tests the explanation."],
  ]),
  C(L,"Sludge volume index","WW_BIO","Settleability index: 30-minute settled volume divided by MLSS in g/L.",([settled,mlss])=>{const v=settled/(mlss/1000);return N(`A 1-L settleometer shows ${settled} mL settled sludge after 30 minutes. MLSS is ${mlss} mg/L. What is the sludge volume index?`,v,"mL/g","SVI = settled volume (mL/L) ÷ MLSS (g/L).",`${settled} ÷ (${mlss}/1000) = ${v} mL/g.`,[v*.5,v*1.25,v*2],1);},[[300,3000],[360,3000],[450,3000],[420,3000],[400,2500]]),
  C(L,"BOD removal","WW_BIO","Removal percentage from paired influent and effluent BOD concentrations.",([influent,effluent])=>{const r=(influent-effluent)/influent*100;return N(`A plant's representative influent BOD is ${influent} mg/L and effluent BOD is ${effluent} mg/L. What is the approximate BOD removal?`,r,"%","Removal = (influent − effluent) ÷ influent × 100.",`(${influent} − ${effluent}) ÷ ${influent} × 100 = ${r}%.`,[effluent/influent*100,r*.8,r*1.1],1);},[[200,20],[240,30],[300,45],[180,36],[250,15]]),
);
