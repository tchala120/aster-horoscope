"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AmbientMusic } from "@/foundation/ui/components/AmbientMusic";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";
import { AuthPanel } from "./components/AuthPanel";
import { ProfileMenu } from "./components/ProfileMenu";
import { Sidebar } from "./components/Sidebar";
import { useGame } from "./state/game-context";

interface FeatureCard {
  href: string;
  title: string;
  desc: string;
  cta: string;
  glyph: string;
  glow: string; // "r,g,b"
  /** Scene illustration for the card's right side. Falls back to just the icon badge when omitted. */
  image?: string;
}

const RITUAL: FeatureCard = {
  href: "/draw",
  title: "Daily Draw",
  desc: "Your once-a-day tarot pull — take on a mission, reveal your card, earn a reward.",
  cta: "Draw today's card",
  glyph: "✦", // ✦
  glow: "51,204,173",
  image: "/landing-page/ritual.png",
};

const COMMUNITY: FeatureCard = {
  href: "/school",
  title: "Aster School",
  desc: "Community knowledge — read articles, upload docs, share what you know.",
  cta: "Explore",
  glyph: "✎", // ✎
  glow: "124,77,255",
  image: "/landing-page/aster-school-mascot-3.png",
};

const GAMES: FeatureCard[] = [
  {
    href: "/game",
    title: "Tarot Match",
    desc: "A memory game — flip and match the arcana pairs in as few moves as you can.",
    cta: "Play",
    glyph: "◈", // ◈
    glow: "51,161,204",
    image: "/landing-page/tarot.png",
  },
  {
    href: "/echoes",
    title: "Echoes of the Stars",
    desc: "Watch the cards sing their sequence, then echo it back note for note.",
    cta: "Play",
    glyph: "♪", // ♪
    glow: "124,77,255",
    image: "/landing-page/echoes-mascot.png",
  },
  {
    href: "/ladder",
    title: "Fate's Ladder",
    desc: "Higher or lower? Guess the next arcana's rank and climb your streak.",
    cta: "Play",
    glyph: "↑", // ↑
    glow: "255,212,90",
  },
  {
    href: "/race",
    title: "The Fool's Race",
    desc: "A hotseat board game for 2-6. Roll, race the arcana, first to The World wins.",
    cta: "Gather players",
    glyph: "♠", // ♠
    glow: "255,90,138",
  },
];

/**
 * Scene illustration for a feature card: a fixed clip box that matches the
 * slot's width exactly (so its left edge lines up with the fade mask, no
 * matter how the image itself is sized) and extends above the slot's top so
 * the art can rise past the card's edge, while the bottom stays flush — it
 * never exceeds the card. Stacked high (z-30) so the part that pokes out
 * draws over neighboring sections instead of being hidden behind them.
 */
function CardIllustration({
  image,
  title,
  scale = 1,
  compact = false,
}: {
  image: string;
  title: string;
  scale?: number;
  compact?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`relative z-30 hidden shrink-0 sm:block ${compact ? "w-36 md:w-44" : "w-64 md:w-80 lg:w-96"}`}
    >
      <div className={`absolute inset-x-0 bottom-0 overflow-hidden rounded-2xl ${compact ? "-top-6" : "-top-10"}`}>
        <Image
          src={image}
          alt={title}
          fill
          sizes={compact ? "12rem" : "24rem"}
          className={compact ? "object-contain object-center" : "object-contain object-right-bottom"}
          style={scale !== 1 ? { transform: `scale(${scale})` } : undefined}
        />
      </div>
    </div>
  );
}

/**
 * Post-login hub: zoned activity board (ritual, mini-games, community).
 * Auth-gated — shows the login panel until the player signs in.
 */
