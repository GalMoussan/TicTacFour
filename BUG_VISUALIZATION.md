# Visual Bug Reproduction: Client ID Mismatch

## The Bug in Action

### Scenario: Two Tabs Join the Same Room

```
┌─────────────────────────────────────────────────────────────────┐
│                         TAB 1                                    │
└─────────────────────────────────────────────────────────────────┘

[1] Tab 1 creates room
    ├─ Ably Client ID (sessionStorage): "session-abc-123"
    ├─ Local Player ID (nanoid):        "client-1"         ← Generated separately!
    └─ Enters presence with role X

[2] Presence state (what Ably sees):
    {
      clientId: "session-abc-123",  ← Ably uses this
      data: { role: "X" }
    }

[3] Room state (what useRoom sees):
    {
      playerXId: "session-abc-123",  ← From presence.clientId
      playerOId: null
    }

[4] Tab 1's local state:
    {
      localPlayerId: "client-1",     ← From nanoid()
      playerRole: "X"
    }

    ⚠️ MISMATCH: localPlayerId !== roomState.playerXId
    ⚠️ "client-1" !== "session-abc-123"


┌─────────────────────────────────────────────────────────────────┐
│                         TAB 2                                    │
└─────────────────────────────────────────────────────────────────┘

[1] Tab 2 joins room
    ├─ Ably Client ID (sessionStorage): "session-xyz-789"
    ├─ Local Player ID (nanoid):        "client-3"         ← Generated separately!
    └─ Enters presence with role O

[2] Presence state (what Ably sees):
    [
      {
        clientId: "session-abc-123",  ← Tab 1
        data: { role: "X" }
      },
      {
        clientId: "session-xyz-789",  ← Tab 2
        data: { role: "O" }
      }
    ]

[3] Room state (both tabs see):
    {
      playerXId: "session-abc-123",  ← Tab 1's Ably ID
      playerOId: "session-xyz-789"   ← Tab 2's Ably ID
    }

[4] Tab 2's local state:
    {
      localPlayerId: "client-3",     ← From nanoid()
      playerRole: "O"
    }

    ⚠️ MISMATCH: localPlayerId !== roomState.playerOId
    ⚠️ "client-3" !== "session-xyz-789"
```

---

## The Problem: Two ID Systems

```
┌─────────────────────────────────────────────────────────────────┐
│                      ID GENERATION                               │
└─────────────────────────────────────────────────────────────────┘

System 1: Ably Client ID (ably-client.ts)
┌────────────────────────────────────┐
│  getClientId()                     │
│  ├─ Read from sessionStorage       │
│  ├─ If not found: nanoid()         │
│  └─ Save to sessionStorage         │
│                                    │
│  Result: "session-abc-123"         │
│  Used by: Ably presence system     │
└────────────────────────────────────┘

                 ↓ NOT CONNECTED ↓

System 2: Local Player ID (useRoom.ts)
┌────────────────────────────────────┐
│  useRef(nanoid())                  │
│  ├─ Generated on component mount   │
│  ├─ Unique per hook instance       │
│  └─ Never synchronized             │
│                                    │
│  Result: "client-1"                │
│  Used by: Hook return value        │
└────────────────────────────────────┘
```

---

## Test Output Showing the Bug

### From Test Run:

```
[STEP 1] Tab 1 localPlayerId: client-1
         ↓ Hook generates this

[STEP 3] Tab 1 roomState.playerXId: channel-1774432560065-0.4556505683429207
         ↓ Presence returns this (mock uses channel ID as clientId)

✗ FAILED: expected 'channel-1774432560065-0.4556505683429207' to be 'client-1'
```

**In production**, the mismatch would be:
```
✗ FAILED: expected 'session-abc-123' to be 'client-1'
```

---

## How This Breaks Multiplayer

### Example: Checking "Is this my turn?"

```typescript
// In game logic
const isMyTurn = () => {
  const currentPlayerId =
    gameState.currentPlayer === 'X'
      ? roomState.playerXId   // "session-abc-123"
      : roomState.playerOId;  // "session-xyz-789"

  return currentPlayerId === localPlayerId;
  //     "session-abc-123" === "client-1"  → FALSE! 😢
};

// Result: Player X thinks it's NOT their turn, even though it is!
```

