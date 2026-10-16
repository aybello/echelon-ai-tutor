import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getAllActiveCourseKeysForFamily,
  getCourseByKey,
  isValidCourseKeyForFamily,
} from "../shared/courseRegistry";
import { INDIVIDUAL_PRODUCTS } from "../shared/products";
import { COMMERCIAL_RELEASE_PRODUCT_KEYS } from "./commercialAvailability";
import { classifyAppRoute } from "../shared/appRoutes";

const COURSE_KEY = "us-texas-class-d-water";
const dormantPaths = [
  "/us-texas-class-d-water",
  "/us-texas-class-d-water-mock",
  "/us-texas-class-d-water-flashcards",
  "/formulas-us-texas-class-d-water",
];

function registeredAppRoutes(source: string) {
  return new Set(
    Array.from(source.matchAll(/<Route path=\{?"([^"]+)"/g), (match) => match[1]),
  );
}

describe("Texas Class D released learning surfaces", () => {
  it("has all released learning surfaces in code and routes", () => {
    const app = readFileSync("client/src/App.tsx", "utf8");
    const registeredRoutes = registeredAppRoutes(app);
    for (const path of dormantPaths) {
      expect(classifyAppRoute(path).kind).toBe("public");
      expect(registeredRoutes).toContain(path);
    }
    expect(readFileSync("client/src/pages/UsTexasClassDQuiz.tsx", "utf8")).toContain(COURSE_KEY);
    expect(readFileSync("client/src/pages/UsTexasClassDMockExam.tsx", "utf8")).toContain(COURSE_KEY);
    expect(readFileSync("client/src/pages/UsTexasClassDFlashcards.tsx", "utf8")).toContain(COURSE_KEY);
    expect(readFileSync("client/src/pages/FormulasUsTexasClassD.tsx", "utf8")).toContain("Texas Class D Water");
  });

  it("detects either supported App.tsx route declaration syntax", () => {
    const synthetic = `${'<Route path={"/us-texas-class-d-water"} component={Mock} />'}\n${'<Route path="/us-texas-class-d-water-mock" component={Mock} />'}`;
    const routes = registeredAppRoutes(synthetic);
    expect(routes).toContain("/us-texas-class-d-water");
    expect(routes).toContain("/us-texas-class-d-water-mock");
  });

  it("keeps the released course active and available through governed checkout", () => {
    expect(getCourseByKey(COURSE_KEY)).toMatchObject({
      courseKey: COURSE_KEY,
      examFamily: "us-state",
      isActive: true,
    });
    expect(isValidCourseKeyForFamily(COURSE_KEY, "us-state")).toBe(true);
    expect(getAllActiveCourseKeysForFamily("us-state")).toContain(COURSE_KEY);
    expect(INDIVIDUAL_PRODUCTS.some((product) => product.key === COURSE_KEY)).toBe(true);
    expect(COMMERCIAL_RELEASE_PRODUCT_KEYS).toContain(COURSE_KEY);
  });

  it("leaves Texas mock questions to the signed server session, never the practice-bank payload", () => {
    const mockSource = readFileSync("client/src/pages/UsTexasClassDMockExam.tsx", "utf8");
    expect(mockSource).not.toContain("useQuestionBank");
    expect(mockSource).not.toContain("correctIndex");
    expect(mockSource).not.toContain("explanation:");
    expect(mockSource).toContain("questionPool={[]}");
  });

  it("loads Texas flashcards from the governed bank behind the existing purchase gate", () => {
    const flashcardSource = readFileSync("client/src/pages/UsTexasClassDFlashcards.tsx", "utf8");
    expect(flashcardSource).toContain(`useQuestionBank("${COURSE_KEY}", "full", "flashcards")`);
    expect(flashcardSource).toContain("<PurchaseGate");
    expect(flashcardSource).toContain(`productKey="${COURSE_KEY}"`);
    expect(flashcardSource).not.toContain("questions={[]}");
    expect(flashcardSource).not.toContain("freeAccess");
  });
});
