// Seed dev user accounts. Passwords are scrypt-hashed in the same format as
// src/server/auth/password.ts. Idempotent (upsert), so it's safe to re-run.
// Run with: bun run db:seed
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** Dev accounts (username -> plaintext password, stored hashed). */
const USERS: ReadonlyArray<{ username: string; password: string }> = [
  { username: "dew", password: "12345678" },
  { username: "boy", password: "boy@aster" },
  { username: "tk", password: "tk@aster" },
  { username: "pete", password: "pete@aster" },
  { username: "pleum", password: "pleum@aster" },
  { username: "ter", password: "ter@aster" },
  { username: "new", password: "new@aster" },
  { username: "ear", password: "ear@aster" },
  { username: "trust", password: "trust@aster" },
  { username: "dookdik", password: "dookdik@aster" },
  { username: "fang", password: "fang@aster" },
  { username: "toh", password: "toh@aster" },
  { username: "max", password: "max@aster" },
];

const prisma = new PrismaClient();

async function main() {
  for (const { username, password } of USERS) {
    await prisma.user.upsert({
      where: { username },
      update: { passwordHash: hashPassword(password) },
      create: { username, passwordHash: hashPassword(password) },
    });
    console.log(`seeded ${username}`);
  }
  console.log(`\nDone — ${USERS.length} users seeded.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
