import { GridCoord, WorldCoord } from './navigation';

export interface Crater {
  id: string;
  gridX: number;
  gridY: number;
  worldX: number;
  worldZ: number;
  radius: number; // in world units
  depth: number;
  rimHeight: number;
}

export interface RockObstacle {
  id: string;
  gridX: number;
  gridY: number;
  worldX: number;
  worldZ: number;
  radius: number;
  height: number;
  isDynamic?: boolean;
}

export type POICategory = 'minerals' | 'ice_deposit' | 'ancient_regolith' | 'volcanic_glass' | 'structural_ridge';

export interface ScientificPOI {
  id: string;
  name: string;
  category: POICategory;
  description: string;
  grid: GridCoord;
  world: WorldCoord;
  scientificValue: number; // 10 to 100
  visited: boolean;
  discoveredAt?: number;
}

export interface TerrainConfig {
  gridSize: number; // e.g. 50x50 cells
  worldSize: number; // e.g. 100x100 world units
  seed: number;
  maxElevation: number;
  roughness: number;
  craterCount: number;
  rockCount: number;
}
