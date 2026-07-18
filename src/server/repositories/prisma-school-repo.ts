import type { Lesson, LessonComment, LessonType, ReactionType } from "@/shared";
import { getPrisma } from "../db/prisma";
import type { LessonCounts, SchoolRepo } from "./types";

interface LessonRow {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  summary: string | null;
  type: string;
  content: string | null;
  pdfFileName: string | null;
  videoUrl: string | null;
  videoAuthor: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CommentRow {
  id: string;
  lessonId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: Date;
}

/** Fields returned for listings — omits the (potentially large) markdown body. */
const LIST_SELECT = {
  id: true,
  authorId: true,
  authorName: true,
  title: true,
  summary: true,
  type: true,
  pdfFileName: true,
  videoUrl: true,
  videoAuthor: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toLesson(row: Omit<LessonRow, "content"> & { content?: string | null }): Lesson {
  return {
    id: row.id,
    authorId: row.authorId,
    authorName: row.authorName,
    title: row.title,
    summary: row.summary,
    type: row.type as LessonType,
    content: row.content ?? null,
    pdfFileName: row.pdfFileName,
    videoUrl: row.videoUrl,
    videoAuthor: row.videoAuthor,
    tags: row.tags,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toComment(row: CommentRow): LessonComment {
  return {
    id: row.id,
    lessonId: row.lessonId,
    authorId: row.authorId,
    authorName: row.authorName,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

/** PostgreSQL-backed Aster School store (Prisma). Connection is created lazily. */
export const prismaSchoolRepo: SchoolRepo = {
  async createLesson(input, pdf) {
    const db = getPrisma();
    const row = await db.lesson.create({
      data: {
        authorId: input.authorId,
        authorName: input.authorName,
        title: input.title,
        summary: input.summary,
        type: input.type,
        content: input.content,
        pdfFileName: input.pdfFileName,
        videoUrl: input.videoUrl,
        videoAuthor: input.videoAuthor,
        tags: input.tags,
        ...(pdf ? { file: { create: { data: pdf as Uint8Array<ArrayBuffer> } } } : {}),
      },
    });
    return toLesson(row);
  },

  async updateLesson(id, patch) {
    const row = await getPrisma().lesson.update({
      where: { id },
      data: {
        title: patch.title,
        summary: patch.summary,
        content: patch.content,
        videoUrl: patch.videoUrl,
        videoAuthor: patch.videoAuthor,
        tags: patch.tags,
      },
    });
    return toLesson(row);
  },

  async deleteLesson(id) {
    await getPrisma().lesson.delete({ where: { id } });
  },

  async getLesson(id) {
    const row = await getPrisma().lesson.findUnique({ where: { id } });
    return row ? toLesson(row) : null;
  },

  async getLessonFile(id) {
    const file = await getPrisma().lessonFile.findUnique({
      where: { lessonId: id },
      include: { lesson: { select: { pdfFileName: true } } },
    });
    if (!file) return null;
    return { data: file.data, fileName: file.lesson.pdfFileName ?? "document.pdf" };
  },

  async listLessons(query) {
    const db = getPrisma();
    const where = {
      ...(query.q ? { title: { contains: query.q, mode: "insensitive" as const } } : {}),
      ...(query.tag ? { tags: { has: query.tag } } : {}),
      ...(query.types?.length ? { type: { in: query.types } } : {}),
    };
    const [rows, total] = await Promise.all([
      db.lesson.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: LIST_SELECT,
      }),
      db.lesson.count({ where }),
    ]);
    return { lessons: rows.map((r) => toLesson(r)), total };
  },

  async countsFor(lessonIds) {
    const map = new Map<string, LessonCounts>();
    for (const id of lessonIds) map.set(id, { comments: 0, likes: 0, bookmarks: 0 });
    if (lessonIds.length === 0) return map;

    const db = getPrisma();
    const [commentGroups, reactionGroups] = await Promise.all([
      db.comment.groupBy({
        by: ["lessonId"],
        where: { lessonId: { in: lessonIds } },
        _count: { _all: true },
      }),
      db.reaction.groupBy({
        by: ["lessonId", "type"],
        where: { lessonId: { in: lessonIds } },
        _count: { _all: true },
      }),
    ]);
    for (const g of commentGroups) {
      const c = map.get(g.lessonId);
      if (c) c.comments = g._count._all;
    }
    for (const g of reactionGroups) {
      const c = map.get(g.lessonId);
      if (!c) continue;
      if (g.type === "like") c.likes = g._count._all;
      else if (g.type === "bookmark") c.bookmarks = g._count._all;
    }
    return map;
  },

  async listComments(lessonId) {
    const rows = await getPrisma().comment.findMany({
      where: { lessonId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toComment);
  },

  async addComment(input) {
    const row = await getPrisma().comment.create({ data: input });
    return toComment(row);
  },

  async getComment(id) {
    const row = await getPrisma().comment.findUnique({ where: { id } });
    return row ? toComment(row) : null;
  },

  async deleteComment(id) {
    await getPrisma().comment.delete({ where: { id } });
  },

  async toggleReaction(lessonId, userId, type) {
    const db = getPrisma();
    const existing = await db.reaction.findUnique({
      where: { lessonId_userId_type: { lessonId, userId, type } },
    });
    if (existing) await db.reaction.delete({ where: { id: existing.id } });
    else await db.reaction.create({ data: { lessonId, userId, type } });
  },

  async reactionCounts(lessonId) {
    const groups = await getPrisma().reaction.groupBy({
      by: ["type"],
      where: { lessonId },
      _count: { _all: true },
    });
    let likes = 0;
    let bookmarks = 0;
    for (const g of groups) {
      if (g.type === "like") likes = g._count._all;
      else if (g.type === "bookmark") bookmarks = g._count._all;
    }
    return { likes, bookmarks };
  },

  async userReactions(lessonId, userId) {
    const rows = await getPrisma().reaction.findMany({
      where: { lessonId, userId },
      select: { type: true },
    });
    return rows.map((r) => r.type as ReactionType);
  },
};
