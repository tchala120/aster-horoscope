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
const MIN_CARD = 58;
const MAX_CARD = 132;

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

  const count = spread.length;
  const { cardW, cardH, stageHeight, geometry } = useMemo(() => {
    const w = width || FALLBACK_WIDTH;
    const denom = (count - 1) * OVERLAP + 1.7;
    const cardW = Math.max(MIN_CARD, Math.min(MAX_CARD, w / denom));
    const cardH = cardW * 1.5;
    const center = (count - 1) / 2;
    const step = count > 1 ? ANGLE_TOTAL / (count - 1) : 0;

    const geometry: FanTransform[] = Array.from({ length: count }, (_, i) => {
      const offset = i - center;
      const norm = center === 0 ? 0 : offset / center;
      return {
        x: offset * cardW * OVERLAP,
        y: norm * norm * ARC_DROP * cardW, // parabola: edges dip down
        rotate: offset * step,
        lift: cardH * 0.34,
      };
    });

    const edgeDrop = ARC_DROP * cardW;
    const stageHeight = cardH + edgeDrop + cardH * 0.34 + 24;
    return { cardW, cardH, stageHeight, geometry };
  }, [width, count]);

  return (
    <ul
      ref={ref}
      className="relative w-full"
      style={{ height: stageHeight }}
      aria-label="Daily tarot spread"
    >
      {spread.map((card, i) => {
        const fan = geometry[i];
        return (
          <li
            key={card.cardId}
            className="absolute left-1/2 top-1/2"
            style={{ width: cardW, marginLeft: -cardW / 2, marginTop: -cardH / 2 }}
          >
            <SpreadCardView
              index={i}
              picked={card.picked}
              rejected={card.rejected}
              reducedMotion={reducedMotion}
              fan={fan}
              onSelect={() => onPick(card.cardId)}
            />
          </li>
        );
      })}
    </ul>
  );
}
