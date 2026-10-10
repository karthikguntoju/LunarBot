import { describe, it, expect, beforeEach } from 'vitest';
import { generateLunarTerrain } from '../core/terrainGenerator';
import { NavigationGrid } from '../core/navigationGrid';
import { AStarPathfinder } from '../core/astar';
import { RockObstacle } from '../types/terrain';

describe('AStarPathfinder & NavigationGrid Engine', () => {
  let grid: NavigationGrid;

  beforeEach(() => {
    const terrain = generateLunarTerrain({
      gridSize: 40,
      worldSize: 80,
      seed: 42,
      maxElevation: 4,
      roughness: 0.5,
      craterCount: 3,
      rockCount: 8,
    });
    grid = new NavigationGrid(terrain);
  });

  it('1. Reaches destination on unobstructed terrain', () => {
    // Pick an unobstructed path in the terrain (e.g. y = 6 horizontal corridor)
    const start = { x: 5, y: 6 };
    const goal = { x: 15, y: 6 };

    const startCell = grid.getCell(start.x, start.y)!;
    const goalCell = grid.getCell(goal.x, goal.y)!;
    expect(startCell.isTraversable).toBe(true);
    expect(goalCell.isTraversable).toBe(true);

    const result = AStarPathfinder.findPath(start, goal, grid, 'shortest');
    expect(result.success).toBe(true);
    expect(result.waypoints.length).toBeGreaterThan(1);
    expect(result.waypoints[0].gridX).toBe(start.x);
    expect(result.waypoints[0].gridY).toBe(start.y);
    expect(result.waypoints[result.waypoints.length - 1].gridX).toBe(goal.x);
    expect(result.waypoints[result.waypoints.length - 1].gridY).toBe(goal.y);
  });

  it('2. Navigates around a static obstacle', () => {
    const start = { x: 10, y: 10 };
    const goal = { x: 10, y: 16 };

    // Place an obstacle in direct line of sight at (10, 13)
    const midCell = grid.getCell(10, 13)!;
    const obstacle: RockObstacle = {
      id: 'test-blocker',
      gridX: 10,
      gridY: 13,
      worldX: midCell.worldX,
      worldZ: midCell.worldZ,
      radius: 2.0,
      height: 2.0,
    };
    grid.addDynamicObstacle(obstacle);

    expect(grid.getCell(10, 13)!.isTraversable).toBe(false);

    const result = AStarPathfinder.findPath(start, goal, grid, 'safer');
    expect(result.success).toBe(true);

    // Verify none of the waypoints pass through the blocked obstacle cell
    for (const wp of result.waypoints) {
      expect(wp.gridX === 10 && wp.gridY === 13).toBe(false);
    }
  });

  it('3. Respects boundary cells as impassable', () => {
    const start = { x: 5, y: 5 };
    const boundaryGoal = { x: 0, y: 5 }; // Grid boundary is blocked

    const result = AStarPathfinder.findPath(start, boundaryGoal, grid, 'shortest');
    expect(result.success).toBe(false);
    expect(result.failureReason).toContain('blocked');
  });

  it('4. Dynamic obstacle triggers route replanning', () => {
    const start = { x: 12, y: 12 };
    const goal = { x: 20, y: 12 };

    // 1. Initial route
    const initialRoute = AStarPathfinder.findPath(start, goal, grid, 'balanced');
    expect(initialRoute.success).toBe(true);

    // Pick a midpoint along the initial route
    const midWp = initialRoute.waypoints[Math.floor(initialRoute.waypoints.length / 2)];

    // 2. Drop dynamic rock obstacle directly on that waypoint
    const dynRock: RockObstacle = {
      id: 'dynamic-rockfall',
      gridX: midWp.gridX,
      gridY: midWp.gridY,
      worldX: midWp.worldX,
      worldZ: midWp.worldZ,
      radius: 2.2,
      height: 2.0,
      isDynamic: true,
    };
    grid.addDynamicObstacle(dynRock);

    // 3. Recalculate route
    const replannedRoute = AStarPathfinder.findPath(start, goal, grid, 'balanced');
    expect(replannedRoute.success).toBe(true);

    // The new route must NOT pass through the newly blocked cell
    const containsBlockedPoint = replannedRoute.waypoints.some(
      (wp) => wp.gridX === midWp.gridX && wp.gridY === midWp.gridY
    );
    expect(containsBlockedPoint).toBe(false);
  });

  it('5. Compares shortest vs safer path strategies', () => {
    const start = { x: 10, y: 10 };
    const goal = { x: 25, y: 25 };

    const comparison = AStarPathfinder.compareStrategies(start, goal, grid);
    expect(comparison.shortest.success).toBe(true);
    expect(comparison.safer.success).toBe(true);

    // Safer path average risk should be less than or equal to shortest path average risk
    expect(comparison.safer.averageRisk).toBeLessThanOrEqual(comparison.shortest.averageRisk);
  });
});
