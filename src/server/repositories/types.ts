import type { DailyState, Difficulty, HistoryEntry, Mission, RewardOutcome, RewardType } from "@/shared";

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
}

export interface UserRepo {
  create(username: string, passwordHash: string): Promise<UserRecord>;
  findByUsername(username: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
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

export interface RewardRepo {
  /** Persist a granted reward outcome (keyed by its mission). */
  create(outcome: RewardOutcome): RewardOutcome;
  /** The reward granted for a mission, if any. */
  getByMission(missionRef: string): RewardOutcome | null;
}

/** Fields captured when recording a completed-mission history entry. */
export interface NewHistoryEntry {
  userId: string;
  cardRef: string;
  featureRef: string;
  difficulty: Difficulty;
  rewardType: RewardType | null;
  rewardValue: number | null;
  rewardGranted: boolean;
}

export interface HistoryRepo {
  /** Persist a completed-mission record; returns it with id + completedAt. */
  add(entry: NewHistoryEntry): Promise<HistoryEntry>;
  /** The user's history, newest first. */
  listByUser(userId: string): Promise<HistoryEntry[]>;
}
