# Multiplayer Bug Debugging Guide

## Problem Statement

- **Second player becomes spectator** instead of Player O
- **First player gets disconnected** when second player joins
- No console errors visible
- All previous fixes didn't work

## Debugging System Overview

This comprehensive debugging system includes:

1. **Diagnostics Class** - Tracks all multiplayer events
2. **Browser Console Tools** - Manual inspection tools
3. **Instrumented useRoom Hook** - Logs every critical step
4. **Test Suite** - Automated diagnostic tests

## How to Use the Debugging Tools

### 1. Browser Console Tools

The debug tools are automatically available in the browser console via the `debug` global object.

#### Check Current State
```javascript
// Check Ably connection and client ID consistency
await debug.checkState()
```

**What to look for:**
- `isConnected: true` - Ably should be connected
- `clientId` should match between sessionStorage and ablyClient
- Mismatch indicates a clientId synchronization problem

#### Check Specific Room
```javascript
// Replace with your actual room ID
await debug.checkRoom('abc123')
```

**What to look for:**
- Number of members in the room
- Each member's clientId and role
- Duplicate clientIds (indicates same browser joining twice)
- Missing roles (indicates role assignment failure)

#### Get Full Diagnostic Report
```javascript
debug.getReport()
```

**What to look for:**
- Sequence of events (JOIN_ROOM_START, BEFORE_PRESENCE_ENTER, etc.)
- Timeline of what happened in what order
- Unexpected events or event order

#### Clear Logs
```javascript
debug.clearLogs()
```

Use this before starting a new test to get clean logs.

#### Force Leave All Rooms
```javascript
// Nuclear option - leaves all channels
await debug.forceLeaveAll()
```

Use this if you get stuck in a bad state.

### 2. Console Logging

The `useRoom` hook now logs diagnostic information at every critical step:

#### Key Log Categories

1. **JOIN_ROOM_START**
   - When: Hook starts joining a room
   - Data: roomId, localPlayerId, hasExistingChannel, hookInstanceId
   - Look for: Multiple JOIN_ROOM_START for same room (indicates re-render loop)

2. **BEFORE_PRESENCE_ENTER**
   - When: Before calling `presence.enter()`
   - Data: roomId, memberCount, members, ourClientId, alreadyInPresence
   - Look for: `alreadyInPresence: true` (indicates duplicate join attempt)

3. **AFTER_PRESENCE_ENTER**
   - When: After calling `presence.enter()`
   - Data: roomId, newMemberCount, role, members
   - Look for: Role mismatch, unexpected member count

4. **LEAVE_ROOM**
   - When: User leaves room
   - Data: localPlayerId, playerRole, channelName
   - Look for: Unexpected leave calls

5. **CLEANUP_TRIGGERED**
   - When: useEffect cleanup runs
   - Data: roomId, isMounted, willCleanup
   - Look for: `willCleanup: true` when it shouldn't be (indicates premature cleanup)

### 3. Testing Flow

#### Manual Testing Steps

**Setup: Two Browser Tabs**

Tab 1:
```javascript
// Clear logs first
debug.clearLogs()

// Go to localhost:5173
// Create a room (note the room ID)

// Check state
await debug.checkState()
```

Tab 2:
```javascript
// Clear logs first
debug.clearLogs()

// Join the room created in Tab 1
// Paste the room ID

// Check state
await debug.checkState()
```

**Then check both tabs:**

Tab 1:
```javascript
// Get diagnostic report
const report1 = debug.getReport()
console.log('Tab 1 Report:', JSON.stringify(report1, null, 2))

// Check room state
await debug.checkRoom('YOUR_ROOM_ID')
```

Tab 2:
```javascript
// Get diagnostic report
const report2 = debug.getReport()
console.log('Tab 2 Report:', JSON.stringify(report2, null, 2))

// Check room state
await debug.checkRoom('YOUR_ROOM_ID')
```

## Patterns to Look For

### Pattern 1: Duplicate Client IDs
**Symptom:** Same clientId appears twice in presence members
**Cause:** Same browser tab joining twice (double-mount, re-render)
**Evidence in logs:**
- Multiple `JOIN_ROOM_START` with same hookInstanceId
- `alreadyInPresence: true` in BEFORE_PRESENCE_ENTER

### Pattern 2: Client ID Mismatch
**Symptom:** sessionStorage clientId != ablyClient.auth.clientId
**Cause:** ablyClient getting recreated with new clientId
**Evidence in logs:**
- `CLIENT_ID_CONSISTENCY: { consistent: false }`
- Different clientIds in different log entries

### Pattern 3: Premature Cleanup
**Symptom:** First player disconnects when second joins
**Cause:** useRoom cleanup running when it shouldn't
**Evidence in logs:**
- `CLEANUP_TRIGGERED` when component is still mounted
- `willCleanup: true` followed by `LEAVE_ROOM`
- Hook instance changing unexpectedly

### Pattern 4: Role Reassignment
**Symptom:** Player role changes from X to spectator
**Cause:** Presence update handler reassigning role
**Evidence in logs:**
- `Updating local player role: { oldRole: 'X', newRole: 'spectator' }`
- Member count changes unexpectedly
- Role determination logic miscalculating

### Pattern 5: Multiple Hook Instances
**Symptom:** Multiple useRoom hooks active simultaneously
**Cause:** Component re-mounting or multiple components using useRoom
**Evidence in logs:**
- Different `hookInstanceId` values in logs
- Multiple `JOIN_ROOM_START` for same room
- Conflicting presence enters

## Hypotheses to Test

### Hypothesis 1: Ably clientId Changes
**Test:**
```javascript
// In Tab 1, before and after Tab 2 joins
console.log('ClientId before:', ablyClient.auth.clientId)
// Wait for Tab 2 to join
console.log('ClientId after:', ablyClient.auth.clientId)
```

**Expected:** ClientId should remain the same
**If it changes:** Ably client is being recreated

### Hypothesis 2: Double Mount
**Test:**
```javascript
// Count JOIN_ROOM_START events
const joinEvents = debug.getReport().logs.filter(l => l.category === 'JOIN_ROOM_START')
console.log('Number of join attempts:', joinEvents.length)
console.log('Join events:', joinEvents)
```

**Expected:** 1 join per room
**If multiple:** Component is re-mounting or re-rendering

### Hypothesis 3: Presence State Race Condition
**Test:**
```javascript
// Check timing of presence updates
const presenceEvents = debug.getReport().logs.filter(l =>
  l.category.includes('PRESENCE')
)
console.log('Presence event timeline:', presenceEvents.map(e => ({
  time: new Date(e.timestamp).toISOString(),
  category: e.category,
  memberCount: e.data.memberCount || e.data.newMemberCount
})))
```

**Expected:** Clean sequence: BEFORE -> AFTER with increasing member count
**If chaotic:** Race condition or overlapping join attempts

## Next Steps After Diagnosis

Once you've identified the pattern, implement the appropriate fix:

1. **Duplicate Client IDs** → Add duplicate check before presence.enter()
2. **Client ID Mismatch** → Fix client ID generation/storage
3. **Premature Cleanup** → Fix useEffect dependency array
4. **Role Reassignment** → Fix presence update handler logic
5. **Multiple Hook Instances** → Fix component architecture

## Running the Tests

```bash
npm test -- src/multiplayer/__tests__/diagnostic-tests.test.tsx --run
```

Note: Tests may timeout in test environment due to Ably connection issues.
Manual browser testing is more reliable for this specific bug.

## Development Server

```bash
npm run dev
```

Then open http://localhost:5173 in two browser tabs.
