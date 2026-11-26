// Small deterministic AST, not eval(), text parsing, or a universal engineering solver.
const gcd = (a, b) => b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b);
function rational(n, d = 1n) {
  if (!d) throw Error('zero-denominator');
  if (n.toString().length > 4096 || d.toString().length > 4096) throw Error('calculation-magnitude-bound-exceeded');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d); return { n: n / g, d: d / g };
}
function parseRational(value) {
  if (!value || !/^-?\d{1,100}$/.test(value.numerator) || !/^[1-9]\d{0,99}$/.test(value.denominator)) throw Error('rational-required');
  return rational(BigInt(value.numerator), BigInt(value.denominator));
}
const mul = (a, b) => rational(a.n * b.n, a.d * b.d);
const div = (a, b) => rational(a.n * b.d, a.d * b.n);
const add = (a, b) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
const UNITS = Object.freeze({
  '1': [1n, 1n, {}], L: [1n, 1n, { volume: 1 }], mL: [1n, 1000n, { volume: 1 }],
  ML: [1000000n, 1n, { volume: 1 }], 'm³': [1000n, 1n, { volume: 1 }],
  mg: [1n, 1n, { mass: 1 }], g: [1000n, 1n, { mass: 1 }], kg: [1000000n, 1n, { mass: 1 }],
  s: [1n, 1n, { time: 1 }], min: [60n, 1n, { time: 1 }], h: [3600n, 1n, { time: 1 }],
  'mg/L': [1n, 1n, { mass: 1, volume: -1 }], 'L/s': [1n, 1n, { volume: 1, time: -1 }],
  'ML/d': [1000000n, 86400n, { volume: 1, time: -1 }],
  'mg·min/L': [60n, 1n, { mass: 1, time: 1, volume: -1 }],
});
function unit(name) {
  if (!Object.hasOwn(UNITS, name)) throw Error('unsupported-unit');
  const [n, d, dimensions] = UNITS[name]; return { scale: rational(n, d), dimensions };
}
const dimensionKey = d => JSON.stringify(Object.entries(d).filter(([, power]) => power).sort());
function combine(a, b, sign = 1) {
  const dims = { ...a }; for (const [k, p] of Object.entries(b)) dims[k] = (dims[k] ?? 0) + sign * p; return dims;
}
function rounded(value, places) {
  const scale = 10n ** BigInt(places); const n = value.n * scale; const magnitude = n < 0n ? -n : n;
  const result = magnitude / value.d + (2n * (magnitude % value.d) >= value.d ? 1n : 0n);
  return (n < 0n ? -result : result).toString();
}
export function checkCalculation(check) {
  try {
    if (check?.schemaVersion !== 'calculation-v1' || !check?.expression || check.rounding?.mode !== 'half-away-from-zero' || !Number.isInteger(check.rounding?.decimalPlaces) || check.rounding.decimalPlaces < 0 || check.rounding.decimalPlaces > 12) throw Error('calculation-schema-invalid');
    let nodes = 0;
    function evaluate(node, depth = 0) {
      if (++nodes > 100 || depth > 16) throw Error('calculation-bound-exceeded');
      if (node.op === 'quantity') {
        const u = unit(node.unit); return { value: mul(parseRational(node.value), u.scale), dims: u.dimensions };
      }
      if (!['add', 'subtract', 'multiply', 'divide', 'power'].includes(node.op)) throw Error('unknown-operation');
      const a = evaluate(node.left, depth + 1);
      if (node.op === 'power') {
        if (!Number.isInteger(node.exponent) || node.exponent < 0 || node.exponent > 8) throw Error('power-bound-exceeded');
        return { value: rational(a.value.n ** BigInt(node.exponent), a.value.d ** BigInt(node.exponent)), dims: Object.fromEntries(Object.entries(a.dims).map(([k, p]) => [k, p * node.exponent])) };
      }
      const b = evaluate(node.right, depth + 1);
      if (['add', 'subtract'].includes(node.op)) {
        if (dimensionKey(a.dims) !== dimensionKey(b.dims)) throw Error('unit-dimension-mismatch');
        return { value: add(a.value, node.op === 'subtract' ? rational(-b.value.n, b.value.d) : b.value), dims: a.dims };
      }
      return { value: node.op === 'multiply' ? mul(a.value, b.value) : div(a.value, b.value), dims: combine(a.dims, b.dims, node.op === 'multiply' ? 1 : -1) };
    }
    const result = evaluate(check.expression); const expectedUnit = unit(check.expected.unit);
    if (dimensionKey(result.dims) !== dimensionKey(expectedUnit.dimensions)) throw Error('expected-unit-dimension-mismatch');
    const value = div(result.value, expectedUnit.scale); const expected = parseRational(check.expected.value);
    const actualRounded = rounded(value, check.rounding.decimalPlaces);
    return { passed: actualRounded === rounded(expected, check.rounding.decimalPlaces), exact: { numerator: value.n.toString(), denominator: value.d.toString(), unit: check.expected.unit }, roundedInteger: actualRounded, decimalPlaces: check.rounding.decimalPlaces };
  } catch (error) { return { passed: false, issue: error.message }; }
}
