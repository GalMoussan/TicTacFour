import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { isWinningCell } from '../game/utils';
import ParticleRing from './3d/ParticleRing';
import ParticleBurst from './3d/ParticleBurst';
import WinningLineEffect from './3d/WinningLineEffect';

interface PendingMove {
  layer: number;
  row: number;
  col: number;
}

interface Board3DProps {
  onCellClick?: (z: number, y: number, x: number) => void;
  pendingMove?: PendingMove | null;
}

interface ParticleBurstData {
  id: string;
  position: [number, number, number];
  color: string;
}

function Board3DContent({ onCellClick, pendingMove = null }: Board3DProps) {
  // Properly subscribe to individual state slices to ensure re-renders
  const board = useGameStore((state) => state.board);
  const winningLine = useGameStore((state) => state.winningLine);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const currentPlayer = useGameStore((state) => state.currentPlayer);
  const makeMove = useGameStore((state) => state.makeMove);

  // Track particle bursts
  const [particleBursts, setParticleBursts] = useState<ParticleBurstData[]>([]);

  // Check if there is any pending move (blocks all other cells)
  const hasPendingMove = pendingMove !== null;

  // Use custom onCellClick handler if provided, otherwise use store's makeMove
  const handleCellClick = onCellClick || makeMove;

  // Spacing between cells
  const spacing = 1.2;

  // Helper function to convert board coordinates to 3D position
  const getPositionFromCoords = (z: number, y: number, x: number): [number, number, number] => {
    return [
      x * spacing - 1.8,
      z * spacing - 1.8,
      y * spacing - 1.8
    ];
  };

  // Helper function to get winning line positions
  const getWinningLinePositions = (): { start: [number, number, number], end: [number, number, number] } | null => {
    if (!winningLine || winningLine.length === 0) return null;

    const start = winningLine[0];
    const end = winningLine[winningLine.length - 1];

    return {
      start: getPositionFromCoords(start[0], start[1], start[2]),
      end: getPositionFromCoords(end[0], end[1], end[2])
    };
  };

  const winningLinePositions = getWinningLinePositions();

  return (
    <group>
      {board.map((layer, z) =>
        layer.map((row, y) =>
          row.map((cell, x) => {
            const position: [number, number, number] = [
              x * spacing - 1.8,
              z * spacing - 1.8,
              y * spacing - 1.8
            ];

            const isWinner = isWinningCell(z, y, x, winningLine);
            const isPendingCell = pendingMove && pendingMove.layer === z && pendingMove.row === y && pendingMove.col === x;

            if (cell === null) {
              // Empty cell - show wireframe box with edges and add click handler
              return (
                <group key={`${z}-${y}-${x}`} position={position}>
                  <mesh
                    onClick={(e) => {
                      e.stopPropagation();

                      // Don't allow clicks if there's a pending move
                      if (hasPendingMove) return;

                      // Add particle burst
                      const burstId = `${Date.now()}-${z}-${y}-${x}`;
                      setParticleBursts(prev => [...prev, {
                        id: burstId,
                        position: position,
                        color: currentPlayer === 'X' ? '#00fff5' : '#ff00ff',
                      }]);

                      handleCellClick(z, y, x);
                    }}
                  >
                    <boxGeometry args={[0.8, 0.8, 0.8]} />
                    <meshBasicMaterial
                      color={isWinner ? '#ffd700' : '#00fff5'}
                      wireframe
                      opacity={0.3}
                      transparent
                    />
                  </mesh>

                  {/* Show pending move preview */}
                  {isPendingCell && currentPlayer && (
                    <mesh>
                      <sphereGeometry args={[0.4, 16, 16]} />
                      <meshStandardMaterial
                        color={currentPlayer === 'X' ? '#00fff5' : '#ff00ff'}
                        emissive={currentPlayer === 'X' ? '#00fff5' : '#ff00ff'}
                        emissiveIntensity={1.0}
                        metalness={0.8}
                        roughness={0.2}
                        opacity={0.5}
                        transparent
                      />
                    </mesh>
                  )}
                </group>
              );
            }

            // Occupied cell - show sphere with enhanced materials
            const color = cell === 'X' ? '#00fff5' : '#ff00ff';
            const emissiveIntensity = isWinner ? 2.5 : 1.5;
            const opacity = isGameOver && !isWinner ? 0.3 : 1;

            return (
              <group key={`${z}-${y}-${x}`} position={position}>
                <mesh>
                  <sphereGeometry args={[0.4, 16, 16]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={emissiveIntensity}
                    metalness={0.8}
                    roughness={0.2}
                    opacity={opacity}
                    transparent={opacity < 1}
                  />
                </mesh>
                {/* Add particle ring */}
                <ParticleRing color={color} radius={0.5} />
              </group>
            );
          })
        )
      )}

      {/* Render particle bursts */}
      {particleBursts.map(burst => (
        <ParticleBurst
          key={burst.id}
          position={burst.position}
          color={burst.color}
          onComplete={() => {
            setParticleBursts(prev => prev.filter(b => b.id !== burst.id));
          }}
        />
      ))}

      {/* Render winning line if game is won */}
      {winningLinePositions && (
        <WinningLineEffect
          startPosition={winningLinePositions.start}
          endPosition={winningLinePositions.end}
        />
      )}
    </group>
  );
}

export const Board3D = React.memo(Board3DContent);
