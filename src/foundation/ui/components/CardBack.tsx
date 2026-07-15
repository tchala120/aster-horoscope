import Image from "next/image";

/** The shared face-down tarot card artwork (as used by the daily-draw spread). */
export const CARD_BACK_SRC = "/cards/backside-card/backside_card.png";

interface CardBackProps {
  /** Corner rounding to match the card frame (e.g. "rounded-xl" / "rounded-2xl"). */
  rounded?: string;
}

/**
 * The face-down side of a tarot card. Fills its positioned parent and includes
 * `backface-visibility: hidden`, so it can be dropped straight in as a flip
 * card's back face. Matches the daily-draw spread's card back.
 */
export function CardBack({ rounded = "rounded-xl" }: CardBackProps) {
  return (
    <span
      aria-hidden
      className={`absolute inset-0 overflow-hidden ring-1 ring-white/12 ${rounded}`}
      style={{ backfaceVisibility: "hidden" }}
    >
      <Image src={CARD_BACK_SRC} alt="" fill className="object-cover" sizes="12rem" />
      <span
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.10), transparent 42%)" }}
      />
    </span>
  );
}
