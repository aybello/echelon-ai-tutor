import fs from "node:fs/promises";
import { EXPANDED_OIT_OBJECTIVES } from "./oit-expanded-objectives.mjs";

const SOURCES = {
  ON_OIT: {
    title: "Ontario Water Wastewater Certification Office - Preparing for Your Exam",
    reference: "Current Ontario OIT exam-content and preparation context",
    url: "https://owwco.ca/preparing-for-your-exam/",
  },
  ON_DW: {
    title: "Ontario Regulation 170/03 - Drinking Water Systems",
    reference: "Operational checks, sampling, reporting and drinking-water requirements",
    url: "https://www.ontario.ca/laws/regulation/030170",
  },
  ON_CERT: {
    title: "Ontario Regulation 128/04 - Certification of Drinking Water System Operators",
    reference: "Operator duties, certification and operational responsibility",
    url: "https://www.ontario.ca/laws/regulation/040128",
  },
  ON_WW: {
    title: "Ontario Regulation 129/04 - Licensing of Sewage Works Operators",
    reference: "Wastewater operator licensing and operational responsibility",
    url: "https://www.ontario.ca/laws/regulation/040129",
  },
  EPA_WATER: {
    title: "US EPA - Small Drinking Water Systems Handbook",
    reference: "Treatment barriers, filtration, disinfection and small-system operations",
    url: "https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=100046K6.TXT",
  },
  EPA_FILTER: {
    title: "US EPA - Surface Water Treatment Rule Turbidity Guidance Manual",
    reference: "Coagulation, flocculation, sedimentation, filtration and turbidity",
    url: "https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P100ZLYM.TXT",
  },
  EPA_WW: {
    title: "US EPA - Resources for Wastewater Operators",
    reference: "Wastewater process operation and troubleshooting resources",
    url: "https://www.epa.gov/compliance/resources-wastewater-operators",
  },
  EPA_AS: {
    title: "US EPA - Start-Up of Municipal Wastewater Treatment Facilities",
    reference: "Activated sludge, biological treatment and plant operation",
    url: "https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=00000IDV.TXT",
  },
  EPA_COLL: {
    title: "US EPA - Alternative Wastewater Collection Systems Manual",
    reference: "Collection-system components, operation and maintenance",
    url: "https://nepis.epa.gov/Exe/ZyNET.exe?Index=Prior+to+1976&Query=&SearchMethod=1&FuzzyDegree=0&User=ANONYMOUS&Password=anonymous&QField=pubnumber%5E%22625191024%22&UseQField=pubnumber&IntQFieldOp=1&ExtQFieldOp=1&Docs=",
  },
  CCOHS_H2S: {
    title: "Canadian Centre for Occupational Health and Safety - Hydrogen Sulfide",
    reference: "Hydrogen sulfide properties and confined-space hazard",
    url: "https://www.ccohs.ca/oshanswers/chemicals/chem_profiles/hydrogen_sulfide.html",
  },
  CCOHS_CS: {
    title: "Canadian Centre for Occupational Health and Safety - Confined Spaces",
    reference: "Atmospheric, engulfment, entry and rescue hazards",
    url: "https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_intro.html",
  },
};

const concepts = [];
const add = (stream, module, source, name, purpose, scenario, action, principle, indicator, difficulty = "medium") => {
  concepts.push({ stream, module, source, name, purpose, scenario, action, principle, indicator, difficulty });
};

// Water treatment: 25 objectives x 4 item forms = 100 questions.
add("Water Treatment", "Source Water & Multiple Barriers", "EPA_WATER", "source-water assessment", "identify raw-water hazards and variability before selecting operating responses", "Raw-water turbidity and colour rise sharply after heavy rain", "increase monitoring and adjust treatment only from verified process data", "Source conditions can change quickly, so treatment decisions begin with representative raw-water data", "current raw-water results agree with field and online observations");
add("Water Treatment", "Source Water & Multiple Barriers", "EPA_WATER", "multiple-barrier treatment", "reduce risk through several independent removal and inactivation steps", "A confirmed non-critical performance decline affects one barrier, but no critical limit has been exceeded and the barrier remains available", "stabilize that barrier while verifying that the remaining barriers continue to perform", "No single barrier should be assumed to remove every microbial and chemical hazard", "each barrier has a defined control measure and stays within limits");
add("Water Treatment", "Coagulation & Flocculation", "EPA_FILTER", "coagulation", "destabilize fine suspended and colloidal particles so they can combine", "Filtered-water turbidity rises after the raw-water pH changes", "run a jar test and adjust coagulant conditions using plant procedures", "Coagulant performance depends on dose, mixing, pH, alkalinity and raw-water character", "pin floc forms promptly and downstream turbidity decreases");
add("Water Treatment", "Coagulation & Flocculation", "EPA_FILTER", "rapid mixing", "disperse coagulant quickly and uniformly through the incoming water", "Coagulant is fed correctly but floc forms unevenly across the basin", "inspect rapid-mix energy, feed location and chemical distribution", "This step is intense and brief; it is not intended to grow large floc", "the chemical is distributed uniformly before water enters flocculation");
add("Water Treatment", "Coagulation & Flocculation", "EPA_FILTER", "flocculation", "gently bring destabilized particles together into settleable floc", "Floc is small and breaks apart near the end of the basin", "check mixing intensity and reduce excessive shear where permitted", "This stage needs enough contact and gentle mixing without breaking formed floc", "floc becomes larger and denser as it moves through the basin");
add("Water Treatment", "Clarification", "EPA_FILTER", "sedimentation", "remove settleable floc by gravity before filtration", "A clarifier shows solids carrying over its effluent weirs", "check flow distribution, sludge withdrawal and upstream floc quality", "Clarifier performance depends on hydraulic loading, floc settleability and solids removal", "clarified-water turbidity remains stable with an even overflow pattern");
add("Water Treatment", "Filtration", "EPA_FILTER", "rapid filtration", "remove remaining suspended particles as water passes through media", "Filter effluent turbidity increases while head loss stays low", "verify coagulation and inspect for media or underdrain problems", "Low head loss does not prove good filtration; effluent quality is the key performance signal", "individual-filter turbidity stays low through the filter run");
add("Water Treatment", "Filtration", "EPA_FILTER", "filter backwashing", "remove accumulated solids and restore usable filter capacity", "A filter reaches its terminal head-loss limit", "remove it from service and backwash according to the approved sequence", "Backwashing must expand and clean the bed without losing media or damaging support layers", "head loss resets and post-backwash turbidity recovers normally");
add("Water Treatment", "Filtration", "EPA_FILTER", "filter-to-waste", "keep initial post-backwash water out of the clearwell until quality stabilizes", "A filter has just completed backwash and shows a turbidity spike", "route water to waste until the return-to-service criteria are met", "A ripening period can occur after backwash as the media bed re-establishes effective capture", "turbidity meets the approved return-to-service limit before production resumes");
add("Water Treatment", "Disinfection", "EPA_WATER", "primary disinfection", "inactivate pathogens before water enters the distribution system", "Flow increases through a chlorine contact basin while residual is unchanged", "recalculate effective contact time and verify the required inactivation remains achieved", "Disinfection performance depends on disinfectant concentration, contact time, temperature and water quality", "the verified residual and effective contact time meet the operating target");
add("Water Treatment", "Disinfection", "EPA_WATER", "chlorine demand", "describe the chlorine consumed before a measurable residual remains", "A 2.0 mg/L dose produces a 0.6 mg/L residual", "recognize that 1.4 mg/L was consumed before a measurable residual remained", "Applied dose equals the amount consumed plus the measured residual", "dose and residual measurements reconcile within expected process variation");
add("Water Treatment", "Disinfection", "EPA_WATER", "breakpoint chlorination", "apply enough chlorine to satisfy demand and oxidize ammonia before free residual develops", "Increasing chlorine dose first lowers the combined residual and later produces free chlorine", "confirm the system is moving through breakpoint rather than assuming feed failure", "The breakpoint curve reflects chlorine demand, chloramine formation, destruction and free residual", "free chlorine rises predictably after the breakpoint region");
add("Water Treatment", "Disinfection", "EPA_WATER", "CT control", "verify disinfectant exposure using residual concentration multiplied by effective contact time", "A basin baffle is damaged even though outlet residual remains normal", "reassess effective contact time and the resulting CT value", "Nominal basin volume alone can overstate effective contact time when short-circuiting occurs", "calculated CT uses validated effective contact time and measured residual and meets the required target");
add("Water Treatment", "Water Chemistry", "EPA_WATER", "pH control", "maintain chemical conditions needed for treatment, disinfection and corrosion control", "A chemical dose works poorly after pH shifts outside its normal range", "verify the pH measurement and restore the approved operating range", "pH is logarithmic and can strongly affect coagulation, chlorine speciation and metal solubility", "process response improves when verified pH returns to its target range");
add("Water Treatment", "Water Chemistry", "EPA_WATER", "alkalinity", "provide acid-neutralizing capacity and help stabilize treatment pH", "Alum addition causes a larger-than-normal pH drop", "check raw-water buffering capacity and apply approved chemical adjustment if required", "Water with limited buffering capacity is vulnerable to pH drops from acid-producing reactions", "pH remains more stable during normal coagulant dosing");
add("Water Treatment", "Water Chemistry", "EPA_WATER", "hardness control", "manage calcium and magnesium effects such as scale, soap use and stability", "Customers report scale after finished-water hardness increases", "verify hardness and review the softening or blending process", "Hardness is primarily associated with dissolved calcium and magnesium", "hardness and stability results remain within the plant's operating goals");
add("Water Treatment", "Taste, Odour & Organics", "EPA_WATER", "activated carbon", "adsorb selected dissolved organic compounds that cause taste, odour or contamination concerns", "An earthy odour event appears in the source water", "confirm the compound and optimize approved powdered or granular carbon use", "Adsorption capacity is finite and depends on the compound, carbon and contact conditions", "target-compound or sensory results improve without downstream carbon carryover");
add("Water Treatment", "Oxidation & Aeration", "EPA_WATER", "aeration", "transfer gases between water and air to remove volatiles or add oxygen", "Groundwater has a rotten-egg odour and low dissolved oxygen", "evaluate approved gas-transfer equipment while controlling off-gas and oxidation effects", "Gas transfer can strip volatile gases and oxidize some dissolved constituents", "dissolved gas or odour decreases across the gas-transfer step");
add("Water Treatment", "Disinfection", "EPA_WATER", "ultraviolet disinfection", "inactivate microorganisms by delivering a validated UV dose", "UV intensity falls while flow and transmittance remain unchanged", "inspect lamp condition, fouling and sensor verification", "UV leaves no disinfectant residual, so dose validation relies on intensity, flow and transmittance", "validated dose remains above the required set point");
add("Water Treatment", "Corrosion Control", "ON_DW", "corrosion control", "limit metal release and deterioration by managing water chemistry and materials", "Lead results rise after a source or treatment change", "review corrosion-control conditions and follow the approved response plan", "Changes in pH, alkalinity, disinfectant or inhibitors can alter pipe-scale stability", "sentinel chemistry and compliance samples remain stable over time");
add("Water Treatment", "Process Optimization", "EPA_FILTER", "jar testing", "compare coagulant doses and conditions at bench scale before changing full-scale operation", "Raw-water quality changes and the previous dose no longer produces good floc", "run controlled jars with representative water and select the best verified condition", "Jar tests guide treatment but must be confirmed by full-scale process performance", "the selected jar condition produces strong floc and low settled turbidity");
add("Water Treatment", "Chemical Feed & Storage", "EPA_WATER", "chemical feed calibration", "confirm the actual delivery rate of a chemical feeder", "A pump speed setting is unchanged but process residual is drifting", "measure feeder output and compare it with the expected dose", "A controller setting is not proof of actual feed; calibration checks delivered volume or mass", "measured output agrees with the calculated requirement within tolerance");
add("Water Treatment", "Chemical Feed & Storage", "EPA_WATER", "secondary containment", "capture a chemical leak before it reaches drains, soil or incompatible materials", "A bulk hypochlorite tank develops a small leak", "isolate the source and keep the release within compatible containment", "Containment materials must be compatible with the stored chemical and sized for the hazard", "the containment remains intact, dry and capable of holding the design release");
add("Water Treatment", "Sampling & Monitoring", "ON_DW", "representative sampling", "obtain a sample that reflects the water and location being evaluated", "A sample tap has stagnant water and a dirty aerator", "prepare and flush the location according to the approved sampling procedure", "Sample integrity depends on correct location, preparation, container, preservation and timing", "field conditions and chain-of-custody records support the reported result");
add("Water Treatment", "Membrane Treatment", "EPA_WATER", "membrane integrity", "detect breaches that could allow particles or microorganisms to pass", "Permeate turbidity rises after a pressure upset", "perform the approved direct or indirect integrity check before relying on the unit", "A membrane can produce normal flow while still having an integrity defect", "integrity results and permeate quality meet the validated acceptance criteria");

