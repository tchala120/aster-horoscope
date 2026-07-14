"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthRequest, DailyState, Mission, SeekerSession } from "@/shared";
import { gameApi } from "./api";

type Status = "loading" | "authed" | "anon";

interface GameState {
  status: Status;
  session: SeekerSession | null;
  daily: DailyState | null;
  activeMission: Mission | null;
  /** Just-picked, not-yet-accepted mission awaiting accept/reject. */
  pendingMission: Mission | null;
  error: string | null;
}

interface GameContextValue extends GameState {
  register: (creds: AuthRequest) => Promise<boolean>;
  login: (creds: AuthRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  draw: () => Promise<void>;
  /** Reshuffle today's spread during selection (does not consume a new day). */
  reroll: () => Promise<void>;
  pick: (cardId: string) => Promise<void>;
  accept: (missionId: string) => Promise<boolean>;
  reject: (missionId: string) => Promise<boolean>;
  /** Resolves true when the mission was completed server-side. */
  complete: (missionId: string) => Promise<boolean>;
}

const GameContext = createContext<GameContextValue | null>(null);

const initialState: GameState = {
  status: "loading",
  session: null,
  daily: null,
  activeMission: null,
  pendingMission: null,
  error: null,
};

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(initialState);

  const loadState = useCallback(async () => {
    const res = await gameApi.getState();
    if (res.ok) {
      setState({
        status: "authed",
        session: res.value.session,
        daily: res.value.daily,
        activeMission: res.value.activeMission,
        pendingMission: null,
        error: null,
      });
    } else {
      setState((s) => ({ ...s, status: "anon", session: null, daily: null }));
    }
  }, []);

  useEffect(() => {
    // Load server state on mount; setState occurs after the awaited fetch (async),
    // not synchronously — this is the intended data-fetch-on-mount effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadState();
  }, [loadState]);

  const authenticate = useCallback(
    async (creds: AuthRequest, mode: "login" | "register") => {
      const res = mode === "login" ? await gameApi.login(creds) : await gameApi.register(creds);
      if (!res.ok) {
        setState((s) => ({ ...s, error: res.error.message }));
        return false;
      }
      await loadState();
      return true;
    },
    [loadState],
  );

  const draw = useCallback(async () => {
    const res = await gameApi.draw();
    if (res.ok) setState((s) => ({ ...s, daily: res.value.daily, error: null }));
    else setState((s) => ({ ...s, error: res.error.message }));
  }, []);

  const reroll = useCallback(async () => {
    const res = await gameApi.reroll();
    if (res.ok) setState((s) => ({ ...s, daily: res.value.daily, error: null }));
    else setState((s) => ({ ...s, error: res.error.message }));
  }, []);

  const pick = useCallback(async (cardId: string) => {
    const res = await gameApi.pick(cardId);
    if (res.ok)
      setState((s) => ({ ...s, daily: res.value.daily, pendingMission: res.value.mission, error: null }));
    else setState((s) => ({ ...s, error: res.error.message }));
  }, []);

  const runAction = useCallback(
    async (
      missionId: string,
      action: "accept" | "reject" | "complete",
    ): Promise<boolean> => {
      const res = await gameApi.missionAction(missionId, action);
      if (!res.ok) {
        setState((s) => ({ ...s, error: res.error.message }));
        // A failed complete (e.g. expired) still changes server state — reload.
        if (action === "complete") await loadState();
        return false;
      }
      setState((s) => ({
        ...s,
        daily: res.value.daily,
        activeMission: action === "accept" ? res.value.mission : null,
        pendingMission: null,
        error: null,
      }));
      return true;
    },
    [loadState],
  );

  const value = useMemo<GameContextValue>(
    () => ({
      ...state,
      register: (creds) => authenticate(creds, "register"),
      login: (creds) => authenticate(creds, "login"),
      logout: async () => {
        await gameApi.logout();
        setState({ ...initialState, status: "anon" });
      },
      draw,
      reroll,
      pick,
      accept: (id) => runAction(id, "accept"),
      reject: (id) => runAction(id, "reject"),
      complete: (id) => runAction(id, "complete"),
    }),
    [state, authenticate, draw, reroll, pick, runAction],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
