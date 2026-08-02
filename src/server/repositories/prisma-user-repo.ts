import { getPrisma } from "../db/prisma";
import type { UserRepo } from "./types";

/** Only the columns we expose as UserRecord. */
const userSelect = { id: true, username: true, passwordHash: true, walletAddress: true } as const;

/**
 * PostgreSQL-backed user store (Prisma). Usernames are normalized to lowercase
 * for case-insensitive uniqueness, matching the in-memory implementation.
 * The Prisma client is created lazily (see getPrisma), so importing this module
 * never opens a connection unless the repo is actually selected + used.
 */
export const prismaUserRepo: UserRepo = {
  create(username, passwordHash) {
    return getPrisma().user.create({
      data: { username: username.toLowerCase(), passwordHash },
      select: userSelect,
    });
  },

  findByUsername(username) {
    return getPrisma().user.findUnique({
      where: { username: username.toLowerCase() },
      select: userSelect,
    });
  },

  findById(id) {
    return getPrisma().user.findUnique({ where: { id }, select: userSelect });
  },

  findByWalletAddress(address) {
    return getPrisma().user.findUnique({
      where: { walletAddress: address.toLowerCase() },
      select: userSelect,
    });
  },

  setWalletAddress(userId, address) {
    return getPrisma().user.update({
      where: { id: userId },
      data: { walletAddress: address ? address.toLowerCase() : null },
      select: userSelect,
    });
  },
};