// Water distribution: 25 objectives x 4 item forms = 100 questions.
add("Water Distribution", "System Layout & Assets", "ON_DW", "distribution mains", "convey treated water while maintaining pressure, quality and reliability", "A planned valve closure could isolate a large neighbourhood", "review the system map and establish the smallest safe isolation area", "Looped networks generally provide more redundancy and circulation than dead-end layouts", "pressure and water quality remain stable across the supplied area");
add("Water Distribution", "Valves", "EPA_WATER", "gate valves", "provide low-loss isolation when operated fully open or fully closed", "A crew wants to throttle flow with a large gate valve", "use the valve for isolation and select approved throttling equipment instead", "Partly open isolation valves of this type can vibrate, erode and fail to seal reliably", "the valve operates through full travel and seals when closed");
add("Water Distribution", "Valves", "EPA_WATER", "butterfly valves", "isolate or regulate flow in large pipes with a rotating disc", "A large transmission main needs compact valve installation", "evaluate a butterfly valve suited to the pressure and service", "The disc remains in the flow path and produces some head loss even when open", "position indication agrees with flow response during controlled operation");
add("Water Distribution", "Valves", "EPA_WATER", "check valves", "prevent reverse flow when pumping stops or pressure reverses", "A pump stops and water begins moving backward through its discharge", "inspect the check valve and isolate the affected equipment safely", "A check valve operates automatically from flow and pressure differential", "reverse flow stops without severe slam or pressure surge");
add("Water Distribution", "Valves", "EPA_WATER", "pressure-reducing valves", "maintain a lower controlled downstream pressure zone", "Downstream pressure rises above its normal set point", "verify sensing lines, pilot condition and valve operation", "A pressure-reducing valve responds to downstream pressure, not merely upstream flow", "downstream pressure remains near set point as demand changes");
add("Water Distribution", "Valves", "EPA_WATER", "air-release valves", "release small pockets of accumulated air from pressurized pipeline high points", "Flow capacity declines and surging appears near a pipeline summit", "inspect the high-point air valve for blockage or malfunction", "These devices vent small air pockets in pressurized pipes; admitting air under vacuum requires an air-vacuum or combination valve", "air is released during pressurized operation without continuous water leakage");
add("Water Distribution", "Fire Protection", "EPA_WATER", "fire hydrants", "provide controlled high-flow access for firefighting, flushing and testing", "A hydrant will be operated for a flow test", "coordinate the test, protect water quality and open or close it slowly", "Rapid hydrant operation can create damaging pressure transients and disturb deposits", "hydrant flow, pressure and drainage meet the maintenance criteria");
add("Water Distribution", "Storage", "EPA_WATER", "elevated storage", "provide pressure, balancing storage and emergency or fire reserve", "Night demand falls and tank level remains unusually high", "review turnover and adjust approved operating levels or cycling", "Poor turnover can increase water age even when tank volume is adequate", "tank level cycles predictably and stored water is regularly exchanged");
add("Water Distribution", "Hydraulics", "EPA_WATER", "pressure monitoring", "verify service pressure and detect abnormal hydraulic conditions", "Customers in one zone report low pressure during peak demand", "compare calibrated pressure readings with pump, tank and valve status", "Pressure must be interpreted with elevation, demand and system configuration", "field and telemetry readings agree with expected hydraulic grade");
add("Water Distribution", "Hydraulics", "EPA_WATER", "water-hammer control", "limit transient pressure caused by rapid velocity changes", "A check valve slams whenever a booster pump stops", "slow the hydraulic change and inspect suitable surge-control measures", "Fast valve movement and sudden pump trips can create positive or negative pressure waves", "shutdown transients remain within the pipeline's safe pressure range");
add("Water Distribution", "Cross-Connection Control", "ON_DW", "cross-connection control", "prevent contaminants from entering potable water through backflow", "A chemical tank has a hose submerged below the liquid surface", "remove the submerged connection and provide approved backflow protection", "Backsiphonage and backpressure are distinct mechanisms that can reverse flow", "the potable connection has protection matched to the degree of hazard");
add("Water Distribution", "Cross-Connection Control", "ON_DW", "air gaps", "provide physical separation between a potable outlet and a receiving vessel", "A fill pipe terminates below the overflow rim of a process tank", "raise or reconfigure the outlet to provide the required physical separation", "An air gap has no mechanical parts and protects against backpressure and backsiphonage", "the vertical separation remains unobstructed under all operating conditions");
add("Water Distribution", "Flushing", "EPA_WATER", "unidirectional flushing", "move water at controlled high velocity through a defined pipe path", "A neighbourhood has repeated discoloured-water complaints", "isolate a flushing route and verify velocity, residual and clarity", "Closing selected valves concentrates flushing energy and reduces uncontrolled disturbance", "turbidity clears and disinfectant residual recovers at the endpoint");
add("Water Distribution", "Water Quality", "ON_DW", "distribution disinfectant residual", "provide continuing microbial protection and reveal water-age or demand problems", "Residual falls steadily toward a remote dead end", "confirm the result and investigate age, demand, nitrification or contamination", "A low residual is a signal to investigate; simply increasing dose may not correct the cause", "verified residual remains stable across representative locations");
add("Water Distribution", "Water Age", "EPA_WATER", "dead-end management", "reduce stagnation, sediment accumulation and excessive water age", "A lightly used cul-de-sac main shows low residual and taste complaints", "apply approved flushing or looping measures and track the response", "Low demand in dead ends can allow residual decay and deposits to accumulate", "turnover improves while residual and customer water quality stabilize");
add("Water Distribution", "Main Breaks", "ON_DW", "main-break isolation", "control water loss and contamination risk while preserving service where possible", "A break produces rapidly increasing surface flow near a hospital", "confirm utility locates and isolate the smallest safe section using verified valves", "Isolation planning must consider critical users, pressure loss and possible contaminant entry", "the break is controlled without unintended loss of pressure in adjacent zones");
add("Water Distribution", "Main Breaks", "ON_DW", "repair disinfection", "prevent contamination from repaired pipe, fittings, tools and water", "A repaired main is ready for return to service", "disinfect, flush and complete required verification before normal service", "A sound mechanical repair does not by itself establish microbiological safety", "post-repair water meets the approved clearance criteria");
add("Water Distribution", "Leak Detection", "EPA_WATER", "acoustic leak detection", "locate pressurized leaks from the sound they transmit through pipe and soil", "Night flow rises but no water is visible at the surface", "survey valves and hydrants with appropriate acoustic equipment", "Leak sound depends on pipe material, pressure, soil and leak opening", "correlated sound and field confirmation identify a credible repair location");
add("Water Distribution", "Metering", "EPA_WATER", "customer meters", "measure delivered water for billing, demand analysis and loss control", "A large user reports an implausibly low monthly total", "compare register movement, meter sizing and field accuracy", "Oversized or worn meters may under-register low flows even when they still operate", "meter tests and consumption patterns agree within accepted accuracy");
add("Water Distribution", "Services", "EPA_WATER", "service-line control", "connect a property to the main and allow reliable isolation at the curb stop", "A service leak continues after the building valve is closed", "locate and close the curb stop before excavating the service", "The curb stop isolates the service between the main connection and the premises", "closing the verified curb stop stops flow to the service");
add("Water Distribution", "Corrosion", "ON_DW", "pipe corrosion management", "limit structural deterioration, metal release and water-quality complaints", "Red water appears after flow reverses in an old iron main", "confirm the source and evaluate flushing, corrosion and renewal needs", "Internal corrosion products can accumulate and release when hydraulic conditions change", "complaints and iron results decline after the verified control action");
add("Water Distribution", "Records & Mapping", "ON_DW", "distribution-system mapping", "identify asset locations, connectivity, size, material and valve relationships", "A break occurs where field valves do not match an old drawing", "verify assets in the field and update the authoritative record", "Accurate maps reduce isolation time and help prevent operating the wrong asset", "field checks, GIS and maintenance records describe the same configuration");
add("Water Distribution", "Pumping", "EPA_WATER", "booster pumping", "add hydraulic head where elevation or demand requires more pressure", "Suction pressure drops as the booster speed rises", "check supply capacity and avoid operating into inadequate suction conditions", "A booster cannot create source capacity; it transfers energy to available flow", "discharge pressure improves without unstable suction or cavitation signs");
add("Water Distribution", "Storage", "EPA_WATER", "tank mixing", "reduce stratification and distribute disinfectant and temperature more evenly", "A tank shows warm low-residual water near the outlet", "review inlet-outlet operation and use the approved mixing strategy", "Tank geometry and cycling can create short-circuiting or stagnant zones", "profiles show more uniform temperature and residual through the stored volume");
add("Water Distribution", "Excavation Safety", "CCOHS_CS", "excavation hazard control", "protect workers from cave-in, utilities, traffic, water and hazardous atmospheres", "A crew exposes a leaking main in unstable saturated soil", "stop entry until shoring, access, dewatering and utility controls are verified", "Water-main repair urgency does not remove excavation and confined-space precautions", "the excavation remains stable with safe access and controlled hazards");

