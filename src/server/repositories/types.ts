import type { DailyState, Mission } from "@/shared";

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
}

export interface UserRepo {
  create(username: string, passwordHash: string): UserRecord;
  findByUsername(username: string): UserRecord | null;
  findById(id: string): UserRecord | null;
}

export interface StateRepo {
  /** Returns the user's daily state, or a fresh empty one if none exists. */
  get(userId: string): DailyState;
  set(userId: string, state: DailyState): void;
}

export interface MissionRepo {
  create(mission: Mission): Mission;
  get(id: string): Mission | null;
  update(mission: Mission): Mission;
}
