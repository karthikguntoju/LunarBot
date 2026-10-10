import { describe, it, expect, beforeEach } from 'vitest';
import { generateLunarTerrain } from '../core/terrainGenerator';
import { NavigationGrid } from '../core/navigationGrid';
import { FrontierExplorer } from '../core/exploration';

describe('FrontierExplorer & Autonomous Coverage Engine', () => {
  let grid: NavigationGrid;

  beforeEach(() => {
    const terrain = generateLunarTerrain({
      gridSize: 30,
      worldSize: 60,
      seed: 99,
      maxElevation: 3,
      roughness: 0.4,
      craterCount: 2,
      rockCount: 6,
    });
    grid = new NavigationGrid(terrain);
  });

  it('1. Updates exploration coverage and marks cells as explored', () => {
    expect(grid.getExplorationCoveragePercent()).toBe(0);

    const newlyExplored = grid.markExplored(15, 15, 3);
    expect(newlyExplored).toBeGreaterThan(0);
    expect(grid.getExplorationCoveragePercent()).toBeGreaterThan(0);
  });

  it('2. Identifies frontier cells at the boundary of explored area', () => {
    grid.markExplored(15, 15, 2);
    const frontiers = grid.getFrontierCells();

    expect(frontiers.length).toBeGreaterThan(0);
    for (const f of frontiers) {
      expect(f.isExplored).toBe(true);
      expect(f.isTraversable).toBe(true);
      expect(f.isFrontier).toBe(true);
    }
  });

  it('3. Selects reachable frontier target', () => {
    grid.markExplored(10, 10, 3);

    const bestTarget = FrontierExplorer.selectBestFrontierTarget({ x: 10, y: 10 }, grid);
    expect(bestTarget).not.toBeNull();
    if (bestTarget) {
      expect(bestTarget.path.success).toBe(true);
      expect(bestTarget.target).toBeDefined();
    }
  });
});
