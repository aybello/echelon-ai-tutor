# Authoring brief for deep game task workers

Read FORMAT.md in this folder first. It is the contract. This brief adds the
course grounding and the working rules. No em dashes anywhere.

## Ground rules

- Canadian units only (L, m3, kg, mg/L, kPa, m of head), Canadian context:
  Ontario Regulation 170/03, 128/04, 129/04 where regulations are relevant,
  OWWCO for Ontario courses, WPI Need-to-Know for western courses.
- Every task is original fictional study content, like the pilots. Do not
  copy exam questions. Facts, process orders, and calculation methods follow
  the sources the course bank already cites (Spellman, Handbook of Water and
  Wastewater Treatment Plant Operations, 3rd ed., is the pilots' cited
  textbook; the banks also cite US EPA manuals and Ontario regulations).
- Numbers must work out cleanly: choose inputs so results are exact decimals
  with at most 4 decimal places, no rounding ambiguity. State "Enter the
  exact unrounded number" style prompts like the pilots when the result is
  exact.
- Text limits: prompt and assumptions 1..2000 chars; labels and corrected
  lines max 300 chars; every text field non-blank.
- Options: 3 or 4 per choice step (schema allows 2..8). Labels must be
  distinct even after case and whitespace normalization. Distractors must be
  plausible but unambiguously wrong.
- Every task: revision "r1", level per course ("oit" for the OIT course,
  "class1" for classed courses in this build, see FORMAT.md section 5).
- topicId: kebab-case safe id naming the topic, matching the bank's topic
  vocabulary for the course where one exists.

## Calculation tasks: mandatory computation records

For every calculation-ladder task, append one record to the course verify
file: {"taskId": id, "expression": "...", "unit": expectedUnitId}. The
expression uses only numbers, + - * / parentheses, and must evaluate in
exact rational arithmetic to the task's expected value after applying the
named unit's toExpected conversion factor (identity when unit equals the
expected unit). Example: {"taskId":"oit-ladder05","expression":"25*4",
"unit":"L"} for 25 L/min over 4 min equals 100 L.

For every find-calculation-error task, append {"taskId": id, "expression":
"...", "expectedValue": "..."} where the expression recomputes the corrected
line's governing value and expectedValue is that value as a decimal string.

Unit conversions in unitOptions use exact rationals: for example a value in
min converts to h with toExpected {"numerator":"1","denominator":"60"}.
Include at least one non-expected unit WITH a correct toExpected factor in
most ladder tasks, plus one or two distractor units with no factor, mirroring
the pilot style but exercising conversions more than the pilots did.

## Verification

Before reporting done, run:
python3 ~/workspace/echelon/game-content/tools/verify_tasks.py <your tasks file> <course verify file>
It must print ALL CHECKS PASSED for your file. Fix and rerun until it does.
Note: the verify file is cumulative for the course; when checking only your
own new tasks, the checker will also demand records for any other calc tasks
in the file you pass it, so pass it a file containing only your tasks plus
the course verify file that includes the pilot records and yours.

## OIT course grounding (from content/oit banks in the repo)

Registry courseKey "oit" is Ontario OIT (water). Its sibling registry entry
"oit-ww" shares the OIT level for wastewater. This build's oit folder covers
the OIT level across both streams, as the pilot does (pilot topics span
water treatment; extend across wastewater too, matching the two banks).

Water bank modules (489 questions): Water Treatment 99, Water Quality and
Sampling 104, Hydraulics 101, Math and Calculations 96, Disinfection 32,
Health and Safety 20, Chemical Feed and Storage 15, Pumping Systems 12,
Ontario Regulations 10. Frequent topics: chlorine demand, chemical mass,
detention time, filter loading rate, CT value, head and pressure, pipe
volume, pipe velocity, flow conversion, storage detention, turbidity
removal, coagulation, source-water assessment.

Wastewater bank modules (483 questions): Wastewater Collection Systems 110,
Math and Calculations 94, Secondary and Biological Treatment 72, Pumping
and Hydraulics 47, Ontario Regulations and Safety 40, Preliminary and
Primary Treatment 36, Wastewater Characteristics and Sources 23, Lab and
Monitoring 19, Solids Handling and Biosolids 16, Disinfection and Effluent
Quality 15, Nutrient Removal and Advanced Treatment 11. Frequent topics:
BOD removal, BOD loading, sludge volume index, solids retention time,
food-to-microorganism ratio, aeration detention, sewer slope, pipe volume,
pump run time, wet-well fill time, force-main velocity, screening, grit
removal.

Bank sources to cite in task source lists: US EPA Small Drinking Water
Systems Handbook; Ontario Regulation 170/03; US EPA Surface Water Treatment
Rule Turbidity Guidance Manual; US EPA Alternative Wastewater Collection
Systems Manual; US EPA Resources for Wastewater Operators; US EPA Start-Up
of Municipal Wastewater Treatment Facilities; Ontario Regulations 128/04 and
129/04; CCOHS confined spaces and hydrogen sulfide guidance; Spellman
Handbook (pilot citations).

## Class 1 Water grounding

Bank structure sampled from content/class1-water/questions (batch files,
40 questions each). Modules seen: Filtration, Disinfection, Coagulation and
Flocculation, Sedimentation, Hydraulics, Chemical Feed and Dosing, Water
Distribution, Water Quality and Regulations, Water Sources and Quality,
Pumps and Hydraulics, Safety, Sampling and Laboratory, Instrumentation and
Control, Iron and Manganese Removal, Softening. Topics seen: corrosion
control, flocculation control, detention time, chemical dosage, filter run
termination, surface overflow rate, filter maintenance problems, CT
calculation, contact time and baffling, solution strength, residual
maintenance, jar testing, backwash volume, breakpoint chlorination,
post-precipitation, chlorine demand, disinfection by-products, sludge
management, taste and odour, air binding.

Pilot topics: coagulation-flocculation, filtration headloss and loading,
hydraulics detention time (single and parallel cells), conventional train,
particle removal, pretreatment flocculation, settled water, sedimentation
troubleshooting, solids mass rate, water chemistry and colour. Extend across
the Class 1 water treatment scope: sources and intake, coagulation,
flocculation, sedimentation, filtration, disinfection and CT, storage,
pumps, basic chemistry (pH, alkalinity, hardness), sampling and lab basics,
safety, Ontario drinking water regulations at an introductory level.

## Class 1 Wastewater Treatment grounding (courseKey class1-ww)

Destination bank in the repo: class1-wastewater, authored in
content/class1-treatment (250 wastewater candidates: 200 conceptual and
50 worked calculations, alongside the Class 1 Water set). Scope for this
build: wastewater characteristics (BOD, TSS, pH), preliminary treatment
(screening, grit), primary clarification, secondary and biological
treatment at an introductory level (activated sludge basics, trickling
filters, rotating biological contactors, aeration, secondary clarifiers,
return and waste activated sludge), disinfection of effluent, solids
handling (thickening, digestion basics, dewatering awareness), sampling
and laboratory basics (BOD, TSS, DO, pH, settleability, SVI awareness),
pumps and hydraulics for wastewater, safety (confined spaces, hydrogen
sulfide, lockout), and Ontario Regulation 129/04 licensing awareness at
an introductory level. Calculation vocabulary: BOD and solids loading,
population equivalent style mass loads, clarifier surface overflow rate
and detention, aeration tank detention and F/M awareness, sludge volume
index, percent removal, chemical feed mass, pump and wet-well timing,
flow conversions. Id prefix for this course: c1ww (c1ww-ladder01..100,
c1ww-process01..100, c1ww-error01..100, c1ww-evidence01..100,
c1ww-mission01..100). Level: "class1". Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), US EPA
Municipal Wastewater resources, US EPA Start-Up of Municipal Wastewater
Treatment Facilities, OWWCO exam preparation resources, WPI 2025
Need-to-Know criteria, Ontario Regulation 129/04, CCOHS safety guidance.

## Class 1 Water Distribution grounding (courseKey class1-water-dist)

