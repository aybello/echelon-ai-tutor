import { createHash } from "node:crypto";
import type {
  CeuExerciseAnswer,
  CeuExerciseQuestion,
} from "../../shared/ceuLearning";
import { ceuCourse } from "./catalogue";

interface KeyedItem extends CeuExerciseQuestion {
  correct: CeuExerciseAnswer;
  tolerance?: number;
  explanation: string;
  criterion: number;
}
/** Each pair is an intentionally incorrect but case-specific interpretation of the matching rubric criterion. */
const distractorBank: Record<string, [string, string][]> = {
  "water-balance": [
    [
      "Current volume is 6,912 m³/day and mass is 172.8 kg/day; the larger pair is the earlier condition.",
      "Current and prior chemical masses are equal because concentration is unchanged.",
    ],
    [
      "The 200-minute basin result is proven T10 even without hydraulic evidence.",
      "A basin's nominal time cannot be calculated from volume and flow.",
    ],
    [
      "The downstream event occurred at 08:45 regardless of process lag.",
      "The downstream event occurred at 10:45 without needing a configuration assumption.",
    ],
  ],
  "raw-water": [
    [
      "Similar turbidity proves the source temperature, DOC and alkalinity are unchanged.",
      "The shoreline grab by itself establishes the intake conditions for the entire interval.",
    ],
    [
      "The supplied changes establish exact pH values of 33 and 6.",
      "Dose and buffering data cannot be calculated under the stated scenario assumption.",
    ],
    [
      "Treat the shoreline sample as interchangeable with intake samples.",
      "Approve a feed change before representative source and downstream tests are obtained.",
    ],
  ],
  coagulation: [
    [
      "The active-basis doses are 11.0 and 13.2 mg/L in the reverse condition order.",
      "The plant flow can be ignored when converting the delivered active mass to dose.",
    ],
    [
      "Jar C satisfies the fictional pH constraint and needs no further verification.",
      "Jar B is authorized for a plant change solely because its jar result is promising.",
    ],
    [
      "Choose acceptance criteria after viewing the trial results.",
      "Consider settled turbidity alone and omit downstream checks and authorization.",
    ],
  ],
  filters: [
    [
      "Both filters operate at the 5 m/h average and have identical headloss growth.",
      "Filter 2 loads at 4 m/h while Filter 1 loads at 6 m/h.",
    ],
    [
      "Combined turbidity demonstrates that every individual filter is satisfactory.",
      "Missing records establish the cause of Filter 2's higher headloss.",
    ],
    [
      "Change filter operation first and reconcile the unit data afterward.",
      "Compare unmatched times and treat a paperwork gap as instrument failure.",
    ],
  ],
  ct: [
    [
      "The higher-flow ratio remains 1.20 because residual stays the same.",
      "Baseline nominal time is 60 minutes and T10 is 120 minutes.",
    ],
    [
      "Use dose at the feed point as the residual concentration in the CT product.",
      "Treat nominal detention time and T10 as interchangeable for the ratio.",
    ],
    [
      "Apply the training requirement and factor as universal Ontario operating limits.",
      "Treat a favourable fictional CT ratio as proof of every other treatment barrier.",
    ],
  ],
  trial: [
    [
      "A lower mass rate at lower flow proves the active dose fell below 15 mg/L.",
      "The active dose rose in the candidate period solely because production fell.",
    ],
    [
      "Settled turbidity alone proves the chemical change improved every barrier.",
      "Temperature, flow and Filter 2 headloss cannot affect trial interpretation.",
    ],
    [
      "Adopt the candidate before downstream outcomes or trial authority are checked.",
      "Rewrite the acceptance criteria after the result to declare all barriers successful.",
    ],
  ],
  "inventory-boundary": [
    [
      "Total inventory is 780 kg and daily losses are 10,050 kg/day.",
      "Use aeration mass alone but still report 10,050 kg for the full boundary.",
    ],
    [
      "The SRT including the clarifier is 11.538 days, lower than the aeration-only result.",
      "Adding clarifier solids leaves SRT unchanged because daily losses stay fixed.",
    ],
    [
      "Use one grab MLSS as a verified average for every tank and clarifier.",
      "Leave the clarifier boundary implicit while comparing the two SRT results.",
    ],
  ],
  "settling-diagnosis": [
    [
      "Both SVI values are 100 mL/g despite the changed settled volume.",
      "The second SVI is 160 mg/L, so it cannot be compared to the first.",
    ],
    [
      "The second feed-solids loading is 90 rather than 106.67 kg/(m²·day).",
      "Use water flow alone and omit the feed-solids concentration from loading.",
    ],
    [
      "The SVI change alone proves RAS pump failure.",
      "The higher loading alone rules out hydraulic and settling alternatives.",
    ],
  ],
  "nitrogen-diagnosis": [
    [
      "Alkalinity consumption is 37.2 mg/L and the remainder is 142.8 mg/L.",
      "The simplified remainder is a direct pH prediction for the aeration basin.",
    ],
    [
      "One DO probe reading establishes oxygen everywhere in the basin.",
      "Temperature and possible inhibition need no review when ammonia rises.",
    ],
    [
      "Assert an SRT trend from a single inventory snapshot.",
      "Predict exact operating pH from simplified alkalinity arithmetic.",
    ],
  ],
  "recovery-trial": [
    [
      "An improved DO reading proves ammonia removal and settling have both recovered.",
      "Ignore the verified DO improvement because the other outcomes are unresolved.",
    ],
    [
      "Calculate SRT without clarifier solids while calling it total inventory.",
      "Treat SVI, inventory and alkalinity as interchangeable measures.",
    ],
    [
      "Change waste and RAS rates before assigning authority or verification.",
      "Close the trial on DO alone without checking ammonia and settling later.",
    ],
  ],
  "sample-design": [
    [
      "Collect every sample at a convenient time regardless of the decision interval.",
      "Use a single downstream location to answer a spatial-source question.",
    ],
    [
      "Call two repeats from one bottle independent spatial locations.",
      "Treat two different locations as replicate measurements of one sample.",
    ],
    [
      "Replace required compliance sampling with the investigation grab plan.",
      "Assume preservation and method details without confirming them.",
    ],
  ],
  custody: [
    [
      "Subtract the later clock time from the earlier one without crossing midnight.",
      "Treat the overnight transfer as a negative elapsed interval.",
    ],
    [
      "Overwrite the original sample ID after a correction.",
      "Assume a handwritten correction silently amends the issued laboratory report.",
    ],
    [
      "Infer a regulatory method limit from the timeline alone.",
      "Cancel the operational response solely because a receipt was amended.",
    ],
  ],
  "quality-control": [
    [
      "Calculate RPD using one duplicate value as the denominator.",
      "Treat a blank detection as an exact correction to subtract from every sample.",
    ],
    [
      "Subtract the blank and publish the corrected number as the true result.",
      "Select the higher duplicate as definitive without the method's rule.",
    ],
    [
      "Replace a less-than reporting-limit result with zero.",
      "Treat a censored result as an exact measured concentration.",
    ],
  ],
  "qualified-report": [
    [
      "Retain Q6's five unsupported claims because no new sample was collected.",
      "Correct only the arithmetic claim and leave the source and quality claims intact.",
    ],
    [
      "Summarize the conclusion without linking it to stable sample IDs.",
      "Ask for more data without naming which decision the data would support.",
    ],
    [
      "Declare the analytical result compliant before method and response review.",
      "Suspend all operational response until every laboratory uncertainty is resolved.",
    ],
  ],
  "jar-design": [
    [
      "Rank the jars by one replicate and ignore the other.",
      "Use an arithmetic mean from mismatched jars as a verified replicate mean.",
    ],
    [
      "Select lowest turbidity even when the jar violates the case pH constraint.",
      "Select the best pH alone and ignore clarified-water turbidity.",
    ],
    [
      "Transfer the jar winner to the plant without downstream testing.",
      "Assume the new source behaves exactly like the original jar water.",
    ],
  ],
  "feed-calibration": [
    [
      "Use pump nameplate delivery as the measured chemical mass.",
      "Treat solution litres as kilograms of active ingredient without density or fraction.",
    ],
    [
      "Apply the product mass fraction twice after converting with density.",
      "Omit density entirely when deriving mass from delivered solution volume.",
    ],
    [
      "Use the theoretical feed setting as proof of verified actual dose.",
      "Authorize a change from a bench calculation without field verification.",
    ],
  ],
  "filter-record": [
    [
      "Both individual loading rates are 5 m/hour.",
      "Swap the filters and report the 6 m/hour value for Filter 1.",
    ],
    [
      "Treat a combined reading as the headloss trend of each filter.",
      "Use an unweighted turbidity mean instead of the case's 0.17 NTU weighted result.",
    ],
    [
      "Dismiss the alarm because the combined turbidity is acceptable.",
      "Attribute the alarm to media failure before instrument evidence is checked.",
    ],
  ],
  "trial-design": [
    [
      "The trial has a lower dose merely because it uses less chemical per day.",
      "The baseline and candidate differ in dose despite both calculating to 15 mg/L.",
    ],
    [
      "Ignore changes in raw water and assess causation from one short interval.",
      "Treat the short interval as proof of sustained downstream performance.",
    ],
    [
      "Change plant setpoints before defining stop conditions.",
      "Measure settled water only and omit downstream barriers and authorization.",
    ],
  ],
  hydraulics: [
    [
      "Use the full 900 m³ drawing volume as D1's active water volume.",
      "Divide 600 by 400 and report 1.5 minutes without converting hours.",
    ],
    [
      "Use the old worksheet's 0.70 factor because it raises the result.",
      "Assume the unlabelled factor is valid for D1's active configuration.",
    ],
    [
      "Apply the D1 factor to D2 as an approved low-level basis.",
      "Treat the D2 sensitivity as proof of authorized CT credit.",
    ],
  ],
  "ct-inputs": [
    [
      "Use the 1.10 mg/L upstream total residual for a 1.32 ratio.",
      "Divide the case CT requirement by the achieved CT to report 1.19.",
    ],
    [
      "Substitute upstream total chlorine for segment-end free chlorine.",
      "Use the largest residual regardless of location and species.",
    ],
    [
      "Carry the 10°C required CT into the 7°C interval as verified.",
      "Declare compliance at 10:30 without a valid cold-water criterion.",
    ],
  ],
  segments: [
    [
      "Use 0.60 plus 0.05 and call the total 1.10.",
      "Calculate both D5 segment ratios from the same segment residual.",
    ],
    [
      "Combine D6 residuals and flow readings from different timestamps.",
      "Apply D5's total ratio unchanged throughout the D6 interval.",
    ],
    [
      "Fill a missing interval using the most favourable neighbouring value.",
      "Apply the fictional segment method as a universal plant rule.",
    ],
  ],
  "ct-audit": [
    [
      "Retain the original inflated ratio of 1.32 for D3.",
      "Replace the D3 segment-end free residual with an upstream total result.",
    ],
    [
      "Call D4 compliant because its residual stayed the same.",
      "Treat a conditional D2 result as verified hydraulic credit.",
    ],
    [
      "Delete the earlier worksheet rather than preserve its error trail.",
      "Close every exception without assigning evidence or verification ownership.",
    ],
  ],
  "process-map": [
    [
      "Convert influent concentration directly to a daily load without flow.",
      "Apply the changed concentration to the earlier flow when comparing loads.",
    ],
    [
      "Call centrate an upstream headworks inflow.",
      "Omit the internal recycle boundary when describing process loading.",
    ],
    [
      "Declare the daily trend certain from isolated grab samples.",
      "Change operations without naming who owns verification.",
    ],
  ],
  monitoring: [
    [
      "Pair Tuesday's sample with Monday's flow.",
      "Treat every sample time as representing the same daily flow interval.",
    ],
    [
      "Replace the censored TP result with exactly zero.",
      "Use the reporting limit as an exact measured TP concentration.",
    ],
    [
      "Wait for the daily composite before addressing an urgent process signal.",
      "Claim a daily compliance outcome from unmatched short samples.",
    ],
  ],
  biological: [
    [
      "Report SVI in mg/L instead of mL/g.",
      "Compute both SVI values from one unchanging MLSS basis.",
    ],
    [
      "Attribute the blanket change solely to hydraulic load.",
      "Treat the RAS delivery observation as proof settling cannot matter.",
    ],
    [
      "Prescribe a single adjustment from one possible mechanism.",
      "Skip verification of the alternative clarifier and RAS explanations.",
    ],
  ],
  "solids-age": [
    [
      "Mix kg inventory with g/day losses in the SRT ratio.",
      "Leave the clarifier solids out while labeling the result total inventory.",
    ],
    [
      "Ignore effluent solids in the sensitivity calculation.",
      "Compare an aeration-only numerator with full-boundary losses without labeling it.",
    ],
    [
      "Treat the simplified SRT as a universal operating target.",
      "Hide the boundary assumption and issue an immediate waste-rate command.",
    ],
  ],
  "nutrients-solids": [
    [
      "Use hourly flow as if it were daily flow in the load calculation.",
      "Multiply by 24 twice when converting hourly and daily loads.",
    ],
    [
      "Call nitrification complete nitrogen removal.",
      "Assume falling ammonia proves total nitrogen fell by the same amount.",
    ],
    [
      "Infer a chemical failure from only two total-P grabs.",
      "Treat soluble and total phosphorus as interchangeable sample fractions.",
    ],
  ],
  "virtual-shift": [
    [
      "Use the earlier unverified RAS indication after the update.",
      "Treat one DO increase as proof of all downstream recovery.",
    ],
    [
      "Report SRT and F/M without their case boundaries.",
      "Exclude the sidestream contribution while claiming whole-plant loading.",
    ],
    [
      "Close the shift with no owner for pending measurements.",
      "Issue an operating command before the site's authorization pathway is checked.",
    ],
    [
      "Claim falling flow proves the biology has recovered.",
      "Treat one improved value as closure of every unresolved nutrient concern.",
    ],
  ],
  "signal-scaling": [
    [
      "Treat the raw 4–20 mA signal as an engineering-unit level.",
      "Assume the displayed level is physical truth because communications are healthy.",
    ],
    [
      "Use communications status as proof of correct scaling.",
      "Accept a plausible historian trend without transmitter verification.",
    ],
    [
      "Rewrite historical data before a controlled verification.",
      "Close the discrepancy without qualifying affected reports and alarms.",
    ],
  ],
  "time-quality": [
    [
      "Leave the pump event at the uncorrected 08:12 offset.",
      "Subtract timestamps without retaining which device clock produced each.",
    ],
    [
      "Overwrite original timestamps with adjusted display times.",
      "Assume the independent logger uses the same clock as the historian.",
    ],
    [
      "Interpret held values as stable operation.",
      "Replace all stale samples with zero and report them as measurements.",
    ],
  ],
  "alarm-evidence": [
    [
      "Treat alarm acknowledgment as evidence that the cause was fixed.",
      "Call an alarm closed when only the operator receipt was recorded.",
    ],
    [
      "Assume an override is authorized without a change record.",
      "Rely on the disabled alarm without another monitoring route.",
    ],
    [
      "Discard repeat events after one acknowledgment.",
      "Claim resolution without checking the process outcome.",
    ],
  ],
  "data-audit": [
    [
      "Retain I7's unsupported scaling and timing assertions.",
      "Change only the display claim and leave the other four unsupported.",
    ],
    [
      "Verify the transmitter alone while ignoring historian and alarms.",
      "Assume dashboard correction also fixes archived reports automatically.",
    ],
    [
      "Close the audit when a fix is proposed but not implemented.",
      "Claim corrected records without documented before-and-after evidence.",
    ],
  ],
  "compliance-map": [
    [
      "Treat Morgan's job title as proof of current designation.",
      "Use the obsolete relief binder as the controlling role register.",
    ],
    [
      "Invent the absent alternate's licence and designation.",
      "Assume the old binder supersedes RESP-04 without a change record.",
    ],
    [
      "Leave the open event with an unnamed manager.",
      "Assign the shift handover to Morgan solely because the binder says so.",
    ],
  ],
  limits: [
    [
      "Call the gap at 08:20 a zero reading.",
      "State exactly ten minutes of exposure from two sampled observations.",
    ],
    [
      "Use the field value to invalidate the online record without method or location.",
      "Assume the field and online results refer to the same water parcel.",
    ],
    [
      "Treat the internal warning as a statutory limit.",
      "Delay protective response until every instrument question is resolved.",
    ],
  ],
  sampling: [
    [
      "Treat the location correction as a change in measured concentration.",
      "Disconnect B104 from L8821 because the identifiers differ.",
    ],
    [
      "Overwrite the first receipt and original R1 report.",
      "Invent a resample rather than preserve the R1/R2 amendment chain.",
    ],
    [
      "Assume an amended report cancels all notification duties.",
      "State that external notification occurred without a communication record.",
    ],
  ],
  response: [
    [
      "Treat a call attempt as confirmed external notification.",
      "Assume an acknowledgment proves the direction was implemented.",
    ],
    [
      "Close the event after one later normal reading.",
      "Ignore pending results because the latest sample improved.",
    ],
    [
      "Invent a universal reporting deadline without checking the source.",
      "Leave corrective actions unowned and closure evidence undefined.",
    ],
  ],
  records: [
    [
      "Replace the original L17 log with corrected text.",
      "State the chlorine method was verified because the location was corrected.",
    ],
    [
      "Overwrite original instrument time after calculating the offset.",
      "Use adjusted display time without retaining the source clock.",
    ],
    [
      "Close M17's missing export with no owner.",
      "Leave amended claims detached from their original evidence IDs.",
    ],
  ],
  practicum: [
    [
      "Claim day-1 and day-2 concerns share a proven cause.",
      "Drop the first report once the later correction is issued.",
    ],
    [
      "Assume notifications occurred because duties exist.",
      "Close pending verification without reviewing the responsible role.",
    ],
    [
      "Equate F31 total chlorine with online free residual.",
      "Dismiss the unresolved laboratory issue because the field comparison changed.",
    ],
    [
      "Invent results and declare final closure.",
      "Omit owners and a traceable handover for pending evidence.",
    ],
  ],
  "storage-turnover": [
    [
      "Treat the conditional 2/4-day indicators as measured maximum age.",
      "Use bypass demand as tank throughput for every turnover estimate.",
    ],
    [
      "Include bypassed demand in tank drawdown.",
      "Assume total zone demand is identical to actual storage outflow.",
    ],
    [
      "Claim an approved volume change from the screening calculation.",
      "Report maximum water age without any tracer or mixing evidence.",
    ],
  ],
  "residual-patterns": [
    [
      "Reverse the baseline and comparison dates in the percentage change.",
      "Use the later value as the baseline for every reported decline.",
    ],
    [
      "Attribute the pattern to water age alone.",
      "Ignore temperature and sample-path differences in the comparison.",
    ],
    [
      "Use one noncomparable grab to prove a zone-wide trend.",
      "Change operations before aligning location, time and method.",
    ],
  ],
  "pressure-repair": [
    [
      "Fill the pressure-data gap with a normal value.",
      "Classify excavation water as safe without characterization.",
    ],
    [
      "Treat sample collection as proof of laboratory receipt and clearance.",
      "Assume an unreported result grants restart authorization.",
    ],
    [
      "Invent a universal clearance threshold.",
      "Ignore the current repair procedure's decision roles.",
    ],
  ],
  "zone-plan": [
    [
      "Merge repair response and storage optimization into one closure task.",
      "Delay the repair pathway until the optimization study is complete.",
    ],
    [
      "Call a turnover indicator proof of the residual decline's cause.",
      "Use a bounded trend as definitive evidence of every zone condition.",
    ],
    [
      "Close all issues when one owner signs a general handover.",
      "Omit separate evidence for repair clearance and water-quality follow-up.",
    ],
  ],
  "wet-weather": [
    [
      "Report a peak ratio of 0.43 rather than 2.33.",
      "Use the dry-weather total as the wet-weather excess.",
    ],
    [
      "Name one connection as the source based on timing alone.",
      "Treat correlated rainfall and flow as proof of a specific defect.",
    ],
    [
      "Ignore sensitivity to the dry-weather baseline.",
      "Request no catchment evidence before choosing a source investigation.",
    ],
  ],
  "storage-capacity": [
    [
      "Keep the initial three-hour estimate after storage and rate change.",
      "Divide remaining volume by inflow rather than net accumulation.",
    ],
    [
      "Assume the original net fill rate persisted unchanged.",
      "Use initial free volume instead of the 95 m³ remaining.",
    ],
    [
      "Present the estimated time as a guaranteed alarm time.",
      "Change the trigger outside the authorized response procedure.",
    ],
  ],
  "incident-volume": [
    [
      "Use the uncertain onset as a precisely known start time.",
      "Report the entire 17.5 m³ as directly observed.",
    ],
    [
      "State 11:05 was the confirmed onset.",
      "Dismiss the possibility of an earlier unobserved interval.",
    ],
    [
      "Replace the range with one unqualified exact number.",
      "Omit the volume-estimation method and its uncertainty.",
    ],
  ],
  "response-plan": [
    [
      "Call restored flow proof that reporting and investigation are complete.",
      "Treat cessation of discharge as proof all recovery tasks are closed.",
    ],
    [
      "Retain the old net accumulation after inflow changes.",
      "Omit the revised incident-volume range from the response log.",
    ],
    [
      "Declare blanket closure without independent checks.",
      "Assign no owner to the remaining reporting and investigation tasks.",
    ],
  ],
};
const numericCases: Record<
  string,
  {
    prompt: string;
    value: number;
    tolerance: number;
    unit: string;
    criterion: number;
    retry: { prompt: string; value: number };
  }[]
