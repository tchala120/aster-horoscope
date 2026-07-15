import { describe, expect, it } from "vitest";
import { userRepo } from "@/server/repositories";
import { ServiceError } from "@/server/service-error";
import { draw } from "../session-service";
import { accept, complete, pick, reject } from "../mission-service";

async function seededUserWithSpread(): Promise<{ userId: string; cardIds: string[] }> {
  const userId = (await userRepo.create(`u_${crypto.randomUUID()}`, "hash")).id;
  const daily = draw(userId);
  return { userId, cardIds: daily.spread.map((c) => c.cardId) };
}

describe("mission-service lifecycle", () => {
  it("pick → accept → complete clears the active mission", async () => {
    const { userId, cardIds } = await seededUserWithSpread();

    const picked = pick(userId, cardIds[0]);
    expect(picked.mission?.status).toBe("assigned");
    expect(picked.daily.spread.find((c) => c.cardId === cardIds[0])?.picked).toBe(true);

    const accepted = accept(userId, picked.mission!.id);
    expect(accepted.mission?.status).toBe("active");
    expect(accepted.mission?.deadline).not.toBe("");
    expect(accepted.daily.activeMissionRef).toBe(picked.mission!.id);

    const completed = complete(userId, picked.mission!.id);
    expect(completed.mission?.status).toBe("completed");
    expect(completed.daily.activeMissionRef).toBeNull();
    expect(completed.daily.lastCompletionDate).not.toBeNull();
  });

  it("reject flags the card as rejected", async () => {
    const { userId, cardIds } = await seededUserWithSpread();
    const picked = pick(userId, cardIds[1]);
    const rejected = reject(userId, picked.mission!.id);
    expect(rejected.mission?.status).toBe("rejected");
    expect(rejected.daily.spread.find((c) => c.cardId === cardIds[1])?.rejected).toBe(true);
  });

  it("blocks picking a second card while a mission is active", async () => {
    const { userId, cardIds } = await seededUserWithSpread();
    const picked = pick(userId, cardIds[0]);
    accept(userId, picked.mission!.id);
    try {
      pick(userId, cardIds[1]);
      expect.unreachable("pick should be blocked while a mission is active");
    } catch (e) {
      expect((e as ServiceError).appError.code).toBe("MISSION_003");
    }
  });
});