Destination bank in the repo: class1-water-dist, authored in
content/class1-networks (250 distribution candidates: 200 conceptual and
50 worked calculations, alongside the Class 1 Collection set). Scope for
this build: distribution system components (mains, valves, hydrants,
service connections, meters), storage (elevated tanks, standpipes,
ground reservoirs, turnover and water age), pressure and hydraulics
(head and pressure, velocity, friction loss awareness, flow measurement),
distribution pumps and booster stations, water quality in the system
(chlorine residual maintenance, flushing programs, dead ends, nitrification
awareness), cross-connection control and backflow prevention, leak
detection, main break response and disinfection awareness for new and
repaired mains, sampling in distribution, customer pressure and flow
complaints at an introductory level, safety (traffic control awareness,
excavation awareness, confined spaces in chambers and tanks), and Ontario
Regulation 170/03 distribution context at an introductory level.
Calculation vocabulary: pipe volume and velocity, flow conversions,
storage volume and turnover time, chlorine dose mass and residual decay
awareness, pressure from head (use 9.81 kPa per metre of head), pump run
times, flushing volumes (three pipe volumes awareness), hydrant flow
awareness. Id prefix for this course: c1wd (c1wd-ladder01..100,
c1wd-process01..100, c1wd-error01..100, c1wd-evidence01..100,
c1wd-mission01..100). Level: "class1". Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), US EPA Small
Drinking Water Systems Handbook, US EPA Cross-Connection Control Manual,
EPANET hydraulics background, OWWCO exam preparation resources, WPI
Distribution Class I criteria, Ontario Regulation 170/03, CCOHS safety
guidance.

## Class 1 Wastewater Collection grounding (courseKey class1-wastewater-coll)

Destination bank in the repo: class1-wastewater-coll, authored in
content/class1-networks (250 collection candidates: 200 conceptual and
50 worked calculations, alongside the Class 1 Distribution set). Scope
for this build: gravity sewers and manholes, lift stations and wet
wells, force mains, flow monitoring and metering, infiltration and
inflow (sources, measurement, night flow analysis), sewer cleaning
(flushing, rodding, jetting awareness, bucket machines), CCTV inspection
awareness and defect vocabulary at an introductory level, blockages
(roots, fats oils and grease, debris, structural defects), odour and
hydrogen sulfide and corrosion awareness, sewer safety (confined space
entry preparation, gas testing, traffic control), CMOM style management,
operation and maintenance principles, spill and overflow response
awareness and reporting, and Ontario licensing context under Regulation
129/04 at an introductory level. Calculation vocabulary: flow
conversions, sewer slope from invert elevations, pipe volume and
velocity from continuity, wet well fill and drawdown times, pump run
time and cycles, force main velocity and detention, infiltration rates
per length and per hectare style calculations, percent of capacity
awareness with given full flow values. Id prefix for this course: c1wc
(c1wc-ladder01..100, c1wc-process01..100, c1wc-error01..100,
c1wc-evidence01..100, c1wc-mission01..100). Level: "class1". Sources:
Spellman Handbook of Water and Wastewater Treatment Plant Operations
(3rd ed.), US EPA CMOM Guide for collection systems, US EPA Alternative
Wastewater Collection Systems Manual, OWWCO exam preparation resources,
WPI Collection Class I criteria, Ontario Regulation 129/04, CCOHS
safety guidance.

## Class 2 Water Treatment grounding (courseKey class2-water)

No dedicated bank folder exists in the repo for Class 2; the closest
matching bank structure is content/class1-water (modules listed in the
Class 1 Water grounding above), deepened to the Class 2 scope in the
OWWCO and WPI Need-to-Know progression. Scope for this build: everything
in Class 1 Water at greater depth, plus coagulation chemistry
(alkalinity consumption, jar test dose selection), enhanced sedimentation
(tube and plate settlers), filtration design and operation (dual media,
filtration and backwash rates, filter run optimization, slow sand
awareness), disinfection (CT calculations with baffling factors,
breakpoint chlorination curves, chloramine awareness), lime soda ash
softening with clean stoichiometry, iron and manganese oxidation and
sequestration, corrosion control indices awareness, membrane awareness
at an introductory level, hydraulics (head loss awareness, pump curves
and affinity laws with clean ratios), advanced sampling and laboratory
(alkalinity and hardness titrations, turbidity and particle awareness),
storage and distribution interface, safety and chemical handling at
greater depth, and Ontario Regulation 170/03 at the Class 2 level.
Calculation vocabulary: CT with baffling factor, chemical feed with
purity and solution strength corrections, softening chemical demands
with given factors, affinity law flow, head and power, backwash volumes
and rates, filter loading with multiple cells out of service, detention
and overflow rates for larger works, chlorine demand and decay style
calculations. Id prefix for this course: c2w (c2w-ladder01..100,
c2w-process01..100, c2w-error01..100, c2w-evidence01..100,
c2w-mission01..100). Level: "class1" (placeholder per FORMAT.md section
5; the contract has no class2 level value yet, and this mapping is
recorded in the course BUILD-NOTES). Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), US EPA
Surface Water Treatment Rule guidance, US EPA Small Drinking Water
Systems Handbook, OWWCO exam preparation resources, WPI 2025
Need-to-Know criteria for Water Treatment Class II, Ontario Regulation
170/03, CCOHS safety guidance.

## Class 2 Wastewater Treatment grounding (courseKey class2-ww)

No dedicated bank folder exists in the repo for Class 2; the closest
matching bank structure is content/class1-treatment (the class1-wastewater
bank), deepened to the Class 2 scope in the OWWCO and WPI Need-to-Know
progression. Scope for this build: everything in Class 1 Wastewater at
greater depth, plus activated sludge process control (solids retention
time, food to microorganism ratio, sludge age management, wasting
strategy), nutrient removal awareness (nitrification and denitrification
fundamentals, alkalinity consumption at 7.14 mg as CaCO3 per mg of
ammonia nitrogen oxidized, phosphorus awareness), aeration systems and
dissolved oxygen control, clarifier performance analysis, effluent
disinfection at greater depth, solids processing (digester loading,
volatile solids reduction, gas production awareness), laboratory analysis
at greater depth (BOD seed and dilution quality, nutrient testing
awareness, microscopic examination awareness), pumps and hydraulics at
greater depth, instrumentation and process trending, safety at greater
depth, and Ontario Regulation 129/04 at the Class 2 level. Calculation
vocabulary: SRT and sludge age, F/M, oxygen requirements with given
factors, aeration detention and air supply awareness, clarifier solids
loading, WAS and RAS rates from mass balances with given values,
digester volatile solids loading and percent reduction, alkalinity
requirements for nitrification, chemical feed for phosphorus or
disinfection with given factors, percent removal across multiple stages.
Id prefix for this course: c2ww (c2ww-ladder01..100, c2ww-process01..100,
c2ww-error01..100, c2ww-evidence01..100, c2ww-mission01..100). Level:
"class1" (placeholder per FORMAT.md section 5; the contract has no
class2 level value yet, and this mapping is recorded in the course
BUILD-NOTES). Sources: Spellman Handbook of Water and Wastewater
Treatment Plant Operations (3rd ed.), US EPA Municipal Wastewater
resources, US EPA nutrient and process control guidance, OWWCO exam
preparation resources, WPI 2025 Need-to-Know criteria for Wastewater
Treatment Class II, Ontario Regulation 129/04, CCOHS safety guidance.

## Class 2 Water Distribution grounding (courseKey class2-water-dist)

