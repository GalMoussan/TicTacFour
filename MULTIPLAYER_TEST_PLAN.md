# Multiplayer Test Plan - 4x4x4 Tic-Tac-Toe

## Overview

This document provides a comprehensive manual testing guide for the multiplayer functionality of the 4x4x4 Tic-Tac-Toe game. The multiplayer system uses Ably for real-time communication and supports player roles, room management, and game synchronization.

**Technology Stack:**
- Real-time messaging: Ably
- State management: Zustand
- Routing: React Router DOM
- Room ID generation: nanoid

---

## Prerequisites

Before starting manual testing, ensure:

1. **Ably API Key Configured**
   - Environment variable or configuration must have a valid Ably API key
   - Check `/Users/galmoussan/projects/claude/tictacfor/src/multiplayer/ably-client.ts` for configuration

2. **Development Server Running**
   ```bash
   npm run dev
   ```

3. **Multiple Browser Windows/Tabs**
   - Use regular windows, incognito/private tabs, or different browsers
   - Simulate different players by using separate sessions

4. **Network Connectivity**
   - Stable internet connection required for Ably real-time messaging
   - For production testing, consider testing across different networks

---

## Test Scenarios

### 1. Create Room Flow

**Objective:** Verify that a player can successfully create a new game room.

**Steps:**
1. Navigate to the home page at `http://localhost:5173/`
2. Click on "Multiplayer" or navigate to `/multiplayer`
3. On the Room Lobby page, click the "Create Room" button
4. Observe the button state change to "Creating..."

**Expected Results:**
- Room ID is generated (8 alphanumeric characters via nanoid)
- Navigation occurs to `/room/:roomId` where `:roomId` is the generated ID
- Player is automatically assigned as Player X (first player)
- "Waiting for Opponent" screen is displayed
- Room code is displayed prominently in large font
- "Share Room Link" button is visible and functional
- Connection status shows "Player X: Connected" and "Player O: Waiting"

**Key Files:**
- `/Users/galmoussan/projects/claude/tictacfor/src/components/RoomLobby.tsx`
- `/Users/galmoussan/projects/claude/tictacfor/src/multiplayer/useRoom.ts`
- `/Users/galmoussan/projects/claude/tictacfor/src/multiplayer/utils.ts`

**Edge Cases:**
- Network failure during room creation
- Multiple rapid clicks on "Create Room" button (should be disabled after first click)

---

### 2. Join Room Flow

**Objective:** Verify that a second player can join an existing room using the room ID.

**Steps:**
1. Open a second browser window/tab (incognito mode recommended)
2. Navigate to `/multiplayer`
3. In the "Join Existing Room" section, enter the room ID from Test 1
4. Click the "Join" button
5. Observe the button state change to "Joining..."

**Expected Results:**
- Room ID validation passes (8 alphanumeric characters)
- Navigation occurs to `/room/:roomId`
- Player is assigned as Player O (second player)
- Game starts immediately (no more waiting screen)
- First window (Player X) transitions from waiting screen to game view
- Both players see the game board (4 flat grids + 3D visualization)
- Connection status shows both players as "Connected"
- Player X's turn indicator is active (game starts with X)

**Key Files:**
- `/Users/galmoussan/projects/claude/tictacfor/src/components/RoomLobby.tsx`
- `/Users/galmoussan/projects/claude/tictacfor/src/pages/MultiplayerPage.tsx`
- `/Users/galmoussan/projects/claude/tictacfor/src/multiplayer/useRoom.ts`

**Edge Cases:**
- Empty room ID input (should show error: "Please enter a room ID")
- Invalid room ID format (should show error: "Invalid room ID. Room ID must be 8 alphanumeric characters.")
- Non-existent room ID (Ably should handle gracefully)

---

### 3. Move Synchronization

**Objective:** Verify that moves made by one player are instantly reflected on the opponent's screen.

**Test 3A: Player X Makes a Move**

**Steps:**
1. With both players in the room (from Test 2)
2. On Player X's browser, click on any empty cell in the flat board grid
3. Observe both screens

