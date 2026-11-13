function finiteInput(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function calculateRpd(input: { sample: string; duplicate: string }) {
  const sample = finiteInput(input.sample);
  const duplicate = finiteInput(input.duplicate);
  if (sample === null || duplicate === null || sample < 0 || duplicate < 0) return null;
  const average = sample / 2 + duplicate / 2;
  if (average <= 0) return null;
  const percent = Math.abs(sample - duplicate) / average * 100;
  return Number.isFinite(percent) ? { percent, passes: percent <= 20 } : null;
}

export function calculateSpikeRecovery(input: { unspiked: string; spiked: string; added: string }) {
  const unspiked = finiteInput(input.unspiked);
  const spiked = finiteInput(input.spiked);
  const added = finiteInput(input.added);
  if (unspiked === null || spiked === null || added === null || unspiked < 0 || spiked < 0 || added <= 0) return null;
  const percent = (spiked - unspiked) / added * 100;
  return Number.isFinite(percent) ? { percent, passes: percent >= 70 && percent <= 130 } : null;
}

export function calculateDilution(input: { initialConcentration: string; initialVolume: string; finalVolume: string }) {
  const initialConcentration = finiteInput(input.initialConcentration);
  const initialVolume = finiteInput(input.initialVolume);
  const finalVolume = finiteInput(input.finalVolume);
  if (initialConcentration === null || initialVolume === null || finalVolume === null
    || initialConcentration < 0 || initialVolume <= 0 || finalVolume < initialVolume) return null;
  const finalConcentration = initialConcentration * initialVolume / finalVolume;
  return Number.isFinite(finalConcentration) ? { finalConcentration } : null;
}

export function calculateBod(input: { initialDo: string; finalDo: string; dilutionFactor: string }) {
  const initialDo = finiteInput(input.initialDo);
  const finalDo = finiteInput(input.finalDo);
  const dilutionFactor = finiteInput(input.dilutionFactor);
  if (initialDo === null || finalDo === null || dilutionFactor === null
    || initialDo < 0 || finalDo < 0 || finalDo > initialDo || dilutionFactor < 1) return null;
  const mgL = (initialDo - finalDo) * dilutionFactor;
  return Number.isFinite(mgL) ? { mgL } : null;
}
