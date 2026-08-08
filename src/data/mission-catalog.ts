import type { Difficulty, MissionFeatureId } from "@/shared";

export interface MissionCatalogEntry {
  featureId: MissionFeatureId;
  feature: string;
  action: string;
  difficulty: Difficulty;
  /** In-app page where the Seeker performs the mission. */
  link: string;
}

/**
 * Mission catalog: one entry per in-app quest type. Difficulty sets the
 * mission time window only (see DIFFICULTY_WINDOW_DAYS). Completion is
 * verified server-side against a real activity signal (see quest-event
 * repo) — "I did it" only succeeds once that activity actually happened.
 */
export const MISSION_CATALOG: readonly MissionCatalogEntry[] = [
  {
    featureId: "play_game",
    feature: "Mini-Games",
    action: "Win a round of Tarot Match",
    difficulty: "easy",
    link: "/game/match",
  },
  {
    featureId: "watch_video",
    feature: "Aster School",
    action: "Watch a video lesson all the way through",
    difficulty: "easy",
    link: "/school",
  },
  {
    featureId: "write_article",
    feature: "Aster School",
    action: "Write and publish an article",
    difficulty: "medium",
    link: "/school/new",
  },
] as const;
