import Link from "next/link";

interface BackLinkProps {
  /** Where "back" goes. Defaults to the game hub. */
  href?: string;
  label?: string;
  /** "text" for an inline link, "chip" for a floating pill button. */
  variant?: "text" | "chip";
}

/** Back-navigation link with a ← chevron. Returns to the hub by default. */
export function BackLink({ href = "/", label = "Back", variant = "text" }: BackLinkProps) {
  const base =
    "inline-flex w-fit items-center gap-1.5 text-text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-aster-sky-400";
  const styles =
    variant === "chip"
      ? "rounded-full bg-grey-900/70 px-3.5 py-1.5 text-grey-100 ring-1 ring-white/8 backdrop-blur transition-colors hover:bg-grey-800/80"
      : "rounded text-aster-sky-300 transition-colors hover:text-aster-sky-200 hover:underline";

  return (
    <Link href={href} className={`${base} ${styles}`}>
      <svg aria-hidden width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0">
        <path
          d="M12 5 7 10l5 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </Link>
  );
}
