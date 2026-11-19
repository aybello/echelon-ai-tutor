import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement, type ReactElement } from "react";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { getAllCourses, resolveCourseKey } from "@shared/courseRegistry";
import { funnelProvince } from "@shared/funnelNavigation";
import { withUSStudyContext } from "@shared/usStudyContext";
import { getCourseForPath, getCourseWorkspaceTabs } from "@/lib/courseNavigation";

const read = (path: string) => readFileSync(resolve(process.cwd(), "client/src", path), "utf8");
const quiz = read("components/QuizShell.tsx");
const mock = read("components/MockExamShell.tsx");
const app = read("App.tsx");
const faq = read("pages/FAQ.tsx");

// Execute the actual small TSX functions with isolated bindings: no shell mounts,
// browser, entitlement calls, timers, database, or network services are involved.
function sourceFunction(source: string, name: string, bindings: Record<string, unknown>) {
  const ast = ts.createSourceFile("integration.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const node = ast.statements.find(statement => ts.isFunctionDeclaration(statement) && statement.name?.text === name && statement.body);
  if (!node) throw new Error(`Missing integration function: ${name}`);
  const compiled = ts.transpileModule(`${node.getText(ast)}\nreturn ${name};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React },
  }).outputText;
  return new Function(...Object.keys(bindings), compiled)(...Object.values(bindings));
}

type FormulaHref = (path: string | undefined, courseKey: string | undefined, search: string) => string | undefined;
const bindings = { resolveCourseKey, getCourseWorkspaceTabs, funnelProvince, withUSStudyContext };
const helpers: [string, FormulaHref][] = [
  ["question formula anchors", sourceFunction(quiz, "questionFormulaHref", bindings)],
  ["optional mock formula CTA", sourceFunction(mock, "mockFormulaHref", bindings)],
];
const url = (href: string | undefined) => new URL(href!, "https://echelon.invalid");

for (const [label, href] of helpers) {
  describe(label, () => {
    it("round-trips every active course with its registered formula sheet", () => {
      const courses = getAllCourses().filter(course => course.isActive && course.formulaPath);
      expect(courses.length).toBeGreaterThan(20);
      for (const course of courses) {
        const result = href(`${course.formulaPath}?topic=math#flow`, course.courseKey, "");
        expect(url(result).searchParams.get("course")).toBe(course.courseKey);
        expect(url(result).searchParams.get("topic")).toBe("math");
        expect(url(result).hash).toBe("#flow");
        expect(getCourseForPath(result!)?.courseKey).toBe(course.courseKey);
      }
    });

    it("normalizes aliases and replaces stale/duplicate course context with the current canonical key", () => {
      const result = url(href("/formulas-wpi-class1-ww?course=wrong&course=other&topic=flow#velocity", "wpi-class1-wastewater-coll", ""));
      expect(result.searchParams.getAll("course")).toEqual(["wpi-class1-water-coll"]);
      expect(result.searchParams.get("topic")).toBe("flow");
      expect(result.hash).toBe("#velocity");
    });

    it("does not tag unrelated, external, malformed, or unregistered formula resources", () => {
      for (const path of ["/formulas-wpi-class1-ww#flow", "/formulas-water1", "/formulas", "/formulas-wpi-class1-dist#flow", "https://other.invalid/formulas-wpi-class1#flow", "//other.invalid/formulas-wpi-class1", "http://["]) {
        expect(href(path, "wpi-class1-water-dist", "province=AB")).toBe(path);
      }
      expect(href("/formulas-wpi-class1", "unknown", "")).toBe("/formulas-wpi-class1");
      expect(href("/formulas-wpi-class1", "electrician-309a", "")).toBe("/formulas-wpi-class1");
      expect(href(undefined, "wpi-class1-water-dist", "")).toBeUndefined();
    });

    it("carries validated Canadian context and preserves destination query and hash", () => {
      const result = url(href("/formulas-wpi-class1?topic=flow#velocity", "wpi-class1-water-dist", "province=AB&course=unrelated"));
      expect(result.searchParams.get("province")).toBe("AB");
      expect(result.searchParams.get("course")).toBe("wpi-class1-water-dist");
      expect(result.searchParams.get("topic")).toBe("flow");
      expect(result.hash).toBe("#velocity");
      expect(url(href("/formulas-wpi-class1", "wpi-class1-water-dist", "province=invalid")).searchParams.has("province")).toBe(false);
    });

    it("preserves explicit destination jurisdiction instead of replacing it with source context", () => {
      const canadian = url(href("/formulas-wpi-class1?province=SK&topic=flow#velocity", "wpi-class1-water-dist", "country=US&state=CA"));
      expect(canadian.searchParams.get("province")).toBe("SK");
      expect(canadian.searchParams.has("country")).toBe(false);
      const us = url(href("/formulas-wpi-class1?country=US&state=TX&topic=flow#velocity", "wpi-class1-water-dist", "province=AB"));
      expect(us.searchParams.get("country")).toBe("US");
      expect(us.searchParams.get("state")).toBe("TX");
      expect(us.searchParams.get("topic")).toBe("flow");
      expect(us.hash).toBe("#velocity");
    });

    it("carries shared-WPI and dedicated-US context while excluding invalid states", () => {
      for (const key of ["wpi-class1-water-dist", "us-class1-water-dist"]) {
        const course = resolveCourseKey(key)!;
        const result = url(href(`${course.formulaPath}?topic=flow#velocity`, key, "country=US&state=CA"));
        expect(result.searchParams.get("country")).toBe("US");
        expect(result.searchParams.get("state")).toBe("CA");
        expect(result.searchParams.has("province")).toBe(false);
        expect(result.searchParams.get("course")).toBe(key);
      }
      const invalid = url(href("/formulas-wpi-class1", "wpi-class1-water-dist", "country=US&state=invalid"));
      expect(invalid.searchParams.get("country")).toBe("US");
      expect(invalid.searchParams.has("state")).toBe(false);
      expect(url(href("/formulas-water1", "class1-water", "country=US&state=TX")).searchParams.has("country")).toBe(false);
    });
  });
}

