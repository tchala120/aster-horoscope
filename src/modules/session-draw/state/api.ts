import type {
  AuthRequest,
  AuthResponse,
  DrawResponse,
  MissionAction,
  MissionResponse,
  PickRequest,
  SessionResponse,
  WalletNonceRequest,
  WalletNonceResponse,
  WalletVerifyRequest,
} from "@/shared";
import { apiFetch } from "@/foundation/api/client";

/** Typed client for the server-authoritative game API (/api/v1). */
export const gameApi = {
  session: () => apiFetch<AuthResponse>("/auth/session"),
  login: (body: AuthRequest) =>
    apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  walletNonce: (body: WalletNonceRequest) =>
    apiFetch<WalletNonceResponse>("/auth/wallet/nonce", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  walletLogin: (body: WalletVerifyRequest) =>
    apiFetch<AuthResponse>("/auth/wallet/login", { method: "POST", body: JSON.stringify(body) }),
  walletLink: (body: WalletVerifyRequest) =>
    apiFetch<AuthResponse>("/auth/wallet/link", { method: "POST", body: JSON.stringify(body) }),
  walletUnlink: () => apiFetch<{ ok: boolean }>("/auth/wallet", { method: "DELETE" }),
  getState: () => apiFetch<SessionResponse>("/sessions/me"),
  draw: () => apiFetch<DrawResponse>("/draws", { method: "POST" }),
  reroll: () => apiFetch<DrawResponse>("/draws/reroll", { method: "POST" }),
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
