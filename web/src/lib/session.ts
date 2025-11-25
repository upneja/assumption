/**
 * SESSION MANAGEMENT
 *
 * Lightweight identity system that replaces traditional authentication for party games.
 *
 * Problem: Party games need to identify players across page refreshes without
 * requiring account creation, email verification, or OAuth flows.
 *
 * Solution: Generate a UUID on first visit, store it in localStorage, and use it
 * as the player identifier in all API calls. The server associates this session_id
 * with the player's database record.
 *
 * Benefits:
 * - Zero friction: Players can join instantly with just a name and room code
 * - Persistent identity: Players can refresh the page without losing their spot
 * - No backend complexity: No auth tokens, JWTs, or session management needed
 * - Privacy-friendly: No personal data collected or stored
 *
 * Trade-offs:
 * - Session lost if localStorage is cleared (acceptable for short game sessions)
 * - No cross-device identity (acceptable for in-person party games)
 * - Not suitable for long-term accounts or sensitive data
 *
 * Flow:
 * 1. User visits site → getSessionId() called
 * 2. If no session exists → generate UUID and store in localStorage
 * 3. Session ID included in all API requests
 * 4. Server uses (session_id, room_id) to identify player record
 * 5. Player can refresh page and maintain their identity
 *
 * Security: This is intentionally insecure for user identity. Any user can
 * impersonate another by copying their session ID. This is fine for party games
 * where all players are physically present and trust each other.
 */

/**
 * LocalStorage key for storing the session identifier.
 * Namespaced to avoid conflicts with other apps on the same domain.
 */
const SESSION_KEY = 'assumptions_session_id';

/**
 * Generate a cryptographically random session ID.
 *
 * Uses the Web Crypto API's randomUUID() which generates a version 4 UUID.
 * Example: "550e8400-e29b-41d4-a716-446655440000"
 *
 * @returns A UUID v4 string
 */
function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Get or create the browser session ID.
 *
 * This is the primary identity function called by all components that need
 * to identify the current player. It's idempotent - calling it multiple times
 * returns the same ID.
 *
 * CLIENT-SIDE ONLY: This function accesses localStorage and must only be called
 * from components that render on the client (not in Server Components or API routes).
 *
 * @throws Error if called on the server
 * @returns The session ID (either existing from localStorage or newly generated)
 *
 * @example
 * ```tsx
 * 'use client';
 * import { getSessionId } from '@/lib/session';
 *
 * export default function JoinRoom() {
 *   const handleJoin = async () => {
 *     const sessionId = getSessionId(); // Get/create session
 *     await fetch('/api/rooms/ABC123/join', {
 *       method: 'POST',
 *       body: JSON.stringify({ displayName, sessionId }),
 *     });
 *   };
 * }
 * ```
 */
export function getSessionId(): string {
  // Server-side guard: localStorage doesn't exist in Node.js
  // For static export builds, return empty string - actual value will be set on client
  if (typeof window === 'undefined') {
    return '';
  }

  // Try to retrieve existing session
  let sessionId = localStorage.getItem(SESSION_KEY);

  // If no session exists, create and persist one
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Clear the session from localStorage.
 *
 * Useful for testing/debugging when you want to simulate a new user.
 * In production, this would cause the player to lose their identity and
 * appear as a new player if they try to rejoin a room.
 *
 * Safe to call on server-side (no-op if window is undefined).
 *
 * @example
 * ```tsx
 * // Reset identity for testing
 * clearSession();
 * window.location.reload(); // Now you'll get a new session ID
 * ```
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}
