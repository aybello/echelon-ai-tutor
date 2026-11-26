# CEU authored-edition audit

Edition 2026-09-24.1. Automated counts and answer-pattern checks; these do not replace independent subject-matter review or a timed delivery pilot.

| Course | Modules | Final items | Shortest-choice score | Longest-choice score | Fixed-position maximum |
|---|---:|---:|---:|---:|---:|
| Activated Sludge Troubleshooting | 4 | 8 | 4/8 | 1/8 | 2/8 |
| Coagulation and Filtration | 4 | 8 | 4/8 | 0/8 | 2/8 |
| Collection Systems | 4 | 8 | 2/8 | 3/8 | 2/8 |
| Disinfection and CT | 4 | 8 | 1/8 | 1/8 | 2/8 |
| Distribution Water Quality | 4 | 8 | 1/8 | 3/8 | 2/8 |
| Drinking Water Compliance | 6 | 12 | 6/12 | 4/12 | 3/12 |
| Instrumentation and SCADA | 4 | 8 | 1/8 | 2/8 | 2/8 |
| Sampling and Data Quality | 4 | 8 | 1/8 | 2/8 | 2/8 |
| Wastewater Process Control | 6 | 12 | 2/12 | 2/12 | 3/12 |
| Water Treatment Process Control | 6 | 12 | 3/12 | 1/12 | 3/12 |

Length strategies select the first option at the minimum/maximum character count, including ties. Neither strategy exceeds 50% on any final; fixed-position strategies do not approach the 80% pass threshold. This is a screening measure, not proof of psychometric validity. Formative checks intentionally expose corrective feedback after a response. Final keys remain server-side.

Each of the 46 modules has an original lesson, supplied fictional evidence, a written practical, acceptance criteria, instructor guidance, source reading and two formative checks. Each final maps two questions to each module objective. There are 92 formative and 92 final questions (184 total).

## Calculation spot checks for instructor verification

| Case | Independently recomputed result |
|---|---|
| Compliance residual record | Missing intervals remain unknown; an off-location result cannot replace the original observation. |
| Water treatment, feed example | 20 L/h × 1.1 kg/L × 0.12 = 2.64 kg/h; at 200 m³/h, 13.2 mg/L. |
| Wastewater M8 | MLSS 8,000 kg; MLVSS 6,000 kg; losses 600 kg/day; simplified SRT 13.33 days; F/M 0.30. |
| Sampling Q3/Q5 | Collection-to-receipt 1 h 45 min; collection-to-analysis 8 h 25 min; D1 RPD 22.22%. |
| Disinfection D1/D3 | Nominal 90 min; T10 36 min; CT 25.2 mg·min/L; fictional comparison ratio 0.84. |
| Filtration F3/F5 | Measured delivery 13.5 L/h; active dose 10.35 mg/L; filter loadings 4 and 6 m/h; weighted turbidity 0.17 NTU. |
| SCADA I1/I3 | 10 mA gives 2.25 m on 0–6 m range versus 3 m on 0–8 m; corrected pump event 08:12, pressure lag 30 s. |
| Distribution N1/N3 | Nominal indicators 3 and 6 days; outlet residual decline 35.71%, distal decline 45.45%. |
| Collection C3/C5 | Initial conditional time 3 h; updated 1.9 h; observed release estimate 12.5 m³, total bounded 12.5–17.5 m³. |
| Activated sludge A1/A3/A5 | Full inventory 10,050 kg; SRT 12.885 days; SVI 100/160 mL/g; theoretical alkalinity consumption 142.8 mg/L. |

The source registry distinguishes Ontario requirements from US technical references. Fictional numerical criteria are explicitly identified. Before delivery, a qualified reviewer must verify the full current legal/procedural texts, calculations, distractors and source applicability.

## Initial technical verification

- TypeScript application and scripts checks passed locally.
- Nineteen focused curriculum, state-transition and API-boundary tests passed locally.
- Client and server production bundles built locally; existing analytics-variable and chunk-size warnings remain.
- Public metadata generation and migration-manifest checksum validation passed.
- A database lifecycle test and two browser journeys are included in the Quality Gate; their remote results are recorded in the pull request.
- No production data was migrated and no production deployment was performed.
