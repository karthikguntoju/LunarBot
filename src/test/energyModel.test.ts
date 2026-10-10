import { describe, it, expect } from 'vitest';
import { EnergyModel, DEFAULT_ROVER_CONFIG } from '../core/energyModel';

describe('Rover Energy & Incline Consumption Model', () => {
  it('1. Depletes battery with distance traveled', () => {
    const model = new EnergyModel(DEFAULT_ROVER_CONFIG, 100);
    expect(model.getBatteryPercent()).toBe(100);

    const stepResult = model.step(1.0, 5.0, 0, false);
    expect(stepResult.remainingPercent).toBeLessThan(100);
    expect(stepResult.consumedWh).toBeGreaterThan(0);
    expect(model.getEnergyConsumedWh()).toBeGreaterThan(0);
  });

  it('2. Climbing slope increases energy consumption compared to flat traverse', () => {
    const flatModel = new EnergyModel(DEFAULT_ROVER_CONFIG, 100);
    const uphillModel = new EnergyModel(DEFAULT_ROVER_CONFIG, 100);

    const flatResult = flatModel.step(2.0, 10.0, 0, false);
    const uphillResult = uphillModel.step(2.0, 10.0, 20, false); // 20-degree incline

    expect(uphillResult.consumedWh).toBeGreaterThan(flatResult.consumedWh);
  });

  it('3. Detects low battery and critical battery thresholds', () => {
    const model = new EnergyModel(DEFAULT_ROVER_CONFIG, 26);
    expect(model.getBatteryPercent()).toBe(26);

    // Consume just enough to drop below 25%
    const step1 = model.step(10.0, 50.0, 10, false);
    expect(step1.isLowBattery).toBe(true);
    expect(step1.isCriticalBattery).toBe(false);

    // Drain down below 10%
    const criticalModel = new EnergyModel(DEFAULT_ROVER_CONFIG, 9);
    expect(criticalModel.canContinueOperation()).toBe(false);
  });
});
