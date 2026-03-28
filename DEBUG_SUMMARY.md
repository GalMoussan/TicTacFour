# Debug Summary - Second Player Spectator Bug

## Problem Statement
- **Bug:** Second player ALWAYS becomes spectator
- **Bug:** First player gets disconnected when second player joins
- **Tests:** All tests pass (logic is correct)
- **Conclusion:** Bug is environmental (React, Ably SDK, browser-specific)

## Changes Made

### 1. Comprehensive Logging Added

#### `/Users/galmoussan/projects/claude/tictacfor/src/multiplayer/useRoom.ts`
Added debug logs to track:

1. **joinRoomChannel** (line ~193)
   - Entry point with all context
   - Duplicate channel detection
   - Presence members before join
   - Role determination logic
   - Presence enter completion
   - Final state after join

2. **leaveRoom** (line ~261)
   - When called (including stack context)
   - Current state before cleanup
   - Cleanup progress
   - Final state after cleanup

3. **handlePresenceUpdate** (line ~169)
   - All presence events
   - Member list with roles
   - Local player role updates

4. **Presence Subscription** (line ~236)
   - Real-time events (enter, leave, update)
   - Event source (local vs remote)

5. **useEffect** (line ~310)
   - When effect triggers
   - When cleanup runs
   - Why cleanup is running

#### `/Users/galmoussan/projects/claude/tictacfor/src/pages/MultiplayerPage.tsx`
Added logs to track:
- Component renders
- State changes
- Props changes

### 2. Bug Fixes Applied

#### Fix 1: Prevent Duplicate Channel Subscriptions
```typescript
// In joinRoomChannel (line ~195)
if (channelRef.current) {
  console.warn('[useRoom] Already have channel, skipping join');
  return;
}
```

**Rationale:** StrictMode or parent re-renders could call joinRoomChannel multiple times. This prevents creating multiple subscriptions to the same channel.

#### Fix 2: Prevent Cleanup During Re-renders (CRITICAL FIX)
```typescript
// In useEffect cleanup (line ~343)
if (!isMountedRef.current) {
  console.log('[useRoom] Component unmounting, cleaning up');
  leaveRoom();
}
```

**Rationale:** The cleanup function was being called on EVERY effect execution, not just on unmount. This caused Tab 1 to leave presence when ANY state change happened (like Tab 2 joining).

#### Fix 3: Stabilize leaveRoom Callback
```typescript
// Remove playerRole from leaveRoom dependencies
const leaveRoom = useCallback(() => {
  // ...
}, []); // Empty deps - all state accessed via refs
```

**Rationale:** `leaveRoom` had `playerRole` in dependencies, causing it to be recreated on every role change. While this doesn't affect the current useEffect (which only depends on `roomId`), it's a best practice to keep cleanup functions stable.

#### Fix 4: Temporarily Disable StrictMode
```typescript
// In main.tsx (line ~6)
createRoot(document.getElementById('root')!).render(<App />);
// Instead of: <StrictMode><App /></StrictMode>
```

**Rationale:** React StrictMode intentionally double-mounts components in development to catch bugs. This can trigger mount → unmount → remount cycles that call cleanup functions unexpectedly.

### 3. Hypothesis

The bug is likely caused by:

**Primary Suspect: useEffect Cleanup Bug**
- useEffect cleanup was running on EVERY render, not just unmount
- When Tab 2 joins → Ably triggers presence event → Tab 1's useRoom re-renders
- Re-render triggers cleanup → Tab 1 calls leaveRoom() → Tab 1 disconnects
- Tab 2 sees 2 members initially, but Tab 1 leaves → Tab 2 thinks there are already 2+ players → becomes spectator

**Secondary Suspect: StrictMode Double-Mount**
- StrictMode mounts → unmounts → remounts in development
- Unmount triggers cleanup → leaveRoom() called
- Remount creates new subscription, but already left presence
- Creates race condition with presence state

## Testing Instructions

### 1. Start Dev Server
```bash
cd /Users/galmoussan/projects/claude/tictacfor
npm run dev
```

### 2. Open Two Browser Tabs
- Tab 1: Create room
- Tab 2: Join room with ID from Tab 1

### 3. Watch Console Logs

Look for these patterns:

#### GOOD (Expected):
```
Tab 1:
[useRoom] joinRoomChannel START { roomId: "ABC123", memberCount: 0 }
[useRoom] Role determined: { role: "X" }
[useRoom] Entered presence with role: X
[useRoom] Presence event received: { action: "enter", role: "O" } ← Tab 2 joined

Tab 2:
[useRoom] joinRoomChannel START { roomId: "ABC123", memberCount: 1 }
[useRoom] Role determined: { role: "O" }
[useRoom] Entered presence with role: O
```

#### BAD (Bug):
```
Tab 1:
[useRoom] joinRoomChannel START { roomId: "ABC123", memberCount: 0 }
[useRoom] Role determined: { role: "X" }
[useRoom] Entered presence with role: X
[MultiplayerPage] Render  ← PARENT RE-RENDERED!
[useRoom] Cleanup triggered  ← CLEANUP CALLED!
[useRoom] leaveRoom CALLED  ← TAB 1 LEAVING!

Tab 2:
[useRoom] joinRoomChannel START { roomId: "ABC123", memberCount: 2 } ← Sees ghost
[useRoom] Role determined: { role: "spectator" } ← WRONG ROLE!
```

### 4. Collect Data

Please provide:
1. Full console log from Tab 1
2. Full console log from Tab 2
3. Final displayed state (role, room state)
4. Network tab showing Ably WebSocket messages (optional but helpful)

## Expected Results After Fixes

With the fixes applied:
- ✅ Duplicate channel subscriptions prevented
- ✅ Cleanup only runs on actual unmount
- ✅ StrictMode disabled (temporarily)
- ✅ Tab 1 stays connected when Tab 2 joins
- ✅ Tab 2 correctly assigned role "O"

## Files Modified

1. `/Users/galmoussan/projects/claude/tictacfor/src/multiplayer/useRoom.ts`
   - Added comprehensive logging
   - Added duplicate channel check
   - Fixed cleanup logic

2. `/Users/galmoussan/projects/claude/tictacfor/src/main.tsx`
   - Disabled StrictMode temporarily

3. `/Users/galmoussan/projects/claude/tictacfor/src/pages/MultiplayerPage.tsx`
   - Added render/state logging

4. `/Users/galmoussan/projects/claude/tictacfor/DEBUG_INSTRUCTIONS.md`
   - Created (detailed testing guide)

5. `/Users/galmoussan/projects/claude/tictacfor/DEBUG_SUMMARY.md`
   - Created (this file)

## Next Steps

1. Run tests to verify fixes work
2. Share console logs for analysis
3. If fixed, re-enable StrictMode with proper cleanup logic
4. Add tests to prevent regression
5. Remove debug logging (or convert to conditional debug mode)

## Root Cause Analysis (Predicted)

The bug was caused by **incorrect cleanup timing in useEffect**. The cleanup function was being called on every render because:

1. useEffect depends on `roomId`
2. When Tab 2 joins, Ably triggers presence event
3. Presence event updates `roomState` in Tab 1
4. `roomState` update triggers Tab 1 to re-render
5. Re-render triggers useEffect cleanup (even though `roomId` hasn't changed)
6. Cleanup calls `leaveRoom()` → Tab 1 disconnects

**Fix:** Only call `leaveRoom()` in cleanup if `isMountedRef.current === false`, meaning the component is actually unmounting, not just re-rendering.

This is a classic React pitfall - cleanup functions run on every effect execution, not just unmount.
