import { randomUUID } from "node:crypto";
import type {
  ChatEntry,
  GameLogEntry,
  OpenRoomSummary,
  PublicPlayer,
  PublicRoom,
  RoomPlayer,
  RoomState,
  SeerVision,
  WerewolfAction,
} from "@/modules/werewolf/core/room";
import {
  AVATARS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROLES,
  type RoleId,
  TOKENS,
  type Team,
  assignRoles,
  checkWinner,
  resolveNightKill,
  seerInspect,
  tallyVotes,
} from "@/modules/werewolf/core/werewolf";
import { werewolfRoomRepo } from "../repositories";
import { serviceError } from "../service-error";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — avoids lookalikes when read aloud

function generateCode(): string {
  let out = "";
  for (let i = 0; i < 6; i++) out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return out;
}

async function loadRoom(code: string): Promise<RoomState> {
  const state = await werewolfRoomRepo.getByCode(code.trim().toUpperCase());
  if (!state) throw serviceError("WEREWOLF_NOT_FOUND", "Room not found.", 404);
  return state;
}

function requirePlayer(state: RoomState, token: string): RoomPlayer {
  const player = state.players.find((p) => p.token === token);
  if (!player) throw serviceError("WEREWOLF_FORBIDDEN", "You are not in this room.", 403);
  return player;
}

function requireHost(state: RoomState, token: string): void {
  if (state.hostToken !== token) {
    throw serviceError("WEREWOLF_FORBIDDEN", "Only the host can do that.", 403);
  }
}

function requireAliveRole(
  state: RoomState,
  token: string,
  role: RoleId,
  label: string,
): RoomPlayer {
  const player = requirePlayer(state, token);
  if (!player.alive || player.role !== role) {
    throw serviceError("WEREWOLF_FORBIDDEN", `Only the living ${label} can do that.`, 403);
  }
  return player;
}

function isRoleAlive(state: RoomState, role: RoleId): boolean {
  return state.players.some((p) => p.role === role && p.alive);
}

function findAliveTarget(state: RoomState, targetId: string): RoomPlayer {
  const target = state.players.find((p) => p.id === targetId);
  if (!target || !target.alive) throw serviceError("WEREWOLF_VALIDATION", "Invalid target.", 400);
  return target;
}

/** Roles are always assigned by the time win/vision checks run (after start/play-again). */
function roomWinner(players: readonly RoomPlayer[]): Team | null {
  return checkWinner(players.map((p) => ({ role: p.role as RoleId, alive: p.alive })));
}

function roomSeerInspect(players: readonly RoomPlayer[], targetId: string): boolean {
  return seerInspect(
    players.map((p) => ({ id: p.id, role: p.role as RoleId })),
    targetId,
  );
}

const GAME_LOG_LIMIT = 40;

function appendGameLog(
  state: RoomState,
  entry: Omit<GameLogEntry, "id" | "at">,
): RoomState {
  const full: GameLogEntry = { ...entry, id: randomUUID(), at: new Date().toISOString() };
  return { ...state, gameLog: [...(state.gameLog ?? []), full].slice(-GAME_LOG_LIMIT) };
}

// ---- Night/day transitions (pure — given a state + validated input, return the next state) ----

function beginNight(state: RoomState, night: number): RoomState {
  return appendGameLog({
    ...state,
    phase: "night-wolf",
    nightNumber: night,
    countdownEndsAt: null,
    wolfTargetId: null,
    doctorProtectId: null,
    seerTargetId: null,
    lastNightKilledId: null,
    hunterOrigin: null,
    message: `Night ${night} falls. The wolves wake.`,
  }, { phase: "night", label: `Night ${night}`, text: "Night falls over the village." });
}

function applyReady(state: RoomState, token: string, ready: boolean): RoomState {
  const player = requirePlayer(state, token);
  if (state.phase !== "lobby") {
    throw serviceError("WEREWOLF_BAD_PHASE", "Readiness is locked once starting begins.", 409);
  }
  const players = state.players.map((p) => (p.id === player.id ? { ...p, ready } : p));
  return {
    ...state,
    players,
    message: ready ? `${player.name} is ready.` : `${player.name} is not ready.`,
  };
}

