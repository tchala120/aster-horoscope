import type { RoleId, Team, VoteTally } from "./werewolf";

export type RoomPhase =
  | "lobby"
  | "countdown"
  | "night-wolf"
  | "night-seer"
  | "night-doctor"
  | "dawn"
  | "hunter-revenge"
  | "day-discuss"
  | "day-vote"
  | "day-result"
  | "over";

/** One seat in the room — the server's full record, including its secret token. */
export interface RoomPlayer {
  id: string;
  token: string;
  name: string;
  color: string;
  avatar: string;
  ready: boolean;
  role: RoleId | null;
  alive: boolean;
  joinedAt: string;
}

/** One line in the room's chat feed — a system notice or a player's typed message. */
export interface ChatEntry {
  id: string;
  kind: "system" | "player";
  /** Sender's display name (player messages only; null for system notices). */
  name: string | null;
  /** Sender's seat color, for tinting their name (player messages only). */
  color: string | null;
  text: string;
  at: string;
}

/** One public gameplay event. Secret night choices are never written here. */
export interface GameLogEntry {
  id: string;
  phase: "day" | "night";
  label: string;
  text: string;
  at: string;
}

/** The room's full authoritative state, as persisted server-side. Never sent as-is to a client. */
export interface RoomState {
  code: string;
  hostToken: string;
  phase: RoomPhase;
  nightNumber: number;
  countdownEndsAt: string | null;
  players: RoomPlayer[];
  wolfTargetId: string | null;
  doctorProtectId: string | null;
  seerTargetId: string | null;
  lastNightKilledId: string | null;
  hunterRevengeFor: string | null;
  hunterOrigin: "night" | "day" | null;
  votes: Record<string, string | null>;
  dayResult: VoteTally | null;
  winner: Team | null;
  message: string;
  chat: ChatEntry[];
  gameLog: GameLogEntry[];
}

/** One row in the public "open rooms" browser — enough to pick a room to join. */
export interface OpenRoomSummary {
  code: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
}

/** A player as shown to a given viewer — role is redacted unless it's public to them. */
export interface PublicPlayer {
  id: string;
  name: string;
  color: string;
  avatar: string;
  alive: boolean;
  role: RoleId | null;
  isYou: boolean;
  /** True for the player who created the room — safe to reveal, shown as a crown. */
  isHost: boolean;
  ready: boolean;
}

/** The seer's private result for the player they just inspected this night. */
export interface SeerVision {
  targetId: string;
  targetName: string;
  isWerewolf: boolean;
}

/** The redacted, per-viewer snapshot returned by the API. */
export interface PublicRoom {
  code: string;
  phase: RoomPhase;
  nightNumber: number;
  countdownEndsAt: string | null;
  message: string;
  winner: Team | null;
  isHost: boolean;
  you: { id: string; role: RoleId | null; alive: boolean } | null;
  players: PublicPlayer[];
  /** Alive-wolf count — safe to reveal (matches the hotseat header) since it never names names. */
  wolvesRemaining: number;
  seerVision: SeerVision | null;
  lastNightKilledId: string | null;
  hunterRevengeFor: string | null;
  dayEliminatedId: string | null;
  voteCounts: Record<string, number> | null;
  youHaveVoted: boolean;
  votesIn: number;
  votesNeeded: number;
  /** Recent chat/system-notice feed, oldest first (capped server-side). */
  chat: ChatEntry[];
  /** Public game events, oldest first (capped server-side). */
  gameLog: GameLogEntry[];
}

export type WerewolfAction =
  | { type: "set-ready"; ready: boolean }
  | { type: "wolf-target"; targetId: string }
  | { type: "seer-target"; targetId: string }
  | { type: "seer-continue" }
  | { type: "doctor-target"; targetId: string }
  | { type: "dawn-continue" }
  | { type: "hunter-target"; targetId: string }
  | { type: "discuss-continue" }
  | { type: "vote"; targetId: string }
  | { type: "day-result-continue" }
  | { type: "play-again" }
  | { type: "new-players" }
  | { type: "chat"; text: string };
