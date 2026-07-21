"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Spread } from "@/shared";
import { SpreadCardView } from "./SpreadCardView";
import type { FanTransform } from "./animation/spread-motion";

/** Width assumed before the container is measured (keeps SSR/first paint stable). */
const FALLBACK_WIDTH = 820;
/** Horizontal center-to-center spacing as a fraction of card width (overlap). */
const OVERLAP = 0.5;
/** Edge card vertical drop as a fraction of card width (arc depth). */
const ARC_DROP = 0.52;
/** Total fan sweep in degrees, from the leftmost to the rightmost card. */
const ANGLE_TOTAL = 52;
// Low enough that 20 cards in a single row still fit a narrow phone without
// overflowing: on a ~360px viewport the width-fit math wants ~32px cards for
// a 20-card row (vs. ~63px for the old 10-per-row layout). The old 58px
// floor was tuned for that 10-per-row case — with all 20 in one row it
// forced cards wider than the fit calculation intended, pushing the fan's
// edges off both sides of the screen instead of shrinking to fit.
const MIN_CARD = 32;
/** Card size multiplier applied on top of the width-fit calculation. */
const SIZE_SCALE = 1.5;
// Raised along with SIZE_SCALE — otherwise on wide viewports the fit
// calculation already sits at the old ceiling, and scaling it up just gets
// clamped straight back down, silently cancelling the whole point of the
// multiplier.
const MAX_CARD = 132 * SIZE_SCALE;
/** Spread is split into this many stacked fanned arcs (rows). */
const ROWS = 1;
/** Vertical gap between rows, as a fraction of card height. */
const ROW_GAP = 0.16;

interface FannedSpreadProps {
  spread: Spread;
  reducedMotion?: boolean;
  onPick: (cardId: string) => void;
}

/**
 * Lays the daily spread out as a fanned arc (a hand of tarot cards). Card size
 * and arc scale to the measured container width so it stays responsive; each
 * card fans out from a central stack and lifts on hover.
 */
