import { beforeEach, describe, expect, it } from "vitest";
import {
  createLocalStorageService,
  migrate,
  type Migration,
} from "@/foundation/storage/storage-service";

interface DemoState {
  count: number;
  label?: string;
}

describe("migrate (pure)", () => {
  it("forward-migrates an unversioned/older shape to the current version", () => {
    const migrations: Record<number, Migration> = {
      0: (data) => ({ ...(data as object), label: "migrated" }),
    };
    const result = migrate<DemoState>({ schemaVersion: 0, data: { count: 1 } }, 1, migrations);
    expect(result).toEqual({ schemaVersion: 1, data: { count: 1, label: "migrated" } });
  });

  it("returns null for non-object input", () => {
    expect(migrate<DemoState>(null, 1, {})).toBeNull();
  });
});

describe("createLocalStorageService (jsdom)", () => {
  beforeEach(() => window.localStorage.clear());

  it("round-trips save and load", () => {
    const svc = createLocalStorageService<DemoState>({ key: "demo", currentVersion: 1 });
    svc.save({ count: 42 });
    expect(svc.load()).toEqual({ count: 42 });
  });

  it("clear removes the value", () => {
    const svc = createLocalStorageService<DemoState>({ key: "demo", currentVersion: 1 });
    svc.save({ count: 1 });
    svc.clear();
    expect(svc.load()).toBeNull();
  });
});
