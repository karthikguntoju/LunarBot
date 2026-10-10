import { GridCell, GridCoord, RiskLevel, WorldCoord } from '../types/navigation';
import { RockObstacle } from '../types/terrain';
import { GeneratedTerrainModel } from './terrainGenerator';

export class NavigationGrid {
  public readonly gridSize: number;
  public readonly worldSize: number;
  public readonly cellSize: number;
  public readonly cells: GridCell[][];
  private terrainModel: GeneratedTerrainModel;
  public dynamicObstacles: Map<string, RockObstacle> = new Map();

  // Slope thresholds (in degrees)
  public static readonly SLOPE_SAFE_MAX = 10;
  public static readonly SLOPE_MODERATE_MAX = 18;
  public static readonly SLOPE_HIGH_MAX = 28; // >28 is impassable for rover

  constructor(terrainModel: GeneratedTerrainModel) {
    this.terrainModel = terrainModel;
    this.gridSize = terrainModel.config.gridSize;
    this.worldSize = terrainModel.config.worldSize;
    this.cellSize = this.worldSize / this.gridSize;
    this.cells = [];

    this.initializeGrid();
  }

  public initializeGrid(): void {
    const halfWorld = this.worldSize / 2;
    this.cells.length = 0;

    for (let gy = 0; gy < this.gridSize; gy++) {
      const row: GridCell[] = [];
      for (let gx = 0; gx < this.gridSize; gx++) {
        // World coordinates centered in the cell
        const wx = (gx / (this.gridSize - 1)) * this.worldSize - halfWorld;
        const wz = (gy / (this.gridSize - 1)) * this.worldSize - halfWorld;
        const wy = this.terrainModel.getHeightAt(wx, wz);

        row.push({
          gridX: gx,
          gridY: gy,
          worldX: wx,
          worldY: wy,
          worldZ: wz,
          elevation: wy,
          slope: 0,
          riskLevel: 'safe',
          riskCost: 1.0,
          isObstacle: false,
          isTraversable: true,
          isExplored: false,
          isFrontier: false,
        });
      }
      this.cells.push(row);
    }

    // Calculate slopes and classify risks
    this.recomputeHazards();
  }

  public recomputeHazards(): void {
    const halfWorld = this.worldSize / 2;

    for (let gy = 0; gy < this.gridSize; gy++) {
      for (let gx = 0; gx < this.gridSize; gx++) {
        const cell = this.cells[gy][gx];

        // 1. Terrain Boundary buffer check
        const isBoundary =
          gx === 0 || gx === this.gridSize - 1 || gy === 0 || gy === this.gridSize - 1;
        if (isBoundary) {
          cell.isObstacle = true;
          cell.obstacleType = 'boundary';
          cell.isTraversable = false;
          cell.riskLevel = 'blocked';
          cell.riskCost = Infinity;
          cell.slope = 45;
          continue;
        }

        // 2. Calculate max slope relative to 8 adjacent neighbors
        let maxSlopeDeg = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = gx + dx;
            const ny = gy + dy;
            if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
              const neighborElevation = this.terrainModel.getHeightAt(
                (nx / (this.gridSize - 1)) * this.worldSize - halfWorld,
                (ny / (this.gridSize - 1)) * this.worldSize - halfWorld
              );
              const dist = Math.hypot(dx * this.cellSize, dy * this.cellSize);
              const heightDiff = Math.abs(neighborElevation - cell.elevation);
              const slopeRad = Math.atan2(heightDiff, dist);
              const slopeDeg = (slopeRad * 180) / Math.PI;
              if (slopeDeg > maxSlopeDeg) {
                maxSlopeDeg = slopeDeg;
              }
            }
          }
        }
        cell.slope = Math.round(maxSlopeDeg * 10) / 10;

        // 3. Static Rocks and Boulders Check
        let blockedByRock = false;
        let nearRock = false;
        const roverClearance = 1.2; // clearance buffer

        for (const rock of this.terrainModel.rocks) {
          const d = Math.hypot(cell.worldX - rock.worldX, cell.worldZ - rock.worldZ);
          if (d <= rock.radius + roverClearance * 0.7) {
            blockedByRock = true;
            cell.obstacleType = 'rock';
            break;
          } else if (d <= rock.radius + roverClearance * 1.8) {
            nearRock = true;
          }
        }

        // 4. Dynamic Obstacles Check
        let blockedByDynamic = false;
        for (const dynRock of this.dynamicObstacles.values()) {
          const d = Math.hypot(cell.worldX - dynRock.worldX, cell.worldZ - dynRock.worldZ);
          if (d <= dynRock.radius + roverClearance * 0.7) {
            blockedByDynamic = true;
            cell.obstacleType = 'dynamic';
            break;
          } else if (d <= dynRock.radius + roverClearance * 1.8) {
            nearRock = true;
          }
        }

        // 5. Deep crater inner walls check
        let blockedByCrater = false;
        for (const crater of this.terrainModel.craters) {
          const dist = Math.hypot(cell.worldX - crater.worldX, cell.worldZ - crater.worldZ);
          // Very steep crater rims or bottom pit
          if (dist < crater.radius * 0.45 && crater.depth > 3.0) {
            blockedByCrater = true;
            cell.obstacleType = 'crater';
            break;
          }
        }

