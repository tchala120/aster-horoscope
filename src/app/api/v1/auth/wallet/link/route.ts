import { verifyMessage } from "viem";
import type { AuthResponse, WalletVerifyRequest } from "@/shared";
import { verifyWalletNonceToken } from "@/server/auth/wallet-nonce";
import { userRepo } from "@/server/repositories";
import { buildSession } from "@/server/services/session-service";
import { handleError, jsonOk, requireUserId } from "@/server/http";
import { serviceError } from "@/server/service-error";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();

    const body = (await req.json().catch(() => null)) as WalletVerifyRequest | null;
    if (!body?.address || !ADDRESS_RE.test(body.address) || !body.signature || !body.token) {
      throw serviceError("VALIDATION_001", "address, signature, and token are required.", 400);
    }

    const challenge = verifyWalletNonceToken(body.token, "link", body.address);
    if (!challenge || challenge.userId !== userId) {
      throw serviceError("AUTH_001", "Invalid or expired link request.", 401);
    }

    const address = body.address as `0x${string}`;
    const verified = await verifyMessage({
      address,
      message: challenge.message,
      signature: body.signature as `0x${string}`,
    }).catch(() => false);
    if (!verified) {
      throw serviceError("AUTH_001", "Wallet signature verification failed.", 401);
    }

    const existing = await userRepo.findByWalletAddress(address);
    if (existing && existing.id !== userId) {
      throw serviceError(
        "AUTH_004",
        "This wallet is already linked to another account.",
        409,
      );
    }

    const user = await userRepo.setWalletAddress(userId, address);
    return jsonOk<AuthResponse>({
      session: buildSession(user.id, user.username, user.walletAddress),
    });
  } catch (e) {
    return handleError(e);
  }
}
