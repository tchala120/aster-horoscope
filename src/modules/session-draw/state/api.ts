import type {
  AuthRequest,
  AuthResponse,
  DrawResponse,
  MissionAction,
  MissionResponse,
  PickRequest,
  SessionResponse,
} from "@/shared";
import { apiFetch } from "@/foundation/api/client";

/** Typed client for the server-authoritative game API (/api/v1). */
export const gameApi = {
  session: () => apiFetch<AuthResponse>("/auth/session"),
  register: (body: AuthRequest) =>
    apiFetch<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: AuthRequest) =>
    apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  getState: () => apiFetch<SessionResponse>("/sessions/me"),
  draw: () => apiFetch<DrawResponse>("/draws", { method: "POST" }),
  pick: (cardId: string) =>
    apiFetch<MissionResponse>("/missions/pick", {
      method: "POST",
      body: JSON.stringify({ cardId } satisfies PickRequest),
    }),
  missionAction: (id: string, action: MissionAction) =>
    apiFetch<MissionResponse>(`/missions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    }),
};
