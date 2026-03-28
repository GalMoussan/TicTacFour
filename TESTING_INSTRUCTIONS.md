# Testing Instructions for Multiplayer Bug Fix

## Quick Test (5 minutes)

### Setup
1. Dev server is already running at http://localhost:5173
2. Open TWO browser tabs (or use one normal + one incognito)

### Test Flow

#### Tab 1 (Player 1)
1. Navigate to http://localhost:5173
2. Click "Multiplayer"
3. Click "Create Room"
4. **Copy the room ID** (8-character code)
5. Open browser console (F12)
6. Run: `debug.clearLogs()`
7. You should see "Your role: X"

#### Tab 2 (Player 2)
1. Navigate to http://localhost:5173
2. Click "Multiplayer"
3. Paste the room ID from Tab 1
4. Click "Join"
5. Open browser console (F12)
6. Run: `debug.clearLogs()`
7. **Expected:** You should see "Your role: O"

#### Verification

**In Tab 1 console:**
```javascript
// Check your state
await debug.checkState()
// Should show: isConnected: true, clientId consistent

// Check room
await debug.checkRoom('YOUR_ROOM_ID')
// Should show: 2 members, one with role X, one with role O

// Get report
const report1 = debug.getReport()
console.log('Tab 1 Report:', report1)
```

**In Tab 2 console:**
```javascript
// Check your state
await debug.checkState()
// Should show: isConnected: true, clientId consistent

// Check room
await debug.checkRoom('YOUR_ROOM_ID')
// Should show: 2 members, one with role X, one with role O

// Get report
const report2 = debug.getReport()
console.log('Tab 2 Report:', report2)
```

### Success Criteria

- [x] Tab 1 shows "Your role: X"
- [x] Tab 2 shows "Your role: O"
- [x] Both tabs show 2 members in room
- [x] No disconnection errors in console
- [x] Both players can make moves
- [x] Diagnostic logs show clean flow

### What to Look For

#### In Tab 1 Console Logs:
```
[useRoom] Hook instance: XXXX roomId: abc12345
[DIAGNOSTIC:JOIN_ROOM_START] { roomId: 'abc12345', localPlayerId: '...', ... }
[DIAGNOSTIC:BEFORE_PRESENCE_ENTER] { memberCount: 0, ... }
[DIAGNOSTIC:AFTER_PRESENCE_ENTER] { newMemberCount: 1, role: 'X', ... }
[DIAGNOSTIC:PRESENCE_UPDATE_HANDLED] { memberCount: 2, ... } // When Player 2 joins
```

**CRITICAL:** After Player 2 joins, Tab 1 should NOT show any logs indicating role change!

#### In Tab 2 Console Logs:
```
[useRoom] Hook instance: YYYY roomId: abc12345
[DIAGNOSTIC:JOIN_ROOM_START] { roomId: 'abc12345', localPlayerId: '...', ... }
[DIAGNOSTIC:BEFORE_PRESENCE_ENTER] { memberCount: 1, members: [...], ... }
[DIAGNOSTIC:AFTER_PRESENCE_ENTER] { newMemberCount: 2, role: 'O', ... }
```

### Red Flags (BUG STILL EXISTS)

If you see:
- Tab 1: "Updating local player role: { oldRole: 'X', newRole: 'spectator' }" → BUG NOT FIXED
- Tab 2: "Your role: spectator" → BUG NOT FIXED
- Tab 1: Disconnected or "Waiting for opponent" after Tab 2 joins → BUG NOT FIXED
- Console errors about Ably or presence → NEW ISSUE

## Detailed Test (15 minutes)

### Test 1: Basic Two-Player Game

Follow Quick Test above, then:

1. **Tab 1:** Click a cell to make a move
   - Should work (you're Player X, it's your turn)
2. **Tab 2:** Click a cell to make a move
   - Should work (you're Player O, it's now your turn)
3. **Tab 1:** Make another move
4. Continue alternating

**Success:** Game plays normally without disconnections

### Test 2: Three Players (Spectator)

