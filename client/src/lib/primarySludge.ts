/** mg/L = 0.001 kg/m³. Solids fraction is a mass fraction, not a percent number. */
export function primarySludgeVolume(flowM3PerDay: number, removedMgPerL: number, densityKgPerM3: number, solidsFraction: number): number {
  if (![flowM3PerDay, removedMgPerL, densityKgPerM3, solidsFraction].every(Number.isFinite)
    || flowM3PerDay < 0 || removedMgPerL < 0 || densityKgPerM3 <= 0 || solidsFraction <= 0 || solidsFraction > 1) {
    throw new RangeError("Use non-negative flow and concentration, positive density, and a solids mass fraction in (0, 1].");
  }
  return flowM3PerDay * removedMgPerL * 0.001 / (densityKgPerM3 * solidsFraction);
}
const input = { flow: 5000, removed: 150, density: 1000, fraction: 0.04 } as const;
const drySolidsKgPerDay = input.flow * input.removed * 0.001;
const sludgeSolidsKgPerM3 = input.density * input.fraction;
export const PRIMARY_SLUDGE_FORMULA = {
  name: "Sludge Volume (Primary)",
  formula: "Sludge Volume (m³/d) = [Q × SS_removed × 10⁻³] ÷ [ρ_sludge × solids fraction]",
  units: "m³/d",
  variables: [
    { sym: "Q", desc: "Flow rate (m³/d)" },
    { sym: "SS_removed", desc: "Suspended solids removed (mg/L)" },
    { sym: "10⁻³", desc: "Converts mg/L to kg/m³: 1 mg/L = 0.001 kg/m³" },
    { sym: "ρ_sludge", desc: "Sludge density (≈ 1,000 kg/m³ for dilute sludge)" },
    { sym: "solids fraction", desc: "Sludge solids mass fraction (decimal, e.g. 0.04 for 4%)" },
  ],
  example: {
    problem: "Q = 5,000 m³/d, SS removed = 150 mg/L, sludge density = 1,000 kg/m³ and sludge is 4% solids by mass. What volume of sludge is produced?",
    solution: `Dry solids = 5,000 m³/d × 150 mg/L × 0.001 = ${drySolidsKgPerDay} kg/d; sludge solids = 1,000 kg/m³ × 0.04 = ${sludgeSolidsKgPerM3} kg/m³; volume = ${drySolidsKgPerDay} kg/d ÷ ${sludgeSolidsKgPerM3} kg/m³`,
    answer: `${primarySludgeVolume(input.flow, input.removed, input.density, input.fraction)} m³/d`,
  },
  tip: "Primary sludge is typically 3–8% solids. Raw primary sludge has high putrescibility: pump frequently.",
};