export function FannedSpread({ spread, reducedMotion, onPick }: FannedSpreadProps) {
  const ref = useRef<HTMLUListElement>(null);
  const [width, setWidth] = useState(0);
  // Tracked on the stable (non-transformed) <li>, not the card itself, so the
  // hover lift can't move the hit target out from under the pointer.
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // True only for the very first deal (stacked deck fanning out). The
  // "shown" transition's per-card delay (`index * stagger`) is meant to
  // stagger that one-time reveal — but "shown" is also the target every time
  // a card un-hovers or a reroll re-slots it, and re-triggering that same
  // index-based delay then means a high-index card can sit "floating" in its
  // hover-lifted pose for the better part of a second after the mouse has
  // already moved away, reading as a stuck/broken card. Gate the delay to
  // the true initial entrance only.
  const [hasDealt, setHasDealt] = useState(false);
  const staggerEntrance = !hasDealt;
  // Hover is ignored for a beat right after the very first deal. The
  // fan's center card ends up almost exactly where "Draw a Card" was —
  // the cursor is already resting there the instant the fan appears, and
  // real mice/trackpads report tiny involuntary movement even when "held
  // still" (hand tremor, OS pointer smoothing), which is enough to satisfy
  // genuine mousemove tracking below. Without this, the center card could
  // spontaneously pop into its hover pose right after drawing, with no
  // real user intent behind it, reading as a stuck/broken card.
  const [hoverEnabled, setHoverEnabled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    // Deliberately NOT set during render: the first commit must actually
    // paint (and let Framer start the staggered per-card transitions) with
    // staggerEntrance=true before this flips to false. Setting it
    // conditionally during render instead discards that first render before
    // its children ever mount — Framer never sees the staggered delay at
    // all, and every card animates in with delay 0, in lockstep.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (width > 0 && !hasDealt) setHasDealt(true);
  }, [width, hasDealt]);

  useEffect(() => {
    if (!hasDealt) return;
    const t = setTimeout(() => setHoverEnabled(true), 500);
    return () => clearTimeout(t);
  }, [hasDealt]);

  const count = spread.length;
  // Cards are dealt in row-major order: the first row's worth fills left to
  // right, then the next row starts. Each row is its own independent fanned
  // arc, sized as if it were the only row (so a 20-card spread's two rows of
  // 10 look identical to the old single 10-card fan, just stacked).
  const cardsPerRow = Math.max(1, Math.ceil(count / ROWS));
  const rowCount = count === 0 ? 0 : Math.ceil(count / cardsPerRow);

  const { cardW, cardH, stageHeight, geometry } = useMemo(() => {
    const w = width || FALLBACK_WIDTH;
    const fitDenom = (cardsPerRow - 1) * OVERLAP + 1.7;
    // Card size the way it would be with no gap-floor considerations at all —
    // fit-to-width at the default OVERLAP, then boosted by SIZE_SCALE.
    const aspirationalCardW = Math.max(MIN_CARD, Math.min(MAX_CARD, (w / fitDenom) * SIZE_SCALE));

    // At that aspirational size, how little overlap can we get away with and
    // still fit width `w`? With 20 cards at 1.5x size this comes out to
    // ~0.16 — visibly tighter than GAP_MIN, so cards squeeze edge-to-edge
    // with barely a sliver of neighbor showing. Force at least GAP_MIN of
    // spacing, and if the aspirational card size doesn't leave room for
    // that within `w`, shrink cards just enough to make room — fitting the
    // container stays a hard constraint, gap is the dial being turned up.
    const GAP_MIN = 0.4;
    const neededOverlapAtAspirationalSize =
      cardsPerRow > 1 ? (w / aspirationalCardW - 1.7) / (cardsPerRow - 1) : OVERLAP;
    const packedOverlap = Math.min(OVERLAP, Math.max(GAP_MIN, neededOverlapAtAspirationalSize));
    const cardW =
      packedOverlap > neededOverlapAtAspirationalSize && cardsPerRow > 1
        ? Math.max(MIN_CARD, w / ((cardsPerRow - 1) * packedOverlap + 1.7))
        : aspirationalCardW;
    const cardH = cardW * 1.5;
    const center = (cardsPerRow - 1) / 2;
    const step = cardsPerRow > 1 ? ANGLE_TOTAL / (cardsPerRow - 1) : 0;

    const edgeDrop = ARC_DROP * cardW;
    const hoverHeadroom = cardH * 0.34;
    const rowGap = cardH * ROW_GAP;
    // Distance between successive rows' own center-lines (offset=0 slot).
    const rowSpan = edgeDrop + cardH + rowGap;

    const geometry: FanTransform[] = Array.from({ length: count }, (_, i) => {
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;
      const offset = col - center;
      const norm = center === 0 ? 0 : offset / center;
      const rowBaseline = (row - (rowCount - 1) / 2) * rowSpan;
      return {
        x: offset * cardW * packedOverlap,
        y: norm * norm * ARC_DROP * cardW + rowBaseline, // parabola: edges dip down
        rotate: offset * step,
        lift: cardH * 0.34,
        // Column, not the flat spread index — the entrance stagger keys off
        // this so every row deals in parallel (each ~cardsPerRow * stagger
        // long) rather than row 2 waiting for all of row 1 to finish first.
        // With a 20-card spread that flat-index wait stretched past 1.5s,
        // long enough that a screenshot taken shortly after drawing would
        // catch row 2 mid-reveal with visible gaps.
        staggerIndex: col,
      };
    });

    const stageHeight = rowSpan * Math.max(0, rowCount - 1) + cardH + edgeDrop + hoverHeadroom + 24;
    return { cardW, cardH, stageHeight, geometry };
  }, [width, count, cardsPerRow, rowCount]);

  return (
    <ul
      ref={ref}
      className="relative w-full"
      style={{ height: stageHeight }}
      aria-label="Daily tarot spread"
      // Hover is derived fresh from each mousemove event (which card, if any,
      // is currently under the cursor) rather than accumulated from each
      // card's own paired enter/leave handlers. With two rows this close
      // together, a fast mouse path between cards in different rows can
      // graze several overlapping cards within one interpolated move — with
      // per-card state, an enter/leave pair could arrive out of order and
      // leave a card stuck "hovered" with no matching leave left to clear
      // it. Recomputing from the event target every time can't desync: it's
      // always exactly whatever the cursor is over right now.
      onMouseMove={(e) => {
        if (!hoverEnabled) return;
        const li = (e.target as HTMLElement).closest<HTMLElement>("li[data-idx]");
        setHoveredIndex(li ? Number(li.dataset.idx) : null);
      }}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {/*
       * Wait for the real measured width before laying out any card. The
       * <li> below carries its resting fan position as a plain (unanimated)
       * style, while the card inside animates into that same slot — if the
       * container width (and so the fan geometry) changed mid-animation
       * (e.g. jumping from FALLBACK_WIDTH to the real width right after
       * mount), the <li> would snap to its new slot instantly while the
       * card was still animating to the old one, leaving the hit-box and
       * the visible card out of sync. Rendering nothing until width is
       * known avoids that jump entirely.
       */}
      {width === 0
        ? null
        : spread.map((card, i) => {
            const fan = geometry[i];
            return (
              <li
                key={card.cardId}
                data-idx={i}
                className="absolute left-1/2 top-1/2"
                style={{
                  width: cardW,
                  marginLeft: -cardW / 2,
                  marginTop: -cardH / 2,
                  // Resting fan slot lives here (not on the animated card inside),
                  // so this element's hit-box always matches where the card
                  // actually renders — no phantom overlap with every other card's
                  // dead-center box, which is what made hovering/picking cards
                  // near the middle of the fan unreliable.
                  transform: `translate(${fan.x}px, ${fan.y}px)`,
                  zIndex: hoveredIndex === i ? 50 : undefined,
                }}
              >
                <SpreadCardView
                  index={i}
                  picked={card.picked}
                  rejected={card.rejected}
                  reducedMotion={reducedMotion}
                  fan={fan}
                  isHovered={hoveredIndex === i}
                  staggerEntrance={staggerEntrance}
                  onSelect={() => onPick(card.cardId)}
                />
              </li>
            );
          })}
    </ul>
  );
}