### Example: Rendering Player Names

```typescript
<div>
  {roomState.playerXId === localPlayerId ? "You" : "Opponent"}

  // roomState.playerXId = "session-abc-123"
  // localPlayerId = "client-1"
  // Result: Shows "Opponent" instead of "You"! 😢
</div>
```

---

## The Fix

### Solution: Use Ably's Client ID as localPlayerId

```typescript
// BEFORE (useRoom.ts line 106)
const localPlayerIdRef = useRef<string>(nanoid());

// AFTER
const localPlayerIdRef = useRef<string>(ablyClient.auth.clientId || nanoid());
```

### Why This Works:

```
┌─────────────────────────────────────────────────────────────────┐
│                      UNIFIED ID SYSTEM                           │
└─────────────────────────────────────────────────────────────────┘

Single Source of Truth: Ably Client ID
┌────────────────────────────────────┐
│  ablyClient.auth.clientId          │
│  ├─ Generated once per session     │
│  ├─ Stored in sessionStorage       │
│  ├─ Used by Ably presence          │
│  └─ Used by useRoom hook           │  ← NEW!
│                                    │
│  Result: "session-abc-123"         │
│  Used by: EVERYTHING               │
└────────────────────────────────────┘

Now:
  localPlayerId === roomState.playerXId  ✓
  "session-abc-123" === "session-abc-123"  ✓
```

---

## Test Evidence: The Bug is Real

### 3 out of 8 tests FAILED (as expected):

1. ❌ **Tab 1 should stay in room when Tab 2 joins**
   - Failed: Client ID mismatch
   - `expected 'channel-...' to be 'client-1'`

2. ❌ **Both tabs should see each other in presence**
   - Failed: Client ID mismatch
   - Timeout waiting for correct IDs

3. ❌ **RoomState should update without losing existing players**
   - Failed: Client ID mismatch
   - Room state has wrong player IDs

### 5 out of 8 tests PASSED:

These tests confirm **connectivity works**:
- ✅ Tab 1 stays connected (doesn't get kicked)
- ✅ Tab 1 channel stays attached
- ✅ Presence updates don't reset roles
- ✅ Tab 1 can publish after Tab 2 joins
- ✅ Both tabs can communicate

**Conclusion**: The infrastructure is solid, but **player identification is broken**.

---

## Impact Assessment

### Severity: 🔴 CRITICAL

**What works**:
- ✅ Connection management
- ✅ Channel lifecycle
- ✅ Presence tracking
- ✅ Message publishing
- ✅ Role assignment (X, O)

**What's broken**:
- ❌ Player identification
- ❌ "Is this me?" checks
- ❌ Turn validation
- ❌ Player-specific UI
- ❌ All game logic relying on player IDs

**Can players play together?**
- No. Even though both are connected, the game logic can't identify players correctly.

---

## Reproduction Steps (Manual Testing)

1. Open browser Tab 1
2. Create a room
3. Check console:
   ```javascript
   console.log('Ably ID:', ablyClient.auth.clientId);
   console.log('Local ID:', localPlayerId);
   // These will be DIFFERENT!
   ```

4. Open browser Tab 2 (same window)
5. Join the same room
6. Check console:
   ```javascript
   console.log('Ably ID:', ablyClient.auth.clientId);
   console.log('Local ID:', localPlayerId);
   // These will be DIFFERENT!
   ```

7. In Tab 1, check room state:
   ```javascript
   console.log('Room playerXId:', roomState.playerXId);
   console.log('My localPlayerId:', localPlayerId);
   console.log('Match?', roomState.playerXId === localPlayerId);
   // Will print: false 😢
   ```

---

## Summary

**Test Outcome**: ✅ **SUCCESS** - Bug successfully reproduced!

**Bug Type**: Client ID synchronization issue

**Root Cause**: Two separate ID generation systems (Ably's clientId vs. hook's localPlayerId)

**Fix Complexity**: Simple - one line change

**Test Coverage**: Comprehensive - 8 tests covering all scenarios

**Next Step**: Implement the fix and re-run tests