function finishGame(state: RoomState, winner: Team): RoomState {
  const message =
    winner === "village"
      ? "The village has rooted out every wolf!"
      : "The wolves have taken the village!";
  return appendGameLog({
    ...state,
    phase: "over",
    winner,
    message,
  }, { phase: "day", label: "Game over", text: message });
}

function resolveNightState(state: RoomState): RoomState {
  const killedId = resolveNightKill(state.wolfTargetId, state.doctorProtectId);
  let players = state.players;
  let message: string;
  if (killedId) {
    const victim = state.players.find((p) => p.id === killedId)!;
    players = state.players.map((p) => (p.id === killedId ? { ...p, alive: false } : p));
    message = `Dawn breaks. ${victim.name} was found dead — they were the ${ROLES[victim.role!].label}.`;
  } else {
    message = "Dawn breaks. Miraculously, no one died last night.";
  }
  return appendGameLog(
    { ...state, players, lastNightKilledId: killedId, phase: "dawn", message },
    { phase: "day", label: `Day ${state.nightNumber}`, text: message },
  );
}

function applyWolfTarget(state: RoomState, token: string, targetId: string): RoomState {
  requireAliveRole(state, token, "werewolf", "werewolf");
  if (state.phase !== "night-wolf")
    throw serviceError("WEREWOLF_BAD_PHASE", "Not the wolves' turn.", 409);
  const target = findAliveTarget(state, targetId);
  if (target.role === "werewolf")
    throw serviceError("WEREWOLF_VALIDATION", "The pack can't hunt its own.", 400);

  const next = { ...state, wolfTargetId: targetId };
  if (isRoleAlive(next, "seer"))
    return { ...next, phase: "night-seer", message: "The seer wakes." };
  if (isRoleAlive(next, "doctor"))
    return { ...next, phase: "night-doctor", message: "The doctor wakes." };
  return resolveNightState(next);
}

function applySeerTarget(state: RoomState, token: string, targetId: string): RoomState {
  requireAliveRole(state, token, "seer", "seer");
  if (state.phase !== "night-seer")
    throw serviceError("WEREWOLF_BAD_PHASE", "Not the seer's turn.", 409);
  findAliveTarget(state, targetId);
  return { ...state, seerTargetId: targetId };
}

function applySeerContinue(state: RoomState, token: string): RoomState {
  requireAliveRole(state, token, "seer", "seer");
  if (state.phase !== "night-seer" || !state.seerTargetId) {
    throw serviceError("WEREWOLF_BAD_PHASE", "Inspect someone first.", 409);
  }
  if (isRoleAlive(state, "doctor"))
    return { ...state, phase: "night-doctor", message: "The doctor wakes." };
  return resolveNightState(state);
}

function applyDoctorTarget(state: RoomState, token: string, targetId: string): RoomState {
  requireAliveRole(state, token, "doctor", "doctor");
  if (state.phase !== "night-doctor")
    throw serviceError("WEREWOLF_BAD_PHASE", "Not the doctor's turn.", 409);
  findAliveTarget(state, targetId);
  return resolveNightState({ ...state, doctorProtectId: targetId });
}

function applyDawnContinue(state: RoomState, token: string): RoomState {
  requirePlayer(state, token);
  if (state.phase !== "dawn") throw serviceError("WEREWOLF_BAD_PHASE", "It's not dawn.", 409);

  if (state.lastNightKilledId) {
    const victim = state.players.find((p) => p.id === state.lastNightKilledId);
    if (victim?.role === "hunter") {
      return {
        ...state,
        phase: "hunter-revenge",
        hunterRevengeFor: victim.id,
        hunterOrigin: "night",
        message: `${victim.name} the Hunter takes aim with their final shot.`,
      };
    }
  }
  const winner = roomWinner(state.players);
  if (winner) return finishGame(state, winner);
  return { ...state, phase: "day-discuss", message: "The village gathers to discuss." };
}

