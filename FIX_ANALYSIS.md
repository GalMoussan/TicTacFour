# Bug Root Cause Analysis

## The Bug

When Player 2 joins a room:
- Player 2 becomes a spectator (should be Player O)
- Player 1 gets disconnected or loses their role

## Root Cause

**File:** `/Users/galmoussan/projects/claude/tictacfor/src/multiplayer/useRoom.ts`
**Lines:** 216-227

```typescript
// Update local player role if needed
const localMember = members.find((m) => m.clientId === localPlayerId);
if (localMember) {
  const role = (localMember.data as PresenceMemberData)?.role;
  if (role) {
    console.log('[useRoom] Updating local player role:', {
      oldRole: playerRole,
      newRole: role,
    });
    setPlayerRole(role); // <-- BUG IS HERE!
  }
}
```

## Why This is Wrong

### The Flow:

1. Player 1 joins room
   - Determines role: X (correct)
   - Calls `presence.enter({ role: 'X' })`
   - Sets local state: `setPlayerRole('X')`
   - Subscribes to presence updates

2. Player 2 joins room
   - Determines role: O (correct)
   - Calls `presence.enter({ role: 'O' })`
   - **This triggers a presence update event**

3. **Player 1 receives the presence update event**
   - Calls `handlePresenceUpdate()`
   - Fetches current members from Ably
   - Finds itself in the member list
   - **Re-sets its own role based on presence data**

### The Problem:

The presence update handler is **overwriting Player 1's role** every time ANY presence event occurs. This causes:

1. **Race conditions:** Ably's presence data might not be fully consistent yet
2. **Stale data:** The presence API might return cached/old data
3. **Unnecessary updates:** We're changing our own role when we shouldn't be

### Why Second Player Becomes Spectator:

When Player 2 joins:
1. They call `determineRole()` which correctly returns 'O'
2. BUT the presence update event from their own join fires immediately
3. Their `handlePresenceUpdate()` runs
4. It might read presence data BEFORE Ably has fully processed their entry
5. So it reads: "2 players in room, X exists, O exists"
6. But then `determineRole()` is called again somewhere, or the presence data is inconsistent
7. Result: They get assigned 'spectator'

## The Fix

**NEVER update your own role from presence events.**

Your role is determined ONCE when you join the room. After that, it should be immutable. Presence updates are only for tracking OTHER players.

### Fixed Code:

```typescript
const handlePresenceUpdate = useCallback(
  async (currentChannel: Ably.RealtimeChannel, currentRoomId: string) => {
    try {
      const members = await currentChannel.presence.get();

      console.log('[useRoom] Presence update:', {
        channelName: currentChannel.name,
        localPlayerId,
        members: members.map((m) => ({
          clientId: m.clientId,
          role: (m.data as PresenceMemberData)?.role,
          isLocal: m.clientId === localPlayerId,
        })),
        memberCount: members.length,
      });

      // ONLY update room state (tracks other players)
      // DO NOT update our own role
      updateRoomState(members, currentRoomId);

      // REMOVED THE BUG:
      // const localMember = members.find((m) => m.clientId === localPlayerId);
      // if (localMember) {
      //   const role = (localMember.data as PresenceMemberData)?.role;
      //   if (role) {
      //     setPlayerRole(role); // <-- THIS WAS THE BUG!
      //   }
      // }
    } catch (error) {
      console.error('[useRoom] Failed to update presence:', error);
    }
  },
  [localPlayerId, updateRoomState]
);
```

## Additional Issues Found

### Issue 2: Missing Dependency in useCallback

Line 232:
```typescript
const handlePresenceUpdate = useCallback(
  async (currentChannel: Ably.RealtimeChannel, currentRoomId: string) => {
    // Uses playerRole on line 222
  },
  [localPlayerId, updateRoomState] // Missing playerRole!
);
```

This creates a stale closure, but it doesn't matter once we remove the buggy code that references `playerRole`.

## Summary

The fix is simple:
1. Remove lines 216-227 from `handlePresenceUpdate`
2. Only call `updateRoomState()` to track room members
3. Never modify `playerRole` after initial assignment

This ensures:
- Player roles are assigned once and never change
- No race conditions from presence updates
- No stale data issues
- Clean separation: role assignment happens on join, presence updates only track other players
