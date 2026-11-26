import package1 from "../../../content/game-content/class2-water-dist/package-1.json";
import package2 from "../../../content/game-content/class2-water-dist/package-2.json";
import package3 from "../../../content/game-content/class2-water-dist/package-3.json";
import package4 from "../../../content/game-content/class2-water-dist/package-4.json";
import package5 from "../../../content/game-content/class2-water-dist/package-5.json";

import { mergeDeepCoursePackages } from "./merge";

export default mergeDeepCoursePackages([package1, package2, package3, package4, package5]);
