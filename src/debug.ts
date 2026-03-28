import { MultiplayerDiagnostics } from './multiplayer/diagnostics';
import { ablyClient } from './multiplayer/ably-client';

// Debug tools - only available in development mode
const isDev = import.meta.env.DEV;

export const debugTools = {
  async checkState() {
    if (!isDev) return;
    await MultiplayerDiagnostics.checkAblyConnection();
    await MultiplayerDiagnostics.verifyClientIdConsistency();
  },

  async checkRoom(roomId: string) {
    if (!isDev) return null;
    const members = await MultiplayerDiagnostics.checkPresenceInChannel(`room:${roomId}`);
    return members;
  },

  getReport() {
    return MultiplayerDiagnostics.getFullDiagnosticReport();
  },

  async forceLeaveAll() {
    if (!isDev) return;
    const channels = ablyClient.channels;
    const allChannels = (channels as unknown as { all?: Record<string, unknown> }).all || {};
    for (const [, channel] of Object.entries(allChannels)) {
      const ch = channel as { presence: { leave: () => Promise<void> }; detach: () => Promise<void> };
      await ch.presence.leave();
      await ch.detach();
    }
  },

  clearLogs() {
    MultiplayerDiagnostics.clearLogs();
  }
};

// Only expose to window in development mode
if (isDev && typeof window !== 'undefined') {
  (window as unknown as { debug: typeof debugTools }).debug = debugTools;
}
