import { clearSession, getSessionId } from './session';

describe('session', () => {
  const key = 'assumptions_session_id';

  beforeEach(() => {
    localStorage.clear();
  });

  it('creates and reuses a session id in localStorage', () => {
    const first = getSessionId();
    expect(first).toBe(localStorage.getItem(key));
    const second = getSessionId();
    expect(second).toBe(first);
  });

  it('clears the session', () => {
    getSessionId();
    clearSession();
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('throws on the server', () => {
    const original = global.window;
    // @ts-expect-error testing server guard
    delete (global as any).window;
    expect(() => getSessionId()).toThrow('getSessionId can only be called on the client');
    (global as any).window = original;
  });
});