> = {
  "ceu-disinfection-ct/hydraulics": [
    {
      prompt:
        "Using D1's active 600 m³ and verified 400 m³/hour, what is the nominal contact time?",
      value: 90,
      tolerance: 0.1,
      unit: "minutes",
      criterion: 0,
      retry: {
        prompt:
          "Alternative D1 condition: active volume 600 m³ at 500 m³/hour. What is nominal time?",
        value: 72,
      },
    },
    {
      prompt: "Using D1's supported factor of 0.40, what is T10?",
      value: 36,
      tolerance: 0.1,
      unit: "minutes",
      criterion: 0,
      retry: {
        prompt:
          "Alternative D1 condition: nominal time 72 minutes with supported factor 0.40. What is T10?",
        value: 28.8,
      },
    },
  ],
  "ceu-disinfection-ct/ct-inputs": [
    {
      prompt:
        "Using D3's segment-end free chlorine and supported T10, what is achieved CT?",
      value: 25.2,
      tolerance: 0.05,
      unit: "mg·min/L",
      criterion: 0,
      retry: {
        prompt:
          "Alternative D3 condition: segment-end free chlorine 0.80 mg/L and supported T10 36 minutes. What is achieved CT?",
        value: 28.8,
      },
    },
    {
      prompt:
        "Divide D3's achieved CT by the case-authorized required CT. What is the ratio?",
      value: 0.84,
      tolerance: 0.005,
      unit: "ratio",
      criterion: 0,
      retry: {
        prompt:
          "Alternative D3 condition: achieved CT 28.8 against case requirement 30. What is the ratio?",
        value: 0.96,
      },
    },
  ],
  "ceu-activated-sludge-troubleshooting/inventory-boundary": [
    {
      prompt: "What is the total solids inventory in the supplied boundary?",
      value: 10050,
      tolerance: 1,
      unit: "kg",
      criterion: 0,
      retry: {
        prompt:
          "Alternative inventory: 10,050 kg in the original boundary plus 950 kg verified in the clarifier. What is the revised total?",
        value: 11000,
      },
    },
    {
      prompt: "What is the SRT including clarifier inventory?",
      value: 12.885,
      tolerance: 0.02,
      unit: "days",
      criterion: 1,
      retry: {
        prompt:
          "Alternative inventory 11,000 kg with the same 780 kg/day losses. What is simplified SRT?",
        value: 14.103,
      },
    },
  ],
  "ceu-collection-wet-weather/storage-capacity": [
    {
      prompt:
        "At the initial net filling rate, what is the time to the trigger?",
      value: 3,
      tolerance: 0.01,
      unit: "hours",
      criterion: 0,
      retry: {
        prompt:
          "Alternative initial condition: 100 m³ to the trigger at 40 m³/hour net fill. What is the time?",
        value: 2.5,
      },
    },
    {
      prompt:
        "With 95 m³ remaining and 50 m³/hour net fill, what is the updated time?",
      value: 1.9,
      tolerance: 0.01,
      unit: "hours",
      criterion: 1,
      retry: {
        prompt:
          "Alternative updated condition: 120 m³ remaining at 50 m³/hour net fill. What is the time?",
        value: 2.4,
      },
    },
  ],
  "ceu-coagulation-filtration/filter-record": [
    {
      prompt: "What is the first filter's loading rate in the case?",
      value: 4,
      tolerance: 0.01,
      unit: "m/hour",
      criterion: 0,
      retry: {
        prompt:
          "Alternative Filter 1 condition: 450 m³/hour over 90 m². What is the loading rate?",
        value: 5,
      },
    },
    {
      prompt: "What is the second filter's loading rate in the case?",
      value: 6,
      tolerance: 0.01,
      unit: "m/hour",
      criterion: 0,
      retry: {
        prompt:
          "Alternative Filter 2 condition: 630 m³/hour over 90 m². What is the loading rate?",
        value: 7,
      },
    },
  ],
};
function hash(seed: string, id: string) {
  return parseInt(
    createHash("sha256")
      .update(seed + ":" + id)
      .digest("hex")
      .slice(0, 8),
    16
  );
}
/** Server-only authored key material. Public delivery strips correct answers and explanations. */
export function exerciseFor(
  courseKey: string,
  moduleId: string,
  seed: string,
  variant = 0
): KeyedItem[] {
  const module = ceuCourse(courseKey)?.modules.find(m => m.id === moduleId);
  if (!module) throw new Error("Unknown case exercise.");
  const items: KeyedItem[] = module.rubric.map((criterion, i) => {
    const id = module.id + "-criterion-" + i;
    const distractors = distractorBank[moduleId]?.[i];
    if (!distractors)
      throw new Error(
        `Missing authored distractors for ${courseKey}/${moduleId} criterion ${i + 1}.`
      );
    const choices = ["", "", ""];
    const index = (hash(seed, id) + variant) % 3;
    choices[index] = criterion;
    choices[(index + 1) % 3] = distractors[0];
    choices[(index + 2) % 3] = distractors[1];
    return {
      id,
      prompt: `Using the evidence in ${module.title}, which interpretation best addresses case criterion ${i + 1}?`,
      type: "single" as const,
      choices,
      correct: index,
      criterion: i,
      explanation: `The evidence-based interpretation is: ${criterion} Review the case file and acceptance criteria before retrying.`,
    };
  });
  for (const [i, n] of (
    numericCases[courseKey + "/" + moduleId] ?? []
  ).entries())
    items.push({
      id: moduleId + "-numeric-" + i,
      prompt: variant % 2 ? n.retry.prompt : n.prompt,
      type: "number",
      unit: n.unit,
      correct: variant % 2 ? n.retry.value : n.value,
      tolerance: n.tolerance,
      criterion: n.criterion,
      explanation: `The case calculation yields ${variant % 2 ? n.retry.value : n.value} ${n.unit}. Check the stated units and case assumptions.`,
    });
  if (courseKey === "ceu-sampling-data-quality" && moduleId === "sample-design")
    items.push({
      id: "sample-design-multiple",
      prompt: "Select both safeguards supported by the sample-design evidence.",
      type: "multiple",
      choices: [
        "Match locations and times to the decision",
        "Treat repeats as separate spatial locations",
        "Preserve required compliance sampling",
        "Replace method verification with a grab sample",
      ],
      correct: [0, 2],
      criterion: 0,
      explanation:
        "A decision-aligned plan retains required sampling and distinguishes repeats from spatial samples.",
    });
  if (courseKey === "ceu-disinfection-ct" && moduleId === "hydraulics")
    items.push({
      id: "hydraulics-order",
      prompt: "Put the D1 hydraulic calculation steps in order.",
      type: "order",
      choices: [
        "Identify active volume and verified flow",
        "Convert volume/flow to nominal minutes",
        "Apply the factor supported for D1",
        "Label the resulting T10 and its validity range",
      ],
      correct: [0, 1, 2, 3],
      criterion: 0,
      explanation:
        "Identify supported inputs, calculate nominal time, then apply the supported factor and its validity conditions.",
    });
  for (const item of items.filter(
    q => q.type === "multiple" || q.type === "order"
  )) {
    const original = item.choices!;
    const rotated = original.map(
      (_, i) => original[(i + variant) % original.length]
    );
    const oldAnswer = item.correct as number[];
    item.correct = oldAnswer.map(
      i => (i - (variant % original.length) + original.length) % original.length
    );
    item.choices = rotated;
  }
  return items;
}
export function publicExercise(items: KeyedItem[]): CeuExerciseQuestion[] {
  return items.map(
    ({ correct, explanation, tolerance, criterion, ...item }) => item
  );
}
export function gradeExercise(
  items: KeyedItem[],
  answers: CeuExerciseAnswer[]
) {
  if (answers.length !== items.length)
    throw new Error("Answer every case-exercise item.");
  const feedback = items.map((item, i) => {
    const answer = answers[i];
    let correct = false;
    if (item.type === "number")
      correct =
        typeof answer === "number" &&
        Number.isFinite(answer) &&
        Math.abs(answer - (item.correct as number)) <= (item.tolerance ?? 0);
    else if (item.type === "single")
      correct =
        typeof answer === "number" &&
        Number.isInteger(answer) &&
        answer === item.correct;
    else if (Array.isArray(answer) && Array.isArray(item.correct))
      correct =
        item.type === "multiple"
          ? [...answer].sort((a, b) => a - b).join(",") ===
            [...item.correct].sort((a, b) => a - b).join(",")
          : answer.join(",") === item.correct.join(",");
    return {
      id: item.id,
      correct,
      explanation: item.explanation,
      correctAnswer:
        item.type === "number"
          ? item.correct
          : Array.isArray(item.correct)
            ? item.correct.map(j => item.choices![j])
            : item.choices![item.correct as number],
    };
  });
  return {
    score: feedback.filter(f => f.correct).length,
    total: items.length,
    feedback,
  };
}
