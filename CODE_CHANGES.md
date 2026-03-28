# Exact Code Changes

## File: src/multiplayer/useRoom.ts

### Location: `handlePresenceUpdate` function (lines 195-233)

### BEFORE (Buggy Code)

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

      updateRoomState(members, currentRoomId);

      // ❌ BUG: This updates our own role from presence events
      // This causes Player 1 to lose their role when Player 2 joins
      const localMember = members.find((m) => m.clientId === localPlayerId);
      if (localMember) {
        const role = (localMember.data as PresenceMemberData)?.role;
        if (role) {
          console.log('[useRoom] Updating local player role:', {
            oldRole: playerRole,
            newRole: role,
          });
          setPlayerRole(role); // ❌ THIS IS THE BUG!
        }
      }
    } catch (error) {
      console.error('[useRoom] Failed to update presence:', error);
    }
  },
  [localPlayerId, updateRoomState] // ⚠️ Missing playerRole dependency (creates stale closure)
);
```

### AFTER (Fixed Code)

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

      // ✅ CRITICAL FIX: Only update room state (tracks other players)
      // NEVER update our own role from presence events - it's set once on join
      // and should remain immutable. Updating it here causes race conditions
      // where Player 1's role gets overwritten when Player 2 joins.
      updateRoomState(members, currentRoomId);

      // ✅ NEW: Added diagnostic logging
      MultiplayerDiagnostics.log('PRESENCE_UPDATE_HANDLED', {
        roomId: currentRoomId,
        memberCount: members.length,
        localRoleUnchanged: playerRoleRef.current,
        members: members.map(m => ({
          clientId: m.clientId,
          role: (m.data as PresenceMemberData)?.role
        }))
      });
    } catch (error) {
      console.error('[useRoom] Failed to update presence:', error);
    }
  },
  [localPlayerId, updateRoomState] // ✅ No playerRole needed since we don't update it
);
```

### What Changed

1. **Removed lines 216-227** - The buggy code that updated local player role
2. **Added diagnostic logging** - To track presence updates
3. **Added explanatory comments** - To prevent future bugs

### Lines Removed

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
    setPlayerRole(role);
  }
}
```

### Lines Added

```typescript
// CRITICAL FIX: Only update room state (tracks other players)
// NEVER update our own role from presence events - it's set once on join
// and should remain immutable. Updating it here causes race conditions
// where Player 1's role gets overwritten when Player 2 joins.
updateRoomState(members, currentRoomId);

MultiplayerDiagnostics.log('PRESENCE_UPDATE_HANDLED', {
  roomId: currentRoomId,
  memberCount: members.length,
  localRoleUnchanged: playerRoleRef.current,
  members: members.map(m => ({
    clientId: m.clientId,
    role: (m.data as PresenceMemberData)?.role
  }))
});
```

## Summary

- **Changed:** 1 file
- **Lines removed:** 11
- **Lines added:** 9
- **Net change:** -2 lines

The fix is minimal and surgical - we simply removed the buggy code that was overwriting player roles on presence updates.
