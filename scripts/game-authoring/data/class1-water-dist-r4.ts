// Top-up written after the full review of 2026-11-15/16 removed or replaced rows. Generic operator knowledge in metric units, taken from the matching western Class 1 table.
// Draft only. Not registered.
import type { CourseData } from "../build";
const data: CourseData = {
  "courseKey": "class1-water-dist",
  "facts": [],
  "boards": [],
  "oddSets": [],
  "sequences": [
    {
      "d": "m",
      "process": "returning a main to use after a repair",
      "steps": [
        "Close the valves around the break",
        "Cut out and replace the damaged pipe",
        "Refill the section slowly with air let out",
        "Flush the section until the water runs clear",
        "Return the section to normal service and tell customers"
      ],
      "why": "The break is isolated and repaired, the section is refilled slowly and flushed, then service is restored.",
      "max": 6
    },
    {
      "d": "m",
      "process": "a tracked maintenance job",
      "steps": [
        "Identify the need and open a work order",
        "Plan the job and assign a crew",
        "Carry out the work",
        "Record what was done and found",
        "Close the work order and update the asset history"
      ],
      "why": "The job is opened, planned, done and recorded, and last of all closed with the history updated.",
      "max": 6
    },
    {
      "d": "m",
      "process": "stopping the flow from a broken main",
      "steps": [
        "Find the location of the break",
        "Look up the valves on the system map",
        "Close the valves around the break slowly",
        "Check that the flow at the break has stopped",
        "Record which valves were closed"
      ],
      "why": "The break is located, the valves are found on the map, closed slowly, the result is checked, and the closed valves are recorded so they can be reopened.",
      "max": 8
    },
    {
      "d": "m",
      "process": "disinfecting a new main by the continuous feed method",
      "steps": [
        "Flush the main clean",
        "Fill the main with chlorinated water at a steady rate",
        "Hold the chlorinated water for the contact time",
        "Flush the strong chlorine out to a safe discharge point",
        "Collect samples",
        "Release the main for use after good results"
      ],
      "why": "The pipe is cleaned first, filled and held with chlorine, flushed out, then sampled before it is released.",
      "max": 8
    },
    {
      "d": "m",
      "process": "digging a repair trench safely",
      "steps": [
        "Request the marking of buried utilities",
        "Set up traffic control",
        "Excavate with the spoil kept back from the edge",
        "Install trench protection before anyone enters",
        "Climb down by the ladder"
      ],
      "why": "Utilities are marked and traffic is controlled before digging, and protection goes in before anyone enters.",
      "max": 8
    }
  ],
  "relations": [],
  "flaws": []
};
export default data;
