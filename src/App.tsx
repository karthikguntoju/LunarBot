import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Header } from './components/ui/Header';
import { MissionControlPanel } from './components/ui/MissionControlPanel';
import { NavigationPanel } from './components/ui/NavigationPanel';
import { TelemetryPanel } from './components/ui/TelemetryPanel';
import { EventLogPanel } from './components/ui/EventLogPanel';
import { AnalyticsPanel } from './components/ui/AnalyticsPanel';
import { MissionReportModal } from './components/ui/MissionReportModal';
import { ScenariosModal } from './components/ui/ScenariosModal';
import { HelpModal } from './components/ui/HelpModal';
import { LunarCanvas } from './components/simulation/LunarCanvas';

import { generateLunarTerrain, GeneratedTerrainModel } from './core/terrainGenerator';
import { NavigationGrid } from './core/navigationGrid';
import { AStarPathfinder } from './core/astar';
import { FrontierExplorer } from './core/exploration';
import { EnergyModel, DEFAULT_ROVER_CONFIG } from './core/energyModel';
import { ScenarioPreset, SCENARIO_PRESETS } from './core/scenarioPresets';

import { GridCoord, PathStrategy, Waypoint, PathComparison } from './types/navigation';
import { RoverState, TelemetryData } from './types/rover';
import { MissionEvent, MissionMode, MissionReport, MissionStatus } from './types/mission';
import { RockObstacle, ScientificPOI } from './types/terrain';

const TERRAIN_CONFIG = {
  gridSize: 45,
  worldSize: 90,
  seed: 1042,
  maxElevation: 4.2,
  roughness: 0.55,
  craterCount: 4,
  rockCount: 14,
};