function applyHunterTarget(state: RoomState, token: string, targetId: string): RoomState {
  const hunter = requirePlayer(state, token);
  if (state.phase !== "hunter-revenge" || state.hunterRevengeFor !== hunter.id) {
    throw serviceError("WEREWOLF_FORBIDDEN", "It's not your final shot.", 403);
  }
  if (targetId === hunter.id) throw serviceError("WEREWOLF_VALIDATION", "Invalid target.", 400);
  const victim = findAliveTarget(state, targetId);

  const players = state.players.map((p) => (p.id === targetId ? { ...p, alive: false } : p));
  const message = `The Hunter's last shot fells ${victim.name} — they were the ${ROLES[victim.role!].label}.`;
  const withShotLog = appendGameLog(
    { ...state, players, hunterRevengeFor: null, message },
    {
      phase: state.hunterOrigin === "night" ? "night" : "day",
      label: "Hunter's final shot",
      text: message,
    },
  );
  const winner = roomWinner(players);
  if (winner) return finishGame(withShotLog, winner);

  const origin = state.hunterOrigin;
  const next = withShotLog;
  if (origin === "night") return { ...next, phase: "day-discuss" };
  return beginNight(next, state.nightNumber + 1);
}

function applyDiscussContinue(state: RoomState, token: string): RoomState {
  requirePlayer(state, token);
  if (state.phase !== "day-discuss")
    throw serviceError("WEREWOLF_BAD_PHASE", "Not discussion time.", 409);
  return appendGameLog(
    { ...state, phase: "day-vote", votes: {}, message: "Cast your vote." },
    { phase: "day", label: `Day ${state.nightNumber}`, text: "Voting has begun." },
  );
}

function applyVote(state: RoomState, token: string, targetId: string): RoomState {
  const voter = requirePlayer(state, token);
  if (state.phase !== "day-vote") throw serviceError("WEREWOLF_BAD_PHASE", "Not voting time.", 409);
  if (!voter.alive) throw serviceError("WEREWOLF_FORBIDDEN", "The dead don't vote.", 403);
  if (targetId === voter.id)
    throw serviceError("WEREWOLF_VALIDATION", "You can't vote for yourself.", 400);
  findAliveTarget(state, targetId);

  const votes = { ...state.votes, [voter.id]: targetId };
  const aliveIds = state.players.filter((p) => p.alive).map((p) => p.id);
  const allVoted = aliveIds.every((id) => votes[id] !== undefined);
  if (!allVoted)
    return { ...state, votes, message: "Waiting for the rest of the village to vote." };

  const tally = tallyVotes(votes);
  let players = state.players;
  let message: string;
  if (tally.eliminatedId) {
    const victim = state.players.find((p) => p.id === tally.eliminatedId)!;
    players = state.players.map((p) => (p.id === tally.eliminatedId ? { ...p, alive: false } : p));
    message = `The village casts out ${victim.name} — they were the ${ROLES[victim.role!].label}.`;
  } else {
    message = tally.tie
      ? "The vote is tied. No one is cast out."
      : "No votes were cast. No one is cast out.";
  }
  return appendGameLog(
    { ...state, votes, players, dayResult: tally, phase: "day-result", message },
    { phase: "day", label: `Day ${state.nightNumber} result`, text: message },
  );
}

function applyDayResultContinue(state: RoomState, token: string): RoomState {
  requirePlayer(state, token);
  if (state.phase !== "day-result")
    throw serviceError("WEREWOLF_BAD_PHASE", "Not the right time.", 409);

  if (state.dayResult?.eliminatedId) {
    const victim = state.players.find((p) => p.id === state.dayResult!.eliminatedId);
    if (victim?.role === "hunter") {
      return {
        ...state,
        phase: "hunter-revenge",
        hunterRevengeFor: victim.id,
        hunterOrigin: "day",
        message: `${victim.name} the Hunter takes aim with their final shot.`,
      };
    }
  }
  const winner = roomWinner(state.players);
  if (winner) return finishGame(state, winner);
  return beginNight(state, state.nightNumber + 1);
}

