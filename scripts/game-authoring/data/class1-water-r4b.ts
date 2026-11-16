// Top-up written after the full review of 2026-11-15/16 removed or replaced rows. Generic operator knowledge in metric units, taken from the matching western Class 1 table.
// Draft only. Not registered.
import type { CourseData } from "../build";
const data: CourseData = {
  "courseKey": "class1-water",
  "facts": [
    [
      "e",
      "A blower supplies the air used for aeration and for scouring filter media during a wash.",
      true,
      "Air is moved through diffusers or the filter underdrain, so a blower is part of the treatment process."
    ],
    [
      "m",
      "A relief valve on a blower discharge line opens to protect the machine and piping if pressure climbs too high.",
      true,
      "A blocked or closed discharge line would otherwise overload the blower and the pipe."
    ],
    [
      "e",
      "The oil level in a blower is checked before start-up and on routine rounds.",
      true,
      "Low oil leads to bearing and gear wear and a costly breakdown."
    ],
    [
      "m",
      "Starting a positive displacement blower against a shut discharge valve is normal practice.",
      false,
      "This type keeps pushing air into a blocked line, so pressure builds fast and the blower or pipe can be damaged."
    ],
    [
      "m",
      "A plugged intake air filter has little effect on how a blower performs.",
      false,
      "A restricted intake cuts the air delivered and raises discharge temperature and motor strain."
    ],
    [
      "e",
      "Blower noise is harmless, so hearing protection is not needed in the blower room.",
      false,
      "Blowers are loud, and hearing damage builds up with repeated exposure."
    ]
  ],
  "boards": [],
  "oddSets": [],
  "sequences": [],
  "relations": [],
  "flaws": []
};
export default data;