export const App: React.FC = () => {
  // 1. Terrain & Navigation Grid State
  const [currentSeed, setCurrentSeed] = useState<number>(TERRAIN_CONFIG.seed);

  const terrainModel = useMemo(() => {
    return generateLunarTerrain({ ...TERRAIN_CONFIG, seed: currentSeed });
  }, [currentSeed]);

  const navGrid = useMemo(() => {
    const grid = new NavigationGrid(terrainModel);
    // Mark starting region explored
    grid.markExplored(8, 8, 4);
    return grid;
  }, [terrainModel]);

  const [pois, setPois] = useState<ScientificPOI[]>(() => terrainModel.pois);
  const [dynamicObstacles, setDynamicObstacles] = useState<RockObstacle[]>([]);

  // Update POIs when terrain regenerates
  useEffect(() => {
    setPois(terrainModel.pois);
  }, [terrainModel]);

  // 2. Rover Kinematics State
  const startGridPos: GridCoord = { x: 8, y: 8 };
  const initialWorldPos = useMemo(() => {
    return navGrid.gridToWorld(startGridPos.x, startGridPos.y);
  }, [navGrid]);

  const [roverState, setRoverState] = useState<RoverState>({
    worldPos: initialWorldPos,
    gridPos: startGridPos,
    heading: 0,
    pitch: 0,
    roll: 0,
    speed: 0,
    targetSpeed: DEFAULT_ROVER_CONFIG.maxSpeed,
    wheelRotation: 0,
    mastAngle: 0,
    isMoving: false,
    statusText: 'Standing by at landing site.',
  });

  // Energy & Telemetry Model
  const energyModelRef = useRef<EnergyModel>(new EnergyModel(DEFAULT_ROVER_CONFIG, 100));

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    timestamp: Date.now(),
    position: initialWorldPos,
    gridCoord: startGridPos,
    headingDeg: 0,
    pitchDeg: 0,
    rollDeg: 0,
    speed: 0,
    batteryPercent: 100,
    totalDistanceTraveled: 0,
    estimatedEnergyConsumedWh: 0,
    currentWaypointIdx: 0,
    totalWaypoints: 0,
    remainingDistance: 0,
    hazardDetectionsCount: 0,
    replanEventsCount: 0,
    sciencePOIsVisited: 0,
    explorationCoveragePercent: 0,
    isBatteryLow: false,
    isBatteryCritical: false,
  });

  // Telemetry history for charts
  const [telemetryHistory, setTelemetryHistory] = useState<
    Array<{ time: number; battery: number; distance: number; speed: number }>
  >([]);

  // 3. Mission State
  const [missionStatus, setMissionStatus] = useState<MissionStatus>('idle');
  const [missionMode, setMissionMode] = useState<MissionMode>('target_navigation');
  const [strategy, setStrategy] = useState<PathStrategy>('balanced');
  const [targetCoord, setTargetCoord] = useState<GridCoord | null>({ x: 26, y: 26 });
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [currentWaypointIdx, setCurrentWaypointIdx] = useState<number>(0);
  const [isReplanned, setIsReplanned] = useState<boolean>(false);
  const [pathComparison, setPathComparison] = useState<PathComparison | null>(null);

  // Operator Controls
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.5);
  const [isPlacingObstacle, setIsPlacingObstacle] = useState<boolean>(false);
  const [showNavGrid, setShowNavGrid] = useState<boolean>(false);
  const [showRiskHeatmap, setShowRiskHeatmap] = useState<boolean>(false);
  const [showExploredOverlay, setShowExploredOverlay] = useState<boolean>(true);
  const [followRover, setFollowRover] = useState<boolean>(false);

  // Modals
  const [isScenariosOpen, setIsScenariosOpen] = useState<boolean>(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [currentReport, setCurrentReport] = useState<MissionReport | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | undefined>(undefined);

  // Mission History (Persisted in localStorage)
  const [missionHistory, setMissionHistory] = useState<MissionReport[]>(() => {
    try {
      const stored = localStorage.getItem('lunabot_mission_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('lunabot_mission_history', JSON.stringify(missionHistory));
    } catch (e) {
      console.warn('LocalStorage unavailable for mission history', e);
    }
  }, [missionHistory]);

  // Mission Events Log
  const [events, setEvents] = useState<MissionEvent[]>([
    {
      id: 'init-1',
      timestamp: Date.now(),
      timeString: new Date().toLocaleTimeString(),
      severity: 'info',
      type: 'mission_init',
      title: 'LunaBot Avionics Initialized',
      details: 'Autonomous navigation system online. 2.5D regolith hazard grid computed.',
    },
  ]);

  const addEvent = useCallback(
    (
      type: MissionEvent['type'],
      title: string,
      details: string,
      severity: MissionEvent['severity'] = 'info'
    ) => {
      const newEvent: MissionEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        timeString: new Date().toLocaleTimeString(),
        severity,
        type,
        title,
        details,
        position: roverState.worldPos,
        gridCoord: roverState.gridPos,
      };
      setEvents((prev) => [...prev.slice(-150), newEvent]); // Keep last 150 events
    },
    [roverState.worldPos, roverState.gridPos]
  );

  // Mission metrics accumulator ref
  const missionMetricsRef = useRef({
    startTime: Date.now(),
    startPos: initialWorldPos,
    distanceTraveled: 0,
    energyConsumed: 0,
    maxSlopeTraversed: 0,
    hazardCount: 0,
    replanCount: 0,
    visitedPois: new Set<string>(),
  });

  // Calculate Path Comparison when target or strategy changes
  const updateRoutePlanning = useCallback(
    (target: GridCoord, preferredStrategy: PathStrategy) => {
      const comparison = AStarPathfinder.compareStrategies(roverState.gridPos, target, navGrid);
      setPathComparison(comparison);

      const chosenPath = comparison[preferredStrategy];
      if (chosenPath && chosenPath.success) {
        setWaypoints(chosenPath.waypoints);
        setCurrentWaypointIdx(0);
        setIsReplanned(false);
        addEvent(
          'route_calculated',
          'A* Route Computed',
          `Selected ${preferredStrategy.toUpperCase()} route: ${chosenPath.totalDistance}m (${chosenPath.waypoints.length} waypoints, est. energy ${chosenPath.estimatedEnergy} Wh).`,
          'info'
        );
        return true;
      } else {
        setWaypoints([]);
        addEvent(
          'mission_failed',
          'Path Planning Failed',
          chosenPath?.failureReason || 'Destination unreachable.',
          'critical'
        );
        return false;
      }
    },
    [roverState.gridPos, navGrid, addEvent]
  );

  // Initial route preview
  useEffect(() => {
    if (targetCoord) {
      updateRoutePlanning(targetCoord, strategy);
    }
  }, [targetCoord, strategy, navGrid]);

  // Handle Dynamic Obstacle Addition & Immediate Replanning
  const handleAddDynamicObstacle = useCallback(
    (worldX: number, worldZ: number) => {
      const gridCoord = navGrid.worldToGrid(worldX, worldZ);
      const newRock: RockObstacle = {
        id: `dyn-rock-${Date.now()}`,
        gridX: gridCoord.x,
        gridY: gridCoord.y,
        worldX,
        worldZ,
        radius: 2.2,
        height: 2.0,
        isDynamic: true,
      };

      navGrid.addDynamicObstacle(newRock);
      setDynamicObstacles((prev) => [...prev, newRock]);
      setIsPlacingObstacle(false);

      missionMetricsRef.current.hazardCount++;
      setTelemetry((prev) => ({
        ...prev,
        hazardDetectionsCount: prev.hazardDetectionsCount + 1,
      }));

      addEvent(
        'hazard_detected',
        'Dynamic Obstacle Injected',
        `Fallen boulder registered at grid (${gridCoord.x}, ${gridCoord.y}). Evaluating route safety...`,
        'warning'
      );

      // Check if newly placed obstacle obstructs the active planned path
      if ((missionStatus === 'navigating' || missionStatus === 'exploring') && waypoints.length > 0) {
        const remainingWps = waypoints.slice(currentWaypointIdx);
        const isBlocked = remainingWps.some(
          (wp) => Math.hypot(wp.worldX - worldX, wp.worldZ - worldZ) < newRock.radius + 1.2
        );

        if (isBlocked) {
          // Immediately halt rover and trigger replan
          setRoverState((r) => ({ ...r, isMoving: false, speed: 0 }));
          setMissionStatus('obstacle_detected');
          addEvent(
            'hazard_detected',
            'Route Intercepted by Obstacle',
            'Active trajectory obstructed! Halting rover and recomputing A* alternative path...',
            'critical'
          );

          setTimeout(() => {
            setMissionStatus('replanning');
            missionMetricsRef.current.replanCount++;
            setTelemetry((prev) => ({
              ...prev,
              replanEventsCount: prev.replanEventsCount + 1,
            }));

            const targetGridX = targetCoord ? targetCoord.x : (waypoints.length > 0 ? waypoints[waypoints.length - 1].gridX : 0);
            const targetGridY = targetCoord ? targetCoord.y : (waypoints.length > 0 ? waypoints[waypoints.length - 1].gridY : 0);
            const replanResult = AStarPathfinder.findPath(
              roverState.gridPos,
              { x: targetGridX, y: targetGridY },
              navGrid,
              strategy
            );

            if (replanResult.success && replanResult.waypoints.length > 0) {
              setWaypoints(replanResult.waypoints);
              setCurrentWaypointIdx(0);
              setIsReplanned(true);
              setMissionStatus(missionMode === 'autonomous_exploration' ? 'exploring' : 'navigating');
              setRoverState((r) => ({ ...r, isMoving: true }));
              addEvent(
                'route_replanned',
                'Route Replanned Successfully',
                `Computed alternative detour (${replanResult.totalDistance}m). Resuming transit.`,
                'success'
              );
            } else {
              setMissionStatus('failed');
              setRoverState((r) => ({ ...r, isMoving: false, speed: 0 }));
              addEvent(
                'mission_failed',
                'Replanning Halted',
                'No safe detour exists around the new obstacle. Mission aborted for vehicle safety.',
                'critical'
              );
            }
          }, 600);
        }
      }
    },
    [navGrid, missionStatus, waypoints, currentWaypointIdx, targetCoord, roverState.gridPos, strategy, missionMode, addEvent]
  );

  // Clear Dynamic Hazards
  const handleClearDynamicObstacles = useCallback(() => {
    navGrid.clearDynamicObstacles();
    setDynamicObstacles([]);
    addEvent('hazard_detected', 'Hazards Cleared', 'All operator-injected dynamic obstacles removed.', 'info');
  }, [navGrid, addEvent]);

  // Click on 3D Terrain
  const handleTerrainClick = useCallback(
    (worldX: number, worldZ: number) => {
      if (isPlacingObstacle) {
        handleAddDynamicObstacle(worldX, worldZ);
        return;
      }

      // Pick destination target
      const cellCoord = navGrid.worldToGrid(worldX, worldZ);
      const cell = navGrid.getCell(cellCoord.x, cellCoord.y);

      if (!cell || !cell.isTraversable) {
        addEvent(
          'target_selected',
          'Target Disallowed',
          `Cell (${cellCoord.x}, ${cellCoord.y}) is impassable (${cell?.obstacleType || 'high risk'}).`,
          'warning'
        );
        return;
      }

      setTargetCoord(cellCoord);
      addEvent(
        'target_selected',
        'Destination Target Selected',
        `Operator set target to (${cellCoord.x}, ${cellCoord.y}) at [${worldX.toFixed(1)}, ${worldZ.toFixed(1)}].`,
        'info'
      );

      if (missionStatus === 'idle' || missionStatus === 'completed' || missionStatus === 'failed') {
        updateRoutePlanning(cellCoord, strategy);
      }
    },
    [isPlacingObstacle, handleAddDynamicObstacle, navGrid, missionStatus, updateRoutePlanning, strategy, addEvent]
  );

  // Complete Mission and Record Final Report
  const completeMission = useCallback(
    (status: 'completed' | 'failed' | 'cancelled', message: string) => {
      setMissionStatus(status);
      setRoverState((r) => ({ ...r, isMoving: false, speed: 0 }));

      const m = missionMetricsRef.current;
      const durationSeconds = (Date.now() - m.startTime) / 1000;
      const finalBattery = energyModelRef.current.getBatteryPercent();

      let totalScore = 0;
      m.visitedPois.forEach((id) => {
        const poi = pois.find((p) => p.id === id);
        if (poi) totalScore += poi.scientificValue;
      });

      const report: MissionReport = {
        missionId: `MSN-${Date.now().toString().slice(-4)}`,
        mode: missionMode,
        strategy,
        startTime: m.startTime,
        endTime: Date.now(),
        durationSeconds,
        startPos: m.startPos,
        destinationPos: targetCoord ? navGrid.gridToWorld(targetCoord.x, targetCoord.y) : undefined,
        status,
        statusMessage: message,
        distanceTraveledMeters: m.distanceTraveled,
        estimatedEnergyWh: energyModelRef.current.getEnergyConsumedWh(),
        initialBatteryPercent: 100,
        finalBatteryPercent: finalBattery,
        hazardsEncountered: m.hazardCount,
        replanCount: m.replanCount,
        explorationCoveragePercent: navGrid.getExplorationCoveragePercent(),
        scientificPOIsVisited: Array.from(m.visitedPois).map(
          (id) => pois.find((p) => p.id === id)?.name || id
        ),
        totalScientificScore: totalScore,
        averageSpeedMps: durationSeconds > 0 ? m.distanceTraveled / durationSeconds : 0,
        peakSlopeTraversedDeg: m.maxSlopeTraversed,
      };

      setCurrentReport(report);
      setMissionHistory((prev) => [report, ...prev]);

      addEvent(
        status === 'completed' ? 'mission_completed' : 'mission_failed',
        `Mission ${status.toUpperCase()}`,
        message,
        status === 'completed' ? 'success' : 'critical'
      );
    },
    [missionMode, strategy, targetCoord, navGrid, pois, addEvent]
  );

  // Start Autonomous Exploration Next Target
  const dispatchNextFrontier = useCallback(() => {
    const nextTarget = FrontierExplorer.selectBestFrontierTarget(roverState.gridPos, navGrid);

    if (nextTarget && nextTarget.path.success) {
      setTargetCoord(nextTarget.target);
      setWaypoints(nextTarget.path.waypoints);
      setCurrentWaypointIdx(0);
      setMissionStatus('exploring');
      setRoverState((r) => ({ ...r, isMoving: true }));
      addEvent(
        'frontier_selected',
        'Frontier Dispatched',
        `Navigating to frontier cluster at (${nextTarget.target.x}, ${nextTarget.target.y}) [Coverage: ${navGrid.getExplorationCoveragePercent().toFixed(1)}%].`,
        'info'
      );
    } else {
      completeMission('completed', 'Exploration complete! All reachable frontier quadrants surveyed.');
    }
  }, [roverState.gridPos, navGrid, addEvent, completeMission]);

  // Start Missions Actions
  const handleStartMission = () => {
    if (!targetCoord) return;
    const ok = updateRoutePlanning(targetCoord, strategy);
    if (!ok) return;

    missionMetricsRef.current = {
      startTime: Date.now(),
      startPos: roverState.worldPos,
      distanceTraveled: 0,
      energyConsumed: 0,
      maxSlopeTraversed: 0,
      hazardCount: dynamicObstacles.length,
      replanCount: 0,
      visitedPois: new Set<string>(),
    };

    setMissionMode('target_navigation');
    setMissionStatus('navigating');
    setRoverState((r) => ({ ...r, isMoving: true }));
    addEvent('movement_started', 'Rover Navigation Initiated', `Dispatched to destination (${targetCoord.x}, ${targetCoord.y}).`, 'info');
  };

  const handleStartAutonomousExploration = () => {
    missionMetricsRef.current = {
      startTime: Date.now(),
      startPos: roverState.worldPos,
      distanceTraveled: 0,
      energyConsumed: 0,
      maxSlopeTraversed: 0,
      hazardCount: dynamicObstacles.length,
      replanCount: 0,
      visitedPois: new Set<string>(),
    };

    setMissionMode('autonomous_exploration');
    dispatchNextFrontier();
  };

  const handlePauseResume = () => {
    if (missionStatus === 'navigating' || missionStatus === 'exploring') {
      setMissionStatus('paused');
      setRoverState((r) => ({ ...r, isMoving: false, speed: 0 }));
      addEvent('movement_paused', 'Mission Paused', 'Rover stopped by operator command.', 'warning');
    } else if (missionStatus === 'paused') {
      setMissionStatus(missionMode === 'autonomous_exploration' ? 'exploring' : 'navigating');
      setRoverState((r) => ({ ...r, isMoving: true }));
      addEvent('movement_resumed', 'Mission Resumed', 'Rover continuing waypoint traversal.', 'info');
    }
  };

  const handleCancelMission = () => {
    completeMission('cancelled', 'Mission manually aborted by operator.');
  };

  // Reset Simulation to Clean State
  const handleResetSimulation = useCallback(() => {
    setMissionStatus('idle');
    setDynamicObstacles([]);
    navGrid.clearDynamicObstacles();
    energyModelRef.current.reset(100);

    const resetPos = navGrid.gridToWorld(startGridPos.x, startGridPos.y);
    setRoverState({
      worldPos: resetPos,
      gridPos: startGridPos,
      heading: 0,
      pitch: 0,
      roll: 0,
      speed: 0,
      targetSpeed: DEFAULT_ROVER_CONFIG.maxSpeed,
      wheelRotation: 0,
      mastAngle: 0,
      isMoving: false,
      statusText: 'Simulation reset. Ready at landing site.',
    });

    setTelemetry({
      timestamp: Date.now(),
      position: resetPos,
      gridCoord: startGridPos,
      headingDeg: 0,
      pitchDeg: 0,
      rollDeg: 0,
      speed: 0,
      batteryPercent: 100,
      totalDistanceTraveled: 0,
      estimatedEnergyConsumedWh: 0,
      currentWaypointIdx: 0,
      totalWaypoints: 0,
      remainingDistance: 0,
      hazardDetectionsCount: 0,
      replanEventsCount: 0,
      sciencePOIsVisited: 0,
      explorationCoveragePercent: navGrid.getExplorationCoveragePercent(),
      isBatteryLow: false,
      isBatteryCritical: false,
    });

    setTelemetryHistory([]);
    setWaypoints([]);
    setTargetCoord({ x: 26, y: 26 });
    setIsReplanned(false);
    setActiveScenarioId(undefined);

    // Reset POIs
    setPois(terrainModel.pois.map((p) => ({ ...p, visited: false })));

    addEvent('mission_init', 'Simulation Reset', 'Simulation restored to clean landing state (Battery: 100%, Seed: ' + currentSeed + ').', 'info');
  }, [navGrid, startGridPos, terrainModel.pois, currentSeed, addEvent]);

  // Load Test Scenario Preset
  const handleSelectScenario = useCallback(
    (scenario: ScenarioPreset) => {
      handleResetSimulation();
      setActiveScenarioId(scenario.id);

      // Set rover start pos
      const startWp = navGrid.gridToWorld(scenario.startGrid.x, scenario.startGrid.y);
      setRoverState((r) => ({
        ...r,
        worldPos: startWp,
        gridPos: scenario.startGrid,
      }));

      setStrategy(scenario.strategy);
      setMissionMode(scenario.mode);
      energyModelRef.current.reset(scenario.initialBattery);

      if (scenario.targetGrid) {
        setTargetCoord(scenario.targetGrid);
      }

      addEvent(
        'mission_init',
        `Loaded Scenario: ${scenario.name}`,
        `${scenario.description} Strategy: ${scenario.strategy.toUpperCase()}.`,
        'info'
      );
    },
    [handleResetSimulation, navGrid, addEvent]
  );

  // Main Simulation Movement & Physics Update Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const deltaSec = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if ((missionStatus === 'navigating' || missionStatus === 'exploring') && roverState.isMoving) {
        if (waypoints.length > 0 && currentWaypointIdx < waypoints.length) {
          const currentTargetWp = waypoints[currentWaypointIdx];
          const currPos = roverState.worldPos;

          const dx = currentTargetWp.worldX - currPos.x;
          const dz = currentTargetWp.worldZ - currPos.z;
          const distToWp = Math.hypot(dx, dz);

          // Desired heading (yaw)
          const targetHeading = Math.atan2(dx, dz);
          let headingDiff = targetHeading - roverState.heading;
          while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
          while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;

          const turnSpeed = DEFAULT_ROVER_CONFIG.turnRate * speedMultiplier * deltaSec;
          const newHeading =
            Math.abs(headingDiff) < turnSpeed
              ? targetHeading
              : roverState.heading + Math.sign(headingDiff) * turnSpeed;

          // Move toward waypoint
          const moveSpeed = DEFAULT_ROVER_CONFIG.maxSpeed * speedMultiplier;
          const stepDist = Math.min(moveSpeed * deltaSec, distToWp);

          let newX = currPos.x;
          let newZ = currPos.z;

          if (Math.abs(headingDiff) < 0.6) {
            newX += Math.sin(newHeading) * stepDist;
            newZ += Math.cos(newHeading) * stepDist;
          }

          // Sample terrain height & surface normal
          const newY = terrainModel.getHeightAt(newX, newZ);
          const normal = terrainModel.getNormalAt(newX, newZ);

          // Calculate Pitch & Roll from surface normal
          const normalPitch = Math.atan2(-normal[2], normal[1]);
          const normalRoll = Math.atan2(normal[0], normal[1]);

          // Update wheel rotation
          const wheelTurn = roverState.wheelRotation + (stepDist / (DEFAULT_ROVER_CONFIG.wheelDiameter / 2));

          // Step Energy Model
          const stepSlopeDeg = (Math.abs(normalPitch) * 180) / Math.PI;
          const energyResult = energyModelRef.current.step(
            deltaSec,
            stepDist,
            stepSlopeDeg,
            Math.abs(headingDiff) > 0.1
          );

          // Update Metrics
          missionMetricsRef.current.distanceTraveled += stepDist;
          if (stepSlopeDeg > missionMetricsRef.current.maxSlopeTraversed) {
            missionMetricsRef.current.maxSlopeTraversed = stepSlopeDeg;
          }

          // Check if battery depleted
          if (energyResult.isCriticalBattery) {
            completeMission(
              'failed',
              'Rover battery critically depleted (<10%). Halting to preserve avionics.'
            );
            return;
          }

          // Mark explored footprint
          const currentGridCoord = navGrid.worldToGrid(newX, newZ);
          navGrid.markExplored(currentGridCoord.x, currentGridCoord.y, 3);

          // Check Scientific POIs proximity
          pois.forEach((poi) => {
            if (!poi.visited) {
              const dToPoi = Math.hypot(newX - poi.world.x, newZ - poi.world.z);
              if (dToPoi < 2.8) {
                poi.visited = true;
                missionMetricsRef.current.visitedPois.add(poi.id);
                addEvent(
                  'poi_discovered',
                  `Science Discovery: ${poi.name}`,
                  `${poi.description} (+${poi.scientificValue} pts)`,
                  'success'
                );
              }
            }
          });

          // Check if waypoint reached
          let nextIdx = currentWaypointIdx;
          if (distToWp < 0.5) {
            nextIdx = currentWaypointIdx + 1;
            setCurrentWaypointIdx(nextIdx);

            if (nextIdx >= waypoints.length) {
              // Final destination reached
              if (missionMode === 'target_navigation') {
                completeMission('completed', 'Rover arrived safely at destination coordinates.');
              } else if (missionMode === 'autonomous_exploration') {
                // Pick next frontier!
                setTimeout(() => {
                  dispatchNextFrontier();
                }, 400);
              }
            }
          }

          // Update Rover State
          setRoverState({
            worldPos: { x: newX, y: newY, z: newZ },
            gridPos: currentGridCoord,
            heading: newHeading,
            pitch: normalPitch,
            roll: normalRoll,
            speed: moveSpeed,
            targetSpeed: moveSpeed,
            wheelRotation: wheelTurn,
            mastAngle: Math.sin(currentTime * 0.002) * 0.4,
            isMoving: true,
            statusText: `Navigating to WP ${nextIdx + 1}/${waypoints.length}`,
          });

          // Update Telemetry
          setTelemetry({
            timestamp: Date.now(),
            position: { x: newX, y: newY, z: newZ },
            gridCoord: currentGridCoord,
            headingDeg: Math.round(((newHeading * 180) / Math.PI + 360) % 360),
            pitchDeg: Math.round((normalPitch * 180) / Math.PI * 10) / 10,
            rollDeg: Math.round((normalRoll * 180) / Math.PI * 10) / 10,
            speed: moveSpeed,
            batteryPercent: energyResult.remainingPercent,
            totalDistanceTraveled: missionMetricsRef.current.distanceTraveled,
            estimatedEnergyConsumedWh: energyModelRef.current.getEnergyConsumedWh(),
            currentWaypointIdx: nextIdx,
            totalWaypoints: waypoints.length,
            remainingDistance: Math.max(0, distToWp),
            hazardDetectionsCount: missionMetricsRef.current.hazardCount,
            replanEventsCount: missionMetricsRef.current.replanCount,
            sciencePOIsVisited: missionMetricsRef.current.visitedPois.size,
            explorationCoveragePercent: navGrid.getExplorationCoveragePercent(),
            isBatteryLow: energyResult.isLowBattery,
            isBatteryCritical: energyResult.isCriticalBattery,
          });

          // Record telemetry history for chart (every ~0.5s or on major movement)
          setTelemetryHistory((prev) => {
            const last = prev[prev.length - 1];
            if (!last || missionMetricsRef.current.distanceTraveled - last.distance > 0.8) {
              return [
                ...prev.slice(-80),
                {
                  time: Math.round((Date.now() - missionMetricsRef.current.startTime) / 1000),
                  battery: energyResult.remainingPercent,
                  distance: Math.round(missionMetricsRef.current.distanceTraveled * 10) / 10,
                  speed: moveSpeed,
                },
              ];
            }
            return prev;
          });
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    missionStatus,
    roverState.isMoving,
    waypoints,
    currentWaypointIdx,
    speedMultiplier,
    terrainModel,
    navGrid,
    pois,
    missionMode,
    completeMission,
    dispatchNextFrontier,
    addEvent,
  ]);

  return (
    <div className="w-screen h-screen flex flex-col bg-lunar-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* 1. Space Mission Control Header */}
      <Header
        status={missionStatus}
        mode={missionMode}
        telemetry={telemetry}
        onOpenScenarios={() => setIsScenariosOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* 2. Main Simulation Viewport & Mission Control HUD Grid */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Left Side: Mission Control & Navigation Panels */}
        <div className="w-80 h-full p-3 flex flex-col gap-3 overflow-y-auto z-10 scrollbar-thin scrollbar-thumb-lunar-800">
          <MissionControlPanel
            status={missionStatus}
            mode={missionMode}
            targetCoord={targetCoord}
            isPlacingObstacle={isPlacingObstacle}
            onTogglePlaceObstacle={() => setIsPlacingObstacle(!isPlacingObstacle)}
            onStartMission={handleStartMission}
            onPauseResume={handlePauseResume}
            onCancelMission={handleCancelMission}
            onResetSimulation={handleResetSimulation}
            onStartAutonomousExploration={handleStartAutonomousExploration}
            onClearDynamicObstacles={handleClearDynamicObstacles}
            dynamicObstaclesCount={dynamicObstacles.length}
            currentSeed={currentSeed}
            onChangeSeed={(seed) => setCurrentSeed(seed)}
            onRandomizeSeed={() => setCurrentSeed(Math.floor(Math.random() * 90000) + 1000)}
          />

          <NavigationPanel
            strategy={strategy}
            onSelectStrategy={(s) => setStrategy(s)}
            pathComparison={pathComparison}
            speedMultiplier={speedMultiplier}
            onSpeedChange={(spd) => setSpeedMultiplier(spd)}
            showNavGrid={showNavGrid}
            onToggleNavGrid={() => setShowNavGrid(!showNavGrid)}
            showRiskHeatmap={showRiskHeatmap}
            onToggleRiskHeatmap={() => setShowRiskHeatmap(!showRiskHeatmap)}
            showExploredOverlay={showExploredOverlay}
            onToggleExploredOverlay={() => setShowExploredOverlay(!showExploredOverlay)}
            followRover={followRover}
            onToggleFollowRover={() => setFollowRover(!followRover)}
          />
        </div>

        {/* Center: Large 3D Lunar Simulation Viewport */}
        <div className="flex-1 h-full relative">
          <LunarCanvas
            terrainModel={terrainModel}
            navigationGrid={navGrid}
            roverState={roverState}
            waypoints={waypoints}
            targetCoord={targetCoord || undefined}
            isReplanned={isReplanned}
            dynamicObstacles={dynamicObstacles}
            pois={pois}
            showNavGrid={showNavGrid}
            showRiskHeatmap={showRiskHeatmap}
            showExploredOverlay={showExploredOverlay}
            followRover={followRover}
            onTerrainClick={handleTerrainClick}
            onRemoveObstacle={(id) => {
              navGrid.removeDynamicObstacle(id);
              setDynamicObstacles((prev) => prev.filter((o) => o.id !== id));
            }}
            onSelectPOI={(poi) => {
              addEvent(
                'poi_discovered',
                `POI Inspected: ${poi.name}`,
                `${poi.description} (Value: ${poi.scientificValue} pts)`,
                'info'
              );
            }}
          />

          {/* Dynamic Obstacle Placement Notification Banner */}
          {isPlacingObstacle && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-4 py-2 rounded-full font-mono text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce pointer-events-none z-20">
              <span>⚠ HAZARD PLACEMENT MODE: Click anywhere on 3D lunar terrain to drop a boulder</span>
            </div>
          )}
        </div>

        {/* Right Side: Telemetry HUD & Timestamped Event Log */}
        <div className="w-80 h-full p-3 flex flex-col gap-3 overflow-y-auto z-10 scrollbar-thin scrollbar-thumb-lunar-800">
          <TelemetryPanel telemetry={telemetry} status={missionStatus} />
          <EventLogPanel events={events} onClearLogs={() => setEvents([])} />
        </div>
      </div>

      {/* 3. Interactive Modals */}
      <ScenariosModal
        isOpen={isScenariosOpen}
        onClose={() => setIsScenariosOpen(false)}
        onSelectScenario={handleSelectScenario}
        activeScenarioId={activeScenarioId}
      />

      <AnalyticsPanel
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        telemetryHistory={telemetryHistory}
        missionHistory={missionHistory}
        onClearHistory={() => setMissionHistory([])}
      />

      <MissionReportModal
        isOpen={isReportOpen}
        report={currentReport || (missionHistory.length > 0 ? missionHistory[0] : null)}
        onClose={() => setIsReportOpen(false)}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default App;
