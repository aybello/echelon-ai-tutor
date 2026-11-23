#!/usr/bin/env python3
"""Generate per-course SPEC.md files for the exam-bank expansion build.

Each SPEC.md tells an authoring worker exactly what to write: schema variant
with a real example item, numbering, per-batch topic plan, source citations,
and the grounding excerpt from the game build's AUTHORING-BRIEF.md.
"""
import json, re
from pathlib import Path

ROOT = Path.home() / "workspace/echelon/exam-bank-expansion"
BRIEF = Path.home() / "workspace/echelon/game-content/AUTHORING-BRIEF.md"
BANKS = Path.home() / "workspace/echelon-ai-tutor/content"

EPA_SMALL = ("US EPA - Small Drinking Water Systems Handbook", "https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=100046K6.TXT")
EPA_SWTR = ("US EPA: Surface Water Treatment Rules \u2014 supporting treatment resources", "https://www.epa.gov/dwreginfo/surface-water-treatment-rules")
EPA_TURB = ("US EPA - Surface Water Treatment Rule Turbidity Guidance Manual", "https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P100ZLYM.TXT")
EPA_MWW = ("US EPA: Municipal Wastewater \u2014 supporting treatment resources", "https://www.epa.gov/npdes/municipal-wastewater")
EPA_WWOPS = ("US EPA - Resources for Wastewater Operators", "https://www.epa.gov/compliance/resources-wastewater-operators")
EPA_STARTUP = ("US EPA - Start-Up of Municipal Wastewater Treatment Facilities", "https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=00000IDV.TXT")
EPA_COLL = ("US EPA - Alternative Wastewater Collection Systems Manual", "https://nepis.epa.gov/Exe/ZyNET.exe?Index=Prior+to+1976&Query=&SearchMethod=1&FuzzyDegree=0&User=ANONYMOUS&Password=<redacted>&QField=pubnumber%5E%22625191024%22&UseQField=pubnumber&IntQFieldOp=1&ExtQFieldOp=0&Docs=")
EPA_CMOM = ("US EPA \u2014 CMOM Guide for Sanitary Sewer Collection Systems", "https://www.epa.gov/sites/default/files/2015-10/documents/cmom_guide_for_collection_systems.pdf")
EPA_EPANET = ("US EPA \u2014 EPANET hydraulic modelling", "https://www.epa.gov/water-research/epanet")
EPA_XCONN = ("US EPA \u2014 Cross-Connection Control Manual", "https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=2000262T.TXT")
WPI_FORMULA = ("WPI: formula/conversion tables", "https://gowpi.org/services/abc-testing/formula-conversion-tables/")
WPI_NTK = ("WPI: 2025 Need-to-Know criteria", "https://gowpi.org/services/2025-need-to-know-criteria/")
WPI_REFS = ("WPI: operator examination references \u2014 laboratory and treatment study resources", "https://gowpi.org/services/abc-testing/exam-references/")
REG170 = ("Ontario Regulation 170/03 - Drinking Water Systems", "https://www.ontario.ca/laws/regulation/030170")
REG129 = ("Ontario Regulation 129/04 - Licensing of Sewage Works Operators", "https://www.ontario.ca/laws/regulation/040129")
REG128 = ("Ontario Regulation 128/04 - Certification of Drinking Water System Operators", "https://www.ontario.ca/laws/regulation/040128")
CCOHS_CONF = ("Canadian Centre for Occupational Health and Safety - Confined Spaces", "https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/confinedspace_intro.html")
CCOHS_H2S = ("Canadian Centre for Occupational Health and Safety - Hydrogen Sulfide", "https://www.ccohs.ca/oshanswers/chemicals/chem_profiles/hydrogen_sulfide.html")
CCOHS_LOCK = ("CCOHS \u2014 Lockout/Tag out", "https://www.ccohs.ca/oshanswers/hsprograms/lockout.html")

# Topic pools. Each course gets 4 batches; each batch lists conceptual topics
# (40 items spread across them) and calc topics (10 items spread across them).
# Topics are plain strings; for multi-module courses the module is prefixed
# in [brackets] and the worker strips the brackets into the module field.

def T(b1, b2, b3, b4):
    return [b1, b2, b3, b4]

