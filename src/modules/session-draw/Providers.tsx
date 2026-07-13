"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/foundation/ui/components/Toast";
import { GameProvider } from "./state/game-context";

/** Client providers for the game: toasts + API-backed game state. */
export function SessionDrawProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <GameProvider>{children}</GameProvider>
    </ToastProvider>
  );
}
