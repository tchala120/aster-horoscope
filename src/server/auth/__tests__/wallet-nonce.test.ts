import { afterEach, describe, expect, it, vi } from "vitest";
import { createWalletNonce, verifyWalletNonceToken } from "../wallet-nonce";

const ADDRESS = "0xabc1230000000000000000000000000000dead";

describe("wallet-nonce (stateless sign-message challenge tokens)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("round-trips a valid login token", () => {
    const { token, message } = createWalletNonce(ADDRESS, "login");
    const result = verifyWalletNonceToken(token, "login", ADDRESS);
    expect(result).not.toBeNull();
    expect(result?.message).toBe(message);
    expect(result?.userId).toBeUndefined();
  });

  it("round-trips a valid link token carrying the userId", () => {
    const { token } = createWalletNonce(ADDRESS, "link", "user-42");
    const result = verifyWalletNonceToken(token, "link", ADDRESS);
    expect(result?.userId).toBe("user-42");
  });

  it("matches address case-insensitively", () => {
    const { token } = createWalletNonce(ADDRESS, "login");
    const result = verifyWalletNonceToken(token, "login", ADDRESS.toUpperCase());
    expect(result).not.toBeNull();
  });

  it("rejects a tampered signature", () => {
    const { token } = createWalletNonce(ADDRESS, "login");
    const [payload] = token.split(".");
    const tampered = `${payload}.deadbeef`;
    expect(verifyWalletNonceToken(tampered, "login", ADDRESS)).toBeNull();
  });

  it("rejects a purpose mismatch", () => {
    const { token } = createWalletNonce(ADDRESS, "login");
    expect(verifyWalletNonceToken(token, "link", ADDRESS)).toBeNull();
  });

  it("rejects an address mismatch", () => {
    const { token } = createWalletNonce(ADDRESS, "login");
    expect(
      verifyWalletNonceToken(token, "login", "0x0000000000000000000000000000000000beef"),
    ).toBeNull();
  });

  it("rejects an expired token", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const { token } = createWalletNonce(ADDRESS, "login");

    vi.spyOn(Date, "now").mockReturnValue(now + 6 * 60 * 1000); // 6 minutes later
    expect(verifyWalletNonceToken(token, "login", ADDRESS)).toBeNull();
  });

  it("rejects malformed tokens without throwing", () => {
    expect(verifyWalletNonceToken("not-a-token", "login", ADDRESS)).toBeNull();
    expect(verifyWalletNonceToken("", "login", ADDRESS)).toBeNull();
  });
});
