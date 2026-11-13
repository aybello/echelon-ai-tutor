# CEU Depth Rebuild Plan (2026-09-28)

## Problem measured
All ten CEU courses advertise 3 to 10 planned hours but contain only 6 to 25 minutes of real reading content.

| Course | Planned min | Words | Checks | Final Q |
|---|---|---|---|---|
| ceu-drinking-water-compliance | 600 | 4990 | 12 | 12 |
| ceu-water-treatment-process-control | 600 | 4205 | 12 | 12 |
| ceu-wastewater-treatment-process-control | 600 | 2245 | 12 | 12 |
| ceu-disinfection-ct | 240 | 2336 | 8 | 8 |
| ceu-activated-sludge-troubleshooting | 240 | 1204 | 8 | 8 |
| ceu-coagulation-filtration | 240 | 1157 | 8 | 8 |
| ceu-sampling-data-quality | 180 | 1346 | 8 | 8 |
| ceu-collection-wet-weather | 180 | 1160 | 8 | 8 |
| ceu-distribution-water-quality | 180 | 1135 | 8 | 8 |
| ceu-instrumentation-scada | 180 | 1115 | 8 | 8 |

Only `ceu-disinfection-ct` has an alternate final assessment. Sources per course: 2 to 5.

## Target standard
- Lesson depth per module sized to the module's planned minutes, roughly 1,800 to 2,600 words of real teaching.
- 6 or more checks per module.
- 30 or more final questions per course, plus a full alternate final of equal size.
- Keep existing verified source lists and jurisdiction boundaries.

## Hard safety rules carried from prior audits
- Study/training material only. Never state a universal compliance limit, dose, setpoint or reporting deadline as if it applies everywhere.
- Point learners to the facility approval or permit, validated procedure, sampling plan and governing jurisdiction.
- Ontario sewage works follow their Environmental Compliance Approval; requirements are receiving-water based.
- Ontario adverse drinking water results: immediate verbal report, then written notice within 24 hours after that report.
- CT is condition-specific; no universal CT, UV dose, turbidity, residual or log-credit value.
- Canadian acute lethality (WSER): more than 50% rainbow trout mortality in undiluted effluent over 96 hours, by accredited lab test.
- CEU pilot remains non-credit. No approved CEUs, accreditation, operator qualification or regulatory recognition.

## Verified source URLs already in use
- Ontario Procedure for Disinfection of Drinking Water: https://www.ontario.ca/page/procedure-disinfection-drinking-water-ontario
- Ontario O. Reg. 128/04 (operator designation, duties, records): https://www.ontario.ca/laws/regulation/040128
- Ontario O. Reg. 170/03 (drinking water systems): https://www.ontario.ca/laws/regulation/030170
- Ontario watermain disinfection procedure: https://www.ontario.ca/page/water-main-disinfection-procedure
- Ontario adverse test result reporting bulletin: https://www.ontario.ca/page/technical-bulletin-adverse-drinking-water-test-results-reporting-requirements-and-exemptions
- Ontario Environmental Compliance Approval: https://www.ontario.ca/page/environmental-compliance-approval
- Ontario Design Guidelines for Sewage Works: https://www.ontario.ca/document/design-guidelines-sewage-works/design-considerations-sewage-treatment-plants
- Health Canada Giardia CT tables (Appendix A): https://www.canada.ca/en/health-canada/services/publications/healthy-living/guidelines-canadian-drinking-water-quality-guideline-technical-document-enteric-protozoa-giardia-cryptosporidium.html
- EPA turbidity data quality (815-B-19-010): https://www.epa.gov/sdwa/generating-high-quality-turbidity-data-drinking-water-treatment-plants-support-system
- EPA activated sludge process control manual: https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=9100NX8X.TXT
- EPA distribution system tools: https://www.epa.gov/dwreginfo/drinking-water-distribution-system-tools-and-resources
- EPA drinking water sample collection: https://www.epa.gov/sites/default/files/2015-11/documents/drinking_water_sample_collection.pdf
- ECCC acute lethality: https://www.canada.ca/en/environment-climate-change/services/wastewater/system-effluent-regulations-reporting/overview/acute-lethality.html
- Wastewater Systems Effluent Regulations SOR/2012-139: https://laws-lois.justice.gc.ca/eng/regulations/SOR-2012-139/FullText.html

## Approach
Single script, bounded concurrency, direct Anthropic API with claude-opus-5. Per module: regenerate `lesson` and `checks` at depth. Per course: expand `finalAssessment` and add `alternateFinalAssessment`. Preserve keys, ids, objectives, sources, structure and all server contracts.
