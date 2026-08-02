import { cookies } from "next/headers";
import { verifyMessage } from "viem";
import type { AuthResponse, WalletVerifyRequest } from "@/shared";
import { verifyWalletNonceToken } from "@/server/auth/wallet-nonce";
import { SESSION_COOKIE, createSession } from "@/server/auth/session-store";
import { userRepo } from "@/server/repositories";
import { buildSession } from "@/server/services/session-service";
import { handleError, jsonOk } from "@/server/http";
import { serviceError } from "@/server/service-error";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as WalletVerifyRequest | null;
    if (!body?.address || !ADDRESS_RE.test(body.address) || !body.signature || !body.token) {
      throw serviceError("VALIDATION_001", "address, signature, and token are required.", 400);
    }

    const challenge = verifyWalletNonceToken(body.token, "login", body.address);
    if (!challenge) {
      throw serviceError("AUTH_001", "Invalid or expired sign-in request.", 401);
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

    const user = await userRepo.findByWalletAddress(address);
    if (!user) {
      throw serviceError(
        "AUTH_003",
        "No account is linked to this wallet. Log in and link it from your profile first.",
        401,
      );
    }

    const sessionId = createSession(user.id);
    (await cookies()).set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    return jsonOk<AuthResponse>({
      session: buildSession(user.id, user.username, user.walletAddress),
    });
  } catch (e) {
    return handleError(e);
  }
}