        // Final Risk Level and Traversability Assignment
        if (blockedByRock || blockedByDynamic || blockedByCrater || cell.slope > NavigationGrid.SLOPE_HIGH_MAX) {
          cell.isObstacle = true;
          cell.isTraversable = false;
          cell.riskLevel = 'blocked';
          cell.riskCost = Infinity;
          if (!cell.obstacleType) {
            cell.obstacleType = 'slope';
          }
        } else if (cell.slope > NavigationGrid.SLOPE_MODERATE_MAX || nearRock) {
          cell.isObstacle = false;
          cell.isTraversable = true;
          cell.riskLevel = 'high';
          cell.riskCost = 5.5;
        } else if (cell.slope > NavigationGrid.SLOPE_SAFE_MAX) {
          cell.isObstacle = false;
          cell.isTraversable = true;
          cell.riskLevel = 'moderate';
          cell.riskCost = 2.2;
        } else {
          cell.isObstacle = false;
          cell.isTraversable = true;
          cell.riskLevel = 'safe';
          cell.riskCost = 1.0;
        }
      }
    }
  }

  public addDynamicObstacle(obstacle: RockObstacle): void {
    obstacle.isDynamic = true;
    this.dynamicObstacles.set(obstacle.id, obstacle);
    this.recomputeHazards();
  }

  public removeDynamicObstacle(id: string): void {
    if (this.dynamicObstacles.delete(id)) {
      this.recomputeHazards();
    }
  }

  public clearDynamicObstacles(): void {
    this.dynamicObstacles.clear();
    this.recomputeHazards();
  }

  public getCell(gx: number, gy: number): GridCell | null {
    if (gx < 0 || gx >= this.gridSize || gy < 0 || gy >= this.gridSize) {
      return null;
    }
    return this.cells[gy][gx];
  }

  public worldToGrid(wx: number, wz: number): GridCoord {
    const halfWorld = this.worldSize / 2;
    const gx = Math.round(((wx + halfWorld) / this.worldSize) * (this.gridSize - 1));
    const gy = Math.round(((wz + halfWorld) / this.worldSize) * (this.gridSize - 1));
    return {
      x: Math.max(0, Math.min(this.gridSize - 1, gx)),
      y: Math.max(0, Math.min(this.gridSize - 1, gy)),
    };
  }

  public gridToWorld(gx: number, gy: number): WorldCoord {
    const cell = this.getCell(gx, gy);
    if (!cell) {
      const halfWorld = this.worldSize / 2;
      return {
        x: (gx / (this.gridSize - 1)) * this.worldSize - halfWorld,
        y: 0,
        z: (gy / (this.gridSize - 1)) * this.worldSize - halfWorld,
      };
    }
    return { x: cell.worldX, y: cell.worldY, z: cell.worldZ };
  }

  // Mark cell and surroundings as explored (rover sensor footprint)
  public markExplored(centerGx: number, centerGy: number, radiusInCells = 3): number {
    let newlyExploredCount = 0;
    const minX = Math.max(0, centerGx - radiusInCells);
    const maxX = Math.min(this.gridSize - 1, centerGx + radiusInCells);
    const minY = Math.max(0, centerGy - radiusInCells);
    const maxY = Math.min(this.gridSize - 1, centerGy + radiusInCells);

    for (let gy = minY; gy <= maxY; gy++) {
      for (let gx = minX; gx <= maxX; gx++) {
        if (Math.hypot(gx - centerGx, gy - centerGy) <= radiusInCells) {
          const cell = this.cells[gy][gx];
          if (!cell.isExplored) {
            cell.isExplored = true;
            newlyExploredCount++;
          }
        }
      }
    }

    this.updateFrontiers();
    return newlyExploredCount;
  }

  // Frontier cells: traversable cells that are explored but border unexplored traversable cells
  public updateFrontiers(): void {
    for (let gy = 1; gy < this.gridSize - 1; gy++) {
      for (let gx = 1; gx < this.gridSize - 1; gx++) {
        const cell = this.cells[gy][gx];
        cell.isFrontier = false;

        if (cell.isExplored && cell.isTraversable) {
          // Check if any orthogonal/diagonal neighbor is unexplored and traversable
          let bordersUnexplored = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const neighbor = this.cells[gy + dy][gx + dx];
              if (!neighbor.isExplored && neighbor.isTraversable) {
                bordersUnexplored = true;
                break;
              }
            }
            if (bordersUnexplored) break;
          }
          cell.isFrontier = bordersUnexplored;
        }
      }
    }
  }

  public getExplorationCoveragePercent(): number {
    let exploredCount = 0;
    let traversableTotal = 0;
    for (let gy = 0; gy < this.gridSize; gy++) {
      for (let gx = 0; gx < this.gridSize; gx++) {
        const cell = this.cells[gy][gx];
        if (cell.isTraversable) {
          traversableTotal++;
          if (cell.isExplored) {
            exploredCount++;
          }
        }
      }
    }
    if (traversableTotal === 0) return 0;
    return Math.round((exploredCount / traversableTotal) * 1000) / 10;
  }

  public getFrontierCells(): GridCell[] {
    const frontiers: GridCell[] = [];
    for (let gy = 0; gy < this.gridSize; gy++) {
      for (let gx = 0; gx < this.gridSize; gx++) {
        if (this.cells[gy][gx].isFrontier) {
          frontiers.push(this.cells[gy][gx]);
        }
      }
    }
    return frontiers;
  }
}