function applyPlayAgain(state: RoomState, token: string): RoomState {
  requireHost(state, token);
  const roles = assignRoles(state.players.length);
  const players = state.players.map((p, i) => ({ ...p, role: roles[i], alive: true }));
  return beginNight({
    ...state,
    players,
    gameLog: [],
    wolfTargetId: null,
    doctorProtectId: null,
    seerTargetId: null,
    lastNightKilledId: null,
    hunterRevengeFor: null,
    hunterOrigin: null,
    votes: {},
    dayResult: null,
    winner: null,
  }, 1);
}

function applyNewPlayers(state: RoomState, token: string): RoomState {
  requireHost(state, token);
  const players = state.players.map((p) => ({ ...p, ready: false, role: null, alive: true }));
  return {
    ...state,
    players,
    phase: "lobby",
    nightNumber: 1,
    countdownEndsAt: null,
    wolfTargetId: null,
    doctorProtectId: null,
    seerTargetId: null,
    lastNightKilledId: null,
    hunterRevengeFor: null,
    hunterOrigin: null,
    votes: {},
    dayResult: null,
    winner: null,
    message: "Waiting for the host to start a new game.",
    gameLog: [],
  };
}

const CHAT_LOG_LIMIT = 50;

/** Appends a chat/system entry, capping the stored log so it can't grow unbounded. */
function appendChat(state: RoomState, entry: Omit<ChatEntry, "id" | "at">): RoomState {
  const full: ChatEntry = { ...entry, id: randomUUID(), at: new Date().toISOString() };
  return { ...state, chat: [...state.chat, full].slice(-CHAT_LOG_LIMIT) };
}

function applyChat(state: RoomState, token: string, text: string): RoomState {
  const sender = requirePlayer(state, token);
  const trimmed = text.trim().slice(0, 300);
  if (!trimmed) throw serviceError("WEREWOLF_VALIDATION", "Message can't be empty.", 400);
  return appendChat(state, {
    kind: "player",
    name: sender.name,
    color: sender.color,
    text: trimmed,
  });
}

function applyTransition(state: RoomState, token: string, action: WerewolfAction): RoomState {
  switch (action.type) {
    case "set-ready":
      return applyReady(state, token, action.ready);
    case "wolf-target":
      return applyWolfTarget(state, token, action.targetId);
    case "seer-target":
      return applySeerTarget(state, token, action.targetId);
    case "seer-continue":
      return applySeerContinue(state, token);
    case "doctor-target":
      return applyDoctorTarget(state, token, action.targetId);
    case "dawn-continue":
      return applyDawnContinue(state, token);
    case "hunter-target":
      return applyHunterTarget(state, token, action.targetId);
    case "discuss-continue":
      return applyDiscussContinue(state, token);
    case "vote":
      return applyVote(state, token, action.targetId);
    case "day-result-continue":
      return applyDayResultContinue(state, token);
    case "play-again":
      return applyPlayAgain(state, token);
    case "new-players":
      return applyNewPlayers(state, token);
    case "chat":
      return applyChat(state, token, action.text);
    default:
      throw serviceError("WEREWOLF_VALIDATION", "Unknown action.", 400);
  }
}

// ---- Redaction: the per-viewer public snapshot sent over HTTP ----

