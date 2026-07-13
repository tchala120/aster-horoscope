import { afterEach, describe, expect, it, vi } from "vitest";
import { gameApi } from "../api";

describe("gameApi", () => {
  afterEach(() => vi.restoreAllMocks());

  it("pick posts to /api/v1/missions/pick and returns an ok Result", async () => {
    const mission = { id: "m1", status: "assigned" };
    const daily = { spread: [] };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ mission, daily }) }),
    );

    const res = await gameApi.pick("the-star");
    expect(res.ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/missions/pick",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("maps a non-ok response to an error Result with the envelope code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ code: "AUTH_001", message: "Not authenticated.", status: 401 }),
      }),
    );

    const res = await gameApi.getState();
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("AUTH_001");
  });
});