it("wires question-specific/module fallback links and the active mock stream to the guarded helpers", () => {
  expect(quiz).toContain("const formulaLink = questionFormulaHref(");
  expect(quiz).toContain("current.formulaLink ?? (formulaLinks && current.module ? formulaLinks[current.module] : undefined)");
  expect(quiz).toContain("href={formulaLink}");
  expect(mock).toContain("const search = useSearch();");
  expect(mock).toContain("href={mockFormulaHref(formulaPath, productKey, search)}");
});

describe("legacy formula redirects", () => {
  for (const level of [1, 2, 3, 4]) {
    for (const stream of ["dist", "coll"]) {
      it(`keeps the class ${level} ${stream} route and exact canonical origin with query/hash`, () => {
        const target = `/formulas-wpi-class${level}${stream === "coll" ? "-ww" : ""}`;
        const courseKey = `wpi-class${level}-water-${stream}`;
        expect(app).toContain(`<Route path={"/formulas-wpi-class${level}-${stream}"}>{() => <LegacyFormulaRedirect to="${target}" courseKey="${courseKey}" />}</Route>`);
        for (const search of ["province=AB&topic=flow&course=wrong&course=other", "country=US&state=CA&topic=flow"]) {
          const redirect = sourceFunction(app, "LegacyFormulaRedirect", {
            useSearch: () => search,
            window: { location: { hash: "#velocity" } },
            React: { createElement },
            Redirect: "redirect",
          });
          const element = redirect({ to: target, courseKey }) as ReactElement<{ to: string }>;
          const result = url(element.props.to);
          expect(result.pathname).toBe(target);
          expect(result.searchParams.getAll("course")).toEqual([courseKey]);
          expect(result.searchParams.get("topic")).toBe("flow");
          expect(result.hash).toBe("#velocity");
          for (const key of ["province", "country", "state"]) {
            expect(result.searchParams.get(key)).toBe(new URLSearchParams(search).get(key));
          }
          expect(getCourseForPath(element.props.to)?.courseKey).toBe(courseKey);
        }
      });
    }
  }
});

const faqAst = ts.createSourceFile("FAQ.tsx", faq, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const faqDeclaration = faqAst.statements.filter(ts.isVariableStatement)
  .flatMap(statement => statement.declarationList.declarations).find(declaration => declaration.name.getText(faqAst) === "questions");
if (!faqDeclaration?.initializer) throw new Error("Missing FAQ answers");
const faqExpression = ts.transpileModule(`return (${faqDeclaration.initializer.getText(faqAst)});`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const answers = new Map<string, string>(new Function(faqExpression)());

describe("client FAQ hydration copy", () => {
  it("qualifies supported certifications without implying broad trade availability", () => {
    const answer = answers.get("Which certifications are supported?")!;
    for (const phrase of ["starting with water and wastewater", "Ontario 309A Construction Electrician", "supported US jurisdictions", "not every trade or exam is offered", "full, partial, or limited"]) expect(answer).toContain(phrase);
  });
  it("preserves paid operator and Teams Flex terms with the free 309A exception", () => {
    const answer = answers.get("How long does access last?")!;
    expect(answer).toContain("For paid operator courses");
    expect(answer).toContain("12 months of access to one selected course from successful payment");
    expect(answer).toContain("Teams Flex licences use the 3- or 6-month term displayed at checkout, subject to the activation deadline.");
    expect(answer).toContain("Ontario 309A practice and mock exams are free.");
  });
  it("limits the paid preview claim and explicitly preserves free 309A practice and mocks", () => {
    const answer = answers.get("Can I try Echelon before paying?")!;
    expect(answer).toContain("Paid operator courses include 15 free practice questions");
    expect(answer).toContain("Individual Exam Pass or an assigned team licence");
    expect(answer).toContain("Ontario 309A practice and mock exams are free.");
    expect(answer).not.toContain("every course");
  });
  it("makes inclusions course-specific and leaves the refund policy paragraph unchanged", () => {
    expect(answers.get("What does Echelon include?")).toContain("Study tools and question totals vary by course.");
    expect(answers.get("What does Echelon include?")).toContain("not every tool is included in Ontario 309A preparation");
    expect(answers.get("How do refunds work?")).toBe("Refund eligibility depends on the product and timing. Review the Refund Policy before purchase or contact abello@echeloninstitute.ca.");
  });
});
