# Manual Testing Guide - Tic-Tac-For

This guide provides step-by-step instructions for performing manual QA testing on the Tic-Tac-For application.

---

## Prerequisites

1. Development server running: `npm run dev`
2. Server accessible at: http://localhost:5182/
3. Browser DevTools available (F12 or Cmd+Option+I)
4. Screen reader installed (optional): VoiceOver (Mac) or NVDA (Windows)

---

## Test Suite 1: Visual & Animation Testing

### Test 1.1: HomePage Animations

**Steps:**
1. Navigate to http://localhost:5182/
2. Observe the page load animation
3. Wait for particles to drift across screen
4. Observe the holographic title gradient shift

**Expected Results:**
- [ ] Page fades in with upward motion
- [ ] Particle background shows moving dots
- [ ] Title gradient cycles through cyan → pink → purple → blue
- [ ] Animation is smooth (no jank)

### Test 1.2: Card Hover Effects

**Steps:**
1. On HomePage, hover mouse over "Single Player" card
2. Observe scale and glow changes
3. Move to "Multiplayer" card and hover
4. Note the floating animation

**Expected Results:**
- [ ] Single Player card scales up slightly (1.05x)
- [ ] Cyan glow intensifies on hover
- [ ] Multiplayer card has continuous floating motion
- [ ] Magenta glow is visible
- [ ] Transitions are smooth (300ms)

### Test 1.3: Button Ripple Effect

**Steps:**
1. Click "START GAME" button on Single Player card
2. Observe ripple animation from click point
3. Click at different positions on button
4. Return to HomePage (back button)
5. Click "JOIN BATTLE" button

**Expected Results:**
- [ ] Ripple expands from exact click position
- [ ] Ripple fades out after 600ms
- [ ] Cyan ripple for Single Player button
- [ ] Magenta ripple for Multiplayer button
- [ ] Multiple ripples can stack if clicking rapidly

### Test 1.4: RoomLobby Visual Elements

**Steps:**
1. Navigate to Multiplayer
2. Observe the animated border gradient on main card
3. Look for corner decorations (4 rotated squares)
4. Focus on the divider with "OR" text
5. Note the pulsing pink glow around divider

**Expected Results:**
- [ ] Border gradient flows continuously (cyan → pink → cyan)
- [ ] 4 small rotated squares visible in corners
- [ ] "OR" text in glass circle with pink border
- [ ] Pink glow pulses around divider area
- [ ] All animations are smooth

### Test 1.5: Game Board Visual Elements

**Steps:**
1. Start a Single Player game
2. Observe the 4 layer boards
3. Look for scan lines overlay
4. Check layer indicators (colored dots)
5. Hover over empty cells
6. Place a mark (X)

**Expected Results:**
- [ ] 4 boards displayed in 2x2 grid
- [ ] Scan lines animate vertically (8s cycle)
- [ ] Layer 1: cyan dot, Layer 2: blue, Layer 3: purple, Layer 4: pink
- [ ] Empty cells show cyan glow on hover
- [ ] Particle burst appears when placing mark (8 particles)
- [ ] X appears in cyan color

### Test 1.6: 3D View Rendering

**Steps:**
1. In a game, scroll to 3D view section
2. Observe the bloom effect (white glow)
3. Look for rotating particle rings on spheres
4. Observe the grid floor at bottom
5. Make a move and watch for 3D update

**Expected Results:**
- [ ] 3D scene renders without errors
- [ ] Bloom effect creates soft white glow
- [ ] Particle rings rotate continuously around spheres
- [ ] Grid floor visible with cyan lines
- [ ] Spheres appear when marks are placed
- [ ] X spheres are cyan, O spheres are magenta

### Test 1.7: Winning Animation

**Steps:**
1. Play a game and get 4 in a row
2. Observe winning cell highlighting
3. Look for golden glow on winning cells
4. Check 3D view for golden beam
5. Observe sparkle particles

**Expected Results:**
- [ ] Winning cells highlighted with golden glow
- [ ] Sparkles float above winning cells
- [ ] 3D view shows golden tube connecting winning positions
- [ ] Golden beam pulses
- [ ] Animation draws attention without being jarring

