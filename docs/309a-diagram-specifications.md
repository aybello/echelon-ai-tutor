# Ontario 309A — Original Diagram Production Specifications

## Visual direction

Build diagrams as **editable React/SVG components**, not as copied workbook graphics or generated images containing circuit labels. Use the Echelon Institute palette: deep electric blue `#0047AB`, navy `#1E3A5F`, teal accent, white card backgrounds, and high-contrast charcoal text. Every diagram needs a text alternative, labelled parts, keyboard-readable descriptions where interactive, and a plain-language explanation below it.

The visual library must teach concepts from the official current-exam task matrix; it must not reproduce proprietary Canadian Electrical Code tables, manufacturer diagrams, or utility drawings.[1]

## Diagram pack

| ID | Diagram | Blueprint use | Primary question uses | Build form |
|---|---|---|---|---|
| `309A-D01` | Lockout and absence-of-voltage sequence | A-1 | Safe sequencing, identify missing verification step | Five-step flow diagram |
| `309A-D02` | Electrical drawing and one-line legend | A-3 | Symbol interpretation, planning workflow | SVG legend with selectable callouts |
| `309A-D03` | Transformer turns/voltage relationship | B-15 | Ratio calculation, primary/secondary concept | Labelled two-winding schematic |
| `309A-D04` | Distribution hierarchy and protective-device path | B-8, B-9 | Source-to-load path, protection roles | One-line block schematic |
| `309A-D05` | Grounding and bonding conceptual fault path | B-11 | Fault-current path, bonding purpose | Colour-coded conceptual diagram |
| `309A-D06` | PV array and inverter block diagram | B-13 | Series/parallel and conversion concepts | DC-to-AC block diagram |
| `309A-D07` | Raceway/conductor route and voltage-drop variables | C-16 | Conductor path, length/resistance relationships | Annotated route schematic |
| `309A-D08` | Three-way/four-way switching principle | C-17 | Switching logic and troubleshooting | Simplified functional wiring diagram |
| `309A-D09` | Emergency-lighting loss-of-normal-power sequence | C-20 | Egress purpose and backup operation | Source/charger/fixture block diagram |
| `309A-D10` | Across-the-line starter control circuit | D-22 | Coil, contactor, overload and start/stop logic | Ladder-style control diagram |
| `309A-D11` | Forward/reverse interlock | D-22, D-24 | Phase sequence and interlock reasoning | Ladder-style state diagram |
| `309A-D12` | VFD energy-conversion block | D-23 | Rectifier, DC bus, inverter and frequency control | Four-stage block diagram |
| `309A-D13` | Motor speed and slip relationship | D-24 | Synchronous-speed and slip calculations | Formula-linked explanatory graphic |
| `309A-D14` | Fire-alarm initiating/signal/notification path | E-26 | Component roles and fault isolation concepts | Three-layer block diagram |
| `309A-D15` | Structured-cabling hierarchy | E-27 | Work-area to telecommunications-room topology | Hierarchical network diagram |
| `309A-D16` | Sensor-controller-actuator loop | E-28 | Integrated-control roles and signal flow | Closed-loop control diagram |

## Acceptance requirements

Every diagram must render at `320px` to `1440px` width without cropped labels. Electrical conductors must not rely on colour alone; use labels and distinct line treatments. Callouts must describe a conceptual function, not a code-mandated installation value. Calculations must show variables and units but no proprietary table values. A question may reference `diagramId` only after the diagram component and its alt text have been checked in.

## References

[1]: [Red Seal Program — Construction Electrician examination weightings (current exam, previous RSOS)](https://red-seal.ca/eng/trades/constelectric/previous/exam-weightings.shtml)
