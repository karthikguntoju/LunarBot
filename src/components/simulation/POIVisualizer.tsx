import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { ScientificPOI } from '../../types/terrain';

interface POIVisualizerProps {
  pois: ScientificPOI[];
  onSelectPOI?: (poi: ScientificPOI) => void;
}

export const POIVisualizer: React.FC<POIVisualizerProps> = ({ pois, onSelectPOI }) => {
  return (
    <group>
      {pois.map((poi) => (
        <POIMarker key={poi.id} poi={poi} onSelect={() => onSelectPOI?.(poi)} />
      ))}
    </group>
  );
};

const POIMarker: React.FC<{ poi: ScientificPOI; onSelect: () => void }> = ({ poi, onSelect }) => {
  const beaconRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (beaconRef.current) {
      const t = state.clock.getElapsedTime();
      beaconRef.current.position.y = 1.8 + Math.sin(t * 2 + poi.world.x) * 0.15;
      beaconRef.current.rotation.y = t * 0.8;
    }
  });

  const markerColor = poi.visited ? 0x00f59b : 0x00f0ff;

  return (
    <group position={[poi.world.x, poi.world.y, poi.world.z]}>
      {/* Vertical light pillar */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2.0, 8]} />
        <meshBasicMaterial color={markerColor} transparent opacity={0.6} />
      </mesh>

      {/* Floating Rotating Beacon Diamond */}
      <group ref={beaconRef} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        <mesh>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial
            color={markerColor}
            emissive={markerColor}
            emissiveIntensity={0.8}
          />
        </mesh>

        {/* 2D HUD Card floating above 3D beacon */}
        <Html position={[0, 0.6, 0]} center distanceFactor={24}>
          <div
            onClick={onSelect}
            className={`px-2 py-1 rounded text-[10px] font-mono font-medium whitespace-nowrap cursor-pointer transition-all border shadow-lg ${
              poi.visited
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                : 'bg-lunar-900/90 text-telemetry-cyan border-cyan-500/40 hover:bg-lunar-800'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>{poi.visited ? '✓' : '✦'}</span>
              <span>{poi.name}</span>
              <span className="opacity-70">[{poi.scientificValue}pts]</span>
            </div>
          </div>
        </Html>
      </group>

      {/* Ground target concentric ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.7, 0.9, 16]} />
        <meshBasicMaterial color={markerColor} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
