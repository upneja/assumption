const SESSION_KEY = 'assumptions_session_id';

// Generate a random session ID
function generateSessionId(): string {
  return crypto.randomUUID();
}

// Get or create session ID (client-side only)
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getSessionId can only be called on the client');
  }

  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

// Clear session (for testing/debugging)
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}
