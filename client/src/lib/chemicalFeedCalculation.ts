export const ALUM_DENSITY_KG_L = 1.33;
export const LIME_CAO_EQUIVALENCE = 0.74;
export const MINUTES_PER_DAY = 1440;

function finiteInput(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasFiniteValues(values: number[]) {
  return values.every(Number.isFinite);
}

export function calculateAlum(input: { flow: string; dose: string; concentration: string }) {
  const flow = finiteInput(input.flow);
  const dose = finiteInput(input.dose);
  const concentrationPercent = finiteInput(input.concentration);
  if (flow === null || dose === null || concentrationPercent === null
    || flow <= 0 || dose <= 0 || concentrationPercent <= 0 || concentrationPercent > 100) return null;

  // m³/day × 1,000 L/m³ × mg/L ÷ 1,000,000 mg/kg.
  const massNeededKgDay = (flow * dose) / 1000;
  const concentration = concentrationPercent / 100;
  const volumeNeededLDay = massNeededKgDay / (ALUM_DENSITY_KG_L * concentration);
  const feedRateMlMin = (volumeNeededLDay * 1000) / MINUTES_PER_DAY;
  const alkalinityConsumedMgL = dose * 0.5;
  const sludgeKgDay = massNeededKgDay * 0.44;
  if (!hasFiniteValues([massNeededKgDay, volumeNeededLDay, feedRateMlMin, alkalinityConsumedMgL, sludgeKgDay])) return null;

  return { massNeededKgDay, volumeNeededLDay, feedRateMlMin, alkalinityConsumedMgL, sludgeKgDay };
}

export function calculateLime(input: {
  flow: string;
  currentAlkalinity: string;
  targetAlkalinity: string;
  purity: string;
}) {
  const flow = finiteInput(input.flow);
  const currentAlkalinity = finiteInput(input.currentAlkalinity);
  const targetAlkalinity = finiteInput(input.targetAlkalinity);
  const purityPercent = finiteInput(input.purity);
  if (flow === null || currentAlkalinity === null || targetAlkalinity === null || purityPercent === null
    || flow <= 0 || currentAlkalinity < 0 || targetAlkalinity <= 0 || purityPercent <= 0 || purityPercent > 100) return null;

  const purity = purityPercent / 100;
  const alkalinityDeficitMgL = Math.max(0, targetAlkalinity - currentAlkalinity);
  const limeDoseMgL = alkalinityDeficitMgL * LIME_CAO_EQUIVALENCE / purity;
  const limeMassKgDay = (flow * limeDoseMgL) / 1000;
  const feedRateGMin = (limeMassKgDay * 1000) / MINUTES_PER_DAY;
  if (!hasFiniteValues([alkalinityDeficitMgL, limeDoseMgL, limeMassKgDay, feedRateGMin])) return null;

  return { alkalinityDeficitMgL, limeDoseMgL, limeMassKgDay, feedRateGMin };
}

export function calculateFluoride(input: {
  flow: string;
  existing: string;
  target: string;
  concentration: number;
  density: number;
}) {
  const flow = finiteInput(input.flow);
  const existing = finiteInput(input.existing);
  const target = finiteInput(input.target);
  if (flow === null || existing === null || target === null
    || flow <= 0 || existing < 0 || target <= 0 || !hasFiniteValues([input.concentration, input.density])
    || input.concentration <= 0 || input.density <= 0) return null;

  const doseMgL = Math.max(0, target - existing);
  const massFKgDay = (flow * doseMgL) / 1000;
  const productAmountDay = massFKgDay / (input.concentration * input.density);
  const feedRateMlMin = (productAmountDay * 1000) / MINUTES_PER_DAY;
  if (!hasFiniteValues([doseMgL, massFKgDay, productAmountDay, feedRateMlMin])) return null;

  return { doseMgL, massFKgDay, productAmountDay, feedRateMlMin };
}

export function calculatePolymer(input: { flow: string; dose: string; stockConcentration: string }) {
  const flow = finiteInput(input.flow);
  const dose = finiteInput(input.dose);
  const stockConcentrationPercent = finiteInput(input.stockConcentration);
  if (flow === null || dose === null || stockConcentrationPercent === null
    || flow <= 0 || dose <= 0 || stockConcentrationPercent <= 0 || stockConcentrationPercent > 100) return null;

  const massNeededGDay = flow * dose;
  const massNeededKgDay = massNeededGDay / 1000;
  const stockConcentration = stockConcentrationPercent / 100;
  const stockVolumeLDay = massNeededKgDay / stockConcentration;
  const feedRateMlMin = (stockVolumeLDay * 1000) / MINUTES_PER_DAY;
  if (!hasFiniteValues([massNeededGDay, massNeededKgDay, stockVolumeLDay, feedRateMlMin])) return null;

  return { massNeededGDay, massNeededKgDay, stockVolumeLDay, feedRateMlMin };
}
