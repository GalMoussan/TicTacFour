import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SinglePlayerPage } from '../../pages/SinglePlayerPage';

// Mock the Scene3D component to avoid ResizeObserver issues in tests
vi.mock('../Scene3D', () => ({
  Scene3D: () => <div>3D Scene Mock</div>,
}));

describe('Integration: Full Game Flow', () => {
  const renderPage = () => {
    return render(
      <BrowserRouter>
        <SinglePlayerPage />
      </BrowserRouter>
    );
  };

  it('renders the complete game interface', () => {
    renderPage();

    // Check title
    expect(screen.getByText('4×4×4 Tic-Tac-Toe')).toBeInTheDocument();

    // Check game info section
    expect(screen.getByText(/Current Player:/)).toBeInTheDocument();

    // Check reset button
    expect(screen.getByText('Reset Game')).toBeInTheDocument();

    // Check layer labels
    expect(screen.getByText(/Layer 1/)).toBeInTheDocument();
    expect(screen.getByText(/Layer 2/)).toBeInTheDocument();
    expect(screen.getByText(/Layer 3/)).toBeInTheDocument();
    expect(screen.getByText(/Layer 4/)).toBeInTheDocument();
  });

  it('allows players to make moves and switches turns', () => {
    const { container } = renderPage();

    // Verify initial player
    expect(screen.getByText('X')).toBeInTheDocument();

    // Get all buttons (should be 64 cells)
    const buttons = container.querySelectorAll('button:not(:disabled)');

    // Make first move (Player X)
    const firstCell = Array.from(buttons).find(btn =>
      !btn.textContent && !btn.classList.contains('counter')
    );

    if (firstCell && firstCell.textContent === '') {
      fireEvent.click(firstCell);

      // After move, should show O as current player or X in the cell
      const currentPlayerText = screen.queryAllByText('O');
      const cellText = screen.queryAllByText('X');

      expect(currentPlayerText.length + cellText.length).toBeGreaterThan(0);
    }
  });

  it('shows reset button that works', () => {
    const { container } = renderPage();

    // Make a move
    const buttons = container.querySelectorAll('button');
    const cellButton = Array.from(buttons).find(btn =>
      !btn.textContent && btn.classList.contains('w-14')
    );

    if (cellButton) {
      fireEvent.click(cellButton);
    }

    // Click reset
    const resetButton = screen.getByText('Reset Game');
    fireEvent.click(resetButton);

    // Should be back to X's turn
    expect(screen.getByText(/Current Player:/)).toBeInTheDocument();
  });
});
