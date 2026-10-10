import { GridCell, GridCoord, PathResult } from '../types/navigation';
import { NavigationGrid } from './navigationGrid';
import { AStarPathfinder } from './astar';

export interface FrontierCluster {
  id: string;
  centroid: GridCoord;
  cells: GridCell[];
  size: number;
  distanceToRover: number;
  averageRisk: number;
  utilityScore: number;
}

export class FrontierExplorer {
  // Cluster frontier cells using 8-connectivity Breadth-First Search
  public static clusterFrontiers(frontierCells: GridCell[], grid: NavigationGrid): FrontierCluster[] {
    const visited = new Set<string>();
    const clusters: FrontierCluster[] = [];
    const coordKey = (x: number, y: number) => `${x},${y}`;

    for (const cell of frontierCells) {
      const key = coordKey(cell.gridX, cell.gridY);
      if (visited.has(key)) continue;

      const clusterCells: GridCell[] = [];
      const queue: GridCell[] = [cell];
      visited.add(key);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        clusterCells.push(curr);

        // Check 8 neighbors for other frontier cells
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = curr.gridX + dx;
            const ny = curr.gridY + dy;
            const nKey = coordKey(nx, ny);

            if (!visited.has(nKey)) {
              const nCell = grid.getCell(nx, ny);
              if (nCell && nCell.isFrontier) {
                visited.add(nKey);
                queue.push(nCell);
              }
            }
          }
        }
      }

      // Compute cluster centroid
      let sumX = 0;
      let sumY = 0;
      let sumRisk = 0;
      for (const c of clusterCells) {
        sumX += c.gridX;
        sumY += c.gridY;
        sumRisk += c.riskCost;
      }

      const centroidX = Math.round(sumX / clusterCells.length);
      const centroidY = Math.round(sumY / clusterCells.length);

      // Find closest traversable cell in cluster to centroid
      let bestCell = clusterCells[0];
      let minCentroidDist = Infinity;
      for (const c of clusterCells) {
        const d = Math.hypot(c.gridX - centroidX, c.gridY - centroidY);
        if (c.isTraversable && d < minCentroidDist) {
          minCentroidDist = d;
          bestCell = c;
        }
      }

      clusters.push({
        id: `frontier-${clusters.length + 1}`,
        centroid: { x: bestCell.gridX, y: bestCell.gridY },
        cells: clusterCells,
        size: clusterCells.length,
        distanceToRover: 0,
        averageRisk: sumRisk / clusterCells.length,
        utilityScore: 0,
      });
    }

    return clusters;
  }

  // Select the highest-utility reachable frontier target
  public static selectBestFrontierTarget(
    roverGridPos: GridCoord,
    grid: NavigationGrid,
    blacklistedCentroids: Set<string> = new Set()
  ): { target: GridCoord; path: PathResult; cluster: FrontierCluster } | null {
    const frontierCells = grid.getFrontierCells();
    if (frontierCells.length === 0) {
      return null;
    }

    const clusters = this.clusterFrontiers(frontierCells, grid);
    if (clusters.length === 0) {
      return null;
    }

    // Rank clusters by Utility = InfoGainWeight * Size - DistanceWeight * Distance - RiskWeight * Risk
    for (const cluster of clusters) {
      const dist = Math.hypot(cluster.centroid.x - roverGridPos.x, cluster.centroid.y - roverGridPos.y);
      cluster.distanceToRover = dist;

      // Prefer large unexplored clusters that are nearby and lower risk
      const infoGain = Math.min(cluster.size, 15) * 3.5;
      const distancePenalty = dist * 1.2;
      const riskPenalty = (cluster.averageRisk - 1.0) * 4.0;

      cluster.utilityScore = infoGain - distancePenalty - riskPenalty;
    }

    // Sort descending by utility
    clusters.sort((a, b) => b.utilityScore - a.utilityScore);

    // Try finding valid A* path to top clusters
    for (const cluster of clusters) {
      const key = `${cluster.centroid.x},${cluster.centroid.y}`;
      if (blacklistedCentroids.has(key)) {
        continue;
      }

      const pathResult = AStarPathfinder.findPath(roverGridPos, cluster.centroid, grid, 'balanced');
      if (pathResult.success && pathResult.waypoints.length > 1) {
        return {
          target: cluster.centroid,
          path: pathResult,
          cluster,
        };
      } else {
        // If unreachable, blacklist to prevent futile recalculations
        blacklistedCentroids.add(key);
      }
    }

    return null;
  }
}
