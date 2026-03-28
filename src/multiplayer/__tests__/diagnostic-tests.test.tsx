import { describe, it, expect, beforeEach } from 'vitest';
import { MultiplayerDiagnostics } from '../diagnostics';
import { renderHook, waitFor } from '@testing-library/react';
import { useRoom } from '../useRoom';

describe('Multiplayer Diagnostics - Real Bug Hunt', () => {
  beforeEach(() => {
    MultiplayerDiagnostics.clearLogs();
  });

  it('TEST 1: Check if multiple hook instances exist simultaneously', async () => {
    const instances: (string | null)[] = [];

    // Render multiple hooks
    const hook1 = renderHook(() => useRoom(null));
    instances.push(hook1.result.current.localPlayerId);

    const hook2 = renderHook(() => useRoom('test-room'));
    instances.push(hook2.result.current.localPlayerId);

    console.log('[TEST] Hook instances:', instances);
    console.log('[TEST] Same clientId?', instances[0] === instances[1]);

    // Both should have DIFFERENT local player IDs? Or same?
    // This reveals if the issue is multiple hooks sharing state
  });

  it('TEST 2: Simulate exact user flow - create then navigate', async () => {
    console.log('\n=== SIMULATING EXACT USER FLOW ===');

    // Step 1: User is in RoomLobby (no useRoom anymore after our fix)
    console.log('[STEP 1] RoomLobby (no useRoom)');

    // Step 2: User clicks create → navigates to /room/abc123
    console.log('[STEP 2] Navigate to /room/abc123');

    // Step 3: MultiplayerPage renders with useRoom('abc123')
    const { result } = renderHook(() => useRoom('abc123'));

    await waitFor(() => {
      expect(result.current.playerRole).toBeTruthy();
    });

    console.log('[STEP 3] Player role:', result.current.playerRole);
    console.log('[STEP 3] Should be X, actually is:', result.current.playerRole);

    const logs = MultiplayerDiagnostics.getFullDiagnosticReport();
    console.log('[DIAGNOSTIC REPORT]', logs);
  });

  it('TEST 3: Check for React StrictMode double-mount', () => {
    let mountCount = 0;

    const { unmount } = renderHook(() => {
      mountCount++;
      console.log('[TEST] useRoom mounted:', mountCount, 'times');
      return useRoom('test-room');
    });

    // Simulate StrictMode
    unmount();
    renderHook(() => useRoom('test-room'));

    console.log('[TEST] Total mount count:', mountCount);
    console.log('[TEST] StrictMode causes:', mountCount > 1 ? 'DOUBLE MOUNT' : 'single mount');
  });

  it('TEST 4: Check if presence.enter() is called multiple times', async () => {
    const hook1 = renderHook(() => useRoom('same-room'));
    await waitFor(() => expect(hook1.result.current.playerRole).toBeTruthy());

    const hook2 = renderHook(() => useRoom('same-room'));
    await waitFor(() => expect(hook2.result.current.playerRole).toBeTruthy());

    const logs = MultiplayerDiagnostics.logs.filter(l =>
      l.category === 'BEFORE_PRESENCE_ENTER' || l.category === 'AFTER_PRESENCE_ENTER'
    );

    console.log('[TEST] Presence enter calls:', logs.length / 2);
    console.log('[TEST] Expected: 2, Actual:', logs.length / 2);
  });

  it('TEST 5: Check clientId consistency across hook instances', async () => {
    const { result: result1 } = renderHook(() => useRoom('room-1'));
    const { result: result2 } = renderHook(() => useRoom('room-2'));

    await waitFor(() => {
      expect(result1.current.playerRole).toBeTruthy();
    });

    await waitFor(() => {
      expect(result2.current.playerRole).toBeTruthy();
    });

    console.log('[TEST] Hook 1 clientId:', result1.current.localPlayerId);
    console.log('[TEST] Hook 2 clientId:', result2.current.localPlayerId);
    console.log('[TEST] Same clientId?', result1.current.localPlayerId === result2.current.localPlayerId);

    const consistent = await MultiplayerDiagnostics.verifyClientIdConsistency();
    console.log('[TEST] ClientId consistent with storage?', consistent);
  });

  it('TEST 6: Simulate two players joining in sequence', async () => {
    console.log('\n=== SIMULATING TWO PLAYERS ===');

    // Player 1 creates room
    const { result: player1 } = renderHook(() => useRoom('shared-room'));

    await waitFor(() => {
      expect(player1.current.playerRole).toBeTruthy();
    }, { timeout: 5000 });

    console.log('[TEST] Player 1 role:', player1.current.playerRole);

    // Player 2 joins
    const { result: player2 } = renderHook(() => useRoom('shared-room'));

    await waitFor(() => {
      expect(player2.current.playerRole).toBeTruthy();
    }, { timeout: 5000 });

    console.log('[TEST] Player 2 role:', player2.current.playerRole);

    // Check if roles are correct
    console.log('[TEST] Player 1 should be X:', player1.current.playerRole === 'X');
    console.log('[TEST] Player 2 should be O:', player2.current.playerRole === 'O');

    // Get full diagnostic report
    const report = MultiplayerDiagnostics.getFullDiagnosticReport();
    console.log('[TEST] Full diagnostic report:', JSON.stringify(report, null, 2));
  });

  it('TEST 7: Check if cleanup is called correctly', async () => {
    const { result, unmount } = renderHook(() => useRoom('cleanup-test-room'));

    await waitFor(() => {
      expect(result.current.playerRole).toBeTruthy();
    });

    console.log('[TEST] Before unmount, role:', result.current.playerRole);

    // Unmount the hook
    unmount();

    // Wait a bit for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));

    const cleanupLogs = MultiplayerDiagnostics.logs.filter(l =>
      l.category === 'CLEANUP_TRIGGERED' || l.category === 'LEAVE_ROOM'
    );

    console.log('[TEST] Cleanup logs:', cleanupLogs);
    console.log('[TEST] Cleanup was called?', cleanupLogs.length > 0);
  });
});