// Wastewater treatment: 25 objectives x 4 item forms = 100 questions.
add("Wastewater Treatment", "Wastewater Characteristics", "EPA_WW", "biochemical oxygen demand", "estimate the oxygen used by microorganisms while degrading biodegradable material", "Influent strength increases and aeration demand rises", "confirm the change with representative BOD and process measurements", "BOD reflects biodegradable organic loading under defined test conditions", "influent and effluent BOD trends agree with observed biological loading");
add("Wastewater Treatment", "Wastewater Characteristics", "EPA_WW", "total suspended solids", "measure the nonfilterable suspended organic and inorganic material retained by the test filter", "Effluent appears cloudy after a clarifier upset", "confirm solids carryover with a representative TSS sample", "TSS is the nonfilterable suspended fraction retained by the test filter; dissolved material passes through", "effluent TSS trends agree with visible solids and clarifier performance");
add("Wastewater Treatment", "Preliminary Treatment", "EPA_WW", "screening", "remove rags and large debris before they damage or obstruct downstream equipment", "Pump ragging increases at the headworks", "inspect screen capture, cleaning and bypass conditions", "Screens protect equipment but do not remove dissolved organic loading", "captured debris increases while downstream ragging decreases");
add("Wastewater Treatment", "Preliminary Treatment", "EPA_WW", "grit removal", "settle dense inorganic particles while keeping most organics in suspension", "Sand accumulates in channels and digesters", "check grit-zone velocity, aeration and removal equipment", "Excessive velocity carries grit forward; insufficient velocity can settle organics", "grit is removed with limited putrescible organic material");
add("Wastewater Treatment", "Primary Treatment", "EPA_WW", "primary clarification", "settle solids and remove floatables before biological treatment", "Primary effluent TSS rises while influent flow is stable", "inspect sludge withdrawal, scum removal and hydraulic distribution", "Septic sludge blankets can release solids and odours back into the effluent", "sludge blanket and effluent solids remain within operating targets");
add("Wastewater Treatment", "Secondary Treatment", "EPA_AS", "activated sludge", "use suspended aerobic microorganisms to convert organics into settleable biomass", "Aeration-basin loading rises and effluent quality begins to decline", "verify oxygen, biomass inventory, settling and return-sludge operation", "The process depends on both biological oxidation and effective solids separation", "oxygen uptake, settleability and effluent quality respond consistently");
add("Wastewater Treatment", "Secondary Treatment", "EPA_AS", "aeration control", "supply oxygen and mixing needed by the biological process", "Dissolved oxygen falls at the end of the aeration basin", "confirm the reading and check air delivery, loading and diffuser condition", "Too little oxygen can limit treatment; excessive aeration wastes energy and may harm settling", "DO remains within the plant target without unstable blower operation");
add("Wastewater Treatment", "Secondary Treatment", "EPA_AS", "return activated sludge", "return settled biomass from the secondary clarifier to the aeration basin", "The clarifier blanket rises while aeration MLSS falls", "check RAS pumping and adjust within the approved process strategy", "RAS controls solids circulation; it does not directly remove excess solids from the system", "clarifier blanket and aeration biomass stabilize together");
add("Wastewater Treatment", "Secondary Treatment", "EPA_AS", "waste activated sludge", "remove excess biomass to control solids inventory and sludge age", "MLSS and sludge age keep increasing despite steady load", "verify and increase wasting according to the process target", "Wasting changes the mass of solids in the system and therefore affects SRT", "MLSS and SRT move toward target without loss of needed biomass");
add("Wastewater Treatment", "Secondary Clarification", "EPA_AS", "secondary clarification", "separate biological floc from treated water and thicken return sludge", "Effluent solids rise during peak flow", "check hydraulic loading, blanket depth, settling and RAS capacity", "A clarifier must both clarify the effluent and concentrate solids for return", "effluent TSS remains low while underflow solids are adequately concentrated");
add("Wastewater Treatment", "Process Control", "EPA_AS", "settleability testing", "observe how activated sludge settles and compacts over a defined time", "Effluent solids rise even though MLSS is unchanged", "run a settleometer test and compare blanket formation and compaction", "A settleability result must be interpreted with MLSS and plant conditions", "settling pattern helps explain the observed clarifier behaviour");
add("Wastewater Treatment", "Process Control", "EPA_AS", "sludge bulking control", "restore settleability when dispersed or filamentous biomass fails to compact", "A 30-minute settle test leaves a high, diffuse blanket", "identify the cause using microscopy and process data before applying control", "Bulking can result from low DO, septicity or nutrient imbalance", "settling improves after the verified root cause is corrected");
add("Wastewater Treatment", "Attached Growth", "EPA_WW", "trickling filtration", "treat wastewater as it passes over attached biofilm media", "Ponding develops on the media surface", "inspect distributor operation, hydraulic loading and media plugging", "A trickling filter uses attached growth and still needs downstream solids separation", "distribution remains even and ponding or fly problems are controlled");
add("Wastewater Treatment", "Attached Growth", "EPA_WW", "rotating biological contactors", "expose attached biofilm alternately to wastewater and air on rotating media", "A shaft drive trips and discs stop rotating", "isolate and lock out the drive, investigate the trip cause, and restart only under the approved procedure", "Rotation supplies contact, oxygen transfer and sloughing control, but a tripped drive must not be reset before safe isolation and fault investigation", "media rotates smoothly with healthy biofilm and stable effluent after the trip cause is corrected");
add("Wastewater Treatment", "Pond Systems", "EPA_WW", "wastewater stabilization ponds", "use long detention and natural biological activity for treatment", "Effluent algae and TSS rise during warm weather", "evaluate pond loading, short-circuiting and the approved algae-control strategy", "Pond performance varies with temperature, sunlight, wind, depth and detention", "treatment remains stable across seasonal operating conditions");
add("Wastewater Treatment", "Disinfection", "EPA_WW", "wastewater chlorination", "inactivate pathogens before effluent discharge or reuse", "Effluent demand rises and the target residual is not achieved", "confirm feed, mixing, demand and effective contact time", "Solids and ammonia can increase chlorine demand and shield microorganisms", "residual and contact conditions meet the approved disinfection target");
add("Wastewater Treatment", "Disinfection", "EPA_WW", "dechlorination", "remove excess chlorine residual before discharge where required", "Chlorinated effluent meets bacteria goals but residual is too high", "verify and adjust the approved dechlorinating chemical feed", "Excess reducing chemical can consume oxygen or leave an unwanted residual after chlorine removal", "final residual meets the discharge target without excessive chemical use");
add("Wastewater Treatment", "Disinfection", "EPA_WW", "wastewater ultraviolet disinfection", "inactivate microorganisms without adding a chlorine residual", "UV dose falls after effluent TSS increases", "address upstream solids and inspect lamp fouling and transmittance", "Particles can shield microorganisms and reduce delivered UV dose", "validated dose and microbiological results recover as effluent clarity improves");
add("Wastewater Treatment", "Nutrient Removal", "EPA_WW", "nitrification", "biologically oxidize ammonia to nitrite and then nitrate", "Effluent ammonia rises after cold weather begins", "review SRT, temperature, DO, pH and alkalinity", "Nitrifiers grow slowly and are sensitive to low temperature and inadequate SRT", "ammonia decreases while nitrate production and alkalinity use are consistent");
add("Wastewater Treatment", "Nutrient Removal", "EPA_WW", "denitrification", "biologically reduce nitrate to nitrogen gas under anoxic conditions", "Nitrate remains high through an anoxic zone", "check carbon availability, mixing, recycle flow and dissolved oxygen intrusion", "Biological nitrate reduction needs nitrate, biodegradable carbon and anoxic conditions", "nitrate decreases without excessive dissolved oxygen in the anoxic zone");
add("Wastewater Treatment", "Nutrient Removal", "EPA_WW", "phosphorus precipitation", "precipitate dissolved phosphorus into solids that can be separated", "Effluent phosphorus rises after coagulant feed becomes erratic", "verify dose, mixing, pH and downstream solids capture", "Metal-salt addition can increase sludge production and consume alkalinity", "phosphorus falls while chemical use and sludge production remain controlled");
add("Wastewater Treatment", "Solids Stabilization", "EPA_WW", "anaerobic digestion", "stabilize sludge without oxygen while producing biogas", "Digester gas production falls and volatile acids rise", "check temperature, mixing, feed rate and alkalinity before changing operation", "Methane-forming organisms are sensitive to rapid loading and pH changes", "gas production, pH and volatile-acid relationships remain stable");
add("Wastewater Treatment", "Solids Stabilization", "EPA_WW", "aerobic digestion", "stabilize sludge using oxygen and extended biological oxidation", "Digester DO remains near zero and odour increases", "verify air delivery, mixing and solids loading", "This oxygen-based stabilization process consumes energy but is simpler than methane-producing digestion", "oxygen transfer supports stable solids reduction without septicity");
add("Wastewater Treatment", "Solids Processing", "EPA_WW", "sludge thickening", "increase solids concentration before stabilization or dewatering", "Downstream equipment receives excessive hydraulic volume", "check thickener capture, polymer and withdrawal rate", "Thickening removes water volume but is not the same as final dewatering", "underflow solids increase while solids capture remains acceptable");
add("Wastewater Treatment", "Solids Processing", "EPA_WW", "sludge dewatering", "produce a transportable cake and reduce liquid volume", "Cake solids fall while filtrate becomes cloudy", "inspect polymer dose, feed solids and mechanical settings", "Dewatering performance must consider both cake dryness and solids capture", "cake solids and centrate or filtrate quality meet operating targets");