WATER_L1 = T(
    (["source-water assessment", "coagulation basics", "flocculation basics", "sedimentation basics", "rapid filtration", "chlorine disinfection", "storage and clear wells", "basic water chemistry"],
     ["detention time", "filter loading rate", "chlorine dose and demand", "flow conversion"]),
    (["intakes and screens", "jar testing awareness", "settled water quality", "filter media and underdrains", "CT concept", "pumps and pumping basics", "sampling points and methods", "turbidity and particle removal"],
     ["surface overflow rate", "pipe volume", "chemical feed mass", "head and pressure conversion"]),
    (["coagulant types and aids", "mixing and floc growth", "sludge blanket in clarifiers", "filter runs and backwash triggers", "chlorine residual management", "corrosion basics", "laboratory tests pH and alkalinity", "safety chemical handling"],
     ["backwash volume", "tank volume and turnover", "percent removal", "velocity in pipes"]),
    (["source protection awareness", "disinfection by-products awareness", "filter troubleshooting", "taste and odour basics", "iron and manganese awareness", "softening awareness", "record keeping and reporting", "operator duties and licensing"],
     ["solution strength and feed rate", "storage detention time", "pump run time", "chlorine demand calculation"]),
)
WATER_L2 = T(
    (["coagulation chemistry and alkalinity", "jar test dose selection", "tube and plate settlers", "dual media filtration", "CT with baffling factors", "breakpoint chlorination", "laboratory titrations", "chemical storage and handling"],
     ["CT calculation with baffling factor", "chemical feed with purity correction", "alkalinity consumption", "filter loading with cells out of service"]),
    (["lime soda ash softening", "iron and manganese oxidation", "sequestration", "corrosion control indices awareness", "membrane awareness", "pump curves and affinity laws", "filter run optimization", "raw water quality changes"],
     ["softening chemical demand with given factors", "affinity law flow and head", "backwash rate and volume", "chlorine decay style calculation"]),
    (["enhanced sedimentation performance", "filtration troubleshooting", "chloramine awareness", "disinfection by-product control", "particle counting awareness", "advanced sampling", "hardness and alkalinity analysis", "process trending"],
     ["detention time in series units", "solids mass rate to filters", "solution feed with strength correction", "pump energy with given efficiency"]),
    (["coagulation under cold water conditions", "filter ripening and turbidity spikes", "storage and distribution interface", "chemical spill response", "supervisory duties awareness", "regulation 170/03 class 2 duties", "emergency response awareness", "optimization studies"],
     ["overflow rate for larger works", "chlorine demand and dose", "tank turnover time", "percent removal across stages"]),
)
WATER_L3 = T(
    (["membrane systems flux and recovery", "ultrafiltration operation", "reverse osmosis awareness", "UV disinfection and dose", "advanced oxidation awareness", "enhanced coagulation for organics", "process mass balances", "filter performance analysis"],
     ["membrane flux and area with given values", "recovery and concentrate flow", "transmembrane pressure difference", "UV dose with given factors"]),
    (["disinfection strategy at plant scale", "CT management", "residuals management", "energy optimization awareness", "chemical optimization", "risk management and critical control points", "DWQMS awareness", "advanced laboratory QA"],
     ["multi-unit mass balance", "residuals volume and solids mass", "energy per volume with given efficiency", "chemical optimization quantity"]),
    (["membrane fouling and cleaning", "UV lamp aging and monitoring", "coagulation optimization trials", "filter optimization studies", "source water protection planning", "supervisory and ORO duties", "inspection readiness", "emergency leadership awareness"],
     ["contactor CT calculation", "membrane fleet capacity", "solids production forecast", "storage capacity planning quantity"]),
    (["advanced process troubleshooting", "water quality management programs", "capital planning awareness", "asset management awareness", "regulatory reporting leadership", "operator team supervision", "process auditing", "technology evaluation awareness"],
     ["whole plant chemical quantity", "energy benchmarking per volume", "recovery flow balance", "sampling program counts"]),
)
WATER_L4 = T(
    (["utility management and governance", "advanced treatment evaluation", "membrane fleet management", "UV system management at scale", "disinfection strategy leadership", "residuals strategy", "energy strategy", "DWQMS leadership and management review"],
     ["whole plant mass balance with given values", "membrane replacement quantity with given rates", "UV bank capacity with given factors", "energy benchmarking per volume"]),
    (["risk management at utility scale", "emergency leadership", "capital planning and asset strategy", "regulatory leadership", "inspection readiness leadership", "advanced laboratory quality systems", "chemical program management", "system wide optimization"],
     ["chemical program quantity with given unit rates", "residuals production forecast with given yields", "storage planning with peaking factors", "compliance sampling program counts"]),
    (["treatment technology selection studies", "pilot program leadership", "water quality strategy", "source protection at utility scale", "workforce and certification planning", "financial planning awareness quantities", "stakeholder communication leadership", "performance benchmarking"],
     ["capacity planning quantity with given growth factors", "energy per volume comparison", "membrane capacity balance", "program quantity with given rates"]),
    (["long term master planning awareness", "climate resilience awareness", "regulatory change management", "audit and management review", "succession and training leadership", "intermunicipal agreements awareness", "data driven decision making", "continuous improvement leadership"],
     ["whole utility water balance quantity", "chemical storage planning quantity", "residuals haulage quantity with given yields", "sampling program design counts"]),
)
WW_L1 = T(
    (["wastewater characteristics BOD and TSS", "screening", "grit removal", "primary clarification", "activated sludge basics", "trickling filters", "secondary clarifiers", "effluent disinfection basics"],
     ["BOD loading", "surface overflow rate", "percent removal", "flow conversion"]),
    (["influent sources and variability", "comminutors and bar screens", "primary sludge and scum", "aeration basics", "rotating biological contactors", "return activated sludge", "waste activated sludge", "sampling and lab basics"],
     ["clarifier detention time", "population equivalent mass load", "sludge volume index awareness", "chemical feed mass"]),
    (["preliminary treatment troubleshooting", "primary clarifier operation", "biological treatment troubleshooting", "dissolved oxygen basics", "settleability and SVI", "solids thickening basics", "digestion basics", "pumps and hydraulics for wastewater"],
     ["aeration tank detention", "F/M awareness calculation", "pump run time", "wet well fill time"]),
    (["effluent quality basics", "dewatering awareness", "safety confined spaces", "safety hydrogen sulfide", "lockout and tagout", "regulation 129/04 licensing awareness", "record keeping", "operator duties"],
     ["solids loading", "percent solids and mass", "flow and volume conversions", "removal efficiency across primary treatment"]),
)
WW_L2 = T(
    (["activated sludge process control", "solids retention time management", "F/M control", "wasting strategy", "nitrification fundamentals", "denitrification fundamentals", "alkalinity for nitrification", "dissolved oxygen control"],
     ["SRT calculation", "F/M calculation", "alkalinity requirement at 7.14 ratio", "oxygen requirement with given factors"]),
    (["aeration systems", "clarifier performance analysis", "effluent disinfection depth", "digester loading", "volatile solids reduction", "gas production awareness", "laboratory BOD quality", "microscopic examination awareness"],
     ["clarifier solids loading", "digester volatile solids loading", "percent volatile solids reduction", "WAS rate from mass balance"]),
    (["nutrient testing awareness", "phosphorus awareness", "process trending and instrumentation", "pumps and hydraulics depth", "sludge age management", "bulking and foaming troubleshooting", "rising sludge troubleshooting", "safety depth"],
     ["RAS rate from given values", "aeration detention and air supply awareness", "chemical feed for phosphorus with given factors", "percent removal across stages"]),
    (["regulation 129/04 class 2 duties", "supervisory awareness", "effluent compliance awareness", "solids processing optimization", "energy awareness in aeration", "odour control basics", "emergency response", "optimization trials"],
     ["solids inventory calculation", "detention and loading combined", "feed mass with purity correction", "flow weighted average concentration"]),
)
WW_L3 = T(
    (["advanced activated sludge control", "BNR optimization", "nitrification management", "denitrification management", "phosphorus removal awareness", "SRT and F/M at plant scale", "RAS and WAS optimization", "clarifier blanket management"],
     ["SRT with given inventory and wasting", "F/M ratio at plant scale", "SVI from settled volume and concentration", "clarifier solids loading"]),
    (["advanced effluent disinfection", "anaerobic digestion accounting", "aerobic digestion", "dewatering and cake production", "biosolids quantities", "effluent compliance management", "energy optimization", "process auditing"],
     ["digestion volatile solids reduction mass", "dewatering cake mass with given capture", "chemical feed with given ratios", "multi-unit mass balance"]),
    (["troubleshooting filamentous bulking", "troubleshooting nitrification loss", "supervisory and ORO duties", "regulatory inspections readiness", "optimization trial design", "laboratory quality systems", "safety leadership", "emergency leadership awareness"],
     ["nutrient mass balance", "alkalinity support chemical quantity", "solids production forecast", "aeration energy per volume"]),
    (["technology evaluation awareness", "capital planning awareness", "asset management awareness", "risk management", "effluent quality strategy", "data driven process decisions", "team supervision", "continuous improvement"],
     ["whole plant solids balance", "capacity planning with peaking factors", "sampling program counts", "chemical program quantity with given ratios"]),
)
WW_L4 = T(
    (["plant and utility management", "BNR strategy leadership", "whole plant mass balances", "whole plant energy balances", "biosolids strategy leadership", "effluent quality strategy", "compliance leadership", "resource recovery awareness"],
     ["whole plant solids balance with given values", "nutrient balance with given values", "biogas energy quantity with given factors", "aeration energy benchmarking"]),
    (["digestion and biogas management", "dewatering program leadership", "energy management programs", "process technology evaluation", "pilot program leadership", "capital planning and asset strategy", "risk and emergency leadership", "regulatory leadership"],
     ["biosolids production forecast with given yields", "capacity planning with peaking factors", "chemical program quantity with given ratios", "compliance sampling counts"]),
    (["inspection readiness leadership", "advanced laboratory quality management", "supervisory leadership", "workforce planning", "financial planning awareness quantities", "stakeholder communication", "performance benchmarking", "data systems for operations"],
     ["energy per mass removed with given values", "dewatering haulage quantity", "nutrient removal capacity quantity", "program quantity with given rates"]),
    (["long term planning awareness", "climate resilience awareness", "regulatory change management", "management review and audit", "succession leadership", "continuous improvement leadership", "interutility cooperation awareness", "innovation evaluation"],
     ["whole utility flow balance quantity", "solids forecast with given yields", "energy benchmarking comparison", "sampling program design counts"]),
)
DIST_MODS = ["General", "Processes", "Support Systems", "Administration"]
def dist_topics(level):
    pools = {
    1: T((["[General] mains and services", "[General] valves and hydrants", "[General] meters and service connections", "[Processes] chlorine residual maintenance", "[Processes] flushing programs", "[Support Systems] elevated storage", "[Support Systems] pressure and head", "[Administration] sampling in distribution"],
          ["pipe volume", "velocity from flow and area", "pressure from head at 9.81 kPa per m", "flow conversion"]),
         (["[General] cross-connection control", "[General] backflow prevention", "[Processes] dead ends and water age", "[Processes] leak detection awareness", "[Support Systems] booster pumps", "[Support Systems] standpipes and reservoirs", "[Administration] customer pressure complaints", "[General] main break response"],
          ["storage volume", "turnover time", "chlorine dose mass", "pump run time"]),
         (["[Processes] nitrification awareness", "[Processes] disinfection of repaired mains", "[General] hydrant operation and flow awareness", "[Support Systems] pressure zones awareness", "[Administration] record keeping", "[General] excavation safety awareness", "[Support Systems] tank inspection awareness", "[Processes] flushing volumes"],
          ["flushing volume at three pipe volumes", "hydrant flow awareness calculation", "residual decay awareness calculation", "tank drainage time"]),
         (["[Administration] regulation 170/03 distribution duties", "[General] service line materials awareness", "[Processes] water quality complaint response", "[Support Systems] SCADA awareness", "[General] traffic control awareness", "[Processes] storage mixing awareness", "[Administration] operator duties", "[Support Systems] energy awareness in pumping"],
          ["service flow conversion", "storage detention calculation", "chlorine feed quantity", "pressure zone head difference"]),
    ),
    2: T((["[General] hydraulic grade interpretation", "[Processes] pressure management and PRVs", "[Processes] district metered areas", "[Support Systems] pump curves and system curves", "[Support Systems] storage turnover management", "[Processes] nitrification monitoring and response", "[Administration] valve and hydrant programs", "[General] large meter testing awareness"],
          ["affinity law flow and head", "head loss from given unit rates", "night flow leakage volume", "storage turnover calculation"]),
         (["[Processes] flushing program design", "[General] break record analysis", "[Support Systems] mixing in storage", "[Processes] residual management programs", "[Administration] cross-connection program administration", "[General] asset condition awareness", "[Support Systems] energy in pumping", "[Processes] pressure zone management"],
          ["flushing design volume and velocity", "pump energy with given efficiency", "chlorine decay with given rates", "pressure zone head difference"]),
         (["[General] meter accuracy awareness", "[Processes] leakage step testing", "[Support Systems] elevated tank operations depth", "[Administration] sampling program administration", "[Processes] water age management", "[General] hydrant flow testing", "[Support Systems] booster station operations", "[Administration] emergency response awareness"],
          ["leakage volume from night flow", "tank volume and turnover", "dose mass with strength correction", "flow conversion at system scale"]),
         (["[Processes] disinfection of new mains", "[General] corrosion in distribution awareness", "[Support Systems] pressure transient awareness", "[Administration] regulation 170/03 class 2 duties", "[Processes] complaint investigation depth", "[General] service connection programs", "[Support Systems] reservoir operations", "[Administration] supervisory awareness"],
          ["zone demand with given peaking factors", "storage water age calculation", "booster dose quantity", "pump run time at system scale"]),
    ),
    3: T((["[Administration] multi-zone system management", "[Processes] system water quality management", "[Support Systems] elevated storage at system scale", "[Processes] residual maintenance strategy", "[General] water loss accounting awareness", "[Administration] sampling program design", "[Processes] adverse response at system scale", "[Support Systems] pumping energy management"],
          ["zone demand with peaking factors", "water loss audit percentage with given volumes", "pump energy and wire to water efficiency", "storage turnover and water age"]),
         (["[General] main break leadership", "[Administration] cross-connection program leadership", "[Processes] nitrification in storage response", "[Support Systems] pressure zone operations depth", "[Administration] asset management awareness", "[General] leak detection programs", "[Processes] flushing strategy at scale", "[Administration] ORO duties awareness"],
          ["flushing volume at system scale", "booster dosing with given rates", "pressure and head conversions", "sampling program counts"]),
         (["[Processes] water quality trending", "[Support Systems] storage inspection programs", "[Administration] capital planning awareness", "[General] emergency response leadership", "[Processes] chlorine decay management", "[Support Systems] SCADA and data systems", "[Administration] inspection readiness", "[General] hydrant and valve program leadership"],
          ["zone storage sizing quantity", "loss component quantity", "energy benchmarking per volume", "dose quantity with given factors"]),
         (["[Administration] regulatory leadership", "[Processes] system optimization studies", "[General] asset condition programs", "[Support Systems] energy strategy awareness", "[Administration] team supervision", "[Processes] complaint pattern analysis", "[General] renewal program awareness", "[Administration] continuous improvement"],
          ["demand forecast with given growth factors", "turnover program volume", "sampling schedule counts", "pump fleet energy quantity"]),
    ),
    4: T((["[Administration] distribution utility management", "[Processes] system wide water quality strategy", "[General] water loss strategy and audit leadership", "[Support Systems] pressure and storage strategy", "[Administration] asset management strategy", "[Processes] DWQMS leadership for distribution", "[General] risk management at utility scale", "[Administration] regulatory leadership"],
          ["system water balance quantity with given volumes", "zone demand forecast with given factors", "storage sizing quantity", "pump fleet energy benchmarking"]),
         (["[Support Systems] energy strategy for pumping", "[Administration] capital planning leadership", "[Processes] booster disinfection programs", "[General] emergency leadership", "[Administration] inspection readiness leadership", "[Processes] flushing and turnover programs", "[Support Systems] storage fleet management", "[Administration] ORO leadership"],
          ["booster program quantity with given factors", "flushing program volume", "sampling program design counts", "renewal quantity with given unit rates"]),
         (["[General] asset renewal strategy", "[Processes] water quality risk assessment", "[Administration] workforce planning", "[Support Systems] data and metering strategy", "[Processes] pressure management strategy", "[General] intermunicipal supply awareness", "[Administration] financial planning awareness", "[Processes] performance benchmarking"],
          ["loss component forecast quantity", "storage turnover strategy quantity", "energy per volume comparison", "program quantity with given rates"]),
         (["[Administration] long term master planning", "[Processes] climate resilience for distribution", "[General] regulatory change management", "[Administration] management review", "[Support Systems] technology evaluation", "[Processes] customer service strategy", "[General] succession leadership", "[Administration] continuous improvement leadership"],
          ["whole system balance quantity", "demand planning quantity", "renewal program forecast", "sampling program counts at utility scale"]),
    )}
    return pools[level]

