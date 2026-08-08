import type { RoomState } from "@/modules/werewolf/core/room";
import { getPrisma } from "../db/prisma";
import type { WerewolfRoomRepo } from "./types";

/**
 * PostgreSQL-backed Werewolf room store (Prisma). The whole game state is a
 * single JSON blob per room — see the `WerewolfRoom` model's doc comment for
 * why that's the right tradeoff here.
 */
export const prismaWerewolfRoomRepo: WerewolfRoomRepo = {
  async create(state) {
    await getPrisma().werewolfRoom.create({
      data: { code: state.code, state: state as object },
    });
    return state;
  },

  async getByCode(code) {
    const row = await getPrisma().werewolfRoom.findUnique({ where: { code } });
    return row ? (row.state as unknown as RoomState) : null;
  },

  async save(state) {
    await getPrisma().werewolfRoom.update({
      where: { code: state.code },
      data: { state: state as object },
    });
    return state;
  },

  async listRecent(limit) {
    const rows = await getPrisma().werewolfRoom.findMany({
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return rows.map((row) => row.state as unknown as RoomState);
  },

  async deleteByCode(code) {
    await getPrisma().werewolfRoom.deleteMany({ where: { code } });
  },
};