// Wastewater collection: 25 objectives x 4 item forms = 100 questions.
add("Wastewater Collection", "System Types", "EPA_COLL", "sanitary sewers", "convey domestic and industrial wastewater separately from storm runoff", "Rainfall causes a large sanitary-flow increase", "investigate inflow and infiltration rather than assuming normal sanitary demand", "A sanitary sewer should not intentionally receive roof or catch-basin drainage", "dry-weather flow is stable and wet-weather response stays within expected limits");
add("Wastewater Collection", "System Types", "EPA_COLL", "storm sewers", "convey rainfall and surface drainage to an approved outlet or treatment control", "A dry-weather sewage odour appears at a storm outfall", "trace possible cross-connections or illicit discharges", "Dry-weather sanitary flow at a storm outlet indicates an abnormal connection or release", "the outfall is dry or carries only expected drainage between storms");
add("Wastewater Collection", "System Types", "EPA_COLL", "combined sewers", "carry sanitary wastewater and storm runoff in one pipe", "A storm produces flow above downstream treatment capacity", "follow the approved combined-overflow operating and reporting plan", "Combined systems can overflow during wet weather when capacity is exceeded", "overflow controls and monitored events agree with the approved system plan");
add("Wastewater Collection", "Gravity Sewers", "EPA_COLL", "gravity sewers", "convey wastewater downhill using pipe slope and hydraulic grade", "A reach repeatedly accumulates grit at normal dry-weather flow", "verify grade, velocity, pipe condition and upstream sources", "Low velocity promotes deposition while excessive velocity can damage some materials or structures", "routine inspection shows a clear invert without recurring deposits");
add("Wastewater Collection", "Access Structures", "EPA_COLL", "manholes", "provide access, junctions, grade changes, ventilation and inspection points", "A cover rocks under traffic and surface water enters the structure", "secure the site and repair the frame, cover and inflow path", "Manhole condition affects worker safety, inflow and structural reliability", "the cover seats securely and the structure remains watertight where designed");
add("Wastewater Collection", "Service Connections", "EPA_COLL", "service laterals", "connect individual properties to the public sewer main", "One building backs up while neighbouring services remain normal", "check the private lateral and connection before cleaning the public main", "A localized backup often points to the service lateral rather than the trunk sewer", "the lateral flows freely and the public main shows no corresponding restriction");
add("Wastewater Collection", "Service Connections", "EPA_COLL", "cleanouts", "provide surface access for inspecting and clearing a service pipe", "A lateral blockage lies between the building and property line", "use the verified cleanout to inspect or clean the lateral safely", "A cleanout is intended for maintenance access, not continuous ventilation or drainage", "equipment reaches the affected lateral without unnecessary excavation");
add("Wastewater Collection", "Lift Stations", "EPA_COLL", "lift stations", "raise wastewater where gravity flow cannot reach the next conveyance point", "Wet-well level rises despite a pump-running indication", "verify actual discharge, valves, blockage and pump condition", "A run signal does not prove that a pump is moving its required flow", "wet-well level falls at the expected rate when the pump operates");
add("Wastewater Collection", "Lift Stations", "EPA_COLL", "wet-well level control", "start and stop pumps within a range that limits flooding, septicity and excessive cycling", "A pump starts dozens of times per hour during low flow", "inspect level sensors, control range and inflow before equipment is damaged", "A narrow control band can cause short cycling and motor wear", "starts per hour and detention remain within the station's operating criteria");
add("Wastewater Collection", "Pumping", "EPA_COLL", "submersible sewage pumps", "move solids-bearing wastewater while operating below wet-well liquid level", "Pump current rises and delivered flow falls", "check for ragging, blockage, wear or a closed discharge path", "Higher current with lower flow can indicate mechanical or hydraulic restriction", "current, vibration and drawdown match the established clean-pump baseline");
add("Wastewater Collection", "Pumping", "EPA_COLL", "lift-station check valves", "stop force-main flow from returning through a stopped pump", "A stopped pump spins backward after another pump starts", "inspect the stopped pump's check valve for leakage or obstruction", "A leaking check valve can increase cycling and reverse rotation", "the stopped pump remains stationary and wet-well drawdown is not lost");
add("Wastewater Collection", "Force Mains", "EPA_COLL", "force mains", "convey pressurized wastewater from a pump station to a discharge point", "Pressure rises while station flow falls", "check downstream valves, air binding and force-main blockage", "A force main operates under pressure and can experience surge and trapped-gas problems", "pressure and flow follow the established system curve without abnormal surges");
add("Wastewater Collection", "Wet-Weather Flow", "EPA_COLL", "inflow", "describe direct stormwater entry through sources such as roof drains or open covers", "Flow spikes almost immediately when rainfall begins", "inspect direct, rapid storm connections before focusing on slow groundwater leakage", "Direct wet-weather entry responds quickly to rainfall because it passes through connections or openings", "removing a verified direct source reduces the immediate wet-weather spike");
add("Wastewater Collection", "Wet-Weather Flow", "EPA_COLL", "infiltration", "describe groundwater entering through defects in buried pipes, joints and structures", "Elevated sewer flow continues for days after rain stops", "inspect groundwater-related defects using flow, CCTV or testing data", "Groundwater entry often has a delayed and sustained response compared with direct wet-weather connections", "repairing submerged defects reduces prolonged post-storm base flow");
add("Wastewater Collection", "Inspection", "EPA_COLL", "CCTV inspection", "record internal pipe defects, deposits, roots and service connections", "A sewer has recurring blockages but its surface alignment is unknown", "clean the reach as needed and complete a coded internal inspection", "CCTV images are most useful when location, direction and defect coding are documented", "the inspection provides traceable defect locations and usable condition data");
add("Wastewater Collection", "Cleaning", "EPA_COLL", "hydraulic sewer cleaning", "use controlled high-velocity water to remove deposits and obstructions", "Grease and sediment reduce capacity in a gravity main", "select the correct nozzle and capture downstream debris", "Cleaning should remove debris without simply pushing it into a downstream blockage", "post-cleaning inspection shows restored cross-section and captured debris");
add("Wastewater Collection", "Blockage Control", "EPA_COLL", "FOG control", "reduce fats, oils and grease that cool, solidify and obstruct sewers", "A restaurant district has repeated grease blockages", "combine targeted cleaning with source-control inspection and education", "Downstream cleaning treats the symptom unless grease discharge at the source is controlled", "blockage frequency falls after verified source and maintenance actions");
add("Wastewater Collection", "Blockage Control", "EPA_COLL", "root-intrusion control", "remove or prevent roots entering through defective joints and cracks", "CCTV shows fine roots becoming a dense mass at one joint", "clear the roots and plan structural repair of the entry defect", "Cutting roots restores capacity temporarily but does not seal the defect", "the repaired joint remains clear on follow-up inspection");
add("Wastewater Collection", "Emergency Response", "ON_WW", "sewer-overflow response", "protect people and the environment while stopping, containing and documenting a release", "Wastewater emerges from a manhole beside a creek", "protect the area, contain the release and notify as required", "Fast control, accurate records and required reporting are all part of overflow response", "the release is controlled and the event record supports follow-up and reporting");
add("Wastewater Collection", "Atmospheric Hazards", "CCOHS_H2S", "hydrogen-sulfide control", "detect and manage a toxic, flammable gas that can accumulate in low spaces", "A worker smells rotten eggs at a wet well and the odour then disappears", "leave the hazard area and rely on calibrated monitoring, not smell", "Odour fatigue can remove the warning smell while dangerous H2S remains", "calibrated readings remain within the entry or work limits under ventilation");
add("Wastewater Collection", "Confined Spaces", "CCOHS_CS", "confined-space entry", "control atmospheric, engulfment, mechanical and rescue hazards before entry", "A manhole requires inspection below the opening", "use the complete entry permit, isolation, testing, ventilation, attendant and rescue plan", "A quick visual task can still expose an entrant to a fatal atmosphere", "all permit conditions remain verified throughout the entry");
add("Wastewater Collection", "Confined Spaces", "CCOHS_CS", "atmospheric testing", "measure oxygen, flammability and toxic gases before and during entry", "A sewer manhole has been open and ventilated for ten minutes", "test with calibrated equipment in the required order and at representative levels", "Ventilation does not eliminate the need for testing because conditions can change", "continuous readings remain acceptable from top to bottom of the work zone");
add("Wastewater Collection", "Corrosion & Odour", "CCOHS_H2S", "sewer corrosion control", "limit acid attack produced when hydrogen sulfide is converted on moist surfaces", "Concrete above the wastewater line becomes soft and pitted", "investigate sulfide generation, ventilation and protective or chemical controls", "Biogenic sulfuric acid often attacks the crown where moist surfaces contact sewer gas", "sulfide and corrosion indicators decline after the selected control");
add("Wastewater Collection", "Investigation", "EPA_COLL", "smoke testing", "locate inflow paths and surface-connected defects by observing non-toxic smoke", "Wet-weather flow suggests roof or yard-drain connections", "conduct a planned smoke test with public and emergency-service notification", "Introducing non-toxic smoke is best for openings connected to the surface, not every groundwater defect", "visible smoke locations lead to verified inflow-source corrections");
add("Wastewater Collection", "Monitoring & Records", "EPA_COLL", "collection-system flow monitoring", "quantify base flow, wet-weather response, capacity and pump-station performance", "A capital project is proposed to reduce inflow and infiltration", "collect quality-controlled flow and rainfall data before and after the work", "Comparable data are needed to distinguish real improvement from weather variation", "validated monitoring shows a reproducible change in the targeted flow component");

