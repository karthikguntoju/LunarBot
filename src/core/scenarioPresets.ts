import { GridCoord, PathStrategy } from '../types/navigation';
import { MissionMode } from '../types/mission';

export interface ScenarioPreset {
  id: string;
  name: string;
  category: 'navigation' | 'hazard' | 'energy' | 'exploration' | 'system';
  description: string;
  expectedResult: string;
  mode: MissionMode;
  startGrid: GridCoord;
  targetGrid?: GridCoord;
  strategy: PathStrategy;
  initialBattery: number;
  insertObstacleOnStart?: {
    gridX: number;
    gridY: number;
    radius: number;
  };
  triggerDynamicObstacleMidway?: boolean;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'scenario-1-unobstructed',
    name: '1. Unobstructed Terrain Navigation',
    category: 'navigation',
    description: 'Direct traverse across flat lunar mare regolith with zero obstacle intersections.',
    expectedResult: 'Rover plans direct route, moves steadily at nominal speed, and completes mission successfully.',
    mode: 'target_navigation',
    startGrid: { x: 10, y: 10 },
    targetGrid: { x: 10, y: 25 },
    strategy: 'shortest',
    initialBattery: 100,
  },
  {
    id: 'scenario-2-static-obstacle',
    name: '2. Static Boulder Detour',
    category: 'hazard',
    description: 'Target is situated directly behind a high boulder field requiring lateral circumnavigation.',
    expectedResult: 'A* detects the boulder obstacle, routes safely around its buffer zone, and arrives without collision.',
    mode: 'target_navigation',
    startGrid: { x: 12, y: 12 },
    targetGrid: { x: 26, y: 26 },
    strategy: 'safer',
    initialBattery: 100,
  },
  {
    id: 'scenario-3-hazardous-slope',
    name: '3. Steep Crater Rim Avoidance',
    category: 'hazard',
    description: 'Path intersects a steep crater rim slope (>25°). Safer strategy must detour around rim ridge.',
    expectedResult: 'Pathfinder heavily penalizes the steep slope and calculates a smooth circumventing path along safe flats.',
    mode: 'target_navigation',
    startGrid: { x: 15, y: 35 },
    targetGrid: { x: 38, y: 35 },
    strategy: 'safer',
    initialBattery: 100,
  },
  {
    id: 'scenario-4-dynamic-replanning',
    name: '4. Dynamic Obstacle Interception & Replanning',
    category: 'hazard',
    description: 'An operator introduces a rockfall directly in the planned trajectory midway through execution.',
    expectedResult: 'Rover immediately halts, marks cell blocked, recomputes alternative A* route, logs replan event, and resumes.',
    mode: 'target_navigation',
    startGrid: { x: 10, y: 15 },
    targetGrid: { x: 35, y: 15 },
    strategy: 'balanced',
    initialBattery: 100,
    triggerDynamicObstacleMidway: true,
  },
  {
    id: 'scenario-5-no-route-exists',
    name: '5. Trap / Dead-End (No Valid Route)',
    category: 'hazard',
    description: 'Target is artificially enclosed by impassable terrain walls and boulders.',
    expectedResult: 'Pathfinder exhausts search space, halts mission, and reports meaningful failure explanation.',
    mode: 'target_navigation',
    startGrid: { x: 12, y: 12 },
    targetGrid: { x: 2, y: 2 },
    strategy: 'safer',
    initialBattery: 100,
  },
  {
    id: 'scenario-6-unreachable-destination',
    name: '6. Destination Inside Blocked Crater Core',
    category: 'hazard',
    description: 'Operator attempts to select a destination point inside an impassable deep crater pit.',
    expectedResult: 'System instantly rejects the target as impassable and informs operator with specific hazard type.',
    mode: 'target_navigation',
    startGrid: { x: 10, y: 10 },
    targetGrid: { x: 0, y: 0 }, // Out-of-bounds boundary cell
    strategy: 'shortest',
    initialBattery: 100,
  },
  {
    id: 'scenario-7-energy-consumption',
    name: '7. Long-Range Incline & Energy Draw',
    category: 'energy',
    description: 'Extended traverse across undulating terrain monitoring speed, slope load, and battery depletion.',
    expectedResult: 'Telemetry verifies energy consumption scales with distance traveled and slope incline gradient.',
    mode: 'target_navigation',
    startGrid: { x: 8, y: 8 },
    targetGrid: { x: 42, y: 42 },
    strategy: 'balanced',
    initialBattery: 45, // Starts at 45% to demonstrate battery reserve alert
  },
  {
    id: 'scenario-8-frontier-exploration',
    name: '8. Frontier-Based Autonomous Exploration',
    category: 'exploration',
    description: 'Rover autonomously identifies reachable unexplored frontiers and sweeps the lunar quadrant.',
    expectedResult: 'Rover iteratively selects frontier clusters, increases exploration coverage %, and marks cells explored.',
    mode: 'autonomous_exploration',
    startGrid: { x: 25, y: 25 },
    strategy: 'balanced',
    initialBattery: 100,
  },
  {
    id: 'scenario-9-telemetry-accuracy',
    name: '9. Mission Statistics & Science Discovery',
    category: 'system',
    description: 'Traverse passing near a Scientific Point of Interest (Pyroclastic Glass / Ice Deposit).',
    expectedResult: 'Scientific discovery event recorded in log, science score incremented, and analytics report generated.',
    mode: 'target_navigation',
    startGrid: { x: 20, y: 20 },
    targetGrid: { x: 38, y: 14 },
    strategy: 'balanced',
    initialBattery: 100,
  },
  {
    id: 'scenario-10-clean-reset',
    name: '10. Reproducible Simulation State Reset',
    category: 'system',
    description: 'Verifies deterministic seed regeneration and complete restoration of rover position and log states.',
    expectedResult: 'Restores initial landing coordinates, resets battery to 100%, and clears active dynamic obstacles.',
    mode: 'target_navigation',
    startGrid: { x: 10, y: 10 },
    targetGrid: { x: 20, y: 20 },
    strategy: 'balanced',
    initialBattery: 100,
  },
];
