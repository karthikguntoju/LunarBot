export type RiskLevel = 'safe' | 'moderate' | 'high' | 'blocked';

export type PathStrategy = 'shortest' | 'safer' | 'balanced';

export interface GridCoord {
  x: number; // grid column (0 to width - 1)
  y: number; // grid row (0 to height - 1)
}

export interface WorldCoord {
  x: number; // 3D world x
  y: number; // 3D world y (elevation / height)
  z: number; // 3D world z
}

export interface GridCell {
  gridX: number;
  gridY: number;
  worldX: number;
  worldY: number; // elevation
  worldZ: number;
  elevation: number;
  slope: number; // slope in degrees (0 - 90)
  riskLevel: RiskLevel;
  riskCost: number; // calculated cost factor (e.g. 1.0 for safe, up to infinity for blocked)
  isObstacle: boolean;
  obstacleType?: 'crater' | 'rock' | 'slope' | 'boundary' | 'dynamic';
  isTraversable: boolean;
  isExplored: boolean;
  isFrontier?: boolean;
}

export interface Waypoint {
  gridX: number;
  gridY: number;
  worldX: number;
  worldY: number;
  worldZ: number;
  riskLevel: RiskLevel;
  cumulativeDistance: number;
  estimatedEnergy: number;
}

export interface PathResult {
  success: boolean;
  waypoints: Waypoint[];
  totalDistance: number;
  averageRisk: number;
  maxSlope: number;
  estimatedEnergy: number;
  visitedNodesCount: number;
  executionTimeMs: number;
  failureReason?: string;
}

export interface PathComparison {
  shortest: PathResult | null;
  safer: PathResult | null;
  balanced: PathResult | null;
}
