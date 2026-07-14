"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useToast } from "@/foundation/ui/components/Toast";
import { MissionPanel } from "@/modules/mission/components/MissionPanel";
import { getCardById } from "@/data/deck";
import { canDraw, nextResetAt } from "./core/draw-service";
import { DailyDrawScreen } from "./components/DailyDrawScreen";
import { CardRevealScreen } from "./components/CardRevealScreen";
import { AuthPanel } from "./components/AuthPanel";
import { useGame } from "./state/game-context";

/**
 * Wiring layer: connects the API-backed game context to presentational screens.
 * Auth-gated (login required); no localStorage.
 */
export function DailyDrawContainer() {
  const reduced = useReducedMotion() ?? false;
  const game = useGame();
  const { notify } = useToast();

  // After the mission is completed ("I did it"), reveal the picked card's
  // artwork. Set optimistically on tap and reverted if completion fails.
  const [revealedCardId, setRevealedCardId] = useState<string | null>(null);

  useEffect(() => {
    if (game.error) notify(game.error, "error");
  }, [game.error, notify]);

  if (game.status === "loading") {
    return <p className="flex flex-1 items-center justify-center text-grey-400">Loading…</p>;
  }

  if (game.status === "anon" || !game.daily) {
    return (
      <AuthPanel
        error={game.error}
        onSubmit={(mode, creds) =>
          void (mode === "login" ? game.login(creds) : game.register(creds))
        }
      />
    );
  }

  if (revealedCardId) {
    return (
      <CardRevealScreen
        card={getCardById(revealedCardId)}
        reducedMotion={reduced}
        onDone={() => setRevealedCardId(null)}
      />
    );
  }

  const mission = game.pendingMission ?? game.activeMission;
  if (mission) {
    return (
      <MissionPanel
        mission={mission}
        onAccept={(id) => void game.accept(id)}
        onReject={(id) => void game.reject(id)}
        onComplete={(id) => {
          // Reveal the picked card on completion; revert if the server rejects it.
          const cardId = mission.cardRef;
          setRevealedCardId(cardId);
          void game.complete(id).then((ok) => {
            if (!ok) setRevealedCardId(null);
          });
        }}
      />
    );
  }

  const now = new Date();
  return (
    <DailyDrawScreen
      spread={game.daily.spread}
      drawable={canDraw(game.daily, now)}
      resetAt={nextResetAt(now)}
      reducedMotion={reduced}
      onDraw={() => void game.draw()}
      onPick={(cardId) => void game.pick(cardId)}
    />
  );
}
