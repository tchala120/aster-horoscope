"use client";

import Link from "next/link";
import { BackLink } from "@/foundation/ui/components/BackLink";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { useGame } from "@/modules/session-draw/state/game-context";
import { StakingActionPanel } from "./components/StakingActionPanel";
import { TechCard } from "./components/TechCard";

/** Gated staking action page: connect a wallet, stake, view position, claim,
 * withdraw, exit. Reached from the /staking landing page's "Stake Now" CTA. */
export function StakeView() {
  const game = useGame();

  return (
    <main className="relative flex flex-1 flex-col">
      <CelestialBackground />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 p-6 sm:p-8">
        <header className="flex flex-col gap-1">
          <BackLink href="/staking" />
          <h1 className="mt-2 text-heading-lg font-bold text-grey-50">Stake HP</h1>
          <p className="text-text-md text-grey-400">Lock HP and earn a fixed APR.</p>
        </header>

        {game.status === "loading" && <p className="text-grey-400">Loading…</p>}

        {game.status === "anon" && (
          <TechCard className="p-6 text-center">
            <p className="text-text-md text-grey-200">Log in to stake.</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-full bg-brand-gradient px-6 py-2.5 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105"
            >
              Go to login
            </Link>
          </TechCard>
        )}

        {game.status === "authed" && <StakingActionPanel />}
      </div>
    </main>
  );
}
