# LunaBot Research Experiment Protocol

## Purpose and scope

This protocol provides a reproducible way to evaluate the current **simulation prototype**. It is not a test of a physical lunar rover. The terrain is generated procedurally, the rover energy values are model estimates, and the navigation system uses the simulation's world model rather than noisy real sensors.

## Environment record

For every experiment, record:

- Git commit SHA and date.
- Node.js and npm versions.
- Browser and operating system for interactive runs.
- Terrain seed, grid size, world size, crater count, rock count, roughness, and maximum elevation.
- Start and goal grid coordinates.
- Route strategy: `shortest`, `balanced`, or `safer`.
- Scenario name and any dynamic-obstacle insertion coordinates/time.

Use the same machine, browser, terrain seed, grid dimensions, and start/goal for strategy comparisons. Run each timed path-planning case at least 30 times after one warm-up run and report median, minimum, and maximum; do not report only the fastest run.

## Software checks

From a clean checkout:

```bash
npm ci
npm test
npm run build
```

Save the complete terminal output with the commit SHA. A passing unit test establishes that the tested assertions passed for their fixtures; it does not establish field reliability or a general success probability.

## Recommended experiments

1. **Unobstructed navigation:** determine whether a valid route is returned for a clear start-goal pair.
2. **Static obstacle detour:** place a boulder or blocked region on the direct route and verify that returned waypoints avoid blocked cells.
3. **Crater and slope hazards:** compare route length, maximum slope, mean risk cost, and estimated energy across all three strategies.
4. **Dynamic replanning:** compute a baseline route, add an obstacle to a waypoint on that route, recompute, and verify that the new route avoids the newly blocked cell.
5. **Unreachable destination:** select a goal in a blocked/boundary cell and record the planner's failure response.
6. **Energy model:** compare equal-distance travel over flat and inclined terrain with the same initial state.
7. **Frontier exploration:** repeat with different explored footprints and terrain seeds; record whether a reachable frontier target is selected and the coverage change.

The repository's ten scenario presets may be used for interface demonstrations, but their `expectedResult` descriptions are expected behaviours, not measured outcomes.

## Metrics

- **Planning success:** whether a route was returned for a specified case.
- **Path length:** the planner's reported 3D distance in simulation world units. Do not label these metres unless the world scale is calibrated.
- **Mean route risk:** mean of the grid risk-cost values along the returned waypoints; it is not a probability of collision.
- **Maximum slope:** maximum terrain slope among route waypoints, in degrees.
- **Estimated energy:** the software's model estimate, in Wh, not a measured physical energy consumption.
- **Expanded nodes:** count reported by the pathfinder.
- **Planning time:** reported wall-clock execution time in milliseconds; repeat it because browser/runtime load affects it.
- **Replanning validity:** whether the updated route excludes the newly blocked point and whether a valid alternative exists.
- **Exploration coverage:** percentage of traversable grid cells marked explored by the simulation.

## Reporting rules

Do not invent data or fill result cells with the preset's expected behaviour. If an experiment was not executed, use `Not measured`. If it fails, record the failure and investigate it rather than omitting it. Include sample count and summary statistics for repeated timing tests. Use the same source revision for the measurements, screenshots, and paper.

## Limitations to state in the paper

The current prototype uses procedural, non-georeferenced terrain; heuristic slope-based hazard classification; an approximate energy model; and direct access to its generated world state. It does not validate real camera/LiDAR perception, localization uncertainty, lunar soil interaction, radiation/thermal effects, vacuum hardware, or flight-level autonomy. Conclusions should therefore be limited to software-level simulation behaviour.
