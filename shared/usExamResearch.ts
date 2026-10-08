import type { USStateResearch } from "./usExamRouting";
/** Official program evidence retrieved October 3-4, 2026. Unresolved claims do not enable state-matched links. Georgia has verified standardized subsets with unresolved specialist exams, recorded as mixed. */
export const US_EXAM_RESEARCH: USStateResearch[] = [
  {
    "code": "AL",
    "dedicatedCourseNeeds": [
      "No separate Alabama-authored or WPI-customized exam course is established by the opened evidence. An Alabama routing/regulations supplement is supported: distinguish Water Grade I distribution from treatment Grades II–IV; map treatment Grades II and III to WPI Classes 1 and 2; distinguish Wastewater Grade I lagoons from Grade I (C) collection; use ADEM Division 335-10 for local classifications, staffing, and certification requirements."
    ],
    "limits": [
      "Requested cutoff: October 3, 2026. Live official pages were retrieved October 4, 2026; no archived cutoff-day snapshot was acquired, so exact October 3 page text cannot be guaranteed.",
      "verifiedSharedLevels contains WPI class numbers, not automatic same-number Alabama grades. Water Treatment Grade IV and Wastewater Treatment Grades II–IV remain unverified for exact class correspondence within the eight distinct sources opened.",
      "The state-hosted rules PDF is labeled revised effective April 3, 2007 and remains linked by ADEM’s current certification page. No later-effective replacement was established in this bounded review.",
      "Standardized status rests on ADEM’s explicit national-standardization statement plus its grade-specific WPI mappings/outlines - not membership, contact listings, reciprocity, PSI delivery alone, or generic ABC content.",
      "Division 335-10 excludes systems that do not offer service to the public generally. WPI outlines themselves warn that other jurisdictions may use older or customized exams; ADEM’s adoption evidence is therefore essential."
    ],
    "name": "Alabama",
    "streams": [
      {
        "authorityName": "Alabama Department of Environmental Management (ADEM), Water Division  -  Operator Certification Program",
        "authorityUrl": "https://adem.alabama.gov/water/opcert",
        "examSystem": "wpi-standardized",
        "localLevels": "Water Grade II  -  basic groundwater treatment; Water Grade III  -  advanced groundwater treatment; Water Grade IV  -  surface water treatment.",
        "note": "Shared-level numbers denote WPI classes, not Alabama grades: Alabama Water Grade II explicitly uses WPI Water Treatment Class 1; Grade III explicitly uses Class 2. Grade IV exists, but its WPI class correspondence remains unverified in the opened sources. Alabama Water Grade I belongs to distribution, not treatment. Mandatory certification applies to covered public systems.",
        "sources": [
          {
            "evidence": "ADEM explicitly states: ‘All of Alabama’s certification exams are standardized national exams administered by PSI.’ This is exam-standardization evidence, not merely a PSI delivery reference.",
            "title": "ADEM  -  Exam Resources",
            "url": "https://adem.alabama.gov/water/opcert/exam-resources"
          },
          {
            "evidence": "Public exam table states: ‘Alabama Water Treatment Grade II uses WPI’s Water Treatment Class 1 exam’ and ‘Alabama Water Treatment Grade III uses WPI’s Water Treatment Class 2 exam.’",
            "title": "ADEM  -  OpCert Online Home Page",
            "url": "https://prd.adem.alabama.gov/opcert/"
          },
          {
            "evidence": "Rule 335-10-1-.03 lists treatment Grades II basic groundwater, III advanced groundwater, and IV surface water. Rule .04 requires certified operators for covered systems.",
            "title": "ADEM Administrative Code, Division 335-10  -  Operator Certification",
            "url": "https://adem.alabama.gov/sites/default/files/legacyfiles/alEnviroRegLaws/files/Division10.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": [
          1,
          2
        ]
      },
      {
        "authorityName": "Alabama Department of Environmental Management (ADEM), Water Division  -  Operator Certification Program",
        "authorityUrl": "https://adem.alabama.gov/water/opcert",
        "examSystem": "wpi-standardized",
        "localLevels": "Water Grade I  -  water distribution system; one listed distribution grade.",
        "note": "Alabama Water Grade I maps to WPI standardized Water Distribution Class I: ADEM’s grade-specific public exam link opens that exact outline. Do not advertise Alabama distribution Grades II–IV from WPI’s broader class catalog. Mandatory certification applies to covered public systems.",
        "sources": [
          {
            "evidence": "Rule 335-10-1-.03 lists ‘WATER DISTRIBUTION SYSTEMS  -  I  -  Water distribution system  -  ALL’; Rule .04 requires a certified operator.",
            "title": "ADEM Administrative Code, Division 335-10  -  Operator Certification",
            "url": "https://adem.alabama.gov/sites/default/files/legacyfiles/alEnviroRegLaws/files/Division10.pdf"
          },
          {
            "evidence": "The ‘Water Grade I’ link in ADEM’s Water Exam Need-To-Know table points to its NTK WT1.pdf.",
            "title": "ADEM  -  OpCert Online Home Page",
            "url": "https://prd.adem.alabama.gov/opcert/"
          },
          {
            "evidence": "The linked document explicitly covers the ‘Standardized Water Distribution Operator Class I exam’ and distinguishes that exam from WPI’s customized exam services.",
            "title": "WPI  -  Water Distribution Operator Class I Need-to-Know Criteria, hosted by ADEM",
            "url": "https://adem.alabama.gov/sites/default/files/2025-08/NTK%20WT1.pdf"
          },
          {
            "evidence": "ADEM states all Alabama certification exams are standardized national exams, establishing adoption alongside its grade-specific outline link.",
            "title": "ADEM  -  Exam Resources",
            "url": "https://adem.alabama.gov/water/opcert/exam-resources"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": [
          1
        ]
      },
      {
        "authorityName": "Alabama Department of Environmental Management (ADEM), Water Division  -  Operator Certification Program",
        "authorityUrl": "https://adem.alabama.gov/water/opcert",
        "examSystem": "wpi-standardized",
        "localLevels": "Wastewater Grade I  -  wastewater treatment lagoons; Wastewater Grade II, Grade III, and Grade IV  -  trickling-filter/biological-contactor and activated-sludge plants classified by process and capacity.",
        "note": "Alabama Wastewater Grade I maps to WPI standardized Wastewater Treatment Class I through ADEM’s exact grade-specific outline link; it is not demonstrated to be a separate lagoon-only examination. Grade II–IV class correspondences remain unverified because their linked outlines were not opened. ADEM’s blanket statement establishes national standardization, but does not itself establish those class mappings. Mandatory certification applies to covered public systems.",
        "sources": [
          {
            "evidence": "Rule 335-10-1-.03 independently lists wastewater treatment Grades I–IV, with Grade I for lagoons and Grades II–IV for specified biological processes and capacities; Rule .04 requires certified operation.",
            "title": "ADEM Administrative Code, Division 335-10  -  Operator Certification",
            "url": "https://adem.alabama.gov/sites/default/files/legacyfiles/alEnviroRegLaws/files/Division10.pdf"
          },
          {
            "evidence": "ADEM’s Wastewater Exam Need-to-know table links ‘Wastewater Grade I’ to NTK WWT1.pdf and separately lists Wastewater Grades II, III, and IV.",
            "title": "ADEM  -  OpCert Online Home Page",
            "url": "https://prd.adem.alabama.gov/opcert/"
          },
          {
            "evidence": "The linked outline explicitly covers the ‘Standardized Wastewater Treatment Operator Class I exam’ and distinguishes standardized from customized exams. Its tasks include lagoons and other wastewater processes.",
            "title": "WPI  -  Wastewater Treatment Operator Class I Need-to-Know Criteria, hosted by ADEM",
            "url": "https://adem.alabama.gov/sites/default/files/2025-08/NTK%20WWT1.pdf"
          },
          {
            "evidence": "ADEM states: ‘All of Alabama’s certification exams are standardized national exams administered by PSI.’",
            "title": "ADEM  -  Exam Resources",
            "url": "https://adem.alabama.gov/water/opcert/exam-resources"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": [
          1
        ]
      },
      {
        "authorityName": "Alabama Department of Environmental Management (ADEM), Water Division  -  Operator Certification Program",
        "authorityUrl": "https://adem.alabama.gov/water/opcert",
        "examSystem": "wpi-standardized",
        "localLevels": "Grade I (C)  -  public wastewater collection systems; portal exam label ‘Wastewater 1C’; one listed collection grade.",
        "note": "Alabama Grade I (C)/Wastewater 1C maps to WPI standardized Wastewater Collection Class I through ADEM’s exact grade-specific outline link. This is a mandatory ADEM certification stream for covered public collection systems, not merely a voluntary association credential. No Alabama collection Grades II–IV are established by these rules.",
        "sources": [
          {
            "evidence": "Rule 335-10-1-.03 lists ‘PUBLIC WASTEWATER COLLECTION SYSTEMS  -  I (C)  -  Public wastewater collection systems  -  ALL’; Rules .04 and .06 expressly cover collection-system certification.",
            "title": "ADEM Administrative Code, Division 335-10  -  Operator Certification",
            "url": "https://adem.alabama.gov/sites/default/files/legacyfiles/alEnviroRegLaws/files/Division10.pdf"
          },
          {
            "evidence": "ADEM’s Wastewater Exam Need-to-know table separately links ‘Wastewater 1C’ to NTK WWIC.pdf.",
            "title": "ADEM  -  OpCert Online Home Page",
            "url": "https://prd.adem.alabama.gov/opcert/"
          },
          {
            "evidence": "The linked document explicitly covers the ‘Standardized Wastewater Collection Operator Class I exam’ and states it is reflective only of that standardized exam, distinguishing customized services.",
            "title": "WPI  -  Wastewater Collection Operator Class I Need-to-Know Criteria, hosted by ADEM",
            "url": "https://adem.alabama.gov/sites/default/files/2025-08/NTK%20WWIC.pdf"
          },
          {
            "evidence": "ADEM explicitly states all Alabama certification exams are standardized national exams.",
            "title": "ADEM  -  Exam Resources",
            "url": "https://adem.alabama.gov/water/opcert/exam-resources"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": [
          1
        ]
      }
    ]
  },
  {
    "code": "AK",
    "dedicatedCourseNeeds": [
      "Separate Alaska Small Untreated and Small Treated Water System exam-preparation routes, using DEC's linked exam description, Alaska small-system operator manual and formula/conversion sheet. These in-house exams must not be routed as WPI Class I. DEC correspondence courses also have a specified role as an alternative to the experience requirement; ordinary exam preparation should not be represented as that approved alternative.",
      "Separate Alaska Wastewater Stabilization Pond exam preparation using DEC's WWSP exam description, formula sheet and study guide, addressing the local unaerated-lagoon classification and certification thresholds. Do not route WWSP as a WPI Class I exam."
    ],
    "limits": [
      "As-of target: October 3, 2026. Live official pages were opened at tool timestamps October 4, 2026 Eastern time, still October 3 in Alaska; no archived historical snapshot was established.",
      "Shared levels 1–4 are supported by DEC's explicit standardized-exam adoption and stream-by-stream Provisional/1–4 list together with the state-designated WPI 2025 Class I–IV criteria. Provisional is not a separate WPI class; WWSP and Small Untreated/Small Treated are excluded from shared levels.",
      "Eight source pages were opened. The DEC regulations landing page identifies 18 AAC 74 and its November 26, 2016 effective date, but the full externally hosted BASIS text was not opened. Mandatory-versus-voluntary applicability and all exemptions for the four conventional streams were not comprehensively audited; no voluntary/mandatory distinction is asserted beyond the expressly documented WWSP and small-system information."
    ],
    "name": "Alaska",
    "streams": [
      {
        "authorityName": "Alaska Department of Environmental Conservation, Division of Water, Operator Certification and Training Program",
        "authorityUrl": "https://dec.alaska.gov/water/operator-certification/",
        "examSystem": "mixed",
        "localLevels": "Provisional; Level 1; Level 2; Level 3; Level 4. Separate small-water-system credentials: Small Untreated Water System Certification and Small Treated Water System Certification.",
        "note": "DEC explicitly adopts the 2025 standardized ABC/WPI examinations for WT Provisional/1–4 and directs candidates to WPI's corresponding Class I–IV criteria. Provisional and Level 1 share the examination. Mixed classification reflects the separately named, in-house-generated small-water-system examinations, not customized ABC exams; those small-system credentials are not additional WPI classes.",
        "sources": [
          {
            "evidence": "'2025 Standardized ABC exams are now being used'; lists 'Water Treatment (WT) Provisional/1, 2, 3, 4'; separately identifies 'in-house generated' Small Untreated and Small Treated Water System exams. Identifies ABC as the former name of WPI and links its 2025 criteria.",
            "title": "Information for Written and Proctored Online Exams",
            "url": "https://dec.alaska.gov/water/operator-certification/info-for-written-and-proctored-online-exams/"
          },
          {
            "evidence": "The state-linked '2025 Standardized Water Treatment Operator Need-to-Know' section provides WPI Standardized Water Treatment Operator Classes I, II, III and IV.",
            "title": "2025 Need-to-Know Criteria",
            "url": "https://www.gowpi.org/services/2025-need-to-know-criteria/"
          },
          {
            "evidence": "Names Small Untreated Water System Certification and Small Treated Water System Certification; links their exam description, formula sheet, Alaska small-system operator manual and ADEC correspondence courses.",
            "title": "Small Water System Certification",
            "url": "https://dec.alaska.gov/water/operator-certification/small-water-system-certification/"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": [
          1,
          2,
          3,
          4
        ]
      },
      {
        "authorityName": "Alaska Department of Environmental Conservation, Division of Water, Operator Certification and Training Program",
        "authorityUrl": "https://dec.alaska.gov/water/operator-certification/",
        "examSystem": "wpi-standardized",
        "localLevels": "Provisional; Level 1; Level 2; Level 3; Level 4.",
        "note": "DEC explicitly identifies standardized 2025 ABC/WPI exams for WD Provisional/1–4; the state-linked WPI criteria identify the corresponding Classes I–IV. Provisional and Level 1 share the examination. The separately named Small Untreated/Small Treated credentials concern small water systems, not separately identified WD grades; no customized ABC distribution exam was identified.",
        "sources": [
          {
            "evidence": "'Alaska uses the standardized ABC exams'; '2025 Standardized ABC exams are now being used'; lists 'Water Distribution (WD) Provisional/1, 2, 3, 4' and links WPI's 2025 criteria.",
            "title": "Information for Written and Proctored Online Exams",
            "url": "https://dec.alaska.gov/water/operator-certification/info-for-written-and-proctored-online-exams/"
          },
          {
            "evidence": "The state-linked '2025 Standardized Water Distribution Operator Need-to-Know' section provides WPI Standardized Water Distribution Operator Classes I, II, III and IV.",
            "title": "2025 Need-to-Know Criteria",
            "url": "https://www.gowpi.org/services/2025-need-to-know-criteria/"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": [
          1,
          2,
          3,
          4
        ]
      },
      {
        "authorityName": "Alaska Department of Environmental Conservation, Division of Water, Operator Certification and Training Program",
        "authorityUrl": "https://dec.alaska.gov/water/operator-certification/",
        "examSystem": "mixed",
        "localLevels": "Wastewater Stabilization Pond (WWSP); Provisional; Level 1; Level 2; Level 3; Level 4.",
        "note": "DEC explicitly identifies standardized 2025 ABC/WPI exams for WWT Provisional/1–4; the state-linked WPI criteria identify Classes I–IV. Provisional and Level 1 share the examination. WWSP is a separate, lower, state-specific credential with an in-house-generated exam, not a customized ABC exam. WWSP certification is required for unaerated lagoon systems serving at least 500 people or having at least 100 service connections; smaller WWSP systems do not require certified operators. Provisional through Level 4 wastewater-treatment certificates also satisfy the WWSP requirement.",
        "sources": [
          {
            "evidence": "'2025 Standardized ABC exams are now being used'; lists 'Wastewater Treatment (WWT) Provisional/1, 2, 3, 4'; separately states that the program administers an 'in-house generated' Wastewater Stabilization Pond exam.",
            "title": "Information for Written and Proctored Online Exams",
            "url": "https://dec.alaska.gov/water/operator-certification/info-for-written-and-proctored-online-exams/"
          },
          {
            "evidence": "The state-linked '2025 Standardized Wastewater Treatment Operator Need-to-Know' section provides WPI Standardized Wastewater Treatment Operator Classes I, II, III and IV.",
            "title": "2025 Need-to-Know Criteria",
            "url": "https://www.gowpi.org/services/2025-need-to-know-criteria/"
          },
          {
            "evidence": "Cites 18 AAC 74.120(b)(1) for lagoons without aeration; gives the 500-person/100-connection certification thresholds; says Provisional through Level 4 certifications are higher than WWSP; links the WWSP exam description, formula sheet, study guide and DEC correspondence course.",
            "title": "Wastewater Stabilization Ponds (WWSP)",
            "url": "https://dec.alaska.gov/water/operator-certification/wastewater-stabilization-ponds/"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": [
          1,
          2,
          3,
          4
        ]
      },
      {
        "authorityName": "Alaska Department of Environmental Conservation, Division of Water, Operator Certification and Training Program",
        "authorityUrl": "https://dec.alaska.gov/water/operator-certification/",
        "examSystem": "wpi-standardized",
        "localLevels": "Provisional; Level 1; Level 2; Level 3; Level 4.",
        "note": "Wastewater-collection scope is explicitly documented independently of drinking water: DEC identifies standardized 2025 ABC/WPI exams for WWC Provisional/1–4, and its linked WPI criteria identify Classes I–IV. Provisional and Level 1 share the examination. No customized ABC or separate state-specific collection examination was identified in the opened sources.",
        "sources": [
          {
            "evidence": "'Alaska uses the standardized ABC exams'; '2025 Standardized ABC exams are now being used'; explicitly lists 'Wastewater Collection (WWC) Provisional/1, 2, 3, 4' and links WPI's 2025 criteria.",
            "title": "Information for Written and Proctored Online Exams",
            "url": "https://dec.alaska.gov/water/operator-certification/info-for-written-and-proctored-online-exams/"
          },
          {
            "evidence": "The state-linked '2025 Standardized Wastewater Collection Operator Need-to-Know' section provides WPI Standardized Wastewater Collection Operator Classes I, II, III and IV.",
            "title": "2025 Need-to-Know Criteria",
            "url": "https://www.gowpi.org/services/2025-need-to-know-criteria/"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": [
          1,
          2,
          3,
          4
        ]
      }
    ]
  },
  {
    "code": "AZ",
    "dedicatedCourseNeeds": [],
    "limits": [
      "Assessment targets October 3, 2026; sources were retrieved October 4, 2026. No archived October 3 snapshot was obtained. ADEQ's examination page displays September 26, 2025 revision; its program page displays February 4, 2026 revision.",
      "Grade 1–4 to Class I–IV correspondence is supported by explicit ADEQ Grade/Class headings in a legacy document referencing 2012 criteria and 2016 administrative instructions. Its topic weights, fees and administrative instructions must not be treated as current. Current 2025 standardized scope is independently supported by ADEQ's current certification guide.",
      "The ADEQ-designated GateWay administrator corroborates the current edition: https://sites.google.com/gatewaycc.edu/adeq-water-operator-cert/home/about-the-exam says exams cover all four areas, each with four grades, and are based on the 2025 ABC edition. Its home page directs candidates to 'ABCs 2025 New Standardized Exam Need-To-Know Criteria'. Neither statement is used alone as proof.",
      "Eight distinct source URLs were opened. WPI's ADEQ-linked 2025 criteria landing page returned an access-verification screen; individual current WPI class outlines were not inspected. The successful ADEQ guide extraction supplies the standardized-scope evidence.",
      "No Arizona-customized exam, separate state-specific examination, Arizona-only regulatory exam component, or mandatory pre-exam course was established by the opened sources. Therefore no unique Arizona exam course is identified; local eligibility, early-exam approval and certification administration remain separate from shared exam preparation."
    ],
    "name": "Arizona",
    "streams": [
      {
        "authorityName": "Arizona Department of Environmental Quality (ADEQ), Operator Certification Program",
        "authorityUrl": "https://azdeq.gov/operator-certification",
        "examSystem": "wpi-standardized",
        "localLevels": "Water Treatment  -  Grade 1, Grade 2, Grade 3, Grade 4 (T)",
        "note": "Route to the corresponding 2025 WPI standardized Water Treatment Class I–IV preparation, retaining Arizona's Grade 1–4 labels. Standardization is supported by ADEQ's current exam guide, not merely its use of WPI as provider. Grade/Class correspondence is explicitly documented in ADEQ's legacy reference guide; see limits.",
        "sources": [
          {
            "evidence": "Lists 'Water Treatment Exam  -  Grade 1, 2, 3, 4 (T)' and states Arizona utilizes WPI exams for operator certifications.",
            "title": "ADEQ  -  Operator Certification Examination",
            "url": "https://azdeq.gov/operator-certification-examination"
          },
          {
            "evidence": "ADEQ 'currently utilizes the computerized 2025 ABC exam'; there are '16 Need-to-Know Criteria documents, one for each classification/grade level of exam certifiable in the state of Arizona'; these describe competencies 'covered on the standardized exams.'",
            "title": "ADEQ  -  How to Become a Certified Operator, p. 3",
            "url": "https://static.azdeq.gov/opcert/certification_info.pdf"
          },
          {
            "evidence": "Separate headings explicitly identify 'ABC Water Treatment Grade/Class I', II, III and IV 'Standardized Exam Breakdown'. Used for grade/class nomenclature only, not the current outline.",
            "title": "ADEQ  -  Operator Certification Exam Information & Resources (legacy)",
            "url": "https://static.azdeq.gov/opcert/opcert_ref_materials.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": [
          1,
          2,
          3,
          4
        ]
      },
      {
        "authorityName": "Arizona Department of Environmental Quality (ADEQ), Operator Certification Program",
        "authorityUrl": "https://azdeq.gov/operator-certification",
        "examSystem": "wpi-standardized",
        "localLevels": "Water Distribution  -  Grade 1, Grade 2, Grade 3, Grade 4 (D)",
        "note": "Route to the corresponding 2025 WPI standardized Water Distribution Class I–IV preparation, retaining Arizona's Grade 1–4 labels. ADEQ's program page identifies ADEQ as certificate issuer. Grade/Class correspondence is explicitly documented in its legacy reference guide; see limits.",
        "sources": [
          {
            "evidence": "Lists 'Water Distribution Exam  -  Grade 1, 2, 3, 4 (D)' and states Arizona utilizes WPI exams for operator certifications.",
            "title": "ADEQ  -  Operator Certification Examination",
            "url": "https://azdeq.gov/operator-certification-examination"
          },
          {
            "evidence": "Names Water Distribution among the four exam classifications. ADEQ currently uses the computerized 2025 ABC exam and identifies 16 classification/grade-specific criteria documents describing the standardized exams.",
            "title": "ADEQ  -  How to Become a Certified Operator, pp. 2–3",
            "url": "https://static.azdeq.gov/opcert/certification_info.pdf"
          },
          {
            "evidence": "Separate headings explicitly identify 'ABC Distribution Grade/Class I', II, III and IV 'Standardized Exam Breakdown'. Used for grade/class nomenclature only.",
            "title": "ADEQ  -  Operator Certification Exam Information & Resources (legacy)",
            "url": "https://static.azdeq.gov/opcert/opcert_ref_materials.pdf"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": [
          1,
          2,
          3,
          4
        ]
      },
      {
        "authorityName": "Arizona Department of Environmental Quality (ADEQ), Operator Certification Program",
        "authorityUrl": "https://azdeq.gov/operator-certification",
        "examSystem": "wpi-standardized",
        "localLevels": "Wastewater Treatment  -  Grade 1, Grade 2, Grade 3, Grade 4 (W)",
        "note": "Route to the corresponding 2025 WPI standardized Wastewater Treatment Class I–IV preparation. Wastewater scope is expressly documented, not inferred from drinking-water evidence. Grade/Class correspondence is explicitly documented in ADEQ's legacy reference guide; see limits.",
        "sources": [
          {
            "evidence": "Lists 'Wastewater Treatment Exam  -  Grade 1, 2, 3, 4 (W)' under Arizona classifications and grade levels.",
            "title": "ADEQ  -  Operator Certification Examination",
            "url": "https://azdeq.gov/operator-certification-examination"
          },
          {
            "evidence": "Names Wastewater Treatment among the four classifications; identifies the current computerized 2025 ABC exam and 16 classification/grade-specific criteria documents for the standardized exams.",
            "title": "ADEQ  -  How to Become a Certified Operator, pp. 2–3",
            "url": "https://static.azdeq.gov/opcert/certification_info.pdf"
          },
          {
            "evidence": "Separate headings explicitly identify 'ABC Wastewater Treatment Grade/Class I', II, III and IV 'Standardized Exam Breakdown'. Used for grade/class nomenclature only.",
            "title": "ADEQ  -  Operator Certification Exam Information & Resources (legacy)",
            "url": "https://static.azdeq.gov/opcert/opcert_ref_materials.pdf"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": [
          1,
          2,
          3,
          4
        ]
      },
      {
        "authorityName": "Arizona Department of Environmental Quality (ADEQ), Operator Certification Program",
        "authorityUrl": "https://azdeq.gov/operator-certification",
        "examSystem": "wpi-standardized",
        "localLevels": "Wastewater Collections  -  Grade 1, Grade 2, Grade 3, Grade 4 (C)",
        "note": "Route to the corresponding 2025 WPI standardized Wastewater Collection Class I–IV preparation. ADEQ's examination page uses the plural 'Wastewater Collections'; its program page also uses singular 'wastewater collection'. This is an ADEQ certification stream, not evidence of a separate voluntary association credential.",
        "sources": [
          {
            "evidence": "Lists 'Wastewater Collections Exam  -  Grade 1, 2, 3, 4 (C)' under Arizona classifications and grade levels.",
            "title": "ADEQ  -  Operator Certification Examination",
            "url": "https://azdeq.gov/operator-certification-examination"
          },
          {
            "evidence": "Names Wastewater Collections among the four classifications; identifies the current computerized 2025 ABC exam and 16 classification/grade-specific criteria documents for the standardized exams.",
            "title": "ADEQ  -  How to Become a Certified Operator, pp. 2–3",
            "url": "https://static.azdeq.gov/opcert/certification_info.pdf"
          },
          {
            "evidence": "Separate headings explicitly identify 'ABC Collections Grade/Class I', II, III and IV 'Standardized Exam Breakdown'. Used for grade/class nomenclature only.",
            "title": "ADEQ  -  Operator Certification Exam Information & Resources (legacy)",
            "url": "https://static.azdeq.gov/opcert/opcert_ref_materials.pdf"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": [
          1,
          2,
          3,
          4
        ]
      }
    ]
  },
  {
    "code": "AR",
    "dedicatedCourseNeeds": [
      "For both drinking-water streams, provide an Arkansas rules/compliance supplement: licensing-rule Table 2 requires PWS Rules and SDWA Compliance, and ADH recommends Arkansas PWS rules and its PWS Compliance Summary. This requirement does not itself prove a unique state-authored exam.",
      "Maintain a separate Very Small Water System / Small System Distribution outline and routing option; the rules establish a distinct small-system examination outside Grades I–IV.",
      "Obtain DEQ's current municipal Class I–IV and industrial Basic/Advanced examination outlines before claiming shared-course alignment; the industrial local levels do not map to WPI Classes 1–4 on the available evidence.",
      "Treat voluntary AWEA Collection Class 1–4 as a separate administrator route; obtain its current outline and explicit standardized/customized exam designation before reusing WPI-class courses."
    ],
    "limits": [
      "Research performed October 4, 2026 for the requested October 3, 2026 cutoff. Live pages are not archived cutoff snapshots; the official wastewater code displayed an October 1, 2026 update.",
      "Eight source opens were used. None explicitly established standardized WPI/ABC scope plus local grade-to-WPI class correspondence; every verifiedSharedLevels array is therefore empty.",
      "Exam-system unverified means provenance remained ambiguous, not that certification is unavailable. ABC/WPI preparation links, ABC program approval, and DEQ examination administration were not treated as standardized-exam proof.",
      "The opened AWEA page establishes its own voluntary collection program; it does not establish state designation or mandatory DEQ collection licensure. No separate mandatory collection credential was verified."
    ],
    "name": "Arkansas",
    "streams": [
      {
        "authorityName": "Arkansas Department of Health (ADH), under the Arkansas State Board of Health and Drinking Water Advisory & Operator Licensing Committee",
        "authorityUrl": "https://healthy.arkansas.gov/programs-services/licensing-military-member-licensure-permits-plan-reviews/drinking-water-operator-certification/",
        "examSystem": "unverified",
        "localLevels": "Grade I Treatment License; Grade II Treatment License; Grade III Treatment License; Grade IV Treatment License",
        "note": "Mandatory drinking-water licensing. Official sources establish separate treatment examinations and recommend ABC/WPI preparation materials, but do not explicitly identify standardized WPI exams, customized ABC exams, or state-authored exams. Local grade numbering does not establish WPI class correspondence.",
        "sources": [
          {
            "evidence": "Program has been mandatory since 1957; the Drinking Water Advisory & Operator Licensing Committee oversees it.",
            "title": "ADH Drinking Water Operator Certification",
            "url": "https://healthy.arkansas.gov/programs-services/licensing-military-member-licensure-permits-plan-reviews/drinking-water-operator-certification/"
          },
          {
            "evidence": "Sections V and X identify Treatment Grades I–IV. Section IX.D requires separate treatment and distribution examinations for Grades I–IV; it does not name the exam developer or standardized series.",
            "title": "Rules Pertaining to Water Operator Licensing, effective March 25, 2024",
            "url": "https://healthy.arkansas.gov/wp-content/uploads/WATER_OPERATOR_LICENSING.pdf"
          },
          {
            "evidence": "Recommended references are the study manuals referenced in ABC exam-preparation Needs To Know Criteria. Arkansas PWS rules and the Arkansas PWS Compliance Summary are additional recommended materials; no standardized-exam adoption statement appears.",
            "title": "Arkansas Water Operator Licensing Program  -  Exam Reference Materials List",
            "url": "https://healthy.arkansas.gov/wp-content/uploads/Exam-Reference-Materials-List-3226.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Arkansas Department of Health (ADH), under the Arkansas State Board of Health and Drinking Water Advisory & Operator Licensing Committee",
        "authorityUrl": "https://healthy.arkansas.gov/programs-services/licensing-military-member-licensure-permits-plan-reviews/drinking-water-operator-certification/",
        "examSystem": "unverified",
        "localLevels": "Small System Distribution License (facility classification: Very Small Water System); Grade I Distribution License; Grade II Distribution License; Grade III Distribution License; Grade IV Distribution License",
        "note": "Mandatory licensing, distinct from treatment. Rules use both Very Small Water System and Small System Distribution terminology. Neither the separate exams nor WPI preparation links establish standardized or customized exam provenance. The small-system route must not be represented as WPI Class 1.",
        "sources": [
          {
            "evidence": "Section V.E lists Very Small Water System and Grades I–IV distribution facilities; Section X lists Small System Distribution License and Grade I–IV Distribution Licenses. Section IX requires distinct distribution examinations and a separate very-small-system examination.",
            "title": "Rules Pertaining to Water Operator Licensing, effective March 25, 2024",
            "url": "https://healthy.arkansas.gov/wp-content/uploads/WATER_OPERATOR_LICENSING.pdf"
          },
          {
            "evidence": "Lists Treatment, Distribution, Very Small System  -  Need To Know and Math Formula Sheets through WPI, alongside Arkansas Public Water System rules and compliance materials. These are preparation links, not an explicit standardized-exam designation.",
            "title": "ADH Operator Certification, Forms, and Training Documents",
            "url": "https://healthy.arkansas.gov/programs-services/licensing-military-member-licensure-permits-plan-reviews/drinking-water-operator-certification/operator-exam-preparation/"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Arkansas Department of Energy and Environment, Division of Environmental Quality (DEQ), Enforcement Branch; Wastewater Licensing Committee",
        "authorityUrl": "https://adeq.state.ar.us/water/wwl/",
        "examSystem": "unverified",
        "localLevels": "Municipal: Apprentice, Class I, Class II, Class III, Class IV. Industrial: Apprentice, Basic, Advanced.",
        "note": "Mandatory treatment-plant licensing has separate municipal and industrial tracks. Apprentice is listed as a license category, not established here as an exam level. Municipal Class IV has a different application lead time, but that does not prove a different exam vendor or standardized exam. No opened source establishes standardized/customized ABC provenance or state-authored exams for any class.",
        "sources": [
          {
            "evidence": "Enforcement Branch administers licensing; all wastewater treatment plants must have a properly licensed operator. Lists municipal Apprentice/Class I–IV and industrial Apprentice/Basic/Advanced. Class IV applications require 30 business days rather than five for other exams.",
            "title": "DEQ Wastewater Operator Licensing Program",
            "url": "https://adeq.state.ar.us/water/wwl/"
          },
          {
            "evidence": "Committee adopts competence criteria for operator classifications and approves training; its executive secretary administers licensing examinations. The provision does not identify a standardized exam series. Official code page last updated October 1, 2026.",
            "title": "8 CAR § 22-202  -  Licensing committee powers and duties",
            "url": "https://codeofarrules.arkansas.gov/Rules/Rule?levelType=section&titleID=8&chapterID=248&subChapterID=308&partID=1174&subPartID=6584&sectionID=42855"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Arkansas Water Environment Association (AWEA), Voluntary Certification Program Committee (VCPC)",
        "authorityUrl": "https://awea-ar.org/certification/",
        "examSystem": "unverified",
        "localLevels": "Class 1–Class 4, voluntary Wastewater Collection System Operator certification",
        "note": "AWEA offers a separate voluntary collection-system certification program, not the DEQ mandatory treatment license. Its own administering-authority page says ABC reviewed and approved the program, but does not say its exams are standardized ABC/WPI or customized ABC. Do not infer exam identity from program approval or from drinking-water evidence.",
        "sources": [
          {
            "evidence": "Identifies an AWEA-sponsored tiered voluntary program administered by VCPC, beginning with Class 1 and ending with Class 4. Says the program was reviewed and approved by ABC; does not identify the exam product.",
            "title": "AWEA Collection System Certification",
            "url": "https://awea-ar.org/certification/"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "CA",
    "dedicatedCourseNeeds": [
      "Separate California T5 oral-exam preparation: regulatory knowledge, utility management/emergency situations, and operational water-treatment scenarios. Do not substitute a generic four-class standardized-exam route.",
      "For California T1–T4 treatment and D1–D5 distribution, use separate local-grade routes aligned to the Board's published Expected Range of Knowledge, California Title 22 requirements, and examination eligibility rules. Supplier/standardization remains unresolved, so do not advertise verified WPI shared-level alignment.",
      "Wastewater-treatment Grades I–V need alignment to the explicit California section 3701(c) examination outline: California certification/plant-classification and waste-discharge rules, water-recycling regulations, reclamation/reuse, process-control mathematics, and progressively advanced supervision/management. Grade V needs a distinct complex-application tier.",
      "CWEA collection needs a separate CSM Grade 1–4 pathway using the 2025 California job-task blueprints, including sanitary-sewer WDR/SSMP, spill response and grade-specific CIWQS reporting/certification, safety/regulations, collection operations/equipment, mapping, administration, and mathematics."
    ],
    "limits": [
      "As-of October 3, 2026 assessment used eight opened official authority/program documents or pages. The California regulation compilation is dated September 2026, and the drinking-water annual report is dated August 2026; no future scheduled meeting outcome was treated as effective policy.",
      "No opened source explicitly established both standardized WPI/ABC scope and California-grade-to-WPI-class correspondence for any stream. Therefore every verifiedSharedLevels array is empty; this is not a claim that all possible ABC involvement has been disproved.",
      "Exam administration, delivery vendors, reciprocity, membership/contact listings, and general content overlap were not used as proof of standardized WPI examinations. Ambiguous drinking-water and wastewater-treatment bank identities are marked unverified, not unsupported.",
      "The collection authority is CWEA for its voluntary credential, not the State Water Board. No claim is made that CWEA is a mandatory statewide collection-operator licensing program.",
      "Only program-level examination/certification evidence is reported; no operator/customer records, pass statistics, course-coverage promises, or pass guarantees are included."
    ],
    "name": "California",
    "streams": [
      {
        "authorityName": "California State Water Resources Control Board  -  Drinking Water Operator Certification Program (DWOCP)",
        "authorityUrl": "https://www.waterboards.ca.gov/drinking_water/certlic/occupations/DWopcert.html",
        "examSystem": "unverified",
        "localLevels": "Water Treatment Operator Grades T1, T2, T3, T4, T5",
        "note": "Mandatory state certification. T1–T4 use computer-based examinations; T5 is a distinct California oral examination. The official report describes State Water Board SME validation and revision of questions against its Expected Range of Knowledge, but does not explicitly identify whether the T1–T4 bank is independently state-authored or supplied/customized by WPI/ABC. Consequently the complete stream's exam-system identity remains unverified; T5 must not be mapped to a standardized WPI Class IV examination.",
        "sources": [
          {
            "evidence": "Pages 7–8 identify treatment T1–T4 examinations and state: ‘The drinking water treatment grade 5 examination is an oral examination.’ The Board's SMEs link questions to KSAs on the Expected Range of Knowledge; the Board may revise questions, change distractors, or eliminate questions from the item bank. The attached T5 presentation identifies regulatory, utility-management/emergency, and operational categories.",
            "title": "California Drinking Water Operator Certification Annual Report, SFY 2025–2026 (August 2026)",
            "url": "https://www.waterboards.ca.gov/drinking_water/certlic/occupations/documents/usepa-ar-attachment.pdf"
          },
          {
            "evidence": "Title 22, sections 63775 and 63800 separately name T1, T2, T3, T4 and T5 examination/certification grades and their eligibility requirements.",
            "title": "Operator Certification Statutes, Regulations, and Other Laws (September 2026)",
            "url": "https://www.waterboards.ca.gov/drinking_water/certlic/occupations/documents/current-regulations.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "California State Water Resources Control Board  -  Drinking Water Operator Certification Program (DWOCP)",
        "authorityUrl": "https://www.waterboards.ca.gov/drinking_water/certlic/occupations/DWopcert.html",
        "examSystem": "unverified",
        "localLevels": "Distribution Operator Grades D1, D2, D3, D4, D5",
        "note": "Mandatory state certification, with computer-based examinations at all five grades. The Board documents local job-analysis/Expected Range of Knowledge validation and item-bank revision. However, no opened source explicitly establishes standardized WPI/ABC use, customized ABC supply, or independent authorship of the entire distribution bank. Do not infer D1–D4 equivalence to WPI Classes I–IV from matching numbers.",
        "sources": [
          {
            "evidence": "Pages 7–8 expressly identify drinking-water distribution D1–D5 examinations. Required KSAs were developed through SME job analyses; SMEs validate questions against the Expected Range of Knowledge, and the Board can revise or remove questions from the item bank.",
            "title": "California Drinking Water Operator Certification Annual Report, SFY 2025–2026 (August 2026)",
            "url": "https://www.waterboards.ca.gov/drinking_water/certlic/occupations/documents/usepa-ar-attachment.pdf"
          },
          {
            "evidence": "Title 22, sections 63780 and 63805 separately name distribution grades D1, D2, D3, D4 and D5 and their examination/certification requirements.",
            "title": "Operator Certification Statutes, Regulations, and Other Laws (September 2026)",
            "url": "https://www.waterboards.ca.gov/drinking_water/certlic/occupations/documents/current-regulations.pdf"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "California State Water Resources Control Board  -  Wastewater Operator Certification Program (WWOCP)",
        "authorityUrl": "https://www.waterboards.ca.gov/water_issues/programs/operator_certification/operator_certification.html",
        "examSystem": "unverified",
        "localLevels": "Wastewater Treatment Plant Operator Grade I, Grade II, Grade III, Grade IV, Grade V; Operator-in-Training (OIT) is a separate status, not an additional examination grade",
        "note": "Mandatory state wastewater-treatment certification, independently documented rather than inferred from drinking water. California regulations prescribe grade-specific examination content, including California regulations. The opened sources do not explicitly establish the question-bank author or distinguish independent state development from customized ABC supply; standardized WPI/ABC use and a grade-to-class crosswalk remain unverified.",
        "sources": [
          {
            "evidence": "‘The Wastewater Operator Certification program (WWOCP) administers Wastewater Treatment Plant Certification examinations, certifications (grades I to V), and certification renewals.’ The page separately links OIT information and states that classified privately owned plants require certified operators as do public plants. Page updated September 29, 2026.",
            "title": "Wastewater Operator Certification Program",
            "url": "https://www.waterboards.ca.gov/water_issues/programs/operator_certification/operator_certification.html"
          },
          {
            "evidence": "Section 3701(b) requires process-control/evaluation mathematics and progressively detailed knowledge; section 3701(c) specifies Grade I–V exam content. Grade I includes state plant-classification, waste-discharge and certification regulations; Grade III adds state water-recycling regulations; Grade IV adds reclamation/reuse and management; Grade V applies Grade IV content to more difficult and complex situations.",
            "title": "Operator Certification Statutes, Regulations, and Other Laws (September 2026)",
            "url": "https://www.waterboards.ca.gov/drinking_water/certlic/occupations/documents/current-regulations.pdf"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "California Water Environment Association (CWEA)  -  Technical Certification Program",
        "authorityUrl": "https://www.cwea.org/certification/collection-systems-maintenance-certification/",
        "examSystem": "state-specific",
        "localLevels": "Collection System Maintenance (CSM): Grade 1  -  Entry Level; Grade 2  -  Journey; Grade 3  -  Lead; Grade 4  -  Manager",
        "note": "CWEA's own California-focused certification and examinations, not a verified WPI/ABC standardized or customized program. This is voluntary professional certification, distinct from the State Water Board's mandatory operator programs; individual employers may require it. The current page designates the 2025 handbook for examinations starting July 1, 2025. Pearson VUE delivery does not establish exam authorship or WPI equivalence.",
        "sources": [
          {
            "evidence": "The page explicitly lists Grades 1–4 as Entry Level, Journey, Lead and Manager. ‘CWEA offers voluntary certifications’; some agencies require certification for employment. Its current candidate-materials link specifies the new handbook for exams starting July 1, 2025.",
            "title": "Collection System Maintenance Certification",
            "url": "https://www.cwea.org/certification/collection-systems-maintenance-certification/"
          },
          {
            "evidence": "Page 17: CWEA exam blueprints derive from a job-task analysis of California systems and were reviewed by CWEA SMEs in 2025. Pages 76–77: ‘All exam items are written by subject matter experts based on the content outline established by the job task analysis.’ Separate Grade 1–4 outlines include Statewide sanitary-sewer WDR, SSMP requirements, and grade-specific CIWQS spill-reporting/certification responsibilities.",
            "title": "Collection System Maintenance Candidate Handbook, Version 2025.01",
            "url": "https://cweawebstorage1.blob.core.windows.net/cwea-website/cert/CWEA%20Certification%20Handbook_CSM.pdf"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "CO",
    "dedicatedCourseNeeds": [
      "Dedicated Colorado Small Water System Class S preparation: custom hybrid exam referencing WPI Standardized Water Treatment Class I and Water Distribution Class I criteria; obtain the actual Colorado custom outline before defining coverage. Source: https://cdphe.colorado.gov/ccwp-need-to-know-criteria-and-study-resources",
      "Dedicated Colorado Small Wastewater System preparation: custom hybrid exam referencing WPI Standardized Wastewater Treatment Class I and Wastewater Collection Class I criteria; verify its class label and actual custom outline. Source: https://cdphe.colorado.gov/ccwp-need-to-know-criteria-and-study-resources",
      "Dedicated Colorado Class T preparation: explicitly custom; the state recommends WPI Standardized Very Small Water System criteria. Verify local scope and custom outline rather than route it as an ordinary standardized level. Source: https://cdphe.colorado.gov/ccwp-need-to-know-criteria-and-study-resources",
      "Colorado regulatory supplement and approved mandatory regulatory training are separate needs for water/distribution and wastewater/collection. The state requires category-approved training, valid for three years; no Echelon course approval is implied. Source: https://cdphe.colorado.gov/ccwp-general-requirements-for-colorado-certification"
    ],
    "limits": [
      "Target date is October 3, 2026. Undated live official pages were retrieved October 4, 2026; no historical snapshot independently establishes the exact prior-day wording.",
      "Eight source pages were opened, respecting the exploration cap. All evidence above comes from opened official CDPHE pages, not search snippets, membership listings or PSI delivery arrangements.",
      "Standardized exam scope is verified, but explicit grade-to-WPI-class crosswalks were not acquired. Empty verifiedSharedLevels arrays mean correspondence is unverified, not that standardized exams are unsupported.",
      "The state calls its special exams custom; the acquired wording does not separately establish whether their author is WPI or another party. Mixed classifications preserve the verified standardized/custom distinction without claiming customized exams are standardized.",
      "Mandatory versus voluntary certification obligations by facility type were not independently examined in Regulation 100; no obligation or exam-coverage guarantees are asserted."
    ],
    "name": "Colorado",
    "streams": [
      {
        "authorityName": "Colorado Water and Wastewater Facility Operators Certification Board (WWFOCB); administered through Colorado Certified Water Professionals (CCWP)",
        "authorityUrl": "https://cdphe.colorado.gov/wwfocb",
        "examSystem": "mixed",
        "localLevels": "Water Treatment Class D (entry), Class C, Class B, Class A (most advanced); Small Water System Class S (hybrid treatment/distribution). Official study page also identifies a custom Class T water exam, but its precise certification privileges were not established.",
        "note": "The state expressly identifies WPI standardized sequential exams for ordinary certificate classes, with custom Classes S and T exceptions. Class S can cover Class D treatment for systems serving fewer than 3,300 persons. No explicit Colorado D/C/B/A-to-WPI I/II/III/IV crosswalk was found in the acquired sources; shared levels therefore remain unverified. The custom exceptions are not standardized WPI exams; their writer is not expressly identified.",
        "sources": [
          {
            "evidence": "Colorado uses 'standardized, sequential examinations developed by Water Professionals International (WPI) for all classes of certificates, except Classes “S” and “T” which are custom exams.' It separately identifies custom Colorado Small Water System and Class T exams.",
            "title": "CCWP - Need to know criteria and study resources",
            "url": "https://cdphe.colorado.gov/ccwp-need-to-know-criteria-and-study-resources"
          },
          {
            "evidence": "Lists Water Treatment Classes D, C, B, A. Describes Small Water System Class S as a hybrid certificate permitting responsible charge of Class D treatment and/or Class 1 distribution below 3,300 persons.",
            "title": "CCWP - Which certificate is right for you?",
            "url": "https://cdphe.colorado.gov/ccwp-which-certificate-is-right-for-you"
          },
          {
            "evidence": "WWFOCB maintains certification for operators of water treatment plants, municipal and industrial wastewater treatment plants, water distribution systems and wastewater collection systems.",
            "title": "Water and Wastewater Facility Operators Certification Board",
            "url": "https://cdphe.colorado.gov/wwfocb"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Colorado Water and Wastewater Facility Operators Certification Board (WWFOCB); administered through Colorado Certified Water Professionals (CCWP)",
        "authorityUrl": "https://cdphe.colorado.gov/wwfocb",
        "examSystem": "mixed",
        "localLevels": "Distribution Class 1 (entry), Class 2, Class 3, Class 4 (most advanced); Small Water System Class S (hybrid treatment/distribution).",
        "note": "Distribution Classes 1–4 fall within the state's explicit all-classes WPI standardized scope; the Class S alternative is custom. The acquired pages do not explicitly pair each Colorado numbered class with a WPI exam class, so shared-level correspondence is conservatively unverified. Class T distribution privileges were not established.",
        "sources": [
          {
            "evidence": "States that all certificate classes use WPI standardized sequential examinations except custom Classes S and T. For the custom Small Water System exam, recommends both WPI Standardized Water Treatment Class I and Water Distribution Class I criteria.",
            "title": "CCWP - Need to know criteria and study resources",
            "url": "https://cdphe.colorado.gov/ccwp-need-to-know-criteria-and-study-resources"
          },
          {
            "evidence": "Lists Distribution Classes 1, 2, 3, 4; Class S can cover a Class 1 distribution system serving fewer than 3,300 persons.",
            "title": "CCWP - Which certificate is right for you?",
            "url": "https://cdphe.colorado.gov/ccwp-which-certificate-is-right-for-you"
          },
          {
            "evidence": "Explicitly includes water distribution systems in WWFOCB's operator certification program.",
            "title": "Water and Wastewater Facility Operators Certification Board",
            "url": "https://cdphe.colorado.gov/wwfocb"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Colorado Water and Wastewater Facility Operators Certification Board (WWFOCB); administered through Colorado Certified Water Professionals (CCWP)",
        "authorityUrl": "https://cdphe.colorado.gov/wwfocb",
        "examSystem": "mixed",
        "localLevels": "Wastewater Treatment Class D (entry), Class C, Class B, Class A (most advanced). Separate Industrial Wastewater Treatment D, C, B, A certificates are also listed. Small Wastewater System hybrid certificate is offered; its class letter was not explicitly stated in the opened category description.",
        "note": "The official all-classes statement verifies standardized WPI exams for ordinary treatment certificates; the Small Wastewater System exam is explicitly custom and combines treatment/collection study criteria. No explicit D/C/B/A-to-WPI I/II/III/IV crosswalk was acquired, including for the separate industrial category. Do not equate its hybrid privileges with taking a standardized Class I exam.",
        "sources": [
          {
            "evidence": "States WPI standardized sequential exams for all classes except custom S/T. Specifically calls the Colorado Small Wastewater System exam custom and recommends WPI Standardized Wastewater Treatment Class I and Wastewater Collection Class I criteria.",
            "title": "CCWP - Need to know criteria and study resources",
            "url": "https://cdphe.colorado.gov/ccwp-need-to-know-criteria-and-study-resources"
          },
          {
            "evidence": "Lists wastewater treatment D/C/B/A and separate industrial wastewater treatment D/C/B/A certificates. Small Wastewater System hybrid certification can cover Class D wastewater treatment and/or Class 1 collection below 3,300 persons.",
            "title": "CCWP - Which certificate is right for you?",
            "url": "https://cdphe.colorado.gov/ccwp-which-certificate-is-right-for-you"
          },
          {
            "evidence": "Explicitly includes municipal and industrial wastewater treatment plants in WWFOCB's certification program.",
            "title": "Water and Wastewater Facility Operators Certification Board",
            "url": "https://cdphe.colorado.gov/wwfocb"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Colorado Water and Wastewater Facility Operators Certification Board (WWFOCB); administered through Colorado Certified Water Professionals (CCWP)",
        "authorityUrl": "https://cdphe.colorado.gov/wwfocb",
        "examSystem": "mixed",
        "localLevels": "Collection Class 1 (entry), Class 2, Class 3, Class 4 (most advanced); Small Wastewater System hybrid certificate (class letter not explicit in opened category description).",
        "note": "Collection Classes 1–4 fall within the explicit all-classes WPI standardized scope; the hybrid Small Wastewater System alternative uses a custom exam. An explicit local-class-to-WPI-exam-class correspondence was not acquired, so shared levels remain unverified despite matching numeric local names.",
        "sources": [
          {
            "evidence": "Explicit all-classes WPI standardized statement has S/T custom exceptions. Independently identifies the custom Small Wastewater System exam and its Wastewater Collection Class I plus Wastewater Treatment Class I study references.",
            "title": "CCWP - Need to know criteria and study resources",
            "url": "https://cdphe.colorado.gov/ccwp-need-to-know-criteria-and-study-resources"
          },
          {
            "evidence": "Lists Collection Classes 1, 2, 3, 4 and describes the Small Wastewater System hybrid's Class 1 collection privileges for systems serving fewer than 3,300 persons.",
            "title": "CCWP - Which certificate is right for you?",
            "url": "https://cdphe.colorado.gov/ccwp-which-certificate-is-right-for-you"
          },
          {
            "evidence": "Explicitly includes wastewater collection systems in WWFOCB's certification program.",
            "title": "Water and Wastewater Facility Operators Certification Board",
            "url": "https://cdphe.colorado.gov/wwfocb"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "CT",
    "dedicatedCourseNeeds": [
      "A distinct NEWEA Collection Systems Grade I–IV preparation route is supported. Use the June 2026 NEWEA Need-to-Know outline and NEWEA formula sheet, addressing equipment operation/evaluation/maintenance; collection-system operation, maintenance and restoration; lift stations; monitoring/evaluation/adjustment; and applied math, safety and administrative procedures. Do not substitute shared WPI collection-class routing.",
      "Connecticut drinking-water orientation should explain RCSA 25-32-7a through 14 and the local labels, especially the shifted DS I/II/III → WPI II/III/IV mapping and the separate Small Water System → WPI Distribution I track. No unique state-specific drinking-water exam is demonstrated.",
      "Connecticut wastewater-treatment orientation should address RCSA 22a-416-1 through 10, local Classes I–IV and the I–III OIT pathways. Confirm DEEP’s actual exam blueprint/version and standardized/customized status before selecting shared exam preparation or commissioning a unique question bank."
    ],
    "limits": [
      "Requested cutoff is October 3, 2026; live sources were opened October 4, 2026. Undated pages lack an independently archived cutoff snapshot. The DEEP notice is dated October 1, 2026 and the NEWEA brochure June 2026.",
      "Eight source opens were used. Wastewater-treatment exam classification remains unverified, not unsupported or presumed state-specific; WPI fee participation is insufficient proof of standardized scope.",
      "NEWEA is a voluntary regional certifier. Its first-party brochure establishes its exam construction, but formal Connecticut state designation was not established. The older DEEP guidelines’ collection-law statement requires current confirmation if mandatory status is operationally important.",
      "verifiedSharedLevels are WPI class numbers. Distribution level 1 is verified solely for the Small Water System Operator track; Connecticut DS Classes I–III correspond to WPI levels 2–4."
    ],
    "name": "Connecticut",
    "streams": [
      {
        "authorityName": "Connecticut Department of Public Health (DPH), Drinking Water Section, Operator Certification Program",
        "authorityUrl": "https://portal.ct.gov/dph/drinking-water/dws/operator-certification-program",
        "examSystem": "wpi-standardized",
        "localLevels": "Water Treatment Plant (WTP) Operator Class I, Class II, Class III, Class IV; Operator-in-Training available for each class.",
        "note": "DPH explicitly maps its WTP Classes I–IV to the corresponding WPI standardized Water Treatment Classes I–IV, including full and OIT certification. This is not inferred from PSI delivery or ABC membership.",
        "sources": [
          {
            "evidence": "The Drinking Water Section certifies public drinking-water utility personnel operating treatment plants and distribution systems.",
            "title": "Operator Certification Program",
            "url": "https://portal.ct.gov/dph/drinking-water/dws/operator-certification-program"
          },
          {
            "evidence": "Table headed ‘WPI Standardized Examination Guide’ explicitly pairs WTP Operator Classes I, II, III and IV with WPI Water Treatment Operator Classes I, II, III and IV.",
            "title": "CT DPH Operator Certification Examination, Applications and Reference Materials",
            "url": "https://portal.ct.gov/dph/drinking-water/dws/operator-certification-examination-dates-applications-and-reference--materials"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": [
          1,
          2,
          3,
          4
        ]
      },
      {
        "authorityName": "Connecticut Department of Public Health (DPH), Drinking Water Section, Operator Certification Program",
        "authorityUrl": "https://portal.ct.gov/dph/drinking-water/dws/operator-certification-program",
        "examSystem": "wpi-standardized",
        "localLevels": "Distribution System (DS) Operator Class I, Class II, Class III; Operator-in-Training available for each class. Separate Small Water System Operator certification, without a numbered local class.",
        "note": "Shared levels denote WPI classes, NOT Connecticut class numbers: CT DS I → WPI Distribution II; CT DS II → WPI Distribution III; CT DS III → WPI Distribution IV. WPI Distribution I applies only to the separately named Small Water System Operator track. Do not advertise a Connecticut DS Class IV or match local and WPI numerals directly.",
        "sources": [
          {
            "evidence": "DPH’s Drinking Water Section certifies distribution-system personnel separately from treatment-plant personnel.",
            "title": "Operator Certification Program",
            "url": "https://portal.ct.gov/dph/drinking-water/dws/operator-certification-program"
          },
          {
            "evidence": "Under ‘WPI Standardized Examination Guide,’ DS Classes I, II and III are paired respectively with WPI Distribution Classes II, III and IV; Small Water System Operator is paired with WPI Distribution Class I. Full and OIT tracks are identified.",
            "title": "CT DPH Operator Certification Examination, Applications and Reference Materials",
            "url": "https://portal.ct.gov/dph/drinking-water/dws/operator-certification-examination-dates-applications-and-reference--materials"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": [
          1,
          2,
          3,
          4
        ]
      },
      {
        "authorityName": "Connecticut Department of Energy and Environmental Protection (DEEP), Bureau of Water Protection and Land Reuse, Municipal Wastewater Section",
        "authorityUrl": "https://portal.ct.gov/deep/municipal-wastewater/operator-certification-for-municipal-wastewater-treatment-facilities",
        "examSystem": "unverified",
        "localLevels": "Class I Operator, Class II Operator, Class III Operator, Class IV Operator; Class I, II, and III Operator-in-Training pathways.",
        "note": "Mandatory DEEP certification is verified, but standardized versus customized WPI/ABC versus another exam is unresolved. The October 1, 2026 notice mentions WPI receiving part of the exam fee but does not identify standardized exam scope or establish local-to-WPI class correspondence. That notice concerns 2027 sittings, not proof of the 2026 exam system. Do not carry drinking-water findings into this stream.",
        "sources": [
          {
            "evidence": "DEEP Municipal Wastewater certifies Connecticut wastewater-treatment operators; four levels run from Class I through Class IV. Page last updated September 22, 2026.",
            "title": "Operator Certification for Municipal Wastewater Treatment Facilities",
            "url": "https://portal.ct.gov/deep/municipal-wastewater/operator-certification-for-municipal-wastewater-treatment-facilities"
          },
          {
            "evidence": "Certification is required by regulation; Classes I–IV are listed individually. Class I, II and III applicants meeting education but not experience requirements may take the appropriate exam. Authorizing rules are RCSA 22a-416-1 through 10.",
            "title": "Wastewater Treatment Facility Operator Certification Fact Sheet",
            "url": "https://portal.ct.gov/deep/municipal-wastewater/wastewater-treatment-plant-operator-certification-fact-sheet"
          },
          {
            "evidence": "Applications beginning October 2026 are for calendar-year 2027 computer-based exams; exams are given for Classes I–IV. The exam fee is divided between the testing agency and WPI, without a standardized/customized designation.",
            "title": "Certification Examination for Wastewater Treatment Plant Operators  -  October 1, 2026",
            "url": "https://portal.ct.gov/-/media/deep/water/municipal_wastewater/deep-wastewater-operator-2027-exam-notice.pdf"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "New England Water Environment Association (NEWEA), Collection System Certification Sub Committee  -  voluntary regional certifier, not a Connecticut state licensing authority",
        "authorityUrl": "https://www.newea.org/careers/certification/collection-systems-certification-program/",
        "examSystem": "state-specific",
        "localLevels": "Grade I, Grade II, Grade III, Grade IV; Operator-in-Training status available for all four grades.",
        "note": "Independent NEWEA regional examination, not a demonstrated WPI standardized or customized exam. ‘state-specific’ is used as the schema’s non-WPI unique-exam category: these are regional NEWEA exams, NOT Connecticut-authored exams. The June 2026 brochure explicitly identifies a voluntary program across New England, including Connecticut, and requires its own committee to prepare examinations and NEWEA to grade them. No separate mandatory Connecticut collection credential or designation of NEWEA as a DEEP testing contractor was established.",
        "sources": [
          {
            "evidence": "Section 2.1: ‘This is a voluntary program.’ Sections 4.5 and 6.1 require the Sub Committee to prepare examinations; section 5.1 says NEWEA grades them. Sections 9–10 identify Grades I–IV, and section 3.3 extends OIT to all four grades. Connecticut is named among the six represented states.",
            "title": "NEWEA Collection Systems Certification Program  -  Rev. 06/2026",
            "url": "https://www.newea.org/wp-content/uploads/2026/06/CS-BROCHURE-Rev-06_2026-1.pdf"
          },
          {
            "evidence": "General overview distinguishes treatment-operator, collection-system and laboratory certification, stating that only wastewater-operator certification is required by Connecticut regulation and the other two are recommended. This is older contextual evidence, not independently current collection-law verification.",
            "title": "Connecticut Wastewater Operator Certification Guidelines  -  March 2005",
            "url": "https://portal.ct.gov/-/media/deep/water/municipal_wastewater/wastewateroperatorguidelinepdf.pdf"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "DE",
    "dedicatedCourseNeeds": [
      "Delaware drinking-water routing needs a Base-level License track, not assumed treatment grades 1–4; its defined scope includes general water-system information, hypochlorination, and smaller-system distribution operation and maintenance. Obtain the current DPH exam outline/provider confirmation before asserting exam alignment.",
      "Provide separate routing specifications for Delaware treatment endorsements and Appendix A unit-process subcategories: Disinfection, Chemical feed, Filtration, Surface water operations, and Other specified treatment; handle Approved sampler/tester and Limited license separately. Limited licensure requires a Division-approved course and examination.",
      "Distribution needs Delaware Distribution-license/endorsement routing and a 16 DE Admin. Code 4463 regulatory component. Resolve the official form’s 25-psi wording versus the regulation’s 20 psi with DPH.",
      "Wastewater treatment needs Delaware state-exam preparation specifications separately for Levels I–IV, using 7 DE Admin. Code 7204 and Board-confirmed level-specific outlines; do not substitute a verified-shared WPI course designation.",
      "Do not assign a Delaware wastewater-collection exam course until a separate authority, credential ladder and examination scope are confirmed."
    ],
    "limits": [
      "Assessment requested as of October 3, 2026; official sources were retrieved October 4, 2026. The September 2026 DPH report predates the cutoff, but no archived snapshot of every live page was verified.",
      "Eight official source opens were used, including one short-form drinking-water regulation URL that returned no substantive text; the DPH-linked long-form regulation was successfully opened instead.",
      "No explicit standardized WPI/ABC scope and local-to-WPI class correspondence was found for any stream; all verifiedSharedLevels remain empty.",
      "Drinking-water exam-provider identity and separate mandatory/voluntary wastewater-collection certification remain unverified. No finding relies on commercial preparation claims, membership, contact listings, reciprocity, or search snippets."
    ],
    "name": "Delaware",
    "streams": [
      {
        "authorityName": "Delaware Department of Health and Social Services, Division of Public Health, Office of Drinking Water; Secretary issues licenses on recommendation of the Advisory Council for Certification of Public Water System Operators",
        "authorityUrl": "https://dhss.delaware.gov/dph/homepage/about/sections/hsp/licenses-and-permits/odw/public-water-system-supervision/pwso-certification/",
        "examSystem": "unverified",
        "localLevels": "Base-level water supply operator, with applicable endorsements: Disinfection; Chemical feed; Filtration; Surface water operations; Other specified treatment; Approved sampler/tester. Specialty statuses include Operator-in-training (OIT) license, Limited license, and renewal-only Grandfather clause license. No numbered treatment grades I–IV.",
        "note": "Delaware uses a base-level/process-endorsement structure, not a four-grade treatment ladder. The regulation permits a third party to prepare examinations but does not identify the provider or standardized versus customized scope. Neither standardized WPI/ABC use nor a local-to-WPI class correspondence is verified; do not route to shared levels 1–4.",
        "sources": [
          {
            "evidence": "Sections 5.2 and 6.1 establish base-level licensing and process endorsements. Section 7.1 permits contracting a third party to prepare, administer, and grade examinations; 7.1.2 says examinations remain the Advisory Council’s property.",
            "title": "16 DE Admin. Code 4463  -  Licensing and Registration of Operators of Public Water Supply Systems",
            "url": "https://regulations.delaware.gov/AdminCode/title16/Department%20of%20Health%20and%20Social%20Services/Division%20of%20Public%20Health/Health%20Systems%20Protection%20%28HSP%29/4463.shtml"
          },
          {
            "evidence": "Exam choices are Base Level Water Operator (including Operator-in-Training), Disinfection, Chemical Feed, Filtration, Surface Water, Distribution, and Other treatments - not treatment grades 1–4.",
            "title": "Water Treatment Plant Operator Examination Registration Form, revised July 2023",
            "url": "https://dhss.delaware.gov/wp-content/uploads/sites/12/dph/pdf/watropreg.pdf"
          },
          {
            "evidence": "The Operator Training section says DTCC conducts Base Level Water Operator training for the state certification exam and describes specialized limited-license training.",
            "title": "State of Delaware Capacity Development Program Report to the Governor, September 2026",
            "url": "https://dhss.delaware.gov/wp-content/uploads/sites/12/2026/08/DECapacityDevelopmentProgramRpttotheGov2026.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Delaware Department of Health and Social Services, Division of Public Health, Office of Drinking Water; Secretary issues licenses on recommendation of the Advisory Council for Certification of Public Water System Operators",
        "authorityUrl": "https://dhss.delaware.gov/dph/homepage/about/sections/hsp/licenses-and-permits/odw/public-water-system-supervision/pwso-certification/",
        "examSystem": "unverified",
        "localLevels": "Distribution license for distribution-only operators; Distribution endorsement on a Base-level License. Base-level License includes distribution operation and maintenance for systems having flow less than 500 gpm at 20 psi. Appendix A names Distribution subcategories: Flow less than 500 gpm at 20 psi; Flow greater than 500 gpm at 20 psi. No numbered distribution grades I–IV.",
        "note": "Distribution is independently supported by the regulation and exam form. Section 6.2.4 expressly requires a distribution-license written examination, but its provider and standardized/customized status are unspecified. No WPI class mapping is established.",
        "sources": [
          {
            "evidence": "Sections 5.3 and 6.2.4 establish a distribution-only license and require its written examination. Sections 4.3–4.4 address the Distribution endorsement; Appendix A lists two flow-based subcategories.",
            "title": "16 DE Admin. Code 4463  -  Licensing and Registration of Operators of Public Water Supply Systems",
            "url": "https://regulations.delaware.gov/AdminCode/title16/Department%20of%20Health%20and%20Social%20Services/Division%20of%20Public%20Health/Health%20Systems%20Protection%20%28HSP%29/4463.shtml"
          },
          {
            "evidence": "Lists a separate Distribution exam choice, labeled ‘flow >500gpm at 25 psi.’ The pressure differs from the regulation’s 20 psi.",
            "title": "Water Treatment Plant Operator Examination Registration Form, revised July 2023",
            "url": "https://dhss.delaware.gov/wp-content/uploads/sites/12/dph/pdf/watropreg.pdf"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Delaware Department of Natural Resources and Environmental Control, Division of Water; Secretary licenses operators with advice and assistance from the Board of Certification for Operators of Wastewater Facilities",
        "authorityUrl": "https://dnrec.delaware.gov/water/commercial-government/wastewater-facilities/operators/",
        "examSystem": "state-specific",
        "localLevels": "Level I, Level II, Level III, Level IV. Additional statuses: Operator-In-Training (OIT) License; Temporary Level I OIT License; Emergency License; facility-specific Specialty License. Treatment facilities are classified Class I–IV, distinct from operator Level names.",
        "note": "Mandatory treatment-facility licensing uses separate Delaware examinations for each operator Level. The regulation directs the Board or its authorized designee to prepare examinations and expressly calls the entry examination the Delaware Wastewater Operator State Examination. ABC guideline references and reciprocity provisions do not establish ABC/WPI standardized exams.",
        "sources": [
          {
            "evidence": "Section 6.2 names operator Levels I–IV. Section 7.1: ‘The Board, or its authorized designee, shall prepare written examinations’; 7.4 requires separate examinations for each Level. Section 8.1.8.3 names the ‘Delaware Wastewater Operator State Examination.’",
            "title": "7 DE Admin. Code 7204  -  Regulations for Licensing Operators of Wastewater Facilities",
            "url": "https://regulations.delaware.gov/AdminCode/title7/7204"
          },
          {
            "evidence": "DNREC administers the program with Board assistance; all wastewater treatment facilities require Delaware licensed supervision. The 2026 exam section states there is a separate written exam for each license level.",
            "title": "DNREC  -  Wastewater Operator Certification",
            "url": "https://dnrec.delaware.gov/water/commercial-government/wastewater-facilities/operators/"
          },
          {
            "evidence": "Lists Temporary, I, II, III and IV licenses and separate exams consisting of multiple-choice and true/false questions.",
            "title": "Wastewater Operator Licensing Overview Brochure, revised September 2024",
            "url": "https://documents.dnrec.delaware.gov/Water/Wastewater/wastewater-operators-brochure.pdf"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Separate wastewater-collection certifying authority not verified; DNREC Division of Water administers the verified wastewater-treatment program",
        "authorityUrl": "https://dnrec.delaware.gov/water/commercial-government/wastewater-facilities/operators/",
        "examSystem": "unverified",
        "localLevels": "No separate collection credential or collection grade names verified.",
        "note": "The opened DNREC documents establish treatment-facility licensing, not a separately identified collection certification/exam. References to pipes or segments of facilities do not prove a collection credential. Neither mandatory nor voluntary collection certification, its authority, nor WPI/ABC examination scope was verified; this is not a finding that collection certification is unavailable.",
        "sources": [
          {
            "evidence": "Sections 1.2, 4.1 and 6.2 define treatment-facility licensing and four operator Levels; no separate collection-license ladder is established in the opened regulation.",
            "title": "7 DE Admin. Code 7204  -  Regulations for Licensing Operators of Wastewater Facilities",
            "url": "https://regulations.delaware.gov/AdminCode/title7/7204"
          },
          {
            "evidence": "The program page states the supervision requirement for wastewater treatment facilities and describes license-level exams, without identifying a separate collection program.",
            "title": "DNREC  -  Wastewater Operator Certification",
            "url": "https://dnrec.delaware.gov/water/commercial-government/wastewater-facilities/operators/"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "FL",
    "dedicatedCourseNeeds": [
      "Water treatment: Florida Class D/C/B/A-specific preparation aligned to DEP’s separate outlines, including Class D small-system operation/reporting and Class A management/process control. Include Florida drinking-water rules 62-550, 62-555, 62-560 and treatment staffing rule 62-699, F.A.C.",
      "Water distribution: Florida Level 3/2/1 routing and DEP’s distribution outline, including drinking-water regulations, disinfection, equipment, system design/inspection, water quality, safety, administration, and math. Do not create a new-entry Level 4 pathway without clarification.",
      "Domestic wastewater treatment: separate Class D/C/B/A outlines, including Class D package plants/disinfection, Class B nutrient removal/solids handling, and Class A management/process control; address rules 62-600, 62-601, 62-620, 62-640 and 62-699, F.A.C. Reflect the documented Class B approved-course update.",
      "Voluntary collection certification: provider-specific Level 3 collection inspection/testing, lift-station and pipeline maintenance/repair, safety, and math; Level 2 administration, inflow/infiltration, and sewer rehabilitation; Level 1 supervision and lower-level technical review. Confirm the actual exam specification before claiming exam alignment."
    ],
    "limits": [
      "Research cutoff: October 3, 2026. Sources were retrieved October 4, 2026; the current DEP handbook is revised June 2026 and the newest cited collection event occurred September 2026. No archived October 3 snapshot was verified.",
      "Eight source opens completed. Exam-system classifications remain unverified where authoritative opened material did not resolve provenance; this is not a finding that WPI/ABC is unsupported or unused.",
      "No standardized WPI/ABC scope plus explicit local-grade correspondence was established for any stream; every verifiedSharedLevels array is therefore empty.",
      "DEP sources conflict on Level 4 distribution examination availability: new licensing begins at Level 3, the current handbook names exams 1–3, while the examination fee page still lists Level 4.",
      "FW&PCOA collection evidence is from the voluntary certifying provider itself, not proof of a mandatory state certification or state-designated WPI exam. Its opened pages do not disclose exam provenance.",
      "DEP states that preparatory courses cannot substitute for its approved qualifying course. Identified local preparation needs do not establish Echelon course approval or any coverage/pass guarantee."
    ],
    "name": "Florida",
    "streams": [
      {
        "authorityName": "Florida Department of Environmental Protection (DEP), Operator Certification Program",
        "authorityUrl": "https://floridadep.gov/water/certification-restoration/content/water-and-domestic-wastewater-operator-certification",
        "examSystem": "unverified",
        "localLevels": "Class D, Class C, Class B, Class A (ascending).",
        "note": "Mandatory DEP licensure. Current DEP documents establish Florida class-specific examinations, outlines, and regulatory content, but do not explicitly establish whether the examination bank is state-developed, customized ABC, or standardized WPI/ABC. PSI delivery is not proof of exam content. No explicit standardized scope or Florida-class-to-WPI-class correspondence verified.",
        "sources": [
          {
            "evidence": "‘Florida Statutes require that anyone who operates a drinking water treatment plant, domestic wastewater treatment plant and/or water distribution system be licensed by DEP.’ PSI is identified as the testing vendor.",
            "title": "Water and Domestic Wastewater Operator Certification Program",
            "url": "https://floridadep.gov/water/certification-restoration/content/water-and-domestic-wastewater-operator-certification"
          },
          {
            "evidence": "Examination overview names ‘Class A, Class B, Class C, and Class D’ for drinking-water and wastewater treatment. Separate drinking-water subject outlines are provided for each class; the handbook warns that listed FDEP rules can appear on licensing exams.",
            "title": "Operator Certification Program Handbook  -  revised June 2026",
            "url": "https://floridadep.gov/sites/default/files/ocp_handbook%20July%202026.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Florida Department of Environmental Protection (DEP), Operator Certification Program",
        "authorityUrl": "https://floridadep.gov/water/certification-restoration/content/water-distribution-system-operator-licensing",
        "examSystem": "unverified",
        "localLevels": "Level 3, Level 2, Level 1 (current new-licensure progression); Level 4 also appears in renewal information, but current Level 4 examination availability is unverified.",
        "note": "Mandatory DEP licensure, distinct from treatment certification. Licensing page requires new applicants to begin at Level 3 and take the ‘applicable state distribution examination.’ That wording and Florida outlines do not conclusively distinguish state-developed from customized ABC examinations. Standardized WPI/ABC scope and class correspondence are unverified; Florida numbering must not be mapped directly to WPI classes.",
        "sources": [
          {
            "evidence": "‘All individuals now wishing to obtain a water distribution license must begin the licensure process at Level 3’; progression table lists 3, 2, 1. Renewal text includes levels ‘1, 2, 3 & 4.’",
            "title": "Water Distribution System Operator Licensing",
            "url": "https://floridadep.gov/water/certification-restoration/content/water-distribution-system-operator-licensing"
          },
          {
            "evidence": "Distribution examination section names ‘Level 1, 2, or 3’ and provides a distribution-specific outline including drinking-water regulations, equipment, disinfection, system design/inspection, water quality, safety, administration, and math.",
            "title": "Operator Certification Program Handbook  -  revised June 2026",
            "url": "https://floridadep.gov/sites/default/files/ocp_handbook%20July%202026.pdf"
          },
          {
            "evidence": "Requires Level 3 licensure before the Level 2 exam and Level 2 licensure before the Level 1 exam. Its fee table still lists a Distribution Level 4 examination, creating an availability ambiguity against the current handbook and new-entry instructions.",
            "title": "Examination Application Overview",
            "url": "https://floridadep.gov/water/certification-restoration/content/examination-application-overview"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Florida Department of Environmental Protection (DEP), Operator Certification Program",
        "authorityUrl": "https://floridadep.gov/water/certification-restoration/content/water-and-domestic-wastewater-operator-certification",
        "examSystem": "unverified",
        "localLevels": "Class D, Class C, Class B, Class A (ascending), for domestic wastewater treatment.",
        "note": "Mandatory DEP licensure. Wastewater evidence was checked independently in the handbook’s separate wastewater examination outlines. Exam-bank provenance remains ambiguous between state-developed, customized ABC, and standardized WPI/ABC; no explicit standardized scope or local-to-WPI class correspondence verified.",
        "sources": [
          {
            "evidence": "Specifically requires DEP licensure for domestic wastewater treatment plant operators. It identifies Operation of Wastewater Treatment Plants, Volume 3, enrollments A and B, as the updated CSUS approved course for the Wastewater Class B examination.",
            "title": "Water and Domestic Wastewater Operator Certification Program",
            "url": "https://floridadep.gov/water/certification-restoration/content/water-and-domestic-wastewater-operator-certification"
          },
          {
            "evidence": "Separate wastewater outlines name Classes A, B, C, D. Class B includes nutrient removal and solids handling; Class D includes ‘Package Plants & Disinfection.’ Domestic wastewater rules listed are 62-600, 62-601, 62-620, and 62-640, F.A.C.",
            "title": "Operator Certification Program Handbook  -  revised June 2026",
            "url": "https://floridadep.gov/sites/default/files/ocp_handbook%20July%202026.pdf"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Florida Water and Pollution Control Operators Association (FW&PCOA), voluntary certification program",
        "authorityUrl": "https://www.fwpcoa.org/content.aspx?page_id=22&club_id=859275&module_id=226429",
        "examSystem": "unverified",
        "localLevels": "Level 3, Level 2, Level 1 (ascending).",
        "note": "A voluntary FW&PCOA certification pathway was identified, not a DEP collection-system operator license. The provider explicitly grants certification from Level 3 through Level 1. Opened pages support the local certification structure and curricula but do not identify the certification examination bank or establish state designation of this collection exam. Neither standardized WPI/ABC use nor a class correspondence is verified; do not label this stream not-offered.",
        "sources": [
          {
            "evidence": "‘The FW&PCOA has been providing the voluntary certification of wastewater collection system operators since 1981.’ ‘The association grants certification step-wise, starting at the 3 level and progressing to the 1 level.’ Describes distinct Level 3 and Level 2 curricula.",
            "title": "Region 11 Wastewater Collection Short School  -  October 2025",
            "url": "https://www.fwpcoa.org/content.aspx?page_id=4002&club_id=859275&item_id=2544576"
          },
          {
            "evidence": "Names ‘Wastewater Collection System Operator 1’; its curriculum covers supervisory functions, leadership, conflict resolution, decision-making, motivation, and review of Level 3 and 2 concepts. Collection students receive separate certification applications.",
            "title": "Region 9 Wastewater Collections 1 and Water Distribution 1 Courses  -  September 2026",
            "url": "https://fwpcoa.org/content.aspx?page_id=4002&club_id=859275&item_id=2768749"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "GA",
    "dedicatedCourseNeeds": [
      "Separate Georgia Class IIIG groundwater route using the state-hosted GA Groundwater outline: wells/source protection, treatment/disinfection, distribution, maintenance, laboratory work and compliance. Exam provenance still requires confirmation; do not label it WPI-customized or state-authored without evidence.",
      "Separate Georgia water Class IV Very Small Water System and biological wastewater Class IV Small Wastewater System preparation; neither is equivalent to the generic WPI treatment Class IV course.",
      "If industrial wastewater is included, provide a distinct unnumbered Industrial Wastewater Treatment System Operator route tied to its physical/chemical industrial outline rather than the biological treatment ladder.",
      "Apply Georgia's actual class crosswalk and local certification requirements. Board-approved coursework requirements are water IV 6 hours, III 40 hours, IIIG 40 groundwater hours, II 48 advanced hours; biological wastewater IV 6 hours of waste-stabilization-pond instruction, III 40 hours, II 48 advanced hours; distribution, collection and industrial wastewater each 27 hours. Exam preparation is not automatically Board-approved prerequisite training.",
      "Resolve biological wastewater Classes I and II before shared-course routing; no exact standardized class mapping for those branches was verified in this acquisition."
    ],
    "limits": [
      "As-of target: October 3, 2026. Live sources were accessed October 4, 2026; they are not archived snapshots proving their wording on the cutoff date.",
      "Eight source opens used. No snippets were used as evidence. Standardized findings use the Board's specific exam-content links cross-referenced to explicitly standardized WPI titles; generic ABC content, membership, reciprocity and PSI delivery were not treated as proof.",
      "verifiedSharedLevels contains WPI standardized class numbers, not Georgia class numbers. Specialty small-system and industrial exams are outside this 1–4 field.",
      "The opened Board exam page designates PSI for water and wastewater testing but does not itself establish standardized exam status: https://sos.ga.gov/page/georgia-board-examiners-certification-water-wastewater-treatment-plant-operators-and-1 .",
      "Do not silently substitute 2025 standardized outlines: the Board-linked profiles were matched to their actual titles, including the historical standardized directory; adoption of newer forms was not verified.",
      "The September 21, 2026 notice for Rule 750-3-.04 proposes eligibility changes, with a hearing October 21, 2026; it was not treated as an adopted rule at the cutoff: https://sos.ga.gov/sites/default/files/forms/R%20750-3-.04-Revised%20NOH_2-signed.pdf ."
    ],
    "name": "Georgia",
    "streams": [
      {
        "authorityName": "Georgia Board of Examiners for Certification of Water and Wastewater Treatment Plant Operators and Laboratory Analysts",
        "authorityUrl": "https://sos.ga.gov/page/georgia-board-examiners-certification-water-wastewater-treatment-plant-operators-and",
        "examSystem": "mixed",
        "localLevels": "Public Water Supply System Operator: Class I, II, III, IIIG, or IV.",
        "note": "Partial standardized routing is supported: Georgia Class III → WPI Water Treatment Class I; Georgia Class II → WPI Class III; Georgia Class I → WPI Class IV. These mappings come from the Board's exam-content links matching WPI's explicitly standardized directory, not matching Roman numerals. Georgia Class IV instead links to Standardized Very Small Water System Operator, outside the 1–4 treatment ladder. Class IIIG has a separate GA Groundwater examination outline, but the opened document does not identify whether the exam is WPI-customized or state-authored; therefore the complete stream's exam system remains unverified.",
        "sources": [
          {
            "evidence": "Rule 750-3-.03(a): 'Public Water Supply System Operator: Class I, II, III, IIIG, or IV'; Rule 750-3-.01 requires certification.",
            "title": "Georgia Board Rules, Chapter 750-3  -  Classifications and Requirements",
            "url": "https://rules.sos.ga.gov/gac/750-3"
          },
          {
            "evidence": "The Board says the linked guides describe content covered on the exam. Its Georgia Water Class III, II and I links are respectively /download/1161/, /1167/ and /1170/; Class IV links to /6295/ and groundwater Class III to the separate state-hosted outline.",
            "title": "Georgia Board FAQ  -  Examination Study Guides",
            "url": "https://sos.ga.gov/page/georgia-board-examiners-certification-water-wastewater-treatment-plant-operators-and"
          },
          {
            "evidence": "Explicitly lists /1161/, /1167/ and /1170/ as 2019 Standardized Water Treatment Classes I, III and IV respectively; /6295/ is Standardized Very Small Water System Operator.",
            "title": "WPI Historical Need-to-Know Criteria",
            "url": "https://gowpi.org/services/abc-testing/need-to-know-criteria/"
          },
          {
            "evidence": "Separate examination content outline covers source-water characteristics, treatment, distribution components, equipment, laboratory analysis, and security/safety/compliance/administration. It does not identify standardized status or exam authorship.",
            "title": "Exam Specifications Document  -  GA Groundwater",
            "url": "https://sos.ga.gov/sites/default/files/2024-03/Class%20IIIG%20Need%20to%20Know.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": [
          1,
          3,
          4
        ]
      },
      {
        "authorityName": "Georgia Board of Examiners for Certification of Water and Wastewater Treatment Plant Operators and Laboratory Analysts",
        "authorityUrl": "https://sos.ga.gov/page/georgia-board-examiners-certification-water-wastewater-treatment-plant-operators-and",
        "examSystem": "wpi-standardized",
        "localLevels": "Water Distribution System Operator (one unnumbered certification).",
        "note": "The Board's Water Distribution System Operator exam-content link matches WPI's explicitly standardized Water Distribution Class I outline. Do not create Georgia distribution Classes II–IV: the official classifications list only the unnumbered certificate. Mandatory Board certification, not a voluntary association ladder.",
        "sources": [
          {
            "evidence": "Rule 750-3-.03(b) lists 'Water Distribution System Operator' without classes; .01(2) requires certification and .04(b)6 requires a Board-approved 27-hour water distribution course.",
            "title": "Georgia Board Rules, Chapter 750-3  -  Classifications and Requirements",
            "url": "https://rules.sos.ga.gov/gac/750-3"
          },
          {
            "evidence": "Under guides describing exam content, 'Georgia Water Distribution System Operator' links to WPI /download/6382/.",
            "title": "Georgia Board FAQ  -  Examination Study Guides",
            "url": "https://sos.ga.gov/page/georgia-board-examiners-certification-water-wastewater-treatment-plant-operators-and"
          },
          {
            "evidence": "Under '2019 Standardized Water Distribution Operator Need-to-Know', /download/6382/ is explicitly 'WPI Standardized Water Distribution Operator Class I'.",
            "title": "WPI Historical Need-to-Know Criteria",
            "url": "https://gowpi.org/services/abc-testing/need-to-know-criteria/"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": [
          1
        ]
      },
      {
        "authorityName": "Georgia Board of Examiners for Certification of Water and Wastewater Treatment Plant Operators and Laboratory Analysts",
        "authorityUrl": "https://sos.ga.gov/page/georgia-board-examiners-certification-water-wastewater-treatment-plant-operators-and",
        "examSystem": "mixed",
        "localLevels": "Biological Wastewater Treatment System Operator: Class I, II, III or IV; Industrial Wastewater Treatment System Operator (unnumbered).",
        "note": "Georgia biological Class III → ABC/WPI standardized Wastewater Treatment Class I is verified through the Board's exact link and the opened outline. Georgia biological Class IV links to Standardized Small Wastewater System Operator, not treatment Class IV. The industrial certificate links to Standardized Physical Chemical Industrial Waste Treatment Operator, a separate specialty. Georgia biological Classes I and II have Board-linked outlines, but their standardized scope and WPI class correspondence were not verified within the source-open cap; do not infer them from the drinking-water crosswalk. Full-stream routing remains unverified.",
        "sources": [
          {
            "evidence": "Rule 750-3-.03(c) lists Biological Wastewater Treatment System Operator Classes I–IV; .03(d) separately lists Industrial Wastewater Treatment System Operator. Certification is mandatory under .01.",
            "title": "Georgia Board Rules, Chapter 750-3  -  Classifications and Requirements",
            "url": "https://rules.sos.ga.gov/gac/750-3"
          },
          {
            "evidence": "Georgia Wastewater Class III links to /1147/; Class IV to /6293/; Industrial Operator to /6287/. Georgia Classes I and II link to /1156/ and /1153/, whose contents were not opened.",
            "title": "Georgia Board FAQ  -  Examination Study Guides",
            "url": "https://sos.ga.gov/page/georgia-board-examiners-certification-water-wastewater-treatment-plant-operators-and"
          },
          {
            "evidence": "The opened Board-linked outline states it describes 'the ABC Standardized Wastewater Treatment Operator Class I exam' and is reflective only of that standardized exam, distinguishing it from customized exams.",
            "title": "ABC Wastewater Treatment Operator Class I  -  Need-to-Know Criteria",
            "url": "https://www.gowpi.org/download/1147/?tmstv=1683650086"
          },
          {
            "evidence": "Explicitly identifies /6293/ as Standardized Small Wastewater System Operator and /6287/ as Standardized Physical Chemical Industrial Waste Treatment Operator.",
            "title": "WPI Historical Need-to-Know Criteria",
            "url": "https://gowpi.org/services/abc-testing/need-to-know-criteria/"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": [
          1
        ]
      },
      {
        "authorityName": "Georgia Board of Examiners for Certification of Water and Wastewater Treatment Plant Operators and Laboratory Analysts",
        "authorityUrl": "https://sos.ga.gov/page/georgia-board-examiners-certification-water-wastewater-treatment-plant-operators-and",
        "examSystem": "wpi-standardized",
        "localLevels": "Wastewater Collection System Operator (one unnumbered certification).",
        "note": "The Board's collection exam-content link matches WPI's explicitly standardized Wastewater Collection Class I outline. Do not extend this to WPI Classes II–IV or invent a Georgia numbered collection ladder. Mandatory Board certification, not voluntary certification.",
        "sources": [
          {
            "evidence": "Rule 750-3-.03(e) lists 'Wastewater Collection System Operator' without classes; .01(2) requires certification and .04(b)7 requires a Board-approved 27-hour wastewater collection course.",
            "title": "Georgia Board Rules, Chapter 750-3  -  Classifications and Requirements",
            "url": "https://rules.sos.ga.gov/gac/750-3"
          },
          {
            "evidence": "Under guides describing exam content, 'Georgia Wastewater Collection System Operator' links to WPI /download/1188/.",
            "title": "Georgia Board FAQ  -  Examination Study Guides",
            "url": "https://sos.ga.gov/page/georgia-board-examiners-certification-water-wastewater-treatment-plant-operators-and"
          },
          {
            "evidence": "Under '2019 Standardized Wastewater Collection Operator Need-to-Know', /download/1188/ is explicitly 'WPI Standardized Wastewater Collection Operator Class I'.",
            "title": "WPI Historical Need-to-Know Criteria",
            "url": "https://gowpi.org/services/abc-testing/need-to-know-criteria/"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": [
          1
        ]
      }
    ]
  },
  {
    "code": "HI",
    "dedicatedCourseNeeds": [
      "A Hawaii local-regulations supplement is supported for WTPO and DSO under HAR 11-25, including Grade 1–4 eligibility, no-exam OIT status and certified-operator responsibilities; this is not evidence of a unique Hawaii exam.",
      "A separate wastewater-treatment local-regulations supplement is supported under HAR 11-61, including Grade I–IV eligibility, temporary/OIT status and direct-responsible-charge duties. No customized/state-specific exam outline or unique collection course requirement was verified."
    ],
    "limits": [
      "Assessment cutoff: October 3, 2026. Current official pages and linked pre-cutoff documents were opened; no historical snapshot of the exact cutoff was independently established.",
      "Exploration was capped at eight official source opens. Search snippets, third-party course claims, reciprocity and exam-delivery vendors were not used to prove standardized exams.",
      "All verifiedSharedLevels remain empty because explicit Hawaii standardized-exam adoption and local-grade-to-WPI-class correspondence were not demonstrated. Unverified does not mean unsupported or state-specific.",
      "No distinct mandatory or voluntary wastewater-collection program was verified; confirm its authority, local levels and exam outline before enabling that route."
    ],
    "name": "Hawaii",
    "streams": [
      {
        "authorityName": "Hawaii Department of Health  -  Board of Certification of Public Water System Operators, administered through the Safe Drinking Water Branch",
        "authorityUrl": "https://health.hawaii.gov/sdwb/operatorcert/",
        "examSystem": "unverified",
        "localLevels": "WTP Operator-in-training; WTPO Grade 1, Grade 2, Grade 3, Grade 4.",
        "note": "Treatment certification and local grades are verified. The state directs candidates to WPI examination resources but does not explicitly identify Hawaii's exams as standardized rather than customized. No local-grade-to-WPI-class correspondence is established. OIT certification requires no examination and must not be routed as a separate standardized exam level.",
        "sources": [
          {
            "evidence": "Updated August 27, 2026; identifies the Board of Certification of Public Water System Operators and separate Water Treatment Plant Operator forms. Its Exams section links to WPI examination resources without specifying standardized exam adoption.",
            "title": "Water Systems Operator Certification  -  Safe Drinking Water Branch",
            "url": "https://health.hawaii.gov/sdwb/operatorcert/"
          },
          {
            "evidence": "Q3: 'Both DSO and WTPO exams are offered'; Q4 directs preparation to WPI examination resources. Neither answer specifies standardized versus customized exams.",
            "title": "Public Water System Operator Certification  -  Exam FAQs 2026",
            "url": "https://health.hawaii.gov/sdwb/files/2026/08/Exam-FAQs.pdf"
          },
          {
            "evidence": "Section 11-25-4(b) lists WTP Operator-in-training and WTPO Grades 1–4. Section 11-25-3(1): 'No exam is required for OIT certification.'",
            "title": "HAR Title 11, Chapter 25  -  Certification of Public Water System Operators",
            "url": "https://health.hawaii.gov/opppd/files/2018/08/11-25-003.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Hawaii Department of Health  -  Board of Certification of Public Water System Operators, administered through the Safe Drinking Water Branch",
        "authorityUrl": "https://health.hawaii.gov/sdwb/operatorcert/",
        "examSystem": "unverified",
        "localLevels": "DS Operator-in-training; DSO Grade 1, Grade 2, Grade 3, Grade 4.",
        "note": "Distribution certification and local grades are verified independently within the drinking-water program. A WPI preparation-resource link does not establish standardized distribution exams or a grade-to-WPI-class mapping. OIT is a no-exam certification.",
        "sources": [
          {
            "evidence": "Provides a separate Distribution System Operator certification application and exam registration; identifies the water-system certification board. The exam link is to general WPI examination resources.",
            "title": "Water Systems Operator Certification  -  Safe Drinking Water Branch",
            "url": "https://health.hawaii.gov/sdwb/operatorcert/"
          },
          {
            "evidence": "Q3 expressly confirms DSO examinations; Q4 supplies a WPI resource link but no standardized-exam designation.",
            "title": "Public Water System Operator Certification  -  Exam FAQs 2026",
            "url": "https://health.hawaii.gov/sdwb/files/2026/08/Exam-FAQs.pdf"
          },
          {
            "evidence": "Section 11-25-4(c) lists DS Operator-in-training and DSO Grades 1–4. Section 11-25-3(1) exempts OIT certification from examination.",
            "title": "HAR Title 11, Chapter 25  -  Certification of Public Water System Operators",
            "url": "https://health.hawaii.gov/opppd/files/2018/08/11-25-003.pdf"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Hawaii Department of Health  -  Board of Certification of Operating Personnel in Wastewater Treatment Plants, administered through the Wastewater Branch",
        "authorityUrl": "https://health.hawaii.gov/wastewater/home/boc/",
        "examSystem": "unverified",
        "localLevels": "Wastewater Treatment Plant Operator Grade 1, Grade 2, Grade 3, Grade 4 (HAR examination designations: grade I, II, III, IV); temporary/operator-in-training certification is also authorized without examination.",
        "note": "The state expressly labels its examinations ABC, but standardized versus customized ABC/WPI scope is not identified in the opened sources. PSI delivery is not evidence of standardized content. No Hawaii-grade-to-WPI-class mapping is established. This is a mandatory treatment-plant certification program, not proof of a collection certification.",
        "sources": [
          {
            "evidence": "The 2026 schedule labels 'ABC Certification Operator Exam'; the page lists Grades 1–4, paper and computer-based examinations, and 'Reference Material for ABC WW Treatment Exams.' It does not call the Hawaii exams standardized.",
            "title": "Board of Certification  -  Wastewater Branch",
            "url": "https://health.hawaii.gov/wastewater/home/boc/"
          },
          {
            "evidence": "Issued by the Board of Certification of Operating Personnel in Wastewater Treatment Plants; expressly concerns treatment-plant operators and new grade-level examinations.",
            "title": "Notice of Certification Examination for Wastewater Treatment Plant Operators  -  August 20, 2026",
            "url": "https://health.hawaii.gov/wastewater/files/2026/02/August-2026-Exam-Announcement.pdf"
          },
          {
            "evidence": "Section 11-61-4 specifies grade I, II, III and IV examinations. Section 11-61-3(d)(1) permits temporary certificates for an operator in training without examination.",
            "title": "HAR Title 11, Chapter 61  -  Mandatory Certification of Wastewater Treatment Personnel in Wastewater Treatment Plants",
            "url": "https://health.hawaii.gov/opppd/files/2015/06/11-611.pdf"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "No separate wastewater-collection certifying authority verified; the reviewed Hawaii Department of Health Wastewater Branch board sources establish treatment certification only",
        "authorityUrl": "https://health.hawaii.gov/wastewater/home/boc/",
        "examSystem": "unverified",
        "localLevels": "No separate wastewater-collection certification grades verified.",
        "note": "Neither mandatory nor voluntary collection certification was established from official sources within the acquisition limit. Collection courses accepted for treatment education credit do not establish a separate collection certification or exam. Do not infer collection eligibility from drinking-water or wastewater-treatment evidence; absence here is not a finding that certification is not offered.",
        "sources": [
          {
            "evidence": "The certification and examination provisions apply to wastewater treatment plant operators. Section 11-61-4 recognizes wastewater-collection coursework as education credit, not as a separate collection credential.",
            "title": "HAR Title 11, Chapter 61  -  Mandatory Certification of Wastewater Treatment Personnel in Wastewater Treatment Plants",
            "url": "https://health.hawaii.gov/opppd/files/2015/06/11-611.pdf"
          },
          {
            "evidence": "Describes the treatment-plant certification board and lists collection-system courses under continuing education; it identifies no separate collection examination or collection grade ladder.",
            "title": "Board of Certification  -  Wastewater Branch",
            "url": "https://health.hawaii.gov/wastewater/home/boc/"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "ID",
    "dedicatedCourseNeeds": [
      "Separate specialty routing and outline verification are needed for the administrator-listed Idaho Very Small Water System, Idaho Small Wastewater System/Lagoon, and Idaho Land Application exams; do not merge them into numbered WPI classes or claim they are state-written without further evidence.",
      "Very Small Drinking Water training needs chlorination and drinking-water distribution content: Rule 100.03.b specifies twelve course hours. Very Small Wastewater training needs pumps/motors or collection content and lagoon operation/maintenance, large soil absorption system, or wastewater-treatment content: Rule 100.03.c specifies six hours in each grouping.",
      "An Idaho licensing/regulatory orientation should reflect the July 1, 2026 rules, including system-limited Class I Restricted licensing, supervised Operator-In-Training practice, and the active wastewater-treatment license prerequisite for Land Application. These are verified licensing requirements, not verified exam-outline topics."
    ],
    "limits": [
      "October 3, 2026 is the target date. Live official pages show September 2026 updates, and the operative classification provisions are dated July 1, 2026; no archived October 3 snapshot was obtained.",
      "Exploration stopped at eight source opens, using official Idaho authority pages/rules and the state-designated PSI administrator. Search snippets and third-party standardized-exam claims were not used as proof.",
      "The currently linked PSI bulletin is updated October 1, 2024. PSI delivery, the abc-id portal name, ABC study criteria, and ABC’s standard formula sheet do not establish standardized rather than customized exams; all four streams therefore remain unverified with empty shared-level arrays.",
      "The rule PDF cover still mentions Wastewater Treatment Operator  -  Lagoon, but operative Rule 100.01 omits a separate Lagoon classification while PSI lists Small Wastewater System/Lagoon. Obtain Board clarification before finalizing that specialty route.",
      "These findings establish offered licenses and examinations, not the mandatory-versus-voluntary staffing obligations for every system or grade."
    ],
    "name": "Idaho",
    "streams": [
      {
        "authorityName": "Idaho Board of Drinking Water and Wastewater Professionals, Division of Occupational and Professional Licenses (DOPL)",
        "authorityUrl": "https://dopl.idaho.gov/wwp/",
        "examSystem": "unverified",
        "localLevels": "Drinking Water Treatment Operator: Operator-In-Training; Class I Restricted; Class I; Class II; Class III; Class IV. Very Small Drinking Water Systems is a separate drinking-water system credential, not a numbered treatment class.",
        "note": "Idaho-specific treatment exams numbered 1–4 are listed by the state-designated administrator. Neither that list nor the linked bulletin explicitly identifies them as WPI/ABC standardized rather than customized exams. No local-to-WPI class equivalence is verified; Operator-In-Training and Class I Restricted exam correspondence is also unverified.",
        "sources": [
          {
            "evidence": "Rule 100.01, dated 7-1-26, lists Drinking Water Treatment Operator classifications: ‘Operator-In-Training, Class I Restricted, Class I, II, III, or IV.’",
            "title": "IDAPA 24.05.01  -  Rules of the Board of Drinking Water and Wastewater Professionals",
            "url": "https://adminrules.idaho.gov/rules/current/24/240501.pdf"
          },
          {
            "evidence": "Lists ‘Idaho Water Treatment Class 1’ through ‘Idaho Water Treatment Class 4’; does not label them standardized or customized.",
            "title": "Idaho Drinking Water & Wastewater Professionals  -  Available Tests",
            "url": "https://test-takers.psiexams.com/abc-id/test"
          },
          {
            "evidence": "Bulletin updated 10/1/2024 states examinations are delivered at PSI Test Centers and ‘ABC’s standard formula sheet’ is provided. A standard formula sheet is not evidence of a standardized exam.",
            "title": "Idaho Board of Drinking Water & Wastewater Professionals  -  Candidate Bulletin",
            "url": "https://test-takers.psiexams.com/api/content/bulletin/11027"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Idaho Board of Drinking Water and Wastewater Professionals, Division of Occupational and Professional Licenses (DOPL)",
        "authorityUrl": "https://dopl.idaho.gov/wwp/",
        "examSystem": "unverified",
        "localLevels": "Drinking Water Distribution Operator: Operator-In-Training; Class I Restricted; Class I; Class II; Class III; Class IV. Separate credential: Very Small Drinking Water Systems.",
        "note": "The administrator lists distribution exams numbered 1–4 and a separate Very Small Water System exam. Their standardized, customized ABC, or state-specific identity is not established. Very Small, Operator-In-Training, and Class I Restricted must not be automatically mapped to WPI Class I.",
        "sources": [
          {
            "evidence": "Rule 100.01 lists Drinking Water Distribution Operator as ‘Operator-In-Training, Class I Restricted, Class I, II, III, or IV’ and separately lists ‘Very Small Drinking Water Systems.’ Rule 100.03.b requires twelve hours of chlorination and drinking-water distribution courses for Very Small Drinking Water.",
            "title": "IDAPA 24.05.01  -  Rules of the Board of Drinking Water and Wastewater Professionals",
            "url": "https://adminrules.idaho.gov/rules/current/24/240501.pdf"
          },
          {
            "evidence": "Lists ‘Idaho Water Distribution Class 1’ through ‘Class 4’ and ‘Idaho Very Small Water System’; no standardized/customized designation is given.",
            "title": "Idaho Drinking Water & Wastewater Professionals  -  Available Tests",
            "url": "https://test-takers.psiexams.com/abc-id/test"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Idaho Board of Drinking Water and Wastewater Professionals, Division of Occupational and Professional Licenses (DOPL)",
        "authorityUrl": "https://dopl.idaho.gov/wwp/",
        "examSystem": "unverified",
        "localLevels": "Wastewater Treatment Operator: Operator-In-Training; Class I Restricted; Class I; Class II; Class III; Class IV; Land Application. Separate credential: Very Small Wastewater Systems. The current operative classification table does not separately list Lagoon.",
        "note": "Wastewater-treatment exams numbered 1–4 are directly documented, independently of drinking-water evidence. PSI also lists Land Application and Small Wastewater System/Lagoon exams. No opened authority/administrator source establishes standardized WPI scope, customized ABC identity, or a state-written exam. The Lagoon terminology discrepancy requires clarification.",
        "sources": [
          {
            "evidence": "Rule 100.01 lists treatment classifications ‘Operator-In-Training, Class I Restricted, Class I, II, III, IV, or Land Application’ plus separate ‘Very Small Wastewater Systems.’ Rule 100.03.i requires Land Application operators to maintain an active Wastewater Treatment Operator license.",
            "title": "IDAPA 24.05.01  -  Rules of the Board of Drinking Water and Wastewater Professionals",
            "url": "https://adminrules.idaho.gov/rules/current/24/240501.pdf"
          },
          {
            "evidence": "Lists ‘Idaho Wastewater Treatment Class 1’ through ‘Class 4,’ ‘Idaho Land Application,’ and ‘Idaho Small Wastewater System/Lagoon.’",
            "title": "Idaho Drinking Water & Wastewater Professionals  -  Available Tests",
            "url": "https://test-takers.psiexams.com/abc-id/test"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Idaho Board of Drinking Water and Wastewater Professionals, Division of Occupational and Professional Licenses (DOPL)",
        "authorityUrl": "https://dopl.idaho.gov/wwp/",
        "examSystem": "unverified",
        "localLevels": "Wastewater Collections Operator: Operator-In-Training; Class I Restricted; Class I; Class II; Class III; Class IV. Very Small Wastewater Systems is a separate combined-system credential, not a numbered collection class.",
        "note": "Collection licensing and exams numbered 1–4 are independently confirmed. Explicit standardized WPI/ABC scope and local-to-WPI correspondence are absent from the opened sources. The Very Small Wastewater definition includes collection, but that does not establish a separate collection exam or WPI class mapping.",
        "sources": [
          {
            "evidence": "Rule 100.01 uses ‘Wastewater Collections Operator’ with ‘Operator-In-Training, Class I Restricted, Class I, II, III, or IV.’ Rule 002.02 defines Very Small Public Wastewater System as including a collection system and specified limited treatment processes.",
            "title": "IDAPA 24.05.01  -  Rules of the Board of Drinking Water and Wastewater Professionals",
            "url": "https://adminrules.idaho.gov/rules/current/24/240501.pdf"
          },
          {
            "evidence": "Explicitly lists ‘Idaho Wastewater Collection Class 1’ through ‘Idaho Wastewater Collection Class 4.’",
            "title": "Idaho Drinking Water & Wastewater Professionals  -  Available Tests",
            "url": "https://test-takers.psiexams.com/abc-id/test"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "IL",
    "dedicatedCourseNeeds": [
      "Illinois water-treatment preparation organized by local Class A, Class B and Class C process scopes, using Illinois regulations and the state's examination-development framework rather than a presumed WPI 1–4 crosswalk. Revalidate Class C material against the revised-exam work described for 2026; implementation timing was not established.",
      "Illinois Class D pumpage/storage/distribution preparation; do not present it as a separate four-grade distribution credential or equate it to a WPI class.",
      "Municipal wastewater preparation aligned to Illinois's local Class 4 lagoon, Class 3 fixed-film, Class 2 activated-sludge and Class 1 advanced activated-sludge/complex-mathematics outlines, including rules/regulations and the state guide's formula conventions. Exam-provider provenance still requires confirmation.",
      "Separate industrial Class K facility-specific preparation covering treatment schematics, unit processes, monitoring, laboratory interpretation, discharge limits and state/NPDES permit conditions, with short-answer/essay preparation; separate Class R water-remediation preparation following Section 380.430.",
      "One-level Illinois Collection System Operator preparation following Section 380.435 and the current state guide, including lift stations/pumps, monitoring, maintenance, mathematics, records, regulations and safety; no assumed WPI collection grade sequence."
    ],
    "limits": [
      "Assessment targets October 3, 2026. Live official sources were accessed October 4, 2026; no archived October 3 snapshot was verified. The drinking-water report includes July and September 2026 program activity.",
      "Eight official source opens were used. The currently linked Updated 2024 wastewater guide superseded the older August 2019 guide encountered in search; current-guide evidence is used above.",
      "No verifiedSharedLevels are populated: neither explicit standardized WPI/ABC scope nor a supported local-grade-to-WPI-class correspondence was found. Generic professional question-development statements, Agency ownership and ABC study-book references alone do not resolve municipal or collection exam provenance.",
      "Drinking-water scope here is Illinois EPA's community water-supply program; its official page directs non-community supplies to the Illinois Department of Public Health, whose separate requirements were not verified in this bounded review."
    ],
    "name": "Illinois",
    "streams": [
      {
        "authorityName": "Illinois Environmental Protection Agency  -  Drinking Water Operator Certification Program",
        "authorityUrl": "https://epa.illinois.gov/topics/drinking-water/operator-certification.html",
        "examSystem": "state-specific",
        "localLevels": "Class A, Class B, Class C; Class D belongs to the same water-supply certification series but covers pumpage, storage, or distribution rather than treatment processes.",
        "note": "Illinois EPA's examination committee develops and revises its examination question bank, supporting state-specific routing rather than WPI-standardized routing. No standardized WPI/ABC adoption or local-grade-to-WPI-class correspondence was established.",
        "sources": [
          {
            "evidence": "Class A covers coagulation/sedimentation, lime softening, UV disinfection, pathogen removal/inactivation and/or membrane filtration; Class B covers aeration/filtration and/or ion exchange; Class C covers chemical feed only; Class D is limited to pumpage, storage, or distribution.",
            "title": "Illinois EPA  -  Drinking Water Operator Certification Frequently Asked Questions",
            "url": "https://epa.illinois.gov/topics/drinking-water/operator-certification/faqs.html"
          },
          {
            "evidence": "Pages 13–14: the Certification Examination Review Committee includes Illinois EPA personnel, subject-matter experts and training partners, supported by ERTC under contract; it 'reviews and updates questions in the data bank and develops new questions as CWS regulations change.' Revised Class C examination development was the focus of the 2026 annual meeting.",
            "title": "Community Public Water Supply Operator Certification Program Report  -  Calendar Year 2025",
            "url": "https://epa.illinois.gov/content/dam/soi/en/web/epa/topics/drinking-water/operator-certification/documents/Illinois-EPA-OpCert-Report-for-CY25.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Illinois Environmental Protection Agency  -  Drinking Water Operator Certification Program",
        "authorityUrl": "https://epa.illinois.gov/topics/drinking-water/operator-certification.html",
        "examSystem": "state-specific",
        "localLevels": "Class D; higher water-supply certifications Class C, Class B and Class A cumulatively include distribution qualifications. No separate distribution certification series.",
        "note": "Class D is an Illinois water-supply examination, not a verified WPI Distribution Class 1–4 equivalent. The official report expressly establishes distribution scope and local examination development.",
        "sources": [
          {
            "evidence": "Page 5: 'Illinois does not have a separate certification for distribution system operators. Class D certification covers distribution systems. Certifications at higher levels are cumulative and include qualifications for distribution operations.' Pages 13–14 describe Illinois EPA committee development of examination questions and review of the Class D examination in 2025.",
            "title": "Community Public Water Supply Operator Certification Program Report  -  Calendar Year 2025",
            "url": "https://epa.illinois.gov/content/dam/soi/en/web/epa/topics/drinking-water/operator-certification/documents/Illinois-EPA-OpCert-Report-for-CY25.pdf"
          },
          {
            "evidence": "Class D facilities are 'limited to pumpage, storage, or distribution'; certification requires the examination corresponding to the local certification level.",
            "title": "Illinois EPA  -  Drinking Water Operator Certification Frequently Asked Questions",
            "url": "https://epa.illinois.gov/topics/drinking-water/operator-certification/faqs.html"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Illinois Environmental Protection Agency  -  Wastewater Operator Certification Program",
        "authorityUrl": "https://epa.illinois.gov/topics/water-quality/wastewater-operator-certification.html",
        "examSystem": "unverified",
        "localLevels": "Municipal/domestic: Class 4 (lowest), Class 3, Class 2, Class 1 (highest). Industrial: Class K  -  Facility-Specific; Class R  -  General (Water Remediation).",
        "note": "Treatment certification is mandatory. State-specific industrial examinations are documented, especially facility-specific Class K. Municipal Class 1–4 examinations have local outlines and professionally developed questions, but the opened sources do not explicitly identify their origin as WPI-standardized, customized ABC, or wholly Illinois-authored. Overall exam-system status therefore remains unverified rather than assuming uniform WPI adoption. Illinois's ascending proficiency order is 4→3→2→1; matching numerals do not establish WPI correspondence.",
        "sources": [
          {
            "evidence": "Pages 3 and 13–18 identify mandatory treatment certification, Classes 4–1, facility-specific Class K and general Class R. Municipal examination emphasis progresses from lagoons (Class 4), to fixed film (Class 3), activated sludge (Class 2), and advanced activated sludge/complex mathematics (Class 1). Questions were developed by wastewater professionals, instructors and certified operators; no WPI/ABC exam designation is given. Class K includes mathematics and facility-specific short-answer/essay questions, including permit conditions.",
            "title": "Illinois EPA  -  Wastewater Operator Certification Guide, Updated 2024",
            "url": "https://epa.illinois.gov/content/dam/soi/en/web/epa/topics/water-quality/wastewater-operator-certification/documents/wastewater-operator-certification-guide-11012024.pdf"
          },
          {
            "evidence": "Section 380.400 lists separate Class 1, 2, 3, 4, K and R examinations administered by the Agency or its designee and states examinations are Agency property. Sections 380.420–380.430 prescribe municipal, facility-specific industrial and petroleum-contamination water-remediation examination subject matter.",
            "title": "35 Illinois Administrative Code Part 380  -  Procedures for the Certification of Operators of Wastewater Treatment Works",
            "url": "https://www.ilga.gov/agencies/JCAR/EntirePart?titlepart=03500380"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Illinois Environmental Protection Agency  -  Voluntary Collection System Operator Certification Program",
        "authorityUrl": "https://epa.illinois.gov/topics/water-quality/wastewater-operator-certification.html",
        "examSystem": "unverified",
        "localLevels": "Collection System Operator  -  one unnumbered certification level.",
        "note": "A separate voluntary collection program exists; the current guide cautions that a certified collection operator may nevertheless be required by a permit. No Collection Classes 1–4 are documented. Official sources describe the collection examination independently, but do not explicitly resolve whether its questions are Illinois-authored or customized ABC; standardized WPI scope and a class correspondence remain unverified.",
        "sources": [
          {
            "evidence": "Page 3: collection certification is voluntary, but a certified operator may be required by a permit. Page 14: 'There is one level of collection system operator certification.' Pages 15–17 separately describe collection examinations and their subjects, including collection systems, pumps, mathematics, recordkeeping, rules/regulations and safety.",
            "title": "Illinois EPA  -  Wastewater Operator Certification Guide, Updated 2024",
            "url": "https://epa.illinois.gov/content/dam/soi/en/web/epa/topics/water-quality/wastewater-operator-certification/documents/wastewater-operator-certification-guide-11012024.pdf"
          },
          {
            "evidence": "Section 380.400 separately lists the Collection System examination. Section 380.435 specifies collection operation/maintenance, monitoring, lift stations and pumps, mathematics, recordkeeping and safety.",
            "title": "35 Illinois Administrative Code Part 380  -  Procedures for the Certification of Operators of Wastewater Treatment Works",
            "url": "https://www.ilga.gov/agencies/JCAR/EntirePart?titlepart=03500380"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "IN",
    "dedicatedCourseNeeds": [
      "Indiana-specific water-treatment exam preparation for WT1, WT2, WT3, WT4 and WT5, aligned to IDEM's class-specific study guides, Indiana groundwater/surface-water manuals, formula/conversion tables and 327 IAC 8-12. Do not substitute a numeric WPI-class mapping.",
      "Indiana-specific distribution preparation for DSS, DSM and DSL using the Indiana Drinking Water Operator Training Distribution Manual and local classification/regulatory requirements.",
      "Separate wastewater-treatment local-class outline alignment for I-SP, I/A, II, III/IV, A-SO and B/C/D using IDEM's official study-guide groupings, supplied formula sheet and 327 IAC 5-23; confirm exam provenance before labeling this a distinct state-authored or customized ABC course family.",
      "For collection, retain the voluntary IWEA program distinction; confirm the local-to-WPI class crosswalk and administered Need-to-Know edition before enabling shared Classes 1–4. No unique Indiana collection exam was established."
    ],
    "limits": [
      "Assessment targets October 3, 2026; live sources were retrieved October 4, 2026. No archived October 3 snapshot was verified.",
      "Eight source opens were used. Evidence comes from opened authority/program documents, not search snippets, membership listings, reciprocity or test-center delivery.",
      "The drinking-water technical guidance is dated May 2014 and remains linked by the current IDEM page; its WT6 classification does not establish a currently offered sixth treatment exam.",
      "The collection program brochure is revised January 2001 and remains linked by the 2026 portal. Use it cautiously for voluntary status/class structure, not current fees, delivery or eligibility details.",
      "Wastewater-treatment exam provenance, collection's explicit grade-to-WPI-class correspondence and IWEA's current standardized exam edition remain unverified."
    ],
    "name": "Indiana",
    "streams": [
      {
        "authorityName": "Indiana Department of Environmental Management (IDEM), Office of Water Quality, Drinking Water Operator Certification Program",
        "authorityUrl": "https://www.in.gov/idem/cleanwater/drinking-water/drinking-water-operator-certification/",
        "examSystem": "state-specific",
        "localLevels": "Water treatment 1 (Class WT1), Water treatment 2 (Class WT2), Water treatment 3 (Class WT3), Water treatment 4 (Class WT4), Water treatment 5 (Class WT5). Linked rule guidance additionally lists Water treatment 6 (Class WT6), an emerging-technology classification; a separate current WT6 exam is not verified.",
        "note": "IDEM explicitly developed its own peer-reviewed exams, completed in April 2016, and continues maintaining them. Its current page identifies five treatment exams. WT numbers are not WPI class equivalencies.",
        "sources": [
          {
            "evidence": "‘IDEM completed the development of our own peer-reviewed operator certification exams in April 2016’; ‘five water treatment exams with corresponding certifications.’ Lists WT1, WT2, WT3 and WT4 & WT5 study guides.",
            "title": "Drinking Water Operator Certification",
            "url": "https://www.in.gov/idem/cleanwater/drinking-water/drinking-water-operator-certification/"
          },
          {
            "evidence": "Names Classes WT1–WT6. WT4 and WT5 concern surface water/GWUDI; WT6 concerns newly emerging treatment technology determined by the commissioner.",
            "title": "Drinking Water Operator Certification Rule  -  Technical Guidance",
            "url": "https://www.in.gov/idem/cleanwater/files/dw_certification_rule_guidance.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Indiana Department of Environmental Management (IDEM), Office of Water Quality, Drinking Water Operator Certification Program",
        "authorityUrl": "https://www.in.gov/idem/cleanwater/drinking-water/drinking-water-operator-certification/",
        "examSystem": "state-specific",
        "localLevels": "Distribution system small (Class DSS); Distribution system medium (Class DSM); Distribution system large (Class DSL).",
        "note": "The official exam-development statement expressly covers three distribution exams, separately from treatment. DSS/DSM/DSL must not be converted into WPI Classes 1–3.",
        "sources": [
          {
            "evidence": "Describes IDEM's ‘own peer-reviewed operator certification exams’ and states: ‘There are three distribution type exams with corresponding certifications.’ Links the Indiana Drinking Water Operator Training Distribution Manual.",
            "title": "Drinking Water Operator Certification",
            "url": "https://www.in.gov/idem/cleanwater/drinking-water/drinking-water-operator-certification/"
          },
          {
            "evidence": "Explicitly names Distribution system small (Class DSS), medium (Class DSM), and large (Class DSL), with population and system-complexity criteria.",
            "title": "Drinking Water Operator Certification Rule  -  Technical Guidance",
            "url": "https://www.in.gov/idem/cleanwater/files/dw_certification_rule_guidance.pdf"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Indiana Department of Environmental Management (IDEM), Office of Water Quality, Wastewater Operator Certification Program",
        "authorityUrl": "https://www.in.gov/idem/cleanwater/wastewater-compliance/wastewater-operator-certification-and-continuing-education/",
        "examSystem": "unverified",
        "localLevels": "I-SP, Class I, Class II, Class III, Class IV; A-SO, Class A, Class B, Class C, Class D. Wastewater Apprentice is an additional designation using the same certification examination, not a separate exam grade.",
        "note": "IDEM documents ten local exams and an IDEM-maintained question bank. This establishes a local examination system but does not explicitly identify question provenance or distinguish independently authored state exams from customized ABC forms. No WPI-standardized scope or WPI-class crosswalk was verified; Ivy Tech delivery is not proof.",
        "sources": [
          {
            "evidence": "Applicants choose ‘which of the ten exams’ to take. ‘IDEM maintains a question bank’ from which questions are drawn for A-SO, I-SP and the other eight exams. Wastewater Apprentice applicants take ‘the same certification examination.’ References 327 IAC 5-23.",
            "title": "Wastewater Certification Information",
            "url": "https://www.in.gov/idem/cleanwater/wastewater-compliance/wastewater-operator-certification-and-continuing-education/wastewater-certification-information"
          },
          {
            "evidence": "Lists official study-guide groupings: Classes I & A; Class II; Classes III & IV; Classes B, C, & D; I-SP; A-SO. States the IDEM formula sheet is provided during the exam.",
            "title": "Study Guides for the Wastewater Operator Certification Examinations",
            "url": "https://www.in.gov/idem/cleanwater/wastewater-compliance/wastewater-operator-certification-and-continuing-education/wastewater-certification-information/study-guides-for-the-wastewater-operator-certification-examinations"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Indiana Water Environment Association (IWEA), Wastewater Collection Systems Committee  -  voluntary certification program",
        "authorityUrl": "https://indianawea.org/collections-exams-portal-2/",
        "examSystem": "wpi-standardized",
        "localLevels": "Class I; Class II; Class III; Class IV. The linked program document also describes In-Training certification for eligible higher-class applicants.",
        "note": "The current IWEA portal explicitly verifies standardized ABC Testing/WPI collection exams, unlike the other streams. The linked program document identifies this as voluntary IWEA certification, not IDEM treatment certification. Local Classes I–IV are established, but the opened sources do not explicitly match each local grade to a named WPI exam class; shared-level routing remains unverified.",
        "sources": [
          {
            "evidence": "‘The Collection System exam is standardized test provided by ABC Testing, a WPI service.’ Lists Class I/II and Class III/IV application categories and 2026 exam dates, and directly links WPI standardized collection exam materials.",
            "title": "Collection Systems Exam Portal",
            "url": "https://indianawea.org/collections-exams-portal-2/"
          },
          {
            "evidence": "Calls the program ‘voluntary’; says ‘ABC provides the standardized testing materials’ and IWEA administers the program within Indiana. Names Classes I, II, III and IV and requires the appropriate certification examination.",
            "title": "Indiana Wastewater Collection System Operator Certification Program  -  Program Information",
            "url": "https://indianawea.org/wp-content/uploads/2021/11/Certification-Program-Info.pdf"
          },
          {
            "evidence": "States Need-to-Know Criteria outline WPI standardized examination content provided through ABC Testing. Links both 2025 and 2019 collection criteria, without stating which edition IWEA currently administers.",
            "title": "Standardized Wastewater Collection Operator Exams",
            "url": "https://www.gowpi.org/services/abc-testing/standardized-exams/standardized-wastewater-collection-operator-exams/"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "IA",
    "dedicatedCourseNeeds": [
      "Separate Iowa Grade A small-system pathway materials: Chapter 81.5(3), applicable hypochlorination/minimal-treatment scope, and the department-approved initial training requirement. Obtain the actual Grade A exam outline before developing unique-exam preparation.",
      "Separate wastewater Grade IL lagoon and Grade W onsite pathway materials using current Chapter 81.3 and 81.6. Obtain current DNR outlines and clarify the older form's lagoon 1–2 labels before creating grade-specific exam courses.",
      "Iowa Chapter 81 regulatory orientation is locally relevant, including facility classification, operator-in-charge/shift certification and eligibility. Its inclusion on particular exams is unverified.",
      "For IAWEA collection Grades 1–4, validate the current adopted exam blueprint and grade correspondence with the voluntary program; the linked 2010-analysis ABC guide alone does not justify routing to current standardized WPI courses."
    ],
    "limits": [
      "Target date: October 3, 2026. Live sources were retrieved October 4, 2026, not from an archived October 3 snapshot. The opened current Chapter 81 carries a June 18, 2025 effective revision; intervening changes were not independently excluded.",
      "Eight source opens, including an unsuccessful legacy ABC preparation-page fetch. No opened official source explicitly proved standardized versus customized exam adoption and Iowa-grade-to-WPI-class mapping; all shared-level arrays therefore remain empty.",
      "The older DNR eligibility handout and April 2024 exam application are not complete statements of current special grades; current local classifications were taken from Chapter 81.",
      "ABC/WPI resource links, exam delivery arrangements and similar grade numbering were not treated as standardized-exam proof. IAWEA's state designation and current exam edition were not established; it is identified only as the administrator of its published voluntary credential."
    ],
    "name": "Iowa",
    "streams": [
      {
        "authorityName": "Iowa Department of Natural Resources, Water Supply Operations Section",
        "authorityUrl": "https://www.iowadnr.gov/environmental-protection/water-quality/certification-licensing-programs/drinking-water-wastewater-operator-certification",
        "examSystem": "unverified",
        "localLevels": "Grade I, Grade II, Grade III, Grade IV (application uses 1–4). Grade A PWS is cross-referenced to the small-system distribution classification, not established as a separate treatment exam.",
        "note": "Mandatory DNR certification. DNR links ABC preparation and WPI need-to-know resources, but the opened sources do not explicitly identify Iowa's exams as standardized rather than customized or establish local-grade-to-WPI-class correspondence.",
        "sources": [
          {
            "evidence": "WSO is responsible for certifying public water supply treatment and distribution operators; Exam Preparation links Water Treatment, Water Distribution, Wastewater to ABC.",
            "title": "Drinking Water & Wastewater Operator Certification",
            "url": "https://www.iowadnr.gov/environmental-protection/water-quality/certification-licensing-programs/drinking-water-wastewater-operator-certification"
          },
          {
            "evidence": "81.4 lists water treatment Grades I–IV; its Grade A PWS footnote refers to 81.5(3). Revision effective June 18, 2025.",
            "title": "Iowa Administrative Code 567, Chapter 81",
            "url": "https://www.legis.iowa.gov/DOCS/ACO/IAC/LINC/Chapter.567.81.pdf"
          },
          {
            "evidence": "Resources includes a link labeled 'WPI Exam Need -to-Know Documents'; it does not state standardized-exam adoption or grade correspondence.",
            "title": "Iowa DNR Operator Certification",
            "url": "https://programs.iowadnr.gov/opcertweb/"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Iowa Department of Natural Resources, Water Supply Operations Section",
        "authorityUrl": "https://www.iowadnr.gov/environmental-protection/water-quality/certification-licensing-programs/drinking-water-wastewater-operator-certification",
        "examSystem": "unverified",
        "localLevels": "Grade A; Grade I, Grade II, Grade III, Grade IV (ordinary exam application uses 1–4).",
        "note": "Mandatory DNR certification. Grade A is a distinct small-system pathway requiring department-approved training. ABC/WPI preparation links do not establish standardized exams, the Grade A exam source, or Grades I–IV equivalence to WPI classes.",
        "sources": [
          {
            "evidence": "81.5 lists distribution Grades I–IV and separately defines Grade A for qualifying small systems with no treatment beyond hypochlorination or specified nonadjustable treatment; 81.6 requires an approved course for Grade A.",
            "title": "Iowa Administrative Code 567, Chapter 81",
            "url": "https://www.legis.iowa.gov/DOCS/ACO/IAC/LINC/Chapter.567.81.pdf"
          },
          {
            "evidence": "Explicitly names distribution within WSO certification responsibilities and ABC exam-preparation resources, without identifying standardized versus customized examinations.",
            "title": "Drinking Water & Wastewater Operator Certification",
            "url": "https://www.iowadnr.gov/environmental-protection/water-quality/certification-licensing-programs/drinking-water-wastewater-operator-certification"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Iowa Department of Natural Resources, Water Supply Operations Section",
        "authorityUrl": "https://www.iowadnr.gov/environmental-protection/water-quality/certification-licensing-programs/drinking-water-wastewater-operator-certification",
        "examSystem": "unverified",
        "localLevels": "Grade W (onsite treatment); Grade IL (lagoon); Grade I, Grade II, Grade III, Grade IV.",
        "note": "Mandatory DNR certification, including lagoon and onsite pathways. Standardized/customized/state-specific status remains unverified for every grade. The older application lists 'Wastewater Lagoon 1 2'; do not turn those older labels into current WPI mappings or assume a separate current Grade IIL.",
        "sources": [
          {
            "evidence": "WSO certifies 'Wastewater and lagoon operators'; wastewater is separately included in the ABC exam-preparation link.",
            "title": "Drinking Water & Wastewater Operator Certification",
            "url": "https://www.iowadnr.gov/environmental-protection/water-quality/certification-licensing-programs/drinking-water-wastewater-operator-certification"
          },
          {
            "evidence": "81.3 assigns W to onsite treatment, IL to stabilization lagoons, IL/I to aerated lagoons, II to advanced aerated lagoons, and II–IV to specified mechanical processes; 81.3(3) says I–IV certificates satisfy IL requirements.",
            "title": "Iowa Administrative Code 567, Chapter 81",
            "url": "https://www.legis.iowa.gov/DOCS/ACO/IAC/LINC/Chapter.567.81.pdf"
          },
          {
            "evidence": "04/2024 form lists Wastewater Treatment 1–4 and Wastewater Lagoon 1–2, but contains no standardized-exam assertion; it predates the June 2025 rule revision.",
            "title": "Iowa Operator Certification Exam Application, DNR Form 542-3118",
            "url": "https://www.iowadnr.gov/media/5665/download?inline"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Iowa Water Environment Association (IAWEA), Collection System Operator Certification Program  -  voluntary",
        "authorityUrl": "https://www.iawea.org/collection-systems-2/",
        "examSystem": "unverified",
        "localLevels": "Grade 1, Grade 2, Grade 3, Grade 4.",
        "note": "A voluntary IAWEA credential, not the DNR treatment certification. IAWEA offers paper exams and links an ABC collection guide. Neither source explicitly establishes current standardized WPI/ABC adoption rather than customization, or maps IAWEA grades to WPI classes. Do not label collection not-offered merely because it is outside DNR Chapter 81.",
        "sources": [
          {
            "evidence": "Heading: 'Voluntary Collection System Operator Certification Program'; certification has four levels from Grade 1 to Grade 4; paper exams are offered at spring and fall conferences.",
            "title": "IAWEA Collection Systems",
            "url": "https://www.iawea.org/collection-systems-2/"
          },
          {
            "evidence": "Guide derives from ABC's 2010 national job analysis and describes ABC Classes I–IV. It does not explicitly identify IAWEA's adopted exam type or its local grade correspondence.",
            "title": "ABC Need-to-Know Criteria for Wastewater Collection Operators, linked by IAWEA",
            "url": "https://www.iawea.org/wp-content/uploads/2012/08/ABC20WastewaterCollectionNeed-to-Know.pdf"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "KS",
    "dedicatedCourseNeeds": [
      "Maintain Kansas-specific KDHE water-supply routing for Small System and Classes I–IV, rather than automatically substituting WPI Classes 1–4. KDHE lists separate Small System, Class I, Class II and combined Class III/IV Need to Know documents and a Kansas Small System water manual.",
      "For advanced Kansas water preparation, align with KDHE's Class III/IV outline, including Kansas One Call, distribution/pumping, treatment, and applicable state/local monitoring, reporting and regulatory requirements.",
      "Maintain separate Kansas wastewater-treatment routing for Small System and Classes I–IV. Use KDHE's local wastewater outlines and Small System manual; supported local content includes state permitting, nonoverflowing ponds, class-dependent treatment/sludge topics and advanced nutrient-removal operations."
    ],
    "limits": [
      "Eight source pages/documents were opened; findings use their full text, not search snippets. No files or courses were created.",
      "Requested cutoff is October 3, 2026. Live sources were retrieved October 4, 2026, without archived cutoff snapshots; the latest explicit exam-maintenance account opened is the February 2025 state audit. A subsequent exam-provider change was not verified.",
      "The detailed water and wastewater Need to Know PDFs opened are dated April 22, 2009 and remain linked on KDHE's live program page. The page also lists a separate Class II wastewater document, which was not opened within the source cap; reconcile that document before final outline production.",
      "KWEA's program-wide table supports local Classes I–IV but does not explicitly establish standardized WPI exam scope or class mapping for distribution or collection. All verifiedSharedLevels therefore remain empty. Obtain current discipline/class-specific exam product and outline confirmation before shared-course routing or a unique-exam course specification for either voluntary stream."
    ],
    "name": "Kansas",
    "streams": [
      {
        "authorityName": "Kansas Department of Health and Environment (KDHE), Bureau of Water",
        "authorityUrl": "https://www.kdhe.ks.gov/638/Water-Wastewater-Operator-Certification",
        "examSystem": "state-specific",
        "localLevels": "Water-supply operator: Small System; Class I; Class II; Class III; Class IV.",
        "note": "Mandatory KDHE water-supply certification covers treatment and distribution, rather than separate mandatory treatment/distribution credentials. State-specific routing is supported by the state audit's account of KDHE question maintenance and WPI contracting as a prospective option. No standardized WPI/ABC adoption or class equivalence was verified.",
        "sources": [
          {
            "evidence": "KDHE administers the mandatory program with five water certification levels; the classification table names Small System and I–IV. A water supply system includes facilities used to obtain, treat, or distribute water.",
            "title": "Operator Certification Requirements for water and wastewater treatment facilities",
            "url": "https://www.kdhe.ks.gov/DocumentCenter/View/5202/Operator-Certification-Requirements-Brochure-PDF"
          },
          {
            "evidence": "KDHE reviewed water-supply examination questions and made language updates in 2021. Officials said removing the fee cap would have allowed consideration of contracting with WPI to maintain and administer some or all examinations.",
            "title": "Evaluating the State’s Water Systems and Wastewater Treatment Operator Certification Program (February 2025)",
            "url": "https://www.kslpa.gov/audit-report-library/water-certification-2/"
          },
          {
            "evidence": "KDHE's local outline includes treatment, distribution and pumping, Kansas One Call, and federal, state and local water-system regulations, monitoring, reporting and recordkeeping.",
            "title": "Kansas Class III & IV Water Operator Need to Know",
            "url": "https://www.kdhe.ks.gov/DocumentCenter/View/5195/Kansas-Class-III-and-IV-Water-Operator-PDF"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Kansas Water Environment Association (KWEA), voluntary Distribution Systems certification; KDHE for mandatory water-supply operational supervision",
        "authorityUrl": "https://www.kwea.net/training/water-wastewater-certification.html",
        "examSystem": "unverified",
        "localLevels": "KWEA Distribution Systems: Class I; Class II; Class III; Class IV (voluntary). KDHE distribution-only water-supply systems: Small System water certification.",
        "note": "The separate distribution credential is voluntary and issued by KWEA. Its ABC collaboration and reciprocity statements do not identify standardized versus customized examinations, so its exam system and WPI class correspondence remain unverified. Separately, distribution-only water-supply systems require KDHE water-supply supervision; that state-specific route must not be confused with KWEA's voluntary credential.",
        "sources": [
          {
            "evidence": "KWEA administers a voluntary program in collaboration with ABC, explicitly including Distribution Systems; after a written examination, KWEA issues the certificate. The page does not identify the examination as standardized or customized.",
            "title": "KWEA Voluntary Certification Program for Water & Wastewater Operators",
            "url": "https://www.kwea.net/training/water-wastewater-certification.html"
          },
          {
            "evidence": "The program's examination eligibility table lists Classes I, II, III and IV; applications and examination fees go to KWEA.",
            "title": "KWEA / ABC Certification Requirements",
            "url": "https://www.kwea.net/training/certification-requirements.html"
          },
          {
            "evidence": "There is no mandatory certification program for distribution-system personnel, but the water-supply definition includes distribution pipes and the Small System classification explicitly includes Distribution System Only.",
            "title": "Operator Certification Requirements for water and wastewater treatment facilities",
            "url": "https://www.kdhe.ks.gov/DocumentCenter/View/5202/Operator-Certification-Requirements-Brochure-PDF"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Kansas Department of Health and Environment (KDHE), Bureau of Water",
        "authorityUrl": "https://www.kdhe.ks.gov/638/Water-Wastewater-Operator-Certification",
        "examSystem": "state-specific",
        "localLevels": "Wastewater operator: Small System; Class I; Class II; Class III; Class IV.",
        "note": "Mandatory KDHE wastewater-treatment certification has its own local examinations. The state audit describes KDHE's review and revision of wastewater questions, not use of standardized WPI examinations. No standardized WPI/ABC scope or local-to-WPI class correspondence was verified.",
        "sources": [
          {
            "evidence": "KDHE administers five wastewater certification levels. The table names Small System and I–IV; Small System applies to nonoverflowing wastewater ponds, with higher classifications covering secondary and advanced/specialized treatment.",
            "title": "Operator Certification Requirements for water and wastewater treatment facilities",
            "url": "https://www.kdhe.ks.gov/DocumentCenter/View/5202/Operator-Certification-Requirements-Brochure-PDF"
          },
          {
            "evidence": "KDHE reviewed Small System and Class 1 wastewater questions in 2020–2021 and removed some questions. At the audit date, KDHE was reviewing wastewater Classes 2–4 questions. Each local class has its own certification examination.",
            "title": "Evaluating the State’s Water Systems and Wastewater Treatment Operator Certification Program (February 2025)",
            "url": "https://www.kslpa.gov/audit-report-library/water-certification-2/"
          },
          {
            "evidence": "The outline has separate Class I–IV sections, including Clean Water Act and state permitting requirements, ponds, biological treatment and sludge handling; advanced classes add nutrient removal and process troubleshooting.",
            "title": "Kansas Class I–IV Wastewater Operator Need to Know",
            "url": "https://www.kdhe.ks.gov/DocumentCenter/View/5192/Kansas-Class-I---IV-Wastewater-Operator-PDF"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Kansas Water Environment Association (KWEA), voluntary Collection Systems certification",
        "authorityUrl": "https://www.kwea.net/training/water-wastewater-certification.html",
        "examSystem": "unverified",
        "localLevels": "Collection Systems: Class I; Class II; Class III; Class IV (voluntary).",
        "note": "KWEA offers a separate voluntary collection credential. Its ABC collaboration, membership and reciprocity do not establish standardized rather than customized exams or WPI class correspondence. This is an offered but unverified exam route, not a not-offered stream; KDHE wastewater-treatment certification is a different credential.",
        "sources": [
          {
            "evidence": "KWEA explicitly includes Collection Systems among its voluntary disciplines and issues certificates after written examinations; it does not specify standardized or customized exam products.",
            "title": "KWEA Voluntary Certification Program for Water & Wastewater Operators",
            "url": "https://www.kwea.net/training/water-wastewater-certification.html"
          },
          {
            "evidence": "The examination eligibility table names Classes I, II, III and IV.",
            "title": "KWEA / ABC Certification Requirements",
            "url": "https://www.kwea.net/training/certification-requirements.html"
          },
          {
            "evidence": "The brochure explicitly states there is no mandatory certification program for collection-system personnel.",
            "title": "Operator Certification Requirements for water and wastewater treatment facilities",
            "url": "https://www.kdhe.ks.gov/DocumentCenter/View/5202/Operator-Certification-Requirements-Brochure-PDF"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "KY",
    "dedicatedCourseNeeds": [
      "Water treatment: assess a Kentucky-specific outline using the separately listed Surface Water and Groundwater manuals, local IA-D through IVB classifications, and Kentucky certification regulations; do not collapse these classifications into four shared WPI levels.",
      "Water distribution: assess a Kentucky outline using the Distribution System manual and math/formula resources, retaining local ID, IID, IIID and IVD labels.",
      "Wastewater treatment: assess a Kentucky outline using the listed April 2024 treatment manual and treatment math/formula resources, with Class I–IV and Limited pathways distinguished.",
      "Wastewater collection: assess a separate Kentucky outline using the collection manual and math/conversion resources, retaining Class I–IV Collection and the separate school-system Limited scope.",
      "These are supported local preparation needs, not confirmed unique-exam classifications. Confirm exam developer, standardized versus customized status, current blueprint and grade mapping with the authority before final course routing."
    ],
    "limits": [
      "Target date: October 3, 2026. Live official pages were opened October 4, 2026; an archived October 3 snapshot was not established.",
      "Eight source opens completed, all on Kentucky government domains. Search snippets and commercial exam-preparation claims were not used as proof.",
      "Opened 401 KAR 11:050 (https://apps.legislature.ky.gov/Law/KAR/401/011/050.pdf) establishes an examination administered by the cabinet, but does not identify its content supplier or standardized/customized status. State administration alone does not prove a state-specific exam.",
      "The official preparation page was opened, but the linked full manuals and their detailed outlines were not opened within the source cap. Listed revision dates are the page's labels, not independently verified manual currency.",
      "All four exam systems are unverified, not unsupported or not offered. No standardized WPI/ABC scope or local-grade correspondence was established; verifiedSharedLevels therefore remains empty for every stream.",
      "Kentucky's program notes that LRC online regulation text is not the official Kentucky Administrative Regulations Service version."
    ],
    "name": "Kentucky",
    "streams": [
      {
        "authorityName": "Kentucky Energy and Environment Cabinet  -  Certification and Licensing Branch, Operator Certification Program",
        "authorityUrl": "https://eec.ky.gov/Environmental-Protection/Compliance-Assistance/operator-certification-program/Pages/how-do-i-become-a-certified-operator.aspx",
        "examSystem": "unverified",
        "localLevels": "Limited certification; Class IA-D treatment certification; Class IB-D treatment certification; Class IIA treatment certification; Class IIB-D treatment certification; Class IIIA treatment certification; Class IIIB treatment certification; Class IVA treatment certification; Class IVB treatment certification. Operator in Training designations also exist. Bottled water certification is listed separately in the regulation.",
        "note": "Kentucky publishes separate Surface Water and Groundwater exam-preparation materials. Opened sources do not establish standardized WPI/ABC, customized ABC, or state-authored examination scope. Local Roman numerals and A/B/D suffixes are not a verified WPI class correspondence.",
        "sources": [
          {
            "evidence": "Only operators certified by the Kentucky Certification and Licensing Branch can be in responsible charge of a drinking water or wastewater system.",
            "title": "Drinking Water and Wastewater Training and Exam Information",
            "url": "https://eec.ky.gov/Environmental-Protection/Compliance-Assistance/operator-certification-program/Pages/how-do-i-become-a-certified-operator.aspx"
          },
          {
            "evidence": "Section 1(1) expressly lists Limited, IA-D, IB-D, IIA, IIB-D, IIIA, IIIB, IVA and IVB treatment certifications; Section 1(3) separately lists bottled water certification.",
            "title": "401 KAR 11:040  -  Water treatment and distribution system operators; classification and qualifications",
            "url": "https://apps.legislature.ky.gov/Law/KAR/401/011/040.pdf"
          },
          {
            "evidence": "Lists Groundwater Treatment Operator Certification Manual, revised 12/03/2014, and Surface Water Treatment Operator Certification Manual, revised 4/04/2018, with separate math guides and formula sheets.",
            "title": "Test Preparation Materials",
            "url": "https://eec.ky.gov/Environmental-Protection/Compliance-Assistance/operator-certification-program/Pages/test-preparation-materials.aspx"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Kentucky Energy and Environment Cabinet  -  Certification and Licensing Branch, Operator Certification Program",
        "authorityUrl": "https://eec.ky.gov/Environmental-Protection/Compliance-Assistance/operator-certification-program/Pages/how-do-i-become-a-certified-operator.aspx",
        "examSystem": "unverified",
        "localLevels": "Class ID distribution certification; Class IID distribution certification; Class IIID distribution certification; Class IVD distribution certification. Operator in Training designations also exist.",
        "note": "Distribution certification and Kentucky preparation materials are explicitly documented. Neither exam-content supplier nor standardized/customized status is established; ID–IVD cannot be mapped to WPI Classes 1–4 merely by their numbering.",
        "sources": [
          {
            "evidence": "Identifies the Kentucky Certification and Licensing Branch as the certifying program and directs applicants to 401 KAR Chapter 11.",
            "title": "Drinking Water and Wastewater Training and Exam Information",
            "url": "https://eec.ky.gov/Environmental-Protection/Compliance-Assistance/operator-certification-program/Pages/how-do-i-become-a-certified-operator.aspx"
          },
          {
            "evidence": "Section 1(2) lists Class ID, IID, IIID and IVD distribution certifications; Section 1(4) provides Operator in Training designations.",
            "title": "401 KAR 11:040  -  Water treatment and distribution system operators; classification and qualifications",
            "url": "https://apps.legislature.ky.gov/Law/KAR/401/011/040.pdf"
          },
          {
            "evidence": "Distribution section lists Distribution System Operator Certification Manual, revised 2/12/2013, and distribution-specific math guide, formula sheet and online class instructions.",
            "title": "Test Preparation Materials",
            "url": "https://eec.ky.gov/Environmental-Protection/Compliance-Assistance/operator-certification-program/Pages/test-preparation-materials.aspx"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Kentucky Energy and Environment Cabinet  -  Certification and Licensing Branch, Operator Certification Program",
        "authorityUrl": "https://eec.ky.gov/Environmental-Protection/Compliance-Assistance/operator-certification-program/Pages/how-do-i-become-a-certified-operator.aspx",
        "examSystem": "unverified",
        "localLevels": "Limited certification; Class I Treatment certification; Class II Treatment certification; Class III Treatment certification; Class IV Treatment certification. Operator in Training designations also exist.",
        "note": "Wastewater-specific regulation independently establishes this stream; Limited certification concerns a school treatment plant and collection system. Cabinet administration and a Kentucky manual do not establish exam authorship or WPI standardized scope. No verified shared levels.",
        "sources": [
          {
            "evidence": "Only operators certified by the Kentucky Certification and Licensing Branch can be in responsible charge of a wastewater or drinking water system.",
            "title": "Drinking Water and Wastewater Training and Exam Information",
            "url": "https://eec.ky.gov/Environmental-Protection/Compliance-Assistance/operator-certification-program/Pages/how-do-i-become-a-certified-operator.aspx"
          },
          {
            "evidence": "Section 1(1) lists Limited and Class I–IV Treatment certifications; Limited permits primary responsibility for a school wastewater treatment plant and collection system.",
            "title": "401 KAR 11:030  -  Wastewater treatment and collection system operators; classification and qualifications",
            "url": "https://apps.legislature.ky.gov/Law/KAR/401/011/030.pdf"
          },
          {
            "evidence": "Wastewater Treatment section lists Wastewater Treatment Plant Operator Certification Manual, revised 4/2024, plus treatment-specific math guide and formula sheet.",
            "title": "Test Preparation Materials",
            "url": "https://eec.ky.gov/Environmental-Protection/Compliance-Assistance/operator-certification-program/Pages/test-preparation-materials.aspx"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Kentucky Energy and Environment Cabinet  -  Certification and Licensing Branch, Operator Certification Program",
        "authorityUrl": "https://eec.ky.gov/Environmental-Protection/Compliance-Assistance/operator-certification-program/Pages/how-do-i-become-a-certified-operator.aspx",
        "examSystem": "unverified",
        "localLevels": "Class I Collection certification; Class II Collection certification; Class III Collection certification; Class IV Collection certification. Operator in Training designations also exist. Limited certification separately covers a school wastewater treatment plant and collection system.",
        "note": "Collection is expressly offered in the wastewater regulation, not inferred from drinking-water evidence. The regulation states sewage-system operators generally must hold cabinet certification, with a single-residence exception. Standardized WPI/ABC use and any local-to-WPI class mapping remain unverified.",
        "sources": [
          {
            "evidence": "Identifies the Kentucky Certification and Licensing Branch as the certifying program for wastewater operators.",
            "title": "Drinking Water and Wastewater Training and Exam Information",
            "url": "https://eec.ky.gov/Environmental-Protection/Compliance-Assistance/operator-certification-program/Pages/how-do-i-become-a-certified-operator.aspx"
          },
          {
            "evidence": "Section 1(2) expressly lists Class I, II, III and IV Collection certifications; Section 1(3) provides Operator in Training designations.",
            "title": "401 KAR 11:030  -  Wastewater treatment and collection system operators; classification and qualifications",
            "url": "https://apps.legislature.ky.gov/Law/KAR/401/011/030.pdf"
          },
          {
            "evidence": "Wastewater Collection section lists Wastewater Collection System Operator Certification Manual, revised 4/20/2015, with collection-specific math and formula/conversion resources.",
            "title": "Test Preparation Materials",
            "url": "https://eec.ky.gov/Environmental-Protection/Compliance-Assistance/operator-certification-program/Pages/test-preparation-materials.aspx"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "LA",
    "dedicatedCourseNeeds": [
      "Louisiana-specific Certification Law and Rules preparation across all four streams is supported by the required separate regulatory examination; cover local certification categories, classes, operator responsibilities, certificate statuses and renewal rules.",
      "Water Treatment: review or align separate Louisiana Class 1–4 preparation to the LDH outline, including fluoridation/pH, treatment-process progression, class-specific math and applicable state/federal regulations. A unique technical question bank is not verified.",
      "Water Distribution: review or align Louisiana Class 1–4 preparation to the LDH outline, including cross-connection control, sampling/disinfection, utility legal responsibilities, emergency continuity and progressively advanced hydraulics/math.",
      "Wastewater Treatment: review or align Louisiana Class 1–4 preparation to the LDH outline, including federal/state permit requirements, violation reporting, process-control calculations, and advanced nutrient removal/reclamation.",
      "Wastewater Collection: review or align Louisiana Class 1–4 preparation to the LDH outline, including lift-station operations, underground safety, sewer testing/rehabilitation, infiltration/inflow, televised-line interpretation and retrofit specifications."
    ],
    "limits": [
      "Requested cutoff: October 3, 2026. Live public sources were retrieved October 4, 2026; no archived October 3 snapshot was verified.",
      "Eight source URLs were opened, within the exploration cap. Conclusions use opened official LDH materials and a State of Louisiana LDH recruitment posting, not search snippets.",
      "The certification-rule PDF currently linked by LDH is an April 2002 republication using the former Department of Health and Hospitals name. Current LDH category-specific outlines corroborate Classes 1–4, but a complete later-amendment history was not checked.",
      "State exam preparation/validation responsibility and Louisiana-specific outlines do not conclusively prove exclusive state authorship or rule out customized ABC questions. All technical exam systems are therefore unverified, not unsupported or not offered.",
      "No explicit standardized ABC/WPI adoption scope and local-grade-to-WPI-class correspondence were found in the opened materials. All verifiedSharedLevels arrays are empty; no automatic shared-WPI routing is justified.",
      "Technical outline alignment needs are supported; exclusive unique-exam course requirements remain conditional on exam-family confirmation. No coverage or pass guarantees are made. No operator/customer records were accessed."
    ],
    "name": "Louisiana",
    "streams": [
      {
        "authorityName": "Louisiana Department of Health, Office of Public Health, Bureau of Engineering Services, Operator Certification Program; Louisiana Committee of Certification",
        "authorityUrl": "https://ldh.la.gov/bureau-of-engineering-services/louisiana-operator-certification-program",
        "examSystem": "unverified",
        "localLevels": "Water Treatment Class 1, Class 2, Class 3, Class 4. Operator-in-Training and Provisional are certificate statuses, not additional numbered exam classes.",
        "note": "Mandatory for surface-water facilities and qualifying groundwater treatment; simple-disinfection-only groundwater has a treatment-certification exception. State-controlled preparation and local outlines are documented, but the sources do not explicitly establish whether the technical exams are state-authored, customized ABC/WPI, or standardized ABC/WPI. No standardized scope or local-to-WPI class correspondence verified. The separate Louisiana Law and Rules Examination is confirmed.",
        "sources": [
          {
            "evidence": "§7305.D specifies water-treatment certification and the groundwater exception; §7323.D requires exams in sequence from Class 1 to Class 4 in each category. §7331.K recognizes exams 'prepared under the auspices of the administrator and the committee of certification,' without identifying their question-bank provider.",
            "title": "LDH Operator Certification Rule",
            "url": "https://ldh.la.gov/assets/oph/Center-EH/operator/OperatorCertificationRule.pdf"
          },
          {
            "evidence": "Separate WATER TREATMENT CLASS 1, 2, 3 and 4 outlines. Class 1 includes fluoridation, pH adjustment and applicable state/federal regulations; Class 4 includes reverse osmosis, electrodialysis and expert regulatory knowledge. No standardized ABC/WPI designation.",
            "title": "Operator Need-to-Know: Water Treatment",
            "url": "https://ldh.la.gov/assets/oph/Center-EH/operator/Need2Know-WaterTreatment.pdf"
          },
          {
            "evidence": "The statewide water and wastewater program's duties include 'Conducting and directing the preparation, validation, administration, grading, and periodic updating of Operator Certification exams.' This establishes state responsibility, not an explicit standardized/customized/state-authored exam designation.",
            "title": "State of Louisiana: Operator Certification Training Officer, 2025",
            "url": "https://www.governmentjobs.com/careers/louisiana/jobs/newprint/4988609"
          },
          {
            "evidence": "'Must be completed and returned to the Operator Certification Office before Certificate(s) will be issued.' Questions address Louisiana facility classes, certification responsibilities, renewals and operator-in-training restrictions.",
            "title": "Certification Law and Rules Examination",
            "url": "https://ldh.la.gov/assets/oph/Center-EH/operator/ExamLawRule.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Louisiana Department of Health, Office of Public Health, Bureau of Engineering Services, Operator Certification Program; Louisiana Committee of Certification",
        "authorityUrl": "https://ldh.la.gov/bureau-of-engineering-services/louisiana-operator-certification-program",
        "examSystem": "unverified",
        "localLevels": "Water Distribution Class 1, Class 2, Class 3, Class 4. Operator-in-Training and Provisional are certificate statuses, not additional numbered exam classes.",
        "note": "Mandatory for water conveyance from the treatment plant or other supply point to consumers. Distribution-specific local outlines and state exam control are documented, but neither technical exam provenance nor standardized ABC/WPI class correspondence is explicit; standardized versus customized versus state-authored remains unverified. Louisiana's separate Law and Rules Examination also applies.",
        "sources": [
          {
            "evidence": "§7305.C requires water-distribution certification; §7323.D requires Class 1–4 exam sequence in each category. §7321.A assigns question validation to the committee or its appointees; §7331.K requires exams prepared under state program auspices. §7325.B requires the Certification Law and Rules Examination.",
            "title": "LDH Operator Certification Rule",
            "url": "https://ldh.la.gov/assets/oph/Center-EH/operator/OperatorCertificationRule.pdf"
          },
          {
            "evidence": "Separate WATER DISTRIBUTION CLASS 1, 2, 3 and 4 outlines. Topics progress from disinfection, sampling and cross-connections to emergency continuity, pump curves, water loss, utility legal responsibilities and complex friction-loss calculations; no standardized ABC/WPI designation.",
            "title": "Operator Need-to-Know: Water Distribution",
            "url": "https://ldh.la.gov/assets/oph/Center-EH/operator/Need2Know-WaterDistribution.pdf"
          },
          {
            "evidence": "Current LDH program page names the Louisiana Committee of Certification and links Water Distribution under 'Exam Need to Know,' plus the certification rule and Law and Rule Exam.",
            "title": "Louisiana Operator Certification Program",
            "url": "https://ldh.la.gov/bureau-of-engineering-services/louisiana-operator-certification-program"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Louisiana Department of Health, Office of Public Health, Bureau of Engineering Services, Operator Certification Program; Louisiana Committee of Certification",
        "authorityUrl": "https://ldh.la.gov/bureau-of-engineering-services/louisiana-operator-certification-program",
        "examSystem": "unverified",
        "localLevels": "Wastewater Treatment Class 1, Class 2, Class 3, Class 4. Operator-in-Training and Provisional are certificate statuses, not additional numbered exam classes.",
        "note": "Mandatory for facilities treating wastewater and reducing or handling removed sludge. Wastewater-treatment evidence was opened independently of drinking-water evidence. Local outlines and committee exam control do not explicitly identify standardized ABC/WPI, customized ABC/WPI or state-authored technical exams; no shared levels verified. Louisiana's separate Law and Rules Examination also applies.",
        "sources": [
          {
            "evidence": "§7305.E requires wastewater-treatment certification; §7323.D requires Class 1–4 exam sequence in each category. §7321.A requires committee/appointee validation of questions and §7331.K state program auspices. §7325.B requires the Certification Law and Rules Examination.",
            "title": "LDH Operator Certification Rule",
            "url": "https://ldh.la.gov/assets/oph/Center-EH/operator/OperatorCertificationRule.pdf"
          },
          {
            "evidence": "Separate WASTEWATER TREATMENT CLASS 1, 2, 3 and 4 outlines. Class 2 requires federal/state NPDES permit effluent requirements; Class 3 covers permit-violation reporting and process-control calculations; Class 4 includes advanced nitrogen/phosphorus removal and wastewater reclamation. No standardized ABC/WPI designation.",
            "title": "Operator Need-to-Know: Wastewater Treatment",
            "url": "https://ldh.la.gov/assets/oph/Center-EH/operator/Need2Know-WastewaterTreatment.pdf"
          },
          {
            "evidence": "The LDH page explicitly covers both water and wastewater operators and separately links Wastewater Treatment under 'Exam Need to Know.' It identifies the Louisiana Committee of Certification.",
            "title": "Louisiana Operator Certification Program",
            "url": "https://ldh.la.gov/bureau-of-engineering-services/louisiana-operator-certification-program"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Louisiana Department of Health, Office of Public Health, Bureau of Engineering Services, Operator Certification Program; Louisiana Committee of Certification",
        "authorityUrl": "https://ldh.la.gov/bureau-of-engineering-services/louisiana-operator-certification-program",
        "examSystem": "unverified",
        "localLevels": "Wastewater Collection Class 1, Class 2, Class 3, Class 4. Operator-in-Training and Provisional are certificate statuses, not additional numbered exam classes.",
        "note": "Mandatory for sewerage-system components other than the treatment plant, not presented as a voluntary association certificate. Collection-specific evidence was opened independently. The technical exam family remains unverified: local class numbering and committee preparation/validation are insufficient to prove standardized ABC/WPI or distinguish customized from state-authored exams. Louisiana's separate Law and Rules Examination also applies.",
        "sources": [
          {
            "evidence": "§7305.F requires wastewater-collection certification on all sewerage-system components except the treatment plant; §7323.D requires Class 1–4 exam sequence in each category. §§7321.A and 7331.K establish committee validation and state program preparation auspices, not a named standardized exam. §7325.B requires the Law and Rules Examination.",
            "title": "LDH Operator Certification Rule",
            "url": "https://ldh.la.gov/assets/oph/Center-EH/operator/OperatorCertificationRule.pdf"
          },
          {
            "evidence": "Separate WASTEWATER COLLECTION CLASS 1, 2, 3 and 4 outlines. Subjects include lift stations and underground safety, sewer leak testing and rehabilitation, infiltration/inflow calculations, and Class 4 televised-line interpretation and retrofit specifications. No standardized ABC/WPI designation.",
            "title": "Operator Need-to-Know: Wastewater Collection",
            "url": "https://ldh.la.gov/assets/oph/Center-EH/operator/Need2Know-WastewaterCollection.pdf"
          },
          {
            "evidence": "The official program separately lists Wastewater Collection under 'Exam Need to Know' and provides certification-rule and Law and Rule Exam links.",
            "title": "Louisiana Operator Certification Program",
            "url": "https://ldh.la.gov/bureau-of-engineering-services/louisiana-operator-certification-program"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "ME",
    "dedicatedCourseNeeds": [
      "Separate Maine VSWS combined treatment/distribution route; it is a distinct local credential, not numbered Class I–IV. Confirm its specific exam outline before assigning shared-class preparation.",
      "Maine wastewater-specific alignment for Biological Grades 1–5, P/C Grades 1–2, and SITS Grades 1–2, using DEP Chapter 531 and confirmed grade-specific exam outlines. Resolve the DEP customized/NEIWPCC standardized contradiction before national shared-course routing; retain a distinct SITS route.",
      "Regional NEWEA collection Grades I–IV preparation using the June 2026 brochure's Need-to-Know Criteria and NEWEA formula sheet. Its categories cover equipment, collection-system operation/restoration, lift stations, monitoring, and applied math/safety/administration; do not present this as WPI standardized collection preparation."
    ],
    "limits": [
      "Requested cutoff: October 3, 2026. Sources were opened October 4, 2026; undated live pages were not independently archived at the cutoff, so intervening edits cannot be excluded.",
      "Eight source opens, including one failed acquisition. The NEIWPCC-linked September 2024 wastewater exam FAQ returned 404, preventing further clarification within the cap.",
      "The water paper application remains linked by the current state page but is dated 2015; it supports exam labels, not current fees or delivery arrangements. Explicit national-class correspondence was not acquired.",
      "Neither wastewater grade-to-WPI-class correspondence nor SITS exam provenance was established. The collection program is regional and voluntary, not a verified mandatory Maine collection license; the schema lacks a regional non-WPI exam category."
    ],
    "name": "Maine",
    "streams": [
      {
        "authorityName": "Maine Board of Licensure of Water System Operators; Maine DHHS/Maine CDC Drinking Water Program",
        "authorityUrl": "https://www.maine.gov/dhhs/mecdc/healthy-living/health-and-safety/drinking-water-safety/drinking-water-professionals/Become-a-WO",
        "examSystem": "wpi-standardized",
        "localLevels": "Treatment Class I, Class II, Class III, Class IV; Very Small Water System (VSWS), a combined treatment/distribution credential. Operator-in-Training is a status, not another class.",
        "note": "The state explicitly identifies ABC standardized water-operator examinations and treatment Classes I–IV. However, the opened sources do not expressly crosswalk Maine's classes to WPI national exam-class identifiers; under the requested strict mapping rule, shared levels remain empty. VSWS is outside numbered levels 1–4, and its particular exam form was not separately verified.",
        "sources": [
          {
            "evidence": "Systems are classified 'at levels I to IV in both treatment and distribution categories'; examinations are offered by ABC: 'These standardized exams are nationally-based.' VSWS covers both categories for systems serving fewer than 500 people.",
            "title": "How to Become a Licensed Water Operator",
            "url": "https://www.maine.gov/dhhs/mecdc/healthy-living/health-and-safety/drinking-water-safety/drinking-water-professionals/Become-a-WO"
          },
          {
            "evidence": "The Board's exam selections list Treatment and Distribution, Class I, Class II, Class III, Class IV, and Very Small Water System. The linked form is dated August 24, 2015.",
            "title": "Application for Examination (Paper Only): Water Treatment and Distribution System Operators",
            "url": "https://www.maine.gov/dhhs/mecdc/sites/maine.gov.dhhs.mecdc/files/WO-Paper-Exam-Application.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Maine Board of Licensure of Water System Operators; Maine DHHS/Maine CDC Drinking Water Program",
        "authorityUrl": "https://www.maine.gov/dhhs/mecdc/healthy-living/health-and-safety/drinking-water-safety/drinking-water-professionals/Become-a-WO",
        "examSystem": "wpi-standardized",
        "localLevels": "Distribution Class I, Class II, Class III, Class IV; Very Small Water System (VSWS), a combined treatment/distribution credential. Operator-in-Training is a status.",
        "note": "Distribution is expressly included in the state's water-examination framework, not inferred from treatment alone. ABC standardized adoption is confirmed, but an explicit local-class-to-national-exam-class crosswalk was not established in the opened sources. VSWS requires separate routing outside shared levels 1–4.",
        "sources": [
          {
            "evidence": "The page names both treatment and distribution levels I–IV and states that water-operator examinations are ABC 'standardized exams.' Licenses may cover either or both disciplines.",
            "title": "How to Become a Licensed Water Operator",
            "url": "https://www.maine.gov/dhhs/mecdc/healthy-living/health-and-safety/drinking-water-safety/drinking-water-professionals/Become-a-WO"
          },
          {
            "evidence": "Exam selections explicitly include Distribution Classes I–IV and a separate Very Small Water System selection; the issuing authority is the Board of Licensure of Water System Operators.",
            "title": "Application for Examination (Paper Only): Water Treatment and Distribution System Operators",
            "url": "https://www.maine.gov/dhhs/mecdc/sites/maine.gov.dhhs.mecdc/files/WO-Paper-Exam-Application.pdf"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Maine Department of Environmental Protection, Division of Water Quality Management; NEIWPCC administers the program",
        "authorityUrl": "https://www.maine.gov/dep/water/wwoperator/index.html",
        "examSystem": "unverified",
        "localLevels": "Biological Grades 1–5; Physical/Chemical (P/C) Grades 1–2; Spray Irrigation Treatment System (SITS) Grades 1–2. Provisional Certification is a status.",
        "note": "Authoritative sources conflict: DEP expressly says customized WPI examinations, while its designated administrator calls the examinations standardized WPI exams. Therefore standardized-versus-customized scope is unverified, and no shared levels are assigned. Do not equate Maine's five Biological grades with WPI Classes I–IV. NEIWPCC separately identifies SITS paper exams; their authoring system was not established. DEP requires an appropriately certified operator in responsible charge, with a professional-engineer exception; other supervised staff need not be certified.",
        "sources": [
          {
            "evidence": "DEP oversees the program and NEIWPCC handles day-to-day administration. It states: 'MEDEP uses customized examinations in conjunction with Water Professionals International (WPI).' Classification types are Biological Grades 1–5, P/C Grades 1–2, and SITS Grades 1–2.",
            "title": "Wastewater Operator Certification Program",
            "url": "https://www.maine.gov/dep/water/wwoperator/index.html"
          },
          {
            "evidence": "Contradictorily states that licensure examinations are 'standardized computer-based exams produced by' WPI. It distinguishes Biological and Physical-Chemical computer-based exams from 'SITS paper exams' offered as needed.",
            "title": "Maine Wastewater Operator Certification Exams",
            "url": "https://neiwpcc.org/maine/wastewater-certification/exams/"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "New England Water Environment Association (NEWEA), voluntary regional collection-system certification; not Maine DEP treatment licensure",
        "authorityUrl": "https://www.newea.org/careers/certification/collection-systems-certification-program/",
        "examSystem": "unverified",
        "localLevels": "NEWEA Collection Systems Grade I, Grade II, Grade III, Grade IV; Operator-in-Training status is available for all four grades.",
        "note": "The offered route is a voluntary regional NEWEA program. Its own committee prepares the examinations; this is not evidence of WPI standardized collection exams. The schema has no regional association-authored exam category, so unverified is used rather than incorrectly labeling it a Maine state-authored exam. Program existence and NEWEA exam ownership are verified; no separate Maine state-issued collection credential was established in the opened sources.",
        "sources": [
          {
            "evidence": "DEP identifies Maine preparation for 'Grades 1 through 4 of the NEWEA Collection Systems Certification exams,' establishing the collection route independently of drinking-water certification.",
            "title": "Maine DEP September 2023 O&M Newsletter",
            "url": "https://content.govdelivery.com/accounts/MEDEP/bulletins/36cc6a1"
          },
          {
            "evidence": "Section 2.1: 'This is a voluntary program.' Sections 4.5 and 6.1 assign examination preparation to NEWEA's subcommittee. Sections 9–10 identify Grades I–IV; the brochure supplies its own Need-to-Know Criteria and NEWEA formula sheet.",
            "title": "NEWEA Collection Systems Certification Program, revised June 2026",
            "url": "https://www.newea.org/wp-content/uploads/2026/06/CS-BROCHURE-Rev-06_2026-1.pdf"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "MD",
    "dedicatedCourseNeeds": [
      "Use Maryland's local process-class structure and Board-specific need-to-know criteria when developing any dedicated outlines; do not relabel Maryland Classes 1–4 as WPI standardized levels.",
      "Water Class 5 needs technology-specific preparation/outline confirmation for the application options RO, DE, Arsenic and GWUDI; it is a site-specific classification, not a generic upper WPI level.",
      "Wastewater 5A has an official Maryland outline supporting dedicated activated-sludge, tertiary/nutrient-removal, solids-handling, laboratory and calculation preparation. Preserve A and S distinctions rather than treating them as ordinal levels.",
      "Wastewater Class 6 requires site-specific outline confirmation because the regulatory classification covers alternative technologies outside the other treatment classes.",
      "For distribution and collection, confirm current Maryland-specific prescriptions with the Board before development; preserve the single distribution class and the distinction between collection Classes 1 and 2, with only C2 listed on the opened exam application.",
      "Include Maryland COMAR 26.06.01 certification/classification requirements as a jurisdictional module; the opened sources do not establish that a separate Maryland-regulations exam section exists."
    ],
    "limits": [
      "Requested cutoff: October 3, 2026. Sources were retrieved October 4, 2026; live pages are not archived cutoff snapshots. Used announcements dated on or before the cutoff.",
      "Eight source opens completed. Official sources do not explicitly verify current standardized WPI/ABC scope plus local-to-WPI class correspondence, so all verifiedSharedLevels remain empty.",
      "Supplementary public-college MCET handbooks state 'ABC uses the Board’s Exam Prescriptions to put together certification exams' and 'Each certification classification has its own exam created by ABC based on the Board’s instructions': https://www.mcet.org/_assets/preparing-for-the-exam.pdf and https://www.mcet.org/_assets/whomustbecertified.pdf. MDE recommends MCET training, but MCET was not verified as a state-designated exam administrator; these are customized-exam leads, not authoritative current routing verification.",
      "The Board-linked exam application is revised January 2017 and contains obsolete delivery references; the official training page links a 2022 schedule. These were used for classification/content evidence, not current delivery arrangements. The 2025 5A guide supplements the older application.",
      "Unverified means insufficient authoritative current exam-system evidence, not that certification is unavailable or that standardized exams are unsupported. ABC involvement, delivery vendors, reciprocity and matching class numerals were not treated as standardized-exam proof."
    ],
    "name": "Maryland",
    "streams": [
      {
        "authorityName": "Maryland Board of Waterworks and Waste Systems Operators, Maryland Department of the Environment (MDE)",
        "authorityUrl": "https://mde.maryland.gov/programs/permits/environmentalboards/pages/bww.aspx",
        "examSystem": "unverified",
        "localLevels": "Class G - No chemical treatment; Class 1 - Disinfection; Class 2 - Chemical Treatment; Class 3 - Simple Iron Removal; Class 4 - Complete Treatment; Class 5 - Site Specific. The exam application specifies Water 5 options RO, DE, Arsenic, or GWUDI.",
        "note": "Official sources establish Maryland's process-specific classes and ABC involvement, but not the current standardized versus customized product for every class. Supplementary MCET guidance describes ABC assembling exams to Board prescriptions, indicating customized rather than standardized exams; its administrator designation and current class-by-class scope were not verified. Maryland Classes 1–4 must not be equated with WPI standardized Classes I–IV.",
        "sources": [
          {
            "evidence": "Table 3 lists water-treatment classes 1, 2, 3, 4, 5 and G; .10B says examinations are based on need-to-know criteria for each specific classification determined by the Board.",
            "title": "COMAR 26.06.01 - Board of Waterworks and Waste Systems Operators",
            "url": "https://mde.maryland.gov/programs/permits/EnvironmentalBoards/Documents/COMAR%2026.06.01_WWSO_Board_Regulations.pdf"
          },
          {
            "evidence": "Water Treatment Plant Operator (T): 1 2 3 4 5 G; 'For Water 5, write RO, DE, Arsenic, or GWUDI.'",
            "title": "Application for Operator Examination",
            "url": "https://mde.maryland.gov/programs/permits/EnvironmentalBoards/Documents/WWSO-Operator-Exam-Application.pdf"
          },
          {
            "evidence": "Computer-based examinations are described as available for all categories through a project coordinated with ABC. This establishes ABC involvement, not standardized-exam adoption.",
            "title": "Training and Examinations",
            "url": "https://mde.maryland.gov/programs/water/water_supply/pages/operatortrainingandexaminations.aspx"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Maryland Board of Waterworks and Waste Systems Operators, Maryland Department of the Environment (MDE)",
        "authorityUrl": "https://mde.maryland.gov/programs/permits/environmentalboards/pages/bww.aspx",
        "examSystem": "unverified",
        "localLevels": "One class: Water Distribution (WD in COMAR; D in Board/application terminology). The examination application labels it Water Distribution Systems Operator (D), class 1.",
        "note": "A single local distribution classification is established independently of treatment. No authoritative current standardized WPI scope or correspondence to WPI Class I was verified. Supplementary MCET guidance describes a Maryland-specific Water Distribution exam prescription assembled by ABC, but is not confirmed designated-administrator evidence. COMAR does not classify distribution separately when operated and supervised by certified water-treatment personnel.",
        "sources": [
          {
            "evidence": ".03E: 'Water distribution systems are classified as one class, Water Distribution (WD)'; separate classification is unnecessary under certified water-treatment plant personnel. Table 7 labels the operator class D.",
            "title": "COMAR 26.06.01 - Board of Waterworks and Waste Systems Operators",
            "url": "https://mde.maryland.gov/programs/permits/EnvironmentalBoards/Documents/COMAR%2026.06.01_WWSO_Board_Regulations.pdf"
          },
          {
            "evidence": "Category/class choices include 'Water Distribution Systems Operator (D) 1'. This local label does not establish WPI Class I equivalence.",
            "title": "Application for Operator Examination",
            "url": "https://mde.maryland.gov/programs/permits/EnvironmentalBoards/Documents/WWSO-Operator-Exam-Application.pdf"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Maryland Board of Waterworks and Waste Systems Operators, Maryland Department of the Environment (MDE)",
        "authorityUrl": "https://mde.maryland.gov/programs/permits/environmentalboards/pages/bww.aspx",
        "examSystem": "unverified",
        "localLevels": "Class 1 - Lagoons; Class 2 - Physical/Biological; Class 3 - Package Activated Sludge Plants; Class 4 - Trickling Filters/Rotating Biological Contactors (RBC); Class 5 - Activated Sludge; Class 6 - Site Specific; Class S - Solids Handling; Class A - Advanced Wastewater Treatment. MDE additionally publishes a Wastewater 5A certification exam study guide; 5A is not a separate class in the opened regulatory table.",
        "note": "Wastewater evidence was checked separately. Official classification and 5A outline sources do not identify the current exam product or provider by class. Supplementary MCET guidance describes Board-prescribed ABC exams, including site-specific Class 6, but its current scope and designated-administrator status were not verified. Class A is used with other classes; S is required only where works are limited to solids handling. No standardized WPI class mapping is established.",
        "sources": [
          {
            "evidence": "Table 2 lists wastewater classes 1–6, S and A; its notes state S applies to works limited to solids handling and A is used in conjunction with other classes.",
            "title": "COMAR 26.06.01 - Board of Waterworks and Waste Systems Operators",
            "url": "https://mde.maryland.gov/programs/permits/EnvironmentalBoards/Documents/COMAR%2026.06.01_WWSO_Board_Regulations.pdf"
          },
          {
            "evidence": "The official guide supplies a 5A outline covering secondary treatment, solids handling, tertiary treatment, nitrogen removal, phosphorus removal, laboratory interpretation and math; it says technical categories were established by the exam provider without naming the product.",
            "title": "Maryland Wastewater 5A Certification Exam Study Guide",
            "url": "https://mde.maryland.gov/programs/permits/EnvironmentalBoards/Documents/BWW-5A-Cert-Exam-Study-Giude.pdf"
          },
          {
            "evidence": "The Board establishes examination standards and issues certificates; its Wastewater Treatment 5A Study Guide announcement is dated March 20, 2025.",
            "title": "Board of Waterworks and Waste System Operators",
            "url": "https://mde.maryland.gov/programs/permits/environmentalboards/pages/bww.aspx"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Maryland Board of Waterworks and Waste Systems Operators, Maryland Department of the Environment (MDE)",
        "authorityUrl": "https://mde.maryland.gov/programs/permits/environmentalboards/pages/bww.aspx",
        "examSystem": "unverified",
        "localLevels": "Class 1 - Wastewater collection systems with gravity flow; Class 2 - Wastewater collection systems with gravity and pumped or vacuum flow. The opened exam application offers only Wastewater Collection System Operator (C), class 2.",
        "note": "Two certification classifications are verified, but a separate Class 1 exam was not established. Supplementary MCET guidance provides a Class 2 prescription and describes ABC assembly to Board instructions; official current standardized/customized product confirmation was not found. Neither local class has a verified WPI standardized-class correspondence. Collection is not separately classified when operated and supervised by certified wastewater-treatment personnel.",
        "sources": [
          {
            "evidence": ".03C defines Class 1 gravity flow and Class 2 gravity with pumped or vacuum flow; it exempts separate classification under certified wastewater-treatment personnel. Table 6 identifies both operator classifications.",
            "title": "COMAR 26.06.01 - Board of Waterworks and Waste Systems Operators",
            "url": "https://mde.maryland.gov/programs/permits/EnvironmentalBoards/Documents/COMAR%2026.06.01_WWSO_Board_Regulations.pdf"
          },
          {
            "evidence": "The examination choices show 'Wastewater Collection System Operator (C) 2', not a Class 1 examination.",
            "title": "Application for Operator Examination",
            "url": "https://mde.maryland.gov/programs/permits/EnvironmentalBoards/Documents/WWSO-Operator-Exam-Application.pdf"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "MA",
    "dedicatedCourseNeeds": [
      "Keep the separately offered Very Small Water System exam outside numbered WPI treatment/distribution routing until its outline and exam origin are verified.",
      "For drinking-water eligibility information, distinguish Board-approved Basic Treatment training for Grade 2, Advanced Treatment training for Grades 3–4, and Distribution training covering Grades 2–4; these are prerequisites, not evidence of unique exam content.",
      "Wastewater-treatment course specifications must preserve the Municipal, Industrial and Combined local tracks. Use the Massachusetts exam-reference subjects, including industrial pretreatment and metal-wastestream treatment; obtain grade-specific blueprints before assigning shared WPI courses.",
      "A Massachusetts wastewater regulatory supplement can separately address the MassDEP-listed 257 CMR 2.00 certification rules and 314 CMR 12.00 operation, maintenance and pretreatment standards; their listing does not establish exam weighting.",
      "For any NEWEA collection course route, first verify the June 2026 brochure, exact four-grade names and grade-specific examination outline; do not substitute WPI collection classes on the basis of similar numbering."
    ],
    "limits": [
      "Eight source opens were used; all cited evidence comes from opened pages/documents, not search snippets.",
      "Assessment targets October 3, 2026; live sources were accessed October 4, 2026, without an archived October 3 snapshot.",
      "No explicit Massachusetts Grade-to-WPI Class crosswalk was established, so verifiedSharedLevels remains empty even where standardized drinking-water adoption is supported.",
      "Wastewater exam origin and collection legal status/grade names remain unverified, not unsupported or not-offered. NEWEA is primary evidence for its regional program, not verified evidence of Massachusetts state designation."
    ],
    "name": "Massachusetts",
    "streams": [
      {
        "authorityName": "Massachusetts Board of Certification of Operators of Drinking Water Supply Facilities, Division of Occupational Licensure",
        "authorityUrl": "https://www.mass.gov/orgs/board-of-certification-of-operators-of-drinking-water-supply-facilities",
        "examSystem": "wpi-standardized",
        "localLevels": "Massachusetts Water Treatment Grade 1, Grade 2, Grade 3, Grade 4. Very Small Water System is separately listed, not a numbered treatment grade.",
        "note": "For examinations after December 31, 2025, the Board expressly directs candidates to the applicable 2025 Standardized Water Treatment Operator Need-to-Know document. Standardized adoption is supported for the numbered treatment exams, but the opened sources do not explicitly crosswalk each Massachusetts Grade to its WPI Class; shared-level routing therefore remains unverified. The separate Very Small Water System exam is outside this verified standardized scope.",
        "sources": [
          {
            "evidence": "For exams after December 31, 2025: review the applicable 'Standardized Water Treatment Operator and Standardized Water Distribution Operator Need-to-Know document for the exam grade you will be taking.'",
            "title": "Drinking Water Board: Operator exam information",
            "url": "https://www.mass.gov/info-details/frequently-asked-questions-about-board-of-certification-of-operators-of-drinking-water-operator-exam-information"
          },
          {
            "evidence": "Lists Massachusetts Water Treatment Grades 1, 2, 3 and 4 and a separate Massachusetts Very Small Water System exam.",
            "title": "PSI: Massachusetts Drinking Water Operators  -  Available Tests",
            "url": "https://test-takers.psiexams.com/abc-ma/test"
          },
          {
            "evidence": "Lists 'WPI Standardized Water Treatment Operator Class I' through Class IV; no Massachusetts grade crosswalk is shown.",
            "title": "WPI: 2025 Need-to-Know Criteria",
            "url": "https://gowpi.org/services/2025-need-to-know-criteria/"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Massachusetts Board of Certification of Operators of Drinking Water Supply Facilities, Division of Occupational Licensure",
        "authorityUrl": "https://www.mass.gov/orgs/board-of-certification-of-operators-of-drinking-water-supply-facilities",
        "examSystem": "wpi-standardized",
        "localLevels": "Massachusetts Water Distribution Grade 1, Grade 2, Grade 3, Grade 4.",
        "note": "The Board explicitly points post-December 31, 2025 distribution examinees to standardized 2025 WPI criteria. An explicit Massachusetts Grade-to-WPI Class crosswalk was not found in the opened sources, so no numeric shared levels are asserted. PSI delivery alone is not the standardized-exam evidence.",
        "sources": [
          {
            "evidence": "Post-December 31, 2025 exam guidance expressly names the 'Standardized Water Distribution Operator' Need-to-Know document. Distribution Grades 2–4 require one Board-approved Distribution training course.",
            "title": "Drinking Water Board: Operator exam information",
            "url": "https://www.mass.gov/info-details/frequently-asked-questions-about-board-of-certification-of-operators-of-drinking-water-operator-exam-information"
          },
          {
            "evidence": "Lists Massachusetts Water Distribution Grade 1, Grade 2, Grade 3 and Grade 4.",
            "title": "PSI: Massachusetts Drinking Water Operators  -  Available Tests",
            "url": "https://test-takers.psiexams.com/abc-ma/test"
          },
          {
            "evidence": "Lists Standardized Water Distribution Operator Classes I–IV; the page does not expressly map Massachusetts grades.",
            "title": "WPI: 2025 Need-to-Know Criteria",
            "url": "https://gowpi.org/services/2025-need-to-know-criteria/"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Massachusetts Board of Certification of Operators of Wastewater Treatment Facilities / Massachusetts Department of Environmental Protection; program administered by NEIWPCC",
        "authorityUrl": "https://www.mass.gov/info-details/wastewater-treatment-plant-operations",
        "examSystem": "unverified",
        "localLevels": "Industrial Grade 1, Grade 2, Grade 3, Grade 4; Municipal Grade 1, Grade 2, Grade 3, Grade 4; Combined Grade 5, Grade 6; Combined Grade 7 upgrade.",
        "note": "The designated administrator confirms WPI involvement but does not expressly identify which local exams are standardized, customized ABC/WPI, or state-specific. Its generic standardized-exam resource link does not establish adoption. Do not map Municipal or Industrial Grades 1–4 to WPI Classes I–IV. Combined Grade 7 is presented as an upgrade application, not a listed computer-based exam.",
        "sources": [
          {
            "evidence": "Names NEIWPCC as providing Massachusetts operator training and certification exams; identifies 257 CMR 2.00 operator certification regulations and links the Combined Grade 7 upgrade application.",
            "title": "MassDEP: Wastewater Treatment Plant Operations",
            "url": "https://www.mass.gov/info-details/wastewater-treatment-plant-operations"
          },
          {
            "evidence": "NEIWPCC works with WPI and the Massachusetts Board, administers the program on behalf of MassDEP, and links a separate Combined Grade 7 upgrade form. Standardized Need-to-Know material is only listed as a general resource.",
            "title": "NEIWPCC: Massachusetts Wastewater Operator Certification Exams",
            "url": "https://neiwpcc.org/learning-center/massachusetts-wastewater-operator-training-certification/massachusetts-wastewater-operator-exam-info/"
          },
          {
            "evidence": "Examination list names Industrial Grades 1–4, Municipal Grades 1–4 and Combined Grades 5–6; it does not identify standardized versus customized exam scope.",
            "title": "Massachusetts Wastewater Computerized Certification Examination Information",
            "url": "https://neiwpcc.org/wp-content/uploads/2023/12/ABC-MAWW-Handbook-Nov-2023.pdf"
          },
          {
            "evidence": "Local reference includes industrial pretreatment, treatment of metal wastestreams, neutralization, process control, and 'Rules and Regulations.'",
            "title": "Massachusetts Wastewater Treatment and Industrial Waste Exam References",
            "url": "https://neiwpcc.org/wp-content/uploads/2020/08/mwotexam_reference.pdf"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "New England Water Environment Association (NEWEA), regional certification issuer; Massachusetts statutory certifying authority or state designation not verified",
        "authorityUrl": "https://www.newea.org/careers/certification/collection-systems-certification-program/",
        "examSystem": "unverified",
        "localLevels": "Four grade levels are confirmed for NEWEA's regional program; exact current grade names were not verified in the opened source.",
        "note": "NEWEA explicitly offers collection-personnel certification in the New England States, but the opened sources do not establish Massachusetts mandatory collection licensure, state designation, or standardized WPI/ABC exam adoption. Keep this association program distinct from MassDEP wastewater-treatment licensure; its voluntary/mandatory legal status and exam origin remain unverified in this acquisition set.",
        "sources": [
          {
            "evidence": "Program is 'offered in four grade levels' for collection-systems personnel 'in the New England States'; links a June 2026 brochure and eligibility point system. No standardized WPI/ABC scope is stated.",
            "title": "NEWEA: Collection Systems Certification Program",
            "url": "https://www.newea.org/careers/certification/collection-systems-certification-program/"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "MI",
    "dedicatedCourseNeeds": [
      "Michigan drinking-water preparation needs distinct Complete Treatment F, Limited Treatment D and Distribution S local-grade tracks, plus separate level-5 preparation; align with EGLE's local study materials and Michigan Safe Drinking Water Act/Part 19 requirements rather than relabeling WPI classes.",
      "Municipal wastewater preparation needs Michigan-specific A, B, C/D, L1/L2 lagoon and SC study-guide tracks, the EGLE wastewater formula sheet and Part 41/Sewerage Systems rules. The rules distinguish L2's special mechanical treatment devices from L1 and identify SC facilities such as septic/tile-field systems and recirculating sand filters.",
      "Collection C1–C4 and RTB are future Michigan-specific preparation needs, not current exam courses: monitor EGLE's implementation materials and published exam outlines before assigning a course route."
    ],
    "limits": [
      "Assessment target: October 3, 2026. Live official sources were retrieved October 4, 2026; this is not an archived October 3 snapshot. The collection implementation page explicitly carries an August 17, 2026 update.",
      "Eight official state pages/documents were opened; no search snippet was used as proof.",
      "Wastewater-treatment findings verify the municipal program. Separate industrial wastewater credentials and voluntary collection credentials remain unverified, not classified as unsupported or absent.",
      "All verifiedSharedLevels arrays are empty: no opened source establishes both standardized WPI/ABC exam scope and an explicit Michigan-grade-to-WPI-class correspondence. State preparation is supported by explicit rule text, not inferred from membership, delivery vendor, reciprocity or generic ABC content."
    ],
    "name": "Michigan",
    "streams": [
      {
        "authorityName": "Michigan Department of Environment, Great Lakes, and Energy (EGLE), Drinking Water and Environmental Health Division, Operator Training and Certification Unit (OTCU)",
        "authorityUrl": "https://www.michigan.gov/egle/about/organization/drinking-water-and-environmental-health/drinking-water-operator-certification",
        "examSystem": "state-specific",
        "localLevels": "Complete Treatment: F-1, F-2, F-3, F-4, F-5. Limited Treatment: D-1, D-2, D-3, D-4, D-5. Levels 1–4 cover community systems, with 1 the highest; F-5 and D-5 cover noncommunity systems.",
        "note": "Rules expressly require department-prepared examinations with advisory-board concurrence. Level 5 has a different permitted assessment structure. No standardized WPI/ABC adoption or local-to-WPI class correspondence was established; Michigan's numerical grades must not be mapped directly to WPI classes.",
        "sources": [
          {
            "evidence": "R 325.11901 lists F-1 through F-5 and D-1 through D-5. R 325.11912(1): 'A written examination shall be prepared by the department with the concurrence of the advisory board' for each classification except F-5, D-5 and S-5. Subrule (4) permits those level-5 assessments to combine training, written, oral or performance-based examination.",
            "title": "Supplying Water to the Public  -  Part 19, Examination and Certification of Operators",
            "url": "https://www.michigan.gov/egle/-/media/Project/Websites/egle/Documents/Programs/DWEHD/DWEHD-Laws/R32510101-to-R32512820.pdf?rev=74455a4d75694123840cfd35314b6c93"
          },
          {
            "evidence": "The 2026 schedule offers F 1-2-3-4, D 1-2-3-4, and separate F-5/D-5 applications; labels F 'Complete Treatment' and D 'Limited Treatment.' Study materials are organized by these local license types.",
            "title": "Drinking water operator certification exam applications",
            "url": "https://www.michigan.gov/egle/about/organization/drinking-water-and-environmental-health/drinking-water-operator-certification/exam-applications-and-study-guides"
          },
          {
            "evidence": "The Drinking Water Operator Training and Certification Unit oversees certification and training; EGLE establishes certification standards and OTCU administers biannual examinations.",
            "title": "Drinking Water Operator Certification",
            "url": "https://www.michigan.gov/egle/about/organization/drinking-water-and-environmental-health/drinking-water-operator-certification"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Michigan Department of Environment, Great Lakes, and Energy (EGLE), Drinking Water and Environmental Health Division, Operator Training and Certification Unit (OTCU)",
        "authorityUrl": "https://www.michigan.gov/egle/about/organization/drinking-water-and-environmental-health/drinking-water-operator-certification",
        "examSystem": "state-specific",
        "localLevels": "Distribution: S-1, S-2, S-3, S-4, S-5. S-1 is the highest community-system grade. S-5 covers nontransient noncommunity supplies without treatment or community supplies without treatment and with distribution limited in extent.",
        "note": "Distribution is expressly covered by the state-prepared examination rule, not inferred solely from treatment evidence. S-5 has a separate permitted assessment structure. No explicit standardized WPI/ABC scope or grade crosswalk was established.",
        "sources": [
          {
            "evidence": "R 325.11902 explicitly lists distribution classes S-1 through S-5. R 325.11912 requires department-prepared examinations with advisory-board concurrence and allows a different combination of assessments for S-5.",
            "title": "Supplying Water to the Public  -  Part 19",
            "url": "https://www.michigan.gov/egle/-/media/Project/Websites/egle/Documents/Programs/DWEHD/DWEHD-Laws/R32510101-to-R32512820.pdf?rev=74455a4d75694123840cfd35314b6c93"
          },
          {
            "evidence": "The 2026 exam schedule explicitly includes S 1-2-3-4 and S-5; the page labels S 'Distribution, Levels 1-5' and provides separate Type I distribution and Type II level-5 applications.",
            "title": "Drinking water operator certification exam applications",
            "url": "https://www.michigan.gov/egle/about/organization/drinking-water-and-environmental-health/drinking-water-operator-certification/exam-applications-and-study-guides"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Michigan Department of Environment, Great Lakes, and Energy (EGLE), Water Resources Division, Operator Certification Unit, with the Board of Certification",
        "authorityUrl": "https://www.michigan.gov/egle/about/organization/water-resources/wastewater/operator-certification/municipal",
        "examSystem": "state-specific",
        "localLevels": "Municipal treatment: Class A, Class B, Class C, Class D (A highest); Class L2 and Class L1 (waste stabilization lagoons, L2 higher); Class SC (special classification). Class RTB (retention treatment basin) is established in the April 2026 rules but its new exam is not yet offered.",
        "note": "Active municipal exams are state-prepared, with separate examinations by local class. The current exam page offers A–D, L1, L2 and SC; new RTB implementation is deferred, with initial classifications and exam offerings anticipated no earlier than mid- to late 2028. No standardized WPI/ABC adoption or class correspondence was established. Separate industrial wastewater certification was not verified in this acquisition scope.",
        "sources": [
          {
            "evidence": "R 299.2911 names A–D, L2/L1, SC and RTB. R 299.2922(1): 'The department shall prepare the examinations for operator certification, taking into account board review and comment.' Subrule (3) requires separate examinations for each class.",
            "title": "Sewerage Systems  -  Michigan Administrative Rules, effective April 29, 2026",
            "url": "https://ars.apps.lara.state.mi.us/AdminCode/DownloadAdminCodeFile?FileName=R%20299.2901%20to%20R%20299.2974.pdf"
          },
          {
            "evidence": "Applications go to EGLE WRD Operator Certification Unit. Current exams are A–D, L1, L2 and SC. The page provides study guides for Class A, Class B, Classes C/D, Classes L1/L2 and Class SC, and a Michigan wastewater formula sheet.",
            "title": "Municipal wastewater operator certification  -  Exam application & instructions",
            "url": "https://www.michigan.gov/egle/about/organization/water-resources/wastewater/operator-certification/municipal/exam-application"
          },
          {
            "evidence": "Content updated August 17, 2026: rules took effect April 29, 2026, but initial system classifications and exam offerings are anticipated no earlier than mid- to late 2028; EGLE must first reclassify RTB systems.",
            "title": "Collection system & RTB certs",
            "url": "https://www.michigan.gov/egle/about/organization/water-resources/wastewater/operator-certification/municipal/collection-system-rtb-certs"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Michigan Department of Environment, Great Lakes, and Energy (EGLE), Water Resources Division, with the Board of Certification",
        "authorityUrl": "https://www.michigan.gov/egle/about/organization/water-resources/wastewater/operator-certification/municipal/collection-system-rtb-certs",
        "examSystem": "not-offered",
        "localLevels": "New statutory collection-system classes: Class C1, Class C2, Class C3, Class C4, with C1 highest. These are not currently offered EGLE exam levels as of the requested date.",
        "note": "Not offered refers specifically to EGLE's new state collection certification exams, not to a claim that no voluntary credential exists. Rules are effective, but communities need not comply immediately; EGLE must first classify systems. Exam development and implementation are pending, with earliest anticipated offerings mid- to late 2028. The rules prescribe state-prepared class-specific exams; no operating standardized WPI/ABC route or crosswalk is verified. Voluntary association credentials were not independently verified.",
        "sources": [
          {
            "evidence": "'While the rules are now in effect, communities are not required to comply immediately.' EGLE must first classify collection systems. 'The earliest anticipated timeline for initial system classifications and exam offerings is mid- to late 2028.' The page says supporting materials and exam development are still being developed; updated August 17, 2026.",
            "title": "Collection system & RTB certs",
            "url": "https://www.michigan.gov/egle/about/organization/water-resources/wastewater/operator-certification/municipal/collection-system-rtb-certs"
          },
          {
            "evidence": "R 299.2911 names collection classes 'C1, C2, C3, or C4, with class C1 being the highest'; R 299.2918 sets their operator qualification requirements. R 299.2922 requires department-prepared, separate class examinations.",
            "title": "Sewerage Systems  -  Michigan Administrative Rules, effective April 29, 2026",
            "url": "https://ars.apps.lara.state.mi.us/AdminCode/DownloadAdminCodeFile?FileName=R%20299.2901%20to%20R%20299.2974.pdf"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "MN",
    "dedicatedCourseNeeds": [
      "Minnesota water-supply-system preparation should follow local Classes A-E, not invented separate treatment/distribution 1-4 equivalencies. Obtain MDH's classification-specific subjects-to-know lists; use its designated Minnesota Class D and Class E guides and Minnesota Water Works Operations Manual. Include Minnesota law/rule content required by Rule 9400.1000.",
      "Wastewater treatment Classes A-D need MPCA-local outline alignment: the certification page provides individual exam descriptions. The opened Class D description supports pond stabilization, disinfection, pumps/valves, process-control calculations, and applicable regulations. Do not extrapolate its outline to all grades.",
      "Collection Classes S-A through S-D need Type S classification and Minnesota-local collection preparation. Official topics include inflow/infiltration, lift stations, cleaning, traffic control, safety, and collection math. The shared MPCA need-to-know framework includes NPDES/SDS permitting and state/local regulatory responsibilities; obtain grade-specific clarification because that document is not classification-separated."
    ],
    "limits": [
      "Requested reference date: October 3, 2026. Live official sources were retrieved October 4, 2026; an exact October 3 historical snapshot was not independently established. MDH pages display January 11, 2026 updates.",
      "Eight official source opens completed. No explicit standardized WPI/ABC adoption statement and local-to-WPI class correspondence were found; all verifiedSharedLevels are therefore empty.",
      "Rule 9400.1000 establishes state preparation responsibility, but does not expressly identify an exam supplier or exclude customized ABC question-bank use. ExamSystem is conservatively unverified rather than claiming standardized, customized, or wholly state-authored exams.",
      "MPCA's currently linked need-to-know document is dated August 5, 2005, and the opened Class D description February 1, 2008. Their continued official linkage supports local study needs, not independently verified 2026 exam revisions."
    ],
    "name": "Minnesota",
    "streams": [
      {
        "authorityName": "Minnesota Department of Health (MDH), Drinking Water Protection Section",
        "authorityUrl": "https://www.health.state.mn.us/communities/environment/water/wateroperator/index.htm",
        "examSystem": "unverified",
        "localLevels": "Water Supply System Operator: Class A, Class B, Class C, Class D, Class E; A is highest.",
        "note": "Mandatory water-supply-system certification, rather than a separately documented treatment-only ladder. Rules require state-prepared, class-specific examinations, but the opened sources do not conclusively distinguish wholly state-authored exams from customized ABC exams. MDH's ABC reference-list link does not establish standardized ABC/WPI adoption or class correspondence.",
        "sources": [
          {
            "evidence": "'The Water Supply System Operator Examinations are comprised of five levels, Class A-E, with A being the highest level.' MDH offers classification-specific subjects-to-know lists and Minnesota Class D/E study guides; ABC is described only as having 'a useful list of exam references.'",
            "title": "Drinking Water Operator Certification  -  Exam Study Materials",
            "url": "https://www.health.state.mn.us/communities/environment/water/wateroperator/referencelist.htm"
          },
          {
            "evidence": "9400.0350(A): water certificates are issued by the commissioner of health. 9400.1000: 'The respective commissioner shall prepare the examinations'; separate exams are required for each designated class, with state law and rules among the listed knowledge areas.",
            "title": "Minnesota Rules Chapter 9400  -  Water Treatment Certification",
            "url": "https://www.revisor.mn.gov/rules/9400/full"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Minnesota Department of Health (MDH), Drinking Water Protection Section",
        "authorityUrl": "https://www.health.state.mn.us/communities/environment/water/wateroperator/index.htm",
        "examSystem": "unverified",
        "localLevels": "Water Supply System Operator: Class A, Class B, Class C, Class D, Class E; no separate distribution certificate ladder identified in the opened sources.",
        "note": "Distribution falls within Minnesota's water-supply-system classification and examination framework. Do not invent a separate Distribution 1-4 route or map A-D to WPI 4-1. The current exam supplier and standardized-versus-customized distinction remain unverified.",
        "sources": [
          {
            "evidence": "9400.0400 classifies water systems using both treatment processes and distribution storage capacity. 9400.1000 explicitly includes 'water distribution systems' in class-specific examination scope and requires the respective commissioner to prepare examinations.",
            "title": "Minnesota Rules Chapter 9400  -  Water Treatment Certification",
            "url": "https://www.revisor.mn.gov/rules/9400/full"
          },
          {
            "evidence": "MDH identifies one Water Supply System Operator examination series, Class A-E, with A highest; its ABC link is an exam-reference resource, not an explicit standardized-exam adoption statement.",
            "title": "Drinking Water Operator Certification  -  Exam Study Materials",
            "url": "https://www.health.state.mn.us/communities/environment/water/wateroperator/referencelist.htm"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Minnesota Pollution Control Agency (MPCA)",
        "authorityUrl": "https://www.pca.state.mn.us/business-with-us/wastewater-training-and-certification",
        "examSystem": "unverified",
        "localLevels": "Class A, Class B, Class C, Class D.",
        "note": "Mandatory MPCA certification. Official rules prescribe state-prepared class-specific exams, and MPCA publishes its own exam descriptions and need-to-know framework. These support Minnesota-local preparation, but do not explicitly resolve wholly state-authored versus customized ABC exams. No standardized WPI scope or local-grade correspondence verified.",
        "sources": [
          {
            "evidence": "Wastewater operators 'must be certified'; 'The MPCA administers the certification program.' Treatment facilities are classified A, B, C, and D. The page links separate Class A, B, C, and D exam descriptions.",
            "title": "Wastewater training and certification",
            "url": "https://www.pca.state.mn.us/business-with-us/wastewater-training-and-certification"
          },
          {
            "evidence": "The MPCA-developed Need to Know document was cross-referenced with 'the current MPCA operator exams' to describe each exam. The Class D outline lists pond stabilization, disinfection, collection-system pumps and valves, process-control math, and applicable regulations.",
            "title": "Wastewater Facility & Collection System  -  Class D Exam Description (wq-wwtp8-07)",
            "url": "https://www.pca.state.mn.us/sites/default/files/wq-wwtp8-07.pdf"
          },
          {
            "evidence": "9400.0350(B) assigns wastewater certificates to the Pollution Control Agency commissioner. 9400.1000 requires the respective commissioner to prepare separate class-specific examinations, including state law and rules.",
            "title": "Minnesota Rules Chapter 9400  -  Water Treatment Certification",
            "url": "https://www.revisor.mn.gov/rules/9400/full"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Minnesota Pollution Control Agency (MPCA)",
        "authorityUrl": "https://www.pca.state.mn.us/business-with-us/wastewater-training-and-certification",
        "examSystem": "unverified",
        "localLevels": "Type S: Class S-A, Class S-B, Class S-C, Class S-D.",
        "note": "Mandatory certification for separately operated Type S collection, pumping, and conveyance facilities; when not distinctly separate, collection is part of the treatment facility. This is not evidenced as a voluntary association credential. Collection-specific official evidence establishes its local framework, but not standardized WPI/ABC adoption or a class 1-4 mapping; state-authored versus customized ABC remains unresolved.",
        "sources": [
          {
            "evidence": "MPCA explicitly includes collection systems in mandatory certification. Separately operated Type S facilities are S-A (50,000+ population), S-B (15,000-49,999), S-C (1,500-14,999), and S-D (below 1,500). Nonseparate collection systems are part of the treatment facility.",
            "title": "Wastewater training and certification",
            "url": "https://www.pca.state.mn.us/business-with-us/wastewater-training-and-certification"
          },
          {
            "evidence": "MPCA developed this framework with a Steering Team and Sounding Board; its criteria 'will directly influence: exam questions' and training. Collection systems have their own section. The document says it is not broken down by operator classification.",
            "title": "Need to Know  -  Wastewater and Collection System Operators (wq-wwtp12-06)",
            "url": "https://www.pca.state.mn.us/sites/default/files/wq-wwtp12-06.pdf"
          },
          {
            "evidence": "9400.0500, subpart 4 establishes Type S and Classes S-A through S-D. 9400.1000 expressly includes wastewater collection systems in class-specific examination scope and requires commissioner preparation.",
            "title": "Minnesota Rules Chapter 9400  -  Water Treatment Certification",
            "url": "https://www.revisor.mn.gov/rules/9400/full"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "MS",
    "dedicatedCourseNeeds": [
      "Drinking water requires Mississippi-specific local-class and regulatory material: Class D chlorination/direct feed, Class C pressure-filtration and conditioning processes, Class B advanced/multiple processes, Class A surface-water/GWUDI and specified softening/coagulation, plus Class E distribution-only/purchased-water operations. Obtain current MSDH class-specific exam outlines before choosing standardized, customized or state-specific exam courses.",
      "Wastewater needs a Mississippi regulatory/classification supplement distinguishing mandatory treatment I–IV from voluntary collection I-C/II-C, including the collection 1.0-MGD boundary, facility-based treatment classifications and the Class II examination prerequisite for III/IV. Confirm the WPI class crosswalk, especially collection, before shared-level routing.",
      "Published rules require a recent agency-sponsored or approved short course for examination eligibility; Echelon course approval is not established. No separate unique wastewater technical exam is proven after the announced WPI transition."
    ],
    "limits": [
      "Requested cutoff: October 3, 2026. Live official sources were retrieved October 4, 2026; no archived October 3 snapshot was acquired. MDEQ's notice says the transition occurred in 2026 but gives no exact commencement date.",
      "Eight source opens total. Findings use opened official state documents/pages and the state-linked exam developer, not search snippets, membership listings, reciprocity, or delivery-provider identity.",
      "The MDEQ resources page labels September 2026 regulatory changes as proposed. They were not treated as enacted; the published 2017 regulation supplies local grades and voluntary/mandatory distinctions.",
      "The current MSDH page still links a March 2021 examination handbook and May 2019 operations manual. These do not establish current standardized versus customized ABC/WPI exam provenance. All shared-level arrays are intentionally empty where an explicit Mississippi-to-WPI class correspondence was not verified."
    ],
    "name": "Mississippi",
    "streams": [
      {
        "authorityName": "Mississippi State Department of Health (MSDH), Bureau of Public Water Supply",
        "authorityUrl": "https://msdh.ms.gov/msdhsite/index.cfm/30,23247,76,138,html",
        "examSystem": "unverified",
        "localLevels": "Class A, Class B, Class C, Class D; Class E is the distribution-only/purchased-water classification.",
        "note": "Mandatory waterworks certification uses treatment-based letter classes, not a verified WPI I–IV ladder. The official rules require Bureau examinations; the currently linked handbook establishes PSI delivery and use of an ABC formula table, but neither establishes standardized versus customized ABC/WPI exams or current state-specific exam authorship.",
        "sources": [
          {
            "evidence": "Rules 2.2.1 and 2.3.1–2.3.5 identify Classes A–E: A covers surface water/GWUDI, lime softening or specified coagulation/filtration; B covers multiple Class C processes and other advanced treatment; C covers aeration, pH adjustment, corrosion control and closed pressure filtration; D covers chlorination/fluoridation/direct chemical feed. Rule 2.6.1 says the Bureau shall prepare written examinations.",
            "title": "Bureau of Public Water Supply regulations, Chapter 2",
            "url": "https://msdh.ms.gov/page//resources/3275.pdf"
          },
          {
            "evidence": "Describes MSDH drinking-water examinations delivered through PSI. Examination Restrictions says the 'ABC Formula & Conversion Table' is provided; it does not identify the examinations as standardized ABC/WPI exams.",
            "title": "MSDH Bureau of Public Water Supply  -  PSI Computer-Based Testing Information Bulletin, March 2021",
            "url": "https://msdh.ms.gov/msdhsite/index.cfm/30,14417,76,pdf/Water_Operator_Exam_Handbook.pdf"
          },
          {
            "evidence": "Official certification page links the exam handbook and Public Water System Operations Manual; last reviewed March 13, 2025.",
            "title": "Water Supply Operator Training and Certification",
            "url": "https://msdh.ms.gov/msdhsite/index.cfm/30,23247,76,138,html"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Mississippi State Department of Health (MSDH), Bureau of Public Water Supply",
        "authorityUrl": "https://msdh.ms.gov/msdhsite/index.cfm/30,23247,76,138,html",
        "examSystem": "unverified",
        "localLevels": "Class E for distribution-only operators; Class A–D waterworks responsible-charge certificates also encompass their systems' distribution operations. No separate numbered distribution ladder verified.",
        "note": "Distribution certification is offered through the waterworks program, specifically Class E for distribution-only duties. No evidence establishes Class E as any WPI standardized distribution class, or proves standardized/customized/state-specific exam provenance.",
        "sources": [
          {
            "evidence": "Rule 2.2.1(1): Class E covers systems that purchase water without additional treatment and 'waterworks operators whose only job responsibility is the operation and maintenance of the distribution system(s).' Rule 2.3.5 requires the Bureau's written examination. The responsible-charge definition includes treatment plants, wells and distribution systems.",
            "title": "Bureau of Public Water Supply regulations, Chapter 2",
            "url": "https://msdh.ms.gov/page//resources/3275.pdf"
          },
          {
            "evidence": "All-classifications introduction assigns the certified operator responsibility for treatment facilities and distribution systems. Class E duties include residual checks past the master meter and within distribution.",
            "title": "Public Water System Operations Manual, May 2019",
            "url": "https://msdh.ms.gov/msdhsite/index.cfm/30,8153,76,pdf/Water_System_Operations_Manual.pdf"
          },
          {
            "evidence": "PSI administration and an ABC formula table are documented, but standardized distribution exam adoption and Class E correspondence are not.",
            "title": "MSDH PSI Computer-Based Testing Information Bulletin",
            "url": "https://msdh.ms.gov/msdhsite/index.cfm/30,14417,76,pdf/Water_Operator_Exam_Handbook.pdf"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Mississippi Department of Environmental Quality (MDEQ), Wastewater Operator Training and Certification Program",
        "authorityUrl": "https://www.mdeq.ms.gov/water/municipal-and-commercial-wastewater-division/wastewater-operator-resources/",
        "examSystem": "wpi-standardized",
        "localLevels": "Class I, Class II, Class III, Class IV",
        "note": "MDEQ explicitly confirms a 2026 transition to WPI standardized wastewater examinations. Mandatory municipal/domestic treatment certification is verified. However, the opened sources do not expressly identify which WPI class exam corresponds to each Mississippi facility-based class; identical Roman numerals alone are not used as a crosswalk, so shared-level routing remains unverified.",
        "sources": [
          {
            "evidence": "'In 2026, MDEQ’s wastewater operator certification program transitioned from our existing wastewater examinations to the standardized wastewater examinations developed by our testing partner, WPI.' It links the 2025 Need-to-Know Criteria and describes criteria 'for each exam level.'",
            "title": "Wastewater Operator Resources",
            "url": "https://www.mdeq.ms.gov/water/municipal-and-commercial-wastewater-division/wastewater-operator-resources/"
          },
          {
            "evidence": "Rule 3.1 requires certified operators for municipal/domestic treatment plants and excludes solely industrial, industry-owned treatment facilities. Rules 3.3–3.4 identify Classes I–IV; I covers stabilization lagoons/septic tank-sand filters, while II–IV vary by process and capacity. Passing Class II is required before sitting Class III or IV.",
            "title": "11 Miss. Admin. Code Part 6, Chapter 3  -  amended August 24, 2017",
            "url": "https://www.mdeq.ms.gov/wp-content/uploads/2017/06/11-Miss.-Admin.-Code-Pt.-6.-Ch.-3.pdf"
          },
          {
            "evidence": "Lists '2025 Standardized Wastewater Treatment Operator' Classes I, II, III and IV, but provides no Mississippi local-class crosswalk; instructs candidates to confirm appropriate materials with their certifying authority.",
            "title": "WPI 2025 Need-to-Know Criteria  -  linked by MDEQ",
            "url": "https://gowpi.org/services/2025-need-to-know-criteria/"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Mississippi Department of Environmental Quality (MDEQ), Wastewater Operator Training and Certification Program",
        "authorityUrl": "https://www.mdeq.ms.gov/water/municipal-and-commercial-wastewater-division/wastewater-operator-resources/",
        "examSystem": "unverified",
        "localLevels": "Class I-C; Class II-C (voluntary collection-only certification)",
        "note": "Collection certification and its exact local grades are explicitly verified. MDEQ's umbrella 2026 standardized-wastewater transition notice does not expressly name collection exams or map I-C/II-C to WPI Collection I/II. Collection exam provenance therefore remains unverified, not unsupported or not-offered.",
        "sources": [
          {
            "evidence": "Rule 3.3 explicitly lists I-C and II-C as 'Collection only (voluntary)': I-C up to 1,000,000 GPD, II-C greater than 1,000,000 GPD. Rule 3.4 separately requires a written exam for both classes.",
            "title": "11 Miss. Admin. Code Part 6, Chapter 3",
            "url": "https://www.mdeq.ms.gov/wp-content/uploads/2017/06/11-Miss.-Admin.-Code-Pt.-6.-Ch.-3.pdf"
          },
          {
            "evidence": "The state program says certification is offered in 'four (4) classes of treatment and two (2) classes of collection based on size and type of facility.'",
            "title": "Wastewater Operator Training And Certification",
            "url": "https://www.mdeq.ms.gov/water/municipal-and-commercial-wastewater-division/wastewater-operator-resources/wastewater-operator-trainer-certification-program/"
          },
          {
            "evidence": "Announces transition to standardized WPI 'wastewater examinations' in 2026, without separately identifying collection exams or their class correspondence.",
            "title": "Wastewater Operator Resources",
            "url": "https://www.mdeq.ms.gov/water/municipal-and-commercial-wastewater-division/wastewater-operator-resources/"
          },
          {
            "evidence": "Lists standardized Wastewater Collection Classes I–IV; does not map Mississippi I-C or II-C to those exams.",
            "title": "WPI 2025 Need-to-Know Criteria  -  linked by MDEQ",
            "url": "https://gowpi.org/services/2025-need-to-know-criteria/"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "MO",
    "dedicatedCourseNeeds": [
      "For pre-January-2027 drinking-water treatment, retain Missouri grade-specific D/C/B/A outline alignment using MoDNR's existing exam descriptions; do not substitute the future standardized crosswalk.",
      "For pre-January-2027 distribution, retain separate Missouri Distribution System 1/2/3 outline alignment; the local numbering is not WPI Class 1/2/3 equivalence.",
      "For pre-January-2027 wastewater treatment, retain Missouri D/C/B/A outline alignment using the separately listed wastewater exam descriptions; verify legacy exam construction before choosing a shared course.",
      "For voluntary MWEA collection certification, use its own Wastewater Collections: A Need-to-Know outline, including collection basics, mathematics, pumping/piping, hazards and spill reporting. Confirm the current A-D level-specific blueprint and exam construction before shared routing."
    ],
    "limits": [
      "Research uses live official authority/program documents accessed October 4, 2026 for the October 3, 2026 cutoff; an archived cutoff-date snapshot was not obtained.",
      "The January 1, 2027 WPI standardized rollout and crosswalk are explicit, but future adoption is not evidence of standardized exams at the requested cutoff. All current verifiedSharedLevels therefore remain empty.",
      "PSI delivery and MoDNR's WPI contract do not establish the construction of the existing exams; legacy customized-WPI versus state-specific status remains unverified.",
      "The current MWEA resources page's DOCX exam application was not readable through extraction and direct downloads returned HTTP 403. A separate MWEA application PDF establishes voluntary A-D grades, but its agreement with the latest revision remains unverified.",
      "No Missouri-regulation-specific exam content was verified, so no regulations module is asserted as an established exam requirement."
    ],
    "name": "Missouri",
    "streams": [
      {
        "authorityName": "Missouri Department of Natural Resources (MoDNR), Operator Certification Unit",
        "authorityUrl": "https://dnr.mo.gov/water/business-industry-other-entities/professional-certifications-training/drinking-wastewater-operator",
        "examSystem": "unverified",
        "localLevels": "Drinking Water D; Drinking Water C; Drinking Water B; Drinking Water A",
        "note": "At the requested cutoff, existing Missouri exams precede the explicitly announced January 1, 2027 WPI standardized transition. The sources do not establish whether those existing exams are WPI-customized or independently state-developed. The announced future crosswalk D→1, C→2, B→3, A→4 must not be applied to October 2026 shared routing.",
        "sources": [
          {
            "evidence": "Lists Drinking Water A, B, C and D. Under New 2027 Exams: the department will transition to standardized exams through WPI; 'The new exams will go live Jan. 1, 2027,' with existing exams available until the switch.",
            "title": "Operator Certification Exams  -  MoDNR",
            "url": "https://dnr.mo.gov/water/business-industry-other-entities/professional-certifications-training/drinking-wastewater-operator/exams"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Missouri Department of Natural Resources (MoDNR), Operator Certification Unit",
        "authorityUrl": "https://dnr.mo.gov/water/business-industry-other-entities/professional-certifications-training/drinking-wastewater-operator",
        "examSystem": "unverified",
        "localLevels": "Distribution System 1; Distribution System 2; Distribution System 3",
        "note": "The current legacy exam construction is unresolved: WPI-customized versus state-developed is not explicitly identified. The standardized transition is January 1, 2027, not October 2026. Its future crosswalk is Distribution System 1→WPI Class 2, 2→Class 3, 3→Class 4; no local equivalent to WPI Class 1 is listed.",
        "sources": [
          {
            "evidence": "Separately lists Distribution System 3, 2 and 1 exam descriptions. The New 2027 Exams table maps these to Water Distribution Classes 4, 3 and 2, respectively, and specifies January 1, 2027 implementation.",
            "title": "Operator Certification Exams  -  MoDNR",
            "url": "https://dnr.mo.gov/water/business-industry-other-entities/professional-certifications-training/drinking-wastewater-operator/exams"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Missouri Department of Natural Resources (MoDNR), Operator Certification Unit",
        "authorityUrl": "https://dnr.mo.gov/water/business-industry-other-entities/professional-certifications-training/drinking-wastewater-operator",
        "examSystem": "unverified",
        "localLevels": "Wastewater D; Wastewater C; Wastewater B; Wastewater A",
        "note": "Wastewater is independently documented, not inferred from drinking water. Existing exams remain until the January 1, 2027 standardized transition; their customized-WPI versus state-developed construction is unverified. The future D→1, C→2, B→3, A→4 crosswalk is not current shared-level evidence.",
        "sources": [
          {
            "evidence": "Separately lists Wastewater A, B, C and D exam descriptions. Its January 2027 standardized-exam table maps those grades to Wastewater Treatment Classes 4, 3, 2 and 1.",
            "title": "Operator Certification Exams  -  MoDNR",
            "url": "https://dnr.mo.gov/water/business-industry-other-entities/professional-certifications-training/drinking-wastewater-operator/exams"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Missouri Water Environment Association (MWEA), Collection Systems Committee  -  voluntary certification",
        "authorityUrl": "https://mwea.org/Continuing_Education",
        "examSystem": "unverified",
        "localLevels": "A; B; C; D  -  Voluntary Collection Systems Operator Certification, as listed in MWEA's published application PDF; latest DOCX revision unverified",
        "note": "A separate voluntary MWEA credential is documented. Neither its application nor its study guide explicitly establishes WPI standardized or customized examinations, or a local-to-WPI class correspondence. State designation and any separate mandatory collection credential were not verified; do not inherit MoDNR treatment-exam routing.",
        "sources": [
          {
            "evidence": "Provides a distinct Collection Systems Certification Resources section with an MWEA study guide, examination application and renewal application.",
            "title": "Continuing Education  -  MWEA",
            "url": "https://mwea.org/Continuing_Education"
          },
          {
            "evidence": "Names the Missouri Water Environment Association Collection Systems Committee and explicitly labels the program voluntary. 'Certification Level Sought' lists A, B, C and D; applicants agree to the committee's certification rules.",
            "title": "Voluntary Collection Systems Operator Certification  -  Application for Examination",
            "url": "https://mwea.starchapter.com/images/downloads/Continuing_Education/blank_application_for_exam.pdf"
          },
          {
            "evidence": "MWEA-authored outline addresses collection-system basics, operator mathematics, pumping/piping factors, sewage hazards, spill reporting and remediation, and environmental surveillance/recordkeeping/reporting; it does not establish a standardized WPI examination.",
            "title": "MWEA Collections Systems Committee  -  Wastewater Collections: A Need-to-Know",
            "url": "https://drive.google.com/file/d/1Me2C0HSYZSZ5qJP7_CZb9QcJubowS6dm/view?usp=sharing"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "MT",
    "dedicatedCourseNeeds": [
      "Separate Class 4AB Very Small Water System preparation; do not substitute numeric WPI Class IV treatment or distribution courses.",
      "Separate municipal Class 3C Small Wastewater System/lagoon preparation; do not label this Montana Class 3C as WPI Wastewater Treatment Class III.",
      "Montana-specific on-site wastewater tracks for Classes 2E, 3E and 4E using DEQ's grade-specific outlines. The 2E guide includes package biological treatment, lift stations/disinfection, groundwater discharge, Circulars DEQ-2/DEQ-4 and Montana administrative rules; validate current regulatory editions before development.",
      "If industrial treatment is included, use separate industrial Physical/Chemical and Biological curricula with DEQ's D-class mappings; confirm current standardized/customized exam status before assigning a shared route."
    ],
    "limits": [
      "Requested cutoff: October 3, 2026. Live official sources were retrieved October 4, 2026; no archived October 3 snapshot was obtained.",
      "VerifiedSharedLevels are WPI/ABC numeric classes, not Montana class numbers. Special Very Small Water, Small Wastewater and industrial exams are excluded from municipal numeric shared levels.",
      "Exact current exam editions are not established. DEQ currently links both newer water outlines and older reprinted outlines; the Class 1A packet contains 2017 material, and the currently linked on-site guide was edited in 2012.",
      "Current on-site E exam authorship/customization and any separate voluntary collection certification remain unverified. Membership, reciprocity, exam delivery and generic ABC content were not used as standardized-exam proof."
    ],
    "name": "Montana",
    "streams": [
      {
        "authorityName": "Montana Department of Environmental Quality (DEQ), Water and Wastewater Operator Certification Program",
        "authorityUrl": "https://deq.mt.gov/water/Programs/operator",
        "examSystem": "wpi-standardized",
        "localLevels": "Class 1B (First Class), Class 2B (Second Class), Class 3B (Third Class), Class 4B (Fourth Class/Very Small Systems); the very-small-system exam is designated Class 4AB.",
        "note": "Verified numeric correspondence is reversed: Montana 3B = ABC/WPI Class I, 2B = Class II, 1B = Class III. Class 4AB maps to ABC Very Small Water System Operators, NOT numeric Class IV. No numeric Class IV treatment route verified.",
        "sources": [
          {
            "evidence": "Water Treatment Operator Exam References explicitly identifies 'ABC’s standardized water treatment operator exams.' The exam-equivalence table maps 1B→III, 2B→II, 3B→I and 4AB→Very Small Water System Operators.",
            "title": "DEQ  -  Water and Wastewater Operator Certification",
            "url": "https://deq.mt.gov/water/Programs/operator"
          },
          {
            "evidence": "Lists First, Second, Third and Fourth Class; Type B is Water Treatment System Operator. Fourth Class is designated Very Small Systems.",
            "title": "DEQ  -  Water and Wastewater Certification Classes",
            "url": "https://deq.mt.gov/files/Water/WQInfo/Documents/opcert/docs/DW_WW_Classifications.docx"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": [
          1,
          2,
          3
        ]
      },
      {
        "authorityName": "Montana Department of Environmental Quality (DEQ), Water and Wastewater Operator Certification Program",
        "authorityUrl": "https://deq.mt.gov/water/Programs/operator",
        "examSystem": "wpi-standardized",
        "localLevels": "Class 1A (First Class), Class 2A (Second Class), Class 3A (Third Class), Class 4A (Fourth Class/Very Small Systems); the very-small-system exam is designated Class 4AB.",
        "note": "Montana 3A = ABC/WPI Class I, 2A = Class II, 1A = Class III. Do not confuse Montana's descending classification numbers with WPI's ascending classes. Class 4AB is a separate Very Small Water System examination, not numeric Class IV.",
        "sources": [
          {
            "evidence": "Identifies 'ABC’s standardized water distribution operator examinations'; maps 1A→III, 2A→II, 3A→I and 4AB→Very Small Water System Operators.",
            "title": "DEQ  -  Water and Wastewater Operator Certification",
            "url": "https://deq.mt.gov/water/Programs/operator"
          },
          {
            "evidence": "'Montana uses ABC ... standardized exams for testing'; specifically maps Montana Class 1A to ABC Distribution Class III. The enclosed outline distinguishes standardized from customized ABC exams.",
            "title": "DEQ  -  Montana Class 1A Study Packet",
            "url": "https://deq.mt.gov/files/Water/WQInfo/Images/opcert/1AStudy.pdf"
          },
          {
            "evidence": "Type A is Water Distribution System Operator; Classes 1–4 are named First through Fourth Class, with Fourth Class designated Very Small Systems.",
            "title": "DEQ  -  Water and Wastewater Certification Classes",
            "url": "https://deq.mt.gov/files/Water/WQInfo/Documents/opcert/docs/DW_WW_Classifications.docx"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": [
          1,
          2,
          3
        ]
      },
      {
        "authorityName": "Montana Department of Environmental Quality (DEQ), Water and Wastewater Operator Certification Program",
        "authorityUrl": "https://deq.mt.gov/water/Programs/operator",
        "examSystem": "mixed",
        "localLevels": "Municipal: Class 1C (First Class; mechanical secondary/tertiary treatment) and Class 3C (Third Class; aerated/non-aerated lagoons). Industrial: Classes 1D, 2D, 3D, 4D (First–Fourth Class). On-site: Classes 2E, 3E, 4E (Second–Fourth Class). The current municipal application has no Class 2C or 4C option despite the webpage's shorthand '1C–3C'.",
        "note": "Municipal 1C is verified against standardized ABC/WPI Wastewater Treatment Class II. Municipal 3C maps to Small Wastewater System Operator, not a numeric I–IV class. Industrial D mappings are specialized industrial exams, not municipal wastewater shared levels. On-site E exams have a Montana-developed outline; their exact current ABC-customized versus state-authored provenance remains unverified. Mixed does not imply all wastewater grades are standardized.",
        "sources": [
          {
            "evidence": "Wastewater references explicitly identify ABC standardized wastewater-treatment examinations. The table maps 1C→Class II, 3C→Small Wastewater; industrial 1D→Physical/Chemical IV, 2D→Biological III, 3D→Physical/Chemical II, 4D→Biological I; 2E–4E has 'No conversion'.",
            "title": "DEQ  -  Water and Wastewater Operator Certification",
            "url": "https://deq.mt.gov/water/Programs/operator"
          },
          {
            "evidence": "DEQ links this document specifically for 1C. It states that it describes the 'ABC Standardized Wastewater Treatment Operator Class II exam' and separately warns that ABC also offers customized exams.",
            "title": "DEQ-designated ABC Wastewater Treatment Class II Need-to-Know Criteria",
            "url": "https://www.gowpi.org/wp-content/uploads/2022/09/22-WPI-017_NTK_WastewaterTREATMENTOperatorClassII_9.15.22_JC.pdf"
          },
          {
            "evidence": "Exam/certificate options are 1C and 3C, 1D–4D, and 2E–4E. The municipal Class 2 and 4 positions are unavailable; the application concerns municipal, industrial or on-site wastewater treatment systems.",
            "title": "DEQ  -  Wastewater Operator Certification Application",
            "url": "https://deq.mt.gov/files/Water/WQInfo/Documents/opcert/docs/WastewaterApp2021.pdf"
          },
          {
            "evidence": "Describes a 'Montana-specific' wastewater need-to-know framework with earlier ABC-prepared questions; says E-class exam questions, outlines and study guides were developed in 2011. Specifies three unique study guides for 2E, 3E and 4E and Montana regulatory references.",
            "title": "DEQ  -  Class 2E On-Site Wastewater Exam Study Guide",
            "url": "https://deq.mt.gov/files/Water/WQInfo/Documents/opcert/Study%20Materials/2E_Onsite_WW_Manual.docx"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": [
          2
        ]
      },
      {
        "authorityName": "Separate collection certifying authority unverified; Montana DEQ administers the state water/wastewater operator program",
        "authorityUrl": "https://deq.mt.gov/water/Programs/operator",
        "examSystem": "unverified",
        "localLevels": "No separate wastewater-collection certificate grades or examination verified.",
        "note": "DEQ's listed certificate categories and wastewater application provide treatment, industrial and on-site credentials, not a separate collection credential. This is not affirmative proof that no voluntary collection program exists, so retain unverified rather than not-offered. Do not route collection to municipal treatment Class 1C/3C or infer standardized collection exams from drinking-water evidence.",
        "sources": [
          {
            "evidence": "The certificate-category list contains A distribution, B water treatment, C wastewater, D industrial treatment and E on-site wastewater; it identifies no separate wastewater-collection category or exam.",
            "title": "DEQ  -  Water and Wastewater Operator Certification",
            "url": "https://deq.mt.gov/water/Programs/operator"
          },
          {
            "evidence": "Directs classification of 'water treatment plants, water distribution systems, and wastewater treatment plants'; does not establish a separate wastewater-collection classification.",
            "title": "Montana Code Annotated 2025  -  37-42-104",
            "url": "https://mca.legmt.gov/bills/MCA/title_0370/chapter_0420/part_0010/section_0040/0370-0420-0010-0040.html"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "NE",
    "dedicatedCourseNeeds": [
      "Nebraska wastewater-customized exam preparation needs the state-selected outlines for Class L and Classes I–IV, plus separate Industrial I–IV physical/chemical routes where offered; include Title 197 facility classifications, certification distinctions and exemptions. Do not substitute a standardized WPI Class I–IV course without blueprint verification.",
      "For the combined drinking-water route, obtain grade-specific examination outlines before selecting a shared or dedicated exam course. A Nebraska Title 179/local-grade module is supported: Grade I is highest, Grade IV basic, Grades III→II→I are sequential, and treatment/distribution use the same public-system licensing framework.",
      "Grade V requires a distinct limited-scope water module: collecting water samples, interpreting biological-examination results and maintaining required records, explicitly specified by 10-005.01(e). Keep Grade VI backflow written/hands-on requirements outside generic treatment/distribution level mapping.",
      "Do not create a separate Nebraska collection-exam course until a collection-certifying program, local levels and examination outline are verified."
    ],
    "limits": [
      "Assessment target: October 3, 2026. Eight official source URLs were opened; live access occurred October 4, 2026. This is not an archived snapshot of every page on the target date.",
      "Water authority roles are not fully reconciled: the current DWEE program page describes coordination with its department’s licensure unit, while its published March 2025 Title 179 explicitly names DHHS Division of Public Health as licensor. Both roles are reported rather than asserting an unsupported legal transfer.",
      "The water licensing brochure opened is dated December 17, 2019 and was not treated as controlling evidence for current authority. Current posted Title 179 and the live DWEE program page were used instead.",
      "No explicit standardized WPI examination scope and local-grade-to-WPI-class correspondence were established in any stream; all verifiedSharedLevels are empty. Customized ABC wastewater exams are positively verified; water examination origin and any separate collection program remain unverified."
    ],
    "name": "Nebraska",
    "streams": [
      {
        "authorityName": "Nebraska DWEE Drinking Water Field Services & Training / Operator Certification Program; published Title 179 identifies DHHS Division of Public Health as licensor",
        "authorityUrl": "https://dwee.nebraska.gov/water-quality/drinking-water/drinking-water-field-services-training-fst-program/drinking-water-field-services-training-operator-certification-and",
        "examSystem": "unverified",
        "localLevels": "Grade I, Grade II, Grade III, Grade IV, Grade V (combined public-water-system licenses, not separate treatment grades). Grade VI is a separate backflow-preventer testing/repair license; provisional licenses are available for Grades I–IV.",
        "note": "Title 179 establishes a combined treatment/distribution credential: Grade I is the highest system level, Grade IV the basic community/non-transient level, and Grade V the transient-system level. Grades III→II→I have sequential examination prerequisites. Opened official sources establish state-approved validated examinations and DWEE-developed training, but do not explicitly establish who develops the examinations or standardized/customized WPI status. Training authorship is not examination authorship; no WPI class correspondence verified.",
        "sources": [
          {
            "evidence": "10-002 defines Department as DHHS Division of Public Health and operator in responsible charge as covering a public water system, water treatment facility and/or distribution system. 10-005.01 lists Grade I–VI; Grades I–III require validated examinations recommended by the Council and approved by the Director.",
            "title": "Title 179 Public Water Systems, effective March 18, 2025  -  Chapter 10",
            "url": "https://dwee.nebraska.gov/sites/default/files/titles/Title%20179%20Effective%2003-18-2025.pdf"
          },
          {
            "evidence": "The program coordinates with the department’s licensure unit on issuance, reinstatement and renewal; FS&T staff develop training courses and administer and score examinations. The page does not identify an examination developer or WPI standardized exam.",
            "title": "Drinking Water Field Services & Training Operator Certification and Training",
            "url": "https://dwee.nebraska.gov/water-quality/drinking-water/drinking-water-field-services-training-fst-program/drinking-water-field-services-training-operator-certification-and"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Nebraska DWEE Drinking Water Field Services & Training / Operator Certification Program; published Title 179 identifies DHHS Division of Public Health as licensor",
        "authorityUrl": "https://dwee.nebraska.gov/water-quality/drinking-water/drinking-water-field-services-training-fst-program/drinking-water-field-services-training-operator-certification-and",
        "examSystem": "unverified",
        "localLevels": "Grade I, Grade II, Grade III, Grade IV, Grade V under the combined public-water-system license; no separate distribution-grade series identified. Related Grade VI is backflow-preventer testing/repair, not a distribution Class VI.",
        "note": "Distribution coverage is explicitly supported by Chapter 10, not inferred from a treatment webpage. System classifications incorporate distribution populations and purchased-water systems. Exam provenance and standardized WPI class mapping remain unverified for this combined credential.",
        "sources": [
          {
            "evidence": "Operator in responsible charge explicitly includes a distribution system; public water system includes treatment, storage and distribution facilities. 10-004 classifies distribution and purchased-water systems within Classes I–V; 10-005 establishes corresponding Grade I–V operator licenses and separate Grade VI backflow certification.",
            "title": "Title 179 Public Water Systems  -  Chapter 10, §§10-002 through 10-005",
            "url": "https://dwee.nebraska.gov/sites/default/files/titles/Title%20179%20Effective%2003-18-2025.pdf"
          },
          {
            "evidence": "DWEE’s program ensures public water systems have licensed operators; staff administer and score water-operator examinations and coordinate licensing. No separate distribution examination developer or standardized WPI scope is stated.",
            "title": "Drinking Water Field Services & Training Operator Certification and Training",
            "url": "https://dwee.nebraska.gov/water-quality/drinking-water/drinking-water-field-services-training-fst-program/drinking-water-field-services-training-operator-certification-and"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Nebraska Department of Water, Energy, and Environment (DWEE), Wastewater Treatment Facility Operator Certification Program",
        "authorityUrl": "https://dwee.nebraska.gov/surface-water/wastewater/wastewater-treatment-facility-operator-certification-program",
        "examSystem": "wpi-customized",
        "localLevels": "Class L, Class I, Class II, Class III, Class IV; Industrial I, Industrial II, Industrial III, Industrial IV. Municipal/compatible-industrial and non-compatible physical/chemical-industrial credentials are distinct. Temporary and provisional certificates are additional statuses, not additional grades.",
        "note": "The April 2026 official examination page explicitly identifies ABC customized exams, not WPI standardized exams. Title 197 confirms the actual operator certificate names. Numeric similarity of Classes I–IV does not prove shared standardized levels; individual customized class blueprints were not acquired. Certification is mandatory for covered facilities, subject to regulatory exemptions.",
        "sources": [
          {
            "evidence": "DWEE ‘administers the Nebraska Wastewater Operator Certification using ABC customized exams.’ This explicit customized-exam statement, rather than ABC partnership or PSI delivery, establishes the classification.",
            "title": "Schedule of Exams  -  2026 DWEE Test Dates, updated April 2026",
            "url": "https://dwee.nebraska.gov/surface-water/wastewater/wastewater-treatment-facility-operator-certification-program/schedule-exams"
          },
          {
            "evidence": "Chapter 3 §001 lists Class L, Class I–IV and Industrial I–IV certificates. Chapter 2 §§009–010 prohibit substituting municipal/compatible certification for non-compatible industrial certification or vice versa; Chapter 1 provides exemptions.",
            "title": "Title 197  -  Rules and Regulations for the Certification of Wastewater Treatment Operators, effective April 6, 2020",
            "url": "https://dwee.nebraska.gov/sites/default/files/titles/Title%20197%20Effective%2004-06-2020.pdf"
          },
          {
            "evidence": "The Director issues certificates to operators meeting education/experience requirements and passing the respective certification test; the current program page links Title 197 as its governing rules.",
            "title": "Wastewater Treatment Facility Operator Certification Program",
            "url": "https://dwee.nebraska.gov/surface-water/wastewater/wastewater-treatment-facility-operator-certification-program"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Separate collection-certifying authority unverified; DWEE Wastewater Treatment Facility Operator Certification Program governs the treatment-facility framework reviewed",
        "authorityUrl": "https://dwee.nebraska.gov/surface-water/wastewater/wastewater-treatment-facility-operator-certification-program",
        "examSystem": "unverified",
        "localLevels": "No separate collection-operator levels verified. Title 197 lists treatment credentials Class L, Class I–IV and Industrial I–IV, not a separate collection series.",
        "note": "Title 197 defines collection as part of a wastewater treatment facility, but this does not establish a separate collection certification or collection exam. No separate mandatory or state-designated voluntary collection program was verified. Do not transfer the treatment program’s customized ABC finding to collection, and do not declare collection certification unavailable solely from absence in these sources.",
        "sources": [
          {
            "evidence": "‘Collection System’ means the part of the wastewater treatment facility collecting and transporting wastewater. The certificate enumeration contains Class L, Class I–IV and Industrial I–IV, with no separately named collection certificates.",
            "title": "Title 197  -  Chapter 1 §001.03 and Chapter 3 §001",
            "url": "https://dwee.nebraska.gov/sites/default/files/titles/Title%20197%20Effective%2004-06-2020.pdf"
          },
          {
            "evidence": "The official program describes treatment-facility certification, facility ratings and treatment-operator examinations; it does not establish a separate wastewater-collection examination route.",
            "title": "Wastewater Treatment Facility Operator Certification Program",
            "url": "https://dwee.nebraska.gov/surface-water/wastewater/wastewater-treatment-facility-operator-certification-program"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "NV",
    "dedicatedCourseNeeds": [],
    "limits": [
      "Assessment targets October 3, 2026 using eight official/state-designated source opens. Pages were retrieved October 4, 2026; no archived October 3 snapshot was established.",
      "No unique Nevada or customized ABC exam syllabus was verified, so no dedicated unique-exam course is asserted. Drinking-water exam identity and grade-to-class mappings require authoritative confirmation before shared-course routing.",
      "NDEP identifies drinking-water program rules as NRS 445A.875–445A.880 and NAC 445A.617–445A.652, and wastewater-treatment rules as NAC 445A.287–445A.292; this does not prove a separately tested Nevada-regulations module.",
      "NWEA's policy page says its full policy/procedures manual is unavailable while being updated for new regulations. The opened written-exam policy adds logistics, not class correspondence.",
      "Generic WPI links, delivery arrangements, reciprocity provisions and search snippets were not used as proof of standardized exam use. No operator records were accessed."
    ],
    "name": "Nevada",
    "streams": [
      {
        "authorityName": "Nevada Division of Environmental Protection (NDEP), Bureau of Safe Drinking Water",
        "authorityUrl": "https://ndep.nv.gov/water/operator-certification/drinking-water",
        "examSystem": "unverified",
        "localLevels": "Water Treatment Grade 1, Grade 2, Grade 3, Grade 4; Full and Operator-in-Training (OIT) certification statuses.",
        "note": "NDEP certifies treatment operators separately from distribution operators. Its current page links WPI study resources and identifies PSI delivery, but neither establishes that Nevada uses standardized rather than customized ABC/WPI exams. The linked computerized-exam instructions identify Nevada-branded exams without specifying exam construction. Standardized scope and grade-to-WPI-class correspondence remain unverified.",
        "sources": [
          {
            "evidence": "Certificates are issued by NDEP; implementation is under its Bureau of Safe Drinking Water. The requirements table lists Grades 1–4 and the page distinguishes treatment and distribution certificates. Exam resources include a WPI study-resource link and PSI computerized testing.",
            "title": "NDEP  -  Drinking Water Operator Certification",
            "url": "https://ndep.nv.gov/water/operator-certification/drinking-water"
          },
          {
            "evidence": "Applicants select their approved examination from eight ‘Nevada Drinking Water Operator Distribution/Treatment’ exams. The document does not identify standardized or customized ABC/WPI examinations.",
            "title": "NDEP  -  Drinking Water Operator Certification: Computerized Examination Information",
            "url": "https://ndep.nv.gov/uploads/water-opcert-dw-program-docs/Instructions_for_computerized_exams_20211221_draft.docx"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Nevada Division of Environmental Protection (NDEP), Bureau of Safe Drinking Water",
        "authorityUrl": "https://ndep.nv.gov/water/operator-certification/drinking-water",
        "examSystem": "unverified",
        "localLevels": "Water Distribution Grade 1, Grade 2, Grade 3, Grade 4; Full and Operator-in-Training (OIT) certification statuses.",
        "note": "Separate distribution certification is confirmed. PSI delivery and the WPI study-resource link do not prove standardized ABC/WPI exam use. No explicit current standardized scope or Nevada-grade-to-WPI-class correspondence was established.",
        "sources": [
          {
            "evidence": "The program covers drinking-water treatment plants and distribution systems; the requirements table lists Grades 1–4. The page gives distribution examples ‘D2 Full’ and ‘D3 OIT’ and requires separate continuing education for treatment and distribution certificates.",
            "title": "NDEP  -  Drinking Water Operator Certification",
            "url": "https://ndep.nv.gov/water/operator-certification/drinking-water"
          },
          {
            "evidence": "Instructions identify eight Nevada Distribution/Treatment exams delivered through PSI, but do not describe them as standardized ABC/WPI exams.",
            "title": "NDEP  -  Drinking Water Operator Certification: Computerized Examination Information",
            "url": "https://ndep.nv.gov/uploads/water-opcert-dw-program-docs/Instructions_for_computerized_exams_20211221_draft.docx"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Nevada Division of Environmental Protection (NDEP), Bureau of Water Pollution Control; Nevada Water Environment Association (NWEA) administers the program under contract",
        "authorityUrl": "https://ndep.nv.gov/water/operator-certification/wastewater",
        "examSystem": "wpi-standardized",
        "localLevels": "Wastewater Treatment Plant Operator Grade I, Grade II, Grade III, Grade IV; Restricted certification is a Grade I pathway, not an additional grade.",
        "note": "Mandatory state certification. NDEP explicitly requires standardized examinations for Grades I–IV, and its designated administrator explicitly identifies standardized Wastewater Treatment Plant Operator exam forms developed through ABC. This supports the standardized exam family, but the opened sources do not explicitly map Nevada Grades I–IV to WPI Classes I–IV; shared-level routing therefore remains unverified.",
        "sources": [
          {
            "evidence": "NDEP's Bureau of Water Pollution Control administers the program; NWEA operates it under contract. Its functions include ‘Administer standardized examinations for certification Grades I through IV.’ Wastewater treatment operator certification is mandatory.",
            "title": "NDEP  -  Wastewater Certification Program",
            "url": "https://ndep.nv.gov/water/operator-certification/wastewater"
          },
          {
            "evidence": "‘Each standardized exam form for Wastewater Treatment Plant Operator and Collection System Operator’ includes unscored pre-test items allowing ABC to evaluate new questions. The FAQ describes Nevada's participation in future standardized exams and Restricted certification after passing a Grade I exam without all eligibility requirements.",
            "title": "NWEA  -  FAQ Applications",
            "url": "https://www.nvwea.org/faq-applications"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Nevada Water Environment Association (NWEA), Board of Certification  -  voluntary certification program",
        "authorityUrl": "https://www.nvwea.org/certificationportal",
        "examSystem": "wpi-standardized",
        "localLevels": "Collection System Operator Grade 1, Grade 2, Grade 3, Grade 4; Collection System Operator Restricted status and Upgrade to Grade 1 pathway.",
        "note": "Voluntary NWEA certification, not NDEP's mandatory wastewater-treatment credential. NWEA explicitly includes Collection System Operator in its standardized ABC exam explanation. Its portal lists Grades 1–4, but the opened sources do not explicitly establish each local grade's correspondence to a WPI class, so no shared levels are verified.",
        "sources": [
          {
            "evidence": "NDEP distinguishes mandatory Wastewater Treatment Plant Operator certification from voluntary programs offered by the NWEA Board of Certification, including ‘Collection System Operators.’",
            "title": "NDEP  -  Wastewater Certification Program",
            "url": "https://ndep.nv.gov/water/operator-certification/wastewater"
          },
          {
            "evidence": "The standardized-exam explanation explicitly names ‘Collection System Operator’ alongside wastewater treatment and describes ABC's development of the standardized exam forms.",
            "title": "NWEA  -  FAQ Applications",
            "url": "https://www.nvwea.org/faq-applications"
          },
          {
            "evidence": "The portal lists Collection System Operator Grade 1, Grade 2, Grade 3, Grade 4, Restricted, and Upgrade to Grade 1. Collection applications and renewals moved to Certemy beginning April 2024, separately from wastewater treatment.",
            "title": "NWEA  -  The Certification Process…Online",
            "url": "https://www.nvwea.org/certificationportal"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "NH",
    "dedicatedCourseNeeds": [
      "Grade IA combined water-treatment/distribution small-system pathway content, distinct from Grades I–IV; use NH's Small Public Water System Operator Course pathway and Env-Dw 502/RSA 332-E requirements without asserting a WPI Class I equivalence.",
      "NH wastewater-treatment Grades I–IV preparation aligned to the NHDES written-exam format and NHDES wastewater formula sheet; include math-word-problem work, Grade III–IV essay preparation and the applicable Certification Committee interview process. Add a clearly identified Env-Wq 304 local-responsibilities supplement.",
      "Voluntary NEWEA collection Grades I–IV preparation using the June 2026 program outline: equipment operation/evaluation/maintenance; collection-system operation/maintenance/restoration; lift stations; monitoring/evaluation/adjustment; applied math, safety and administration. Use the NEWEA formula sheet and grade-specific suggested references, not an assumed WPI outline."
    ],
    "limits": [
      "Requested cutoff: October 3, 2026. Live sources were accessed October 4, 2026; no historical snapshot was obtained. The official water-rule compilation includes an August 2025 effective filing, and the collection brochure is dated June 2026.",
      "Eight distinct source URLs were opened. The official NHDES water-certification overview PDF could not be extracted and its direct download returned HTTP 403; it supplies no evidence here.",
      "No stream has sufficient evidence for verified shared WPI Classes 1–4. Computer-based delivery and reciprocity provisions were not treated as standardized-exam proof.",
      "NEWEA directly documents its voluntary collection program and NH applicability, but the opened NHDES sources do not independently document a state designation of NEWEA or a separate mandatory NH collection certificate.",
      "Water Grades I–IV need an authoritative current examination outline or explicit examination-system confirmation before choosing standardized, customized or dedicated-exam course routing."
    ],
    "name": "New Hampshire",
    "streams": [
      {
        "authorityName": "New Hampshire Department of Environmental Services (NHDES), Water Works Operator Certification Program",
        "authorityUrl": "https://www.des.nh.gov/water/drinking-water/public-water-systems/operator-certification",
        "examSystem": "unverified",
        "localLevels": "Grade IA: combined treatment and distribution certification; treatment Grades I, II, III and IV. Operator-in-Training provisions for Grades I, II and III.",
        "note": "Mandatory water-works certification. Official sources establish the grades and availability of treatment Grades I–IV computer-based exams, but do not identify standardized WPI/ABC versus customized ABC or state-developed examinations. No local-grade-to-standardized-WPI-class mapping verified; Grade IA must not be mapped to Class I.",
        "sources": [
          {
            "evidence": "Lists five grades from 1A through 4 and explicitly offers computer-based Treatment and Distribution grades I–IV exams.",
            "title": "Water Works Operator Certification  -  NHDES",
            "url": "https://www.des.nh.gov/water/drinking-water/public-water-systems/operator-certification"
          },
          {
            "evidence": "Applications distinguish 'grade IA combined distribution and treatment certification' from Grade I–IV treatment or distribution certifications. The department administers written examinations; no standardized WPI/ABC scope is specified.",
            "title": "Env-Dw 500, especially 502.05(c)(2) and 502.07  -  NH Administrative Rules",
            "url": "https://gc.nh.gov/rules/state_agencies/env-dw500.html"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "New Hampshire Department of Environmental Services (NHDES), Water Works Operator Certification Program",
        "authorityUrl": "https://www.des.nh.gov/water/drinking-water/public-water-systems/operator-certification",
        "examSystem": "unverified",
        "localLevels": "Grade IA: combined distribution and treatment certification; distribution Grades I, II, III and IV. Operator-in-Training provisions for Grades I, II and III.",
        "note": "Distribution is separately identified in official rules and exam availability, not inferred from treatment certification. Standardized WPI/ABC adoption, customized ABC use and class correspondence remain unverified.",
        "sources": [
          {
            "evidence": "Expressly provides Grade I, II, III or IV 'treatment certification, distribution certification, or both certifications,' with Grade IA combined.",
            "title": "Env-Dw 500, especially 502.05(c)(2) and 502.07  -  NH Administrative Rules",
            "url": "https://gc.nh.gov/rules/state_agencies/env-dw500.html"
          },
          {
            "evidence": "Computer-based certification exams are available for 'Treatment and Distribution grades I-IV'; the page does not establish the examination developer or standardized scope.",
            "title": "Water Works Operator Certification  -  NHDES",
            "url": "https://www.des.nh.gov/water/drinking-water/public-water-systems/operator-certification"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "New Hampshire Department of Environmental Services (NHDES), Wastewater Operations Section and Wastewater Operator Certification Committee",
        "authorityUrl": "https://www.des.nh.gov/waste/wastewater/operator-certification",
        "examSystem": "state-specific",
        "localLevels": "Grade I, Grade II, Grade III and Grade IV; corresponding I-OIT, II-OIT, III-OIT and IV-OIT statuses.",
        "note": "Mandatory certification for public wastewater treatment plant operators. NHDES documents a distinct NH written-exam format: multiple-choice/matching and math-word problems at all grades, plus essays at Grades III and IV. A committee interview is required for qualifying applicants. This supports state-specific routing, not shared standardized WPI levels; the sources do not establish whether any individual questions originate with ABC.",
        "sources": [
          {
            "evidence": "NHDES' Wastewater Operations Section oversees treatment-operator certification; public WWTP operators must be certified. Identifies Env-Wq 304 as the governing certification rules.",
            "title": "Wastewater Operator Certification  -  NHDES",
            "url": "https://www.des.nh.gov/waste/wastewater/operator-certification"
          },
          {
            "evidence": "Lists Grades I–IV and their OIT statuses. Exam-format table specifies matching, math-word problems and Grade III–IV essays. Requires a Certification Committee interview for Grade II or higher, or Grade I operators in responsible charge, once during a career.",
            "title": "Wastewater Operator FAQ  -  NHDES",
            "url": "https://www.des.nh.gov/wastewater-operator-faq"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "New England Water Environment Association (NEWEA), Collection System Certification Sub Committee  -  voluntary regional certification",
        "authorityUrl": "https://www.newea.org/careers/certification/collection-systems-certification-program/",
        "examSystem": "state-specific",
        "localLevels": "Grade I, Grade II, Grade III and Grade IV; OIT status available at all four grades.",
        "note": "NH-specific administrator information identifies this as voluntary NEWEA certification, separate from mandatory NHDES wastewater-treatment certification. The state-specific label denotes NEWEA's own regional program-specific examinations, not an NH government-authored exam: its June 2026 brochure explicitly assigns exam preparation to its Sub Committee. No standardized WPI/ABC adoption or shared-class mapping is established.",
        "sources": [
          {
            "evidence": "'Certification for Collection System Operators is a voluntary program administered through the New England Water Environment Association'; identifies four grades and NEWEA's examination committee.",
            "title": "Resources  -  New Hampshire  -  NEWEA",
            "url": "https://www.newea.org/careers/professional-development/resources-new-hampshire/"
          },
          {
            "evidence": "Sections 2.1, 3.3, 6.1 and 10 establish voluntary status, OIT at Grades 1–4, and Sub Committee preparation of examinations. Its exam section supplies a four-grade Need to Know outline and describes 100 multiple-choice questions.",
            "title": "Collection Systems Certification Program  -  NEWEA, revised June 2026",
            "url": "https://www.newea.org/wp-content/uploads/2026/06/CS-BROCHURE-Rev-06_2026-1.pdf"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "NJ",
    "dedicatedCourseNeeds": [
      "A unique NJ exam course cannot yet be justified. Obtain current NJDEP/WPI per-grade exam blueprints and explicit standardized/customized status before assigning T, W, S or C grades to shared WPI courses.",
      "Supported NJ-local training alignment: Introduction to Water/Wastewater for T1/W1/S1/C1; Advanced Water for T2/W2; Advanced Wastewater for S2; Collections for C2. N.J.A.C. 7:10A-1.15 requires relevant approved advanced training for classes 2–4, subject to approved equivalent-training waivers. These are eligibility requirements, not verified exam content outlines.",
      "Keep a NJ licensing/regulatory overlay covering local T/W/S/C grade names and N.J.A.C. 7:10A examination, training and eligibility provisions. Inclusion of NJ regulations on the actual exams remains unverified.",
      "If these additional local categories are included in routing, distinguish VSWS training from T1–T4 and Industrial Wastewater training for N1–N4 from public-treatment S1–S4; neither has verified shared WPI levels."
    ],
    "limits": [
      "Four official NJDEP sources opened; no search snippets used as proof.",
      "Requested assessment date is October 3, 2026; live sources were accessed October 4, 2026. No archived October 3 snapshot was verified.",
      "The official FAQ retains older paper-exam scheduling language. It was used for local grades and course names, not current exam scheduling; the January 2023 notice supersedes remote-delivery information.",
      "ABC/WPI involvement, PSI delivery, reciprocity language and numeric local grades are not proof of standardized examinations. All four streams remain unverified, not unsupported; verifiedSharedLevels is empty throughout.",
      "The rule PDF identifies itself as a courtesy copy. State-approved course requirements do not prove that an Echelon course is approved or that those course outlines are current exam blueprints.",
      "October 8, 2026 update: Ohio and New Jersey water treatment and water distribution were re-verified directly against state-authority pages and moved from unverified to wpi-standardized. Ohio EPA hosts the WPI Class 1 Water Supply and Class 1 Water Distribution Need-to-Know Criteria on its own domain and publishes a June 2025 equivalency chart. NJDEP states its computer-based examinations run through arrangements with the Association of Boards of Certification, now WPI, delivered by PSI. Other streams for both states remain unverified."
    ],
    "name": "New Jersey",
    "streams": [
      {
        "authorityName": "New Jersey Department of Environmental Protection (NJDEP), Water & Wastewater System Operator Licensing",
        "authorityUrl": "https://dep.nj.gov/watersupply/drinking-water-systems/training-certification/water-wastewater-system-operator-licensing/",
        "examSystem": "wpi-standardized",
        "localLevels": "Public Water Treatment System: T-1, T-2, T-3, T-4 (also written T1–T4); separate Very Small Water System license: VSWS.",
        "note": "New Jersey licenses treatment operators as T-1 through T-4. NJDEP states that its computer-based examinations run through arrangements with the Association of Boards of Certification, now WPI, delivered by PSI, and candidates pay exam fees directly to PSI. The T-1 entry level is the verified shared level. NJDEP has not published a single plain statement naming the standardized form edition, and the state is migrating to WPI’s 2025 forms, so a New Jersey rules supplement should be treated as separate from the shared technical core.",
        "sources": [
          {
            "evidence": "NJDEP states: ‘This is possible through new arrangements with the Association of Boards of Certifications (ABC) and the testing service PSI that will provide computer-based testing at sites in and beyond NJ.’ It adds that exam fees are paid directly to PSI and that PSI is the primary contact for exam scheduling.",
            "title": "NJDEP  -  Water and Wastewater System Operator Licensing",
            "url": "https://dep.nj.gov/watersupply/drinking-water-systems/training-certification/water-wastewater-system-operator-licensing/"
          },
          {
            "evidence": "The Bureau of Water System Engineering administers operator licensing, exams and continuing education with the Water and Wastewater Licensing Board of Examiners.",
            "title": "NJDEP  -  Bureau of Water System Engineering",
            "url": "https://dep.nj.gov/watersupply/about/bwse/"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": [
          1
        ]
      },
      {
        "authorityName": "New Jersey Department of Environmental Protection (NJDEP), Water & Wastewater System Operator Licensing",
        "authorityUrl": "https://dep.nj.gov/watersupply/drinking-water-systems/training-certification/water-wastewater-system-operator-licensing/",
        "examSystem": "wpi-standardized",
        "localLevels": "Public Water Distribution System: W-1, W-2, W-3, W-4 (also written W1–W4).",
        "note": "New Jersey licenses distribution operators as W-1 through W-4. The same NJDEP arrangement with the Association of Boards of Certification, now WPI, and PSI delivery covers the distribution examinations. The W-1 entry level is the verified shared level. As with treatment, NJDEP has not published a single plain statement naming the standardized form edition, and a New Jersey rules supplement should be treated as separate from the shared technical core.",
        "sources": [
          {
            "evidence": "NJDEP states: ‘This is possible through new arrangements with the Association of Boards of Certifications (ABC) and the testing service PSI that will provide computer-based testing at sites in and beyond NJ.’ Effective January 6, 2023 New Jersey moved from remotely proctored exams to testing centres.",
            "title": "NJDEP  -  Water and Wastewater System Operator Licensing",
            "url": "https://dep.nj.gov/watersupply/drinking-water-systems/training-certification/water-wastewater-system-operator-licensing/"
          },
          {
            "evidence": "The Bureau of Water System Engineering administers operator licensing, exams and continuing education with the Water and Wastewater Licensing Board of Examiners.",
            "title": "NJDEP  -  Bureau of Water System Engineering",
            "url": "https://dep.nj.gov/watersupply/about/bwse/"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": [
          1
        ]
      },
      {
        "authorityName": "New Jersey Department of Environmental Protection (NJDEP), Water & Wastewater System Operator Licensing",
        "authorityUrl": "https://dep.nj.gov/watersupply/drinking-water-systems/training-certification/water-wastewater-system-operator-licensing/",
        "examSystem": "unverified",
        "localLevels": "Public Wastewater Treatment System: S-1, S-2, S-3, S-4 (also written S1–S4). Separate Industrial Wastewater Treatment System: N-1, N-2, N-3, N-4.",
        "note": "Wastewater treatment authority and grades are independently documented, not inferred from drinking water. Neither S nor N examination series is explicitly identified as standardized, customized, or state-specific in the opened sources; no shared-class mapping is established.",
        "sources": [
          {
            "evidence": "Lists 'Public Wastewater Treatment System (S License)' and 'Industrial Wastewater Treatment System (N License)' under DEP-managed licensing; the exam announcement covers water and wastewater arrangements with ABC/PSI.",
            "title": "NJDEP  -  Water & Wastewater System Operator Licensing",
            "url": "https://dep.nj.gov/watersupply/drinking-water-systems/training-certification/water-wastewater-system-operator-licensing/"
          },
          {
            "evidence": "Q1 explicitly lists S-1 through S-4 and N-1 through N-4. Q19 names Introduction to Water/Wastewater for S1, Advanced Wastewater for S2, and Industrial Wastewater for N1–N4.",
            "title": "NJDEP  -  Operator Licensing Frequently Asked Questions",
            "url": "https://dep.nj.gov/wp-content/uploads/watersupply/bwse/water-wastewater-system-operator-licensing/faqs/view-faqs.pdf"
          },
          {
            "evidence": "7:10A-1.4: examinations are prepared, conducted and scored under Department procedures with Board advice. 1.15 requires relevant advanced training for classes 2–4 and separate industrial-waste training for N applicants. These provisions do not identify exam standardization.",
            "title": "NJDEP  -  N.J.A.C. 7:10A, Licensing of Water Supply and Wastewater Treatment System Operators",
            "url": "https://dep.nj.gov/wp-content/uploads/watersupply/bwse/water-wastewater-system-operator-licensing/rules/licensing.pdf"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "New Jersey Department of Environmental Protection (NJDEP), Water & Wastewater System Operator Licensing",
        "authorityUrl": "https://dep.nj.gov/watersupply/drinking-water-systems/training-certification/water-wastewater-system-operator-licensing/",
        "examSystem": "unverified",
        "localLevels": "Public Wastewater Collection System: C-1, C-2, C-3, C-4 (also written C1–C4).",
        "note": "Collection licensing is explicitly established as its own NJDEP stream. The sources do not establish whether any C-grade exam is WPI standardized, customized, or state-specific; C1–C4 numbering alone cannot establish WPI class correspondence.",
        "sources": [
          {
            "evidence": "Explicitly lists 'Public Wastewater Collection System (C License)' within DEP-managed licensing, and links a dedicated Public Wastewater Collection Systems course outline.",
            "title": "NJDEP  -  Water & Wastewater System Operator Licensing",
            "url": "https://dep.nj.gov/watersupply/drinking-water-systems/training-certification/water-wastewater-system-operator-licensing/"
          },
          {
            "evidence": "Q1 explicitly lists C-1, C-2, C-3 and C-4. Q19 names Introduction to Water/Wastewater for C1 and Collections Course for C2.",
            "title": "NJDEP  -  Operator Licensing Frequently Asked Questions",
            "url": "https://dep.nj.gov/wp-content/uploads/watersupply/bwse/water-wastewater-system-operator-licensing/faqs/view-faqs.pdf"
          },
          {
            "evidence": "1.15 explicitly includes public wastewater collection (C) in examination eligibility and requires a relevant Department-approved advanced course for class 2, 3 or 4 applicants. It does not state standardized WPI/ABC examination use.",
            "title": "NJDEP  -  N.J.A.C. 7:10A Operator Licensing Rules",
            "url": "https://dep.nj.gov/wp-content/uploads/watersupply/bwse/water-wastewater-system-operator-licensing/rules/licensing.pdf"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "NM",
    "dedicatedCourseNeeds": [
      "Confirmed WS3 need: a New Mexico Water Supply outline, not a treatment-only class-number substitution; the guide combines treatment, distribution, wells, administration, sampling/reporting and NM regulations (20.7.4 and 20.7.10 NMAC).",
      "Confirmed DS1 need: the New Mexico DS1 outline covering distribution, mechanical systems, cross-connections, storage, safety and NM drinking-water/operator-certification regulations. Obtain DS2/DS3 outlines before extending exam-specific routing.",
      "Confirmed WW2 need: the New Mexico WW2 outline, including collection systems, ponds, pretreatment, trickling filters, solids handling, sampling/reporting, 20.7.4 and 20.6.2 NMAC, and NPDES requirements; its study resources additionally identify 20.6.8 NMAC water-reuse rules.",
      "Confirmed CS1 need: the New Mexico collection outline covering collection infrastructure, mechanical systems, math/hydraulics, safety, sampling and state/NPDES requirements. Obtain the separate CS2 outline before extending exam-specific routing.",
      "Preserve SW/SWA and SWW/SWWA as distinct local certification routes rather than assigning WPI Classes 1–4; their exam provenance was not verified in this review."
    ],
    "limits": [
      "Requested cutoff: October 3, 2026. Sources were accessed October 4, 2026; the directly examined guidebooks are dated March 2026 and state that the advisory board reviewed them in January and February 2026. Live-page content is not an archived October 3 snapshot.",
      "Research used official NMED pages and four independently opened stream-specific guidebooks, within eight source acquisitions including one repeat HTML acquisition to recover an omitted table. No search snippet was used as proof.",
      "Each state-specific classification is scoped to the expressly verified grade named in its note; other grades are unverified individually, not unsupported or proven to use the same exam system.",
      "No standardized or customized WPI/ABC exam scope was established. Certification privileges, reciprocity, delivery arrangements and matching local level numbers are not exam-equivalence evidence."
    ],
    "name": "New Mexico",
    "streams": [
      {
        "authorityName": "New Mexico Environment Department (NMED), Utility Operator Certification Program (UOCP)",
        "authorityUrl": "https://www.env.nm.gov/drinking_water/utility-operator-certification-program/",
        "examSystem": "state-specific",
        "localLevels": "Water Supply – Level 1 (WS1); Water Supply – Level 2 (WS2); Water Supply – Level 3 (WS3); Water Supply – Level 4 (WS4). Separate small-system certifications: Small Water (SW); Small Water Advanced (SWA).",
        "note": "State-specific exam authorship is directly verified for WS3, not individually for WS1, WS2, WS4, SW or SWA. Water Supply is the local treatment certification and includes distribution topics and certain lower-certification privileges. No explicit standardized WPI/ABC scope or local-to-WPI class correspondence was established; do not route by matching level numbers.",
        "sources": [
          {
            "evidence": "Page 4: ‘NMED and a panel of subject-matter experts developed the Water Supply – Level 3 (WS3) operator certification exam.’ Pages 10 and 14 identify NM certification and drinking-water regulations, including 20.7.4 and 20.7.10 NMAC. The opened document is WS3 despite the search excerpt mentioning WS1.",
            "title": "Water Supply – Level 3 (WS3): Operator Guidebook with Need to Know Criteria, March 2026",
            "url": "https://service.web.env.nm.gov/urls/fRhWprst"
          },
          {
            "evidence": "The official certification tables list Water Supply Levels 1–4 (WS1–WS4), Small Water (SW), and Small Water Advanced (SWA); NMED UOCP administers the certifications. The drinking-water guidebook table was recovered from the page HTML because the text extractor omitted it.",
            "title": "Certification Exams, Renewal and Equivalencies",
            "url": "https://www.env.nm.gov/drinking_water/certification-renewal-requirements/"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "New Mexico Environment Department (NMED), Utility Operator Certification Program (UOCP)",
        "authorityUrl": "https://www.env.nm.gov/drinking_water/utility-operator-certification-program/",
        "examSystem": "state-specific",
        "localLevels": "Water Distribution – Level 1 (DS1); Water Distribution – Level 2 (DS2); Water Distribution – Level 3 (DS3). The DS1 guidebook uses the fuller name Water Distribution System – Level 1 (DS1). No separate DS4 is listed.",
        "note": "State-specific exam authorship is directly verified for DS1; DS2 and DS3 exam provenance remains unverified individually. This is mandatory certification for the applicable systems, not evidence of a voluntary standardized track. No standardized WPI/ABC class mapping was established. The DS1 guide has an internal WD1 heading inconsistency; its cover, eligibility and exam-content sections identify DS1.",
        "sources": [
          {
            "evidence": "Page 3: ‘NMED and a panel of subject-matter experts developed the Water Distribution System – Level 1 (DS1) operator certification exam.’ Page 1 says DS1 certification is required under 20.7.4.12(B) NMAC; page 6 includes NM certification and drinking-water regulations.",
            "title": "Water Distribution System – Level 1 (DS1): Operator Guidebook with Need to Know Criteria, March 2026",
            "url": "https://service.web.env.nm.gov/urls/CqUPMDFn"
          },
          {
            "evidence": "The official drinking-water certification table lists Water Distribution Levels 1–3 (DS1–DS3); its requirements table also lists Distribution Systems 1, 2 and 3, with no DS4.",
            "title": "Certification Exams, Renewal and Equivalencies",
            "url": "https://www.env.nm.gov/drinking_water/certification-renewal-requirements/"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "New Mexico Environment Department (NMED), Utility Operator Certification Program (UOCP)",
        "authorityUrl": "https://www.env.nm.gov/drinking_water/utility-operator-certification-program/",
        "examSystem": "state-specific",
        "localLevels": "Public Wastewater Facility – Level 1 (WW1); Public Wastewater Facility – Level 2 (WW2); Public Wastewater Facility – Level 3 (WW3); Public Wastewater Facility – Level 4 (WW4). Separate small-system certifications: Small Wastewater (SWW); Small Wastewater Advanced (SWWA).",
        "note": "State-specific exam authorship is directly verified for WW2; WW1, WW3, WW4, SWW and SWWA exam provenance remains unverified individually. WW2 includes collection-system content and carries CS1/CS2 operating privileges, but those privileges do not establish exam equivalence. No standardized WPI/ABC scope or class correspondence was established.",
        "sources": [
          {
            "evidence": "Page 4: ‘NMED and a panel of subject-matter experts developed the Public Wastewater Facility – Level 2 (WW2) operator certification exam.’ Page 9 explicitly includes 20.7.4 NMAC, 20.6.2 NMAC and NPDES permit requirements; page 1 separately describes WW2 operating privileges.",
            "title": "Public Wastewater Facility – Level 2 (WW2): Operator Guidebook with Need-to-Know Criteria, March 2026",
            "url": "https://service.web.env.nm.gov/urls/yYrWpQLC"
          },
          {
            "evidence": "The wastewater certification table lists Public Wastewater Facility Levels 1–4 (WW1–WW4), Small Wastewater and Small Wastewater Advanced. It identifies March 2026 WW guidebooks; small-wastewater guidebooks are marked ‘in development.’",
            "title": "Certification Exams, Renewal and Equivalencies",
            "url": "https://www.env.nm.gov/drinking_water/certification-renewal-requirements/"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "New Mexico Environment Department (NMED), Utility Operator Certification Program (UOCP)",
        "authorityUrl": "https://www.env.nm.gov/drinking_water/utility-operator-certification-program/",
        "examSystem": "state-specific",
        "localLevels": "Wastewater Collection System – Level 1 (CS1); Wastewater Collection System – Level 2 (CS2). No separate CS3 or CS4 is listed.",
        "note": "State-specific exam authorship is directly verified for CS1; CS2 exam provenance remains unverified individually. The CS1 guide identifies certification required for applicable collection systems. No standardized WPI/ABC scope or correspondence between CS1/CS2 and WPI classes was established.",
        "sources": [
          {
            "evidence": "Page 3: ‘NMED and a panel of subject-matter experts developed the Wastewater Collection System – Level 1 (CS1) operator certification exam.’ Page 1 cites required certification under 20.7.4.13(B) NMAC; page 6 includes 20.7.4 NMAC, 20.6.2 NMAC and NPDES permit requirements.",
            "title": "Wastewater Collection System – Level 1 (CS1): Operator Guidebook with Need to Know Criteria, March 2026",
            "url": "https://service.web.env.nm.gov/urls/vBzFrpJV"
          },
          {
            "evidence": "The official wastewater certification table lists only Wastewater Collection System Levels 1 and 2 (CS1 and CS2), with separate March 2026 guidebooks.",
            "title": "Certification Exams, Renewal and Equivalencies",
            "url": "https://www.env.nm.gov/drinking_water/certification-renewal-requirements/"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "NY",
    "dedicatedCourseNeeds": [
      "Drinking-water local-grade/regulatory overlay: use 10 NYCRR Subpart 5-4 and its IA/IIA, IB/IIB, C and D classifications; obtain NYSDOH-validated exam outlines and provenance before selecting unique-exam versus shared-WPI preparation routes.",
      "Wastewater treatment: retain separate A (activated-sludge) and non-A grade routes and their distinct NYWEA-linked exam resources. Obtain explicit standardized/customized confirmation and any New York-specific outline before assigning dedicated exam courses.",
      "Voluntary collection track: NYWEA requires four-hour confined-space awareness covering OSHA 29 CFR 1910.146 topics, Collection Systems O&M Volume 1 for all grades, Volume 2 for Grades 2–4, and supervision training for Grades 3–4. These local certification-training requirements are separate from proving a unique exam."
    ],
    "limits": [
      "Public sources were accessed October 4, 2026 for the requested October 3, 2026 cutoff. No archived cutoff-day snapshot was verified; referenced dated exam changes precede that cutoff.",
      "Exploration capped at eight source opens, all official NYSDOH/NYSDEC or state-designated NYWEA sources. Linked WPI need-to-know PDFs were not opened; their grade-to-class link labels were observed on NYWEA pages.",
      "Unverified means exam provenance or standardized/customized status was not established, not that certification is unsupported or unavailable. ABC branding, study-resource links, PSI delivery and reciprocity were not treated as standardized-exam proof."
    ],
    "name": "New York",
    "streams": [
      {
        "authorityName": "New York State Department of Health (NYSDOH), Bureau of Water Supply Protection",
        "authorityUrl": "https://www.health.ny.gov/environmental/water/drinking/operate/operate.htm",
        "examSystem": "unverified",
        "localLevels": "Grade IA; Grade IIA; Grade IB; Grade IIB; Grade C",
        "note": "NYSDOH requires validated examinations, but the opened sources do not identify their developer or establish standardized WPI, customized ABC, or independently state-developed exams. Do not map these local grades to WPI Classes I–IV. IA/IIA concern filtration plants; IB/IIB concern plants without clarification; C includes basic treatment serving 1,000 people or fewer.",
        "sources": [
          {
            "evidence": "Table 5-4.2 identifies treatment classifications IA, IIA, IB, IIB and C. Upon approval, 'the Department will issue a certificate that specifies the operator grade.'",
            "title": "Section 5-4.2  -  Certification required",
            "url": "https://regs.health.ny.gov/content/section-5-42-certification-required"
          },
          {
            "evidence": "'Anyone applying for certification must pass a written, oral and/or practical skills validated examination.' This establishes an examination requirement, not its standardized WPI status.",
            "title": "Operator Certification Program  -  Information Sheet",
            "url": "https://www.health.ny.gov/environmental/water/drinking/operate/opcertfs.htm"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "New York State Department of Health (NYSDOH), Bureau of Water Supply Protection",
        "authorityUrl": "https://www.health.ny.gov/environmental/water/drinking/operate/operate.htm",
        "examSystem": "unverified",
        "localLevels": "Grade C; Grade D",
        "note": "Grade C applies to distribution serving 1,000 people or fewer; Grade D applies above 1,000 people and/or purchasing-water systems with distribution-only responsibility. C also covers some treatment systems. Validated exams are required, but exam provenance and standardized WPI equivalence remain unverified; treatment certificates must not automatically be treated as distribution credentials.",
        "sources": [
          {
            "evidence": "Section (a)(5): 'The only grades certified to operate distribution systems are Grade C' for systems serving 1,000 people or less, and 'Grade D' for larger and/or distribution-only purchasing-water systems.",
            "title": "Section 5-4.2  -  Certification required",
            "url": "https://regs.health.ny.gov/content/section-5-42-certification-required"
          },
          {
            "evidence": "The program requires a 'written, oral and/or practical skills validated examination'; it does not expressly name standardized WPI/ABC distribution exams.",
            "title": "Operator Certification Program  -  Information Sheet",
            "url": "https://www.health.ny.gov/environmental/water/drinking/operate/opcertfs.htm"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "New York State Department of Environmental Conservation (NYSDEC), appointing/regulatory authority; New York Water Environment Association (NYWEA), designated certification administrator",
        "authorityUrl": "https://dec.ny.gov/environmental-protection/water/water-quality/wastewater-treatment-resources/plant-operation/operator-certification",
        "examSystem": "unverified",
        "localLevels": "Grade 1; Grade 1A; Grade 2; Grade 2A; Grade 3; Grade 3A; Grade 4; Grade 4A",
        "note": "Mandatory WWTP certification. ABC/WPI exams are confirmed, but standardized versus customized scope is not explicit in the opened authority/administrator documents. NYWEA maps non-A Grades 1–4 to 2022 WPI Treatment Class I–IV resources and A Grades 1A–4A to separate 2025 Class 1–4 resources effective September 1, 2025. That resource correspondence alone is insufficient to verify shared levels; preserve activated-sludge and non-activated-sludge variants separately.",
        "sources": [
          {
            "evidence": "'There are four levels of activated sludge certification (Grades 1A - 4A) and four levels of non-activated sludge certification (Grades 1 - 4).' NYWEA administers certification; DEC retains regulatory responsibilities. 'New York State uses an Association of Boards of Certification (ABC) Exam.'",
            "title": "Wastewater Operator Certification  -  NYSDEC",
            "url": "https://dec.ny.gov/environmental-protection/water/water-quality/wastewater-treatment-resources/plant-operation/operator-certification"
          },
          {
            "evidence": "NYWEA has been 'designated as the official administrator' since 2011; DEC is 'the appointing authority.' Exam Resources separately label Grade 1–4 Class I–IV links and NEW Grade 1A–4A Class 1–4 links effective 9/1/2025. The page does not explicitly call the NY exams standardized or customized.",
            "title": "Wastewater Operator Certification  -  NYWEA",
            "url": "https://nywea.org/operator-certification/certification/"
          },
          {
            "evidence": "Candidates select from 'eight New York Wastewater Treatment Grade exams'; ABC was rebranded WPI, 'however, the exams will continue to be called ABC exams.' Neither statement establishes standardized exam scope.",
            "title": "New York State Wastewater Operator Computerized Certification Examination Information  -  March 10, 2026",
            "url": "https://nywea.org/wp-content/uploads/2026/08/NYS-Wastewater-Computerized-Exam-Information-3.10.2026.pdf"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "New York Water Environment Association (NYWEA), voluntary collection-system certification program",
        "authorityUrl": "https://nywea.org/operator-certification/voluntary-collections/",
        "examSystem": "unverified",
        "localLevels": "Grade 1; Grade 2; Grade 3; Grade 4",
        "note": "NYWEA offers voluntary collection certification, distinct from mandatory DEC WWTP certification. Its page confirms ABC exams and links local Grades 1–4 to WPI Collection Class 1–4 resources effective September 15, 2025, but does not explicitly identify standardized versus customized exams. Consequently no shared levels are verified.",
        "sources": [
          {
            "evidence": "'All applicants for voluntary collection system certification in New York State' need education, collections experience and training 'to be qualified to take the ABC certification exam.' Classification and training tables identify Grades 1–4; grade-labeled resources link to WPI Collection Class 1–4 PDFs, effective 9/15/2025.",
            "title": "Voluntary Collection System Certification Program  -  NYWEA",
            "url": "https://nywea.org/operator-certification/voluntary-collections/"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "NC",
    "dedicatedCourseNeeds": [
      "Water treatment: retain separate C/B/A-Surface and D/C/B/A-Well preparation routes, corresponding Board-approved school requirements and North Carolina public drinking-water rules; do not relabel them as WPI Classes I-IV.",
      "Water distribution: retain D/C/B/A-Distribution preparation and local distribution obligations; address Board-approved trench-shoring requirements where applicable. Keep Cross-Connection Control certification separate.",
      "Wastewater treatment: align preparation to NC type-and-grade Needs to Know for WW1-WW4 and PC1-PC2, 08G operator requirements and the official exam formula sheet. SI, SS and LA require separate ungraded specialty routes if included in the catalog.",
      "Wastewater collection: use a separate CS1-CS4 route aligned to corresponding NC Needs to Know/school requirements, 08G certification requirements and the state's identified 02T collection-system regulations.",
      "These are supported NC-local curriculum needs, not proof of unique exam authorship. Confirm each examination contract/version and any grade correspondence with the relevant certifying authority before assigning shared WPI courses."
    ],
    "limits": [
      "As-of target: October 3, 2026. Live official sources were accessed October 4, 2026; no archived October 3 snapshot was established.",
      "Exploration stopped at eight source opens, including one failed OAH water-rule extraction. No search snippets were used as proof.",
      "The current OAH 18D HTML endpoint returned no extractable content. Water grade names and detailed rule provisions rely on the 2018 compilation still linked by DEQ's FAQ; subsequent amendments were not independently verified.",
      "All four exam systems remain unverified, not unsupported or not offered. State administration, local regulatory content and grade-specific NTKs do not by themselves establish state authorship or distinguish standardized from customized ABC examinations.",
      "No explicit standardized WPI/ABC scope plus local-grade/WPI-class correspondence was established for any stream; all verifiedSharedLevels arrays are therefore empty. Reciprocity references were not treated as exam-system proof."
    ],
    "name": "North Carolina",
    "streams": [
      {
        "authorityName": "Water Treatment Facility Operators Board of Certification (WTFOCB), North Carolina Department of Environmental Quality",
        "authorityUrl": "https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/ByChapter/Chapter_90A.html",
        "examSystem": "unverified",
        "localLevels": "Grade C-Surface, Grade B-Surface, Grade A-Surface; Grade D-Well, Grade C-Well, Grade B-Well, Grade A-Well.",
        "note": "Separate surface-water and well-water ladders, not a single four-class ladder. Official evidence establishes state administration, NC drinking-water-rule content and an examination designed for the applicant's local class, but does not explicitly identify standardized WPI/ABC, customized ABC, or independently state-developed examinations. No WPI class correspondence verified. Grade names come from the DEQ-linked 2018 rule compilation; current codification could not be extracted.",
        "sources": [
          {
            "evidence": "Sections 90A-20.1 and 90A-21 identify the Water Treatment Facility Operators Board of Certification within DEQ; section 90A-24 assigns it certification requirements and examination procedures.",
            "title": "North Carolina General Statutes, Chapter 90A, Article 2",
            "url": "https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/ByChapter/Chapter_90A.html"
          },
          {
            "evidence": "'The examinations are administered by the State'; exam subjects include 'North Carolina public drinking water rules.' These statements establish administration/content, not examination authorship or WPI standardization.",
            "title": "DW Operator Certification: FAQs",
            "url": "https://www.deq.nc.gov/about/divisions/water-resources/operator-certification/drinking-water-operator-certification/dw-operator-certification-faqs"
          },
          {
            "evidence": "Rule .0201 lists C/B/A-Surface and D/C/B/A-Well with corresponding Board-approved schools; .0202 requires 'an examination designed for the class of certification for which the applicant is applying.'",
            "title": "Rules Governing Water Treatment Facility Operators  -  15A NCAC 18D (2018 compilation)",
            "url": "https://files.nc.gov/ncdeq/Water+Quality/Operator_Certification_Files/DW_Files/18D_2018.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Water Treatment Facility Operators Board of Certification (WTFOCB), North Carolina Department of Environmental Quality",
        "authorityUrl": "https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/ByChapter/Chapter_90A.html",
        "examSystem": "unverified",
        "localLevels": "Grade D-Distribution, Grade C-Distribution, Grade B-Distribution, Grade A-Distribution. Separate related certification: Grade Cross-Connection Control (CC), not a fifth distribution grade.",
        "note": "Distribution is explicitly addressed in the water-operator statute and rules; it is not inferred solely from treatment evidence. Rule .0206(c) requires certified distribution operators in responsible charge for community/non-transient non-community systems, subject to specified small-system exemptions and D-system alternatives. Standardized versus customized ABC versus state-developed exam remains unverified; D/C/B/A must not be translated into WPI I/II/III/IV without explicit correspondence.",
        "sources": [
          {
            "evidence": "Section 90A-32 gives the Board authority over certification of personnel operating the distribution portion of a water treatment facility; the statute permits voluntary or mandatory programs, while the implementing rule specifies actual obligations.",
            "title": "North Carolina General Statutes, Chapter 90A, Article 2",
            "url": "https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/ByChapter/Chapter_90A.html"
          },
          {
            "evidence": "Rule .0201(8)-(12) lists D/C/B/A-Distribution and separate Cross-Connection Control; .0206(c) specifies distribution ORC certification requirements and exceptions. C-Distribution and specified B-Distribution pathways require Board-approved trench-shoring training.",
            "title": "Rules Governing Water Treatment Facility Operators  -  15A NCAC 18D",
            "url": "https://files.nc.gov/ncdeq/Water+Quality/Operator_Certification_Files/DW_Files/18D_2018.pdf"
          },
          {
            "evidence": "The state-administered exam subject list explicitly includes 'distribution system operation,' backflow prevention, hydraulics, pumping and storage; it does not identify a standardized WPI distribution exam.",
            "title": "DW Operator Certification: FAQs",
            "url": "https://www.deq.nc.gov/about/divisions/water-resources/operator-certification/drinking-water-operator-certification/dw-operator-certification-faqs"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Water Pollution Control System Operators Certification Commission (WPCSOCC), North Carolina Department of Environmental Quality",
        "authorityUrl": "https://www.deq.nc.gov/about/divisions/water-resources/operator-certification/wastewater-operator-certification",
        "examSystem": "unverified",
        "localLevels": "Biological Grade 1 (WW1), Grade 2 (WW2), Grade 3 (WW3), Grade 4 (WW4); Physical/Chemical Grade 1 (PC1), Grade 2 (PC2). Additional ungraded specialties: Surface Irrigation (SI), Subsurface (SS), Land Application (LA).",
        "note": "Biological and physical/chemical certifications are distinct tracks; SI, SS and LA are additional specialties, not numbered biological grades. Official pages establish type-and-grade Needs to Know and Commission examinations, but do not explicitly establish standardized WPI/ABC scope, customized ABC use, or state examination authorship. Biological grades numbered 1-4 alone do not prove equivalence to WPI Classes I-IV. OIT is a certification status, not another grade.",
        "sources": [
          {
            "evidence": "'The Water Pollution Control System Operators Certification Commission (WPCSOCC) is responsible for examination and certification'; certification requires an exam 'based on the Needs to Know for that type and grade of operator.'",
            "title": "Wastewater Operator Certification",
            "url": "https://www.deq.nc.gov/about/divisions/water-resources/operator-certification/wastewater-operator-certification"
          },
          {
            "evidence": "Lists Biological WW1-WW4, Physical/Chemical PC1-PC2, LA, SI and SS separately; instructs LA/SI/SS applicants to choose N/A for grade. Links type/grade NTKs and states the supplied official math formula sheet is the only formula sheet usable at the exam.",
            "title": "WW and AW Operator Exam Information",
            "url": "https://www.deq.nc.gov/about/divisions/water-resources/operator-certification/wastewater-operator/ww-and-aw-operator-exam-information"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Water Pollution Control System Operators Certification Commission (WPCSOCC), North Carolina Department of Environmental Quality",
        "authorityUrl": "https://www.deq.nc.gov/about/divisions/water-resources/operator-certification/wastewater-operator-certification",
        "examSystem": "unverified",
        "localLevels": "Collections Grade 1 (CS1), Grade 2 (CS2), Grade 3 (CS3), Grade 4 (CS4).",
        "note": "Collections is expressly listed as its own Commission certification and examination track, independently of drinking-water and wastewater-treatment evidence. Corresponding certification schools and progression requirements apply. No explicit standardized WPI/ABC collection-exam scope or CS-to-WPI class correspondence was found in the opened official sources; customized versus state-developed examinations likewise remain unverified.",
        "sources": [
          {
            "evidence": "Identifies WPCSOCC as the examination/certification authority, separately lists COLLECTIONS (CS), and states exams follow the Needs to Know for each type and grade.",
            "title": "Wastewater Operator Certification",
            "url": "https://www.deq.nc.gov/about/divisions/water-resources/operator-certification/wastewater-operator-certification"
          },
          {
            "evidence": "Explicitly lists Collections CS1, CS2, CS3 and CS4 and corresponding training-school requirements; cites eligibility rules 15A NCAC 08G .0401-.0409 and .0501.",
            "title": "WW and AW Operator Exam Information",
            "url": "https://www.deq.nc.gov/about/divisions/water-resources/operator-certification/wastewater-operator/ww-and-aw-operator-exam-information"
          },
          {
            "evidence": "Identifies 15A NCAC 08G operator requirements and separately links 'Collection Systems: 15A NCAC 02T .0300' under other regulations affecting operators.",
            "title": "Wastewater Operator Rules (08G)",
            "url": "https://www.deq.nc.gov/about/divisions/water-resources/operator-certification/wastewater-operator/wastewater-operator-rules-08g"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "ND",
    "dedicatedCourseNeeds": [
      "North Dakota-specific grade and regulatory routing for all four streams: preserve Grade IA separately from I–IV; use NDAC 33.1-19 and NDCC 23.1-07 rather than assuming WPI class equivalence.",
      "Separate orientation for the confirmed distribution IA restricted, system-specific open-book booklet pathway and its experience-to-standard-certificate transition; do not route it as a generic WPI Class I exam.",
      "Wastewater-treatment III/IV preparation needs review against NDDEQ's published outline, including NPDES discharge, self-monitoring/reporting, management responsibility and plans/specifications. Revalidate the 2020 outline before treating it as a current blueprint.",
      "Wastewater-collection IA/I/II preparation needs review against NDDEQ's own outline, including sewer hydraulics, lift stations, trenching/confined-space hazards, plans/specifications and Ten States standards. Revalidate the 2020 outline before course development.",
      "The official training page lists separate IA/I/II and III/IV study-guide groupings for each stream; confirm current outlines and actual exam-bank adoption with NDDEQ before deciding whether complete unique-exam courses or only state-specific supplements are needed."
    ],
    "limits": [
      "Assessment cutoff: October 3, 2026. Eight official sources were opened; search snippets and commercial preparation claims were not used as proof.",
      "No opened source explicitly establishes current standardized WPI/ABC scope plus North Dakota grade-to-WPI-class correspondence. All verifiedSharedLevels therefore remain empty; unverified does not mean the exams are not offered or conclusively non-WPI.",
      "The 2026 annual report's exam narrative concerns drinking water. Wastewater conclusions rely independently on four-stream rules and stream-specific study guides; its legislative appendix supports statewide authority and exemptions, not wastewater exam-bank identity.",
      "Third-party authorization and a discussed migration do not establish provider, standardized versus customized product, grade scope, or implementation date. The report describes January 2027 operational changes, which are not treated as completed by this cutoff.",
      "Undated live pages cannot establish every historical change date. Linked study guides are dated December 2020; the requirements bulletin contains legacy administrative details. Current amended rules were prioritized for grade names, and no pass/coverage claims are made."
    ],
    "name": "North Dakota",
    "streams": [
      {
        "authorityName": "North Dakota Department of Environmental Quality, Division of Municipal Facilities  -  Operator Certification and Training",
        "authorityUrl": "https://deq.nd.gov/MF/OperatorCertification/",
        "examSystem": "unverified",
        "localLevels": "Grade IA, Grade I, Grade II, Grade III, Grade IV; corresponding facility Classes IA, I, II, III, IV.",
        "note": "Certification and local grades are verified. The July 2026 report documents North Dakota's exam-review process and state-administered examinations, but does not explicitly identify the current exam bank as state-specific, standardized WPI/ABC, or customized ABC. Its appended September 2025 minutes describe ABC testing exploration as ongoing; third-party examination authority/planning is not proof of adoption. No local-grade-to-WPI-class correspondence established.",
        "sources": [
          {
            "evidence": "Pages 6–7: a North Dakota group evaluates exam changes and validates questions; NDDEQ staff conducted examinations. Page 40: 'Exploration of ABC testing – Ongoing.' Page 42 discusses a move to third-party examination services without identifying an adopted exam product.",
            "title": "North Dakota Operator Certification Program  -  2026 Annual Report to EPA",
            "url": "https://deq.nd.gov/Publications/mf/North%20Dakota%20Operator%20Certification%20Program%202026.pdf"
          },
          {
            "evidence": "Section 11 establishes five operator grades for each of the four streams; section 12 names Grade IA, I, II, III and IV. Section 05 requires separate examinations for each facility/system classification, but names no exam bank.",
            "title": "NDAC Chapter 33.1-19-01, amended effective April 1, 2026",
            "url": "https://www.legis.nd.gov/information/acdata/pdf/33.1-19-01.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "North Dakota Department of Environmental Quality, Division of Municipal Facilities  -  Operator Certification and Training",
        "authorityUrl": "https://deq.nd.gov/MF/OperatorCertification/",
        "examSystem": "unverified",
        "localLevels": "Grade IA, Grade I, Grade II, Grade III, Grade IV; corresponding distribution-and-storage Classes IA, I, II, III, IV. A restricted water distribution 1A certificate is an alternative IA pathway, not a sixth regular grade.",
        "note": "The alternative IA open-book booklet is explicitly a North Dakota, system-specific pathway. The ordinary IA–IV exam-bank identity remains unverified, so the whole stream cannot safely be labeled standardized, customized, or wholly state-specific. No WPI class mapping verified.",
        "sources": [
          {
            "evidence": "Page 8 describes an EPA-approved open-book exam booklet for distribution systems under 500: returned to the Department for grading, yielding a six-month restricted distribution 1A certificate limited to the operator's system; after satisfying experience, a standard 1A certificate is issued. Pages 7 and 40 document local exam review and ongoing ABC exploration, not standardized adoption.",
            "title": "North Dakota Operator Certification Program  -  2026 Annual Report to EPA",
            "url": "https://deq.nd.gov/Publications/mf/North%20Dakota%20Operator%20Certification%20Program%202026.pdf"
          },
          {
            "evidence": "Section 08.1 names distribution-and-storage Classes IA, I, II, III and IV; sections 11–12 establish and name the five operator grades. Section 05 permits department-designated third-party grading but identifies no provider or standardized exam.",
            "title": "NDAC Chapter 33.1-19-01, amended effective April 1, 2026",
            "url": "https://www.legis.nd.gov/information/acdata/pdf/33.1-19-01.pdf"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "North Dakota Department of Environmental Quality, Division of Municipal Facilities  -  Operator Certification and Training",
        "authorityUrl": "https://deq.nd.gov/MF/OperatorCertification/",
        "examSystem": "unverified",
        "localLevels": "Grade IA, Grade I, Grade II, Grade III, Grade IV; corresponding wastewater-treatment facility Classes IA, I, II, III, IV.",
        "note": "Wastewater treatment is independently confirmed, not inferred from drinking-water exam evidence. State-issued study outlines exist, but neither they nor current rules explicitly establish the current exam bank as standardized WPI/ABC, customized ABC, or exclusively state-written. Grade IA nonmechanical facilities under 500 population equivalent are exempt from mandatory certification; certification remains available voluntarily.",
        "sources": [
          {
            "evidence": "Section 09 separately classifies wastewater-treatment facilities IA–IV, with IA covering nonmechanical treatment under 500 population equivalent. Sections 11–12 establish five grades; section 05 requires separate classification examinations without identifying their bank.",
            "title": "NDAC Chapter 33.1-19-01, amended effective April 1, 2026",
            "url": "https://www.legis.nd.gov/information/acdata/pdf/33.1-19-01.pdf"
          },
          {
            "evidence": "Dated 12/15/2020: 'The outlined topics indicate the general subjects which are the basis for examination questions.' Includes treatment processes, sampling, safety, NPDES permit stipulations and recordkeeping; does not identify WPI/ABC exams.",
            "title": "Study Guide for Grade III and IV Wastewater Treatment Plant Operators",
            "url": "https://deq.nd.gov/Publications/MF/OperatorTrainingGuides/SG-WWT-III-and-IV.wpd.pdf"
          },
          {
            "evidence": "Names NDDEQ Division of Municipal Facilities as implementing authority. Wastewater section exempts stabilization ponds/other nonmechanical treatment serving fewer than 500 population equivalent and says operators can choose to become certified.",
            "title": "System Requirements for Employing Certified Water and Wastewater Operators",
            "url": "https://deq.nd.gov/Publications/MF/SystemRequirementsForEmployingCertifiedOperators.pdf?v=3"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "North Dakota Department of Environmental Quality, Division of Municipal Facilities  -  Operator Certification and Training",
        "authorityUrl": "https://deq.nd.gov/MF/OperatorCertification/",
        "examSystem": "unverified",
        "localLevels": "Grade IA, Grade I, Grade II, Grade III, Grade IV; corresponding wastewater-collection-and-transfer Classes IA, I, II, III, IV.",
        "note": "Collection certification and its five grades are independently verified. The collection-specific state study guide identifies examination subjects but not the current question-bank supplier or standardized/customized status. Collection systems below 500 population equivalent are exempt from mandatory certification under NDCC 23.1-07-07; the IA certification route is nevertheless offered. No WPI correspondence verified.",
        "sources": [
          {
            "evidence": "Section 09.1 explicitly names collection-and-transfer Classes IA, I, II, III and IV; IA serves fewer than 500 persons. Sections 11–12 establish the same five operator grades; section 05 names no exam bank.",
            "title": "NDAC Chapter 33.1-19-01, amended effective April 1, 2026",
            "url": "https://www.legis.nd.gov/information/acdata/pdf/33.1-19-01.pdf"
          },
          {
            "evidence": "Dated 12/15/2020: outline subjects are 'the basis for examination questions.' Includes sewer hydraulics, design/installation, lift stations, safety, plans/specifications and Recommended Standards for Sewage Works; no standardized WPI/ABC scope stated.",
            "title": "Study Guide for Grade IA, I & II Wastewater Collection System Operators",
            "url": "https://deq.nd.gov/Publications/MF/OperatorTrainingGuides/SG-WWC-IA-I-and-II.wpd.pdf"
          },
          {
            "evidence": "Appendix E reproduces NDCC 23.1-07-07: operators of wastewater collection systems and nonmechanical wastewater treatment serving fewer than 500 population equivalent are excluded from mandatory certification. NDCC 23.1-07-06 authorizes department or third-party exam preparation but does not identify an adopted exam product.",
            "title": "North Dakota Operator Certification Program  -  2026 Annual Report to EPA, Appendix E",
            "url": "https://deq.nd.gov/Publications/mf/North%20Dakota%20Operator%20Certification%20Program%202026.pdf"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "OH",
    "dedicatedCourseNeeds": [
      "Separate Class A Water Supply/Very Small Water System preparation from numbered treatment classes. Ohio EPA links dedicated Class A water training; its WPI handbook identifies a distinct Class A examination.",
      "Separate Class A Water Reclamation/Small Wastewater Treatment preparation from numbered treatment classes. Ohio EPA links a Class A wastewater training manual expressly usable for exam preparation; its WPI handbook identifies a distinct Class A examination.",
      "Provide distinct Ohio Class IV Water Supply and Water Reclamation/Wastewater Treatment preparation rather than routing either to WPI Class IV. Ohio EPA excludes local Class IV from WPI and links its own policy/guidance/examination and discipline-specific review checklists; those linked documents' contents were not opened.",
      "Add Ohio certification-rule/application orientation using the required Professional Operator Certification Training, updated April 15, 2025. Mandatory review is an administrative requirement, not proof of a separate Ohio-law exam section.",
      "Keep local-class routing metadata separate from shared-course eligibility: the June 2025 direct Ohio program and optional C2EP program use different grade correspondences, especially collection. Confirm the applicable Ohio exam outline and standardized/customized status before assigning a shared WPI course."
    ],
    "limits": [
      "As-of target: October 3, 2026. Live official sources were retrieved October 4, 2026; an archived October 3 snapshot was not established.",
      "Eight source URLs were opened, within the requested cap. Conclusions use opened state-authority or designated-administrator content, not search snippets.",
      "All verifiedSharedLevels are empty because explicit Ohio-specific standardized WPI/ABC scope was not established. This means unverified, not that standardized examinations are unsupported or unavailable.",
      "WPI's opened Historical Need-to-Know Criteria page explicitly describes standardized exams for all four streams but directs candidates to their certifying authority to determine applicable materials. It does not establish that Ohio's direct program uses those exams: https://gowpi.org/services/abc-testing/need-to-know-criteria/.",
      "The January 2024 Ohio WPI/PSI handbook confirms separate Class A exams but does not identify standardized versus customized status: https://epa.ohio.gov/static/Portals/28/documents/opcert/WPI-OH-Handbook%20Jan%202024%20new.pdf. Provider approval, PSI delivery and optional dual-certification acceptance were not treated as standardized-exam proof.",
      "The March 2023 eligibility factsheet has older OIT details that differ from the live exam page; only its stream/class and authority evidence was used. No mandatory-versus-voluntary collection staffing requirement was established; the optional C2EP designation is expressly voluntary.",
      "October 8, 2026 update: Ohio and New Jersey water treatment and water distribution were re-verified directly against state-authority pages and moved from unverified to wpi-standardized. Ohio EPA hosts the WPI Class 1 Water Supply and Class 1 Water Distribution Need-to-Know Criteria on its own domain and publishes a June 2025 equivalency chart. NJDEP states its computer-based examinations run through arrangements with the Association of Boards of Certification, now WPI, delivered by PSI. Other streams for both states remain unverified."
    ],
    "name": "Ohio",
    "streams": [
      {
        "authorityName": "Ohio Environmental Protection Agency (Ohio EPA), Division of Drinking and Ground Waters, Operator Certification Unit",
        "authorityUrl": "https://epa.ohio.gov/divisions-and-offices/drinking-and-ground-waters/certified-operators",
        "examSystem": "wpi-standardized",
        "localLevels": "Water Supply: Class A, Class I, Class II, Class III, Class IV",
        "note": "Ohio calls treatment ‘Water Supply’. Ohio EPA publishes the WPI standardized Class 1, 2 and 3 Water Supply Need-to-Know Criteria on its own domain under the heading ‘WPI Need to Know Criteria’, and its June 2025 equivalency chart maps Ohio Water Supply 1, 2 and 3 to the matching WPI classes. Class IV is expressly excluded from the WPI route and keeps a separate Ohio EPA examination. Class A corresponds to Very Small Water System, not a numbered WPI class. All applicants must review the Ohio EPA Professional Operator Certification Training document, which is an administrative requirement, not a separate Ohio-law exam section.",
        "sources": [
          {
            "evidence": "Ohio EPA states: ‘As an alternative to Ohio EPA’s paper and pencil examination, Ohio EPA has approved the Water Professionals International (WPI), formerly the Association of Boards of Certification (ABC), as an approved examination provider. Operators may now choose to take WPI examinations and then seek Ohio certification for all levels of certification except Class IV.’",
            "title": "Ohio EPA  -  Exam information",
            "url": "https://epa.ohio.gov/divisions-and-offices/drinking-and-ground-waters/certified-operators/exam-information"
          },
          {
            "evidence": "Ohio EPA’s equivalency chart maps Ohio Water Supply 1 to WPI Water Supply 1, 2 to 2 and 3 to 3, and Class A to Very Small Water System.",
            "title": "Ohio EPA/WPI Professional Operator Exam Equivalency Chart  -  revised June 2025",
            "url": "https://epa.ohio.gov/static/Portals/28/documents/opcert/ABC-EEC.pdf"
          },
          {
            "evidence": "Under the heading ‘WPI Need to Know Criteria’, Ohio EPA hosts the Class 1 Water Supply outline on its own domain, alongside Class 2 and Class 3.",
            "title": "WPI Water Treatment Class 1 Need-to-Know Criteria, hosted by Ohio EPA",
            "url": "https://dam.assets.ohio.gov/image/upload/epa.ohio.gov/Portals/28/documents/opcert/WPI-WaterTreatment-Class-1.pdf"
          },
          {
            "evidence": "Exams are delivered through PSI at Ohio locations including Cleveland, Cincinnati, Columbus, Akron, Cambridge, Troy and Toledo, and may be taken outside Ohio.",
            "title": "WPI Ohio EPA certification information page",
            "url": "https://www.gowpi.org/certification/ohio-epa-certification/"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": [
          1,
          2,
          3
        ]
      },
      {
        "authorityName": "Ohio Environmental Protection Agency (Ohio EPA), Division of Drinking and Ground Waters, Operator Certification Unit",
        "authorityUrl": "https://epa.ohio.gov/divisions-and-offices/drinking-and-ground-waters/certified-operators",
        "examSystem": "wpi-standardized",
        "localLevels": "Water Distribution: Class I, Class II",
        "note": "Ohio EPA hosts the WPI standardized Class 1 and Class 2 Water Distribution Need-to-Know Criteria on its own domain under the heading ‘WPI Need to Know Criteria’. Only Class 1 and Class 2 distribution outlines are published there, so no higher distribution class is verified. Ohio EPA notes that the title on WPI’s criteria may differ from the Ohio certificate level, and the correct WPI test is selected once the candidate chooses the Ohio EPA certificate level in the test provider site.",
        "sources": [
          {
            "evidence": "Ohio EPA states: ‘As an alternative to Ohio EPA’s paper and pencil examination, Ohio EPA has approved the Water Professionals International (WPI), formerly the Association of Boards of Certification (ABC), as an approved examination provider. Operators may now choose to take WPI examinations and then seek Ohio certification for all levels of certification except Class IV.’",
            "title": "Ohio EPA  -  Exam information",
            "url": "https://epa.ohio.gov/divisions-and-offices/drinking-and-ground-waters/certified-operators/exam-information"
          },
          {
            "evidence": "Ohio EPA’s equivalency chart maps Ohio Water Supply 1 to WPI Water Supply 1, 2 to 2 and 3 to 3, and Class A to Very Small Water System.",
            "title": "Ohio EPA/WPI Professional Operator Exam Equivalency Chart  -  revised June 2025",
            "url": "https://epa.ohio.gov/static/Portals/28/documents/opcert/ABC-EEC.pdf"
          },
          {
            "evidence": "Under the heading ‘WPI Need to Know Criteria’, Ohio EPA hosts the Class 1 Water Distribution outline on its own domain, alongside Class 2.",
            "title": "WPI Water Distribution Class 1 Need-to-Know Criteria, hosted by Ohio EPA",
            "url": "https://dam.assets.ohio.gov/image/upload/epa.ohio.gov/Portals/28/documents/opcert/WPI-WaterDistribution-Class-1.pdf"
          },
          {
            "evidence": "Ohio EPA states: ‘Please note that the title on WPI’s NTK Criteria may be a different exam level than the Ohio EPA certification you are seeking. When you are applying through test provider site, once you select Ohio EPA certification, you will select the Ohio EPA certificate level you are seeking and the appropriate WPI test will be selected.’",
            "title": "Ohio EPA  -  Exam information, WPI Need to Know Criteria section",
            "url": "https://epa.ohio.gov/divisions-and-offices/drinking-and-ground-waters/certified-operators/exam-information"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": [
          1,
          2
        ]
      },
      {
        "authorityName": "Ohio Environmental Protection Agency (Ohio EPA), Division of Drinking and Ground Waters, Operator Certification Unit",
        "authorityUrl": "https://epa.ohio.gov/divisions-and-offices/drinking-and-ground-waters/certified-operators",
        "examSystem": "unverified",
        "localLevels": "Water Reclamation (also styled Wastewater Treatment): Class A, Class I, Class II, Class III, Class IV",
        "note": "WPI covers Classes A–III; Class IV is expressly excluded and has a separate Ohio EPA examination/guidance route. The June 2025 direct-program chart maps Ohio A to Small Wastewater Treatment A, I to WPI 1, II to WPI 2, and III to WPI 3. Standardized versus customized status remains unverified. The optional C2EP route maps Ohio I/II/III to C2EP II/III/IV, not the direct-program correspondence.",
        "sources": [
          {
            "evidence": "Lists Class A and Classes 1–3 Water Reclamation preparation materials; excludes Class IV from WPI and links separate Class IV wastewater guidance and review checklist.",
            "title": "Ohio EPA  -  Exam information",
            "url": "https://epa.ohio.gov/divisions-and-offices/drinking-and-ground-waters/certified-operators/exam-information"
          },
          {
            "evidence": "Water Reclamation A = Small Wastewater Treatment A; Water Reclamation 1 = Wastewater Treatment 1; 2 = 2; 3 = 3.",
            "title": "Ohio EPA/WPI Professional Operator Exam Equivalency Chart  -  revised June 2025",
            "url": "https://epa.ohio.gov/static/Portals/28/documents/opcert/ABC-EEC.pdf"
          },
          {
            "evidence": "Identifies Class A, I, II, III or IV Wastewater Treatment certification, independently of drinking-water credentials.",
            "title": "Ohio EPA  -  How to Become a Certified Water or Wastewater Operator",
            "url": "https://dam.assets.ohio.gov/image/upload/epa.ohio.gov/Portals/28/documents/opcert/How%20to%20become%20operator%20factsheet.pdf"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Ohio Environmental Protection Agency (Ohio EPA), Division of Drinking and Ground Waters, Operator Certification Unit",
        "authorityUrl": "https://epa.ohio.gov/divisions-and-offices/drinking-and-ground-waters/certified-operators",
        "examSystem": "unverified",
        "localLevels": "Wastewater Collection: Class I, Class II",
        "note": "Ohio collection certification is explicitly offered. The June 2025 direct-program chart maps Ohio I to WPI Collection 2 and Ohio II to WPI Collection 3. Standardized versus customized status is not explicitly established. The separate voluntary C2EP route maps Ohio I to C2EP II and Ohio II to C2EP IV; do not merge the routes or assume local and WPI numbers match.",
        "sources": [
          {
            "evidence": "Collections: Wastewater Collection 1 = Wastewater Collection 2; Wastewater Collection 2 = Wastewater Collection 3.",
            "title": "Ohio EPA/WPI Professional Operator Exam Equivalency Chart  -  revised June 2025",
            "url": "https://epa.ohio.gov/static/Portals/28/documents/opcert/ABC-EEC.pdf"
          },
          {
            "evidence": "Direct Ohio EPA route lists Wastewater Collection Classes I and II. Separate voluntary C2EP route lists Collection II (Ohio I) and Collection IV (Ohio II).",
            "title": "WPI  -  Ohio EPA Certification Options Comparison Tool",
            "url": "https://gowpi.org/certification/ohio-epa-certification/"
          },
          {
            "evidence": "Identifies Class I or II Wastewater Collection certification and Ohio EPA as the certifying agency.",
            "title": "Ohio EPA  -  How to Become a Certified Water or Wastewater Operator",
            "url": "https://dam.assets.ohio.gov/image/upload/epa.ohio.gov/Portals/28/documents/opcert/How%20to%20become%20operator%20factsheet.pdf"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "OK",
    "dedicatedCourseNeeds": [
      "Oklahoma Waterworks D/C/B/A alignment to the DEQ Water System Operations 12-area outline, including groundwater, treatment, distribution, safety, and General Regulations and Management; refresh regulatory content against current Chapter 710 rather than copying the older guide unchanged.",
      "Oklahoma Wastewater Works D/C/B/A alignment to the separate DEQ wastewater 12-area outline, including preliminary/primary/secondary/advanced treatment, solids handling, lagoons/ponds, collection, safety, and Oklahoma regulations.",
      "A combined Oklahoma Distribution and Collection pathway with distinct Class T technician and Class C operator preparation, using the DEQ distribution/collection outline and its local line-placement, disinfection, collection-line maintenance, lift-station and regulatory topics; replace the guide's old technician Class D label with current Class T."
    ],
    "limits": [
      "Eight distinct official-state sources opened; findings use opened documents, not search snippets. Sources were accessed October 4, 2026 for the requested October 3, 2026 cutoff; no archived October 3 snapshot was independently verified.",
      "DEQ's currently linked Chapter 710 incorporates amendments effective September 15, 2025. DEQ labels its downloadable rules an unofficial convenience copy and says the official Oklahoma Administrative Code prevails; that separate official-code text was not opened within the source cap.",
      "Water guide is dated 2008, wastewater guide 2017, and distribution/collection guide retains older terminology. Their outlines support local preparation needs, not proof of an unchanged 2026 examination blueprint or provider.",
      "No explicit standardized WPI/ABC scope plus local-grade-to-WPI-class correspondence was established; all verifiedSharedLevels are therefore empty. DEQ administration, 'validated examination,' and 'state certification exam' wording alone do not resolve state-authored versus customized or standardized vendor exams.",
      "Certification is required for covered operational decision-makers, with specified system/person exemptions. Chapter 710 also offers a special non-operational A–C certification for qualified environmental professionals that does not authorize system operation; it is not a separate verified standardized-exam route.",
      "DedicatedCourseNeeds identifies supported Oklahoma-specific alignment needs, not a confirmed unique-exam authorship finding or any coverage/pass guarantee."
    ],
    "name": "Oklahoma",
    "streams": [
      {
        "authorityName": "Oklahoma Department of Environmental Quality (DEQ), Water Quality Division, Operator Certification Unit",
        "authorityUrl": "https://oklahoma.gov/deq/divisions/water-quality/operator-certification.html",
        "examSystem": "unverified",
        "localLevels": "Waterworks Operator: Class D, Class C, Class B, Class A (D entry; A highest).",
        "note": "DEQ-approved validated examinations and Oklahoma-specific study outlines are documented. The opened official sources do not explicitly identify the current exams as WPI standardized, customized ABC/WPI, or state-authored; provider classification remains unverified. No supported local-letter-to-WPI-class correspondence.",
        "sources": [
          {
            "evidence": "252:710-3-32(a): Waterworks/Wastewater Works Operator, 'Class A, B, C, and D available.' 252:710-1-6(b): validated examinations administered by 'DEQ or its designee.' 252:710-5-51 expressly includes water treatment plants.",
            "title": "Chapter 710  -  Waterworks and Wastewater Works Operator Certification",
            "url": "https://oklahoma.gov/content/dam/ok/en/deq/documents/rules/710.pdf"
          },
          {
            "evidence": "Introduction pp. ii–iii: Class D is entry level, Class A most advanced; suggested references are used to prepare state certification exams. Pp. v–vi describe 12 competency areas corresponding to guide chapters, with separate D/C/B/A study emphasis.",
            "title": "Water System Operations  -  State of Oklahoma Certification Study Guide",
            "url": "https://oklahoma.gov/content/dam/ok/en/deq/documents/water-division/completewatersystemsstudyguide7_08-1.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Oklahoma Department of Environmental Quality (DEQ), Water Quality Division, Operator Certification Unit",
        "authorityUrl": "https://oklahoma.gov/deq/divisions/water-quality/operator-certification.html",
        "examSystem": "unverified",
        "localLevels": "Combined Distribution and Collection Operator: Class C; combined Distribution and Collection Technician: Class T. Waterworks Operator Classes D, C, B, A also authorize distribution duties subject to system/responsibility requirements.",
        "note": "Distribution is not a verified separate four-class WPI ladder. Oklahoma expressly provides combined distribution/collection C and T credentials. The older guide calls the technician Class D, but current rules specify Class T. Exam authorship and standardized-versus-customized WPI/ABC status remain unverified.",
        "sources": [
          {
            "evidence": "252:710-3-32(c)–(d): Distribution and Collection Operator 'Class C available'; Technician 'Class T available.' 252:710-5-51 and 5-58 expressly authorize distribution-system duties; 1-6 requires DEQ/designee-administered validated exams.",
            "title": "Chapter 710  -  Waterworks and Wastewater Works Operator Certification",
            "url": "https://oklahoma.gov/content/dam/ok/en/deq/documents/rules/710.pdf"
          },
          {
            "evidence": "Introduction: preparation for technician/operator exams uses chapters one through six; exam categories 'correspond directly to the chapters and/or sections in this study guide.' Separate technician and operator guidelines cover distribution systems and local regulations.",
            "title": "Distribution/Collection Certification Study Guide",
            "url": "https://oklahoma.gov/content/dam/ok/en/deq/documents/water-division/distribution-collection_study_guide.pdf"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Oklahoma Department of Environmental Quality (DEQ), Water Quality Division, Operator Certification Unit",
        "authorityUrl": "https://oklahoma.gov/deq/divisions/water-quality/operator-certification.html",
        "examSystem": "unverified",
        "localLevels": "Wastewater Works Operator: Class D, Class C, Class B, Class A (D entry; A highest).",
        "note": "Wastewater evidence was checked independently. The DEQ-linked wastewater guide documents local grade-specific exam content, but neither it nor the current rules explicitly establishes state authorship, customized ABC/WPI, or standardized WPI use. No verified WPI class mapping.",
        "sources": [
          {
            "evidence": "252:710-3-32(a) offers Wastewater Works Operator Classes A–D. 252:710-5-52 expressly covers wastewater treatment plants and lagoon systems. 252:710-1-6 requires validated examinations administered by DEQ or its designee.",
            "title": "Chapter 710  -  Waterworks and Wastewater Works Operator Certification",
            "url": "https://oklahoma.gov/content/dam/ok/en/deq/documents/rules/710.pdf"
          },
          {
            "evidence": "Introduction: 'Class D is entry level, and Class A is the most advanced.' Exam Information identifies 12 competency areas corresponding to guide chapters and different D/C/B/A emphasis, including Oklahoma regulations, treatment, solids handling, ponds and disinfection.",
            "title": "Wastewater Treatment Operations  -  State of Oklahoma Certification Study Guide, Second Edition 2017",
            "url": "https://oklahoma.gov/content/dam/ok/en/deq/documents/water-division/New-DEQ-Wastewater-Study-Guide.pdf"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Oklahoma Department of Environmental Quality (DEQ), Water Quality Division, Operator Certification Unit",
        "authorityUrl": "https://oklahoma.gov/deq/divisions/water-quality/operator-certification.html",
        "examSystem": "unverified",
        "localLevels": "Combined Distribution and Collection Operator: Class C; combined Distribution and Collection Technician: Class T. Wastewater Works Operator Classes D, C, B, A also authorize collection duties subject to system/responsibility requirements.",
        "note": "Collection is expressly included in Oklahoma's combined distribution/collection credentials, not inferred from drinking-water certification. The current technician name is Class T despite the guide's older Class D label. Current exam provider/type and any WPI standardized class correspondence remain unverified.",
        "sources": [
          {
            "evidence": "252:710-3-32(c)–(d) offers combined Class C Operator and Class T Technician. 252:710-5-52, 5-58 and 5-59 expressly cover collection systems; technician duties require general supervision. 1-6(e) permits oral validated exams for Distribution and Collection Technicians.",
            "title": "Chapter 710  -  Waterworks and Wastewater Works Operator Certification",
            "url": "https://oklahoma.gov/content/dam/ok/en/deq/documents/rules/710.pdf"
          },
          {
            "evidence": "Chapter 3 explicitly provides collection-system technician/operator exam guidelines: collection lines, cleaning and repairs, safety, lift stations, troubleshooting, and collection-system regulations. Introduction ties exam categories to guide chapters/sections.",
            "title": "Distribution/Collection Certification Study Guide",
            "url": "https://oklahoma.gov/content/dam/ok/en/deq/documents/water-division/distribution-collection_study_guide.pdf"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "OR",
    "dedicatedCourseNeeds": [
      "Oregon Treatment Level 2 Filtration Endorsement needs a separate outline/regulatory route: OHA publishes a Filtration Endorsement Need-to-Know guide, and OAR 333-061-0220 defines the local endorsement scope. Its examination system and equivalence to standardized treatment classes remain unverified.",
      "Oregon Small Wastewater System operators need a separately scoped preparation route using DEQ's small-system Need-to-Know outline and applicable Oregon rules, not automatic substitution of WPI Classes I–IV. DEQ lists this outline separately; standardized versus customized examination status and treatment/collection credential scope require verification."
    ],
    "limits": [
      "Requested reference date is October 3, 2026. Sources were opened live on October 4, 2026; no archived October 3 snapshot comparison was obtained. DEQ's examination adoption notice has an explicit May 1, 2025 effective date.",
      "Eight source opens were used. OHA's Operator Exam FAQs and the Secretary of State's wastewater rules division returned no substantive rule/FAQ text. DEQ's PSI handbook contained delivery policies, not a grade-to-class crosswalk.",
      "The complete local wastewater grade ladder and explicit per-stream local Grade-to-WPI Class correspondence were not independently established in the acquired text. Empty verifiedSharedLevels arrays deliberately prevent unsupported grade routing.",
      "ABC study criteria, formula sheets, PSI delivery, and reciprocity language were not treated as proof of standardized exams. Mandatory versus voluntary status of ancillary credentials was not fully verified."
    ],
    "name": "Oregon",
    "streams": [
      {
        "authorityName": "Oregon Health Authority  -  Drinking Water Services (DWS)",
        "authorityUrl": "https://www.oregon.gov/oha/ph/healthyenvironments/drinkingwater/operatorcertification/pages/index.aspx",
        "examSystem": "unverified",
        "localLevels": "Treatment Level 1, Treatment Level 2, Treatment Level 3, Treatment Level 4; Filtration Endorsement (FE); Operator in Training (OIT) takes the Level 1 exam.",
        "note": "OHA publishes ABC Class 1–4 treatment study criteria, but the opened authority material does not explicitly establish whether Oregon administers standardized or customized ABC exams. Do not enable standardized shared-level routing from these study links or PSI scheduling alone. Filtration Endorsement is a separate local qualification associated with Treatment Level 2.",
        "sources": [
          {
            "evidence": "Lists ABC Water Treatment Operator Need-to-Know Criteria for Classes 1–4; says OIT applicants take the treatment Level 1 exam; FE applicants must currently hold Treatment Level 2 certification.",
            "title": "New Operator Certification  -  Drinking Water",
            "url": "https://www.oregon.gov/oha/ph/healthyenvironments/drinkingwater/operatorcertification/levels1-4/pages/exams.aspx"
          },
          {
            "evidence": "Lists Water Treatment 1–4. Filtration Endorsement applies to qualifying Water Treatment 2 plants using conventional or direct filtration; operators already certified at Water Treatment Level 3 or higher are excepted from that endorsement requirement.",
            "title": "OAR 333-061-0210 and 333-061-0220  -  Scope and System Classification",
            "url": "https://www.oregon.gov/oha/PH/HEALTHYENVIRONMENTS/DRINKINGWATER/RULES/Documents/61-0210.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Oregon Health Authority  -  Drinking Water Services (DWS)",
        "authorityUrl": "https://www.oregon.gov/oha/ph/healthyenvironments/drinkingwater/operatorcertification/pages/index.aspx",
        "examSystem": "unverified",
        "localLevels": "Distribution Level 1, Distribution Level 2, Distribution Level 3, Distribution Level 4; Operator in Training (OIT) takes the Level 1 exam. Small water systems have a separate system classification.",
        "note": "Four distribution certification levels and ABC Class 1–4 study documents are supported. Explicit standardized-exam adoption, rather than customized ABC examinations, is not established by the opened OHA sources. Small-system classification does not establish the small-system credential's examination type.",
        "sources": [
          {
            "evidence": "States: 'There are four levels of distribution certification.' Lists ABC Distribution Operator Class 1–4 study criteria and states OIT applicants take the distribution Level 1 exam.",
            "title": "New Operator Certification  -  Drinking Water",
            "url": "https://www.oregon.gov/oha/ph/healthyenvironments/drinkingwater/operatorcertification/levels1-4/pages/exams.aspx"
          },
          {
            "evidence": "Lists Water Distribution 1–4. Separately classifies systems serving 150 service connections or fewer that use groundwater or purchase finished water as small water systems.",
            "title": "OAR 333-061-0210 and 333-061-0220  -  Scope and System Classification",
            "url": "https://www.oregon.gov/oha/PH/HEALTHYENVIRONMENTS/DRINKINGWATER/RULES/Documents/61-0210.pdf"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Oregon Department of Environmental Quality (DEQ)  -  Wastewater Operator Certification Program",
        "authorityUrl": "https://www.oregon.gov/deq/wq/wqpermits/pages/wastewater-operator-certification.aspx",
        "examSystem": "wpi-standardized",
        "localLevels": "Grade I and Grade II explicitly confirmed for treatment; the general wastewater exam update also names Grade IV. Complete stream-specific higher-grade names remain unverified within the acquisition limit. Entry pathways include Operator-in-Training and Provisional Grade I; Small Wastewater System is a separate local route.",
        "note": "DEQ explicitly identifies its standardized exam adoption and the May 1, 2025 exam update; its treatment preparation resources cover WPI Classes I–IV. However, the acquired text does not explicitly map each local Oregon treatment Grade to the corresponding WPI Class, so no shared levels are verified. The separate Small Wastewater System examination's standardized/customized status is unverified.",
        "sources": [
          {
            "evidence": "States: 'DEQ has administered the Association of Boards of Certification 2019 standardized exam since Jan. 1, 2022.' Announces new exams offered May 1, 2025 and identifies 'WPI 2025 standardized exams' and their Need-to-Know criteria.",
            "title": "Wastewater Operator Certification  -  New 2025 Exam",
            "url": "https://www.oregon.gov/deq/FilterDocs/fsORwwopcertEXup.pdf"
          },
          {
            "evidence": "Explicitly lists WPI Standardized Wastewater Treatment Operator Classes I, II, III and IV.",
            "title": "WPI 2025 Exam Need-to-Know Documents",
            "url": "https://www.oregon.gov/deq/wq/Documents/opcert2025PSIExamsDocs.pdf"
          },
          {
            "evidence": "Names 'Wastewater Collection and Treatment Grade I and II Exams'; links standardized wastewater treatment preparation resources. Separately lists Operator-in-Training/Provisional Grade I training and 'Small Wastewater System Operator ABC Need-to-Know Criteria'.",
            "title": "Wastewater Operator Certification Program",
            "url": "https://www.oregon.gov/deq/wq/wqpermits/pages/wastewater-operator-certification.aspx"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Oregon Department of Environmental Quality (DEQ)  -  Wastewater Operator Certification Program",
        "authorityUrl": "https://www.oregon.gov/deq/wq/wqpermits/pages/wastewater-operator-certification.aspx",
        "examSystem": "wpi-standardized",
        "localLevels": "Grade I and Grade II explicitly confirmed for collection; the general wastewater exam update also names Grade IV. Complete stream-specific higher-grade names remain unverified within the acquisition limit. Entry pathways include Operator-in-Training and Provisional Grade I.",
        "note": "Collection has independent official support: DEQ links standardized collection resources, and its 2025 examination document lists collection Classes I–IV. DEQ's wastewater exam update establishes standardized adoption, but an explicit local collection Grade-to-WPI Class crosswalk was not acquired. Therefore no shared levels are verified; this conclusion is not inferred from drinking-water evidence.",
        "sources": [
          {
            "evidence": "Addresses wastewater collection and treatment systems; explicitly describes DEQ's standardized ABC examination adoption and the WPI 2025 standardized exam update offered May 1, 2025.",
            "title": "Wastewater Operator Certification  -  New 2025 Exam",
            "url": "https://www.oregon.gov/deq/FilterDocs/fsORwwopcertEXup.pdf"
          },
          {
            "evidence": "Explicitly lists WPI Standardized Wastewater Collection Operator Classes I, II, III and IV.",
            "title": "WPI 2025 Exam Need-to-Know Documents",
            "url": "https://www.oregon.gov/deq/wq/Documents/opcert2025PSIExamsDocs.pdf"
          },
          {
            "evidence": "Names 'Wastewater Collection and Treatment Grade I and II Exams' and links Wastewater Collection Operator Preparation Resources to WPI's standardized wastewater collection examinations.",
            "title": "Wastewater Operator Certification Program",
            "url": "https://www.oregon.gov/deq/wq/wqpermits/pages/wastewater-operator-certification.aspx"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "PA",
    "dedicatedCourseNeeds": [
      "Pennsylvania-specific water-treatment routing: General Part I plus applicable technology Part II modules, rather than separate WPI I–IV courses; retain distinct limited-system Dc and Dn tracks and optional Laboratory Supervisor subclass 15.",
      "Pennsylvania distribution Class E standalone-exam preparation, with applicable treatment modules from subclasses 7–14 when needed.",
      "Pennsylvania wastewater-treatment General Part I plus activated-sludge, fixed-film, ponds/lagoons and applicable collection-component modules; separate Laboratory Supervisor subclass 5 preparation when requested.",
      "Pennsylvania collection standalone/E4 preparation addressing satellite pumping-station and single-entity collection scope, not an assumed four-grade collection ladder.",
      "Use DEP's Pennsylvania exam knowledge/skills/abilities outline: its Preparing for the Exams page directs candidates to Handbook Appendix A. Include Chapter 302's local class/subclass and certification framework; obtain the actual Appendix A before defining detailed course coverage."
    ],
    "limits": [
      "Requested reference date: October 3, 2026. Live sources were retrieved October 4, 2026, not archived cutoff-date snapshots. The official Pennsylvania Code page states its compilation includes changes effective through August 8, 2026; later amendments were not independently exhaustively checked.",
      "State-specific classification rests on explicit official examination-development rules and matching current DEP exam structure, not WPI membership, reciprocity, delivery vendors or third-party claims. All verifiedSharedLevels are empty because no standardized WPI scope or local-to-WPI class mapping is supported.",
      "DEP's Preparing for the Exams page was opened, but its linked handbook returned a download landing page and the PDF body could not be retrieved. Detailed Appendix A topic coverage is therefore unverified. URL: https://www.pa.gov/agencies/dep/programs-and-services/water/bureau-of-safe-drinking-water/operator-certification/initial-certification/preparing-for-the-exams"
    ],
    "name": "Pennsylvania",
    "streams": [
      {
        "authorityName": "Pennsylvania State Board for Certification of Water and Wastewater Systems Operators; administered with Pennsylvania Department of Environmental Protection (DEP), Operator Certification Program",
        "authorityUrl": "https://www.pa.gov/agencies/dep/programs-and-services/water/bureau-of-safe-drinking-water/operator-certification/certification-exam-schedule",
        "examSystem": "state-specific",
        "localLevels": "Class A (>5 MGD), Class B (>1 to 5 MGD), Class C (>100,000 gpd to 1 MGD), Class D (≤100,000 gpd); special small-system Class Dc (disinfected groundwater) and Class Dn (no disinfection/treatment). A–D use applicable Subclassifications 1–15, including Laboratory Supervisor (15).",
        "note": "DEP prepares Pennsylvania examinations and the Board administers them. A–D require a General Part I exam plus applicable technology-specific Part II exams; size-class upgrades do not require another examination. Dc/Dn use separate standalone exams and have restricted eligibility. These are not verified WPI standardized or customized ABC exams, and A–D cannot be mapped to WPI Classes I–IV.",
        "sources": [
          {
            "evidence": "§302.601(a): 'The Department will prepare and the Board will administer' certification examinations. §302.601(b): Part I covers water or wastewater systems 'regardless of size'; Part II covers technologies or components.",
            "title": "25 Pa. Code Chapter 302, Subchapter F  -  Certification Examinations",
            "url": "https://pacodeandbulletin.gov/display/pacode?file=/secure/pacode/data/025/chapter302/subchapFtoc.html&d="
          },
          {
            "evidence": "Lists Water Classes A, B, C, D, E, Dc and Dn; the Board awards certification class based on experience. Dc requires small size, exclusively groundwater, only disinfection and regulatory compliance; Dn has no disinfection.",
            "title": "DEP  -  Definitions of Classes and Subclasses",
            "url": "https://www.pa.gov/agencies/dep/programs-and-services/water/bureau-of-safe-drinking-water/operator-certification/initial-certification/definitions-of-classes-and-subclasses"
          },
          {
            "evidence": "A–D require General and technology-specific exams; Dc/Dn are standalone. 'Operators do not need to take exams to upgrade the class certificate (size of plant A, B, C, D).'",
            "title": "DEP  -  Certification Exam Schedule",
            "url": "https://www.pa.gov/agencies/dep/programs-and-services/water/bureau-of-safe-drinking-water/operator-certification/certification-exam-schedule"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Pennsylvania State Board for Certification of Water and Wastewater Systems Operators; administered with Pennsylvania DEP, Operator Certification Program",
        "authorityUrl": "https://www.pa.gov/agencies/dep/programs-and-services/water/bureau-of-safe-drinking-water/operator-certification/certification-exam-schedule",
        "examSystem": "state-specific",
        "localLevels": "Class E  -  Distribution and Consecutive Water Systems; may combine with Subclassifications 7–14 for applicable treatment technologies. No four-level distribution ladder is listed.",
        "note": "Pennsylvania Class E has a standalone General exam. Treatment in a distribution/consecutive system can require additional applicable technology subclasses. Official regulations expressly cover distribution examinations; this finding is not inferred from treatment-only evidence. No WPI standardized-class correspondence is established.",
        "sources": [
          {
            "evidence": "§302.601(a) assigns preparation to DEP; §302.601(c) expressly requires separate standalone exams for 'water distribution or consecutive systems without treatment'.",
            "title": "25 Pa. Code Chapter 302, Subchapter F  -  Certification Examinations",
            "url": "https://pacodeandbulletin.gov/display/pacode?file=/secure/pacode/data/025/chapter302/subchapFtoc.html&d="
          },
          {
            "evidence": "Water 'Class E – Distribution and Consecutive Water Systems'.",
            "title": "DEP  -  Definitions of Classes and Subclasses",
            "url": "https://www.pa.gov/agencies/dep/programs-and-services/water/bureau-of-safe-drinking-water/operator-certification/initial-certification/definitions-of-classes-and-subclasses"
          },
          {
            "evidence": "Drinking Water Class E is standalone; 'Class E General Exam can be combined with Technology subclasses 7-14'.",
            "title": "DEP  -  Certification Exam Schedule",
            "url": "https://www.pa.gov/agencies/dep/programs-and-services/water/bureau-of-safe-drinking-water/operator-certification/certification-exam-schedule"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Pennsylvania State Board for Certification of Water and Wastewater Systems Operators; administered with Pennsylvania DEP, Operator Certification Program",
        "authorityUrl": "https://www.pa.gov/agencies/dep/programs-and-services/water/bureau-of-safe-drinking-water/operator-certification/certification-exam-schedule",
        "examSystem": "state-specific",
        "localLevels": "Class A (>5 MGD), Class B (>1 to 5 MGD), Class C (>100,000 gpd to 1 MGD), Class D (≤100,000 gpd). Subclassification 1  -  Activated Sludge; 2  -  Fixed film treatment; 3  -  Treatment ponds and lagoons; 4  -  Single entity collection system; 5  -  Laboratory Supervisor.",
        "note": "A–D require the Pennsylvania wastewater General Part I exam plus applicable Part II technology/component exams. Classes reflect system size and operator experience, not separate ascending standardized exam grades. Laboratory Supervisor is an additional subclass requiring existing A–D wastewater certification. No WPI standardized or customized ABC scope is established.",
        "sources": [
          {
            "evidence": "§302.601(a) makes DEP the examination preparer; (b) expressly covers wastewater General and technology/component examinations; (d) specifies a wastewater laboratory-supervisor Part II exam.",
            "title": "25 Pa. Code Chapter 302, Subchapter F  -  Certification Examinations",
            "url": "https://pacodeandbulletin.gov/display/pacode?file=/secure/pacode/data/025/chapter302/subchapFtoc.html&d="
          },
          {
            "evidence": "Lists Wastewater Classes A–D and Subclassifications 1–5, including the requirement for existing A–D treatment certification before adding Laboratory Supervisor.",
            "title": "DEP  -  Definitions of Classes and Subclasses",
            "url": "https://www.pa.gov/agencies/dep/programs-and-services/water/bureau-of-safe-drinking-water/operator-certification/initial-certification/definitions-of-classes-and-subclasses"
          },
          {
            "evidence": "Wastewater A–D combine with subclasses 1–5 and require General plus technology-specific examinations; upgrading plant-size class A–D does not require another exam.",
            "title": "DEP  -  Certification Exam Schedule",
            "url": "https://www.pa.gov/agencies/dep/programs-and-services/water/bureau-of-safe-drinking-water/operator-certification/certification-exam-schedule"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Pennsylvania State Board for Certification of Water and Wastewater Systems Operators; administered with Pennsylvania DEP, Operator Certification Program",
        "authorityUrl": "https://www.pa.gov/agencies/dep/programs-and-services/water/bureau-of-safe-drinking-water/operator-certification/certification-exam-schedule",
        "examSystem": "state-specific",
        "localLevels": "Class E  -  Satellite collection system with a pump station, combined with wastewater Subclassification 4 (E4). Subclassification 4  -  Single entity collection system, also available with wastewater Classes A–D. No collection Classes I–IV are listed.",
        "note": "The regulations expressly provide a Pennsylvania standalone collection examination for satellite or single-entity collection systems. The current schedule identifies Class E with subclass 4 only and permits its exam alongside wastewater A–D exams. Do not generalize Class E eligibility to every sewer network or replace it with four WPI grades.",
        "sources": [
          {
            "evidence": "§302.601(a) assigns examination preparation to DEP; (c) expressly provides standalone exams for 'wastewater collection systems, either satellite or single entity'.",
            "title": "25 Pa. Code Chapter 302, Subchapter F  -  Certification Examinations",
            "url": "https://pacodeandbulletin.gov/display/pacode?file=/secure/pacode/data/025/chapter302/subchapFtoc.html&d="
          },
          {
            "evidence": "Wastewater Class E is a 'Satellite collection system with a pump station' combined with subclass 4; subclass 4 defines single-entity collection systems.",
            "title": "DEP  -  Definitions of Classes and Subclasses",
            "url": "https://www.pa.gov/agencies/dep/programs-and-services/water/bureau-of-safe-drinking-water/operator-certification/initial-certification/definitions-of-classes-and-subclasses"
          },
          {
            "evidence": "Wastewater Class E: 'subclass 4 ONLY', standalone examination, which 'can be taken with Wastewater A, B, C, or D'.",
            "title": "DEP  -  Certification Exam Schedule",
            "url": "https://www.pa.gov/agencies/dep/programs-and-services/water/bureau-of-safe-drinking-water/operator-certification/certification-exam-schedule"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "RI",
    "dedicatedCourseNeeds": [
      "Separate VSS Treatment and VSS Distribution routing from numerical drinking-water Classes 1–4; obtain the VSS-specific exam outline before assigning shared content.",
      "For wastewater treatment, align preparation to the current RIDEM grade-specific study guides rather than assuming a WPI-standardized outline. The opened Grade 1 guide specifically supports Rhode Island certification-law/regulation content alongside its listed treatment, laboratory, maintenance and safety topics; Grade 2–4 guide contents were not opened.",
      "Keep the NEWEA voluntary collection-certification route separate from mandatory RIDEM treatment licensure. Confirm its current four-grade brochure, exact labels and exam specifications before deciding whether dedicated NEWEA preparation or shared WPI courses are appropriate."
    ],
    "limits": [
      "Target date is October 3, 2026; sources were accessed October 4, 2026. Current official/administrator pages and documents dated before the target support these findings, but no archived October 3 snapshot was acquired.",
      "Eight source opens were used, including one obsolete NEWEA voluntary-certification URL that returned page-not-found. No further sources were opened; the current NEWEA brochure and WPI class specifications were not inspected.",
      "Drinking-water standardized status is directly verified, but explicit local-to-WPI class crosswalks remain unverified under the requested strict routing rule. Wastewater exam provenance remains unverified, not proven unsupported or state-specific.",
      "The older NEWEA Rhode Island resource page conflicts with RIDEM/RIDOH on some renewal and OIT details; it is used only for the collection-program distinction, corroborated by the current NEWEA program page. No private records or exam-result rosters were used."
    ],
    "name": "Rhode Island",
    "streams": [
      {
        "authorityName": "Rhode Island Department of Health, Center for Drinking Water Quality; Rhode Island Board of Certification of Operators of Drinking Water Supply Facilities",
        "authorityUrl": "https://health.ri.gov/licensing/drinking-water-operator",
        "examSystem": "wpi-standardized",
        "localLevels": "VSS – Very Small System (Treatment); 1T, 2T, 3T, 4T. RIDOH also describes numerical levels as Classes 1–4. Full and Operator-in-Training certification are available for VSS and Classes 1–3; no Class 4 OIT.",
        "note": "RIDOH explicitly confirms 2017 WPI-ABC standardized treatment examinations, not merely ABC affiliation or PSI delivery. However, the opened sources do not explicitly crosswalk RI 1T–4T to WPI Classes I–IV, so shared numerical levels are withheld under the requested evidence rule. VSS must remain separate from levels 1–4.",
        "sources": [
          {
            "evidence": "‘Rhode Island uses ... (WPI-ABC) 2017 standardized exams’; immediately links approved resources separately for treatment and distribution. Licenses are issued by DWQ following Board approval.",
            "title": "Drinking Water Operator  -  RIDOH",
            "url": "https://health.ri.gov/licensing/drinking-water-operator"
          },
          {
            "evidence": "‘Grade of Examination’: ‘Treatment: 1T 2T 3T 4T’; separate ‘VSS – Very Small System’ Treatment option. OIT is restricted to ‘class VSS, 1, 2, & 3 only’.",
            "title": "Application for Operator Certification Exam  -  updated June 2026",
            "url": "https://health.ri.gov/sites/g/files/xkgbur1006/files/applications/DrinkingWaterOperatorExam.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Rhode Island Department of Health, Center for Drinking Water Quality; Rhode Island Board of Certification of Operators of Drinking Water Supply Facilities",
        "authorityUrl": "https://health.ri.gov/licensing/drinking-water-operator",
        "examSystem": "wpi-standardized",
        "localLevels": "VSS – Very Small System (Distribution); 1D, 2D, 3D, 4D. RIDOH also describes numerical levels as Classes 1–4. Full and Operator-in-Training certification are available for VSS and Classes 1–3; no Class 4 OIT.",
        "note": "RIDOH explicitly confirms 2017 WPI-ABC standardized distribution examinations. The opened sources establish local examination labels but do not explicitly crosswalk 1D–4D to WPI Classes I–IV; shared numerical levels are therefore withheld. VSS is a separate examination selection.",
        "sources": [
          {
            "evidence": "Identifies two license types, treatment and distribution, and states use of ‘2017 standardized exams’, with a separate standardized distribution study-resource link.",
            "title": "Drinking Water Operator  -  RIDOH",
            "url": "https://health.ri.gov/licensing/drinking-water-operator"
          },
          {
            "evidence": "‘Distribution: 1D 2D 3D 4D’; separate VSS Distribution option. Applicants select Full Certification or eligible OIT certification.",
            "title": "Application for Operator Certification Exam  -  updated June 2026",
            "url": "https://health.ri.gov/sites/g/files/xkgbur1006/files/applications/DrinkingWaterOperatorExam.pdf"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Rhode Island Department of Environmental Management, Office of Water Resources; Board of Certification of Operators of Wastewater Treatment Facilities",
        "authorityUrl": "https://dem.ri.gov/environmental-protection-bureau/water-resources/permitting/wastewater-operator-certification",
        "examSystem": "unverified",
        "localLevels": "Grade 1, Grade 2, Grade 3, Grade 4; OIT provisions also exist. Tier Two denotes voluntary training recognition at renewal, not a separate examination grade.",
        "note": "Mandatory state wastewater-treatment licensing is confirmed. Current DEM pages and the Grade 1 outline do not identify the exam as WPI standardized, customized ABC, or independently state-authored. A state-published outline alone does not settle authorship; keep this stream out of shared WPI routing pending direct confirmation. The FAQ also describes a Board-sponsored Grade 1 course pathway requiring a separate certification application.",
        "sources": [
          {
            "evidence": "Licensing is directed by the seven-member Board. The current page posts 2026 examination information and separate study guides labeled Grade 1, Grade 2, Grade 3 and Grade 4.",
            "title": "Board of Certification of Operators of Wastewater Treatment Facilities  -  RIDEM",
            "url": "https://dem.ri.gov/environmental-protection-bureau/water-resources/permitting/wastewater-operator-certification"
          },
          {
            "evidence": "Certification is a ‘mandatory licensing requirement’; ‘There are four grades of licenses, 1 through 4.’ Passing the Board-sponsored Grade 1 course still requires applying to the Board with proof of passing.",
            "title": "Wastewater Operator Certification: Frequently Asked Questions  -  RIDEM",
            "url": "https://dem.ri.gov/programs/water/wwtf/certification/faq.php"
          },
          {
            "evidence": "The Grade 1 outline expressly includes ‘Certification Laws and Regulations’, preliminary/primary/secondary treatment, solids handling, disinfection, maintenance, laboratory and safety; it warns that the outline does not necessarily include every examination topic.",
            "title": "Wastewater Treatment Plant Operator Examinations  -  Grade 1 Study Guide Outline",
            "url": "https://dem.ri.gov/sites/g/files/xkgbur861/files/2026-03/gr1study.pdf"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "New England Water Environment Association (NEWEA), Collection Systems Certification Committee  -  voluntary regional certification, not RIDEM treatment licensure",
        "authorityUrl": "https://www.newea.org/careers/certification/collection-systems-certification-program/",
        "examSystem": "unverified",
        "localLevels": "Four grade levels confirmed; exact current grade labels were not enumerated in the opened administrator pages and remain unverified.",
        "note": "Do not mark collection not-offered merely because RIDEM lacks authority over full-time collection crews: NEWEA administers a separate voluntary program serving Rhode Island. Opened administrator pages do not explicitly identify standardized WPI, customized ABC, or independent exam authorship. No shared-level correspondence is verified.",
        "sources": [
          {
            "evidence": "Full-time collection-system maintenance crews are not considered treatment operators and do not need that licensure; the Board lacks authority to license those positions.",
            "title": "Wastewater Operator Certification: Frequently Asked Questions  -  RIDEM",
            "url": "https://dem.ri.gov/programs/water/wwtf/certification/faq.php"
          },
          {
            "evidence": "‘Certification for Collection System Operators is a voluntary program administered through ... NEWEA’; four grades, with examinations held by its Collection Systems Certification Committee.",
            "title": "Resources  -  Rhode Island  -  NEWEA",
            "url": "https://www.newea.org/careers/professional-development/resources-rhode-island/"
          },
          {
            "evidence": "Current administrator page confirms a program ‘offered in four grade levels’ for New England collection personnel; committee reviews applications and applicants then schedule examinations. Links a June 2026 brochure.",
            "title": "Collection Systems Certification Program  -  NEWEA",
            "url": "https://www.newea.org/careers/certification/collection-systems-certification-program/"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "SC",
    "dedicatedCourseNeeds": [
      "Water Treatment Class E needs separate local-grade routing: obtain its current Board-approved exam outline and confirm the exam system before assigning preparation. The opened sources do not justify treating E as WPI Class I or asserting a state-specific exam.",
      "Physical/Chemical Wastewater Treatment D/C/B/A needs a separate industrial-treatment preparation path, supported by the Board's Industrial Waste Treatment and Treatment of Metal Wastestreams references. Obtain current grade-specific outlines and confirm standardized versus customized/state-specific status before developing or assigning exam-specific material.",
      "A South Carolina licensing orientation should distinguish Title 40 Chapter 23 and Regulation Chapter 51 requirements from WEASC's voluntary collection program, and retain the local E/D/C/B/A labels. This does not establish that South Carolina law is tested on a unique examination."
    ],
    "limits": [
      "Requested reference date: October 3, 2026. Live sources were opened October 4, 2026; no archived October 3 snapshot was established. Current pages retain the express standardized-adoption statements, but the precise effective date of every page edit is unavailable.",
      "Eight source URLs opened, within the cap. The State Library newsletter extraction returned only 'DSpace'; the PSI portal yielded general program information without an exam blueprint. Neither was used as proof.",
      "No exam was classified as WPI-customized or state-specific without explicit evidence. WPI references alone did not establish Physical/Chemical standardization. For mandatory streams, the opened Board mapping explicitly identifies only WPI I/local D and WPI IV/local A; no intermediate mapping was inferred.",
      "For mixed streams, verifiedSharedLevels is qualified by the stream note: it excludes Water Treatment E and all Physical/Chemical Wastewater examinations. No private certification-holder list was opened."
    ],
    "name": "South Carolina",
    "streams": [
      {
        "authorityName": "South Carolina Environmental Certification Board, Department of Labor, Licensing and Regulation (LLR)",
        "authorityUrl": "https://llr.sc.gov/env/",
        "examSystem": "mixed",
        "localLevels": "Trainee Water Treatment Operator; Class E, Class D, Class C, Class B, Class A Water Treatment Operator.",
        "note": "The Board expressly adopted ABC standardized Water Treatment examinations and continues to identify standard exams on its current examination page. That page explicitly maps WPI Class I to local D and Class IV to local A; those are the only individually verified shared levels here. C/Class II and B/Class III correspondence was not explicitly documented in the opened sources. Class E is a separate required local entry examination, with no verified WPI-standardized, customized-ABC, or state-specific classification. Mixed denotes a verified standardized component plus unresolved E, not proof of a customized exam.",
        "sources": [
          {
            "evidence": "On May 1, 2017, the Board adopted the Association of Boards of Certifications new standardized exams for Biological Wastewater, Water Treatment and Water Distribution.",
            "title": "Environmental Certification Board  -  Board News",
            "url": "https://llr.sc.gov/env/updates.aspx"
          },
          {
            "evidence": "Lists Water Treatment entry examination at level E; labels its references 'WPI NEED-TO-KNOW CRITERIA (Class I = D Level; Class IV = A Level)'; FAQ refers expressly to 'new standard exams' in Water Treatment, Water Distribution and Biological Wastewater.",
            "title": "Environmental Certification Board  -  Examination Information",
            "url": "https://llr.sc.gov/env/examinfo.aspx"
          },
          {
            "evidence": "Section 40-23-300(B) separately establishes Trainee Water Treatment Operator and Classes E, D, C, B and A, with Board-approved examination requirements for each graded class.",
            "title": "South Carolina Code, Title 40, Chapter 23  -  Section 40-23-300",
            "url": "https://www.scstatehouse.gov/code/t40c023.php"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": [
          1,
          4
        ]
      },
      {
        "authorityName": "South Carolina Environmental Certification Board, Department of Labor, Licensing and Regulation (LLR)",
        "authorityUrl": "https://llr.sc.gov/env/",
        "examSystem": "wpi-standardized",
        "localLevels": "Trainee Water Distribution System Operator; Class D, Class C, Class B, Class A Water Distribution System Operator.",
        "note": "Explicit Board adoption establishes standardized ABC/WPI exams for this stream, independently of drinking-water treatment evidence. Only D/WPI I and A/WPI IV have explicit class correspondence in the opened sources; C/WPI II and B/WPI III remain unverified for shared-level routing. PSI delivery is not the basis for the standardized classification. Statutory Group I distribution facilities do not require a certified operator.",
        "sources": [
          {
            "evidence": "The Board's May 1, 2017 adoption of ABC 'new standardized exams' explicitly includes Water Distribution.",
            "title": "Environmental Certification Board  -  Board News",
            "url": "https://llr.sc.gov/env/updates.aspx"
          },
          {
            "evidence": "Names Water Distribution among the 'new standard exams' and provides the WPI correspondence 'Class I = D Level; Class IV = A Level'.",
            "title": "Environmental Certification Board  -  Examination Information",
            "url": "https://llr.sc.gov/env/examinfo.aspx"
          },
          {
            "evidence": "Section 40-23-310 names Trainee Water Distribution System Operator and Classes D, C, B and A; subsection (A)(1) states that Group I distribution facilities do not require a certified operator.",
            "title": "South Carolina Code, Title 40, Chapter 23  -  Section 40-23-310",
            "url": "https://www.scstatehouse.gov/code/t40c023.php"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": [
          1,
          4
        ]
      },
      {
        "authorityName": "South Carolina Environmental Certification Board, Department of Labor, Licensing and Regulation (LLR)",
        "authorityUrl": "https://llr.sc.gov/env/",
        "examSystem": "mixed",
        "localLevels": "Biological Wastewater Treatment: Trainee, D, C, B, A. Physical/Chemical Wastewater Treatment: separate Trainee, D, C, B, A licenses.",
        "note": "Shared levels apply ONLY to Biological Wastewater Treatment: the Board expressly adopted its standardized ABC exams and explicitly supplies D/WPI I and A/WPI IV correspondence. Intermediate correspondence remains unverified. Physical/Chemical has separate graded examinations and WPI study references, but the Board's standardized-adoption statement and current standard-exam FAQ do not include it. Physical/Chemical exam system is therefore unverified - not established as standardized, customized ABC, or state-specific. Mixed denotes this verified biological/unresolved physical-chemical split; do not apply biological shared routing to the industrial track.",
        "sources": [
          {
            "evidence": "Standardized ABC adoption explicitly names Biological Wastewater, Water Treatment and Water Distribution, not Physical/Chemical Wastewater.",
            "title": "Environmental Certification Board  -  Board News",
            "url": "https://llr.sc.gov/env/updates.aspx"
          },
          {
            "evidence": "Lists Biological and Physical/Chemical Wastewater as separate exam categories; gives 'Class I = D Level; Class IV = A Level'; standard-exam FAQ names Biological Wastewater only. Physical/Chemical references include Industrial Waste Treatment and Treatment of Metal Wastestreams.",
            "title": "Environmental Certification Board  -  Examination Information",
            "url": "https://llr.sc.gov/env/examinfo.aspx"
          },
          {
            "evidence": "Sections 51-3(F) and 51-3(G) separately define Trainee, D, C, B and A licensure for Physical/Chemical and Biological Wastewater Treatment operators, respectively.",
            "title": "South Carolina Code of Regulations, Chapter 51  -  Environmental Certification Board",
            "url": "https://www.scstatehouse.gov/coderegs/Chapter%2051.pdf"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": [
          1,
          4
        ]
      },
      {
        "authorityName": "Water Environment Association of South Carolina (WEASC), Voluntary Collection Certification Program (VCC)",
        "authorityUrl": "https://www.scwaters.org/page/VCCHome",
        "examSystem": "wpi-standardized",
        "localLevels": "D, C, B, A Wastewater Collection System Operator certification; D is entry level and A is highest.",
        "note": "This is WEASC's voluntary certification, distinct from the LLR mandatory operator-license program. Its own certification-program page explicitly establishes nationally standardized WPI exams and all four local-to-WPI correspondences. The page identifies its linked Need-to-Know Criteria as the 2025 edition. PSI is the delivery provider, not the certifying authority or proof of standardization.",
        "sources": [
          {
            "evidence": "States 'The nationally standardized exams used for this certification are developed by Water Professionals International (WPI), formerly the Association of Boards of Certification (ABC).' Links explicitly label Class I Wastewater Collection Operator ('D' Level), Class II ('C' Level), Class III ('B' Level), and Class IV ('A' Level). Describes the program as voluntary.",
            "title": "WEASC Voluntary Collection Certification Program (VCC)",
            "url": "https://www.scwaters.org/page/VCCHome"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": [
          1,
          2,
          3,
          4
        ]
      }
    ]
  },
  {
    "code": "SD",
    "dedicatedCourseNeeds": [
      "Separate Class I Small Water Treatment System route: the official FAQ identifies chlorination, regulations, aeration and general groundwater information, with a different emphasis from general Class I Water Treatment. Obtain the current SWTS blueprint before finalizing routing.",
      "Separate Class I Stabilization Pond / Small WW System route: DANR explicitly identifies pond-only preparation. Obtain its current exam outline and applicable South Dakota wastewater regulations; do not merge it automatically with general Class I Wastewater Treatment.",
      "South Dakota regulatory/classification supplement: ARSD 74:21:02 and SDCL 34A-3, including special Class I alternatives, category-specific eligibility, and mandatory versus voluntary wastewater certification. This is supported local preparation, not proof of state-specific exam questions.",
      "Resolve the Class I Very Small Water System discrepancy before creating a separate distribution-adjacent course route: the rules recognize the certificate, while the current FAQ and application do not establish a separately offered exam."
    ],
    "limits": [
      "As-of target: October 3, 2026. Reviewed currently published official sources, including DANR's schedule dated September 1, 2026 (https://danr.sd.gov/OfficeOfWater/OperatorCert/PDF/OpCertExam.pdf). No archived October 3 snapshot was verified.",
      "The currently linked FAQ is revised June 2, 2022 and the exam application is dated March 2, 2022. Their continued publication does not independently verify a later exam-version change.",
      "No opened source explicitly establishes South Dakota's standardized WPI/ABC exam scope and local-grade correspondence. All verifiedSharedLevels therefore remain empty; unverified does not mean unsupported or that standardized exams are not used.",
      "ABC exam provision and links to standardized-exam study references are insufficient to distinguish standardized, customized ABC or other exam arrangements. No stream is classified as state-specific merely because special local certificates exist.",
      "Six official source URLs were opened, including an older-path duplicate FAQ. No commercial claims, membership/contact listings, reciprocity, delivery vendor or search snippets were used as proof."
    ],
    "name": "South Dakota",
    "streams": [
      {
        "authorityName": "South Dakota Board of Operator Certification; administered by the Department of Agriculture and Natural Resources (DANR), Operator Certification Program",
        "authorityUrl": "https://danr.sd.gov/OfficeOfWater/OperatorCert/default.aspx",
        "examSystem": "unverified",
        "localLevels": "Class I, Class II, Class III, Class IV Water Treatment; special Class I Small Water Treatment System (SWTS).",
        "note": "ABC provision is established, but the opened sources do not explicitly establish standardized versus customized ABC exams or local-class-to-WPI-class correspondence. DANR links standardized-exam reference materials, which alone does not establish exam adoption. SWTS is a separate exam route for qualifying Class I groundwater systems serving fewer than 500 people; do not equate it with general Class I Water Treatment.",
        "sources": [
          {
            "evidence": "Questions 5–6 name all four operational categories, each with Class I–IV, and state: ‘Separate exams are given for each plant category and classification level’ and ‘The exams are provided by the Association of Boards of Certification (ABC).’ Question 19 identifies the Class I SWTS exam and its chlorination, regulations, aeration and groundwater scope.",
            "title": "DANR Water & Wastewater Operator Certification FAQ  -  revised June 2, 2022",
            "url": "https://danr.sd.gov/OfficeOfWater/OperatorCert/PDF/OpCert%20Summary.pdf"
          },
          {
            "evidence": "74:21:02:36 authorizes certification by operational category and classification; :38–39 identify four categories and Class I–IV. :71 recognizes Class I Small Water Treatment System or Class I-or-higher Water Treatment certification for qualifying small groundwater systems.",
            "title": "Administrative Rules of South Dakota, Article 74:21  -  Water System Operators",
            "url": "https://www.sdlegislature.gov/Rules/Administrative/27258"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "South Dakota Board of Operator Certification; administered by the Department of Agriculture and Natural Resources (DANR), Operator Certification Program",
        "authorityUrl": "https://danr.sd.gov/OfficeOfWater/OperatorCert/default.aspx",
        "examSystem": "unverified",
        "localLevels": "Class I, Class II, Class III, Class IV Water Distribution; rules additionally recognize Class I Very Small Water System Operator.",
        "note": "ABC provision is documented for this category, but standardized/customized identity and WPI class correspondence remain unverified. The rules recognize a Very Small Water System certificate for qualifying untreated groundwater systems below 500 people; the current FAQ instead directs these operators to Water Distribution, and the exam application has no separate Very Small Water System category. A currently offered separate exam is therefore unverified. All community and non-transient non-community water systems require distribution certification under the FAQ.",
        "sources": [
          {
            "evidence": "Questions 1, 5–6 explicitly cover Water Distribution, Class I–IV and ABC-provided separate category/level exams. Question 24 says a system serving fewer than 500 people without treatment is a ‘Very Small Water System’ and its operator ‘must have a Water Distribution certificate.’",
            "title": "DANR Water & Wastewater Operator Certification FAQ  -  revised June 2, 2022",
            "url": "https://danr.sd.gov/OfficeOfWater/OperatorCert/PDF/OpCert%20Summary.pdf"
          },
          {
            "evidence": "74:21:02:71 permits ‘Class I Very Small Water System Operator or a Class I (or higher) Water Distribution Operator’ for qualifying untreated small groundwater systems; treated small systems separately require Class I-or-higher distribution supervision.",
            "title": "Administrative Rules of South Dakota, Article 74:21  -  Water System Operators",
            "url": "https://www.sdlegislature.gov/Rules/Administrative/27258"
          },
          {
            "evidence": "Lists Water Distribution with exam levels I, II, III and IV. Separate categories include Small Water Treatment and Small WW System/Stabilization Pond, but not Very Small Water System.",
            "title": "DANR Application for Operator Certification Exam  -  March 2, 2022",
            "url": "https://danr.sd.gov/OfficeOfWater/OperatorCert/PDF/OpCertExamApp.pdf"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "South Dakota Board of Operator Certification; administered by the Department of Agriculture and Natural Resources (DANR), Operator Certification Program",
        "authorityUrl": "https://danr.sd.gov/OfficeOfWater/OperatorCert/default.aspx",
        "examSystem": "unverified",
        "localLevels": "Class I, Class II, Class III, Class IV Wastewater Treatment; special Class I Stabilization Pond, labeled Small WW System/Stabilization Pond on the exam application.",
        "note": "Wastewater-specific evidence establishes ABC-provided exams, not their standardized/customized identity or WPI class correspondence. Stabilization Pond/Small WW System is a distinct pond-focused exam route, not automatically equivalent to the general Class I exam. The FAQ requires certification for systems serving 500 or more people or equivalent; below 500, certification is voluntary and recommended.",
        "sources": [
          {
            "evidence": "Questions 1 and 3 distinguish mandatory and voluntary wastewater certification. Questions 5–6 expressly include Wastewater Treatment, Class I–IV and separate ABC-provided exams; question 6 distinguishes the Stabilization Pond exam from the regular exams.",
            "title": "DANR Water & Wastewater Operator Certification FAQ  -  revised June 2, 2022",
            "url": "https://danr.sd.gov/OfficeOfWater/OperatorCert/PDF/OpCert%20Summary.pdf"
          },
          {
            "evidence": "74:21:02:71 requires qualifying Class I pond-only systems serving 500 or more people to have a ‘Class I Stabilization Pond or Class I (or higher) Wastewater Treatment Operator.’",
            "title": "Administrative Rules of South Dakota, Article 74:21  -  Water System Operators",
            "url": "https://www.sdlegislature.gov/Rules/Administrative/27258"
          },
          {
            "evidence": "‘The Stabilization Pond class deals strictly w/ ponds’ and prepares for the Small WW System exam; Basic WW Treatment covers treatment other than ponds and prepares for Class I WW Treatment.",
            "title": "DANR Water and Wastewater Operator Certification",
            "url": "https://danr.sd.gov/OfficeOfWater/OperatorCert/default.aspx"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "South Dakota Board of Operator Certification; administered by the Department of Agriculture and Natural Resources (DANR), Operator Certification Program",
        "authorityUrl": "https://danr.sd.gov/OfficeOfWater/OperatorCert/default.aspx",
        "examSystem": "unverified",
        "localLevels": "Class I, Class II, Class III, Class IV Wastewater Collection.",
        "note": "Collection-specific evidence establishes separate ABC-provided category/level exams, but does not establish standardized/customized identity or WPI class correspondence. The FAQ requires certification for collection systems serving 500 or more people or equivalent; below 500, certification is voluntary and recommended. A pond-treatment certificate does not replace collection certification.",
        "sources": [
          {
            "evidence": "Questions 1 and 3 explicitly address wastewater collection certification thresholds. Questions 5–6 name Wastewater Collection, Class I–IV and separate ABC-provided exams for each category and classification.",
            "title": "DANR Water & Wastewater Operator Certification FAQ  -  revised June 2, 2022",
            "url": "https://danr.sd.gov/OfficeOfWater/OperatorCert/PDF/OpCert%20Summary.pdf"
          },
          {
            "evidence": "74:21:02:38–39 separately classify wastewater collection as Class I–IV. :71 requires the collection system associated with qualifying pond systems to have a Class I-or-higher Wastewater Collection Operator.",
            "title": "Administrative Rules of South Dakota, Article 74:21  -  Water System Operators",
            "url": "https://www.sdlegislature.gov/Rules/Administrative/27258"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "TN",
    "dedicatedCourseNeeds": [
      "Separate Biological/Natural System preparation aligned with Tennessee’s BNS outline: lagoons/natural processes, septic clarification, effluent disposal and NPDES permit awareness, disinfection, supporting equipment and laboratory work. Confirm the exam provider before labeling it state-specific or customized ABC.",
      "Separate Small Water System preparation using the state-listed Very Small Water System outline; do not route this credential as numbered WPI Class I–IV. Its local scope includes qualifying small distribution systems.",
      "A Tennessee regulatory/credential supplement should explain Chapter 0400-49-01, mandatory operator duties, local two-grade distribution/collection structure, and limited cross-credential recognition. The sources do not establish that Tennessee-specific law is tested on the numbered standardized exams."
    ],
    "limits": [
      "Eight official/state-designated source URLs opened; no search snippets, membership listings, reciprocity, or PSI delivery were used as standardized-exam proof.",
      "Evidence retrieved October 4, 2026 for the October 3, 2026 cutoff. The state page lists the Fall 2026 exam window; live pages are not archived October 3 snapshots, so exact day-level changes cannot be excluded.",
      "Only distribution Grade II and collection Grade II local-to-WPI Class correspondence was directly confirmed in opened PDFs. Other numbered mappings remain unverified, not unsupported.",
      "Biological/Natural System exam provenance is unresolved. No confirmed customized ABC exam was found; a separate local outline alone does not establish exam authorship."
    ],
    "name": "Tennessee",
    "streams": [
      {
        "authorityName": "Tennessee Department of Environment and Conservation, Division of Water Resources  -  Board of Water and Wastewater Operator Certification; administered through Fleming Training Center",
        "authorityUrl": "https://www.tn.gov/environment/program-areas/wr-water-resources/fleming-training-center/op-cert.html",
        "examSystem": "wpi-standardized",
        "localLevels": "Grade I, Grade II, Grade III, and Grade IV Water Treatment Plant Operator; Small Water System Operator",
        "note": "The state explicitly identifies standardized WPI water-treatment examinations and lists Grade I–IV standardized outlines. Small Water System is a separate credential, with a Very Small Water System outline listed under standardized criteria. Numerical shared routing remains unverified because the underlying treatment PDFs were not opened to confirm local Grade-to-WPI Class correspondence; this is not evidence of customized exams.",
        "sources": [
          {
            "evidence": "Says references are approved for ‘WPI’s standardized water treatment operator examinations’; under ‘WPI Standardized Need-to-Know Criteria’ lists Very Small Water System and Water Treatment Operator Grades I–IV.",
            "title": "TDEC  -  Study Guides & References: Water Treatment",
            "url": "https://www.tn.gov/environment/program-areas/wr-water-resources/fleming-training-center/references.html"
          },
          {
            "evidence": "Rule .07(1)(a)–(e) names Grade IV, III, II, and I Water Treatment Plant Operator and Small Water System Operator. Rule .04 requires certification for persons in direct charge.",
            "title": "Rules Governing Water and Wastewater Operator Certification, Chapter 0400-49-01",
            "url": "https://publications.tnsosfiles.com/rules/0400/0400-49/0400-49-01.20210711.pdf"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Tennessee Department of Environment and Conservation, Division of Water Resources  -  Board of Water and Wastewater Operator Certification; administered through Fleming Training Center",
        "authorityUrl": "https://www.tn.gov/environment/program-areas/wr-water-resources/fleming-training-center/op-cert.html",
        "examSystem": "wpi-standardized",
        "localLevels": "Grade I and Grade II Water Distribution System Operator; Small Water System Operator also serves qualifying small distribution systems",
        "note": "The authority explicitly identifies standardized WPI distribution exams. Its local Grade II link opens the Standardized Water Distribution Operator Class II outline, verifying Grade II → Class II. Grade I is listed, but its PDF correspondence was not checked within the source cap. No local distribution Grades III–IV are offered in the governing classifications. Small Water System is separate, not a numbered shared level.",
        "sources": [
          {
            "evidence": "Identifies ‘WPI’s standardized water distribution operator examinations’ and links Water Distribution Operator Grade I and Grade II under standardized criteria.",
            "title": "TDEC  -  Study Guides & References: Distribution Systems",
            "url": "https://www.tn.gov/environment/program-areas/wr-water-resources/fleming-training-center/references.html"
          },
          {
            "evidence": "The state’s Grade II link opens ‘Water Distribution Operator Class II Certification Exam’; the document says it reflects only the Standardized Class II exam and distinguishes customized services.",
            "title": "WPI Water Distribution Operator Class II Need-to-Know Criteria, hosted by TDEC",
            "url": "https://www.tn.gov/content/dam/tn/environment/water/ftc/references/ntk/tdec_ftc_wpi-ntk-ds2.pdf"
          },
          {
            "evidence": "Rule .07(1)(f) names Grades I & II Water Distribution System Operator; .06(3)(d) states Small Water Systems classification also serves as distribution certification for qualifying systems.",
            "title": "Chapter 0400-49-01  -  Distribution classifications",
            "url": "https://publications.tnsosfiles.com/rules/0400/0400-49/0400-49-01.20210711.pdf"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": [
          2
        ]
      },
      {
        "authorityName": "Tennessee Department of Environment and Conservation, Division of Water Resources  -  Board of Water and Wastewater Operator Certification; administered through Fleming Training Center",
        "authorityUrl": "https://www.tn.gov/environment/program-areas/wr-water-resources/fleming-training-center/op-cert.html",
        "examSystem": "unverified",
        "localLevels": "Grade I, Grade II, Grade III, and Grade IV Wastewater Treatment Plant Operator; Biological/Natural System Operator",
        "note": "Partial verification: the authority expressly identifies WPI standardized wastewater-treatment exams for Grades I–IV. Biological/Natural System has a separate Tennessee outline, but its exam provider and standardized/customized/state-authored status are not established. Overall stream is therefore marked unverified rather than assuming uniform standardized scope or a confirmed mixed system. Numbered shared levels are withheld because treatment Grade-to-WPI Class PDFs were not checked.",
        "sources": [
          {
            "evidence": "Explicitly says ‘WPI’s standardized wastewater treatment operator examinations Grades I - IV’; separately lists Biological/Natural System Operator with its own BNS Need-to-Know Criteria.",
            "title": "TDEC  -  Study Guides & References: Wastewater Treatment",
            "url": "https://www.tn.gov/environment/program-areas/wr-water-resources/fleming-training-center/references.html"
          },
          {
            "evidence": "Separate outline revised January 23, 2009 covers lagoons, septic tanks, effluent disposal/NPDES permits, disinfection, support equipment, laboratory tests, and general operating knowledge; does not identify a WPI standardized or customized exam.",
            "title": "Biological/Natural Systems Operator Need-To-Know Criteria",
            "url": "https://www.tn.gov/content/dam/tn/environment/water/ftc/references/ntk/tdec_ftc_ntk_bns.pdf"
          },
          {
            "evidence": "Rules .08 and .09 distinguish Biological/Natural systems from Grades I–IV wastewater treatment; .09(1)(e) separately names Biological/Natural System Operator.",
            "title": "Chapter 0400-49-01  -  Wastewater operator classifications",
            "url": "https://publications.tnsosfiles.com/rules/0400/0400-49/0400-49-01.20210711.pdf"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Tennessee Department of Environment and Conservation, Division of Water Resources  -  Board of Water and Wastewater Operator Certification; administered through Fleming Training Center",
        "authorityUrl": "https://www.tn.gov/environment/program-areas/wr-water-resources/fleming-training-center/op-cert.html",
        "examSystem": "wpi-standardized",
        "localLevels": "Grade I and Grade II Wastewater Collection System Operator",
        "note": "Collection is separately supported by wastewater-collection evidence, not inferred from drinking water. The local Grade II link opens the Standardized WPI Wastewater Collection Operator Class II outline, verifying Grade II → Class II. Grade I is listed but its PDF mapping was not checked. Certification is mandatory for persons in direct charge, not merely voluntary. Rules allow Grade I wastewater-treatment or Biological/Natural certification to serve certain Grade I collection systems with fewer than fifteen service connections; that is not proof of shared collection exam content.",
        "sources": [
          {
            "evidence": "Identifies ‘WPI’s standardized wastewater collection operator examinations’; standardized criteria links are Wastewater Collection Operator Grade I and Grade II.",
            "title": "TDEC  -  Study Guides & References: Collection Systems",
            "url": "https://www.tn.gov/environment/program-areas/wr-water-resources/fleming-training-center/references.html"
          },
          {
            "evidence": "The state’s Grade II link opens ‘Wastewater Collection Operator Class II Certification Exam’; expressly says the outline reflects only the Standardized Class II exam, not customized exams.",
            "title": "WPI Wastewater Collection Operator Class II Need-to-Know Criteria, hosted by TDEC",
            "url": "https://www.tn.gov/content/dam/tn/environment/water/ftc/references/ntk/tdec_ftc_wpi-ntk-cs2.pdf"
          },
          {
            "evidence": "Rule .09(1)(f) names Grades I & II Wastewater Collection System Operator; .04(2) requires a qualifying certificate for persons in direct charge of collection systems; .08 provides limited small-collection cross-credential recognition.",
            "title": "Chapter 0400-49-01  -  Collection qualifications and required certification",
            "url": "https://publications.tnsosfiles.com/rules/0400/0400-49/0400-49-01.20210711.pdf"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": [
          2
        ]
      }
    ]
  },
  {
    "code": "TX",
    "dedicatedCourseNeeds": [
      "Texas water-treatment alignment: maintain separate Class C/B Groundwater and Surface Water outlines, a foundational Class D outline and comprehensive Class A outline; include the cited 30 TAC Chapter 30 Subchapters A/K and Chapter 290 Subchapters D/F. Do not label these WPI-equivalent courses without further evidence.",
      "Texas water-distribution alignment: dedicated Class C and B distribution outlines, preserving their cumulative Class D/C prerequisites; include Texas regulatory requirements, storage/distribution maintenance, cross-connection control, disinfection and distribution calculations.",
      "Texas water-training prerequisite information: TCEQ requires resiliency training for all water operators beginning April 1, 2024. Keep this approval/prerequisite requirement separate from any claim about exam-question content or Echelon course approval.",
      "Texas wastewater-treatment alignment: separate D/C/B/A outlines covering TCEQ permitting/self-reporting, Chapter 217 design criteria, facility/operator categorization and class-specific treatment/process-control knowledge; preserve Class A's expressly listed 75-90 Rule topic.",
      "Texas wastewater-collection alignment: separate I/II/III outlines covering collection-specific operations, pumping, traffic safety, Chapter 217, system staffing/categorization and progressively advanced inspection, maintenance and design topics; do not invent a Texas Collection Class IV."
    ],
    "limits": [
      "Requested cutoff: October 3, 2026. Live official sources were accessed October 4, 2026; the displayed licensing/exam pages have pre-cutoff 2026 modification dates. An archived October 3 snapshot was not acquired.",
      "Eight official source URLs were opened, meeting the exploration cap; evidence comes from opened pages, not search snippets.",
      "No opened official source explicitly confirmed standardized WPI/ABC use or local-grade-to-WPI-class correspondence for any stream. All verifiedSharedLevels are therefore empty. Unverified does not mean unsupported or not offered.",
      "Texas-specific need-to-know outlines and TCEQ exam revision support local preparation needs, but do not conclusively distinguish a state-authored bank from customized ABC exams. CBT administration alone is not evidence of standardized exam adoption.",
      "Official pages contain delivery-list inconsistencies: the water/wastewater licensing pages describe Class A CBT exams, while the general CBT list omits Class A; collection II/III licensing sections retain regional-office links although the current exam page says all TCEQ occupational exams use approved CBT centers. These do not establish exam provenance."
    ],
    "name": "Texas",
    "streams": [
      {
        "authorityName": "Texas Commission on Environmental Quality (TCEQ), Occupational Licensing",
        "authorityUrl": "https://www.tceq.texas.gov/licensing/licenses/waterlic",
        "examSystem": "unverified",
        "localLevels": "Class D Water; Class C Groundwater Operator; Class C Surface Water Operator; Class B Groundwater Operator; Class B Surface Water Operator; Class A Water Operator. Also Provisional Water Class D.",
        "note": "Mandatory licensing for public-water-system process-control duties, unless exempt. Classes C and B have separate groundwater and surface-water tracks; Class A is comprehensive. Official sources establish TCEQ licensing, local exam criteria and agency exam revision, but do not explicitly identify standardized WPI/ABC adoption, customized ABC provenance, or a local-to-WPI class correspondence. Exam-bank identity therefore remains unverified, not evidence of nonparticipation.",
        "sources": [
          {
            "evidence": "Operators performing process-control duties in production or distribution must be licensed with TCEQ unless exempt. Lists Classes A–D, B/C Surface, Groundwater and Distribution, and Provisional Water Class D.",
            "title": "Occupational Licenses: Water System Operators",
            "url": "https://www.tceq.texas.gov/licensing/licenses/waterlic"
          },
          {
            "evidence": "Publishes separate B/C Groundwater and Surface Water criteria. Class A requires knowledge of the Class B Groundwater, Water Distribution and Surface Water criteria. Criteria expressly include Texas licensing and drinking-water rules.",
            "title": "Public Water System Operators: What Applicants for Licensing Need to Know",
            "url": "https://www.tceq.texas.gov/licensing/licenses/waterworksntk"
          },
          {
            "evidence": "July 2022 statement: TCEQ's Occupational Licensing section 'has been revising and converting licensing exams' to CBT. This establishes agency involvement, not standardized versus customized exam provenance.",
            "title": "TCEQ Occupational Licensing Exams are Going Paperless!",
            "url": "https://www.tceq.texas.gov/assistance/resources/the-advocate-1/tceq-occupational-licensing-exams-are-going-paperless"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Texas Commission on Environmental Quality (TCEQ), Occupational Licensing",
        "authorityUrl": "https://www.tceq.texas.gov/licensing/licenses/waterlic",
        "examSystem": "unverified",
        "localLevels": "Class C Water Distribution; Class B Water Distribution. Common water-system licenses: Class D Water and Class A Water Operator; also Provisional Water Class D. No separately named Distribution Class A or D in the opened criteria.",
        "note": "Distribution is within mandatory public-water-system licensing, unless exempt; the B/C distribution exams are distinct local specialties. Class D is foundational across water operations and Class A combines all three B specialties. No explicit standardized WPI/ABC scope or class mapping was established; local lettering must not be converted automatically to WPI Classes 1–4.",
        "sources": [
          {
            "evidence": "Names Class B Distribution and Class C Distribution requirements separately from surface water and groundwater. Class A training includes Water Distribution; Class D is a general water license.",
            "title": "Occupational Licenses: Water System Operators",
            "url": "https://www.tceq.texas.gov/licensing/licenses/waterlic"
          },
          {
            "evidence": "Class C Water Distribution criteria build on Class D; Class B Water Distribution builds on Class C Distribution. The outline includes Texas rules, storage/distribution maintenance, cross-connections, disinfection and math.",
            "title": "Public Water System Operators: What Applicants for Licensing Need to Know",
            "url": "https://www.tceq.texas.gov/licensing/licenses/waterworksntk"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Texas Commission on Environmental Quality (TCEQ), Occupational Licensing",
        "authorityUrl": "https://www.tceq.texas.gov/licensing/licenses/wwlic",
        "examSystem": "unverified",
        "localLevels": "Wastewater Class D; Wastewater Class C; Wastewater Class B; Wastewater Class A. Also Provisional Wastewater Class D.",
        "note": "Treatment licensing is a regulated program: the required chief-operator class depends on facility category. The official treatment exam outlines are explicitly Texas-focused, but they do not establish whether the underlying bank is state-authored or customized ABC, nor standardized WPI/ABC adoption or class equivalence. Do not infer wastewater exam identity from drinking-water evidence.",
        "sources": [
          {
            "evidence": "Lists Wastewater Classes A, B, C, D and Provisional Wastewater Class D. Requires facility operation by a licensed operator at the required level or higher; directs applicants to training manuals and Texas licensing/operating rules.",
            "title": "Occupational Licenses: Wastewater Treatment Plant and Collection System Operators",
            "url": "https://www.tceq.texas.gov/licensing/licenses/wwlic"
          },
          {
            "evidence": "Provides separate treatment exam criteria for D, C, B and A. Includes TCEQ permits, self-reporting, Chapter 217 design criteria and facility categorization; Class A specifically includes the domestic-permit '75-90 Rule.'",
            "title": "Wastewater Operators: What Applicants for Licensing Need to Know",
            "url": "https://www.tceq.texas.gov/licensing/licenses/wastewaterntk.html"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Texas Commission on Environmental Quality (TCEQ), Occupational Licensing",
        "authorityUrl": "https://www.tceq.texas.gov/licensing/licenses/wwlic",
        "examSystem": "unverified",
        "localLevels": "Collection Class I; Collection Class II; Collection Class III.",
        "note": "Separate collection licenses are offered; no Class IV is listed. Direct supervisors of domestic collection operation/maintenance crews must hold either a wastewater collection license or a wastewater treatment license, with the required supervisory level satisfied. This is not simply voluntary certification. Roman numerals I–III do not prove correspondence to standardized WPI Classes 1–3; explicit exam provenance and mapping remain unverified.",
        "sources": [
          {
            "evidence": "Lists Collection Classes I, II and III. States that direct supervisors must be licensed collection or treatment operators, and at least one collection supervisor must hold the class required for the system category.",
            "title": "Occupational Licenses: Wastewater Treatment Plant and Collection System Operators",
            "url": "https://www.tceq.texas.gov/licensing/licenses/wwlic"
          },
          {
            "evidence": "Publishes collection-specific I, II and III exam criteria, including TCEQ staffing/categorization rules and Chapter 217. Class II includes water/sewer clearances; Class III includes alternative materials when clearances cannot be maintained, flow velocities, SCADA and preventive-maintenance programs.",
            "title": "Wastewater Operators: What Applicants for Licensing Need to Know",
            "url": "https://www.tceq.texas.gov/licensing/licenses/wastewaterntk.html"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "UT",
    "dedicatedCourseNeeds": [
      "Drinking-water treatment requires Utah-specific outline and rules review for T1–T4 before shared-course routing; DDW provides Basic Treatment for T1–T4 and Advanced Treatment for T3–T4.",
      "Drinking-water distribution requires Utah-specific outline and rules review for SS and D1–D4; preserve a separate Small System route and advanced D3–D4 content.",
      "Wastewater Small Lagoon System needs a separate route and review of Utah's linked 2025 Small Lagoon System Need-to-Know Criteria; its exam provider/status remains unverified and it must not be mapped automatically to WPI Class I."
    ],
    "limits": [
      "Eight official/state-designated source opens were used; exploration stopped at the requested cap. Wastewater local grade names and grade-to-WPI-class mapping remain unverified.",
      "Standardized WPI use is verified for the regular wastewater program, but the Small Lagoon exception's exam authorship and standardized/customized status were not explicitly established. Drinking-water exam authorship also remains ambiguous.",
      "Live sources were accessed October 4, 2026 for the requested October 3, 2026 cutoff; an archived snapshot proving that exact day's wording was not established."
    ],
    "name": "Utah",
    "streams": [
      {
        "authorityName": "Utah Department of Environmental Quality, Division of Drinking Water",
        "authorityUrl": "https://deq.utah.gov/ddw/operator-certification",
        "examSystem": "unverified",
        "localLevels": "Treatment Grade I (T1), Treatment Grade II (T2), Treatment Grade III (T3), Treatment Grade IV (T4)",
        "note": "Official DDW materials establish Utah-specific grade outlines and examination governance, but the opened sources do not explicitly establish whether the exams are state-developed, customized ABC/WPI, or standardized WPI. Do not route T1–T4 as verified shared WPI classes.",
        "sources": [
          {
            "evidence": "The grade table explicitly lists Treatment Grade I (T1) through Treatment Grade IV (T4). Exam categories are Math, Operation and Maintenance, Pumps, Chemical Feed, Rules, and Safety and Security; separate basic and advanced treatment study guides are provided.",
            "title": "Study Help: Division of Drinking Water",
            "url": "https://deq.utah.gov/ddw/study-help"
          },
          {
            "evidence": "The Utah commission includes treatment and distribution representatives and makes decisions about 'what topics ... will be tested on' and program operation. This establishes local oversight, not explicit exam authorship or standardized WPI use.",
            "title": "Operator Certification Commission and Rules",
            "url": "https://deq.utah.gov/ddw/operator-certification-commission-rules"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Utah Department of Environmental Quality, Division of Drinking Water",
        "authorityUrl": "https://deq.utah.gov/ddw/operator-certification",
        "examSystem": "unverified",
        "localLevels": "Small System (SS); Distribution Grade I (D1), Distribution Grade II (D2), Distribution Grade III (D3), Distribution Grade IV (D4)",
        "note": "DDW explicitly lists SS and D1–D4 and supplies local examination outlines. The opened sources do not distinguish state-developed exams from customized ABC/WPI exams or confirm standardized WPI examinations. SS has a distinct outline and must not be treated as WPI Class I.",
        "sources": [
          {
            "evidence": "The distribution table explicitly lists Small System (SS) and Distribution Grade I (D1) through Grade IV (D4). Basic Distribution applies to SS and D1–D4; Advanced Distribution applies to D3–D4.",
            "title": "Study Help: Division of Drinking Water",
            "url": "https://deq.utah.gov/ddw/study-help"
          },
          {
            "evidence": "Utah's commission determines examination topics and program operation; the page links R309-300 certification rules and operator certification policies but does not identify a standardized WPI exam.",
            "title": "Operator Certification Commission and Rules",
            "url": "https://deq.utah.gov/ddw/operator-certification-commission-rules"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Utah Department of Environmental Quality, Division of Water Quality",
        "authorityUrl": "https://deq.utah.gov/dwq/ww-opcert",
        "examSystem": "unverified",
        "localLevels": "Small Lagoon System explicitly identified; current regular treatment grade names were not enumerated in the opened sources.",
        "note": "DWQ explicitly confirms standardized WPI exams for its wastewater program, including treatment. However, it separately identifies Utah's Small Lagoon System exam and a state-created outline without explicitly identifying that exam's provider or standardized/customized status. The entire treatment stream is therefore marked unverified rather than assuming a uniform exam system. Regular local-grade-to-WPI-class correspondence was not established.",
        "sources": [
          {
            "evidence": "'Utah’s Wastewater Operator Certification Program uses standardized exams produced by Water Professionals International (WPI),' formerly ABC. Separately: the program 'has also created Need-to-Know Criteria for Utah’s Small Lagoon System exam,' linking its 2025 criteria.",
            "title": "Wastewater Exam Preparation Information and Suggestions",
            "url": "https://deq.utah.gov/dwq/ww-opcert-exam-prep"
          },
          {
            "evidence": "The page expressly addresses both 'wastewater treatment and collection exams' and states that examinations cover WPI Need-to-Know Criteria. It does not enumerate local grades or map them to WPI classes.",
            "title": "Certification Exams: Wastewater Operator Certification Program",
            "url": "https://deq.utah.gov/dwq/ww-opcert-exams"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Utah Department of Environmental Quality, Division of Water Quality",
        "authorityUrl": "https://deq.utah.gov/dwq/ww-opcert",
        "examSystem": "wpi-standardized",
        "localLevels": "Current collection grade names not verified in the opened official sources.",
        "note": "Standardized WPI use is explicitly supported by DWQ's wastewater preparation page together with its collection-specific examination description - not by drinking-water evidence or PSI delivery. Shared levels remain empty because the opened sources did not establish local grade names and their correspondence to WPI Classes I–IV.",
        "sources": [
          {
            "evidence": "The program explicitly 'uses standardized exams produced by Water Professionals International (WPI)' and says the relevant work experience includes 'collection and wastewater treatment.'",
            "title": "Wastewater Exam Preparation Information and Suggestions",
            "url": "https://deq.utah.gov/dwq/ww-opcert-exam-prep"
          },
          {
            "evidence": "The state explicitly identifies wastewater 'treatment and collection exams' and their WPI Need-to-Know examination content.",
            "title": "Certification Exams: Wastewater Operator Certification Program",
            "url": "https://deq.utah.gov/dwq/ww-opcert-exams"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "VT",
    "dedicatedCourseNeeds": [
      "Vermont drinking-water local-class and regulatory overlay: groundwater Class 2 versus advanced-treatment Class 3, surface-water/GWUDI Class 4A/B/C, and the Vermont Water Supply Rule. Obtain actual Class 2/3/4 exam outlines before declaring these unique or shared WPI exams; 1A/1B are not examination-preparation routes.",
      "Separate Class D routing and local requirements, including the July 1, 2029 implementation deadline and restricted legacy training alternative. Obtain the D examination outline rather than assigning an unsupported WPI distribution level.",
      "Separate outline verification for Domestic V and Industrial Paper/Dairy/Metal I, II and IV. Their distinct local license types/grades are explicit, but their unique-exam syllabi are not verified. Include applicable OPR licensing rules and DEC facility/scope requirements in a Vermont regulatory overlay.",
      "For collection, verify NEWEA’s current voluntary-program grade labels and exam outlines before preparing a dedicated regional-exam route; no mandatory Vermont or shared WPI collection route is established."
    ],
    "limits": [
      "Eight source URLs were opened, respecting the exploration cap. Findings use opened text, not search snippets.",
      "Research targeted October 3, 2026; live pages were retrieved October 4, 2026. No archived October 3 snapshot was obtained. The drinking-water exam page explicitly contains the 2026 schedule.",
      "No opened source explicitly establishes standardized WPI/ABC scope together with local-grade correspondence; all verifiedSharedLevels therefore remain empty. ‘Unverified’ denotes an evidence gap, not proof that shared or customized exams are absent.",
      "The undefined ‘4A1’ entry and exact current voluntary collection grade labels remain unresolved. NEWEA’s Vermont resource is used only for its collection-program statement, not its superseded state treatment authority or requirements."
    ],
    "name": "Vermont",
    "streams": [
      {
        "authorityName": "Vermont Department of Environmental Conservation, Drinking Water & Groundwater Protection Division (DWGPD)",
        "authorityUrl": "https://dec.vermont.gov/water/drinking-water/public-water-system-operator-certification",
        "examSystem": "unverified",
        "localLevels": "Class 1A, Class 1B, Class 2, Class 3, Class 4A, Class 4B, Class 4C. The initial-certification table additionally lists ‘4A1’ without defining it.",
        "note": "Classes 1A and 1B explicitly require no examination. Exams are offered as Class 2, Class 3 and Class 4; Class 4A/B/C certification distinctions depend on population served. DEC identifies ABC/PSI computer-based delivery but does not establish standardized versus customized ABC construction or local-class-to-WPI-class correspondence. Do not route Vermont Class 2/3/4 automatically to similarly numbered WPI classes.",
        "sources": [
          {
            "evidence": "‘Public drinking water systems are required to have an Operator certified by the DWGPD.’ Table 1 lists 1A, 1B, 2, 3 and 4A/4B/4C; 4A serves 25–500, 4B 501–3,300, and 4C more than 3,300 people. Table 2 marks examination ‘No’ for 1A/1B and ‘Yes’ for 2/3/4 certifications.",
            "title": "Public Water System Operator Certification",
            "url": "https://dec.vermont.gov/water/drinking-water/public-water-system-operator-certification"
          },
          {
            "evidence": "The 2026 exam page lists Class 2, 3, 4 and D appointments and states that ‘The Association of Boards of Certification (ABC) and PSI Online provides certified computer-based exams.’ It does not call these standardized exams or identify WPI class equivalencies.",
            "title": "Public Water System Operator Exams",
            "url": "https://dec.vermont.gov/water/drinking-water/public-water-system-operator-certification/public-water-system-operator-exams"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Vermont Department of Environmental Conservation, Drinking Water & Groundwater Protection Division (DWGPD)",
        "authorityUrl": "https://dec.vermont.gov/water/drinking-water/public-water-system-operator-certification",
        "examSystem": "unverified",
        "localLevels": "Class D; an additional restricted legacy D certification pathway is described, not a numbered grade ladder.",
        "note": "Class D is separate from treatment. The page describes expanded D-operator requirements effective February 24, 2024, with compliance required by July 1, 2029 for specified systems. Eligible experienced treatment operators may use state-provided training instead of the D examination for restricted legacy status. ABC/PSI delivery does not verify standardized exam scope, and no correspondence between Class D and WPI Classes I–IV was established.",
        "sources": [
          {
            "evidence": "Table 1 lists D separately and states ‘Systems are required to have a D operator no later than July 1, 2029’ when specified criteria apply. ‘Operators who have passed a treatment exam (2, 3, 4)’ with qualifying experience ‘May attend a State-provided training class instead of the exam’ for system-restricted legacy status.",
            "title": "Public Water System Operator Certification",
            "url": "https://dec.vermont.gov/water/drinking-water/public-water-system-operator-certification"
          },
          {
            "evidence": "The official exam page separately offers ‘VT Class D’ alongside treatment examinations, but its ABC/PSI statement does not specify standardized/customized construction or a WPI distribution class.",
            "title": "Public Water System Operator Exams",
            "url": "https://dec.vermont.gov/water/drinking-water/public-water-system-operator-certification/public-water-system-operator-exams"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Vermont Secretary of State, Office of Professional Regulation (OPR), Pollution Abatement Facility Operators",
        "authorityUrl": "https://sos.vermont.gov/pollution-abatement-facility-operators/",
        "examSystem": "unverified",
        "localLevels": "Domestic I, II, III, IV, V; Industrial Paper I, II, IV; Industrial Dairy I, II, IV; Industrial Metal I, II, IV (14 license grades total).",
        "note": "OPR, not DEC, issues the licenses; DEC retains facility classification and scope-of-authority responsibilities. The rules explicitly pair local license grades with Grade 1–5 examinations, but do not identify standardized WPI/ABC exams. OPR’s FAQ establishes PSI/AMP administration only. Neither standardized/customized construction nor a WPI equivalency for any domestic or industrial grade was verified; Domestic V must not be collapsed into WPI Class IV.",
        "sources": [
          {
            "evidence": "‘As of January 1, 2017, OPR manages ALL pollution abatement facility operator licenses.’ DEC states it no longer issues or provides administrative support for these licenses and identifies domestic facility classes 1–5 and industrial dairy/metal/paper classes 1, 2 and 4.",
            "title": "Wastewater Treatment (Pollution Abatement) Facility Operator License",
            "url": "https://dec.vermont.gov/watershed/wastewater/wastewater-treatment-pollution-abatement-facility-operator-license"
          },
          {
            "evidence": "Rule 4-2: ‘Operator licenses are available in 14 grades.’ Table 1 explicitly lists Domestic I–V and Industrial Paper, Dairy and Metal I, II, IV. Table 2 pairs license grades I/II/III/IV/V with examinations Grade 1/2/3/4/5. Rule 2-3 states DEC rules govern license scope.",
            "title": "Administrative Rules for Pollution Abatement Facility Operators, effective August 1, 2017",
            "url": "https://outside.vermont.gov/dept/sos/office_professional_regulation/professions/pollution_abatement_facility_operator/pollution_abatement_facility_operator_administrative_rules.pdf"
          },
          {
            "evidence": "OPR states it sends approved applicants’ information to ‘PSI/AMP’ and receives examination results. This establishes exam administration, not standardized WPI/ABC content.",
            "title": "Pollution Abatement Facility Operator FAQs",
            "url": "https://sos.vermont.gov/pollution-abatement-facility-operators/operator-faqs"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "New England Water Environment Association (NEWEA), Collection Systems Certification Committee  -  voluntary program; no mandatory Vermont collection-certification authority verified",
        "authorityUrl": "https://www.newea.org/careers/professional-development/resources-vermont/",
        "examSystem": "unverified",
        "localLevels": "Four voluntary certification grades; exact current grade labels were not verified in the opened source.",
        "note": "NEWEA’s Vermont resource explicitly identifies a separate voluntary collection certification program. It does not establish standardized ABC/WPI use, customized ABC use, or exam authorship. Its treatment-licensing material is outdated relative to the official OPR transfer, so current collection grade names and program details require confirmation. Do not infer collection certification from either drinking-water or wastewater-treatment exams.",
        "sources": [
          {
            "evidence": "‘Certification for Collection System Operators is a voluntary program administered through the New England Water Environment Association, Inc.’ The page says there are ‘four Grades’ based on complexity and flow, and that examinations are held by NEWEA’s Collection Systems Certification Committee. It does not identify WPI/ABC standardized exams.",
            "title": "Resources – Vermont: Vermont Wastewater and Drinking Water Certification and Training Requirements",
            "url": "https://www.newea.org/careers/professional-development/resources-vermont/"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "VA",
    "dedicatedCourseNeeds": [
      "Virginia Class 5 and Class 6 waterworks pathways need separately validated local exam outlines before course routing; the opened sources do not support substituting standardized WPI Water Distribution I–IV courses or labeling these exams customized/state-specific.",
      "A Virginia licensing/regulatory supplement should distinguish Class 5 versus Class 6 no/limited-treatment systems, operator attendance and license operating scope under 12VAC5-590-461 and 18VAC160-30. Treatment route labels must implement the reversed Virginia-to-WPI class mapping. These are supported local distinctions, not proof of additional state-specific exam questions."
    ],
    "limits": [
      "Target date: October 3, 2026. Live sources were accessed October 4, 2026; an exact October 3 historical snapshot was not obtained. The cited licensing amendments took effect January 16, 2026, and VDH guidance was updated August 26, 2026.",
      "Eight source opens were used. All factual evidence comes from opened state-authority pages or Virginia-designated exam resources, not search snippets.",
      "DPOR's explicit standardized-exam links plus class-by-class conversions support the treatment findings. PSI delivery alone, ABC affiliation, reciprocity or generic ABC content were not used as standardized-exam proof.",
      "The WPI pages link both 2019 and 2025 criteria; the opened Virginia sources do not specify which exam edition is active. Do not claim universal Virginia adoption of the 2025 blueprint.",
      "Class 5/6 exam construction and any separate mandatory or voluntary collection credential remain unverified; no customized-exam or not-offered conclusion is asserted."
    ],
    "name": "Virginia",
    "streams": [
      {
        "authorityName": "Virginia Department of Professional and Occupational Regulation (DPOR), Board for Waterworks and Wastewater Works Operators and Onsite Sewage System Professionals",
        "authorityUrl": "https://www.dpor.virginia.gov/Boards/WWWOOSSP",
        "examSystem": "wpi-standardized",
        "localLevels": "Waterworks Operator Class 1, Class 2, Class 3, Class 4; the same licensing category also includes Class 5 and Class 6 for no/limited-treatment waterworks.",
        "note": "Standardized finding is limited to Virginia Classes 1–4. Explicit correspondence is VA Class 4 → WPI/ABC I, Class 3 → II, Class 2 → III, Class 1 → IV; verifiedSharedLevels denotes WPI classes, not identical Virginia class numbers. Class 1 is Virginia's highest grade. Class 5/6 exam construction remains unverified and is addressed under water-distribution; do not extend this standardized finding to them. VDH regulates waterworks but explicitly does not issue operator licenses or give examinations.",
        "sources": [
          {
            "evidence": "Under Education & Exams, DPOR designates the Standardized Water Treatment Operator Exams page as its CIB and states: 'VA Waterwork Class 4 = ABC Water Treatment Operator Class I,' followed by Class 3=II, Class 2=III and Class 1=IV.",
            "title": "DPOR  -  Board for Waterworks and Wastewater Works Operators and Onsite Sewage System Professionals",
            "url": "https://www.dpor.virginia.gov/Boards/WWWOOSSP"
          },
          {
            "evidence": "'Need-to-Know Criteria outline the content that will be covered on WPI’s standardized examinations provided through ABC Testing, a WPI service.' The page offers both 2025 and 2019 criteria.",
            "title": "WPI  -  Standardized Water Treatment Operator Exams (DPOR-designated exam resource)",
            "url": "https://www.gowpi.org/services/abc-testing/standardized-exams/standardized-water-treatment-operator-exams/"
          },
          {
            "evidence": "'Waterworks Operator Licenses are issued by the Board ... part of ... DPOR'; 'The Health Department is not involved with issuing licenses or giving examinations.' Last updated August 26, 2026.",
            "title": "VDH  -  Licensure Information",
            "url": "https://www.vdh.virginia.gov/drinking-water/office-of-drinking-water/licensure-information/"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": [
          1,
          2,
          3,
          4
        ]
      },
      {
        "authorityName": "Virginia DPOR, Board for Waterworks and Wastewater Works Operators and Onsite Sewage System Professionals (waterworks licensing pathway, not a separately verified distribution credential)",
        "authorityUrl": "https://www.dpor.virginia.gov/Boards/WWWOOSSP",
        "examSystem": "unverified",
        "localLevels": "Waterworks Operator Class 5 and Class 6 are the distribution-experience licensing pathways; these are not established WPI Water Distribution Class I–IV equivalents.",
        "note": "Virginia rules expressly accept distribution-system experience only for Class 5/6 waterworks applicants. These local classes cover no-treatment or specified limited-treatment systems, with higher waterworks licenses also authorizing lower-class facilities. PSI offers distinct Virginia Class 5 and Class 6 exams, but the opened sources do not establish whether those exams are WPI-customized or state-specific, nor any standardized WPI distribution mapping. No separate voluntary distribution certification was verified.",
        "sources": [
          {
            "evidence": "Section 95(C): 'Experience operating and maintaining water distribution systems will only be considered for Class 5 or Class 6 waterworks operator license applicants.' Section 370 defines local waterworks license operating scope. Amendments effective January 16, 2026.",
            "title": "18VAC160-30  -  Waterworks and Wastewater Works Operators Licensing Regulations",
            "url": "https://law.lis.virginia.gov/admincodefull/title18/agency160/chapter30/"
          },
          {
            "evidence": "Class 5 serves 400 or more persons and Class 6 fewer than 400; each can provide no treatment or specified hypochlorination, corrosion-control or sequestration processes. Classified waterworks require an appropriately classified Virginia operator license.",
            "title": "12VAC5-590-461  -  Classification of waterworks, operator requirements, and operator attendance",
            "url": "https://law.lis.virginia.gov/admincode/title12/agency5/chapter590/section461/"
          },
          {
            "evidence": "Lists 'Virginia Waterworks Operator Class 5' and 'Virginia Waterworks Operator Class 6' as separate available tests. This establishes exam availability, not standardized WPI exam identity.",
            "title": "PSI  -  Virginia Board Available Tests",
            "url": "https://test-takers.psiexams.com/abc-va/test"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Virginia DPOR, Board for Waterworks and Wastewater Works Operators and Onsite Sewage System Professionals",
        "authorityUrl": "https://www.dpor.virginia.gov/Boards/WWWOOSSP",
        "examSystem": "wpi-standardized",
        "localLevels": "Wastewater Works Operator Class 1, Class 2, Class 3, Class 4.",
        "note": "DPOR explicitly maps VA Class 4 → WPI/ABC Wastewater Treatment I, Class 3 → II, Class 2 → III and Class 1 → IV. verifiedSharedLevels denotes WPI classes. This is independently supported wastewater-treatment evidence, not an inference from drinking water. It does not establish a collection-system exam route.",
        "sources": [
          {
            "evidence": "Designates the Standardized Wastewater Treatment Operator Exams page as the Wastewater Works Classes 1–4 CIB and gives all four conversions: VA 4=ABC I, VA 3=II, VA 2=III, VA 1=IV.",
            "title": "DPOR  -  Board Education & Exams",
            "url": "https://www.dpor.virginia.gov/Boards/WWWOOSSP"
          },
          {
            "evidence": "'Need-to-Know Criteria outline the content that will be covered on WPI’s standardized examinations provided through ABC Testing, a WPI service.' Both 2025 and 2019 criteria are linked.",
            "title": "WPI  -  Standardized Wastewater Treatment Operator Exams (DPOR-designated exam resource)",
            "url": "https://www.gowpi.org/services/abc-testing/standardized-exams/standardized-wastewater-treatment-operator-exams/"
          },
          {
            "evidence": "Section 360 describes wastewater works license scope by Class 4, Class 3, Class 2 and Class 1, referring to classified treatment works; Class 1 can operate all four classifications.",
            "title": "18VAC160-30  -  Operator Licensing Regulations",
            "url": "https://law.lis.virginia.gov/admincodefull/title18/agency160/chapter30/"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": [
          1,
          2,
          3,
          4
        ]
      },
      {
        "authorityName": "Separate wastewater-collection certifying authority unverified; DPOR's Board for Waterworks and Wastewater Works Operators and Onsite Sewage System Professionals is the verified wastewater works licensor",
        "authorityUrl": "https://www.dpor.virginia.gov/Boards/WWWOOSSP",
        "examSystem": "unverified",
        "localLevels": "No collection-specific local certification grades verified. Wastewater Works Operator Classes 1–4 are established treatment-license grades, not verified collection equivalents.",
        "note": "The opened official licensing rules and designated exam catalog establish wastewater works/treatment licenses and exams but do not establish a distinct mandatory or voluntary wastewater-collection certification, authority or WPI collection-class mapping. Marked unverified, not not-offered: absence from this catalog is not proof that no collection credential exists.",
        "sources": [
          {
            "evidence": "Section 10 defines the board's license categories as waterworks and wastewater works. Section 360 specifies wastewater works Classes 1–4 by treatment-works classifications, without identifying separate collection certification grades.",
            "title": "18VAC160-30  -  Operator Licensing Regulations",
            "url": "https://law.lis.virginia.gov/admincodefull/title18/agency160/chapter30/"
          },
          {
            "evidence": "The catalog lists Virginia Wastewater Works Operator Classes 1–4 and Waterworks Operator Classes 1–6; no separately titled wastewater-collection test appears in the opened catalog.",
            "title": "PSI  -  Virginia Board Available Tests",
            "url": "https://test-takers.psiexams.com/abc-va/test"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "WA",
    "dedicatedCourseNeeds": [
      "Keep WDS separate from WDM 1–4: use the DOH-linked WPI Very Small Water System Operator outline, not the Class I distribution outline. This is a distinct exam track, not evidence of a Washington-customized exam.",
      "If supporting voluntary WWCPA certification, use its local Specialist/SIT pathways rather than automatic WPI I–IV routing. A separate WWC-IV oral-preparation track is supported: maintenance/operation of collection facilities, written reports, plan review, operational budgets, safety programs, personnel supervision and utility public affairs. WWC-SIT uses the Specialist I exam; obtain the current I–III outlines/provider confirmation before defining shared or unique exam courses."
    ],
    "limits": [
      "As-of target: October 3, 2026. Live pages were acquired October 4, 2026; no archived October 3 snapshot was obtained. Relevant visible document revisions and dated program updates cited here precede the cutoff.",
      "Eight source opens used. No search snippet, exam-delivery vendor, WPI membership, reciprocity acceptance or generic ABC study-content link was treated as proof of a standardized Washington exam.",
      "WWCPA evidence is the voluntary certifier's own governing document, not proof that Washington designated it as a state exam administrator. Mandatory collection certification and state designation remain unverified.",
      "No Washington-customized treatment exam or Washington-law exam supplement was established. Wastewater-treatment routing requires explicit current exam adoption and Group-to-Class mapping before shared WPI levels can be assigned."
    ],
    "name": "Washington",
    "streams": [
      {
        "authorityName": "Washington State Department of Health (DOH)",
        "authorityUrl": "https://doh.wa.gov/community-and-environment/drinking-water/regulation-and-compliance/waterworks-operator-certification",
        "examSystem": "wpi-standardized",
        "localLevels": "Water Treatment Plant Operator (WTPO) 1, 2, 3, 4; WTPO in Training 1, 2, 3, 4.",
        "note": "DOH identifies these waterworks examinations as standardized WPI examinations. Its testing guide lists the numbered WTPO credentials and directs candidates to the official 2025 exam resources, which supply the corresponding WPI standardized Water Treatment Classes I–IV. Shared levels refer to full WTPO 1–4; in-training is a separate credential status, not an additional shared level.",
        "sources": [
          {
            "evidence": "Lists Water Treatment Plant Operator and In-Training 1, 2, 3, 4; describes 'these standardized water operator certification exams' and names Water Professionals International (WPI), directing candidates to DOH's 2025 exam resources.",
            "title": "Applying and Testing for Waterworks Operator Certification, 331-424  -  revised December 2025",
            "url": "https://doh.wa.gov/sites/default/files/legacy/Documents/Pubs/331-424.pdf"
          },
          {
            "evidence": "Under 'Standardized Water Treatment Operator Need-to-Know,' DOH lists 'WPI Standardized Water Treatment Operator Class I,' II, III and IV; its Spanish Class 1 and 2 links are named SpanishWTPO1 and SpanishWTPO2.",
            "title": "Waterworks Operator Certification Exam Resources",
            "url": "https://doh.wa.gov/community-and-environment/drinking-water/regulation-and-compliance/waterworks-operator-certification/exam-resources"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": [
          1,
          2,
          3,
          4
        ]
      },
      {
        "authorityName": "Washington State Department of Health (DOH)",
        "authorityUrl": "https://doh.wa.gov/community-and-environment/drinking-water/regulation-and-compliance/waterworks-operator-certification",
        "examSystem": "wpi-standardized",
        "localLevels": "Water Distribution Specialist (WDS); Water Distribution Manager (WDM) 1, 2, 3, 4; WDM in Training 1, 2, 3, 4.",
        "note": "The numbered WDM credentials correspond to DOH's WPI standardized Water Distribution Classes I–IV. WDS is a separate credential associated by DOH with the WPI Very Small Water System Operator outline; do not route WDS as Class I. Shared levels refer to full WDM 1–4, not WDS.",
        "sources": [
          {
            "evidence": "Separately lists WDS and 'Water Distribution Manager (WDM) and WDM in Training 1, 2, 3, 4'; calls these standardized water operator certification exams and points to WPI and DOH's 2025 exam resources.",
            "title": "Applying and Testing for Waterworks Operator Certification, 331-424  -  revised December 2025",
            "url": "https://doh.wa.gov/sites/default/files/legacy/Documents/Pubs/331-424.pdf"
          },
          {
            "evidence": "Lists WPI Standardized Water Distribution Operator Classes I–IV. Spanish Class 1 and 2 links are named SpanishWDM1 and SpanishWDM2; Very Small Water System Operator outline links are named EnglishWDS-VerySmallSystem and SpanishWDS-VerySmallSystem.",
            "title": "Waterworks Operator Certification Exam Resources",
            "url": "https://doh.wa.gov/community-and-environment/drinking-water/regulation-and-compliance/waterworks-operator-certification/exam-resources"
          },
          {
            "evidence": "'The lower certification levels of the 2025 standardized Waterworks exams' are available in Spanish for 'WDM 1 and 2; WTPO 1 and 2; WDS, and BPAT certifications.'",
            "title": "Waterworks Operator Certification",
            "url": "https://doh.wa.gov/community-and-environment/drinking-water/regulation-and-compliance/waterworks-operator-certification"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": [
          1,
          2,
          3,
          4
        ]
      },
      {
        "authorityName": "Washington State Department of Ecology",
        "authorityUrl": "https://ecology.wa.gov/regulations-permits/permits-certifications/wastewater-operator-certification",
        "examSystem": "unverified",
        "localLevels": "Group I, Group II, Group III, Group IV; optional Operator in Training (OIT) Group I, Group II, Group III, Group IV.",
        "note": "Ecology confirms its treatment certification and local groups, but the opened official pages establish PSI delivery, WPI study resources and standardized-ABC reciprocity acceptance - not explicit adoption of standardized WPI/ABC exams for Washington candidates. Standardized versus customized or state-specific examinations, and Group-to-WPI-Class correspondence, remain unverified. Drinking-water findings are not extended to this stream.",
        "sources": [
          {
            "evidence": "'There are four levels of full certification' and 'four optional Operator in Training (OIT) Group Levels.' PSI administers computer-based wastewater treatment exams. The page links WPI's 2025 Need to Know Criteria; its explicit 'ABC standardized exam' statement is confined to reciprocity qualifications.",
            "title": "Certification information",
            "url": "https://ecology.wa.gov/regulations-permits/permits-certifications/wastewater-operator-certification/certification-information"
          },
          {
            "evidence": "Current 2025–2027 schedule names 'Group I and Group I OIT' and 'Groups II–IV and Groups II–IV OIT'; program purpose is certification of wastewater treatment plant operators.",
            "title": "Wastewater Operator Certification Program",
            "url": "https://ecology.wa.gov/regulations-permits/permits-certifications/wastewater-operator-certification"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Washington Wastewater Collection Personnel Association (WWCPA), Board of Directors  -  voluntary certifier; state designation not verified",
        "authorityUrl": "https://www.wastewatercpa.com/articles.html",
        "examSystem": "unverified",
        "localLevels": "Voluntary: Wastewater Collection Specialist in Training (WWC-SIT); Wastewater Collection Specialist I (WWC-I), II (WWC-II), III (WWC-III), IV (WWC-IV). No separate mandatory Ecology collection credential verified.",
        "note": "Ecology's treatment program expressly excludes collection systems. WWCPA's own governing document establishes a distinct voluntary certification program, but state designation was not established. Its Board prepares or commissions examinations; WWC-SIT uses the Specialist I examination, and Specialist IV expressly requires an oral examination. The I–III exam provider and standardized/customized status are not identified, so do not assign shared WPI levels or label the whole program state-specific merely from silence.",
        "sources": [
          {
            "evidence": "Ecology's definition of a wastewater treatment plant expressly excludes 'wastewater collection systems.'",
            "title": "Certification information  -  Operating Experience",
            "url": "https://ecology.wa.gov/regulations-permits/permits-certifications/wastewater-operator-certification/certification-information"
          },
          {
            "evidence": "Articles dated March 5, 2026; §1.1 establishes the 'Washington Voluntary Certification Program for Wastewater Collection Personnel.' §5.10 assigns examination preparation/conduct to the Board. §§7.1–7.5 name WWC-SIT and Specialist I–IV; §7.5 requires the 'Wastewater Collection Specialist IV oral examination.'",
            "title": "WWCPA Articles of Incorporation & By-Laws",
            "url": "https://www.wastewatercpa.com/articles.html"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "WV",
    "dedicatedCourseNeeds": [
      "WV regulatory/local-class supplement: 64CSR4 and its references to Public Water Systems 64CSR3 and Cross-Connection Control 64CSR15; separate 1D, Class R and WDS routes from treatment Classes I–IV. Do not route 1D to Distribution Level 1 merely because of its name.",
      "WV wastewater regulatory/local-class supplement: 64CSR5; distinguish small-system H/HR and S, collection Class C (formerly 1C), treatment Classes I–IV, and the Advanced designation. Include the domestic-versus-industrial jurisdiction boundary and local NPDES-related responsibilities.",
      "Obtain current official examination outlines and exam-origin confirmation separately for 1D, R, WDS, water I–IV, wastewater H/S/I–IV, and collection C before assigning unique-exam courses or shared WPI levels. The official Study Materials page directs wastewater guide inquiries to WV Environmental Training Center or WV Rural Water Association: https://oehs.wvdhhr.org/eed/certification-training/study-materials/. Local credentials are verified; unique question-bank content is not."
    ],
    "limits": [
      "Assessment requested as of October 3, 2026. Live official sources were accessed October 4, 2026; no archived October 3 snapshot was obtained. Both Secretary of State rule-detail pages marked the March 27, 2024 rules active.",
      "Seven official source URLs were opened, within the eight-open cap. No commercial claims or search snippets were used as proof; no operator lists or personal records were opened.",
      "State administration, local class labels and required courses do not prove exam authorship. None of the opened sources explicitly establishes standardized WPI/ABC scope and local-to-WPI class correspondence; all verifiedSharedLevels therefore remain empty. Unverified does not mean the exam is unavailable or that WPI use is disproved."
    ],
    "name": "West Virginia",
    "streams": [
      {
        "authorityName": "West Virginia Department of Health, Bureau for Public Health (BPH), Office of Environmental Health Services, Environmental Engineering Division, Certification & Training Program",
        "authorityUrl": "https://oehs.wvdhhr.org/eed/certification-training/",
        "examSystem": "unverified",
        "localLevels": "1D; Class R; Class I; Class II; Class III; Class IV. Operator-in-Training (OIT) is a training certification, not an examination grade.",
        "note": "Mandatory PWS certification. Classes I–IV are sequential; 1D and Class R are separate, nonsequential credentials. 1D covers restricted transient groundwater systems, NOT WPI Distribution Class I. Class R covers specified retreatment of purchased finished water; an approved manufacturer certification may substitute for its course/exam requirement. State administration is documented, but neither standardized WPI/ABC use nor customized ABC or state-authored exam origin is established.",
        "sources": [
          {
            "evidence": "§2.2: enforced by the BPH Commissioner. §§4.1.1–4.1.7 define 1D, Class R, WDS and Classes I–IV; §§6.3–6.5 distinguish nonsequential credentials from sequential I–IV. Table 64-4A names the local exams; §7.4 permits the Class R manufacturer-certification substitution.",
            "title": "64CSR4  -  Public Water Systems Operators, effective March 27, 2024",
            "url": "https://apps.sos.wv.gov/adlaw/csr/readfile.aspx?DocId=57051&Format=PDF"
          },
          {
            "evidence": "C&T will administer 'all exams (except 1D)'; the 1D course and exams are handled through district offices. Required course exams are administered through training providers on the last day. No exam developer or standardized/customized designation is stated.",
            "title": "Testing  -  C&T Exam Procedures 2026",
            "url": "https://oehs.wvdhhr.org/eed/certification-training/testing/"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "West Virginia Department of Health, Bureau for Public Health, Office of Environmental Health Services, Environmental Engineering Division, Certification & Training Program",
        "authorityUrl": "https://oehs.wvdhhr.org/eed/certification-training/",
        "examSystem": "unverified",
        "localLevels": "Water Distribution System (WDS); Operator-in-Training (OIT) pathway. No separate distribution I–IV ladder is identified in the rule.",
        "note": "Mandatory WDS certification route. Class I or higher PWS operators may also operate WDS systems, but those are not four distribution-specific examination grades. WDS is not sequential toward Class I. No explicit standardized WPI/ABC scope or WDS-to-WPI class correspondence was found; exam origin remains unverified.",
        "sources": [
          {
            "evidence": "§3.32 limits WDS-certified operators to distribution functions; §4.1.3 defines purchased-water WDS systems. §5.3.3 allows WDS, Class I or higher operators. §6.4 says WDS is not sequential toward Class I; Table 64-4A specifies the WDS course and WDS exam.",
            "title": "64CSR4  -  Public Water Systems Operators, effective March 27, 2024",
            "url": "https://apps.sos.wv.gov/adlaw/csr/readfile.aspx?DocId=57051&Format=PDF"
          },
          {
            "evidence": "C&T administers all exams except 1D and arranges required course exams through training providers; the page does not identify a standardized WPI distribution examination.",
            "title": "Testing  -  C&T Exam Procedures 2026",
            "url": "https://oehs.wvdhhr.org/eed/certification-training/testing/"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "West Virginia Department of Health, Bureau for Public Health, Office of Environmental Health Services, Environmental Engineering Division, Certification & Training Program; Class H may alternatively be certified by the WV Department of Environmental Protection Secretary",
        "authorityUrl": "https://oehs.wvdhhr.org/eed/certification-training/",
        "examSystem": "unverified",
        "localLevels": "Class H; Class HR (restricted Class H); Class S (formerly 1S); Class I; Class II; Class III; Class IV. Operator-in-Training (OIT) is a training certification; Advanced is an additional designation, not a numerical grade.",
        "note": "Mandatory domestic wastewater certification under 64CSR5, not a DEP-administered I–IV certification program. Industrial wastewater systems/operators regulated by DEP are excluded from this rule. Classes I–IV are sequential; H and S are separate credentials. Advanced designation requires approved training, not a separately specified exam in the table. No official evidence reviewed identifies the treatment exams as standardized WPI/ABC, customized ABC, or state-authored.",
        "sources": [
          {
            "evidence": "§2.2 assigns enforcement to the BPH Commissioner; §2.1 excludes industrial wastewater. §5.1 requires Commissioner certification for S and I–IV and permits Commissioner or DEP Secretary certification for H. §§3.11–3.12 define HR and S; Table 64-5B specifies H, S and I–IV exams, OIT, and an Advanced training course.",
            "title": "64CSR5  -  Wastewater Systems and Operators, effective March 27, 2024",
            "url": "https://apps.sos.wv.gov/adlaw/csr/readfile.aspx?DocId=57052&Format=PDF"
          },
          {
            "evidence": "The notes explicitly address both public-water and wastewater operator certification course exams, administered through training providers. They do not identify exam authorship or standardized WPI/ABC scope.",
            "title": "Testing  -  C&T Exam Procedures 2026",
            "url": "https://oehs.wvdhhr.org/eed/certification-training/testing/"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "West Virginia Department of Health, Bureau for Public Health, Office of Environmental Health Services, Environmental Engineering Division, Certification & Training Program",
        "authorityUrl": "https://oehs.wvdhhr.org/eed/certification-training/",
        "examSystem": "unverified",
        "localLevels": "Class C (previously 1C). No separate collection I–IV ladder is identified in the rule.",
        "note": "Mandatory, not merely voluntary: anyone operating a Class C wastewater system must be certified by the BPH Commissioner. Class C systems may also be operated by Class I or higher wastewater operators; this does not create a four-level collection exam ladder. Class C is a separate, nonsequential credential, not a verified equivalent of WPI Collection Class I. Exam origin remains unverified.",
        "sources": [
          {
            "evidence": "§3.9 calls the credential Class C, previously 1C. §4.1.3 defines C as collection facilities upstream of treatment. §§5.1 and 5.6.3 require certification and permit C, I or higher operators; §6.3 makes C nonsequential. Table 64-5B requires the Class C course and Class C exam.",
            "title": "64CSR5  -  Wastewater Systems and Operators, effective March 27, 2024",
            "url": "https://apps.sos.wv.gov/adlaw/csr/readfile.aspx?DocId=57052&Format=PDF"
          },
          {
            "evidence": "C&T administers all exams except 1D and required water/wastewater course exams occur through training providers; no collection exam developer or standardized designation is given.",
            "title": "Testing  -  C&T Exam Procedures 2026",
            "url": "https://oehs.wvdhhr.org/eed/certification-training/testing/"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "WI",
    "dedicatedCourseNeeds": [
      "Wisconsin municipal treatment preparation organized by G/I/L/S/V/Z subclass and Grade T/Grade 1 requirements, rather than WPI Classes 1–4. Use each DNR subclass outline; the opened S guide specifically references Wisconsin NR 809/810/811.",
      "Separate Wisconsin Distribution D preparation using its DNR outline, including local monitoring, sampling, cross-connection, operating and safety requirements and the referenced NR 809/810/811 rules.",
      "Wisconsin wastewater Basic General plus selected process-subclass preparation; distinguish OIT/Basic experience progression from the optional Advanced-exam points pathway. Provide a distinct U outline and short-answer-format route rather than requiring General for U.",
      "Dedicated Wisconsin SS collection preparation using the August 2018 guide and its NR 210.23 CMOM, NR 110, SPS 382 and confined-space references; explain mandatory versus voluntary applicability and the General-exam exemption."
    ],
    "limits": [
      "Assessment target: October 3, 2026. Official sources were retrieved October 4, 2026; no archived cutoff-date snapshots were acquired. Eight source URLs were opened, meeting the exploration cap.",
      "State-specific classifications rest on DNR's local exam-development/guide evidence, not exam delivery, reciprocity, membership or contact listings. Individual development documentation was opened for water S and D, wastewater General and SS, not every other subclass or the Advanced exam. No explicit standardized WPI/ABC scope and local-class mapping was found; all verifiedSharedLevels therefore remain empty.",
      "The wastewater page retains obsolete wording that collection exams would be developed in 2018. Its published August 2018 SS guide and current 2026 exam list establish that the exam is offered; the obsolete future-tense statement was not treated as current status.",
      "Drinking-water grade findings concern municipal waterworks. DNR also lists a separate Small Water System (OTM/NN) program and Water System General Operation exam; its grades and exam-development scope were not independently verified within the source cap. Guide rule references were verified, but current regulation texts were not separately opened."
    ],
    "name": "Wisconsin",
    "streams": [
      {
        "authorityName": "Wisconsin Department of Natural Resources (DNR), Operator Certification Program",
        "authorityUrl": "https://dnr.wisconsin.gov/topic/opcert/muniWaterworks.html",
        "examSystem": "state-specific",
        "localLevels": "Municipal waterworks: Grade T (Operator-in-Training), Grade 1. Treatment/source subclasses: G - Groundwater; I - Iron removal; L - Lime softening; S - Surface water; V - VOC; Z - Zeolite softening.",
        "note": "Wisconsin uses process-specific subclass exams. Grade 1 adds one year of qualifying experience to the subclass-exam requirement; it is not verified as WPI Class 1. The opened Surface Water guide explicitly documents locally prepared exam questions. No standardized WPI/ABC scope or local-to-WPI class correspondence was established.",
        "sources": [
          {
            "evidence": "DNR issues certification under NR 114; lists Grade T and Grade 1 and the G/I/L/S/V/Z subclasses. Study guides provide the objectives covered on exams.",
            "title": "Waterworks operator certification",
            "url": "https://dnr.wisconsin.gov/topic/opcert/muniWaterworks.html"
          },
          {
            "evidence": "Preface: operators, regulators, educators and local officials jointly prepared the objectives and exam questions for this subclass. References include Wisconsin NR 809, NR 810 and NR 811.",
            "title": "Surface Water Study Guide, Subclass S, revised February 2016",
            "url": "https://dnr.wisconsin.gov/sites/default/files/topic/OpCert/DWSGSurfaceWater.pdf"
          },
          {
            "evidence": "2026 municipal exams are listed separately by subclass: Surface Water has 80 questions; Groundwater, Iron Removal, Lime Softening, VOC Removal and Zeolite Softening each have 40.",
            "title": "Exams",
            "url": "https://dnr.wisconsin.gov/topic/opcert/exams.html"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Wisconsin Department of Natural Resources (DNR), Operator Certification Program",
        "authorityUrl": "https://dnr.wisconsin.gov/topic/opcert/muniWaterworks.html",
        "examSystem": "state-specific",
        "localLevels": "Grade T (Operator-in-Training), Grade 1; subclass D - Distribution.",
        "note": "Distribution is a separate Wisconsin municipal-waterworks subclass, not a verified WPI Classes 1–4 ladder. Grade 1 requires the subclass exam plus experience, rather than a separately listed higher-grade exam. Local exam-development evidence supports state-specific routing, not standardized or customized ABC attribution.",
        "sources": [
          {
            "evidence": "D is Distribution; Grade T requires passing subclass exams, and Grade 1 requires those exams plus one year of satisfactory subclass experience.",
            "title": "Waterworks operator certification",
            "url": "https://dnr.wisconsin.gov/topic/opcert/muniWaterworks.html"
          },
          {
            "evidence": "Preface says operators, regulators, educators and local officials jointly prepared the subclass objectives and exam questions. Outline covers principles, operation/maintenance, monitoring/troubleshooting, safety and calculations; references Wisconsin NR 809/810/811.",
            "title": "Distribution Study Guide, Subclass D, revised February 2016",
            "url": "https://dnr.wisconsin.gov/sites/default/files/topic/OpCert/DWSGDistribution.pdf"
          },
          {
            "evidence": "Lists Municipal Waterworks - Distribution as a 40-question exam administered in the 2026 DNR paper-exam program.",
            "title": "Exams",
            "url": "https://dnr.wisconsin.gov/topic/opcert/exams.html"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Wisconsin Department of Natural Resources (DNR), Operator Certification Program",
        "authorityUrl": "https://dnr.wisconsin.gov/topic/opcert/wastewater.html",
        "examSystem": "state-specific",
        "localLevels": "Operator-in-Training (OIT), Basic, Advanced. Subclasses: A1 - Suspended Growth Processes; A2 - Attached Growth Processes; A3 - Recirculating Media Filters; A4 - Ponds, Lagoons, and Natural Systems; A5 - Anaerobic Treatment of Liquid Waste; B - Solids Separation; C - Biological Solids/Sludge Handling, Processing, and Reuse; D - Disinfection; L - Laboratory; N - Total Nitrogen; P - Total Phosphorus; U - Unique Treatment Systems.",
        "note": "Normally requires Basic General Wastewater plus at least one process-subclass exam; Special U is exempt from General. Basic adds subclass experience. Advanced requires ten points, including at least four years of hands-on experience; the Advanced exam is one optional points pathway, not universally mandatory. No standardized WPI/ABC adoption or Classes 1–4 mapping was established.",
        "sources": [
          {
            "evidence": "Lists OIT, Basic and Advanced, process subclasses, General-plus-subclass requirements and the U exception. A 100-question Advanced exam earns four points toward the ten-point Advanced credential.",
            "title": "Wastewater operator certification",
            "url": "https://dnr.wisconsin.gov/topic/opcert/wastewater.html"
          },
          {
            "evidence": "Preface ties certification-exam questions to the guide's key knowledges; acknowledgements identify a Wisconsin DNR, WWOA and local operator/trainer workgroup.",
            "title": "Basic General Wastewater Study Guide, revised June 2016",
            "url": "https://dnr.wisconsin.gov/sites/default/files/topic/OpCert/StudyGuideBasicGeneral.pdf"
          },
          {
            "evidence": "Lists separate General, process-subclass and Advanced exams. Wastewater - Unique (Subclass U) is explicitly a short-answer paper exam, unlike the multiple-choice exams.",
            "title": "Exams",
            "url": "https://dnr.wisconsin.gov/topic/opcert/exams.html"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Wisconsin Department of Natural Resources (DNR), Operator Certification Program",
        "authorityUrl": "https://dnr.wisconsin.gov/topic/opcert/wastewater.html",
        "examSystem": "state-specific",
        "localLevels": "Operator-in-Training (OIT), Basic; subclass SS - Sanitary Sewage Collection System. DNR states Basic is the only level required for collection systems; no separate Advanced collection exam is listed.",
        "note": "SS has its own exam and does not require Basic General Wastewater. Certification is required for at least one person where a treatment plant owns its associated collection system; satellite-system certification is voluntary. The overarching wastewater Advanced credential should not be interpreted as a distinct required collection-exam grade. No WPI Classes 1–4 correspondence was verified.",
        "sources": [
          {
            "evidence": "Identifies subclass SS; General exam is waived. FAQ distinguishes treatment-plant-owned systems from voluntary satellite systems and states only Basic certification is required.",
            "title": "Wastewater operator certification - Collection System Certification",
            "url": "https://dnr.wisconsin.gov/topic/opcert/wastewater.html"
          },
          {
            "evidence": "Guide is specifically for the SS exam, ties questions to its key knowledges and identifies local/DNR contributors. References NR 210.23 CMOM, NR 110, Wisconsin SPS 382 and OSHA 1910.146; satellite certification is not a state requirement.",
            "title": "Sanitary Sewage Collection System Study Guide, August 2018",
            "url": "https://dnr.wisconsin.gov/sites/default/files/topic/OpCert/StudyGuideSanitarySewer.pdf"
          },
          {
            "evidence": "Current 2026 exam list includes Wastewater - Sanitary Sewer Collection System, 50 questions.",
            "title": "Exams",
            "url": "https://dnr.wisconsin.gov/topic/opcert/exams.html"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  },
  {
    "code": "WY",
    "dedicatedCourseNeeds": [
      "Preserve a separate Well System preparation route: DEQ directs operators of wells plus distribution, potentially including disinfection, booster stations and storage, to the Well System exam. Source: https://deq.wyoming.gov/water-quality/water-wastewater/operator-certification/exams/ . Its outline and standardized/customized status were not verified.",
      "Preserve a separate Lagoon System preparation route: DEQ directs operators of lagoons plus wastewater collection, potentially including aeration and lift stations, to the Lagoon System exam. Source: https://deq.wyoming.gov/water-quality/water-wastewater/operator-certification/exams/ . Its outline and standardized/customized status were not verified.",
      "Before assigning shared courses, obtain Wyoming-specific exam outlines and an explicit WPI class crosswalk, especially for the two-level distribution and collection ladders. No dedicated customized/state-specific course content was conclusively established by the opened sources."
    ],
    "limits": [
      "Requested cutoff: October 3, 2026. Live sources were retrieved October 4, 2026; the DEQ pages are undated and no archived cutoff-specific version was verified. The currently linked handbook is updated March 2024.",
      "Exploration stopped at eight source opens, including one redirect-only water-treatment attempt. The HTTP retry exposed water-treatment details; distribution and wastewater-treatment extraction exposed headings but not accordion bodies.",
      "All four streams are offered under the DEQ program. Mandatory-versus-voluntary distinctions by facility or stream were not resolved from the acquired sources.",
      "DEQ identifies Water Quality Rules and Regulations Chapter 5 as governing operator certification: https://deq.wyoming.gov/water-quality/water-wastewater/operator-certification/ . The rule text and exam-specific regulatory content were not opened or verified.",
      "Unverified means ambiguous or incompletely accessible, not unsupported or state-specific. WPI/ABC provision, ABC preparation materials and PSI delivery were not treated as proof of standardized exam use; therefore every verifiedSharedLevels array is empty."
    ],
    "name": "Wyoming",
    "streams": [
      {
        "authorityName": "Wyoming Department of Environmental Quality, Water Quality Division, Operator Certification Program",
        "authorityUrl": "https://deq.wyoming.gov/water-quality/water-wastewater/operator-certification/",
        "examSystem": "unverified",
        "localLevels": "Level 1 Water Treatment; Level 2 Water Treatment; Level 3 Water Treatment; Level 4 Water Treatment. Separate Well System exam category also exists.",
        "note": "WPI/ABC exam provision is confirmed, but standardized versus customized status is not. DEQ links ABC Need to Know Criteria for each local level; neither those links nor its generic standardized sample-question disclaimer establishes Wyoming's standardized exam use or a local-level-to-WPI-class crosswalk.",
        "sources": [
          {
            "evidence": "'Water treatment facilities come in Levels 1 through 4.' Separate sections name Level 1–4 Water Treatment and link ABC Need to Know Criteria. The sample-question disclaimer says samples are 'not necessarily representative of current exam content.'",
            "title": "Wyoming DEQ  -  Water Treatment Exams",
            "url": "http://deq.wyoming.gov/water-quality/water-wastewater/operator-certification/exams/study-materials/water-treatment-exams/"
          },
          {
            "evidence": "Page 1: Wyoming water and wastewater operator certification exams 'are provided by Water Professionals International (WPI) and ABC Testing and proctored by PSI Services, Inc.' It does not identify standardized versus customized exams.",
            "title": "Wyoming DEQ  -  Water and Wastewater Operator Certification Exam Candidate Handbook, updated March 2024",
            "url": "https://drive.google.com/file/d/1jD8q6tkUa3JVWvyY-aOW6PtyxEVlohmw/view"
          }
        ],
        "stream": "water-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Wyoming Department of Environmental Quality, Water Quality Division, Operator Certification Program",
        "authorityUrl": "https://deq.wyoming.gov/water-quality/water-wastewater/operator-certification/",
        "examSystem": "unverified",
        "localLevels": "Level 1 Distribution Systems; Level 2 Distribution Systems. Well System is a separate exam route for well-plus-distribution facilities.",
        "note": "The local ladder has two levels, not four. WPI/ABC provision is confirmed by the state handbook, but the opened distribution page did not expose its accordion details. No explicit standardized-use declaration or local-level-to-WPI-class correspondence was verified; matching level numbers are insufficient.",
        "sources": [
          {
            "evidence": "'Distribution Systems come in Levels 1 and 2. Begin with the Level 1 Distribution System exam.' Section headings are 'Level 1 Distribution Systems' and 'Level 2 Distribution Systems.'",
            "title": "Wyoming DEQ  -  Distribution System Exams",
            "url": "https://deq.wyoming.gov/water-quality/water-wastewater/operator-certification/exams/study-materials/distribution-system-exams/"
          },
          {
            "evidence": "Page 1 identifies WPI and ABC Testing as providers of Wyoming water and wastewater certification exams, with PSI as proctor; it does not specify standardized or customized scope.",
            "title": "Wyoming DEQ  -  Water and Wastewater Operator Certification Exam Candidate Handbook, updated March 2024",
            "url": "https://drive.google.com/file/d/1jD8q6tkUa3JVWvyY-aOW6PtyxEVlohmw/view"
          }
        ],
        "stream": "water-distribution",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Wyoming Department of Environmental Quality, Water Quality Division, Operator Certification Program",
        "authorityUrl": "https://deq.wyoming.gov/water-quality/water-wastewater/operator-certification/",
        "examSystem": "unverified",
        "localLevels": "Level 1 Wastewater Treatment; Level 2 Wastewater Treatment; Level 3 Wastewater Treatment; Level 4 Wastewater Treatment. Separate Lagoon System exam category also exists.",
        "note": "Wastewater evidence was checked independently. The state handbook confirms WPI/ABC provision, not standardization. The treatment page exposed grade headings but not accordion details; neither standardized exam scope nor WPI class correspondence was verified. Lagoon System must remain a distinct local route.",
        "sources": [
          {
            "evidence": "'Wastewater treatment facilities come in Levels 1 through 4. Begin with the Level 1 Wastewater Treatment Plant exam and take all exams to reach the level of the facility where you work.' Headings name Level 1–4 Wastewater Treatment.",
            "title": "Wyoming DEQ  -  Wastewater Treatment Exams",
            "url": "https://deq.wyoming.gov/water-quality/water-wastewater/operator-certification/exams/study-materials/wastewater-treatment-exams/"
          },
          {
            "evidence": "Page 1 expressly covers Wyoming water AND wastewater certification exams and identifies WPI and ABC Testing as their providers; standardized versus customized status is unspecified.",
            "title": "Wyoming DEQ  -  Water and Wastewater Operator Certification Exam Candidate Handbook, updated March 2024",
            "url": "https://drive.google.com/file/d/1jD8q6tkUa3JVWvyY-aOW6PtyxEVlohmw/view"
          }
        ],
        "stream": "wastewater-treatment",
        "verifiedSharedLevels": []
      },
      {
        "authorityName": "Wyoming Department of Environmental Quality, Water Quality Division, Operator Certification Program",
        "authorityUrl": "https://deq.wyoming.gov/water-quality/water-wastewater/operator-certification/",
        "examSystem": "unverified",
        "localLevels": "Level 1 Collection Systems; Level 2 Collection Systems. Lagoon System is a separate exam route for lagoon-plus-collection facilities.",
        "note": "DEQ supplies collection-specific ABC criteria links for both local levels. Its reference to 'ABC’s Standardized Exams' describes generic sample questions, not an explicit declaration that Wyoming administers standardized collection exams. WPI/ABC provision is confirmed, but standardized/customized status and the two-level class crosswalk remain unverified.",
        "sources": [
          {
            "evidence": "'Collection Systems come in Levels 1 and 2.' Sections link 'ABC Need to Know Criteria' for Level 1 and Level 2 Collection Systems. The standardized sample-question disclaimer says the samples are not necessarily representative of current exam content.",
            "title": "Wyoming DEQ  -  Collection System Exams",
            "url": "https://deq.wyoming.gov/water-quality/water-wastewater/operator-certification/exams/study-materials/collection-system-exams/"
          },
          {
            "evidence": "Page 1 confirms WPI and ABC Testing provide Wyoming water and wastewater certification exams; PSI proctoring is stated separately and does not establish standardization.",
            "title": "Wyoming DEQ  -  Water and Wastewater Operator Certification Exam Candidate Handbook, updated March 2024",
            "url": "https://drive.google.com/file/d/1jD8q6tkUa3JVWvyY-aOW6PtyxEVlohmw/view"
          }
        ],
        "stream": "wastewater-collection",
        "verifiedSharedLevels": []
      }
    ]
  }
];
