import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { GeneratedTerrainModel } from '../../core/terrainGenerator';
import { NavigationGrid } from '../../core/navigationGrid';
import { RoverState } from '../../types/rover';
import { Waypoint, GridCoord } from '../../types/navigation';
import { RockObstacle, ScientificPOI } from '../../types/terrain';
import { LunarTerrain } from './LunarTerrain';
import { VirtualRover } from './VirtualRover';
import { GridOverlay } from './GridOverlay';
import { PathVisualizer } from './PathVisualizer';
import { DynamicObstacleVisualizer } from './DynamicObstacleVisualizer';
import { POIVisualizer } from './POIVisualizer';

interface LunarCanvasProps {
  terrainModel: GeneratedTerrainModel;
  navigationGrid: NavigationGrid;
  roverState: RoverState;
  waypoints: Waypoint[];
  targetCoord?: GridCoord;
  isReplanned?: boolean;
  dynamicObstacles: RockObstacle[];
  pois: ScientificPOI[];
  showNavGrid: boolean;
  showRiskHeatmap: boolean;
  showExploredOverlay: boolean;
  followRover: boolean;
  onTerrainClick: (worldX: number, worldZ: number) => void;
  onRemoveObstacle: (id: string) => void;
  onSelectPOI: (poi: ScientificPOI) => void;
}

// Camera controller that smoothly tracks the rover when follow mode is active
const CameraController: React.FC<{ roverState: RoverState; followRover: boolean }> = ({
  roverState,
  followRover,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useFrame(() => {
    if (!followRover || !controlsRef.current) return;

    const roverPos = roverState.worldPos;
    const controls = controlsRef.current;

    // Smoothly interpolate orbit controls target to rover position
    controls.target.x = THREE.MathUtils.lerp(controls.target.x, roverPos.x, 0.08);
    controls.target.y = THREE.MathUtils.lerp(controls.target.y, roverPos.y + 0.5, 0.08);
    controls.target.z = THREE.MathUtils.lerp(controls.target.z, roverPos.z, 0.08);

    // Keep camera following behind rover at fixed offset
    const heading = roverState.heading;
    const distanceBehind = 9.0;
    const heightAbove = 4.5;

    const targetCamX = roverPos.x - Math.sin(heading) * distanceBehind;
    const targetCamZ = roverPos.z - Math.cos(heading) * distanceBehind;
    const targetCamY = roverPos.y + heightAbove;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.05);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.05);

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={3}
      maxDistance={90}
      maxPolarAngle={Math.PI / 2 - 0.04} // Prevent camera going below terrain plane
    />
  );
};

export const LunarCanvas: React.FC<LunarCanvasProps> = ({
  terrainModel,
  navigationGrid,
  roverState,
  waypoints,
  targetCoord,
  isReplanned,
  dynamicObstacles,
  pois,
  showNavGrid,
  showRiskHeatmap,
  showExploredOverlay,
  followRover,
  onTerrainClick,
  onRemoveObstacle,
  onSelectPOI,
}) => {
  return (
    <div className="w-full h-full relative select-none bg-lunar-950">
      <Canvas
        shadows
        camera={{ position: [-25, 20, 25], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        {/* Airless space deep black background */}
        <color attach="background" args={['#050608']} />

        {/* Dense field of distant cosmic stars */}
        <Stars radius={120} depth={60} count={3500} factor={4} saturation={0} fade speed={0.5} />

        {/* Primary Harsh Lunar Solar Directional Light (low-angle sun) */}
        <directionalLight
          position={[40, 30, -35]}
          intensity={2.6}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={10}
          shadow-camera-far={120}
          shadow-camera-left={-45}
          shadow-camera-right={45}
          shadow-camera-top={45}
          shadow-camera-bottom={-45}
          shadow-bias={-0.0005}
        />

        {/* Faint Earthshine / Space Ambient Illumination */}
        <ambientLight intensity={0.18} color="#9cb2d6" />

        {/* Secondary faint rim light */}
        <directionalLight position={[-30, 15, 30]} intensity={0.25} color="#455470" />

        {/* Camera Tracking Controller */}
        <CameraController roverState={roverState} followRover={followRover} />

        {/* 3D Lunar Procedural Terrain */}
        <LunarTerrain terrainModel={terrainModel} onTerrainClick={onTerrainClick} />

        {/* 6-Wheeled Rover Model */}
        <VirtualRover roverState={roverState} />

        {/* Overlays: Risk Heatmap, Nav Grid, Explored Area */}
        <GridOverlay
          grid={navigationGrid}
          showNavGrid={showNavGrid}
          showRiskHeatmap={showRiskHeatmap}
          showExploredOverlay={showExploredOverlay}
        />

        {/* Planned A* Route Trajectory Ribbon */}
        <PathVisualizer
          waypoints={waypoints}
          targetCoord={targetCoord}
          isReplanned={isReplanned}
        />

        {/* Dynamic Obstacles (e.g. fallen boulders) */}
        <DynamicObstacleVisualizer
          dynamicObstacles={dynamicObstacles}
          terrainModel={terrainModel}
          onRemoveObstacle={onRemoveObstacle}
        />

        {/* Scientific Points of Interest */}
        <POIVisualizer pois={pois} onSelectPOI={onSelectPOI} />
      </Canvas>
    </div>
  );
};
