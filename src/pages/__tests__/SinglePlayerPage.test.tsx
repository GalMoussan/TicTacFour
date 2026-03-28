import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { SinglePlayerPage } from '../SinglePlayerPage';

// Mock the child components
vi.mock('../../components/GameInfo', () => ({
  GameInfo: () => <div data-testid="game-info">Game Info</div>,
}));

vi.mock('../../components/FlatBoard', () => ({
  FlatBoard: () => <div data-testid="flat-board">Flat Board</div>,
}));

vi.mock('../../components/Scene3D', () => ({
  Scene3D: () => <div data-testid="scene-3d">Scene 3D</div>,
}));

describe('SinglePlayerPage', () => {
  const renderWithRouter = () => {
    return render(
      <BrowserRouter>
        <SinglePlayerPage />
      </BrowserRouter>
    );
  };

  it('should render the page', () => {
    renderWithRouter();
    expect(screen.getByText('4×4×4 TIC-TAC-TOE')).toBeInTheDocument();
  });

  it('should render Back button', () => {
    renderWithRouter();
    const backButton = screen.getByText('← BACK');
    expect(backButton).toBeInTheDocument();
  });

  it('should render all game components', () => {
    renderWithRouter();

    // Check that game info and 3D scene are present
    expect(screen.getByTestId('game-info')).toBeInTheDocument();
    expect(screen.getByTestId('scene-3d')).toBeInTheDocument();

    // Check that all 4 layers are present (FlatBoard is rendered 4 times)
    const flatBoards = screen.getAllByTestId('flat-board');
    expect(flatBoards).toHaveLength(4);
  });

  it('should have proper layout structure', () => {
    const { container } = renderWithRouter();

    // Check main section exists
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();

    // Check grid layout is applied
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should apply correct styling classes', () => {
    const { container } = renderWithRouter();

    // Check root div has proper classes
    const rootDiv = container.firstChild;
    expect(rootDiv).toHaveClass('min-h-screen', 'bg-gray-900', 'text-white');
  });
});
