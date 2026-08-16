import { describe, expect, it } from "vitest";
import { assignRoles, rolePoolFor, type RoleId } from "../werewolf";

function roleCounts(roles: readonly RoleId[]): Record<RoleId, number> {
  return roles.reduce<Record<RoleId, number>>(
    (counts, role) => ({ ...counts, [role]: counts[role] + 1 }),
    { villager: 0, werewolf: 0, seer: 0, doctor: 0, hunter: 0 },
  );
}

describe("Werewolf role allocation", () => {
  it("uses a balanced two-wolf composition for a full 10-player room", () => {
    const expected = { villager: 5, werewolf: 2, seer: 1, doctor: 1, hunter: 1 };

    expect(rolePoolFor(10)).toHaveLength(10);
    expect(roleCounts(rolePoolFor(10))).toEqual(expected);
    expect(roleCounts(assignRoles(10, () => 0.5))).toEqual(expected);
  });

  it("supports a balanced full 15-player room", () => {
    const expected = { villager: 8, werewolf: 4, seer: 1, doctor: 1, hunter: 1 };

    expect(rolePoolFor(15)).toHaveLength(15);
    expect(roleCounts(rolePoolFor(15))).toEqual(expected);
    expect(roleCounts(assignRoles(15, () => 0.5))).toEqual(expected);
  });

  it("preserves the existing smaller-room compositions", () => {
    expect(roleCounts(rolePoolFor(5))).toEqual({
      villager: 1,
      werewolf: 1,
      seer: 1,
      doctor: 1,
      hunter: 1,
    });
    expect(roleCounts(rolePoolFor(7))).toEqual({
      villager: 2,
      werewolf: 2,
      seer: 1,
      doctor: 1,
      hunter: 1,
    });
    expect(roleCounts(rolePoolFor(9))).toEqual({
      villager: 4,
      werewolf: 2,
      seer: 1,
      doctor: 1,
      hunter: 1,
    });
  });
});
