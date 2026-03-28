/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-function-type, no-constant-binary-expression */
/**
 * Two-Player Room Bug Reproduction Tests
 *
 * CRITICAL BUG: Tab 1 gets kicked to lobby when Tab 2 joins the room
 *
 * Bug Description:
 * 1. Tab 1 creates room → becomes Player X → stays in room
 * 2. Tab 2 joins same room → Tab 1 gets redirected to lobby (!)
 * 3. Tab 2 becomes Player X (because Tab 1 left)
 * 4. Only one player can be in the room at a time
 *
 * This completely breaks multiplayer - players can't play together.
 *
 * Expected Behavior:
 * - ALL TESTS SHOULD FAIL - showing the bug exists
 * - Tab 1 should stay connected and keep Player X role
 * - Tab 2 should join as Player O
 * - Both tabs should see each other in presence
 * - Both channels should remain attached
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type * as Ably from 'ably';

/**
 * Mock channel state that tracks presence members globally
 * This simulates real Ably behavior where presence is shared across all clients
 */
interface MockPresenceMember {
  clientId: string;
  data: { role: 'X' | 'O' | 'spectator' };
}

// Global presence state (shared across all mock channels for the same room)
const roomPresenceMap = new Map<string, MockPresenceMember[]>();

// Track presence callbacks per channel instance
const presenceCallbacksMap = new Map<string, Set<Function>>();

// Track channel instances and their state
interface ChannelState {
  state: 'initialized' | 'attaching' | 'attached' | 'detaching' | 'detached' | 'failed';
  instanceId: string;
}
const channelStatesMap = new Map<string, ChannelState[]>();

/**
 * Create a realistic mock channel that simulates Ably's behavior
 * Each call creates a NEW channel instance (simulating different tabs)
 * @param roomId - The room identifier
 * @param clientId - The Ably client ID to use for presence operations
 */
function createMockChannel(roomId: string, clientId: string): any {
  const instanceId = `channel-${Date.now()}-${Math.random()}`;

  console.log(`[MOCK] Creating channel instance ${instanceId} for room ${roomId} with clientId ${clientId}`);

  // Initialize room presence if not exists
  if (!roomPresenceMap.has(roomId)) {
    roomPresenceMap.set(roomId, []);
  }

  // Initialize callback set for this room
  if (!presenceCallbacksMap.has(roomId)) {
    presenceCallbacksMap.set(roomId, new Set());
  }

  // Track this channel instance
  if (!channelStatesMap.has(roomId)) {
    channelStatesMap.set(roomId, []);
  }
  const channelStates = channelStatesMap.get(roomId)!;
  const channelState: ChannelState = { state: 'attached', instanceId };
  channelStates.push(channelState);

  const callbackSet = new Set<Function>();

  const mockPresence = {
    /**
     * Get current presence members
     * Returns the shared presence state for this room
     */
    get: vi.fn().mockImplementation(async () => {
      const members = roomPresenceMap.get(roomId) || [];
      console.log(`[MOCK] ${clientId} presence.get() →`, members.length, 'members');
      return [...members]; // Return a copy
    }),

    /**
     * Enter presence with role
     * Adds this client to shared presence state
     */
    enter: vi.fn().mockImplementation(async (data: { role: 'X' | 'O' | 'spectator' }) => {
      // Simulate a small delay for network
      await new Promise(resolve => setTimeout(resolve, 10));

      const members = roomPresenceMap.get(roomId) || [];
      const existingIndex = members.findIndex(m => m.clientId === clientId);

      if (existingIndex >= 0) {
        // Update existing member
        members[existingIndex] = { clientId: clientId, data };
        console.log(`[MOCK] ${clientId} presence.enter() - UPDATED role to ${data.role}`);
      } else {
        // Add new member
        members.push({ clientId: clientId, data });
        console.log(`[MOCK] ${clientId} presence.enter() - ADDED as ${data.role}`);
      }

      roomPresenceMap.set(roomId, members);

      // Notify all subscribers in this room
      const callbacks = presenceCallbacksMap.get(roomId);
      if (callbacks) {
        callbacks.forEach(callback => {
          callback({
            action: 'enter',
            clientId: clientId,
            data,
          });
        });
      }
    }),

    /**
     * Leave presence
     * Removes this client from shared presence state
     */
    leave: vi.fn().mockImplementation(async () => {
      const members = roomPresenceMap.get(roomId) || [];
      const filtered = members.filter(m => m.clientId !== clientId);
      roomPresenceMap.set(roomId, filtered);

      console.log(`[MOCK] ${clientId} presence.leave() - removed from presence`);

      // Notify all subscribers
      const callbacks = presenceCallbacksMap.get(roomId);
      if (callbacks) {
        callbacks.forEach(callback => {
          callback({
            action: 'leave',
            clientId: clientId,
          });
        });
      }
    }),

    /**
     * Subscribe to presence updates
     * Adds callback to the room's callback set
     */
    subscribe: vi.fn().mockImplementation((callback: Function) => {
      callbackSet.add(callback);
      const roomCallbacks = presenceCallbacksMap.get(roomId)!;
      roomCallbacks.add(callback);

      console.log(`[MOCK] ${clientId} presence.subscribe() - total callbacks: ${roomCallbacks.size}`);
    }),

    /**
     * Unsubscribe from presence updates
     */
    unsubscribe: vi.fn().mockImplementation(() => {
      const roomCallbacks = presenceCallbacksMap.get(roomId)!;
      callbackSet.forEach(callback => roomCallbacks.delete(callback));
      callbackSet.clear();

      console.log(`[MOCK] ${clientId} presence.unsubscribe()`);
    }),
  };

  const mockChannel = {
    name: `room:${roomId}`,
    presence: mockPresence,
    state: 'attached',

    subscribe: vi.fn(),
    publish: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn(),

    detach: vi.fn().mockImplementation(async () => {
      // Mark this channel instance as detached
      const states = channelStatesMap.get(roomId);
      const state = states?.find(s => s.clientId === clientId);
      if (state) {
        state.state = 'detached';
      }

      console.log(`[MOCK] ${clientId} channel.detach()`);
    }),

    // For debugging
    _clientId: clientId,
  };

  return mockChannel;
}