COLL_MODS_CLASS1 = ["Monitor, Evaluate & Adjust Collection System", "Maintain & Restore Collection System", "Operate Equipment", "Evaluate & Maintain Equipment", "Maintain Lift Stations", "Security, Safety & Administrative Procedures"]
def coll_topics(level):
    pools = {
    1: T((["gravity sewers and manholes", "lift station components", "wet wells and level control", "force mains", "flow monitoring basics", "infiltration and inflow sources", "sewer cleaning methods", "safety confined space preparation"],
          ["flow conversion", "sewer slope from inverts", "pipe volume", "wet well fill time"]),
         (["CCTV inspection awareness", "blockage causes roots and FOG", "odour and hydrogen sulfide awareness", "spill and overflow response awareness", "CMOM principles", "jetting and flushing awareness", "manhole inspection basics", "traffic control awareness"],
          ["pipe velocity from continuity", "pump run time and cycles", "force main velocity", "infiltration rate per length"]),
         (["lift station alarms and response", "pump types for wastewater", "gas testing before entry", "night flow analysis awareness", "cleaning production awareness", "defect vocabulary basics", "reporting duties", "regulation 129/04 awareness"],
          ["wet well drawdown time", "force main detention time", "percent of capacity with given full flow", "cleaning length and production rate"]),
         (["collection system mapping awareness", "private side sources awareness", "emergency response basics", "equipment care and checks", "safety lockout", "record keeping", "operator duties", "public interaction awareness"],
          ["flow and volume conversions", "slope and velocity combined", "pump capacity check", "inflow volume with given rates"]),
    ),
    2: T((["CMOM program development", "condition assessment programs", "CCTV defect interpretation", "manhole assessment", "rehabilitation methods CIPP", "pipe bursting and slip lining", "flow monitoring analysis", "rainfall dependent I&I"],
          ["I&I rate calculation", "RDII volume with given coefficients", "rehabilitation quantity liner length and area", "cleaning completion percentage"]),
         (["I&I reduction programs", "lift station reliability analysis", "force main management", "air release programs", "odour and sulfide corrosion management", "FOG programs depth", "private side source programs", "emergency response planning"],
          ["wet well and pump capacity analysis", "slope and velocity with given areas", "surcharge storage volume", "unit rate quantity calculation"]),
         (["basin comparison analysis", "step testing for I&I awareness", "lateral rehabilitation awareness", "spot repairs", "grate and cover programs", "asset data management", "regulatory reporting depth", "supervisory awareness"],
          ["infiltration per hectare calculation", "pump cycle analysis", "rehab area quantity", "program completion forecast"]),
         (["regulation 129/04 class 2 duties", "safety program depth", "contractor coordination awareness", "public notification programs", "odour complaint response", "corrosion protection awareness", "energy awareness lift stations", "optimization of cleaning programs"],
          ["flow weighted quantities", "detention in force mains", "storage volume in surcharged pipe", "cost style quantity with given rates"]),
    ),
    3: T((["collection system management at scale", "CMOM leadership", "I&I reduction program design", "RDII analysis depth", "lift station system management", "force main reliability programs", "odour and corrosion programs", "FOG program leadership"],
          ["I&I rate at system scale", "RDII volume with given coefficients", "peaking factor and design flow", "wet well cycling analysis"]),
         (["sewer rehabilitation program planning", "prioritization methods awareness", "overflow and bypass response leadership", "reporting leadership", "asset management awareness", "capital planning awareness", "ORO duties awareness", "emergency leadership"],
          ["rehabilitation quantities liner and grout", "cleaning and CCTV completion percentages", "surcharge storage volume", "odour chemical dosing with given rates"]),
         (["capacity analysis at system scale", "flow monitoring program leadership", "condition grading programs", "data driven decisions", "regulatory inspections readiness", "safety leadership", "team supervision", "technology evaluation awareness"],
          ["capacity planning with given factors", "force main velocity and detention", "program production rates", "unit rate quantities"]),
         (["long term I&I strategy", "climate resilience awareness", "regulatory change management", "management review", "succession leadership", "continuous improvement", "stakeholder communication", "performance benchmarking"],
          ["system flow accounting quantity", "rehab program forecast quantity", "storage quantity with given values", "sampling and monitoring counts"]),
    ),
    4: T((["collection utility management", "CMOM leadership at utility scale", "I&I strategy and evaluation", "lift station asset strategy", "force main asset strategy", "odour and corrosion asset protection", "overflow risk management", "regulatory leadership"],
          ["system flow and infiltration accounting", "RDII program effectiveness quantity", "capacity planning with peaking and growth factors", "lift station fleet energy quantity"]),
         (["rehabilitation and renewal strategy", "capital planning leadership", "asset management strategy", "risk and emergency leadership", "ORO leadership", "inspection readiness leadership", "workforce planning", "financial planning awareness quantities"],
          ["rehabilitation program quantity with given rates", "cleaning and CCTV planning counts", "odour control program quantity", "surcharge risk storage quantity"]),
         (["data strategy for collection assets", "technology evaluation leadership", "performance benchmarking", "regulatory reporting leadership", "public communication leadership", "energy strategy for lift stations", "climate resilience planning", "master planning awareness"],
          ["program forecast with given rates", "fleet reliability quantity", "flow balance quantity", "monitoring program counts"]),
         (["long term strategy", "regulatory change leadership", "management review and audit", "succession leadership", "continuous improvement leadership", "intermunicipal cooperation awareness", "innovation evaluation", "governance awareness"],
          ["whole system accounting quantity", "capacity forecast quantity", "renewal forecast quantity", "program quantity with given rates"]),
    )}
    return pools[level]

