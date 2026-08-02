"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { AuthRequest, WalletVerifyRequest } from "@/shared";
import { useGame } from "@/modules/session-draw/state/game-context";
import { AuthPanel } from "@/modules/session-draw/components/AuthPanel";
import { ProfileMenu } from "@/modules/session-draw/components/ProfileMenu";

/** Distant floating islands, split from group-land.png — small silhouettes strung along
 * the horizon (like the reference art), positions/sizes are % of the full hero. */
const DISTANT_ISLANDS = [
  { file: "island-0.png", left: 5, top: 61, width: 5, height: 9.16, duration: 6.5, delay: 0, amplitude: 5 },
  { file: "island-1.png", left: 60, top: 59, width: 5.5, height: 7.57, duration: 7.2, delay: 0.6, amplitude: 6 },
  { file: "island-2.png", left: 33, top: 65, width: 3.8, height: 4.49, duration: 5.4, delay: 1.1, amplitude: 4 },
  { file: "island-4.png", left: 45, top: 63, width: 3.6, height: 5.14, duration: 6, delay: 1.5, amplitude: 4.5 },
  { file: "island-5.png", left: 79, top: 57, width: 3.2, height: 4.64, duration: 6.8, delay: 0.9, amplitude: 5.5 },
] as const;

/** Twinkling background stars — deterministic sin-hash so server/client HTML match exactly. */
const round4 = (n: number) => Math.round(n * 10000) / 10000;

function useStars(count: number, seed: number) {
  return useMemo(() => {
    const rand = (n: number) => {
      const x = Math.sin(n * 12.9898 + seed) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: count }, (_, i) => ({
      top: round4(rand(i * 6 + 1) * 100),
      left: round4(rand(i * 6 + 2) * 100),
      size: round4(1 + rand(i * 6 + 3) * 2.2),
      delay: round4(rand(i * 6 + 4) * 5),
      duration: round4(2.5 + rand(i * 6 + 5) * 3.5),
      opacity: round4(0.4 + rand(i * 6 + 6) * 0.6),
    }));
  }, [count, seed]);
}

/** A handful of fixed falling-star trajectories — deterministic, no seeded RNG needed for just a few. */
const FALLING_STARS = [
  { top: 12, left: 78, angle: 200, length: 110, duration: 9, delay: 0.5 },
  { top: 30, left: 55, angle: 205, length: 90, duration: 12, delay: 5 },
  { top: 8, left: 30, angle: 195, length: 130, duration: 14, delay: 9 },
] as const;

const NAV_LINKS = [
  { label: "Ritual", href: "/draw" },
  { label: "Game", href: "/game" },
  { label: "School", href: "/school" },
  { label: "Staking", href: "/staking" },
] as const;