No dedicated bank folder exists in the repo for Class 2; the closest
matching bank structure is content/class1-networks (the class1-water-dist
bank), deepened to the Class 2 scope in the OWWCO and WPI Need-to-Know
progression. Scope for this build: everything in Class 1 Distribution at
greater depth, plus distribution hydraulics analysis (head loss from
given unit loss rates, pump curves and affinity laws, system curves
awareness), pressure management (district pressure zones, PRV programs),
storage operations at greater depth (turnover management, mixing
awareness, inspection programs), water quality management (residual
management programs, nitrification monitoring and response, flushing
program design), leakage management (district metered areas, minimum
night flow analysis, step testing), asset condition awareness (valve
and hydrant programs, break records analysis), metering at greater
depth (large meter testing, accuracy curves awareness), cross-connection
control program administration awareness, energy awareness in pumping,
and Ontario Regulation 170/03 at the Class 2 level. Calculation
vocabulary: affinity laws, head loss from given metres per 100 metres
rates, storage turnover and water age style calculations with given
values, night flow and leakage volumes, chlorine dose and decay style
calculations with given rates, flushing design volumes and velocities
with given pipe areas, pump energy with given efficiency, pressure zone
head differences. Avoid Hazen-Williams and exponential decay numerics;
use given unit rates and factors so every result is an exact decimal.
Id prefix for this course: c2wd (c2wd-ladder01..100, c2wd-process01..100,
c2wd-error01..100, c2wd-evidence01..100, c2wd-mission01..100). Level:
"class1" (placeholder per FORMAT.md section 5; the contract has no
class2 level value yet, and this mapping is recorded in the course
BUILD-NOTES). Sources: Spellman Handbook of Water and Wastewater
Treatment Plant Operations (3rd ed.), US EPA Small Drinking Water
Systems Handbook, US EPA Cross-Connection Control Manual, EPANET
hydraulics background, OWWCO exam preparation resources, WPI
Distribution Class II criteria, Ontario Regulation 170/03, CCOHS
safety guidance.

## Class 2 Wastewater Collection grounding (courseKey class2-wastewater-coll)

No dedicated bank folder exists in the repo for Class 2; the closest
matching bank structure is content/class1-networks (the
class1-wastewater-coll bank), deepened to the Class 2 scope in the
OWWCO and WPI Need-to-Know progression. Scope for this build: everything
in Class 1 Collection at greater depth, plus CMOM program development,
condition assessment programs (CCTV defect interpretation, manhole
assessment, condition grading awareness in generic terms),
rehabilitation methods awareness (cured in place lining, pipe bursting,
slip lining, spot repairs, lateral rehabilitation awareness), flow
monitoring program analysis (basin comparisons, rainfall dependent
infiltration and inflow with given values), infiltration and inflow
reduction programs, lift station reliability and capacity analysis,
force main management and air release programs, odour and sulfide
corrosion management with given generation factors, fats oils and grease
programs at greater depth, private side sources awareness, emergency
response planning, and Ontario Regulation 129/04 at the Class 2 level.
Calculation vocabulary: infiltration and inflow rates and rainfall
dependent inflow volumes with given coefficients, rehabilitation
quantities (liner lengths and areas with given dimensions), cleaning
and CCTV program production and completion percentages, wet well and
pump capacity analysis, slope and velocity with given areas, surcharge
and storage volume style calculations with given values, cost style
unit rate calculations with given rates (quantities only, no pricing
advice). Id prefix for this course: c2wc (c2wc-ladder01..100,
c2wc-process01..100, c2wc-error01..100, c2wc-evidence01..100,
c2wc-mission01..100). Level: "class1" (placeholder per FORMAT.md
section 5; the contract has no class2 level value yet, and this mapping
is recorded in the course BUILD-NOTES). Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), US EPA CMOM
Guide for collection systems, US EPA Alternative Wastewater Collection
Systems Manual, OWWCO exam preparation resources, WPI Collection
Class II criteria, Ontario Regulation 129/04, CCOHS safety guidance.

## Class 3 Water Treatment grounding (courseKey class3-water)

The repo holds a partial Class 3 structure (content/class3-water-dist
exists for distribution; no Class 3 treatment bank folder), so the
closest matching bank structure is content/class1-water deepened through
the Class 2 build to the Class 3 scope in the OWWCO and WPI
Need-to-Know progression. Scope for this build: advanced treatment
process design and optimization awareness, membrane systems (micro and
ultrafiltration, reverse osmosis awareness) with given flux, recovery
and pressure values, ultraviolet and advanced oxidation awareness with
given dose factors, process mass balances across multiple units,
advanced coagulation and enhanced organics removal, filter performance
analysis and optimization, disinfection strategy and CT management at
plant scale, residuals management, energy and chemical optimization
awareness, risk management and critical control point awareness,
Drinking Water Quality Management Standard awareness at a general level,
advanced laboratory and quality assurance, supervisory and overall
responsible operator duties awareness, and Ontario Regulation 170/03
at the Class 3 level. Calculation vocabulary: membrane flux and area
requirements with given values, recovery and concentrate flows,
transmembrane pressure differences, UV dose with given intensity and
time style factors, multi-unit mass balances, chemical optimization
quantities, residuals volumes and solids masses, energy per volume with
given efficiencies, advanced CT and contactor calculations. Use given
values and factors so every result is an exact decimal; no exponential
or logarithmic numerics. Id prefix for this course: c3w
(c3w-ladder01..100, c3w-process01..100, c3w-error01..100,
c3w-evidence01..100, c3w-mission01..100). Level: "class1" (placeholder
per FORMAT.md section 5; the contract has no class3 level value yet,
and this mapping is recorded in the course BUILD-NOTES). Sources:
Spellman Handbook of Water and Wastewater Treatment Plant Operations
(3rd ed.), US EPA membrane and UV guidance background, US EPA Surface
Water Treatment Rule guidance, OWWCO exam preparation resources, WPI
2025 Need-to-Know criteria for Water Treatment Class III, Ontario
Regulation 170/03, Ontario Drinking Water Quality Management Standard
(general awareness), CCOHS safety guidance.

## Class 3 Wastewater Treatment grounding (courseKey class3-ww)

The repo holds no Class 3 wastewater treatment bank folder, so the
closest matching bank structure is content/class1-treatment (the bank
used for class1-ww), deepened through the Class 2 build to the Class 3
scope in the OWWCO and WPI Need-to-Know progression. Scope for this
build: advanced activated sludge process control and troubleshooting,
biological nutrient removal optimization (nitrification and
denitrification management, phosphorus removal awareness), solids
retention time and food to microorganism control at plant scale with
given values, return and waste sludge optimization, secondary clarifier
solids loading and blanket management, advanced disinfection of effluent,
anaerobic and aerobic digestion loading and volatile solids accounting
with given factors, dewatering and biosolids quantities, effluent
quality and compliance management, energy optimization awareness,
process auditing and optimization trials, supervisory and overall
responsible operator duties awareness, and Ontario Regulation 129/04 at
the Class 3 level. Calculation vocabulary: solids retention time and
mean cell residence style calculations with given inventory and wasting
values, food to microorganism ratios, sludge volume index from given
settled volume and concentration, clarifier solids and hydraulic
loading, digestion volatile solids loading and reduction masses with
given percentages, dewatering solids capture and cake masses with given
factors, chemical feed for nutrient and alkalinity support with given
ratios, multi-unit mass balances across the liquid and solids trains.
Use given values and factors so every result is an exact decimal; no
exponential or logarithmic numerics. Id prefix for this course: c3ww
(c3ww-ladder01..100, c3ww-process01..100, c3ww-error01..100,
c3ww-evidence01..100, c3ww-mission01..100). Level: "class1" (placeholder
per FORMAT.md section 5; the contract has no class3 level value yet,
and this mapping is recorded in the course BUILD-NOTES). Sources:
Spellman Handbook of Water and Wastewater Treatment Plant Operations
(3rd ed.), US EPA municipal wastewater resources, US EPA process
control and nutrient removal guidance, OWWCO exam preparation
resources, WPI 2025 Need-to-Know criteria for Wastewater Treatment
Class III, Ontario Regulation 129/04, CCOHS safety guidance.

## Class 3 Water Distribution grounding (courseKey class3-water-dist)

The repo holds a partial Class 3 distribution structure
(content/class3-water-dist), and the closest complete matching bank
structure is content/class1-networks (the bank used for
class1-water-dist), deepened through the Class 2 build to the Class 3
scope in the OWWCO and WPI Need-to-Know progression. Scope for this
build: large and multi-zone distribution system management, pressure
zone and elevated storage operations at system scale, system water
quality management (residual maintenance, nitrification awareness in
storage, turnover management), regulatory sampling program design and
adverse response at system scale, advanced leak detection and water
loss accounting with given audit values, main break and emergency
response leadership, cross connection control program administration,
asset management and capital planning awareness, energy management for
pumping, supervisory and overall responsible operator duties awareness,
and Ontario Regulation 170/03 at the Class 3 level. Calculation
vocabulary: zone demand and peaking calculations with given factors,
storage volume, turnover and water age style calculations with given
values, pump energy and wire to water efficiency with given values,
water loss audit components and percentages with given volumes,
chlorine decay and booster dosing with given rates (no exponential
numerics; use given per day factors), pressure and head conversions,
flushing volumes and velocities with given dimensions, sampling program
counts and schedules. Use given values and factors so every result is
an exact decimal; no exponential or logarithmic numerics and no
Hazen-Williams. Id prefix for this course: c3wd (c3wd-ladder01..100,
c3wd-process01..100, c3wd-error01..100, c3wd-evidence01..100,
c3wd-mission01..100). Level: "class1" (placeholder per FORMAT.md
section 5; the contract has no class3 level value yet, and this mapping
is recorded in the course BUILD-NOTES). Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), US EPA
Small Drinking Water Systems Handbook, US EPA Cross-Connection Control
Manual, US EPA EPANET and manual, OWWCO exam preparation resources,
WPI Water Distribution Class III Need-to-Know Criteria, Ontario
Regulation 170/03, CCOHS safety guidance.

