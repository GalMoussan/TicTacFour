import React, { useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
// TEMPORARILY DISABLED: EffectComposer causing crashes in multiplayer mode
// import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Board3D } from './Board3D';
import GridFloor from './3d/GridFloor';
import { GlassCard } from './ui';

interface PendingMove {
  layer: number;
  row: number;
  col: number;
}

interface Scene3DProps {
  onCellClick?: (z: number, y: number, x: number) => void;
  pendingMove?: PendingMove | null;
}

function Scene3DContent({ onCellClick, pendingMove = null }: Scene3DProps) {
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const mountedRef = useRef(false);

  /**
   * Handle WebGL context creation and setup context loss/restore handlers
   */
  const handleCreated = useCallback(({ gl }: { gl: any }) => {
    if (mountedRef.current) {
      console.warn('[Scene3D] Canvas recreated - this causes context loss!');
    }
    mountedRef.current = true;
    console.log('[Scene3D] Canvas created');

    glRef.current = gl.getContext();
    const canvas = gl.domElement;

    // Handle context lost event
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.error('[Scene3D] WebGL context lost - preventing default and waiting for restore');
    };

    // Handle context restored event
    const handleContextRestored = () => {
      console.log('[Scene3D] WebGL context restored');
      // Context will be automatically restored by React Three Fiber
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Cleanup listeners on unmount
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, []);

  return (
    <GlassCard glowColor="purple" className="p-0 relative border border-neon-purple/20 overflow-hidden w-full h-full max-h-full">
      <div className="w-full h-full max-h-full relative overflow-hidden">
        <Canvas
        onCreated={handleCreated}
        frameloop="always"
        dpr={[1, 2]}
        camera={{
          position: [8, 8, 8],
          fov: 50
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, #0a0118, #1a0828, #0a0118)',
          touchAction: 'none'
        }}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
          stencil: false,
          depth: true
        }}
        resize={{ scroll: false, debounce: 0 }}
      >
        {/* Enhanced Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} color="#a855f7" />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#00fff5" />

        {/* Grid Floor */}
        <GridFloor />

        {/* 3D Board */}
        <Board3D onCellClick={onCellClick} pendingMove={pendingMove} />

        {/* Camera Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={20}
          autoRotate={false}
          enableDamping={false}
          target={[0, 0, 0]}
        />

        {/* TEMPORARILY DISABLED: EffectComposer causing crashes in multiplayer mode
            Issue: "undefined is not an object (evaluating 'children2.length')"
            TODO: Investigate @react-three/postprocessing compatibility or alternative approach

        <EffectComposer>
          <Bloom
            intensity={0.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            radius={0.8}
          />
        </EffectComposer>
        */}
      </Canvas>
      </div>
    </GlassCard>
  );
}

// Memoize to prevent recreation when parent re-renders
export const Scene3D = React.memo(Scene3DContent, (prev, next) => {
  // Only re-render if these props actually change
  const onCellClickSame = prev.onCellClick === next.onCellClick;

  // Handle null pendingMove cases
  if (prev.pendingMove === null && next.pendingMove === null) {
    return onCellClickSame; // No change
  }
  if (prev.pendingMove === null || next.pendingMove === null) {
    return false; // Changed from null to value or vice versa
  }

  // Both are non-null, compare values
  const pendingMoveSame = prev.pendingMove.layer === next.pendingMove.layer &&
                          prev.pendingMove.row === next.pendingMove.row &&
                          prev.pendingMove.col === next.pendingMove.col;

  return onCellClickSame && pendingMoveSame;
});