export function GameHub() {
  const reduced = useReducedMotion() ?? false;
  const game = useGame();
  const [profileOpen, setProfileOpen] = useState(false);

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
        <AuthPanel error={game.error} onSubmit={(creds) => game.login(creds)} />
      </>
    );
  }

  const { username } = game.session;

  return (
    <>
      <AmbientMusic src="/sound/loffy.mp3" />
      <div className="relative flex flex-1">
        <Sidebar activeHref="/" onProfileClick={() => setProfileOpen(true)} />

        <main className="relative flex flex-1 flex-col overflow-hidden">
          <CelestialBackground />
          <ProfileMenu
            username={username}
            onLogout={() => void game.logout()}
            open={profileOpen}
            onOpenChange={setProfileOpen}
          />

          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-6 py-16 lg:p-10">
            <motion.header
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-text-sm font-semibold uppercase tracking-[0.2em] text-aster-teal-400">
                Aster Horoscope +
              </p>
              <h1 className="mt-2 text-heading-lg font-bold text-grey-50">
                Welcome back, {username} <span aria-hidden>✨</span>
              </h1>
              <p className="mt-2 text-text-md text-grey-400">Choose your ritual for today.</p>
            </motion.header>

            <section>
              <h2 className="mb-3 text-text-sm font-semibold uppercase tracking-[0.2em] text-grey-500">
                Today&rsquo;s Ritual +
              </h2>
              <FeatureRow card={RITUAL} reduced={reduced} delay={0.1} imageScale={1.15} />
            </section>

            <section>
              <h2 className="mb-3 text-text-sm font-semibold uppercase tracking-[0.2em] text-grey-500">
                Community +
              </h2>
              <FeatureRow card={COMMUNITY} reduced={reduced} delay={0.16} />
            </section>

            <section id="mini-games" className="scroll-mt-10">
              <h2 className="mb-3 text-text-sm font-semibold uppercase tracking-[0.2em] text-grey-500">
                Mini-Games +
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {GAMES.map((t, i) => (
                  <FeatureRow
                    key={t.href}
                    card={t}
                    reduced={reduced}
                    delay={0.22 + i * 0.06}
                    imageScale={1.5}
                    compact
                  />
                ))}
              </div>
            </section>

            <StatsBar reduced={reduced} />
          </div>
        </main>
      </div>
    </>
  );
}

function FeatureRow({
  card,
  reduced,
  delay,
  imageScale,
  compact = false,
}: {
  card: FeatureCard;
  reduced: boolean;
  delay: number;
  imageScale?: number;
  compact?: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={compact ? "h-full" : undefined}
    >
      <Link
        href={card.href}
        className="group relative flex h-full items-stretch rounded-2xl transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
      >
        <div
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-grey-950/90 backdrop-blur-xl"
          style={{
            boxShadow: `0 0 0 1px rgba(${card.glow},0.5), 0 0 28px -8px rgba(${card.glow},0.55), 0 18px 40px -28px rgba(${card.glow},0.6)`,
          }}
        />
        <div className={`relative z-10 flex flex-1 flex-col justify-center gap-3 ${compact ? "p-5" : "p-6"}`}>
          <span
            aria-hidden
            className="flex h-11 w-11 items-center justify-center rounded-full text-heading-sm"
            style={{
              backgroundColor: `rgba(${card.glow},0.08)`,
              color: `rgb(${card.glow})`,
              border: `1.5px solid rgba(${card.glow},0.55)`,
              boxShadow: `0 0 12px -2px rgba(${card.glow},0.5)`,
            }}
          >
            {card.glyph}
          </span>
          <div>
            <h3 className="text-heading-sm font-bold text-grey-50">{card.title}</h3>
            <p className="mt-1 text-text-sm text-grey-400">{card.desc}</p>
          </div>
          <span
            className="text-text-sm font-semibold transition-transform group-hover:translate-x-0.5"
            style={{ color: `rgb(${card.glow})` }}
          >
            {card.cta} →
          </span>
        </div>
        {card.image && (
          <CardIllustration image={card.image} title={card.title} scale={imageScale} compact={compact} />
        )}
      </Link>
    </motion.div>
  );
}

const STATS = [
  { icon: "🌙", label: "Daily Streak", value: "12 🔥" },
  { icon: "✨", label: "Today's Energy", value: "The Star" },
  { icon: null, label: "Next Reward", value: "3 more rituals" },
] as const;

function StatsBar({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="grid gap-4 rounded-2xl bg-grey-950/90 p-5 backdrop-blur-xl sm:grid-cols-3"
      style={{
        boxShadow: "0 0 0 1px rgba(51,204,173,0.5), 0 0 28px -8px rgba(51,204,173,0.55), 0 18px 40px -28px rgba(51,204,173,0.6)",
      }}
    >
      {STATS.map((stat) => (
        <div key={stat.label} className="flex items-center gap-3">
          {stat.icon ? (
            <span aria-hidden className="text-heading-sm">
              {stat.icon}
            </span>
          ) : (
            <span aria-hidden className="relative h-8 w-8 shrink-0">
              <Image
                src="/landing-page/chest.png"
                alt=""
                fill
                sizes="2rem"
                className="object-contain"
                style={{ mixBlendMode: "screen" }}
              />
            </span>
          )}
          <div>
            <p className="text-text-sm text-grey-400">{stat.label}</p>
            <p className="text-heading-sm font-bold text-aster-sky-300">{stat.value}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
