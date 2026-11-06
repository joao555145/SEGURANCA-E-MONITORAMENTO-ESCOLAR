import type { SessionUser } from '../types';

const SESSION_KEY = 'new-security.admin-session.v1';

function isSessionUser(value: unknown): value is SessionUser {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const user = value as Partial<SessionUser>;
  return (
    typeof user.id === 'number' &&
    (user.id === 1 || user.id === 2) &&
    typeof user.username === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    user.role === 'admin' &&
    typeof user.accessToken === 'string' &&
    user.accessToken.length > 20 &&
    typeof user.expiresAt === 'string' &&
    Number.isFinite(Date.parse(user.expiresAt)) &&
    Date.parse(user.expiresAt) > Date.now()
  );
}

/** Store the short-lived session in sessionStorage, not persistent localStorage. */
export function readSession(): SessionUser | null {
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (isSessionUser(parsed)) return parsed;
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  } catch {
    return null;
  }
}

export function saveSession(user: SessionUser): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // The login still works for the current page; reload will require another login.
  }
}

export function clearSession(): void {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // A failed storage cleanup must not block the UI logout.
  }
}