**Expected Results:**
- Player X's screen:
  - Cell is immediately marked with X symbol
  - Turn indicator switches to "Player O's turn"
  - 3D view shows the X piece (blue sphere)
  - Cell becomes disabled/unclickable

- Player O's screen:
  - Move appears within ~100-500ms (Ably latency)
  - Cell shows X symbol
  - Turn indicator shows "Your turn" (Player O)
  - 3D view updates with X piece
  - Player O can now make a move

**Test 3B: Player O Makes a Move**

**Steps:**
1. On Player O's browser, click on any empty cell
2. Observe both screens

**Expected Results:**
- Player O's screen:
  - Cell is immediately marked with O symbol
  - Turn indicator switches to "Player X's turn"
  - 3D view shows the O piece (red sphere)
  - Cell becomes disabled

- Player X's screen:
  - Move appears within ~100-500ms
  - Cell shows O symbol
  - Turn indicator shows "Your turn" (Player X)
  - 3D view updates with O piece

**Test 3C: Move Alternation**

**Steps:**
1. Continue making moves alternately between Player X and Player O
2. Verify that each move is synchronized

**Expected Results:**
- Moves strictly alternate: X → O → X → O
- No player can make two moves in a row
- Clicking during opponent's turn has no effect
- All moves appear on both screens in real-time
- 3D visualization stays in sync with flat grids

**Key Files:**
- `/Users/galmoussan/projects/claude/tictacfor/src/multiplayer/useMultiplayer.ts`
- `/Users/galmoussan/projects/claude/tictacfor/src/store/gameStore.ts`
- `/Users/galmoussan/projects/claude/tictacfor/src/components/FlatBoard.tsx`

**Edge Cases:**
- Rapid clicking on multiple cells (only first valid move should register)
- Clicking on already-occupied cells (should be ignored)
- Network lag causing delayed synchronization

---

### 4. Win Detection

**Objective:** Verify that winning conditions are detected and synchronized across both players.

**Test 4A: Horizontal Win**

**Steps:**
1. Play moves to create a winning line of 4 in a row horizontally
   - Example: Layer 0, Row 0: (0,0,0), (0,0,1), (0,0,2), (0,0,3)
2. Observe both screens when the winning move is made

**Expected Results:**
- Both players see:
  - Winner banner displayed (e.g., "Player X Wins!")
  - Winning cells highlighted in both flat grid and 3D view
  - Game board becomes disabled (no more moves possible)
  - "Rematch" button appears
  - Game status shows "finished"

**Test 4B: Vertical Win**

**Steps:**
1. Start a new game (use Rematch button from Test 4A)
2. Play moves to create a vertical winning line
   - Example: Layer 0, Column 0: (0,0,0), (0,1,0), (0,2,0), (0,3,0)

**Expected Results:**
- Same as Test 4A but with vertical winning line highlighted

**Test 4C: Diagonal Win (Space Diagonal)**

**Steps:**
1. Start a new game
2. Play moves to create a 3D diagonal winning line
   - Example: (0,0,0), (1,1,1), (2,2,2), (3,3,3)

**Expected Results:**
- Same as Test 4A but with 3D diagonal winning line highlighted
- Both flat grids and 3D view should show all 4 winning cells highlighted

**Test 4D: Draw Game**

**Steps:**
1. Start a new game
2. Fill all 64 cells without creating a winning line (requires strategic play)

**Expected Results:**
- Both players see:
  - Draw announcement (e.g., "It's a Draw!")
  - No cells highlighted
  - "Rematch" button appears
  - Game status shows "draw"

**Key Files:**
- `/Users/galmoussan/projects/claude/tictacfor/src/game/logic.ts`
- `/Users/galmoussan/projects/claude/tictacfor/src/components/MultiplayerGameInfo.tsx`

**Edge Cases:**
- Win on the last move (cell 64)
- Simultaneous win detection on both clients

---

### 5. Reconnection Handling

**Objective:** Verify that players can reconnect to an in-progress game and sync state.

**Test 5A: Mid-Game Reconnection**

