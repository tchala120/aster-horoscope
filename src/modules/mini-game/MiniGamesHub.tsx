"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BackLink } from "@/foundation/ui/components/BackLink";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";

interface MiniGame {
  href: string;
  title: string;
  desc: string;
  cta: string;
  glyph: string;
  glow: string; // "r,g,b"
  /** Scene illustration for the card's right side. Falls back to just the icon badge when omitted. */
  image?: string;
}

const MINI_GAMES: MiniGame[] = [
  {
    href: "/game/match",
    title: "Tarot Match",
    desc: "A memory game — flip and match the arcana pairs in as few moves as you can.",
    cta: "Play",
    glyph: "◈",
    glow: "51,161,204",
    image: "/landing-page/tarot.png",
  },
  {
    href: "/echoes",
    title: "Echoes of the Stars",
    desc: "Watch the cards sing their sequence, then echo it back note for note.",
    cta: "Play",
    glyph: "♪",
    glow: "124,77,255",
    image: "/landing-page/echoes-mascot.png",
  },
  {
    href: "/ladder",
    title: "Fate's Ladder",
    desc: "Higher or lower? Guess the next arcana's rank and climb your streak.",
    cta: "Play",
    glyph: "↑",
    glow: "255,212,90",
  },
  {
    href: "/race",
    title: "The Fool's Race",
    desc: "A hotseat board game for 2-6. Roll, race the arcana, first to The World wins.",
    cta: "Gather players",
    glyph: "♠",
    glow: "255,90,138",
  },
  {
    href: "/werewolf",
    title: "Werewolves of Aster Village",
    desc: "A hotseat game of hidden roles for 5-10. Root out the wolves before they devour the village.",
    cta: "Gather the village",
    glyph: "☾",
    glow: "96,165,250",
    image: "/werewolf-game/werewolf.png",
  },
];

/**
 * Scene illustration for a mini-game card: a fixed clip box that matches the
 * slot's width exactly and extends above the slot's top so the art can rise
 * past the card's edge, while the bottom stays flush — it never exceeds the
 * card. Stacked high (z-30) so the part that pokes out draws over
 * neighboring cards instead of being hidden behind them.
 */
function GameIllustration({ image, title }: { image: string; title: string }) {
  return (
    <div aria-hidden className="relative z-30 hidden w-36 shrink-0 sm:block md:w-44">
      <div className="absolute inset-x-0 -top-6 bottom-0 overflow-hidden rounded-2xl">
        <div className="absolute inset-0" style={{ transform: "scale(1.5)" }}>
          <Image
            src={image}
            alt={title}
            fill
            sizes="12rem"
            className="object-contain object-center"
          />
        </div>
      </div>
    </div>
  );
}

/** Standalone catalog of every mini-game — no login required, reached from the landing nav. */
export function MiniGamesHub() {
  const reduced = useReducedMotion() ?? false;

  return (
    <main className="relative flex flex-1 flex-col">
      <CelestialBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6 py-16 lg:p-10">
        <BackLink />

        <header>
          <p className="text-text-sm font-semibold uppercase tracking-[0.2em] text-aster-teal-400">
            Aster Universe
          </p>
          <h1 className="mt-2 text-heading-lg font-bold text-grey-50">Mini-Games</h1>
          <p className="mt-2 text-text-md text-grey-400">
            Pick a game and play — no sign-in needed.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {MINI_GAMES.map((g, i) => (
            <motion.div
              key={g.href}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06 * i }}
            >
              <Link
                href={g.href}
                className="group relative flex h-full items-stretch rounded-2xl bg-grey-950/90 backdrop-blur-xl transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
                style={{
                  boxShadow: `0 0 0 1px rgba(${g.glow},0.5), 0 0 28px -8px rgba(${g.glow},0.55), 0 18px 40px -28px rgba(${g.glow},0.6)`,
                }}
              >
                <div className="relative z-10 flex flex-1 flex-col justify-center gap-3 p-5">
                  <span
                    aria-hidden
                    className="flex h-11 w-11 items-center justify-center rounded-full text-heading-sm"
                    style={{
                      backgroundColor: `rgba(${g.glow},0.08)`,
                      color: `rgb(${g.glow})`,
                      border: `1.5px solid rgba(${g.glow},0.55)`,
                      boxShadow: `0 0 12px -2px rgba(${g.glow},0.5)`,
                    }}
                  >
                    {g.glyph}
                  </span>
                  <div>
                    <h2 className="text-heading-sm font-bold text-grey-50">{g.title}</h2>
                    <p className="mt-1 text-text-sm text-grey-400">{g.desc}</p>
                  </div>
                  <span
                    className="mt-auto text-text-sm font-semibold transition-transform group-hover:translate-x-0.5"
                    style={{ color: `rgb(${g.glow})` }}
                  >
                    {g.cta} →
                  </span>
                </div>
                {g.image && <GameIllustration image={g.image} title={g.title} />}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
