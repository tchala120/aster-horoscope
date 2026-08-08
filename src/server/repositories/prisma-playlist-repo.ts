import type { Lesson, LessonType, Playlist } from "@/shared";
import { getPrisma } from "../db/prisma";
import type { PlaylistRepo, PlaylistSummaryData } from "./types";

interface PlaylistRow {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Lesson fields needed for playlist cards/queues — omits the markdown body. */
const LESSON_SELECT = {
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

interface LessonRow {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  summary: string | null;
  type: string;
  pdfFileName: string | null;
  videoUrl: string | null;
  videoAuthor: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

function toPlaylist(row: PlaylistRow): Playlist {
  return {
    id: row.id,
    authorId: row.authorId,
    authorName: row.authorName,
    title: row.title,
    description: row.description,
    coverImageUrl: row.coverImageUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toLesson(row: LessonRow): Lesson {
  return {
    id: row.id,
    authorId: row.authorId,
    authorName: row.authorName,
    title: row.title,
    summary: row.summary,
    type: row.type as LessonType,
    content: null,
    pdfFileName: row.pdfFileName,
    videoUrl: row.videoUrl,
    videoAuthor: row.videoAuthor,
    tags: row.tags,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** PostgreSQL-backed playlist store (Prisma). Connection is created lazily. */
export const prismaPlaylistRepo: PlaylistRepo = {
  async createPlaylist(input) {
    const row = await getPrisma().playlist.create({
      data: {
        authorId: input.authorId,
        authorName: input.authorName,
        title: input.title,
        description: input.description,
        coverImageUrl: input.coverImageUrl,
      },
    });
    return toPlaylist(row);
  },

  async updatePlaylist(id, patch) {
    const row = await getPrisma().playlist.update({
      where: { id },
      data: {
        title: patch.title,
        description: patch.description,
        coverImageUrl: patch.coverImageUrl,
      },
    });
    return toPlaylist(row);
  },

  async deletePlaylist(id) {
    await getPrisma().playlist.delete({ where: { id } });
  },

  async getPlaylist(id) {
    const row = await getPrisma().playlist.findUnique({ where: { id } });
    return row ? toPlaylist(row) : null;
  },

  async listPlaylists(query) {
    const db = getPrisma();
    const where = query.authorId ? { authorId: query.authorId } : {};
    const [rows, total] = await Promise.all([
      db.playlist.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      db.playlist.count({ where }),
    ]);
    return { playlists: rows.map(toPlaylist), total };
  },

  async summaryDataFor(playlistIds) {
    const map = new Map<string, PlaylistSummaryData>();
    for (const id of playlistIds) map.set(id, { itemCount: 0, firstLesson: null });
    if (playlistIds.length === 0) return map;

    const db = getPrisma();
    const [counts, items] = await Promise.all([
      db.playlistItem.groupBy({
        by: ["playlistId"],
        where: { playlistId: { in: playlistIds } },
        _count: { _all: true },
      }),
      db.playlistItem.findMany({
        where: { playlistId: { in: playlistIds } },
        orderBy: [{ playlistId: "asc" }, { position: "asc" }],
        select: { playlistId: true, lesson: { select: LESSON_SELECT } },
      }),
    ]);
    for (const c of counts) {
      const entry = map.get(c.playlistId);
      if (entry) entry.itemCount = c._count._all;
    }
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.playlistId)) continue;
      seen.add(item.playlistId);
      const entry = map.get(item.playlistId);
      if (entry) entry.firstLesson = toLesson(item.lesson);
    }
    return map;
  },

  async listItems(playlistId) {
    const rows = await getPrisma().playlistItem.findMany({
      where: { playlistId },
      orderBy: { position: "asc" },
      select: { id: true, playlistId: true, position: true, lesson: { select: LESSON_SELECT } },
    });
    return rows.map((r) => ({
      id: r.id,
      playlistId: r.playlistId,
      position: r.position,
      lesson: toLesson(r.lesson),
    }));
  },

  async hasItem(playlistId, lessonId) {
    const row = await getPrisma().playlistItem.findUnique({
      where: { playlistId_lessonId: { playlistId, lessonId } },
    });
    return row !== null;
  },

  async addItem(playlistId, lessonId) {
    const db = getPrisma();
    const count = await db.playlistItem.count({ where: { playlistId } });
    await db.playlistItem.create({ data: { playlistId, lessonId, position: count } });
  },

  async removeItem(playlistId, lessonId) {
    await getPrisma().playlistItem.delete({
      where: { playlistId_lessonId: { playlistId, lessonId } },
    });
  },

  async reorderItems(playlistId, lessonIds) {
    const db = getPrisma();
    await db.$transaction(
      lessonIds.map((lessonId, index) =>
        db.playlistItem.update({
          where: { playlistId_lessonId: { playlistId, lessonId } },
          data: { position: index },
        }),
      ),
    );
  },
};
