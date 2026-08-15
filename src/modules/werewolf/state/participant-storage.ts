let activeOwner: string | null = null;
const LEGACY_KNOWN_CODES_KEY = "werewolf-online:known-codes";

export function setParticipantStorageOwner(userId: string | null): void {
  activeOwner = userId ? `user:${userId}` : "anonymous";
  if (!userId) migrateLegacyAnonymousStorage();
}

const keyFor = (code: string) =>
  activeOwner ? `werewolf-online:${activeOwner}:${code.toUpperCase()}` : null;
const knownCodesKey = () =>
  activeOwner ? `werewolf-online:${activeOwner}:known-codes` : null;
const MAX_KNOWN_CODES = 12;

function migrateLegacyAnonymousStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LEGACY_KNOWN_CODES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return;
    const codes = parsed.filter((code): code is string => typeof code === "string");
    const scopedKnownKey = knownCodesKey();
    if (!scopedKnownKey) return;

    for (const code of codes) {
      const legacyKey = `werewolf-online:${code.toUpperCase()}`;
      const scopedKey = keyFor(code);
      const token =
        window.localStorage.getItem(legacyKey) ?? window.sessionStorage.getItem(legacyKey);
      if (scopedKey && token && !window.localStorage.getItem(scopedKey)) {
        window.localStorage.setItem(scopedKey, token);
      }
    }
    if (!window.localStorage.getItem(scopedKnownKey)) {
      window.localStorage.setItem(scopedKnownKey, JSON.stringify(codes.slice(0, MAX_KNOWN_CODES)));
    }
  } catch {
    // Invalid legacy data is ignored; scoped storage remains usable.
  }
}

/**
 * Participant identity is persisted in localStorage so a player can close their tab or
 * browser entirely and come back to the same room (and seat) days later — rooms have no
 * server-side expiry, so this is what actually lets a game be picked up over a week.
 */
export function peekParticipantToken(code: string): string | null {
  if (typeof window === "undefined") return null;
  const key = keyFor(code);
  if (!key) return null;
  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
}

/** Also migrates a token left over from the previous tab-scoped (sessionStorage) scheme. */
export function loadParticipantToken(code: string): string | null {
  if (typeof window === "undefined") return null;
  const key = keyFor(code);
  if (!key) return null;
  const stored = window.localStorage.getItem(key);
  if (stored) return stored;

  const legacyToken = window.sessionStorage.getItem(key);
  if (!legacyToken) return null;
  window.localStorage.setItem(key, legacyToken);
  window.sessionStorage.removeItem(key);
  return legacyToken;
}

export function saveParticipantToken(code: string, token: string): void {
  const key = keyFor(code);
  if (!key) return;
  window.localStorage.setItem(key, token);
  window.sessionStorage.removeItem(key);
  rememberKnownCode(code);
}

export function clearParticipantToken(code: string): void {
  const key = keyFor(code);
  if (!key) return;
  window.localStorage.removeItem(key);
  window.sessionStorage.removeItem(key);
  forgetKnownCode(code);
}

/** Every room code this browser has created/joined, most-recent-first — lets the landing
 *  page and room browser find a player's room(s) again even once they've left the lobby
 *  phase (and so no longer show up in the public open-rooms list). */
export function getKnownRoomCodes(): string[] {
  if (typeof window === "undefined") return [];
  const key = knownCodesKey();
  if (!key) return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === "string") : [];
  } catch {
    return [];
  }
}

function rememberKnownCode(code: string): void {
  if (typeof window === "undefined") return;
  const key = knownCodesKey();
  if (!key) return;
  const upper = code.toUpperCase();
  const next = [upper, ...getKnownRoomCodes().filter((c) => c !== upper)].slice(0, MAX_KNOWN_CODES);
  window.localStorage.setItem(key, JSON.stringify(next));
}

function forgetKnownCode(code: string): void {
  if (typeof window === "undefined") return;
  const key = knownCodesKey();
  if (!key) return;
  const upper = code.toUpperCase();
  const next = getKnownRoomCodes().filter((c) => c !== upper);
  window.localStorage.setItem(key, JSON.stringify(next));
}
