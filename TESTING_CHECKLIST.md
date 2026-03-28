# Testing Checklist - Second Player Spectator Bug Fix

## Pre-Test Setup

### 1. Start Dev Server
```bash
cd /Users/galmoussan/projects/claude/tictacfor
npm run dev
```

### 2. Open DevTools
- Open Chrome or Firefox
- Press F12 to open DevTools
- Go to Console tab
- **IMPORTANT:** Enable "Preserve log" to keep logs when navigating

## Test Scenario 1: Basic Two-Player Join

### Tab 1 (Player X - Room Creator)
1. Navigate to `http://localhost:5173/multiplayer`
2. Click "Create Room"
3. Note the room ID
4. **Check Console:**
   - [ ] `[useRoom] Effect triggered`
   - [ ] `[useRoom] joinRoomChannel START`
   - [ ] `[useRoom] Presence members: { memberCount: 0 }`
   - [ ] `[useRoom] Role determined: { role: "X" }`
   - [ ] `[useRoom] Entered presence with role: X`
   - [ ] `[MultiplayerPage] State { playerRole: "X" }`

5. **Check UI:**
   - [ ] Shows "Role: Player X"
   - [ ] Shows "Waiting for Opponent" screen
   - [ ] Room ID is displayed

### Tab 2 (Player O - Joiner)
1. Open new tab to `http://localhost:5173/multiplayer`
2. Enter room ID from Tab 1
3. Click "Join Room"
4. **Check Console:**
   - [ ] `[useRoom] Effect triggered`
   - [ ] `[useRoom] joinRoomChannel START`
   - [ ] `[useRoom] Presence members: { memberCount: 1 }` (sees Player X)
   - [ ] `[useRoom] Role determined: { role: "O" }` ✅ CRITICAL
   - [ ] `[useRoom] Entered presence with role: O`
   - [ ] `[MultiplayerPage] State { playerRole: "O" }`

5. **Check UI:**
   - [ ] Shows "Role: Player O"
   - [ ] Shows game board (not waiting screen)
   - [ ] Shows both players in room status

### Tab 1 (After Tab 2 Joins) - CRITICAL CHECK
1. Switch back to Tab 1
2. **Check Console for BAD patterns:**
   - [ ] ❌ NO `[useRoom] Cleanup triggered` (unless you explicitly leave)
   - [ ] ❌ NO `[useRoom] leaveRoom CALLED` (unless you explicitly leave)
   - [ ] ✅ YES `[useRoom] Presence event received: { action: "enter", role: "O" }`
   - [ ] ✅ YES `[useRoom] Presence update: { memberCount: 2 }`

3. **Check UI:**
   - [ ] Still shows "Role: Player X" (NOT changed)
   - [ ] Shows game board (NOT waiting screen anymore)
   - [ ] Shows both players in room status
   - [ ] Can make moves

## Test Scenario 2: Third Player (Spectator)

### Tab 3 (Spectator)
1. Open third tab to `http://localhost:5173/multiplayer`
2. Enter same room ID
3. Click "Join Room"
4. **Check Console:**
   - [ ] `[useRoom] Presence members: { memberCount: 2 }` (sees X and O)
   - [ ] `[useRoom] Role determined: { role: "spectator" }`
   - [ ] `[useRoom] Entered presence with role: spectator`

5. **Check UI:**
   - [ ] Shows "Role: Spectator"
   - [ ] Cannot make moves
   - [ ] Can see game state

### Tabs 1 & 2 (After Tab 3 Joins)
- [ ] Both still show their original roles (X and O)
- [ ] No disconnections
- [ ] No unexpected cleanup logs

## Test Scenario 3: Player Disconnect and Rejoin

### Tab 1 (Player X)
1. Close Tab 1 completely
2. **Check Tab 2 Console:**
   - [ ] `[useRoom] Presence event received: { action: "leave" }`
   - [ ] `[useRoom] Presence update: { memberCount: 1 }` (or 2 if spectator present)

### Tab 1 (Rejoin)
1. Open new tab to `http://localhost:5173/multiplayer`
2. Join with same room ID
3. **Check Console:**
   - [ ] `[useRoom] Presence members: { memberCount: 1 }` (sees Player O)
   - [ ] `[useRoom] Role determined: { role: "X" }` (gets X back)

