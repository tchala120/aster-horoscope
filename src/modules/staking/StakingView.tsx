"use client";

import { useRouter } from "next/navigation";
import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { BackLink } from "@/foundation/ui/components/BackLink";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { ERC20_ABI } from "@/foundation/web3/erc20-abi";
import { STAKING_ABI } from "@/foundation/web3/staking-abi";
import { HAPPY_COIN_ADDRESS, STAKING_ADDRESS } from "@/foundation/web3/wagmi-config";
import { StakingHero } from "./components/StakingHero";

function formatToken(raw: bigint | undefined, decimals: number): string {
  if (raw === undefined) return "0";
  const value = Number(formatUnits(raw, decimals));
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

/** Public staking landing page: pool stats + hero. "Stake Now" leads to the
 * gated /staking/stake action page — no login required just to look around. */
export function StakingView() {
  const router = useRouter();

  const { data: decimals } = useReadContract({
    address: HAPPY_COIN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
    chainId: sepolia.id,
  });
  const dec = decimals ?? 18;

  const { data: aprBps } = useReadContract({
    address: STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: "aprBps",
    chainId: sepolia.id,
  });
  const { data: lockDuration } = useReadContract({
    address: STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: "lockDuration",
    chainId: sepolia.id,
  });
  const { data: totalStaked } = useReadContract({
    address: STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: "totalStaked",
    chainId: sepolia.id,
  });
  const { data: availableRewardPool } = useReadContract({
    address: STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: "availableRewardPool",
    chainId: sepolia.id,
  });

  return (
    <main className="relative flex flex-1 flex-col">
      <CelestialBackground />

      <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6 sm:p-8">
        <BackLink href="/" />

        <StakingHero
          aprPercent={aprBps !== undefined ? Number(aprBps) / 100 : undefined}
          totalStakedTokens={totalStaked !== undefined ? Number(formatUnits(totalStaked, dec)) : undefined}
          lockDays={lockDuration !== undefined ? Math.round(Number(lockDuration) / 86400) : undefined}
          onStakeClick={() => router.push("/staking/stake")}
        />

        <section className="rounded-3xl bg-grey-900/70 p-6 ring-1 ring-white/8 backdrop-blur-xl">
          <div className="flex items-center justify-between text-text-sm">
            <span className="text-grey-400">Reward pool</span>
            <span className="font-semibold text-grey-100">{formatToken(availableRewardPool, dec)} HP</span>
          </div>
          <p className="mt-4 text-text-sm text-grey-500">
            Rewards are funded from this pool at the fixed APR shown above.
          </p>
        </section>
      </div>
    </main>
  );
}
