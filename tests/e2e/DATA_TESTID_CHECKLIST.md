# Data TestID Implementation Checklist

This checklist tracks the required `data-testid` attributes needed for E2E tests to function properly.

## Critical - Required for Core Tests

### FlatBoard Component
- [ ] `data-testid="layer-{0-3}"` - On each layer container
- [ ] `data-testid="cell-{layer}-{row}-{col}"` - On each cell button/div (64 total)
  - Example: `data-testid="cell-0-0-0"` for first cell
  - Example: `data-testid="cell-3-3-3"` for last cell

### FlatBoards Component
- [ ] `data-testid="flat-boards"` - On main container

### GameInfo Component
- [ ] `data-testid="current-player"` - On element showing current player
- [ ] `data-testid="winner"` - On element showing winner announcement

### MultiplayerGameInfo Component
- [ ] `data-testid="turn-indicator"` - On element showing whose turn it is
- [ ] `data-testid="player-role"` - On element showing local player's role (X/O)

### RoomStatus Component
- [ ] `data-testid="room-status"` - On main room status container
- [ ] `data-testid="room-code"` - On element displaying room code
- [ ] `data-testid="opponent-status"` - On element showing opponent connection
- [ ] `data-testid="opponent-connected"` - On element when opponent is connected

## High Priority - Enhances Test Reliability

### RoomLobby Component
- [ ] `data-testid="create-room-button"` - On create room button
- [ ] `data-testid="room-code-input"` - On room code input field
- [ ] `data-testid="join-room-button"` - On join room button
- [ ] `data-testid="copy-room-code"` - On copy/share button

### Scene3D Component
- [ ] Consider adding testid if 3D canvas needs specific targeting

### HomePage Component
- [ ] `data-testid="home-title"` - On main title
- [ ] `data-testid="single-player-nav"` - On single player button
- [ ] `data-testid="multiplayer-nav"` - On multiplayer button

## Implementation Examples

### Example 1: Cell with Coordinates
```tsx
// FlatBoard.tsx
<button
  data-testid={`cell-${layer}-${row}-${col}`}
  onClick={() => onClick(layer, row, col)}
>
  {getCellContent(layer, row, col)}
</button>
```

### Example 2: Layer Container
```tsx
// FlatBoard.tsx
<div
  data-testid={`layer-${layerIndex}`}
  className="layer-container"
>
  {/* cells */}
</div>
```

### Example 3: Current Player Display
```tsx
// GameInfo.tsx
<div data-testid="current-player">
  Current Player: {currentPlayer}
</div>
```

### Example 4: Room Code Display
```tsx
// RoomStatus.tsx or WaitingScreen
<div data-testid="room-code" className="font-mono">
  {roomCode}
</div>
```

### Example 5: Winner Announcement
```tsx
// GameInfo.tsx
{winner && (
  <div data-testid="winner">
    Player {winner} wins!
  </div>
)}
```

### Example 6: Turn Indicator
```tsx
// MultiplayerGameInfo.tsx
<div data-testid="turn-indicator">
  {isMyTurn ? "Your turn" : "Opponent's turn"}
</div>
```

### Example 7: Opponent Status
```tsx
// RoomStatus.tsx
<div data-testid="opponent-status">
  {opponentConnected ? (
    <span data-testid="opponent-connected">Connected</span>
  ) : (
    <span>Disconnected</span>
  )}
</div>
```

## Files to Update

Priority order for implementation:

1. **src/components/FlatBoard.tsx**
   - Add layer-{N} to layer containers
   - Add cell-{layer}-{row}-{col} to all cells

2. **src/components/FlatBoards.tsx**
   - Add flat-boards to main container

3. **src/components/GameInfo.tsx**
   - Add current-player to current player display
   - Add winner to winner announcement

4. **src/components/MultiplayerGameInfo.tsx**
   - Add turn-indicator to turn display
   - Add player-role to role display

5. **src/components/RoomStatus.tsx**
   - Add room-status to container
   - Add room-code to code display
   - Add opponent-status to opponent indicator
   - Add opponent-connected when connected

6. **src/components/RoomLobby.tsx**
   - Add testids to buttons and inputs

## Testing the Implementation

After adding testids, verify with:

```bash
# Run layout tests (checks for layer and cell testids)
npx playwright test tests/e2e/layout.spec.ts

# Run single player tests (checks cell interactions)
npx playwright test tests/e2e/single-player.spec.ts

# Run multiplayer tests (checks room and opponent testids)
npx playwright test tests/e2e/multiplayer.spec.ts
```

## Validation Checklist

Before marking this task complete:

- [ ] All critical testids implemented
- [ ] Layout tests pass
- [ ] Single player tests pass
- [ ] Multiplayer room creation test passes
- [ ] No console errors about missing elements
- [ ] Tests run successfully in CI

## Notes

- Use kebab-case for testid values: `current-player`, not `currentPlayer`
- Include dynamic values in interpolated strings: `cell-${layer}-${row}-${col}`
- Don't rely on text content for element selection in tests
- TestIds should be stable and not change with refactoring
- Add testids early in development to avoid tech debt
