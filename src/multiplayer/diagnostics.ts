/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { ablyClient } from './ably-client';

// Only log in development mode
const isDev = import.meta.env.DEV;

interface LogEntry {
  timestamp: number;
  category: string;
  data: unknown;
}

export class MultiplayerDiagnostics {
  public static logs: LogEntry[] = [];

  static log(category: string, data: unknown) {
    const entry = {
      timestamp: Date.now(),
      category,
      data
    };
    this.logs.push(entry);
    // Only output logs in development mode
    if (isDev) {
       
      console.log(`[DIAGNOSTIC:${category}]`, data);
    }
  }

  static async checkAblyConnection() {
    this.log('ABLY_CONNECTION', {
      state: ablyClient.connection.state,
      clientId: ablyClient.auth.clientId,
      connectionId: ablyClient.connection.id
    });

    return {
      isConnected: ablyClient.connection.state === 'connected',
      clientId: ablyClient.auth.clientId
    };
  }

  static async checkPresenceInChannel(channelName: string) {
    const channel = ablyClient.channels.get(channelName);
    const members = await channel.presence.get();

    this.log('PRESENCE_CHECK', {
      channelName,
      memberCount: members.length,
      members: members.map(m => ({
        clientId: m.clientId,
        data: m.data
      }))
    });

    return members;
  }

  static async verifyClientIdConsistency() {
    const sessionStorageId = sessionStorage.getItem('tictacfor_session_client_id');
    const ablyClientId = ablyClient.auth.clientId;

    const consistent = sessionStorageId === ablyClientId;

    this.log('CLIENT_ID_CONSISTENCY', {
      sessionStorageId,
      ablyClientId,
      consistent,
      mismatch: !consistent
    });

    return consistent;
  }

  static getFullDiagnosticReport() {
    return {
      logs: this.logs,
      summary: {
        totalEvents: this.logs.length,
        categories: [...new Set(this.logs.map(l => l.category))]
      }
    };
  }

  static clearLogs() {
    this.logs = [];
  }

  static logMove(source: 'LOCAL' | 'REMOTE', data: unknown) {
    this.log('MOVE', {
      source,
      ...(data as object),
      timestamp: Date.now()
    });
  }

  static logChannelMessage(channelName: string, message: { name: string; data: unknown }) {
    this.log('CHANNEL_MESSAGE', {
      channelName,
      messageType: message.name,
      messageData: message.data,
      timestamp: Date.now()
    });
  }
}

// Add to window for browser console access only in development
if (isDev && typeof window !== 'undefined') {
  (window as unknown as { multiplayerDiagnostics: typeof MultiplayerDiagnostics }).multiplayerDiagnostics = MultiplayerDiagnostics;
}