REG169 = ("Ontario Regulation 169/03 - Ontario Drinking Water Quality Standards", "https://www.ontario.ca/laws/regulation/030169")

OIT_WATER_BATCHES = T(
    (["[Water Treatment] source-water assessment", "[Water Treatment] coagulation process", "[Water Treatment] rapid filtration", "[Disinfection] chlorine disinfection", "[Water Quality & Sampling] turbidity measurement", "[Hydraulics] head and pressure", "[Health & Safety] chemical handling safety", "[Ontario Regulations] drinking water regulation basics"],
     ["detention time", "filter loading rate", "chlorine dose and demand", "flow conversion"]),
    (["[Water Treatment] sedimentation", "[Water Treatment] flocculation", "[Chemical Feed & Storage] chemical storage", "[Pumping Systems] pump types and operation", "[Water Quality & Sampling] sampling methods", "[Disinfection] CT value", "[Hydraulics] pipe flow and velocity", "[Ontario Regulations] operator certification"],
     ["pipe volume", "percent removal", "solution feed rate", "storage detention time"]),
    ([], []),
    ([], []),
)
OIT_WW_BATCHES_A = T(
    ([], []),
    ([], []),
    (["[Wastewater Characteristics & Sources] biochemical oxygen demand", "[Preliminary & Primary Treatment] screening and grit removal", "[Secondary & Biological Treatment] activated sludge basics", "[Wastewater Collection Systems] sewers and manholes", "[Pumping & Hydraulics] lift stations", "[Ontario Regulations & Safety] confined space safety", "[Lab & Monitoring] wastewater sampling", "[Solids Handling & Biosolids] sludge thickening"],
     ["BOD loading", "surface overflow rate", "percent removal", "flow conversion"]),
    (["[Secondary & Biological Treatment] trickling filters and RBCs", "[Disinfection & Effluent Quality] effluent disinfection", "[Nutrient Removal & Advanced Treatment] nutrient removal awareness", "[Wastewater Collection Systems] infiltration and inflow", "[Pumping & Hydraulics] wet wells and pumps", "[Ontario Regulations & Safety] sewage works licensing", "[Lab & Monitoring] settleability and SVI", "[Solids Handling & Biosolids] digestion basics"],
     ["F/M ratio awareness", "sludge volume index", "wet well fill time", "pump run time"]),
)
OIT_WW_BATCHES_B = T(
    (["[Wastewater Characteristics & Sources] COD, TSS and pH effects", "[Preliminary & Primary Treatment] screen types and grit channels", "[Preliminary & Primary Treatment] primary sludge and scum handling", "[Wastewater Collection Systems] force mains", "[Pumping & Hydraulics] pump performance awareness", "[Ontario Regulations & Safety] hydrogen sulfide safety", "[Lab & Monitoring] dissolved oxygen measurement", "[Solids Handling & Biosolids] dewatering awareness"],
     ["solids loading", "clarifier detention time", "removal efficiency", "volume conversion"]),
    (["[Secondary & Biological Treatment] aeration control", "[Secondary & Biological Treatment] secondary clarifier operation", "[Secondary & Biological Treatment] return and waste sludge control", "[Disinfection & Effluent Quality] chlorine contact and effluent quality", "[Nutrient Removal & Advanced Treatment] ammonia awareness", "[Wastewater Collection Systems] CCTV inspection awareness", "[Lab & Monitoring] composite sampling", "[Wastewater Characteristics & Sources] industrial discharge awareness"],
     ["aeration detention time", "return sludge rate awareness", "chlorine dose mass", "sewer velocity"]),
    (["[Secondary & Biological Treatment] foaming and bulking awareness", "[Disinfection & Effluent Quality] ultraviolet disinfection awareness", "[Solids Handling & Biosolids] anaerobic digestion and gas awareness", "[Wastewater Collection Systems] lift station alarms", "[Pumping & Hydraulics] force main velocity", "[Ontario Regulations & Safety] spill reporting duties", "[Lab & Monitoring] BOD test awareness", "[Wastewater Characteristics & Sources] flow variability"],
     ["sludge age awareness", "percent solids and mass", "wet well drawdown time", "average flow calculation"]),
    (["[Secondary & Biological Treatment] plant start-up awareness", "[Disinfection & Effluent Quality] effluent compliance basics", "[Solids Handling & Biosolids] biosolids handling", "[Wastewater Collection Systems] odour control", "[Pumping & Hydraulics] pumping energy awareness", "[Ontario Regulations & Safety] lockout and tagout", "[Lab & Monitoring] laboratory quality control awareness", "[Ontario Regulations & Safety] operator licensing classes"],
     ["mass loading calculation", "combined detention calculation", "chemical feed mass", "multi-stage percent removal"]),
)