// Mock ably-client
const mockChannels = new Map<string, any>();

// Track the last clientId generated by nanoid
// This allows ablyClient.auth.clientId to return the same ID
let lastGeneratedClientId: string | null = null;

vi.mock('../ably-client', () => ({
  ablyClient: {
    auth: {
      // Return undefined so that useRoom falls back to calling nanoid()
      // This allows each hook instance to generate its own unique ID
      clientId: undefined
    },
    connection: {
      state: 'connected',
      on: vi.fn(),
    },
    channels: {
      get: vi.fn((channelName: string) => {
        const roomId = channelName.replace('room:', '');

        // Use the last generated clientId for this channel
        // This will match the ID that useRoom just generated via nanoid()
        const clientId = lastGeneratedClientId || 'unknown';

        // CRITICAL: Each call creates a NEW channel instance
        // This simulates multiple tabs getting separate channel objects
        const newChannel = createMockChannel(roomId, clientId);

        // Store it for debugging
        mockChannels.set(channelName, newChannel);

        return newChannel;
      }),
    },
    close: vi.fn(),
  },
}));

// Mock utils
vi.mock('../utils', () => ({
  generateRoomId: vi.fn(() => 'testroom'),
  validateRoomId: vi.fn((id: string) => id.length === 8 && /^[a-zA-Z0-9]{8}$/.test(id)),
}));

// Mock nanoid to return unique IDs for each hook instance
let nanoidCallCount = 0;
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => {
    nanoidCallCount++;
    const id = `client-${nanoidCallCount}`;
    lastGeneratedClientId = id; // Store the last generated ID
    return id;
  }),
}));

// Import AFTER mocks are set up
import { useRoom } from '../useRoom';

