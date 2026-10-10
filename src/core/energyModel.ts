import { RoverConfig } from '../types/rover';
import { Waypoint } from '../types/navigation';

export const DEFAULT_ROVER_CONFIG: RoverConfig = {
  maxSpeed: 4.0, // world units per second (approx 4 m/s in simulation scale)
  turnRate: 1.8, // radians/sec
  wheelDiameter: 0.5,
  batteryCapacityWh: 1200, // 1200 Wh battery pack
  idlePowerW: 40.0, // 40W baseline computer/radio/sensor draw
  baseMovementConsumptionWhPerMeter: 0.35, // 0.35 Wh per meter flat terrain
  slopeCostMultiplier: 2.2, // slope resistance coefficient
  lowBatteryThreshold: 25.0, // warn at 25%
  criticalBatteryThreshold: 10.0, // abort/halt at 10%
};

export class EnergyModel {
  private config: RoverConfig;
  private currentEnergyWh: number;
  private totalEnergyConsumedWh: number = 0;

  constructor(config: RoverConfig = DEFAULT_ROVER_CONFIG, initialPercent: number = 100.0) {
    this.config = config;
    this.currentEnergyWh = (this.config.batteryCapacityWh * Math.max(0, Math.min(100, initialPercent))) / 100;
  }

  public reset(batteryPercent: number = 100.0): void {
    this.currentEnergyWh = (this.config.batteryCapacityWh * Math.max(0, Math.min(100, batteryPercent))) / 100;
    this.totalEnergyConsumedWh = 0;
  }

  // Update battery draw during simulation tick
  public step(
    deltaTimeSeconds: number,
    distanceMovedMeters: number,
    slopeAngleDeg: number,
    isTurning: boolean
  ): {
    consumedWh: number;
    remainingPercent: number;
    isLowBattery: boolean;
    isCriticalBattery: boolean;
  } {
    // 1. Avionics idle draw
    const idleDrawWh = (this.config.idlePowerW * deltaTimeSeconds) / 3600;

    // 2. Drive motor power
    // Uphill grade adds load, downhill slightly reduces load (with minimum rolling resistance)
    const slopeRad = (slopeAngleDeg * Math.PI) / 180;
    const slopeFactor = 1.0 + Math.max(-0.4, Math.sin(slopeRad) * this.config.slopeCostMultiplier);

    // Turn maneuvering penalty
    const turnFactor = isTurning ? 1.25 : 1.0;

    const driveEnergyWh =
      distanceMovedMeters * this.config.baseMovementConsumptionWhPerMeter * slopeFactor * turnFactor;

    const totalStepConsumedWh = idleDrawWh + driveEnergyWh;

    this.currentEnergyWh = Math.max(0, this.currentEnergyWh - totalStepConsumedWh);
    this.totalEnergyConsumedWh += totalStepConsumedWh;

    const remainingPercent = this.getBatteryPercent();
    const isLowBattery = remainingPercent <= this.config.lowBatteryThreshold && remainingPercent > this.config.criticalBatteryThreshold;
    const isCriticalBattery = remainingPercent <= this.config.criticalBatteryThreshold;

    return {
      consumedWh: totalStepConsumedWh,
      remainingPercent,
      isLowBattery,
      isCriticalBattery,
    };
  }

  public getBatteryPercent(): number {
    return Math.round((this.currentEnergyWh / this.config.batteryCapacityWh) * 1000) / 10;
  }

  public getEnergyConsumedWh(): number {
    return Math.round(this.totalEnergyConsumedWh * 10) / 10;
  }

  public canContinueOperation(): boolean {
    return this.getBatteryPercent() > this.config.criticalBatteryThreshold;
  }

  // Estimate total energy to traverse a planned list of waypoints
  public static estimatePathEnergy(waypoints: Waypoint[], config: RoverConfig = DEFAULT_ROVER_CONFIG): number {
    let totalWh = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      const dx = curr.worldX - prev.worldX;
      const dy = curr.worldY - prev.worldY;
      const dz = curr.worldZ - prev.worldZ;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const slopeRad = Math.atan2(Math.abs(dy), Math.hypot(dx, dz));
      const slopeFactor = 1.0 + Math.sin(slopeRad) * config.slopeCostMultiplier;

      const driveWh = dist * config.baseMovementConsumptionWhPerMeter * slopeFactor;
      const nominalTravelTimeSec = dist / (config.maxSpeed * 0.7);
      const idleWh = (config.idlePowerW * nominalTravelTimeSec) / 3600;

      totalWh += driveWh + idleWh;
    }
    return Math.round(totalWh * 10) / 10;
  }
}
