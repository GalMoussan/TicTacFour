/**
 * useRoom Hook - Room Lifecycle Management for Multiplayer Games
 *
 * This hook manages room creation, joining, and player role assignment using Ably's
 * real-time presence API. It automatically handles player roles based on join order:
 * - First player = Player X
 * - Second player = Player O
 * - Third+ players = Spectators
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { nanoid } from 'nanoid';
import type * as Ably from 'ably';
import { ablyClient } from './ably-client';
import { generateRoomId, validateRoomId } from './utils';
import type { PlayerRole, RoomState } from './types';

/**
 * Return type for the useRoom hook
 */
export interface UseRoomReturn {
  channel: Ably.RealtimeChannel | null;
  localPlayerId: string;
  playerRole: PlayerRole;
  roomState: RoomState;
  createRoom: () => Promise<string>;
  joinRoom: (id: string) => Promise<void>;
  leaveRoom: () => void;
  isConnected: boolean;
}

/**
 * Presence member data structure
 */
interface PresenceMemberData {
  role: PlayerRole;
}

/**
 * React hook for managing room lifecycle and player role assignment.
 */
export function useRoom(roomId: string | null): UseRoomReturn {
  // Generate stable local player ID using useMemo to avoid accessing during render
  const localPlayerId = useMemo(() => {
    return ablyClient.auth.clientId || nanoid();
  }, []);

  // Cleanup flag to prevent operations after unmount
  const isMountedRef = useRef(true);

  // Channel ref for cleanup without dependency issues
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  // Track player role in ref for presence updates
  const playerRoleRef = useRef<PlayerRole>(null);

  // Channel state
  const [channel, setChannel] = useState<Ably.RealtimeChannel | null>(null);
  const [playerRole, setPlayerRole] = useState<PlayerRole>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Keep playerRole ref in sync
  useEffect(() => {
    playerRoleRef.current = playerRole;
  }, [playerRole]);

  // Room state tracking
  const [roomState, setRoomState] = useState<RoomState>({
    roomId: '',
    playerXId: null,
    playerOId: null,
    spectatorIds: [],
    isActive: false,
  });

  /**
   * Determines player role based on current presence members
   */
  const determineRole = useCallback((members: Ably.PresenceMessage[]): PlayerRole => {
    const playerXExists = members.some(
      (m) => (m.data as PresenceMemberData)?.role === 'X'
    );
    const playerOExists = members.some(
      (m) => (m.data as PresenceMemberData)?.role === 'O'
    );

    if (!playerXExists) {
      return 'X';
    } else if (!playerOExists) {
      return 'O';
    } else {
      return 'spectator';
    }
  }, []);

  /**
   * Updates room state from presence members
   */
  const updateRoomState = useCallback((members: Ably.PresenceMessage[], currentRoomId: string) => {
    const playerX = members.find((m) => (m.data as PresenceMemberData)?.role === 'X');
    const playerO = members.find((m) => (m.data as PresenceMemberData)?.role === 'O');
    const spectators = members.filter((m) => (m.data as PresenceMemberData)?.role === 'spectator');

    setRoomState({
      roomId: currentRoomId,
      playerXId: playerX?.clientId || null,
      playerOId: playerO?.clientId || null,
      spectatorIds: spectators.map((s) => s.clientId),
      isActive: true,
    });
  }, []);

  /**
   * Handle presence updates (enter, leave, update)
   */
  const handlePresenceUpdate = useCallback(
    async (currentChannel: Ably.RealtimeChannel, currentRoomId: string) => {
      try {
        const members = await currentChannel.presence.get();
        // CRITICAL FIX: Only update room state (tracks other players)
        // NEVER update our own role from presence events - it is set once on join
        updateRoomState(members, currentRoomId);
      } catch {
        // Presence update failed - component may be unmounting
      }
    },
    [updateRoomState]
  );

  /**
   * Joins a room channel and enters presence
   */
  const joinRoomChannel = useCallback(
    async (id: string) => {
      // Prevent duplicate channel subscriptions
      if (channelRef.current) {
        return;
      }

      // Check if component is still mounted
      if (!isMountedRef.current) {
        return;
      }

      // Get the channel
      const newChannel = ablyClient.channels.get(`room:${id}`);

      // Get current presence to determine role
      if (!isMountedRef.current) return;
      const members = await newChannel.presence.get();

      if (!isMountedRef.current) return;
      const role = determineRole(members);

      // Enter presence with role
      if (!isMountedRef.current) return;
      await newChannel.presence.enter({ role } as PresenceMemberData);

      // Subscribe to presence updates
      if (!isMountedRef.current) return;
      const presenceCallback = async () => {
        if (isMountedRef.current) {
          await handlePresenceUpdate(newChannel, id);
        }
      };

      newChannel.presence.subscribe(presenceCallback);

      // Update local state only if still mounted
      if (!isMountedRef.current) return;
      channelRef.current = newChannel;
      setChannel(newChannel);
      setPlayerRole(role);
      setIsConnected(true);

      // Update room state with current presence
      if (!isMountedRef.current) return;
      await handlePresenceUpdate(newChannel, id);
    },
    [determineRole, handlePresenceUpdate]
  );

  /**
   * Creates a new room and joins as Player X
   */
  const createRoom = useCallback(async (): Promise<string> => {
    const newRoomId = generateRoomId();
    await joinRoomChannel(newRoomId);
    return newRoomId;
  }, [joinRoomChannel]);

  /**
   * Joins an existing room with the given ID
   */
  const joinRoom = useCallback(
    async (id: string): Promise<void> => {
      if (!validateRoomId(id)) {
        throw new Error('Invalid room ID');
      }
      await joinRoomChannel(id);
    },
    [joinRoomChannel]
  );

  /**
   * Leaves the current room and cleans up
   */
  const leaveRoom = useCallback(() => {
    const currentChannel = channelRef.current;

    if (!currentChannel) {
      return;
    }

    // 1. Unsubscribe from presence updates first (synchronous)
    currentChannel.presence.unsubscribe();

    // 2. Leave presence and detach channel with proper ordering
    currentChannel.presence
      .leave()
      .then(() => {
        return currentChannel.detach();
      })
      .catch((error: { code?: number }) => {
        // Ignore expected "channel detached" errors (code 90001)
        if (error?.code !== 90001) {
          // Error during cleanup - ignored
        }
      });

    // Reset state immediately (synchronous)
    channelRef.current = null;
    setChannel(null);
    setPlayerRole(null);
    setIsConnected(false);
    setRoomState({
      roomId: '',
      playerXId: null,
      playerOId: null,
      spectatorIds: [],
      isActive: false,
    });
  }, []); // Empty deps - all state accessed via refs

  /**
   * Effect to manage mounted state
   */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Effect to handle roomId prop changes
   */
  useEffect(() => {
    if (roomId) {
      // Validate and join the room
      if (validateRoomId(roomId)) {
        // eslint-disable-next-line
        joinRoomChannel(roomId).catch(() => {
          // Failed to join room - component may be unmounting
        });
      }
    }

    // Cleanup on unmount or when roomId changes
    return () => {
      // CRITICAL FIX: Only cleanup if component is unmounting
      if (!isMountedRef.current) {
        leaveRoom();
      }
    };
    // Only depend on roomId - functions are stable via useCallback
  }, [roomId]);

  return {
    channel,
    localPlayerId,
    playerRole,
    roomState,
    createRoom,
    joinRoom,
    leaveRoom,
    isConnected,
  };
}