concepts.push(...EXPANDED_OIT_OBJECTIVES);

if (concepts.length !== 200) throw new Error(`Expected 200 concepts, found ${concepts.length}`);

const questions = [];
let nextId = 1;
const stemTemplates = {
  purpose: [
    c => `Which operating objective is specifically associated with ${c.name}?`,
    c => `Which description most directly identifies the intended function of ${c.name}?`,
    c => `Which outcome is the defining objective of ${c.name}, rather than a related process?`,
    c => `Which operating need is addressed most directly by ${c.name}?`,
    c => `Which objective distinguishes ${c.name} from the other processes in this module?`,
    c => `Which description most specifically explains the role of ${c.name} in this process?`,
    c => `Which result is ${c.name} principally intended to produce?`,
    c => `Which objective should an operator associate directly with ${c.name}?`,
  ],
  action: [
    c => `${c.scenario}. Which response most directly addresses this specific finding?`,
    c => `${c.scenario}. Which listed action is targeted most directly to the stated condition?`,
    c => `During routine rounds, ${c.scenario.toLowerCase()}. Which response directly addresses the evidence given?`,
    c => `Consider this operating condition: ${c.scenario}. Which action is specific to this problem?`,
    c => `${c.scenario}. Which response addresses the stated hazard or process condition most directly?`,
    c => `An operator observes the following: ${c.scenario}. Which action is most directly supported by these facts?`,
    c => `${c.scenario}. Which operating response is specific to the condition described?`,
    c => `While checking the system, the operator finds this condition: ${c.scenario}. Which response directly targets it?`,
  ],
  principle: [
    c => `${c.scenario}. Which principle most directly explains the operating issue involving ${c.name}?`,
    c => `For ${c.name}, which principle specifically governs the response to this finding: ${c.scenario}?`,
    c => `Which principle distinguishes ${c.name} in the following situation: ${c.scenario}?`,
    c => `${c.scenario}. Which statement most specifically applies to ${c.name}?`,
    c => `Given this ${c.name} finding—${c.scenario}—which explanation is most directly relevant?`,
    c => `Given this finding—${c.scenario}—which operating principle is specific to ${c.name}?`,
    c => `Which principle should govern the ${c.name} decision raised by this finding: ${c.scenario}?`,
    c => `An OIT encounters this ${c.name} situation: ${c.scenario}. Which principle applies most directly?`,
  ],
  indicator: [
    c => `After this response—${c.action}—which result most directly confirms the intended ${c.name} outcome?`,
    c => `Which result is the most specific evidence that the response to ${c.name} worked as intended?`,
    c => `After addressing this finding—${c.scenario}—which result most directly confirms the intended outcome of ${c.name}?`,
    c => `Which result specifically verifies the intended outcome after this response—${c.action}?`,
    c => `Which field result most directly shows that the ${c.name} response achieved its objective?`,
    c => `After this response—${c.action}—which evidence is specific to achieving the objective of ${c.name}?`,
    c => `Which finding most directly confirms that the operating objective for ${c.name} has been achieved?`,
    c => `Which result is the clearest operational confirmation that the ${c.name} response was effective?`,
  ],
};

function peersFor(index, answerField) {
  const c = concepts[index];
  const answerLength = value => value.trim().split(/\s+/).length;
  const tokens = value => new Set(value.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(token => token.length > 2));
  const similarity = (left, right) => {
    const leftTokens = tokens(left);
    const rightTokens = tokens(right);
    const intersection = [...leftTokens].filter(token => rightTokens.has(token)).length;
    const union = new Set([...leftTokens, ...rightTokens]).size;
    return union === 0 ? 0 : intersection / union;
  };
  const targetLength = answerLength(c[answerField]);
  const candidates = concepts
    .map((x, i) => ({ x, i }))
    .filter(v => v.i !== index && v.x.stream === c.stream)
    .filter(v => similarity(v.x[answerField], c[answerField]) < 0.35)
    .sort((left, right) => {
      const leftDifferentModule = left.x.module === c.module ? 1 : 0;
      const rightDifferentModule = right.x.module === c.module ? 1 : 0;
      if (leftDifferentModule !== rightDifferentModule) return leftDifferentModule - rightDifferentModule;
      const leftLengthPenalty = Math.abs(answerLength(left.x[answerField]) - targetLength) > Math.max(4, targetLength * 0.4) ? 1 : 0;
      const rightLengthPenalty = Math.abs(answerLength(right.x[answerField]) - targetLength) > Math.max(4, targetLength * 0.4) ? 1 : 0;
      if (leftLengthPenalty !== rightLengthPenalty) return leftLengthPenalty - rightLengthPenalty;
      const leftLengthDifference = Math.abs(answerLength(left.x[answerField]) - targetLength);
      const rightLengthDifference = Math.abs(answerLength(right.x[answerField]) - targetLength);
      if (leftLengthDifference !== rightLengthDifference) return leftLengthDifference - rightLengthDifference;
      return ((left.i - index + concepts.length) * 17 % concepts.length) - ((right.i - index + concepts.length) * 17 % concepts.length);
    });
  const selected = [];
  for (const candidate of candidates) {
    if (selected.every(existing => similarity(existing.x[answerField], candidate.x[answerField]) < 0.35)) {
      selected.push(candidate);
      if (selected.length === 3) break;
    }
  }
  if (selected.length < 3) throw new Error(`Could not find three distinct distractors for ${c.name} ${answerField}.`);
  return selected.map(value => value.x);
}

function canonicalModule(stream, module) {
  if (stream === "Water Treatment") {
    if (module === "Disinfection") return "Disinfection";
    if (module === "Chemical Feed & Storage") return "Chemical Feed & Storage";
    if (module === "Water Chemistry" || module === "Sampling & Monitoring" || module === "Corrosion Control") return "Water Quality & Sampling";
    if (module === "Math & Calculations" || module === "Ontario Regulations" || module === "Health & Safety") return module;
    return "Water Treatment";
  }
  if (stream === "Water Distribution") {
    if (["Water Quality", "Water Age", "Flushing", "Cross-Connection Control", "Main Breaks", "Corrosion"].includes(module)) return "Water Quality & Sampling";
    if (module === "Pumping") return "Pumping Systems";
    if (module === "Records & Mapping") return "Ontario Regulations";
    if (module === "Excavation Safety" || module === "Health & Safety") return "Health & Safety";
    if (module === "Math & Calculations" || module === "Ontario Regulations") return module;
    return "Hydraulics";
  }
  if (stream === "Wastewater Treatment") {
    if (module === "Wastewater Characteristics") return "Wastewater Characteristics & Sources";
    if (["Preliminary Treatment", "Primary Treatment", "Flow Management"].includes(module)) return "Preliminary & Primary Treatment";
    if (["Secondary Treatment", "Secondary Clarification", "Process Control", "Attached Growth", "Pond Systems"].includes(module)) return "Secondary & Biological Treatment";
    if (module === "Disinfection") return "Disinfection & Effluent Quality";
    if (["Solids Stabilization", "Solids Processing"].includes(module)) return "Solids Handling & Biosolids";
    if (module === "Nutrient Removal") return "Nutrient Removal & Advanced Treatment";
    if (module === "Lab & Monitoring") return "Lab & Monitoring";
    if (module === "Math & Calculations") return module;
    return "Ontario Regulations & Safety";
  }
  if (["Lift Stations", "Pumping", "Force Mains"].includes(module)) return "Pumping & Hydraulics";
  if (["Atmospheric Hazards", "Confined Spaces", "Corrosion & Odour", "Emergency Response", "Ontario Regulations & Safety"].includes(module)) return "Ontario Regulations & Safety";
  if (module === "Monitoring & Records") return "Lab & Monitoring";
  if (module === "Math & Calculations") return module;
  return "Wastewater Collection Systems";
}

function sentenceCaseOption(option) {
  if (/^pH(?:\s|$)/.test(option)) return `The ${option}`;
  return option.replace(/^[a-z]/, initial => initial.toUpperCase());
}

function addQuestion({ stream, module, topic, difficulty, stem, correct, distractors, explanation, source, isCalc = false, formula = "" }) {
  const correctIndex = 0;
  const options = distractors.map(sentenceCaseOption);
  options.splice(correctIndex, 0, sentenceCaseOption(correct));
  const deliveryModule = canonicalModule(stream, module);
  questions.push({
    questionNum: nextId,
    bankKey: stream === "Water Treatment" || stream === "Water Distribution" ? "oit" : "oit-ww",
    stream,
    module: deliveryModule,
    topic,
    difficulty,
    cognitiveLevel: difficulty === "easy" ? "recall" : "application",
    question: stem,
    optionA: options[0], optionB: options[1], optionC: options[2], optionD: options[3],
    options,
    correctIndex,
    correctAnswer: options[correctIndex],
    explanation,
    isCalc: isCalc ? "yes" : "no",
    formula,
    sourceTitle: SOURCES[source].title,
    sourceReference: `${SOURCES[source].reference} — ${stream} / ${module} / ${topic}`,
    sourceUrl: SOURCES[source].url,
    blueprintObjective: `${stream} - ${module} - ${topic}`,
    reviewStatus: "unreviewed",
  });
  nextId += 1;
}