/** Sparkle glyphs (✦) that drift up and fade, cycling through the brand palette. */
const SPARKLES = [
  { left: "8%", top: "18%", size: 14, delay: 0, duration: 3.6, color: "#ffe08a" },
  { left: "22%", top: "62%", size: 10, delay: 0.8, duration: 4.1, color: "#47d4b4" },
  { left: "35%", top: "10%", size: 12, delay: 1.6, duration: 3.3, color: "#ffffff" },
  { left: "48%", top: "72%", size: 9, delay: 0.4, duration: 4.6, color: "#b78bff" },
  { left: "62%", top: "22%", size: 13, delay: 2.1, duration: 3.9, color: "#66bfe2" },
  { left: "76%", top: "8%", size: 10, delay: 1.1, duration: 4.2, color: "#ffe08a" },
  { left: "84%", top: "58%", size: 11, delay: 0.2, duration: 3.5, color: "#ffffff" },
  { left: "91%", top: "30%", size: 9, delay: 1.9, duration: 4.4, color: "#47d4b4" },
  { left: "15%", top: "40%", size: 8, delay: 2.6, duration: 3.8, color: "#66bfe2" },
  { left: "58%", top: "48%", size: 9, delay: 1.3, duration: 4.0, color: "#b78bff" },
] as const;

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="m5 5 10 10M15 5 5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LandingHero() {
  const reduced = useReducedMotion() ?? false;
  const stars = useStars(70, 20260723);
  const router = useRouter();
  const game = useGame();
  const [authOpen, setAuthOpen] = useState(false);
  /** Where to go after a successful login triggered from a nav link; null when opened via "Connect" (stay put). */
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const openAuth = (href: string | null) => {
    setPendingHref(href);
    setAuthOpen(true);
  };

  const closeAuth = () => {
    setAuthOpen(false);
    setPendingHref(null);
  };

  useEffect(() => {
    if (!authOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuth();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authOpen]);

  const handleNavClick = (e: MouseEvent, href: string) => {
    if (game.status === "anon") {
      e.preventDefault();
      openAuth(href);
    }
  };

  const handleAuthSubmit = async (creds: AuthRequest) => {
    const ok = await game.login(creds);
    if (ok) {
      const dest = pendingHref;
      closeAuth();
      if (dest) router.push(dest);
    }
    return ok;
  };

  const handleWalletLogin = async (payload: WalletVerifyRequest) => {
    const ok = await game.loginWithWallet(payload);
    if (ok) {
      const dest = pendingHref;
      closeAuth();
      if (dest) router.push(dest);
    }
    return ok;
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-grey-950">
      {/* Deep space backdrop */}
      <Image
        src="/landing-page-new/bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(6,8,18,0.55) 0%, rgba(6,8,18,0.05) 28%, rgba(6,8,18,0.15) 55%, rgba(6,8,18,0.75) 100%)",
        }}
      />

      {/* Rocky frame hugging the bottom-left/bottom-right edges, same canvas as bg.png —
          shifted down so most of it sits below the fold, leaving just an accent. */}
      <Image
        src="/landing-page-new/cutout/land-frame.png"
        alt=""
        fill
        sizes="100vw"
        className="pointer-events-none translate-y-[18%] object-cover"
      />

      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="leading-none">
          <span className="block text-heading-sm font-bold tracking-wide text-grey-50">ASTER</span>
          <span className="block text-[0.65rem] font-semibold tracking-[0.3em] text-grey-400">UNIVERSE</span>
        </Link>

        <nav className="hidden items-center gap-10 sm:flex">
          {NAV_LINKS.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={(e) => handleNavClick(e, n.href)}
              className="text-text-sm font-semibold uppercase tracking-wider text-grey-200 transition-colors hover:text-aster-teal-300"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {game.status === "authed" && game.session ? (
          <ProfileMenu
            variant="inline"
            username={game.session.username}
            onLogout={() => void game.logout()}
            walletAddress={game.session.walletAddress}
            onLinkWallet={(payload) => game.linkWallet(payload)}
            onUnlinkWallet={() => void game.unlinkWallet()}
          />
        ) : (
          <button
            type="button"
            onClick={() => openAuth(null)}
            className="rounded-full border border-white/25 px-5 py-2 text-text-sm font-semibold text-grey-50 transition-colors hover:border-white/50 hover:bg-white/5"
          >
            Connect
          </button>
        )}
      </header>

      {/* Centerpiece logo */}
      <div className="pointer-events-none absolute left-1/2 top-[20%] z-10 w-[70%] max-w-xl -translate-x-1/2 sm:w-[46%]">
        <Image
          src="/landing-page-new/cutout/logo.png"
          alt="Aster Universe"
          width={1466}
          height={585}
          sizes="46vw"
          className="w-full drop-shadow-[0_16px_24px_rgba(0,0,0,0.5)]"
          priority
        />
      </div>

      {/* Twinkling star field */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {stars.map((s, i) => (
          <span
            key={i}
            className="animate-twinkle absolute rounded-full bg-white"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
              boxShadow: "0 0 6px rgba(255,255,255,0.75)",
            }}
          />
        ))}

        {/* Magic-dust sparkles */}
        {!reduced &&
          SPARKLES.map((sp, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute select-none leading-none"
              style={{
                top: sp.top,
                left: sp.left,
                fontSize: sp.size,
                color: sp.color,
                textShadow: `0 0 6px ${sp.color}`,
              }}
              animate={{
                y: [8, -12, 8],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
                rotate: [0, 25, 0],
              }}
              transition={{
                duration: sp.duration,
                ease: "easeInOut",
                repeat: Infinity,
                delay: sp.delay,
              }}
            >
              {"✦"}
            </motion.span>
          ))}

        {/* Falling stars: a rotated wrapper sets the trajectory angle; the inner
            trail animates translateX along that local axis so the two transforms
            don't collide. */}
        {FALLING_STARS.map((fs, i) => (
          <span
            key={i}
            className="absolute"
            style={{ top: `${fs.top}%`, left: `${fs.left}%`, transform: `rotate(${fs.angle}deg)` }}
          >
            <span
              className="animate-shooting-star block h-px rounded-full"
              style={{
                width: `${fs.length}px`,
                background: "linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,255,255,0))",
                boxShadow: "0 0 6px 1px rgba(255,255,255,0.7)",
                animationDuration: `${fs.duration}s`,
                animationDelay: `${fs.delay}s`,
              }}
            />
          </span>
        ))}
      </div>

      {/* Distant floating islands — small silhouettes along the horizon */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {DISTANT_ISLANDS.map((isl, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${isl.left}%`,
              top: `${isl.top}%`,
              width: `${isl.width}%`,
              height: `${isl.height}%`,
            }}
            animate={reduced ? undefined : { y: [0, -isl.amplitude, 0] }}
            transition={{ duration: isl.duration, ease: "easeInOut", repeat: Infinity, delay: isl.delay }}
          >
            <Image
              src={`/landing-page-new/cutout/islands/${isl.file}`}
              alt=""
              fill
              sizes="10vw"
              className="object-contain opacity-80 drop-shadow-[0_14px_16px_rgba(0,0,0,0.5)]"
            />
          </motion.div>
        ))}

        {/* Detailed castle isle anchoring the left side of the horizon */}
        <motion.div
          className="absolute left-[4%] top-[54%] w-[16%]"
          style={{ aspectRatio: "1147 / 1371" }}
          animate={reduced ? undefined : { y: [0, -10, 0] }}
          transition={{ duration: 7.5, ease: "easeInOut", repeat: Infinity, delay: 0.4 }}
        >
          <Image
            src="/landing-page-new/cutout/land-1.png"
            alt=""
            fill
            sizes="16vw"
            className="object-contain drop-shadow-[0_20px_22px_rgba(0,0,0,0.5)]"
          />
        </motion.div>
      </div>

      {/* Main crystal island + mascot — enlarged and pushed down so its tapering point
          crops off the bottom edge, reading as a foreground cliff rather than a floating diamond. */}
      <div className="relative z-10 ml-auto mr-[-4%] mt-auto aspect-[1448/1086] w-[92%] max-w-2xl translate-y-[20%] sm:w-[62%]">
        <motion.div
          className="absolute inset-0"
          animate={reduced ? undefined : { y: [0, -16, 0] }}
          transition={{ duration: 7, ease: "easeInOut", repeat: Infinity }}
        >
          <Image
            src="/landing-page-new/cutout/main-land.png"
            alt="Floating crystal island"
            fill
            sizes="(max-width: 640px) 68vw, 60vw"
            className="object-contain drop-shadow-[0_30px_30px_rgba(0,0,0,0.5)]"
            priority
          />

          <motion.div
            className="absolute left-1/2 top-[10%] w-[27%] -translate-x-1/2"
            animate={reduced ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 3.2, ease: "easeInOut", repeat: Infinity, delay: 0.4 }}
          >
            <Image
              src="/landing-page-new/cutout/mascot.png"
              alt="Aster mascot"
              width={400}
              height={400}
              sizes="16vw"
              className="w-full drop-shadow-[0_12px_14px_rgba(0,0,0,0.4)]"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Sign-in modal — pops over the hero instead of navigating away. */}
      <AnimatePresence>
        {authOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={closeAuth}
          >
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeAuth}
                aria-label="Close sign in"
                className="absolute -right-2 -top-2 z-20 rounded-full bg-grey-900 p-2 text-grey-300 ring-1 ring-white/12 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <CloseIcon />
              </button>
              <AuthPanel
                fullBleed={false}
                error={game.error}
                onSubmit={handleAuthSubmit}
                onWalletLogin={handleWalletLogin}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
