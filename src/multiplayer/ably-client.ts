import * as Ably from 'ably';
import { nanoid } from 'nanoid';

const apiKey = import.meta.env.VITE_ABLY_API_KEY;

if (!apiKey) {
  throw new Error(
    'VITE_ABLY_API_KEY environment variable is not set. ' +
    'Please add it to your .env file. ' +
    'Get your API key from https://ably.com/dashboard'
  );
}

// Generate or retrieve session-specific client ID
const getClientId = (): string => {
  const STORAGE_KEY = 'tictacfor_session_client_id';
  let clientId = sessionStorage.getItem(STORAGE_KEY);

  console.log('[ably-client] getClientId CALLED');
  console.log('[ably-client] Storage key:', STORAGE_KEY);
  console.log('[ably-client] Existing clientId from sessionStorage:', clientId);

  if (!clientId) {
    clientId = nanoid();
    sessionStorage.setItem(STORAGE_KEY, clientId);
    console.log('[ably-client] Generated NEW clientId:', clientId);
  } else {
    console.log('[ably-client] Using EXISTING clientId:', clientId);
  }

  // CRITICAL: Verify it's actually in sessionStorage
  const verified = sessionStorage.getItem(STORAGE_KEY);
  console.log('[ably-client] Verified in sessionStorage:', verified);
  console.log('[ably-client] Match?', verified === clientId);

  return clientId;
};

const clientId = getClientId();

console.log('[ably-client] Creating Ably.Realtime with:', {
  clientId,
  apiKey: apiKey.substring(0, 10) + '...',
  autoConnect: true,
  echoMessages: false
});

export const ablyClient = new Ably.Realtime({
  key: apiKey,
  clientId: clientId,
  autoConnect: true,
  echoMessages: false,
});

// Log connection state changes
ablyClient.connection.on('connected', () => {
  console.log('[ably-client] CONNECTION CONNECTED:', {
    clientId: ablyClient.auth.clientId,
    connectionId: ablyClient.connection.id,
    state: ablyClient.connection.state
  });
});

ablyClient.connection.on('disconnected', () => {
  console.log('[ably-client] CONNECTION DISCONNECTED:', {
    clientId: ablyClient.auth.clientId,
    reason: ablyClient.connection.errorReason
  });
});

ablyClient.connection.on('failed', (err) => {
  console.error('[ably-client] CONNECTION FAILED:', err);
});

console.log('[ably-client] Module loaded, ablyClient created');
console.log('[ably-client] ablyClient.auth.clientId:', ablyClient.auth.clientId);