---

## Test Suite 2: Responsive Design Testing

### Test 2.1: Mobile Portrait (375px)

**Steps:**
1. Open Chrome DevTools (F12)
2. Click Toggle Device Toolbar (Cmd/Ctrl + Shift + M)
3. Select "iPhone SE" or set width to 375px
4. Navigate through HomePage → RoomLobby → Game

**Expected Results:**
- [ ] No horizontal scrollbar
- [ ] Cards stack vertically (1 column)
- [ ] Text remains readable
- [ ] Buttons are tappable (min 44x44px)
- [ ] Game board cells are large enough
- [ ] 3D view scales appropriately
- [ ] Touch targets don't overlap

**Measurements:**
- Game board cell size: ____px (should be ≥44px)
- Button height: ____px (should be ≥44px)
- Text readability: [ ] Good [ ] Acceptable [ ] Poor

### Test 2.2: Tablet (768px)

**Steps:**
1. In DevTools Device Toolbar, select "iPad" or set 768px width
2. Test all pages
3. Verify 2-column card layout on HomePage

**Expected Results:**
- [ ] Game mode cards display in 2 columns
- [ ] Game boards have adequate spacing
- [ ] 3D view fills available space
- [ ] No cramped layouts
- [ ] Touch targets remain accessible

### Test 2.3: Desktop (1920px)

**Steps:**
1. Exit Device Toolbar or set width to 1920px
2. Navigate all pages
3. Verify maximum content width

**Expected Results:**
- [ ] Content doesn't stretch excessively
- [ ] Maximum width containers (max-w-6xl) enforced
- [ ] Adequate whitespace on sides
- [ ] 3D view has good proportions
- [ ] No stretched images or distorted elements

### Test 2.4: Orientation Change

**Steps:**
1. In Device Toolbar, select mobile device
2. Click rotate icon to switch portrait/landscape
3. Test game board visibility
4. Check if all controls accessible

**Expected Results:**
- [ ] Layout adapts to orientation
- [ ] Game boards remain playable
- [ ] No content cut off
- [ ] Scrolling works if needed

---

## Test Suite 3: Accessibility Testing

### Test 3.1: Keyboard Navigation

**Steps:**
1. Navigate to http://localhost:5182/
2. Press Tab repeatedly to move through interactive elements
3. Use Enter/Space to activate buttons
4. Navigate to RoomLobby and tab through form
5. Press Tab to reach Join Room button

**Expected Results:**
- [ ] Focus indicator visible (cyan outline, 2px)
- [ ] Tab order is logical (top to bottom, left to right)
- [ ] All buttons reachable via keyboard
- [ ] Enter key submits room code form
- [ ] Escape key works in expected contexts
- [ ] No keyboard traps

**Focus Order Verification:**
HomePage: Single Player button → Multiplayer button
RoomLobby: Create Room button → Room code input → Join Room button → Back link

### Test 3.2: Color Contrast

**Steps:**
1. Open Chrome DevTools
2. Right-click on text element → Inspect
3. Click color swatch in Styles panel
4. Check contrast ratio in color picker

**Elements to Check:**
| Element | Expected Ratio | Actual | Pass/Fail |
|---------|---------------|--------|-----------|
| Holographic title | N/A (gradient) | N/A | N/A |
| Body text (gray-400) | ≥4.5:1 | ____ | [ ] |
| Neon cyan text | ≥4.5:1 | ____ | [ ] |
| Neon pink text | ≥4.5:1 | ____ | [ ] |
| Error message text | ≥4.5:1 | ____ | [ ] |
| Button text | ≥4.5:1 | ____ | [ ] |

### Test 3.3: Screen Reader Testing (VoiceOver on Mac)

**Steps:**
1. Enable VoiceOver: Cmd + F5
2. Navigate to HomePage
3. Use VoiceOver controls to navigate (VO + arrow keys)
4. Listen to announcements