WQA_BATCHES = T(
    (["[Sampling & Sample Handling] sampling program design", "[Sampling & Sample Handling] sample preservation", "[Sampling & Sample Handling] holding times", "[Sampling & Sample Handling] chain of custody", "[Microbiological Analysis] total coliform methods awareness", "[Microbiological Analysis] E. coli methods awareness", "[Bench Chemistry] pH measurement", "[Bench Chemistry] turbidity measurement"],
     ["sample bottle planning counts", "dilution factor calculation", "holding time scheduling arithmetic", "result averaging"]),
    (["[Bench Chemistry] chlorine residual analysis", "[Bench Chemistry] alkalinity titration", "[Bench Chemistry] hardness analysis", "[Bench Chemistry] colour and metals awareness", "[Calibration & Quality Control] calibration standards", "[Calibration & Quality Control] blanks and duplicates", "[Calibration & Quality Control] matrix spikes awareness", "[Calibration & Quality Control] control charts awareness"],
     ["standard preparation quantity", "percent recovery calculation", "relative percent difference", "reagent preparation quantity"]),
    (["[Data Quality & Reporting] result calculation and review", "[Data Quality & Reporting] adverse result duties awareness", "[Data Quality & Reporting] reporting timelines awareness", "[Laboratory Safety] chemical hygiene and PPE", "[Laboratory Safety] housekeeping and waste", "[Regulations & Certification] regulation 169/03 standards awareness", "[Regulations & Certification] regulation 170/03 sampling context", "[Regulations & Certification] analyst certificate context 128/04"],
     ["diluted result calculation", "summary statistics with given data", "sample count planning", "unit conversion for bench results"]),
    (["[Microbiological Analysis] result interpretation", "[Microbiological Analysis] quality control for microbiology", "[Bench Chemistry] instrument calibration checks", "[Calibration & Quality Control] data quality review", "[Sampling & Sample Handling] adverse sampling response awareness", "[Data Quality & Reporting] record retention awareness", "[Laboratory Safety] emergency procedures awareness", "[Regulations & Certification] sampling schedule duties"],
     ["percent recovery with paired values", "average and range calculation", "bottle and volume planning", "dilution series calculation"]),
)

