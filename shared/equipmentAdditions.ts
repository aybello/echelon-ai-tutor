import type { EquipmentDefinition } from "./equipmentRegistry";

/** Source-backed Equipment Lab additions, reviewed November 26, 2026. */
export const EQUIPMENT_ADDITIONS: readonly EquipmentDefinition[] = [
  {
    "id": "centrifugal-pump",
    "slug": "centrifugal-pump",
    "moduleNumber": "03",
    "title": "Horizontal end-suction centrifugal pump",
    "shortTitle": "Centrifugal pump",
    "eyebrow": "Water distribution pumping",
    "summary": "Follow water through an end-suction pump and connect component functions, pressure observations and pump curves to operator exam concepts.",
    "stream": "water-distribution",
    "accent": "#0f766e",
    "sceneId": "centrifugal-pump",
    "relatedTopics": [
      "Pump and system curves",
      "Pressure and head",
      "Cavitation and NPSH",
      "Distribution pumping"
    ],
    "guideRoute": "/pumping",
    "practiceRoute": "/class1-water-dist",
    "parts": [
      {
        "id": "suction",
        "label": "Suction inlet",
        "color": "#38bdf8",
        "function": "Carries water axially into the impeller eye at the end of the horizontal pump.",
        "operatorLens": "Trend suction pressure and source level alongside flow; falling inlet pressure can reduce available suction head.",
        "examConnection": "Available net positive suction head, NPSH, describes suction energy above vapour pressure. Required NPSH comes from pump data."
      },
      {
        "id": "impeller",
        "label": "Rotating impeller",
        "color": "#14b8a6",
        "function": "Transfers shaft energy to water through rotating vanes, directing flow outward from the eye.",
        "operatorLens": "Compare measured flow and head with the appropriate speed-specific pump curve.",
        "examConnection": "A centrifugal pump does not deliver a fixed volume per revolution; its operating point depends on the system curve."
      },
      {
        "id": "casing",
        "label": "Volute casing",
        "color": "#0369a1",
        "function": "Collects impeller discharge and converts part of its kinetic energy into static pressure before the outlet.",
        "operatorLens": "Observe external leakage and changing noise from safe, approved observation points.",
        "examConnection": "The impeller adds energy; the stationary volute recovers pressure and directs flow. It is not another driver."
      },
      {
        "id": "shaft",
        "label": "Pump shaft",
        "color": "#a78bfa",
        "function": "Transmits motor torque to the impeller and carries the rotating assembly.",
        "operatorLens": "Trend recorded vibration and bearing-area temperature; do not approach exposed rotating components.",
        "examConnection": "The shaft carries mechanical energy, not a separate water stream. Vibration alone does not identify its cause."
      },
      {
        "id": "motor",
        "label": "Electric motor",
        "color": "#f59e0b",
        "function": "Converts electrical energy into rotation that drives the pump shaft.",
        "operatorLens": "Compare current, speed and temperature trends with hydraulic output and site alarms.",
        "examConnection": "Motor input power exceeds useful hydraulic power because motor and pump losses occur. Current alone is not a flow measurement."
      },
      {
        "id": "discharge",
        "label": "Discharge outlet",
        "color": "#22c55e",
        "function": "Routes pressurized water from the casing into the distribution piping.",
        "operatorLens": "Read discharge pressure together with suction pressure and flow rather than as an isolated indicator.",
        "examConnection": "Discharge pressure alone is not pump head rise. The pump itself is not a nonreturn or backflow-protection device."
      }
    ],
    "stages": [
      {
        "id": "enter",
        "step": "01",
        "title": "Enter the eye",
        "description": "Water reaches the impeller through the suction inlet. Inlet conditions determine the available margin above vapour pressure.",
        "accent": "#38bdf8"
      },
      {
        "id": "energize",
        "step": "02",
        "title": "Transfer energy",
        "description": "The motor turns the shaft and impeller. Rotating vanes add energy to water moving outward.",
        "accent": "#14b8a6"
      },
      {
        "id": "recover",
        "step": "03",
        "title": "Recover pressure",
        "description": "The volute gathers the outward flow, recovers static pressure and directs water toward the discharge.",
        "accent": "#0369a1"
      },
      {
        "id": "deliver",
        "step": "04",
        "title": "Meet system resistance",
        "description": "Delivered flow and head settle where pump and system curves intersect. Changing speed or system resistance shifts this point.",
        "accent": "#22c55e"
      }
    ],
    "formulas": [
      {
        "id": "pressure-head-rise",
        "name": "Pressure-derived head rise",
        "expression": "H_p = 1000 x (p_d - p_s) / (rho x g)",
        "terms": [
          {
            "symbol": "H_p",
            "meaning": "Pressure contribution to head rise",
            "units": "m"
          },
          {
            "symbol": "p_d",
            "meaning": "Discharge gauge pressure",
            "units": "kPa"
          },
          {
            "symbol": "p_s",
            "meaning": "Suction gauge pressure",
            "units": "kPa"
          },
          {
            "symbol": "rho",
            "meaning": "Water density assumed for this example",
            "units": "kg/m3"
          },
          {
            "symbol": "g",
            "meaning": "Gravitational acceleration",
            "units": "m/s2"
          },
          {
            "symbol": "1000",
            "meaning": "Converts kilopascals to pascals",
            "units": "Pa/kPa"
          }
        ],
        "worked": {
          "scenario": "Pressure taps read 325 kPa discharge and 80 kPa suction. Assume equal elevations, equal pipe diameters, negligible intervening losses, rho = 1000 kg/m3 and g = 9.81 m/s2.",
          "substitution": "H_p = 1000 x (325 - 80) / (1000 x 9.81) = 245000 / 9810",
          "result": "H_p = 25.0 m of water, rounded."
        },
        "interpretation": "This estimates pump head rise under the stated assumptions. Otherwise include elevation and velocity-head differences. Trend against comparable duty conditions, not a universal target; this result does not establish flow or efficiency."
      }
    ],
    "symptoms": [
      {
        "id": "noisy-unstable-delivery",
        "observation": "Gravel-like noise accompanies vibration or unstable delivery.",
        "likelyCauses": [
          "Insufficient available NPSH from low source level or suction losses",
          "Air entering the suction stream",
          "Mechanical vibration unrelated to cavitation"
        ],
        "examPoint": "Cavitation forms vapour bubbles at low local pressure. Noise is a clue, not proof; correlate hydraulic observations and follow plant alarm SOPs."
      },
      {
        "id": "lower-flow",
        "observation": "Flow is lower than the comparable operating baseline.",
        "likelyCauses": [
          "Increased system resistance or static head",
          "Lower pump speed",
          "Impeller wear or obstruction"
        ],
        "examPoint": "Lower flow does not automatically mean a damaged pump. Compare speed, suction conditions and both pressure readings before attributing the change."
      }
    ],
    "seo": {
      "title": "Horizontal End-Suction Centrifugal Pump | Echelon Institute",
      "description": "Learn pump component functions, operating-point concepts, cavitation observations and a metric pressure-to-head calculation for water-distribution exams.",
      "h1": "Inside a Horizontal End-Suction Centrifugal Pump",
      "sections": [
        {
          "heading": "How the pump moves water",
          "paragraphs": [
            "An end-suction layout brings water along the shaft axis into the impeller eye. The impeller transfers mechanical energy to the liquid, while the surrounding volute collects flow and recovers pressure. This energy helps overcome elevation and piping losses in distribution service."
          ]
        },
        {
          "heading": "Reading the operating point",
          "paragraphs": [
            "Flow and head belong together. A pump curve describes the pump at a specified speed; the system curve describes the head needed to move water through the installation. Their intersection determines duty. Compare observations with site history and manufacturer data. Approved plant SOPs govern operational responses, including abnormal noise or pressure."
          ]
        }
      ],
      "faq": [
        {
          "question": "Is discharge pressure the same as pump head?",
          "answer": "No. Head rise accounts for suction and discharge conditions. Pressure difference gives its pressure contribution; elevation and velocity-head differences may also matter."
        },
        {
          "question": "What causes centrifugal pump cavitation?",
          "answer": "Vapour bubbles form where local pressure falls below water's vapour pressure and collapse as pressure rises. Available NPSH and manufacturer-required margins matter; one pressure reading cannot confirm acceptable suction conditions."
        }
      ]
    },
    "sources": [
      {
        "title": "KSB: Centrifugal pump",
        "url": "https://www.ksb.com/en-global/centrifugal-pump-lexicon/article/centrifugal-pump-1118760",
        "reviewedAt": "2026-11-26",
        "supports": "Impeller energy transfer"
      },
      {
        "title": "Grundfos: Pump curves",
        "url": "https://www.grundfos.com/solutions/learn/research-and-insights/pump-curves",
        "reviewedAt": "2026-11-26",
        "supports": "Head-pressure conversion and performance curves"
      },
      {
        "title": "KSB: Suction characteristics",
        "url": "https://www.ksb.com/en-global/centrifugal-pump-lexicon/article/suction-characteristics-1117252",
        "reviewedAt": "2026-11-26",
        "supports": "NPSH and suction performance"
      },
      {
        "title": "KSB: Cavitation",
        "url": "https://www.ksb.com/en-global/centrifugal-pump-lexicon/article/cavitation-1117364",
        "reviewedAt": "2026-11-26",
        "supports": "Vapour bubbles and diagnostic symptoms"
      },
      {
        "title": "KSB: Operating point",
        "url": "https://www.ksb.com/en-global/centrifugal-pump-lexicon/article/operating-point-1117036",
        "reviewedAt": "2026-11-26",
        "supports": "Pump-system curve intersection"
      },
      {
        "title": "KSB: Volute casing",
        "url": "https://www.ksb.com/en-global/centrifugal-pump-lexicon/article/volute-casing-1117650",
        "reviewedAt": "2026-11-26",
        "supports": "Collection and static-pressure recovery"
      },
      {
        "title": "KSB: Pump shaft",
        "url": "https://www.ksb.com/en-global/centrifugal-pump-lexicon/article/pump-shaft-1115634",
        "reviewedAt": "2026-11-26",
        "supports": "Drive torque transmission"
      },
      {
        "title": "KSB: Volute casing pump",
        "url": "https://www.ksb.com/en-global/centrifugal-pump-lexicon/article/volute-casing-pump-1117514",
        "reviewedAt": "2026-11-26",
        "supports": "Horizontal and axial-suction layout"
      }
    ]
  },
  {
    "id": "rapid-gravity-filter",
    "slug": "rapid-gravity-filter",
    "moduleNumber": "04",
    "title": "Rapid gravity granular-media filter",
    "shortTitle": "Rapid gravity filter",
    "eyebrow": "Granular-media filtration",
    "summary": "Follow gravity-driven filtration through granular media, interpret headloss and turbidity, and calculate the loading on an active filter bed.",
    "stream": "water-treatment",
    "accent": "#0f766e",
    "sceneId": "rapid-gravity-filter",
    "relatedTopics": [
      "Coagulation and clarification",
      "Granular-media filtration",
      "Filter headloss",
      "Individual filter turbidity",
      "Filtration loading rate"
    ],
    "guideRoute": "/process",
    "practiceRoute": "/class1-water",
    "parts": [
      {
        "id": "inlet",
        "label": "Filter inlet",
        "color": "#38bdf8",
        "function": "Delivers pretreated water above the bed without intentionally disturbing the media.",
        "operatorLens": "Compare inlet quality and flow distribution between operating filters; upstream floc carryover can shorten runs.",
        "examConnection": "Effective coagulation helps particles attach during filtration. Filtration cannot reliably compensate for poor pretreatment."
      },
      {
        "id": "supernatant",
        "label": "Supernatant water",
        "color": "#0369a1",
        "function": "Holds water above the media and contributes to the hydraulic head driving downflow.",
        "operatorLens": "Trend water level with flow and measured headloss; interpret changes using the installed control arrangement.",
        "examConnection": "Headloss is hydraulic resistance. Water level alone is not a direct measurement of filtered-water quality."
      },
      {
        "id": "media",
        "label": "Granular media bed",
        "color": "#d97706",
        "function": "Sand or layered media capture particles on grain surfaces and within bed voids.",
        "operatorLens": "Compare headloss growth and outlet turbidity through each run; note unusual bed appearance from designated safe observation points.",
        "examConnection": "Capture includes attachment and interception, not just sieving. Dual-media beds commonly place coarser anthracite above finer sand."
      },
      {
        "id": "underdrain",
        "label": "Underdrain system",
        "color": "#64748b",
        "function": "Collects filtrate across the bed and distributes backwash water, plus air where designed.",
        "operatorLens": "Record uneven wash patterns or unexpected differential-pressure trends for assessment under plant SOPs.",
        "examConnection": "Uniform collection and wash distribution limit preferential flow paths; media-retention arrangements depend on underdrain design."
      },
      {
        "id": "wash-trough",
        "label": "Washwater trough",
        "color": "#a855f7",
        "function": "Collects dirty backwash water above the bed and conveys it to the washwater handling system.",
        "operatorLens": "Observe washwater carryover and unexpected media in the waste stream without approaching unsafe openings.",
        "examConnection": "Troughs carry removed solids away during backwashing; they are not the normal filtered-water outlet."
      },
      {
        "id": "outlet",
        "label": "Filtered-water outlet",
        "color": "#10b981",
        "function": "Carries collected filtrate onward through the installed flow-control and monitoring arrangement.",
        "operatorLens": "Trend individual-filter turbidity with flow and run history; follow the plant's escalation and routing SOPs for abnormal readings.",
        "examConnection": "Individual-filter data can reveal deterioration masked by blended effluent. Low turbidity alone does not prove pathogen absence."
      }
    ],
    "stages": [
      {
        "id": "feed",
        "step": "01",
        "title": "Receive pretreated water",
        "description": "Coagulated, usually clarified water enters above the media. Direct-filtration plants use a different upstream arrangement.",
        "accent": "#0369a1"
      },
      {
        "id": "capture",
        "step": "02",
        "title": "Capture particles",
        "description": "Gravity head drives downflow through the bed. Retained particles progressively increase resistance while filtrate reaches the underdrain.",
        "accent": "#0f766e"
      },
      {
        "id": "wash",
        "step": "03",
        "title": "Remove retained solids",
        "description": "During the plant-controlled backwash phase, reverse water flow carries released solids to troughs. Air scour is design-dependent.",
        "accent": "#0f766e"
      },
      {
        "id": "ripen",
        "step": "04",
        "title": "Re-establish filtration",
        "description": "Post-wash ripening can produce elevated turbidity. Filter-to-waste routing and return-to-service criteria follow the plant SOP, not a generic timer.",
        "accent": "#0369a1"
      }
    ],
    "formulas": [
      {
        "id": "filtration-loading",
        "name": "Filtration loading rate",
        "expression": "R = Q / A",
        "terms": [
          {
            "symbol": "R",
            "meaning": "Hydraulic loading on the active bed surface",
            "units": "m/h"
          },
          {
            "symbol": "Q",
            "meaning": "Flow through this filter, expressed hourly",
            "units": "m3/h"
          },
          {
            "symbol": "A",
            "meaning": "Active horizontal filter bed area",
            "units": "m2"
          }
        ],
        "worked": {
          "scenario": "One operating filter receives 2,400 m3/day through a rectangular bed measuring 5 m by 4 m.",
          "substitution": "Q = 2,400 / 24 = 100 m3/h. A = 5 x 4 = 20 m2. R = 100 / 20.",
          "result": "R = 5.00 m/h"
        },
        "interpretation": "This compares water throughput with active area, not pore-water velocity. Use each filter's actual flow and compare with its site operating envelope; this example is not a recommended setpoint."
      }
    ],
    "symptoms": [
      {
        "id": "rapid-headloss",
        "observation": "Headloss rises unusually quickly at comparable flow.",
        "likelyCauses": [
          "Increased floc or solids carryover",
          "Persistent media fouling or clumping",
          "Restricted underdrain flow"
        ],
        "examPoint": "Resistance and water quality are different indicators. Compare headloss with flow, inlet conditions and turbidity before drawing conclusions."
      },
      {
        "id": "turbidity-rise",
        "observation": "Individual-filter outlet turbidity rises.",
        "likelyCauses": [
          "Post-backwash ripening",
          "Poor coagulation or a hydraulic disturbance",
          "Breakthrough or preferential paths associated with media loss"
        ],
        "examPoint": "A turbidity rise needs context and plant-SOP escalation. Neither low headloss nor clear appearance establishes satisfactory treatment."
      }
    ],
    "seo": {
      "title": "Rapid Gravity Filter Components and Loading | Echelon Institute",
      "description": "Learn rapid gravity filter flow paths, media capture, backwash concepts, headloss and turbidity observations, with a metric loading example.",
      "h1": "Inside a Rapid Gravity Granular-Media Filter",
      "sections": [
        {
          "heading": "How granular-media filtration works",
          "paragraphs": [
            "Rapid gravity filtration removes particles as water passes downward through granular media. Coagulation prepares small particles for capture, while clarification usually reduces the solids arriving at the filter. Sand-only and layered beds are both used; their performance depends on the installed media and upstream treatment.",
            "The filter is a particle-removal barrier, not a substitute for the plant's disinfection process. Its drawing shows normal downflow and a separate reverse-flow backwash phase, not an operating sequence to perform without the site SOP."
          ]
        },
        {
          "heading": "Reading a filter run",
          "paragraphs": [
            "Operators interpret flow, headloss and individual-filter turbidity together. Headloss describes increasing hydraulic resistance; turbidity describes light scattering from material in the water. A filter may develop high resistance while still producing low-turbidity water, or deteriorate in quality without reaching a headloss trigger.",
            "Certification questions commonly distinguish filtration loading from detention time and backwash from normal filtration. Real alarm responses, wash criteria and return-to-service decisions follow plant SOPs and applicable provincial requirements."
          ]
        }
      ],
      "faq": [
        {
          "question": "Is a rapid gravity filter just a sand sieve?",
          "answer": "No. Particle attachment to grains and interception within the bed are important alongside straining. This explains why coagulation and media condition affect performance."
        },
        {
          "question": "Does increasing flow change filtration loading?",
          "answer": "Yes. With unchanged active area, more flow increases loading. Removing a filter from service can raise loading on the remaining filters if plant flow is unchanged."
        }
      ]
    },
    "sources": [
      {
        "title": "Veolia Water Handbook: Chapter 06, Filtration",
        "url": "https://www.watertechnologies.com/handbook/chapter-06-filtration",
        "reviewedAt": "2026-11-26",
        "supports": "Gravity head, particle capture, media, underdrains and troughs"
      },
      {
        "title": "Rapid Gravity Filters: A Technical Guide, January 2026",
        "url": "https://www.ofwat.gov.uk/wp-content/uploads/2026/02/WTW-RGF-and-Civils-Technical-guide.pdf",
        "reviewedAt": "2026-11-26",
        "supports": "Filter monitoring, clogging, media loss and preferential flow"
      },
      {
        "title": "SUEZ Degrémont Water Handbook: Gravity filters",
        "url": "https://www.suezwaterhandbook.com/Processes-and-technologies/Filters/gravity-filters",
        "reviewedAt": "2026-11-26",
        "supports": "Sand and dual-media designs, settled-water and direct filtration"
      },
      {
        "title": "Ontario Design Guidelines for Drinking-Water Systems: Treatment and Chemical Application",
        "url": "https://www.ontario.ca/document/design-guidelines-drinking-water-systems/treatment-and-chemical-application",
        "reviewedAt": "2026-11-26",
        "supports": "Underdrain uniformity, site-dependent filtration rates and ripening"
      }
    ]
  },
  {
    "id": "chlorine-contact-tank",
    "slug": "chlorine-contact-tank",
    "moduleNumber": "05",
    "title": "Baffled chlorine contact tank",
    "shortTitle": "Chlorine contact tank",
    "eyebrow": "Primary disinfection",
    "summary": "Explore how baffles guide chlorinated water through a contact tank, why effective contact time differs from nominal detention, and how residual chlorine contributes to CT.",
    "stream": "water-treatment",
    "accent": "#0f766e",
    "sceneId": "chlorine-contact-tank",
    "relatedTopics": [
      "Chlorine disinfection",
      "Hydraulic detention time",
      "Baffling and T10",
      "CT calculations",
      "Chlorine residual"
    ],
    "guideRoute": "/process",
    "practiceRoute": "/class1-water",
    "parts": [
      {
        "id": "inlet",
        "label": "Tank inlet",
        "color": "#38bdf8",
        "function": "Admits chlorinated water and establishes the initial flow distribution into the tank.",
        "operatorLens": "Trend incoming flow and upstream chlorine residual alongside tank level; observe distribution only from designated safe locations.",
        "examConnection": "Chlorine addition and initial mixing establish the starting conditions. The inlet dose is not the residual used at the contact-zone endpoint."
      },
      {
        "id": "baffles",
        "label": "Flow-guiding baffles",
        "color": "#14b8a6",
        "function": "Internal partitions guide water along a longer path and reduce direct inlet-to-outlet short-circuiting.",
        "operatorLens": "Compare the operating flow path and level with the plant's documented hydraulic assessment; appearance alone cannot establish a baffling factor.",
        "examConnection": "Baffles improve hydraulic efficiency, not tank volume. Dead zones and short-circuiting can make effective contact time shorter than V/Q."
      },
      {
        "id": "contact-zone",
        "label": "Chlorine contact zone",
        "color": "#0f766e",
        "function": "Holds water while residual chlorine reacts with microorganisms and chlorine-demanding substances.",
        "operatorLens": "Trend water level, flow, residual, pH and temperature together rather than relying on one reading.",
        "examConnection": "Disinfection depends on residual concentration and effective exposure time. Organism susceptibility, pH and temperature affect the required CT."
      },
      {
        "id": "outlet",
        "label": "Tank outlet",
        "color": "#0369a1",
        "function": "Collects water after the intended contact path and conveys it downstream.",
        "operatorLens": "Relate outlet flow and tank-level changes to the water volume actually available for contact.",
        "examConnection": "Higher flow or lower available volume reduces nominal detention time. Outlet geometry also influences hydraulic performance."
      },
      {
        "id": "sample-point",
        "label": "Endpoint sample point",
        "color": "#a78bfa",
        "function": "Provides representative endpoint water for chlorine residual measurement after the contact zone.",
        "operatorLens": "Compare analyser trends with SOP-defined verification results and confirm whether the reported value is free or total chlorine.",
        "examConnection": "For a free-chlorine CT calculation, use the appropriate endpoint free residual, not applied dose or an interchangeable total-chlorine result."
      }
    ],
    "stages": [
      {
        "id": "enter",
        "step": "01",
        "title": "Enter after chlorine addition",
        "description": "Chlorinated water enters with initial mixing established upstream. Incoming water chemistry determines how much chlorine is consumed.",
        "accent": "#38bdf8"
      },
      {
        "id": "guide-flow",
        "step": "02",
        "title": "Follow the baffled path",
        "description": "Partitions distribute flow through the contact zone. They reduce shortcuts but do not guarantee ideal plug flow.",
        "accent": "#14b8a6"
      },
      {
        "id": "contact",
        "step": "03",
        "title": "Provide effective exposure",
        "description": "Residual chlorine acts during passage. The hydraulic assessment supplies T10 rather than assuming every parcel remains for V/Q.",
        "accent": "#0f766e"
      },
      {
        "id": "measure-exit",
        "step": "04",
        "title": "Measure before onward supply",
        "description": "Endpoint residual and hydraulic conditions inform CT evaluation. Follow plant SOPs for abnormal readings and escalation.",
        "accent": "#0369a1"
      }
    ],
    "formulas": [
      {
        "id": "chlorine-ct",
        "name": "Residual-based chlorine CT",
        "expression": "CT = C × T10 = C × BF × (V / Q)",
        "terms": [
          {
            "symbol": "CT",
            "meaning": "Calculated concentration-time product",
            "units": "mg·min/L"
          },
          {
            "symbol": "C",
            "meaning": "Endpoint free chlorine residual",
            "units": "mg/L"
          },
          {
            "symbol": "T10",
            "meaning": "Effective contact time corresponding to the first 10% passing through",
            "units": "min"
          },
          {
            "symbol": "BF",
            "meaning": "Site-specific baffling factor, T10 divided by nominal V/Q",
            "units": "dimensionless"
          },
          {
            "symbol": "V",
            "meaning": "Water volume available in the contact tank",
            "units": "m3"
          },
          {
            "symbol": "Q",
            "meaning": "Flow through the tank",
            "units": "m3/min"
          }
        ],
        "worked": {
          "scenario": "Hypothetical steady conditions: available volume is 600 m3, flow is 20 m3/min, the documented baffling factor for these conditions is 0.60, and endpoint free residual is 0.80 mg/L.",
          "substitution": "Nominal V/Q = 600 / 20 = 30 min. T10 = 0.60 × 30 = 18 min. CT = 0.80 × 18 = 14.4 mg·min/L.",
          "result": "Nominal detention: 30 min; effective T10: 18 min; calculated CT: 14.4 mg·min/L."
        },
        "interpretation": "The tank's nominal time overstates effective exposure in this example. The result helps relate flow, level and residual trends, but proves neither compliance nor a particular pathogen reduction. Compare using the applicable plant evaluation method, organism target, pH and temperature. The illustrative factor and residual are not operating targets."
      }
    ],
    "symptoms": [
      {
        "id": "falling-residual",
        "observation": "Endpoint free chlorine residual falls while flow is steady.",
        "likelyCauses": [
          "Increased chlorine demand from organics or ammonia",
          "Changed chlorine delivery or initial mixing",
          "Sampling or analyser error"
        ],
        "examPoint": "Dose and residual differ because water consumes chlorine. Confirm the evidence and follow plant SOP escalation rather than assuming a dose change."
      },
      {
        "id": "less-contact",
        "observation": "Calculated contact time decreases despite a similar endpoint residual.",
        "likelyCauses": [
          "Higher flow through the tank",
          "Lower water level and available volume",
          "A changed flow path invalidating the previous hydraulic assumption"
        ],
        "examPoint": "An unchanged residual does not preserve CT when effective contact time falls. Review hydraulic conditions under the plant's procedure."
      }
    ],
    "seo": {
      "title": "Baffled Chlorine Contact Tank Explained | Echelon Institute",
      "description": "Learn contact tank component functions, nominal detention versus T10, and a worked metric chlorine CT calculation for water operator certification.",
      "h1": "Inside a baffled chlorine contact tank",
      "sections": [
        {
          "heading": "Why a contact tank has baffles",
          "paragraphs": [
            "A contact tank provides exposure to chlorine after addition and mixing. Baffles guide water through the tank instead of letting a fast stream bypass much of its volume. Their layout, inlet and outlet conditions, and operating level influence the residence-time distribution. A tracer study can characterize this behaviour; the drawing alone cannot establish T10."
          ]
        },
        {
          "heading": "Reading CT without confusing dose and time",
          "paragraphs": [
            "Nominal detention is water volume divided by flow. T10 is a conservative hydraulic contact time: most water remains longer. Multiplying endpoint residual by T10 gives calculated CT. Free chlorine and total chlorine are different measurements, and the applied chemical dose is not the remaining residual.",
            "Operators interpret CT alongside pH, temperature and the treatment objective. A satisfactory-looking residual alone does not establish adequate primary disinfection. Plant SOPs and the responsible provincial authority govern real evaluations and responses."
          ]
        }
      ],
      "faq": [
        {
          "question": "Is V/Q the chlorine contact time?",
          "answer": "V/Q is nominal detention time. For a baffled tank, T10 accounts for hydraulic behaviour using a documented factor or tracer assessment. It should not automatically be equated with nominal time."
        },
        {
          "question": "Does a larger CT automatically mean compliance?",
          "answer": "No. Calculated CT must be evaluated against the applicable treatment objective and conditions, including residual type, pH, temperature and hydraulics. This learning example supplies no compliance determination."
        }
      ]
    },
    "sources": [
      {
        "title": "Walkerton Clean Water Centre: Selection of a Baffling Factor for CT Calculations",
        "url": "https://wcwc.ca/wp-content/uploads/2020/06/WCWC-Fact-Sheet_Vol-1_Issue-5_Baffling-Factor-Selection-for-CT-Calcs.pdf",
        "reviewedAt": "2026-11-26",
        "supports": "Baffles, short-circuiting, nominal detention, T10 and tracer assessment"
      },
      {
        "title": "British Columbia: Guidelines for Pathogen Log Reduction Credit Assignment",
        "url": "https://www2.gov.bc.ca/assets/gov/environment/air-land-water/water/waterquality/dwog_part_b_-_15_pathogen_log_reduction_credit_assignment.pdf",
        "reviewedAt": "2026-11-26",
        "supports": "Available volume, flow, baffling-adjusted T10 and endpoint residual CT"
      },
      {
        "title": "Health Canada: Chlorine Guideline Technical Document",
        "url": "https://www.canada.ca/en/health-canada/services/publications/healthy-living/guidelines-canadian-drinking-water-quality-chlorine-guideline-technical-document/page-3-guidelines-canadian-drinking-water-quality-chlorine-guideline-technical-document.html",
        "reviewedAt": "2026-11-26",
        "supports": "Chlorine demand, free residual, pH, temperature and pathogen-dependent CT"
      }
    ]
  },
  {
    "id": "uv-reactor",
    "slug": "uv-reactor",
    "moduleNumber": "06",
    "title": "Closed-vessel ultraviolet disinfection reactor",
    "shortTitle": "UV reactor",
    "eyebrow": "Drinking water disinfection",
    "summary": "Explore how a closed UV reactor exposes flowing water to germicidal light, and why flow, water quality and intensity monitoring matter together.",
    "stream": "water-treatment",
    "accent": "#0f766e",
    "sceneId": "uv-reactor",
    "relatedTopics": [
      "UV disinfection",
      "UV transmittance",
      "Multi-barrier treatment",
      "Flow and velocity",
      "Disinfection monitoring"
    ],
    "guideRoute": "/process",
    "practiceRoute": "/class1-water",
    "parts": [
      {
        "id": "inlet",
        "label": "Inlet connection",
        "color": "#38bdf8",
        "function": "Carries incoming water into the closed chamber and establishes its approach flow.",
        "operatorLens": "Trend measured reactor flow against the documented operating envelope and upstream water-quality changes.",
        "examConnection": "Flow rate and inlet hydraulics affect exposure; water entering the unit is not automatically disinfected."
      },
      {
        "id": "reactor",
        "label": "Reactor vessel",
        "color": "#0f766e",
        "function": "Contains the water and lamp assemblies within the hydraulic exposure chamber.",
        "operatorLens": "Watch operating status, pressure and temperature alarms under the plant SOP; keep protective interlocks in service.",
        "examConnection": "Different water paths receive different exposures, so reactor geometry and validation matter."
      },
      {
        "id": "lamps",
        "label": "Germicidal UV lamps",
        "color": "#a78bfa",
        "function": "Emit germicidal ultraviolet light that damages microbial DNA or RNA and reduces infectivity.",
        "operatorLens": "Trend lamp status and output indicators alongside intensity; electrical power alone does not establish performance.",
        "examConnection": "UV inactivates organisms rather than physically removing them. Lamp wattage is not delivered UV dose."
      },
      {
        "id": "sleeves",
        "label": "Quartz lamp sleeves",
        "color": "#cbd5e1",
        "function": "Separate lamps from the water while transmitting UV light into the chamber.",
        "operatorLens": "Consider sleeve fouling or aging when intensity trends decline; follow the site assessment procedure.",
        "examConnection": "Deposits can reduce light transmission even while lamps remain energized."
      },
      {
        "id": "sensor",
        "label": "UV intensity sensor",
        "color": "#f59e0b",
        "function": "Measures UV intensity at its sensing location for the reactor's monitoring strategy.",
        "operatorLens": "Compare intensity alarms with lamp status, flow and available UV transmittance data; escalate discrepancies through the SOP.",
        "examConnection": "A local intensity reading is not every organism's dose. Sensor condition can affect the indicated value."
      },
      {
        "id": "outlet",
        "label": "Outlet connection",
        "color": "#0369a1",
        "function": "Conveys exposed water onward through the treatment train.",
        "operatorLens": "Review off-specification alarms and the site's downstream water-protection status; never assume clear-looking water confirms disinfection.",
        "examConnection": "UV leaves no disinfectant residual to protect water against later contamination."
      }
    ],
    "stages": [
      {
        "id": "admit",
        "step": "01",
        "title": "Admit prepared water",
        "description": "Upstream treatment limits particles and absorbing substances. Water enters at a flow covered by the reactor's documented operating conditions.",
        "accent": "#38bdf8"
      },
      {
        "id": "expose",
        "step": "02",
        "title": "Expose organisms to UV",
        "description": "Light passes through quartz sleeves into flowing water. Microbial nucleic-acid damage produces inactivation; organisms are not strained out.",
        "accent": "#a78bfa"
      },
      {
        "id": "monitor",
        "step": "03",
        "title": "Monitor the barrier",
        "description": "The control strategy uses intensity, flow and lamp status, plus UV transmittance where applicable. Follow plant alarm-response and water-protection SOPs without overriding safeguards.",
        "accent": "#0f766e"
      }
    ],
    "formulas": [
      {
        "id": "inlet-velocity",
        "name": "Average inlet pipe velocity",
        "expression": "v = (Q / 3600) / A; A = πD² / 4",
        "terms": [
          {
            "symbol": "v",
            "meaning": "Average velocity in a full circular inlet pipe",
            "units": "m/s"
          },
          {
            "symbol": "Q",
            "meaning": "Volumetric flow",
            "units": "m3/h"
          },
          {
            "symbol": "A",
            "meaning": "Internal pipe cross-sectional area",
            "units": "m2"
          },
          {
            "symbol": "D",
            "meaning": "Internal pipe diameter",
            "units": "m"
          },
          {
            "symbol": "3600",
            "meaning": "Seconds per hour",
            "units": "s/h"
          },
          {
            "symbol": "π",
            "meaning": "Circle constant",
            "units": "dimensionless"
          }
        ],
        "worked": {
          "scenario": "An illustrative full inlet pipe carries 180 m3/h and has an internal diameter of 0.20 m.",
          "substitution": "Q / 3600 = 180 / 3600 = 0.050 m3/s; A = π × 0.20² / 4 = 0.031416 m2; v = 0.050 / 0.031416.",
          "result": "Average inlet velocity = 1.59 m/s."
        },
        "interpretation": "This supports flow-unit checks and hydraulic comparisons, not a recommended velocity. It does not represent velocity between sleeves or establish UV dose, pathogen reduction or compliance."
      }
    ],
    "symptoms": [
      {
        "id": "falling-intensity",
        "observation": "UV intensity declines while lamps indicate on.",
        "likelyCauses": [
          "Lower water UV transmittance",
          "Sleeve fouling or lamp aging",
          "Sensor-window fouling or measurement drift"
        ],
        "examPoint": "Lamp-on status does not prove adequate exposure; compare associated trends before assigning a cause."
      },
      {
        "id": "off-spec-alarm",
        "observation": "An off-specification alarm appears during a flow increase.",
        "likelyCauses": [
          "Flow exceeds the validated operating envelope",
          "Intensity insufficient for the current flow",
          "Incorrect flow indication"
        ],
        "examPoint": "Flow and intensity must be evaluated together. Use the plant's alarm-response SOP, not an assumed universal threshold."
      }
    ],
    "seo": {
      "title": "Closed-vessel UV Reactor Explained | Echelon Institute",
      "description": "Learn UV reactor components, intensity and transmittance monitoring, inlet velocity calculations and operator exam concepts.",
      "h1": "Inside a Closed-vessel UV Disinfection Reactor",
      "sections": [
        {
          "heading": "How UV disinfection differs from filtration",
          "paragraphs": [
            "The closed vessel directs water past UV lamps protected by quartz sleeves. Germicidal light damages microbial genetic material. Filtration removes particles, while UV primarily inactivates susceptible organisms. Upstream particle control helps limit shielding, and different pathogens have different UV sensitivities."
          ]
        },
        {
          "heading": "Why intensity and water quality matter together",
          "paragraphs": [
            "UV transmittance describes how much UV light passes through a specified water path. Visually clear water can still absorb UV. Lamp output, sleeves, water quality and hydraulics all influence exposure. Reactor-specific validation and monitoring, not lamp wattage or nominal volume divided by flow, support performance assessment.",
            "A sensor measures intensity at a location, not a microbial count. Follow the documented monitoring strategy and plant SOP when alarms occur. UV supplies no distribution residual, so downstream protection remains a separate treatment-train consideration."
          ]
        }
      ],
      "faq": [
        {
          "question": "Can UV dose be calculated from lamp wattage?",
          "answer": "No. Electrical wattage does not describe the light reaching each organism. Use the reactor-specific validated monitoring approach, accounting for its required operating inputs."
        },
        {
          "question": "Does a UV reactor remove microorganisms?",
          "answer": "UV primarily inactivates them through nucleic-acid damage rather than removing them. It also leaves no protective disinfectant residual downstream."
        }
      ]
    },
    "sources": [
      {
        "title": "British Columbia: Guidelines for Ultraviolet Disinfection of Drinking Water",
        "url": "https://www2.gov.bc.ca/assets/gov/environment/air-land-water/water/waterquality/dwog_part_b_-_16_ultraviolet_disinfection_of_drinking_water.pdf",
        "reviewedAt": "2026-11-26",
        "supports": "UV components, validation envelope, monitoring, fouling and no residual"
      },
      {
        "title": "Trojan Technologies: TrojanUVSwiftSC",
        "url": "https://www.trojantechnologies.com/en-US/products/trojanuv/trojanuvswiftsc",
        "reviewedAt": "2026-11-26",
        "supports": "Closed chamber, lamps, quartz sleeves and UV intensity instrumentation"
      },
      {
        "title": "Health Canada: Enteric Viruses Technical Document, page 8",
        "url": "https://www.canada.ca/en/health-canada/services/publications/healthy-living/guidelines-canadian-drinking-water-quality-guideline-technical-document-enteric-viruses/page-8-guidelines-canadian-drinking-water-quality-guideline-technical-document-enteric-viruses.html",
        "reviewedAt": "2026-11-26",
        "supports": "Particle shielding, pathogen-specific UV sensitivity and complementary barriers"
      }
    ]
  },
  {
    "id": "bar-screen",
    "slug": "bar-screen",
    "moduleNumber": "07",
    "title": "Mechanically cleaned wastewater bar screen",
    "shortTitle": "Bar screen",
    "eyebrow": "Preliminary treatment",
    "summary": "Explore how bars capture wastewater debris, a mechanical rake removes screenings, and channel observations reveal changing hydraulic resistance.",
    "stream": "wastewater-treatment",
    "accent": "#0f766e",
    "sceneId": "bar-screen",
    "relatedTopics": [
      "Preliminary treatment",
      "Screenings and grit",
      "Channel velocity",
      "Head loss",
      "Equipment safety"
    ],
    "guideRoute": "/wastewater",
    "practiceRoute": "/class1-ww",
    "parts": [
      {
        "id": "upstream",
        "label": "Upstream approach channel",
        "color": "#38bdf8",
        "function": "Directs incoming wastewater and debris toward the submerged bar rack.",
        "operatorLens": "Observe incoming debris, channel deposits and upstream level alongside flow and downstream level.",
        "examConnection": "Approach velocity depends on flow and wetted channel area. Low velocity can allow solids to settle before reaching the screen."
      },
      {
        "id": "bars",
        "label": "Screen bars and openings",
        "color": "#94a3b8",
        "function": "Retain debris intercepted by the bars while wastewater passes through the openings.",
        "operatorLens": "Watch visible accumulation and changing water-level difference at comparable flows. Blinding means openings are obstructed.",
        "examConnection": "Screening separates by physical interception. Debris accumulation restricts open area and increases hydraulic resistance."
      },
      {
        "id": "rake",
        "label": "Mechanical cleaning rake",
        "color": "#f59e0b",
        "function": "Engages captured debris and lifts it toward the discharge point using the screen's mechanical drive.",
        "operatorLens": "Observe cleaning-cycle indications, alarms and debris movement from designated safe locations. Follow plant SOPs for any abnormal condition.",
        "examConnection": "Mechanical cleaning removes screenings from the flow. It does not grind them like a comminutor; rake arrangements vary by design."
      },
      {
        "id": "screenings",
        "label": "Screenings discharge and handling",
        "color": "#a78bfa",
        "function": "Transfers lifted debris out of the channel to the installed collection or handling system.",
        "operatorLens": "Observe whether debris reaches its receiving system and whether discharge backs up. Do not reach into moving equipment.",
        "examConnection": "Screenings are a separate residual stream. Washing, dewatering and disposal are distinct from screening itself."
      },
      {
        "id": "downstream",
        "label": "Downstream screened-flow channel",
        "color": "#2dd4bf",
        "function": "Conveys screened wastewater to the next installed process, often grit removal.",
        "operatorLens": "Compare downstream level and escaping debris with upstream conditions. Backwater can raise both levels without proving screen blinding.",
        "examConnection": "Screening protects downstream equipment but does not replace grit removal, biological treatment or disinfection."
      }
    ],
    "stages": [
      {
        "id": "approach",
        "step": "01",
        "title": "Approach the rack",
        "description": "Wastewater enters the channel carrying a variable debris load. Flow and water depth affect its average approach velocity.",
        "accent": "#38bdf8"
      },
      {
        "id": "capture",
        "step": "02",
        "title": "Intercept debris",
        "description": "Bars retain intercepted material while liquid passes between them. Accumulating debris reduces the available opening area.",
        "accent": "#94a3b8"
      },
      {
        "id": "lift",
        "step": "03",
        "title": "Lift screenings",
        "description": "The cleaning mechanism lifts retained debris. Depending on the installation, operation may be timed or initiated by water-level controls.",
        "accent": "#f59e0b"
      },
      {
        "id": "transfer",
        "step": "04",
        "title": "Separate the streams",
        "description": "Screenings leave through the discharge system. Screened wastewater continues downstream, still requiring the remaining treatment processes.",
        "accent": "#2dd4bf"
      }
    ],
    "formulas": [
      {
        "id": "approach-velocity",
        "name": "Average approach-channel velocity",
        "expression": "v = Q / (86,400 x b x d)",
        "terms": [
          {
            "symbol": "v",
            "meaning": "Average velocity in the rectangular approach channel",
            "units": "m/s"
          },
          {
            "symbol": "Q",
            "meaning": "Flow through this channel",
            "units": "m3/day"
          },
          {
            "symbol": "b",
            "meaning": "Wetted channel width",
            "units": "m"
          },
          {
            "symbol": "d",
            "meaning": "Water depth at the approach section",
            "units": "m"
          },
          {
            "symbol": "86,400",
            "meaning": "Converts daily flow to seconds",
            "units": "s/day"
          }
        ],
        "worked": {
          "scenario": "A rectangular screen channel carries 25,920 m3/day at a width of 1.20 m and water depth of 0.50 m.",
          "substitution": "Q = 25,920 / 86,400 = 0.30 m3/s. Area = 1.20 x 0.50 = 0.60 m2. v = 0.30 / 0.60",
          "result": "Average approach velocity = 0.50 m/s"
        },
        "interpretation": "Use this value to relate channel deposits to hydraulic conditions. It is not velocity through bar openings, a head-loss calculation or an operating target. Compare with site design information and SOPs."
      }
    ],
    "symptoms": [
      {
        "id": "rising-differential",
        "observation": "Upstream level rises relative to downstream level at similar flow",
        "likelyCauses": [
          "Debris blinding the bar openings",
          "Cleaning mechanism not removing captured material",
          "Discharge blockage retaining screenings"
        ],
        "examPoint": "Increasing level difference suggests increasing restriction. Confirm flow and level readings; a high upstream level alone does not establish the cause."
      },
      {
        "id": "debris-carryover",
        "observation": "More rags or debris appear downstream",
        "likelyCauses": [
          "A bypass path carrying unscreened flow",
          "Damaged bars or openings",
          "High through-opening velocity forcing flexible debris through"
        ],
        "examPoint": "Capture depends on openings, debris characteristics and hydraulics. Use the plant's alarm and reporting SOP, not an improvised mechanical intervention."
      }
    ],
    "seo": {
      "title": "Wastewater Bar Screen Functions and Calculations | Echelon Institute",
      "description": "Learn mechanical bar-screen components, screenings handling, hydraulic observations and a metric channel-velocity example for wastewater operator exams.",
      "h1": "Inside a Mechanically Cleaned Wastewater Bar Screen",
      "sections": [
        {
          "heading": "What screening removes",
          "paragraphs": [
            "Bar screening is preliminary treatment that intercepts debris before it can obstruct or damage downstream equipment. The bars capture material; the rake transports it out. Screening does not remove dissolved pollutants in the way biological or chemical treatment does.",
            "Captured screenings need their own handling route. They are not equivalent to grit, which is separated by different physical behaviour in a dedicated process."
          ]
        },
        {
          "heading": "Reading hydraulic and mechanical clues",
          "paragraphs": [
            "Interpret levels with flow, rake status and discharge observations. A widening level difference at similar flow can indicate restriction, while downstream backwater can raise levels for another reason. A single observation is a clue, not a diagnosis.",
            "Use designated viewing positions and plant SOPs. Guards, hazardous atmospheres and automatic movement make this unsuitable for hands-on troubleshooting by learners. Cleaning cycles and alarm thresholds are installation-specific."
          ]
        }
      ],
      "faq": [
        {
          "question": "Does a mechanical bar screen remove grit?",
          "answer": "It may intercept some large particles, but it is not a substitute for dedicated grit removal. Its main role is debris capture and downstream equipment protection."
        },
        {
          "question": "Is approach velocity the velocity between the bars?",
          "answer": "No. Approach velocity uses the wetted channel area. Through-opening velocity uses the available open area, which bars and accumulated debris reduce."
        }
      ]
    },
    "sources": [
      {
        "title": "Ontario Design Guidelines: Preliminary Treatment and Primary Sedimentation",
        "url": "https://www.ontario.ca/document/design-guidelines-sewage-works/preliminary-treatment-and-primary-sedimentation",
        "reviewedAt": "2026-11-26",
        "supports": "Equipment protection, screenings handling, controls and safety"
      },
      {
        "title": "Lakeside Raptor Multi-Rake Bar Screen",
        "url": "https://www.lakeside-equipment.com/product/raptor-multi-rake-bar-screen/",
        "reviewedAt": "2026-11-26",
        "supports": "Rake teeth remove captured debris from bar openings"
      },
      {
        "title": "JWC Mechanical Bar Screen Monster",
        "url": "https://www.jwce.com/products/mechanical-bar-screen-monster/",
        "reviewedAt": "2026-11-26",
        "supports": "Reciprocating rake and separate screenings washing"
      },
      {
        "title": "Ovivo Brackett Green Continuous Chain Raked Bar Screen",
        "url": "https://www.ovivowater.com/en/product/brackett-green-continuous-chain-raked-bar/",
        "reviewedAt": "2026-11-26",
        "supports": "Rake ascent and debris discharge to conveyor"
      }
    ]
  },
  {
    "id": "grit-chamber",
    "slug": "grit-chamber",
    "moduleNumber": "08",
    "title": "Horizontal-flow wastewater grit chamber",
    "shortTitle": "Grit chamber",
    "eyebrow": "Preliminary treatment",
    "summary": "Explore how controlled horizontal flow lets dense grit settle while lighter organics continue toward treatment, then follow collected grit to classification.",
    "stream": "wastewater-treatment",
    "accent": "#0f766e",
    "sceneId": "grit-chamber",
    "relatedTopics": [
      "Preliminary treatment",
      "Selective settling",
      "Channel velocity",
      "Grit classification"
    ],
    "guideRoute": "/wastewater",
    "practiceRoute": "/class1-ww",
    "parts": [
      {
        "id": "inlet",
        "label": "Screened wastewater inlet",
        "color": "#0369a1",
        "function": "Introduces screened wastewater into the settling channel with limited turbulence.",
        "operatorLens": "Observe surging, uneven channel loading and debris accumulation from approved observation points.",
        "examConnection": "Screens retain debris by opening size; grit removal separates particles by settling behaviour."
      },
      {
        "id": "chamber",
        "label": "Horizontal settling channel",
        "color": "#0f766e",
        "function": "Provides a horizontal flow path where dense grit settles while most lighter organic solids remain suspended.",
        "operatorLens": "Compare flow, water depth and visible deposits with the plant's established operating pattern.",
        "examConnection": "Excessive velocity can carry grit through; insufficient velocity can allow unwanted organic settling."
      },
      {
        "id": "grit-hopper",
        "label": "Collected-grit hopper",
        "color": "#b45309",
        "function": "Provides a collection pocket for settled material before transfer to grit handling in this representative configuration.",
        "operatorLens": "Trend available accumulation indications and transfer records without reaching into equipment or entering the chamber.",
        "examConnection": "Settling and removal are separate functions. Captured grit must leave the process rather than accumulate indefinitely."
      },
      {
        "id": "classifier",
        "label": "Grit classifier and inclined screw",
        "color": "#7c3aed",
        "function": "Receives grit slurry, settles dense particles and conveys them up an inclined screw for dewatering; liquid returns to treatment.",
        "operatorLens": "Observe discharge quantity, wetness and organic content through the plant's approved checks.",
        "examConnection": "Classification and washing reduce water and organic carryover; they do not disinfect the grit."
      },
      {
        "id": "outlet",
        "label": "Outlet and hydraulic control",
        "color": "#0891b2",
        "function": "Passes wastewater onward; a suitable weir or channel control helps relate water depth to changing flow.",
        "operatorLens": "Watch outlet levels, obstructions and downstream backwater against site records.",
        "examConnection": "Hydraulic controls influence channel velocity. Grit removal does not replace primary or biological treatment."
      }
    ],
    "stages": [
      {
        "id": "admit",
        "step": "01",
        "title": "Admit screened flow",
        "description": "Wastewater enters the channel. Limited inlet turbulence supports the intended settling path.",
        "accent": "#0369a1"
      },
      {
        "id": "separate",
        "step": "02",
        "title": "Separate by settling",
        "description": "Dense particles fall through the moving water. Particle size, density and hydraulic conditions affect capture.",
        "accent": "#0f766e"
      },
      {
        "id": "collect",
        "step": "03",
        "title": "Collect settled grit",
        "description": "Collected material moves toward the hopper for transfer. The main wastewater stream continues through the outlet.",
        "accent": "#b45309"
      },
      {
        "id": "classify",
        "step": "04",
        "title": "Classify and dewater",
        "description": "The classifier separates grit from liquid and lifts it toward disposal handling under the plant's procedures.",
        "accent": "#7c3aed"
      }
    ],
    "formulas": [
      {
        "id": "channel-velocity",
        "name": "Mean horizontal channel velocity",
        "expression": "v = Q / A",
        "terms": [
          {
            "symbol": "v",
            "meaning": "Mean horizontal water velocity",
            "units": "m/s"
          },
          {
            "symbol": "Q",
            "meaning": "Flow through the channel being assessed",
            "units": "m3/s"
          },
          {
            "symbol": "A",
            "meaning": "Wetted cross-sectional area perpendicular to flow, not plan area",
            "units": "m2"
          }
        ],
        "worked": {
          "scenario": "One hypothetical channel carries 0.20 m3/s through a wetted cross-sectional area of 0.80 m2.",
          "substitution": "v = 0.20 m3/s / 0.80 m2",
          "result": "v = 0.25 m/s"
        },
        "interpretation": "This average helps compare hydraulic loading with site design and operating records. It is not a recommended target or a capture-efficiency prediction; local turbulence and particle settling still matter."
      }
    ],
    "symptoms": [
      {
        "id": "grit-carryover",
        "observation": "More grit appears in downstream units despite little recovered grit.",
        "likelyCauses": [
          "Higher channel velocity or uneven flow splitting",
          "Inlet turbulence or short-circuiting",
          "Accumulated grit or interrupted collection and transfer"
        ],
        "examPoint": "Low recovered quantity alone does not prove low influent grit. Relate capture observations to hydraulics and removal records."
      },
      {
        "id": "organic-grit",
        "observation": "Recovered grit contains more organic material than the plant's usual samples.",
        "likelyCauses": [
          "Low-flow conditions allowing lighter solids to settle",
          "Changed influent solids composition",
          "Reduced classifier or washing separation performance"
        ],
        "examPoint": "Selective removal aims to capture grit without unnecessarily removing biodegradable solids. Appearance is a clue, not a confirmed cause."
      }
    ],
    "seo": {
      "title": "Horizontal-flow Grit Chamber Explained | Echelon Institute",
      "description": "Learn selective grit settling, component functions, operator observations and a worked metric channel-velocity example for wastewater certification.",
      "h1": "Inside a Horizontal-flow Wastewater Grit Chamber",
      "sections": [
        {
          "heading": "Why grit removal comes early",
          "paragraphs": [
            "Sand and other dense particles can abrade downstream equipment and accumulate in treatment tanks. A horizontal-flow chamber uses controlled water movement to let grit settle while retaining most lighter organics in the wastewater. Unlike a primary clarifier, its purpose is selective grit capture rather than broad removal of settleable organic solids."
          ]
        },
        {
          "heading": "Read the process, not one observation",
          "paragraphs": [
            "This model represents a channel with a collection hopper and separate classifier. Actual plants may use different collector arrangements. Compare flow, depth, recovered material and downstream deposits together before assigning a cause.",
            "Use plant SOPs for observations, sampling and reporting abnormal conditions. Do not enter chambers, bypass guarding or change hydraulic controls from this lesson. Site authorization and applicable safety procedures govern any intervention."
          ]
        }
      ],
      "faq": [
        {
          "question": "Does a grit chamber remove all suspended solids?",
          "answer": "No. It preferentially captures particles that settle under its hydraulic conditions. Much organic material remains for subsequent treatment, and fine or low-density grit can escape."
        },
        {
          "question": "Does the worked velocity prove effective grit capture?",
          "answer": "No. Mean velocity describes water movement, not removal efficiency. Particle properties, flow distribution and collection performance also affect the outcome; compare with site-specific evidence."
        }
      ]
    },
    "sources": [
      {
        "title": "Ontario Design Guidelines for Sewage Works: Preliminary Treatment and Primary Sedimentation",
        "url": "https://www.ontario.ca/document/design-guidelines-sewage-works/preliminary-treatment-and-primary-sedimentation",
        "reviewedAt": "2026-11-26",
        "supports": "Channel hydraulics, selective settling and grit handling"
      },
      {
        "title": "KWS Environmental Grit Classifiers",
        "url": "https://www.kwsmfg.com/kws-environmental/grit-classifiers/",
        "reviewedAt": "2026-11-26",
        "supports": "Gravity classification, inclined screw and liquid return"
      },
      {
        "title": "WSG Link-Belt Type S Grit Collector",
        "url": "https://www.wsgandsolutions.com/grit-removal/horizontal-flow-grit-collectors/link-belt-type-s-grit-collector",
        "reviewedAt": "2026-11-26",
        "supports": "Horizontal channel collection and organic separation"
      }
    ]
  },
  {
    "id": "lift-station",
    "slug": "lift-station",
    "moduleNumber": "09",
    "title": "Duplex submersible wastewater lift station",
    "shortTitle": "Duplex lift station",
    "eyebrow": "Wastewater collection",
    "summary": "Explore how a wet well, two submersible pumps and level controls move collected wastewater into a pressurized forcemain.",
    "stream": "wastewater-collection",
    "accent": "#0f766e",
    "sceneId": "lift-station",
    "relatedTopics": [
      "Collection-system hydraulics",
      "Lead and lag pump control",
      "Wet-well storage",
      "Pump and system-head curves",
      "High-level alarms"
    ],
    "guideRoute": "/collection-guide",
    "practiceRoute": "/class1-wastewater-coll",
    "parts": [
      {
        "id": "inlet",
        "label": "Gravity sewer inlet",
        "color": "#38bdf8",
        "function": "Delivers collected wastewater by gravity into the wet well.",
        "operatorLens": "Compare incoming-flow patterns with rainfall and upstream reports; unusual surges can change cycling.",
        "examConnection": "Inflow can continue during pumping, so level decline measures net removal rather than total discharge."
      },
      {
        "id": "wet-well",
        "label": "Wet well",
        "color": "#0f766e",
        "function": "Holds wastewater between pumping cycles and provides liquid to the pump intakes.",
        "operatorLens": "Trend level and cycle duration; note reported solids accumulation and odour through approved observations.",
        "examConnection": "Usable cycling volume is the volume between control elevations, not the entire structure."
      },
      {
        "id": "pump",
        "label": "Duplex submersible pumps",
        "color": "#f59e0b",
        "function": "Two sewage-duty centrifugal pumps add hydraulic energy to overcome elevation and piping losses.",
        "operatorLens": "Compare each pump's runtime, discharge response and fault history under similar conditions.",
        "examConnection": "Duplex means two pumps. Firm capacity describes available capacity with the largest unit unavailable."
      },
      {
        "id": "riser",
        "label": "Discharge riser",
        "color": "#0369a1",
        "function": "Carries pumped wastewater upward from each pump toward the discharge header and forcemain.",
        "operatorLens": "Relate discharge pressure and flow trends to wet-well level and downstream conditions.",
        "examConnection": "Total dynamic head includes static lift and friction losses; pipe height alone does not describe it."
      },
      {
        "id": "check-valve",
        "label": "Discharge check valve",
        "color": "#ef4444",
        "function": "Allows forward discharge and closes against reverse flow through the stopped pump's branch.",
        "operatorLens": "Note abnormal shutdown noise or a rapid level rebound that may suggest returning discharge.",
        "examConnection": "A check valve provides nonreturn action, not pressure regulation; a separate isolation valve serves a different purpose."
      },
      {
        "id": "level-sensor",
        "label": "Wet-well level sensing",
        "color": "#a855f7",
        "function": "Reports liquid level to controls for pump sequencing and alarms.",
        "operatorLens": "Compare level trends with pump status; erratic indications may reflect turbulence or sensing faults.",
        "examConnection": "Level control initiates operation, but a run indication alone does not prove flow."
      }
    ],
    "stages": [
      {
        "id": "collect",
        "step": "01",
        "title": "Collect gravity inflow",
        "description": "Wastewater enters the wet well and raises its level while pumps are stopped.",
        "accent": "#38bdf8"
      },
      {
        "id": "lead",
        "step": "02",
        "title": "Start the lead pump",
        "description": "At the configured start level, controls call the lead pump. Alternation shares duty according to site logic.",
        "accent": "#0f766e"
      },
      {
        "id": "lag",
        "step": "03",
        "title": "Respond to rising level",
        "description": "If level continues rising, configured logic may call the lag pump; high-level alarms require the plant's response SOP.",
        "accent": "#f59e0b"
      },
      {
        "id": "drawdown",
        "step": "04",
        "title": "Draw down and stop",
        "description": "Discharge exceeding inflow lowers the level. Controls stop pumps at site-defined elevations and check valves resist reverse flow.",
        "accent": "#0369a1"
      }
    ],
    "formulas": [
      {
        "id": "drawdown-discharge",
        "name": "Pump discharge from wet-well drawdown",
        "expression": "Qp = (A × Δh / t) + Qin",
        "terms": [
          {
            "symbol": "Qp",
            "meaning": "Estimated pump discharge",
            "units": "m3/min"
          },
          {
            "symbol": "A",
            "meaning": "Constant horizontal wet-well area over the interval",
            "units": "m2"
          },
          {
            "symbol": "Δh",
            "meaning": "Observed level decrease",
            "units": "m"
          },
          {
            "symbol": "t",
            "meaning": "Elapsed observation time",
            "units": "min"
          },
          {
            "symbol": "Qin",
            "meaning": "Approximately steady, independently estimated inflow",
            "units": "m3/min"
          }
        ],
        "worked": {
          "scenario": "Recorded operation shows one pump lowering level by 0.60 m in 3.0 min in a constant-area 6.0 m2 wet well. Continuing inflow is 0.40 m3/min, with no returning discharge.",
          "substitution": "Qp = (6.0 × 0.60 / 3.0) + 0.40 = 1.20 + 0.40",
          "result": "Estimated pump discharge = 1.60 m3/min"
        },
        "interpretation": "Net drawdown is only 1.20 m3/min. Adding continuing inflow estimates actual discharge for comparison with historical performance. Changing area or inflow weakens the estimate; do not alter controls to reproduce this hypothetical example."
      }
    ],
    "symptoms": [
      {
        "id": "rising-level",
        "observation": "Wet-well level rises while a pump is indicated as running.",
        "likelyCauses": [
          "Inflow exceeds available discharge",
          "Pump blockage or reduced performance",
          "Discharge restriction or higher system head",
          "Incorrect level or run-status indication"
        ],
        "examPoint": "A rising level means storage is increasing, unless the indication is faulty. Compare flow and status before attributing a cause."
      },
      {
        "id": "rapid-rebound",
        "observation": "Level rebounds unusually quickly after shutdown, with frequent restarts.",
        "likelyCauses": [
          "Check-valve leakage returning discharge",
          "A genuine inflow surge",
          "Unstable level sensing or control sequencing"
        ],
        "examPoint": "Frequent starts are a symptom, not proof of valve failure. Compare cycles with inflow history and follow the station SOP."
      }
    ],
    "seo": {
      "title": "Duplex Wastewater Lift Station Equipment Lab | Echelon Institute",
      "description": "Explore duplex lift-station components and a metric drawdown calculation for wastewater collection exams.",
      "h1": "Inside a duplex submersible wastewater lift station",
      "sections": [
        {
          "heading": "Why wastewater needs a lift station",
          "paragraphs": [
            "A lift station moves sewage beyond gravity's reach. Pumps deliver wet-well wastewater into a pressurized forcemain. This is conveyance, not treatment. Performance depends on pump and system-head characteristics.",
            "Two pumps support alternating duty and availability, but simultaneous operation does not automatically double flow. Both discharge against a shared system whose friction losses change with flow."
          ]
        },
        {
          "heading": "Read operating trends safely",
          "paragraphs": [
            "Compare level, starts, runtime, flow and alarms together. A longer run may reflect higher inflow or reduced discharge, so one signal rarely confirms the cause. Start, stop and alarm elevations belong to the engineered station and plant SOP, not a universal setting.",
            "Use approved monitoring locations and the plant's alarm escalation procedures. Wet wells can contain hazardous atmospheres and other confined-space hazards. This module does not authorize entry, equipment handling or bypassing protective controls; site safety procedures govern real work."
          ]
        }
      ],
      "faq": [
        {
          "question": "What is the difference between lead and lag pumps?",
          "answer": "The lead pump is called first. The lag pump is called when configured conditions require additional capacity. Alternation changes which pump leads; the exact sequence is station-specific."
        },
        {
          "question": "Does wet-well drawdown equal pump flow?",
          "answer": "Only when inflow and other volume changes are negligible. With continuing inflow, falling stored volume gives net removal. Add a reliable inflow estimate to obtain discharge under the example's assumptions."
        }
      ]
    },
    "sources": [
      {
        "title": "Ontario: Sewage pumping stations, Design Guidelines for Sewage Works",
        "url": "https://www.ontario.ca/document/design-guidelines-sewage-works/sewage-pumping-stations",
        "reviewedAt": "2026-11-26",
        "supports": "Duplex capacity, wet wells, level controls, discharge valves and alarms"
      },
      {
        "title": "Xylem Flygt: Standardized Pump Stations",
        "url": "https://www.xylem.com/en-us/brands/flygt/flygt-engineering--expertise/pump-station-design/flygt-standarized-pump-stations/",
        "reviewedAt": "2026-11-26",
        "supports": "Wet-well hydraulics, varying inflow and solids accumulation"
      },
      {
        "title": "AVK: Check valves in water and wastewater systems",
        "url": "https://www.avkvalves.eu/en/insights/product-insights/check-valves/introduction-check-valves",
        "reviewedAt": "2026-11-26",
        "supports": "One-way discharge, reverse-flow prevention and shutdown transients"
      }
    ]
  },
  {
    "id": "pressure-reducing-valve",
    "slug": "pressure-reducing-valve",
    "sceneId": "pressure-reducing-valve",
    "moduleNumber": "10",
    "title": "Pilot-operated water pressure reducing valve",
    "shortTitle": "Pressure reducing valve",
    "eyebrow": "Distribution pressure control",
    "summary": "Explore how a downstream-sensing pilot controls a diaphragm valve to reduce water pressure while responding to changing demand.",
    "stream": "water-distribution",
    "accent": "#0f766e",
    "relatedTopics": [
      "Distribution pressure zones",
      "Hydraulic pressure differences",
      "Pilot-operated control valves",
      "Cross-connection and backflow protection"
    ],
    "guideRoute": "/distribution-guide",
    "practiceRoute": "/class1-water-dist",
    "parts": [
      {
        "id": "inlet",
        "label": "High-pressure inlet",
        "color": "#0369a1",
        "function": "Admits upstream water and supplies hydraulic energy for main flow and the pilot control circuit.",
        "operatorLens": "Compare inlet pressure with outlet pressure and demand trends; falling supply pressure can limit downstream service.",
        "examConnection": "A reducing valve dissipates available pressure energy. It cannot boost an inadequate upstream supply."
      },
      {
        "id": "strainer",
        "label": "Pilot-circuit strainer",
        "color": "#d97706",
        "function": "Screens control water to limit particles entering the small pilot passages; some stations also have a separate line strainer.",
        "operatorLens": "Note impaired regulation or available strainer differential-pressure trends and report them through the plant SOP.",
        "examConnection": "Restricted pilot water can disrupt hydraulic control even when the main pipeline still carries water."
      },
      {
        "id": "diaphragm",
        "label": "Main diaphragm assembly",
        "color": "#14b8a6",
        "function": "Converts hydraulic pressure forces into movement of the main valve disc, changing the flow opening.",
        "operatorLens": "Relate any installed position indication to pressure and flow trends rather than diagnosing from position alone.",
        "examConnection": "Relieving cover pressure permits inlet pressure to open the valve; applying inlet pressure to the cover closes it."
      },
      {
        "id": "spring",
        "label": "Pilot reference spring",
        "color": "#a855f7",
        "function": "Provides the pilot's reference force opposing sensed downstream pressure on the pilot diaphragm.",
        "operatorLens": "Use documented station targets when interpreting readings; do not change spring compression outside authorized procedures.",
        "examConnection": "The spring establishes the pilot pressure reference, while hydraulic forces operate the larger main valve."
      },
      {
        "id": "pilot",
        "label": "Pressure reducing pilot",
        "color": "#0284c7",
        "function": "Senses downstream pressure and meters control-water discharge from the main cover chamber toward the outlet.",
        "operatorLens": "Watch for delayed response, cycling or pressure drifting away from the documented operating profile.",
        "examConnection": "The pilot provides feedback: rising outlet pressure closes it, increasing cover pressure and throttling main flow."
      },
      {
        "id": "outlet",
        "label": "Regulated-pressure outlet",
        "color": "#22c55e",
        "function": "Delivers water into the lower-pressure zone and provides the downstream pressure signal for regulation.",
        "operatorLens": "Trend outlet pressure during varying demand and correlate station readings with remote zone measurements.",
        "examConnection": "Controlled outlet pressure is not proof of nonreturn capability or protection against contaminated backflow."
      }
    ],
    "stages": [
      {
        "id": "supply",
        "step": "01",
        "title": "Supply hydraulic energy",
        "description": "Higher-pressure water enters the valve. A restricted control-water feed supplies the cover chamber through the pilot circuit.",
        "accent": "#0369a1"
      },
      {
        "id": "sense",
        "step": "02",
        "title": "Sense downstream pressure",
        "description": "The pilot balances downstream pressure force against its spring reference. Falling outlet pressure allows the pilot to open further.",
        "accent": "#0284c7"
      },
      {
        "id": "respond",
        "step": "03",
        "title": "Move the diaphragm",
        "description": "Opening the pilot releases cover water toward the outlet, allowing the main valve to open. Closing the pilot raises cover pressure and throttles flow.",
        "accent": "#14b8a6"
      },
      {
        "id": "balance",
        "step": "04",
        "title": "Modulate with demand",
        "description": "The feedback loop settles at an intermediate opening as demand changes, provided supply pressure and the valve's operating range are adequate.",
        "accent": "#0f766e"
      }
    ],
    "formulas": [
      {
        "id": "pressure-difference",
        "name": "Measured pressure reduction",
        "expression": "ΔP = P_in - P_out",
        "terms": [
          {
            "symbol": "ΔP",
            "meaning": "Difference between simultaneous pressure readings",
            "units": "kPa"
          },
          {
            "symbol": "P_in",
            "meaning": "Upstream gauge pressure",
            "units": "kPa"
          },
          {
            "symbol": "P_out",
            "meaning": "Downstream gauge pressure",
            "units": "kPa"
          }
        ],
        "worked": {
          "scenario": "Hypothetical readings at steady flow are 650 kPa upstream and 420 kPa downstream, with taps at comparable elevations and pipe velocities. Neither value is a recommended target.",
          "substitution": "ΔP = 650 kPa - 420 kPa",
          "result": "ΔP = 230 kPa"
        },
        "interpretation": "This approximates the valve pressure drop under the stated conditions. Trend it with flow and outlet pressure; the difference alone cannot confirm successful regulation or establish cavitation risk."
      }
    ],
    "symptoms": [
      {
        "id": "outlet-pressure-rises",
        "observation": "Outlet pressure rises above the documented operating profile",
        "likelyCauses": [
          "Debris or wear preventing the main seat from sealing",
          "Pilot obstruction holding it open",
          "Restricted control-water supply or damaged main diaphragm"
        ],
        "examPoint": "Pressure creep can indicate failure to close. Correlate instrument readings and report through the SOP; these possibilities are not a diagnosis."
      },
      {
        "id": "pressure-cycles",
        "observation": "Outlet pressure repeatedly cycles instead of settling",
        "likelyCauses": [
          "Very low flow outside stable operating conditions",
          "Air affecting the cover chamber or pilot tubing",
          "Pilot movement impaired by mechanical obstruction"
        ],
        "examPoint": "Hunting is a control-response symptom. Follow the station SOP rather than attempting unapproved pilot adjustments."
      }
    ],
    "seo": {
      "title": "Pilot-operated Water Pressure Reducing Valve | Echelon Institute",
      "description": "Learn pilot-controlled diaphragm operation, pressure-drop calculations and safe observations for water distribution operator exam preparation.",
      "h1": "Inside a Pilot-operated Water Pressure Reducing Valve",
      "sections": [
        {
          "heading": "Pressure regulation is hydraulic feedback",
          "paragraphs": [
            "A pilot-operated PRV uses a small downstream-sensing regulator to control a larger diaphragm valve. It changes the main opening rather than fixing flow at one value. Operators interpret inlet pressure, outlet pressure and demand together. A stable station outlet does not guarantee identical pressure everywhere in the zone because elevation and pipe losses also matter."
          ]
        },
        {
          "heading": "Pressure reduction is not backflow protection",
          "paragraphs": [
            "An ordinary reducing function does not establish nonreturn protection. Some designs add a check feature for pressure reversal, but that feature is not automatically a substitute for the site's required cross-connection protection. Use the station schematic, equipment documentation and plant SOP to identify each device's role. Do not infer protection or regulatory approval from the PRV name."
          ]
        }
      ],
      "faq": [
        {
          "question": "What happens when downstream pressure falls?",
          "answer": "The pilot opens further, allowing cover water to discharge toward the outlet. Lower cover pressure lets inlet pressure open the main diaphragm valve further, within its hydraulic limits."
        },
        {
          "question": "What downstream pressure should a PRV maintain?",
          "answer": "There is no universal setpoint. The documented station target reflects the pressure-zone design and operating requirements. This teaching example is not a setting instruction; real actions follow the plant SOP."
        }
      ]
    },
    "sources": [
      {
        "title": "Cla-Val 90-01/690-01 quick manual",
        "url": "https://www.cla-val.com/wp-content/uploads/2020/05/90-01-690-01-Quick-Manual.pdf",
        "reviewedAt": "2026-11-26",
        "supports": "Pilot regulation and possible control-failure symptoms"
      },
      {
        "title": "Cla-Val 90-01H/690-01H datasheet",
        "url": "https://www.cla-val.com/wp-content/uploads/2021/01/E-90-01H.pdf",
        "reviewedAt": "2026-11-26",
        "supports": "Strainers, optional reverse-flow check feature and sizing variables"
      },
      {
        "title": "Cla-Val CRD pressure reducing pilot controls",
        "url": "https://www.cla-val.com/fire-protection/pilots-and-accessories/crd",
        "reviewedAt": "2026-11-26",
        "supports": "Pilot diaphragm and reference-spring force balance"
      },
      {
        "title": "Cla-Val 100-06 Hytrol main valve datasheet",
        "url": "https://www.cla-val.co.uk/wp-content/uploads/2019/03/100061DE.pdf",
        "reviewedAt": "2026-11-26",
        "supports": "Cover-chamber pressure opens, closes and modulates main valve"
      }
    ]
  }
];
