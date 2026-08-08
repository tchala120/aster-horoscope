"use client";

import Image from "next/image";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { ERC20_ABI } from "@/foundation/web3/erc20-abi";
import { HAPPY_COIN_ADDRESS } from "@/foundation/web3/wagmi-config";

interface CoinBalanceChipProps {
  /** The wallet address to read the token balance for. */
  address: string;
}

function formatBalance(raw: bigint, decimals: number): string {
  const value = Number(formatUnits(raw, decimals));
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={spinning ? "animate-spin" : undefined}
    >
      <path
        d="M16.5 10a6.5 6.5 0 1 1-2.06-4.74M16.5 3.5v4h-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Coin icon + on-chain token balance, shown next to the profile chip for linked wallets. */
export function CoinBalanceChip({ address }: CoinBalanceChipProps) {
  const account = address as `0x${string}`;

  const {
    data: balance,
    isLoading,
    isFetching,
    isError: isBalanceError,
    refetch,
  } = useReadContract({
    address: HAPPY_COIN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account],
    chainId: sepolia.id,
  });
  const {
    data: decimals,
    isError: isDecimalsError,
    refetch: refetchDecimals,
  } = useReadContract({
    address: HAPPY_COIN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
    chainId: sepolia.id,
  });

  const hasError = isBalanceError || isDecimalsError;

  return (
    <div
      title={hasError ? "Couldn't load balance — tap refresh to retry" : "Happy Coin balance"}
      className="flex items-center gap-1.5 rounded-full bg-grey-900/70 py-1 pl-1 pr-1.5 ring-1 ring-white/8 backdrop-blur"
    >
      <Image
        src="/tokens/happy.png"
        alt=""
        width={34}
        height={34}
        className="h-[34px] w-[34px] shrink-0"
      />
      <span className={`text-text-sm font-semibold ${hasError ? "text-red-400" : "text-grey-100"}`}>
        {hasError
          ? "—"
          : isLoading || balance === undefined
            ? "…"
            : formatBalance(balance, decimals ?? 18)}
      </span>
      <button
        type="button"
        onClick={() => {
          void refetch();
          void refetchDecimals();
        }}
        disabled={isFetching}
        aria-label="Refresh balance"
        className="shrink-0 rounded-full p-1 text-grey-400 transition-colors hover:text-grey-200 disabled:opacity-50 focus:outline-none focus-visible:text-aster-teal-300"
      >
        <RefreshIcon spinning={isFetching} />
      </button>
    </div>
  );
}
