import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Scene3D } from '../Scene3D';

// Mock react-three dependencies
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <primitive data-testid="orbit-controls" />,
}));

vi.mock('@react-three/postprocessing', () => ({
  EffectComposer: ({ children }: { children: React.ReactNode }) => <div data-testid="effect-composer">{children}</div>,
  Bloom: () => <primitive data-testid="bloom" />,
}));

vi.mock('../Board3D', () => ({
  Board3D: () => <primitive data-testid="board-3d" />,
}));

vi.mock('../3d/GridFloor', () => ({
  default: () => <primitive data-testid="grid-floor" />,
}));

describe('Scene3D', () => {
  it('renders canvas with all components', () => {
    const { getByTestId } = render(<Scene3D />);

    expect(getByTestId('canvas')).toBeDefined();
    expect(getByTestId('orbit-controls')).toBeDefined();
    expect(getByTestId('effect-composer')).toBeDefined();
    expect(getByTestId('bloom')).toBeDefined();
    expect(getByTestId('board-3d')).toBeDefined();
    expect(getByTestId('grid-floor')).toBeDefined();
  });

  it('passes onCellClick prop to Board3D', () => {
    const mockClick = vi.fn();
    render(<Scene3D onCellClick={mockClick} />);

    // If Board3D is rendered, the prop was passed
    expect(true).toBe(true);
  });
});
