import { GridCoord, PathResult, PathStrategy, Waypoint } from '../types/navigation';
import { NavigationGrid } from './navigationGrid';

interface AStarNode {
  gx: number;
  gy: number;
  gCost: number; // exact cost from start
  hCost: number; // heuristic estimated cost to target
  fCost: number; // g + h
  parent: AStarNode | null;
  distanceTraveled: number;
  cumulativeEnergy: number;
}

// Simple Priority Queue for A*
class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];

  enqueue(item: T, priority: number): void {
    let inserted = false;
    for (let i = 0; i < this.items.length; i++) {
      if (priority < this.items[i].priority) {
        this.items.splice(i, 0, { item, priority });
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      this.items.push({ item, priority });
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

export class AStarPathfinder {
  public static findPath(
    start: GridCoord,
    goal: GridCoord,
    grid: NavigationGrid,
    strategy: PathStrategy = 'balanced'
  ): PathResult {
    const startTime = performance.now();

    // 1. Boundary & Traversability check on start & goal
    const startCell = grid.getCell(start.x, start.y);
    const goalCell = grid.getCell(goal.x, goal.y);

    if (!startCell || !startCell.isTraversable) {
      return {
        success: false,
        waypoints: [],
        totalDistance: 0,
        averageRisk: 0,
        maxSlope: 0,
        estimatedEnergy: 0,
        visitedNodesCount: 0,
        executionTimeMs: performance.now() - startTime,
        failureReason: 'Rover starting location is outside boundaries or in impassable terrain.',
      };
    }

    if (!goalCell || !goalCell.isTraversable) {
      return {
        success: false,
        waypoints: [],
        totalDistance: 0,
        averageRisk: 0,
        maxSlope: 0,
        estimatedEnergy: 0,
        visitedNodesCount: 0,
        executionTimeMs: performance.now() - startTime,
        failureReason: `Selected destination (${goal.x}, ${goal.y}) is blocked by a ${goalCell?.obstacleType || 'hazard'} and cannot be safely reached.`,
      };
    }

    // Identical start and goal
    if (start.x === goal.x && start.y === goal.y) {
      const initialWp: Waypoint = {
        gridX: start.x,
        gridY: start.y,
        worldX: startCell.worldX,
        worldY: startCell.worldY,
        worldZ: startCell.worldZ,
        riskLevel: startCell.riskLevel,
        cumulativeDistance: 0,
        estimatedEnergy: 0,
      };
      return {
        success: true,
        waypoints: [initialWp],
        totalDistance: 0,
        averageRisk: startCell.riskCost,
        maxSlope: startCell.slope,
        estimatedEnergy: 0,
        visitedNodesCount: 1,
        executionTimeMs: performance.now() - startTime,
      };
    }

    // 2. Weights based on Strategy
    let distanceWeight = 1.0;
    let riskWeight = 2.0;
    let slopeWeight = 1.5;

    switch (strategy) {
      case 'shortest':
        distanceWeight = 1.0;
        riskWeight = 0.4;
        slopeWeight = 0.5;
        break;
      case 'safer':
        distanceWeight = 0.6;
        riskWeight = 6.0;
        slopeWeight = 4.0;
        break;
      case 'balanced':
      default:
        distanceWeight = 1.0;
        riskWeight = 2.2;
        slopeWeight = 1.8;
        break;
    }

    // 3. Priority Queue and Sets
    const openSet = new PriorityQueue<AStarNode>();
    const openSetMap = new Map<string, AStarNode>();
    const closedSet = new Set<string>();

    const coordKey = (x: number, y: number) => `${x},${y}`;

    // Octile / Euclidean distance heuristic
    const calculateHeuristic = (gx: number, gy: number): number => {
      const dx = Math.abs(gx - goal.x);
      const dy = Math.abs(gy - goal.y);
      // Octile distance in cells * cell physical length
      const octileDist = (Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy)) * grid.cellSize;
      return octileDist * distanceWeight;
    };

    const startNode: AStarNode = {
      gx: start.x,
      gy: start.y,
      gCost: 0,
      hCost: calculateHeuristic(start.x, start.y),
      fCost: calculateHeuristic(start.x, start.y),
      parent: null,
      distanceTraveled: 0,
      cumulativeEnergy: 0,
    };

    openSet.enqueue(startNode, startNode.fCost);
    openSetMap.set(coordKey(start.x, start.y), startNode);

    let visitedCount = 0;
    let targetReachedNode: AStarNode | null = null;

    // Movement directions: 8 neighbors
    const neighbors = [
      { dx: 0, dy: -1, costMult: 1.0 },
      { dx: 0, dy: 1, costMult: 1.0 },
      { dx: -1, dy: 0, costMult: 1.0 },
      { dx: 1, dy: 0, costMult: 1.0 },
      { dx: -1, dy: -1, costMult: Math.SQRT2 },
      { dx: 1, dy: -1, costMult: Math.SQRT2 },
      { dx: -1, dy: 1, costMult: Math.SQRT2 },
      { dx: 1, dy: 1, costMult: Math.SQRT2 },
    ];

    while (!openSet.isEmpty()) {
      const current = openSet.dequeue()!;
      const currentKey = coordKey(current.gx, current.gy);
      openSetMap.delete(currentKey);

      if (closedSet.has(currentKey)) {
        continue;
      }
      closedSet.add(currentKey);
      visitedCount++;

      // Destination reached
      if (current.gx === goal.x && current.gy === goal.y) {
        targetReachedNode = current;
        break;
      }

      const currentCell = grid.getCell(current.gx, current.gy)!;

      for (const n of neighbors) {
        const nx = current.gx + n.dx;
        const ny = current.gy + n.dy;
        const neighborKey = coordKey(nx, ny);

        if (closedSet.has(neighborKey)) continue;

        const neighborCell = grid.getCell(nx, ny);
        if (!neighborCell || !neighborCell.isTraversable) continue;

        // Prevent cutting corners through diagonal gaps between two blocked cells
        if (n.dx !== 0 && n.dy !== 0) {
          const adjCell1 = grid.getCell(current.gx + n.dx, current.gy);
          const adjCell2 = grid.getCell(current.gx, current.gy + n.dy);
          if (!adjCell1?.isTraversable && !adjCell2?.isTraversable) {
            continue; // Cannot squeeze diagonally between two solid blockers
          }
        }

        // 3D step distance
        const dx3d = neighborCell.worldX - currentCell.worldX;
        const dy3d = neighborCell.worldY - currentCell.worldY;
        const dz3d = neighborCell.worldZ - currentCell.worldZ;
        const stepDist3d = Math.sqrt(dx3d * dx3d + dy3d * dy3d + dz3d * dz3d);

        // Slope penalty (steeper slopes consume more energy and represent mechanical stress)
        const slopeFactor = 1.0 + (neighborCell.slope / NavigationGrid.SLOPE_HIGH_MAX) * slopeWeight;

        // Risk penalty
        let riskFactor = 1.0;
        if (neighborCell.riskLevel === 'high') {
          riskFactor = 1.0 + riskWeight * 3.5;
        } else if (neighborCell.riskLevel === 'moderate') {
          riskFactor = 1.0 + riskWeight * 1.5;
        }

        const stepCost = stepDist3d * distanceWeight * slopeFactor * riskFactor;
        const tentativeGCost = current.gCost + stepCost;

        // Energy estimate per step (Wh): base 0.5 Wh/m + climb factor
        const climbWork = Math.max(0, dy3d) * 1.8;
        const stepEnergy = stepDist3d * (0.45 + climbWork * 0.2);

        const existingNeighborNode = openSetMap.get(neighborKey);

        if (!existingNeighborNode || tentativeGCost < existingNeighborNode.gCost) {
          const hCost = calculateHeuristic(nx, ny);
          const neighborNode: AStarNode = {
            gx: nx,
            gy: ny,
            gCost: tentativeGCost,
            hCost: hCost,
            fCost: tentativeGCost + hCost,
            parent: current,
            distanceTraveled: current.distanceTraveled + stepDist3d,
            cumulativeEnergy: current.cumulativeEnergy + stepEnergy,
          };

          openSetMap.set(neighborKey, neighborNode);
          openSet.enqueue(neighborNode, neighborNode.fCost);
        }
      }
    }

    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    if (!targetReachedNode) {
      return {
        success: false,
        waypoints: [],
        totalDistance: 0,
        averageRisk: 0,
        maxSlope: 0,
        estimatedEnergy: 0,
        visitedNodesCount: visitedCount,
        executionTimeMs,
        failureReason: 'No traversable path exists to the destination. All prospective routes are blocked by boulders, craters, or steep terrain boundaries.',
      };
    }

    // 4. Reconstruct Path Waypoints from Goal to Start
    const rawWaypoints: Waypoint[] = [];
    let curr: AStarNode | null = targetReachedNode;

    while (curr) {
      const cell = grid.getCell(curr.gx, curr.gy)!;
      rawWaypoints.push({
        gridX: curr.gx,
        gridY: curr.gy,
        worldX: cell.worldX,
        worldY: cell.worldY,
        worldZ: cell.worldZ,
        riskLevel: cell.riskLevel,
        cumulativeDistance: curr.distanceTraveled,
        estimatedEnergy: Math.round(curr.cumulativeEnergy * 10) / 10,
      });
      curr = curr.parent;
    }

    rawWaypoints.reverse();

    // Compute route metrics
    let totalRisk = 0;
    let maxSlope = 0;
    for (const wp of rawWaypoints) {
      const cell = grid.getCell(wp.gridX, wp.gridY)!;
      totalRisk += cell.riskCost;
      if (cell.slope > maxSlope) {
        maxSlope = cell.slope;
      }
    }

    const avgRisk = rawWaypoints.length > 0 ? Math.round((totalRisk / rawWaypoints.length) * 10) / 10 : 1.0;

    return {
      success: true,
      waypoints: rawWaypoints,
      totalDistance: Math.round(targetReachedNode.distanceTraveled * 10) / 10,
      averageRisk: avgRisk,
      maxSlope: Math.round(maxSlope * 10) / 10,
      estimatedEnergy: Math.round(targetReachedNode.cumulativeEnergy * 10) / 10,
      visitedNodesCount: visitedCount,
      executionTimeMs,
    };
  }

  // Generate comparison across all 3 strategies (Shortest, Safer, Balanced)
  public static compareStrategies(
    start: GridCoord,
    goal: GridCoord,
    grid: NavigationGrid
  ): { shortest: PathResult; safer: PathResult; balanced: PathResult } {
    return {
      shortest: AStarPathfinder.findPath(start, goal, grid, 'shortest'),
      safer: AStarPathfinder.findPath(start, goal, grid, 'safer'),
      balanced: AStarPathfinder.findPath(start, goal, grid, 'balanced'),
    };
  }
}
