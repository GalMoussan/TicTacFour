import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WinningLineEffectProps {
  startPosition: [number, number, number];
  endPosition: [number, number, number];
}

export default function WinningLineEffect({
  startPosition,
  endPosition
}: WinningLineEffectProps) {
  const lineRef = useRef<THREE.Mesh>(null);

  // Memoize curve creation to prevent memory leaks
  const curve = useMemo(() => {
    const points = [
      new THREE.Vector3(...startPosition),
      new THREE.Vector3(...endPosition),
    ];
    return new THREE.CatmullRomCurve3(points);
  }, [startPosition, endPosition]);

  // Animate glow intensity
  useFrame((state) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 2 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
    }
  });

  return (
    <group>
      {/* Beam */}
      <mesh ref={lineRef}>
        <tubeGeometry args={[curve, 64, 0.05, 8, false]} />
        <meshStandardMaterial
          color="#ffd700"
          emissive="#ffd700"
          emissiveIntensity={2}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}
