import { nanoid } from 'nanoid';

/**
 * Generates a unique room identifier using nanoid.
 * Returns an 8-character alphanumeric string.
 */
export function generateRoomId(): string {
  return nanoid(8);
}

/**
 * Validates that a room ID is properly formatted.
 * A valid room ID must be exactly 8 alphanumeric characters.
 *
 * @param id - The room ID to validate
 * @returns true if the ID is valid, false otherwise
 */
export function validateRoomId(id: string): boolean {
  if (typeof id !== 'string') {
    return false;
  }

  if (id.length !== 8) {
    return false;
  }

  return /^[a-zA-Z0-9]{8}$/.test(id);
}
