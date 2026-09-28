import { describe, expect, it } from "vitest";
import {
  frameAncestorsForEnvironment,
  MANUS_PREVIEW_FRAME_ANCESTORS,
} from "./previewSecurity";

describe("frameAncestorsForEnvironment", () => {
  it("permits only Manus Studio preview origins in development", () => {
    expect(frameAncestorsForEnvironment("development")).toEqual([
      ...MANUS_PREVIEW_FRAME_ANCESTORS,
    ]);
  });

  it("keeps production pages protected from framing", () => {
    expect(frameAncestorsForEnvironment("production")).toEqual(["'none'"]);
    expect(frameAncestorsForEnvironment("test")).toEqual(["'none'"]);
  });
});