## Class 3 Wastewater Collection grounding (courseKey class3-wastewater-coll)

The repo holds no Class 3 collection bank folder, so the closest
matching bank structure is content/class1-networks (the bank used for
class1-wastewater-coll), deepened through the Class 2 build to the
Class 3 scope in the OWWCO and WPI Need-to-Know progression. Scope for
this build: collection system management at system scale, capacity,
management, operations and maintenance (CMOM style) program leadership,
infiltration and inflow reduction program design and effectiveness
analysis with given values, rainfall dependent infiltration and inflow
analysis, lift station and force main system management and reliability
programs, odour and sulfide corrosion management programs with given
generation and dosing factors, fats oils and grease program leadership,
sewer rehabilitation program planning and prioritization, overflow and
bypass response leadership and reporting, asset management and capital
planning awareness, supervisory and overall responsible operator duties
awareness, and Ontario Regulation 129/04 at the Class 3 level.
Calculation vocabulary: infiltration and inflow rates and rainfall
dependent inflow volumes with given coefficients, peaking factor and
design flow calculations with given factors, wet well cycling and pump
capacity analysis with given values, force main velocity and detention
time with given dimensions, rehabilitation quantities (liner lengths,
areas and grout volumes with given dimensions), cleaning and CCTV
program production and completion percentages, surcharge and storage
volume style calculations with given values, chemical dosing for odour
control with given rates, cost style unit rate calculations with given
rates (quantities only, no pricing advice). Use given values and
factors so every result is an exact decimal; no exponential or
logarithmic numerics. Id prefix for this course: c3wc
(c3wc-ladder01..100, c3wc-process01..100, c3wc-error01..100,
c3wc-evidence01..100, c3wc-mission01..100). Level: "class1" (placeholder
per FORMAT.md section 5; the contract has no class3 level value yet,
and this mapping is recorded in the course BUILD-NOTES). Sources:
Spellman Handbook of Water and Wastewater Treatment Plant Operations
(3rd ed.), US EPA CMOM Guide for collection systems, US EPA Alternative
Wastewater Collection Systems Manual, OWWCO exam preparation resources,
WPI Wastewater Collection Class III Need-to-Know Criteria, Ontario
Regulation 129/04, CCOHS safety guidance.

## Class 4 Water Treatment grounding (courseKey class4-water)

The repo holds no Class 4 bank folder, so the closest matching bank
structure is content/class1-water, deepened through the Class 2 and
Class 3 builds to the Class 4 scope in the OWWCO and WPI Need-to-Know
progression. Class 4 is the senior Ontario level: scope is plant and
utility management, advanced treatment process evaluation and design
review awareness, system wide optimization, membrane and ultraviolet
system management at utility scale, disinfection strategy leadership,
residuals and energy strategy, Drinking Water Quality Management
Standard leadership and management review, risk management and
emergency leadership at utility scale, capital planning and asset
strategy awareness, regulatory leadership and inspection readiness,
advanced laboratory and quality system management, and Ontario
Regulation 170/03 at the Class 4 level. Calculation vocabulary:
whole plant mass and energy balances with given values, membrane fleet
capacity, recovery and replacement quantity calculations with given
rates, ultraviolet bank capacity and dose pacing with given factors,
chemical program cost style quantities with given unit rates
(quantities only, no pricing advice), residuals production forecasts
with given yields, energy benchmarking per volume with given values,
storage and capacity planning quantities with given peaking factors,
compliance sampling program counts. Use given values and factors so
every result is an exact decimal; no exponential or logarithmic
numerics. Id prefix for this course: c4w (c4w-ladder01..100,
c4w-process01..100, c4w-error01..100, c4w-evidence01..100,
c4w-mission01..100). Level: "class1" (placeholder per FORMAT.md
section 5; the contract has no class4 level value yet, and this mapping
is recorded in the course BUILD-NOTES). Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), US EPA
membrane and UV guidance background, US EPA Surface Water Treatment
Rule guidance, OWWCO exam preparation resources, WPI 2025 Need-to-Know
criteria for Water Treatment Class IV, Ontario Regulation 170/03,
Ontario Drinking Water Quality Management Standard, CCOHS safety
guidance.

## Class 4 Wastewater Treatment grounding (courseKey class4-ww)

The repo holds no Class 4 wastewater bank folder, so the closest
matching bank structure is content/class1-treatment (the bank used for
class1-ww), deepened through the Class 2 and Class 3 builds to the
Class 4 scope in the OWWCO and WPI Need-to-Know progression. Class 4 is
the senior Ontario level: scope is plant and utility management,
advanced biological nutrient removal strategy and optimization
leadership, whole plant mass and energy balance evaluation, biosolids
strategy and program leadership, effluent quality strategy and
compliance leadership, energy management and resource recovery
awareness with given values, process technology evaluation and pilot
program leadership, capital planning and asset strategy awareness,
risk management and emergency leadership at utility scale, regulatory
leadership and inspection readiness, advanced laboratory and quality
system management, supervisory and overall responsible operator
leadership, and Ontario Regulation 129/04 at the Class 4 level.
Calculation vocabulary: whole plant solids and nutrient balances with
given values, nutrient removal capacity and chemical program quantities
with given ratios, digestion and biogas energy quantities with given
factors, dewatering and biosolids production forecasts with given
yields, aeration energy benchmarking per volume and per mass removed
with given values, capacity planning quantities with given peaking
factors, compliance sampling program counts. Use given values and
factors so every result is an exact decimal; no exponential or
logarithmic numerics. Id prefix for this course: c4ww
(c4ww-ladder01..100, c4ww-process01..100, c4ww-error01..100,
c4ww-evidence01..100, c4ww-mission01..100). Level: "class1" (placeholder
per FORMAT.md section 5; the contract has no class4 level value yet,
and this mapping is recorded in the course BUILD-NOTES). Sources:
Spellman Handbook of Water and Wastewater Treatment Plant Operations
(3rd ed.), US EPA municipal wastewater resources, US EPA process
control and nutrient removal guidance, OWWCO exam preparation
resources, WPI 2025 Need-to-Know criteria for Wastewater Treatment
Class IV, Ontario Regulation 129/04, CCOHS safety guidance.

## Class 4 Water Distribution grounding (courseKey class4-water-dist)

The repo holds a partial Class 3 distribution structure but no Class 4
bank, so the closest complete matching bank structure is
content/class1-networks (the bank used for class1-water-dist),
deepened through the Class 2 and Class 3 builds to the Class 4 scope
in the OWWCO and WPI Need-to-Know progression. Class 4 is the senior
Ontario level: scope is distribution utility management, system wide
water quality strategy, water loss strategy and audit leadership with
given values, pressure and storage strategy at system scale, asset
management strategy and capital planning leadership, Drinking Water
Quality Management Standard leadership for distribution operations,
risk management and emergency leadership at utility scale, regulatory
leadership and inspection readiness, energy strategy for pumping,
supervisory and overall responsible operator leadership, and Ontario
Regulation 170/03 at the Class 4 level. Calculation vocabulary: system
water balance and loss component quantities with given volumes, zone
demand forecasting with given growth and peaking factors, storage
sizing and turnover strategy quantities with given values, pump fleet
energy benchmarking with given values, booster disinfection program
quantities with given factors, flushing and turnover program volumes,
sampling program design counts, renewal program quantities with given
unit rates (quantities only, no pricing advice). Use given values and
factors so every result is an exact decimal; no exponential or
logarithmic numerics and no Hazen-Williams. Id prefix for this course:
c4wd (c4wd-ladder01..100, c4wd-process01..100, c4wd-error01..100,
c4wd-evidence01..100, c4wd-mission01..100). Level: "class1" (placeholder
per FORMAT.md section 5; the contract has no class4 level value yet,
and this mapping is recorded in the course BUILD-NOTES). Sources:
Spellman Handbook of Water and Wastewater Treatment Plant Operations
(3rd ed.), US EPA Small Drinking Water Systems Handbook, US EPA
Cross-Connection Control Manual, US EPA EPANET and manual, OWWCO exam
preparation resources, WPI Water Distribution Class IV Need-to-Know
Criteria, Ontario Regulation 170/03, CCOHS safety guidance.

