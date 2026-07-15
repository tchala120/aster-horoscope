import { cookies } from "next/headers";
import type { AuthRequest, AuthResponse } from "@/shared";
import { verifyPassword } from "@/server/auth/password";
import { SESSION_COOKIE, createSession } from "@/server/auth/session-store";
import { userRepo } from "@/server/repositories";
import { buildSession } from "@/server/services/session-service";
import { handleError, jsonOk } from "@/server/http";
import { serviceError } from "@/server/service-error";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as AuthRequest | null;
    if (!body?.username || !body?.password) {
      throw serviceError("VALIDATION_001", "Username and password are required.", 400);
    }
    const user = await userRepo.findByUsername(body.username);
    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      throw serviceError("AUTH_001", "Invalid username or password.", 401);
    }
    const sessionId = createSession(user.id);
    (await cookies()).set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    return jsonOk<AuthResponse>({ session: buildSession(user.id) });
  } catch (e) {
    return handleError(e);
  }
}
