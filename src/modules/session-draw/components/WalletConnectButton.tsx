"use client";

import { useState } from "react";
import { useConnect, useConnection, useConnectors, useSignMessage } from "wagmi";
import type { WalletVerifyRequest } from "@/shared";
import { gameApi } from "../state/api";

interface WalletConnectButtonProps {
  purpose: "login" | "link";
  onVerified: (payload: WalletVerifyRequest) => Promise<unknown>;
  label: string;
  className?: string;
}

/**
 * Connects an injected EVM wallet (MetaMask, Rabby, etc.), requests a
 * sign-message challenge, has the wallet sign it, and hands the signed
 * payload to the caller — used for both wallet login and linking a wallet
 * to the current account.
 */
export function WalletConnectButton({
  purpose,
  onVerified,
  label,
  className,
}: WalletConnectButtonProps) {
  const connectors = useConnectors();
  const { address, isConnected } = useConnection();
  const { connectAsync } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      let walletAddress = address;
      if (!isConnected || !walletAddress) {
        const connector = connectors[0];
        if (!connector) {
          setError("No browser wallet found. Install MetaMask or another injected wallet.");
          return;
        }
        const result = await connectAsync({ connector });
        walletAddress = result.accounts[0];
      }
      if (!walletAddress) {
        setError("No wallet address available.");
        return;
      }

      const nonceRes = await gameApi.walletNonce({ address: walletAddress, purpose });
      if (!nonceRes.ok) {
        setError(nonceRes.error.message);
        return;
      }

      const signature = await signMessageAsync({ message: nonceRes.value.message });
      await onVerified({ address: walletAddress, signature, token: nonceRes.value.token });
    } catch {
      setError("Wallet request was rejected or failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className={
          className ??
          "w-full rounded-full px-6 py-3.5 text-text-md font-semibold text-grey-50 ring-1 ring-white/16 transition-colors enabled:hover:bg-white/8 disabled:opacity-60"
        }
      >
        {busy ? "Waiting for wallet…" : label}
      </button>
      {error ? <p className="mt-2 text-center text-text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
