import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Waypoint, GridCoord } from '../../types/navigation';

interface PathVisualizerProps {
  waypoints: Waypoint[];
  targetCoord?: GridCoord;
  isReplanned?: boolean;
}

export const PathVisualizer: React.FC<PathVisualizerProps> = ({
  waypoints,
  targetCoord,
  isReplanned = false,
}) => {
  const beaconRef = useRef<THREE.Group>(null);

  // 1. Path Line Object
  const { pathLineObject, waypointPoints } = useMemo(() => {
    if (!waypoints || waypoints.length === 0) {
      return { pathLineObject: null, waypointPoints: [] };
    }

    const points = waypoints.map((wp) => new THREE.Vector3(wp.worldX, wp.worldY + 0.18, wp.worldZ));
    const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: isReplanned ? 0xffb703 : 0x00f0ff,
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
    });
    const lineObj = new THREE.Line(lineGeom, lineMat);

    return { pathLineObject: lineObj, waypointPoints: points };
  }, [waypoints, isReplanned]);

  // Destination Beacon animation
  useFrame((state) => {
    if (beaconRef.current) {
      const time = state.clock.getElapsedTime();
      beaconRef.current.position.y = Math.sin(time * 3) * 0.2;
    }
  });

  const lastWp = waypoints.length > 0 ? waypoints[waypoints.length - 1] : null;

  return (
    <group>
      {/* Waypoint Trajectory Line */}
      {pathLineObject && <primitive object={pathLineObject} />}

      {/* Small glowing nodes at each waypoint */}
      {waypointPoints.map((pt, idx) => (
        <mesh key={idx} position={[pt.x, pt.y, pt.z]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial
            color={idx === waypointPoints.length - 1 ? 0x00f59b : 0x00f0ff}
          />
        </mesh>
      ))}

      {/* Final Destination Target Beacon */}
      {lastWp && (
        <group position={[lastWp.worldX, lastWp.worldY + 0.3, lastWp.worldZ]}>
          {/* Animated floating marker pin */}
          <group ref={beaconRef} position={[0, 1.2, 0]}>
            <mesh rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.4, 0.9, 16]} />
              <meshStandardMaterial
                color={0x00f59b}
                emissive={0x00f59b}
                emissiveIntensity={0.6}
              />
            </mesh>
          </group>

          {/* Ground target ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <ringGeometry args={[0.6, 0.85, 32]} />
            <meshBasicMaterial color={0x00f59b} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <ringGeometry args={[1.1, 1.25, 32]} />
            <meshBasicMaterial color={0x00f59b} transparent opacity={0.35} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
};
