# Debug Instructions - Second Player Becomes Spectator Bug

## What Was Added

Maximum logging has been added to track exactly what the Ably SDK is doing:

### 1. ably-client.ts
- Logs clientId generation/retrieval from sessionStorage
- Logs Ably.Realtime creation with config
- Logs connection state changes (connected, disconnected, failed)
- Verifies clientId consistency

### 2. useRoom.ts
- Logs hook instance ID to track re-renders
- Logs presence state BEFORE and AFTER entering presence
- Logs every presence event with full details
- Logs role determination logic
- Logs cleanup operations

## Testing Process

### Step 1: Open Two Browser Tabs

**Tab 1 (Create Room):**
1. Open DevTools Console (F12)
2. Clear console
3. Navigate to http://localhost:5173
4. Click "Create Room"
5. **COPY ALL CONSOLE OUTPUT** and save to file: `tab1-create.log`

**Tab 2 (Join Room):**
1. Open DevTools Console (F12)
2. Clear console
3. Navigate to the room URL from Tab 1
4. **COPY ALL CONSOLE OUTPUT** and save to file: `tab2-join.log`

**Tab 1 (After Tab 2 Joins):**
1. Check Tab 1 console for new messages
2. **COPY ANY NEW CONSOLE OUTPUT** and save to file: `tab1-after-join.log`

### Step 2: Critical Things to Look For

#### A. Are clientIds DIFFERENT between tabs?
```
Tab 1: [ably-client] ablyClient.auth.clientId: "abc123"
Tab 2: [ably-client] ablyClient.auth.clientId: "def456"
```
- If they're the SAME → that's the bug! (sessionStorage sharing)

#### B. Does Tab 1 call leaveRoom when Tab 2 joins?
```
Tab 1: [useRoom] leaveRoom CALLED
Tab 1: [useRoom] Cleanup triggered
```
- If yes → cleanup is still running incorrectly

#### C. How many members when Tab 2 joins?
```
Tab 2: [useRoom] Member count BEFORE enter: 1  ← Should be 1 (Tab 1)
Tab 2: [useRoom] Member count AFTER enter: 2   ← Should be 2 (Tab 1 + Tab 2)
```

#### D. What role does determineRole assign to Tab 2?
```
Tab 2: [useRoom] determineRole - playerXExists: true playerOExists: false
Tab 2: [useRoom] determineRole - returning role: O
```
- Should be 'O' (second player)
- If 'spectator' → determineRole is seeing 2+ players already!

#### E. How many presence events does Tab 2 trigger?
```
Tab 1: [useRoom] ===== PRESENCE EVENT =====
Tab 1: [useRoom] Event type: enter
Tab 1: [useRoom] Event clientId: def456  ← Tab 2's clientId
```
- Should be 1 'enter' event for Tab 2
- If multiple 'enter' events → presence.enter() called multiple times

### Step 3: Share Results

After capturing all logs, look for:

1. **ClientId mismatch**: Are both tabs using the same clientId?
2. **Multiple hook instances**: Does Tab 1 show multiple hookInstanceIds?
3. **Unexpected cleanup**: Does Tab 1 call leaveRoom when Tab 2 joins?
4. **Wrong member count**: Does Tab 2 see 2+ members before entering?
5. **Duplicate presence entries**: Are there multiple entries for the same clientId?

## Expected Correct Behavior

### Tab 1 (Create Room) Logs:
```
[ably-client] Generated NEW clientId: abc123
[ably-client] Creating Ably.Realtime with clientId: abc123
[ably-client] CONNECTION CONNECTED: { clientId: abc123, ... }
[useRoom] Hook instance: a1b2 roomId: ABCD-1234
[useRoom] Member count BEFORE enter: 0
[useRoom] determineRole - returning role: X
[useRoom] Member count AFTER enter: 1
```

### Tab 2 (Join Room) Logs:
```
[ably-client] Generated NEW clientId: def456  ← DIFFERENT from Tab 1
[ably-client] Creating Ably.Realtime with clientId: def456
[ably-client] CONNECTION CONNECTED: { clientId: def456, ... }
[useRoom] Hook instance: c3d4 roomId: ABCD-1234  ← DIFFERENT from Tab 1
[useRoom] Member count BEFORE enter: 1  ← Tab 1 is already in presence
[useRoom] determineRole - playerXExists: true playerOExists: false
[useRoom] determineRole - returning role: O  ← CORRECT!
[useRoom] Member count AFTER enter: 2
```

### Tab 1 (After Tab 2 Joins) Logs:
```
[useRoom] ===== PRESENCE EVENT =====
[useRoom] Event type: enter
[useRoom] Event clientId: def456  ← Tab 2 entered
[useRoom] Is this us? false
```

NO cleanup should be triggered in Tab 1!

## Next Steps

Once you have the logs, share them and I'll identify the exact root cause.
