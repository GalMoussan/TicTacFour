import { useMemo } from 'react';
import * as THREE from 'three';

export default function GridFloor() {
  // Create grid helper only once using useMemo to prevent memory leaks
  const gridHelper = useMemo(() => {
    return new THREE.GridHelper(20, 20, '#00fff5', '#1a0828');
  }, []);

  return (
    <>
      {/* Main grid */}
      <primitive
        object={gridHelper}
        position={[0, -2, 0]}
      />

      {/* Glowing plane underneath */}
      <mesh position={[0, -2.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial
          color="#00fff5"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}
