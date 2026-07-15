import { cookies } from "next/headers";
import type { AuthRequest, AuthResponse } from "@/shared";
import { hashPassword } from "@/server/auth/password";
import { SESSION_COOKIE, createSession } from "@/server/auth/session-store";
import { userRepo } from "@/server/repositories";
import { buildSession } from "@/server/services/session-service";
import { handleError, jsonOk } from "@/server/http";
import { serviceError } from "@/server/service-error";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as AuthRequest | null;
    if (!body?.username || !body?.password || body.password.length < 3) {
      throw serviceError("VALIDATION_001", "Username and password (min 3 chars) are required.", 400);
    }
    if (await userRepo.findByUsername(body.username)) {
      throw serviceError("AUTH_003", "That username is already taken.", 409);
    }
    const user = await userRepo.create(body.username, hashPassword(body.password));
    const sessionId = createSession(user.id);
    (await cookies()).set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    return jsonOk<AuthResponse>({ session: buildSession(user.id, user.username) }, 201);
  } catch (e) {
    return handleError(e);
  }
}
