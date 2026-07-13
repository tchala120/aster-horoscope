import { describe, expect, it } from "vitest";
import { userRepo } from "@/server/repositories/memory";
import { ServiceError } from "@/server/service-error";
import { draw, getState } from "../session-service";

function newUserId(): string {
  return userRepo.create(`u_${crypto.randomUUID()}`, "hash").id;
}

describe("session-service (server-authoritative)", () => {
  it("getState returns an authenticated session with empty daily state", () => {
    const userId = newUserId();
    const state = getState(userId);
    expect(state.session.isAuthenticated).toBe(true);
    expect(state.session.userId).toBe(userId);
    expect(state.daily.spread).toHaveLength(0);
    expect(state.activeMission).toBeNull();
  });

  it("draw generates a 10-card spread; a second same-day draw is blocked", () => {
    const userId = newUserId();
    const daily = draw(userId);
    expect(daily.spread).toHaveLength(10);

    try {
      draw(userId);
      expect.unreachable("second draw should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ServiceError);
      expect((e as ServiceError).appError.code).toBe("DRAW_001");
    }
  });
});