const informationTopics = /assessment|demand|monitoring|sampling|testing|index|oxygen demand|suspended solids|meter|inspection|records|survey/i;
const isInformationObjective = concept => informationTopics.test(concept.name);
const adverseConditionTopics = new Set([
  "pump cavitation",
  "hypochlorite strength decay",
  "backpressure backflow",
  "backsiphonage backflow",
  "tuberculation",
  "inflow",
  "infiltration",
  "clarifier hydraulic overloading",
  "activated-sludge foaming",
  "sewer surcharge",
]);
const isAdverseCondition = concept => adverseConditionTopics.has(concept.name);

function purposeStem(concept, variant) {
  if (isAdverseCondition(concept)) {
    return `Which objective should an operator associate with recognizing or controlling ${concept.name}?`;
  }
  if (isInformationObjective(concept)) {
    return [
      `What can an operator primarily determine from ${concept.name}?`,
      `Which description best states the information obtained through ${concept.name}?`,
      `What information should an operator obtain from ${concept.name}?`,
      `Which information is obtained most directly from ${concept.name}?`,
      `Which result describes the specific purpose of ${concept.name}?`,
      `Which description best explains the value of data from ${concept.name}?`,
      `What does an operator gain by using the results of ${concept.name} correctly?`,
      `Which operating need is addressed by information from ${concept.name}?`,
    ][variant];
  }
  return stemTemplates.purpose[variant](concept);
}

function indicatorStem(concept, variant) {
  if (isAdverseCondition(concept)) {
    return `After corrective work, which result most directly confirms that ${concept.name} has been controlled?`;
  }
  if (isInformationObjective(concept)) {
    return [
      `Which result gives the strongest confidence in information from ${concept.name}?`,
      `What is the best routine check on the reliability of ${concept.name}?`,
      `Which observation best supports the interpretation of ${concept.name} results?`,
      `How should an operator confirm that results from ${concept.name} are useful?`,
      `Which quality-control result best supports confidence in ${concept.name}?`,
      `What evidence should accompany reliable results from ${concept.name}?`,
      `Which finding best verifies the usefulness of ${concept.name} data?`,
      `How can the operator best confirm the dependability of ${concept.name}?`,
    ][variant];
  }
  return stemTemplates.indicator[variant](concept);
}

for (let i = 0; i < concepts.length; i += 1) {
  const c = concepts[i];
  const t = i % 8;
  const purposeExplanation = isAdverseCondition(c)
    ? `The operator's objective when addressing ${c.name} is to ${c.purpose}. ${c.principle}.`
    : `The purpose of ${c.name} is to ${c.purpose}. ${c.principle}.`;
  const indicatorExplanation = isAdverseCondition(c)
    ? `The relevant evidence is that ${c.indicator}. This shows that ${c.name} has been controlled after this response: ${c.action}.`
    : `The relevant performance evidence is that ${c.indicator}. The objective of ${c.name} is to ${c.purpose}.`;
  addQuestion({ stream: c.stream, module: c.module, topic: c.name, difficulty: "easy", stem: purposeStem(c, t), correct: c.purpose, distractors: peersFor(i, "purpose").map(p => p.purpose), explanation: purposeExplanation, source: c.source });
  addQuestion({ stream: c.stream, module: c.module, topic: c.name, difficulty: c.difficulty, stem: stemTemplates.action[(t + 1) % 8](c), correct: c.action, distractors: peersFor(i, "action").map(p => p.action), explanation: `The first response is to ${c.action}. ${c.principle}.`, source: c.source });
  addQuestion({ stream: c.stream, module: c.module, topic: c.name, difficulty: "medium", stem: stemTemplates.principle[(t + 2) % 8](c), correct: c.principle, distractors: peersFor(i, "principle").map(p => p.principle), explanation: `${c.principle}. In practice, the operator should ${c.action}.`, source: c.source });
  addQuestion({ stream: c.stream, module: c.module, topic: c.name, difficulty: i % 3 === 0 ? "hard" : "medium", stem: indicatorStem(c, (t + 3) % 8), correct: c.indicator, distractors: peersFor(i, "indicator").map(p => p.indicator), explanation: indicatorExplanation, source: c.source });
}

const fmt = (n, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round((n + Number.EPSILON) * factor) / factor;
};
const calculationVariants = new Map();
const calculationContexts = [
  "During the morning operating review",
  "While checking the daily process record",
  "During an afternoon performance check",
  "After confirming the field measurements",
  "During shift handoff",
  "While reviewing a process trend",
  "During the weekly performance review",
  "While independently verifying the operator log",
];
function numericDistractors(value, scale = 1, decimals = 1, bounds = { min: 0, max: Number.POSITIVE_INFINITY }) {
  const candidates = [value * 0.8, value * 1.2, value + scale, Math.max(0, value - scale), value * 1.5]
    .map(v => fmt(v, decimals))
    .filter(v => v !== value && v >= bounds.min && v <= bounds.max);
  const distractors = [...new Set(candidates)].slice(0, 3);
  if (distractors.length !== 3) throw new Error(`Could not generate three bounded distractors for ${value}.`);
  return distractors;
}
function addCalc(stream, module, topic, stem, correctValue, unit, formula, work, source, decimals = 1, scale = 1, bounds = { min: 0, max: Number.POSITIVE_INFINITY }) {
  const value = fmt(correctValue, decimals);
  if (value < bounds.min || value > bounds.max) throw new Error(`${topic} correct answer ${value} is outside its permitted range.`);
  const distractors = numericDistractors(value, scale, decimals, bounds).map(v => `${v} ${unit}`.trim());
  const variant = calculationVariants.get(`${stream}|${topic}`) ?? 0;
  calculationVariants.set(`${stream}|${topic}`, variant + 1);
  const precision = decimals === 0 ? "Round to the nearest whole number." : `Round to ${decimals} decimal ${decimals === 1 ? "place" : "places"}.`;
  addQuestion({
    stream, module, topic, difficulty: "hard", stem: `${calculationContexts[variant % calculationContexts.length]}, ${stem.charAt(0).toLowerCase()}${stem.slice(1)} ${precision}`,
    correct: `${value} ${unit}`.trim(), distractors,
    explanation: `${formula}. ${work} Therefore, the answer is ${value} ${unit}.`,
    source, isCalc: true, formula,
  });
}

// Six calculation objectives per stream, eight distinct numerical variants each = 96 questions per bank.
const wtCases = {
  removal: [[12,0.6],[18,1.8],[25,3.75],[40,8.0],[16,4],[30,9],[22,7.7],[35,14]],
  dose: [[2.4,6],[1.8,12],[3.2,5],[0.75,20],[1.25,16],[2.8,7.5],[0.9,18],[3.5,3.2]],
  detention: [[1200,4800],[750,3600],[2100,7200],[500,1000],[1800,6000],[960,5760],[1500,4000],[2400,3200]],
  loading: [[2400,120],[3600,150],[1800,120],[5400,180],[2800,160],[4200,200],[1600,100],[6000,240]],
  ct: [[0.8,30],[1.2,25],[0.6,45],[1.5,24],[0.9,35],[1.1,35],[0.7,50],[1.4,28]],
  demand: [[2.4,0.7],[3.0,1.1],[1.8,0.5],[2.6,0.6],[2.2,0.8],[3.4,1.2],[1.6,0.4],[2.9,0.8]],
};
for (const [influent, effluent] of wtCases.removal) addCalc("Water Treatment","Math & Calculations","turbidity removal",`Raw-water turbidity is ${influent} NTU and settled-water turbidity is ${effluent} NTU. What is the removal efficiency?`,(influent-effluent)/influent*100,"%","Removal = (influent - effluent) / influent x 100",`(${influent} - ${effluent}) / ${influent} x 100`,"EPA_FILTER",1,5,{ min: 0, max: 100 });
for (const [dose, flow] of wtCases.dose) addCalc("Water Treatment","Math & Calculations","chemical mass",`A plant treats ${flow} ML/d at a chemical dose of ${dose} mg/L. How many kilograms per day are required?`,dose*flow,"kg/d","Mass (kg/d) = dose (mg/L) x flow (ML/d)",`${dose} x ${flow} = ${fmt(dose*flow,2)}`,"EPA_WATER",1,2);
for (const [vol, flow] of wtCases.detention) addCalc("Water Treatment","Math & Calculations","detention time",`A basin holds ${vol} m3 and receives ${flow} m3/d. What is the nominal detention time?`,vol/flow*24,"h","Detention time (h) = volume / daily flow x 24",`${vol} / ${flow} x 24`,"EPA_WATER",1,1);
for (const [flow, area] of wtCases.loading) addCalc("Water Treatment","Math & Calculations","filter loading rate",`A filter receives ${flow} m3/h over ${area} m2 of surface area. What is the hydraulic loading rate?`,flow/area,"m/h","Loading rate = flow / filter area",`${flow} / ${area}`,"EPA_FILTER",1,2);
for (const [residual, minutes] of wtCases.ct) addCalc("Water Treatment","Math & Calculations","CT value",`The disinfectant residual is ${residual} mg/L and effective contact time is ${minutes} minutes. What is CT?`,residual*minutes,"mg-min/L","CT = residual concentration x effective contact time",`${residual} x ${minutes}`,"EPA_WATER",1,5);
for (const [dose, residual] of wtCases.demand) addCalc("Water Treatment","Math & Calculations","chlorine demand",`A chlorine dose of ${dose} mg/L produces a residual of ${residual} mg/L. What is the chlorine demand?`,dose-residual,"mg/L","Demand = applied dose - measured residual",`${dose} - ${residual}`,"EPA_WATER",1,0.5);

