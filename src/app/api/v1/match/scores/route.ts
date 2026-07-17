import type { MatchScoresResponse, SubmitMatchScoreRequest } from "@/shared";
import { ErrorCodes, createError } from "@/shared";
import { matchScoreRepo, userRepo } from "@/server/repositories";
import { handleError, jsonError, jsonOk, requireUserId } from "@/server/http";

/** Always read fresh from the DB (never statically cached). */
export const dynamic = "force-dynamic";

const TOP_LIMIT = 10;
const MAX_MOVES = 999;

/** GET /api/v1/match/scores — public ranking board (top scores, fewest moves first). */
export async function GET() {
  try {
    const scores = await matchScoreRepo.top(TOP_LIMIT);
    return jsonOk<MatchScoresResponse>({ scores });
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/v1/match/scores — record the signed-in player's completed game. */
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const user = await userRepo.findById(userId);
    if (!user) {
      return jsonError(createError(ErrorCodes.AUTH_UNAUTHENTICATED, "Not authenticated.", 401));
    }

    const body = (await req.json().catch(() => null)) as Partial<SubmitMatchScoreRequest> | null;
    const moves = body?.moves;
    if (typeof moves !== "number" || !Number.isInteger(moves) || moves < 1 || moves > MAX_MOVES) {
      return jsonError(createError(ErrorCodes.VALIDATION, "Invalid move count.", 400));
    }

    const created = await matchScoreRepo.add({ name: user.username, moves });
    const scores = await matchScoreRepo.top(TOP_LIMIT);
    return jsonOk<MatchScoresResponse>({ scores, yourScoreId: created.id });
  } catch (e) {
    return handleError(e);
  }
}
