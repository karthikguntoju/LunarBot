import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoverState } from '../../types/rover';

interface VirtualRoverProps {
  roverState: RoverState;
}

export const VirtualRover: React.FC<VirtualRoverProps> = ({ roverState }) => {
  const roverGroupRef = useRef<THREE.Group>(null);
  const wheelsGroupRef = useRef<THREE.Group>(null);
  const mastRef = useRef<THREE.Group>(null);

  // Materials
  const chassisMaterial = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    metalness: 0.6,
    roughness: 0.35,
  });

  const goldFoilMaterial = new THREE.MeshStandardMaterial({
    color: 0xdfa012, // MLI gold thermal insulation
    metalness: 0.85,
    roughness: 0.25,
  });

  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f242d, // Dark titanium lunar regolith treads
    metalness: 0.5,
    roughness: 0.7,
  });

  const sensorMaterial = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 0.8,
  });

  const suspensionMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a5568,
    metalness: 0.7,
    roughness: 0.4,
  });

  // Synchronize 3D rover position, heading yaw, pitch, and roll
  useFrame((_, delta) => {
    if (!roverGroupRef.current) return;

    const group = roverGroupRef.current;
    const { worldPos, heading, pitch, roll, wheelRotation } = roverState;

    // Smooth position interpolation
    group.position.x = THREE.MathUtils.lerp(group.position.x, worldPos.x, 0.4);
    group.position.y = THREE.MathUtils.lerp(group.position.y, worldPos.y + 0.45, 0.4);
    group.position.z = THREE.MathUtils.lerp(group.position.z, worldPos.z, 0.4);

    // Apply Euler rotations: Yaw (heading), Pitch (slope), Roll (cross slope)
    const targetEuler = new THREE.Euler(pitch, heading, roll, 'YXZ');
    const targetQuat = new THREE.Quaternion().setFromEuler(targetEuler);
    group.quaternion.slerp(targetQuat, 0.25);

    // Rotate wheels
    if (wheelsGroupRef.current) {
      wheelsGroupRef.current.children.forEach((wheelMesh) => {
        wheelMesh.rotation.x = wheelRotation;
      });
    }

    // Gentle mast panning when scanning
    if (mastRef.current) {
      mastRef.current.rotation.y = roverState.mastAngle;
    }
  });

  // Wheel offsets: 6-wheel rocker-bogie layout
  // (Left 3, Right 3)
  const wheelPositions: Array<[number, number, number]> = [
    [-0.65, -0.15, 0.65],  // Front Left
    [0.65, -0.15, 0.65],   // Front Right
    [-0.7, -0.15, 0],      // Middle Left
    [0.7, -0.15, 0],       // Middle Right
    [-0.65, -0.15, -0.65], // Rear Left
    [0.65, -0.15, -0.65],  // Rear Right
  ];

  return (
    <group ref={roverGroupRef} position={[roverState.worldPos.x, roverState.worldPos.y + 0.45, roverState.worldPos.z]}>
      {/* 1. Main Avionics Chassis Deck */}
      <mesh material={chassisMaterial} castShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[0.9, 0.35, 1.2]} />
      </mesh>

      {/* Gold Thermal Blanket Cover on top deck */}
      <mesh material={goldFoilMaterial} position={[0, 0.34, 0]}>
        <boxGeometry args={[0.82, 0.04, 1.05]} />
      </mesh>

      {/* High-Gain Dish Antenna */}
      <mesh material={chassisMaterial} position={[-0.25, 0.45, -0.35]} rotation={[0.4, 0.3, 0]}>
        <cylinderGeometry args={[0.18, 0.02, 0.05, 16]} />
      </mesh>

      {/* 2. Elevated Sensor Mast & LiDAR */}
      <group ref={mastRef} position={[0.2, 0.35, 0.4]}>
        {/* Mast pole */}
        <mesh material={suspensionMaterial} position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
        </mesh>
        {/* Sensor head */}
        <mesh material={chassisMaterial} position={[0, 0.72, 0]}>
          <boxGeometry args={[0.24, 0.12, 0.16]} />
        </mesh>
        {/* Stereo Navigation Cameras */}
        <mesh material={sensorMaterial} position={[-0.07, 0.72, 0.09]}>
          <sphereGeometry args={[0.035, 12, 12]} />
        </mesh>
        <mesh material={sensorMaterial} position={[0.07, 0.72, 0.09]}>
          <sphereGeometry args={[0.035, 12, 12]} />
        </mesh>
        {/* LiDAR Scanning Turret */}
        <mesh material={suspensionMaterial} position={[0, 0.82, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 12]} />
        </mesh>
      </group>

      {/* 3. Rocker-Bogie Suspension Rods */}
      <group>
        {/* Left main rocker bar */}
        <mesh material={suspensionMaterial} position={[-0.55, 0, 0]} rotation={[0, 0, 0.05]}>
          <boxGeometry args={[0.06, 0.06, 1.3]} />
        </mesh>
        {/* Right main rocker bar */}
        <mesh material={suspensionMaterial} position={[0.55, 0, 0]} rotation={[0, 0, -0.05]}>
          <boxGeometry args={[0.06, 0.06, 1.3]} />
        </mesh>
      </group>

      {/* 4. Six Titanium Regolith Wheels */}
      <group ref={wheelsGroupRef}>
        {wheelPositions.map((pos, idx) => (
          <group key={idx} position={pos}>
            <mesh material={wheelMaterial} castShadow rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.18, 0.18, 0.14, 16]} />
            </mesh>
            {/* Wheel hub rim */}
            <mesh material={suspensionMaterial} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.08, 0.08, 0.15, 8]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 5. Dual LED Forward Headlights */}
      <spotLight
        position={[0.25, 0.25, 0.65]}
        target-position={[0.25, -0.5, 5]}
        intensity={2.8}
        distance={22}
        angle={0.45}
        penumbra={0.6}
        color={0xffffff}
        castShadow
      />
      <spotLight
        position={[-0.25, 0.25, 0.65]}
        target-position={[-0.25, -0.5, 5]}
        intensity={2.8}
        distance={22}
        angle={0.45}
        penumbra={0.6}
        color={0xffffff}
      />

      {/* Headlight glow bulbs */}
      <mesh material={sensorMaterial} position={[0.25, 0.25, 0.62]}>
        <sphereGeometry args={[0.04, 8, 8]} />
      </mesh>
      <mesh material={sensorMaterial} position={[-0.25, 0.25, 0.62]}>
        <sphereGeometry args={[0.04, 8, 8]} />
      </mesh>

      {/* 6. Forward Navigation Direction Indicator Arrow */}
      <group position={[0, -0.2, 0.85]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <coneGeometry args={[0.15, 0.35, 4]} />
          <meshBasicMaterial color={0x00f0ff} transparent opacity={0.7} />
        </mesh>
      </group>
    </group>
  );
};
