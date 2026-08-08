const keyFor = (code: string) => `werewolf-online:${code.toUpperCase()}`;

/**
 * Participant identity is tab-scoped: separate players can use separate tabs in the
 * same browser profile, while refresh/back navigation in one tab still resumes.
 */
export function peekParticipantToken(code: string): string | null {
  if (typeof window === "undefined") return null;
  const key = keyFor(code);
  return window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
}

/** Claim a pre-fix localStorage token for this tab, then remove the shared copy. */
export function loadParticipantToken(code: string): string | null {
  if (typeof window === "undefined") return null;
  const key = keyFor(code);
  const sessionToken = window.sessionStorage.getItem(key);
  if (sessionToken) return sessionToken;

  const legacyToken = window.localStorage.getItem(key);
  if (!legacyToken) return null;
  window.sessionStorage.setItem(key, legacyToken);
  window.localStorage.removeItem(key);
  return legacyToken;
}

export function saveParticipantToken(code: string, token: string): void {
  const key = keyFor(code);
  window.sessionStorage.setItem(key, token);
  window.localStorage.removeItem(key);
}

export function clearParticipantToken(code: string): void {
  const key = keyFor(code);
  window.sessionStorage.removeItem(key);
  window.localStorage.removeItem(key);
}
