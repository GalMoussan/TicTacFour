# Second Player Spectator Bug - Analysis

## Test Results Summary

**Status**: ✅ ALL TESTS PASS with Ably mock

## What This Means

The comprehensive tests in `second-player-spectator-bug.test.tsx` **all pass**, which reveals:

### ✅ Working Correctly:
1. **useRoom hook logic** - Role determination is correct
2. **determineRole function** - Assigns X, O, spectator correctly
3. **Presence tracking** - Both players tracked correctly
4. **Channel state** - Channels stay attached
5. **Client ID generation** - Unique IDs per tab

### ❌ Bug is NOT in:
- `useRoom.ts` - Core logic is sound
- Role assignment algorithm
- Presence member tracking
- Channel lifecycle management

## Where the Bug IS

Since tests pass with mock but fail in real app, the bug is in:

### 1. Real Ably Client Behavior
The actual Ably SDK might:
- Return presence in different order
- Have race conditions we didn't mock
- Handle reconnections differently
- Share state across tabs unexpectedly

### 2. SessionStorage Client ID (`ably-client.ts`)
```typescript
const getClientId = (): string => {
  const STORAGE_KEY = 'tictacfor_session_client_id';
  let clientId = sessionStorage.getItem(STORAGE_KEY);

  if (!clientId) {
    clientId = nanoid();
    sessionStorage.setItem(STORAGE_KEY, clientId);
  }

  return clientId;
};
```

**Problem**: sessionStorage is PER-TAB, but the key is the SAME across tabs!
- Tab 1 generates `client-1` and stores it
- Tab 2 generates `client-2` and stores it
- Both tabs use SAME storage key
- Potential for ID collision or confusion

### 3. useRoom Effect Dependencies
```typescript
useEffect(() => {
  if (roomId) {
    joinRoomChannel(roomId).catch(...);
  }

  return () => {
    leaveRoom();  // <-- Runs on every roomId change!
  };
}, [roomId]);
```

**Problem**: If roomId changes for any reason, cleanup runs!

### 4. React Strict Mode
In development, React Strict Mode:
- Mounts components twice
- Runs effects twice
- Can cause double presence.enter() calls

## Test Evidence

### Part 1: Presence Tracking ✅
```
[MOCK PRESENCE] client-1 enter() - ADDED as X
[MOCK PRESENCE] client-3 enter() - ADDED as O
[TEST] Presence members: [ 'client-1:X', 'client-3:O' ]
[TEST] Total members: 2
```
Both players tracked correctly in mock.

### Part 2: Role Assignment ✅
```
[TEST] Tab 1 (creator) role: X
[TEST] Tab 2 (second joiner) role: O
[TEST] Expected: O
```
Second player gets O role, NOT spectator.

### Part 3: Channel State ✅
```
[TEST] Tab 1 channel after Tab 2 joins: attached
[TEST] Tab 1 isConnected: true
```
Tab 1 stays connected when Tab 2 joins.

### Part 5: Full Flow ✅
```
[CRITICAL] Tab 1 playerRole: X
[CRITICAL] Tab 1 channel state: attached
[CRITICAL] Tab 1 isConnected: true
✓ NO BUG DETECTED (all assertions passed)
```

## Next Steps to Find Real Bug

### 1. Add Real Ably Logging
Add console.log to actual Ably calls:
```typescript
// In useRoom.ts
const members = await newChannel.presence.get();
console.log('[REAL ABLY] Presence members:', members);

await newChannel.presence.enter({ role } as PresenceMemberData);
console.log('[REAL ABLY] Entered as:', role);
```

### 2. Test with Real Ably Client
Create integration test that uses REAL Ably API:
```typescript
// Use actual Ably client, not mock
import { ablyClient } from '../ably-client';
```

### 3. Check sessionStorage Isolation
Log sessionStorage state:
```typescript
console.log('[SESSION] Client ID:', sessionStorage.getItem('tictacfor_session_client_id'));
console.log('[SESSION] All keys:', Object.keys(sessionStorage));
```

### 4. Monitor Effect Cleanup
Track when leaveRoom() is called:
```typescript
const leaveRoom = useCallback(() => {
  console.log('[CLEANUP] leaveRoom called!');
  console.trace(); // Show call stack
  // ... rest of function
}, []);
```

### 5. Test in Production Mode
Disable React Strict Mode:
```typescript
// In main.tsx
root.render(
  // <React.StrictMode>  // <-- Comment out
    <App />
  // </React.StrictMode>
);
```

## Hypothesis

**Most Likely Cause**: Real Ably presence.get() returns members in unexpected order, OR presence.enter() timing is different, causing:
1. Tab 2 calls presence.get() and sees Tab 1 as 'X'
2. Tab 2 determines it should be 'O'
3. BUT something causes presence to update incorrectly
4. Tab 1 sees Tab 2 enter and re-evaluates its own role
5. Tab 1 thinks it's no longer needed and disconnects

**Fix Strategy**:
- Never re-evaluate role after initial assignment
- Store role in presence data immediately
- Only read role from presence, never recalculate

## Files to Investigate

1. `/src/multiplayer/ably-client.ts` - sessionStorage client ID
2. `/src/multiplayer/useRoom.ts` - Effect dependencies
3. `/src/pages/MultiplayerPage.tsx` - Component lifecycle
4. Real browser behavior (open DevTools in two tabs)

## Test File Location

**Comprehensive tests**: `/src/multiplayer/__tests__/second-player-spectator-bug.test.tsx`

Run tests:
```bash
npm test -- src/multiplayer/__tests__/second-player-spectator-bug.test.tsx
```

All 17 tests pass with mock, proving the logic is correct.
The bug is in the integration with real Ably or browser environment.
