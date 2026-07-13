"use client";

import { useState } from "react";
import type { AuthRequest } from "@/shared";

interface AuthPanelProps {
  error?: string | null;
  onSubmit: (mode: "login" | "register", creds: AuthRequest) => void;
}

/** Presentational login/register form. Parent owns auth logic. */
export function AuthPanel({ error, onSubmit }: AuthPanelProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(mode, { username, password });
        }}
        className="w-full max-w-sm rounded-2xl bg-grey-gradient p-8 ring-1 ring-white/8"
      >
        <h1 className="text-heading-lg font-bold text-grey-50">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-text-sm text-grey-400">Sign in to draw your daily tarot.</p>

        <label className="mt-6 block text-text-sm text-grey-300">
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="mt-1 w-full rounded-lg bg-grey-950/60 px-3 py-2 text-grey-50 ring-1 ring-white/16 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
          />
        </label>
        <label className="mt-4 block text-text-sm text-grey-300">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="mt-1 w-full rounded-lg bg-grey-950/60 px-3 py-2 text-grey-50 ring-1 ring-white/16 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
          />
        </label>

        {error ? <p className="mt-3 text-text-sm text-red-500">{error}</p> : null}

        <button
          type="submit"
          className="mt-6 w-full rounded-full bg-brand-gradient px-6 py-3 text-text-md font-semibold text-grey-950 transition-transform hover:scale-[1.02]"
        >
          {mode === "login" ? "Log in" : "Register"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-4 w-full text-text-sm text-aster-sky-300 hover:underline"
        >
          {mode === "login" ? "Need an account? Register" : "Have an account? Log in"}
        </button>
      </form>
    </div>
  );
}