**Expected Announcements:**
- [ ] Page title announced
- [ ] Button labels clear ("Start Game", "Join Battle")
- [ ] Form labels announced
- [ ] Error messages read aloud when shown
- [ ] Game state changes announced (needs aria-live)

**Issues to Note:**
- Missing labels: _________________________________
- Unclear announcements: _________________________
- Silent state changes: ___________________________

### Test 3.4: ARIA Attributes Inspection

**Steps:**
1. Open Chrome DevTools
2. Go to Elements tab
3. Right-click body → Inspect Accessibility Properties
4. Check ARIA tree

**Verify:**
- [ ] Buttons have proper roles
- [ ] Form inputs have associated labels (aria-labelledby or htmlFor)
- [ ] Error messages have role="alert"
- [ ] Loading states have aria-busy
- [ ] Icon buttons have aria-label

---

## Test Suite 4: Performance Testing

### Test 4.1: FPS Monitoring

**Steps:**
1. Open Chrome DevTools
2. Go to Performance tab
3. Click record (circle icon)
4. Play a complete game (place multiple marks)
5. Stop recording after 30 seconds
6. Analyze FPS graph

**Expected Results:**
- [ ] FPS stays at or near 60 (green line)
- [ ] No red bars indicating jank
- [ ] Particle animations smooth
- [ ] 3D rendering maintains 30+ FPS minimum

**Measurements:**
- Average FPS: ____
- Minimum FPS: ____
- Frame drops: [ ] None [ ] Occasional [ ] Frequent

### Test 4.2: Lighthouse Audit

**Steps:**
1. Open Chrome DevTools
2. Press Cmd/Ctrl + Shift + P
3. Type "Lighthouse"
4. Select "Generate report"
5. Choose "Desktop" mode
6. Check all categories
7. Click "Generate report"

**Expected Scores:**
| Category | Target | Actual | Pass/Fail |
|----------|--------|--------|-----------|
| Performance | ≥80 | ____ | [ ] |
| Accessibility | ≥90 | ____ | [ ] |
| Best Practices | ≥90 | ____ | [ ] |
| SEO | ≥80 | ____ | [ ] |

### Test 4.3: Network Performance

**Steps:**
1. Open Chrome DevTools
2. Go to Network tab
3. Reload page (Cmd/Ctrl + R)
4. Wait for all resources to load

**Measurements:**
- Total transfer size: ______ KB
- Finish time: ______ seconds
- Number of requests: ______
- Largest resource: ______ (size: ______ KB)

**Expected:**
- [ ] Initial load < 3 seconds on fast 3G
- [ ] Gzipped JavaScript < 500 KB
- [ ] No failed requests (red in Network tab)

### Test 4.4: Memory Usage

**Steps:**
1. Open Chrome DevTools
2. Go to Memory tab
3. Take heap snapshot
4. Play several games
5. Take another snapshot
6. Compare sizes

**Expected Results:**
- [ ] Memory doesn't grow excessively
- [ ] No obvious memory leaks
- [ ] Heap size reasonable (< 50 MB for game app)

---

## Test Suite 5: Functional Testing

### Test 5.1: Single Player Game Flow

**Steps:**
1. Click "START GAME" on HomePage
2. Verify you're on Single Player page
3. Place mark in cell (0,0,0)
4. Wait for AI move
5. Continue playing until win/draw/loss

**Expected Results:**
- [ ] Navigation successful
- [ ] Board initializes empty
- [ ] Can place X in any empty cell
- [ ] AI places O after your move
- [ ] Cannot place in occupied cells
- [ ] Win detection works
- [ ] Winning line highlights correctly
- [ ] Reset button works

### Test 5.2: Multiplayer Room Creation

**Steps:**
1. Click "JOIN BATTLE" on HomePage
2. Click "CREATE NEW ROOM"
3. Note the generated room code
4. Verify room status display

**Expected Results:**
- [ ] Room code is 8 alphanumeric characters
- [ ] Room code displayed clearly
- [ ] Copy button present
- [ ] Player status shows "Waiting for opponent"
- [ ] Your role assigned (X or O)

