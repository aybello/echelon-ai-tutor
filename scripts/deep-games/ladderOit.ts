/**
 * Draft generator for OIT Calculation Ladder tasks.
 * Every number is chosen backwards from an exact decimal answer, and all arithmetic uses exact fractions,
 * so no answer is ever rounded. Formulas come only from the cited source pages (see SOURCES).
 * Output is a DRAFT: nothing here is published or reviewed. Run with: node --import tsx scripts/deep-games/ladderOit.ts <out.json>
 */
import { writeFileSync } from "node:fs";

// ---- exact arithmetic -------------------------------------------------------------------------
type Fr = { n: bigint; d: bigint };
const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));
const mk = (n: bigint, d: bigint): Fr => { const g = gcd(n, d) || 1n; const s = d < 0n ? -1n : 1n; return { n: (n / g) * s, d: (d / g) * s }; };
/** Parse a decimal string such as "3.14" exactly. */
const D = (value: string | number): Fr => {
  const text = String(value); const [w, f = ""] = text.split(".");
  return mk(BigInt(w + f), 10n ** BigInt(f.length));
};
const mul = (a: Fr, b: Fr) => mk(a.n * b.n, a.d * b.d);
const div = (a: Fr, b: Fr) => mk(a.n * b.d, a.d * b.n);
const add = (a: Fr, b: Fr) => mk(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a: Fr, b: Fr) => mk(a.n * b.d - b.n * a.d, a.d * b.d);
/** Exact terminating decimal with at most maxDecimals places, else null. */
function dec(f: Fr, maxDecimals = 3): string | null {
  let d = f.d; let twos = 0; let fives = 0;
  while (d % 2n === 0n) { d /= 2n; twos++; }
  while (d % 5n === 0n) { d /= 5n; fives++; }
  if (d !== 1n) return null;
  const k = Math.max(twos, fives); if (k > maxDecimals) return null;
  const scaled = f.n * (10n ** BigInt(k)) / f.d;
  const neg = scaled < 0n; const digits = (neg ? -scaled : scaled).toString().padStart(k + 1, "0");
  const whole = digits.slice(0, digits.length - k); const frac = digits.slice(digits.length - k).replace(/0+$/, "");
  if (whole.length > 12) return null;
  return `${neg ? "-" : ""}${whole}${frac ? "." + frac : ""}`;
}
const fmt = (n: number | string) => { const s = String(n); const [w, f] = s.split("."); return w.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (f ? "." + f : ""); };