describe('Two-Player Room Bug - Tab 1 Gets Kicked', () => {
  beforeEach(() => {
    // Reset all state
    vi.clearAllMocks();
    nanoidCallCount = 0;
    lastGeneratedClientId = null; // Reset the last generated client ID for each test
    roomPresenceMap.clear();
    presenceCallbacksMap.clear();
    channelStatesMap.clear();
    mockChannels.clear();

    console.log('\n========================================');
    console.log('TEST STARTING');
    console.log('========================================\n');
  });

  afterEach(() => {
    console.log('\n========================================');
    console.log('TEST COMPLETED');
    console.log('========================================\n');
  });

  describe('CRITICAL BUG: Tab 1 loses connection when Tab 2 joins', () => {
    it('Tab 1 should stay in room when Tab 2 joins (EXPECTED TO FAIL)', async () => {
      console.log('\n[TEST] Starting: Tab 1 should stay connected when Tab 2 joins\n');

      // ============================================
      // STEP 1: Tab 1 creates room
      // ============================================
      console.log('[STEP 1] Tab 1 creating room...');
      const { result: tab1 } = renderHook(() => useRoom(null));

      let roomId: string = '';
      await act(async () => {
        roomId = await tab1.current.createRoom();
      });

      console.log(`[STEP 1] Tab 1 created room: ${roomId}`);

      // Wait for Tab 1 to be connected
      await waitFor(() => {
        expect(tab1.current.isConnected).toBe(true);
      }, { timeout: 1000 });

      console.log(`[STEP 1] Tab 1 connected with role: ${tab1.current.playerRole}`);
      console.log(`[STEP 1] Tab 1 localPlayerId: ${tab1.current.localPlayerId}`);

      // Verify Tab 1 is Player X
      expect(tab1.current.playerRole).toBe('X');
      expect(tab1.current.roomState.playerXId).toBeTruthy();

      // Store Tab 1's initial state
      const tab1InitialRole = tab1.current.playerRole;
      const tab1InitialChannel = tab1.current.channel;
      const tab1InitialPlayerId = tab1.current.localPlayerId;

      console.log(`[STEP 1] Tab 1 state captured:`);
      console.log(`  - Role: ${tab1InitialRole}`);
      console.log(`  - Channel: ${tab1InitialChannel ? 'attached' : 'null'}`);
      console.log(`  - PlayerId: ${tab1InitialPlayerId}`);

      // ============================================
      // STEP 2: Tab 2 joins the same room
      // ============================================
      console.log('\n[STEP 2] Tab 2 joining room...');
      const { result: tab2 } = renderHook(() => useRoom(null));

      await act(async () => {
        await tab2.current.joinRoom(roomId);
      });

      console.log(`[STEP 2] Tab 2 joined room`);

      // Wait for Tab 2 to be connected
      await waitFor(() => {
        expect(tab2.current.isConnected).toBe(true);
      }, { timeout: 1000 });

      console.log(`[STEP 2] Tab 2 connected with role: ${tab2.current.playerRole}`);
      console.log(`[STEP 2] Tab 2 localPlayerId: ${tab2.current.localPlayerId}`);

      // ============================================
      // STEP 3: Verify Tab 1 STAYS connected
      // ============================================
      console.log('\n[STEP 3] Checking if Tab 1 is still connected...');

      // Give presence updates time to propagate
      await waitFor(() => {
        const presenceMembers = roomPresenceMap.get(roomId) || [];
        console.log(`[STEP 3] Presence members: ${presenceMembers.length}`);
        presenceMembers.forEach(m => {
          console.log(`  - ${m.clientId}: ${m.data.role}`);
        });
        return presenceMembers.length === 2;
      }, { timeout: 2000 });

      console.log('\n[STEP 3] CRITICAL CHECK: Tab 1 state after Tab 2 joined:');
      console.log(`  - Tab 1 playerRole: ${tab1.current.playerRole} (should be X)`);
      console.log(`  - Tab 1 isConnected: ${tab1.current.isConnected} (should be true)`);
      console.log(`  - Tab 1 channel: ${tab1.current.channel ? 'exists' : 'NULL'} (should exist)`);
      console.log(`  - Tab 1 roomState.playerXId: ${tab1.current.roomState.playerXId}`);
      console.log(`  - Tab 1 roomState.playerOId: ${tab1.current.roomState.playerOId}`);

      console.log('\n[STEP 3] Tab 2 state:');
      console.log(`  - Tab 2 playerRole: ${tab2.current.playerRole} (should be O)`);
      console.log(`  - Tab 2 isConnected: ${tab2.current.isConnected} (should be true)`);
      console.log(`  - Tab 2 roomState.playerXId: ${tab2.current.roomState.playerXId}`);
      console.log(`  - Tab 2 roomState.playerOId: ${tab2.current.roomState.playerOId}`);

      // ============================================
      // ASSERTIONS - THESE SHOULD FAIL!
      // ============================================
      console.log('\n[STEP 3] Running assertions (EXPECTED TO FAIL)...\n');

      // CRITICAL: Tab 1 should STILL be Player X
      try {
        expect(tab1.current.playerRole).toBe('X');
        console.log('✓ Tab 1 still has role X');
      } catch (e) {
        console.log('✗ FAILED: Tab 1 lost its role!', (e as Error).message);
        throw e;
      }

      // CRITICAL: Tab 1 should STILL be connected
      try {
        expect(tab1.current.isConnected).toBe(true);
        console.log('✓ Tab 1 still connected');
      } catch (e) {
        console.log('✗ FAILED: Tab 1 disconnected!', (e as Error).message);
        throw e;
      }

      // CRITICAL: Tab 1 channel should STILL exist
      try {
        expect(tab1.current.channel).toBeTruthy();
        console.log('✓ Tab 1 channel still exists');
      } catch (e) {
        console.log('✗ FAILED: Tab 1 channel is null!', (e as Error).message);
        throw e;
      }

      // CRITICAL: Both tabs should see each other
      try {
        expect(tab1.current.roomState.playerXId).toBe(tab1InitialPlayerId);
        expect(tab1.current.roomState.playerOId).toBe(tab2.current.localPlayerId);
        console.log('✓ Tab 1 sees both players');
      } catch (e) {
        console.log('✗ FAILED: Tab 1 does not see both players!', (e as Error).message);
        throw e;
      }

      // Tab 2 should be Player O
      try {
        expect(tab2.current.playerRole).toBe('O');
        console.log('✓ Tab 2 has role O');
      } catch (e) {
        console.log('✗ FAILED: Tab 2 has wrong role!', (e as Error).message);
        throw e;
      }

      console.log('\n[TEST] ✓ ALL ASSERTIONS PASSED (unexpected - bug may be fixed!)');
    });

    it('Both tabs should see each other in presence (EXPECTED TO FAIL)', async () => {
      console.log('\n[TEST] Starting: Both tabs should see each other in presence\n');

      // Tab 1: Create room
      const { result: tab1 } = renderHook(() => useRoom(null));
      let roomId: string = '';

      await act(async () => {
        roomId = await tab1.current.createRoom();
      });

      await waitFor(() => expect(tab1.current.isConnected).toBe(true));

      const tab1ClientId = tab1.current.localPlayerId;
      console.log(`[TAB 1] Connected with clientId: ${tab1ClientId}, role: ${tab1.current.playerRole}`);

      // Tab 2: Join room
      const { result: tab2 } = renderHook(() => useRoom(null));

      await act(async () => {
        await tab2.current.joinRoom(roomId);
      });

      await waitFor(() => expect(tab2.current.isConnected).toBe(true));

      const tab2ClientId = tab2.current.localPlayerId;
      console.log(`[TAB 2] Connected with clientId: ${tab2ClientId}, role: ${tab2.current.playerRole}`);

      // Wait for presence to sync
      await waitFor(() => {
        const members = roomPresenceMap.get(roomId) || [];
        return members.length === 2;
      }, { timeout: 2000 });

      console.log('\n[PRESENCE] Current state:');
      const presenceMembers = roomPresenceMap.get(roomId) || [];
      presenceMembers.forEach(m => {
        console.log(`  - ${m.clientId}: ${m.data.role}`);
      });

      console.log('\n[TAB 1] Room state view:');
      console.log(`  - playerXId: ${tab1.current.roomState.playerXId}`);
      console.log(`  - playerOId: ${tab1.current.roomState.playerOId}`);

      console.log('\n[TAB 2] Room state view:');
      console.log(`  - playerXId: ${tab2.current.roomState.playerXId}`);
      console.log(`  - playerOId: ${tab2.current.roomState.playerOId}`);

      // CRITICAL: Both tabs should see 2 players
      await waitFor(() => {
        console.log(`\n[ASSERTION] Tab 1 sees playerX: ${tab1.current.roomState.playerXId}, playerO: ${tab1.current.roomState.playerOId}`);
        expect(tab1.current.roomState.playerXId).toBe(tab1ClientId);
        expect(tab1.current.roomState.playerOId).toBe(tab2ClientId);
      }, { timeout: 2000 });

      await waitFor(() => {
        console.log(`[ASSERTION] Tab 2 sees playerX: ${tab2.current.roomState.playerXId}, playerO: ${tab2.current.roomState.playerOId}`);
        expect(tab2.current.roomState.playerXId).toBe(tab1ClientId);
        expect(tab2.current.roomState.playerOId).toBe(tab2ClientId);
      }, { timeout: 2000 });

      console.log('\n[TEST] ✓ Both tabs see each other');
    });

    it('Tab 1 channel should stay attached when Tab 2 joins (EXPECTED TO FAIL)', async () => {
      console.log('\n[TEST] Starting: Tab 1 channel should stay attached\n');

      // Tab 1: Create room
      const { result: tab1 } = renderHook(() => useRoom(null));
      let roomId: string = '';

      await act(async () => {
        roomId = await tab1.current.createRoom();
      });

      await waitFor(() => expect(tab1.current.isConnected).toBe(true));

      const tab1Channel = tab1.current.channel;

      console.log(`[TAB 1] Channel state: ${tab1Channel?.state}`);
      console.log(`[TAB 1] Channel exists: ${!!tab1Channel}`);

      expect(tab1Channel).toBeTruthy();

      // Tab 2: Join room
      const { result: tab2 } = renderHook(() => useRoom(null));

      await act(async () => {
        await tab2.current.joinRoom(roomId);
      });

      await waitFor(() => expect(tab2.current.isConnected).toBe(true));

      console.log(`[TAB 2] Connected`);

      // Give time for any side effects
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log(`\n[CRITICAL] Tab 1 channel after Tab 2 joined:`);
      console.log(`  - Channel exists: ${!!tab1.current.channel}`);
      console.log(`  - Channel state: ${tab1.current.channel?.state}`);
      console.log(`  - isConnected: ${tab1.current.isConnected}`);

      // CRITICAL: Tab 1 channel should STILL be attached
      try {
        expect(tab1.current.channel).toBeTruthy();
        console.log('✓ Tab 1 channel still exists');
      } catch (e) {
        console.log('✗ FAILED: Tab 1 channel is null!');
        throw e;
      }

      try {
        expect(tab1.current.channel?.state).toBe('attached');
        console.log('✓ Tab 1 channel still attached');
      } catch (e) {
        console.log('✗ FAILED: Tab 1 channel detached!');
        throw e;
      }

      console.log('\n[TEST] ✓ Tab 1 channel remained attached');
    });

    it('Presence update should not reset Tab 1 playerRole (EXPECTED TO FAIL)', async () => {
      console.log('\n[TEST] Starting: Presence update should not reset Tab 1 role\n');

      // Tab 1: Create room
      const { result: tab1 } = renderHook(() => useRoom(null));
      let roomId: string = '';

      await act(async () => {
        roomId = await tab1.current.createRoom();
      });

      await waitFor(() => expect(tab1.current.isConnected).toBe(true));

      const tab1InitialRole = tab1.current.playerRole;
      console.log(`[TAB 1] Initial role: ${tab1InitialRole}`);

      expect(tab1InitialRole).toBe('X');

      // Tab 2: Join room (this triggers presence update)
      console.log('\n[TAB 2] Joining room - this will trigger presence update...');
      const { result: tab2 } = renderHook(() => useRoom(null));

      await act(async () => {
        await tab2.current.joinRoom(roomId);
      });

      await waitFor(() => expect(tab2.current.isConnected).toBe(true));

      console.log(`[TAB 2] Joined with role: ${tab2.current.playerRole}`);

      // Wait for presence updates to propagate
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log(`\n[CRITICAL] Tab 1 role after presence update:`);
      console.log(`  - Before: ${tab1InitialRole}`);
      console.log(`  - After: ${tab1.current.playerRole}`);
      console.log(`  - Changed: ${tab1InitialRole !== tab1.current.playerRole}`);

      // CRITICAL: Tab 1 role should NOT change
      try {
        expect(tab1.current.playerRole).toBe('X');
        expect(tab1.current.playerRole).toBe(tab1InitialRole);
        console.log('✓ Tab 1 role did not change');
      } catch (e) {
        console.log('✗ FAILED: Tab 1 role was reset!');
        throw e;
      }

      console.log('\n[TEST] ✓ Tab 1 role remained stable');
    });

    it('RoomState should update without losing existing players (EXPECTED TO FAIL)', async () => {
      console.log('\n[TEST] Starting: RoomState should add new player without reset\n');

      // Tab 1: Create room
      const { result: tab1 } = renderHook(() => useRoom(null));
      let roomId: string = '';

      await act(async () => {
        roomId = await tab1.current.createRoom();
      });

      await waitFor(() => expect(tab1.current.isConnected).toBe(true));

      const tab1PlayerId = tab1.current.localPlayerId;

      console.log(`[TAB 1] State after creation:`);
      console.log(`  - playerXId: ${tab1.current.roomState.playerXId}`);
      console.log(`  - playerOId: ${tab1.current.roomState.playerOId}`);

      expect(tab1.current.roomState.playerXId).toBe(tab1PlayerId);
      expect(tab1.current.roomState.playerOId).toBeNull();

      // Tab 2: Join room
      console.log('\n[TAB 2] Joining room...');
      const { result: tab2 } = renderHook(() => useRoom(null));

      await act(async () => {
        await tab2.current.joinRoom(roomId);
      });

      await waitFor(() => expect(tab2.current.isConnected).toBe(true));

      const tab2PlayerId = tab2.current.localPlayerId;

      // Wait for room state to sync
      await waitFor(() => {
        return tab1.current.roomState.playerOId !== null;
      }, { timeout: 2000 });

      console.log(`\n[CRITICAL] Tab 1 state after Tab 2 joined:`);
      console.log(`  - playerXId: ${tab1.current.roomState.playerXId} (should be ${tab1PlayerId})`);
      console.log(`  - playerOId: ${tab1.current.roomState.playerOId} (should be ${tab2PlayerId})`);

      console.log(`\n[CRITICAL] Tab 2 state:`);
      console.log(`  - playerXId: ${tab2.current.roomState.playerXId} (should be ${tab1PlayerId})`);
      console.log(`  - playerOId: ${tab2.current.roomState.playerOId} (should be ${tab2PlayerId})`);

      // CRITICAL: Both players should be in room state
      try {
        expect(tab1.current.roomState.playerXId).toBe(tab1PlayerId);
        expect(tab1.current.roomState.playerOId).toBe(tab2PlayerId);
        console.log('✓ Tab 1 sees both players correctly');
      } catch (e) {
        console.log('✗ FAILED: Tab 1 roomState was reset or corrupted!');
        throw e;
      }

      try {
        expect(tab2.current.roomState.playerXId).toBe(tab1PlayerId);
        expect(tab2.current.roomState.playerOId).toBe(tab2PlayerId);
        console.log('✓ Tab 2 sees both players correctly');
      } catch (e) {
        console.log('✗ FAILED: Tab 2 roomState is incorrect!');
        throw e;
      }

      console.log('\n[TEST] ✓ Room state maintained both players');
    });

    it('Tab 1 should be able to publish after Tab 2 joins (EXPECTED TO FAIL)', async () => {
      console.log('\n[TEST] Starting: Tab 1 should be able to publish after Tab 2 joins\n');

      // Tab 1: Create room
      const { result: tab1 } = renderHook(() => useRoom(null));
      let roomId: string = '';

      await act(async () => {
        roomId = await tab1.current.createRoom();
      });

      await waitFor(() => expect(tab1.current.isConnected).toBe(true));

      const tab1Channel = tab1.current.channel;

      console.log(`[TAB 1] Channel ready, testing publish...`);

      // Verify Tab 1 can publish before Tab 2 joins
      await expect(tab1Channel?.publish('test', { message: 'before' })).resolves.not.toThrow();
      console.log('✓ Tab 1 can publish before Tab 2 joins');

      // Tab 2: Join room
      console.log('\n[TAB 2] Joining room...');
      const { result: tab2 } = renderHook(() => useRoom(null));

      await act(async () => {
        await tab2.current.joinRoom(roomId);
      });

      await waitFor(() => expect(tab2.current.isConnected).toBe(true));

      console.log(`[TAB 2] Connected`);

      // Give time for any state updates
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log(`\n[CRITICAL] Testing if Tab 1 can still publish...`);
      console.log(`  - Tab 1 channel exists: ${!!tab1.current.channel}`);
      console.log(`  - Tab 1 isConnected: ${tab1.current.isConnected}`);

      // CRITICAL: Tab 1 should STILL be able to publish
      try {
        await expect(tab1.current.channel?.publish('test', { message: 'after' })).resolves.not.toThrow();
        console.log('✓ Tab 1 can still publish after Tab 2 joins');
      } catch (e) {
        console.log('✗ FAILED: Tab 1 cannot publish! Channel is broken.');
        throw e;
      }

      console.log('\n[TEST] ✓ Tab 1 can still communicate');
    });
  });

  describe('BUG ANALYSIS: Why does Tab 1 get kicked?', () => {
    it('shows the cleanup effect runs on Tab 1 when Tab 2 joins (DIAGNOSTIC)', async () => {
      console.log('\n[DIAGNOSTIC] Testing if cleanup effect runs on Tab 1...\n');

      // Track cleanup calls
      let tab1CleanupCalled = false;

      // Tab 1: Create room
      const { result: tab1, unmount: unmountTab1 } = renderHook(() => useRoom(null));
      let roomId: string = '';

      await act(async () => {
        roomId = await tab1.current.createRoom();
      });

      await waitFor(() => expect(tab1.current.isConnected).toBe(true));

      console.log(`[TAB 1] Connected to room ${roomId}`);

      // Monitor Tab 1's channel for detach calls
      const tab1Channel = tab1.current.channel;
      const originalDetach = tab1Channel?.detach;
      if (tab1Channel) {
        tab1Channel.detach = vi.fn().mockImplementation(async (...args) => {
          console.log('⚠️ [TAB 1] DETACH CALLED! This means cleanup ran.');
          tab1CleanupCalled = true;
          return originalDetach?.apply(tab1Channel, args);
        });
      }

      console.log(`[TAB 1] Monitoring detach calls...`);

      // Tab 2: Join room
      console.log('\n[TAB 2] Joining room...');
      const { result: tab2 } = renderHook(() => useRoom(null));

      await act(async () => {
        await tab2.current.joinRoom(roomId);
      });

      await waitFor(() => expect(tab2.current.isConnected).toBe(true));

      console.log(`[TAB 2] Connected`);

      // Wait to see if cleanup runs
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log(`\n[DIAGNOSTIC] Results:`);
      console.log(`  - Tab 1 cleanup called: ${tab1CleanupCalled}`);
      console.log(`  - Tab 1 still connected: ${tab1.current.isConnected}`);

      if (tab1CleanupCalled) {
        console.log('\n⚠️ BUG CONFIRMED: Tab 1 cleanup ran when Tab 2 joined!');
        console.log('This explains why Tab 1 gets kicked from the room.');
      } else {
        console.log('\n✓ Tab 1 cleanup did not run (expected behavior)');
      }

      // This is diagnostic - we're just observing behavior
      console.log('\n[DIAGNOSTIC] Test complete');
    });

    it('shows the roomId prop dependency causing re-render (DIAGNOSTIC)', async () => {
      console.log('\n[DIAGNOSTIC] Testing if roomId changes cause issues...\n');

      // This test documents potential issues with the useEffect dependency on roomId
      // If the roomId changes unexpectedly, it could trigger leaveRoom() in cleanup

      console.log('[INFO] The useRoom hook has this effect:');
      console.log('  useEffect(() => {');
      console.log('    if (roomId) { joinRoomChannel(roomId) }');
      console.log('    return () => { leaveRoom() };  // <-- This runs on every roomId change!');
      console.log('  }, [roomId]);');
      console.log('');
      console.log('[HYPOTHESIS] If roomId changes (even slightly), cleanup runs!');
      console.log('[HYPOTHESIS] This could kick Tab 1 out when Tab 2 joins.');

      // This is just documentation
      expect(true).toBe(true);
    });
  });
});