def C(key, bank, variant, track, level, family, itemfmt, itemstart, segments, batches, sources, modules, dest, dedup):
    return dict(key=key, bankKey=bank, variant=variant, track=track, level=level,
                family=family, itemFmt=itemfmt, itemStart=itemstart, segments=segments,
                batches=batches, sources=sources, modules=modules, dest=dest, dedup=dedup)

def seg(batches, label, qnbase):
    return dict(batches=batches, label=label, qnBase=qnbase)

WATER_MODS = ["Treatment Process", "Laboratory Analysis", "Equipment O&M", "Source Water", "Safety & Admin"]
WW_MODS = ["Treatment Process Evaluation & Adjustment", "Equipment Evaluation, Maintenance & Operation", "Safety & Admin", "Laboratory Analysis"]
COLL_MODS_GEN = ["Collection System Components", "Equipment Operation & Maintenance", "Lift Station Operation and Maintenance", "Collection System Monitoring & Evaluation", "Safety & Regulations"]
WQA_MODS = ["Sampling & Sample Handling", "Microbiological Analysis", "Bench Chemistry", "Calibration & Quality Control", "Data Quality & Reporting", "Laboratory Safety", "Regulations & Certification"]

SRC_ON_WATER = [EPA_SMALL, EPA_SWTR, EPA_TURB, REG170, CCOHS_CONF, WPI_FORMULA]
SRC_ON_WW = [EPA_MWW, EPA_WWOPS, EPA_STARTUP, REG129, CCOHS_H2S, WPI_FORMULA]
SRC_ON_DIST = [EPA_EPANET, EPA_XCONN, EPA_SMALL, REG170, CCOHS_CONF, WPI_NTK]
SRC_ON_COLL = [EPA_CMOM, EPA_COLL, REG129, CCOHS_CONF, CCOHS_H2S, WPI_NTK]
SRC_WPI_WATER = [EPA_SMALL, EPA_SWTR, WPI_NTK, WPI_FORMULA, WPI_REFS, CCOHS_CONF]
SRC_WPI_WW = [EPA_MWW, EPA_WWOPS, WPI_NTK, WPI_FORMULA, CCOHS_H2S]
SRC_WPI_DIST = [EPA_EPANET, EPA_XCONN, WPI_NTK, WPI_FORMULA, CCOHS_CONF]
SRC_WPI_COLL = [EPA_CMOM, EPA_COLL, WPI_NTK, CCOHS_CONF, CCOHS_H2S]