function toPublicRoom(state: RoomState, viewerToken: string): PublicRoom {
  const viewer = state.players.find((p) => p.token === viewerToken);
  const isOver = state.phase === "over";
  const gameStarted = state.phase !== "lobby" && state.phase !== "countdown";

  const players: PublicPlayer[] = state.players.map((p) => {
    const revealRole =
      (gameStarted && p.token === viewerToken) ||
      !p.alive ||
      isOver ||
      (gameStarted && viewer?.role === "werewolf" && p.role === "werewolf");
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      avatar: p.avatar,
      alive: p.alive,
      role: revealRole ? p.role : null,
      isYou: p.token === viewerToken,
      isHost: p.token === state.hostToken,
      ready: Boolean(p.ready),
    };
  });

  let seerVision: SeerVision | null = null;
  if (state.phase === "night-seer" && viewer?.role === "seer" && state.seerTargetId) {
    const target = state.players.find((p) => p.id === state.seerTargetId);
    if (target) {
      seerVision = {
        targetId: target.id,
        targetName: target.name,
        isWerewolf: roomSeerInspect(state.players, target.id),
      };
    }
  }

  const aliveIds = state.players.filter((p) => p.alive).map((p) => p.id);
  const votesIn = aliveIds.filter((id) => state.votes[id] !== undefined).length;

  return {
    code: state.code,
    phase: state.phase,
    nightNumber: state.nightNumber,
    countdownEndsAt: state.countdownEndsAt ?? null,
    message: state.message,
    winner: state.winner,
    isHost: viewerToken === state.hostToken,
    you: viewer
      ? { id: viewer.id, role: gameStarted ? viewer.role : null, alive: viewer.alive }
      : null,
    players,
    wolvesRemaining: state.players.filter((p) => p.alive && p.role === "werewolf").length,
    seerVision,
    lastNightKilledId: state.lastNightKilledId,
    hunterRevengeFor: state.hunterRevengeFor,
    dayEliminatedId: state.dayResult?.eliminatedId ?? null,
    voteCounts: state.phase === "day-result" ? (state.dayResult?.counts ?? {}) : null,
    youHaveVoted: viewer ? state.votes[viewer.id] !== undefined : false,
    votesIn,
    votesNeeded: aliveIds.length,
    chat: state.chat,
    gameLog: state.gameLog ?? [],
  };
}

// ---- Public service API (called by the API routes) ----

/** Joinable lobbies, newest first — the browse list on the online landing screen. */
export async function listOpenRooms(): Promise<OpenRoomSummary[]> {
  const recent = await werewolfRoomRepo.listRecent(50);
  return recent
    .filter((state) => state.phase === "lobby" && state.players.length < MAX_PLAYERS)
    .slice(0, 20)
    .map((state) => ({
      code: state.code,
      hostName: state.players.find((p) => p.token === state.hostToken)?.name ?? "Someone",
      playerCount: state.players.length,
      maxPlayers: MAX_PLAYERS,
    }));
}

function requireAvatar(avatar: string | undefined): string {
  if (!avatar || !AVATARS.includes(avatar)) {
    throw serviceError("WEREWOLF_VALIDATION", "Choose a character picture.", 400);
  }
  return avatar;
}

export async function createRoom(
  hostName: string,
  avatar: string | undefined,
): Promise<{ code: string; token: string; view: PublicRoom }> {
  const name = hostName.trim().slice(0, 16);
  if (!name) throw serviceError("WEREWOLF_VALIDATION", "Enter a name.", 400);
  const picked = requireAvatar(avatar);

  const token = randomUUID();
  let code = generateCode();
  for (let attempts = 0; attempts < 5 && (await werewolfRoomRepo.getByCode(code)); attempts++) {
    code = generateCode();
  }

  const state: RoomState = {
    code,
    hostToken: token,
    phase: "lobby",
    nightNumber: 1,
    countdownEndsAt: null,
    players: [
      {
        id: randomUUID(),
        token,
        name,
        color: TOKENS[0],
        avatar: picked,
        ready: false,
        role: null,
        alive: true,
        joinedAt: new Date().toISOString(),
      },
    ],
    wolfTargetId: null,
    doctorProtectId: null,
    seerTargetId: null,
    lastNightKilledId: null,
    hunterRevengeFor: null,
    hunterOrigin: null,
    votes: {},
    dayResult: null,
    winner: null,
    message: "Waiting for players to join.",
    chat: [],
    gameLog: [],
  };
  const withChat = appendChat(state, {
    kind: "system",
    name: null,
    color: null,
    text: `${name} has joined the room.`,
  });
  await werewolfRoomRepo.create(withChat);
  return { code, token, view: toPublicRoom(withChat, token) };
}

