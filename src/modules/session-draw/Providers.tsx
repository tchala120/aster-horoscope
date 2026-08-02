"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { ToastProvider } from "@/foundation/ui/components/Toast";
import { wagmiConfig } from "@/foundation/web3/wagmi-config";
import { GameProvider } from "./state/game-context";

/** Client providers for the game: wallet connection, toasts, API-backed game state. */
export function SessionDrawProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <GameProvider>{children}</GameProvider>
        </ToastProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
