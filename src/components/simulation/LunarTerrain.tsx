import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GeneratedTerrainModel } from '../../core/terrainGenerator';
import { RockObstacle } from '../../types/terrain';

interface LunarTerrainProps {
  terrainModel: GeneratedTerrainModel;
  onTerrainClick?: (worldX: number, worldZ: number) => void;
}

export const LunarTerrain: React.FC<LunarTerrainProps> = ({
  terrainModel,
  onTerrainClick,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { config, heightMap, rocks } = terrainModel;
  const { gridSize, worldSize } = config;

  // Build high-resolution 3D Terrain Geometry from heightmap
  const { geometry, rockGeometries } = useMemo(() => {
    // Terrain mesh resolution: gridSize x gridSize vertices
    const segments = gridSize - 1;
    const geom = new THREE.PlaneGeometry(worldSize, worldSize, segments, segments);
    geom.rotateX(-Math.PI / 2); // Orient horizontal (XZ plane)

    const posAttr = geom.attributes.position;
    const count = posAttr.count;

    // Apply procedural heights to vertices
    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const y = terrainModel.getHeightAt(x, z);
      posAttr.setY(i, y);
    }

    geom.computeVertexNormals();

    // Prepare rock geometries
    const staticRocks = rocks.map((rock) => {
      const rockGeom = new THREE.DodecahedronGeometry(rock.radius, 1);
      // Slightly distort vertices for natural irregular boulder appearance
      const rPos = rockGeom.attributes.position;
      for (let j = 0; j < rPos.count; j++) {
        const rx = rPos.getX(j);
        const ry = rPos.getY(j);
        const rz = rPos.getZ(j);
        const noise = 1.0 + (Math.sin(rx * 5 + ry * 3) * 0.15);
        rPos.setXYZ(j, rx * noise, ry * noise * 0.85, rz * noise);
      }
      rockGeom.computeVertexNormals();
      return {
        id: rock.id,
        geometry: rockGeom,
        position: [rock.worldX, terrainModel.getHeightAt(rock.worldX, rock.worldZ) + rock.radius * 0.55, rock.worldZ] as [number, number, number],
      };
    });

    return { geometry: geom, rockGeometries: staticRocks };
  }, [terrainModel, gridSize, worldSize, rocks]);

  // Subtle lunar surface materials
  const terrainMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x8a8d91, // Authentic Lunar Regolith grey
      roughness: 0.92,
      metalness: 0.08,
      flatShading: false,
    });
  }, []);

  const rockMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x5a5d62, // Darker basaltic impact ejecta
      roughness: 0.88,
      metalness: 0.12,
    });
  }, []);

  // Raycast click handler to pick destinations on terrain
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (e.point && onTerrainClick) {
      onTerrainClick(e.point.x, e.point.z);
    }
  };

  return (
    <group>
      {/* Lunar Ground Mesh */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={terrainMaterial}
        receiveShadow
        castShadow
        onPointerDown={handlePointerDown}
      />

      {/* Static Lunar Rocks and Boulders */}
      {rockGeometries.map((r) => (
        <mesh
          key={r.id}
          geometry={r.geometry}
          material={rockMaterial}
          position={r.position}
          castShadow
          receiveShadow
        />
      ))}

      {/* Terrain Boundary Perimeter Markers */}
      <PerimeterBoundary worldSize={worldSize} />
    </group>
  );
};

// Subtle glowing edge markers outlining the surveyed exploration zone
const PerimeterBoundary: React.FC<{ worldSize: number }> = ({ worldSize }) => {
  const half = worldSize / 2;
  const lineObj = useMemo(() => {
    const points = [
      new THREE.Vector3(-half, 0.2, -half),
      new THREE.Vector3(half, 0.2, -half),
      new THREE.Vector3(half, 0.2, half),
      new THREE.Vector3(-half, 0.2, half),
      new THREE.Vector3(-half, 0.2, -half),
    ];
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.35, linewidth: 1.5 });
    return new THREE.Line(geom, mat);
  }, [half]);

  return <primitive object={lineObj} />;
};
