"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { HistoryEntry } from "@/shared";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { historyApi } from "./state/api";
import { HistoryRow } from "./components/HistoryRow";

type ViewState =
  | { status: "loading" }
  | { status: "unauth" }
  | { status: "error"; message: string }
  | { status: "ready"; entries: HistoryEntry[] };

/**
 * History page: fetches the signed-in player's own completed-mission records and
 * lists them (card, quest, reward, date). Handles loading, not-logged-in (401),
 * empty, and error states. Auth is enforced server-side by the API.
 */
export function HistoryView() {
  const [state, setState] = useState<ViewState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void historyApi.list().then((res) => {
      if (!active) return;
      if (res.ok) {
        setState({ status: "ready", entries: res.value.entries });
      } else if (res.error.status === 401) {
        setState({ status: "unauth" });
      } else {
        setState({ status: "error", message: res.error.message });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="relative flex flex-1 flex-col">
      <CelestialBackground />

      <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6 sm:p-8">
        <header className="flex flex-col gap-1">
          <Link
            href="/draw"
            className="w-fit text-text-sm font-semibold text-aster-sky-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-sky-400"
          >
            ← Back to draw
          </Link>
          <h1 className="mt-2 text-heading-lg font-bold text-grey-50">Your History</h1>
          <p className="text-text-md text-grey-400">
            Every card you drew, the quest it gave, and the reward you earned.
          </p>
        </header>

        {state.status === "loading" && <p className="text-grey-400">Loading…</p>}

        {state.status === "unauth" && (
          <div className="rounded-2xl bg-grey-gradient p-6 text-center ring-1 ring-white/8">
            <p className="text-text-md text-grey-200">Log in to see your history.</p>
            <Link
              href="/draw"
              className="mt-4 inline-block rounded-full bg-brand-gradient px-6 py-2.5 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105"
            >
              Go to login
            </Link>
          </div>
        )}

        {state.status === "error" && <p className="text-text-md text-red-500">{state.message}</p>}

        {state.status === "ready" &&
          (state.entries.length === 0 ? (
            <div className="rounded-2xl bg-grey-gradient p-8 text-center ring-1 ring-white/8">
              <p className="text-text-lg font-semibold text-grey-100">No history yet</p>
              <p className="mt-1 text-text-md text-grey-400">
                Complete a mission to earn your first reward.
              </p>
              <Link
                href="/draw"
                className="mt-5 inline-block rounded-full bg-brand-gradient px-6 py-2.5 text-text-md font-semibold text-grey-950 transition-transform hover:scale-105"
              >
                Draw a card
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {state.entries.map((entry) => (
                <li key={entry.id}>
                  <HistoryRow entry={entry} />
                </li>
              ))}
            </ul>
          ))}
      </div>
    </main>
  );
}
