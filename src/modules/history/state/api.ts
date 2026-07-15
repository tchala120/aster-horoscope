import type { HistoryResponse } from "@/shared";
import { apiFetch } from "@/foundation/api/client";

/** Typed client for the history API (the current user's own completed missions). */
export const historyApi = {
  list: () => apiFetch<HistoryResponse>("/history"),
};
