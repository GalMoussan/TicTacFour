# Test Scenarios
## 4x4x4 Tic-Tac-Toe - Futuristic UI Redesign

**Version:** Sprint 9 Complete
**Last Updated:** 2025-03-25

---

## Table of Contents

1. [Single Player Game Flow](#1-single-player-game-flow)
2. [Multiplayer Game Flow](#2-multiplayer-game-flow)
3. [Error States](#3-error-states)
4. [Edge Cases](#4-edge-cases)
5. [Responsive Design](#5-responsive-design)
6. [3D View Specific](#6-3d-view-specific)
7. [UI Component Testing](#7-ui-component-testing)

---

## 1. Single Player Game Flow

### SP-001: Navigate to Single Player Mode
**Priority:** High
**Preconditions:** Application is loaded at home page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open application at http://localhost:5182 | Home page displays with futuristic UI |
| 2 | Verify "SINGLE PLAYER" card is visible | Cyan-glowing card with gamepad icon |
| 3 | Click "START GAME" button | Page transitions to single player view |
| 4 | Verify game board loads | 4 flat boards (2x2 grid) and 3D view display |

### SP-002: Make Valid Moves
**Priority:** High
**Preconditions:** Single player game is active

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Observe current player indicator | Shows "X" with cyan glow |
| 2 | Click empty cell in Layer 1 | Cell fills with "X", particle burst animation |
| 3 | Verify player switch | Indicator changes to "O" with pink glow |
| 4 | Click another empty cell | Cell fills with "O" |
| 5 | Verify 3D view updates | Spheres appear at corresponding positions |

### SP-003: Win Detection (Horizontal Line)
**Priority:** High
**Preconditions:** Game in progress

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Place 4 X marks in horizontal row (Layer 1, Row 1) | Win detected after 4th placement |
| 2 | Observe win animation | Trophy emoji appears, "PLAYER X WINS!" |
| 3 | Observe winning cells | Golden glow, pulse animation |
| 4 | Observe 3D view | Golden beam connects winning cells |
| 5 | Try clicking empty cell | No action (game over) |

### SP-004: Win Detection (Vertical Line)
**Priority:** High
**Preconditions:** New game started

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Place 4 marks in vertical column within single layer | Win detected |
| 2 | Verify winning line highlights correctly | All 4 winning cells show golden glow |

### SP-005: Win Detection (Cross-Layer Diagonal)
**Priority:** High
**Preconditions:** New game started

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Place 4 marks diagonally across all 4 layers | Win detected |
| 2 | Verify winning line spans multiple layer boards | Each winning cell highlighted in respective layer |
| 3 | Verify 3D beam | 3D view shows diagonal winning line |

### SP-006: Draw Condition
**Priority:** High
**Preconditions:** New game started

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Fill all 64 cells without forming 4-in-a-row | Draw state triggered |
| 2 | Observe UI | Handshake emoji, "DRAW" text displays |
| 3 | Verify game over state | All cells disabled |

### SP-007: Reset Game
**Priority:** High
**Preconditions:** Game completed (win or draw)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "RESET GAME" button | Board clears completely |
| 2 | Verify initial state | Player X's turn, all cells empty |
| 3 | Verify 3D view reset | All spheres removed |

### SP-008: Navigate Back to Home
**Priority:** Medium
**Preconditions:** In single player game

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "BACK" button in header | Returns to home page |
| 2 | Verify home page | Both game mode cards visible |
| 3 | Navigate back to single player | New game starts (board cleared) |

---

## 2. Multiplayer Game Flow

### MP-001: Create New Room
**Priority:** High
**Preconditions:** Home page loaded

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "JOIN BATTLE" on home page | Room lobby displays |
| 2 | Click "CREATE NEW ROOM" | Room ID generated |
| 3 | Verify URL changes | /room/{ROOMID} pattern |
| 4 | Observe waiting screen | "Waiting for Opponent" message |
| 5 | Verify room code display | 8-character alphanumeric code |

### MP-002: Copy Room Link
**Priority:** Medium
**Preconditions:** Room created, waiting for opponent

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click copy button next to room code | Clipboard contains room URL |
| 2 | Observe feedback | "COPIED!" badge appears briefly |
| 3 | Observe particle animation | Green particles burst from button |

### MP-003: Join Existing Room
**Priority:** High
**Preconditions:** Room lobby page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter valid 8-character room code | Input accepts text |
| 2 | Click "JOIN ROOM" | Navigates to room page |
| 3 | Verify player role assigned | "PLAYER O" indicator shows "YOU" |
| 4 | Verify opponent connected | "PLAYER X" shows connected status |

### MP-004: Join Invalid Room Code
**Priority:** Medium
**Preconditions:** Room lobby page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter invalid room code (less than 8 chars) | JOIN button stays disabled |
| 2 | Enter 8 chars with special characters | Error message: "Invalid room ID" |
| 3 | Enter valid format for non-existent room | Navigate to room, shows waiting or error |

### MP-005: Two-Player Game Session
**Priority:** High
**Preconditions:** Two browser tabs open

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tab 1: Create room | Tab 1 shows waiting screen |
| 2 | Tab 2: Join room with code | Both tabs show game board |
| 3 | Tab 1: Make move (Player X) | Move appears in both tabs |
| 4 | Tab 1: Verify turn indicator | Shows "OPPONENT'S TURN" |
| 5 | Tab 2: Make move (Player O) | Move syncs to both tabs |
| 6 | Complete game to win | Winner/loser screens show appropriately |

### MP-006: Player Disconnect Detection
**Priority:** Medium
**Preconditions:** Two-player game in progress

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tab 1 and Tab 2 in active game | Both show game board |
| 2 | Close Tab 2 (Player O) | Tab 1 shows disconnect warning |
| 3 | Observe warning message | Red border, "Opponent disconnected" |
| 4 | Reopen Tab 2, rejoin room | Warning clears, game continues |

### MP-007: Spectator Mode
**Priority:** Low
**Preconditions:** Active game with 2 players

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Tab 3 with room URL | Tab 3 enters as spectator |
| 2 | Verify spectator indicator | Eye emoji with "SPECTATING" badge |
| 3 | Attempt to click cells | No action (view only) |
| 4 | Observe game progress | Moves sync to spectator view |

### MP-008: Rematch/New Game
**Priority:** Medium
**Preconditions:** Multiplayer game completed

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Observe "NEW GAME" button | Button visible after game over |
| 2 | Click "NEW GAME" | Both players see reset board |
| 3 | Verify roles maintained | Same players, new game |

---

## 3. Error States

### ER-001: Invalid Room ID Navigation
**Priority:** Medium
**Preconditions:** Direct URL access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /room/INVALID | Invalid Room ID error page |
| 2 | Observe error message | "The room you're trying to join doesn't exist" |
| 3 | Click "Back to Multiplayer Lobby" | Returns to room lobby |

### ER-002: Network Error During Game
**Priority:** Medium
**Preconditions:** Active multiplayer game

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Simulate network disconnect | UI shows connection warning |
| 2 | Attempt to make move | Move queued or error shown |
| 3 | Restore network | Pending moves sync |

### ER-003: Room Creation Failure
**Priority:** Low
**Preconditions:** Room lobby page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "CREATE NEW ROOM" with network off | Loading state, then error |
| 2 | Observe error handling | Error message displayed |
| 3 | Retry after network restored | Room creates successfully |

### ER-004: Clipboard Copy Failure
**Priority:** Low
**Preconditions:** Room waiting screen, clipboard API blocked

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click copy button | Silent failure (no crash) |
| 2 | Observe console | Error logged |
| 3 | Room code still visible | User can copy manually |

---

## 4. Edge Cases

### EC-001: Rapid Move Clicking
**Priority:** Medium
**Preconditions:** Active game

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Rapidly click multiple empty cells | Only first click registers |
| 2 | Verify board state | Single move made, turn switched |
| 3 | No duplicate moves | Game state consistent |

### EC-002: Click on Occupied Cell
**Priority:** High
**Preconditions:** Cell already has X or O

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click on occupied cell | No action, no error |
| 2 | Verify game state | Unchanged |
| 3 | Observe cursor | Not pointer (disabled cursor) |

### EC-003: Very Long Game Session
**Priority:** Low
**Preconditions:** Game in progress for extended time

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Play game for 30+ minutes | No memory leaks |
| 2 | Verify animation performance | Still smooth (60fps) |
| 3 | Check 3D view | No visual artifacts |

### EC-004: Browser Refresh During Game
**Priority:** Medium
**Preconditions:** Multiplayer game in progress

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Press F5 or click refresh | Page reloads |
| 2 | Observe room rejoin | Player reconnects with same role |
| 3 | Verify game state | Board state preserved |

### EC-005: Window Resize During 3D View
**Priority:** Medium
**Preconditions:** Game active with 3D view visible

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Resize browser window | 3D canvas resizes |
| 2 | Verify camera position | Maintains proper view angle |
| 3 | Check responsiveness | No overlap or overflow |

### EC-006: Tab Switching (Visibility Change)
**Priority:** Low
**Preconditions:** Game in progress

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Switch to different browser tab | Game pauses animations |
| 2 | Return to game tab | Animations resume |
| 3 | Verify game state | No lost moves or state corruption |

### EC-007: Room Full (Third Player Attempts Join)
**Priority:** Medium
**Preconditions:** Room with 2 players

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tab 3 joins same room URL | Enters as spectator |
| 2 | Verify spectator mode | Cannot interact with game |
| 3 | Shows correct indicator | "SPECTATING" badge |

### EC-008: Simultaneous Move Attempt
**Priority:** Medium
**Preconditions:** Multiplayer game, very low latency

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Both players click at nearly same moment | Only valid move (current player's) registers |
| 2 | Out-of-turn player | Move rejected silently |
| 3 | Game state consistent | Both clients show same state |

---

## 5. Responsive Design

### RD-001: Mobile Portrait (375px)
**Priority:** High

| Element | Expected Behavior |
|---------|------------------|
| Home page cards | Stack vertically |
| Game boards | Single column, scrollable |
| 3D view | Hidden or below flat boards |
| Header | Compact, icon buttons |
| Room code | Full width, larger touch targets |

### RD-002: Mobile Landscape (667px)
**Priority:** Medium

| Element | Expected Behavior |
|---------|------------------|
| Home page cards | Side by side |
| Game boards | 2-column grid |
| 3D view | Reduced size, right panel |
| Header | Standard layout |

### RD-003: Tablet (768px)
**Priority:** Medium

| Element | Expected Behavior |
|---------|------------------|
| Home page | 2-column card grid |
| Game layout | Side-by-side panels |
| Touch targets | Adequate size (44px min) |
| Font sizes | Scaled appropriately |

### RD-004: Desktop (1280px+)
**Priority:** High

| Element | Expected Behavior |
|---------|------------------|
| Full layout | Complete design system |
| 3D view | Large canvas |
| Hover effects | All active |
| Animations | Full fidelity |

### RD-005: Ultra-wide (2560px+)
**Priority:** Low

| Element | Expected Behavior |
|---------|------------------|
| Content | Centered, max-width |
| Sidebars | Graceful space usage |
| No horizontal scroll | Content contained |

---

## 6. 3D View Specific

### 3D-001: Initial Render
**Priority:** High
**Preconditions:** Game page loaded

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Observe 3D canvas | Grid floor visible |
| 2 | Verify lighting | Ambient + directional lights |
| 3 | Check cell wireframes | 64 transparent boxes visible |
| 4 | Observe camera position | Isometric-style view |

### 3D-002: Orbit Controls
**Priority:** Medium
**Preconditions:** 3D view active

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click and drag | Camera rotates around scene |
| 2 | Scroll wheel | Zooms in/out |
| 3 | Right-click drag | Pans camera |
| 4 | Observe limits | Stays within min/max distance |

### 3D-003: Cell Click in 3D View
**Priority:** High
**Preconditions:** Game active, your turn

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click empty cell wireframe | Move registered |
| 2 | Observe sphere appearance | Colored sphere spawns |
| 3 | Observe particle burst | Particles explode outward |
| 4 | Check flat board sync | Corresponding cell updates |

### 3D-004: Particle Effects
**Priority:** Medium
**Preconditions:** 3D view visible

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Observe placed pieces | Particle rings orbit each sphere |
| 2 | Place new piece | Burst particles animate out |
| 3 | Check performance | No frame drops |

### 3D-005: Winning Line 3D Effect
**Priority:** High
**Preconditions:** Winning move made

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete winning line | Golden tube appears |
| 2 | Observe glow animation | Intensity pulses |
| 3 | Verify endpoints | Connects first and last winning cells |

### 3D-006: Bloom Post-Processing
**Priority:** Low
**Preconditions:** 3D view rendered

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Observe glowing elements | Bloom halo visible |
| 2 | Vary brightness | Effect scales appropriately |
| 3 | Performance check | Consistent frame rate |

---

## 7. UI Component Testing

### UI-001: NeonButton States
**Priority:** High

| State | Visual Behavior |
|-------|-----------------|
| Default | Glass background, neon border |
| Hover | Scale up (1.05), enhanced glow |
| Active | Scale down (0.95), ripple effect |
| Disabled | 40% opacity, no pointer events |
| Focus | Visible focus ring |

### UI-002: GlassCard Variants
**Priority:** Medium

| Variant | Visual Behavior |
|---------|-----------------|
| No glow | Plain glass effect |
| Cyan glow | Cyan box shadow |
| Magenta glow | Pink box shadow |
| Purple glow | Purple box shadow |
| Hover enabled | Lift effect on hover |

### UI-003: CyberInput States
**Priority:** Medium

| State | Visual Behavior |
|-------|-----------------|
| Default | Glass background, subtle border |
| Focused | Cyan border, glow effect, scanlines |
| Disabled | 50% opacity, not editable |
| Max length | Character counter visible |

### UI-004: StatusBadge Colors
**Priority:** Medium

| Color | Usage |
|-------|-------|
| Cyan | Player X, primary states |
| Magenta | Player O, secondary states |
| Green | Success, connected |
| Yellow | Warning, waiting |
| Red | Error, disconnected |
| Pulse | Animated attention |

### UI-005: LoadingSpinner Sizes
**Priority:** Low

| Size | Dimensions |
|------|------------|
| sm | 24x24px |
| md | 48x48px |
| lg | 64x64px |

### UI-006: HolographicText Animation
**Priority:** Medium

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Observe title text | Gradient colors shift |
| 2 | Check animation duration | 3s cycle |
| 3 | Verify color range | Cyan → Pink → Purple → Blue |

### UI-007: ParticleBackground Intensity
**Priority:** Low

| Level | Particle Opacity |
|-------|------------------|
| low | 30% |
| medium | 50% |
| high | 70% |

---

## Appendix: Test Environment Setup

### Required Browsers
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

### Test Data
- Valid room codes: 8 alphanumeric characters
- Invalid room codes: <8 chars, special characters

### Network Conditions to Simulate
- Normal: No throttling
- Slow 3G: 750ms latency
- Offline: No network
- Intermittent: Random drops

### Device Testing Targets
- iPhone 14 Pro (393px)
- iPad Pro (1024px)
- Desktop 1920x1080
- Desktop 2560x1440
