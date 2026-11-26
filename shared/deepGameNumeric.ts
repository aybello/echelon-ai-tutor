import { z } from "zod";

/** No whitespace, plus sign, exponent, expression, grouping, leading zeros or implicit decimal point. */
export const deepNumericDecimalSchema = z.string().max(32).regex(/^-?(?:0|[1-9][0-9]{0,17})(?:\.[0-9]{1,12})?$/);
export const deepNumericUnitIdSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,31}$/);
export type Rational = { numerator: bigint; denominator: bigint };
export type NumericAlias = { value: string; unitId: string };

export function parseBoundedDecimal(value: unknown): Rational | null {
  if (!deepNumericDecimalSchema.safeParse(value).success) return null;
  const text = value as string;
  const negative = text.startsWith("-");
  const [whole, fraction = ""] = (negative ? text.slice(1) : text).split(".");
  return { numerator: BigInt(whole + fraction) * (negative ? -1n : 1n), denominator: 10n ** BigInt(fraction.length) };
}

/** Preserve entered decimal precision (including trailing zeros); always fits the existing varchar(80)/ID grammar. */
export function encodeNumericAlias(value: string, unitId: string): string | null {
  if (!deepNumericDecimalSchema.safeParse(value).success || !deepNumericUnitIdSchema.safeParse(unitId).success) return null;
  return `n:${value}:${unitId}`;
}

export function parseNumericAlias(alias: unknown): NumericAlias | null {
  if (typeof alias !== "string" || alias.length > 80) return null;
  const match = /^n:([^:]+):([^:]+)$/.exec(alias);
  if (!match || encodeNumericAlias(match[1], match[2]) !== alias) return null;
  return { value: match[1], unitId: match[2] };
}

/** Observation snapshots deliberately contain no expected values, tolerances or conversion factors. */
export const deepNumericObservationDescriptorSchema = z.object({
  kind: z.literal("numeric"),
  unitOptions: z.array(z.object({
    id: deepNumericUnitIdSchema,
    label: z.string().min(1).max(300).refine(value => value.trim().length > 0, "Blank unit label"),
  }).strict()).min(1).max(8).refine(options => new Set(options.map(option => option.id)).size === options.length, "Duplicate unit IDs"),
}).strict();
export type DeepNumericObservationDescriptor = z.infer<typeof deepNumericObservationDescriptorSchema>;

const positiveInteger = z.string().regex(/^[1-9][0-9]{0,17}$/);
export const deepUnitFactorSchema = z.object({ numerator: positiveInteger, denominator: positiveInteger }).strict();
export type DeepUnitFactor = z.infer<typeof deepUnitFactorSchema>;

const absolute = (value: bigint) => value < 0n ? -value : value;
const multiply = (a: Rational, b: Rational): Rational => ({ numerator: a.numerator * b.numerator, denominator: a.denominator * b.denominator });
const atMost = (a: Rational, b: Rational) => a.numerator * b.denominator <= b.numerator * a.denominator;

export type NumericComparisonSpec = {
  expected: string;
  expectedUnitId: string;
  absoluteTolerance: string;
  relativeTolerance?: string;
  unitOptions: ReadonlyArray<{ id: string; toExpected?: DeepUnitFactor }>;
};

/** Inclusive max(absoluteTolerance, abs(expected) * relativeTolerance), in expected units.
 * Only the expected unit or an explicitly authored positive rational conversion is accepted.
 * The expected unit's conversion, if present, must be identity. This never uses Number arithmetic.
 */
export function compareNumericAnswer(spec: NumericComparisonSpec, value: string, unitId: string): boolean {
  const actual = parseBoundedDecimal(value);
  const expected = parseBoundedDecimal(spec.expected);
  const absoluteTolerance = parseBoundedDecimal(spec.absoluteTolerance);
  const relativeTolerance = spec.relativeTolerance === undefined ? { numerator: 0n, denominator: 1n } : parseBoundedDecimal(spec.relativeTolerance);
  const unit = spec.unitOptions.find(option => option.id === unitId);
  if (!actual || !expected || !absoluteTolerance || !relativeTolerance || !unit || absoluteTolerance.numerator < 0n || relativeTolerance.numerator < 0n) return false;
  let factor: Rational = { numerator: 1n, denominator: 1n };
  if (unit.toExpected !== undefined) {
    if (!deepUnitFactorSchema.safeParse(unit.toExpected).success) return false;
    factor = { numerator: BigInt(unit.toExpected.numerator), denominator: BigInt(unit.toExpected.denominator) };
    if (unitId === spec.expectedUnitId && factor.numerator !== factor.denominator) return false;
  } else if (unitId !== spec.expectedUnitId) return false;
  if (!spec.unitOptions.some(option => option.id === spec.expectedUnitId)) return false;
  const converted = multiply(actual, factor);
  const difference = {
    numerator: absolute(converted.numerator * expected.denominator - expected.numerator * converted.denominator),
    denominator: converted.denominator * expected.denominator,
  };
  const relative = multiply({ numerator: absolute(expected.numerator), denominator: expected.denominator }, relativeTolerance);
  return atMost(difference, absoluteTolerance) || atMost(difference, relative);
}