## Class 4 Wastewater Collection grounding (courseKey class4-wastewater-coll)

The repo holds no Class 4 collection bank folder, so the closest
matching bank structure is content/class1-networks (the bank used for
class1-wastewater-coll), deepened through the Class 2 and Class 3
builds to the Class 4 scope in the OWWCO and WPI Need-to-Know
progression. Class 4 is the senior Ontario level: scope is collection
utility management, capacity, management, operations and maintenance
(CMOM style) program leadership at utility scale, infiltration and
inflow strategy and long term reduction program evaluation with given
values, lift station and force main asset strategy, odour and corrosion
asset protection strategy, overflow risk management and regulatory
leadership, rehabilitation and renewal strategy and capital planning
leadership, asset management strategy, risk management and emergency
leadership at utility scale, supervisory and overall responsible
operator leadership, and Ontario Regulation 129/04 at the Class 4
level. Calculation vocabulary: system flow and infiltration accounting
with given values, rainfall dependent inflow program effectiveness
quantities with given coefficients, capacity planning quantities with
given peaking and growth factors, lift station fleet energy and
reliability quantities with given values, rehabilitation program
quantities and completion forecasts with given unit rates (quantities
only, no pricing advice), cleaning and CCTV program planning counts,
odour control program quantities with given rates, surcharge risk and
storage quantities with given values. Use given values and factors so
every result is an exact decimal; no exponential or logarithmic
numerics. Id prefix for this course: c4wc (c4wc-ladder01..100,
c4wc-process01..100, c4wc-error01..100, c4wc-evidence01..100,
c4wc-mission01..100). Level: "class1" (placeholder per FORMAT.md
section 5; the contract has no class4 level value yet, and this mapping
is recorded in the course BUILD-NOTES). Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), US EPA CMOM
Guide for collection systems, US EPA Alternative Wastewater Collection
Systems Manual, OWWCO exam preparation resources, WPI Wastewater
Collection Class IV Need-to-Know Criteria, Ontario Regulation 129/04,
CCOHS safety guidance.

## Water Quality Analyst grounding (courseKey wqa)

The registry entry is "Water Quality Analyst (WQA)", track
"water-quality", classLevel 4, questionBankKey "wqa": this is Ontario's
laboratory analyst certification, a distinct scope from the operator
classes, and the repo holds no dedicated wqa bank folder. Per the
build rule, this course proceeds on the closest matching existing
structure, the laboratory, sampling and water quality topic structure
inside content/class1-water and the treatment banks, and the scope
decision is recorded in the course BUILD-NOTES. Scope for this build:
drinking water sampling programs and sample handling (collection,
preservation, holding times, chain of custody), microbiological
analysis awareness (total coliform and E. coli methods and result
interpretation), bench chemistry analyses (pH, turbidity, chlorine
residual, alkalinity, hardness, colour, metals awareness), calibration
and quality control (standards, blanks, duplicates, spikes, control
charts awareness), result calculation and data quality review,
reporting and adverse result duties awareness, laboratory safety and
housekeeping, and the Ontario Drinking Water Quality Standards
(Regulation 169/03), Regulation 170/03 sampling context, and the
Regulation 128/04 analyst certificate context at a general level.
Calculation vocabulary: dilution factors and diluted result
calculations with given values, standard and reagent preparation
quantities with given concentrations, percent recovery and relative
percent difference with given paired values, result averaging and
summary statistics with given data sets, sample counts and bottle
planning, holding time and scheduling arithmetic, bench result unit
conversions. Use given values and factors so every result is an exact
decimal; no exponential or logarithmic numerics (pH is treated as a
measured scale value, never calculated from hydrogen ion
concentration). Id prefix for this course: wqa (wqa-ladder01..100,
wqa-process01..100, wqa-error01..100, wqa-evidence01..100,
wqa-mission01..100). Level: "class1" (placeholder per FORMAT.md
section 5; the contract has no wqa level value yet, and this mapping
is recorded in the course BUILD-NOTES). Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), OWWCO exam
preparation resources, Ontario Regulation 169/03, Ontario Regulation
170/03, Ontario Regulation 128/04, US EPA drinking water laboratory
quality assurance guidance, CCOHS laboratory safety guidance.

## WPI Class 1 Water Treatment grounding (courseKey wpi-class1-water)

This is the first course in the WPI (western) family. The grounding
criteria are the WPI 2025 Need-to-Know Criteria for Water Treatment
Class I, applied in a western Canadian context (the WPI family serves
the western provinces). The closest matching bank structure in the
repo is content/class1-water, transposed from the Ontario framing to
the WPI Class I scope: water sources and protection awareness,
coagulation, flocculation and sedimentation basics, filtration basics,
disinfection basics and chlorine residual management, basic water
chemistry and sampling, pumps and equipment basics, safety, and
operator duties at the Class I level, including cold climate operation
awareness common to western Canadian systems. Regulation framing must
stay generic and accurate: refer to provincial drinking water
requirements and the provincial regulator in general terms, and to the
Guidelines for Canadian Drinking Water Quality as the federal
guideline reference. Do NOT cite Ontario regulations in WPI courses,
and do NOT invent provincial regulation numbers or section references.
Calculation vocabulary mirrors the Class 1 water build: detention
time, surface loading, filter rates, chlorine dose, demand and
residual, chemical feed quantities with given strengths, tank volumes,
pump and flow conversions, percent removal with given values. Use
given values and factors so every result is an exact decimal; no
Hazen-Williams and no exponential or logarithmic numerics. Id prefix
for this course: wp1w (wp1w-ladder01..100, wp1w-process01..100,
wp1w-error01..100, wp1w-evidence01..100, wp1w-mission01..100). Level:
"class1" (per FORMAT.md the level enum holds "oit" and "class1" only;
class1 is the natural value for this Class I course and the courseKey
allowlist extension is recorded in the course BUILD-NOTES). Sources:
Spellman Handbook of Water and Wastewater Treatment Plant Operations
(3rd ed.), WPI 2025 Need-to-Know Criteria for Water Treatment Class I,
Health Canada Guidelines for Canadian Drinking Water Quality, US EPA
Small Drinking Water Systems Handbook, US EPA Surface Water Treatment
Rule guidance (background), CCOHS safety guidance.

## WPI Class 2 Water Treatment grounding (courseKey wpi-class2-water)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Water Treatment Class II, in a western Canadian context. The closest
matching bank structure in the repo is content/class1-water, deepened
from the WPI Class 1 build to the Class II scope: CT calculations with
baffling factors, chemical feed corrected for purity and solution
strength, jar test interpretation and coagulation optimization, lime
soda ash softening awareness with given values, pump affinity laws
with given ratios (squares and cubes of given ratios are exact),
enhanced sedimentation and filtration performance analysis, iron and
manganese treatment, disinfection strategy basics, laboratory QA/QC,
process troubleshooting, and operator supervisory awareness at the
Class II level, including cold climate operation. Regulation framing
stays generic: provincial drinking water requirements in general terms
and the Guidelines for Canadian Drinking Water Quality as the federal
reference. Do NOT cite Ontario regulations, and do NOT invent
provincial regulation numbers. Calculation vocabulary mirrors the
Class 2 water build with given values and factors so every result is
an exact decimal; no Hazen-Williams and no exponential or logarithmic
numerics. Id prefix for this course: wp2w (wp2w-ladder01..100,
wp2w-process01..100, wp2w-error01..100, wp2w-evidence01..100,
wp2w-mission01..100). Level: "class1" (placeholder per FORMAT.md
section 5; the contract has no class2 level value yet, and this
mapping is recorded in the course BUILD-NOTES). Sources: Spellman
Handbook of Water and Wastewater Treatment Plant Operations (3rd
ed.), WPI 2025 Need-to-Know Criteria for Water Treatment Class II,
Health Canada Guidelines for Canadian Drinking Water Quality, US EPA
Small Drinking Water Systems Handbook, US EPA Surface Water Treatment
Rule guidance (background), CCOHS safety guidance.