B = "content/"
COURSES = [
    C("oit", "oit", "oit", "oit", 0, "ontario", "OIT-%04d", 1001,
      [seg([1, 2], "oit-water bank additions (content/oit/questions/oit-water-500.json)", 1501),
       seg([3, 4], "oit-wastewater bank additions (content/oit/questions/oit-wastewater-500.json)", 1501)],
      OIT_WATER_BATCHES[:2] + OIT_WW_BATCHES_A[2:], [EPA_SMALL, EPA_SWTR, EPA_TURB, REG170, REG128, CCOHS_CONF, WPI_FORMULA, EPA_WWOPS, EPA_COLL, EPA_STARTUP, REG129, CCOHS_H2S],
      ["Water Treatment", "Disinfection", "Water Quality & Sampling", "Chemical Feed & Storage", "Hydraulics", "Ontario Regulations", "Pumping Systems", "Health & Safety", "Math & Calculations", "Wastewater Characteristics & Sources", "Preliminary & Primary Treatment", "Secondary & Biological Treatment", "Disinfection & Effluent Quality", "Nutrient Removal & Advanced Treatment", "Solids Handling & Biosolids", "Wastewater Collection Systems", "Pumping & Hydraulics", "Ontario Regulations & Safety", "Lab & Monitoring", "Math & Calculations"],
      "content/oit/questions/oit-water-500.json (100 new) and content/oit/questions/oit-wastewater-500.json (100 new)",
      ["oit/questions/oit-water-500.json", "oit/questions/oit-wastewater-500.json"]),
    C("oit-ww", "oit-ww", "oit", "oit", 0, "ontario", "OIT-%04d", 1201,
      [seg([1, 2, 3, 4], "oit-wastewater bank additions (content/oit/questions/oit-wastewater-500.json)", 1601)],
      OIT_WW_BATCHES_B, [EPA_WWOPS, EPA_COLL, EPA_STARTUP, REG129, CCOHS_H2S, CCOHS_CONF, WPI_FORMULA],
      ["Wastewater Characteristics & Sources", "Preliminary & Primary Treatment", "Secondary & Biological Treatment", "Disinfection & Effluent Quality", "Nutrient Removal & Advanced Treatment", "Solids Handling & Biosolids", "Wastewater Collection Systems", "Pumping & Hydraulics", "Ontario Regulations & Safety", "Lab & Monitoring", "Math & Calculations"],
      "content/oit/questions/oit-wastewater-500.json (200 new, wastewater stream)",
      ["oit/questions/oit-wastewater-500.json"]),
    C("class1-water", "class1-water", "treat", "water-treatment", 1, "ontario", "WATER-TREATMENT-L1-%03d", 251,
      [seg([1, 2, 3, 4], "class1-water bank additions (content/class1-treatment/questions/water-250.json)", 2251)],
      WATER_L1, SRC_ON_WATER, ["Water Treatment"],
      "content/class1-treatment/questions/water-250.json", ["class1-treatment/questions/water-250.json"]),
    C("class1-ww", "class1-wastewater", "treat", "wastewater-treatment", 1, "ontario", "WASTEWATER-TREATMENT-L1-%03d", 251,
      [seg([1, 2, 3, 4], "class1-wastewater bank additions (content/class1-treatment/questions/wastewater-250.json)", 2251)],
      WW_L1, SRC_ON_WW, ["Wastewater Treatment"],
      "content/class1-treatment/questions/wastewater-250.json", ["class1-treatment/questions/wastewater-250.json"]),
    C("class1-water-dist", "class1-water-dist", "net", "water-distribution", 1, "ontario", "DISTRIBUTION-L1-%03d", 251,
      [seg([1, 2, 3, 4], "class1-water-dist bank additions (content/class1-networks/questions/distribution-250.json)", 2251)],
      dist_topics(1), SRC_ON_DIST, DIST_MODS,
      "content/class1-networks/questions/distribution-250.json", ["class1-networks/questions/distribution-250.json"]),
    C("class1-wastewater-coll", "class1-wastewater-coll", "net", "wastewater-collection", 1, "ontario", "COLLECTION-L1-%03d", 251,
      [seg([1, 2, 3, 4], "class1-wastewater-coll bank additions (content/class1-networks/questions/collection-250.json)", 2251)],
      coll_topics(1), SRC_ON_COLL, COLL_MODS_CLASS1,
      "content/class1-networks/questions/collection-250.json", ["class1-networks/questions/collection-250.json"]),
]

