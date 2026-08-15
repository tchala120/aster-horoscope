"use client";

import { useEffect, useState } from "react";
import type { AuthResponse } from "@/shared";
import { setParticipantStorageOwner } from "./participant-storage";

/** Resolves the current login before any browser-persisted Werewolf identity is read. */
export function useWerewolfStorageOwner(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveOwner() {
      let userId: string | null = null;
      try {
        const res = await fetch("/api/v1/auth/session", { credentials: "include" });
        if (res.ok) {
          const body = (await res.json()) as AuthResponse;
          userId = body.session.userId;
        } else if (res.status !== 401) {
          return;
        }
      } catch {
        // Fail closed: do not expose any storage scope when identity is unknown.
        return;
      }

      if (!cancelled) {
        setParticipantStorageOwner(userId);
        setReady(true);
      }
    }

    void resolveOwner();
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
