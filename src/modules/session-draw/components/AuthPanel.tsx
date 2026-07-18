"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { AuthRequest } from "@/shared";
import { CelestialBackground } from "@/foundation/ui/components/CelestialBackground";

interface AuthPanelProps {
  error?: string | null;
  onSubmit: (creds: AuthRequest) => void;
}

/** Decorative fanned tarot cards for the welcome hero. */
const FAN = [
  { src: "/cards/02-love.png", x: -46, rotate: -15 },
  { src: "/cards/03-money.png", x: 46, rotate: 15 },
  { src: "/cards/01-life.png", x: 0, rotate: 0 }, // center, on top
];

/** Twinkling magic-dust sparkles that drift around the hero (deterministic layout). */
const SPARKLES = [
  { left: "10%", bottom: "22%", size: 12, delay: 0, dur: 3.2, color: "#47d4b4" },
  { left: "86%", bottom: "30%", size: 10, delay: 0.7, dur: 3.9, color: "#66bfe2" },
  { left: "20%", bottom: "60%", size: 9, delay: 1.2, dur: 4.2, color: "#ffe08a" },
  { left: "78%", bottom: "64%", size: 11, delay: 1.7, dur: 3.6, color: "#b78bff" },
  { left: "50%", bottom: "82%", size: 8, delay: 0.4, dur: 4.5, color: "#ffffff" },
];

function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="shrink-0 text-grey-400"
    >
      <path
        d="M10 10a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM4 16.5c0-2.6 2.7-4.2 6-4.2s6 1.6 6 4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="shrink-0 text-grey-400"
    >
      <path
        d="M6.25 9V6.5a3.75 3.75 0 1 1 7.5 0V9M5.5 9h9A1.5 1.5 0 0 1 16 10.5v5A1.5 1.5 0 0 1 14.5 17h-9A1.5 1.5 0 0 1 4 15.5v-5A1.5 1.5 0 0 1 5.5 9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M2.5 10S5 4.75 10 4.75 17.5 10 17.5 10 15 15.25 10 15.25 2.5 10 2.5 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="m4 4 12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M8.2 5.15A6.5 6.5 0 0 1 10 4.75c5 0 7.5 5.25 7.5 5.25a13.5 13.5 0 0 1-2.1 2.7M5.6 6.6A13.2 13.2 0 0 0 2.5 10s2.5 5.25 7.5 5.25c1 0 1.9-.2 2.7-.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Presentational, welcoming login screen (whitelist-only — no self-signup). Parent owns auth logic. */
export function AuthPanel({ error, onSubmit }: AuthPanelProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const reduced = useReducedMotion() ?? false;

  return (
    <div className="relative flex flex-1 items-center justify-center p-6">
      <CelestialBackground />

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Fanned tarot hero — cards gently levitate, sparkles twinkle, glow breathes */}
        <div className="relative mx-auto mb-6 flex h-32 items-end justify-center" aria-hidden>
          <motion.span
            className="absolute left-1/2 top-2 h-28 w-28 -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(51,204,173,0.5), rgba(51,161,204,0.25) 45%, transparent 70%)",
            }}
            animate={reduced ? undefined : { opacity: [0.65, 1, 0.65], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
          />

          {FAN.map((c, i) => (
            <motion.div
              key={c.src}
              initial={reduced ? false : { opacity: 0, x: 0, rotate: 0 }}
              animate={{ opacity: 1, x: c.x, rotate: c.rotate }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.06 }}
              className="absolute bottom-0 origin-bottom"
            >
              <motion.div
                animate={reduced ? undefined : { y: [0, -9, 0] }}
                transition={{
                  duration: 3 + i * 0.5,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: 0.4 + i * 0.25,
                }}
                className="relative aspect-[2/3] w-20 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/20"
              >
                <Image src={c.src} alt="" fill sizes="5rem" className="object-cover" />
              </motion.div>
            </motion.div>
          ))}

          {!reduced &&
            SPARKLES.map((s, i) => (
              <motion.span
                key={i}
                className="pointer-events-none absolute select-none leading-none"
                style={{
                  left: s.left,
                  bottom: s.bottom,
                  fontSize: s.size,
                  color: s.color,
                  textShadow: `0 0 6px ${s.color}`,
                }}
                animate={{
                  y: [8, -12, 8],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                  rotate: [0, 25, 0],
                }}
                transition={{
                  duration: s.dur,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: s.delay,
                }}
              >
                {"\u2726"}
              </motion.span>
            ))}
        </div>

        {/* Welcome copy */}
        <div className="text-center">
          <p className="text-text-sm font-semibold uppercase tracking-[0.2em] text-aster-teal-400">
            Aster Horoscope
          </p>
          <h1 className="mt-2 text-heading-lg font-bold text-grey-50">Welcome back, seeker</h1>
          <p className="mx-auto mt-2 max-w-xs text-text-md text-grey-400">
            Sign in to draw today&apos;s card and continue your ritual.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ username, password });
          }}
          className="mt-6 rounded-3xl bg-grey-900/70 p-6 ring-1 ring-white/8 backdrop-blur-xl"
        >
          <label htmlFor="auth-username" className="sr-only">
            Username
          </label>
          <div className="flex items-center gap-2.5 rounded-full bg-grey-950/70 px-4 ring-1 ring-white/12 transition-shadow focus-within:ring-2 focus-within:ring-aster-teal-400">
            <UserIcon />
            <input
              id="auth-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="Username"
              className="w-full bg-transparent py-3 text-text-md text-grey-50 placeholder:text-grey-500 focus:outline-none"
            />
          </div>

          <label htmlFor="auth-password" className="sr-only">
            Password
          </label>
          <div className="mt-3 flex items-center gap-2.5 rounded-full bg-grey-950/70 px-4 ring-1 ring-white/12 transition-shadow focus-within:ring-2 focus-within:ring-aster-teal-400">
            <LockIcon />
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Password"
              className="w-full bg-transparent py-3 text-text-md text-grey-50 placeholder:text-grey-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="shrink-0 rounded-full p-1 text-grey-400 transition-colors hover:text-grey-200 focus:outline-none focus-visible:text-aster-teal-300"
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>

          {error ? <p className="mt-3 text-center text-text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            className="mt-5 w-full rounded-full bg-brand-gradient px-6 py-3.5 text-text-md font-semibold text-grey-950 shadow-lg transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Enter
          </button>
        </form>

        <p className="mt-5 text-center text-text-sm text-grey-400">
          Don&apos;t have an account? Contact an admin for access.
        </p>
      </motion.div>
    </div>
  );
}
