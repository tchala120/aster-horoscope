import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { DIFFICULTY_WINDOW_DAYS } from "@/shared";
import {
  acceptMission,
  completeMission,
  createMission,
  deadlineFor,
  isExpired,
} from "../mission-service";

const now = new Date("2026-07-13T00:00:00Z");
const fixedRng = () => 0; // -> first catalog entry (Active Participant, easy)

describe("mission-service", () => {
  it("creates an assigned mission with no deadline yet", () => {
    const m = createMission("m1", "the-star", now, fixedRng);
    expect(m.status).toBe("assigned");
    expect(m.deadline).toBe("");
    expect(m.difficulty).toBe("easy");
    expect(m.cardRef).toBe("the-star");
  });

  it("accept starts the difficulty-based deadline and activates it", () => {
    const m = acceptMission(createMission("m1", "c", now, fixedRng), now);
    expect(m.status).toBe("active");
    expect(m.deadline).toBe(deadlineFor("easy", now));
  });

  it("completeMission succeeds within the window", () => {
    const active = acceptMission(createMission("m1", "c", now, fixedRng), now);
    const res = completeMission(active, new Date("2026-07-13T06:00:00Z"));
    expect(res.ok).toBe(true);
    expect(res.mission.status).toBe("completed");
  });

  it("completeMission fails (expired) after the deadline", () => {
    const active = acceptMission(createMission("m1", "c", now, fixedRng), now);
    const res = completeMission(active, new Date("2026-07-15T00:00:00Z"));
    expect(res.ok).toBe(false);
    expect(res.mission.status).toBe("expired");
  });

  it("PBT: deadline equals now + difficulty window, and completion is allowed iff before deadline", () => {
    const difficulties = fc.constantFrom("easy", "medium", "hard") as fc.Arbitrary<
      "easy" | "medium" | "hard"
    >;
    fc.assert(
      fc.property(difficulties, fc.integer({ min: 0, max: 14 }), (difficulty, dayOffset) => {
        const base = new Date("2026-01-01T00:00:00Z");
        const mission = acceptMission(
          { id: "m", cardRef: "c", featureRef: "f", difficulty, deadline: "", status: "assigned" },
          base,
        );
        const expectedMs = base.getTime() + DIFFICULTY_WINDOW_DAYS[difficulty] * 86_400_000;
        if (new Date(mission.deadline).getTime() !== expectedMs) return false;

        const at = new Date(base.getTime() + dayOffset * 86_400_000);
        const res = completeMission(mission, at);
        return res.ok === !isExpired(mission, at);
      }),
    );
  });
});
