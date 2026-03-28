import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleRingProps {
  color: string;
  radius?: number;
  particleCount?: number;
}

export default function ParticleRing({
  color,
  radius = 0.6,
  particleCount = 20
}: ParticleRingProps) {
  const particlesRef = useRef<THREE.Points>(null);

  // Memoize particle positions to prevent recreation on every render
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = 0;
    }
    return pos;
  }, [particleCount, radius]);

  // Rotate ring
  useFrame((_state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}
