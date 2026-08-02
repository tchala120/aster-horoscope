import type { WalletNonceRequest, WalletNonceResponse } from "@/shared";
import { createWalletNonce } from "@/server/auth/wallet-nonce";
import { requireUserId, handleError, jsonOk } from "@/server/http";
import { serviceError } from "@/server/service-error";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as WalletNonceRequest | null;
    if (!body?.address || !ADDRESS_RE.test(body.address)) {
      throw serviceError("VALIDATION_001", "A valid wallet address is required.", 400);
    }
    if (body.purpose !== "login" && body.purpose !== "link") {
      throw serviceError("VALIDATION_001", "purpose must be \"login\" or \"link\".", 400);
    }

    // Linking requires proving who's asking; login is open (identity comes
    // from whichever account the wallet turns out to be linked to).
    const userId = body.purpose === "link" ? await requireUserId() : undefined;

    const { token, message } = createWalletNonce(body.address, body.purpose, userId);
    return jsonOk<WalletNonceResponse>({ token, message });
  } catch (e) {
    return handleError(e);
  }
}
