import type { MatchScoresResponse, SubmitMatchScoreRequest } from "@/shared";
import { apiFetch } from "@/foundation/api/client";

/** Client for the Tarot Match ranking board (/api/v1/match/scores). */
export const leaderboardApi = {
  /** Top ranking entries (fewest moves first). Public. */
  top: () => apiFetch<MatchScoresResponse>("/match/scores"),
  /** Record the signed-in player's completed game; returns the refreshed board. */
  submit: (moves: number) =>
    apiFetch<MatchScoresResponse>("/match/scores", {
      method: "POST",
      body: JSON.stringify({ moves } satisfies SubmitMatchScoreRequest),
    }),
};
