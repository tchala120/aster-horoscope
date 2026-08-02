import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { signingKey } from "./session-store";

/** Sign-message challenges expire 5 minutes after issuance. */
const NONCE_TTL_MS = 5 * 60 * 1000;

type WalletPurpose = "login" | "link";

interface NoncePayload {
  address: string;
  purpose: WalletPurpose;
  nonce: string;
  issuedAt: number;
  /** Present for "link" — the account the wallet must be attached to. */
  userId?: string;
}

function buildMessage(payload: NoncePayload): string {
  const purposeLine = payload.purpose === "link" ? "Link wallet to your account" : "Sign in";
  return [
    "Sign this message to verify you own this wallet.",
    "",
    "App: Aster Horoscope",
    `Purpose: ${purposeLine}`,
    `Address: ${payload.address}`,
    `Nonce: ${payload.nonce}`,
    `Issued At: ${new Date(payload.issuedAt).toISOString()}`,
  ].join("\n");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", signingKey()).update(payloadB64).digest("base64url");
}

/** Issue a signed, stateless sign-message challenge for a wallet address. */
export function createWalletNonce(
  address: string,
  purpose: WalletPurpose,
  userId?: string,
): { token: string; message: string } {
  const payload: NoncePayload = {
    address: address.toLowerCase(),
    purpose,
    nonce: randomBytes(16).toString("hex"),
    issuedAt: Date.now(),
    ...(userId ? { userId } : {}),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${payloadB64}.${sign(payloadB64)}`;
  return { token, message: buildMessage(payload) };
}

/**
 * Verify a wallet nonce token's signature, TTL, purpose, and address; returns
 * the exact message that was expected to be signed (so the caller can verify
 * the wallet signature against it) plus the linked userId for "link" tokens.
 * Returns null if the token is missing, tampered, expired, or mismatched.
 */
export function verifyWalletNonceToken(
  token: string,
  purpose: WalletPurpose,
  address: string,
): { userId?: string; message: string } | null {
  const sep = token.lastIndexOf(".");
  if (sep <= 0) return null;
  const payloadB64 = token.slice(0, sep);
  const provided = Buffer.from(token.slice(sep + 1));
  const expected = Buffer.from(sign(payloadB64));
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  let payload: NoncePayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString()) as NoncePayload;
  } catch {
    return null;
  }

  if (payload.purpose !== purpose) return null;
  if (payload.address !== address.toLowerCase()) return null;
  if (Date.now() - payload.issuedAt > NONCE_TTL_MS) return null;

  return { userId: payload.userId, message: buildMessage(payload) };
}
