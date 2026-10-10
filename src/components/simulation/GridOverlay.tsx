import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { NavigationGrid } from '../../core/navigationGrid';

interface GridOverlayProps {
  grid: NavigationGrid;
  showNavGrid: boolean;
  showRiskHeatmap: boolean;
  showExploredOverlay: boolean;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({
  grid,
  showNavGrid,
  showRiskHeatmap,
  showExploredOverlay,
}) => {
  const { gridSize, cellSize, cells } = grid;

  // 1. Navigation Grid Wireframe
  const gridLines = useMemo(() => {
    if (!showNavGrid) return null;

    const points: THREE.Vector3[] = [];
    const halfWorld = grid.worldSize / 2;

    // Grid row lines
    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize - 1; gx++) {
        const c1 = cells[gy][gx];
        const c2 = cells[gy][gx + 1];
        points.push(new THREE.Vector3(c1.worldX, c1.worldY + 0.05, c1.worldZ));
        points.push(new THREE.Vector3(c2.worldX, c2.worldY + 0.05, c2.worldZ));
      }
    }

    // Grid column lines
    for (let gx = 0; gx < gridSize; gx++) {
      for (let gy = 0; gy < gridSize - 1; gy++) {
        const c1 = cells[gy][gx];
        const c2 = cells[gy + 1][gx];
        points.push(new THREE.Vector3(c1.worldX, c1.worldY + 0.05, c1.worldZ));
        points.push(new THREE.Vector3(c2.worldX, c2.worldY + 0.05, c2.worldZ));
      }
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [grid, showNavGrid, gridSize, cells]);

  // 2. Risk Heatmap using InstancedMesh for max 60FPS performance
  const riskInstancedRef = useRef<THREE.InstancedMesh>(null);
  const riskCellData = useMemo(() => {
    if (!showRiskHeatmap) return [];

    const data: Array<{
      x: number;
      y: number;
      z: number;
      color: THREE.Color;
      scale: number;
    }> = [];

    const safeColor = new THREE.Color(0x00f59b);
    const modColor = new THREE.Color(0xffb703);
    const highColor = new THREE.Color(0xff6b35);
    const blockedColor = new THREE.Color(0xd90429);

    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        const cell = cells[gy][gx];
        let color = safeColor;

        if (cell.riskLevel === 'blocked') {
          color = blockedColor;
        } else if (cell.riskLevel === 'high') {
          color = highColor;
        } else if (cell.riskLevel === 'moderate') {
          color = modColor;
        } else {
          // Skip drawing 'safe' tiles if desired to avoid visual clutter, or draw faintly
          continue;
        }

        data.push({
          x: cell.worldX,
          y: cell.worldY + 0.08,
          z: cell.worldZ,
          color,
          scale: cellSize * 0.88,
        });
      }
    }

    return data;
  }, [grid, showRiskHeatmap, gridSize, cellSize, cells]);

  useEffect(() => {
    if (!riskInstancedRef.current || riskCellData.length === 0) return;

    const dummy = new THREE.Object3D();
    const inst = riskInstancedRef.current;

    riskCellData.forEach((tile, i) => {
      dummy.position.set(tile.x, tile.y, tile.z);
      dummy.rotation.x = -Math.PI / 2;
      dummy.scale.set(tile.scale, tile.scale, 1);
      dummy.updateMatrix();

      inst.setMatrixAt(i, dummy.matrix);
      inst.setColorAt(i, tile.color);
    });

    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  }, [riskCellData]);

  // 3. Explored Region Overlay
  const exploredInstancedRef = useRef<THREE.InstancedMesh>(null);
  const exploredCellData = useMemo(() => {
    if (!showExploredOverlay) return [];

    const data: Array<{ x: number; y: number; z: number }> = [];

    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        const cell = cells[gy][gx];
        if (cell.isExplored) {
          data.push({
            x: cell.worldX,
            y: cell.worldY + 0.06,
            z: cell.worldZ,
          });
        }
      }
    }

    return data;
  }, [grid, showExploredOverlay, gridSize, cells]);

  useEffect(() => {
    if (!exploredInstancedRef.current || exploredCellData.length === 0) return;

    const dummy = new THREE.Object3D();
    const inst = exploredInstancedRef.current;
    const exploredTileScale = cellSize * 0.95;

    exploredCellData.forEach((tile, i) => {
      dummy.position.set(tile.x, tile.y, tile.z);
      dummy.rotation.x = -Math.PI / 2;
      dummy.scale.set(exploredTileScale, exploredTileScale, 1);
      dummy.updateMatrix();

      inst.setMatrixAt(i, dummy.matrix);
    });

    inst.instanceMatrix.needsUpdate = true;
  }, [exploredCellData, cellSize]);

  return (
    <group>
      {/* 1. Wireframe Navigation Grid */}
      {showNavGrid && gridLines && (
        <lineSegments geometry={gridLines}>
          <lineBasicMaterial color={0x526078} transparent opacity={0.25} />
        </lineSegments>
      )}

      {/* 2. Risk Heatmap Tiles */}
      {showRiskHeatmap && riskCellData.length > 0 && (
        <instancedMesh
          ref={riskInstancedRef}
          args={[undefined, undefined, riskCellData.length]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent opacity={0.45} depthWrite={false} />
        </instancedMesh>
      )}

      {/* 3. Explored Sensor Footprint Tiles */}
      {showExploredOverlay && exploredCellData.length > 0 && (
        <instancedMesh
          ref={exploredInstancedRef}
          args={[undefined, undefined, exploredCellData.length]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color={0x00f0ff} transparent opacity={0.28} depthWrite={false} />
        </instancedMesh>
      )}
    </group>
  );
};