export async function joinRoom(
  code: string,
  name: string,
  avatar: string | undefined,
): Promise<{ token: string; view: PublicRoom }> {
  const trimmed = name.trim().slice(0, 16);
  if (!trimmed) throw serviceError("WEREWOLF_VALIDATION", "Enter a name.", 400);
  const picked = requireAvatar(avatar);

  const state = await loadRoom(code);
  if (state.phase !== "lobby")
    throw serviceError("WEREWOLF_BAD_PHASE", "This game has already started.", 409);
  if (state.players.length >= MAX_PLAYERS)
    throw serviceError("WEREWOLF_FULL", "This room is full.", 409);

  const token = randomUUID();
  const player: RoomPlayer = {
    id: randomUUID(),
    token,
    name: trimmed,
    color: TOKENS[state.players.length % TOKENS.length],
    avatar: picked,
    ready: false,
    role: null,
    alive: true,
    joinedAt: new Date().toISOString(),
  };
  const next = appendChat(
    {
      ...state,
      players: [...state.players, player],
      message: `${trimmed} joined the village.`,
    },
    { kind: "system", name: null, color: null, text: `${trimmed} has joined the room.` },
  );
  await werewolfRoomRepo.save(next);
  return { token, view: toPublicRoom(next, token) };
}

export async function getRoomView(code: string, token: string): Promise<PublicRoom> {
  let state = await loadRoom(code);
  requirePlayer(state, token);
  if (
    state.phase === "countdown" &&
    state.countdownEndsAt &&
    Date.parse(state.countdownEndsAt) <= Date.now()
  ) {
    state = beginNight(state, 1);
    await werewolfRoomRepo.save(state);
  }
  return toPublicRoom(state, token);
}

export async function startRoom(code: string, token: string): Promise<PublicRoom> {
  const state = await loadRoom(code);
  requireHost(state, token);
  if (state.phase !== "lobby") throw serviceError("WEREWOLF_BAD_PHASE", "Already started.", 409);
  if (state.players.length < MIN_PLAYERS) {
    throw serviceError(
      "WEREWOLF_VALIDATION",
      `Need at least ${MIN_PLAYERS} players to start.`,
      400,
    );
  }
  if (!state.players.every((p) => Boolean(p.ready))) {
    throw serviceError("WEREWOLF_VALIDATION", "Every player must be ready to start.", 400);
  }
  const roles = assignRoles(state.players.length);
  const players = state.players.map((p, i) => ({ ...p, role: roles[i], alive: true }));
  const countdownEndsAt = new Date(Date.now() + 10_000).toISOString();
  const next = appendGameLog(
    {
      ...state,
      players,
      phase: "countdown",
      countdownEndsAt,
      gameLog: [],
      message: "Everyone is ready. The game begins in 10 seconds.",
    },
    { phase: "night", label: "Game starting", text: "Everyone is ready." },
  );
  await werewolfRoomRepo.save(next);
  return toPublicRoom(next, token);
}

/**
 * Deletes a room. From inside the room (a real token), only the host may
 * delete it. From the open-rooms browse list (no token — the caller hasn't
 * joined), anyone may delete it, but only while it's still an open lobby —
 * that list never shows in-progress games, and this guards the route the
 * same way regardless of who's calling it.
 */
export async function deleteRoom(code: string, token: string | null): Promise<void> {
  const state = await loadRoom(code);
  if (token) {
    requireHost(state, token);
  } else if (state.phase !== "lobby") {
    throw serviceError(
      "WEREWOLF_FORBIDDEN",
      "Only the host can delete a game already in progress.",
      403,
    );
  }
  await werewolfRoomRepo.deleteByCode(state.code);
}

export async function applyRoomAction(
  code: string,
  token: string,
  action: WerewolfAction,
): Promise<PublicRoom> {
  const state = await loadRoom(code);
  requirePlayer(state, token);
  const next = applyTransition(state, token, action);
  await werewolfRoomRepo.save(next);
  return toPublicRoom(next, token);
}
