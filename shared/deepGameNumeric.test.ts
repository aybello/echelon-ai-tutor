import { describe, expect, it } from "vitest";
import {
  compareNumericAnswer, deepNumericObservationDescriptorSchema, encodeNumericAlias, parseBoundedDecimal, parseNumericAlias,
} from "./deepGameNumeric";

const spec = {
  expected: "12.50", expectedUnitId: "L-min", absoluteTolerance: "0.01",
  unitOptions: [
    { id: "L-min" }, { id: "L-h", toExpected: { numerator: "1", denominator: "60" } }, { id: "wrong" },
  ],
};

describe("bounded decimal numeric observations", () => {
  it.each(["0", "-0", "12.50", "-12.5", "999999999999999999.999999999999"])("accepts %s without floating-point coercion", value => {
    expect(parseBoundedDecimal(value)).not.toBeNull();
    const alias = encodeNumericAlias(value, "L-min");
    expect(alias).toMatch(/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,79}$/);
    expect(parseNumericAlias(alias)).toEqual({ value, unitId: "L-min" });
  });
  it.each(["", " ", " 1", "1 ", "+1", ".5", "1.", "01", "-01", "1e3", "1E-3", "Infinity", "-Infinity", "NaN", "1/2", "1+2", "2*3", "0x10", "1,000", "１２", "--1", "1\n", "1\n2", "1000000000000000000", "0.1234567890123"])("rejects malformed/exponential/expression %j", value => {
    expect(parseBoundedDecimal(value)).toBeNull();
    expect(encodeNumericAlias(value, "L-min")).toBeNull();
    expect(parseNumericAlias(`n:${value}:L-min`)).toBeNull();
  });
  it.each([null, undefined, 12, {}, "n:1", "n:1:L:min", "x:1:L", "n:1:L.min", "n:1:-L", "n:1:L/min", `n:1:${"a".repeat(33)}`, `n:${"1".repeat(80)}:L`])("rejects malformed aliases %j", alias => {
    expect(parseNumericAlias(alias)).toBeNull();
  });
  it("bounds and separates units and preserves precision, including signed zero", () => {
    expect(encodeNumericAlias("12.50", "L-min")).toBe("n:12.50:L-min");
    expect(encodeNumericAlias("-0.00", "u_1")).toBe("n:-0.00:u_1");
    expect(encodeNumericAlias("1", "a".repeat(32))).not.toBeNull();
    expect(encodeNumericAlias("1", "a".repeat(33))).toBeNull();
  });
  it("observation descriptor is strict and contains no scoring policy", () => {
    const descriptor = { kind: "numeric", unitOptions: [{ id: "L-min", label: "L/min" }] };
    expect(deepNumericObservationDescriptorSchema.safeParse(descriptor).success).toBe(true);
    for (const field of ["expected", "expectedUnitId", "absoluteTolerance", "correctOptionId", "relativeTolerance"])
      expect(deepNumericObservationDescriptorSchema.safeParse({ ...descriptor, [field]: "1" }).success).toBe(false);
    expect(deepNumericObservationDescriptorSchema.safeParse({ ...descriptor, unitOptions: [{ ...descriptor.unitOptions[0], toExpected: { numerator: "1", denominator: "1" } }] }).success).toBe(false);
    expect(deepNumericObservationDescriptorSchema.safeParse({ ...descriptor, unitOptions: [descriptor.unitOptions[0], descriptor.unitOptions[0]] }).success).toBe(false);
  });
});

describe("exact rational numeric practice comparison", () => {
  it("accepts inclusive absolute edges and rejects just outside", () => {
    for (const value of ["12.49", "12.50", "12.51"]) expect(compareNumericAnswer(spec, value, "L-min")).toBe(true);
    for (const value of ["12.489999999999", "12.510000000001"]) expect(compareNumericAnswer(spec, value, "L-min")).toBe(false);
  });
  it("never guesses unit conversion and uses explicit rational factors", () => {
    expect(compareNumericAnswer(spec, "12.50", "wrong")).toBe(false);
    expect(compareNumericAnswer(spec, "12.50", "missing")).toBe(false);
    expect(compareNumericAnswer(spec, "750", "L-h")).toBe(true);
    expect(compareNumericAnswer({ ...spec, expected: "0.1", absoluteTolerance: "0" }, "6", "L-h")).toBe(true);
    expect(compareNumericAnswer({ ...spec, expected: "0.3", absoluteTolerance: "0" }, "0.300000000001", "L-min")).toBe(false);
  });
  it("handles negatives and zero and does not derive tolerance from displayed precision", () => {
    const negative = { ...spec, expected: "-10", absoluteTolerance: "0.1" };
    expect(compareNumericAnswer(negative, "-9.9", "L-min")).toBe(true);
    expect(compareNumericAnswer(negative, "-10.100000000001", "L-min")).toBe(false);
    const zero = { ...spec, expected: "0", absoluteTolerance: "0", relativeTolerance: "0.5" };
    expect(compareNumericAnswer(zero, "-0", "L-min")).toBe(true);
    expect(compareNumericAnswer(zero, "0.000000000001", "L-min")).toBe(false);
    expect(compareNumericAnswer({ ...spec, absoluteTolerance: "0" }, "12.5001", "L-min")).toBe(false);
  });
  it("uses inclusive max of absolute and magnitude-based relative tolerances", () => {
    const relative = { ...spec, expected: "-100", absoluteTolerance: "0.1", relativeTolerance: "0.01" };
    expect(compareNumericAnswer(relative, "-99", "L-min")).toBe(true);
    expect(compareNumericAnswer(relative, "-101", "L-min")).toBe(true);
    expect(compareNumericAnswer(relative, "-98.999999999999", "L-min")).toBe(false);
    expect(compareNumericAnswer({ ...relative, absoluteTolerance: "2" }, "-98", "L-min")).toBe(true);
  });
  it("compares beyond Number safe integers exactly", () => {
    const large = { ...spec, expected: "999999999999999999", absoluteTolerance: "0" };
    expect(compareNumericAnswer(large, "999999999999999998", "L-min")).toBe(false);
    expect(compareNumericAnswer(large, "999999999999999999", "L-min")).toBe(true);
  });
  it("fails closed for invalid authored policy and malicious submitted input", () => {
    for (const patch of [{ expected: "NaN" }, { absoluteTolerance: "-1" }, { absoluteTolerance: "1e-2" }, { relativeTolerance: "-0.1" }, { relativeTolerance: "" }, { expectedUnitId: "absent" }])
      expect(compareNumericAnswer({ ...spec, ...patch }, "12.5", "L-min")).toBe(false);
    for (const toExpected of [{ numerator: "1", denominator: "0" }, { numerator: "-1", denominator: "1" }, { numerator: "x", denominator: "1" }, { numerator: "2", denominator: "1" }])
      expect(compareNumericAnswer({ ...spec, unitOptions: [{ id: "L-min", toExpected }] }, "12.5", "L-min")).toBe(false);
    for (const value of ["NaN", "Infinity", "1+2", "1e1", "12.5 "])
      expect(compareNumericAnswer(spec, value, "L-min")).toBe(false);
  });
});
