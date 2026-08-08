import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { ERC20_ABI } from "@/foundation/web3/erc20-abi";
import { HAPPY_COIN_ADDRESS } from "@/foundation/web3/wagmi-config";

const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

const publicClient = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });

function treasuryAccount() {
  const key = process.env.REWARD_TREASURY_PRIVATE_KEY;
  if (!key) return null;
  return privateKeyToAccount(key as `0x${string}`);
}

export interface PayoutResult {
  txHash: string | null;
  error: string | null;
}

/**
 * Transfers `amountTokens` whole HAPPY_COIN units from the server treasury
 * wallet to `to`. Never throws — a payout hiccup must not block mission
 * completion, so failures come back as `{ error }` for the caller to record.
 * Does not wait for confirmation; the tx hash is returned once broadcast.
 */
export async function payoutReward(to: `0x${string}`, amountTokens: number): Promise<PayoutResult> {
  const account = treasuryAccount();
  if (!account) {
    return {
      txHash: null,
      error: "Reward treasury not configured (REWARD_TREASURY_PRIVATE_KEY unset).",
    };
  }
  try {
    const decimals = await publicClient.readContract({
      address: HAPPY_COIN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "decimals",
    });
    const walletClient = createWalletClient({ account, chain: sepolia, transport: http(rpcUrl) });
    const hash = await walletClient.writeContract({
      address: HAPPY_COIN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [to, parseUnits(amountTokens.toString(), decimals)],
    });
    return { txHash: hash, error: null };
  } catch (e) {
    console.error("HAPPY_COIN reward payout failed", e);
    return { txHash: null, error: e instanceof Error ? e.message : "Payout failed." };
  }
}
