import { getPrisma } from "../db/prisma";
import type { AssetRepo } from "./types";

/** PostgreSQL-backed image asset store (Prisma). Connection is created lazily. */
export const prismaAssetRepo: AssetRepo = {
  async create(authorId, data, mimeType) {
    const row = await getPrisma().asset.create({
      data: { authorId, data: data as Uint8Array<ArrayBuffer>, mimeType },
      select: { id: true },
    });
    return row;
  },

  async get(id) {
    const row = await getPrisma().asset.findUnique({ where: { id } });
    return row ? { data: row.data, mimeType: row.mimeType } : null;
  },
};
