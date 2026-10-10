import { GridCoord, WorldCoord } from './navigation';

export interface RoverState {
  worldPos: WorldCoord;
  gridPos: GridCoord;
  heading: number; // yaw angle in radians
  pitch: number;   // slope pitch in radians
  roll: number;    // cross-slope roll in radians
  speed: number;   // current instantaneous speed in units/sec
  targetSpeed: number;
  wheelRotation: number;
  mastAngle: number;
  isMoving: boolean;
  statusText: string;
}

export interface TelemetryData {
  timestamp: number;
  position: WorldCoord;
  gridCoord: GridCoord;
  headingDeg: number;
  pitchDeg: number;
  rollDeg: number;
  speed: number; // m/s
  batteryPercent: number; // 0 to 100
  totalDistanceTraveled: number; // meters
  estimatedEnergyConsumedWh: number; // Wh
  currentWaypointIdx: number;
  totalWaypoints: number;
  remainingDistance: number;
  hazardDetectionsCount: number;
  replanEventsCount: number;
  sciencePOIsVisited: number;
  explorationCoveragePercent: number;
  isBatteryLow: boolean;
  isBatteryCritical: boolean;
}

export interface RoverConfig {
  maxSpeed: number; // max movement speed
  turnRate: number; // radians per second
  wheelDiameter: number;
  batteryCapacityWh: number; // total capacity in Wh
  idlePowerW: number;
  baseMovementConsumptionWhPerMeter: number;
  slopeCostMultiplier: number;
  lowBatteryThreshold: number; // percent e.g. 25%
  criticalBatteryThreshold: number; // percent e.g. 10%
}
