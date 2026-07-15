import { randomUUID } from "node:crypto";
import type { DailyState, Mission } from "@/shared";
import { emptyDailyState } from "@/modules/session-draw/core/daily-state";
import type { MissionRepo, StateRepo, UserRecord, UserRepo } from "./types";

/**
 * In-memory repositories (process-scoped). Structured behind the repo interfaces
 * so a Prisma/PostgreSQL implementation can replace these without touching
 * services or route handlers.
 */

class MemoryUserRepo implements UserRepo {
  private byId = new Map<string, UserRecord>();
  private byUsername = new Map<string, UserRecord>();

  async create(username: string, passwordHash: string): Promise<UserRecord> {
    const record: UserRecord = { id: randomUUID(), username, passwordHash };
    this.byId.set(record.id, record);
    this.byUsername.set(username.toLowerCase(), record);
    return record;
  }
  async findByUsername(username: string): Promise<UserRecord | null> {
    return this.byUsername.get(username.toLowerCase()) ?? null;
  }
  async findById(id: string): Promise<UserRecord | null> {
    return this.byId.get(id) ?? null;
  }
}

class MemoryStateRepo implements StateRepo {
  private states = new Map<string, DailyState>();
  get(userId: string): DailyState {
    return this.states.get(userId) ?? emptyDailyState();
  }
  set(userId: string, state: DailyState): void {
    this.states.set(userId, state);
  }
}

class MemoryMissionRepo implements MissionRepo {
  private missions = new Map<string, Mission>();
  create(mission: Mission): Mission {
    this.missions.set(mission.id, mission);
    return mission;
  }
  get(id: string): Mission | null {
    return this.missions.get(id) ?? null;
  }
  update(mission: Mission): Mission {
    this.missions.set(mission.id, mission);
    return mission;
  }
}

/** Singletons. `userRepo` is selected in ./index (Prisma when DATABASE_URL is
 *  set, this in-memory impl otherwise). State/mission stay in-memory for now. */
export const memoryUserRepo: UserRepo = new MemoryUserRepo();
export const stateRepo: StateRepo = new MemoryStateRepo();
export const missionRepo: MissionRepo = new MemoryMissionRepo();
