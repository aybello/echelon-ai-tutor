export type ChlorineForm = "gas" | "liquid" | "granular";

// Existing educational assumptions: liquid concentration is a mass fraction,
// not g/L. Density × mass fraction = kg available Cl₂ per litre of solution.
export const HYPOCHLORITE_DENSITY_KG_L = 1.2;
const GAS_PURITY = 0.995;
const LIQUID_PURITY = 0.125;
const MINUTES_PER_DAY = 1440;

/** Format finite educational results without multiplying large values to round. */
export function formatChlorineValue(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "N/A";
  const magnitude = Math.abs(value);
  if (magnitude >= 1e12 || (magnitude > 0 && magnitude < 10 ** -digits)) {
    return value.toExponential(digits);
  }
  return Number(value.toFixed(digits)).toString();
}

export function calculateChlorine(input: {
  flow: string;
  dose: string;
  granularPurity: string;
  form: ChlorineForm;
}) {
  const flow = Number(input.flow);
  const dose = Number(input.dose);
  const purity = input.form === "gas" ? GAS_PURITY
    : input.form === "liquid" ? LIQUID_PURITY
    : Number(input.granularPurity) / 100;
  if (![flow, dose, purity].every(value => Number.isFinite(value) && value > 0) || purity > 1) {
    return null;
  }

  // m³/day × (1000 L/m³) × mg/L ÷ (1,000,000 mg/kg).
  const activeMassKgDay = (flow / 1000) * dose;
  const activeMassGDay = activeMassKgDay * 1000;
  const productMassKgDay = activeMassKgDay / purity;
  const liquidVolumeLDay = input.form === "liquid"
    ? productMassKgDay / HYPOCHLORITE_DENSITY_KG_L : null;
  const productFeedGMin = productMassKgDay * (1000 / MINUTES_PER_DAY);
  const liquidFeedMlMin = liquidVolumeLDay === null
    ? null : liquidVolumeLDay * (1000 / MINUTES_PER_DAY);
  // Do not render usable-looking Infinity/NaN or underflowed zero outputs.
  if (![activeMassKgDay, activeMassGDay, productMassKgDay, productFeedGMin,
    ...(liquidVolumeLDay === null ? [] : [liquidVolumeLDay, liquidFeedMlMin!])]
    .every(value => Number.isFinite(value) && value > 0)) return null;

  return { purity, activeMassKgDay, activeMassGDay, productMassKgDay,
    liquidVolumeLDay, productFeedGMin, liquidFeedMlMin };
}