## Test Scenario 4: Rapid Join/Leave

### Multiple Tabs
1. Open 5 tabs rapidly
2. Join/leave room quickly
3. **Check All Consoles:**
   - [ ] No duplicate channel warnings
   - [ ] No race conditions
   - [ ] Roles assigned correctly (X, O, spectator, spectator, spectator)

## Expected Console Log Pattern (GOOD)

### Tab 1 (Create):
```
[MultiplayerPage] Render { roomId: "ABC123", ... }
[useRoom] Effect triggered { roomId: "ABC123", hasChannel: false, ... }
[useRoom] joinRoomChannel START { roomId: "ABC123", ... }
[useRoom] Presence members: { members: [], memberCount: 0 }
[useRoom] Role determined: { role: "X", ... }
[useRoom] Entered presence with role: X
[useRoom] joinRoomChannel COMPLETE { role: "X", ... }
[MultiplayerPage] State { playerRole: "X", ... }
```

### Tab 2 (Join):
```
[MultiplayerPage] Render { roomId: "ABC123", ... }
[useRoom] Effect triggered { roomId: "ABC123", hasChannel: false, ... }
[useRoom] joinRoomChannel START { roomId: "ABC123", ... }
[useRoom] Presence members: { members: [{role: "X"}], memberCount: 1 }
[useRoom] Role determined: { role: "O", ... }
[useRoom] Entered presence with role: O
[useRoom] joinRoomChannel COMPLETE { role: "O", ... }
[MultiplayerPage] State { playerRole: "O", ... }
```

### Tab 1 (After Tab 2 Joins):
```
[useRoom] Presence event received: { action: "enter", clientId: "...", data: {role: "O"} }
[useRoom] Presence update: { members: [...], memberCount: 2 }
[MultiplayerPage] Render { roomId: "ABC123", ... }
[MultiplayerPage] State { playerRole: "X", opponentConnected: true, ... }
```

## BAD Patterns to Watch For

### ❌ Tab 1 Disconnecting When Tab 2 Joins:
```
[useRoom] Presence event received: { action: "enter", role: "O" }
[MultiplayerPage] Render { ... }  ← Parent re-renders
[useRoom] Cleanup triggered { ... }  ❌ BAD!
[useRoom] leaveRoom CALLED { ... }  ❌ BAD!
[useRoom] Left presence successfully  ❌ BAD!
```

### ❌ Tab 2 Becoming Spectator:
```
[useRoom] Presence members: { memberCount: 2 }  ← Sees ghost player
[useRoom] Role determined: { role: "spectator" }  ❌ BAD! Should be "O"
```

### ❌ Duplicate Channels:
```
[useRoom] joinRoomChannel START { hasExistingChannel: true }
[useRoom] Already have channel, skipping join  ← OK, this is the fix working
```

## Success Criteria

All of these must pass:
- [ ] Tab 1 stays as Player X throughout
- [ ] Tab 2 becomes Player O (NOT spectator)
- [ ] Tab 3 becomes Spectator
- [ ] No unexpected disconnections
- [ ] No cleanup logs except on explicit leave/unmount
- [ ] No duplicate channel warnings
- [ ] Both players can make moves
- [ ] Game state syncs correctly

## If Tests Fail

### Collect Debug Info:
1. Full console logs from all tabs
2. Network tab showing WebSocket messages
3. Screenshot of final UI state
4. Which specific test scenario failed

### Share with developer:
- Copy entire console output
- Note which checkbox failed
- Describe unexpected behavior

## After Successful Testing

### Next Steps:
1. Re-enable StrictMode in `/Users/galmoussan/projects/claude/tictacfor/src/main.tsx`
2. Re-test with StrictMode enabled
3. If still works, remove debug logging
4. Add regression tests
5. Deploy to production

### Re-enable StrictMode:
```typescript
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

## Notes

- StrictMode is currently **DISABLED** for debugging
- Debug logging is **ENABLED** (will show lots of console.log)
- All logging starts with `[useRoom]` or `[MultiplayerPage]`
- Preserve console logs to see full sequence
- Test in incognito/private mode for clean state