### Test 5.3: Multiplayer Room Joining

**Steps:**
1. Open second browser tab
2. Navigate to http://localhost:5182/
3. Click "JOIN BATTLE"
4. Enter room code from Test 5.2
5. Click "JOIN ROOM"

**Expected Results:**
- [ ] Successfully joins room
- [ ] Second player assigned opposite role
- [ ] Both players see "Connected" status
- [ ] Turn indicator shows whose turn it is
- [ ] Moves sync between tabs in real-time

### Test 5.4: Form Validation

**Steps:**
1. Navigate to RoomLobby
2. Click "JOIN ROOM" without entering code
3. Enter fewer than 8 characters
4. Enter invalid characters (symbols)
5. Enter valid 8-character code

**Expected Results:**
- [ ] Error shown for empty input
- [ ] Error shown for short code
- [ ] Join button disabled until 8 characters entered
- [ ] Enter key triggers form submission
- [ ] Error messages clear when typing

### Test 5.5: Error Handling

**Steps:**
1. Disconnect internet
2. Try to create room
3. Reconnect internet
4. Create room, then disconnect
5. Try to make a move

**Expected Results:**
- [ ] Network error displayed
- [ ] Loading states shown appropriately
- [ ] User not stuck in loading state
- [ ] Graceful degradation
- [ ] Reconnection attempts made

---

## Test Suite 6: Cross-Browser Testing

### Test 6.1: Chrome Testing

**Version:** ________________

Run all previous test suites in Chrome and note any issues:

Issues found:
- _______________________________________
- _______________________________________

### Test 6.2: Firefox Testing

**Version:** ________________

**Focus Areas:**
- [ ] Backdrop filter rendering (glassmorphism)
- [ ] Animation smoothness
- [ ] WebGL/3D rendering

Issues found:
- _______________________________________
- _______________________________________

### Test 6.3: Safari Testing (macOS/iOS)

**Version:** ________________

**Focus Areas:**
- [ ] Webkit-prefixed backdrop-filter
- [ ] Touch interactions (iOS)
- [ ] Clip-path (hexagon shapes)

Issues found:
- _______________________________________
- _______________________________________

### Test 6.4: Edge Testing

**Version:** ________________

**Focus Areas:**
- [ ] Chromium compatibility
- [ ] Animation rendering

Issues found:
- _______________________________________
- _______________________________________

---

## Issue Reporting Template

When you find a bug or issue, document it using this template:

**Issue ID:** BUG-[number]
**Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low
**Browser:** _________________ (version: _______)
**Device:** _________________ (screen size: _______)

**Title:** [Brief description]

**Steps to Reproduce:**
1.
2.
3.

**Expected Result:**


**Actual Result:**


**Screenshot/Video:**
[Attach if available]

**Additional Notes:**


---

## Quick Reference Checklist

Use this for rapid testing sessions:

### Visual
- [ ] Animations smooth
- [ ] Colors render correctly
- [ ] Text readable
- [ ] No visual glitches

### Responsive
- [ ] Works on mobile (375px)
- [ ] Works on tablet (768px)
- [ ] Works on desktop (1920px)
- [ ] No horizontal overflow

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast passes
- [ ] Screen reader compatible

### Performance
- [ ] FPS ≥30 (60 on desktop)
- [ ] Load time <3 seconds
- [ ] No memory leaks
- [ ] Bundle size acceptable

### Functional
- [ ] Can play single player
- [ ] Can create multiplayer room
- [ ] Can join multiplayer room
- [ ] Moves sync in real-time
- [ ] Win detection works

---

## Completion Checklist

- [ ] All test suites completed
- [ ] Issues documented
- [ ] Screenshots captured
- [ ] Performance metrics recorded
- [ ] Browser compatibility verified
- [ ] Accessibility audit passed
- [ ] QA report updated with findings

**Tester:** ___________________
**Date:** ___________________
**Total Issues Found:** ___________________
**Recommendation:** [ ] PASS [ ] PASS with minor fixes [ ] NEEDS WORK [ ] FAIL
