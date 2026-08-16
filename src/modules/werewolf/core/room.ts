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
  | "day-runoff"
  | "day-result"
  | "over";

/** Outcome of the yes/no runoff on whether to actually cast out the day-vote's leading suspect. */
export interface RunoffResult {
  yes: number;
  no: number;
  eliminated: boolean;
}

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
  /** Server-controlled seat that acts automatically and has no browser session. */
  isBot?: boolean;
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

/** Host-configurable room rules. Locked once the game leaves the lobby. */
export interface RoomSettings {
  /** Seconds action buttons stay locked after a phase begins. 0 disables the lock. */
  actionCooldownSec: number;
  /** Seconds a night role (wolves/seer/doctor) has to act before their turn is skipped
   *  (no kill/vision/protection that night) and the game moves on. 0 disables the skip —
   *  useful for long-running games where a role-holder might be away for a while. */
  nightActionTimeoutSec: number;
  /** Keep a dead player's role hidden from everyone but themselves. */
  hideRoleOnDeath: boolean;
  /** Hide the "N wolves remain" count from the phase header. */
  hideWolvesRemaining: boolean;
  /** Reveal who voted for whom during the day vote, not just the tally. */
  showVoters: boolean;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  actionCooldownSec: 0,
  nightActionTimeoutSec: 0,
  hideRoleOnDeath: false,
  hideWolvesRemaining: false,
  showVoters: false,
};

/** The room's full authoritative state, as persisted server-side. Never sent as-is to a client. */
export interface RoomState {
  code: string;
  roomName: string;
  hostToken: string;
  phase: RoomPhase;
  nightNumber: number;
  countdownEndsAt: string | null;
  /** When the current phase began — the anchor for the action-cooldown lock. */
  phaseStartedAt: string;
  settings: RoomSettings;
  players: RoomPlayer[];
  wolfTargetId: string | null;
  doctorProtectId: string | null;
  /** Who the doctor protected the PREVIOUS night — the doctor can't pick the same
   *  person twice in a row. Cleared to null at the start of night 1 / a new game. */
  doctorLastProtectId: string | null;
  seerTargetId: string | null;
  lastNightKilledId: string | null;
  hunterRevengeFor: string | null;
  hunterOrigin: "night" | "day" | null;
  votes: Record<string, string | null>;
  dayResult: VoteTally | null;
  /** The day-vote's leading suspect, on trial during "day-runoff" (and shown through "day-result"). */
  runoffCandidateId: string | null;
  runoffVotes: Record<string, boolean>;
  runoffResult: RunoffResult | null;
  winner: Team | null;
  message: string;
  chat: ChatEntry[];
  /** Private channel visible only to werewolves — they don't otherwise know their teammates. */
  wolfChat: ChatEntry[];
  gameLog: GameLogEntry[];
}

/** One row in the public "open rooms" browser — enough to pick a room to join. */
export interface OpenRoomSummary {
  code: string;
  roomName: string;
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
  isBot?: boolean;
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
  roomName: string;
  phase: RoomPhase;
  nightNumber: number;
  countdownEndsAt: string | null;
  phaseStartedAt: string;
  settings: RoomSettings;
  message: string;
  winner: Team | null;
  isHost: boolean;
  you: { id: string; role: RoleId | null; alive: boolean } | null;
  players: PublicPlayer[];
  /** Alive-wolf count — safe to reveal (matches the hotseat header) since it never names names. Null when the host hides it. */
  wolvesRemaining: number | null;
  seerVision: SeerVision | null;
  /** Who the doctor protected last night — non-null only for the doctor viewer, so they
   *  know who they can't pick again tonight. Null for everyone else. */
  doctorLastProtectId: string | null;
  lastNightKilledId: string | null;
  hunterRevengeFor: string | null;
  /** Who actually died from today's vote, once the runoff resolves — null if spared or still pending. */
  dayEliminatedId: string | null;
  voteCounts: Record<string, number> | null;
  /** Voter id -> target id, only populated when settings.showVoters is on. */
  voteDetails: Record<string, string> | null;
  youHaveVoted: boolean;
  votesIn: number;
  votesNeeded: number;
  /** The day-vote's leading suspect, while their fate is being decided (day-runoff/day-result). */
  runoffCandidateId: string | null;
  youHaveVotedRunoff: boolean;
  runoffVotesIn: number;
  runoffVotesNeeded: number;
  runoffResult: RunoffResult | null;
  /** Recent chat/system-notice feed, oldest first (capped server-side). */
  chat: ChatEntry[];
  /** Private werewolf channel — non-null only for a living werewolf viewer once a pack of 2+ exists. */
  wolfChat: ChatEntry[] | null;
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
  | { type: "runoff-vote"; vote: boolean }
  | { type: "day-result-continue" }
  | { type: "play-again" }
  | { type: "new-players" }
  | { type: "chat"; text: string }
  | { type: "wolf-chat"; text: string }
  | { type: "kick"; playerId: string }
  | { type: "add-bot" }
  | { type: "update-settings"; settings: Partial<RoomSettings> };
