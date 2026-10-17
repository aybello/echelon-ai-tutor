import { describe, expect, it } from "vitest";
import { calculateAlum, calculateLime, calculateFluoride, calculatePolymer } from "./chemicalFeedCalculation";
import { calculateRpd, calculateSpikeRecovery, calculateDilution, calculateBod } from "./labCalculation";

describe("public chemical calculations preserve formulas and reject hidden defaults", () => {
  it.each(["", " ", "0", "-1", "101", "Infinity", "NaN", "12bad"])("rejects invalid concentration %s", concentration => {
    expect(calculateAlum({ flow: "10000", dose: "30", concentration })).toBeNull();
    expect(calculatePolymer({ flow: "10000", dose: "0.5", stockConcentration: concentration })).toBeNull();
    expect(calculateLime({ flow: "10000", currentAlkalinity: "80", targetAlkalinity: "100", purity: concentration })).toBeNull();
  });
  it("retains established defaults and fixed alkalinity target", () => {
    expect(calculateAlum({ flow: "10000", dose: "30", concentration: "48" })?.massNeededKgDay).toBe(300);
    expect(calculatePolymer({ flow: "10000", dose: "0.5", stockConcentration: "0.5" })?.stockVolumeLDay).toBe(1000);
    expect(calculateLime({ flow: "10000", currentAlkalinity: "80", targetAlkalinity: "100", purity: "90" })?.limeMassKgDay).toBeCloseTo(164.44444);
    expect(calculateFluoride({ flow: "10000", existing: "0.1", target: "0.7", concentration: 0.23, density: 1.22 })?.massFKgDay).toBe(6);
  });
  it("rejects overflow rather than emitting Infinity", () => {
    expect(calculatePolymer({ flow: "1e308", dose: "1e308", stockConcentration: "0.5" })).toBeNull();
  });
});
describe("lab validity precedes classification", () => {
  it.each(["", "-1", "Infinity", "3bad"])("rejects invalid measurement %s", value => {
    expect(calculateRpd({ sample: value, duplicate: "13.1" })).toBeNull();
    expect(calculateBod({ initialDo: value, finalDo: "3.2", dilutionFactor: "20" })).toBeNull();
  });
  it("rejects zero denominators and physically invalid DO/dilution", () => {
    expect(calculateRpd({ sample: "0", duplicate: "0" })).toBeNull();
    expect(calculateSpikeRecovery({ unspiked: "10", spiked: "15", added: "0" })).toBeNull();
    expect(calculateDilution({ initialConcentration: "100", initialVolume: "10", finalVolume: "0" })).toBeNull();
    expect(calculateDilution({ initialConcentration: "100", initialVolume: "10", finalVolume: "5" })).toBeNull();
    expect(calculateBod({ initialDo: "8.5", finalDo: "9", dilutionFactor: "20" })).toBeNull();
    expect(calculateBod({ initialDo: "8.5", finalDo: "3.2", dilutionFactor: "0.5" })).toBeNull();
  });
  it("retains ordinary results and permits genuine zero BOD", () => {
    expect(calculateRpd({ sample: "12.5", duplicate: "13.1" })?.passes).toBe(true);
    expect(calculateSpikeRecovery({ unspiked: "10.2", spiked: "14.8", added: "5" })?.percent).toBeCloseTo(92);
    expect(calculateDilution({ initialConcentration: "100", initialVolume: "10", finalVolume: "100" })?.finalConcentration).toBe(10);
    expect(calculateBod({ initialDo: "8.5", finalDo: "3.2", dilutionFactor: "20" })?.mgL).toBe(106);
    expect(calculateBod({ initialDo: "8.5", finalDo: "8.5", dilutionFactor: "1" })?.mgL).toBe(0);
  });
});
