"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function iconProps() {
  return {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    className: "shrink-0",
  } as const;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg {...iconProps()}>
        <path
          d="M12 2.7 3 10.2v10.6a1 1 0 0 0 1 1h5.2v-7h5.6v7H20a1 1 0 0 0 1-1V10.2Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    href: "/draw",
    label: "Ritual",
    icon: (
      <svg {...iconProps()}>
        <path
          d="M12 2.5l2.7 6 6.5.6-4.9 4.4 1.5 6.4L12 16.4l-5.8 3.5 1.5-6.4-4.9-4.4 6.5-.6Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    href: "/school",
    label: "Aster School",
    icon: (
      <svg {...iconProps()}>
        <path d="M12 3 2 8.2l10 5.2 10-5.2Z" fill="currentColor" />
        <path
          d="M6.5 11.6v3.9c0 1.7 2.6 3.3 5.5 3.3s5.5-1.6 5.5-3.3v-3.9L12 14.6Z"
          fill="currentColor"
        />
        <path d="M20.5 9v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "#mini-games",
    label: "Mini-Games",
    icon: (
      <svg {...iconProps()}>
        <path
          d="M6.8 6.5h10.4a4.4 4.4 0 0 1 4.3 5.3l-1 4.7a2.6 2.6 0 0 1-4.6 1L14.4 14.5H9.6l-1.5 2.8a2.6 2.6 0 0 1-4.6-1l-1-4.7a4.4 4.4 0 0 1 4.3-5Z"
          fill="currentColor"
        />
        <g fillOpacity="0.45" fill="var(--color-grey-950)">
          <rect x="7.6" y="9.6" width="1.7" height="4.3" rx="0.6" />
          <rect x="6" y="11.2" width="4.9" height="1.7" rx="0.6" />
          <circle cx="16.6" cy="10" r="1.1" />
          <circle cx="18.8" cy="12.3" r="1.1" />
        </g>
      </svg>
    ),
  },
  {
    href: "/school",
    label: "Community",
    icon: (
      <svg {...iconProps()}>
        <circle cx="16.3" cy="9.3" r="2.6" fill="currentColor" fillOpacity="0.55" />
        <path d="M11.4 20v-.9a5.6 5.6 0 0 1 9-1.9" fill="currentColor" fillOpacity="0.55" />
        <circle cx="9" cy="8.7" r="3.3" fill="currentColor" />
        <path
          d="M3.2 20.3v-1a5.8 5.8 0 0 1 5.8-5.8h0a5.8 5.8 0 0 1 5.8 5.8v1Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    href: "profile",
    label: "Profile",
    icon: (
      <svg {...iconProps()}>
        <circle cx="12" cy="8" r="4.2" fill="currentColor" />
        <path d="M4 20.6a8 8 0 0 1 16 0Z" fill="currentColor" />
      </svg>
    ),
  },
];

interface SidebarProps {
  activeHref: string;
  onProfileClick: () => void;
}

export function Sidebar({ activeHref, onProfileClick }: SidebarProps) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Hide sidebar" : "Show sidebar"}
        aria-expanded={open}
        className={`fixed top-9 z-50 hidden h-8 w-8 items-center justify-center rounded-full bg-grey-950/95 text-grey-300 backdrop-blur-xl transition-all duration-300 hover:text-grey-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400 lg:flex ${
          open ? "left-[17rem]" : "left-3"
        }`}
        style={{
          boxShadow: "0 0 0 1px rgba(255,90,138,0.5), 0 0 16px -4px rgba(255,90,138,0.55)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d={open ? "M12.5 5 7.5 10l5 5" : "M7.5 5l5 5-5 5"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <aside
        aria-hidden={!open}
        className={`sticky top-4 mb-4 hidden h-[calc(100vh-2rem)] shrink-0 flex-col overflow-hidden rounded-3xl bg-grey-950/95 backdrop-blur-xl transition-all duration-300 lg:flex ${
          open ? "ml-4 w-64 px-4 py-6 opacity-100" : "ml-0 w-0 px-0 py-6 opacity-0"
        }`}
        style={{
          boxShadow: open
            ? "0 0 0 1px rgba(255,90,138,0.5), 0 0 32px -10px rgba(255,90,138,0.55), 0 24px 60px -32px rgba(255,90,138,0.6)"
            : "none",
        }}
      >
        <Link href="/" className="relative -mx-2 mb-4 h-16 w-full shrink-0">
          <Image
            src="/landing-page/aster-playground-logo-crop.png"
            alt="Aster Playground"
            fill
            priority
            sizes="16rem"
            className="object-contain"
          />
        </Link>
        <div className="-mx-4 mb-2 h-px bg-white/8" />

        <nav className="mt-4 flex flex-1 flex-col gap-3">
          {NAV_ITEMS.map((item) => {
            const active = item.href === activeHref;
            if (item.label === "Profile") {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={onProfileClick}
                  className="flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-left text-text-lg font-semibold text-grey-300 transition-colors hover:bg-white/6 focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400"
                >
                  <span style={{ color: "rgb(178,152,255)" }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-text-lg font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-teal-400 ${
                  active
                    ? "border-aster-purple-400/60 bg-aster-purple-500/15 text-grey-50"
                    : "border-transparent text-grey-300 hover:bg-white/6"
                }`}
                style={active ? { boxShadow: "0 0 16px -2px rgba(124,77,255,0.55)" } : undefined}
              >
                <span style={{ color: active ? "var(--color-grey-50)" : "rgb(178,152,255)" }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className="flex items-center gap-3 rounded-2xl bg-grey-950/90 p-3 backdrop-blur-xl"
          style={{
            boxShadow:
              "0 0 0 1px rgba(255,90,138,0.5), 0 0 28px -8px rgba(255,90,138,0.55), 0 18px 40px -28px rgba(255,90,138,0.6)",
          }}
        >
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-heading-sm"
            style={{
              backgroundColor: "rgba(255,90,138,0.08)",
              color: "rgb(255,90,138)",
              border: "1.5px solid rgba(255,90,138,0.55)",
              boxShadow: "0 0 12px -2px rgba(255,90,138,0.5)",
            }}
          >
            ★
          </span>
          <p className="text-text-sm text-grey-300">
            Keep up the rituals, <span className="font-semibold text-grey-100">star player!</span>{" "}
            💗
          </p>
        </div>
      </aside>
    </>
  );
}
