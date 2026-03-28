import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlatBoard } from '../FlatBoard';
import { createEmptyBoard, makeMove } from '../../game/logic';

describe('FlatBoard', () => {
  it('renders a 4x4 grid of cells', () => {
    const board = createEmptyBoard();
    const onCellClick = vi.fn();

    const { container } = render(
      <FlatBoard
        layer={0}
        board={board}
        onCellClick={onCellClick}
        winningLine={null}
        isGameOver={false}
      />
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(16);
  });

  it('displays the correct layer label', () => {
    const board = createEmptyBoard();
    const onCellClick = vi.fn();

    render(
      <FlatBoard
        layer={0}
        board={board}
        onCellClick={onCellClick}
        winningLine={null}
        isGameOver={false}
      />
    );

    expect(screen.getByText(/Layer 1/)).toBeInTheDocument();
    expect(screen.getByText(/bottom/)).toBeInTheDocument();
  });

  it('calls onCellClick when an empty cell is clicked', () => {
    const board = createEmptyBoard();
    const onCellClick = vi.fn();

    const { container } = render(
      <FlatBoard
        layer={0}
        board={board}
        onCellClick={onCellClick}
        winningLine={null}
        isGameOver={false}
      />
    );

    const firstButton = container.querySelector('button');
    if (firstButton) {
      fireEvent.click(firstButton);
      expect(onCellClick).toHaveBeenCalledWith(0, 0, 0);
    }
  });

  it('does not call onCellClick when game is over', () => {
    const board = createEmptyBoard();
    const onCellClick = vi.fn();

    const { container } = render(
      <FlatBoard
        layer={0}
        board={board}
        onCellClick={onCellClick}
        winningLine={null}
        isGameOver={true}
      />
    );

    const firstButton = container.querySelector('button');
    if (firstButton) {
      fireEvent.click(firstButton);
      expect(onCellClick).not.toHaveBeenCalled();
    }
  });

  it('highlights winning cells', () => {
    let board = createEmptyBoard();
    board = makeMove(board, 0, 0, 0, 'X');
    board = makeMove(board, 0, 0, 1, 'X');
    const onCellClick = vi.fn();
    const winningLine: [number, number, number][] = [[0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 0, 3]];

    const { container } = render(
      <FlatBoard
        layer={0}
        board={board}
        onCellClick={onCellClick}
        winningLine={winningLine}
        isGameOver={true}
      />
    );

    const buttons = container.querySelectorAll('button');
    const firstButton = buttons[0];
    expect(firstButton.className).toContain('bg-yellow-500');
  });
});
