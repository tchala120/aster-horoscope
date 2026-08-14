"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  OpenRoomSummary,
  PublicRoom,
  RoomSettings,
  WerewolfAction,
} from "@/modules/werewolf/core/room";
import {
  clearParticipantToken,
  loadParticipantToken,
  saveParticipantToken,
} from "./participant-storage";

const POLL_MS = 2000;
const ROOMS_POLL_MS = 4000;

interface ErrorBody {
  message?: string;
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as (T & ErrorBody) | null;
  if (!res.ok) throw new Error(data?.message ?? "Something went wrong.");
  return data as T;
}

/**
 * Drives an online Werewolf room: create/join, poll the redacted room view
 * every couple seconds, and post actions. The room code lives in the URL
 * (/werewolf/online/[code]); the player's secret token is cached in
 * sessionStorage per code so refreshes resume without sharing one player's identity
 * with every tab in the browser profile.
 */
export function useWerewolfOnline(initialCode?: string) {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(initialCode?.toUpperCase() ?? null);
  // Keep the first client render identical to SSR; the mount effect below restores
  // this tab's participant identity before polling the private room view.
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<PublicRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openRooms, setOpenRooms] = useState<OpenRoomSummary[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const joined = Boolean(code && token);

  // A hard-loaded room page is server-rendered before localStorage exists. Restore the
  // participant token after mount; the room poll below validates it and clears stale tokens.
  useEffect(() => {
    if (!code || token) return;
    const timer = window.setTimeout(() => {
      const saved = loadParticipantToken(code);
      if (saved) setToken(saved);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [code, token]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    stopPolling();
    if (!code || !token) return;

    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(
          `/api/v1/werewolf/rooms/${code}?token=${encodeURIComponent(token!)}`,
        );
        if (res.status === 403) {
          clearParticipantToken(code!);
          if (!cancelled) {
            setToken(null);
            setView(null);
            setError(null);
          }
          return;
        }
        const data = await parseJson<PublicRoom>(res);
        if (!cancelled) {
          setView(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Lost connection to the room.");
      }
    }
    void poll();
    pollRef.current = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [code, token, stopPolling]);

  useEffect(() => {
    if (joined) return;

    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/v1/werewolf/rooms");
        const data = await parseJson<OpenRoomSummary[]>(res);
        if (!cancelled) setOpenRooms(data);
      } catch {
        // Room browsing is best-effort — a failed refresh just keeps the last list.
      } finally {
        if (!cancelled) setRoomsLoading(false);
      }
    }
    void poll();
    const interval = setInterval(poll, ROOMS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [joined]);

  const createGame = useCallback(
    async (roomName: string, name: string, avatar: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/v1/werewolf/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName, name, avatar }),
        });
        const data = await parseJson<{ code: string; token: string; view: PublicRoom }>(res);
        saveParticipantToken(data.code, data.token);
        setCode(data.code);
        setToken(data.token);
        setView(data.view);
        router.push(`/werewolf/online/${data.code}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create a room.");
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  const joinGame = useCallback(
    async (joinCode: string, name: string, avatar: string) => {
      setBusy(true);
      setError(null);
      const upper = joinCode.trim().toUpperCase();
      try {
        const res = await fetch(`/api/v1/werewolf/rooms/${upper}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, avatar }),
        });
        const data = await parseJson<{ token: string; view: PublicRoom }>(res);
        saveParticipantToken(upper, data.token);
        setCode(upper);
        setToken(data.token);
        setView(data.view);
        router.push(`/werewolf/online/${upper}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not join that room.");
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  const start = useCallback(async () => {
    if (!code || !token) return;
    setError(null);
    try {
      const res = await fetch(`/api/v1/werewolf/rooms/${code}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await parseJson<PublicRoom>(res);
      setView(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the game.");
    }
  }, [code, token]);

  const act = useCallback(
    async (action: WerewolfAction) => {
      if (!code || !token) return;
      setError(null);
      try {
        const res = await fetch(`/api/v1/werewolf/rooms/${code}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, action }),
        });
        const data = await parseJson<PublicRoom>(res);
        setView(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "That didn't work — try again.");
      }
    },
    [code, token],
  );

  const leaveRoom = useCallback(() => {
    if (code && token) {
      void fetch(`/api/v1/werewolf/rooms/${code}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        keepalive: true,
      }).catch(() => {});
    }
    if (code) clearParticipantToken(code);
    stopPolling();
    setCode(null);
    setToken(null);
    setView(null);
    setError(null);
    router.push("/werewolf/rooms");
  }, [code, token, router, stopPolling]);

  const deleteRoom = useCallback(async () => {
    if (!code || !token) return;
    setError(null);
    try {
      const res = await fetch(`/api/v1/werewolf/rooms/${code}?token=${encodeURIComponent(token)}`, {
        method: "DELETE",
      });
      await parseJson<{ deleted: true }>(res);
      leaveRoom();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the room.");
    }
  }, [code, token, leaveRoom]);

  /** Delete a room straight from the open-rooms list — no token, since the caller hasn't joined it. */
  const deleteOpenRoom = useCallback(async (roomCode: string) => {
    setOpenRooms((prev) => prev.filter((r) => r.code !== roomCode));
    try {
      const res = await fetch(`/api/v1/werewolf/rooms/${roomCode}`, { method: "DELETE" });
      await parseJson<{ deleted: true }>(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete that room.");
    }
  }, []);

  return {
    code,
    joined,
    view,
    error,
    busy,
    openRooms,
    roomsLoading,
    createGame,
    joinGame,
    start,
    leaveRoom,
    deleteRoom,
    deleteOpenRoom,
    setReady: (ready: boolean) => act({ type: "set-ready", ready }),
    chooseWolfTarget: (targetId: string) => act({ type: "wolf-target", targetId }),
    chooseSeerTarget: (targetId: string) => act({ type: "seer-target", targetId }),
    continueSeer: () => act({ type: "seer-continue" }),
    chooseDoctorTarget: (targetId: string) => act({ type: "doctor-target", targetId }),
    continueDawn: () => act({ type: "dawn-continue" }),
    chooseHunterTarget: (targetId: string) => act({ type: "hunter-target", targetId }),
    continueDiscuss: () => act({ type: "discuss-continue" }),
    castVote: (targetId: string) => act({ type: "vote", targetId }),
    castRunoffVote: (vote: boolean) => act({ type: "runoff-vote", vote }),
    continueDayResult: () => act({ type: "day-result-continue" }),
    playAgain: () => act({ type: "play-again" }),
    newPlayers: () => act({ type: "new-players" }),
    sendChat: (text: string) => act({ type: "chat", text }),
    sendWolfChat: (text: string) => act({ type: "wolf-chat", text }),
    kickPlayer: (playerId: string) => act({ type: "kick", playerId }),
    updateSettings: (settings: Partial<RoomSettings>) => act({ type: "update-settings", settings }),
  };
}
