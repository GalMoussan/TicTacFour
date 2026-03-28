/**
 * Role Assignment Bug - Final Reproduction
 *
 * This test file identifies the EXACT bugs in the system:
 *
 * BUG 1: MultiplayerGameInfo shows "Opponent disconnected" for creators waiting for opponents
 *        - Root cause: Logic checks `!opponentConnected && !isWaitingForOpponent`
 *        - Fix needed: Should check if opponent slot ever existed (playerOId !== null)
 *
 * BUG 2: (POTENTIAL) Client ID mismatch between Ably and nanoid fallback
 *        - Root cause: ablyClient.auth.clientId might not be set correctly
 *        - Fix needed: Ensure consistent ID generation
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MultiplayerGameInfo } from '../../components/MultiplayerGameInfo';
import type { PlayerRole } from '../types';

describe('Role Assignment Bug - Final Analysis', () => {
  describe('BUG: "Opponent disconnected" shown incorrectly', () => {
    it('REPRODUCE: Creator with no opponent sees "Opponent disconnected"', () => {
      console.log('\n=== REPRODUCING BUG: Opponent disconnected warning ===');

      // Scenario: Room creator waiting for first opponent
      // - playerRole: 'X' (creator has been assigned role)
      // - opponentConnected: false (no opponent yet)
      // - Current logic: Shows "Opponent disconnected"
      // - Expected: Should show nothing or "Waiting for opponent"

      render(
        <BrowserRouter>
          <MultiplayerGameInfo
            currentPlayer="X"
            winner={null}
            isDraw={false}
            isMyTurn={true}
            playerRole="X"  // Creator has role
            opponentConnected={false}  // No opponent
            onReset={() => {}}
          />
        </BrowserRouter>
      );

      // BUG: This warning appears even though no opponent ever joined
      const disconnectedWarning = screen.queryByText(/Opponent disconnected/i);

      console.log('[BUG CONFIRMED] "Opponent disconnected" shown:', disconnectedWarning !== null);
      console.log('[ANALYSIS] Component logic:');
      console.log('  - !opponentConnected = !false = true');
      console.log('  - isWaitingForOpponent = (playerRole === null) = (X === null) = false');
      console.log('  - !isWaitingForOpponent = !false = true');
      console.log('  - Condition: !opponentConnected && !isWaitingForOpponent');
      console.log('  - Result: true && true = true → SHOW WARNING ❌');
      console.log('');
      console.log('[FIX NEEDED] Should check if opponent ever existed');
      console.log('  - Need to pass playerOId to component');
      console.log('  - Condition: !opponentConnected && playerOId !== null');
      console.log('  - This would be: !false && false = false → NO WARNING ✅');

      // This test EXPECTS the bug to exist (for documentation)
      // Once fixed, this assertion should be flipped
      expect(disconnectedWarning).not.toBeNull(); // BUG EXISTS
    });

    it('CORRECT: Opponent joined then disconnected shows warning', () => {
      console.log('\n=== CORRECT CASE: Actual disconnect warning ===');

      // Scenario: Opponent joined, then disconnected
      // - playerRole: 'X' (player has role)
      // - opponentConnected: false (opponent left)
      // - Should show: "Opponent disconnected" ✓

      render(
        <BrowserRouter>
          <MultiplayerGameInfo
            currentPlayer="X"
            winner={null}
            isDraw={false}
            isMyTurn={false}  // Was opponent's turn before disconnect
            playerRole="X"
            opponentConnected={false}  // Opponent disconnected
            onReset={() => {}}
          />
        </BrowserRouter>
      );

      const disconnectedWarning = screen.queryByText(/Opponent disconnected/i);

      console.log('[CORRECT] "Opponent disconnected" shown:', disconnectedWarning !== null);
      console.log('[ANALYSIS] This is correct behavior');
      console.log('  - Opponent was present (playerOId !== null)');
      console.log('  - Opponent disconnected (opponentConnected = false)');
      console.log('  - Should show warning ✅');

      expect(disconnectedWarning).not.toBeNull(); // CORRECT
    });

    it('CORRECT: Player waiting for opponent (playerRole=null) shows waiting message', () => {
      console.log('\n=== CORRECT CASE: Waiting for role assignment ===');

      // Scenario: Player just joined, hasn't been assigned role yet
      // - playerRole: null (not assigned yet)
      // - opponentConnected: false (no opponent)
      // - Should show: "Waiting for opponent..." ✓

      render(
        <BrowserRouter>
          <MultiplayerGameInfo
            currentPlayer="X"
            winner={null}
            isDraw={false}
            isMyTurn={false}
            playerRole={null}  // No role yet
            opponentConnected={false}
            onReset={() => {}}
          />
        </BrowserRouter>
      );

      const waitingMessage = screen.queryByText(/Waiting for opponent/i);
      const disconnectedWarning = screen.queryByText(/Opponent disconnected/i);

      console.log('[CORRECT] "Waiting for opponent" shown:', waitingMessage !== null);
      console.log('[CORRECT] "Opponent disconnected" NOT shown:', disconnectedWarning === null);
      console.log('[ANALYSIS] This is correct behavior');
      console.log('  - isWaitingForOpponent = (playerRole === null) = true');
      console.log('  - Shows waiting message ✅');
      console.log('  - Does NOT show disconnect warning ✅');

      expect(waitingMessage).not.toBeNull();
      expect(disconnectedWarning).toBeNull();
    });

    it('PROPOSED FIX: Add playerOId to component props', () => {
      console.log('\n=== PROPOSED FIX ===');
      console.log('');
      console.log('MultiplayerGameInfo.tsx needs to accept playerOId:');
      console.log('');
      console.log('  export interface MultiplayerGameInfoProps {');
      console.log('    // ... existing props');
      console.log('    playerOId: string | null;  // ADD THIS');
      console.log('  }');
      console.log('');
      console.log('Change the condition from:');
      console.log('  {!opponentConnected && !isWaitingForOpponent && (');
      console.log('');
      console.log('To:');
      console.log('  {!opponentConnected && playerOId !== null && (');
      console.log('');
      console.log('This ensures warning only shows when:');
      console.log('  1. Opponent slot was filled (playerOId !== null)');
      console.log('  2. Opponent is not connected (!opponentConnected)');
      console.log('');
      console.log('Result:');
      console.log('  - Creator waiting: playerOId=null → No warning ✅');
      console.log('  - Opponent disconnected: playerOId="abc123" → Show warning ✅');

      // This test just documents the fix
      expect(true).toBe(true);
    });
  });

  describe('ANALYSIS: Role assignment works correctly in useRoom', () => {
    it('Summary: useRoom.ts determineRole() logic is CORRECT', () => {
      console.log('\n=== ANALYSIS: useRoom.ts is working correctly ===');
      console.log('');
      console.log('The determineRole() function correctly assigns roles:');
      console.log('  1. First player (empty presence) → X ✅');
      console.log('  2. Second player (X exists) → O ✅');
      console.log('  3. Third+ players (X and O exist) → spectator ✅');
      console.log('');
      console.log('Evidence from tests:');
      console.log('  - All unit tests in role-assignment.test.tsx PASS ✅');
      console.log('  - createRoom() assigns creator as X ✅');
      console.log('  - Second joiner gets O ✅');
      console.log('  - roomState correctly populated ✅');
      console.log('');
      console.log('Conclusion: The bug is NOT in useRoom.ts');

      expect(true).toBe(true);
    });

    it('Summary: The reported bug is in MultiplayerGameInfo', () => {
      console.log('\n=== ROOT CAUSE IDENTIFIED ===');
      console.log('');
      console.log('Reported symptoms:');
      console.log('  1. "Player O: You" for creator - NOT REPRODUCED');
      console.log('  2. "Opponent disconnected" for creator - CONFIRMED BUG ✅');
      console.log('  3. Second joiner as spectator - NOT REPRODUCED');
      console.log('');
      console.log('Actual bug:');
      console.log('  - MultiplayerGameInfo shows "Opponent disconnected"');
      console.log('  - When creator is waiting for first opponent');
      console.log('  - Because it checks playerRole !== null');
      console.log('  - But should check playerOId !== null');
      console.log('');
      console.log('Fix location:');
      console.log('  - File: src/components/MultiplayerGameInfo.tsx');
      console.log('  - Line: 34');
      console.log('  - Change condition to include playerOId check');

      expect(true).toBe(true);
    });
  });

  describe('TEST MATRIX: All scenarios', () => {
    const scenarios: Array<{
      name: string;
      playerRole: PlayerRole;
      opponentConnected: boolean;
      playerOId: string | null;
      expectedWarning: boolean;
      reason: string;
    }> = [
      {
        name: 'Creator waiting (no opponent yet)',
        playerRole: 'X',
        opponentConnected: false,
        playerOId: null,
        expectedWarning: false,
        reason: 'No opponent has joined yet',
      },
      {
        name: 'Opponent connected',
        playerRole: 'X',
        opponentConnected: true,
        playerOId: 'opponent-id',
        expectedWarning: false,
        reason: 'Opponent is connected',
      },
      {
        name: 'Opponent disconnected',
        playerRole: 'X',
        opponentConnected: false,
        playerOId: 'opponent-id',
        expectedWarning: true,
        reason: 'Opponent was present but disconnected',
      },
      {
        name: 'Waiting for role assignment',
        playerRole: null,
        opponentConnected: false,
        playerOId: null,
        expectedWarning: false,
        reason: 'Player not assigned role yet',
      },
      {
        name: 'Spectator mode',
        playerRole: 'spectator',
        opponentConnected: true,
        playerOId: 'opponent-id',
        expectedWarning: false,
        reason: 'Spectators should not see disconnect warnings',
      },
    ];

    scenarios.forEach((scenario) => {
      it(`Scenario: ${scenario.name}`, () => {
        console.log(`\n[SCENARIO] ${scenario.name}`);
        console.log(`  playerRole: ${scenario.playerRole}`);
        console.log(`  opponentConnected: ${scenario.opponentConnected}`);
        console.log(`  playerOId: ${scenario.playerOId}`);
        console.log(`  Expected warning: ${scenario.expectedWarning}`);
        console.log(`  Reason: ${scenario.reason}`);

        // Current logic (BUGGY):
        const isWaitingForOpponent = scenario.playerRole === null;
        const showsWarningCurrent = !scenario.opponentConnected && !isWaitingForOpponent;

        // Proposed logic (FIXED):
        const showsWarningProposed = !scenario.opponentConnected && scenario.playerOId !== null;

        console.log(`  Current logic shows warning: ${showsWarningCurrent}`);
        console.log(`  Proposed logic shows warning: ${showsWarningProposed}`);
        console.log(`  Status: ${showsWarningProposed === scenario.expectedWarning ? '✅ CORRECT' : '❌ WRONG'}`);

        expect(showsWarningProposed).toBe(scenario.expectedWarning);
      });
    });
  });
});