const wdCases = {
  pressure: [[12],[18],[25],[32],[15],[22],[28],[40]],
  volume: [[0.2,300],[0.3,500],[0.15,800],[0.4,250],[0.25,450],[0.35,320],[0.18,700],[0.5,200]],
  velocity: [[0.03,0.2],[0.05,0.25],[0.08,0.3],[0.015,0.15],[0.04,0.225],[0.07,0.28],[0.025,0.18],[0.1,0.35]],
  daily: [[8],[12],[20],[35],[6],[15],[28],[42]],
  detention: [[900,3.6],[1500,4.8],[600,1.8],[2400,8],[1200,3.2],[1800,5],[750,1.8],[3000,6.5]],
  dose: [[0.6,8],[1.0,5],[0.8,12],[0.5,20],[0.7,14],[1.2,6],[0.45,24],[0.9,9]],
};
for (const [head] of wdCases.pressure) addCalc("Water Distribution","Math & Calculations","head and pressure",`Ignoring friction, what gauge pressure is produced by ${head} m of water head?`,head*9.81,"kPa","Pressure (kPa) = head (m) x 9.81",`${head} x 9.81`,"EPA_WATER",1,10);
for (const [diameter,length] of wdCases.volume) addCalc("Water Distribution","Math & Calculations","pipe volume",`A circular main has an inside diameter of ${diameter} m and a length of ${length} m. What volume does it hold?`,Math.PI*diameter**2/4*length,"m3","Volume = pi x diameter^2 / 4 x length",`pi x ${diameter}^2 / 4 x ${length}`,"EPA_WATER",1,5);
for (const [q,d] of wdCases.velocity) addCalc("Water Distribution","Math & Calculations","pipe velocity",`Flow through a ${d} m inside-diameter main is ${q} m3/s. What is the average velocity?`,q/(Math.PI*d**2/4),"m/s","Velocity = flow / area; area = pi x diameter^2 / 4",`${q} / (pi x ${d}^2 / 4)`,"EPA_WATER",2,0.5);
for (const [q] of wdCases.daily) addCalc("Water Distribution","Math & Calculations","flow conversion",`A district uses an average flow of ${q} L/s. Approximately how many megalitres are used per day?`,q*86400/1e6,"ML/d","Daily volume (ML/d) = L/s x 86,400 / 1,000,000",`${q} x 86,400 / 1,000,000`,"EPA_WATER",2,0.5);
for (const [volume,flow] of wdCases.detention) addCalc("Water Distribution","Math & Calculations","storage detention",`A tank contains ${volume} m3 and the zone uses ${flow} ML/d. What is the nominal detention time?`,volume/(flow*1000)*24,"h","Detention (h) = volume (m3) / flow (m3/d) x 24",`${volume} / (${flow} x 1000) x 24`,"EPA_WATER",1,2);
for (const [dose,flow] of wdCases.dose) addCalc("Water Distribution","Math & Calculations","booster chemical mass",`A booster station treats ${flow} ML/d with ${dose} mg/L of sodium hypochlorite as available chlorine. What chlorine mass is applied?`,dose*flow,"kg/d","Mass (kg/d) = dose (mg/L) x flow (ML/d)",`${dose} x ${flow}`,"ON_DW",1,2);

const wwtCases = {
  removal: [[220,22],[180,27],[300,60],[160,40],[250,75],[200,70],[275,110],[140,63]],
  loading: [[240,5],[180,8],[320,4],[150,10],[210,6],[260,7.5],[175,12],[340,3.5]],
  svi: [[240,3000],[180,2400],[300,3000],[150,2500],[225,2500],[245,3500],[160,2200],[320,4200]],
  srt: [[3600,300],[2500,200],[4200,300],[1800,120],[3000,180],[4800,300],[2100,120],[3900,200]],
  fm: [[450,3000],[600,3000],[300,2500],[750,3000],[525,4200],[420,2400],[680,4250],[360,1600]],
  detention: [[4800,12],[3600,12],[6000,12],[2500,8],[4200,12],[3000,8],[7200,15],[1800,5]],
};
for (const [influent,effluent] of wwtCases.removal) addCalc("Wastewater Treatment","Math & Calculations","BOD removal",`Influent BOD is ${influent} mg/L and effluent BOD is ${effluent} mg/L. What is the BOD removal efficiency?`,(influent-effluent)/influent*100,"%","Removal = (influent - effluent) / influent x 100",`(${influent} - ${effluent}) / ${influent} x 100`,"EPA_WW",1,5,{ min: 0, max: 100 });
for (const [conc,flow] of wwtCases.loading) addCalc("Wastewater Treatment","Math & Calculations","BOD loading",`Influent flow is ${flow} ML/d at ${conc} mg/L BOD. What is the BOD load?`,conc*flow,"kg/d","Load (kg/d) = concentration (mg/L) x flow (ML/d)",`${conc} x ${flow}`,"EPA_WW",0,100);
for (const [settled,mlss] of wwtCases.svi) addCalc("Wastewater Treatment","Math & Calculations","sludge volume index",`The 30-minute settled-sludge volume is ${settled} mL/L and MLSS is ${mlss} mg/L. What is the SVI?`,settled*1000/mlss,"mL/g","SVI (mL/g) = settled volume (mL/L) x 1000 / MLSS (mg/L)",`${settled} x 1000 / ${mlss}`,"EPA_AS",1,10);
for (const [inventory,loss] of wwtCases.srt) addCalc("Wastewater Treatment","Math & Calculations","solids retention time",`The process contains ${inventory} kg of solids and loses ${loss} kg/d through wasting and effluent. What is the SRT?`,inventory/loss,"d","SRT = solids inventory / daily solids leaving",`${inventory} / ${loss}`,"EPA_AS",1,2);
for (const [food,mass] of wwtCases.fm) addCalc("Wastewater Treatment","Math & Calculations","food-to-microorganism ratio",`The aeration system receives ${food} kg/d BOD and contains ${mass} kg of biomass. What is the F/M ratio?`,food/mass,"kg BOD/kg biomass-d","F/M = daily food load / biomass inventory",`${food} / ${mass}`,"EPA_AS",2,0.05);
for (const [volume,flow] of wwtCases.detention) addCalc("Wastewater Treatment","Math & Calculations","aeration detention",`An aeration basin holds ${volume} m3 and receives ${flow} ML/d. What is the nominal hydraulic detention time?`,volume/(flow*1000)*24,"h","Detention (h) = volume / daily flow x 24",`${volume} / (${flow} x 1000) x 24`,"EPA_AS",1,2);

const wwcCases = {
  slope: [[0.6,120],[0.9,120],[0.45,150],[1.2,200],[0.5,125],[1.05,150],[0.84,105],[0.9,100]],
  volume: [[0.25,400],[0.3,600],[0.2,900],[0.4,350],[0.225,500],[0.35,450],[0.18,750],[0.45,300]],
  runtime: [[90,25],[120,40],[75,20],[150,30],[105,30],[84,20],[132,40],[60,10]],
  ii: [[6,9],[8,10],[5,9],[10,16],[7,8.4],[9,11.7],[4,5.6],[12,22.8]],
  velocity: [[0.04,0.25],[0.06,0.3],[0.025,0.2],[0.09,0.35],[0.05,0.275],[0.075,0.325],[0.03,0.225],[0.11,0.4]],
  fill: [[30,8,5],[45,12,7],[25,6,3],[60,15,10],[38,9,5],[52,14,8],[28,7,4],[74,18,12]],
};
for (const [drop,run] of wwcCases.slope) addCalc("Wastewater Collection","Math & Calculations","sewer slope",`A sewer invert drops ${drop} m over a horizontal run of ${run} m. What is the slope?`,drop/run*100,"%","Slope (%) = vertical drop / horizontal run x 100",`${drop} / ${run} x 100`,"EPA_COLL",2,0.1);
for (const [diameter,length] of wwcCases.volume) addCalc("Wastewater Collection","Math & Calculations","pipe volume",`A full circular sewer has an inside diameter of ${diameter} m and length of ${length} m. What volume does it contain?`,Math.PI*diameter**2/4*length,"m3","Volume = pi x diameter^2 / 4 x length",`pi x ${diameter}^2 / 4 x ${length}`,"EPA_COLL",1,10);
for (const [volume,rate] of wwcCases.runtime) addCalc("Wastewater Collection","Math & Calculations","pump run time",`A pump must remove ${volume} m3 at a constant ${rate} L/s. How long will it run?`,volume/(rate*0.06),"min","Time (min) = volume (m3) / [flow (L/s) x 0.06]",`${volume} / (${rate} x 0.06)`,"EPA_COLL",1,10);
for (const [dry,wet] of wwcCases.ii) addCalc("Wastewater Collection","Math & Calculations","wet-weather increase",`Average dry-weather flow is ${dry} ML/d and wet-weather flow is ${wet} ML/d. What is the percentage increase?`,(wet-dry)/dry*100,"%","Increase (%) = (wet flow - dry flow) / dry flow x 100",`(${wet} - ${dry}) / ${dry} x 100`,"EPA_COLL",1,25);
for (const [q,d] of wwcCases.velocity) addCalc("Wastewater Collection","Math & Calculations","force-main velocity",`A ${d} m inside-diameter force main carries ${q} m3/s. What is the average velocity?`,q/(Math.PI*d**2/4),"m/s","Velocity = flow / area; area = pi x diameter^2 / 4",`${q} / (pi x ${d}^2 / 4)`,"EPA_COLL",2,0.5);
for (const [usable,inflow,pump] of wwcCases.fill) addCalc("Wastewater Collection","Math & Calculations","wet-well fill time",`A wet well has ${usable} m3 of usable volume. Inflow is ${inflow} L/s while a small pump removes ${pump} L/s. How long will the usable volume take to fill?`,usable/((inflow-pump)*0.06),"min","Fill time = usable volume / net inflow; net m3/min = (inflow - pump) x 0.06",`${usable} / [(${inflow} - ${pump}) x 0.06]`,"EPA_COLL",1,10);