**Steps:**
1. Start a game with two players
2. Make 5-10 moves to establish game state
3. On Player O's browser, close the tab/window
4. Note the current board state from Player X's screen
5. Reopen a new tab and navigate directly to the room URL: `/room/:roomId`

**Expected Results:**
- Player O reconnects to the room
- Player O is reassigned as Player O (same role)
- SYNC_REQUEST is sent automatically on reconnection
- Game board syncs to current state within ~1-2 seconds
- All previous moves are visible
- Player O can continue playing from current state
- Player X sees "Opponent Connected" status update

**Test 5B: Total Disconnect**

**Steps:**
1. During an active game, disconnect Player O's network (airplane mode or disable Wi-Fi)
2. Wait 10-15 seconds
3. Observe Player X's screen
4. Reconnect Player O's network

**Expected Results:**
- Player X sees:
  - "Opponent disconnected" status message
  - Can see current board state but cannot make moves (depending on implementation)

- After reconnection:
  - Player O automatically rejoins
  - Game state syncs via SYNC_REQUEST/SYNC_RESPONSE
  - Game resumes from current state

**Key Files:**
- `/Users/galmoussan/projects/claude/tictacfor/src/multiplayer/useMultiplayer.ts` (lines 346-350)
- `/Users/galmoussan/projects/claude/tictacfor/src/multiplayer/ably-client.ts`

**Edge Cases:**
- Reconnection after opponent made additional moves
- Both players disconnect and reconnect
- Reconnection during turn transition

---

### 6. Spectator Mode

**Objective:** Verify that a third player joining a room becomes a spectator.

**Steps:**
1. Have Player X and Player O in an active game
2. Open a third browser window/tab (third session)
3. Navigate to `/multiplayer`
4. Join the same room using the room ID
5. Observe the third player's screen

**Expected Results:**
- Third player is assigned role: "spectator"
- Spectator sees the full game board and current state
- Spectator cannot click cells to make moves
- Spectator sees turn indicators and current player
- Spectator badge/indicator shows "Spectating" in room status
- Room status shows: Player X (Connected), Player O (Connected), Spectator badge
- Spectator can see moves in real-time as they happen
- Spectator can see win/draw outcomes

**Key Files:**
- `/Users/galmoussan/projects/claude/tictacfor/src/multiplayer/useRoom.ts` (lines 126-141)
- `/Users/galmoussan/projects/claude/tictacfor/src/components/RoomStatus.tsx`
- `/Users/galmoussan/projects/claude/tictacfor/src/multiplayer/useMultiplayer.ts` (lines 272-274)

**Edge Cases:**
- Multiple spectators (4th, 5th players)
- Spectator joins mid-game
- Spectator disconnects (should not affect game)

---

### 7. Invalid Room ID Handling

**Objective:** Verify that invalid room IDs are handled gracefully.

**Test 7A: Malformed Room ID**

**Steps:**
1. Navigate directly to `/room/invalid123` (not 8 characters)
2. Observe the page

**Expected Results:**
- "Invalid Room ID" error page is displayed
- Error message: "The room you're trying to join doesn't exist or has an invalid ID."
- "Back to Multiplayer Lobby" button is visible and functional
- No attempt to connect to Ably is made

**Test 7B: Non-Existent Room ID**

