import type { CeuCoursePreviewPackage } from "./ceuCoursePreviewContent";

/**
 * Internal learner-preview lessons and assessments.
 *
 * This is not an approved CEU course. It contains fictional learning scenarios
 * and is intentionally separate from any future tracked delivery, completion,
 * payment, credential, or regulatory-submission system.
 */
export const CEU_PREVIEW_CURRICULUM: CeuCoursePreviewPackage = {
  "courses": [
    {
      "courseKey": "ceu-drinking-water-compliance",
      "courseIntroduction": "Experienced Ontario drinking-water operators make decisions where process evidence, public-health protection, and regulatory accountability intersect. This internal demonstration explores how to distinguish operational warning signs from potential compliance events, evaluate uncertain information, and explain decisions through traceable records. Across six modules, you will examine a compliance map, control-limit deviations, sampling evidence, incident reasoning, documentation quality, and an integrated shift case. All scenarios are fictional and are intended for analysis rather than operational execution. The emphasis is on locating authoritative requirements, using approved site procedures, recognising authority limits, and maintaining defensible escalation and handover records. This learner preview is not an approved continuing-education course and offers no CEU or credential.",
      "learningDisclaimer": "INTERNAL DEMONSTRATION ONLY: This learner preview is not an approved CEU course and provides no legal, regulatory, site-specific, or operating-direction advice. Scenarios are fictional. Actual decisions require current applicable requirements, approved site procedures, and authorised personnel. Participation does not confer approval, accreditation, certification, CEU value, or a guaranteed completion outcome.",
      "modules": [
        {
          "number": 1,
          "title": "Ontario drinking-water compliance map and operator accountability",
          "overview": "A defensible compliance decision begins with identifying which requirements apply to the system, the event, and the person making the decision. This module distinguishes Ontario legislation and regulations from system-specific authorisations, approved procedures, and local administrative practices. Learners consider the Safe Drinking Water Act, Ontario drinking-water quality standards, system requirements, and operator certification requirements as sources to verify, not as interchangeable checklists. Attention centres on designated roles, decision authority, escalation routes, and evidence of task ownership. The goal is a practical compliance map that connects a question to its authoritative source while exposing gaps that require clarification from appropriate personnel.",
          "learningPoints": [
            "Distinguish legislation, system-specific authorisations, and approved procedures when identifying the authoritative basis for a compliance decision.",
            "Map designated operator roles, decision authority, and escalation contacts without assuming job titles establish legal responsibilities.",
            "Document unresolved applicability questions and identify appropriate support before relying on an unverified interpretation of requirements."
          ],
          "scenario": {
            "title": "An inherited responsibility chart",
            "brief": "At the fictional Cedar Reach drinking-water system, an experienced operator starts a relief assignment. The shift binder lists a supervisor as the contact for every compliance issue, but the current roster names different people for operational oversight and incident coordination. A colleague says the binder has always been used and therefore must be correct. During handover, an unresolved alarm review is assigned simply to the next shift. The learner receives the binder page, roster, and an index of controlled documents, but no verified responsibility matrix.",
            "prompt": "What should a defensible learning analysis identify before accepting the binder as the compliance and escalation map?",
            "modelAnswer": "The binder is evidence of local practice, not proof of current authority. The analysis should compare its revision status with controlled procedures, current role designations, and applicable system documents. It should distinguish the owner or operating authority, overall responsible operator, operator-in-charge, and other assigned functions without presuming that one title covers every duty. The unresolved alarm needs an identifiable owner, documented status, and an escalation route under the applicable procedure. Any conflict between documents should be recorded and referred to the appropriate authorised personnel. A defensible map shows the source supporting each responsibility and how escalation proceeds if the primary contact is unavailable."
          },
          "knowledgeCheck": {
            "question": "Which evidence most strongly supports a proposed responsibility and escalation map?",
            "choices": [
              "Current controlled documents and verified role designations linked to applicable requirements.",
              "The longest-serving operator's recollection of how previous shifts handled events.",
              "A single supervisor's name copied onto every reporting and operational task.",
              "An older binder accepted because no previous audit finding mentioned it."
            ],
            "correctIndex": 0,
            "explanation": "A responsibility map is defensible when its assignments can be traced to current, applicable sources and verified designations. Experience can help identify practical gaps, but it does not establish authority by itself. Conflicting or outdated documents need resolution through the appropriate process, with interim uncertainties and task ownership made visible."
          }
        },
        {
          "number": 2,
          "title": "Operating within control limits",
          "overview": "Operational limits do not all mean the same thing. A warning threshold, instrument alarm, internal target, validated treatment criterion, and regulatory requirement can serve different purposes and demand different analyses. This module develops a structured reading of trends, instrument status, process context, and corroborating evidence. Learners distinguish a plausible measurement problem from a demonstrated loss of process control without treating either explanation as established too early. The emphasis is on recognising uncertainty, evaluating potential water-quality significance, and identifying the authorised procedure and escalation pathway. No operating adjustments are prescribed; learners explain what evidence and authority would be necessary to support a response decision.",
          "learningPoints": [
            "Classify each limit by source and purpose before interpreting the significance of a recorded deviation.",
            "Evaluate trends alongside instrument condition, measurement location, and corroborating evidence rather than relying on isolated readings.",
            "Identify procedural response pathways and escalation needs without treating uncertain measurements as proof of safe conditions."
          ],
          "scenario": {
            "title": "Two measurements, one unresolved event",
            "brief": "At the fictional Birch Harbour treatment plant, an online disinfectant residual trace falls below a labelled internal warning threshold. A handheld reading collected nearby is higher, and the online analyser has a recent maintenance entry. The trend includes a brief data gap, while the handheld record omits its exact sampling point and collection time. Another operator suggests recording analyser trouble and closing the event. The training file provides no verified regulatory threshold, treatment-performance calculation, or site response instruction for these circumstances.",
            "prompt": "How should the learner evaluate the discrepancy without prescribing an operating adjustment or assuming the event is harmless?",
            "modelAnswer": "The analysis should first establish what the warning threshold represents and which approved procedure addresses the event. The measurements are not directly comparable until location, timing, units, instrument checks, and relevant sample-handling details are verified. Recent maintenance makes instrument performance a question to examine, not a sufficient explanation. The trend, data gap, and possible process significance should remain visible in the event record. Any assessment of treatment adequacy would require the applicable validated criteria and supporting conditions, not a residual reading alone. The response pathway should address verification and protective escalation together, with unresolved risk referred beyond the learner's assumed authority."
          },
          "knowledgeCheck": {
            "question": "What is the strongest interpretation of the higher handheld reading in this scenario?",
            "choices": [
              "It proves the online analyser is faulty and the warning can be dismissed.",
              "It replaces the online record because handheld measurements are always more reliable.",
              "It is potentially useful corroborating evidence, but comparability and measurement quality remain unverified.",
              "It demonstrates compliance with all treatment requirements regardless of the missing information."
            ],
            "correctIndex": 2,
            "explanation": "Different measurements may represent different locations, times, or measurement conditions. Their disagreement identifies a verification need; it does not establish which result represents the process. The internal warning also cannot be translated automatically into a compliance conclusion. Approved response procedures and potential protective escalation remain relevant while the discrepancy is assessed."
          }
        },
        {
          "number": 3,
          "title": "Sampling, testing, and result review",
          "overview": "Sampling evidence is only as useful as its identity, integrity, and relationship to the question being asked. This module follows information from the sampling plan through collection records, sample transfer, laboratory reporting, and operator review. Learners examine location identifiers, collection times, analytical parameters, units, method qualifications, and report status. They distinguish field observations, screening information, and laboratory results without assuming that one can substitute for another. Particular attention is given to amended reports, incomplete traceability, and results that may activate adverse-result procedures. Verification supports sound decisions, but uncertainty must not become a reason to postpone applicable protective or reporting pathways.",
          "learningPoints": [
            "Check sample identity, location, timing, analytical parameter, units, and report status before drawing conclusions from results.",
            "Distinguish data-quality concerns from evidence that a result can be disregarded under applicable requirements and procedures.",
            "Preserve links between original reports, amendments, review notes, and any resulting escalation or follow-up activities documented."
          ],
          "scenario": {
            "title": "A result with conflicting location identifiers",
            "brief": "The fictional Maple Narrows system receives a laboratory report containing a result flagged for urgent review. The bottle identifier matches the collection sheet, but the report lists a distribution location different from the sampler's entry. A preliminary email had shown another value, and a later attachment is labelled amended. The laboratory contact has not yet explained the change. A colleague proposes waiting for a clean final report before opening an event record. The learner has copies of both reports and the sample transfer form.",
            "prompt": "What should the learner's review prioritise, and how should uncertainty be represented?",
            "modelAnswer": "The review should preserve both report versions and establish their receipt times, identifiers, status, and relationship to the collection and transfer records. The location discrepancy and changed value require clarification through the approved laboratory communication process. Neither discrepancy establishes that the flagged result is invalid. The analysis should identify the applicable adverse-result procedure and reporting pathway while verification proceeds, rather than make a clean replacement report a prerequisite for action. The event record should distinguish confirmed facts, laboratory statements, and unresolved questions. Any revised interpretation should cite the supporting communication or amended report and retain the original evidence for traceability."
          },
          "knowledgeCheck": {
            "question": "Which approach best handles the report discrepancy?",
            "choices": [
              "Delete the preliminary report once an amended attachment becomes available.",
              "Preserve the evidence, clarify the discrepancy, and assess applicable escalation and reporting pathways without awaiting a clean report.",
              "Treat the location mismatch as sufficient proof that the result does not concern the system.",
              "Average the reported values and use the average for the compliance review."
            ],
            "correctIndex": 1,
            "explanation": "Traceability requires retaining the relationship between the original information, subsequent amendments, and decisions made as information arrived. Clarification can proceed alongside the applicable response pathway. A mismatched location or changed value creates uncertainty, not automatic invalidation. Averaging incompatible report versions would obscure the laboratory's actual findings and the basis for decisions."
          }
        },
        {
          "number": 4,
          "title": "Adverse results, incidents, and corrective-action decision-making",
          "overview": "An incident response must address both the condition and the uncertainty surrounding it. This module separates recognition, protective response analysis, internal escalation, applicable external reporting, corrective-action tracking, and closure assessment. Learners practise building an event chronology and identifying decisions that belong to authorised personnel or designated agencies. They examine why internal notification does not necessarily resolve external reporting duties and why a plausible cause does not demonstrate recovery. The emphasis is disciplined reasoning under approved procedures, with notification recipients, timing, and corrective requirements verified from current applicable sources. Learners document what is known, what remains uncertain, and what evidence would support each subsequent decision.",
          "learningPoints": [
            "Separate internal escalation, applicable external reporting, corrective-action tracking, and closure decisions when analysing an incident response.",
            "Identify verified procedural requirements without assuming investigation must finish before protective or reporting pathways can begin.",
            "Define evidence needed to evaluate recovery, outstanding risk, and authorised closure rather than relying on reassurance."
          ],
          "scenario": {
            "title": "Supervisor informed, incident still unresolved",
            "brief": "At the fictional Pine Crossing system, a laboratory communication and an unusual process trend are entered into the same incident file. The shift operator has left a message for the supervisor. A draft note states that reporting is complete because management has been informed. Another note attributes the event to an instrument issue, although supporting checks are unfinished. A later reading appears normal. The training file includes an incident procedure index but omits the applicable reporting instructions, communication records, and criteria for concluding corrective actions.",
            "prompt": "Which gaps prevent a defensible conclusion that reporting and corrective actions are complete?",
            "modelAnswer": "A message to management does not establish that every applicable notification has been completed. The analysis should locate current reporting instructions, identify assigned responsibility, and examine evidence of communications, including recipient, time, content, and any direction received. The proposed instrument explanation remains a hypothesis until supported. A normal later reading may inform recovery assessment but does not explain the earlier event or establish that closure criteria are met. The record should connect each identified issue to an authorised response, responsible person, verification evidence, and outstanding follow-up. Where the assigned contact is unavailable or authority is unclear, the approved escalation pathway remains part of the response analysis."
          },
          "knowledgeCheck": {
            "question": "Which statement most accurately assesses the draft incident closure?",
            "choices": [
              "The later normal reading proves that the original event requires no further review.",
              "Leaving a supervisor message demonstrates completion of all applicable reporting.",
              "A likely instrument explanation is sufficient to classify the event as resolved.",
              "Closure remains unsupported until applicable reporting, corrective-action evidence, and authorised closure criteria are verified."
            ],
            "correctIndex": 3,
            "explanation": "Incident closure needs more than a reassuring measurement or an internal message. Applicable communications, unresolved uncertainty, response evidence, and closure authority must be accounted for. The suspected instrument problem may eventually be supported, but the current file does not establish it or show that the required response pathway has been completed."
          }
        },
        {
          "number": 5,
          "title": "Records, reporting, and audit-ready operational evidence",
          "overview": "Audit-ready records allow another qualified reviewer to reconstruct an event without relying on the author's memory. This module connects log entries, trend data, sample records, laboratory reports, communications, and corrective-action tracking into a coherent evidence chain. Learners distinguish observations from interpretations and record event time separately from entry time when documentation is delayed. They examine transparent corrections, version control, access controls, and verified retention requirements without assuming that one record format fits every system. The central task is not to make a file appear tidy; it is to preserve an accurate, attributable account of what was known, decided, communicated, and left unresolved.",
          "learningPoints": [
            "Link observations, decisions, communications, and follow-up evidence so another reviewer can reconstruct the event independently later.",
            "Distinguish event time from entry time and preserve original content when correcting operational records through approved processes.",
            "Verify retention, access, and version-control requirements rather than assuming a convenient storage method establishes record compliance."
          ],
          "scenario": {
            "title": "The polished log that lost its evidence",
            "brief": "The fictional Lake Fen operating team prepares an incident file for internal review. A handwritten log contains a mistaken sample identifier, while a spreadsheet has the corrected identifier but no correction history. A text message documents an important escalation, yet it has not been linked to the file. A trend screenshot shows the apparent event but omits the date and time axis. The shift summary says all follow-up is complete, although one laboratory clarification is still pending. The team wants a readable record without concealing the original sequence.",
            "prompt": "How should the learner describe an evidence-preserving record improvement plan?",
            "modelAnswer": "The plan should preserve original records and use the approved correction process to identify the mistaken identifier, corrected information, author, timing, and reason. The spreadsheet needs a traceable relationship to the source, not silent replacement of it. Relevant communications should be captured through approved recordkeeping methods with their context and attribution intact. Trend evidence should identify the source, parameter, time basis, and period represented. The summary should show the laboratory clarification as open, with assigned ownership. A record index can connect these materials and explain discrepancies. Retention and access arrangements should be checked against applicable requirements and approved procedures rather than inferred from convenience."
          },
          "knowledgeCheck": {
            "question": "Which record improvement most strongly preserves evidentiary integrity?",
            "choices": [
              "Retain the original entry and add an attributable, dated correction linked to supporting evidence through the approved process.",
              "Replace the original entry with a clean version so reviewers see only the correct identifier.",
              "Remove the pending laboratory clarification from the summary because it may not change the outcome.",
              "Keep only a cropped trend image because the full time axis makes the file harder to read."
            ],
            "correctIndex": 0,
            "explanation": "Transparent correction preserves both the information available at the time and the later clarification. Attribution and supporting evidence allow a reviewer to understand why the record changed. Silent replacement, selective omission, and loss of trend context weaken reconstruction, even if the resulting file appears cleaner or the final value is accurate."
          }
        },
        {
          "number": 6,
          "title": "Integrated compliance practicum and knowledge verification",
          "overview": "The practicum combines regulatory source checking, process evidence, sample traceability, incident reasoning, and documentation in one fictional shift review. Learners construct a concise decision record rather than propose equipment changes. The case requires explicit separation of confirmed facts, working hypotheses, missing evidence, and decisions reserved for authorised personnel. A strong submission explains how verification and protective escalation can proceed together, how applicable reporting pathways are identified, and how follow-up remains visible across shifts. Knowledge verification then tests the reasoning behind those choices. Success in this preview means demonstrating a coherent analysis; it does not establish operational competence, regulatory compliance, course approval, or eligibility for a credential.",
          "learningPoints": [
            "Integrate process trends, laboratory evidence, communications, and applicable procedures into a chronological, source-linked analysis of events.",
            "Assign ownership to unresolved questions and identify authority boundaries when describing handover and escalation needs clearly.",
            "Evaluate response completeness using evidence, applicable criteria, and outstanding obligations rather than a favourable final reading."
          ],
          "scenario": {
            "title": "A shift file with an unfinished ending",
            "brief": "At the fictional Stone Marsh system, the outgoing shift reports an online water-quality warning, a conflicting field measurement, and a laboratory email requiring urgent review. The field sheet lacks a collection time. A supervisor message acknowledges the event but does not describe reporting responsibilities. The trend later returns to its usual range. The draft handover says the system is normal and leaves no assigned follow-up. Learners receive a document index, event extracts, and two report versions, but must identify the authoritative procedures and evidence still needed.",
            "prompt": "Outline a defensible integrated decision record and explain why the proposed handover is inadequate.",
            "modelAnswer": "The decision record should begin with a source-linked chronology of the warning, field observation, laboratory communications, and internal acknowledgement. It should identify the missing collection time, report-version questions, applicable limit source, and unverified reporting status. A return to the usual range is evidence of a later condition, not proof that earlier significance or reporting questions are resolved. The analysis should identify applicable response procedures and authority boundaries, with verification and protective escalation considered together. Handover should distinguish confirmed facts from hypotheses, assign each open item, and state what evidence and authorisation would support closure. The draft is inadequate because it hides uncertainty and leaves follow-up unowned."
          },
          "knowledgeCheck": {
            "question": "Which practicum submission best demonstrates integrated compliance reasoning?",
            "choices": [
              "A short statement that the trend is normal, with the original warning omitted.",
              "A list of possible equipment changes without checking procedures or decision authority.",
              "A chronology linking evidence, uncertainty, applicable response pathways, assigned follow-up, and closure criteria.",
              "A copy of the laboratory email with no discussion of the process warning or handover."
            ],
            "correctIndex": 2,
            "explanation": "The integrated task requires a traceable explanation of how evidence and uncertainty affect response decisions. A chronology with source links, authority boundaries, and assigned follow-up supports continuity across shifts. A favourable trend, isolated email, or proposed equipment change cannot substitute for evaluating the complete event and the applicable procedural pathways."
          }
        }
      ],
      "finalAssessment": {
        "title": "Final knowledge check",
        "instructions": "This preview assessment uses fictional situations to test transferable compliance reasoning, not site-specific operating decisions. Select the single best answer for each question. The demonstration threshold is 80 per cent; with eight equally weighted questions, this requires at least seven correct answers. Results are for learning feedback only and do not issue a CEU or credential.",
        "passingScore": 80,
        "questions": [
          {
            "question": "At a fictional Ontario system, an old shift binder conflicts with the current controlled responsibility procedure. What is the best basis for analysing accountability?",
            "choices": [
              "Accept the binder because operators have used it for several years.",
              "Verify applicable requirements and current role designations, and resolve the document conflict through the authorised process.",
              "Assume the person with the most senior job title holds every relevant responsibility.",
              "Use whichever document assigns the fewest tasks to the incoming shift."
            ],
            "correctIndex": 1,
            "explanation": "Current, applicable sources and verified designations provide the strongest basis for accountability. A document conflict should be made explicit and resolved through the appropriate authorised process. Familiar practice and job seniority may offer context, but neither demonstrates the allocation of particular responsibilities or removes the need for traceable task ownership."
          },
          {
            "question": "A fictional plant's online reading crosses an internal warning threshold, while an incompletely documented field reading is higher. Which conclusion is best supported?",
            "choices": [
              "The field reading proves the process remained acceptable throughout the event.",
              "The online warning proves a regulatory exceedance, regardless of the threshold's source.",
              "The two values should be averaged to decide whether the warning matters.",
              "The discrepancy requires source and comparability checks while applicable response and escalation pathways are assessed."
            ],
            "correctIndex": 3,
            "explanation": "An internal warning is not automatically a regulatory threshold, and an undocumented field measurement cannot conclusively disprove an online event. Relevant checks include timing, location, units, instrument status, and the purpose of the limit. Verification should inform the applicable response pathway without becoming a reason to disregard potential water-quality significance."
          },
          {
            "question": "A fictional system receives a laboratory report flagged for urgent review, but the sample location conflicts with the collection sheet. What is the strongest analysis?",
            "choices": [
              "Preserve the report, pursue clarification, and assess the applicable adverse-result response pathway without making clarification a prerequisite.",
              "Classify the result as invalid solely because the location identifiers differ.",
              "Wait for a replacement report before considering any protective escalation.",
              "Change the laboratory location field locally so the report matches the collection sheet."
            ],
            "correctIndex": 0,
            "explanation": "A location discrepancy creates a traceability problem, not proof that the result can be dismissed. The original report and clarification history should remain available. Applicable response and reporting pathways need assessment while clarification proceeds. Locally altering the laboratory report would also obscure its provenance and the information actually received."
          },
          {
            "question": "In a fictional incident file, a note says 'supervisor informed; reporting complete'. No other communication evidence is attached. What is the best review finding?",
            "choices": [
              "The note establishes that all external recipients received the required information.",
              "Reporting completeness can be inferred if the supervisor acknowledged the message.",
              "Completeness is unverified until applicable reporting pathways, assigned responsibilities, and communication evidence are checked.",
              "External reporting considerations can be omitted whenever management knows about an event."
            ],
            "correctIndex": 2,
            "explanation": "Internal awareness and completion of applicable external reporting are separate questions. The review needs authoritative instructions and evidence showing what communication occurred, through which channel, to whom, and with what content or direction. The note alone does not establish completeness, and the analysis should not invent recipients or deadlines."
          },
          {
            "question": "A fictional shift record contains an incorrect sample identifier. Supporting evidence establishes the correct identifier. Which documentation approach is best?",
            "choices": [
              "Delete the original entry and replace it without noting the change.",
              "Preserve the original and make an attributable correction through the approved process, linked to the supporting evidence.",
              "Leave both identifiers unexplained so reviewers can choose which one they prefer.",
              "Correct only the summary and conceal the discrepancy in the source record."
            ],
            "correctIndex": 1,
            "explanation": "An attributable correction allows reviewers to understand both the initial record and the later verified information. The supporting evidence and approved correction process preserve traceability. Silent replacement or conflicting unexplained identifiers make reconstruction harder and can obscure what information was available when earlier compliance or response decisions were made."
          },
          {
            "question": "At a fictional treatment plant, one later reading is within the usual operating range after an unresolved warning. Which statement is best supported?",
            "choices": [
              "The reading describes a later condition; closure still depends on applicable criteria, response evidence, and unresolved issues.",
              "The reading proves the earlier warning was caused by an instrument fault.",
              "The reading automatically cancels any applicable reporting considerations.",
              "The reading establishes that no potentially affected water was present during the event."
            ],
            "correctIndex": 0,
            "explanation": "A later favourable reading can support recovery assessment, but it cannot independently establish the earlier cause, conditions throughout the event, or completion of applicable reporting and corrective actions. Defensible closure requires the relevant evidence and authorised criteria. Unsupported retrospective conclusions should remain separate from confirmed observations in the record."
          },
          {
            "question": "An outgoing fictional shift has unresolved laboratory clarification and uncertain reporting status. Which handover is strongest?",
            "choices": [
              "State 'normal now' and omit the unresolved issues to avoid confusing the incoming shift.",
              "Attach the whole file without identifying which questions remain open.",
              "Mark the event complete because the incoming shift can reopen it if necessary.",
              "List confirmed facts, open questions, assigned follow-up, escalation status, and evidence needed for closure."
            ],
            "correctIndex": 3,
            "explanation": "A useful handover makes the event's current status actionable within authorised procedures without hiding uncertainty. Identified ownership and closure evidence support continuity and accountability. An attachment alone may preserve information but does not show priorities or responsibility. A normal present condition does not resolve outstanding laboratory, reporting, or incident-review questions."
          },
          {
            "question": "In a fictional practicum, the evidence is incomplete and a potentially significant condition may exceed the learner's assumed authority. Which response best respects the preview's purpose?",
            "choices": [
              "Specify an equipment setting based on experience and treat procedure review as optional.",
              "Invent a notification deadline to make the analysis appear complete.",
              "Identify missing evidence, authoritative sources, approved response pathways, and escalation needs without prescribing an operating adjustment.",
              "Promise that the system is compliant if the proposed paperwork is completed."
            ],
            "correctIndex": 2,
            "explanation": "The practicum evaluates disciplined analysis rather than authority to direct operations. A strong response makes uncertainty visible, identifies the sources and procedures needed, and recognises when escalation is necessary. Invented requirements, unsupported compliance assurances, and prescribed equipment changes exceed the evidence and the boundaries of this internal demonstration learning package."
          }
        ]
      }
    },
    {
      "courseKey": "ceu-water-treatment-process-control",
      "courseIntroduction": "Effective process control connects raw-water conditions, treatment performance, instrument reliability, and the limits of operator authority. This internal demonstration introduces a proposed learning experience for experienced Ontario water treatment operators, using fictional situations to examine how evidence supports defensible decisions. Across six modules, learners interpret trends, compare competing explanations, and evaluate potential responses involving coagulation, clarification, filtration, and disinfection. Particular attention is given to representative sampling, hydraulic delays, SCADA data quality, and interactions between treatment barriers. The emphasis is not on selecting universal settings, but on identifying what must be verified, which approved procedures govern a response, how effectiveness would be demonstrated, and when uncertainty or deteriorating performance warrants escalation.",
      "learningDisclaimer": "This internal demonstration is a learner preview, not an approved CEU course, and provides no CEU or credential. It is not legal, regulatory, site-specific, or operating-direction advice. All scenarios are fictional. Operational decisions remain subject to applicable requirements, approved site procedures, qualified oversight, and authorized responsibilities.",
      "modules": [
        {
          "number": 1,
          "title": "Process-control foundations and Ontario operating context",
          "overview": "Process-control reasoning begins with a defined treatment objective, trustworthy evidence, and clear boundaries on decision-making authority. This module examines how experienced operators distinguish a performance target from a site action level or an applicable compliance requirement without assuming those categories are interchangeable. Learners consider how approved procedures, plant documentation, and supervisory responsibilities shape the evaluation of possible responses. Trend interpretation includes baseline variability, hydraulic travel time, and the difference between correlation and a supported cause. A structured decision record links observations, uncertainties, evaluated options, verification measures, and escalation criteria so that another operator can understand the reasoning during a shift handover.",
          "learningPoints": [
            "Distinguish operational targets, site action levels, and applicable requirements before interpreting the significance of a process trend.",
            "Connect observations to treatment objectives, hydraulic timing, approved procedures, and the boundaries of delegated operator authority.",
            "Document evidence, uncertainty, evaluated options, verification measures, and escalation criteria for a defensible shift handover."
          ],
          "scenario": {
            "title": "A trend without an agreed interpretation",
            "brief": "At fictional Cedar Reach Water Treatment Plant, the incoming operator sees a gradual increase in clarified-water turbidity over two shifts. Filtered-water indicators remain near their usual baseline. One handover note calls the increase normal seasonal variation; another suggests an immediate chemical response. Neither note identifies the relevant procedure, sampling checks, or raw-water conditions. The SCADA trend includes a brief gap, and the plant recently changed its production schedule. The supervisor asks for a structured assessment before any authorized response is considered.",
            "prompt": "What should the assessment establish before comparing potential process responses?",
            "modelAnswer": "The assessment would establish the applicable treatment objectives, site action levels, approved response procedure, and decision authority. It would verify the turbidity measurements and trend continuity, then align raw-water, flow, chemical-feed, and downstream observations with expected hydraulic delays. The production schedule change is a possible contributor, not proof of causation. Stable filtered-water results provide useful context but do not resolve the clarified-water trend. A defensible record would identify supported explanations, remaining uncertainties, and the evidence needed to compare options. It would also specify verification measures and the conditions requiring escalation, rather than treating either handover opinion as sufficient operating justification."
          },
          "knowledgeCheck": {
            "question": "Which statement best distinguishes a process-control target from an applicable compliance requirement?",
            "choices": [
              "An internal target automatically becomes a compliance requirement when displayed on SCADA.",
              "A target can support early intervention, but its status must be established from applicable requirements and site documentation.",
              "Any result within an internal target eliminates the need to review other treatment barriers.",
              "A target can replace an applicable requirement when the operator documents the reason."
            ],
            "correctIndex": 1,
            "explanation": "Internal targets may provide operating margin or early warning, but their meaning depends on the documents that establish them. They do not automatically define, replace, or satisfy applicable requirements. Sound analysis identifies the relevant category and considers other barriers, approved procedures, and authority before evaluating a response to a changing trend."
          }
        },
        {
          "number": 2,
          "title": "Raw-water characterization and treatment-train response",
          "overview": "Raw-water changes rarely arrive as a single isolated variable. Runoff, seasonal cooling, source blending, and biological activity can alter particle characteristics, natural organic matter, alkalinity, pH, and treatment demand in different combinations. This module develops a treatment-train perspective on those changes. Learners examine why similar turbidity readings can accompany different coagulation behaviour and why a raw-water sample must be connected to the water later observed downstream. Analysis considers sample representativeness, changing flow, and the time needed for each barrier to reveal a response. The objective is an evidence-based forecast of treatment vulnerability, not an automatic operating response to one indicator.",
          "learningPoints": [
            "Interpret turbidity alongside temperature, pH, alkalinity, and organic matter indicators to characterize changing treatment challenges.",
            "Account for intake conditions, sample representativeness, and hydraulic travel time when comparing raw and downstream measurements.",
            "Anticipate interactions across treatment barriers without treating a single raw-water measurement as a complete diagnosis."
          ],
          "scenario": {
            "title": "Runoff with an incomplete signal",
            "brief": "At fictional Maple Inlet Plant, rainfall is followed by darker raw water and a modest turbidity increase. Raw-water temperature is falling, while the latest alkalinity result is from the previous day. A colour observation comes from a shoreline bottle rather than the routine intake sampling point. Clarified-water turbidity has not yet changed, and production flow increased earlier in the shift. An operator recalls that a previous storm required a different treatment approach, but the available record does not describe that event's organic matter or alkalinity conditions.",
            "prompt": "How would a learner evaluate whether the available observations predict a treatment challenge?",
            "modelAnswer": "The learner would first distinguish verified intake conditions from observations that may not represent the water entering treatment. Current, representative results for relevant raw-water characteristics would support interpretation of the colour and turbidity changes. Organic matter indicators, where available, could help assess changes in coagulant and disinfectant demand that turbidity alone may miss. Temperature and alkalinity would inform the evaluation of coagulation behaviour and buffering capacity. The unchanged clarified-water result must be interpreted against changing flow and travel time. The previous storm is contextual evidence, not a transferable prescription. Analysis would identify vulnerable barriers, monitoring needs, and procedure-based escalation criteria."
          },
          "knowledgeCheck": {
            "question": "Why is an unchanged clarified-water trend not sufficient to dismiss a newly observed raw-water change?",
            "choices": [
              "Clarified-water instruments cannot detect changes associated with runoff.",
              "Every raw-water change inevitably causes a clarification failure.",
              "The changed water may not yet have reached the sampling point, and the indicators may reflect different treatment characteristics.",
              "An unchanged trend demonstrates that the chemical dose is optimal."
            ],
            "correctIndex": 2,
            "explanation": "Downstream observations must be matched to the relevant water parcel and treatment characteristics. Hydraulic travel time varies with flow and operating configuration, while colour, particles, and organic matter may affect treatment differently. An unchanged reading may be reassuring only within that context; it does not independently demonstrate that the emerging challenge has been addressed."
          }
        },
        {
          "number": 3,
          "title": "Coagulation, flocculation, clarification, and filtration optimization",
          "overview": "Optimization of particle removal requires attention to the entire solids-removal sequence rather than a search for one preferred chemical setting. This module examines how coagulant characteristics, dose expression, pH, alkalinity, temperature, mixing, floc development, and solids separation influence downstream filter performance. Learners evaluate jar-test evidence alongside plant hydraulics and recognize the limits of translating bench observations into full-scale expectations. Filter trends include turbidity, headloss, run history, loading, and recovery after backwash. Potential improvements are assessed against approved constraints and the possibility of shifting a problem downstream. A successful evaluation includes repeatable evidence, defined verification measures, and explicit reasons to reject an apparently favourable option.",
          "learningPoints": [
            "Evaluate coagulation evidence using chemical characteristics, dose units, pH, alkalinity, temperature, and representative bench testing.",
            "Relate floc development and clarification performance to filter loading, headloss progression, turbidity trends, and run history.",
            "Compare optimization options across the treatment train, including uncertainty, approved constraints, and possible downstream trade-offs."
          ],
          "scenario": {
            "title": "Clearer settled water, uncertain filter benefit",
            "brief": "At fictional Birch Crossing Plant, controlled jar tests using representative raw water show lower settled turbidity for one candidate condition. That jar also has a lower final pH than the current treatment condition. Meanwhile, two plant filters show faster headloss accumulation, although their individual turbidity trends differ. Recent records include a coagulant delivery with a different product concentration and an incomplete backwash note for one filter. A draft optimization memo recommends the candidate based only on the clearest jar, without discussing plant feed calculations or downstream performance.",
            "prompt": "What evidence is missing from the draft memo, and how should the candidate be evaluated?",
            "modelAnswer": "The memo needs verified product information, consistent dose units, and a check that bench and plant comparisons use the same chemical basis. Final pH and alkalinity matter because improved settling alone does not establish acceptable treatment conditions. Jar-test replication, mixing conditions, temperature, and observation methods would support confidence in the result. The filter comparison needs individual loading, headloss, turbidity, run history, and backwash records; different behaviour may indicate filter-specific contributors. Any candidate would be evaluated under the site's authorized testing procedure, with downstream verification and defined acceptance and escalation criteria. The clearest jar is evidence for consideration, not sufficient justification for a plant adjustment."
          },
          "knowledgeCheck": {
            "question": "Which finding most directly weakens a claim that the clearest jar identifies the best full-scale treatment condition?",
            "choices": [
              "The candidate has not been assessed against pH constraints, chemical basis, and downstream filter performance.",
              "The jar test used representative raw water collected during the event.",
              "The analyst recorded the mixing sequence and observation times.",
              "The comparison included the current treatment condition."
            ],
            "correctIndex": 0,
            "explanation": "Lower settled turbidity is only one performance measure. A candidate can create unacceptable pH conditions, be compared on an inconsistent chemical basis, or increase downstream filter burden. Representative sampling and documented test conditions strengthen the comparison, but they do not replace evaluation of constraints and treatment-train consequences under an authorized testing framework."
          }
        },
        {
          "number": 4,
          "title": "Disinfection process control and treated-water protection",
          "overview": "Disinfection analysis must connect water quality, disinfectant residual, contact conditions, and the basis used to demonstrate treatment performance. For chlorine-based examples, learners distinguish applied dose from measured residual and examine how demand, temperature, pH, flow, and effective contact time influence interpretation. Nominal tank volume divided by flow is not automatically an acceptable estimate of effective contact time. The module also considers particle-removal performance, residual monitoring locations, storage conditions, and potential disinfection by-product trade-offs. Rather than offering generic settings, learning activities identify the verified inputs and approved methods needed for an assessment, together with escalation when a reliable demonstration of performance is unavailable.",
          "learningPoints": [
            "Distinguish disinfectant dose, demand, and residual, including the sampling location and disinfectant species relevant to interpretation.",
            "Evaluate contact-time assumptions using verified flow, operating configuration, and the site's approved disinfection assessment method.",
            "Consider upstream barrier performance and treated-water protection alongside residual trends, uncertainty, and potential by-product trade-offs."
          ],
          "scenario": {
            "title": "A familiar residual at an unfamiliar flow",
            "brief": "At fictional Pine Harbour Plant, a chlorine residual display remains near its recent baseline after production flow increases. The contact tank is operating at a lower level than during the last documented disinfection assessment. A spreadsheet reports adequate performance using nominal tank volume divided by current flow, but its effective-contact-time assumptions are not identified. Water temperature has also decreased. The online residual sampling line was recently serviced, and its transport delay has not been confirmed. The shift team is asked to evaluate whether the existing evidence supports confidence in disinfection performance.",
            "prompt": "Which assumptions and measurements need examination before the spreadsheet result can be relied upon?",
            "modelAnswer": "The evaluation would verify the residual measurement, disinfectant species, sampling location, and transport delay, then align those data with the relevant flow and tank conditions. It would establish the approved basis for effective contact time, including the applicable hydraulic configuration and operating level. Nominal detention time cannot substitute for that basis without justification. Temperature and, for chlorine assessment, pH would be checked against the approved performance method. A stable residual alone does not establish adequate disinfection when contact conditions change. Missing or unsupported assumptions would be documented and escalated through site procedures, with protective response decisions reserved for authorized personnel."
          },
          "knowledgeCheck": {
            "question": "What is the strongest reason that a stable chlorine residual does not independently demonstrate adequate disinfection?",
            "choices": [
              "Residual concentration has no relationship to disinfection performance.",
              "Any increase in flow automatically proves inadequate disinfection.",
              "Nominal tank detention time is always equivalent to effective contact time.",
              "Disinfection assessment also depends on verified contact conditions and relevant water-quality inputs."
            ],
            "correctIndex": 3,
            "explanation": "Residual is important, but it is only part of a disinfection assessment. Effective contact time, flow, configuration, temperature, and relevant chemistry affect the interpretation under the approved method. A flow change requires evaluation rather than an automatic conclusion. Unsupported hydraulic assumptions can make a reassuring residual or spreadsheet result misleading."
          }
        },
        {
          "number": 5,
          "title": "Instrumentation, SCADA, sampling, and data integrity",
          "overview": "Reliable process decisions require more than a plausible number on a screen. This module follows information from the sample point through the analyser, signal path, SCADA display, historian, and decision record. Learners examine calibration and verification evidence, sample-line condition, measurement range, signal scaling, timestamps, averaging, and quality flags. Differences between online and grab-sample results are evaluated through location, timing, method, and sample handling before either source is accepted or dismissed. Data gaps and suspiciously flat trends are treated as uncertainty rather than proof of stability. The aim is a traceable interpretation that preserves original records and identifies when an independent check or escalation is needed.",
          "learningPoints": [
            "Trace measurements from sampling location through analyser, signal scaling, timestamps, historian storage, and displayed quality flags.",
            "Compare online and grab results only after examining timing, location, methods, handling, and instrument verification evidence.",
            "Preserve original records and distinguish missing, stale, averaged, and verified data when documenting process interpretations."
          ],
          "scenario": {
            "title": "The flat trend and the rising grab results",
            "brief": "At fictional Elm Ridge Plant, SCADA shows an unusually flat filtered-water turbidity trend. Two grab results from the associated sample station are higher than the display. The analyser's local screen shows changing values, while the historian repeats one number across several recording intervals. A maintenance entry notes a recent communications repair. The grab instrument has a current verification record, but the sample collection times were written on paper and have not been compared with the analyser's sample transport delay. No one has yet examined signal quality flags.",
            "prompt": "How can the disagreement be investigated without prematurely accepting either data source?",
            "modelAnswer": "The investigation would compare local analyser readings, transmitted values, SCADA display behaviour, historian records, timestamps, and quality flags to identify possible stale or substituted data. The communications repair is a useful lead, not proof of the fault. Grab-sample interpretation would include collection location, timing, handling, method suitability, and verification evidence, with allowance for sample transport delay. Online analyser condition and its sample system also require review. Original records would remain intact, and any annotations would clearly distinguish measured values from invalid or unavailable information. Until confidence is restored, the assessment would identify information gaps and invoke applicable verification and escalation procedures."
          },
          "knowledgeCheck": {
            "question": "Which observation most strongly suggests a data-transfer problem rather than demonstrating stable water quality?",
            "choices": [
              "The grab instrument has a documented verification record.",
              "The local analyser changes while the historian repeats one value following communications work.",
              "The sample station is associated with the filtered-water analyser.",
              "The operator recorded sample collection times on paper."
            ],
            "correctIndex": 1,
            "explanation": "A changing local reading paired with a repeated historian value points toward the signal or data-handling path, although further checks are needed to locate the fault. It does not establish which water-quality result is correct. Sampling comparability, analyser performance, timestamps, and quality flags still require examination before a defensible process interpretation is possible."
          }
        },
        {
          "number": 6,
          "title": "Optimization decisions, upset response, and continuous improvement",
          "overview": "A defensible optimization response is a controlled learning process, not a sequence of undocumented changes. This module brings together evidence validation, competing hypotheses, risk assessment, authorization, and verification planning. Learners distinguish routine optimization from deteriorating conditions that require the site's upset response and escalation framework. Proposed evaluations identify what evidence would support a hypothesis, what could confound the comparison, and what conditions would end the evaluation. Success considers barrier performance and operating constraints rather than a single improved indicator. The module concludes with structured handover and review practices that preserve lessons, identify unresolved causes, and support continuous improvement without converting one event into an unsupported universal rule.",
          "learningPoints": [
            "Build response proposals around verified evidence, competing explanations, authorized procedures, and explicit limits on evaluation.",
            "Define success measures, observation periods, confounding factors, and escalation criteria before interpreting an optimization result.",
            "Use documented event reviews to improve procedures and monitoring without generalizing beyond the available evidence."
          ],
          "scenario": {
            "title": "An improvement with too many explanations",
            "brief": "At fictional Silver Marsh Plant, clarified-water quality improves during a period when raw-water temperature, production flow, and an authorized treatment trial all change. The trial record describes the candidate condition but omits the start time and expected hydraulic delay. Filter headloss continues to rise faster than usual. A draft handover calls the trial successful and proposes making its approach the new standard. The receiving shift asks for the original observations, the trial's approved acceptance criteria, and the point at which continuing evaluation would give way to an upset response.",
            "prompt": "What would a defensible review conclude, and what belongs in the handover?",
            "modelAnswer": "The review would conclude that clarified-water improvement is observed, but attribution to the trial remains uncertain because several conditions changed and timing is incomplete. It would reconstruct the sequence from preserved records where possible, without inventing missing information. Assessment would include filter performance and all approved acceptance criteria, not just the improved indicator. The handover would identify verified findings, unresolved hypotheses, constraints, monitoring needs, responsible personnel, and escalation or trial-ending criteria. Any further evaluation would remain subject to authorization and water-quality protection. A permanent procedural change would require the site's review process and stronger evidence than this confounded observation provides."
          },
          "knowledgeCheck": {
            "question": "Which conclusion is best supported when several process conditions change during an apparently successful trial?",
            "choices": [
              "The trial is proven successful if any one downstream indicator improves.",
              "The most recently changed condition must have caused the improvement.",
              "The improvement is an observation, but causal attribution requires assessment of timing, confounding factors, and other barriers.",
              "The trial can become standard practice if the handover describes it positively."
            ],
            "correctIndex": 2,
            "explanation": "An observed improvement does not identify its cause when raw-water conditions, flow, or other variables change at the same time. A credible review tests the proposed explanation against timing, comparison quality, and performance across barriers. Documentation supports continuity, but it cannot replace authorization, acceptance criteria, or sufficient evidence for a permanent procedural change."
          }
        }
      ],
      "finalAssessment": {
        "title": "Final knowledge check",
        "instructions": "This preview assessment checks reasoning across the fictional learning scenarios. Select the single best answer for each question, considering evidence quality, treatment interactions, approved procedures, and authority. The demonstration passing score is 80 percent. This assessment does not issue a CEU or credential, establish course approval, or authorize operational decisions at any facility.",
        "passingScore": 80,
        "questions": [
          {
            "question": "At fictional Alder Bay Plant, raw-water turbidity rises, but the clarified-water trend remains unchanged immediately afterward. Which interpretation is best supported?",
            "choices": [
              "The comparison is incomplete until representative measurements and hydraulic timing are evaluated.",
              "The clarification process has already demonstrated adequate response to the changed water.",
              "The raw-water instrument must be faulty because the downstream trend is unchanged.",
              "The existing coagulant condition is optimal for the event."
            ],
            "correctIndex": 0,
            "explanation": "The changed raw water may not yet be represented at the downstream sampling point. Flow, process configuration, and sample-system delays affect timing, while representative measurements establish whether the raw-water change is real. The unchanged trend alone does not prove optimal treatment, instrument failure, or an adequate response to water that has not yet been assessed."
          },
          {
            "question": "At fictional Tamarack Plant, two raw-water samples have similar turbidity but different alkalinity, temperature, and organic matter indicators. What is the best conclusion for learning analysis?",
            "choices": [
              "Similar turbidity establishes equivalent coagulation conditions.",
              "Only the sample with higher organic matter can present a treatment challenge.",
              "The samples may require different evaluations because turbidity does not fully characterize coagulation behaviour or demand.",
              "Differences in alkalinity matter only after water enters the distribution system."
            ],
            "correctIndex": 2,
            "explanation": "Turbidity describes an optical property associated with suspended material; it does not fully characterize particle behaviour, buffering capacity, or natural organic matter. Temperature, alkalinity, and organic matter can influence treatment performance and demand. These differences support a broader evaluation using representative testing and approved constraints, not a conclusion that equal turbidity implies equivalent treatment conditions."
          },
          {
            "question": "At fictional Oak Narrows Plant, a coagulant delivery has a different product concentration. A proposed comparison uses identical pump percentages before and after delivery. Which review is most important before interpreting the comparison?",
            "choices": [
              "Confirm that the pump percentages look similar on the same SCADA screen.",
              "Assume the active chemical dose is unchanged because the product name is unchanged.",
              "Compare only clarified-water appearance because concentration is a purchasing issue.",
              "Verify product specifications, feed delivery, flow, and a consistent dose basis."
            ],
            "correctIndex": 3,
            "explanation": "A pump percentage is not itself an active chemical dose. Product concentration, actual feed delivery, treated flow, and the chosen dose basis affect the comparison; density may also matter for relevant conversions. Verified specifications and feed information are needed before attributing performance differences to treatment behaviour rather than an unrecognized change in chemical input."
          },
          {
            "question": "At fictional Willow Point Plant, one filter develops faster headloss while neighbouring filters remain near baseline. Which analysis best distinguishes a shared upstream problem from a filter-specific contributor?",
            "choices": [
              "Treat all filters as identical because they receive clarified water from the same process.",
              "Compare verified individual loading, turbidity, run history, backwash records, and upstream conditions over aligned periods.",
              "Conclude that faster headloss proves the individual turbidity measurement is wrong.",
              "Use combined filtered-water turbidity alone to identify the affected filter's cause."
            ],
            "correctIndex": 1,
            "explanation": "Individual filter evidence helps separate common feedwater influences from differences in loading, run stage, backwash recovery, or other unit conditions. Combined filtered-water results can obscure individual behaviour. Faster headloss warrants investigation, but it does not independently identify the cause or invalidate a turbidity measurement. Aligned, verified records support a more defensible comparison."
          },
          {
            "question": "At fictional Spruce Lake Plant, a disinfection spreadsheet uses nominal tank volume divided by flow as effective contact time without supporting documentation. Residual readings are stable. What is the best assessment?",
            "choices": [
              "The conclusion is not adequately supported until the approved contact-time basis and relevant inputs are verified.",
              "Stable residual validates the contact-time assumption.",
              "Nominal detention time always accounts for short-circuiting and operating level.",
              "An unsupported calculation proves that inadequate disinfection has occurred."
            ],
            "correctIndex": 0,
            "explanation": "Nominal detention time does not automatically represent effective contact time under actual hydraulic conditions. The approved assessment basis, configuration, flow, operating level, residual, and relevant water-quality inputs need verification. Missing support prevents a reliable conclusion; it does not by itself prove either adequate or inadequate disinfection. Uncertainty must be addressed through applicable site procedures and escalation."
          },
          {
            "question": "At fictional Hemlock Plant, an online result conflicts with a grab sample. Which approach provides the strongest basis for deciding how to interpret the discrepancy?",
            "choices": [
              "Always accept the online result because it is continuous.",
              "Always accept the grab result because it was collected by an operator.",
              "Average the two values and treat the average as verified.",
              "Check sampling comparability, timing, methods, instrument evidence, and the data path while preserving original records."
            ],
            "correctIndex": 3,
            "explanation": "Neither continuous measurement nor manual collection guarantees that a result represents the same water or is technically valid. Differences can arise from location, transport delay, handling, methods, instrument condition, or data transmission. Verification addresses those possibilities. Averaging incompatible or suspect values conceals uncertainty rather than resolving it, and original records remain important for traceability."
          },
          {
            "question": "At fictional Red Cedar Plant, an authorized trial improves settled turbidity while filter headloss worsens and a site-defined trial-ending criterion is reached. Which conclusion best supports the learning review?",
            "choices": [
              "The settled-water improvement outweighs every other criterion.",
              "The trial-ending criterion can be reinterpreted after the event to preserve a successful result.",
              "The trial cannot be declared successful; the applicable trial-ending and escalation procedure governs the response.",
              "The trial should be classified as successful if chemical use also decreased."
            ],
            "correctIndex": 2,
            "explanation": "Success must be judged against the agreed criteria and performance across treatment barriers, not selected favourable results. Reaching a trial-ending criterion changes the decision context and requires the applicable authorized response framework. Worsening filtration is relevant evidence even when settled-water quality improves. Criteria should not be rewritten retrospectively to convert an unacceptable outcome into apparent success."
          },
          {
            "question": "At fictional Clearbrook Plant, an operator prepares a handover after an unresolved treatment trend. Which record best supports safe continuity and defensible decision-making?",
            "choices": [
              "A statement that the next shift can determine the cause without reviewing earlier data.",
              "Verified observations, uncertainties, timing, evaluated options, authorization status, verification measures, and escalation criteria.",
              "Only the most favourable readings, to keep the handover concise.",
              "A preferred process setting without the evidence or procedure supporting it."
            ],
            "correctIndex": 1,
            "explanation": "A useful handover makes both the evidence and its limitations visible. Timing, authorization status, verification measures, and escalation criteria help the receiving shift understand what has been established and what remains unresolved. Selective readings or an unsupported preferred setting can create false confidence, obscure deterioration, and detach later decisions from approved procedures and responsibilities."
          }
        ]
      }
    },
    {
      "courseKey": "ceu-wastewater-treatment-process-control",
      "courseIntroduction": "This internal demonstration from Echelon Institute previews advanced learning in wastewater treatment operations and process control for experienced Ontario operators. Through fictional plant records, calculation exercises, and an integrated virtual shift, learners examine how monitoring quality, biological activity, secondary clarification, nutrient removal, final treatment, and solids handling interact. The emphasis is on defensible reasoning rather than universal setpoints or operating recipes. Learners distinguish observations from assumptions, test competing explanations, and identify information needed before an authorized operational response can be considered. Throughout the package, protection of people and receiving waters, approved site procedures, clear records, and escalation within established authority remain central. This preview is not an approved CEU course.",
      "learningDisclaimer": "This internal demonstration is a learner preview, not an approved CEU course, and provides no legal, regulatory, site-specific, or operating-direction advice. All scenarios are fictional. Analysis does not authorize adjustments; actual decisions require approved site procedures, verified information, appropriate authority, and escalation when conditions exceed that authority.",
      "modules": [
        {
          "number": 1,
          "title": "Ontario operator context, treatment-process overview, and safety boundaries",
          "overview": "Experienced operators interpret performance within an interconnected treatment system, not as isolated instrument readings. This module maps liquid and solids pathways, including return streams that can affect upstream loading. It distinguishes process observations, compliance evidence, and information requiring confirmation. Ontario context is addressed through awareness of applicable facility approvals, approved procedures, responsibilities, and reporting arrangements without prescribing legal requirements. Learners examine how uncertainty, equipment status, worker hazards, and delegated authority shape a defensible response. Safety boundaries remain independent of process urgency: a suspected treatment upset does not justify unauthorized access, bypassing safeguards, or improvising hazardous sampling. The central skill is identifying what is known, what remains uncertain, and who needs involvement.",
          "learningPoints": [
            "Map liquid, solids, and recycle pathways before attributing an effluent change to one treatment unit.",
            "Distinguish training analysis from decisions governed by facility approvals, approved procedures, and assigned operational authority.",
            "Recognize when worker hazards, uncertain information, or consequences require escalation rather than independent troubleshooting."
          ],
          "scenario": {
            "title": "A recycle event and an unsafe shortcut",
            "brief": "At fictional Cedar Inlet wastewater treatment plant, the incoming shift sees higher aeration basin ammonia and a scheduled solids processing return recorded overnight. A colleague suggests checking a below-grade valve chamber because a position indicator appears inconsistent. The chamber has a restricted-access warning, and the shift notes do not establish whether entry is authorized. Meanwhile, the ammonia analyser has a maintenance flag. The supervisor is available by the established contact route. No verified result yet establishes the extent or cause of the apparent treatment change.",
            "prompt": "What reasoning sequence best separates process investigation, safety boundaries, and escalation in this situation?",
            "modelAnswer": "The evidence supports an investigation, not a confirmed diagnosis or permission to enter the chamber. A defensible analysis first identifies the access hazard and treats chamber entry as outside the exercise unless the required site authorization and safeguards are established. Process review can use available records: analyser maintenance status, approved verification results, return flow timing, and related loading trends. The return stream is a plausible contributor, but the maintenance flag weakens confidence in the ammonia signal. The supervisor needs a concise account of observations, uncertainties, and potential consequences. Documentation should distinguish verified facts from hypotheses and identify any decision requiring authority beyond the operator's assigned role."
          },
          "knowledgeCheck": {
            "question": "Which conclusion is most defensible from the fictional shift information?",
            "choices": [
              "The solids processing return proves that biological treatment has failed.",
              "Treatment urgency makes restricted chamber access acceptable.",
              "The ammonia signal needs verification, while access remains subject to established safety authorization.",
              "An analyser maintenance flag proves the ammonia increase is false."
            ],
            "correctIndex": 2,
            "explanation": "Neither the recycle record nor the maintenance flag establishes the true ammonia condition. The strongest interpretation preserves both possibilities while seeking approved verification. Worker protection is a separate boundary: uncertain process performance does not create entry authorization. Records and supervisor communication can support investigation without assuming a cause or bypassing access controls."
          }
        },
        {
          "number": 2,
          "title": "Monitoring, sampling awareness, data quality, and operational records",
          "overview": "Monitoring becomes useful when operators understand what each result represents and what it cannot establish. This module compares grab samples, composite samples, online measurements, and laboratory results in relation to location, timing, preservation, analytical method, and process variability. Learners evaluate calibration records, quality control information, instrument fouling, units, detection limits, and sample identification before interpreting a trend. Attention is given to hydraulic travel time and the mismatch between instantaneous readings and averaged samples. Operational records should preserve original observations and explain corrections without concealing inconvenient results. The learning focus is selecting defensible comparisons, documenting uncertainty, and identifying when approved verification or specialist support is warranted.",
          "learningPoints": [
            "Assess sample location, collection period, preservation, and analytical method before comparing results from different sources.",
            "Use calibration history and quality control evidence to investigate disagreement without automatically rejecting either result.",
            "Record observations, timestamps, units, uncertainties, and follow-up responsibilities so another operator can reconstruct the reasoning."
          ],
          "scenario": {
            "title": "Two numbers, different questions",
            "brief": "At fictional Maple Crossing plant, an online final effluent ammonia display reads 4.2 mg/L at 10:15. A laboratory report received that morning shows 1.1 mg/L for a composite collected during the previous day. A shift note records analyser cleaning at 09:50 but does not document the subsequent verification result. The online trend also shows several brief spikes. A trainee proposes replacing the online value in the shift summary with the laboratory result because the laboratory number is lower. The available information does not show whether the two datasets represent comparable conditions.",
            "prompt": "How should the learning analysis handle the apparent disagreement and the proposed record change?",
            "modelAnswer": "The two values describe different time windows and cannot establish a direct disagreement without additional context. The composite represents its collection period, while the display is a later instantaneous measurement that may also reflect recent maintenance. A defensible review retains both original results with their timestamps, sample basis, units, and quality flags. It examines cleaning and verification records, trend behaviour, and any approved contemporaneous confirmation. Neither a lower laboratory result nor a higher online result deserves automatic preference. The proposed replacement would obscure relevant evidence. A transparent shift summary explains comparability limits, identifies unresolved questions, and assigns follow-up through established procedures rather than presenting a selectively favourable number."
          },
          "knowledgeCheck": {
            "question": "What is the strongest reason not to treat these two ammonia values as directly conflicting measurements?",
            "choices": [
              "They represent different time windows and may reflect different process conditions.",
              "Laboratory results always override online measurements.",
              "Online spikes are always caused by instrument fouling.",
              "Composite samples cannot contain ammonia."
            ],
            "correctIndex": 0,
            "explanation": "A previous-day composite and a current instantaneous display do not measure the same temporal condition. Both may be valid, or either may have a quality issue. Interpretation requires collection periods, maintenance information, and appropriate verification. Preserving the original records allows later review to distinguish genuine process variability from measurement problems."
          }
        },
        {
          "number": 3,
          "title": "Biological treatment and secondary clarification control",
          "overview": "Biological conversion and solids separation must be interpreted together because a stable reactor does not guarantee a clear effluent. This module connects dissolved oxygen, temperature, pH, alkalinity, biomass inventory, settleability, hydraulic loading, and clarifier solids distribution. Learners distinguish observations consistent with biological stress from those suggesting hydraulic or separation limitations. Sludge volume index and settling tests are treated as diagnostic indicators with method and concentration limitations, not stand-alone diagnoses. Return activated sludge redistributes solids; wasting changes system inventory over time. Trend review includes blanket depth, effluent suspended solids, flow patterns, and available microscopy. Competing explanations are compared before any authorized response could be evaluated.",
          "learningPoints": [
            "Interpret biological indicators alongside clarifier loading, blanket trends, settleability, and effluent solids rather than in isolation.",
            "Distinguish solids redistribution through return activated sludge from inventory removal through wasting and effluent losses.",
            "Use settling tests and microscopy as supporting evidence, recognizing method limitations and alternative explanations for poor separation."
          ],
          "scenario": {
            "title": "A rising blanket after rainfall",
            "brief": "At fictional Stonebrook plant, wet-weather inflow rises sharply over four hours. Secondary clarifier blanket readings and final effluent suspended solids both increase. Aeration basin dissolved oxygen and mixed liquor suspended solids remain near their recent ranges. A settleability test resembles the previous day's result, although only one basin was sampled. The return activated sludge flow display has not yet been checked against independent evidence. One operator attributes the event to filamentous bulking and proposes discussing a chemical response. Microscopy results and clarifier flow distribution information are not yet available.",
            "prompt": "Which hypotheses deserve priority, and what evidence would strengthen or weaken them?",
            "modelAnswer": "The close timing between higher inflow, rising blankets, and effluent solids makes hydraulic and solids loading effects important early hypotheses. The similar settling test weakens, but does not eliminate, an abrupt settleability change because sampling coverage is limited. Stable dissolved oxygen and mixed liquor concentration do not establish stable clarifier performance or total biomass retention. Useful evidence includes verified flow distribution, return flow performance, blanket measurement consistency, additional representative settling observations, and microscopy where available. Filamentous bulking remains unconfirmed, so a chemical response lacks an adequate diagnostic basis. An authorized review would compare the evidence, assess effluent risk, and define escalation and follow-up criteria without assuming one universal corrective action."
          },
          "knowledgeCheck": {
            "question": "Which statement best describes return activated sludge in this analysis?",
            "choices": [
              "Increasing return flow necessarily increases total system biomass.",
              "Return flow alone determines whether nitrification can occur.",
              "Return flow permanently removes solids from the treatment system.",
              "Return flow redistributes settled biomass and affects clarifier conditions, but is not itself a solids wasting stream."
            ],
            "correctIndex": 3,
            "explanation": "Return activated sludge moves settled biomass back toward biological treatment and influences clarifier solids distribution and hydraulic conditions. It does not, by itself, remove biomass from the defined treatment system. System inventory changes depend on growth, wasting, effluent losses, and other relevant flows. Return flow evidence therefore matters, but does not justify a simple universal response."
          }
        },
        {
          "number": 4,
          "title": "Process-control calculations and troubleshooting decisions",
          "overview": "Calculations support decisions only when their boundaries, units, and assumptions match the process question. This module develops mass loading, food-to-microorganism ratio, solids retention time, and sludge volume index using explicitly defined datasets. Learners distinguish suspended solids from volatile suspended solids and ensure that concentration and flow periods are compatible. Solids retention time calculations include relevant system inventory and solids leaving the selected boundary, including effluent losses when material. Estimated values are tested for sensitivity to missing or uncertain inputs. The emphasis is interpretation: a calculated result can challenge a hypothesis or reveal a data gap, but cannot independently establish an appropriate operating target or authorize an adjustment.",
          "learningPoints": [
            "State the calculation boundary, averaging period, concentration basis, and unit conversions before interpreting any numerical result.",
            "Include material effluent solids losses when estimating solids retention time for the defined treatment system.",
            "Test how uncertain inventory or loading data could change a diagnosis before comparing results with site benchmarks."
          ],
          "scenario": {
            "title": "The missing solids loss",
            "brief": "At fictional Birch Harbour plant, a training dataset estimates 9,000 kg of suspended solids within the defined biological treatment and secondary clarification boundary. Average waste solids removal is 450 kg/day, and final effluent carries another 50 kg/day. No other solids exits are included in this simplified exercise. A worksheet reports a solids retention time of 20 days because it divides inventory by waste solids removal alone. The instructor notes that the inventory estimate and both loss estimates represent the same operating period, but each remains subject to measurement uncertainty.",
            "prompt": "Calculate the simplified solids retention time and explain what the result can and cannot support.",
            "modelAnswer": "For this defined boundary, total measured solids loss is 450 plus 50, or 500 kg/day. The simplified solids retention time is 9,000 kg divided by 500 kg/day, giving 18 days. The worksheet's 20-day result omits effluent losses and therefore overestimates retention time for the supplied dataset. Interpretation still depends on whether the inventory includes representative clarifier solids and whether the averaged losses reasonably describe the period. This is an inventory-to-loss estimate, not proof of adequate nitrifier retention under all temperatures or loading conditions. A sound learning conclusion documents the corrected calculation, its assumptions, and uncertainty before comparing it with relevant site-specific process expectations."
          },
          "knowledgeCheck": {
            "question": "What is the simplified solids retention time using all stated solids losses?",
            "choices": [
              "20 days",
              "18 days",
              "180 days",
              "0.056 days"
            ],
            "correctIndex": 1,
            "explanation": "Solids retention time equals the defined solids inventory divided by the daily solids leaving that boundary. Here, 9,000 kg divided by 500 kg/day equals 18 days. Using wasting alone gives 20 days and overlooks the stated effluent loss. The answer is an estimate based on the exercise assumptions, not a recommended process target."
          }
        },
        {
          "number": 5,
          "title": "Nutrients, final treatment, solids, and effluent protection",
          "overview": "Nutrient removal, disinfection, and solids processing share dependencies that can hide behind apparently stable unit process readings. This module examines nitrification demand for oxygen and alkalinity, denitrification needs for suitable anoxic conditions and available electron donor, and phosphorus removal pathways where installed. It connects solids processing returns with hydraulic, ammonia, and organic loading. Final treatment analysis includes the influence of suspended solids, ultraviolet transmittance, equipment condition, and validated monitoring on disinfection confidence. Learners distinguish evidence of equipment operation from evidence of treatment effectiveness. Operational reasoning considers interactions and unintended consequences rather than treating chemical, aeration, recycle, or solids handling options as independent solutions.",
          "learningPoints": [
            "Explain how nitrification depends on biomass retention, temperature, oxygen availability, pH, alkalinity, and potential inhibition.",
            "Evaluate nutrient-rich solids handling returns against their timing, mass loading, and downstream treatment capacity.",
            "Distinguish disinfection equipment status from treatment effectiveness when solids, transmittance, hydraulics, or monitoring quality changes."
          ],
          "scenario": {
            "title": "Ammonia and disinfection concerns together",
            "brief": "At fictional Willow Reach plant, a dewatering campaign coincides with higher ammonia loading in the measured return stream. Final effluent ammonia and suspended solids trend upward later in the shift. Ultraviolet equipment shows no fault alarm, but the transmittance reading has fallen. Laboratory confirmation is pending, and the transmittance sensor's cleaning record is incomplete. Historical records suggest that similar campaigns sometimes coincide with loading peaks, but no investigation has established a consistent cause. The shift team must frame the risks without treating the absence of an equipment alarm as proof of effective disinfection.",
            "prompt": "How can the team analyse the linked risks without overstating causation or treatment assurance?",
            "modelAnswer": "The return stream provides a plausible additional ammonia load, but its contribution requires flow and concentration data aligned with process travel time. Nitrification review would also consider temperature, biomass retention, dissolved oxygen, pH, alkalinity, and potential inhibition. Higher effluent solids and lower transmittance raise separate concerns about ultraviolet treatment performance; equipment without a fault alarm is not equivalent to verified effectiveness. The incomplete cleaning record creates uncertainty rather than grounds to dismiss the reading. A defensible assessment identifies approved verification needs, evaluates available treatment performance indicators, and escalates potential effluent protection concerns through site arrangements. Any discussion of response options must consider interactions, authority, and evidence needed to evaluate outcomes."
          },
          "knowledgeCheck": {
            "question": "Which interpretation of the ultraviolet equipment status is strongest?",
            "choices": [
              "No fault alarm proves effective disinfection regardless of water quality.",
              "Lower transmittance proves that every lamp has failed.",
              "Equipment status is only one input; water quality and validated performance information also matter.",
              "Pending laboratory results make all current observations irrelevant."
            ],
            "correctIndex": 2,
            "explanation": "An equipment status indication does not fully describe the conditions affecting ultraviolet treatment. Transmittance, solids, hydraulic conditions, sensor reliability, and relevant validated performance information all influence confidence. The available observations justify investigation and appropriate escalation, not a declaration of either guaranteed effectiveness or certain failure before the evidence is assessed."
          }
        },
        {
          "number": 6,
          "title": "Integrated virtual shift: case simulation, decision rationale, and instructor debrief",
          "overview": "The integrated virtual shift requires learners to build a coherent account from incomplete, sometimes conflicting evidence. A fictional event sequence combines loading changes, measurement uncertainty, biological indicators, clarifier performance, solids returns, and final treatment concerns. Learners rank risks, identify verification priorities, perform bounded calculations, and distinguish decisions within assigned authority from those needing escalation. Their response is assessed on reasoning quality rather than on selecting a predetermined operating adjustment. The instructor debrief examines alternative hypotheses, overlooked interactions, and the evidence that would justify revising a conclusion. A structured handover closes the exercise, preserving timestamps, assumptions, communications, outstanding tasks, and criteria for reassessment under approved site procedures.",
          "learningPoints": [
            "Prioritize worker safety and potential effluent consequences while separating verified observations from unresolved hypotheses.",
            "Defend verification and escalation priorities using trends, bounded calculations, uncertainty, and the limits of assigned authority.",
            "Prepare a traceable handover identifying evidence, rationale, communications, outstanding questions, and responsibility for follow-up review."
          ],
          "scenario": {
            "title": "The last hour of the virtual shift",
            "brief": "At fictional North Channel plant, wet-weather inflow is elevated, one clarifier blanket trend is rising, and an online ammonia result carries a recent maintenance flag. A solids return event appears in the log, but its volume is missing. Final treatment remains online, while effluent solids verification is pending. A nonessential inspection route includes a walkway reported as damaged. The outgoing operator has forty minutes left in the virtual shift. The instructor asks for a prioritized assessment and handover, not an operating change or a declaration that performance is acceptable.",
            "prompt": "What should a defensible virtual-shift submission contain, and how should the instructor evaluate it?",
            "modelAnswer": "A strong submission identifies the damaged walkway as a safety boundary and uses approved safe alternatives for information gathering. It separates confirmed inflow and blanket observations from uncertain ammonia and return loading information. Priorities reflect possible solids loss and effluent consequences while verification needs include instrument status, representative effluent evidence, flow distribution, and return stream records. Calculations are attempted only where inputs and boundaries support them; missing volume is recorded rather than invented. The handover names outstanding questions, responsible follow-up roles, communications, and reassessment criteria under site procedures. The instructor evaluates evidence use, uncertainty management, interaction awareness, and escalation rationale, accepting different hypotheses when they are technically supported and safely bounded."
          },
          "knowledgeCheck": {
            "question": "Which virtual-shift submission demonstrates the strongest operator reasoning?",
            "choices": [
              "A documented risk ranking with verified facts, uncertainties, safe verification priorities, escalation rationale, and assigned follow-up.",
              "A single diagnosis based on the highest displayed number, with no discussion of data quality.",
              "A declaration of acceptable performance because final treatment remains online.",
              "A detailed operating change proposed without checking authority or site procedures."
            ],
            "correctIndex": 0,
            "explanation": "The strongest submission makes the reasoning traceable and preserves safety and authority boundaries. It addresses potential consequences without pretending that incomplete evidence proves a cause. A single reading, equipment status, or detailed adjustment proposal cannot replace verified information, interaction analysis, and a clear handover of unresolved issues and responsibilities."
          }
        }
      ],
      "finalAssessment": {
        "title": "Final knowledge check",
        "instructions": "This preview assessment uses fictional information to test transferable reasoning, not authority to operate a facility. Select the single best answer for each question. The demonstration threshold is 80%; with eight equally weighted questions, at least seven correct answers are needed. This assessment does not issue a CEU or credential, and results do not establish operational competence.",
        "passingScore": 80,
        "questions": [
          {
            "question": "At a fictional plant, a current online ammonia reading is higher than a previous-day composite laboratory result. Which interpretation is best supported before further verification?",
            "choices": [
              "The laboratory result proves the current reading is incorrect.",
              "The results represent different time windows, so their comparability and quality need review.",
              "The higher result proves an ongoing biological failure.",
              "The lower result should replace the higher result in the operating record."
            ],
            "correctIndex": 1,
            "explanation": "The measurements may both be valid because they represent different periods and potentially different process conditions. Review should consider collection timing, analytical basis, maintenance status, and appropriate verification. Neither result should be discarded merely because it is less convenient. Preserving both with context supports an auditable assessment of whether a genuine process change occurred."
          },
          {
            "question": "A fictional training dataset defines F/M as daily BOD5 mass entering aeration divided by aeration basin MLVSS inventory. Flow is 6,000 m³/day, BOD5 is 150 mg/L, aeration volume is 3,000 m³, and MLVSS is 3,000 mg/L. What is F/M?",
            "choices": [
              "1.0 kg BOD5/(kg MLVSS·day)",
              "0.01 kg BOD5/(kg MLVSS·day)",
              "0.10 kg BOD5/(kg MLVSS·day)",
              "10 kg BOD5/(kg MLVSS·day)"
            ],
            "correctIndex": 2,
            "explanation": "Using 0.001 to convert m³ multiplied by mg/L into kilograms, the applied BOD5 load is 6,000 × 150 × 0.001 = 900 kg/day. MLVSS inventory is 3,000 × 3,000 × 0.001 = 9,000 kg. Dividing gives 0.10 kg BOD5/(kg MLVSS·day). This result applies to the stated aeration boundary and concentration basis, not an automatic operating target."
          },
          {
            "question": "A fictional system contains 12,000 kg of suspended solids within its defined SRT boundary. Daily wasting removes 650 kg and effluent removes 150 kg; there are no other solids exits in the exercise. What is the simplified SRT?",
            "choices": [
              "15 days",
              "18.5 days",
              "80 days",
              "0.067 days"
            ],
            "correctIndex": 0,
            "explanation": "Total solids loss is 650 + 150 = 800 kg/day. Dividing the 12,000 kg inventory by that loss gives 15 days. The approximately 18.5-day option excludes effluent solids and therefore overestimates SRT for this dataset. The calculation assumes the inventory and loss estimates represent a compatible period and the stated boundary includes all relevant exits."
          },
          {
            "question": "Following a wet-weather flow increase at a fictional plant, clarifier blankets and effluent suspended solids rise. One settling test is unchanged and microscopy is unavailable. Which conclusion is most defensible?",
            "choices": [
              "Filamentous bulking is confirmed and competing explanations can be excluded.",
              "An unchanged settling test proves that clarification is satisfactory.",
              "Stable mixed liquor concentration rules out biomass loss in the effluent.",
              "Hydraulic and solids loading effects merit investigation, while settleability problems remain unconfirmed."
            ],
            "correctIndex": 3,
            "explanation": "The timing supports investigating hydraulic loading, solids distribution, flow splitting, and return flow performance. One unchanged settling test does not characterize every basin or exclude other separation problems. Rising effluent solids also indicate a potential solids loss pathway even when a mixed liquor concentration appears stable. A diagnosis requires converging evidence rather than a single indicator."
          },
          {
            "question": "At a fictional plant, verified effluent ammonia rises as wastewater temperature and alkalinity decline. Aeration dissolved oxygen readings remain near their recent range. Which analysis is strongest?",
            "choices": [
              "Stable dissolved oxygen proves nitrification cannot be impaired.",
              "Temperature, pH, alkalinity, biomass retention, loading, and possible inhibition require review alongside oxygen data.",
              "Lower temperature necessarily improves nitrifier growth enough to offset all other limitations.",
              "Alkalinity is unrelated to nitrification, so only the ammonia instrument warrants review."
            ],
            "correctIndex": 1,
            "explanation": "Nitrification depends on several interacting conditions. Lower temperature can reduce nitrifier growth rates, while alkalinity consumption can contribute to pH limitation if buffering is inadequate. Stable oxygen readings at monitored locations do not establish adequate biomass retention, representative oxygen availability, or absence of inhibition. The strongest analysis considers these factors together without prescribing an adjustment."
          },
          {
            "question": "In a fictional anoxic zone, nitrate enters consistently, but nitrate removal declines. Verified dissolved oxygen is higher than the zone's historical range and readily biodegradable carbon availability is uncertain. Which explanation is most technically sound?",
            "choices": [
              "Nitrate removal by denitrification is independent of electron donor availability.",
              "Higher dissolved oxygen always improves anoxic denitrification.",
              "The observations prove phosphorus removal is the sole cause.",
              "Oxygen intrusion and limited available electron donor are plausible contributors that require further evidence."
            ],
            "correctIndex": 3,
            "explanation": "Conventional heterotrophic denitrification requires suitable anoxic conditions and an available electron donor, commonly biodegradable organic carbon. Oxygen can divert donor consumption toward aerobic respiration, while limited donor availability can restrict nitrate reduction. The observations support these hypotheses but do not establish their relative contributions. Flow paths, carbon characteristics, representative measurements, and loading trends would strengthen the analysis."
          },
          {
            "question": "A fictional ultraviolet system shows no equipment fault alarm, but verified transmittance has fallen and effluent suspended solids have risen. Which conclusion is best?",
            "choices": [
              "Disinfection confidence requires review of water quality and validated performance information; alarm status alone is insufficient.",
              "No equipment fault alarm guarantees effective disinfection.",
              "Higher suspended solids necessarily improve ultraviolet penetration.",
              "Lower transmittance proves all ultraviolet lamps are electrically disconnected."
            ],
            "correctIndex": 0,
            "explanation": "Ultraviolet treatment effectiveness depends on more than whether equipment reports a fault. Lower transmittance and increased solids can adversely affect delivery of ultraviolet exposure or microbial shielding, depending on system conditions. Relevant validated performance information, monitoring quality, hydraulics, and site procedures inform the assessment. The observations justify review and appropriate escalation, not automatic assurance or an unsupported failure diagnosis."
          },
          {
            "question": "During a fictional virtual shift, a potential effluent concern remains unresolved, a proposed inspection route is unsafe, and an operating response under discussion exceeds the learner's assigned authority. Which submission is best?",
            "choices": [
              "Recommend the unauthorized response because treatment urgency overrides authority limits.",
              "Omit uncertain observations from the handover until every result is confirmed.",
              "Document verified facts and uncertainties, respect the unsafe-route boundary, and explain safe verification, escalation, and follow-up priorities.",
              "Declare performance acceptable because no final laboratory result is available."
            ],
            "correctIndex": 2,
            "explanation": "A defensible submission protects people while retaining visibility of potential water quality consequences. It distinguishes facts from hypotheses and identifies who must review decisions beyond the assigned role. Missing confirmation does not justify either concealment or a declaration of acceptable performance. Traceable documentation and assigned follow-up allow the next responsible person to continue the assessment safely."
          }
        ]
      }
    }
  ]
};

export function getCeuPreviewCourse(courseKey: string) {
  return CEU_PREVIEW_CURRICULUM.courses.find((course) => course.courseKey === courseKey);
}
