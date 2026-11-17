# Course brief: Basic Instrumentation for Water and Wastewater Operators

Rules: `docs/handoff/course-briefs/COMMON.md`. File: `content/ceu-drafts/ceu-basic-instrumentation.json`. Key `ceu-basic-instrumentation`, version `2026-11-17.1`, `plannedMinutes` 180, shortTitle "Basic Instrumentation". Diagrams folder: `/tmp/claude-0/-home-user-echelon-ai-tutor/0e6dc4c6-dfed-5d26-9c2a-f17854a01d3e/scratchpad/diagrams-instr/`.

Foundation level. Skim the applied course `server/ceu/courses/ceu-instrumentation-scada.json` and do NOT repeat its historian, alarm-data-integrity or SCADA-record content.

## Modules
1. **Measurement fundamentals:** what an instrument loop is (sensor, transmitter, signal, controller, display), the 4-20 mA signal and why 4 mA is the live zero, scaling a 4-20 mA signal to engineering units (worked calculations), range, span, accuracy, resolution and repeatability, calibration versus verification, zero and span adjustment, drift, why every reading has an uncertainty.
2. **Pressure, level and flow instruments:** pressure gauges and transmitters, differential pressure, hydrostatic level (head to psi), ultrasonic and radar level, float switches, bubblers, magnetic flow meters, ultrasonic flow, flumes and weirs as primary elements with a secondary level device, orifice and venturi at concept level, what makes each lie (air bubbles, fouling, partly full pipe, foam, wrong installation).
3. **Analytical instruments and basic control:** pH, turbidity, conductivity, dissolved oxygen and chlorine residual analyzers (what each measures, how each is calibrated or verified at concept level, how each fouls or drifts, sample conditioning), on/off, proportional and PID control at concept level, flow pacing and residual trim, setpoints, alarms (high, low, deviation) and why nuisance alarms are dangerous.
4. **SCADA basics and instrument troubleshooting:** remote terminal units and PLCs at recognition level, trends and what a flat line or step change suggests, fault versus process change, a logical troubleshooting order (process, sensor, signal, display), manual verification with a portable meter, maintenance routines and records, loop safety and lockout awareness (purpose only), the operator's role versus the instrument technician's.

## Suggested diagrams
Instrument loop block diagram; 4-20 mA scaling line with the live zero; open-channel flume with level sensor; magnetic flow meter versus a partly full pipe; a trend with a step change versus drift.

## Question mix
At least 40 percent of final questions are calculations or reading-a-signal items. No manufacturer-specific instructions; no calibration frequencies or accuracy requirements as numbers.
