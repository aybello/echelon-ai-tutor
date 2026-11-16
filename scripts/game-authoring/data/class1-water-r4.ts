// Top-up written after the full review of 2026-11-15/16 removed or replaced rows. Generic operator knowledge in metric units, taken from the matching western Class 1 table.
// Draft only. Not registered.
import type { CourseData } from "../build";
const data: CourseData = {
  "courseKey": "class1-water",
  "facts": [],
  "boards": [
    {
      "d": "m",
      "prompt": "Match each blower part to its purpose.",
      "pairs": [
        [
          "Intake air filter",
          "Keeps dust out of the machine and the air stream"
        ],
        [
          "Relief valve",
          "Opens to release air if discharge pressure gets too high"
        ],
        [
          "Silencer",
          "Cuts the noise of the air pulses"
        ],
        [
          "Oil sight glass",
          "Shows the lubricating oil level"
        ],
        [
          "Discharge check valve",
          "Stops air or water from flowing back into a stopped blower"
        ],
        [
          "Belt guard",
          "Keeps hands and clothing away from the moving drive"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each dechlorination term to its meaning.",
      "pairs": [
        [
          "Sulfur dioxide",
          "Gas that reacts with chlorine once it is dissolved in water"
        ],
        [
          "Sodium bisulfite",
          "Liquid chemical fed by a metering pump to remove chlorine"
        ],
        [
          "Residual test",
          "Shows whether chlorine is still present after the feed point"
        ],
        [
          "Overfeed",
          "Wastes chemical and lowers the dissolved oxygen"
        ],
        [
          "Mixing point",
          "Place where the chemical is blended into the flow"
        ],
        [
          "Receiving stream",
          "Water body protected by removing the chlorine"
        ]
      ]
    },
    {
      "d": "e",
      "prompt": "Match each security measure to what it does.",
      "pairs": [
        [
          "Perimeter fence",
          "Marks the boundary and slows unwanted entry"
        ],
        [
          "Intrusion alarm",
          "Signals that a door or gate was opened without permission"
        ],
        [
          "Visitor log",
          "Records who came to the plant and when"
        ],
        [
          "Security camera",
          "Records activity so events can be reviewed later"
        ],
        [
          "Strong password",
          "Protects computer and control system logins"
        ],
        [
          "Security lighting",
          "Lets staff and cameras see the site after dark"
        ]
      ]
    },
    {
      "d": "e",
      "prompt": "Match each pump part to its role.",
      "pairs": [
        [
          "Impeller",
          "Spins to move the water"
        ],
        [
          "Casing",
          "Encloses the impeller and guides flow"
        ],
        [
          "Shaft",
          "Rod that holds the impeller and turns with it"
        ],
        [
          "Bearing",
          "Supports the rotating shaft"
        ],
        [
          "Seal",
          "Limits leakage along the shaft"
        ],
        [
          "Motor",
          "Converts electricity into rotation"
        ]
      ]
    },
    {
      "d": "e",
      "prompt": "Match each pump condition to its description.",
      "pairs": [
        [
          "Prime",
          "Casing filled with water before starting"
        ],
        [
          "Cavitation",
          "Vapour bubbles forming and collapsing in the pump"
        ],
        [
          "Suction",
          "Side where water enters the pump"
        ],
        [
          "Discharge",
          "Side where water leaves the pump"
        ],
        [
          "Flow rate",
          "Volume moved in a given time"
        ],
        [
          "Head",
          "Pressure expressed as a height of water"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each motor term to its meaning.",
      "pairs": [
        [
          "Overload protection",
          "Trips a motor that draws too much current"
        ],
        [
          "Nameplate",
          "Label giving the motor's ratings"
        ],
        [
          "Starter",
          "Switches the motor on and off"
        ],
        [
          "Variable frequency drive",
          "Changes motor speed by changing frequency"
        ],
        [
          "Windings",
          "Coils of wire that make the magnetic field"
        ],
        [
          "Insulation",
          "Coating that keeps windings from shorting"
        ]
      ]
    },
    {
      "d": "e",
      "prompt": "Match each chemical storage item to its purpose.",
      "pairs": [
        [
          "Bulk tank",
          "Holds the main chemical supply"
        ],
        [
          "Day tank",
          "Holds a small working supply"
        ],
        [
          "Containment basin",
          "Catches a tank leak"
        ],
        [
          "Vent",
          "Releases air as the tank fills or empties"
        ],
        [
          "Level gauge",
          "Shows how much chemical remains"
        ],
        [
          "Label",
          "Identifies the contents"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each feed device to its job.",
      "pairs": [
        [
          "Metering pump",
          "Delivers a controlled chemical dose"
        ],
        [
          "Calibration column",
          "Checks a pump's actual feed rate"
        ],
        [
          "Diffuser",
          "Introduces chemical at the point of application"
        ],
        [
          "Static mixer",
          "Blends chemical after it is added"
        ],
        [
          "Relief valve",
          "Protects the feed line from over-pressure"
        ],
        [
          "Dry feeder",
          "Meters powder or granular chemical"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each feed problem to a likely cause.",
      "pairs": [
        [
          "Feed rate drifts down",
          "Fouled check valves"
        ],
        [
          "Pump strokes but delivers little",
          "Air lock in the pump head"
        ],
        [
          "Crystals in the line",
          "Chemical drying out or cold"
        ],
        [
          "Drips at fittings",
          "Loose or worn connection"
        ],
        [
          "Overfeed while the pump is idle",
          "Siphoning through the line"
        ],
        [
          "Low-level alarm at the tank",
          "Chemical supply running low"
        ]
      ]
    },
    {
      "d": "e",
      "prompt": "Match each instrument to the quantity it reads.",
      "pairs": [
        [
          "Flow meter",
          "Rate of water moving through a pipe"
        ],
        [
          "Level sensor",
          "Height of water in a tank"
        ],
        [
          "Pressure gauge",
          "Force of water in a pipe"
        ],
        [
          "Turbidity meter",
          "Cloudiness of water"
        ],
        [
          "pH meter",
          "Acidity or alkalinity"
        ],
        [
          "Thermometer",
          "Temperature"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each flow device to how it works.",
      "pairs": [
        [
          "Magnetic meter",
          "Voltage from water moving through a magnetic field"
        ],
        [
          "Rotameter",
          "Float rising in a tapered tube"
        ],
        [
          "Venturi meter",
          "Pressure drop at a narrowed section"
        ],
        [
          "Turbine meter",
          "Spinning rotor turns with the flow"
        ],
        [
          "Ultrasonic meter",
          "Sound signals change with flow"
        ],
        [
          "Parshall flume",
          "Water level in a shaped open channel"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each level device to its method.",
      "pairs": [
        [
          "Float switch",
          "Rises and falls with the surface"
        ],
        [
          "Ultrasonic sensor",
          "Times a sound echo from the surface"
        ],
        [
          "Pressure transducer",
          "Reads water pressure above the sensor"
        ],
        [
          "Bubbler",
          "Measures air pressure needed to push bubbles out a tube"
        ],
        [
          "Radar sensor",
          "Uses radio waves reflected from the surface"
        ],
        [
          "Sight glass",
          "Shows level through a clear tube"
        ]
      ]
    },
    {
      "d": "e",
      "prompt": "Match each SCADA term to its meaning.",
      "pairs": [
        [
          "Alarm",
          "Alert that a value is out of range"
        ],
        [
          "HMI",
          "Screen operators use to view and control"
        ],
        [
          "Sensor",
          "Device that reads a process value"
        ],
        [
          "PLC",
          "Small industrial computer that runs control logic"
        ],
        [
          "Trend",
          "Graph of a value over time"
        ],
        [
          "Setpoint",
          "Target value a control tries to hold"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each alarm to what it signals.",
      "pairs": [
        [
          "High level alarm",
          "Tank is filling above normal"
        ],
        [
          "Low level alarm",
          "Tank is dropping below normal"
        ],
        [
          "Power failure alarm",
          "Loss of electrical supply"
        ],
        [
          "Intrusion alarm",
          "Entry to the site without permission"
        ],
        [
          "Equipment fault alarm",
          "A device has tripped or failed"
        ],
        [
          "Communication loss alarm",
          "Data link to a remote site is down"
        ]
      ]
    },
    {
      "d": "e",
      "prompt": "Match each maintenance idea to its description.",
      "pairs": [
        [
          "Preventive",
          "Scheduled work to avoid failure"
        ],
        [
          "Corrective",
          "Repair after a problem occurs"
        ],
        [
          "Predictive",
          "Uses condition data to forecast needs"
        ],
        [
          "Inspection",
          "Looking for wear or damage"
        ],
        [
          "Work order",
          "Request recording work to be done"
        ],
        [
          "Spare parts",
          "Stock kept for quick repairs"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each routine task to its benefit.",
      "pairs": [
        [
          "Lubrication",
          "Reduces friction and wear"
        ],
        [
          "Cleaning strainers",
          "Keeps flow from being restricted"
        ],
        [
          "Checking belts and couplings",
          "Finds wear or misalignment"
        ],
        [
          "Calibrating instruments",
          "Keeps readings reliable"
        ],
        [
          "Exercising valves",
          "Keeps valves from seizing"
        ],
        [
          "Testing the standby generator",
          "Confirms backup power will start"
        ]
      ]
    },
    {
      "d": "h",
      "prompt": "Match each maintenance record to what it shows.",
      "pairs": [
        [
          "Equipment history file",
          "Past repairs and service on a unit"
        ],
        [
          "Calibration log",
          "Dates and results of instrument checks"
        ],
        [
          "Work order",
          "Task assigned and completed"
        ],
        [
          "Inventory list",
          "Spare parts on hand"
        ],
        [
          "Operating manual",
          "Manufacturer guidance for use and care"
        ],
        [
          "Inspection checklist",
          "Items reviewed during rounds"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each lab sample type to its purpose.",
      "pairs": [
        [
          "Blank",
          "Checks for contamination"
        ],
        [
          "Duplicate",
          "Checks repeatability"
        ],
        [
          "Spike",
          "Checks recovery of a known addition"
        ],
        [
          "Standard",
          "Known concentration for calibration"
        ],
        [
          "Grab sample",
          "Taken at one moment"
        ],
        [
          "Composite sample",
          "Mixture of samples over time"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each lab method to what it is used for.",
      "pairs": [
        [
          "Titration",
          "Adds reagent until an endpoint is reached"
        ],
        [
          "Spectrophotometer",
          "Measures light absorbed by a prepared sample"
        ],
        [
          "Jar test",
          "Compares chemical doses on small samples"
        ],
        [
          "Membrane filtration",
          "Traps bacteria on a filter for counting"
        ],
        [
          "pH electrode",
          "Reads acidity through a probe"
        ],
        [
          "Gravimetric test",
          "Finds solids by weighing"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each quality control step to its aim.",
      "pairs": [
        [
          "Calibration",
          "Match readings to known standards"
        ],
        [
          "Reagent expiry check",
          "Avoid degraded chemicals"
        ],
        [
          "Clean glassware",
          "Avoid contamination"
        ],
        [
          "Control chart",
          "Track results for drift"
        ],
        [
          "Sample preservation",
          "Keep the sample unchanged until analysis"
        ],
        [
          "Holding time",
          "Limit on the wait before testing"
        ]
      ]
    },
    {
      "d": "h",
      "prompt": "Match each lab result to a likely explanation.",
      "pairs": [
        [
          "High blank",
          "Contaminated water or glassware"
        ],
        [
          "Duplicates disagree widely",
          "Poor technique or unstable sample"
        ],
        [
          "Low spike recovery",
          "Interference or reagent problem"
        ],
        [
          "Control chart trending upward",
          "Gradual drift in method or instrument"
        ],
        [
          "Standard reads off its true value",
          "Calibration needs attention"
        ],
        [
          "Test run past the holding time",
          "Sample may have changed"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each report or record to its use.",
      "pairs": [
        [
          "Daily operating log",
          "Shift-to-shift history"
        ],
        [
          "Monthly report",
          "Summary of performance and results"
        ],
        [
          "Annual report",
          "Yearly summary of performance and compliance"
        ],
        [
          "Incident report",
          "Documents an unusual event"
        ],
        [
          "Chemical usage record",
          "Tracks amounts consumed"
        ],
        [
          "Visitor log",
          "Records who entered the site"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each reporting term to its meaning.",
      "pairs": [
        [
          "Compliance",
          "Meeting required standards"
        ],
        [
          "Trend",
          "Direction data moves over time"
        ],
        [
          "Transcription error",
          "Mistake copying a value"
        ],
        [
          "Notification",
          "Telling a required party about an event"
        ],
        [
          "Retention",
          "Keeping records for a set period"
        ],
        [
          "Audit",
          "Review of records"
        ]
      ]
    },
    {
      "d": "e",
      "prompt": "Match each PPE item to the risk it reduces.",
      "pairs": [
        [
          "Safety glasses",
          "Splashes to the eyes"
        ],
        [
          "Hearing protection",
          "Loud pump noise"
        ],
        [
          "Hard hat",
          "Falling objects"
        ],
        [
          "Gloves",
          "Skin contact with chemicals"
        ],
        [
          "Safety boots",
          "Foot injuries from heavy objects"
        ],
        [
          "Life jacket",
          "Drowning near deep water"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each emergency preparedness item to its role.",
      "pairs": [
        [
          "Emergency response plan",
          "Written guide for who does what"
        ],
        [
          "Evacuation route",
          "Planned path out of a site"
        ],
        [
          "Muster point",
          "Place where people gather to be counted"
        ],
        [
          "Backup power",
          "Keeps key equipment running in an outage"
        ],
        [
          "Emergency contact list",
          "Phone numbers of people to call"
        ],
        [
          "Drill",
          "Practice of the plan"
        ]
      ]
    },
    {
      "d": "h",
      "prompt": "Match each equipment condition to a likely maintenance need.",
      "pairs": [
        [
          "Worn bearing noise",
          "Lubrication or replacement"
        ],
        [
          "Leaking packing",
          "Adjustment or replacement"
        ],
        [
          "Corroded feed fittings",
          "Replace and review materials"
        ],
        [
          "Dirty strainer with low flow",
          "Clean the strainer"
        ],
        [
          "Fouled level probe",
          "Clean and recheck"
        ],
        [
          "Dead standby battery",
          "Replace the battery"
        ]
      ]
    }
  ],
  "oddSets": [],
  "sequences": [],
  "relations": [],
  "flaws": []
};
export default data;