// ---- seeded randomness --------------------------------------------------------------------------
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
type R = () => number;
const pick = <T,>(r: R, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
const shuffle = <T,>(r: R, xs: readonly T[]): T[] => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---- sources (page numbers verified against the downloaded PDF text) ----------------------------
const MB = "Government of Manitoba, Metric Math for Wastewater Operators: A Guide to Using the ABC and EOCP Canadian Formulas";
const MB_URL = "https://gov.mb.ca/sd/pubs/waste_management/wastewater/metric_math_for_wastewater_operators.pdf";
export const NEW_SOURCES = [
  { id: "mb-p26", title: MB, locator: `PDF p. 26 (printed p. 26), Volume of a Cylinder. ${MB_URL}` },
  { id: "mb-p28", title: MB, locator: `PDF p. 28 (printed p. 28), The Megaliter Shortcut (loading, kg/day = flow x concentration). ${MB_URL}` },
  { id: "mb-p32", title: MB, locator: `PDF p. 32 (printed p. 32), Percent (%) Removal Calculation. ${MB_URL}` },
  { id: "mb-p34", title: MB, locator: `PDF p. 34 (printed p. 34), Flow = Area x Velocity (full pipe). ${MB_URL}` },
  { id: "mb-p35", title: MB, locator: `PDF p. 35 (printed p. 35), Detention Time (Hydraulic Retention Time) Calculations; Volume = L x W x D. ${MB_URL}` },
  { id: "mb-p38", title: MB, locator: `PDF p. 38 (printed p. 38), Surface Overflow Rate, SOR = Q / A. ${MB_URL}` },
  { id: "mb-p39", title: MB, locator: `PDF p. 39 (printed p. 39), Surface Overflow Rate (circular clarifier) and Weir Overflow Rate. ${MB_URL}` },
  { id: "mb-p40", title: MB, locator: `PDF p. 40 (printed p. 40), Weir Overflow Rate (circular weir) and Chlorine Dosage from a hypochlorite solution. ${MB_URL}` },
  { id: "mb-p41", title: MB, locator: `PDF p. 41 (printed p. 41), Chlorine concentration from mass; dose = demand + residual. ${MB_URL}` },
];
// Existing, already-published source reused for V = Q x t and Q = V / t.
const HB182 = "hb-p182";

// ---- draft shape -------------------------------------------------------------------------------
export type Draft = {
  family: string; topicId: string; sourceId: string; prompt: string; assumptions: string;
  formula: { q: string; correct: string; wrong: [string, string]; why: string };
  units: { q: string; correct: string; wrong: [string, string]; why: string };
  subst: { q: string; correct: string; wrong: [string, string]; why: string };
  result: { prompt: string; unitId: string; unitLabel: string; wrongUnits: [string, string][]; expected: string; why: string };
  check: number; // independent floating-point recomputation of the answer
};
const PI = D("3.14");
const places = ["flocculation basin", "sedimentation basin", "chlorine contact tank", "clearwell", "raw-water holding tank", "filtered-water reservoir"] as const;
const subs = ["suspended solids", "turbidity-causing solids", "alum", "dissolved organic carbon", "manganese", "iron"] as const;
const num = (f: Fr, max = 3) => dec(f, max);
const need = <T,>(v: T | null | undefined): T => { if (v === null || v === undefined) throw new Error("retry"); return v; };

type Family = { id: string; count: number; make: (r: R) => Draft };
const FAMILIES: Family[] = [
  { id: "pct-removal", count: 12, make: r => {
    const inn = pick(r, [100, 125, 160, 200, 250, 400, 500]), p = pick(r, [40, 60, 75, 80, 85, 90, 95]);
    const out = need(num(mul(D(inn), div(D(100 - p), D(100))), 1)); const place = pick(r, ["sedimentation basin", "flocculation and sedimentation train", "clarifier", "rapid sand filter"]);
    const par = pick(r, [["turbidity", "NTU", "NTU"], ["suspended solids", "mg/L", "mg-L"]] as const);
    const u = par[1];
    return { family: "pct-removal", topicId: "removal-efficiency", sourceId: "mb-p32",
      prompt: `A ${place} reduces ${par[0]} from ${inn} ${u} to ${out} ${u}. Find the removal efficiency in percent. Enter the exact number.`,
      assumptions: `% removal = (in - out) x 100 / in, with in = ${inn} ${u} and out = ${out} ${u}.`,
      formula: { q: "Which formula gives percent removal?", correct: "% removal = (in - out) x 100 / in", wrong: ["% removal = (in - out) x 100 / out", "% removal = out x 100 / in"], why: "Percent removal is the amount removed as a share of what came in." },
      units: { q: "What happens to the units in this calculation?", correct: `${u} divided by ${u} cancels, leaving a percent`, wrong: [`The answer stays in ${u}`, `The answer is in ${u} per 100`], why: "A ratio of two like quantities has no units; multiplying by 100 expresses it as a percent." },
      subst: { q: "Which substitution is correct?", correct: `(${inn} - ${out}) x 100 / ${inn}`, wrong: [`(${inn} - ${out}) x 100 / ${out}`, `${out} x 100 / ${inn}`], why: "Subtract out from in, multiply by 100, divide by in." },
      result: { prompt: "Enter the exact removal efficiency in percent.", unitId: "pct", unitLabel: "%", wrongUnits: [[par[2], u], ["pct100", "% of out"]], expected: String(p), why: `(${inn} - ${out}) x 100 / ${inn} = ${p}%.` }, check: ((inn - Number(out)) * 100) / inn };
  } },
  { id: "pipe-flow", count: 12, make: r => {
    const dcm = pick(r, [20, 30, 40, 50]), v = pick(r, ["0.5", "1", "1.5", "2"]); const rad = D(dcm / 100 / 2 === 0.1 ? "0.1" : String(dcm / 200));
    const area = mul(PI, mul(rad, rad)); const Ls = need(num(mul(mul(area, D(v)), D(1000)), 3)); const radS = String(dcm / 200);
    return { family: "pipe-flow", topicId: "pipe-flow", sourceId: "mb-p34",
      prompt: `Water flows through a full pipe ${dcm} cm in diameter at ${v} m/s. Find the flow in L/s. Enter the exact number.`,
      assumptions: `Flow = area x velocity. Diameter ${dcm} cm = ${dcm / 100} m, radius = ${radS} m. Area = pi x r^2 with pi = 3.14. 1 m3 = 1,000 L.`,
      formula: { q: "Which formula gives flow in a full pipe?", correct: "Flow = area x velocity", wrong: ["Flow = area / velocity", "Flow = velocity / area"], why: "Flow is the cross-sectional area times how fast the water moves." },
      units: { q: "How do you convert m3/s to L/s?", correct: "Multiply by 1,000 L/m3", wrong: ["Divide by 1,000 L/m3", "Multiply by 3,600 s/h"], why: "1 m3 is 1,000 L." },
      subst: { q: "Which substitution is correct?", correct: `Q = 3.14 x (${radS} m)^2 x ${v} m/s x 1,000 L/m3`, wrong: [`Q = 3.14 x ${radS} m x ${v} m/s x 1,000 L/m3`, `Q = 3.14 x (${radS} m)^2 x ${v} m/s / 1,000 L/m3`], why: "Square the radius, multiply by velocity, then convert m3/s to L/s." },
      result: { prompt: "Enter the exact flow in L/s.", unitId: "L-s", unitLabel: "L/s", wrongUnits: [["m3-s", "m3/s"], ["m-s", "m/s"]], expected: Ls, why: `Area = 3.14 x ${radS}^2 = ${need(num(area, 5))} m2; x ${v} m/s x 1,000 = ${Ls} L/s.` }, check: 3.14 * (dcm / 200) ** 2 * Number(v) * 1000 };
  } },
  { id: "rect-volume", count: 12, make: r => {
    const L = pick(r, [6, 8, 10, 12, 15, 18, 20, 24, 30]), W = pick(r, [3, 4, 5, 6, 8, 10, 12]), Dp = pick(r, ["2", "2.5", "3", "3.5", "4", "4.5", "5"]);
    const V = need(num(mul(mul(D(L), D(W)), D(Dp)))); const place = pick(r, places);
    return { family: "rect-volume", topicId: "basin-volume", sourceId: "mb-p35",
      prompt: `A rectangular ${place} is ${L} m long, ${W} m wide and ${Dp} m deep. Find its volume in m3. Enter the exact number.`,
      assumptions: `Length ${L} m, width ${W} m, depth ${Dp} m. Use Volume = L x W x D.`,
      formula: { q: "Which formula gives the volume of a rectangular basin?", correct: "V = L x W x D", wrong: ["V = L x W / D", "V = (L + W) x D"], why: "Volume of a rectangular tank is length times width times depth." },
      units: { q: "What unit results from m x m x m?", correct: "m3", wrong: ["m2", "m"], why: "Three lengths multiplied give cubic metres." },
      subst: { q: "Which substitution is correct?", correct: `V = ${L} m x ${W} m x ${Dp} m`, wrong: [`V = ${L} m x ${W} m / ${Dp} m`, `V = (${L} m + ${W} m) x ${Dp} m`], why: `Multiply ${L}, ${W} and ${Dp}.` },
      result: { prompt: "Enter the exact volume in m3.", unitId: "m3", unitLabel: "m3", wrongUnits: [["m2", "m2"], ["m", "m"]], expected: V, why: `${L} x ${W} x ${Dp} = ${fmt(V)} m3.` }, check: L * W * Number(Dp) };
  } },
  { id: "cyl-volume", count: 11, make: r => {
    const dia = pick(r, [4, 6, 8, 10, 12, 14, 16, 20, 24]), h = pick(r, ["2", "2.5", "3", "3.5", "4", "5"]);
    const rad = D(dia / 2); const V = need(num(mul(mul(PI, mul(rad, rad)), D(h)), 3)); const place = pick(r, ["circular clarifier", "circular sedimentation basin", "cylindrical storage tank", "circular clearwell"]);
    const radS = String(dia / 2);
    return { family: "cyl-volume", topicId: "basin-volume", sourceId: "mb-p26",
      prompt: `A ${place} is ${dia} m in diameter and ${h} m deep. Find its volume in m3. Enter the exact number.`,
      assumptions: `Diameter ${dia} m so radius ${radS} m; depth ${h} m. Use V = pi x r^2 x h with pi = 3.14.`,
      formula: { q: "Which formula gives the volume of a cylinder?", correct: "V = pi x r^2 x h", wrong: ["V = pi x d x h", "V = pi x r x h"], why: "Volume is the circular base area (pi x radius squared) times the height." },
      units: { q: "What unit results from m^2 x m?", correct: "m3", wrong: ["m2", "m"], why: "Area in m2 times depth in m gives m3." },
      subst: { q: "Which substitution is correct?", correct: `V = 3.14 x (${radS} m)^2 x ${h} m`, wrong: [`V = 3.14 x (${dia} m)^2 x ${h} m`, `V = 3.14 x ${radS} m x ${h} m`], why: `The radius is half the diameter: ${dia} / 2 = ${radS} m.` },
      result: { prompt: "Enter the exact volume in m3.", unitId: "m3", unitLabel: "m3", wrongUnits: [["m2", "m2"], ["m", "m"]], expected: V, why: `3.14 x ${radS}^2 x ${h} = ${fmt(V)} m3.` }, check: 3.14 * (dia / 2) ** 2 * Number(h) };
  } },
  { id: "dt-rect", count: 11, make: r => {
    const L = pick(r, [10, 12, 15, 20, 24, 30]), W = pick(r, [4, 5, 6, 8, 10]), Dp = pick(r, ["2", "3", "4", "5"]), target = pick(r, ["0.5", "1", "1.5", "2", "2.5", "3", "4"]);
    const V = mul(mul(D(L), D(W)), D(Dp)); const Q = need(num(div(V, D(target)), 2)); const place = pick(r, ["flocculation basin", "sedimentation basin", "chlorine contact tank", "clearwell"]);
    const Vs = need(num(V));
    return { family: "dt-rect", topicId: "detention-time", sourceId: "mb-p35",
      prompt: `A rectangular ${place} is ${L} m long, ${W} m wide and ${Dp} m deep. Flow through it is ${fmt(Q)} m3/h. Find the detention time in hours. Enter the exact number.`,
      assumptions: `Volume = L x W x D = ${L} x ${W} x ${Dp} = ${fmt(Vs)} m3. Detention time = volume / flow. Flow is already in m3/h.`,
      formula: { q: "Which formula gives detention time?", correct: "Detention time = volume / flow", wrong: ["Detention time = flow / volume", "Detention time = volume x flow"], why: "Detention time is how long water stays: volume divided by flow." },
      units: { q: "What unit results from m3 divided by m3/h?", correct: "h", wrong: ["m3", "m3/h"], why: "Cubic metres cancel, leaving hours." },
      subst: { q: "Which substitution is correct?", correct: `DT = ${fmt(Vs)} m3 / ${fmt(Q)} m3/h`, wrong: [`DT = ${fmt(Q)} m3/h / ${fmt(Vs)} m3`, `DT = ${fmt(Vs)} m3 x ${fmt(Q)} m3/h`], why: "Divide the basin volume by the flow." },
      result: { prompt: "Enter the exact detention time in hours.", unitId: "h", unitLabel: "h", wrongUnits: [["min", "min"], ["m3", "m3"]], expected: target, why: `${fmt(Vs)} m3 / ${fmt(Q)} m3/h = ${target} h.` }, check: (L * W * Number(Dp)) / Number(Q) };
  } },
  { id: "dt-convert", count: 11, make: r => {
    const Qls = pick(r, [10, 15, 20, 25, 30, 40, 50, 75]), target = pick(r, ["0.5", "1", "1.5", "2", "2.5", "3", "4"]);
    const Qh = mul(D(Qls), D("3.6")); const V = need(num(mul(Qh, D(target)), 2)); const Qhs = need(num(Qh)); const place = pick(r, ["chlorine contact tank", "clearwell", "flocculation basin", "sedimentation basin"]);
    return { family: "dt-convert", topicId: "detention-conversion", sourceId: "mb-p35",
      prompt: `A ${place} holds ${fmt(V)} m3. Flow through it is ${Qls} L/s. Find the detention time in hours. Enter the exact number.`,
      assumptions: `Detention time = volume / flow. Convert flow to m3/h first: L/s x 3,600 s/h / 1,000 L/m3 = L/s x 3.6.`,
      formula: { q: "Which formula gives detention time?", correct: "Detention time = volume / flow", wrong: ["Detention time = flow / volume", "Detention time = volume x flow"], why: "Detention time is volume divided by flow." },
      units: { q: "How is a flow in L/s converted to m3/h?", correct: "Multiply by 3,600 s/h and divide by 1,000 L/m3", wrong: ["Multiply by 86,400 s/d and divide by 1,000 L/m3", "Divide by 3,600 s/h and multiply by 1,000 L/m3"], why: "There are 3,600 seconds in an hour and 1,000 litres in a cubic metre." },
      subst: { q: "Which substitution is correct?", correct: `DT = ${fmt(V)} m3 / ${fmt(Qhs)} m3/h`, wrong: [`DT = ${fmt(V)} m3 / (${Qls} / 3.6 m3/h)`, `DT = ${fmt(Qhs)} m3/h / ${fmt(V)} m3`], why: `${Qls} L/s = ${fmt(Qhs)} m3/h, then divide the volume by it.` },
      result: { prompt: "Enter the exact detention time in hours.", unitId: "h", unitLabel: "h", wrongUnits: [["min", "min"], ["s", "s"]], expected: target, why: `${Qls} L/s x 3.6 = ${fmt(Qhs)} m3/h; ${fmt(V)} / ${fmt(Qhs)} = ${target} h.` }, check: Number(V) / (Qls * 3.6) };
  } },
  { id: "loading", count: 11, make: r => {
    const flow = pick(r, [500, 800, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7500, 8000]), c = pick(r, ["1.5", "2", "2.5", "4", "5", "8", "12", "15", "20", "25", "40", "60", "180"]);
    const kg = need(num(mul(div(D(flow), D(1000)), D(c)), 3)); const place = pick(r, places); const s = pick(r, subs);
    return { family: "loading", topicId: "loading-rate", sourceId: "mb-p28",
      prompt: `${fmt(flow)} m3 of water per day entering a ${place} contains ${c} mg/L of ${s}. Find the daily load in kg/day. Enter the exact number.`,
      assumptions: `Loading, kg/day = flow (ML/day) x concentration (mg/L). 1 ML = 1,000 m3.`,
      formula: { q: "Which formula gives the daily load in kg/day?", correct: "Load = flow (ML/day) x concentration (mg/L)", wrong: ["Load = flow (ML/day) / concentration (mg/L)", "Load = flow (ML/day) + concentration (mg/L)"], why: "With flow in megalitres per day, mg/L multiplies directly to kg/day." },
      units: { q: "How do you get the flow in ML/day from m3/day?", correct: "Divide by 1,000", wrong: ["Multiply by 1,000", "Divide by 1,000,000"], why: "1 ML equals 1,000 m3." },
      subst: { q: "Which substitution is correct?", correct: `Load = ${flow / 1000} ML/day x ${c} mg/L`, wrong: [`Load = ${fmt(flow)} ML/day x ${c} mg/L`, `Load = ${fmt(flow * 1000)} ML/day x ${c} mg/L`], why: `${fmt(flow)} m3/day = ${fmt(flow / 1000)} ML/day.` },
      result: { prompt: "Enter the exact load in kg/day.", unitId: "kg-d", unitLabel: "kg/day", wrongUnits: [["mg-L", "mg/L"], ["g-d", "g/day"]], expected: kg, why: `${flow / 1000} ML/day x ${c} mg/L = ${fmt(kg)} kg/day.` }, check: (flow / 1000) * Number(c) };
  } },
  { id: "sor-rect", count: 11, make: r => {
    const L = pick(r, [10, 12, 15, 20, 25, 30, 40]), W = pick(r, [4, 5, 6, 8, 10]), sor = pick(r, ["12", "15", "18", "20", "24", "25", "30", "32"]);
    const A = mul(D(L), D(W)); const Q = need(num(mul(A, D(sor)), 2)); const As = need(num(A));
    return { family: "sor-rect", topicId: "overflow-rate", sourceId: "mb-p38",
      prompt: `A rectangular sedimentation basin is ${L} m long and ${W} m wide and receives ${fmt(Q)} m3/day. Find the surface overflow rate in m3/m2/day. Enter the exact number.`,
      assumptions: `Surface overflow rate = flow / surface area. Surface area = L x W = ${L} x ${W} = ${fmt(As)} m2.`,
      formula: { q: "Which formula gives surface overflow rate?", correct: "SOR = flow / surface area", wrong: ["SOR = surface area / flow", "SOR = flow x surface area"], why: "Surface overflow rate is flow per unit of surface area." },
      units: { q: "What unit results from m3/day divided by m2?", correct: "m3/m2/day", wrong: ["m3/day", "m2/day"], why: "Flow per area per day." },
      subst: { q: "Which substitution is correct?", correct: `SOR = ${fmt(Q)} m3/day / ${fmt(As)} m2`, wrong: [`SOR = ${fmt(As)} m2 / ${fmt(Q)} m3/day`, `SOR = ${fmt(Q)} m3/day / ${L} m`], why: "Divide the flow by the plan area of the basin." },
      result: { prompt: "Enter the exact surface overflow rate in m3/m2/day.", unitId: "m3-m2-d", unitLabel: "m3/m2/day", wrongUnits: [["m3-d", "m3/day"], ["m2-d", "m2/day"]], expected: sor, why: `${fmt(Q)} / ${fmt(As)} = ${sor} m3/m2/day.` }, check: Number(Q) / (L * W) };
  } },
  { id: "sor-circ", count: 11, make: r => {
    const dia = pick(r, [8, 10, 12, 14, 16, 18, 20, 24]), sor = pick(r, ["12", "15", "16", "20", "24", "25", "30"]);
    const rad = D(dia / 2); const A = mul(PI, mul(rad, rad)); const Q = need(num(mul(A, D(sor)), 2)); const As = need(num(A, 3));
    return { family: "sor-circ", topicId: "overflow-rate", sourceId: "mb-p39",
      prompt: `A circular clarifier is ${dia} m in diameter and receives ${fmt(Q)} m3/day. Find the surface overflow rate in m3/m2/day. Enter the exact number.`,
      assumptions: `SOR = flow / surface area. Surface area = pi x r^2 with pi = 3.14 and r = ${dia / 2} m, so area = ${fmt(As)} m2.`,
      formula: { q: "Which formula gives surface overflow rate?", correct: "SOR = flow / surface area", wrong: ["SOR = flow / circumference", "SOR = flow x surface area"], why: "Surface overflow rate uses the surface area, not the weir length." },
      units: { q: "What unit results from m3/day divided by m2?", correct: "m3/m2/day", wrong: ["m3/m/day", "m3/day"], why: "Flow per area per day." },
      subst: { q: "Which substitution is correct?", correct: `SOR = ${fmt(Q)} m3/day / (3.14 x (${dia / 2} m)^2)`, wrong: [`SOR = ${fmt(Q)} m3/day / (3.14 x ${dia} m)`, `SOR = ${fmt(Q)} m3/day / (3.14 x (${dia} m)^2)`], why: "Use the radius, half the diameter, squared." },
      result: { prompt: "Enter the exact surface overflow rate in m3/m2/day.", unitId: "m3-m2-d", unitLabel: "m3/m2/day", wrongUnits: [["m3-m-d", "m3/m/day"], ["m3-d", "m3/day"]], expected: sor, why: `Area = ${fmt(As)} m2; ${fmt(Q)} / ${fmt(As)} = ${sor} m3/m2/day.` }, check: Number(Q) / (3.14 * (dia / 2) ** 2) };
  } },
  { id: "wor-circ", count: 11, make: r => {
    const dia = pick(r, [10, 12, 15, 20, 25, 30, 40]), wor = pick(r, ["50", "60", "75", "80", "100", "120", "150"]);
    const circ = mul(PI, D(dia)); const Q = need(num(mul(circ, D(wor)), 2)); const cs = need(num(circ, 3));
    return { family: "wor-circ", topicId: "overflow-rate", sourceId: "mb-p40",
      prompt: `A circular clarifier has a weir ${dia} m in diameter and receives ${fmt(Q)} m3/day. Find the weir overflow rate in m3/m/day. Enter the exact number.`,
      assumptions: `Weir overflow rate = flow / weir length. Weir length = circumference = pi x d with pi = 3.14, so length = ${fmt(cs)} m.`,
      formula: { q: "Which formula gives weir overflow rate?", correct: "WOR = flow / weir length", wrong: ["WOR = flow / surface area", "WOR = weir length / flow"], why: "Weir overflow rate is flow per metre of weir." },
      units: { q: "What unit results from m3/day divided by m?", correct: "m3/m/day", wrong: ["m3/m2/day", "m3/day"], why: "Flow per length per day." },
      subst: { q: "Which substitution is correct?", correct: `WOR = ${fmt(Q)} m3/day / (3.14 x ${dia} m)`, wrong: [`WOR = ${fmt(Q)} m3/day / (3.14 x (${dia / 2} m)^2)`, `WOR = ${fmt(Q)} m3/day / ${dia} m`], why: "The weir length around a circular weir is its circumference, pi x d." },
      result: { prompt: "Enter the exact weir overflow rate in m3/m/day.", unitId: "m3-m-d", unitLabel: "m3/m/day", wrongUnits: [["m3-m2-d", "m3/m2/day"], ["m3-d", "m3/day"]], expected: wor, why: `Weir length = ${fmt(cs)} m; ${fmt(Q)} / ${fmt(cs)} = ${wor} m3/m/day.` }, check: Number(Q) / (3.14 * dia) };
  } },
  { id: "dose-hypo", count: 11, make: r => {
    const s = pick(r, [5, 10, 12]), flow = pick(r, [500, 1000, 1500, 2000, 2500, 4000, 5000]), dose = pick(r, ["0.5", "1", "1.5", "2", "2.5", "3", "4"]);
    const feed = need(num(div(mul(D(dose), D(flow)), D(10 * s)), 2)); const flowL = flow;
    return { family: "dose-hypo", topicId: "chlorine-dose", sourceId: "mb-p40",
      prompt: `A hypochlorinator feeds ${fmt(feed)} L/day of ${s}% sodium hypochlorite solution into ${fmt(flowL)} m3/day of water. Find the sodium hypochlorite dosage in mg/L. Enter the exact number.`,
      assumptions: `Dosage = (decimal strength x feed volume, L/day x 1,000) / water volume, m3/day. Strength ${s}% = ${s / 100} as a decimal. Treat the solution as 1 kg per litre, so a ${s}% solution is ${fmt(s * 10000)} mg/L, the method used in the cited guide.`,
      formula: { q: "Which formula gives the sodium hypochlorite dosage in mg/L?", correct: "Dosage = (decimal strength x feed, L/day x 1,000) / water, m3/day", wrong: ["Dosage = (decimal strength x feed, L/day) / water, m3/day", "Dosage = (water, m3/day x 1,000) / (decimal strength x feed, L/day)"], why: "The factor 1,000 converts kg of chemical per m3 of treated water to mg/L (1 kg/m3 = 1,000 mg/L)." },
      units: { q: "What is the decimal form of the percent strength?", correct: `${s}% = ${s / 100}`, wrong: [`${s}% = ${s}`, `${s}% = ${s / 1000}`], why: "Divide the percent by 100." },
      subst: { q: "Which substitution is correct?", correct: `Dosage = (${s / 100} x ${fmt(feed)} L/day x 1,000) / ${fmt(flowL)} m3/day`, wrong: [`Dosage = (${s} x ${fmt(feed)} L/day x 1,000) / ${fmt(flowL)} m3/day`, `Dosage = (${s / 100} x ${fmt(feed)} L/day) / ${fmt(flowL)} m3/day`], why: "Use the decimal strength and keep the 1,000 factor." },
      result: { prompt: "Enter the exact sodium hypochlorite dosage in mg/L.", unitId: "mg-L", unitLabel: "mg/L", wrongUnits: [["kg-d", "kg/day"], ["L-d", "L/day"]], expected: dose, why: `(${s / 100} x ${fmt(feed)} x 1,000) / ${fmt(flowL)} = ${dose} mg/L.` }, check: (s / 100) * Number(feed) * 1000 / flowL };
  } },
  { id: "conc-mass", count: 11, make: r => {
    const vol = pick(r, [1000, 2000, 2500, 4000, 5000, 6000, 8000, 10000]), c = pick(r, ["0.5", "1", "1.5", "2", "2.5", "3", "4", "5"]);
    const kg = need(num(div(mul(D(c), D(vol)), D(1000)), 3));
    return { family: "conc-mass", topicId: "chlorine-dose", sourceId: "mb-p41",
      prompt: `${fmt(kg)} kg of chlorine is added to ${fmt(vol)} m3 of water. Find the concentration in mg/L. Enter the exact number.`,
      assumptions: `Concentration, mg/L = (weight, kg x 1,000) / volume of water, m3.`,
      formula: { q: "Which formula gives concentration in mg/L?", correct: "Concentration = (weight, kg x 1,000) / volume, m3", wrong: ["Concentration = weight, kg / volume, m3", "Concentration = volume, m3 / (weight, kg x 1,000)"], why: "1 kg in 1 m3 is 1,000 mg/L." },
      units: { q: "What is the factor 1,000 for?", correct: "It converts kg per m3 to mg/L", wrong: ["It converts m3 to litres", "It converts mg to kg"], why: "1 kg per m3 equals 1,000 mg per L." },
      subst: { q: "Which substitution is correct?", correct: `Concentration = (${fmt(kg)} kg x 1,000) / ${fmt(vol)} m3`, wrong: [`Concentration = ${fmt(kg)} kg / ${fmt(vol)} m3`, `Concentration = (${fmt(vol)} m3 x 1,000) / ${fmt(kg)} kg`], why: "Multiply the mass in kg by 1,000 then divide by the volume." },
      result: { prompt: "Enter the exact concentration in mg/L.", unitId: "mg-L", unitLabel: "mg/L", wrongUnits: [["kg-m3", "kg/m3"], ["g-L", "g/L"]], expected: c, why: `(${fmt(kg)} x 1,000) / ${fmt(vol)} = ${c} mg/L.` }, check: (Number(kg) * 1000) / vol };
  } },
  { id: "dose-demand", count: 11, make: r => {
    const variant = pick(r, ["dose", "demand", "residual"] as const);
    const dem = pick(r, ["1.2", "1.5", "2.1", "2.5", "3.2", "4.4", "5.6"]), res = pick(r, ["0.2", "0.3", "0.5", "0.8", "1", "1.2"]);
    const dos = need(num(add(D(dem), D(res)))); const ans = variant === "dose" ? dos : variant === "demand" ? dem : res;
    const given = variant === "dose" ? `a chlorine demand of ${dem} mg/L and a residual of ${res} mg/L` : variant === "demand" ? `a chlorine dose of ${dos} mg/L and a residual of ${res} mg/L` : `a chlorine dose of ${dos} mg/L and a demand of ${dem} mg/L`;
    const ask = variant === "dose" ? "chlorine dose" : variant === "demand" ? "chlorine demand" : "chlorine residual";
    const fcor = variant === "dose" ? "Dose = demand + residual" : variant === "demand" ? "Demand = dose - residual" : "Residual = dose - demand";
    const fwr: [string, string] = variant === "dose" ? ["Dose = demand - residual", "Dose = demand x residual"] : variant === "demand" ? ["Demand = dose + residual", "Demand = dose x residual"] : ["Residual = dose + demand", "Residual = demand - dose"];
    const sc = variant === "dose" ? `Dose = ${dem} mg/L + ${res} mg/L` : variant === "demand" ? `Demand = ${dos} mg/L - ${res} mg/L` : `Residual = ${dos} mg/L - ${dem} mg/L`;
    const sw: [string, string] = variant === "dose" ? [`Dose = ${dem} mg/L - ${res} mg/L`, `Dose = ${res} mg/L - ${dem} mg/L`] : variant === "demand" ? [`Demand = ${dos} mg/L + ${res} mg/L`, `Demand = ${res} mg/L - ${dos} mg/L`] : [`Residual = ${dos} mg/L + ${dem} mg/L`, `Residual = ${dem} mg/L - ${dos} mg/L`];
    const calc = variant === "dose" ? Number(dem) + Number(res) : variant === "demand" ? Number(dos) - Number(res) : Number(dos) - Number(dem);
    const why = variant === "dose" ? `${dem} + ${res} = ${dos} mg/L.` : variant === "demand" ? `${dos} - ${res} = ${dem} mg/L.` : `${dos} - ${dem} = ${res} mg/L.`;
    return { family: "dose-demand", topicId: "chlorine-dose", sourceId: "mb-p41",
      prompt: `Water has ${given}. Find the ${ask} in mg/L. Enter the exact number.`,
      assumptions: `Chlorine dose = chlorine demand + chlorine residual. All values are in mg/L.`,
      formula: { q: `Which formula gives the ${ask}?`, correct: fcor, wrong: fwr, why: "Dose is the amount added: the part used up (demand) plus the part left (residual)." },
      units: { q: "What unit do dose, demand and residual share?", correct: "mg/L", wrong: ["kg/day", "mg"], why: "All three are concentrations in milligrams per litre." },
      subst: { q: "Which substitution is correct?", correct: sc, wrong: sw, why: why },
      result: { prompt: `Enter the exact ${ask} in mg/L.`, unitId: "mg-L", unitLabel: "mg/L", wrongUnits: [["kg-d", "kg/day"], ["mg", "mg"]], expected: ans, why }, check: calc };
  } },
];

// ---- task assembly -------------------------------------------------------------------------------
export function buildLadderTasks(firstNumber = 5) {
  const tasks: any[] = []; const seen = new Set<string>(); let n = firstNumber;
  FAMILIES.forEach((fam, fi) => {
    const r = rng(0x5eed + fi * 7919); let made = 0; let guard = 0;
    while (made < fam.count && guard++ < 4000) {
      let d: Draft; try { d = fam.make(r); } catch (e) { if ((e as Error).message === "retry") continue; throw e; }
      if (seen.has(d.prompt)) continue;
      if (Math.abs(Number(d.result.expected) - d.check) > 1e-9) throw new Error(`Independent check failed for ${d.prompt}`);
      seen.add(d.prompt); made++;
      const step = (id: string, s: Draft["formula"]) => {
        const labels = shuffle(r, [{ c: true, l: s.correct }, { c: false, l: s.wrong[0] }, { c: false, l: s.wrong[1] }]);
        const options = labels.map((x, i) => ({ id: `opt${i + 1}`, label: x.l }));
        return { id, prompt: s.q, options, correctOptionId: `opt${labels.findIndex(x => x.c) + 1}`, explanation: s.why };
      };
      const unitOptions = shuffle(r, [[d.result.unitId, d.result.unitLabel], ...d.result.wrongUnits]).map(([id, label]) => ({ id, label }));
      tasks.push({
        id: `oit-ladder${String(n).padStart(3, "0")}`, revision: "r1", mode: "calculation-ladder", prompt: d.prompt, topicId: d.topicId, level: "oit", assumptions: d.assumptions,
        choices: [step("formula", d.formula), step("units", d.units), step("substitution", d.subst)],
        result: { id: "result", prompt: d.result.prompt, unitOptions, expected: d.result.expected, expectedUnitId: d.result.unitId, absoluteTolerance: "0", explanation: d.result.why },
        _source: d.sourceId, _family: fam.id,
      });
      n++;
    }
    if (made < fam.count) throw new Error(`Family ${fam.id} produced only ${made}`);
  });
  return tasks;
}

if (process.argv[1] && process.argv[1].endsWith("ladderOit.ts")) {
  const out = process.argv[2]; const tasks = buildLadderTasks();
  if (!out) throw new Error("Usage: ladderOit.ts <out.json>");
  writeFileSync(out, JSON.stringify({ sources: NEW_SOURCES, tasks }, null, 1));
  const byFam: Record<string, number> = {}; for (const t of tasks) byFam[t._family] = (byFam[t._family] ?? 0) + 1;
  console.log("tasks:", tasks.length, JSON.stringify(byFam));
}
