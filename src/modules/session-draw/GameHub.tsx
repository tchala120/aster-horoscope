"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AmbientMusic } from "@/foundation/ui/components/AmbientMusic";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { AuthPanel } from "./components/AuthPanel";
import { ProfileMenu } from "./components/ProfileMenu";
import { useGame } from "./state/game-context";

interface Tile {
  href: string;
  title: string;
  desc: string;
  cta: string;
  glyph: string;
  glow: string; // "r,g,b"
  featured?: boolean;
}

const TILES: Tile[] = [
  {
    href: "/draw",
    title: "Daily Draw",
    desc: "Your once-a-day tarot pull — take on a mission, reveal your card, earn a reward.",
    cta: "Draw today's card",
    glyph: "\u2726", // ✦
    glow: "51,204,173",
    featured: true,
  },
  {
    href: "/game",
    title: "Tarot Match",
    desc: "A memory game — flip and match the arcana pairs in as few moves as you can.",
    cta: "Play",
    glyph: "\u25C8", // ◈
    glow: "51,161,204",
  },
  {
    href: "/echoes",
    title: "Echoes of the Stars",
    desc: "Watch the cards sing their sequence, then echo it back note for note.",
    cta: "Play",
    glyph: "\u266A", // ♪
    glow: "124,77,255",
  },
  {
    href: "/ladder",
    title: "Fate's Ladder",
    desc: "Higher or lower? Guess the next arcana's rank and climb your streak.",
    cta: "Play",
    glyph: "\u2191", // ↑
    glow: "255,212,90",
  },
  {
    href: "/race",
    title: "The Fool's Race",
    desc: "A hotseat board game for 2-6. Roll, race the arcana, first to The World wins.",
    cta: "Gather players",
    glyph: "\u2660", // ♠
    glow: "255,90,138",
  },
  {
    href: "/history",
    title: "Your History",
    desc: "Every card you drew, the quest it gave, and the reward you earned.",
    cta: "View",
    glyph: "\u25F7", // ◷
    glow: "255,212,90",
  },
];

/**
 * Post-login hub: a board for choosing an activity (daily draw + mini-games +
 * history). Auth-gated — shows the login panel until the player signs in.
 */
export function GameHub() {
  const reduced = useReducedMotion() ?? false;
  const game = useGame();

  if (game.status === "loading") {
    return (
      <>
        <AmbientMusic src="/sound/loffy.mp3" />
        <p className="flex flex-1 items-center justify-center text-grey-400">Loading…</p>
      </>
    );
  }

  if (game.status === "anon" || !game.session) {
    return (
      <>
        <AmbientMusic src="/sound/loffy.mp3" />
        <AuthPanel
          error={game.error}
          onSubmit={(mode, creds) =>
            void (mode === "login" ? game.login(creds) : game.register(creds))
          }
        />
      </>
    );
  }

  const { username } = game.session;

  return (
    <>
      <AmbientMusic src="/sound/loffy.mp3" />
      <main className="relative flex flex-1 flex-col">
        <CelestialBackground />
        <ProfileMenu username={username} onLogout={() => void game.logout()} />

        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 p-6 py-16">
          <motion.header
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <p className="text-text-sm font-semibold uppercase tracking-[0.2em] text-aster-teal-400">
              Aster Horoscope
            </p>
            <h1 className="mt-2 text-heading-lg font-bold text-grey-50">
              Welcome back, {username}
            </h1>
            <p className="mt-2 text-text-md text-grey-400">Choose your ritual for today.</p>
          </motion.header>

          <div className="grid gap-4 sm:grid-cols-2">
            {TILES.map((t, i) => (
              <motion.div
                key={t.href}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
              >
                <Link
                  href={t.href}
                  className="group flex h-full flex-col gap-3 rounded-2xl bg-grey-gradient p-5 ring-1 ring-white/8 transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
                  style={
                    t.featured
                      ? {
                          boxShadow: `0 0 0 1px rgba(${t.glow},0.5), 0 18px 50px -24px rgba(${t.glow},0.7)`,
                        }
                      : undefined
                  }
                >
                  <span
                    aria-hidden
                    className="flex h-11 w-11 items-center justify-center rounded-full text-heading-sm"
                    style={{
                      backgroundColor: `rgba(${t.glow},0.16)`,
                      color: `rgb(${t.glow})`,
                      boxShadow: `inset 0 0 0 1px rgba(${t.glow},0.4)`,
                    }}
                  >
                    {t.glyph}
                  </span>
                  <div className="flex-1">
                    <h2 className="text-heading-sm font-bold text-grey-50">{t.title}</h2>
                    <p className="mt-1 text-text-sm text-grey-400">{t.desc}</p>
                  </div>
                  <span
                    className="text-text-sm font-semibold text-aster-sky-300 transition-transform group-hover:translate-x-0.5"
                    style={t.featured ? { color: `rgb(${t.glow})` } : undefined}
                  >
                    {t.cta} →
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