## WPI Class 3 Water Treatment grounding (courseKey wpi-class3-water)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Water Treatment Class III, in a western Canadian context. The closest
matching bank structure in the repo is content/class1-water, deepened
from the WPI Class 2 build to the Class III scope: advanced process
control, membrane treatment with given values (flux, recovery,
transmembrane pressure as stated rates), ultraviolet disinfection
with given values, whole plant mass balances, residuals management,
source water protection planning, water quality management programs,
optimization studies, capital and asset awareness, and senior operator
decision making, including cold climate operation at scale. Regulation
framing stays generic: provincial drinking water requirements in
general terms and the Guidelines for Canadian Drinking Water Quality
as the federal reference. Do NOT cite Ontario regulations, and do NOT
invent provincial regulation numbers. Calculation vocabulary uses
given values and factors so every result is an exact decimal; no
Hazen-Williams and no exponential or logarithmic numerics. Id prefix
for this course: wp3w (wp3w-ladder01..100, wp3w-process01..100,
wp3w-error01..100, wp3w-evidence01..100, wp3w-mission01..100). Level:
"class1" (placeholder per FORMAT.md section 5; the contract has no
class3 level value yet, and this mapping is recorded in the course
BUILD-NOTES). Sources: Spellman Handbook of Water and Wastewater
Treatment Plant Operations (3rd ed.), WPI 2025 Need-to-Know Criteria
for Water Treatment Class III, Health Canada Guidelines for Canadian
Drinking Water Quality, US EPA Membrane Filtration Guidance Manual
(background), US EPA Ultraviolet Disinfection Guidance Manual
(background), CCOHS safety guidance.

## WPI Class 4 Water Treatment grounding (courseKey wpi-class4-water)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Water Treatment Class IV, in a western Canadian context, at the
senior operator and utility leadership level. The closest matching
bank structure in the repo is content/class1-water, deepened from the
WPI Class 3 build: utility management and governance awareness,
whole plant and utility wide mass and energy balances, water quality
strategy, treatment technology selection studies, capital planning
awareness, emergency management leadership, regulatory management in
generic provincial terms, and senior decision making under
uncertainty, including cold climate operation at utility scale.
Regulation framing stays generic: provincial drinking water
requirements in general terms and the Guidelines for Canadian
Drinking Water Quality as the federal reference. Do NOT cite Ontario
regulations, and do NOT invent provincial regulation numbers.
Calculation vocabulary uses given values and factors so every result
is an exact decimal; no Hazen-Williams and no exponential or
logarithmic numerics. Id prefix for this course: wp4w
(wp4w-ladder01..100, wp4w-process01..100, wp4w-error01..100,
wp4w-evidence01..100, wp4w-mission01..100). Level: "class1"
(placeholder per FORMAT.md section 5; the contract has no class4
level value yet, and this mapping is recorded in the course
BUILD-NOTES). Sources: Spellman Handbook of Water and Wastewater
Treatment Plant Operations (3rd ed.), WPI 2025 Need-to-Know Criteria
for Water Treatment Class IV, Health Canada Guidelines for Canadian
Drinking Water Quality, US EPA Membrane Filtration Guidance Manual
(background), US EPA Ultraviolet Disinfection Guidance Manual
(background), CCOHS safety guidance.

## WPI Class 1 Wastewater Treatment grounding (courseKey wpi-class1-wastewater)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Wastewater Treatment Class I, in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-treatment, transposed out of the Ontario framing:
preliminary treatment (screening, grit), primary clarification,
activated sludge basics, trickling filters and rotating biological
contactors, secondary clarification, disinfection basics, solids
handling basics (thickening, digestion awareness, dewatering
awareness), sampling and laboratory basics, pumps and equipment,
safety, and Class I operator duties, including cold climate
operation. Regulation framing stays generic: provincial wastewater
requirements in general terms, the federal Wastewater Systems
Effluent Regulations in general terms, and the CCME Canada-wide
Strategy for the Management of Municipal Wastewater Effluent as
context. Do NOT cite Ontario regulations, and do NOT invent
provincial regulation numbers. Calculation vocabulary mirrors the
Class 1 wastewater build: F/M ratio, sludge age from given values,
BOD and solids loadings, percent removal, clarifier surface and
weir loading, return sludge ratios, wasting rates, digester loading
with given values, all exact decimals; no Hazen-Williams and no
exponential or logarithmic numerics. Id prefix for this course:
wp1ww (wp1ww-ladder01..100, wp1ww-process01..100,
wp1ww-error01..100, wp1ww-evidence01..100, wp1ww-mission01..100).
Level: "class1" (the natural enum value for a Class I course; the
courseKey allowlist extension remains the outstanding contract item,
recorded in the course BUILD-NOTES). Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), WPI 2025
Need-to-Know Criteria for Wastewater Treatment Class I, CCME
Canada-wide Strategy for the Management of Municipal Wastewater
Effluent, the federal Wastewater Systems Effluent Regulations
(general reference), US EPA wastewater primer material (background),
CCOHS safety guidance.

## WPI Class 2 Wastewater Treatment grounding (courseKey wpi-class2-wastewater)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Wastewater Treatment Class II, in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-treatment, deepened from the WPI Class 1 build to the
Class II scope: solids retention time and F/M control, process
control testing (settleability, oxygen uptake with given values,
microscopy awareness), anaerobic digestion operations (volatile
solids reduction, gas production with given values, volatile acids
to alkalinity awareness), disinfection dose and contact basics,
nutrient awareness, solids dewatering operations, laboratory QA/QC,
process troubleshooting, and operator supervisory awareness at the
Class II level, including cold climate operation. Regulation framing
stays generic: provincial wastewater requirements in general terms,
the federal Wastewater Systems Effluent Regulations in general
terms, and the CCME Canada-wide Strategy as context. Do NOT cite
Ontario regulations, and do NOT invent provincial regulation
numbers. Calculation vocabulary uses given values and factors so
every result is an exact decimal; no Hazen-Williams and no
exponential or logarithmic numerics. Id prefix for this course:
wp2ww (wp2ww-ladder01..100, wp2ww-process01..100,
wp2ww-error01..100, wp2ww-evidence01..100, wp2ww-mission01..100).
Level: "class1" (placeholder per FORMAT.md section 5; the contract
has no class2 level value yet, and this mapping is recorded in the
course BUILD-NOTES). Sources: Spellman Handbook of Water and
Wastewater Treatment Plant Operations (3rd ed.), WPI 2025
Need-to-Know Criteria for Wastewater Treatment Class II, CCME
Canada-wide Strategy for the Management of Municipal Wastewater
Effluent, the federal Wastewater Systems Effluent Regulations
(general reference), US EPA wastewater primer material (background),
CCOHS safety guidance.

## WPI Class 3 Wastewater Treatment grounding (courseKey wpi-class3-wastewater)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Wastewater Treatment Class III, in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-treatment, deepened from the WPI Class 2 build to the
Class III scope: biological nutrient removal operations (nitrification
and denitrification control, biological and chemical phosphorus
removal), nutrient mass balances, SRT optimization, digestion
optimization (co-digestion awareness, gas utilization with given
values), dewatering optimization, effluent quality management,
process optimization studies, and senior operator decision making,
including cold climate operation at scale. Regulation framing stays
generic: provincial wastewater requirements in general terms, the
federal Wastewater Systems Effluent Regulations in general terms,
and the CCME Canada-wide Strategy as context. Do NOT cite Ontario
regulations, and do NOT invent provincial regulation numbers.
Calculation vocabulary uses given values and factors (7.14 alkalinity
factor, 4.57 nitrification oxygen factor, given carbon ratios) so
every result is an exact decimal; no Hazen-Williams and no
exponential or logarithmic numerics. Id prefix for this course:
wp3ww (wp3ww-ladder01..100, wp3ww-process01..100,
wp3ww-error01..100, wp3ww-evidence01..100, wp3ww-mission01..100).
Level: "class1" (placeholder per FORMAT.md section 5; the contract
has no class3 level value yet, and this mapping is recorded in the
course BUILD-NOTES). Sources: Spellman Handbook of Water and
Wastewater Treatment Plant Operations (3rd ed.), WPI 2025
Need-to-Know Criteria for Wastewater Treatment Class III, CCME
Canada-wide Strategy for the Management of Municipal Wastewater
Effluent, the federal Wastewater Systems Effluent Regulations
(general reference), WEF Manual of Practice material on nutrient
removal (background), CCOHS safety guidance.

