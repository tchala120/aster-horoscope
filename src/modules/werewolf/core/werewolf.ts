export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 10;

export type RoleId = "villager" | "werewolf" | "seer" | "doctor" | "hunter";
export type Team = "village" | "werewolf";

export interface RoleInfo {
  id: RoleId;
  label: string;
  team: Team;
  blurb: string;
  portrait: string;
}

export const ROLES: Record<RoleId, RoleInfo> = {
  villager: {
    id: "villager",
    label: "Villager",
    team: "village",
    blurb: "No powers — just your wits. Find the wolves before they find you.",
    portrait: "/werewolf-game/villager.png",
  },
  werewolf: {
    id: "werewolf",
    label: "Werewolf",
    team: "werewolf",
    blurb: "Each night, join the pack to choose a villager to devour.",
    portrait: "/werewolf-game/werewolf.png",
  },
  seer: {
    id: "seer",
    label: "Seer",
    team: "village",
    blurb: "Each night, peer into one player's true nature.",
    portrait: "/werewolf-game/seer.png",
  },
  doctor: {
    id: "doctor",
    label: "Doctor",
    team: "village",
    blurb: "Each night, protect one player from the wolves' bite.",
    portrait: "/werewolf-game/doctor.png",
  },
  hunter: {
    id: "hunter",
    label: "Hunter",
    team: "village",
    blurb: "If you die, take one more soul with you on the way out.",
    portrait: "/werewolf-game/hunter.png",
  },
};

/** Distinct pawn colors, one per seat (index = seat, up to MAX_PLAYERS). */
export const TOKENS: readonly string[] = [
  "#33ccad",
  "#33a1cc",
  "#b78bff",
  "#ff7a1f",
  "#ffd45a",
  "#ff5a8a",
  "#4ade80",
  "#f87171",
  "#60a5fa",
  "#c084fc",
];

/** Character portraits a player picks from when creating or joining a room. */
export const AVATARS: readonly string[] = Array.from(
  { length: 10 },
  (_, i) => `/werewolf-game/avatar/icon_${i + 1}.png`,
);

/** Role pool per player count — roughly a quarter to a third werewolves. */
const ROLE_SETUPS: Record<number, RoleId[]> = {
  5: ["werewolf", "seer", "doctor", "hunter", "villager"],
  6: ["werewolf", "seer", "doctor", "hunter", "villager", "villager"],
  7: ["werewolf", "werewolf", "seer", "doctor", "hunter", "villager", "villager"],
  8: ["werewolf", "werewolf", "seer", "doctor", "hunter", "villager", "villager", "villager"],
  9: [
    "werewolf",
    "werewolf",
    "seer",
    "doctor",
    "hunter",
    "villager",
    "villager",
    "villager",
    "villager",
  ],
  10: [
    "werewolf",
    "werewolf",
    "seer",
    "doctor",
    "hunter",
    "villager",
    "villager",
    "villager",
    "villager",
    "villager",
  ],
};

function shuffleInPlace<T>(arr: T[], rng: () => number = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** The fixed role pool for a player count, unshuffled — lets the lobby preview role counts pre-game. */
export function rolePoolFor(count: number): readonly RoleId[] {
  return ROLE_SETUPS[count] ?? ROLE_SETUPS[MIN_PLAYERS];
}

/** Shuffle the role pool for a given player count into a fresh assignment. */
export function assignRoles(count: number, rng: () => number = Math.random): RoleId[] {
  const pool = ROLE_SETUPS[count] ?? ROLE_SETUPS[MIN_PLAYERS];
  return shuffleInPlace([...pool], rng);
}

export interface AliveInfo {
  role: RoleId;
  alive: boolean;
}

/** village wins once every wolf is gone; wolves win once they're no longer outnumbered. */
export function checkWinner(players: readonly AliveInfo[]): Team | null {
  const alive = players.filter((p) => p.alive);
  const wolves = alive.filter((p) => p.role === "werewolf").length;
  const others = alive.length - wolves;
  if (wolves === 0) return "village";
  if (wolves >= others) return "werewolf";
  return null;
}

/** The wolves' pick survives only if the doctor happened to shield the same person. */
export function resolveNightKill(
  wolfTargetId: string | null,
  doctorProtectId: string | null,
): string | null {
  if (!wolfTargetId) return null;
  if (wolfTargetId === doctorProtectId) return null;
  return wolfTargetId;
}

/** Whether the seer's target is a werewolf. */
export function seerInspect(
  players: readonly { id: string; role: RoleId }[],
  targetId: string,
): boolean {
  return players.find((p) => p.id === targetId)?.role === "werewolf";
}

export interface VoteTally {
  eliminatedId: string | null;
  tie: boolean;
  counts: Record<string, number>;
}

/** Majority elimination; a tie for the top spot (or no votes cast) eliminates no one. */
export function tallyVotes(votes: Record<string, string | null>): VoteTally {
  const counts: Record<string, number> = {};
  for (const target of Object.values(votes)) {
    if (!target) continue;
    counts[target] = (counts[target] ?? 0) + 1;
  }
  const entries = Object.entries(counts);
  if (entries.length === 0) return { eliminatedId: null, tie: false, counts };

  const max = Math.max(...entries.map(([, n]) => n));
  const top = entries.filter(([, n]) => n === max);
  if (top.length > 1) return { eliminatedId: null, tie: true, counts };
  return { eliminatedId: top[0][0], tie: false, counts };
}
