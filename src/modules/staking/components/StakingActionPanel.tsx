"use client";

import { useEffect, useState } from "react";
import { waitForTransactionReceipt } from "@wagmi/core";
import { formatUnits, parseUnits } from "viem";
import { useConnect, useConnection, useConnectors, useReadContract, useWriteContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { ERC20_ABI } from "@/foundation/web3/erc20-abi";
import { STAKING_ABI } from "@/foundation/web3/staking-abi";
import { HAPPY_COIN_ADDRESS, STAKING_ADDRESS, wagmiConfig } from "@/foundation/web3/wagmi-config";
import { TransactionOverlay, type TxAction, type TxPhase } from "./TransactionOverlay";

type Action = TxAction;

function formatToken(raw: bigint | undefined, decimals: number): string {
  if (raw === undefined) return "0";
  const value = Number(formatUnits(raw, decimals));
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function parseAmount(input: string, decimals: number): bigint | null {
  if (!input || Number(input) <= 0) return null;
  try {
    const amount = parseUnits(input, decimals);
    return amount > BigInt(0) ? amount : null;
  } catch {
    return null;
  }
}

function formatCountdown(unlockTime: bigint, nowMs: number): string {
  const remaining = Number(unlockTime) - Math.floor(nowMs / 1000);
  if (remaining <= 0) return "Unlocked";
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

/** A pill input row: amount field + "Max" shortcut. */
function AmountField({
  value,
  onChange,
  onMax,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onMax: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-grey-950/70 px-4 ring-1 ring-white/12 transition-shadow focus-within:ring-2 focus-within:ring-aster-teal-400">
      <input
        type="number"
        min="0"
        step="any"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.0"
        disabled={disabled}
        className="w-full bg-transparent py-3 text-text-md text-grey-50 placeholder:text-grey-500 focus:outline-none disabled:opacity-60"
      />
      <button
        type="button"
        onClick={onMax}
        disabled={disabled}
        className="shrink-0 rounded-full bg-white/8 px-3 py-1 text-text-sm font-semibold text-grey-200 transition-colors hover:bg-white/16 disabled:opacity-50"
      >
        Max
      </button>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-text-sm">
      <span className="text-grey-400">{label}</span>
      <span className="font-semibold text-grey-100">{value}</span>
    </div>
  );
}

/** Standard fixed-APR staking actions: connect, stake, view position, claim, withdraw, exit. */
export function StakingActionPanel() {
  const connectors = useConnectors();
  const { address, isConnected } = useConnection();
  const { connectAsync } = useConnect();
  const { writeContractAsync } = useWriteContract();

  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [txPhase, setTxPhase] = useState<TxPhase>("sign");
  const [error, setError] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const account = address;

  // Start null so server and first client render match (avoids hydration mismatch);
  // established client-side after mount, matching the app's Countdown component.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const { data: decimals } = useReadContract({
    address: HAPPY_COIN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
    chainId: sepolia.id,
  });
  const dec = decimals ?? 18;

  const { data: walletBalance, refetch: refetchWalletBalance } = useReadContract({
    address: HAPPY_COIN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    chainId: sepolia.id,
    query: { enabled: Boolean(account) },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: HAPPY_COIN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: account ? [account, STAKING_ADDRESS] : undefined,
    chainId: sepolia.id,
    query: { enabled: Boolean(account) },
  });

  const { data: stakeInfo, refetch: refetchStakeInfo } = useReadContract({
    address: STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: "stakes",
    args: account ? [account] : undefined,
    chainId: sepolia.id,
    query: { enabled: Boolean(account) },
  });

  const { data: pendingRewards, refetch: refetchPendingRewards } = useReadContract({
    address: STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: "pendingRewards",
    args: account ? [account] : undefined,
    chainId: sepolia.id,
    query: { enabled: Boolean(account) },
  });

  const [stakedAmount, , , unlockTime] = stakeInfo ?? [BigInt(0), BigInt(0), BigInt(0), BigInt(0)];
  // Conservative until the client clock is established: treat as locked so
  // withdraw controls don't briefly flash enabled before `now` is set.
  const unlocked = now !== null && (unlockTime === BigInt(0) || Number(unlockTime) * 1000 <= now);
  const hasAllowance =
    allowance !== undefined && stakeAmount !== "" && allowance >= (parseAmount(stakeAmount, dec) ?? BigInt(0));

  const refetchAll = async () => {
    await Promise.all([refetchWalletBalance(), refetchAllowance(), refetchStakeInfo(), refetchPendingRewards()]);
  };

  const runTx = async (action: Action, fn: () => Promise<`0x${string}`>) => {
    setError(null);
    setPendingAction(action);
    setTxPhase("sign");
    try {
      const hash = await fn();
      setTxPhase("confirm");
      await waitForTransactionReceipt(wagmiConfig, { hash });
      await refetchAll();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed or was rejected.");
      return false;
    } finally {
      setPendingAction(null);
    }
  };

  const handleConnect = async () => {
    setError(null);
    const connector = connectors[0];
    if (!connector) {
      setError("No browser wallet found. Install MetaMask or another injected wallet.");
      return;
    }
    try {
      await connectAsync({ connector });
    } catch {
      setError("Wallet connection was rejected.");
    }
  };

  const handleApprove = () => {
    const amount = parseAmount(stakeAmount, dec);
    if (amount === null) return setError("Enter a valid amount.");
    void runTx("approve", () =>
      writeContractAsync({
        address: HAPPY_COIN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [STAKING_ADDRESS, amount],
      }),
    );
  };

  const handleStake = async () => {
    const amount = parseAmount(stakeAmount, dec);
    if (amount === null) return setError("Enter a valid amount.");
    const ok = await runTx("stake", () =>
      writeContractAsync({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: "stake",
        args: [amount],
      }),
    );
    if (ok) setStakeAmount("");
  };

  const handleWithdraw = async () => {
    const amount = parseAmount(withdrawAmount, dec);
    if (amount === null) return setError("Enter a valid amount.");
    if (amount > stakedAmount) return setError("Amount exceeds your staked balance.");
    const ok = await runTx("withdraw", () =>
      writeContractAsync({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: "withdraw",
        args: [amount],
      }),
    );
    if (ok) setWithdrawAmount("");
  };

  const handleClaim = () => {
    void runTx("claim", () =>
      writeContractAsync({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: "claimRewards",
      }),
    );
  };

  const handleExit = () => {
    void runTx("exit", () =>
      writeContractAsync({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: "exit",
      }),
    );
  };

  const handleEmergencyWithdraw = () => {
    if (!window.confirm("This withdraws your stake immediately but forfeits all pending rewards. Continue?")) {
      return;
    }
    void runTx("emergency", () =>
      writeContractAsync({
        address: STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: "emergencyWithdraw",
      }),
    );
  };

  const busy = pendingAction !== null;

  return (
    <div className="flex flex-col gap-6">
      <TransactionOverlay action={pendingAction} phase={txPhase} />

      {!isConnected || !account ? (
        <section className="rounded-3xl bg-grey-900/70 p-6 text-center ring-1 ring-white/8 backdrop-blur-xl">
          <p className="text-text-md text-grey-300">Connect a wallet to stake HP.</p>
          <button
            type="button"
            onClick={() => void handleConnect()}
            className="mt-4 w-full rounded-full bg-brand-gradient px-6 py-3.5 text-text-md font-semibold text-grey-950 shadow-lg transition-transform hover:scale-[1.02]"
          >
            Connect Wallet
          </button>
        </section>
      ) : (
        <>
          {/* Stake */}
          <section className="rounded-3xl bg-grey-900/70 p-6 ring-1 ring-white/8 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-text-md font-semibold text-grey-100">Stake</h2>
              <span className="text-text-sm text-grey-400">Balance: {formatToken(walletBalance, dec)} HP</span>
            </div>
            <div className="mt-4">
              <AmountField
                value={stakeAmount}
                onChange={setStakeAmount}
                onMax={() => setStakeAmount(formatUnits(walletBalance ?? BigInt(0), dec))}
                disabled={busy}
              />
            </div>
            <button
              type="button"
              onClick={() => void (hasAllowance ? handleStake() : handleApprove())}
              disabled={busy || !stakeAmount}
              className="mt-4 w-full rounded-full bg-brand-gradient px-6 py-3.5 text-text-md font-semibold text-grey-950 shadow-lg transition-transform enabled:hover:scale-[1.02] disabled:opacity-60"
            >
              {pendingAction === "approve"
                ? "Approving…"
                : pendingAction === "stake"
                  ? "Staking…"
                  : hasAllowance
                    ? "Stake"
                    : "Approve"}
            </button>
          </section>

          {/* Your position */}
          <section className="rounded-3xl bg-grey-900/70 p-6 ring-1 ring-white/8 backdrop-blur-xl">
            <h2 className="text-text-md font-semibold text-grey-100">Your position</h2>
            <div className="mt-4 flex flex-col gap-2.5">
              <StatRow label="Staked" value={`${formatToken(stakedAmount, dec)} HP`} />
              <StatRow
                label="Unlock"
                value={stakedAmount > BigInt(0) && now !== null ? formatCountdown(unlockTime, now) : "—"}
              />
              <StatRow label="Pending rewards" value={`${formatToken(pendingRewards, dec)} HP`} />
            </div>

            <button
              type="button"
              onClick={handleClaim}
              disabled={busy || !pendingRewards}
              className="mt-4 w-full rounded-full px-6 py-3 text-text-md font-semibold text-grey-50 ring-1 ring-white/16 transition-colors enabled:hover:bg-white/8 disabled:opacity-50"
            >
              {pendingAction === "claim" ? "Claiming…" : "Claim rewards"}
            </button>

            {stakedAmount > BigInt(0) && (
              <>
                <div className="my-5 h-px bg-white/8" />
                <div className="flex items-center justify-between">
                  <span className="text-text-sm text-grey-400">Withdraw</span>
                  {!unlocked && now !== null && (
                    <span className="text-text-sm text-grey-500">{formatCountdown(unlockTime, now)}</span>
                  )}
                </div>
                <div className="mt-2">
                  <AmountField
                    value={withdrawAmount}
                    onChange={setWithdrawAmount}
                    onMax={() => setWithdrawAmount(formatUnits(stakedAmount, dec))}
                    disabled={busy || !unlocked}
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleWithdraw()}
                    disabled={busy || !unlocked || !withdrawAmount}
                    className="flex-1 rounded-full px-6 py-3 text-text-md font-semibold text-grey-50 ring-1 ring-white/16 transition-colors enabled:hover:bg-white/8 disabled:opacity-50"
                  >
                    {pendingAction === "withdraw" ? "Withdrawing…" : "Withdraw"}
                  </button>
                  <button
                    type="button"
                    onClick={handleExit}
                    disabled={busy || !unlocked}
                    className="flex-1 rounded-full px-6 py-3 text-text-md font-semibold text-grey-50 ring-1 ring-white/16 transition-colors enabled:hover:bg-white/8 disabled:opacity-50"
                  >
                    {pendingAction === "exit" ? "Exiting…" : "Exit all"}
                  </button>
                </div>

                {!unlocked && (
                  <button
                    type="button"
                    onClick={handleEmergencyWithdraw}
                    disabled={busy}
                    className="mt-3 w-full rounded-full px-6 py-2.5 text-text-sm font-medium text-red-400 transition-colors enabled:hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {pendingAction === "emergency" ? "Withdrawing…" : "Emergency withdraw (forfeits pending rewards)"}
                  </button>
                )}
              </>
            )}
          </section>
        </>
      )}

      {error ? <p className="text-center text-text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
