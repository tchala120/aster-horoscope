"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicRoom } from "@/modules/werewolf/core/room";
import {
  clearParticipantToken,
  getKnownRoomCodes,
  loadParticipantToken,
} from "./participant-storage";
import { useWerewolfStorageOwner } from "./use-werewolf-storage-owner";

export interface KnownRoom {
  code: string;
  roomName: string;
  phase: PublicRoom["phase"];
  playerCount: number;
  isHost: boolean;
}

/**
 * Resolves every room this browser still holds a valid token for, across ALL phases —
 * not just the lobby-phase rooms the public open-rooms list shows. Lets the landing page
 * offer a "Continue Game" button and the room browser surface an in-progress game that
 * the public list would otherwise hide entirely once it leaves the lobby.
 */
export function useKnownWerewolfRooms(): {
  rooms: KnownRoom[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [rooms, setRooms] = useState<KnownRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const storageReady = useWerewolfStorageOwner();

  const refresh = useCallback(async () => {
      const codes = getKnownRoomCodes();
      const results = await Promise.all(
        codes.map(async (code): Promise<KnownRoom | null> => {
          const token = loadParticipantToken(code);
          if (!token) return null;
          try {
            const res = await fetch(
              `/api/v1/werewolf/rooms/${code}?token=${encodeURIComponent(token)}`,
            );
            if (!res.ok) {
              if (res.status === 403 || res.status === 404) clearParticipantToken(code);
              return null;
            }
            const view = (await res.json()) as PublicRoom;
            return {
              code: view.code,
              roomName: view.roomName,
              phase: view.phase,
              playerCount: view.players.length,
              isHost: view.isHost,
            };
          } catch {
            return null;
          }
        }),
      );
      setRooms(results.filter((r): r is KnownRoom => r !== null));
      setLoading(false);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh, storageReady]);

  return { rooms, loading, refresh };
}