def std_course(key, bank, variant, track, level, family, pools, sources, modules, dest, dedup):
    prefix = {"water-treatment": "WATER-TREATMENT", "wastewater-treatment": "WASTEWATER-TREATMENT",
              "water-distribution": "DISTRIBUTION", "wastewater-collection": "COLLECTION"}[track]
    return C(key, bank, variant, track, level, family, f"{prefix}-L{level}-%03d", 251,
             [seg([1, 2, 3, 4], f"{bank} bank additions", 2251)], pools, sources, modules, dest, dedup)

for lvl, pool in [(2, WATER_L2), (3, WATER_L3), (4, WATER_L4)]:
    COURSES.append(std_course(f"class{lvl}-water", f"class{lvl}-water", "treat", "water-treatment", lvl, "ontario",
                              pool, SRC_ON_WATER, WATER_MODS, f"class{lvl}-water bank (bankKey class{lvl}-water)",
                              ["class2-2026-09-23/class2-water-250-drafts.json"] if lvl == 2 else []))
for lvl, pool in [(2, WW_L2), (3, WW_L3), (4, WW_L4)]:
    COURSES.append(std_course(f"class{lvl}-ww", f"class{lvl}-wastewater", "treat", "wastewater-treatment", lvl, "ontario",
                              pool, SRC_ON_WW, WW_MODS, f"class{lvl}-wastewater bank (bankKey class{lvl}-wastewater)",
                              ["class2-2026-09-23/class2-wastewater-250-drafts.json"] if lvl == 2 else []))
for lvl in (2, 3, 4):
    COURSES.append(std_course(f"class{lvl}-water-dist", f"class{lvl}-water-dist", "cand" if lvl == 3 else "net",
                              "water-distribution", lvl, "ontario", dist_topics(lvl), SRC_ON_DIST, DIST_MODS,
                              f"class{lvl}-water-dist bank (bankKey class{lvl}-water-dist)",
                              ["class2-2026-09-23/class2-water-dist-250-drafts.json"] if lvl == 2 else
                              (["class3-water-dist/candidate-250-2026-09-22.json"] if lvl == 3 else [])))
for lvl in (2, 3, 4):
    COURSES.append(std_course(f"class{lvl}-wastewater-coll", f"class{lvl}-wastewater-coll", "net",
                              "wastewater-collection", lvl, "ontario", coll_topics(lvl), SRC_ON_COLL, COLL_MODS_GEN,
                              f"class{lvl}-wastewater-coll bank (bankKey class{lvl}-wastewater-coll)",
                              ["class2-2026-09-23/class2-wastewater-coll-250-drafts.json"] if lvl == 2 else []))
COURSES.append(C("wqa", "wqa", "treat", "water-quality", 4, "ontario", "WQA-%03d", 251,
                 [seg([1, 2, 3, 4], "wqa bank additions", 2251)], WQA_BATCHES,
                 [WPI_REFS, REG169, REG170, REG128, EPA_SMALL, CCOHS_CONF], WQA_MODS,
                 "wqa bank (bankKey wqa)", []))
for lvl, pool in [(1, WATER_L1), (2, WATER_L2), (3, WATER_L3), (4, WATER_L4)]:
    COURSES.append(std_course(f"wpi-class{lvl}-water", f"wpi-class{lvl}-water", "treat", "water-treatment", lvl, "western",
                              pool, SRC_WPI_WATER, WATER_MODS, f"wpi-class{lvl}-water bank (bankKey wpi-class{lvl}-water)", []))
for lvl, pool in [(1, WW_L1), (2, WW_L2), (3, WW_L3), (4, WW_L4)]:
    COURSES.append(std_course(f"wpi-class{lvl}-wastewater", f"wpi-class{lvl}-wastewater", "treat", "wastewater-treatment", lvl, "western",
                              pool, SRC_WPI_WW, WW_MODS, f"wpi-class{lvl}-wastewater bank (bankKey wpi-class{lvl}-wastewater)", []))
for lvl in (1, 2, 3, 4):
    COURSES.append(std_course(f"wpi-class{lvl}-water-dist", f"wpi-class{lvl}-water-dist", "net", "water-distribution", lvl, "western",
                              dist_topics(lvl), SRC_WPI_DIST, DIST_MODS, f"wpi-class{lvl}-water-dist bank (bankKey wpi-class{lvl}-water-dist)", []))
for lvl in (1, 2, 3, 4):
    COURSES.append(std_course(f"wpi-class{lvl}-water-coll", f"wpi-class{lvl}-water-coll", "net", "wastewater-collection", lvl, "western",
                              coll_topics(lvl), SRC_WPI_COLL, COLL_MODS_GEN, f"wpi-class{lvl}-water-coll bank (bankKey wpi-class{lvl}-water-coll)", []))
