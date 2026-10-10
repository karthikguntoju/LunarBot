import React from 'react';
import * as THREE from 'three';
import { RockObstacle } from '../../types/terrain';
import { GeneratedTerrainModel } from '../../core/terrainGenerator';

interface DynamicObstacleVisualizerProps {
  dynamicObstacles: RockObstacle[];
  terrainModel: GeneratedTerrainModel;
  onRemoveObstacle?: (id: string) => void;
}

export const DynamicObstacleVisualizer: React.FC<DynamicObstacleVisualizerProps> = ({
  dynamicObstacles,
  terrainModel,
  onRemoveObstacle,
}) => {
  const obstacleMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3366, // High-visibility hazard red/crimson
    roughness: 0.8,
    metalness: 0.2,
  });

  return (
    <group>
      {dynamicObstacles.map((obstacle) => {
        const groundY = terrainModel.getHeightAt(obstacle.worldX, obstacle.worldZ);

        return (
          <group
            key={obstacle.id}
            position={[obstacle.worldX, groundY, obstacle.worldZ]}
            onClick={(e) => {
              e.stopPropagation();
              if (onRemoveObstacle) onRemoveObstacle(obstacle.id);
            }}
          >
            {/* Dynamic Boulder Mesh */}
            <mesh
              position={[0, obstacle.radius * 0.7, 0]}
              material={obstacleMaterial}
              castShadow
            >
              <dodecahedronGeometry args={[obstacle.radius, 1]} />
            </mesh>

            {/* Pulsing Hazard Perimeter Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
              <ringGeometry args={[obstacle.radius + 0.4, obstacle.radius + 0.7, 24]} />
              <meshBasicMaterial
                color={0xff3366}
                transparent
                opacity={0.7}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Warning Beacon floating above */}
            <mesh position={[0, obstacle.radius * 1.8 + 0.5, 0]}>
              <octahedronGeometry args={[0.35, 0]} />
              <meshBasicMaterial color={0xff3366} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
