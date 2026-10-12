import { describe, it, expect } from 'vitest';
import { generateLunarTerrain } from '../core/terrainGenerator';
import { NavigationGrid } from '../core/navigationGrid';
import { AStarPathfinder } from '../core/astar';
import { PathStrategy } from '../types/navigation';

const SEEDS = [42, 43, 44, 45, 46];
const STRATEGIES: PathStrategy[] = ['shortest', 'safer', 'balanced'];
const TIMING_REPEATS = 15;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

describe('LunaBot reproducible route benchmark', () => {
  it('records outcomes for five terrain seeds and all route strategies', () => {
    const cases: Array<Record<string, unknown>> = [];

    for (const seed of SEEDS) {
      const terrain = generateLunarTerrain({
        gridSize: 40,
        worldSize: 80,
        seed,
        maxElevation: 4,
        roughness: 0.5,
        craterCount: 3,
        rockCount: 8,
      });
      const grid = new NavigationGrid(terrain);
      const start = { x: 10, y: 10 };
      const goal = { x: 25, y: 25 };

      for (const strategy of STRATEGIES) {
        // Warm-up call is excluded from timing statistics.
        AStarPathfinder.findPath(start, goal, grid, strategy);
        const measured = [];
        for (let repeat = 0; repeat < TIMING_REPEATS; repeat++) {
          measured.push(AStarPathfinder.findPath(start, goal, grid, strategy));
        }

        const successful = measured.find((r) => r.success);
        const planningTimes = measured.map((r) => r.executionTimeMs);
        cases.push({
          seed,
          gridSize: grid.gridSize,
          worldSize: grid.worldSize,
          start,
          goal,
          strategy,
          planningSuccess: measured[0].success,
          timingRepeats: TIMING_REPEATS,
          medianPlanningTimeMs: Number(median(planningTimes).toFixed(3)),
          minPlanningTimeMs: Number(Math.min(...planningTimes).toFixed(3)),
          maxPlanningTimeMs: Number(Math.max(...planningTimes).toFixed(3)),
          pathLengthWorldUnits: successful?.totalDistance ?? null,
          meanRouteRiskCost: successful?.averageRisk ?? null,
          maximumSlopeDegrees: successful?.maxSlope ?? null,
          estimatedEnergyWh: successful?.estimatedEnergy ?? null,
          expandedNodes: successful?.visitedNodesCount ?? measured[0].visitedNodesCount,
          failureReason: measured[0].success ? null : measured[0].failureReason ?? 'No route returned',
        });
      }
    }

    const summary = STRATEGIES.map((strategy) => {
      const group = cases.filter((row) => row.strategy === strategy);
      const successes = group.filter((row) => row.planningSuccess === true);
      const numbers = (key: string) => successes
        .map((row) => row[key])
        .filter((v): v is number => typeof v === 'number');
      const times = group.map((row) => row.medianPlanningTimeMs as number);
      const lengths = numbers('pathLengthWorldUnits');
      const risks = numbers('meanRouteRiskCost');
      const slopes = numbers('maximumSlopeDegrees');
      const energies = numbers('estimatedEnergyWh');
      const nodes = numbers('expandedNodes');
      return {
        strategy,
        cases: group.length,
        successfulCases: successes.length,
        observedSuccessFraction: Number((successes.length / group.length).toFixed(3)),
        medianPathLengthWorldUnits: lengths.length ? Number(median(lengths).toFixed(3)) : null,
        medianMeanRiskCost: risks.length ? Number(median(risks).toFixed(3)) : null,
        medianMaximumSlopeDegrees: slopes.length ? Number(median(slopes).toFixed(3)) : null,
        medianEstimatedEnergyWh: energies.length ? Number(median(energies).toFixed(3)) : null,
        medianExpandedNodes: nodes.length ? Number(median(nodes).toFixed(3)) : null,
        medianOfCaseMedianPlanningTimesMs: times.length ? Number(median(times).toFixed(3)) : null,
        minCaseMedianPlanningTimeMs: times.length ? Number(Math.min(...times).toFixed(3)) : null,
        maxCaseMedianPlanningTimeMs: times.length ? Number(Math.max(...times).toFixed(3)) : null,
      };
    });

    const artifact = {
      description: 'Exploratory software benchmark on procedurally generated terrain; not a physical lunar rover test.',
      generatedAtUtc: new Date().toISOString(),
      runtime: 'Node.js in GitHub Actions runner; see workflow log for exact version',
      configuration: {
        seeds: SEEDS,
        gridSize: 40,
        worldSize: 80,
        start: { x: 10, y: 10 },
        goal: { x: 25, y: 25 },
        craterCount: 3,
        rockCount: 8,
        maxElevation: 4,
        roughness: 0.5,
        timingRepeatsPerCase: TIMING_REPEATS,
        strategies: STRATEGIES,
      },
      interpretationNotes: [
        'Each seed/strategy pair is one deterministic planning case; repeated calls are timing repeats, not independent missions.',
        'Path length is reported in simulation world units, not metres, because the world scale is not calibrated.',
        'Mean route risk is an implementation cost score, not a probability of collision.',
        'Energy is a model estimate, not physical measurement.',
        'Planning time is specific to the GitHub Actions runner and should not be generalized to all hardware.',
      ],
      summary,
      cases,
    };

    // Emit a single machine-readable line so the CI log preserves measured results.
    console.log('LUNABOT_BENCHMARK_JSON ' + JSON.stringify(artifact));
    expect(cases).toHaveLength(SEEDS.length * STRATEGIES.length);
  });
});
