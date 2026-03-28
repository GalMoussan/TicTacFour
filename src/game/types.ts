export type Player = 'X' | 'O' | null;

export type Position = [z: number, y: number, x: number];

export type WinResult = {
  winner: Player;
  line: Position[];
} | null;

export type Board = Player[][][];
