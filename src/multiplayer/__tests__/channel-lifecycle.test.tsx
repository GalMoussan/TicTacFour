/**
 * Channel Lifecycle Bug Reproduction Tests
 *
 * These tests REPRODUCE the "Channel detached" and "Detach request superseded" errors
 * that occur in React StrictMode and during rapid component mounting/unmounting.
 *
 * ALL TESTS SHOULD FAIL with current implementation.
 *
 * Root Causes:
 * 1. useEffect dependencies include joinRoomChannel/leaveRoom causing infinite loops
 * 2. Cleanup doesn't wait for async operations (presence.enter, presence.leave)
 * 3. No cancellation token for in-flight operations
 * 4. Operations happen on detached channels
 * 5. Cleanup order is wrong: should be unsubscribe → leave → detach
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRoom } from '../useRoom';

// Track console errors to detect "Channel detached" errors
const consoleErrors: string[] = [];
const originalConsoleError = console.error;

// Mock Ably channel with realistic async behavior and error states
let channelState: 'initialized' | 'attaching' | 'attached' | 'detaching' | 'detached' = 'initialized';
let presenceEnterInProgress = false;

const createMockChannel = () => {
  const mockPresence = {
    get: vi.fn().mockImplementation(async () => {
      // Simulate "Channel detached" error when operations happen on detached channel
      if (channelState === 'detached' || channelState === 'detaching') {
        const error = new Error('Channel detached; statusCode=404');
        consoleErrors.push(error.message);
        console.error(error.message);
        throw error;
      }
      return [];
    }),

    enter: vi.fn().mockImplementation(async () => {
      // Simulate async operation taking time
      presenceEnterInProgress = true;

      // Check if channel was detached while entering
      if (channelState === 'detached' || channelState === 'detaching') {
        presenceEnterInProgress = false;
        const error = new Error('Channel detached; statusCode=404');
        consoleErrors.push(error.message);
        console.error(error.message);
        throw error;
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check again after delay
      if (channelState === 'detached' || channelState === 'detaching') {
        presenceEnterInProgress = false;
        const error = new Error('Channel detached; statusCode=404');
        consoleErrors.push(error.message);
        console.error(error.message);
        throw error;
      }

      presenceEnterInProgress = false;
      return undefined;
    }),

    leave: vi.fn().mockImplementation(async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 30));

      return undefined;
    }),

    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  };

  const mockChannel = {
    presence: mockPresence,
    subscribe: vi.fn(),
    publish: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn(),

    attach: vi.fn().mockImplementation(async () => {
      if (channelState === 'detaching') {
        const error = new Error('Detach request superseded by a subsequent attach request; statusCode=409');
        consoleErrors.push(error.message);
        console.error(error.message);
        throw error;
      }
      channelState = 'attached';
      return undefined;
    }),

    detach: vi.fn().mockImplementation(async () => {
      if (channelState === 'attaching') {
        const error = new Error('Detach request superseded by a subsequent attach request; statusCode=409');
        consoleErrors.push(error.message);
        console.error(error.message);
        throw error;
      }

      channelState = 'detaching';

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 20));

      channelState = 'detached';
      return undefined;
    }),

    state: () => channelState,
  };

  return mockChannel;
};

// Mock ably-client
vi.mock('../ably-client', () => ({
  ablyClient: {
    auth: {
      clientId: undefined
    },
    connection: {
      state: 'connected',
      on: vi.fn(),
    },
    channels: {
      get: vi.fn(() => createMockChannel()),
    },
    close: vi.fn(),
  },
}));

// Mock utils
vi.mock('../utils', () => ({
  generateRoomId: vi.fn(() => 'testroom'),
  validateRoomId: vi.fn((id: string) => id.length === 8 && /^[a-zA-Z0-9]{8}$/.test(id)),
}));

// Mock nanoid
let nanoidCallCount = 0;
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => {
    nanoidCallCount++;
    return `player-${nanoidCallCount}`;
  }),
}));

describe('Channel Lifecycle Bugs - SHOULD ALL FAIL', () => {
  beforeEach(() => {
    // Clear state
    vi.clearAllMocks();
    consoleErrors.length = 0;
    nanoidCallCount = 0;
    channelState = 'initialized';
    presenceEnterInProgress = false;

    // Capture console.error
    console.error = vi.fn((...args) => {
      consoleErrors.push(args.join(' '));
      originalConsoleError(...args);
    });
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  describe('BUG 1: React StrictMode Double Mount', () => {
    it('should handle React StrictMode double mount without errors', async () => {
      /**
       * EXPECTED TO FAIL
       *
       * React StrictMode in development causes:
       * 1. Mount → useEffect runs → joinRoomChannel
       * 2. Unmount → cleanup runs → leaveRoom
       * 3. Remount → useEffect runs again → joinRoomChannel
       *
       * Current bug: Second joinRoomChannel tries to operate on detached channel
       * Error: "Channel detached; statusCode=404"
       */

      // First mount
      const { result, unmount } = renderHook(() => useRoom('testroom'));

      // Wait for first mount to complete
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      }, { timeout: 1000 });

      // StrictMode unmount (cleanup)
      unmount();

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      // StrictMode remount
      const { result: result2 } = renderHook(() => useRoom('testroom'));

      // Second mount should succeed without errors
      await waitFor(() => {
        expect(result2.current.isConnected).toBe(true);
      }, { timeout: 1000 });

      // EXPECTED: No "Channel detached" errors
      const channelDetachedErrors = consoleErrors.filter(e =>
        e.includes('Channel detached') || e.includes('statusCode=404')
      );

      console.log('❌ EXPECTED TO FAIL: Channel detached errors:', channelDetachedErrors);

      // This WILL FAIL because of race conditions
      expect(channelDetachedErrors.length).toBe(0);
      expect(result2.current.isConnected).toBe(true);
    });
  });

  describe('BUG 2: Cleanup Doesn\'t Wait for Async Operations', () => {
    it('should cleanup channel before detaching', async () => {
      /**
       * EXPECTED TO FAIL
       *
       * Current bug:
       * 1. Mount → joinRoomChannel starts presence.enter (async, takes 50ms)
       * 2. Unmount immediately → leaveRoom runs
       * 3. leaveRoom calls channel.detach() without waiting for presence.enter
       * 4. presence.enter completes AFTER channel is detached
       *
       * Error: "Channel detached; statusCode=404"
       */

      const { unmount } = renderHook(() => useRoom('testroom'));

      // Start joining (presence.enter in progress)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 25)); // Half of enter delay
      });

      // Unmount while presence.enter is still in progress
      expect(presenceEnterInProgress).toBe(true);
      unmount();

      // Wait for all async operations
      await new Promise(resolve => setTimeout(resolve, 200));

      // EXPECTED: No unhandled promise rejections
      const detachedErrors = consoleErrors.filter(e => e.includes('Channel detached'));

      console.log('❌ EXPECTED TO FAIL: Presence.enter should be cancelled, got errors:', detachedErrors);

      // This WILL FAIL because cleanup doesn't wait
      expect(detachedErrors.length).toBe(0);
    });

    it('should not call presence.enter on detached channel', async () => {
      /**
       * EXPECTED TO FAIL
       *
       * Scenario:
       * 1. Mount with roomId → triggers useEffect
       * 2. joinRoomChannel starts but is async
       * 3. Cleanup runs and detaches channel
       * 4. presence.enter tries to execute on detached channel
       *
       * Error: "Channel detached; statusCode=404"
       */

      const { unmount } = renderHook(() => useRoom('testroom'));

      // Unmount immediately (before joinRoomChannel completes)
      unmount();

      // Wait for async operations to settle
      await new Promise(resolve => setTimeout(resolve, 200));

      // EXPECTED: presence.enter should be cancelled/ignored
      const detachedErrors = consoleErrors.filter(e =>
        e.includes('Channel detached') && e.includes('404')
      );

      console.log('❌ EXPECTED TO FAIL: Operations on detached channel:', detachedErrors);

      // This WILL FAIL
      expect(detachedErrors.length).toBe(0);
    });
  });

  describe('BUG 3: Rapid roomId Changes Cause Race Conditions', () => {
    it('should handle rapid roomId changes without race conditions', async () => {
      /**
       * EXPECTED TO FAIL
       *
       * Scenario:
       * 1. Mount with roomId "room1" → joinRoomChannel("room1") starts
       * 2. Change to "room2" → cleanup runs, joinRoomChannel("room2") starts
       * 3. Change to "room3" → cleanup runs, joinRoomChannel("room3") starts
       *
       * Current bug:
       * - All 3 join operations may complete
       * - Cleanup and attach happen simultaneously
       * - "Detach request superseded" errors
       */

      const { result, rerender } = renderHook(
        ({ roomId }) => useRoom(roomId),
        { initialProps: { roomId: 'room0001' as string | null } }
      );

      // Immediately change roomId (before first join completes)
      act(() => {
        rerender({ roomId: 'room0002' });
      });

      // Change again
      act(() => {
        rerender({ roomId: 'room0003' });
      });

      // Wait for all operations
      await new Promise(resolve => setTimeout(resolve, 300));

      // EXPECTED: Only room3 operations should complete
      // EXPECTED: No detached channel errors
      const supersededErrors = consoleErrors.filter(e =>
        e.includes('superseded') || e.includes('409')
      );
      const detachedErrors = consoleErrors.filter(e =>
        e.includes('Channel detached') || e.includes('404')
      );

      console.log('❌ EXPECTED TO FAIL: Superseded errors:', supersededErrors);
      console.log('❌ EXPECTED TO FAIL: Detached errors:', detachedErrors);

      // These WILL FAIL
      expect(supersededErrors.length).toBe(0);
      expect(detachedErrors.length).toBe(0);
      expect(result.current.roomState.roomId).toBe('room0003');
    });
  });

  describe('BUG 4: Incorrect Cleanup Order', () => {
    it('should detach in correct order: unsubscribe → presence.leave → channel.detach', async () => {
      /**
       * EXPECTED TO FAIL
       *
       * Correct cleanup order:
       * 1. Unsubscribe from channel events
       * 2. Unsubscribe from presence events
       * 3. Leave presence (async, wait for completion)
       * 4. Detach from channel (async, wait for completion)
       *
       * Current bug: All operations happen simultaneously via .catch()
       * No guarantee of order, no waiting for completion
       */

      const { result, unmount } = renderHook(() => useRoom('testroom'));

      // Wait for connection
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const channel = result.current.channel;
      expect(channel).not.toBeNull();

      // Track call order
      const callOrder: string[] = [];

      // Spy on cleanup methods
      if (channel) {
        const originalUnsubscribe = channel.unsubscribe;
        const originalPresenceUnsubscribe = channel.presence.unsubscribe;
        const originalPresenceLeave = channel.presence.leave;
        const originalDetach = channel.detach;

        channel.unsubscribe = vi.fn(() => {
          callOrder.push('channel.unsubscribe');
          return originalUnsubscribe.call(channel);
        });

        channel.presence.unsubscribe = vi.fn(() => {
          callOrder.push('presence.unsubscribe');
          return originalPresenceUnsubscribe.call(channel.presence);
        });

        channel.presence.leave = vi.fn(async () => {
          callOrder.push('presence.leave.start');
          const result = await originalPresenceLeave.call(channel.presence);
          callOrder.push('presence.leave.complete');
          return result;
        });

        channel.detach = vi.fn(async () => {
          callOrder.push('channel.detach.start');
          const result = await originalDetach.call(channel);
          callOrder.push('channel.detach.complete');
          return result;
        });
      }

      // Trigger cleanup
      unmount();

      // Wait for all cleanup
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log('❌ EXPECTED TO FAIL: Cleanup call order:', callOrder);

      // EXPECTED order (WILL FAIL):
      // 1. presence.unsubscribe
      // 2. channel.unsubscribe
      // 3. presence.leave.start
      // 4. presence.leave.complete
      // 5. channel.detach.start
      // 6. channel.detach.complete

      // These WILL FAIL because current code doesn't enforce order
      expect(callOrder.indexOf('presence.unsubscribe')).toBeLessThan(
        callOrder.indexOf('presence.leave.start')
      );
      expect(callOrder.indexOf('presence.leave.complete')).toBeLessThan(
        callOrder.indexOf('channel.detach.start')
      );
      expect(callOrder).toContain('presence.leave.complete');
      expect(callOrder).toContain('channel.detach.complete');
    });
  });

  describe('BUG 5: useEffect Dependency Loop', () => {
    it('should not trigger infinite loop with joinRoomChannel in dependencies', async () => {
      /**
       * EXPECTED TO FAIL
       *
       * Current bug (lines 274-293):
       * useEffect(() => {
       *   joinRoomChannel(roomId); // Calls this
       *   return () => leaveRoom(); // Cleanup
       * }, [roomId, joinRoomChannel, leaveRoom]); // Dependencies include callbacks
       *
       * Problem:
       * - joinRoomChannel is defined with useCallback, depends on determineRole, handlePresenceUpdate
       * - handlePresenceUpdate depends on updateRoomState
       * - On every render, these may get new references
       * - useEffect runs again → infinite loop or multiple joins
       */

      let effectRunCount = 0;
      const { result, rerender } = renderHook(() => {
        effectRunCount++;
        return useRoom('testroom');
      });

      // Wait for initial effect
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      const initialRunCount = effectRunCount;

      // Trigger a re-render (without changing roomId)
      rerender();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalRunCount = effectRunCount;

      console.log('❌ EXPECTED TO FAIL: Effect run count:', {
        initial: initialRunCount,
        final: finalRunCount,
        difference: finalRunCount - initialRunCount
      });

      // EXPECTED: Should run once for mount, maybe once for StrictMode
      // ACTUAL: May run many times due to dependency changes

      // This WILL FAIL if dependencies are unstable
      expect(finalRunCount - initialRunCount).toBeLessThanOrEqual(2); // Allow StrictMode double-invoke
    });
  });

  describe('BUG 6: No Cancellation of In-Flight Operations', () => {
    it('should cancel in-flight presence.enter when unmounting', async () => {
      /**
       * EXPECTED TO FAIL
       *
       * Scenario:
       * 1. Start joining room → presence.enter() called (async, takes 50ms)
       * 2. User navigates away → component unmounts
       * 3. presence.enter() still completes, tries to update state
       * 4. May cause "Can't perform state update on unmounted component" warning
       */

      const { unmount } = renderHook(() => useRoom('testroom'));

      // Let presence.enter start but not complete
      await new Promise(resolve => setTimeout(resolve, 25));

      expect(presenceEnterInProgress).toBe(true);

      // Unmount while operation in progress
      unmount();

      // Wait for operation to finish
      await new Promise(resolve => setTimeout(resolve, 100));

      // EXPECTED: Operation should be cancelled or ignored
      // ACTUAL: Operation completes and may try to update state

      const errors = consoleErrors.filter(e =>
        e.includes('unmounted component') ||
        e.includes('Channel detached')
      );

      console.log('❌ EXPECTED TO FAIL: Errors from uncancelled operations:', errors);

      // This WILL FAIL
      expect(errors.length).toBe(0);
    });
  });

  describe('Summary: All Errors', () => {
    it('should show all accumulated errors from tests above', () => {
      /**
       * This test just logs all errors we've seen.
       * It documents the complete picture of what's broken.
       */

      console.log('\n=== CHANNEL LIFECYCLE BUGS SUMMARY ===');
      console.log('Total console.error calls:', consoleErrors.length);
      console.log('\nError types:');

      const errorTypes = {
        'Channel detached (404)': consoleErrors.filter(e => e.includes('404')).length,
        'Detach superseded (409)': consoleErrors.filter(e => e.includes('409')).length,
        'Other errors': consoleErrors.filter(e => !e.includes('404') && !e.includes('409')).length,
      };

      console.table(errorTypes);
      console.log('\nAll errors:', consoleErrors);
      console.log('=====================================\n');

      // Just a documentation test, always passes
      expect(true).toBe(true);
    });
  });
});