**Steps:**
1. Navigate directly to `/room/XXXXXXXX` (8 characters but doesn't exist)
2. Observe the behavior

**Expected Results:**
- If validation passes format check, page attempts to join
- Player becomes Player X in an empty room (creates room implicitly)
- "Waiting for Opponent" screen is shown
- Or: Error handling shows "Room not found" (depends on implementation)

**Test 7C: Special Characters in Room ID**

**Steps:**
1. Try to join a room with ID containing special characters: `room/@#$%^&*`
2. Observe validation behavior

**Expected Results:**
- Room ID validation fails
- Error message shown: "Invalid room ID. Room ID must be 8 alphanumeric characters."
- No navigation occurs

**Key Files:**
- `/Users/galmoussan/projects/claude/tictacfor/src/multiplayer/utils.ts`
- `/Users/galmoussan/projects/claude/tictacfor/src/pages/MultiplayerPage.tsx` (lines 98-101)

---

### 8. Edge Cases and Stress Testing

**Test 8A: Opponent Never Joins**

**Steps:**
1. Create a room as Player X
2. Wait on the "Waiting for Opponent" screen
3. Observe behavior after 1-2 minutes

**Expected Results:**
- Player X remains on waiting screen indefinitely
- No timeout error (unless implemented)
- Room remains active
- If Player O joins later, game starts normally

**Test 8B: Opponent Disconnects Mid-Game**

**Steps:**
1. Start a game with two players
2. During Player O's turn, close Player O's browser completely
3. Observe Player X's screen

**Expected Results:**
- Player X sees "Opponent disconnected" status
- Opponent connection status shows "Waiting" or "Disconnected"
- Game state is preserved
- Player X cannot continue making moves (no opponent)
- If Player O reconnects, game resumes

**Test 8C: Simultaneous Moves (Race Condition)**

**Steps:**
1. Start a game with Player X and Player O
2. During Player X's turn, have Player O attempt to click a cell at the exact same moment Player X clicks
3. Observe behavior

**Expected Results:**
- Only the valid move (Player X's) should be registered
- Player O's move is ignored because it's not their turn
- Turn validation prevents simultaneous move acceptance
- No duplicate moves or desync occurs

**Test 8D: Copy Room Link Functionality**

**Steps:**
1. In the waiting screen or during an active game, click "Copy" button next to room code
2. Paste the clipboard contents into a new browser tab

**Expected Results:**
- Room URL is copied to clipboard: `http://localhost:5173/room/:roomId`
- "Copied!" confirmation message appears briefly (2 seconds)
- Pasting URL into new tab navigates to the room
- New player can join via the copied link

**Test 8E: Rematch Flow**

**Steps:**
1. Complete a game to win or draw
2. On Player X's screen, click "Rematch" button
3. Observe both screens

**Expected Results:**
- Player X's screen:
  - Board resets to empty state
  - Turn indicator shows "Your turn" (Player X starts)
  - Game status changes from "finished"/"draw" to "playing"
  - Rematch button disappears

- Player O's screen:
  - Board resets automatically via REMATCH message
  - Turn indicator shows "Player X's turn"
  - Both players can start a new game immediately
  - Game state is synchronized

**Key Files:**
- `/Users/galmoussan/projects/claude/tictacfor/src/multiplayer/useMultiplayer.ts` (lines 314-324)
- `/Users/galmoussan/projects/claude/tictacfor/src/components/RoomStatus.tsx` (lines 34-50)

---

## Test Data Matrix

| Test Scenario | Player X Browser | Player O Browser | Expected Outcome |
|---------------|-----------------|------------------|------------------|
| Room Creation | Create Room | - | Room ID generated, waiting screen |
| Room Join | Waiting | Join with ID | Both enter game view |
| Move Sync | Click cell | - | Move appears on both screens |
| Win Detection | Make winning move | - | Both see winner banner |
| Reconnection | Active | Close & reopen tab | Game state syncs |
| Spectator | Active | Active | 3rd browser: spectator mode |
| Invalid ID | - | Navigate to /room/bad | Error page shown |
| Rematch | Click rematch | - | Both boards reset |

---

## Test Environment Setup

### Local Testing (Development)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Ably**
   - Ensure Ably API key is set in environment or configuration
   - Check `/Users/galmoussan/projects/claude/tictacfor/src/multiplayer/ably-client.ts`

3. **Start Dev Server**
   ```bash
   npm run dev
   ```
   - Default: `http://localhost:5173`

4. **Browser Setup**
   - Browser 1: Regular window (Player X)
   - Browser 2: Incognito/Private window (Player O)
   - Browser 3: Different browser or another incognito window (Spectator)

### Production Testing (Optional)

1. **Build Production Version**
   ```bash
   npm run build
   ```

2. **Preview Production Build**
   ```bash
   npm run preview
   ```

3. **Network Testing**
   - Test across different networks (Wi-Fi, mobile, etc.)
   - Test with VPN connections
   - Test with varying network speeds

---

## Known Limitations

Based on code analysis:

1. **No Timeout for Waiting Players**
   - Player X can wait indefinitely for Player O
   - No automatic room cleanup after inactivity

2. **Limited SYNC_RESPONSE Handling**
   - Line 176 in `useMultiplayer.ts`: SYNC_RESPONSE only logs, doesn't fully restore state
   - Full game state restoration may require additional implementation

3. **No Persistent Storage**
   - Game state exists only in memory (Zustand store)
   - Refreshing browser page loses game state (unless reconnection syncs)

4. **No Chat/Communication**
   - Players cannot send messages to each other
   - Only game actions are synchronized

5. **No Room List/Discovery**
   - Players must manually share room IDs
   - No lobby listing available rooms

---

## Success Criteria

The multiplayer functionality passes manual testing if:

- [ ] Room creation works consistently (100% success rate)
- [ ] Room joining with valid ID works consistently
- [ ] Invalid room IDs are handled gracefully with clear error messages
- [ ] Move synchronization occurs within 1 second across all clients
- [ ] All 76 winning conditions are detected correctly
- [ ] Win/draw state is synchronized across both players
- [ ] Reconnection restores game state within 2 seconds
- [ ] Spectator mode allows view-only access
- [ ] No duplicate moves or desync issues occur
- [ ] Rematch functionality resets the game for both players
- [ ] Copy room link functionality works across all browsers

---

## Bug Reporting Template

When manual testing reveals bugs, use this template:

```markdown
### Bug Report

**Test Scenario:** [Name of test from this document]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Environment:**
- Browser: [Chrome/Firefox/Safari + version]
- OS: [macOS/Windows/Linux]
- Network: [Local/Wi-Fi/Mobile]
- Server: [Dev/Production]

**Screenshots/Videos:**
[Attach if available]

**Console Errors:**
[Paste any relevant console errors]

**Related Files:**
[List file paths if known]
```

---

## Appendix: Key Architecture Notes

### Message Types

The multiplayer system uses these message types (see `/Users/galmoussan/projects/claude/tictacfor/src/multiplayer/types.ts`):

1. **MOVE** - Player makes a move (z, y, x, player)
2. **JOIN** - Player joins the room
3. **SYNC_REQUEST** - Request current game state
4. **SYNC_RESPONSE** - Send current game state
5. **LEAVE** - Player leaves the room
6. **REMATCH** - Request a rematch

### Player Roles

- **X** - First player to join
- **O** - Second player to join
- **spectator** - Third+ player to join
- **null** - Not yet assigned

### Room State Tracking

Each room maintains:
- `roomId` - Unique 8-character identifier
- `playerXId` - Client ID of Player X
- `playerOId` - Client ID of Player O
- `spectatorIds` - Array of spectator client IDs
- `isActive` - Boolean indicating room activity

---

## Testing Checklist

Use this checklist to track testing progress:

- [ ] Test 1: Create Room Flow
- [ ] Test 2: Join Room Flow
- [ ] Test 3A: Player X Makes a Move
- [ ] Test 3B: Player O Makes a Move
- [ ] Test 3C: Move Alternation
- [ ] Test 4A: Horizontal Win
- [ ] Test 4B: Vertical Win
- [ ] Test 4C: Diagonal Win (3D)
- [ ] Test 4D: Draw Game
- [ ] Test 5A: Mid-Game Reconnection
- [ ] Test 5B: Total Disconnect
- [ ] Test 6: Spectator Mode
- [ ] Test 7A: Malformed Room ID
- [ ] Test 7B: Non-Existent Room ID
- [ ] Test 7C: Special Characters in Room ID
- [ ] Test 8A: Opponent Never Joins
- [ ] Test 8B: Opponent Disconnects Mid-Game
- [ ] Test 8C: Simultaneous Moves
- [ ] Test 8D: Copy Room Link Functionality
- [ ] Test 8E: Rematch Flow

---

**Document Version:** 1.0
**Last Updated:** 2026-03-24
**Project:** 4x4x4 Tic-Tac-Toe Multiplayer
**Location:** `/Users/galmoussan/projects/claude/tictacfor/MULTIPLAYER_TEST_PLAN.md`
