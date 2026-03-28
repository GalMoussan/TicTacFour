import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from '../HomePage';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('HomePage', () => {
  it('renders the page title', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByText('4×4×4 TIC-TAC-TOE')).toBeInTheDocument();
  });

  it('renders single player button', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByText('SINGLE PLAYER')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
  });

  it('renders multiplayer button', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByText('MULTIPLAYER')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join battle/i })).toBeInTheDocument();
  });

  it('renders how to play section', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByText('HOW TO PLAY')).toBeInTheDocument();
    expect(screen.getByText('OBJECTIVE')).toBeInTheDocument();
    expect(screen.getByText('GAMEPLAY')).toBeInTheDocument();
  });

  it('navigates to single player when button is clicked', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /start game/i });
    button.click();

    expect(mockNavigate).toHaveBeenCalledWith('/single-player');
  });

  it('navigates to multiplayer when button is clicked', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /join battle/i });
    button.click();

    expect(mockNavigate).toHaveBeenCalledWith('/multiplayer');
  });
});
