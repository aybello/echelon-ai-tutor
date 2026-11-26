import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import ts from "typescript";

describe("Flex progress readiness availability contract", () => {
  it("exposes false for unstarted licences and propagates the snapshot flag for calculated rows", () => {
    const source = ts.createSourceFile("teamFlexRouter.ts", readFileSync(new URL("./routers/teamFlexRouter.ts", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
    const values: string[] = [];
    const scores: string[] = [];
    function visit(node: ts.Node) {
      if (ts.isPropertyAssignment(node) && node.name.getText(source) === "readinessAvailable") values.push(node.initializer.getText(source));
      if (ts.isPropertyAssignment(node) && node.name.getText(source) === "readinessScore") scores.push(node.initializer.getText(source));
      ts.forEachChild(node, visit);
    }
    visit(source);
    expect(values).toEqual(["false", "readinessResult.hasData"]);
    expect(scores).toEqual(["0", "readinessResult.score"]);
  });
});
