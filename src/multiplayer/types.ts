/**
 * Multiplayer Type Definitions
 *
 * Type-safe definitions for the multiplayer messaging system using
 * discriminated unions for compile-time type safety.
 */

/**
 * Player role in the game room
 */
export type PlayerRole = 'X' | 'O' | 'spectator' | null;

/**
 * Player symbol ('X' or 'O')
 */
export type PlayerSymbol = 'X' | 'O';

/**
 * Game status values
 */
export type GameStatus = 'waiting' | 'playing' | 'finished' | 'draw';

/**
 * 3D Board representation
 * Outer array: Z-axis (layers)
 * Middle array: Y-axis (rows)
 * Inner array: X-axis (columns)
 */
export type Board3D = (string | null)[][][];

/**
 * MOVE message payload
 */
export interface MovePayload {
  z: number;
  y: number;
  x: number;
  player: PlayerSymbol;
}

/**
 * JOIN message payload
 */
export interface JoinPayload {
  playerName?: string;
}

/**
 * SYNC_RESPONSE message payload
 */
export interface SyncResponsePayload {
  board: Board3D;
  currentPlayer: PlayerSymbol;
  gameStatus: string;
}

/**
 * Base message structure
 */
interface BaseMessage {
  timestamp: number;
  senderId: string;
}

/**
 * MOVE message - Player makes a move
 */
export interface MoveMessage extends BaseMessage {
  type: 'MOVE';
  payload: MovePayload;
}

/**
 * JOIN message - Player joins the room
 */
export interface JoinMessage extends BaseMessage {
  type: 'JOIN';
  payload: JoinPayload;
}

/**
 * SYNC_REQUEST message - Request current game state
 */
export interface SyncRequestMessage extends BaseMessage {
  type: 'SYNC_REQUEST';
}

/**
 * SYNC_RESPONSE message - Send current game state
 */
export interface SyncResponseMessage extends BaseMessage {
  type: 'SYNC_RESPONSE';
  payload: SyncResponsePayload;
}

/**
 * LEAVE message - Player leaves the room
 */
export interface LeaveMessage extends BaseMessage {
  type: 'LEAVE';
}

/**
 * REMATCH message - Request a rematch
 */
export interface RematchMessage extends BaseMessage {
  type: 'REMATCH';
}

/**
 * Discriminated union of all message types
 *
 * This allows TypeScript to narrow the type based on the 'type' field,
 * providing compile-time type safety when handling messages.
 */
export type GameMessage =
  | MoveMessage
  | JoinMessage
  | SyncRequestMessage
  | SyncResponseMessage
  | LeaveMessage
  | RematchMessage;

/**
 * Room state tracking interface
 */
export interface RoomState {
  roomId: string;
  playerXId: string | null;
  playerOId: string | null;
  spectatorIds: string[];
  isActive: boolean;
}

/**
 * Type guard to check if a message is a MOVE message
 */
export function isMoveMessage(message: GameMessage): message is MoveMessage {
  return message.type === 'MOVE';
}

/**
 * Type guard to check if a message is a JOIN message
 */
export function isJoinMessage(message: GameMessage): message is JoinMessage {
  return message.type === 'JOIN';
}

/**
 * Type guard to check if a message is a SYNC_REQUEST message
 */
export function isSyncRequestMessage(message: GameMessage): message is SyncRequestMessage {
  return message.type === 'SYNC_REQUEST';
}

/**
 * Type guard to check if a message is a SYNC_RESPONSE message
 */
export function isSyncResponseMessage(message: GameMessage): message is SyncResponseMessage {
  return message.type === 'SYNC_RESPONSE';
}

/**
 * Type guard to check if a message is a LEAVE message
 */
export function isLeaveMessage(message: GameMessage): message is LeaveMessage {
  return message.type === 'LEAVE';
}

/**
 * Type guard to check if a message is a REMATCH message
 */
export function isRematchMessage(message: GameMessage): message is RematchMessage {
  return message.type === 'REMATCH';
}

/**
 * Helper type for message handlers
 */
export type MessageHandler<T extends GameMessage = GameMessage> = (
  message: T,
  senderId: string
) => void | Promise<void>;

/**
 * Map of message type to handler
 */
export type MessageHandlerMap = {
  [K in GameMessage['type']]?: MessageHandler<Extract<GameMessage, { type: K }>>;
};
