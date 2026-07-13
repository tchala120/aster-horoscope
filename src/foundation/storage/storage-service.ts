/**
 * Framework-agnostic, versioned storage foundation.
 * Pure migration logic + a thin localStorage-backed implementation.
 * Consuming units add their own migrations and default state.
 */

export interface StorageService<T> {
  load(): T | null;
  save(value: T): void;
  clear(): void;
}

export interface VersionedEnvelope<T> {
  schemaVersion: number;
  data: T;
}

/** A migration transforms an older raw envelope's data shape forward by one version. */
export type Migration = (data: unknown) => unknown;

/**
 * Pure: forward-migrate a raw persisted value to the current schema version.
 * `migrations[n]` migrates data from version n -> n+1.
 */
export function migrate<T>(
  raw: unknown,
  currentVersion: number,
  migrations: Record<number, Migration>,
): VersionedEnvelope<T> | null {
  if (!raw || typeof raw !== "object") return null;
  const envelope = raw as Partial<VersionedEnvelope<unknown>>;
  let version = typeof envelope.schemaVersion === "number" ? envelope.schemaVersion : 0;
  let data = "data" in envelope ? envelope.data : raw;

  while (version < currentVersion) {
    const step = migrations[version];
    if (!step) break;
    data = step(data);
    version += 1;
  }

  return { schemaVersion: currentVersion, data: data as T };
}

export interface LocalStorageServiceOptions {
  key: string;
  currentVersion: number;
  migrations?: Record<number, Migration>;
}

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

/** Browser-backed StorageService. No-ops safely during SSR. */
export function createLocalStorageService<T>(
  options: LocalStorageServiceOptions,
): StorageService<T> {
  const { key, currentVersion, migrations = {} } = options;

  return {
    load(): T | null {
      if (!hasLocalStorage()) return null;
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw) as unknown;
        const migrated = migrate<T>(parsed, currentVersion, migrations);
        return migrated ? migrated.data : null;
      } catch {
        return null;
      }
    },
    save(value: T): void {
      if (!hasLocalStorage()) return;
      const envelope: VersionedEnvelope<T> = { schemaVersion: currentVersion, data: value };
      window.localStorage.setItem(key, JSON.stringify(envelope));
    },
    clear(): void {
      if (!hasLocalStorage()) return;
      window.localStorage.removeItem(key);
    },
  };
}
