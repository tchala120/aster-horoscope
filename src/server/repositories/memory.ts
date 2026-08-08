import { randomUUID } from "node:crypto";
import type {
  DailyState,
  HistoryEntry,
  MatchScore,
  Mission,
  MissionFeatureId,
  RewardOutcome,
} from "@/shared";
import { emptyDailyState } from "@/modules/session-draw/core/daily-state";
import type { RoomState } from "@/modules/werewolf/core/room";
import type {
  HistoryRepo,
  MatchScoreRepo,
  MissionRepo,
  NewHistoryEntry,
  NewMatchScore,
  QuestEventRepo,
  RewardRepo,
  StateRepo,
  UserRecord,
  UserRepo,
  WerewolfRoomRepo,
} from "./types";

/**
 * In-memory repositories (process-scoped). Structured behind the repo interfaces
 * so a Prisma/PostgreSQL implementation can replace these without touching
 * services or route handlers.
 */

class MemoryUserRepo implements UserRepo {
  private byId = new Map<string, UserRecord>();
  private byUsername = new Map<string, UserRecord>();
  private byWalletAddress = new Map<string, UserRecord>();

  async create(username: string, passwordHash: string): Promise<UserRecord> {
    const record: UserRecord = { id: randomUUID(), username, passwordHash, walletAddress: null };
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
  async findByWalletAddress(address: string): Promise<UserRecord | null> {
    return this.byWalletAddress.get(address.toLowerCase()) ?? null;
  }
  async setWalletAddress(userId: string, address: string | null): Promise<UserRecord> {
    const record = this.byId.get(userId);
    if (!record) throw new Error(`Unknown user: ${userId}`);
    if (record.walletAddress) this.byWalletAddress.delete(record.walletAddress);
    record.walletAddress = address ? address.toLowerCase() : null;
    if (record.walletAddress) this.byWalletAddress.set(record.walletAddress, record);
    return record;
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

class MemoryRewardRepo implements RewardRepo {
  private byMission = new Map<string, RewardOutcome>();
  create(outcome: RewardOutcome): RewardOutcome {
    this.byMission.set(outcome.missionRef, outcome);
    return outcome;
  }
  getByMission(missionRef: string): RewardOutcome | null {
    return this.byMission.get(missionRef) ?? null;
  }
}

class MemoryQuestEventRepo implements QuestEventRepo {
  private events = new Map<string, string>();

  record(userId: string, featureId: MissionFeatureId): void {
    this.events.set(`${userId}:${featureId}`, new Date().toISOString());
  }

  consume(userId: string, featureId: MissionFeatureId, sinceIso: string | null): boolean {
    const key = `${userId}:${featureId}`;
    const at = this.events.get(key);
    if (!at || !sinceIso || at < sinceIso) return false;
    this.events.delete(key);
    return true;
  }
}

class MemoryHistoryRepo implements HistoryRepo {
  private byUser = new Map<string, HistoryEntry[]>();
  async add(entry: NewHistoryEntry): Promise<HistoryEntry> {
    const record: HistoryEntry = {
      id: randomUUID(),
      cardRef: entry.cardRef,
      featureRef: entry.featureRef,
      difficulty: entry.difficulty,
      rewardType: entry.rewardType,
      rewardValue: entry.rewardValue,
      rewardGranted: entry.rewardGranted,
      payoutTxHash: entry.payoutTxHash,
      completedAt: new Date().toISOString(),
    };
    const list = this.byUser.get(entry.userId) ?? [];
    list.push(record);
    this.byUser.set(entry.userId, list);
    return record;
  }
  async listByUser(userId: string): Promise<HistoryEntry[]> {
    const list = this.byUser.get(userId) ?? [];
    // Newest first.
    return [...list].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  }
}

class MemoryMatchScoreRepo implements MatchScoreRepo {
  private scores: MatchScore[] = [];
  async add(entry: NewMatchScore): Promise<MatchScore> {
    const record: MatchScore = {
      id: randomUUID(),
      name: entry.name,
      moves: entry.moves,
      createdAt: new Date().toISOString(),
    };
    this.scores.push(record);
    return record;
  }
  async top(limit: number): Promise<MatchScore[]> {
    return [...this.scores]
      .sort((a, b) => a.moves - b.moves || b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
}

class MemoryWerewolfRoomRepo implements WerewolfRoomRepo {
  private byCode = new Map<string, RoomState>();
  async create(state: RoomState): Promise<RoomState> {
    this.byCode.set(state.code, state);
    return state;
  }
  async getByCode(code: string): Promise<RoomState | null> {
    return this.byCode.get(code) ?? null;
  }
  async save(state: RoomState): Promise<RoomState> {
    this.byCode.set(state.code, state);
    return state;
  }
  async listRecent(limit: number): Promise<RoomState[]> {
    return [...this.byCode.values()].reverse().slice(0, limit);
  }
  async deleteByCode(code: string): Promise<void> {
    this.byCode.delete(code);
  }
}

/** Singletons. `userRepo`/`historyRepo`/`matchScoreRepo` are selected in ./index
 *  (Prisma when DATABASE_URL is set, these in-memory impls otherwise).
 *  State/mission/reward stay in-memory for now. */
export const memoryUserRepo: UserRepo = new MemoryUserRepo();
export const stateRepo: StateRepo = new MemoryStateRepo();
export const missionRepo: MissionRepo = new MemoryMissionRepo();
export const rewardRepo: RewardRepo = new MemoryRewardRepo();
export const questEventRepo: QuestEventRepo = new MemoryQuestEventRepo();
export const memoryHistoryRepo: HistoryRepo = new MemoryHistoryRepo();
export const memoryMatchScoreRepo: MatchScoreRepo = new MemoryMatchScoreRepo();
export const memoryWerewolfRoomRepo: WerewolfRoomRepo = new MemoryWerewolfRoomRepo();