1. Keep Tab 1 and Tab 2 open (from Test 1)
2. Open **Tab 3**
3. Join the same room ID
4. **Expected:** Tab 3 should show "Your role: spectator"
5. Tab 3 should see the game but not be able to play

### Test 3: Player Leaves and Rejoins

1. **Tab 2:** Close the tab (or navigate away)
2. **Tab 1:** Should show "Opponent disconnected"
3. Open **new Tab 2**
4. Join the same room
5. **Expected:** New Tab 2 should become Player O again
6. Tab 1 should show opponent reconnected

### Test 4: Rapid Join/Leave

1. Create room in Tab 1
2. In Tab 2:
   - Join room
   - Immediately refresh page (F5)
   - Wait for it to reconnect
3. **Expected:** Should stabilize as Player O
4. No crashes or infinite loops

### Test 5: Diagnostic Tools

In any tab console:

```javascript
// Test 1: Check state
await debug.checkState()
// Should return: { isConnected: true, clientId: '...' }

// Test 2: Check room
await debug.checkRoom('YOUR_ROOM_ID')
// Should return array of presence members

// Test 3: Get full report
const report = debug.getReport()
console.log('Total events:', report.summary.totalEvents)
console.log('Categories:', report.summary.categories)

// Test 4: Examine specific events
const joinEvents = report.logs.filter(l => l.category === 'JOIN_ROOM_START')
console.log('Join events:', joinEvents)

const presenceEvents = report.logs.filter(l => l.category.includes('PRESENCE'))
console.log('Presence events:', presenceEvents)

// Test 5: Clear and start fresh
debug.clearLogs()
// Perform some action (like joining a room)
// Then check report again
```

## Automated Tests

```bash
# Run diagnostic tests (may timeout due to Ably connection in test env)
npm test -- src/multiplayer/__tests__/diagnostic-tests.test.tsx --run

# Run all multiplayer tests
npm test -- src/multiplayer/ --run
```

**Note:** Many tests may fail due to pre-existing test environment issues with Ably. Manual browser testing is more reliable.

## Troubleshooting

### "No room ID" error
- Make sure you copied the full 8-character room ID
- Check for extra spaces

### "Invalid room ID" error
- Room ID must be exactly 8 alphanumeric characters
- Case-sensitive

### Both players are X
- BUG NOT FIXED - check FIX_ANALYSIS.md
- Verify you applied the fix to useRoom.ts

### Cannot connect to Ably
- Check .env file has VITE_ABLY_API_KEY
- Check console for Ably errors
- Verify internet connection

### Debug tools not available
- Check browser console for errors
- Verify main.tsx imports './debug'
- Try refreshing page

## Performance Test

After 10+ moves:

```javascript
// Check for memory leaks or performance issues
const report = debug.getReport()
console.log('Total events:', report.summary.totalEvents)
// Should be reasonable (< 100 for normal gameplay)

// Check for duplicate subscriptions
// Look for multiple JOIN_ROOM_START with same roomId
const joins = report.logs.filter(l => l.category === 'JOIN_ROOM_START')
console.log('Join attempts:', joins.length)
// Should be 1 per player
```

## Clean Up

When done testing:

```javascript
// In each tab console
await debug.forceLeaveAll()

// Or just close tabs
```

## Reporting Issues

If the bug persists, collect:

1. **Browser console logs** from both tabs
2. **Diagnostic report:**
   ```javascript
   const report = debug.getReport()
   copy(JSON.stringify(report, null, 2))
   ```
3. **Room state:**
   ```javascript
   await debug.checkRoom('YOUR_ROOM_ID')
   ```
4. **Ably state:**
   ```javascript
   await debug.checkState()
   ```
5. **Screenshots** of both tabs showing roles

## Expected Timeline

- Quick Test: 5 minutes
- Detailed Test: 15 minutes
- Full Test Suite: 30 minutes

## Dev Server

Already running at http://localhost:5173

To restart:
```bash
# Kill current server
pkill -f vite

# Start new server
npm run dev
```
