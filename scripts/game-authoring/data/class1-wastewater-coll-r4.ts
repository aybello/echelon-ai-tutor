// Top-up written after the full review of 2026-11-15/16 removed or replaced rows. Generic operator knowledge in metric units, taken from the matching western Class 1 table.
// Draft only. Not registered.
import type { CourseData } from "../build";
const data: CourseData = {
  "courseKey": "class1-wastewater-coll",
  "facts": [
    [
      "e",
      "Wastewater carries bacteria, viruses and parasites that can make collection workers sick.",
      true,
      "Human waste puts disease-causing organisms in the flow, so contact with it is treated as a health risk."
    ],
    [
      "e",
      "Germs from wastewater can enter the body through the mouth, broken skin and the eyes.",
      true,
      "Swallowing, open cuts and splashes to the eyes are the usual routes, which is why hygiene and protective gear matter."
    ],
    [
      "m",
      "Workers who handle wastewater are encouraged to talk with a health professional about vaccinations.",
      true,
      "Vaccines can protect against some diseases linked to sewage work, but the right ones depend on the person and the job."
    ],
    [
      "e",
      "Eating, drinking and smoking are kept out of work areas so germs are not carried from hands to the mouth.",
      true,
      "Hands and gloves pick up contamination, so food and tobacco stay away from the job."
    ],
    [
      "e",
      "A small cut on the hand can be left uncovered if it does not hurt.",
      false,
      "Even a small break in the skin lets germs in, so cuts are cleaned and covered with a waterproof dressing before work."
    ],
    [
      "m",
      "Hand sanitizer is a full replacement for soap and water on hands soiled by wastewater.",
      false,
      "Sanitizer works poorly on dirty hands. Soap and clean running water remove both the dirt and the germs."
    ],
    [
      "m",
      "Wastewater is a health risk when swallowed but harmless on the skin and in the eyes.",
      false,
      "Germs can reach the body through broken skin and the eyes as well as the mouth."
    ],
    [
      "m",
      "A dead rat in a manhole is safe to pick up bare-handed because wastewater has washed it clean.",
      false,
      "Animals can carry disease and wastewater does not clean them, so crews use tools and gloves and avoid direct contact."
    ],
    [
      "e",
      "A depth sensor in a sewer measures how deep the wastewater is in the pipe.",
      true,
      "Depth is the starting point for working out how much flow is passing."
    ]
  ],
  "boards": [
    {
      "d": "m",
      "prompt": "Match each route of infection to an example of how it happens.",
      "pairs": [
        [
          "Swallowing",
          "Eating or smoking with dirty hands"
        ],
        [
          "Open wound",
          "Wastewater touching a cut or scrape"
        ],
        [
          "Eye splash",
          "Spray from a hose or pump"
        ],
        [
          "Breathing",
          "Inhaling mist from spraying water"
        ],
        [
          "Animal bite",
          "A bite from a sewer rat"
        ],
        [
          "Needlestick",
          "A sharp piercing the skin through a glove"
        ]
      ]
    },
    {
      "d": "e",
      "prompt": "Match each flow monitoring item to its job.",
      "pairs": [
        [
          "Depth sensor",
          "Measures how deep the flow is"
        ],
        [
          "Velocity sensor",
          "Measures how fast the flow moves"
        ],
        [
          "Rain gauge",
          "Records how much rain has fallen"
        ],
        [
          "Flow logger",
          "Stores readings at set intervals"
        ],
        [
          "Flume",
          "Narrowed channel that links depth to flow"
        ],
        [
          "Weir",
          "Crest the water spills over so depth gives the flow"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each lift station electrical item to its job.",
      "pairs": [
        [
          "Motor starter",
          "Switches the pump motor on and off"
        ],
        [
          "Float switch",
          "Senses the level in the wet well"
        ],
        [
          "Circuit breaker",
          "Opens the circuit on high current and is reset"
        ],
        [
          "Alternator",
          "Takes turns choosing which pump leads"
        ],
        [
          "Telemetry unit",
          "Sends alarm signals to staff away from the site"
        ],
        [
          "Lockout lock",
          "Keeps power from returning during repair work"
        ]
      ]
    },
    {
      "d": "e",
      "prompt": "Match each blockage material to its usual source.",
      "pairs": [
        [
          "Grease",
          "Cooking fat poured down drains"
        ],
        [
          "Roots",
          "Trees seeking moisture at joints"
        ],
        [
          "Wipes and rags",
          "Items flushed down toilets"
        ],
        [
          "Concrete and mortar",
          "Building work near the sewer"
        ],
        [
          "Sand and gravel",
          "Washed in through broken pipe or open covers"
        ],
        [
          "Bottles and toys",
          "Objects dropped into toilets or drains"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each piece of cleaning gear to the job it does.",
      "pairs": [
        [
          "Jetter",
          "Sprays high-pressure water through a nozzle"
        ],
        [
          "Power rodder",
          "Spins a cable fitted with cutting heads"
        ],
        [
          "Bucket machine",
          "Drags a scraper bucket along a cable"
        ],
        [
          "Vacuum truck",
          "Sucks up liquid and solids at the manhole"
        ],
        [
          "Hose guide",
          "Protects the hose and pipe edge at the manhole"
        ],
        [
          "Sewer ball",
          "Inflated ball that scours the pipe with backed-up water"
        ]
      ]
    },
    {
      "d": "m",
      "prompt": "Match each camera inspection step to its purpose.",
      "pairs": [
        [
          "Cleaning the pipe first",
          "Gives the camera a clear view of the wall"
        ],
        [
          "Footage counter",
          "Ties each defect to a distance"
        ],
        [
          "Saved video",
          "Lets crews compare the pipe from year to year"
        ],
        [
          "Camera lights",
          "Let the camera see inside the dark pipe"
        ],
        [
          "Defect coding",
          "Lists problems by type and location"
        ],
        [
          "Surface marking",
          "Shows where a defect lies above ground"
        ]
      ]
    },
    {
      "d": "e",
      "prompt": "Match each lift station part to its job.",
      "pairs": [
        [
          "Wet well",
          "Collects the incoming wastewater"
        ],
        [
          "Float switch",
          "Signals the pumps to start and stop by level"
        ],
        [
          "Control panel",
          "Holds the starters and alarm circuits"
        ],
        [
          "Check valve",
          "Stops flow from returning to the wet well"
        ],
        [
          "Alarm light",
          "Warns that something is wrong at the station"
        ],
        [
          "Force main",
          "Carries the pumped flow away under pressure"
        ]
      ]
    },
    {
      "d": "e",
      "prompt": "Match each protective item to the body part it protects.",
      "pairs": [
        [
          "Hard hat",
          "Head"
        ],
        [
          "Safety glasses",
          "Eyes"
        ],
        [
          "Steel-toed boots",
          "Feet"
        ],
        [
          "Waterproof gloves",
          "Hands"
        ],
        [
          "Hearing protection",
          "Ears"
        ],
        [
          "Respirator",
          "Lungs"
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