## WPI Class 4 Wastewater Treatment grounding (courseKey wpi-class4-wastewater)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Wastewater Treatment Class IV, in a western Canadian context, at the
senior operator and utility leadership level. The closest matching
bank structure in the repo is content/class1-treatment, deepened from
the WPI Class 3 build: nutrient removal strategy, biosolids program
strategy, biogas and energy management with given factors, utility
management and governance awareness, technology selection studies,
capital planning awareness, emergency management leadership, and
senior decision making under uncertainty, including cold climate
operation at utility scale. Regulation framing stays generic:
provincial wastewater requirements in general terms, the federal
Wastewater Systems Effluent Regulations in general terms, and the
CCME Canada-wide Strategy as context. Do NOT cite Ontario
regulations, and do NOT invent provincial regulation numbers.
Calculation vocabulary uses given values and factors so every result
is an exact decimal; no Hazen-Williams and no exponential or
logarithmic numerics. Id prefix for this course: wp4ww
(wp4ww-ladder01..100, wp4ww-process01..100, wp4ww-error01..100,
wp4ww-evidence01..100, wp4ww-mission01..100). Level: "class1"
(placeholder per FORMAT.md section 5; the contract has no class4
level value yet, and this mapping is recorded in the course
BUILD-NOTES). Sources: Spellman Handbook of Water and Wastewater
Treatment Plant Operations (3rd ed.), WPI 2025 Need-to-Know Criteria
for Wastewater Treatment Class IV, CCME Canada-wide Strategy for the
Management of Municipal Wastewater Effluent, the federal Wastewater
Systems Effluent Regulations (general reference), WEF Manual of
Practice material on nutrient removal (background), CCOHS safety
guidance.

## WPI Class 1 Water Distribution grounding (courseKey wpi-class1-water-dist)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Water Distribution Class I, in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, transposed out of the Ontario framing:
distribution system components (mains, valves, hydrants, services,
meters), storage tanks and reservoirs, booster pumps and pressure
zones, water quality in distribution (residual maintenance, flushing,
sampling), leak awareness, basic hydraulics with given values
(pressure from head at 9.81 kPa per metre, velocities, volumes),
safety, and Class I operator duties, including cold climate
operation (deep frost, frozen services). Regulation framing stays
generic: provincial drinking water requirements in general terms and
the Guidelines for Canadian Drinking Water Quality as the federal
reference. Do NOT cite Ontario regulations, and do NOT invent
provincial regulation numbers. Calculation vocabulary uses given
values and factors so every result is an exact decimal; no
Hazen-Williams (head loss only with a given loss rate per length)
and no exponential or logarithmic numerics. Id prefix for this
course: wp1wd (wp1wd-ladder01..100, wp1wd-process01..100,
wp1wd-error01..100, wp1wd-evidence01..100, wp1wd-mission01..100).
Level: "class1" (the natural enum value for a Class I course; the
courseKey allowlist extension remains the outstanding contract item,
recorded in the course BUILD-NOTES). Sources: Spellman Handbook of
Water and Wastewater Treatment Plant Operations (3rd ed.), WPI 2025
Need-to-Know Criteria for Water Distribution Class I, Health Canada
Guidelines for Canadian Drinking Water Quality, AWWA distribution
system guidance (background), US EPA distribution system guidance
(background), CCOHS safety guidance.

## WPI Class 2 Water Distribution grounding (courseKey wpi-class2-water-dist)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Water Distribution Class II, in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, deepened from the WPI Class 1 build to the
Class II scope: pressure zone management, water loss and non-revenue
water basics (district night flow analysis with given values),
water quality management programs (residual optimization, flushing
program design, storage turnover management), main break and leak
program analysis, pump station operations, cross connection control
program awareness, and operator supervisory awareness at the Class
II level, including cold climate operation. Regulation framing stays
generic: provincial drinking water requirements in general terms and
the Guidelines for Canadian Drinking Water Quality as the federal
reference. Do NOT cite Ontario regulations, and do NOT invent
provincial regulation numbers. Calculation vocabulary uses given
values and factors (pressure from head at 9.81 kPa per metre, head
loss only with a given loss rate per length) so every result is an
exact decimal; no Hazen-Williams formula and no exponential or
logarithmic numerics. Id prefix for this course: wp2wd
(wp2wd-ladder01..100, wp2wd-process01..100, wp2wd-error01..100,
wp2wd-evidence01..100, wp2wd-mission01..100). Level: "class1"
(placeholder per FORMAT.md section 5; the contract has no class2
level value yet, and this mapping is recorded in the course
BUILD-NOTES). Sources: Spellman Handbook of Water and Wastewater
Treatment Plant Operations (3rd ed.), WPI 2025 Need-to-Know Criteria
for Water Distribution Class II, Health Canada Guidelines for
Canadian Drinking Water Quality, AWWA water loss control guidance
(background), US EPA distribution system guidance (background),
CCOHS safety guidance.

## WPI Class 3 Water Distribution grounding (courseKey wpi-class3-water-dist)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Water Distribution Class III, in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, deepened from the WPI Class 2 build to the
Class III scope (the repo also carries a partial
content/class3-water-dist folder): water loss strategy and audit
programs, demand forecasting and capacity planning awareness, asset
management awareness for distribution networks, system optimization
studies, water quality strategy, pressure management programs, and
senior operator decision making, including cold climate operation at
scale. Regulation framing stays generic: provincial drinking water
requirements in general terms and the Guidelines for Canadian
Drinking Water Quality as the federal reference. Do NOT cite Ontario
regulations, and do NOT invent provincial regulation numbers.
Calculation vocabulary uses given values and factors (pressure from
head at 9.81 kPa per metre, head loss only with a given loss rate per
length) so every result is an exact decimal; no Hazen-Williams
formula and no exponential or logarithmic numerics. Id prefix for
this course: wp3wd (wp3wd-ladder01..100, wp3wd-process01..100,
wp3wd-error01..100, wp3wd-evidence01..100, wp3wd-mission01..100).
Level: "class1" (placeholder per FORMAT.md section 5; the contract
has no class3 level value yet, and this mapping is recorded in the
course BUILD-NOTES). Sources: Spellman Handbook of Water and
Wastewater Treatment Plant Operations (3rd ed.), WPI 2025
Need-to-Know Criteria for Water Distribution Class III, Health
Canada Guidelines for Canadian Drinking Water Quality, AWWA water
loss control guidance (background), AWWA asset management guidance
(background), CCOHS safety guidance.

## WPI Class 4 Water Distribution grounding (courseKey wpi-class4-water-dist)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Water Distribution Class IV, in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, deepened from the WPI Class 3 build to the
Class IV senior scope: water loss strategy at utility scale, demand
forecasting and long range capacity strategy, asset management and
capital program leadership, pressure management strategy, water
quality strategy and risk management, system optimization and
performance benchmarking, utility management and governance
(operating and capital budgets, rate and funding awareness, council
and board reporting, regulatory reporting leadership), emergency
management leadership, and senior decision making, including cold
climate operation at utility scale. Regulation framing stays
generic: provincial drinking water requirements in general terms
and the Guidelines for Canadian Drinking Water Quality as the
federal reference. Do NOT cite Ontario regulations, and do NOT
invent provincial regulation numbers. Calculation vocabulary uses
given values and factors (pressure from head at 9.81 kPa per metre,
head loss only with a given loss rate per length) so every result
is an exact decimal; no Hazen-Williams formula and no exponential
or logarithmic numerics. Id prefix for this course: wp4wd
(wp4wd-ladder01..100, wp4wd-process01..100, wp4wd-error01..100,
wp4wd-evidence01..100, wp4wd-mission01..100). Level: "class1"
(placeholder per FORMAT.md section 5; the contract has no class4
level value yet, and this mapping is recorded in the course
BUILD-NOTES). Sources: Spellman Handbook of Water and Wastewater
Treatment Plant Operations (3rd ed.), WPI 2025 Need-to-Know Criteria
for Water Distribution Class IV, Health Canada Guidelines for
Canadian Drinking Water Quality, AWWA water loss control guidance
(background), AWWA asset management guidance (background), CCOHS
safety guidance.

