import { GridCoord, WorldCoord, PathStrategy } from './navigation';

export type MissionStatus =
  | 'idle'
  | 'planning'
  | 'navigating'
  | 'replanning'
  | 'obstacle_detected'
  | 'exploring'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type MissionMode = 'target_navigation' | 'autonomous_exploration' | 'scenario_test';

export type EventSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface MissionEvent {
  id: string;
  timestamp: number;
  timeString: string;
  severity: EventSeverity;
  type:
    | 'mission_init'
    | 'target_selected'
    | 'route_calculated'
    | 'movement_started'
    | 'movement_paused'
    | 'movement_resumed'
    | 'hazard_detected'
    | 'route_replanned'
    | 'poi_discovered'
    | 'battery_warning'
    | 'battery_critical'
    | 'mission_completed'
    | 'mission_failed'
    | 'mission_cancelled'
    | 'frontier_selected';
  title: string;
  details: string;
  position?: WorldCoord;
  gridCoord?: GridCoord;
}

export interface MissionReport {
  missionId: string;
  mode: MissionMode;
  strategy: PathStrategy;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  startPos: WorldCoord;
  destinationPos?: WorldCoord;
  status: MissionStatus;
  statusMessage: string;
  distanceTraveledMeters: number;
  estimatedEnergyWh: number;
  initialBatteryPercent: number;
  finalBatteryPercent: number;
  hazardsEncountered: number;
  replanCount: number;
  explorationCoveragePercent: number;
  scientificPOIsVisited: string[];
  totalScientificScore: number;
  averageSpeedMps: number;
  peakSlopeTraversedDeg: number;
}