// Two capstone items per stream bring each stream to exactly 250 questions.
addQuestion({stream:"Water Treatment",module:"Ontario Regulations",topic:"operator responsibility",difficulty:"medium",stem:"An OIT notices that a required treatment-process check was missed. What is the best response?",correct:"report the missed check promptly, complete the approved response and document what occurred",distractors:["complete the next check early and note the omission only if that result is abnormal","estimate the missed result from adjacent readings and label the value as calculated","ask the next shift to repeat the check and assign that result to the missed interval"],explanation:"Operational records must accurately reflect the events that occurred. A missed required check should be escalated and handled under the facility's approved procedures rather than concealed or reconstructed.",source:"ON_CERT"});
addQuestion({stream:"Water Distribution",module:"Ontario Regulations",topic:"adverse condition response",difficulty:"hard",stem:"A verified distribution sample indicates a potentially adverse drinking-water condition. What should guide the operator's next actions?",correct:"the facility's approved adverse-condition procedure and applicable Ontario reporting requirements",distractors:["a customer-notification script used only after planned maintenance shutdowns","the routine flushing schedule for aesthetic complaints at dead-end water mains","the annual valve-exercising plan for maintaining distribution-system isolation"],explanation:"Potentially adverse drinking-water results require prompt action under the approved response and reporting framework. Routine maintenance programs do not replace that duty.",source:"ON_DW"});
addQuestion({stream:"Wastewater Treatment",module:"Ontario Regulations & Safety",topic:"operating records",difficulty:"medium",stem:"Why should an OIT record an abnormal process condition and the response taken at the time it occurs?",correct:"to preserve an accurate operational history for control, communication and compliance follow-up",distractors:["to replace all laboratory results with the operator's visual assessment of the process","to allow later shifts to change the original reading when conditions return to normal","to avoid notifying the operator in charge until the monthly report has been prepared"],explanation:"Contemporaneous records support safe process control, shift communication, troubleshooting and regulatory accountability. Entries should be factual and should not be rewritten to hide abnormal conditions.",source:"ON_WW"});
addQuestion({stream:"Wastewater Collection",module:"Ontario Regulations & Safety",topic:"safe work refusal",difficulty:"hard",stem:"A crew is asked to enter a sewer manhole, but the gas monitor has failed its bump test. What is the correct decision?",correct:"do not enter until suitable calibrated monitoring and all entry controls are available",distractors:["ventilate for a fixed period and use the failed monitor only to observe changing readings","proceed with supplied-air respiratory protection while the attendant records surface conditions","take a top-opening reading with the failed monitor and enter if the display remains stable"],explanation:"Confined-space entry depends on functioning, calibrated atmospheric monitoring and the complete entry system. Ventilation, respiratory protection or an unverified reading cannot replace required monitoring and entry controls.",source:"CCOHS_CS"});

addQuestion({stream:"Water Treatment",module:"Health & Safety",topic:"chemical response",difficulty:"hard",stem:"A sodium hypochlorite leak is discovered beside an incompatible acid-storage area. What is the safest first response?",correct:"isolate the area, prevent mixing and follow the facility's chemical emergency procedure",distractors:["approach from upwind and close the leaking valve before initiating the site alarm","move the adjacent acid containers first so routine hypochlorite cleanup can begin","start controlled dilution immediately and decide where the liquid will drain afterward"],explanation:"Hypochlorite and acids must be kept from mixing because toxic chlorine gas can be released. The area should be isolated and the approved emergency procedure followed.",source:"EPA_WATER"});
addQuestion({stream:"Water Distribution",module:"Health & Safety",topic:"public protection",difficulty:"medium",stem:"A hydrant-flushing operation sends water across a busy pedestrian route. What should the operator do?",correct:"control the discharge, protect the public and redirect flow to a safe approved location",distractors:["maintain the discharge and place one observer where pedestrians cross the flowing water","close the hydrant rapidly, then arrange a safer outlet before restarting the flushing work","finish the planned flushing volume before redirecting the discharge away from the route"],explanation:"Flushing must protect pedestrians, traffic, property and the distribution system. Discharge control and a safe outlet are part of the operating task.",source:"ON_DW"});
addQuestion({stream:"Wastewater Treatment",module:"Ontario Regulations & Safety",topic:"process upset escalation",difficulty:"hard",stem:"Effluent quality is deteriorating rapidly and the cause is not yet confirmed. What is the best OIT response?",correct:"notify the responsible operator, preserve accurate data and begin the approved upset-response procedure",distractors:["delay reporting until laboratory confirmation identifies a single definitive cause","change several process set points at once so at least one adjustment improves the effluent","record only the final stable readings so the operating log does not contain conflicting data"],explanation:"A rapidly developing upset requires prompt escalation, accurate records and controlled response. Simultaneous untracked changes can hide the cause and worsen the condition.",source:"ON_WW"});
addQuestion({stream:"Wastewater Collection",module:"Ontario Regulations & Safety",topic:"traffic control",difficulty:"medium",stem:"A blocked sewer must be accessed through a manhole in an active traffic lane. What must occur before the cover is removed?",correct:"establish the approved traffic-control zone and protect workers, road users and the open access",distractors:["park the service truck directly over the manhole and rely on its hazard lights alone","remove the cover first so the blockage can be assessed before traffic-control equipment is placed","ask the attendant to stand in the lane and wave vehicles around the unprotected work area"],explanation:"Roadway access work requires planned traffic control and protection before the manhole becomes an open hazard. Vehicle lights or an unprotected attendant are not substitutes.",source:"CCOHS_CS"});

if (questions.length !== 1000) throw new Error(`Expected 1000 questions, found ${questions.length}`);

const bankCounters = new Map();
for (const [globalIndex, question] of questions.entries()) {
  const bankSequence = bankCounters.get(question.bankKey) ?? 0;
  question.questionNum = 1001 + bankSequence;
  question.itemId = `OIT-${String(globalIndex + 1).padStart(4, "0")}`;
  bankCounters.set(question.bankKey, bankSequence + 1);
}

const outputDirectory = "content/oit/questions";
function hashSeed(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle(values, seed) {
  const shuffled = [...values];
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function longestRun(values) {
  let longest = 0;
  let current = 0;
  let previous = -1;
  for (const value of values) {
    current = value === previous ? current + 1 : 1;
    previous = value;
    longest = Math.max(longest, current);
  }
  return longest;
}

function answerPositions(count, bankKey) {
  const balanced = Array.from({ length: count }, (_, index) => index % 4);
  const initialSeed = hashSeed(`Echelon OIT 2026 ${bankKey}`);
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const candidate = seededShuffle(balanced, initialSeed + attempt);
    if (longestRun(candidate) <= 3 && candidate.some((value, index) => value !== index % 4)) {
      return candidate;
    }
  }
  throw new Error(`Could not create a non-patterned answer sequence for ${bankKey}`);
}

function distributeAnswerPositions(rows, bankKey) {
  const positions = answerPositions(rows.length, bankKey);
  return rows.map((question, rowIndex) => {
    const targetIndex = positions[rowIndex];
    const distractors = question.options.filter((_, optionIndex) => optionIndex !== question.correctIndex);
    const options = [...distractors];
    options.splice(targetIndex, 0, question.correctAnswer);
    return {
      ...question,
      options,
      optionA: options[0],
      optionB: options[1],
      optionC: options[2],
      optionD: options[3],
      correctIndex: targetIndex,
      correctAnswer: options[targetIndex],
    };
  });
}
const waterQuestions = distributeAnswerPositions(questions.filter(question => question.bankKey === "oit"), "oit");
const wastewaterQuestions = distributeAnswerPositions(questions.filter(question => question.bankKey === "oit-ww"), "oit-ww");
const BLUEPRINT = {
  "Water Treatment": { questionCount: 250, calculationCount: 48, difficulty: { easy: 50, medium: 134, hard: 66 } },
  "Water Distribution": { questionCount: 250, calculationCount: 48, difficulty: { easy: 50, medium: 135, hard: 65 } },
  "Wastewater Treatment": { questionCount: 250, calculationCount: 48, difficulty: { easy: 50, medium: 134, hard: 66 } },
  "Wastewater Collection": { questionCount: 250, calculationCount: 48, difficulty: { easy: 50, medium: 134, hard: 66 } },
};
await fs.mkdir(outputDirectory, { recursive: true });
await fs.writeFile(`${outputDirectory}/oit-water-500.json`, `${JSON.stringify(waterQuestions, null, 2)}\n`);
await fs.writeFile(`${outputDirectory}/oit-wastewater-500.json`, `${JSON.stringify(wastewaterQuestions, null, 2)}\n`);
await fs.writeFile("content/oit/manifest.json", `${JSON.stringify({
  version: "2026-08-28-v2",
  importMode: "additive",
  questionNumberRange: { start: 1001, end: 1500 },
  banks: [
    { bankKey: "oit", file: "questions/oit-water-500.json", expectedCount: 500 },
    { bankKey: "oit-ww", file: "questions/oit-wastewater-500.json", expectedCount: 500 },
  ],
  governance: {
    sourceReviewStatus: "unreviewed",
    databaseStagingStatus: "in_review",
    activation: "individual-admin-approval-required",
    historicalAttemptSafety: "additive question numbers preserve existing question identity",
  },
  blueprint: BLUEPRINT,
  examBasis: {
    title: SOURCES.ON_OIT.title,
    url: SOURCES.ON_OIT.url,
    verifiedAt: "2026-08-28",
    note: "OWWCO states that the OIT exam uses current Ontario content and consists of 40 general questions plus selectable Water Treatment, Water Distribution/Supply, Wastewater Treatment and Wastewater Collection modules. This package is an expanded practice pool, not a copy of an official examination form.",
  },
  sources: Object.values(SOURCES),
}, null, 2)}\n`);

export { questions, SOURCES };
