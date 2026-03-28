import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleBurstProps {
  position: [number, number, number];
  color: string;
  onComplete?: () => void;
}

interface ParticleVelocity {
  x: number;
  y: number;
  z: number;
}

// Generate random velocities outside of render
function generateVelocities(count: number): ParticleVelocity[] {
  return Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 2,
    z: (Math.random() - 0.5) * 2,
  }));
}

export default function ParticleBurst({
  position,
  color,
  onComplete
}: ParticleBurstProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  const particleCount = 30;

  // Use null initially and initialize in useEffect to avoid impure function calls during render
  const velocitiesRef = useRef<ParticleVelocity[] | null>(null);

  // Initialize velocities once on mount
  useEffect(() => {
    if (!velocitiesRef.current) {
      velocitiesRef.current = generateVelocities(particleCount);
    }
  }, []);

  // Memoize initial positions to prevent recreation on every render
  const initialPositions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = position[0];
      pos[i * 3 + 1] = position[1];
      pos[i * 3 + 2] = position[2];
    }
    return pos;
  }, [position]);

  useFrame((_state, delta) => {
    if (particlesRef.current && velocitiesRef.current) {
      timeRef.current += delta;

      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = velocitiesRef.current;

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i].x * delta;
        positions[i * 3 + 1] += velocities[i].y * delta;
        positions[i * 3 + 2] += velocities[i].z * delta;
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;

      // Fade out
      const material = particlesRef.current.material as THREE.PointsMaterial;
      material.opacity = Math.max(0, 1 - timeRef.current * 2);

      // Cleanup after 0.5s
      if (timeRef.current > 0.5 && onComplete) {
        onComplete();
      }
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={initialPositions}
          itemSize={3}
          args={[initialPositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={color}
        transparent
        opacity={1}
        sizeAttenuation
      />
    </points>
  );
}
