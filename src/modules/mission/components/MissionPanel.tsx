"use client";

import type { Mission } from "@/shared";
import { Countdown } from "@/foundation/ui/components/Countdown";
import { MISSION_CATALOG } from "@/data/mission-catalog";

interface MissionPanelProps {
  mission: Mission;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onComplete: (id: string) => void;
}

const difficultyLabel: Record<Mission["difficulty"], string> = {
  easy: "Easy · within a day",
  medium: "Medium · 2-3 days",
  hard: "Hard · 1 week",
};

/** Presentational mission card: assigned → accept/reject; active → complete + deadline. */
export function MissionPanel({ mission, onAccept, onReject, onComplete }: MissionPanelProps) {
  const entry = MISSION_CATALOG.find((e) => e.featureId === mission.featureRef);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="w-full max-w-md rounded-2xl bg-grey-gradient p-8 ring-1 ring-white/8">
        <p className="text-text-sm font-semibold uppercase tracking-widest text-aster-teal-400">
          {difficultyLabel[mission.difficulty]}
        </p>
        <h2 className="mt-2 text-heading-lg font-bold text-grey-50">{entry?.feature ?? "Mission"}</h2>
        <p className="mt-3 text-text-md text-grey-300">{entry?.action ?? "Complete your mission."}</p>

        {mission.status === "active" && mission.deadline ? (
          <p className="mt-4 text-text-sm text-grey-400">
            Time remaining: <Countdown targetIso={mission.deadline} />
          </p>
        ) : null}

        <div className="mt-6 flex gap-3">
          {mission.status === "assigned" ? (
            <>
              <button
                type="button"
                onClick={() => onAccept(mission.id)}
                className="flex-1 rounded-full bg-brand-gradient px-5 py-2.5 text-text-md font-semibold text-grey-950 transition-transform hover:scale-[1.02]"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => onReject(mission.id)}
                className="flex-1 rounded-full px-5 py-2.5 text-text-md font-semibold text-grey-200 ring-1 ring-white/16 hover:bg-white/8"
              >
                Reject
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onComplete(mission.id)}
              className="flex-1 rounded-full bg-brand-gradient px-5 py-2.5 text-text-md font-semibold text-grey-950 transition-transform hover:scale-[1.02]"
            >
              I did it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