## WPI Class 1 Wastewater Collection grounding (courseKey wpi-class1-water-coll)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Wastewater Collection Class I, in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks (the same bank the Ontario Class 1
wastewater collection build used), transposed west: collection
system components (gravity sewers, manholes, services), lift
station basics (wet wells, pumps, levels, alarms), inspection and
cleaning basics (flushing, CCTV awareness), inflow and infiltration
awareness, safety (confined spaces, traffic control, gas hazards),
spill and overflow first response, records and reporting basics,
and cold climate operation (frozen services, spring melt surcharges).
Regulation framing stays generic: provincial wastewater requirements
in general terms, the federal Wastewater Systems Effluent
Regulations and the CCME Canada-wide Strategy as general federal
references. Do NOT cite Ontario regulations, and do NOT invent
provincial regulation numbers. Calculation vocabulary uses given
values and factors (flows, volumes, velocities from given areas,
pump rates, rainfall volumes over given areas) so every result is
an exact decimal; no Hazen-Williams formula and no exponential or
logarithmic numerics. Id prefix for this course: wp1wc
(wp1wc-ladder01..100, wp1wc-process01..100, wp1wc-error01..100,
wp1wc-evidence01..100, wp1wc-mission01..100). Level: "class1"
(the natural enum value for a Class I course; only the courseKey
allowlist blocks serving, per FORMAT.md section 5, recorded in the
course BUILD-NOTES). Sources: Spellman Handbook of Water and
Wastewater Treatment Plant Operations (3rd ed.), WPI 2025
Need-to-Know Criteria for Wastewater Collection Class I, CCME
Canada-wide Strategy for the Management of Municipal Wastewater
Effluent, Government of Canada Wastewater Systems Effluent
Regulations, US EPA collection system guidance (background),
CCOHS safety guidance.

## WPI Class 2 Wastewater Collection grounding (courseKey wpi-class2-water-coll)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Wastewater Collection Class II, in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, deepened from the WPI Class 1 collection
build: lift station operations and maintenance programs (pump
performance checks, wet well management, standby power), cleaning
program planning and production tracking, CCTV condition assessment
and defect awareness, inflow and infiltration programs (flow
monitoring, night flow analysis, source detection), manhole and
pipe rehabilitation awareness, safety program routines (confined
space program, gas detection, traffic control planning), spill and
overflow response coordination, records, reporting and CMOM
awareness, supervisory awareness, and cold climate operations.
Regulation framing stays generic: provincial wastewater
requirements in general terms, the federal Wastewater Systems
Effluent Regulations and the CCME Canada-wide Strategy as general
federal references. Do NOT cite Ontario regulations, and do NOT
invent provincial regulation numbers. Calculation vocabulary uses
given values and factors (flows, volumes, velocities from given
areas, pump rates and curves read as given points, rainfall volumes
over given areas) so every result is an exact decimal; no
Hazen-Williams formula and no exponential or logarithmic numerics.
Id prefix for this course: wp2wc (wp2wc-ladder01..100,
wp2wc-process01..100, wp2wc-error01..100, wp2wc-evidence01..100,
wp2wc-mission01..100). Level: "class1" (placeholder per FORMAT.md
section 5; the contract has no class2 level value yet, and this
mapping is recorded in the course BUILD-NOTES). Sources: Spellman
Handbook of Water and Wastewater Treatment Plant Operations (3rd
ed.), WPI 2025 Need-to-Know Criteria for Wastewater Collection
Class II, CCME Canada-wide Strategy for the Management of Municipal
Wastewater Effluent, Government of Canada Wastewater Systems
Effluent Regulations, US EPA collection system guidance
(background), CCOHS safety guidance.

## WPI Class 3 Wastewater Collection grounding (courseKey wpi-class3-water-coll)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Wastewater Collection Class III, in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, deepened from the WPI Class 2 collection
build: inflow and infiltration programs and rehabilitation programs
(basin studies, source removal economics, lining and renewal
programs), CMOM program elements (capacity assurance, overflow
response plans, performance tracking), asset management awareness
for collection networks, lift station optimization and reliability
programs, condition assessment programs, capacity and growth
planning awareness, safety program leadership, senior operator
decision making, and cold climate operations at scale. Regulation
framing stays generic: provincial wastewater requirements in
general terms, the federal Wastewater Systems Effluent Regulations
and the CCME Canada-wide Strategy as general federal references.
Do NOT cite Ontario regulations, and do NOT invent provincial
regulation numbers. Calculation vocabulary uses given values and
factors (flows, volumes, velocities from given areas, pump rates,
rainfall volumes over given areas, program costs with given unit
rates) so every result is an exact decimal; no Hazen-Williams
formula and no exponential or logarithmic numerics. Id prefix for
this course: wp3wc (wp3wc-ladder01..100, wp3wc-process01..100,
wp3wc-error01..100, wp3wc-evidence01..100, wp3wc-mission01..100).
Level: "class1" (placeholder per FORMAT.md section 5; the contract
has no class3 level value yet, and this mapping is recorded in the
course BUILD-NOTES). Sources: Spellman Handbook of Water and
Wastewater Treatment Plant Operations (3rd ed.), WPI 2025
Need-to-Know Criteria for Wastewater Collection Class III, CCME
Canada-wide Strategy for the Management of Municipal Wastewater
Effluent, Government of Canada Wastewater Systems Effluent
Regulations, US EPA collection system guidance (background),
CCOHS safety guidance.

## WPI Class 4 Wastewater Collection grounding (courseKey wpi-class4-water-coll)

The grounding criteria are the WPI 2025 Need-to-Know Criteria for
Wastewater Collection Class IV, in a western Canadian context. The
closest matching bank structure in the repo is
content/class1-networks, deepened from the WPI Class 3 collection
build to the Class IV senior scope: inflow and infiltration
strategy at utility scale, CMOM at utility scale (program
governance, performance reporting, corrective action leadership),
asset management and capital program leadership for collection
networks, capacity strategy and long range growth planning, lift
station fleet strategy and energy management, condition and risk
programs, utility management and governance (operating and capital
budgets, rate and funding awareness, council and board reporting,
regulatory reporting leadership), emergency management leadership,
senior decision making, and cold climate operations at utility
scale. Regulation framing stays generic: provincial wastewater
requirements in general terms, the federal Wastewater Systems
Effluent Regulations and the CCME Canada-wide Strategy as general
federal references. Do NOT cite Ontario regulations, and do NOT
invent provincial regulation numbers. Calculation vocabulary uses
given values and factors (flows, volumes, velocities from given
areas, pump rates, rainfall volumes over given areas, program
costs and budgets with given unit rates) so every result is an
exact decimal; no Hazen-Williams formula and no exponential or
logarithmic numerics. Id prefix for this course: wp4wc
(wp4wc-ladder01..100, wp4wc-process01..100, wp4wc-error01..100,
wp4wc-evidence01..100, wp4wc-mission01..100). Level: "class1"
(placeholder per FORMAT.md section 5; the contract has no class4
level value yet, and this mapping is recorded in the course
BUILD-NOTES). Sources: Spellman Handbook of Water and Wastewater
Treatment Plant Operations (3rd ed.), WPI 2025 Need-to-Know
Criteria for Wastewater Collection Class IV, CCME Canada-wide
Strategy for the Management of Municipal Wastewater Effluent,
Government of Canada Wastewater Systems Effluent Regulations,
US EPA collection system guidance (background), CCOHS safety
guidance.
