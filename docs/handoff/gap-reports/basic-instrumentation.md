# Required topic checklist: Basic Instrumentation vs Royce U `bip` (114 slides, read in full 2026-11-17)

Teach each item in our own words, with our own scenarios and numbers. Do not copy Royce U wording, questions, examples or images. Do not restate any numeric limit they give; say the manufacturer, the permit or the applicable rule sets it.

## Sensors and instrument categories
- Sensor defined (converts a process variable into a usable signal); three categories: status, physical, analytical; examples of each (valve open/closed, equipment on/off, AUTO/MAN switch; flow, pressure, temperature, speed; pH, chlorine residual, turbidity, ORP, sludge density, dissolved oxygen, ammonia, nitrate, nitrite).
- Status sensors drive alarms and interlocks; physical parameters for equipment performance and trends; analytical parameters feed control (for example dissolved oxygen compared with a setpoint to drive a blower).

## Control elements and control panel instruments
- Control element defined (valve, aeration blower, variable speed pump); the sensor gives input, the element acts.
- Panel devices: meters, status lights, alarm annunciators, recorders, pushbuttons, selector switches.

## Computers, PLCs and SCADA
- PLCs collect inputs from sensors and control elements and send them over a plant network; SCADA is supervisory control and data acquisition; the HMI is the operator screen; why computer systems are cost effective; secondary data highways (recognition only).

## Personnel protection instruments (purpose and recognition only)
- Portable gas detectors: multi-gas alarms; why a portable detector is required before confined-space entry even when the space was tested before; hazardous atmospheres (oxygen deficiency, explosive gases, toxic gases such as hydrogen sulfide); records of calibration, repairs, sensor replacement and alarms; sensor replacement by manufacturer advice or failure history, whichever is sooner. No exact alarm levels.

## Flow measurement
- Basic criteria of flow devices (area, velocity, device characteristics); open channel versus closed pipe.
- Open channel: weirs and flumes (Parshall flume example), level-to-flow relationship through a rating, why a level sensor is paired with the primary element.
- Closed pipe: differential pressure (venturi), mechanical propeller meter (parts at recognition level: bearings, magnetic coupling, totalizer, straightening vanes, cable drive), magnetic meter, ultrasonic meter.
- Flow measurement error sources (partly full pipes, air, installation).

## Pressure measurement
- Why pressure is measured (pump monitoring, regulation, treatment control); Bourdon and helical gauges with local indication; pneumatic and electronic transmitters sending the signal to a remote location; differential pressure.
- Flow meter plus automatic control valve as a rate-of-flow control system.

## Level measurement
- Level for wet well and tank status and pump control; level with weirs and flumes.
- Three methods: from above (ball floats, ultrasonic, microwave), from below (pressure, bubbler tube, diaphragm bulb), electrical (conductance and capacitance probes).

## Temperature measurement
- Where temperature controls a process (chlorine evaporators, anaerobic digesters); devices: liquid thermometers, bimetal and thermocouple, expansion bulbs, thermistors, resistance temperature detectors, infrared, window tapes (recognition level).

## Weight measurement
- Chemical use (chlorine containers), sludge cake; weigh beam, hydraulic load cell, strain gauge; the load cell as the usual method for chlorine ton containers; why weight shows chemical use.

## Speed and proximity
- Speed as report-back or local indication (variable speed pumps, metering pumps); tachometer generators, non-contact frequency generators, optical or magnetic means; proximity or zero-speed switches for gear teeth, belt movement, valve or machine position (for example a broken belt on a dewatering press).

## Analyzers
- Analyzers for solids, turbidity, dissolved oxygen, sludge blanket, ammonia, nitrate, pH, chlorine residual, ORP.

## Automatic control loops
- Chlorine residual loop: analyzer sampling a set point into a contact chamber, flow signal, setpoint controller, motorised chlorinator valve, why the sample location and transit time matter.
- Digester temperature loop: sensor, setpoint controller, motorised temperature valve.
- Pump control by pressure (service water) or by level (RAS pump examples); why each pump suits each control.
- Minimum components of an automated chlorination feed system.
